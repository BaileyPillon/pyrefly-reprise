/**
 * Marker files that make "this live build still owes a review" visible.
 * `tools/deploy-pages.mjs` writes one JSON marker per successful deploy under
 * `critic/pending/<mainShortSha>.json`; that script's startup warning,
 * `tools/critic-status.mjs` and `tools/critic-clear.mjs` read the folder back.
 *
 * Policy v2 (critic/RUBRIC.md, approved 2026-09-20): every deployed build is
 * evaluated and the depth follows the change, so a marker now lists separate
 * OBLIGATIONS instead of one implied "full round":
 *
 *   live     exact-artifact verification and real-input smoke on the live URL
 *   focused  acceptance of the changed area
 *   deep     a deep review of every affected chapter and system
 *   milestone  the finished-milestone acceptance review
 *
 * Only a validated report for the same build settles an obligation, and only
 * of its own kind or a lighter one: a focused pass can never settle a deep
 * review. An UNVERIFIED verdict settles nothing. A deep review still owed when
 * the next build ships moves to that build instead of disappearing. Settled
 * markers move to `critic/cleared/` so the record is kept.
 *
 * A marker without an `obligations` list was written under the old policy,
 * where every deploy owed a full round; it reads as owing all three.
 *
 * Only the functions that take a directory touch the filesystem. Types live in
 * `critic-pending.d.mts`.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** The marker's filename: `critic/pending/<mainSha>.json`. */
export function pendingMarkerFileName(mainSha) {
  return `${mainSha}.json`;
}

/** Join a pending dir and a `mainSha` into the marker's full path. */
export function pendingMarkerPath(pendingDir, mainSha) {
  return join(pendingDir, pendingMarkerFileName(mainSha));
}

const WHAT = {
  live: 'exact-artifact verification and real-input smoke on the live URL',
  focused: 'acceptance of the changed area',
  deep: 'deep review of every affected chapter and system',
  milestone: 'finished-milestone acceptance review',
};

/** One pending obligation per kind the plan requires; `live` is always owed. */
export function obligationsForPlan(plan, carriedDeep = []) {
  const kinds = new Set(['live', ...(plan?.obligations ?? ['focused', 'deep'])]);
  if (carriedDeep.length) kinds.add('deep');
  return ['live', 'focused', 'deep', 'milestone'].filter((k) => kinds.has(k)).map((kind) => ({
    kind, status: 'pending', requires: WHAT[kind],
    ...(kind === 'deep' && carriedDeep.length ? { carriedFrom: carriedDeep } : {}),
  }));
}

/**
 * Build the marker's JSON content from a finished deploy's own numbers. Pass
 * the deploy script's own `isoNow` as `deployedAt` so the marker and the
 * `docs/deploys.log` line for the same run agree. With a `plan` the marker
 * carries the artifact hash, the reasons and its obligations; without one it
 * is the five-field marker of the old policy.
 */
export function buildPendingMarker({ mainSha, bundle, deployedAt, liveUrl, artFiles, artifactHash, plan, carriedDeep, liveArtifact }) {
  const base = { mainSha, bundle, deployedAt, liveUrl, artFiles };
  if (!plan) return base;
  return {
    ...base, policyVersion: 2, artifactHash: artifactHash ?? null, review: plan.review, reasons: plan.reasons,
    systems: plan.systems, chapters: plan.chapters, checks: plan.checks, liveArtifact: liveArtifact ?? null,
    obligations: obligationsForPlan(plan, carriedDeep ?? []),
  };
}

/** Pretty-printed, newline-terminated — diffable if it's ever hand-edited. */
export function formatPendingMarker(marker) {
  return `${JSON.stringify(marker, null, 2)}\n`;
}

/**
 * Hours between `deployedAt` (ISO) and `now`, rounded to one decimal. This
 * only ever feeds a human-readable label, so unparsable input reads as `0`
 * rather than `NaN` or a thrown error.
 */
export function computeAgeHours(deployedAt, now = new Date()) {
  const then = new Date(deployedAt);
  if (Number.isNaN(then.getTime())) return 0;
  const hours = (now.getTime() - then.getTime()) / (1000 * 60 * 60);
  return Math.round(hours * 10) / 10;
}

/** The obligations a marker carries; an old-policy marker owes all three. */
export function markerObligations(marker) {
  if (Array.isArray(marker.obligations)) return marker.obligations;
  return ['live', 'focused', 'deep'].map((kind) => ({
    kind, status: 'pending', requires: WHAT[kind], origin: 'written under the old policy, which owed a full round',
  }));
}

/**
 * Write one marker to `pendingDir`, creating the folder (and a `.gitkeep`, so
 * the folder exists in git even when every marker has been cleared) if
 * needed. Returns the path written.
 */
export function writePendingMarker(pendingDir, marker) {
  mkdirSync(pendingDir, { recursive: true });
  const gitkeep = join(pendingDir, '.gitkeep');
  if (!existsSync(gitkeep)) writeFileSync(gitkeep, '');
  const path = pendingMarkerPath(pendingDir, marker.mainSha);
  writeFileSync(path, formatPendingMarker(marker));
  return path;
}

/**
 * Read every marker in `pendingDir`, oldest (largest `ageHours`) first. A
 * missing folder reads as no markers at all. A marker file that fails to parse
 * is kept in the list with `parseError` set instead of being silently dropped.
 */
export function readPendingMarkers(pendingDir, now = new Date()) {
  if (!existsSync(pendingDir)) return [];
  const files = readdirSync(pendingDir).filter((f) => f.endsWith('.json')).sort();
  const entries = [];
  for (const file of files) {
    const full = join(pendingDir, file);
    const mainShaFromFile = file.replace(/\.json$/, '');
    let data;
    try {
      data = JSON.parse(readFileSync(full, 'utf8'));
    } catch (err) {
      entries.push({ file, mainSha: mainShaFromFile, ageHours: 0, parseError: err instanceof Error ? err.message : String(err) });
      continue;
    }
    entries.push({
      file,
      mainSha: data.mainSha ?? mainShaFromFile,
      bundle: data.bundle,
      deployedAt: data.deployedAt,
      liveUrl: data.liveUrl,
      artFiles: data.artFiles,
      ageHours: computeAgeHours(data.deployedAt, now),
      ...(data.artifactHash !== undefined ? { artifactHash: data.artifactHash } : {}),
      ...(data.review ? { review: data.review } : {}),
      obligations: markerObligations(data),
    });
  }
  entries.sort((a, b) => (b.ageHours ?? 0) - (a.ageHours ?? 0));
  return entries;
}

const sameSha = (a, b) => Boolean(a && b) && (String(a).startsWith(String(b)) || String(b).startsWith(String(a)));

/**
 * Which of a marker's obligations does this report settle? Pure. The report
 * must already have passed `validateReport`. Returns the updated marker, what
 * was settled and what was refused with the reason.
 *
 *   - wrong or unknown build identity settles nothing: an old score cannot
 *     certify a new build;
 *   - a report settles its own kind and lighter ones only;
 *   - PASS and FAIL are results and settle the obligation (a FAIL stays loud in
 *     the status); UNVERIFIED and NOT APPLICABLE settle nothing;
 *   - a deep or milestone review with required coverage left untested settles
 *     nothing of that kind.
 */
export function applyReport(marker, report, reportFile = null) {
  const obligations = markerObligations(marker).map((o) => ({ ...o }));
  const settled = [], refused = [];
  const refuseAll = (why) => ({
    marker: { ...marker, obligations }, settled,
    refused: obligations.filter((o) => o.status === 'pending').map((o) => ({ kind: o.kind, why })),
  });
  const b = report.build ?? {};
  if (!sameSha(b.mainSha, marker.mainSha)) return refuseAll(`report is for build ${b.mainSha ?? '(none)'}, this marker is ${marker.mainSha}`);
  if (b.bundle && marker.bundle && b.bundle !== marker.bundle) return refuseAll(`report bundle ${b.bundle} is not the deployed bundle ${marker.bundle}`);
  if (marker.artifactHash && b.artifactHash && b.artifactHash !== marker.artifactHash) return refuseAll('report artifact hash is not the deployed artifact');

  const rank = { live: 0, focused: 1, deep: 2, milestone: 3 };
  const v = report.verdicts ?? {};
  const mandatoryUnverified = (report.checks ?? []).filter((c) => c.mandatory && c.result === 'UNVERIFIED').map((c) => c.id);
  for (const o of obligations) {
    if (o.status !== 'pending') continue;
    const refuse = (why) => refused.push({ kind: o.kind, why });
    let result = null;
    if (o.kind === 'live') {
      if (!['live', 'deep', 'milestone'].includes(report.review)) { refuse(`a ${report.review} review is not a live verification`); continue; }
      if (marker.artifactHash && !b.artifactHash) { refuse('the report does not name the artifact it verified'); continue; }
      result = v.deployment;
    } else {
      if (rank[report.review] < rank[o.kind]) { refuse(`a ${report.review} review cannot settle a ${o.kind} obligation`); continue; }
      if (report.review === 'live') { refuse('a live verification is not a review of the change'); continue; }
      result = o.kind === 'milestone' ? (v.milestone === 'accepted' ? 'PASS' : v.milestone === 'incomplete' ? 'FAIL' : 'UNVERIFIED') : v.changedArea;
      if ((o.kind === 'deep' || o.kind === 'milestone') && (report.coverage?.requiredNotTested ?? []).length) {
        refuse(`required coverage was not tested: ${report.coverage.requiredNotTested.join(', ')}`); continue;
      }
    }
    if (result !== 'PASS' && result !== 'FAIL') { refuse(`verdict is ${result ?? 'missing'}: missing evidence stays pending`); continue; }
    if (mandatoryUnverified.length) { refuse(`mandatory checks are UNVERIFIED: ${mandatoryUnverified.join(', ')}`); continue; }
    o.status = 'done'; o.result = result; o.settledBy = reportFile ?? report.review; o.settledAt = report.date;
    settled.push({ kind: o.kind, result });
  }
  return { marker: { ...marker, obligations }, settled, refused };
}

export const allSettled = (marker) => markerObligations(marker).every((o) => o.status !== 'pending');

/**
 * Every build that still owes a deep (or milestone) review, counting both the
 * marker's own build and the builds whose debt it carries. RULE B (Bailey,
 * 2026-09-21): at most `release.maxDeploysWithDeepOwed` deploys may go out
 * while a deep review is owed; the next one refuses until one is settled, or
 * the owner overrides. Pure: pass `readPendingMarkers(...)` or markers built
 * in a test.
 */
export function deepOwedBuilds(markers) {
  const owed = new Set();
  for (const marker of markers ?? []) {
    for (const o of markerObligations(marker)) {
      if (o.status !== 'pending') continue;
      if (o.kind !== 'deep' && o.kind !== 'milestone') continue;
      if (marker.mainSha) owed.add(marker.mainSha);
      for (const carried of o.carriedFrom ?? []) owed.add(carried);
    }
  }
  return [...owed];
}

/**
 * A new build is about to replace these live builds. Their deep reviews move
 * to the new build; their live and focused obligations can no longer be
 * verified because the artifact is gone, and are recorded as exactly that.
 * Returns the builds whose deep review carries over and the closed markers.
 */
export function supersedeMarkers(markers, newSha, when) {
  const carriedDeep = [], closed = [];
  for (const m of markers) {
    if (sameSha(m.mainSha, newSha)) continue;
    const obligations = markerObligations(m).map((o) => {
      if (o.status !== 'pending') return o;
      if (o.kind === 'deep' || o.kind === 'milestone') {
        carriedDeep.push(...(o.carriedFrom ?? []), m.mainSha);
        return { ...o, status: 'carried', carriedTo: newSha, at: when };
      }
      return { ...o, status: 'superseded-unverified', note: `never verified: the build was replaced by ${newSha}`, at: when };
    });
    closed.push({ ...m, obligations, supersededBy: newSha });
  }
  return { carriedDeep: [...new Set(carriedDeep)], closed };
}

/** Move a settled or superseded marker out of `pendingDir` into `clearedDir`, keeping its content. */
export function archiveMarker(pendingDir, clearedDir, marker) {
  mkdirSync(clearedDir, { recursive: true });
  const to = join(clearedDir, pendingMarkerFileName(marker.mainSha));
  writeFileSync(to, formatPendingMarker(marker));
  const from = pendingMarkerPath(pendingDir, marker.mainSha);
  if (existsSync(from)) rmSync(from);
  return to;
}

/**
 * Lines for the warning block `deploy-pages.mjs` prints at the start of every
 * run, `--dry-run` included. Always returns at least one line.
 */
export function formatPendingWarningBlock(entries) {
  if (!entries.length) return ['UNEVALUATED LIVE BUILDS: none'];
  const lines = [`UNEVALUATED LIVE BUILDS: ${entries.length} live build(s) still owe a review —`];
  for (const entry of entries) {
    if (entry.parseError) {
      lines.push(`  ${entry.file}  UNREADABLE (${entry.parseError})`);
      continue;
    }
    const owed = (entry.obligations ?? []).filter((o) => o.status === 'pending').map((o) => o.kind).join(' + ') || 'nothing';
    lines.push(
      `  main=${entry.mainSha}  bundle=${entry.bundle ?? '?'}  age=${entry.ageHours}h  owes=${owed}  live=${entry.liveUrl ?? '?'}`,
    );
  }
  lines.push('  -> npm run critic:status, or read critic/RUBRIC.md ("When the critic runs")');
  return lines;
}
