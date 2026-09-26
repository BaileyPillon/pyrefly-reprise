# t1-b4b: batch 4, flow / audio plumbing / delivery half

Branch `t1-b4b` (worktree `D:/pyrefly-t1-b4b`), from main `3665f1eb`, 2026-09-26. Program:
`docs/plans/thresholds-program-2026-09-26.md` §2 "Batch 4". Class A only. Not merged, not deployed.

## Method checks (rule 15), written before the fixes

- **PR-0109**: `docs/plans/pr-0109-method-check.md` (paper agent). Followed alternative 2.
- **PR-0100 (stalled; no paper on disk, so here).** Why it stalled: both fixes the issue offered
  looked bigger than they are. Moving 52 tracked files out of `public/` touches `audition.html`,
  `render-range.mjs` and `ace-step.mjs`, which write there on purpose. Excluding them from the build
  leaves `qa.mjs --strict` red on the same files as "orphans". Neither half was owned by one
  batch. What tells the options apart: after the build, does `dist/` still hold a candidate, and
  does `qa --strict` still count one? Chosen: a build-time prune (one rule module shared by Vite,
  the deploy guard and `qa.mjs`), so the files stay where the tools write them and the local
  audition keeps working. Rejected: moving the files, because it churns three tools and 34 MB of git
  history for the same result.
- **PR-0099 (stalled; docs half).** Why it stalled: the cue map in THEMES.md is per cue, so a
  chapter that borrows a cue had nowhere to go, and nothing checked the chapters at all. The smallest
  test is a grep for each chapter name plus a unit test that removes a row. Chosen: a separate
  per-chapter table, which `themes-audit` parses and checks against `src/data`. No cue is composed
  here (rule 13; D-209 says the owed cues come after the direction pick, D-168).

## Fixed (each commit carries its rule-14 game case)

| Issue | Commit | Game | What changed | Acceptance evidence |
|---|---|---|---|---|
| PR-0215 | `db0bd923` | stalemate rule FFX only; routing both | `GameFlow.runChapter` sends `'escape'` through the existing defeat panel (RETRY / CHAPTER SELECT), the same way as a defeat. Automated runs (`skipResults`) are unchanged. The engine is unchanged. | Unit test `tests/unit/flow-stalemate-results.test.ts` (2 of 3 failed first). Browser: in Ch III the engine's own stalemate watch was debug-set (`rt.progress`), then real Enter presses ended the fight as `escape`. The results panel appeared (`outcome: escape`) and real Enter on RETRY led to prep and then battle. `docs/screenshots/t1-b4b/stalemate-*.jpg`, `stalemate-run.json`. **Half done, see Stopped.** |
| PR-0109 | `2f456d77` | both | New `src/app/screens/frontend/boardFocus.ts` remembers the confirmed chapter id, in module memory mirrored to `sessionStorage` inside try/catch, so a same-tab reload also lands on it. No save-schema change. `ChapterSelectScreen` opens on that tile when no `initialIndex` is given. A fresh session still opens on Chapter I. | Unit test `tests/unit/board-focus.test.ts` (14 of 17 failed first). Real keys, production build, at 1600x900, 2000x1012 and 390x844: Esc from prep for all 14 playable cards gave `selectedId` equal to the chapter, 42 of 42. The results return was checked for I, VI and XIV at all three sizes, 9 of 9, covering victory CONFIRM and defeat CHAPTER SELECT. In those runs the fight was settled by the debug `autoBattle` at skip speed; board, prep and results used real keys. 0 console errors, 0 HTTP errors. `docs/screenshots/t1-b4b/board-*.jpg`, `board-run.json`, `prep-esc/board-run.json`. |
| PR-0214 | `8870bcf7` | both | `pauseMusic.ts` now uses `has()`. When the remembered cue is `null` (a silent scene), resuming calls `stopMusic` with the fade used when leaving the pause, which also cancels a pause cue that is still loading. | Unit test `tests/unit/pause-music-silence.test.ts` (2 of 4 failed first). Browser, real keys: Ch I pre-scene went null → pause → **null** 1.5 s after the resume. Ch I battle went boss-seymour → pause → boss-seymour. Ch V pre-scene went scene-farplane → pause → scene-farplane. `pause-audio-run.json`, `ch*-paused.jpg`. |
| PR-0100 + PR-0173 | `da4ce73b` | both | New `tools/dist-filter.mjs` defines what never ships: `audio/candidates/**`, `art/**/*.raw.png` and `art/**/*.N.png|json`. The Vite plugin `pyrefly-dist-filter` prunes them after every build, using lstat so it never follows a link. `qa.mjs` stops counting the unshipped candidates as orphans. `deploy-pages.mjs` runs `qa --strict` in the preflight (never skipped) and refuses a build that still carries an unshipped file. | Unit test `tests/unit/dist-filter.test.ts` (the plugin check failed first). A fresh build removed 291 files (52 audio, 239 art) and left 0; the sources stay on disk (52 and 239). `qa.mjs --strict` exits 0 (it exited 1 before, on the 52 orphans only). All 72 local files `audition.html` references resolve. The board and results routes above recorded 0 HTTP errors. |
| PR-0099 (docs half) | `d5e3715e` | both | New section "The chapter cue map" in `docs/audio/THEMES.md`: one row per listed chapter giving the scene, battle and victory cues, whether each is the chapter's own, a stand-in or a choice, and the owed cue with its decision: VI D-018, VII scene D-190 (open), X D-091, XI D-112 then D-209, XII D-145 B18, XIII D-146 TR16, XIV D-147 B21 / D-186, XV D-148 GP16, and D-209 on every borrowed row. `tools/audio/chapter-cue-map.mjs` parses the table and checks it. `themes-audit.mjs` prints it and exits 1 on a missing or mismatched row; the new logic is in `chapter-cue-map-report.mjs` because the audit file is over 400 lines. | `tests/unit/themes-chapter-cue-map.test.ts`: every listed chapter has a row matching its `music` record, the round-13 grep names are present, and removing or altering a row fails. It failed first on the missing module; the table and the test were written together. `node tools/audio/themes-audit.mjs` reports 0 chapters departing from the map. |
| PR-0158 | `2ba66522` | both | New getter `presenterBound` (screen not exited, presenter set, presenter not aborted), checked by `canPause`, `openPause` and the debug beat `pause:open`, which now answers false when it cannot open. `BattleScreen.ts` grew from 919 to 924 lines (the guard only). | Unit tests in `tests/unit/battle-screen-teardown.test.ts` (2 of 3 failed first). Real Escape at 0.5, 1, 2, 3 and 4 s after battle mount in ch1 and ch6: 10 of 10 had 0 console errors and the battle continued. From 3 s on, Esc opened the pause and Esc closed it. `esc-run.json`, `esc-*.jpg`. |

## Stopped, or not a fix

- **PR-0215, the card's wording.** The routing and RETRY are fixed. The panel, however, reads
  "Defeat" and "DREAM'S END — INSIDE SIN · FELL". A line that explains the withdrawal ("The battle
  cannot be won from here") belongs in `ResultsScreen.ts`, which branch `r21-results-phone` owns,
  and it is new copy on a perceivable screen. It is left for that branch, with Bailey's yes on the
  wording (rules 9 and 10).
- **PR-0216: not reproduced, so no fix (per the brief).** 20 fresh profiles at 2000x1012 each
  pressed Enter on the title. `title` was playing by +2 s and +3 s in 20 of 20, and
  `chapter-select` was playing on the board in 20 of 20 (`title-audio-run.json`). The host was not
  idle (CPU 87 percent, about 79 Chrome processes from other agents), which is harsher than the
  brief's idle host. No change was made to the unlock logging in `AudioManager.ts`.
- **An open question for Bailey, found while writing the cue map:** Chapter IX's scene borrows
  Chapter I's `scene-gagazet`, and no decision names an owed IX scene cue. IX is not in D-209's
  list. The row says so and leaves it to him.

## Checks

- `npx tsc --noEmit`: clean.
- Full `vitest run --testTimeout=60000`: exit 0, 454 files passed and 4 skipped, 8,346 tests passed.
- `node tools/orphans.mjs`: 24 orphans, unchanged from main (`boardFocus.ts` is reachable).
- `qa.mjs --strict`: exit 0. `themes-audit`: 0 chapters departing from the map.
- Browser checks ran on a production build (`vite build`, then `vite preview` on 5970) with
  `PYREFLY_BROWSER=gpu` headless Chromium and real keys. The server was stopped by its PID. The
  scratch drivers are `tools/zz-t1b4b-*.tmp.mjs` (untracked).

## For others

- **The critic driver has to change for PR-0109 (batch 5 owns `critic/runner`).**
  `critic/runner/lib/play.mjs:68-70` presses ArrowRight `idx` times again after Esc from prep. The
  board now comes back on the chapter just left, so that overshoots. `supp.mjs` and `gap-audio.mjs`
  navigate by count the same way. The drivers should move to a target id rather than count presses.
- **P does not close the pause.** PR-0115 is the other half of batch 4: my check had to close the
  pause with Esc.
- **The shared `D:/Final Fantasy/node_modules` was damaged at 17:42:22 EDT by another process, not
  this batch.** `.bin`, `@exodus` and many packages vanished; 71 top-level entries remained, and 73
  a few minutes later. This worktree's junction was removed (the link only) and replaced with its own
  `npm ci --offline --ignore-scripts`, which uses the local npm cache and downloads nothing. By the end of
  this batch it looked restored by someone (77 entries, `.bin` and `@exodus` back): check
  `npm ls` before trusting a test run there.
