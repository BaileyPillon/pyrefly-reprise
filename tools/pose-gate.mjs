#!/usr/bin/env node
/**
 * **The pose gate** (pose continuity, W1; both games): no character painting ships without a fresh pose record or a waiver that carries Bailey's own words.
 * Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for this please."
 *
 *   node tools/pose-gate.mjs --check                       judge every painting of public/art; exit 1 on any failure, one line per failure
 *   node tools/pose-gate.mjs --check --art D:/art-mirror --subjects dark-sandy,valefor
 *   node tools/pose-gate.mjs --check --dist dist-release   also: every character painting the build ships is one the gate read and passed
 *   node tools/pose-gate.mjs --check --base origin/main    also: the ledger gained no legacy row since that ref (a ref git cannot read FAILS: `ledger-base`)
 *   node tools/pose-gate.mjs --report [--full] [--out F]   the census as JSON (the critic's static check and the artifact record read it)
 *   node tools/pose-gate.mjs --prune-legacy [--dry]       remove the legacy waiver rows (and their seal entries) of the paintings that are in band now; prints the seal's new digest to pin
 *                                                          (`LEGACY_SEAL_DIGEST` in tools/pose-gate-ledger.mjs). Rows are only ever removed, never added. Run `node tools/posescale/pose-stamp.mjs` after.
 *   node tools/pose-gate.mjs --check --rigs auto|<dir>     also: a pose a rig the RIG gate says ok serves is reported `rigged` (the painting stays the fallback; a failing row still fails). --rigs-mode stamp|full
 *   node tools/pose-gate.mjs --write-legacy [--dry] [--except a,b] [--date YYYY-MM-DD]
 *                                                          write docs/target/pose-waivers.json ONCE: a legacy row for every painting that is out of band now.
 *                                                          Refuses when the ledger exists. Run it after `measure.py table` has registered what is to be
 *                                                          registered (anything still flagged is waived "as live r50.1"); --except leaves subjects out.
 *
 * What it checks and the failure codes are in `tools/pose-gate-lib.mjs`; the waiver ledger and its ratchet in `tools/pose-gate-ledger.mjs`; the bands in
 * `tools/posescale/pose-bands.mjs`; the one model of how the game draws a painting in `tools/posescale/pose-model.mjs`. Run it at the end of an install
 * (`tools/art-install.mjs`), in `npm test` (tests/unit/tools/pose-gate-art.test.ts) and in the deploy's preflight (`tools/deploy-pages.mjs`, not covered by
 * `--owner-override`). About a minute for the 1,106 paintings of the r50 art.
 *
 * Exit: 0 pass, 1 the gate refuses, 2 usage, an art folder with no character paintings, a --dist that is not a build folder, or the ledger exists for --write-legacy.
 * A painting that does not decode is a failure of its subject (`unreadable`), never a crash and never a pass.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import {
  ROOT, censusReport, checkBuilt, countByCode, formatFailure, legacyPaintings, listBuiltPaintings, runGate,
} from './pose-gate-lib.mjs';
import { loadModelInputs } from './posescale/pose-model.mjs';
import { STAMP_FIELDS } from './posescale/pose-stamp-lib.mjs';
import { LEDGER_PATH, buildLegacyLedger, loadLedger, pruneLegacyLedger, waiverKey, writeNewLedger, writePrunedLedger } from './pose-gate-ledger.mjs';
import { DEFAULT_RIGS_ROOT } from './rig/rig-format.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const get = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const list = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : undefined);
const root = resolve(get('--root', ROOT));
const artDir = get('--art') ? resolve(get('--art')) : undefined;
const subjects = list(get('--subjects'));
// --rigs <dir> (or `auto`: PYREFLY_RIGS_DIR or D:/pyrefly-art-rigs when it exists): a pose a gate-ok rig serves is reported `rigged`; --rigs-mode stamp skips running the rig gate again
const rigs = get('--rigs') ? { dir: get('--rigs') === 'auto' ? DEFAULT_RIGS_ROOT : resolve(get('--rigs')), mode: get('--rigs-mode', 'full') } : undefined;

function progress() {
  let n = 0;
  return (s) => {
    n++;
    if (!flag('--quiet') && n % 25 === 0) process.stderr.write(`  pose-gate: ${n} subjects read (${s})\n`);
  };
}

async function census() {
  return runGate({ root, artDir, subjects, baseRef: get('--base'), onSubject: progress(), rigs });
}

async function check() {
  const t0 = Date.now();
  const result = await census();
  const failures = [...result.failures];
  if (get('--dist')) {
    if (subjects) { console.error('pose-gate: --dist needs the whole art folder, not --subjects'); return 2; }
    if (!existsSync(join(resolve(get('--dist')), 'art'))) { console.error(`pose-gate: ${resolve(get('--dist'))} has no art/ folder (is --dist a build folder, like dist-release?)`); return 2; }
    const built = listBuiltPaintings(resolve(get('--dist')));
    failures.push(...checkBuilt(built, result));
    console.log(`pose-gate: the build holds ${built.length} character paintings`);
  }
  if (!result.paintings && !failures.length) { console.error('pose-gate: no character paintings found (is --art the art folder, with characters/ in it?)'); return 2; }
  const t = result.entries.reduce((m, e) => ((m[e.outcome] = (m[e.outcome] ?? 0) + 1), m), {});
  console.log(`pose-gate: ${result.paintings} paintings of ${result.subjects} subjects: ${t.pass ?? 0} pass, ${t.waived ?? 0} waived${rigs ? `, ${t.rigged ?? 0} rigged` : ''}, ${t.exempt ?? 0} exempt, ${t.fail ?? 0} fail; ledger ${result.ledger.exists ? `${result.ledger.rows} row(s) (${result.ledger.legacy} legacy, ${result.ledger.bailey} Bailey's; compared with ${result.ledger.base === 'ref' ? get('--base') : result.ledger.base === 'absent' ? `${get('--base')} (no ledger there yet)` : 'no base ref, the pinned seal only'})` : 'absent'}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (flag('--verbose')) for (const n of result.notes) console.log(`note  ${n.subject ? `${n.subject}/${n.pose}  ` : ''}${n.message}`);
  const max = Number(get('--max', Infinity));
  failures.slice(0, max).forEach((x) => console.log(`FAIL  ${formatFailure(x)}`));
  if (failures.length > max) console.log(`... and ${failures.length - max} more (drop --max to see them all)`);
  if (failures.length) {
    const by = Object.entries(countByCode(failures)).map(([c, n]) => `${n} ${c}`).join(', ');
    console.log(`pose-gate: FAIL, ${failures.length} failure(s): ${by}`);
    return 1;
  }
  console.log('pose-gate: PASS');
  return 0;
}

async function report() {
  const result = await census();
  const text = `${JSON.stringify(censusReport(result, { full: flag('--full') }), null, 1)}\n`;
  if (get('--out')) {
    mkdirSync(dirname(resolve(get('--out'))), { recursive: true });
    writeFileSync(resolve(get('--out')), text);
    console.error(`pose-gate: census of ${result.paintings} paintings written to ${get('--out')}`);
  } else process.stdout.write(text);
  return 0;
}

async function writeLegacy() {
  const L = loadLedger(root);
  if (L.exists) { console.error(`pose-gate: ${LEDGER_PATH} exists already. The legacy rows are written once; remove a legacy row by editing the file, and a new waiver needs Bailey's own quoted words.`); return 2; }
  const result = await runGate({ root, artDir, subjects, ledger: null, onSubject: progress() });
  const rows = legacyPaintings(result, { except: list(get('--except')) ?? [] });
  const date = get('--date', new Date().toISOString().slice(0, 10));
  const bySubject = {};
  for (const r of rows) (bySubject[r.subject] ??= []).push(`${r.pose}[${r.flags.join('+')}]`);
  for (const [s, ps] of Object.entries(bySubject)) console.log(`  ${s}: ${ps.join(' ')}`);
  console.log(`pose-gate: ${rows.length} legacy waiver row(s) over ${Object.keys(bySubject).length} subjects out of ${result.paintings} paintings (${result.entries.filter((e) => e.outcome === 'exempt').length} exempt)`);
  if (flag('--dry')) { console.log('pose-gate: --dry, nothing written'); return 0; }
  const path = writeNewLedger(root, buildLegacyLedger(rows, date));
  console.log(`pose-gate: wrote ${path}. Next: node tools/posescale/measure.py table (the table carries a waived row from each), then node tools/pose-gate.mjs --check.`);
  return 0;
}

async function pruneLegacy() {
  const L = loadLedger(root);
  if (!L.exists || !L.ledger) { console.error(`pose-gate: ${LEDGER_PATH} ${L.error ?? 'does not exist'}: nothing to prune`); return 2; }
  if (subjects) { console.error('pose-gate: --prune-legacy reads every painting; drop --subjects'); return 2; }
  const result = await runGate({ root, artDir, ledger: null, onSubject: progress() });
  const stillOut = new Set(legacyPaintings(result).map((p) => waiverKey(p.subject, p.pose, p.sha)));
  // a painting registered by its waiver alone (Evrae's far paintings, the Sin fins' far-range ones: no record, no base row) is not "in band", it is unregistered by design: its row stays
  const inp = await loadModelInputs({ root, artDir });
  const registeredOtherwise = (s, p) => {
    const row = inp.table[s]?.[p];
    const rec = inp.records.subjects?.[s]?.poses?.[p];
    return (!!row && Object.keys(row).some((k) => !STAMP_FIELDS.includes(k))) || (!!rec && !rec.skip);
  };
  for (const r of L.ledger.rows) if (r.legacy === true && !registeredOtherwise(r.subject, r.pose)) stillOut.add(waiverKey(r.subject, r.pose, r.sha));
  const { ledger, removed, digest } = pruneLegacyLedger(L.ledger, stillOut);
  const bySubject = {};
  for (const r of removed) (bySubject[r.subject] ??= []).push(r.pose);
  for (const [s, ps] of Object.entries(bySubject)) console.log(`  removed ${s}: ${ps.join(' ')}`);
  console.log(`pose-gate: ${removed.length} legacy waiver row(s) removed (in band now), ${ledger.rows.length} left; the seal has ${ledger.legacySeal.length} entries, digest ${digest}`);
  if (flag('--dry')) { console.log('pose-gate: --dry, nothing written'); return 0; }
  writePrunedLedger(root, ledger);
  console.log(`pose-gate: wrote ${LEDGER_PATH}. Next: set LEGACY_SEAL_DIGEST = '${digest}' in tools/pose-gate-ledger.mjs, then node tools/posescale/pose-stamp.mjs, then node tools/pose-gate.mjs --check.`);
  return 0;
}

const modes = ['--check', '--report', '--write-legacy', '--prune-legacy'].filter(flag);
if (modes.length !== 1) {
  console.error('usage: node tools/pose-gate.mjs --check | --report | --write-legacy | --prune-legacy  [--art DIR] [--root DIR] [--subjects a,b] [--dist DIR] [--base REF]  (see the header of tools/pose-gate.mjs)');
  process.exit(2);
}
const code = await ({ '--check': check, '--report': report, '--write-legacy': writeLegacy, '--prune-legacy': pruneLegacy }[modes[0]])();
process.exitCode = code;
