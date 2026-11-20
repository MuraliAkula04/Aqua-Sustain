import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dataService, getTranslation } from '@aquasustain/shared';
import { COLORS } from '../theme/colors';

// Translate day label key to localized string
function translateDay(label: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    Tomorrow: t('forecastTomorrow'),
    Sun: t('forecastSun'),
    Mon: t('forecastMon'),
    Tue: t('forecastTue'),
    Wed: t('forecastWed'),
    Thu: t('forecastThu'),
    Fri: t('forecastFri'),
    Sat: t('forecastSat'),
  };
  return map[label] || label;
}

export const WeatherScreen: React.FC = () => {
  const [lang, setLang] = useState(dataService.getCurrentUser().preferredLanguage);
  const [weather] = useState(dataService.getWeather());

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setLang(dataService.getCurrentUser().preferredLanguage);
    });
    return () => unsub();
  }, []);

  const t = (k: string) => getTranslation(lang, k);
  const { current, forecast, advisories } = weather;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('coastalAgroStation')}</Text>
          <Text style={styles.subtitle}>{weather.location}, {weather.state}</Text>
        </View>

        {/* Current Telemetry Card */}
        <View style={styles.mainCard}>
          <Text style={styles.tempNum}>{current.tempC}°C</Text>
          <Text style={styles.conditionText}>{current.condition}</Text>
          <Text style={styles.feelsLike}>{t('feelsLike')} {current.feelsLikeC}°C</Text>

          <View style={styles.metricGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{current.humidityPercent}%</Text>
              <Text style={styles.metricLabel}>{t('humidityLabel')}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{current.windSpeedKmh} km/h</Text>
              <Text style={styles.metricLabel}>{t('windLabel')}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{current.rainfall24hMm} mm</Text>
              <Text style={styles.metricLabel}>{t('rainfallLabel')}</Text>
            </View>
          </View>
        </View>

        {/* 5-Day Forecast */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('forecast7Day')}</Text>
          {forecast.map((day) => (
            <View key={day.date} style={styles.forecastRow}>
              <Text style={styles.forecastDay}>{translateDay(day.dayLabel, t)}</Text>
              <Text style={styles.forecastCond} numberOfLines={1}>{day.condition}</Text>
              <Text style={styles.forecastTemp}>{day.maxTempC}° / {day.minTempC}°</Text>
              <Text style={styles.forecastRain}>{day.rainProbabilityPercent}% {t('rainLabel')}</Text>
            </View>
          ))}
        </View>

        {/* Pond Micro-Climate Impact */}
        <View style={styles.microCard}>
          <Text style={styles.microTitle}>{t('pondMicroClimateImpact')}</Text>
          <Text style={styles.microText}>{t('pondMicroClimateText')}</Text>
        </View>

        {/* Coastal Farm Advisories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('expertAdvisoriesTitle')}</Text>
          {advisories.map((adv) => (
            <View key={adv.id} style={styles.advBox}>
              <Text style={styles.advTitle}>⚠ {adv.title[lang] || adv.title.en}</Text>
              <Text style={styles.advMsg}>{adv.message[lang] || adv.message.en}</Text>
              <Text style={styles.advImpact}>
                {t('advisoryImpact')}: {adv.aquacultureImpact[lang] || adv.aquacultureImpact.en}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, gap: 14 },
  header: { marginBottom: 2 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  mainCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  tempNum: { fontSize: 44, fontWeight: '900', color: COLORS.white },
  conditionText: { fontSize: 14, fontWeight: '700', color: COLORS.mint, marginTop: 2 },
  feelsLike: { fontSize: 11, color: '#DDF3EC', marginTop: 2 },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 14,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricVal: { fontSize: 14, fontWeight: '800', color: COLORS.white },
  metricLabel: { fontSize: 9, color: '#DDF3EC', marginTop: 2, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 10 },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  forecastDay: { width: 72, fontSize: 11, fontWeight: '700', color: COLORS.primary },
  forecastCond: { flex: 1, fontSize: 10, color: COLORS.textSecondary },
  forecastTemp: { width: 56, fontSize: 11, fontWeight: '700', color: COLORS.primary, textAlign: 'right' },
  forecastRain: { width: 60, fontSize: 10, fontWeight: '700', color: COLORS.teal, textAlign: 'right' },
  microCard: {
    backgroundColor: '#DDF3EC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.mint,
  },
  microTitle: { fontSize: 12, fontWeight: '800', color: COLORS.darkTeal, marginBottom: 4 },
  microText: { fontSize: 11, color: COLORS.primary, lineHeight: 16 },
  advBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  advTitle: { fontSize: 11, fontWeight: '800', color: '#92400E' },
  advMsg: { fontSize: 10, color: '#78350F', marginTop: 4, lineHeight: 15 },
  advImpact: { fontSize: 10, color: '#B45309', marginTop: 4, fontWeight: '700' },
});
