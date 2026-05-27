/**
 * NotificationsScreen — Phase 5 / design 21.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Segmented from '../components/fieldguide/chrome/Segmented';
import EmptyState from '../components/fieldguide/state/EmptyState';
import DuotoneVibe from '../components/fieldguide/spot/DuotoneVibe';
import MonoMeta from '../components/fieldguide/primitives/MonoMeta';
import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import {
  getNotifications,
  markAllRead,
  MOCK_NOTIFICATIONS,
} from '../services/notifications.service';

const USE_MOCK =
  __DEV__ || process.env.EXPO_PUBLIC_USE_MOCK_NOTIFICATIONS === 'true';

function formatWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return 'TODAY';
  if (diff < 86400000 * 7) return 'THIS WEEK';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function dayGroup(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'EARLIER';
  const now = new Date();
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  if (d >= startToday) return 'TODAY';
  const weekAgo = new Date(startToday);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (d >= weekAgo) return 'THIS WEEK';
  return 'EARLIER';
}

function iconForType(type) {
  switch (type) {
    case 'champion':
      return 'trophy-outline';
    case 'review':
      return 'chatbubble-outline';
    case 'pick':
      return 'star-outline';
    default:
      return 'notifications-outline';
  }
}

function NotifBody({ item }) {
  const parts = String(item.body || '').split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <Text style={styles.notifText}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={styles.notifBold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <Text key={i} style={styles.notifEm}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

function NotifRow({ item, onPress }) {
  const iconStyle =
    item.type === 'champion'
      ? styles.icChampion
      : item.type === 'review'
        ? styles.icReview
        : item.type === 'pick'
          ? styles.icPick
          : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.notif,
        item.unread && styles.notifUnread,
        { opacity: pressed ? 0.88 : 1 },
      ]}
    >
      {item.unread ? <View style={styles.unreadDot} /> : null}
      <View style={[styles.ic, iconStyle]}>
        <Ionicons
          name={iconForType(item.type)}
          size={14}
          color={
            item.type === 'champion' ? '#FFF8F1' : fieldGuide.cream
          }
        />
      </View>
      <View style={styles.notifBody}>
        <NotifBody item={item} />
        <MonoMeta size="spot" style={styles.when}>
          {formatWhen(item.createdAt)}
        </MonoMeta>
      </View>
      {item.vibe ? (
        <DuotoneVibe vibe={item.vibe} style={styles.thumb} />
      ) : null}
    </Pressable>
  );
}

export const NotificationsScreen = ({ navigation }) => {
  const toast = useToast();
  const [filter, setFilter] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (USE_MOCK) {
      setItems(MOCK_NOTIFICATIONS);
      setLoading(false);
      return;
    }
    const data = await getNotifications();
    if (data?.error) {
      setItems([]);
      if (data.status !== 404) {
        toast.show('Could not load notifications.', { variant: 'error' });
      }
    } else {
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
          ? data.notifications
          : [];
      setItems(list);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === 1) return items.filter((n) => n.unread);
    return items;
  }, [items, filter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((n) => {
      const key = dayGroup(n.createdAt);
      if (!map[key]) map[key] = [];
      map[key].push(n);
    });
    const order = ['TODAY', 'THIS WEEK', 'EARLIER'];
    return order
      .filter((k) => map[k]?.length)
      .map((k) => ({ label: k, items: map[k] }));
  }, [filtered]);

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (!USE_MOCK) {
      const res = await markAllRead();
      if (res?.error) {
        toast.show(res.error, { variant: 'error' });
        load();
      }
    }
  };

  const handlePress = (item) => {
    if (item.spotId) {
      navigation.navigate('SpotDetail', { spotId: item.spotId });
      return;
    }
    if (item.collectionId) {
      navigation.navigate('CollectionDetail', {
        collectionId: item.collectionId,
      });
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.topbar}>
        <Text style={styles.title}>Notifications</Text>
        <Pressable onPress={handleMarkAll} hitSlop={8}>
          <Text style={styles.markAll}>Mark all read</Text>
        </Pressable>
      </View>

      <View style={styles.segWrap}>
        <Segmented items={['All', 'Unread']} value={filter} onChange={setFilter} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <MonoMeta size="spot">Loading…</MonoMeta>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Quiet for now."
          italic="now."
          body="When a spot you saved becomes champion, you'll hear it here."
          style={styles.empty}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {grouped.map((section) => (
            <View key={section.label} style={styles.daySection}>
              <View style={styles.dayLabelRow}>
                <View style={styles.dayLine} />
                <MonoMeta size="kicker">{section.label}</MonoMeta>
              </View>
              {section.items.map((item) => (
                <NotifRow
                  key={item.id}
                  item={item}
                  onPress={() => handlePress(item)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  title: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 22,
    color: fieldGuide.cream,
  },
  markAll: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: fieldGuide.ember,
    textTransform: 'uppercase',
  },
  segWrap: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  scroll: {
    paddingBottom: 32,
  },
  daySection: {
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dayLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: fieldGuide.inkLine,
  },
  notif: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    position: 'relative',
    paddingLeft: 4,
  },
  notifUnread: {
    paddingLeft: 14,
  },
  unreadDot: {
    position: 'absolute',
    left: 0,
    top: 22,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: fieldGuide.ember,
  },
  ic: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icChampion: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  icReview: {
    borderColor: fieldGuide.moss,
  },
  icPick: {
    borderColor: fieldGuide.gold,
  },
  notifBody: {
    flex: 1,
    minWidth: 0,
  },
  notifText: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: fieldGuide.cream,
  },
  notifBold: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontWeight: '600',
    color: fieldGuide.cream,
  },
  notifEm: {
    fontFamily: fieldGuide.fonts.serif,
    fontStyle: 'italic',
    color: fieldGuide.creamSoft,
  },
  when: {
    marginTop: 4,
    color: fieldGuide.creamMute,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: fieldGuide.radius.sm,
    overflow: 'hidden',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
});
