// ============================================================
// VibeSpot Design Token System
// Extends light/dark theme with full spacing, radius, type, shadow tokens
// ============================================================

const darkElevation = {
  level0: "#0B0E14", // background
  level1: "#121722", // cards
  level2: "#161C28", // elevated cards
  level3: "#1B2230", // modals
  level4: "#202838", // sheets / nav
};

// ─── Shared Tokens ───────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  hero: 36,

  // Font weights
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ─── Light Theme ─────────────────────────────────────────────
export const lightTheme = {
  // Backgrounds
  background: "#FFFFFF",
  backgroundAlt: "#F5F7FA",

  surface: "#F8F9FB",
  surfaceAlt: "#EDF1F5",
  surfaceGlass: "rgba(255, 255, 255, 0.82)",
  surfaceElevated: "#F8F9FB",

  // Text
  text: "#0B0D12",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",

  // Brand
  primary: "#007A8C",
  primarySoft: "#D9F5F7",
  primaryDark: "#159AA1",

  secondary: "#6366F1",
  accent: "#22D3EE",

  // Status
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#38BDF8",

  // UI
  border: "#E5E7EB",
  divider: "#F1F5F9",

  // Effects
  shadowSm: "rgba(0,0,0,0.05)",
  shadowMd: "rgba(0,0,0,0.10)",
  shadowLg: "rgba(0,0,0,0.18)",

  // Interaction
  ripple: "rgba(0,0,0,0.08)",

  // Design Tokens (shared reference)
  spacing,
  radius,
  typography,
  shadows,
};

// ─── Dark Theme ──────────────────────────────────────────────
export const darkTheme = {
  // Backgrounds
  background: darkElevation.level0,
  backgroundAlt: "#0F141E",

  surfaceAlt: darkElevation.level2,
  surface: darkElevation.level3,
  surfaceHighest: darkElevation.level4,
  surfaceGlass: "rgba(18,23,34,0.7)",

  // Text
  text: "#EDEDED",
  textMuted: "#A1A1AA",
  textSubtle: "#71717A",

  // Brand
  primary: "#007A8C",
  primarySoft: "#0E3F44",
  primaryDark: "#7FE7ED",

  secondary: "#818CF8",
  accent: "#22D3EE",

  // Status
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#60A5FA",

  // UI
  border: "rgba(255,255,255,0.06)",
  divider: "rgba(255,255,255,0.04)",

  // Shadows (VERY subtle)
  shadowSm: "rgba(0,0,0,0.25)",
  shadowMd: "rgba(0,0,0,0.35)",
  shadowLg: "rgba(0,0,0,0.45)",

  // Interaction
  ripple: "rgba(255,255,255,0.06)",

  // Design Tokens (shared reference)
  spacing,
  radius,
  typography,
  shadows,
};
