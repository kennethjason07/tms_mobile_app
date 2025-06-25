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

export default function ShopExpenseScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    materialCost: '',
    materialType: '',
    miscellaneousCost: '',
    miscellaneousItem: '',
    chaiPaniCost: '',
    totalPay: '',
  });

  useEffect(() => {
    fetchDailyExpenses();
  }, []);

  const fetchDailyExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/daily_expenses');
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Sort the data in descending order by date
        const sortedData = data.sort((a, b) => new Date(b.Date) - new Date(a.Date));
        setExpenses(sortedData);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Alert.alert('Error', 'Failed to fetch expenses');
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

  const calculateTotal = () => {
    const material = parseFloat(formData.materialCost) || 0;
    const misc = parseFloat(formData.miscellaneousCost) || 0;
    const chaiPani = parseFloat(formData.chaiPaniCost) || 0;
    const total = material + misc + chaiPani;
    setFormData(prev => ({ ...prev, totalPay: total.toString() }));
  };

  const addExpense = async () => {
    // Validate required fields
    if (!formData.date || !formData.totalPay) {
      Alert.alert('Error', 'Please fill in all required fields (Date and Total Pay)');
      return;
    }

    const expenseData = {
      Date: formData.date,
      material_cost: formData.materialCost || 0,
      material_type: formData.materialType || '',
      miscellaneous_Cost: formData.miscellaneousCost || 0,
      miscellaenous_item: formData.miscellaneousItem || '',
      chai_pani_cost: formData.chaiPaniCost || 0,
      Total_Pay: parseFloat(formData.totalPay),
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/daily_expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();
      console.log('Response from server:', data);
      
      Alert.alert('Success', 'Expense added successfully!');
      setShowForm(false);
      resetForm();
      fetchDailyExpenses(); // Refresh the expenses list
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      materialCost: '',
      materialType: '',
      miscellaneousCost: '',
      miscellaneousItem: '',
      chaiPaniCost: '',
      totalPay: '',
    });
  };

  const renderExpenseItem = ({ item: expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseId}>ID: {expense.id}</Text>
        <Text style={styles.expenseDate}>{expense.Date}</Text>
      </View>

      <View style={styles.expenseDetails}>
        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Material Cost:</Text>
          <Text style={styles.expenseValue}>₹{expense.material_cost || 0}</Text>
        </View>

        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Material Type:</Text>
          <Text style={styles.expenseValue}>{expense.material_type || 'N/A'}</Text>
        </View>

        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Miscellaneous Cost:</Text>
          <Text style={styles.expenseValue}>₹{expense.miscellaneous_Cost || 0}</Text>
        </View>

        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Miscellaneous Item:</Text>
          <Text style={styles.expenseValue}>{expense.miscellaenous_item || 'N/A'}</Text>
        </View>

        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Chai Pani Cost:</Text>
          <Text style={styles.expenseValue}>₹{expense.chai_pani_cost || 0}</Text>
        </View>

        <View style={styles.expenseRow}>
          <Text style={styles.expenseLabel}>Total Pay:</Text>
          <Text style={[styles.expenseValue, styles.totalAmount]}>₹{expense.Total_Pay}</Text>
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
        <Text style={styles.headerTitle}>Shop Expenses</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.screenTitle}>Shop Expenses</Text>

        {/* Add New Expense Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(!showForm)}
          >
            <Text style={styles.addButtonText}>
              {showForm ? 'Hide Form' : 'Add New Expense'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Expense Form */}
        {showForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New Expense</Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Date:</Text>
                <TextInput
                  style={styles.dateInput}
                  value={formData.date}
                  onChangeText={(value) => handleInputChange('date', value)}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Material Cost:</Text>
                <TextInput
                  style={styles.numberInput}
                  value={formData.materialCost}
                  onChangeText={(value) => {
                    handleInputChange('materialCost', value);
                    calculateTotal();
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Material Type:</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.materialType}
                  onChangeText={(value) => handleInputChange('materialType', value)}
                  placeholder="Enter material type"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Miscellaneous Cost:</Text>
                <TextInput
                  style={styles.numberInput}
                  value={formData.miscellaneousCost}
                  onChangeText={(value) => {
                    handleInputChange('miscellaneousCost', value);
                    calculateTotal();
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Miscellaneous Item:</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.miscellaneousItem}
                  onChangeText={(value) => handleInputChange('miscellaneousItem', value)}
                  placeholder="Enter item description"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Chai Pani Cost:</Text>
                <TextInput
                  style={styles.numberInput}
                  value={formData.chaiPaniCost}
                  onChangeText={(value) => {
                    handleInputChange('chaiPaniCost', value);
                    calculateTotal();
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Total Pay:</Text>
                <TextInput
                  style={[styles.numberInput, styles.totalInput]}
                  value={formData.totalPay}
                  onChangeText={(value) => handleInputChange('totalPay', value)}
                  placeholder="0"
                  keyboardType="numeric"
                  editable={false}
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={addExpense}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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
  addButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    gap: 12,
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
  textInput: {
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
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginLeft: 12,
    fontSize: 16,
  },
  totalInput: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    color: '#27ae60',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2980b9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
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
    borderLeftColor: '#e74c3c',
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
    color: '#e74c3c',
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
  totalAmount: {
    color: '#e74c3c',
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