# r392-size: the last CHK-026 residue (Chapter I feet, Chapter II Yunalesca, Chapter VII victories), release 39.2 material

Date 2026-10-06. Branch `r392-size` (from `origin/main` 30e7d701), worktree `D:/pyrefly-cf-switch`. Nothing is merged and nothing is deployed. Authority: the driver's lane brief (D-490, Bailey: "Ok I approve of all of the above").
Game case: **both games** for the harness change and the tooling (shared critic plumbing); **FFX only** for every registration value (Yuna, Rikku, Yunalesca; Chapters I, II and VII).
The brief: CHK-026 PASS in all 18 chapters; the check measures the game truthfully and is never loosened (tolerances unchanged: 3 percent head by registration, 30 percent by mass, 2 px and 6 px feet); harness changes and game changes in separate commits.
A previous run of this lane died when the app restarted; its uncommitted work was reviewed, kept where it was right and corrected where it was not (see "What changed from the dead run's work").

## Result

CHK-026 on a production build of this branch's table (`b8fcae0b`: `BASE_PATH=/ vite build`, `vite preview`), all 18 chapters, round 23's route (the harness `critic/runner/lib/continuity.mjs`, real keys from the title, headless Chromium on the GPU, 1600x900, seed 1, 57.8 to 59.8 fps in every chapter, three to five lanes at a time),
against round 23 on live 39.1 (`critic/rounds/round-23/continuity/`). The failing chapters were run a second time on the same build.

- **The three residues the brief named are fixed.** Chapter I PASS (feet 4.2 px -> 0.9 px: the harness read the figure's own jolt as a registration error, section 1), Chapter II PASS (Yunalesca by head: the baseline build judged by head FAILS with 64 swaps over 3 percent, worst 48.1 percent; now 615 head-judged swaps in the chapter, worst 1.3 percent, section 3),
  Chapter VII PASS (Yuna x0.948 -> 0.976, Rikku x0.967 -> 0.983, section 2).
- **15 of 18 chapters PASS in the first run (round 23: 15 of 18). CHK-026 does not PASS in all 18, and I found no registration value that makes it.** Three chapters FAIL in the first run, none of them one of the three residues and none caused by this branch:
  **Chapter XVII FAILS both times** (Yuna's KO swaps: x1.0334, x0.9698, x0.9696 in run 1, six swaps up to x1.0381 in run 2; round 23 failed on the same three as run 1), **Chapter V FAILS both times** (Rikku Dark Knight's KO swaps, x1.0309 and x0.965, then x1.030 and x0.9667; round 23's run had no KO of a girl and passed),
  and **Chapter III failed once** (a three-frame flash of the possessed Valefor's KO painting, read by mass at x1.349 against 30 percent) and **passed the second time** (worst 26.1 percent, as in round 23): a flicker that does not always happen.
  The KO swaps follow the stage camera, not the table (section 4a: the lying head's ratio to the standing head falls from x1.05 to x0.97 as the camera's perspective goes from 0.98 to 1.04, across subjects and games), and the flash is a presenter flicker read by the asymmetric mass tolerance (section 4b).
  The structural fix (the engine holds the head, section 4a option 1) is not a registration change, so it is not in this branch.

| Ch | chapter | game | before (round 23): CHK-026 | head % (registered / by mass) | feet px | swaps over | after: CHK-026 | head % (registered / by mass) | feet px | swaps over | judged (by head / by mass), seconds | second run |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| I | seymour-flux | FFX | **FAIL** | 2.5 / 12.6 | 4.2 | 1 | PASS | 2.5 / 12.6 | 0.9 | 0 | 427 (243 / 184), 477 s |  |
| II | yunalesca | FFX | PASS | 1.3 / 25.9 | 0.9 | 0 | PASS | 1.3 / 25.9 | 1 | 0 | 779 (615 / 164), 627 s |  |
| III | braskas-final-aeon | FFX | PASS | 1.8 / 26.1 | 1.5 | 0 | **FAIL** | 2.1 / 34.9 | 1.5 | 1 | 1477 (872 / 605), 1383 s | PASS (2.1 / 26.1, 1.5 px, 0 over) |
| IV | ffx2-bahamut | FFX-2 | PASS | 1.1 / 9.4 | 0.5 | 0 | PASS | 1 / 9 | 0.5 | 0 | 382 (244 / 138), 359 s |  |
| V | ffx2-vegnagun-shuyin | FFX-2 | PASS | 1.3 / 9.4 | 1.2 | 0 | **FAIL** | 3.5 / 9.4 | 0.7 | 2 | 1192 (845 / 347), 1477 s | FAIL (3.3 / 9.4, 0.8 px, 1 over) |
| VI | ffx2-leblanc | FFX-2 | PASS | 1.7 / 28.7 | 0.6 | 0 | PASS | 1.6 / 28.7 | 0.6 | 0 | 582 (378 / 204), 639 s |  |
| VII | seymour-anima-macalania | FFX | **FAIL** | 5.2 / 25.7 | 0.9 | 2 | PASS | 2.4 / 25.7 | 0.9 | 0 | 365 (130 / 235), 331 s |  |
| VIII | evrae-airship | FFX | PASS | 1.6 / 1.6 | 0.9 | 0 | PASS | 1.5 / 1.5 | 0.9 | 0 | 372 (372 / 0), 336 s |  |
| IX | yojimbo-cavern | FFX | PASS | 2 / 4.8 | 0.8 | 0 | PASS | 2 / 4.8 | 0.8 | 0 | 119 (72 / 47), 127 s |  |
| X | seymour-natus | FFX | PASS | 0.6 / 16.7 | 0.8 | 0 | PASS | 2.1 / 16.7 | 0.7 | 0 | 257 (146 / 111), 215 s |  |
| XI | ffx2-fallen-aeons | FFX-2 | PASS | 1.8 / 16.2 | 0.7 | 0 | PASS | 1.1 / 16.2 | 0.7 | 0 | 708 (484 / 224), 846 s |  |
| XII | seymour-omnis | FFX | PASS | 1.4 / 8.7 | 1.6 | 0 | PASS | 2.1 / 8.7 | 1.5 | 0 | 903 (552 / 351), 718 s |  |
| XIII | ffx2-trema | FFX-2 | PASS | 1.6 / 2.5 | 0.7 | 0 | PASS | 1.6 / 2.5 | 0.7 | 0 | 642 (450 / 192), 416 s |  |
| XIV | isaaru-via-purifico | FFX | PASS | 0.4 / 25.7 | 1.3 | 0 | PASS | 0.3 / 25.7 | 1.3 | 0 | 221 (10 / 211), 259 s |  |
| XV | ffx2-den-of-woe | FFX-2 | PASS | 1.8 / 3 | 1.2 | 0 | PASS | 1.7 / 3 | 1 | 0 | 192 (124 / 68), 151 s |  |
| XVI | ffx2-ixion-djose | FFX-2 | PASS | 1.1 / 16.8 | 0.5 | 0 | PASS | 1.1 / 16.8 | 0.5 | 0 | 410 (278 / 132), 494 s |  |
| XVII | sin-fins-core | FFX | **FAIL** | 3.3 / 24.1 | 1 | 3 | **FAIL** | 3.3 / 24.2 | 1 | 3 | 1198 (1135 / 63), 1104 s | FAIL (3.8 / 24.1, 1 px, 6 over) |
| XVIII | sin-face | FFX | PASS | 1.6 / 6.2 | 0.9 | 0 | PASS | 1.8 / 6.2 | 1.1 | 0 | 228 (227 / 1), 200 s |  |

"Judged" counts a change of pose; a head is judged at 3 percent where both paintings have a registered head and at 30 percent (the figure's mass) where one has none; feet at 2 px (registered stance) or 6 px. "Before" is round 23's own file (the harness of `30e7d701`). In these 18 first runs and the second runs
the old and the new analysis (`86a34192`) agree on every swap: no hurt to idle with a KO cutting in happened, so these PASSES do not rest on that change; section 1's captures prove it.

## The commits

| commit | what | case |
|---|---|---|
| `86a34192` | CHK-026 reads the old and the new painting in one frame when a KO re-points the old plane in the swap's own frame (`critic/runner/lib/continuity-pure.mjs`, `critic/CHECKS.md`, 2 tests): **the harness**. Written by the dead run, proved here | both |
| `2d42ef7f` | a camera allowance, a factor on a pose's applied scale with its reason in the record (`tools/posescale/measure.py`, `tools/pose-scale-check.mjs`, 2 tests); writes no value: **tooling** | both |
| `7a0dbb97` | the first values: Yuna's victory and critical, Rikku's victory (Chapter VII) | FFX only |
| `cf94064a` | Yunalesca's first form sized by head, not by mass (Chapter II): **a visible change, needs Bailey's eye** | FFX only |
| `b8fcae0b` | Yuna's victory 0.807 back to 0.804: a rising camera bounds it. **Corrects `7a0dbb97`** | FFX only |
| the last commit | this note, the pictures and the evidence scripts | records only |

`7a0dbb97` and `b8fcae0b` are two commits because the first value I wrote (0.807) was centred over the cameras the harness had seen and the second (0.804) over the cameras the game has (see section 2); the history keeps both.
Harness commits and game commits never share a commit. Each game commit can be dropped alone (`cf94064a` without touching the allowances; the allowances without Yunalesca).

## 1. Chapter I: the harness charged the figure's own motion to the registration (`86a34192`, critic only)

**What the check says.** CHK-026 item 1: at a swap the old and the new painting are read through their own planes *in the same frame*, so the camera cannot be the cause. When a KO cuts in while a hurt-to-idle crossfade still runs,
the engine re-points the hurt plane's slot at the KO painting in the swap's own frame. The hurt painting then has no plane in that frame, and the harness read it in the frame before and the idle painting in the swap's frame: two frames.
Whatever the figure did in that one frame went into the registration's account.

**The exact frames** (Yuna, Chapter I, a baseline run on live 39.1's table, swap frame 3210; registered stance and head box through each plane, px at 1600 wide, the camera does not move;
`docs/handoff/r392-size-evidence/ch1-yuna-swap-3210-planes.json`, picture `docs/screenshots/r392-size/ch1-yuna-hurt-idle-feet-frames.png`):

| frame | hurt plane | idle plane | the slot that held the hurt painting |
|---|---|---|---|
| -4 | fade 0.97, feet 998.3, 765.5 | fade 0.03, feet 998.3, 765.1 | |
| -3 | fade 0.89, feet 998.6, 765.2 | fade 0.11, feet 998.7, 764.9 | |
| -2 | fade 0.76, feet 999.0, 765.0 | fade 0.24, feet 999.0, 764.7 | |
| **-1** | fade 0.57, feet 999.3, 764.7 (head 29.4 px) | fade 0.43, feet 999.3, 764.5 (head 29.8 px) | **the two paintings are 0.24 px apart: the new reading** |
| **swap (3210)** | not in the frame | fade 0.65, feet **1003.3, 762.6** (+3.9 px, -1.9 px) | now the **KO painting**, fade 0.35 |
| +1 | | fade 0.99, feet 1001.1, 767.3 | KO painting, fade 0.01 |

The old reading was the hurt plane at -1 against the idle plane at the swap frame: 4.4 px. That is the **idle plane's own move** between the two frames (4.35 px), the start of the KO's recoil: the idle plane and the KO plane keep a nearly constant
offset (about 23 px across, 4 to 5 px up) from the swap frame on, so they move as one group. In the frame before, where both paintings are in one frame, they agree to 0.24 px and the heads read x1.0134.

**Over every capture I have** (`docs/handoff/r392-size-evidence/harness-replay.mjs compare`; 50 captures of the 18 chapters, 36,910 judged swaps: the dead run's, the baseline's, this lane's final runs, and three staged on the final build):
9 readings differ between the old analysis (`30e7d701`) and the new one, **all nine fail to pass, none passes to fail**, and the other 36,901 are bit-identical. The nine are all a standing figure's hurt to idle with a KO painting in the old
painting's slot at the swap frame and the surviving plane 3.2 to 4.5 px from where it was the frame before (six from real fights, three staged):

| capture | swap | old feet | new feet | planes apart in the frame before | the old painting's slot at the swap frame | surviving plane moved |
|---|---|---|---|---|---|---|
| baseline Ch I, run A | Yuna hurt to idle, frame 3210 | 4.4 px | 0.2 px | 0.24 px | KO, fade 0.35 | 4.35 px |
| baseline Ch I, run A | Yuna hurt to idle, frame 19971 | 4.4 px | 0.3 px | 0.29 px | KO, fade 0.35 | 4.31 px |
| baseline Ch I, run B | Yuna hurt to idle, frame 2839 | 4.7 px | 0.3 px | 0.28 px | KO, fade 0.35 | 4.54 px |
| r392 build (0.807), Ch I | Yuna hurt to idle, frame 3094 | 4.2 px | 0.2 px | 0.24 px | KO, fade 0.35 | 4.14 px |
| dev build, Ch I | Tidus hurt to idle, frame 11537 | 3.2 px | 0.3 px | 0.30 px | KO, fade 0.19 | 3.24 px |
| dev build, Ch XII | Wakka hurt to idle, frame 28317 | 3.7 px | 0.5 px | 0.52 px | KO, fade 0.35 | 3.43 px |
| **final build**, staged: `ko-cutin-stage.mjs` (hurt, the crossfade to idle, the KO 4 frames in) x3 | Yuna hurt to idle, frames 616, 790, 964 | 3.8, 3.7, 3.7 px | 0.3, 0.2, 0.3 px | 0.27, 0.23, 0.29 px | KO, fade 0.35 | 3.67, 3.59, 3.59 px |

**What it keeps.** The outline of CHK-027 (the picture across the two frames: IoU, centroid shift, snaps, ghosts) still reads across them, so the snap and double-image counts do not move. A real registration error is still read: the second new
test puts a 5 px error between the two paintings in the frame that has both and the check reads 5 px and FAILs. In the same-frame case nothing but the registration can move the head or the feet, which is what the check says it measures.

**Disclosure.** In the final runs of the 18 chapters (and the second runs and the battle-size runs) no such swap happened, so every one of those verdicts is the same on the old analysis: the proof of this change is in the nine captures above, not in the PASSES. The staged capture
(`docs/screenshots/r392-size/ch1-yuna-hurt-idle-ko-cut-in-strip.jpg`) is the case on a build of this branch at battle size.

## 2. Chapter VII: the stage camera draws a lower head smaller (`2d42ef7f`, `7a0dbb97`, `b8fcae0b`)

**What round 23 saw.** Chapter VII (Macalania) idle to victory: Yuna x0.948, Rikku x0.967 (3 percent allowed). Five baseline runs read Yuna x0.948 to 0.953 and Rikku x0.967 to 0.970. Their victory heads sit below the idle's
(by the records, Yuna's head stands 24 percent lower above her feet than her idle's, Rikku's 9 percent; Auron's 2, Tidus's is 27 percent higher), and a camera that converges draws a lower head smaller. **It is what a player sees, not a harness artefact:** at the swap frame the idle plane's top edge is
17 percent longer than its bottom edge (`docs/handoff/r392-size-evidence/ch7-victory-frames-baseline.txt`: 482 px against 413 px), the camera converges strongly, and a head lower in the plane is drawn smaller.
The same Yuna reads x0.985 in Chapter I (perspective 1.04), x0.994 in Chapter III (1.01) and about x1.00 where the camera is flat; the harness's own frames give the line:

| chapter (FFX) | the camera's perspective at the victory swap (idle plane's top edge over its bottom edge) | Yuna idle to victory, live table | with 0.804 |
|---|---|---|---|
| VII Macalania, the close victory camera | 1.17 to 1.23 | x0.948 to 0.953 (five runs) | x0.972 to 0.977 (final build, measured: **0.9764**) |
| I | 1.03 to 1.05 | x0.985 to 0.986 | x1.011 to 1.012 |
| III | 1.01 to 1.02 | x0.994 to 0.996 | x1.019 to 1.021 |
| XII | 1.02 (Wakka's plane) | x0.9945 (round 23) | x1.020 |
| X, IX | not in round 23's file | x0.996, x0.991 | x1.021, x1.016 |
| XVII Sin core | 0.99 to 1.004 | she wins from her critical pose there: critical to victory x0.9994; Tidus, Wakka and Lulu idle to victory x0.997 to 1.006 | critical to victory x1.014 |

A line of about -0.29 per unit of perspective runs through Yuna's points: x0.9987 at 1.00 and x1.0016 at 0.99. The allowance has to hold Macalania (x0.9477 at the worst: it needs 1.0235 or more) and a rising camera (x1.0016 at 0.99: it needs 1.0284 or less),
so its window is **x1.0235 to x1.0284 and 1.0255 centres it** (table 0.784 to 0.804): about a quarter of a percent inside the tolerance at both ends. That is thin and I say so: a victory camera more extreme than any seen breaks it.

- **Yuna victory 0.784 to 0.804** (`allow` 1.0255). Final build, Chapter VII: Yuna x0.9764 (was 0.948), the other Yuna victory swaps in every chapter I have inside 3 percent with at least 0.19 percent to spare.
- **Yuna critical 0.967 to 0.977** (`allow` 1.0103). Her critical head reads x0.983 to 0.998 of her idle's in the seven chapters that show it, all small; raising her victory alone puts critical to victory at up to x1.028 (a Chapter XVII capture of the first build, victory 0.807 and critical unchanged, read x1.0288),
  so the critical is recentred (x0.993 to 1.008 of her idle's) and critical to victory reads x1.015 to 1.018.
- **Rikku victory (none) to 1.015** (`allow` 1.015). Chapter VII: x0.9836 (was 0.9667). Only Chapter VII showed her victory; the far-camera end is inferred from Yuna's and Auron's (x1.01 to 1.02), 3 percent allowed both ways.

**This is not a way to pass the check.** The head box stays as read in the record (it says what the painting is); the factor sits beside it with its reason; CHK-026's readings and tolerances are untouched; `tools/pose-scale-check.mjs` refuses an allowance with no
reason or outside 0.9 to 1.1 (a test holds both); no KO allowance exists (section 4). Every value is written from heads the harness measured on screen, and the reasons in `tools/posescale/overrides.json` carry the cameras.

## 3. Chapter II: Yunalesca's first form, sized by head (`cf94064a`; a visible change)

The harness reads a foe by the area of its silhouette (30 percent) because no foe had a registered head. Yunalesca's first form is painted at four different scales: at the idle's pixel scale (what live 39.1 draws; her sidecars carry no scale)
her hurt head is x1.48 of the idle's, her attack head x1.42 and her cast head x1.30, while the silhouettes read x0.87, 1.16 and 1.16, so the mass reading never saw the jumps and flagged only the swap between two silhouettes (hurt to attack, x1.33, a crouch
against a lunge; by head it is x0.95). On the baseline build, judged by the registered heads, Chapter II FAILS: 64 swaps over 3 percent, worst 48.1 percent (`ev-big-before`, a like-for-like run). The mass rule is not wrong for the party-calibrated
tolerance, but for a boss with a face it hides head jumps, so the fix is the boss's head, not a looser rule.

The idle's face box is registered (`subjects.json`, `face` [306,115,432,250]: hair and face, hair top to chin, the crown and feathers left out, as for every head), with a face centre per pose (`anchors.json`) and a head-matched reading per pose
(`reviews.json`: hurt 0.67, attack 0.70, cast 0.77; the KO is kept at its own scale), checked by eye with the idle's box beside each head at its table scale (`docs/screenshots/r392-size/yunalesca-1-heads-at-table-scale.jpg`).
**On screen at battle size** (`docs/screenshots/r392-size/yunalesca-1-poses-before-after.jpg`, 1:1 with the 1600x900 battle): idle head 49.1 px; hurt 73.0 -> 48.5 px, attack 69.7 -> 48.4, cast 63.6 -> 48.7 (x1.48, 1.42, 1.29 -> x0.99, 0.99, 0.99 of the idle's).
Final Chapter II run: 615 swaps of the chapter are judged by registered head (553 in round 23) and the worst is 1.3 percent (Yunalesca's own: idle to hurt x0.987 to 0.989, to attack x0.987 to 0.990, to cast x0.994 to 1.002, and the way back x0.998 to 1.013), CHK-026 PASS. Forms 2 and 3 are painted consistently (mass x0.97 to 1.03 between poses) and are left alone.

**Needs Bailey's eye:** the three poses are drawn 23 to 33 percent smaller than before (the hurt crouch's plane is now two thirds as tall as her idle's). It is the same head-matching principle every other figure has had since release 39, and the before row shows what it fixes,
but it is a visible change to a boss, so it is its own commit (`cf94064a`) and can be dropped alone.

## 4. What still fails, and why no table value fixes it

### 4a. KO swaps follow the stage camera (Chapter XVII Yuna; Chapter V the girls; Chapter I at the edge)

A KO swap's head ratio (the lying head over the standing one, on screen, both read in one frame) is a function of the camera's perspective at that frame, across subjects and games
(`docs/screenshots/r392-size/ko-ratio-vs-camera-perspective.png`; 165 KO swaps with a registered head on both sides, 11 subjects, Chapters I, V, XI, XVII and the others that had one):
x1.04 to 1.05 where the camera looks up (Chapter V, perspective 0.98 to 0.99: Yuna White Mage 1.039 to 1.041, Paine Dark Knight 1.035, Rikku Lady Luck 1.051, Rikku Dark Knight 1.036),
x1.03 for Yuna (up to 1.038) and x1.02 for Auron in Chapter XVII (0.997 to 1.001), x0.99 to 1.00 around 1.02 to 1.03 (Chapters V and XI), x0.972 to 0.985 in Chapter I (1.04). The slope is about -1.1 to -1.4 per unit of perspective and differs by subject
(Yuna's -1.35, Tidus's -0.6 to -0.7): a 3 percent window each way is 4.6 percent of perspective wide, and the game's stage cameras span 0.98 to 1.17 at least. CHK-026 item 1 reads both paintings in one frame "so the camera cannot be the cause",
and that holds for two standing planes; a lying plane is rolled onto the floor (`PaintedRest.placePlane`) and a standing one is upright, so the camera scales them differently even in one frame.

What this does to the 18: **Chapter XVII FAILS in both runs** (run 1: Yuna hurt to KO x1.0334, KO to idle x0.9698 and x0.9696, the three swaps round 23 failed on at x1.0326, x0.9688 and x0.9698; run 2: six swaps, the worst idle to KO x1.0381), **Chapter V FAILS in both runs** (Rikku Dark Knight hurt to KO x1.0309 and x1.030, KO to idle x0.965 and x0.9667;
round 23's Chapter V run had no KO of a girl and passed; the dead run's runs of it failed on White Mage and Dark Knight KOs at x1.027 to 1.041). Chapter I passes with 0.5 percent to spare (Yuna x0.972 to 0.985).

No table value holds it. For Yuna alone, 40 swaps pooled over every capture (live-table readings): Chapter I x0.9718 to 0.9811, Chapter XVII x1.0281 to 1.0323 (as KO over idle). A scale factor f on her KO has to be 0.99815 or more for Chapter I and 0.99864 or less for Chapter XVII:
a window 0.05 percent wide, and the table's three decimals (0.529) cannot sit in it (0.528 is x0.9981: 0.004 percent short on Chapter I's lowest draw); her hurt to KO (x1.0334) would also need her hurt scale +0.3 percent. Every compromise I could write moves the failure between
the two chapters with a few hundredths of a percent of margin; the pooled draws are in `docs/handoff/r392-size-evidence/ko-perspective.json`, and none of those compromises beats leaving the KO alone. **I wrote no KO allowance**; the dead run's drafts (Yuna x0.9965, Rikku Lady Luck x0.985 to 0.99) are not in the branch.

Options, none in this branch (the driver's call):
0. **A table compromise, cheap and fragile.** In `tools/posescale/overrides.json`: `yuna.ko.allow` 0.9984 and `yuna.hurt.allow` 1.0075 with their reasons, and the KO row written to four decimals (three cannot hold 0.5282). On every Yuna swap I have (40 KOs, the 67 hurt to idle of round 23) it passes
   with 0.02 to 0.3 percent to spare; on the final Chapter XVII run's own three failing swaps it reads 2.41, 2.86 and 2.88 percent (they were 3.34, 3.02 and 3.04) and Chapter I's lowest KO draw goes from x0.9718 to x0.9702. About even odds per run for both chapters, one droppable commit, and it fits the table to the instrument rather than
   to the picture (the change is 0.16 and 0.75 percent of a head, invisible); I did not apply it, and it would need the FFX chapters re-run.
1. **The engine holds the head** (the fix I recommend). `measure.py table` already knows each pose's registered head box; emit it with the scale, and have `PaintedActor` rescale the active plane about its feet each frame so the projected head box is the idle's size
   (four corner projections per plane per frame, plus a head-box column in the generated table). Every swap with a registered head then reads x1.00 in every camera, the three camera allowances become unnecessary, and a KO stops depending on the stage.
   It is a visible change of a percent or two to the figures' sizes, so it needs Bailey's eye, and a focused review: it touches the presenter's core.
2. **The check reads a standing-lying pair differently** (an edit to CHK-026 item 1, which I was told not to loosen): compare the two heads' sizes in the plane's own units, or take the camera's perspective out of a swap between planes of different orientation.
   The chart is the evidence that it is the camera: it is a judgement about what the owner's complaint covers (a 3 percent head jump at the cut of a collapse, where everything else changes).
3. **Accept** Chapters V and XVII as the check's known failures; the deep review's cap on `characterModels` and `animation` (7.0) then stays until one of the first two.

### 4b. Chapter III: a pose flicker of the possessed Valefor, read by mass (not this branch's)

The final Chapter III run FAILS on one swap: possessed Valefor KO to hurt, mass x1.3487 (the tolerance for a mass reading is 30 percent). Round 23 passed (worst 26.1 percent); this branch changes no foe's registration of Chapter III and the swap is not Yunalesca's or the party's.
The frames (`harness-replay.mjs frames <raw> --n=48604 --fig=possessed-valefor`): Valefor stands idle, a hurt crossfade starts (frame 48601, hurt fade 0.02 to 0.30), then at frame 48603 the KO painting is cut in at fade 0.70 and fades out again over the next three frames
(0.70, 0.20, 0.03) while the hurt painting returns to 1.00: a three-frame flash of the lying painting (two paintings of different shape at once). The mass of the two paintings differs by the shape of a lying body against a rearing one: round 23 read the same pair
the other way (hurt to KO x0.7416, 25.8 percent, a PASS), and the same pair read the other way round is x1.348, 34.8 percent, a FAIL: **the coarse tolerance is asymmetric** (a ratio of 0.74 passes and its inverse 1.35 does not). I did not change it (a symmetric 30 percent in the log would be a looser check for the upward direction; it is the driver's call), and I did not touch the presenter.
The flash itself is a presenter finding (the KO pose and the hurt pose called one frame apart for an aeon that stays on the field), worth a PR of its own.

## 5. What the tooling commit loosens, and what it does not (`2d42ef7f`)

`tools/pose-scale-check.mjs` is the art lane's check that the engine's table is the record's table, not the critic's measure of the game. What it did: for every reviewed pose, the table's scale equals the record's, and the pose's head at the scale the engine uses is
within 2 percent of the idle's. What it does now: the same two tests, for a record that carries an `allow` {scale, why}: the table's scale equals reading x allowance, the head test divides the declared allowance out (so the head at the READING's scale must still be
the idle's to 2 percent: the painting's registration is still held to the same standard), and an allowance with no reason or outside 0.9 to 1.1 fails. Three records of 612 poses carry one (Yuna victory, Yuna critical, Rikku victory); a table that forgot one
fails (a test). The harness (`critic/runner/lib/`) does not read the table or the allowance at all: it reads the registered head box from the record and the plane the engine drew, so a build passes CHK-026 only if the heads on screen agree. Its tolerances are untouched.

## 6. What changed from the dead run's work

Kept as it was (re-verified): `86a34192` (the harness change and its 2 tests), the allowance plumbing, the Yunalesca head registration (re-checked by eye on a sheet of the four heads at their table scales, and on screen at battle size).
Changed: Yuna's victory allowance is 1.0255 (table 0.804), not what I first wrote (1.0293, 0.807: a commit of my own, `7a0dbb97`, corrected by `b8fcae0b` once the flat cameras were in the data); the three reasons were rewritten with the cameras and the numbers they rest on;
the comment in `measure.py` no longer names a KO allowance. Not in this branch: the dead run's draft allowances for Yuna's KO (x0.9965) and Rikku Lady Luck's KO (x0.985 to 0.99), which were already out of the working tree: a KO's head against the standing one follows the camera (section 4), and an allowance
chosen on one chapter's reading moved the failure to another (its own f2 run: Chapter XVII PASS at 2.9 percent, Chapter I FAIL at 3.2). Its `ko-calibrate` tool was a draft in scratch and is not committed. The disk it left (33 GB in `D:/Tools/pyrefly-scratch/r392`) is described at the end.
The commit messages say "a third of a figure" for how much lower Yuna's victory head sits; the records say 24 percent of the idle head's height above the feet (Rikku 9, Auron 2; Tidus's is 27 percent higher).

## 7. What is left

1. **The KO swaps** (section 4a): Chapter XVII, Chapter V on a run that KOs a girl, Chapter I at the edge. Needs the engine option (or a decision about the check); nothing at the registration level holds.
2. **Mass-read swaps** (the foes without a registered head): 30 percent tolerance, asymmetric (section 4b). The final run's reads of 15 percent or more are in `docs/handoff/r392-size-evidence/mass-reads-over-15-percent.txt`; round 23 PR-0377 (critic/rounds/round-23.md) accepts only with no mass-read swap above 15 percent, which is not done: the nearest the 30 percent line: Chapter VI Leblanc's logos-room hurt to cast x1.287 (3 swaps, 1.3 percent under), Chapter III possessed Valefor KO to hurt x1.349 (the failure), Valefor hurt to KO x0.74 (25.7 to 26.1 percent) in Chapters II, III, VII and XIV, Chapter XVII's right fin cast to idle x1.24 (10 swaps), Chapter XIV Pterya hurt to KO 24.5 percent.
   A boss with a face (Seymour's forms, Braska's aeon, Shiva) hides head jumps the way Yunalesca did; each needs its face box and the same sheet (the tooling here does it), and each is a visible change like `cf94064a`.
3. **The allowances are thin where I said**: Yuna's victory has about a quarter of a percent to spare at Macalania and at a rising camera; Rikku's far-camera end is inferred. A camera change in a chapter (the engine option removes the need) re-opens them; the harness fails a build that crosses.
4. **`cf94064a` needs Bailey's eye** (Yunalesca's hurt, attack and cast drawn 23 to 33 percent smaller, to match her idle's head). It can be dropped alone.
5. Not done, by instruction or by lane: `NOW.md` and the ledgers (the driver's), a CHANGELOG entry, `critic-clear`, a deploy, the focused review a release owes, the 17 costume swaps outside the check, FFX-2 (no registration value changed).

## Pictures, `docs/screenshots/r392-size/` (real battle frames at 1:1 with the 1600x900 battle unless a chart; the harness strips are the probe's own cells: green = the head, orange = the feet, both from the frame before the swap)

| picture | what it shows |
|---|---|
| `ch1-yuna-hurt-idle-feet-frames.png` | Chapter I, Yuna hurt to idle with a KO cutting in, a baseline run: the registered feet of the hurt and the idle plane frame by frame; the dashed line is what the old reading measured (4.4 px), the idle plane's own jump |
| `ch1-yuna-hurt-idle-ko-cut-in-strip.jpg` | the same case on this branch's build, at battle size (staged with `ko-cutin-stage.mjs`: hurt, the crossfade to idle, the KO four frames in; frames -4 to +2 of the harness's strip): the hurt painting fades out, the idle fades in, and at the swap the lying KO painting is in the hurt plane's slot. Old reading 3.8 px, new 0.3 px |
| `yunalesca-1-poses-before-after.jpg` | Yunalesca's four poses at battle size, live 39.1 above and this branch below, the idle's head top, stance and feet as guides: heads 49.1 / 73.0 / 69.7 / 63.6 px before, 49.1 / 48.5 / 48.4 / 48.7 after |
| `ch2-yunalesca-idle-attack-before-after.jpg`, `ch2-yunalesca-cast-idle-before-after.jpg`, `ch2-yunalesca-hurt-idle-before-after.jpg` | the harness's transition strips at battle size (frames -3, -1, swap, +2), live above and this branch below: head x1.424 (idle to attack), x0.763 (cast to idle) and x0.675 (hurt to idle) before, x0.989, x0.998 and x1.012 after |
| `yunalesca-1-heads-at-table-scale.jpg` | her four heads at their table scales on one sheet, the idle's head box in yellow on every tile (the registered box in red): the face fills it in every pose |
| `ch7-yuna-idle-victory-before-after.jpg`, `ch7-rikku-idle-victory-before-after.jpg` | Chapter VII (Macalania), idle to victory at battle size, live above and this branch below (the party stands at the bottom edge of the close victory camera): head x0.948 -> x0.976 (Yuna), x0.966 -> x0.983 (Rikku) |
| `yuna-victory-vs-camera-perspective.png` | Yuna's idle to victory head ratio against the camera's perspective at the swap, every capture, on the live table and with the allowance, with the fitted line and the 3 percent window |
| `ko-ratio-vs-camera-perspective.png` | every KO swap with a registered head in every capture (165 swaps, 11 subjects, both games): the lying head over the standing head against the camera's perspective; the camera, not the registration, sets it |

The raw numbers behind them are in `docs/handoff/r392-size-evidence/`: `chk026-final-run.json` (the table above, with every swap over tolerance), `harness-replay-compare-swaps.json` (the nine readings of section 1; the last three are the staged ones, alone in `ko-cutin-staged-compare.json`), `mass-reads-over-15-percent.txt` (section 7), `ch1-yuna-swap-3210-planes.json` and
`ch1-yuna-hurt-idle-frames.txt` (the frames of section 1), `ch7-victory-frames-baseline.txt` (Macalania's victory frames and the plane perspective), `ko-perspective.json` and `yuna-victory-vs-perspective.json` (the two charts' points).

## Commands

```
# build and serve a build (BASE_PATH must be set from PowerShell, or with MSYS_NO_PATHCONV=1: Git Bash turns "/" into "C:/Program Files/Git/" and the build then bakes that base in)
$env:BASE_PATH = '/'; npx vite build --outDir <dir> --emptyOutDir; npx vite preview --outDir <dir> --port 4311 --strictPort --host 127.0.0.1
# the harness, real keys from the title, headless Chromium on the GPU (three to five lanes at a time was fine: 58 to 60 fps in every chapter), the probe's raw frames kept for replays
CONT_RAW_DIR=<raw dir> PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:4311/ --evidence=<ev dir> --chapters=<ids> --tag=r392b --summary=summary-<id>.json
# battle-size strips (the probe's ring at the canvas's own size, cells up to 560 px; 80 swap strips, or 600 to keep every swap's)
CONT_CFG='{"probe":{"ringScale":1,"cellHeight":560,"jpegQuality":0.85},"strips":{"worstSwaps":80,"worstGhosts":0,"worstJerks":0}}' ...
# the old analysis against the new one on the same frames, and the planes frame by frame (docs/handoff/r392-size-evidence/)
node docs/handoff/r392-size-evidence/harness-replay.mjs compare <raw.json.gz ...> [--old-rev=30e7d701]
node docs/handoff/r392-size-evidence/harness-replay.mjs frames <raw.json.gz> --n=<swap frame> --fig=<id>
# a head ratio against the camera's perspective (the KO chart and the victory chart)
node docs/handoff/r392-size-evidence/perspective.mjs ko <raw.json.gz ...>     node docs/handoff/r392-size-evidence/perspective.mjs victory yuna <raw.json.gz ...> --norm="yuna|victory=1.0255"
# every pose of a figure at battle size (before: a preview of the live build; after: of this one), then the picture
node docs/handoff/r392-size-evidence/pose-gallery.mjs yunalesca --base=http://127.0.0.1:4311/ --figure=yunalesca --poses=idle,hurt,attack,cast --out=<dir> --tag=after
python docs/handoff/r392-size-evidence/compose_gallery.py <out.jpg> yunalesca "<title>" "<dir>:before" "<dir>:after"
# battle-size cells of the strips, side by side
python docs/handoff/r392-size-evidence/compose_cells.py <out.jpg> "<title>" "<label>|<strip.jpg>|3,5,6,8" ...
# the table and the check, after a hand input changes
D:/Tools/ComfyUI/python_embeded/python.exe -s tools/posescale/measure.py measure yuna --poses victory,critical --write ; ... measure.py table ; node tools/pose-scale-check.mjs
```

## Scratch and disk (D: was at 28 GB free when I started; every server I started is stopped, ports 4311 and 4312)

- Mine, `D:/Tools/pyrefly-scratch/r392-size/`: `dist-r392` (7.8 GB, the build of the branch tip's table `b8fcae0b`), `ev-r392b` (the final 18-chapter run), `ev-r392` (the aborted run on the 0.807 build, Chapters I, II, VII), `ev-big-before` and `ev-big-after` (battle-size strips), `raw-*` (the probe's frames,
  gzipped, 1 to 8 MB a chapter: what `harness-replay.mjs` and `perspective.mjs` read), `gallery`, `evidence`, `tools`, `logs`. About 9 GB, all rebuildable.
- The dead run's, `D:/Tools/pyrefly-scratch/r392/` (33 GB): four builds of 7.8 GB each. `dist-before` is the live 39.1 table and the "before" side of this lane's runs (served on 4312 while I worked); `dist-after`, `dist-after2` and `dist-final2` are its intermediate builds, referenced by
  nothing: **23 GB to reclaim**, for the driver or Bailey to delete (the standing rule: I list, they delete). Its `raw-*` and `ev-*` folders (the captures of the numbers above) are small.
