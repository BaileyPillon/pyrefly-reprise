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
| Cut S, 1-degree sweep, an expression held on every key (smile 0.7, open 0.6, lids 0.55, gaze +6/+2, brow 0.5), 16 cuts | head 0.89-1.32, face 0.95-1.19, largest non-cut 1.28 (gate 1.5) | head 0.85-1.38 (at rest; v5.1 cannot hold an expression) |
| Same yaw, two keys (the hysteresis pairs), MAD in the eyes box | median 3.48, max 6.0 | median 3.72, max 5.99 |
| Same, in the mouth box | median 1.48 (l side 1.07-2.01) | median 1.90 (l side 1.42-2.45) |
| Same, in the jaw box | median 1.71 | median 1.75 |
| Same-yaw numbers at rest (v6) | equal to the expression-held ones within 0.1 | - |
| Cuts inside `clip.mp4` (20) | 16 measured. The eyes-box step over neighbours moving alike is 0.81-1.08, the mouth 0.84-1.11. 3 cuts fall in a blink. 1 is on the first frames of the big step, with no neighbour moving alike; looked at 1:1, it is clean | - |
| Weight change per frame (clip) | open 0.047, smile 0.036, press 0.018, brow raise 0.032, brow draw 0. The lids outside blinks change 0.049 (plan: 0.06 or less) | - |
| Gaze | x -9.6 to +11.3 px, y -2.7 to +1.9 px. The lead over the settled eye peaks at 11.6 px. The fastest idle step is 9.3 px/s (limit 133). The fastest step overall is the input-driven saccade at 10.9 s (424 px/s) | none |
| Throat line (`throat.py`, page scale) | **0 of 900 frames** after Fix 1 | 799 of 900 on the same capture before the fix |

The mouth and jaw boxes read 7-10 at +24..+36 in both builds. That is the earring's swing lag reaching the boxes (up
minus down 6-10 px), not the face. The v5.1 judge saw the same thing.

## Fix 1: the throat line (done)

The line was in almost every frame of this capture with the post pass and body motion on. The cause is the one the
method named. The neck (drawn in the head's mesh) butted the pinned body at y 830, and any sub-pixel disagreement
showed the dark hair-back through the gap. Every key's neck, in both its front and its back, now runs 12 px further
down onto the body's own identical pixels (the neck's map is the identity at the collar) and eases out
(`face6.py collar`). The rest pose is unchanged: max 1 level against v5.1. The line is gone at 1:1 (`sheet.jpg`).
The method's second step, easing the neck's map onto the body mesh, was not needed.

## Fix 2: the far-side hair at +-30..40 (not fixed, disclosed)

The diagnosis is the method's 10-minute check. The smear is already in the push before any repaint: compare
`warp.front.png` and `warp.hairback.png` with the pick in the key folders. So the cause is the stretch, not the
LoRA fill. The method's fix (a) needs a LoRA pass (3-5 GPU min), and this track is CPU only. Fix (b) changes the cut.
The keys' hair is unchanged from v5.1. The numbers in the method's hair box, with the key against the plate warped
into it:

| Key | Gradient energy vs the plate (accept 0.85 or more) | Hue difference |
|---|---|---|
| l20 | 0.90 | 0.9 degrees |
| l30 | 0.91 | 0.7 degrees |
| l40 | **0.83** | 1.3 degrees |
| r20 | 1.00 | 0.5 degrees |
| r30 | 1.02 | 0.3 degrees |
| r40 | 1.00 | 0.2 degrees |

The row-step ratio does not work as a test here: this box has painted horizontal edges, and even l20 reads 9.4 on
it. Seen at 1:1: at -40 the flat pink band with the step at y ~350 is still there, and at +40 the far hair is soft.
The method's default until (a) passes is the +-30 cap. This build keeps +-40 because the brief asked for every
v5.1 key.

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

- Fix 2 (a) needs about 3-5 GPU minutes. The alternative is the +-30 cap.
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
| `turn6.py` | Feel A2 through the turn (gaze on the runtime's head, no brow draw), the per-frame faces and uploads, the frozen-weight sweeps |
| `shots6.mjs` | The browser passes on the stepped clock: `log`, `frames`, `sweep`, `rest` |
| `measure6.py`, `throat.py` | The numbers above |
| `make6.py` | The two MP4s and the sheet |
| `proto-v6.diff` | The scratch runtime's changes to the v5.1 scratch prototype's `src/` |
| `regen.sh` | Rebuilds everything, CPU only |

The v5.1 checks `../../v5-pilot/tools/sweep-metric.py` and `../v51/tools/cut_checks.py` were run read-only. The
scratch runtime, the logs and `measure6.json` stay in `D:/Tools/pyrefly-scratch/picks0925/portrait-a2/` (48 MB, not
committed). The captured frames and sweeps (2.2 GB) were deleted after encoding; `regen.sh` rebuilds them. The
scratch Vite server on port 5720 was stopped.

## Independent judge (2026-09-25, a separate agent that built none of this)

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
  count of "31 absent" does not reproduce now; later lock commits may explain it. This track changed nothing
  under `public/art`, so it needed no backup; `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-picks/` exists.
- **Minor.** The v5.1 panel in `compare.mp4` runs behind v6 by a beat, as disclosed. The port into `src/` is not written.
