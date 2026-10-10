# r3942-stage: real sizes for the fiends, wave 1 (branch `r3942-stage`, from `origin/r394-int` 04cdcd45); **wave 2, the FFX-2 giants, is the last section** (Bahamut, Paragon and Oversoul, Anima)

> **2026-10-08, later, in part withdrawn.** Wave 1's *places* (Shiva and the Sisters, Trema, the Den of Woe shades, Ixion and Isaaru brought nearer the girls so that they read as big as the models say) read as "right next to each other", the complaint Bailey made about the Leblanc chapter, and for wave 1 he picked **"Yes, original spacing (Recommended)"**: "Real sizes stay, but every fiend stands where it stood before; no 'right next to each other'". **The sizes (both stature tables, every height below), the method and the research stand; every spot, the shared move-advisor card cap and every "nearer the girls" number in the older sections below do not.** The next section says what is built now; the older text is kept as the record of what wave 1 tried (the notes by chapter further down are marked).

> **2026-10-08, night: Chapter IV's phone hint card is one row** (FFX-2 only). The second repair round's section 5 left "the hint card over Yuna and Rikku" for Bailey's pick among options (a) to (d); the driver took (a), a one-line card, on Bailey's "I'll go with all your recommendations", and it is built: **the last section of this note** has the words, the numbers against live, the other rooms, the fit proof and what stays open.

## Original spacing (Bailey, 2026-10-08, "Yes, original spacing")

**Game case: both games, each by its own chapters** (rule 14): FFX-2 Chapters XI (Shiva, the Magus Sisters), XIII (Trema), XV (the three shades) and XVI (Ixion); FFX Chapter XIV (Isaaru). **Not part of this change:** Chapter IX (Yojimbo, Daigoro, Lady Ginnem: no spot ever moved there, and Yojimbo's BOSS SCALE is untouched), the giants (Bahamut, Paragon, Anima, Vegnagun: their framing is wave 2's) and Chapter VI's Leblanc Syndicate (its own branch, `r3941-spacing`, merged in first as `4330c216`). Presentation only: no `src/battle/**`, no enemy data, no golden file.

**What is built.** Every wave-1 fiend whose stand position moved is back on the spot release 39.4.1 (04cdcd45, the live build) stands it on, at the real height wave 1 gave it:

| Chapter | fiend | stands (x, z), wave 1 to now (now = 39.4.1's) | height (wave 1's, unchanged) |
|---|---|---|---|
| XI Road to the Farplane, link 1 | Shiva | (1.25, -2.2) to (1.12, -5.0) | 3.453 |
| XI link 2, the Magus Sisters | Sandy, Cindy, Mindy | (0.75, -2.6), (1.5, -3.4), (2.9, -2.0) to (0.95, -4.9), (1.85, -2.7), (3.0, -4.0); Mindy still hovers 0.55 | 2.297, 1.480, 1.260 |
| XIII Via Infinito, link 2 | Trema | (1.3, -0.6) to (1.05, -5.8), the beast's spot; the kill link's prop walks there | 1.784 |
| XIV Via Purifico | Isaaru | (3.7, 0.4) to (3.7, -0.2) | 1.899 |
| XV Den of Woe | Baralai, Gippal, Nooj | (1.5, -0.4), (1.5, -0.4), (1.5, -0.8) to (1.12, -5.0), (1.12, -5.0), (1.05, -5.4) | 1.943, 1.949, 2.100 |
| XVI Djose | Ixion | (3.2, -3.8) to (4.2, -6.0) | 3.175 |

Also out: **the shared move-advisor card cap** of Chapters XI, XIII and XV (`src/scenes/advisor-cap.ts`, `FORWARD_FIEND_ADVISOR_CAP` 52 grid px, deleted). It existed to keep the card off feet that stood low; at the old spots the feet stand at y 516 to 608 against the card's top at y 588 to 705 (live, the card at its usual size), so the card is exactly as 39.4.1 had it and prints its full text again. `docs/CONTRACT-CHANGES.md` records the withdrawal; no scene names `advisorCap` any more (the field and its wiring stay). The picture's cap side effect disclosed under wave 1 ("the card prints fewer lines in those three rooms") is gone with it.

**The numbers on screen** (first command menu, seed 1, headless real-GPU Chromium, clocks frozen). LIVE is echoesofspira.com 39.4.1, the earlier capture of the same bundle (`index-DAnPZ-iy.js`); a re-capture of the Trema link today read the same (222 px at 1600x900, 109 px on the phone). NOW is this branch on a dev server. "Wave 1" is what this note's older table gave. The ratio is the fiend's standing height over the party's mean standing height on screen; real is the model's own ratio at one distance. Sheet: `docs/screenshots/r3942-stage/wave1-original-spacing.jpg` (every touched link, live against now, 1600x900 and the phone).

| 1600x900 | ratio live / wave 1 / **now** | real | standing px live / now | HUD over the fiend live / now | card on its head live / now | planned camera live / now |
|---|---|---|---|---|---|---|
| XI Shiva | 1.26 / 1.57 / **1.28** | 1.94 | 359 / 364 | 0% / 0% | 0% / 0% | 0.04, 2.73, 9.79 / -0.02, 2.68, 9.81 |
| XI Sandy | 0.85 / 1.00 / **0.85** | 1.29 | 242 / 242 | 0% / 0% | 0% / 0% | -0.03, 2.71, 9.80 / 0.05, 2.67, 9.82 |
| XI Cindy | 0.73 / 0.60 / **0.63** | 0.83 | 208 / 181 | 0% / 0% | 0% / 0% | (same link) |
| XI Mindy | 0.47 / 0.57 / **0.49** | 0.71 | 134 / 140 | 0% / 0% | 0% / 0% | (same link) |
| XIII Trema | 0.80 / 0.94 / **0.63** | 1.02 | 222 / 177 | 0% / 0% | 53% / 43% | -0.33, 2.90, 9.72 / -0.28, 2.87, 9.70 |
| XIV Isaaru (links 1, 2, 3) | 0.88, 0.88, 0.89 / 0.98, 0.98, 0.99 / **0.93, 0.93, 0.93** | 1.13 | 240, 245, 249 / 254, 258, 260 | 0% / 0% | 0% / 0% | -0.43, 2.25, 11.23 / -0.35, 2.23, 11.24 (link 1) |
| XV Baralai | 0.95 / 1.01 / **0.71** | 1.09 | 276 / 204 | 0% / 0% | 11% / 0% | 0.01, 2.54, 9.72 / -0.06, 2.60, 9.74 |
| XV Gippal | 0.95 / 1.01 / **0.71** | 1.09 | 267 / 201 | 0% / 0% | 2% / 0% | 0.00, 2.81, 9.93 / -0.38, 2.63, 9.94 |
| XV Nooj | 1.00 / 1.05 / **0.75** | 1.18 | 285 / 212 | 0% / 0% | 0% / 0% | 0.03, 2.68, 9.82 / -0.37, 2.64, 9.94 |
| XVI Ixion | 1.16 / 1.25 / **1.08** | 1.78 | 330 / 309 | 9% / 10% | 31% / 31% | -0.30, 2.77, 9.85 / -0.32, 2.73, 9.80 |

| 390x844 | ratio live / wave 1 / **now** | party mean px live / now | camera z live / now |
|---|---|---|---|
| XI Shiva | 1.38 / 1.65 / **1.40** | 123 / 122 | 13.18 / 13.21 |
| XI Sandy, Cindy, Mindy | 0.97, 0.80, 0.53 / 1.09, 0.67, 0.62 / **0.97, 0.70, 0.56** | 104 / 104 | 15.50 / 15.51 |
| XIII Trema | 0.87 / 0.96 / **0.65** | 125 / 154 | 12.46 / 10.10 |
| XIV Isaaru (links 1, 2, 3) | 0.92 / 1.02 / **0.97** | 124 / 124 | 13.81, 13.73, 13.65 / 13.90, 13.85, 13.82 |
| XV Baralai, Gippal, Nooj | 0.99, 1.00, 1.05 / 1.03, 1.04, 1.09 / **0.72, 0.75, 0.79** | 148, 139, 145 / 158, 142, 141 | 10.88, 11.64, 11.05 / 10.21, 11.36, 11.45 |
| XVI Ixion | 1.48 / 1.47 / **1.35** | 77 / 83 | 20.88 / 19.38 |

What it reads like: **a fiend reads as large as its real height over its distance says, and the old spots are far**, so where wave 1 bought a fiend its real ratio by walking it up to the girls, the old spot gives it less: Trema 0.63 of a girl (real 1.02; live 0.80, because the old guess was 2.23 tall), the shades 0.71 to 0.75 (real 1.09 to 1.18; live 0.95 to 1.00), Cindy 0.63 and Mindy 0.49. Where the real height is the old one the picture is live's: Shiva 1.28 (live 1.26), Sandy 0.85 (0.85). Isaaru is 5 percent taller than live at the same place (0.93 against 0.88). Ixion reads 1.08 against live's 1.16 because his real height is 6.6 percent under the old estimate.

**No new collision.** At 1600x900 and on the phone no fiend has HUD on it except Ixion's hindquarters under the command list (9 percent on live, 10 now: the same spot, as live). The enemy-intent card over a fiend's head is the same as live or less (Baralai 11 to 0, Gippal 2 to 0; Trema's 53 to 43 and Ixion's 31 are the fiend's own card, whose tail points at its own head, and Sandy's 72 on the phone is live's, unchanged). The planned camera at 1600x900 is live's pose in every link (within the idle sway of 0.4). Isaaru's right edge stands at x 1308 against the CTB list's 1408, and the move-advisor card needs no cap (above).

**Disclosed.** (1) **Trema's link on the phone:** the girls are 154 px against live's 125 (23 percent larger), the camera at z 10.10 against 12.46: since wave 2's repair that link fits its own figures (live's inherited Paragon's old fit for his 3.1), and a smaller Trema far back lets the fit stand nearer still (the repair measured the girls 8 to 10 percent larger than live with him beside them). Everyone standing is whole in the slice (Trema's painted rectangle ends at x 384 of 390); in the capture's state Yuna is knocked out and lies at the left edge, and her wider lying pose is cropped by 32 px of its 166 (19 percent; live's camera stood back far enough to show it whole). Not retuned: it is the slice fit's (shared, wave 2's), and exact parity needs the giant's old height in the girls' fit, as the repair note says. (2) The Den of Woe's phone: Baralai's link stands the camera 0.67 nearer than live's (the party 7 percent larger), Gippal's and Nooj's within 0.4; Ixion's phone camera 1.5 nearer (the party 8 percent larger). (3) The older notes below (XI, XIII, XIV, XV, XVI and the card cap) are kept as written and marked.

**Verified.** `tsc --noEmit` clean; the merged branch's tests, the 99 test files for the touched scenes, the stature tables, the giants, the Leblanc room and the intent cards (1,154 tests) green after the restoration; **the full unit suite once with `--testTimeout=60000`, on the code head 725136ea plus these records: 939 files, 934 passed and 5 skipped; 13,838 tests passed (46 skipped, 1 todo); no failure and no timeout (271 s).** The pictures: headless Playwright from node on the real GPU, `cap.mjs` of this lane (`D:/Tools/pyrefly-scratch/2026-10-08/spacing2/w1/`: `cap.mjs`, `runlinks.sh`, `table-w1.mjs`, `make-sheet-orig.mjs`), a dev server on 5232 (no production build; stopped at the end). Not run: the deploy, a review workflow, the PCSX2 check.

Bailey, 2026-10-07: "I'll go with your recommendations full speed" (real game sizes for heroes **and** bosses together, giant bosses keep their special framing, FFX and FFX-2 each by their own numbers); for the Leblanc chapter "Option 3: bosses forward" (shipped live as 39.4.1); 2026-10-08, going to bed: "please get a lot of work done ... i trust you." This note is the method, the per-chapter results and what stopped. The pattern is the Leblanc fix's (`docs/handoff/r3941-stage.md`): a sourced size table, the stand positions, the camera unchanged.

**Head:** the code is 10a76c10; the branch tip is the commit that adds this note and the pictures (`git log -1 r3942-stage`), pushed as `origin/r3942-stage`. **Merges:** `origin/r3941-heights` (09ba165a) and `origin/r3941-omnis` (b5f0d26b) merged no-ff onto 04cdcd45 (commits 2d32653f and 5f97c4dd): both clean but for `docs/CONTRACT-CHANGES.md` (two entries at the top, both kept). tsc and the 17 test files they touch (218 tests) green after the merges. Nothing in `src/battle/**`, `src/data/**/enemies/**` or `tests/unit/*golden*` changed in this lane's own commits.

## What changed, by chapter (one commit each; the game case is in every commit)

*Withdrawn in part (2026-10-08, "Original spacing" above): every spot, "nearer the girls", the shared card cap and the "own spot" for Trema in this table. The heights, the two stature tables, the research sections and the size tests stand.*

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

*Wave 1 as first built (the fiends nearer the girls). What stands now, at the original spots, is the table in "Original spacing" at the top; the "after" columns below are the withdrawn numbers.*

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

*Where these notes give a spot, a "nearer" or the move-advisor card cap (XI, XIII, XIV, XV, XVI), they describe wave 1 as first built and are withdrawn (2026-10-08, "Original spacing" above); the sizes, the research and the other findings stand.*

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

---

# Wave 2: the FFX-2 giants (Bahamut of IV, Paragon and Oversoul of XIII, Anima of XI)

**Game case: FFX-2 only** (rule 14). These are FFX-2's own models and chapters (`research/ffx2-bahamut.md` §9, `ffx2-fallen-aeons.md` §13, `ffx2-trema.md` §15); FFX's Bahamut (Chapter XIV's Spathi), FFX's Anima (Chapter III) and every FFX chapter are other models in the other game's files and are untouched. Vegnagun and its parts: no change (parity measured below). Presentation only: no `src/battle/**`, no enemy data, no golden file.

**Bailey, 2026-10-08:** "go with your recommendations and restart the art run" (the picks, ~12:05) and "go with C and restart the giants build" (~13:10). The picks (the giants study, `D:/Tools/pyrefly-scratch/2026-10-08/giants/`): **Bahamut and Paragon/Oversoul: option 3 on a desktop** (the real size with the colossus camera that holds the whole boss with no more painting edge than today: Bahamut 1.8 times as far and 2.9 higher, Paragon 1.9 times as far and 2.4 higher) **and option 4 on the phone** (70 percent of real); **Anima: option 4** (70 percent of real) on desktop and phone; Vegnagun, Yojimbo, Spathi, Shiva: no change. The build lane that began this was interrupted; its work was saved as `r3942-giants-wip` (1422b78b, 6d8672bb on top of 0284bf85) and this lane finished it: **kept** (everything below except the four changes listed under "Changed from the WIP"), because it was read line by line and measured.

## What it is

| Piece | File | What |
|---|---|---|
| The real heights and the picks | `src/data/ffx2/fiend-stature.ts` | rows `bahamut` 87.85 (m168), `paragon` 94.29 (m152), `x2-anima` 136.59 (m169); Chapter IV's girls 17.48; `FFX2_GIANT_SHARE` (Bahamut and Paragon 1 on a desktop and 0.7 on a phone, Anima 0.7 on both) and `ffx2GiantHeight` |
| CHAPTER FRAMING's giant plan and the **giant exception** | `src/engine/fx/mix/giants.ts` (new), `framing.ts` | the three cameras as a table by window shape (not a search: `colossusPin.ts`'s lesson), `decideGiant`, the exception below; a plan that fails a rule or the painting-edge gate plays the fight as it was |
| The phone | `scenes/giant-stage.ts` (new), `bevelle-underground.ts`, `cloister-100.ts`, `road-to-the-farplane.ts`, `road-to-the-farplane-phone.ts`, `ShotRules.ts` | on the upright phone the scene publishes the 0.7 height in `figureHeights`; Chapter IV has the options sheet's own phone idle rig, Anima's link her own phone camera; the A-12 slice fit holds a giant whole below the gauge (`GIANT_PHONE_TOP`) |
| The card | `src/ui/ffx2/intentBoard.ts`, `FFX2BattleHud.ts` | for the three giants the enemy-intent card avoids the painted silhouette (`TargetingPort.rect`), not the head-to-feet estimate |
| Close rigs | `rigWatch.ts` | a giant's camera leaves the close rigs (party, enemy, action) as the scene authored them |

**The giant exception to the 90 percent party floor** (`giants.ts`; the rule everywhere else stays 0.9): for these three bosses **on a desktop window only**, the party may stand down to `GIANT_FLOOR` = 0.45 of today's height (the picks measure 56, 51 and 61 percent at 1600x900), a member may be covered by the boss up to `GIANT_COVER_MAX` 0.4 and by a nearer girl up to `GIANT_OVERLAP_MAX` 0.4 (seen from three times as far the three girls stand in a column); everything else holds (every figure in view, clear of the panels, no more painting edge than today's rig shows, the plate's wings counted). It is pinned by `tests/unit/fx-mix-giants.test.ts` (18 tests: only the three ids, FFX-2 only, a camera for 4:3 to 2.45 and none outside it, the floor values, the phone and an FFX stage and the switch off play no giant, the live check never swaps it, a resize re-plans it and back, the staging is put back when a plan fails).

## The numbers (first command menu, seed 1, headless real-GPU Chromium, live = echoesofspira.com 39.4.1, after = this branch)

"ratio" = the boss's standing height over the girls' mean on screen; girls = their mean standing height, px; the study columns are the options Bailey picked (`giants/numbers.txt`). Card = the enemy-intent card over the boss's painted rectangle (the study's own box measure) and, in brackets, over the boss's own visible pixels (a frame with every enemy hidden subtracted: it counts the boss's glow and aura too, so it overstates). Sheet: `docs/screenshots/r3942-stage/giants-x2-before-after.jpg`.

| | ratio live / study / built | girls px live / study / built | boss px live / study / built | card over the boss live / study / built |
|---|---|---|---|---|
| Bahamut 1600x900 | 1.93 / 3.83 / **3.82** | 289 / 162 / **161** (56 %) | 559 / 619 / **617** | 17 % (15.5 %) / 20 % / **0 % (0.3 %)** |
| Bahamut 390x844 | 1.57 / 2.56 / **2.66** | 130 / 107 / **97** (75 %) | 203 / 274 / **258** | 15 % (4.4 %) / 8 % / **12 % (4.6 %)** |
| Paragon 1600x900 | 1.12 / 4.24 / **4.24** | 277 / 143 / **142** (51 %) | 310 / 608 / **604** | 0 % / 7 % / **0 % (0.0 %)** |
| Paragon 390x844 | 1.22 / 2.87 / **2.97** | 124 / 91 / **83** (67 %) | 152 / 262 / **247** | 0 % / 0 % / **0 % (0.2 %)** |
| Anima 1600x900 | 1.17 / 3.77 / **3.77** | 285 / 175 / **175** (61 %) | 332 / 660 / **660** | 0 % / 35 % / **1 % (1.1 %)** |
| Anima 390x844 | 1.36 / 3.91 / **3.91** | 104 / 86 / **86** (83 %) | 142 / 336 / **336** | 0 % / 8 % / **8 % (6.3 %)** |

World heights: Bahamut 9.147 desktop and 6.403 phone (live 5.686 and 4.100), Paragon 9.447 and 6.613 (live 3.1), Anima 9.6 on both (live 3.4). Nothing is cut by the screen edge in any of the six pictures. The three desktop pictures match the study's option 3 / 4 numbers to within 1 percent. **The phone differs from the study's option 4 picture for Bahamut and Paragon**: the girls 97 and 83 px (study 107 and 91), the boss 258 and 247 px (274 and 262): the slice fit with the gauge reserve (`GIANT_PHONE_TOP` 0.19) stands the camera back a little more than the study's hand-set picture; Anima's phone is the study's to the pixel.

**The camera** (planned pose at the first menu, `framing.giant` in the report): Bahamut (1.89, 4.99, 16.17) against live (0.12, 2.07, 9.31), Paragon (-1.11, 5.53, 18.74) against (-0.48, 3.11, 9.69), Anima (2.29, 2.05, 16.39) against (-0.03, 2.72, 9.80); the camera drifts about 0.1 with its idle sway.

## The enemy-intent card ("the next-move card")

The study found the card on 20 percent of Bahamut (his pick, option 3) and 35 percent of Anima (her pick, option 4; the 42 percent was her real size, option 3, which was not picked). **Fixed on a 16:9 desktop**: the card now avoids the giant's painted silhouette, so it stands in the free band at the right (Bahamut 0.3 percent of his pixels, Paragon 0.0, Anima 1.1 percent, a few chain wisps; live 15.5, 1.5 and 0). Other window shapes, the same capture (pixels of the boss under the card, live then built): 1920x1080 and 2560x1440: Bahamut 0.2 / 0.0 %, Paragon 0.0 / 0.0 %, Anima 0.6 / 1.3 %; **1440x900 (16:10): Bahamut 51.9 % then 18.5 %, Anima 6.4 % then 2.5 %, Paragon 1.4 % then 0.0 %; 1024x768: Bahamut 48.5 % then 20.2 %**. So at 16:10 and 4:3 the card still lands on Bahamut's right wing (a third of what it covered, not zero): the guide column, the card and the command stack cannot stand side by side with a colossus of that width in a window that narrow, and the card may not cover the command stack (it ranks chrome above a painting). Left for Bailey's pick, not built (a new rule): a shorter card for giants (a tighter height cap), or a farther camera below 16:10.
**The phone:** the card is a strip across the top of the field (its second line ends at y 130 at 390 wide). Bahamut's crown (4.6 percent of his pixels, live 4.4) and the tips of Anima's horns (6.3 percent counting her glow, live 0 at her old size) still stand under it, and Paragon's top clears it: the gauge reserve cannot go higher without the girls going under Chapter IV's guide card (Yuna 40 percent hidden at the built 0.19, 60 at 0.26, 77 at 0.31), and the picked picture has it so. For Anima I tried lifting her phone camera 0.6 on its pedestal (the girls' feet stand at y 473, the plates at 487): the menu clearance answered with a 21 px lens shift, her head stayed at y 100 and the girls went 11 px lower, so it was **reverted**. At 360 wide the strip is three lines and covers 13 to 16 percent of each giant, at 430 wide 0 to 0.5 percent.

## Window shapes and the checks beside the picks

- 1600x900, 1665x900, 1710x900, 1800x900 and 1920x1080: Bahamut and Anima play the giant (617 to 740 px, 2000x1012 and 2560x1080 too); 1440x900 and 1024x768: the same, the girls 122 to 175 px, by the window's height; every window from 1.2 to 2.45 for Bahamut and Anima, **1.2 to 1.79 for Paragon** (Chapter XIII's plate has no wings and shows its edge past 1.79: 1620x900 plays today's size, as before wave 2). A square or ultrawide window plays the fight as it did; a window resized across those limits re-plans once it has stood still for 0.4 s.
- Phones: 360x740, 390x844 and 430x932 each hold the giant whole (Bahamut 207, 258 and 302 px, Paragon 219, 247 and 274 px, Anima 268, 336 and 392 px).
- **Close shots** (the girls and the boss in play at 1600x900, 40 s of each fight with the menu left open): Bahamut's `action~calm` shot stood at (1.2, 3.8, 12.5) with the girls and most of him in frame (0.78 of him inside, his head above the frame); Paragon and Anima stayed on the master (Paragon "does nothing", Anima's Stare); no camera inside a giant. **Superseded by the repair round below:** the wait shots now keep a giant whole (A-1), so the close rigs fall back to the master for all three; the one close shot left is the authored Mega Flare countdown beat of Chapter IV.
- **Parity**: Vegnagun's tail link on this branch against live: the same world heights (22.96, 15.99, the girls 1.82), standing px within the idle sway (843 against 846 at 1600x900); Chapter IX (Yojimbo) reads the numbers of wave 1's table (254, 118 and 64 px at 1600x900; 128, 67 and 37 at 390x844). Chapter IX is untouched by this wave: `src/scenes/cavern-stolen-fayth-rigs.ts` is **not** in the diff of `0284bf85..` (the lane brief listed it: the file is only imported by `bevelle-underground.ts` for `viewportAspect`, as before, and carries the heights lane's Kimahri phone step from wave 1, merged with `r3941-heights`, nothing of the giants').
- A faint horizontal haze (the Farplane light planes) crosses Anima's robe at her new size; it is in the scene at the old size too and not this wave's.

## Changed from the WIP

1. `framing.ts`: a giant's window is now watched (`SizeWatch`), so a resize re-plans it (a plan made at 16:9 stayed after a drag to a square window); two tests, the first mutation-checked (it fails without the line).
2. `ShotRules.ts` and `road-to-the-farplane-phone.ts`: the comments of `GIANT_PHONE_TOP` and `ROAD_PHONE_ANIMA` said "the whole figure below the intent strip", which the pictures do not show (the numbers stay the WIP's, kept after measuring 0.26 and 0.31 for the reserve and a 0.6 lift for Anima's camera); they now say what 0.19 costs and buys.
3. New tests the WIP lacked: `giants-card-and-phone-fit.test.ts` (12: the card avoids a giant's silhouette and nobody else's; the phone fit holds the three giants whole with the reserve, and FFX or another fiend not) and `chapters/giants-phone-scenes.test.ts` (7: the three scenes publish the phone height and Bahamut's phone rig, and nothing on a desktop; Trema's, Shiva's and the Sisters' heights kept).
Read and kept as built: the stature rows, `giants.ts` (the cameras, the exception, the plate-with-wings gate, the report), `intentBoard`/`FFX2BattleHud` painted rectangle, `rigWatch` close flag, the three scenes' phone heights, Bahamut's phone rig.

## Verified

- `tsc --noEmit` clean; `fx-mix-giants` 18, `ffx2-fiend-stature` 13, `road-phone-camera` 8, `giants-card-and-phone-fit` 12 and `giants-phone-scenes` 7 pass; **the full unit suite once, `--testTimeout=60000`, on the tree one comment-and-number revert (Anima's phone camera) before the commit, the 13 files that import the reverted files re-run after it (142 tests, green): 933 files, 926 passed and 5 skipped, 13,773 tests passed (46 skipped, 1 todo); two files timed out under load (836 s for the suite against 333 s on wave 1's run, ComfyUI on the GPU): `ffx2-ability-flags` (30 s) and `strategy-ffx2-bahamut` (60 s), both long engine simulations that no wave 2 file touches; re-run alone with `--testTimeout=120000` they pass (22 tests, 53 s).**
- Pictures: headless Playwright from node on the real GPU, a dev server on 5197 (`D:/Tools/pyrefly-scratch/2026-10-08/giants-build/`, `cap2.mjs`, `cover.mjs`, `make-final-sheet.mjs`), stopped at the end. The live pictures are from echoesofspira.com, same seed and moment.
- Not run: the deploy, a review workflow (`critic-plan`: a presentation change to combat framing in three chapters of one game needs a focused review before a deploy), the PCSX2 check.

## Open and disclosed (wave 2)

- **For Bailey's pick:** (1) the card on Bahamut at 16:10 and 4:3 (18 to 20 percent of him, down from 50), and at 360 wide on a phone (16 percent of each giant): a shorter card for giants or a farther camera there; (2) Bahamut's phone crown and the tips of Anima's horns under the intent strip against Yuna under Chapter IV's guide card (the 0.19 / 0.26 / 0.31 trade above; **re-measured in the repair round: the cure-hint card hides about 48 percent of Yuna's pixels and 13 percent of Rikku's at 0.19, live 14.9 and 0**; the wave's first note said 40 percent for Yuna; the independent check and this round's capture agree on 48 to 49); (3) Paragon above 1.79 (an ultrawide window) plays his old size until his plate has wings.
- The phone's girls are 9 to 10 percent smaller than the study's option 4 picture for Bahamut and Paragon (97 and 83 px against 107 and 91).
- Commit trailers say `Claude Sonnet 5.5` (the agent that wrote them), as the earlier lane's did, not the `Opus 5.5` line in the lane brief.

---

# Wave 2, repair round (after the independent check of 2026-10-08)

**Game case: FFX-2 only** (rule 14). Everything below is keyed to the three giants of `FFX2_GIANT_SHARE` (Bahamut, Paragon, Anima) on an FFX-2 engine (`ShotRules.ffx2Framing`); FFX (CTB) and every other FFX-2 fiend play exactly as before (the parity run below). Presentation only: no `src/battle/**`, no enemy data, no golden file. Branch `r3942-giants-wip`, then `r3942-stage` (fast-forward). Commit trailers say `Claude Sonnet 5.5` (the model that wrote them), as the lane before did, not the `Opus 5.5` line in the lane brief.

An independent check (same seed, live 04cdcd45 and the wave-1 head 0284bf85 as baselines) found one major and one moderate issue, a gap in what was disclosed, a nit, and a list of what nobody had covered. This round fixed the first two, measured the rest and corrected the notes.

| Finding | Cause | Change | Result |
|---|---|---|---|
| **MAJOR** Chapter XIII, link 2 (Trema), upright phone: the girls 35 percent smaller than live | the slice fit only stands back, from the rig it is given; CHAPTER FRAMING re-registers `idle` as a copy after every fit, so the next link starts where the last fit left the camera: Paragon's giant fit (18.17) | `FrameFit.LinkFits` and two fits at a giant's battle start | camera z 18.17 to 11.48; the girls 90/84/77 to 152/135/119 px (live 139/124/111) |
| **MODERATE** the opening crops the giants for 2 to 3 s | the scenes' `intro` and `enemy` rigs were authored for the figure each room was built for | `ShotRules.reveal`, `ShotRules.opening` and the A-1 wait shots hold a giant whole | cropped time per opening 3.0 to 4.7 s down to 0 ms, all three giants on a desktop, Anima on a phone |
| **MINOR** Chapter IV phone: the cure-hint card over Yuna and Rikku | the picked 0.19 reserve | measured and disclosed, not changed | Yuna about 48 percent, Rikku 13 (live 14.9 and 0) |
| **NIT** "42 percent of Anima" | that was her real size (option 3); her pick is option 4 | text corrected (handoff, `intentBoard.ts`, the test header) | 35 percent |
| not covered: Anima's reveal, the close rigs | never occurred in a 500-frame auto-battle | forced through the real moments | below |

## 1. Trema's link on the phone (the major)

**The probe** (the check's, and `probe-trema.mjs` here): at link 2's battle start `ShotRules.fitPhone` runs with the three girls and Trema staged (Paragon gone), and the idle rig it is handed is a **new object** (`sameObj: false`) at Paragon's pose, (-0.12, 5.57, 18.17), which the fit leaves where it is.

**The mechanism.** `fitRigToSlice` remembers the authored rig per rig object (`bases`, a `WeakMap`) and only ever stands back from it. CHAPTER FRAMING's `RigWatch.install` re-registers the resting rig as a copy after every plan (`addRig`), so the memory is lost and the next link's fit starts from wherever the last fit left the camera. Before wave 2 that was invisible (both Cloister links need the same 12.45 on the phone); Paragon at 0.7 of his real height, held whole under the boss gauge, stands the camera at 18.17, and Trema inherited it. It is a quirk of every multi-link chapter on a phone (wave 1 saw it in Chapter XV: "part of it is the state each link starts in"); this round does **not** change it for any fight with no giant.

**The change.** `FrameFit.LinkFits` (new, held by `BattleCamera`; `FitSubject.giant?` and the port's subject type gain one optional flag): a fit that holds a giant is its link's own. `ShotRules.fitPhone` fits the figures as every fight did first (a giant at 0.75 and wider than the slice is left out, the girls decide), and then, where a giant is staged, the giant's own fit (`min` 1, `GIANT_PHONE_TOP`, `giant: true`). `LinkFits` remembers the rig as it stood between the two (the girls' fit) and where the giant's fit left it, and the next fit puts it back to the first when it still stands on the second. Anything the scene re-registered in between (the Road's per-link camera) is not put back; a fit with no giant in the chain is `fitRigToSlice` exactly as it was.

**The numbers** (390x844, first menu, seed 1, the check's `v.mjs`: every actor hidden in turn, standing height in px; `docs/screenshots/r3942-stage/giants-x2-repair-trema-link2-phone.jpg`):

| Trema's link, phone | camera (x, y, z) | girls (Yuna / Rikku / Paine) | Trema |
|---|---|---|---|
| live, wave-1 head 0284bf85 | -0.16, 3.35, 12.45 | 139 / 124 / 111 | 120 |
| head ffc5e8d4, before this round | -0.24, 5.53, 18.17 | 90 / 84 / 77 | 82 |
| **after** | **-0.16, 3.21, 11.48** | **152 / 135 / 119** | **129** |

On a desktop the link is untouched (camera z 9.60, 9.58, 9.57; the girls 323 / 279 / 241 and Trema 264 in all three).

**Disclosed: after is not exactly live.** Live's link 2 inherited link 1's fit for Paragon at his old 3.1 (his width, x -1.14 to 3.27 beside the girls, is what asked for 12.45); Trema's own formation fits from the authored rig at 11.5 (measured at the real call: 11.52). With the giant at 0.7 of his real height he is left out of the girls' fit for being wider than the slice, so the chain no longer carries him and Trema's link fits its own figures: the girls and Trema **8 to 10 percent larger than live**, everyone whole in the slice (the ratio of Trema to the girls is the same, 0.96). Exact parity would read the giant at his old height in the girls' fit (a table of the three old heights, or a record the stage keeps); not built. Say so if Bailey wants live's 12.45.

## 2. The opening (the moderate)

The check's frames were right: after the title card the master is whole, but the opening was not. Measured here with a per-frame sampler through the live camera (lens shift and sway included): the share of the boss's painted quad inside the frame, from the first cut off the authored idle to the first menu; for Anima's third link the opening is replayed through `BattleMoments.battleStart` (the harness plays a link seam at the skip pace; the replay reproduced Bahamut's real opening rig for rig). `docs/screenshots/r3942-stage/giants-x2-repair-reveal-before-after.jpg` and `giants-x2-repair-anima-phone-reveal.jpg`.

| Opening | before: time under 98 percent inside | worst share, highest top (NDC) | after: time under 98 percent | worst share, highest top |
|---|---|---|---|---|
| Bahamut 1600x900 | 4698 ms of 9.3 s | 0.792, 1.38 | **0 ms** | 1.000, 0.97 |
| Paragon 1600x900 | 4485 ms | 0.806, 1.36 | **0 ms** | 1.000, 0.98 |
| Anima 1600x900 (replay) | 3548 ms of 6.7 s | 0.746, 1.48 | **0 ms** | 1.000, 0.96 |
| Anima 390x844 (replay) | 2990 ms of 6.7 s | 0.743, 1.48 | **0 ms** | 1.000, 0.96 |
| Bahamut 390x844 | 0 ms | 1.000, 0.90 | 0 ms (same rigs) | 1.000, 0.90 |
| Paragon 390x844 | 0 ms | 1.000, 0.92 | 0 ms (same rigs) | 1.000, 0.89 |

(A top over 1 is the head or horns above the frame: 1.38 is 19 percent of the frame's height.) The phone's Bahamut and Paragon were whole already (they stand back for the slice): by the painted-quad measure they stay 0.89 to 0.92 NDC, and their rigs are the same as before. **The check's remark that Paragon's top spines touch the phone's edge:** it reproduces with a hide-the-actor mask (his own pixels start 3 to 6 px down at the reveal hold, `holdedge.mjs`), and the cause is the Cloister's animated ceiling light, which changes between the two screenshots of the difference and is not him: with the light masked his pixels start 43 px down (8 percent of the 520 px field), and the enlarged frame shows the topmost spine 33 px below the top (`docs/screenshots/r3942-stage/giants-x2-repair-paragon-phone-hold-top.jpg`). Not changed. The same masked check, camera stopped, on the other holds: on a desktop the boss's own pixels start 48 px down for Paragon (5.3 percent of 900) and 67 for Anima (7.4) at the hold, and 115 for Bahamut (12.8; his reveal had already returned to the master when the frame was taken); on a phone 51 px for Anima (10 percent of the 520 px field).

**What changed** (`ShotRules.ts`, `ShotFit.ts`; FFX-2 only, any window):
1. `reveal`: where the boss in play is a giant it is held whole with the girls, as whole as the master keeps it (never under `GIANT_WHOLE_MIN`, 0.97), with room (`REVEAL_GIANT_ROOM`, 0.1: the shot still holds it whole with the camera a tenth of its distance nearer, so the sway and the push never put the crown on the frame's edge); the furthest blend toward the enemy rig that does is played, the master where none does. Where the played rig already holds the giant whole nothing changes. B5 itself stays desktop only; the giant's rule is on a phone too.
2. `opening` (new; `BattleMoments.battleStart` asks it): the first shot is the scene's `intro` unless it cuts the giant (0.95, 0.84 and 0.75 inside for Bahamut, Paragon and Anima; the phone's Bahamut and Paragon hold); then the furthest blend from the master toward it that holds him whole with room (Bahamut 8 percent of the way, Paragon 14, Anima 4; her phone 28), else the master.
3. A-1 (`ffx2Subjects`): an enemy that is a giant is in play only whole, where every other fiend keeps its 75 percent, so a wait shot that would cut one (Bahamut's `action`, 0.78 inside) falls back to the master.

**What the reveal is now.** A giant that fills the frame has no room to push in, so the reveal is a small move on the master (a blend of 4 to 10 percent toward the enemy rig; Anima's phone 29) with the name plate on: the camera barely moves and the boss is whole. If Bailey wants a close-up reveal back, that is a new rig per giant and needs a mockup first (rules 9 and 10): not built.

**Not changed, disclosed: the authored story beat.** Bahamut's Mega Flare countdown (`src/story/scripts/ffx2-bahamut.ts`, the `first-mega-flare-countdown` mid script) is authored `camera('action', 400)` ... `camera('idle', 400)`: a writers' cut, not the shot grammar, played through `BattleScreenCutscenes`. It is the `action~calm` cut-in the check saw (turn 20): (1.27, 3.75, 12.02), the boss 0.78 inside, the head above the frame, for the beat's two lines. The pre- and post-battle scripts' `camera('action')` are no-ops (the cutscene screen has no camera). Giving the beat the same whole-giant blend is one small change in `BattleScreenCutscenes`'s camera port; it is an authored cut, so it waits for a yes.

**The cases nobody had covered** (`closeshots.mjs`, `probe-od.mjs`, `probe-fit.mjs`: the real presenter's moments forced at the first menu, 1600x900, hold released): for all three giants `actionOpen` by the boss (an attack and a cast), by a girl, an attack landing on the boss and on a girl (`impact`), a telegraph and an Overdrive play on the master with the boss at 1.000 (Paragon and Anima never left the master, before or after; Bahamut's telegraph went to `action~calm` before A-1 and now stays). On a phone `ShotRules.fit` always answers `idle`, so no close rig plays there. Anima's reveal: above.

## 3. The Chapter IV phone guide card (the minor)

`.sthint`, the cure-hint card of Chapter IV, hides **about 48 percent of Yuna's pixels (48.2 and 48.6 in two captures) and 13 percent of Rikku's** at the picked 0.19 reserve (this round's `v.mjs`; the check read 48 and 13.1), against 14.9 and 0 on live. The first note said 40 percent for Yuna; the check and this round agree on 48 to 49. It is the picture Bailey picked: `BEVELLE_PHONE_GIANT_IDLE` says Yuna's legs stand under the card as in that picture (the card starts at y 407, her feet are at 445), and a larger reserve (0.26, 0.31) puts her further under it. The other ways out are Bailey's: the card shorter or lower on this fight's first menu, or a smaller reserve with the crown of Bahamut's horns under the intent strip. Not changed.

## 4. Parity (nothing else moved)

The check's parity set on the repaired head against the pre-repair head (`cmp3.mjs`, 12 captures, first command menu, seed 1): Leblanc, Vegnagun, Chapter XI's first link (Shiva), Yojimbo (desktop and phone) and the four FFX chains (Anima/Macalania, Seymour Flux, Braska's Final Aeon, Isaaru/Via Purifico): **11 identical** (every camera within 0.15, every figure within 3 px) and Braska's Final Aeon with one framing number a pixel off, `todayPx` 309 to 308 (the sway). The commit message of `b130ecf2` says 11 captures, all the same: it is 12 and 11 (this note is the count). These captures were taken before the last edit of `ShotRules.opening` (the blend and the room), which acts on the three giants only; the giants' own first menus and Trema's link 2 were captured again on the final code. The six first menus of the giants read the wave-2 numbers again (Bahamut 1600x900 161 px girls and 617 boss, 390x844 97 and 259; Paragon 144 and 612 at a later turn, phone 83 and 248; Anima 175 and 659, phone 86 and 335).

## 5. Tests and checks

- New (40 tests, each mutation-checked by switching the rule off and watching it fail): `frame-fit-link.test.ts` (8: `LinkFits` through `BattleCamera`, the rig re-registered as CHAPTER FRAMING does; a fit with no giant is exactly as before; a retry; a rig some other hand moved is not put back), `giants-phone-link.test.ts` (4: the whole chain, `battleStart` to `fitRigToSlice`, on the real classes: Trema's link equals the fit of a camera that never saw a giant), `giants-reveal.test.ts` (21: the reveal, the room, the master as the last resort, a phone, FFX and other fiends unchanged; the opening and its blends), `giants-wait-shots.test.ts` (7: A-1).
- Changed: `giants-card-and-phone-fit.test.ts` (a giant's battle start is two fits: the girls' then the giant's own); `r392-reveal-push.test.ts` (its stand-in boss was Bahamut, a giant since wave 2; it is now a fiend that is no giant, so those girls-whole mechanics read as they were).
- `tsc --noEmit` clean; the full unit suite once with `--testTimeout=60000` on the final code: 937 files, 932 passed and 5 skipped, 13,816 tests passed (46 skipped, 1 todo), no timeout (527 s); `node tools/orphans.mjs` lists no module this round touched. The first menus, Trema's link 2 and the link probe were captured again on the final code (the numbers above).
- Tools (outside the repo): `D:/Tools/pyrefly-scratch/2026-10-08/giants-repair/` (`probe-trema.mjs`, `reveal2.mjs` and `reveal3.mjs` for the openings, `closeshots.mjs`, `holdedge.mjs`, `tracesum.mjs`, `cmp3.mjs`, `makesheets.mjs`). The dev servers on ports 5203 and 5204 were stopped at the end.

## 6. Open after the repair

- Trema's link is 8 to 10 percent larger than live on the phone (section 1); exact parity needs the giant's old height in the girls' fit.
- The authored Mega Flare beat still shows Bahamut at 0.78 (section 2); a close-up reveal needs new rigs and a mockup.
- The cure-hint card over Yuna and Rikku (section 3), and everything under "Open and disclosed (wave 2)" above.
- Still owed before any deploy: a focused review (`node tools/critic-plan.mjs`); the PCSX2 check. Nothing was deployed.
---

# Wave 2, second repair round (the verifier's finding on the first repair, 2026-10-08 night)

**Game case: FFX-2 only in effect** (rule 14). Everything below is keyed to the three giants of `FFX2_GIANT_SHARE` (Bahamut, Paragon, Anima) on an FFX-2 engine; FFX (CTB) and every other FFX-2 fiend play exactly as before (the parity run below). Presentation only: no `src/battle/**`, no enemy data, no golden file. Branch `r3942-stage` from `b0dd935e`. Commit trailer says `Claude Sonnet 5.5` (the model that wrote it, as the harness asks and as the first repair's did), not the `Opus 5.5` line in the lane brief.

**Bailey's pick** (decision item 23 g of `D:/Tools/pyrefly-scratch/2026-10-07/decisions-to-record.md`): Paragon and Bahamut at real size with the colossus framing on a desktop, 70 percent on the phone; and the girls never shrunk by a later link's camera.

**This round supersedes** section 1 of the first repair round ("Trema's link on the phone": the `LinkFits` that put the rig back only while it stood where the giant's fit left it, and the note that the link is 8 to 10 percent larger than live).

**The finding** (independent verifier, evidence `D:/Tools/pyrefly-scratch/2026-10-08/verify-x/`): at `b0dd935e` Chapter XIII's second link (Trema) on a small upright phone still stood the girls at 57 to 66 percent of live (41, 57, 76, 65 and 100 px at 320x568, 360x640, 360x740, 375x667 and 480x854; the camera at z 15.7 against live's 10.7 at 360x740). The first repair (`b130ecf2`) fixed 390x844 and some taller windows only.

## 1. What was wrong (measured with `probe-early.mjs` and `probe-seq.mjs`, rig registrations logged from the first frame)

Two layers, both visible in the 360x740 and 320x568 logs:

1. **The restore compared poses.** `LinkFits.fit` put the rig back only while it stood within a thousandth of where the giant's fit left it. CHAPTER FRAMING never leaves it there. At 360x740, link 1 (Paragon): the first fit gives z 10.04, the giant's own fit 15.05 (y 5.69), CHAPTER FRAMING's master 15.70 (0.65 further back); when the giant has gone and Trema stands, `Framing` plans again (it re-plans whenever a giant arrives or leaves) and registers a master at 16.36, 1.32 from the giant's fit. Trema's fit then found the rig 1.32 away, put nothing back, and only ever stands back: z 15.7 (the verifier's numbers).
2. **The pose it would have put back was not the chapter's own fit.** The presenter's first fit counts the giant too (0.75, unless wider than the slice), and a 6.6-unit Paragon pulls the camera back and up on a narrow slice: at 320x568 z 10.04 to 10.93 and y 3.06 to 4.10 before the giant's own fit. Putting that pose back (my first attempt, kept in `out/fix-T1`) stood Trema's link at z 11.9 and the girls at 59 px against live's 75 (79 percent). **Live's Trema link starts from the scene's own rig**: at 320x568 CHAPTER FRAMING's master for it in live is exactly the authored `(0, 3, 9.6)`.

## 2. The change: a giant's fit belongs to its link by the rig's line, not by where the rig stands

- `BattleCamera.addRig(name, rig, continues = false)` (`src/engine/BattleCamera.ts`, 398 lines): every registration says whether it is the rig `name` going on or the scene's own camera for the link it stages. A registration that is not a continuation is recorded as the scene's own rig (`LinkFits.registered`: a copy per name) and ends what was kept of a giant's fit for that name.
- `RigWatch.put` (`src/engine/fx/mix/rigWatch.ts`): CHAPTER FRAMING registers its master, the close rigs it re-authors from it, today's rigs put back with CHAPTER FRAMING off, and the put-back in `dispose`, all with `continues`. `BattleCameraLike.addRig` gains the optional argument; a fake camera whose `addRig` takes two ignores it.
- `LinkFits.fit` (`src/engine/FrameFit.ts`): while a giant's fit is outstanding on a rig and no scene rig has been registered since, the next fit of that rig (a link without a giant, or the giant's own link again after a defeat) starts from the scene's own rig, whatever CHAPTER FRAMING did in between. A scene's own rig for the next link (the Road's per-link idle) ends the memory and is fitted as it stands. A standalone `LinkFits` that never saw a scene rig falls back to the pose before the giant's fit. A fit with no giant in the chain is `fitRigToSlice` exactly as before; the desktop never reaches it (`fitPhone` returns early).
- `docs/CONTRACT-CHANGES.md` has the entry; comments in `FrameFit.ts` and `BattlePresenterPorts.ts` say the new target.

## 3. The numbers (first command menu, seed 1, headless Playwright, real GPU, clocks frozen; girls = mean standing height in px)

Four builds, same harness, same seed: **live** (echoesofspira.com, 39.4.1), **wave-1 head** (`0284bf85`, no giant code at all, a `git archive` served by a scratch server: it tracks live at 99 to 100 percent everywhere, so it is the picture of "no giant before the link"), **before** (`b0dd935e`) and **after** (this repair). Three repeats of the three smallest windows were identical to 0.3 px, so the numbers are not noise.

**Trema's link (link 2)**, girls px (percent of live's Trema link):

| window | live | wave-1 head | before | after |
|---|---|---|---|---|
| 320x568 | 75 | 75 (100 %) | 41 (54 %) | 72 (96 %) |
| 360x640 | 89 | 89 (100 %) | 57 (64 %) | 97 (109 %) |
| 360x740 | 115 | 115 (99 %) | 76 (66 %) | 128 (111 %) |
| 375x667 | 97 | 97 (100 %) | 64 (67 %) | 106 (109 %) |
| 390x844 | 125 | 123 (99 %) | 153 (123 %) | 157 (126 %) |
| 393x852 | 137 | 135 (99 %) | 149 (108 %) | 152 (111 %) |
| 412x915 | 144 | 142 (99 %) | 167 (116 %) | 167 (116 %) |
| 430x932 | 150 | 148 (99 %) | 174 (117 %) | 174 (117 %) |
| 480x854 | 155 | 153 (99 %) | 100 (64 %) | 163 (105 %) |
| 540x960 | 173 | 172 (99 %) | 118 (68 %) | 196 (113 %) |
| 844x390 (landscape) | 122 | 120 (99 %) | 120 (99 %) | 120 (99 %) |

The camera's `idle` rig z (live / before / after): 9.60 / 17.12 / 10.04 at 320x568; 10.47 / 15.85 / 9.60 at 360x640; 10.67 / 15.70 / 9.60 at 360x740; 10.47 / 15.21 / 9.60 at 375x667; 12.38 / 10.04 / 9.76 at 390x844; 10.18 / 15.21 / 9.60 at 480x854. Against the verifier's own live readings (implied by its percentages: 72, 97, 115, 107 and 154 px; they sit close to live's first-link girls, 73, 98, 117, 107 and 156) the five windows of the finding read 100, 101, 111, 99 and 106 percent.

**Paragon's own link (link 1) is untouched**: before and after are the same to the pixel at every window (girls 41, 57, 76, 65, 83, 84, 87, 91, 100, 118 px at 320x568 to 540x960, 121 px at 844x390; Paragon 121 to 340 px), because nothing is kept before the first fit. The picked framing holds: the girls 56 to 68 percent of live on the phone, Paragon whole.

**The desktop giants are unchanged** (before and after, 1600x900; live in brackets): Bahamut girls 162.6 px, boss 617 (live 294.9 and 566); Paragon girls 143.3, boss 612 (live 281.0 and 314), at 1440x900 143.3 and 612; Anima girls 174.6, boss 659 (live 285.8 and 333). Trema's link on a desktop is the same in both: 283 px at 1600x900 and 255 at 1440x900 (live 275 and 248; Trema is 1.78 units since wave 1, live 2.23). **The landscape phone (844x390)** is by design the desktop's plan (the window is in the giants' aspect table): Bahamut girls 70 px (live 127: the 55 percent the verifier saw, the same share as the desktop's 56 percent, Bailey's item 23 j), Anima 76 (61 percent), Paragon 121 (99 percent: his table stops at 1.79, so he plays his old size), Trema 120 (99 percent). None of these moved.

**Nothing else moved.** First menus of five chapters with no giant, 390x844 and 1600x900, before against after: Leblanc, the Den of Woe, Isaaru (FFX), Yojimbo (FFX) and Braska's Final Aeon (FFX): ten captures, every figure within 1 px and every camera within 0.01 (the idle sway). The Road's three links on the phone (Shiva, the Sisters, Anima) at 390x844 and 360x740: six captures, before and after identical (the Road registers its own rig per link: the path `registered` exists for). A retry of Paragon's link (`ShotRules.fitPhone` run again on the same camera, three times, with CHAPTER FRAMING planning in between): the rig after the retry is within 0.013 of the first run's fit (360x740: 15.061 against 15.048; 390x844: 18.157 against 18.169), the same every time, no creep.

## 4. Why Trema's link is not exactly live's, and what is disclosed

- **Larger than live from 360x740 up (105 to 126 percent).** Live's Trema link inherits Paragon's old 3.1-unit width: either through CHAPTER FRAMING adopting the first link's fit as its base (360x740, 390x844 to 430x932, 480x854 and 540x960: z 10.2 to 12.4, the rig live's Paragon link ends on) or through a plan made while the dying Paragon is still counted (360x640 and 375x667: z 10.47 where the first link stayed at 9.6). Trema's link now fits its own figures from the scene's rig, as the first link of a chapter does. Exact parity would read the giant at his old height (3.1, 4.1 and 3.4) in the presenter's first fit; not built, it is a table of three numbers and a new reading in `boxOf` (the first repair's note read "8 to 10 percent" at 390x844 on an earlier head, before wave 1's fiends went back to their old spots; the figures above are this head's). At 390x844 the closer camera makes CHAPTER FRAMING shift the picture 74 px (live 0), and with Yuna down at the seam her lying body is cut at the left edge in this seed; the same at the tip (it was there before this repair).
- **320x568 is 96 percent of live's Trema link (72 against 75), every run.** That is CHAPTER FRAMING's own plan for Trema's real figures, now made after the giant has gone (`back` 1.04, `ok`), where live's plan for this link is made while Paragon still stands and stays at the authored distance (`back` 1, `ok` false). The wave-1 head, which has no such re-plan, gives 75. It is not the fit's memory (the fit hands CHAPTER FRAMING the authored rig, which is what live's plan started from too); against the verifier's reference (73) it is 99 percent. Say so if Bailey wants a window this narrow held at live's number: the plan, not the fit, would need a rule.
- **Anima's link on a 360x740 phone depends on the path** (found on the way, identical before and after, not this repair's): reached directly the camera stands at z 19.49 (girls 69 px, Anima 268); reached by playing the Road's three links, with their menus opened, it stands at 22.97 (girls 58 px, Anima 236); at 390x844 and wider the two agree (85.7 px). The probe (`probe-early.mjs`, `logs/probe-early-anima-360x740-fix.log`) shows why the fit is not what places her: the Road registers her own rig (z 19.49) 2 ms after the presenter's two fits, overwriting them, and CHAPTER FRAMING's master from that rig then stands at 22.97 when it knows the menus' panels. The picked picture (item 23 h, 70 percent) was solved at 390x844.

## 5. The Chapter IV phone hint card (verdict: not the card's placement; reported, not changed)

Measured on the girls' own pixels (the actor hidden on the clean frame, a control pair masking the idle motion; `cover.mjs`), at the first menu, the share of each girl under the guide card (`.sthint`); live / before / after:

| window | card | Yuna | Rikku | Paine |
|---|---|---|---|---|
| 390x844 | y 407 to 480, x 8 to 382 | 6 / 48 / 54 % | 0 / 13 / 15 % | 0 / 0 / 0 % |
| 430x932 | y 515 to 568 | 0 / 20 / 20 % | 0 / 0 / 0 % | 0 / 0 / 0 % |
| 360x740 | y 303 to 376 | 39 / 80 / 75 % | 10 / 46 / 41 % | 0 / 14 / 16 % |
| 375x667 | y 230 to 303 | 65 / 99 / 99 % | 36 / 87 / 85 % | 11 / 61 / 60 % |

The card is where it always was (`.sthint--phone`, docked just above the party chips, the same top and height in live and after). What changed is the girls: the picked 70 percent and the 0.19 reserve under the boss gauge stand them smaller and lower, and the options sheet's own picked frame (option 4) already shows their legs behind the same card. On short phones the card covered them in live too (Yuna 39 percent at 360x740, 65 at 375x667), because the chips sit high and the field is short; it is a placement problem of the card against the field that the giants only deepen. No placement frees them without covering something else (the strip above, Bahamut's body, the chips), so nothing was built: it is a perceivable change (rule 9). Options for a pick, each cheap to mock: (a) a one-line card for this fight (saves about 40 px: at 390x844 the feet at y 445 clear it; short phones still overlap), (b) the card docked to the right half, clear of the girls and over Bahamut's tail, (c) a smaller `GIANT_PHONE_TOP` (the girls rise, Bahamut's horns go further under the intent strip), (d) keep the pick as it is.

## 6. Tests and checks

- New and changed (all in `tests/unit`): `frame-fit-link.test.ts` (20: the measured drift of 0.65 per plan and 1.32 at the seam, several plans in a row from a hair to 7 units, a retry, the next link after a giant starting from the scene's rig, the pose between the two fits not being the target (a slim giant), two giants in a row, the Road's own rig ending the memory, a standalone `LinkFits`), `giants-phone-link.test.ts` (8: the real `RigWatch` between the links at five phone slices, the giant's own link untouched, a retry with no creep, FFX unchanged), `rigwatch-continues.test.ts` (5: the master, the close rigs, the put-back and `dispose` pass `continues`; a two-argument camera works).
- **Mutation-checked** (`mutate.mjs`, each rule switched off, then the file put back): CHAPTER FRAMING registering without `continues` fails 8; restoring the pose between the fits fails 8; never recording the scene's rig fails 8; a scene's rig not ending the memory fails 1; the memory not consumed by the next fit fails 2; the first repair's rule (the equality) failed 12 of the earlier set.
- `tsc --noEmit` clean; touched files under 400 lines; `node tools/orphans.mjs` lists nothing this round added. The full unit suite once with `--testTimeout=60000` on the final code: 940 files, 935 passed and 5 skipped, 13,859 tests passed (46 skipped, 1 todo), no failure and no timeout (155 s).
- `node tools/critic-plan.mjs --paths` on the three engine files: DEEP (the build already owes it: 43 substantial checkpoints since the last deep review); before any deploy a focused review of the candidate. Not run: the deploy, a review workflow, the PCSX2 check. Nothing was deployed and no production build was made.
- Tools and evidence (outside the repo): `D:/Tools/pyrefly-scratch/2026-10-08/linkfit-repair/` (`cap.mjs`, `cover.mjs`, `probe-early.mjs`, `probe-seq.mjs`, `probe-retry.mjs`, `probe-plan.mjs`, `mutate.mjs`, `makesheet.mjs`, `out/{live,base,tip,fix,fix-T1,cover,var,par}`, `logs/`). The dev servers on 5251, 5252 and 5253 were stopped at the end. The proof sheet: `docs/screenshots/r3942-stage/giants-x2-repair2-trema-link2-phones.jpg` (live, before, after at 320x568, 360x740 and 375x667).

## 7. Open after the second repair

- Trema's link is 105 to 126 percent of live from 360x740 up, and 96 percent at 320x568 (section 4); exact parity needs the giants' old heights in the presenter's first fit, and a rule in the plan for the narrowest window. Bailey's call.
- The hint card over Yuna and Rikku (section 5): a pick between options (a) to (d). **Closed 2026-10-08, night: (a) is built** (the last section, "The Chapter IV phone hint card: one row"); (b) to (d) were not mocked.
- Anima's camera on a 360x740 phone when the Road is played through (section 4).
- Everything under "Open and disclosed (wave 2)" and "Open after the repair" above that this round did not touch.

---

# The Chapter IV phone hint card: one row (Bailey, 2026-10-08, night)

**Game case: FFX-2 only** (rule 14). The card is the cure-hint card (`.sthint`, `src/ui/common/statusHintCard.ts`) and the change is keyed to `game === 'ffx2'` on the upright phone, so FFX's phone card (FFX's own words and cure table) and every desktop card of either game keep their sentences; the browser shows it: FFX's Seymour Flux card reads and measures the same before and after ("GUIDE CURSE Tidus is cursed: Holy Water cures it.", 53 px). It applies to **every FFX-2 room**, not only Chapter IV, because one component draws the card in all of them; the other rooms are measured below. Presentation only: no `src/battle/**`, no enemy data, no golden file, no camera or figure code. Branch `r3942-stage` from `d674a9e2`.

**Bailey's pick** (2026-10-08, about 22:00 EDT, as the driver relayed it: "I'll go with all your recommendations"): the driver's recommendation was option (a) of section 5 above, a one-line card. The mock round for the other three (the card docked to the right half, a smaller top reserve, keep it as picked) was stopped when he decided, so (b) to (d) were never pictured and no scratch worktree was made.

## What it is

| Piece | File | What |
|---|---|---|
| The words | `src/ui/common/statusWords.ts` | `CureHint.line` and `HintRow.line` (both optional): FFX-2's sleep, silence and curse rows each carry a one-row form, the *whole* cure list the sentence names (PR-0290) and none of its prose; FFX's rows have none |
| The card | `src/ui/common/statusHintCard.ts` | `oneLineCard(game, hints, phone)` (FFX-2, a phone, a hint with a row); `hintCardHtml(hints, phone, oneLine = false)` (the third parameter is additive; the desktop's compact one-sentence form passes none); the card keeps its game and sets `sthint--line` before it docks, so the dock measures the one-row height |
| The look | `src/ui/common/status-o3.css` | four rules, all `.sthint--phone.sthint--line`: a flex row (gap 6, padding 6 8 6 10), the chip's letter spacing 0.12em and padding 1 4, the body `flex: 1 1 auto; min-width: 0`. It sets no font size (the 14.2 px floor and the TEXT SIZE rules stand), no position (the dock is the same, 6 px above the party chips) and nothing that clips |
| Tests | `tests/unit/status-hint-one-line.test.ts` | 14 tests (under "Verified") |

The words. The cure lists are the sentences' own (`research/ffx2-combat-core.md` §2.8 and its cure table; nothing new is stated):

| Status | The phone card said | The phone card says |
|---|---|---|
| Curse | `GUIDE [CURSE]` over "Paine is cursed: Holy Water, Esuna or a Remedy cures it." | `[CURSE] Paine: Holy Water, Esuna, Remedy` |
| Silence | `GUIDE [SILENCE]` over "Rikku is silenced: Echo Screen, Esuna or a Remedy cures it." | `[SILENCE] Rikku: Echo Screen, Esuna, Remedy` |
| Sleep | `GUIDE [SLEEP]` over "Yuna is asleep: gauge frozen, no turns. A hit, Esuna or a Remedy wakes her." | `[SLEEP] Yuna: a hit, Esuna, Remedy` |

The word GUIDE is gone from the phone card (the red chip is its label, and a row has no room for both at 14.2 px). A hint with no row (an older literal; every FFX hint) keeps its sentence under GUIDE. The longest row, "Rikku: Echo Screen, Esuna, Remedy" (33 characters), is the budget the test pins.

## The numbers: Chapter IV (Bahamut), first command menu, seed 1

Share of each girl's own painted pixels under the card (the actor hidden on the clean, frozen frame; a control pair masks what moves by itself), mean of three runs with the range. **Live** is echoesofspira.com (bundle `cUSnFK7q`, 39.4.2); **before** is this branch at `d674a9e2`, served by a second dev server that takes the three changed files as HEAD has them; **after** is this change. Headless Playwright from node on the real GPU, the same moment and the same measure for all three. Paine starts cursed in this fight, so the card is up at the first menu.

| window | card, px tall and top to bottom: live and before / after | Yuna: live / before / **after** | Rikku | Paine |
|---|---|---|---|---|
| 390x844 | 73, y407-480 / 31, y449-480 | 8 / 52 [48-55] / **6** [4-11] | 0 / 15 [13-15] / **0** | 0 / 0 / **0** |
| 360x740 | 73, y303-376 / 31, y345-376 | 39 / 76 [75-77] / **21** [20-22] | 10 / 44 [41-46] / **0** | 0 / 15 [13-17] / **0** |
| 375x667 | 73, y230-303 / 31, y272-303 | 65 / 98 [95-100] / **38** [34-42] | 34 / 84 [80-87] / **8** [6-10] | 11 / 55 [50-62] / **0** |
| 430x932 | 53, y515-568 / 31, y537-568 | 0 / 20 [19-20] / **0** | 0 / 0 / **0** | 0 / 0 / **0** |

Under the new card the girls are covered **less than on live at all four windows**, though they are smaller than live's (the picked 70 percent). Bahamut under the card: 0 on live and after; before, 1 percent at 360x740 and 6 at 375x667. Run to run the figures move a few points because the girls idle. **Nothing else moved**: the planned idle camera is identical to three decimals in all four windows before and after (-0.320, 4.655, 16.479 looking at -0.058, 3.704, 6.528, fov 32), the actors' world positions are within 0.002 and their world heights identical (two runs each). Text: 14.2 px on the card, the chip, the head and the body in every capture (CHK-003's 14 px floor holds).

Where the card still touches them: the girls' feet stand 6 to 27 px below the new card's top edge, because the card is docked 6 px above the party chips (Yuna's feet at y 455 against the card's top at y 449 at 390x844, y 362 against 345 at 360x740, y 298 against 272 at 375x667). Clearing them would take a figure or camera move (not part of this pick) or a different dock (options (b) to (d)).

Sheets: `docs/screenshots/r3942-stage/hint-card-one-row-before-after.jpg` (live | before | after, the four windows, one capture each) and `hint-card-one-row-target-step.jpg` (below).

## The other FFX-2 rooms

The card is the same component in every room, so each room's first link was measured with a Curse forced on Paine (the clocks frozen first: a status poked into the state is the HUD's view only until the next sync, about 1.5 s, unless the clocks are stopped). Yuna / Rikku / Paine, percent of each girl under the card, before then after; the foe is the largest share of any fiend under the card where it was not 0:

| room (first link) | 390x844 | 360x740 | 375x667 |
|---|---|---|---|
| V Vegnagun (the tail) | 10/5/1 then 0/0/0 | 43/32/47 then 0/0/0 | 79/70/89 then 6/1/0 (Vegnagun 8 then 0) |
| VI Leblanc (Ormi and the goons) | 25/6/0 then 3/0/0 | 29/13/0 then 3/0/0 | 54/39/36 then 12/16/0 (Fem-Goon 43 then 0) |
| XI Road to the Farplane (Shiva) | 0/0/0 then 0/0/0 | 20/0/0 then 0/0/0 | 43/8/1 then 0/0/0 |
| XIII Cloister (Paragon) | 34/21/0 then 0/0/0 | 85/69/50 then 38/24/0 | 67/97/95 then 57/40/16 (Paragon 13 then 0) |
| XV Den of Woe (Baralai) | 24/0/0 then 1/0/0 | 31/9/0 then 3/0/0 | 59/26/12 then 24/0/0 |
| XVI Djose (Ixion) | 0/0/0 then 0/0/0 | 0/0/0 then 0/0/0 | 30/10/0 then 0/0/0 |

Every cell is lower after than before; none is higher. The cells still above 20 percent are the short phones in the rooms where the girls stand lowest: Chapter XIII's Paragon link (Yuna 38 and Rikku 24 at 360x740; Yuna 57, Rikku 40 and Paine 16 at 375x667), Chapter IV at 375x667 (Yuna 38) and the Den of Woe at 375x667 (Yuna 24). Chapter XI's Anima link and Chapter XIII's Trema link (later links) were not surveyed.

## The fit: one row from 360 px

Each status on each girl through the real HUD (a status forced with the clocks frozen), the card's rows and its slack at the end of the row, the least over Yuna, Rikku and Paine (px to spare; 2 rows = the body wrapped, 50.3 px tall):

| window | Sleep | Silence | Curse |
|---|---|---|---|
| 320x568 | 1 row, 38 | 2 rows | 2 rows |
| 360x740 | 1 row, 78 | 1 row, **8** | 1 row, 29 |
| 375x667 | 1 row, 93 | 1 row, 23 | 1 row, 44 |
| 390x844 | 1 row, 108 | 1 row, 38 | 1 row, 59 |
| 430x932 | 1 row, 148 | 1 row, 78 | 1 row, 99 |
| 480x854 | 1 row, 198 | 1 row, 128 | 1 row, 149 |

Silence at 360 px is the tight one ("Echo Screen" is the longest name): in the in-page prototype, before the padding was trimmed, the list written with "or" ("Rikku: Echo Screen, Esuna or Remedy") ran 11 px over at 360 px and the sentence "...cures it" ran 49 px over for Curse; the commas are why the final rows fit. **WebKit** (iOS) gives the same numbers as Chromium for the real `StatusHintCard`, the real stylesheet and the real fonts (Silence at 360: 12 / 9 / 8 for Yuna / Rikku / Paine). The card never clips: a window too narrow for the row (320 px) or the wide TEXT SIZE setting (FFX-2's `data-text-size-wide`, off today) wraps the body under the chip to a second row (50 to 62 px), checked by rendering both. **Firefox could not be launched on this machine** (the installed build fails to spawn), so it is untested.

## The target step (a side effect, and the better one)

At the target step the card docks under the target card when it fits above the tap line (`dockPhone`, PR-0303). The 73 px sentence card fitted on none of 390x844, 360x740 and 375x667 and stayed above the party chips, over the girls; the 31 px row fits on all three: 390x844 y675-706 (the target card ends y671, the tap line starts y727), 360x740 y571-602, 375x667 y498-529. No code was written for it: the dock's own rule meets a shorter card. Real touch taps (Playwright's touchscreen: ITEM, then Remedy), no state pokes, no errors; sheet `docs/screenshots/r3942-stage/hint-card-one-row-target-step.jpg`.

## Verified

- `tsc --noEmit` clean. `node tools/orphans.mjs` names nothing this change added; files all under 400 lines.
- **`tests/unit/status-hint-one-line.test.ts`, 14 tests, mutation-checked**: 12 mutations, each switching one rule off in the source and put back byte for byte (hash-checked), all 12 killed (the card never gets the class; the class stays on a hidden card; the row keeps GUIDE; the desktop's compact form takes the row; the curse list loses Esuna; the silence row runs past the 33-character budget; FFX gets a row; the CSS clips with `overflow: hidden`; the CSS sets a 13 px size; the CSS loses its phone qualifier; `cureHint` drops the row; `oneLineCard` ignores the game). The first pass left one alive, the game check, because FFX data carries no row anyway; a test with an FFX hint that does carry one was added and kills it. The three older test files for the card (`status-o3-hint-place` 20, `status-o3-mapping` 18, `r35-ui-splash-hint` 5) are green and unchanged.
- **The full unit suite once, `--testTimeout=60000`, on the final code** (the machine was busy with other sessions' browsers, 546 s): 941 files, 935 passed, 5 skipped and **1 failed**; 13,872 tests passed, 46 skipped, 1 todo, **1 failed**. The one failure is `tests/unit/audio-manifest-io.test.ts` "serialises writers: no lock holder sees another inside its critical section": `EPERM: operation not permitted` opening its own temp `manifest.json.lock` in `tools/audio/manifest-io.mjs`, a Windows file-lock race under load that has nothing near the card; **the same file re-run alone with the same flags passes, 16 of 16** (101 s). Nothing else failed and nothing timed out.
- Browser: headless Playwright from node on the real GPU, seed 1, clocks frozen, the first command menu; live is the production site read-only. The real-input check is the real taps above. The two dev servers (5281 on this tree, 5282 on HEAD's three files) were stopped by port; no production build, no deploy, no review workflow was run.
- `node tools/critic-plan.mjs --paths` on the three source files: DEEP (global layout, the build already owes it), a focused review of the production candidate before any deploy; checks CHK-002, 003, 008, 009, 015, 016, 017, 020, 021. Still owed before a deploy.
- Tools and evidence (outside the repo): `D:/Tools/pyrefly-scratch/2026-10-08/hintcard/` (`cover2.mjs`, `survey.mjs`, `probe-real.mjs`, `probe-line.mjs`, `engine-fit.mjs`, `realinput.mjs`, `wrap-probe.mjs`, `mutate.mjs`, `table.mjs`, `survey-table.mjs`, `makesheet.mjs`, `makesheet-target.mjs`, `dev.config.mjs`, `dev-before.config.mjs`, `out/`); the sheets are also there as `before-after-sheet.jpg` and `target-step-sheet.jpg`.

## Disclosed

- **The word GUIDE is gone** from FFX-2's phone card, and the sentences are trimmed to the cure lists: Sleep loses "gauge frozen, no turns" and "wakes her", the three rows use commas where the sentences said "or a". If Bailey wants other words they are one line each in `statusWords.ts`, and each must keep fitting 360 px (Silence has 8 px to spare).
- **Short phones still overlap** in the rooms and windows named above; that is the dock, not the text.
- **FFX's phone card has the same kind of overlap** and was not touched (FFX is not part of this pick): Seymour Flux at 390x844 with a forced Curse, Tidus 28, Yuna 41 and Kimahri 16 percent under its 53 px card, identical before and after (not measured on live).
- Chapter XI's Anima link and Chapter XIII's Trema link were not surveyed; Firefox was not testable.
- No ledger row (D-, A-), no NOW.md and no CHANGELOG entry were written by this lane: the decision and the build are the driver's to record.
- The commit trailer says `Claude Sonnet 5.5` (the model that wrote it), as the earlier lanes' did, not the `Opus 5.5` line in this lane's brief.
