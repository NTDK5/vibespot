#!/usr/bin/env node
/**
 * Add `const { fieldGuide } = useTheme();` before `useThemedStyles` in
 * components that reference fieldGuide in JSX/logic (not only createStyles).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const SKIP = new Set(['ThemeContext.js', 'fieldGuideThemes.js', 'fieldGuide.js', 'spotHelpers.js']);

function walk(d, o = []) {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) walk(p, o);
    else if (n.endsWith('.js')) o.push(p);
  }
  return o;
}

function findMatchingBrace(s, i) {
  let d = 0;
  for (; i < s.length; i++) {
    if (s[i] === '{') d++;
    else if (s[i] === '}') { d--; if (!d) return i; }
  }
  return -1;
}

const STARTERS = [
  /^export\s+default\s+function\s+\w*\s*\([^)]*\)\s*\{/gm,
  /^export\s+function\s+\w+\s*\([^)]*\)\s*\{/gm,
  /^export\s+const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/gm,
  /^export\s+function\s+\w+\s*\(\{[^}]*\}\)\s*\{/gm,
  /^export\s+default\s+function\s+\w+\s*\(\{[^}]*\}\)\s*\{/gm,
];

function signatureHasFieldGuide(sig) {
  return /\bfieldGuide\b/.test(sig);
}

function stripStyleFactories(body) {
  return body.replace(/function create\w*Styles\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g, '');
}

function stripFieldGuideHelpers(body) {
  return body.replace(/function \w+\([^)]*\bfieldGuide\b[^)]*\)\s*\{[\s\S]*?\n\}/g, '');
}

let total = 0;

for (const file of walk(ROOT)) {
  if (SKIP.has(path.basename(file))) continue;
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('fieldGuide')) continue;

  const inserts = [];

  for (const re of STARTERS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const sig = m[0];
      if (signatureHasFieldGuide(sig)) continue;

      const open = m.index + m[0].length - 1;
      const close = findMatchingBrace(src, open);
      if (close < 0) continue;

      const body = src.slice(open + 1, close);
      const check = stripFieldGuideHelpers(stripStyleFactories(body));
      if (!/\bfieldGuide\.[a-zA-Z]/.test(check)) continue;
      if (/const\s*\{[^}]*fieldGuide[^}]*\}\s*=\s*useTheme\s*\(\)/.test(body)) continue;

      const matchStyles = body.match(/\n(\s*)const styles = useThemedStyles/);
      if (!matchStyles) continue;

      const indent = matchStyles[1];
      const keys = ['fieldGuide'];
      if (/\bisDark\b/.test(check)) keys.push('isDark');
      const hook = `\n${indent}const { ${keys.join(', ')} } = useTheme();`;
      const at = open + 1 + matchStyles.index;
      inserts.push({ at, hook });
    }
  }

  if (!inserts.length) continue;

  // dedupe by position
  const seen = new Set();
  const unique = inserts.filter(({ at }) => {
    if (seen.has(at)) return false;
    seen.add(at);
    return true;
  });

  unique.sort((a, b) => b.at - a.at);
  for (const { at, hook } of unique) {
    src = src.slice(0, at) + hook + src.slice(at);
  }

  fs.writeFileSync(file, src);
  console.log(path.relative(ROOT, file), unique.length);
  total++;
}

console.log('updated', total);
