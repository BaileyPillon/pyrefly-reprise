# Runtime check, living portrait v3.1 (2026-09-22)

One browser pass on a private vite server (port 5640, stopped by its PID afterwards),
real Chromium on the GPU (`PYREFLY_BROWSER=gpu`), viewport 1000x2000 so the canvas renders
at its native 832x1216. Every still is the WebGL canvas itself, not a scaled screenshot.
The turn is driven by the real arrow keys (held, with the clock slowed to 0.08x so the
freeze lands within a degree of the target); the blink by the real `B` key in slow motion
(0.02x). Tool: `tools/gen/rig-runtime-check.mjs`. Numbers: `runtime-check.json`.

Game case: FFX-2 only (the plate is Yuna X-2). The renderer plumbing works for any plate.

## What changed in this pass (the things these stills test)

1. **Per-triangle mesh warp** (`src/warp/delaunay.ts`, `src/warp/mesh.ts`, `src/warp/cache.ts`,
   the warp program in `src/gl-layer.ts`). 20 shared landmarks per key
   (`art/v3/warp/landmarks.json`, read at 2x on 10 px grids) plus a frame and shoulder pins.
   Each bracket is triangulated once (Delaunay of the pair's midpoint shape). For a yaw between
   two keys, both keys are warped onto the interpolated landmarks, so the two paintings' eyes, mouth,
   jaw and cheek outline land on the same pixels. The shape follows smootherstep(t) across the
   whole span. The paint swaps only in the middle half of the span (t 0.25 to 0.75,
   `paintWeight`). The two warped head passes are mixed by coverage: where only one key has paint,
   that paint fills the pixel instead of fading against the background. The body is pinned and
   drawn once.
2. **Keys re-slotted so a turn never reverses** (`tools/gen/rig-turns.py`). Seen at 1:1: the
   painting wired as `q34-right` (+40) faces the viewer's LEFT, the same way as the -40 and -85
   keys, while `profile-right` faced right. So holding ArrowRight turned her left and then
   snapped her right. On eye colour, the plate has her right eye green (viewer's left) and her
   left eye blue. A head turned to the viewer's left shows her left side, so a left profile's
   visible eye is BLUE. `profile-left` was painted green and `profile-right` had been recoloured
   blue, so both were backwards. The rig is now: `turn-l85` (profile, blue eye), `turn-l45`
   (the q34-right painting as painted), frontal, `turn-r45` (that painting mirrored, both irises
   swapped: `art/v3/overlays/turn-r45-iris-check.png`), `turn-r85` (profile, green eye). The
   mild q34-left painting (about 15 degrees) is out of the rig. It would put a second hair
   repaint within reach of the idle sway at rest.
3. **Patches through their own feathered matte, colour-matched at the seam** (`src/patch-blend.ts`,
   applied at load in `src/layers.ts`). A per-channel gain and offset is solved by trimmed least
   squares on the seam ring, against `art/rest-composite.png` (which is the plate). The fit keeps
   the 60 percent of the ring that agrees best, twice, because a lid patch's border is partly skin
   meeting skin and partly the moving lid. The mattes are then feathered: 2.5 px on the eyes,
   3 px on the brows and mouth.
4. **The collar under the frontal tassel** (`tools/gen/rig-collar.py`). A turned key drops the
   frontal earring, so the tassel's whole footprint shows on the pinned body. v3 had only a smooth
   fill there: a streaky pink block with a hard lower edge. The footprint is now inpainted (ComfyUI,
   `inpaint.mjs --latent`, denoise 0.85, pick `tassel2.1`) into a second body layer,
   `body-turned.png`. It is faded in against the plate's body across the frontal-to-turn blend
   with an exact premultiplied lerp, so the rest pose never sees it.
5. **Key edges**: `turn-l45`/`turn-r45` lose the pink and white fringe of their painting's own
   collar under the hair ends. A mirrored key whose source was cut by the canvas border has its
   hair faded out over 48 px at that cut instead of stopping on a vertical line.
6. **Renderer split kept**: `renderer.ts` 337 lines, `gl-layer.ts` 257, every source file under
   400. The driver seam (`mount`, `setGaze`, `blink`, `setExpression`, `dispose`, `snapshot`) is
   unchanged. Spring, blink scheduler, band noise, chest sway and relight are untouched.

## Rest pose (the regression gate)

`?post=0`, R (reduced motion), eyes open. The live WebGL canvas compared with the plate over the
clear colour: **0 pixels differ by more than 1 level, max 1, mean 0.0025**. The first run of the
tool once read a blank canvas, and the tool now re-reads and logs the attempt count (this pass:
attempt 1).

## Stills (native 832x1216; `sheet.png` is all eight side by side)

| file | yaw | what it is | verdict (looked at 1:1) |
|---|---|---|---|
| `01-yaw-0.png` | 0 | rest, post grade on | the plate; no collar seam, no box anywhere |
| `02-yaw-m20.png` | -20.1 | frontal to turn-l45, t 0.45 | one iris per eye, one mouth, one jaw line. The frontal's hair and tassel still show through the turned key's hair (paint weight 0.31): a real cross-fade of two different paintings, no longer a double face |
| `03-yaw-m40.png` | -40.1 | turn-l45 (t 0.89, lightly warped) | clean; eyes single (`crop-eyes-m40.png`), collar clean (`crop-collar-m40.png`), hairline clean (`crop-hairline-m40.png`) |
| `04-yaw-m60.png` | -60.1 | turn-l45 to turn-l85, t 0.38 | eyes and mouth single; a faint profile nose and lip line crosses the cheek (paint weight 0.11), and the chin line doubles faintly |
| `05-yaw-m80.png` | -80.0 | turn-l85 (t 0.88) | clean profile, blue eye; the back of the head is the art pass's outpainted curve |
| `06-yaw-p20.png` | +20.6 | frontal to turn-r45, t 0.46 (paint 0.35) | eyes single and jaw line single. The weakest still: turn-r45's hair outline arcs faintly across the frontal fringe, and its mirrored braid and earring show faintly on the RIGHT side of the jaw (see "still open") |
| `07-yaw-p40.png` | +40.2 | turn-r45 | clean turn to the right, green near eye; the hair's former canvas cut fades out at the left |
| `08-mid-blink.png` | 0.5 | B key, aperture 0.50 closing | the lid patch has no rectangle and meets the skin in tone; the lid itself is a flat painted slab (art) |
| `09-nowarp-yaw-m20.png`, `10-nowarp-yaw-m60.png` | -20, -60 | `?warp=0`: v3's plain cross-dissolve | for comparison only: doubled irises and a second face outline. `warp-vs-crossfade.png` shows them next to the warped stills |

## 1:1 crops at -40 (and mid-blink)

- `crop-eyes-m40.png`: one green iris, one blue iris, no doubled lash line, no box edge.
- `crop-collar-m40.png`: no tone seam across the collar; the old tassel block is gone (the hood's
  red trim continues). The key's braid ends on the hood as painted.
- `crop-hairline-m40.png`: no vertical box edge. The hair silhouette at the far left has a small
  aliased notch (the key's isnet cut, art).
- `crop-eyes-mid-blink.png`: the lid meets the skin with no light rectangle. Seam fits applied
  (gain, offset in levels): half 0.99/0.89/0.83, -1/+5/+6. Brows and smile about 1.0, under 2
  levels. The mouth `parted` fit is the largest (0.97/0.88/0.89, +8/+17/+14).

## Tests

`npx tsc --noEmit` clean. `npx vitest run tests/unit/pause-living-portrait-*.test.ts`: 6 files,
53 tests, all green. Two of the files are new:

- `pause-living-portrait-warp.test.ts`. The interpolated landmarks are EXACTLY a + (b - a) t for
  every pair of the real rig. Warping a key to its own landmarks is the identity (vertex buffer and
  200 random canvas points per key). Every landmark of both keys lands on the interpolated one.
  **No triangle folds over at any t for any pair of the real rig** (this caught five landmark
  placements that had to move). The mesh covers the canvas. The Delaunay property holds. The paint
  weight is 0 or 1 outside the middle half.
- `pause-living-portrait-patch.test.ts`: the feather never widens a matte. A rectangular matte
  comes out with no hard edge. The fit recovers a known gain and offset, closes a narrow-range
  seam to 3 levels, is the identity on a matched patch, and is capped.

## Still open (none of this goes to Bailey as "done")

1. **Braid side on the right turn.** `turn-r45` is a mirror, so its braid hangs on her LEFT; the
   plate hangs it on her right. Across 0 to +45 the frontal tassel fades out on one side while
   the key's braid fades in on the other. This needs a painted right-turn key (or the braid
   transplanted), not runtime.
2. **Profile keys have no braid on the near side.** `turn-r85` should show it (her right side
   faces the viewer); the painting has none.
3. **Hair repaint shows through mid-turn.** The frontal plate's orange, pink-tipped hair and the
   keys' plain brown hair are different paintings. The warp aligns shapes, not strands, so between
   t 0.25 and 0.75 the two hair paintings cross-fade. A consistent hair colour across keys (an art
   pass) would remove most of what is left at plus and minus 20 degrees.
4. **Profile silhouette at -60 and +60.** A faint nose and lip line and a second chin line, at
   paint weight about 0.1. More contour landmarks (brow ridge, under-chin) would tighten it.
5. **Blinks only on the frontal key.** Past about 11 degrees (paint weight above 0) the turned key
   has no lid states, so a blink fades with the frontal paint. Lid patches per key are owed.
6. **The lid patch is a flat slab** with a thin light crease line (art, `rig-face.py`).
7. `tools/gen/rig-range.mjs` still measures the envelope with v3's rigid chin offset; the warp now
   moves the head layers instead. The fills held at every still here, but the envelope file is
   stale.
8. The v2 stills in this folder were replaced; `CAPTURE.md` and the two `.webm` clips describe the
   v2 re-capture (8d5c611) and are kept as history. `shots/v3/` is the art pass's capture of the
   pre-3.1 key order.
