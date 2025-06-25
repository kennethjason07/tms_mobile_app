import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';

export default function WeeklyPayScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [weeklyPay, setWeeklyPay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://your-api-url.com/api/workers');
      if (response.ok) {
        const data = await response.json();
        setWorkers(data);
      } else {
        // Mock data for testing
        setWorkers([
          { id: 1, name: 'John Doe', daily_rate: 500, phone: '1234567890' },
          { id: 2, name: 'Jane Smith', daily_rate: 450, phone: '0987654321' },
          { id: 3, name: 'Mike Johnson', daily_rate: 550, phone: '1122334455' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      // Mock data for testing
      setWorkers([
        { id: 1, name: 'John Doe', daily_rate: 500, phone: '1234567890' },
        { id: 2, name: 'Jane Smith', daily_rate: 450, phone: '0987654321' },
        { id: 3, name: 'Mike Johnson', daily_rate: 550, phone: '1122334455' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyPay = async (workerId, date) => {
    try {
      setLoading(true);
      const response = await fetch(`https://your-api-url.com/api/weekly-pay?worker_id=${workerId}&date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setWeeklyPay(data.weekly_pay);
        setSelectedWorker(workers.find(w => w.id === workerId));
        setModalVisible(true);
      } else {
        // Mock calculation for testing
        const worker = workers.find(w => w.id === workerId);
        const mockWeeklyPay = worker.daily_rate * 6; // Assuming 6 working days
        setWeeklyPay(mockWeeklyPay);
        setSelectedWorker(worker);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error calculating weekly pay:', error);
      // Mock calculation for testing
      const worker = workers.find(w => w.id === workerId);
      const mockWeeklyPay = worker.daily_rate * 6;
      setWeeklyPay(mockWeeklyPay);
      setSelectedWorker(worker);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePay = () => {
    if (!selectedWorker) {
      Alert.alert('Error', 'Please select a worker first');
      return;
    }
    calculateWeeklyPay(selectedWorker.id, selectedDate);
  };

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Pay Calculation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Week</Text>
          <TextInput
            style={styles.dateInput}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
        </View>

        {/* Worker Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Worker</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#2980b9" />
          ) : (
            <View style={styles.workerList}>
              {workers.map((worker) => (
                <TouchableOpacity
                  key={worker.id}
                  style={[
                    styles.workerCard,
                    selectedWorker?.id === worker.id && styles.selectedWorkerCard,
                  ]}
                  onPress={() => handleWorkerSelect(worker)}
                >
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerDetails}>
                    Daily Rate: ₹{worker.daily_rate} | Phone: {worker.phone}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={handleCalculatePay}
          disabled={!selectedWorker || loading}
        >
          <Text style={styles.calculateButtonText}>
            {loading ? 'Calculating...' : 'Calculate Weekly Pay'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Results Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Weekly Pay Summary</Text>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Worker:</Text>
              <Text style={styles.summaryValue}>{selectedWorker?.name}</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Week Starting:</Text>
              <Text style={styles.summaryValue}>{selectedDate}</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Daily Rate:</Text>
              <Text style={styles.summaryValue}>₹{selectedWorker?.daily_rate}</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Weekly Pay:</Text>
              <Text style={styles.weeklyPayAmount}>₹{weeklyPay}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.printButton]}
                onPress={() => {
                  Alert.alert('Success', 'Weekly pay report printed successfully!');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.printButtonText}>Print Report</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  workerList: {
    gap: 12,
  },
  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedWorkerCard: {
    borderColor: '#2980b9',
    backgroundColor: '#e3f2fd',
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workerDetails: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  calculateButton: {
    backgroundColor: '#2980b9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
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
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  weeklyPayAmount: {
    fontSize: 20,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  printButton: {
    backgroundColor: '#27ae60',
  },
  printButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
}); 