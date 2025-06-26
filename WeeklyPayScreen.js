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

export default function WeeklyPayScreen({ navigation }) {
  const [weeklyData, setWeeklyData] = useState({});
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('current');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterWorkers();
  }, [searchQuery, weeklyData]);

  const loadData = async () => {
    try {
      setLoading(true);
      const weeklyPayData = await SupabaseAPI.getWorkerWeeklyPay();
      setWeeklyData(weeklyPayData);
      
      // Convert to array for filtering
      const workersArray = Object.values(weeklyPayData).map(workerData => ({
        ...workerData.worker,
        weeklyData: workerData
      }));
      setFilteredWorkers(workersArray);
    } catch (error) {
      console.error('Weekly pay loading error:', error);
      Alert.alert('Error', `Failed to load weekly pay data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterWorkers = () => {
    if (!searchQuery.trim()) {
      const workersArray = Object.values(weeklyData).map(workerData => ({
        ...workerData.worker,
        weeklyData: workerData
      }));
      setFilteredWorkers(workersArray);
      return;
    }

    const filtered = Object.values(weeklyData)
      .map(workerData => ({
        ...workerData.worker,
        weeklyData: workerData
      }))
      .filter(worker => {
        return (
          worker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          worker.phone?.includes(searchQuery) ||
          worker.id?.toString().includes(searchQuery)
        );
      });
    setFilteredWorkers(filtered);
  };

  const showWorkerDetail = (worker) => {
    setSelectedWorker(worker);
    setDetailModalVisible(true);
  };

  const calculateTotalWeeklyPay = () => {
    return Object.values(weeklyData).reduce((total, workerData) => {
      return total + (workerData.total_work_pay || 0);
    }, 0);
  };

  const calculateTotalPaid = () => {
    return Object.values(weeklyData).reduce((total, workerData) => {
      return total + (workerData.total_paid || 0);
    }, 0);
  };

  const calculateTotalPending = () => {
    return calculateTotalWeeklyPay() - calculateTotalPaid();
  };

  const getWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek.toLocaleDateString(),
      end: endOfWeek.toLocaleDateString()
    };
  };

  const renderWorkerCard = ({ item }) => {
    const workerData = item.weeklyData;
    const totalWorkPay = workerData.total_work_pay || 0;
    const totalPaid = workerData.total_paid || 0;
    const pendingAmount = totalWorkPay - totalPaid;
    
    return (
      <TouchableOpacity
        style={styles.workerCard}
        onPress={() => showWorkerDetail(item)}
        activeOpacity={0.8}
      >
        <View style={styles.workerHeader}>
          <Text style={styles.workerName}>{item.name}</Text>
          <View style={styles.workerIdContainer}>
            <Text style={styles.workerId}>#{item.id}</Text>
          </View>
        </View>

        <View style={styles.paySummary}>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Total Work Pay:</Text>
            <Text style={styles.payAmount}>₹{totalWorkPay.toFixed(2)}</Text>
          </View>

          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Total Paid:</Text>
            <Text style={[styles.payAmount, styles.paidAmount]}>₹{totalPaid.toFixed(2)}</Text>
          </View>

          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Pending:</Text>
            <Text style={[styles.payAmount, pendingAmount > 0 ? styles.pendingAmount : styles.zeroAmount]}>
              ₹{pendingAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{workerData.orders?.length || 0}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{workerData.expenses?.length || 0}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.phone || 'N/A'}</Text>
            <Text style={styles.statLabel}>Phone</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.tapToView}>Tap to view details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && Object.keys(weeklyData).length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Calculating weekly pay...</Text>
      </View>
    );
  }

  const weekRange = getWeekRange();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Pay</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadData}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekInfo}>
        <Text style={styles.weekTitle}>Week of {weekRange.start} - {weekRange.end}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by worker name, phone, or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredWorkers.length}</Text>
          <Text style={styles.statLabel}>Active Workers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>₹{calculateTotalWeeklyPay().toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Pay</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>₹{calculateTotalPending().toFixed(2)}</Text>
          <Text style={[styles.statLabel, calculateTotalPending() > 0 && styles.pendingLabel]}>
            Pending
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredWorkers}
        renderItem={renderWorkerCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadData}
        showsVerticalScrollIndicator={false}
      />

      {/* Worker Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Worker Pay Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedWorker && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Worker Information</Text>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerDetailName}>{selectedWorker.name}</Text>
                    <Text style={styles.workerDetailId}>ID: #{selectedWorker.id}</Text>
                    <Text style={styles.workerDetailPhone}>Phone: {selectedWorker.phone || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Pay Summary</Text>
                  <View style={styles.payDetailRow}>
                    <Text style={styles.payDetailLabel}>Total Work Pay:</Text>
                    <Text style={styles.payDetailAmount}>
                      ₹{(selectedWorker.weeklyData.total_work_pay || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.payDetailRow}>
                    <Text style={styles.payDetailLabel}>Total Paid:</Text>
                    <Text style={styles.payDetailAmount}>
                      ₹{(selectedWorker.weeklyData.total_paid || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.payDetailRow}>
                    <Text style={styles.payDetailLabel}>Pending Amount:</Text>
                    <Text style={[
                      styles.payDetailAmount,
                      (selectedWorker.weeklyData.total_work_pay - selectedWorker.weeklyData.total_paid) > 0 
                        ? styles.pendingDetailAmount 
                        : styles.zeroDetailAmount
                    ]}>
                      ₹{((selectedWorker.weeklyData.total_work_pay || 0) - (selectedWorker.weeklyData.total_paid || 0)).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Orders ({selectedWorker.weeklyData.orders?.length || 0})</Text>
                  {selectedWorker.weeklyData.orders && selectedWorker.weeklyData.orders.length > 0 ? (
                    selectedWorker.weeklyData.orders.map((order, index) => (
                      <View key={index} style={styles.orderItem}>
                        <Text style={styles.orderText}>Order #{order.id}</Text>
                        <Text style={styles.orderAmount}>₹{order.Work_pay || 0}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No orders this week</Text>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Expenses ({selectedWorker.weeklyData.expenses?.length || 0})</Text>
                  {selectedWorker.weeklyData.expenses && selectedWorker.weeklyData.expenses.length > 0 ? (
                    selectedWorker.weeklyData.expenses.map((expense, index) => (
                      <View key={index} style={styles.expenseItem}>
                        <Text style={styles.expenseText}>{expense.name}</Text>
                        <Text style={styles.expenseAmount}>₹{expense.Amt_Paid || 0}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No expenses this week</Text>
                  )}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeDetailButton]}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.closeDetailButtonText}>Close</Text>
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
  refreshButton: {
    backgroundColor: '#2980b9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekInfo: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2980b9',
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  pendingLabel: {
    color: '#e74c3c',
  },
  listContainer: {
    padding: 16,
  },
  workerCard: {
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
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  workerIdContainer: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workerId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  paySummary: {
    marginBottom: 12,
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  payLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  payAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  paidAmount: {
    color: '#27ae60',
  },
  pendingAmount: {
    color: '#e74c3c',
  },
  zeroAmount: {
    color: '#7f8c8d',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
    alignItems: 'center',
  },
  tapToView: {
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
  detailSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  workerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  workerDetailName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workerDetailId: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  workerDetailPhone: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  payDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payDetailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  payDetailAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  pendingDetailAmount: {
    color: '#e74c3c',
  },
  zeroDetailAmount: {
    color: '#7f8c8d',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 4,
  },
  orderText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    marginBottom: 4,
  },
  expenseText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  noDataText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
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
  closeDetailButton: {
    backgroundColor: '#2980b9',
  },
  closeDetailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 