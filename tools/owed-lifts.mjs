/**
 * Chapters that sit on `TREATED_CHAPTERS` while the browser proof of their lift is still OWED (r73 merge review, finding 1, 2026-11-02).
 *
 * The problem: release 73's candidate puts Chapter XVIII (Sin's face) back on the treated list before the CHK-027 run of jobs J73-2 and J73-3 has run (no browser was free). The guard
 * `tests/unit/booth-b4-r71-sin-face-off.test.ts` accepts the OWED form on purpose, so the tree can carry the candidate; but the chapter was the HOLD cause of release 71, "unknown on a critical is a HOLD"
 * (critic/RUBRIC.md section 3), and nothing in the cut stopped a deploy that still said OWED. This module is the stop: `findOwedLifts` answers, from the tree alone, which listed chapters have no PASS
 * report behind their lift line, and `resolveReleaseGate` (tools/deploy-pages.mjs) turns each one into a refusal. `--skip-tests` does not skip it (it is not a test), and only the owner's own words
 * (`--owner-override`) turn it into a warning, as for every release-gate refusal.
 *
 * The list of lifts is DATA (`LIFT_NOTES`): a chapter, the handoff note whose `<marker>` line carries the lift, and the check the proof reads. A new chapter that comes back on the list on a promise adds one row.
 * Reads `src/engine/motion/DemoGate.ts` as text (this is a node script, the list is TypeScript) and checks itself against the real list in `tests/unit/r73-merge-review-fixes.test.ts`.
 *
 * Pure of the network and of git; reads only the files it is handed a root for. Prints no path.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** One row per chapter whose return to the list waits on a browser proof. */
export const LIFT_NOTES = Object.freeze([
  Object.freeze({
    id: 'sin-face',
    label: "Chapter XVIII (Sin's face)",
    note: 'docs/handoff/booth-b4.md',
    marker: 'SIN-FACE LIFT:',
    check: 'CHK-027',
  }),
]);

const DEMO_GATE = 'src/engine/motion/DemoGate.ts';
/**
 * The report paths a lift line may name: a review report of a build (`critic/reviews/<sha>-focused|live|deep.json`) or a lift proof of its own (`critic/reviews/r<release>-<name>.json`, e.g. `r73-sinface-chk027.json`:
 * one chapter against one check, written by the lane that ran it, with `review: "lift-proof"` and no `build.mainSha`, so the deploy gate never reads it as the build's focused or deep review (`shipEvidenceFor`)).
 * Whatever the name, the file is read by `liftReportVerdict`: it must hold a continuity run of the chapter and read PASS for the check in every run. Widened in the r73 apply step (2026-11-02): the Sin's-face proof is a
 * lift proof, not a review of a sha, and naming it `<sha>-focused.json` would have passed it off as the focused review the gate asks for.
 */
export const REPORT_RE = /critic\/reviews\/(?:[0-9a-f]{7,40}-(?:focused|live|deep)|r\d+-[a-z0-9]+(?:-[a-z0-9]+)*)\.json/;

export function readText(root, rel) {
  try {
    return readFileSync(join(root, rel), 'utf8').replace(/\r\n/g, '\n');
  } catch {
    return null;
  }
}

/** Is this id a data line of `TREATED_CHAPTERS` in the source? (Comments do not count; a line must start with the key.) */
export function isListedInSource(root, id) {
  const src = readText(root, DEMO_GATE);
  if (src === null) return false;
  const start = src.indexOf('export const TREATED_CHAPTERS');
  if (start < 0) return false;
  const end = src.indexOf('\n});', start);
  const block = src.slice(start, end < 0 ? undefined : end);
  const key = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*(?:'${key}'|"${key}"|${key}):\\s*\\{`, 'm').test(block);
}

/**
 * Does the named review report show the proof? `pass` when it exists and every continuity entry of the chapter reads PASS for the check (at least one entry); `fail` when an entry reads anything else;
 * `no-entry` when the report holds no run of the chapter; `unreadable` when the file is missing or not JSON.
 */
export function liftReportVerdict(root, reportRel, id, check) {
  const text = readText(root, reportRel);
  if (text === null) return { state: 'unreadable', detail: `${reportRel} does not exist` };
  let report;
  try {
    report = JSON.parse(text);
  } catch {
    return { state: 'unreadable', detail: `${reportRel} is not JSON` };
  }
  const entries = (report?.continuity?.chapters ?? []).filter((c) => c?.chapter === id);
  if (entries.length === 0) return { state: 'no-entry', detail: `${reportRel} holds no continuity run of ${id}` };
  const bad = entries.filter((c) => c?.checks?.[check] !== 'PASS');
  if (bad.length) return { state: 'fail', detail: `${reportRel} reads ${check} ${bad.map((c) => c?.checks?.[check] ?? 'missing').join(', ')} for ${id}` };
  return { state: 'pass', detail: `${reportRel} reads ${check} PASS for ${id} (${entries.length} run${entries.length === 1 ? '' : 's'})` };
}

/**
 * Every listed chapter whose lift is not yet proved: [{ id, label, why }]. Empty when each lift row's chapter is off the list, or its note's line names a report that exists and reads PASS.
 * A chapter that is listed with NO lift line at all is owed too (the guard test fails that case in the tree; here it simply blocks the cut).
 */
export function findOwedLifts(root = process.cwd()) {
  const owed = [];
  for (const row of LIFT_NOTES) {
    if (!isListedInSource(root, row.id)) continue;
    const note = readText(root, row.note) ?? '';
    const marker = note.split('\n').find((l) => l.startsWith(row.marker));
    if (!marker) {
      owed.push({ id: row.id, label: row.label, why: `${row.label} is on the treated list and ${row.note} carries no "${row.marker}" line` });
      continue;
    }
    const report = marker.match(REPORT_RE)?.[0];
    if (!report) {
      owed.push({ id: row.id, label: row.label, why: `${row.label} is on the treated list while its ${row.check} run is still OWED (the "${row.marker}" line of ${row.note} names no review report): run the browser jobs it names, then put the report's path in the line` });
      continue;
    }
    const verdict = liftReportVerdict(root, report, row.id, row.check);
    if (verdict.state !== 'pass') owed.push({ id: row.id, label: row.label, why: `${row.label} is on the treated list but its lift proof does not hold: ${verdict.detail}` });
  }
  return owed;
}
