/**
 * Export Expo-native PNGs from brand SVGs (sharp).
 *
 * Run from fena/:  node scripts/export-brand-pngs.mjs
 *
 * Outputs:
 *   assets/icon.png (1024, ink #14161D + mark)
 *   assets/adaptive-icon-foreground.png (1024, mark on transparent)
 *   assets/splash.png (1284×2778, mark + wordmark + tagline, vertical)
 *   assets/splash-android-icon.png (1024, mark only — Android 12+ native splash)
 *   assets/favicon.png (48, mark)
 */

import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const brandDir = path.join(root, 'assets', 'brand');
const assetsDir = path.join(root, 'assets');

const INK = '#14161D';
const EMBER = '#E8743A';
const CREAM_SOFT = '#D8D0C4';

const TAGLINE_LINE_1 = 'Discover places worth';
const TAGLINE_LINE_2 = 'your time';

const markSvg = await readFile(path.join(brandDir, 'logo-mark-alt.svg'));

await mkdir(assetsDir, { recursive: true });

const markSize = 880;
const markPng = await sharp(markSvg).resize(markSize, markSize).png().toBuffer();

await sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 4,
    background: INK,
  },
})
  .composite([{ input: markPng, gravity: 'centre' }])
  .png()
  .toFile(path.join(assetsDir, 'icon.png'));

await sharp(markSvg).resize(1024, 1024).png().toFile(
  path.join(assetsDir, 'adaptive-icon-foreground.png'),
);

const splashW = 1284;
const splashH = 2778;
const splashMarkSize = 920;
const splashMarkPng = await sharp(markSvg)
  .resize(splashMarkSize, splashMarkSize)
  .png()
  .toBuffer();

const textBlockH = 360;
const textSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${splashW}" height="${textBlockH}" viewBox="0 0 ${splashW} ${textBlockH}">
  <text
    x="50%"
    y="100"
    text-anchor="middle"
    font-family="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
    font-size="96"
    font-weight="600"
    letter-spacing="20"
    fill="${EMBER}"
  >FENA</text>
  <text
    x="50%"
    y="210"
    text-anchor="middle"
    font-family="ui-sans-serif, 'DM Sans', system-ui, -apple-system, sans-serif"
    font-size="48"
    font-weight="400"
    fill="${CREAM_SOFT}"
    fill-opacity="0.92"
  >${TAGLINE_LINE_1}</text>
  <text
    x="50%"
    y="270"
    text-anchor="middle"
    font-family="ui-sans-serif, 'DM Sans', system-ui, -apple-system, sans-serif"
    font-size="48"
    font-weight="400"
    fill="${CREAM_SOFT}"
    fill-opacity="0.92"
  >${TAGLINE_LINE_2}</text>
</svg>`;

const textPng = await sharp(Buffer.from(textSvg)).png().toBuffer();

const columnGap = 64;
const stackHeight = splashMarkSize + columnGap + textBlockH;
const stackTop = Math.round((splashH - stackHeight) / 2);
const markLeft = Math.round((splashW - splashMarkSize) / 2);

await sharp({
  create: {
    width: splashW,
    height: splashH,
    channels: 4,
    background: INK,
  },
})
  .composite([
    { input: splashMarkPng, top: stackTop, left: markLeft },
    { input: textPng, top: stackTop + splashMarkSize + columnGap, left: 0 },
  ])
  .png()
  .toFile(path.join(assetsDir, 'splash.png'));

const androidIconMarkSize = 760;
const androidIconMarkPng = await sharp(markSvg)
  .resize(androidIconMarkSize, androidIconMarkSize)
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 4,
    background: INK,
  },
})
  .composite([{ input: androidIconMarkPng, gravity: 'centre' }])
  .png()
  .toFile(path.join(assetsDir, 'splash-android-icon.png'));

await sharp({
  create: {
    width: 48,
    height: 48,
    channels: 4,
    background: INK,
  },
})
  .composite([
    {
      input: await sharp(markSvg).resize(40, 40).png().toBuffer(),
      gravity: 'centre',
    },
  ])
  .png()
  .toFile(path.join(assetsDir, 'favicon.png'));

console.log('Brand PNGs written to assets/');
console.log('splash.png written — verify tagline is not clipped (two-line layout)');
console.log('splash-android-icon.png written — mark only for Android 12+ native splash');
