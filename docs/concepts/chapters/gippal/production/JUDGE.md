# Chapter XV (Den of Woe): independent 1:1 judge of the production candidates

**Game case (rule 14): FFX-2 only.** Judge: a sub-agent that made none of this art, 2026-09-25.
Judged against Bailey's picks, 2026-09-25 ~01:40 EDT, verbatim *"I'll go with all your recommendations"*:
O-1 B (translucent, lit from within, cold), the same treatment for Baralai and Nooj (GP1 = b), and
O-3 A (the cold-blue cave). Builder commit `3bac7ea6`. Bar 7 per painting. A painting that passes is
locked (below); one that fails stays CANDIDATE. These are a judge's verdicts, not Bailey's approval.

## Method

- sha256 of all seven files re-computed: each matches `INSTALLED.md`. `den-of-woe.png` is byte-identical
  to the options run's `renders/plate-a.png` (both `96965cfad6dc...`).
- Each shade composited over mid grey and over a dark blue, looked at at 1:1 and at 1.5x to 3x (faces,
  hands, the saw disc, each cast's joint and each hole the moved limb left). The picked
  `o1-shade/b-translucent-frame.jpg` and `o3-den/a-frame.jpg` were beside them.
- Measured: the lowest row with alpha above 0.35 equals the sidecar `baselineY` on all six shade
  paintings, so the 0.33 halo cap works and cannot move the feet. Border alpha is 0 on every canvas.
- Identity anchors: `research/visual-bible.md` §1.23.4 (Nooj), §1.23.5 (Gippal), §1.23.6 (Baralai),
  all `[single source]`, and the picked speaker portrait `portraits/nooj.png` (D-043).
- Game size: the builder's 1600x900 engine frames in `production/frames/`, cropped at 2x.

## Scores (0 to 10; bar 7)

| Painting | Identity to pick | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall |
|---|---|---|---|---|---|---|---|---|---|
| `gippal-shade/idle` | 9 | 7.5 | 7.5 | 6.5 | 7.5 | 8 | 7.5 | 8 | **7.6** |
| `gippal-shade/cast` | 9 | 7 | 7 | 6.5 | 6.5 | 7 | 7 | 7.5 | **7.2** |
| `baralai-shade/idle` | 7.5 | 7.5 | 7.5 | 6.5 | 8 | 8 | 7.5 | 7.5 | **7.5** |
| `baralai-shade/cast` | 7.5 | 6 | 5 | 6.5 | 4 | 5 | 5.5 | 6 | **5.7** |
| `nooj-shade/idle` | 6 | 7 | 7 | 5.5 | 8 | 8 | 7.5 | 6.5 | **6.9** |
| `nooj-shade/cast` | 6 | 7 | 7 | 5.5 | 7 | 7.5 | 7 | 7 | **6.8** |
| `backdrops/den-of-woe` | 10 | n/a | n/a | n/a | 7.5 | n/a | 7 | 6.5 | **7.6** |

## Per painting, worst named first

**`gippal-shade/idle`, PASS (7.6).** These are the pixels Bailey saw in the B frame, and the B treatment
matches the pick. The one change is the ring clamp, repainted as a toothed disc, which now carries the
sourced "rounded saw blade". The squint read matches the bible: spiky crown, one dark patch block,
square shoulder plate, round saw disc.
- **Worst:** the costume. The overalls read as a sash and apron, and the patch sits low on the cheek,
  below the line of the visible eye. The builder disclosed both. The patch is on the correct (right) eye.
- At 2x the saw disc is flat, with teeth only along its upper arc, and a small hook ring sits on top. A
  small black thorn sticks out at the left waist, and the elbow's sleeve tail has a hard-cut lower edge.
  All three are in the original render, and none shows at game size.

**`gippal-shade/cast`, PASS (7.2).** It is the idle's own forearm, fist, mortar and saw, turned 18
degrees. At 1600x900 it reads as the mortar swinging up toward the party.
- **Worst:** the seams. At 2.5x the forearm's lower edge steps like stairs where it meets the repainted
  elbow, and the hard-cut sleeve tail (inherited) hangs below it. At 1:1 the saw disc touches the hair
  tips (disclosed). None of this reads at game size, and at 1:1 it is a close pass, not a clean one.

**`baralai-shade/idle`, PASS (7.5).** A fresh render, the cleanest of the six. The silver quiff, the
blue headband, the collar rising behind the jaw, the patterned chest and the knee-length coat all
match the bible §1.23.6 silhouette: pale tuft, low head, coat box. Staff grip and far hand are sound.
The boots and the coat hem are clean at 1:1.
- **Worst:** the costume. The lower coat has white stripe panels with zigzag trim, not the sourced
  black-and-white glyph panels (disclosed). The B treatment hides the dark skin and the orange and green,
  which the pick accepts.

**`baralai-shade/cast`, FAIL (5.7).** The gesture reads at game size: the staff head tips toward the
party. But moving the pole left three scars where the idle's pole used to be. The builder disclosed
none of them.
- **Worst: the near boot is sliced through.** At 1:1 a jagged vertical tear and a horizontal step cut
  across the boot at the ankle (about x 250 to 300, y 1110 to 1180 in `cast.png`).
- **The coat's left edge is a hard straight cut** from about y 680 to 1060, with a square notch at its
  top. The pole used to run there, and the pixels were cleared with a ruler edge.
- **The staff's lower end ends in jagged dark debris:** two torn, flag-shaped fragments near the far
  boot (about x 480 to 560, y 1050 to 1180). This debris still reads at 1600x900 in `frames/baralai-cast.jpg`.
- The far hand (disclosed) is a grey lump hanging on a cord. At 2x it reads as a stump, not a hand.
- **Repair:** repaint the near boot and the coat's left edge inside masks, using the idle's own boot and
  hem pixels as the reference. Cut the pole at a clean butt cap and delete the debris. Then either put
  the far hand on the pole below the grip, or hide it behind the coat. Look at 1:1 again after.

**`nooj-shade/idle`, FAIL (6.9, narrowly).** The execution is clean: clean edges, a sound machina arm and
leg on the camera side as the staging rule asks, a good glove on the cane, and blue glasses. The
fail is identity, measured against the picked portrait and the bible.
- **Worst, and not disclosed:** Nooj has **no hair loops**. The bible says "two loops and a ponytail",
  and its silhouette line says the loops "flank the skull like handles". The picked portrait
  `portraits/nooj.png` shows both loops large. Here the side hair falls as loose strands, and the
  ponytail hangs to the knee, so the ponytail is the dominant read at game size.
- Also: the purple fur sleeve is hidden (disclosed). That removes "one furred shoulder", the second of
  the bible's four squint reads. The cane is in the machina left hand, and the bible says the right
  (disclosed). One belt shows, and the bible says there are several.
- In pure profile he is a thin column plus a cane, so a player gets "a man with a cane and a long
  ponytail", not Nooj. Compare Gippal and Baralai, whose shapes read on their own.
- **Repair (cheapest first):** a masked repaint of one hair loop at the near temple, taken from the
  portrait's loop through IP-Adapter, and a shorter ponytail (mid-back). If the fur sleeve is also
  wanted, re-render him three-quarter left so the far shoulder's fur crest shows above the near shoulder.
- **Conditional:** the builder's open question to Bailey (keep the hidden sleeve and the cane in the
  metal hand?) covers two of these four points. If Bailey says keep them, those two become his named
  call. The hair loops would still be owed.

**`nooj-shade/cast`, FAIL (6.8).** The cast inherits the idle's identity misses. Apart from those it
works: the machina arm levels the cane at the party, the joint is clean, and it reads at game size.
- **Worst beyond the idle's misses:** a small dark strap-like spur below the forearm (disclosed). It
  reads as a stray belt end.
- **Repair:** re-derive the cast from the repaired idle, with the same 32-degree turn.

**`backdrops/den-of-woe`, PASS (7.6).** It is byte-identical to the picked O-3 A plate, so it is exactly what
Bailey chose. It has the sourced rectangular clearing, cold-blue light and cave walls, and the pick's
floor, which the party can stand on.
- **Worst:** the game read in the engine. In the borrowed Chapter XI scene (`frames/den-plate.jpg`),
  the cave walls sink to black and read as a starfield with the Farplane's pink motes. The floor also
  brightens to a flat blue, so the frame no longer looks like `o3-den/a-frame.jpg`.
- That comes from the staging, not the pixels. Track T5 must stage the Den so it matches the pick:
  lower the floor's gain, keep the walls visible, and use no pink Farplane motes.
- At 1:1 the floor is flat and low in detail, at the level of a road plate, not a hero painting. The
  pyreflies on the floor read as glowing domes, and the drawn motes may double up with live particles.
  All of this is disclosed.
- **No tunnel mouth:** the pick had none either. The README asked Bailey about that, and the tunnel is
  our layout, not sourced, so it is not a reason to fail the plate.

## Verdicts

gippal-shade/idle: PASS
gippal-shade/cast: PASS
baralai-shade/idle: PASS
baralai-shade/cast: FAIL
nooj-shade/idle: FAIL
nooj-shade/cast: FAIL
den-of-woe: PASS

## Locked

The four PASS paintings are in `docs/target/approved-hashes.json` as the set
`chapter:gippal:2026-09-25`, with Bailey's words. Each is backed up with its sidecar to
`D:/Tools/pyrefly-art-backup/approved/2026-09-25-gippal/`. `verify-approved.mjs` reported ok 159 with 0
mismatched and 0 missing before the lock; the result after is in the set's commit. The three FAIL
paintings stay CANDIDATE, and a repair must re-derive `baralai-shade/cast` from the locked idle.
