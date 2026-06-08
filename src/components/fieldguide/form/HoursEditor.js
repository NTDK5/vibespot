/**
 * HoursEditor — compact Mon–Sun hours editor for spot admin flows.
 * Stores { mon: [8, 17], tue: null, ... } where null = closed.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import fieldGuide from '../../../theme/fieldGuide';
import MonoMeta from '../primitives/MonoMeta';
import {
  HOURS_DAYS,
  createEmptyHours,
  normalizeHoursFromSpot,
} from '../../../utils/hoursHelpers';

export { createEmptyHours, normalizeHoursFromSpot };

const DAYS = HOURS_DAYS;
const DAY_LABEL = {
  mon: 'MON',
  tue: 'TUE',
  wed: 'WED',
  thu: 'THU',
  fri: 'FRI',
  sat: 'SAT',
  sun: 'SUN',
};

function emptyHours() {
  return createEmptyHours();
}

function parseHour(text) {
  const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(String(text || '').trim());
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = m[2] ? Math.min(59, Math.max(0, parseInt(m[2], 10))) : 0;
  return h + min / 60;
}

function formatHour(n) {
  if (n == null) return '';
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  if (m === 0) return String(h);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export default function HoursEditor({ value, onChange, style }) {
  const hours = value || emptyHours();

  const setDay = (day, next) => {
    onChange({ ...hours, [day]: next });
  };

  return (
    <View style={[styles.wrap, style]}>
      {DAYS.map((day) => {
        const range = hours[day];
        const closed = range == null;
        return (
          <View key={day} style={styles.row}>
            <MonoMeta size="eyebrow" style={styles.day}>
              {DAY_LABEL[day]}
            </MonoMeta>
            <Pressable
              onPress={() => setDay(day, closed ? [8, 17] : null)}
              accessibilityRole="switch"
              accessibilityState={{ checked: !closed }}
              style={({ pressed }) => [
                styles.closedToggle,
                !closed && styles.closedToggleOpen,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.closedText,
                  !closed && styles.closedTextOpen,
                ]}
              >
                {closed ? 'CLOSED' : 'OPEN'}
              </Text>
            </Pressable>
            {!closed ? (
              <View style={styles.times}>
                <TextInput
                  value={formatHour(range[0])}
                  onChangeText={(t) => {
                    const o = parseHour(t);
                    if (o == null && t.trim() !== '') return;
                    setDay(day, [o ?? range[0], range[1]]);
                  }}
                  placeholder="8"
                  placeholderTextColor={fieldGuide.creamFaint}
                  keyboardType="numbers-and-punctuation"
                  style={styles.timeInput}
                />
                <Text style={styles.dash}>—</Text>
                <TextInput
                  value={formatHour(range[1])}
                  onChangeText={(t) => {
                    const c = parseHour(t);
                    if (c == null && t.trim() !== '') return;
                    setDay(day, [range[0], c ?? range[1]]);
                  }}
                  placeholder="17"
                  placeholderTextColor={fieldGuide.creamFaint}
                  keyboardType="numbers-and-punctuation"
                  style={styles.timeInput}
                />
              </View>
            ) : (
              <Text style={styles.closedHint}>—</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  day: {
    width: 36,
    color: fieldGuide.cream,
  },
  closedToggle: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
  },
  closedToggleOpen: {
    borderColor: fieldGuide.moss,
    backgroundColor: 'rgba(90,140,110,0.15)',
  },
  closedText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    color: fieldGuide.creamMute,
  },
  closedTextOpen: {
    color: fieldGuide.moss,
  },
  times: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 12,
    color: fieldGuide.cream,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    textAlign: 'center',
  },
  dash: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 12,
    color: fieldGuide.creamMute,
  },
  closedHint: {
    flex: 1,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 12,
    color: fieldGuide.creamFaint,
    textAlign: 'center',
  },
});
