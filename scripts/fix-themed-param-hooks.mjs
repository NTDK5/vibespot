/**
 * Remove useThemedStyles accidentally placed inside destructured params
 * and insert it as the first statement in the function body.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src');
const HOOK = '  const styles = useThemedStyles(createStyles);';
const EXPORT_RE = /^(export default function \w+|export const \w+ = \(|export function \w+|function \w+)\(/;

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function fixContent(src) {
  const lines = src.split('\n');
  let changed = false;
  let inDestructParams = false;
  let exportStart = -1;
  let pendingHookRemoval = -1;
  let pendingInsert = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim().replace(/\r$/, '');

    if (!inDestructParams && EXPORT_RE.test(trimmed) && trimmed.includes('({')) {
      inDestructParams = true;
      exportStart = i;
      pendingHookRemoval = -1;
      pendingInsert = false;
      continue;
    }

    if (inDestructParams) {
      if (trimmed === HOOK.trim()) {
        pendingHookRemoval = i;
        pendingInsert = true;
        continue;
      }

      if (/^\}\) \{$/.test(trimmed)) {
        if (pendingHookRemoval >= 0) {
          lines.splice(pendingHookRemoval, 1);
          changed = true;
          if (i > pendingHookRemoval) i -= 1;
        }
        if (pendingInsert) {
          const next = lines[i + 1]?.trim() ?? '';
          if (next !== HOOK.trim()) {
            lines.splice(i + 1, 0, HOOK);
            changed = true;
          }
          pendingInsert = false;
        }
        inDestructParams = false;
        exportStart = -1;
        pendingHookRemoval = -1;
      } else if (/^\}\)\s*=>\s*\{/.test(trimmed)) {
        // arrow: `}) => {`
        if (pendingHookRemoval >= 0) {
          lines.splice(pendingHookRemoval, 1);
          changed = true;
          if (i > pendingHookRemoval) i -= 1;
        }
        if (pendingInsert) {
          const next = lines[i + 1]?.trim() ?? '';
          if (next !== HOOK.trim()) {
            lines.splice(i + 1, 0, HOOK);
            changed = true;
          }
          pendingInsert = false;
        }
        inDestructParams = false;
      }
    }
  }

  return changed ? lines.join('\n') : null;
}

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('useThemedStyles(createStyles)')) continue;
  const next = fixContent(src);
  if (next) {
    fs.writeFileSync(file, next);
    console.log('fixed:', path.relative(process.cwd(), file));
  }
}

console.log('Done.');
