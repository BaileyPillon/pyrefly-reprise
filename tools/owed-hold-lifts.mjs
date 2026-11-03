/**
 * Piece HOLDS that were lifted on a model, while the browser proof of the lift is still OWED (r74-omnis review, finding M1, 2026-11-02).
 *
 * The problem: `tools/owed-lifts.mjs` stops a CHAPTER that sits on `TREATED_CHAPTERS` on a promise (Chapter XVIII's Sin's face). The lane r74-omnis lifts a PIECE hold instead: Chapter XII's `hud` row of
 * `PieceHolds.ts`, the row the r72 focused review put on the chapter after the target flag met the Move advisor card (it caused release 72's HOLD for that chapter). The lift stands on a MODEL of the recorded walks
 * (`tests/unit/r74-omnis-walk.test.ts`); the only protection was the handoff note's "HOLD CONDITION" prose and a test that pins the prose, so a cut that carried the commit could deploy with the cursor-walk jobs unread, and
 * `critic-plan` calls the change FOCUSED only. "Unknown on a critical is a HOLD" (critic/RUBRIC.md section 3): the existing mechanism checks "chapter on the list plus a CHK-027 report", which does not fit a piece, so
 * this is the second kind. Same shape, one more table: {@link HOLD_LIFTS}.
 *
 * `findOwedHoldLifts` answers, from the tree alone, which lifted holds have no passing proof behind them, and `resolveReleaseGate` (tools/deploy-pages.mjs) turns each one into a refusal exactly as it does for `findOwedLifts`:
 * `--skip-tests` does not skip it (it is not a test), and only the owner's own words (`--owner-override`) turn it into a warning. Backing the lift out (the `hud` row back in `PieceHolds.ts`) makes nothing owed: the hold is
 * present again, so there is nothing to prove.
 *
 * A row is DATA: the chapter, the piece, the handoff note whose `<marker>` line carries the lift, and the jobs whose numbers the proof must hold. The marker line names the proof report
 * (`critic/reviews/r<release>-<name>.json`, the same names `owed-lifts.REPORT_RE` takes) once the jobs have run; until then it says OWED and names no report. The report is written by the lane that ran the jobs:
 *
 *   { "review": "lift-proof", "lift": "omnis-hud", "chapter": "seymour-omnis", "piece": "hud",
 *     "build": { "branch": "...", "sha": "...", "note": "..." },            // no build.mainSha: the deploy gate never reads it as the build's own review
 *     "verdicts": { "liftProof": "PASS" },
 *     "jobs": { "J74-1": { "verdict": "PASS", "pairs": 0, "textOverlaps": 0, "consoleErrors": 0 }, ... one entry per job of the row } }
 *
 * Reads `src/engine/motion/DemoGate.ts`, `PieceHolds.ts` and `PieceHoldsLast.ts` as text (this is a node script, the tables are TypeScript) and checks itself against the real tables in
 * `tests/unit/r74-omnis-gate.test.ts`. Pure of the network and of git; reads only the files it is handed a root for. Prints no path.
 */
import { REPORT_RE, isListedInSource, readText } from './owed-lifts.mjs';

/** What a job's entry in the proof report must hold: `verdict` PASS, each `zero` field the number 0, each `atMost` field a number at or under its bound. */
const job = (zero, atMost = {}) => Object.freeze({ zero: Object.freeze(zero), atMost: Object.freeze(atMost) });

/** One row per piece hold lifted before its browser proof exists. */
export const HOLD_LIFTS = Object.freeze([
  Object.freeze({
    id: 'omnis-hud',
    label: "Chapter XII's F1 HUD (the lifted `hud` hold)",
    chapter: 'seymour-omnis',
    piece: 'hud',
    note: 'docs/handoff/r74-omnis.md',
    marker: 'OMNIS-HUD LIFT:',
    jobs: Object.freeze({
      'J74-1': job(['pairs', 'textOverlaps', 'consoleErrors']), // the 29-stop walk, eight windows at TEXT SIZE 100 and 115: 0 flag-over-advisor pairs
      'J74-2': job(['pairs', 'consoleErrors']), // the Enemy Intent line at 1280 x 720
      'J74-3': job(['pairs', 'consoleErrors']), // the Sensor card against the flag
      'J74-4': job(['consoleErrors'], { maxDiffPx: 1.5 }), // nothing else moves (Chapters I, IX, II, VII, X, XVIII; XII at 130, today, pack): every rect within 1.5 px of the r72 reads
      'J74-5': job(['pairs', 'consoleErrors']), // the R72-1 repro as filed
      'J74-6': job(['consoleErrors']), // a fight through to Victory and the title
      'J74-7': job(['pairs', 'consoleErrors']), // an ally and a self flag (Cure, Item) against the advisor, the chip, the tip and the Sensor card
    }),
  }),
  // r74-int review MAJOR-2 (2026-11-03): Chapter XVII is on the treated list on OFFLINE arithmetic only (the Fin plate's width read from the font file), and its own note says a candidate that carries the line "must not
  // reach production before FIN-1 to FIN-4 and FIN-9 have run and read as predicted". Its release-71 major (the Fin plate on the F1 turn strip) is not something the cut may take on trust. The chapter's `hud` PLAYS (the
  // treatment moves the plate clear of the strip), so the way back is a `hud` row for the chapter in PieceHoldsLast.ts (the lane's own fallback), which makes nothing owed here, exactly as for Chapter XII's.
  Object.freeze({
    id: 'fins-hud',
    label: "Chapter XVII's F1 HUD (the Fin plate clear of the turn strip, the action banner under it)",
    chapter: 'sin-fins-core',
    piece: 'hud',
    note: 'docs/handoff/r74-fins.md',
    marker: 'FINS-HUD LIFT:',
    jobs: Object.freeze({
      'FIN-1': job(['pairs', 'consoleErrors']), // TEXT SIZE 100, the charged state, four window sizes: 0 overlapping pairs among the plate, the ribbon, hero, cue, verbs, prompts, strip, Sensor card, advisor and the target flag
      'FIN-2': job(['pairs', 'consoleErrors']), // the calm and plain-NEAR states, and TEXT SIZE 115 for all three: 0 pairs
      'FIN-3': job(['consoleErrors']), // TEXT SIZE 130, ?hud=today, ?treated=pack and the phone keep release 72's plate (a read of the paths that keep today's; the named ?f1text=grow loss is predicted, not a pair)
      'FIN-4': job(['consoleErrors'], { skyOver240Pct: 1.0, frameOver240DeltaPct: 1.0, meanLumaDiff: 6 }), // the sky: the share over 240 in the sky band, the whole frame's share over the control's, the mean luma against the control
      'FIN-9': job(['pairs', 'consoleErrors']), // the action banner under the plate, every order-giver, at 100 and 115, then link III: 0 rectangle overlaps
    }),
  }),
]);

const HOLD_FILES = Object.freeze(['src/engine/motion/PieceHolds.ts', 'src/engine/motion/PieceHoldsLast.ts']);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Is this piece a key of this chapter's row in the hold tables? Comments do not count (a key line starts with the key); a chapter that is in neither table has no hold. The chapter's block runs from its
 * `'<id>': Object.freeze({` line to the first line that is exactly `  }),`.
 */
export function holdIsInSource(root, chapter, piece) {
  const key = esc(chapter);
  for (const file of HOLD_FILES) {
    const src = readText(root, file);
    if (src === null) continue;
    const at = new RegExp(`^  (?:'${key}'|"${key}"|${key}): Object\\.freeze\\(\\{`, 'm').exec(src);
    if (!at) continue;
    const rest = src.slice(at.index + at[0].length);
    const end = rest.search(/^ {2}\}\),?[ \t]*$/m);
    return new RegExp(`^\\s*${esc(piece)}:`, 'm').test(end < 0 ? rest : rest.slice(0, end));
  }
  return false;
}

/**
 * Does the named proof report hold every job of the row at its numbers? `pass` when it names the row's lift, chapter and piece, and every job reads PASS with its zero fields 0 and its bounded fields in bounds;
 * `unreadable` when the file is missing or not JSON; `wrong-subject` when it is a proof of something else; `missing-job` when a job of the row has no entry; `fail` when an entry reads anything else.
 */
export function holdLiftReportVerdict(root, reportRel, row) {
  const text = readText(root, reportRel);
  if (text === null) return { state: 'unreadable', detail: `${reportRel} does not exist` };
  let report;
  try {
    report = JSON.parse(text);
  } catch {
    return { state: 'unreadable', detail: `${reportRel} is not JSON` };
  }
  if (report?.lift !== row.id || report?.chapter !== row.chapter || report?.piece !== row.piece) {
    return { state: 'wrong-subject', detail: `${reportRel} is not a proof of ${row.id} (${row.chapter}, ${row.piece})` };
  }
  const missing = Object.keys(row.jobs).filter((j) => typeof report.jobs?.[j] !== 'object' || report.jobs[j] === null);
  if (missing.length) return { state: 'missing-job', detail: `${reportRel} holds no entry for ${missing.join(', ')}` };
  const bad = [];
  for (const [id, spec] of Object.entries(row.jobs)) {
    const got = report.jobs[id];
    if (got.verdict !== 'PASS') bad.push(`${id} reads ${got.verdict ?? 'no verdict'}`);
    for (const f of spec.zero) if (got[f] !== 0) bad.push(`${id} ${f} is ${got[f] === undefined ? 'missing' : got[f]}, not 0`);
    for (const [f, max] of Object.entries(spec.atMost)) if (typeof got[f] !== 'number' || !(got[f] <= max)) bad.push(`${id} ${f} is ${got[f] === undefined ? 'missing' : got[f]}, over ${max}`);
  }
  if (bad.length) return { state: 'fail', detail: `${reportRel} does not hold the lift: ${bad.join('; ')}` };
  return { state: 'pass', detail: `${reportRel} reads PASS for ${Object.keys(row.jobs).join(', ')}` };
}

/**
 * Every lifted hold whose proof is missing: [{ id, label, why }]. Empty when each row's chapter is off the treated list, or its piece is a key of the chapter's row again, or its note's marker line names a report that
 * exists and passes. A lift with NO marker line at all is owed too.
 */
export function findOwedHoldLifts(root = process.cwd()) {
  const owed = [];
  for (const row of HOLD_LIFTS) {
    if (!isListedInSource(root, row.chapter)) continue; // off the list the chapter plays no treated piece, so there is no hold to lift
    if (holdIsInSource(root, row.chapter, row.piece)) continue; // the hold is in place: nothing is lifted, nothing to prove
    const note = readText(root, row.note) ?? '';
    const marker = note.split('\n').find((l) => l.startsWith(row.marker));
    if (!marker) {
      owed.push({ id: row.id, label: row.label, why: `${row.label}: the "${row.piece}" hold of ${row.chapter} is lifted in the tree and ${row.note} carries no "${row.marker}" line` });
      continue;
    }
    const report = marker.match(REPORT_RE)?.[0];
    if (!report) {
      owed.push({ id: row.id, label: row.label, why: `${row.label}: the "${row.piece}" hold of ${row.chapter} is lifted on a model while the browser jobs ${Object.keys(row.jobs).join(', ')} are still OWED (the "${row.marker}" line of ${row.note} names no report): run them, write the proof report, then put its path in the line, or put the hold back` });
      continue;
    }
    const verdict = holdLiftReportVerdict(root, report, row);
    if (verdict.state !== 'pass') owed.push({ id: row.id, label: row.label, why: `${row.label}: the "${row.piece}" hold of ${row.chapter} is lifted but its proof does not hold: ${verdict.detail}` });
  }
  return owed;
}
