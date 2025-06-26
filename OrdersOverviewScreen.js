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
  ActivityIndicator,
} from 'react-native';
import { SupabaseAPI } from './supabase';

export default function OrdersOverviewScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await SupabaseAPI.getOrders();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      Alert.alert('Error', `Failed to load orders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(order => 
      order.billnumberinput2?.toString().includes(searchQuery) ||
      order.garment_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.bills?.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadOrders();
      return;
    }

    try {
      setLoading(true);
      const data = await SupabaseAPI.searchOrders(searchQuery);
      setFilteredOrders(data);
    } catch (error) {
      Alert.alert('Error', `Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await SupabaseAPI.updateOrderStatus(orderId, newStatus);
      loadOrders(); // Reload to get updated data
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMode = async (orderId, newPaymentMode) => {
    try {
      setLoading(true);
      await SupabaseAPI.updatePaymentMode(orderId, newPaymentMode);
      loadOrders(); // Reload to get updated data
      Alert.alert('Success', 'Payment mode updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update payment mode: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#27ae60';
      case 'in progress':
        return '#f39c12';
      case 'pending':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '#27ae60';
      case 'partial':
        return '#f39c12';
      case 'unpaid':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>
          #{item.billnumberinput2 || item.id}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.customerName}>
        {item.bills?.customer_name || 'Unknown Customer'}
      </Text>

      <View style={styles.orderDetails}>
        <Text style={styles.garmentType}>{item.garment_type}</Text>
        <Text style={styles.amount}>₹{item.total_amt}</Text>
      </View>

      <View style={styles.orderFooter}>
        <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(item.payment_status) }]}>
          <Text style={styles.paymentText}>{item.payment_status}</Text>
        </View>
        <Text style={styles.date}>
          Due: {new Date(item.due_date).toLocaleDateString()}
        </Text>
      </View>

      {item.order_worker_association && item.order_worker_association.length > 0 && (
        <View style={styles.workersContainer}>
          <Text style={styles.workersLabel}>Workers:</Text>
          {item.order_worker_association.map((assignment, index) => (
            <Text key={index} style={styles.workerName}>
              {assignment.workers?.name}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders Overview</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by bill number, customer, or status..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredOrders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {filteredOrders.filter(o => o.status?.toLowerCase() === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {filteredOrders.filter(o => o.payment_status?.toLowerCase() === 'paid').length}
          </Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadOrders}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Order Information</Text>
                  <Text style={styles.detailText}>Order #: {selectedOrder.billnumberinput2 || selectedOrder.id}</Text>
                  <Text style={styles.detailText}>Garment: {selectedOrder.garment_type}</Text>
                  <Text style={styles.detailText}>Status: {selectedOrder.status}</Text>
                  <Text style={styles.detailText}>Amount: ₹{selectedOrder.total_amt}</Text>
                  <Text style={styles.detailText}>Payment: {selectedOrder.payment_status}</Text>
                  <Text style={styles.detailText}>Mode: {selectedOrder.payment_mode}</Text>
                  <Text style={styles.detailText}>Order Date: {new Date(selectedOrder.order_date).toLocaleDateString()}</Text>
                  <Text style={styles.detailText}>Due Date: {new Date(selectedOrder.due_date).toLocaleDateString()}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                  <Text style={styles.detailText}>Name: {selectedOrder.bills?.customer_name}</Text>
                  <Text style={styles.detailText}>Phone: {selectedOrder.bills?.mobile_number}</Text>
                </View>

                {selectedOrder.order_worker_association && selectedOrder.order_worker_association.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Assigned Workers</Text>
                    {selectedOrder.order_worker_association.map((assignment, index) => (
                      <Text key={index} style={styles.detailText}>
                        {assignment.workers?.name} - ₹{assignment.workers?.Rate}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Quick Actions</Text>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setModalVisible(false);
                      Alert.alert(
                        'Update Status',
                        'Select new status:',
                        [
                          { text: 'Pending', onPress: () => handleUpdateStatus(selectedOrder.id, 'Pending') },
                          { text: 'In Progress', onPress: () => handleUpdateStatus(selectedOrder.id, 'In Progress') },
                          { text: 'Completed', onPress: () => handleUpdateStatus(selectedOrder.id, 'Completed') },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.actionButtonText}>Update Status</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setModalVisible(false);
                      Alert.alert(
                        'Update Payment Mode',
                        'Select payment mode:',
                        [
                          { text: 'Cash', onPress: () => handleUpdatePaymentMode(selectedOrder.id, 'Cash') },
                          { text: 'Card', onPress: () => handleUpdatePaymentMode(selectedOrder.id, 'Card') },
                          { text: 'UPI', onPress: () => handleUpdatePaymentMode(selectedOrder.id, 'UPI') },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.actionButtonText}>Update Payment Mode</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
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
  headerRight: {
    width: 60,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  garmentType: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  workersContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  workersLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  workerName: {
    fontSize: 12,
    color: '#2980b9',
    marginLeft: 8,
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
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#2980b9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 