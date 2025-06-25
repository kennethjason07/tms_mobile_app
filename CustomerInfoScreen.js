import React, { useState } from 'react';
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
} from 'react-native';

export default function CustomerInfoScreen({ navigation }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchCustomer = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/customer-info/${mobileNumber}`);
      if (!response.ok) {
        throw new Error('No data found for the provided mobile number.');
      }
      const data = await response.json();
      
      setCustomerData(data);
      setOrderHistory(data.order_history || []);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      Alert.alert('Error', 'No orders found for this customer.');
      setCustomerData(null);
      setOrderHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order ID: {item.id}</Text>
        <Text style={styles.billNumber}>Bill: {item.billnumberinput2}</Text>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Garment Type:</Text>
          <Text style={styles.orderValue}>{item.garment_type}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Status:</Text>
          <Text style={[styles.orderValue, styles.statusText]}>{item.status}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Order Date:</Text>
          <Text style={styles.orderValue}>{formatDateTime(item.order_date)}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Due Date:</Text>
          <Text style={styles.orderValue}>{formatDateTime(item.due_date)}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Payment Mode:</Text>
          <Text style={styles.orderValue}>{item.payment_mode}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Payment Status:</Text>
          <Text style={[styles.orderValue, styles.paymentStatus]}>{item.payment_status}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Advance Amount:</Text>
          <Text style={styles.orderValue}>₹{item.payment_amount}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Total Amount:</Text>
          <Text style={[styles.orderValue, styles.totalAmount]}>₹{item.total_amt}</Text>
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
        <Text style={styles.headerTitle}>Customer Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.screenTitle}>Customer Information</Text>

        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Customer</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter mobile number"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <TouchableOpacity 
              style={[styles.searchButton, loading && styles.searchButtonDisabled]}
              onPress={searchCustomer}
              disabled={loading}
            >
              <Text style={styles.searchButtonText}>
                {loading ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Data Display */}
        {customerData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <View style={styles.customerInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer Name:</Text>
                <Text style={styles.infoValue}>{customerData.customer_name || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile Number:</Text>
                <Text style={styles.infoValue}>{customerData.mobile_number || 'N/A'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order History */}
        {orderHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order History</Text>
            <Text style={styles.orderCount}>Total Orders: {orderHistory.length}</Text>
            <FlatList
              data={orderHistory}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* No Orders Message */}
        {customerData && orderHistory.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order History</Text>
            <Text style={styles.noOrdersText}>No orders found for this customer.</Text>
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
  searchButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  customerInfo: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  orderCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 12,
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
    gap: 6,
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
  },
  orderValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  statusText: {
    color: '#e74c3c',
  },
  paymentStatus: {
    color: '#f39c12',
  },
  totalAmount: {
    color: '#27ae60',
    fontSize: 16,
  },
  noOrdersText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 