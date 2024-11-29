import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import Lgelogo from '../Lgelogo';

export default function LoginEmployeeScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Function to handle sending verification email
  const handleSendVerificationEmail = async () => {
    setIsLoading(true);

    if (email.trim() === '') {
      Alert.alert('Error', 'Please enter your email.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://172.28.32.1:3000/sendVerificationEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }), // Sending email to backend
      });
      console.log(email);

      const data = await response.json();

      if (data.success) {
        Alert.alert('Verification Email Sent', 'Please check your email for the verification code.');
        setShowCodeInput(true); // Show input for verification code
        setGeneratedCode(data.verificationCode); // Store the code received from backend
      } else {
        Alert.alert('Error', data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to send verification email: ${error.message}`);
      console.error('Error sending verification email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle verification of the code
  const handleVerifyCode = () => {
    if (verificationCode === generatedCode) {
      Alert.alert('Success', 'Email verified successfully!');
      navigation.navigate('PermitAuthenticateScreen'); // Navigate to PermitAuthenticateScreen
    } else {
      Alert.alert('Error', 'Incorrect verification code.');
    }
  };

  // Combined handler for both sending email and verifying code
  const handleButtonPress = () => {
    navigation.navigate('PermitAuthenticateScreen');
    // if (showCodeInput) {
    //   navigation.navigate('PermitAuthenticateScreen');
    //   // handleVerifyCode(); // If code input is visible, handle verification
    // } else {
    //   handleSendVerificationEmail(); // Otherwise, send verification email
    // }
  };

  return (
    <View style={styles.container}>
      <Lgelogo />

      {/* Center Image */}
      <Image
        source={require('../assets/lge.png')}
        style={styles.centerImage}
      />

      {/* Welcome Text */}
      <Text style={styles.welcomeText}>Welcome!</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#7F7F7F"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!showCodeInput} // Disable email input after sending email
      />

      {/* Verification Code Input (shown after email is sent) */}
      {showCodeInput && (
        <TextInput
          style={styles.input}
          placeholder="Enter Verification Code"
          placeholderTextColor="#7F7F7F"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
        />
      )}

      {/* Single Button for Sending Email and Verifying Code */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleButtonPress}
        disabled={isLoading}
      >
        <Text style={styles.loginButtonText}>
          {isLoading
            ? 'Processing...'
            : showCodeInput
            ? 'Verify Code' // Change text based on the current state
            : 'Send Verification Email'}
        </Text>
      </TouchableOpacity>

      {/* Log in as Manager Text */}
      <TouchableOpacity onPress={() => navigation.navigate('LoginManagerScreen')}>
        <Text style={styles.managerText}>Log in as Manager</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  centerImage: {
    width: 400,
    height: 250,
    alignSelf: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00A000',
    textAlign: 'left',
    width: '100%',
    marginBottom: 1,
  },
  input: {
    height: 50,
    borderColor: '#00A000',
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 20,
    paddingHorizontal: 10,
    width: '100%',
    color: '#000000',
  },
  loginButton: {
    backgroundColor: '#00A000',
    paddingVertical: 15,
    borderRadius: 5,
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  managerText: {
    color: '#00A000',
    textAlign: 'center',
    marginTop: 30, // Adjust to have space between button and the manager text
    textDecorationLine: 'underline',
  },
});
