# Living portrait v3 — art assembly, v3.1 runtime, v3.2/v3.3 fix pass (2026-09-22)

## v3.2/v3.3 fix pass after the v3.1 check (latest; read this first)

Game case: **FFX-2 only** (Yuna X-2 plate); renderer plumbing is shared.
Evidence: `docs/concepts/pause-until-dawn/prototype-v2/shots/v3.3/CHECK.md`
(one row per refuted finding: root cause, fix, re-measured number, still).
Method: `tools/gen/rig-check.mjs` re-runs the v3.1 check's own captures
(real keys, real B, a real resting mouse; GPU Chromium; canvas native);
`rig-measure.py` reads the numbers; `rig-shots.py` curates `shots/v3.3/`.

### What is real now

- **Rest = the plate**: `?post=0`, reduced motion: 0 px differ. With the post
  grade on (the shipped view): MAD 0.59, figure luminance 140.5 -> 140.1 (was
  MAD 35.2, 28 % darker).
- **One painting on screen** at every seam yaw and while the mouse rests at
  15, 22, 25, 60 deg (0 % mixed, was 33-78 %): `src/paint.ts` picks the key
  from the spring's base yaw with hysteresis; a 0.2 s dissolve only on change.
- **No end of the head in the frame** at +40/+60/+80 and no box edge at -80:
  the backs of both source heads repainted past x 990 (`rig-heads.py`, picks
  `pl.1`, `qr.1` at denoise 0.8); hair behind the neck at -40/-60.
- **No seam line under the warp**: premultiplied filtering (`gl-layer.ts`),
  lower layers opaque under upper ones (`rig-underfill.py`), margins past the
  canvas with the plate's right side hair continued along its strands
  (`rig-margins.py`; `check/border.test.ts`: worst pull 39.3 px < 64 px margin).
- **Blinks that read**: eight lid frames for the frontal AND every turned key,
  harmonic lid skin, one tapered closed line (`rig-lids.py`); B closes both
  eyes at -84..+84.
- **Iris +80 green whole** (1508 green / 2 blue px); **braid** on her right in
  the right turn; **crown sheen** warmed; **smile** changes only the mouth.
- **Motion on spec by its own measure** (5.5 s windows, half peak-to-peak):
  browser 180 s: chest 3.63 / 2.80 % IPD (spec 3.6 / 2.9), head 2.17 / 2.17 %
  of head width (spec 1.5-3, vertical about equal); held 40 deg overshoot < 3.5.
- Tests: `check/` (10, incl. border pull), the six `tests/unit/pause-living-portrait-*`
  files (53), `tsc` clean. `renderer.ts` 275 lines; every source file < 400.
- Rebuild: `bash tools/gen/rig-build.sh` (last block = this pass; no ComfyUI).

### What remains

1. The frontal-to-turn paint change (orange/pink hair and tassel -> brown hair
   and red braid) is a 0.2 s dissolve at ~28 deg: a change of painting.
2. Up to ~39 px of invented hair at the right frame edge at the frontal's
   extreme pose (continued strands; a 0.55 outpaint came back as blur, a
   reflection as chevrons).
3. The new backs of the heads are diffusion-painted; no judge has seen them.
4. Turned keys have no mouth or brow expressions.
5. Nothing in this pass has had an independent judge or Bailey's look.

### Needs Bailey

- **The segmentation model download** (requested separately): masks are still
  isnet-anime + colour clustering + hand polygons checked at 1:1.
- **The pick of the gaze reading** by feel (head, eyes or camera) in the
  prototype.

## v3.1 runtime pass

Game case: **FFX-2 only** (Yuna X-2 plate); renderer plumbing is shared.
Evidence: `docs/concepts/pause-until-dawn/prototype-v2/shots/RUNTIME-CHECK.md`.

- **Mesh warp built**: `src/warp/{delaunay,mesh,cache}.ts` + the warp program
  in `src/gl-layer.ts`; 20 landmarks per key (`art/v3/warp/landmarks.json`,
  wired by `tools/gen/rig-turns.py wire`), frame + shoulder pins. Both keys
  are warped onto the interpolated landmarks and mixed by coverage; paint
  swaps in the middle half of a bracket only. Rest = plate (0 px over 1 level,
  live canvas). `?warp=0` = v3's cross-dissolve for comparison.
- **Turn continuity fixed**: `q34-right`'s painting faces LEFT, so +40 used to
  turn her the wrong way. Keys are now `turn-l85 / turn-l45 / frontal /
  turn-r45 / turn-r85` (`tools/gen/rig-turns.py mirror`); profile eye colours
  corrected (a left turn shows her blue left eye).
- **Patches**: own feathered matte + trimmed least-squares seam colour match
  (`src/patch-blend.ts`), applied at load.
- **Collar**: the frontal tassel's footprint inpainted into
  `art/v3/layers/frontal/body-turned.png` (`tools/gen/rig-collar.py`, ComfyUI
  pick `tassel2.1`), lerped in only when a turned key shows.
- Tests: `tests/unit/pause-living-portrait-warp.test.ts` (lerp exactness,
  identity warp, no fold on any real pair) and `-patch.test.ts`; all 6
  living-portrait files green (53 tests); tsc clean.
- Open: braid side on the right turn (mirror), no braid on the profiles' near
  side, hair colour differs between the plate and the keys (cross-fades
  mid-turn), faint profile line at -60, blinks only on the frontal key,
  flat lid slab, `rig-range.mjs` envelope predates the warp. Nothing here has
  had an independent judge or Bailey's look.

## v3 art assembly (earlier the same day)

Owner of this pass: `docs/concepts/pause-until-dawn/prototype-v2/**`,
`tools/gen/rig-*.py`, `tools/gen/rig-*.mjs`, `tools/gen/rig-build.sh`,
`tools/gen/inpaint.mjs` (additive `--latent`). Game case: **FFX-2 only** (the
plate is Yuna X-2); the renderer plumbing is shared by any plate. Full
write-up: the prototype README, Part 5.

## What changed

- **Collar seam, root cause and fix.** v2 drew the non-frontal key of the
  yaw bracket opaque under the frontal head stack at every yaw (at yaw 0 the
  bracket is q34-left to frontal at t = 1), so q34-left's crop showed over the
  pinned body. v3 renders each key as a complete composite and mixes two only
  between keys. Rest pose = the plate: `art/rest-diff.png` MAD 0 (numpy) and 0
  differing pixels in the live WebGL canvas with `?post=0`.
- **Masks**: geodesic class split snapped to ink (`tools/gen/rig-masks.py`),
  isnet-anime agreement IoU 0.9961, magenta overlays per layer in
  `art/v3/overlays/`.
- **Hidden regions**: displacement envelope measured from the prototype's own
  state machine (`tools/gen/rig-range.mjs`), five inpaint jobs
  (`tools/gen/rig-fill.py`, `tools/gen/rig-jobs.mjs`).
- **Yaw keys**: every key cut into back and front around the pinned body
  (`tools/gen/rig-keys.py`); q34-right re-placed; q34-left, q34-right and
  profile-right outpainted past their crop edges; **profile-right built** by
  mirroring and recolouring the iris; yaw range now -85..85.
- **Face**: blink-1 / half / blink-2 / closed as measured lid slides (0.0
  levels outside the lid), mirrored left brow under the fringe, raised and
  drawn brow patches with a 3 px fringe lift, mouth patches re-matted
  (`tools/gen/rig-face.py`).
- **Runtime bug**: left turns never moved the iris, strands or relight
  (`yawNormFor`); fixed in `src/motion.ts`. `renderer.ts` is 262 lines (was
  788).

## Still open (as of the art assembly; 1 and 2 were done in v3.1 above)

1. Per-triangle mesh warp: mid-dissolve stills still double-expose.
2. The hood under the tassel shows as a soft strip in the yaw keys.
3. q34-left barely reads as a turn; profile-right's back of head is a curve.
4. No independent judge and no Bailey look yet at the brows, blink states or
   profile-right. Nothing with a visible join goes to Bailey (NOW.md rule).
5. `tests/unit` has no test for `motion.ts` / `layers.ts` (outside this pass's
   folders); `tsc` and the four living-portrait test files pass.

## Rebuild

`bash tools/gen/rig-build.sh` (embedded python; no ComfyUI). Capture:
`PYREFLY_BROWSER=gpu node tools/gen/rig-capture.mjs --url <prototype url>`.
