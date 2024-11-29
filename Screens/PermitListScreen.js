import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import CheckBox from 'expo-checkbox'; 
import Lgelogo from '../Lgelogo';

export default function PermitListScreen({ route, navigation }) {
  const { formData } = route.params || {}; // Get data from previous screen

  if (!formData) {
    return <Text>Loading or data unavailable...</Text>;
}

  const [checklist, setChecklist] = useState({
    safetyShoes: false,
    safetyBelt: false,
    windSpeed: false,
    helmet: false,
    lanyards: false,
    gloves: false,
    masks: false,
    goggles: false,
    earPlugs: false,
    arcFlashSuit: false,
  });

  const handleNext = () => {
    if (Object.values(checklist).some(item => item)) {
      // Merge formData from the previous screen with checklistData
      const combinedData = {
        ...route.params.formData, // Data from PermitToWorkScreen
        checklistData: checklist, // Data from PermitListScreen
      };
  
      navigation.navigate('PermitListScreen2', { formData: combinedData }); // Pass combinedData
    } else {
      alert('Please check all items');
    }
  };  

  const toggleCheckbox = (item) => {
    setChecklist({ ...checklist, [item]: !checklist[item] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Lgelogo />
      <Text style={styles.headerText}>Permit to Work</Text>
      <Text style={styles.subHeaderText}>The following will be used during the works and are in good working condition</Text>
      <View style={styles.checklistContainer}>
        {Object.keys(checklist).map((item, index) => (
          <View key={index} style={styles.checklistItem}>
            <Text style={styles.checklistText}>{item.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
            <CheckBox
              value={checklist[item]}
              onValueChange={() => toggleCheckbox(item)}
              color={checklist[item] ? '#66C05D' : '#A3D59B'}
              style={styles.checkbox}
            />
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F7F7',
      paddingHorizontal: 20,
      paddingTop: 80,
    },
    headerText: {
      fontSize: 35,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#66C05D',
      marginTop: 25,
      marginBottom: 15,
    },
    subHeaderText: {
      fontSize: 16,
      color: '#A3D59B',
      marginBottom: 20,
    },
    checklistContainer: {
      flex: 0.85,
    },
    checklistItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginLeft: 15,
      marginRight: 30,
      alignItems: 'center',
      marginBottom: 25,
    },
    checklistText: {
      fontSize: 18,
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
