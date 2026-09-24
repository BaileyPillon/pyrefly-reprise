# Living portrait v5.1: the v5 pilot's four failures, fixed and measured (2026-09-24)

Game case: **both**. The pause screen and the portrait runtime are shared plumbing. The rigged plate is Yuna X-2
(FFX-2), the only one rigged so far. This is a PREVIEW: nothing under `src/`, `tests/`, `critic/`, `public/art` or
`approved-hashes.json` changed. The runtime ran from a scratch copy of the prototype
(`D:/Tools/pyrefly-lora/yuna-x2/rig-v51/proto`). Its changes to the prototype's `src/` are in `tools/proto-scratch.diff`:
the pilot's hard cut and body blend, plus a debug-only "replace the running mouth event" used by the clip's two
forced smiles.

Method: `docs/plans/living-portrait-v5-method.md` option (d). Pilot: `../v5-pilot/PILOT.md`. Judge: `../v5-pilot/JUDGE.md`.

## The judge's four failures

| Judge (v5 pilot) | Cause, found by taking a key apart layer by layer | v5.1 |
|---|---|---|
| (1) No blink on any grown key | The grown keys had no lid frames (`keyLids` empty in the pilot rig). | Each key gets the plate's own 8 lid frames, 4 mouths and 2 brows, pushed through the same map as the key at every step (`chain_grow.py`). Every key blinks and smiles: see `sheet.jpg`, bottom block. Of the 14 patches, the eyes, brows and mouth are never repainted (the repaint mask leaves them out), so each lid still fits the eye under it. |
| (2) The tassel "jumps 4-6 px at every cut" | **It does not jump at the cuts.** Tracked frame by frame, the step at a cut frame is 1.0-3.2 px against 2.4 px median and 3.1-3.4 max away from cuts. The 4-12 px the judge measured is up minus down at the same yaw, and that difference is just as large where the painting is the SAME (median 10.9 px, n 57): the earring's loose swing lags the head in each direction. In the pilot its offset was also not tied to the painting (v4's jaw-corner dx, 14.5 px at +10, while the painting under it moved 27 px). That exposed the blotchy underfill beneath it. | The tassel is pinned to the head's rig transform: its anchor (the top of the earring) is carried by the same meshes as the key, dx = +26.9 / +53.8 / +84.2 / +114.6 and -9.5 / -19.1 / -41.1 / -63.1 px at 10-40 degrees. The underfill under it, a leopard-spotted smear in the plate's hair-back, is filled from the surrounding hair (CPU). A LoRA prompt tried first painted a second tassel into the hole in all 6 candidates, so none was used. |
| (3) Ghost jaw from about +8 to +20 | The plate's lower jaw ink and the grey under-face underpaint are in the pinned **body** layer. The face's edge moves, but the body's copy of the jaw stays put: two contours. | The neck is a separate layer: the body inside the collar, side contours included, from y 540 to 830. It rides the head's own map down to the chin (y 770) and eases to no motion at the collar (y 830). The jaw ink stays on the face and the neck twists. Rest: body minus neck, plus neck, equals the plate body exactly (max diff 0). A first try, a 30 px chin band over a cleaned neck, left a pale strip and loose contour ticks from +16. It was dropped. |
| (4) Range only +-20: "a flat slide" | - | Grown to **-40..+40** every 10 degrees. The +-30 and +-40 keys are pushed through the v4.1 pairs `v4-r20\|v4-r40` and `v4-l40\|v4-l20`. Each passed the cut gate before the next was grown. |

## Numbers

**Cuts** (1-degree sweep, -40 to +40 and back, frozen clock, `?post=0`, `sweep-metric.py`). S is the head-box step at
the cut divided by the median 1-degree step. The gate is S <= 1.5.

| | Result |
|---|---|
| S, up (8 cuts) | -34/-33 1.10, -24/-23 1.19, -14/-13 0.82, -4/-3 1.02, +6/+7 1.32, +16/+17 1.12, +26/+27 1.05, +36/+37 0.91 |
| S, down (8 cuts) | +34/+33 0.94, +24/+23 1.04, +14/+13 1.05, +4/+3 1.34, -6/-7 1.06, -16/-17 0.86, -26/-27 1.23, -36/-37 1.13 |
| Largest step away from a cut | 1.21 up, 1.23 down |
| Frames with two paintings | 0 of 162 in the sweep. 0 of 353 logged in `clip.mp4`. 0 of 599 in the v5.1 half-speed turn (v4.1: 69 of 600 in the same turn) |
| Pure swap at the same yaw, head MAD | 3.5-8.0. The same painting both ways gives a floor of 2.9 median and 7.5 max. The face regions are 0.5-3.7 except where the tassel's swing lag overlaps a box: at +/-34..36 the mouth and jaw boxes read 7.8-8.6, and the 1:1 difference shows only the tassel. Yaws 16 and 24-26 are skipped: one pass caught an idle half-lid there, which is a runtime blink on the grown keys, not paint. |
| Rest pose (`?post=0`, no motion) | Identical to the pilot's and v4.1's rest renders within 1 level (4 px and 497 px differ by 1) |

**Growth per key.** Push hole = pixels the push cannot carry (stretch outside 0.7-1.3, uncovered, forward-backward
error), as a share of the head. Repainted = the LoRA mask actually used: magnified pixels only, grown 8 px, eyes,
brows and mouth left out, and never behind the neck.

| key | push hole | repainted | pick (6 candidates each) |
|---|---|---|---|
| r10 / l10 | 0.1 / 1.1 % | 0.7 / 2.2 % | pilot's d45 s1 / d45 s2 |
| r20 / l20 | 9.6 / 13.7 % | 12.1 / 14.8 % | pilot's d45 s1 / d45 s2 |
| r30 / l30 | 22.2 / 23.3 % | 17.4 / 18.2 % | new d45 s2 / d45 s1 |
| r40 / l40 | 20.8 / **26.8 %** | 8.5 / 18.6 % | new d45 s1 / d45 s2 |

The method's 20 % hole gate is written for the push. From +-30 the push exceeds it: most of the excess is
compressed far-side pixels, which lose no paint. l40 is over the 25 % line the method set for +10 (a different step).
The repainted share stays under 20 % on every key. This is a disclosed reading of the gate, not a pass by the letter.

**GPU**: 5 prompts, 262.8 s (4.4 min of the 20 min cap), one at a time after 3 quiet minutes each, ComfyUI never
restarted. One of the 5 (the tassel footprint, 56.1 s) was not used.

## Looked at, at 1:1

- **Cuts**: across all 16 cuts, one iris, one lash line and one jaw contour. The cut cannot be picked out
  (`sheet.jpg`, middle block).
- **Jaw**: clean from -40 to +40. In `compare.mp4` the pilot still shows its ghost jaw at +20, and v5.1 does not at
  the same moment.
- **Blinks and smiles** in `clip.mp4`: closed at -40, twice at +40 with the smile at 0.9, and at 0 with the smile.
  An idle slight smile also plays at -33..-40. Frames were checked in the extracted strips.
- **Still wrong, disclosed**:
  - At -40 the far-side hair (image right, above the ear) has a flat pink stretched area with a horizontal texture
    seam at about y 350.
  - At +30..+40 the hair behind the tassel is a soft brown column: the footprint fill.
  - At +16..+30 a thin pale neck edge shows under the jaw corner beside the tassel. It is much smaller than the
    pilot's grey band.
  - The half-lid frame `lid-08` is still about 40 % open. That is the existing v3.2 frames, unchanged.
  - A magnified protected eye at +-30..40 is slightly softer than its neighbours.
  - Expression is still discrete patch states (4 mouths, 2 brows, lid frames), not Until Dawn's continuous
    performance. The judge's item 4 asks for its own options round (end state first).
- Turn range: +-40 against Until Dawn's measured 45 or more. Phase 2 (+-50..80) is not started.

## Files

- `clip.mp4`: 720 x 1200, H.264 yuv420p faststart, 25 fps, 16.5 s, legend hidden. It follows the v4 clip's beats
  over the full -40..+40: a blink at -40, a smile and blink at +40, then a blink and a smile at 0.
- `compare.mp4`: v4.1 as committed | v5 pilot | v5.1. The same input turn (0 -> +40 -> -40 -> 0, a blink at each
  end) at half speed. 3 x 540 x 900, 27.7 s, 6.5 MB. The pilot's rig stops at its own +-20.
- `sheet.jpg`: the turn every 4 degrees, 1:1 crops either side of all 8 up-sweep cuts with S, the numbers, and every
  key's open / closed / smile.
- `tools/`:

  | Script | What it does |
  |---|---|
  | `chain_core.py`, `chain_face.py`, `chain_grow.py`, `chain_rig.py` | The pilot's 476-line `rig-chain.py`, split, every file under 300 lines |
  | `regrow.sh` | Rebuilds the whole chain from the picks, CPU only |
  | `chain-repaint.mjs` | The LoRA repaint |
  | `shots.mjs` | Sweep, stills, clip and half-speed recordings |
  | `cut_checks.py` | Tassel track and same-yaw swap checks |
  | `make_videos.py`, `make_sheet.py` | Build the videos and the sheet |
  | `proto-scratch.diff` | The scratch runtime's changes to the prototype's `src/` |

  The work files are in `D:/Tools/pyrefly-lora/yuna-x2/rig-v51/` (keys, candidates, the scratch prototype and its
  `art/rig.json`), not committed.

Next, for Bailey (end state first): compare.mp4 and clip.mp4. Record his reaction on the tile before phase 2 or the
port. The expression mapping by member state (normal / determined / hurt) is still INFERRED and has not been asked.
