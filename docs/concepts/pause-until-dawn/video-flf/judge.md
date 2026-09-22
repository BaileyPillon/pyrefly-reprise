# Judge pass — Wan 2.1 FLF2V round 2 (independent of the generator)

**Judge:** a separate sub-agent from the one that built `tools/gen/video-flf.mjs` and
queued the render. **I rendered no clip.** I waited for the generator's detached job to
finish, then measured it with my own script, my own crop boxes pinned off the plate, and
my own eyes at 1:1. I did not use `tools/gen/join_report.py` (see §2 for why). Motion
reference: `docs/plans/pause-living-portraits-motion-spec.md`. Identity reference:
`public/art/pause/yuna-ffx2.png` + `.json`.

**The rule this pass exists to enforce** (Bailey, 2026-09-21, on round 1's stitched
preview: *"there is absolutely no continuity whatsoever"*): nothing with a visible join
is ever shown.

---

## Verdict

**FAIL. Nothing is picked; nothing may be shown to Bailey from this pass.**

| | |
|---|---|
| Clips rendered | **1** of 9 (`idle-breathing` seed 1), finished in **71.8 min** |
| Clips passing | **0** — required: 3 including one idle |
| Why it fails | **JOIN-LAST.** The clip does not return to the plate. Its mouth is *still moving* on the final frame |

**But this is not round 1 again, and the difference matters.** Round 1's clips drifted
bodily away from the plate — a shift+scale search cut their frame-121-vs-frame-1 face MAD
only from ~88 to ~74, i.e. a real camera push-in. **Round 2 has no drift at all:** a ±8 px
shift search on this clip returns `dx=0, dy=0` with **0 % of the error explained by
translation**. Pose, framing, background, body and both iris colours are pinned. The face
MAD across the seam fell from round 1's **~88 to 4.55** — about **19x better**.

The FLF route works. It fails on one specific, located, fixable thing.

---

## 1. The defect, precisely

The generator's central claim — repeated in `README.md`, `status.json` and the tool header
— is that with `start_image` and `end_image` both set to the plate, *"frame 1 and the last
frame are pinned by construction, not by hoping."* **That is not what the node does.**
I read `comfy_extras/nodes_wan.py`.

**(a) It is conditioning, not replacement.** `WanFirstLastFrameToVideo` only sets
`concat_latent_image` / `concat_mask`. The output frames come from
`VAEDecode(KSampler(...))` — the plate's pixels are never written back. Frame 1 and frame
81 are *predictions conditioned on* the plate, free to deviate.

**(b) The end anchor is 4x weaker than the start, and it points at padding.** With
`length=81` the node builds 21 latent frames and an **84-slot** mask, then:

```python
mask[:, :, :start_image.shape[0] + 3] = 0.0   # start -> slots 0,1,2,3
mask[:, :, -end_image.shape[0]:]      = 0.0   # end   -> slot 83 only
```

| Unmasked ("known") slot | Latent frame | Pixel frame |
|---|---|---|
| 0, 1, 2, 3 | 0 | 0,1,2,3 — **real** |
| 83 | 20 | **phantom** — past the 81 real frames |

The last *real* pixel frame is index 80, at slot 80 — and **slot 80 stays masked.** The
start gets four aligned real anchors; the end gets one that points past the end of the
footage. This is upstream ComfyUI behaviour, not the generator's bug.

**(c) The measurement confirms the prediction exactly.** Mouth MAD against the plate
(VAE floor for that box = 1.92):

| frame | f1 | f2 | f3 | … | f75 | f77 | f79 | f80 | **f81** |
|---|---|---|---|---|---|---|---|---|---|
| mouth MAD | 3.03 | 2.86 | 2.88 | | 28.81 | 6.49 | 4.67 | 4.34 | **4.24** |
| × floor | 1.6 | 1.5 | 1.5 | | 15.0 | 3.4 | 2.4 | 2.3 | **2.2** |

The start is **settled and flat** at 1.5–1.6x floor. The end is at **2.2x floor and still
falling** — the clip runs out of frames mid-return. A large mouth event at f73–f77 leaves
only ~4 frames to get home, and it does not get there.

Correlation of each frame's deviation with the pure VAE-floor pattern tells the same
story: **f1 = 0.79** (mostly unavoidable codec softening) but **f81 = 0.57** (much more
independent model drift).

---

## 2. Method, and a metric I rejected

`tools/gen/join_report.py` defaults its face box to 30–70 % width / 15–48 % height — on
this frame that is x 384→896, and her head ends near x 730. **About a third of that box is
pinned background**, trivially easy to reproduce, which drags the reported face MAD down
and would flatter a drifting face. I used a head-only box and added
max-absolute-difference and the 99.9th percentile inside an eye box, which that script
does not compute — a *mean* cannot catch a recoloured iris covering 0.2 % of the frame,
and a recoloured iris is exactly what killed round 1's `turn-left-and-back`.

**I also measured the noise floor, which nobody had.** The bar is "identical within
noise", but "noise" was never defined. I queued a bare
`LoadImage → VAEEncode → VAEDecode → SaveImage` on the Wan VAE (core nodes, seconds of
GPU, queued *behind* the running clip). **No FLF clip can score better than this floor:**

| box | VAE floor | f1 vs plate | f81 vs plate | seam f81→f1 |
|---|---|---|---|---|
| face | 3.85 | 5.23 | 5.75 | 4.55 |
| eyes | 4.70 | 6.11 | 6.63 | 5.95 |
| greenEye | 6.67 | 8.34 | 8.70 | 7.65 |
| blueEye | 5.66 | 7.43 | 7.43 | 5.65 |
| mouth | 1.92 | 3.03 | 4.24 | 4.18 |
| braid | 6.31 | 7.70 | 8.13 | 6.52 |
| hairline | 3.06 | 4.14 | 4.69 | 3.71 |
| background (left/right/top) | 1.79 / 1.22 / 2.28 | 3.26 / 2.23 / 3.20 | 4.13 / 2.91 / 3.53 | 2.39 / 1.57 / 2.53 |

**Boxes** (pinned by locating the saturated irises numerically on the plate, then verified
visually): face 420,20→760,400 · eyes 460,140→635,285 · greenEye 468,203→546,278 ·
blueEye 548,145→626,220 · mouth 548,252→642,308 · braid 468,278→542,402 ·
hairline 436,18→724,122.

**One correction to the brief:** it names *"the earring"* as an identity landmark. **There
is no earring on this plate** — the ear is under hair and the sidecar lists an *Al Bhed
pendant*. Round 1's judge found the same. I substituted the **cyan braid and its gold
clasp**, the most drift-sensitive fine detail available.

---

## 3. The hard-cut test

The brief asks for two passing clips cut together. **Only one clip exists**, so I ran the
strictest available version: encoded the clip to VP9, concatenated it to itself with
`ffmpeg -c copy` (a true hard cut, no cross-fade, no re-encode), and pulled the six frames
around the boundary at 1:1 — `judge-hard-cut.jpg`.

Per-frame step (head box), across that strip:

| f79→f80 | f80→f81 | **f81→f1 (THE CUT)** | f1→f2 | f2→f3 |
|---|---|---|---|---|
| 0.45 | 1.49 | **4.28** | 1.07 | 1.08 |

**The cut step is 4.2x its neighbours, and it is visible at 1:1.** What you see is not a
position jump — there is none — it is an **expression snap**: f81's mouth is still open in
a wider mid-smile, and at the cut it pops back to the plate's narrow closed-lip smile.
That is the §1 defect, seen directly.

## 4. Scores

| Clip (seed) | JOIN-FIRST | JOIN-LAST | IDENTITY | MOTION | Verdict |
|---|---|---|---|---|---|
| `idle-breathing` (1) | **8** | **5** | **9** | **6** | **REJECTED** |
| the other 8 clips | — | — | — | — | never queued |

- **JOIN-FIRST 8** — 5.23 face MAD against an unavoidable 3.85 floor, 79 % of it the
  floor's own pattern; zero translation; mouth settled and flat. I could not distinguish
  f1 from the plate at 1:1 (`judge-face-ab.jpg`: the amplified difference is edge-only,
  flat areas are black). Not 9–10, because it is still 1.36x the floor.
- **JOIN-LAST 5** — the brief's own rule is *"anything a viewer could see at 1:1 is 5 or
  below"*, and the expression snap at the cut **is** visible at 1:1. 5.75 MAD, only 57 %
  floor-correlated, mouth still in motion on the final frame.
- **IDENTITY 9** — both irises hold the correct colour on the correct side at f1/f40/f81
  (green = her right = screen-left; blue = her left = screen-right, each read numerically
  off the plate, not assumed); cyan braid and gold clasp intact; hairline, outfit, cel
  line and palette unchanged; no 3D or photographic drift. Round 1's turn clip scored 2
  here. See `judge-landmarks.jpg`.
- **MOTION 6** — it breathes and blinks (clear events at f29–f37 and f65–f73), nothing
  pops or morphs, body and background pinned to near the floor. Held back by two things:
  at **16 fps** the spec's measured 150–170 ms blink is 2.4–2.7 frames, so blinks are
  steppy by construction (round 1 ran 24 fps); and the big mouth event at f73–f77 is badly
  placed, leaving no room to return.

**Evidence:** `judge-landmarks.jpg` (1:1 crops of both eyes, mouth, braid, hairline at
plate/f1/f40/f81) · `judge-face-ab.jpg` (face at 1:1 plus 8x-amplified difference maps) ·
`judge-hard-cut.jpg` (the six frames around the hard cut). The clip itself is **not**
copied into `clips/` — it has a visible join, and the rule is that such a thing is never
shown to Bailey.

---

## 5. What round 3 should do

1. **Fix the end anchor — one node, no download.** Feed `end_image` a **4-frame batch of
   the plate** instead of one frame. `RepeatImageBatch(image=plate, amount=4)` is **core**
   (`comfy_extras.nodes_images`, verified present on this instance). Then
   `mask[:, :, -4:] = 0` zeroes slots **80,81,82,83** — which covers the *real* last pixel
   frame 80 — and `image[-4:] = plate` pins the whole final latent frame. The end anchor
   becomes symmetric with the start. Cost: the last ~0.25 s holds on the plate, so motion
   must settle by f77 — which is what we want anyway.
2. **Move the motion earlier in the prompt window.** The f73–f77 mouth event is what broke
   this clip. Ask for the expression to peak by the middle and be home by three-quarters.
3. **Re-time to 24 fps** so a blink is 3.6–4 frames, matching the spec.
4. **Re-render this one clip and re-judge it before queueing the other eight.** At
   **~72 min/clip**, the 9-clip brief with re-seeds is **12+ hours** on a GPU three other
   workflows share. This pass spent its entire budget on one render; do not repeat that
   with eight.
5. **Beware the loop.** Motion-spec finding 8 is that a real idle **is not a loop**
   (autocorrelation 0.06–0.42; a loop is >0.8). A clip that starts and ends on the same
   frame *is* one. The escape is the library the brief already implies — several different
   clips joined at the shared plate frame in varying order — which is why the bar is three
   clips, and why one perfect clip is not a partial deliverable.

---

*Judged without rendering. Every number here was computed by this pass from the frame
PNGs; the clip's own generator produced none of them.*
