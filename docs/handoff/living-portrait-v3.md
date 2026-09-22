# Living portrait v3 — art assembly (2026-09-22)

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

## Still open

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
