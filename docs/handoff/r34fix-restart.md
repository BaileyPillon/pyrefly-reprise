# r34fix-restart: RESTART ENCOUNTER and REPLAY BRIEFING (PR-0283, PR-0284)

Branch `r34fix-restart`, cut from rel34 `95e62e38` (before the audio fold). Worktree `D:/pyrefly-fb-onboard`.
Issues from deep round 18b (`critic/rounds/round-18b.json` / `.md` in the main tree).
Both are **fixed**; both game cases are **both** (shared pause and flow plumbing, CHK-020).

| PR | Severity | Result | Commit |
|---|---|---|---|
| PR-0283 | major, both | fixed | `ddae31ba` |
| PR-0284 | major, both | fixed | `e10a133a`, then `114c5b01` + `2b46fab8` (mounted inside the pause layer; 114c5b01 alone removes the CSS but still imports it, so only the pair builds) |

Probes are headless Playwright (`PYREFLY_BROWSER=gpu`) with real keys, mouse clicks and touch taps, seed 1, against
a dev server on 5420 (stopped). Scripts and every run.json and frame are in
`D:/Tools/pyrefly-scratch/2026-10-01-rel34/restart/` (`rp.mjs` checks acceptance, `fr.mjs` checks the first run and
the camera, and `sP-pause.mjs` and `glib.mjs` are the round-18b scripts pointed at this server).

## PR-0283: after RESTART ENCOUNTER the title root stayed mounted over the restarted fight

**Cause (traced):** `BattleScreen.requestExit('restart')` aborted the fight and then called `app.runChapter(...)`, which
started a **second** chapter run next to the one that owned the fight. The owner was the title's `GameFlow.start`
loop (or `main.ts`'s board handler). It treated the aborted chapter as ended and put the board up. The restart's battle
then replaced the board. When the board was torn down it resolved `done` with `null`, so the loop called
`goto('title')` at the same moment the restarted battle was being pushed. The stack ended as `[title, battle]`.

**Fix:** a fight ended by RESTART ENCOUNTER now sets `restartRequested` on its `BattleScreenResult`.
`GameFlow.runChapter` wraps `playChapter` in `runWithRestarts` (`src/app/screens/pause/restartCarry.ts`), which plays
the chapter again in place with the same `RESTART_RUN` options as before. The Ch XI checkpoint carry still goes through
`openRun` / `closeRun`, unchanged. `flowOwnsRun` lets the screen tell whether a run owns it. Only a fight that no run
owns (a direct `goto('battle')`) still starts its own run, the old way. `BattleScreen.ts` (920 lines) and
`BattleScreenFlow.ts` (525 lines) do not grow.

**Before (95e62e38):** roots and stack were `["title","battle"]`, with "PRESS ENTER" / "TAP TO BEGIN" visible:
- Ch I by keys at 1600x900: from 2 s to 44 s, then `["title","results"]`.
- Ch IV by click at 1600x900 and by taps at 390x844: at 2 s, 6 s, the first menu and one turn later.

**After:** roots `["battle"]`, stack `["battle"]` and 0 visible PRESS ENTER / TAP TO BEGIN at 2 s, 6 s, the first menu and
after one turn, in 6 of 6 runs:
- Ch I (FFX) and Ch IV (FFX-2), each by keys and by click at 1600x900 and by taps at 390x844.
- The round-18b script ran Ch I by keys through to results: `["battle"]` the whole time, then `["results"]`.

**Tests:** `tests/unit/pause-restart-owner.test.ts` (new, 6 tests, FFX `seymour-flux` and FFX-2 `ffx2-bahamut`). It checks
that from the title's flow loop nothing comes up between the two fights, the board returns only after the restarted fight
and its results, and the title appears only when the player backs out. It also covers repeated restarts and the
`main.ts` path. The existing restart and checkpoint suites pass unchanged.

Screenshots: `docs/screenshots/r34fix-restart-ffx2-restart-before-after-1600x900.png`,
`docs/screenshots/r34fix-restart-restart-before-after-390x844.png`.

## PR-0284: REPLAY BRIEFING opened under the pause UI

**Cause (traced):** `.pause` is a fixed layer at `z-index: 999` (`src/ui/common/pause-screen.css`). The briefing mounts on
`#ui` at `coach.css`'s `z-index: 90`, so the replay played under `DIV.pause__ui`. Because its keyboard claim is
exclusive, the pause was also dead to keys while the replay ran unseen. A click or tap landed on the pause, not the
briefing, and ESC RESUME did nothing until the 20 s timer ran out (base run `rp-brief-*-before`).

**Fix:** `PauseOverlays.replayBriefing` passes the pause's own layer (`host.root()`, which is `.pause__stage` inside the
fixed `.pause`) as the briefing root: `makeBriefing(app, root = app.uiRoot)` in `raiseBriefing.ts`. The briefing is the
last child of that layer. Nothing inside the pause sheet declares a `z-index`, so the briefing's own 90 sits on top of the
pause chrome, and `.pause` keeps the codebase's highest `z-index` (999, `tests/unit/ui-pause-stack.test.ts`).

A first attempt added a `z-index: 1000` class (`e10a133a`). The full suite's `ui-pause-stack.test.ts` correctly rejected
it, so the follow-up commit replaces it, and the parked CSS is in `F:/pyrefly-parked/2026-10-01/`.

The first-launch briefing (title -> board) still mounts on `#ui` at 90 and is untouched: re-checked on a fresh profile.
A replay inside an FFX-2 chapter looks the same as the first-launch frame: gold accents, the same layout.

**Before:** `elementFromPoint` found `DIV.pause__ui` at all four sample points at 0.5 s and 2 s:
- Ch I by Enter and by click at 1600x900 (round-18b script), Ch IV by click at 1600x900, Ch I by tap at 390x844.

**After** (final mount, `rp-brief-*-after3`): the briefing is on top at all four points at 0.5 s and 2 s, by keys, click
and tap, Ch I and Ch IV, 1600x900 and 390x844 (6 of 6 runs):
- A click or tap on the briefing closes it to the pause, and ESC RESUME returns to the fight.
- By keys, Esc closes the briefing to the pause. From there the pause's own rule applies: Esc from a focused row first
  moves focus back to the tab strip, and a second Esc closes the pause. A control run without the briefing behaves the
  same way (`rp-ctl-*`), so this is not part of the defect. The acceptance line ("one Esc ... returns to the pause and
  one more to the battle") holds from the tab strip.

**Tests:** `tests/unit/pause-replay-briefing-layer.test.ts` (new, 3 tests). It checks that the replay mounts last in the
pause's layer, that a click takes it down and gives the keyboard back, that the pause sheet declares no `z-index` but
`.pause`'s 999 while the briefing keeps 90, and that the first-launch briefing still mounts on `#ui`.

Screenshots: `docs/screenshots/r34fix-restart-ffx-briefing-before-after-1600x900.png`,
`docs/screenshots/r34fix-restart-ffx2-briefing-before-after-390x844.png`.

## Approved looks checked as unaffected

Each run used a fresh profile (`fr.mjs`): Ch I at 1600x900 by keys, and Ch IV at 390x844.
- **First-run O2:**
  - The title's Enter brings up the first-launch briefing on top, on `#ui` at z 90.
  - Enter skips it, and the board guide is armed.
  - In FFX, guide step 3 is on the first command line. In FFX-2 the guide ends at the battle, as designed.
- **Calm camera (D-291):** `__pyrefly.cam()` reads `calm` in the first fight and again in the restarted fight, in both games.

## Gates

- `npx tsc --noEmit` clean.
- The 32 test files for the touched modules pass, 349 tests: the flow, restart, checkpoint, pause, coach and briefing
  suites and the two new files.
- Full `npx vitest run --testTimeout=60000`: 710 files passed and 5 skipped. 10,619 tests passed, 42 were skipped and 1 is a todo.
- `node tools/orphans.mjs` reports 24 orphans, all old. None are new files.
- Rule 7: `BattleScreen.ts` stays at 920 lines and `BattleScreenFlow.ts` at 525. New and edited files are under 400
  lines (`restartCarry.ts` 124, `PauseOverlays.ts` 156, `raiseBriefing.ts` 91).

## askBailey

- None needed for these two fixes.
- Optional, not decided here: after the replayed briefing closes by keys, the pause keeps the focus on the REPLAY BRIEFING
  row. Leaving takes two Escs (row -> tabs -> fight), the same as any row. If the critic's acceptance means one Esc from
  the row, that is a change to the pause's Esc rule for every row. That is a decision for Bailey, not this fix.

## Observations (not changed)

- On the phone, the restarted fight's entry shows the stage in the upper part of the screen with the HUD area dark until
  the HUD mounts, about 6 s in. The restarted fight plays the ordinary battle entry, so this was not compared against a
  first entry at the same moment.
- Esc to open the pause also skips the first-run guide (`firstRunGuide.ts`: "Esc ... every step seen"). This is old
  behaviour and is not touched.

## Check (independent, 2026-10-01)

Checked `f8b2173e` against base `95e62e38` with headless Playwright (`PYREFLY_BROWSER=gpu`), real keys, mouse clicks
and touch taps, seed 1, one dev server on 5430 (stopped). The base runs were done in this worktree with HEAD detached
at `95e62e38`, and the worktree was then switched back to `r34fix-restart`. Scripts, `run.json` files and frames are in
`D:/Tools/pyrefly-scratch/2026-10-01-rel34/restart-check/` (`chk.mjs`, `look.mjs`, `chain.mjs`, `entry.mjs`, `fr.mjs`).
Verdict: **both fixes hold, no regression found, no blocker.**

**PR-0283 (RESTART ENCOUNTER), both games: fixed.**
- Reproduced on the base: Ch I by keys at 1600x900 and Ch IV by taps at 390x844 gave roots and stack
  `["title","battle"]`, with PRESS ENTER / TAP TO BEGIN visible, at 2 s, 6 s, the first menu and after one turn.
- On `f8b2173e`, every sample (2 s, 6 s, first menu, one turn) showed `["battle"]` and no title text, in each run:
  - Ch I by keys at 1600x900, restarted twice in a row.
  - Ch I by taps at 390x844 with TEXT SIZE 130 %, REDUCE MOTION on and BATTLE HELP OFF, restarted twice.
  - Ch IV by taps at 390x844, then CHAPTER SELECT: `["chapter-select"]`.
  - Ch IV by click and Ch I by keys at 1600x900, and Ch IV by taps at 390x844, each played on to the results panel:
    `["results"]`. From the results, CHAPTER SELECT gave `["chapter-select"]` with no title text, both by click
    (Ch I) and by tap (Ch IV). After the defeat panel, RETRY re-entered the fight with `["battle"]`.
  - FFX-2 chain seam, Ch XI: autoplay was used only to get past Shiva, and the restart was done by real keys in the
    Magus Sisters link. The fight re-entered the Sisters link (the FA3 = b checkpoint carry), with `["battle"]` at
    2 s, 6 s and the first menu.
- Approved looks, re-run with `fr.mjs` on a fresh profile (Ch I by keys at 1600x900):
  - The first-launch briefing is on `#ui` at z-index 90 and on top.
  - The board guide is armed, and guide step 3 appears on the first command menu.
  - `cam()` reads `calm` in the first fight and in the restarted fight.

**PR-0284 (REPLAY BRIEFING), both games: fixed.**
- Reproduced on the base: Ch I by keys and Ch IV by click at 1600x900. At 0.5 s the briefing was under the pause at
  all 5 sample points. In the Ch IV click run it still covered the screen unseen after the click, and three ESC RESUME
  clicks left the pause up.
- On `f8b2173e`, the briefing was on top at all 5 points at 0.5 s and 2 s, and closing it returned to the pause:
  - Ch IV by taps at 390x844 with TEXT SIZE 130 %, REDUCE MOTION and BATTLE HELP OFF. No briefing text fell outside
    the viewport.
  - Ch I by keys at 1600x900 with the same comfort settings.
  - Ch I by click at 1600x900.
  - Then ESC RESUME by click or tap, or two Escs by keys, returned to the fight. By keys it takes two Escs: the first
    goes from the row to the tabs and the second leaves the pause. The base behaves the same way.
- First-launch briefing compared with the replay (`look.mjs`):
  - Ch I at 1600x900 and Ch IV at 390x844 with TEXT SIZE 130 %.
  - In both, all 13 text nodes have the same font, size, weight, case, spacing, colour and box.
  - The two PNG frames 2 s in are pixel-identical (mean difference 0.0).

**Gates, re-run:**
- `npx tsc --noEmit` is clean.
- Full `npx vitest run --testTimeout=60000`: 710 files passed and 5 skipped. 10,619 tests passed, 42 were skipped and
  1 is a todo.
- `node tools/orphans.mjs` reports 24 orphans, all old.
- Rule 7: `BattleScreen.ts` is 920 lines and `BattleScreenFlow.ts` is 525, the same as on the base. The other touched
  files are under 400 lines.
- `git diff 95e62e38..f8b2173e -- src/battle` is empty. `SaveData.ts` and the settings schema are untouched.
- Rule 14: every commit names its game case ("both games").

**Builder's observations, re-measured once:**
- The phone entry with the HUD area dark: Ch IV at 390x844, mean luminance of the bottom 45 % of the screen.
  - First entry, timed from the battle screen going up: dark (7/255) from 0.9 s to 6.8 s, HUD lit at 7.1 s, first
    menu at 8.6 s.
  - Restarted entry, timed from the row tap, which includes about 1.6 s of the pause closing: dark from 2.2 s to
    7.8 s, HUD lit at 8.1 s, first menu at 9.6 s.
  - The dark period is the same, about 6 s, so the restart introduces nothing here. Whether the ordinary entry
    should show a dark HUD band for 6 s on a phone is a separate taste question, not decided here.
- Esc skips the first-run guide: this is by design (`firstRunGuide.ts`, steps 1 and 2 only). Not changed.

**New finding, present on the base, not caused by this branch (major, both games):**
- Pause, then QUIT TO TITLE, leaves two title roots: stack `["title","title"]`, with PRESS ENTER visible twice.
- After Enter back to the board, the stack is `["title","chapter-select"]`, with the title still mounted under the
  board.
- Reproduced the same way on `95e62e38` and on `f8b2173e`, by click at 1600x900 in Ch IV, with and without a restart
  first. The probe is `chk.mjs restart ffx2-bahamut click --then=title --norestart`.
- Suspected cause (not traced): the same pattern as PR-0283. `requestExit('title')` waits for the flow to unwind and
  then calls `goto('title')`. Meanwhile the title loop's board is torn down, answers "no chapter", and also calls
  `goto('title')`.
- Not fixed here, because it is outside this brief.

**Minor:** `114c5b01` does not build on its own (disclosed by the builder). Only the pair with `2b46fab8` builds, which
makes a bisect across it awkward. Nothing to change before the merge.

## r34fix-quit: QUIT TO TITLE left two titles mounted (found by the check above; both games)

Branch `r34fix-quit`, cut from `r34fix-restart`. Game case: **both** (shared pause and flow plumbing, CHK-020).

**Cause (traced):** the same race as PR-0283. With a run owning the fight, `BattleScreen.requestExit('title')` aborted the
fight and waited for the flow to unwind, and the flow put the board up (`chapterSelect`), so the pause then called
`goto('title')` over the board. The board's teardown answered "no chapter", and the flow called `goto('title')` too. Two
navigations to the title, from two owners: stack `["title","title"]`; after Enter, `["title","chapter-select"]`.

**Fix:** a fight ended by QUIT TO TITLE inside a run now sets `quitToTitle` on its `BattleScreenResult` (as
`restartRequested` does) and does not navigate itself. `runWithRestarts` (`pause/restartCarry.ts`) takes an optional
`toTitle`, and `GameFlow.runChapter` passes it: the run that owns the stack makes the one `goto('title')`, with
nothing put up in between, and marks the flow handed over so the title loop stands down. `main.ts`'s board handler
skips its follow-up `goto('chapter-select')` when the run already went. A fight no run owns (a direct `goto('battle')`)
still takes the old path in the screen. RESTART ENCOUNTER and CHAPTER SELECT are untouched. `BattleScreen.ts` stays 920
lines and `BattleScreenFlow.ts` 525 (no growth).

**Before (live code in the main tree, port 5531):** Ch IV by click at 1600x900, no restart: after QUIT TO TITLE stack
`["title","title"]`, 2 visible PRESS ENTER; after Enter `["title","chapter-select"]`; starting a chapter
`["title","battle"]`, PASS false (`quit/ev/restart-ffx2-bahamut-click-1600x900-before3`).

**After**, real input, seed 1, headless Playwright on port 5530 (stopped), `quit/chk.mjs ... --then=title`
(`D:/Tools/pyrefly-scratch/2026-10-01-rel34/quit/ev/`): after QUIT TO TITLE stack and roots `["title"]`, 1 PRESS ENTER,
still so 4 s later; Enter gives `["chapter-select"]` with 0 title text; starting the chapter gives `["battle"]` only.
All PASS, 0 page errors:
- Ch IV (FFX-2) click 1600x900: without a restart (q1) and after a restart (q2).
- Ch IV taps at 390x844: without (q3) and after a restart (q4).
- Ch I (FFX) keys 1600x900: without (q5) and after a restart (q6); taps at 390x844 (q7).
- RESTART ENCOUNTER (PR-0283) still correct: Ch I keys (q8) and Ch IV click (q9), `--then=restart`.

**Tests:** `tests/unit/pause-restart-owner.test.ts` gains 6 tests (FFX `seymour-flux`, FFX-2 `ffx2-bahamut`): from the title's
flow loop exactly one `goto('title')` and no board between; after a restart first; from a run `main.ts` started
(`quitToTitle` on the result, one navigation).

**Gates:** `npx tsc --noEmit` clean; the pause, flow and restart vitest files (11 files, 193 tests) pass; full suite
result 710 files passed, 5 skipped, 10625 tests passed; `node tools/orphans.mjs` 24 orphans, all old.
