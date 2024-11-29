import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, where, getDocs, onSnapshot, orderBy, limit, startAfter } from 'firebase/firestore';
import Lgelogo from '../Lgelogo';

export default function PermitManagerScreen({ navigation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPermits, setFilteredPermits] = useState([]);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [pendingPermits, setPendingPermits] = useState([]);
  const [pastPermits, setPastPermits] = useState([]);
  const [lastVisible, setLastVisible] = useState(null); // For pagination
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [isViewMore, setIsViewMore] = useState(true); // Tracks if 'View More' or 'View Less' is active

  useEffect(() => {
    const fetchPendingPermits = async () => {
      const permitsQuery = query(collection(db, 'permits'), where('status', '==', 'Pending'));
      const unsubscribe = onSnapshot(permitsQuery, (snapshot) => {
        const permitsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingPermits(permitsList);
      });
      return () => unsubscribe(); // Cleanup listener on unmount
    };
    fetchPendingPermits();
  }, []);

  useEffect(() => {
    fetchPastPermits();
  }, []);

  const fetchPastPermits = async (loadMore = false) => {
    if (!loadMore && !isViewMore) {
      // Handle "View Less" by displaying only the top 5 permits
      const permitsQuery = query(
        collection(db, 'permits'),
        where('status', 'in', ['Accepted', 'Rejected', 'Closed', 'Cancelled']),
        orderBy('updatedAt', 'desc'),
        limit(5)
      );
      const permitsSnapshot = await getDocs(permitsQuery);
      const newPermits = permitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPastPermits(newPermits);
      setLastVisible(permitsSnapshot.docs[permitsSnapshot.docs.length - 1]);
      setIsViewMore(true);
      return;
    }

    let permitsQuery = query(
      collection(db, 'permits'),
      where('status', 'in', ['Accepted', 'Rejected', 'Closed', 'Cancelled']),
      orderBy('updatedAt', 'desc'),
      limit(5)
    );

    if (loadMore && lastVisible) {
      permitsQuery = query(
        permitsQuery,
        startAfter(lastVisible)
      );
    }

    try {
      const permitsSnapshot = await getDocs(permitsQuery);
      const newPermits = permitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (loadMore) {
        if (newPermits.length > 0) {
          setPastPermits(prevPermits => [...prevPermits, ...newPermits]);
          setLastVisible(permitsSnapshot.docs[permitsSnapshot.docs.length - 1]);
        } else {
          setIsViewMore(false); // No more permits to load, switch to 'View Less'
        }
      } else {
        setPastPermits(newPermits);
        setLastVisible(permitsSnapshot.docs[permitsSnapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error("Error fetching past permits:", error);
    }
  };

  const handleStatusChange = async (permitId, newStatus) => {
    const permitRef = doc(db, 'permits', permitId);
    try {
      await updateDoc(permitRef, {
        status: newStatus,
        updatedAt: new Date(), // Update the last modified date
      });
      fetchPastPermits(); // Reload the past permits to ensure the most recent one appears at the top
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    const filtered = pendingPermits.filter(permit =>
      permit.id.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredPermits(filtered);
  };

  const handleSelectPermit = (permit) => {
    setSearchTerm(permit.id);
    setSelectedPermit(permit.id);
    setFilteredPermits([]);
  };

  const handleReasonClick = (reason) => {
    setReasonText(reason);
    setReasonModalVisible(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Lgelogo />
      <View style={{ marginTop: 150 }} />

      {/* Search Field with Autocomplete */}
      <View style={styles.pickerContainer}>
        <TextInput
          style={styles.searchPermitText}
          placeholder="Search Permit Number"
          value={searchTerm}
          onChangeText={handleSearch}
        />
        {filteredPermits.length > 0 && (
          <FlatList
            data={filteredPermits}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.autocompleteItem}
                onPress={() => handleSelectPermit(item)}
              >
                <Text>{item.id}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Show Selected Permit with Accept/Reject Buttons */}
      {selectedPermit && (
        <View style={styles.smallPermitContainer}>
          <Text style={styles.permitText}>{selectedPermit}</Text>
          <TouchableOpacity style={styles.smallAcceptButton} onPress={() => handleStatusChange(selectedPermit, 'Accepted')}>
            <Text style={styles.acceptText}>ACCEPT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallRejectButton} onPress={() => handleStatusChange(selectedPermit, 'Rejected')}>
            <Text style={styles.rejectText}>REJECT</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pending Approval Section */}
      <Text style={styles.sectionTitle}>Pending Approval</Text>
      {pendingPermits.map((permit, index) => (
        <View key={index} style={styles.smallPermitContainer}>
          <Text style={styles.permitText}>{permit.id}</Text>
          <TouchableOpacity style={styles.smallAcceptButton} onPress={() => handleStatusChange(permit.id, 'Accepted')}>
            <Text style={styles.acceptText}>ACCEPT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallRejectButton} onPress={() => handleStatusChange(permit.id, 'Rejected')}>
            <Text style={styles.rejectText}>REJECT</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Past Permits Section */}
      <Text style={styles.sectionTitle}>Past Permits</Text>
      {pastPermits.map((permit, index) => (
        <View key={index} style={styles.pastPermitContainer}>
          <Text style={styles.pastPermitText}>{permit.id}</Text>
          <Text style={[styles.pastPermitStatus, { color: permit.color }]}>{permit.status}</Text>
          {permit.reason && (
            <TouchableOpacity
              style={styles.reasonButton}
              onPress={() => handleReasonClick(permit.reason)}
            >
              <Text style={styles.reasonButtonText}>Reason</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* View More or View Less Button */}
      <TouchableOpacity onPress={() => fetchPastPermits(isViewMore)}>
        <Text style={styles.viewMoreText}>{isViewMore ? 'View More' : 'View Less'}</Text>
      </TouchableOpacity>

      {/* Reason Modal */}
      <Modal
        transparent={true}
        visible={reasonModalVisible}
        animationType="fade"
        onRequestClose={() => setReasonModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{reasonText}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setReasonModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderColor: '#00A86B',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  searchPermitText: {
    color: '#8c8c8c',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  smallPermitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderColor: '#dcdcdc',
    borderWidth: 1,
  },
  permitText: {
    fontSize: 14,
    flex: 1,
  },
  smallAcceptButton: {
    backgroundColor: '#00A86B',
    padding: 5,
    marginRight: 10,
    borderRadius: 5,
  },
  smallRejectButton: {
    backgroundColor: '#FF3B30',
    padding: 5,
    borderRadius: 5,
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  rejectText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pastPermitContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Ensure items are centered vertically
    justifyContent: 'space-between', // Ensure the elements are spread across the row
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    marginBottom: 10,
  },
  pastPermitText: {
    fontSize: 14,
    flex: 1,
    textAlign: 'left', // Align permit ID to the left
  },
  pastPermitStatus: {
    fontSize: 14,
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'right', // Align status text in the center
    flex: 1, // Ensure it takes equal space
  },
  reasonButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10, // Add space between the status and reason button
  },
  reasonButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewMoreText: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});