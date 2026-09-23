# v4 yaw keys, round 2: independent judge, second look (2026-09-23)

Game case: **FFX-2 only**. The plate is Yuna X-2 (`public/art/portraits/yuna-x2.png`,
sha256 `7427dc7fc481...`). It is unchanged, and all 115 approved hashes match before
and after this review. Round 1 is in `judge-r1.md`.

**Verdict: FAIL, with a partial pass.** Three yaws pass: **-20, +20 and +40**. Five
still fail: -85, -60, -40, +60 and +85. From -20 through the plate to +40, the keys
now read as **one head turning**. None of round 1's picks did that. The failures are
in the wide turns. In those keys the sampler still invents the parts the plate never
shows: the back and far side of the head, her left hair clip, and the far tassel.

The sheet is `judge-sheet.jpg`. It shows the plate at 0 and both picks per yaw in yaw
order, with each score and a pass or fail border.

## What round 2 fixed (checked, not taken from the notes)

- **Frame, body, hood, top and scale.** These are the plate's pixels in every key. I
  compared the crops directly. Round 1's outfit, crop and scale drift is gone.
- **The turn steps evenly.** My readings by eye (nose offset, eye spacing, jaw)
  are about 20 / 38 / 55 / 80-85 on both sides, which is close to the targets. The
  painter's iris measure agrees within about 5 degrees, except at -85 pick 2
  (it reads about 75). The 20 and 40 keys no longer turn half as far as they
  should.
- **The near tassel from +20 to +85, and at -20.** It is the plate's own tassel
  (red cap, blue cord, gold coin, cyan end). It moves rigidly toward the centre as
  the head turns. On the right side it is continuous from start to finish.
- **Eye colour by side is correct in every key.** Her right eye (screen-left) is
  green and her left eye is blue. Profile eyes are blue at -85 and green at +85.
  The far eye is no longer violet. Measured iris hue: green 163 on the keys against
  166 on the plate, blue 201 to 216 against 197. The keys' blue is less saturated
  (S 0.81 against 0.98) and has lost the plate's violet rim. This is minor drift,
  not a failure.
- There is no choker, braid, collar or brooch, except the one noted at -40 pick 1.

## Method

This round used the same criteria and method as `judge-r1.md`. Each pick was
compared with the plate at 1:1 over the head, with the whole frame alongside. Sign
convention: negative yaw turns the face toward screen-left, so her left side (blue
eye, the hair clip at her left temple) comes toward the viewer and the tassel ear
goes away. The score is the worst criterion, and 7 passes. The criteria are hair
and tips, the tassel (side and form), the hair clip, eye colour by side, hood and
top, line and shading, proportions and scale, lighting, and whether the turn reads
as the angle. Round 1 treated the clip under accessories. It is scored here because
negative yaws now bring it into full view.

## Per key

| yaw | pick | source | reads | score | worst criterion | other notes |
|---|---|---|---|---|---|---|
| -85 | 1 | w3.c4 | ~85 | 4 | the hair clip becomes a headphone-like red and cyan disc over the ear, with a blue beaded cord under it (a second earring on her bare left ear) | the back of the hair ends in a hard vertical cut with a cyan line (mask edge); profile eye cyan |
| -85 | 2 | w5.c4 | ~75 | 4 | **no hair clip**, although her left temple faces the camera | cyan flash marks and a yellow-green glow in the hair; vertical cut at the back; reads short |
| -60 | 1 | w6.c1 | ~55 | 6 | the clip is redrawn as a blue disc with an orange centre, not the red-rimmed cyan clip of -20, -40 and the plate | cyan streak under the clip; face, far hair and turn good |
| -60 | 2 | w6.c3 | ~57 | 5 | cyan and green streaks through the hair on both sides and a green smear by the far cheek | clip matches the -40 design |
| -40 | 1 | w6.c1 | ~38 | 5 | far tassel redrawn as a yellow capsule with a cyan tassel (no red cap, cord or coin) | a black choker-like band of shadow under the jaw |
| -40 | 2 | w6.c6 | ~38 | 5 | **far tassel missing**: -20 shows it whole, and the init geometry puts it under the far jaw, so it pops out of the turn | cyan-green streak in the screen-left hair; otherwise the cleanest -40 |
| -20 | 1 | w4.c5 | ~20 | **7** | lashes and iris line lighter than the plate's heavy line | the plate's tassel to the pixel; clip consistent |
| -20 | 2 | w4.c6 | ~20 | **7** | same | clip slightly larger |
| +20 | 1 | w2.c1 | ~20 | **7** | a faint teal smear at the top of the hair | plate tassel, moved; no roll |
| +20 | 2 | w2.c3 | ~20 | **7** | a faint cyan streak by the clip | |
| +40 | 1 | w2.c4 | ~38 | 6 | green and cyan smears in the hair (crown and screen-left) | near eye oversaturated cyan-green |
| +40 | 2 | w2.c6 | ~42 | **7** | near iris a little pale | clean hair; plate tassel; far eye blue |
| +60 | 1 | w5.c2 | ~55 | 5 | **far side of the head is bald**: the cheek and jaw silhouette sits on white with no bob behind it (the flat fill) | face and near side good |
| +60 | 2 | w5.c4 | ~55 | 4 | the far blue eye sticks out past the cheek contour | yellow-green glow and a thin strand at the far jaw; far side thin |
| +85 | 1 | w5.c2 | ~85 | 4 | the back of the head is an oversized flat slab of hair with a straight vertical cut on screen-left and a yellow-green-cyan rainbow stripe | profile face, green eye and plate tassel good |
| +85 | 2 | w3.c2 | ~85 | 2 | a hat-like flat shape with a pink rim and cyan, violet and gold disc ornaments over the back of the head | |

**Best per yaw:** -85: 4, -60: 6, -40: 5, **-20: 7, +20: 7, +40: 7**, +60: 5, +85: 4.

## Sequence

Read left to right, from -20 through the plate to +40, the keys hold the same
painting while the head turns. Frame, hood and scale stay fixed. The tassel slides
with the ear, the eyes keep their sides, and the hair keeps its tips. This part of
the turn is ready for the rig.

Beyond 40 the head still changes from key to key. These reasons are listed with
the heaviest first:

1. **The back and far side of the head are invented, and differently on each
   side.** The keys with blur fill (-40, -60) have full, natural far hair. The keys
   with flat fill (+60, +85) have a bald far side at 60 and a blocky slab with a
   straight cut and rainbow streaks at 85. Turning left and turning right
   therefore show two different hair volumes.
2. **Her left hair clip changes design through the left turn.** At -20 and -40 it
   is the plate's red-rimmed cyan clip. At -60 pick 1 it is a blue disc. At -85 it
   is either a headphone with a cord (pick 1) or missing (pick 2).
3. **The far tassel breaks between -20 and -40.** The plate's tassel is whole at
   -20. At -40 it is either redrawn in other colours or gone.
4. **Rainbow glow** (yellow, green, cyan) survives in the hair at +85, -85, +60
   and -60 pick 2. It comes from the fill ahead of or behind the head.
5. The repainted faces carry a slightly lighter line than the plate, most visibly
   the lashes. This is uniform, so it does not flicker.

## What the rig can use now (best failing candidate named per yaw)

| yaw | status | use | note for the rig |
|---|---|---|---|
| -85 | fail | pick 1 (w3.c4) | paint out the cord and bead under the clip; the clip must match -40's red-rimmed cyan design |
| -60 | fail | pick 1 (w6.c1) | recolour or paste the clip to the -40 design; remove the cyan streak |
| -40 | fail | pick 2 (w6.c6) | paste the plate's tassel below the far jaw, warped and occluded by the jaw, as the init places it; clean the cyan streak |
| -20 | pass | pick 1 (w4.c5) | |
| +20 | pass | pick 1 (w2.c1) | |
| +40 | pass | pick 2 (w2.c6) | |
| +60 | fail | pick 1 (w5.c2) | needs far-side hair behind the cheek (the w6 blur-fill recipe gave full far hair at -60) |
| +85 | fail | pick 1 (w5.c2) | the back of the head needs repainting: remove the straight cut and the rainbow stripe, and reduce the slab to the plate's bob |

## Redo guidance (painter, not rendered here)

- Use **blur fill for every yaw from 40 to 85 on both sides**. Flat fill is what
  made the bald far side at +60 and the slab at +85. Clamp the fill's hue to the
  plate's hair palette before sampling, so no cyan or green can be seeded.
- **Paint the whole clip once** (a small inpaint from the plate's visible half,
  approved together with these keys). Then carry it as a rigid layer at her left
  temple, as the tassel is carried. Cut it out of the repaint mask for -20 to -85.
- **Carry the far tassel at -40** as the plate's own pixels, drawn under the jaw
  and neck layers. Do not repaint it.
- Add `rainbow, multicolored hair, streaked hair, gradient hair, hat, headwear` to
  the negative prompt for the 60 and 85 keys. Add `headphones, earpiece` at -85 if
  it is missing (it was added from w3).
- Keep everything that passed: the LoRA, the aim of 25/48, OpenPose 0.8, the head
  mask, the plate pixels outside it, and the iris recolour.
