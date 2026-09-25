# Chapter XIV (Isaaru): independent 1:1 judge of the production candidates

**Game case (rule 14): FFX only.** Isaaru's contest of aeons, Yuna's summons and CTB exist only in FFX
(research `ffx-isaaru-bevelle.md` §0.3; in FFX-2 he is a tour guide). Judge: a sub-agent that made none of
this art, 2026-09-25. Builder commit judged: be6048d1.

Picks judged against: Bailey, 2026-09-25 ~01:40 EDT, verbatim "I'll go with all your recommendations",
taken as a yes to every recommendation in `../README.md` and `docs/plans/chapter-isaaru-review.md`:
- **O-1 A:** calm, arms open, with the finals shortening the coat to the knee and making the sash sea green.
- **O-2 B:** steady and sorrowful, repainted to the O-1 pick's colours.
- **O-3 A:** red-lit stone, with the hallway behind.
- **O-4 C:** a sea-green edge and a darker grade on the Ifrit, Valefor and Bahamut paintings.
- **B19:** KO is the dissolve.

Anchors:
- the picked cards and frames: `isaaru/a-card.jpg`, `portrait/b-card.jpg`, `chamber/a-plate.jpg`,
  `aeons/c-card.jpg`, `aeons/pterya-c-frame.jpg` and `aeons/spathi-c-frame.jpg`;
- the approved D-089 `ifrit/*`, `valefor/*` and `bahamut/*`;
- the wiki's words as quoted in the README (*Isaaru*, "Appearance", revid 4026440).

The bar is 7 per painting, and the worst defect is named first. A multi-state subject passes only if every
state passes.

## Method

- **1:1 and zoom.** I composited each installed PNG over mid grey and over a dark red-brown close to the
  chamber, and looked at it at 1:1. Seams and hands were cropped at 2x to 4x (nearest neighbour).
- **Isaaru's idle,** at 2x to 4x:
  - the new knee hem on both sides and the robe outline below it;
  - the recoloured sash, knot and cords;
  - the face, both hands and the feet.
- **Measures on the aeons,** each against its source shifted by the 60 px pad:
  - alpha inside the figure;
  - the content box at alpha 90 of 255 (the engine's 0.35);
  - the glow alpha outside the figure;
  - border alpha.
- **Measures on the portrait and the plate.** The portrait's matte levels. The plate's mean absolute
  difference against the three option plates.
- **Game size.** I used the builder's 1600x900 engine frames (`production/frames/*.jpg`) next to the
  options round's frames of the same pick. I made no capture of my own: nothing is wired yet, and the
  builder's frames already use the real HUD with the real sidecars.
- **Scale.** I checked the idle `scale` factors against `computePoseScale` (`src/engine/PaintedScale.ts`).
  The engine sizes by the reference idle's `baselineY`. 1062/1002, 874/814 and 1010/950 give 1.0599, 1.0737
  and 1.0632, which match the sidecars.

## Scores (0 to 10; bar 7)

| Subject | State | Identity to pick | Anatomy | Hands | Costume / colour | Seams | Edges | Finish | Game read | Overall (mean) |
|---|---|---|---|---|---|---|---|---|---|---|
| `isaaru` | idle | 8 | 7 | 6.5 | 7.5 | 6.5 | 7.5 | 7.5 | 8 | **7.3** |
| `isaaru` | portrait | 8.5 | 8 | n/a | 7.5 | 7 | 7 | 8 | 8.5 | **7.8** |
| `via-purifico` | plate | 9.5 | n/a | n/a | 6.5 (room geometry) | n/a | n/a | 6.5 | 8 | **7.6** |
| `grothia` | idle | 9 | 8 (approved) | n/a | 8 | 8 | 7.5 | 7.5 | 8 | **8.0** |
| `grothia` | attack | 8.5 | 8 | n/a | 7 | 8 | 7.5 | 7 | 7.5 | **7.6** |
| `grothia` | overdrive | 8 | 8 | n/a | 6.5 | 8 | 7 | 6.5 | 7 | **7.3** |
| `pterya` | idle | 9 | 8 | n/a | 8 | 6 | 5.5 | 7.5 | 7 | **7.3** |
| `pterya` | attack | 8.5 | 8 | n/a | 7.5 | 8 | 7.5 | 7.5 | 7.5 | **7.8** |
| `pterya` | overdrive | 8.5 | 8 | n/a | 7.5 | 7.5 | 7 | 7 | 7.5 | **7.6** |
| `spathi` | idle | 9 | 8 | n/a | 7.5 | 6.5 | 6.5 | 7 | 7.5 | **7.4** |
| `spathi` | attack | 8.5 | 8 | n/a | 7.5 | 7.5 | 7 | 7.5 | 8 | **7.7** |
| `spathi` | overdrive | 8.5 | 8 | n/a | 7.5 | 7 | 7 | 7.5 | 8 | **7.6** |

## Per subject, worst named first

**`isaaru` idle, PASS (7.3).** This is the O-1 A pick's own figure: the pose, face, topknot, lapels,
sleeves and shoes are the render's pixels. The two recommended repairs landed:
- The sea-green coat panels stop at the knee. The white robe continues to the ankle, which the wiki's
  words allow.
- The sash is sea green, and the coat reads black.

At 1600x900 (`frames/grothia-hud.jpg`) he reads as a black coat with a sea-green collar and belt over a
white robe that is not blown out. His content box measures exactly to `baselineY` 1171, with 16 px margins
and one alpha island.
- **Worst: the knee hem.**
  - At 2x both panel ends are a flat, ruler-straight cut with a 2 px ink line. No fold, taper or shading
    follows the cloth.
  - On the left, below the cut, the robe's outer line is doubled and stair-stepped for about 60 px. It is
    the disclosed "jog", and at 4x it reads as two parallel ink lines.
  - At 1:1 and at game size it passes as a hem.
- **Hands.** The far (right) hand is a mitten with merged fingers and a pale fleck at the fingertips. The
  near hand's fingers are also merged. Both are the pick's own hands and are too small to matter at game
  size.
- **Knot.** The recoloured knot and cords are a dark, slightly muddy teal. At 2x their outlines are jagged,
  with specks of the pale robe showing inside the loops. The knot is still the render's ornamental knot,
  not the wiki's bow (disclosed).
- **Dark plates.** On a very dark plate the black coat's outer outline merges with the background. In the
  red chamber it holds.

**`isaaru` portrait, PASS (7.8).** The face, expression and line work are the O-2 B card's own pixels.
The recolours match the O-1 A pick: sea-green lapels and inner V, brown hair at both shoulders, a gold tie
and a darker coat. In the real dialogue frame (`frames/dialogue.jpg`) it reads cleanly at the box's size.
- **Worst: the expression.**
  - The brow is drawn down into a frown, so at 1:1 the face reads stern, close to angry, more than
    "sorrowful".
  - This is the picked card's face, untouched, so it is not a production defect.
  - If Bailey wants more sorrow than resolve, it is a new expression, not a recolour.
- **Seams.** At the top of the left lapel, where the old yellow-green met the gold edge, the recolour
  leaves a mottled grey-brown patch at 1.2x. The two lapels are also slightly different teals: the left is
  darker and the right more mint.
- **Matte.** The matte is binary (0 and 255 only), which is the house convention: braska, cid, auron and
  bahamut are the same. At 3x there is a 1 px dotted pale fringe along the hair's outer strands. It cannot
  be seen at dialogue size.
- **Top edge.** The topknot is cut by the canvas top, as on the card.
- The bronze medallions and the blue collar gem are disclosed as coming from O-1 C's look.

**`via-purifico` plate, PASS (7.6).** It is the picked O-3 A plate. The mean absolute difference against
`chamber/a-plate.jpg` is 2.3, against 25.8 for B and 23.0 for C. The red lamps, the pillars and the lit
floor lane read at game size, and every figure stands out on it.
- **Worst: the room's geometry above the lamps.**
  - The ceiling is a set of diagonal slabs with hanging lamp boxes. At 1:1 it reads as an inverted ramp or
    a second floor more than as a ceiling.
  - The room is a long colonnade, not the square room with a low parapet of square red lamps that the
    sources describe (disclosed).
- **Finish.** At 1:1 the x4 upscale smears the walls and the floor tiles into painterly mush, and the near
  pillars lean slightly outward. At 1600x900 under the HUD neither matters.

**`grothia`, PASS (idle 8.0, attack 7.6, overdrive 7.3).** The recipe is exact on all three states:
- The alpha inside the figure equals Ifrit's (difference 0).
- The content box at alpha 90 is identical to the source's plus 60.
- The glow outside the figure peaks at 84 of 255, which is 0.33 and under the measure.
- The border alpha is 0.

The idle matches the O-4 C card.
- **Worst: the grade on the brighter source states.**
  - On the attack, and more on the overdrive, the multiply toward the coat's blue-grey drains Ifrit's fire.
  - The orange mane and red skin turn salmon and beige, and the overdrive reads washed out beside Ifrit's.
  - It is the same recipe as the picked card, applied evenly, so it is not a pick deviation.
  - If it bothers Bailey, a per-state grade strength (for example, a 0.5 blend on the overdrive) is a
    one-line change.
- The overdrive inherits Ifrit's four small floating flame bits. They carry the rim too.

**`pterya`, PASS (idle 7.3, attack 7.8, overdrive 7.6).** The derive is exact, with the same measures as
Grothia. Valefor's teal already carries the sea-green edge, as the README expected.
- **Worst (idle): the wing tip.**
  - The approved `valefor/idle.png` is cut at its canvas edge: the wing tip is a ruler-straight vertical
    edge, and the border alpha is 255.
  - With the 60 px pad and the glow around it, that cut now shows as a vertical edge with its own halo. It
    reads as a panel edge at 1600x900 (`frames/pterya-hud.jpg`, x about 1305).
  - The picked frame `aeons/pterya-c-frame.jpg` shows the same cut, and the source is approved, so it
    passes. It is the first thing to fix if either Valefor or Pterya is ever repainted.
- **Staging (not art).** Pterya's tail and wing cover Isaaru at the options round's position, as disclosed.
- The overdrive keeps Valefor's pale splash under the talons, rimmed.

**`spathi`, PASS (idle 7.4, attack 7.7, overdrive 7.6).** The derive is exact, with the same measures as
Grothia. The frame shows the reason for C: the dark Bahamut painting survives the dark chamber only
through its rim (`frames/spathi-hud.jpg`, as in `aeons/spathi-c-frame.jpg`).
- **Worst (idle): the rim traces every interior hole.**
  - The inner rim follows every gap in the silhouette. This gives bright sea-green loops by the jaw and at
    the hip under the wing.
  - The glow tints the semi-transparent wing membranes green from behind.
  - At game size the idle reads as a neon line drawing more than a painted dragon.
  - It matches the picked frame exactly, so it passes. A rim limited to the outer silhouette (fill the holes
    before the erode) would read as more solid if Bailey wants that later.

**KO: no painting (B19, the dissolve).** Nothing to judge here as art. `frames/grothia-ko.jpg` shows the
engine dissolve halfway.

## What I did not judge

- Wiring, staging and Isaaru's stage height. These are owed to the scene and data tracks.
- The chapter card, thumbnail and pause plate. They have not been made.

## Verdicts

isaaru idle: PASS (locked)
isaaru portrait: PASS (locked)
via-purifico: PASS (locked)
grothia idle / attack / overdrive: PASS (locked)
pterya idle / attack / overdrive: PASS (locked)
spathi idle / attack / overdrive: PASS (locked)

## Lock record

- **Set.** `chapter:isaaru:2026-09-25` in `docs/target/approved-hashes.json` holds the twelve PASS files,
  with the sha256 re-taken by this judge.
- **Backup.** `D:/Tools/pyrefly-art-backup/approved/2026-09-25-isaaru/` has the PNG and its sidecar for
  each file, with each backup verified by sha256.
- **`verify-approved.mjs`** (`D:/Tools/pyrefly-lora/tools/`): before the lock, 173 ok, 0 mismatched,
  0 missing; after, 185 ok, 0 mismatched, 0 missing.
- **Lock commit:** 31acc55c. It changes `approved-hashes.json` alone, with 64 lines added and none changed.
