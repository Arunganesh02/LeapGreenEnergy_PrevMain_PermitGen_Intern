import React, { useState, useEffect } from 'react';
import { View, Text, TextInput,FlatList, StyleSheet,KeyboardAvoidingView, Image, TouchableOpacity, ScrollView, Keyboard, Alert,Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, updateDoc, startAfter, orderBy, serverTimestamp } from 'firebase/firestore';
import Lgelogo from '../Lgelogo';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadSectionsComponent from '../uploadData';
export default function PermitScreen() {
  const [permitNumber, setPermitNumber] = useState('');
  const [verifiedPermit, setVerifiedPermit] = useState(null);
  const [ongoingPermits, setOngoingPermits] = useState([]);
  const [historyPermits, setHistoryPermits] = useState([]);
  const [lastVisiblePermit, setLastVisiblePermit] = useState(null);
  const [filteredPermits, setFilteredPermits] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadLimit, setLoadLimit] = useState(5); // Initial limit for history permits
  const [reason, setReason] = useState('');
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const navigation = useNavigation();



  const handlePermitNumberChange = (text) => {
    setPermitNumber(text);
    if (text) {
      const filtered = ongoingPermits.filter(permit => permit.id.includes(text));
      setFilteredPermits(filtered);
    } else {
      setFilteredPermits([]);
    }
  };

  const handlePermitSelect = async (permitId) => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      console.log(permitId);
      // Fetch data from Firestore based on the selected permit ID
      const permitDoc = doc(db, 'permits_generated', permitId.id);
      const permitSnapshot = await getDoc(permitDoc);
  
      if (permitSnapshot.exists()) {
        const permitData = permitSnapshot.data();
        // console.log(permitData)
        // Store the selected permit ID and its data in AsyncStorage
        await AsyncStorage.setItem('selectedPermitId', permitId.id);

        await AsyncStorage.setItem('selectedPermitData', JSON.stringify(permitData));
  
        Alert.alert('Permit Selected', `Permit ID: ${permitId.id} stored successfully!`);
  
        // Navigate to the next screen with the permit ID
        navigation.navigate('ChecklistSection', { permitNumber: permitId });
      } else {
        Alert.alert('Error', 'Selected permit does not exist in Firestore.');
      }
    } catch (error) {
      console.error('Error selecting permit:', error);
      Alert.alert('Error', 'An error occurred while selecting the permit.');
    }
  };



  // Fetch ongoing permits (status: 'Accepted')
  const fetchOngoingPermits = async () => {
    try {
      const permitsRef = collection(db, 'permits');
      const q = query(permitsRef, where('status', '==', 'Accepted'));

      const querySnapshot = await getDocs(q);

      const permitsList = [];
      querySnapshot.forEach(doc => {
        permitsList.push({ id: doc.id, ...doc.data() });
      });
      setOngoingPermits(permitsList);
    } catch (error) {
      console.error('Error fetching ongoing permits:', error);
    }
  };

  // Fetch history permits with dynamic pagination
  // Fetch all permits for the history section, sorted by update time

  const fetchHistoryPermits = async (nextBatch = false) => {
    try {
      let permitsQuery = query(
        collection(db, 'permits'),
        where('status', 'in', ['Pending', 'Closed', 'Cancelled', 'Rejected']),
        orderBy('updatedAt', 'desc'),  // Order by updatedAt
        limit(5)
      );

      if (nextBatch && lastVisiblePermit) {
        permitsQuery = query(permitsQuery, startAfter(lastVisiblePermit));
      }

      const querySnapshot = await getDocs(permitsQuery);
      const permits = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt || doc.data().updatedDate, // Use updatedDate if updatedAt is missing
      }));

      setHistoryPermits(prevPermits => [
        ...prevPermits.filter(permit => !permits.some(newPermit => newPermit.id === permit.id)),
        ...permits
      ]);
      setLastVisiblePermit(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error fetching history permits:', error);
    }
  };


  // Handle permit status update
  const updatePermitStatus = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Reason is required to proceed.');
      return;
    }

    try {
      const permitRef = doc(db, 'permits', selectedPermit);
      const updateData = {
        status: selectedAction,
        updatedAt: serverTimestamp(),
        reason,
      };

      if (selectedAction === 'Pending' || selectedAction === 'Closed') {
        updateData.updatedDate = new Date();  // Adding updatedDate in the case of 'Pending' or 'Closed'
      }

      await updateDoc(permitRef, updateData);
      Alert.alert('Success', `Permit ${selectedPermit} updated to ${selectedAction}`);

      // Update permits displayed on the screen
      setReason('');
      setReasonModalVisible(false);
      fetchOngoingPermits();
      fetchHistoryPermits();
    } catch (error) {
      console.error('Error updating permit status:', error);
    }
  };

  useEffect(() => {
    fetchOngoingPermits();
    fetchHistoryPermits();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Lgelogo />


      <View style={{ marginTop: 150 }} />
      
      <View style={{ width: '100%' }}>
        <TextInput
          placeholder="Enter Permit Number"
          style={styles.input}
          placeholderTextColor="#8c8c8c"
          value={permitNumber}
          onChangeText={handlePermitNumberChange}
        />
          {filteredPermits.length > 0 && (
          <View style={{maxHeight: 150}}>
          <FlatList
            data={filteredPermits}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handlePermitSelect(item)}>
                <Text style={styles.dropdownItem}>{item.id}</Text>
              </TouchableOpacity>
            )}
            style={styles.dropdown}
          />
          </View>
        )}
      </View>

      <Text style={styles.textCenter}>Can't find your permit?</Text>
      <TouchableOpacity style={styles.createPermitButton} onPress={() => navigation.navigate('PermitToWorkScreen')}>
        <Text style={styles.createPermitButtonText}>Create New Permit</Text>
      </TouchableOpacity>

      {/* Ongoing Permit Section */}
      <Text style={styles.sectionTitle}>On Going</Text>
      {ongoingPermits.length === 0 ? (
        <Text>No ongoing permits found.</Text>
      ) : (
        ongoingPermits.map((permit) => (
          <View key={permit.id} style={styles.permitContainer}>
            <Text style={styles.permitText}>{permit.id}</Text>
            <View style={styles.permitStatus}>
              <FontAwesome name="check-circle" size={20} color="green" />
              <Text style={styles.statusText}>Accepted</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.closePermitButton}
                onPress={() =>  {
                  setSelectedPermit(permit.id);
                  setSelectedAction('Closed');
                  setReasonModalVisible(true);
                }}
              >
                <FontAwesome name="times-circle" size={16} color="grey" />
                <Text style={styles.closePermitText}>Close permit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelPermitButton}
                onPress={() => {
                  setSelectedPermit(permit.id);
                  setSelectedAction('Cancelled');
                  setReasonModalVisible(true);
                }}
              >
                <FontAwesome name="times-circle" size={16} color="red" />
                <Text style={styles.cancelPermitText}>Cancel permit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* History Section */}
      <Text style={styles.sectionTitle}>History:</Text>
      {historyPermits.length === 0 ? (
        <Text>No history permits found.</Text>
      ) : (
        historyPermits.map((permit) => (
          <View key={permit.id} style={styles.historyItem}>
            <Text style={styles.historyText}>{permit.id}</Text>
            <FontAwesome
              name={
                permit.status === 'Accepted'
                  ? 'check-circle'
                  : 'times-circle'
              }
              size={20}
              color={
                permit.status === 'Accepted' ? 'green' :
                permit.status === 'Rejected' ? 'red' :
                permit.status === 'Pending' ? 'orange' : 'gray'
              }
            />
            <Text style={styles.statusText}>{permit.status}</Text>
            {['Closed', 'Cancelled'].includes(permit.status) && permit.reason && (
              <TouchableOpacity
                onPress={() => Alert.alert('Reason', permit.reason)}
              >
                <Text style={styles.reasonText}>Reason</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <TouchableOpacity
        onPress={() => {
          if (!loadingMore) {
            setLoadingMore(true);
            fetchHistoryPermits(true).finally(() => setLoadingMore(false));
          }
        }}
      >
        <Text style={styles.viewMoreText}>View More...</Text>
      </TouchableOpacity>
      <Modal visible={reasonModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Reason</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason here..."
              value={reason}
              onChangeText={setReason}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={updatePermitStatus}>
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setReasonModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  input: {
    height: 50,
    borderColor: '#00A86B',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
    color: '#000000',
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 5,
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownText: {
    fontSize: 14,
  },
  textCenter: {
    textAlign: 'left',
    marginBottom: 10,
    color: '#8c8c8c',
  },
  createPermitButton: {
    backgroundColor: '#2E8B57',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  createPermitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  permitContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginVertical: 10,
    padding: 15,
    elevation: 2,
  },
  permitText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  permitStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  closePermitButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closePermitText: {
    marginLeft: 5,
  },
  cancelPermitButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelPermitText: {
    marginLeft: 5,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  historyText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 9,
  },
  viewMoreText: {
    color: '#00A86B',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  reasonText: {
    backgroundColor: '#007BFF', // Blue background for the button
    color: '#fff', // White text color
    paddingVertical: 8, // Vertical padding for the button
    paddingHorizontal: 15, // Horizontal padding for the button
    borderRadius: 5, // Rounded corners for the button
    marginLeft: 15, // Space to the left for alignment
    fontWeight: 'bold', // Bold text for visibility
    fontSize: 14, // Font size for better readability
    textAlign: 'center', // Center text inside the button
    overflow: 'hidden', // Ensure content fits within the button
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginBottom: 20,
    textAlignVertical: 'top',
    height: 80,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#28a745', // Green button background
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    backgroundColor: '#dc3545', // Red button background
  },
});