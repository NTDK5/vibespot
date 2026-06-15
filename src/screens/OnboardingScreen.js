/**
 * OnboardingScreen — 4-slide intro from 02-onboarding.html
 *
 * Skip + Get started → SignIn, then markOnboarded()
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../theme/fieldGuide';
import { useFirstLaunch } from '../hooks/useFirstLaunch';
import { track, Events } from '../analytics';
import { ONBOARDING_SLIDES } from '../components/onboarding/onboardingSlides';
import { SlideBody } from '../components/onboarding/OnboardingPrimitives';
import DiscoverIllustration from '../components/onboarding/DiscoverIllustration';
import CuratedIllustration from '../components/onboarding/CuratedIllustration';
import SaveIllustration from '../components/onboarding/SaveIllustration';
import BeginIllustration from '../components/onboarding/BeginIllustration';

const SLIDE_COUNT = ONBOARDING_SLIDES.length;
const SWIPE_THRESHOLD = 48;
const TRANSITION_MS = 420;
const TRANSITION_EASING = Easing.bezier(0.22, 1, 0.36, 1);

const ILLUSTRATIONS = [
  DiscoverIllustration,
  CuratedIllustration,
  SaveIllustration,
  BeginIllustration,
];

export default function OnboardingScreen({ navigation }) {
  const { markOnboarded, onboarded } = useFirstLaunch();
  const insets = useSafeAreaInsets();
  const slideWidth = Dimensions.get('window').width;

  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const finishingRef = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (onboarded) {
      navigation.replace('SignIn');
    }
  }, [onboarded, navigation]);

  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    track(Events.ONBOARDING_COMPLETED, {
      skipped: indexRef.current < SLIDE_COUNT - 1,
      slide_index: indexRef.current,
    });
    navigation.replace('SignIn');
    await markOnboarded();
  }, [markOnboarded, navigation]);

  const animateTo = useCallback(
    (nextIndex, { fromDrag = 0 } = {}) => {
      const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, nextIndex));
      indexRef.current = clamped;
      setIndex(clamped);
      dragX.setValue(fromDrag);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -clamped * slideWidth,
          duration: TRANSITION_MS,
          easing: TRANSITION_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(dragX, {
          toValue: 0,
          duration: TRANSITION_MS,
          easing: TRANSITION_EASING,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [dragX, slideWidth, translateX],
  );

  const goTo = useCallback(
    (n) => {
      animateTo(n);
    },
    [animateTo],
  );

  const goNext = useCallback(() => {
    if (indexRef.current >= SLIDE_COUNT - 1) {
      finish();
      return;
    }
    goTo(indexRef.current + 1);
  }, [finish, goTo]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8,
      onPanResponderMove: (_, gesture) => {
        dragX.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        const current = indexRef.current;
        if (gesture.dx < -SWIPE_THRESHOLD && current < SLIDE_COUNT - 1) {
          animateTo(current + 1, { fromDrag: gesture.dx });
        } else if (gesture.dx > SWIPE_THRESHOLD && current > 0) {
          animateTo(current - 1, { fromDrag: gesture.dx });
        } else {
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragX, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const isLast = index === SLIDE_COUNT - 1;
  const trackX = Animated.add(translateX, dragX);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Pressable
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
        hitSlop={10}
        style={[styles.skip, { top: insets.top + 8 }]}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.viewport} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.track,
            {
              width: slideWidth * SLIDE_COUNT,
              transform: [{ translateX: trackX }],
            },
          ]}
        >
          {ONBOARDING_SLIDES.map((slide, i) => {
            const Illustration = ILLUSTRATIONS[i];
            return (
              <View key={slide.id} style={[styles.slide, { width: slideWidth }]}>
                <Illustration chip={slide.chip} />
                <SlideBody
                  stepNum={slide.stepNum}
                  stepLabel={slide.stepLabel}
                  headlineBefore={slide.headlineBefore}
                  headlineAccent={slide.headlineAccent}
                  headlineAfter={slide.headlineAfter}
                  body={slide.body}
                />
              </View>
            );
          })}
        </Animated.View>
      </View>

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 6) }]}>
        <View style={styles.pager}>
          {ONBOARDING_SLIDES.map((slide, i) => (
            <Pressable
              key={slide.id}
              onPress={() => goTo(i)}
              accessibilityRole="button"
              accessibilityLabel={`Step ${i + 1}`}
              accessibilityState={{ selected: i === index }}
              hitSlop={8}
              style={[styles.pagerDot, i === index ? styles.pagerDotActive : null]}
            />
          ))}
        </View>

        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get started' : 'Next'}
          style={({ pressed }) => [
            styles.nextBtn,
            isLast ? styles.nextBtnFinal : null,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
        >
          {!isLast ? (
            <Ionicons name="arrow-forward" size={22} color="#FFF8F1" />
          ) : (
            <Text style={styles.nextLabel}>Get started</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const NEXT_SIZE = 60;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.inkDeep,
  },
  skip: {
    position: 'absolute',
    right: 22,
    zIndex: 10,
  },
  skipText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.mono28(10),
    textTransform: 'uppercase',
    color: fieldGuide.creamMute,
    includeFontPadding: false,
  },
  viewport: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    height: '100%',
  },
  slide: {
    flexDirection: 'column',
    minHeight: 0,
  },
  controls: {
    paddingHorizontal: 22,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: fieldGuide.inkLine2,
  },
  pagerDotActive: {
    width: 22,
    borderRadius: 4,
    backgroundColor: fieldGuide.ember,
  },
  nextBtn: {
    width: NEXT_SIZE,
    height: NEXT_SIZE,
    borderRadius: NEXT_SIZE / 2,
    backgroundColor: fieldGuide.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnFinal: {
    width: 'auto',
    height: NEXT_SIZE,
    paddingHorizontal: 22,
    borderRadius: fieldGuide.radius.full,
  },
  nextLabel: {
    fontFamily: fieldGuide.fonts.display,
    fontSize: 11,
    letterSpacing: 0.06 * 11,
    textTransform: 'uppercase',
    color: '#FFF8F1',
    includeFontPadding: false,
  },
});
