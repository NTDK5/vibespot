/**
 * Find component files that reference fieldGuide outside createStyles
 * but lack `const { fieldGuide } = useTheme()` in the component body.
 */
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('src');
const SKIP = new Set([
  'fieldGuide.js',
  'fieldGuideThemes.js',
  'ThemeContext.js',
  'spotHelpers.js',
]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

function stripCreateStyles(source) {
  return source.replace(/function createStyles\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g, '');
}

const missing = [];

for (const file of walk(SRC)) {
  if (SKIP.has(path.basename(file))) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('fieldGuide')) continue;
  if (source.includes('import fieldGuide from')) {
    missing.push({ file, reason: 'static import' });
    continue;
  }
  const without = stripCreateStyles(source);
  if (!/\bfieldGuide\b/.test(without)) continue;
  const hasHook =
    /const\s*\{\s*fieldGuide\s*\}\s*=\s*useTheme\s*\(\)/.test(without) ||
    /const\s*\{\s*fieldGuide,\s*[^}]+\}\s*=\s*useTheme\s*\(\)/.test(without) ||
    /const\s*\{\s*[^}]*fieldGuide[^}]*\}\s*=\s*useTheme\s*\(\)/.test(without);
  if (!hasHook && /fieldGuide\.[a-zA-Z]/.test(without)) {
    missing.push({ file: path.relative(process.cwd(), file), reason: 'no useTheme hook' });
  }
}

console.log(`Found ${missing.length} files:`);
for (const { file, reason } of missing) {
  console.log(`  ${reason}: ${file}`);
}
