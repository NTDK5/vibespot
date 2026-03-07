/**
 * XP & Badge celebration overlay
 * Animated popup for XP gain, badge unlock, level up
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius } from '../../theme/tokens';

const { width } = Dimensions.get('window');

export const XPBadgeCelebration = ({
  visible,
  onDismiss,
  type = 'xp', // 'xp' | 'badge' | 'level'
  message,
  value,
  badgeIcon,
  badgeName,
  durationMs = 2200,
}) => {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0);
    opacity.setValue(0);
    confettiOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 120,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(confettiOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss?.();
      });
    }, durationMs);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const isBadge = type === 'badge';
  const isLevel = type === 'level';

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              transform: [{ scale }],
            },
          ]}
        >
          {isBadge && (
            <View style={[styles.badgeIconWrap, { backgroundColor: theme.primarySoft }]}>
              <Text style={styles.badgeEmoji}>{badgeIcon || '🏅'}</Text>
            </View>
          )}
          {isLevel && (
            <View style={[styles.levelBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.levelText}>Level Up!</Text>
            </View>
          )}
          <Text style={[styles.title, { color: theme.text }]}>
            {isBadge && (badgeName || 'Badge Unlocked!')}
            {isLevel && 'Level Up!'}
            {type === 'xp' && 'XP Gained'}
          </Text>
          {message && (
            <Text style={[styles.message, { color: theme.textMuted }]} numberOfLines={2}>
              {message}
            </Text>
          )}
          {value != null && type === 'xp' && (
            <View style={[styles.xpPill, { backgroundColor: theme.primary }]}>
              <Text style={styles.xpValue}>+{value} XP</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: width * 0.8,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  levelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  levelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  xpPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  xpValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
