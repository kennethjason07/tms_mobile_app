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

export default function WorkerExpenseScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    worker_id: '',
    date: '',
    name: '',
    Amt_Paid: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [searchQuery, expenses]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, workersData] = await Promise.all([
        SupabaseAPI.getWorkerExpenses(),
        SupabaseAPI.getWorkers()
      ]);
      
      setExpenses(expensesData);
      setWorkers(workersData);
      setFilteredExpenses(expensesData);
    } catch (error) {
      Alert.alert('Error', `Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    if (!searchQuery.trim()) {
      setFilteredExpenses(expenses);
      return;
    }

    const filtered = expenses.filter(expense => {
      const worker = workers.find(w => w.id === expense.worker_id);
      return (
        expense.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.date?.includes(searchQuery)
      );
    });
    setFilteredExpenses(filtered);
  };

  const handleAddExpense = async () => {
    if (!newExpense.worker_id || !newExpense.date || !newExpense.name || !newExpense.Amt_Paid) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      setLoading(true);
      const expenseData = {
        worker_id: parseInt(newExpense.worker_id),
        date: newExpense.date,
        name: newExpense.name,
        Amt_Paid: parseFloat(newExpense.Amt_Paid),
      };

      await SupabaseAPI.addWorkerExpense(expenseData);
      setModalVisible(false);
      setNewExpense({
        worker_id: '',
        date: '',
        name: '',
        Amt_Paid: '',
      });
      loadData(); // Reload the list
      Alert.alert('Success', 'Worker expense added successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to add expense: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => {
      return total + (expense.Amt_Paid || 0);
    }, 0);
  };

  const getWorkerName = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    return worker ? worker.name : 'Unknown Worker';
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const renderExpense = ({ item }) => {
    const workerName = getWorkerName(item.worker_id);
    
    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
          <Text style={styles.expenseAmount}>₹{item.Amt_Paid}</Text>
        </View>

        <View style={styles.expenseDetails}>
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Worker:</Text>
            <Text style={styles.expenseValue}>{workerName}</Text>
          </View>

          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Description:</Text>
            <Text style={styles.expenseValue}>{item.name}</Text>
          </View>

          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Worker ID:</Text>
            <Text style={styles.expenseValue}>#{item.worker_id}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading worker expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by worker name, description, or date..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredExpenses.length}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>₹{calculateTotalExpenses().toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Paid</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            ₹{(calculateTotalExpenses() / Math.max(filteredExpenses.length, 1)).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Avg per Entry</Text>
        </View>
      </View>

      <FlatList
        data={filteredExpenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadData}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Worker Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Select Worker:</Text>
              <ScrollView style={styles.workerSelector} horizontal showsHorizontalScrollIndicator={false}>
                {workers.map((worker) => (
                  <TouchableOpacity
                    key={worker.id}
                    style={[
                      styles.workerOption,
                      newExpense.worker_id === worker.id.toString() && styles.workerOptionSelected
                    ]}
                    onPress={() => setNewExpense({ ...newExpense, worker_id: worker.id.toString() })}
                  >
                    <Text style={[
                      styles.workerOptionText,
                      newExpense.worker_id === worker.id.toString() && styles.workerOptionTextSelected
                    ]}>
                      {worker.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                value={newExpense.date}
                onChangeText={(text) => setNewExpense({ ...newExpense, date: text })}
                defaultValue={getTodayDate()}
              />

              <TextInput
                style={styles.input}
                placeholder="Description (e.g., Advance, Bonus, etc.)"
                value={newExpense.name}
                onChangeText={(text) => setNewExpense({ ...newExpense, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Amount Paid"
                value={newExpense.Amt_Paid}
                onChangeText={(text) => setNewExpense({ ...newExpense, Amt_Paid: text })}
                keyboardType="numeric"
              />

              {newExpense.worker_id && (
                <View style={styles.workerInfo}>
                  <Text style={styles.workerInfoTitle}>Selected Worker:</Text>
                  <Text style={styles.workerInfoText}>
                    {getWorkerName(parseInt(newExpense.worker_id))}
                  </Text>
                </View>
              )}
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
                onPress={handleAddExpense}
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  expenseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  expenseDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  expenseDetails: {
    marginBottom: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  expenseLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  expenseValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
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
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  workerSelector: {
    marginBottom: 16,
  },
  workerOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  workerOptionSelected: {
    backgroundColor: '#2980b9',
    borderColor: '#2980b9',
  },
  workerOptionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  workerOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  workerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  workerInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workerInfoText: {
    fontSize: 14,
    color: '#2980b9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
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