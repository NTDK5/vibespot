/**
 * Dynamic vibe color generation
 * Seed-based palette with accessibility-aware contrast
 */

import { luminance, hexToRgb, mix } from './colors';

const GOLDEN_ANGLE = 137.5;
const SATURATION = 0.7;
const LIGHTNESS_LIGHT = 0.45;
const LIGHTNESS_DARK = 0.55;

/**
 * Generate a hue from a seed (vibe id or name hash)
 */
export const seedToHue = (seed) => {
  if (typeof seed === 'number') return (seed * GOLDEN_ANGLE) % 360;
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash * GOLDEN_ANGLE) % 360;
};

/**
 * HSL to hex
 */
const hslToHex = (h, s, l) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Generate a vibe color from seed, with optional tone adjustment for light/dark mode
 */
export const generateVibeColor = (seed, { isDark = false, baseHex } = {}) => {
  const hue = seedToHue(seed);
  const lightness = isDark ? LIGHTNESS_DARK : LIGHTNESS_LIGHT;
  const hex = baseHex || hslToHex(hue, SATURATION, lightness);
  
  // Ensure minimum contrast - if too light in dark mode, darken
  if (isDark) {
    const lum = luminance(hexToRgb(hex));
    if (lum > 0.6) {
      return mix(hex, '#0B0E14', 0.4);
    }
  } else {
    const lum = luminance(hexToRgb(hex));
    if (lum < 0.35) {
      return mix(hex, '#ffffff', 0.3);
    }
  }
  return hex;
};

/**
 * Get a palette of 3 related colors from a base vibe color (for accents, borders, etc.)
 */
export const getVibePalette = (baseHex, isDark = false) => {
  if (!baseHex) return null;
  const rgb = hexToRgb(baseHex);
  const lum = luminance(rgb);
  
  const accent = mix(baseHex, isDark ? '#ffffff' : '#0B0D12', 0.15);
  const muted = mix(baseHex, isDark ? '#0B0E14' : '#ffffff', 0.75);
  const border = mix(baseHex, isDark ? '#1B2230' : '#E5E7EB', 0.5);
  
  return {
    primary: baseHex,
    accent,
    muted,
    border,
    isLight: lum > 0.5,
  };
};
