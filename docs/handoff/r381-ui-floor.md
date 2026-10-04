# r381-ui-floor: the OD label stays inside the window (release 38.1 candidate, branch only)

Written 2026-10-04 by a Sonnet sub-agent of the driver session. Branch `r381-ui-floor` (from `origin/r37-ui-floor` `12d6ea4b`,
`origin/main` `12075232` merged clean as `3dd4771b`), code commit `9584aecd`. **Nothing is merged into main and nothing is deployed**:
Bailey has not answered the morning-page questions ((b) the 14 px floor with a run-time clamp is the one this lane serves).
Worktree `D:/pyrefly-r381-ui-floor`. Method: `docs/plans/r37-ui-floor-method-check.md` section 4 (measure the room in stage grid px, bound
the run-time offset by it) and section 5 (this is the third failure of the class, so the repair is a measured clamp, not another constant).

## What changed (game case per item)

| Item | Game case | Why this case |
|---|---|---|
| `src/ui/ffx/odHang.ts` (new): measures how far every party row's Overdrive bar and "OD" label hang past the list's right edge, publishes the widest as `--ffx-od-hang` (list px, rounded up to 0.05) before the list takes the aim class and every frame it is aimed | **FFX only** | Only FFX has the right-anchored party list that slides right while an enemy is aimed at and the OD bar on it; FFX-2's list is left-anchored, takes no aim nudge, and uses the bar as the ATB gauge on the other side. The phone returns early (`data-phone-battle`). |
| `src/ui/common/hud-floor.css`: the aim nudge is `min(6%, max(0, 21.1px / --pyr-ts - var(--ffx-od-hang, 9.25px)))` | **FFX only** (rule is under `.ffxhud--targeting-enemy`) | Same rule as above; 9.25 stays as the value before the first reading. |
| `src/ui/ffx/FFXBattleHud.ts`: two calls (`applySelection` before the class lands; `update` while aimed, because the rows re-render as HP changes) | **FFX only** | |
| `tests/unit/r381-od-hang.test.ts` (new, 17 tests), `tests/unit/r37-floor-third.test.ts` (pin follows the new rule) | both (plumbing tests; the rule they pin is FFX only) | |

Why the third attempt failed (the independent check's blocker B1): its cap assumed the OD word hangs a fixed 9.25 grid px past the list. That is
true of Chapters I and II (short HP figures) and false in Chapter III (`6492/6492`: bar 16.2, label 14.3), so the "D" ran past a 1024 px window at
every TEXT SIZE. The room is now measured from the rows' own rects, so it holds for any party digits, any TEXT SIZE and any window size
(the hang and the room are both in list px / stage grid px).

## Numbers (headless GPU Chromium, real keys, one browser at a time)

Builds: candidate = production build of `9584aecd` (`ui-dist`, served on 7061); baseline = the exact live release 38 bundle `DHaa2xD1`
(main `6461999e`, `D:/pyrefly-rel38/dist-release`, 7062); pre-fix = production build of `3dd4771b` (this lane without the clamp, 7063).
Tools and raw JSON: `D:/Tools/pyrefly-scratch/2026-10-04/r381-prep/` (`tools/od-probe.mjs`, `walk.mjs`, `regress.mjs`, `out/od`, `out/walk`).

### 1. The OD probe, all 11 FFX chapters, TEXT SIZE 1.0 / 1.15 / 1.3, menu step and Attack target step

Right edge of the right-most OD label / bar in screen px (window width in brackets), widest over the 11 chapters x 3 text sizes:

| Window | Candidate, target step | Candidate, menu step | Live 38 baseline, target step |
|---|---|---|---|
| 1024x768 | label **1017.7**, bar **1020.8** (all 33 runs inside 1024; 3.2 px clear) | label 1016.8, bar 1020.8 | (earlier run) Ch III 1028.9 / 1030.1 / 1031.3 = **out** by 5 to 7 px; Omnis 1018.6 / 1023.3 / 1028 |
| 1280x720 | label **1273.8**, bar **1276.0** (all 33 inside 1280; 4 px clear) | label 1253.8, bar 1256.6 | Ch III 1273.2 / **1279.1** / **1285.0**, Omnis the same, Yojimbo 1281.3 at 1.3 = **out** |

Chapter III at 1024x768 (the failing label): label 1017.7 / 1017.2 / 1016.8 at 1.0 / 1.15 / 1.3 (was 1028.9 / 1030.1 / 1031.3). The published
hang per chapter id (1024x768, list px): seymour-flux 11.10, yunalesca 10.65, braskas-final-aeon 16.25, seymour-anima-macalania 3.60, evrae-airship 4.60,
yojimbo-cavern 14.30, seymour-natus 11.10, seymour-omnis 16.25, isaaru-via-purifico 9.80 (not aimed in the probe), sin-fins-core and sin-face none (no aim step).
All 66 candidate runs and all 33 baseline runs: 0 page errors.

### 2. The 60-cell walker (5 chapters x 4 windows x TEXT SIZE 1.0 / 1.15 / 1.3; first menu, 7 submenus, Attack target, every pause tab at 1024x768 and 390x844)

| | Candidate (this branch) | Live 38 baseline |
|---|---|---|
| Global minimum text size | **14.0 px in 60 / 60 cells** (276 / 276 / 274 steps at 1.0 / 1.15 / 1.3) | 7.7 px |
| Text nodes under 14 px | **0** | 3,527 / 3,524 / 3,439 at 1.0 / 1.15 / 1.3 |
| Cells with a failed run | 0 | 0 |

FFX-2 (Ch IV `ffx2-bahamut`, Ch V `ffx2-vegnagun-shuyin`; 24 of the 60 cells): the floor holds, min 14.0 px, 0 under 14, unchanged by this lane
(the FFX-2 HUD does not import `odHang.ts` and the new CSS is scoped to `.ffxhud--targeting-enemy`).

**No label regressing** is measured against the build this lane started from (`3dd4771b`, the pre-fix production build), in the 36 FFX cells
(3 chapters x 4 windows x 3 sizes): text overlaps, clipped leaf text, off-window text and under-14 text that the pre-fix build does not have in the
same cell and step: **0 new**; 8 gone (the Chapter III "OD" off-window text at 1024x768 in all three TEXT SIZES, and a phone Ch I pause tab label at 1.3).
The change touches nothing else.

Against the literal live 38 baseline the walker reports 190 new items (72 text overlaps and 9 off-window in FFX cells, 103 and 6 in FFX-2 cells;
0 clipped, 0 under 14). They are the cost of the floor itself (every label grows from 5 to 8 px to 14 px, so labels that never touched do now), not
of this lane's change: the same items are in the pre-fix build in the same cells (the 0-new result above). They are the floor lane's disclosed
residue (`docs/handoff/r37-ui-floor.md`: pause options rows scrolled out of view, the music list, folded intent cards, the phone pause tab carousel
reading as off-window, two banner titles "Where the Tide Stopped" / "Where the Pyreflies Rest" at 4:3). The list is in
`D:/Tools/pyrefly-scratch/2026-10-04/r381-prep/out/regress-c381-b381.txt`; a deep review should decide each, they are not new in this lane.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `node tools/orphans.mjs` | 24 orphaned modules, the same 24 as `origin/main` (1,223 vs 1,220 modules); `odHang.ts` is reachable |
| Full `vitest run --testTimeout=60000 --maxWorkers=3` (worktree, junctions for `node_modules` and `public/art`) | **807 files passed, 5 skipped, 0 failed; 11,823 tests passed, 46 skipped, 1 todo** (2,124 s on a loaded machine) |
| Files under 400 lines | `odHang.ts` 71; `FFXBattleHud.ts` was already over (+4 lines), disclosed as before |
| Contracts | no shared contract file touched; no `CONTRACT-CHANGES.md` entry |

## What is left, on purpose

- Nothing was merged into main or deployed; the release needs Bailey's answer on the floor (morning-page (b)) and the usual review plan
  (`node tools/critic-plan.mjs --paths src/ui/common/hud-floor.css,src/ui/ffx/FFXBattleHud.ts,src/ui/ffx/odHang.ts`).
- The room margin is 2 grid px of air (`21.1 = 23.11 - 2`). A look change (taller 4:3 layout) would remove the squeeze altogether; that is a
  `For Bailey` item from the method check, not built here.
- `sin-fins-core` and `sin-face` (no aim step) never reach the clamp; their OD label sits at 1009.9 / 1013.3 / 1016.8 at 1024x768, inside the window.
- Measurements were taken while the critic's round 21 captured the live site (QUIET-PLEASE was absent); nothing here is a timing reading.
- Scratch trees `r381-prep/pre-src` and `pre-dist` (the `3dd4771b` build) and the three static servers (7061, 7062, 7063) belong to this lane's check;
  the servers were stopped at the end.
