# r38-motion: SKILL TRAVEL (both games) and RUN-IN (FFX-2 only), the production port of the Visual Options prototype

**Branch:** `r38-motion` (from `origin/main` `4b7adea6`), pushed, **not merged, not deployed**. The code and tests are `033888ee`; this note and the stills are the commit after it; the independent check is `1aa4f67b` (FAIL on one major) and **its repair is `4135e9c8`** (the run no longer walks Chapter IV's party out of formation; the run is off under LOW EFFECTS): see "Repair" at the end; the merge with `r38-restage` was then re-checked by a second critic on one scratch merge (**PASS**, no blocker: see "Re-check (merged)" at the end). The branch head is the commit that records that re-check.
**Asked by Bailey** (2026-10-03 ~14:42 EDT, answering the Visual Options page: "I'll go with all your recommendations thank you <3"; D-354,
ask 5): "M1 run-in for FFX-2 (sourced). M3 skill travel for both, once the damage numeral waits for the landing. M1 for FFX has no source, so
it needs your yes. M2 part motion is a low priority." The recommendation he adopted: "Yes to M1 for FFX-2 and M3. Hold M1 for FFX. Skip M2."
**Game case (rule 14):** **SKILL TRAVEL: both games** (the sources say nothing about spell travel in either; one rule, two skins, FFX gold and
round motes, FFX-2 pink and four-point sparkles, drawn larger in FFX-2's wider frame). **RUN-IN: FFX-2 only**, sourced
(`research/ffx2-combat-core.md` line 264, "a character standing far away spends ~2 s running in ... model an approach time proportional to
distance for `short range` abilities, and zero approach time for `long range`", and line 266, Gunner, Lady Luck, Alchemist, Trainer and
Gun Mage fire from where they stand). **FFX gets none** (`research/battle-camera-perspectives.md` A.2 `[absence]`; held for Bailey's own yes).
Every commit says its case.
**critic-plan class** (`node tools/critic-plan.mjs --paths <the changed files>`): **DEEP**; a FOCUSED review of the production candidate
before a deploy, live verification and then the DEEP review on the live build after it (this build owes both); both games; checks CHK-002,
003, 006, 008, 009, 010, 011, 013 to 017, 020 to 023; targets fight, pause, phone, presentation. **Not the save-data class**: no setting, no
save key, no `SaveData.ts` change. Paper preflight: [docs/plans/r38-motion-review.md](../plans/r38-motion-review.md) (written with the build,
after the first browser pass, and says so).

Everything below was measured in headless Chromium with real GPU (`PYREFLY_BROWSER=gpu`) against the dev server of this branch, in
the worktree `D:/pyrefly-r29-options`, seed 1; the party is given 99,999 HP and the enemies minimal agility in the capture scripts only, so the
same move comes round again (scaffolding, not a game change). **Never Claude-in-Chrome or the built-in pane.** Scripts, raw runs, clips:
`D:/Tools/pyrefly-scratch/2026-10-03/r38-motion/` (`run.mjs`, `numeral-proof.mjs`, `numeral-frames.mjs`, `frametime.mjs`, `fight.mjs`,
`sweep.mjs`, `menu-proof.mjs`, `clips/`). Evidence stills in the repo: `docs/screenshots/r38-motion/`.
Order of events, so nothing is claimed that was not re-run: the four clips, the CDP numeral frames, the stand-off sweep, the chapter stop frames and the seven whole-fight pairs were made on the code
before `StageMotion.warm` (a shader pre-compile that draws nothing visible and changes no timing, section 8); the move lengths and numeral table (sections 3 and 4), REDUCE MOTION, BATTLE SPECTACLE off and the
menu-rule proof (sections 6 and 7) were **re-measured on the final code**, and so was the first-run hitch check.

## 1. Target and build, side by side

The approved target is the prototype on `opt-motion` (7f9d0caf; clips and README in `D:/Tools/pyrefly-scratch/2026-10-03/visual-options/motion/`,
the critic's judgement in `critic/reviews/visual-options-2026-10-03.json` and `JUDGE.md`). The build keeps what Bailey picked (an arc, a
smear, a short truck; an impact frame; a shot for every spell; the girl running to the foe and home) and changes four things, each found by the
first browser pass or named by the critic:

| Prototype | This build | Why |
|---|---|---|
| numeral and HP row appeared at once, 0.4 to 0.5 s before the bolt (the critic's blocker) | both wait for the shot's landing and the drawn strike | section 3 |
| shot launched at `action-start` | launched at the action's first blow on a foe, sized to land just before the spell's own first mark | in FFX-2 `action-start` is the start of the CTIM charge and other girls' whole actions play before the damage lands: a shot launched there landed 1 to 2 s before its number |
| the run's stand-off at the fiend's own plane, in world space | a screen-space search over lanes and stops (`motion/StandOff.ts`) | the party stands lower left and the fiend is 4 to 17 units deeper: the world-plane run was a run into the picture, hid Paine behind Rikku and the truck followed her world x to the left |
| a `?motion=` style URL flag | none: under BATTLE SPECTACLE, two capture-only sub-effects (`skilltravel`, `runin`) | brief: no URL flag, no new setting, no save key |

## 2. What it does

| | FFX (every chapter) | FFX-2 (Chapters IV and V, and the chapters added since) |
|---|---|---|
| **SKILL TRAVEL** | a spell or skill with a foe among its targets sends a gold **orb** (lifted arc, white-hot core, round motes trail) from the caster; it lands with a hard 8-ray starburst, a ring and a glow, local to the target (no full-screen wash); Thunder stays **2.02 s** | an **orb** in pink with four-point sparkles, drawn **1.45x** larger (`SKIN_SCALE`), brighter core, shorter trail; **Darkness** is a violet **beam** that grows from Rikku; a long-range dressphere's plain Attack (Gunner, Gun Mage, Lady Luck, Alchemist, Trainer) is a thin **tracer**; 4-ray starburst |
| **RUN-IN** | none (no source; held for Bailey) | a short-range girl's plain **Attack**: she runs from her place along the ground to a stop chosen from what the picture shows, strikes with a 0.6 lunge (today's is 1.4), runs home in three quarters of the time; a few translucent afterimages of her own painted plane trail her; the camera trucks half the sideways way and lifts 0.1 |
| **Gate** | BATTLE SPECTACLE on, not REDUCE MOTION (setting or OS), not skip playback | the same, and **nothing plays over an open command menu** (the FFX-2 menu rule, D-357) |

**How a shot is timed** (`motion/SkillTravel.ts`, `spellfx/SpellFxLayer.fly`): `action-start` only *plans* (which shot this action would send, to
which foes). The shot leaves at the action's first blow with an explicit `sourceId`, in step with the spell's own effect, and flies
`clamp(first mark of the effect - 60 ms, kind minimum, kind maximum)`: orb 140 to 480 ms, tracer 120 to 150, beam 180 to 200. So it rides
the wait the spell already has. Only an effect whose mark is shorter than the kind's minimum is stretched (Darkness's slash and a gun's hit have
0.1 s marks): by under 0.1 s. A spell with no mark to hide behind (Drain, Demi, Flare resolve to the bare bloom) flies the minimum and adds just that.
A pure status spell has no blow, so no release and no shot (today's look). A heal or self buff never flies; a melee skill keeps today's lunge.

**What a run is** (`app/screens/BattleScreenRunIn.ts`, `motion/StandOff.ts`, `motion/StageMotion.ts`): `RunInMotion` is the FFX-2
`actionMotion` port (`strike`, `close`, `lungeFor`, `longRange`; none of FF7's other members). At `action-start`, after the shot has opened and
before the house strike, it asks the stage for the painted spans and screen rectangles of her, her target and everyone else, and `planRun` scores
lanes (her own depth to the fiend's) by sideways steps of 0.35 unit: travel toward the fiend on screen (up to 0.28 of the frame), her size on screen,
whether a nearer figure covers her, whether she is buried in the fiend's picture with her feet above its bottom edge, whether she is in frame, and
the length of the run. **Hard rule: never in the fiend's depth slab (+-1.2 units) across its painted span.** The fiend's width is read from its painting
(the alpha box), never from a table, so a chapter added later gets its own answer. In practice every chosen stop is on her own lane (`dz` is 0 in all 37
plans) and in front of the fiend's feet. Run times are ours, a short read of the source's "about 2 s": 0.32 to 0.47 s in by distance, three quarters of
that home.

## 3. The damage numeral and the HP change wait for the landing (the critic's blocker)

Both HUDs raise a blow's numeral and move its HP row *before* the blow's beat plays, so today a spell's number appears 0.4 to 0.5 s before its
bolt. For a blow whose action sends a shot, the loop now skips that early look (`blowHeld`) and the blow's beat shows both (`revealBlow`), once the shot
has landed and the effect's own frame clock has drawn its strike (`VfxPort.markIn`, the same idea as FF7's `pendingLand`). Every other blow, and every blow
with no shot, is byte for byte today's order.

**Measured on the page clock** (`numeral-proof.mjs`: the foe blow's DOM numeral against the frame on which the spell layer's own clock reached the
mark, and against the shot's landing; three casts each, today in the same session):

| Cast | | shot (ms) | numeral against the drawn strike (ms) | numeral against the shot's landing (ms) | HP rows against the numeral (ms) |
|---|---|---|---|---|---|
| FFX Ch I, Lulu, Thunder on Seymour Flux | today | none | **-542, -513, -504** | none | 0 |
| | SKILL TRAVEL | orb 426, 421, 433 | **+1, +1, +3** | +84, +84, +87 (the impact frame is between) | 0 |
| FFX-2 Ch IV, Rikku, Darkness on Bahamut | today | none | **-110, -116, -87** | none | 0 |
| | SKILL TRAVEL | beam 198, 189, 190 | +85, +84, +86 (the beam is held to its 180 ms minimum; the slash mark is 0.1 s) | **+1, +1, +1** | 0 |
| FFX-2 Leblanc, Yuna (Gunner), Attack on Dr. Goon | today | none | -114 | none | 0 |
| | SKILL TRAVEL | tracer 131 | +18 | **+1** | 0 |

So today the number is up 0.5 s before the bolt (FFX) or 0.1 s before the hit (FFX-2); with the look it arrives on the strike frame (FFX) or
the landing frame (FFX-2), and the HP rows move with it. **The landing frames themselves, with the browser's own frame timestamps** (a CDP screencast:
every compositor frame, timestamped on the page's wall clock; `numeral-frames.mjs`), are `docs/screenshots/r38-motion/numeral-ffx-lulu-thunder.jpg` and
`numeral-ffx2-rikku-darkness.jpg` (offsets in ms from the numeral's insertion; the numeral fades in over about 0.1 s, so it is first visible one or two frames
after offset 0). FFX: the orb is in the air at -178 ms, arrives at -82, the starburst is up at -32 and +18 with no number, and the lightning strike and the
number 754 are one frame at +102; today's row shows the 790 up from +122 ms and the bolt only at +636. FFX-2: the beam grows at -99 and -50 and has landed
at +20, the number 462 and the impact ring are there at +109; today's 325 is up at +36 and the slash at +118.
The Darkness beam across the field, a frame every 40 ms from -40 to +280 ms of its release: `beam-ffx2-darkness-flight.jpg`; the Gunner's tracer (three frames of a 131 ms crossing, then the impact and its
number): `tracer-ffx2-yuna-gunner.jpg`.

## 4. What the looks add to a move and to a fight

**One move** (presenter time of the move's own beats, today against the look; the FFX-2 move window under ATB overlap also holds other girls' actions, so the
per-event times are the honest number):

| Move | Today | With the look | Added |
|---|---|---|---|
| FFX Ch I, Lulu, Thunder | 2054, 2062, 2032 ms | 2023, 2014, 2018 ms | **-0.03 s** (inside the existing wait; the blow's own beat 838, 811, 804 ms against 813, 796, 811) |
| FFX-2 Ch IV, Rikku, Darkness: the blow on the foe | 396, 381, 397 ms | 466, 459, 462 ms | **+0.07 s** (the beam's 180 ms minimum against a 100 ms mark) |
| FFX-2 Leblanc, Yuna (Gunner) Attack: the blow on the foe | 383 ms | 400 ms | **+0.02 s** |
| FFX-2 Ch IV, Paine (Warrior), plain Attack on Bahamut, whole move | 861, 869, 858 ms | 1488, 1490, 1484 ms | **+0.63 s** (a 2.1-unit run: +0.36 s at the opening, +0.27 s on the run home; the blow's own beat is unchanged) |
| FFX-2 Ch V, Paine (Dark Knight), plain Attack on Vegnagun's tail, whole move | 858, 857, 849 ms | 1737, 1750, 1752 ms | **+0.89 s** (a 5.9-unit run: +0.50 s at the opening, +0.39 s on the run home) |

**A whole fight** (`fight.mjs`: the chapter's own `intended` tactics at normal speed from the opening to the result, look off and on run side by side so both
see the same machine load; seed 1; flights and runs counted across the fight):

| FFX-2 chapter | turns (off / on) | look off | look on | difference | flights | runs | from the per-move costs (runs x 0.63 to 0.88 s + flights x 0 to 0.08 s) |
|---|---|---|---|---|---|---|---|
| IV Bahamut | 77 / 77 (victory, victory) | 308.2 s | 310.3 s | +2.1 s (0.7 %) | 12 | 3 | 1.9 to 3.6 s |
| V Vegnagun and Shuyin (5 links) | 54 / 54 (victory, victory) | 864.5 s | 882.3 s | +17.8 s (2.1 %) | 79 | 12 | 7.6 to 16.9 s |
| Leblanc | 47 / 47 (victory, victory) | 281.0 s | 294.4 s | +13.5 s (4.8 %) | 17 | 20 | 12.6 to 19.0 s |
| Fallen aeons | 55 / 55 (victory, victory) | 518.7 s | 523.8 s | +5.1 s (1.0 %) | 57 | 0 | 0.0 to 4.6 s |
| Trema | 45 / 45 (defeat, defeat) | 414.7 s | 444.7 s | +30.0 s (7.2 %) | 5 | 47 | 29.6 to 41.8 s |
| Den of Woe | 32 / 32 (victory, victory) | 384.3 s | 384.7 s | +0.4 s (0.1 %) | 3 | 0 | 0.0 to 0.2 s |
| Ixion and Djose | 52 / 52 (victory, victory) | 242.8 s | 243.6 s | +0.8 s (0.3 %) | 6 | 0 | 0.0 to 0.5 s |
| **all seven** | | 3014.2 s | 3083.8 s | **+69.6 s (2.3 %)** | 179 | 82 | 51.7 to 86.5 s |

Reading it: **the turn count and the outcome are identical in every pair** (the looks never change the fight, only how long it takes to watch); the difference is the
runs times 0.63 to 0.88 s plus the flights times 0 to 0.08 s, within the noise of two real-time runs of 4 to 15 minutes (about 5 s). The fight with the most plain
Attacks under its own tactics, Trema (47 runs), grows most (+7.2 %); the ones with none (Fallen aeons, Den of Woe, Ixion and Djose) grow 0.1 to 1.0 %, and those
are flights only. All seven together: **+69.6 s over 50.2 minutes of play (+2.3 %)**, 82 runs and 179 flights. Trema's `intended` script at seed 1 ends in a
defeat with or without the looks (same 45 turns); that is the chapter's own, not the looks'. A flight adds 0 to 0.08 s (section 4), a run 0.6 to 0.9 s, so the runs are almost all of it.

## 5. The stand-off, chapter by chapter

`sweep.mjs` plays real attacks by every short-range girl on every foe she can reach, link by link, in all seven FFX-2 chapters, and reads the plan
`RunInMotion` logged for each (37 plans; `actionMotion.notes`). "Covered" is the share of her painted box a nearer figure covers at the stop; "size" is her
painted height at the stop over her height at home. 1600x900:

| FFX-2 chapter | plans | girls | foes | run (units) | in + home (ms) | travel on screen (px) | size vs home | covered | feet below the fiend's bottom edge (px) | overlap of the fiend's box | in frame |
|---|---|---|---|---|---|---|---|---|---|---|---|
| IV Bahamut | 3 | paine, rikku | 1 | 2.1 to 2.8 | 320 to 341 + 240 to 256 | 313 to 490 | 1.03 to 1.05 | 0.00 | 62 to 122 | 0.63 to 0.78 | yes |
| V Vegnagun and Shuyin | 7 | paine, rikku | 5 | 0.7 to 5.9 | 320 to 454 + 240 to 341 | 100 to 468 | 0.99 to 1.01 | 0.00 | -42 to 153 | 0.49 to 1.00 | yes |
| Leblanc | 7 | paine, rikku | 6 | 1.8 to 3.2 | 320 to 353 + 240 to 265 | 248 to 480 | 0.98 to 0.99 | 0.00 | 55 to 211 | 0.00 to 0.37 | yes |
| Fallen aeons | 7 | paine, rikku | 5 | 1.4 to 3.2 | 320 to 353 + 240 to 265 | 198 to 456 | 0.98 to 1.01 | 0.00 | 42 to 200 | 0.00 to 0.63 | yes |
| Trema | 3 | yuna, paine | 2 | 1.8 to 2.5 | 320 to 328 + 240 to 246 | 262 to 504 | 1.01 to 1.01 | 0.00 | 113 to 279 | 0.23 to 0.62 | yes |
| Den of Woe | 6 | paine, rikku | 3 | 1.4 to 2.5 | 320 to 328 + 240 to 246 | 198 to 473 | 0.98 to 1.01 | 0.00 | 96 to 188 | 0.21 to 0.60 | yes |
| Ixion and Djose | 4 | paine, rikku | 1 | 2.8 to 3.5 | 341 to 366 + 256 to 275 | 456 to 489 | 0.98 to 0.98 | 0.00 | 112 to 170 | 0.08 to 0.61 | yes |
| **all seven** | **37** | | | | | | | | | | |

Read it as: **no plan is covered by a teammate, none shrinks (0.98 to 1.05), every stop is in the frame, none is in the fiend's depth slab**. Two honest
qualifications. (1) The bosses are huge and their paintings wide, so her box overlaps the fiend's box on screen in most plans (0.0 to 0.78 of her box, and 1.0 on
the Vegnagun tail link); what keeps her out of the fiend is depth and the feet line: her feet are 42 to 279 px **below** the fiend's bottom edge in every plan but two. (2) **The two
exceptions are Vegnagun's tail link** (Paine and Rikku on the tail: feet 38 and 42 px *above* its bottom edge): the picture of the tail wraps around the
party's place, so she already stands inside its rectangle at home and the stop is under the arch, not in front of it (`stand-off-stops-7-chapters.jpg`, top
right). She touches no painted pixel of the tail but her sword. The stops, one per chapter: `docs/screenshots/r38-motion/stand-off-stops-7-chapters.jpg`;
the runs in Chapter IV and V against today: `run-in-ch4-paine-today-vs-look.jpg`, `run-in-ch5-paine-today-vs-look.jpg` and the strips `run-in-ch4-paine-strip.jpg`,
`run-in-ch5-paine-strip.jpg`.

## 6. The FFX-2 menu rule, in a browser with human-style input

`menu-proof.mjs` plays Chapter IV (`ffx2-bahamut`, Wait mode, the default) with **real key presses** (Enter, arrows): whichever girl's menu opens, hold it open so
the actions already queued execute **under** it, then answer it (Yuna White Magic > Cure, Rikku Darkness, Paine Attack), so other actions execute with no menu
open. Per action it records the menu state at the action's start and at its first blow, and whether a flight or a run happened. 170 s of play, 17 actions that
could have played a look:

| | actions | flights | runs |
|---|---|---|---|
| a command menu **open** at the start or at the blow | 3 | **0** | **0** |
| **no** menu open | 14 | 5 | 9 |

(`docs/screenshots/r38-motion/menu-rule.jpg`: left, Rikku's command menu open (the gauges held) while Paine attacks from home; right, no menu and she runs.) The gate is asked at
the release (shots) and at the run's start, and the run home snaps instead of playing if a menu opened while she was out. `autoBattle` never opens a menu, so
this needed key input; the unit tests cover the same rule with a fake menu.

## 7. The other rules

- **REDUCE MOTION plays today's version** (OS preference emulated by Playwright `reducedMotion: 'reduce'`, which `prefersReducedMotion()` reads, and the same
  read the camera uses): Ch I Thunder, Ch IV Darkness and Ch IV Paine's Attack with both looks on: **0 flights, 0 runs**, move lengths equal to the look-off
  moves of the same session (1523 and 1514 ms; 3108 and 2950 ms with other girls' actions inside the window; 778 and 779 ms).
- **BATTLE SPECTACLE off** (`__pyrefly.fx.set('c', false)`, the setting's own seam) with both sub-looks on: 0 flights and 0 runs in Ch I and Ch IV, moves 2065 and
  2037 ms (Thunder), 3786 and 3018 ms (Darkness), 882 and 876 ms (Paine's Attack); switching it on again in the same session: Thunder 2025 and 2022 ms with 2 flights, Darkness 2 flights, Paine's Attack
  1496 and 1477 ms with 2 runs.
- **Skip playback, LOW EFFECTS, a stage that declines** (a special that draws its own effect: Spiral Cut, Mega Flare): unit tests (`r38-skill-travel.test.ts`);
  at the `low` tier the layer draws nothing and `canFly` says so before anything is held.
- **Phone (390x844):** `docs/screenshots/r38-motion/phone-frames.jpg`: the Darkness beam landing, a Thunder orb in flight, Paine at her stop in Chapter IV and under the
  tail in Chapter V; the shot and the run read at that size (the layer thins the trail to 0.6 density on the phone tier).
- **FF7:** the one existing user of `actionMotion` (Ff7ActionMotion) gets the run home keyed by the ended action's actor id instead of `ctx.actingId` (the prototype's
  change; under FFX-2's ATB `actingId` can be another girl's). FF7 is sequential, so the two are the same figure there; the unlisted Guard Scorpion fight, played
  on `origin/main` and on this branch at the same seed, normal speed, `intended` tactics: identical event stream (the whole battle log), identical port calls (2219) and
  outcome, presenter time ratio 1.002.
- **No new setting, no save key, no contract file touched** (`docs/CONTRACTS.md` lists none of the files; `docs/CONTRACT-CHANGES.md` unchanged). `ActionMotionPort`,
  `VfxPort` and `BattleStage` gain optional members only.
- **Layering (rule 1):** `motion/MotionGate.ts`, `SkillTravel.ts`, `StageMotionPort.ts`, `StandOff.ts` and the beats import no `three` and no DOM; the drawing is in
  `spellfx/FlightFx.ts` (pure data into the existing draw list; a test reads it) and `motion/StageMotion.ts` (`three`). Nothing reads or draws a random number the
  engines see.
- **No retail assets, no new texture, no new program:** the shot is atlas tiles the spell effects already use; the smear copies the figure's own painted plane with the
  actor's own vertex shader and a plain fragment, so LIVING PAINTINGS' sway and cast shadow keep working.

## 8. Frame cost

Vsync-free (`--disable-gpu-vsync --disable-frame-rate-limit`, so the frame interval is the frame's real cost; 240 to 770 fps here against 60 capped), the lightest
instrumentation (a rAF clock and the presenter trace only), over each move's own window, today against the look in the same session, three moves each (two on the phone),
**in both orders** (`frametime.mjs`, with and without `--first=look`), because whichever phase runs first in a fresh session pays the session's first-use costs:

| Scenario | size | mean ms a frame, today then look (today's windows first) | (the look's windows first) | worst frame with the look (today first / look first), ms |
|---|---|---|---|---|
| FFX Ch I, Lulu, Thunder | 1600x900 | 1.29 to 1.37 | 1.80 to 2.56 | 18.5 / 135.9 |
| FFX-2 Ch IV, Rikku, Darkness | 1600x900 | 2.76 to 2.67 | 3.01 to 3.77 | 23.9 / 38.4 |
| FFX-2 Ch IV, Paine, Attack (run) | 1600x900 | 2.76 to 2.73 | 4.12 to 3.78 | 16.5 / 53.6 |
| FFX-2 Ch V, Paine, Attack (run) | 1600x900 | 1.87 to 2.12 | 2.63 to 2.19 | 40.5 / 19.3 |
| FFX Ch I, Lulu, Thunder | 390x844 | 2.06 to 1.83 | 1.97 to 2.31 | 19.0 / 84.3 |
| FFX-2 Ch IV, Rikku, Darkness | 390x844 | 2.88 to 2.08 | 2.16 to 2.07 | 17.9 / 33.2 |
| FFX-2 Ch IV, Paine, Attack (run) | 390x844 | 3.73 to 2.46 | 2.89 to 3.07 | 27.2 / 67.4 |
| FFX-2 Ch V, Paine, Attack (run) | 390x844 | 1.37 to 1.44 | 3.40 to 2.31 | 50.7 / 20.1 |

Reading it: the means are 1.3 to 4.1 ms a frame (a 60 Hz frame is 16.7 ms), and the look moves them by less than the order does (the same pair swings by up to 1 ms when the
order flips; no pair shows the look more than 0.8 ms a frame slower). The worst frames (16 to 136 ms) are first-use costs of the session's first spell or effect, paid by whichever phase
comes first, today's or the look's (the 136 ms of FFX Thunder is the session's very first spell draw, with the look's windows first). **One was the look's own, and is fixed in this branch:**
the first run of a session compiled the smear's shader program when its first afterimage was drawn, a 26 to 41 ms frame in 3 of 6 fresh sessions (`hitch.mjs`: Chapter IV 41 and 26 ms at +175 and +160 ms into the
move, Chapter V 37 ms at +348 ms). `StageMotion.warm` now draws one afterimage at no opacity during the opening (FFX-2 only; not under REDUCE MOTION or LOW EFFECTS) and keeps its
material so the program stays cached: in 14 fresh sessions after it, no frame at the run's start is over 22 ms (one 34 ms frame at the strike in Chapter IV, and one 121 ms frame at +1.25 s in a
Chapter V session that did not repeat in six more). The shot itself draws in the spell layer's existing batch and program, so it has no first-use cost of its own.

## 9. Files and tests

New: `src/engine/motion/` (`MotionGate.ts` 35, `SkillTravel.ts` 187, `StageMotion.ts` 281, `StageMotionPort.ts` 53, `StandOff.ts` 126 lines),
`src/engine/spellfx/FlightFx.ts` (255), `src/app/screens/BattleScreenRunIn.ts` (154). Modified (wiring): `BattlePresenter.ts` (+13), `BattlePresenterBeats.ts`,
`BattlePresenterEvents.ts` (+5), `BattlePresenterMotion.ts`, `BattlePresenterPorts.ts` (+19), `BattlePresenterSpellFx.ts`, `BattlePresenterStage.ts` (+30),
`BattleCamera.ts` (394, was 399: a public `truck` vector added on top of the rig), `KeySlots.ts` (three helpers exported), `spellfx/SpellFxLayer.ts` (392),
`app/screens/BattleScreenGameDeps.ts` (FFX-2 gets the port). Every new file is under 400 lines; the four files that were already over it gain wiring only.
Tests: `tests/unit/r38-skill-travel.test.ts` (19), `r38-flight-fx.test.ts` (17), `r38-stand-off.test.ts` (7), `r38-run-in.test.ts` (13), `r38-stage-motion.test.ts` (11, three of them the smear's program warm-up);
`ff7-repair.test.ts` changes one assertion (FFX-2 now carries the RUN-IN port, and none of FF7's members). `npx tsc --noEmit` clean; `node tools/orphans.mjs`: 24 modules,
all of them there before. **The full suite, once, at the end** (`vitest run --maxWorkers=3`): 773 test files passed, 5 skipped; 11,340 tests passed, 41 skipped, 1 todo, none failed (484 s).

## 10. Found, not fixed, and for Bailey

- **A cost or a tick has no `sourceId`.** The engines name the striker on every blow of an ability and leave it off Darkness's 12.5 % HP cost, the destroys-user
  cost and status ticks; under FFX-2's ATB overlap `ctx.acting` is "the latest action started", so crediting those blows to it would hang a beam on the wrong girl.
  A blow belongs to a plan only by its own `sourceId`. The consequence: Darkness's beam launches at the blow on the foe (the cost beat shows at once, as today), not at
  the cost. A fix in the engines (a `sourceId` on costs) would let the beam leave first; it is an engine change, so not done here.
- **Pure status spells have no shot** (no blow, so no release), **FFX has no physical shot** (Wakka's ball; FFX's data has no ranged flag), **FFX gets no run-in** (held),
  **M2 skipped** (Bailey). A painted run key per girl (the prototype's art suggestion) is its own options round.
- **The Co-Authored-By line** on these commits is `Claude Sonnet 5.5` (the model that wrote them and what the harness asked for); the brief said `Opus 5.5`.
  Amending is banned, so the driver can reword on merge if the project wants the other.
- **For Bailey:** the four clips (`D:/Tools/pyrefly-scratch/2026-10-03/r38-motion/clips/`: `m3-skill-travel-ch1-ffx-lulu-thunder.webm`,
  `m3-skill-travel-ch4-ffx2-rikku-darkness.webm`, `m1-run-in-ch4-ffx2-paine-attack.webm`, `m1-run-in-ch5-ffx2-paine-attack.webm`; 8 s each, 1600x900, today then the look,
  captioned) are the thing to judge. Questions this build leaves him: the run is 0.6 to 0.9 s longer per plain Attack (0.27 to 0.39 s of that is the run home); is that
  the rhythm he wants, or should the run home be quicker; and does he want FFX's physical blows (Wakka, Tidus) to get a travelling shot or a run of their own (no source, so his yes).

## 11. Next, for the driver

1. Merge `r38-motion` when ready (not merged by me); `node tools/critic-plan.mjs` says FOCUSED before the deploy and DEEP after it.
2. The focused review should replay the four clips' scenes, the menu rule, REDUCE MOTION and the phone frame (`critic/CHECKS.md` CHK-021 for the game case: SKILL TRAVEL
   both, RUN-IN FFX-2 only).
3. What the deep review on the live build should add to this note: a long FFX-2 fight at real speed (the fight table is the baseline), and the three comfort paths that are unit-tested here
   but were not driven in a browser: LOW EFFECTS (the layer draws nothing and nothing is held), REDUCE FLASHES on the impact frame (`FlashParams.actorCap`) and skip playback.

## CHECK (adversarial, 2026-10-03, a separate agent; branch at 1014aff9)

Everything below was measured by running the builds (rule 3); none of it is the builder's own numbers. Verdict: **FAIL (HOLD as built)** on one major that this change introduces and live does not have: **every plain Attack by Paine or Rikku in Chapter IV moves that girl's resting place a little** (Rikku walks left a step per attack and is standing on Yuna after about ten; Paine creeps toward Bahamut). The numerals and HP rows, FFX's absence of a run, the stand-off, the menu rule, the ATB and event logs, the switches, FF7, the phone frames, the tests and the static checks all hold, with the smaller points under "Minors and disclosures". The blocker has a small fix; the policy also allows the other course (a defect inside a brand-new feature does not block when the feature ships switched off, `critic/RUBRIC.md` section 3).

**Method.** Headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`), 1600x900 (phone 390x844, touch), seed 1, a fresh browser context per run, one browser at a time, ports 6840 to 6842 (every server stopped by PID at the end). Four builds side by side: **branch** (this worktree, a dev server without HMR), **base** (`git archive` of origin/main a6b79313 served from scratch with main's `public/`), **live** (release 37.1, the production bundle at the Pages URL) and, for one smoke pass, the **clean merge** of main and the branch (`git merge-tree`, tree 7be94b1b, no conflict). The drive is the debug API plus real keys wherever a human acts (menus, pause). The repeating-move scaffolding is the builder's idea (party 99,999 HP and enemy agility 1, set inside the strategy); the digests below show it changes nothing the engine does. Times are `performance.now()` read inside each rAF callback, never the rAF argument, and "frames" are rAF callback indices, so "the same frame" is a statement about frames, not about clock skew. The machine was busy (other agents' servers, Chrome): in the same sessions the three seconds before a move show gaps of 25 to 611 ms, which matters for item 8 of Minors. Scripts, raw runs and every log: `D:/Tools/pyrefly-scratch/2026-10-03/r38-motion-check/` (`casts2.mjs`, `runin.mjs`, `menu.mjs`, `drift.mjs`, `fight.mjs`, `hitch2.mjs`, `silhouette.mjs`, ...). Stills: `docs/screenshots/r38-motion-check/`.

### What holds

1. **Numeral and HP row, 3 casts each, branch against base and live.** The engine log digest (ATB snapshots included) is identical on all three builds for every set below, so the logs and the results are the same; only when the number appears moves.

| Cast | build | numeral against the spell's own strike frame | numeral against the shot's landing | foe HP row | move |
|---|---|---|---|---|---|
| FFX Ch I, Lulu, Thunder on Seymour Flux (and on Mortiorchis) | base, live | **30 to 32 frames early** (-499 to -565 ms) | none | the HUD's `syncVitals` runs in the numeral's millisecond; the sensor's HP text never changes in the DOM on any build, so that is the only evidence for an FFX foe row | 2010 to 2062 ms |
| | branch | +1 frame (+16 to +71 ms) | +83 to +105 ms, six to seven frames after the landing tick | the same | 2020 to 2050 ms |
| FFX-2 Ch IV, Rikku, Darkness on Bahamut | base, live | 6 to 7 frames early (-97 to -131 ms) | none | boss bar moves in the numeral's frame | 1902 to 3776 ms |
| | branch | +4 to +5 frames (+78 to +90 ms: the beam is held to its 180 ms minimum, the slash mark is 100 ms) | **0 to +1 ms, the landing-tick frame** | boss bar moves in the numeral's frame, never before it | 1957 to 3887 ms (+55 to +111 ms) |
| FFX-2 Ch VI, Yuna (Gunner), Attack on Ormi | base, live | 3 to 6 frames early (-66 to -101 ms) | none | the same frame | 858 to 870 ms |
| | branch | +1 to +2 frames (+20 to +34 ms) | +1 to +3 ms | the same frame | 871 to 883 ms (+13 to +21 ms) |

   Cheap Shot (tracer 117 to 125 ms, numeral +1 to +4 ms after landing) and Trigger Happy with main's hotfix (160 events, tracer 118 to 132 ms, numeral +1 to +3 ms) hold too; a heal is untouched (FFX Cure on Tidus: no shot, numeral -581 to -585 ms against the effect's mark on both builds, move 2117 to 2137 against 2124 to 2132). Nothing was shown before it landed in any of the 18 shot casts on the branch, the 12 on the merged tree, or the 9 more under the pixel sampler. The finishing blow is not lost: Lulu's Thunder killing the last foe (numeral 790 at the reveal) and Rikku's Darkness killing Bahamut (325) both show their numerals.
2. **FFX shows no run-in** (Ch I, II and VIII physical attacks, Tidus and Wakka, 16 attacks per build): 0 runs, the camera truck is 0 on every frame and at the end, each move is within -22 to +14 ms of origin/main, and the one flight in the three runs (Ch I) came from another character's command, not from an attack.
3. **Stand-off, seven FFX-2 chapters, 42 real attacks** (Paine and Rikku, every foe in turn; Yuna and Paine in Trema): all ran; none covered by a teammate; none out of frame; the stop is on her own lane and 1.7 to 17.1 world units from the foe's depth (the hard rule is 1.2); her feet are 59 to 280 px below the foe's bottom edge except on Vegnagun's tail (-38 to -26 px: the tail wraps the party, as disclosed). Pixel check (each plan staged at its stop and rendered with her and the foe shown and hidden): her painted pixels lie on the foe's painted pixels for 28 to 30 % (Ch IV), 0 to 25 % (Ch V) and 4 to 23 % (Ch VI), never over 30 %, and she hides 0 to 5 % of Bahamut's drawn area (a goon: up to 38 %): she is always drawn in front of the boss, never inside it or behind it. Run in 213 to 356 ms, home 183 to 292 ms; a whole attack is 1488 to 1535 ms in Ch IV against 854 to 868 on base (+0.63 to +0.67 s) and 1706 to 1769 in Ch V against 855 to 865 (+0.85 to +0.91 s), as the handoff says.
4. **Menu rule, real keys, Chapter IV, Wait and Active (about 215 s each, 21 menus each, answered with Enter and the arrows).** 10 eligible actions per mode: the 5 Darkness casts all had a menu open at the blow and flew **0** beams; the 5 Paine attacks had no menu open and **5** ran; no look began with a menu open and no menu opened during one. A plain Attack resolves the moment it is chosen, so in this flow a run never meets an open menu; only the shot side of the gate is exercised by play. Pause (P) pressed mid-run three times: she froze, Escape resumed, the run finished, she was home and the truck was 0.
5. **ATB gauges and turn order are untouched.** The engine advances in virtual time between plays (`BattlePresenter.run`: `tick(nextEventMs)` between `play` calls), so added presentation time cannot move a gauge; the logs prove it. Whole fights with each chapter's own `intended` tactics, base against branch, give identical link digests and results: FFX Ch I (245 events), II (1,107), VIII (510), FFX-2 IV (2,042 events, 77 turns, 301,572 ticks, normal speed), V (556) and VI (105, normal speed); and the same victory, 33 turns and 157 events in the FF7 fight (item 8). The numerals shown equal the numeral-bearing events of the log (38, 192, 186, 90, 136, 14) on base and on the branch; the sequence is identical in the 192-numeral Chapter II fight (my first read showed 191 on the branch: the engine sets `result` while the presenter is still two seconds from the finishing numeral, so a harness that reads at `result` is early; with a nine-second tail both builds show 192, same texts in the same order). Whole-fight wall time: Ch IV 299 s on base, 304 s on the branch; Ch VI 25 and 27 s.
6. **Skill travel is visible, local and inside the wait.** The orb, tracer and beam read at 1600x900 and at phone size (stills), land on the foe, and add no whole-screen flash: the whole-frame peak (mean luma 0 to 255, share of pixels above 215) is 150.3 to 151.7 and 6.3 to 7.3 % on both builds for Thunder (the spell's own strike flash), 68.0 to 71.7 and 5.7 to 6.8 % on base against 70.6 to 73.4 and 6.9 to 7.2 % on the branch for Darkness, and 49.6 to 50.0 and 2.1 to 2.3 % against 45.6 to 45.8 and 2.3 to 2.6 % for the Gunner shot. Colours follow each game's skin: FFX a white-gold orb with a gold ring on the foe, FFX-2 a violet beam with a pale pink ring and sparkles (the flights use the existing `accentOf`: gold `#E3B94A`, pink `#F7B6D9`). Enemy casts fly too (Yunalesca 39 orbs, Ch V 24, Ch I 6, Ch VI 1); their numerals matched.
7. **Switches** (branch, with base controls): REDUCE MOTION by the OS preference and by the saved setting, and BATTLE SPECTACLE off in the saved settings, give **0 flights, 0 runs and a truck of 0**; numerals come in today's order (-499 to -511 ms for Thunder, -97 to -99 for Darkness) and the moves equal base's under the same switch (REDUCE MOTION: Thunder 1505 to 1523 against 1514 to 1528, Darkness 1654 to 3137 against 1668 to 3128, Paine's attack 774 to 794 against 772 to 786; BATTLE SPECTACLE off: Thunder 2016 to 2045, Darkness 1899 to 3800, Paine 856 to 867). LOW EFFECTS: 0 flights and moves equal to base's (Thunder 1512 to 1522 against 1517 to 1533, Darkness 1685 to 3100 against 1678 to 3132); the run still plays, without the smear (see Minors 6). Skip playback (`setBattleSpeed('skip')`): 0 flights, 0 runs, moves of 18 and 105 ms. Fast (held R, set through the API): the looks play compressed (Thunder orb 149 to 151 ms, Darkness beam 60 to 66 ms, run in 66 to 83 ms, a 648 to 661 ms move) with the numeral on the landing.
8. **FF7 Guard Scorpion unchanged**, base against branch, normal speed, `intended`: both a victory in 33 turns and 157 events, identical log digest, result and drops, identical motion-port calls (`ownsWindUp` 50, `open` 34, `close` 33), 80 s and 4,761 against 4,766 frames, no console errors.
9. **Phone, 390x844.** Ch I Thunder (orb across to the upper right, strike, number), Ch IV Darkness (beam, burst, number) and the Ch IV and V runs read at that size on the existing HUD layout (the left edge is Minors 5).
10. **Code.** `npx tsc --noEmit` is clean (2,816 files, strict plus the project's other flags); `node tools/orphans.mjs`: 24 modules orphaned, the same count as main, none of the new ones; the six changed test files pass (82 tests: the five new files' 67 plus `ff7-repair`); the full suite once with `--maxWorkers=3`: 773 files and 11,340 tests pass, 5 files and 41 tests skipped, exit 0, 543 s (no Bahamut "heal-only route" timeout this run). Layering: nothing under `src/battle` or on the presenter side of `motion/` and `FlightFx.ts` imports `three` or the DOM (`BattlePresenterStage.ts` already imported `three` at the base: it is the three.js stage). Every relative import has `.ts`; no `any` or ignore comments added; every new file is under 400 lines (the longest is 281); `BattleCamera.ts` 394 (was 399), `SpellFxLayer.ts` 392. No save key, no setting and no contract file touched; `critic-plan --paths` says DEEP and not the save-data class. Both commits state their case (SKILL TRAVEL both games, RUN-IN FFX-2 only; `research/ffx2-combat-core.md` lines 264 and 266 read and match). The clean merge with current main (which has the 37.1 hotfix) plays the same: Darkness, Gunner, Trigger Happy, Thunder and a Chapter IV run behave as on the branch, including the blocker below. GPU resources over 24 attacks: the branch adds one program (the smear's) and five ghost meshes (bounded by the trail), and geometries and textures grow exactly as on base; planning a run takes 0.8 to 5.4 ms.

### Blocker

1. **RUN-IN walks Chapter IV's party out of formation, one step per attack** (major; `introducedByCandidate` true, `regressionVsLive` true, `inNewFeature` true). Chapter IV, seed 1, Paine and Rikku taking turns with plain Attacks. On origin/main Paine's x stays -0.746 and Rikku's -1.485 over 23 attacks (live and base the same). On the branch Paine's resting x goes -0.758, -0.736, ... -0.251 after 24 attacks (+0.022 an attack) and Rikku's -1.474, -1.546, ... -2.900 after 21 (-0.071 an attack); she ends at -2.972, past Yuna at -2.218, drawn on top of her while Paine stands alone mid-stage (`docs/screenshots/r38-motion-check/drift-ch4-base-vs-branch.jpg`). At about 265 px a world unit Rikku is some 95 px off after five attacks and on Yuna after about ten (Paine moves 6 px an attack, 135 px after 24). The step equals each girl's MAX mix spacing offset (`__pyrefly.fx.snapshot().mix.framing.staging`: Paine dx +0.02, Rikku -0.07, Yuna -0.17, Bahamut scale 1.39 and dx 0.56), and that mix is live in production: the same probe on the live site shows `chapterFraming` on and the same offsets. With the mix's parts switched off (`__pyrefly.fx.mix.parts(false)`) Paine stays at -0.729 over 9 attacks and Rikku at -1.384 over 7: no drift. No other chapter is affected (Ch V, VI, Fallen aeons, Trema, Den of Woe, Ixion and Djose all have dx 0 and held every position), and `plans` and `replans` do not move while she runs. Suspected cause, traced with a setter on `position.x`: `src/engine/fx/mix/staging.ts` lines 95 to 99 treat any foreign write to a figure's x as the stage re-seating it, reset its dx and put the plan's dx back on top; `src/app/screens/BattleScreenRunIn.ts` line 119 takes `home` from `actor.position`, which already holds the dx, and line 151 tweens back to it, so the run's own `moveTo` is that foreign write and each run adds dx once (the log shows the arrival overshooting the planned spot by exactly dx and the end of the run home overshooting `home` by dx). The unit tests drive fake stages without the mix, so they cannot see it. Reproduce: `drift.mjs branch ffx2-bahamut --n=24` (add `--mixoff` for the control). Smallest fix: take `home` and the stop from the seat without dx (an accessor for the mix's dx on the stage port) or hold the mix's staging for a figure while it is out, and add a test that runs N attacks under a staged plan and asserts the home does not move. Acceptance: Paine's and Rikku's x constant to 1e-3 over 24 attacks in Chapter IV with the mix on, and no change elsewhere. If it is not fixed before the merge, RUN-IN has to ship switched off.

### Minors and disclosures

1. **Darkness: the slash lands before the beam.** The `hit` effect's slash plays on Bahamut about 85 to 130 ms before the beam reaches him; the number follows the beam (`docs/screenshots/r38-motion-check/darkness-slash-vs-beam.jpg`). The handoff discloses the cause in numbers (the beam's 180 ms minimum against the slash's 100 ms mark); seen, it reads as a slash on a foe the beam has not reached. Starting the beam earlier or holding the slash would fix it.
2. **Every Dark Knight ability flies as a beam, not only Darkness.** `SkillTravel.ts` has `DARK = /darkness|dark-knight/`, which matches every `x2-dark-knight-*` id, so Drain, Demi and Black Sky (magical) are violet beams; the handoff and the tests say Darkness only. Harmless, ours, unreviewed.
3. **The menu rule's reach.** In Wait mode (the default) a charging spell resolves under the next girl's open menu, so Darkness's beam was suppressed in 5 of 5 casts in my sessions: SKILL TRAVEL shows in FFX-2 only when no menu is open at the blow (D-357, as asked). And a plain Attack never meets an open menu in this flow (it resolves at once), so the run's gate is exercised by the unit tests, not by play.
4. **HUD panels over the runner.** HUD overlays lie over part of her in the first frames of some runs (they already cover the party's place): Trema, Yuna 17 to 22 % under the guide's expanded RULES text; Ch V Paine 22 % under the enemy-intent panel (36 % at home); Ch VI Paine 5 to 15 %; Ixion Rikku 6 %; Ch IV none.
5. **Phone left edge.** During the truck the leftmost girl is clipped for the strike: Ch IV Yuna partly cut, Ch V (a 5.95-unit run, truck 2.98) Yuna out of frame and Rikku half cut for about a second (`docs/screenshots/r38-motion-check/phone-ch5-run-clipped.jpg`, `phone-ch4-run.jpg`).
6. **LOW EFFECTS keeps the run** (movement and truck, no smear, no shot); Paine's attack is 1392 to 1418 ms there against 774 to 790 on base. If LOW EFFECTS should mean no run, it needs the gate.
7. **Cost of attack-heavy play.** The whole-fight table's +2.3 % comes from `intended` tactics, which rarely use a plain Attack (Ch IV: 12 attack beats in 77 turns); a plain Attack itself is 73 % longer in Ch IV (860 to 1500 ms) and about twice as long in Ch V (857 to 1740 ms).
8. **First-run hitch (the brief's "no frame over about 25 ms").** Neither build meets it on this machine. In 15 fresh sessions each of the first Paine attack in Ch IV, every base session has a gap of 30 to 55 ms (median of the worst per session 37 ms) and every branch session one of 33 to 356 ms (median 43 ms); the gaps sit at the camera cut (+325 ms) and the first hit's effect, which both builds share (the hit moves from +700 ms on base to +1,060 ms on the branch with the run). The branch also had four sessions with a larger stall (98, 83, 99 and 356 ms; one move took 1,838 ms) and, in the run's own first 400 ms, gaps of 52 to 99 ms in three sessions against at most 37 ms on base. That points at a first-use cost the smear warm-up does not cover, but base showed 92, 114 and 66 ms gaps in the network-trace sessions run alongside, the three seconds before the move in the same sessions hold 25 to 611 ms gaps, and a network and console trace around the first attack shows no lazily fetched art and no log line on either build, so I could not separate it from the machine's noise. Ch V (5 sessions) worst 29 to 41 ms; first Thunder cast branch 24 to 76 against base 27 to 45; first Darkness branch 23 to 32 against base 22 to 34. A deep review on a quiet machine should look at the first 400 ms of the first run.
9. **Not driven in a browser:** an enemy spell's party HP row timing (the numerals matched in 39 Yunalesca flights; the rows were not sampled), two girls out at once (0 frames with two out in the whole fights, and only Ch IV and VI had runs), the Options page itself (the saved settings it writes were seeded instead).
10. **Small notes.** The four files already over 400 lines grew by 67 lines of wiring (766, 431, 494, 891 now); three zero-length launches in Evrae came from a caster whose side the stage cannot resolve (nothing drawn, no delay); the lane's commits carry `Co-Authored-By: Claude Sonnet 5.5`, not the Opus line the brief named (the builder disclosed it).

### Evidence

Scratch folder above, one file per check: numerals `casts2.mjs` (`res2-*.json`, `log2-*.json`), pixels and stills `casts3.mjs` (`stills-*`), runs `runin.mjs` (`runin-*.json`, `frames-*`), pixel overlap `silhouette.mjs` (`silhouette-*`), menu rule `menu.mjs` (`menu-*.json`, `batchJ-*.log`), drift `drift.mjs`, `driftshot.mjs`, `trace2.mjs`, `mixprobe.mjs` (`drift-*.json`, `mixprobe-*.log`), whole fights `fight.mjs` and the end of a fight `endstate.mjs`, `lastblow.mjs`, `killshot.mjs` (`fight-*.json`, `killshot*-*.log`), fresh-session gaps `hitch2.mjs`, `netfirst.mjs`, planning cost and GPU resources `plancost.mjs`, `leak.mjs`, FF7 `batchH.log`, the merge `batchM.log`. Four stills are committed with this note: `docs/screenshots/r38-motion-check/drift-ch4-base-vs-branch.jpg`, `darkness-slash-vs-beam.jpg`, `phone-ch4-run.jpg` and `phone-ch5-run-clipped.jpg`. Servers started: branch 6840 (PID 69180), base 6841 (PID 12224), merged 6842 (PID 42656); stopped by PID at the end.

## Repair (rule 15, one cycle, 2026-10-04, a Sonnet sub-agent; code `4135e9c8` on `r38-motion`, pushed, not merged, not deployed)

**The CHECK's one major (Blocker 1) is repaired:** RUN-IN no longer walks Chapter IV's party out of formation, and the run is now off under LOW EFFECTS (CHECK Minor 6). Everything else the CHECK measured stands as it was.

**Game case (rule 14):** the drift repair is **FFX-2 only in effect** (only RUN-IN owns a figure's place, and RUN-IN is FFX-2 only; `research/ffx2-combat-core.md` lines 264 and 266, unchanged). The one change in a shared file, the guard in the MAX mix's `Staging`, is shared plumbing (**both** games) and inert unless a figure is owned, which FFX never does (an FFX fight plays byte for byte as before; r38-restage's slots, which are FFX only, keep working: see "Merging"). The LOW EFFECTS gate is **both games** (SKILL TRAVEL, both games, was already off there; RUN-IN, FFX-2 only, now too), decided from BATTLE SPECTACLE's own low tier (`src/engine/fx/c/SpectacleRules.ts`, both games), not from memory.

**critic-plan** (`node tools/critic-plan.mjs --paths <the changed files>`): DEEP, both games, the same obligations as before (a FOCUSED review of the production candidate before a deploy; live verification and the DEEP review on the live build after it); not the save-data class (no setting, no save key, no `SaveData.ts`). The paper preflight of this repair is the "Alternatives weighed" below, written before the fix was built.

### Cause, as traced and reproduced

`Staging.write` (`src/engine/fx/mix/staging.ts`) keeps the MAX mix's spacing share in each figure's own `position.x`, and tells a re-seat by the stage (an arrival, a formation relax) from its own write by comparing x with what it wrote last: any other x is the stage's new seat, so it sets its record of the share to 0, takes the figure's x as the base and writes `base + share`. `RunInMotion` took `home` from `actor.position` (a position that already holds the share) and moved out and back with `PaintedActor.moveTo`, which writes absolute positions every frame. Each frame of the run the staging read that as a re-seat and put the share on top of the tween, and the last frame of the run home (exactly `home`) got the share put on it as well: she ended every run at `home + share`, and the next run took that as its `home`. One share more per run, exactly the CHECK's trace (Rikku's share -0.071, Paine's +0.022; Yuna never runs; z never changes). It is the same class of problem as r38-restage's finding B2 (an absolute x tween read by `Staging.write` as a nudge or a re-seat). The trace was confirmed in the unit test below: on the old code, after the first Attack Paine is 0.022 and Rikku 0.071 off, and the visible stop is a share beyond the planned spot (Rikku out at x 1.944, planned 2.015).

### Alternatives weighed (before building)

1. **Move in seat coordinates** (subtract the share from every x the run writes and let the staging add it back). Right while the rule is "any foreign x is a re-seat"; under r38-restage's rule (an x-only move is a formation nudge) the share would simply not be added and she would end at the bare seat. Correct for one lane and wrong for the other: rejected.
2. **Make the run an offset inside the actor** (like the lunge's `lungeOffset`), so the staging never sees it. Correct in principle, but everything that reads `actor.position` for her (the stand-off plan, the camera, the anchors, the shot's origin) would see her at home during the run, and it reaches into `PaintedActor`: too wide for a repair cycle.
3. **Hold the framing's `commit` while a figure is out.** Covers the commit only: the per-frame `apply` and `release` stay unsafe.
4. **Chosen: an explicit hand-over.** The figure says it is out (`ownPlace`), the staging leaves it alone and keeps its record, and takes it back when it is home. No guess from a position change, so it holds whatever the staging learns to treat as a re-seat; it is the direction r38-restage's B2 itself names ("let the relaxation hand its nudge to `Staging` instead of `Staging` guessing it from a position change").

### The fix

- `src/engine/motion/PlaceOwner.ts` (new, 31 lines, no `three`, no DOM): `ownPlace(figure, on)` and `placeOwned(figure)` over a `WeakSet`.
- `RunInMotion` (`app/screens/BattleScreenRunIn.ts`) owns the girl's place from the moment a run is planned to the end of `close()` (released in a `finally`, from the very object it took, whatever the stage hands out later). `home` is the position she stands at, share and all; the stop is **exactly the planned spot** (it was a share beyond it); the run home ends on `home`.
- `Staging.apply` skips an owned figure and `Staging.release` keeps its record (a re-plan committed while she is out takes the old share off and puts the new one on, once, when she is home). Nothing else in `Staging` changed (`write`, the planners, `stats`).
- LOW EFFECTS: `motion/MotionGate.ts` closes both looks on the `low` tier (below).
- No setting, no save key, no contract file (`docs/CONTRACTS.md` lists none of the touched files; `CONTRACT-CHANGES.md` unchanged). `npx tsc --noEmit` clean; `node tools/orphans.mjs`: 1211 modules, 24 orphaned, the same 24 (the new module is reachable); every touched file under 400 lines (the longest is 167).

### Drift, before and after (Chapter IV, seed 1, Paine and Rikku taking turns with plain Attacks, 28 and 26 each, 1600x900, real GPU)

Her resting x a moment before each Attack (the plan's own captured home is the same number, and z is constant on every build at -1.500 and 0.100); `drift.mjs` (the check's, one change: it waits for N Attacks **per girl**).

| Build | Paine, x before each of 28 Attacks | Rikku, x before each of 26 Attacks |
|---|---|---|
| **the branch before the repair** (1aa4f67b, dev server of a pristine copy) | -0.748 -0.724 -0.701 -0.677 -0.654 -0.631 -0.607 -0.584 -0.560 -0.537 -0.513 -0.490 -0.466 -0.443 -0.420 -0.396 -0.373 -0.349 -0.326 -0.302 -0.279 -0.255 -0.232 -0.209 -0.185 -0.162 -0.138 -0.115 (then -0.091): **+0.0235 an Attack** (steps 0.023 to 0.024), 0.66 in all | -1.483 -1.556 -1.628 -1.701 -1.773 -1.846 -1.918 -1.991 -2.063 -2.136 -2.208 -2.281 -2.353 -2.426 -2.498 -2.571 -2.643 -2.716 -2.788 -2.861 -2.933 -3.005 -3.078 -3.150 -3.223 -3.295 (then -3.368): **-0.0725 an Attack** (steps -0.073 to -0.072), 1.9 in all; level with Yuna (-2.218) by the 11th Attack, past her from the 12th, and 1.2 world units beyond her at the end |
| origin/main (77f0d157; its `src/` is the check's base a6b79313) | -0.754 on all 28 | -1.478 on all 26 |
| the live site (release 37.1, `baileypillon.github.io/pyrefly-reprise/`) | -0.764 on all 28 | -1.469 on all 26 |
| **the repaired branch** (4135e9c8, dev server of `git archive`) | **-0.746 on all 28** (and the same 1 s after each) | **-1.485 on all 26** (and the same 1 s after each) |

Each build starts a hair apart (-0.746, -0.754, -0.764 for Paine): the mix decides its plan on a live frame (r38-restage's check saw the same on origin/main itself), but a session's number never moves except on the unrepaired branch. Yuna (a Gunner, no run) stays at -2.218 on all four and Bahamut at 1.611. The repaired build still runs: 55 runs planned over the 54 Attacks, the plan's captured home equal to the resting x every time, a whole Attack 1481 to 1620 ms (Paine, median 1496) and 1508 to 1554 ms (Rikku, median 1534), the CHECK's 1488 to 1535 ms.

### The other six FFX-2 chapters (the repaired build, `drift.mjs`, seed 1, scaffolded HP)

Every figure holds its place (her x before and after every Attack is one number per girl, and z never moves), every Attack still runs (the plan's captured home equals her resting x each time), and a whole Attack takes what the CHECK measured (Chapter IV 1488 to 1535 ms there, 1481 to 1620 here; Chapter V 1706 to 1769 ms there, 1693 to 1768 here). The positions are the CHECK's own: these chapters have no mix share (dx 0), held before the repair, and hold now.

| FFX-2 chapter | the repaired build: Attacks, her x before and after every one, whole-Attack length | runs planned |
|---|---|---|
| IV Bahamut | Paine 28, x -0.746, 1481 to 1620 ms; Rikku 26, x -1.485, 1508 to 1554 ms | 55 |
| V Vegnagun and Shuyin | Paine 6, x -0.330, 1726 to 1768 ms; Rikku 6, x -1.440, 1693 to 1720 ms | 12 |
| VI Leblanc | Paine 6, x -0.900, 1488 to 1554 ms; Rikku 6, x -1.300, 1496 to 1636 ms | 13 |
| Fallen aeons | Paine 7, x -0.330, 1437 to 1517 ms; Rikku 6, x -1.440, 1457 to 1528 ms | 14 |
| Trema | Yuna 2, x -2.050, 1510 to 1517 ms; Paine 12, x -0.900, 1481 to 1601 ms | 14 |
| Den of Woe | Paine 6, x -0.330, 1477 to 1502 ms; Rikku 6, x -1.440, 1501 to 1516 ms | 12 |
| Ixion and Djose | Paine 6, x -0.330, 1587 to 1598 ms; Rikku 6, x -1.440, 1520 to 1533 ms | 12 |

(Trema's Yuna rarely takes a plain Attack: the run waited for fourteen Attacks in all, `--sum`.) **FFX is untouched:** Chapter I, Tidus, 8 plain Attacks on the repaired build and on origin/main: x -1.310 on all 8 on both, no run, 930 to 946 ms against 934 to 955 ms, and every figure ends where it does on origin/main (Yuna 0.30, Kimahri -0.61, Seymour Flux 3.54).

### The numerals and skill travel still read as the CHECK measured (`casts2.mjs`, the CHECK's scenarios, 3 casts each)

| Cast | the repaired build | the CHECK's branch |
|---|---|---|
| FFX Ch I, Lulu, Thunder on Seymour Flux | orb 424, 434, 435 ms; the numeral on the frame after the spell's strike (16, 18 and 95 ms) and 85 to 87 ms after the shot lands; the HP rows with it; move 2035 to 2039 ms | +1 frame (+16 to +71 ms); +83 to +105 ms; 2020 to 2050 ms |
| FFX-2 Ch IV, Rikku, Darkness on Bahamut | beam 186 to 200 ms; the numeral 1 ms after the landing, 4 to 5 frames (+62 to +85 ms) after the slash (the beam's 180 ms minimum); numerals 325, 462, 521; move 1998 to 3882 ms (ATB overlap) | 0 to +1 ms; +4 to +5 frames (+78 to +90 ms); 1957 to 3887 ms |
| FFX-2 Ch VI, Yuna (Gunner), Attack on Ormi | tracer 132 to 152 ms; the numeral +1 to +6 ms after the landing and one frame (+25 to +28 ms) after the strike; numerals 61, 99, 102; move 883 to 917 ms | +1 to +3 ms; +1 to +2 frames (+20 to +34 ms); 871 to 883 ms |

The engine log digest of each set equals origin/main's, the live site's and the unrepaired branch's (`001073e5fc2684ed` for Thunder, 33 events; `412f65fb2b245ce9` for Darkness, 93; `a2f5e6b1dd91ac4b` for the Gunner, 65): the same events in the same order, the same numerals. (The frame-based columns move by a frame or two with the machine's load; it was at 100 % CPU for all of this.)

### Real key presses only (`keys-drift.mjs`: Enter and the arrows, Chapter IV, Wait mode, each girl answering her own command menu with a plain Attack, Yuna too; two runs per build)

| Build | Paine | Rikku | runs planned |
|---|---|---|---|
| the repaired build, run 1 (198 s, 64 menus) | 15 Attacks: x -0.738 on the first 2, then -0.772 on the other 13 | 12 Attacks: x -1.470 on the first 2, then -1.410 on the other 10 | 27 |
| the repaired build, run 2 (133 s, 43 menus) | 10 Attacks: -0.735 on 2, -0.639 on one, then -0.770 on the other 7 | 8 Attacks: -1.472 on 2, then -1.411 on the other 6 | 18 |
| origin/main, run 1 (124 s, 43 menus) | 10 Attacks: -0.734 on 2, then -0.770 on the other 8 | 8 Attacks: -1.473 on 2, then -1.412 on the other 6 | 0 |
| origin/main, run 2 (124 s, 43 menus) | 10 Attacks: -0.724 on 2, -0.734 on one, then -0.770 on the other 7 | 8 Attacks: -1.463 on 2, then -1.412 on the other 6 | 0 |

The steps are **the MAX mix's own re-plans under the real open menus, measured**: CHAPTER FRAMING checks the live frame against the HUD panels at each menu's opening and re-plans, three times at most. `__pyrefly.fx.snapshot().mix.framing` (sampled as each menu was answered, run 2 of each build) goes plans 1, replans 0 at menu 1, then replans 1 at menu 2, plans 2 at menu 4 (origin/main's: Bahamut x1.20 and +0.49, the girls' shares Yuna -0.15, Rikku -0.05, Paine +0.05), plans 3 and replans 2 at menu 11, plans 4 and replans 3 at menu 12 with **an empty staging** (today's rig, the girls on their bare seats), at the same menus on origin/main (no run, no hand-over) and on the repaired build. Both end in the same figures: Paine -0.770, Rikku -1.411, Yuna -2.05, Bahamut 1.05. The odd single values are the third plan's own shares at rest (Paine's seat -0.772 plus its +0.13 on the repaired build, plus +0.04 on origin/main). Between plans her place is one number across every run: 13 runs and 10 runs after the last plan on the repaired build's first run. (A plan committed while a girl is out lands once, when she is home: that is the unit test's case; whether a commit fell inside a run in these sessions was not sampled.)

### LOW EFFECTS in a browser (the saved setting `lowEffects`, Chapter IV, seed 1, `drift.mjs --settings`)

| Build | runs planned | whole plain Attack | her x |
|---|---|---|---|
| the repaired build | **0** | Paine 773 to 784 ms (median 781), Rikku 769 to 797 ms (778) | -0.753 and -1.479, constant |
| origin/main | 0 | Paine 769 to 786 ms (778), Rikku 765 to 784 ms (777) | -0.750 and -1.481, constant |
| the branch before the repair | 15 (the run still played) | Paine 1406 to 1425 ms (1413), Rikku 1435 to 1452 ms (1442) | walking: -0.746 to -0.556, -1.485 to -1.849 |

Under LOW EFFECTS the repaired build plays origin/main's attack to within a few milliseconds.

### LOW EFFECTS: the run is off there (decision, and why)

**Chosen: LOW EFFECTS plays today's attack** (the house lunge from where she stands: no run, no camera truck, no smear), by the shared motion gate (`motion/MotionGate.ts`: `eyeCandy.tier === 'low'` closes both looks, in both games). Why:

1. **The project's own rule for BATTLE SPECTACLE's low tier is "today's version".** `fx/c/SpectacleRules.ts` gives the `low` tier a streak density of 0, no spell layer and no colour cast ("Low effects keeps today's burst only"); the spell effects' `low` tier "keeps today's bloom and draws nothing new" (`docs/handoff/iter2-spellfx-b.md`); CINEMA LIGHT's fog and depth of field close there and LIVING PAINTINGS keeps two plates. RUN-IN is a BATTLE SPECTACLE sub-look and was the one addition still running on that tier.
2. **SKILL TRAVEL, the sibling look, was already closed there** (`SpellFxLayer.canFly` is false at `low`), and so was the smear: with the shot and the smear gone, the run was a half-look (a camera truck and a girl sliding across the field with no trail).
3. **The cost lands on the player who asked for less.** The run adds 0.6 to 0.9 s to every plain Attack (CHECK Minor 6: 774 to 790 ms on origin/main against 1392 to 1418 ms with the run under LOW EFFECTS), for a setting that exists for slow machines and for the lighter game.
4. **REDUCE MOTION already closed it** (the comfort path); LOW EFFECTS is the density path, and BATTLE SPECTACLE's additions go off on both. The phone tier keeps both looks (60 % trail), as the CHECK measured.

No new setting, no save key. If Bailey would rather keep the run under LOW EFFECTS (it is a short run and a camera move, not a particle), that is the one line `if (eyeCandy.tier === 'low') return false;` in `motionAllowed`.

### Merging with r38-restage (the other lane in `staging.ts`)

`git merge-tree --write-tree` of `4135e9c8` with `origin/r38-restage` (24181cb1 and its check): **one textual conflict, `Staging.release()` in `src/engine/fx/mix/staging.ts`** (restage adds the fourth argument to `write`); `apply` merges clean. The resolution, tested: keep this branch's loop and pass `null`:

```ts
    for (const a of [...this.recs.keys()]) {
      if (placeOwned(a)) continue; // (the comment as in this branch)
      this.write(a, 1, 0, null);
      this.recs.delete(a);
    }
```

On that resolved tree, in scratch (`D:/Tools/pyrefly-scratch/2026-10-04/motion-repair/merged-src`, the real restage `Staging` and `stageTable.ts`): restage's own `fx-mix-stage-table.test.ts` passes (23, including its 4000-operation "matches the old write" test, so a fight with nothing owned is bit-identical to before), and so do `r38-run-in-staging` (6), `r38-place-owner` (9), `r38-run-in` (13) and `r38-skill-travel` (20); a table-active variant of the run-in test (party shifted -0.5 world x and +0.2 z, fiends +0.5 and -0.3, as restage's own test writes them; 30 Attacks by each girl and an alternating 30 rounds) holds every place within 0.001. An honest note on that case: with the table active and a run along her own lane (every planned stop today: `dz` is 0 in all 37 plans), restage's rule already reads the run's x-only writes as a formation nudge, so that case passes **without** the hold too (checked: the same variant with both hold lines removed passes). What the hold adds under a table is a stop with a change of depth (a z write is a re-seat there: the control in `r38-place-owner.test.ts` walks a girl 0.3 world units or more per run), and Chapter IV, which has no row and so no slots, is the case that failed. The branch also merges clean into the current `origin/main` (77f0d157; `git merge-tree`, no conflict).

### Tests

`npx tsc --noEmit` clean (exit 0). `node tools/orphans.mjs`: 1211 modules, 1187 reachable, **24 orphaned, the same 24** (`PlaceOwner.ts` is reached from `staging.ts` and `BattleScreenRunIn.ts`).

- **`tests/unit/r38-run-in-staging.test.ts` (new, 6): fails on the old code.** The real `RunInMotion`, the real `Staging` and a `PaintedActor`-style tween actor (`moveTo` is its code) over the fake stage the other RUN-IN tests use, in the game's frame order, with Chapter IV's real shares (Paine +0.022, Rikku -0.071, Yuna -0.17, Bahamut x1.39 and +0.56): the control (no run: seat plus share, forever); 30 Attacks by Paine and 30 by Rikku, every figure's x, y and z within 0.001 of origin/main's after each one (the old code fails at Attack 1: Paine 0.022000, Rikku 0.071000); 30 rounds of Paine, Rikku and Yuna (a Gunner, no run); the stop is the planned spot; a re-plan that lands while she is out puts the new share on once. Run against the pristine copy of `1aa4f67b`: 5 of the 6 fail.
- **`tests/unit/r38-place-owner.test.ts` (new, 9):** the ownership module; the real `Staging` (a foreign x is still a re-seat; an owned figure is left alone and the plan reaches it when it is given back; `release` keeps its record; a figure with no record); r38-restage's rule (`write` copied verbatim) with the hand-over, 30 runs on her own lane and 30 with a change of depth, and the two controls (a depth change without the hand-over walks her; with no slots at all, Chapter IV's case, even an x-only run does).
- **LOW EFFECTS:** `r38-run-in.test.ts` (13) plays today's attack, with no run and no truck, under LOW EFFECTS, as under REDUCE MOTION and with the look switched off; `r38-skill-travel.test.ts` (20) shows the gate closing both looks, in both games, on the low tier and keeping them on the phone tier. Both fail on the old gate.
- **The full suite, once, `vitest run --maxWorkers=3`:** 780 test files (774 passed, 1 failed, 5 skipped); 11,398 tests (11,355 passed, 1 failed, 41 skipped, 1 todo), 912 s with the machine at 100 % CPU from other agents. The one failure is the known load timeout: `strategy-ffx2-bahamut` "heal-only route (no Shell, no Breaks) clears Mega Flare" took 15,879 ms against the 15 s limit; **re-run alone it passes** (19 tests, 11.4 s). That is 11,340 + the 16 tests added here.

### Still open (not touched by this repair)

The CHECK's other minors stand as written: 1 (Darkness: the slash lands before the beam), 2 (every Dark Knight ability flies as a beam), 3 (the menu rule's reach, by design), 4 (HUD panels over the runner), 5 (the phone's left edge during the truck), 7 (the cost of attack-heavy play), 8 (the first-run hitch, to be judged on a quiet machine), 9 (not driven in a browser) and 10. **6 (LOW EFFECTS kept the run) is resolved here.** The build still owes what it owed: a FOCUSED review of the production candidate before any deploy, live verification and the DEEP review on the live build after it. The stand-off numbers of section 5 were measured on the planned stops; with this repair the visible stop is exactly the planned one (the unit test shows the old code leaving Rikku 0.071 world units off it, her share).

Two disclosures. **(1)** The Co-Authored-By line on this repair's commits is `Claude Sonnet 5.5` (the model that wrote them and what the harness asked for); the brief said `Opus 5.5`, as it did for the build (see section 10). **(2)** My first dev-server start (two pristine copies served through the junctioned `node_modules`) made Vite re-optimize its dependency cache in `D:/Final Fantasy/node_modules/.vite/deps` at 01:40:35 (Vite reported "lockfile has changed"; my copies carried no lockfile); I stopped both servers within seconds and gave every later server its own `cacheDir`. The cache is complete and valid (content-hashed file names; only `_metadata.json`'s hashes changed), so other agents' servers keep working, but a dev page of theirs that was open at that moment may want one reload.

### Evidence

Scratch: `D:/Tools/pyrefly-scratch/2026-10-04/motion-repair/`. Scripts: the CHECK's `drift.mjs`, `casts2.mjs`, `scenarios.mjs`, `lib.mjs`, `lib2.mjs`, `driftshot.mjs` (copied; `drift.mjs` waits for N Attacks per girl, prints move lengths and the run count, takes `--settings`, `--tag` and `--sum`), and `keys-drift.mjs` (new: real Enter and arrow presses only). Logs: `drift-{before,base,live,after}-ch4.log`, `drift-after-{ch5,ch6,fallen,trema,den,ixion}.log`, `drift-{after,before,base}-ch4-low.log`, `keys-{after,base}-wait.log` and `keys-{after,base}-frame.log` (with the framing counters), `drift-{after,base}-ffx-ch1.log`, `casts-after-*.log` and `res2-after-*.json`, `suite-full.log`, the merge in `merged-src/`. Servers: pristine copy of `1aa4f67b` on 6910 (PID 24980), `origin/main` on 6911 (PID 49600), `git archive` of `4135e9c8` on 6912 (PID 44820), each with its own cache, no file watching; all three stopped by PID when the proofs were done (6911 and 6912 were started once more, PIDs 85860 and 86984, for the framing-counter run, and stopped by PID after it); the live site needed none. Headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`), one browser at a time, never Claude-in-Chrome or the built-in pane.

## Re-check (merged) (critic, a Sonnet sub-agent, 2026-10-04; `r38-motion` 1d2715a5 merged with `r38-restage` 9fc73fa9 on `origin/main` 77f0d157; I built neither)

**Verdict for this lane: PASS.** On the scratch merge the run-in no longer moves anybody: in Chapter IV, 28 plain Attacks by Paine and 26 by Rikku leave each girl's resting x at one number before and after every Attack (Paine -0.753, Rikku -1.478; spread 0.000 at the three decimals read; origin/main -0.752 and -1.480, live -0.764 and -1.469), all 54 runs were planned and played (a whole Attack 1.48 to 1.59 s against 0.85 to 0.97 s on origin/main), and after play stopped all four figures stood on the place they held before the first Attack (distance 0.000). LOW EFFECTS plays today's Attack (0 runs; 759 to 784 ms, the same as origin/main under LOW EFFECTS). The menu rule holds with real keys in Wait and in Active (0 shots and 0 runs under an open menu; 5 of 5 Attacks with no menu ran). Numeral timing and shot lengths are what the CHECK measured, and the battle-log digests equal origin/main's and live's. No blocker. Game case (rule 14): SKILL TRAVEL both games and RUN-IN FFX-2 only (unchanged); the merge itself is shared plumbing, so both games were run (FFX Chapters I, II, III, VIII, IX, X; FFX-2 IV, V, XI, XV).

**What this is.** The two repaired lanes, `r38-motion` (1d2715a5) and `r38-restage` (9fc73fa9), checked together on one scratch merge by a critic who built neither (a Sonnet sub-agent, 2026-10-04). The brief: `git merge-tree` shows one conflict, in `Staging.release()`, in `src/engine/fx/mix/staging.ts` (the motion lane's hand-over against the restage lane's write rule); build the merge, run it against the live site and origin/main, and say per lane whether it passes.

**The merge (scratch, never pushed).** Local branch `r38-mr-scratch` in `D:/pyrefly-fixes-r28` (not pushed; no upstream), from `origin/main` 77f0d157: `git merge --no-ff origin/r38-restage` (clean, 191ac20a), then `git merge --no-ff origin/r38-motion` (conflict in one file, `staging.ts`, three hunks, resolved as below; 363353d3). The two lanes share no other file. The other order conflicts in the same single file (`git merge-tree --write-tree origin/r38-motion origin/r38-restage`, and motion first onto main then restage), the same text with the two sides swapped.

**The conflict, hunk by hunk, as resolved** (the working tree is CRLF; a script kept the file's own line endings):

1. Imports: keep both (restage's hold flag, motion's hand-over).
```ts
import { STAGE_HOLD_KEY } from '../../StageRelax.ts';
import { placeOwned } from '../../motion/PlaceOwner.ts';
```
2. The class header comment: restage's first line (its `write` no longer reads a relaxation nudge) plus motion's two added lines.
```ts
 * by the stage (an arrival, a spot) is respected and the mix's share is put back on top of it.
 * A figure that is out on a run of its own (`motion/PlaceOwner.ts`, RUN-IN) is no re-seat: it is left alone, record
 * and all, until it is home (r38-motion repair; before it, every run added the share to the girl's home once more).
```
3. `Staging.release()`: motion's loop (copy of the keys, skip an owned figure, delete the record) with restage's fourth argument to `write` (`null`: no slot share).
```ts
  release(): void {
    for (const a of [...this.recs.keys()]) {
      // Out on a run: her position holds none of the share now, and she returns to the place that does. Keep the record, so the
      // next write takes the old share off and puts the new plan's on, once.
      if (placeOwned(a)) continue;
      this.write(a, 1, 0, null);
      this.recs.delete(a);
    }
    this.plan.clear();
  }
```
`Staging.apply` merges without a conflict: motion's `if (placeOwned(a)) continue;` line sits above restage's `this.write(a, ..., side ? shiftOf(side, a) : null)`. The merged file is `origin/r38-restage`'s `staging.ts` plus exactly motion's additions (the import, the two comment lines, the guard line in `apply`, and the changed `release` loop); nothing of restage's (`hold`, `Side`, the slots, the per-axis `write`, `stats`) is lost. The text is also in `D:/Tools/pyrefly-scratch/2026-10-04/mr-recheck/resolution.md`.

**What was run, and against what.** Production bundles of both, served under the production base path `/pyrefly-reprise/` by a small static server on ports 6930 (merge) and 6931 (origin/main), with the art, audio and fx files read from the main tree's `public/`; the live site (release 37.1, Pages) as the third subject. The origin/main bundle built here is **byte for byte the live bundle** (`index-DhiL5vEz.js`, `index-B8jtRvzT.css` and both workers compare equal with `cmp`; the only difference in `index.html` is the title key art's preload URL, which a build whose public folder holds no art leaves without the base prefix, and the scratch server answers it from the same file; origin/main's `src/`, `public/`, `tools/` and `tests/` are identical to release 37.1's, 77f0d157 being four docs commits on f4244e1f), the merge's bundle is `index-DnmlSiuT.js` with the same CSS, and the local `public/` matches release 37.1's artifact manifest (`critic/artifacts/f4244e1f.json`, sha256) on 1,704 of the 1,709 art, fx, audio and font files (the five that differ are the OFL.txt licence texts, shipped with CRLF line endings and held here with LF: the same bytes otherwise; the seven bundle files are compared above). So positions read on the merge, on origin/main and on live are like with like (the earlier checks read their baselines on dev servers, where the first menu can open before the camera's plan; the production bundle does not do that, see below). Headless Chromium with the real GPU (`PYREFLY_BROWSER=gpu`, Playwright from node, real key presses wherever a person acts, seed 1 unless a table says so), one browser at a time, never the Chrome extension or the browser pane. Scripts and raw runs: `D:/Tools/pyrefly-scratch/2026-10-04/mr-recheck/` (`mo/` the motion lane's harness, `re/` the restage lane's, both copied from the earlier checks and re-pointed; `vt/` a unit test of the real merged `Staging`). Servers started: 6930 (PID 75664) and 6931 (PID 65152), stopped by PID at the end.

### 1. The drift is gone on the merge (Chapter IV, seed 1, 1600x900, production bundles)

Paine and Rikku take turns with plain Attacks (the CHECK's `drift.mjs`, one change: N per girl; party 99,999 HP and enemy agility 1, set from the strategy only). Her world x and z are read on the page clock 150 ms before each Attack starts and 1000 ms after it ends; the run's plan logs the home it captured.

| build | Paine: Attacks, x before every Attack / after | Rikku: Attacks, x before / after | runs planned | a whole plain Attack |
|---|---|---|---|---|
| **merge** | 28, **-0.753 on all 28** / **-0.753 on all 28**, z -1.500 | 26, **-1.478 on all 26** / **-1.478 on all 26**, z 0.100 | **54 of 54** (plan home equal to the resting x every time) | Paine 1478 to 1594 ms (median 1494), Rikku 1515 to 1569 (1525) |
| origin/main | 28, -0.752 / -0.752 | 26, -1.480 / -1.480 | 0 | Paine 854 to 967 (862), Rikku 849 to 874 (859) |
| live (37.1) | 28, -0.764 / -0.764 | 26, -1.469 / -1.469 | 0 | Paine 855 to 948 (866), Rikku 849 to 898 (862) |

The three builds start a hair apart (the mix decides its plan on a live frame; each session's number never moves). Yuna (a Gunner, no run) stays at -2.218 and Bahamut at 1.611 on all three. **No figure is left at a target:** auto-play switched off, the battle idles behind the next command menu, six seconds later every staged figure is read: merge and origin/main both give Yuna (-2.218, 1.45), Rikku (-1.478 / -1.480, 0.1), Paine (-0.753 / -0.752, -1.5), Bahamut (1.611, -5.8), each 0.000 from where it stood before the first Attack. `runin.mjs` on the merge, Chapter IV, eight Attacks (Paine five, Rikku three): every one ran (2.1 and 2.8 world units), in 232 to 250 ms and home in 199 to 217 ms, **home error 0 every time**, nobody covered at the stop, her feet 78 to 141 px below the fiend's bottom edge, the stop 4.3 and 5.9 units in front of the fiend's depth (rule: at least 1.2), never out of frame, the camera truck up to 1.40 and exactly 0 at the end, no menu frame during a run; whole moves 1481 to 1534 ms. Chapter V (six Attacks on the tail link): all ran (5.95 and 5.25 units), home error 0, truck 2.98 back to 0, her feet 27 to 39 px above the tail's bottom edge (the tail wraps the party: the CHECK's disclosed exception), Paine 21 to 22 percent under the enemy-intent panel (the CHECK's minor 4).

**With real key presses** (`keys-drift.mjs`: Enter and the arrows, Chapter IV, Wait mode, each girl answering her own menu with a plain Attack, about 2.5 minutes, 54 and 53 menus): merge, 23 Attacks, 23 runs: Paine -0.738, -0.738, then **-0.642 on the 11 Attacks after the last plan**, Rikku -1.470, -1.482, then -1.374 on eight; origin/main, 22 Attacks, no runs: Paine -0.735, -0.735, -0.639, then -0.771 on nine, Rikku -1.472, -1.472, then -1.411 on eight. The steps are **the MAX mix's own re-plans under the real open menus** (`__pyrefly.fx.snapshot().mix.framing`: plans 2, 3 and 4 at menus 4, 10 and 11 on the merge, at menus 4, 11 and 12 on origin/main; the last plan is today's bare rig on origin/main and a k=1 plan with shares on the merge: the plan decides on a live frame and flips between outcomes on both builds); between plans her place is one number across every run. Active mode, same procedure: merge 154 s, 51 menus, 20 Attacks and 20 runs, Paine -0.770 on all ten (origin/main: -0.738, then -0.773 on nine), Rikku -1.472, then -1.411 on nine (origin/main -1.470, then -1.409); both builds re-plan at menus 4 to 6 and end on today's bare rig, the same places.

### 2. The run still plays, and LOW EFFECTS plays today's attack

`drift2.mjs` with the saved setting `lowEffects` (seeded before boot): merge, 12 Paine and 10 Rikku Attacks: **0 runs planned**, a whole Attack 759 to 784 ms (median 776 and 778); origin/main under the same setting: 0 runs, 758 to 784 ms (774 and 778). Under the default tier the run plays 54 of 54 (above). The resting layout under LOW EFFECTS flips between two plan outcomes (BOSS SCALE 1 or 0.45: Paine -0.75 or -0.59) on **both** builds (origin/main 2 of 6 sessions at 0.45, the merge 1 of 6), so a layout difference between two LOW EFFECTS sessions is the mix's own flip, not the merge; under the default tier every session read (five on each build) gave scale 1.

### 3. The menu rule (real keys, `menu.mjs`, Chapter IV)

| mode | seconds, menus | eligible actions | under an open menu (at the start or at the blow) | with no menu open | looks started with a menu open / a menu opened during a look |
|---|---|---|---|---|---|
| Wait | 216, 21 | 10 | 5 (Rikku's Darkness): **0 flights, 0 runs** | 5 (Paine's Attack): 0 flights, **5 runs** | 0 / 0 |
| Active | 213, 21 | 10 | 5: **0 flights, 0 runs** | 5: 0 flights, **5 runs** | 0 / 0 |

(The Active run's last 25 seconds overlapped the start of the next browser's page load; its summary is the same as Wait's.)

### 4. Numerals, shots and digests (`casts2.mjs`, three casts each, merge against origin/main and live)

| cast | digest of the log prefix | merge: shot, numeral against the landing, numeral against the strike | origin/main and live: numeral against the strike | whole move, merge / origin/main / live |
|---|---|---|---|---|
| FFX Ch I, Lulu, Thunder on Flux | `001073e5fc2684ed`, 33 events, **equal on all three**; numerals 790, 754, 778 | orb 428 to 439 ms; +84 to +91 ms (six frames); one frame after the strike (16 to 100 ms) | 30 frames early (-498 to -514 ms) | 2029 to 2058 / 2032 to 2057 / 2033 to 2061 ms |
| FFX-2 Ch IV, Rikku, Darkness on Bahamut | `412f65fb2b245ce9`, 93 events, **equal**; numerals 325, 462, 521 | beam 179 to 196 ms; **0 to +1 ms** (the landing frame); five frames (85 ms) after the slash (the beam's 180 ms minimum against a 100 ms mark) | six frames early (-96 to -99 ms, live -136 once) | 3853, 3117, 1969 / 3827, 3047, 1896 / 3795, 3034, 1891 ms |
| FFX-2 Ch VI, Yuna (Gunner), Attack on Ormi | `a2f5e6b1dd91ac4b`, 65 events, **equal**; numerals 61, 99, 102 | tracer 117 to 134 ms; 0 to +2 ms; one or two frames after the strike (19 to 34 ms) | three to six frames early (-70 to -101 ms) | 855 to 884 / 860 to 866 / 855 to 869 ms |

These are the CHECK's and the repair's digests and numbers, to the frame. **SKILL TRAVEL in a staged chapter** (`flightshot.mjs`: a CDP screencast of every compositor frame and a hook on the stage's shot launch; Chapter II, where the restage lane's slots move the figures): Yunalesca's orbs fly 140 ms from her place (3.56, -4.45) to Auron's (1.2, -0.71) and to Tidus's (0, 1.84), the frames at 25, 50 and 75 percent of each flight within 11 ms of their mark and the orb in the air between her hand and the target (`docs/screenshots/r38-mr-recheck/skill-travel-merged-ch2-orb.jpg`); Chapter IV's Darkness beams grow from Rikku to Bahamut in 180 ms (`skill-travel-merged-ch4-beam.jpg`). The chapter's own tactics send no party shot in Chapter II (none in seven minutes), so that side is not shown. **Whole fights** (`fight.mjs`: each chapter's own `intended` tactics at fast speed, seed 1, the digest of every link's battle log with the ATB snapshots, merge against origin/main): FFX Chapter I (245 events), Chapter II (1,107 events, 178 turns, victory), Chapter III link 1 (1,292 events, 203 turns), FFX-2 Chapter IV (2,042 events, 77 turns, 301,572 ticks, victory) and Chapter V link 1 (556 events, 53 turns): **the digests are identical in all five, so are the outcomes and the numerals shown** (Chapter II 191, Chapter IV 90, in the same order); the merge sends 39 enemy orbs in Chapter II, 25 party orbs in Chapter III, 12 party beams and plays 3 runs in Chapter IV, 37 shots in Chapter V (none zero-length), origin/main none; 0 console errors. The presentation changes nothing the engine sees.

### 4b. The other six FFX-2 chapters keep their places on the merge (`drift2.mjs`, 6 plain Attacks per girl, seed 1)

| chapter | her x before and after every Attack | Attacks | runs planned | a whole Attack | settled: distance from the rest before the first Attack |
|---|---|---|---|---|---|
| V Vegnagun and Shuyin | Paine -0.330, Rikku -1.440 (spread 0.000) | 6 and 6 | 6 and 6 | 1735 to 1749 / 1686 to 1734 ms | 0.000 for all four figures |
| VI Leblanc | -0.900, -1.300 | 6 and 6 | 6 and 6 | 1501 to 1560 / 1498 to 1628 | 0.000 for all six |
| XI Fallen Aeons | -0.330, -1.440 | 7 and 6 | 7 and 6 | 1422 to 1503 / 1454 to 1517 | 0.000 for all four |
| XIII Trema | Yuna -2.050, Paine -0.900 | 2 and 22 | 24 of 24 | Yuna 1507 to 1519, Paine 1482 to 1593 | 0.000 for all four |
| XV Den of Woe | -0.330, -1.440 | 6 and 6 | 6 and 6 | 1481 to 1499 / 1493 to 1544 | 0.000 for all four |
| XVI Ixion and Djose | -0.330, -1.440 | 6 and 6 | 6 and 6 | 1556 to 1602 / 1511 to 1534 | 0.000 for all four |

(The constants are the repair's: Chapter V -0.330 and -1.440, VI -0.900 and -1.300, Fallen Aeons -0.330 and -1.440.) FFX untouched: no run, no truck, no flight from an attack; the whole fights above carry the same logs.

### 5. Code on the merge

`npx tsc --noEmit`: exit 0, 2,827 files, no output. Targeted vitest on the merge, 32 files, **358 of 358**: this lane's `r38-skill-travel` (20), `r38-flight-fx` (17), `r38-stand-off` (7), `r38-run-in` (13), `r38-stage-motion` (11), `r38-run-in-staging` (6, against the merged `Staging`), `r38-place-owner` (9), `ff7-repair` (15), the other `fx-mix-*` files and the files importing the touched modules (`camera-*`, `comfort-presenters`, `ff7-*`, `presenter-settle-for-menu`, `spellfx-specials`, ...), and the restage lane's `fx-mix-stage-table` (27), `fx-mix-stage-hold` (12), `fx-mix-roster` (7). `node tools/orphans.mjs`: 1,214 modules, 1,190 reachable, **24 orphaned, the same 24**. Files under 400 lines: every new file; `staging.ts` 215, `BattleCamera.ts` 394, `SpellFxLayer.ts` 392, **`framing.ts` 398** (two lines of headroom: the next change there must extract first); the four files that were already over 400 on origin/main took this lane's wiring (`BattlePresenter.ts` 753 to 766, `BattlePresenterEvents.ts` 426 to 431, `BattlePresenterPorts.ts` 475 to 494, `BattlePresenterStage.ts` 861 to 891). **The full suite, once, `vitest run --maxWorkers=3`, on the merge:** 785 test files (779 passed, 5 skipped, 1 failed) and 11,477 tests (11,434 passed, 41 skipped, 1 todo, 1 failed), 660 s with other agents' work on the machine. The one failure is the known load timeout, `strategy-ffx2-bahamut` "heal-only route (no Shell, no Breaks) clears Mega Flare" (17.1 s against the 15 s limit; an engine-only test that neither lane touches); re-run alone it still takes 15.9 s on this loaded machine, and with `--testTimeout=90000` the file passes, 19 of 19 (that test 18.7 s). The other two known load timeouts (`sin-fins-core-bench`, `ui-pause-stack`) did not fail.

A unit test of the **real merged `Staging`** written for this check (scratch, `vt/mr-combined.test.ts`, not in the repo) drives plain figures with the chapter's slots **active** (a combination no shipped fight has: slots are FFX only, the run is FFX-2 only, but it is exactly the code the conflict touched): the slots land once and hold; 30 runs out and back along her own lane and 30 with a change of depth (absolute x and z tweens, the way `PaintedActor.moveTo` writes) leave every figure within 0.001; without the hand-over a depth change walks her (the control); a figure that arrives while another is out stands on its slot from its first write and never steps; `release()` puts a figure that is home back on the stage's own seat and keeps an owned figure's record so the share goes on once when she is home. 6 of 6 pass; two wrong resolutions fail it (restage's `release` loop taken verbatim: the release-while-owned test fails; no `placeOwned` guard in `apply`: four fail). The release path ran in a browser (`release.mjs`: `__pyrefly.fx.mix.parts(false)` releases the staging, `parts(true)` brings it back): Chapter II on the merge, on: Tidus (-0.001, 1.837), Yuna (-1.001, 0.787), Auron (1.199, -0.713), Yunalesca (3.565, -4.446); off: the stage's own seats (0.1, 1.8), (-0.9, 0.75), (1.3, -0.75), (2.8, -4), **the places origin/main stands them in**; on again: the first reading to 0.000. Chapter IV on the merge, off: Yuna -2.05, Rikku -1.406, Paine -0.776, Bahamut 1.05 (origin/main's off: -2.05, -1.406, -0.777, 1.05); on again within 0.002 (the plan re-decides; origin/main within 0.001 to 0.004). Chapter III: identical on both builds.

### Disclosures (carry into the release note)

1. **The CHECK's other minors stand as the repair wrote them** (1 Darkness: the slash lands before the beam; 2 every Dark Knight ability flies as a beam; 3 the menu rule's reach; 4 HUD panels over the runner; 5 the phone's left edge during the truck; 7 the cost of attack-heavy play; 8 the first-run hitch; 9 not driven in a browser; 10 small notes). This re-check re-measured items 3 and 4 only; the first-run hitch (8) needs a quiet machine and a deep review on the live build.
2. **The party's resting x steps at the mix's own re-plans** when real menus open (a few hundredths of a world unit, three or four times in the first minute), on origin/main as well; it is not drift, and it is a number the live-frame plan decides (Chapter IV's outcome also flips between two layouts under LOW EFFECTS and, on the phone, between Paine -0.65 and -0.60).
3. The Co-Authored-By line of the lane's commits says Claude Sonnet 5.5, not the Opus line the brief named (disclosed by the builder and the repair; mine says Sonnet 5.5 too).
4. Still owed, as for any build of this class: the focused review of the production candidate before a deploy, live verification and the deep review on the live build after it (`critic-plan`: DEEP, both games).

### Evidence

Stills in `docs/screenshots/r38-mr-recheck/`: `ch4-rest-before-and-after-54-attacks.jpg` (Chapter IV at the first command menu and again after 54 plain Attacks, origin/main above, the merge below: the same places), `skill-travel-merged-ch4-beam.jpg` and `skill-travel-merged-ch2-orb.jpg` (screencast frames of a shot at 25, 50 and 75 percent of its flight). Scratch, not in the repo: `D:/Tools/pyrefly-scratch/2026-10-04/mr-recheck/` (`mo/` scripts and `out-mo/` raw runs, `logs/` every step's output, `notes.md`, `resolution.md`, `vt/` the combined unit test and its two mutants). Servers started and stopped by PID: ports 6930 (PID 75664) and 6931 (PID 65152). Two junctions made in the scratch folder (`main-src/node_modules` and `vt/node_modules`, both to `D:/Final Fantasy/node_modules`) must be unlinked with `rmdir` (no /s) before any removal of that folder.
