# Living portrait v6 pilot: continuous expression and gaze (2026-09-24)

Game case: **both**. The pause screen and its portrait runtime are shared plumbing (CHK-020); the rigged plate is
Yuna X-2. This is a **preview**: nothing under `src/`, `tests/`, `critic/`, `public/art` or `approved-hashes.json`
changed. CPU only, **0 GPU**, no download. Method: `docs/plans/living-portrait-v6-method.md` (b2dfd738), approach A,
"The pilot" section, on the original painting at yaw 0 only (no chain, no turn). The v5.1 judge's expression
finding (`../v51/JUDGE.md`, expression 5) is what this pilot answers.

**Verdict: keep A, per part, with two changes the pilot forced.** Every face pixel comes from one painting at
every moment; nothing is cross-faded; every parameter is a continuous 0..1 weight. For Bailey: three 8 s clips
(below) to pick a feel from, beside `../v51/clip.mp4`. Nothing reaches the nine keys until Bailey picks (rule 9).

## The plan's keep / kill tests

| Part | Plan's test | Measured | Verdict |
|---|---|---|---|
| **Lids** | the port matches all 8 baked frames within 2 levels (eye-box MAD); a 1 -> 0 ramp in 120 frames has no step above 2x the median | **0.001-0.040** levels (max pixel 0.9 = the PNGs' own rounding). Ramp in *visible openness*: **1.55x**. Ramp in the baked frames' own aperture labels: 3.06x, all of it at a = 0.08 -> 0 | **Keep.** The port is exact. The 3.06x is the baked frames' labels, not the port: lid-08 is still 26 % open, so 26 % of the eye shuts between a = 0.08 and 0. The drivers speak in visible openness through a lookup table (`rig6.vis_to_port`), which keeps the 8 frames exact at their own apertures. v5.1's nearest-frame switch on the same ramp: 8 jumps of up to 12.6 levels, zero between them |
| **Gaze** | at least +-12 px x, 0 escaped pixels, no smear from the socket fill at the extremes | **+-16 x +-8 px** reached; **0** iris pixels outside the window over 9 x 5 gaze x 4 apertures. The existing fill (the headCore underfill) **smears**: 44 % of the revealed socket is darker than the plate's sclera 5th percentile, a dark ghost iris at +-16 | **Keep, with the plan's own kill branch taken:** the socket is re-filled geometrically (CPU, 16 % dark, most of it the iris outline's edge), no GPU repaint needed |
| **Mouth** | smile and press at w = 1 within 8 levels of their paintings (kill above 12), det(J) in [0.6, 1.6], no visible stretch | Smile **6.44** (the plate itself is 9.13), det(J) **0.96-1.49**, step 1.02x median. Press **3.63** (plate 3.84), det(J) 0.91-1.08, step 1.17x. The plan's literal test, one 7 x 5 lattice warp-only: smile **9.05**, i.e. no smile at all | **Keep A for the mouth, only with the `open` stage** (below). A warp alone cannot make this smile: the painted smile is an open mouth. Fallback B is not needed |

What the pilot changed against the plan's text:

1. **The lid needs a rim hand-off above 0.85.** The baked lid-85 already replaces the plate's heavy lash rim with
   the closed painting's thinner lash line and crease; the v5.1 runtime switched to it at a = 0.925. Here, from
   a = 1 to 0.94 the plate's own rim slides down (the skin above it stretches 6 px at most), and from 0.94 to 0.85
   a top-down edge hands the rim to the closed painting (a moving 3 px seam, not an opacity mix). Gaze droop uses
   the sliding rim only, so looking down never changes the lid's look.
2. **The mouth has an `open` stage.** Per column of the mouth, like the lid unroll: the lips part (upper lip to the
   painting's upper lip line, lower lip down by up to 21 px, the chin easing over 55 px) and the gap shows the
   smile painting's own interior, compressed into it. The 7 x 5 lattices then carry what is left (at most 1.3 px for
   the smile, 2.9 px for the press).

## Acceptance numbers (the plan's list, the pilot's share)

| # | Plan | Pilot |
|---|---|---|
| 1 | no mixed frames, 0 face parts at partial opacity | By construction: no stage has an opacity; the lid, eyeball, brow and mouth are one painting per pixel. Seams: the lid hand-off edge (3 px), the baked lid method's own soft top (4 px) and lash-band bottom (2 px), the mouth gap's 1 px pixel coverage |
| 2 | ramps: region step <= 2x median and <= 3 levels; weights <= 0.06 a frame except blinks | Lid ramp 1.55x (visible) with max 1.34 levels; droop 1.08x; mouth 1.02x / 1.17x. Weights in the clips: at most **0.059** a frame (B's `open`; A 0.051, C 0.019); the lids 0.011 outside blinks and half blinks |
| 3 | lids match the baked frames within 2 levels | 0.001-0.040 |
| 4 | gaze +-16 x +-7 px; 0 escaped; idle drift 3 +-1 px RMS; no idle gaze step above 133 px/s | +-16 x +-8, 0 escaped. Idle drift **2.3 px RMS** (A; C 1.2; B's holds include its glances). Fastest idle gaze step **8.2 px/s** (C 4.4); the input's look peaks at 200 px/s on the eyes' 0.05 s spring, which is input, not an idle saccade |
| 5 | idle mouth box >= 3.5x the nose box; brow 0.3-0.5x the mouth | **Not met**: mouth over nose **1.33 / 1.55 / 1.24** (A / B / C), brow over mouth **3.4 / 2.7 / 3.6**. The painting's brow is high contrast (a 1 px move reads like 3 px of lip) and the stand-in head sway moves every box; the mouth's noise has to be sized against the runtime's own sway in the build |
| 6 | rest exact | MAD **0** with every weight 0 (the plate to the pixel); every parameter at 1e-4 is within 0.24 levels of the plate (continuous at rest) |
| 7 | det(J) in [0.5, 2.0] at every corner of the weight box | Mouth lattices 0.89-1.17 at every corner, open 0.96-1.49 (the gap excluded, where the interior is compressed on purpose). Brow raise 0.50-1.53, draw 0.62-1.78; **raise and draw both at 1 fold to 0.39-2.18** (never driven together here; the build needs a joint rule, e.g. one signed brow axis) |
| 8 | throat and hair | Not in the pilot: the plan runs Fix 1 before it and Fix 2 after Bailey's pick. The pilot is frontal with no neck layer, so these clips cannot show the throat line |

## The three clips (for Bailey to pick from, beside `../v51/clip.mp4`)

720 x 1200, H.264 High, yuv420p, faststart, 60 fps, 8.0 s, the same framing as `../v4/living-portrait-v4.mp4`
(the 832 x 1216 canvas at 512 x 748 from (104, 228), legend hidden, the runtime's post pass without grain).
All three share the rig, a small head sway, and the same input: she looks to her left at 2.0 s and back at 5.2 s
(the eyes arrive in about 0.15 s on their 0.05 s spring, the head follows on its 0.14 s spring and the eyes
re-centre by 30 %). The pilot has the frontal painting only, so the head drifts and tilts but does not turn.

| Clip | Feel | What happens |
|---|---|---|
| `clip-A-measured.mp4` (1.9 MB) | Until Dawn's numbers | Fixation drift (2.3 px RMS), no idle saccades, the eyes leading the input. An open smile swells at 0.6 s (400 ms in, about 2.8 s out), a brow lift at 3.3 s, a concerned press with drawn brows at 6.1 s. Full blinks at 1.45 and 6.05 s (50 / 33 / 66 ms), a half blink at 3.85 s, a slow narrowing at 7.0 s |
| `clip-B-livelier.mp4` (1.9 MB) | livelier | As A, plus two idle glances (right-up at 0.75 s with a small blink, left-down at 6.25 s with a half blink), three bigger smiles (0.35, 2.9 and 6.3 s, the last to 0.95) and a strong brow lift at 4.4 s; two full blinks (2.35, 4.75 s) besides the two small ones; 1.2x the noise on every weight |
| `clip-C-quiet.mp4` (1.5 MB) | quiet | Smaller and slower: drift 1.2 px RMS, swells 600 ms in and 3.6 s out at 0.6x, one soft smile (1.0 s), one brow lift (5.4 s), one blink (3.1 s), one half lid (6.3 s) |

`sheet.jpg`: the numbers, the lids at 1:1 (visible openness 1 to 0), the gaze extremes at 1:1 (and one on the old
fill, for the smear), the mouth opening to the painted smile at 2x, and six moments of each clip at 1:1.

Ask Bailey, and record on the tile (liked / disliked / must remain / must change / undecided): which feel, how far
the eyes should lead the head (not measurable in the footage, spec section 12), and whether the smile should open
this much. Still INFERRED and not built: a sad corner-down, a lower-lid raise, the state mapping (normal,
determined, hurt).

## Found and disclosed

- **The baked lids' look.** From lid-85 down the rim is the closed painting's thinner lash line and a crease
  (the v4.1 frames, unchanged); a slow half lid shows the hand-off. Her left (blue) eye's closed painting
  (`frontal.lidsB.c4`) has a blue sliver at the lid's top-left from lid-42 to lid-08: it shows mid-blink.
- **The slight smile.** The slightSmile painting differs from the plate by paint (highlight shapes), not by
  geometry: its own lattice moves 0.55 px. As a low weight of the smile it opens the lips a little instead (mouth
  box 4.8 at w 0.2, against 4.1 for the plate).
- **The press** is also mostly paint: its lattice moves at most 2.9 px and it barely reads.
- **The catchlight** moves at 0.3x the iris, as the plan says; at +-16 px it lags onto the iris edge and the sclera.
- **The iris** is cut at a fitted ellipse; its part hidden under the rims and the iris under the catchlight are
  interpolated around the ellipse. The lids droop 0.8 px per px of downward gaze, so the hidden top barely shows.
- **Never still (5)** is not met, see the table; this is a sizing question for the build, not a method one.
- **Brow raise with draw** folds at both = 1 (7).
- **The head** is a smooth warp above the collar (translation and a roll of at most about 1 degree), identical in
  the three clips; it stands in for the runtime's sway and its turn.

## Files

- `clip-A-measured.mp4`, `clip-B-livelier.mp4`, `clip-C-quiet.mp4`, `sheet.jpg`
- `tools/` (each under 400 lines; `regen.sh` rebuilds everything, CPU only, scratch on D:):

  | Script | What it does |
  |---|---|
  | `lid_extract.py` | Calls `tools/gen/rig-lids2.py`'s own functions (read-only) and saves the per-column lid curves and both closed paintings |
  | `eye_parts.py` | The eyeball parts: disc, catchlight (exactly un-composited), socket re-fill, window |
  | `expr_fit.py`, `mouth.py` | The mouth: the `open` columns, the 7 x 5 lattices (robust fit to DIS flow), the headCore mouth stage |
  | `rig6.py` | The CPU reference of the shader: headCore warp (brows, mouth), eyeball, lids at any aperture, the visible-openness table |
  | `drivers.py` | Band noise, swells, blinks, half lids, gaze springs, the three presets |
  | `pilot_lids_gaze.py`, `pilot_mouth.py`, `pilot_clips.py` | The measurements above |
  | `make_clips.py`, `make_sheet.py` | The clips and the sheet |

  The work files (`lids.npz`, `eyes.npz`, `mouth.npz`, logs, JSONs) were in `D:/Tools/pyrefly-scratch/lp-v6/` and
  are deleted; `regen.sh` rebuilds them from `D:/Tools/pyrefly-lora/yuna-x2/rig-v51/proto/art` and the v4.1 closed
  lid picks in `D:/Tools/pyrefly-lora/yuna-x2/rig-v41/`.

Next (the plan's order): Fix 1 (the throat line) can run now; after Bailey's pick, A on the plate in the runtime,
then the chain's `expr` step to all nine keys, then Fix 2 or the +-30 cap, then an independent judge.
