# Expression / blink patches — round 1 (attempt 3, Sonnet, 2026-09-21 evening)

Inpainted with `node tools/gen/inpaint.mjs` (new this round; see
`docs/ART-PIPELINE.md` "Inpainting patches"), against
`docs/concepts/pause-until-dawn/prototype-v2/art/keys/frontal.png` — a
byte-identical copy of the approved plate `public/art/portraits/yuna-x2.png`
(sha256 `7427dc7f...` on both, checked before and after every run in this
folder; the approved original was never opened for writing). Recipe: the same
`IDENTITY` block `tools/gen/yaw-keys.mjs` exports (so a patch and a yaw key
never describe the character two different ways), native ComfyUI
`LoadImage` → `LoadImageMask` → `VAEEncodeForInpaint` → `KSampler` →
`VAEDecode` → `SaveImage`, no custom node, no IP-Adapter reference in this
round (the unmasked surrounding pixels alone held identity well enough that
`--ref` was never reached for).

**Every image below was opened and looked at directly, at native pixel
resolution, before being kept, rejected, or written up as a finding** — the
sheets under `_cand/` (gitignored) and the four `PASS`/`DISCLOSED` picks
committed here.

## The load-bearing finding: the brief's denoise range does not work for this graph

The brief specified `--denoise 0.35 to 0.6`. **The first batch, run exactly
at that range (`eyes/closed` round 1, `--denoise 0.5`), produced a flat,
uniform grey rounded-rectangle in the masked region on both of two
candidates — no eyelid, no lash line, no texture at all** (evidence: the
round-1 candidates are not committed, gitignored under `_cand/`, but the
finding is reproducible from this file's own recipe). This is not a
ComfyUI error, a black-frame/NaN event (the surrounding pixels rendered
correctly, and the grey is mid-tone, not zero) or a masking bug (the grey
block's position and feathered edges exactly match the requested box) — it
is `VAEEncodeForInpaint`'s own documented behaviour: it pre-fills the masked
region with flat mid-grey before encoding, then hands the sampler a
`noise_mask`-carrying latent. At `denoise` 0.5, only half the noise schedule
runs, which is enough for a normal img2img touch-up of *existing* detail but
is **not enough noise to escape the grey pre-fill and invent a wholly new
region** (a closed eye where an open one was) — the sampler mostly just
re-shades the flat grey it started from. This reproduced identically on a
first attempt and a repeat at the same setting (two candidates, same
outcome), which is the "two failed attempts" bar in AGENTS.md rule 15 for
that specific configuration, so this file changes the recipe rather than
trying a third render at 0.35-0.6.

**What actually works, verified**: raising `--denoise` to **0.7-0.92**
(higher for a bigger change — closed eyes replace the entire visible iris,
so it needs closer to 0.9; a mouth reshape needs about 0.8; a subtle brow
shift was tried at 0.7) gives the sampler enough freedom to leave the
grey pre-fill behind and paint real content, while the identity block plus
the unmasked surrounding pixels (hair, skin tone, lash-line style bleeding
in from just outside the mask) still visibly anchor it to the same
character — see the eyes/half and mouth picks below. **`tools/gen/inpaint.mjs`'s
`--denoise` default is unchanged at 0.45** (matching the brief) because a
future, smaller edit — nudging an existing feature rather than replacing it
outright — may genuinely want that range; this file records that a full
replacement (closed eyes, a differently-shaped mouth) needs to override it
upward, and every command below states the value it used.

## Eyes (box `[248, 345, 517, 125]`, both eyes in one patch)

| State | File | Denoise | Verdict |
|---|---|---|---|
| neutral | (the plate itself) | — | baseline |
| half | `eyes/half.png` | 0.75 | **PASS** |
| closed | `eyes/closed.png` | 0.9 | **DISCLOSED** (see below) |
| blink-1 / blink-2 | — | — | **NOT ATTEMPTED** |

`eyes/sheet.png` is the evidence: plate, `half`, `closed`, all at native
resolution.

**`half` passes clean.** Both eyelids visibly droop with the lash line
curving downward (not a straight dark bar — the brief's specific rejection
criterion), and — checked directly, zoomed to 2x, pixel by pixel — **the
heterochromia is correct on both sides**: her right eye (viewer-left) shows
green, her left eye (viewer-right) shows blue, matching the plate exactly.
Picked from a batch of 3 (seed 5201-5203); the other two candidates were
either too close to fully open (cand.2) or had a slightly ambiguous
aqua-toned left iris (cand.3) — `half.png` is cand.1.

**`closed` is a disclosed identity miss, not a clean pass.** At UI scale it
reads correctly — both eyelids rolled shut, lash line curved, no dark bar —
but at 1:1 (zoomed a further 3x specifically to check this, per the brief's
own instruction to compare against the source at 1:1) **the right eye
(viewer-left in the crop, her actual right/GREEN eye) closes fully clean,
but the left eye in the crop (viewer-right, her actual left/BLUE eye) leaks
a thin GREEN sliver under the lash line where blue belongs.** Confirmed by
cropping and zooming that exact region directly (not eyeballed off the
contact sheet): the visible colour reads as saturated green, no ambiguity.
This is the same *family* of bug the yaw-key judge (`../keys/judge.md`)
found for `profile-right` — a single masked text prompt describing "closed
eyes" for both eyes at once has no way to say "green on this side, blue on
that side," and the model defaulted to one colour for both attempts that
showed any colour at all.

A second round (`_cand/eyes/closed-v2*`, tags changed to explicitly ask for
"no iris visible, plain closed eyelids" plus a negative banning
`green eye, blue eye, iris, pupil`) was **worse, not better**: none of the
three candidates actually closed — all three came back with fully open
eyes — and two of the three lost the heterochromia entirely (**both eyes
rendered blue**), which is a bigger identity miss than the one round 1 had.
**That is two failed rounds on this specific key** (round 1: closed but
wrong colour on one side; round 2: not closed at all, worse colour loss) —
AGENTS.md rule 15's two-failures bar, so this file stops here rather than
trying a third recipe blind, and keeps round 1's `closed.png` as the
least-bad candidate, explicitly flagged, the same way the yaw-key judge kept
`profile-right`'s least-bad candidate rather than shipping either a
worse one or nothing.

**Recommended next step, not attempted here** (a design decision, not
something to guess at inside a render pass): mask each eye in its own
smaller box with its own single-colour prompt (`"green eye closing"` /
`"blue eye closing"`) run as two separate `inpaint.mjs` calls composited
back together, instead of one box asking for both at once. This should
remove the ambiguity that caused both rounds' failures, at the cost of a
seam between the two boxes to blend (feather already exists for this; two
adjoining feathered boxes have not been tried).

**Blink intermediates (blink-1 ≈ 66% open, blink-2 ≈ 33% open) were not
attempted this round.** The brief allows either inpainting them directly at
intermediate denoise/strength or picking two aperture-appropriate frames out
of a `half`-style batch; with `closed` costing two rounds and this session's
budget going to covering all three patch groups at least once, this was cut
rather than rushed. Next step: a `half`-style batch with `--denoise` between
`half`'s 0.75 and `closed`'s 0.9 (say 0.8, 0.85) should land in that
aperture range, judged the same way `half` was — measure or eyeball the
visible sclera height against the plate's open aperture, not just "looks
about right."

## Mouth (box `[300, 585, 320, 105]`)

| State | File | Denoise | Verdict |
|---|---|---|---|
| closed-neutral | (the plate itself — a confident smirk) | — | baseline |
| parted | `mouth/parted.png` | 0.8 | **PASS** |
| smile | `mouth/smile.png` | 0.8 | **PASS** |
| pressed | `mouth/pressed.png` | 0.8 | **PASS** |

`mouth/sheet.png` is the evidence. All three picked from batches of 3
(seeds 5301/5401/5501 + 0/1/2); skin tone, lip colour and the cel-shaded
line weight all read as continuous with the plate at the seam — checked at
1:1, no colour-temperature jump at the mask boundary on any of the three.
`parted` shows a soft gap with teeth/tongue implied, not the plate's smirk;
`smile` widens into a warmer, more open grin with visible teeth; `pressed`
tightens into a small, level, serious line. The plate's own mouth (a
"confident smirk" per its own generation prompt, `yuna.json`/`yuna-x2.json`)
stands in for `closed-neutral` — the brief calls this state "the plate's own"
and does not ask for a re-paint of it.

Not separately re-verified against the eye region: none of the three mouth
renders touched anything above y≈580 (the mask's own top edge, well below
the eyes' box which ends at y=470), and the sheets confirm the eyes are
absent from every mouth crop, so there is no cross-contamination to check.

## Brows (box `[260, 300, 500, 65]`): not delivered, and why

**Zero usable candidates across two prompts (`raised`, `drawn`), three
seeds each.** Looked at every one of the six at native resolution
(`_cand/brows/raised.sheet.png`, `_cand/brows/drawn.sheet.png`): the plate's
own hair fringe falls **directly over where a separate eyebrow line would
be** — there is no visible brow linework in the source at all, only hair,
confirmed by re-cropping the plate at 2x zoom before ever picking this
box (`tools/gen/yaw-keys-sheet.py grid`, see the box-finding note below).
Five of six candidates came back as hair, essentially unchanged from the
source, because the surrounding context (all hair, on every side of this
box) dominates the repaint and the prompt words ("raised eyebrows",
"furrowed brow") have no anchor to attach to under that much hair context.
The sixth (`drawn` cand.3) is an outright failure unrelated to the brow
question: a bright, flat green blob with a white outline, structurally
nothing like hair, skin or a brow — almost certainly the model collapsing
onto an unrelated Danbooru association for "furrowed"/"drawn together" with
this little to hold onto; not investigated further since the underlying
"there is no brow to move" finding already rules this key out for this
approach.

**This is not a tooling failure or an under-explored prompt space — it's a
property of the source painting.** No re-render at a different denoise or a
different phrase changes that her brows are physically covered by hair in
this plate; a "raised eyebrow" patch cannot read as raised without also
showing more of the brow than the plate does, which means moving the hair
that covers it, which is: (a) a bigger, riskier edit to a strand-by-strand
painted feature the yaw keys already flagged as chirality-sensitive
(`keys.md`), and (b) arguably a different design question ("does an
eyebrow-raise move the fringe too?") than "paint a brow patch," worth
asking Bailey rather than guessing at inside a render pass, per this
project's own rule that new content/appearance decisions need a yes (AGENTS.md
rule 10) and that this round's job was to paint patches, not redesign the
hairstyle.

**Recommended next step, not attempted here**: either (a) a combined
hair+brow box tall enough to include the bottom few pixels of the fringe
itself, with an explicit tag asking the fringe to lift slightly
("bangs parting, eyebrow visible"), tried as a small 3-4 image A/B before a
full batch, or (b) treat "brow state" as a rig-level fake for this
character specifically (a small vertical nudge of the hair layer itself,
which the rig's layered-hair plan already has as a separate moving layer)
rather than an inpainted patch, and reserve real inpainted brow patches for
a character whose plate shows visible brow linework. Not decided here —
a design call for whoever wires the rig next.

## Hurt set (wince / one eye closed / clenched teeth): not attempted

Cut for budget this round: `closed`'s two rounds and the brows finding used
the time this session had; a hurt-state patch is a compound expression
(an asymmetric eye state plus a teeth-baring mouth, likely needing its own
box or two smaller ones) that deserves its own pass rather than a rushed
last patch. Not started, no candidates exist under `_cand/`.

## Box coordinates, and how they were read

All three boxes were read directly off `frontal.png` at native pixel
resolution with `tools/gen/yaw-keys-sheet.py grid --image ... --box ...
--zoom 2`, the same tool the yaw keys use to read pixel coordinates off a
plate — never guessed from the canvas size or copied from another
character. `docs/plans/pause-living-portraits-motion-spec.md`'s own
measured anchors (`PLATE_ANCHORS` in `yaw-keys-sheet.py`: pupils
`[338,422]`/`[609,406]`, chin `[470,730]`) fixed the rough vertical bands;
the exact box edges were then read off the zoomed grid image by eye, the
same way `keys.md`'s "place" step reads a chin point.

## What I did not do

- Did not touch `public/art/portraits/yuna-x2.png` — verified byte-identical
  (sha256) both before this session's first render and again while writing
  this file.
- Did not build `rig.json`, the layered-rig driver, or any
  `PortraitStage`-shaped code — that is a different piece of the same brief,
  owned by whoever wires the rig (this file's job was the patches
  themselves, per the orchestrator's brief).
- Did not attempt blink-1/blink-2 intermediates or the hurt set (see above).
- Did not re-attempt `eyes/closed` a third time (see the two-failed-rounds
  note above) or `brows` a third prompt (see the brows section) — both are
  now design questions for the next pass, not renders to guess at.
- Did not use `--ref`/IP-Adapter on any patch in this round — the unmasked
  context alone held identity well enough on every PASS; noted in
  `tools/gen/inpaint.mjs`'s own doc comment as available if a future,
  larger-boxed patch needs it.
