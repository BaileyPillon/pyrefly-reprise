# r17fix-ui: round 17 issues PR-0265 and PR-0266

Branch `r17fix-ui` in `D:/pyrefly-fb-camera` (cut from local `main` cdde9844). Not pushed, not merged, not deployed;
the driver pushes. No NOW.md edit (brief). Evidence: `docs/screenshots/r17fix-ui/`.

## PR-0265 (both games): the pause screen's ESC RESUME does nothing when tapped or clicked

**Case: both.** `PauseScreen` is shared; FFX (Ch I) and FFX-2 (Ch IV) proved below.

- **Cause (proved by running):** the button is `data-action="cancel"` (`pause/markup.ts` `backHtml`, and the `Esc resume`
  hint). `Input.onClick` queues that string; `PauseScreen.handleAction` closed on it only under
  `action === 'cancel' && this.panelsHidden`. With the panels shown a pointer RESUME fell through every branch.
  Before, on the built main: `resume-taps.mjs seymour-flux 390x844 touch` and `... 1600x900` (mouse) both ended every
  RESUME step (`focus on tabs`, `#1 after a row tap`, `#2`) on `screen=pause`; only "H painting only" then `cancel` left.
- **Fix:** `handleAction` closes on `'cancel'` whatever has focus (`PauseScreen.ts`, one line replaced, file stays 400).
  Keyboard is untouched: `handleInput` still has "Esc in the body leaves the body, Esc on the tabs closes"; the action
  path is pointer-only (`input.actions` are `data-action` clicks).
- **Test that fails before:** `tests/unit/pause-resume-pointer.test.ts` (tabs focus, body focus, a repeated tap closes
  once, keyboard Esc semantics unchanged). 3 of 5 fail on HEAD, all pass now.
- **After (real taps and clicks, production build, headless Playwright, PYREFLY_BROWSER=gpu):**
  `resume-taps.mjs seymour-flux 390x844 touch`, `seymour-flux 1600x900` (mouse), `ffx2-bahamut 390x844 touch`:
  "RESUME, focus on tabs" -> `battle`; after OPTIONS + TEXT SIZE row (focus in body) "RESUME #1" -> `battle`
  (the script's `#2` then reports `ok:false` because the button is gone: the pause is closed). Final screen `battle`.
- **Not fixed / notes:** nothing left open for this issue. The hint's `Esc resume` `<b>` (also `data-action="cancel"`)
  now closes as well (same handler).

## PR-0266 (FFX only): TEXT SIZE 115 / 130 % on the desktop command list and key chips

**Case: FFX only** (`src/ui/ffx/*`, the FFX desktop HUD; FFX-2's HUD keys on `data-text-size-wide`, untouched; the
phone battle layout is excluded in code). Pure combat state is not touched.

Two proved causes, two fixes:

1. **Rows never re-capped on the open turn.** `commandRowsCap` (`hudTextSize.ts`) is applied only in
   `CommandMenu.renderStack`, and OPTIONS is reached through the pause over the open menu, so the list drawn at 100 %
   (6 rows) stayed 6 rows while `text-size.css` grew it 1.3x: the `Physical damage` help slab covered TALK
   (measured: row(Talk) x help = 31 620 px2 at 1600x900) and the grown stack ran over the acting character.
   **Fix:** `withTextSizeWatch` (`hudTextSize.ts`), a `MutationObserver` on `<html data-text-size>`, is attached while a
   menu is open (composed into `unwireClicks`, so it is dropped on finish and close) and re-runs `renderStack` unless
   the menu is in `target` state. `CommandMenu.ts` stays 865 lines (two lines changed in place).
   Test that fails before: `tests/unit/ffx-command-menu-textsize-live.test.ts` (open at 100 %, set 130 -> 4 rows and
   the more-arrow, 115 -> 5, 100 -> all; phone keeps every row; a closed menu stops watching).
2. **The key chips were not in the advisor solver.** `hudSafeZones.advisorZone` reserved a fixed 11 grid px above the
   card for `N HIDE MOVES` (the chip grows with TEXT SIZE) and knew nothing of the guide's `G` chip or the battle
   screen's `PAUSE` chip. Measured before: PAUSE x N 1 020 to 1 771 px2 at 1280x720 / 1600x900, N x G up to 3 725 px2 at
   2000x1012, card x G up to 5 662 px2.
   **Fix:** (a) `AdvisorZoneInput.chipReserve` (measured chip height + gap; the old constant stays the floor) in
   `solveCard`; (b) `chipObstacleEls` / `chipReserveOf` (`hudAvoidSelectors.ts`) hand the `.sgd__toggle` and
   `.battle-pause-chip` rectangles to the solver as obstacles. **Both apply only at TEXT SIZE 115 / 130 % on the
   desktop HUD** (`textSizeGrown`): 100 % and the upright phone are pixel-identical to main. `FFXBattleHud.ts` stays
   1668 lines (edited in place, plus `chipReserve` in the solve key), `hudSafeZones.ts` stays 543.
   Test: `tests/unit/ffx-advisor-chip-reserve.test.ts` (reserve strictly shrinks the card in a tight band and the floor
   holds; a corner chip is kept clear; the DOM helpers' gating; the strict-reserve test fails on the old solver).

**Before / after, real keys (Esc, OPTIONS, TEXT SIZE Right), production builds of HEAD and of this branch, chip and
row intersections measured per frame (script `ts-live.mjs`, scratch): seymour-flux (Ch I), yojimbo-cavern (IX),
seymour-omnis (XII) at 1600x900, 1280x720 and 2000x1012, TEXT SIZE 115 and 130 set mid-turn, the same-turn menu, a
second pause cycle, then three later menus:**

| | before | after |
|---|---|---|
| same-turn rows at 115 / 130 (Ch I, XII) | 6 / 6 | 5 / 4 plus the scroll mark |
| row x help slab | 1 805 to 40 110 px2 in Ch I and XII at every size | 0 |
| PAUSE x N, N x G, G x card, PAUSE x card | up to 5 662 px2, present at 115 or 130 in every one of the 9 combinations | 0 in all 9 combinations, all 7 frames each |
| advisor card | up | up in every frame (never folded), up to about 200 px narrower (or moved right of the G chip) at 115 and 130 % |

Screens: `docs/screenshots/r17fix-ui/pr0266-*-BEFORE.jpg` / `-AFTER.jpg` (Ch I 1600x900 and 2000x1012 same-turn at 130,
Ch I next menu at 130, Ch XII 1280x720 at 130). TALK is fully visible, Tidus is visible above the four-row list.

## Not fixed, and why

- **100 % is unchanged by design.** The small `N HIDE MOVES` x `G GUIDE` overlap exists on main at 100 % (816 px2 at
  1600x900, 114 at 2000x1012; PAUSE x N / card x G also at 1280x720 and in Ch XII at 100 %). Fixing it moves the card at
  the default size (Ch I 1600x900: from x 25 to x 174), a change to what every player sees, so it is an **option for
  Bailey (default off)** (AGENTS.md rules 9 and 10), not applied. The change would be dropping the `textSizeGrown`
  gate in `hudAvoidSelectors.ts`; the solver and tests already support it.
- **Party panel over the fallen party at 130 %.** The R17-ON-02 note ("grows over the downed Yuna") is the approved
  target's own geometry (`desk-hud-130.jpg` grows the panel left from its corner to x 846); moving it is a design
  change for Bailey, not a defect fix. Not touched.
- **Ch XII enemy-intent slab over the fifth CTB portrait at 130 %** is on main too (seen in the before frame); a
  separate issue, not touched.
- "0 intersections with the projected actor quads" was checked by the solver's own contract (sprites and bosses are
  obstacles) and by eye in the frames, not by a new per-frame quad probe.
- Row cap is 4 (130 %) / 5 (115 %) as `hudTextSize.ts` documents; at 2000x1012 the earlier "5 rows at 130 %" was the
  same stale-render cause, now 4.

## Checks run

`npx tsc --noEmit` clean; targeted: pause-resume-pointer, pause-panels, ffx-command-menu-textsize-live,
ffx-advisor-chip-reserve, comfort-presenters, ffx-command-menu-paging, ui-ffx-hud-safe-zones, ui-ffx-hud*: pass.
Full `npm test` once: 694 files passed, 1 timeout (`strategy-ffx2-bahamut` "heal-only route", 15 s under load, the
known load flake); re-run alone: 19 of 19 pass. `node tools/orphans.mjs`: 24 orphans, all pre-existing, none mine.
File sizes: PauseScreen 400, CommandMenu 865, FFXBattleHud 1668, hudSafeZones 543 (none grew).
Servers on 8700 / 8701 stopped by PID. Leftovers (`.r17-*` builds and evidence, `tools/zz-r17ui.tmp`) moved to
`F:/pyrefly-parked/2026-09-30/r17fix-ui/`.

## CHECK (independent, 2026-09-30)

Verdict: no blockers. Both fixes hold on a fresh production build of d4296431 (served on 8750, stopped by PID).
- PR-0265: round-17 resume-taps.mjs by real taps/clicks: Ch I 390x844 touch, Ch I 1600x900 mouse, Ch IV (ffx2-bahamut) 390x844 touch: RESUME from the tabs and after a row tap ends on screen=battle. New test pause-resume-pointer fails 3 of 5 with the one-line fix reverted.
- PR-0266: ts-live (real keys) Ch I at 1600x900 and 2000x1012: 115 % = 5 rows, 130 % = 4 rows (same turn, second pause, next menus), TALK present, zero chip/slab HITS at 115 and 130; at 100 % only the disclosed N x G overlap (816 / 114 px2). ffx-advisor-chip-reserve fails 1 of 6 with the chipReserve input removed.
- Rules: FFX-only scope for 266 and both games for 265 as stated; no game data touched; no file over 400 lines grew (line counts equal to main for the four big files; hudTextSize and hudAvoidSelectors are small). tsc clean; git merge-tree against main clean.
- Full suite once: 694 files passed, 1 timeout (strategy-ffx2-bahamut heal-only route, known load flake; passes alone).
- Not checked: Ch IX / XII at 1280x720 (builder's matrix trusted), phone layout of FFX at 115/130 (untouched by design).
