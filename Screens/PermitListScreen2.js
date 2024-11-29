import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, StyleSheet, View, Alert } from 'react-native';
import CheckBox from 'expo-checkbox';
import { db } from '../firebase'; // Import Firebase configuration
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore methods
import Lgelogo from '../Lgelogo';

export default function PermitListScreen2({ route, navigation }) {
  const { formData, checklistData } = route.params; // Get the formData and checklistData from the route parameters

  const [checklist, setChecklist] = useState({
    electricalSupply: false,
    rotorLock: false,
    htYardSupply: false,
    barricades: false,
    signage: false,
    loto: false,
    weatherWind: false,
    rainLightning: false,
    row: false,
  });

  const toggleCheckbox = (item) => {
    setChecklist({ ...checklist, [item]: !checklist[item] });
  };

  const handleSubmit = async () => {
    try {
      const checklistRef = collection(db, 'permitlist'); 
  
      await addDoc(checklistRef, {
        ...formData, // Spread the form data from PermitToWorkScreen
        ...checklistData, // Spread the checklist data from PermitListScreen
        ...checklist, // Spread the checklist data from PermitListScreen2
        timestamp: serverTimestamp(),
      });
  
      // Pass the data to VerifyTeamScreen
      navigation.navigate('VerifyTeamScreen', {
        formData,           // Pass the form data
        checklistData,      // Pass the checklist data
        checklist,          // Pass the current checklist data
      });
    } catch (error) {
      Alert.alert('Error', 'There was an issue submitting the form: ' + error.message);
    }
  };
  
  

  return (
    <SafeAreaView style={styles.container}>
      <Lgelogo />

      <Text style={styles.headerText}>Permit to Work</Text>

      {/* Section 1 */}
      <Text style={styles.sectionTitle}>
        The following services have been isolated for the duration of the works:
      </Text>
      <View style={styles.checklistContainer}>
        {['Electrical Supply', 'Rotor Lock for Hub', 'HT Yard supply'].map((item, index) => (
          <View key={index} style={styles.checklistItem}>
            <Text style={styles.checklistText}>{item}</Text>
            <CheckBox
              value={checklist[item.toLowerCase().replace(/ /g, '')]}
              onValueChange={() => toggleCheckbox(item.toLowerCase().replace(/ /g, ''))}
              color={checklist[item.toLowerCase().replace(/ /g, '')] ? '#66C05D' : undefined}
              style={styles.checkbox}
            />
          </View>
        ))}
      </View>

      {/* Section 2 */}
      <Text style={styles.sectionTitle}>
        The following control measures have been implemented for the duration of the works:
      </Text>
      <View style={styles.checklistContainer}>
        {['Barricades', 'Signage', 'LOTO'].map((item, index) => (
          <View key={index} style={styles.checklistItem}>
            <Text style={styles.checklistText}>{item}</Text>
            <CheckBox
              value={checklist[item.toLowerCase()]}
              onValueChange={() => toggleCheckbox(item.toLowerCase())}
              color={checklist[item.toLowerCase()] ? '#66C05D' : undefined}
              style={styles.checkbox}
            />
          </View>
        ))}
      </View>

      {/* Section 3 */}
      <Text style={styles.sectionTitle}>
        The following control measures have been implemented for the duration of the works:
      </Text>
      <View style={styles.checklistContainer}>
        {['Weather/Wind', 'Rain/Lightning', 'ROW'].map((item, index) => (
          <View key={index} style={styles.checklistItem}>
            <Text style={styles.checklistText}>{item}</Text>
            <CheckBox
              value={checklist[item.toLowerCase().replace(/[/]/g, '').replace(/ /g, '')]}
              onValueChange={() => toggleCheckbox(item.toLowerCase().replace(/[/]/g, '').replace(/ /g, ''))}
              color={checklist[item.toLowerCase().replace(/[/]/g, '').replace(/ /g, '')] ? '#66C05D' : undefined}
              style={styles.checkbox}
            />
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerText: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#66C05D',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#A3D59B',
    marginBottom: 10,
  },
  checklistContainer: {
    marginBottom: 20,
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  checklistText: {
    fontSize: 16,
    color: '#66C05D',
  },
  checkbox: {
    width: 20,
    height: 20,
  },
  button: {
    backgroundColor: '#66C05D',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
