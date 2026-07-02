import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';
import { BRAND } from '../../brand/fena';
import QuickStatChip from './QuickStatChip';
import HomeFilterChips from './HomeFilterChips';
import { LivePulseDot } from './LivePulseDot';

function goodTimeGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function ContextLine({ parts, styles }) {
  return (
    <View style={styles.ctx}>
      {parts.map((part, i) => (
        <React.Fragment key={part.key}>
          {i > 0 ? <Text style={styles.ctxSep}>·</Text> : null}
          <Text style={[styles.ctxText, part.accent ? styles.ctxAccent : null]}>
            {part.text}
          </Text>
        </React.Fragment>
      ))}
    </View>
  );
}

export default function HomeDiscoveryHeader({
  navigation,
  user,
  firstName,
  homeCity,
  stats,
  nearbyCount = 0,
  nearbyTrend,
  activeFilter,
  onFilterSelect,
  newTodayCount = 3,
  inServiceArea = null,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const greeting = useMemo(() => goodTimeGreeting(), []);
  const cityLabel =
    inServiceArea === false
      ? BRAND.serviceCityName
      : homeCity || BRAND.serviceCityName;
  const initial = (firstName || 'E').charAt(0).toUpperCase();

  const contextParts = useMemo(() => {
    if (inServiceArea === false) {
      const inCity =
        nearbyCount > 0
          ? `${nearbyCount} spot${nearbyCount === 1 ? '' : 's'} in ${BRAND.serviceCityName}`
          : `Explore ${BRAND.serviceCityName}`;
      return [
        { key: 'city', text: inCity },
        { key: 'golden', text: 'Golden hour' },
        {
          key: 'new',
          text: `${newTodayCount} new today`,
          accent: true,
        },
      ];
    }
    const openNear =
      nearbyCount > 0
        ? `${nearbyCount} spot${nearbyCount === 1 ? '' : 's'} open near you`
        : 'Explore spots near you';
    return [
      { key: 'near', text: openNear },
      { key: 'golden', text: 'Golden hour' },
      {
        key: 'new',
        text: `${newTodayCount} new today`,
        accent: true,
      },
    ];
  }, [nearbyCount, newTodayCount, inServiceArea]);

  return (
    <View style={styles.header}>
      <View style={styles.top}>
        <Pressable
          style={({ pressed }) => [styles.locBtn, { opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Change city"
        >
          <Ionicons name="location" size={16} color={fieldGuide.ember} />
          <LivePulseDot size={7} />
          <Text style={styles.locText} numberOfLines={1}>
            {cityLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color={fieldGuide.creamMute} />
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="notifications-outline" size={18} color={fieldGuide.cream} />
            <View style={styles.notifDot} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            style={({ pressed }) => [
              styles.avatar,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Pressable
          onPress={() => navigation.navigate('Explore')}
          accessibilityRole="search"
          accessibilityLabel="Search spots"
          style={({ pressed }) => [
            styles.searchMain,
            { opacity: pressed ? 0.92 : 1 },
          ]}
        >
          <Ionicons name="search" size={18} color={fieldGuide.creamMute} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search spots, vibes, neighborhoods…
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Map')}
          accessibilityRole="button"
          accessibilityLabel="Open map"
          hitSlop={6}
          style={({ pressed }) => [
            styles.mapLink,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="map-outline" size={16} color={fieldGuide.ember} />
        </Pressable>
      </View>

      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>
          Good {greeting},{' '}
          <Text style={styles.greetingName}>{firstName}</Text>
        </Text>
        <ContextLine parts={contextParts} styles={styles} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickStats}
      >
        <QuickStatChip
          variant="near"
          value={nearbyCount}
          label="Nearby now"
          highlight
          trend={nearbyTrend}
          onPress={() => navigation.navigate('Map')}
        />
        <QuickStatChip
          variant="visit"
          value={stats?.visitedSpots ?? 0}
          label="Visited"
          onPress={() => navigation.navigate('Collections')}
        />
        <QuickStatChip
          variant="save"
          value={stats?.savedSpots ?? 0}
          label="Saved"
          onPress={() => navigation.navigate('Collections')}
        />
      </ScrollView>

      <View style={styles.filterChips}>
        <HomeFilterChips activeId={activeFilter} onSelect={onFilterSelect} />
      </View>
    </View>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    flexShrink: 1,
  },
  locText: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 15,
    letterSpacing: -0.01 * 15,
    color: fieldGuide.cream,
    includeFontPadding: false,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: fieldGuide.inkElev,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: fieldGuide.ember,
    borderWidth: 2,
    borderColor: fieldGuide.inkElev,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(232, 116, 58, 0.45)',
    backgroundColor: fieldGuide.inkElev,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontFamily: fieldGuide.fonts.display,
    fontSize: 14,
    color: fieldGuide.emberSoft,
    includeFontPadding: false,
  },
  searchBar: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: fieldGuide.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: fieldGuide.inkElev,
  },
  searchMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  mapLink: {
    width: 34,
    height: 34,
    borderRadius: fieldGuide.radius.md,
    backgroundColor: 'rgba(232, 116, 58, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 116, 58, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    marginTop: 18,
  },
  greetingTitle: {
    fontFamily: fieldGuide.fonts.display,
    fontSize: 26,
    lineHeight: Math.round(26 * 1.15),
    letterSpacing: fieldGuide.tracking.tight(26),
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  greetingName: {
    color: fieldGuide.emberSoft,
  },
  ctx: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  ctxText: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    color: fieldGuide.creamSoft,
    includeFontPadding: false,
  },
  ctxAccent: {
    color: fieldGuide.moss,
  },
  ctxSep: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    color: fieldGuide.creamFaint,
  },
  quickStats: {
    marginTop: 16,
    gap: 8,
    paddingBottom: 2,
  },
  filterChips: {
    marginTop: 14,
  },
});
}
