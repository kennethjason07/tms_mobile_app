import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from './DashboardScreen';
import WorkersScreen from './WorkersScreen';
import OrdersOverviewScreen from './OrdersOverviewScreen';
import ShopExpenseScreen from './ShopExpenseScreen';
import WorkerExpenseScreen from './WorkerExpenseScreen';
import CustomerInfoScreen from './CustomerInfoScreen';
import WeeklyPayScreen from './WeeklyPayScreen';
import NewBillScreen from './NewBillScreen';
import WorkerDetailScreen from './WorkerDetailScreen';
import DailyProfitScreen from './DailyProfitScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Workers" component={WorkersScreen} />
        <Stack.Screen name="OrdersOverview" component={OrdersOverviewScreen} />
        <Stack.Screen name="ShopExpense" component={ShopExpenseScreen} />
        <Stack.Screen name="WorkerExpense" component={WorkerExpenseScreen} />
        <Stack.Screen name="CustomerInfo" component={CustomerInfoScreen} />
        <Stack.Screen name="WeeklyPay" component={WeeklyPayScreen} />
        <Stack.Screen name="NewBill" component={NewBillScreen} />
        <Stack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
        <Stack.Screen name="DailyProfit" component={DailyProfitScreen} />
        {/* Add other screens here as you create them:
        <Stack.Screen name="DailyProfit" component={DailyProfitScreen} />
        */}
      </Stack.Navigator>
    </NavigationContainer>
  );

  ///fkjsakdjdfhj
}
