/**
 * ReviewRow — inline review preview for SpotDetail's "What people
 * noticed" block.
 *
 * CSS ref: .review preview rows (screens/13-spot-detail.html L264-312).
 * Compact variant — three lines of avatar + name + when + dots,
 * plus an italic serif body.
 *
 * Props:
 *   review: {
 *     id,
 *     text | content,
 *     rating?,
 *     createdAt | timestamp,
 *     user?: { id, name, displayName?, isLocal?, location? },
 *     photos?: string[],
 *     helpful? | helpfulCount?,
 *     tags?: string[]
 *   }
 *   onPress?: () => void
 *   style?: ViewStyle
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import MonoMeta from '../primitives/MonoMeta';
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
  if (!name || typeof name !== 'string') return '?';
  return name.trim().charAt(0).toUpperCase() || '?';
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

function locationLabel(user) {
  if (!user) return '';
  if (user.location && typeof user.location === 'string') {
    return user.location.toUpperCase();
  }
  if (user.city) return String(user.city).toUpperCase();
  if (typeof user.isLocal === 'boolean') return user.isLocal ? 'LOCAL' : 'VISITOR';
  return '';
}

export default function ReviewRow({ review, onPress, style }) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  // TODO(backend): rating may be missing in the current backend payload.
  // For the inline preview we default to 5 ember dots (matches the
  // editorial intent that listed reviews are positive by default) and
  // fall back when the field arrives in a future API version.
  const rating = typeof review?.rating === 'number' ? review.rating : 5;
  const text = review?.text || review?.content || '';
  const name = review?.user?.displayName || review?.user?.name || 'Explorer';
  const when = timeAgo(review?.createdAt || review?.timestamp);
  const place = locationLabel(review?.user);
  const meta = [when, place].filter(Boolean).join(' · ');

  const palette = avatarColors(review?.user?.id || name, fieldGuide);
  const photos = getDisplayableReviewPhotos(review);

  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress
    ? {
        onPress,
        accessibilityRole: 'button',
        accessibilityLabel: `Review by ${name}`,
      }
    : {};

  return (
    <Wrapper {...wrapperProps} style={[styles.row, style]}>
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
          {meta ? (
            <MonoMeta size="spot" style={styles.when}>
              {meta}
            </MonoMeta>
          ) : null}
        </View>
        <View style={styles.dots}>
          <RatingDots value={rating} showNumber={false} size="sm" />
        </View>
      </View>

      {text ? (
        <Text style={styles.body} numberOfLines={3}>
          {text.startsWith('"') ? text : `"${text}"`}
        </Text>
      ) : null}

      {photos.length > 0 ? (
        <View style={styles.photoRow}>
          {photos.slice(0, 3).map((uri, i) => (
            <Image
              key={`${uri}-${i}`}
              source={{ uri }}
              style={styles.photoThumb}
              resizeMode="cover"
            />
          ))}
        </View>
      ) : null}
    </Wrapper>
  );
}

function createStyles(fieldGuide) {

  return StyleSheet.create({
  row: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 14,
    includeFontPadding: false,
  },
  who: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fieldGuide.fonts.sansSemi,
    fontSize: 13,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  when: {
    marginTop: 2,
  },
  dots: {
    marginLeft: 'auto',
  },
  body: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13.5,
    lineHeight: 21,
    color: fieldGuide.creamSoft,
  },
  photoRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 6,
  },
  photoThumb: {
    width: 52,
    height: 52,
    borderRadius: fieldGuide.radius.sm,
    backgroundColor: fieldGuide.inkElev,
  },
});
}
