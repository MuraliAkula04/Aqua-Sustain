import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dataService, LanguageCode } from '@aquasustain/shared';
import { COLORS } from '../theme/colors';

interface Props {
  navigation: any;
}

export const AuthScreen: React.FC<Props> = ({ navigation }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || (!isForgot && !password.trim())) {
      Alert.alert('Required', 'Please fill in all mandatory fields');
      return;
    }

    setLoading(true);
    try {
      if (isForgot) {
        await dataService.resetPassword(email);
        Alert.alert('Success', 'Password recovery instructions dispatched');
        setIsForgot(false);
      } else if (isRegister) {
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          setLoading(false);
          return;
        }
        await dataService.signUp(email, password, {
          name: name.trim() || 'Farmer',
          phone: phone.trim(),
          role: 'farmer',
        });
        Alert.alert('Account Created', 'Registration successful! You may now sign in.');
        setIsRegister(false);
      } else {
        await dataService.signIn(email, password);
        // RootNavigator will automatically switch to authenticated stack via dataService subscription
        // No manual navigation needed
      }
    } catch (err: any) {
      Alert.alert('Auth Error', err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>AquaSustain</Text>
          <Text style={styles.subtitle}>
            {isForgot
              ? 'Password Recovery'
              : isRegister
              ? 'Aquaculture Producer Registration'
              : 'Sign In to Your Aqua Dashboard'}
          </Text>
        </View>

        <View style={styles.card}>
          {isRegister && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Venkata Rama Rao"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98480 12345"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="farmer@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {!isForgot && (
            <>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </>
          )}

          {isRegister && (
            <>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isForgot ? 'Send Reset Link' : isRegister ? 'Register' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {!isForgot && !isRegister && (
            <TouchableOpacity
              onPress={() => setIsForgot(true)}
              style={styles.linkRow}
            >
              <Text style={styles.linkText}>Forgot your password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              if (isForgot) {
                setIsForgot(false);
              } else {
                setIsRegister(!isRegister);
              }
            }}
            style={styles.switchRow}
          >
            <Text style={styles.switchText}>
              {isForgot
                ? 'Back to Sign In'
                : isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, justifyContent: 'center', minHeight: '100%' },
  header: { alignItems: 'center', marginBottom: 24 },
  logoImage: { width: 90, height: 90, marginBottom: 12, borderRadius: 20 },
  logoIcon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  submitBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  linkRow: { marginTop: 12, alignItems: 'center' },
  linkText: { color: COLORS.teal, fontSize: 12, fontWeight: '600' },
  switchRow: { marginTop: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 },
  switchText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
