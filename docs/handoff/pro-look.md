# Pro look (conference demo, lane "pro-look", 2026-10-23)

**Branch `pro-look`, from `origin/playtest-1022` (763086fcb). Game case: BOTH games for the plumbing; Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) only; every piece behind one switch, default OFF.**
Bailey's decisions of 2026-10-22 (the options book, `D:/Tools/pyrefly-scratch/2026-10-22/options-book/`): arena "Cinematic contrast" plus the Chapter IV seam fix; hits "Ink and light" with the glass damage numbers; markers "Classic, calm, clear". His standing rule: "put an expedition 33 kind of spin on" the FFX / FFX-2 he knows. The HUD itself is redesigned in another lane: nothing here restyles a HUD panel.

## The switch

| | |
|---|---|
| Address | `?look=pro`, or the shared `?pack=demo` (turns it on with the rest of the pack). `?look=today` wins over the pack (the A/B). `?prooff=arena,seam,hits,numbers,markers` switches pieces off one by one. |
| Where it plays | Chapter I and Chapter IV only (`engine/motion/DemoGate.ts`). Every other chapter, every other screen and the default (no key) are release 62 / playtest-1022. |
| Switchboard key | `/` (`app/demo/switchboardModel.ts`: label `look`, values `pro` / `today`; the master key `0` flips it with the rest). Flipping re-reads the arena's grade at once. |
| Console | `__pyrefly.pro('pro' \| 'today')`, `.proOn()`, `.proPiece(piece, on?)`, `.proTune(room, patch)` (live tuning of the arena tables). |
| `?look=` | `pro` and `today` are not a look named by hand (`LookConfig.parseLook`): the chapter's own default plays (hd2d bold today, cinematic bold under the pro arena). `?look=hd2d|cinematic|anime|off` is the address choosing a look: it wins for the ARENA only. |

Code: `src/engine/look/pro/ProSwitch.ts` (the switch, pure), `ProGrade.ts` (the arena tables and the grade), `ProSeam.ts`, `src/debug/proApi.ts`.

## The five pieces

| piece | what it is | game case | files |
|---|---|---|---|
| **arena** | "Cinematic contrast": one strong light per arena (the Gagazet moon, the Bevelle skylight), the rest to deep shadow and haze. The book's mockup frames were real engine frames regraded in Python (`tools/regrade.py`, table `FIN[..]['B']`); `proColour` is that colour transform ported to the look LUT (`pro-look-arena.test.ts` pins it against the numpy values), applied after the engine's NEUTRAL recipe. The rest: the grade pass's own haze / vignette / grain uniforms, the bold pass's stage light, fog and rim, the engine's moon shafts (`stage.shaft`), and one new term: a soft CONE of light added after the LUT in the grade pass (`GradeShader` `uCone*`, skipped at strength 0): Chapter I's follows the painted moon, Chapter IV's falls from the skylight onto Bahamut and the floor. Cinematic look at bold strength; the figures keep their own colour. | both, each arena from its own painting | `look/pro/ProGrade.ts`, `LookState.ts` (`applyChapterLook`), `LookGrades.ts`, `LookRoom.ts`, `LookRig.ts`, `shaders/GradeShader.ts` |
| **seam** | The dark vertical band at the right of Chapter IV is NOT the plate's edge (the book's reading): measured in the engine, the plate edge is outside the 16:9 frame and the painted wings fill everything past it; the band is the near right foreground CONDUIT (`BEVELLE_CONDUITS`, world x 8.9, z -6.8), a flat dark slab whose inner edge stands at 91.8 percent of the frame at the idle rig. Fix, no plate or wing file edited: under the pro `seam` piece the right conduit and its lamps stand `SEAM_PIPE_OUT` (3 world units) further out (`bevelle-underground.ts`), so the plate and wing fill the frame edge to edge (`evidence/b2-ch4-pro-nopipe.png`); the two floor steps get a short vertical blur in the bold pass (term 0, rows from the plate's own v through the painting's map). The left pipe stays. | FFX-2 only | `look/pro/ProSeam.ts`, `scenes/bevelle-underground.ts`, `LookBold.ts`, `LookBoldShader.ts` |
| **hits** | "Ink and light" per weapon in the spell-effect batch: an ink brush stroke (normal blend, indigo for FFX, plum for FFX-2) along the weapon's arc with a luminous core riding its spine (additive, gold / pink), a cross glint at contact, ink drops with a gold (pink) rim (a colour dab with a darker one on it), eased sparks, ONE thin shock ring. Draws on from -70 to +70 ms around contact, the light is gone by +260 ms, the ink lingers and dry-brushes away to +720 ms. The painted finish (torn edge, bristle streaks) is the existing one. A boss's blow is the heavy sweep. | both, two skins | `spellfx/effects-pro-hit.ts`, `SpellFxFresh.ts` (the hit spec picks it, `end` is a getter), `SpellFxLayer.ts` |
| **numbers** | The glass damage numbers: Exo 2 (the game's UI face, slanted by synthesis), white to ice with a luminous edge and no outline, ice-blue in FFX, pink and lilac in FFX-2. Three tiers (normal, big, critical) grow in size and glow; the critical has a colour fringe and a long glint (a sibling element). A heal is mint with a plus. ONE rising number per multi-hit action that ticks up with a 1.15x pop (`DamageNumbers.proTick`). Tiers: the larger of the share of the target's MAX HP (as Bailey asked: 12 and 30 percent) and the blow against the attacker's usual blow (so a 732 hit on a 70,000 HP boss can still tier: the book's open question 1, answered with both); a crit is always critical. They are DOM above the canvas, so above every sprite (nothing draws over them). | both | `ui/common/proNumbers.ts`, `pro-numbers.css`, `DamageNumbers.ts`, `BattleScreen.ts` (`setNumberFacts`) |
| **markers** | Chapter I: the FFX pointing glove about five times wider (230 px at 2560) with a gold light, a soft shadow, a slow bob, the name hanging off it, the boxy brackets gone from the aimed figure (the others keep faint corners). Chapter IV: FFX-2's flower ring a quarter of the figure's height across on the torso at 60 percent with thin petals, a slow turn, short corners round it and the name beside it on a leader line. Low HP: a slow amber pulse (1.2 s, never faster than 1 Hz) on the row, a warning triangle in the face tile (so it is not colour alone), at each game's own low line (FFX's HUD "danger" 12.5 percent, FFX-2's "critical" under a third). KO: a grey wash on the floor round the fallen member from the real fall's floor impact (FFX 1000 ms, FFX-2 1600 ms: `real-motion/final/motion-from-game.json`), a red KO mark popping over it, a KO pill in the row. | the glove FFX only, the ring FFX-2 only (never mixed); low HP and KO both games in their own chrome | `ui/common/proMarkers.ts`, `ProFieldMarks.ts`, `pro-markers.css`, `ffx/TargetCursor.ts`, `targetCursorParts.ts`, `ffx/PartyStatusWindow.ts`, `ffx2/PartyRows.ts`, both HUDs |

## Sourced vs [ours]

Nothing here is game data. Sourced: the hit's clock (the mark stays 0.3 s as today's), the KO floor-impact times, each game's low-HP line, the two chromes (glove FFX, flower FFX-2: `research/visual-bible.md` 4.2 and 4.7), the weapon table the strokes follow (`audio/sfxV2/weapons.ts`). Everything else is [ours]: the grade tables (from the options book's mockup, `dirs.py` B rows, tuned in the engine: Chapter I exposure 0.92, Chapter IV exposure 1.7 and cone 0.95), the shapes, colours, timings, sizes and tier thresholds.

## Frame cost (RTX 5070 Ti, headless GPU, 2560x1440, 120 back-to-back renders with a GPU sync; the card was shared with other lanes' jobs, so the absolute numbers run high; read the differences)

Measured twice, with the card quiet (the table) and shared with other lanes' jobs (about twice the numbers, the same differences: Chapter I today 14.7 / 15.1, pro 14.2 / 15.2; Chapter IV today 18.2 / 18.1, pro 18.4 / 18.4).

| ms (quiet card) | Chapter I | Chapter IV |
|---|---|---|
| classic (no look) | 4.03 | 5.67 |
| today (hd2d bold, release 62) | 6.92 / 6.94 | 8.26 / 8.39 |
| cinematic bold | 6.86 | 8.12 |
| **pro arena** | **6.84 / 6.88** | **8.31 / 8.24** |

The pro arena costs the same as today's look within the noise: the LUT is built once, the cone is a handful of ALU ops in the grade pass, the haze, vignette and grain are uniforms the pass already has. The seam's floor blur is eight texture reads only on the rows near the two floor steps. The hit adds about 40 quads while it plays (inside `PEAK_BUDGET`).

## Checks

- `tsc --noEmit` clean. New tests: `pro-look-arena`, `pro-look-numbers`, `pro-look-hits`, `pro-look-markers` (53 tests). Existing families that touch the changed files pass (`look-*`, `plate-wings`, `r41-ch4cam`, `fx-new-*`, the `ui-*` family, `demo-motion-int*`). One pinned test changed on purpose: the switchboard's key list gained `/` (`demo-motion-int.test.ts`).
- Everything off (no key, or `?look=today`) is playtest-1022: the look state's pro flag stays false, `lutFor` takes the old path, the grade pass's cone strength stays 0, the hit spec's `end` is the fx lane's own, the numerals and the rows take their old paths (tests pin each).
- Real-input headless checks (Chromium on the real GPU, 2560x1440, the simulated pad from the title through the picker, Vite on :5361 started and stopped by PID, RIG-RECORD held per job), both chapters, `?demo=1&pack=demo`, **0 console errors**: the real presenter plays the numbers (`__pyrefly.fxPlay`), the ink hit is held at contact (`trigger('spellfx:hit:...')`), the cursor opens from the real command menu, a member's HP set and the HUD synced for the low-HP row, a real KO (Chapter IV: Yuna fell in the fight). Off path with `?demo=1&pack=demo&look=today`: `pro()` is `today`, the look is hd2d bold, the numerals are the old classes and sizes (three numerals for a three-hit action), the cursor and rows carry no pro class; flipping with `__pyrefly.pro('pro')` turns the arena on at once.
- Evidence: `D:/Tools/pyrefly-scratch/2026-10-23/pro-look/evidence/` (a1 = the arena, pro and today, stage only; c1 to c3 = the tuning frames; b2 and v4 = the seam; v1 = numbers; v2 = hits; v3 = target, low HP and KO; `crop-seam.jpg` = seam off against on).

## Not done / for the driver

- The cone and the arena are tuned from stills; no judgement of motion (the cone's beams drift slowly; the moon's shafts are the engine's).
- 16:10 and ultrawide were not drawn for (the seam's pipe nudge is world-space, so it holds; the cone's fixed Chapter IV point is a frame point).
- The glass numbers' off switch is `?prooff=numbers` and the console; the book's "Damage Numbers off" row in the pause menu and the "Danger pulse" setting are NOT added (a Settings row is a HUD/settings change): the CSS already honours `html[data-danger-pulse='off']` and `prefers-reduced-motion`.
- The Overdrive, camera and staging pieces belong to the other lanes; the switchboard key `/` may collide with theirs at the merge (`switchboardModel.ts`, `demo-motion-int.test.ts`'s key pin).
- The book's L-A "breathing pose" (a slow breath in the critical stance painting) is not built (needs engine fields on the actor; the pulse and triangle are). The "Keep the critical stance through the member's turn" one-line change is not made.
