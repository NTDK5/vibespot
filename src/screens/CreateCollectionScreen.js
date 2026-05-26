/**
 * CreateCollectionScreen — Phase 4 / design 12 (new screen).
 *
 * Used in two modes:
 *   - create (default): empty form, POST to createCollection on submit.
 *   - edit: preload via getCollectionById(route.params.id), PUT via
 *           updateCollection on submit. Also exposes a rose "Delete
 *           this collection" link at the bottom of the form.
 *
 * Field summary (top → bottom):
 *   - Cover preview        16:10 mosaic, follows the chosen vibes.
 *   - Cover swatches       up to 4 vibes chosen from 8 swatches.
 *   - Glyph                ✦ ☼ ☾ ◇ ⌘ ✚ — Selected one rides ember.
 *   - Title (required)
 *   - Description
 *   - Privacy radios       private / shared (3) / public
 *   - Champion alerts      switch, default ON.
 *
 * The image library picker is wired through expo-image-picker (already
 * installed); successful selections push a `coverImage` field on the
 * payload alongside the chosen vibes. If the library hits an
 * unrecoverable error we surface a toast and keep vibe-only covers.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import {
  DisplayTitle,
  EditorialButton,
  FloatingLabelInput,
  MonoMeta,
  MosaicCover,
  Rule,
} from '../components/fieldguide';
import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import {
  createCollection,
  deleteCollection,
  getCollectionById,
  updateCollection,
} from '../services/collections.service';

/* ─────────────────────────────────────────────────────────────────── */
/*  CONSTANTS                                                          */
/* ─────────────────────────────────────────────────────────────────── */

const VIBE_SWATCHES = [
  { id: 'cafe',    label: 'Café' },
  { id: 'roof',    label: 'Roof' },
  { id: 'park',    label: 'Park' },
  { id: 'water',   label: 'Water' },
  { id: 'night',   label: 'Night' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'alley',   label: 'Alley' },
  { id: 'studio',  label: 'Studio' },
];

const GLYPHS = ['✦', '☼', '☾', '◇', '⌘', '✚'];

const PRIVACY_OPTIONS = [
  {
    id: 'private',
    title: 'Private',
    hint: 'ONLY YOU',
    description: 'Only you can open this collection.',
  },
  {
    id: 'shared',
    title: 'Shared',
    hint: 'UP TO 3 FRIENDS',
    description: 'Send a tap-to-open link to a small circle.',
  },
  {
    id: 'public',
    title: 'Public',
    hint: 'FIELD GUIDE',
    description: 'Anyone in the field guide can find this pocket.',
  },
];

const MAX_COVER_VIBES = 4;

/* ─────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                            */
/* ─────────────────────────────────────────────────────────────────── */

function deriveInitialVibes(collection) {
  if (!collection) return ['cafe'];
  if (Array.isArray(collection.coverVibes) && collection.coverVibes.length) {
    return collection.coverVibes.slice(0, MAX_COVER_VIBES);
  }
  const fromSpots = (collection.spots || [])
    .slice(0, MAX_COVER_VIBES)
    .map((s) => (s?.spot?.category || s?.category || '').toLowerCase())
    .filter(Boolean);
  const known = fromSpots
    .map((c) => {
      if (c.includes('cafe') || c.includes('coffee')) return 'cafe';
      if (c.includes('roof')) return 'roof';
      if (c.includes('park') || c.includes('nature')) return 'park';
      if (c.includes('water') || c.includes('beach')) return 'water';
      if (c.includes('night') || c.includes('bar')) return 'night';
      if (c.includes('gallery') || c.includes('museum')) return 'gallery';
      if (c.includes('alley') || c.includes('street')) return 'alley';
      if (c.includes('studio') || c.includes('work')) return 'studio';
      return null;
    })
    .filter(Boolean);
  return known.length ? known.slice(0, MAX_COVER_VIBES) : ['cafe'];
}

function privacyToFlags(privacy) {
  if (privacy === 'public') return { isPublic: true, sharedWith: [] };
  if (privacy === 'shared') return { isPublic: false, sharedWith: [] };
  return { isPublic: false, sharedWith: [] };
}

function flagsToPrivacy(collection) {
  if (!collection) return 'private';
  if (collection.isPublic) return 'public';
  if (Array.isArray(collection.sharedWith) && collection.sharedWith.length) return 'shared';
  return 'private';
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SCREEN                                                             */
/* ─────────────────────────────────────────────────────────────────── */

export const CreateCollectionScreen = ({ navigation, route }) => {
  const id = route?.params?.id;
  const mode = route?.params?.mode === 'edit' ? 'edit' : 'create';
  const toast = useToast();

  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [coverVibes, setCoverVibes] = useState(['cafe']);
  const [coverImage, setCoverImage] = useState(null);
  const [glyph, setGlyph] = useState(GLYPHS[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const [championAlerts, setChampionAlerts] = useState(true);
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getCollectionById(id);
        if (cancelled) return;
        if (data?.error) {
          logger.error('CreateCollection.preload', data.error);
          toast.show('Could not load this collection.', { variant: 'error' });
        } else {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setCoverVibes(deriveInitialVibes(data));
          setCoverImage(data.coverImage || null);
          setGlyph(GLYPHS.includes(data.glyph) ? data.glyph : GLYPHS[0]);
          setPrivacy(flagsToPrivacy(data));
          if (typeof data.championAlerts === 'boolean') {
            setChampionAlerts(data.championAlerts);
          }
        }
      } catch (err) {
        logger.error('CreateCollection.preload', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, mode, toast]);

  /* ── derived ─────────────────────────────────────────────────────── */
  const mosaicVibes = useMemo(() => {
    if (coverVibes.length === 0) return ['cafe'];
    return coverVibes;
  }, [coverVibes]);

  const canSubmit = title.trim().length > 0 && !submitting;

  /* ── handlers ────────────────────────────────────────────────────── */
  const toggleVibe = (vibeId) => {
    setCoverVibes((prev) => {
      if (prev.includes(vibeId)) return prev.filter((v) => v !== vibeId);
      if (prev.length >= MAX_COVER_VIBES) {
        toast.show(`Up to ${MAX_COVER_VIBES} vibes per cover.`, { variant: 'info' });
        return prev;
      }
      return [...prev, vibeId];
    });
  };

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast.show('Photo library access denied.', { variant: 'error' });
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        aspect: [16, 10],
        allowsEditing: true,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      setCoverImage(asset.uri);
      toast.show('Cover photo set.', { variant: 'success' });
    } catch (err) {
      logger.error('CreateCollection.pickPhoto', err);
      toast.show('Could not open the photo library.', { variant: 'error' });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError('A title is required.');
      return;
    }
    setTitleError('');
    setSubmitting(true);

    // TODO(phase-5): wire a /upload endpoint for collection covers.
    // For now we keep remote URLs as-is and skip attaching local file URIs
    // — they won't survive a JSON POST.
    const uploadedCover =
      coverImage && !coverImage.startsWith('file:') ? coverImage : null;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      glyph,
      coverVibes: mosaicVibes,
      championAlerts,
      ...privacyToFlags(privacy),
      ...(uploadedCover ? { coverImage: uploadedCover } : {}),
    };

    try {
      const result =
        mode === 'edit'
          ? await updateCollection(id, payload)
          : await createCollection(payload);
      if (result?.error) throw new Error(result.error);
      toast.show(
        mode === 'edit' ? 'Changes saved.' : 'Pocket created.',
        { variant: 'success' },
      );
      navigation.goBack();
    } catch (err) {
      logger.error('CreateCollection.submit', err);
      toast.show(
        mode === 'edit' ? 'Could not save changes.' : 'Could not create the collection.',
        { variant: 'error' },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete this collection?',
      'This removes the pocket, not the spots inside it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCollection(id);
            if (result?.error) {
              logger.error('CreateCollection.delete', result.error);
              toast.show('Could not delete that collection.', { variant: 'error' });
              return;
            }
            toast.show('Collection deleted.', { variant: 'success' });
            navigation.goBack();
          },
        },
      ],
    );
  };

  /* ── loading ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.loadingPad}>
          <ActivityIndicator color={fieldGuide.ember} />
        </View>
      </SafeAreaView>
    );
  }

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            style={({ pressed }) => [
              styles.closeBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="close" size={18} color={fieldGuide.cream} />
          </Pressable>
          <Text style={styles.topBarTitle}>
            {mode === 'edit' ? 'Edit pocket' : 'New pocket'}
          </Text>
          <EditorialButton
            variant="ghost"
            size="sm"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
          >
            Save
          </EditorialButton>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Eyebrow + opener */}
          <View style={styles.headBlock}>
            <MonoMeta size="eyebrow">
              {mode === 'edit' ? 'COLLECTIONS · EDIT' : 'COLLECTIONS · NEW'}
            </MonoMeta>
            <DisplayTitle size="lg" weight="500" style={styles.headTitle}>
              {mode === 'edit' ? 'Sharpen the edges.' : 'Name it before you fill it.'}
            </DisplayTitle>
          </View>

          {/* Cover preview */}
          <View style={styles.coverWrap}>
            <MosaicCover
              vibes={mosaicVibes}
              aspectRatio={16 / 10}
              radius={fieldGuide.radius.lg}
            />
            <Pressable
              onPress={pickPhoto}
              accessibilityRole="button"
              accessibilityLabel="Pick a cover photo"
              style={({ pressed }) => [
                styles.coverPick,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="image-outline" size={14} color={fieldGuide.cream} />
              <Text style={styles.coverPickText}>
                {coverImage ? 'Replace photo' : 'Use a photo'}
              </Text>
            </Pressable>
          </View>

          {/* Vibe swatches */}
          <View style={styles.section}>
            <SectionLabel>Cover vibes</SectionLabel>
            <Text style={styles.sectionHint}>
              Pick up to {MAX_COVER_VIBES}. The mosaic above follows your choices.
            </Text>
            <View style={styles.swatchGrid}>
              {VIBE_SWATCHES.map((v) => {
                const active = coverVibes.includes(v.id);
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => toggleVibe(v.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Vibe ${v.label}`}
                    style={({ pressed }) => [
                      styles.swatch,
                      active && styles.swatchActive,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <MosaicCover
                      vibes={[v.id]}
                      aspectRatio={1}
                      radius={fieldGuide.radius.md}
                    />
                    <Text
                      style={[
                        styles.swatchLabel,
                        active && styles.swatchLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {v.label.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Glyph */}
          <View style={styles.section}>
            <SectionLabel>Glyph</SectionLabel>
            <View style={styles.glyphRow}>
              {GLYPHS.map((g) => {
                const active = glyph === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setGlyph(g)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Glyph ${g}`}
                    hitSlop={4}
                    style={({ pressed }) => [
                      styles.glyph,
                      active && styles.glyphActive,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.glyphLabel,
                        active && styles.glyphLabelActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Inputs */}
          <View style={styles.section}>
            <FloatingLabelInput
              label="Title"
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                if (titleError) setTitleError('');
              }}
              placeholder="Rainy day cafés"
              error={titleError || undefined}
              returnKeyType="next"
            />
          </View>
          <View style={styles.section}>
            <FloatingLabelInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Why this collection exists, in a sentence."
              multiline
            />
          </View>

          {/* Privacy */}
          <View style={styles.section}>
            <SectionLabel>Privacy</SectionLabel>
            <Rule style={styles.sectionRule} />
            {PRIVACY_OPTIONS.map((opt) => {
              const active = privacy === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setPrivacy(opt.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.radioRow,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      active && styles.radioOuterActive,
                    ]}
                  >
                    {active ? <View style={styles.radioInner} /> : null}
                  </View>
                  <View style={styles.radioBody}>
                    <Text style={styles.radioTitle}>{opt.title}</Text>
                    <Text style={styles.radioHint}>
                      {opt.hint} · {opt.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Champion alerts */}
          <View style={styles.section}>
            <SectionLabel>Notifications</SectionLabel>
            <Rule style={styles.sectionRule} />
            <View style={styles.switchRow}>
              <View style={styles.switchBody}>
                <Text style={styles.switchTitle}>Champion alerts</Text>
                <Text style={styles.switchHint}>
                  Tell me when a spot in this pocket becomes the weekly Champion.
                </Text>
              </View>
              <Pressable
                onPress={() => setChampionAlerts((v) => !v)}
                accessibilityRole="switch"
                accessibilityState={{ checked: championAlerts }}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.switchTrack,
                  championAlerts ? styles.switchOn : styles.switchOff,
                  { opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.switchKnob,
                    { left: championAlerts ? 22 : 3 },
                  ]}
                />
              </Pressable>
            </View>
          </View>

          {/* Submit */}
          <View style={styles.submitWrap}>
            <EditorialButton
              variant="primary"
              size="md"
              block
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
            >
              {mode === 'edit' ? 'Save changes' : 'Create my pocket'}
            </EditorialButton>
          </View>

          {/* Delete (edit only) */}
          {mode === 'edit' ? (
            <Pressable
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete this collection"
              hitSlop={10}
              style={({ pressed }) => [
                styles.deleteLink,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.deleteLinkText}>
                DELETE THIS COLLECTION
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateCollectionScreen;

function SectionLabel({ children }) {
  return (
    <MonoMeta size="eyebrow" style={{ marginBottom: 10 }}>
      {children}
    </MonoMeta>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  STYLES                                                             */
/* ─────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  fill: { flex: 1 },
  loadingPad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 80,
  },
  headBlock: {
    marginBottom: 18,
  },
  headTitle: {
    marginTop: 6,
  },
  coverWrap: {
    position: 'relative',
    borderRadius: fieldGuide.radius.lg,
    overflow: 'hidden',
  },
  coverPick: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: 'rgba(20,22,29,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverPickText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.cream,
    textTransform: 'uppercase',
  },
  section: {
    marginTop: 26,
  },
  sectionHint: {
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    color: fieldGuide.creamMute,
    marginTop: -4,
    marginBottom: 12,
  },
  sectionRule: {
    marginBottom: 6,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: '22%',
    alignItems: 'center',
    padding: 4,
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: fieldGuide.ember,
  },
  swatchLabel: {
    marginTop: 8,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.widest(9),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  swatchLabelActive: {
    color: fieldGuide.ember,
  },
  glyphRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  glyph: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphActive: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  glyphLabel: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 18,
    color: fieldGuide.cream,
    includeFontPadding: false,
  },
  glyphLabelActive: {
    color: '#FFF8F1',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.creamMute,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  radioOuterActive: {
    borderColor: fieldGuide.ember,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: fieldGuide.ember,
  },
  radioBody: {
    flex: 1,
    minWidth: 0,
  },
  radioTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 15,
    color: fieldGuide.cream,
    includeFontPadding: false,
    letterSpacing: -0.005 * 15,
  },
  radioHint: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9.5,
    letterSpacing: fieldGuide.tracking.widest(9.5),
    color: fieldGuide.creamMute,
    textTransform: 'uppercase',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  switchBody: {
    flex: 1,
    minWidth: 0,
    marginRight: 14,
  },
  switchTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 15,
    color: fieldGuide.cream,
    includeFontPadding: false,
    letterSpacing: -0.005 * 15,
  },
  switchHint: {
    marginTop: 4,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 12,
    color: fieldGuide.creamMute,
  },
  switchTrack: {
    width: 46,
    height: 26,
    borderRadius: 999,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: fieldGuide.ember,
  },
  switchOff: {
    backgroundColor: fieldGuide.inkLine2,
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: fieldGuide.cream,
    position: 'absolute',
    top: 3,
  },
  submitWrap: {
    marginTop: 30,
  },
  deleteLink: {
    marginTop: 22,
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteLinkText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.widest(10),
    color: fieldGuide.rose,
    textTransform: 'uppercase',
  },
});
