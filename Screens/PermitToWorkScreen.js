import React, { useState } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Lgelogo from '../Lgelogo';
import { Picker } from '@react-native-picker/picker';

export default function PermitToWorkScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    numberOfPersons: '',
    descriptionOfWork: '',
    site: '',
    model: '',
    location: '',
    workArea: '',
    windSpeed: '',
  });

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleNext = () => {
    if (Object.values(form).every((value) => value.trim())) {
      navigation.navigate('PermitListScreen', { formData: form });
    } else {
      Alert.alert('Error', 'Please fill in all fields before proceeding.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100} // Adjust this value for iOS to avoid overlapping
      >
        {/* Dismiss keyboard on tap outside */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Logo */}
            <Lgelogo />

            {/* Title */}
            <Text style={styles.titleText}>Permit to Work</Text>

            {/* Input Fields */}
            <TextInput
              placeholder="Name"
              placeholderTextColor="#A3D59B"
              style={styles.input}
              value={form.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />
            <TextInput
              placeholder="No. of Persons"
              placeholderTextColor="#A3D59B"
              style={styles.input}
              value={form.numberOfPersons}
              onChangeText={(text) => handleInputChange('numberOfPersons', text)}
            />
            <TextInput
              placeholder="Description of Work"
              placeholderTextColor="#A3D59B"
              style={styles.input}
              value={form.descriptionOfWork}
              onChangeText={(text) => handleInputChange('descriptionOfWork', text)}
            />

            {/* Dropdown for Site */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.label}>Site</Text>
              <Picker
                selectedValue={form.site}
                onValueChange={(value) => handleInputChange('site', value)}
                style={styles.picker}
                dropdownIconColor="#66C05D"
              >
                <Picker.Item label="Select Site" value="" />
                <Picker.Item label="V47" value="1" />
                <Picker.Item label="NM48" value="2" />
              </Picker>
            </View>

            {/* Dropdown for Model */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.label}>Model</Text>
              <Picker
                selectedValue={form.model}
                onValueChange={(value) => handleInputChange('model', value)}
                style={styles.picker}
                dropdownIconColor="#66C05D"
              >
                <Picker.Item label="Select Model" value="" />
                <Picker.Item label="1" value="V47" />
                <Picker.Item label="2" value="NM48" />
              </Picker>
            </View>

            <TextInput
              placeholder="Location"
              placeholderTextColor="#A3D59B"
              style={styles.input}
              value={form.location}
              onChangeText={(text) => handleInputChange('location', text)}
            />
            <TextInput
              placeholder="Work Area"
              placeholderTextColor="#A3D59B"
              style={styles.input}
              value={form.workArea}
              onChangeText={(text) => handleInputChange('workArea', text)}
            />
            <TextInput
              placeholder="Wind Speed"
              placeholderTextColor="#A3D59B"
              style={styles.input}
              value={form.windSpeed}
              onChangeText={(text) => handleInputChange('windSpeed', text)}
            />

            {/* Next Button */}
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  titleText: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#66C05D',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 80,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#A3D59B',
    fontSize: 14,
    color: '#000',
    marginBottom: 20,
    paddingVertical: 1,
  },
  dropdownContainer: {
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#A3D59B',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#66C05D',
    marginBottom: 5,
    marginLeft: 10,
    marginTop: 10,
  },
  picker: {
    height: 60,
    color: '#000',
  },
  button: {
    backgroundColor: '#66C05D',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
