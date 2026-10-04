# r381-ui-floor: independent check (release 38.1 candidate, branch only)

Checked 2026-10-04 by a Sonnet sub-agent of the driver session that did not build the lane. Tip checked: `origin/r381-ui-floor` `0958ff91`
(code commit `9584aecd`, handoff `docs/handoff/r381-ui-floor.md`). Game case of the change under check: the OD clamp is **FFX only**; the floor
holds in FFX-2 unchanged. Nothing was merged into main, nothing was deployed, the merge-test below was never pushed.

## Verdict: PASS

The OD label and bar stay inside the window in every FFX chapter, window and TEXT SIZE tested, through the Overdrive selection and the target
step; the 14 px floor holds in 60 of 60 cells; tsc and the full suite are green on the merge-test. The comparison with the live build shows only
the floor's own, already disclosed residue (below), none of it caused by this lane's delta. No FAIL, so no fix is proposed; three notes at the end.

## Method

- Worktree `D:/pyrefly-r381-ui-check` (detached at `origin/r381-ui-floor`; junctions for `node_modules`, `public/art`, `public/fx`, read only).
- Merge-test: scratch branch `scratch/r381-ui-check-merge`, `git merge --no-commit --no-ff origin/main` (`e2e33e0b`): **clean**, three files
  (`docs/handoff/NOW.md`, `docs/target/decisions.json`, `docs/target/targets.json`; docs only). Not committed, not pushed.
- Candidate build: `vite build` of the merge-test tree (bundle `index-DtDbLx8P.js`, contains `--ffx-od-hang`), served on 7161.
  Live baseline: `D:/pyrefly-rel38/dist-release` (bundle `index-DHaa2xD1.js`, the same bundle name the live URL serves), served on 7162.
  Pre-clamp reference: the builder's `3dd4771b` build (`r381-prep/pre-dist`, the lane before the clamp), served on 7163 (this one is the builder's
  build; the source diff `3dd4771b..9584aecd` was read and is `odHang.ts`, `hud-floor.css`, and two calls in `FFXBattleHud.ts`, nothing else).
- Headless GPU Chromium (`PYREFLY_BROWSER=gpu`), my own harness (`D:/Tools/pyrefly-scratch/2026-10-04/r381-check/`: `lib.mjs`, `od.mjs`,
  `walk.mjs`, `frames.mjs`, `an-od.mjs`, `an-walk2.mjs`), seed 1, TEXT SIZE set with the app's own setter then a reload, all menu input by real
  keys; the debug API only starts the chapter. Two browsers at a time at most, QUIET-PLEASE absent throughout, no timing readings taken.
- **OD run** (`od.mjs`): per chapter x window x TEXT SIZE: first menu, then the party's Overdrive gauges set to 100 through the debug state (the one
  precondition that is not a key press), an Attack turn, the next menu, the OVERDRIVE row selected, its submenu, the first Overdrive chosen
  (the target step), back out, then the Attack target step. Probed at each step: right edge of every party row's OD bar and of its label's text range.
  All 11 FFX chapters (`seymour-flux`, `yunalesca`, `braskas-final-aeon`, `seymour-anima-macalania`, `evrae-airship`, `yojimbo-cavern`,
  `seymour-natus`, `seymour-omnis`, `isaaru-via-purifico`, `sin-fins-core`, `sin-face`) x 1024x768, 1280x720, 1600x900, 390x844 touch x
  TEXT SIZE 1.0 / 1.15 / 1.3 = 132 candidate runs, plus 66 live-baseline runs at 1024x768 and 1280x720.
- **Text walker** (`walk.mjs`): 5 chapters (`seymour-flux`, `yunalesca`, `braskas-final-aeon`; FFX-2 `ffx2-bahamut`, `ffx2-vegnagun-shuyin`) x 4 windows
  (1024x768, 1440x900, 2000x1012, 390x844 touch) x 3 TEXT SIZES = 60 cells, on the candidate and on the live bundle (60 cells), and the 36 FFX cells
  on the pre-clamp build. Steps per cell: first menu with the first-run coach up and down, seven submenus, the Attack target step, every pause tab
  at 1024x768 and 390x844 (838 candidate steps in all). Per step: effective px of every visible text node (computed size x ancestor transform x the
  `scale` property), text-on-text overlaps over 25 % of the smaller box, clipped leaf text, off-window text.
- **Frames** (`frames.mjs`): first menu and Attack target step in 5 chapters x 1600x900 / 1024x768 / 390x844, full frame and HUD-only (canvas hidden,
  CSS animation off), on candidate, live and pre-clamp.

## Numbers

### 1. OD label and bar (screen px; right edge of the right-most one; widest over every chapter, TEXT SIZE and step)

| Window | Candidate label | Candidate bar | Candidate runs / steps | Out of window | Live 38 label / bar, widest | Live out of window |
|---|---|---|---|---|---|---|
| 1024x768 | **1017.7** (Ch III 1.0, Attack target) | **1020.8** | 33 / 233 | **0** | 1028 / 1028 | 11 steps (Ch III, Omnis at 1.3; Yojimbo 1025 at 1.3) |
| 1280x720 | **1273.8** | **1276.0** | 33 / 231 | **0** | 1285 / 1285 | 11 steps (Ch III, Omnis at 1.3; Yojimbo 1281.3 at 1.3) |
| 1600x900 | 1593.8 | 1594.9 | 33 / 231 | 0 | not run | not run |
| 390x844 phone | no label on the card; bar 374 | 374 | 33 / 231 | 0 | not run | not run |

- The widest label is 6.3 px and the widest bar 3.2 px inside a 1024 px window; 6.2 and 4.0 inside 1280. The live bundle reproduces the defect
  (Ch III and Omnis out by 4 and 5 px at TEXT SIZE 1.3, Yojimbo by 1.3 px), so the probe can see it.
- Through the Overdrive selection: the OVERDRIVE row, its submenu and the chosen Overdrive's target step (Ch III, Dragon Fang, "TARGET Braska's
  Final Aeon · Yu Pagoda", frame viewed) were reached in 9 of 11 chapters; the chosen Overdrive opened an enemy-target step (the list aimed) in four of them (Ch I, Ch III, Natus, Omnis),
  and in the others it fires without one, where the Attack target step covers the aimed list. Every OD-row, OD-submenu, OD-chosen and Attack-target
  step is inside the window. `sin-fins-core` has no Attack or Overdrive row at all (its menu is Cheer, Provoke, Delay Attack, Delay Buster) and `sin-face`'s Overdrive row
  cannot be selected (locked), so those two were measured at the first menu only, as the builder disclosed ("no aim step"); their label stays inside
  (first-menu readings, same table).
- 0 failed runs, 0 page errors in all 198 runs.
- The published hang follows the party digits (measured in my runs at 1024x768: `--ffx-od-hang` 16.1 to 16.3 px in Ch III and Omnis, 14.3 in Yojimbo, 11.1 in Ch I and Natus, 10.65 in Ch II,
  9.8 to 12.1 in Via Purifico, 4.6 in Evrae, 3.6 in Anima), and at 1440 and 2000 px wide the aimed list sits the approved 6 % in again (see note 2).

### 2. 14 px floor, 60 cells

- Candidate: **minimum text 14.0 px, 0 text nodes under 14 px in 60 of 60 cells** (838 steps; 24 of the 60 cells are the two FFX-2 chapters).
- Live 38 on the same 60 cells: minimum 4.8 px, 8,944 under-14 node hits.
- Two hits in my raw walker output (phone, Ch I, the Switch submenu, TEXT SIZE 1.0 and 1.3) were the `R` of `.ffx-portrait-fallback`, the placeholder
  letter that shows for a few hundred ms while Rikku's portrait image decodes (`visibility: hidden` once `img.complete`; I reproduced it: visible
  at 100 ms, hidden from 400 ms, 0 404s). It is a transient image-load state, not a label; counted as 0 above and named here so it is not hidden.

### 3. Nothing else regresses

- **The lane's own delta, isolated** (candidate against the `3dd4771b` pre-clamp build, same cells): 0 new off-window text, 0 new clipped text, 0 under-14
  text. Overlap items that differ are timing jitter that appears on the live bundle too (Ch III's Braska dialogue box over the banner chip at 1024x768
  shows in live 38, pre-clamp and candidate in changing steps; a pause screen opened by a stray Escape over the HUD in a few cells). HUD-only frames of
  the first menu are pixel-identical (0.00 % of pixels differ by more than 24) in all FFX cells at all three windows and in the FFX-2 cells at 1024
  and 390; the target step differs where the Sensor card has or has not folded yet (it folds between 2.5 and 4 s after the target opens, identically
  in the pre-clamp and candidate builds, measured) and at the party list.
- **FFX-2 HUD unchanged except the floor**: candidate frames equal the pre-clamp frames (FFX-2 first menu 0.00 % in 4 of 6 cells; the other two differ
  only by the enemy timing, 0.70 to 1.18 % at 1600x900 and 5.87 % at 1024x768 in a coach-up frame). The lane's change touches no FFX-2 file and
  `odHang.ts` is not imported by the FFX-2 HUD. Against live 38 the FFX-2 HUD differs by the floor (type grown to 14 px, frame viewed at 1024x768).
- **Against the live bundle** the walker reports 109 new overlap items and 45 new off-window items (60 cells), with 104 and 36 gone. They are the cost
  of the floor, already disclosed in `docs/handoff/r37-ui-floor.md` and `docs/handoff/r381-ui-floor.md`, and none comes from this delta (against the
  pre-clamp build: 0 new off-window). The 45 off-window items are all phone pause tab labels on the horizontally scrolling tab row
  (`button.pause__tab`: Guide, Rikku, Yuna, Tidus). The overlaps: FFX-2 at 1024x768 (party name against the command label 21, small MP text 12,
  `mad__actor` chips 27), pause value columns 14, Ch III dialogue over the banner chip 5, coach and damage-number items. These need the deep review's
  decision; they are the floor lane's residue, not a regression of the 38.1 delta.

### 4. Gates on the merge-test

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean (exit 0) |
| full `npx vitest run --testTimeout=60000 --maxWorkers=3` | **807 files passed, 5 skipped, 0 failed; 11,823 tests passed, 46 skipped, 1 todo** (498 s) |
| `node tools/orphans.mjs` | 1,223 modules, 24 orphaned (the builder's count and main's); `odHang.ts` is reachable |

## Notes (none blocks)

1. The Overdrive gauges were set to 100 by the debug state to get the OVERDRIVE row in the next menu; the label text is then the long word
   "OVERDRIVE" (the widest form), which is the stricter case. The first-menu readings use the normal gauge ("OD").
2. Behaviour change worth knowing: the pre-clamp build held the nudge down at TEXT SIZE above 1.0 on every window; the candidate returns to the approved 6 %
   wherever the measured hang leaves room. On 1440 and 2000 px wide windows the aimed list therefore sits up to 21 px further right than the pre-clamp
   build at TEXT SIZE 1.3 (1889.5 of 2000, 1430.2 of 1440 at the label), still inside the window (9.8 px clear at 1440, 110 px at 2000). It matches the
   approved frame; it is not a defect.
3. The Ch III Overdrive at 1024x768 leaves the label 6 px clear; the "OD" bar 3.2 px clear. The margin is the 2 grid px of air the lane chose; a taller 4:3
   layout (a `For Bailey` look item) would remove the squeeze, as the lane already says.

Raw data: `D:/Tools/pyrefly-scratch/2026-10-04/r381-check/out/od`, `out/walk`, `out/frames`, `logs/` (queue logs, vitest, tsc, build, server PIDs).
Servers 7161, 7162, 7163 were started by this check and stopped by PID at the end.
