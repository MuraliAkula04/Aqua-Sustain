import React, { useState } from 'react';
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
import { dataService, getTranslation } from '@aquasustain/shared';
import { COLORS } from '../theme/colors';

interface Props {
  navigation: any;
}

const WATER_SOURCES = ['Borewell', 'Canal', 'Creek', 'River', 'Reservoir'] as const;
const SOIL_TYPES = ['Clay Loam', 'Sandy Clay', 'Alluvial', 'Saline Soil'] as const;
const FARM_STATUS = ['Active', 'Under Preparation', 'Fallow'] as const;

export const FarmRegistrationScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const user = dataService.getCurrentUser();
  const lang = user.preferredLanguage;
  const t = (k: string) => getTranslation(lang, k);

  const [form, setForm] = useState({
    name: '',
    state: user.state || 'Andhra Pradesh',
    district: user.district || '',
    mandal: '',
    village: user.village || '',
    totalAreaAcres: '',
    waterSource: 'Borewell' as typeof WATER_SOURCES[number],
    soilType: 'Clay Loam' as typeof SOIL_TYPES[number],
    registrationNumber: '',
    caaRegistrationNumber: '',
    establishedYear: new Date().getFullYear().toString(),
    status: 'Active' as typeof FARM_STATUS[number],
  });

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Farm name is required');
      return false;
    }
    if (!form.district.trim()) {
      Alert.alert('Required', 'District is required');
      return false;
    }
    if (!form.village.trim()) {
      Alert.alert('Required', 'Village / Town is required');
      return false;
    }
    if (!form.totalAreaAcres || isNaN(Number(form.totalAreaAcres))) {
      Alert.alert('Required', 'Enter a valid total area in acres');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const newFarm = await dataService.addFarm({
        name: form.name.trim(),
        state: form.state.trim(),
        district: form.district.trim(),
        mandal: form.mandal.trim(),
        village: form.village.trim(),
        totalAreaAcres: Number(form.totalAreaAcres),
        waterSource: form.waterSource,
        soilType: form.soilType,
        registrationNumber: form.registrationNumber.trim() || undefined,
        caaRegistrationNumber: form.caaRegistrationNumber.trim() || undefined,
        establishedYear: Number(form.establishedYear) || new Date().getFullYear(),
        status: form.status,
      });

      Alert.alert(
        '✅ Farm Registered!',
        `${newFarm.name} has been added to your account.\n\nWould you like to add a pond now?`,
        [
          {
            text: 'Add Pond',
            onPress: () => navigation.replace('PondRegistration', { farmId: newFarm.id }),
          },
          {
            text: 'Later',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to register farm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← {t('actionBack')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🌾 Register New Farm</Text>
          <Text style={styles.subtitle}>Add your aquaculture farm to get started</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Farm Identity</Text>

          <Text style={styles.label}>Farm Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Godavari Delta Aqua Greens"
            value={form.name}
            onChangeText={(v) => setField('name', v)}
          />

          <Text style={styles.label}>Established Year</Text>
          <TextInput
            style={styles.input}
            placeholder={new Date().getFullYear().toString()}
            keyboardType="number-pad"
            value={form.establishedYear}
            onChangeText={(v) => setField('establishedYear', v)}
          />

          <Text style={styles.label}>CAA Registration No. (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. CAA/AP/2023/0012"
            value={form.caaRegistrationNumber}
            onChangeText={(v) => setField('caaRegistrationNumber', v)}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>State Reg. No. (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. MFAP-2023-WG-0892"
            value={form.registrationNumber}
            onChangeText={(v) => setField('registrationNumber', v)}
          />
        </View>

        {/* Location */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            placeholder="Andhra Pradesh"
            value={form.state}
            onChangeText={(v) => setField('state', v)}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>District *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. West Godavari"
                value={form.district}
                onChangeText={(v) => setField('district', v)}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Mandal</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Narsapur"
                value={form.mandal}
                onChangeText={(v) => setField('mandal', v)}
              />
            </View>
          </View>

          <Text style={styles.label}>Village / Town *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Bhimavaram"
            value={form.village}
            onChangeText={(v) => setField('village', v)}
          />
        </View>

        {/* Physical */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Physical Details</Text>

          <Text style={styles.label}>Total Area (Acres) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5.0"
            keyboardType="decimal-pad"
            value={form.totalAreaAcres}
            onChangeText={(v) => setField('totalAreaAcres', v)}
          />

          <Text style={styles.label}>Water Source</Text>
          <View style={styles.pillGrid}>
            {WATER_SOURCES.map((ws) => (
              <TouchableOpacity
                key={ws}
                style={[styles.optionPill, form.waterSource === ws && styles.optionPillActive]}
                onPress={() => setForm((prev) => ({ ...prev, waterSource: ws }))}
              >
                <Text style={[styles.optionPillText, form.waterSource === ws && styles.optionPillTextActive]}>
                  {ws}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Soil Type</Text>
          <View style={styles.pillGrid}>
            {SOIL_TYPES.map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.optionPill, form.soilType === st && styles.optionPillActive]}
                onPress={() => setForm((prev) => ({ ...prev, soilType: st }))}
              >
                <Text style={[styles.optionPillText, form.soilType === st && styles.optionPillTextActive]}>
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Farm Status</Text>
          <View style={styles.statusRow}>
            {FARM_STATUS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusPill, form.status === s && styles.statusPillActive]}
                onPress={() => setForm((prev) => ({ ...prev, status: s }))}
              >
                <Text style={[styles.statusPillText, form.status === s && { color: COLORS.white }]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>✅ Register Farm</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, gap: 14 },
  header: { marginBottom: 4 },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: COLORS.teal, fontSize: 12, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#FAFBFC',
    color: COLORS.textPrimary,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 2 },
  halfField: { flex: 1 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  optionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  optionPillActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  optionPillText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  optionPillTextActive: { color: COLORS.white, fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  statusPillActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  statusPillText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  submitBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
