# Results on a phone, option B (PR-0001), branch `r21-results-phone`

**Game case: both.** `ResultsScreen` is shared plumbing. Each game keeps its own accent:
FFX gold, FFX-2 pink (`.ig--ffx2`). A defeat has no accent (paper), and Chapter IV's
silent page stays drained. One FFX-2-only detail: a loss prints each girl's `LV n`,
where FFX prints `S.LV n` (see "Choices the mock left open").

**The pick.** Bailey, 2026-09-26: "I'll go with all of your recommendations". Results on
phones is option B: "the painting fills the phone, numbers at 14 px or more, CONFIRM
under your thumb, one screen."

- Target: `docs/concepts/phone-2026-09-26/pr0001-victory-B.jpg` and `pr0001-defeat-B.jpg`.
- Mockup source: `results-mock.html?v=B`.

## What changed

On an upright phone the page leaves the 640x360 letterbox and fills the screen.
"Upright phone" means `PHONE_BATTLE_QUERY`, `(max-width: 599px) and (orientation: portrait)`,
the same test the phone battle HUD uses.

- **Painting.** The victory portrait, or on a defeat the leader's fallen pose (grayscale,
  brightness 0.45), fills the screen.
- **Face-safe crop.** `phoneHeroBox` reuses the measured `face-crops.json` rows through
  `coverCropBox`:
  - The eyes are centred across the screen.
  - The eye line sits at 0.34 of the height, never lower than 0.42, so it stays above the title.
  - A portrait painted with low eyes (FFX Rikku) is zoomed just enough to meet that.
- **Title.** RESULTS · clock chip top left and the chapter caption down the right edge.
  The title sits over the painting with its rule and tags.
- **Ink tallies.**
  - FFX-2 win: EXP, AP, GIL, ITEMS.
  - FFX win: AP, GIL, ITEMS.
  - Loss: TURNS, ATTEMPTS, BEST.
- **Party chips.** A win shows the gain, plus the level gained beside it. A loss shows the level.
- **Dock.** CONFIRM (win), or RETRY / CHAPTER SELECT (loss), 58 px tall and pinned at the
  thumb. The defeat cursor lights one slab and the other becomes the ghost slab.
- **Dropped on phone only:** the per-member dressphere / AP detail line.
- **Fit.** One screen, no scroll. Every text is 14 px or more.
- **Other windows.** Desktop, landscape and anything wider than 599 px keep today's page
  unchanged.
- **Turning the phone.** Turning the phone with the results up swaps the page both ways.

## Files

- `src/ui/common/resultsPhone.ts`: the phone page (query, hero crop, markup).
- `src/ui/common/results-phone.css`: every rule is scoped under `.rres--phone`.
- `src/ui/common/resultsPage.ts`: the page model and the desktop markup. These were moved
  out of `ResultsScreen.ts` unchanged, and the file is now under 400 lines.
- `src/app/screens/ResultsScreen.ts`:
  - `mountStage()` picks the letterbox or the full-bleed stage.
  - It listens to the query and to resize.
- `src/ui/common/resultsMath.ts`: `ResultsMemberRow.standing` (additive), `S.LV n` or `LV n`.
- `tests/unit/results-phone.test.ts`: 17 tests.

## Evidence (`docs/screenshots/results-phone-B/`)

Target and build side by side:

- `side-by-side-victory.jpg`: FFX-2 Chapter XI win.
- `side-by-side-defeat.jpg`: FFX Chapter I loss.
- `side-by-side-defeat-ffx2.jpg`: FFX-2 Chapter XI loss.

How the real runs were played:

- Each outcome was reached with `__pyrefly.gotoChapter` (debug API, labelled on the
  frames): the `intended` strategy for a win and `defend` for a loss.
- The results screen itself was driven by real input:
  - A win: a touchscreen tap on CONFIRM.
  - A loss: ArrowRight lights CHAPTER SELECT (`*-2-arrow-right.jpg`), ArrowLeft goes back,
    and a tap on RETRY starts the battle again.
- Measurements are in `*-check.json`.

Fixture screens (the debug demo screens) at three phone sizes:

- `fixture-*-{390x844,375x667,360x780}.jpg`, measured in `fixtures-check.json`.
- `turn-sideways-844x390.jpg`: the phone turned mid-screen.

**Desktop is unchanged.** Five demo results screens were captured on main `ce05b02c`
and on this branch, at 1600x900 and at 844x390 landscape. The numbers are in
`desktop-unchanged.json`, with two frames in `desktop-unchanged-*.jpg`.

- 7 of the 10 frames are identical.
- In the other 3, at most 26 pixels differ, by at most 2 of 255. That is glyph
  antialiasing noise on the title.

**Full unit suite:** 8330 passed, 29 skipped (the four skipped files are not new).

## Choices the mock left open (inferred, for Bailey to confirm)

- **FFX-2 loss chip: `LV 46`.** The mock's defeat was FFX (`S.LV 180`). An FFX-2 girl's
  analogue is her level, from the chapter build. The dressphere name the mock's code would
  have printed clipped to "WHITE M…".
- **Victory quip.** The quip (for example "...Okay. Next one.") is kept under the rule in
  18 px serif. The mock's Chapter XI win had none.
- **Level gained.** A level gained sits on the chip beside the gain (`+1 S.LV`, accent),
  or under it where the chip is narrow.
- **Short phones.**
  - The three gaps and the title shrink with the height (42 / 33 / 84 px at 844).
  - The chip face and name shrink a little under 390 px wide.
  - On a very short page (a four-member FFX win at 375x667) the vertical caption steps
    aside instead of breaking into a column per word.
- **Long captions** wrap into a second vertical column (Chapter I, Evrae).
- **Long ITEMS lists** span both columns and clamp at two lines.

## Not done here

This branch is not pushed or deployed, and NOW.md, decisions.json and critic/ were left
to the driver.
