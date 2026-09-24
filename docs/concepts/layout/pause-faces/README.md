# Pause faces: the plates the framing search cannot clear

**Built 2026-09-24 (option B, see the end).** When written, nothing was built. These are the
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

## Built (2026-09-24): Bailey picked B, as one rule

Bailey, 24 Sep 2026: *"All your recommendations"* (B for Rikku, Tidus and
Auron, and B as one rule for every plate the search cannot clear). Built in
`src/app/screens/pause/faceSlide.ts` (`frameFace` = `clearFace`'s search, then
the slide), the feather in `src/ui/common/pause-slide.css`, tests in
`tests/unit/pause-face-slide.test.ts`. Game case: both.

Two differences from the sheet, both forced by measuring through the whole
push-in (the sheet's frames were held at 1.1 s; the plate then grows to 1.06x
and stays there):

- **The shrink floor is 0.8x at the end of the push-in** (0.8 / 1.06, about
  0.755x at rest). At the sheet's 0.8x, Tidus's and Auron's faces run 20 to
  35 px off the right edge at 1280x960 once the push-in finishes. Where the
  full 16 px of air does not fit, it drops to 8 px (Tidus ch. 1, Auron ch. 2-3
  at 1280x960), never to an overlap.
- **A plate shorter than the frame is feathered at the bottom too**, so the
  hard line under Rikku's plate in the 1280x960 B frame is gone.

The first build also slid FFX-2 Paine at 1280x960 in chapters 5 and 6 by
letting the plate go a further 0.8x below plain cover (0.54x of her approved
framing). The repair below took that out.

Measured with real Escape and E presses, Chromium on the RTX 5070 Ti (D3D11),
all six chapters at 1280x960, 1600x900 and 2000x1012 (54 member tabs): every
face clear of every chrome box at zero margin, at 1.1 s and over the whole
push-in, and wholly on screen; every plate the search already cleared is the
same framing as before, the CHAPTER tab is never slid, and the phone (390x844,
both games) is approved frame (f) unchanged. Target beside build:
`docs/screenshots/pause-faces-b/sheet-target-vs-build.jpg`.

### Repair (2026-09-24, after the independent verifier)

The verifier refuted "plates that already cleared are unchanged" and found
four regressions. What changed:

- **Only a slid plate is feathered.** At 3840x2160, `framePlate`'s magnify cap
  leaves every plate short of the frame, and the first build feathered all of
  them, the CHAPTER tab too, 538 px deep into the faces. `frameFace` now flags
  the slide (`FramedBox.slid`), and the stage masks only a flagged plate. 4K
  looks as it did before B (`docs/screenshots/pause-faces-b/repair-tidus-3840x2160-no-feather.jpg`;
  the short plate there is the existing CHK-002 defect, not B).
- **The feather stops before the face** (`slideMask` with the face box), so it
  never dims an eye or a chin, whatever the plate's size.
- **B stays within the sheet's bounds**: at least 0.8x of the approved framing
  at the end of the push-in, and at least 8 px of air (the sheet kept 15 to
  16 px; the 0 px step is gone). The further 0.8x below cover is gone. Where B
  as drawn cannot clear a face, the plate keeps the framing it had before
  Bailey's pick. Measured cases that now stay as they were:
  - **FFX-2 Paine at 1280x960 and 1280x720, chapters 5 and 6.** IN THIS FIGHT
    is on her face, as before B
    (`docs/screenshots/pause-faces-b/paine-1280x960-ch5-build.jpg`). Clearing
    her needs about 0.54x, a much smaller head than any frame on the sheet.
    **This is a question for Bailey** (option A, the stack, for this case?).
  - **Every plate at 1024x768 except Kimahri**, and **every plate at 844x390**
    (landscape phone). Both sizes are smaller than any size on the sheet.
    FFX Kimahri at 1024x768 slides within the bounds (0.794x, 16 px). That frame
    was not on the sheet
    (`docs/screenshots/pause-faces-b/repair-kimahri-1024x768-slid.jpg`).
- **A resize on a fixed tab** estimates the new chrome between plain stretching
  and pixel-pinned columns (`faceFramer.estimateBlocks`). Over 270 measured
  size pairs, the estimate misses by 67 px on average instead of 173, and
  calls the slide wrongly 22 times instead of 55. Auron at 1600x900 on
  OPTIONS is no longer slid by mistake. Going back to his tab at 2000 glides
  about 30 px, down from about 130.

Re-measured with real keys, GPU Chromium, port 5601. 54 member tabs at the
brief's three sizes: the same boxes as the first build, and every face clear
at 8 px or more through the whole push-in. The exceptions are Paine in
chapters 5 and 6 at 1280x960, as above. At 3840x2160, 2560x1080, 1280x720 and
1024x768 in chapters 1, 2, 4 and 5, no unslid plate has a mask, no slid plate
is below the floor or has less than 8 px of air, and no feather reaches a
face. The phone (390x844) is unchanged.

**CHK-002 still needs an amendment.** Its live check requires the painting's
box to equal the viewport, and a slid plate fails that by design. Owed to
`critic/` by the driver.

