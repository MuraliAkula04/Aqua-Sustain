import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { dataService, getTranslation } from '@aquasustain/shared';

import { FarmerDashboardScreen } from '../screens/FarmerDashboardScreen';
import { PondAssessmentScreen } from '../screens/PondAssessmentScreen';
import { WaterQualityScreen } from '../screens/WaterQualityScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { WeatherScreen } from '../screens/WeatherScreen';
import { LearningScreen } from '../screens/LearningScreen';
import { RemindersScreen } from '../screens/RemindersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { PondRegistrationScreen } from '../screens/PondRegistrationScreen';
import { FarmRegistrationScreen } from '../screens/FarmRegistrationScreen';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Bottom tab navigator — only shown when authenticated
const BottomTabNavigator = () => {
  const [lang, setLang] = useState(dataService.getCurrentUser().preferredLanguage);

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setLang(dataService.getCurrentUser().preferredLanguage);
    });
    return () => unsub();
  }, []);

  const t = (k: string) => getTranslation(lang, k);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.teal,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={FarmerDashboardScreen}
        options={{
          tabBarLabel: t('tabHome'),
          tabBarIcon: () => <Text style={{ fontSize: 16 }}>🏡</Text>,
        }}
      />
      <Tab.Screen
        name="Assessment"
        component={PondAssessmentScreen}
        options={{
          tabBarLabel: t('tabDiagnose'),
          tabBarIcon: () => <Text style={{ fontSize: 16 }}>🩺</Text>,
        }}
      />
      <Tab.Screen
        name="WaterQuality"
        component={WaterQualityScreen}
        options={{
          tabBarLabel: t('tabWater'),
          tabBarIcon: () => <Text style={{ fontSize: 16 }}>💧</Text>,
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: t('tabFeed'),
          tabBarIcon: () => <Text style={{ fontSize: 16 }}>⚖️</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabSettings'),
          tabBarIcon: () => <Text style={{ fontSize: 16 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

// Stack navigator shown when authenticated
const AuthenticatedNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '800', fontSize: 16 },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: 'Farm Expenses' }}
      />
      <Stack.Screen
        name="Weather"
        component={WeatherScreen}
        options={{ title: 'Coastal Weather Forecast' }}
      />
      <Stack.Screen
        name="Learning"
        component={LearningScreen}
        options={{ title: 'Knowledge Center' }}
      />
      <Stack.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{ title: 'Task Reminders' }}
      />
      <Stack.Screen
        name="FarmRegistration"
        component={FarmRegistrationScreen}
        options={{ title: 'Register Farm', headerShown: true }}
      />
      <Stack.Screen
        name="PondRegistration"
        component={PondRegistrationScreen}
        options={{ title: 'Register Pond', headerShown: true }}
      />
    </Stack.Navigator>
  );
};

// Stack navigator shown when NOT authenticated
const UnauthenticatedNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
};

// Root navigator: switches between auth and main app based on auth state
export const RootNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(dataService.isAuthenticated());

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setIsAuthenticated(dataService.isAuthenticated());
    });
    return () => unsub();
  }, []);

  // Show ONLY auth screen until user is logged in
  if (!isAuthenticated) {
    return <UnauthenticatedNavigator />;
  }

  return <AuthenticatedNavigator />;
};
