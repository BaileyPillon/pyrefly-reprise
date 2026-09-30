# r33-fix: round 18's HOLD (PR-0281) and the O3 hint card (PR-0282)

**Branch:** `r33-fix` (from main 770823bc = release 33's candidate 65152c1b plus docs records).
**Not pushed, not deployed.** The driver pushes; the candidate still owes a deep report for the
new commit before deploy (save-data class, round 18 "Next required review").

## PR-0281 (critical, FFX-2 only): a girl carrying Stop across a seam stalled the chain

**Game case: FFX-2 only.** The freeze look exists only in FFX-2's table (`statusLooks.ts`, sourced:
research/status-display.md); FFX has no freeze, and the new test pins that.

**Cause (proved):** status O3's Stop freeze ran the stopped figure's whole `update` at dt 0, so her
`PaintedActor.tweens` stood still too. `BattleMoments.slidePartyIn` awaits `actor.moveTo(home)`
for every party figure outside any action, so the seam's opening never finished
(`moment:battle-start` for ever).

**Fix** (`src/ui/common/statusFigureTint.ts`): the freeze holds only the figure's idle/life clock
(breath, sway, posture, ring pulse, yaw). While frozen the wrapper advances the figure's TweenGroup
itself, at the same `paceRate('action')` `PaintedActor.update` uses, then runs `update(0)`. Every
presenter move (slide-ins, `moment:*` phases, seams, hit reactions, fades) is a tween, so none can
wait on a stopped figure; the sourced look (a still figure) is unchanged. `PaintedActor.ts` is not
touched (2026 lines, must not grow). Rule 1: presentation only, no engine state or RNG.

**Which chapters were exposed.** Only seams that carry statuses: XV Den of Woe links 2 and 3
(`carriesFullPartyState`) and XIII Trema's Paragon -> Trema link (`carriesPartyState`). Every
other FFX-2 chain (V Vegnagun, LeBlanc, Fallen Aeons) carries HP, MP and items only, so no girl
opens a link in Stop there. A fresh battle never opens with Stop.

**Proof** (headless Chromium, PYREFLY_BROWSER=gpu, 1600x900, own static servers on 5871/5872;
scratch harness `.r33-tmp/stop-seam.mjs` (all scratch parked at `F:/pyrefly-parked/2026-09-30/r33-fix-scratch/`), labelled setup hook: Stop in the engine's own record
shape on Yuna at link 1's first open menu, enemies at 1 HP so the link ends and the next opens
with Stop carried by the engine's own seam):

| Build | Chapter | Runs | Stop carried into | Stalls |
|---|---|---|---|---|
| main (index-DP4ruBbc.js, byte-identical to the candidate) | XV Den of Woe | seeds 1-6 | link 2 | **6 of 6** at `moment:battle-start` (link 2) |
| main | XIII Trema (Paragon link) | seed 1 | Trema | **1 of 1** (a second exposed chapter, new) |
| fix | XV Den of Woe | seeds 1-10 | links 2 and 3 (20 seams) | **0**; each link's first action or menu 6.1-6.3 s after it opened; every run reached results |
| fix | XIII Trema | seeds 1-2 | Trema | **0** |
| fix | V Vegnagun, LeBlanc, Fallen Aeons | seeds 1-2 each | (not carried: no status carry) | 0 |
| fix, `fight` mode (Stop kept on Yuna, re-applied whenever it lapsed, 'intended' play) | IV Bahamut, Ixion, XIII Trema, V Vegnagun, XV Den of Woe, LeBlanc, Fallen Aeons | seed 1 each (2 to 25 re-applications) | every scripted moment on the way (openings, telegraphs, Trema's own Stop) | **0** (4 reached results, 3 ran the 360 s budget with continuous progress) |
| fix, final commit's build | XV Den of Woe | seed 11 | links 2 and 3 | 0 |

Real keys, fix build, 1600x900, round 18's own route (`route18d.mjs`, copied to
`.r33-tmp/route-r33.mjs`, seed 1): **victory**. Yuna entered link 2 at 2057 HP with Protect +
Stop (the round-18 confirmer's exact state) and link 3 with Protect + Stop + Silence; each link's
opening handed over in 6.6 s and 7.2 s; then post scene, results, CONFIRM scene, board, and a
reload that kept the clear; 0 console errors, 0 assert fails, 7 minutes. Frames:
`docs/screenshots/r33-fix/pr0281-ch15-link2-first-menu-after-realkeys.jpg` (Yuna home, STOPPED on
her card) and `...-results-after-realkeys.jpg`; the main build's stall frame is
`pr0281-ch15-link2-stall-before.jpg` (Yuna absent, no HUD: round 18's picture).

Unit: `tests/unit/status-o3-stop-seam.test.ts` (a stopped girl's 520 ms slide finishes on time and
her idle clock stays frozen; lifting Stop restores the figure's own update; FFX has no freeze).
The first case fails on main (the slide never resolves), passes on the fix.

## PR-0282 (major, both games, inside O3): the cure hint covered commands and ignored BATTLE HELP

**Game case: both** (shared O3 plumbing; the desktop half is the FFX HUD's advisor solver, the
only HUD whose card reached the hint's slot).

- **BATTLE HELP OFF hides it** (`statusHintCard.ts`: the card reads `battleHelpOn()` every frame).
- **Phone:** at the command menu the card docks just above the party chips (JS from the
  `.ig-stat-list` rect, CSS fallback `bottom: calc(var(--phud-chips) + 68px)`), clear of the TIP
  line and every command row; at the target step it stays under the target card (the approved
  mockup's order). The FFX-2 phone message line now keeps above the docked card
  (`withStatusLooks.ts`, the line's floor list).
- **Desktop FFX:** the card is an obstacle for the move advisor's solver
  (`hudAvoidSelectors.ts` `STATUS_HINT_SELECTOR`, beside `ADVISOR_PANEL_SELECTORS`; visible cards only). Deviation from the
  brief's wording "the advisor card moves down": at 1600x900 in Chapter I the band left under the
  hint is about 50 grid px and the card needs 83 (72 + the chip's 11), so the solver moves the
  card to its next clear box, right of the hint column (x 410, 285x245), instead of under it.
  Stacking both in the left column would need a smaller card than the solver allows.

**Proof** (`.r33-tmp/hint-probe.mjs`, rect measurements; hint injected on Kimahri (Zombie, Ch I)
and Paine (Curse, Ch IV) at the first open menu):

| Case | main | fix |
|---|---|---|
| Ch IV phone 390x844 touch | covers WHITE MAGIC and CHANGE 60.7 % | 0 overlap with every command row, the TIP card, chips, GUIDE, footer |
| Ch I phone 390x844 touch | covers TALK and ATTACK 87.5 % | 0 |
| Ch I desktop 1600x900, guide folded | 8160 px2 over the NEXT BEST MOVE card | 0 |
| Ch IV desktop 1600x900, guide folded | 0 | 0 |
| guide open, 1600x900, both chapters | 0 (inside the guide) | 0 |
| BATTLE HELP OFF, phone both games and desktop FFX | card visible | no card |
| 2000x1012 both chapters, TEXT SIZE 115/130 on the phone and desktop | | 0; text never clipped |

Unit: `tests/unit/status-o3-hint-place.test.ts` (4 of 6 cases fail on main).

Screenshots: `docs/screenshots/r33-fix/` (before/after, phone both games, desktop Ch I guide
folded, BATTLE HELP OFF, and the main build's link-2 stall frame).

## Checks

- `npx tsc --noEmit`: clean.
- Targeted: `status-o3-*` (5 files), `chapters/sin-hud`, `ui-ffx-hud-safe-zones`,
  `strategy-ffx2-bahamut`: 145 passed.
- Full suite: 10485 passed, 1 failed: `strategy-ffx2-bahamut` "heal-only route" hit the 15 s
  timeout under full-suite load (15.0 s); it is engine-only, untouched here, and passes on its own.
- `node tools/orphans.mjs`: 24 orphans, none new (no module added).
- Files over 400 lines: `FFXBattleHud.ts` changed two lines in place (no growth);
  `PaintedActor.ts` untouched.
- Game case (rule 14): PR-0281 FFX-2 only; PR-0282 both. Rule 1: presentation only.

## Open

- The deep report for the new commit before deploy (round 18: save-data class; reuse CHK-024 with
  a dependency argument) and the live review. The fix touches no save code.
- Round 18's other majors are untouched here (PR-0264 phone tap-commit is the next O3-adjacent one).

## CHECK (independent, 2026-09-30; did not build it)

**Verdict: no blocker.** Branch `r33-fix` at 8588ac7d, checked in place (no pull, no switch).
My own harnesses, not the builder's: `D:/Tools/pyrefly-scratch/r33-check/` (`seam.mjs`,
`hint.mjs`, `look.mjs`, `engine.mjs`, `serve.mjs`, outputs in `out/`, `hint/`, `route-fix/`).
Fresh production builds (`vite build --outDir`, never the shared `dist/`): main 770823bc ->
`index-DP4ruBbc.js` (the candidate's bundle), branch -> `index-DCYkAkI-.js`; both parked at
`F:/pyrefly-parked/2026-09-30/r33-check/`. Headless Chromium, PYREFLY_BROWSER=gpu, one browser at a
time, own static servers on 8910 (main) / 8911 (fix), stopped by PID afterwards.

**PR-0281 (FFX-2 only).** Labelled setup hook: Stop written on Yuna at link 1's first open menu,
enemies at 1 HP, `autoBattle('attack')`; the engine's own seam carries Stop on.

| Build | Chapter | Seeds | Result |
|---|---|---|---|
| main | XV Den of Woe | 1, 2, 3 | **3 of 3 stall** in `moment:battle-start` at link 2 (Shade Gippal), Stop on Yuna |
| main | XIII Trema | 1 | **1 of 1 stall** at the Trema link |
| fix | XV Den of Woe | 1-8 | **0 stalls**; 16 Stop-carrying seams (links 2 and 3), each opening handed over in 5.6-6.2 s; all 8 reached results |
| fix | XIII Trema | 1, 2 | **0 stalls**; opening 6.1 s; results |

Real keys, fix build, 1600x900, round 18's own route (`critic/rounds/round-18/cap/route18d.mjs
ffx2-den-of-woe win --seed=1`): **victory** in 50 turns. Yuna entered link 2 at 2057 HP and
STOPPED (frame `route-fix/.../24-seam-2-first-menu.jpg`: Yuna home, STOPPED on her card, the
menu up). The run went through link 3, the post scene, results, the CONFIRM scene, the board, and
a reload that kept the clear. 0 console errors, 0 fails.

**Looks unchanged** (`look.mjs`, one status at a time on a figure at an open menu, main vs fix):
FFX-2 Stop is still a frozen figure on both builds (idle clock and breath moved 0 in 1.5 s).
FFX-2 curse, pointless, poison, berserk and sleep, and FFX zombie, berserk, curse, poison, stop
and sleep all have identical tint keys and moving idles on both builds. FFX Stop does not freeze,
as intended.

**PR-0282 (both games).** Labelled hook: Zombie on Kimahri (Ch I) / Curse on Paine (Ch IV) at the
first menu; real ArrowDown/ArrowUp to re-sync; `g` folds the guide.

| Case | main | fix |
|---|---|---|
| Ch I phone 390x844 touch | covers TALK and ATTACK (8967 px2 each) and the command stack | 0 command rows; nothing under the card |
| Ch IV phone 390x844 touch | covers WHITE MAGIC and CHANGE (6222 px2 each) | 0 command rows; nothing under the card |
| Ch I 1600x900 guide folded | 0 rows, 8160 px2 over NEXT BEST MOVE | 0 rows, 0 over the advisor card |
| Ch I / Ch IV 1600x900 guide open | | inside the guide panel, 0 rows |
| Ch IV 1600x900 guide folded | 0 rows | 0 rows |
| BATTLE HELP OFF (the save setting the pause row writes), phone and 1600x900, both games | | no card |

**Engine unchanged.** No file under `src/battle` or `src/engine` changed. Battle logs from
`gotoChapter(auto 'intended', speed 'skip')` hash identical on main and fix for seeds 1-5 in
Ch I Seymour Flux (FFX) and Ch IV Bahamut (FFX-2; these logs include Stop and Curse).

**House checks.** `npx tsc --noEmit` is clean. Targeted tests pass: 12 files and 116 tests
(status-o3-*, the safe zones, coach-avoid, zanmato-avoid, omnis-readout, sin-hud), plus the 64
tests in ui-ffx-hud-safe-zones. The full `npm test` ran once: 694 files passed, 10486 tests passed,
0 failed. Orphans: 24, none new. No file over 400 lines grew (`FFXBattleHud.ts` stays at 1668;
`PaintedActor.ts` is untouched). The files that grew are all under 400 lines (statusHintCard 117,
statusFigureTint 240, hudAvoidSelectors 113). `git merge-tree --write-tree main r33-fix` is clean.

**Minor, already on main (not caused by this branch):** FFX-2 desktop with the guide folded, on a
fresh profile. The first-run coach mark (Rikku's line and the GAUGES RUNNING strip) is drawn over
the lower lines of the cure hint at (53,230). The main build shows the same frame. The coach mark
is first-time only and fades on its own. Frames: `hint/fix-ffx2-bahamut-1600-folded.jpg`,
`hint/main-ffx2-bahamut-1600-folded.jpg`.
