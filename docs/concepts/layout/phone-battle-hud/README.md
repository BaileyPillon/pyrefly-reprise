# The battle HUD on a phone (390 x 844): three options

**Nothing here is built.** No file under `src/` was changed. These are option frames
(hard rule 9) for the phone battle HUD. The Chapter VII real-key playthrough
(`docs/concepts/chapters/macalania/e2e/size-390x844-03-first-menu.jpg`) found that at
390 x 844 the battle HUD is the desktop layout scaled down: nothing in it can be read,
and a large "HIDE MOVES" tab floats in the middle of the field.

**Game case (rule 14): both.** The battle HUD layout is shared presentation. Each game
keeps its own canon in every option:

- **FFX** shows the CTB turn order (the Act List).
- **FFX-2** has no turn-order list. Its ATB gauge sits on each girl, and Bahamut's next
  move fills the slot where FFX shows the turn order
  (`research/ffx-vs-ffx2-presentation.md` §4.2 and §9 row 3).
- FFX-2 uses the pink accent and anchors its chrome to the other edge (option C).

## Today, measured (`capture/`)

The game ran in our own Vite server (:5700, HMR off) in a GPU Chromium. Each chapter was
entered with `__pyrefly.gotoChapter` (seed 1, cutscenes and prep skipped). After that,
every step used real keys: Enter on the first command, then Escape.

| Frame | Text nodes under 14 px (CHK-003) | Smallest |
|---|---|---|
| Ch. I (FFX, Seymour Flux) at 390 x 844 | 70 of 70 | 2.6 px |
| Ch. IV (FFX-2, Bahamut) at 390 x 844 | 57 of 57 | 2.4 px |
| Ch. I at 844 x 390 (landscape) | 70 of 70 | 4.5 px |
| Ch. IV at 844 x 390 (landscape) | 62 of 63 | 4.2 px |

Two things the numbers do not show:

- The portrait camera leaves only a sliver of Seymour Flux at the right edge
  (`capture/ffx-ch1-03-plate.jpg`).
- When the canvas is given only the field's own rectangle, the same camera frames the
  whole fight: see `capture/*-390x420-03-plate.jpg` and `*-390x560-03-plate.jpg`. Those
  real renders are the fields in options A and B.

## The options (`sheet.jpg`, 1:1; frames in `frames/`)

Every frame is drawn at native phone pixels over the real render, using the real text
of the first command menu (Tidus in Ch. I, Yuna in Ch. IV). `frames/legibility.json`
records the check: every text node in all 14 frames is 14 px or larger, none is clipped,
and no image failed to load.

| | Commands | Party | Turn order | Target step | Advisor / guide |
|---|---|---|---|---|---|
| **A. Bottom sheet** (field 400 px) | Vertical list, bottom left, 42 px rows | Three cards, bottom right: HP, MP, OD or ATB bar | FFX: CTB faces across the top of the sheet. FFX-2: Bahamut's next move | Reticle and plate on the field; the list becomes target rows with HP, plus Back and Confirm | Advisor one line above the commands (tap to hide); guide is a sheet behind GUIDE; FFX enemy move also behind GUIDE |
| **B. Compact rail** (field 520 px) | 2 x 3 grid of 56 px tiles in thumb reach | Three chips above the grid | FFX: CTB rail on top, with the target outlined in it. FFX-2: Bahamut's gauge in the rail, ATB on the chips | Tap on the field; the grid becomes a target card and a Back / Confirm bar | Enemy move under the rail; advisor as a one-line tip with GUIDE beside it |
| **C. Landscape only** | Desktop places, redrawn for 844 x 390: FFX cascade on the left; FFX-2 stack on the right | Slabs, bottom right | CTB top right (FFX); ATB on the rows (FFX-2) | Target card and Confirm replace the stack | Advisor under the top bar; guide behind GUIDE. Upright shows a rotate prompt (`frames/R-*-rotate.jpg`) |

All three drop the floating "HIDE MOVES" tab: the advisor line itself is the toggle.

Touch is the input in all three (tap a row, tap the target again or press Confirm).
The keyboard keeps working the same way.

C is not "the desktop HUD, turned sideways". Measured at 844 x 390, the desktop HUD is
still under the floor (4.5 px), so C needs its own layout too.

## Recommendation: B, the compact rail

- It keeps the largest field of the two upright options.
- Every tap is within thumb reach.
- The turn order (FFX) or the gauges (FFX-2) are always on screen.
- Nothing depends on turning the phone.

A shows more at once, but in FFX the enemy-move line has to move behind GUIDE. C is the
closest to the desktop and the original games, but it makes every phone player turn the
phone, and it still needs a new layout.

## Question for Bailey

**On a phone held upright, which battle HUD should we use: A (bottom sheet), B (compact
rail) or C (landscape only)?** *Recommended: B.*

## Files

- `_capture.mjs` drives the real game and writes the BEFORE frames, the plates and the
  CHK-003 walk to `capture/`:
  `PYREFLY_BROWSER=gpu node docs/concepts/layout/phone-battle-hud/_capture.mjs <port> <chapterId> <tag> [w] [h]`
- `mock.html?opt=A|B|C|R&game=ffx|ffx2&step=menu|target` is the mockup. It links the
  frozen `polish/_kit/kit.css` and never product CSS.
- `_render.mjs` renders every frame and fails if any text is under 14 px.
- `_sheet.mjs` renders `sheet.html` to `sheet.jpg`.
- Faces come from `public/art/portraits/` (local only), with idle crops for Mortiorchis.
