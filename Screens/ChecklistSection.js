import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Button, StyleSheet, Alert, SafeAreaView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { db } from '../firebase'; 
import { generatePDF } from '../Utils/pdfUtils'; // Import the generatePDF function
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { doc, getDoc } from "firebase/firestore";

const ChecklistSection = ({ navigation }) => {
  const [sectionStatus, setSectionStatus] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState([]);
  const [site, setSite] = useState(null);

  // Fetch site data and set the `site` state
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

      const checklistDocRef = doc(db, "permits_generated", key);
      const docSnap = await getDoc(checklistDocRef);

      if (docSnap.exists()) {
        const siteValue = docSnap.data().site;
        setSite(siteValue); // Set the site value
        console.log("Site value fetched:", siteValue);
      } else {
        console.log("Site data does not exist in Firestore.");
      }
    } catch (error) {
      console.error("Error fetching site data:", error);
    }
  };

  // Fetch sections from Firestore based on the site value
  const fetchSections = async () => {
    try {
      if (!site) {
        console.log("Site value not set. Unable to fetch sections.");
        return;
      }

      const docName = site === '1' ? "V47-sections" : "NM47-sections";
      const docRef = doc(db, "AllDatas", docName);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSections(data.sections);
        console.log(`Sections fetched from ${docName}:`, data.sections);
        return data.sections;
      } else {
        console.log(`No such document: ${docName}`);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };

  // Load section completion status from AsyncStorage
  const loadSectionStatus = async () => {
    const status = {};
    for (const section of sections) {
      const savedData = await AsyncStorage.getItem(section.title);
      status[section.title] = savedData ? true : false;
    }
    setSectionStatus(status);
  };

  // Fetch checklist data from Firestore and store it in AsyncStorage
  const fetchChecklistData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);

      let key;
      data.forEach((item) => {
        if (item[0] === "selectedPermitId") {
          key = item[1]; // The selected permit document ID
        }
      });

      const checklistDocRef = doc(db, "permits_generated", `${key}-checklistdata`);
      const docSnap = await getDoc(checklistDocRef);

      if (docSnap.exists()) {
        const checklistData = docSnap.data();

        // For each section, store the section data in AsyncStorage
        for (const sectionTitle in checklistData) {
          const sectionData = checklistData[sectionTitle];
          await AsyncStorage.setItem(sectionTitle, JSON.stringify(sectionData));
        }

        // After storing the data, load the section status
        loadSectionStatus();
      } else {
        console.log("Checklist data does not exist in Firestore.");
      }
    } catch (error) {
      console.error("Error fetching checklist data from Firestore:", error);
    }
  };

  // Initialize data on component load
  useEffect(() => {
    const initializeData = async () => {
      setRefreshing(true); // Start refreshing
      await fetchSiteData(); // Fetch site data
      await fetchSections(); // Fetch sections
      await fetchChecklistData(); // Fetch checklist data
      await loadSectionStatus(); // Load section status
      setRefreshing(false); // Stop refreshing once the data is loaded
    };

    initializeData();
  }, [site]);

  // Function to handle pull-to-refresh action
  const onRefresh = () => {
    setRefreshing(true);
    fetchSiteData().then(() => {
      fetchSections().then(() => {
        fetchChecklistData().then(() => {
          loadSectionStatus().then(() => {
            setRefreshing(false); // Stop the refreshing animation
          });
        });
      });
    });
  };

  const generateAndSharePDF = async () => {
    const html = await generatePDF(); // Generate the HTML with dynamic data
    if (html) {
      const { uri } = await Print.printToFileAsync({ html });
      console.log("File has been saved to:", uri);
      await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Image 
          source={require("../assets/lge_logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.container}>
        <Text style={styles.header}>Maintenance Checklist</Text>
        <FlatList
          data={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.sectionItem,
                { borderLeftColor: sectionStatus[item.title] ? "#66C05D" : "#FF4D4D" }
              ]}
              onPress={() =>
                navigation.navigate("ChecklistScreen", { section: item.title })
              }
            >
              <Text style={styles.sectionTitle}>{item.title}</Text>
              {sectionStatus[item.title] ? (
                <FontAwesome name="check-circle" size={24} color="#66C05D" />
              ) : (
                <FontAwesome name="exclamation-circle" size={24} color="#FF4D4D" />
              )}
            </TouchableOpacity>
          )}
          // Adding RefreshControl for pull-to-refresh functionality
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh} // Triggering the onRefresh function
              tintColor="#66C05D"
            />
          }
        />
        <Button
          title="Upload All Data"
          onPress={generateAndSharePDF} // Call the generateAndSharePDF function
          color="#66C05D"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fafaf5",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fafaf5",
  },
  logo: {
    width: 200,
    height: 50,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fafaf5",
  },
  header: {
    fontSize: 40,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0c7d0f",
    marginBottom: 20,
  },
  sectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    marginVertical: 8,
    backgroundColor: "#fafafa",
    borderRadius: 4,
    borderLeftWidth: 5,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#4d4d4d",
    fontWeight: "600",
  },
});

export default ChecklistSection;
