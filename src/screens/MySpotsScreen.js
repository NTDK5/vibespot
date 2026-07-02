/**
 * MySpotsScreen — spot owner's listings with status pills.
 */

import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import EditorialButton from '../components/fieldguide/form/EditorialButton';
import MonoMeta from '../components/fieldguide/primitives/MonoMeta';
import EmptyState from '../components/fieldguide/state/EmptyState';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';
import { listMyOwnerSpots } from '../services/ownerSpots.service';

function StatusPill({ status }) {

  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const colors = {
    approved: fieldGuide.moss,
    rejected: fieldGuide.rose,
    pending: fieldGuide.emberSoft,
  };
  const label = status === 'approved' ? 'Live on FENA' : status === 'rejected' ? 'Not approved' : 'Under review';
  return (
    <View style={[styles.pill, { borderColor: colors[status] || fieldGuide.emberSoft }]}>
      <Text style={[styles.pillText, { color: colors[status] || fieldGuide.emberSoft }]}>{label}</Text>
    </View>
  );
}

export default function MySpotsScreen({ navigation }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await listMyOwnerSpots();
    if (!error && Array.isArray(data)) setSpots(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={fieldGuide.cream} />
        </Pressable>
        <MonoMeta size="kicker">YOUR SPOTS</MonoMeta>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={fieldGuide.ember} />
        }
      >
        <EditorialButton variant="primary" block onPress={() => navigation.navigate('AddSpot')}>
          + List a new spot
        </EditorialButton>

        {loading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : spots.length === 0 ? (
          <EmptyState
            title="No spots yet"
            message="List your first venue — it goes under review before explorers see it."
          />
        ) : (
          spots.map((s) => (
            <Pressable
              key={s.id}
              style={styles.card}
              onPress={() => navigation.navigate('SpotOwnerAnalytics', { spotId: s.id, title: s.title })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <StatusPill status={s.status || 'pending'} />
              </View>
              <Text style={styles.cardSub} numberOfLines={1}>{s.address}</Text>
              <View style={styles.cardMeta}>
                <MonoMeta size="spot">{`${s.visitCount ?? 0} visits`}</MonoMeta>
                <Pressable onPress={() => navigation.navigate('EditSpot', { spotId: s.id })}>
                  <Text style={styles.editLink}>Edit</Text>
                </Pressable>
              </View>
            </Pressable>
          ))
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
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  muted: { color: fieldGuide.creamMuted, textAlign: 'center', marginTop: 24 },
  card: {
    borderWidth: 1,
    borderColor: fieldGuide.inkLine,
    borderRadius: 10,
    padding: 16,
    backgroundColor: fieldGuide.inkElev,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: fieldGuide.cream },
  cardSub: { fontSize: 13, color: fieldGuide.creamMuted, marginTop: 6 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  editLink: { color: fieldGuide.ember, fontWeight: '600', fontSize: 13 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 10, fontFamily: fieldGuide.fonts.monoMed, letterSpacing: 0.4 },
});
}
