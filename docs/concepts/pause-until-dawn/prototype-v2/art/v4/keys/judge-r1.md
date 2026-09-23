# v4 yaw keys: independent judge (2026-09-23)

Game case: **FFX-2 only** (the plate is Yuna X-2, `public/art/portraits/yuna-x2.png`,
sha256 `7427dc7f...`, unchanged; 115/115 approved hashes match).

**Verdict: FAIL.** No yaw has a key that reaches 7. The eight picks and the plate,
laid in yaw order (`judge-sheet-r1.jpg`), read as **nine illustrations of the same
character by the same painter**, not as one head turning.

The LoRA did fix the v3.3 problem it was trained for. Every key is now recognisably
the plate's Yuna: brown hair with the orange-to-pink tips, the heavy black line, the
lashes, the green/blue heterochromia (mostly on the correct sides), and the pink hood.
v3.3's flat brown hair and small earring are gone. What remains is that each key is
still **its own painting**. Accessories, outfit, crop, scale and the amount of turn
change from key to key, so a paint swap in the rig would still read as a change of
picture.

## Method

- Each pick was compared at 1:1 with the plate over the head box `40,120 .. 800,880`,
  with the whole frame alongside. I did not trust the sidecar notes or the painter's
  notes.
- Side convention: negative yaw means the face turns toward screen-left, so her left
  side is nearest the viewer. The visible or near eye must then be **blue** and her
  right ear (the tassel) turns away. Positive yaw: the near eye is **green**, and the
  tassel ear is the near one. The plate's red hair clip sits at her left temple
  (screen-right). By 60 degrees toward her left it is behind the head.
- "Reads" is my estimate of the turn from the geometry of the nose, the eye spacing and
  the jaw.
- Score = the worst criterion. Criteria: hair and tips, tassel (correct side and
  correct form: red cap, blue cord, gold coin, cyan end), eye colours by side, hood and
  top, line and shading, proportions and scale, lighting, and the turn reading as the
  angle.
- Colour check: HSV over the head box. Mean S is 159 on the plate and 152 to 179 on the
  picks. Mean V is 172 on the plate and 174 to 188 on the picks. The keys are slightly
  brighter; saturation is close. Colour is not the main failure.

## Per key

| yaw | pick | file | reads | score | worst criterion | other drift |
|---|---|---|---|---|---|---|
| -85 | 1 | yaw-85.pick1.webp | ~65-70 | 3 | a red braid hangs in front of the face on the nose side (the v3.3 braid returns) | blue choker added; near eye cyan, not the plate's blue |
| -85 | 2 | yaw-85.pick2.webp | ~85 | 3 | near eye is GREEN (must be blue) | tassel hangs on the nose side from the far ear; choker |
| -60 | 1 | yaw-60.pick1.webp | ~55 | 5 | tassel cap is a cyan flower (should be red) and is drawn over the cheek instead of behind the jaw | white ornament and extra beads on the chest; cyan hair streak |
| -60 | 2 | yaw-60.pick2.webp | ~45 | 3 | tassel on her LEFT (near) ear, the wrong ear | hair clip oversized |
| -40 | 1 | yaw-40.pick1.webp | ~20 | 4 | turn reads about half of 40 | yellow tunic and a cyan chest ornament (not the white top); tassel has no cyan end |
| -40 | 2 | yaw-40.pick2.webp | ~20 | 4 | turn reads about half of 40 | head about 8% larger; a braid at the collar |
| -20 | 1 | yaw-20.pick1.webp | ~8 | 5 | barely turns | head larger; a green streak in the hair |
| -20 | 2 | yaw-20.pick2.webp | ~10 | 6 | turn reads half of 20 | the closest key to the plate in identity |
| +20 | 1 | yaw+20.pick1.webp | ~12 | 5 | tassel recoloured (red bead, yellow end, no gold coin) | far eye violet; head rolls |
| +20 | 2 | yaw+20.pick2.webp | ~12 | 6 | turn reads about half, with an 8-10 degree roll | otherwise close |
| +40 | 1 | yaw+40.pick1.webp | ~25 | 4 | far (blue) eye is violet; turn is short | tassel cap is a cyan flower |
| +40 | 2 | yaw+40.pick2.webp | ~35 | 3 | tassel on BOTH ears | red and yellow top; far eye violet |
| +60 | 1 | yaw+60.pick1.webp | ~50 | 4 | hair clip moved to her right side (screen-left); far eye violet | tassel recoloured; blue choker; shoulders turn |
| +60 | 2 | yaw+60.pick2.webp | ~30 | 3 | turn reads half; yellow and red outfit | far eye violet; oversized earring cap |
| +85 | 1 | yaw+85.pick1.webp | ~70 | 4 | hair clip on the wrong side; blue and white collar | far eye violet sliver; shoulders turned |
| +85 | 2 | yaw+85.pick2.webp | ~85 | 3 | a disc earring with a tassel (no cord, no coin); new puff-sleeve outfit; swirl background | head about 25% smaller |

Best per yaw: -85 3, -60 5, -40 4, -20 6, +20 6, +40 4, +60 4, +85 4. **None pass.**

## Sequence

It does not read as one head. The reasons, in order of weight:

1. **The turn does not step evenly.** The measured progression is roughly 0 / 10 / 20 /
   55 / 70 to the left and 0 / 12 / 25 / 50 / 70 to the right, while the targets are
   20 / 40 / 60 / 85. The keys at 20 and 40 sit at half their target. That leaves a jump
   of about 30 degrees between the 40 and 60 keys, which is v3.3's jump in a new place.
2. **The accessories are redrawn in every frame.** The tassel cap goes red, cyan
   flower, cyan spiral and cyan disc; the coin comes and goes; the tassel moves ears or
   doubles; the hair clip changes side and size.
3. **The outfit changes.** One key has a white top, others a yellow tunic, a red and
   yellow top, a blue collar, a choker or a puff sleeve.
4. **Framing and scale change.** Head size varies by about ±10 to 25 percent, the
   shoulders turn with the head, and the head rolls at +20.
5. The far eye goes violet in 6 of the 8 right-side picks.

What does carry through is the face, the line, the hair colour and the palette. This
is a model sheet of one character. It is not one painting seen from nine angles.

## Redo guidance (for the painter, not rendered here)

- Keep the LoRA; it solved identity. The failures are pose control and per-frame
  invention.
- **Turn:** raise OpenPose to 0.9-1.0 with end 1.0 at 20 and 40, or aim the 20 and 40
  skeletons at 35 and 60 to make up the known shortfall. Measure the rendered turn
  (nose offset / inter-pupil distance) and keep only keys within 5 degrees of target.
- **Shared paint:** start each key from the previous key or from the mesh-warped plate
  (img2img, denoise about 0.45-0.55) instead of from noise. The neighbouring keys then
  inherit the plate's accessories, crop and outfit.
- **Lock the body and the frame:** mask-inpaint the head only. Keep the plate's
  shoulders, top and hood pixels, and keep the plate's head scale and position.
- **Accessories:** reject any key that shows a tassel on the wrong or both ears, a
  choker, a braid or a moved clip. Paste or inpaint the tassel from the plate's own
  pixels, warped, on the near side only.
- **Eyes:** a deterministic recolour of the far iris to the plate's blue (v3.3 already
  has the recolour tool). For -85, re-render or recolour the near eye to blue.
