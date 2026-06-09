/**
 * CollectionMenuSheet — action sheet for a single collection.
 *
 * Triggered by tapping the kebab (or long-pressing the card) on the
 * Collections list (screens/10-collections.html) and the kebab in the
 * floating nav-top of the Collection Detail screen
 * (screens/11-collection-detail.html L175-178).
 *
 * Rows (top → bottom):
 *   1. Edit cover     → navigates to CreateCollection in edit mode.
 *   2. Share          → coming-soon (no backend yet).
 *   3. Delete         → rose label, calls onDelete after a confirm.
 *
 * Props:
 *   visible: boolean
 *   onClose: () => void
 *   collection: { id, title, ... }
 *   onEdit?: (id) => void           usually navigates to CreateCollection
 *   onShare?: (id) => void          falls back to a toast/no-op
 *   onDelete?: (id) => Promise<any>
 */

import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
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

const SHEET_HEIGHT = 320;
const ANIM_MS = 220;

export default function CollectionMenuSheet({
  visible,
  onClose,
  collection,
  onEdit,
  onShare,
  onDelete,
  isOwner = true,
}) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

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

  const id = collection?.id;
  const title = collection?.title || 'this pocket';

  const handleEdit = () => {
    onClose?.();
    if (onEdit && id) onEdit(id);
  };

  const handleShare = () => {
    onClose?.();
    if (onShare) onShare(id);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete pocket?',
      `"${title}" and its order will be removed. The spots themselves stay in your library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onClose?.();
            if (onDelete && id) onDelete(id);
          },
        },
      ],
    );
  };

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
          <SheetHandle style={styles.handle} />

          <View style={styles.header}>
            <MonoMeta size="eyebrow">Collection · Actions</MonoMeta>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View style={styles.rows}>
            {isOwner ? (
              <Row
                icon="brush-outline"
                label="Edit cover"
                hint="Mosaic, vibe swatches, glyph"
                onPress={handleEdit}
              />
            ) : null}
            <Row
              icon="share-outline"
              label="Share"
              hint="Coming soon"
              onPress={handleShare}
              muted
            />
            {isOwner ? (
              <Row
                icon="trash-outline"
                label="Delete collection"
                hint="The spots stay in your library"
                onPress={handleDelete}
                danger
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Row({ icon, label, hint, onPress, danger = false, muted = false }) {
  const color = danger
    ? fieldGuide.rose
    : muted
    ? fieldGuide.creamMute
    : fieldGuide.cream;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
        {hint ? (
          <Text style={styles.rowHint} numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={fieldGuide.creamFaint}
      />
    </Pressable>
  );
}

const ROW_FS = 16;
const HINT_FS = 11;

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
    paddingBottom: 24,
  },
  handle: {
    marginTop: 10,
    marginBottom: 8,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  title: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 19,
    color: fieldGuide.cream,
    letterSpacing: -0.01 * 19,
    includeFontPadding: false,
  },
  rows: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: fieldGuide.radius.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: ROW_FS,
    letterSpacing: -0.005 * ROW_FS,
    includeFontPadding: false,
  },
  rowHint: {
    marginTop: 2,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: HINT_FS,
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
});
