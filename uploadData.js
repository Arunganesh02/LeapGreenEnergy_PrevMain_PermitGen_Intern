import React from "react";
import { Button, View, StyleSheet, Alert } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase"; // Ensure the Firebase configuration is correctly imported

const UploadSectionsComponent = () => {
  // The data to upload
  const sectionsData = [
    { id: '1', title: 'General Rules at Service Check' },
    { id: '2', title: 'Safety Rules' },
    { id: '3', title: 'Fall Protection System' },
    { id: '4', title: 'Anchor Points' },
    { id: '5', title: 'Tower' },
    { id: '6', title: 'Braking System' },
    { id: '7', title: 'Coupling' },
    { id: '8', title: 'Gear box' },
    { id: '9', title: 'Main Shaft & Bearing Housing' },
    { id: '10', title: 'Blades – Hydraulic- Hub' },
    { id: '11', title: 'Generator' },
    { id: '12', title: 'Water Cooling System' },
    { id: '13', title: 'Yaw System' },
    { id: '14', title: 'Nacelle Check Points' },
    { id: '15', title: 'Temperature Reading' },
    { id: '16', title: 'Safety Items' },
    { id: '17', title: 'Bottom Panel' },
    { id: '18', title: 'Capacitor Bank' },
    { id: '19', title: 'Capacitor Bank Test' },
    { id: '20', title: 'HT Yard maintenance / Transformer' },
    { id: '21', title: 'Update History of Component Replacement' },
    { id: '22', title: 'Additional Points' }
  ];

  // Function to upload the data to Firestore
  const uploadSectionsToFirestore = async () => {
    try {
      // Reference to the document in the AllDatas collection
      const docRef = doc(db, "AllDatas", "NM47-sections");

      // Upload the data under the key "sections"
      await setDoc(docRef, { sections: sectionsData });

      Alert.alert("Success", "Sections data uploaded successfully!");
    } catch (error) {
      console.error("Error uploading sections data: ", error);
      Alert.alert("Error", "Failed to upload sections data.");
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Upload Sections" onPress={uploadSectionsToFirestore} color="#28a745" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
});

export default UploadSectionsComponent;
