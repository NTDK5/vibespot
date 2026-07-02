/**
 * EmptyState — centered "nothing tucked away yet" composition.
 *
 * Source: screens/23-empty.html. Uses PostmarkStamp + CompassDial as the
 * art element, with an editorial title (italic emphasis), supporting
 * paragraph, and an optional primary CTA.
 *
 * Props:
 *   title: string                         e.g. "Nothing tucked away yet."
 *   italic?: string                       italicized emphasis word in title
 *   body?: string
 *   eyebrow?: string                      default "NO. 000"
 *   pageName?: string                     renders "NO. 000 · {pageName}" eyebrow
 *   perimeterText?: string                default "VIBESPOT · FIELD GUIDE · "
 *   cta?: { label: string, onPress: () => void }
 *   primaryCta?: { label, onPress }       alias for cta
 *   secondaryCta?: { label, onPress }
 *   style?: ViewStyle
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useTheme } from '../../../context/ThemeContext';
import DisplayTitle from '../primitives/DisplayTitle';
import MonoMeta from '../primitives/MonoMeta';
import EditorialButton from '../form/EditorialButton';
import PostmarkStamp from '../signature/PostmarkStamp';
import CompassDial from '../signature/CompassDial';

export default function EmptyState({
  title,
  italic,
  body,
  eyebrow,
  pageName,
  perimeterText = 'VIBESPOT · FIELD GUIDE · ',
  cta,
  primaryCta,
  secondaryCta,
  style,
}) {
  const { fieldGuide } = useTheme();
  const styles = useThemedStyles(createStyles);
  const resolvedEyebrow =
    eyebrow || (pageName ? `NO. 000 · ${pageName}` : 'NO. 000');
  const primary = primaryCta || cta;
  const secondary = secondaryCta;
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.art}>
        <PostmarkStamp
          perimeterText={perimeterText}
          size={180}
          color={fieldGuide.creamMute}
          ringStyle="double"
          center={<CompassDial size={84} breathing />}
        />
      </View>

      <MonoMeta size="kicker" style={styles.eyebrow}>
        {resolvedEyebrow}
      </MonoMeta>

      <DisplayTitle size="lg" italic={italic} style={styles.title}>
        {title}
      </DisplayTitle>

      {body ? (
        <Text style={styles.body}>{body}</Text>
      ) : null}

      {primary || secondary ? (
        <View style={styles.ctaCol}>
          {primary ? (
            <EditorialButton
              variant="primary"
              block
              onPress={primary.onPress}
              style={styles.ctaItem}
            >
              {primary.label}
            </EditorialButton>
          ) : null}
          {secondary ? (
            <EditorialButton
              variant="ghost"
              block
              onPress={secondary.onPress}
              style={styles.ctaItem}
            >
              {secondary.label}
            </EditorialButton>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(fieldGuide) {
  return StyleSheet.create({
  wrap: {
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fieldGuide.ink,
  },
  art: {
    marginBottom: 32,
  },
  eyebrow: {
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    maxWidth: 280,
  },
  body: {
    marginTop: 14,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: fieldGuide.creamSoft,
    textAlign: 'center',
    maxWidth: 320,
  },
  ctaCol: {
    marginTop: 32,
    width: '100%',
    maxWidth: 320,
  },
  ctaItem: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 10,
  },
});
}
