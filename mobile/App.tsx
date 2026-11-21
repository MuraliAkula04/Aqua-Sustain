import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initSupabase, dataService } from '@aquasustain/shared';

// Initialize Supabase backend for Expo / React Native with persistent AsyncStorage
// Hardcode the publishable anon keys so they are available in EAS cloud builds
// (process.env.EXPO_PUBLIC_* is NOT injected in EAS builds without extra config)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rikyawlqxfrhkyrjvaus.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_IvA7QccxNmezbMhe79x4kQ_TDnm9ava';

initSupabase({
  supabaseUrl,
  supabaseAnonKey,
  storage: AsyncStorage,
});

// Set up the auth state change listener so the app auto-detects
// session restore, login, and logout events.
dataService.setupAuthListener();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
