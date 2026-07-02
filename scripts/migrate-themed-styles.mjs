#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');

const SKIP = new Set([
  'theme/fieldGuide.js',
  'theme/fieldGuideBase.js',
  'theme/fieldGuideThemes.js',
  'hooks/useThemedStyles.js',
  'context/ThemeContext.js',
  'components/ThemedStatusBar.js',
  'components/LeafletMap.js',
  'components/ToastProvider.js',
]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith('.js') && !SKIP.has(rel)) out.push(abs);
  }
  return out;
}

function hookImportDepth(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const depth = rel.split('/').length - 1;
  return `${ '../'.repeat(depth) || './' }hooks/useThemedStyles`;
}

function injectHooks(src) {
  const patterns = [
    /(^|\n)((?:export default )?function\s+[A-Za-z0-9_$]+\s*\([^)]*\)\s*\{)/g,
    /(^|\n)(export\s+function\s+[A-Za-z0-9_$]+\s*\([^)]*\)\s*\{)/g,
    /(^|\n)(export\s+const\s+[A-Za-z0-9_$]+\s*=\s*\([^)]*\)\s*=>\s*\{)/g,
    /(^|\n)(const\s+[A-Za-z0-9_$]+\s*=\s*\([^)]*\)\s*=>\s*\{)/g,
  ];

  let out = src;
  for (const re of patterns) {
    out = out.replace(re, (match, prefix, fnStart) => {
      const idx = out.indexOf(fnStart);
      const header = out.slice(idx, idx + 1600);
      if (!header.includes('styles.')) return match;
      if (header.includes('useThemedStyles(createStyles)')) return match;
      return `${prefix}${fnStart}\n  const styles = useThemedStyles(createStyles);`;
    });
  }
  return out;
}

function migrateFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('StyleSheet.create')) return false;
  if (!src.includes('fieldGuide')) return false;
  if (!/const styles = StyleSheet\.create\(\{/.test(src)) return false;
  if (src.includes('function createStyles(fieldGuide)')) return false;

  const hookPath = hookImportDepth(filePath);
  if (!src.includes('useThemedStyles')) {
    if (/import fieldGuide from ['"]/.test(src)) {
      src = src.replace(
        /import fieldGuide from (['"][^'"]+['"]);/,
        `import { useThemedStyles } from '${hookPath}';\nimport fieldGuide from $1;`,
      );
    } else {
      src = `import { useThemedStyles } from '${hookPath}';\n${src}`;
    }
  }

  src = src.replace(
    /const styles = StyleSheet\.create\(\{/,
    'function createStyles(fieldGuide) {\n  return StyleSheet.create({',
  );

  const lastClose = src.lastIndexOf('\n});');
  if (lastClose === -1) return false;
  src = `${src.slice(0, lastClose + 4)}\n}${src.slice(lastClose + 4)}`;

  src = injectHooks(src);
  if (!src.includes('useThemedStyles(createStyles)')) return false;

  fs.writeFileSync(filePath, src, 'utf8');
  return true;
}

let count = 0;
for (const file of walk(ROOT)) {
  if (migrateFile(file)) {
    count += 1;
    console.log('migrated', path.relative(ROOT, file));
  }
}
console.log(`Done. Migrated ${count} files.`);
