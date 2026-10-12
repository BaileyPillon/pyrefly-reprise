#!/usr/bin/env node
/**
 * SFX parity, the pack layout and the budget: where every planned original ships, at what quality, and whether the whole
 * set stays inside the audio budget that `tools/audio/qa.mjs` gates on (`AUDIO_BUDGET_BYTES`, 105 MB).
 *
 *   node tools/audio/sfx-parity-layout.mjs                    the plan for all 214 rows, against the shipped audio
 *   node tools/audio/sfx-parity-layout.mjs --repack 4000000    count a v2 repack that gives back 4 MB (sfx-parity-repack.mjs reports it)
 *   node tools/audio/sfx-parity-layout.mjs --wave 1,2          only the rows of those waves (the order the rule gives: core packs first)
 *   node tools/audio/sfx-parity-layout.mjs --reserve 1000000   keep 1 MB free under the budget
 *   node tools/audio/sfx-parity-layout.mjs --json plan.json    also write the plan
 *   node tools/audio/sfx-parity-layout.mjs --reachable-only     leave out the rows no chapter's build or foes carry (see below)
 *   node tools/audio/sfx-parity-layout.mjs --coverage           also list where each core row could be heard, and what could move to a boss pack
 *   node tools/audio/sfx-parity-layout.mjs --allow-over         print the plan but exit 0 when it does not fit
 *
 * Inputs: `docs/audio/sfx-parity-rows.json` (each row's pack and length), `public/audio/manifest.json` (what already ships)
 * and `src/audio/sfxV2/packs.ts` (which packs a chapter loads). The planner is `sfx-parity-layout-lib.mjs`: it applies the
 * levers in the order the accepted rule gives (the v2 repack, boss packs at q3, shorter long-tail rows, then a bigger budget)
 * and reports the ones that need Bailey's yes separately. It never cuts a row and never re-encodes anything: it plans. Exit 1 when
 * the set does not fit after the levers the rule lists, or a row sits in a pack no chapter loads.
 *
 * Two kinds of row are left out of the bytes: a held row (decision 52j) and a row still `open` (no battle moment answers it yet,
 * `eventCuesFfx*.ts`), because its original would never be heard. The coverage (`sfx-parity-coverage.mjs`) reads the game's data:
 * a row whose sound can be heard in a chapter that does not load its pack is a PROBLEM (it would be silent there), and a row no
 * chapter's build or foes carry is listed as unreachable today (the party-prep Sphere Grid may still reach it).
 *
 * Game case: both; every pack is one game's (named so) and the plan keeps them apart.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

// The coverage reads the game's data, whose modules need type transforms: run again with them if started without.
if (!process.execArgv.includes('--experimental-transform-types')) {
  const r = spawnSync(process.execPath, ['--experimental-transform-types', '--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

const { BOSS_PACKS, corePack } = await import('../../src/audio/sfxV2/packs.ts');
const { packBytes, planLayout, RATE_BPS } = await import('./sfx-parity-layout-lib.mjs');
const { FFX_UNHOOKED } = await import('../../src/audio/sfxV2/eventCuesFfx.ts');
const { FFX2_UNHOOKED } = await import('../../src/audio/sfxV2/eventCuesFfx2.ts');
const { AUDIO_BUDGET_BYTES } = await import('./manifest-io.mjs');
const { createCoverage } = await import('./sfx-parity-coverage.mjs');

const ROOT = new URL('../../', import.meta.url);
const args = process.argv.slice(2);
const has = (name) => args.includes(name);
const val = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const rowsFile = JSON.parse(readFileSync(new URL('docs/audio/sfx-parity-rows.json', ROOT), 'utf8'));
const manifestUrl = new URL('public/audio/manifest.json', ROOT);
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'));

const waves = val('--wave')?.split(',').map(Number);
const open = new Set([...Object.entries(FFX_UNHOOKED), ...Object.entries(FFX2_UNHOOKED)].filter(([, v]) => v.kind === 'open').map(([id]) => id));
const cov = createCoverage();
const planned = rowsFile.rows.filter((r) => r.pack && r.secs > 0 && !open.has(r.id) && (!waves || waves.includes(r.wave)));
const unreachable = planned.filter((r) => cov.rowChapters(r.id).size === 0);
const rows = planned
  .filter((r) => !has('--reachable-only') || !unreachable.includes(r))
  .map((r) => ({ id: r.id, pack: r.pack, secs: r.secs, game: r.game }));
const notPlanned = rowsFile.rows.filter((r) => open.has(r.id) && r.secs > 0 && (!waves || waves.includes(r.wave)));

// A pack the chapters never load would be fetched by nobody: say so (a row in it would never be heard).
const loadable = new Set(['ffx', 'ffx2'].map(corePack));
for (const packs of Object.values(BOSS_PACKS)) for (const p of packs) loadable.add(p);
const unloaded = [...new Set(rows.map((r) => r.pack))].filter((p) => !loadable.has(p));

const music = Object.values(manifest.music).reduce((s, e) => s + (e.bytes ?? 0), 0);
const shipped =
  music + (manifest.sfx?.bytes ?? 0) + (manifest.sfxV2?.bytes ?? 0) + statSync(manifestUrl).size;
// Parity packs already installed are part of the plan, not of what ships besides it.
const installed = Object.values(manifest.sfxParity?.packs ?? {}).reduce((s, p) => s + (p.bytes ?? 0), 0);

const plan = planLayout({
  rows,
  budgetBytes: AUDIO_BUDGET_BYTES,
  shippedBytes: shipped,
  repackSavingBytes: Number(val('--repack') ?? 0),
  reserveBytes: Number(val('--reserve') ?? 0),
});
// A row whose sound can be heard where its pack is not loaded would be silent there.
for (const r of planned) {
  const heard = cov.rowChapters(r.id);
  const loaded = cov.packChapters(r.pack);
  const gap = [...heard].filter((c) => !loaded.has(c));
  if (gap.length > 0) plan.problems.push(`${r.id} (${r.pack}) can be heard in ${gap.join(', ')}, which does not load ${r.pack}: move the row to the game's core pack or load the pack there`);
}
for (const p of unloaded) plan.problems.push(`${p} holds ${rows.filter((r) => r.pack === p).length} row(s) but no chapter loads it (packs.ts): they would never be heard`);

const mb = (b) => `${(b / 1e6).toFixed(2)} MB`;
console.log(`shipped audio besides the parity packs: ${mb(shipped)} of the ${mb(AUDIO_BUDGET_BYTES)} budget (music ${mb(music)}, sprites ${mb((manifest.sfx?.bytes ?? 0) + (manifest.sfxV2?.bytes ?? 0))})${installed ? `; ${mb(installed)} of parity packs are already installed` : ''}`);
console.log(`the packs may cost ${mb(plan.allowanceBytes)}${Number(val('--repack') ?? 0) > 0 ? ' (counting the v2 repack)' : ''}; V0 is ${(RATE_BPS.V0 / 1000).toFixed(1)} KB/s, q3 ${(RATE_BPS.q3 / 1000).toFixed(1)} KB/s, q5 ${(RATE_BPS.q5 / 1000).toFixed(1)} KB/s`);
console.log('');
console.log('pack'.padEnd(18) + 'kind'.padEnd(6) + 'cues'.padStart(5) + 'secs'.padStart(8) + '  quality' + '    bytes'.padStart(12) + '   at V0'.padStart(10));
for (const p of plan.packs) {
  console.log(p.pack.padEnd(18) + p.kind.padEnd(6) + String(p.cues).padStart(5) + p.seconds.toFixed(1).padStart(8) + `  ${p.quality}`.padEnd(9) + mb(p.bytes).padStart(11) + mb(packBytes(p.seconds, p.cues, 'V0')).padStart(10));
}
console.log(`total ${mb(plan.packBytes)}; headroom ${(plan.headroomBytes / 1e6).toFixed(2)} MB; ${plan.fits ? 'FITS after the levers the rule lists' : 'DOES NOT FIT after the levers the rule lists'}`);
console.log('');
for (const l of plan.levers) console.log(`lever ${l.lever}${l.needsYes ? ' (needs a yes)' : ''}: ${l.what}${l.savedBytes ? ` (saves ${mb(l.savedBytes)})` : ''}`);
if (plan.trimCandidates.length > 0) {
  console.log('');
  console.log('rows to shorten (lever 2):');
  for (const t of plan.trimCandidates) console.log(`  ${t.row.padEnd(26)} ${t.pack.padEnd(15)} ${t.secs} s -> ${t.cutTo} s (saves ${mb(t.savedBytes)})`);
}
console.log('');
console.log(`not planned until a battle moment answers them (open): ${notPlanned.length} row(s), ${notPlanned.reduce((a, r) => a + r.secs, 0).toFixed(1)} s: ${notPlanned.map((r) => r.id).join(', ')}`);
if (unreachable.length > 0) {
  console.log(`no chapter's build or foes carry the ability of ${unreachable.length} planned row(s) (${unreachable.reduce((a, r) => a + r.secs, 0).toFixed(1)} s; only the party-prep Sphere Grid could reach them): ${unreachable.map((r) => r.id).join(', ')}${has('--reachable-only') ? ' (left out of the plan)' : ' (--reachable-only leaves them out)'}`);
}
if (has('--coverage')) {
  console.log('');
  console.log('core rows heard in only some chapters (could move to a pack those chapters load):');
  for (const r of planned.filter((x) => /-core$/.test(x.pack))) {
    const heard = cov.rowChapters(r.id);
    const total = cov.facts.filter((c) => c.game === (r.id.startsWith('ffx2.') ? 'ffx2' : 'ffx')).length;
    if (heard.size > 0 && heard.size < total) console.log(`  ${r.id.padEnd(28)} ${r.secs} s  ${[...heard].join(', ')}`);
  }
}
for (const p of plan.problems) console.log(`PROBLEM: ${p}`);
if (val('--json')) writeFileSync(val('--json'), `${JSON.stringify(plan, null, 1)}\n`);
if (!plan.fits || plan.problems.length > 0) process.exit(has('--allow-over') ? 0 : 1);
