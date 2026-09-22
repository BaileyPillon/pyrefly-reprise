# Identity judge — yaw keys, round "final" (2026-09-21, Sonnet, attempt 3)

Independent of the painter (`keys.md`, commit `6000edf`). No rendering, no editing —
this is a 1:1 pixel read of the plate (`public/art/portraits/yuna-x2.png`) against
the picked candidates under `art/keys/_cand/pilot-final/`, plus the committed
`picked/*.webp`. `judge-sheet.png` in this folder is the evidence: plate head, the
candidate used for each key's score, and native-pixel (no resampling) 1:1 eye crops
for all five.

**Method.** Nine hard criteria, 0–10 each, scored on the candidate at full
resolution (not the `sheets/*.webp` contact-sheet thumbnails, which are too small
to tell iris colour or a hairline pink tip from a JPEG-ish compression artifact).
A key's score is its **worst** criterion. Pass at 7+. Where a key has two picks, I
scored both against the plate and report whichever is stronger — see "Picks vs.
what I used" below, because it is not always pick 1.

## Scores

| Key | File used | Eye colour sides | Hair colour | Hair cut/length | Earring | Collar/clothing | Skin tone | Face proportions | Line/shading | Lighting dir. | **Score (worst)** | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `q34-left` | `_cand/pilot-final/q34-left.1.png` (pick1) | 9 | 9 | 9 | 8 | 8 | 8 | 8 | 8 | **7** | **7** | PASS |
| `q34-right` | `_cand/pilot-final/q34-right.4.png` (**pick2**, not pick1) | 9 | **7** | 8 | 8 | 8 | 8 | 8 | 8 | 8 | **7** | PASS |
| `profile-left` | `_cand/pilot-final/profile-left.1.png` (pick1) | 8 | 8 | 8 | **7** | 8 | 8 | 8 | 8 | 8 | **7** | PASS |
| `profile-right` | `_cand/pilot-final/profile-right.2.png` (pick1) | **1** | 7 | 7 | 3 | 7 | 7 | 7 | 7 | 6 | **1** | **FAIL** |

**`pass` (all four keys have a passing candidate): NO** — `profile-right` has zero
usable candidates in this round (checked pick1 `.2` and pick2 `.4` both; see below).

## Confirmed independently: the profile-right mirror bug is real, and it is exactly
what `keys.md` describes

I put `profile-left.1` and `profile-right.2` side by side at 1:1 (see the bottom
row of `judge-sheet.png`, last two columns). They are **the same head silhouette**:
nose pointing the same way, hair falling back the same way, same jaw line, same
earring-braid position. The *only* difference is the iris colour: `profile-left.1`
shows the plate's green (her right eye); `profile-right.2` shows blue in the
identical near-eye position. A genuine profile-right — camera on her other
side — would mirror the *entire* silhouette (nose the other way, hair falling the
other way, near cheek the other way), not keep the same silhouette and recolour
one eye. This is not a borderline call: I sampled pixels directly
(`(56,75,218)` at the iris centre — saturated blue, no ambiguity) and confirmed the
outline match by overlay-scale comparison. `profile-right.4` (the other pick) has
the same silhouette problem, with a partially blended blue/green iris that reads as
a paint error on top of it. **Score 1 on "eye colours on correct sides" is a hard
fail, not a stylistic quibble**, because the image is not a rotation of the
character at all — it's the left key wearing the wrong iris.

## A second, independent finding: the earring/braid tracks whichever ear is
nearest the camera, not her actual left ear

The plate's single braid+earring is anchored to one specific ear (the same side as
her blue eye). If that is respected under a head turn, a candidate that turns
enough to make her *other* (green-eye) ear the near/visible one should show **no**
earring on that near ear (the real one is now on the far, hidden side) — or, if
both idle should show it, it should still be blue-eye-side specifically, not
whichever side the model rendered.

That is not what happens. Every profile/near-profile candidate I checked draws the
earring on whichever ear the pose has facing the camera, regardless of the plate's
side:
- `q34-left.1` (mild turn, blue eye still on-screen-right as in the plate): earring
  on the right/blue side. Correct, but this pose barely turns, so it's not a real
  test.
- `q34-right.3` (**the official pick1** for this key): the near/enlarged eye is
  green and the earring has moved to the **green** side — i.e., it followed the
  near ear across, not the blue eye. This is the reason `q34-right.3` scores a 4 on
  "earring" and would fail the key if used. `q34-right.4` (pick2) turns the *other*
  way — blue near, earring correctly on the blue/near side — and passes. **Whoever
  wires the rig next should use `q34-right.4`, not the labelled pick1 `.3`,** or
  treat `q34-right` as needing a re-pick, not just a re-render.
- `profile-left.1`: only one eye is visible at all (a real profile), and the
  visible ear (green side, her right) carries an earring the plate does not put
  there. It doesn't fail the key here (7, not <7) because I read "earring: present,
  correct colours, plausible" as the primary bar this pass was asked to check, and
  because I cannot rule out she's meant to read as wearing it visibly at this
  angle without a cleaner reference — but it's a real drift worth a note for
  whoever does the `place`/alignment pass next, since a rig that cross-fades
  between these keys will show the braid appearing to "jump ears" as it morphs.

This is a different bug from the profile-right mirror (that one is a geometry+colour
contradiction with no valid reading; this one is a single feature not staying
anchored to its own side under rotation), but it is the same family of problem: the
model is not tracking which physical side of the head each asymmetric feature
belongs to. Next round should decide whether to accept "earring follows the near
ear" as a style simplification (state it, once, as a deliberate call) or fix it via
inpainting the earring into a fixed position after the base render (the
"pilot-final `keys.md` finding 4" alignment pass is probably the right place to
also stamp the earring in a canon-consistent spot, since that step already needs a
per-candidate landmark read).

## Per-key notes

- **`q34-left`**: worst is lighting direction (7) — the picked candidate carries a
  faint yellow-green tint inside its top-of-hair highlight that the plate doesn't
  have (plate's rim light is pure warm orange/gold). Minor; still reads as "light
  from above/behind, warm," just with an off-colour cast in the specular. Everything
  else (both eye colours + sides, hair colour including the pink ombre tips, cut,
  collar, skin, proportions, line weight) matches the plate closely. This is the
  cleanest key this round.
- **`q34-right`**: as above, use `.4` not `.3`. On `.4`, the only soft spot is hair
  colour (7) — the pink ombre tips visible in the plate and in `q34-left.1` are not
  clearly visible here (the lit side of the hair reads as plain warm brown/gold;
  they may be present but washed out under the highlight). Direction reads
  correctly this time (blue eye and the braid both correctly on the near/left side),
  which is the opposite-handed turn from `q34-left`, as it should be.
- **`profile-left`**: cleanest single-eye profile of the four. Worst is the earring
  tracking issue above (7). Line weight, shading, lighting direction (warm rim light
  sweeping the crown, matching the plate's direction rotated with the head) and
  proportions all hold up well at 1:1.
- **`profile-right`**: fails outright. Do not build the rig against `.2` or `.4` as
  a real profile-right; there is no usable candidate in this round or in
  `pilot-r2`/`pilot-r2b`/`pilot-r3` per `keys.md`'s own cross-round check, which I
  did not re-verify pixel-by-pixel but have no reason to doubt given how clean the
  `.2` vs `profile-left.1` match is.

## Redo

- **`profile-right`** (the only key that needs a redo): the phrase-weight approach
  (`(body facing right:1.4)` + a `facing left` negative ban) has now failed
  identically across at least four rounds (`r2`, `r2b`, `r3`, this one) — that is
  strong enough evidence the checkpoint's left-turning bias is not going to yield to
  more of the same phrase. Two directions, in order of effort:
  1. **Phrase swap, cheap, try first**: replace the facing tag with plain
     Danbooru-style direction language the checkpoint may have seen more of on the
     correct side, e.g. `looking to the right, turned away, from the right, right
     side of face` in place of `(body facing right:1.4)`, keeping the same negative
     ban. A/B against the current phrase on a small batch (4–6) before committing to
     a full pilot.
  2. **Mirror + targeted inpaint, guaranteed geometry, more manual work**: render
     `profile-left` at double the usual batch, pick the best, horizontally flip the
     whole image (this also flips the hair-part and earring to the wrong side, so
     it isn't a free lunch), then run a new tool (not `yaw-keys.mjs`) that inpaints
     only the iris colour (green→blue) and, ideally, the earring back onto the
     correct post-flip side. This machine has native ComfyUI inpainting nodes per
     `docs/plans/pause-living-portraits-techniques.md`, so the pipeline exists; it
     just isn't built yet.
  Both are plans, not renders — building either is a call for whoever picks this up
  next, per `keys.md`'s own "not done, and why."
- No other key needs a redo at the 7-bar. `q34-right`'s pick-order mismatch (use
  `.4`) is a bookkeeping fix, not a re-render.

## What I did not do

- Did not re-render or re-touch anything under `_cand/`, `sheets/`, or `picked/` —
  read-only judging as briefed.
- Did not re-verify the prior pilot rounds (`pilot-r2`, `pilot-r2b`, `pilot-r3`,
  `pilot-B`, `pilot-C`) pixel-by-pixel; `keys.md`'s cross-round claim about
  `profile-right` is consistent with what I found in this round and I have no
  reason to doubt it, but I did not open those files myself.
- Did not run the `place`/alignment pass (`keys.md` finding 4) — out of scope for
  judging identity, and it would need per-candidate landmark reads this pass didn't
  do.
