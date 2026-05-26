/**
 * CollectionPickerSheet — bottom sheet for slotting a spot into one (or
 * many) of the user's collections.
 *
 * Reached from SpotDetail's bookmark long-press / sticky bookmark CTA.
 * Uses getCollectionsForSpot to render a checkmark next to any
 * collection that already contains this spot; tapping a row toggles
 * via addSpotToCollection / removeSpotFromCollection.
 *
 * A "+" row at the top opens CreateCollection so users can spin up a
 * new pocket without leaving the sheet.
 *
 * Props:
 *   visible: boolean
 *   spotId: string
 *   onClose: () => void
 *   onCreateNew?: () => void             usually navigates to CreateCollection
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../../../theme/fieldGuide';
import SheetHandle from '../primitives/SheetHandle';
import MonoMeta from '../primitives/MonoMeta';
import {
  addSpotToCollection,
  getCollectionsForSpot,
  removeSpotFromCollection,
} from '../../../services/collections.service';
import { logger } from '../../../utils/logger';

const SHEET_HEIGHT = 540;
const ANIM_MS = 240;

function safeArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  if (Array.isArray(maybe?.items)) return maybe.items;
  if (Array.isArray(maybe?.data)) return maybe.data;
  return [];
}

export default function CollectionPickerSheet({
  visible,
  spotId,
  onClose,
  onCreateNew,
}) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [pending, setPending] = useState({});

  const load = useCallback(async () => {
    if (!spotId) return;
    setLoading(true);
    try {
      const data = await getCollectionsForSpot(spotId);
      if (data?.error) {
        logger.error('CollectionPicker.load', data.error);
        setCollections([]);
      } else {
        setCollections(safeArray(data));
      }
    } catch (err) {
      logger.error('CollectionPicker.load', err);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [spotId]);

  useEffect(() => {
    if (!visible) return;
    load();
  }, [visible, load]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIM_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: ANIM_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdrop]);

  const toggleCollection = async (collection) => {
    if (!collection?.id || pending[collection.id]) return;
    const wasIn = !!collection.hasSpot;
    setPending((p) => ({ ...p, [collection.id]: true }));

    // Optimistic update.
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collection.id ? { ...c, hasSpot: !wasIn } : c,
      ),
    );

    try {
      const action = wasIn
        ? removeSpotFromCollection(collection.id, spotId)
        : addSpotToCollection(collection.id, spotId);
      const result = await action;
      if (result?.error) throw new Error(result.error);
    } catch (err) {
      logger.error('CollectionPicker.toggle', err);
      // Roll back on failure.
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collection.id ? { ...c, hasSpot: wasIn } : c,
        ),
      );
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[collection.id];
        return next;
      });
    }
  };

  const subline = useMemo(() => {
    if (loading) return 'LOADING…';
    const count = collections.length;
    const inCount = collections.filter((c) => c?.hasSpot).length;
    if (!count) return 'NO POCKETS YET';
    return `${inCount} OF ${count} POCKETS · TAP TO TOGGLE`;
  }, [collections, loading]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.fill}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdrop.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6],
              }),
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY }] },
          ]}
        >
          <SheetHandle color={fieldGuide.inkLine2} style={styles.handle} />

          <View style={styles.header}>
            <MonoMeta size="eyebrow">Pocket · Save to</MonoMeta>
            <Text style={styles.title} numberOfLines={1}>
              Save into…
            </Text>
            <MonoMeta size="eyebrow" style={styles.headerSub}>
              {subline}
            </MonoMeta>
          </View>

          {loading ? (
            <View style={styles.loadingPad}>
              <ActivityIndicator color={fieldGuide.ember} />
            </View>
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item, i) => String(item?.id || i)}
              ListHeaderComponent={
                <CreateRow
                  onPress={() => {
                    onClose?.();
                    onCreateNew?.();
                  }}
                />
              }
              renderItem={({ item }) => (
                <Row
                  collection={item}
                  busy={!!pending[item?.id]}
                  onPress={() => toggleCollection(item)}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyPad}>
                  <Text style={styles.emptyText}>
                    No collections yet. Start with the row above.
                  </Text>
                </View>
              }
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function CreateRow({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Create a new pocket"
      style={({ pressed }) => [
        styles.row,
        styles.createRow,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { borderColor: fieldGuide.ember }]}>
        <Ionicons name="add" size={18} color={fieldGuide.ember} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: fieldGuide.ember }]}>
          Create a new pocket
        </Text>
        <Text style={styles.rowHint}>Title, vibe, glyph — under a minute.</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={fieldGuide.creamFaint} />
    </Pressable>
  );
}

function Row({ collection, busy, onPress }) {
  const isIn = !!collection?.hasSpot;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isIn, busy }}
      accessibilityLabel={collection?.title || 'Pocket'}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: isIn ? fieldGuide.ember : 'transparent',
            borderColor: isIn ? fieldGuide.ember : fieldGuide.inkLine2,
          },
        ]}
      >
        {isIn ? (
          <Ionicons name="checkmark" size={14} color="#FFF8F1" />
        ) : null}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {collection?.title || 'Untitled'}
        </Text>
        <MonoMeta size="spot" style={styles.rowMeta}>
          {[
            `${collection?.spotCount ?? collection?.spots?.length ?? 0} SPOTS`,
            collection?.isPublic ? 'PUBLIC' : 'PRIVATE',
          ].join('  ·  ')}
        </MonoMeta>
      </View>
      {busy ? <ActivityIndicator color={fieldGuide.creamMute} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: fieldGuide.inkElev,
    borderTopLeftRadius: fieldGuide.radius.xl,
    borderTopRightRadius: fieldGuide.radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  handle: {
    marginTop: 10,
    marginBottom: 6,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  title: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 22,
    color: fieldGuide.cream,
    letterSpacing: -0.01 * 22,
    includeFontPadding: false,
  },
  headerSub: {
    marginTop: 6,
  },
  loadingPad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 32,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: fieldGuide.inkLine,
    marginLeft: 64,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: fieldGuide.radius.md,
  },
  createRow: {
    marginBottom: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginLeft: 6,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 16,
    color: fieldGuide.cream,
    letterSpacing: -0.005 * 16,
    includeFontPadding: false,
  },
  rowMeta: {
    marginTop: 3,
  },
  rowHint: {
    marginTop: 3,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    color: fieldGuide.creamMute,
  },
  emptyPad: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    color: fieldGuide.creamMute,
  },
});
