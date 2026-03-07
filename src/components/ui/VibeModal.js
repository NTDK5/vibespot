/**
 * VibeModal - Add/Edit vibe reactions for a spot
 * Fixes: selected vibes display, max 3 slots, remaining slots indicator
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, shadows } from '../../theme/tokens';

const MAX_VIBES = 3;

/** Normalize myVibes from API to array of IDs (handles different response shapes) */
const normalizeVibeIds = (myVibes) => {
  if (!myVibes) return [];
  if (Array.isArray(myVibes)) {
    return myVibes.map((v) => (typeof v === 'object' && v?.id != null ? v.id : v)).filter((id) => id != null);
  }
  if (myVibes?.vibeIds && Array.isArray(myVibes.vibeIds)) {
    return myVibes.vibeIds;
  }
  return [];
};

export const VibeModal = ({
  visible,
  onClose,
  allVibes = [],
  myVibes = [],
  selectedVibes,
  onSelectedVibesChange,
  onSave,
  isSaving,
}) => {
  const { theme, isDark } = useTheme();
  const [localSelected, setLocalSelected] = useState([]);
  const remainingSlots = MAX_VIBES - localSelected.length;

  const myVibeIds = useMemo(() => normalizeVibeIds(myVibes), [myVibes]);

  useEffect(() => {
    if (visible) {
      const ids = myVibeIds.length > 0 ? myVibeIds : (selectedVibes || []);
      setLocalSelected(Array.isArray(ids) ? [...ids].slice(0, MAX_VIBES) : []);
    }
  }, [visible, myVibeIds.join(','), selectedVibes?.join(',')]);

  const toggleVibe = (vibeId) => {
    setLocalSelected((prev) => {
      const exists = prev.includes(vibeId);
      if (exists) return prev.filter((id) => id !== vibeId);
      if (prev.length >= MAX_VIBES) return prev;
      return [...prev, vibeId];
    });
  };

  const handleSave = () => {
    onSelectedVibesChange?.(localSelected);
    onSave?.(localSelected);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.handle} />
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>How does it feel?</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Slots indicator */}
          <View style={[styles.slotsRow, { backgroundColor: theme.backgroundAlt || theme.surface }]}>
            <Text style={[styles.slotsLabel, { color: theme.textMuted }]}>
              Select up to 3 vibes
            </Text>
            <View style={styles.slotsPills}>
              {[1, 2, 3].map((slot) => (
                <View
                  key={slot}
                  style={[
                    styles.slotPill,
                    localSelected.length >= slot && {
                      backgroundColor: theme.primary,
                    },
                    { borderColor: theme.border },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.slotsCount, { color: theme.textMuted }]}>
              {localSelected.length}/3
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {allVibes.map((vibe) => {
                const isSelected = localSelected.includes(vibe.id);
                const wasPreviouslyAdded = myVibeIds.includes(vibe.id);
                const iconName = (vibe.icon || 'heart')
                  .replace(/^Fa/, '')
                  .toLowerCase();

                return (
                  <TouchableOpacity
                    key={vibe.id}
                    activeOpacity={0.8}
                    onPress={() => toggleVibe(vibe.id)}
                    style={[
                      styles.vibeCard,
                      {
                        backgroundColor: isSelected ? vibe.color : (theme.surfaceAlt || theme.surface),
                        borderWidth: wasPreviouslyAdded ? 2 : 0,
                        borderColor: wasPreviouslyAdded ? (isSelected ? vibe.color : theme.primary) : 'transparent',
                      },
                    ]}
                  >
                    <FontAwesome
                      name={iconName}
                      size={20}
                      color={isSelected ? '#fff' : (vibe.color || theme.primary)}
                    />
                    <Text
                      style={[
                        styles.vibeLabel,
                        { color: isSelected ? '#fff' : theme.text },
                      ]}
                      numberOfLines={1}
                    >
                      {vibe.name}
                    </Text>
                    {wasPreviouslyAdded && (
                      <View style={[styles.yourVibeBadge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : theme.primarySoft }]}>
                        <Text style={[styles.yourVibeText, { color: isSelected ? '#fff' : theme.primary }]}>
                          Your vibe
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: theme.primary },
                (localSelected.length === 0 || isSaving) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={localSelected.length === 0 || isSaving}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving...' : `Save (${localSelected.length}/3)`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: 40,
    maxHeight: '75%',
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  slotsLabel: {
    fontSize: 13,
  },
  slotsPills: {
    flexDirection: 'row',
    gap: 6,
  },
  slotPill: {
    width: 24,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  slotsCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    maxHeight: 320,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  vibeCard: {
    width: '31%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  vibeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  yourVibeBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  yourVibeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
