export const hexToRgb = (hex) => {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map(x => x + x).join("");
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
};

export const luminance = ({ r, g, b }) => {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

export const mix = (color1, color2, amount = 0.5) => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r * (1 - amount) + c2.r * amount);
  const g = Math.round(c1.g * (1 - amount) + c2.g * amount);
  const b = Math.round(c1.b * (1 - amount) + c2.b * amount);

  return `rgb(${r},${g},${b})`;
};
export const createVibeTheme = (vibeColor, theme, isDark) => {
  if (!vibeColor) {
    return {
      background: theme.background,
      surface: theme.surface,
      primary: theme.primary,
    };
  }

  const lum = luminance(hexToRgb(vibeColor));

  // PRIMARY — stays vivid but contrast-safe
  const primary = vibeColor
  // SURFACE — cards
  const surface = isDark
    ? mix(vibeColor, theme.background, lum > 0.5 ? 0.75 : 0.6)
    : mix(vibeColor, "#ffffff", 0.82);

  // BACKGROUND — very soft tint
  const background = isDark
    ? mix(vibeColor, theme.background, 0.9)
    : mix(vibeColor, "#ffffff", 0.94);
  const headerIcon = isDark
    ? vibeColor
    : mix(vibeColor, "#ffffff", 0.8);
  return {
    primary,
    surface,
    background,
    headerIcon
  };
};
