#!/usr/bin/env node
/**
 * Fix useTheme hook accidentally placed inside destructured function params
 * or inside plain object literals (buildFgType, buildLegacyTheme, etc.).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');
const HOOK = '  const { fieldGuide } = useTheme();';
const HOOK_RE = /^\s*const \{ fieldGuide \} = useTheme\(\);\s*$/;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith('.js')) out.push(abs);
  }
  return out;
}

function fixContent(src) {
  const lines = src.split('\n');
  let changed = false;
  let inDestructParams = false;
  let pendingHookLine = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!inDestructParams) {
      // Start of destructured params: `function Foo({` or `export default function Foo({`
      if (/function \w+\(\{$/.test(trimmed) || /function \w+\(\{\s*$/.test(trimmed)) {
        inDestructParams = true;
        continue;
      }
      // Also: `export default function Foo({` on one line with nothing else
      if (/^(export default )?function \w+\(\{\s*$/.test(trimmed)) {
        inDestructParams = true;
        continue;
      }
    }

    if (inDestructParams) {
      if (HOOK_RE.test(line)) {
        pendingHookLine = HOOK;
        lines.splice(i, 1);
        changed = true;
        i--;
        continue;
      }

      if (/^\}\)\s*\{/.test(trimmed) || /^\}\)\s*=>\s*\{/.test(trimmed)) {
        if (pendingHookLine) {
          lines.splice(i + 1, 0, pendingHookLine);
          pendingHookLine = null;
          changed = true;
        }
        inDestructParams = false;
      }
    }
  }

  // Remove hook lines inside object literals (e.g. buildFgType return {)
  for (let i = 0; i < lines.length; i++) {
    if (!HOOK_RE.test(lines[i])) continue;
    const prev = lines[i - 1]?.trim() ?? '';
    const next = lines[i + 1]?.trim() ?? '';
    // Inside object literal: previous line ends with `{` or `return {`
    if (prev.endsWith('{') || prev === 'return {') {
      lines.splice(i, 1);
      changed = true;
      i--;
    }
  }

  return changed ? lines.join('\n') : null;
}

let count = 0;
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('useTheme()')) continue;
  const fixed = fixContent(src);
  if (fixed) {
    fs.writeFileSync(file, fixed, 'utf8');
    count += 1;
    console.log('fixed', path.relative(ROOT, file));
  }
}
console.log(`Done. Fixed ${count} files.`);
