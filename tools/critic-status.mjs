#!/usr/bin/env node
/**
 * node tools/critic-status.mjs
 *
 * What every live build still owes the critic, and what the last full score
 * really certifies (critic policy v2, critic/RUBRIC.md):
 *
 *   - each marker in critic/pending/ with its separate obligations
 *     (live / focused / deep / milestone) and their results;
 *   - the build that is live now, from docs/deploys.log;
 *   - every finished report, labelled with the rubric it was scored under.
 *     Rubric v1 reports (Parts A, B and C) are history and are never shown as
 *     a current score; a v2 score is shown WITH its build, and is called out
 *     when that build is not the one that is live.
 *
 * Exit 1 while any obligation is pending, 2 when nothing is pending but the
 * live build's latest result is a FAIL, 0 otherwise.
 *
 * Node built-ins only, same as `deploy-classify.mjs` / `critic-pending.mjs`.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { readPendingMarkers } from './critic-pending.mjs';
import { loadPolicy, weightedTotal } from './critic-policy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const sameSha = (a, b) => Boolean(a && b) && (String(a).startsWith(String(b)) || String(b).startsWith(String(a)));

/** Every report under `dir`, generous about the field names old rounds used. */
export function readReports(dir, policy = null) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((file) => {
    const id = file.replace(/\.json$/, '');
    let data;
    try {
      data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    } catch (err) {
      return { file, id, parseError: err instanceof Error ? err.message : String(err) };
    }
    const rubricVersion = data.rubricVersion ?? 1;
    // Rubric v1 rounds recorded the commit that logged the deploy as `mainSha` and the build itself as `deployedSha`.
    const sha = (rubricVersion === 1 ? data.build?.deployedSha : null) ?? data.build?.mainSha ?? data.mainSha ?? data.main_sha ?? data.buildSha ?? data.build_sha ?? data.sha;
    // A v2 score is recomputed from the category scores, never trusted from a field a reviewer typed.
    const v2 = policy && rubricVersion >= 2 ? weightedTotal(data.categories, policy) : null;
    const total = rubricVersion >= 2 ? (v2 && !v2.provisional ? v2.display : null) : data.headline ?? data.weightedTotal ?? data.weighted_total ?? data.total ?? data.score;
    return { file, id, rubricVersion, review: data.review ?? (rubricVersion === 1 ? 'full round (old policy)' : '?'), sha, total, date: data.date ?? data.generatedAt ?? null, verdicts: data.verdicts ?? null };
  });
}

/** The line that says what the last full score certifies, and what it does not. */
export function qualityLine(reports, liveSha) {
  const full = reports.filter((r) => r.rubricVersion >= 2 && (r.review === 'deep' || r.review === 'milestone') && r.total !== null && r.total !== undefined);
  if (!full.length) {
    const old = reports.filter((r) => r.rubricVersion === 1 && r.total !== undefined).pop();
    return `no full score under rubric v2 yet${old ? `; last rubric v1 headline ${old.total} belongs to build ${old.sha ?? '?'} and is history, not a score for any current build` : ''}`;
  }
  const last = full[full.length - 1];
  const forLive = sameSha(last.sha, liveSha);
  return `${last.total} (${last.review}, ${last.date ?? 'undated'}) for build ${last.sha}${forLive ? ', which is the live build' : ` — NOT the live build ${liveSha ?? '?'}: it certifies nothing about what is live now`}`;
}

export function lastDeployed(root) {
  const log = join(root, 'docs', 'deploys.log');
  if (!existsSync(log)) return null;
  const ok = readFileSync(log, 'utf8').trim().split('\n').filter((l) => /\tstatus=ok/.test(l));
  if (!ok.length) return null;
  const line = ok[ok.length - 1];
  return { sha: (line.match(/\tmain=([0-9a-f]+)/) ?? [])[1] ?? null, bundle: (line.match(/\tbundle=([\w-]+)/) ?? [])[1] ?? null, at: line.split('\t')[0] };
}

function main() {
  const pending = readPendingMarkers(join(ROOT, 'critic', 'pending'));
  const policy = loadPolicy(ROOT);
  const reports = [...readReports(join(ROOT, 'critic', 'rounds'), policy), ...readReports(join(ROOT, 'critic', 'reviews'), policy)];
  const live = lastDeployed(ROOT);

  console.log(`live build: ${live ? `main ${live.sha}  bundle ${live.bundle}  deployed ${live.at}` : 'unknown (docs/deploys.log has no successful deploy)'}`);
  console.log('');
  console.log('review obligations (critic/pending/):');
  let owed = 0, failed = 0;
  if (!pending.length) console.log('  none');
  for (const m of pending) {
    if (m.parseError) { console.log(`  ${m.file}  UNREADABLE (${m.parseError}) — counts as pending`); owed++; continue; }
    console.log(`  main=${m.mainSha}  bundle=${m.bundle ?? '?'}  age=${m.ageHours}h${m.review ? `  planned review=${m.review}` : ''}`);
    for (const o of m.obligations) {
      const tail = o.status === 'pending' ? `PENDING  (${o.requires})` : `${o.status}${o.result ? ` ${o.result}` : ''}${o.settledBy ? `  by ${o.settledBy}` : ''}`;
      console.log(`    ${o.kind.padEnd(9)} ${tail}${o.carriedFrom ? `  carried from ${o.carriedFrom.join(', ')}` : ''}`);
      if (o.status === 'pending') owed++;
      if (o.result === 'FAIL' && sameSha(m.mainSha, live?.sha)) failed++;
    }
  }

  console.log('');
  console.log('reports (critic/rounds/, critic/reviews/):');
  if (!reports.length) console.log('  none');
  for (const r of reports) {
    if (r.parseError) { console.log(`  ${r.file}  UNREADABLE (${r.parseError})`); continue; }
    const label = r.rubricVersion === 1 ? 'rubric v1 (A/B/C, historical, not comparable)' : `rubric v${r.rubricVersion} ${r.review}`;
    console.log(`  ${r.id}  ${label}  build=${r.sha ?? '(none recorded)'}  ${r.total !== null && r.total !== undefined ? `score=${r.total}` : 'no score'}`);
  }
  console.log('');
  console.log(`quality: ${qualityLine(reports, live?.sha)}`);
  console.log('');
  if (owed) {
    console.log(`critic:status FAIL — ${owed} review obligation(s) are still pending (critic/RUBRIC.md, "When the critic runs").`);
    process.exitCode = 1;
  } else if (failed) {
    console.log(`critic:status FAIL — the live build was evaluated and ${failed} verdict(s) are FAIL.`);
    process.exitCode = 2;
  } else {
    console.log('critic:status OK — no live build owes a review.');
    process.exitCode = 0;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
