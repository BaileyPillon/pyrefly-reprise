# r3941-heights: the FFX party at its real relative heights (FFX only)

Branch `r3941-heights`, from `origin/r394-int` 0e46667c (release 39.4's integration branch); the code is commit 4edcaaf3, the branch's tip is the commit that adds this note and the pictures (`git log -1 r3941-heights`), pushed as `origin/r3941-heights`. Authority: Bailey, 2026-10-07, "fix the heights once you have the numbers" and "show me the heights fix once it's ready".
Plan (the DEEP-class paper preflight): [r3941-heights-review](../plans/r3941-heights-review.md). The numbers and their source: [research/ffx-character-heights.md](../../research/ffx-character-heights.md). The pictures: `docs/screenshots/r3941-heights/`.
**Game case: FFX only** (Chapters I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII). FFX-2 is untouched (its three girls' models are not mapped yet), and so are FF7, every aeon, fiend and boss.

## Round 2 (2026-10-07, later): Bailey's picks, built

Bailey saw the Round 1 line-up and sheet and picked two things, relayed by the coordinator: **(1) Kimahri at his real body height** (his row is 1.304, the factor that puts his mane, his body, at 1.211 of Tidus's; his idle's top pixel is the spear tip, 8.2 percent of the painting above the mane), and **(2) "Keep camera and bosses as before"**: CHAPTER FRAMING and BOSS SCALE read the party at Tidus-equivalent heights, so the camera and every boss stay exactly where they were, plus a nudge for each of the two panel cases. The coordinator then said: the full before/after sheets and the line-up are **not regenerated** (a camera and boss-size change that follows will re-shoot everything), and `?stature=off` stays. FFX only throughout.

**What changed**

- **The table:** Kimahri `ratio: 1.304`, with his `datamined: 1.211` and a `note` in the row (both optional fields, only on him); `research/ffx-character-heights.md` sections 3, 5, 5a and 6 say why, and section 5 cites the PCSX2 lane's battle-idle readings (Tidus 0.85 of his bind top, Kimahri 0.89, Auron 0.95, `D:/Tools/pcsx2-ffx/re/FINDINGS.md`) as **the next refinement, not applied**.
- **The mechanism:** the stage records the factor it drew a hero by on the actor (`STATURE_KEY` in `PartyStature.ts`, set only when it is not 1), and `src/engine/SharedHeight.ts` reads it back (`statureOf`, `backToShared`: a quad or a point scaled about the actor's ground point by `1 / k`). Four readers that decide where the camera or a fiend stands now read each hero at the shared height: (a) **CHAPTER FRAMING** (`fx/mix/planFig.ts` `planFigOf`, used by `Framing.visible`), (b) **BOSS SCALE** (`Staging.planScale`), (c) the **phone's A-12 refit** (`FitSubject.shared`, set by `ShotRules.fitPhone`), (d) the **formation relaxation** (`PaintedStage.projectRect(id, cam, shared)` through `screenRects(true)` in `relaxFormation`). Everything that shows the figure (the drawing, the HUD's anchors, the held shots, A-11's pushes, the x-ray fade) still reads the real one, and a figure with no key (FFX-2, FF7, an aeon, a fiend, `?stature=off`) reads as it always did, bit for bit.
- **A finding on the way:** the framing and BOSS SCALE were not enough. On the phone in Chapter III the camera still moved 0.19 units: the A-12 refit read the live quads, and then the formation relaxation did too (it decides whether a fiend is "clear enough" by how much the party covers it, and settled the Yu Pagodas 0.09 world units differently at battle start, which the refit measured). Both now read the shared height; the probe (`tools/probe-framing.mjs`) printed the plan's own log to find it.
- **The two panel nudges:** see below. Chapter I needs none; Chapter IX's phone gets the party 2.0 units nearer the lens (`cavernPartySlots`, `CAVERN_PHONE_PARTY_STEP`, phone only).

**Measured, final code, all 22 FFX cases (11 chapters x 1600x900 and 390x844), stature on against `?stature=off` on the code before this lane** (same seed, same moment; `frames7` against `frames2`, `tools/analyze.mjs`):

| | Round 1 | Round 2 |
|---|---|---|
| planned camera (the master pose) moved, units | up to 0.45 (5 of 18 cases) | **0.01 at most, all 22** |
| Tidus's size on screen | +4.8 and -4.1 percent in I and XII, 1.3 to 1.6 on the phone in II, III, VII | **0.39 percent at most** (the sway), 18 cases |
| every boss's rectangle | Yojimbo +3.7, Natus +2.9, Flux +2.2, Omnis -3.0 percent | **0.36 percent at most**; Yojimbo 250.8 to 250.8, Natus 349.7 to 349.7 |
| the framing's party height (`partyPx`) | moved with the party | equal in 21 of 22; Chapter IX's phone 128 to 148 by the nudge below |

- **Nothing clips the frame:** the highest party head is 278.5 px from the top at 1600x900 (Kimahri, Chapter I) and 229 px at 390x844 (Wakka, Chapter VIII); the largest share of a figure outside the viewport is Tidus's 6.1 percent on the phone in Chapter I, as before.
- **Panels:** faces and weapons under a panel 0 in all 22; CHK-011 newly failing none, newly passing three (Yuna in VII desktop, Kimahri in IX both sizes); new figure-on-panel hits one (Natus, 1600x900: the corner of Kimahri's box on the stat list, 134 px squared, no face); worse two: Evrae's Wakka, whose box corner on the command stack went from about 3,600 to 5,700 px squared (face band 159), and Chapter IX's phone (next).
- **The Chapter I case (Yuna under the menu) is gone, not nudged.** It was the framing re-planning: with the framing reading the shared height her menu-rule reading is 4 percent, as before, and her real overlap with the panels is not worse (hits 2 to 2, none worse). No scene change.
- **The Chapter IX phone case (Kimahri behind the Zanmato gauge)** at 1.304 is 9,132 px squared of his box (42 percent; 2,400 and 16 before the heights). The slot nudges, all measured on the phone with `tools/capture.mjs` (camera = how far the planned camera moved; gauge = Kimahri's box behind it):

| nudge (toward the lens) | camera | Kimahri top, height (px) | behind the gauge | CHK-011 |
|---|---|---|---|---|
| none | 0.001 | 228.6, 163.6 | 9,132 | no new failure |
| Kimahri alone 0.5 | 0.002 | 237.7, 169.3 | 8,015 | Kimahri fails again (as before the heights) |
| Kimahri alone 1.0 / 1.5 / 2.0 | 0.003 to 0.004 | 247 / 258 / 270, 175 to 189 | 6,694 / 5,091 / 3,205 | **Yuna newly fails** (his box covers hers) |
| whole party 1.0 | **0.29** | 245.7, 170.4 | 6,766 | none |
| whole party 1.5 | **0.75** (the boss shrinks to 124) | 253.1, 171.5 | 5,608 | none |
| **whole party 2.0 (applied)** | **0.005**, boss 128.9 as before | 269.7, 188.8 | **3,159** | none |

  A slot nudge is a weak lever here (about 10 px of head height per half unit, the camera looking down 15 degrees), and a whole-party step moves the phone camera whenever the A-12 refit reads the party's new places, so 1.0 and 1.5 are out. **Applied: the whole party 2.0 units nearer the lens, phone only** (`cavernPartySlots(aspect)`; the 16:9 slots are the published ones): the camera and Yojimbo are where they were, Kimahri is 3,159 behind the gauge (2,400 before the heights), Lulu and Yuna are clear of it, no new CHK-011 failure. The price is on the phone only: the party is about 15 percent larger and 45 to 60 px lower (feet at y 459 to 478, above the party rows at 515). The picture: `docs/screenshots/r3941-heights/findings/ch09-phone-party-step.jpg` (before, Kimahri 1.304 with the party where it was, nudged). **If the coming lens change re-frames the phone, this is the one line to retune or drop** (`CAVERN_PHONE_PARTY_STEP`); the other way to clear the gauge is to re-aim the phone rig 0.45 higher (everything about 40 px lower, no size change), which is a camera change and was not made.

**Tests:** `tests/unit/fx-mix-party-stature.test.ts` (9: the planning figure is the figure at the shared height about the ground point, and the planners' numbers, today's rule and BOSS SCALE's factor are the equal-height party's), `tests/unit/engine/party-stature-phone-fit.test.ts` (5: the A-12 refit leaves the camera where it was), `tests/unit/chapters/cavern-phone-party-step.test.ts` (3), and additions to `ffx-party-stature` (Kimahri's applied factor is his body factor), `stage-party-stature` (the factor is recorded on the actor; `screenRects(true)` is the stature-off picture) and `party-stature-actor` (Kimahri's head-lock factor is 1.05 percent from Tidus's at the strongest camera, band 0.9 to 1.1). The Round 1 sections below describe the 1.211 build, the framing reading the live party and the pictures in `docs/screenshots/r3941-heights/`; **the pictures are Round 1's (commit 4edcaaf3) and are to be re-shot** after the camera and boss-size change.

## Round 1: result in six lines (the numbers below are Round 1's: Kimahri 1.211, the framing reading the live party; Round 2 above supersedes them where it says so)

1. Every FFX hero now stands at his own height next to Tidus's: world height is the scene's party height times Tidus 1.000, Yuna 0.911, Auron 1.062, Kimahri 1.211, Wakka 1.201, Lulu 0.990, Rikku 0.911. Tidus is exactly what he was; the feet stay on the ground; every pose, the shadow, the ring, the numerals' anchors, the lying body and the head lock follow.
2. Measured on the real build (headless Chromium on the GPU, all 11 FFX chapters, 1600x900 and 390x844, same seed and moment, `?stature=off` against the default): each hero's height on screen against Tidus's own change is the table's ratio within 0.94 percent over 36 comparisons; the world heights are the table's exactly.
3. **Nothing clips the frame** (the highest head is 298 px from the top at 1600x900, 229 px at 390x844) and **no figure meets a panel it did not already meet** (0 new overlaps in 22 cases; faces and weapons under a panel 0 to 0). Two things get worse and are reported with options, none picked: Chapter IX on the phone, where Kimahri's head goes from 16 to 31 percent behind the Zanmato gauge; and Chapter I at 1600x900, where the framing's own menu rule counts Yuna at 8 percent under a panel (its limit is 6; 4 before) while the raw overlap is unchanged.
4. **Two knock-ons you did not ask for**, both through CHAPTER FRAMING, which reads the party's live heights: in 5 of 18 cases the planned camera moves and Tidus's size on screen moves with it (+4.8 percent Chapter I, -4.1 percent Chapter XII, 1.3 to 1.6 percent on the phone in II, III and VII), and BOSS SCALE follows the party's mean (Yojimbo +3.7 percent, Natus +2.9; Seymour Flux +2.2 and Omnis -3.0 move only with the camera). Nothing was changed for either.
5. **A finding about the paintings that changes what 1.211 means for Kimahri**: the approved idles are cropped at their topmost pixel, which is the hero's hair for five of seven but Kimahri's spear tip (8.2 percent above his mane) and Tidus's sword pommel (1.1 percent above his hair). The plain multiply therefore puts Kimahri's mane at 1.124 of Tidus's hair, not 1.211 (the other five bodies land within 1.3 percent of the table). Putting his body at 1.211 means 1.304 in his row: a one-number change in the table, and a figure 30 percent taller and wider than Tidus's painting. Left as built; the measurement is in the note's section 5a and below.
6. **The CHK-026 head check passes with the stature on** (the continuity harness: real keys, headless Chromium on the GPU, seed 1, 1600x900, the chapter won): Chapter I (442 pose swaps; Tidus's and Yuna's knock-out swaps and revive among them), Chapter IX (Lulu's) and Chapter XVII (Auron's and Yuna's) all PASS, the worst head-size jump at a registered swap is 0.36, 0.23 and 0.28 percent (the tolerance is 3), and every knock-out swap lands between x0.9989 and x1.0036. The same build with `?stature=off` reads 0.35 and 0.30 percent: the same numbers. The harness's CHK-027 (motion continuity) fails in every run, on and off, for the 39.4 baseline's own reasons. Table and strips: `docs/screenshots/r3941-heights/head-check/`, section "The CHK-026 head check" below.

## What the build does

Our build drew all seven FFX heroes the same height: the engine sizes a figure as `worldHeight` over the idle's feet row, the stage gave the whole party one `partyHeight`, and every approved idle is cropped the same way. Now a hero's world height is
**the scene's shared party height times his ratio to Tidus**, from the HD models (datamined: `[datamined: FFX HD Remaster build 25501027, bind pose, one reader]`):

| | Tidus | Yuna | Auron | Kimahri | Wakka | Lulu | Rikku |
|---|---|---|---|---|---|---|---|
| ratio (applied) | 1.000 | 0.911 | 1.062 | 1.211 | 1.201 | 0.990 | 0.911 |
| model top (units) | 18.15 | 16.53 | 19.28 | 21.98 | 21.80 | 17.97 | 16.54 |
| wiki, for comparison only | 1.000 | 0.920 | 1.046 | 1.166 | 1.074 | 0.954 | 0.897 |

**The table is `src/data/ffx/party-stature.ts` and it is the only place the numbers live**: a better measurement (the PCSX2 battle-stance reading another agent is taking) is a change to a `ratio` there and nothing else, plus `FFX_STATURE_BASIS` and a line in the research note. Seymour (1.119) is recorded in the note, not applied (a boss).
`?stature=off` plays the old equal heights, so one build draws both halves of a picture (as `?headlock=off` does).

How: `PaintedStage.add` asks `figureHeight()` (`src/engine/PartyStature.ts`, pure) for the actor's `worldHeight` and for the scale of its contact shadow and turn ring. A hero is scaled only in an FFX battle (`BattleState.game === 'ffx'`, read from the state the stage was staged with), on the party's
side, by id; FFX-2's Yuna and Rikku share two ids and are not scaled. A height a scene names for a combatant (`SceneStaging.figureHeights`) or an arrival director hands `add` is the figure's own, with no ratio on top: Chapter XIV's scene names Yuna (its `partyHeight` IS her 1.68), so she
stands as she always has there. For every figure that is not a hero in an FFX battle the stage's numbers are the old ones bit for bit (a test pins it).

## Every consumer of the shared height, and how each follows the hero's own

`partyHeight` is read in one place (the stage's `add` and `arrive`); everything else takes the figure's own `worldHeight` from the actor, so nothing else needed a change. Each row was read in the code and each has a test or a measurement.

| Consumer | How it follows | Held by |
|---|---|---|
| The plane and the feet | `PaintedActor.applyPose` -> `computePoseScale({ worldHeight })`; the anchor row sits on the actor's ground point at any scale, so the figure grows or shrinks **about its feet** | `party-stature.test.ts` (feet row on the ground for all seven and every pose), `party-stature-actor.test.ts` (the real actor); in the browser the ground point moved 0 world units in 59 of 62 figures and 0.002 in three |
| Every pose of a hero | one `worldHeight` per actor; every pose inherits the idle's pixel scale, so one factor serves idle, ready, attack, cast, item, hurt, KO, victory, defend, sleep, critical, follow and the Overdrive keys | the same tests: every plane is the ratio times Tidus's |
| Per-pose registration, `KoPoseScale`, the prone safety nets | all ratios of one actor's own poses, or fractions of its `worldHeight` (`maxExtent`, `minExtent`); the stance shift is pixels times the pixel scale | `party-stature-actor.test.ts` (stance shift x ratio) |
| The head lock (CHK-026) and its anchor | `HeadLock.ts` holds each plane's registered head to the idle's under the same camera and transform; a common factor cancels; the idle's reference is built from the same `worldHeight` | `party-stature-actor.test.ts` (every swap x1.00 at three stage cameras for all seven heights; the lock's factor within 0.01 of Tidus's and never at the band) and the continuity harness run below |
| Damage numerals, cursors, status marks above heads | the HUD asks `stage.project(id, 'head' / 'chest' / 'feet')`, which is `PaintedActor.headPoint` / `centerPoint` / the actor's position (0.92 and 0.52 of the aim height, which over a lying body is the plane's top) | `party-stature-actor.test.ts` |
| Target brackets, the x-ray fade, the key-feature boxes (faces, weapons) | `projectRect`, `contentQuad` and `paintPoint` through the live plane | measured: every hero's screen height moves by his ratio (below) |
| The selection pool | `max(0.55, footprint x 1.35, 0.4 x worldHeight)` in `PaintedActor.update` | by construction (a multiple of `worldHeight` for every hero) |
| The turn ring, the contact shadow, the foot-occlusion ellipse | the stage authors them at 0.78 and 0.62 and multiplies both by `ringScale`; the ellipse is the blob's child | `stage-party-stature.test.ts` (radii for all seven) |
| KO, the lying body, revive | `computePoseScale` for `ko` at the same pixel scale, then `PaintedRest.restPlacement`, `ProneLay.layProne` (judged on screen boxes), `LieFlat`, `KoFallback`, `fx/mix/downed.ts` (reads the actor's `worldHeight`) | `party-stature-actor.test.ts` (the lying plane x ratio), the harness |
| Hop, shake, lean, crouch, knock-back | multiples of `worldHeight` in `PaintedActor` | by construction |
| Spell effects, impact bloom, stone shards | `actor.height` and `centerPoint` | by construction |
| Pose swaps | both planes of one actor share the pixel scale | the harness (head x1.00) |
| Switch-in, chain seams, arrivals | `addCombatant` builds a stub (`id`, `side`, `slot`) and calls the same `add`; `stage()` re-adds every live combatant with the same rule; an arrival director's height is given | `stage-party-stature.test.ts` |
| Chapter framing, BOSS SCALE, the staging table, the phone's A-12 refit, the formation relaxation | read the figures' live quads, relative to "today's rig" at the same moment | Round 1: **measured, and it moved: see "Composition"**. Round 2: each reads the hero at the shared height (`SharedHeight.ts`, `planFig.ts`), so none moves |

## Measured: before and after, same build, same moment

`docs/screenshots/r3941-heights/tools/capture.mjs` (headless Playwright from node on the GPU; the browser pane and Chrome were not used): for each FFX chapter and each of 1600x900 and 390x844 (touch), a fresh page with `Math.random` seeded, seed 1, `gotoChapter` to the first command menu, 30 + 60 frames, the framing's plan awaited,
40 frames of every figure's projected rectangle measured (`__pyrefly.targeting()`, the stage's own projection; the median is kept), the HUD panels read from the DOM (the CHK-008 list plus the solid children the HUD itself dodges), the clocks frozen (`__pyrefly.fx.freeze`) and the picture taken. Once with `?stature=off` (before) and once by default (after).
The framing's plan is deterministic: repeating the runs of Chapters I, XII (1600x900) and II, III, VII (390x844) moved the planned camera by 0.000 to 0.020 units (one 0.10 on the phone in VII), so every larger move below is the stature's.

Numbers, all 22 chapter and viewport cases, per figure: `docs/screenshots/r3941-heights/before-after-numbers.md` (tables), `.txt` (everything), `.json`. In short:

- **World heights:** exactly the table in all 62 figures (Tidus keeps his scene's 1.82, 1.75 or 1.8; Kimahri is 2.204 where Tidus is 1.82; and so on); Chapter XIV's Yuna 1.68 to 1.68.
- **Screen heights against Tidus's own change:** within 0.94 percent of the table over 36 comparisons (Auron 1.072 against 1.062 in Chapter XII, the largest). Where there is no Tidus (IX, XIV) the figures' own before to after: Lulu x0.990, Kimahri x1.217, Yuna x0.908 in IX; Yuna x1.000 in XIV.
- **Feet:** 0 world units of movement in 59 of 62 figures; 0.002 in three.

- **FFX-2 untouched** (`ffx2-untouched.jpg`, `tools/ffx2-compare.py`; Bahamut, Vegnagun/Shuyin and Leblanc at 1600x900, the same two modes): every actor's world height, contact-shadow base and turn-ring base is identical off and on (the girls at the scene's 1.82 or 1.68, the bosses and the Goons as before); each girl's drawn height differs by at most 1.7 px between the two runs, the animation's sway (the pictures are not pixel-equal: the damage numerals and the bosses' limbs are mid-motion at slightly different moments).

**The seven in one row** (`lineup-before-after.jpg`, `tools/lineup.mjs`): the engine's own stage in Chapter I's room, the scene's own camera, all seven staged through the Switch-in path (`addCombatant`, the same `add` a real Switch-in uses), one row at one depth with only their x set by hand, so height is the one thing that differs; the camera is the same in both halves (`&fx=a,b` stops the framing re-planning between them). Before: every hero 297 to 300 px tall. After: Tidus 299, Yuna 272, Auron 319, Kimahri 365, Wakka 361, Lulu 296, Rikku 271 px, a dashed line at Tidus's top. Kimahri's painting is a spear taller than his mane, so his tallest pixel is not his head: next section.

## Composition: Kimahri and Wakka at the top of the frame and against the HUD

The brief: check the tallest figure against the top of the frame and the HUD in every FFX chapter at 1600x900 and at phone size, and if anything clips or collides, report it with pictures and options, not a fix. Everything below is measured on the pairs above; the pictures are in `docs/screenshots/r3941-heights/` (`chNN-<chapter>-<size>-before-after.jpg`, the two contact sheets, `findings/`).

**What does not happen**

- **Nothing clips the frame.** The highest head of any party figure is 298 px from the top at 1600x900 (Kimahri, Chapter I; 355 before) and 229 px at 390x844 (Wakka, Chapter VIII; 255 before). No figure's share outside the viewport grew by more than 0.6 points (Yuna in Chapter I, 2.4 to 3.0 percent; the largest share anywhere, Tidus's 6 percent on the phone in Chapter I, is the same before and after).
- **No panel meets a figure it did not already meet:** 0 new overlaps of a figure's box with a HUD panel in 22 cases; faces and weapons (CHK-008's key-feature boxes) under a panel: 0 to 0 in every case.
- **No party member newly fails CHK-011** (75 percent clear of other figures and in frame). Three newly pass: Yuna in VII (desktop), Kimahri in IX (both sizes). The known failures stay: Auron behind Tidus in II and III (27 to 35 percent of him visible in III), Kimahri in I, Yuna in VII (phone) and X, Tidus and Auron in XII on the phone.
- **Closest a head comes to a panel above it** (1600x900, before to after, px): Auron under the move advisor's card 37 to 31 in II, 38 to 32 in III, and in XII (the Omnis layout's card) from far away to 34; Kimahri 68 to 43 in I, 113 to 66 in X; Wakka 171 to 75 in VIII. On the phone the intent panel is 105 px above Kimahri in IX (131 before) and 93 above Wakka in VIII (120).

**What does: five things, none fixed**

1. **Chapter I, 1600x900: the framing's menu rule no longer passes for Yuna.** The framing re-planned (item 3): its camera is 0.44 units nearer, and its own rule (a member at most 6 percent under a panel while a menu is open) now counts Yuna at 8 percent (4 before) and reports the plan as not passing (`fit.ok` true to false). The raw overlap barely moved: her box (67,000 to 61,000 px) is under the stat rows by 2,900 to 3,500 px and under the Mortiorchis scan card by 6,800 to 5,900, 14 to 15 percent of it, the card's corner on the right edge of her skirt both times (`findings/ch01-yuna-and-the-scan-card.jpg`). A near miss of a rule, not a new collision.
2. **Chapter IX, 390x844: Kimahri's head goes deeper behind the Zanmato gauge.** On the phone the gauge is a 145 px block (y 142 to 287) that already covered the top of all three (boxes start at y 267 to 275). Kimahri's box now starts at 241: 6,700 px of it (31 percent; was 2,400, 16) sit behind the gauge's lower rows. His mane is dimmed behind "Next: Daigoro", his face is clear (`findings/ch09-phone-kimahri-under-the-zanmato-gauge.jpg`). Yuna's head is now clear of it (0; was 9 percent), Lulu's is as before (9 percent). The one real new-looking collision of the 22.
3. **The framing re-plans, so Tidus's size on screen moves.** CHAPTER FRAMING reads the party's live quads, so a taller or shorter party changes "today's rig", the floor it must keep (90 percent of the party's mean) and which camera passes its HUD rules. In 5 of the 18 cases that have a Tidus the planned camera moved and he moved with it: Chapter I +4.8 percent (0.44 nearer), Chapter XII -4.1 percent (0.45 farther), +1.6, +1.5 and +1.3 percent on the phone in II, III and VII (0.16 to 0.19). The other 13 are within 0.2 percent. "Tidus's on-screen size stays as today" holds for his world height, not for his picture in those five. The advisor card (the HUD's, which dodges the figures) also moves down toward Auron's head in XII.
4. **BOSS SCALE follows the party's mean.** A colossus is sized as a multiple of the party's mean on-screen height (`fx/mix/masters.ts` `scaleTarget`, `partyPx`), so the sized colossi in the set move with the party's mean ratio: Yojimbo 250.8 to 260.2 px (+3.7 percent, his "1.15 times the party" held) and Natus 349.7 to 359.8 (+2.9). Evrae, Braska's Final Aeon, Yunalesca, Seymour in VII and the Sin chapters did not move (a plan that keeps today's rig at the drawn scale, or no sizing); Seymour Flux (+2.2) and Omnis (-3.0) move only with the camera of item 3. No boss number or rule was touched.
5. **Figures overlap each other more where a tall hero stands by a short one.** Box overlap (share of the smaller box) Kimahri and Yuna in IX 0.28 to 0.44 (0.33 to 0.49 on the phone); Tidus and Yuna in X 0.47 to 0.53 (Yuna the shorter one, behind: 53 to 47 percent of her visible, a CHK-011 miss that was already there). Coverage by a nearer figure did not get worse for anyone else; most pairs overlap less (I, II, III, VII, XVII, XVIII).

**Options** (two or three each; none is built)

- *For 3 and 4 (the camera and the bosses):* **(a) leave them**: the framing is adapting to a party that really differs, and "1.15 times the party" is, if anything, now more literal. **(b) Make the framing read the party at Tidus-equivalent heights (FFX only):** divide each figure's box height by `ffxPartyStature(figure id)` where the mean is taken (`partyPx` in `fx/mix/geometry.ts`, its two callers in `masters.ts` and `clearance.ts`). Then `todayPx`, the floor, the plan and every BOSS SCALE target are what they were, and only the figures differ. About ten lines, FFX only, unmeasured here (the HUD rules still see the real boxes, so a plan could still move where a panel is tight, as in Chapter I). **(c)** Scale the whole party by one factor (say 0.95, Tidus included) so Kimahri and Wakka sit closer to the old sizes: it moves Tidus, which you asked to keep.
- *For 1 and 2 (the two overlaps):* **(a) leave them** (a card's corner on a skirt; a mane behind a translucent gauge). **(b) Chapter-specific nudges:** Chapter I's party slots 0.3 units left and back, and Chapter IX's phone party 0.3 toward the camera (below the gauge); each is a scene slot edit and a re-measure. **(c)** If Kimahri's painting must not exceed his old height, apply his table value to the *body* only (see 5 above), which makes him taller, not shorter: it is the opposite of this problem.

## The painting's top is not always the hero's (Kimahri)

`research/ffx-character-heights.md` section 5a has the measurement and its table. In one line: the approved idles are cropped at their topmost opaque pixel (row 16 in all seven), which is the hero's own hair or crest for Yuna, Auron, Wakka, Lulu and Rikku, Tidus's sword pommel (12 px above his hair) and Kimahri's spear tip (96 px above his mane).
So the plain multiply leaves the six bodies within 1.3 percent of the table and Kimahri's mane at 1.124 of Tidus's hair. **To put his body at 1.211, his applied value is 1.304**; the cost is a painting 30 percent taller (and wider) than Tidus's.

**The option, built once and measured, then put back** (the table changed to 1.304 for Kimahri only, Chapters I, IX and X captured at both sizes, the table restored byte for byte; `lineup-before-after-option.jpg` has it as a third panel, `findings/option-k1304-ch01-1600x900.jpg`, `-ch10-1600x900.jpg` and `-ch09-390x844.jpg` have before, as built and option side by side):

- Kimahri's painting is 7.7 percent taller than as built: Chapter I 310 to 334 px at 1600x900 (144 to 155 on the phone), Chapter IX 252 to 272 (151 to 164). His head comes 5 px nearer the advisor's card in I (43 to 38) and 12 px nearer the intent panel on the phone in IX (105 to 93); his box overlaps Yuna's by 0.52 and 0.57 in IX (0.44 and 0.49 as built); on the phone in IX 9,100 px of him are behind the Zanmato gauge (6,700 as built). Faces and weapons under a panel stay 0.
- **In Chapter X at 1600x900 the framing's plan flips**: BOSS SCALE (0.45) no longer applies, the camera moves 1.9 units from where it was, Natus goes from 360 to 209 px on screen, and Kimahri's box meets the stat list (1,865 px, none of it a face). One run; it is the framing reading a taller party mean, not anything the stage does for Kimahri. Chapter I's plan and the phone cases did not flip.
- So putting his body at 1.211 is a one-number change with a real price in the camera; if you want it, it goes best together with option (b) above (the framing reading the party at Tidus-equivalent heights). Not built.

## The CHK-026 head check (the continuity harness: real keys, headless Chromium on the GPU, seed 1, 1600x900)

**Round 2, the final build (Kimahri 1.304; the planners at the shared height; `docs/screenshots/r3941-heights/head-check-r2/`): PASS in all three.** Chapter I 435 swaps (242 with a registered head), 12 knock-out swaps, worst registered head-size jump 0.33 percent, every KO swap between x0.9989 and x1.0033 (Tidus hurt to KO 1.0029 to 1.0033, Yuna idle to KO 0.9995 to 0.9999 and her revive 1.0002 to 1.0006); Chapter IX 119 (72), 2 KO, 0.30 percent (Lulu's KO 1.0030); Chapter XVII 1,469 (1,114), 12 KO, 0.24 percent (Auron hurt to KO 1.0017 to 1.0021, Tidus 1.0015); the tolerance is 3 percent and Round 1's (Kimahri 1.211) readings were 0.36, 0.23 and 0.28. CHK-027 fails in every run as on the 39.4 baseline. Strips of three KO swaps are beside the table. Round 1's table, from the 1.211 build, follows.

Run with `critic/runner/lib/continuity.mjs` (`PYREFLY_BROWSER=gpu`): the chapter played to a win by real keys, every pose swap measured on the registered head. Files in `docs/screenshots/r3941-heights/head-check/`: `head-check-table.txt` (this table and the per-hero swap ratios), `continuity-summary-*.json` (the harness's own), and the strips of the knock-out swaps (`chNN-<hero>-<swap>.jpg`; the green cross is the registered head, the line the idle's head height; six frames before the swap and five after).

| Chapter | stature | CHK-026 | swaps (head registered) | KO swaps (registered) | worst head-size jump at a registered swap | feet shift |
|---|---|---|---|---|---|---|
| I Seymour Flux | off (control) | PASS | 441 (246) | 14 | 0.35 percent | 1 px |
| I Seymour Flux | **on** | **PASS** | 442 (247) | 12 | **0.36** | 1 px |
| IX Yojimbo | off (control) | PASS | 119 (72) | 2 | 0.30 | 0.9 px |
| IX Yojimbo | **on** | **PASS** | 119 (72) | 2 | **0.23** | 0.8 px |
| XVII Fins and Core | **on** | **PASS** | 1,516 (1,151) | 16 | **0.28** | 1 px |

The tolerance is 3 percent. Release 39.4's own head-lock table (`docs/screenshots/r394-headlock/table.txt`, head lock on) reads 0.34, 0.29 and 0.24 for the same three chapters: the same numbers.
Knock-out swaps with the stature on, the head's size after over before (1 is no jump): Chapter I, Tidus hurt to KO 1.0027 to 1.0036, idle to KO 1.0010, KO to idle 0.9991 to 0.9994; Yuna idle to KO 0.9995 to 1.0000, and her revive, KO to idle, 1.0004 to 1.0011. Chapter IX, Lulu hurt to KO 1.0023, KO to critical 1.0009. Chapter XVII, Auron hurt to KO 1.0023 to 1.0027, KO to idle 0.9999 to 1.0006; Yuna hurt to KO 1.0002, idle to KO 0.9994 to 0.9996, KO to idle 0.9999 to 1.0005. All within 0.4 percent, as with the stature off (up to 0.35).
In the 22 "after" captures the lock held 3,166 planes of the party and clamped none; its own factor spans 0.9993 to 1.0073 (Kimahri, the largest; 0.9995 to 1.0060 with the stature off) inside the band 0.9 to 1.1, as the unit test says (within 0.01 of Tidus's).
The harness's CHK-027 (motion continuity) fails in every run, on and off, exactly as in the 39.4 baseline (snaps at a knock-out cut, jerks; not this lane's).

## Tests

| File | Tests | What it holds |
|---|---|---|
| `tests/unit/ffx-party-stature.test.ts` | 9 | the table: seven heroes and no one else, Tidus exactly 1, a sane band, unknown ids are 1, the research note's table says the same numbers, and (while the basis is the bind pose, so a refinement that changes the basis lifts them) the datamined ratios to the digit and the ratio as the model top over Tidus's |
| `tests/unit/engine/party-stature.test.ts` | 15 | the maths: who is scaled (FFX-2 and FF7 never; aeons, fiends and an unstaged state never), `figureHeight` is the old numbers bit for bit outside the table, a scene's or a director's height is the figure's own, the feet row on the ground line for every hero and pose, every plane length x the ratio, safety nets relative |
| `tests/unit/engine/stage-party-stature.test.ts` | 14 | the real `PaintedStage` with `PaintedActor.create` recorded: all seven, FFX-2's same ids, an aeon, an enemy with a hero's id, a Switch-in, `?stature=off`, Chapter XIV's Yuna, an arrival director's height, a stage never staged, a re-stage; Round 2: the factor is recorded on the actor (and on nobody the stage did not scale), and `screenRects(true)` is the stature-off picture to 1e-6 |
| `tests/unit/fx-mix-party-stature.test.ts` (Round 2) | 9 | `statureOf`, `planFigOf` (a hero drawn at k times the shared height reads back as the figure at the shared height about his ground point, not the middle of his painting's bottom edge; a figure with no stature is exactly `figOf`), and what the planners compute from it: the party's mean, today's rule (floor, overlap, boss cover) and BOSS SCALE's factor (both the colossus steps and Yojimbo's held size) are the equal-height party's |
| `tests/unit/engine/party-stature-phone-fit.test.ts` (Round 2) | 5 | the A-12 phone refit with `shared` subjects leaves the camera where it was for every ratio (in the scene that raises it on its pedestal and in the one that stands it back), would have moved it read as drawn, is exactly the old fit with no stature, and A-11's push still reads the figure as drawn |
| `tests/unit/chapters/cavern-phone-party-step.test.ts` (Round 2) | 3 | Chapter IX's party slots: the published ones on every landscape window, z +2.0 on the three active slots on a portrait one, the reserve and the published table untouched |
| `tests/unit/engine/party-stature-chapters.test.ts` | 5 | the shipped chapters: exactly eleven FFX chapters, every FFX hero at his scene's party height times his ratio, no FFX scene names a hero but Chapter XIV's Yuna, every FFX-2 chapter and both hidden experiments exactly as before |
| `tests/unit/engine/party-stature-actor.test.ts` | 19 | the REAL `PaintedActor` (Yuna's real pose records) at the shared height times each of the seven ratios: feet, one pixel scale, stance shift, the numeral anchors, the lying plane, the head lock at three stage cameras (Round 2: Kimahri's lock factor is within 0.015 of Tidus's, 1.05 percent at his 1.304) |

**Results, Round 2, on the tree committed with this note:** `npx tsc --noEmit` is clean (TypeScript 7.0.2; a deliberately wrong line in a scratch file was caught, so it is really checking). The eight stature test files are 79 tests and all pass. The full suite, `node node_modules/vitest/vitest.mjs run --testTimeout=60000`: **919 files passed, 5 skipped (924); 13,625 tests passed, 46 skipped, 1 todo; no failures, no timeouts** (251 s), which includes every presenter, stage, framing and chapter test file. `node tools/orphans.mjs`: none of the new modules is an orphan (the 24 it lists are older and not mine). Every source file touched is under 400 lines except `BattlePresenterStage.ts`, which was over before this lane (`framing.ts` is 399, `cavern-stolen-fayth.ts` 397). Round 1's run, on the 1.211 build: 916 files, 13,604 tests, 418 s.

## Files

| Path | What |
|---|---|
| `src/data/ffx/party-stature.ts` (new) | the table |
| `src/engine/PartyStature.ts` (new) | `partyStature`, `figureHeight`, `?stature=off`; Round 2: `STATURE_KEY`, `FigureHeight.stature` |
| `src/engine/SharedHeight.ts` (new, Round 2) | `statureOf`, `backToShared`: a hero read back at the shared height |
| `src/engine/fx/mix/planFig.ts` (new, Round 2) | `planFigOf`, `atSharedHeight`: the figure CHAPTER FRAMING and BOSS SCALE plan with |
| `src/engine/fx/mix/framing.ts`, `staging.ts` (Round 2) | `Framing.visible(actors, planned)`, `Staging.planScale`: read `planFigOf` (framing.ts is 399 lines) |
| `src/engine/FrameFit.ts`, `ShotRules.ts`, `BattleCamera.ts`, `BattlePresenterPorts.ts` (Round 2) | `FitSubject.shared` (optional, also on the `fitSlice` port types) and the A-12 refit that sets it |
| `src/engine/BattlePresenterStage.ts` | a few lines in `add` (941 to 944 lines, over the 400-line rule before this lane); Round 2: the factor on the actor, `projectRect(id, cam, shared)`, `screenRects(shared)`, `relaxFormation` reads them |
| `src/scenes/via-purifico.ts` | Yuna named in `figureHeights` |
| `src/scenes/cavern-stolen-fayth-rigs.ts`, `cavern-stolen-fayth.ts` (Round 2) | `cavernPartySlots(slots, aspect)`, `CAVERN_PHONE_PARTY_STEP`: the party 2.0 nearer the lens on a phone (the scene file is 397 lines, so the rule lives beside the rigs' aspect rule) |
| `research/ffx-character-heights.md` (new), `research/visual-bible.md` | the sourced note, a cross-reference |
| `docs/plans/r3941-heights-review.md`, `docs/CONTRACT-CHANGES.md`, `docs/ENGINE-API.md`, this note | records |
| `tests/unit/ffx-party-stature.test.ts`, `tests/unit/engine/{party-stature,stage-party-stature,party-stature-chapters,party-stature-actor,party-stature-phone-fit}.test.ts`, `tests/unit/fx-mix-party-stature.test.ts`, `tests/unit/chapters/cavern-phone-party-step.test.ts` | the proof |
| `docs/screenshots/r3941-heights/` | the pictures and the numbers |

## Reproduce, and clean up

The proof scripts are in `docs/screenshots/r3941-heights/tools/` (Node 24 reads the table's TypeScript directly; Playwright and Pillow are the repo's own and the system Python's). They take a running dev server and write to a folder you name:

```
# a dev server for the worktree (stop it after: Get-NetTCPConnection -LocalPort 5190 -State Listen, then taskkill /PID <pid> /T /F)
node node_modules/vite/bin/vite.js --port 5190 --strictPort --host 127.0.0.1
T=docs/screenshots/r3941-heights/tools ; O=D:/Tools/pyrefly-scratch/<day>/r3941-heights   # a folder outside the repo, on D:
# before and after for every FFX chapter, both sizes (one browser at a time, about 17 s a run on the GPU)
PYREFLY_BROWSER=gpu node $T/capture.mjs --base=http://127.0.0.1:5190 --out=$O/frames --viewports=1600x900,390x844 --modes=off,on   --chapters=seymour-flux,yunalesca,braskas-final-aeon,seymour-anima-macalania,evrae-airship,yojimbo-cavern,seymour-natus,seymour-omnis,isaaru-via-purifico,sin-fins-core,sin-face
node $T/analyze.mjs --dir=$O/frames --out=$O/analysis.json --text=$O/analysis.txt ; node $T/tables.mjs --analysis=$O/analysis.json > $O/tables.md
python $T/pairs.py --frames $O/frames --analysis $O/analysis.json --out $O/pairs
node $T/sheet.mjs --frames=$O/frames --analysis=$O/analysis.json --viewport=1600x900 --out=$O/before-after-sheet.jpg
# the seven heroes in one row, in the engine's own stage
PYREFLY_BROWSER=gpu node $T/lineup.mjs --base=http://127.0.0.1:5190 --out=$O/lineup --chapter=seymour-flux
# FFX-2 untouched: the same two modes on the three FFX-2 chapters, then compare and compose the sheet
PYREFLY_BROWSER=gpu node $T/capture.mjs --base=http://127.0.0.1:5190 --out=$O/frames-ffx2 --chapters=ffx2-bahamut,ffx2-vegnagun-shuyin,ffx2-leblanc --viewports=1600x900 --modes=off,on
python $T/ffx2-compare.py --dir $O/frames-ffx2 --sheet $O/ffx2-untouched.jpg
# the plan's own log for one chapter and size, off against on (what found the phone camera's two other readers in Round 2)
PYREFLY_BROWSER=gpu node $T/probe-framing.mjs --base=http://127.0.0.1:5190 --chapter=braskas-final-aeon --vp=390x844
# the head check
PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5190/ --evidence=$O/cont --chapters=yojimbo-cavern --tag=on --summary=summary-ix-on.json
```
After a refinement of the table: change the `ratio`s (and `FFX_STATURE_BASIS`), update the research note's table section 3 (a test compares them), run the vitest files in the Tests section, and re-run the captures: the scripts read the ratios from the table itself.
To try a ratio before committing to it (Kimahri's 1.304 was tried this way): edit the number, capture only `--modes=on` for the chapters you want, put the file back, copy the stature-off frames beside the new ones (that mode does not depend on the table), then `analyze.mjs` and `triple.py` (before, as built, option side by side).
`public/art` is a junction to the release tree's art, read only; `node_modules` is a junction to the main tree's. Unlink both with `cmd /c rmdir` (no /s) before any removal of this worktree, which this lane did not do.

## Not done, by instruction

No boss, aeon or fiend size touched (Round 2 keeps every one where it was); no FFX-2 change; no camera, framing rule, staging-table or scene `partyHeight` change (Round 2 changes what the planners READ, not what they do; the one scene change is Chapter IX's phone party step); no `NOW.md`, ledger, `CHANGELOG.md` or deploy; no art written (the art junction is read-only, nothing derived or installed). **Round 2 did not regenerate the before/after sheets, the line-up or the pair pictures, by instruction** (the coming camera and boss-size change re-shoots them): the pictures in `docs/screenshots/r3941-heights/` are Round 1's (Kimahri 1.211, the framing reading the live party), except `findings/ch09-phone-party-step.jpg` (Round 2) and the head-check strips if re-taken.
A changelog line for the next build, if you want one: "FFX: the heroes stand at their real relative heights (Kimahri about a third taller than Tidus's painting, his body a fifth taller; Wakka a fifth; Yuna and Rikku a ninth shorter), from the HD models; the camera and the bosses stay as they were; `?stature=off` plays the old equal heights."
