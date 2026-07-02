/**
 * Raw Field Guide tokens (design reference — dark ink palette literals).
 */

export const fieldGuideBase = Object.freeze({
  ink: '#14161D',
  inkDeep: '#0B0C11',
  inkElev: '#1B1E27',
  inkLine: 'rgba(244,239,230,0.08)',
  inkLine2: 'rgba(244,239,230,0.14)',

  paper: '#F4EFE6',
  paperSoft: '#E8DFD0',
  paperDeep: '#D6CCB8',

  cream: '#F4EFE6',
  creamSoft: 'rgba(244,239,230,0.72)',
  creamMute: 'rgba(244,239,230,0.52)',
  creamFaint: 'rgba(244,239,230,0.34)',
  inkText: '#14161D',
  inkMute: 'rgba(20,22,29,0.62)',
  inkFaint: 'rgba(20,22,29,0.38)',

  ember: '#E8743A',
  emberSoft: '#F4B68E',
  emberDeep: '#B45427',
  moss: '#7A9B6A',
  rose: '#C95F6E',
  gold: '#C9A24B',

  vibes: Object.freeze({
    cafe: Object.freeze(['#3D2817', '#8B4423', '#D67843']),
    roof: Object.freeze(['#1B1F3A', '#4F3970', '#C95F6E']),
    gallery: Object.freeze(['#1F1A14', '#4A3A28', '#B89968']),
    park: Object.freeze(['#1F2A1A', '#3D5A38', '#8FB07A']),
    night: Object.freeze(['#0B0C11', '#1F1B3A', '#6B4E8C']),
    alley: Object.freeze(['#14161D', '#2C2935', '#6B5A4A']),
    water: Object.freeze(['#0F2230', '#1F4A66', '#88BBC7']),
    desert: Object.freeze(['#3A2A1F', '#7A5538', '#D9A777']),
    studio: Object.freeze(['#2A1F1A', '#6B4A38', '#E8AA82']),
    court: Object.freeze(['#1A2A2F', '#2E5D5A', '#88B8A3']),
    paper: Object.freeze(['#E8DFD0', '#D6CCB8', '#C9A24B']),
    cream: Object.freeze(['#F4EFE6', '#E8DFD0']),
  }),

  radius: Object.freeze({ sm: 6, md: 10, lg: 16, xl: 22, full: 999 }),
  safe: Object.freeze({ top: 54, bottom: 34 }),

  tracking: Object.freeze({
    tight: (fs) => -0.02 * fs,
    normal: 0,
    wide: (fs) => 0.18 * fs,
    wider: (fs) => 0.2 * fs,
    widest: (fs) => 0.22 * fs,
    mono28: (fs) => 0.28 * fs,
    mono30: (fs) => 0.3 * fs,
  }),

  fonts: Object.freeze({
    display: 'Geist_700Bold',
    displayHeavy: 'Geist_800ExtraBold',
    serif: 'Geist_700Bold',
    serifItalic: 'Geist_700Bold',
    serifMedium: 'Geist_700Bold',
    serifLight: 'Geist_700Bold',
    serifBold: 'Geist_800ExtraBold',
    sans: 'Geist_400Regular',
    sansMedium: 'Geist_500Medium',
    sansSemi: 'Geist_600SemiBold',
    sansBold: 'Geist_700Bold',
    mono: 'GeistMono_400Regular',
    monoMed: 'GeistMono_500Medium',
    ethiopic: 'NotoSerifEthiopic_600SemiBold',
  }),
});
