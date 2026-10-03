# r38-restage: Chapters II and III staged from a per-chapter table (PR-0310); Natus option N left off

Branch `r38-restage` (worktree `D:/pyrefly-fixes-r28`), from `origin/main` b96b5f4d. `src/`, `public/` and `tools/` are identical between b96b5f4d,
origin/main 3b1ed60f and live release 37 (main cd9dbbb0, bundle `BGBDEn_P`, read from the live page on 2026-10-03): every commit since release 37
is docs. Not merged, not deployed, not reviewed. The decision is D-353, ask 4 of the Visual Options page (Bailey, 2026-10-03 ~14:42 EDT: "I'll go
with all your recommendations thank you <3").

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
| III Braska's Final Aeon | +0.35 / 0 | +1.45 / -0.95 | option B: the boss and both pagodas move as one formation; the party stands where the old plan's usual step put it, now on every run |

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
