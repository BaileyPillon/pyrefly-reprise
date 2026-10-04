# r38-restage: Chapter II staged from a per-chapter table, Chapter III written and switched off (PR-0310); Natus option N left off

Branch `r38-restage` (worktree `D:/pyrefly-fixes-r28`), from `origin/main` b96b5f4d. `src/`, `public/` and `tools/` are identical between b96b5f4d,
origin/main 3b1ed60f and live release 37 (main cd9dbbb0, bundle `BGBDEn_P`, read from the live page on 2026-10-03): every commit since release 37
is docs. Not merged, not deployed, not reviewed. The decision is D-353, ask 4 of the Visual Options page (Bailey, 2026-10-03 ~14:42 EDT: "I'll go
with all your recommendations thank you <3").

**Status after the repair (2026-10-04): see "Repair" at the end. Chapter III is switched OFF (`CHAPTER_III_STAGED = false` in `stageTable.ts`); Chapter II ships alone.** The independent check failed Chapter III on two blockers (B1: its first menu was clear on seed 1 only; B2: a later arrival snapped into its slot) and passed Chapter II. B2 is repaired for every table fight (a later figure is in the mix's list the frame it is added, and a write to an axis the mix did not make is read as the stage's). B1's cause is traced and removed (the fiends the table stands are held against the formation relaxation, and Chapter III's row has a move per fiend), but the formation that clears the party on every seed is a bigger move than the approved picture (boss +3.0 right, not +1.45) and still touches during part of the camera's drift when Yuna is first, so by the brief's stop rule the Chapter III row stays off behind one line until Bailey has seen the stills. The readings below ("In one screen", "Proof", "The table", "What this costs") are the builder's first cut on seed 1 and stand for Chapter II; for Chapter III the Repair section's numbers replace them. **Re-checked merged with `r38-motion` by a second critic on one scratch merge (2026-10-04): PASS for Chapter II alone, no blocker (see "Re-check (merged)" at the end).**

**Game case: FFX only** (Chapter II Yunalesca, Chapter III Braska's Final Aeon). Why (rule 14): where FFX seats the party and the fiends on screen is
`[absence]` in `research/battle-camera-perspectives.md` (no source says which side the FFX party stands on), our slot tables are our own layout
(`PARTY_SLOTS` / `ENEMY_SLOTS` in `src/scenes/zanarkand-dome.ts` and `dreams-end.ts`, `[ours]`), and FFX has fixed formations and no positional rule
(`research/ffx-vs-ffx2-presentation.md` section 9 and its opening: FFX has fixed formations and no positional rule; positional back-attacks are FFX-2 only), so
moving a slot changes the picture and never a rule. FFX-2 has free battle positions (a hit from behind does double damage): not touched (`standFor`
answers `game === 'ffx'` only). The upright phone (390x844) is not touched (`onPhone()`; pixel-compared below). Shared plumbing: `Staging`,
`Framing` and the report are shared with FFX-2; for a fight with no row they behave as before (proved below), so the critic plan's "games: both" is the
path list, not the behaviour.

## In one screen

First menu, three runs each, headless GPU, real keys. "Rest gap" is the product's own metric (`plate.restGap`, px; positive = nobody stands inside a
fiend's painted shape; it saturates at +1, so the painted columns say how far apart they really stand).

| | 1600x900 | 2000x1012 | 2560x1440 | 2560x1080 |
|---|---|---|---|---|
| **II** rest gap: live (release 37) | -122 | -129 | -197 | -145 |
| **II** rest gap: origin/main (the first menu opens before its plan; frame reading) | -117 | -129 | -181 | -138 |
| **II** rest gap: branch | **+1** | **+1** | **+1** | **+1** |
| **II** painted overlap px2: live / branch | 1,725 / **0** | 1,951 / **0** | 4,791 / **0** | 2,561 / **0** |
| **II** closest painted approach, branch (px) | 27 | 26 | 39 | 29 |
| **III** rest gap: live (release 37) | -43 | -69 | -70 | -53 |
| **III** rest gap: origin/main (frame reading) | +1 | +1 | +1 | +1 |
| **III** rest gap: branch | **+1** | **+1** | **+1** | **+1** |
| **III** painted overlap px2: live / origin/main / branch | 1,877 / 186 / **0** | 3,066 / 224 / **0** | 4,812 / 405 / **0** | 2,489 / 235 / **0** |
| **III** closest painted approach, branch (px) | 27 | 21 | 35 | 20 |

- **Done:** at the first menu the party and the fiends do not touch, at the four sizes, every run (24 of 24), with a margin of 20 to 39 painted px; over a
  40 s drift window Chapter II never touches (0 of 320 frames), Chapter III touches in 100 of 283 frames by at most 396 px2 (the product's own gap goes negative in 33 of
  them; live: overlap in every one of its 588 frames, median 1,953 to 6,516 px2). The advisor card covers 0 px2 of any fiend in every cell. No plate edge or void is new. FFX-2, Natus, Yojimbo, the
  phone: unchanged.
- **Not the whole story:** at Chapter III's later menus Yuna's ready staff still brushes the boss (467 to 1,227 px2 at menu 3, live 1,488 to 5,036);
  Chapter III is not cleared at aspect 1.6 (1440x900, not one of the four sizes); later links and Yunalesca's later forms are not tuned.
- **Costs:** the fiends draw 2 to 8 percent smaller; the right pagoda's box sits 57 to 70 percent under the turn-order rail's panel (live 30 to 31 at three sizes, 56 at
  2560x1080 where the branch has 61);
  Chapter III 2560x1080 menus 2 and 3 put a party member 38 to 50 percent under a panel (live 17 to 33); an attacker's fixed 1.4-unit lunge now
  stops short of the fiend. Details below.
- **Natus option N: left off** (D-353: "waits until it is deterministic"): not the same result in 10 of 10 runs even without any change; section below.
- **For Bailey:** four points at the end; the first reaches past these two chapters (the camera's plan is late on a fast load, Chapter I included).

## What is in the branch

- `src/engine/fx/mix/stageTable.ts` (new, 131 lines): the per-chapter table `STAGE_TABLE` (a row per chapter: the boss ids that pick it, one move for the
  party, one for the fiends, in world units along the screen's own axes read from today's resting rig), `standFor` (FFX, desktop, a named boss),
  `sideShift`, `readStand`, `onPhone`, and a checks-only `?stand=off` / `?stand=<party right>,<party toward>,<fiends right>,<fiends toward>`
  (off plays today's slots; four numbers play that move in any FFX desktop fight). No solve at runtime.
- `staging.ts` (163 lines): `Staging.side` (one move per SIDE, so a figure that arrives later, an aeon or the next link's fiends, stands in the same
  formation; it lets go when no fiend matching the row's boss is on the stage). `write` tells a re-seat by the stage (a spot or a tween sets z too) from a
  nudge by the formation relaxation (`StageRelax` moves a fiend along x alone, from where it stands, our slots included): without that the slots were
  added again every frame the relaxation nudged. For a fight with no row `write` is bit-identical to the old one (a randomized test compares it with a
  copy of the old function over 4,000 operations on five figures).
- `framing.ts` (395 lines): `decide` reads the row (`readStand`) and measures "today" with the figures where the table put them, so CHAPTER FRAMING, the
  clearance and the colossus rules (the MAX mix framing, D-316) all see the new slots; the plan carries the move into `commit`; a fight with a row is
  planned without the party-step tries (0.35 and 0.7 toward the fiends) and without the 0.6 s settling wait (the row places the party itself, and a fast load
  otherwise opens the first menu before the plan: see "For Bailey" 1). `framingReport.ts`: `framing.stand` and `staging[id].sx/sz` in
  `__pyrefly.fx.mix.snapshot()`.
- `tests/unit/fx-mix-stage-table.test.ts` (new, 23 tests): the table, where it applies (FFX desktop only, a named boss), the phone guard, the axes at two
  yaws, `Staging` (slots written once, released, survive release, arrivals, the stage's re-seats, the relaxation's nudges, the boss gate, BOSS SCALE and
  SPACING on top), the old-`write` equivalence.
- No settings key, nothing saved (not the save-data class). It plays with CHAPTER FRAMING's own switch (EYE CANDY, BATTLE SPECTACLE): off, or on the phone,
  the slots are the stage's. Layering holds (rule 1): `src/engine/fx/mix` is presentation, no engine state is written.

## The table

| chapter | party (right / toward) | fiends (right / toward) | what the numbers are |
|---|---|---|---|
| II Yunalesca | -0.10 / +0.04 | +0.75 / -0.47 | option C (both sides move), weighted to the fiends; one fixed move for all four sizes |
| III Braska's Final Aeon (**switched off**: `CHAPTER_III_STAGED = false`; see Repair) | +0.35 / 0 | boss +3.0 / -0.95; left pagoda +0.7 / -2.4; right pagoda +2.0 / -2.4 (a move per fiend, held; was +1.45 / -0.95 for all three, re-spread by the relaxation: see Repair) | option B: every fiend right and back, the party where the old plan's usual step put it, now on every run |

`right`: + is screen-right; `toward`: + is toward the camera (negative: away). A move reads from today's resting rig, so it means left / right / nearer / farther
in any scene. One fixed move per chapter held at 1600x900, 2000x1012, 2560x1440 and 2560x1080 (the prototype solved a different move per size; no size
class was needed; a size class would be one more key on a row).

### Why these numbers and not D-353's sketch ("party 0.5 left, boss 0.5 right"; "boss 1.45 right, 0.94 back")

The sketch is the prototype's `opt-restage` C at 1600x900: at its size 0.4 the party moves 0.52 left / 0.20 toward and the fiends 0.48 right / 0.32 back
(the prototype's maxima: party 2.6 / 1.0, boss 2.4 / 1.6, C = half of each). I ran 45 move-and-size candidates in this build (the appendix has every row), 2 to 5
runs each, at 1440x900 to 2560x1440, and measured the painted truth, not the product's gap alone:

- Chapter II, 1600x900. The sketch's move clears by 54 px, but moving the party left costs HUD cover: with the party at -0.18 or more a member is 8 to 17 percent
  under a panel (the command list or the advisor card); at 0 to -0.10 it is 4 to 6 percent (live: 6 to 13). The fiends' side buys clearance at no HUD cost: with
  the party at -0.10 / +0.04 the closest approach is 16 to 17 px at +0.65 / -0.40, 27 to 30 px at +0.80 / -0.50 and 23 to 26 px at +0.75 / -0.47 (1440x900).
  So the table is C in kind (both sides move) but most of the move is the fiends'; the party's -0.10 is what keeps Tidus and Yuna off the command list.
- Chapter III, 1600x900. The prototype's own numbers for this size (0.97 right / 0.63 back; I swept 0.96 / 0.64) touch at rest in this build (0 to 7 px, 12 px2); +1.15 / -0.76
  clears by 17 to 23 px and +1.30 / -0.86 by 18 to 26 px; the table's +1.45 / -0.95 (the prototype's number for 2000x1012, rounded) clears by 22 to 29 px at
  1600x900 and holds at the other sizes, so one move serves all four. The party's +0.35 is what the old plan's step usually chose (it is now the same on every
  run).
- Why the numbers moved at all: the prototype solved at the battle start with the party-step tries still running and the plan deciding on a live frame; here the
  row is fixed and the tries are off for a fight with a row (they chose by near ties and could undo the move).

## Proof

Method. Real keys from the title to the first command menu (seed 1, headless Chromium with the GPU, Playwright from node; never the Chrome extension or the
browser pane), then the in-page reading: the product's own report (`__pyrefly.fx.mix.snapshot()`: `plate.restGap`, `stand`, `staging`, `plans`) plus a
painted-pixel truth I added (each figure's current pose texture as an alpha >= 0.35 mask, a distance transform: the overlap in px2 and the closest approach in
px between a party member and a fiend; the cards' DOM boxes against the same masks), and a PNG of the same instant. Three builds: live (production, release 37),
origin/main (a pristine export of b96b5f4d on a local dev server) and the branch (a local dev server). Three runs per cell; the tables give the median with
min..max. The scripts are in `D:/Tools/pyrefly-scratch/2026-10-03/r38-restage/cap/` (not in the repo).

### Menu 1: the rest gap and the painted truth

`plan committed at the menu` is the number of plans the camera had committed when the first menu opened; origin/main shows `no` in 24 of 24 runs (its first-menu
frame is the stage's own formation, before its plan), live and the branch `yes`.

**II Yunalesca**

| size | build | rest gap, the plan (px) | rest gap, the live frame (px) | painted overlap (px2) | closest painted approach (px) | plan committed at the menu |
| --- | --- | --- | --- | --- | --- | --- |
| 1600x900 | live (release 37) | -122 (-122..-112) | -114 (-116..-108) | 1725 (1420..1846) | 0 | yes |
|  | origin/main (local) | none yet | -117 (-118..-115) | 1909 (1825..1983) | 0 | no |
|  | branch | 1 | 1 | 0 | 27 (23.2..29.9) | yes |
| 2000x1012 | live (release 37) | -129 (-130..-128) | -123 (-124..-122) | 1951 (1896..2001) | 0 | yes |
|  | origin/main (local) | none yet | -129 (-131..-128) | 2179 (2123..2388) | 0 | no |
|  | branch | 1 | 1 | 0 | 25.9 (25.7..29.3) | yes |
| 2560x1440 | live (release 37) | -197 (-199..-196) | -186 (-190..-185) | 4791 (4579..5324) | 0 | yes |
|  | origin/main (local) | none yet | -181 (-183..-178) | 4213 (3998..4552) | 0 | no |
|  | branch | 1 | 1 | 0 | 38.7 (38.1..43.4) | yes |
| 2560x1080 | live (release 37) | -145 (-147..-142) | -137 (-139..-133) | 2561 (2185..2650) | 0 | yes |
|  | origin/main (local) | none yet | -138 (-142..-134) | 2458 (2314..2966) | 0 | no |
|  | branch | 1 | 1 | 0 | 28.9 (28.8..32.3) | yes |

**III Braska's Final Aeon**

| size | build | rest gap, the plan (px) | rest gap, the live frame (px) | painted overlap (px2) | closest painted approach (px) | plan committed at the menu |
| --- | --- | --- | --- | --- | --- | --- |
| 1600x900 | live (release 37) | -43 (-127..-43) | -42 (-42..-39) | 1877 (1789..2097) | 0 | yes |
|  | origin/main (local) | none yet | 1 | 186 (161..206) | 0 | no |
|  | branch | 1 | 1 | 0 | 26.5 (21.6..28.6) | yes |
| 2000x1012 | live (release 37) | -69 (-69..-49) | -47 (-47..-46) | 3066 (2992..3135) | 0 | yes |
|  | origin/main (local) | none yet | 1 | 224 (191..229) | 0 | no |
|  | branch | 1 | 1 | 0 | 20.8 (18.8..25.6) | yes |
| 2560x1440 | live (release 37) | -70 (-70..-69) | -65 (-67..-63) | 4812 (4441..4946) | 0 | yes |
|  | origin/main (local) | none yet | 1 | 405 (397..454) | 0 | no |
|  | branch | 1 | 1 | 0 | 34.6 (29.5..37.3) | yes |
| 2560x1080 | live (release 37) | -53 | -49 (-52..-49) | 2489 (2274..2533) | 0 | yes |
|  | origin/main (local) | none yet | 1 | 235 (208..276) | 0 | no |
|  | branch | 1 | 1 | 0 | 20.4 (20..28) | yes |

### Menu 1: the HUD and the cards

Shares are of a painted box under a HUD panel; card columns are px2 of painted fiend under the card's box (Chapter III's Sensor card is not up at menu 1).
Live shows no advisor card in 2 of the 3 Chapter III runs at 2000x1012; its advisor figure there is the one run that had one.

**II Yunalesca**

| size | build | party member under HUD (max share) | a fiend part under HUD (max share) | advisor card over a fiend (px2) | Sensor card over a fiend (px2) |
| --- | --- | --- | --- | --- | --- |
| 1600x900 | live (release 37) | 0.13 (0.06..0.13) | 0 | 0 | 2850 (2822..3268) |
|  | branch | 0.04 | 0 | 0 | 1990 (1980..1996) |
| 2000x1012 | live (release 37) | 0.06 | 0 | 0 | 3992 (3928..4064) |
|  | branch | 0.06 (0.04..0.06) | 0 | 0 | 2255 (1957..2317) |
| 2560x1440 | live (release 37) | 0.13 | 0 | 0 | 8378 (8256..8379) |
|  | branch | 0.04 | 0 | 0 | 4992 (4391..5108) |
| 2560x1080 | live (release 37) | 0.33 | 0 (0..0.03) | 0 | 2821 (2720..2847) |
|  | branch | 0.33 (0.33..0.35) | 0 | 0 | 4288 (3721..4355) |

**III Braska's Final Aeon**

| size | build | party member under HUD (max share) | a fiend part under HUD (max share) | advisor card over a fiend (px2) | Sensor card over a fiend (px2) |
| --- | --- | --- | --- | --- | --- |
| 1600x900 | live (release 37) | 0.17 (0.08..0.17) | 0.3 (0.3..0.33) | 0 | no card |
|  | branch | 0.08 | 0.7 | 0 | no card |
| 2000x1012 | live (release 37) | 0.08 | 0.3 (0.3..0.33) | 0 | no card |
|  | branch | 0.17 | 0.57 (0.56..0.59) | 0 | no card |
| 2560x1440 | live (release 37) | 0.08 | 0.31 | 0 | no card |
|  | branch | 0.08 (0.08..0.17) | 0.7 (0.62..0.7) | 0 | no card |
| 2560x1080 | live (release 37) | 0.29 | 0.56 | 0 | no card |
|  | branch | 0.29 | 0.61 (0.59..0.61) | 0 | no card |

The advisor card is 0 px2 over any fiend in every cell, so the "advisor card over the near pagoda" cost D-353 named for option B did not appear here.

### Menus 2 and 3 (the next two input beats)

By these menus every build has committed its plan, so live and the branch are comparable. Menu 2 is Yuna's turn in Chapter II and Auron's in Chapter III; menu 3 is Yuna's
in both (her ready pose holds the staff out toward the fiends).

**II Yunalesca**

| size | menu | painted overlap live (px2) | painted overlap branch (px2) | closest approach branch (px) | party under HUD live / branch | fiend part under HUD live / branch |
| --- | --- | --- | --- | --- | --- | --- |
| 1600x900 | 2 | 1901 (1882..2664) | 0 | 21.1 (19.5..21.1) | 0.06 / 0.08 | 0 / 0 (0..0.03) |
|  | 3 | 1952 (1653..2568) | 0 | 26.2 (26.1..26.7) | 0.06 / 0.08 | 0 / 0 (0..0.03) |
| 2000x1012 | 2 | 2623 (2328..2885) | 0 | 25.7 (25.7..29.5) | 0.06 / 0.13 (0.08..0.13) | 0 / 0.03 |
|  | 3 | 2549 (2490..2610) | 0 | 26.5 (22.9..26.7) | 0.06 / 0.13 (0.08..0.13) | 0 / 0.03 |
| 2560x1440 | 2 | 4561 (4362..5614) | 0 | 30 (29.6..42.4) | 0.06 / 0.08 (0.08..0.13) | 0 / 0.01 (0..0.01) |
|  | 3 | 6547 (5451..7444) | 0 | 31.1 (27.3..34.9) | 0.06 / 0.08 (0.08..0.13) | 0 / 0.01 (0..0.01) |
| 2560x1080 | 2 | 2864 (2818..3125) | 0 | 28.1 (24.3..29.1) | 0.08 (0.06..0.08) / 0.06 | 0 / 0 |
|  | 3 | 3270 (2423..3574) | 0 | 25.5 (13.3..28.1) | 0.08 (0.06..0.08) / 0.06 | 0 / 0 |

**III Braska's Final Aeon**

| size | menu | painted overlap live (px2) | painted overlap branch (px2) | closest approach branch (px) | party under HUD live / branch | fiend part under HUD live / branch |
| --- | --- | --- | --- | --- | --- | --- |
| 1600x900 | 2 | 3849 (3716..4045) | 0 (0..13) | 2 (0..6) | 0.17 (0.08..0.17) / 0.08 | 0.39 / 0.46 (0.34..0.49) |
|  | 3 | 3671 (3271..3684) | 467 (457..757) | 0 | 0.25 (0.17..0.25) / 0.25 | 0.3 / 0.46 (0.34..0.46) |
| 2000x1012 | 2 | 5743 (4936..5922) | 80 (64..91) | 0 | 0.17 (0.17..0.33) / 0.17 (0.17..0.5) | 0.52 (0.31..0.61) / 0.48 (0.48..0.56) |
|  | 3 | 5036 (4859..5188) | 739 (715..928) | 0 | 0.25 / 0.25 (0.25..0.33) | 0.3 / 0.43 (0.43..0.52) |
| 2560x1440 | 2 | 13535 (10497..18680) | 0 | 10.4 (7.8..11.8) | 0.08 (0.08..0.17) / 0.08 | 0.41 (0.3..0.41) / 0.49 (0.48..0.49) |
|  | 3 | 2352 (2135..2998) | 1227 (1029..1323) | 0 | 0.25 / 0.25 | 0.41 / 0.48 (0.48..0.49) |
| 2560x1080 | 2 | 6074 (5935..6114) | 0 | 16 (15.1..18) | 0.17 / 0.38 | 0.31 / 0.57 |
|  | 3 | 1488 (1385..6008) | 1033 (930..1077) | 0 | 0.33 (0.17..0.33) / 0.5 (0.35..0.5) | 0.31 / 0.36 |

Chapter II is clear at every later menu (0 px2). Chapter III keeps a small touch at Yuna's menu, much smaller than live's: the staff's tip against the boss's
sword (`docs/screenshots/r38-restage/braskas-final-aeon-1600x900-menu3-live-vs-branch.jpg`).

### Over the drift cycle (the frame is not still)

The rest gap is measured on one frame, but the camera drifts (LIVING PAINTINGS DriftRig, +-0.5 world units, period 23 s: +-45 px of parallax at 1600x900) and the
figures breathe, so I sampled the live frame every 500 ms for 40 s at the first menu, live against branch (no action taken; the product's gap is read on every
sampled frame too). On the branch the product's gap is +1 in every Chapter II frame and below 1 in 33 of Chapter III's 283 frames (worst -102 px at 2560x1440); the painted
truth finds a touch in 100 of those frames, because the metric lets small touches through (6 percent of a 6 x 8 grid of sample cells). A single plan-time frame says
nothing about the drift.

| chapter | size | build | frames | frames with any painted overlap | frames over 100 px2 | median overlap px2 | p90 px2 | max px2 | closest painted approach, worst frame px | frames where the product gap is below 1 (worst px) | camera x drift |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| yunalesca | 1600x900 | live | 81 | 81 | 81 | 1953 | 2486 | 2679 | 0 | 81 (-123) | -0.26..0.27 |
| yunalesca | 1600x900 | branch | 81 | 0 | 0 | 0 | 0 | 0 | 11.7 | 0 (1) | -0.23..0.28 |
| yunalesca | 2000x1012 | live | 80 | 80 | 80 | 2476 | 3139 | 3447 | 0 | 80 (-138) | -0.3..0.23 |
| yunalesca | 2000x1012 | branch | 82 | 0 | 0 | 0 | 0 | 0 | 13.2 | 0 (1) | -0.25..0.28 |
| yunalesca | 2560x1440 | live | 74 | 74 | 74 | 5597.5 | 7325 | 7723 | 0 | 74 (-205) | -0.26..0.23 |
| yunalesca | 2560x1440 | branch | 78 | 0 | 0 | 0 | 0 | 0 | 18.5 | 0 (1) | -0.23..0.29 |
| yunalesca | 2560x1080 | live | 77 | 77 | 77 | 3242 | 4153 | 4626 | 0 | 77 (-156) | -0.24..0.23 |
| yunalesca | 2560x1080 | branch | 79 | 0 | 0 | 0 | 0 | 0 | 11.1 | 0 (1) | -0.22..0.32 |
| braskas-final-aeon | 1600x900 | live | 76 | 76 | 76 | 2475.5 | 3491 | 4056 | 0 | 76 (-76) | -0.53..0.43 |
| braskas-final-aeon | 1600x900 | branch | 77 | 35 | 9 | 0 | 125 | 200 | 0 | 13 (-64) | -0.44..0.54 |
| braskas-final-aeon | 2000x1012 | live | 71 | 71 | 71 | 3259 | 4417 | 4890 | 0 | 71 (-85) | -0.43..0.54 |
| braskas-final-aeon | 2000x1012 | branch | 75 | 34 | 26 | 0 | 230 | 396 | 0 | 13 (-72) | -0.51..0.42 |
| braskas-final-aeon | 2560x1440 | live | 61 | 61 | 61 | 6516 | 8886 | 10012 | 0 | 61 (-122) | -0.5..0.49 |
| braskas-final-aeon | 2560x1440 | branch | 64 | 16 | 6 | 0 | 99 | 233 | 0 | 4 (-102) | -0.47..0.41 |
| braskas-final-aeon | 2560x1080 | live | 68 | 68 | 68 | 4022 | 5290 | 5790 | 0 | 68 (-93) | -0.46..0.46 |
| braskas-final-aeon | 2560x1080 | branch | 67 | 15 | 2 | 0 | 30 | 111 | 0 | 3 (0) | -0.52..0.47 |

Chapter II never touches on the branch (closest 11 to 19 px in the worst frame). Chapter III brushes: in 22 to 45 percent of the frames, by 111 to 396 px2 at
the worst frame (90th percentile 30 to 230), against live's thousands in every frame.

### Stills and clips

`docs/screenshots/r38-restage/` (all live on the left, branch on the right, the readings under each still):

- First menu, every chapter and size: `yunalesca-<size>-menu1-live-vs-branch.jpg` and `braskas-final-aeon-<size>-menu1-live-vs-branch.jpg` for 1600x900,
  2000x1012, 2560x1440, 2560x1080 (eight files).
- Later menus: `yunalesca-1600x900-menu3-...`, `braskas-final-aeon-1600x900-menu3-...`, `braskas-final-aeon-2560x1080-menu3-...` (the worst HUD cell).
- The first turn (ATTACK, confirm the target, watch it through, 1600x900): `yunalesca-1600x900-first-turn-live-vs-branch.webm` and
  `braskas-final-aeon-1600x900-first-turn-live-vs-branch.webm` (live | branch side by side, 10 s), with `...-first-turn-strips.jpg` (one frame a second, live over
  branch). The lunge reaches, the hit effects land on the fiend, the next menu is clear; no frame shows a void or a plate edge.
- The phone: `phone-yunalesca-390x844-main-vs-branch.jpg`, `phone-braskas-final-aeon-390x844-main-vs-branch.jpg`.

### Plate edge, void, HUD

- The product's own plate check (`plate.chosen` against `plate.today`, the share of the frame past the painted plate's edge): equal in all 24 branch cells, 0 at
  1600x900, 2000x1012 and 2560x1440; 0.154 (Chapter II) and 0.103 (Chapter III) at 2560x1080, exactly what the chapter's own rig shows on live 35 and 37 (r36fix's note
  on PR-0307). The restage moves figures, not the camera's plate coverage.
- A pixel check of the 8 px outer ring of all 24 live/branch still pairs (share of near-black pixels per side): the branch is within 2.3 points of live on every
  side, and no side of any frame has more than 10.5 percent (a plate edge or a void shows as a flat dark band on one side). The same check on every frame of the four
  first-turn clips (about 42 frames each, 4 a second, outer ring 5 px): Chapter II worst top 5.0 / bottom 0.6 / left 5.3 / right 0.4 percent on the branch against
  5.3 / 1.5 / 6.2 / 0.8 on live; Chapter III's scene is dark by itself (worst 35 / 65 / 20 / 32 on the branch, 31 / 66 / 29 / 35 on live): the branch's worst frame is darker
  than live's only at the top (35.2 against 31.0 percent), every other side equal or lighter; neither build has a side that goes to a flat band.
- HUD: the menu 1 HUD table above. Party members under a panel at menu 1: Chapter II 0.04 to 0.33 (live 0.06 to 0.33; the 0.33 at 2560x1080 is on both); Chapter III 0.08 to 0.29 (live 0.08 to 0.29).

### The phone is not engaged

`standFor` returns null on the phone (`phoneBattle()`, with a `matchMedia('(max-width: 599px) and (orientation: portrait)')` fallback for the first frames), so
`Staging.side` stays null, `staged` stays false and `decide` takes the old path (the 23 tests include the guard). Measured at 390x844 (touch, real keys to the first menu),
origin/main against the branch, Chapter II (8 readings each) and III (2 each):

| chapter | build | readings | plans at the menu | `stand` | `staging` | rest gap, plan (px) | rest gap, live frame (px) |
|---|---|---|---|---|---|---|---|
| II | origin/main | 8 | 2 in 8 | null | {} | -54 to -57 | -54 to -57 |
| II | branch | 8 | 2 in 6, 1 in 2 (timing; the interleaved rerun of 4 pairs: 2 in 4 of 4) | null | {} | -53 to -57 | -53 to -56 |
| III | origin/main | 2 | 2 in 2 | null | {} | -34 to -35 | -32 to -33 |
| III | branch | 2 | 2 in 1, 1 in 1 | null | {} | -34 (and +1 in the run with one plan) | -31 |

The figures stand at the same world places on both builds (Chapter II: identical to 3 decimals; Chapter III: the boss within 0.005, the formation relaxation's jitter).
Pixels (Chapter II, reduced motion, four runs each, frames read after the presentation clocks were frozen): no two runs of one build give the same frame (the drift phase,
particles and the figures' breathing), so a pixel difference cannot be zero: same build against same build differs in 49 to 53 percent of the pixels (11 to 17 percent by more than
24 levels), origin/main against the branch in 44 to 53 percent (6 to 17 percent by more than 24 levels), i.e. nothing beyond that floor
(`phone-yunalesca-390x844-main-vs-branch.jpg`: same composition, Yunalesca overlapping Auron on both, as today).

### Colossus rules elsewhere are unchanged

A fight with no row reaches the old code (above). Measured as the framing's outcome per run (the MAX mix colossus search: scale, lens, blend, back) on origin/main
and the branch, interleaved, 1600x900, real keys, `stand` null and the same `staging` in every run:

| chapter | build | runs | distinct outcomes | outcome (scale, lens, blend, back) per run | figures at the same world places in every run | stand reported |
| --- | --- | --- | --- | --- | --- | --- |
| ffx2-bahamut | base | 23 | 6 | (0.7, (-64, -36), 0.5, 1) x4; (0, (-64, 0), 0.5, 1) x9; (0.45, (-64, -36), 0.5, 1) x4; (0.7, (0, 0), 0.75, 1) x2; (1, (-64, -36), 0.5, 1) x3; (0.7, (-64, -36), 0.5, 1.04) x1 | False | null |
| ffx2-bahamut | branch | 23 | 6 | (0, (-64, 0), 0.5, 1) x8; (1, (-64, -36), 0.5, 1) x6; (0.7, (0, 0), 0.75, 1) x1; (0.7, (-64, -36), 0.5, 1.04) x1; (0.7, (-64, -36), 0.5, 1) x2; (0.45, (-64, -36), 0.5, 1) x5 | False | null |
| yojimbo-cavern | base | 11 | 2 | (0.25, (0, -36), 1, 1.04) x8; (0.25, (0, 0), 1, 1.04) x3 | True | null |
| yojimbo-cavern | branch | 11 | 2 | (0.25, (0, 0), 1, 1.04) x7; (0.25, (0, -36), 1, 1.04) x4 | True | null |
| seymour-flux | base | 3 | 1 | (0, (0, 0), None, None) x3 | True | null |
| seymour-flux | branch | 3 | 1 | (0, (0, 0), None, None) x3 | True | null |
| evrae-airship | base | 3 | 1 | (-1, (0, -36), 1, 1.04) x3 | True | null |
| evrae-airship | branch | 3 | 1 | (-1, (0, -36), 1, 1.04) x3 | True | null |
| seymour-natus | base | 3 | 1 | (-1, (-64, 0), 0, 1.04) x3 | True | null |
| seymour-natus | branch | 3 | 1 | (-1, (-64, 0), 0, 1.04) x3 | True | null |

Bahamut and Yojimbo flip between outcomes from run to run on origin/main itself (the plan decides on a live frame: drift phase and the idle pose at that instant);
the branch shows the same set of outcomes with similar frequencies (Bahamut: scale 0 in 9 and 8 of 23 runs, 0.45 in 4 and 5, 0.7 in 7 and 4, 1 in 3 and 6). Ch I, Evrae and
Natus gave the same single outcome in all 3 runs of both. Yojimbo's figures stand at the same world places in every run of both builds.

### Chapter III on live: why release 36 once read +1 and round 19b read -44 to -100

I measured live myself (the menu 1 rest gap table above): the plan's rest gap is -43 (-127..-43) at 1600x900, -69, -70 and -53 at the other sizes, with a plan committed when the first menu
opens, which reproduces round 19b's -44 to -100. The +1 of release 36 reproduces on origin/main served from a local dev server: its first menu opens before its plan (24 of 24
runs show no committed plan, so the frame is the stage's own formation, which is nearly clear: +1, 186 to 405 px2 of painted overlap). They are two states of the same
build: whether the plan, with its party step toward the fiends, has committed by the time the first menu opens. After the first action the plan commits and the party
steps into the boss (origin/main menu 2: plan gap -61 to -97 at three sizes). The branch plans a fight with a row at once, so its first menu is always the planned state.

## Natus (Chapter X), option N: left off

D-353 held option N "until it is deterministic", and this lane's rule was to include it only if the same result came out in 10 of 10 runs at 1600x900, 2000x1012
and 2560x1440. Today the Sensor-cover hold (`SENSOR_COVER_MAX` 0.05 in `plate.ts`) keeps Natus's colossus master off at the first three sizes (today's rig is kept: scale -1; at 2560x1080 a
small master, scale 0.25, passes), and the card as steered today (`sensorSteer.ts` through `FFXBattleHud.ts`) covers Natus by 0 px2 at those three sizes on live:

| build | size | plan | rest gap (px) | Sensor card over Natus (px2) |
| --- | --- | --- | --- | --- |
| live (release 37) | 1600x900 | scale -1, lens (-64, 0) | 1 | 0 |
| live (release 37) | 2000x1012 | scale -1, lens (0, 0) | 1 | 0 |
| live (release 37) | 2560x1440 | scale -1, lens (-102, 0) | 1 | 0 |
| live (release 37) | 2560x1080 | scale 0.25, lens (0, -43) | 8 | 40 |
| origin/main (local) | 1600x900 | scale -1, lens (-64, 0) | 1 | 0 |
| origin/main (local) | 2000x1012 | scale -1, lens (0, 0) | 1 | 0 |
| origin/main (local) | 2560x1440 | scale -1, lens (-102, 0) | 1 | 0 |
| origin/main (local) | 2560x1080 | scale 0.25, lens (0, -43) | 10 | 25 |

Ten runs per size on the branch (no row for Natus, so today's code), against an experiment build with the hold released (what a perfect "card steered off the
boss" would give the plan; a temporary `?nosensor=1` hook, removed from the source), same method:

| build | size | runs | distinct plan outcomes | the outcomes | Sensor card over Natus (px2) |
| --- | --- | --- | --- | --- | --- |
| today's code (the Sensor-cover hold on) | 1600x900 | 10 | 1 | scale -1 lens (-64, 0) blend 0 back 1.04 x10 | 0 in 10 runs |
| today's code (the Sensor-cover hold on) | 2000x1012 | 10 | 2 | scale -1 lens (0, 0) blend 0 back 1 x8; scale -1 lens (0, 40) blend 0 back 1 x2 | 0 in 10 runs |
| today's code (the Sensor-cover hold on) | 2560x1440 | 10 | 2 | scale -1 lens (-102, 0) blend 0 back 1.04 x9; scale 0 lens (0, -58) blend 0.75 back 1.08 x1 | 0 in 9 runs, 59 to 59 px2 in 1 |
| the hold released (experiment, removed) | 1600x900 | 10 | 3 | scale 0.7 lens (0, 0) blend 0.25 back 1.08 x5; scale -1 lens (-64, 0) blend 0 back 1.04 x3; scale 0.45 lens (0, 0) blend 0.25 back 1.04 x2 | 0 in 3 runs, 11,483 to 14,411 px2 in 7 |
| the hold released (experiment, removed) | 2000x1012 | 10 | 4 | scale 0.7 lens (80, 0) blend 1 back 1.04 x4; scale 1 lens (80, 0) blend 0.75 back 1.04 x3; scale 0.7 lens (0, 0) blend 0.75 back 1.08 x2; scale 0.45 lens (0, 0) blend 0.75 back 1.04 x1 | 0 in 0 runs, 4,146 to 20,765 px2 in 10 |
| the hold released (experiment, removed) | 2560x1440 | 10 | 5 | scale -1 lens (-102, 0) blend 0 back 1.04 x5; scale 0.45 lens (0, 0) blend 0.25 back 1.04 x2; scale 0.25 lens (0, 0) blend 0.25 back 1.04 x1; scale 0.25 lens (0, 0) blend 0.25 back 1 x1; scale 0.7 lens (0, 0) blend 0.25 back 1.08 x1 | 0 in 5 runs, 23,769 to 36,680 px2 in 5 |

Verdict: **not met, left off**.

1. On today's code the Natus plan is not the same in 10 of 10 runs at two of the three sizes (2000x1012: 8 and 2; 2560x1440: 9 and 1, and the odd run leaves the card over
   Natus by 59 px2). No change to the card can be 10 of 10 while the plan under it flips; it is the same cause as Bahamut and Yojimbo above, and the table fixes it for its
   two chapters by taking one fixed move instead of searching.
2. With the hold released the master returns in 7, 10 and 5 of 10 runs, but with 3, 4 and 5 different outcomes, and in every one of those 22 runs (and in none of the other 8) the
   card as laid out today covers Natus, by 4,146 to 36,680 px2: today's steer does not keep the card off a master's Natus, the hold does. The card has to move, and that is in
   `FFXBattleHud.ts` (1,667 lines, may not grow; `steerSensor` at line 963), not in the mix.
3. A deterministic N would need (a) a Natus row, one fixed master and move, so the plan stops flipping; (b) a steer for the card that is a function of the size class
   instead of the live boss box, with room for it outside `FFXBattleHud.ts`; (c) a mockup for Bailey (rule 9): Natus with its master back is a different picture. None
   of this is built. 2560x1080, not a required size, already has the card over Natus on live (40 px2, origin/main 25).

## What this costs and where it stops

1. **Smaller fiends.** They draw 2 to 8 percent smaller than live (box heights, first menu: Chapter II Yunalesca 441 to 431 px at 1600x900, 732 to 689 at 2560x1440; Chapter III
   Braska's Final Aeon 391 to 374 and the pagodas 257 to 243 and 239 to 227 at 2000x1012). The moves put them farther from the camera (the lens fit differs a little between
   the two builds too).
2. **The right pagoda behind the rail.** At menu 1 a fiend part is 0.57 to 0.70 under a HUD panel in Chapter III (the right pagoda against the turn-order rail's panel box;
   live 0.30 to 0.31 at three sizes and 0.56 at 2560x1080, where the branch has 0.61). Visually the pagoda still reads at 2000x1012 (`braskas-final-aeon-2000x1012-menu1-live-vs-branch.jpg`), but the panel box
   covers it.
3. **Yuna's ready staff.** Chapter III menu 3 still has 467 to 1,227 px2 of painted overlap (live 1,488 to 5,036): the active member's ready pose is larger, so the touch comes
   back for her turn. A bigger move would clear it and push the right pagoda under the rail; the table does not trade that.
4. **HUD at the wide sizes, Chapter III menus 2 and 3.** A party member is 0.38 / 0.50 under a panel at 2560x1080 (live 0.17 / 0.33) and up to 0.50 at 2000x1012 menu 2 (live
   0.33); Chapter II 2000x1012 menus 2 and 3 are 0.13 against 0.06. I did not chase the cause (the share is of the figure's box under any HUD panel at that instant).
5. **The Sensor card over Yunalesca.** 4,288 px2 against live's 2,821 at 2560x1080 (lower at the other three sizes: 1,990 / 2,255 / 4,992 against 2,850 / 3,992 / 8,378).
6. **Lunges stop short.** An attacker lunges a fixed 1.4 world units along its facing (`BattlePresenterBeats.ts` line 77, `PaintedActor.lunge`), so with the fiends moved about
   1.0 (Chapter II) and 1.45 (Chapter III) units from the party it stops short of the fiend instead of ending inside it. In the clips the hit still reads (the effect lands
   on the fiend). A presenter change (distance from the target) is not in this branch.
7. **Chapter III at aspect 1.6 (1440x900, not one of the four sizes).** The six moves I tried there leave a hairline touch (closest 0 px, painted overlap 29 to 158 px2) or put
   a member under the command list; the best of them (party +0.50, fiends +1.50 / -0.99) clears by 8 to 14 px with a member 0.33 under a panel. Cause (per-frame trace of the
   boss's world x, Chapter III, branch): the formation relaxation (`StageRelax`, `PANEL_CLEAR` 0.78: it shuffles a targetable fiend left until 78 percent of it is clear of the HUD's
   panels) pulls the fiends back toward the party before the first menu, boss x 3.99 to 3.86 (3.98 to 3.71 in another run) at 1600x900 and 3.98 to 3.04 at 1440x900. A size class in the
   table (a bigger move at the narrow aspects, or a lane the relaxation leaves alone) is where this would be fixed; nothing here needed one. The same pull is why the closest approach
   at Chapter III's later menus (2 px at menu 2, 1600x900) is smaller than at menu 1 (27 px).
8. **Later links and forms.** Chapter III's possessed aeons (link 2) are not tuned: the table lets go when no Braska's Final Aeon is on the stage, and link 2 plays as on origin/main
   (`stand` null, figures unshifted; measured). Yu Yevon and Yunalesca's forms 2 and 3 were not measured individually (the Chapter II row's boss id matches all her forms, so the move
   holds for them).
9. **Where the plan is still late.** The table does not change the plan's timing for the other chapters (see "For Bailey" 1).

## Evrae (Chapter VIII): what is left

Not built here (D-353 asked for a mockup round first; D-360, on origin/main since this branch was cut, adopted E1-H: the approved idle repainted with the coil to the right and Evrae's
slot pinned +0.97 world, in its own lane). If a row is wanted later: `STAGE_TABLE` takes one by boss id (`/^evrae/`), `standFor` and `Staging` need nothing more. What the live frame says today
(one run per size; the plan keeps today's rig, scale -1, in 3 of 3 runs on both builds):

| size | plan | rest gap, the plan (px, pair) | rest gap, the live frame (px) | party under HUD (max share) |
| --- | --- | --- | --- | --- |
| 1600x900 | scale -1, lens (0, -36) | -314 (tidus vs evrae) | -275 | 0 |
| 2000x1012 | scale -1, lens (0, 0) | -343 (tidus vs evrae) | -307 | 0.33 |
| 2560x1440 | scale -1, lens (0, -58) | -503 (tidus vs evrae) | -441 | 0 |
| 2560x1080 | scale -1, lens (0, 0) | -367 (tidus vs evrae) | -332 | 0.17 |

D-353: no position-only move clears the coil; the coil's box here (629 x 425 px at 1600x900, x 531 to 1160) spans all three party members' boxes. My harness has no painted overlap for
Evrae (the party masks do not load in that frame: `clearance` null), so only the box gap is on record; a sweep needs that fixed first. Facts for the mockup round: the Chapter II and III rows
hold because the plan no longer searches for them (a fixed move, the party-step tries off); Evrae's plan today picks today's rig at every size; the formation relaxation (`StageRelax`) and
the camera drift act on any row as they do on Chapters II and III (the drift window above shows what that costs a row).

## For Bailey

1. **The plan can be late on a fast load.** The camera's plan needs 0.6 s of a still roster and commits only when no command menu is open. A fast load opens the first menu
   first, so the plan waits for the first action and the first menu is the stage's own formation. Measured at the first menu (plans committed): Chapters II and III on origin/main 0 in
   24 of 24 runs (live: 1 in 24 of 24), Chapter I on origin/main and the branch 0 in 10 of 10 (live: 1 in 4 of 4); Chapters VIII, IX, X and FFX-2 Bahamut had it before the menu in every
   run on both local builds. Production loads slower, which I believe is the difference but did not measure separately. For Chapters II and III the table plans at once, so this does
   not happen to them; Chapter I still has it. Planning every chapter at once would change every first menu (and Chapter I's picture), so it needs your yes (rule 10).
2. **Chapter II's numbers differ from the sketch** (party -0.10 / +0.04 and fiends +0.75 / -0.47, not "0.5 left, 0.5 right"): the party's half of the sketch puts Tidus and Yuna under
   the command list, so the fiends take most of the move (the sweep rows are the appendix). It is option C in kind; say if you want the sketch's split anyway (a one-line change in the table).
3. **Chapter III at Yuna's turn still brushes the boss** (467 to 1,227 px2, live up to 5,036) and the right pagoda sits behind the rail's panel box (0.57 to 0.70); a bigger move
   would trade one for the other. Option: leave it (recommended), or a size-class row for the narrow aspects.
4. **Natus option N stays off** (above); the next step for it is a Natus row plus a mockup, not a card tweak.

## Gates

- `npx tsc --noEmit` clean (2,806 files, 4 s).
- `tests/unit/fx-mix-stage-table.test.ts` 23 of 23; with the neighbours (`fx-mix-*`, `eye-candy-mix-connection`, `phone-framing-ko`, `summon-staging`) 12 files, 158 tests pass.
- Full suite, once, `--maxWorkers=3`: 774 files, 768 passed, 5 skipped, 1 failed; 11,295 tests passed, 41 skipped, 1 todo, 1 failed. The failure is a timeout, `tests/unit/strategy-ffx2-bahamut.test.ts` "heal-only route (no Shell, no Breaks) clears Mega Flare" (30 FFX-2 engine runs; 20 s on a machine shared with other agents' runs, against the 15 s default). Run alone with `--testTimeout=60000` the whole file passes (19 of 19; that test in 29 s). It is the FFX-2 battle engine's own strategy test: nothing this branch touches (r36fix's full run used the same longer timeout and lost a different load-sensitive test, `ff7-fx`).
- `node tools/orphans.mjs`: 24 orphaned modules, the same count as r36fix's note, none of them mine (stageTable.ts is imported by framing.ts).
- Every source file under 400 lines (framing.ts 395, staging.ts 163, stageTable.ts 131, framingReport.ts 28); strict TS, explicit `.ts` imports.
- `node tools/critic-plan.mjs --paths src/engine/fx/mix/framing.ts,src/engine/fx/mix/framingReport.ts,src/engine/fx/mix/staging.ts,src/engine/fx/mix/stageTable.ts,tests/unit/fx-mix-stage-table.test.ts,docs/handoff/r38-restage.md`:
  review **DEEP** (36 substantial checkpoints since the last deep review); before deploy a **FOCUSED** review of the production candidate; after deploy live verification, then the
  DEEP review on the live build; obligations live + focused + deep; systems effects, lighting and sprites; checks CHK-008, CHK-013, CHK-016, CHK-017, CHK-020, CHK-021; targets none.
  Not the save-data class. The focused review should confirm the FFX-2 chapters (Bahamut, Vegnagun, Leblanc, Trema, Ixion) are unchanged: the path list says "both", the behaviour is FFX only.
- Servers I started (ports 6510, 6511) were stopped by PID before I finished.

## For the next agent

- Reading a cell: `window.__pyrefly.fx.mix.snapshot().framing` has `stand` (`{chapter, party: [dx, dz], enemy: [dx, dz]}` or null), `staging` (`sx`, `sz` per figure), `plate.restGap`, `plans`.
  `?stand=off` plays today's slots; `?stand=a,b,c,d` plays a move in any FFX desktop fight (the sweep recipe: `sweep.sh` in the scratch folder, one `meas.mjs` call per candidate).
- To add a chapter (Evrae, Natus): add a row to `STAGE_TABLE`, sweep it with `?stand=` at the four sizes (closest painted approach and the HUD columns, not the product's gap alone), then
  re-read the later menus and the drift window; the gap metric saturates at +1.
- Do not read the product's rest gap alone: it reads +1 on origin/main's Chapter III with 186 to 405 px2 of overlap, and on the branch's Chapter III it passes touches of up to a few hundred px2 in the drift window.
- The harness (scratch, not in the repo): `gaplib.mjs` (real keys to the first menu), `inpage.mjs` (the in-page reading, painted masks), `meas.mjs`, `sheet.mjs`, `sway.mjs`, `clip.mjs`, `phone.mjs`,
  `links.mjs`, `doc-tables.py`.

## Appendix: the sweep (45 move-and-size candidates, `?stand=`, 2 to 5 runs each)

Closest painted approach and overlap are over the runs; "later menus" is the worst of menus 2 and 3 where it was read.

| chapter | size | party right/toward | fiends right/toward | runs | closest painted approach px (min..max) | painted overlap px2 (max) | party under HUD (max) | boss part under HUD (max) | lens at menu 1 | later menus: HUD max / overlap max / lens |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| braskas-final-aeon | 1440x900 | +0.20 / +0.00 | +1.50 / -0.99 | 2 | 0..1 | 29 | 0.33 | 0.49 | {(58, -36): 2} | - / - / - |
| braskas-final-aeon | 1440x900 | +0.35 / +0.00 | +0.96 / -0.64 | 3 | 0..0 | 158 | 0.17 | 0.56 | {(58, -36): 3} | - / - / - |
| braskas-final-aeon | 1440x900 | +0.35 / +0.00 | +1.15 / -0.76 | 4 | 0..0 | 140 | 0.17 | 0.56 | {(58, -36): 4} | - / - / - |
| braskas-final-aeon | 1440x900 | +0.35 / +0.00 | +1.50 / -0.99 | 2 | 0..0 | 99 | 0.17 | 0.49 | {(58, -36): 2} | - / - / - |
| braskas-final-aeon | 1440x900 | +0.35 / +0.00 | +1.80 / -1.19 | 2 | 0..0 | 32 | 0.17 | 1 | {(58, -36): 2} | - / - / - |
| braskas-final-aeon | 1440x900 | +0.50 / +0.00 | +1.50 / -0.99 | 2 | 7.8..13.8 | 0 | 0.33 | 0.49 | {(0, -36): 2} | - / - / - |
| braskas-final-aeon | 1600x900 | +0.20 / +0.00 | +0.60 / -0.40 | 3 | 0..0 | 42 | 0.17 | 0.33 | {(64, -36): 3} | - / - / - |
| braskas-final-aeon | 1600x900 | +0.35 / +0.00 | +0.45 / -0.30 | 3 | 0..0 | 243 | 0.17 | 0.33 | {(64, -36): 3} | - / - / - |
| braskas-final-aeon | 1600x900 | +0.35 / +0.00 | +0.70 / -0.45 | 3 | 0..0 | 125 | 0.17 | 0.39 | {(64, -36): 3} | - / - / - |
| braskas-final-aeon | 1600x900 | +0.35 / +0.00 | +0.96 / -0.64 | 4 | 0..7.4 | 12 | 0.08 | 0.46 | {(64, -36): 4} | - / - / - |
| braskas-final-aeon | 1600x900 | +0.35 / +0.00 | +1.15 / -0.76 | 5 | 17.4..23 | 0 | 0.17 | 0.46 | {(64, -36): 5} | 0.25 / 727 / {(64, -36): 6} |
| braskas-final-aeon | 1600x900 | +0.35 / +0.00 | +1.30 / -0.86 | 5 | 18.4..26 | 0 | 0.17 | 0.56 | {(64, -36): 5} | 0.25 / 822 / {(64, -36): 6} |
| braskas-final-aeon | 2000x1012 | +0.35 / +0.00 | +0.96 / -0.64 | 3 | 0..7 | 30 | 0.17 | 0.49 | {(80, -40): 3} | - / - / - |
| braskas-final-aeon | 2000x1012 | +0.35 / +0.00 | +1.10 / -0.73 | 3 | 23..24 | 0 | 0.17 | 0.56 | {(80, -40): 3} | - / - / - |
| braskas-final-aeon | 2000x1012 | +0.35 / +0.00 | +1.20 / -0.79 | 3 | 12.8..29.9 | 0 | 0.17 | 0.59 | {(80, -40): 3} | - / - / - |
| braskas-final-aeon | 2000x1012 | +0.35 / +0.00 | +1.30 / -0.86 | 3 | 22.3..25.7 | 0 | 0.33 | 0.33 | {(0, -40): 3} | - / - / - |
| braskas-final-aeon | 2000x1012 | +0.35 / +0.00 | +1.45 / -0.96 | 3 | 24.2..32.7 | 0 | 0.17 | 0.59 | {(80, -40): 3} | - / - / - |
| braskas-final-aeon | 2560x1080 | +0.35 / +0.00 | +0.96 / -0.64 | 3 | 0..10 | 20 | 0.29 | 0.56 | {(0, 0): 3} | - / - / - |
| braskas-final-aeon | 2560x1080 | +0.35 / +0.00 | +1.10 / -0.73 | 3 | 13..26.2 | 0 | 0.29 | 0.57 | {(0, 0): 3} | - / - / - |
| braskas-final-aeon | 2560x1080 | +0.35 / +0.00 | +1.20 / -0.79 | 3 | 28.9..33.8 | 0 | 0.29 | 0.57 | {(0, 0): 3} | - / - / - |
| braskas-final-aeon | 2560x1080 | +0.35 / +0.00 | +1.30 / -0.86 | 3 | 22.8..25.7 | 0 | 0.29 | 0.57 | {(0, 0): 3} | - / - / - |
| braskas-final-aeon | 2560x1080 | +0.35 / +0.00 | +1.45 / -0.96 | 3 | 25.8..28.7 | 0 | 0.29 | 0.61 | {(0, 0): 3} | - / - / - |
| braskas-final-aeon | 2560x1440 | +0.35 / +0.00 | +1.15 / -0.76 | 3 | 21..38.8 | 0 | 0.17 | 0.49 | {(102, -58): 3} | - / - / - |
| braskas-final-aeon | 2560x1440 | +0.35 / +0.00 | +1.45 / -0.96 | 3 | 37.1..40.6 | 0 | 0.08 | 0.72 | {(102, -58): 3} | - / - / - |
| yunalesca | 1440x900 | -0.10 / +0.04 | +0.75 / -0.47 | 3 | 22.7..26.1 | 0 | 0.17 | 0 | {(58, -36): 3} | - / - / - |
| yunalesca | 1600x900 | -0.52 / +0.20 | +0.48 / -0.32 | 3 | 53.9..55.3 | 0 | 0.17 | 0 | {(128, -36): 3} | - / - / - |
| yunalesca | 1600x900 | -0.30 / +0.11 | +0.55 / -0.34 | 5 | 27.9..33.1 | 0 | 0.08 | 0 | {(128, -36): 5} | 0.08 / 0 / {(128, -36): 4} |
| yunalesca | 1600x900 | -0.30 / +0.11 | +0.65 / -0.40 | 2 | 37.7..45.3 | 0 | 0.17 | 0 | {(64, -36): 2} | 0.08 / 0 / {(128, -36): 4} |
| yunalesca | 1600x900 | -0.30 / +0.11 | +0.75 / -0.47 | 2 | 49.7..51 | 0 | 0.17 | 0 | {(64, -36): 2} | 0.08 / 0 / {(128, -36): 4} |
| yunalesca | 1600x900 | -0.25 / +0.09 | +0.65 / -0.40 | 2 | 33.3..35.3 | 0 | 0.17 | 0 | {(64, -36): 2} | 0.08 / 0 / {(128, -36): 4} |
| yunalesca | 1600x900 | -0.18 / +0.07 | +0.49 / -0.30 | 3 | 10.9..16.9 | 0 | 0.08 | 0 | {(128, -36): 3} | - / - / - |
| yunalesca | 1600x900 | -0.18 / +0.07 | +0.65 / -0.40 | 3 | 27.1..29.9 | 0 | 0.17 | 0 | {(64, -36): 3} | - / - / - |
| yunalesca | 1600x900 | -0.10 / +0.04 | +0.65 / -0.40 | 3 | 16.1..17.1 | 0 | 0.04 | 0 | {(64, -36): 3} | - / - / - |
| yunalesca | 1600x900 | -0.10 / +0.04 | +0.80 / -0.50 | 3 | 26.9..30.3 | 0 | 0.04 | 0 | {(64, -36): 3} | - / - / - |
| yunalesca | 1600x900 | +0.00 / +0.00 | +0.65 / -0.40 | 3 | 6..9 | 0 | 0.06 | 0 | {(64, -36): 3} | - / - / - |
| yunalesca | 1600x900 | +0.00 / +0.00 | +0.80 / -0.50 | 3 | 16.5..18.7 | 0 | 0.06 | 0 | {(64, -36): 3} | - / - / - |
| yunalesca | 2000x1012 | -0.10 / +0.04 | +0.65 / -0.40 | 3 | 14.3..17.9 | 0 | 0.06 | 0 | {(80, -40): 3} | - / - / - |
| yunalesca | 2000x1012 | -0.10 / +0.04 | +0.75 / -0.30 | 2 | 31.9..34.7 | 0 | 0.06 | 0 | {(80, -40): 2} | 0.13 / 0 / {(80, 0): 4} |
| yunalesca | 2000x1012 | -0.10 / +0.04 | +0.75 / -0.15 | 2 | 34.6..35.6 | 0 | 0.06 | 0 | {(80, -40): 2} | 0.13 / 0 / {(80, 0): 4} |
| yunalesca | 2000x1012 | -0.10 / +0.04 | +0.80 / -0.50 | 3 | 31.3..33.9 | 0 | 0.06 | 0 | {(80, -40): 3} | - / - / - |
| yunalesca | 2000x1012 | +0.00 / +0.00 | +0.80 / -0.50 | 3 | 18.5..20.5 | 0 | 0.06 | 0 | {(80, -40): 3} | - / - / - |
| yunalesca | 2560x1080 | -0.10 / +0.04 | +0.65 / -0.40 | 3 | 13.7..23.5 | 0 | 0.35 | 0 | {(0, 0): 3} | - / - / - |
| yunalesca | 2560x1080 | -0.10 / +0.04 | +0.80 / -0.50 | 3 | 33.9..38.9 | 0 | 0.33 | 0 | {(0, 0): 3} | - / - / - |
| yunalesca | 2560x1080 | +0.00 / +0.00 | +0.80 / -0.50 | 3 | 14.7..21.2 | 0 | 0.33 | 0 | {(0, 0): 3} | - / - / - |
| yunalesca | 2560x1440 | -0.10 / +0.04 | +0.75 / -0.47 | 3 | 40.5..46 | 0 | 0.04 | 0 | {(102, -58): 3} | - / - / - |

## CHECK (critic, Sonnet sub-agent, 2026-10-03; branch `r38-restage` at 24181cb1; I did not build it)

**Verdict: FAIL. Two blockers, both in Chapter III's staging. Chapter II passes on its own and could ship alone.** The table does what the handoff says for Chapter II (0 px2 of overlap at all
three menus in every run, 19 first-menu runs over six sizes and three seeds) and for Chapter III on seed 1, the one seed the handoff tested. Run on other seeds, the Chapter III fix is not stable.

**Per item of the brief.** 1 rest gap and painted overlap: Chapter II PASS, Chapter III FAIL (B1). 2 HUD, rail, cards, plate edges, lunges: PASS except the right pagoda (B1) and the arrival snap (B2), with disclosures D2, D6, D7. 3 other chapters and the phone unchanged: PASS. 4 FFX only, layering, no save: PASS. 5 code and gates: PASS.

### Blockers

**B1. Chapter III's staging does not hold: its first menu is clear on seed 1 only, and on other seeds the right pagoda can end up under the turn rail.** A run started from real keys draws a fresh
random seed (`src/app/runSeed.ts`); only the harness pins seed 1. Chapter III, 1600x900, first menu, branch against live, nine seeds (menu 1; boss x and right-pagoda x are world units, "pagoda under
panels" is CHK-011's own reading, the share of the pagoda's box under the HUD's declared panels, rule at most 25 %):

| seed | first menu is | live overlap px2 | branch overlap px2 | boss x | right pagoda x | right pagoda under panels |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Tidus | 201 | **0** (closest 22 to 25 px, three runs) | 3.84 to 3.88 | 5.74 | 20.4 % |
| 2 | Tidus | 2,534 | 209 (three runs: 209, 51, 137) | 2.88 | 5.02 | 1.2 % |
| 3 | **Auron** | 4,770 | **4,370** (three runs: 4,370, 3,149, 4,433) | 2.87 | 5.02 | 6.7 % |
| 4 | Tidus | 2,929 | 106 | 3.32 | **6.44** | **42.1 %** |
| 5 | Tidus | 2,428 | 281 | 2.72 | 4.86 | 0.1 % |
| 6 | Tidus | 2,670 | 159 | 2.85 | 5.04 | 1.5 % |
| 7 | Tidus | 2,122 | 684 | 2.60 | 4.75 | 2.8 % |
| 8 | Tidus | 740 | 272 | 2.79 | 4.91 | 0 % |
| 9 | **Yuna** | 4,367 | **1,716** | 2.64 | 4.82 | 0 % |

The table puts the boss at x 3.84 and the right pagoda at 5.74 (seed 1 keeps them there). On every other seed the formation is moved from there by `StageRelax` (the formation relaxation, which runs
while the field is staged): in eight seeds (2 to 9) the boss is pushed back 0.5 to 1.2 units (85 to 200 px) toward the party, and the party touches it again (a sliver, 106 to 684 px2, in the six where Tidus is first;
1,716 and 4,370 px2, 61 % and 8 % below live, in the two where Yuna or Auron is); in four of the 32 branch first menus (seed 4 at 1600x900, seed 3 at 1440x900, seed 2 at 2000x1012 and at 2560x1440) the right pagoda is shoved the other way (x 6.4 to 6.75) and
**42 to 46 % of it is under the HUD at the first menu, 28 to 51 % at the next two: CHK-011's 25 % rule fails on a fiend where live never has it** (live's right pagoda never exceeds 14.1 % in 62
readings; the branch's passes 25 % in 12 of 68, worst 51.1 %). A seed gives the same class of answer each time (seed 1 three runs: 0, 0, 0 px2; seed 2: 209, 51, 137; seed 3: 4,370, 3,149, 4,433, 3,154) though not the same numbers (seed 4 repeated: 423 px2 and no pagoda under the rail), so it is the battle and a little timing, not machine load. The mechanism is my reading of `StageRelax`, not traced frame by
frame: it separates any two fiends whose projected silhouettes overlap (the table's move changes the overlaps: the boss goes left, the right pagoda goes right) and nudges a targetable fiend off a panel
(`PANEL_CLEAR` 0.78), and how far that runs before the first menu opens differs from battle to battle; the builder's own note 7 on 1440x900 is the same pull at one size. The handoff's "24 of 24
runs clear" and its HUD tables are seed 1. Chapter II has no fiend under a panel and nothing pushes it (every Chapter II first menu: 0 px2, closest 23 to 47 px, three seeds).

**B2. A figure that arrives later snaps into its slot: 10 of 12 Chapter III switch-ins and summons, visible in 5 of 8 switches.** `Staging.write` reads an absolute x-only tween (the arrival slide) as a relaxation nudge and drops the
slot's x share until the figure is next re-seated (a z change). Measured: Yuna's SWITCH brings Wakka in at the stage's slot (x 0.22) and he steps +0.35 world units (58 px at 1600x900)
**129 to 416 ms later at alpha 0.56 to 1.0 in 5 of 8 samples** (2 snap at alpha 0.12 and are invisible, 1 lands in the shifted slot); live: 0 of 4. An auto-played Chapter III link 1 (12 arrivals: Lulu,
Tidus, Auron, Bahamut, Ifrit, Valefor and others): 10 snap on the branch, 0 on live. A summoned aeon snaps 81 to 173 ms into its 620 ms arrival (probably masked by the fade; its alpha was not read). In
Chapter II the slot is 0.10, so the snap is 16 px (negligible); Yunalesca's later forms land in the shifted slot at once. The handoff says a later arrival "stands in the same formation": it does under
`apply` in the unit test and not under a real arrival tween; `fx-mix-stage-table.test.ts` tests nudges and re-seats separately and never an arrival.

**What would make it pass.** (1) Take the relaxation out of the loop for a row's fiends (pin them the way `SceneSlots.enemySpots` pins a fiend, or apply the table after the relaxation has settled and
freeze it), or choose a move that leaves the panel clause and the overlap clause nothing to do; then re-run seeds 1 to 9 at 1600x900 and 1 to 3 at the four sizes: 0 px2 at menu 1 on every seed and
CHK-011 under 25 % on every fiend. (2) Let the relaxation hand its nudge to `Staging` instead of `Staging` guessing it from a position change, or apply the slot as a render offset; add a unit test with an x-only
absolute tween and an arrival, and re-run the switch and summon checks (`switch.mjs`, `summon.mjs` in my scratch folder). Neither reaches outside `src/engine/fx/mix` and `StageRelax`.

### What I ran

- **How.** Headless Chromium from node (Playwright, `PYREFLY_BROWSER=gpu`; the run read back an NVIDIA RTX 5070 Ti through ANGLE/D3D11), real keys from the title to the first command menu (the repo's own
  `critic/runner/lib` route walk), `__pyrefly.setSeed(n)` before the first key (CHK-015). Never the Chrome extension or the browser pane; one browser at a time; ports 6710 and 6711 only; the two servers
  I started were stopped by PID at the end. About 240 runs. The scripts and every raw reading are in `D:/Tools/pyrefly-scratch/2026-10-03/r38-restage-check/` (`cap/`, `out/`, `shots/`; not in the repo). The
  reading is my own re-implementation, checked against the builder's published numbers (they agree, see "Where I differ"): the Three scene and camera the renderer is drawing, each figure's painted pixels
  from its pose texture's alpha (>= 0.35, 96 x 144), a distance transform for the closest approach and the overlap, the product's own `hudPanels` list ported verbatim (rail, command list, party stats, other)
  plus the rail's own chips and portrait tiles, and CHK-011's `targeting()` reading.
- **Three builds.** *live*: https://baileypillon.github.io/pyrefly-reprise/, bundle `index-BGBDEn_P.js` (release 37, main cd9dbbb0) until **19:39 EDT, when release 37.1 (`index-DhiL5vEz.js`, main f4244e1f) replaced it while I worked**. Runs made before then are release 37 (first-menu seed 1 at the four core sizes, the intro, the target cursor, the extra sizes' seed 1, the first Overdrive pass); later ones are 37.1 (the drift cycle, links, summon, switch, seeds 2 and 3, the nine-seed sweep, the corrected Overdrives). The 37.1 diff is Chapter IX's opening and FFX-2 Trigger Happy (nothing in `src/engine/fx`, the presenter, the battle engine or Chapters II and III's scenes), and a direct pair (live, seed 1, 1600x900, both releases) agrees within run-to-run variance: Chapter II first menu -115 px and 1,959 px2 on 37, -111 and 1,630 on 37.1; Chapter III menu 2 3,626 and 3,792 px2; Chapter III's two first-menu states (party stepped in or not) show on both. *origin/main*: a pristine
  `git archive` of 3b1ed60f on a local dev server (`src`, `public`, `tools` identical to release 37). `origin/main` moved to f4244e1f while I worked (release 37.1: Chapter IX's opening, FFX-2 Trigger Happy
  input, `BattleScreen.ts` +2): nothing under `src/engine/fx`, the presenter or the battle engine, and `git merge-tree` against it is clean. *branch*: this worktree at the pushed tip on a local dev server.
  A local dev build opens the first menu before the camera's plan (plans committed at the menu: 0 on every origin/main run), so **live is the production baseline** for anything the plan moves; origin/main
  is shown only where it is informative.
- **Matrix.** Chapters II and III x 1600x900, 2000x1012, 2560x1440, 2560x1080, 1440x900, 1280x720 x seeds 1, 2, 3 x the first three menus (the seeds are repeats at menu 1, different battles at menus 2 and 3);
  Chapter III at 1600x900 on nine seeds and repeats; and, at 1600x900, the battle intro frame by frame, a lunge and both Overdrives (Swordplay and Bushido) in both chapters, the target cursor on every fiend part,
  the drift cycle, Chapter II's later forms and Chapter III's link 2, a switch and a summon, Ch I, VIII, IX, X, FFX-2 Ch IV, the phone at 390x844, Natus.

### 1. Rest gap and painted overlap (menus 1 to 3, six sizes, three seeds)

Pooled over the seeds (menu 1: repeats; menus 2 and 3: different battles); "median (min..max) nN". Painted overlap is px2 of a party member's painted pixels inside a fiend's; the closest approach is in px.

**First menu** (rest gap of the live frame in px; painted overlap in px2; closest painted approach in px):

**II Yunalesca (FFX)**

| size | live: gap | live: overlap | origin/main: overlap | branch: gap | branch: overlap | branch: closest approach |
| --- | --- | --- | --- | --- | --- | --- |
| 1600x900 | -107 (-115..-106) n3 | 1454 (1310..1959) n3 | 1887 (1833..1944) n3 | 1 n4 | 0 n4 | 25.6 (23.1..27.5) n4 |
| 2000x1012 | -125 (-126..-124) n3 | 2044 (2018..2206) n3 | 2096 n1 | 1 n3 | 0 n3 | 30.3 (29.2..30.3) n3 |
| 2560x1440 | -173 (-188..-170) n3 | 3789 (3299..4909) n3 | 4239 n1 | 1 n3 | 0 n3 | 46 (45.4..46.6) n3 |
| 2560x1080 | -136 (-140..-135) n3 | 2378 (2306..2782) n3 | 2663 n1 | 1 n3 | 0 n3 | 29.1 (27.1..31.7) n3 |
| 1440x900 | -108 (-109..-106) n3 | 1500 (1282..1589) n3 | 1848 n1 | 1 n3 | 0 n3 | 27 (24.1..28.5) n3 |
| 1280x720 | -86 (-92..-84) n3 | 900 (813..1229) n3 | 1244 n1 | 1 n3 | 0 n3 | 22.8 (20.2..23.2) n3 |

**III Braska's Final Aeon (FFX)**

| size | live: gap | live: overlap | origin/main: overlap | branch: gap | branch: overlap | branch: closest approach |
| --- | --- | --- | --- | --- | --- | --- |
| 1600x900 | -60 (-91..1) n3 | 2534 (201..4770) n3 | 663 (151..3039) n3 | 1 (-80..1) n3 | 209 (0..4370) n3 | 0 (0..25) n3 |
| 2000x1012 | -71 (-102..-70) n3 | 2993 (2724..6335) n3 | 233 n1 | 1 (-90..1) n3 | 76 (0..4141) n3 | 0 (0..29.5) n3 |
| 2560x1440 | -115 (-142..-65) n3 | 7084 (4519..10734) n3 | 355 n1 | 1 (-132..1) n3 | 160 (0..8047) n3 | 0 (0..34) n3 |
| 2560x1080 | -51 (-101..-50) n3 | 3307 (1106..4362) n3 | 236 n1 | 1 (-101..1) n3 | 75 (0..5696) n3 | 0 (0..26) n3 |
| 1440x900 | -44 (-90..-41) n3 | 2547 (1889..5974) n3 | 191 n1 | 1 (-80..1) n3 | 96 (65..3661) n3 | 0 n3 |
| 1280x720 | -50 (-73..-32) n3 | 1653 (1320..3254) n3 | 112 n1 | 1 (-64..1) n3 | 146 (0..2461) n3 | 0 (0..16.9) n3 |

**Menus 2 and 3** (painted overlap in px2):

**II Yunalesca (FFX)**

| size | menu 2 live | menu 2 branch | menu 3 live | menu 3 branch | menu 2 branch: closest | menu 3 branch: closest |
| --- | --- | --- | --- | --- | --- | --- |
| 1600x900 | 2162 (1950..2405) n3 | 0 n4 | 2031 (1458..2498) n3 | 0 n4 | 22.4 (21.9..25.5) n4 | 25.1 (24.1..27.9) n4 |
| 2000x1012 | 2382 (2321..2432) n3 | 0 n3 | 2162 (2095..3095) n3 | 0 n3 | 22.7 (21.3..24.1) n3 | 25.5 (22.3..30.9) n3 |
| 2560x1440 | 5317 (4632..5688) n3 | 0 n3 | 6416 (4679..6678) n3 | 0 n3 | 29.9 (28.5..32.7) n3 | 38.7 (21..42.7) n3 |
| 2560x1080 | 3500 (2713..3883) n3 | 0 n3 | 2583 (2426..3014) n3 | 0 n3 | 27.9 (22.7..31.3) n3 | 29.7 (26.2..31.7) n3 |
| 1440x900 | 2382 (2030..2558) n3 | 0 n3 | 2011 (1680..2061) n3 | 0 n3 | 22.3 (21.9..23.9) n3 | 25.5 (25..25.7) n3 |
| 1280x720 | 1422 (1127..1455) n3 | 0 n3 | 1112 (977..1117) n3 | 0 n3 | 16.5 (16.5..19.9) n3 | 21.8 (18.7..22.1) n3 |

**III Braska's Final Aeon (FFX)**

| size | menu 2 live | menu 2 branch | menu 3 live | menu 3 branch | menu 2 branch: closest | menu 3 branch: closest |
| --- | --- | --- | --- | --- | --- | --- |
| 1600x900 | 3626 (1864..3659) n3 | 1581 (0..1944) n3 | 3996 (2074..5101) n3 | 2135 (383..3496) n3 | 0 (0..4.4) n3 | 0 n3 |
| 2000x1012 | 3929 (2664..6840) n3 | 919 (39..960) n3 | 4401 (1239..5078) n3 | 755 (477..1743) n3 | 0 n3 | 0 n3 |
| 2560x1440 | 7992 (5599..13625) n3 | 1316 (0..1669) n3 | 12148 (9554..12245) n3 | 1422 (1286..3452) n3 | 0 (0..3.8) n3 | 0 n3 |
| 2560x1080 | 2009 (1606..6257) n3 | 656 (0..1044) n3 | 1915 (1686..2160) n3 | 937 (901..1017) n3 | 0 (0..16.4) n3 | 0 n3 |
| 1440x900 | 4174 (3923..4426) n3 | 1029 (997..2913) n3 | 4361 (3433..4439) n3 | 1331 (1126..1625) n3 | 0 n3 | 0 n3 |
| 1280x720 | 2127 (1330..2894) n3 | 1027 (1..1410) n3 | 2440 (943..2634) n3 | 686 (372..1657) n3 | 0 n3 | 0 n3 |

- **Chapter II: PASS.** First menu: the branch has +1 and 0 px2 in all 19 runs (closest approach 20 to 47 px); live -84 to -188 px and 813 to 4,909 px2. Menus 2 and 3: 0 px2 in every run of every size. Over a 30 s drift
  window at 1600x900 it never touches (0 of 38 frames, closest 11 px; live overlaps in 39 of 39, up to 2,483 px2). The later forms: form 2 is fixed (34 and 134 px2 against live's 5,354 and 11,953); **form 3, the
  final shape, is not: 16,516 px2 against 21,278 on live (1600x900)**, the zombified party is inside her on both builds (D4).
- **Chapter III: FAIL (B1).** On seed 1 the first menu is clear at the four core sizes (0 px2); across seeds it is not (table above and B1). Menus 2 and 3 are below live's median in every cell but not clear: menu 2
  0 to 2,913 px2 (live 1,330 to 13,625), menu 3 372 to 3,496 (live 943 to 12,245); Yuna's ready staff and the active member's pose keep touching. Over a 30 s drift window on seed 1 it touches in 7 to 10 of 31 to 37
  frames, at most 366 px2 (live: 37 of 37, up to 3,861).
- **1440x900 and 1280x720, Chapter III (the question the brief asked): a disclosure, not a blocker against live.** At 1440x900 the branch is never clear: first menu 65 to 3,661 px2 (median 96), menu 2 997 to 2,913,
  menu 3 1,126 to 1,625 (live 1,889 to 5,974, 3,923 to 4,426, 3,433 to 4,439): below live in every cell, so no regression, but it is the same pull as B1 and so part of it. At 1280x720 it is clear on seed 1 and
  touches on others (0 to 2,461). Chapter II is clear at both (0 px2, closest 16 to 28 px).

### 2. HUD, rail, cards, plate edges, lunges

- **Advisor card:** 0 px2 over any fiend and over any party member's painted pixels in every reading where it is up (Chapter II 111 readings, Chapter III 43).
- **Sensor card over fiends** (px2 of painted fiend, median over every reading): Chapter II 2,336 (live 3,096), max 6,609 (8,034); Chapter III 2,627 (2,798), max 7,677 (7,506). Lower in II, level in III (+0.7k to
  +2.1k px2 in some cells: 1600x900 menu 3 2,708 against 2,033; 2560x1440 menu 3 7,359 against 5,250).
- **Party under a panel** (painted share, max member, pooled): Chapter II median 0.070 (live 0.066), worst 0.265 (live 0.18); Chapter III 0.056 (0.046), worst 0.418 (0.398). The increases are cosmetic and listed in
  D6 (Yuna's staff ring under the ATTACK row at Chapter II 2560x1080; the tip of Tidus's blade under a command chip at Chapter III 2560x1080 menu 3: 0.133 against 0.045).
- **The turn rail over the right pagoda** (the brief's question, builder 57 to 70 % against live 30 to 56 %): reproduced as the product's own box share (0.59 to 0.74 on the branch, seed 1). Painted, on seed 1: 8 to 30 % of
  the pagoda's pixels are under the rail's own chips and tiles (live 0 to 14 %), the declared-panel share 13 to 20 % (live 0 to 14 %); the target cursor on Yu Pagoda B shows the bracket's right corners under the
  "Yu Pagoda" chips and the name plate relocated onto the boss's torso (legible; frames listed at the end). At 2000x1012 live already shows the same picture. **On seed 1 that is a disclosed cost (D2); on the seeds where
  the relaxation shoves the pagoda right it is B1.**
- **CHK-011** (`enemy-visibility.spec.ts`, 25 % of a fiend occluded or under a declared panel): Chapter II fiends worst 4.6 % (live 15.9 %), none over. Chapter III, 54 readings each: 17 over 25 % on the branch (worst 51.1 %) and 17 on live (worst 38.8 %). Branch: 6 the left pagoda behind Auron (26 to 30 %), **11 the right pagoda under the HUD (B1; 12 of
  68 counting the sweep runs)**. Live: 12 the left pagoda behind Auron (25 to 38 %), 5 the boss behind the pagodas and party (26 to 28 %), 0 the right pagoda. The party half fails on both builds and is
  unchanged (Auron 59 to 63 % behind Tidus and Yuna at Chapter III menu 1). `keyFeatureRects()` (CHK-008's faces and weapons) is empty for these two chapters on both builds: no reading.
- **Plate edge or void: PASS.** The product's own plate share is identical to live in every cell (0 at three sizes; 0.154 and 0.103 at 2560x1080 on both builds). The outer 8 px ring of 32 stills: the branch is within
  1.5 points of live on every side, no side above 10.3 % dark (Chapter III's scene is dark), none flat.
- **The battle's opening: PASS.** The chapter title card (opaque, "BATTLE START") covers the scene for about 2 s. The branch commits the table's move behind it (the plan was already in at my first read); live's plan
  lands as the card dissolves and the party steps 0.35 units in one frame (a pop that is already live's). The only motion the branch shows is the relaxation's slide of 0.14 to 0.19 units while the card fades.
- **Lunges (physical attack, Swordplay, Bushido, 1600x900, seed 1): PASS with one short stop.** Chapter II: Tidus's attack and Swordplay reach her (1,792 and 3,376 px2 against 12,272 and 13,696 deep inside on live;
  frames listed at the end); Auron's Bushido reaches both. Chapter III: Auron's Bushido reaches the boss (7,680 px2 at the apex; live 13,968); **Tidus's attack stops 42.6 px short at the first apex frame and his Swordplay 25.7 px short (live touches in
  both)**; the hit effect and the damage number still land on the target (D7).

### 3. Other chapters and the phone: PASS

Origin/main against the branch, 1600x900, first menu, real keys (`others.mjs`): **Ch VIII Evrae** 3 of 3 runs identical outcome on both (scale -1, lens (0, -36), blend 1, back 1.04), `stand` null, plan gap -284, 10.4 to 10.7k px2
on both (untouched; its own lane); **Ch X Natus** 3 of 3 identical on both (scale -1, lens (-64, 0)); **Ch I Flux** 3 of 3 identical on both, plans 0 at the menu on both (the "plan is late" pre-existing); **Ch IX Yojimbo** 5 runs each, the same two
outcomes on both builds (lens (0, 0) and (0, -36)), figures at the same world places; **FFX-2 Ch IV Bahamut** 5 runs each, the same set of outcomes on both (scale 0, 0.45, 0.7, 1), `stand` null, staging has plan entries only,
rest gap +1, 0 px2. **The phone, 390x844 touch, Chapters II and III, three runs each:** `data-phone-battle` set, `stand` null, `staging` empty, every party figure and Yunalesca at identical world places, the same camera
outcome in 3 of 3, rest gaps and overlaps within run-to-run noise (Chapter III's boss spread 0.57 units within one build, against a 0.095 difference between builds). **Natus option N**: 12 more runs on the branch (6 at 2000x1012,
6 at 2560x1440) each gave one outcome and 0 px2 of Sensor card over Natus; the builder's flips (2 of 10, 1 of 10) did not show in my 12, so I can neither confirm nor refute "not deterministic"; leaving N off is the
conservative reading of D-353 and I have no objection.

### 4. FFX only, layering, no save: PASS

See "Code, gates and rules" below. Measured: nothing changes in FFX-2 Ch IV (above), `standFor` answers only `game === 'ffx'` on desktop for a named boss, no save key or setting is written.

### 5. Code, gates and rules: PASS

- **Presentation only, FFX only.** The diff is five files: `stageTable.ts` (new, 131 lines), `staging.ts` (163), `framing.ts` (395), `framingReport.ts` (28) and `tests/unit/fx-mix-stage-table.test.ts` (348). Nothing under
  `src/battle/**`, `src/engine/BattlePresenter*.ts`, `src/data/**`, `src/app/**`, `public/`, `tools/` or any FFX-2 file changed (`git diff --stat b96b5f4d r38-restage`). `standFor` answers `game === 'ffx'` only, desktop only, and only
  for a fight whose fiend id matches a row (`/^yunalesca/`, `/^braskas-final-aeon/`); every other fight reads `{ side: null, report: null }` and reaches the old `Staging.write` (the 4,000-operation equivalence test passes).
  `stageTable.ts` imports `three` and reads `window` and `location`, which is allowed under `src/engine/fx/mix` (presentation; rule 1 binds `src/battle/**` and `BattlePresenter*.ts`). No save key, no setting, nothing written to
  storage (grep of the added lines: none).
- **Game case (rule 14)** is written in the commit, the file headers and the handoff: FFX only, with the source reading (`[absence]` in `research/battle-camera-perspectives.md`, our slot tables `[ours]`, FFX fixed
  formations). Measured, not only argued: FFX-2 Ch IV is unchanged (section 3).
- **House style.** Every changed source file under 400 lines (`framing.ts` 395: five lines of headroom, the next change there must extract first), strict TS with `noUncheckedIndexedAccess`, explicit `.ts` imports, no `any` or
  `@ts-ignore` in the added lines. `docs/CONTRACTS.md` lists none of the changed files, so rule 2 has no entry to make. `?stand=` is a checks-only query hook like the product's other ungated, non-persistent ones (`?cam=`, `?pace=`,
  `?wait=`, `?sfxmix=`).
- **`npx tsc --noEmit`**: exit 0, empty log, `stageTable.ts` in the program. **`tests/unit/fx-mix-stage-table.test.ts`**: 23 of 23. **`node tools/orphans.mjs`**: 1,204 modules, 24 orphaned (the expected 24; none under
  `src/engine/fx/mix`). **Full suite, once, `--maxWorkers=3`**: 774 files, 768 passed, 5 skipped, 1 failed; 11,295 tests passed, 41 skipped, 1 todo, 1 failed (490 s). The failure is `tests/unit/audio-manifest-io.test.ts`
  "serialises writers": `EPERM ... manifest.json.lock`, a Windows file-lock race in `tools/audio/manifest-io.mjs` under load, which this branch does not touch; alone it passes, 9 of 9, twice. The known Bahamut "heal-only route"
  test passed in this run.
- **Merge.** `git merge-tree --write-tree origin/main r38-restage` is clean. The unit test passes and the code is tidy; what it does not do is exercise the interaction that fails in B1 and B2 (the relaxation and a real arrival tween).

### Disclosures (carry into the release note; D1 and D2 want Bailey's eyes before a release)

- **D1. Chapter II is not literally option C.** The table moves the party -0.10 / +0.04 and the fiends +0.75 / -0.47; D-353's page said "party 0.5 left, boss 0.5 right" (the critic's judgement of the options: "one fixed move (party
  0.5 L, boss 0.5 R)"). In kind it is nearer B, the fiends carrying the move. The builder's reason (the party's half puts a member 8 to 17 % under the command list) and the one-line change are in the handoff, "For Bailey" 2.
  A pick approves only what Bailey names: show the picture (the builder's `docs/screenshots/r38-restage/yunalesca-1600x900-menu1-live-vs-branch.jpg`) and ask.
- **D2. Chapter III, seed 1: the right pagoda sits partly behind the rail.** Painted: 8 to 30 % of it under the rail's chips and tiles (live 0 to 14 %); the target cursor on Yu Pagoda B puts the bracket's right corners under the "Yu Pagoda"
  chips and moves the name plate onto the boss's torso. At 2000x1012 live already has the same picture. D-353 named "a smaller boss" and "the advisor card over the near pagoda" as the costs; this is a third. (B1 is where it passes 25 %.)
- **D3. Chapter III is not clear at later menus, and at 1440x900 it never clears (any seed).** Menu 2: 0 to 2,913 px2; menu 3 (Yuna's staff and the active member's pose): 372 to 3,496; both below live in every cell. At 1440x900 the first menu is 65 to 3,661 px2 (live
  1,889 to 5,974). Drift: 7 to 10 of 31 to 37 frames touch, at most 366 px2.
- **D4. PR-0310 stays open elsewhere.** Ch VIII Evrae: unchanged (plan gap -284 px, 10.4 to 10.7k px2; D-360's lane). Ch II form 3: 16,516 px2 against live 21,278. Ch III link 2: 5,520 against 6,993 (the table lets go there, `stand` null, as designed).
- **D5. Natus option N stays off.** Twelve more runs gave one outcome each; I cannot confirm the builder's flips, and see no reason to include it.
- **D6. Small HUD increases against live, cosmetic:** Chapter II 2560x1080 menu 1, Yuna's staff ring under the ATTACK row, 0.27 of her pixels against 0.16 (CHK-011's party reading 39.3 % against 31.7 %); Chapter II 2000x1012 menus 2 and 3, 0.10 against 0.07;
  Chapter III 2560x1080 menu 3, the tip of Tidus's blade under a command chip, 0.133 against 0.045; Sensor card over Chapter III fiends +0.7k to +2.1k px2 in several cells.
- **D7. One short lunge.** Chapter III, Tidus: his attack stops 42.6 px short of the boss at the first apex frame and his Swordplay 25.7 px short (live touches both); the hit effect and the number still land on the target. Everything else reaches.
- **D8. The fiends draw smaller**, as D-353 said they would: tallest part's box height 431 / 484 / 690 / 534 px against 444 / 498 / 709 / 550 in Chapter II (-2.7 to -2.9 %), 331 / 373 / 529 / 408 against 347 / 390 / 554 / 426 in Chapter III (-4.2 to -4.6 %) at
  1600x900 / 2000x1012 / 2560x1440 / 2560x1080.
- **D9. What I did not measure.** A production build of the branch (there is none yet; the dev server stands in, and the focused review of the production candidate owes it); a frame-by-frame trace of the relaxation behind B1; the alpha of a summoned
  aeon at its snap; Chapter III's links 3 and later.

### Where my numbers differ from the builder's

- "At the first menu ... 24 of 24 runs" and the HUD tables: seed 1 only (B1). On seed 1 I reproduce them: Chapter II closest approach 23 to 47 px (builder 26 to 39), Chapter III 25 / 30 / 34 / 26 px, advisor card 0 px2, Sensor card 1,965 / 2,311 / 5,181 / 4,199
  px2 (builder 1,990 / 2,255 / 4,992 / 4,288), plate shares identical (0, 0.154, 0.103), the phone and the five other chapters unchanged, the product's own fiend-under-HUD share 0.59 to 0.74 (builder 57 to 70 %).
- Live's Chapter III first menu has two states (the party stepped into the boss, thousands of px2, or not, 201 and 242 px2); the builder saw only the first in 24 of 24, I saw the milder one in 2 of 10 seed-1 live runs.
- The rail: the builder's 57 to 70 % is a box share; painted under the rail's own chips and tiles it is 8 to 30 % on seed 1 (and up to 78 % on the seeds where the pagoda is shoved right).
- The builder's 1440x900 note is menu 1 ("a hairline touch"); at menus 2 and 3 there it is 997 to 2,913 px2.
- Natus: my 12 runs gave one outcome each; the builder's ten runs at each of 2000x1012 and 2560x1440 gave two outcomes (8 and 2, 9 and 1).
- New, not in the handoff: B1's seed dependence, B2's arrival snap, CHK-011 on the right pagoda, Chapter II's form 3, the battle-opening frames, the lunge and Overdrive readings, the switch and summon.

### For the driver

- **How this relates to the ship rule** (`critic/RUBRIC.md` section 3): the branch is better than live in most cells and I found no critical defect, so on its own it would not be a HOLD. I fail it because its acceptance criterion (PR-0310 closed in Chapters II and III) is not
  met for Chapter III and the handoff's claim rests on one seed, and because B2 is a visible regression against live with a small fix. Taking Chapter II alone is a reasonable call; Chapter III should not go out described as fixed.
- **Chapter II alone passes** and could be released by removing the Chapter III row from `STAGE_TABLE` (the code answers "no row" with today's staging; the table test pins both rows and its list would need editing).
- To re-check a fix: `node cap/run.mjs --builds=live,branch --chapters=braskas-final-aeon --sizes=1600x900 --seeds=1,2,3,4,5,6,7,8,9 --turns=1 --tag=<x>-<build>` (one tag per build: two builds sharing a tag skip each other), `switch.mjs`,
  `summon.mjs`, `target.mjs` in `D:/Tools/pyrefly-scratch/2026-10-03/r38-restage-check/cap/`. The branch's Chapter III first menu has to reach 0 px2 on every seed (live: 201 to 4,770 px2 on seeds 1 to 9; the branch today: 0 on seed 1 only).
- Evidence frames, `docs/screenshots/r38-restage-check/` (live left, branch right unless said):
  `ch3-seed3-first-menu-live-vs-branch-1600x900.jpg` (B1: Auron first, the boss's blade across him on both);
  `ch3-target-yu-pagoda-b-live-vs-branch-1600x900.jpg`, `...-2000x1012.jpg` (live already has it), `...-2560x1440.jpg` (D2: the cursor on the right pagoda beside the rail);
  `ch3-battle-opening-title-card-branch-over-live.jpg` (the table's move lands behind the title card; live's party step lands as it dissolves);
  `ch3-tidus-attack-live-vs-branch-1600x900.jpg` and `ch2-tidus-attack-live-vs-branch-1600x900.jpg` (D7);
  `ch2-form3-live-vs-branch-1600x900.jpg` (D4); `ch2-2560x1080-menu1-live-vs-branch.jpg` (D6, Yuna's staff ring).

## Repair (one cycle, 2026-10-03 and 04; branch `r38-restage`): the CHECK's two blockers

The independent check above failed Chapter III on **B1** (its first menu was clear on seed 1 only; on other seeds the formation relaxation re-spread the fiends and the right pagoda could end under the turn rail) and **B2** (a figure that
arrives later snapped into its slot), and passed Chapter II. This section is the repair. The tables above ("In one screen", "Proof") are the builder's seed-1 readings of the first cut and stay as history; for Chapter III the readings
below replace them. Chapter II's row, numbers and pin are untouched by the repair.

**Game case (rule 14): FFX only** for what moves a figure (Chapter II's and Chapter III's rows, Chapter III's per-fiend moves). The sources are the ones in the header: where FFX seats the party and the fiends is `[absence]` in
`research/battle-camera-perspectives.md`, our slot tables are `[ours]`, FFX has fixed formations and no positional rule (`research/ffx-vs-ffx2-presentation.md` section 9), so a move changes the picture and never a rule. **Shared plumbing, both
games, measured to leave a fight with no row alone:** `roster.ts` (the mix sees a figure the frame it is added), `Staging.write`'s per-axis rule and `STAGE_HOLD_KEY` in `StageRelax`, a flag only a table fight sets (FFX-2 and the phone never read it).

### Verdict

- **Chapter III ships OFF; Chapter II ships alone.** `CHAPTER_III_STAGED` in `stageTable.ts` is `false`: one line turns Chapter III on, and the repaired row, its per-fiend moves, the hold and their tests stay in the branch. Switched off, Chapter III
  plays as on live and as on origin/main (checked: `stand` null, no staging on the fiends, the same plan outcome, the boss within 6 px of origin/main's on seeds 1, 3 and 9, see "Proof"). The repair brief's stop rule decides it (if B1 cannot be made seed-proof without changing the approved scene further, leave the row off behind one line so Chapter II ships alone): **B1 can be made
  seed-proof only by changing the scene further than the approved picture, and even then not for every frame of the camera's drift** (the next bullet). The picture is Bailey's to approve (rules 9 and 10): the stills and one number are under "For Bailey".
- **B1: the cause is traced and removed; the formation that clears the party is not the approved one.** The formation relaxation moved the table's fiends 0.5 to 1.2 units depending on the camera's first seconds (traced below). Held, with a move written
  down for each fiend, every figure stands at the same world place on every run (boss 5.042 / -8.91, left pagoda 2.002 / -7.54, right pagoda 5.362 / -8.623 on all 32 first menus below), and the party's painted overlap with any fiend at the
  first menu is **0 px2 in 32 of 32 runs** (12 seeds at 1600x900 and at 2000x1012, 4 random seeds at 2560x1440 and at 2560x1080; live 696 to 11,590 px2 in every one of its 18; the check read the first cut at 106 to 4,370 px2 on 8 of 9 seeds). Getting there
  took a bigger move than D-353's page showed: **the boss 3.0 right and 0.95 back (the page said 1.45 / 0.94)**; held rigid at +1.45 with the pagodas, the formation puts the pagodas in front of the boss's box (it reads 0.53 clear).
  Three things keep it from shipping as a fix:
  1. **Not every frame of the drift.** All 32 reads were taken 2.4 s after the menu opened, with the camera's idle drift at x +0.07 to +0.42, the half of its swing that favours the party. Over a whole 23 s drift cycle at 1600x900 a Yuna-first first menu
     (seed 9) touches the boss's blade in **17 of 40 frames, at most 524 px2** (seed 11, Tidus first with Yuna hurt and her staff raised: 5 of 32, at most 48 px2; Tidus first, seed 1: 0 of 55; Auron first, seed 3: 0 of 33; live seed 9: 31 of 31, up to
     2,744 px2). The same touch shows at the later Yuna menus: three of the four read touch (200, 55 and 378 px2, all with the camera at x -0.17 to -0.28; the fourth, at x +0.13, is clear). No number in the table clears it without a bigger cost: the boss
     at +3.4 leaves 4 of 33 frames (at most 38 px2), at +3.8 none, with up to 36 and 47 percent of its painted pixels under the turn rail (+3.0: 23; live 0).
  2. **Two readings are worse than live at +3.0:** the boss's back reaches the turn rail (5 to 24 percent of its painted pixels under the rail's panel column over the four sizes) and CHK-011 reads the boss 27 to 30 percent covered at three of the four sizes
     (0.70 to 0.73 clear against the rule's 0.75; 0.75 to 0.77 at 2560x1080; live 0.81 to 0.86).
  3. **The scene is a different picture:** the pagodas stand drawn in and 2.4 units further back (they draw 10 to 13 percent smaller, the boss 2 to 5), the left one 3.0 left of the boss and in front of it. Bailey has not seen it.
- **B2 is repaired** (every table fight, both chapters). A Switch-in stands on its slot with the table's move on it from its first frame: Wakka after Yuna's SWITCH appears at x 0.57 (alpha 0.01 to 0.03) and never steps, in 4 of 4 samples (seeds 1 to 4; the
  check saw a +0.35 step at alpha 0.56 to 1.0 in 5 of 8; live has no step of its own on a Switch-in). The auto-played Chapter III link 1 has 8 arrivals (Bahamut, Lulu, Ifrit, Ixion, Shiva, Valefor and the next link's Final Aeon and Valefor): **0 snapped** (the
  check: 10 of 12 on the branch, 0 on live; live here: 1, the possessed Valefor's 0.27 re-spread). Two unit tests that slide a figure in fail on HEAD's `staging.ts` and pass now; `fx-mix-roster.test.ts` pins the list.
- **Chapter II is unchanged and passes:** painted overlap **0 px2 in 16 of 16 first menus** (the 12 proof runs at four sizes, the two first menus of the later-menu runs, and two more on the final code with the switch off) and in 4 of 4 later menus, closest approach
  23.2 to 40.9 px at the first menu and 7.1 to 19.2 at the later ones (the check: 0 px2 everywhere, 20 to 47 px).

### The traced causes

Traced, not read: a dev server on the branch, headless GPU Playwright from node (never the Chrome extension or the browser pane), the page's own module instances wrapped from outside (`import('/src/engine/BattlePresenterStage.ts')` and the mix's
`framing.ts`, `staging.ts`; the source untouched): `PaintedStage.relaxFormation` (what it saw, what it moved, per call), `Framing.decide` and `commit`, `Staging.apply` (the roster it is handed) and `Staging.write`, and every animation frame's fiend, party and
camera positions, the settle window and the menu. Scripts: `D:/Tools/pyrefly-scratch/2026-10-03/r38-restage-repair/cap/` (`trace.mjs`, `trace-switch.mjs`, `instr.mjs`, `tr-sum.mjs`; raw readings in `out/*trace*.json`; not in the repo).

**B1: where the fiends end up depends on the camera's first seconds, not on the table.**

- `BattleScreen.update` runs the mix (`updateLivingScene`, where CHAPTER FRAMING commits the table) and then `settleFormation`, which calls `PaintedStage.relaxFormation` -> `StageRelax.relaxField` on every frame inside a 5 s window
  (`SETTLE_WINDOW_MS`, re-armed per link) in which the camera moved more than 0.02 or the field has not settled. The relaxation measures the projected rectangles of every staged figure against the camera of that frame and the HUD's declared panels, and pushes the
  fiends along world x until their silhouettes stop crossing (`CLEAR_ENOUGH` 0.8) and until a targetable fiend is 78 percent clear of the panels (`PANEL_CLEAR`).
- The table moved the pre-relaxation layout as one rigid formation (boss x 2.03 -> 3.49, pagodas 1.27 -> 2.73 and 3.33 -> 4.79). That is not a fixed point of the relaxation: the shifted pagodas stand in front of the boss's box (the boss reads 0.53 clear). The first
  `relaxFormation` call, in the very frame of the commit (the HUD still hidden, no panels declared yet), moved boss +0.484 / +0.488 / +0.492, left pagoda -1.446 / -1.448 / -1.450 and right pagoda +1.111 / +1.110 / +1.109 on seeds 1 / 4 / 3: the same on every seed,
  ending at boss 3.98, pagodas 1.29 and 5.90.
- After that the relaxation keeps running on every frame the camera moves (the opening dolly, z 10.2 to 8.0, and the idle drift, which is a function of the clock, not the seed) until the window ends, now with 18 panels declared. On seeds 1 and 4 nothing moved
  again. On seed 3 (Auron first) the boss read 0.77 clear under the pagodas and Yuna, and the right pagoda 33 to 45 percent under the rail's panels, and the two clauses fought for 900 ms: the panel clause nudged the right pagoda left by 0.5 and the separation clause
  nudged it right by 0.2, the boss left by 0.14 to 0.29, the left pagoda left by 0.58, ending boss 3.02 (0.96 left of the first call's), left pagoda 0.18, right pagoda 5.11. Where it stops is where the camera and the panels were when the window shut: 0.5 to 1.2 units on
  eight seeds of nine, the right pagoda shoved the other way on four first menus.
- A held formation does not do that: with the fix the same trace has boss 3.973, pagodas 1.283 and 5.892 for the whole opening on seeds 3 and 4, and every `relaxFormation` call logs `moved {}`.

**B2: the mix did not know the figure yet; and a second hazard in `Staging.write`.**

- Traced on a Switch (Yuna's menu, SWITCH to Wakka, seed 1): the stage added Wakka at t = 28,791 ms, alpha 0.03, at the stage's slot (x 0.22); `MaxMix` kept its list of painted figures from a scan every 0.5 s, so the list took him at 28,954 ms (163 ms later);
  `Staging.write` then made his record and added the slot, x 0.22 -> 0.57 in one frame at alpha 0.7. There is **no tween on his position at all**: the CHECK's reading ("an x-only arrival tween read as a nudge") is not what produced the snaps it measured; the
  0.5 s scan latency is.
- It is a real second hazard in `write`, though: an absolute write along x alone on a figure that carries slots was kept as the figure's new place with no slot (the old rule read it as a nudge by the relaxation: `movedX && !movedZ` with a slot standing), so a slide to the
  stage's slot ended in the slot without ours until the figure was next re-seated. A unit test that slides a figure in fails on HEAD's `staging.ts` (the figure ends at 0.22, not 0.57) and passes now.

### What changed (FFX only for the table; shared plumbing, both games, for the roster, the hold and the write rule)

- `src/engine/StageRelax.ts`: a figure whose `userData` carries `STAGE_HOLD_KEY` (`'pyrefly:stage-hold'`) is `fixed` for the relaxation, exactly as a `pinned` fiend (`enemySpots`) or a figure-less part: never moved, never measured. Nothing sets the flag outside a table fight.
- `src/engine/fx/mix/staging.ts` (206 lines): `Staging.hold(actors, on)` flags every fiend of the fight (never the party) and lets them go with the row; `Framing.update` calls it every frame from the first frame the mix sees the figures, so the relaxation (which runs in the
  same frame, after the mix) never moves a fiend the table stands, also on a slow load where the plan commits later. `write` now reads every write to an axis that is not ours as the stage's (a spot, `add`) or a tween's, in the stage's own coordinates, and puts the slot on top of it
  again, per axis (the old rule read an x-only write on a figure that carried slots as a relaxation nudge and kept it without the slots). The relaxation was the only writer that moves a figure by a step from where it stands; held figures are off its list. A fight with no row is
  bit-identical to before (the 4,000-operation test against a copy of the old function still passes). `Side.enemyBy` and `shiftOf`: a fiend a row names (by its combatant id, else its painted id) has a move of its own.
- `src/engine/fx/mix/roster.ts` (new, 54 lines) and `MaxMix.ts`: the mix's list of painted figures is marked stale the moment a figure is added to or leaves the scene (three's `childadded` / `childremoved`) and rescanned on the next update, which runs before the frame is
  drawn; the 0.5 s timer stays as the net for a figure added deeper in the graph.
- `src/engine/fx/mix/stageTable.ts` (184 lines): Chapter III's row has a move for the boss and one for each Yu Pagoda (`enemyBy`; the two pagodas paint one art, so it is the combatant id, `yu-pagoda-left` and `-right`, that tells them apart); **`CHAPTER_III_STAGED = false`** is the
  one-line switch (`ALL_ROWS` is every row, `STAGE_TABLE` the ones that play, `setStageTable` is the tests' and checks' seam); the checks-only `&standf=<id>:<right>,<toward>;...` plays a move per fiend (`?stand=<4 numbers>&standf=...`). `framingReport.ts`: `stand.by` lists them.
  `framing.ts` (398 lines, two under the limit: the next change there must extract first): one line (the hold call) and one in `dispose`.
- Not changed: Chapter II's row (Yunalesca is already `enemySpots`-pinned, so the hold changes nothing for her), the party's move, FFX-2, the phone (`standFor` answers null there: no row, no hold), `StageRelax`'s behaviour for every fiend nothing holds, the engines, the save, the settings.
  Chapter III's table row, `?stand=` and the tests read the same whether or not the switch plays it.

### Chapter III's formation, written down (plays only when the switch is on)

One move per fiend, in world units along the screen's axes from today's resting rig (`+` right / toward the camera), from the stage's own layout (`applyFormation`: boss 2.03 / -8, left pagoda 1.27 / -5.15, right pagoda 3.33 / -6.25; the same on every run now that nothing re-spreads it):

| figure | move (right / toward) | world move (x / z) | stands at (x / z) | why |
|---|---|---|---|---|
| party (all three) | +0.35 / 0 | +0.35 / +0.005 | Tidus -1.12 / 1.605, Auron -0.45 / -0.995, Yuna 0.57 / 1.555 | unchanged from the first cut: where the old plan's usual step put them, clear of the command list |
| Braska's Final Aeon | +3.0 / -0.95 | +3.012 / -0.910 | 5.042 / -8.910 | far enough right that Yuna's ready staff clears its blade at the first menu in the favourable half of the drift (at her later turns, and in the other half, it still brushes it) |
| Yu Pagoda, left | +0.7 / -2.4 | +0.732 / -2.396 | 2.002 / -7.540 | stands off the party's heads (back) and, right up to the boss's box, off Yuna's raised staff (hurt pose: its tip was 0 to 8 px under the pagoda's base) |
| Yu Pagoda, right | +2.0 / -2.4 | +2.032 / -2.373 | 5.362 / -8.623 | drawn in and back so it stays off the turn rail (0 to 12 percent of it under a panel; live up to 6 here) |

How the numbers were found, not guessed: with the fiends held, the plan decides on the formation that will actually play, so every earlier tuning (made with the relaxation moving them after the plan) had to be redone. The first cut's settled seed-1 formation (boss +1.95, left pagoda 0.0, right pagoda +2.57)
written down as it was gave a worse plan, not the old picture: the right pagoda at the rail edge made the plan give up the +64 px lens shift that keeps Tidus off the command list, and a member read 37 percent under it (live: up to 11). So the rail, the command list and the three first-menu poses had to be solved together. The search
(`fsweep.mjs`, scratch) plays one formation per page through the product's own override -> `decide` -> `commit`, at the camera drift's two extreme phases, over Tidus first (seed 1), Auron first (seed 3) and Yuna first (seed 9); about 120 formations at 1600x900, the finalists end to end by real keys. The three levers that mattered:
the boss's right move (Yuna-first clears at +2.9 or more at the favourable phase; at +2.7 the staff brushes the blade for 66 to 319 px2; each 0.1 more puts about 2.5 points more of the boss under the rail's column, 1.3 under its chips), the left pagoda's right move (0.7 is the largest that leaves the boss's box alone,
and clears Yuna's raised staff; 0.9 starts to cover the boss) and the right pagoda's depth (2.4 back halves its share under the rail against 1.6). The search planned each formation at the phase it pinned; the shipped plan is made once and the drift then moves on, which is why the whole-cycle readings below are the ones that count.

### Proof: Chapter III's first menu, per seed (branch with Chapter III switched on; headless GPU, real keys; live = release 37.1 on Pages)

Real keys from the title to the first command menu, `__pyrefly.setSeed(n)` before the first key (CHK-015), read 2.4 s after the menu opens (`inpage2.measure`: painted overlap and closest approach from each figure's own pose texture; CHK-011's `targeting()` coverage; the share of a
member's painted pixels under the HUD's panels). "Rest gap" is the product's own metric: plan = the gap the camera's plan decided on, frame = the live frame read (positive = nobody stands inside a fiend's painted shape; it saturates at +1). The first menu opens on Tidus in most seeds, on Auron in seed 3,
on Yuna in seeds 9 and 218. Seeds 11 and 12 start with Yuna hurt (her low-HP idle: the staff raised, 30 px taller than her normal pose), which is where the left pagoda's base used to touch her.

**One caveat on every table below: one frame, one drift phase.** The 32 reads were taken with the camera's idle drift at x +0.07 to +0.42 (the drift swings -0.47 to +0.54 over about 23 s). That is the favourable half for Yuna's ready staff; the whole-cycle readings are in "The drift cycle" below.

**1600x900, seeds 1 to 12**

| seed | first menu | live: overlap px2 | live: rest gap | branch: overlap px2 | branch: closest px | branch: rest gap (plan / frame) | right pagoda under panels, live / branch | boss clear (CHK-011), live / branch | a member under HUD, live / branch |
|---|---|---|---|---|---|---|---|---|---|
| 1 | tidus | 1171 | -62 / 1 | 0 | 48.1 | 14 / 27 | 0.06 / 0.03 | 0.82 / 0.72 | 0.11 / 0.05 |
| 2 | tidus | 1977 | -43 / -41 | 0 | 49.5 | 14 / 29 | 0.01 / 0 | 0.86 / 0.7 | 0.03 / 0.05 |
| 3 | auron | 4609 | -44 / -90 | 0 | 39.9 | 14 / 8 | 0.01 / 0.06 | 0.82 / 0.73 | 0.06 / 0.03 |
| 4 | tidus | 1461 | -43 / -64 | 0 | 58.3 | 14 / 27 | 0.01 / 0.01 | 0.84 / 0.71 | 0.03 / 0.06 |
| 5 | tidus | 2385 | -43 / -62 | 0 | 54.7 | 14 / 29 | 0.01 / 0.01 | 0.86 / 0.7 | 0.04 / 0.05 |
| 6 | tidus | 3476 | -43 / -69 | 0 | 42 | 14 / 16 | 0.01 / 0 | 0.85 / 0.71 | 0.04 / 0.05 |
| 7 | tidus | 2418 | -43 / -42 | 0 | 44.8 | 14 / 26 | 0.02 / 0.06 | 0.84 / 0.72 | 0.04 / 0.06 |
| 8 | tidus | 2619 | -62 / -42 | 0 | 53.3 | 14 / 28 | 0 / 0.01 | 0.84 / 0.7 | 0.1 / 0.05 |
| 9 | yuna | 4087 | -43 / -71 | 0 | 15 | 14 / 1 | 0 / 0 | 0.82 / 0.72 | 0.01 / 0.01 |
| 10 | tidus | 696 | -44 / -41 | 0 | 47.7 | 14 / 26 | 0.01 / 0 | 0.82 / 0.7 | 0.05 / 0.05 |
| 11 | tidus | 1516 | -43 / -88 | 0 | 21.1 | 14 / 1 | 0.01 / 0.07 | 0.84 / 0.73 | 0.02 / 0.02 |
| 12 | tidus | 1600 | -44 / -91 | 0 | 25.8 | 14 / 1 | 0.01 / 0.07 | 0.84 / 0.72 | 0.03 / 0.03 |

branch 12 runs: overlap 0 in 12, closest 15 to 58.3 px, right pagoda under panels up to 0.07, boss clear 0.7 to 0.73, a member under HUD up to 0.06; live 12 runs: overlap 696 to 4609 (median 2385), right pagoda under panels up to 0.06, boss clear 0.82 to 0.86, a member under HUD up to 0.11

**2000x1012, seeds 1 to 12** (live read on two seeds only)

| seed | first menu | live: overlap px2 | live: rest gap | branch: overlap px2 | branch: closest px | branch: rest gap (plan / frame) | right pagoda under panels, live / branch | boss clear (CHK-011), live / branch | a member under HUD, live / branch |
|---|---|---|---|---|---|---|---|---|---|
| 1 | tidus | 2856 | -49 / -47 | 0 | 60.8 | 16 / 27 | 0 / 0.05 | 0.84 / 0.7 | 0.09 / 0.05 |
| 2 | tidus | n/a | n/a | 0 | 57.2 | 16 / 28 | n/a / 0.01 | n/a / 0.7 | n/a / 0.06 |
| 3 | auron | 3168 | -51 / -90 | 0 | 40.6 | 16 / 12 | 0 / 0.07 | 0.82 / 0.72 | 0.08 / 0.06 |
| 4 | tidus | n/a | n/a | 0 | 50.5 | 16 / 29 | n/a / 0.01 | n/a / 0.7 | n/a / 0.07 |
| 5 | tidus | n/a | n/a | 0 | 59 | 16 / 30 | n/a / 0.01 | n/a / 0.7 | n/a / 0.05 |
| 6 | tidus | n/a | n/a | 0 | 54.3 | 16 / 14 | n/a / 0.01 | n/a / 0.7 | n/a / 0.04 |
| 7 | tidus | n/a | n/a | 0 | 54.7 | 16 / 32 | n/a / 0.08 | n/a / 0.71 | n/a / 0.07 |
| 8 | tidus | n/a | n/a | 0 | 61.8 | 16 / 26 | n/a / 0.02 | n/a / 0.7 | n/a / 0.04 |
| 9 | yuna | n/a | n/a | 0 | 15 | 16 / 1 | n/a / 0.02 | n/a / 0.72 | n/a / 0 |
| 10 | tidus | n/a | n/a | 0 | 60.8 | 16 / 27 | n/a / 0.01 | n/a / 0.7 | n/a / 0.04 |
| 11 | tidus | n/a | n/a | 0 | 33.6 | 16 / 1 | n/a / 0.1 | n/a / 0.71 | n/a / 0.02 |
| 12 | tidus | n/a | n/a | 0 | 29.3 | 13 / 1 | n/a / 0.12 | n/a / 0.71 | n/a / 0.07 |

branch 12 runs: overlap 0 in 12, closest 15 to 61.8 px, right pagoda under panels up to 0.12, boss clear 0.7 to 0.72, a member under HUD up to 0.07; live 2 runs: overlap 2856 to 3168 (median 3168), right pagoda under panels up to 0, boss clear 0.82 to 0.84, a member under HUD up to 0.09

**2560x1440, four random seeds (934, 218, 165, 17)**

| seed | first menu | live: overlap px2 | live: rest gap | branch: overlap px2 | branch: closest px | branch: rest gap (plan / frame) | right pagoda under panels, live / branch | boss clear (CHK-011), live / branch | a member under HUD, live / branch |
|---|---|---|---|---|---|---|---|---|---|
| 934 | tidus | 5590 | -70 / -65 | 0 | 88.7 | 23 / 50 | 0.01 / 0.02 | 0.83 / 0.71 | 0.04 / 0.05 |
| 218 | yuna | 11590 | -69 / -126 | 0 | 30 | 23 / 9 | 0 / 0.06 | 0.81 / 0.72 | 0.01 / 0.01 |
| 165 | tidus | n/a | n/a | 0 | 82 | 23 / 38 | n/a / 0.01 | n/a / 0.7 | n/a / 0.05 |
| 17 | tidus | n/a | n/a | 0 | 85.9 | 23 / 39 | n/a / 0.01 | n/a / 0.7 | n/a / 0.04 |

branch 4 runs: overlap 0 in 4, closest 30 to 88.7 px, right pagoda under panels up to 0.06, boss clear 0.7 to 0.72, a member under HUD up to 0.05; live 2 runs: overlap 5590 to 11590 (median 11590), right pagoda under panels up to 0.01, boss clear 0.81 to 0.83, a member under HUD up to 0.04

**2560x1080, the same four seeds**

| seed | first menu | live: overlap px2 | live: rest gap | branch: overlap px2 | branch: closest px | branch: rest gap (plan / frame) | right pagoda under panels, live / branch | boss clear (CHK-011), live / branch | a member under HUD, live / branch |
|---|---|---|---|---|---|---|---|---|---|
| 934 | tidus | 3377 | -54 / -50 | 0 | 58 | 10 / 36 | 0 / 0 | 0.82 / 0.76 | 0.39 / 0.38 |
| 218 | yuna | 1909 | -54 / -88 | 0 | 20 | 10 / 4 | 0 / 0 | 0.82 / 0.77 | 0.22 / 0.36 |
| 165 | tidus | n/a | n/a | 0 | 66.4 | 10 / 31 | n/a / 0 | n/a / 0.75 | n/a / 0.42 |
| 17 | tidus | n/a | n/a | 0 | 67.9 | 10 / 39 | n/a / 0 | n/a / 0.75 | n/a / 0.4 |

branch 4 runs: overlap 0 in 4, closest 20 to 67.9 px, right pagoda under panels up to 0, boss clear 0.75 to 0.77, a member under HUD up to 0.42; live 2 runs: overlap 1909 to 3377 (median 3377), right pagoda under panels up to 0, boss clear 0.82 to 0.82, a member under HUD up to 0.39

Notes on the columns. The closest approach is the painted distance between a party member and any fiend part, in px of that size's frame: it swings by tens of px with the camera's drift (the party and the boss are at different depths, so a camera x between 0.07 and 0.38 moves one against the other) and with the member's pose,
which is why the same formation reads 15 px when Yuna is first and 62 px when Tidus is. Live's plan gap is negative in all 18 of its runs (-43 to -70 px; 18 because one 2000x1012 run did not reach the board) and its frame reading is +1 in 1 of the 12 at 1600x900 (the check's two live states: the party stepped into the boss, or not). At 2560x1080 a member stands 36 to 42 percent under the command list on the branch and 39 percent on live (the same party move; it is the first menu of an
ultrawide frame, not this repair). The right pagoda's share under a panel is at most 0.12 on the branch (live, same seeds: at most 0.06; the check's 62 live readings: at most 0.141; CHK-011's rule 0.25); the boss's CHK-011 clear share is the cost named under "What switching Chapter III on costs".

### Chapter II (unchanged), first menus and later menus

16 first menus: 6 seeds at 1600x900, 2 at each of 2000x1012, 2560x1440 and 2560x1080, the first menus of the two later-menu runs, and 2 more on the final code with the switch off: painted overlap **0 px2 in 16 of 16**, closest approach 23.2 to 29.9 px (1600x900), 27.7 to 29.1 (2000x1012), 35.5 to 40.9 (2560x1440), 30.1 to 32.2 (2560x1080), rest gap +1 plan and
frame everywhere, a member under the HUD at most 0.05 (0.25 at 2560x1080; the check: 0.33 on both builds). Later menus, seeds 1 and 3 at 1600x900 (menus 2 and 3, where Yuna's ready staff is out): **0 px2 in 4 of 4**, closest 7.1 to 19.2 px. The check read 0 px2 at every Chapter II menu and 20 to 47 px at the first. The row, the pin (`enemySpots`) and
`Staging.hold`'s effect on her (none: a pinned fiend is already fixed) are unchanged.

### Arrivals and a Switch (B2), Chapter III link 1

- **Switch (seeds 1 to 4, 1600x900, real keys: Yuna's menu, SWITCH, Wakka):** Wakka appears at x 0.57 (alpha 0.03, 0.01, 0.03, 0.03) and never steps. The check read a +0.35 step 129 to 416 ms later at alpha 0.56 to 1.0 in 5 of 8. Live (seed 1): the party's own step cut (-0.7 for all three) at 2.07 s, then Wakka appears at x 0.22, alpha 0, no step.
- **Auto-played link 1** (`links2.mjs` then `arrivals.mjs`, seed 1): branch 8 arrivals, **0 snapped** (Bahamut, Lulu, Ifrit, the next link's Final Aeon, Ixion, Shiva, Valefor, the link's Valefor); live 8 arrivals, 1 snapped (the possessed Valefor, 0.27 at 289 ms; it is live's own re-spread).
- **The link change** (link 1 to 2: the Final Aeon falls, Valefor is the boss): with the switch on the table lets go, `stand` null; link 2 reads 6,601 px2 against live's 7,291 (both touch: link 2 is not staged, D4). The largest single-frame step in the whole fight is a pagoda moving 2.39 units in depth when the table lets go (live: a pagoda moves 1.07 in x at the same moment).

### Later menus (Chapter III with the switch on, seeds 1, 3 and 9 at 1600x900, menus 1 to 3)

| seed | menu | who is up | painted overlap px2 | closest px | camera x | member under HUD | boss under the rail | boss clear (CHK-011) |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Tidus | 0 | 54.7 | +0.34 | 0.04 | 0.165 | 0.71 |
| 1 | 2 | Auron | 0 | 21.2 | +0.06 | 0.10 | 0.142 | 0.72 |
| 1 | 3 | Yuna | **200** | 0 | -0.28 | 0.01 | 0.065 | 0.73 |
| 3 | 1 | Auron | 0 | 34.5 | +0.30 | 0.04 | 0.141 | 0.73 |
| 3 | 2 | Yuna | **55** | 0 | -0.17 | 0.00 | 0.070 | 0.72 |
| 3 | 3 | Yuna | **378** | 0 | -0.26 | 0.02 | 0.073 | 0.72 |
| 9 | 1 | Yuna | 0 | 21 | +0.16 | 0.01 | 0.114 | 0.72 |
| 9 | 2 | Auron | 0 | 25 | -0.33 | 0.12 | 0.049 | 0.74 |
| 9 | 3 | Yuna | 0 | 16 | +0.13 | 0.02 | 0.134 | 0.69 |

Menus 2 and 3 touch at 55 to 378 px2 in 3 of 6 (the first cut: 467 to 1,227 at menu 3; live at 1600x900, the check: menu 2 1,864 to 3,659, menu 3 2,074 to 5,101). Every touch is a Yuna turn with the camera at x -0.17 to -0.28: the drift again, not the seed. The camera is re-planned with the real panels from menu 2 (`replans`), which gives back a few px
of the clearance the first plan had.

### The other chapters and the phone (origin/main f3389dfc against the branch, 1600x900, first menu, real keys, seed 1; the branch's Chapter III row on or off changes none of them)

| chapter | origin/main | branch |
|---|---|---|
| I Flux | plans 0 at the menu in 5 of 6 runs (the known plan-late race on a fast load; 1 run had the plan in), 0 px2 | plans 0 in 6 of 6, 0 px2 |
| VIII Evrae | plan gap -283, 10,674 px2 (its own lane, D-360) | -284, 10,625 px2: identical outcome |
| IX Yojimbo | plan gap 11, closest 14.4 px, 0 px2 | 9, 14 px, 0 px2 |
| X Natus | closest 17.6 px, 0 px2 | 15.9 px, 0 px2 |
| FFX-2 IV Bahamut | 6 runs, rest gap +1, 0 px2, closest 10 to 20.7 px | 6 runs, +1, 0 px2, 14.4 to 31.3 px, `stand` null |
| phone 390x844, Chapters II and III, 2 runs each | `staging` empty, every figure at the same world place (Chapter III's pagodas differ by at most 0.1 between runs of one build) | `stand` null, `staging` empty, the same places |

### The drift cycle (the frame is not still) and a lunge, Chapter III with the switch on, 1600x900

The first menu, read every 0.6 to 0.7 s for 25 s (`drift.mjs`: camera drift, breathing and all; the whole 23 s cycle). "Touching" = any painted overlap between a party member and a fiend.

| run | frames | touching | at most px2 | closest (min) px | boss under the rail (max) | boss CHK-011 clear (range) |
|---|---|---|---|---|---|---|
| seed 1, Tidus first | 55 | **0** | 0 | 19 | 0.26 | not kept |
| seed 3, Auron first | 33 | **0** | 0 | 16.9 | 0.23 | 0.71 to 0.75 |
| seed 9, Yuna first | 40 | **17** | **524** | 0 | 0.23 | 0.71 to 0.74 |
| seed 11, Tidus first, Yuna hurt | 32 | **5** | 48 | 0 | 0.19 | 0.72 to 0.76 |
| seed 9 with the boss at +3.4 (`?stand=`) | 33 | 4 | 38 | 0 | 0.36 | 0.64 to 0.72 |
| seed 9 with the boss at +3.8 (`?stand=`) | 33 | **0** | 0 | 6.7 | 0.47 | 0.61 to 0.70 |
| live, seed 1 | 54 | 54 | 3,743 | 0 | 0 | not kept |
| live, seed 9 | 31 | 31 | 2,744 | 0 | 0 | 0.80 to 0.87 |

On seed 9 the touch begins when the camera passes x -0.1 on its way left and ends when it is back past -0.1, about 10 s of the 23: the party and the boss stand at different depths, so a camera to the left slides Yuna's ready staff over the boss's blade. (The seed-9 run on the production bundle read 454 px2 for the same reason: its first read fell at camera x -0.41.)

**Lunge** (Tidus's physical attack, seed 1): the lunge is a fixed 1.4 units and the boss now stands 3 units right, so at the apex he is **77.2 px short** of the boss (the first cut 42.6; live: he reaches it, 0 px). The hit effect and the number still land on the target.

### What switching Chapter III on costs (and what it does not fix)

1. **The boss stands further right than any number on Bailey's page.** D-353's page says "boss 1.45 right, 0.94 back"; the first cut's formation, after the relaxation had re-spread it on seed 1, had the boss about 1.95 right; the row has it **3.0 right, 0.95 back**. Why: with the fiends held, the plan measures the formation that will play, and Yuna's
   ready staff clears the boss's blade at the first menu only from about +2.9. It is a bigger move than the page showed: **Bailey should see the stills before Chapter III goes out** (`docs/screenshots/r38-restage-repair/`, live left and the switched-on branch right, seeds 1, 3 and 9).
2. **The boss's back reaches the turn rail.** Its painted pixels under the rail's panel column: 11 to 18 percent at 1600x900, 14 to 24 at 2000x1012, 15 to 19 at 2560x1440, 5 to 6 at 2560x1080 (up to 23 over the drift at 1600x900); under the rail's opaque chips and portrait tiles: 6 to 8.5, 7 to 12, 7 to 8, 1.5 to 4 percent. Live and the first cut: 0.
3. **CHK-011 on the boss reads worse than live.** 18.6 to 20 percent of its box is covered by the right pagoda's box and 8 to 11 more is under panels (4 to 5 at 2560x1080): **0.70 to 0.73 clear** (0.75 to 0.77 at 2560x1080) against live's 0.81 to 0.86 and the first cut's 0.835 (live reads 0.72 to 0.74 on the boss in 5 of the check's 54
   readings). By the check's own 25 percent rule the branch's boss fails at three of the four sizes on every first menu, by 2 to 5 points. What improved: the right pagoda (0 to 12 percent hidden; the first cut's up to 51) and the left pagoda (0 to 0.4 percent; live hides it 9 to 35 percent behind Auron).
4. **A Yuna-first menu still brushes the boss for part of the drift, and Yuna's later turns do** (tables above): 17 of 40 frames at most 524 px2 on seed 9; 3 of 4 later Yuna turns at 55 to 378 px2. Tidus-first and Auron-first first menus are clear through the whole cycle (0 of 55, 0 of 33). Live touches in every frame.
5. **The formation is compact, not the flanking spread.** The relaxation used to spread the pagodas to the boss's flanks (live: the left pagoda 2.6 to 3.3 left of the boss and the right one 2.2 right, by seed); held, the left pagoda stands 3.0 left of the boss and in front of it, the right one 0.3 beside it and 0.3 nearer. The first cut was not rigid either (its settled seed-1
   formation: boss +1.95, left pagoda 0.0, right pagoda +2.57). Both pagodas stand 2.4 units further back than the stage put them, so they draw 10 to 13 percent smaller than live (box height 199 and 184 px against 221 and 211 on seed 1, 1600x900; the boss 334 against 343).
6. **A lunge stops short:** Tidus's attack 77.2 px short of the boss at the apex (live reaches it).
7. **One path puts a table fiend back on the stage's own layout:** switching CHAPTER FRAMING off in the middle of the fight (the EYE CANDY page). The slots go back as before, but the relaxation's 5 s window is long over, so the fiends stand where `applyFormation` put them (the pagodas in front of the boss). Before the repair the relaxed positions
   survived the switch. Switched off before the battle starts, nothing is held and the relaxation runs as on live. The same let-go happens when the boss falls (the slots follow the chapter's boss): `links2` saw a pagoda step 2.39 units in depth in that frame.
8. **Not a seed effect, not fixed:** the first menu's closest approach swings by tens of px with the camera's drift and with the member's pose (the drift table).

**The one number, and what it buys** (`enemy.right` in Chapter III's row; seed 9, Yuna first, 1600x900 over the whole drift cycle unless noted):

| boss right | what it does | boss under the rail (panel column) | boss CHK-011 clear | Yuna-first first menu, frames touching |
|---|---|---|---|---|
| live (no row) | the party stands in the boss at rest | 0 | 0.80 to 0.87 | 31 of 31, up to 2,744 px2 |
| +1.95 (first cut's settled seed-1 formation, relaxation-dependent) | Yuna-first first menu 1,000 to 1,716 px2 | 0 | 0.835 | not measured |
| +2.7 | Yuna-first first menu 66 to 319 px2 (one frame) | 9 (3 under the chips) | 0.73 to 0.77 | not measured |
| **+3.0 (the row)** | first menu 0 px2 in the favourable half of the drift | 11 to 24 (6 to 12 under the chips) | 0.70 to 0.74 | **17 of 40, up to 524 px2** |
| +3.4 | | up to 36 | 0.64 to 0.72 | 4 of 33, up to 38 px2 |
| +3.8 | clear over the whole cycle (closest 6.7 px) | up to 47 | 0.61 to 0.70 | 0 of 33 |

### How it was read (the harness is scratch, not in the repo)

`D:/Tools/pyrefly-scratch/2026-10-03/r38-restage-repair/cap/`: `run.mjs` (real keys from the title to the first menu, `__pyrefly.setSeed(n)` before the first key, CHK-015; the in-page reading of `inpage2.mjs`: painted overlap and closest approach from the figures' own pose textures, CHK-011's `targeting()` coverage, HUD shares), `drift.mjs` (the
first menu read every 0.6 to 0.7 s for a whole drift cycle), `switch.mjs`, `links2.mjs` + `arrivals.mjs`, `phone.mjs`, `others.mjs`, `trace.mjs` / `trace-switch.mjs` / `instr.mjs` (the traces), `fsweep.mjs` (the formation search: one real-keys walk, then each formation played in the same page through the product's own override -> `Framing.decide` -> `commit`, or only
moved on the plan the shipped path made; `--pin=T` holds the drift's clock), `tables.mjs` / `docs-tables.mjs` (the tables above). Headless Chromium with the GPU (RTX 5070 Ti through ANGLE/D3D11), Playwright from node, `PYREFLY_BROWSER=gpu`; never the Chrome extension or the browser pane; one browser at a time; ports 6860 (this branch, dev server, HMR off), 6861 (a pristine `git archive` of
origin/main f3389dfc, `src` and `public` only) and 6862 (`vite preview` of a production build of the final source with the switch on, 4 runs: seeds 1, 3, 11 read 0 px2 at 44.8, 32.5 and 18.1 px, seed 9 read 454 px2 at camera x -0.41, the drift's far end), all stopped by PID at the end. The live baseline is the Pages build (release 37.1). The final source (the switch off) was read on the dev
servers (Chapter III against origin/main, seeds 1, 3 and 9; Chapter II, seeds 1 and 3; Chapter III on again through `?stand=`, seeds 1 and 9: 0 px2, closest 50.5 and 20 px).

### Not measured

A production build of the committed state (the switch off; the focused review of the production candidate owes it); the drift cycle at 2000x1012, 2560x1440 and 2560x1080 (1600x900 only); Chapter III's Overdrive lunges (Swordplay, Bushido) and links 3 and later; 1440x900 and 1280x720 for Chapter III (the check's disclosure stands: never clear at 1440x900); the alpha of a summoned aeon at arrival.

### For Bailey

1. **Chapter III is off in this branch. Decide with the stills in front of you** (`docs/screenshots/r38-restage-repair/ch3-seed{1,3,9}-first-menu-live-vs-branch-1600x900.jpg`: live on the left, the switched-on formation on the right). Holding the fiends put the formation exactly where the table says, and the table's earlier numbers (boss +1.45) were never the
   formation that played on any seed: they were a starting point the relaxation then moved by 0.5 to 1.2 units depending on the camera. The numbers that clear the party at the first menu are bigger (boss +3.0 right, the pagodas drawn in and back). The picture is in the same family as option B (every fiend right and back, nobody toward the party) but it is not the page's picture.
   Three ways to go:
   - **(a) Leave Chapter III as on live.** Nothing to do. The party touches the boss at rest in every frame (live: 696 to 11,590 px2 at the first menu).
   - **(b) Turn the row on as it is** (one line: `CHAPTER_III_STAGED` in `stageTable.ts`; or look first with `?stand=0.35,0,3,-0.95&standf=yu-pagoda-left:0.7,-2.4;yu-pagoda-right:2,-2.4` on a Chapter III fight) and accept the costs above: a Yuna-first menu still brushes the boss for about half the drift (at most 524 px2), the boss's back sits partly under the
     turn rail, CHK-011 reads the boss below the rule at three sizes, a lunge stops short. The focused review will list the boss's CHK-011 and rail readings as regressions against live, which can hold the release (`critic/RUBRIC.md` section 3).
   - **(c) Another route.** No table number clears Yuna-first over the whole drift without putting a third to a half of the boss under the rail, so anything further is a different mechanism (a calmer drift during this fight's menus, Yuna's ready staff lower, a wider lens for this chapter). Those are new ideas and need your yes before anything is built (rule 10).
   I recommend (a) now and (c) as the next ask: (b) trades a touch on every frame for a smaller touch on some frames and costs the boss its visibility.
2. **If (b), one number trades the boss against Yuna** (`enemy.right` in Chapter III's row; the table under "What switching Chapter III on costs"): +3.0 is the row's compromise; +3.4 and +3.8 buy Yuna-first clearance with up to 36 and 47 percent of the boss's back under the rail; +2.7 gives the boss back
   most of its visibility (0.73 to 0.77) and leaves Yuna's staff in the blade for 66 to 319 px2 at her first menu.
3. **Chapter II ships alone.** Nothing in this repair changes it. D1 of the check still wants your eyes: Chapter II is not literally option C (the party -0.10 / +0.04, not 0.5 left; the party's half puts a member 8 to 17 percent under the command list); the picture is `docs/screenshots/r38-restage/yunalesca-1600x900-menu1-live-vs-branch.jpg`.
4. **The plan can still be late on a fast load** (unchanged: Chapter I and the chapters with no row; measured again above). Planning every chapter at once changes every first menu: it needs your yes (rule 10). **Natus option N stays off** (unchanged; it needs a Natus row and a mockup first).

### Gates

- **`npx tsc --noEmit`**: exit 0, empty log, the new files in the program (`roster.ts`, the two new tests), on the final source (the switch off).
- **Targeted vitest**: `fx-mix-stage-table.test.ts` 27, `fx-mix-stage-hold.test.ts` 12, `fx-mix-roster.test.ts` 7: **46 of 46, none skipped** (Chapter III's row is read through `ALL_ROWS` and `setStageTable`, whether or not the switch plays it); the 20 other files that import the changed modules (the mix, `StageRelax`, the stage, the presenter, the
  pause page, the panel rects): 258 of 258. The two arrival-slide tests in `fx-mix-stage-hold.test.ts` fail on HEAD's `staging.ts` (the old file, parked outside the repo) and pass now.
- **Full suite, once, `--maxWorkers=3`**: 776 files, 769 passed, 5 skipped, 2 failed; 11,317 tests passed, 41 skipped, 1 todo, 2 failed (997 s). Both failures are load timeouts at the 15 s default, in files this branch does not touch: `strategy-ffx2-bahamut` "heal-only route" (22 s on its own) and `ui-pause-stack` "finds a real, non-trivial inventory";
  run alone with `--testTimeout=90000` both files pass, 25 of 25.
- **`node tools/orphans.mjs`**: 1,205 modules, 24 orphaned (the expected 24; `roster.ts` is reachable through `MaxMix.ts`; none under `src/engine/fx/mix`).
- **`node tools/critic-plan.mjs --paths <the seven changed source files>`**: DEEP review (36 substantial checkpoints since the last deep review; systems: effects, lighting and sprites; games: both); before a deploy a focused review of the production candidate, after it live verification and the deep review on the live build. Not the save-data class. With Chapter III off the changed area
  is Chapter II plus the shared plumbing, so the focused review should read B2 (a Switch-in and Chapter II's later forms) and the plan's timing in every chapter (the roster changes when the mix first sees a figure; the five other chapters and the phone read unchanged here).
- **Source sizes** (rule 7, under 400 lines): `framing.ts` 398 (extract before the next change there), `MaxMix.ts` 311, `StageRelax.ts` 271, `staging.ts` 206, `stageTable.ts` 184, `roster.ts` 54, `framingReport.ts` 31; tests 382, 223 and 95.
- **Layering and contracts**: presentation only (rule 1; `src/engine/fx/mix` and `StageRelax.ts`), nothing under `src/battle/**` or `BattlePresenter*.ts` changed, no save key and no setting; `docs/CONTRACTS.md` lists none of the changed files (rule 2: no entry needed).
- **Not merged, not deployed.** One commit on `r38-restage` on top of the check's 60e5973e; `docs/handoff/NOW.md` untouched (the driver's). Game case in the commit: FFX only for the rows and moves, both for the shared plumbing (the roster, the hold flag, the write rule).

## Re-check (merged) (critic, a Sonnet sub-agent, 2026-10-04; `r38-restage` 9fc73fa9 merged with `r38-motion` 1d2715a5 on `origin/main` 77f0d157; I built neither)

**Verdict for this lane: PASS (Chapter II alone; Chapter III stays off).** On the scratch merge and on the production bundle, Chapter II's first menu is clear in **32 of 32 runs** (seeds 1 to 8 at 1600x900, 2000x1012, 2560x1440 and 2560x1080) and in 6 of 6 more at 1440x900 and 1280x720: painted overlap **0 px2**, the plan's rest gap and the live frame's rest gap **+1**, the closest painted approach 22.1 to 45.4 px (origin/main on the same kind of bundle: 1,615 to 4,885 px2 of overlap and a frame gap of -112 to -188; live: 1,493 to 4,685 px2). The three menus of each of two runs are clear as well (6 of 6: overlap 0, closest 20.2 to 25.5 px). **Arrivals and a Switch never snap:** Yuna's Switch brings Wakka in at the slot (-1.001, 0.787) on four seeds and he never moves (first position equals final, largest step 0.000); in a whole Chapter II fight the seven arrivals (Yunalesca's two later forms, five summoned aeons) land on their slots and none steps, at a threshold of 0.02 world units (the slot is only 0.10, so the earlier 0.25 threshold could not have seen a snap). **Chapter III is today's**: `stand` null and no slots in all 24 runs per build; side by side on seeds 1, 3 and 9 the party is 0.000 apart and the fiends within the formation relaxation's own jitter (0.09 at most), and over seeds 1 to 12 both builds show the same plan states in the same proportions. Every other chapter in scope keeps its places (all seven: 0.000 apart, spread 0.000 inside each build), and the phone frames of Chapters II and IV are origin/main's. No blocker. Game case (rule 14): the table is FFX only (Chapter II), the roster, the hold and the write rule are shared plumbing (both games; inert for a fight with no row), and the merge with the motion lane's FFX-2-only run was checked in FFX-2 as well.

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

### 1. Chapter II first menus, production bundle (the check's numbers, redone on the merge)

Real keys from the title to the first command menu (`run.mjs`, `__pyrefly.setSeed(n)` before the first key, CHK-015), the in-page reading 2.4 s after the menu opens (the check's `inpage2.measure`: the painted overlap and closest approach from each figure's own pose texture, the product's `plate.restGap`, and the live frame's rest gap recomputed from the screen). Tidus was first in every run.

| size | merge: runs, painted overlap px2 | closest painted approach px | rest gap, plan / live frame | origin/main (production bundle, 4 seeds): overlap px2 / live-frame gap | live 37.1 (4 seeds): overlap px2 / live-frame gap |
|---|---|---|---|---|---|
| 1600x900 | 8 (seeds 1 to 8): **0** in all | 23.1 to 28.5 | **+1 / +1** in all | 1,615 to 2,118 / -112 to -119 | 1,493 to 2,002 / -108 to -117 |
| 2000x1012 | 8: **0** in all | 27.5 to 30.9 | +1 / +1 | 1,709 to 2,647 / -120 to -134 | 1,534 to 2,142 / -118 to -125 |
| 2560x1440 | 8: **0** in all | 35.5 to 45.4 | +1 / +1 | 4,276 to 4,885 / -181 to -188 | 3,301 to 4,685 / -169 to -184 |
| 2560x1080 | 8: **0** in all | 24.8 to 30.7 | +1 / +1 | 2,267 to 2,946 / -135 to -142 | 2,306 to 2,511 / -134 to -137 |
| 1440x900 | 3: **0** | 22.7 to 26.5 | +1 / +1 | 1,500 and 1,891 / -111 and -117 (2 runs) | not read |
| 1280x720 | 3: **0** | 22.1 to 23.2 | +1 / +1 | 1,123 and 1,122 / -92 and -91 (2 runs) | not read |

Every merge run (38 of 38 asserted: the battle screen, a command menu pending): `stand` = party (-0.101, +0.037), fiends (+0.765, -0.446), the plan committed (1) and re-planned once at the read, no console error, no request that failed (the same for origin/main and live). Later menus (seeds 1 and 3, 1600x900, menus 1 to 3: Tidus, Yuna, Yuna, where Yuna's ready staff is out): overlap **0 in 6 of 6**, closest 20.2 to 25.5 px, rest gap +1 / +1. The picture: `docs/screenshots/r38-mr-recheck/ch2-first-menu-live-vs-merged.jpg` (live left, the merge right, 1600x900 and 2560x1080, seed 1). One reading to carry: origin/main served from a zero-latency origin has `plans` 0 at the read (the plan lands after the first menu opens, so the frame is the stage's own formation), live has it at 1; the merge plans Chapter II at once (a row), so its first menu is always the planned state (the plan lands about 0.05 s after the battle screen starts, against about 1.35 s for the same chapter on origin/main, and the first menu opens at about 9.3 s on this route).

### 2. Arrivals and a Switch (B2) in Chapter II

The earlier check used 0.25 world units as the size of a snap; Chapter II's slot is small (party -0.10 / +0.04, fiends +0.75 / -0.45), so a snap there is 0.10 and would have passed unseen. Re-read here at **0.02** (`snap-an.mjs`: every figure that appears after the first frame, its first and its final place, the largest one-frame step in x or z in the 1.5 s after it appears):

- **Switch** (real keys: ATTACK with whoever is up until it is Yuna's menu, then SWITCH, Wakka; seeds 1 to 4 on the merge, seed 1 on origin/main and live): Wakka appears at **(-1.001, 0.787) at alpha 0.03 and never moves** (first = final, step 0.000; the bare slot (-0.9, 0.75) plus the table's move; origin/main and live: (-0.9, 0.75) at alpha 0, never moves).
- **A whole fight** (`arrive2.mjs`: the chapter's `intended` tactics at fast speed, seed 1, every figure's x and z every frame, 203 s on the merge, 201 s on origin/main): seven arrivals on each build and **none steps**: Yunalesca's form 2 and form 3 land at (3.565, -4.446) (origin/main: (2.8, -4)) at alpha 0.15, and Shiva, Ixion, Ifrit, Valefor and Bahamut land at (-1.001, 0.787) (origin/main: (-0.9, 0.75)); the two fights keep the same schedule to within half a second. The motion lane's SKILL TRAVEL on this chapter's slots was checked with a screencast (Yunalesca's orbs leave her staged place and land on Auron and Tidus at theirs: `docs/screenshots/r38-mr-recheck/skill-travel-merged-ch2-orb.jpg`).

### 3. Chapter III is today's (the switch is off)

`CHAPTER_III_STAGED = false` in the merged `stageTable.ts`; `STAGE_TABLE` holds Chapter II only. Real keys, seeds 1, 3 and 9 at 1600x900, first menu, production bundle on the merge and on origin/main (and live as a third column):

| seed | first | `stand` | staging record | plans at the read | framing outcome | plan gap / live-frame gap | overlap px2 (merge / main / live) | party | boss, pagodas (merge against main) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Tidus | null / null | `{}` / `{}` | 0/0 / 0/0 | same | - / +1 | 168 / 175 / 1,666 | 0.000 | 0.006; 0.087 |
| 3 | Auron | null / null | plan entries / plan entries | 1/1 / 1/1 | same | -44 / -91 and -92 | 2,936 / 2,841 / 4,785 | 0.000 | 0.011; 0.012 |
| 9 | Yuna | null / null | plan entries / plan entries | 1/1 / 1/1 | same | -43 / -77 and -73 | 3,945 / 4,190 / 2,115 | 0.000 | 0.073; 0.075 |

The merge reads what origin/main reads, field by field; the fiends differ by the formation relaxation's jitter (it runs on every camera move and is a function of the clock). Four runs per seed on each build (`ch3-reps.mjs`): the boss's x ranges 2.399 to 2.410 on the merge against 2.396 to 2.410 on origin/main (seed 1), 2.789 to 2.896 against 2.355 to 3.043 (seed 3: origin/main's own spread is 0.69), 2.340 to 2.508 against 2.410 to 2.497 (seed 9), the medians 0.002, 0.002 and 0.056 apart, so a difference of 0.09 between two single runs is inside either build's own spread. Over **seeds 1 to 12** (`ch3-wide.mjs`, one run each, 24 runs in all): `stand` null in 12 of 12 on both; the party stays on the stage's own place (the plan not yet committed at the read) on seed 1 only, on both builds; the plan's 0.35 step shows in 11 of 12 on the merge and 9 of 12 on origin/main, its 0.70 step (the plan's other candidate) in 0 and 2 (seeds 3 and 8 on origin/main; once more on the merge in the four repeats of seed 3: 1 of 24 against 2 of 24); painted overlap 184 to 3,661 px2 (median 1,211) on the merge against 186 to 4,260 (median 1,109); boss x 2.407 to 3.046 against 2.293 to 2.964. Live's plan landed before the menu on seeds 1 and 9 (a different `stand`/staging state: the check's "two states of the same build"), which is the origin difference, not a build difference. The pictures: `docs/screenshots/r38-mr-recheck/ch3-first-menu-main-vs-merged.jpg`.

### 4. The other chapters and the phone

**Positions, first menu, 1600x900, seed 1, three runs each on the merge and on origin/main, live once:** Chapter I (Flux), VIII (Evrae), IX (Yojimbo), X (Natus) and FFX-2 V (Vegnagun/Shuyin), XI (Fallen Aeons), XV (Den of Woe): **every figure's world (x, z) is 0.000 from origin/main's, and the spread inside each build is 0.000**; `stand` is null everywhere; the staging record has the same entries; the framing outcome is the same (Chapter IX: origin/main flips the lens once in three runs, `(0, 0)` against `(0, -36)`, the two outcomes the restage doc lists for origin/main itself; the merge gave `(0, -36)` three times); the painted overlaps and rest gaps sit in the same ranges (Evrae 10,483 to 10,597 against 10,491 to 10,689; Vegnagun 1,125 to 1,145 against 1,094 to 1,168).

**The plan's timing, the one thing the roster change moves in every chapter.** `plantime.mjs` (four fresh sessions per build per chapter on the debug route, production bundles; a frame logger installed before the page's scripts records the first frame the mix reports a plan and the first frame a command menu is pending): the roster is now marked stale the moment a figure is added, so the plan lands **0.23 to 0.46 s earlier in every chapter without a row** (median ms after the battle screen starts, origin/main then merge: Chapter I 1311, 972; III 1553, 1106; VIII 1292, 1063; IX 1437, 1006; X 1308, 936; FFX-2 IV 1394, 996; V 1346, 883; XI 1180, 838; XV 1231, 779) and Chapter II's row at once (1373, then 61). On that route the first menu opens at 9.2 to 12.3 s, so the plan is in before the first menu in 4 of 4 sessions on both builds in all ten chapters, with the same framing outcomes (the sets are equal: Chapter II once `back` 1 for 1.04 on origin/main, Chapter IX flips its lens on both). On the real-keys route the first menu opens sooner and whether the plan is in yet is a race on both builds (at the read, plans 0 in Chapters I and XV on both, one late run on origin/main in Chapter V and one committed run in Chapter III seed 1); the merge's plan is earlier, so a first menu that opens before the plan (a hurried opening) can show the planned frame on the merge where origin/main still shows the stage's own formation; the readings above caught no such difference (every figure 0.000 apart in the seven chapters; Chapter III's states in the same proportions). It is a change in when the plan lands, and it can only make the first menu look as the plan intends.

**The phone, 390x844 touch, real keys, clocks frozen** (`phone.mjs`, `phonecmp2.mjs`): Chapter II, two runs per build: `phone` set, `stand` null, the staging empty, every figure at the same world place on all four frames (Auron 1.3 / -0.75, Tidus 0.1 / 1.8, Yuna -0.9 / 0.75, Yunalesca 2.8 / -4); the pixels cannot be equal (no two runs of one build give the same frame: drift phase, particles, breathing): origin/main against itself differs in 52.0 percent (11.3 percent by more than 24 levels), the merge against itself in 49.8 percent (9.4), origin/main against the merge in 46.1 to 51.6 percent (7.8 to 12.4): inside the floor. Chapter IV: 18 sessions per build (the first pair, then 8 and 8 more, interleaved, `phone-ch4-an.mjs`): Bahamut stands at 1.05 in all 36; Paine at -0.596 to -0.662 on origin/main and -0.595 to -0.663 on the merge, Rikku -1.315 to -1.381 and -1.339 to -1.417, Yuna -2.170 to -2.274 and -2.170 to -2.242. Both builds show the same two plan outcomes (the common one, Paine about -0.65, and a second, Paine about -0.60 with Rikku about -1.34 and Yuna about -2.24: origin/main 2 of 18 sessions, the merge 3 of 18; the plan decides on a live frame), and the first pair's pixel differences (main against main 42.7 percent, merge against merge 43.3, main against merge 40.3 to 44.4) sit inside the same floor. A pair that looks like a shift is two of the three second-outcome sessions, not a change. The pictures: `docs/screenshots/r38-mr-recheck/phone-ch2-ch4-main-vs-merged.jpg`.

### 5. Code on the merge

`npx tsc --noEmit`: exit 0, 2,827 files (this lane's `roster.ts`, `stageTable.ts` and the two new tests are in the program). Targeted vitest, 32 files, **358 of 358**, including this lane's `fx-mix-stage-table` (27), `fx-mix-stage-hold` (12), `fx-mix-roster` (7), the motion lane's `r38-*` files, and the `fx-mix-*` suite as a whole. `node tools/orphans.mjs`: 1,214 modules, 1,190 reachable, **24 orphaned, the same 24** (`roster.ts` is reached through `MaxMix.ts`; nothing under `src/engine/fx/mix` is orphaned). Sizes: **`framing.ts` 398 lines (two lines of headroom: the next change there must extract first)**, `MaxMix.ts` 311, `StageRelax.ts` 271, `staging.ts` 215 (206 on this branch plus the motion lane's nine), `stageTable.ts` 184, `roster.ts` 54. **The full suite, once, `vitest run --maxWorkers=3`, on the merge:** 785 test files (779 passed, 5 skipped, 1 failed) and 11,477 tests (11,434 passed, 41 skipped, 1 todo, 1 failed), 660 s with other agents' work on the machine. The one failure is the known load timeout, `strategy-ffx2-bahamut` "heal-only route (no Shell, no Breaks) clears Mega Flare" (17.1 s against the 15 s limit; an engine-only test that neither lane touches); re-run alone it still takes 15.9 s on this loaded machine, and with `--testTimeout=90000` the file passes, 19 of 19 (that test 18.7 s). The other two known load timeouts (`sin-fins-core-bench`, `ui-pause-stack`) did not fail. The real merged `Staging` was also driven with the slots active and a figure out on its own run (a scratch unit test, 6 of 6, two wrong resolutions of the conflict fail it; see the motion lane's note). The release path ran in a browser (`release.mjs`: `__pyrefly.fx.mix.parts(false)` releases the staging, `parts(true)` brings it back): Chapter II on the merge, on: Tidus (-0.001, 1.837), Yuna (-1.001, 0.787), Auron (1.199, -0.713), Yunalesca (3.565, -4.446); off: the stage's own seats (0.1, 1.8), (-0.9, 0.75), (1.3, -0.75), (2.8, -4), **the places origin/main stands them in**; on again: the first reading to 0.000. Chapter IV on the merge, off: Yuna -2.05, Rikku -1.406, Paine -0.776, Bahamut 1.05 (origin/main's off: -2.05, -1.406, -0.777, 1.05); on again within 0.002 (the plan re-decides; origin/main within 0.001 to 0.004). Chapter III: identical on both builds.

### Disclosures (carry into the release note)

1. **Chapter III is not fixed, it is off.** The merge plays Chapter III exactly as origin/main does; PR-0310 stays open there (the repair's reading stands: the formation that clears the party on every seed is a bigger move than the approved picture, boss +3.0 right, and still brushes during part of the camera's drift when Yuna is first). Nothing in this check changes that.
2. **Chapter II's later forms are not cleared** (form 3 reads 16,516 px2 against live's 21,278 in the first check; not re-measured here), and the fiends draw 2 to 8 percent smaller (D8), as before. This re-check measured the first menu, three menus of two runs, a Switch and the arrivals of one whole fight; it did not re-measure lunges, Overdrives or the HUD cost tables of the first check.
3. **The merge is not a different Chapter II from the one the lane measured**: the production bundle and the earlier dev server agree (0 px2, +1, closest 23 to 43 px against the lane's 23 to 41), and the plan lands earlier in the production bundle than the lane's "first menu opens before its plan" dev reading.
4. **`?stand=` and `?standf=` (checks-only query hooks) ship in the production bundle**, like the product's other ungated, non-persistent hooks (`?cam=`, `?pace=`, `?wait=`, `?sfxmix=`); a player who types one changes only the presentation.
5. Still owed, as for any build of this class: the focused review of the production candidate before a deploy, live verification and the deep review on the live build after it (`critic-plan`: DEEP). With Chapter III off, the changed area is Chapter II plus the shared plumbing: a focused review should read a Switch-in, Chapter II's later forms and the plan's timing in every chapter (read here: unchanged).

### Evidence

Stills in `docs/screenshots/r38-mr-recheck/`: `ch2-first-menu-live-vs-merged.jpg`, `ch3-first-menu-main-vs-merged.jpg`, `phone-ch2-ch4-main-vs-merged.jpg` and `skill-travel-merged-ch2-orb.jpg`. Scratch, not in the repo: `D:/Tools/pyrefly-scratch/2026-10-04/mr-recheck/` (`re/` scripts and `out-re/` raw runs and `shots-re/` first-menu pictures and Switch clips, `logs/` every step's output, `notes.md`, `resolution.md`). Servers started and stopped by PID: ports 6930 (PID 75664) and 6931 (PID 65152). Two junctions made in the scratch folder (`main-src/node_modules` and `vt/node_modules`, both to `D:/Final Fantasy/node_modules`) must be unlinked with `rmdir` (no /s) before any removal of that folder.
