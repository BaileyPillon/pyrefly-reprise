// Which review report the release gate is allowed to read (tools/deploy-pages.mjs re-exports `shipEvidenceFor`; moved here so the deploy script, already over the size limit, does not grow).
// Game case: both (shared deploy plumbing).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { loadPolicy, validateReport } from './critic-policy.mjs';

/**
 * The validated candidate review the release gate is allowed to read: a
 * focused, deep or milestone report for THIS commit, with the ship verdict it
 * carries (RULE A, RUBRIC section 3). A deep or milestone report outranks a
 * focused one, and among equals the newest date wins. A report from before the
 * rules came in carries no `verdicts.ship`, so its changed-area verdict stands
 * in — a FAIL or an UNVERIFIED reads as HOLD, exactly as the old gate did.
 * Pure given the filesystem it reads.
 *
 * `skipped` (optional, an array the caller owns) receives `{ path, errors }` for every report for
 * this commit that `validateReport` refused, so the gate can say WHY it found none (review F6:
 * a continuity-harness identity refusal used to surface only as "no validated report exists").
 */
export function shipEvidenceFor(root, mainSha, skipped = []) {
  const policy = loadPolicy(root);
  const rank = { focused: 1, deep: 2, milestone: 3 };
  let best = null;
  for (const dir of ['reviews', 'rounds']) {
    const full = join(root, 'critic', dir);
    if (!existsSync(full)) continue;
    for (const f of readdirSync(full).filter((n) => n.endsWith('.json'))) {
      let report;
      try { report = JSON.parse(readFileSync(join(full, f), 'utf8')); } catch { continue; }
      const sha = report.build?.mainSha;
      if (!sha || !(sha.startsWith(mainSha) || mainSha.startsWith(sha))) continue;
      if (!rank[report.review]) continue;
      const errors = validateReport(report, policy, { root });
      if (errors.length !== 0) { skipped.push({ path: `critic/${dir}/${f}`, errors }); continue; }
      const ship = report.verdicts?.ship ?? (report.verdicts?.changedArea === 'PASS' ? 'SHIP' : 'HOLD');
      const found = { path: `critic/${dir}/${f}`, review: report.review, ship, date: report.date ?? '' };
      if (!best || rank[found.review] > rank[best.review] || (rank[found.review] === rank[best.review] && found.date > best.date)) best = found;
    }
  }
  return best ? { path: best.path, review: best.review, ship: best.ship } : null;
}

/** One line per refused report, first error each (the continuity-harness identity refusal is the one an operator cannot guess), for the gate's refusal text. */
export function describeSkipped(skipped) {
  return (skipped ?? []).slice(0, 3).map((s) => `${s.path} was refused as evidence: ${s.errors[0]}${s.errors.length > 1 ? ` (and ${s.errors.length - 1} more)` : ''}`).join(' | ');
}
