# r3941-spacing: the Leblanc Syndicate at their real sizes on release 39.4's spots (branch `r3941-spacing`, from `origin/r394-int` 04cdcd45, the live build 39.4.1)

**Game case: FFX-2 only** (AGENTS.md rule 14). Chapter VI's three acts (the Chateau entrance, Logos' room, the Last Room) and the hidden experimental Leblanc chapter (word "leblanc"), which plays Chapter VI's acts and room by reference (`scenes/exp-leblanc-last-room.ts`), so it stands the same fiends in the same places. Nothing in FFX reads any of it. Presentation only: no `src/battle/**`, no `src/data/**/enemies/**`, no golden file in the diff.

Bailey, 2026-10-08, on the live 39.4.1: "The way the battles are framed now being right next to each other is kinda dumb in the Leblanc chapter it looked way better before". Asked how the chapter should look he picked **"Old spacing, real sizes (Recommended)"**, Option 1 of the 2026-10-07 options sheet (`D:/Tools/pyrefly-scratch/2026-10-07/leblanc-camera/options-sheet.jpg`): every fiend stands where release 39.4 stood it, the camera as it was, and the Syndicate keeps the real sizes 39.4.1 gave them (Ormi 1.15, Logos 1.26, Leblanc 1.05, Dr. Goon 1.10, Fem-Goon 1.01 of a girl). His standing instruction for what follows: where a bigger fiend at its old spot meets a card, fix the card, never the spacing. This note **replaces** the places, the lane and the advisor cap of [r3941-stage](r3941-stage.md) (the sizes, the table and the method there stand).

Pictures: `docs/screenshots/r3941-spacing/leblanc-three-way.jpg` (release 39.4 | live 39.4.1 | this branch, the first command menu of Acts I to III, 1600x900 above and a phone 390x844 below, the ratios and the HUD numbers under each frame).

## What changed (against 04cdcd45)

| File | What |
|---|---|
| `src/scenes/leblanc-staging.ts` | `LEBLANC_ENEMY_SPOTS` are release 39.4's places again, to the hundredth (below); `LEBLANC_ENEMY_SLOTS`, `LEBLANC_ENEMY_LANE_X` (1.0 to 3.0) and `LEBLANC_TRIO_POOL` (1.1, -4.0) are 39.4's; `LEBLANC_FIGURE_HEIGHTS` (the real sizes) are 39.4.1's; `LEBLANC_ADVISOR_CAP` is gone; `LEBLANC_INTENT_ROOF` is new. |
| `src/scenes/leblanc-last-room.ts` | reads the above; names no `advisorCap`, names `intentRoof`. The four rigs are not touched. |
| `src/scenes/types.ts`, `src/app/screens/BattleScreen.ts`, `BattleScreenWiring.ts` | `SceneStaging.intentRoof` (additive, FFX-2 only; `createHud`'s sixth argument), in `docs/CONTRACT-CHANGES.md`. |
| `src/ui/ffx2/FFX2BattleHud.ts`, `intentBoard.ts` | `intentHead` (the one projector the intent slab and its placement solver read) and `intentMaxHeight`; `highestEnemyHead` and `intentRoom`. |
| `src/ui/common/EnemyIntent.ts` | `EnemyIntentMountOptions.maxHeight` (shared with the FFX HUD, which never passes it): the body folds to the room above the heads. |
| `research/ffx2-leblanc-syndicate.md` §20.5, `docs/handoff/r3941-stage.md` | the note that the places are 39.4's again. |
| tests | `chapters/leblanc-enemy-lane.test.ts` (rewritten: the camera to the digit, the tables, 39.4's spots and the solver that derives them, the gap, the sizes, the HUD boxes), `chapters/leblanc-scene.test.ts`, `ffx2-advisor-scene-cap.test.ts`, and new `ffx2-intent-roof.test.ts` (17) and `ui-enemy-intent-fold.test.ts`. |

## Where the fiends stand (the places are 39.4's)

39.4 did not pin its fiends: the formation solver (`engine/Formation.ts`) laid each act out in the lane, the bigger fiend further back, and the stage's screen-space relaxation (`engine/StageRelax.ts`) nudged two of Act III's silhouettes 0.2 apart. At the real heights that same solver would have turned Act III around (the tallest, Logos, to the very back) and packed three figures wider than the lane, so the places are **pinned** (`SceneStaging.enemySpots`) at what 39.4 produced, measured in the 39.4 build at each act's first command menu at 1600x900: three ranks 3.2, 5.0 and 6.8 units behind the party's front girl (the girls stand at z 1.45, 0.1 and -1.5, as always).

| Act | fiend | spot `[x, 0, z]` | 39.4.1 had |
|---|---|---|---|
| I | Dr. Goon | 1.34, -5.0 | 0.74, -1.05 |
| I | Ormi | 2.0, -6.8 | 1.46, -0.15 |
| I | Fem-Goon | 2.66, -3.2 | 2.82, -2.6 |
| II | Ormi | 1.45, -3.2 | 0.71, -2.5 |
| II | Logos | 2.55, -6.8 | 1.8, -0.7 |
| III | Ormi | 2.55, -3.2 | 0.58, -2.5 |
| III | Logos | 1.26, -5.0 | 2.2, -0.7 |
| III | Leblanc | 2.21, -6.8 | 1.65, -4.2 |

A unit test derives them again from the engine's own solver with 39.4's heights (Acts I and II exactly, Act III before the relaxation's 0.2). My own capture of 39.4 reads the same places to 0.01 (Act III Logos 1.27, Leblanc 2.20; run to run the relaxation moves them that much).

## The sizes on screen (first command menu, seed 1, real-GPU headless Chromium, clocks frozen)

"vs girls" is a fiend's standing height over the girls' mean standing height on screen (a raised fan or gun and Rikku's crouch do not count); "real" is the model's own ratio at one distance. **39.4 | live 39.4.1 | this branch.**

**1600x900**

| act | fiend | depth z | standing px | vs girls | painted rect over rect (Option 1's measure) | real |
|---|---|---|---|---|---|---|
| I | Fem-Goon | -3.2 / -2.6 / -3.2 | 138 / 210 / 201 | 0.49 / 0.75 / **0.72** | 0.47 / 0.71 / 0.68 | 1.01 |
| I | Dr. Goon | -5.0 / -1.1 / -5.0 | 123 / 271 / 197 | 0.43 / 0.96 / **0.70** | 0.42 / 0.92 / 0.67 | 1.10 |
| I | Ormi | -6.8 / -0.1 / -6.8 | 157 / 308 / 184 | 0.55 / 1.09 / **0.65** | 0.53 / 1.05 / 0.62 | 1.15 |
| II | Ormi | -3.2 / -2.5 / -3.2 | 201 / 249 / 235 | 0.71 / 0.88 / **0.83** | 0.78 / 0.96 / 0.91 | 1.15 |
| II | Logos | -6.8 / -0.7 / -6.8 | 158 / 321 / 202 | 0.56 / 1.13 / **0.71** | 0.61 / 1.24 / 0.78 | 1.26 |
| III | Ormi | -3.2 / -2.5 / -3.2 | 200 / 249 / 235 | 0.71 / 0.88 / **0.83** | 0.77 / 0.96 / 0.90 | 1.15 |
| III | Logos | -5.0 / -0.7 / -5.0 | 177 / 321 / 227 | 0.62 / 1.13 / **0.80** | 0.68 / 1.24 / 0.87 | 1.26 |
| III | Leblanc | -6.8 / -4.2 / -6.8 | 197 / 250 / 209 | 0.56 / 0.71 / **0.59** | 0.76 / 0.96 / 0.80 | 1.05 |

Act I reads 0.62 to 0.68 painted rect over rect, a mean of 0.66: the number the options sheet measured for its Option 1. A fiend at a given spot is exactly its real height over its 39.4 height taller (Dr. Goon and Fem-Goon 1.849 and 1.690 against 1.162; the bosses 1.935, 2.119 and 1.763 against 1.66). The girls are 286 px (standing mean) in all three builds.

**Phone 390x844** (39.4 / live / branch): Act I Fem-Goon 0.52 / 0.82 / **0.76**, Dr. Goon 0.46 / 0.99 / **0.74**, Ormi 0.59 / 1.11 / **0.70**; Act II Ormi 0.75 / 0.94 / **0.88**, Logos 0.60 / 1.15 / **0.77**; Act III Ormi 0.77 / 0.95 / **0.89**, Logos 0.68 / 1.17 / **0.88**, Leblanc 0.62 / 0.78 / **0.67**. 1280x720 and 1920x1080 read the 1600x900 numbers to 0.01.

## The gap and the camera

At 1600x900 the nearest fiend is **172 to 223 px from the girls** (live: 118 to 135; 39.4: 182 to 230) and 160 to 224 px from the command list (live: 107 to 166; 39.4: 166 to 235); every fiend stands inside the HUD rail. The camera is **the same pose in every build and act** (the idle rig plus its sway: Act I 39.4 (0.09, 2.83, 9.25) | live (0.10, 2.89, 9.25) | branch (0.15, 2.89, 9.24)); lens 32 degrees; the four rigs are pinned to the digit by `leblanc-enemy-lane.test.ts`. **On the phone** the existing slice fit (`ShotRules.fitPhone`) stands the master back until every figure fits the 390 px slice: Act I z 10.46 | 12.73 | 10.71, Act II 11.29 | 12.76 | 11.43, Act III 12.24 | 13.03 | 12.34, and the girls read 141, 134 and 124 px against 39.4's 145, 135 and 124 (live's lane had shrunk them to 119, 120 and 117).

## The cards (fixed with the card, not the spacing)

- **The move-advisor card is as it was in 39.4.** The nearest feet stand at y 610 to 611 against the card's top at y 651 at its full height (40 px), so 39.4.1's cap (`LEBLANC_ADVISOR_CAP`, 46 grid px, needed when the fiends came forward to y 723) is out of this room; `SceneStaging.advisorCap` and its wiring stay for the wave-2 rooms.
- **The enemy-intent card now hangs over the highest living fiend's head and folds to the room above it** (`SceneStaging.intentRoof`, Chapter VI's room only; `FFX2BattleHud.intentHead` / `intentMaxHeight`, `EnemyIntentMountOptions.maxHeight`). The far, tall fiends (Logos 2.119, Ormi 1.935) hold their heads higher on the screen than a near, shorter one, so a slab hung over the acting fiend's head lay across theirs, and a tall slab held under the top bar reached them all. Measured on the real HUD, every fiend as the next to act, **no card covers a head in any act at 1280x720, 1600x900 or 1920x1080**. At 1600x900, the worst card over a head, any fiend acting: 39.4 Ormi 100 percent (Act I), Logos 70 (Act II), Leblanc 100 (Act III); live none, Logos 5, Logos 10; **branch none, none, none**. The text folds (the MORE row counts what is hidden; `J` holds it open): Act I's Blizzard card prints its damage to Yuna and Rikku and folds Paine's row and the odds. A scene opts in; every other chapter's card is as it was, and the FFX HUD never passes the option (`ffx2-intent-roof.test.ts` pins that no other scene file names it).
- **Not fixed, disclosed:** on the upright phone the strip is docked by the phone layout (`intentMaxHeight` answers null there) and, with the tallest figures, grazes the top 5 to 7 px of one head in Acts I and III (Ormi 53 percent of the head box in Act I, Logos 34 in Act III; no face; 39.4 and live read none in this capture, though 39.4's own Act I phone read Ormi 97 percent in another run: the relaxation places that act's party and fiends differently from run to run). At 1280x720 the fold can land inside the red DAMAGE banner (Act II's reads "DAMAGE · RANDOM" with the second line faded).

## The phone's Act I

On the phone the stage's screen-space relaxation places Act I's party and fiends as it did in 39.4, and which girl ends where varies from run to run (this capture: Yuna left, Rikku at the right edge, Paine beside Dr. Goon; 39.4's capture: Rikku and Paine centre right). Holding the party (`holdParty`) was tried and **dropped**: it kept the girls on their slots but left Fem-Goon cut by the right edge at 390 px (her painted rectangle x 365 to 406), so it is worse than what 39.4 did. Acts II and III place the girls on their slots in every build.

## The engine and the data

Unchanged: the diff has no `src/battle/**`, no `src/data/**/enemies/**` and no golden file; `src/data/ffx2/syndicate-stature.ts` (the real-size table) is 39.4.1's, untouched.

## Verified

- `tsc --noEmit` clean. The 45 Leblanc, Syndicate, intent-card and advisor test files (534 tests) green. **The full unit suite, once, `--testTimeout=60000`, on the code head d9bbce21 (the tree equal to it): 921 files, 916 passed and 5 skipped; 13,640 tests passed (46 skipped, 1 todo); no failure and no timeout (169 s).** `node tools/orphans.mjs` lists no module this lane touched.
- The pictures: headless Playwright from node (never the browser pane or Chrome), the real GPU (`PYREFLY_BROWSER=gpu`), seed 1, `?coach=off`, clocks frozen at the first command menu. 39.4 is the preview worker (`echoes-of-spira-preview.baileypillon.workers.dev`, build 55db51dd, bundle index-D57LJe-j), live is `echoesofspira.com` (04cdcd45, bundle index-DAnPZ-iy), the branch is a dev server on port 5231 (no production build; stopped at the end). Acts II and III through the real chain (the earlier act's fiends left at 1 HP in the page, a headless test page only, and the `attack` strategy finishes them at the skip pace), so the girls arrive whole. Scripts: `D:/Tools/pyrefly-scratch/2026-10-08/spacing2/` (`chapter6.mjs`, `measure6.js`, `analyze.mjs`, `numbers.mjs`, `make-sheet.mjs`, `cmp-pos.mjs`).
- Not run: the deploy, a review workflow (`node tools/critic-plan.mjs`: a presentation change to one chapter of one game plus an FFX-2-only HUD option needs a focused review before a deploy), the PCSX2 check.

## Open

- The phone strip's graze and the 1280x720 banner cut above; both are the card's, never the spacing's.
- Wave 1's other chapters (XI, XIII, XIV, XV, XVI) keep this principle on branch `r3942-stage` (see [r3942-stage](r3942-stage.md)).
