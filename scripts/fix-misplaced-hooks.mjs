#!/usr/bin/env node
/**
 * Remove misplaced `const { fieldGuide } = useTheme()` lines and re-insert
 * once at the top of each component function body that needs fieldGuide.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');
const SKIP = new Set([
  'context/ThemeContext.js',
  'theme/fieldGuideThemes.js',
  'theme/fieldGuide.js',
  'theme/fieldGuideBase.js',
  'hooks/useThemedStyles.js',
]);

const HOOK = '  const { fieldGuide } = useTheme();';
const HOOK_RE = /^\s*const \{ fieldGuide \} = useTheme\(\);\s*$/;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith('.js') && !SKIP.has(rel)) out.push(abs);
  }
  return out;
}

function stripCreateStyles(src) {
  return src.replace(/function createStyles\(fieldGuide\)[\s\S]*?^}/gm, '');
}

function themeImportPath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const depth = rel.split('/').length - 1;
  return `${ '../'.repeat(depth) || './' }context/ThemeContext`;
}

function isFnStart(line) {
  const t = line.trim();
  return (
    /^export default function \w+/.test(t) ||
    /^export function \w+/.test(t) ||
    /^function \w+\(/.test(t) ||
    /^export const \w+ = \([^)]*\) => \{/.test(t)
  );
}

function fixFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('useTheme()') && !/\bfieldGuide\b/.test(stripCreateStyles(src))) {
    return false;
  }

  const withoutCreate = stripCreateStyles(src);
  if (!/\bfieldGuide\b/.test(withoutCreate)) {
    // only used in createStyles — remove stray hooks/imports if any
    if (!src.match(HOOK_RE)) return false;
  }

  let lines = src.split('\n');
  lines = lines.filter((line) => !HOOK_RE.test(line));

  if (/\bfieldGuide\b/.test(stripCreateStyles(lines.join('\n')))) {
    if (!/import\s+\{[^}]*\buseTheme\b/.test(lines.join('\n'))) {
      const tp = themeImportPath(filePath);
      const themedIdx = lines.findIndex((l) => l.includes('useThemedStyles'));
      if (themedIdx >= 0) {
        lines.splice(themedIdx + 1, 0, `import { useTheme } from '${tp}';`);
      } else {
        const reactIdx = lines.findIndex((l) => l.startsWith('import React'));
        lines.splice(reactIdx + 1, 0, `import { useTheme } from '${tp}';`);
      }
    }

    for (let i = 0; i < lines.length; i++) {
      if (!isFnStart(lines[i])) continue;
      let braceIdx = i;
      while (braceIdx < lines.length && !lines[braceIdx].includes('{')) braceIdx++;
      if (braceIdx >= lines.length) continue;

      const bodyStart = braceIdx + 1;
      const bodySlice = lines.slice(bodyStart, bodyStart + 80).join('\n');
      if (!/\bfieldGuide\b/.test(bodySlice)) continue;

      const insertAt = bodyStart;
      lines.splice(insertAt, 0, HOOK);
      i = insertAt;
    }
  }

  const next = lines.join('\n');
  if (next !== src) {
    fs.writeFileSync(filePath, next, 'utf8');
    return true;
  }
  return false;
}

let count = 0;
for (const file of walk(ROOT)) {
  if (fixFile(file)) {
    count += 1;
    console.log('fixed', path.relative(ROOT, file));
  }
}
console.log(`Done. Fixed ${count} files.`);
