/**
 * HourBarChart — opening-hour bar chart used on the spot detail.
 *
 * Layout matches the .hours-grid block in screens/13-spot-detail.html
 * L193-226. 7 rows; each row is a 3-column grid:
 *   [day label 40w] [bar track flex-1 with positioned fill] [time 70w]
 *
 * Today's row is highlighted: day in ember, fill in ember.
 *
 * Props:
 *   hours: { mon, tue, wed, thu, fri, sat, sun: [open, close] | null }
 *           open/close as 24h numbers; null = closed for that day.
 *   today: 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'
 *   style?: ViewStyle
 *   trackHeight?: number   default 4 (matches CSS)
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import fieldGuide from '../../../theme/fieldGuide';
import MonoMeta from '../primitives/MonoMeta';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABEL = {
  mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT', sun: 'SUN',
};

function fmtRange(range) {
  if (!range) return 'CLOSED';
  const [o, c] = range;
  const pad = (n) => (n < 10 ? `0${n}` : String(n));
  return `${pad(o)} — ${pad(c)}`;
}

export default function HourBarChart({
  hours = {},
  today,
  trackHeight = 4,
  style,
}) {
  return (
    <View style={[styles.grid, style]}>
      {DAYS.map((d) => {
        const range = hours[d] || null;
        const isToday = today === d;
        const closed = !range;
        const left = range ? (range[0] / 24) * 100 : 0;
        const width = range ? Math.max(0, (range[1] - range[0]) / 24) * 100 : 0;

        const dayColor = isToday
          ? fieldGuide.ember
          : closed
            ? fieldGuide.creamFaint
            : fieldGuide.cream;
        const fillColor = isToday
          ? fieldGuide.ember
          : fieldGuide.emberSoft;
        const timeColor = closed ? fieldGuide.creamFaint : fieldGuide.creamSoft;

        return (
          <View key={d} style={styles.row}>
            <MonoMeta
              size="eyebrow"
              color={dayColor}
              style={styles.day}
            >
              {DAY_LABEL[d]}
            </MonoMeta>

            <View
              style={[
                styles.track,
                {
                  height: trackHeight,
                  borderRadius: Math.round(trackHeight / 2 + 1),
                },
              ]}
            >
              {!closed ? (
                <View
                  style={[
                    styles.fill,
                    {
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: fillColor,
                      borderRadius: Math.round(trackHeight / 2 + 1),
                    },
                  ]}
                />
              ) : null}
            </View>

            <Text style={[styles.time, { color: timeColor }]}>
              {fmtRange(range)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  day: {
    width: 40,
  },
  track: {
    flex: 1,
    marginHorizontal: 14,
    backgroundColor: fieldGuide.inkLine,
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  time: {
    width: 70,
    textAlign: 'right',
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.0,
    includeFontPadding: false,
  },
});
