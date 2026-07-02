#!/usr/bin/env node
/**
 * Remove erroneous `const { fieldGuide } = useTheme()` injected inside createStyles().
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');

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
      if (depth === 1) bodyStart = i + 1;
    }
    if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        const body = src.slice(bodyStart, i);
        const cleaned = body.replace(
          /\r?\n\s*const \{ fieldGuide \} = useTheme\(\);\r?\n/g,
          '\n',
        );
        if (cleaned === body) return false;
        src = src.slice(0, bodyStart) + cleaned + src.slice(i);
        fs.writeFileSync(filePath, src, 'utf8');
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
