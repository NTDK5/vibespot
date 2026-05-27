/**
 * FENA — Field Guide design system tokens.
 *
 * Mirrors the CSS custom properties declared in `:root` of
 * `fena open design/css_app.css`. Treat this file as the single
 * JS source of truth for Field Guide colors, type, radii, and the
 * duotone "vibe" gradient stops.
 *
 * Values are kept literal (not computed from each other) so the
 * mapping back to the CSS variables stays diff-able.
 */

export const fieldGuide = Object.freeze({
  // surfaces
  ink:         '#14161D',
  inkDeep:     '#0B0C11',
  inkElev:     '#1B1E27',
  inkLine:     'rgba(244,239,230,0.08)',
  inkLine2:    'rgba(244,239,230,0.14)',

  // paper variant
  paper:       '#F4EFE6',
  paperSoft:   '#E8DFD0',
  paperDeep:   '#D6CCB8',

  // text
  cream:       '#F4EFE6',
  creamSoft:   'rgba(244,239,230,0.72)',
  creamMute:   'rgba(244,239,230,0.52)',
  creamFaint:  'rgba(244,239,230,0.34)',
  inkText:     '#14161D',
  inkMute:     'rgba(20,22,29,0.62)',
  inkFaint:    'rgba(20,22,29,0.38)',

  // accents
  ember:       '#E8743A',
  emberSoft:   '#F4B68E',
  emberDeep:   '#B45427',
  moss:        '#7A9B6A',
  rose:        '#C95F6E',
  gold:        '#C9A24B',

  // duotone vibe gradients (mirrors .ph-* rules in css_app.css)
  vibes: Object.freeze({
    cafe:    Object.freeze(['#3D2817', '#8B4423', '#D67843']),
    roof:    Object.freeze(['#1B1F3A', '#4F3970', '#C95F6E']),
    gallery: Object.freeze(['#1F1A14', '#4A3A28', '#B89968']),
    park:    Object.freeze(['#1F2A1A', '#3D5A38', '#8FB07A']),
    night:   Object.freeze(['#0B0C11', '#1F1B3A', '#6B4E8C']),
    alley:   Object.freeze(['#14161D', '#2C2935', '#6B5A4A']),
    water:   Object.freeze(['#0F2230', '#1F4A66', '#88BBC7']),
    desert:  Object.freeze(['#3A2A1F', '#7A5538', '#D9A777']),
    studio:  Object.freeze(['#2A1F1A', '#6B4A38', '#E8AA82']),
    court:   Object.freeze(['#1A2A2F', '#2E5D5A', '#88B8A3']),
    paper:   Object.freeze(['#E8DFD0', '#D6CCB8', '#C9A24B']),
    cream:   Object.freeze(['#F4EFE6', '#E8DFD0']),
  }),

  // radii (mirror --r-* CSS vars)
  radius: Object.freeze({ sm: 6, md: 10, lg: 16, xl: 22, full: 999 }),

  // safe areas — fallback only; prefer useSafeAreaInsets() at runtime
  safe: Object.freeze({ top: 54, bottom: 34 }),

  // letter-spacing helpers — RN takes pixels, so each helper converts
  // an em-equivalent factor to px against a given font size.
  tracking: Object.freeze({
    tight:  (fs) => -0.02 * fs,
    normal: 0,
    wide:   (fs) =>  0.18 * fs,   // pill / spot-meta / tabbar
    wider:  (fs) =>  0.20 * fs,   // spot index, dot-sep
    widest: (fs) =>  0.22 * fs,   // eyebrow / field-label
    mono28: (fs) =>  0.28 * fs,   // kicker
    mono30: (fs) =>  0.30 * fs,   // labels on hero
  }),

  // font families — keys MUST match the faces loaded in src/theme/fonts.js
  fonts: Object.freeze({
    serif:        'Fraunces_400Regular',
    serifItalic:  'Fraunces_400Regular_Italic',
    serifMedium:  'Fraunces_500Medium',
    serifLight:   'Fraunces_300Light',
    serifBold:    'Fraunces_700Bold',
    sans:         'Inter_400Regular',
    sansMedium:   'Inter_500Medium',
    sansSemi:     'Inter_600SemiBold',
    sansBold:     'Inter_700Bold',
    mono:         'JetBrainsMono_400Regular',
    monoMed:      'JetBrainsMono_500Medium',
  }),
});

/**
 * Re-usable text style presets so consumers don't repeat themselves
 * for the most common Field Guide type roles.
 */
export const fgType = Object.freeze({
  eyebrow:   { fontFamily: 'JetBrainsMono_400Regular', fontSize: 10,  letterSpacing: 2.2,  textTransform: 'uppercase', color: fieldGuide.creamMute },
  kicker:    { fontFamily: 'JetBrainsMono_500Medium',  fontSize: 9,   letterSpacing: 2.52, textTransform: 'uppercase', color: fieldGuide.ember },
  displayLg: { fontFamily: 'Fraunces_400Regular',      fontSize: 36,  letterSpacing: -0.72, color: fieldGuide.cream, lineHeight: 38 },
  displayMd: { fontFamily: 'Fraunces_500Medium',       fontSize: 22,  letterSpacing: -0.22, color: fieldGuide.cream },
  spotName:  { fontFamily: 'Fraunces_500Medium',       fontSize: 22,  letterSpacing: -0.22, color: fieldGuide.cream, lineHeight: 25 },
  body:      { fontFamily: 'Inter_400Regular',         fontSize: 15,  lineHeight: 21,       color: fieldGuide.creamSoft },
  blurb:     { fontFamily: 'Inter_400Regular',         fontSize: 13,  lineHeight: 18,       color: fieldGuide.creamSoft },
  meta:      { fontFamily: 'JetBrainsMono_400Regular', fontSize: 9.5, letterSpacing: 1.9,   textTransform: 'uppercase', color: fieldGuide.creamMute },
  monoSm:    { fontFamily: 'JetBrainsMono_400Regular', fontSize: 8.5, letterSpacing: 1.53,  textTransform: 'uppercase' },
});

export default fieldGuide;
