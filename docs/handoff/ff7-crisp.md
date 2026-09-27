# FF7 crisp menus: measurement and finding (2026-09-27)

Game case: **FF7 only** for the question; FFX and FFX-2 were measured only for comparison. No source changed.

## The report

Bailey, on a screenshot of the live FF7 Guard Scorpion fight (release 23, `ff3884fb`): "the menus are nowhere near
crisp enough". In his screenshot the HUD words "Cloud", "Attack" and "316/ 316" read soft, and the page looks larger
than his window. His device pixel ratio and browser zoom are not known.

## What was measured

The build under test was a production build of main `deb15e87`. Its `src/`, `index.html`, `vite.config.ts` and
`public/fonts` are byte-identical to the live `ff3884fb`. It ran under `vite preview`, with headless Chromium on the
real GPU (`PYREFLY_BROWSER=gpu`).

For each setting below, the scripts cropped the HUD words at device resolution. The crops came from element
screenshots of "Attack", "Magic", the names and the HP numbers. A native reference of the same text went next to each
crop. The reference used the same face, weight, rendered size and shadow, sat at an integer position and had no
transformed or scaled ancestor. The metric is edge acutance: the 98th-percentile Sobel gradient of the luminance,
divided by the crop's luminance range, with the ratio taken as HUD / native. A ratio of 1.00 means the HUD is as sharp
as native text.

**Calibrating the metric.** A native word scores 0.498. The same word run through a bilinear resample drops to 0.40
(x0.9), 0.37 (x0.8) and 0.34 (x0.67). A bilinear upscale drops it to 0.41 (x1.25) and 0.36 (x1.5). So a resampled or
bitmap-scaled HUD would show a ratio of about 0.70 to 0.82.

| FF7 HUD, setting | HUD | native | ratio |
|---|---|---|---|
| 1600x900, DPR 1 | 0.494 | 0.499 | 0.99 |
| 1600x900, DPR 1.25 | 0.494 | 0.499 | 0.99 |
| 1600x900, DPR 1.5 | 0.495 | 0.499 | 0.99 |
| 1600x900, DPR 2 | 0.490 | 0.500 | 0.98 |
| 1600x900, DPR 1, page zoom 1.25 (CDP `Emulation.setPageScaleFactor`, as in hotfix 21.1) | 0.493 | 0.503 | 0.98 |
| 2000x1012 (Bailey's known window), DPR 1 | 0.497 | 0.500 | 0.99 |
| 1536x864, DPR 1.25 (1920x1080 at Windows 125 %, or Chrome zoom 125 %) | 0.495 | 0.500 | 0.99 |
| 1280x720, DPR 1.5 | 0.495 | 0.500 | 0.99 |

For comparison, the FFX HUD (Seymour Flux) scored ratios from 0.99 to 1.02 at 1600x900 with DPR 1, 1.25, 1.5 and 2,
at 2000x1012 with DPR 1 and at 1536x864 with DPR 1.25, and 0.95 under the 1.25 page zoom. The FFX-2 crop selector
found no leaf text, so FFX-2 has no number. It uses the same letterbox-stage pattern as FFX.

Chrome's own zoom (Ctrl +) changes the device pixel ratio and the CSS viewport together. It is therefore covered by
the DPR 1.25 and 1.5 rows.

Pictures are in `docs/screenshots/ff7-crisp/`:

- `ff7-hud-vs-native.jpg`: every setting above, with the HUD crop and the native reference side by side, both at 2x
  nearest-neighbour.
- `ffx-hud-vs-native.jpg`: the same comparison for FFX.
- `calibration-bitmap-upscale.jpg`: what a x1.25 or x1.5 bitmap upscale does to the same word, which is the softness
  in Bailey's screenshot.
- `ff7-band-2000x1012-dpr1.jpg`: the FF7 band at 1:1.

## Cause

**No resampling blur of the FF7 HUD reproduces in the build**, at any device pixel ratio, page zoom or window size
tested. Reading the code agrees with this:

- `src/ui/ff7/**` lays out every window, gauge and text line in real CSS pixels from the window size
  (`ff7Geometry.ts`). There is no stage `transform: scale()`.
- The `.ff7hud` ancestor chain (HUD, battle screen, two app divs, body) has `transform`, `filter` and
  `backdrop-filter` all `none` and `will-change: auto`.
- `elementsFromPoint` over "Attack" finds no filter, backdrop blur, blend mode or `image-rendering` above the text.
  No element in the document has a filter or backdrop filter.
- The HUD draws no text into a canvas or texture. The only canvas is the WebGL scene.
- The font loads from `/pyrefly-reprise/fonts/ff7/…` (the built CSS rebases it), so the live site does not fall back
  to another face.

The softness in the screenshot matches a **bitmap-scaled window**: a picture rendered at one size and then stretched.
That is the only mechanism that also makes "the page appear larger than his window". Candidates outside the game:

- Windows DPI virtualisation of the browser. For example, "Override high DPI scaling: System" in the browser's
  compatibility tab, or a browser started before a display-scale change.
- A remote-desktop or viewer session that scales its frame.
- A screenshot or image viewer that upscaled the capture.

None of these can be fixed in page code, because the page is already painted at the device's full resolution.

## Open

- Ask Bailey, in one line, for these: the browser and its zoom level; Windows Settings > Display > Scale; whether the
  game ran in a remote or embedded viewer; and `devicePixelRatio`, `innerWidth` and `innerHeight` from the console on
  the live page. If the browser reports DPR 1 on a 125 % or 150 % display, it is DPI-virtualised.
- If Bailey's "crisp" means a richer, higher-fidelity look rather than resampling blur, that is a design change, and
  it belongs in the FF7 hi-fi options round (rule 9). Options there could include a heavier weight, a harder 1 u
  shadow, sharper bevel rings and glow. Nothing here changes the D-237 layout.
- FFX-2 was not measured, because the crop selector found no leaf text.

Scratch scripts, kept in the worktree `D:/pyrefly-ff7-fid`: `.ff7crisp-measure-tmp.mjs` (crops),
`.ff7crisp-score-tmp.py` (acutance), `.ff7crisp-stack-tmp.mjs` (stack and filter probe) and
`.ff7crisp-sheet-tmp.py` (sheets).
