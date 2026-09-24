# Living portrait v6: method check for continuous expression and gaze (paper, 2026-09-24)

Game case: **both** (the pause and its portrait runtime are shared plumbing, CHK-020; the rigged plate is Yuna X-2).
Rule 15: the v5 pilot (`b1957798`) and v5.1 (`726a440f`) failed on expression (3, then 5); this is the method check
before a third try. Continuity is solved; this plan does not touch the keys or the cuts.

## Recommendation: approach A, move the face's geometry from baked frames to runtime parameters

1. **The face becomes a small parametric rig on each key, Live2D style.** Parts are cut once on the plate: the eyeball
   (the socket fill plus the iris plus the catchlight), the upper lid, the brows, the lips and a mouth-interior
   underlay. Each part is moved by warp fields driven by continuous weights from 0 to 1. Many weights can be on at
   once. Nothing is ever cross-faded: every pixel of the face comes from one painting at every moment.
2. **The painted states become targets, not frames.** The lid slides and the brow lifts are already geometry offline
   (`rig-lids2.py`, `rig-face.py`), so they move to the shader unchanged, and the baked frames become the test oracle.
   The four painted mouths are used to fit warp lattices (DIS flow, `rig-flow.py` settings). A parted mouth shows the
   painted interior because the lips move off it, not because it fades in.
3. **Gaze is a real layer.** The plate already has `v3/layers/frontal/irisR|L` and geometric socket fills
   (`v3/fills/eyeApertureR|L`). The iris moves in eye space, clipped by the eye-window mask, and the lid moves over it.
   The catchlight is its own layer and moves at 30 percent of the iris. The eyes lead the input on a fast spring, and
   the head follows on the existing 0.14 s spring.
4. **Nothing is ever still.** Each weight runs its own band-limited noise (`BandNoise`, 0.13 to 0.34 Hz) at the
   spec's amplitudes. Events are bundles of weights (a smile drives the corners, a slight squint and a brow lift
   together), and swells overlap (400 ms in, 2.8 s out) instead of one at a time. Lids follow gaze pitch.
5. **It reaches all nine keys through the v5.1 chain.** The parts, the curves and the warp fields are pushed through
   each grown key's plate map, exactly as `chain_grow.py` pushes the patches today. The eyes, brows and mouth are never
   repainted, so a pushed iris still fits its socket.
6. **Fix the throat line and the far-side hair first or alongside** (sections below). Neither needs the options round.
7. **The pilot (below) is on the plate at yaw 0 and CPU only.** Its frames are also the options round Bailey asked for:
   no expression build reaches the nine keys until Bailey has picked a feel (rule 9).

Cost: about 10-12 agent hours (pilot 1, options 1, build 5-7, fixes 2-3, judge 1); GPU 0-10 min, masked repaints only.

## What is switched today (read in the prototype source, 2026-09-24)

- `compose.ts drawMouth`: one of four painted mouths at opacity `mouthWeight` over the key. During every swell two
  paintings share the mouth box. Between events the weight decays to zero and the mouth is still, although the spec
  says it never is (motion spec section 7).
- `nearestLid`: the nearest of eight baked apertures (0.85 down to 0) wins. The steps are 0.08 to 0.15 apart and show
  in slow lid changes (0.7 to 1.05 s, spec section 4) and in the half-lid.
- `browOpacity`: a painted brow at partial opacity, although `rig-face.py` made "raised" as a 1-5 px lift.
- `ExpressionScheduler`: one mouth event from four, one brow event from two, never combined.
- **Gaze:** `irisOffsetPx(yawNorm)` moves the iris only on the frontal layers and only with the head's yaw. v5.1 maps
  yaw over +-85 and shows the frontal painting only within +-5 degrees, so the iris moves less than 1 px. On the grown
  keys the iris is baked into `key.front`. **There is no gaze at all.**

## Three approaches

| | How | Continuous? Two paintings? | Agent h | GPU | Main risk | Verdict |
|---|---|---|---|---|---|---|
| **A** parametric rig | Parts, warp fields and clip masks; weights 0..1 summed; painted states are fit targets; a low-pass tone map (blur sigma 6 px or more, no edges) carries the smile's cheek shading | Yes. One painting per pixel | 7-9 | 0-5 | A warp-only smile looks thinner than the painted one; the socket fill smears at a wide gaze | **Recommended** |
| **B** flow morph | Warp the neutral by w*F and the painted target by (1-w)*F^-1, then blend by w (`dense.ts` machinery, reused for expressions) | Yes, but every in-between frame mixes two paintings: the v4.1 failure class wherever the flow misses (the lip line, disocclusion). Combining smile and parted needs a shared reference. No gaze | 4-6 | 0 | Double lip lines | Fallback **for the mouth only** if the pilot kills A's mouth |
| **C** neural bake | LivePortrait-class reenactment or the FLF video model renders an atlas of gaze x expression x key | No: discrete frames again, so switching or cross-fading. The atlas is combinatorial (9 keys x 5 gaze x 4 expressions x 3 weights) | 10-15 | 60-180 | Identity drift on a painting; a new download (rule 11) | Rejected at runtime. At most a later source of targets |

## Approach A in detail

**Parameters** (the ones with a painted or geometric target): `gazeX`, `gazeY`, `lidL`, `lidR` (aperture: blink,
half-lid, squint), `browRaise`, `browDraw`, `smile` (a slight smile is a lower weight, to be checked against its own
painting), `open` (lips apart over the interior), `press`. Shapes with no target (a sad corner-down, a lower-lid
raise) are INFERRED: they go in the options round and are not built without a yes.

**Warps.** Each parameter owns a displacement field D_i in key texture space: RG16F, cropped to the face box, and
smooth because it is rasterised from a small lattice (mouth 7x5, brow 5x3). The head fragment shader samples
`uv - sum(w_i * D_i(uv))`, which rides the dense yaw mesh unchanged (`warp/dense.ts` DENSE_VERT is untouched, one
texture array is added to its fragment stage). Lids are the `rig-lids2.py` per-column unroll done in the shader: the
curves yT, top and yc go in as a 1D texture per eye, with ye = top + (1 - a)(yc - top), so the aperture is continuous.
The eyeball is drawn under the lid and clipped by the eye window. Lattices are fitted by robust least squares to DIS
flow sampled at the lattice points (neutral to each painted mouth), then regularised so that no fold appears.

**Gaze.** The eyeball is the socket fill (with the iris punched out) plus the iris layer. The iris is offset in eye
space: on a grown key, the plate offset times the Jacobian of the key's map at the eye centre, so the far eye at +-40
foreshortens by itself. It is clipped to the eye window, and that window follows the lid. The catchlight moves at
0.3x the iris. Dynamics: the input target drives the eyes on a critically damped spring (tau 0.05 s) and the head on
its 0.14 s spring. The eye-in-head offset is the target minus the head, clamped, so the eyes lead and then re-centre
as the head arrives. Idle: fixation drift of 1.1 percent of IPD RMS (about 3 px on the 271 px plate IPD), and no idle
saccades (spec section 5). How far the eyes lead is not measurable in the footage (spec section 12), so it is a
choice in the options.

**Drivers** (`src/expr.ts`, new, pure, testable): weight = state base + noise + events + coupling. The mouth's noise
is sized so the mouth box changes 3.5 to 7.6 times the rigid nose box, and the brows run at 0.4 of the mouth. Event
onsets are eased, not linear, so there is no kink at the peak. Couplings: the lids droop with gaze Y
(`lidDroopForGaze`, already built), the brows lift 0.15 with gaze up, and a smile squints the lids to 0.9.

**Per key.** `chain_grow.py` gains an `expr` step: it pushes the iris, the socket fill, the eye-window mask and the lid
curves, and it transforms the fields with D_key(x) = J(x) D_plate(m(x)). The fold check runs per key.

## The pilot: keeps or kills A in under an hour (CPU only, 0 GPU)

Run it on a scratch copy of `D:/Tools/pyrefly-lora/yuna-x2/rig-v51/proto`, frontal painting only (the plate at yaw 0,
no chain). Nothing goes in `src/`, `public/art` or the committed prototype.

1. **Lids, 15 min.** Port the unroll to the shader for the plate. Render a = 0.85, 0.7, 0.55, 0.42, 0.3, 0.18, 0.08
   and 0 and diff each against its baked frame (the oracle). Then ramp a from 1 to 0 in 120 frames.
2. **Gaze, 15 min.** Draw the v3 iris over the filled socket, clipped by the eye window, over a 9 x 5 offset grid
   (x -16..16 px, y -8..8 px) at apertures 1, 0.55 and 0.18. Count iris pixels outside the window, and look at 1:1
   for smear from the socket fill at the extremes.
3. **Mouth, 20 min.** Take DIS flow from neutral to smile and from neutral to pressed inside the mouth box. Fit the
   7x5 lattice and render w from 0 to 1 in 0.05 steps. Measure the mouth-box MAD at w = 1 against the painted target,
   the det(J) range and the step max over the median, and look at 1:1.

**Keep A** if every measure passes: the lids match all eight oracle frames within 2 levels (eye-box MAD) and the ramp
has no step above 2x the median; gaze reaches at least +-12 px x with no smear and 0 escaped pixels; the smile and the
press at w = 1 are within 8 levels of their paintings, with det(J) in [0.6, 1.6] and no visible stretch.

**Kill A, by part.** *Mouth:* if the smile at w = 1 is more than 12 levels off, or the lip line tears, the mouth falls
back to B; the lids and gaze stay on A. *Gaze:* if the socket fill smears at +-8 px, re-fill the socket before
building (geometric push-pull again, or a masked repaint of about 3 GPU min). *Lids:* a miss against the oracle is a
bug in the port. Fix it; it is not a method failure.

**The same frames become the options round (end state first, rule 9).** Three 8 s frontal clips at 60 fps from the
pilot's rig: **A "measured"** (Until Dawn's numbers: idle drift, no idle saccades, the eyes leading the input), **B
"livelier"** (a glance every 3 to 6 s with a small blink on a big one, more frequent smiles), **C "quiet"** (smaller
and slower). Send them to Bailey beside `shots/v51/clip.mp4`. Record the reaction on the tile (liked, disliked, must
remain, must change, undecided) before anything reaches the nine keys. The state mapping (normal, determined, hurt)
is still INFERRED and belongs in the same ask.

## Acceptance numbers for the judge (on every enabled key, 60 fps capture)

1. **No mixed frames.** `paint.from === null` in every frame, and the frame log counts 0 face parts drawn at partial
   opacity (only the low-pass tone map is exempt). Check the 15 s clip, a 1-degree sweep and every parameter ramp.
2. **Continuous curves.** Ramp each parameter from 0 to 1 over 2 s. The region box's frame-to-frame step stays at 2x
   its median or less and at 3 levels or less. The logged weights change by 0.06 or less per frame, except the
   3-frame blink close.
3. **Lids** match the baked frames within 2 levels at their eight apertures.
4. **Gaze.** Iris travel of at least +-16 px x and +-7 px y on the plate (5.9 and 2.6 percent of IPD); turned keys are
   foreshortened by the map. 0 iris pixels outside the window over the 9 x 5 x 4 gaze x aperture grid. Idle drift of
   3 +-1 px RMS, and no idle gaze speed above 0.49 IPD/s (the spec's 80 px/s saccade threshold scaled to IPD, which
   is 133 px/s here).
5. **Never still.** In a 15 s idle the mouth box's mean frame change is at least 3.5x the nose box's, and the brow is
   0.3 to 0.5x the mouth.
6. **Rest is exact.** With all weights at 0 and `?post=0`, the render is the plate to the pixel (MAD 0).
7. **No folds.** det(J) of the summed field stays in [0.5, 2.0] at every corner of the weight box (at most 512 combos)
   on every key.
8. **Throat and hair** as below; then the judge at 1:1, at least 7 on all four (expression against Until Dawn); then Bailey.

## Fix 1: the throat line (1 px, y 822-833, 132 of 412 frames)

**Cause (read in `shots/v51/tools/chain_face.py`, not yet reproduced).** The neck is a hard rectangle (x 356-636,
y 540-830) cut out of the body, and the two meet at y 830 with no overlap. The neck is drawn with the head (dense mesh
plus chest plus headW x sway); the body minus the neck is drawn with the body mesh. Any sub-pixel disagreement between
the two (chest sway, the 8 px grid against the body grid, the post pass's resample) opens a gap or a half-alpha row,
and the dark hairBack under the removed neck shows as a line. That fits the judge's finding that the line is absent
in the frozen `?post=0` sweep. **Confirm (10 min):** force a 0.5 px chest offset; the line should appear.

**Fix.** (1) Overlap, never butt: extend the neck 8 px below 830, feathered to 0 over 826-838, onto the body's
identical collar pixels. (2) Ease the neck's map to the body mesh's motion (chest plus sway) at the collar, not to
"none", so the two agree at the seam. (3) Only if a trace remains, put a cleaned-skin underlay in the body's bottom
12 rows of the rectangle, not higher, so hair still shows where the neck twists.

**Accept.** The judge's detector flags 0 frames of the clip with the post pass and body motion on. A chest sweep from
0 to 1 px in 0.1 px steps changes rows 815-845 by 2 levels or less.

## Fix 2: the far-side hair at +-30..40

**Symptoms** (v5.1 NOTES and the judge): at -40, a flat pink smear with a row seam near y 350; at +40, the hair is
washed out with less ink than the plate; at +30..40, a soft brown column behind the tassel (the footprint fill).
**Diagnose first (10 min):** compare the pushed key before the repaint with the pick in that box. If the smear is
already there, the cause is the stretch; if it appears after, it is the LoRA fill at denoise 0.45 with no structure.

**Fix, cheapest good option first.** **(a)** Prefill the hole with the plate's own strands, by patch synthesis guided
by the plate hair's orientation field (structure tensor, CPU). Then run the LoRA at denoise 0.30-0.35 with the plate's
hair crop as the reference, a 12 px feather and `merge`'s tone match: about 1.5 h and 3-5 GPU min. **(b)** Split the
far hair into its own layer that slides behind the silhouette instead of stretching: 2-3 h, and it changes the cut.
**(c)** Cap the live range at +-30 (the judge's alternative). This is the default until (a) passes, disclosed as
further from Until Dawn's 45 degrees.

**Accept.** In the hair box, gradient energy is at least 0.85x the plate's (same region, warped). The largest row-mean
step is at most 1.5x the median. The mean hue is within 6 degrees of the plate's hair. The 1:1 look is clean. The
+-30/+-40 cut's S stays at 1.5 or less.

## Order and owners

(1) Fix 1 (1 h, CPU). (2) The pilot (1 h). (3) The three option clips to Bailey (1 h). (4) After his pick: A on the
plate, then the chain `expr` step to all nine keys (5-7 h). (5) Fix 2 (a), or the +-30 cap. (6) An independent judge,
then Bailey; then the port, per the v5 method's port section.

Files: a scratch runtime at `D:/Tools/pyrefly-lora/yuna-x2/rig-v6/proto`; tools under `shots/v6/tools/`
(`expr_fit.py`, `eye_parts.py`, the `chain_grow.py` `expr` step), each under 400 lines; runtime `src/expr.ts`,
`src/eyes.ts` and the dense fragment stage; tests beside the 53 portrait tests (folds, oracle lids, never still, 0
partial-opacity face parts). Sonnet builds the shader and drivers; Opus fits the lattices and judges.
