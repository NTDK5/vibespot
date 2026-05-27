/**
 * FieldGuidePreviewScreen — hand-rolled storybook gallery.
 *
 * Mounted at a dev-only route (see AppNavigator __DEV__ branch).
 * Sections mirror the 6 chunks of the spec so a designer can scroll
 * top-to-bottom and verify every variant against the reference HTML.
 *
 * Not a screen consumers should ever ship — but it's a single place
 * to debug a token tweak across the entire surface.
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import fieldGuide from '../../../theme/fieldGuide';
import {
  MonoMeta,
  DisplayTitle,
  Dropcap,
  Rule,
  SheetHandle,
  TopBar,
  SectionHead,
  Pill,
  PillRow,
  Segmented,
  EditorialButton,
  FloatingLabelInput,
  SearchBar,
  DuotoneVibe,
  IndexStamp,
  SaveStamp,
  RatingDots,
  SpotPhoto,
  SpotCard,
  ChampionCard,
  PostmarkStamp,
  CompassDial,
  HourBarChart,
  MiniMap,
  EmptyState,
  LoadingScreen,
  OfflineBanner,
  ErrorScreen,
  SuccessSheet,
} from '../index';

function Group({ title, children, style }) {
  return (
    <View style={[styles.group, style]}>
      <MonoMeta size="kicker" style={styles.groupKicker}>{title}</MonoMeta>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <SectionHead title={title} />
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const VIBES = [
  'cafe', 'roof', 'gallery', 'park', 'night', 'alley',
  'water', 'desert', 'studio', 'court', 'paper', 'cream',
];

const MOCK_PICK = {
  id: 'p1',
  title: 'Carmine Café',
  vibe: 'cafe',
  indexNumber: 'NO. 042',
  district: 'Príncipe Real',
  category: 'Café',
  distance: '0.4 mi',
  rating: 4.6,
  savedByMe: false,
  blurb: 'A quiet stretch of marble where the espresso lands hot and the dropcap glows ember.',
};

const MOCK_NEAR = {
  id: 'n1',
  title: 'Rosa Verde',
  vibe: 'roof',
  indexNumber: 'NO. 011',
  category: 'Rooftop',
  distance: '0.2 mi',
  savedByMe: true,
};

const MOCK_FEATURE = {
  id: 'f1',
  title: 'Atelier Tinta',
  vibe: 'gallery',
  indexNumber: 'NO. 028',
  category: 'Gallery',
  district: 'Bairro Alto',
  distance: '0.8 mi',
  savedByMe: false,
  blurb: 'Wide-format prints on cream stock and a turntable that drifts between Sade and field recordings.',
};

const MOCK_CHAMPION = {
  title: 'The Quiet Apothecary',
  blurb: 'A late-evening cellar where the bar is cream marble and every drink lists three botanicals — five if you ask.',
  vibe: 'night',
  rank: '01',
  weekNumber: 28,
  category: 'Bar',
  district: 'Alfama',
  distance: '0.6 mi',
};

const HOURS = {
  mon: [8, 17],
  tue: [8, 17],
  wed: [8, 17],
  thu: [8, 17],
  fri: [8, 17],
  sat: [9, 18],
  sun: null,
};

export default function FieldGuidePreviewScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [seg2, setSeg2] = useState(0);
  const [seg3, setSeg3] = useState(1);
  const [seg4, setSeg4] = useState(0);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('Bairro Alto');
  const [text3, setText3] = useState('');
  const [text4, setText4] = useState('');
  const [search, setSearch] = useState('');
  const [saveDemoSaved, setSaveDemoSaved] = useState(false);
  const [pickSaved, setPickSaved] = useState(MOCK_PICK.savedByMe);
  const [nearSaved, setNearSaved] = useState(MOCK_NEAR.savedByMe);
  const [featureSaved, setFeatureSaved] = useState(MOCK_FEATURE.savedByMe);
  const [successOpen, setSuccessOpen] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: 0 }]}>
      <TopBar
        title="Field Guide"
        left="back"
        onLeftPress={() => navigation && navigation.goBack()}
      />
      <Rule />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Typography & primitives */}
        <Section title="1 · Typography & primitives">
          <Group title="MONOMETA · 4 sizes">
            <View style={styles.colGap}>
              <MonoMeta size="eyebrow">EYEBROW · NO. 042 · LISBON</MonoMeta>
              <MonoMeta size="kicker">KICKER · CHAMPION WEEK 28</MonoMeta>
              <MonoMeta size="spot">CAFÉ · PRÍNCIPE REAL · 0.4 MI</MonoMeta>
              <MonoMeta size="tab">HOME</MonoMeta>
            </View>
          </Group>

          <Group title="DISPLAYTITLE · 5 sizes">
            <View style={styles.colGap}>
              <DisplayTitle size="sm">Small serif headline.</DisplayTitle>
              <DisplayTitle size="md" italic="Oliver.">Evening, Oliver. The light's good.</DisplayTitle>
              <DisplayTitle size="lg" italic="quietly">A city, quietly catalogued.</DisplayTitle>
              <DisplayTitle size="xl" italic="grid.">Off the grid.</DisplayTitle>
              <DisplayTitle size="hero" italic="issue 28">Vol. 04 · issue 28</DisplayTitle>
            </View>
          </Group>

          <Group title="DROPCAP">
            <Dropcap letter="V">
              VibeSpot reads the city the way an editor reads a magazine — every spot
              numbered, every save tucked into a pocket of paper. Tap, stamp, return later.
            </Dropcap>
          </Group>

          <Group title="RULE">
            <View style={styles.colGap}>
              <Rule />
              <Rule variant="strong" />
            </View>
          </Group>

          <Group title="SHEET HANDLE">
            <View style={styles.sheetMockup}>
              <SheetHandle />
              <Text style={styles.dim}>Bottom sheet would start here.</Text>
            </View>
          </Group>
        </Section>

        {/* 2. Chrome */}
        <Section title="2 · Chrome">
          <Group title="TOPBAR · variants">
            <View style={styles.mockTopBar}>
              <TopBar title="Reading" />
            </View>
            <View style={styles.mockTopBar}>
              <TopBar title="Spot" left="back" />
            </View>
            <View style={styles.mockTopBar}>
              <TopBar
                title="Pocket"
                left="back"
                right={
                  <TopBar.IconButton name="share-outline" onPress={() => {}} />
                }
              />
            </View>
            <View style={[styles.mockTopBar, styles.heroBg]}>
              <TopBar
                left="close"
                transparent
                right={[
                  <TopBar.IconButton key="map" name="map-outline" transparent />,
                  <TopBar.IconButton key="more" name="ellipsis-horizontal" transparent />,
                ]}
              />
            </View>
          </Group>

          <Group title="SECTIONHEAD">
            <SectionHead title="Editor's picks" />
            <SectionHead title="Trending this week" cta={{ label: 'See all', onPress: () => {} }} />
          </Group>

          <Group title="PILL · variants">
            <View style={styles.rowWrap}>
              <Pill>Open now</Pill>
              <Pill variant="solid">Saved</Pill>
              <Pill variant="ember">Champion</Pill>
              <Pill variant="moss" dot>Open</Pill>
              <Pill dot>Featured</Pill>
            </View>
            <View style={{ marginTop: 14 }}>
              <PillRow paddingHorizontal={0}>
                <Pill>Café</Pill>
                <Pill>Bar</Pill>
                <Pill>Gallery</Pill>
                <Pill>Bookshop</Pill>
                <Pill>Park</Pill>
                <Pill>Roof</Pill>
                <Pill>Court</Pill>
              </PillRow>
            </View>
          </Group>

          <Group title="SEGMENTED · 2 / 3 / 4 items">
            <View style={styles.colGap}>
              <Segmented items={['List', 'Map']} value={seg2} onChange={setSeg2} />
              <Segmented items={['Picks', 'Near', 'New']} value={seg3} onChange={setSeg3} />
              <Segmented items={['All', 'Cafés', 'Bars', 'Parks']} value={seg4} onChange={setSeg4} />
            </View>
          </Group>
        </Section>

        {/* 3. Form */}
        <Section title="3 · Form">
          <Group title="EDITORIAL BUTTON · 4 variants × 2 sizes">
            <View style={styles.rowWrap}>
              <EditorialButton onPress={() => {}}>Stamp it</EditorialButton>
              <EditorialButton variant="cream" onPress={() => {}}>Browse</EditorialButton>
              <EditorialButton variant="ghost" onPress={() => {}}>Cancel</EditorialButton>
              <EditorialButton variant="danger" onPress={() => {}}>Remove</EditorialButton>
            </View>
            <View style={[styles.rowWrap, { marginTop: 12 }]}>
              <EditorialButton size="sm" onPress={() => {}}>Stamp</EditorialButton>
              <EditorialButton size="sm" variant="cream" onPress={() => {}}>Browse</EditorialButton>
              <EditorialButton size="sm" variant="ghost" onPress={() => {}}>Skip</EditorialButton>
              <EditorialButton size="sm" variant="danger" onPress={() => {}}>Delete</EditorialButton>
            </View>
            <View style={{ marginTop: 14 }}>
              <EditorialButton
                block
                leading={<Ionicons name="refresh" size={14} color="#FFF8F1" />}
                onPress={() => {}}
              >
                Show me spots near me
              </EditorialButton>
            </View>
            <View style={{ marginTop: 12 }}>
              <EditorialButton variant="ghost" block loading onPress={() => {}}>
                Loading…
              </EditorialButton>
            </View>
          </Group>

          <Group title="FLOATING LABEL INPUT">
            <View style={styles.colGap}>
              <FloatingLabelInput
                label="Title"
                value={text1}
                onChangeText={setText1}
                placeholder="What did you find?"
              />
              <FloatingLabelInput
                label="District"
                value={text2}
                onChangeText={setText2}
              />
              <FloatingLabelInput
                label="Email"
                value={text3}
                onChangeText={setText3}
                placeholder="editor@vibespot.app"
                error="Doesn't look like an email"
              />
              <FloatingLabelInput
                label="Notes"
                value={text4}
                onChangeText={setText4}
                placeholder="Why is this place worth a stamp?"
                multiline
              />
            </View>
          </Group>

          <Group title="SEARCH BAR">
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search cafés, galleries, alleys…"
              trailing={
                <Ionicons name="options-outline" size={16} color={fieldGuide.creamMute} />
              }
            />
          </Group>
        </Section>

        {/* 4. Spot system */}
        <Section title="4 · Spot system">
          <Group title="DUOTONE VIBES · all 12">
            <View style={styles.swatchGrid}>
              {VIBES.map((v) => (
                <View key={v} style={styles.swatch}>
                  <View style={styles.swatchInner}>
                    <DuotoneVibe vibe={v} />
                  </View>
                  <MonoMeta size="tab" style={{ marginTop: 6 }}>{v}</MonoMeta>
                </View>
              ))}
            </View>
          </Group>

          <Group title="INDEX STAMP · 4 positions">
            <View style={styles.stampRow}>
              {['tl', 'tr', 'bl', 'br'].map((p) => (
                <View key={p} style={styles.stampCell}>
                  <SpotPhoto vibe="alley" index={`NO. ${p.toUpperCase()}`} indexPosition={p} aspect="1/1" />
                </View>
              ))}
            </View>
          </Group>

          <Group title="SAVE STAMP · tap demo">
            <View style={[styles.saveDemo, { backgroundColor: fieldGuide.inkElev }]}>
              <SaveStamp
                saved={saveDemoSaved}
                onToggle={() => setSaveDemoSaved((s) => !s)}
                style={{ position: 'relative', top: 0, right: 0 }}
              />
              <MonoMeta size="eyebrow" style={{ marginLeft: 16 }}>
                {saveDemoSaved ? 'STAMPED' : 'TAP TO STAMP'}
              </MonoMeta>
            </View>
          </Group>

          <Group title="RATING DOTS">
            <View style={styles.colGap}>
              <RatingDots value={0.0} />
              <RatingDots value={2.5} />
              <RatingDots value={4.2} />
              <RatingDots value={5.0} size="md" />
            </View>
          </Group>

          <Group title="SPOTCARD · pick + near side-by-side">
            <View style={styles.rowGapWrap}>
              <SpotCard
                spot={{ ...MOCK_PICK, savedByMe: pickSaved }}
                variant="pick"
                onPress={() => {}}
                onToggleSave={() => setPickSaved((s) => !s)}
              />
              <SpotCard
                spot={{ ...MOCK_NEAR, savedByMe: nearSaved }}
                variant="near"
                onPress={() => {}}
                onToggleSave={() => setNearSaved((s) => !s)}
              />
            </View>
          </Group>

          <Group title="SPOTCARD · feature">
            <SpotCard
              spot={{ ...MOCK_FEATURE, savedByMe: featureSaved }}
              variant="feature"
              onPress={() => {}}
              onToggleSave={() => setFeatureSaved((s) => !s)}
            />
          </Group>

          <Group title="CHAMPION CARD">
            <ChampionCard spot={MOCK_CHAMPION} onPress={() => {}} />
          </Group>
        </Section>

        {/* 5. Signature */}
        <Section title="5 · Signature">
          <Group title="POSTMARK STAMP · 64 / 96 / 128">
            <View style={styles.rowGapWrap}>
              <PostmarkStamp
                perimeterText="VOL. 04 · ISSUE 28 · "
                size={64}
                center={<Text style={styles.stampCenter}>04</Text>}
              />
              <PostmarkStamp
                perimeterText="LISBON · FIELD GUIDE · "
                size={96}
                ringStyle="double"
                center={<Text style={styles.stampCenter}>28</Text>}
              />
              <PostmarkStamp
                perimeterText="VIBESPOT · NO. 042 · MAY 2026 · "
                size={128}
                ringStyle="double"
                center={<Ionicons name="compass-outline" size={36} color={fieldGuide.ember} />}
              />
            </View>
          </Group>

          <Group title="COMPASS DIAL · static / spinning / breathing">
            <View style={styles.rowGapWrap}>
              <View style={styles.compassCell}>
                <CompassDial size={96} />
                <MonoMeta size="tab" style={styles.compassLabel}>STATIC</MonoMeta>
              </View>
              <View style={styles.compassCell}>
                <CompassDial size={96} spinning />
                <MonoMeta size="tab" style={styles.compassLabel}>SPINNING</MonoMeta>
              </View>
              <View style={styles.compassCell}>
                <CompassDial size={96} breathing />
                <MonoMeta size="tab" style={styles.compassLabel}>BREATHING</MonoMeta>
              </View>
            </View>
          </Group>

          <Group title="HOUR BAR CHART · today=FRI">
            <View style={styles.hoursWrap}>
              <HourBarChart hours={HOURS} today="fri" />
            </View>
          </Group>

          <Group title="MINI MAP · drawn stub">
            <MiniMap />
          </Group>
        </Section>

        {/* 6. State */}
        <Section title="6 · State">
          <Group title="EMPTY STATE">
            <View style={styles.stateFrame}>
              <EmptyState
                eyebrow="NO. 000"
                title="Nothing tucked away yet."
                italic="yet."
                body="Tap the stamp on any spot to save it. The first one is always the best — you'll remember it."
                cta={{ label: 'Show me spots near me', onPress: () => {} }}
                secondaryCta={{ label: "Browse editor's picks", onPress: () => {} }}
              />
            </View>
          </Group>

          <Group title="LOADING SCREEN · inline">
            <View style={[styles.stateFrame, { height: 320 }]}>
              <LoadingScreen />
            </View>
          </Group>

          <Group title="OFFLINE · banner mode">
            <OfflineBanner mode="banner" lastSyncAt="2 H AGO" />
          </Group>

          <Group title="OFFLINE · screen mode">
            <View style={[styles.stateFrame, { height: 520 }]}>
              <OfflineBanner mode="screen" lastSyncAt="14:32 · FRI 9 MAY" onRetry={() => {}} />
            </View>
          </Group>

          <Group title="ERROR SCREEN">
            <View style={[styles.stateFrame, { height: 520 }]}>
              <ErrorScreen
                code="ERR · 500"
                title="Return to sender."
                italic="sender."
                onRetry={() => {}}
                onContact={() => {}}
              />
            </View>
          </Group>

          <Group title="SUCCESS SHEET · trigger">
            <EditorialButton onPress={() => setSuccessOpen(true)}>
              Show success sheet
            </EditorialButton>
          </Group>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      <SuccessSheet
        visible={successOpen}
        onDismiss={() => setSuccessOpen(false)}
        title="In your pocket."
        italic="pocket."
        body="Stamped to the field guide. Find it later under your saved spots."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: fieldGuide.ink,
  },
  section: {
    paddingBottom: 12,
  },
  sectionBody: {
    paddingHorizontal: 22,
  },
  group: {
    marginBottom: 18,
    paddingTop: 12,
  },
  groupKicker: {
    marginBottom: 12,
  },
  groupBody: {
    // groups stack their own children
  },
  colGap: {
    flexDirection: 'column',
    rowGap: 10,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
    alignItems: 'center',
  },
  rowGapWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 14,
    alignItems: 'flex-end',
  },
  sheetMockup: {
    backgroundColor: fieldGuide.inkElev,
    borderRadius: fieldGuide.radius.xl,
    paddingBottom: 18,
  },
  dim: {
    paddingHorizontal: 22,
    paddingBottom: 6,
    fontFamily: fieldGuide.fonts.sans,
    fontSize: 13,
    color: fieldGuide.creamMute,
  },
  mockTopBar: {
    marginTop: 8,
    backgroundColor: fieldGuide.ink,
    borderRadius: fieldGuide.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
    overflow: 'hidden',
  },
  heroBg: {
    backgroundColor: fieldGuide.inkElev,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 14,
  },
  swatch: {
    width: '30%',
    alignItems: 'center',
  },
  swatchInner: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: fieldGuide.radius.md,
    overflow: 'hidden',
    backgroundColor: fieldGuide.inkElev,
  },
  stampRow: {
    flexDirection: 'row',
    columnGap: 10,
    rowGap: 10,
    flexWrap: 'wrap',
  },
  stampCell: {
    width: '47%',
  },
  saveDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: fieldGuide.radius.md,
  },
  stampCenter: {
    fontFamily: fieldGuide.fonts.serif,
    fontSize: 20,
    color: fieldGuide.cream,
  },
  compassCell: {
    alignItems: 'center',
    width: 110,
  },
  compassLabel: {
    marginTop: 8,
  },
  hoursWrap: {
    backgroundColor: fieldGuide.inkElev,
    borderRadius: fieldGuide.radius.md,
    padding: 16,
  },
  stateFrame: {
    borderRadius: fieldGuide.radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: fieldGuide.inkLine,
  },
});
