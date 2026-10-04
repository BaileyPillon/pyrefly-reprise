# r38-motion: SKILL TRAVEL (both games) and RUN-IN (FFX-2 only), the production port of the Visual Options prototype

**Branch:** `r38-motion` (from `origin/main` `4b7adea6`), pushed, **not merged, not deployed**. The code and tests are `033888ee`; this note and the stills are the commit after it (the branch head).
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
