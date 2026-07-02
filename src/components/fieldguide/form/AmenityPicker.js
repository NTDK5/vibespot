/**
 * AmenityPicker — catalog-backed multi-select for a spot's services.
 *
 * Controlled component: `value` is the spot's `features` string array and
 * `onChange(next)` receives the updated array. Catalog amenities toggle on
 * tap (persisting their canonical label); a small input lets editors add
 * custom amenities for anything not in the catalog. Existing free-text
 * values that don't match the catalog show up as removable custom chips.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import {
  AMENITIES,
  DEFAULT_AMENITY_ICON,
  findAmenity,
  isAmenitySelected,
  toggleAmenity,
} from '../../../utils/amenities';

export default function AmenityPicker({ value = [], onChange }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [custom, setCustom] = useState('');

  const customValues = useMemo(
    () => (Array.isArray(value) ? value.filter((v) => !findAmenity(v)) : []),
    [value],
  );

  const emit = (next) => {
    if (typeof onChange === 'function') onChange(next);
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    const exists = (value || []).some(
      (v) => String(v).trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (!exists) emit([...(value || []), trimmed]);
    setCustom('');
  };

  const removeValue = (val) => emit((value || []).filter((v) => v !== val));

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {AMENITIES.map((a) => {
          const selected = isAmenitySelected(value, a);
          return (
            <Pressable
              key={a.key}
              onPress={() => emit(toggleAmenity(value, a))}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipOn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons
                name={a.icon}
                size={14}
                color={selected ? fieldGuide.ink : fieldGuide.creamSoft}
              />
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.customRow}>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
          placeholder="Add something else…"
          placeholderTextColor={fieldGuide.creamFaint}
          style={styles.customInput}
          returnKeyType="done"
        />
        <Pressable onPress={addCustom} style={styles.addBtn} accessibilityRole="button">
          <Ionicons name="add" size={18} color={fieldGuide.cream} />
        </Pressable>
      </View>

      {customValues.length ? (
        <View style={styles.grid}>
          {customValues.map((v) => (
            <Pressable
              key={v}
              onPress={() => removeValue(v)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${v}`}
              style={({ pressed }) => [
                styles.chip,
                styles.chipCustom,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name={DEFAULT_AMENITY_ICON} size={14} color={fieldGuide.creamSoft} />
              <Text style={styles.chipText}>{v}</Text>
              <Ionicons name="close" size={12} color={fieldGuide.creamMute} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  wrap: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: fieldGuide.inkElev,
  },
  chipOn: {
    backgroundColor: fieldGuide.emberSoft,
    borderColor: fieldGuide.emberSoft,
  },
  chipCustom: {
    borderColor: fieldGuide.inkLine2,
    borderStyle: 'dashed',
  },
  chipText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wide(10),
    textTransform: 'uppercase',
    color: fieldGuide.creamSoft,
    includeFontPadding: false,
  },
  chipTextOn: {
    color: fieldGuide.onCreamFill,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
  },
  customInput: {
    flex: 1,
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 16,
    color: fieldGuide.cream,
    paddingVertical: 12,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: fieldGuide.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
}
