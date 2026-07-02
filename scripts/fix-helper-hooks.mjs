#!/usr/bin/env node
/**
 * Remove erroneous `useTheme()` calls injected into plain helper functions
 * that already receive `fieldGuide` (and optionally `isDark`) as parameters.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');

const SKIP = new Set(['ThemeContext.js', 'fieldGuideThemes.js']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith('.js')) out.push(abs);
  }
  return out;
}

const HOOK_LINE =
  /\r?\n\s*const\s*\{\s*(?:fieldGuide(?:\s*,\s*isDark)?|isDark\s*,\s*fieldGuide)\s*\}\s*=\s*useTheme\(\);\r?\n/g;

function hasFieldGuideParam(signature) {
  return /\bfieldGuide\b/.test(signature);
}

function fixFile(filePath) {
  if (SKIP.has(path.basename(filePath))) return false;
  let src = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const fnRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
  let match;
  const removals = [];

  while ((match = fnRegex.exec(src)) !== null) {
    const [, name, params] = match;
    if (!hasFieldGuideParam(params)) continue;

    const openBrace = match.index + match[0].length - 1;
    let depth = 0;
    let bodyStart = -1;
    let bodyEnd = -1;

    for (let i = openBrace; i < src.length; i++) {
      if (src[i] === '{') {
        depth++;
        if (depth === 1) bodyStart = i + 1;
      } else if (src[i] === '}') {
        depth--;
        if (depth === 0) {
          bodyEnd = i;
          break;
        }
      }
    }

    if (bodyStart === -1 || bodyEnd === -1) continue;

    const body = src.slice(bodyStart, bodyEnd);
    const cleaned = body.replace(HOOK_LINE, '\n');
    if (cleaned !== body) {
      removals.push({ bodyStart, bodyEnd, cleaned, name });
    }
  }

  // Also fix destructured-param components: ({ ..., fieldGuide, ... })
  const arrowRegex = /function\s+(\w+)\s*\(\{([^}]*\bfieldGuide\b[^}]*)\}\)/g;
  while ((match = arrowRegex.exec(src)) !== null) {
    const openParen = src.indexOf('{', match.index);
    const closeParen = src.indexOf('})', match.index);
    if (closeParen === -1) continue;
    const fnStart = src.indexOf('{', closeParen);
    if (fnStart === -1) continue;

    let depth = 0;
    let bodyStart = -1;
    let bodyEnd = -1;
    for (let i = fnStart; i < src.length; i++) {
      if (src[i] === '{') {
        depth++;
        if (depth === 1) bodyStart = i + 1;
      } else if (src[i] === '}') {
        depth--;
        if (depth === 0) {
          bodyEnd = i;
          break;
        }
      }
    }
    if (bodyStart === -1 || bodyEnd === -1) continue;
    const body = src.slice(bodyStart, bodyEnd);
    const cleaned = body.replace(HOOK_LINE, '\n');
    if (cleaned !== body) {
      removals.push({ bodyStart, bodyEnd, cleaned, name: match[1] });
    }
  }

  if (removals.length === 0) return false;

  // Apply from end to preserve indices
  removals.sort((a, b) => b.bodyStart - a.bodyStart);
  for (const { bodyStart, bodyEnd, cleaned } of removals) {
    src = src.slice(0, bodyStart) + cleaned + src.slice(bodyEnd);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, src, 'utf8');
    console.log('fixed', path.relative(ROOT, filePath), `(${removals.length})`);
  }
  return changed;
}

let count = 0;
for (const file of walk(ROOT)) {
  if (fixFile(file)) count += 1;
}
console.log(`Done. Fixed ${count} files.`);
