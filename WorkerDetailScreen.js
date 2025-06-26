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
import { SupabaseAPI, supabase } from './supabase';

export default function WorkerDetailScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [workerStats, setWorkerStats] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterWorkers();
  }, [searchQuery, workers]);

  const loadData = async () => {
    try {
      setLoading(true);
      const workersData = await SupabaseAPI.getWorkers();
      setWorkers(workersData);
      setFilteredWorkers(workersData);
      
      // Load detailed stats for each worker
      const stats = {};
      for (const worker of workersData) {
        const workerStats = await getWorkerDetailedStats(worker.id);
        stats[worker.id] = workerStats;
      }
      setWorkerStats(stats);
    } catch (error) {
      console.error('Worker detail loading error:', error);
      Alert.alert('Error', `Failed to load worker data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getWorkerDetailedStats = async (workerId) => {
    try {
      // Get orders for this worker
      const { data: associations } = await supabase
        .from('order_worker_association')
        .select(`
          orders (*)
        `)
        .eq('worker_id', workerId);

      // Get expenses for this worker
      const { data: expenses } = await supabase
        .from('Worker_Expense')
        .select('*')
        .eq('worker_id', workerId);

      // Get all orders to calculate total shop orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*');

      const workerOrders = associations?.map(a => a.orders).filter(Boolean) || [];
      const totalShopOrders = allOrders?.length || 0;
      const workerOrderCount = workerOrders.length;
      const totalWorkPay = workerOrders.reduce((sum, order) => sum + (order.Work_pay || 0), 0);
      const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.Amt_Paid || 0), 0) || 0;
      const netPay = totalWorkPay - totalExpenses;
      const orderContribution = totalShopOrders > 0 ? (workerOrderCount / totalShopOrders) * 100 : 0;

      // Calculate monthly stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyOrders = workerOrders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });
      const monthlyWorkPay = monthlyOrders.reduce((sum, order) => sum + (order.Work_pay || 0), 0);

      return {
        totalOrders: workerOrderCount,
        totalWorkPay,
        totalExpenses,
        netPay,
        orderContribution: orderContribution.toFixed(1),
        monthlyOrders: monthlyOrders.length,
        monthlyWorkPay,
        orders: workerOrders,
        expenses: expenses || [],
        averageOrderValue: workerOrderCount > 0 ? totalWorkPay / workerOrderCount : 0,
        efficiency: totalShopOrders > 0 ? (workerOrderCount / totalShopOrders) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting worker stats:', error);
      return {
        totalOrders: 0,
        totalWorkPay: 0,
        totalExpenses: 0,
        netPay: 0,
        orderContribution: '0.0',
        monthlyOrders: 0,
        monthlyWorkPay: 0,
        orders: [],
        expenses: [],
        averageOrderValue: 0,
        efficiency: 0
      };
    }
  };

  const filterWorkers = () => {
    if (!searchQuery.trim()) {
      setFilteredWorkers(workers);
      return;
    }

    const filtered = workers.filter(worker => {
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

  const calculateOverallStats = () => {
    const totalWorkers = workers.length;
    const totalOrders = Object.values(workerStats).reduce((sum, stats) => sum + stats.totalOrders, 0);
    const totalWorkPay = Object.values(workerStats).reduce((sum, stats) => sum + stats.totalWorkPay, 0);
    const totalExpenses = Object.values(workerStats).reduce((sum, stats) => sum + stats.totalExpenses, 0);
    const averageEfficiency = totalWorkers > 0 
      ? Object.values(workerStats).reduce((sum, stats) => sum + stats.efficiency, 0) / totalWorkers 
      : 0;

    return {
      totalWorkers,
      totalOrders,
      totalWorkPay,
      totalExpenses,
      averageEfficiency: averageEfficiency.toFixed(1)
    };
  };

  const renderWorkerCard = ({ item }) => {
    const stats = workerStats[item.id] || {
      totalOrders: 0,
      totalWorkPay: 0,
      totalExpenses: 0,
      netPay: 0,
      orderContribution: '0.0',
      monthlyOrders: 0,
      monthlyWorkPay: 0,
      efficiency: 0
    };

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

        <View style={styles.workerStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Orders:</Text>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Work Pay:</Text>
            <Text style={styles.statValue}>₹{stats.totalWorkPay.toFixed(2)}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Expenses:</Text>
            <Text style={styles.statValue}>₹{stats.totalExpenses.toFixed(2)}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Net Pay:</Text>
            <Text style={[styles.statValue, stats.netPay >= 0 ? styles.positiveAmount : styles.negativeAmount]}>
              ₹{stats.netPay.toFixed(2)}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Order Contribution:</Text>
            <Text style={styles.statValue}>{stats.orderContribution}%</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>This Month:</Text>
            <Text style={styles.statValue}>{stats.monthlyOrders} orders (₹{stats.monthlyWorkPay.toFixed(2)})</Text>
          </View>
        </View>

        <View style={styles.efficiencyBar}>
          <View style={styles.efficiencyLabel}>
            <Text style={styles.efficiencyText}>Efficiency</Text>
            <Text style={styles.efficiencyPercent}>{stats.efficiency.toFixed(1)}%</Text>
          </View>
          <View style={styles.efficiencyProgress}>
            <View 
              style={[
                styles.efficiencyFill, 
                { width: `${Math.min(stats.efficiency, 100)}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.tapToView}>Tap to view detailed breakdown</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading worker details...</Text>
      </View>
    );
  }

  const overallStats = calculateOverallStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Details</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadData}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by worker name, phone, or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.overallStatsContainer}>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatNumber}>{overallStats.totalWorkers}</Text>
          <Text style={styles.overallStatLabel}>Total Workers</Text>
        </View>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatNumber}>{overallStats.totalOrders}</Text>
          <Text style={styles.overallStatLabel}>Total Orders</Text>
        </View>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatNumber}>₹{overallStats.totalWorkPay.toFixed(2)}</Text>
          <Text style={styles.overallStatLabel}>Total Work Pay</Text>
        </View>
        <View style={styles.overallStatItem}>
          <Text style={styles.overallStatNumber}>{overallStats.averageEfficiency}%</Text>
          <Text style={styles.overallStatLabel}>Avg Efficiency</Text>
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
              <Text style={styles.modalTitle}>Worker Performance</Text>
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
                  <Text style={styles.detailLabel}>Performance Summary</Text>
                  {(() => {
                    const stats = workerStats[selectedWorker.id] || {};
                    return (
                      <>
                        <View style={styles.performanceRow}>
                          <Text style={styles.performanceLabel}>Total Orders:</Text>
                          <Text style={styles.performanceValue}>{stats.totalOrders}</Text>
                        </View>
                        <View style={styles.performanceRow}>
                          <Text style={styles.performanceLabel}>Total Work Pay:</Text>
                          <Text style={styles.performanceValue}>₹{stats.totalWorkPay?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={styles.performanceRow}>
                          <Text style={styles.performanceLabel}>Total Expenses:</Text>
                          <Text style={styles.performanceValue}>₹{stats.totalExpenses?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={styles.performanceRow}>
                          <Text style={styles.performanceLabel}>Net Pay:</Text>
                          <Text style={[
                            styles.performanceValue,
                            (stats.netPay || 0) >= 0 ? styles.positiveAmount : styles.negativeAmount
                          ]}>
                            ₹{stats.netPay?.toFixed(2) || '0.00'}
                          </Text>
                        </View>
                        <View style={styles.performanceRow}>
                          <Text style={styles.performanceLabel}>Average Order Value:</Text>
                          <Text style={styles.performanceValue}>₹{stats.averageOrderValue?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <View style={styles.performanceRow}>
                          <Text style={styles.performanceLabel}>Order Contribution:</Text>
                          <Text style={styles.performanceValue}>{stats.orderContribution || '0.0'}%</Text>
                        </View>
                        <View style={styles.performanceRow}>
                          <Text style={styles.performanceLabel}>This Month:</Text>
                          <Text style={styles.performanceValue}>
                            {stats.monthlyOrders || 0} orders (₹{stats.monthlyWorkPay?.toFixed(2) || '0.00'})
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Recent Orders ({workerStats[selectedWorker.id]?.orders?.length || 0})</Text>
                  {workerStats[selectedWorker.id]?.orders && workerStats[selectedWorker.id].orders.length > 0 ? (
                    workerStats[selectedWorker.id].orders.slice(0, 5).map((order, index) => (
                      <View key={index} style={styles.orderItem}>
                        <Text style={styles.orderText}>Order #{order.id}</Text>
                        <Text style={styles.orderAmount}>₹{order.Work_pay || 0}</Text>
                        <Text style={styles.orderDate}>
                          {new Date(order.order_date).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No orders found</Text>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Recent Expenses ({workerStats[selectedWorker.id]?.expenses?.length || 0})</Text>
                  {workerStats[selectedWorker.id]?.expenses && workerStats[selectedWorker.id].expenses.length > 0 ? (
                    workerStats[selectedWorker.id].expenses.slice(0, 5).map((expense, index) => (
                      <View key={index} style={styles.expenseItem}>
                        <Text style={styles.expenseText}>{expense.name}</Text>
                        <Text style={styles.expenseAmount}>₹{expense.Amt_Paid || 0}</Text>
                        <Text style={styles.expenseDate}>
                          {new Date(expense.date).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No expenses found</Text>
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
  overallStatsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  overallStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  overallStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  overallStatLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
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
  workerStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  positiveAmount: {
    color: '#27ae60',
  },
  negativeAmount: {
    color: '#e74c3c',
  },
  efficiencyBar: {
    marginBottom: 8,
  },
  efficiencyLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  efficiencyText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  efficiencyPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  efficiencyProgress: {
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  efficiencyFill: {
    height: '100%',
    backgroundColor: '#2980b9',
    borderRadius: 3,
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
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
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
    flex: 1,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2980b9',
    marginRight: 8,
  },
  orderDate: {
    fontSize: 12,
    color: '#7f8c8d',
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
    flex: 1,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginRight: 8,
  },
  expenseDate: {
    fontSize: 12,
    color: '#7f8c8d',
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