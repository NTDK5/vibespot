/**
 * Inject `const { fieldGuide } = useTheme();` into React components that
 * reference fieldGuide in JSX/logic but lack the hook call.
 * Skips createStyles(), helpers that receive fieldGuide as a param, and core theme files.
 */
import fs from 'fs';
import path from 'path';

const SRC = path.resolve('src');
const SKIP = new Set([
  'fieldGuide.js',
  'fieldGuideThemes.js',
  'ThemeContext.js',
  'spotHelpers.js',
  'useThemedStyles.js',
]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

function findMatchingBrace(source, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const FN_START =
  /^(export\s+default\s+function\s+\w*|export\s+const\s+\w+\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*|function\s+\w+\s*\([^)]*\))\s*\{/gm;

function needsFieldGuideHook(body) {
  if (!/\bfieldGuide\b/.test(body)) return false;
  if (/const\s*\{[^}]*fieldGuide[^}]*\}\s*=\s*useTheme\s*\(\)/.test(body)) return false;
  if (/function\s+\w*\([^)]*\bfieldGuide\b/.test(body)) return false;
  if (/\(\s*\{[^}]*fieldGuide[^}]*\}\s*\)/.test(body.split('\n')[0] || '')) return false;
  return /\bfieldGuide\.[a-zA-Z]/.test(body);
}

function destructureFromBody(body) {
  const keys = ['fieldGuide'];
  if (/\bisDark\b/.test(body)) keys.push('isDark');
  return keys.join(', ');
}

function ensureUseThemeImport(source) {
  if (source.includes("from '../context/ThemeContext'") || source.includes('from "../../context/ThemeContext"')) {
    if (!source.includes('useTheme')) {
      return source.replace(
        /import \{([^}]+)\} from '(\.\.\/)+context\/ThemeContext';/,
        (m, imports, prefix) => {
          const trimmed = imports.trim();
          if (trimmed.includes('useTheme')) return m;
          return `import { ${trimmed}, useTheme } from '${prefix}context/ThemeContext';`;
        },
      );
    }
    return source;
  }
  if (source.includes('useTheme')) return source;
  const depth = (source.match(/from '\.\.\//) || [''])[0].split('../').length - 1;
  const rel = '../'.repeat(Math.max(2, depth)) + 'context/ThemeContext';
  const importLine = `import { useTheme } from '${rel.replace(/\.\.\/\.\.\/\.\.\/\.\.\//, '../../../')}';`;
  const lastImport = source.lastIndexOf('\nimport ');
  if (lastImport === -1) return `${importLine}\n${source}`;
  const end = source.indexOf('\n', lastImport + 1);
  return source.slice(0, end + 1) + importLine + '\n' + source.slice(end + 1);
}

let changed = 0;

for (const file of walk(SRC)) {
  if (SKIP.has(path.basename(file))) continue;
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes('fieldGuide')) continue;

  let modified = false;
  const inserts = [];

  FN_START.lastIndex = 0;
  let match;
  while ((match = FN_START.exec(source)) !== null) {
    const openBrace = match.index + match[0].length - 1;
    const closeBrace = findMatchingBrace(source, openBrace);
    if (closeBrace === -1) continue;

    let body = source.slice(openBrace + 1, closeBrace);
    // Ignore nested createStyles at module level inside component? Unlikely.
    // Strip inner function createStyles blocks for detection only
    const bodyForCheck = body.replace(/function createStyles\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g, '');

    if (!needsFieldGuideHook(bodyForCheck)) continue;

    const hookLine = `  const { ${destructureFromBody(bodyForCheck)} } = useTheme();\n`;
    if (body.includes(hookLine.trim())) continue;

    // Insert after opening brace, before existing hooks/styles
    const insertAt = openBrace + 1;
    inserts.push({ insertAt, hookLine });
  }

  if (inserts.length === 0) continue;

  // Apply inserts from end to start to preserve indices
  inserts.sort((a, b) => b.insertAt - a.insertAt);
  for (const { insertAt, hookLine } of inserts) {
    source = source.slice(0, insertAt + 1) + '\n' + hookLine + source.slice(insertAt + 1);
    modified = true;
  }

  if (modified) {
    source = ensureUseThemeImport(source);
    fs.writeFileSync(file, source);
    changed++;
    console.log('fixed:', path.relative(process.cwd(), file), `(${inserts.length} hooks)`);
  }
}

console.log(`\nTotal files updated: ${changed}`);
