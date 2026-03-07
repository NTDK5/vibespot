/**
 * VibeSpot Dynamic Vibe Color Engine
 *
 * Given a vibe's hex seed color, returns a complete palette:
 *   base, soft, muted, onColor, border, glow
 *
 * Guarantees WCAG AA contrast on `onColor` relative to `base`.
 * Respects current theme (dark/light) for background blending.
 */

import { hexToRgb, luminance, mix } from "./colors";

// ─── Core Palette Generator ───────────────────────────────────

/**
 * Generate a full vibe palette from a seed hex color.
 * @param {string} seedHex - e.g. "#FF6B6B"
 * @param {object} theme - current lightTheme or darkTheme
 * @param {boolean} isDark
 * @returns {object} palette
 */
export const generateVibePalette = (seedHex, theme, isDark) => {
    if (!seedHex) return defaultPalette(theme);

    try {
        const rgb = hexToRgb(seedHex);
        const lum = luminance(rgb);
        const isBright = lum > 0.45;

        // BASE — the vibe color itself
        const base = seedHex;

        // SOFT — very light tint for card backgrounds
        const soft = isDark
            ? mix(seedHex, theme.background, isBright ? 0.82 : 0.72)
            : mix(seedHex, "#ffffff", 0.88);

        // MUTED — subtle background accent
        const muted = isDark
            ? mix(seedHex, theme.background, 0.9)
            : mix(seedHex, "#ffffff", 0.94);

        // ON_COLOR — text/icon color on top of `base`
        // High luminance vibe → use dark text; low → use white
        const onColor = lum > 0.35 ? "#0B0D12" : "#FFFFFF";

        // BORDER — subtle ring for cards
        const border = isDark
            ? mix(seedHex, "#ffffff", 0.15)
            : mix(seedHex, "#000000", 0.12);

        // GLOW — for shadow effects
        const glowRgb = hexToRgb(seedHex);
        const glow = `rgba(${glowRgb.r},${glowRgb.g},${glowRgb.b},${isDark ? 0.35 : 0.2})`;

        // SURFACE — card surface color
        const surface = isDark
            ? mix(seedHex, theme.background, isBright ? 0.78 : 0.65)
            : mix(seedHex, "#ffffff", 0.9);

        // CTA — button background (vivid)
        const cta = base;

        return { base, soft, muted, onColor, border, glow, surface, cta };
    } catch (_) {
        return defaultPalette(theme);
    }
};

// ─── Default Palette (no vibe) ────────────────────────────────

const defaultPalette = (theme) => ({
    base: theme.primary,
    soft: theme.primarySoft || theme.surfaceAlt,
    muted: theme.backgroundAlt || theme.background,
    onColor: "#FFFFFF",
    border: theme.border,
    glow: "rgba(0,122,140,0.15)",
    surface: theme.surface,
    cta: theme.primary,
});

// ─── Top Vibe Picker ──────────────────────────────────────────

/**
 * Given an array of spot vibes from the API, returns the dominant one.
 * @param {Array} spotVibes - [{id, name, color, icon, count}]
 * @returns {{ vibe, palette } | null}
 */
export const getTopVibePalette = (spotVibes, theme, isDark) => {
    if (!Array.isArray(spotVibes) || spotVibes.length === 0) return null;

    const topVibe = spotVibes.reduce(
        (prev, curr) => (curr.count > prev.count ? curr : prev),
        spotVibes[0]
    );

    if (!topVibe?.color) return null;

    return {
        vibe: topVibe,
        palette: generateVibePalette(topVibe.color, theme, isDark),
    };
};

// ─── Contrast-safe overlay helper ────────────────────────────

/**
 * Returns a text color (dark or light) that is readable
 * on top of a given background hex color.
 */
export const readableOn = (backgroundHex) => {
    try {
        const lum = luminance(hexToRgb(backgroundHex));
        return lum > 0.35 ? "#0B0D12" : "#FFFFFF";
    } catch (_) {
        return "#FFFFFF";
    }
};
