/**
 * Export Expo-native PNGs from brand SVGs (sharp).
 *
 * Run from fena/:  node scripts/export-brand-pngs.mjs
 *
 * Outputs:
 *   assets/icon.png (1024, ink #14161D + mark)
 *   assets/adaptive-icon-foreground.png (1024, mark on transparent)
 *   assets/splash.png (1284×2778, lockup centered on ink)
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

const markSvg = await readFile(path.join(brandDir, 'logo-mark-alt.svg'));
const lockupSvg = await readFile(path.join(brandDir, 'logo-lockup-alt.svg'));

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
const lockupW = 920;
const lockupPng = await sharp(lockupSvg)
  .resize(lockupW, Math.round((lockupW * 200) / 720))
  .png()
  .toBuffer();

await sharp({
  create: {
    width: splashW,
    height: splashH,
    channels: 4,
    background: INK,
  },
})
  .composite([{ input: lockupPng, gravity: 'centre' }])
  .png()
  .toFile(path.join(assetsDir, 'splash.png'));

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
