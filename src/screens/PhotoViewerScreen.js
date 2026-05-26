/**
 * PhotoViewerScreen — Phase 4 / design 16.
 *
 * Full-bleed gallery presented as a transparent modal with fade. The
 * screen layers a paged FlatList of photos under three pieces of
 * chrome:
 *
 *   v-top      close · "{i+1} / {n}" mono · save (camera-roll) · share
 *   v-dots     32-wide cream pill for active, 24-wide cream@0.3 bars
 *              for the rest (clamped to 10, "+N" trailing when >10)
 *   v-thumbs   56pt rounded thumb strip with the active tile in ember
 *   v-caption  editorial caption: kicker + serif title + body + byline
 *
 * Single tap anywhere outside the chrome fades the chrome to 0 over
 * 200ms; the next tap brings it back. Chrome state lives in an
 * Animated.Value so it composes cleanly with the modal fade.
 *
 * Data shape:
 *   route.params: {
 *     spotId?,
 *     photos: string[],
 *     index?: number,                 default 0
 *     captions?: [{ kicker, title, body, by, on }],
 *   }
 *
 * When `photos` is missing we hydrate it from getSpotById(spotId).images.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import { getSpotById } from '../services/spots.service';
import {
  avatarHueFor,
  indexNumberFor,
  initialFor,
} from '../utils/spotHelpers';

const SCREEN = Dimensions.get('window');
const DOT_MAX = 10;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatMonthYear(input) {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  return d
    .toLocaleString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();
}

export const PhotoViewerScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const spotId = route?.params?.spotId;
  const startIndex = Math.max(0, route?.params?.index ?? 0);
  const initialPhotos = useMemo(() => {
    const raw = route?.params?.photos;
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return [];
  }, [route]);
  const captions = Array.isArray(route?.params?.captions)
    ? route.params.captions
    : [];

  /* ── photos + spot hydration ────────────────────────────────────── */
  const [photos, setPhotos] = useState(initialPhotos);
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(
    initialPhotos.length === 0 && !!spotId,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!spotId) {
        if (initialPhotos.length === 0) setLoading(false);
        return;
      }
      try {
        const data = await getSpotById(spotId);
        if (cancelled) return;
        if (data?.error) {
          if (initialPhotos.length === 0) {
            logger.error('PhotoViewer.getSpot', data.error);
          }
          setLoading(false);
          return;
        }
        setSpot(data);
        if (initialPhotos.length === 0) {
          const imgs = Array.isArray(data?.images)
            ? data.images.filter(Boolean)
            : [];
          setPhotos(imgs);
        }
      } catch (err) {
        logger.error('PhotoViewer.getSpot', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spotId, initialPhotos.length]);

  /* ── paging + active index ──────────────────────────────────────── */
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(
    Math.min(startIndex, Math.max(0, photos.length - 1)),
  );

  // Re-clamp when photos load late.
  useEffect(() => {
    if (!photos.length) return;
    setActiveIndex((idx) => Math.min(Math.max(0, idx), photos.length - 1));
  }, [photos.length]);

  const onMomentumScrollEnd = useCallback(
    (e) => {
      const w = e.nativeEvent.layoutMeasurement.width || SCREEN.width;
      const x = e.nativeEvent.contentOffset.x;
      setActiveIndex(Math.round(x / w));
    },
    [],
  );

  const scrollToIndex = useCallback((i) => {
    if (!listRef.current) return;
    try {
      listRef.current.scrollToIndex({ index: i, animated: true });
    } catch (err) {
      logger.error('PhotoViewer.scrollToIndex', err);
    }
  }, []);

  /* ── chrome fade ─────────────────────────────────────────────────── */
  const chromeOpacity = useRef(new Animated.Value(1)).current;
  const [chromeVisible, setChromeVisible] = useState(true);

  const toggleChrome = useCallback(() => {
    const next = !chromeVisible;
    setChromeVisible(next);
    Animated.timing(chromeOpacity, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [chromeVisible, chromeOpacity]);

  /* ── save + share ────────────────────────────────────────────────── */
  // TODO(media): wire expo-media-library.saveToLibraryAsync once the
  // dev-client has been rebuilt with the native side. We deliberately
  // do NOT require('expo-media-library') here — invoking it on a dev
  // client that wasn't rebuilt after adding the dependency crashes
  // with "Cannot read property 'eventEmitter' of undefined" at
  // autolink time. Surface a friendly toast instead until Phase 5
  // ships a built dev client.
  const saveToCameraRoll = useCallback(() => {
    if (!photos[activeIndex]) return;
    toast.show('Save to camera roll is coming in the next build.', {
      variant: 'info',
    });
  }, [photos, activeIndex, toast]);

  const sharePhoto = useCallback(async () => {
    const uri = photos[activeIndex];
    if (!uri) return;
    try {
      await Share.share({
        message: spot?.title
          ? `${spot.title} on VibeSpot`
          : 'A photo on VibeSpot',
        url: uri,
      });
    } catch (err) {
      logger.error('PhotoViewer.share', err);
    }
  }, [photos, activeIndex, spot]);

  /* ── derived caption + kicker ────────────────────────────────────── */
  const caption = captions[activeIndex] || {};
  const idxLabel = `NO. ${indexNumberFor(spot || { id: spotId })}`;
  const kickerSpotPart = (spot?.title || caption.kicker || '').toUpperCase();
  const kickerDistrict = (spot?.district || spot?.city || '')
    .toString()
    .toUpperCase();
  const titleText = caption.title || '';
  const bodyText = caption.body || '';
  const byline = caption.by || caption.author || '';
  const bylineWhen = formatMonthYear(caption.on || caption.createdAt);
  const avatarPaletteKey = avatarHueFor(byline);
  const avatarBg = fieldGuide[avatarPaletteKey] || fieldGuide.emberSoft;
  const avatarTextColor =
    avatarPaletteKey === 'rose' ? '#FFFFFF' : fieldGuide.inkText;

  /* ── render guards ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <View style={styles.fillDeep}>
        <StatusBar style="light" />
        <ActivityIndicator color={fieldGuide.ember} />
      </View>
    );
  }

  if (!photos.length) {
    return (
      <View style={styles.fillDeep}>
        <StatusBar style="light" />
        <Text style={styles.emptyText}>No photos to show yet.</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          style={({ pressed }) => [
            styles.emptyClose,
            { top: insets.top + 12, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="close" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  /* ── visible dots ────────────────────────────────────────────────── */
  const visibleDotCount = Math.min(photos.length, DOT_MAX);
  const extraDotCount = Math.max(0, photos.length - DOT_MAX);

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* IMAGES */}
      <FlatList
        ref={listRef}
        data={photos}
        keyExtractor={(uri, i) => `${uri}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={Math.min(startIndex, photos.length - 1)}
        getItemLayout={(_, i) => ({
          length: SCREEN.width,
          offset: SCREEN.width * i,
          index: i,
        })}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => (
          <Pressable
            onPress={toggleChrome}
            accessibilityRole="imagebutton"
            accessibilityLabel="Toggle gallery chrome"
            style={styles.page}
          >
            <Image
              source={{ uri: item }}
              style={styles.image}
              resizeMode="contain"
            />
          </Pressable>
        )}
      />

      {/* TOP CHROME */}
      <Animated.View
        pointerEvents={chromeVisible ? 'box-none' : 'none'}
        style={[
          styles.vTop,
          {
            top: insets.top,
            opacity: chromeOpacity,
          },
        ]}
      >
        <GlassButton
          onPress={() => navigation.goBack()}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={16} color="#FFFFFF" />
        </GlassButton>
        <Text style={styles.vTopCenter}>
          <Text style={styles.vTopCenterBold}>{pad2(activeIndex + 1)}</Text>
          {` / ${photos.length}`}
        </Text>
        <View style={styles.vTopRight}>
          <GlassButton onPress={saveToCameraRoll} accessibilityLabel="Save photo">
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </GlassButton>
          <View style={{ width: 8 }} />
          <GlassButton onPress={sharePhoto} accessibilityLabel="Share photo">
            <Ionicons name="share-outline" size={14} color="#FFFFFF" />
          </GlassButton>
        </View>
      </Animated.View>

      {/* DOTS */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.vDots,
          {
            top: insets.top + 64,
            opacity: chromeOpacity,
          },
        ]}
      >
        {Array.from({ length: visibleDotCount }).map((_, i) => {
          const isOn = i === activeIndex;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: isOn ? 32 : 24,
                  backgroundColor: isOn
                    ? '#FFFFFF'
                    : 'rgba(255,255,255,0.3)',
                },
              ]}
            />
          );
        })}
        {extraDotCount > 0 ? (
          <Text style={styles.dotsOverflow}>{`+${extraDotCount}`}</Text>
        ) : null}
      </Animated.View>

      {/* THUMBS */}
      <Animated.View
        pointerEvents={chromeVisible ? 'box-none' : 'none'}
        style={[
          styles.vThumbsWrap,
          {
            bottom: insets.bottom + 140,
            opacity: chromeOpacity,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vThumbsRow}
        >
          {photos.map((uri, i) => {
            const active = i === activeIndex;
            return (
              <Pressable
                key={`${uri}-thumb-${i}`}
                onPress={() => scrollToIndex(i)}
                accessibilityRole="button"
                accessibilityLabel={`Open photo ${i + 1}`}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.thumb,
                  {
                    opacity: active ? 1 : pressed ? 0.85 : 0.55,
                    borderColor: active
                      ? fieldGuide.ember
                      : 'transparent',
                  },
                ]}
              >
                <Image
                  source={{ uri }}
                  style={styles.thumbImg}
                  resizeMode="cover"
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* CAPTION */}
      <Animated.View
        pointerEvents={chromeVisible ? 'auto' : 'none'}
        style={[
          styles.vCaption,
          {
            paddingBottom: insets.bottom + 18,
            opacity: chromeOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(11,12,17,0.95)']}
          locations={[0, 0.8]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <Text style={styles.kicker} numberOfLines={1}>
          <Text style={styles.kickerBold}>{idxLabel}</Text>
          {kickerSpotPart ? ` · ${kickerSpotPart}` : ''}
          {kickerDistrict ? ` · ${kickerDistrict}` : ''}
        </Text>

        {titleText ? (
          <Text style={styles.captionTitle} numberOfLines={2}>
            {titleText}
          </Text>
        ) : null}

        {bodyText ? (
          <Text style={styles.captionBody}>{bodyText}</Text>
        ) : null}

        {byline ? (
          <View style={styles.byline}>
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
              <Text style={[styles.avatarText, { color: avatarTextColor }]}>
                {initialFor(byline)}
              </Text>
            </View>
            <Text style={styles.bylineText} numberOfLines={1}>
              {'By '}
              <Text style={styles.bylineName}>{byline}</Text>
              {bylineWhen ? ` · ${bylineWhen}` : ''}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
};

export default PhotoViewerScreen;

/* ─────────────────────────────────────────────────────────────────── */
/*  GLASS BUTTON                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function GlassButton({ children, onPress, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.glassBtn,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  STYLES                                                              */
/* ─────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: fieldGuide.inkDeep,
  },
  fillDeep: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fieldGuide.inkDeep,
  },
  emptyText: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
    paddingHorizontal: 22,
    textAlign: 'center',
  },
  emptyClose: {
    position: 'absolute',
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  page: {
    width: SCREEN.width,
    height: SCREEN.height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  /* top chrome */
  vTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  vTopCenter: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
  },
  vTopCenterBold: {
    fontFamily: fieldGuide.fonts.monoMed,
    color: '#FFFFFF',
  },
  vTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* dots */
  vDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
    gap: 6,
  },
  dot: {
    height: 2,
    borderRadius: 2,
  },
  dotsOverflow: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 4,
  },

  /* thumbs */
  vThumbsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 6,
  },
  vThumbsRow: {
    paddingHorizontal: 16,
    gap: 6,
    flexDirection: 'row',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: fieldGuide.radius.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: fieldGuide.ink,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },

  /* caption */
  vCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 28,
    zIndex: 5,
  },
  kicker: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  kickerBold: {
    fontFamily: fieldGuide.fonts.monoMed,
    color: fieldGuide.emberSoft,
  },
  captionTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.01 * 22,
    includeFontPadding: false,
  },
  captionBody: {
    marginTop: 6,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: 'rgba(244,239,230,0.78)',
    maxWidth: 320,
  },
  byline: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 11,
    includeFontPadding: false,
  },
  bylineText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  bylineName: {
    fontFamily: fieldGuide.fonts.monoMed,
    color: 'rgba(255,255,255,0.85)',
  },
});
