# r391-reach: a physical attack reaches its target (release 39.1)

Branch `r391-reach` (from `origin/main` cfab29b4, the code of live release 39, 816d80f9). Bailey, 2026-10-05, through the driver: "you can go full speed ahead"; and, 19:27 EDT, "you can continue please". A bug fix inside approved scope: a physical attack must visibly reach its target.
**Case: FFX: party and fiends. FFX-2: fiends, and the girls after their run-in (not a girl who stays where she stands). FF7: unchanged.** Sources and the one judgement call are under "Game case".

## What was wrong

The house lunge is a fixed 1.4 world units (`BattlePresenterBeats.actionStart`). The figures stand 4 to 17 world units apart in depth, so 1.4 units is a different number of pixels for
every pair, and a strike stops short wherever the picture puts the foe further away. Release 39 made the lunge target-aware in Chapter III only (`StandReach.ts`, 477852d6: a staging row's
`follow` flag); everywhere else Tidus still ended 159 px from Seymour Flux in Chapter I on live, Dr. Goon 560 px from Rikku in Chapter VI, Ixion a median 231 px from his target in Chapter XVI.

## Game case (AGENTS.md rule 14, CHK-021; decided from the sources, never from memory)

- **FFX (Chapters I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII), party and fiends: yes.** FFX has no run-in: `research/battle-camera-perspectives.md` A.2 says no source describes
  FFX's approach (`[absence]`), and Bailey holds an FFX run-in for his own yes (D-354, M1 for FFX held). The house lunge is FFX's whole approach, so a blow that stops short is a defect.
  A presenter with no motion port reaches, and FFX has none.
- **FFX-2 (Chapters IV, V, VI, XI, XIII, XV, XVI), fiends: yes, a judgement call.** A fiend has no run-in in either game (its approach is the same lunge) and no source says anything that
  would keep it short. It is the same bug in shared plumbing (CHK-020), so `RunInMotion.reachFor` answers yes for a fiend. **Flag for Bailey:** the sources are silent on a fiend's approach in
  FFX-2; reverting is one line (`reachFor` in `src/app/screens/BattleScreenRunIn.ts`).
- **FFX-2, a girl after her run-in: yes.** A short-range dressphere RUNS IN first (sourced: "a character standing far away spends ~2 s running in ... model an approach time proportional
  to distance for `short range` abilities", `research/ffx2-combat-core.md` section 1, line 264, a single source, Split Infinity G0908). Where she stops is ours (`motion/StandOff.ts`, up to
  a quarter of the frame of travel, scored on the picture), and where that stop leaves a gap (Leblanc, Rikku, Ormi far to the right: 170 to 300 px) the lunge from there closes the rest, as in
  FFX. Her lunge after a run keeps its own start (0.6) and the solver adds only what the gap needs (cap +3).
- **FFX-2, a girl who does not run: no.** A long-range dressphere (Gunner, Lady Luck, Alchemist, Trainer, Gun Mage) "fires from the starting position with no run-in"
  (`research/ffx2-combat-core.md` line 266, verified, 2 sources), so her strike must not close the distance: `reachFor` answers no. Yuna attacks as a Gunner at Leblanc and at the Den of Woe (a
  White Mage there between her heals; probed in the Den: every `strike` of hers is `gunner`, `longRange` true, no run), which is why her strikes there still end 120 to 160 px from the target by design (her shot flies,
  `motion/SkillTravel.ts`). A command menu open also suppresses the run-in by design.
- **FF7: unchanged.** Its motion port runs its own melee and does not answer `reachFor`.

## What it does

`lunge(distance)` is still the one move (440 ms, apex at 0.58 of it, the contact hold), but the distance is solved against the picture, in every chapter, at the moment the action starts:

- **Silhouette solver** (`src/engine/motion/Silhouette.ts`, `StandReach.ts`, `StrikeReach.ts`). Each figure's painted front is read row by row (40 bands) from the painting's alpha at the cut the
  critic's chamfer uses (0.35), through the camera the blow is SEEN through: the first hit hard-cuts to the struck figure's rig, so both figures are read through that rig and the camera
  comfort preset's own mapping (`enemy` is `enemy~calm`). The attacker is read in the pose its blow lands in (the impact painting, up at the apex), not the one showing. The lunge is the
  smallest distance, never less than today's and at most +3 world units, at which the attacker's front is **14 px (at 1600 wide, scaled with the frame) into** the target's near side over
  the rows they share. Boxes are not used: they overlap by 150 px while the pixels are still apart.
  **The margin** is live's own closest good case: the 95 live strikes that touch from a clear seat overlap the foe by a median 197 px of box and 1,306 px² of painted area (10th percentile 42 px²);
  the 14 px aim sits at the low end of those, so a strike that already touches is never lengthened. After: 162 strikes touch from a clear seat, median 1,531 px² (10th percentile 120).
- **What it leaves alone:** a strike that already reaches (to the unit); a target above or below the attacker's rows (a lateral lunge cannot touch it: it lines up beside it at most); a
  colossus attacker wider than half the frame (Sin's fin); a stage that offers no boxes (the strike is then solved on boxes, or left at today's). It never runs the attacker into a figure
  standing in its own depth lane (|dz| < 0.5) that today's lunge is clear of.
- **Whose target:** the one the action names; a fiend's ability names none at `action-start` (over a third of the fiends' physical strikes), so the burst being played is read for the targets
  of its first blows (`EventCtx.burst`); with neither, the shortest reach over every foe, so a strike never goes further than the one it could not tell from.
- **Counters** (a boss's counterattack, Yunalesca's, Paragon's) are physical blows too: their 0.6 lunge gets the same reach.
- **The eased step** (`BattlePresenterActors.reachOffset`, `PaintedActor.lunge(.., house)`). The house part of every lunge keeps the old curve to the frame; the distance carried beyond it
  rides the same beats with the step eased in and out. Without it a 3 to 4 unit lunge is a single cubic-out kick on its first frame (up to 270 px on the screen), which the critic's jerk rule
  (CHK-027) reads as a pop; the measurements below are with and without it.
- **Release 39's Chapter III special case is gone:** the staging row's `follow` flag and the `standMove` registry are removed; the solver reads the picture in every chapter.
- Presentation only: no engine state, no RNG, no timing change.

## Proof

All numbers are from real strikes: real keys from the title to the first command menu, then an Attack-only strategy handed to the battle (seed 1, the drift pinned at 16.4 s so a strike's
camera does not depend on when it happens), the in-page probe recording every lunge frame by frame under the live camera and measuring the **closest painted gap** (the alpha-chamfer the
critic reads; 0 is touching) between the attacker and the figure it hit. **Before** is the code of live release 39 (a dev build of main at cfab29b4: `strikes-before`, and
`https://echoesofspira.com/` for the shots and the continuity runs); **after** is this branch. Scratch and the harness are not in the repo (`D:/Tools/pyrefly-scratch/2026-10-05/r391-reach`).

### The closest painted gap, per chapter, party and fiend strikes

Median / max px over the strikes (share within 12 px, number of strikes). Lunge column: the longest lunge asked, party / fiend, world units.

**1600x900**

| Chapter | Party strikes: median / max px (within 12 px, n) before > after | Fiend strikes: same | Longest lunge asked (party / fiend) before > after |
|---|---|---|---|
| I seymour-flux | 11/138 (67%, n 3) > 0/0 (100%, n 3) | 44/301 (33%, n 3) > 0/5 (100%, n 3) | 1.40 / 1.40 > 3.07 / 4.40 |
| II yunalesca | 0/67 (68%, n 22) > 0/0 (100%, n 22) | 0/246 (85%, n 13) > 0/0 (100%, n 13) | 1.40 / 1.40 > 2.11 / 3.23 |
| III braskas-final-aeon | 0/92 (93%, n 15) > 0/91 (93%, n 15) | 39/175 (45%, n 11) > 0/80 (64%, n 11) | 2.52 / 3.25 > 2.76 / 4.37 |
| IV ffx2-bahamut | 0/0 (100%, n 20) > 0/0 (100%, n 20) | 11/173 (67%, n 3) > 0/3 (100%, n 3) | 0.60 / 1.40 > 0.60 / 3.22 |
| V ffx2-vegnagun-shuyin | 0/0 (100%, n 8) > 0/0 (100%, n 8) | -/- (null%, n 0) > -/- (null%, n 0) | 0.60 / - > 0.60 / - |
| VI ffx2-leblanc | 0/140 (67%, n 21) > 0/162 (76%, n 21) | 0/560 (57%, n 7) > 0/174 (71%, n 7) | 1.40 / 1.40 > 2.07 / 4.40 |
| VII seymour-anima-macalania | 0/53 (69%, n 13) > 0/53 (62%, n 13) | 0/0 (100%, n 13) > 0/0 (100%, n 13) | 1.40 / 0.60 > 1.40 / 0.60 |
| VIII evrae-airship | 0/20 (83%, n 6) > 0/0 (100%, n 6) | 0/0 (100%, n 1) > 0/0 (100%, n 1) | 1.40 / 1.40 > 1.79 / 1.40 |
| IX yojimbo-cavern | 18/170 (46%, n 13) > 13/180 (46%, n 13) | 0/0 (100%, n 2) > 0/0 (100%, n 2) | 1.40 / 1.40 > 1.40 / 3.63 |
| X seymour-natus | 53/247 (40%, n 5) > 0/247 (80%, n 5) | -/- (null%, n 0) > -/- (null%, n 0) | 1.40 / - > 3.58 / - |
| XI ffx2-fallen-aeons | 0/0 (100%, n 15) > 0/0 (100%, n 15) | 0/79 (67%, n 3) > 0/0 (100%, n 3) | 0.60 / 1.40 > 0.60 / 3.48 |
| XII seymour-omnis | 0/0 (100%, n 12) > 0/0 (100%, n 12) | -/- (null%, n 0) > -/- (null%, n 0) | 1.40 / - > 1.92 / - |
| XIII ffx2-trema | 0/0 (100%, n 14) > 0/0 (100%, n 14) | 0/277 (64%, n 28) > 0/10 (100%, n 28) | 1.40 / 1.40 > 1.40 / 3.60 |
| XIV isaaru-via-purifico | -/- (null%, n 0) > -/- (null%, n 0) | 0/20 (73%, n 22) > 0/19 (73%, n 22) | - / 1.40 > - / 1.46 |
| XV ffx2-den-of-woe | 0/121 (70%, n 10) > 0/122 (70%, n 10) | -/- (null%, n 0) > -/- (null%, n 0) | 1.40 / - > 1.40 / - |
| XVI ffx2-ixion-djose | 0/0 (100%, n 17) > 0/0 (100%, n 17) | 231/381 (0%, n 9) > 27/45 (22%, n 9) | 0.60 / 1.40 > 0.60 / 4.40 |
| XVII sin-fins-core (its own run, below) | 185/466 (33%, n 69) > 0/408 (56%, n 70) | 72/100 (39%, n 18) > 0/104 (94%, n 18) | 1.40 / 1.40 > 4.40 / 3.37 |
| XVIII sin-face | 84/175 (7%, n 28) > 31/140 (18%, n 28) | 96/101 (50%, n 4) > 99/100 (50%, n 4) | 1.40 / 0.60 > 4.40 / 0.60 |

**2560x1440** (the same seeds; each size is its own run, formations differ a little between runs)

| Chapter | Party strikes: median / max px (within 12 px, n) before > after | Fiend strikes: same | Longest lunge asked (party / fiend) before > after |
|---|---|---|---|
| I seymour-flux | 13/219 (33%, n 3) > 0/0 (100%, n 3) | 53/471 (33%, n 3) > 0/12 (100%, n 3) | 1.40 / 1.40 > 3.03 / 4.40 |
| II yunalesca | 0/101 (68%, n 22) > 0/0 (100%, n 22) | 0/397 (85%, n 13) > 0/0 (100%, n 13) | 1.40 / 1.40 > 2.10 / 3.15 |
| III braskas-final-aeon | 0/146 (93%, n 15) > 0/148 (93%, n 15) | 64/283 (45%, n 11) > 0/136 (60%, n 10) | 2.52 / 3.25 > 2.77 / 4.33 |
| IV ffx2-bahamut | 0/0 (100%, n 20) > 0/0 (100%, n 19) | 19/297 (33%, n 3) > 0/0 (100%, n 3) | 0.60 / 1.40 > 0.60 / 3.21 |
| V ffx2-vegnagun-shuyin | 0/0 (100%, n 8) > 0/0 (100%, n 8) | -/- (null%, n 0) > -/- (null%, n 0) | 0.60 / - > 0.60 / - |
| VI ffx2-leblanc | 0/339 (67%, n 21) > 0/228 (79%, n 19) | 0/924 (67%, n 6) > 0/332 (67%, n 6) | 1.40 / 1.40 > 2.03 / 4.40 |
| VII seymour-anima-macalania | 0/96 (58%, n 12) > 0/128 (62%, n 13) | 0/0 (100%, n 12) > 0/0 (100%, n 13) | 1.40 / 0.60 > 1.40 / 0.60 |
| VIII evrae-airship | 0/30 (83%, n 6) > 0/0 (100%, n 6) | 0/0 (100%, n 1) > 0/0 (100%, n 1) | 1.40 / 1.40 > 1.78 / 1.40 |
| IX yojimbo-cavern | 46/341 (38%, n 13) > 20/380 (31%, n 13) | 0/0 (100%, n 2) > 0/0 (100%, n 2) | 1.40 / 1.40 > 1.40 / 3.62 |
| X seymour-natus | 111/451 (40%, n 5) > 0/502 (80%, n 5) | -/- (null%, n 0) > -/- (null%, n 0) | 1.40 / - > 3.66 / - |
| XI ffx2-fallen-aeons | 0/0 (100%, n 15) > 0/0 (100%, n 15) | 0/121 (67%, n 3) > 0/0 (100%, n 3) | 0.60 / 1.40 > 0.60 / 3.50 |
| XII seymour-omnis | 0/0 (100%, n 11) > 0/0 (100%, n 12) | -/- (null%, n 0) > -/- (null%, n 0) | 1.40 / - > 1.90 / - |
| XIII ffx2-trema | 0/0 (100%, n 13) > 0/0 (100%, n 14) | 0/444 (68%, n 25) > 0/9 (100%, n 27) | 1.40 / 1.40 > 1.40 / 3.60 |
| XIV isaaru-via-purifico | -/- (null%, n 0) > -/- (null%, n 0) | 0/33 (73%, n 22) > 0/31 (76%, n 21) | - / 1.40 > - / 1.45 |
| XV ffx2-den-of-woe | 0/197 (67%, n 9) > 0/198 (67%, n 9) | -/- (null%, n 0) > -/- (null%, n 0) | 1.40 / - > 1.40 / - |
| XVI ffx2-ixion-djose | 0/0 (100%, n 10) > 0/0 (100%, n 16) | 397/649 (0%, n 5) > 48/100 (22%, n 9) | 0.60 / 1.40 > 0.60 / 4.40 |
| XVII sin-fins-core | (the chapter needs its own run: 1600x900 only, below) | | |
| XVIII sin-face | 138/265 (4%, n 27) > 73/223 (27%, n 26) | 153/163 (33%, n 3) > 157/160 (0%, n 3) | 1.40 / 0.60 > 4.40 / 0.60 |

Whole run, 1600x900: 341 strikes matched (live against this branch, by attacker and order); the lunge changed in 123; 102 stopped short at 1.4 on live and **40 now touch**; the share of strikes
within 12 px of their target is **party 73 to 80 percent, fiends 65 to 82 percent**; the longest lunge asked is 4.40 (the cap, 1.4 + 3). 2560x1440: 313 strikes, 111 changed, 97 short and 41 fixed,
party 70 to 80 percent, fiends 67 to 84 percent. The chapters where the picture put the foe far away are fixed or much closer: Chapter I (Tidus 138 > 0 px, Seymour 301 > 5), II (Yunalesca 246 > 0), IV (Bahamut 173 > 3), XIII (Paragon 277 > 10), XVI (Ixion median 231 > 27), X (median 53 > 0, one strike left at 247), VI (Dr. Goon 560 > 174);
Chapters V, VIII, XI, XII were already touching and stay that way. Whole-run percentages are held back by the chapters listed under "What is left" (Sin, Yojimbo, Isaaru, the Gunners).

### Per member and per boss

Closest painted gap during each attacker's strikes (median / max px, number of strikes), live release 39 > this branch.

**1600x900**

| Chapter | Attacker | Before: median / max px (strikes) | After |
|---|---|---|---|
| I seymour-flux | kimahri | 11 / 11 (2) | 0 / 0 (2) |
| I seymour-flux | tidus | 138 / 138 (1) | 0 / 0 (1) |
| I seymour-flux | FIEND mortiorchis | 0 / 0 (1) | 0 / 0 (1) |
| I seymour-flux | FIEND seymour-flux | 301 / 301 (2) | 5 / 5 (2) |
| II yunalesca | auron | 0 / 0 (5) | 0 / 0 (5) |
| II yunalesca | tidus | 0 / 0 (10) | 0 / 0 (10) |
| II yunalesca | yuna | 65 / 67 (7) | 0 / 0 (7) |
| II yunalesca | FIEND yunalesca | 0 / 246 (13) | 0 / 0 (13) |
| III braskas-final-aeon | auron | 0 / 92 (8) | 0 / 91 (8) |
| III braskas-final-aeon | tidus | 0 / 0 (6) | 0 / 0 (6) |
| III braskas-final-aeon | yuna | 0 / 0 (1) | 0 / 0 (1) |
| III braskas-final-aeon | FIEND braskas-final-aeon | 39 / 175 (11) | 0 / 80 (11) |
| IV ffx2-bahamut | paine | 0 / 0 (11) | 0 / 0 (11) |
| IV ffx2-bahamut | rikku | 0 / 0 (9) | 0 / 0 (9) |
| IV ffx2-bahamut | FIEND bahamut | 11 / 173 (3) | 0 / 3 (3) |
| V ffx2-vegnagun-shuyin | paine | 0 / 0 (2) | 0 / 0 (2) |
| V ffx2-vegnagun-shuyin | rikku | 0 / 0 (6) | 0 / 0 (6) |
| VI ffx2-leblanc | paine | 0 / 0 (7) | 0 / 31 (7) |
| VI ffx2-leblanc | rikku | 20 / 127 (7) | 9 / 30 (7) |
| VI ffx2-leblanc | yuna | 0 / 140 (7) | 0 / 162 (7) |
| VI ffx2-leblanc | FIEND dr-goon | 560 / 560 (4) | 169 / 174 (4) |
| VI ffx2-leblanc | FIEND logos-room | 272 / 272 (1) | 0 / 0 (1) |
| VI ffx2-leblanc | FIEND ormi-entrance | 0 / 0 (2) | 0 / 0 (2) |
| VII seymour-anima-macalania | rikku | 50 / 53 (5) | 49 / 53 (5) |
| VII seymour-anima-macalania | tidus | 0 / 0 (4) | 0 / 0 (4) |
| VII seymour-anima-macalania | yuna | 0 / 0 (4) | 0 / 0 (4) |
| VII seymour-anima-macalania | FIEND guado-guardian-a | 0 / 0 (13) | 0 / 0 (13) |
| VIII evrae-airship | rikku | 0 / 0 (4) | 0 / 0 (4) |
| VIII evrae-airship | tidus | 0 / 0 (1) | 0 / 0 (1) |
| VIII evrae-airship | wakka | 20 / 20 (1) | 0 / 0 (1) |
| VIII evrae-airship | FIEND evrae | 0 / 0 (1) | 0 / 0 (1) |
| IX yojimbo-cavern | kimahri | 10 / 18 (5) | 11 / 13 (5) |
| IX yojimbo-cavern | lulu | 170 / 170 (2) | 180 / 180 (2) |
| IX yojimbo-cavern | yuna | 29 / 31 (6) | 27 / 30 (6) |
| IX yojimbo-cavern | FIEND yojimbo | 0 / 0 (2) | 0 / 0 (2) |
| X seymour-natus | kimahri | 0 / 0 (2) | 0 / 0 (2) |
| X seymour-natus | tidus | 247 / 247 (2) | 247 / 247 (2) |
| X seymour-natus | yuna | 53 / 53 (1) | 0 / 0 (1) |
| XI ffx2-fallen-aeons | paine | 0 / 0 (8) | 0 / 0 (8) |
| XI ffx2-fallen-aeons | rikku | 0 / 0 (7) | 0 / 0 (7) |
| XI ffx2-fallen-aeons | FIEND x2-shiva | 0 / 79 (3) | 0 / 0 (3) |
| XII seymour-omnis | auron | 0 / 0 (1) | 0 / 0 (1) |
| XII seymour-omnis | tidus | 0 / 0 (4) | 0 / 0 (4) |
| XII seymour-omnis | yuna | 0 / 0 (7) | 0 / 0 (7) |
| XIII ffx2-trema | paine | 0 / 0 (7) | 0 / 0 (7) |
| XIII ffx2-trema | rikku | 0 / 0 (5) | 0 / 0 (5) |
| XIII ffx2-trema | yuna | 0 / 0 (2) | 0 / 0 (2) |
| XIII ffx2-trema | FIEND paragon | 0 / 277 (28) | 0 / 10 (28) |
| XIV isaaru-via-purifico | FIEND grothia | 0 / 20 (22) | 0 / 19 (22) |
| XV ffx2-den-of-woe | paine | 0 / 0 (1) | 0 / 0 (1) |
| XV ffx2-den-of-woe | rikku | 0 / 0 (6) | 0 / 0 (6) |
| XV ffx2-den-of-woe | yuna | 120 / 121 (3) | 121 / 122 (3) |
| XVI ffx2-ixion-djose | paine | 0 / 0 (8) | 0 / 0 (8) |
| XVI ffx2-ixion-djose | rikku | 0 / 0 (9) | 0 / 0 (9) |
| XVI ffx2-ixion-djose | FIEND x2-ixion | 231 / 381 (9) | 27 / 45 (9) |
| XVII sin-fins-core | lulu | - | 0 / 0 (1) |
| XVII sin-fins-core | tidus | - | 0 / 0 (23) |
| XVII sin-fins-core | wakka | - | 143 / 408 (36) |
| XVII sin-fins-core | yuna | - | 100 / 370 (10) |
| XVII sin-fins-core | FIEND left-fin | - | 0 / 12 (12) |
| XVII sin-fins-core | FIEND right-fin | - | 0 / 104 (6) |
| XVIII sin-face | auron | 101 / 121 (7) | 102 / 130 (7) |
| XVIII sin-face | tidus | 83 / 175 (12) | 20 / 31 (12) |
| XVIII sin-face | yuna | 60 / 166 (9) | 57 / 140 (9) |
| XVIII sin-face | FIEND overdrive-sin | 96 / 101 (4) | 99 / 100 (4) |

**2560x1440**

| Chapter | Attacker | Before: median / max px (strikes) | After |
|---|---|---|---|
| I seymour-flux | kimahri | 13 / 13 (2) | 0 / 0 (2) |
| I seymour-flux | tidus | 219 / 219 (1) | 0 / 0 (1) |
| I seymour-flux | FIEND mortiorchis | 0 / 0 (1) | 0 / 0 (1) |
| I seymour-flux | FIEND seymour-flux | 471 / 471 (2) | 12 / 12 (2) |
| II yunalesca | auron | 0 / 0 (5) | 0 / 0 (5) |
| II yunalesca | tidus | 0 / 0 (10) | 0 / 0 (10) |
| II yunalesca | yuna | 97 / 101 (7) | 0 / 0 (7) |
| II yunalesca | FIEND yunalesca | 0 / 397 (13) | 0 / 0 (13) |
| III braskas-final-aeon | auron | 0 / 146 (8) | 0 / 148 (8) |
| III braskas-final-aeon | tidus | 0 / 0 (6) | 0 / 1 (6) |
| III braskas-final-aeon | yuna | 0 / 0 (1) | 0 / 0 (1) |
| III braskas-final-aeon | FIEND braskas-final-aeon | 64 / 283 (11) | 0 / 136 (10) |
| IV ffx2-bahamut | paine | 0 / 0 (11) | 0 / 0 (11) |
| IV ffx2-bahamut | rikku | 0 / 0 (9) | 0 / 0 (8) |
| IV ffx2-bahamut | FIEND bahamut | 19 / 297 (3) | 0 / 0 (3) |
| V ffx2-vegnagun-shuyin | paine | 0 / 0 (2) | 0 / 0 (2) |
| V ffx2-vegnagun-shuyin | rikku | 0 / 0 (6) | 0 / 0 (6) |
| VI ffx2-leblanc | paine | 0 / 0 (7) | 0 / 0 (6) |
| VI ffx2-leblanc | rikku | 49 / 339 (7) | 9 / 44 (7) |
| VI ffx2-leblanc | yuna | 0 / 231 (7) | 0 / 228 (6) |
| VI ffx2-leblanc | FIEND dr-goon | 899 / 924 (4) | 331 / 332 (4) |
| VI ffx2-leblanc | FIEND ormi-entrance | 0 / 0 (2) | 0 / 0 (2) |
| VII seymour-anima-macalania | rikku | 85 / 96 (5) | 80 / 128 (5) |
| VII seymour-anima-macalania | tidus | 0 / 0 (4) | 0 / 0 (4) |
| VII seymour-anima-macalania | yuna | 0 / 0 (3) | 0 / 0 (4) |
| VII seymour-anima-macalania | FIEND guado-guardian-a | 0 / 0 (12) | 0 / 0 (13) |
| VIII evrae-airship | rikku | 0 / 0 (4) | 0 / 0 (4) |
| VIII evrae-airship | tidus | 0 / 0 (1) | 0 / 0 (1) |
| VIII evrae-airship | wakka | 30 / 30 (1) | 0 / 0 (1) |
| VIII evrae-airship | FIEND evrae | 0 / 0 (1) | 0 / 0 (1) |
| IX yojimbo-cavern | kimahri | 11 / 92 (5) | 13 / 20 (5) |
| IX yojimbo-cavern | lulu | 341 / 341 (2) | 380 / 380 (2) |
| IX yojimbo-cavern | yuna | 48 / 96 (6) | 46 / 51 (6) |
| IX yojimbo-cavern | FIEND yojimbo | 0 / 0 (2) | 0 / 0 (2) |
| X seymour-natus | kimahri | 0 / 0 (2) | 0 / 0 (2) |
| X seymour-natus | tidus | 451 / 451 (2) | 502 / 502 (2) |
| X seymour-natus | yuna | 111 / 111 (1) | 0 / 0 (1) |
| XI ffx2-fallen-aeons | paine | 0 / 0 (8) | 0 / 0 (8) |
| XI ffx2-fallen-aeons | rikku | 0 / 0 (7) | 0 / 0 (7) |
| XI ffx2-fallen-aeons | FIEND x2-shiva | 0 / 121 (3) | 0 / 0 (3) |
| XII seymour-omnis | auron | 0 / 0 (1) | 0 / 0 (1) |
| XII seymour-omnis | tidus | 0 / 0 (4) | 0 / 0 (4) |
| XII seymour-omnis | yuna | 0 / 0 (6) | 0 / 0 (7) |
| XIII ffx2-trema | paine | 0 / 0 (7) | 0 / 0 (7) |
| XIII ffx2-trema | rikku | 0 / 0 (4) | 0 / 0 (5) |
| XIII ffx2-trema | yuna | 0 / 0 (2) | 0 / 0 (2) |
| XIII ffx2-trema | FIEND paragon | 0 / 444 (25) | 0 / 9 (27) |
| XIV isaaru-via-purifico | FIEND grothia | 0 / 33 (22) | 0 / 31 (21) |
| XV ffx2-den-of-woe | paine | 0 / 0 (1) | 0 / 0 (1) |
| XV ffx2-den-of-woe | rikku | 0 / 0 (5) | 0 / 0 (5) |
| XV ffx2-den-of-woe | yuna | 196 / 197 (3) | 191 / 198 (3) |
| XVI ffx2-ixion-djose | paine | 0 / 0 (5) | 0 / 0 (8) |
| XVI ffx2-ixion-djose | rikku | 0 / 0 (5) | 0 / 0 (8) |
| XVI ffx2-ixion-djose | FIEND x2-ixion | 397 / 649 (5) | 48 / 100 (9) |
| XVIII sin-face | auron | 157 / 205 (7) | 158 / 198 (7) |
| XVIII sin-face | tidus | 124 / 265 (11) | 3 / 46 (11) |
| XVIII sin-face | yuna | 99 / 261 (9) | 135 / 223 (8) |
| XVIII sin-face | FIEND overdrive-sin | 153 / 163 (3) | 157 / 160 (3) |

### The Sin fins chapter (XVII)

The default Attack strategy never reaches Sin's fins, so this chapter is its own run (`--strat=intended`, 360 s), live and after, 1600x900:

| Attacker | Live: median / max px (strikes) | After |
|---|---|---|
| FIEND left-fin | 75 / 81 (12; 17% within 12 px) | 0 / 12 (12; 100% within 12 px) |
| FIEND right-fin | 0 / 100 (6; 83% within 12 px) | 0 / 104 (6; 83% within 12 px) |
| lulu | 139 / 139 (1; 0% within 12 px) | 0 / 0 (1; 100% within 12 px) |
| tidus | 176 / 351 (23; 43% within 12 px) | 0 / 0 (23; 100% within 12 px) |
| wakka | 185 / 466 (35; 37% within 12 px) | 143 / 408 (36; 42% within 12 px) |
| yuna | 202 / 413 (10; 0% within 12 px) | 100 / 370 (10; 0% within 12 px) |

Tidus 43 to 100 percent and the left fin 17 to 100 percent within 12 px (party overall 33 to 56 percent, fiends 39 to 94 percent). Wakka and Yuna stay 100 to 400 px short: the fin is 390 to 420 px above them (a lateral lunge cannot touch it).

### Overdrives (`--od`: the gauge full on Tidus or Wakka)

Overdrive lunges ride the same solver. Closest painted gap during the strike, live > after, 1600x900: Chapter III Spiral Cut 0 (38 px at the apex) > 0 (0 at the apex), lunge 2.10 > 2.68; Chapter X
Spiral Cut **221 px short > 0**, lunge 1.40 > 3.47; Chapter VIII Wakka's Element Reels 35 > 5 px (Evrae's head stands 356 px above his, so it can only line up). Chapter I's Overdrive
never fired in either run (the party was defeated first), so it has no number. The frames are in `od-apex-sheet-1-1600x900.jpg` (they are the Overdrive's own letterboxed cut).

### FFX-2's run-in

`cap/ffx2-runin.mjs`: the girls' strikes after a run-in (lunge 0.6) and without one (1.4), closest gap median / max, before > after, 1600x900. Run-in strikes: median 0 in all seven FFX-2
chapters before and after; the longest gap left after a run-in fell from 127 px to 31 px in Leblanc (Rikku, 7 strikes at 170 to 220 px on this branch before the run-in reach was added; 0 to 31 px after it),
and the plan the run-in makes is unchanged (same stop, same truck; the rect read in a cut now keeps the camera's truck, which only a run uses). Without a run-in (a Gunner or a menu open) the lunge is
1.4 to the unit, as sourced: Leblanc Yuna 140 to 162 px, Den of Woe Yuna 120 px.

### No new collisions

- **Through the target:** 0 of 98 lengthened strikes (1600) and 0 of 94 (2560) have the attacker's box pass entirely through the target's at the apex. (Across all strikes, live and
  after alike, 47 of 275 pairs pass through at the apex: Chapters VII, XI, XV, IX, XVIII, where a girl's or a fighter's seat is already on the far side of the foe. The solver never shortens a lunge, so these are
  unchanged and are listed under "What is left".)
- **In the attacker's depth lane** (|dz| < 0.5), 1600: 32 strikes overlap a figure there by more than 400 px² on live and 35 after; 15 grow by more than 400 px². Ten of the fifteen already overlapped the
  same figure at rest, so it is the stage's own composition and the solver leaves it alone by design (a guard that stopped them would undo the Chapter I fix: Mortiorchis hangs off Seymour's back, 10k px² at rest; the
  Chapter III boss stands in front of its pagoda, 4 to 5k; Tidus through Yuna 22k, Kimahri 3k > 13k in Chapter X, Yuna 13k > 23k in Chapter XII: the party heap, PR-0382); five are new from zero: Sin's
  Yuna brushing Auron, about 1,100 px² each (a 33 px sliver). At 2560 the same picture (16 strikes grow, the same pairs).
- **Overlap with a figure at another depth** (a longer lunge crosses more of the screen, in front of or behind someone who stands nearer or farther): 194 of 341 strikes overlap someone by more than 400 px² on live and 210 after (198 and 208 of 313 at 2560). These are draw-order overlaps,
  not intersections on the floor.

### Jerks (CHK-027, `critic/runner/lib/continuity.mjs`, real keys, seed 1, 1600x900, live vs this branch, same six chapters)

| Chapter | Live: s, jerks (per min), 40 px or more (per min), worst px | Release 39.1 candidate: same | Candidate before the eased step: same |
|---|---|---|---|
| I seymour-flux | 534 s, 119 (13.4), 62 (7.0), 330 | 495 s, 83 (10.1), 44 (5.3), 347 | 520 s, 135 (15.6), 76 (8.8), 348 |
| II yunalesca | 663 s, 359 (32.5), 150 (13.6), 314 | 639 s, 319 (30.0), 123 (11.6), 274 | 662 s, 364 (33.0), 149 (13.5), 313 |
| III braskas-final-aeon | 922 s, 300 (19.5), 130 (8.5), 248 | 928 s, 235 (15.2), 101 (6.5), 248 | 918 s, 318 (20.8), 160 (10.5), 248 |
| IV ffx2-bahamut | 438 s, 132 (18.1), 84 (11.5), 238 | 394 s, 133 (20.2), 76 (11.6), 317 | 416 s, 148 (21.3), 90 (13.0), 337 |
| VI ffx2-leblanc | 446 s, 102 (13.7), 40 (5.4), 257 | 433 s, 112 (15.5), 45 (6.2), 257 | 439 s, 130 (17.8), 73 (10.0), 257 |
| X seymour-natus | 218 s, 69 (19.0), 16 (4.4), 88 | 218 s, 61 (16.8), 24 (6.6), 230 | 215 s, 62 (17.3), 27 (7.5), 109 |
| **All six** | 3220 s, 1081 (20.1), 482 (9.0) | 3107 s, 943 (18.2), 413 (8.0) | 3170 s, 1157 (21.9), 575 (10.9) |

- Jerks per minute fall from 20.1 to 18.2, and jerks of 40 px or more from 9.0 to 8.0 a minute, on six chapters (3,220 s live, 3,107 s candidate). Without the eased step the candidate was **worse**
  than live (21.9 and 10.9): the extra distance is what made the pops, and the eased step is what removes them.
- Chapters IV and VI (FFX-2) are up a little (18.1 > 20.2 and 13.7 > 15.5 a minute): a fiend's lunge is longer there, and its return leg is faster (the move keeps its 440 ms, so a 3.7 unit return
  covers 3.7 units in 185 ms, 50 to 70 px a frame at 1600).
- Chapter X's worst jerk went from 88 to 230 px and its 40 px events from 4.4 to 6.6 a minute: the three biggest events (Tidus, 229, 228 and 169 px) are single frames after a **147 ms and a 58 ms
  stall** of the headless renderer (the probe's frame times), landing on a fast return leg: the game catches a stalled frame up in one step, and a long lunge makes that step long. They are
  stalls, not a pop in the move; they happen on live too, with a shorter lunge to show them.
- **Lunge-level** (the harness's jerk rule applied to every lunge's own track, netted for the camera; `cap/tracks2.mjs`): per lengthened lunge 0.85 events (0.21 of 40 px or more) on the
  final candidate, 1.02 (0.50) before the eased step; per unchanged lunge 0.55 (0.06). The events are on the first two frames (the step) and the return leg, never the apex.
- **Do lunges pop back to the seat (PR-0380)? No.** `lungeOffset` ends the move at exactly 0 on a smooth settle: the last frame's step is 6 px (median) and 26 px (max) at 1600 over 188 lunge tracks. In
  round 22's live evidence (17 chapters), of 979 jerks of 40 px or more 400 sit at pose swaps and 579 in mid-move, and **only 11 of those 579 follow an action-start**. The boss jerks of PR-0380
  (Ifrit's KO 200 px over, Yunalesca's quarter screen, Sin's fin, Vegnagun's tail) are pose anchors at KO and attack swaps (`src/data/art/poseRegistrationFoes.ts`), which this lane does not touch.

### What it costs

`StageMotion.shape` reads a painting's alpha once per texture (128 x 192, cached): cold 2.5 ms worst (median 1.3 ms) for 16 masks, warm 0.1 ms. `strikeReach` per strike: 2.2 ms cold, 0.7 ms
warm (median 0.2 ms), once at the start of the action (`cap/time-reach.mjs`, headless Chromium on the GPU).

### The frames (`docs/screenshots/r391-reach/`, JPEG, 1600x900, the frame after the apex of the first strike, before (live) on the left, after on the right)

- `party-apex-sheet-1..6-1600x900.jpg`: the party's first physical strike, three chapters a sheet (I to XVIII).
- `boss-apex-sheet-1..6-1600x900.jpg`: a fiend's first strike.
- `od-apex-sheet-1-1600x900.jpg`: the Overdrive's lunge (III, VIII, X; Chapter I never fired one).
Different runs reach different moments (a different target, a different boss action), so a pair shows the same kind of moment, not the same frame.

## What is left, and what it costs

- **Targets above or below the attacker** (a lateral lunge cannot touch them, it only lines up): Yojimbo's cavern (Lulu 167 to 180 px, Yuna and Kimahri 13 to 30 px, the foe 90 to 100 px higher), Isaaru's Grothia
  (15 to 19 px, 155 px higher), Sin's fins (Wakka and Yuna 100 to 400 px, the fin 390 to 420 px higher; Sin's face 80 to 140 px for Auron and Yuna), Wakka's reels at Evrae. A fix is staging or a different move (a leap),
  not a longer lunge.
- **The cap (+3 world units).** Dr. Goon > Rikku in Chapter VI ends 170 px away at 4.4 units, Ixion > Yuna 32 to 45 px, the Chapter III boss > Tidus 72 px, Sin's face > Tidus 13 to 37 px. A target further than
  the cap is a design question.
- **Girls who stay** (Gunner, Gun Mage, Lady Luck, Alchemist, Trainer, or a menu open) end far from their target by design (sourced): Yuna the Gunner at Leblanc 140 to 160 px, at the Den of Woe 120 px.
- **Pass-through before the strike.** 47 of 275 strike/target pairs (live and after alike) have a fighter whose seat is on the far side of the foe (Anima, Fallen Aeons, Den of Woe, Yojimbo, Sin): the strike
  then plays behind or through the foe. Never shortened by this change; a staging question (PR-0382 is the same family).
- **HUD panels cover the strike** in the frames of Chapters I, VII and others (Tidus under the Tidus plate at the right, the Mortiorchis panel over a struck figure): HUD placement, not the lunge.
- **A frame stall on a fast return leg** looks like a pop (above). It is the renderer's, not the move's, but a long lunge shows it larger.

## For Bailey (nothing here is built beyond the fix: rule 10)

1. **FFX-2 fiends reach** (judgement call, the sources are silent on a fiend's approach): kept, one line to revert (`reachFor`). Say if you would rather an FFX-2 fiend keep 1.4.
2. **REDUCE MOTION.** The lunge is not gated by it today (the house 1.4 plays). A reach of up to 4.4 units is more motion. Option: keep 1.4 under REDUCE MOTION (the strike then may stop short for
   those players), or let it reach. Not decided here.
3. **Ease the whole step** (a feel change, so yours to pick): the house part keeps today's kicked cubic-out step. A smoothstep step for every lunge halves the lunge-level jerk events again in the simulation
   (`cap/sim-lunge.mjs`: 1.4 units at 110 px/unit 1.65 > 0.95 events a lunge) but changes how every attack starts; mockup first if you want it.
4. **Longer lunge for a longer reach** (e.g. 440 > 600 ms past 2 units) would lower the return leg's speed and the stall artefact; it moves the blow's timing against the hit, so it needs the same yes.

## Gates

- `tsc --noEmit` is clean (run with main's `node_modules`, `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .` in the worktree).
- The six test files of this lane: `stand-reach` 39, `silhouette` 10, `silhouette-nodom` 1, `r391-reach-shape` 9, `r391-reach-curve` 6, `r391-run-in-reach` 4: 69 tests green. Every test touching motion, staging, the presenter,
  contact, key poses, the camera, the engine and the chapters: 185 files, 2,110 tests green.
- **Full suite** (`npm test`): 877 files, 871 passed, 5 skipped, **1 failed**: `strategy-ffx2-bahamut.test.ts` "heal-only route (no Shell, no Breaks) clears Mega Flare" timed out under the full run's parallel load
  (23 and 30 s against the 15 s `testTimeout`, in two full runs). It is an engine-only simulation (no presenter, no motion code runs in it) and **passes alone in 10.1 s on this branch and 9.5 s on main**;
  alone and beside four other strategy files it passes at 12 s. A flake of the suite's load, not of this change; left alone.
- `node tools/orphans.mjs`: 1,292 modules, 24 orphaned: the same 24 as main (1,290 modules, 24 orphaned); the two new modules (`Silhouette.ts`, `StrikeReach.ts`) are reachable.
- Real-input browser checks: every strike, shot and continuity number above is from headless Playwright on the real GPU, real keys from the title, live against this branch; frames under `docs/screenshots/r391-reach/`.
- Not pushed to `main`, not deployed (the driver's). No source file was started or grown past its size except `BattlePresenterEvents.ts` (431 > 439 lines, already over the 400 limit on `main`: the counter's reach and the burst field).

## Files

New: `src/engine/motion/Silhouette.ts`, `src/engine/motion/StrikeReach.ts`; tests `tests/unit/silhouette.test.ts`, `silhouette-nodom.test.ts`, `r391-reach-shape.test.ts`, `r391-reach-curve.test.ts`,
`r391-run-in-reach.test.ts`. Rewritten: `src/engine/motion/StandReach.ts`, `tests/unit/stand-reach.test.ts` (39 tests). Changed: `BattlePresenterBeats.ts` (the lunge line), `BattlePresenterEvents.ts` (counter, `EventCtx.burst`),
`BattlePresenter.ts` (burst), `BattlePresenterMotion.ts` (`reachFor`), `BattlePresenterPorts.ts` (`lunge(.., house)`), `BattlePresenterStage.ts`, `BattlePresenterActors.ts` (`reachOffset`), `KeyPoses.ts`
(`blowPose`), `PaintedActor.ts` (`poseShape`, `lunge`'s house part), `motion/StageMotion.ts`, `motion/StageMotionPort.ts` (`shape`, `rect(pose)`, truck read), `fx/mix/stageTable.ts`, `staging.ts`,
`framingReport.ts` (the `follow` flag removed), `src/app/screens/BattleScreenRunIn.ts` (`reachFor`). `docs/CONTRACT-CHANGES.md` has the entry (additive; no contract-list file changed).

## Changelog line for the driver (both games)

> **Both games, with FFX-2's girls only after their run-in:** a physical attack now reaches its target in every chapter. The lunge is solved against the painted figures on screen (never less than
> before, at most 3 units more), so Tidus reaches Seymour Flux in Chapter I, Ixion reaches his target in Chapter XVI and Natus's Spiral Cut touches. Strikes within 12 px of their target: party 73 to 80
> percent, fiends 65 to 82 percent (1600x900); the longer lunge eases its first step so it adds no jerks (20.1 to 18.2 a minute on six chapters).
