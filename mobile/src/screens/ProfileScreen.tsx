import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dataService, getTranslation, LanguageCode } from '@aquasustain/shared';
import { COLORS } from '../theme/colors';

export const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [user, setUser] = useState(dataService.getCurrentUser());
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(user.preferredLanguage);
  const [savingProfile, setSavingProfile] = useState(false);

  // Editable profile state
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [village, setVillage] = useState(user.village || '');
  const [district, setDistrict] = useState(user.district || '');

  // Subscribe to dataService changes
  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      const u = dataService.getCurrentUser();
      setUser({ ...u });
      setSelectedLang(u.preferredLanguage);
    });
    return () => unsub();
  }, []);

  const lang = selectedLang;
  const t = (k: string) => getTranslation(lang, k);

  const handleLanguageChange = async (newLang: LanguageCode) => {
    setSelectedLang(newLang);
    await dataService.setLanguage(newLang);
    const updated = dataService.getCurrentUser();
    setUser({ ...updated });
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your legal name');
      return;
    }
    setSavingProfile(true);
    try {
      await dataService.updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        village: village.trim(),
        district: district.trim(),
      });
      setUser(dataService.getCurrentUser());
      Alert.alert('✅ Saved', 'Profile details updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(t('navLogout'), 'Are you sure you want to sign out?', [
      { text: t('actionCancel'), style: 'cancel' },
      {
        text: t('navLogout'),
        style: 'destructive',
        onPress: async () => {
          await dataService.signOut();
        },
      },
    ]);
  };

  const initials = (user.name || 'F')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('navProfile')}</Text>
          <Text style={styles.subtitle}>Verified Coastal Aquaculture Producer</Text>
        </View>

        {/* Profile Card Summary */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user.name}</Text>
              {user.phone ? (
                <Text style={styles.userSub}>{user.phone}</Text>
              ) : null}
              <Text style={styles.userEmail}>{user.email}</Text>
              {(user.village || user.district) ? (
                <Text style={styles.userLoc}>
                  {[user.village, user.district].filter(Boolean).join(', ')}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Editable Profile Details */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>{t('profileTitle')}</Text>
          <Text style={styles.cardSub}>Update your name, contact and farm region</Text>

          <Text style={styles.inputLabel}>{t('fullLegalName')} *</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ramesh Varma"
          />

          <Text style={styles.inputLabel}>{t('mobilePhoneNumber')}</Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +91 98480 12345"
            keyboardType="phone-pad"
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>{t('villageMandal')}</Text>
              <TextInput
                style={styles.textInput}
                value={village}
                onChangeText={setVillage}
                placeholder="e.g. Bhimavaram"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>{t('districtLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={district}
                onChangeText={setDistrict}
                placeholder="e.g. West Godavari"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveProfileBtn, savingProfile && { opacity: 0.6 }]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveProfileBtnText}>💾 {t('saveChanges')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Pond Management */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🐟 Pond Management</Text>
          <Text style={styles.cardSub}>Quick access to register and manage your aquaculture ponds</Text>
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#DDF3EC',
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.teal,
              }}
              onPress={() => navigation?.navigate('PondRegistration')}
            >
              <Text style={{ color: COLORS.darkTeal, fontWeight: '800', fontSize: 13 }}>🐟 + Register New Pond</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>{t('languagePreference')}</Text>
          <Text style={styles.cardSub}>
            {t('languageSelectionDesc')}
          </Text>

          <View style={styles.langGrid}>
            {[
              { code: 'en' as LanguageCode, label: 'English', sub: 'Default' },
              { code: 'te' as LanguageCode, label: 'తెలుగు (Telugu)', sub: 'ఆంధ్రప్రదేశ్' },
              { code: 'hi' as LanguageCode, label: 'हिंदी (Hindi)', sub: 'उत्तर भारत' },
            ].map((item) => {
              const isSelected = selectedLang === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.langBtn, isSelected && styles.langBtnActive]}
                  onPress={() => handleLanguageChange(item.code)}
                  activeOpacity={0.7}
                >
                  {/* Left Highlight Bar */}
                  <View style={[styles.langHighlightBar, isSelected && styles.langHighlightBarActive]} />

                  <View style={{ flex: 1, paddingLeft: 10 }}>
                    <Text style={[styles.langText, isSelected && styles.langTextActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.langSub, isSelected && styles.langSubActive]}>
                      {item.sub}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={styles.activeCheckPill}>
                      <Text style={styles.activeCheckText}>✓ {t('activeLanguage')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Account</Text>
          <TouchableOpacity
            style={[styles.signOutBtn]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutBtnText}>🚪 {t('navLogout')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, gap: 14 },
  header: { marginBottom: 2 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  userName: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  userEmail: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  userSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  userLoc: { fontSize: 11, color: COLORS.teal, marginTop: 2, fontWeight: '600' },
  cardHeader: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  cardSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, marginBottom: 12 },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: '#FAFBFC',
    color: COLORS.textPrimary,
  },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  saveProfileBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  saveProfileBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  langGrid: { gap: 10 },
  langBtn: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  langBtnActive: {
    backgroundColor: '#DDF3EC',
    borderColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  langHighlightBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  langHighlightBarActive: {
    backgroundColor: COLORS.teal,
  },
  langText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  langTextActive: { color: COLORS.darkTeal, fontWeight: '800' },
  langSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  langSubActive: { color: COLORS.teal, fontWeight: '700' },
  activeCheckPill: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeCheckText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
  signOutBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  signOutBtnText: { color: '#991B1B', fontWeight: '700', fontSize: 13 },
});
