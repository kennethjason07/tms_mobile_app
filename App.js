import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from './DashboardScreen';
import NewBillScreen from './NewBillScreen';
import CustomerInfoScreen from './CustomerInfoScreen';
import OrdersOverviewScreen from './OrdersOverviewScreen';
import ShopExpenseScreen from './ShopExpenseScreen';
import WorkerExpenseScreen from './WorkerExpenseScreen';
import WeeklyPayScreen from './WeeklyPayScreen';
import WorkerDetailScreen from './WorkerDetailScreen';
import DailyProfitScreen from './DailyProfitScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="NewBillScreen" component={NewBillScreen} />
        <Stack.Screen name="CustomerInfoScreen" component={CustomerInfoScreen} />
        <Stack.Screen name="OrdersOverviewScreen" component={OrdersOverviewScreen} />
        <Stack.Screen name="ShopExpenseScreen" component={ShopExpenseScreen} />
        <Stack.Screen name="WorkerExpenseScreen" component={WorkerExpenseScreen} />
        <Stack.Screen name="WeeklyPayScreen" component={WeeklyPayScreen} />
        <Stack.Screen name="WorkerDetailScreen" component={WorkerDetailScreen} />
        <Stack.Screen name="DailyProfitScreen" component={DailyProfitScreen} />
        {/* Add other screens here, e.g.:
        <Stack.Screen name="DailyProfit" component={DailyProfitScreen} />
        */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
