# booth-ffx-b4-hud: Chapters IX and XII come back on the treated list (FFX only; release 71 candidate)

Branch `booth-ffx-b4-hud`, cut from `origin/r70-int` e3f51bf18. **Game case (rule 14): FFX only.** Chapter IX (`yojimbo-cavern`, Yojimbo's Zanmato gauge) and Chapter XII (`seymour-omnis`, the Mortiphasm disc strip and the Enemy Intent card) are panels of the FFX HUD (`src/ui/ffx`); FFX-2 has no panel of this kind, Chapter IV's F1 HUD and Chapter I's are not touched. Presentation only: no number of a fight changes. **No browser, dev server, Playwright or GPU ran in this lane** (the release-70 review owns the browser); the proof is the stylesheets read by unit tests (the anchor math with the 12 degree shear) and the r70 evidence on disk, and the browser read is written below as jobs with predictions (rule 15). Nothing deploys from this branch. Authority: Bailey 2026-10-30, "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters (meaning ones that arent hidden) please start with leblanc"; 2026-10-29, "keep going please you make all executive decisions for the next few days. i'll go with all of your recommendations". Every call here is the driver's, delegated, and Bailey's to overturn.

## 1. What changed

| file | what |
|---|---|
| `src/ui/hudf1/hudf1-chapters.css` (new, 63 lines) | the F1 HUD against the two panels: IX's gauge panel `left: 511px` of its 1440 frame; XII's intent card `bottom` 288 / 322 / 356 frame px at text size 100 / 115 / 130; XII's disc strip and IX's gauge keep their size at 115 and 130 (`scale: none`) and the strip follows the turn strip's left edge. Every selector hangs from `.ffxhud.hud-f1` and from the panel's own class, with `:not(.ffx-zg--phone)` / `:not(.ffx-omr--phone)` |
| `src/ui/hudf1/HudF1.ts` | one line: `import './hudf1-chapters.css'` after the other F1 sheets (345 lines) |
| `src/engine/motion/DemoGate.ts` | `'yojimbo-cavern': { game: 'ffx', since: 'r71' }` and `'seymour-omnis': { game: 'ffx', since: 'r71' }` back in `TREATED_CHAPTERS` (in their old places: after Natus, after Braska), the two "LEFT THIS LIST" comments say they are back and why; 266 lines |
| `src/engine/motion/PieceHolds.ts` | only the two "UNTREATED" comments (IX and XII rows are unchanged: the lanes' own holds, read again) |
| `tests/unit/booth-ffx-b4-hud-layout.test.ts` (new, 18 tests, 330 lines) | the layout proof (section 2 and 5) |
| `tests/unit/booth-r70-withdrawn.ts`, `booth-treated-chapters`, `booth-b3-r70-verdicts`, `booth-b3-cross-lane`, `booth-leblanc-wiring`, `r60-defaults` | IX and XII leave `WITHDRAWN_R70` / `NOT_YET` / `HELD_WITHDRAWN` and join `TREATED_NOW` / `HELD_NOW`; the pins say twelve (release 70's ten plus these two, `B4_HUD`); `since` pinned `r71`; FFX only pinned |
| `docs/DEV.md` | the two treated-chapter rows (batch 3a, batch 3b) say IX and XII are back |

The lane tests that the r70 pass gated with `itIf` / `describeIf` (`booth-ffx-b3a-*`, `booth-ffx-b3b-*`) ran again **with no edit** the moment the two lines went back: the subset went from 41 skipped to 11 (V and XI, FFX-2, still off).

**Layout of Chapter I, Chapter IV and every other treated chapter is byte for byte what it was**: no F1 sheet (`hudf1.css`, `-ffx`, `-ffx2`, `-act`, `-finish`, `-floor`, `-numbers`, `-textsize`) changed, the new sheet names no F1 zone (`.ig-ctb`, `.ig-stat`, `.f1-*`, `.ffx-cmd` are tested absent) and its selectors can only match the gauge or the read-out, which are mounted hidden in every other chapter. With the F1 HUD off (`?treated=pack`, `?hud=today`, a phone) no `.hud-f1` class exists, so nothing matches and the old layout plays (the old numbers 660, 258, 296, 334 and 690 are pinned in the test).

## 2. The two defects, reproduced offline, and the fix

The r70 evidence (`D:/Tools/pyrefly-scratch/2026-10-31/r70/ffx/evidence/l1-yojimbo-cavern-now-*.json` and `l1-seymour-omnis-now-*.json`) gives real rectangles; the test rebuilds them from the stylesheets (the model agrees with the measured panel to 1 grid px: the gauge's label rects, the intent card's 157 px at 2560, the strip rows at x 1860).

| | cause | numbers (640 x 360 grid; x4 = px at 2560 x 1440) | fix |
|---|---|---|---|
| **IX** | the F1 slab moved the turn strip from the right edge to the top right (left 465); the gauge hangs at left 660 of its 1440 frame (293.3 grid), 430 wide, so its box ends at 484.4: **19.4 grid px (78 px) inside the strip's box** at 100, its "0%" over the TURN ORDER caption | gauge 293.3..484.4; strip 465..625.5; ribbon 28..188 | `left: 511px` (227.1 grid): the band between the ribbon (right edge 188, +2.7 shear) and the strip is 277 grid px wide, the panel is 191 (+12.4 shear). **Clear of the ribbon by 41.35 and of the strip by 40.9 grid px (165 and 164 px at 2560) at 100, balanced; 17.0 and 16.4 at 115.** The Zanmato banner under it stays centred on the stage (x 320; the panel's centre is now 322.7, it was 389) |
| **XII** | the F1 party list is 91 grid px tall with its top at y 251 (live: 258.25); the card's foot is at 360 - 258 x 0.4 = 256.8: **5.8 grid px (23 px) into the first party card**, over the acting hero's HP numeral. At 115 the old lift (296) leaves 4.25 and at 130 (334) 2.7 | card foot 256.8 / 241.6 / 226.4 against card tops 251 / 237.35 / 223.7 at 100 / 115 / 130 | `bottom: 288px` (foot 244.8), `322px` (231.2), `356px` (217.6): **6.2, 6.15 and 6.1 grid px above the first party card** (the HUD's own `GAP` is 6), same right edge (22.4 from the edge) and width. A two-line card is 39.3 grid px tall (y 205.5..244.8), a third line grows it upward and stays 113 grid px (100) and 54 (130) under the turn strip's foot |

Specificity is checked, not assumed: the new selectors beat `zanmato-gauge.css`, `omnis-readout.css` and `text-size.css`'s `scale` and `bottom` rules by construction (the layout test compares `specificity()` of each pair), and both exclude the phone layouts so the order of the sheets cannot matter.

## 3. Per chapter: what is on, what is held, what lifts it

Both chapters play every piece of the treatment but the ones below: the Ink and Gold F1 HUD with the declutter, the pro look (hits, glass numbers, markers), a cinematic arena grade per room (`ProGradeFfxB3a.ts` for IX, `ProGradeFfx.ts` for XII), the HD-2D look with the sharp band, the boss card as a painting, the FFX Overdrive opening, the quiet ending (one freeze on the last blow, the quiet title), the sampled strikes and real clips, the smear (neither is a swap-scope exception), the new effects, the feel and the sound pass. **Held in both, as in every treated chapter: the lighting maps that do not ship and the boss re-cut art** (release 68's lighting; no art was written).

| chapter | held piece | what plays instead | Lifts when (the hold's own words, `PieceHolds.ts`) |
|---|---|---|---|
| **IX Yojimbo** (`since` r71) | `breath` | no staged breath before Zanmato | Bailey or the driver picks a tone and a shot for Zanmato from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` get rows for its id (`booth-ffx-b3a.md`) |
| | `cam` | release 68's rigs and soft background; the victory keeps the lit pad in frame | job J1 of `booth-ffx-b3a.md` (the victory with the pad lit, the size of Yojimbo and the HUD clearance, on the real build with the camera on, against `?treated=pack`) shows the pad in frame and the size and clearance unchanged, or the victory shot gets the pad as a companion |
| | `moments` | release 68's KO and victory (the plain cross) | a continuity run (CHK-027) with a knock-out of each of Lulu, Kimahri and Yuna reads no unexcused swap jerk (every cut at or under 0.5 of the drawn height) |
| **XII Seymour Omnis** (`since` r71) | `breath` | no staged breath before Ultima | Bailey or the driver picks a tone and a shot for Ultima from a mockup, and `BigMove`, `NAME_OF` and `passRecipes.HEADLINE_BLOWS` get a row for `omnis-ultima` (`booth-ffx-b3b.md`) |
| | `cam` | release 68's rigs and soft background | job J2 of `booth-ffx-b3b.md` (a cast, a landing, the killing blow and the victory at 16:9, 16:10, 21:9 and 4:3) reads no plate edge, void or back of the plate beyond today's rig, or the shots are clamped to the Garden plate's width and top margin |
| | `moments` | release 68's KO and victory | job J5 of `booth-ffx-b3b.md` (a knock-out per dress, the reserve Rikku first) reads every dress's hurt-to-KO swap at or under 0.5 of its drawn height with no unexcused swap jerk (CHK-027) |

`?treated=pack` puts release 68's frame back whole in both; `?pack=off`, `?pro=off`, `?hud=today` and a phone answer as an untreated FFX chapter (the booth tests pin all of it for every listed chapter, and they ran for these two).

## 4. The defect classes of the r70 pass, checked for these two chapters (offline, the real engine and the real stylesheets)

| class | IX Yojimbo | XII Seymour Omnis |
|---|---|---|
| (1) a HUD title or mark outliving a chained link's seam | **n/a: one link** (`enemyGroupRef` is one group, no `nextGroupId`); the real fight plays in `booth-ffx-b3a-fights` (re-enabled, green): one freeze on the last blow, Ginnem and Daigoro do not make "the last foe by the field" true | **n/a: one link**; `booth-ffx-b3b-chain` (re-enabled, green) |
| (2) a script cutting the camera while the follower runs | **n/a: FFX has no follower** (`SCRIPTED_RIGS` is FFX-2 only); `booth-b2-cross-lane` walks every treated FFX chapter's scripts against it and passes with both on the list; `cam` is held anyway | same |
| (3) the follower or a directed close-up cropping a figure at a frame edge | **held: `cam`** (today's rigs play; the directed victory close-up is not played) | **held: `cam`** |
| (4) the moments' KO hard cut over 0.5 of the drawn height | **held: `moments`**; `booth-b2-ko-rule` (32 tests, green): `KO_CLEARED` is empty, no chapter beyond the booth pair builds a cut window | **held: `moments`** (the reserve Rikku, offline 0.52, is the reason) |
| (5) a form change cueing a freeze | none (one form); the Yojimbo-is-the-last-blow freeze guard test is green | none (the discs change state, not form; one link) |
| (6) a SCOPE_EXCEPTIONS chapter must hold smear | not a swap exception; `booth-hold-guard` and the cross-lane test (`both` is `['yunalesca']`) pass with the twelve | same |
| (7) `public/fx` is gitignored | `public/fx` is a junction to the main tree's folder; `node tools/fx-assets.mjs ensure` restored **2 files from `D:/Tools/pyrefly-art-backup/fx`** and `verify` reads PASS (disclosed: the folder is gitignored and shared; nothing else was written). IX has no depth map (null on live and now in the r70 read), XII's has 4 plates / 0 lamps | |
| (8) the bold HD-2D look clipping a bright plate to white | **no clip.** First menu, whole frame, the same measure that reproduces V's 13.4 against 2.66 percent over 240 (mean luma 128.5 against 106.6): IX at 2560 mean luma **48.2 against live's 39.4, 0.66 percent over 240 against live's 0.85** (1600: 48.5 / 39.7, 0.48 / 0.74); the room is dark steel, the cone lifts the mean 9 points and clips nothing | at 2560 mean luma **45.5 against live's 45.5, 0.77 percent over 240 against live's 1.94** (1600: 45.0 / 45.4, 0.52 / 1.78); the look is no brighter than live. (`D:/Tools/pyrefly-scratch/2026-10-31/booth-ffx-b4-hud/luma.py`, `luma.json`; the treated controls II, III, VII, X and XIV read 0.37 to 0.87 percent) |
| (9) a chapter-specific HUD panel colliding with the F1 HUD | **fixed** (section 2); the other IX panels checked: the Zanmato banner (about x 260..380, centred under the gauge) is about 80 grid px clear of the strip; the enemy-move banner (left 21, top 43, about 155 wide) ends about 50 grid px before the gauge's left edge; the Sensor plate shows nothing for Yojimbo (D-196). **One latent case is unread: Intel (G) with the advisor's one-row tip, section 7 and open question 1** | **fixed** (section 2); the disc strip (left 276, 185 wide: gold rule 272.6 to 457 at 2560) is 4 grid px short of the strip's box and 17 clear of its first caption, read in the r70 evidence at 1600 and 2560, and is not moved at 100; Intel's Sensor plate lifts by `OmnisReadout.sensorLift` from the live rects (predicted -21 grid px, section 7) |
| (10) a painting's hard matte edge | art, not ours (rule 8). The four first-menu reads of the two chapters logged **0 console warnings**, so no matte warning showed there; the fights themselves are owed (L2) | same |

## 5. TEXT SIZE 115 and 130 (a case the r70 pass never read in any chapter)

The F1 turn strip grows left from 625.5 (left 440.9 at 115, 416.9 at 130) and the ribbon grows right (right edge 212 and 236), so the top band that holds the gauge (IX) and the disc strip (XII) is 277 grid px wide at 100, 229 at 115 and 181 at 130. `text-size.css` grows both panels about their top centre (191 x 1.15 = 220 and 191 x 1.3 = 248), which would run into the strip or the ribbon; in the F1 HUD they keep their size (`scale: none`) and the disc strip follows the strip's left edge by 160.5 x (scale - 1) grid px. The test pins the result:

| | 100 | 115 | 130 |
|---|---|---|---|
| IX gauge: clear of the ribbon / of the strip's box (grid px) | 41.35 / 40.9 | 17.0 / 16.4 | **-7.4 / -8.0** (the sheared corners reach into the grown ribbon's end and the strip's box padding; the strip's first caption itself is clear) |
| XII disc strip: clear of the ribbon / of the strip's box | 87.7 / 0.68 (box tip, 9 short of the caption) | 39.2 / 0.24 | **-9.2** / 0.17 |
| XII intent foot above the first party card | 6.2 | 6.15 | 6.1 |

**The 130 residual is the one thing this lane leaves open**: at TEXT SIZE 130 the band is narrower than either panel, so a corner of each reaches 7 to 9 grid px (28 to 37 px at 2560) into the grown ribbon's end. Today's HUD at 130 has no ribbon, so this is also a difference from live. The clean answers need a look decision (a narrower panel; the third turn slot dropped at 130; or today's HUD in these two chapters at 130), so none is guessed: open question 2.

## 6. The browser jobs (specs for the driver when the browser is free; predictions first, rule 15)

Common to all: `npm run build` of this branch into a scratch dist (never the shared `dist/`), `public/art` on `D:\pyrefly-art-r64`, `node tools/fx-assets.mjs ensure` first, live release 69 and `?treated=pack` as the controls, seed 1, `?coach=off`, REDUCE MOTION off, real keys from the chapter select, headless Chromium on the GPU, the review-browser lock kept. Pixel predictions = grid px x the stage scale: **2 at 1280 x 720, 2.5 at 1600 x 900, 4 at 2560 x 1440 and at 3440 x 1440** (the 3440 stage is the 2560 one centred, +440 px in x). Read every rect with the r70 harness's `hud.els` collector (`ffx/jobs/`), as bounding boxes (a skewed slab's box is wider by 0.2126 x its height).

**HUD-1 (the gate for both chapters): the first menu of the first link at 1280 x 720, 1600 x 900, 2560 x 1440 and 3440 x 1440, default and `?treated=pack`, with the pairwise overlap of every HUD rect** (`.f1-ribbon`, `.ig-ctb` and its rows, `.ig-stat-list` and its rows, `.ffx-cmd-area`, `.f1-hero`, `.f1-cue`, `.f1-prompts`, `.ffx-zg__panel` / `.ffx-zg__banner`, `.ffx-omr__strip` / `.ffx-omr__note` / `.ffx-omr__intent`) and the text floor.

| prediction | 1280 x 720 | 1600 x 900 | 2560 x 1440 / 3440 x 1440 |
|---|---|---|---|
| IX gauge panel bbox, x (grid 220.9..424.4) | 442..849 | 552..1061 | 884..1698 (+440 at 3440) |
| IX gauge panel bbox, y (grid 4.4..63) | 9..126 | 11..157 | 18..252 |
| IX ribbon bbox right edge to the gauge bbox left (grid 190.7 to 220.9) | 60 | 76 | 121 |
| IX gauge bbox right to `.ig-ctb` left (465) | 81 | 102 | 162 |
| IX `0%` read-out (old 1850..1907 at 2560) | clear of the TURN ORDER caption by at least 250 px at 2560 (-265 px against the r70 read: about 1585..1642) | | |
| XII intent card bbox, y (two lines; 157 px at 2560 measured) | 411..490 (foot 489.6) | 513..612 (foot 612) | 822..979 |
| XII intent foot to `.ig-stat-list` top (251) | 12.4 | 15.5 | 24.8 (6.2 grid) |
| XII intent card to the acting hero's HP numeral | no overlap at any size (r70: 17 of 64 px clipped at 2560) | | |
| disc strip, `.ig-ctb`, ribbon, cards, verbs | where they were in the r70 read (no change at 100) | | |
| text floor | minEff **19.56** at 2560 for IX (4 under: Daigoro, + Kozuka, + Wakizashi, Next: Daigoro) and **19.2** for XII (11 leaves): the two minors of the r70 pass, unchanged; every other F1 text at or over 28 | | |

It fails when any pair of the rects above intersects (other than a chapter panel's own children), when the gauge's bbox gap to either neighbour is under 60 px at 2560, when the intent foot is within 12 px of the party list top at 2560, or when `?treated=pack` changes (it must equal live: gauge left 293.3 grid, intent foot 256.8). Console: 0 errors, 0 warnings from the treatment.

**HUD-2: a fight to the results through the real flow (L2) at 1600 x 900 and 2560 x 1440** (`await __pyrefly.trigger('battle:fast')`, then `await __pyrefly.gotoChapter('<id>', { skipCutscenes: true, auto: 'intended' })`), console recorded. Neither chapter reached L2 in the r70 pass (L1 stopped it). Predictions (booth-b3.md section 7): **IX** ribbon "Yojimbo" (never Lady Ginnem), the sakura arrival, a Zanmato callout, one freeze on the last blow, Yojimbo and Daigoro recalled, the pad lights, the quiet title over the party's cheer; the gauge banner (when the gauge fills) is centred at x 1280 at 2560, top about 276 px, about 530 px wide, 314 px clear of the strip; during Yojimbo's own move the enemy-move banner's right edge stays under about 760 px at 2560, 120 px short of the gauge. **XII** ribbon "Seymour Omnis"; the card's foot is 979 +- 1 px at 2560 at every menu whatever its text (a third line grows it upward only) and never within 24 px of the party list; one link, one freeze, the quiet title over Auron's clip about 4.0 s; 0 console errors; no matte warning (class 10).

**HUD-3: Intel (G) open at the first menu, 1600 x 900 and 2560 x 1440.** XII: the Sensor plate lifts (`--ffx-sensor-dy`): prediction **-21 grid px** (plate foot 222 against the card top 205.5 less the 4 gap), so the plate stands at about y 123..201 (492..804 px at 2560), clear of the turn strip's foot (82) by 41 and of the card by 4.5. IX: **the advisor's one-row tip against the gauge** (open question 1): prediction **an overlap is possible**, because the F1 sheet shifts a tip row by +166 grid px (`hudf1.css`, written for Chapter I's free top band) and the solver, which measures the gauge as an obstacle but not the ribbon or the shift, can put the bar left of the gauge; the read decides: if `.mad__card[data-zone='tip']` intersects `.ffx-zg__panel` by any pixel, the candidate (not built) is to fold the tip row in Chapter IX while the gauge is up (the cue under the hero already shows the advisor's lead move).

**HUD-4: TEXT SIZE 115 and 130, first menu, 1600 x 900 and 2560 x 1440** (`html[data-text-size]` set from the pause OPTIONS). Predictions: the section 5 table (IX at 115: 17.0 and 16.4 grid px, 68 and 66 px at 2560, clear of the ribbon and the strip; XII intent foot 6.1 to 6.15 grid px above the cards; at 130 the pinned residuals, 30 to 37 px at 2560).

**HUD-5 (the stills for Bailey, rule 9): the first menu at 2560 x 1440 in three panels, the approved target (Chapter I), live release 69, now**, for IX and XII, beside the r70 composites `ffx-ix-yojimbo-before-after.jpg` and `ffx-xii-seymour-omnis-before-after.jpg` (`D:/Tools/pyrefly-scratch/2026-10-31/r70/for-bailey/`). Prediction: the gauge reads as a centred strip between the ribbon and the turn order with one hand's width of floor on each side; the card sits one line above the cards.

**HUD-6: the lean set of `booth-b3.md` section 7 for the rest of each chapter** (L2 above; F13 the quick retry for IX predicts over 12 s; G7 is moot while `cam` is held). The gates G6 and the lifts in section 3 are owed reads, none a ship gate.

## 7. Suggested CHANGELOG lines (the release's; tagged per game)

- **FFX only (Chapters IX and XII: Yojimbo; Seymour Omnis): the booth treatment reaches two more chapters** that release 70 read in a browser and left off. The F1 battle HUD now fits their own panels: Yojimbo's Zanmato gauge stands between the boss ribbon and the turn order instead of running under it, and Omnis's Enemy Intent card stands one line above the party panel instead of over the acting hero's HP; at the larger text sizes the gauge and the disc strip keep their size and the disc strip follows the turn order. What plays: the Ink and Gold battle HUD with less on screen, the pro look, a cinematic arena grade per room (the cavern's steel-black stone under its shaft of light; the Garden of Pain's indigo-black sky under the violet-pink cone), the HD-2D look with the sharp band, the boss card as a painting, the quiet ending, the sampled strikes, the new effects, the feel and the sound pass. **Held, each with a written reason:** the staged breath before Zanmato and Ultima (a tone and a shot are a mockup pick), the directed camera (Yojimbo's lit pad, Omnis's killing blow past the plate), the knock-out cut and the new victory cheer (not yet read on these stages), the lighting on the figures and the foes' re-cut. `?treated=pack` puts release 68's chapters back.
- **Carried (disclosed), FFX only:** at TEXT SIZE 130 the gauge (IX) and the disc strip (XII) reach 7 to 9 grid px (about 30 px at 2560 x 1440) into the grown boss ribbon's end; the gauge's labels (19.6 px at 2560) and the disc strip's leaves (19.2 px) read under the 28 px text floor (live's are the same size).
- **Both games, tooling and records, nothing a player sees:** `hudf1-chapters.css` (the F1 HUD against chapter panels; selectors only the gauge and the read-out can match); `booth-ffx-b4-hud-layout` pins the layout from the real stylesheets; the ten-chapter pin of `booth-b3-r70-verdicts` is twelve.

## 8. Checks

- `node node_modules/typescript/bin/tsc --noEmit`: clean (exit 0; `tests/unit` is in the project).
- `tests/unit/booth-ffx-b4-hud-layout.test.ts`: **18 passed**.
- The booth subset (`booth`, `r60-defaults`, `r64-declutter-defaults`, `pc-scope-swap-scope`; 53 files with the new one): **772 passed, 11 skipped (V and XI, FFX-2), 0 failed** (log `D:/Tools/pyrefly-scratch/2026-10-31/booth-ffx-b4-hud/subset2.txt`; r70's pass read 700 passed and 41 skipped on 51 files).
- The related HUD files (`a11y-text`, `hud-f1`, `r35-ui`, `r43-text-floor`, `text-size`, `ui-coach-avoid`, `ui-ffx-zanmato`, `ui-ffx-advisor`, `omnis-readout`, `coach-omnis`, `hud-safe`, `advisor-tip`): **32 files, 568 passed, 1 todo, 0 failed** (`related2.txt`).
- `node tools/orphans.mjs`: 2,230 modules, **24 orphaned**, the same 24 (the new file is a stylesheet imported by `HudF1.ts`).
- Files under 400 lines: `HudF1.ts` 345, `DemoGate.ts` 266, `PieceHolds.ts` 251, `booth-treated-chapters.test.ts` 361, the new test 330, the new sheet 63.
- The full suite was not run in this lane (the release-70 review owns the browser and the machine); the driver's pre-push run is owed (`vitest run --maxWorkers=3 --testTimeout=60000 --hookTimeout=60000`).
- `node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/motion/PieceHolds.ts,src/ui/hudf1/hudf1-chapters.css,src/ui/hudf1/HudF1.ts`: **DEEP** (the same class as release 70: `hudf1-chapters.css` and `HudF1.ts` are "unclassified product path, a shared system"), a focused review of the production candidate before a deploy and the deep review on the live build after it.

## 9. Open questions for the driver (none sent to Bailey)

1. **IX with Intel (G) open: the advisor's one-row tip can land over the gauge.** Mechanism: the solver (`advisorTip.tipZone`) measures the gauge's real rect and the F1 shift (`+166` grid px, `hudf1.css`, written for Chapter I's free top band) is applied after it, so a bar solved at x 36 to about 208 appears at 202 to about 374, over the gauge's lower rows. The same state existed in the r70 candidate (the gauge was at 293 then) and was never read (the r70 reads were of the first menu). Job HUD-3 decides; the prepared candidate (not built) folds the tip row in Chapter IX while the gauge is up, which removes a duplicate of the cue and nothing else.
2. **TEXT SIZE 130 in IX and XII** (section 5): carry the 7 to 9 grid px corner overlap with a disclosure (this lane's choice), or give the two chapters today's HUD at 130 (one condition in `hudF1On`, needs a decision on what a player at 130 gets), or a narrower gauge and strip (a mockup, rule 9).
3. **The two text-floor minors** (the gauge's four labels at 19.6 px and the disc strip's eleven leaves at 19.2 px at 2560, live's the same) are carried, not fixed: at the 28 px floor the gauge's "+ KOZUKA" would touch "+ WAKIZASHI" (label widths x 1.43 against a 171 px slot) and the disc strip would grow into the turn strip, so each needs a layout choice with a picture.
4. **Neither chapter has been read through a fight** (L2) or in a before-and-after still since the r70 pass stopped at L1: HUD-1, HUD-2 and HUD-5 are the gate to ship these two lines in a release; their predictions are above.
5. **`since` reads `r71`** for both, as the brief says; the number is the driver's to renumber.
6. **`public/fx` was touched** by the `fx-assets ensure` the brief asks for (2 files restored from the backup into the main tree's gitignored folder).
