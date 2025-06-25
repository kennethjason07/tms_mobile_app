import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const NAV_ITEMS = [
  { label: 'New Bill', desc: 'Create and manage new customer bills', screen: 'NewBillScreen' },
  { label: 'Customer Information', desc: 'View and manage customer details', screen: 'CustomerInfo' },
  { label: 'Orders Overview', desc: 'Track and manage all orders', screen: 'OrdersOverview' },
  { label: 'Shop Expenses', desc: 'Manage shop expenses and costs', screen: 'ShopExpense' },
  { label: 'Worker Expenses', desc: 'Track worker payments and expenses', screen: 'WorkerExpense' },
  { label: 'Weekly Pay Calculation', desc: 'Calculate worker weekly payments', screen: 'WeeklyPay' },
  { label: 'Worker Detailed Overview', desc: 'View detailed worker performance', screen: 'WorkerDetail' },
  { label: 'Daily Profit', desc: 'Track daily and monthly profits', screen: 'DailyProfit' },
];

export default function DashboardScreen({ navigation }) {
  const handleNavigation = (screenName) => {
    if (navigation?.navigate) {
      if (screenName === 'NewBillScreen') {
        navigation.navigate('NewBillScreen');
      } else if (screenName === 'CustomerInfo') {
        navigation.navigate('CustomerInfoScreen');
      } else if (screenName === 'OrdersOverview') {
        navigation.navigate('OrdersOverviewScreen');
      } else if (screenName === 'ShopExpense') {
        navigation.navigate('ShopExpenseScreen');
      } else if (screenName === 'WorkerExpense') {
        navigation.navigate('WorkerExpenseScreen');
      } else if (screenName === 'WeeklyPay') {
        navigation.navigate('WeeklyPayScreen');
      } else if (screenName === 'WorkerDetail') {
        navigation.navigate('WorkerDetailScreen');
      } else if (screenName === 'DailyProfit') {
        navigation.navigate('DailyProfitScreen');
      } else {
        // For other screens that haven't been created yet, show an alert
        alert(`${screenName} screen is coming soon!`);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
          <Text style={styles.companyName}>Starset Consultancy Services</Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.main}>
        <Text style={styles.dashboardTitle}>Dashboard</Text>
        <View style={styles.navigationGrid}>
          {NAV_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={styles.navCard}
              onPress={() => handleNavigation(item.screen)}
              activeOpacity={0.8}
            >
              <Text style={styles.navCardTitle}>{item.label}</Text>
              <Text style={styles.navCardDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
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
  headerLogo: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 60, height: 60, marginRight: 12, resizeMode: 'contain' },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#34495e' },
  main: { padding: 20 },
  dashboardTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  navCard: {
    width: '47%',
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
  navCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2980b9', marginBottom: 6 },
  navCardDesc: { fontSize: 14, color: '#7f8c8d' },
}); 