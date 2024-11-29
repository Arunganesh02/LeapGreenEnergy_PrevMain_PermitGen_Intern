import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, Button, FlatList, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../firebase'; // import your firebase config
import { doc, getDoc, setDoc } from "firebase/firestore"; // Firestore imports

const ChecklistScreen = ({ route, navigation }) => {
  const { section } = route.params;
  const [checklistData, setChecklistData] = useState([]);
  const [site, setSite] = useState(null);

  // Fetch site data and update AsyncStorage when data changes
  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const data = await AsyncStorage.multiGet(keys);

        let key;
        data.forEach((item) => {
          if (item[0] === "selectedPermitId") {
            key = item[1]; // The selected permit document ID
          }
        });

        console.log(key);
        const docRef = doc(db, "permits_generated", key); // Use the correct document ID
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const siteValue = docSnap.data().site;
          setSite(siteValue); // Set the site value

          // Replace the site data in AsyncStorage if it exists
          await AsyncStorage.setItem("siteData", JSON.stringify(siteValue)); // Replaces existing data
        }
      } catch (error) {
        console.error('Error fetching site data: ', error);
      }
    };

    fetchSiteData();
  }, []);

  // Load the checklist data based on site value and section
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Check if section data is already saved in Firestore
        const keys = await AsyncStorage.getAllKeys();
        const data = await AsyncStorage.multiGet(keys);

        let key;
        data.forEach((item) => {
          if (item[0] === "selectedPermitId") {
            key = item[1]; // The selected permit document ID
          }
        });

        const docRef = doc(db, "permits_generated", `${key}-checklistdata`); // Use the section-specific document ID
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const sectionData = docSnap.data()[section];

          // Only set checklistData if section data exists in Firestore
          if (sectionData && sectionData.length > 0) {
            setChecklistData(sectionData);
          } else {
            // No data in Firestore, you can show a message or load default data
            console.log("No data available for this section in Firestore.");
            // Optionally, load default data based on site or show an alert
            if (site !== null) {
              console.log(site)
              const checklistPath = site === '1' ? require('../Datas/checklists.json') : require('../Datas/checklist2.json');
              const defaultData = checklistPath.sections[section] || [];

              // Set the default status as 'Not OK' if not already set
              const updatedData = defaultData.map(item => ({
                ...item,
                status: item.status || 'Not OK', // Set default to 'Not OK'
              }));

              setChecklistData(updatedData);
            }
          }
        } else {
          // No document found for this section in Firestore
          console.log("No checklist data document found in Firestore.");
          // Optionally, load default data based on site
          if (site !== null) {
            const checklistPath = site === '1' ? require('../Datas/checklists.json') : require('../Datas/checklist2.json');
            const defaultData = checklistPath.sections[section] || [];

            // Set the default status as 'Not OK' if not already set
            const updatedData = defaultData.map(item => ({
              ...item,
              status: item.status || 'Not OK', // Set default to 'Not OK'
            }));

            setChecklistData(updatedData);
          }
        }
      } catch (error) {
        console.error('Error loading data from Firestore:', error);
      }
    };

    loadSavedData(); // Call the function to load data when the component mounts or section changes
  }, [section, site]);

  const handleInputChange = (field, value, id) => {
    const updatedChecklist = checklistData.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setChecklistData(updatedChecklist);
  };

  const handleStatusChange = (value, id) => {
    const updatedChecklist = checklistData.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: value,
        };
      }
      return item;
    });
    setChecklistData(updatedChecklist);
  };

  const handlePickImage = async (id) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing:false, // Enables cropping
      aspect: [1, 1], // Crop aspect ratio
      quality: 0.5, // Compress the image
    });
    if (!result.cancelled) {
      const updatedChecklist = checklistData.map(item => {
        if (item.id === id) {
          return { ...item, imageUri: result.assets[0].uri }; // Save the cropped URI
        }
        return item;
      });

      // Update state
      setChecklistData(updatedChecklist);
      console.log(updatedChecklist)
      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem(section, JSON.stringify(updatedChecklist));
        Alert.alert('Success', 'Image has been uploaded and added successfully!');
      } catch (error) {
        console.error('Error saving image data to AsyncStorage:', error);
        Alert.alert('Error', 'Failed to save the image. Please try again.');
      }
    } else {
      Alert.alert('Cancelled', 'Image selection was cancelled.');
    }
  };

  const validateAndSaveSection = async () => {
    // Validation: Ensure the status is filled for all items
    const isValid = checklistData.every(item => item.status && item.status.trim() !== '');

    if (!isValid) {
      Alert.alert('Validation Error', 'Please select the status for all checklist items.');
      return;
    }

    try {
      // Save the checklist data to AsyncStorage
      await AsyncStorage.setItem(section, JSON.stringify(checklistData));
      Alert.alert('Success', 'Section data saved successfully!');

      // Fetch the selected permit document ID
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);

      let key;
      data.forEach((item) => {
        if (item[0] === 'selectedPermitId') {
          key = item[1]; // The selected permit document ID
        }
      });
      console.log(key);
      // Fetch the document reference for Firestore using the key
      const checklistDocRef = doc(db, 'permits_generated', `${key}-checklistdata`);

      // Create the new data to append
      const newData = {
        [section]: checklistData, // Store the checklist data under the section name as a key
      };

      // Check if the document exists
      const docSnap = await getDoc(checklistDocRef);
      if (docSnap.exists()) {
        // If the document exists, merge the data
        await setDoc(checklistDocRef, newData, { merge: true });
      } else {
        // If the document doesn't exist, create a new document
        await setDoc(checklistDocRef, newData);
      }

      // Navigate back to the ChecklistSection screen
      navigation.navigate('ChecklistSection');
    } catch (error) {
      console.error('Error saving section data:', error);
      Alert.alert('Error', 'Failed to save the section data. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Image 
          source={require('../assets/lge_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.container}>
        <Text style={styles.header}>{section}</Text>
        <FlatList
          data={checklistData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.checklistItem}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{item.id + '. ' + item.title}</Text>
                <Switch
                  value={item.status === 'OK'}
                  onValueChange={(value) => handleStatusChange(value ? 'OK' : 'Not OK', item.id)}
                  trackColor={{ false: '#d9534f', true: '#5cb85c' }}
                  thumbColor="#fff"
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Remarks"
                placeholderTextColor="#a5daa6"
                value={item.remarks}
                onChangeText={(text) => handleInputChange('remarks', text, item.id)}
              />
              <TextInput
                style={styles.input}
                placeholder="Updated Remarks"
                placeholderTextColor="#a5daa6"
                value={item.updatedRemarks}
                onChangeText={(text) => handleInputChange('updatedRemarks', text, item.id)}
              />
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.imagePreview} />
              ) : (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => handlePickImage(item.id)}
                >
                  <Text style={styles.addImageText}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
        <Button title="Save" color="#28a745" onPress={validateAndSaveSection} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafaf5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fafaf5',
  },
  logo: {
    width: 200,
    height: 50,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fafaf5',
  },
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0c7d0f',
    marginBottom: 20,
  },
  checklistItem: {
    backgroundColor: '#fafafa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#555',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  itemTitle: {
    fontSize: 20,
    flex: 1,
    color: '#54a855',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#a5daa6',
    borderBottomWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    color: '#333',
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 5,
  },
  addImageButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#28a745',
    borderRadius: 5,
    alignItems: 'center',
  },
  addImageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChecklistScreen;
