# FENA brand PNG export

Expo requires raster assets for `app.json` icon and splash. In-app UI uses SVG via `react-native-svg` components in `src/components/brand/`.

## Regenerate PNGs

```bash
npm run brand:export
```

Uses **sharp** (`scripts/export-brand-pngs.mjs`) against:

- `assets/brand/logo-mark-alt.svg` → `assets/icon.png` (1024×1024, ink `#14161D` background)
- Same mark → `assets/adaptive-icon-foreground.png` (1024×1024)
- `assets/brand/logo-mark-alt.svg` → `assets/splash.png` (1284×2778, vertical column: 920px mark + FENA wordmark + tagline)
- Mark → `assets/favicon.png` (48×48)

Source SVGs copied from the design kit (`logo-lockup-alt.svg`, `logo-mark-alt.svg`).
