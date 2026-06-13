/**
 * WriteReviewScreen — Phase 4 / design 15.
 *
 * Editorial review composer with the same Field Guide language as the
 * spot detail. Layered top to bottom:
 *
 *   topbar      Cancel · "Write a review" · Post (disabled until rating
 *               > 0 AND text.length >= 30)
 *   place-card  thumb + spot title + mono meta (NO. XX · CAT · DISTR)
 *   rate        5 round star buttons + rate-result word
 *   words       bare DM Sans textarea + char count
 *   photos      h-scroll of 80×80 tiles + two dashed add tiles
 *   tags        wrap of toggleable Pills (from vibes.service or static
 *               fallback)
 *   bottom      "Post anonymously" checkbox
 *
 * Photo uploads are picked via expo-image-picker (see services/upload).
 * Because there is no review-photos endpoint we ship the URIs back as
 * part of the comment payload (extra fields will be ignored by the
 * current server — that's acceptable per the spec).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {
  DuotoneVibe,
  MonoMeta,
  Pill,
} from '../components/fieldguide';
import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import {
  createCommentWithMeta,
} from '../services/comments.service';
import { getSpotById } from '../services/spots.service';
import { isSpotVisited } from '../services/visitedSpots.service';
import { useAuth } from '../hooks/useAuth';
import {
  REVIEW_VISIT_REQUIRED_MESSAGE,
  showReviewVisitRequiredToast,
} from '../utils/reviewAccess';
import { getAllVibes } from '../services/vibes.service';
import {
  indexForSpot,
  prettyCategory,
  vibeForCategory,
  zeroPad,
} from '../utils/spotHelpers';

const MAX_CHARS = 600;
const MIN_CHARS = 30;

const FALLBACK_TAGS = [
  'SLOW',
  'GOOD LIGHT',
  'CROWDED',
  'SOLO-FRIENDLY',
  'FOR FRIENDS',
  'CARDAMOM BUN',
  'LATE-NIGHT',
  'WORTH THE WALK',
  'CASH-ONLY',
];

const RATE_WORDS = {
  1: "Wouldn’t go back",
  2: 'Mediocre · pass',
  3: 'Fine · take it or leave it',
  4: 'Very good · I’d come back',
  5: 'A new favorite',
};

function safeArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  if (Array.isArray(maybe?.items)) return maybe.items;
  if (Array.isArray(maybe?.data)) return maybe.data;
  return [];
}

export const WriteReviewScreen = ({ navigation, route }) => {
  const spotId = route?.params?.spotId ?? route?.params?.id;
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [spot, setSpot] = useState(null);
  const [visitChecked, setVisitChecked] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState([]); // [{ uri }]
  const [photoBusy, setPhotoBusy] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagOptions, setTagOptions] = useState(FALLBACK_TAGS);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── require visit before composing a review ───────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!spotId) {
        if (!cancelled) {
          setCanReview(false);
          setVisitChecked(true);
        }
        return;
      }
      if (!user) {
        if (!cancelled) {
          toast.show('Sign in to write a review.', { variant: 'info' });
          setCanReview(false);
          setVisitChecked(true);
          navigation.goBack();
        }
        return;
      }
      try {
        const visited = await isSpotVisited(spotId);
        if (cancelled) return;
        if (!visited) {
          showReviewVisitRequiredToast(toast);
          setCanReview(false);
          setVisitChecked(true);
          navigation.goBack();
          return;
        }
        setCanReview(true);
        setVisitChecked(true);
      } catch (err) {
        logger.error('WriteReview.isSpotVisited', err);
        if (!cancelled) {
          toast.show(REVIEW_VISIT_REQUIRED_MESSAGE, { variant: 'info' });
          setCanReview(false);
          setVisitChecked(true);
          navigation.goBack();
        }
      }
    })();
    return () => { cancelled = true; };
  }, [spotId, user, navigation, toast]);

  // ── load spot ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!spotId || !canReview) return;
      try {
        const data = await getSpotById(spotId);
        if (cancelled) return;
        if (!data?.error) setSpot(data);
      } catch (err) {
        logger.error('WriteReview.getSpot', err);
      }
    })();
    return () => { cancelled = true; };
  }, [spotId, canReview]);

  // ── load vibe tags ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getAllVibes();
        if (cancelled) return;
        const list = safeArray(data)
          .map((v) =>
            String(v?.name || v?.label || v?.id || '').toUpperCase().trim(),
          )
          .filter(Boolean);
        if (list.length) setTagOptions(list);
      } catch (err) {
        // Keep the FALLBACK_TAGS — non-fatal.
        logger.error('WriteReview.getAllVibes', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dirty = rating > 0 || text.trim().length > 0 || photos.length > 0 || tags.length > 0;
  const canSubmit = rating > 0 && text.trim().length >= MIN_CHARS && !submitting;
  const charsUsed = text.trim().length;
  const charsRemaining = Math.max(0, MIN_CHARS - charsUsed);
  const hasRating = rating > 0;
  const hasMinChars = charsUsed >= MIN_CHARS;
  const submitReady = hasRating && hasMinChars && !submitting;
  const submitHint = !hasRating
    ? 'Select a rating first.'
    : !hasMinChars
      ? `Write at least ${charsRemaining} more ${charsRemaining === 1 ? 'character' : 'characters'}.`
      : submitting
        ? 'Posting your review...'
        : 'Ready to post.';

  // ── handlers ──────────────────────────────────────────────────────
  const handleCancel = () => {
    if (!dirty) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Discard this review?',
      'Your stamp will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ],
    );
  };

  const toggleStar = (n) => {
    setRating((r) => (r === n ? 0 : n));
  };

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const pickPhotos = useCallback(async () => {
    if (photoBusy) return;
    try {
      setPhotoBusy(true);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Photo access not granted.', { variant: 'error' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.85,
      });
      if (result.canceled) return;
      const next = (result.assets || []).map((a, i) => ({
        uri: a.uri,
        name: a.fileName || `review_${Date.now()}_${i}.jpg`,
        type: a.mimeType || 'image/jpeg',
      }));
      setPhotos((prev) => [...prev, ...next].slice(0, 8));
    } catch (err) {
      logger.error('WriteReview.pickPhotos', err);
      toast.show('Could not pick photos.', { variant: 'error' });
    } finally {
      setPhotoBusy(false);
    }
  }, [photoBusy, toast]);

  const takePhoto = useCallback(async () => {
    if (photoBusy) return;
    try {
      setPhotoBusy(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Camera access not granted.', { variant: 'error' });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (asset?.uri) {
        setPhotos((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: asset.fileName || `review_${Date.now()}.jpg`,
            type: asset.mimeType || 'image/jpeg',
          },
        ].slice(0, 8));
      }
    } catch (err) {
      logger.error('WriteReview.takePhoto', err);
      toast.show('Could not open the camera.', { variant: 'error' });
    } finally {
      setPhotoBusy(false);
    }
  }, [photoBusy, toast]);

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!spotId || !canSubmit || !canReview) return;
    setSubmitting(true);
    try {
      // TODO(backend): there's no dedicated review-photos endpoint yet.
      // We forward local URIs in the payload so the server can store
      // them whenever it grows that capability; any unrecognised key
      // is harmless on the existing route.
      const payload = {
        text: text.trim(),
        rating,
        photos,
        tags,
        anonymous,
      };

      const result = await createCommentWithMeta(spotId, payload);
      if (result?.error) {
        const isClient = result?.status && result.status >= 400 && result.status < 500;
        const message =
          result?.code === 'REVIEW_VISIT_REQUIRED' || result?.status === 403
            ? REVIEW_VISIT_REQUIRED_MESSAGE
            : isClient
              ? result.error
              : 'Could not post your review.';
        toast.show(message, {
          variant: result?.status === 403 ? 'info' : 'error',
        });
        logger.error('WriteReview.post', result.error);
        return;
      }
      toast.show('Stamped. Thanks for the note.', { variant: 'success' });
      navigation.goBack();
    } catch (err) {
      logger.error('WriteReview.post', err);
      toast.show('Could not post your review.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const onPressPost = useCallback(() => {
    if (!spotId) {
      toast.show('Spot unavailable.', { variant: 'error' });
      return;
    }
    if (rating <= 0) {
      toast.show('Select a rating first.', { variant: 'info' });
      return;
    }
    if (charsUsed < MIN_CHARS) {
      const remaining = MIN_CHARS - charsUsed;
      toast.show(`Write at least ${remaining} more ${remaining === 1 ? 'character' : 'characters'}.`, {
        variant: 'info',
      });
      return;
    }
    handlePost();
  }, [spotId, rating, charsUsed, toast, handlePost]);

  // ── derived ───────────────────────────────────────────────────────
  const indexLabel = `NO. ${zeroPad(indexForSpot(spot || { id: spotId }, 0), 3)}`;
  const placeMeta = [
    indexLabel,
    prettyCategory(spot?.category).toUpperCase(),
    (spot?.district || spot?.city || '').toUpperCase(),
  ]
    .filter(Boolean)
    .join(' · ');

  // ── render ────────────────────────────────────────────────────────
  if (!visitChecked || !canReview) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.visitGate}>
          <ActivityIndicator color={fieldGuide.ember} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        {/* TOP BAR */}
        <View style={styles.topbar}>
          <Pressable
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            hitSlop={10}
          >
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Write a review</Text>
          <Pressable
            onPress={onPressPost}
            accessibilityRole="button"
            accessibilityLabel={submitting ? 'Posting review' : 'Post review'}
            accessibilityState={{ disabled: !canSubmit, busy: submitting }}
            hitSlop={10}
            style={[
              styles.postBtn,
              !canSubmit && styles.postBtnDisabled,
              submitting && styles.postBtnBusy,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF8F1" size="small" />
            ) : (
              <Text style={[styles.postBtnText, !canSubmit && styles.postBtnTextDisabled]}>
                Post
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.fill}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* PLACE CARD */}
          <View style={styles.placeCard}>
            <View style={styles.placeThumb}>
              <DuotoneVibe vibe={vibeForCategory(spot?.category)} />
            </View>
            <View style={styles.placeBody}>
              <Text style={styles.placeName} numberOfLines={1}>
                {spot?.title || 'Loading…'}
              </Text>
              <MonoMeta size="spot" style={{ marginTop: 3 }}>
                {placeMeta || '—'}
              </MonoMeta>
            </View>
          </View>

          {/* RATE */}
          <View style={styles.rateSection}>
            <Text style={styles.rateLbl}>HOW WAS IT?</Text>
            <View style={styles.rateRow}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = rating >= n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => toggleStar(n)}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} stars`}
                    accessibilityState={{ selected: on }}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.star,
                      {
                        backgroundColor: on ? fieldGuide.ember : 'transparent',
                        borderColor: on ? fieldGuide.ember : fieldGuide.inkLine2,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={on ? 'star' : 'star-outline'}
                      size={16}
                      color={on ? '#FFF8F1' : fieldGuide.creamFaint}
                    />
                  </Pressable>
                );
              })}
            </View>
            {rating > 0 ? (
              <View style={styles.rateResult}>
                <Text style={styles.rateNum}>
                  {`${rating}.0`}
                  <Text style={styles.rateNumSmall}>/5</Text>
                </Text>
                <Text style={styles.rateWord}>{RATE_WORDS[rating]}</Text>
              </View>
            ) : null}
          </View>

          {/* WORDS */}
          <View style={styles.section}>
            <Text style={styles.sectionLbl}>IN YOUR OWN WORDS</Text>
            <View style={styles.submitStatusRow}>
              <Text style={[styles.submitStatusText, !hasRating && styles.submitStatusWarn]}>
                {`Rating: ${hasRating ? '✓' : '✕'}`}
              </Text>
              <Text style={[styles.submitStatusText, !hasMinChars && styles.submitStatusWarn]}>
                {`Chars: ${charsUsed}/${MIN_CHARS}`}
              </Text>
              <Text style={[styles.submitStatusText, submitReady && styles.submitStatusReady]}>
                {submitHint.toUpperCase()}
              </Text>
            </View>
            <TextInput
              value={text}
              onChangeText={(v) => {
                if (v.length <= MAX_CHARS) setText(v);
                else setText(v.slice(0, MAX_CHARS));
              }}
              placeholder="What made the visit?"
              placeholderTextColor={fieldGuide.creamFaint}
              multiline
              style={styles.textarea}
              textAlignVertical="top"
            />
            <View style={styles.charCountRow}>
              <Text
                style={[
                  styles.charCount,
                  charsUsed < MIN_CHARS && styles.charCountWarn,
                ]}
              >
                {`${text.length} / ${MAX_CHARS} (min ${MIN_CHARS})`}
              </Text>
            </View>
          </View>

          {/* PHOTOS */}
          <View style={styles.section}>
            <Text style={styles.sectionLbl}>
              {`PHOTOS · ${photos.length} ADDED`}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
            >
              {photos.map((p, i) => (
                <View key={`${p.uri}-${i}`} style={styles.photoTile}>
                  <Image
                    source={{ uri: p.uri }}
                    style={styles.photoImg}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => removePhoto(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${i + 1}`}
                    hitSlop={6}
                    style={styles.photoClose}
                  >
                    <Ionicons name="close" size={11} color="#FFF8F1" />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={pickPhotos}
                disabled={photoBusy}
                accessibilityRole="button"
                accessibilityLabel="Pick from library"
                style={({ pressed }) => [
                  styles.addTile,
                  { opacity: pressed || photoBusy ? 0.7 : 1 },
                ]}
              >
                {photoBusy ? (
                  <ActivityIndicator color={fieldGuide.creamMute} />
                ) : (
                  <Ionicons name="add" size={18} color={fieldGuide.creamMute} />
                )}
              </Pressable>
              <Pressable
                onPress={takePhoto}
                disabled={photoBusy}
                accessibilityRole="button"
                accessibilityLabel="Take a photo"
                style={({ pressed }) => [
                  styles.addTile,
                  { opacity: pressed || photoBusy ? 0.7 : 1 },
                ]}
              >
                <Ionicons
                  name="camera-outline"
                  size={16}
                  color={fieldGuide.creamMute}
                />
              </Pressable>
            </ScrollView>
          </View>

          {/* TAGS */}
          <View style={styles.section}>
            <Text style={styles.sectionLbl}>TAG THE VIBE</Text>
            <View style={styles.tagWrap}>
              {tagOptions.map((tag) => {
                const on = tags.includes(tag);
                return (
                  <Pill
                    key={tag}
                    variant={on ? 'ember' : 'default'}
                    onPress={() => toggleTag(tag)}
                  >
                    {tag}
                  </Pill>
                );
              })}
            </View>
          </View>

          {/* ANONYMOUS */}
          <View
            style={[
              styles.anonRow,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <Pressable
              onPress={() => setAnonymous((a) => !a)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: anonymous }}
              style={[
                styles.anonBox,
                {
                  backgroundColor: anonymous ? fieldGuide.ember : 'transparent',
                  borderColor: anonymous ? fieldGuide.ember : fieldGuide.inkLine2,
                },
              ]}
            >
              {anonymous ? (
                <Ionicons name="checkmark" size={11} color="#FFF8F1" />
              ) : null}
            </Pressable>
            <Pressable onPress={() => setAnonymous((a) => !a)} hitSlop={4}>
              <Text style={styles.anonLabel}>Post anonymously</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WriteReviewScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  visitGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { flex: 1 },

  topbar: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  cancel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 16,
    color: fieldGuide.cream,
  },
  postBtn: {
    minWidth: 76,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fieldGuide.ember,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.ember,
  },
  postBtnDisabled: {
    backgroundColor: fieldGuide.inkElev,
    borderColor: fieldGuide.inkLine2,
    opacity: 0.7,
  },
  postBtnBusy: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  postBtnText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: '#FFF8F1',
    textTransform: 'uppercase',
  },
  postBtnTextDisabled: {
    color: fieldGuide.creamMute,
  },

  placeCard: {
    marginHorizontal: 22,
    marginTop: 22,
    padding: 14,
    borderRadius: fieldGuide.radius.md,
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeThumb: {
    width: 56,
    height: 56,
    borderRadius: fieldGuide.radius.sm,
    overflow: 'hidden',
    backgroundColor: fieldGuide.ink,
  },
  placeBody: {
    flex: 1,
    minWidth: 0,
  },
  placeName: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 16,
    color: fieldGuide.cream,
    letterSpacing: -0.005 * 16,
    includeFontPadding: false,
  },

  rateSection: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  rateLbl: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.widest(9.5),
    color: fieldGuide.creamMute,
    textAlign: 'center',
  },
  rateRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  star: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateResult: {
    marginTop: 18,
    alignItems: 'center',
  },
  rateNum: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 38,
    lineHeight: 38,
    color: fieldGuide.cream,
    letterSpacing: -0.02 * 38,
    includeFontPadding: false,
  },
  rateNumSmall: {
    fontFamily: fieldGuide.fonts.display,
    fontSize: 14,
    color: fieldGuide.creamMute,
  },
  rateWord: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.sansMedium,
    fontSize: 14,
    color: fieldGuide.emberSoft,
  },

  section: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  sectionLbl: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.wider(9.5),
    color: fieldGuide.creamMute,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  textarea: {
    width: '100%',
    minHeight: 120,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 17,
    lineHeight: 26,
    color: fieldGuide.cream,
    padding: 0,
  },
  submitStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  submitStatusText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
  },
  submitStatusWarn: {
    color: fieldGuide.rose,
  },
  submitStatusReady: {
    color: fieldGuide.moss,
  },
  charCountRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  charCount: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    color: fieldGuide.creamFaint,
    textTransform: 'uppercase',
  },
  charCountWarn: {
    color: fieldGuide.rose,
  },

  photoRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  photoTile: {
    width: 80,
    height: 80,
    borderRadius: fieldGuide.radius.sm,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoClose: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(20,22,29,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: 80,
    height: 80,
    borderRadius: fieldGuide.radius.sm,
    borderWidth: 1.5,
    borderColor: fieldGuide.inkLine2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  anonRow: {
    paddingHorizontal: 22,
    paddingTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  anonBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonLabel: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    color: fieldGuide.creamMute,
  },
});
