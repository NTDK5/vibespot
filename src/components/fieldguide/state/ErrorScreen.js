/**
 * ErrorScreen — "return to sender" error layout.
 *
 * Source: screens/26-error.html. A tilted PostmarkStamp (rose) is the
 * star of the show; eyebrow with the error code in rose; an italic
 * editorial title; ghost retry button plus a mono "Write the editors"
 * link.
 *
 * Props:
 *   code?: string                    default "ERR · 500"
 *   title?: string                   default "Return to sender."
 *   italic?: string                  default "sender."
 *   body?: string
 *   onRetry?: () => void
 *   onContact?: () => void
 *   style?: ViewStyle
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import fieldGuide from '../../../theme/fieldGuide';
import DisplayTitle from '../primitives/DisplayTitle';
import MonoMeta from '../primitives/MonoMeta';
import EditorialButton from '../form/EditorialButton';
import PostmarkStamp from '../signature/PostmarkStamp';

export default function ErrorScreen({
  code = 'ERR · 500',
  title = 'Return to sender.',
  italic = 'sender.',
  body = "Something fumbled on our end. Try again in a moment — we'll be back at the desk.",
  onRetry,
  onContact,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.stampWrap}>
        <PostmarkStamp
          perimeterText="RETURN TO SENDER · UNDELIVERED · "
          size={160}
          color={fieldGuide.rose}
          ringStyle="double"
          tilt={-6}
          center={
            <Ionicons name="close" size={44} color={fieldGuide.rose} />
          }
        />
      </View>

      <MonoMeta size="kicker" color={fieldGuide.rose} style={{ marginTop: 28 }}>
        {code}
      </MonoMeta>

      <DisplayTitle size="lg" italic={italic} italicColor={fieldGuide.rose} style={styles.title}>
        {title}
      </DisplayTitle>

      {body ? <Text style={styles.body}>{body}</Text> : null}

      <View style={styles.actions}>
        {onRetry ? (
          <EditorialButton variant="ghost" block onPress={onRetry}>
            Try again
          </EditorialButton>
        ) : null}
        {onContact ? (
          <Pressable
            onPress={onContact}
            accessibilityRole="link"
            hitSlop={8}
            style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}
          >
            <MonoMeta size="eyebrow" color={fieldGuide.ember}>
              WRITE THE EDITORS →
            </MonoMeta>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 40,
    backgroundColor: fieldGuide.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampWrap: {
    marginBottom: 8,
  },
  title: {
    marginTop: 8,
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
  actions: {
    marginTop: 32,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  link: {
    marginTop: 16,
    paddingVertical: 8,
  },
});
