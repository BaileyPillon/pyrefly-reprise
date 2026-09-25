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
