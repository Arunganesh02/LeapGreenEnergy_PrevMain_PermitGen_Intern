import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase'; // Ensure the correct path
import { collection, addDoc, serverTimestamp, setDoc,getDoc, doc, getDocs,query,where,updateDoc,runTransaction} from 'firebase/firestore';

export default function VerifyTeamScreen({ route, navigation }) {
  const { formData, checklistData, checklist } = route.params || {};
  const [engineers, setEngineers] = useState([
    { name: '', email: '', verificationCode: '', isVerified: false, enteredCode: '', showCodeInput: false },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [generatedPermitNumber, setGeneratedPermitNumber] = useState(null);

  const addEngineer = () => {
    setEngineers([
      ...engineers,
      { name: '', email: '', verificationCode: '', isVerified: false, enteredCode: '', showCodeInput: false },
    ]);
  };

  const handleInputChange = (index, name, value) => {
    const newEngineers = [...engineers];
    newEngineers[index][name] = value;
    setEngineers(newEngineers);
  };

  const sendVerificationEmail = async (index) => {
    const engineer = engineers[index];
    const { name, email } = engineer;

    if (!name || !email) {
      Alert.alert('Error', 'Please enter both name and email.');
      return;
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      // Send verification request to the backend
      const response = await fetch('http://172.28.32.1:3000/sendVerificationEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }), // Sending email and name to backend
      });

      const data = await response.json();
      console.log('Response Data:', data);

      // Check if the backend returned success
      if (data.success && data.verificationCode) {
        const verificationCode = data.verificationCode;

        console.log('Generated Verification Code:', verificationCode); // Log to ensure the code is received

        // Update the engineer's verification code and visibility of code input in state
        const updatedEngineers = [...engineers];
        updatedEngineers[index].verificationCode = verificationCode;
        updatedEngineers[index].showCodeInput = true; // Show code input 
        setEngineers(updatedEngineers);

        // Store the verification code and other details in Firestore
        const engineerRef = doc(collection(db, 'permitlist'));
        await setDoc(engineerRef, {
          name,
          email,
          verificationCode,
          isVerified: false,
          timestamp: serverTimestamp(),
        });

        Alert.alert('Verification Email Sent', `A verification code has been sent to ${email}.`);
      } else {
        Alert.alert('Error', data.message || 'Failed to generate verification code.');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to send verification email: ${error.message}`);
      console.error('Error sending verification email:', error);
    }
  };

  const verifyCode = async (index) => {
    const engineer = engineers[index];
    const { verificationCode, enteredCode, email } = engineer;
  
    if (!enteredCode) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }
  
    if (enteredCode === verificationCode) {
      try {
        // Query the permitlist collection for the document with the matching email
        const q = query(collection(db, 'permitlist'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref; // Assuming email is unique
  
          // Update the verification status
          await updateDoc(docRef, { isVerified: true });
  
          // Update state
          const updatedEngineers = [...engineers];
          updatedEngineers[index].isVerified = true;
          setEngineers(updatedEngineers);
          Alert.alert('Success', 'Email verified successfully!');
        } else {
          Alert.alert('Error', 'Verification code not found.');
        }
      } catch (error) {
        Alert.alert('Error', `Failed to verify code: ${error.message}`);
        console.error('Error verifying code:', error);
      }
    } else {
      Alert.alert('Error', 'Incorrect verification code.');
    }
  };

  const handleSubmit = async () => {
    // Check if all engineers are verified
    const allVerified = engineers.every((engineer) => engineer.isVerified);
    // if (!allVerified) {
    //   Alert.alert('Verification Incomplete', 'Please verify all engineers before submitting.');
    //   return;
    // }
  
    try {
      const engineersData = engineers.map((engineer) => ({
        name: engineer.name,
        email: engineer.email,
        isVerified: engineer.isVerified,
      }));
  
      // Reference to the permit_counter collection and last_permit_number document
      const permitNumberRef = doc(db, 'permit_counter', 'last_permit_number');
  
      // Use Firestore transaction to get and increment the last permit number
      const newPermitNumber = await runTransaction(db, async (transaction) => {
        const permitDoc = await transaction.get(permitNumberRef);
  
        if (!permitDoc.exists()) {
          // Initialize with the first permit number if it doesn't exist
          transaction.set(permitNumberRef, { lastNumber: 100 });
          return 100;
        }
  
        const lastPermitNumber = permitDoc.data().lastNumber || 100;
        const incrementedPermitNumber = lastPermitNumber + 1;
        transaction.update(permitNumberRef, { lastNumber: incrementedPermitNumber });
  
        return incrementedPermitNumber;
      });
  
      const year = new Date().getFullYear();
      const site = formData?.site || 'UnknownSite';
      const model = formData?.model || 'UnknownModel';
      const permitNumber = `${year}-${site}-${model}-${newPermitNumber}`;
  
      setGeneratedPermitNumber(permitNumber);
  
      const dataToSave = {
        ...formData,
        ...checklistData,
        ...checklist,
        engineers: engineersData,
        randomNumber: newPermitNumber,
        timestamp: serverTimestamp(),
      };
  
      // Save to 'permits_generated' collection
      await setDoc(doc(db, 'permits_generated', permitNumber), dataToSave);
  
      // Save to 'permits' collection with status 'Pending'
      await setDoc(doc(db, 'permits', permitNumber), {
        updatedAt: serverTimestamp(), // Set updatedAt when creating
        updatedDate: new Date(),
        status: 'Pending'  // Adding the 'Pending' status here
      });
  
      // Display success modal
      setIsModalVisible(true);
    } catch (error) {
      Alert.alert('Error', `There was an issue submitting the form: ${error.message}`);
      console.error('Error submitting form:', error);
    }
  };
  
  const handleCloseModal = () => {
    setIsModalVisible(false);
    navigation.navigate('PermitAuthenticateScreen');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Verify Team</Text>
      {engineers.map((engineer, index) => (
        <View key={index} style={styles.engineerContainer}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#A0A0A0"
            value={engineer.name}
            onChangeText={(text) => handleInputChange(index, 'name', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={engineer.email}
            onChangeText={(text) => handleInputChange(index, 'email', text)}
          />
          {!engineer.isVerified ? (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => sendVerificationEmail(index)}
            >
              <Text style={styles.verifyText}>Send Verification Email</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.verifiedContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#3ba745" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}

          {/* Verification Code Input */}
          {engineer.showCodeInput && (
            <View style={styles.verificationContainer}>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter Verification Code"
                placeholderTextColor="#A0A0A0"
                keyboardType="number-pad"
                value={engineer.enteredCode}
                onChangeText={(text) => handleInputChange(index, 'enteredCode', text)}
              />
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => verifyCode(index)}
              >
                <Text style={styles.verifyText}>Verify Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addEngineer}>
        <Ionicons name="add-circle-outline" size={32} color="#3ba745" />
        <Text style={styles.addText}>Add Site Engineer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#66C05D" />
          <Text style={styles.modalText}>
            Your Team has been successfully verified!
          </Text>
          {/* Display generated permit number dynamically */}
          <Text style={styles.modalPermitText}>
            Permit Number: {generatedPermitNumber} {/* Replace with state value */}
          </Text>
          <Text style={styles.modalStatusText}>Status: Pending Approval</Text>
          <TouchableOpacity style={styles.okButton} onPress={handleCloseModal}>
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#F4F8EC',
  },
  header: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3ba745',
    textAlign: 'center',
    marginBottom: 40,
  },
  engineerContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 10,
    elevation: 2, // For Android
  },
  input: {
    borderWidth: 1,
    borderColor: '#A0A0A0',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  verifyButton: {
    backgroundColor: '#3ba745',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  verifyText: {
    color: '#FFF',
    fontSize: 16,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#A0A0A0',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  addText: {
    color: '#3ba745',
    fontSize: 18,
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#3ba745',
    paddingVertical: 15,
    borderRadius: 5,
    marginBottom: 30,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  verifiedText: {
    color: '#3ba745',
    marginLeft: 5,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  modalPermitText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  modalStatusText: {
    fontSize: 14,
    textAlign: 'center',
    color: 'gray',
    marginBottom: 20,
  },
  okButton: {
    padding: 10,
    backgroundColor: '#66C05D',
    borderRadius: 5,
  },
  okButtonText: {
    color: '#FFF',
    textAlign: 'center',
  },
});
