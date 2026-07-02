/**
 * Insert `const styles = useThemedStyles(createStyles)` into exported
 * components that reference `styles.` but never call the hook.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src');
const HOOK_LINE = '  const styles = useThemedStyles(createStyles);';

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function isExportStart(line) {
  return (
    /^export default function \w+/.test(line) ||
    /^export const \w+ = \(/.test(line) ||
    /^export function \w+/.test(line)
  );
}

function extractFunctionBody(lines, startIdx) {
  let depth = 0;
  let started = false;
  const bodyLines = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!started) {
      if (line.includes('{')) started = true;
      else continue;
    }
    bodyLines.push(line);
    for (const ch of line) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth === 0) {
      return { bodyLines, endIdx: i };
    }
  }
  return { bodyLines, endIdx: lines.length - 1 };
}

function bodyUsesStyles(bodyLines) {
  return bodyLines.some(
    (line) => line.includes('styles.') && !line.includes('createStyles'),
  );
}

function bodyHasHook(bodyLines) {
  return bodyLines.some((line) => line.includes('useThemedStyles(createStyles)'));
}

function insertHook(lines, startIdx) {
  const { bodyLines, endIdx } = extractFunctionBody(lines, startIdx);
  if (!bodyUsesStyles(bodyLines) || bodyHasHook(bodyLines)) {
    return null;
  }

  let insertAt = startIdx;
  while (insertAt <= endIdx && !lines[insertAt].includes('{')) insertAt++;
  if (insertAt > endIdx) return null;

  insertAt += 1;
  const next = lines[insertAt]?.trim() ?? '';
  if (next.startsWith('const styles = useThemedStyles')) return null;

  const updated = [...lines];
  updated.splice(insertAt, 0, HOOK_LINE);
  return updated.join('\n');
}

let fixed = 0;
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('function createStyles') || !src.includes('useThemedStyles')) continue;

  const lines = src.split('\n');
  let updated = null;

  for (let i = 0; i < lines.length; i++) {
    if (!isExportStart(lines[i])) continue;
    const next = insertHook(lines, i);
    if (next) {
      updated = next;
      lines.splice(0, lines.length, ...next.split('\n'));
      fixed += 1;
      console.log('fixed export hook:', path.relative(process.cwd(), file));
    }
  }

  if (updated) fs.writeFileSync(file, updated);
}

console.log(`Done. Patched ${fixed} export(s).`);
