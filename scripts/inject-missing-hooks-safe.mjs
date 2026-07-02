#!/usr/bin/env node
/**
 * Add missing useTheme() to components that reference fieldGuide in JSX/logic.
 * Skips helper functions that take fieldGuide as a parameter.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');
const SKIP = new Set(['ThemeContext.js', 'fieldGuideThemes.js', 'fieldGuide.js', 'spotHelpers.js']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith('.js')) out.push(abs);
  }
  return out;
}

function stripCreateStyles(source) {
  return source.replace(/function create\w*Styles\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g, '');
}

function stripHelpersWithFieldGuideParam(source) {
  return source.replace(/function \w+\([^)]*\bfieldGuide\b[^)]*\)\s*\{[\s\S]*?\n\}/g, '');
}

function findMatchingBrace(source, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const FN_START =
  /^(export\s+default\s+function\s+\w*|export\s+(?:function\s+\w+|const\s+\w+\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*)|function\s+\w+\s*\([^)]*\))\s*\{/gm;

let changed = 0;

for (const file of walk(ROOT)) {
  if (SKIP.has(path.basename(file))) continue;
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes('fieldGuide')) continue;

  const inserts = [];
  FN_START.lastIndex = 0;
  let match;

  while ((match = FN_START.exec(source)) !== null) {
    const sig = match[1] || match[0];
    if (/\bfieldGuide\b/.test(sig.replace(/\{[\s\S]*?\}/, ''))) continue;

    const openBrace = match.index + match[0].length - 1;
    const closeBrace = findMatchingBrace(source, openBrace);
    if (closeBrace === -1) continue;

    const body = source.slice(openBrace + 1, closeBrace);
    const bodyCheck = stripCreateStyles(stripHelpersWithFieldGuideParam(body));
    if (!/\bfieldGuide\.[a-zA-Z]/.test(bodyCheck)) continue;
    if (/const\s*\{[^}]*fieldGuide[^}]*\}\s*=\s*useTheme\s*\(\)/.test(body)) continue;

    const keys = ['fieldGuide'];
    if (/\bisDark\b/.test(bodyCheck)) keys.push('isDark');
    const hookLine = `  const { ${keys.join(', ')} } = useTheme();\n`;

    const stylesIdx = body.search(/\n\s*const styles = useThemedStyles/);
    const insertOffset = stylesIdx >= 0 ? openBrace + 1 + stylesIdx + 1 : openBrace + 1;
    inserts.push({ insertOffset, hookLine });
  }

  if (inserts.length === 0) continue;

  inserts.sort((a, b) => b.insertOffset - a.insertOffset);
  for (const { insertOffset, hookLine } of inserts) {
    source = source.slice(0, insertOffset) + hookLine + source.slice(insertOffset);
  }

  if (!source.includes('useTheme')) {
    const importPath = file.includes(`${path.sep}screens${path.sep}`) ? '../context/ThemeContext'
      : file.includes(`${path.sep}navigation${path.sep}`) ? '../context/ThemeContext'
      : '../../../context/ThemeContext';
    const lastImport = source.lastIndexOf('\nimport ');
    const end = source.indexOf('\n', lastImport + 1);
    source = `${source.slice(0, end + 1)}import { useTheme } from '${importPath}';\n${source.slice(end + 1)}`;
  }

  fs.writeFileSync(file, source);
  changed++;
  console.log('fixed', path.relative(ROOT, file), `(${inserts.length})`);
}

console.log(`Done. Updated ${changed} files.`);
