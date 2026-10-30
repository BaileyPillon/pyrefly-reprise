# booth-leblanc: the booth treatment, for every listed chapter, Leblanc first

Branch `booth-leblanc` (from `origin/main` 67256e1ca, release 68's records). Game case: **both games for the plumbing** (one shared gate, 14 switch modules); **Leblanc itself is FFX-2 only** (Chapter VI, `ffx2-leblanc`; the hidden experiment `exp-leblanc` plays the same combatant ids on its own paintings and is not reached). Presentation only: no number of a fight changes. Records only about the browser: **no browser, dev server, Playwright or GPU was used** (the browser is held by the release-69 jobs); the evidence here is unit tests, two offline art reads and the engine's own look LUT run over the plate. Everything perceivable is a job spec below with its prediction.

Authority: Bailey 2026-10-30, "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters (meaning ones that arent hidden) please start with leblanc"; 2026-10-29, "you make all executive decisions for the next few days. i'll go with all of your recommendations". The calls below are the driver's recommendations under that, Bailey's to overturn. Nothing deploys from this branch.

## 1. What is on the branch

| commit | what |
|---|---|
| `480a355d8` | the gate: `DemoGate.TREATED_CHAPTERS` (the list), `PIECE_HOLDS`, `treatedScope` (`?treated=pack`), `isTreatedChapter(id, piece)`; 14 switch modules moved to it; `__pyrefly.treated()`; tests `booth-treated-chapters`, `booth-treated-switches` |
| `a39c3d3b2` | B7, the dress guard for the real clips |
| `03831933f` | Leblanc's rows (B1 to B5), the rim-off foes, the per-stage follower camera, the plate-grade still |
| (this commit) | this note, the lane-off and phone tests |

### The gate, in one paragraph

`TREATED_CHAPTERS` = `seymour-flux` (FFX), `ffx2-bahamut` (FFX-2), `ffx2-leblanc` (FFX-2). Every switch asks `isTreatedChapter(runningChapter, piece)` with the piece it is (`hud, hd2d, arena, look, rim, boss, cam, card, ending, opening, breath, curves, real, moments, smear, feel, fx, audio, governor`). The booth pair answers true for every piece under every scope and no hold may name it. A later chapter joins by one line in `TREATED_CHAPTERS`, plus a row in `NOT_YET` leaving `tests/unit/booth-treated-chapters.test.ts` (a twentieth listed chapter fails there until decided). `DEMO_CHAPTERS` / `isDemoChapter` stay the booth pair for the kiosk (the picker, the seeds), the party rigs and the voiced lines (D items, kept). The four test-side alias tables (`FEEL_CHAPTERS`, `PASS_CHAPTERS`, `FX_DEMO_CHAPTERS`, `DEMO_CHAPTER_GAMES`) also stay the booth pair (their tests pin two).

**The switch back to release 68:** `?treated=pack` (also `booth`, `today`, `68`) makes every piece answer for the booth pair only, so Leblanc plays release 68's frame, including the HD-2D look. `__pyrefly.treated('pack' | 'all' | null)` does it at run time (a fight reads it as it sets up). `?pack=off`, `?pro=off` and the lane words keep their meaning in Leblanc exactly as in the booth pair (tests). **With no page at all (a unit test, a tool) the scope reads `pack`**, as `packDemo` reads off with no page, so the existing test files that use another chapter as an "off" control (six of them name Leblanc: `feel-switch`, `feel-120hz`, `r61-visual-style`, `release68-wide-scope`, `pc-scope-swap-scope-actor`, `voice-director`) kept their answers; a test that wants her treated calls `setTreatedScope('all')`.

One thing the booth pair never had and Leblanc does now: **`?pack=off` does not turn the HD-2D look off** in either (it is a CHAPTER_LOOKS row, gated by `?look=off` and OPTIONS > VISUAL STYLE, not by the pack). Same rule, no new behaviour.

## 2. The pieces, for Leblanc (T numbers are the inventory's)

| T | piece | state in Leblanc | basis |
|---|---|---|---|
| T01, T02 | F1 HUD (FFX-2 layout, right slab, ATB bars, role chip), declutter (guide, intent, advisor folded; coach cards off) | **on** | gate; one-girl and multi-foe layout checks are browser jobs J1, J2 |
| T03 | pro look: Ink and light hits, glass numbers, markers (the FFX-2 ring) | **on** | gate |
| T04 | arena "Cinematic contrast" | **on, row authored** (B4) | `PRO_ARENA['leblanc-last-room']`; plate-grade still below; a still beside Chapter IV before Bailey judges it (rule 9, job J5) |
| T05 | HD-2D bold look | **on, rows authored** (B1 to B3) | `CHAPTER_LOOKS`, `ROOM_LOOKS`, `BOLD_ROOMS`, `ROOM_BOLD` |
| T06 | HD-2D maps | **C1, not built**: fallback is the look without them | section 4 |
| T07 | party draws no screen-space rim | **on** | gate; her foes too (below) |
| T08 | boss re-cut: code half | **rim half only**, no footprint rows | measured, section 3 |
| T09 | boss re-cut: art half | **C2, not indicated** | pale-fringe heuristic, section 3 |
| T10 | pro camera: FFX real shots | **n.a.** (FFX only) | rule 14 |
| T11 | pro camera: FFX-2 follower | **on, retargeted to her plate** (B5) | `ProAutoStage.ts` |
| T12 | boss card as a full-bleed painting | **on** | gate; which foe stands large per act is job J8 |
| T13 | ending: freeze on the last blow, quiet title, FFX-2 pull-back, defeat card that keeps the scene, results dissolve | **on**, one open check | job J7: the trio "yield" (walk off); the freeze fires on the killing blow, before they leave, so I judged it right; the one-line fallback is a hold row `ending: '... Lifts when ...'` |
| T14 | opening: the Change pearl plate (FFX-2); the FFX Overdrive opening is n.a. | **on** (Change plate) | gate |
| T15 | held breath before a big blow | **HELD** (B9) | `PIECE_HOLDS`: no sourced headline blow for a comic trio; the breath's moves are `total-annihilation` and `mega-flare` only, so nothing of hers would play it today; the hold is the written decision |
| T16 | public quick retry | **not owed** (B10) | no recorded opening, as Chapter IV |
| T17 | curves (sampled strike, cast lift, FFX-2 leap, recoil, squash, paced blend) | **on**, `real-snappy` | gate |
| T18 | real clips + travel strike | **Paine Warrior on her row; Yuna Gunner and Rikku Thief on the house curves** (B7) | dress guard, section 5; clip rows for them are C3 |
| T19 | moments: victory (the FFX-2 cheer path, `victoryPose: pose`), KO settle | **on** | gate; job J2 reads the victory |
| T20, T21 | smear, stance and cause picks | **on** (already wide since release 68) | unchanged |
| T22 | feel: punch, hit-stop, rumble, contact shadow, motion sounds | **on** | gate |
| T23 | new spell effects | **on** (shared ones); her own moves keep today's effects (C4, optional) | gate |
| T24 | boss-move effects authored for the booth bosses | **C4: none**, her moves keep today's | needs a yes (rule 10) |
| T25 | sound pass | **on** | gate; B8: the loudness read is in section 3, nothing owed; no `HEADLINE_BLOWS` entry (none sourced) |
| T26 | the silent win | **not copied** (Chapter IV only from the sources; Leblanc ships her flourish, D-018) | unchanged |
| T27 | voiced lines | **C4: none** (FFX-2 has no voice yet) | |
| T28 | governor | **on** | gate |
| T29 | party rigs | **off**, as in the booth pair by default (booth-only) | unchanged |
| T30 | the kiosk family | **booth only** (D) | unchanged |

## 3. Measurements (offline, read-only on the art mirror; scripts in `D:/Tools/pyrefly-scratch/2026-10-30/booth-treatment/`)

**Heart and lamps (the plate, `leblanc-last-room.png`, 2688 x 1536).** The pink heart (magenta pixels) centroid is u 0.500, v 0.264 from the top, extent u 0.323 to 0.699, v 0.102 to 0.482, core rgb (0.986, 0.449, 0.867), hue 313. The door's cyan glow centroid u 0.495, v 0.57. The brightest 0.5 percent of the plate is NOT the heart (centroid u 0.468, v 0.546: the door and the pale floor patch), so `findLight` would have put the shafts on the floor: the authored `light` rows fix it. The wall portholes (read off a crop): rose u 0.039 v 0.404 and u 0.066 v 0.423 on the left, amber u 0.943 v 0.434, rose u 0.972 v 0.408 and blue u 0.992 v 0.381 on the right; the embers use the first three.

**Focus.** Her idle camera (0, 2.8, 9.4) looking at (0.55, 1.55, -1.35), fov 32, puts the party slots (-2.05, 1.45), (-1.3, 0.1), (-0.9, -1.5) with feet at v 0.096 / 0.184 / 0.259 and heads at 0.454 / 0.491 / 0.522; Chapter IV's camera (0, 3.0, 9.6) looking at (0.15, 1.5, -1.3) puts the same slots higher (feet 0.017 to 0.019, heads 0.003 to 0.010; the feet-and-knee middle 0.015). Chapter IV's band is 0.40, so hers is 0.39.

**Plate grade, the engine's own LUT over the plate** (`docs/screenshots/booth-leblanc-plate-grade.png`, top row Chapter IV, bottom row Leblanc; plate | hd2d bold | pro arena). The grade only: no haze, vignette, grain, shafts, cone, bloom, fog or figures. Mean luminance: plate 0.181 / hd2d 0.148 / pro 0.105 (Chapter IV) against 0.254 / 0.228 / 0.129 (Leblanc, after one iteration of the arena row, which first read 0.141 with a pale heart); p95 0.472 against 0.575. Read: the same grammar (the one light bright, the room fallen to deep indigo, a coloured accent kept), warmer and pinker than Chapter IV's violet-black and cyan; her room stays about 20 percent brighter overall because the heart and the floor patch are large. `[ours]`, not game data; the palette handed to the LUT was measured off the plate (key 0xecd2be, sky 0x1b2033), not the scene's own `backdropPalette`.

**Boss feet (B6), measured and not used.** The boss-matte `feet.py` method on the shipped @2x masters, band 10 percent of the silhouette height, 5th to 95th percentile: `cx` / `hw` as fractions of the silhouette's width, idle: Leblanc 0.580 / 0.066, Ormi 0.482 / 0.257, Logos 0.458 / 0.217, Dr. Goon 0.498 / 0.432, Fem-Goon 0.524 / 0.255 (the other poses are in `leb-feet-out.txt`; Leblanc's cast pose swings 0.066 to 0.384). The engine's own shadow pool is `0.36 x height` in radius, and the standing figures' feet sit at the anchor (cx 0.46 to 0.58 against the box centre 0.5), so a `BOSS_FEET` row built from the band would SHRINK their shadow (Leblanc's 0.066 is a 0.06-unit radius under a 1.76-unit figure) and swing it between poses. The booth rows exist for giants whose footprint is not under the anchor (Bahamut's tail coil). So: **no feet rows and no `BOSS_CLEAN_ARTS` entries**; her eight foe ids go in `RimFigures.TREATED_RIM_FOES` (no screen-space rim, like the party), under the same switch. The offline edge read for the pale matte fringe (edge minus ring luminance): Leblanc -24, Ormi -11, Logos -26, Dr. Goon -26, Fem-Goon -17, against the booth bosses' +1.5 and +7.7 after their re-cut (Natus and Omnis +19 and +25 before one): **no fringe is indicated, no C2 re-cut is proven.** It is a heuristic; a look at the sheet is the proof.

**Loudness (B8).** `ffmpeg ebur128` on the shipped cues: `boss-leblanc` -16.0 LUFS integrated, LRA 1.0, true peak -3.1 dBFS; `scene-chateau-leblanc` -16.0, LRA 2.9, -4.3; for comparison `boss-bahamut` -16.0, LRA 4.5, -2.4; `scene-bevelle-underground` -16.0; `boss-seymour` -16.0. Every cue is normalised to -16.0, so the pass's +4 dB makeup lands her music where it lands the booth's, under the pass's safety ceiling (-1.5 dBFS). Nothing owed.

## 4. The C items and the smallest honest fallback

| item | what it would add | built? | fallback in the build |
|---|---|---|---|
| **C1 maps** (GPU, the driver only): normal maps for `yuna-gunner` (17 poses), `rikku-thief` (16), `leblanc`, `ormi`, `logos`, `ffx2-dr-goon`, `ffx2-fem-goon` (4 each) = 53 poses, plus the room's depth and normal (MoGe-2 ViT-L, `D:/Tools/pyrefly-scratch/2026-10-19/demo-maps/tools`; ~20 to 40 MB if every pose were fetched, against `docs/BUDGETS.md` B3a) | surface-lit figures (key, rim, spell lights) and depth fog | **no** | a figure with no map "stays unlit", an unlisted room gets "depth fog when there is one": she looks like Chapter IV minus the figure relight (flatter girls and trio); the diorama, the shafts, the grade, the camera and the staging all still play. Paine Warrior's maps are already shipped |
| **C3 clip rows** for Yuna Gunner, Rikku Thief and her trio (the offline decode lane that made `motion-from-game.json`, `final/build_ffx2.py`; retail data allowed, nothing to download) | the real game's proportions for those strikes | **no** | the house curves (`?curves=new`'s FFX-2 profile) via the dress guard; Paine plays her row |
| **C2 re-cut art** | a smooth outline | **not proven needed** | the engine's own edges, rim off |
| **C4 effects** for Mach Fan, Love Tap, Not-So-Mighty Guard, Russian Roulette, Hail of Bullets; voice | spectacle | **no** (rule 10) | today's effects; FFX-2 has no voice |

## 5. B7, the dress guard (a finding)

`REAL_MOTION.ffx2` holds rows for three dresses (Yuna White Mage c018, Rikku Dark Knight c033, Paine Warrior c051), but `realKeyOf` matched `yuna-*`, `rikku-*`, `paine-*` by prefix, so `?curves=real-snappy` in Leblanc would have driven Yuna Gunner and Rikku Thief with the White Mage's and Dark Knight's clips. `realRowOf` now matches by dress when the running chapter is treated and NOT the booth pair. **Chapter IV is left byte for byte, which means a girl who changes dress there still reads the prefix rule (a latent mismatch in the booth pair that I did not touch); that is an open question below.** In the other FFX-2 chapters that will join, Paine Dark Knight (V, XI, XIII, XV, XVI) and Yuna Dark Knight (XIII) fall to the house curves the same way until a row is decoded. KO and victory rows are read by combatant id (the stem `yuna`, `paine`), so in a strict chapter a girl's KO fall uses the house numbers too (Paine's attack uses her row).

## 6. The follower camera (B5)

`data/procam/proShots.ts` is generated and stays untouched: its four candidates are absolute eyes `focus + fitM * direction(home azimuth + azDeg, elDeg)` on the Bevelle stage. `ProAutoStage.retargetAutoCamera` rebuilds them about another stage (same angles, same distances, that stage's focus and home azimuth) and reproduces Bevelle's to the lane's three decimals (test). Leblanc's stage: focus (0.295, 1.628, -2.49) = the Act III centroid at 0.9 of each height, home azimuth -1.42 degrees (her idle eye seen from it); her four eyes come out at azimuths 21.1 and -1.4 degrees, elevations 18 and 9. Both are inside the 35 degree corridor of the plate's front on either reading of "front" (the z axis or the home azimuth). **Not re-scored:** the lane's `fitM` and ranking were scored for Bevelle's group (three girls and a six-unit dragon); a narrower group stands nearer in the real fit, so these sit a little farther than the real score would. The follower blends 0.5 toward the candidate and never crops anyone (`ProFit`), so the cost is a looser frame, not a wrong one. Chapter IV gets the very generated object (`autoCameraFor('ffx2-bahamut') === PRO_AUTO_CAMERA`, test).

## 7. Tests (all pass; `npx tsc --noEmit` clean; `node tools/orphans.mjs` lists no new file)

`booth-treated-chapters` (14: the list, the games, hidden chapters never listed, the holds, the word), `booth-treated-switches` (12: 19 listed and 5 hidden chapters x every switch x both scopes; the one hold; the boss re-cut and rim; `?pack=off`, a phone, `?pack=demo` on a phone, `?pro=off` and `?treated=pack` in Leblanc), `booth-leblanc-rows` (11), `booth-leblanc-dress` (4), `r60-defaults` (the third `CHAPTER_LOOKS` row, under both scopes). The existing 95 gate-related files pass unchanged but that one.

## 8. Browser jobs (specs, to be run by the driver when the browser is free; predictions first, rule 15)

Common: `npm run build` of this branch into a scratch dist (never the shared `dist/`), the release-68 build as the control (or the same build with `?treated=pack`, which is release 68's frame for Leblanc), seed 1, `?coach=off`, real keys only (`Enter`, arrows; the flow from chapter select, Chapter VI, the party it ships). Record the console, the frame time and the sizes.

- **J1, first command menu of Act I at 1600 x 900 and 2560 x 1440** (default address, then `?treated=pack`). Predict: default shows the FFX-2 F1 slab on the right with the ATB bars and the pink accent, party cards as one-girl-per-row with the role chip, the guide, intent and advisor panels folded, the boss ribbon naming the first on-field foe, text at or over the 28 px floor at 2560; the pro arena's heart cone on the door, the rest in indigo-black with the portholes' embers; the girls and the trio without a pale rim; the tilt-shift band on the girls' feet to the trio's feet. `?treated=pack` shows release 68's frame (the old HUD and the first-menu look as r68). Fail if: a panel overlaps the card, the HUD covers Ormi or Dr. Goon, or the heart cone sits off the heart.
- **J2, a fight by real keys to the results, at both sizes** (Act I to III, one attack by each girl, one cast, a Change, the win). Predict: no console error; Paine's strike plays her real clip (about 1.1 s with the house dash), Yuna's and Rikku's the house curves; the Change plate is the pearl; the victory is the FFX-2 cheer path, the pull-back and the soft dissolve into the results; Acts I and II (links) do not freeze (`moreLinks`); Act III's last blow freezes and rings (J7).
- **J3, the phone gate**: 390 x 844 and 1024 x 768 (touch, coarse pointer), default address. Predict: the pack is off (`packScreen() === 'phone'`): no F1 HUD, no pro look, no pro camera, no staging; only the HD-2D look plays, as in Chapter I and IV. `?pack=demo` forces the pack on, as for the booth pair.
- **J4, the continuity harness (CHK-026 / CHK-027) on Leblanc**, one 150 s recording each, default and `?treated=pack`. Predict: ghost time and swap jerks no worse than release 68's (the stance and cause picks were already on); Paine's strike row differs, the others do not; the F1 HUD changes no swap. Read the swap-jerk count, not only the size.
- **J5, the still pair for Bailey** (his Progressive Target Resolution: target and current build side by side): first menu of Act III, 2560 x 1440, in three panels: Chapter IV (the approved target), Leblanc as release 68, Leblanc now; plus the same three at the victory frame. This is the still the B4 row owes (rule 9). `docs/screenshots/booth-leblanc-plate-grade.png` is the offline version of the grade alone.
- **J6, the follower on her plate**: `__pyrefly.procam()` (its `follower` candidate and weight, `camera.pos`, `layer.pose`) logged through a fight at 2560 x 1440 and a 21:9 window (3440 x 1440); screenshots at each of the four candidates. Predict: the candidate index moves every second effect end; the eye stays inside her plate (no backdrop edge, no billboard seen from behind); the girls and the three foes inside the safe rectangle; nothing cropped. Fail if a plate edge shows at azimuth 21 degrees.
- **J7, the ending on yielding foes**: Act III's last blow at normal speed. Predict: the white flash, the ring out of the last foe's chest, the HUD going out, then the walk-off and the quiet VICTORY title. If it reads wrong, hold the piece with one row: `PIECE_HOLDS['ffx2-leblanc'].ending = '... Lifts when ...'` (and the defeat card keeps its own `ending` hold: they are one piece).
- **J8, the card**: the boss card of each act. Predict: Act I names the first visible foe (Dr. Goon or Ormi, by `enemyIds` order), Act II Ormi or Logos, Act III the first of the trio; the large figure on the card is that one. Read whether a goon as the headline reads right; the fix would be a declared `bossId` for Act I (a data row in `leblancEntranceGroup`).
- **J9, the booth pair, byte for byte**: Chapter I and Chapter IV first menu at 1600 x 900, this build against release 68. Predict: identical frames to image noise (the unit matrix proves the gates; this proves the pixels).
- **J10, the plate-edge and the embers**: the three portholes' embers at 2560 x 1440 (`?lookdrift=1` too). Predict: sparks rise from the three lamps, none from the wall's blue one.

## 9. Open questions for the driver (none sent to Bailey)

1. **Chapter IV's dress mismatch.** A girl who changes dress in Chapter IV reads the White Mage / Dark Knight clip in any dress (the prefix rule). Giving the booth pair the dress guard would change Chapter IV (more correct, not byte for byte). Left as is; say if you want it.
2. **The arena row (B4) before it ships?** Rule 9 says a still first; J5 is that still and needs the browser. The branch is not deployed from, so nothing ships before it.
3. **The `ending` check (J7)** and the **card figure (J8)** are the two places the trio's yielding and the three-act formation could read wrong; both have a one-row fallback.
4. **Maps for Leblanc (C1)**: 53 poses and the room on the GPU, or ship her without the figure relight? Bytes: about 20 to 40 MB if every pose were fetched. The branch ships her without.
5. **Clip rows (C3)** for Yuna Gunner, Rikku Thief and the trio from the offline decode lane: worth running before the next FFX-2 chapters join (Vegnagun's Paine Dark Knight, Fallen Aeons, Trema's two dresses all need the same).
6. `exp-leblanc` (hidden) now looks different from the listed chapter; his call, later.

## 10. Suggested CHANGELOG lines (the release's, not this branch's)

- FFX-2 only (Chapter VI, Leblanc): the booth treatment reaches her chapter: the Ink and Gold battle HUD with less on screen, the pro look (hits, glass numbers, markers), a cinematic arena with a rose cone of light from the heart on the door, the follower camera, the boss card as a painting, the quiet ending, the sampled strikes and real clips for Paine's Warrior dress, the new effects, the feel and the sound pass. `?treated=pack` puts release 68's chapter back. Chapters I and IV are unchanged.
- Both games, tooling: one list of treated chapters with per-piece holds (`DemoGate.TREATED_CHAPTERS`), so the next chapters join by one line each.
