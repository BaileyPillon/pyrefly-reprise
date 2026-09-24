# PR-0079 method check (rule 15): why pan-a-point cannot clear the face, and what can

Written 2026-09-23 before the third attempt. Game case: **both** (the pause
layout and the plate framing are shared plumbing, CHK-020; the face boxes are
per painting).

## The two failed attempts

1. `499b9d1` derived each plate's chrome side geometrically (Kimahri now
   mirrors).
2. `2c2de85` moved the pan target of the sidecar focal **point** from 58%/42%
   at 1600 wide to 68.75%/31.25% at 1280.

Both answered "is the focal point outside the chrome". The critic's complaint
is that the chrome covers the **face**, and a point is not a face.

## Measured (Chromium, real GPU, real Escape and E presses, 23 Sep 2026)

Face boxes are brow to chin and cheek to cheek, measured off
`public/art/pause/<id>.png` on a 5% grid and checked by eye
(`src/app/screens/pause/faceClear.ts` `FACE_BOXES`). Chrome boxes are every
`.pause__col`, the eyebrow and objective line, the tab strip, the brand, and
the two prompts, as the browser lays them out. Script:
`tools/zz-pr79-measure2.tmp.mjs`. Face box in screen px at about 1.1 s into the
push-in; "end" is the same face with the 26 s push-in finished.

| size | plate | side | face x | hits at 1.1 s | hits at end |
|---|---|---|---|---|---|
| 1600x900 | tidus | left | 732-1388 | IN THIS FIGHT | IN THIS FIGHT, objective |
| 1600x900 | yuna | mirror | 324-900 | IN THIS FIGHT, objective | same |
| 1600x900 | kimahri | mirror | 309-803 | IN THIS FIGHT | clear |
| 1600x900 | yuna-ffx2 | left | 640-1163 | IN THIS FIGHT | same |
| 1600x900 | rikku-ffx2 | left | 575-1105 | IN THIS FIGHT | same |
| 1600x900 | paine | mirror | 586-1331 | both columns | both columns, eyebrow |
| 1280x960 | tidus | left | 688-1389 | IN THIS FIGHT | same |
| 1280x960 | yuna | mirror | 91-705 | IN THIS FIGHT, objective | IN THIS FIGHT |
| 1280x960 | kimahri | mirror | 13-539 | clear (47 px) | clear |
| 1280x960 | yuna-ffx2 | left | 592-1115 | IN THIS FIGHT | same |
| 1280x960 | rikku-ffx2 | left | 593-1150 | IN THIS FIGHT | same |
| 1280x960 | paine | mirror | 342-1137 | both columns | both columns, eyebrow |
| 2000x1012 | tidus | left | 823-1561 | IN THIS FIGHT, objective | same |
| 2000x1012 | yuna | mirror | 365-1012 | clear (27 px) | clear |
| 2000x1012 | kimahri | mirror | 397-1000 | clear (41 px) | clear |
| 2000x1012 | yuna-ffx2 | left | 872-1395 | IN THIS FIGHT | same |
| 2000x1012 | rikku-ffx2 | left | 719-1381 | IN THIS FIGHT | same |
| 2000x1012 | paine | mirror | 658-1496 | IN THIS FIGHT | IN THIS FIGHT, eyebrow |

The two columns together span about 710 px at 1280 wide and 800 px at 1600
(stats 62-372, IN THIS FIGHT 416-866 at 1600x900): `--pu-key` and `--pu-bar`
are clamps with pixel floors, so they barely narrow with the window.

## Why the side flag plus a pan target cannot work

- **The zoom is set by head height alone.** `framePlate` zooms until the head
  is 78% of the frame's *height*. On a 4:3 window that makes faces 520 to 800
  px wide in a 1280 px frame (Paine 795 px), while the columns keep ~710 px.
  Face plus columns plus the gutter is wider than the window, so **no pan
  target**, fixed or interpolated, can clear the face at that zoom. Only a
  zoom change can.
- **It targets a point.** A face box is hundreds of pixels either side of the
  focal point; clearing the point says nothing about the cheek, the eye or the
  mouth. That is exactly what `2c2de85` shipped: point clear, eye covered.
- **It ignores the push-in.** The plate scales to 1.06 over 26 s about a
  drifting origin, which slides a face up to ~60 px towards the chrome after
  the screenshot the critic took.
- **The side is decided once, at 1600x900,** so it cannot notice that a
  different window shape needs a different framing.

## What the approved frames support

`docs/target/targets.json`, tile "Pause remade on the Until Dawn character
screen", mustRemain: *"the text block sits on whichever side of THIS painting
is empty"* (Bailey, 21 Sep 2026, "B, yes, yes, yes"). Frames (a), (b), (c) all
hold the chrome still and **frame the painting around it**: `build.mjs` gives
each frame its own zoom and pan (`tidus` 1.26 / 0.58, `yuna` 1.27 / 0.38,
`yuna-ffx2` **1.9** / **0.66**). Frame (c) is the proof: its head-height rule
would want 2.1x, and the mock took 1.9x and pushed the face right, to 66%,
precisely so the columns could stand beside her.

| option | verdict |
|---|---|
| A. Pan and scale the plate per viewport until the measured face box clears the measured chrome (frame (c)'s own move, generalised) | **Chosen.** The chrome, the meters and the columns stay exactly as mocked; only the framing moves, and the framing is what (c) already varies. |
| B. Narrow or stack IN THIS FIGHT | Rejected: Q3 approved "the meters as mocked", two columns side by side; stacking changes the layout Bailey picked. |
| C. Move a column (for example to the other side of the face) | Rejected: no approved frame splits the chrome; it breaks "the text block sits on the empty side". |

## The method (option A)

`faceClear.clearFace(base, focal, faceBox, frameW, frameH, chromeBoxes)`:

1. If the approved framing (`framePlate`) already leaves the face box, grown by
   a 16 px margin and swept over both ends of the push-in, clear of every
   chrome box, it is used untouched.
2. Otherwise search from the approved zoom downwards (never below plain cover)
   and, at each zoom, every legal pan (no empty page at either edge); take the
   **largest zoom** at which some pan clears, and at that zoom the pan closest
   to the approved focal position.
3. If nothing clears even at cover, keep the approved framing (see Result:
   the first build took the least-covered framing, and that cropped faces).

`PortraitStage` measures the chrome after every render and resize (through a
callback the view hands it), and only on member tabs; a fixed tab (OPTIONS,
GUIDE, ...) keeps the member framing it arrived with so the painting does not
jump under a tab change. The phone (portrait, frame (f)) is untouched: its
chrome stacks under the face by design.

## What this changes against the approved pixels

At 1600x900 frames (a) and (c) themselves put IN THIS FIGHT's value column
inside the face box (in (a) "WARRIOR" ends at 810 px against Tidus's eye
corner at about 815; in (c) the values end at 840 against Yuna's green eye at
about 860). Bailey named the rule (text on the empty side), not the exact pan,
and a pick approves only what is named. The search never zooms past the
approved framing, so where clearing would need a *closer* crop (Tidus) it
leaves the approved frame as it is.

## Acceptance

All six member tabs (chapter 1: Tidus, Yuna, Kimahri; chapter 4: Yuna, Rikku,
Paine) at 1600x900, 1280x960 and 2000x1012: no chrome box intersects the face
box at 1.1 s or at the end of the push-in. Composites under
`docs/screenshots/fix12/`, looked at.

## Result (built 2026-09-23, same day)

A first run of the search cleared Paine at 1280x960 by pushing half her face
off the left edge (one eye and an ear). The search now also requires the
whole face box, at rest, on screen; where no framing satisfies both it keeps
the approved framing untouched.

Measured with real Escape and E presses, Chromium on the RTX 5070 Ti (D3D11):

| plate | 1600x900 | 1280x960 | 2000x1012 |
|---|---|---|---|
| FFX Tidus | covered (approved frame (a) as is) | covered (as before) | covered (as before) |
| FFX Yuna | clear, 19 px | clear, 21 px | clear, 27 px |
| FFX Kimahri | clear, 18 px | clear, 47 px | clear, 41 px |
| FFX-2 Yuna | clear, 69 px | clear, 49 px | clear, 53 px |
| FFX-2 Rikku | covered (as before) | covered (as before) | covered (as before) |
| FFX-2 Paine | clear, 27 px | clear, 24 px | clear, 30 px |

The critic's own case (FFX-2 Yuna at 1280x960, WHITE MAGE / PROTECTION HALO
on her green eye) is clear and now sits close to approved frame (c):
`docs/screenshots/fix12/pr0079-target-c-vs-before-after-1600x900.png`
(target, before, after). A fixed tab and H keep the member's framing (no jump),
and a resize re-frames.

### Left for Bailey (no approved frame decides these)

- **FFX-2 Rikku, every size.** Her face is centred and a third of the plate
  wide; beside ~700 to 800 px of columns there is no pan or zoom that clears it
  with the whole face on screen (clearing needs 1.5x more zoom *and* crops her
  cheek off the right edge). What would clear it is a layout or art change, not
  a framing: (1) stack IN THIS FIGHT under BATTLE STATS on this plate, (2) let
  the plate slide under the dark falloff on the chrome side (empty page behind
  the columns), (3) a re-cropped or re-posed Rikku plate, (4) keep it as is.
  Screenshots: `docs/screenshots/fix12/pr0079-after-ffx2-bahamut-rikku-ffx2-*.png`.
- **FFX Tidus.** At 1600x900 the build is approved frame (a) pixel for pixel,
  and (a) itself has IN THIS FIGHT touching his eye corner. Clearing it needs a
  12% closer crop than (a) (face in frame, chin at 826 px); at 1280x960 no
  framing clears it with his face on screen. Whether (a)'s own geometry is
  acceptable, or a closer crop is wanted, is Bailey's call.
  Screenshots: `docs/screenshots/fix12/pr0079-after-seymour-flux-tidus-*.png`.
