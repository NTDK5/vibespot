/**
 * SpotPickerSheet — searchable multi-select spot list for collection create/edit.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import fieldGuide from '../../../theme/fieldGuide';
import { MonoMeta, SearchBar, SheetHandle } from '../index';
import { getSavedSpots } from '../../../services/savedSpots.service';
import { searchSpots } from '../../../services/spots.service';
import { logger } from '../../../utils/logger';

function spotThumb(spot) {
  return spot?.thumbnail || spot?.images?.[0] || null;
}

function normalizeSpot(entry) {
  const s = entry?.spot || entry;
  if (!s?.id) return null;
  return {
    id: s.id,
    title: s.title || s.name || 'Untitled',
    thumbnail: spotThumb(s),
    images: s.images,
    category: s.category,
  };
}

export default function SpotPickerSheet({
  visible,
  selectedSpots = [],
  onClose,
  onChangeSelected,
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedSet = useMemo(
    () => new Set(selectedSpots.map((s) => String(s.id))),
    [selectedSpots],
  );

  const loadSpots = useCallback(async () => {
    setLoading(true);
    try {
      const q = query.trim();
      if (q) {
        const result = await searchSpots({ q, page: 1, limit: 40 });
        const list = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];
        setSpots(list.map(normalizeSpot).filter(Boolean));
      } else {
        const data = await getSavedSpots();
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setSpots(list.map(normalizeSpot).filter(Boolean));
      }
    } catch (err) {
      logger.error('SpotPickerSheet.load', err);
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(loadSpots, query.trim() ? 350 : 0);
    return () => clearTimeout(t);
  }, [visible, loadSpots, query]);

  const toggle = (spot) => {
    const id = String(spot.id);
    if (selectedSet.has(id)) {
      onChangeSelected(selectedSpots.filter((s) => String(s.id) !== id));
    } else {
      onChangeSelected([...selectedSpots, spot]);
    }
  };

  const renderItem = ({ item }) => {
    const active = selectedSet.has(String(item.id));
    const thumb = spotThumb(item);
    return (
      <Pressable
        onPress={() => toggle(item)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: active }}
        style={({ pressed }) => [
          styles.row,
          active && styles.rowActive,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={styles.thumb}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumbImg} />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}
        </View>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={[styles.check, active && styles.checkActive]}>
          {active ? (
            <Ionicons name="checkmark" size={14} color={fieldGuide.ink} />
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <SheetHandle />
        <View style={styles.head}>
          <MonoMeta size="eyebrow">COLLECTIONS · SPOTS</MonoMeta>
          <Text style={styles.title}>Pick spots for this pocket</Text>
        </View>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search or browse saved…"
          surface="elev"
        />
        <Text style={styles.count}>
          {selectedSpots.length} selected
        </Text>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={fieldGuide.ember} />
          </View>
        ) : (
          <FlatList
            data={spots}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {query.trim()
                  ? 'No spots match that search.'
                  : 'Save spots first, or search the field guide.'}
              </Text>
            }
          />
        )}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.doneBtn,
            { opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  head: {
    marginBottom: 14,
  },
  title: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 22,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  count: {
    marginTop: 10,
    marginBottom: 8,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: fieldGuide.inkLine,
  },
  rowActive: {
    backgroundColor: 'rgba(232,90,42,0.06)',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: fieldGuide.radius.sm,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: fieldGuide.inkElev,
  },
  rowTitle: {
    flex: 1,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  empty: {
    paddingVertical: 32,
    textAlign: 'center',
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    color: fieldGuide.creamMute,
  },
  doneBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: fieldGuide.radius.full,
    backgroundColor: fieldGuide.ember,
  },
  doneText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 11,
    letterSpacing: fieldGuide.tracking.widest(11),
    color: '#FFF8F1',
    textTransform: 'uppercase',
  },
});
