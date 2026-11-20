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
import { dataService, getTranslation, SpeciesType, CultureStage } from '@aquasustain/shared';
import { COLORS } from '../theme/colors';

interface Props {
  navigation: any;
  route?: any;
}

const SPECIES_OPTIONS: SpeciesType[] = [
  'L. vannamei (Whiteleg Shrimp)',
  'P. monodon (Black Tiger)',
  'Catla & Rohu (Carp)',
  'Tilapia',
  'Seabass',
];

const CULTURE_STAGES: CultureStage[] = [
  'Nursery',
  'Grow-out (Early)',
  'Grow-out (Mid)',
  'Pre-harvest',
  'Harvesting',
];

const POND_STATUS = ['Optimal', 'Attention', 'Critical', 'Fallow'] as const;

export const PondRegistrationScreen: React.FC<Props> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [farms, setFarms] = useState(dataService.getFarms());
  const user = dataService.getCurrentUser();
  const lang = user.preferredLanguage;
  const t = (k: string) => getTranslation(lang, k);

  // Prefill farmId from route params if passed
  const preselectedFarmId = route?.params?.farmId || farms[0]?.id || '';

  const [form, setForm] = useState({
    farmId: preselectedFarmId,
    name: '',
    code: '',
    waterAreaAcres: '',
    averageDepthMeters: '',
    species: 'L. vannamei (Whiteleg Shrimp)' as SpeciesType,
    stockingDate: new Date().toISOString().split('T')[0],
    daysOfCulture: '0',
    stockingDensityPerSqm: '25',
    totalStockCount: '',
    estimatedSurvivalRatePercent: '90',
    currentEstimatedBiomassKg: '0',
    currentMeanBodyWeightGrams: '0',
    targetHarvestWeightGrams: '20',
    targetHarvestDate: '',
    cultureStage: 'Nursery' as CultureStage,
    aeratorHpTotal: '2',
    status: 'Optimal' as 'Optimal' | 'Attention' | 'Critical' | 'Fallow',
  });

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setFarms(dataService.getFarms());
    });
    return () => unsub();
  }, []);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.farmId) {
      Alert.alert('Required', 'Please select a farm first. Register a farm before adding a pond.');
      return false;
    }
    if (!form.name.trim()) {
      Alert.alert('Required', 'Pond name is required');
      return false;
    }
    if (!form.code.trim()) {
      Alert.alert('Required', 'Pond code (e.g. P-01) is required');
      return false;
    }
    if (!form.waterAreaAcres || isNaN(Number(form.waterAreaAcres))) {
      Alert.alert('Required', 'Enter a valid water area in acres');
      return false;
    }
    if (!form.averageDepthMeters || isNaN(Number(form.averageDepthMeters))) {
      Alert.alert('Required', 'Enter a valid average depth in meters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const farm = farms.find((f) => f.id === form.farmId);
      await dataService.addPond({
        farmId: form.farmId,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        waterAreaAcres: Number(form.waterAreaAcres),
        averageDepthMeters: Number(form.averageDepthMeters),
        species: form.species,
        stockingDate: form.stockingDate,
        daysOfCulture: Number(form.daysOfCulture) || 0,
        stockingDensityPerSqm: Number(form.stockingDensityPerSqm) || 25,
        totalStockCount: Number(form.totalStockCount) || 0,
        estimatedSurvivalRatePercent: Number(form.estimatedSurvivalRatePercent) || 90,
        currentEstimatedBiomassKg: Number(form.currentEstimatedBiomassKg) || 0,
        currentMeanBodyWeightGrams: Number(form.currentMeanBodyWeightGrams) || 0,
        targetHarvestWeightGrams: Number(form.targetHarvestWeightGrams) || 20,
        targetHarvestDate: form.targetHarvestDate || '',
        cultureStage: form.cultureStage,
        aeratorHpTotal: Number(form.aeratorHpTotal) || 2,
        status: form.status,
      });
      Alert.alert('✅ Pond Registered', `${form.name} has been added to ${farm?.name || 'your farm'}`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to register pond');
    } finally {
      setLoading(false);
    }
  };

  const selectedFarm = farms.find((f) => f.id === form.farmId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← {t('actionBack')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🐟 Register New Pond</Text>
          <Text style={styles.subtitle}>Add a pond to your aquaculture farm</Text>
        </View>

        {/* Farm Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Farm Assignment</Text>
          {farms.length === 0 ? (
            <View style={styles.noFarmBanner}>
              <Text style={styles.noFarmText}>⚠️ No farms registered yet.</Text>
              <TouchableOpacity
                style={styles.registerFarmBtn}
                onPress={() => navigation.navigate('FarmRegistration')}
              >
                <Text style={styles.registerFarmBtnText}>+ Register a Farm First</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.farmPillRow}>
              {farms.map((farm) => (
                <TouchableOpacity
                  key={farm.id}
                  style={[styles.farmPill, form.farmId === farm.id && styles.farmPillActive]}
                  onPress={() => setField('farmId', farm.id)}
                >
                  <Text style={[styles.farmPillText, form.farmId === farm.id && styles.farmPillTextActive]}>
                    {farm.name}
                  </Text>
                  <Text style={[styles.farmPillSub, form.farmId === farm.id && { color: COLORS.mint }]}>
                    {farm.village}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Basic Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pond Identity</Text>

          <Text style={styles.label}>Pond Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Pond A-1 (High-Yield Vannamei)"
            value={form.name}
            onChangeText={(v) => setField('name', v)}
          />

          <Text style={styles.label}>Pond Code *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. P-01"
            value={form.code}
            onChangeText={(v) => setField('code', v)}
            autoCapitalize="characters"
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Area (Acres) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1.5"
                keyboardType="decimal-pad"
                value={form.waterAreaAcres}
                onChangeText={(v) => setField('waterAreaAcres', v)}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Depth (Meters) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1.2"
                keyboardType="decimal-pad"
                value={form.averageDepthMeters}
                onChangeText={(v) => setField('averageDepthMeters', v)}
              />
            </View>
          </View>
        </View>

        {/* Species & Culture */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Species & Culture Stage</Text>

          <Text style={styles.label}>Species</Text>
          <View style={styles.pillGrid}>
            {SPECIES_OPTIONS.map((sp) => (
              <TouchableOpacity
                key={sp}
                style={[styles.optionPill, form.species === sp && styles.optionPillActive]}
                onPress={() => setForm((prev) => ({ ...prev, species: sp }))}
              >
                <Text style={[styles.optionPillText, form.species === sp && styles.optionPillTextActive]}>
                  {sp}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Culture Stage</Text>
          <View style={styles.pillGrid}>
            {CULTURE_STAGES.map((stage) => (
              <TouchableOpacity
                key={stage}
                style={[styles.optionPill, form.cultureStage === stage && styles.optionPillActive]}
                onPress={() => setForm((prev) => ({ ...prev, cultureStage: stage }))}
              >
                <Text style={[styles.optionPillText, form.cultureStage === stage && styles.optionPillTextActive]}>
                  {stage}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {POND_STATUS.map((s) => (
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

        {/* Stocking Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Stocking Parameters</Text>

          <Text style={styles.label}>Stocking Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={form.stockingDate}
            onChangeText={(v) => setField('stockingDate', v)}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>DOC (days)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="number-pad"
                value={form.daysOfCulture}
                onChangeText={(v) => setField('daysOfCulture', v)}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Density /m²</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                keyboardType="number-pad"
                value={form.stockingDensityPerSqm}
                onChangeText={(v) => setField('stockingDensityPerSqm', v)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Total Stock Count</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 150000"
                keyboardType="number-pad"
                value={form.totalStockCount}
                onChangeText={(v) => setField('totalStockCount', v)}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Survival Rate %</Text>
              <TextInput
                style={styles.input}
                placeholder="90"
                keyboardType="number-pad"
                value={form.estimatedSurvivalRatePercent}
                onChangeText={(v) => setField('estimatedSurvivalRatePercent', v)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Aerator HP</Text>
              <TextInput
                style={styles.input}
                placeholder="2"
                keyboardType="decimal-pad"
                value={form.aeratorHpTotal}
                onChangeText={(v) => setField('aeratorHpTotal', v)}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Target Harvest (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="20"
                keyboardType="decimal-pad"
                value={form.targetHarvestWeightGrams}
                onChangeText={(v) => setField('targetHarvestWeightGrams', v)}
              />
            </View>
          </View>

          <Text style={styles.label}>Target Harvest Date (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={form.targetHarvestDate}
            onChangeText={(v) => setField('targetHarvestDate', v)}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading || farms.length === 0}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>✅ Register Pond</Text>
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
  farmPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  farmPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  farmPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  farmPillText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  farmPillTextActive: { color: COLORS.white },
  farmPillSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
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
  noFarmBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    gap: 10,
  },
  noFarmText: { fontSize: 13, fontWeight: '700', color: '#92400E', textAlign: 'center' },
  registerFarmBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  registerFarmBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  submitBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
