#!/usr/bin/env node
/**
 * Ensure exported components using fieldGuide in JSX have useTheme() hook.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');
const HOOK = '  const { fieldGuide } = useTheme();';

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith('.js')) out.push(abs);
  }
  return out;
}

function themePath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const depth = rel.split('/').length - 1;
  return `${ '../'.repeat(depth) || './' }context/ThemeContext`;
}

function stripCreateStyles(src) {
  const re = /function createStyles\(fieldGuide\)[\s\S]*?^}/gm;
  return src.replace(re, '');
}

function isExportStart(line) {
  const t = line.trim();
  return (
    /^export default function \w+/.test(t) ||
    /^export function \w+/.test(t) ||
    /^export const \w+ = \([^)]*\) => \{/.test(t)
  );
}

function extractBody(lines, startIdx) {
  let depth = 0;
  let started = false;
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!started) {
      if (line.includes('{')) started = true;
      else continue;
    }
    for (const ch of line) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth === 0) return { bodyStart: startIdx, bodyEnd: i, insertAt: startIdx + 1 };
  }
  return null;
}

function fixFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (!/\bfieldGuide\b/.test(src)) return false;

  const withoutStyles = stripCreateStyles(src);
  if (!/\bfieldGuide\b/.test(withoutStyles)) return false;

  let changed = false;
  const lines = src.split('\n');

  if (!/import\s+\{[^}]*\buseTheme\b/.test(src)) {
    const tp = themePath(filePath);
    const themedImport = src.match(/import \{ useThemedStyles \} from ['"][^'"]+['"];/);
    if (themedImport) {
      src = src.replace(
        themedImport[0],
        `${themedImport[0]}\nimport { useTheme } from '${tp}';`,
      );
    } else {
      const reactImport = src.match(/import React[^;]+;/);
      if (reactImport) {
        src = src.replace(
          reactImport[0],
          `${reactImport[0]}\nimport { useTheme } from '${tp}';`,
        );
      }
    }
    changed = true;
    lines.splice(0, lines.length, ...src.split('\n'));
  }

  for (let i = 0; i < lines.length; i++) {
    if (!isExportStart(lines[i])) continue;
    const body = extractBody(lines, i);
    if (!body) continue;

    const bodyLines = lines.slice(body.bodyStart + 1, body.bodyEnd);
    const usesFieldGuide = bodyLines.some(
      (l) => /\bfieldGuide\b/.test(l) && !l.includes('createStyles'),
    );
    const hasHook = bodyLines.some((l) => l.includes('useTheme()'));
    if (!usesFieldGuide || hasHook) continue;

    let insertAt = body.bodyStart + 1;
    while (insertAt <= body.bodyEnd && !lines[insertAt].includes('{')) insertAt++;
    insertAt += 1;

    lines.splice(insertAt, 0, HOOK);
    changed = true;
    i = insertAt;
  }

  if (changed) fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return changed;
}

let count = 0;
for (const file of walk(ROOT)) {
  if (fixFile(file)) {
    count += 1;
    console.log('fixed', path.relative(ROOT, file));
  }
}
console.log(`Done. Fixed ${count} files.`);
