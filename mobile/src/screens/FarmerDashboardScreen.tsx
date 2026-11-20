import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { dataService } from '@aquasustain/shared';
import { getTranslation } from '@aquasustain/shared';
import { COLORS } from '../theme/colors';

interface Props {
  navigation: any;
}

export const FarmerDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState(dataService.getCurrentUser());
  const [farms, setFarms] = useState(dataService.getFarms());
  const [ponds, setPonds] = useState(dataService.getPonds());
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id || '');
  const [waterReadings, setWaterReadings] = useState(dataService.getWaterReadings());
  const [assessments, setAssessments] = useState(dataService.getAssessments());
  const [feedRecords, setFeedRecords] = useState(dataService.getFeedRecords());
  const [reminders, setReminders] = useState(dataService.getReminders());
  const [weather, setWeather] = useState(dataService.getWeather());

  const refresh = () => {
    setUser(dataService.getCurrentUser());
    setFarms(dataService.getFarms());
    const allPonds = dataService.getPonds();
    setPonds(allPonds);
    setWaterReadings(dataService.getWaterReadings());
    setAssessments(dataService.getAssessments());
    setFeedRecords(dataService.getFeedRecords());
    setReminders(dataService.getReminders());
    setWeather(dataService.getWeather());
  };

  useEffect(() => {
    const unsub = dataService.subscribe(refresh);
    // Fetch live user profile and farm records from Supabase on mount
    dataService.fetchCurrentUserProfile().then(() => refresh());
    dataService.fetchFarms().then(() => refresh());
    dataService.fetchPonds().then(() => refresh());
    return () => unsub();
  }, []);

  const lang = user.preferredLanguage;
  const t = (k: string) => getTranslation(lang, k);

  const getDisplayName = () => {
    if (user.name && !user.name.includes('@') && user.name.toLowerCase() !== 'unknown') {
      return user.name;
    }
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Farmer';
  };

  const activePond = ponds.find((p) => p.id === selectedPondId) || ponds[0];
  const latestAssessment = assessments[0];
  const latestReading = waterReadings[0];
  const pendingReminders = reminders.filter((r) => r.status === 'Pending').slice(0, 2);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFeedKg = feedRecords
    .filter((f) => f.date === todayStr || f.date.startsWith(todayStr))
    .reduce((sum, item) => sum + item.quantityKg, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.headerSubtitle}>
            {farms[0]?.name || (farms.length > 0 ? farms[0].name : 'Aqua Farm')} • {user.village || 'Bhimavaram'}
          </Text>
          <Text style={styles.headerTitle}>
            {t('welcomeGreeting')}, {getDisplayName()}
          </Text>
          <Text style={styles.headerTagline}>
            {t('tagline')}
          </Text>

          {/* Quick Stats Pill Bar */}
          <View style={styles.statsPillRow}>
            <View style={styles.statsPill}>
              <Text style={styles.statsPillNum}>{ponds.length}</Text>
              <Text style={styles.statsPillLabel}>{t('pondsUnit')}</Text>
            </View>
            <View style={styles.statsPill}>
              <Text style={styles.statsPillNum}>
                {latestReading ? `${latestReading.dissolvedOxygenMgL}` : '--'}
              </Text>
              <Text style={styles.statsPillLabel}>{t('avgDoLabel')}</Text>
            </View>
            <View style={styles.statsPill}>
              <Text style={styles.statsPillNum}>{todayFeedKg} kg</Text>
              <Text style={styles.statsPillLabel}>{t('feedTodayLabel')}</Text>
            </View>
          </View>

          {/* Register Pond CTA in header */}
          <View style={styles.headerCtaRow}>
            <TouchableOpacity
              style={styles.headerCtaBtn}
              onPress={() => navigation.navigate('PondRegistration')}
            >
              <Text style={styles.headerCtaBtnText}>🐟 + Register Pond</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* No Pond banner */}
        {ponds.length === 0 && (
          <View style={[styles.emptyBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Text style={[styles.emptyBannerTitle, { color: '#1E40AF' }]}>🐟 No ponds registered yet</Text>
            <Text style={styles.emptyBannerSub}>Add your first pond to start tracking water quality, feeding, and assessments.</Text>
            <TouchableOpacity
              style={[styles.emptyBannerBtn, { backgroundColor: '#1D4ED8' }]}
              onPress={() => navigation.navigate('PondRegistration')}
            >
              <Text style={styles.emptyBannerBtnText}>+ Register Your First Pond</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Action Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('quickActionsTitle')}</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: COLORS.teal }]}
            onPress={() => navigation.navigate('Assessment')}
          >
            <Text style={styles.actionIcon}>🩺</Text>
            <Text style={styles.actionTitle}>{t('actionAssessPond')}</Text>
            <Text style={styles.actionDesc}>{t('runDiagnosis')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: '#0284C7' }]}
            onPress={() => navigation.navigate('WaterQuality')}
          >
            <Text style={styles.actionIcon}>💧</Text>
            <Text style={styles.actionTitle}>{t('actionAddReading')}</Text>
            <Text style={styles.actionDesc}>{t('doPhTesting')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: '#D99A38' }]}
            onPress={() => navigation.navigate('Feed')}
          >
            <Text style={styles.actionIcon}>⚖️</Text>
            <Text style={styles.actionTitle}>{t('actionRecordFeed')}</Text>
            <Text style={styles.actionDesc}>{t('checkTrays')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: '#64748B' }]}
            onPress={() => navigation.navigate('Expenses')}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionTitle}>{t('actionAddExpense')}</Text>
            <Text style={styles.actionDesc}>{t('costTracking')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: COLORS.teal, backgroundColor: '#F0FDF4' }]}
            onPress={() => navigation.navigate('PondRegistration')}
          >
            <Text style={styles.actionIcon}>🐟</Text>
            <Text style={styles.actionTitle}>Register Pond</Text>
            <Text style={styles.actionDesc}>Add new pond</Text>
          </TouchableOpacity>
        </View>

        {/* Pond Assessment Health Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{t('latestAssessmentTitle')}</Text>
            <View style={styles.badgeSuccess}>
              <Text style={styles.badgeText}>
                {latestAssessment ? latestAssessment.status : 'Optimal'}
              </Text>
            </View>
          </View>

          {latestAssessment ? (
            <View style={styles.scoreRow}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNum}>
                  {latestAssessment.overallScore}
                </Text>
                <Text style={styles.scoreSub}>/ 100</Text>
              </View>

              <View style={styles.scoreDetails}>
                <Text style={styles.scorePondName}>
                  {activePond ? activePond.name : 'Pond'}
                </Text>
                <Text style={styles.scoreLimiting}>
                  {latestAssessment.limitingFactors[0] || 'Parameters balanced'}
                </Text>
                <TouchableOpacity
                  style={styles.inlineLinkBtn}
                  onPress={() => navigation.navigate('Assessment')}
                >
                  <Text style={styles.inlineLinkText}>{t('actionViewRecs')} &rarr;</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, textAlign: 'center' }}>
                {t('noAssessmentsNotice')}
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}
                onPress={() => navigation.navigate('Assessment')}
              >
                <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '700' }}>{t('actionAssessPond')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Coastal Weather Advisory Alert */}
        <View style={styles.weatherAlert}>
          <Text style={styles.weatherAlertTitle}>
            ⚠️ {t('weatherAlertTitle')}
          </Text>
          <Text style={styles.weatherAlertMsg}>
            {weather.advisories[0]?.message[lang] || weather.advisories[0]?.message.en || 'Normal weather parameters across coastal farming zone.'}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Weather')}
            style={styles.weatherLink}
          >
            <Text style={styles.weatherLinkText}>{t('viewForecast')} &rarr;</Text>
          </TouchableOpacity>
        </View>

        {/* Priority Reminders */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{t('upcomingRemindersTitle')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Reminders')}>
              <Text style={styles.link}>{t('actionViewAll')}</Text>
            </TouchableOpacity>
          </View>

          {pendingReminders.map((rem) => (
            <View key={rem.id} style={styles.remItem}>
              <Text style={styles.remIcon}>📅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.remTitle}>{rem.title}</Text>
                <Text style={styles.remSub}>Due {rem.dueDate} at {rem.dueTime}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    gap: 16,
  },
  headerCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: Platform.OS === 'android' ? 4 : 0,
  },
  headerSubtitle: {
    color: COLORS.mint,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  headerTagline: {
    color: '#DDF3EC',
    fontSize: 12,
    marginTop: 2,
  },
  statsPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  statsPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statsPillNum: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  statsPillLabel: {
    color: '#DDF3EC',
    fontSize: 10,
    marginTop: 2,
  },
  headerCtaRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  headerCtaBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCtaBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  emptyBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  emptyBannerSub: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 12,
  },
  emptyBannerBtn: {
    backgroundColor: '#B45309',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  emptyBannerBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badgeSuccess: {
    backgroundColor: '#DDF3EC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.darkTeal,
    fontSize: 10,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DDF3EC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.teal,
  },
  scoreNum: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scoreSub: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  scoreDetails: {
    flex: 1,
  },
  scorePondName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scoreLimiting: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inlineLinkBtn: {
    marginTop: 6,
  },
  inlineLinkText: {
    color: COLORS.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  weatherAlert: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  weatherAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  weatherAlertMsg: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 4,
    lineHeight: 16,
  },
  weatherLink: {
    marginTop: 8,
  },
  weatherLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  link: {
    color: COLORS.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  remItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  remIcon: {
    fontSize: 16,
  },
  remTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  remSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});
