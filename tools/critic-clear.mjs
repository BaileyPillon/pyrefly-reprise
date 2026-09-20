#!/usr/bin/env node
/**
 * node tools/critic-clear.mjs --report <critic report .json>
 *
 * The only way a review obligation gets settled. A reviewer never deletes a
 * marker: it writes its report and runs this, and the code decides what that
 * report is allowed to settle (critic policy v2):
 *
 *   - an invalid report settles nothing (exit 1 and the errors);
 *   - a report for another build settles nothing: an old score cannot certify
 *     a new build;
 *   - a focused or live report never settles a deep review;
 *   - an UNVERIFIED verdict settles nothing: missing evidence stays pending.
 *
 * A report for a build that is not deployed yet (a candidate review made
 * before the deploy) is validated and kept; `applyStoredReports` applies it
 * when `tools/deploy-pages.mjs` writes that build's marker. When a deep or
 * milestone review is settled the ledger's "since the last deep review"
 * counters restart. Fully settled markers move to critic/cleared/.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { allSettled, applyReport, archiveMarker, pendingMarkerPath, writePendingMarker } from './critic-pending.mjs';
import { readLedger, writeLedger } from './critic-plan.mjs';
import { loadPolicy, validateReport } from './critic-policy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Validate one report and apply it to its build's marker, if that build has one. */
export function clearWithReport(root, reportPath) {
  const policy = loadPolicy(root);
  const pendingDir = join(root, 'critic', 'pending');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const errors = validateReport(report, policy);
  if (errors.length) return { ok: false, errors, settled: [], refused: [] };
  const name = relative(root, reportPath).replace(/\\/g, '/');
  const file = existsSync(pendingDir)
    ? readdirSync(pendingDir).filter((f) => f.endsWith('.json')).find((f) => {
      const sha = f.replace(/\.json$/, '');
      return report.build.mainSha.startsWith(sha) || sha.startsWith(report.build.mainSha);
    })
    : null;
  if (!file) return { ok: true, errors: [], settled: [], refused: [], note: `no pending marker for build ${report.build.mainSha}: kept as candidate evidence` };
  const marker = JSON.parse(readFileSync(join(pendingDir, file), 'utf8'));
  const { marker: next, settled, refused } = applyReport(marker, report, name);
  if (settled.length) {
    writePendingMarker(pendingDir, next);
    if (settled.some((s) => s.kind === 'deep' || s.kind === 'milestone')) {
      const ledger = readLedger(root, policy);
      writeLedger(root, { ...ledger, lastDeep: { sha: marker.mainSha, date: report.date, source: name }, deploysSinceDeep: [] });
    }
    if (allSettled(next)) archiveMarker(pendingDir, join(root, 'critic', 'cleared'), next);
  }
  return { ok: true, errors: [], settled, refused, archived: allSettled(next) };
}

/** Apply every stored report that names this build. Called by the deploy once the marker exists. */
export function applyStoredReports(root, mainSha) {
  const results = [];
  for (const dir of ['critic/reviews', 'critic/rounds']) {
    const full = join(root, dir);
    if (!existsSync(full)) continue;
    for (const f of readdirSync(full).filter((n) => n.endsWith('.json')).sort()) {
      if (!existsSync(pendingMarkerPath(join(root, 'critic', 'pending'), mainSha))) return results;
      let sha = null;
      try { sha = JSON.parse(readFileSync(join(full, f), 'utf8')).build?.mainSha ?? null; } catch { /* unreadable reports are the status tool's business */ }
      if (sha && (sha.startsWith(mainSha) || mainSha.startsWith(sha))) results.push({ report: `${dir}/${f}`, ...clearWithReport(root, join(full, f)) });
    }
  }
  return results;
}

function main(argv) {
  const i = argv.indexOf('--report');
  if (i < 0 || !argv[i + 1]) { console.log('usage: node tools/critic-clear.mjs --report <report.json>'); process.exitCode = 64; return; }
  const r = clearWithReport(ROOT, resolve(argv[i + 1]));
  if (!r.ok) {
    console.log('critic:clear REFUSED: the report is not valid evidence, nothing was settled');
    for (const e of r.errors) console.log(`  - ${e}`);
    process.exitCode = 1;
    return;
  }
  if (r.note) console.log(`critic:clear ${r.note}`);
  for (const s of r.settled) console.log(`  settled ${s.kind}: ${s.result}`);
  for (const x of r.refused) console.log(`  still pending ${x.kind}: ${x.why}`);
  if (r.archived) console.log('  every obligation for this build is settled; marker moved to critic/cleared/');
  process.exitCode = r.refused.length ? 2 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
