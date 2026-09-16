/**
 * Find source modules that nothing imports.
 *
 * This project has twice shipped a complete, tested subsystem that no other
 * module ever called (the battle ability registries; the whole Ink & Gold
 * presentation layer). A green test suite does not catch that, because the
 * tests import the module directly. This does.
 *
 * A module is "reachable" if it is transitively imported from an entry point.
 * Test files are deliberately NOT entry points — a module whose only importer
 * is its own unit test is exactly the failure we are hunting.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve('src');
const ENTRIES = ['src/main.ts'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const norm = (p) => relative(process.cwd(), p).replace(/\\/g, '/');

/** Static imports, re-exports and dynamic import() specifiers. */
const SPEC = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;

function importsOf(file) {
  const src = readFileSync(file, 'utf8');
  const out = new Set();
  for (const m of src.matchAll(SPEC)) {
    const spec = m[1];
    if (!spec.startsWith('.')) continue;
    const abs = resolve(dirname(file), spec);
    for (const cand of [abs, abs.replace(/\.ts$/, '') + '.ts', join(abs, 'index.ts')]) {
      if (files.includes(cand)) { out.add(cand); break; }
    }
  }
  // import.meta.glob('../../data/*/enemies/*.ts') — a real edge in this codebase.
  for (const m of src.matchAll(/import\.meta\.glob\(\s*['"]([^'"]+)['"]/g)) {
    const rx = new RegExp('^' + resolve(dirname(file), m[1]).replace(/\\/g, '/')
      .replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '.*').replace(/(?<!\.)\*/g, '[^/]*') + '$');
    for (const f of files) if (rx.test(f.replace(/\\/g, '/'))) out.add(f);
  }
  return [...out];
}

const graph = new Map(files.map((f) => [f, importsOf(f)]));
const seen = new Set();
const queue = ENTRIES.map((e) => resolve(e)).filter((e) => files.includes(e));
while (queue.length) {
  const f = queue.pop();
  if (seen.has(f)) continue;
  seen.add(f);
  for (const dep of graph.get(f) ?? []) if (!seen.has(dep)) queue.push(dep);
}

const orphans = files.filter((f) => !seen.has(f));
const byDir = new Map();
for (const o of orphans) {
  const d = dirname(norm(o));
  if (!byDir.has(d)) byDir.set(d, []);
  byDir.get(d).push(norm(o).split('/').pop());
}

console.log(`${files.length} modules, ${seen.size} reachable from ${ENTRIES.join(', ')}, ${orphans.length} orphaned\n`);
for (const [d, names] of [...byDir].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${String(names.length).padStart(3)}  ${d}/`);
  console.log(`     ${names.sort().join(', ')}`);
}
