/**
 * EditProfileScreen — Phase 5 / design 20.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import FloatingLabelInput from '../components/fieldguide/form/FloatingLabelInput';
import { Pill } from '../components/fieldguide';
import MonoMeta from '../components/fieldguide/primitives/MonoMeta';
import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import {
  getMe,
  loadLocalProfile,
  saveLocalProfile,
  updateMe,
} from '../services/user.service';
import { pickImage } from '../services/upload';
import { initialFor } from '../utils/spotHelpers';

const PREFERENCE_OPTIONS = [
  'Quiet cafés',
  'Rooftops',
  'Nightlife',
  'Galleries',
  'Workspaces',
  'Hidden alleys',
];

export const EditProfileScreen = ({ navigation }) => {
  const { user, updateLocalUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [homeCity, setHomeCity] = useState(user?.homeCity || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [preferences, setPreferences] = useState(
    Array.isArray(user?.preferences) ? user.preferences : [],
  );
  const [avatarUri, setAvatarUri] = useState(user?.profileImage || null);
  const [saving, setSaving] = useState(false);

  const hydrate = useCallback(async () => {
    if (!user?.id) return;
    const local = await loadLocalProfile(user.id);
    if (local) {
      if (local.bio != null) setBio(local.bio);
      if (local.homeCity != null) setHomeCity(local.homeCity);
      if (local.username != null) setUsername(local.username);
      if (local.preferences) setPreferences(local.preferences);
      if (local.profileImage) setAvatarUri(local.profileImage);
    }

    const remote = await getMe();
    if (remote?.error) return;
    setName(remote.name || '');
    setUsername(remote.username || username);
    setHomeCity(remote.homeCity || '');
    setBio(remote.bio || '');
    if (Array.isArray(remote.preferences)) {
      setPreferences(remote.preferences);
    }
    if (remote.profileImage) setAvatarUri(remote.profileImage);
  }, [user?.id, username]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const togglePreference = (label) => {
    setPreferences((prev) => {
      if (prev.includes(label)) {
        return prev.filter((p) => p !== label);
      }
      if (prev.length >= 3) return prev;
      return [...prev, label];
    });
  };

  const handlePickAvatar = async () => {
    const img = await pickImage();
    if (img?.uri) {
      setAvatarUri(img.uri);
      // TODO: upload avatar when backend endpoint exists
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      username: username.trim() || undefined,
      homeCity: homeCity.trim() || undefined,
      bio: bio.trim() || undefined,
      preferences,
      profileImage: avatarUri || undefined,
    };

    try {
      const result = await updateMe(payload);

      if (!result?.error) {
        await updateLocalUser?.({
          ...user,
          ...payload,
          ...(typeof result === 'object' ? result : {}),
        });
        toast.show('Profile updated.', { variant: 'success' });
        navigation.goBack();
        return;
      }

      const useLocal =
        result.status === 404 ||
        result.status === 501 ||
        result.status === 405;

      if (!useLocal) {
        throw new Error(result.error);
      }

      await saveLocalProfile(user.id, payload);
      await updateLocalUser?.({
        ...user,
        ...payload,
        name: payload.name || user.name,
      });
      toast.show('Saved on this device only.', { variant: 'info' });
      navigation.goBack();
    } catch (err) {
      await saveLocalProfile(user.id, payload);
      await updateLocalUser?.({
        ...user,
        ...payload,
        name: payload.name || user.name,
      });
      toast.show(
        err.message || 'Saved on this device only.',
        { variant: 'info' },
      );
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const notifRow = (label, hint) => (
    <Pressable
      key={label}
      onPress={() => {
        toast.show('Manage in Settings', { variant: 'info' });
        navigation.navigate('Settings');
      }}
      style={({ pressed }) => [
        styles.notifRow,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.notifInfo}>
        <Text style={styles.notifTitle}>{label}</Text>
        {hint ? <Text style={styles.notifHint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={fieldGuide.creamMute} />
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.topbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.topTitle}>Edit profile</Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={8}>
          <Text style={styles.save}>{saving ? '…' : 'Save'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.avBlock}>
            <View style={styles.avShell}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avBig} />
              ) : (
                <View style={styles.avBig}>
                  <Text style={styles.avInitial}>
                    {initialFor(name || user?.name)}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={handlePickAvatar}
                style={styles.camFab}
                accessibilityLabel="Change photo"
              >
                <Ionicons
                  name="camera-outline"
                  size={14}
                  color={fieldGuide.ink}
                />
              </Pressable>
            </View>
            <Pressable onPress={handlePickAvatar}>
              <MonoMeta size="eyebrow" color={fieldGuide.ember} style={styles.changeLink}>
                Change photo
              </MonoMeta>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About you</Text>
            <FloatingLabelInput label="Display name" value={name} onChangeText={setName} />
            <FloatingLabelInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <FloatingLabelInput
              label="Home city"
              value={homeCity}
              onChangeText={setHomeCity}
            />
            <FloatingLabelInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <MonoMeta size="spot" style={styles.prefHint}>
              I usually look for · pick up to 3
            </MonoMeta>
            <View style={styles.prefWrap}>
              {PREFERENCE_OPTIONS.map((opt) => (
                <Pill
                  key={opt}
                  variant={preferences.includes(opt) ? 'ember' : 'default'}
                  onPress={() => togglePreference(opt)}
                >
                  {opt.toUpperCase()}
                </Pill>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {notifRow('Push notifications', 'Spot saves & editor picks')}
            {notifRow('Weekly champion alerts', 'When a saved spot wins')}
            {notifRow("Editor's picks", 'Curated weekend lists')}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  fill: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  cancel: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
    minWidth: 64,
  },
  topTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
  },
  save: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: fieldGuide.ember,
    textTransform: 'uppercase',
    minWidth: 64,
    textAlign: 'right',
  },
  scroll: {
    paddingBottom: 40,
  },
  avBlock: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  avShell: {
    position: 'relative',
  },
  avBig: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: fieldGuide.emberSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avInitial: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 42,
    color: fieldGuide.ink,
  },
  camFab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: fieldGuide.cream,
    borderWidth: 3,
    borderColor: fieldGuide.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeLink: {
    marginTop: 12,
  },
  section: {
    padding: 22,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  sectionTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 16,
    color: fieldGuide.cream,
    marginBottom: 4,
  },
  prefHint: {
    color: fieldGuide.creamMute,
    marginBottom: 4,
  },
  prefWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    gap: 12,
  },
  notifInfo: {
    flex: 1,
  },
  notifTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 15,
    color: fieldGuide.cream,
  },
  notifHint: {
    marginTop: 2,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    color: fieldGuide.creamMute,
  },
});
