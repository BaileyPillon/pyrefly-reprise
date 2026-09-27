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

## CHECK (independent, 2026-09-26, not the builder)

Checked `cc19c192` in this worktree with its own `node_modules` and a `public/art` junction, which was
removed afterwards. I made my own production build (`vite build`; the plugin printed "left out 291
unshipped file(s)") and served it with `vite preview` on 5975, stopped afterwards by its PID; nothing
listens on 5975-5979 now. The checks used headless Chromium with `PYREFLY_BROWSER=gpu` and real keys,
driven by my own driver, `tools/zz-t1b4b-check.tmp.mjs` (untracked). The evidence is in
`docs/screenshots/t1-b4b/check/` (JPEG frames and `check-*.json`, not committed, per the brief).

**Suite.** `npx tsc --noEmit` is clean. The full `vitest run --testTimeout=60000` exits 0: 454 files
passed and 4 skipped, 8,346 tests passed. `node tools/orphans.mjs` reports 24, the same as main. None
of the touched files is in `docs/CONTRACTS.md`.

| Issue | Round-13 acceptance check, as I ran it | Result |
|---|---|---|
| PR-0109 | Prep Esc for each of the 14 playable cards (in reverse order) at 1600x900, 2000x1012 and 390x844: `selectedId` = that chapter in **42 of 42**. Results return for **all 14** chapters at all three sizes (the builder did 3): **42 of 42**. That covers 30 victory CONFIRMs and 12 defeat CHAPTER SELECTs; the fight was settled by the debug `autoBattle` at skip speed, and the board, prep and results used real keys. A same-tab reload, after moving the cursor without confirming, came back on the last confirmed card at all three sizes: 3 of 3. 0 console errors, 0 HTTP ≥ 400. | **Pass** |
| PR-0214 | The round-13 probe: Ch I pre-scene 2.5 s, Esc, 1 s, Esc, then read after 1.5 s. `music.current` was **null in 3 of 3** (it was `pause` while paused). The Ch I battle resumed to `boss-seymour`, the Ch V pre-scene to `scene-farplane` and the Ch V battle to `boss-vegnagun`. As an extra FFX-2 check, the Ch IV pre-scene resumed to `scene-bevelle-underground` and the Ch IV battle to `boss-ffx2-aeon`, all at gain 1. | **Pass**, no regression in either game |
| PR-0158 | Real Escape at 0.5, 1, 2, 3 and 4 s after battle mount in Ch I and Ch VI, with the scene held through by Enter presses (no debug skip): 10 of 10 with 0 console or page errors. At 0.5 and 1 s the key was ignored; from 2 s the pause opened and Esc closed it. 4 s later the screen was `battle` and the presenter was not aborted. | **Pass** |
| PR-0100 | Fresh `dist/`: 0 files under `audio/candidates` (the folder is gone). `qa.mjs --strict` exits 0. `audition.html` opened headless from `file://`: **72 of 72** sources reach `canplay`, including the 31 candidates it names. The sources are still on disk (291 matches under `public/`). | **Pass** |
| PR-0173 | Fresh `dist/`: 0 `art/**/*.raw.png` and 0 `art/**/*.N.png|json`; 825 files, 411 MB. The art manifest lists no numbered or raw entry. In every run above, which entered the battle of all 14 chapters at three sizes plus prep, pause and results, **0 responses were ≥ 400**. | **Pass** |
| PR-0099 (docs half) | THEMES.md "The chapter cue map" has rows for VI, X, XI, XII, XIII and XIV (and for all 15). A grep for leblanc, natus, omnis, isaaru, fallen and trema hits each one. `themes-audit.mjs` exits 0 with "0 chapter(s) depart"; it sets exit 1 when a row is missing or differs (unit test). I checked the cited decisions (D-018, D-048, D-063, D-091, D-112, D-145, D-146, D-147, D-148, D-186, D-190, D-209) in `decisions.json`: each exists and says what its row claims. No cue was composed. | **Pass** (the D-168 listening agenda for the owed cues is the other half; it is not part of the acceptance check) |
| PR-0215 | Ch III, the engine's own stalemate watch debug-set (`rt.progress`), then real Enter presses: the fight ended as `escape` and the results panel appeared. RETRY led to prep, then Enter led to battle. CHAPTER SELECT led to the board on `braskas-final-aeon`. Save: only `playTimeMs` changed; `attempts` and `cleared` did not. **But the card reads "Defeat" and "DREAM'S END — INSIDE SIN · FELL" and nothing on it explains the withdrawal.** | **Acceptance FAILS on "a results card explains the withdrawal"**. The builder stopped that half correctly: it is new copy on a screen Bailey sees, in a file another branch owns (rules 9 and 10). PR-0215 must stay **open (partial)**, not cleared. |
| PR-0216 | Not claimed as fixed, and no code changed. Not re-run. | n/a |

**Class A.** Every change routes to, remembers or guards something that already exists, or prunes
files from the build. There is no new perceivable element, no invented data and no boss number.
Approved art is untouched, because the prune works only on `dist/` and uses `lstat`. The one rule
note: `BattleScreen.ts`, already over 400 lines, grew from 919 to 924, the guard only (disclosed).
`deploy-pages.mjs` (708 → 717) and `qa.mjs` (+5) were already over 400 too, and their new logic
lives in `tools/dist-filter.mjs`.

**Merge condition (regression in the critic tooling, not in the game).** After PR-0109,
`critic/runner/lib/play.mjs:68-70` presses ArrowRight `idx` more times after an Esc from prep. The
board now comes back on chapter `idx` and wraps (`chapterGrid.ts`, "wrapping"), so the capture harness
would confirm chapter `2·idx mod n` and go on to capture the **wrong chapter** without an assertion
failing. `supp.mjs` and `gap-audio.mjs` count presses only from a fresh profile, where the board still
opens on Chapter I, so they are unaffected. `t1-b5`, which owns `critic/runner`, has no commit touching
`play.mjs`. Do not merge this branch to main ahead of that fix: it has to land in the same merge or
before it.

## REPAIR (one cycle, 2026-09-26, rule 15)

Blockers in scope: PR-0215, whose acceptance check failed in the CHECK above, and the `play.mjs` merge
condition.

| Item | Outcome | Commit | Evidence |
|---|---|---|---|
| PR-0215 (FFX stalemate to results with RETRY) | **Backed out, still open.** | `7d3d9081` reverts `db0bd923` (the routing and its unit test) | The acceptance needs "a results card explains the withdrawal". The only card the routing could reuse is the Defeat panel, and it reads "Defeat" and "`<LOCATION>` · FELL". Explaining the withdrawal means new copy on a screen Bailey sees (rules 9 and 10) in `ResultsScreen.ts`, which branch `r21-results-phone` owns (its `4924aa79` rebuilds the phone results). That is a design choice, so the item goes back out rather than shipping a card that says the party fell when it did not. Real keys on a fresh production build (`vite preview` on 5970, stopped by its PID): Ch III with the stalemate watch debug-set and Enter presses goes `battle` → `chapter-select`, with the board on `braskas-final-aeon`, at 1600x900 and 390x844, 0 console errors and 0 HTTP ≥ 400. That is the live behaviour again. Evidence: `docs/screenshots/t1-b4b/repair/` (not committed; driver `tools/zz-t1b4b-repair.tmp.mjs`, untracked). |
| `critic/runner/lib/play.mjs` overshoot after PR-0109 | **Still open, not this batch's to fix.** | none | The brief keeps this batch out of `critic/`; `t1-b5` owns `critic/runner`. The merge condition in the CHECK stands: `t1-b4b` must not merge to main before or without the `play.mjs` change (move to a target chapter id, not a count of ArrowRight presses). |

**The question for Bailey (PR-0215).** When an FFX fight trips the stalemate rule ("The battle
cannot be won from here."), what should the results card say, and where? The earlier routing and its
test can come back unchanged once the wording is chosen (`git revert 7d3d9081`). Options to show him as
frames, cheapest first:
- A. The Defeat panel as it is, with only the caption changed: "INSIDE SIN · WITHDREW" in place of "FELL".
- B. A: plus the engine's own line, "The battle cannot be won from here.", set under the heading where
  a victory card puts its quip.
- C. A heading of its own ("Withdrawn" in place of "Defeat"), the engine line under it, then RETRY /
  CHAPTER SELECT as now.

Every option is copy on `ResultsScreen.ts`, so it lands after `r21-results-phone` merges, or in that
branch. The rule is FFX only (the FFX-2 engine has no stalemate watch); the card is a shared screen.

**After the repair.** `npx tsc --noEmit` is clean. The full `vitest run --testTimeout=60000` result is
below. `node tools/orphans.mjs` reports 24, the same as main.
The suite exits 0: 453 files passed and 4 skipped, 8,343 tests passed. That is one file and three
tests fewer than before, because the back-out removed `flow-stalemate-results.test.ts`.

**Batch state after the repair.** Five items stay fixed and checked: PR-0109, PR-0214, PR-0158, PR-0100
with PR-0173, and PR-0099's docs half. PR-0215 is open with the question above. PR-0216 was not
reproduced. The branch is green but may not merge ahead of `t1-b5`'s `play.mjs` fix.

## RE-CHECK (independent, 2026-09-26, neither the builder nor the repairer)

Checked `3d914581`. The suite and the browser checks ran in this worktree. Its `node_modules` is its
own copy and `public/art` is a junction. I made a fresh production build (`vite build`, where the plugin
printed "left out 291 unshipped file(s)") and served it with `vite preview` on 5975. I stopped the
server by its PID (60192), and nothing listens on 5975-5979 now. The browser was headless Chromium with
`PYREFLY_BROWSER=gpu`, pressing real keys. My own driver is `tools/zz-t1b4b-recheck.tmp.mjs`
(untracked), and the evidence is in `docs/screenshots/t1-b4b/recheck/` (`recheck.json` and JPEG
frames, not committed).

**Suite.** `npx tsc --noEmit` is clean. The full `vitest run --testTimeout=60000` exits 0, with 453 files
passed and 4 skipped, and 8,343 tests passed. `node tools/orphans.mjs` reports 24 orphans, the same as
main. `qa.mjs --strict` exits 0. `themes-audit` reports 0 chapters departing from the chapter cue map.

| Item | What I ran | Result |
|---|---|---|
| PR-0215, backed out | The code first. Across `3665f1eb..3d914581`, `git diff` shows no change to `src/app/screens/BattleScreenFlow.ts` (`7d3d9081` is the exact inverse of `db0bd923`), and `flow-stalemate-results.test.ts` is gone. `main` has not touched `src/` since `3665f1eb`, so the file is byte-identical to main. Then the browser, in Ch III at 1600x900 and 390x844: I debug-set the engine's stalemate watch (`rt.progress`) and pressed real Enter. The screen history was `battle` → `chapter-select` at both sizes, **never `results`**, and the board came back on `braskas-final-aeon`. | **Fully gone.** Behaviour matches main and live. The item stays **open** with the wording question for Bailey (options A, B and C above). |
| `critic/runner/lib/play.mjs` merge condition | `t1-b5` at `077a1816` still presses ArrowRight `idx` times after the prep Esc (lines 68-70, unchanged since `df9e588c`, which is already on this batch's base). Its new `route.mjs` moves to a target id (`selectedId === target`), so that driver is safe. `play.mjs` is not. | **Still open.** It blocks the merge, not the batch's code: `t1-b4b` must not merge to main before or without the `play.mjs` fix, which belongs to `critic/runner`'s owner. |
| Kept items, spot regression check (both games) | PR-0109: prep Esc for `seymour-flux` and `ffx2-leblanc` came back on that card, 2 of 2. PR-0214: the Ch I pre-scene went null → `pause` → **null**, and the `ffx2-leblanc` battle went `boss-ffx2-aeon` → `pause` → `boss-ffx2-aeon`. PR-0158: in both chapters, Esc 0.5 s after mount was ignored, and at 3 s Esc opened the pause and Esc closed it. That was 4 runs with 0 console or page errors. PR-0100 and PR-0173: the fresh `dist/` has no `audio/candidates`, 0 `*.raw.png` and 0 numbered `*.N.png|json`, 825 files in all. | **Pass, no regression** |

In every run there were 0 console errors, 0 page errors and 0 HTTP responses of 400 or above.

**Stale records, minor, not changed here (the brief allows this section only).** The "Fixed" table at
the top still lists PR-0215 as a row with `db0bd923`. The committed frames `stalemate-results-ch3.jpg`
and `stalemate-retry-prep-ch3.jpg`, and `stalemate-run.json`, show the backed-out routing. The REPAIR
section supersedes all three, but a reader who stops at the table would take PR-0215 as fixed.
Whoever next edits this file should mark the row "backed out (`7d3d9081`)".
