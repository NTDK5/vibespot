#!/usr/bin/env node
/**
 * Replace hardcoded dark ink rgba values with fieldGuide tokens inside createStyles().
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');

const REPLACEMENTS = [
  ["'rgba(20,22,29,0.45)'", 'fieldGuide.overlay'],
  ["'rgba(20,22,29,0.78)'", 'fieldGuide.canvasElev'],
  ["'rgba(20,22,29,0.75)'", 'fieldGuide.overlay'],
  ["'rgba(20,22,29,0.72)'", 'fieldGuide.overlay'],
  ["'rgba(20,22,29,0.62)'", 'fieldGuide.textMute'],
  ["'rgba(20,22,29,0.55)'", 'fieldGuide.overlay'],
  ["'rgba(20,22,29,0.32)'", 'fieldGuide.line2'],
  ["'rgba(20,22,29,0.22)'", 'fieldGuide.line2'],
  ["'rgba(20,22,29,0.18)'", 'fieldGuide.line'],
  ["'rgba(20,22,29,0.14)'", 'fieldGuide.line'],
  ["'rgba(20,22,29,0.12)'", 'fieldGuide.line'],
  ['#0B0C11', 'fieldGuide.canvasDeep'],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith('.js')) out.push(abs);
  }
  return out;
}

function fixFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  const start = src.indexOf('function createStyles(fieldGuide)');
  if (start === -1) return false;

  let depth = 0;
  let i = start;
  let bodyStart = -1;
  while (i < src.length) {
    if (src[i] === '{') {
      depth++;
      if (depth === 1) bodyStart = i;
    }
    if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        const before = src.slice(0, bodyStart + 1);
        let body = src.slice(bodyStart + 1, i);
        const after = src.slice(i);
        let changed = false;
        for (const [from, to] of REPLACEMENTS) {
          if (body.includes(from)) {
            body = body.split(from).join(to);
            changed = true;
          }
        }
        if (!changed) return false;
        fs.writeFileSync(filePath, before + body + after, 'utf8');
        return true;
      }
    }
    i++;
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
