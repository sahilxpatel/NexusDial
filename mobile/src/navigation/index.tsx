import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import { Phone, Users, LayoutDashboard, Settings } from 'lucide-react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CallLogScreen from '../screens/CallLogScreen';
import CallDetailScreen from '../screens/CallDetailScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ContactTimelineScreen from '../screens/ContactTimelineScreen';
import SimulateCallScreen from '../screens/SimulateCallScreen';
import { useSocket } from '../hooks/useSocket';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const CallStack = createStackNavigator();
const ContactStack = createStackNavigator();
const SettingsStack = createStackNavigator();

function CallNavigator() {
  return (
    <CallStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <CallStack.Screen name="CallLog" component={CallLogScreen} options={{ title: 'Calls' }} />
      <CallStack.Screen name="CallDetail" component={CallDetailScreen} options={{ title: 'Call Details' }} />
    </CallStack.Navigator>
  );
}

function ContactNavigator() {
  return (
    <ContactStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <ContactStack.Screen name="ContactsList" component={ContactsScreen} options={{ title: 'Contacts' }} />
      <ContactStack.Screen name="ContactTimeline" component={ContactTimelineScreen} options={{ title: 'Timeline' }} />
    </ContactStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
      <SettingsStack.Screen name="SimulateCall" component={SimulateCallScreen} options={{ title: 'Simulate Call' }} />
    </SettingsStack.Navigator>
  );
}

function TabNavigator() {
  // Initialize socket connections only when authenticated
  useSocket();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} /> }} 
      />
      <Tab.Screen 
        name="Calls" 
        component={CallNavigator} 
        options={{ tabBarIcon: ({ color }) => <Phone color={color} size={24} /> }} 
      />
      <Tab.Screen 
        name="Contacts" 
        component={ContactNavigator} 
        options={{ tabBarIcon: ({ color }) => <Users color={color} size={24} /> }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsNavigator} 
        options={{ tabBarIcon: ({ color }) => <Settings color={color} size={24} /> }} 
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { accessToken } = useAuthStore();

  return (
    <NavigationContainer>
      {accessToken ? (
        <TabNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
