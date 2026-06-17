/**
 * ShareDispatchSheet — branded share preview before the OS share sheet.
 *
 * Spot variant: hero card with IndexStamp, vibes, PostmarkStamp perimeter.
 * Collection variant: mosaic cover + pocket title.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../../../theme/fieldGuide';
import { BRAND } from '../../../brand/fena';
import SheetHandle from '../primitives/SheetHandle';
import MonoMeta from '../primitives/MonoMeta';
import EditorialButton from '../form/EditorialButton';
import DisplayTitle from '../primitives/DisplayTitle';
import IndexStamp from '../spot/IndexStamp';
import PostmarkStamp from '../signature/PostmarkStamp';
import MosaicCover from '../collection/MosaicCover';
import { useToast } from '../../ToastProvider';
import { logger } from '../../../utils/logger';
import { track, Events } from '../../../analytics';
import { indexForSpot, prettyCategory, zeroPad } from '../../../utils/spotHelpers';
import {
  buildCollectionSharePayload,
  buildSpotSharePayload,
  buildSubtitleLine,
  isChampionSpot,
  resolveCollectionShareUrl,
  resolveSpotShareUrl,
  shareMessageForPlatform,
  topVibesDisplay,
} from '../../../utils/spotShareHelpers';

const SHEET_HEIGHT = 640;
const ANIM_MS = 240;
const NOTE_MAX = 140;

function spotHeroImage(spot) {
  const imgs = Array.isArray(spot?.images) ? spot.images.filter(Boolean) : [];
  if (imgs.length) return imgs[0];
  return spot?.thumbnail || spot?.coverImage || null;
}

function collectionSpotThumbs(collection) {
  const raw = Array.isArray(collection?.spots) ? collection.spots : [];
  return raw
    .map((row) => {
      const spot = row?.spot?.id ? row.spot : row;
      const imgs = Array.isArray(spot?.images) ? spot.images : [];
      return imgs[0] || spot?.thumbnail || spot?.coverImage || null;
    })
    .filter(Boolean)
    .slice(0, 4);
}

function postmarkDate() {
  return new Date()
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

export default function ShareDispatchSheet({
  visible,
  onClose,
  variant = 'spot',
  spot = null,
  collection = null,
  spotId = null,
  topVibes = [],
  walkMin = null,
  userName = '',
  onShared,
}) {
  const toast = useToast();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const cardRef = useRef(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const isSpot = variant === 'spot';
  const subject = isSpot ? spot : collection;

  useEffect(() => {
    if (!visible) {
      setNote('');
      setBusy(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIM_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: ANIM_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdrop]);

  const vibeSummary = useMemo(() => topVibesDisplay(topVibes), [topVibes]);
  const tags = Array.isArray(spot?.tags) ? spot.tags : [];
  const subtitle = useMemo(() => {
    if (!isSpot || !spot) return { main: '', walk: null };
    return buildSubtitleLine(spot, tags, vibeSummary, walkMin);
  }, [isSpot, spot, tags, vibeSummary, walkMin]);

  const shareUrl = isSpot
    ? resolveSpotShareUrl(spot, spotId || spot?.id)
    : resolveCollectionShareUrl(collection);

  const notePrefix = userName?.trim()
    ? `${userName.trim()} sent you a spot:`
    : 'A spot for you on FENA:';

  const payload = useMemo(() => {
    const userNote = note.trim()
      ? `${isSpot ? notePrefix : `${userName?.trim() || 'Someone'} sent you a pocket:`}\n${note.trim()}`
      : '';
    if (isSpot) {
      return buildSpotSharePayload(spot, { walkMin, topVibes, userNote });
    }
    return buildCollectionSharePayload(collection, { userNote });
  }, [isSpot, spot, collection, walkMin, topVibes, note, notePrefix, userName]);

  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast.show('No share link available.', { variant: 'error' });
      return;
    }
    await Clipboard.setStringAsync(shareUrl);
    toast.show('Link copied.', { variant: 'success' });
  };

  const handleSend = async () => {
    if (!subject || busy) return;
    setBusy(true);
    try {
      const platformPayload = shareMessageForPlatform(payload);
      let fileUri = null;

      try {
        if (cardRef.current?.capture) {
          fileUri = await cardRef.current.capture({
            format: 'png',
            quality: 0.92,
            result: 'tmpfile',
          });
        }
      } catch (captureErr) {
        logger.error('ShareDispatch.capture', captureErr);
      }

      const shareOptions = Platform.OS === 'ios'
        ? {
            title: payload.title,
            message: platformPayload.message,
            url: fileUri || platformPayload.url || shareUrl || undefined,
          }
        : {
            title: payload.title,
            message: platformPayload.message,
            url: fileUri || undefined,
          };

      await Share.share(shareOptions);

      if (isSpot) {
        track(Events.SPOT_SHARED, {
          spot_id: spotId || spot?.id,
          has_url: !!shareUrl,
          has_image: !!fileUri,
        });
      } else {
        track(Events.COLLECTION_SHARED, {
          collection_id: collection?.id,
          has_url: !!shareUrl,
          has_image: !!fileUri,
        });
      }

      onShared?.();
      onClose?.();
    } catch (err) {
      if (err?.message !== 'User did not share') {
        logger.error('ShareDispatch.send', err);
        toast.show('Could not open share sheet.', { variant: 'error' });
      }
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  const indexLabel = isSpot
    ? `NO. ${zeroPad(indexForSpot(spot || { id: spotId }, 0), 3)}`
    : null;
  const categoryLabel = isSpot
    ? prettyCategory(spot?.category || spot?.type || 'SPOT').toUpperCase()
    : 'POCKET';
  const perimeter = `${BRAND.serviceCityName.toUpperCase()} · FENA · ${categoryLabel} · ${postmarkDate()}`;
  const champion = isSpot && isChampionSpot(spot);
  const pocketCount =
    collection?.spotCount ??
    collection?._count?.spots ??
    collection?.spots?.length ??
    0;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <SheetHandle />
          <MonoMeta style={styles.eyebrow}>DISPATCH</MonoMeta>
          <Text style={styles.headline}>Share this {isSpot ? 'spot' : 'pocket'}</Text>

          <ViewShot ref={cardRef} options={{ format: 'png', quality: 0.92 }} style={styles.cardShot}>
            <View style={styles.previewCard}>
              {isSpot ? (
                <>
                  <View style={styles.heroWrap}>
                    {spotHeroImage(spot) ? (
                      <Image source={{ uri: spotHeroImage(spot) }} style={styles.heroImage} />
                    ) : (
                      <View style={[styles.heroImage, styles.heroPlaceholder]} />
                    )}
                    {indexLabel ? (
                      <IndexStamp position="tl">{indexLabel}</IndexStamp>
                    ) : null}
                    {champion ? (
                      <View style={styles.championBadge}>
                        <Text style={styles.championText}>CHAMPION</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.cardBody}>
                    <DisplayTitle size="sm" style={styles.cardTitle}>
                      {spot?.title || 'Spot'}
                    </DisplayTitle>
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {[spot?.address || spot?.district, subtitle.main].filter(Boolean).join(' · ')}
                    </Text>
                    {subtitle.walk ? (
                      <MonoMeta style={styles.cardMeta}>{subtitle.walk}</MonoMeta>
                    ) : null}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.heroWrap}>
                    <MosaicCover
                      images={collectionSpotThumbs(collection)}
                      aspectRatio={4 / 3}
                      style={styles.mosaic}
                    />
                  </View>
                  <View style={styles.cardBody}>
                    <DisplayTitle size="sm" style={styles.cardTitle}>
                      {collection?.title || 'Pocket'}
                    </DisplayTitle>
                    <MonoMeta style={styles.cardMeta}>
                      {pocketCount} SPOT{pocketCount === 1 ? '' : 'S'}
                    </MonoMeta>
                  </View>
                </>
              )}

              <View style={styles.stampRow}>
                <PostmarkStamp perimeterText={perimeter} size={72} tilt={-8} />
              </View>
              <MonoMeta style={styles.footerMono}>{BRAND.splashFooter}</MonoMeta>
            </View>
          </ViewShot>

          <Text style={styles.noteLabel}>Personal note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a line for your friend…"
            placeholderTextColor={fieldGuide.creamMute}
            value={note}
            onChangeText={(t) => setNote(t.slice(0, NOTE_MAX))}
            maxLength={NOTE_MAX}
            multiline
          />

          <View style={styles.actions}>
            <EditorialButton
              onPress={handleSend}
              disabled={busy}
              style={styles.primaryBtn}
            >
              {busy ? 'Sending…' : 'Send dispatch'}
            </EditorialButton>
            <Pressable style={styles.secondaryBtn} onPress={handleCopyLink}>
              <Ionicons name="link-outline" size={18} color={fieldGuide.cream} />
              <Text style={styles.secondaryText}>Copy link</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: fieldGuide.ink,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '92%',
  },
  eyebrow: {
    textAlign: 'center',
    marginTop: 4,
    color: fieldGuide.ember,
  },
  headline: {
    fontFamily: fieldGuide.fonts.display,
    fontSize: 22,
    color: fieldGuide.cream,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardShot: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 300,
  },
  previewCard: {
    backgroundColor: fieldGuide.inkElev,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    overflow: 'hidden',
    aspectRatio: 4 / 5,
  },
  heroWrap: {
    height: '52%',
    backgroundColor: fieldGuide.ink,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: fieldGuide.inkLine,
  },
  mosaic: {
    flex: 1,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    flex: 1,
  },
  cardTitle: {
    color: fieldGuide.cream,
  },
  cardSubtitle: {
    fontFamily: fieldGuide.fonts.body,
    fontSize: 13,
    color: fieldGuide.creamMute,
    marginTop: 4,
    lineHeight: 18,
  },
  cardMeta: {
    marginTop: 6,
    color: fieldGuide.creamMute,
  },
  stampRow: {
    position: 'absolute',
    right: 10,
    bottom: 36,
    opacity: 0.9,
  },
  footerMono: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    right: 14,
    textAlign: 'center',
    color: fieldGuide.creamMute,
    fontSize: 8,
  },
  championBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: fieldGuide.ember,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  championText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    color: fieldGuide.ink,
    letterSpacing: 1,
  },
  noteLabel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    color: fieldGuide.creamMute,
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: 1,
  },
  noteInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
    color: fieldGuide.cream,
    fontFamily: fieldGuide.fonts.body,
    fontSize: 14,
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  secondaryText: {
    fontFamily: fieldGuide.fonts.body,
    color: fieldGuide.cream,
    fontSize: 15,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: fieldGuide.fonts.body,
    color: fieldGuide.creamMute,
    fontSize: 14,
  },
});
