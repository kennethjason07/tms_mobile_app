import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function WorkerDetailScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:5000/api/workers');
      if (response.ok) {
        const data = await response.json();
        setWorkers(data);
      } else {
        // Mock data for testing
        setWorkers([
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' },
          { id: 3, name: 'Mike Johnson' },
          { id: 4, name: 'Sarah Wilson' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      // Mock data for testing
      setWorkers([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Mike Johnson' },
        { id: 4, name: 'Sarah Wilson' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersForWorker = async (workerId) => {
    try {
      setOrdersLoading(true);
      const response = await fetch(`http://127.0.0.1:5000/api/hello?worker_id=${workerId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        // Mock data for testing
        setOrders([
          {
            billnumberinput2: 'BILL001',
            garment_type: 'Shirt',
            order_date: '2024-01-15',
            status: 'Completed',
            Work_pay: 500,
          },
          {
            billnumberinput2: 'BILL002',
            garment_type: 'Pants',
            order_date: '2024-01-16',
            status: 'In Progress',
            Work_pay: 450,
          },
          {
            billnumberinput2: 'BILL003',
            garment_type: 'Dress',
            order_date: '2024-01-17',
            status: 'Pending',
            Work_pay: 600,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Mock data for testing
      setOrders([
        {
          billnumberinput2: 'BILL001',
          garment_type: 'Shirt',
          order_date: '2024-01-15',
          status: 'Completed',
          Work_pay: 500,
        },
        {
          billnumberinput2: 'BILL002',
          garment_type: 'Pants',
          order_date: '2024-01-16',
          status: 'In Progress',
          Work_pay: 450,
        },
        {
          billnumberinput2: 'BILL003',
          garment_type: 'Dress',
          order_date: '2024-01-17',
          status: 'Pending',
          Work_pay: 600,
        },
      ]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleWorkerSelect = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    setSelectedWorker(worker);
    if (workerId) {
      fetchOrdersForWorker(workerId);
    } else {
      setOrders([]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.billNumber}>Bill: {item.billnumberinput2}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Garment Type:</Text>
          <Text style={styles.detailValue}>{item.garment_type}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.order_date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Work Pay:</Text>
          <Text style={styles.workPay}>₹{item.Work_pay}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyOrders = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No orders found for this worker.</Text>
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
        <Text style={styles.headerTitle}>Worker Detailed Overview</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Worker Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Worker</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#2980b9" />
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedWorker?.id || ''}
                onValueChange={handleWorkerSelect}
                style={styles.picker}
              >
                <Picker.Item label="Select a Worker" value="" />
                {workers.map((worker) => (
                  <Picker.Item
                    key={worker.id}
                    label={`${worker.id} - ${worker.name}`}
                    value={worker.id}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Orders Section */}
        {selectedWorker && (
          <View style={styles.section}>
            <View style={styles.ordersHeader}>
              <Text style={styles.sectionTitle}>
                Orders for {selectedWorker.name}
              </Text>
              <Text style={styles.orderCount}>
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {ordersLoading ? (
              <ActivityIndicator size="large" color="#2980b9" style={styles.loader} />
            ) : (
              <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.billnumberinput2}
                ListEmptyComponent={renderEmptyOrders}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {/* Summary Stats */}
        {selectedWorker && orders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>{orders.length}</Text>
                <Text style={styles.summaryLabel}>Total Orders</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>
                  {orders.filter(order => order.status.toLowerCase() === 'completed').length}
                </Text>
                <Text style={styles.summaryLabel}>Completed</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>
                  ₹{orders.reduce((sum, order) => sum + order.Work_pay, 0)}
                </Text>
                <Text style={styles.summaryLabel}>Total Pay</Text>
              </View>
            </View>
          </View>
        )}
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderCount: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  loader: {
    marginVertical: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
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
    marginBottom: 12,
  },
  billNumber: {
    fontSize: 16,
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
    fontWeight: '600',
  },
  orderDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  workPay: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
}); 