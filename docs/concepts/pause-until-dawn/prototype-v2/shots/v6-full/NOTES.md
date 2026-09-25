# Living portrait v6 full: feel A2 on every turn key (2026-09-25)

**Game case: both.** The pause screen and its portrait runtime are shared plumbing (CHK-020). The rigged plate is
Yuna X-2. This is a **preview** and runs on the CPU only: 0 GPU, no download, and nothing under `src/`, `tests/`,
`critic/`, `public/art` or `approved-hashes.json` changed. The runtime ran from a scratch copy of the v5.1 scratch
prototype (`D:/Tools/pyrefly-scratch/picks0925/portrait-a2/proto`). Its changes are in `tools/proto-v6.diff`.

Bailey's pick (2026-09-25, through the driver): feel **A2**. Keep the eye lead and the smile, and no worried brow.
Method: `docs/plans/living-portrait-v6-method.md`, approach A, "Per key". Pilot: `../v6-pilot/PILOT.md` (283a6a2f).

## What was built

1. **The face is rendered once, on the plate, by the pilot's rig** (`rig6.py`, unchanged, feel A2), as the plate's
   front layer. Every key then samples it through its own map back to the plate: `cmap.npy` from v5.1's chain,
   `face6.py`. The method asked for the parts, curves and fields to be pushed through each key's map. Sampling the
   rendered face through the same map is that push, done once for all of them. The iris offset, the lid unroll, the
   brow fields, the mouth lattices and the open stage all ride the key's map, and the far eye foreshortens through
   the map's Jacobian. The face is always the plate's one painting. Nothing is cross-faded.
2. **Each key has a fixed soft mask.** The mask is the support of every weight (renders at the extremes and at every
   gaze corner, changes over 2 levels), closed, hole-filled, grown 6 px and eased out over 6 px. Inside it the face
   comes from the plate. Outside it the key keeps its own paint. The eyes, brows and mouth were never repainted
   (v5.1's protect mask), so at rest both sides of the mask edge are the same painting. Rest MAD in the feather:
   0.09-0.10 at +-10, 0.6-0.7 at +-20, 0.9-1.7 at +-30 and 1.3-2.3 at +-40, where the chain's four resamples
   soften the key.
3. **The runtime takes the face every frame.** In `?v6=1` the runtime's own lid frames, mouth and brow patches and
   frontal iris offset are off. A capture (`shots6.mjs`) advances the clock one frame at a time (`?manual=1`,
   `stepFrame`), with the real mouse, the real keys and the runtime's own head spring. Before each step it puts
   that frame's face into the painted key's front texture (`texSubImage2D`), plus the faceOver sub-rect on
   the keys that have one. Pass 1 logs the head yaw and the painted key. `turn6.py` computes the weights and the
   faces. Pass 2 replays and captures the page. The paint in pass 2 matched pass 1 on every frame (0 mismatches of
   1445).
4. **The frontal is one back and one front**, like every grown key. Rest, `?post=0`, against v5.1: max 1 level
   (52 px of 1,011,712).
5. **The gaze runs on the runtime's own head.** The eyes lead the input on their 0.05 s spring, and the head is the
   runtime's 0.14 s spring plus its idle wander. Eye-in-head is 1.0 px/deg x (eye - head) + 0.13 px/deg x head
   (v4's iris travel) + A2's fixation drift, clamped to +-16 x +-8 px. The eyes lead, then re-centre as the head
   arrives, and they hold still while the head wanders.
6. **No worried brow.** `browDraw` is never driven, so raise and draw are never on together. Everything else is
   preset A as it stood after pilot part 2: the idle floors, the swells, the rate limit and the blink timings.

## The clip's script (`clip.mp4`, 15 s, 60 fps, runtime seconds)

| Time (s) | What happens |
|---|---|
| 0.5 | A smile swells |
| 1.2 | A blink |
| 1.6 to 2.5 | A glance up-right to +14 and back (the eyes lead) |
| 3.0 to 4.3 | A turn to -40 |
| 4.6 | A blink |
| 5.0 | The brows lift |
| 5.6 to 6.4 | A glance at -40 |
| 6.9 to 9.1 | The full sweep to +40, with a blink at 7.9 mid-sweep, across the cuts |
| 9.3 | A smile at +40 |
| 10.9 | A step back to 0: the eyes lead by up to 11.6 px, and a blink comes with the big gaze shift |
| 11.7 | The brows lift |
| 12.4 | A smile |
| 13.2 | A blink |
| 14.1 | A half lid |

`compare.mp4`, left panel: v5.1's own half-speed panel (from `../v51/compare.mp4`). Right panel: v6 full on the same
input script (0 to +40 to -40 to 0, with a blink at each end), rendered at 50 fps and encoded at 25. v5.1 was
recorded in real time with capture latency, so its beats land a little later. The v6 panel holds its last frame
to the same length (27.7 s).

## Continuity numbers

| Check | v6 full | v5.1 (same stepped sweep) |
|---|---|---|
| Frames with two paintings | 0 of 900 (clip), 0 of 545 (compare), 0 of 162 (each sweep) | 0 |
| Cut S, 1-degree sweep, an expression held on every key (smile 0.7, open 0.6, lids 0.55, gaze +6/+2, brow 0.5), 16 cuts | head 0.86-1.32, face 0.93-1.18, largest non-cut 1.32 (gate 1.5); before the Fix 2 repair 0.89-1.32 / 0.95-1.19 / 1.28 | head 0.85-1.38 (at rest; v5.1 cannot hold an expression) |
| Same yaw, two keys (the hysteresis pairs), MAD in the eyes box | median 3.48, max 6.0 | median 3.72, max 5.99 |
| Same, in the mouth box | median 1.48 (l side 1.07-2.01) | median 1.90 (l side 1.42-2.45) |
| Same, in the jaw box | median 1.71 | median 1.75 |
| Same-yaw numbers at rest (v6) | equal to the expression-held ones within 0.1 | - |
| Cuts inside `clip.mp4` (20) | 16 measured. The eyes-box step over neighbours moving alike is 0.81-1.08, the mouth 0.84-1.11. 3 cuts fall in a blink. 1 is on the first frames of the big step, with no neighbour moving alike; looked at 1:1, it is clean | - |
| Weight change per frame (clip) | open 0.047, smile 0.036, press 0.018, brow raise 0.032, brow draw 0. The lids outside blinks change 0.049 (plan: 0.06 or less) | - |
| Gaze | x -9.6 to +11.3 px, y -2.7 to +1.9 px. The lead over the settled eye peaks at 11.6 px. The fastest idle step is 9.3 px/s (limit 133). The fastest step overall is the input-driven saccade at 10.9 s (424 px/s) | none |
| Throat line (`throat.py`, page scale) | **0 of 900 frames** after Fix 1 | 799 of 900 on the same capture before the fix |
| Far-side hair (Fix 2, `hair6.py`) | l40 gradient 1.00 (was 0.83), no row step, 0 teal pixels at +40 | see Fix 2 |

The mouth and jaw boxes read 7-10 at +24..+36 in both builds. That is the earring's swing lag reaching the boxes (up
minus down 6-10 px), not the face. The v5.1 judge saw the same thing.

## Fix 1: the throat line (done)

The line was in almost every frame of this capture with the post pass and body motion on. The cause is the one the
method named. The neck (drawn in the head's mesh) butted the pinned body at y 830, and any sub-pixel disagreement
showed the dark hair-back through the gap. Every key's neck, in both its front and its back, now runs 12 px further
down onto the body's own identical pixels (the neck's map is the identity at the collar) and eases out
(`face6.py collar`). The rest pose is unchanged: max 1 level against v5.1. The line is gone at 1:1 (`sheet.jpg`).
The method's second step, easing the neck's map onto the body mesh, was not needed.

## Fix 2: the far-side hair at +-30..40 (repair pass, done on the CPU)

The first pass disclosed this one and the judge refuted it: the brief asked for the fix if the defect recurred, and it
did (l40 0.83 against the 0.85 accept; at -40 a flat pink band with a row step, at +40 a teal smear by the tassel).
The repair stays on this track's CPU (0 GPU, no LoRA): `tools/hair6.py`, run in `regen.sh` right after the collar.
Everything was re-captured and re-encoded afterwards: `clip.mp4`, `compare.mp4`, `sheet.jpg` and every number in
this file are the repaired build.

**What was wrong.** The smear is the v5.1 chain, not the plate. Each grown key is the one before it pushed 10 degrees,
with its stretched holes repainted, so at -40 the far-side hair had been resampled four times and filled once "with
no structure". The front layer's shoulder hair also met the hair-back along a straight row at y ~600, from -20 on
(the step). At +40, the plate's teal rim glow sits beside the tassel at rest; as the head turns, the tassel moves away
and the stretched glow floats on the pink hair. Below it, the blurred footprint fill the tassel covers at rest shows.

**What was done.**

- **Left keys, far side (image right), -20, -30, -40: `warp`.** The region is redrawn from the plate through the key's
  own map (`cmap.npy`) in one resample. That is the same map every key's face already rides, so the strands sit
  where the chain put them, as crisp as one resample allows. Back and front get the same pixels, so the row step goes.
  The mask stays out of the face's support, the ornament, the neck and the silhouette, with a 10 px feather.
- **Right keys, far side (image left): `clean`.** The teal glow and its halo leave the low frequencies by inpainting.
  Its high frequencies are kept as luminance only, so the strands stay and the colour goes. The glow **fades a
  quarter per key**: r10 0.75, r20 0.5, r30 0.25, r40 0. The frontal plate is untouched, so no cut drops the glow in
  one step. At +30 and +40, the footprint column (the plate's own footprint mask pushed through the key's map) gets
  the key's own strands from beside it (a clone per 24 px band), laid over the inpainted tone.
- The faces the capture uploads each frame now start from these fronts (`face6.key_front` reads `v6/keys/<k>/front.png`).

**Numbers** (`measure6.json`, the method's hair boxes; the -40/+40 frames of the encoded `clip.mp4`, old against new):

| Check | Before (committed 85107767) | After | Accept |
|---|---|---|---|
| l40 gradient energy against the plate warped into the key | 0.83 | **1.00** | 0.85 or more |
| l30 / l20 | 0.91 / 0.90 | 1.00 / 0.995 | 0.85 or more |
| r20 / r30 / r40 (the hair box above; not repainted) | 1.00 / 1.02 / 1.00 | the same | 0.85 or more |
| Hue difference, every box | 0.2-1.3 degrees | 0.0-0.5 degrees | 6 or less |
| Row-step max over median, l30 / l40 (the plate warped reads 14.8 / 17.8) | 28.2 / 25.1 | **17.0 / 17.1** | see below |
| -40, frame 280: largest row-mean step across the seam (page px 490-612, y 570-620) | 8.4 levels | **4.4** | - |
| -40, frame 280: mean gradient of the far-side hair (page 470-612 x 330-560) | 10.3 | **12.2** | - |
| +40, frame 590: teal pixels on the far-side hair left of the tassel (page 110-300 x 480-660) | 968 | **0** | - |
| Cut S at +-30/+-40, expression held (gate 1.5) | head 1.24 / 0.95, face 1.12 / 0.98 | head 1.24 / 0.95, face 1.12 / 0.98 | 1.5 or less |

The l-side gradient ratio is 1.00 **by construction**: those pixels are now the plate warped once, which is what the
metric compares against. So the table also has plain measurements on the encoded frames. The row-step ratio cannot
reach 1.5 in this box, because the plate itself has painted horizontal edges there (14.8-17.8 when warped). The repair
brings l30 and l40 down to the plate's own level.

**Looked at, 1:1 and 2x** (`sheet.jpg`, last row, v6 against v5.1; clip frames 280 and 590; cut pairs 239/240,
259/260, 531/532, 548/549). At -40 there is no row step, and the pink hair has the plate's strokes. At +40 there is no
teal smear. The column beside the tassel reads as dark hair with strands, not a brown blur. The glow thins over the
turn, with no pop at any cut. What remains: the -40 pink band is still wide (it is the plate's own pink hair,
stretched by the turn), and the re-stranded footprint strands are a little busier than the plate's. The method's GPU
step (a LoRA pass at denoise 0.30-0.35 over this prefill, 3-5 min) would soften both. It is optional polish now, not
a defect. The +-30 cap is no longer needed.

## Looked at, 1:1

- **Eyes.** Every key blinks through the whole turn: closed at -40, mid-sweep at -5, in the big step at +20..+10.
  The half lid holds on all nine keys in the held-expression sweep. The irises move apart from the head: the glance
  at 1.6 s, and the big step at 10.9 s, where the eyes arrive first and the head follows.
- **Mouth.** The open smile plays at 0 and at +40, where it is foreshortened by the key's map. There is no double
  lip line.
- **Brows.** They lift on their own. They never draw.
- **Cuts.** At -34/-33, -4/-3, +6/+7 and +36/+37 with the expression held, it is one iris, one lash line, one
  mouth. The cut cannot be picked out.
- **faceOver.** Found and fixed during this build. The tassel-side cheek at yaw < 0 first showed the plate's jaw
  stroke, which is hidden under the tassel (the faceOver there was repainted). Its colour now comes from the new
  face only where it equalled the key's front at rest. At -1..-5 the cheek now matches v5.1 within 0.02 levels.

## Still open (for Bailey and the next step)

- Fix 2 is done on the CPU (repair pass). Optional polish: the method's LoRA pass over the repaired far-side hair
  (3-5 GPU min) would soften the busier footprint strands and the wide -40 pink band. It is not needed to ship the preview.
- The state mapping (normal, determined, hurt), a sad corner-down and a lower-lid raise are still INFERRED and not
  built.
- The port into `src/` (the method's "then the port"). This build runs through capture uploads. The runtime shader
  stage (`src/expr.ts`, `src/eyes.ts`) is not written.
- An independent judge has not been run.

## Files

- `clip.mp4`: 720 x 1200, H.264 High, yuv420p, faststart, 60 fps, 15.0 s, 4.2 MB.
- `compare.mp4`: 1080 x 900, 25 fps, 27.7 s, 3.4 MB.
- `sheet.jpg`: the numbers, the turn every 10 degrees with an expression held, four cuts at 1:1, clip moments at
  1:1, the throat before and after, and the far-side hair at +-40 beside v5.1.
- `tools/` (every file under 400 lines):

| File | What it does |
|---|---|
| `face6.py` | The front-layer rig, the support mask, the per-key sampler, the frontal as a key, Fix 1 (`collar`) |
| `hair6.py` | Fix 2 on the CPU: the far-side hair from the plate (l20-l40), the teal fade and the footprint column (r10-r40) |
| `turn6.py` | Feel A2 through the turn (gaze on the runtime's head, no brow draw), the per-frame faces and uploads, the frozen-weight sweeps |
| `shots6.mjs` | The browser passes on the stepped clock: `log`, `frames`, `sweep`, `rest` |
| `measure6.py`, `throat.py` | The numbers above |
| `make6.py` | The two MP4s and the sheet |
| `proto-v6.diff` | The scratch runtime's changes to the v5.1 scratch prototype's `src/` |
| `regen.sh` | Rebuilds everything, CPU only |

The v5.1 checks `../../v5-pilot/tools/sweep-metric.py` and `../v51/tools/cut_checks.py` were run read-only. The
scratch runtime, the logs and `measure6.json` stay in `D:/Tools/pyrefly-scratch/picks0925/portrait-a2/` (86 MB after the repair pass, with the repaired keys and `hair6/orig`; not
committed). The captured frames and sweeps (2.2 GB) were deleted after encoding; `regen.sh` rebuilds them. The
scratch Vite server on port 5720 was stopped (after the first build and again after the repair pass).

## Independent judge (2026-09-25, a separate agent that built none of this)

*(This judged commit 85107767, before the Fix 2 repair pass above. Its Fix 2 finding was refuted and then repaired;
the sheet is now 2000 x 3602.)*

Checked at 1:1 from the committed files, not from the build's report. **Score 7.5 / 10, above the bar of 7.**
**Worst: the far-side hair at -40 and +40** (the flat pink band with a step on the image right at -40, and the soft,
teal-tinged smear beside the tassel at +40). It is unchanged from v5.1 and disclosed; l40 reads 0.83 against the 0.85
accept in `measure6.json`. The brief's Fix 2 is therefore **not met**. Cap at +-30 or run the GPU pass (Bailey's call).

- **Files.** `clip.mp4` 720x1200, H.264 High, yuv420p, 60 fps, 900 frames, 15.0 s, 4.2 MB, moov before mdat (faststart).
  `compare.mp4` 1080x900, 25 fps, 27.7 s, 3.4 MB, faststart. Both are under 8 MB. `sheet.jpg` 2000x3462.
- **One painting per frame.** Pass-2 log: 20 cuts in the clip, 0 frames with a blend weight other than 0 or 1.
- **Cuts at 1:1** (frames 100/101 at +7, 259/260 at -37, 548/549 at +37, 654/655 at +31, and the big step 658/668):
  one iris, one lash line, one mouth on both sides of every cut. The eyes arrive before the head at the big step
  (the A2 eye lead). The smile at 0 and at +40, the blink at -40 and mid-sweep, and the half lid all read cleanly. The
  brows lift and never draw together, so there is no worried brow.
- **Sweep numbers** (`sweep-metric.txt` in the scratch folder, re-read): head S 0.89-1.32, face S 0.95-1.19, max non-cut
  1.27/1.28, 0/81 mixed frames per direction. This matches the claim (gate 1.5).
- **Fix 1, the throat line, confirmed on the encoded output.** `tools/throat.py` run by the judge on all 900 decoded
  frames of `clip.mp4`: 0 flagged (longest run 17 px against the 40 threshold). The same detector on v5.1's `clip.mp4`
  flags 202 of 412 frames (a positive control). Nothing shows at 1:1 in the -40 frame (280).
- **Locks.** `docs/target/approved-hashes.json`, re-hashed by the judge: 185 entries, 185 match, 0 mismatch, 0 absent. The build's
  count of "31 absent" does not reproduce now; later lock commits may explain it. (Repair pass: explained. The 31 are
  the sets' metadata keys, `words` and `note`, which were counted as files. Counting file entries only: 185 match,
  0 mismatch, 0 absent, both before and after the repair. The repo has no `verify-approved` tool, so the check is a
  sha256 re-hash of every file entry.) This track changed nothing
  under `public/art`, so it needed no backup; `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-picks/` exists.
- **Minor.** The v5.1 panel in `compare.mp4` runs behind v6 by a beat, as disclosed. The port into `src/` is not written.
