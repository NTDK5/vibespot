import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BRAND } from '../../brand/fena';
import { Events, track } from '../../analytics';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

export default function ServiceAreaBanner({ navigation, onDismiss }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  useEffect(() => {
    track(Events.SERVICE_AREA_OUTSIDE_VIEWED);
  }, []);

  const exploreAddis = () => {
    track(Events.SERVICE_AREA_EXPLORE_ADDIS_TAPPED);
    navigation.navigate('Map', { centerOnServiceArea: true });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Ionicons name="location-outline" size={16} color={fieldGuide.ember} />
        <View style={styles.copy}>
          <Text style={styles.title}>
            {`FENA is live in ${BRAND.serviceCityName}`}
          </Text>
          <Text style={styles.body}>
            {`You're outside our service area. Browse spots in ${BRAND.serviceCityName} — saved lists still work anywhere.`}
          </Text>
        </View>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss service area notice"
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="close" size={18} color={fieldGuide.creamMute} />
        </Pressable>
      </View>
      <Pressable
        onPress={exploreAddis}
        accessibilityRole="button"
        accessibilityLabel={`Explore ${BRAND.serviceCityName} on map`}
        style={({ pressed }) => [
          styles.cta,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Text style={styles.ctaText}>{`Explore ${BRAND.serviceCityName}`}</Text>
        <Ionicons name="arrow-forward" size={14} color={fieldGuide.inkText} />
      </Pressable>
    </View>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  wrap: {
    marginHorizontal: 22,
    marginTop: 12,
    gap: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: fieldGuide.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 116, 58, 0.28)',
    backgroundColor: 'rgba(232, 116, 58, 0.1)',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 14,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  body: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12.5,
    lineHeight: Math.round(12.5 * 1.45),
    color: fieldGuide.creamSoft,
    includeFontPadding: false,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: fieldGuide.ember,
  },
  ctaText: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 13,
    color: fieldGuide.inkText,
    includeFontPadding: false,
  },
});
}
