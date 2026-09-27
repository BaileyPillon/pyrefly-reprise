// PR-0213 acceptance as a check (batch t1-b5): every index entry whose
// `asserted` names a screen must name the screen its own stale-root read saw,
// and an entry that claims "in battle" / "mid-fight" without naming one is
// flagged too (round 13's 23-midfight and 16b captures were pause frames
// asserted as "in battle"). Reads the runner's index.json (an array) or a
// round's index.jsonl. Both games: shared critic plumbing.
//
//   node critic/runner/lib/route-index.mjs <evidence>/index.json   (exit 1 on a mismatch)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseIndex(raw) {
  const text = String(raw).trim();
  if (!text) return [];
  return text.startsWith('[') ? JSON.parse(text) : text.split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

export function indexMismatches(items) {
  const out = [];
  for (const it of items) {
    const asserted = String(it.asserted ?? '');
    const actual = it.staleRoots?.screen;
    if (actual === undefined) continue;
    const m = /(?:^|\s)screen=([a-z0-9:_-]+)/i.exec(asserted);
    if (!m) {
      if (/in battle|mid-fight/i.test(asserted)) out.push({ file: it.file, asserted, staleScreen: actual, why: 'asserted names no screen' });
      continue;
    }
    if (m[1] !== actual) out.push({ file: it.file, asserted, staleScreen: actual, why: 'asserted screen differs from the stale-root read' });
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) throw new Error('usage: route-index.mjs <index.json|index.jsonl>');
  const items = parseIndex(fs.readFileSync(file, 'utf8'));
  const bad = indexMismatches(items);
  console.log(JSON.stringify({ items: items.length, unverified: items.filter((i) => i.verified === false).length, mismatches: bad }, null, 1));
  process.exit(bad.length ? 1 : 0);
}
