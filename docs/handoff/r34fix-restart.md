# r34fix-restart: RESTART ENCOUNTER and REPLAY BRIEFING (PR-0283, PR-0284)

Branch `r34fix-restart`, cut from rel34 `95e62e38` (before the audio fold). Worktree `D:/pyrefly-fb-onboard`.
Issues from deep round 18b (`critic/rounds/round-18b.json` / `.md` in the main tree).
Both are **fixed**; both game cases are **both** (shared pause and flow plumbing, CHK-020).

| PR | Severity | Result | Commit |
|---|---|---|---|
| PR-0283 | major, both | fixed | `ddae31ba` |
| PR-0284 | major, both | fixed | `e10a133a`, then `114c5b01` (mounted inside the pause layer) |

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
