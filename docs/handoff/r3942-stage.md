# r3942-stage: real sizes for the fiends, wave 1 (branch `r3942-stage`, from `origin/r394-int` 04cdcd45)

Bailey, 2026-10-07: "I'll go with your recommendations full speed" (real game sizes for heroes **and** bosses together, giant bosses keep their special framing, FFX and FFX-2 each by their own numbers); for the Leblanc chapter "Option 3: bosses forward" (shipped live as 39.4.1); 2026-10-08, going to bed: "please get a lot of work done ... i trust you." This note is the method, the per-chapter results and what stopped. The pattern is the Leblanc fix's (`docs/handoff/r3941-stage.md`): a sourced size table, the stand positions, the camera unchanged.

**Head:** the code is 10a76c10; the branch tip is the commit that adds this note and the pictures (`git log -1 r3942-stage`), pushed as `origin/r3942-stage`. **Merges:** `origin/r3941-heights` (09ba165a) and `origin/r3941-omnis` (b5f0d26b) merged no-ff onto 04cdcd45 (commits 2d32653f and 5f97c4dd): both clean but for `docs/CONTRACT-CHANGES.md` (two entries at the top, both kept). tsc and the 17 test files they touch (218 tests) green after the merges. Nothing in `src/battle/**`, `src/data/**/enemies/**` or `tests/unit/*golden*` changed in this lane's own commits.

## What changed, by chapter (one commit each; the game case is in every commit)

| Chapter | Game | Commit | What |
|---|---|---|---|
| IX Cavern (Yojimbo, Daigoro, Lady Ginnem) | FFX only | dad9bb01 | the table `src/data/ffx/fiend-stature.ts`; the three heights real (2.613, 0.769, 1.670); **spots unchanged**; BOSS SCALE unchanged (see below); the phone party step kept |
| XVI Djose (Ixion) | FFX-2 only | ccb5f34f | Ixion 3.175 (was 3.4); spot (4.2, -6.0) to (3.2, -3.8) on Bailey's C2 plate |
| XI Road to the Farplane (Shiva, the Sisters) | FFX-2 only | 75e84c14 and the follow-up | Shiva 3.453, Sandy 2.297, Cindy 1.480, Mindy 1.260; all nearer the girls; Anima untouched |
| XV Den of Woe (the three shades) | FFX-2 only | d85dc412 and the follow-up | 1.943, 1.949, 2.100 (were 2.61, 2.57, 2.79); beside the party |
| XIII Cloister (Trema) | FFX-2 only | e7dbca2b | Trema 1.784 (was 2.23) at his own spot beside the girls; the shared card cap (below); both Paragon links untouched |
| XIV Via Purifico (Isaaru and his aeons) | FFX only | 1dc01bc4 | Isaaru 1.899 (was 1.8) nearer Yuna; **the aeons stay at 3.2** (Pterya and Spathi stopped: options below) |

New data: `src/data/ffx/fiend-stature.ts` and `src/data/ffx2/fiend-stature.ts` (raw mesh height x the engine scale C = the game's size; `fiendFigureHeights`, `ffx2FiendFigureHeights`; the FFX-2 table is read over the girls' mean in each chapter's own party, 17.73 for White Mage, Dark Knight, Dark Knight and 17.47 for Chapter XIII's). Research sections (method, build 25501027, model ids, the 5 percent caveat, what was not found, tag `[datamined: ...]` or `[single source: own measurement]`): `research/ffx-yojimbo.md` section 12, `ffx-isaaru-bevelle.md` section 14, `ffx2-fallen-aeons.md` section 12, `ffx2-trema.md` section 14, `ffx2-gippal-den-of-woe.md` section 12, `ffx2-ixion-djose.md` section 12. Tests: `tests/unit/ffx-fiend-stature.test.ts` (11), `tests/unit/ffx2-fiend-stature.test.ts` (8), and the scene tests the new numbers moved (cavern-scene, stage-figure-heights, fallen-aeons-ship-scene, den-of-woe-ship-scene, trema-ship-scene, ixion-listed, ffx2-advisor-scene-cap). Giants are in neither table.

## The numbers, on screen (first command menu, seed 1, headless real-GPU Chromium, clocks frozen; LIVE = echoesofspira.com, release 39.4.1)

"ratio" is a fiend's standing height (feet to feet plus world height, projected through the live camera; a raised weapon does not count) over the party's mean standing height on screen (Kimahri counted by his body, 1.211, not his spear tip); "real" is the model's own ratio over the same party at one distance (the research sections; FFX chapter IX over the three heroes' mean, Chapter XIV over Yuna). The planned camera is CHAPTER FRAMING's pose at that menu (the frame-by-frame camera adds an idle drift of up to 0.5). Sheets: `docs/screenshots/r3942-stage/wave1-before-after.jpg` (every link) and `ch09-yojimbo-`, `ch11-fallen-aeons-`, `ch13-trema-`, `ch14-isaaru-`, `ch15-den-of-woe-`, `ch16-ixion-before-after.jpg`; the options: `options-sheet.jpg`.

#### 1600x900

| link | fiend | height live to after (world units, drawn x BOSS SCALE) | standing px live to after | ratio over party live to after | real | HUD over the fiend live to after | intent card on its head live to after | planned camera live | planned camera after |
|---|---|---|---|---|---|---|---|---|---|
| IX | yojimbo | 2.550 x1.18 to 2.613 x1.13 | 257 to 254 | 1.19 to 1.13 | 1.44 | 0% to 0% | 0% to 0% | -0.02, 5.23, 18.30 | -0.02, 5.23, 18.30 |
| IX | daigoro | 0.730 to 0.769 | 61 to 64 | 0.28 to 0.29 | 0.42 | 0% to 0% | 0% to 0% | -0.02, 5.23, 18.30 | -0.02, 5.23, 18.30 |
| IX | ginnem | 1.785 to 1.670 | 126 to 118 | 0.58 to 0.53 | 0.92 | 0% to 0% | 0% to 0% | -0.02, 5.23, 18.30 | -0.02, 5.23, 18.30 |
| XI Shiva | x2-shiva | 3.400 to 3.453 | 359 to 447 | 1.26 to 1.57 | 1.94 | 0% to 0% | 0% to 0% | 0.00, 2.70, 9.80 | 0.00, 2.70, 9.80 |
| XI Sisters | sandy | 2.300 to 2.297 | 242 to 286 | 0.85 to 1.00 | 1.29 | 0% to 0% | 0% to 0% | 0.00, 2.70, 9.80 | 0.00, 2.70, 9.80 |
| XI Sisters | cindy | 1.700 to 1.480 | 208 to 172 | 0.73 to 0.60 | 0.83 | 0% to 0% | 0% to 0% | 0.00, 2.70, 9.80 | 0.00, 2.70, 9.80 |
| XI Sisters | mindy | 1.200 to 1.260 | 134 to 163 | 0.47 to 0.57 | 0.71 | 0% to 0% | 0% to 0% | 0.00, 2.70, 9.80 | 0.00, 2.70, 9.80 |
| XIII | trema | 2.230 to 1.784 | 222 to 262 | 0.80 to 0.94 | 1.02 | 0% to 0% | 53% to 0% | 0.00, 3.00, 9.60 | 0.00, 3.00, 9.60 |
| XIV Grothia | isaaru | 1.800 to 1.899 | 240 to 283 | 0.88 to 0.98 | 1.13 | 0% to 0% | 0% to 0% | -0.02, 2.21, 11.09 | -0.02, 2.21, 11.09 |
| XIV Grothia | grothia | 3.200 to 3.200 | 326 to 339 | 1.20 to 1.17 | 1.89 | 0% to 0% | 0% to 0% | -0.02, 2.21, 11.09 | -0.02, 2.21, 11.09 |
| XIV Pterya | isaaru | 1.800 to 1.899 | 245 to 272 | 0.88 to 0.98 | 1.13 | 0% to 0% | 0% to 0% | -0.02, 2.21, 11.09 | -0.02, 2.21, 11.09 |
| XIV Pterya | pterya | 3.200 to 3.200 | 331 to 330 | 1.19 to 1.19 | 3.10 | 0% to 0% | 0% to 0% | -0.02, 2.21, 11.09 | -0.02, 2.21, 11.09 |
| XIV Spathi | isaaru | 1.800 to 1.899 | 249 to 276 | 0.89 to 0.99 | 1.13 | 0% to 0% | 0% to 0% | -0.02, 2.21, 11.09 | -0.02, 2.21, 11.09 |
| XIV Spathi | spathi | 3.200 to 3.200 | 334 to 333 | 1.19 to 1.19 | 5.31 | 0% to 0% | 0% to 0% | -0.02, 2.21, 11.09 | -0.02, 2.21, 11.09 |
| XV Baralai | shade-baralai | 2.610 to 1.943 | 276 to 292 | 0.95 to 1.01 | 1.09 | 0% to 0% | 11% to 0% | 0.00, 2.70, 9.80 | 0.00, 2.70, 9.80 |
| XV Gippal | shade-gippal | 2.570 to 1.949 | 267 to 287 | 0.95 to 1.01 | 1.09 | 0% to 0% | 2% to 0% | 0.00, 2.70, 9.80 | 0.00, 2.70, 9.80 |
| XV Nooj | shade-nooj | 2.790 to 2.100 | 285 to 298 | 1.00 to 1.05 | 1.18 | 0% to 0% | 0% to 0% | 0.00, 2.70, 9.80 | 0.00, 2.70, 9.80 |
| XVI | x2-ixion | 3.400 to 3.175 | 330 to 359 | 1.16 to 1.25 | 1.78 | 9% to 9% | 31% to 31% | 0.00, 2.70, 9.80 | 0.00, 2.70, 9.80 |

#### 390x844

| link | fiend | height live to after (world units, drawn x BOSS SCALE) | standing px live to after | ratio over party live to after | real | HUD over the fiend live to after | intent card on its head live to after | planned camera live | planned camera after |
|---|---|---|---|---|---|---|---|---|---|
| IX | yojimbo | 2.550 to 2.613 | 130 to 128 | 1.00 to 0.88 | 1.44 | 94% to 100% | 0% to 0% | 1.50, 5.06, 17.00 | 1.49, 5.32, 17.74 |
| IX | daigoro | 0.730 to 0.769 | 36 to 37 | 0.28 to 0.25 | 0.42 | 100% to 100% | 0% to 0% | 1.50, 5.06, 17.00 | 1.49, 5.32, 17.74 |
| IX | ginnem | 1.785 to 1.670 | 75 to 67 | 0.57 to 0.46 | 0.92 | 100% to 100% | 0% to 0% | 1.50, 5.06, 17.00 | 1.49, 5.32, 17.74 |
| XI Shiva | x2-shiva | 3.400 to 3.453 | 169 to 202 | 1.38 to 1.65 | 1.94 | 0% to 0% | 0% to 0% | 0.00, 2.70, 13.20 | 0.00, 2.70, 13.20 |
| XI Sisters | sandy | 2.300 to 2.297 | 102 to 114 | 0.97 to 1.09 | 1.29 | 0% to 0% | 72% to 56% | 0.00, 2.70, 15.50 | 0.00, 2.70, 15.50 |
| XI Sisters | cindy | 1.700 to 1.480 | 84 to 70 | 0.80 to 0.67 | 0.83 | 0% to 0% | 0% to 0% | 0.00, 2.70, 15.50 | 0.00, 2.70, 15.50 |
| XI Sisters | mindy | 1.200 to 1.260 | 55 to 65 | 0.53 to 0.62 | 0.71 | 0% to 0% | 0% to 0% | 0.00, 2.70, 15.50 | 0.00, 2.70, 15.50 |
| XIII | trema | 2.230 to 1.784 | 109 to 119 | 0.87 to 0.96 | 1.02 | 0% to 0% | 0% to 0% | -0.04, 3.38, 12.39 | -0.04, 3.39, 12.45 |
| XIV Grothia | isaaru | 1.800 to 1.899 | 114 to 121 | 0.92 to 1.02 | 1.13 | 0% to 0% | 0% to 0% | -0.14, 2.26, 13.73 | -0.16, 2.27, 14.25 |
| XIV Grothia | grothia | 3.200 to 3.200 | 162 to 157 | 1.30 to 1.32 | 1.89 | 0% to 0% | 0% to 0% | -0.14, 2.26, 13.73 | -0.16, 2.27, 14.25 |
| XIV Pterya | isaaru | 1.800 to 1.899 | 116 to 122 | 0.92 to 1.02 | 1.13 | 0% to 0% | 0% to 0% | -0.14, 2.26, 13.77 | -0.17, 2.28, 14.26 |
| XIV Pterya | pterya | 3.200 to 3.200 | 163 to 158 | 1.30 to 1.32 | 3.10 | 0% to 0% | 0% to 0% | -0.14, 2.26, 13.77 | -0.17, 2.28, 14.26 |
| XIV Spathi | isaaru | 1.800 to 1.899 | 116 to 122 | 0.92 to 1.02 | 1.13 | 0% to 0% | 0% to 0% | -0.14, 2.26, 13.72 | -0.17, 2.28, 14.29 |
| XIV Spathi | spathi | 3.200 to 3.200 | 164 to 158 | 1.30 to 1.32 | 5.31 | 0% to 0% | 0% to 0% | -0.14, 2.26, 13.72 | -0.17, 2.28, 14.29 |
| XV Baralai | shade-baralai | 2.610 to 1.943 | 147 to 149 | 0.99 to 1.03 | 1.09 | 0% to 0% | 0% to 0% | -0.05, 2.82, 10.89 | -0.06, 2.85, 11.14 |
| XV Gippal | shade-gippal | 2.570 to 1.949 | 138 to 125 | 1.00 to 1.04 | 1.09 | 0% to 0% | 0% to 0% | -0.08, 2.90, 11.57 | -0.15, 3.08, 13.25 |
| XV Nooj | shade-nooj | 2.790 to 2.100 | 153 to 138 | 1.05 to 1.09 | 1.18 | 0% to 0% | 0% to 0% | -0.05, 2.83, 11.00 | -0.13, 3.02, 12.63 |
| XVI | x2-ixion | 3.400 to 3.175 | 114 to 128 | 1.48 to 1.47 | 1.78 | 0% to 0% | 0% to 0% | -0.26, 3.36, 20.88 | -0.18, 3.15, 18.45 |

## Notes by chapter

**IX (FFX).** *Yojimbo's size on screen is still BOSS SCALE's.* `scaleTarget('yojimbo')` (Bailey, 2026-10-06, "About 1.15x the party", held "until a real FFX screenshot settles his size") grows his drawn height until he reads 1.15 over the party at Tidus's height, in every plan: on the live build that is 2.55 x 1.18 = 3.0, on this branch 2.613 x 1.135 = 2.97 (it ends about where it was; the heroes grew with the stature table, he did not, so his ratio over the party reads 1.13 against 1.19). His real ratio, 1.49 over Tidus (1.44 over the heroes), becomes about 1.0 at the six world units he stands behind them, so BOSS SCALE's 1.15 and the files agree within the perspective. **Retiring BOSS SCALE for him** (one line in `fx/mix/masters.ts`, plus the BOSS SCALE tests that use Yojimbo as their held boss) shows the real height at his depth: 223 px, 1.00 over the party, 15 percent smaller than live. That is option D on the sheet. *Where he can stand:* nearer than z -1.5 he meets the Sensor plate's resting place (x 1071 to 1359, y 415 to 595, open seven seconds on every reveal), Yuna's box, or the enemy shot's frame at 1280x720; the cavern scene's own tests pin all three. Options B and C on the sheet are those moves. *Daigoro and Lady Ginnem* (not sized by BOSS SCALE) show their real heights from far back: 0.29 and 0.53 of the heroes on screen (real at one distance 0.42 and 0.92). *The phone party step* (`CAVERN_PHONE_PARTY_STEP`, 2.0) is **kept**: measured at 390x844 with Yojimbo at real size, Kimahri's box behind the Zanmato gauge is 7,985 px squared of him (32 percent; Lulu 4 percent) with no step and 2,124 px squared (7 percent; nobody else) with the step of 2.0. On the phone Yojimbo (and Daigoro and Lady Ginnem) stand behind the Zanmato gauge in the live build and still do (94 to 100 percent): not a regression, not this lane's.

**XI (FFX-2).** The fiends come forward until their heads stay on the live line (the camera is at head height, so a tall figure's head barely moves as it steps nearer) and the girls' row is not covered: Shiva (1.25, -2.2), Sandy (0.75, -2.6), Cindy (1.5, -3.4), Mindy (2.9, 0.55 hover, -2.0). The Sisters' spots were tuned in the browser so no head sits under another fiend's enemy-intent card (a sweep of seven layouts: the first pass put Cindy's card over 88 percent of Mindy's head). Shiva reads 1.57 against a real 1.94: at 1.94 her feet would stand among the girls (Paine z -1.3; the scene test wants every fiend behind the front girl). Anima (Chapter XI link 3) is untouched.

**XIII (FFX-2).** Trema's real height (1.02 over the girls) is 20 percent under the estimate; at the beast's far-back spot he would read 0.64 (live 0.80). He gets his own spot, `CLOISTER_TREMA_SPOT` (1.3, -0.6), right of the girls and nearer than the beast, where he reads 0.94 (phone 0.96, live 0.87); the kill link's prop walks there. His feet reach y 680, so the room caps the move-advisor card (below). The pass that first built this chapter nearly stopped here: without the cap the card, at its full height from y 588, covers a nearer Trema's feet. `docs/screenshots/r3942-stage/xiii-trema-options-considered.jpg` has the three it weighed, left to right: the live spot with his real height (he would read 0.64), the real height above the card at (1.6, -3.6) (0.73), and forward at (1.9, -2.2) (0.82) with the card over his feet; the build took the forward family with the card capped.

**The move-advisor card cap (Chapters XI, XIII, XV; FFX-2 only).** The Chapter VI mechanism (`SceneStaging.advisorCap`) with a milder number (`src/scenes/advisor-cap.ts`, 52 grid px = 130 px at 1600x900, the card's top at y 705 as at its usual two lines; Chapter VI's 46 moved the card left and laid its tab on Rikku's feet in these rooms). Without it a tall card (a downed girl, a long recommendation) covers the nearer fiends' feet. Side effect: in those three rooms the card prints fewer lines when its text is long, in every link, the giants' included. `docs/CONTRACT-CHANGES.md` has the entry; the pin test lists the scene files that name the field.

**XIV (FFX).** Isaaru (real 1.13 over Yuna) 1.899, at (3.7, 0.4). He stops at z 0.4 on purpose: from z 0.7 CHAPTER FRAMING plans another camera (the rig with a 64 px lens shift instead of standing back 0.5); at 0.4 the planned pose is the live one. *Stopped: Pterya and Spathi.* The game's models are 51.2 (Valefor) and 87.8 (Bahamut) in the default pose, wings spread, which the paintings do not stand in (Bahamut's idle bones span 58); at those numbers Pterya fills the frame (849 px across, wing tip at x 1426 under the CTB list) and Spathi stands 932 px tall in a 900 px frame. Grothia's 31.2 (3.17 here) agrees with the room's 3.2 to 1 percent, so all aeons stay at 3.2 on both sides (a mirror pair reads as one creature). Options on the sheet: A as built; B real heights (Pterya fits, Spathi needs the camera or the idle-bone number, 5.9). Yuna's own aeons (Valefor, Ifrit, Ixion, Shiva, Bahamut) are the same models at 3.2 and are not changed.

**XV (FFX-2).** At the real heights the old far-back spot would read 0.71; beside the party (1.5, -0.4; Nooj -0.8) they read 1.01, 1.01 and 1.07 (real 1.09, 1.09, 1.18). The first try, x 2.0, read the same on the desktop but made the phone's slice fit stand the camera back by 1.9 to 3.4 (the party 17 percent smaller); at x 1.5 it stands back by 0.2. The scene test that wanted every shade behind Paine (z less than -1.3) now wants them beside the party.

**XVI (FFX-2).** The real 3.175 is 6.6 percent under the estimate, so the spot comes forward to keep him from shrinking on screen (1.16 to 1.25 over the girls; real 1.78): the command list takes his hindquarters at x 1246 (9 percent of his box, as live) and the plate's lit floor ends the other way; the hooves stay on the lit floor right of the pit on the desktop and the phone.

## Engine and the camera

Presentation only: the diff of this lane's commits has no `src/battle`, `src/data/**/enemies/**` or golden file; the full unit suite (below) includes the golden digests and the benches. The planned camera at the first menu is the live pose for Chapters IX, XIII, XIV, XV, XVI and XI at 1600x900 (the table); on the phone the slice fit (`ShotRules.fitPhone`, A-12; no camera code changed) stands back where the party and the fiend need it: Chapter IX 17.00 to 17.74 (the heights lane's party step and stature, not Yojimbo), Chapter XIV +0.5, Chapter XV's Baralai +0.25 but Gippal +1.7 and Nooj +1.6 (the party about 14 percent smaller there; the live links differ by 0.7 among themselves), Chapters XI, XIII and XVI within 0.1 or nearer (Ixion 20.9 to 18.4).

## Verified

- `tsc --noEmit` clean at every commit; the merged branches' tests (17 files, 218 tests) green right after the merges; the touched tests green per commit (ffx-fiend-stature 11, ffx2-fiend-stature 8, the scene tests, ffx2-advisor-scene-cap 7).
- **The full unit suite, once, on `10a76c10` (the code head), `--testTimeout=60000`: 930 files, 925 passed and 5 skipped; 13,732 tests passed, 46 skipped, 1 todo; no failure and no timeout** (333 s, in this worktree with the art linked from the release tree). It includes the golden engine digests and the benches: none changed, none re-pinned.
- `node tools/orphans.mjs` names neither `fiend-stature.ts` file nor `advisor-cap.ts` (the listed modules are the old ones).
- **CHK-026 head check, Chapter IX with the stature and the real fiend heights** (`critic/runner/lib/continuity.mjs`, real keys from the title through the chapter won, headless Chromium on the GPU, seed 1, 1600x900; `D:/Tools/pyrefly-overnight/PAUSE` held for the run and removed after): **PASS**. 119 swaps judged, 72 with a registered head (worst jump 0.3 percent; tolerance 3), 47 read by mass (worst 4.8 percent; tolerance 30), 0 unread; feet shift at most 0.9 px; Lulu's knock-out swaps among them (idle to hurt 0.9996, hurt to ko 1.0027). CHK-027 (motion continuity) fails as it does on the 39.4 baseline and in the heights lane's runs (1 snap in 127 s, 6 jerks over 40 px: knock-out cuts and Yojimbo's lunge; not this lane's). Summary and the Lulu knock-out strips: `docs/screenshots/r3942-stage/head-check/`.
- The pictures: headless Playwright from node on the real GPU (`PYREFLY_BROWSER=gpu`), a dev server on 5192 with the art linked and not watched; the browser pane and Chrome were not used. The dev server was stopped by its port at the end.
- Not run: the deploy, a review workflow (`critic-plan`: this is a presentation change across six chapters with a shared HUD cap; it needs a focused review before a deploy), the PCSX2 real-game check of the FFX numbers beyond what the REA lane did.

## Open and disclosed

- **For Bailey's pick:** (1) Yojimbo: keep BOSS SCALE's 1.15 (as built, A) or retire it for his real height (D, 15 percent smaller than today); B and C need the Sensor plate moved. (2) Pterya and Spathi: keep 3.2 or take a number for them (the default pose does not fit the frame; the idle-bone number for Spathi, 5.9, is the candidate). (3) Whether the card cap's side effect (fewer lines when the text is long, in Chapters XI, XIII and XV) is wanted.
- **Phone, Chapter XV:** in the Gippal and Nooj links the slice fit stands the camera back 1.6 to 1.7 more than live (the party 14 percent smaller); in the Baralai link 0.25. Moving the shades nearer the party did not remove it (x 1.5; 2.0 was worse), and the live links differ by 0.7 among themselves, so part of it is the state each link starts in. Not retuned.
- **Not regressions, found on the way:** on the phone Chapter IX's boss and both companions stand 94 to 100 percent behind the Zanmato gauge (live too); in the Sisters' link the enemy-intent card of the acting sister can cover another's head (live: Mindy 0 percent, here 0 after the retune; Sandy 17 percent when Cindy acts); a long guide card covers the head of Yuna in some links of Chapters XI and XV (live too).
- Commit trailers say `Claude Sonnet 5.5` (the agent that wrote them), not the `Opus 5.5` line in the lane brief.
- Commit `75e84c14`'s message gives Shiva's on-screen ratio as 1.26 to 1.50: that was measured at z -2.8; the committed spot (z -2.2) reads 1.57 (this note's table). Commit `dad9bb01`'s message says Yojimbo reads 1.0 over the party where the real ratio is 1.44; with BOSS SCALE on he reads 1.13 (above).

## Steps for the next wave

1. A table row in `src/data/<game>/fiend-stature.ts` with the model ids and the raw height times C, a research section (method, build, caveat, what was not found).
2. Wire it through `SceneStaging.figureHeights`; bring the fiends to where their heads stay on the live line and no HUD box covers them (the intent card for every fiend as the next mover, the move-advisor card, the command list, the Sensor plate where it exists); measure with the planned camera, not the frame-by-frame one.
3. A boss sized by BOSS SCALE (`masters.ts` `scaleTarget`) keeps that size; say so, or retire it with the pick.
4. The captures: headless Playwright from node, `PYREFLY_BROWSER=gpu`, seed 1; wait for the enemy to rest and the camera to settle, then freeze the clocks and measure (FFX-2's ATB is Active: a fiend acts while the menu is open and a capture mid-action is wrong); a later link through the real chain (`want` ids, the earlier fiends left at 1 HP in the page, the `intended` strategy for the Via Purifico duel). Scripts: `D:/Tools/pyrefly-scratch/2026-10-08/r3942-stage/` (`cap.mjs`, `an.mjs`, `proj.mjs`, `numbers.mjs`, `make-sheet.mjs`, `make-options.mjs`, `runall.sh`), a dev server on 5192 that does not watch the art.
