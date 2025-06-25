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

export default function OrdersOverviewScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    deliveryStatus: '',
    paymentStatus: '',
    deliveryDate: '',
  });
  const [selectedWorkers, setSelectedWorkers] = useState({});
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [ordersResponse, workersResponse] = await Promise.all([
        fetch('http://127.0.0.1:5000/api/orders'),
        fetch('http://127.0.0.1:5000/api/workers')
      ]);

      const ordersData = await ordersResponse.json();
      const workersData = await workersResponse.json();

      setWorkers(workersData);

      // Flatten orders data
      let allOrders = [];
      for (const deliveryDate in ordersData) {
        ordersData[deliveryDate].forEach(order => {
          allOrders.push({ ...order, deliveryDate });
        });
      }

      // Sort by bill number
      allOrders.sort((a, b) => {
        const billNumberA = a.billnumberinput2 ? a.billnumberinput2.toString() : '';
        const billNumberB = b.billnumberinput2 ? b.billnumberinput2.toString() : '';
        return billNumberB.localeCompare(billNumberA, undefined, { numeric: true });
      });

      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const searchOrder = async () => {
    if (!searchOrderNumber.trim()) {
      Alert.alert('Error', 'Please enter an order number.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/orders/search?bill_number=${searchOrderNumber}`);
      const data = await response.json();
      
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        setOrders(data);
        setCurrentPage(1);
      }
    } catch (error) {
      Alert.alert('Error', 'Error fetching order data.');
      console.error(error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      Alert.alert('Success', 'Order status updated successfully');
      fetchOrders(); // Refresh data
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Error updating order status');
    }
  };

  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/orders/${orderId}/payment-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: newPaymentStatus })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      Alert.alert('Success', 'Payment status updated successfully');
      fetchOrders(); // Refresh data
    } catch (error) {
      console.error('Error updating payment status:', error);
      Alert.alert('Error', 'Error updating payment status');
    }
  };

  const updatePaymentMode = async (orderId, newPaymentMode) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/orders/${orderId}/payment-mode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_mode: newPaymentMode })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      Alert.alert('Success', 'Payment mode updated successfully');
      fetchOrders(); // Refresh data
    } catch (error) {
      console.error('Error updating payment mode:', error);
      Alert.alert('Error', 'Error updating payment mode');
    }
  };

  const assignWorkersToOrder = async (orderId) => {
    const workerIds = selectedWorkers[orderId] || [];
    if (workerIds.length === 0) {
      Alert.alert('Error', 'Please select at least one worker.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/orders/${orderId}/assign-workers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_ids: workerIds })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `Workers assigned successfully. Total Work Pay: ₹${data.work_pay.toFixed(2)}`);
        setShowWorkerModal(false);
        fetchOrders(); // Refresh data
      } else {
        Alert.alert('Error', `Failed to assign workers: ${data.error}`);
      }
    } catch (error) {
      console.error('Error assigning workers:', error);
      Alert.alert('Error', 'An error occurred while assigning workers.');
    }
  };

  const toggleWorkerSelection = (orderId, workerId) => {
    setSelectedWorkers(prev => {
      const current = prev[orderId] || [];
      const updated = current.includes(workerId)
        ? current.filter(id => id !== workerId)
        : [...current, workerId];
      return { ...prev, [orderId]: updated };
    });
  };

  const openWorkerModal = (orderId) => {
    setCurrentOrderId(orderId);
    setSelectedWorkers(prev => ({ ...prev, [orderId]: prev[orderId] || [] }));
    setShowWorkerModal(true);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesDeliveryStatus = !filters.deliveryStatus || 
      order.status.toLowerCase() === filters.deliveryStatus.toLowerCase();
    const matchesPaymentStatus = !filters.paymentStatus || 
      order.payment_status.toLowerCase() === filters.paymentStatus.toLowerCase();
    const matchesDeliveryDate = !filters.deliveryDate || 
      formatDateTime(order.due_date) === filters.deliveryDate;
    
    return matchesDeliveryStatus && matchesPaymentStatus && matchesDeliveryDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const renderOrderItem = ({ item: order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order ID: {order.id}</Text>
        <Text style={styles.billNumber}>Bill: {order.billnumberinput2 || 'N/A'}</Text>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Garment Type:</Text>
          <Text style={styles.orderValue}>{order.garment_type}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Delivery Status:</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                Alert.alert(
                  'Update Delivery Status',
                  'Select new status:',
                  [
                    { text: 'Pending', onPress: () => updateOrderStatus(order.id, 'pending') },
                    { text: 'Completed', onPress: () => updateOrderStatus(order.id, 'completed') },
                    { text: 'Cancelled', onPress: () => updateOrderStatus(order.id, 'cancelled') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.dropdownButtonText}>{order.status}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Delivery Date:</Text>
          <Text style={styles.orderValue}>{formatDateTime(order.due_date)}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Payment Mode:</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                Alert.alert(
                  'Update Payment Mode',
                  'Select payment mode:',
                  [
                    { text: 'UPI', onPress: () => updatePaymentMode(order.id, 'UPI') },
                    { text: 'Cash', onPress: () => updatePaymentMode(order.id, 'Cash') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.dropdownButtonText}>{order.payment_mode}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Payment Status:</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                Alert.alert(
                  'Update Payment Status',
                  'Select payment status:',
                  [
                    { text: 'Pending', onPress: () => updatePaymentStatus(order.id, 'pending') },
                    { text: 'Paid', onPress: () => updatePaymentStatus(order.id, 'paid') },
                    { text: 'Cancelled', onPress: () => updatePaymentStatus(order.id, 'cancelled') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.dropdownButtonText}>{order.payment_status}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Total Amount:</Text>
          <Text style={[styles.orderValue, styles.totalAmount]}>₹{order.total_amt}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Advance Amount:</Text>
          <Text style={styles.orderValue}>₹{order.payment_amount}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Pending Amount:</Text>
          <Text style={styles.orderValue}>₹{order.total_amt - order.payment_amount}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Customer Mobile:</Text>
          <Text style={styles.orderValue}>{order.customer_mobile || 'N/A'}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Worker Names:</Text>
          <Text style={styles.orderValue}>
            {order.workers?.map(worker => worker.name).join(', ') || 'Not Assigned'}
          </Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Worker Pay:</Text>
          <Text style={styles.orderValue}>₹{order.Work_pay || 'N/A'}</Text>
        </View>

        <TouchableOpacity
          style={styles.assignWorkerButton}
          onPress={() => openWorkerModal(order.id)}
        >
          <Text style={styles.assignWorkerButtonText}>Assign Workers</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Orders Overview</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.screenTitle}>Orders Overview</Text>

        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Order</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Order Number"
              value={searchOrderNumber}
              onChangeText={setSearchOrderNumber}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchOrder}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filters</Text>
          <View style={styles.filtersContainer}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Delivery Status:</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  Alert.alert(
                    'Filter by Delivery Status',
                    'Select status:',
                    [
                      { text: 'All', onPress: () => setFilters(prev => ({ ...prev, deliveryStatus: '' })) },
                      { text: 'Pending', onPress: () => setFilters(prev => ({ ...prev, deliveryStatus: 'pending' })) },
                      { text: 'Completed', onPress: () => setFilters(prev => ({ ...prev, deliveryStatus: 'completed' })) },
                      { text: 'Cancelled', onPress: () => setFilters(prev => ({ ...prev, deliveryStatus: 'cancelled' })) },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={styles.filterButtonText}>
                  {filters.deliveryStatus || 'All'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Payment Status:</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  Alert.alert(
                    'Filter by Payment Status',
                    'Select status:',
                    [
                      { text: 'All', onPress: () => setFilters(prev => ({ ...prev, paymentStatus: '' })) },
                      { text: 'Pending', onPress: () => setFilters(prev => ({ ...prev, paymentStatus: 'pending' })) },
                      { text: 'Paid', onPress: () => setFilters(prev => ({ ...prev, paymentStatus: 'paid' })) },
                      { text: 'Cancelled', onPress: () => setFilters(prev => ({ ...prev, paymentStatus: 'cancelled' })) },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={styles.filterButtonText}>
                  {filters.paymentStatus || 'All'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Orders List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders ({filteredOrders.length})</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading orders...</Text>
          ) : currentOrders.length > 0 ? (
            <FlatList
              data={currentOrders}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noOrdersText}>No orders found.</Text>
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>
            
            <Text style={styles.paginationText}>
              Page {currentPage} of {totalPages}
            </Text>
            
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Worker Assignment Modal */}
      <Modal
        visible={showWorkerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWorkerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Workers</Text>
            
            <ScrollView style={styles.workersList}>
              {workers.map(worker => (
                <TouchableOpacity
                  key={worker.id}
                  style={[
                    styles.workerItem,
                    selectedWorkers[currentOrderId]?.includes(worker.id) && styles.workerItemSelected
                  ]}
                  onPress={() => toggleWorkerSelection(currentOrderId, worker.id)}
                >
                  <Text style={styles.workerName}>{worker.name}</Text>
                  {selectedWorkers[currentOrderId]?.includes(worker.id) && (
                    <Text style={styles.selectedIndicator}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowWorkerModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => assignWorkersToOrder(currentOrderId)}
              >
                <Text style={styles.modalButtonText}>Assign</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filtersContainer: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  filterButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 100,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#34495e',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2980b9',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  billNumber: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  orderDetails: {
    gap: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  orderValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  totalAmount: {
    color: '#27ae60',
    fontSize: 16,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdownButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  assignWorkerButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  assignWorkerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noOrdersText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  paginationButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paginationText: {
    fontSize: 16,
    color: '#34495e',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  workersList: {
    maxHeight: 300,
  },
  workerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 8,
  },
  workerItemSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#27ae60',
  },
  workerName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  selectedIndicator: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#2980b9',
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 