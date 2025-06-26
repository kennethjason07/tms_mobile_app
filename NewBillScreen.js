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
  Switch,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SupabaseAPI } from './supabase';

export default function NewBillScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [workerModalVisible, setWorkerModalVisible] = useState(false);
  const [billData, setBillData] = useState({
    customer_name: '',
    mobile_number: '',
    billnumberinput2: '',
    garment_type: '',
    total_amt: '',
    payment_amount: '',
    payment_status: 'pending',
    status: 'pending',
    order_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersData, workersData] = await Promise.all([
        SupabaseAPI.getAllCustomers(),
        SupabaseAPI.getWorkers()
      ]);
      
      setCustomers(customersData);
      setWorkers(workersData);
    } catch (error) {
      console.error('Data loading error:', error);
      Alert.alert('Error', `Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateBillNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BILL-${timestamp}-${random}`;
  };

  const handleCustomerSelect = (customer) => {
    setBillData({
      ...billData,
      customer_name: customer.name,
      mobile_number: customer.phone,
    });
    setCustomerModalVisible(false);
  };

  const handleWorkerToggle = (worker) => {
    const isSelected = selectedWorkers.find(w => w.id === worker.id);
    if (isSelected) {
      setSelectedWorkers(selectedWorkers.filter(w => w.id !== worker.id));
    } else {
      setSelectedWorkers([...selectedWorkers, worker]);
    }
  };

  const calculateTotalAmount = () => {
    const totalAmt = parseFloat(billData.total_amt) || 0;
    const paymentAmt = parseFloat(billData.payment_amount) || 0;
    return totalAmt - paymentAmt;
  };

  const validateForm = () => {
    if (!billData.customer_name || !billData.mobile_number) {
      Alert.alert('Error', 'Please select a customer');
      return false;
    }
    if (!billData.billnumberinput2) {
      Alert.alert('Error', 'Please enter a bill number');
      return false;
    }
    if (!billData.garment_type) {
      Alert.alert('Error', 'Please enter garment type');
      return false;
    }
    if (!billData.total_amt || parseFloat(billData.total_amt) <= 0) {
      Alert.alert('Error', 'Please enter a valid total amount');
      return false;
    }
    if (!billData.order_date) {
      Alert.alert('Error', 'Please enter order date');
      return false;
    }
    if (!billData.due_date) {
      Alert.alert('Error', 'Please enter due date');
      return false;
    }
    return true;
  };

  const handleSaveBill = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Create the bill
      const billToSave = {
        ...billData,
        total_amt: parseFloat(billData.total_amt),
        payment_amount: parseFloat(billData.payment_amount) || 0,
      };

      const billResult = await SupabaseAPI.createNewBill(billToSave);
      
      if (billResult && billResult[0]) {
        const billId = billResult[0].id;
        
        // Create the order
        const orderData = {
          bill_id: billId,
          billnumberinput2: billData.billnumberinput2,
          garment_type: billData.garment_type,
          order_date: billData.order_date,
          due_date: billData.due_date,
          total_amt: parseFloat(billData.total_amt),
          payment_amount: parseFloat(billData.payment_amount) || 0,
          payment_status: billData.payment_status,
          status: billData.status,
          Work_pay: calculateTotalAmount() * 0.3, // 30% of total amount as work pay
        };

        const orderResult = await SupabaseAPI.createOrder(orderData);
        
        if (orderResult && orderResult[0] && selectedWorkers.length > 0) {
          const orderId = orderResult[0].id;
          
          // Assign workers to the order
          const workerIds = selectedWorkers.map(w => w.id);
          await SupabaseAPI.assignWorkersToOrder(orderId, workerIds);
        }

        Alert.alert(
          'Success', 
          'Bill created successfully!',
          [
            {
              text: 'View Orders',
              onPress: () => navigation.navigate('OrdersOverview')
            },
            {
              text: 'Create Another',
              onPress: () => resetForm()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Bill creation error:', error);
      Alert.alert('Error', `Failed to create bill: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBillData({
      customer_name: '',
      mobile_number: '',
      billnumberinput2: generateBillNumber(),
      garment_type: '',
      total_amt: '',
      payment_amount: '',
      payment_status: 'pending',
      status: 'pending',
      order_date: new Date().toISOString().split('T')[0],
      due_date: '',
    });
    setSelectedWorkers([]);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Bill</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetForm}
          disabled={saving}
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <TouchableOpacity
            style={styles.customerSelector}
            onPress={() => setCustomerModalVisible(true)}
          >
            <Text style={styles.customerSelectorText}>
              {billData.customer_name || 'Select Customer'}
            </Text>
            <Text style={styles.customerSelectorArrow}>▼</Text>
          </TouchableOpacity>

          {billData.customer_name && (
            <View style={styles.customerInfo}>
              <Text style={styles.customerInfoText}>Name: {billData.customer_name}</Text>
              <Text style={styles.customerInfoText}>Phone: {billData.mobile_number}</Text>
            </View>
          )}
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Bill Number:</Text>
            <TextInput
              style={styles.input}
              value={billData.billnumberinput2}
              onChangeText={(text) => setBillData({ ...billData, billnumberinput2: text })}
              placeholder="Enter bill number"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Garment Type:</Text>
            <TextInput
              style={styles.input}
              value={billData.garment_type}
              onChangeText={(text) => setBillData({ ...billData, garment_type: text })}
              placeholder="e.g., Shirt, Pants, Suit"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Total Amount:</Text>
            <TextInput
              style={styles.input}
              value={billData.total_amt}
              onChangeText={(text) => setBillData({ ...billData, total_amt: text })}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Advance Payment:</Text>
            <TextInput
              style={styles.input}
              value={billData.payment_amount}
              onChangeText={(text) => setBillData({ ...billData, payment_amount: text })}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Order Date:</Text>
            <TextInput
              style={styles.input}
              value={billData.order_date}
              onChangeText={(text) => setBillData({ ...billData, order_date: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Due Date:</Text>
            <TextInput
              style={styles.input}
              value={billData.due_date}
              onChangeText={(text) => setBillData({ ...billData, due_date: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        {/* Worker Assignment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign Workers</Text>
          
          <TouchableOpacity
            style={styles.workerSelector}
            onPress={() => setWorkerModalVisible(true)}
          >
            <Text style={styles.workerSelectorText}>
              {selectedWorkers.length > 0 
                ? `${selectedWorkers.length} worker(s) selected`
                : 'Select Workers'
              }
            </Text>
            <Text style={styles.workerSelectorArrow}>▼</Text>
          </TouchableOpacity>

          {selectedWorkers.length > 0 && (
            <View style={styles.selectedWorkers}>
              {selectedWorkers.map((worker) => (
                <View key={worker.id} style={styles.selectedWorker}>
                  <Text style={styles.selectedWorkerText}>{worker.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleWorkerToggle(worker)}
                    style={styles.removeWorkerButton}
                  >
                    <Text style={styles.removeWorkerText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>₹{parseFloat(billData.total_amt) || 0}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Advance Payment:</Text>
            <Text style={styles.summaryValue}>₹{parseFloat(billData.payment_amount) || 0}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining Amount:</Text>
            <Text style={[styles.summaryValue, styles.remainingAmount]}>
              ₹{calculateTotalAmount().toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Work Pay (30%):</Text>
            <Text style={[styles.summaryValue, styles.workPayAmount]}>
              ₹{(calculateTotalAmount() * 0.3).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveBill}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Create Bill</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Customer Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={customerModalVisible}
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.customerItem}
                  onPress={() => handleCustomerSelect(item)}
                >
                  <Text style={styles.customerItemName}>{item.name}</Text>
                  <Text style={styles.customerItemPhone}>{item.phone}</Text>
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* Worker Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={workerModalVisible}
        onRequestClose={() => setWorkerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Workers</Text>
              <TouchableOpacity onPress={() => setWorkerModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={workers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedWorkers.find(w => w.id === item.id);
                return (
                  <TouchableOpacity
                    style={[styles.workerItem, isSelected && styles.workerItemSelected]}
                    onPress={() => handleWorkerToggle(item)}
                  >
                    <Text style={[styles.workerItemName, isSelected && styles.workerItemNameSelected]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.workerItemPhone, isSelected && styles.workerItemPhoneSelected]}>
                      {item.phone}
                    </Text>
                    {isSelected && <Text style={styles.selectedCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              style={styles.modalList}
            />
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
  resetButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
    color: '#2c3e50',
    marginBottom: 16,
  },
  customerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  customerSelectorText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  customerSelectorArrow: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  customerInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  customerInfoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  workerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  workerSelectorText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  workerSelectorArrow: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  selectedWorkers: {
    marginTop: 12,
  },
  selectedWorker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedWorkerText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  removeWorkerButton: {
    backgroundColor: '#e74c3c',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeWorkerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  remainingAmount: {
    color: '#e74c3c',
  },
  workPayAmount: {
    color: '#2980b9',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
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
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    fontSize: 16,
  },
  modalList: {
    maxHeight: 400,
  },
  customerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  customerItemPhone: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  workerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  workerItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  workerItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  workerItemNameSelected: {
    color: '#2980b9',
  },
  workerItemPhone: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  workerItemPhoneSelected: {
    color: '#2980b9',
  },
  selectedCheck: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: 'bold',
  },
}); 