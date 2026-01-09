const darkElevation = {
  level0: "#0B0E14", // background
  level1: "#121722", // cards
  level2: "#161C28", // elevated cards
  level3: "#1B2230", // modals
  level4: "#202838", // sheets / nav
};

export const lightTheme = {
  // Backgrounds
  background: "#FFFFFF",        // app root
  backgroundAlt: "#F5F7FA",     // pull-to-refresh, modals backdrop

  surface: "#F8F9FB",           // cards, sheets
  surfaceAlt: "#EDF1F5",        // list items, inner cards
  surfaceGlass: "rgba(255, 255, 255, 0.82)",
  surfaceElevated : "#F8F9FB",
  // Text
  text: "#0B0D12",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",

  // Brand
  primary: "#1ECAD3",
  primarySoft: "#D9F5F7",
  primaryDark: "#159AA1",

  secondary: "#6366F1",         // modern indigo accent
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
};
export const darkTheme = {
  // Backgrounds
  background: darkElevation.level0,
  backgroundAlt: "#0F141E",

  // surface: darkElevation.level1,
  surfaceAlt: darkElevation.level2,
  surface: darkElevation.level3,
  surfaceHighest: darkElevation.level4,

  surfaceGlass: "rgba(18,23,34,0.7)",

  // Text
  text: "#EDEDED",
  textMuted: "#A1A1AA",
  textSubtle: "#71717A",

  // Brand
  primary: "#1ECAD3",
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
};
