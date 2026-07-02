/**
 * SettingsScreen — Phase 5 / design 22.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import MonoMeta from '../components/fieldguide/primitives/MonoMeta';
import ChangePasswordSheet from '../components/fieldguide/sheets/ChangePasswordSheet';
import { BRAND } from '../brand/fena';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const KEY_CHAMPION = 'fena.settings.weeklyChampion';
const KEY_PICKS = 'fena.settings.editorsPicks';

function SettingRow({
  icon,
  iconVariant,
  title,
  subtitle,
  onPress,
  trailing,
  rose,
}) {
  const { fieldGuide } = useTheme();

  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !trailing}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress ? { opacity: 0.88 } : null,
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          iconVariant === 'ember' && styles.rowIconEmber,
          iconVariant === 'rose' && styles.rowIconRose,
        ]}
      >
        <Ionicons
          name={icon}
          size={15}
          color={
            iconVariant === 'ember'
              ? '#FFF8F1'
              : iconVariant === 'rose'
                ? fieldGuide.rose
                : fieldGuide.cream
          }
        />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, rose && { color: fieldGuide.rose }]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {trailing || (onPress ? (
        <Ionicons name="chevron-forward" size={16} color={fieldGuide.creamMute} />
      ) : null)}
    </Pressable>
  );
}

function SettingsToggle({ value, onValueChange }) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.toggle, value && styles.toggleOn]}
    >
      <View
        style={[
          styles.toggleKnob,
          value && { transform: [{ translateX: 18 }] },
        ]}
      />
    </Pressable>
  );
}

export const SettingsScreen = ({ navigation }) => {
  const styles = useThemedStyles(createStyles);
  const { user, logout } = useAuth();
  const { isDark, preference, setPreference, fieldGuide } = useTheme();
  const toast = useToast();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [championAlerts, setChampionAlerts] = useState(true);
  const [editorsPicks, setEditorsPicks] = useState(true);

  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest?.version ||
    '1.0.0';

  const loadToggles = useCallback(async () => {
    try {
      const [c, p] = await AsyncStorage.multiGet([KEY_CHAMPION, KEY_PICKS]);
      if (c[1] != null) setChampionAlerts(c[1] === 'true');
      if (p[1] != null) setEditorsPicks(p[1] === 'true');
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => {
    loadToggles();
  }, [loadToggles]);

  const persistToggle = async (key, value) => {
    await AsyncStorage.setItem(key, value ? 'true' : 'false');
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          const result = await logout();
          if (result?.error) {
            toast.show(result.error, { variant: 'error' });
          }
        },
      },
    ]);
  };

  const group = (label, children) => (
    <View style={styles.group}>
      <MonoMeta size="kicker" style={styles.groupLabel}>
        {label}
      </MonoMeta>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.topbar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={fieldGuide.cream} />
        </Pressable>
        <Text style={styles.topTitle}>Settings</Text>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {group(
          'Account',
          <>
            <SettingRow
              icon="person-outline"
              title="Edit profile"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <SettingRow
              icon="mail-outline"
              title="Email"
              subtitle={user?.email || '—'}
            />
            <SettingRow
              icon="lock-closed-outline"
              title="Change password"
              onPress={() => setPasswordOpen(true)}
            />
          </>,
        )}

        {group(
          'Appearance',
          <>
            <View style={styles.appearanceBlock}>
              <Text style={styles.appearanceHint}>
                Field Guide supports light paper, dark ink, or matching your device.
              </Text>
              <View style={styles.appearanceRow}>
                {[
                  { id: 'light', label: 'Light', icon: 'sunny-outline' },
                  { id: 'dark', label: 'Dark', icon: 'moon-outline' },
                  { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
                ].map((option) => {
                  const active = preference === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setPreference(option.id)}
                      style={({ pressed }) => [
                        styles.appearanceOption,
                        active && styles.appearanceOptionActive,
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={16}
                        color={active ? fieldGuide.ember : fieldGuide.creamMute}
                      />
                      <Text
                        style={[
                          styles.appearanceOptionLabel,
                          active && styles.appearanceOptionLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.appearanceFootnote}>
                {preference === 'system'
                  ? `Following device · currently ${isDark ? 'dark' : 'light'}`
                  : preference === 'dark'
                    ? 'Always dark ink'
                    : 'Always light paper'}
              </Text>
            </View>
          </>,
        )}

        {group(
          'Notifications',
          <>
            <SettingRow
              icon="notifications-outline"
              title="Push notifications"
              onPress={() => navigation.navigate('Notifications')}
            />
            <SettingRow
              icon="trophy-outline"
              title="Weekly champion alerts"
              trailing={
                <SettingsToggle
                  value={championAlerts}
                  onValueChange={(v) => {
                    setChampionAlerts(v);
                    persistToggle(KEY_CHAMPION, v);
                  }}
                />
              }
            />
            <SettingRow
              icon="star-outline"
              title="Editor's picks"
              trailing={
                <SettingsToggle
                  value={editorsPicks}
                  onValueChange={(v) => {
                    setEditorsPicks(v);
                    persistToggle(KEY_PICKS, v);
                  }}
                />
              }
            />
          </>,
        )}

        {group(
          'Privacy & data',
          <>
            <SettingRow
              icon="document-text-outline"
              title="Community Guidelines"
              onPress={() =>
                toast.show('Community Guidelines — coming soon.', {
                  variant: 'info',
                })
              }
            />
            <SettingRow
              icon="shield-outline"
              title="Privacy"
              onPress={() =>
                Linking.openURL(BRAND.privacyUrl).catch(() => {
                  toast.show('Privacy policy link is not available yet.', {
                    variant: 'info',
                  });
                })
              }
            />
            <SettingRow
              icon="download-outline"
              title="Export my data"
              onPress={() =>
                toast.show('Coming soon', { variant: 'info' })
              }
            />
          </>,
        )}

        {group(
          'About',
          <>
            <SettingRow
              icon="create-outline"
              title="Write the editors"
              onPress={() =>
                Linking.openURL(`mailto:${BRAND.supportEmail}`).catch(() => {
                  toast.show('Could not open mail.', { variant: 'error' });
                })
              }
            />
            <SettingRow
              icon="information-circle-outline"
              title="Version"
              subtitle={appVersion}
            />
          </>,
        )}

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOut,
            { opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <View style={styles.versionFooter}>
          <Text style={styles.wm}>{`${BRAND.name}.`}</Text>
          <MonoMeta size="kicker">{`${BRAND.name} · v${appVersion}`}</MonoMeta>
          <MonoMeta size="tab" style={styles.taglineFooter}>
            {BRAND.tagline.toUpperCase()}
          </MonoMeta>
        </View>
      </ScrollView>

      <ChangePasswordSheet
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </SafeAreaView>
  );
};

function createStyles(fieldGuide) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 38,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 22,
    color: fieldGuide.cream,
  },
  scroll: {
    paddingBottom: 40,
  },
  group: {
    paddingVertical: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  groupLabel: {
    paddingHorizontal: 22,
    marginBottom: 14,
    color: fieldGuide.creamMute,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconEmber: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  rowIconRose: {
    borderColor: fieldGuide.rose,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 15,
    color: fieldGuide.cream,
  },
  rowSub: {
    marginTop: 2,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    color: fieldGuide.creamMute,
  },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: fieldGuide.inkLine2,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: fieldGuide.ember,
  },
  toggleKnob: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: fieldGuide.creamFill,
  },
  signOut: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: fieldGuide.rose,
    textTransform: 'uppercase',
  },
  versionFooter: {
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 22,
  },
  wm: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 24,
    color: fieldGuide.cream,
    letterSpacing: -0.01,
  },
  taglineFooter: {
    marginTop: 8,
    color: fieldGuide.creamMute,
    textAlign: 'center',
  },
  appearanceBlock: {
    paddingHorizontal: 22,
    gap: 12,
  },
  appearanceHint: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: fieldGuide.creamMute,
  },
  appearanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  appearanceOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    backgroundColor: fieldGuide.inkElev,
  },
  appearanceOptionActive: {
    borderColor: fieldGuide.ember,
    backgroundColor: 'rgba(232,116,58,0.12)',
  },
  appearanceOptionLabel: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wide(9),
    textTransform: 'uppercase',
    color: fieldGuide.creamMute,
  },
  appearanceOptionLabelActive: {
    color: fieldGuide.cream,
  },
  appearanceFootnote: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wide(9),
    textTransform: 'uppercase',
    color: fieldGuide.creamFaint,
  },
});
}
