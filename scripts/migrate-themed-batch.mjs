#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');

const TARGETS = [
  'screens/EditProfileScreen.js',
  'screens/EditSpotScreen.js',
  'screens/AddSpotScreen.js',
  'screens/OnboardingScreen.js',
  'screens/VerifyEmailScreen.js',
  'screens/ForgotPasswordScreen.js',
  'screens/ReviewsScreen.js',
  'screens/WriteReviewScreen.js',
  'screens/CreateCollectionScreen.js',
  'components/fieldguide/sheets/ShareDispatchSheet.js',
  'components/fieldguide/sheets/ChangePasswordSheet.js',
  'components/fieldguide/sheets/SpotPickerSheet.js',
  'components/fieldguide/spot/VisitStampButton.js',
  'components/fieldguide/spot/IndexStamp.js',
  'components/fieldguide/signature/CompassDial.js',
  'components/onboarding/DiscoverIllustration.js',
];

function hookPath(rel) {
  const depth = rel.split('/').length - 1;
  return `${ '../'.repeat(depth) || './' }hooks/useThemedStyles`;
}

function migrate(rel) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes('const styles = StyleSheet.create')) {
    console.log('skip (no styles)', rel);
    return;
  }
  if (src.includes('function createStyles(fieldGuide)')) {
    console.log('skip (done)', rel);
    return;
  }

  const hp = hookPath(rel);
  if (!src.includes('useThemedStyles')) {
    if (/import fieldGuide from ['"]/.test(src)) {
      src = src.replace(
        /import fieldGuide from (['"][^'"]+['"]);/,
        `import { useThemedStyles } from '${hp}';\nimport fieldGuide from $1;`,
      );
    } else {
      src = `import { useThemedStyles } from '${hp}';\n${src}`;
    }
  }

  src = src.replace(
    /const styles = StyleSheet\.create\(\{/,
    'function createStyles(fieldGuide) {\n  return StyleSheet.create({',
  );
  const lastClose = src.lastIndexOf('\n});');
  src = `${src.slice(0, lastClose + 4)}\n}${src.slice(lastClose + 4)}`;

  if (!src.includes('useThemedStyles(createStyles)')) {
    const patterns = [
      /(export default function [^{]+\{)/,
      /(export function [^{]+\{)/,
      /(export const [A-Za-z0-9_]+ = \([^)]*\) => \{)/,
    ];
    for (const re of patterns) {
      if (re.test(src)) {
        src = src.replace(re, (m) => `${m}\n  const styles = useThemedStyles(createStyles);`);
        break;
      }
    }
  }

  if (!src.includes('useThemedStyles(createStyles)')) {
    console.log('fail', rel);
    return;
  }

  fs.writeFileSync(fp, src, 'utf8');
  console.log('ok', rel);
}

for (const rel of TARGETS) migrate(rel);
