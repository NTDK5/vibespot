/**
 * FullReviewCard — large review card used on ReviewsScreen.
 *
 * CSS ref: .review block in screens/14-reviews.html L92-168. Larger
 * avatar (40×40), trailing dots column with numeric score, optional
 * photos row, optional tags row, and a mono actions line for
 * "{n} FOUND HELPFUL" / "REPLY".
 *
 * Props:
 *   review: { id, text|content, rating, createdAt|timestamp, user,
 *             photos?, tags?, helpfulCount? | helpful? }
 *   onHelpful?: (reviewId) => void
 *   onReply?:   (reviewId) => void
 *   onPressPhoto?: (photos, index) => void
 *   style?: ViewStyle
 */

import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import MonoMeta from '../primitives/MonoMeta';
import Pill from '../chrome/Pill';
import RatingDots from './RatingDots';
import { getDisplayableReviewPhotos } from '../../../utils/reviewPhotos';

function avatarPalette(fieldGuide) {

  return [
    { bg: fieldGuide.emberSoft, color: fieldGuide.inkText },
    { bg: fieldGuide.moss, color: fieldGuide.inkText },
    { bg: fieldGuide.gold, color: fieldGuide.inkText },
    { bg: fieldGuide.rose, color: '#FFFFFF' },
  ];
}

function avatarColors(seed, fieldGuide) {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const palette = avatarPalette(fieldGuide);
  return palette[h % palette.length];
}

function initial(name) {
  if (!name) return '?';
  return String(name).trim().charAt(0).toUpperCase() || '?';
}

function timeAgo(input) {
  if (!input) return '';
  const then = new Date(input);
  if (isNaN(then.getTime())) return '';
  const sec = Math.max(1, Math.floor((Date.now() - then.getTime()) / 1000));
  if (sec < 60) return 'JUST NOW';
  if (sec < 3600) return `${Math.floor(sec / 60)} MIN AGO`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} HR AGO`;
  const days = Math.floor(sec / 86400);
  if (days < 7) return `${days} ${days === 1 ? 'DAY' : 'DAYS'} AGO`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? 'WEEK' : 'WEEKS'} AGO`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'MO' : 'MOS'} AGO`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'YR' : 'YRS'} AGO`;
}

function metaLine(user, photoCount) {
  const parts = [];
  if (user?.isLocal === true) parts.push('LOCAL');
  else if (user?.isLocal === false) parts.push('VISITOR');
  if (user?.location && typeof user.location === 'string') {
    parts.push(String(user.location).toUpperCase());
  } else if (user?.city) {
    parts.push(String(user.city).toUpperCase());
  }
  if (user?.reviewCount) {
    parts.push(`${user.reviewCount} REVIEW${user.reviewCount === 1 ? '' : 'S'}`);
  } else if (photoCount > 0) {
    parts.push(`${photoCount} PHOTO${photoCount === 1 ? '' : 'S'}`);
  }
  return parts.join(' · ');
}

export default function FullReviewCard({
  review,
  onHelpful,
  onReply,
  onPressPhoto,
  style,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  // TODO(backend): rating may be missing in the current payload. We
  // present 5 ember dots as a hopeful default; once the backend wires
  // a numeric rating in, FullReviewCard will pick it up automatically.
  const rating = typeof review?.rating === 'number' ? review.rating : 5;
  const scoreLabel = `${rating.toFixed(1)}`;
  const photos = getDisplayableReviewPhotos(review);
  const tags = Array.isArray(review?.tags) ? review.tags.filter(Boolean) : [];
  const name = review?.user?.displayName || review?.user?.name || 'Explorer';
  const palette = avatarColors(review?.user?.id || name, fieldGuide);
  const text = review?.text || review?.content || '';
  const when = timeAgo(review?.createdAt || review?.timestamp);
  const meta = metaLine(review?.user, photos.length);
  const whenLine = [when, meta].filter(Boolean).join(' · ');

  const baseHelpful = useMemo(() => {
    return (
      review?.helpfulCount ??
      review?.helpful ??
      review?.likes ??
      0
    );
  }, [review]);
  const [helpful, setHelpful] = useState(baseHelpful);
  const [pressedHelpful, setPressedHelpful] = useState(false);

  const handleHelpful = () => {
    if (pressedHelpful) return;
    setPressedHelpful(true);
    setHelpful((n) => Number(n || 0) + 1);
    if (onHelpful) onHelpful(review?.id);
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
          <Text style={[styles.avatarText, { color: palette.color }]}>
            {initial(name)}
          </Text>
        </View>
        <View style={styles.who}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {whenLine ? (
            <MonoMeta size="spot" style={{ marginTop: 2 }}>
              {whenLine}
            </MonoMeta>
          ) : null}
        </View>
        <View style={styles.dotsCol}>
          <RatingDots value={rating} showNumber={false} size="sm" />
          <MonoMeta size="spot" style={{ marginTop: 4 }}>
            {scoreLabel}
          </MonoMeta>
        </View>
      </View>

      {text ? (
        <Text style={styles.body}>
          {text.startsWith('"') ? text : `"${text}"`}
        </Text>
      ) : null}

      {photos.length > 0 ? (
        <View style={styles.photoRow}>
          {photos.slice(0, 4).map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              onPress={() => onPressPhoto && onPressPhoto(photos, i)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Photo ${i + 1}`}
              style={({ pressed }) => [
                styles.photoTile,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Image
                source={{ uri }}
                style={styles.photoImg}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </View>
      ) : null}

      {tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.slice(0, 6).map((t, i) => (
            <Pill key={`${t}-${i}`} variant="default">
              {String(t).toUpperCase()}
            </Pill>
          ))}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleHelpful}
          accessibilityRole="button"
          accessibilityLabel="Mark helpful"
          style={({ pressed }) => [
            styles.actionItem,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons
            name="thumbs-up-outline"
            size={12}
            color={pressedHelpful ? fieldGuide.ember : fieldGuide.creamMute}
          />
          <Text
            style={[
              styles.actionText,
              { color: pressedHelpful ? fieldGuide.ember : fieldGuide.creamMute },
            ]}
          >
            {`${helpful} FOUND HELPFUL`}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onReply && onReply(review?.id)}
          accessibilityRole="button"
          accessibilityLabel="Reply"
          style={({ pressed }) => [
            styles.actionItem,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons
            name="return-down-back-outline"
            size={12}
            color={fieldGuide.creamMute}
          />
          <Text style={styles.actionText}>REPLY</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(fieldGuide) {

  return StyleSheet.create({
  card: {
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 15,
    includeFontPadding: false,
  },
  who: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 13.5,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  dotsCol: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  body: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: fieldGuide.creamSoft,
  },
  photoRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 6,
  },
  photoTile: {
    width: 64,
    height: 64,
    borderRadius: fieldGuide.radius.sm,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  tagRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.wider(9.5),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
  },
});
}
