/**
 * AddSpotScreen — Phase 5 / design 17.
 *
 * Six-step Field Guide wizard for super-admins to submit a new spot.
 * Preserves addSpot + uploadSpotImages submit pipeline.
 */

import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import SpotWizardShell from '../components/fieldguide/form/SpotWizardShell';
import FloatingLabelInput from '../components/fieldguide/form/FloatingLabelInput';
import CategoryGrid from '../components/fieldguide/form/CategoryGrid';
import PriceTierRow from '../components/fieldguide/form/PriceTierRow';
import HoursEditor, { createEmptyHours } from '../components/fieldguide/form/HoursEditor';
import SpotMediaUploader from '../components/fieldguide/form/SpotMediaUploader';
import { Pill } from '../components/fieldguide';
import MonoMeta from '../components/fieldguide/primitives/MonoMeta';
import SuccessSheet from '../components/fieldguide/state/SuccessSheet';
import { LeafletMap } from '../components/LeafletMap';
import fieldGuide from '../theme/fieldGuide';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { addSpot } from '../services/spots.service';
import { uploadSpotImages } from '../services/upload';
import { CATEGORIES } from '../utils/constants';
import { prettyCategory } from '../utils/spotHelpers';
import { logger } from '../utils/logger';

const TOTAL_STEPS = 6;
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

const STEPS = [
  {
    kicker: 'Step 01 · Basics',
    title: 'Start with the story',
    subtitle: 'Give explorers a name and enough detail to know why they should go.',
  },
  {
    kicker: 'Step 02 · Category & price',
    title: 'What kind of spot is this?',
    subtitle:
      'Pick the one that fits best. Editors might re-categorize if it lands somewhere unexpected.',
  },
  {
    kicker: 'Step 03 · Location',
    title: 'Where is it?',
    subtitle: 'Drop a pin on the map — we use it for walking directions and the field guide index.',
  },
  {
    kicker: 'Step 04 · Details',
    title: 'When to come',
    subtitle: 'Hours, features, and the small things regulars notice.',
  },
  {
    kicker: 'Step 05 · Contact & social',
    title: 'How do explorers reach them?',
    subtitle: 'All optional. Only add what you would trust on a printed map.',
  },
  {
    kicker: 'Step 06 · Media & publish',
    title: 'Show us the room',
    subtitle: 'A cover photo and a few angles help editors verify faster.',
  },
];

const initialState = (lat, lng) => ({
  title: '',
  description: '',
  category: '',
  priceRange: 'medium',
  vibeTags: [],
  lat,
  lng,
  address: '',
  bestTime: '',
  hours: createEmptyHours(),
  featureInput: '',
  features: [],
  website: '',
  instagram: '',
  facebook: '',
  twitter: '',
  phone: '',
  email: '',
  images: [],
});

function reducer(state, action) {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.payload };
    case 'toggleVibe': {
      const tag = action.tag;
      const has = state.vibeTags.includes(tag);
      if (has) {
        return {
          ...state,
          vibeTags: state.vibeTags.filter((t) => t !== tag),
        };
      }
      if (state.vibeTags.length >= 5) return state;
      return { ...state, vibeTags: [...state.vibeTags, tag] };
    }
    case 'addFeature': {
      const trimmed = state.featureInput.trim();
      if (!trimmed || state.features.includes(trimmed)) return state;
      return {
        ...state,
        features: [...state.features, trimmed],
        featureInput: '',
      };
    }
    case 'removeFeature':
      return {
        ...state,
        features: state.features.filter((f) => f !== action.feature),
      };
    default:
      return state;
  }
}

function buildTags(state) {
  const merged = [
    ...state.vibeTags.map((t) => t.toLowerCase()),
    ...state.features.map((f) => f.toLowerCase()),
  ];
  return [...new Set(merged)];
}

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

export const AddSpotScreen = ({ navigation }) => {
  const { isSuperAdmin } = useAuth();
  const { location } = useLocation();
  const toast = useToast();

  const defaultLat = location?.latitude ?? 38.7886;
  const defaultLng = location?.longitude ?? -9.008;

  const [step, setStep] = useState(0);
  const [state, dispatch] = useReducer(
    reducer,
    { lat: defaultLat, lng: defaultLng },
    ({ lat, lng }) => initialState(lat, lng),
  );
  const [submitting, setSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [draftLat, setDraftLat] = useState(defaultLat);
  const [draftLng, setDraftLng] = useState(defaultLng);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigation.replace('Home');
    }
  }, [isSuperAdmin, navigation]);

  useEffect(() => {
    if (
      location &&
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number'
    ) {
      dispatch({
        type: 'patch',
        payload: { lat: location.latitude, lng: location.longitude },
      });
      setDraftLat(location.latitude);
      setDraftLng(location.longitude);
    }
  }, [location]);

  const dirty = useMemo(() => {
    return (
      !!state.title.trim() ||
      !!state.description.trim() ||
      !!state.category ||
      state.images.length > 0 ||
      !!state.address.trim()
    );
  }, [state]);

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return (
          state.title.trim().length > 0 &&
          state.description.trim().length >= 40
        );
      case 1:
        return !!state.category;
      case 2:
        return state.address.trim().length > 0;
      case 3:
      case 4:
        return true;
      case 5:
        return state.images.length > 0;
      default:
        return false;
    }
  }, [step, state]);

  const handleClose = () => {
    if (!dirty) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Discard this draft?',
      'Your spot submission will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.navigate('Home'),
        },
      ],
    );
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    handlePublish();
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const spotData = {
        title: state.title.trim(),
        description: state.description.trim(),
        category: state.category,
        priceRange: state.priceRange,
        tags: buildTags(state),
        lat: state.lat,
        lng: state.lng,
        address: state.address.trim(),
        bestTime: state.bestTime.trim() || undefined,
        hours: hoursForApi(state.hours),
        features: state.features,
        website: state.website.trim() || undefined,
        instagram: state.instagram.trim() || undefined,
        facebook: state.facebook.trim() || undefined,
        twitter: state.twitter.trim() || undefined,
        phone: state.phone.trim() || undefined,
        email: state.email.trim() || undefined,
      };

      const { id: spotId, error: spotError } = await addSpot(spotData);
      if (spotError || !spotId) {
        throw new Error(spotError || 'Spot ID missing');
      }

      if (state.images.length > 0) {
        const uploadResult = await uploadSpotImages(spotId, state.images);
        if (uploadResult?.error) {
          throw new Error(uploadResult.error);
        }
      }

      setSuccessVisible(true);
    } catch (err) {
      logger.error('AddSpot.publish', err);
      toast.show(err.message || 'Failed to submit spot.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openMap = () => {
    setDraftLat(state.lat);
    setDraftLng(state.lng);
    setMapOpen(true);
  };

  const confirmMap = () => {
    dispatch({ type: 'patch', payload: { lat: draftLat, lng: draftLng } });
    setMapOpen(false);
  };

  const stepMeta = STEPS[step];
  const continueLabel =
    step === TOTAL_STEPS - 1 ? 'Submit to editors' : 'Continue';

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <FloatingLabelInput
              label="Title"
              value={state.title}
              onChangeText={(title) => dispatch({ type: 'patch', payload: { title } })}
              placeholder="Rainy day café on Rua da Rosa"
            />
            <FloatingLabelInput
              label="Description"
              value={state.description}
              onChangeText={(description) =>
                dispatch({ type: 'patch', payload: { description } })
              }
              placeholder="Why would someone cross town for this?"
              multiline
              error={
                state.description.length > 0 &&
                state.description.length < 40
                  ? 'At least 40 characters'
                  : undefined
              }
            />
            <MonoMeta size="spot" style={styles.hint}>
              Write like you are telling a friend why they would go.
            </MonoMeta>
          </>
        );
      case 1:
        return (
          <>
            <MonoMeta size="eyebrow">Category</MonoMeta>
            <CategoryGrid
              categories={CATEGORIES}
              value={state.category}
              onChange={(category) =>
                dispatch({ type: 'patch', payload: { category } })
              }
              style={{ marginTop: 8 }}
            />
            <PriceTierRow
              value={state.priceRange}
              onChange={(priceRange) =>
                dispatch({ type: 'patch', payload: { priceRange } })
              }
            />
            <MonoMeta size="eyebrow" style={{ marginTop: 8 }}>
              Vibe tags · max 5
            </MonoMeta>
            <View style={styles.pillWrap}>
              {VIBE_OPTIONS.map((tag) => (
                <Pill
                  key={tag}
                  variant={
                    state.vibeTags.includes(tag) ? 'ember' : 'default'
                  }
                  onPress={() => dispatch({ type: 'toggleVibe', tag })}
                >
                  {tag}
                </Pill>
              ))}
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Pressable
              onPress={openMap}
              style={({ pressed }) => [
                styles.mapPreview,
                { opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <LeafletMap
                latitude={state.lat}
                longitude={state.lng}
                interactive={false}
                height={280}
                showUserLocation={!!location}
                userLocation={location}
              />
              <View style={styles.mapOverlay}>
                <Ionicons name="pin" size={14} color={fieldGuide.cream} />
                <Text style={styles.mapOverlayText}>Tap to adjust pin</Text>
              </View>
            </Pressable>
            <FloatingLabelInput
              label="Address"
              value={state.address}
              onChangeText={(address) =>
                dispatch({ type: 'patch', payload: { address } })
              }
              placeholder="Rua da Rosa 184, Lisboa"
            />
            <MonoMeta size="spot">
              {`LAT ${state.lat.toFixed(5)} · LNG ${state.lng.toFixed(5)}`}
            </MonoMeta>
          </>
        );
      case 3:
        return (
          <>
            <FloatingLabelInput
              label="Best time to visit"
              value={state.bestTime}
              onChangeText={(bestTime) =>
                dispatch({ type: 'patch', payload: { bestTime } })
              }
              placeholder="Late afternoon, weekday"
            />
            <MonoMeta size="eyebrow">Hours · This week</MonoMeta>
            <HoursEditor
              value={state.hours}
              onChange={(hours) => dispatch({ type: 'patch', payload: { hours } })}
            />
            <MonoMeta size="eyebrow">Features</MonoMeta>
            <View style={styles.featureRow}>
              <TextInput
                value={state.featureInput}
                onChangeText={(featureInput) =>
                  dispatch({ type: 'patch', payload: { featureInput } })
                }
                onSubmitEditing={() => dispatch({ type: 'addFeature' })}
                placeholder="Wi-Fi, courtyard, cardamom bun…"
                placeholderTextColor={fieldGuide.creamFaint}
                style={styles.featureInput}
              />
              <Pressable
                onPress={() => dispatch({ type: 'addFeature' })}
                style={styles.featureAdd}
              >
                <Ionicons name="add" size={18} color={fieldGuide.cream} />
              </Pressable>
            </View>
            <View style={styles.pillWrap}>
              {state.features.map((f) => (
                <Pill
                  key={f}
                  variant="default"
                  onPress={() => dispatch({ type: 'removeFeature', feature: f })}
                >
                  {`${f.toUpperCase()} ×`}
                </Pill>
              ))}
            </View>
          </>
        );
      case 4:
        return (
          <>
            <FloatingLabelInput
              label="Website"
              value={state.website}
              onChangeText={(website) =>
                dispatch({ type: 'patch', payload: { website } })
              }
              placeholder="carmine.coffee"
              autoCapitalize="none"
            />
            <FloatingLabelInput
              label="Instagram"
              value={state.instagram}
              onChangeText={(instagram) =>
                dispatch({ type: 'patch', payload: { instagram } })
              }
              placeholder="@carmine.cafe"
              autoCapitalize="none"
            />
            <FloatingLabelInput
              label="Facebook"
              value={state.facebook}
              onChangeText={(facebook) =>
                dispatch({ type: 'patch', payload: { facebook } })
              }
              placeholder="carminecafe"
              autoCapitalize="none"
            />
            <FloatingLabelInput
              label="Twitter / X"
              value={state.twitter}
              onChangeText={(twitter) =>
                dispatch({ type: 'patch', payload: { twitter } })
              }
              placeholder="@carminecafe"
              autoCapitalize="none"
            />
            <FloatingLabelInput
              label="Phone"
              value={state.phone}
              onChangeText={(phone) =>
                dispatch({ type: 'patch', payload: { phone } })
              }
              placeholder="+351 213 47 28 19"
              keyboardType="phone-pad"
            />
            <FloatingLabelInput
              label="Email"
              value={state.email}
              onChangeText={(email) =>
                dispatch({ type: 'patch', payload: { email } })
              }
              placeholder="hello@carmine.coffee"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </>
        );
      case 5:
      default:
        return (
          <>
            <SpotMediaUploader
              images={state.images}
              onChange={(images) =>
                dispatch({ type: 'patch', payload: { images } })
              }
              vibe={state.category || 'cafe'}
            />
            <View style={styles.summary}>
              <Text style={styles.summaryTitle} numberOfLines={1}>
                {state.title || 'Untitled spot'}
              </Text>
              <MonoMeta size="spot" style={{ marginTop: 6 }}>
                {[
                  prettyCategory(state.category).toUpperCase() || '—',
                  state.address.split(',')[0]?.toUpperCase() || '—',
                  `${state.images.length} PHOTO${state.images.length === 1 ? '' : 'S'}`,
                  `${state.vibeTags.length + state.features.length} TAGS`,
                ].join('  ·  ')}
              </MonoMeta>
            </View>
            <MonoMeta size="spot" style={styles.legal}>
              By submitting you agree spots are verified by editors before
              appearing in the field guide.
            </MonoMeta>
          </>
        );
    }
  };

  return (
    <>
      <SpotWizardShell
        stepIndex={step}
        totalSteps={TOTAL_STEPS}
        onClose={handleClose}
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel={continueLabel}
        backHidden={step === 0}
        continueDisabled={!canContinue}
        submitting={submitting}
        stepKicker={stepMeta.kicker}
        stepTitle={stepMeta.title}
        stepSubtitle={stepMeta.subtitle}
      >
        {renderStep()}
      </SpotWizardShell>

      <Modal visible={mapOpen} animationType="slide" onRequestClose={() => setMapOpen(false)}>
        <View style={styles.mapModal}>
          <View style={styles.mapModalHead}>
            <Text style={styles.mapModalTitle}>Drop the pin</Text>
            <Pressable onPress={() => setMapOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={20} color={fieldGuide.cream} />
            </Pressable>
          </View>
          <View style={styles.mapModalBody}>
            <LeafletMap
              latitude={draftLat}
              longitude={draftLng}
              onLocationChange={(coords) => {
                setDraftLat(coords.latitude);
                setDraftLng(coords.longitude);
              }}
              interactive
              height={Dimensions.get('window').height - 220}
              showUserLocation={!!location}
              userLocation={location}
            />
          </View>
          <View style={styles.mapModalFoot}>
            <MonoMeta size="spot">
              {`${draftLat.toFixed(6)}, ${draftLng.toFixed(6)}`}
            </MonoMeta>
            <Pressable
              onPress={confirmMap}
              style={({ pressed }) => [
                styles.mapConfirm,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.mapConfirmText}>Confirm location</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <SuccessSheet
        visible={successVisible}
        title="In your pocket"
        body="Your spot is with the editors for review."
        ctaLabel="Back to Home"
        onDismiss={() => {
          setSuccessVisible(false);
          navigation.navigate('Home');
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  hint: {
    marginTop: -8,
    color: fieldGuide.creamMute,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mapPreview: {
    height: 280,
    borderRadius: fieldGuide.radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: fieldGuide.radius.full,
    backgroundColor: 'rgba(20,22,29,0.78)',
  },
  mapOverlayText: {
    fontFamily: fieldGuide.fonts.mono,
    fontSize: 9,
    letterSpacing: fieldGuide.tracking.wider(9),
    color: fieldGuide.cream,
    textTransform: 'uppercase',
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
  summary: {
    padding: 14,
    borderRadius: fieldGuide.radius.md,
    backgroundColor: fieldGuide.inkElev,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  summaryTitle: {
    fontFamily: fieldGuide.fonts.serifMedium,
    fontSize: 17,
    color: fieldGuide.cream,
  },
  legal: {
    color: fieldGuide.creamMute,
    lineHeight: 18,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
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
  mapModalFoot: {
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
  mapConfirm: {
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
