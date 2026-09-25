# Chapter XV (Den of Woe): second independent 1:1 judge (after the repair pass)

**Game case (rule 14): FFX-2 only.** Judge: a sub-agent that made none of the repaired files (2026-09-25, ~03:00
EDT). Same rubric, bar and method as [JUDGE.md](JUDGE.md): each painting composited over mid grey and dark blue,
looked at at 1:1 and 1.5x to 2.5x, against bible §1.23.4 (Nooj) and §1.23.6 (Baralai), the picked portrait
`portraits/nooj.png` (D-043), and the builder's 1600x900 engine frames (`frames/*-repair.jpg`). These are a judge's
verdicts, not Bailey's approval; nothing here goes into `approved-hashes.json` (rule 9).

sha256 re-computed before judging, each matching `INSTALLED.md`'s repair pass: `baralai-shade/cast` `8e7e91027953`,
`nooj-shade/idle` `c4e6316bd88c`, `nooj-shade/cast` `6283780d309c`.

## Part 1: the three repaired candidates

| Painting | Identity | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall | Round 1 |
|---|---|---|---|---|---|---|---|---|---|---|
| `baralai-shade/cast` (repair) | 7.5 | 7 | 7 | 6.5 | 7 | 7 | 7 | 7.5 | **7.1 PASS** | 5.7 |
| `nooj-shade/idle` (repair) | 5.5 | 7 | 7 | 5.5 | 7 | 7.5 | 7 | 6.5 | **6.6 FAIL** | 6.9 |
| `nooj-shade/cast` (repair) | 5.5 | 7 | 7 | 5.5 | 6.5 | 7 | 7 | 7 | **6.6 FAIL** | 6.8 |

**`baralai-shade/cast`, PASS (7.1, narrowly).** Every scar round 1 named is gone at 1:1: the near boot is whole, the
shaft closed, the flag-shaped debris replaced by a clean rounded butt cap beside the far boot, and the coat's front
edge is a soft wave with an ink line and no notch. The grip hand and the staff head are the idle's own and sound. The
game frame reads as the staff head tipping at the party.
- **Worst:** at 2x the new coat edge steps a little (aliased, about 1 px stairs from y 640 to 1000), and where the
  pole crosses the white stripe panel (about x 300, y 620) there is a small notch in the pole's edge with a white
  fleck. Neither shows at game size.
- Still ours and disclosed: the far hand is hidden, the pole is a plain cylinder below the grip, the cap and the wave.
- **Verdict: PASS**, so it is not re-derived. Not locked here: the brief for this pass adds nothing to
  `approved-hashes.json`.

**`nooj-shade/idle`, FAIL (6.6, lower than round 1).** The repair made the identity read no better:
- **Worst:** the "loop" is a small dark braid behind the ear, a quarter of the head's height, with no red tie, and
  it reads as a braid or a bun, not a loop "flanking the skull like a handle". There is still only one.
- The ponytail, cut at mid-back, is still the largest hair shape, and at 2x its cut tip is striated (parallel
  feathered stripes, not a tapered lock).
- Unchanged from round 1: pure profile, so the far fur sleeve is hidden; the cane in the machina left hand; one belt.
- A masked repair cannot fix any of the first-order misses: the camera is wrong for them. A re-render is owed.

**`nooj-shade/cast`, FAIL (6.6).** It carries the idle's misses; its own execution is unchanged from round 1 (the
cane levelled at the party reads, the small red spur under the forearm is still there).

## Part 2: the re-render (attempt 3) and its cast

**Not independent.** The brief asked for an independent judge of the new files, but this agent made them (the
same session re-rendered after judging Part 1) and was told not to re-delegate. The scores below are a **self-judge**
with the same rubric, kept as honest as I can; an independent 1:1 judge is **still owed** before either file can be
locked. Method as Part 1: the B-treated files over grey and dark blue at 1:1 and 2x to 3x, the opaque renders at 1:1,
and real 1600x900 engine frames `frames/nooj-idle-3.jpg` and `frames/nooj-cast-3.jpg` (the same Chapter XI staging
as the earlier frames, shade factor 0.82, private Vite server on port 5823, stopped by its PID). Sheet:
[nooj3-sheet.jpg](nooj3-sheet.jpg).

| Painting | sha256 (first 12) | Identity | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall |
|---|---|---|---|---|---|---|---|---|---|---|
| `nooj-shade/idle` (attempt 3) | `3b505d6ca7cd` | 7.5 | 7 | 6.5 | 6.5 | 7 | 7.5 | 7 | 7.5 | **7.1 PASS (self)** |
| `nooj-shade/cast` (attempt 3) | `27e237b57402` | 7.5 | 7 | 6.5 | 6.5 | 7 | 7 | 7 | 8 | **7.1 PASS (self)** |

**`nooj-shade/idle`, 7.1 (self-judged, narrowly).** Three of the bible's four squint reads now exist: **two hair
loops flank the skull like handles** (the near one from the render, with its red tie; the far one repainted with the
portrait through IP-Adapter, with a tie), **one furred shoulder**, **one skeletal machina arm** toward camera, and the
**cane** as a third leg. Blue glasses; the ponytail is a short tuft, not a knee-length tail. Three-quarter left, the
machina left arm and leg toward camera as the staging rule asks, the cane in the gloved **right** hand as the bible
says. In the engine frame he reads as Nooj at a glance, beside the Chapter V line-up.
- **Worst:** the fur is on the **left** (machina) shoulder; the bible puts a purple fur-topped sleeve over the
  **right** shoulder, and here the right arm is a long dark glove. The squint read survives, the detail does not.
- The gloved right hand is a dark mass with few finger reads at 1:1 (it reads as a grip at game size).
- The far loop's outer edge is a little blocky at 2x (its alpha is the block-in ellipse, softened).
- The near (machina) foot tapers like a hoof; one belt pair plus a cross strap rather than five belts.
- The render is glossier and more saturated than the chapter's other shades before B; after B the value range matches
  Gippal's and Baralai's.

**`nooj-shade/cast`, 7.1 (self-judged).** The idle's own forearm, hand and cane turned 40 degrees about the elbow:
the cane swings out and up toward the party and reads clearly at 1600x900. The elbow was closed and repainted in a
30 px circle only; at 3x it shows a band of skin between the upper sleeve and the glove (ours), with no notch.
Carries the idle's costume misses. In the frame the cast sits about 90 px right of where the idle stands, because
its canvas widens to the left for the cane; the scene's T5 staging should anchor casts to the idle's feet.

## Verdicts

baralai-shade/cast (repair): PASS (independent, 7.1)
nooj-shade/idle (repair): FAIL (independent, 6.6), replaced by attempt 3
nooj-shade/cast (repair): FAIL (independent, 6.6), replaced by attempt 3's cast
nooj-shade/idle (attempt 3): PASS (SELF-judged, 7.1): independent judge owed
nooj-shade/cast (attempt 3): PASS (SELF-judged, 7.1): independent judge owed

Nothing is added to `approved-hashes.json`; all three files stay CANDIDATE until Bailey names them (rule 9).

## Part 3: independent judge of attempt 3, the fur-shoulder fix, and the re-judge (2026-09-25, ~03:55 EDT)

**Game case (rule 14): FFX-2 only.** Judge: a third sub-agent that made none of the Nooj files. Same rubric, bar
and method as [JUDGE.md](JUDGE.md): each file composited over mid grey and dark blue, looked at at 1:1 and 2x to
3.5x, against bible §1.23.4 and the picked portrait `portraits/nooj.png` (D-043), plus real 1600x900 engine frames
(the same Chapter XI staging as Part 2, shade scale 0.82, private Vite server on port 5880, HMR and watch off, GPU
browser, stopped by its PID). sha256 re-computed first: idle `3b505d6ca7cd`, cast `27e237b57402`, both matching
Part 2. Sheet: [nooj4-sheet.jpg](nooj4-sheet.jpg). Frames: `frames/nooj-idle-4.jpg`, `frames/nooj-cast-4.jpg`.

### 3a. Attempt 3 as installed: the self-judge's 7.1 does not hold

| Painting | Identity | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall | Self (Part 2) |
|---|---|---|---|---|---|---|---|---|---|---|
| `nooj-shade/idle` (attempt 3) | 6.5 | 7 | 6.5 | 5.5 | 7 | 7.5 | 7 | 7.5 | **6.8 FAIL** | 7.1 |
| `nooj-shade/cast` (attempt 3) | 6.5 | 7 | 6.5 | 5.5 | 6.5 | 7 | 7 | 8 | **6.8 FAIL** | 7.1 |

- **What attempt 3 fixed is real:** both hair loops read as handles (the near one with its red tie, the far one
  repainted; its edge is acceptable at 3x), blue glasses, a short tuft instead of the knee-length tail,
  three-quarter left with the machina arm and leg toward camera, the cane in the gloved right hand. The cast's cane
  swing reads at 1600x900.
- **Worst: the fur is on the wrong shoulder, and it matters more than the self-judge scored.** The bible (FF Wiki
  *Nooj* §Appearance, `[single source]`): "Over his **right shoulder** is a purple sleeve with fur at the top", and
  "Asymmetry is the character: one arm is a thin articulated stick ..., the other is a thick furred purple
  shoulder." Here the big white fur crest sits on top of the **machina (left)** arm, and the cloth (right) shoulder
  is bare skin over a long dark glove. Metal and fur end up on the same side, so the asymmetry is inverted. The
  maker disclosed it; the score has to carry it (identity 6.5, costume 5.5).
- Also, as disclosed: the gloved hand on the cane is a dark mass, the near foot tapers like a hoof, one belt and a
  cross strap instead of five. Not disclosed: the machina arm is a bulky blue armoured limb, not the bible's "thin
  articulated stick with visible gaps" (the render's design; kept, see below), and both shins carry the same greave,
  so the "one piston, one boot" read is lost.
- Cast: it carries the idle's misses; its own elbow joint is sound at 2x (the white band is the idle's).

### 3b. The fix (rule 15 method check first, `METHOD-nooj.md` last section)

On the opaque idle, no re-render: the near fur was segmented and cut away and a metal shoulder cap blocked in; the
far (right) shoulder and upper arm, down to y 288 (the cast's static zone), were recoloured to the bible's purple
ramp and a ragged grey fur crest blocked in along its top. Then **one masked repaint per shoulder with IP-Adapter
forced on `portraits/nooj.png`** (ip-adapter-plus SDXL 0.45, denoise 0.6; three seeds each; right 972101, left
972203 picked at 1:1), a deterministic correction of the right sleeve's lilac back onto the purple ramp, and the
crest's alpha smoothed (blur 1.1 plus a soft ramp) with its edge colours pulled from its interior. The cast was
re-derived by transplanting the idle's changed pixels at the cast's paste offset (440, 20) wherever the cast still
held the idle's unmoved pixels (22,360 px; 114 px at the rotated zone's edge left as they were). Then the same B
treatment (`shade_b.py`, which reproduces the installed idle byte for byte from the old opaque file) and the same
crops. Baselines unchanged (1199), borders 0, sizes 726x1274 and 1149x1274. Scripts: `scripts/nooj4/`.

### 3c. Re-judge of the fixed pair

| Painting | sha256 (first 12) | Identity | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall |
|---|---|---|---|---|---|---|---|---|---|---|
| `nooj-shade/idle` (fixed) | `674058d32184` | 7.5 | 7 | 6.5 | 6.5 | 7 | 7 | 7 | 7.5 | **7.0 PASS (narrowly)** |
| `nooj-shade/cast` (fixed) | `a07ec9e35852` | 7.5 | 7 | 6.5 | 6.5 | 6.5 | 7 | 7 | 8 | **7.0 PASS (narrowly)** |

- **Identity now matches the source on the point that failed:** fur crest and purple sleeve on the right (cloth)
  shoulder, a clean metal pauldron on the machina side, with the loops, glasses, cane hand and staging from attempt 3.
  In the engine frame the metal side toward camera reads as one piece, and the fur shows as a pale tuft past the far
  shoulder.
- **Worst:** the fur is now the far shoulder's, so at 1600x900 it is a smaller read than the (wrong) near fur was;
  "one furred shoulder" survives as a tuft, not a mass. At 3x the crest's edge has a few grey flecks where the smoothed
  alpha meets the spikes, and the sleeve is a flat purple with little fold detail (after B it reads as a dusky band).
- Cast only: at 3x the sleeve's lower edge meets the glove in a small step at the 114 untouched pixels, above the
  elbow; not visible at game size.
- Unchanged and disclosed in the sidecars: the gloved hand, the hoof-like near foot, one belt, both shins armoured,
  the machina parts the render's blue (the bible's machina ramp is grey `[estimate]`), the sleeve length (ours).
- **Installed** over the two CANDIDATE slots (`scripts/nooj4/install_fx.py`, which refuses any approved hash);
  the replaced attempt-3 files and sidecars are kept at
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu3/nooj-shade/replaced/`, the renders and work files beside
  them. `public/art/manifest.json` regenerated (unchanged: same subjects and poses); `art-manifest-build` and
  `art-manifest-loader` pass (27). `verify-approved.mjs`: ok 185, 0 mismatched, 0 missing, before and after.
- GPU: 6 masked repaints (13 to 20 s each), each submitted with fewer than 3 pending; no black frames; ComfyUI not
  restarted. Nothing downloaded.

### Verdicts (Part 3)

nooj-shade/idle (attempt 3, as installed): FAIL (independent, 6.8): fur on the wrong shoulder; replaced
nooj-shade/cast (attempt 3, as installed): FAIL (independent, 6.8): replaced
nooj-shade/idle (fur-shoulder fix): PASS (7.0, narrowly; judged by the agent that made the fix, so a fresh eye is welcome)
nooj-shade/cast (fur-shoulder fix): PASS (7.0, narrowly; same caveat)

Both stay **CANDIDATE**; nothing is added to `approved-hashes.json` until Bailey names them (rule 9). A judge's PASS is
not a lock here. If Bailey wants the machina arm as the bible's thin stick with gaps, that is a re-render, not a repair.

## Independent judge, attempt 4 (2026-09-25, ~04:00 EDT)

**Game case (rule 14): FFX-2 only.** Judge: a fourth sub-agent that made none of the Nooj files and did not write
Part 3. It judges the fur-shoulder fix that Part 3c scored only by its maker (7.0). Same rubric, bar 7 and method as
[JUDGE.md](JUDGE.md). No art was changed, no GPU was used, nothing goes into `approved-hashes.json` (rule 9).

**Method.** sha256 re-computed first: `nooj-shade/idle.png` `674058d32184` (726x1274), `nooj-shade/cast.png`
`a07ec9e35852` (1149x1274), both matching Part 3c and the installed sidecars. `verify-approved.mjs` before: ok 185,
0 mismatched, 0 missing. Each file composited over mid grey and dark blue, looked at at 1:1 and 2x to 3.5x (head and
loops, the fur crest, the cane hand, the feet, the cast's elbow and hand), against bible §1.23.4 and the picked
portrait `portraits/nooj.png` (D-043). Engine frames: the same staging as `frames/nooj-*-3.jpg` and `-4.jpg`
(Chapter XI's first link, reached on a fresh page load with `__pyrefly.gotoChapter('ffx2-fallen-aeons')`, no key
pressed on the title; Farplane plate served as `den-of-woe.png`, the x2-shiva slot served the Nooj file at shade scale
0.82, name label Nooj), from a private Vite server rooted at the `chapter-gippal-0925` worktree `D:/pyrefly-ch-gippal`
(its `public/art` is a junction to the main tree's) on port 5910, HMR and watch off, GPU browser, stopped by its PID.
The Den chapter itself (`ffx2-den-of-woe`) is not usable for this: its scene is the `bevelle-underground`
placeholder and `shade-nooj` has no billboard wired yet. Frames: `frames/nooj-idle-4j.jpg`, `frames/nooj-cast-4j.jpg`.

| Painting | Identity | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall | Maker (3c) |
|---|---|---|---|---|---|---|---|---|---|---|
| `nooj-shade/idle` (fur-shoulder fix) | 7.5 | 7 | 6.5 | 6.5 | 7 | 7 | 7 | 7 | **6.9 FAIL (narrowly)** | 7.0 |
| `nooj-shade/cast` (fur-shoulder fix) | 7.5 | 7 | 6.5 | 6.5 | 6.5 | 7 | 7 | 7.5 | **6.9 FAIL (narrowly)** | 7.0 |

(Unrounded means 6.94 and 6.94.) The fix did what it set out to do at 1:1; the pair misses the bar on the game read.

**`nooj-shade/idle`, FAIL (6.9, narrowly).**
- **What the fix got right, confirmed:** the fur is on the right (cloth) shoulder and a clean blue pauldron sits on
  the machina side, so metal and cloth are on the sides the bible gives. At 1:1 the crest reads as fur (spiky, pale),
  with no seam at either shoulder. Both loops still flank the skull like handles, the glasses are blue, the cane is in
  the gloved right hand, and he stands three-quarter left with the machina arm and leg toward camera.
- **Worst (the deciding fault): "one furred shoulder" is lost at game size.** The crest is about 75x90 px on the
  canvas, so about 25x30 px at 1600x900, and after the B treatment it is pale blue on a pale blue halo, tucked behind
  the far shoulder. In `frames/nooj-idle-4j.jpg` it reads as a faint lighter patch, not a shape. The bible's
  silhouette line calls the cloth side "a thick furred purple shoulder"; here the right arm is a thin dark glove
  with a short dusky band on top, so at game size his only broad shoulder is the metal one. The maker disclosed that
  the fur is "a tuft, not a mass"; that is the fault, and it is the one point between this and 7.
- The cane hand (unchanged since attempt 3) is a dark glove mass with a hooked spur at its outer edge; at 3x it reads
  as a claw more than fingers. The near foot still tapers like a hoof.
- Not named before: the near ear, beside the near loop, is pointed (an elf ear at 2x); nothing in the source says so.
  Minor, and it does not show at game size.
- At 3.5x the crest has a few detached grey flecks and a posterised interior, and the sleeve under it is flat lilac-grey
  with no folds. None of this shows at 1:1.
- Still disclosed and unchanged: one belt pair and a cross strap (bible: five visible), both shins armoured, and the
  machina arm is a bulky blue armoured limb, not the bible's thin articulated stick with gaps.

**`nooj-shade/cast`, FAIL (6.9, narrowly).** The cane swing is the strongest read of the pair: at 1600x900 the cane
sweeps out and down toward the party and the pose reads at once. The crest shows a little more past the far shoulder
than in the idle, but it is still a tuft. At 2x to 3x the elbow is a boxy dark block where the sleeve meets the
rotated forearm, and the forearm's upper edge steps; neither shows at game size. It carries the idle's misses. As
before, its canvas widens left, so in the frame it stands about 18 px right of the idle's feet (the scene should
anchor casts to the idle's feet, T5).

**What would lift it (a suggestion, not a brief; nothing was changed).** The fix is right on which side; the fur's
size is short. A masked repaint on the same opaque idle that makes the crest a mass (about twice the width, rising
above the far shoulder line and breaking the silhouette outward, as the portrait's fur collar does), with a fuller
purple sleeve under it, then B and the cast transplant as before. It needs no re-render. This slot has now failed four
independent judgements (6.9, 6.6, 6.8, 6.9), so rule 15 applies: a written method check comes before the next attempt.
The maker's own stop rule said no fourth attempt tonight. Since the gap is one sub-score, the cheaper step may be to
show Bailey `frames/nooj-idle-4j.jpg` and ask whether the tuft is enough.

### Verdicts (independent, attempt 4)

nooj-shade/idle (fur-shoulder fix, `674058d32184`): FAIL (independent, 6.9 narrowly): the fur shoulder does not read at game size
nooj-shade/cast (fur-shoulder fix, `a07ec9e35852`): FAIL (independent, 6.9 narrowly): the same miss, inherited

Both stay **CANDIDATE**. No art was changed; nothing was added to `approved-hashes.json`. `verify-approved.mjs` after:
see the commit body.
