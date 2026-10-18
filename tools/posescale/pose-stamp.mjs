#!/usr/bin/env node
/**
 * **Stamp the registration tables with what the install says about each painting** (pose continuity, W1; both games). The last step of
 * `measure.py table` and of `tools/exp-install.mjs`; run it by hand after a ledger change. Bailey, 2026-10-16: "pose continuity is the strongest recurring
 * issue we need a permanent fix for this please."
 *
 *   node tools/posescale/pose-stamp.mjs [--art DIR] [--root DIR] [--subjects a,b] [--dry]
 *
 * Reads every painting of the art folder (`--art`, else `PYREFLY_ART_DIR`, else `public/art`) with the one pose model, and writes each registered painting's
 * `status`, `class`, `stature`, `headReal`, `lengthRatio`, `iou` and `sha` into `src/data/art/poseRegistration*.ts` (see `pose-stamp-lib.mjs` for which paintings
 * count as registered and how `waived` comes only from `docs/target/pose-waivers.json`). It writes nothing into the art folder. About a minute for the r50 art.
 * `--subjects` stamps only those subjects and leaves every other row exactly as it is.
 */
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadLedger, waiverKey } from '../pose-gate-ledger.mjs';
import { listSubjects, loadModelInputs, readSubject } from './pose-model.mjs';
import { applyStamps, computeStamps, readTables, writeTables } from './pose-stamp-lib.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/**
 * Stamp the tables of `root`.
 * @param {{root?: string, artDir?: string, subjects?: string[], dry?: boolean, concurrency?: number, log?: (s: string) => void}} o
 * @returns {Promise<{stamped: number, added: number, updated: number, byStatus: Record<string, number>, unreadable: string[], changed: string[]}>}
 */
export async function stampTables({ root = ROOT, artDir, subjects, dry = false, concurrency = 3, log = console.log } = {}) {
  const inputs = await loadModelInputs({ root, artDir });
  const L = loadLedger(root);
  const waivers = new Map((L.ledger?.rows ?? []).map((r) => [waiverKey(r.subject, r.pose, r.sha), r]));
  const all = listSubjects(inputs);
  const wanted = subjects ?? all;
  for (const s of wanted) if (!all.includes(s)) throw new Error(`pose-stamp: no characters/${s} folder under ${inputs.artDir}`);
  const readings = [];
  const unreadable = [];
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= wanted.length) return;
      try { readings.push(...(await readSubject(inputs, wanted[i]))); } catch (e) { unreadable.push(`${wanted[i]}: ${e instanceof Error ? e.message : String(e)}`); }
      inputs.refs.delete(wanted[i]);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  readings.sort((a, b) => (a.subject + a.pose < b.subject + b.pose ? -1 : 1));
  const stamps = computeStamps(readings, inputs, inputs.records, waivers);
  const tables = readTables(root);
  const { changed, added, updated } = applyStamps(tables, stamps, { only: subjects ? new Set(subjects) : undefined });
  const byStatus = {};
  for (const s of stamps) byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
  if (!dry && changed.size) writeTables(root, tables, changed);
  log(`pose-stamp: ${readings.length} paintings of ${wanted.length} subjects read, ${stamps.length} stamped (${JSON.stringify(byStatus)}), ${added} row(s) added, ${updated} updated${dry ? ' (--dry: nothing written)' : `; wrote ${[...changed].join(', ') || 'nothing (already current)'}`}${unreadable.length ? `; ${unreadable.length} subject(s) unreadable` : ''}`);
  for (const u of unreadable) log(`pose-stamp: unreadable  ${u}`);
  return { stamped: stamps.length, added, updated, byStatus, unreadable, changed: [...changed] };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const argv = process.argv.slice(2);
  const get = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
  const art = get('--art', process.env.PYREFLY_ART_DIR);
  try {
    const r = await stampTables({ root: resolve(get('--root', ROOT)), artDir: art ? resolve(art) : undefined, subjects: get('--subjects')?.split(',').filter(Boolean), dry: argv.includes('--dry') });
    process.exitCode = r.unreadable.length ? 1 : 0;
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 2;
  }
}
