/**
 * OnboardingScreen — 4-page intro to the Field Guide system.
 *
 * Source: screens/02-onboarding.html. Each page is a vibe hero card
 * with a chapter label top-left and a giant index number bottom-right,
 * followed by a kicker / serif headline / supporting paragraph and
 * a pager+next control row.
 *
 * "Skip" top-right marks onboarded and replaces to SignIn. The next
 * button on the last page shows "Begin" and does the same.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../theme/fieldGuide';
import {
  DisplayTitle,
  MonoMeta,
  SpotPhoto,
} from '../components/fieldguide';
import { useFirstLaunch } from '../hooks/useFirstLaunch';

const PAGES = [
  {
    vibe: 'roof',
    kicker: 'The Promise',
    title: 'Not every place',
    italic: 'is worth your time.',
    body:
      'VibeSpot is a curated guide to places with character — hidden cafés, rooftops worth the climb, quiet workspaces, nightlife locals actually go to.',
  },
  {
    vibe: 'cafe',
    kicker: 'The Idea',
    title: 'Stamps in your',
    italic: 'pocket.',
    body:
      'When you find a spot you like, tuck it away. Build collections that feel like notebooks of a curator — yours, or shared with three friends.',
  },
  {
    vibe: 'night',
    kicker: 'The Game',
    title: 'A Champion every',
    italic: 'week.',
    body:
      "Spots rank against each other in weekly editorial standings. Be early to the next great place — that's the whole point.",
  },
  {
    vibe: 'park',
    kicker: 'The Reader',
    title: 'Made for the kind',
    italic: "of day you'd want to spend.",
    body:
      "Twelve new entries are verified each week. Tomorrow you'll know about three of them before everyone else.",
  },
];

const FADE_MS = 220;

function chapterLabel(i) {
  return `CHAPTER ${String(i + 1).padStart(2, '0')} / 04`;
}

function indexNumber(i) {
  return String(i + 1).padStart(2, '0');
}

export default function OnboardingScreen({ navigation }) {
  const { markOnboarded } = useFirstLaunch();
  const [page, setPage] = useState(0);

  // Plain RN Animated for the cross-fade. Reanimated 4 + LinearGradient
  // inside an Animated.View was throwing "Cannot read property 'forEach'
  // of null" when colors flipped mid-animation, so we use the built-in
  // driver here.
  const fade = useRef(new Animated.Value(1)).current;
  const animatingRef = useRef(false);

  const finish = useCallback(async () => {
    await markOnboarded();
    navigation.replace('SignIn');
  }, [markOnboarded, navigation]);

  const goNext = useCallback(() => {
    if (page === PAGES.length - 1) {
      finish();
      return;
    }
    if (animatingRef.current) return;
    animatingRef.current = true;

    Animated.timing(fade, {
      toValue: 0,
      duration: FADE_MS / 2,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setPage((p) => Math.min(p + 1, PAGES.length - 1));
      Animated.timing(fade, {
        toValue: 1,
        duration: FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        animatingRef.current = false;
      });
    });
  }, [page, finish, fade]);

  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.skipWrap}>
        <Pressable
          onPress={finish}
          accessibilityRole="button"
          hitSlop={10}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <MonoMeta size="eyebrow">SKIP</MonoMeta>
        </Pressable>
      </View>

      <Animated.View style={[styles.hero, { opacity: fade }]}>
        <SpotPhoto
          key={`hero-${page}`}
          vibe={current.vibe}
          aspect="4/5"
          showSaveStamp={false}
        >
          <Text style={styles.chapterLabel} numberOfLines={1}>
            {chapterLabel(page)}
          </Text>
          <View style={styles.indexCorner} pointerEvents="none">
            <Text style={styles.indexNoTag}>NO.</Text>
            <Text style={styles.indexBig}>{indexNumber(page)}</Text>
          </View>
        </SpotPhoto>
      </Animated.View>

      <Animated.View style={[styles.body, { opacity: fade }]}>
        <MonoMeta size="kicker" style={styles.kicker}>
          {current.kicker.toUpperCase()}
        </MonoMeta>
        <DisplayTitle
          size="xl"
          italic={current.italic}
          style={styles.headline}
        >
          {`${current.title} ${current.italic}`}
        </DisplayTitle>
        <Text style={styles.bodyText}>{current.body}</Text>
      </Animated.View>

      <View style={styles.controls}>
        <View style={styles.pager}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.pagerDot,
                i === page ? styles.pagerDotActive : null,
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Begin' : 'Next chapter'}
          hitSlop={6}
          style={({ pressed }) => [
            styles.nextBtn,
            isLast ? styles.nextBtnWide : null,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
        >
          {isLast ? (
            <Text style={styles.beginText}>BEGIN</Text>
          ) : (
            <Ionicons name="arrow-forward" size={22} color="#FFF8F1" />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const NEXT = 60;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  skipWrap: {
    position: 'absolute',
    top: 0,
    right: 22,
    zIndex: 5,
    paddingTop: 10,
  },
  hero: {
    marginHorizontal: 22,
    marginTop: 12,
    borderRadius: fieldGuide.radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  chapterLabel: {
    position: 'absolute',
    top: 18,
    left: 18,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.mono30(10),
    textTransform: 'uppercase',
    color: 'rgba(244,239,230,0.92)',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
  indexCorner: {
    position: 'absolute',
    bottom: 22,
    right: 22,
    alignItems: 'flex-end',
  },
  indexNoTag: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 12,
    letterSpacing: fieldGuide.tracking.mono30(12),
    color: 'rgba(244,239,230,0.7)',
    marginBottom: 6,
    includeFontPadding: false,
  },
  indexBig: {
    fontFamily: fieldGuide.fonts.serifLight,
    fontSize: 120,
    lineHeight: Math.round(120 * 0.85),
    letterSpacing: -0.04 * 120,
    color: 'rgba(244,239,230,0.95)',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 30,
    includeFontPadding: false,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 14,
  },
  kicker: {
    marginBottom: 14,
  },
  headline: {
    // DisplayTitle handles fontFamily / weight / color.
  },
  bodyText: {
    marginTop: 14,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: fieldGuide.creamSoft,
    maxWidth: 320,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 12,
    marginTop: 'auto',
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: fieldGuide.inkLine2,
    marginRight: 6,
  },
  pagerDotActive: {
    width: 22,
    borderRadius: 4,
    backgroundColor: fieldGuide.ember,
  },
  nextBtn: {
    width: NEXT,
    height: NEXT,
    borderRadius: NEXT / 2,
    backgroundColor: fieldGuide.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnWide: {
    width: 'auto',
    paddingHorizontal: 22,
  },
  beginText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 11,
    letterSpacing: fieldGuide.tracking.widest(11),
    color: '#FFF8F1',
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
