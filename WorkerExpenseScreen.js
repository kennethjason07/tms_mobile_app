import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  FlatList,
  Modal,
} from 'react-native';

export default function WorkerExpenseScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amountPaid: '',
  });

  useEffect(() => {
    fetchWorkers();
    fetchWorkerExpenses();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/workers');
      const data = await response.json();
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      Alert.alert('Error', 'Failed to fetch workers');
    }
  };

  const fetchWorkerExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/worker-expenses');
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Sort the expenses array in descending order by date
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setExpenses(sortedData);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching worker expenses:', error);
      Alert.alert('Error', 'Failed to fetch worker expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitExpense = async () => {
    if (!selectedWorker || !formData.date || !formData.amountPaid) {
      Alert.alert('Error', 'Please fill all the fields before submitting.');
      return;
    }

    const selectedWorkerData = workers.find(worker => worker.id.toString() === selectedWorker);
    if (!selectedWorkerData) {
      Alert.alert('Error', 'Please select a valid worker.');
      return;
    }

    const expenseData = {
      worker_id: selectedWorker,
      name: selectedWorkerData.name,
      date: formData.date,
      Amt_Paid: parseFloat(formData.amountPaid),
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/worker-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();
      Alert.alert('Success', 'Worker expense added successfully');
      console.log('Worker expense added:', result);
      
      // Reset form
      setSelectedWorker('');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amountPaid: '',
      });
      
      // Refresh expenses list
      fetchWorkerExpenses();
    } catch (error) {
      console.error('Error adding worker expense:', error);
      Alert.alert('Error', 'Failed to add worker expense');
    }
  };

  const renderExpenseItem = ({ item: expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseId}>ID: {expense.id}</Text>
        <Text style={styles.expenseDate}>
          {new Date(expense.date).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.expenseDetails}>
        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Worker Name:</Text>
          <Text style={styles.expenseValue}>{expense.name}</Text>
        </View>

        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Worker ID:</Text>
          <Text style={styles.expenseValue}>{expense.worker_id}</Text>
        </View>

        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Amount Paid:</Text>
          <Text style={[styles.expenseValue, styles.amountText]}>₹{expense.Amt_Paid}</Text>
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Worker Expenses</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.screenTitle}>Worker Expenses</Text>

        {/* Add Expense Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Expense</Text>
          
          <View style={styles.formContainer}>
            {/* Worker Selection */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Select Worker:</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    // Show worker selection modal
                    const workerNames = workers.map(worker => `${worker.id} - ${worker.name}`);
                    Alert.alert(
                      'Select Worker',
                      'Choose a worker:',
                      workers.map((worker, index) => ({
                        text: `${worker.id} - ${worker.name}`,
                        onPress: () => setSelectedWorker(worker.id.toString()),
                      })).concat([
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                      ])
                    );
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {selectedWorker 
                      ? workers.find(w => w.id.toString() === selectedWorker)?.name || 'Select Worker'
                      : 'Select Worker'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Input */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Date:</Text>
              <TextInput
                style={styles.dateInput}
                value={formData.date}
                onChangeText={(value) => handleInputChange('date', value)}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* Amount Input */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Amount Paid:</Text>
              <TextInput
                style={styles.numberInput}
                value={formData.amountPaid}
                onChangeText={(value) => handleInputChange('amountPaid', value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitExpense}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expenses List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses History ({expenses.length})</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading expenses...</Text>
          ) : expenses.length > 0 ? (
            <FlatList
              data={expenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noExpensesText}>No expenses found.</Text>
          )}
        </View>
      </ScrollView>
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
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  placeholder: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2980b9',
  },
  formContainer: {
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    flex: 1,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginLeft: 12,
    fontSize: 16,
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginLeft: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  pickerContainer: {
    flex: 1,
    marginLeft: 12,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#34495e',
  },
  submitButton: {
    backgroundColor: '#2980b9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  expenseId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  expenseDate: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  expenseDetails: {
    gap: 6,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  expenseValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    color: '#f39c12',
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noExpensesText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 