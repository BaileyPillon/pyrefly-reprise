# Yaw keys — round "final" (attempt 3, Sonnet, 2026-09-21 evening)

Painted with `node tools/gen/yaw-keys.mjs render --key <key> --batch 4 --config A --tag final`,
recipe R2 (`docs/ART-PIPELINE.md` §3): the plate's own identity block verbatim, the
approved plate `public/art/portraits/yuna-x2.png` as the IP-Adapter reference at
`--forceRef` 0.35, Danbooru view tags in `--facingPhrase`, no effect words. Model
`animagine-xl-4.0-opt.safetensors`, 832x1216, steps 28, cfg 6, `euler_ancestral`.
4 candidates per key, all four keys, ~8.3 s/image on the local ComfyUI (queue was
idle; nothing else was rendering at the time). Sidecars sit beside each PNG under
`_cand/pilot-final/` (gitignored — see below).

This is on top of an earlier, incomplete pilot history left by attempt 2 before it
died (`_cand/pilot-B`, `pilot-C`, `pilot-r2`, `pilot-r2b`, `pilot-r3`, and a lone
`q34-left.1/.2` at the `_cand` root) — also config A, also gitignored. `pilot-r3`
already covered all four keys at batch 2 and is worth a look if a next round wants
more data, but it does not change any pick below: I judged this round's fresh
batch of 4 per key against the plate and against each other, on contact sheets
(`sheets/<key>.webp`, plate + 4 candidates + 1:1 face crops) and then at full
resolution, 1:1, for every candidate — not off the sheet thumbnails, which are too
small to judge iris colour or profile direction reliably.

**Committed:** the four sheets (`sheets/*.webp`) and the eight picks
(`picked/<key>.pick1.webp`, `picked/<key>.pick2.webp`), all converted from the
raw PNG batch output. **Not committed:** `_cand/` (now gitignored) — dozens of
raw + rembg'd candidates per round would blow well past the prototype's 40 MB
total budget on its own; the picks carry everything a next step needs.

## Picks

| Key | Pick 1 | Pick 2 | Direction correct? |
|---|---|---|---|
| `q34-left` | `.1` (seed 2064617760) | `.3` (seed 2064617762) | Yes, but weak — see below |
| `q34-right` | `.3` (seed 2023313963) | `.4` (seed 2023313964) | Yes, clean |
| `profile-left` | `.1` (seed 1236516774) | `.4` (seed 1236516777) | Yes, clean |
| `profile-right` | `.2` (seed 532706339) | `.4` (seed 532706341) | **No — see below** |

Every pick keeps: brown hair the same length and cut as the plate, the earring
and single braid with its cord wraps, the pink hood and the visible collar
colours at the neck, matching skin tone, and face proportions consistent with
the plate. Expression on every pick reads as the brief's neutral-to-slight-smile
with eyes open, matching `EXPRESSION` in the tool. None of the eight picks needed
`--refWeight` above the recipe's 0.35 to hold identity — the R2 recipe carries
the close-up face fine even at a genuine profile angle.

## What drifted

1. **`profile-right` turned the wrong way, 4 out of 4.** Every candidate in the
   batch rendered as a mirror of a `profile-left` silhouette (nose, chin and jaw
   pointing toward frame-*left*, hair falling toward frame-right) despite
   `(body facing right:1.4)`/`(facing right:1.4)` in `--facingPhrase` and an
   explicit `facing left, body facing left` ban in `--negAdd`. Compare
   `profile-left.1.png`'s silhouette to `profile-right.2.png`'s — they are the
   same head orientation. Three of the four (`.2`, `.3`, `.4`) kept the *prompted*
   eye colour (blue, "her left") even though a head turned that way should show
   the *other* (green) eye near the camera — so those three are internally
   inconsistent (a geometrically-left-facing profile with a blue near eye), and
   the fourth (`.1`) is a correctly-paired `profile-left` duplicate wearing the
   `profile-right` label. **Net: this round has zero usable `profile-right`
   frames.** The two picks above are the best-painted of a bad batch, kept so
   the rig has *something* to block in against while a fix is tried, not because
   they are correct. Do not ship the rig with these two; a naive `mirror` +
   inpaint of the iris would fix the silhouette but the source note in
   `yaw-keys.mjs` about the checkpoint's `"turned to the left"` bias suggests the
   direction phrase itself needs a different formulation for a *profile* strength
   of turn specifically (`(profile:1.4)` may be reinforcing whichever direction
   the checkpoint already favours). Next round should try: `--tag` A/B test with
   `"looking to the right, turned away, from the right"` in place of `(body
   facing right:1.4)`; or the mirror-and-repaint-the-iris route as an explicit
   post-process step (new tool, not yaw-keys.mjs) if the phrase swap doesn't
   move it; or simply rendering `profile-left` twice as wide a batch and
   horizontally flipping the *whole* head into an inpaint pass that repaints
   only the iris colour, hair-part asymmetry and earring side — more work, but
   guaranteed correct geometry.

2. **`q34-left` under-rotates against `q34-right`.** All four `q34-left`
   candidates read closer to the plate's own mild native turn than to a genuine
   ~40 degree three-quarter — `.1` and `.3` (the picks) are both very close to
   frontal, both eyes almost equally sized and both nearly centred, where the
   `q34-right` picks clearly show the far eye smaller and the near eye enlarged
   and off-axis the way an actual 40 degree turn reads. `.2` and `.4` in the same
   batch are worse: the eye that should be smaller/farther (blue, on a left turn)
   reads as large and near instead, i.e. the same eye-prominence confusion as
   finding 1, just on `q34-left` where the labelled colour also happens to be
   plausible either way at a mild angle, so it's a *softer* version of the same
   direction weakness, not a separate bug. Recommend a next attempt add
   `(head turned to the side:1.2)` or lower `refStart` slightly (0.15) so the
   pose has more room to diverge from the reference before identity locks in.

3. **Two renders tripped the cut-out sanity guard** (`q34-right.2`,
   `profile-right.1`) — a pale blob at a frame edge, most likely bokeh haze from
   the hero framing block that `rembg` didn't fully clear. Both were kept
   (`--keepBad`, per the tool's own comment: a yaw key is judged 1:1 on a
   contact sheet, not shipped as a sprite cut-out) and neither was picked
   regardless — `q34-right.2` failed on direction (finding 1's kind of mixup,
   the wrong eye large) and `profile-right.1` failed on direction (finding 1).
   Not a reason by itself to reject a candidate; noted for completeness since
   the render log flagged them.

4. **Framing/scale**: the brief asks the key's head to sit at the plate's own
   scale (measured by eye-to-chin span). None of the eight picks were run
   through `yaw-keys-sheet.py place` in this pass — that alignment step needs a
   measured eye-y/chin per candidate (the anchors are per-candidate since pose
   changes where they land, unlike the plate's fixed `PLATE_ANCHORS`), and doing
   it honestly for eight images was more than this round's budget. **This is the
   next concrete step before the rig can morph between these keys** — right now
   a mesh warp between the plate and an unaligned key would translate the whole
   head. Whoever picks this up next should read a chin point and eye line off
   each of the eight picks (`yaw-keys-sheet.py grid --image <picked-cand> --box
   ... --zoom 2` against the *original* `_cand/pilot-final/<key>.<n>.png`, since
   the `picked/` copies are the same pixels re-encoded, not re-cropped) and run
   `place` to get each onto the plate's `[832, 1216]` canvas with a matching
   `eyeToChin` of 316 px.

## Not done, and why

- **No re-render of `profile-right`.** A same-recipe re-roll of the same phrase
  already failed 4/4 in this round and 1/1 in `pilot-r2`/`pilot-r2b`/`pilot-r3`
  before it (checked: those pilot rounds' `profile-right` candidates have the
  same left-facing silhouette). Burning another batch on the identical phrase
  would not be a different experiment. This needs a phrase or pipeline change,
  which is a design decision (which of the three options in finding 1), not
  something to guess at inside a candidate-picking pass.
- **No `place` alignment pass** (see finding 4) — out of scope for "paint the
  keys and pick the best two," and doing it unmeasured would just produce a
  wrong-looking placement to redo later.
- **No mouth/brow/blink patch work, no rig.json, no `PortraitStage`-shaped
  driver.** Those are other owners' pieces of the same brief (the layered rig,
  the inpainted expression patches) — this note covers only the yaw keys.

## Redo — round "fix1" (same session, Sonnet, per the independent judge)

`judge.md` (independent 1:1 pixel read, separate from the painting pass above)
confirmed the finding two paragraphs up with its own method and scored
`profile-right` **1/10** ("eye colours on correct sides") — the only key that
failed its 7-bar. The orchestrator's redo instructions for this round: raise
`--refWeight` to 0.45 (up from R2's 0.35), add `--emphasis "(heterochromia:1.3),
(blue eye, green eye:1.2)"`, a new seed range, and for a profile that loses its
iris colour, append `"one eye visible, blue eye visible"` to the view phrase.
`tools/gen/yaw-keys.mjs` gained `--viewExtra`/`--emphasis` flags so this could
run without forking `KEYS`:

```
node tools/gen/yaw-keys.mjs render --key profile-right --batch 6 --config A \
  --tag fix1 --refWeight 0.45 \
  --emphasis "(heterochromia:1.3), (blue eye, green eye:1.2)" \
  --viewExtra "one eye visible, blue eye visible"
```

**Result: still fails, and the new recipe is worse than "final," not better.**
Judged the first 2 of 6 candidates (`.1`, `.2`) at 1:1 with zoomed eye crops
(`sheets/profile-right-fix1.webp`) before writing this up — a second workflow's
Wan2.2 video-generation jobs (`docs/handoff/NOW.md`, `wf_cfd6b0fa-19e`) were on
the same shared ComfyUI queue the whole time, each taking 10+ minutes, so the
remaining 4 candidates were still queued under `_cand/pilot-fix1/` (gitignored)
when this note was written — variant `.3` even timed out waiting on the shared
queue (`comfy.mjs`'s own prompt-wait timeout) and was skipped automatically,
which is the congestion, not a new failure mode, and does not change anything
below. Two zoomed, pixel-clear candidates already settle it past reasonable
doubt, consistent with every prior round:

- **The direction bug is identical, not improved.** Both `.1` and `.2` still
  turn toward frame-*left*: the green (her-right) eye is the large, near,
  in-focus one and the blue (her-left) eye is small and set back — the plate's
  own `profile-left`-style composition, not a right turn. `--viewExtra`'s "one
  eye visible" did not even suppress the second eye; both renders show *both*
  eyes, a new failure mode stacked on the old one (round "final" at least kept
  a single, cleanly-painted, if wrong-coloured, eye).
- **New quality regression from `--refWeight 0.45`.** Both candidates are
  visibly worse than the plate and worse than any round-"final" candidate: a
  garish, oversaturated crosshatch texture covers the hair and skin, colours
  clip toward saturated red/gold, and the clean cel-shaded linework is gone.
  `docs/ART-PIPELINE.md` §3 already documents the mechanism: raising
  `--refWeight` past R2's calibrated 0.35 increases "colour bleed." No
  monochrome-guard warning fired (the plate is not near-monochrome, so that is
  not what happened here) — this is the reference weight and/or the added
  `--emphasis` tokens overloading the composition on their own.
- **This was foreseeable, and it's in the repo's own docs.** Writing this up
  turned up `docs/ART-PIPELINE.md` §2a: `body facing left/right` is
  "decorative, and not to be trusted... SDXL's text encoder has no reliable
  left/right grounding," and on this checkpoint "direction is fixed in post,
  not in the prompt" — the documented fix is `tools/gen/flip.py`, a
  mirror-and-relabel pass done *after* generation, not a heavier prompt.
  Weighted identity tags (`heterochromia`, `blue eye, green eye`) are
  appearance tokens, not pose tokens, so this recipe was never actually
  targeting the geometry bug — only the iris-colour symptom — and it did not
  fix that either (both eyes rendered, the wrong one prominent).

**The phrase/weight family of fixes is exhausted.** Five prior rounds
(`r2`, `r2b`, `r3`, `final`) plus this one have now tried stronger facing
weights, reference weight and identity-tag emphasis, and `profile-right` has
never once turned the correct way. `docs/ART-PIPELINE.md`'s own facing contract
says this should be expected: prompt weight does not reliably steer left/right
on this checkpoint. **This was the orchestrator's specified second and last
attempt at this key**, so no further redo of this family is planned by this
pass.

**What's actually left — from `judge.md`'s own two options, neither exhausted:**
1. **Untried cheap option:** a plain Danbooru phrase swap (`"looking to the
   right, turned away, from the right, right side of face"` in place of
   `(body facing right:1.4)`) — this round's brief asked for the weight/emphasis
   experiment specifically, not this one, so it is still open. Given
   `docs/ART-PIPELINE.md` §2a's own finding that the *word* `left`/`right` is
   "decorative" on this checkpoint regardless of phrasing, low confidence it
   fixes anything — worth a small 4-6 image A/B, not a full pilot, before
   trusting it.
2. **Guaranteed-geometry route, half-built:** `tools/gen/flip.py --set-facing
   right` already exists and does exactly the mirror-plus-sidecar-fix this
   route needs, using `profile-left`'s clean render as the source. But
   `flip.py`'s own doc comment is explicit: **"mirroring is only safe when
   nothing in the frame is chiral... for those, reroll instead"** — Yuna's
   heterochromia, single braid and one-ear earring are exactly that. A mirror
   needs a follow-up masked inpaint (iris colour swap, earring reseated) that
   does not exist under `tools/gen/` yet (`docs/plans/pause-living-portraits-
   techniques.md` Part 1: native ComfyUI inpainting nodes are on this machine,
   but no inpainting-specific workflow file has been built here). Building
   that tool is new work, out of scope for a redo/pick pass.

**Picks unchanged.** `profile-right`'s round-"final" picks (`.2`/`.4`) stay the
least-bad placeholders — every `fix1` candidate judged is strictly worse (same
wrong direction, plus the new quality regression), so none was picked over
them. **Do not build the rig against any `profile-right` candidate from any
round yet.**

**Bookkeeping fix carried over from `judge.md` (not a re-render):** for
`q34-right`, wire the rig to pick2 (`.4`, seed 2023313964) as the primary
candidate, not the labelled pick1 (`.3`, seed 2023313963) — the judge found
`.3`'s earring has drifted to the green-eye side (scores ~4, would fail the
key on its own), while `.4` keeps the earring on the canon blue-eye/near side
and passes clean. The `picked/q34-right.pick1.webp` / `pick2.webp` file bytes
are unchanged (still `.3` / `.4` respectively) — this only changes which one
is "primary" for wiring, not what is committed.

Not committed: `_cand/pilot-fix1/` (gitignored, same reason as every other
round's candidates). Committed: `sheets/profile-right-fix1.webp` (plate + the
two judged `fix1` candidates + their 1:1 eye crops, same sheet format as the
other four).
