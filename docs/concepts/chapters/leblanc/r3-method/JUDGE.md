# Art method r3 pilot: independent 1:1 judge (2026-09-23)

FFX-2 only (Chapter 6, Leblanc; AGENTS.md hard rule 14). This is an independent
pass on the pilot's report (`PILOT.md`, commit `2bf3ead4`). I did not make these
images. Nothing was rendered, queued, installed or moved in `public/art/`, and
`approved-hashes.json` was not touched (`verify-approved.mjs`: ok 115,
mismatched 0, missing 0). The pilot scored itself 7 on cast and 6 on hurt (b).
Governing rules: `docs/plans/art-method-r3/METHOD-CHECK.md` section 3, Pass 1 to
4 and Kill.

**Verdict.** Cast = 6: the **choker is 6 after the one re-run**, so the **local
transplant is dead** under the kill rule as written. The obi transplant works: it
is the best obi any Leblanc state has had. Hurt (b) = 5: it fails rule 3 on
"reads as hurt" (5) and on a flat patch under the jaw, so **the bake is dead and
hurt ships as (a)**. At game size (b) leans a little more than (a), but not
clearly enough to read as a hit; since (b) already fails rule 3, the rule-4
comparison does not matter.

## How it was judged

- Anchor: `D:/Tools/pyrefly-lora/leblanc/r3/idle.png` (591x1118, sha256
  `4fea45f9...094b`, the same as the installed `public/art/characters/leblanc/idle.png`).
  The cast base is `cast.r2.2.png` (`49d3c55f...0d66`, the same as the installed `cast.png`).
- Scored: `r3/p6/cast.p6.png` (625x1203) and `r3/hurt.b.png` (811x1148).
- Every file was flattened on mid grey and viewed whole. I cropped with PIL: the
  obi, knot and tassel at 2x and 3x; the choker at 2x and 4x, against the same
  crops of idle and of r2.2; the head at 1:1; the hurt head at 2x; the hurt jaw at
  3x; and the hurt torso at 1:1.
- The criteria are the round-2 list: hair, face and eyes, skin, obi (with knot
  and tassel), choker (scored on its own, as Pass 1 asks), heart, fan, boots,
  style, anatomy, and "reads as its state". Each is scored 0 to 10 against idle.
  **A file's score is its lowest criterion.** The bar is 7: the part could sit
  beside the idle and Bailey would not see the join.
- In battle: `r3/ingame/{r22,pilotA,pilotB}-{idle,cast,flinch}.png`, viewed at
  game size and at 2x, with the 1600x900 frames.

## Numbers I re-ran myself

| Check | Mine | Pilot's |
|---|---|---|
| cast.p6 against r2.2 outside obi+choker mask and band | 24,854 px changed, **0 outside** (MAD 0.0, max 0); alpha changed 0 | MAD 0.0, alpha 0 |
| Changed bbox | x 309 to 479, y 395 to 778 (obi, tassel, choker only) | |
| Cut-out margins | 16 / 16 / 16 / 16 | 16 |
| Choker median Lab on the transplanted part (744 px) | idle L 49.0 a 22.1 b -22.7, p6 L 56.3 a 20.2 b -22.0: dE76 7.6, almost all of it lightness (r2.2 on the same pixels: 12.2) | dE2000 7.18 |
| hurt.b opaque bounds | x 126 to 684, y 63 to 1131 (baseline 1131); idle is y 16 to 1101 | height 98.25 % |

The gates the pilot reports are real. The choker's colour gate fails because the
choker comes out lighter than idle's, not because its hue is off.

## Scores

| File | Hair | Face/eyes | Skin | Obi/knot/tassel | Choker | Heart | Fan | Boots | Style | Anatomy | Reads as state | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cast.r2.2 (`0c46fc2`) | 7 | 8 | 8 | 6 | 6 | 8 | 8 | 8 | 7 | 8 | 8 | **6** |
| **cast.p6** | 7 | 8 | 8 | **7** | **6** | 8 | 8 | 8 | 7 | 8 | 8 | **6** |
| **hurt.b** | 7 | **6** | 8 | 7 | **6** | 8 | 7 | 8 | 7 | 7 | **5** | **5** |

Worst criterion: cast is choker (6); hurt (b) is reads-as-hurt (5).

### cast.p6: 6 (choker)

- **Obi, knot and tassel (7).** At 2x this is idle's own obi. It is a wide crimson
  sash with pale stripes, one knot with its scroll ornament, one purple cord, and
  the round medallion over a white, pink and blue tassel. r2.2's second tassel,
  third cord and beads are gone, and no hole or ghost is left where they were. The
  pink curved stripes on the far robe edge are r2.2's pixels outside the band;
  they read as a sleeve cuff, like the cuffs on idle's elbows. The warp shears the
  sash a little flatter and more slanted than idle's. The tassel's left strand has
  a faint grey, translucent edge at 3x. I cannot name the join at 1:1, and at 2x
  only barely, so this is a 7, not an 8. In battle it reads crimson, as it should.
- **Choker (6).** The identity is right: a violet band with a row of studs (at
  least five show at 4x), where r2.2 had a plain band with one stud. The finish
  is not right, and I can see it at 1:1 in the head crop, not only when zoomed:
  - The band is lighter than idle's (L 56 against 49), and its top edge has no
    clean ink line. It breaks into jagged black ink spikes along the jaw shadow
    on the left.
  - A pale grey-white smudge sits under the band's middle to right.
  - The right end is a broken dark and white mess where the band meets r2.2's
    black strap.

  Idle's choker is crisp, outlined top and bottom, and deeper violet. Placed
  beside idle, Bailey would see this join. This is the seam that Pass 2 says a
  judge must not be able to name at 2x, and I can name it.
- **Everything else** is r2.2 byte for byte, so it keeps `0c46fc2`'s scores:
  - Face 8: purple eyes looking up at the fan.
  - Fan 8: red and silver.
  - Pose 8: a spell being raised.
  - Hair 7: the nape shade is heavier than idle's.
  - Style 7: the transplanted line is a touch softer than r2.2's around the
    obi. The pilot's own note agrees.

### hurt.b: 5 (reads as hurt)

- **Reads as hurt (5).** Both eyes are shut and the brows knit, but the idle's
  smirk and blush are unchanged. At 2x the face reads as a giggle (^_^), not a
  wince. The body leans back about 13 degrees on planted feet, and at 1:1 it reads
  as a sway more than a recoil. The pilot scored this 6 and said "amused as much
  as hurt"; I put it lower, because the smile wins over the shut eyes.
- **Face (6) and choker (6).** Under the jaw, where the fan used to cover the
  neck, there is a flat grey-beige patch with no line work. It is visible at 1:1
  and obvious at 3x. The choker stops abruptly under the chin; its right half is
  never painted. This is the "neck patch" the pilot scored as anatomy 7.
- **Paper-card look.** The hips show no hinge at 1:1, and the pilot's
  no-fold, no-tear claim holds where I looked (sleeves, dress edge, hair). There
  is one rigid-rotation tell: the tassel hangs tilted with the torso instead of
  hanging plumb, as idle's does. That is minor, and it is not a kill on its own.
- **Obi (7), fan (7), hair (7).** These are idle's pixels, rotated. The fan now
  lies under the chin across the patch.
- The numeric gates pass: idle share 96.95 %, head chord 1.000, height 98.25 %,
  margins 16, sidecar scale 1.0 by construction.

### In battle (rule 4)

- At game size (about 82x160 px) the shut eyes and the jaw patch are invisible.
- (a) is the idle under the warm flinch tint.
- (b) shows a slight lean and head tilt. It is a small difference that a player
  could read as a sway as easily as a hit.
- This is not "more clearly a hit", and a tie goes to (a).
- Rule 3 already kills (b), so the comparison does not decide anything.

The pilot's cast and r2.2's cast both appear at 100x196 px. At that size the
pilot's obi reads as a crimson sash where r2.2's reads as a narrow pink band. The
choker cannot be told apart at that size.

## Pass and Kill, item by item

| Rule | Result |
|---|---|
| Pass 1: cast obi and choker at least 7; other criteria no lower than `0c46fc2` | **FAIL.** Obi 7; choker 6. Every other criterion is unchanged. |
| Pass 2: MAD 0 outside; obi and choker within dE00 3; invented colour at most 1 %; no nameable seam at 2x; seam gradient | **FAIL.** MAD 0 passes (verified). Obi passes at 1.17. Choker fails at 7.18. The invented-colour gate fails as written at 1.47 %. The choker seam is nameable at 2x. The seam gradient fails as written. |
| Pass 3: hurt (b) at least 7 everywhere; idle share at least 90 %; head chord 100 +/- 2 %; height at least 95 % | **FAIL.** The numeric gates pass; reads-as-hurt is 5, face 6, choker 6. |
| Pass 4: (b) reads more clearly as a hit at game size | **Tie. Goes to (a).** |
| Kill: after the re-run, obi or choker still at 6 | **Fires on the choker.** The local transplant is dead as written. |
| Kill: region invented-colour share over 1 % | Fires as written at 1.47 %, but **I do not rest the kill on it**. The pilot's controls hold up: 0.27 % in the band only, and a floor of 3.85 % on idle's own parts. The measure is miscalibrated for transplanted idle pixels, and rewriting it is the driver's call (open item b). |
| Kill: (b) failing rule 3 | **Fires.** The bake is dead, and hurt ships as (a). |
| Kill: hinge or paper-card look at 1:1 | Not fired (the tilted tassel is minor). |

## Notes for the driver (not approvals)

- What died is the transplant **at choker scale**. At obi scale the method did
  what it promised: the part is the idle's own pixels, the colour is within 1.2,
  and the band invented nothing.
- A scoped version would need a written rule-15 note and Bailey's yes before
  anyone builds it. Two possible shapes:
  - Obi-only transplant with the choker left as r2.2.
  - A hand-painted choker line.

  Either would still leave r2.2's plain-band choker at 6, so it would not reach
  7 on its own.
- The kill rule's next step is a fresh hero-cast render judged as now, not a
  fourth repair round.
- The wince needs a mouth change to read as hurt. That is outside the method's
  eye-box repaint and needs a yes (the pilot's open item c). Given rule 4's
  result at game size, (a) costs nothing and loses little.
