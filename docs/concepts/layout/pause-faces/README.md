# Pause faces: the plates the framing search cannot clear

**Nothing here is built.** No file under `src/` was changed. These are the
option frames for the three cases `docs/plans/pr-0079-method-check.md`
("Left for Bailey") hands to Bailey: **FFX-2 Rikku at every size**, **FFX
Tidus**, and **FFX Auron at 1280x960** (IN THIS FIGHT beside his eye).

**Game case (rule 14): both.** The pause layout and the plate framing are
shared plumbing (CHK-020); the face boxes are per painting. Whatever Bailey
picks applies to both games' pause screens.

## How the frames were made

Real captures: Chromium on the RTX 5070 Ti (D3D11), a private Vite on port
5571, real Escape to open the pause and real E presses to reach the member
tab; the push-in is held at 1.1 s so the four options show the same moment.
Each option was then applied **inside that scratch browser session only**
(injected CSS, or the plate's box moved), measured against the face box in
`src/app/screens/pause/faceClear.ts` `FACE_BOXES`, and saved as JPEG.

- `sheet.jpg`: 7 cases x 4 options, face box outlined in magenta, the
  measured result under every frame (green clear / red covered).
- `<plate>-<size>-<a-stack|b-slide|c-closer|d-keep>.jpg`: each frame at
  real size, no overlay.
- `_compose.py`: builds the sheet from the captures.

## The options

| | What changes | Rikku 1600 / 1280 / 2000 | Tidus 1600 / 1280 / 2000 | Auron 1280 |
|---|---|---|---|---|
| **A. Stack** IN THIS FIGHT under BATTLE STATS, on that plate only | The chrome: two columns become one; the stack rises only as far as it must to clear the objective | clear 93 / 180 / 140 px | clear 7 / 109 / **touches the objective line** | **touches the chapter eyebrow** (his chin) |
| **B. Slide** the plate under the dark falloff | The framing only: the plate may pan past its edge on the chrome side; the empty strip is feathered into the falloff (a mask), shrinking to at most 0.8x only when the face would leave the far edge | clear 15 px each (1280: plate 91 %) | clear 15 px each (1280: plate 80 %) | clear 16 px (plate 80 %, face meets the right edge within 1 px) |
| **C. Closer** approved-style crop | The framing only: zoom in until a legal pan (no empty page) puts the face beside the columns, as approved frame (c) did at 1.9x | 1.50x crops 61 px of cheek / 1.26x crops 180 px / 1.44x runs into the tabs | 1.12x clear, face in frame / crops 139 px / runs into ESC RESUME | crops 142 px |
| **D. Keep** as is | Nothing | IN THIS FIGHT on her face | IN THIS FIGHT on his eye (1280: face already cut 109 px at the right) | IN THIS FIGHT on his eye |

## Recommendation: B, slide under the falloff

It is the only option that clears **all seven** cases with the face on
screen, and it keeps what Bailey approved by name: the chrome, the meters and
the two columns side by side exactly as mocked, with the text on the empty
side. The cost is a darker, emptier strip under the columns (up to ~300 px at
2000 wide), which the falloff already paints nearly black. Built, it would be
one more step in `faceClear.clearFace`: when nothing clears at a legal pan,
allow the pan past the edge on the chrome side, feathered.

A is a fair second for Rikku alone (widest clearance) but changes the
approved two-column layout and does not clear Tidus at 2000 or Auron. C is
right only for Tidus at 1600x900 (1.12x, as the method check found).

## Questions for Bailey

1. **Rikku, every size:** A, B, C or D? *Recommended: B.*
2. **Tidus:** A, B, C or D? *Recommended: B* (C also works at 1600x900 only).
3. **Auron at 1280x960:** A, B, C or D? *Recommended: B.*
4. If B: apply it to every plate the search cannot clear (one rule), or only
   to these three? *Recommended: one rule.*
