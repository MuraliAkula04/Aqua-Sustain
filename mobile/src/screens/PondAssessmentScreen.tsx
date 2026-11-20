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
import { dataService, getTranslation } from '@aquasustain/shared';
import { AssessmentInput, AssessmentResult } from '@aquasustain/shared';
import { COLORS } from '../theme/colors';

const SLUDGE_STATUS_OPTIONS = [
  'Clean / Skimmed',
  'Mild organic deposition',
  'Heavy black sludge / H2S odor',
] as const;

const WATER_COLOR_OPTIONS = [
  'Light Green (Diatom)',
  'Dark Green (Cyanobacteria/Bloom)',
  'Brown / Tea (Healthy Mix)',
  'Turbid / Muddy Suspended',
  'Clear / Sterile',
] as const;

const FEED_INTAKE_OPTIONS = [
  'Normal',
  'Slightly Reduced (-15%)',
  'Severely Reduced (-40%)',
  'Refusing Feed',
] as const;

const STOCK_BEHAVIOUR_OPTIONS = [
  'Active and Schooling',
  'Surfacing at Dawn / Gaspy',
  'Lethargic along Edges',
  'Normal Bottom Feeding',
] as const;

const MORTALITY_OPTIONS = [
  'None',
  'Minimal (<5 observed)',
  'Moderate (5-25 observed)',
  'Significant (>25 observed)',
] as const;

export const PondAssessmentScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [ponds, setPonds] = useState(dataService.getPonds());
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const user = dataService.getCurrentUser();
  const lang = user.preferredLanguage;
  const t = (k: string) => getTranslation(lang, k);

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setPonds(dataService.getPonds());
    });
    return () => unsub();
  }, []);

  const [formData, setFormData] = useState<AssessmentInput>({
    pondId: ponds[0]?.id || 'pond-01',
    waterTemperatureC: 28.5,
    ph: 7.9,
    dissolvedOxygenMgL: 5.6,
    transparencyCm: 35,
    ammoniaPpm: 0.1,
    nitritePpm: 0.15,
    feedIntakeCondition: 'Normal',
    stockBehaviour: 'Active and Schooling',
    mortalityObservations: 'None',
    waterColor: 'Light Green (Diatom)',
    aerationHoursPerDay: 14,
    wasteSludgeStatus: 'Clean / Skimmed',
  });

  // String state for inputs to allow typing decimals without premature truncation
  const [inputStrings, setInputStrings] = useState<Record<string, string>>({
    dissolvedOxygenMgL: '5.6',
    ph: '7.9',
    waterTemperatureC: '28.5',
    transparencyCm: '35',
    ammoniaPpm: '0.1',
    nitritePpm: '0.15',
    aerationHoursPerDay: '14',
  });

  const handleDecimalChange = (field: keyof AssessmentInput, text: string) => {
    setInputStrings((prev) => ({ ...prev, [field]: text }));
    if (text === '' || text === '.' || text === '-') {
      return;
    }
    const val = parseFloat(text);
    if (!isNaN(val)) {
      setFormData((prev) => ({ ...prev, [field]: val }));
    }
  };

  const handleRunAssessment = async () => {
    setEvaluating(true);
    try {
      const res = await dataService.runAssessment(formData);
      setResult(res);
      setCurrentStep(4);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to run assessment calculation');
    } finally {
      setEvaluating(false);
    }
  };

  const selectedPond = ponds.find((p) => p.id === formData.pondId) || ponds[0];

  const steps = [
    { num: 1, label: t('stepPondInfo') },
    { num: 2, label: t('stepWaterParams') },
    { num: 3, label: t('stepBiology') },
    { num: 4, label: t('stepReview') },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('assessmentTitle')}</Text>
          <Text style={styles.subtitle}>{t('assessmentSubtitle')}</Text>
        </View>

        {/* 4-Step Progress Indicator Tabs */}
        <View style={styles.stepTabsRow}>
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <TouchableOpacity
                key={s.num}
                style={[
                  styles.stepTab,
                  isCurrent && styles.stepTabActive,
                  isCompleted && styles.stepTabCompleted,
                ]}
                onPress={() => {
                  if (s.num === 4 && !result) {
                    handleRunAssessment();
                  } else {
                    setCurrentStep(s.num);
                  }
                }}
              >
                <View
                  style={[
                    styles.stepBadgeCircle,
                    isCurrent && styles.stepBadgeCircleActive,
                    isCompleted && styles.stepBadgeCircleCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeNum,
                      (isCurrent || isCompleted) && styles.stepBadgeNumActive,
                    ]}
                  >
                    {isCompleted ? '✓' : s.num}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepTabLabel,
                    isCurrent && styles.stepTabLabelActive,
                    isCompleted && styles.stepTabLabelCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {s.label.split('.')[1]?.trim() || s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================================================= */}
        {/* STEP 1: POND & ENVIRONMENT */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>{t('step1PondInfoTitle')}</Text>

            {/* Select Pond */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
              <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>{t('tablePond')} *</Text>
              <TouchableOpacity
                onPress={() => navigation?.navigate('PondRegistration')}
                style={{ backgroundColor: '#DDF3EC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.teal }}
              >
                <Text style={{ color: COLORS.darkTeal, fontSize: 11, fontWeight: '800' }}>+ Register Pond</Text>
              </TouchableOpacity>
            </View>
            {ponds.length > 0 ? (
              <View style={styles.pillGrid}>
                {ponds.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.optionPill, formData.pondId === p.id && styles.optionPillActive]}
                    onPress={() => setFormData({ ...formData, pondId: p.id })}
                  >
                    <Text style={[styles.optionPillText, formData.pondId === p.id && styles.optionPillTextActive]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 }}>
                {t('noPondsRegistered')}
              </Text>
            )}

            {/* Aerator Hours */}
            <Text style={styles.label}>Aeration Hours / Day (0 - 24 hrs)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={inputStrings.aerationHoursPerDay}
              onChangeText={(v) => handleDecimalChange('aerationHoursPerDay', v)}
            />

            {/* Water Color */}
            <Text style={styles.label}>Water Color & Algal Bloom Status</Text>
            <View style={styles.pillGrid}>
              {WATER_COLOR_OPTIONS.map((wc) => (
                <TouchableOpacity
                  key={wc}
                  style={[styles.optionPill, formData.waterColor === wc && styles.optionPillActive]}
                  onPress={() => setFormData({ ...formData, waterColor: wc })}
                >
                  <Text style={[styles.optionPillText, formData.waterColor === wc && styles.optionPillTextActive]}>
                    {wc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Waste Sludge Status */}
            <Text style={styles.label}>Bottom Sludge Condition</Text>
            <View style={styles.pillGrid}>
              {SLUDGE_STATUS_OPTIONS.map((ss) => (
                <TouchableOpacity
                  key={ss}
                  style={[styles.optionPill, formData.wasteSludgeStatus === ss && styles.optionPillActive]}
                  onPress={() => setFormData({ ...formData, wasteSludgeStatus: ss })}
                >
                  <Text style={[styles.optionPillText, formData.wasteSludgeStatus === ss && styles.optionPillTextActive]}>
                    {ss}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={() => setCurrentStep(2)}>
              <Text style={styles.btnText}>Next: Water Chemistry →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: WATER CHEMISTRY */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>{t('step2WaterParamsTitle')}</Text>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>{t('paramDO')} (mg/L)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={inputStrings.dissolvedOxygenMgL}
                  onChangeText={(v) => handleDecimalChange('dissolvedOxygenMgL', v)}
                />
                <Text style={styles.hint}>Safe: 5.0 - 8.5</Text>
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>{t('paramPh')} Value</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={inputStrings.ph}
                  onChangeText={(v) => handleDecimalChange('ph', v)}
                />
                <Text style={styles.hint}>Safe: 7.5 - 8.5</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>{t('paramTemp')} (°C)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={inputStrings.waterTemperatureC}
                  onChangeText={(v) => handleDecimalChange('waterTemperatureC', v)}
                />
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>{t('paramTrans')} (cm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={inputStrings.transparencyCm}
                  onChangeText={(v) => handleDecimalChange('transparencyCm', v)}
                />
                <Text style={styles.hint}>Safe: 30 - 45</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>{t('paramAmmonia')} (ppm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={inputStrings.ammoniaPpm}
                  onChangeText={(v) => handleDecimalChange('ammoniaPpm', v)}
                />
                <Text style={styles.hint}>Safe: &lt; 0.2 ppm</Text>
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>{t('paramNitrite')} (ppm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={inputStrings.nitritePpm}
                  onChangeText={(v) => handleDecimalChange('nitritePpm', v)}
                />
                <Text style={styles.hint}>Safe: &lt; 0.2 ppm</Text>
              </View>
            </View>

            <View style={styles.navBtnRow}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setCurrentStep(1)}>
                <Text style={styles.btnSecondaryText}>← Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimaryFlex} onPress={() => setCurrentStep(3)}>
                <Text style={styles.btnText}>Next: Biology →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: BIOLOGICAL OBSERVATIONS */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>{t('step3BiologyTitle')}</Text>

            {/* Feed Intake */}
            <Text style={styles.label}>Check Tray Feed Consumption</Text>
            <View style={styles.pillGrid}>
              {FEED_INTAKE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionPill, formData.feedIntakeCondition === opt && styles.optionPillActive]}
                  onPress={() => setFormData({ ...formData, feedIntakeCondition: opt })}
                >
                  <Text style={[styles.optionPillText, formData.feedIntakeCondition === opt && styles.optionPillTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stock Behaviour */}
            <Text style={styles.label}>Stock Behaviour & Movement</Text>
            <View style={styles.pillGrid}>
              {STOCK_BEHAVIOUR_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionPill, formData.stockBehaviour === opt && styles.optionPillActive]}
                  onPress={() => setFormData({ ...formData, stockBehaviour: opt })}
                >
                  <Text style={[styles.optionPillText, formData.stockBehaviour === opt && styles.optionPillTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mortality Observations */}
            <Text style={styles.label}>Mortality Observations</Text>
            <View style={styles.pillGrid}>
              {MORTALITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionPill, formData.mortalityObservations === opt && styles.optionPillActive]}
                  onPress={() => setFormData({ ...formData, mortalityObservations: opt })}
                >
                  <Text style={[styles.optionPillText, formData.mortalityObservations === opt && styles.optionPillTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.navBtnRow}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setCurrentStep(2)}>
                <Text style={styles.btnSecondaryText}>← Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimaryFlex, evaluating && { opacity: 0.6 }]}
                onPress={handleRunAssessment}
                disabled={evaluating}
              >
                {evaluating ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.btnText}>🩺 Run Diagnosis Result</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: EVALUATION RESULT */}
        {/* ========================================================================= */}
        {currentStep === 4 && result && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>{t('step4ReviewTitle')}</Text>

            {/* Score circle & Status */}
            <View style={styles.resultScoreCard}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNum}>{result.overallScore}</Text>
                <Text style={styles.scoreSub}>/ 100</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.resultPondName}>
                  {result.pondName || selectedPond?.name || 'Assessed Pond'}
                </Text>
                <View
                  style={[
                    styles.statusPillBadge,
                    {
                      backgroundColor:
                        result.status === 'Optimal'
                          ? '#DDF3EC'
                          : result.status === 'Critical'
                            ? '#FEE2E2'
                            : '#FEF3C7',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color:
                        result.status === 'Optimal'
                          ? COLORS.darkTeal
                          : result.status === 'Critical'
                            ? '#991B1B'
                            : '#92400E',
                    }}
                  >
                    {result.status} Health
                  </Text>
                </View>
                <Text style={styles.resultDate}>
                  Assessed on {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            {/* Limiting Factors */}
            {result.limitingFactors.length > 0 && (
              <View style={styles.limitingBox}>
                <Text style={styles.limitingTitle}>⚠️ {t('factorsLimitingScore')}</Text>
                {result.limitingFactors.map((f, i) => (
                  <Text key={i} style={styles.limitingText}>
                    • {f}
                  </Text>
                ))}
              </View>
            )}

            {/* Recommendations */}
            <View style={styles.recsBox}>
              <Text style={styles.recsTitle}>💡 {t('practicalRecs')}</Text>
              {result.recommendations.map((rec, i) => (
                <View key={rec.id || i} style={styles.recItem}>
                  <Text style={styles.recDot}>✓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recText, { fontWeight: '700' }]}>{rec.title}</Text>
                    <Text style={styles.recText}>{rec.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => {
                setResult(null);
                setCurrentStep(1);
              }}
            >
              <Text style={styles.btnText}>🔄 Assess Another Pond</Text>
            </TouchableOpacity>
          </View>
        )}

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
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  stepTabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    gap: 4,
  },
  stepTabActive: {
    borderColor: COLORS.teal,
    backgroundColor: '#DDF3EC',
  },
  stepTabCompleted: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  stepBadgeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeCircleActive: {
    backgroundColor: COLORS.teal,
  },
  stepBadgeCircleCompleted: {
    backgroundColor: COLORS.success,
  },
  stepBadgeNum: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  stepBadgeNumActive: {
    color: COLORS.white,
  },
  stepTabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stepTabLabelActive: {
    color: COLORS.darkTeal,
    fontWeight: '800',
  },
  stepTabLabelCompleted: {
    color: COLORS.success,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 10,
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
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: '#FAFBFC',
    color: COLORS.textPrimary,
  },
  hint: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  optionPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  optionPillActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  optionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  optionPillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  navBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  btnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  btnPrimary: {
    backgroundColor: COLORS.teal,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnPrimaryFlex: {
    flex: 1,
    backgroundColor: COLORS.teal,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  resultScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 14,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DDF3EC',
    borderWidth: 3,
    borderColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scoreSub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  resultPondName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statusPillBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginVertical: 4,
  },
  resultDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  limitingBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
    gap: 4,
  },
  limitingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  limitingText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
  recsBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
    gap: 6,
  },
  recsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 4,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  recDot: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 1,
  },
  recText: {
    flex: 1,
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16,
  },
});
