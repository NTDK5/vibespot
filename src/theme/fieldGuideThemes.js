import { fieldGuideBase } from './fieldGuideBase';

/** Build resolved Field Guide palette for dark or light mode. */
export function buildFieldGuide(isDark) {
  const base = fieldGuideBase;

  if (isDark) {
    return Object.freeze({
      ...base,
      mode: 'dark',
      /** Physical cream fill — always #F4EFE6 (buttons, active segments, knobs). */
      creamFill: base.cream,
      /** Text/icons on creamFill or ember fills. */
      onCreamFill: base.inkText,
      /** Light text on dark overlays, photos, and glass chrome. */
      onDark: base.cream,
      /** Text on ember/orange fills. */
      onEmber: '#FFF8F1',
      canvas: base.ink,
      canvasDeep: base.inkDeep,
      canvasElev: base.inkElev,
      line: base.inkLine,
      line2: base.inkLine2,
      text: base.cream,
      textSoft: base.creamSoft,
      textMute: base.creamMute,
      textFaint: base.creamFaint,
      overlay: 'rgba(20,22,29,0.45)',
      statusBar: 'light',
    });
  }

  return Object.freeze({
    ...base,
    mode: 'light',
    creamFill: base.cream,
    onCreamFill: base.inkText,
    onDark: base.cream,
    onEmber: '#FFF8F1',
    ink: base.paper,
    inkDeep: base.paperDeep,
    inkElev: base.paperSoft,
    inkLine: 'rgba(20,22,29,0.08)',
    inkLine2: 'rgba(20,22,29,0.14)',
    cream: base.inkText,
    creamSoft: base.inkMute,
    creamMute: 'rgba(20,22,29,0.52)',
    creamFaint: base.inkFaint,
    canvas: base.paper,
    canvasDeep: base.paperDeep,
    canvasElev: base.paperSoft,
    line: 'rgba(20,22,29,0.08)',
    line2: 'rgba(20,22,29,0.14)',
    text: base.inkText,
    textSoft: base.inkMute,
    textMute: 'rgba(20,22,29,0.52)',
    textFaint: base.inkFaint,
    overlay: 'rgba(244,239,230,0.72)',
    statusBar: 'dark',
  });
}

export function buildFgType(fieldGuide) {
  return Object.freeze({
    eyebrow: {
      fontFamily: 'GeistMono_400Regular',
      fontSize: 10,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      color: fieldGuide.textMute,
    },
    kicker: {
      fontFamily: 'GeistMono_500Medium',
      fontSize: 9,
      letterSpacing: 2.52,
      textTransform: 'uppercase',
      color: fieldGuide.ember,
    },
    displayLg: {
      fontFamily: 'Geist_800ExtraBold',
      fontSize: 36,
      letterSpacing: -0.72,
      color: fieldGuide.text,
      lineHeight: 42,
    },
    displayMd: {
      fontFamily: 'Geist_700Bold',
      fontSize: 22,
      letterSpacing: -0.22,
      color: fieldGuide.text,
      lineHeight: 28,
    },
    spotName: {
      fontFamily: 'Geist_700Bold',
      fontSize: 22,
      letterSpacing: -0.22,
      color: fieldGuide.text,
      lineHeight: 27,
    },
    body: {
      fontFamily: 'Geist_400Regular',
      fontSize: 15,
      lineHeight: 22,
      color: fieldGuide.textSoft,
    },
    blurb: {
      fontFamily: 'Geist_400Regular',
      fontSize: 13,
      lineHeight: 19,
      color: fieldGuide.textSoft,
    },
    meta: {
      fontFamily: 'GeistMono_400Regular',
      fontSize: 9.5,
      letterSpacing: 1.9,
      textTransform: 'uppercase',
      color: fieldGuide.textMute,
    },
    monoSm: {
      fontFamily: 'GeistMono_400Regular',
      fontSize: 8.5,
      letterSpacing: 1.53,
      textTransform: 'uppercase',
    },
  });
}

/** Map Field Guide tokens onto legacy theme shape for older components. */
export function buildLegacyTheme(fieldGuide, isDark) {
  return {
    background: fieldGuide.canvas,
    backgroundAlt: fieldGuide.canvasElev,
    surface: fieldGuide.canvasElev,
    surfaceAlt: fieldGuide.canvasDeep,
    surfaceElevated: fieldGuide.canvasElev,
    surfaceHighest: fieldGuide.canvasElev,
    surfaceGlass: isDark ? 'rgba(18,23,34,0.7)' : 'rgba(244,239,230,0.82)',
    text: fieldGuide.text,
    textMuted: fieldGuide.textMute,
    textSubtle: fieldGuide.textFaint,
    primary: fieldGuide.ember,
    primarySoft: isDark ? 'rgba(232,116,58,0.2)' : 'rgba(232,116,58,0.14)',
    primaryDark: fieldGuide.emberDeep,
    secondary: fieldGuide.moss,
    accent: fieldGuide.gold,
    success: '#22C55E',
    warning: '#F59E0B',
    error: fieldGuide.rose,
    info: '#38BDF8',
    border: fieldGuide.line2,
    divider: fieldGuide.line,
    shadowSm: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.05)',
    shadowMd: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.10)',
    shadowLg: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.18)',
    ripple: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
  };
}
