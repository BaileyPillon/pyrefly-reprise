# r3941-stage: real sizes for the fiends, chapter by chapter (branch `r3941-stage`, from `origin/r394-int` 55db51dd)

Bailey, 2026-10-07: the characters look huge and the bosses look tiny. His pick from the Leblanc options sheet (`D:/Tools/pyrefly-scratch/2026-10-07/leblanc-camera/options-sheet.jpg`):
**"Option 3: bosses forward"**: every fiend at its **real size** from the game's HD models, the fiends' lane brought **closer to the party**, the **camera, lens and rigs unchanged**.
This note is the method and the per-chapter results. Chapter VI is done; the next chapters follow the same steps (the list at the end).

## Chapter VI, the Leblanc Syndicate (FFX-2 only) — done

**Game case: FFX-2 only** (rule 14): the five Syndicate models are FFX-2's; nothing here is read by an FFX chapter. The hidden experimental Leblanc chapter (word "leblanc") plays Chapter VI's three acts
and its room **by reference** (`data/chapter-exp-leblanc.ts`, `scenes/exp-leblanc-last-room.ts`: "Chapter VI's room exactly"), so it stands the same fiends in the same places; nothing was done to keep it apart.
Presentation only: **the engine's output is unchanged** (below).

Pictures and ratios: `docs/screenshots/r3941-stage/leblanc-before-after.jpg` (live against the branch, Acts I to III, first command menu, 1600x900 and 390x844, ratios under each frame).

### What changed

| File | What |
|---|---|
| `src/data/ffx2/syndicate-stature.ts` (new) | The sourced table: the 13 girl models (c056 to c070, mean 16.98) and the five Syndicate models (m129 Ormi 19.557, m130 Logos 21.418, m131 Leblanc 17.822, m135 Dr. Goon 18.691, m138 Fem-Goon 17.081), which combatant uses which, and `syndicateFigureHeights(partyHeight)`. |
| `research/ffx2-leblanc-syndicate.md` §20 | The source note: method (HD model bind bounds, build 25501027), the table, the 5 percent caveat, and what was **not found** (no engine scale, no stand positions, no camera). |
| `src/scenes/leblanc-staging.ts` (new) | Chapter VI's staging numbers: real heights, the standing spot of every fiend in every act (`enemySpots`), the fallback lane, the pool, the advisor cap. The long comment is the "why". |
| `src/scenes/leblanc-last-room.ts` | Reads the staging; the 0.7 rule is gone for these fiends (`figureHeights` names all eight combatants); the three bosses' heights are the table's. The rigs are not touched. |
| `src/scenes/types.ts`, `src/app/screens/BattleScreen.ts`, `BattleScreenWiring.ts`, `src/ui/ffx2/FFX2BattleHud.ts` | `SceneStaging.advisorCap` (additive, FFX-2 only, `docs/CONTRACT-CHANGES.md`): a scene may cap the move-advisor card's height. Only Chapter VI's room sets it. |
| tests | `chapters/syndicate-stature.test.ts` (new), `chapters/leblanc-enemy-lane.test.ts` (rewritten: replaces PR-0136's lane test), `chapters/leblanc-scene.test.ts`, `ffx2-advisor-scene-cap.test.ts` (new). |

### The sizes, on screen (1600x900, first menu; "vs girls" = standing height over the girls' mean standing height)

| | live | after | real (same distance) |
|---|---|---|---|
| Act I Ormi / Dr. Goon / Fem-Goon | 0.55 / 0.44 / 0.49 | 1.08 / 0.95 / 0.75 | 1.15 / 1.10 / 1.01 |
| Act II Ormi / Logos | 0.71 / 0.56 | 0.88 / 1.13 | 1.15 / 1.26 |
| Act III Logos / Ormi / Leblanc | 0.62 / 0.71 / 0.56 | 1.13 / 0.88 / 0.70 | 1.26 / 1.15 / 1.05 |

Phone (390x844): Act I 0.59 / 0.46 / 0.51 (Ormi, Goon, Fem) to 1.11 / 0.99 / 0.80; Act II 0.75 / 0.61 to 0.93 / 1.16; Act III 0.69 / 0.76 / 0.63 (Logos, Ormi, Leblanc) to 1.16 / 0.94 / 0.78.
By the earlier options sheet's method (painted rect over the girls' rect mean) Act I reads 0.53 / 0.42 / 0.46 live and 1.03 / 0.92 / 0.71 after; the standing measure is used here because a raised gun or fan
(Yuna, Leblanc) and Rikku's crouch change the rect, not the figure.

### Why the fiends stand where they do (the collisions, found and fixed)

The mock's lane (3.6 units forward, the solver's order) hid two collisions the options sheet showed, and a third that the sheet could not (its frames had the first-run coach card, not the advisor):

1. **The enemy-intent card over Ormi's head** (live, Act I: 100 percent of his head, 35 percent of Dr. Goon's; Act III 100 percent of Leblanc's). The card hangs from the acting fiend's head and is held under the top bar,
   so it is up to 327 px tall with its bottom edge as high as y 409 (Fem-Goon's Blizzard on the whole party). A head above that line is covered whoever acts, and a head higher than the acting fiend's is covered when that
   fiend acts. The solver puts the tallest fiend furthest back and so highest. **Fix: the heads stand level** (Act I: y 411 and lower; Acts II and III: within 11 px), so **a taller fiend stands nearer, not further back**.
   After: the card covers no head in Act I (every fiend acting), at most 4 percent in Act II and 9 percent in Act III (Leblanc's own card grazing Logos).
2. **Fem-Goon against the command list** (the mock's lane put her at x 1198 against the list at 1246). After: every fiend is 103 px or more from the list and inside the HUD rail (0.72 of the canvas).
3. **The move-advisor card over the nearer fiends' feet** (new: it hangs from y 651 at its full height, the nearest fiends' feet reach y 722). **Fix: the scene caps the card** (`LEBLANC_ADVISOR_CAP`, 46 grid px): it prints fewer lines and its top
   stands at y 742, under their feet, as it already passes under the girls'.

The numbers behind the spots, and the unit test that holds them (`leblanc-enemy-lane.test.ts`, through the first-menu camera): spots in `src/scenes/leblanc-staging.ts`. Measured (GPU Chromium, seed 1):

| 1600x900 | feet y | head top y | gap to Paine | gap to command list | card over a head (any fiend acting) |
|---|---|---|---|---|---|
| Act I Dr. Goon / Ormi / Fem-Goon | 685 / 722 / 626 | 414 / 416 / 416 | 135 px | 152 px (Fem-Goon) | 0 percent |
| Act II Ormi / Logos | 633 / 697 | 383 / 376 | 131 px | 164 px | 4 percent (Ormi's card on Logos) |
| Act III Ormi / Leblanc / Logos | 632 / 586 / 696 | 383 / 336 (raised fan) / 375 | 117 px | 103 px | 9 percent (Leblanc's card on Logos) |

Other sizes: **1920x1080** is clean (7 percent at most). **1280x720**: Act I 16 percent on Ormi (live: 100), Act III 5 percent (live: 100), **Act II 82 percent of Logos's head** when Ormi acts (live: 91): at that size the card is relatively
taller (the HUD's type floor) and is held under the top bar, so it covers the highest head; not a regression, not fixed.
Alternatives not taken: the pick's lane unchanged (it needs the advisor card off the feet and covers Ormi's head at 84 percent); shrinking the intent card (a shared HUD constant, FFX too).

### The camera is unchanged

The four rigs are pinned to the digit by a test. At 1600x900 the battle camera is the same pose in all three acts: Act I (0.05, 2.86, 9.25) live and (0.01, 2.89, 9.26) after, Act II (0.08, 2.87, 9.27) and (0.08, 2.83, 9.25), Act III (0.04, 2.87, 9.26) and (0.05, 2.83, 9.25) (the idle sway moves it 0.04 between runs),
lens 32 degrees both. **On the phone** the existing slice fit (`ShotRules.fitPhone`, A-12) stands the master back until every staged figure fits the 390 px slice, and the bigger fiends need more room: Act I z 10.45 to 12.22, Act II 11.29 to 12.22, Act III 12.28 to 12.90
(no camera code changed; the options sheet's own mock stood back to 12.6 in Act I). Holding the phone camera exactly would take the fiends narrower than their real size allows.

### The engine is unchanged

`driveChapter6` (the shipped `intendedStrategy` through all three links; `tests/unit/helpers/ffx2ChapterDrive.ts`), the sha256 of every link's full event log, seeds 1 to 20 at zero decision time and seeds 1 to 10 at 1.5 s:
**byte-identical on origin/r394-int and on this branch** (`cmp` of the two JSON files). No `src/battle/**` or `src/data/ffx2/enemies/**` file is in the diff.

### How the pictures were made

Headless Playwright from node (never the browser pane), real GPU (`PYREFLY_BROWSER=gpu`), seed 1, `?coach=off`, clocks frozen (`fx.freeze`). Acts II and III through the real chain: the harness leaves the earlier act's fiends at 1 HP
in the test page and lets the `attack` strategy finish them at the skip pace, so the girls arrive whole; the link's opening and first menu then play at the normal pace and the harness waits for the cut-in, the seam dialogue and any
action to end. The numbers come from `p.targeting().rects` and the HUD's own boxes; the intent card was measured for every fiend as the next mover by driving the real panel and its placement solver. Scripts: `D:/Tools/pyrefly-scratch/2026-10-07/r3941-stage/`
(`chapter6.mjs`, `measure6.js`, `analyze.mjs`, `make-sheet.mjs`, `build.mjs`: a code-only build into a scratch folder with the art linked, never a full `dist/`).

### Open / for Bailey

- The pick's frames (Fem-Goon 0.95) are not matched: the HUD leaves the fiends a 207 px window at 1600x900 (head under the intent card, feet above the advisor), so the shortest fiend of each act stands furthest back (0.70 to 0.75).
- PR-0136's "150 px from the girls" is superseded by the pick (117 px to 135 px now; the lane is at the party's depth by design).
- At 1280x720 Act II the intent card still covers Logos's head (above).

### Verified (2026-10-07 evening, after the build lane stopped; PROTECT mode)

- `tsc --noEmit` clean. The Leblanc tests, the two new test files and the tests the diff touches (15 files, 270 tests) green. The full unit suite, once, `--testTimeout=60000`: 919 files, 13,618 tests passed, no timeouts, and **one failure, fixed**: `data-ffx2-citations` wants a confidence tag in every `src/data/ffx2` file and `syndicate-stature.ts` had none; it now carries the research note's own `[single source: own measurement]` tag (that file and `syndicate-stature.test.ts` re-run green, 97 tests). `node tools/orphans.mjs` lists neither new module.
- The AFTER pictures were re-shot from the committed code (a fresh code-only build, GPU Chromium, seed 1, `?coach=off`, clocks frozen); the LIVE frames are the earlier capture of bundle D57LJe-j (55db51dd), which was still the live bundle when the AFTER frames were shot. `docs/screenshots/r3941-stage/leblanc-before-after.jpg` is the sheet (made by `make-sheet-v3.mjs` in the scratch folder).
- Standing ratio over the girls' mean, 1600x900, live to after: Act I Ormi 0.55 to 1.09, Dr. Goon 0.44 to 0.96, Fem-Goon 0.49 to 0.75; Act II Ormi 0.71 to 0.88, Logos 0.56 to 1.13; Act III Logos 0.63 to 1.13, Ormi 0.71 to 0.88, Leblanc 0.56 to 0.71. Phone 390x844: Act I (Ormi, Dr. Goon, Fem-Goon) 0.59 / 0.46 / 0.51 to 1.10 / 0.99 / 0.82; Act II (Ormi, Logos) 0.75 / 0.61 to 0.95 / 1.16; Act III (Logos, Ormi, Leblanc) 0.69 / 0.76 / 0.63 to 1.17 / 0.95 / 0.78. A run moves a ratio by 0.01 (the idle sway), so these agree with the table above within that.
- The two overlaps, on the real HUD at 1600x900: the intent card covers **no head in Act I** whichever fiend acts (live: 100 percent of Ormi's), 4 percent of Logos's in Act II and 9 percent of Logos's in Act III (Leblanc's own card); **Ormi's head is clear in all three acts**. The nearest fiend to the command list is Fem-Goon at 151 px in Act I (167 px in Act II, 104 px in Act III, Logos), every fiend inside the HUD rail (x 1152). The advisor card's top is y 741 against the nearest feet at y 723.
- The camera at 1600x900 is the same pose in every act (idle sway only; the rigs are pinned by test). On the phone the existing slice fit (`ShotRules.fitPhone`) stands the master back further for the bigger fiends: Act I z 10.45 to 12.73, Act II 11.29 to 12.76, Act III 12.28 to 13.05 (no camera code changed).

## The steps for the next chapter

1. Read the sourced numbers (`D:/Tools/rea/FINDINGS-sizes.md`), write them as a table in `src/data/<game>/` with a source note in the chapter's `research/*.md` (method, the five-percent caveat, what was not found). A height is only ever a ratio to the party on that stage.
2. Wire the heights through `SceneStaging.figureHeights` (the stage reads it before its own rule) and, where a fiend must stand elsewhere, `enemySpots`. Do not touch the camera; if a real size would need it, stop and report options.
3. Measure the HUD boxes at 1600x900 and on the phone (intent card with its tallest content, advisor card, command list, plates) and stand the fiends so none is covered.
4. Tests (the table, the spots through the first-menu camera), a before/after sheet, a commit with the game case, a handoff section here.
