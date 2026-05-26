/**
 * FilterSheet — bottom sheet for Explore's filter controls.
 *
 * Cream-paper variant of the Field Guide system, used to invert the
 * dark ink canvas so the controls read like a printed insert in the
 * field guide. Mirrors the spec from screens/08-explore.html (filter
 * row + segmented + .fab) and the FILTER sheet conventions captured
 * in DESIGN_NOTES.md.
 *
 * The sheet is a controlled component: the parent owns the `value`
 * filters object and `onChange` is fired on every edit so the result
 * list updates live. The footer's "Apply" button simply dismisses the
 * sheet — by that point the parent's list already reflects the change.
 *
 * Filters shape:
 *   {
 *     openNow:        boolean,
 *     priceTier:      null | 0..4   // FREE / $ / $$ / $$$ / $$$$
 *     maxDistanceMi:  number        // 0.1..5
 *     minRating:      number        // 0..5
 *     sort:           'closest' | 'rating' | 'new'
 *   }
 *
 * Props:
 *   visible: boolean
 *   onClose: () => void
 *   value: Filters
 *   onChange: (next: Filters) => void
 *   onApply?: () => void
 *   onReset?: () => void
 *   resultCount?: number          renders next to the Apply CTA
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';

import fieldGuide from '../../../theme/fieldGuide';
import SheetHandle from '../primitives/SheetHandle';
import MonoMeta from '../primitives/MonoMeta';
import DisplayTitle from '../primitives/DisplayTitle';
import EditorialButton from '../form/EditorialButton';

const SHEET_HEIGHT = 620; // ~73% of a 844-pt iPhone canvas
const ANIM_MS = 240;

export const DEFAULT_FILTERS = Object.freeze({
  openNow: false,
  priceTier: null,
  maxDistanceMi: 5,
  minRating: 0,
  sort: 'closest',
});

const PRICE_TIERS = ['FREE', '$', '$$', '$$$', '$$$$'];

const SORT_OPTIONS = [
  { id: 'closest', label: 'Closest' },
  { id: 'rating',  label: 'Highest rated' },
  { id: 'new',     label: 'New this week' },
];

/** Re-export so callers can use the same defaults. */
export function filtersEqual(a = DEFAULT_FILTERS, b = DEFAULT_FILTERS) {
  return (
    a.openNow === b.openNow &&
    a.priceTier === b.priceTier &&
    a.maxDistanceMi === b.maxDistanceMi &&
    a.minRating === b.minRating &&
    a.sort === b.sort
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SUB-COMPONENTS                                                     */
/* ─────────────────────────────────────────────────────────────────── */

function FieldRow({ label, children, style }) {
  return (
    <View style={[styles.fieldRow, style]}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function PaperSwitch({ value, onValueChange }) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.switchTrack,
        value ? styles.switchOn : styles.switchOff,
        { opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <View
        style={[
          styles.switchKnob,
          { left: value ? 26 : 3 },
        ]}
      />
    </Pressable>
  );
}

function PriceTiers({ value, onChange }) {
  return (
    <View style={styles.tierRow}>
      {PRICE_TIERS.map((label, i) => {
        const active = value === i;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(active ? null : i)}
            accessibilityRole="button"
            accessibilityLabel={`Price tier ${label}`}
            accessibilityState={{ selected: active }}
            hitSlop={4}
            style={({ pressed }) => [
              styles.tier,
              active ? styles.tierActive : null,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.tierLabel, active ? styles.tierLabelActive : null]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RatingPicker({ value, onChange }) {
  return (
    <View style={styles.ratingRow}>
      <View style={styles.ratingDotsRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value >= n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(value === n ? 0 : n)}
              accessibilityRole="button"
              accessibilityLabel={`Minimum rating ${n}`}
              hitSlop={8}
              style={({ pressed }) => [
                styles.ratingDotHit,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  styles.ratingDot,
                  on
                    ? { backgroundColor: fieldGuide.ember }
                    : { backgroundColor: 'rgba(20,22,29,0.22)' },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.ratingValue}>
        {value > 0 ? `${value}.0+` : 'ANY'}
      </Text>
    </View>
  );
}

function SortRadio({ value, onChange }) {
  return (
    <View style={styles.sortCol}>
      {SORT_OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            hitSlop={4}
            style={({ pressed }) => [
              styles.sortRow,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.radioOuter, active ? styles.radioOuterActive : null]}>
              {active ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.sortLabel}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  FILTERSHEET                                                        */
/* ─────────────────────────────────────────────────────────────────── */

export default function FilterSheet({
  visible,
  onClose,
  value = DEFAULT_FILTERS,
  onChange,
  onApply,
  onReset,
  resultCount,
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

  const set = (patch) => onChange && onChange({ ...value, ...patch });

  const handleReset = () => {
    onChange && onChange({ ...DEFAULT_FILTERS });
    onReset && onReset();
  };

  const handleApply = () => {
    onApply && onApply();
    onClose && onClose();
  };

  const applyLabel =
    typeof resultCount === 'number'
      ? `Apply (${resultCount})`
      : 'Apply';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[styles.backdrop, { opacity: backdrop }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY }] },
        ]}
      >
        <SheetHandle color="rgba(20,22,29,0.22)" />

        <View style={styles.head}>
          <MonoMeta size="eyebrow" color="rgba(20,22,29,0.62)">
            FILTER · FIELD GUIDE
          </MonoMeta>
          <DisplayTitle
            size="md"
            weight="500"
            color={fieldGuide.inkText}
            style={styles.title}
          >
            Refine your shelf.
          </DisplayTitle>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FieldRow label="Open now">
            <PaperSwitch
              value={!!value.openNow}
              onValueChange={(v) => set({ openNow: v })}
            />
          </FieldRow>

          <FieldRow label="Price">
            <PriceTiers
              value={value.priceTier}
              onChange={(v) => set({ priceTier: v })}
            />
          </FieldRow>

          <FieldRow label={`Walk within ${value.maxDistanceMi.toFixed(1)} MI`}>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={5}
              step={0.1}
              value={value.maxDistanceMi}
              onValueChange={(v) => set({ maxDistanceMi: Math.round(v * 10) / 10 })}
              minimumTrackTintColor={fieldGuide.ember}
              maximumTrackTintColor="rgba(20,22,29,0.18)"
              thumbTintColor={fieldGuide.ember}
            />
          </FieldRow>

          <FieldRow label="Minimum rating">
            <RatingPicker
              value={value.minRating}
              onChange={(v) => set({ minRating: v })}
            />
          </FieldRow>

          <FieldRow label="Sort by">
            <SortRadio
              value={value.sort}
              onChange={(v) => set({ sort: v })}
            />
          </FieldRow>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <EditorialButton
              variant="ghost"
              size="md"
              onPress={handleReset}
              style={styles.footerBtn}
            >
              Reset
            </EditorialButton>
            <EditorialButton
              variant="primary"
              size="md"
              onPress={handleApply}
              style={styles.footerBtn}
            >
              {applyLabel}
            </EditorialButton>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  STYLES                                                             */
/* ─────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,12,17,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: fieldGuide.paper,
    borderTopLeftRadius: fieldGuide.radius.xl,
    borderTopRightRadius: fieldGuide.radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -12 },
    elevation: 24,
  },
  head: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    paddingTop: 6,
  },
  title: {
    marginTop: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },

  /* shared field row */
  fieldRow: {
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(20,22,29,0.12)',
  },
  fieldLabel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: 'rgba(20,22,29,0.62)',
    textTransform: 'uppercase',
    includeFontPadding: false,
    marginBottom: 12,
  },

  /* switch */
  switchTrack: {
    width: 50,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: fieldGuide.ember,
  },
  switchOff: {
    backgroundColor: 'rgba(20,22,29,0.18)',
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: fieldGuide.paper,
    position: 'absolute',
    top: 3,
  },

  /* price tiers */
  tierRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tier: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20,22,29,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tierActive: {
    backgroundColor: fieldGuide.inkText,
    borderColor: fieldGuide.inkText,
  },
  tierLabel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 11,
    letterSpacing: fieldGuide.tracking.wide(11),
    color: fieldGuide.inkText,
    includeFontPadding: false,
  },
  tierLabelActive: {
    color: fieldGuide.paper,
  },

  /* slider */
  slider: {
    width: '100%',
    height: 36,
  },

  /* rating */
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingDotHit: {
    padding: 8,
  },
  ratingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ratingValue: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 11,
    letterSpacing: fieldGuide.tracking.wide(11),
    color: fieldGuide.inkText,
    includeFontPadding: false,
  },

  /* sort */
  sortCol: {
    flexDirection: 'column',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20,22,29,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: fieldGuide.ember,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: fieldGuide.ember,
  },
  sortLabel: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 17,
    letterSpacing: -0.01 * 17,
    color: fieldGuide.inkText,
    includeFontPadding: false,
  },

  /* footer */
  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(20,22,29,0.12)',
    backgroundColor: fieldGuide.paper,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    alignSelf: 'stretch',
  },
});
