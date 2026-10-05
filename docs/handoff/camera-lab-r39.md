# Camera Lab at release 39 (branch `camera-lab-r39`; an options round, nothing for main)

Date 2026-10-04. Worktree `D:/pyrefly-lab-r39` (sparse), branch `camera-lab-r39` from `camera-lab` 959e5925, pushed to origin; **not merged into main or into any r39 branch, not deployed.**
Game case (rule 14): **both games, as a test.** Chapter I is FFX (Seymour Flux), Chapter IV is FFX-2 (Bahamut); the FFX-2 rule stands (the camera never cuts while a girl's menu is open, D-316); the target cut is FFX only.

Bailey, 2026-10-03, after playing the lab (STYLE Clair Obscur, VIEWS Today's paintings, MENU At the hero, TARGET CUT On): "I tried the camera lab with these settings and I really like it but not ready to commit to it for my game yet. can you show me more of what you can use? if there's going to often be close ups of character and enemy models and backgrounds it needs to be significantly higher res with all around better grpahics, presentation, and polish. Like top notch."
And on 2026-10-04: "I need super high resolution now. DO NOT hold back. I want the visual fidelity to be amazing and absolutely beautiful. It needs to be breathtaking."

## What is here

- **The merge** (f2b5155d): `camera-lab` 959e5925 (built on main c19454eb) and `origin/r39-looks` 20e551ab, which is built on `origin/r39-hires-engine` d7ac0ccf and so already contains the local `r39-hires-engine` d6810315 (a second merge of it is a no-op). No textual conflict: the lab touches nine existing files by a few lines each. `tsc --noEmit` clean on the merge. The lab's grammar and release 39's art tiers and F plus are as built.
- **Asking the art governor ahead of the cut** (afc0a2bc): `src/engine/lab/anticipate.ts` (pure: the shots the beats ahead of a menu can ask for, built with `shotForBeat` itself), `LabDirector.anticipate / tickAnticipation` (each likely shot is solved and handed to `StageArt.anticipateView`), `BattleScreen` (one line: `lab.before(dt)` ahead of the stage's own update), `battleLab.ts` (the record of what the governor held at every cut, `snapshot().lab.artAtCut`; `?labart=off` turns the asking off), `tests/unit/camera-lab-anticipate.test.ts` (6 cases).
  The asking happens in the frame a governor load slot is free: the governor starts at most two loads at a time and its own update refills a free slot with a background pose within a frame, so a request on a timer found both slots taken (measured: the first HERO CLOSE of a fight landed on the 2x master). A round that starts nothing rests the asking half a second: about 5 ms per second of play.
- **The page** for Bailey: `D:/Tools/pyrefly-scratch/2026-10-04/lab-r39/page/` (index.html and img/; the driver publishes it). Captures, 4K originals, clips and their full-size copies: `F:/pyrefly-parked/2026-10-04/lab-r39/`. The harness (stills, clips, timing, residency, equivalence) is scratch in `D:/Tools/pyrefly-scratch/2026-10-04/lab-r39/harness/`.

## How to run it again

```
cd D:/pyrefly-lab-r39    (junctions: node_modules -> main tree; public/art and public/fx -> D:/pyrefly-r39-int/public, the repaired hi-res art, read only)
node node_modules/vite/bin/vite.js --config .lab39-vite-tmp.config.mjs --port 7300      (scratch config: HMR off, cache on F:)
http://127.0.0.1:7300/?camera=lab&coach=off&crisp=fplus&artlink=fast                      (&labart=off turns the asking-ahead off)
```
The panel (keys) sets STYLE, VIEWS, MENU and TARGET CUT; `T` plays today's version of the same chapter. Stop the server by its port when done. The production check build is code only (`vite build` with `BASE_PATH=/` set in the environment, not in the config: an import is hoisted above a statement), served by `harness/serve.mjs` over the worktree's public folder.

## Verification

- `npx tsc --noEmit`: clean. `tests/unit/camera-lab*.test.ts`: 30 of 30. `node tools/orphans.mjs`: 1,259 modules, 24 orphaned, none new.
- Today's camera (the panel's T key) against the plain page with no flag, at the first menu: same rig, lens, framing master, parts, sharpness rung and figures; the camera position differs by 0.07 units, the idle sway's phase.
- FFX-2, ten turns in two runs: 35 and 33 cuts, none under an open menu, six as a menu opened. FFX: 45 cuts, 13 under skill lists and target picks, as the grammar asks.
- Real keys only, headless Chromium on the RTX 5070 Ti, one browser at a time for timing (the art job paused by its flag file for the two timing batches, the flag moved out to `F:/pyrefly-parked/2026-10-04/r39-art-flags/` after each).

## Numbers

Screen pixels one texel covers (lower is sharper; 1x painting -> the master held), lab on release 39:

| Chapter | Shot | Figure | 1440p | 4K |
|---|---|---|---|---|
| I (FFX) | command | hero | tidus ready 4x: 1.87 -> 0.47 | tidus ready 4x: 2.83 -> 0.71 |
| I (FFX) | command | boss | seymour-flux-bod idle 4x: 0.75 -> 0.19 | seymour-flux-bod idle 4x: 1.13 -> 0.28 |
| I (FFX) | list (hero close) | hero | tidus ready 4x: 3.01 -> 0.75 | tidus ready 4x: 4.50 -> 1.13 |
| I (FFX) | list (hero close) | boss | seymour-flux-bod idle 4x: 0.67 -> 0.17 | seymour-flux-bod idle 4x: 1.01 -> 0.25 |
| I (FFX) | target (Seymour) | boss | seymour-flux-bod idle 4x: 1.45 -> 0.36 | seymour-flux-bod idle 4x: 2.17 -> 0.54 |
| I (FFX) | action (caster low) | hero | tidus cast 4x: 1.42 -> 0.35 | tidus cast 4x: 2.12 -> 0.53 |
| I (FFX) | action (caster low) | boss | seymour-flux-bod idle 4x: 0.63 -> 0.16 | seymour-flux-bod idle 4x: 0.95 -> 0.24 |
| I (FFX) | hit (impact wide) | boss | seymour-flux-bod idle 4x: 0.81 -> 0.20 | seymour-flux-bod idle 4x: 0.95 -> 0.24 |
| IV (FFX-2) | command (party master) | hero | yuna-white-mage idle 4x: 0.51 -> 0.13 | yuna-white-mage idle 4x: 0.76 -> 0.19 |
| IV (FFX-2) | command (party master) | boss | ffx2-bahamut idle 3x: 0.92 -> 0.31 | ffx2-bahamut idle 4x: 1.37 -> 0.34 |
| IV (FFX-2) | action (caster low) | hero | yuna-white-mage cast 4x: 1.49 -> 0.37 | yuna-white-mage cast 4x: 2.22 -> 0.56 |
| IV (FFX-2) | action (caster low) | boss | ffx2-bahamut idle 3x: 1.20 -> 0.40 | ffx2-bahamut idle 4x: 1.79 -> 0.45 |
| IV (FFX-2) | attack (lunge side) | hero | paine-warrior ready 4x: 0.48 -> 0.12 | paine-warrior ready 4x: 0.72 -> 0.18 |
| IV (FFX-2) | attack (lunge side) | boss | ffx2-bahamut idle 3x: 1.12 -> 0.37 | ffx2-bahamut idle 4x: 1.69 -> 0.42 |
| IV (FFX-2) | hit | hero | paine-warrior ready 4x: 0.48 -> 0.12 | paine-warrior attack 1x: 0.72 -> 0.72 |
| IV (FFX-2) | hit | boss | ffx2-bahamut idle 3x: 1.13 -> 0.38 | ffx2-bahamut hurt 1x: 1.70 -> 1.70 |
| IV (FFX-2) | Bahamut’s turn | boss | ffx2-bahamut idle 3x: 0.91 -> 0.30 | ffx2-bahamut attack 4x: 2.89 -> 0.72 |

Is the master in place at the cut? Cuts that landed on a figure softer than one texel per pixel while a bigger master existed, first three turns of a fresh fight (1440p). Totals: Chapter I with the asking ahead 4 of 32, without 10 of 31; Chapter IV with 1 of 8, without 0 of 9.

| Chapter | Asking ahead | Cuts | Soft | Which |
|---|---|---|---|---|
| I (FFX) | on 1 | 16 | 2 | colossus:seymour-flux (seymour-flux-body telegraph 1x); item-close:yuna (yuna item 1x) |
| I (FFX) | on 2 | 16 | 2 | hero:kimahri (kimahri ready 2x); hero-close:kimahri (kimahri ready 2x) |
| I (FFX) | off 1 | 15 | 4 | enemy-front:mortiorchis (seymour-flux-body idle 2x); hero-close:tidus (tidus ready 2x); hero:kimahri (kimahri ready 2x); hero-close:yuna (yuna ready 2x) |
| I (FFX) | off 2 | 16 | 6 | colossus:seymour-flux (seymour-flux-body telegraph 1x); enemy-front:mortiorchis (seymour-flux-body idle 2x); hero-close:tidus (tidus ready 2x); hero:kimahri (kimahri ready 2x); hero-close:kimahri (kimahri ready 2x); hero-close:yuna (yuna ready 2x) |
| IV (FFX-2) | on 1 | 8 | 1 | enemy-front:bahamut (ffx2-bahamut cast 1x) |
| IV (FFX-2) | off 1 | 9 | 0 | none |

Frame cost (median / p95 ms of 200 renders plus a one pixel readback, frame held; production code build):

| Chapter | Shot | today 1440p | lab 1440p | today 4K | lab 4K |
|---|---|---|---|---|---|
| I (FFX) | command | 5.0 / 5.3 | 5.2 / 5.7 | 10.8 / 12.7 | 11.6 / 13.5 |
| I (FFX) | list | 5.1 / 5.5 | 5.2 / 5.5 | 10.5 / 12.2 | 11.6 / 13.2 |
| I (FFX) | target | 5.5 / 6.6 | 5.5 / 5.8 | 10.4 / 11.5 | 11.6 / 13.3 |
| I (FFX) | action | 5.1 / 5.6 | 5.5 / 6.2 | 10.8 / 12.0 | 12.1 / 14.1 |
| IV (FFX-2) | command | 7.9 / 9.1 | 10.3 / 13.8 | 16.6 / 18.1 | 16.6 / 18.2 |
| IV (FFX-2) | action | 8.0 / 9.2 | 7.9 / 10.5 | 16.7 / 18.0 | 14.3 / 15.7 |

Frame intervals in the real run (frames over 33 ms / over 100 ms / worst, and the stall time; the cost benches' own windows excluded). p50 16.7 ms and p95 16.8 ms in every run (60 Hz held).

| Chapter | Window | Camera | Load and intro | First 15 s after the first menu | The rest of the turn |
|---|---|---|---|---|---|
| I (FFX) | 1440p | today | 18 / 6 / 1667 ms (5.5 s) | 1 / 0 / 67 ms (0.1 s) | 6 / 1 / 117 ms (0.5 s) |
| I (FFX) | 1440p | lab r39 | 32 / 20 / 1317 ms (7.5 s) | 1 / 1 / 233 ms (0.2 s) | 7 / 6 / 317 ms (1.6 s) |
| I (FFX) | 4K | today | 16 / 7 / 1717 ms (5.2 s) | 0 / 0 / 33 ms (0.0 s) | 6 / 0 / 83 ms (0.4 s) |
| I (FFX) | 4K | lab r39 | 28 / 20 / 1283 ms (7.1 s) | 0 / 0 / 33 ms (0.0 s) | 8 / 7 / 317 ms (1.8 s) |
| IV (FFX-2) | 1440p | today | 16 / 9 / 917 ms (3.9 s) | 3 / 1 / 233 ms (0.4 s) | 0 / 0 / 17 ms (0.0 s) |
| IV (FFX-2) | 1440p | lab r39 | 25 / 14 / 1350 ms (5.6 s) | 7 / 5 / 250 ms (1.2 s) | 0 / 0 / 17 ms (0.0 s) |
| IV (FFX-2) | 4K | today | 12 / 8 / 933 ms (3.9 s) | 5 / 1 / 250 ms (0.5 s) | 1 / 0 / 50 ms (0.1 s) |
| IV (FFX-2) | 4K | lab r39 | 25 / 15 / 1750 ms (6.6 s) | 3 / 3 / 317 ms (0.7 s) | 2 / 2 / 267 ms (0.4 s) |

GPU memory in megabytes (every texture and render target allocation, at the first menu):

| Chapter | Window | today | lab r39 |
|---|---|---|---|
| I (FFX) | 1440p | 890 | 1398.2 |
| I (FFX) | 4K | 1317.4 | 1888.9 |
| IV (FFX-2) | 1440p | 845.1 | 1089.5 |
| IV (FFX-2) | 4K | 1285.7 | 1648.4 |

## Known gaps (the page lists them with the changes)

1. **Masters stall the frame as they swap in** (major). A 4x master is 40 to 65 MB of pixels (52 to 86 MB with mips), decoded and uploaded on the frame that draws it. The lab adds frames of 100 to 320 ms in the first half minute; the load before the first menu stalls for both cameras (release 39's own). The asking ahead moves arrivals earlier; it cannot make an upload cheaper. Change (engine, deep review): upload off the critical frame (`initTexture` after the decode, or in slices) and cap landings per second.
2. **Poses a figure has not shown yet arrive late** (minor): a boss telegraph, Yuna's item pose, Kimahri's ready pose, Bahamut's cast pose sat at 1x or 2x for the first seconds. Change: ask for a visible figure's other poses inside the memory budget.
3. **At 4K the closest shot is past the 4x master** (minor): Tidus's skill-list shot is 1.13 pixels per texel at 4x. Change: lens back about 12 percent above 2560, or a 5x tier.
4. **Chapter I's backdrop is the approved 2688 pixel painting** (minor): the Gagazet 2x master is held back (it invents lines); the build still asks for it and gets a 404 (it falls back). Re-render owed.
5. **Summons are soft** (minor): the aeon gets a human-height hero shot (Valefor 2x at 8.6 pixels per texel in one run). Masters and a sized shot are owed.
6. Unchanged from the lab Bailey played: the menu at the hero falls back to the panel where it would cover another figure; no rear paintings with today's paintings on; no phone layout; FFX-2 cuts only between menus (in Active ATB the wide impact of a spell often does not happen).

## Owed, and not done

- The full unit suite and the e2e suite were not run (an options round with a few lab-only lines in `BattleScreen`); the lab and presenter-facing unit files were.
- Held shots of the MAX mix (the Overdrive and dressphere shots) were not exercised in the lab; the lab still yields only to the presenter's own authored moments, as built.
- Not measured: Safari and Firefox, integrated GPUs, a phone, a card with nothing else on it other than the timing batches.
- Taking any part of this further is Bailey's call (rule 10): a settings switch on the EYE CANDY page (D-316, D-317) and a deep review, since the presenter and camera are shared presentation core.
