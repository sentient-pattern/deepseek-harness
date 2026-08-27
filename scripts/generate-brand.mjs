#!/usr/bin/env node
// scripts/generate-brand.mjs — regenerates brand/brand.config.ts (+ .json) from brand.yaml.
// Dependency-free on purpose: runs with plain Node, no workspace install needed.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const yamlPath = join(root, "brand.yaml");
const outDir = join(root, "brand");

/** Minimal YAML-subset parser: 2-space indented maps, scalars, dash arrays. */
function parseYaml(text) {
  const lines = text.split('\n');
  const root = {};
  const stack = [{ indent: -1, node: root }];
  for (let i = 0; i < lines.length; i++) {
    const line = stripComment(lines[i]).replace(/\s+$/, '');
    if (line.trim() === '') continue;
    const indent = line.length - line.trimStart().length;
    const content = line.trim();
    if (content.startsWith('- ')) {
      const parent = stack[stack.length - 1];
      if (!Array.isArray(parent.node)) throw new Error('array item outside an array: ' + content);
      parent.node.push(parseScalar(content.slice(2).trim()));
      continue;
    }
    const m = content.match(/^([\w.-]+):(.*)$/);
    if (!m) throw new Error('cannot parse line: ' + content);
    const key = m[1];
    const rest = m[2].trim();
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1];
    if (Array.isArray(parent.node)) throw new Error('map entry inside an array: ' + content);
    if (rest === '') {
      const next = nextNonEmpty(lines, i + 1);
      const node = next !== null && next.trimStart().startsWith('- ') ? [] : {};
      parent.node[key] = node;
      stack.push({ indent, node });
    } else {
      parent.node[key] = parseScalar(rest);
    }
  }
  return root;
}
function nextNonEmpty(lines, from) {
  for (let i = from; i < lines.length; i++) if (lines[i].trim() !== '') return lines[i];
  return null;
}
function stripComment(line) {
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQ = !inQ;
    if (c === '#' && !inQ) return line.slice(0, i);
  }
  return line;
}
function parseScalar(s) {
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+$/.test(s)) return Number(s);
  return s;
}

/** Serialize a value as a TypeScript literal (for the generated .ts). */
function tsLiteral(value, depth) {
  const pad = '\t'.repeat(depth);
  const padIn = '\t'.repeat(depth + 1);
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '[\n' + value.map((v) => padIn + tsLiteral(v, depth + 1)).join(',\n') + '\n' + pad + ']';
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';
  return '{\n' + entries.map(([k, v]) => padIn + JSON.stringify(k) + ': ' + tsLiteral(v, depth + 1)).join(',\n') + '\n' + pad + '}';
}

const config = parseYaml(readFileSync(yamlPath, 'utf8'));
if (typeof config.version !== 'number') throw new Error('brand.yaml must carry a numeric version');
mkdirSync(outDir, { recursive: true });

const ts = [
  '// GENERATED from brand.yaml — do not edit by hand.',
  '// Rebrand workflow: edit brand.yaml, then run: node scripts/generate-brand.mjs',
  '// Every brand pointer in the codebase should import from this module.',
  '',
  'export const brand = ' + tsLiteral(config, 0) + ' as const;',
  '',
  '/** The complete brand configuration, typed from brand.yaml. */',
  'export type BrandConfig = typeof brand;',
  '',
  'export default brand;',
  ''
].join('\n');
writeFileSync(join(outDir, "brand.config.ts"), ts);
writeFileSync(join(outDir, "brand.config.json"), JSON.stringify(config, null, 2) + "\n");
console.log("regenerated brand/brand.config.ts and brand/brand.config.json");
