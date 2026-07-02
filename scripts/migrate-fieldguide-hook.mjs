#!/usr/bin/env node
/**
 * Replace static `import fieldGuide from '../theme/fieldGuide'` with useTheme().
 * Injects `const { fieldGuide } = useTheme()` into component bodies that reference
 * fieldGuide outside createStyles().
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');

const SKIP = new Set([
  'theme/fieldGuide.js',
  'theme/fieldGuideBase.js',
  'theme/fieldGuideThemes.js',
]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith('.js') && !SKIP.has(rel)) out.push(abs);
  }
  return out;
}

function themeImportPath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const depth = rel.split('/').length - 1;
  return `${ '../'.repeat(depth) || './' }context/ThemeContext`;
}

function hookImportPath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const depth = rel.split('/').length - 1;
  return `${ '../'.repeat(depth) || './' }hooks/useThemedStyles`;
}

const IMPORT_RE = /import fieldGuide from ['"][^'"]+['"];\r?\n/;

function stripCreateStylesBody(src) {
  const start = src.indexOf('function createStyles(fieldGuide)');
  if (start === -1) return src;
  let depth = 0;
  let i = start;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        return src.slice(0, start) + src.slice(i + 1);
      }
    }
    i++;
  }
  return src;
}

function needsFieldGuideHook(srcWithoutCreateStyles) {
  return /\bfieldGuide\b/.test(srcWithoutCreateStyles);
}

function hasUseThemeImport(src) {
  return /import\s+\{[^}]*\buseTheme\b[^}]*\}\s+from/.test(src);
}

function hasFieldGuideHookInBody(bodyLines) {
  return bodyLines.some((line) =>
    /\bconst\s+\{[^}]*\bfieldGuide\b[^}]*\}\s*=\s*useTheme\(\)/.test(line),
  );
}

function isComponentStart(line) {
  return (
    /^export default function \w+/.test(line) ||
    /^export function \w+/.test(line) ||
    /^export const \w+ = \([^)]*\) => \{/.test(line) ||
    /^export const \w+ = function/.test(line) ||
    /^function \w+\(/.test(line)
  );
}

function extractBody(lines, startIdx) {
  let depth = 0;
  let started = false;
  const bodyStart = startIdx;
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
    if (depth === 0) {
      return { bodyStart, bodyEnd: i, bodyLines: lines.slice(bodyStart + 1, i) };
    }
  }
  return null;
}

function bodyUsesFieldGuide(bodyLines) {
  return bodyLines.some(
    (line) =>
      /\bfieldGuide\b/.test(line) &&
      !line.includes('createStyles') &&
      !line.trim().startsWith('//'),
  );
}

function injectHookInComponents(src) {
  const lines = src.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isComponentStart(line.trim())) continue;

    const body = extractBody(lines, i);
    if (!body) continue;
    if (!bodyUsesFieldGuide(body.bodyLines)) continue;
    if (hasFieldGuideHookInBody(body.bodyLines)) continue;

    const insertAt = body.bodyStart + 1;
    const hookLine = '  const { fieldGuide } = useTheme();';
    const existing = lines[insertAt]?.trim() ?? '';
    if (existing === hookLine.trim()) continue;

    lines.splice(insertAt, 0, hookLine);
    changed = true;
    i = insertAt;
  }

  return changed ? lines.join('\n') : null;
}

function migrateFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (!IMPORT_RE.test(src)) return false;

  const withoutCreateStyles = stripCreateStylesBody(src);
  const needsHook = needsFieldGuideHook(withoutCreateStyles);

  src = src.replace(IMPORT_RE, '');

  if (needsHook) {
    const themePath = themeImportPath(filePath);
    if (!hasUseThemeImport(src)) {
      const useThemedImport = src.match(/import \{ useThemedStyles \} from ['"][^'"]+['"];/);
      if (useThemedImport) {
        src = src.replace(
          useThemedImport[0],
          `${useThemedImport[0]}\nimport { useTheme } from '${themePath}';`,
        );
      } else {
        const reactImport = src.match(/import React[^;]+;/);
        if (reactImport) {
          src = src.replace(
            reactImport[0],
            `${reactImport[0]}\nimport { useTheme } from '${themePath}';`,
          );
        } else {
          src = `import { useTheme } from '${themePath}';\n${src}`;
        }
      }
    }

    const injected = injectHookInComponents(src);
    if (injected) src = injected;
  }

  fs.writeFileSync(filePath, src, 'utf8');
  return true;
}

let count = 0;
for (const file of walk(ROOT)) {
  if (migrateFile(file)) {
    count += 1;
    console.log('migrated', path.relative(ROOT, file));
  }
}
console.log(`Done. Migrated ${count} files.`);
