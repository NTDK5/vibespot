/**
 * EditSpotScreen — Phase 5 / design 18.
 *
 * Super-admin spot editor with editor banner, cover/gallery, and
 * sectioned fields. Preserves updateSpot, uploadSpotImages, deleteSpot.
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import FloatingLabelInput from '../components/fieldguide/form/FloatingLabelInput';
import CategoryGrid from '../components/fieldguide/form/CategoryGrid';
import PriceTierRow, { WIZARD_PRICE_TIERS } from '../components/fieldguide/form/PriceTierRow';
import HoursEditor, { normalizeHoursFromSpot } from '../components/fieldguide/form/HoursEditor';
import SpotMediaUploader from '../components/fieldguide/form/SpotMediaUploader';
import { Pill } from '../components/fieldguide';
import MonoMeta from '../components/fieldguide/primitives/MonoMeta';
import EditorialButton from '../components/fieldguide/form/EditorialButton';
import LoadingScreen from '../components/fieldguide/state/LoadingScreen';
import ErrorScreen from '../components/fieldguide/state/ErrorScreen';
import { LeafletMap } from '../components/LeafletMap';
import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import {
  deleteSpot,
  getSpotById,
  updateSpot,
} from '../services/spots.service';
import { uploadSpotImages } from '../services/upload';
import { CATEGORIES } from '../utils/constants';
import { indexNumberFor } from '../utils/spotHelpers';
import { logger } from '../utils/logger';

const VIBE_OPTIONS = [
  'SLOW',
  'GOOD LIGHT',
  'CROWDED',
  'SOLO-FRIENDLY',
  'FOR FRIENDS',
  'CARDAMOM BUN',
  'LATE-NIGHT',
  'WORTH THE WALK',
  'CASH-ONLY',
];

function hoursForApi(hours) {
  const out = {};
  Object.keys(hours || {}).forEach((day) => {
    const range = hours[day];
    if (Array.isArray(range) && range.length >= 2) {
      out[day] = [Math.floor(range[0]), Math.floor(range[1])];
    }
  });
  return Object.keys(out).length ? out : undefined;
}

function matchPriceValue(spot) {
  const pr = spot?.priceRange;
  const tier = WIZARD_PRICE_TIERS.find((t) => t.value === pr);
  if (tier) return tier.value;
  if (pr === 'free') return 'low';
  return 'medium';
}

export const EditSpotScreen = ({ route, navigation }) => {
  const spotId = route?.params?.spotId;
  const { isSuperAdmin } = useAuth();
  const { location } = useLocation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('medium');
  const [vibeTags, setVibeTags] = useState([]);
  const [address, setAddress] = useState('');
  const [bestTime, setBestTime] = useState('');
  const [hours, setHours] = useState(normalizeHoursFromSpot(null));
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState([]);
  const [lat, setLat] = useState(38.7886);
  const [lng, setLng] = useState(-9.008);
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isEditorsPick, setIsEditorsPick] = useState(false);
  const [weeklyRank, setWeeklyRank] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [draftLat, setDraftLat] = useState(lat);
  const [draftLng, setDraftLng] = useState(lng);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigation.replace('Home');
    }
  }, [isSuperAdmin, navigation]);

  const query = useQuery({
    queryKey: ['edit-spot', spotId],
    queryFn: () => getSpotById(spotId),
    enabled: !!spotId && isSuperAdmin,
  });

  const spot = query.data && !query.data.error ? query.data : null;

  useEffect(() => {
    if (!spot) return;
    setTitle(spot.title || '');
    setDescription(spot.description || '');
    setCategory(spot.category || '');
    setPriceRange(matchPriceValue(spot));
    const spotTags = Array.isArray(spot.tags) ? spot.tags : [];
    setVibeTags(
      spotTags.filter((t) =>
        VIBE_OPTIONS.includes(String(t).toUpperCase()),
      ).map((t) => String(t).toUpperCase()),
    );
    setFeatures(spot.features || []);
    setAddress(spot.address || '');
    setBestTime(spot.bestTime || '');
    setHours(normalizeHoursFromSpot(spot.hours));
    setLat(spot.lat ?? spot.latitude ?? 38.7886);
    setLng(spot.lng ?? spot.longitude ?? -9.008);
    setExistingImages(
      Array.isArray(spot.images) ? spot.images.filter(Boolean) : [],
    );
    setWebsite(spot.website || '');
    setInstagram(spot.instagram || '');
    setFacebook(spot.facebook || '');
    setTwitter(spot.twitter || '');
    setPhone(spot.phone || '');
    setEmail(spot.email || '');
    setIsEditorsPick(!!spot.isEditorsPick);
    setWeeklyRank(
      typeof spot.weeklyRank === 'number' && !Number.isNaN(spot.weeklyRank)
        ? String(spot.weeklyRank)
        : '',
    );
  }, [spot]);

  const toggleVibe = (tag) => {
    setVibeTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 5) return prev;
      return [...prev, tag];
    });
  };

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed || features.includes(trimmed)) return;
    setFeatures([...features, trimmed]);
    setFeatureInput('');
  };

  const buildTags = () => {
    const merged = [
      ...vibeTags.map((t) => t.toLowerCase()),
      ...features.map((f) => f.toLowerCase()),
    ];
    return [...new Set(merged)];
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.show('Title is required.', { variant: 'error' });
      return;
    }
    if (!description.trim()) {
      toast.show('Description is required.', { variant: 'error' });
      return;
    }
    if (!category) {
      toast.show('Pick a category.', { variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const spotData = {
        title: title.trim(),
        description: description.trim(),
        category,
        priceRange,
        tags: buildTags(),
        lat,
        lng,
        address: address.trim(),
        bestTime: bestTime.trim() || undefined,
        hours: hoursForApi(hours),
        features,
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined,
        twitter: twitter.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        isEditorsPick,
        weeklyRank:
          weeklyRank.trim() === ''
            ? null
            : Number.parseInt(weeklyRank, 10),
      };

      const result = await updateSpot(spotId, spotData);
      if (result?.error) {
        throw new Error(result.error);
      }

      if (newImages.length > 0) {
        const uploadResult = await uploadSpotImages(spotId, newImages);
        if (uploadResult?.error) {
          toast.show('Saved, but some photos failed to upload.', {
            variant: 'info',
          });
        }
      }

      toast.show('Spot updated.', { variant: 'success' });
      navigation.goBack();
    } catch (err) {
      logger.error('EditSpot.save', err);
      toast.show(err.message || 'Failed to update spot.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove this spot?',
      'It will disappear from the field guide for all readers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteSpot(spotId);
              if (result?.error) throw new Error(result.error);
              toast.show('Spot removed.', { variant: 'success' });
              navigation.navigate('Home');
            } catch (err) {
              logger.error('EditSpot.delete', err);
              toast.show(err.message || 'Could not remove spot.', {
                variant: 'error',
              });
            }
          },
        },
      ],
    );
  };

  const openMap = () => {
    setDraftLat(lat);
    setDraftLng(lng);
    setMapOpen(true);
  };

  if (!isSuperAdmin) {
    return null;
  }

  if (query.isLoading) {
    return <LoadingScreen message="Loading spot…" />;
  }

  if (query.isError || !spot) {
    return (
      <ErrorScreen
        code="ERR · 404"
        title="Could not load this spot."
        italic="spot."
        body="The link might be stale, or you may not have editor access."
        onRetry={() => navigation.goBack()}
      />
    );
  }

  const indexLabel = indexNumberFor(spot);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topbar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={fieldGuide.cream} />
          </Pressable>
          <Text style={styles.topTitle}>{`Edit · No. ${indexLabel}`}</Text>
          <Pressable
            onPress={handleSave}
            disabled={submitting}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={styles.saveLink}>
              {submitting ? '…' : 'SAVE'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.editorBanner}>
            <View style={styles.editorIcon}>
              <Text style={styles.editorIconText}>✦</Text>
            </View>
            <Text style={styles.editorCopy}>
              You are editing as an <Text style={styles.editorBold}>editor</Text>.
              Changes go live after save. Verified spots stay visible to readers.
            </Text>
          </View>

          <View style={styles.section}>
            <MonoMeta size="eyebrow">Cover photo</MonoMeta>
            <SpotMediaUploader
              images={newImages}
              existingUrls={existingImages}
              onChange={setNewImages}
              vibe={category || 'cafe'}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basics</Text>
            <FloatingLabelInput
              label="Title"
              value={title}
              onChangeText={setTitle}
            />
            <FloatingLabelInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <MonoMeta size="eyebrow" style={{ marginTop: 8 }}>
              Category
            </MonoMeta>
            <CategoryGrid
              categories={CATEGORIES}
              value={category}
              onChange={setCategory}
            />
            <PriceTierRow value={priceRange} onChange={setPriceRange} />
          </View>

          {isSuperAdmin ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Editor&apos;s picks</Text>
              <Pressable
                onPress={() => setIsEditorsPick((v) => !v)}
                style={styles.editorsRow}
              >
                <MonoMeta size="spot">Mark as editor&apos;s pick</MonoMeta>
                <View
                  style={[
                    styles.toggle,
                    isEditorsPick && styles.toggleOn,
                  ]}
                >
                  <Text style={styles.toggleText}>
                    {isEditorsPick ? 'ON' : 'OFF'}
                  </Text>
                </View>
              </Pressable>
              {isEditorsPick ? (
                <FloatingLabelInput
                  label="Weekly rank (optional)"
                  value={weeklyRank}
                  onChangeText={setWeeklyRank}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Pressable onPress={openMap} style={styles.mapPreview}>
              <LeafletMap
                latitude={lat}
                longitude={lng}
                interactive={false}
                height={200}
                showUserLocation={!!location}
                userLocation={location}
              />
            </Pressable>
            <Pressable onPress={openMap} style={styles.adjustMap}>
              <MonoMeta size="spot">Adjust on map ↗</MonoMeta>
            </Pressable>
            <FloatingLabelInput
              label="Address"
              value={address}
              onChangeText={setAddress}
            />
            <MonoMeta size="spot">
              {`LAT ${lat.toFixed(5)} · LNG ${lng.toFixed(5)}`}
            </MonoMeta>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hours</Text>
            <FloatingLabelInput
              label="Best time to visit"
              value={bestTime}
              onChangeText={setBestTime}
            />
            <HoursEditor value={hours} onChange={setHours} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <FloatingLabelInput label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" />
            <FloatingLabelInput label="Instagram" value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
            <FloatingLabelInput label="Facebook" value={facebook} onChangeText={setFacebook} autoCapitalize="none" />
            <FloatingLabelInput label="Twitter / X" value={twitter} onChangeText={setTwitter} autoCapitalize="none" />
            <FloatingLabelInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <FloatingLabelInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags & vibes</Text>
            <View style={styles.pillWrap}>
              {VIBE_OPTIONS.map((tag) => (
                <Pill
                  key={tag}
                  variant={vibeTags.includes(tag) ? 'ember' : 'default'}
                  onPress={() => toggleVibe(tag)}
                >
                  {tag}
                </Pill>
              ))}
            </View>
            <View style={styles.featureRow}>
              <TextInput
                value={featureInput}
                onChangeText={setFeatureInput}
                onSubmitEditing={addFeature}
                placeholder="Add a feature…"
                placeholderTextColor={fieldGuide.creamFaint}
                style={styles.featureInput}
              />
              <Pressable onPress={addFeature} style={styles.featureAdd}>
                <Ionicons name="add" size={18} color={fieldGuide.cream} />
              </Pressable>
            </View>
            <View style={styles.pillWrap}>
              {features.map((f) => (
                <Pill
                  key={f}
                  onPress={() =>
                    setFeatures(features.filter((x) => x !== f))
                  }
                >
                  {`${f.toUpperCase()} ×`}
                </Pill>
              ))}
            </View>
          </View>

          <View style={styles.danger}>
            <Pressable onPress={handleDelete} hitSlop={8}>
              <Text style={styles.dangerLink}>
                Remove this spot from the field guide
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <View
          style={[
            styles.stickySave,
            { paddingBottom: insets.bottom + 12 },
          ]}
        >
          <EditorialButton
            variant="primary"
            block
            onPress={handleSave}
            loading={submitting}
          >
            Save changes
          </EditorialButton>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={mapOpen} animationType="slide" onRequestClose={() => setMapOpen(false)}>
        <View style={styles.mapModal}>
          <View style={styles.mapModalHead}>
            <Text style={styles.mapModalTitle}>Adjust pin</Text>
            <Pressable onPress={() => setMapOpen(false)}>
              <Ionicons name="close" size={20} color={fieldGuide.cream} />
            </Pressable>
          </View>
          <View style={styles.mapModalBody}>
            <LeafletMap
              latitude={draftLat}
              longitude={draftLng}
              onLocationChange={(c) => {
                setDraftLat(c.latitude);
                setDraftLng(c.longitude);
              }}
              interactive
              height={Dimensions.get('window').height - 220}
              showUserLocation={!!location}
              userLocation={location}
            />
          </View>
          <Pressable
            onPress={() => {
              setLat(draftLat);
              setLng(draftLng);
              setMapOpen(false);
            }}
            style={styles.mapConfirm}
          >
            <Text style={styles.mapConfirmText}>Confirm location</Text>
          </Pressable>
        </View>
      </Modal>
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  saveLink: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: fieldGuide.ember,
    textTransform: 'uppercase',
  },
  scroll: {
    paddingTop: 0,
  },
  editorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: 'rgba(232,116,58,0.08)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  editorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: fieldGuide.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorIconText: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 14,
    color: '#FFF8F1',
  },
  editorCopy: {
    flex: 1,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 11.5,
    lineHeight: 17,
    color: fieldGuide.creamSoft,
  },
  editorBold: {
    fontFamily: fieldGuide.fonts.sansSemi,
    color: fieldGuide.cream,
  },
  section: {
    paddingHorizontal: 22,
    paddingVertical: 22,
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
  editorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: fieldGuide.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
  },
  toggleOn: {
    backgroundColor: fieldGuide.ember,
    borderColor: fieldGuide.ember,
  },
  toggleText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    color: fieldGuide.creamMute,
    letterSpacing: fieldGuide.tracking.wider(9),
  },
  mapPreview: {
    height: 200,
    borderRadius: fieldGuide.radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  adjustMap: {
    alignSelf: 'flex-start',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine2,
  },
  featureInput: {
    flex: 1,
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 16,
    color: fieldGuide.cream,
    paddingVertical: 12,
  },
  featureAdd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: fieldGuide.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  danger: {
    paddingHorizontal: 22,
    paddingVertical: 24,
    marginTop: 8,
  },
  dangerLink: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: fieldGuide.rose,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  stickySave: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    backgroundColor: fieldGuide.ink,
  },
  mapModal: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  mapModalHead: {
    paddingTop: 54,
    paddingHorizontal: 22,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapModalTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 18,
    color: fieldGuide.cream,
  },
  mapModalBody: {
    flex: 1,
    padding: 16,
  },
  mapConfirm: {
    margin: 16,
    backgroundColor: fieldGuide.ember,
    borderRadius: fieldGuide.radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  mapConfirmText: {
    fontFamily: fieldGuide.fonts.monoMed,
    fontSize: 10,
    letterSpacing: fieldGuide.tracking.wider(10),
    color: '#FFF8F1',
    textTransform: 'uppercase',
  },
});
