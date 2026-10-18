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
import { LEDGER_PATH, buildLegacyLedger, loadLedger, writeNewLedger } from './pose-gate-ledger.mjs';

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

function progress() {
  let n = 0;
  return (s) => {
    n++;
    if (!flag('--quiet') && n % 25 === 0) process.stderr.write(`  pose-gate: ${n} subjects read (${s})\n`);
  };
}

async function census() {
  return runGate({ root, artDir, subjects, baseRef: get('--base'), onSubject: progress() });
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
  console.log(`pose-gate: ${result.paintings} paintings of ${result.subjects} subjects: ${t.pass ?? 0} pass, ${t.waived ?? 0} waived, ${t.exempt ?? 0} exempt, ${t.fail ?? 0} fail; ledger ${result.ledger.exists ? `${result.ledger.rows} row(s) (${result.ledger.legacy} legacy, ${result.ledger.bailey} Bailey's; compared with ${result.ledger.base === 'ref' ? get('--base') : result.ledger.base === 'absent' ? `${get('--base')} (no ledger there yet)` : 'no base ref, the pinned seal only'})` : 'absent'}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
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

const modes = ['--check', '--report', '--write-legacy'].filter(flag);
if (modes.length !== 1) {
  console.error('usage: node tools/pose-gate.mjs --check | --report | --write-legacy  [--art DIR] [--root DIR] [--subjects a,b] [--dist DIR] [--base REF]  (see the header of tools/pose-gate.mjs)');
  process.exit(2);
}
const code = await ({ '--check': check, '--report': report, '--write-legacy': writeLegacy }[modes[0]])();
process.exitCode = code;
