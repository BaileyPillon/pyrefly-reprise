// The tables in docs/plans/advisor-v4-method-check.md, from the runs in ./results/.
//
//   node critic/bench/advisor-v4/table.mjs [v4-prefix=v4f] [v3-prefix list]
//
// A chapter's v3 row is the `v3` driver from any results file that ran it on seeds 1..40 (the
// same tree, the same drive); its v4 row is every `v4` driver row under the v4 prefix, pooled by
// seed (a chapter may be split over files by seed range). Game case: both (a reading of the bench).

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = join(dirname(fileURLToPath(import.meta.url)), 'results');
const V4 = process.argv[2] ?? 'v4f';
const V4_OTHER = (process.argv[3] ?? '').split(',').filter(Boolean);

const ORDER = [
  ['seymour-flux', 'I', 'FFX'], ['yunalesca', 'II', 'FFX'], ['braskas-final-aeon', 'III', 'FFX'],
  ['ffx2-bahamut', 'IV', 'FFX-2'], ['ffx2-vegnagun-shuyin', 'V', 'FFX-2'], ['ffx2-leblanc', 'VI', 'FFX-2'],
  ['seymour-anima-macalania', 'VII', 'FFX'], ['evrae-airship', 'VIII', 'FFX'], ['yojimbo-cavern', 'IX', 'FFX'],
  ['seymour-natus', 'X', 'FFX'], ['ffx2-fallen-aeons', 'XI', 'FFX-2'], ['seymour-omnis', 'XII', 'FFX'],
  ['ffx2-trema', 'XIII', 'FFX-2'], ['isaaru-via-purifico', 'XIV', 'FFX'], ['ffx2-den-of-woe', 'XV', 'FFX-2'],
  ['ffx2-ixion-djose', 'XVI', 'FFX-2'],
];

const files = readdirSync(HERE).filter((f) => f.endsWith('.json')).map((f) => ({ f, d: JSON.parse(readFileSync(join(HERE, f), 'utf8')) }));

function rowsFor(chapter, driver, prefixes) {
  const out = [];
  for (const { f, d } of files) {
    if (!prefixes.some((p) => f.startsWith(p))) continue;
    for (const r of d.rows) if (r.chapterId === chapter && r.driver === driver) out.push({ ...r, first: d.first ?? 1, file: f });
  }
  return out;
}

/** Pool rows by seed range; returns null unless seeds 1..40 are covered exactly once. */
function pooled(rows) {
  const seen = new Set();
  const acc = { seeds: 0, wins: 0, winSeeds: [], decisions: 0, switched: 0, searched: 0, lethalMiss: 0, savable: 0, lethalThreat: 0, missedRevive: 0, dupStrict: 0, dupSame: 0, notOnMenu: 0, badAim: 0, p50: 0, p95: 0, p99: 0, max: 0, files: [] };
  for (const r of rows.sort((a, b) => a.first - b.first)) {
    const range = Array.from({ length: r.seeds }, (_, i) => r.first + i);
    if (range.some((s) => seen.has(s))) continue;
    range.forEach((s) => seen.add(s));
    acc.seeds += r.seeds;
    acc.wins += r.wins;
    acc.winSeeds.push(...r.winSeeds);
    for (const k of ['decisions', 'switched', 'searched', 'lethalMiss', 'savable', 'lethalThreat', 'missedRevive', 'dupStrict', 'dupSame', 'notOnMenu', 'badAim']) acc[k] += r[k] ?? 0;
    // Percentiles cannot be pooled exactly; the worst file's figure is quoted (an upper bound).
    acc.p50 = Math.max(acc.p50, r.msP50 ?? r.latencyP50 ?? 0);
    acc.p95 = Math.max(acc.p95, r.msP95 ?? r.latencyP95 ?? 0);
    acc.p99 = Math.max(acc.p99, r.msP99 ?? 0);
    acc.max = Math.max(acc.max, r.msMax ?? 0);
    acc.files.push(r.file);
  }
  return acc.seeds > 0 ? acc : null;
}

const pad = (x) => String(x);
const lines = [
  `| Chapter | Game | v3 wins | v4 wins | Seeds v4 won and v3 lost / the reverse | Lethal-save miss v3 → v4 | Missed revive v3 → v4 | Dup strict / same v3 → v4 | Not on menu / bad aim v4 | Switched / decisions | v4 ms p50 / p95 / p99 |`,
  '|---|---|---:|---:|---|---|---|---|---|---|---|',
];
let t3 = 0, t4 = 0, n = 0;
for (const [id, num, game] of ORDER) {
  const v3 = pooled(rowsFor(id, 'v3', ['run1-', 'v4c-', 'v3-', ...V4_OTHER]).filter((r) => r.first === 1 && r.seeds === 40));
  const v4 = pooled(rowsFor(id, 'v4', [V4 + '-']));
  if (!v3 || !v4) {
    lines.push(`| ${num} | ${game} | ${v3 ? `${v3.wins}/${v3.seeds}` : '—'} | ${v4 ? `${v4.wins}/${v4.seeds}` : '—'} | | | | | | | |`);
    continue;
  }
  const cover = new Set(Array.from({ length: v4.seeds }, (_, i) => i + 1));
  const v3w = new Set(v3.winSeeds.filter((s) => cover.has(s)));
  const v4w = new Set(v4.winSeeds);
  const gained = [...v4w].filter((s) => !v3w.has(s)).length;
  const lost = [...v3w].filter((s) => !v4w.has(s)).length;
  t3 += v3w.size; t4 += v4.wins; n += v4.seeds;
  // The v3 readings are totals over its 40 seeds: comparable only when v4 ran the same 40.
  const same = v4.seeds === v3.seeds;
  const from = (x) => (same ? `${x} → ` : '');
  const dup = game === 'FFX' ? 'n/a' : `${same ? `${v3.dupStrict} / ${v3.dupSame} → ` : ''}${v4.dupStrict} / ${v4.dupSame}`;
  lines.push(`| ${num} | ${game} | ${v3w.size}/${v4.seeds} | **${v4.wins}/${v4.seeds}** | +${gained} / −${lost} | ${from(v3.lethalMiss)}${v4.lethalMiss} | ${from(v3.missedRevive)}${v4.missedRevive} | ${dup} | ${v4.notOnMenu} / ${v4.badAim} | ${v4.switched} / ${v4.decisions} | ${v4.p50.toFixed(0)} / ${v4.p95.toFixed(0)} / ${v4.p99.toFixed(0)} |`);
}
lines.push(`| **All** | | **${t3}/${n}** | **${t4}/${n}** | | | | | | | |`);
console.log(lines.map(pad).join('\n'));
