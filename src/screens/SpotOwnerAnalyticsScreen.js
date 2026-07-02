/**
 * SpotOwnerAnalyticsScreen — per-spot metrics for verified owners.
 */

import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MonoMeta from '../components/fieldguide/primitives/MonoMeta';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';
import { getOwnerSpotAnalytics } from '../services/ownerSpots.service';

function Metric({ label, value, sub }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.metric}>
      <MonoMeta size="spot">{label}</MonoMeta>
      <Text style={styles.metricValue}>{value}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </View>
  );
}

export default function SpotOwnerAnalyticsScreen({ navigation, route }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { spotId, title } = route.params || {};
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!spotId) return;
    getOwnerSpotAnalytics(spotId).then(({ data: d, error: e }) => {
      if (e) setError(e);
      else setData(d);
    });
  }, [spotId]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={fieldGuide.cream} />
        </Pressable>
        <MonoMeta size="kicker">ANALYTICS</MonoMeta>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{title || data?.title || 'Your spot'}</Text>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : !data ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : (
          <>
            <View style={styles.grid}>
              <Metric label="TOTAL VISITS" value={String(data.visits?.total ?? 0)} sub={`${data.visits?.unique ?? 0} unique`} />
              <Metric label="LAST 7 DAYS" value={String(data.visits?.last7d ?? 0)} />
              <Metric label="LAST 30 DAYS" value={String(data.visits?.last30d ?? 0)} />
              <Metric label="REVIEWS" value={String(data.reviews?.count ?? 0)} sub={`${(data.reviews?.avgRating ?? 0).toFixed(1)} avg`} />
            </View>
            <Text style={styles.section}>Engagement</Text>
            <View style={styles.grid}>
              <Metric label="SAVED" value={String(data.engagement?.savedCount ?? 0)} />
              <Metric label="VIBES" value={String(data.engagement?.vibeReactionsCount ?? 0)} />
              <Metric label="COMMENTS" value={String(data.engagement?.commentsCount ?? 0)} />
              <Metric label="SHARES" value={String(data.engagement?.sharedCount ?? 0)} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: fieldGuide.ink },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scroll: { padding: 20, paddingBottom: 40 },
  title: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 24,
    color: fieldGuide.cream,
    marginBottom: 20,
  },
  section: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 11,
    letterSpacing: 1,
    color: fieldGuide.creamMute,
    marginTop: 20,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: {
    width: '47%',
    borderWidth: 1,
    borderColor: fieldGuide.inkLine,
    borderRadius: 8,
    padding: 14,
    backgroundColor: fieldGuide.inkElev,
  },
  metricValue: { fontSize: 22, fontWeight: '700', color: fieldGuide.cream, marginTop: 6 },
  metricSub: { fontSize: 12, color: fieldGuide.creamMute, marginTop: 4 },
  muted: { color: fieldGuide.creamMute },
  error: { color: fieldGuide.rose },
});
}
