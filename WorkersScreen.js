import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SupabaseAPI } from './supabase';

export default function WorkersScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: '',
    number: '',
    Rate: '',
    Suit: '',
    Jacket: '',
    Sadri: '',
    Others: '',
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const data = await SupabaseAPI.getWorkers();
      setWorkers(data);
    } catch (error) {
      Alert.alert('Error', `Failed to load workers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async () => {
    if (!newWorker.name || !newWorker.number) {
      Alert.alert('Error', 'Name and number are required');
      return;
    }

    try {
      setLoading(true);
      const workerData = {
        name: newWorker.name,
        number: newWorker.number,
        Rate: parseFloat(newWorker.Rate) || null,
        Suit: parseFloat(newWorker.Suit) || null,
        Jacket: parseFloat(newWorker.Jacket) || null,
        Sadri: parseFloat(newWorker.Sadri) || null,
        Others: parseFloat(newWorker.Others) || null,
      };

      await SupabaseAPI.addWorkers([workerData]);
      setModalVisible(false);
      setNewWorker({ name: '', number: '', Rate: '', Suit: '', Jacket: '', Sadri: '', Others: '' });
      loadWorkers(); // Reload the list
      Alert.alert('Success', 'Worker added successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to add worker: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorker = async (workerId, workerName) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${workerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await SupabaseAPI.deleteWorker(workerId);
              loadWorkers(); // Reload the list
              Alert.alert('Success', 'Worker deleted successfully');
            } catch (error) {
              Alert.alert('Error', `Failed to delete worker: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderWorker = ({ item }) => (
    <View style={styles.workerCard}>
      <View style={styles.workerInfo}>
        <Text style={styles.workerName}>{item.name}</Text>
        <Text style={styles.workerNumber}>{item.number}</Text>
        <View style={styles.ratesContainer}>
          {item.Rate && <Text style={styles.rate}>Rate: ₹{item.Rate}</Text>}
          {item.Suit && <Text style={styles.rate}>Suit: ₹{item.Suit}</Text>}
          {item.Jacket && <Text style={styles.rate}>Jacket: ₹{item.Jacket}</Text>}
          {item.Sadri && <Text style={styles.rate}>Sadri: ₹{item.Sadri}</Text>}
          {item.Others && <Text style={styles.rate}>Others: ₹{item.Others}</Text>}
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteWorker(item.id, item.name)}
        disabled={loading}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && workers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading workers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workers}
        renderItem={renderWorker}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadWorkers}
      />

      {/* Add Worker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Worker</Text>
            <ScrollView style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={newWorker.name}
                onChangeText={(text) => setNewWorker({ ...newWorker, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={newWorker.number}
                onChangeText={(text) => setNewWorker({ ...newWorker, number: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Rate"
                value={newWorker.Rate}
                onChangeText={(text) => setNewWorker({ ...newWorker, Rate: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Suit Rate"
                value={newWorker.Suit}
                onChangeText={(text) => setNewWorker({ ...newWorker, Suit: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Jacket Rate"
                value={newWorker.Jacket}
                onChangeText={(text) => setNewWorker({ ...newWorker, Jacket: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Sadri Rate"
                value={newWorker.Sadri}
                onChangeText={(text) => setNewWorker({ ...newWorker, Sadri: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Others Rate"
                value={newWorker.Others}
                onChangeText={(text) => setNewWorker({ ...newWorker, Others: text })}
                keyboardType="numeric"
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddWorker}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2980b9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workerNumber: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  ratesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rate: {
    fontSize: 12,
    color: '#2980b9',
    marginRight: 8,
    marginBottom: 2,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 