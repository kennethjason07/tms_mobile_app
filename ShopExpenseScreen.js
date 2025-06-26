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

export default function ShopExpenseScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    Date: '',
    material_cost: '',
    material_type: '',
    miscellaneous_Cost: '',
    miscellaenous_item: '',
    chai_pani_cost: '',
    Total_Pay: '',
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [searchQuery, expenses]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await SupabaseAPI.getDailyExpenses();
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (error) {
      Alert.alert('Error', `Failed to load expenses: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    if (!searchQuery.trim()) {
      setFilteredExpenses(expenses);
      return;
    }

    const filtered = expenses.filter(expense => 
      expense.material_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.miscellaenous_item?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.Date?.includes(searchQuery)
    );
    setFilteredExpenses(filtered);
  };

  const handleAddExpense = async () => {
    if (!newExpense.Date || !newExpense.Total_Pay) {
      Alert.alert('Error', 'Date and Total Pay are required fields');
      return;
    }

    try {
      setLoading(true);
      const expenseData = {
        Date: newExpense.Date,
        material_cost: parseFloat(newExpense.material_cost) || 0,
        material_type: newExpense.material_type || '',
        miscellaneous_Cost: parseFloat(newExpense.miscellaneous_Cost) || 0,
        miscellaenous_item: newExpense.miscellaenous_item || '',
        chai_pani_cost: parseFloat(newExpense.chai_pani_cost) || 0,
        Total_Pay: parseFloat(newExpense.Total_Pay),
      };

      await SupabaseAPI.addDailyExpense(expenseData);
      setModalVisible(false);
      setNewExpense({
        Date: '',
        material_cost: '',
        material_type: '',
        miscellaneous_Cost: '',
        miscellaenous_item: '',
        chai_pani_cost: '',
        Total_Pay: '',
      });
      loadExpenses(); // Reload the list
      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to add expense: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => {
      return total + (expense.material_cost || 0) + 
             (expense.miscellaneous_Cost || 0) + 
             (expense.chai_pani_cost || 0);
    }, 0);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const renderExpense = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseDate}>
          {new Date(item.Date).toLocaleDateString()}
        </Text>
        <Text style={styles.expenseTotal}>₹{item.Total_Pay}</Text>
      </View>

      <View style={styles.expenseDetails}>
        {item.material_type && (
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Material:</Text>
            <Text style={styles.expenseValue}>
              {item.material_type} - ₹{item.material_cost || 0}
            </Text>
          </View>
        )}

        {item.miscellaenous_item && (
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Miscellaneous:</Text>
            <Text style={styles.expenseValue}>
              {item.miscellaenous_item} - ₹{item.miscellaneous_Cost || 0}
            </Text>
          </View>
        )}

        {item.chai_pani_cost > 0 && (
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Chai/Pani:</Text>
            <Text style={styles.expenseValue}>₹{item.chai_pani_cost}</Text>
          </View>
        )}
      </View>

      <View style={styles.expenseBreakdown}>
        <Text style={styles.breakdownText}>
          Breakdown: Material ₹{item.material_cost || 0} + 
          Misc ₹{item.miscellaneous_Cost || 0} + 
          Chai/Pani ₹{item.chai_pani_cost || 0} = 
          Total ₹{item.Total_Pay}
        </Text>
      </View>
    </View>
  );

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Expenses</Text>
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
          placeholder="Search by material type, item, or date..."
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
          <Text style={styles.statLabel}>Total Expenses</Text>
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
        onRefresh={loadExpenses}
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
              <Text style={styles.modalTitle}>Add Daily Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                value={newExpense.Date}
                onChangeText={(text) => setNewExpense({ ...newExpense, Date: text })}
                defaultValue={getTodayDate()}
              />

              <TextInput
                style={styles.input}
                placeholder="Material Type (optional)"
                value={newExpense.material_type}
                onChangeText={(text) => setNewExpense({ ...newExpense, material_type: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Material Cost"
                value={newExpense.material_cost}
                onChangeText={(text) => setNewExpense({ ...newExpense, material_cost: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Miscellaneous Item (optional)"
                value={newExpense.miscellaenous_item}
                onChangeText={(text) => setNewExpense({ ...newExpense, miscellaenous_item: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Miscellaneous Cost"
                value={newExpense.miscellaneous_Cost}
                onChangeText={(text) => setNewExpense({ ...newExpense, miscellaneous_Cost: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Chai/Pani Cost"
                value={newExpense.chai_pani_cost}
                onChangeText={(text) => setNewExpense({ ...newExpense, chai_pani_cost: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Total Pay (required)"
                value={newExpense.Total_Pay}
                onChangeText={(text) => setNewExpense({ ...newExpense, Total_Pay: text })}
                keyboardType="numeric"
              />

              <View style={styles.calculationPreview}>
                <Text style={styles.calculationText}>
                  Preview: Material ₹{parseFloat(newExpense.material_cost) || 0} + 
                  Misc ₹{parseFloat(newExpense.miscellaneous_Cost) || 0} + 
                  Chai/Pani ₹{parseFloat(newExpense.chai_pani_cost) || 0} = 
                  ₹{(parseFloat(newExpense.material_cost) || 0) + 
                    (parseFloat(newExpense.miscellaneous_Cost) || 0) + 
                    (parseFloat(newExpense.chai_pani_cost) || 0)}
                </Text>
              </View>
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
  expenseTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  expenseDetails: {
    marginBottom: 12,
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
  expenseBreakdown: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  breakdownText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  calculationPreview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  calculationText: {
    fontSize: 14,
    color: '#2c3e50',
    fontStyle: 'italic',
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