/**
 * MapScreen — Field Guide Discovery, screen 09.
 *
 * The Leaflet engine stays exactly as it was; this rewrite layers
 * Field Guide chrome on top:
 *   - Glass SearchBar + filter IconSquare at the top
 *   - Horizontal chip filter row (CATEGORIES) under the search
 *   - "Search this area" cream pill that surfaces when the map idles
 *     on a new region
 *   - Right-side rail with a locate button and a globe button that
 *     opens a MapStylePopover (Phase 4 will swap tiles for real)
 *   - Custom HTML pins rendered inside the WebView via `pinTemplate`,
 *     colored per category and gold-large for the highest-ranked
 *     editor's-pick spot in view
 *   - User position rendered as the Field Guide blue blip
 *   - BottomSheet preview replaced with the editorial layout (thumb,
 *     title, mono meta, blurb, Open/Save/Directions actions)
 *
 * The Surprise-Me feature is preserved verbatim — the reveal modal,
 * its reanimated animations, and the centering logic all remain.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Reanimated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { LeafletMap } from '../components/LeafletMap';
import {
  EditorialButton,
  IconSquare,
  MapStylePopover,
  MonoMeta,
  Pill,
  SearchBar,
  SheetHandle,
  SpotPhoto,
} from '../components/fieldguide';
import { useLocation } from '../hooks/useLocation';
import { useSpotVibes } from '../hooks/useSpotVibes';
import { useToast } from '../components/ToastProvider';
import { getNearbySpots, getSurpriseMeSpot } from '../services/spots.service';
import { isSpotSaved, saveSpot, unsaveSpot } from '../services/savedSpots.service';
import { CATEGORIES } from '../utils/constants';
import fieldGuide from '../theme/fieldGuide';
import { logger } from '../utils/logger';
import {
  categoryColor,
  distanceMiles,
  indexForSpot,
  prettyCategory,
  vibeForCategory,
  zeroPad,
} from '../utils/spotHelpers';

/* ─────────────────────────────────────────────────────────────────── */
/*  CONSTANTS                                                          */
/* ─────────────────────────────────────────────────────────────────── */

const SCREEN_W = Dimensions.get('window').width;

// The "Search this area" pill appears once the user has panned at
// least this many kilometers from the last fetched center.
const REGION_MOVED_KM = 0.3;

// Map color tokens used by the pin SVGs inside the WebView.
const PIN_HEX = {
  ember: fieldGuide.ember,
  cream: fieldGuide.cream,
  moss:  fieldGuide.moss,
  rose:  fieldGuide.rose,
  gold:  fieldGuide.gold,
};

const PIN_FG = {
  ember: '#FFF8F1',
  cream: fieldGuide.ink,
  moss:  '#FFF8F1',
  rose:  '#FFF8F1',
  gold:  '#FFF8F1',
};

/* ─────────────────────────────────────────────────────────────────── */
/*  PIN TEMPLATE                                                        */
/* ─────────────────────────────────────────────────────────────────── */

// Tiny per-category SVG glyph (the "icon" inside the pin dot). The
// shapes are simplified silhouettes, not real Ionicons — they have to
// inline as raw SVG markup because they're injected into Leaflet's
// divIcon HTML.
const PIN_GLYPH = {
  cafe:          '<path d="M5 9h11v4a4 4 0 01-4 4H9a4 4 0 01-4-4V9zM16 11h2a2 2 0 010 4h-2"/>',
  restaurant:    '<path d="M5 9h11v4a4 4 0 01-4 4H9a4 4 0 01-4-4V9zM16 11h2a2 2 0 010 4h-2"/>',
  gallery:       '<rect x="3" y="3" width="18" height="14" rx="1"/><path d="M8 12l3-3 4 4 2-2"/>',
  art:           '<rect x="3" y="3" width="18" height="14" rx="1"/>',
  photo_spot:    '<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3"/>',
  workspace:     '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 10h8"/>',
  nature:        '<path d="M12 2C8 8 8 14 12 22M12 2c4 6 4 12 0 20"/>',
  activity:      '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l5-9 4 5h3"/>',
  sports:        '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>',
  nightlife:     '<path d="M6 4h12l-3 8H9zM12 12v6M9 20h6"/>',
  entertainment: '<path d="M6 4h12l-3 8H9zM12 12v6M9 20h6"/>',
  rooftop:       '<path d="M3 11l9-7 9 7v9H3z"/>',
  waterfront:    '<path d="M3 14c3-2 5-2 8 0s5 2 8 0M3 18c3-2 5-2 8 0s5 2 8 0"/>',
  default:       '<circle cx="12" cy="12" r="6"/>',
};

function glyphFor(category) {
  if (!category) return PIN_GLYPH.default;
  return PIN_GLYPH[String(category).toLowerCase()] || PIN_GLYPH.default;
}

// Renders the HTML for a single pin. Mirrors the .pin / .pin.large /
// .pin.{cream|moss|rose|gold} structure in screens/09-map.html.
function renderPinHtml(spot, { isEditorsPick = false, isHighlighted = false } = {}) {
  const colorKey = categoryColor(spot?.category, { isEditorsPick });
  const bg = PIN_HEX[colorKey] || PIN_HEX.ember;
  const fg = PIN_FG[colorKey] || PIN_FG.ember;
  const glyph = glyphFor(spot?.category);

  const dotSize = isEditorsPick ? 56 : 28;
  const tailH   = isEditorsPick ? 10 : 8;
  const tailW   = isEditorsPick ? 6  : 4;
  const totalH  = dotSize + tailH;

  const wrapBorder = isHighlighted ? 'box-shadow:0 0 0 3px rgba(232,116,58,0.35),0 4px 14px rgba(0,0,0,0.45);' : 'box-shadow:0 4px 14px rgba(0,0,0,0.4);';

  const label = isEditorsPick
    ? `<div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:1.7px;text-transform:uppercase;color:rgba(244,239,230,0.85);white-space:nowrap;">EDITOR'S PICK</div>`
    : '';

  const glyphSize = isEditorsPick ? 22 : 12;

  return `
    <div style="position:relative;width:${dotSize}px;height:${totalH}px;">
      ${label}
      <div style="
        width:${dotSize}px;height:${dotSize}px;border-radius:50%;
        border:2px solid #14161D;background:${bg};
        display:flex;align-items:center;justify-content:center;
        ${wrapBorder}
      ">
        <svg viewBox="0 0 24 24" width="${glyphSize}" height="${glyphSize}" fill="none" stroke="${fg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${glyph}
        </svg>
      </div>
      <div style="
        position:absolute;left:50%;bottom:0;transform:translateX(-50%);
        width:0;height:0;
        border-left:${tailW}px solid transparent;
        border-right:${tailW}px solid transparent;
        border-top:${tailH}px solid ${bg};
      "></div>
    </div>
  `.trim();
}

/* ─────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function pickHighestRanked(spotsList) {
  if (!Array.isArray(spotsList) || spotsList.length === 0) return null;
  const sorted = [...spotsList].sort((a, b) => {
    const ra = Number(a?.weeklyRank ?? a?.rank ?? 9999);
    const rb = Number(b?.weeklyRank ?? b?.rank ?? 9999);
    return ra - rb;
  });
  const top = sorted[0];
  // Only flag it as "editor's pick" if it actually has a rank, an
  // editorial flag, or featured status — otherwise we'd be promoting
  // the first arbitrary spot.
  if (top?.isEditorsPick || top?.editorsPick || top?.featured || top?.weeklyRank === 1) {
    return top;
  }
  return null;
}

function getDistrict(spot) {
  return (
    spot?.district ||
    spot?.neighborhood ||
    spot?.neighbourhood ||
    spot?.address?.district ||
    ''
  );
}

function buildMetaLine(spot, distanceMi) {
  const parts = [];
  if (spot?.category) parts.push(prettyCategory(spot.category));
  const district = getDistrict(spot);
  if (district) parts.push(district);
  if (distanceMi != null) parts.push(`${distanceMi.toFixed(1)} MI`);
  return parts.join(' · ').toUpperCase();
}

/* ─────────────────────────────────────────────────────────────────── */
/*  REVEAL MODAL ANIMATIONS — kept verbatim from the prior screen      */
/* ─────────────────────────────────────────────────────────────────── */

const safeHex = (color, fallback = '#1f1f1f') => {
  if (!color) return fallback;
  if (/^#([0-9A-F]{6})$/i.test(color)) return color;
  return fallback;
};

const hexToRgba = (hex, alpha = 1) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/* ─────────────────────────────────────────────────────────────────── */
/*  SCREEN                                                             */
/* ─────────────────────────────────────────────────────────────────── */

export const MapScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, 12);
  const safeBot = Math.max(insets.bottom, 0);

  const toast = useToast();

  /* ── data ───────────────────────────────────────────────────────── */
  const { location } = useLocation();
  const [spots, setSpots] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);
  const [fetchCenter, setFetchCenter] = useState(null);
  const [regionMoved, setRegionMoved] = useState(false);

  /* ── chrome ─────────────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mapStyle, setMapStyle] = useState('fieldguide');
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);

  /* ── selection / sheet ──────────────────────────────────────────── */
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [savedMap, setSavedMap] = useState({}); // spotId -> true|false

  /* ── surprise-me machinery (preserved) ──────────────────────────── */
  const [surpriseSpot, setSurpriseSpot] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const revealProgress = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const particleScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  const spotCardScale = useSharedValue(0);
  const spotCardRotation = useSharedValue(0);

  /* ── refs ───────────────────────────────────────────────────────── */
  const mapRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['28%', '52%'], []);

  /* ── vibe color for reveal modal (kept from prior version) ──────── */
  const spotId = selectedSpot?.id;
  const { data: spotVibes = [] } = useSpotVibes(spotId, { enabled: !!spotId });
  const topVibe =
    spotVibes.length > 0
      ? spotVibes.reduce((a, b) => (b.count > a.count ? b : a))
      : null;
  const vibeColor = safeHex(topVibe?.color, fieldGuide.ember);

  /* ─────────────────────────────────────────────────────────────── */
  /*  DATA FLOW                                                      */
  /* ─────────────────────────────────────────────────────────────── */

  const loadNearby = useCallback(async (lat, lng) => {
    try {
      const data = await getNearbySpots(lat, lng, 5000);
      if (data && !data.error) {
        setSpots(Array.isArray(data) ? data : []);
        setFetchCenter({ lat, lng });
        setRegionMoved(false);
      } else if (data?.error) {
        logger.error('MapScreen.loadNearby returned error', data.error);
      }
    } catch (err) {
      logger.error('MapScreen.loadNearby threw', err);
    }
  }, []);

  // initial center + load
  useEffect(() => {
    if (location && !mapRegion) {
      setMapRegion({ latitude: location.latitude, longitude: location.longitude });
      loadNearby(location.latitude, location.longitude);
    }
  }, [location, mapRegion, loadNearby]);

  // hydrate saved-state for visible spots
  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const next = { ...savedMap };
      const unchecked = spots
        .map((s) => s.id)
        .filter((id) => id != null && next[id] === undefined);
      if (unchecked.length === 0) return;
      try {
        const results = await Promise.all(
          unchecked.map((id) =>
            isSpotSaved(id).then((r) => [id, !!r]).catch(() => [id, false])
          )
        );
        if (!cancelled) {
          results.forEach(([id, val]) => { next[id] = val; });
          setSavedMap(next);
        }
      } catch (err) {
        logger.error('MapScreen.hydrateSaved failed', err);
      }
    };
    hydrate();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots]);

  /* ─────────────────────────────────────────────────────────────── */
  /*  REGION CHANGES                                                  */
  /* ─────────────────────────────────────────────────────────────── */

  const handleRegionChange = useCallback(({ lat, lng }) => {
    setMapRegion({ latitude: lat, longitude: lng });

    if (!fetchCenter) {
      setRegionMoved(false);
      return;
    }
    const dMi = distanceMiles(
      { lat, lng },
      { lat: fetchCenter.lat, lng: fetchCenter.lng }
    );
    if (dMi != null && dMi * 1.609 >= REGION_MOVED_KM) {
      setRegionMoved(true);
    }
  }, [fetchCenter]);

  const onSearchThisArea = () => {
    if (!mapRegion) return;
    loadNearby(mapRegion.latitude, mapRegion.longitude);
  };

  const onCenterOnUser = () => {
    if (!location) {
      toast?.show('Location unavailable.', { variant: 'warning' });
      return;
    }
    setMapRegion({ latitude: location.latitude, longitude: location.longitude });
  };

  /* ─────────────────────────────────────────────────────────────── */
  /*  FILTERING                                                       */
  /* ─────────────────────────────────────────────────────────────── */

  const visibleSpots = useMemo(() => {
    let list = spots;
    if (selectedCategory) {
      list = list.filter(
        (s) => String(s.category || '').toLowerCase() === selectedCategory
      );
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => {
        const title = String(s.title || s.name || '').toLowerCase();
        const district = String(getDistrict(s) || '').toLowerCase();
        return title.includes(q) || district.includes(q);
      });
    }
    return list;
  }, [spots, selectedCategory, searchQuery]);

  const editorsPick = useMemo(() => pickHighestRanked(visibleSpots), [visibleSpots]);

  /* ─────────────────────────────────────────────────────────────── */
  /*  MARKERS + PIN TEMPLATE                                         */
  /* ─────────────────────────────────────────────────────────────── */

  const markers = useMemo(() => {
    return visibleSpots
      .filter((s) => Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)))
      .map((s) => ({
        id: s.id,
        lat: Number(s.lat),
        lng: Number(s.lng),
        spot: s,
      }));
  }, [visibleSpots]);

  const pinTemplate = useCallback((marker) => {
    const spot = marker.spot;
    if (!spot) return null;
    const isPick = editorsPick && String(editorsPick.id) === String(spot.id);
    const html = renderPinHtml(spot, {
      isEditorsPick: isPick,
      isHighlighted: surpriseSpot && String(surpriseSpot.id) === String(spot.id),
    });
    const size = isPick ? [56, 66] : [28, 36];
    const anchor = isPick ? [28, 66] : [14, 36];
    return { html, size, anchor };
  }, [editorsPick, surpriseSpot]);

  /* ─────────────────────────────────────────────────────────────── */
  /*  PREVIEW SHEET                                                  */
  /* ─────────────────────────────────────────────────────────────── */

  const openBottomSheet = useCallback((spot) => {
    setSelectedSpot(spot);
    requestAnimationFrame(() => {
      setTimeout(() => bottomSheetRef.current?.snapToIndex(0), 50);
    });
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setSelectedSpot(null);
  }, []);

  const onMarkerPress = useCallback((marker) => {
    const id = String(marker?.id ?? '');
    const spot = visibleSpots.find((s) => String(s.id) === id);
    if (spot) openBottomSheet(spot);
  }, [visibleSpots, openBottomSheet]);

  const toggleSave = useCallback(async (spot) => {
    if (!spot?.id) return;
    const id = spot.id;
    const wasSaved = !!savedMap[id];
    setSavedMap((m) => ({ ...m, [id]: !wasSaved }));
    try {
      if (wasSaved) {
        await unsaveSpot(id);
        toast?.show('Removed from your collection.', { variant: 'info' });
      } else {
        await saveSpot(id);
        toast?.show('Saved.', { variant: 'success' });
      }
    } catch (err) {
      logger.error('MapScreen.toggleSave failed', err);
      setSavedMap((m) => ({ ...m, [id]: wasSaved }));
      toast?.show('Could not update saved spots.', { variant: 'error' });
    }
  }, [savedMap, toast]);

  const onDirections = useCallback((spot) => {
    if (!spot) return;
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast?.show('No coordinates for this spot.', { variant: 'warning' });
      return;
    }
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(spot.title || 'Spot')})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url).catch((err) =>
      logger.error('MapScreen.openDirections failed', err)
    );
  }, [toast]);

  /* ─────────────────────────────────────────────────────────────── */
  /*  SURPRISE ME (preserved)                                         */
  /* ─────────────────────────────────────────────────────────────── */

  const handleSurpriseMe = async () => {
    try {
      setRevealing(true);
      setShowRevealModal(true);
      revealProgress.value = 0;
      particleScale.value = 0;
      spotCardScale.value = 0;
      spotCardRotation.value = -10;
      pulseAnim.setValue(1);
      revealAnim.setValue(0);
      scaleAnim.setValue(0);

      sparkleRotation.value = withRepeat(withTiming(360, { duration: 2000 }), -1, false);
      modalOpacity.value = withTiming(1, { duration: 300 });

      const spot = await getSurpriseMeSpot();
      if (spot?.error) {
        toast?.show(spot.error, { variant: 'error' });
        setRevealing(false);
        setShowRevealModal(false);
        modalOpacity.value = withTiming(0, { duration: 300 });
        return;
      }

      setSurpriseSpot(spot);

      particleScale.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(1.5, { duration: 300 }),
        withTiming(0, { duration: 200 })
      );

      revealProgress.value = withTiming(1, { duration: 1500 }, (finished) => {
        if (finished) {
          'worklet';
          spotCardScale.value = withSpring(1, { damping: 10, stiffness: 100 });
          spotCardRotation.value = withSpring(0, { damping: 10, stiffness: 100 });
        }
      });

      if (spot.lat && spot.lng) {
        setTimeout(() => {
          setMapRegion({ latitude: Number(spot.lat), longitude: Number(spot.lng) });
        }, 500);
      }

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 800, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
        ])
      ).start();

      Animated.parallel([
        Animated.timing(revealAnim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        modalOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
          if (finished) {
            'worklet';
            runOnJS(setShowRevealModal)(false);
            runOnJS(openBottomSheet)(spot);
            runOnJS(setRevealing)(false);
          }
        });
      }, 6000);
    } catch (err) {
      logger.error('MapScreen.handleSurpriseMe failed', err);
      toast?.show('Could not pick a surprise spot.', { variant: 'error' });
      setRevealing(false);
      setShowRevealModal(false);
      modalOpacity.value = withTiming(0, { duration: 300 });
    }
  };

  const modalAnimatedStyle = useAnimatedStyle(() => ({ opacity: modalOpacity.value }));
  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));
  const particleAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(particleScale.value, [0, 1, 1.5], [0, 1, 0], Extrapolate.CLAMP);
    const opacity = interpolate(particleScale.value, [0, 1, 1.5], [1, 1, 0], Extrapolate.CLAMP);
    return { transform: [{ scale }], opacity };
  });
  const revealCircleStyle = useAnimatedStyle(() => {
    const scale = interpolate(revealProgress.value, [0, 1], [0, 3], Extrapolate.CLAMP);
    const opacity = interpolate(revealProgress.value, [0, 0.5, 1], [0.8, 0.4, 0], Extrapolate.CLAMP);
    return { transform: [{ scale }], opacity };
  });
  const spotCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: spotCardScale.value },
      { rotate: `${spotCardRotation.value}deg` },
    ],
    opacity: spotCardScale.value,
  }));

  /* ─────────────────────────────────────────────────────────────── */
  /*  RENDER                                                          */
  /* ─────────────────────────────────────────────────────────────── */

  const selectedDistanceMi = useMemo(() => {
    if (!selectedSpot || !location) return null;
    return distanceMiles(
      { lat: location.latitude, lng: location.longitude },
      selectedSpot
    );
  }, [selectedSpot, location]);

  const previewMeta = useMemo(() => {
    if (!selectedSpot) return '';
    return buildMetaLine(selectedSpot, selectedDistanceMi);
  }, [selectedSpot, selectedDistanceMi]);

  const previewSaved = !!(selectedSpot && savedMap[selectedSpot.id]);

  return (
    <SafeAreaView edges={['top']} style={s.safe}>
      <View style={s.root}>
        {/* Layer 0 — the map engine */}
        <LeafletMap
          ref={mapRef}
          latitude={mapRegion?.latitude ?? location?.latitude ?? 9.0080}
          longitude={mapRegion?.longitude ?? location?.longitude ?? 38.7886}
          markers={markers}
          pinTemplate={pinTemplate}
          onMarkerPress={onMarkerPress}
          onRegionChange={handleRegionChange}
          interactive
          showUserLocation={!!location}
          userLocation={location}
          height={Dimensions.get('window').height}
          style={s.map}
        />

        {/* Layer 1 — top controls */}
        <View
          pointerEvents="box-none"
          style={[s.topControls, { top: safeTop + 10 }]}
        >
          <View style={s.searchWrap}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search the area…"
              surface="glass"
            />
          </View>
          <IconSquare
            onPress={() => toast?.show('Filter sheet coming in Phase 4.', { variant: 'info' })}
            accessibilityLabel="Open filters"
          >
            <Ionicons name="options-outline" size={18} color={fieldGuide.cream} />
          </IconSquare>
        </View>

        {/* Layer 1 — chip filter row */}
        <View
          pointerEvents="box-none"
          style={[s.chipRow, { top: safeTop + 64 }]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipScroll}
          >
            <View style={s.chipItem}>
              <Pill
                variant={selectedCategory ? 'glass' : 'ember'}
                dot={!selectedCategory}
                onPress={() => setSelectedCategory(null)}
              >
                {`ALL · ${zeroPad(visibleSpots.length, 2)}`}
              </Pill>
            </View>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <View key={cat.id} style={s.chipItem}>
                  <Pill
                    variant={active ? 'ember' : 'glass'}
                    dot={active}
                    onPress={() => setSelectedCategory(active ? null : cat.id)}
                  >
                    {cat.label}
                  </Pill>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Layer 1 — search this area pill */}
        {regionMoved ? (
          <View
            pointerEvents="box-none"
            style={[s.searchAreaWrap, { top: safeTop + 116 }]}
          >
            <Pressable
              onPress={onSearchThisArea}
              accessibilityRole="button"
              accessibilityLabel="Search this area"
              style={({ pressed }) => [
                s.searchAreaBtn,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <Ionicons name="refresh" size={12} color={fieldGuide.inkText} />
              <Text style={s.searchAreaText}>Search this area</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Layer 1 — side rail */}
        <View
          pointerEvents="box-none"
          style={[s.sideRail, { top: safeTop + 130 }]}
        >
          <IconSquare
            radius={12}
            onPress={onCenterOnUser}
            accessibilityLabel="Center on my location"
          >
            <Ionicons name="locate" size={18} color={fieldGuide.cream} />
          </IconSquare>
          <IconSquare
            radius={12}
            onPress={() => setStylePopoverOpen((v) => !v)}
            accessibilityLabel="Map style"
          >
            <Ionicons name="earth-outline" size={18} color={fieldGuide.cream} />
          </IconSquare>
          <IconSquare
            radius={12}
            onPress={handleSurpriseMe}
            accessibilityLabel="Surprise me"
          >
            <Ionicons
              name={revealing ? 'sparkles' : 'sparkles-outline'}
              size={18}
              color={fieldGuide.ember}
            />
          </IconSquare>
        </View>

        {/* Layer 1 — map style popover */}
        <MapStylePopover
          visible={stylePopoverOpen}
          onClose={() => setStylePopoverOpen(false)}
          value={mapStyle}
          onChange={setMapStyle}
          anchor={{ top: safeTop + 130 + 44 + 10 + 44 + 10, right: 16 + 44 + 8 }}
          onComingSoon={(label) =>
            toast?.show(`${label} coming soon.`, { variant: 'info' })
          }
        />

        {/* Layer 1 — reveal modal (preserved) */}
        <Modal
          visible={showRevealModal}
          transparent
          animationType="none"
          onRequestClose={() => {
            setShowRevealModal(false);
            setRevealing(false);
          }}
        >
          <Reanimated.View style={[s.revealRoot, modalAnimatedStyle]}>
            <View style={s.revealBg} />

            {[...Array(20)].map((_, i) => {
              const angle = (i * 360) / 20;
              const distance = 150;
              const x = Math.cos((angle * Math.PI) / 180) * distance;
              const y = Math.sin((angle * Math.PI) / 180) * distance;
              return (
                <Reanimated.View
                  key={i}
                  style={[
                    s.particle,
                    { left: '50%', top: '50%', marginLeft: x, marginTop: y },
                    particleAnimatedStyle,
                  ]}
                >
                  <Ionicons name="star" size={12} color={vibeColor} />
                </Reanimated.View>
              );
            })}

            <Reanimated.View style={[s.revealCircle, revealCircleStyle, { borderColor: vibeColor }]} />
            <Reanimated.View style={[s.revealCircle, revealCircleStyle, { borderColor: vibeColor, borderWidth: 3 }]} />

            <Reanimated.View style={[s.sparkleContainer, sparkleAnimatedStyle]}>
              <Ionicons name="sparkles" size={80} color={vibeColor} />
            </Reanimated.View>

            {surpriseSpot ? (
              <Reanimated.View style={[s.revealCard, spotCardAnimatedStyle]}>
                <Image
                  source={{ uri: surpriseSpot.thumbnail || surpriseSpot.images?.[0] }}
                  style={s.revealImg}
                />
                <View style={[s.revealOverlay, { backgroundColor: hexToRgba(vibeColor, 0.9) }]}>
                  <Text style={s.revealTitle}>{surpriseSpot.title}</Text>
                  <View style={s.revealBadge}>
                    <Ionicons name="location" size={14} color={fieldGuide.cream} />
                    <Text style={s.revealAddress} numberOfLines={1}>
                      {surpriseSpot.address}
                    </Text>
                  </View>
                </View>
              </Reanimated.View>
            ) : (
              <Text style={s.revealLoading}>Discovering your surprise…</Text>
            )}
          </Reanimated.View>
        </Modal>

        {/* Layer 1 — bottom preview sheet (FG editorial layout) */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          handleComponent={null}
          backgroundStyle={s.sheetBg}
          onClose={() => setSelectedSpot(null)}
        >
          {selectedSpot ? (
            <BottomSheetView style={[s.sheet, { paddingBottom: safeBot + 16 }]}>
              <View style={s.sheetHandleRow}>
                <SheetHandle />
              </View>

              <View style={s.sheetTopRow}>
                <View style={s.sheetThumb}>
                  <SpotPhoto
                    vibe={vibeForCategory(selectedSpot.category)}
                    image={
                      selectedSpot.thumbnail
                        ? { uri: selectedSpot.thumbnail }
                        : selectedSpot.images?.[0]
                          ? { uri: selectedSpot.images[0] }
                          : undefined
                    }
                    aspect="1/1"
                    index={`NO. ${indexForSpot(selectedSpot)}`}
                    showSaveStamp={false}
                  />
                </View>
                <View style={s.sheetInfo}>
                  <Text style={s.sheetTitle} numberOfLines={1}>
                    {selectedSpot.title || selectedSpot.name || 'Untitled spot'}
                  </Text>
                  {previewMeta ? (
                    <MonoMeta size="spot" style={s.sheetMeta}>
                      {previewMeta}
                    </MonoMeta>
                  ) : null}
                  {selectedSpot.description ? (
                    <Text style={s.sheetBlurb} numberOfLines={2}>
                      {selectedSpot.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={s.sheetActions}>
                <EditorialButton
                  size="sm"
                  variant="cream"
                  onPress={() => {
                    closeBottomSheet();
                    navigation.navigate('SpotDetail', { spotId: selectedSpot.id });
                  }}
                  style={s.actionFlex}
                >
                  Open
                </EditorialButton>
                <EditorialButton
                  size="sm"
                  variant="ghost"
                  onPress={() => toggleSave(selectedSpot)}
                  leading={
                    <Ionicons
                      name={previewSaved ? 'bookmark' : 'bookmark-outline'}
                      size={14}
                      color={fieldGuide.cream}
                    />
                  }
                  style={s.actionFlex}
                >
                  {previewSaved ? 'Saved' : 'Save'}
                </EditorialButton>
                <EditorialButton
                  size="sm"
                  variant="ghost"
                  onPress={() => onDirections(selectedSpot)}
                  accessibilityLabel="Directions"
                  style={s.actionIcon}
                >
                  <Ionicons name="navigate-outline" size={14} color={fieldGuide.cream} />
                </EditorialButton>
              </View>
            </BottomSheetView>
          ) : null}
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
};

/* ─────────────────────────────────────────────────────────────────── */
/*  STYLES                                                             */
/* ─────────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  root: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: fieldGuide.ink,
  },

  /* top controls */
  topControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },
  searchWrap: {
    flex: 1,
  },

  /* chip row */
  chipRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 5,
  },
  chipScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipItem: {
    marginRight: 8,
  },

  /* search this area */
  searchAreaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 6,
  },
  searchAreaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: fieldGuide.cream,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: fieldGuide.radius.full,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  searchAreaText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    textTransform: 'uppercase',
    color: fieldGuide.inkText,
    includeFontPadding: false,
  },

  /* side rail */
  sideRail: {
    position: 'absolute',
    right: 16,
    flexDirection: 'column',
    gap: 10,
    zIndex: 5,
  },

  /* bottom sheet */
  sheetBg: {
    backgroundColor: fieldGuide.inkElev,
    borderTopLeftRadius: fieldGuide.radius.xl,
    borderTopRightRadius: fieldGuide.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  sheet: {
    paddingHorizontal: 14,
    paddingTop: 0,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 10,
  },
  sheetTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  sheetThumb: {
    width: 84,
    height: 84,
    borderRadius: fieldGuide.radius.md,
    overflow: 'hidden',
  },
  sheetInfo: {
    flex: 1,
    minWidth: 0,
  },
  sheetTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 19,
    color: fieldGuide.cream,
    letterSpacing: -0.01 * 19,
    lineHeight: 21,
    includeFontPadding: false,
  },
  sheetMeta: {
    marginTop: 4,
  },
  sheetBlurb: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: fieldGuide.creamSoft,
    includeFontPadding: false,
  },

  sheetActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 14,
  },
  actionFlex: {
    flex: 1,
  },
  actionIcon: {
    width: 44,
    paddingHorizontal: 0,
  },

  /* reveal modal */
  revealRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  revealBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(11,12,17,0.92)',
  },
  particle: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  sparkleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  revealCard: {
    width: Math.min(SCREEN_W - 48, 320),
    height: 200,
    borderRadius: fieldGuide.radius.xl,
    overflow: 'hidden',
    zIndex: 20,
    marginTop: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  revealImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  revealOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
  },
  revealTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 22,
    color: fieldGuide.cream,
    marginBottom: 8,
    includeFontPadding: false,
  },
  revealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11,12,17,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: fieldGuide.radius.md,
    alignSelf: 'flex-start',
  },
  revealAddress: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 11,
    letterSpacing: fieldGuide.tracking.wide(11),
    textTransform: 'uppercase',
    color: fieldGuide.cream,
    flex: 1,
  },
  revealLoading: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
    marginTop: 200,
    zIndex: 15,
  },
});

export default MapScreen;
