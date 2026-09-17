# Polish pass — `presentation-polish`

Owner: presentation-polish agent, 2026-09-16. Scope: chapter select, the
narration variant of the dialogue box, and the party-prep portrait crop.
Everything here follows `docs/handoff/presentation-ink-and-gold.md`; no battle
file, no `public/art/**`, no `src/engine/**` was touched.

Before / after: `docs/screenshots/41-chapter-select.png`,
`43c-cutscene-narration.png`, `42-party-prep.png` →
`docs/screenshots/polish/chapter-select.png`, `narration.png`,
`party-prep.png` (plus `chapter-select-alt.png`, `chapter-select-ffx2.png`,
`dialogue-speaker.png` and `roster-crop.png`, a 2x crop of the roster column
used to check the eye line).

## 1. Chapter select — the right fifth of the frame was empty

`src/app/screens/ChapterSelectScreen.ts`, `src/ui/common/chapter-select.css`.

The board was a hero slab and a 2x2 card block hard against the left, an ivory
info slab 400 wide under them, and nothing at all from x≈545 (logical) to the
right edge. Rebalanced into three columns that all bottom out on the same line
(logical y≈300):

- **Left** — hero slab, slightly larger (257.78 x 148.44, was 248.89 x 149.33)
  at left 26.67, and the ivory info slab under it, same width as the hero so
  the column reads as one block. The slab now carries the chapter's
  **subtitle** in the serif (30px on the 1440 grid) and the **blurb** — the
  two-to-three sentence chapter-select copy in `encounters.ts` that nothing had
  ever shown — in Exo 2, clamped to four lines. The chapter name is not
  repeated here; the hero above it is already 64px of it.
- **Middle** — the four unselected chapters as a single column of 128 x 55.11
  cards (`CARD_SLOTS` is now one x, four y). Fixed slots as before: choosing a
  chapter swaps which painting is in the hero, nothing slides.
- **Right (new)** — `.cselect__aside`, an ink dossier slab (174 x 241.78 at
  left 440) holding **LOCATION**, **BOSS**, **PARTY** and **BEST**, which used
  to be a cramped meta row inside the ivory slab. Same -8deg skew as every
  other slab, accent on its outer (right) edge, mirroring the gold that sits on
  the ivory slab's left. Ink .84 alone is invisible against this backdrop's
  dark right side, so it carries a 0.16-alpha ivory hairline and a slight
  vertical gradient.
  - PARTY is three 41.78px portrait tiles with tracked names under them — the
    chapter's FFX active slots, or the FFX-2 trio. A member with no painting
    yet (Paine) falls back to the initial, see `chapter-select-ffx2.png`.
  - BEST is Rajdhani numerals when the chapter is cleared, and a tracked
    `NOT CLEARED` at 45% otherwise, so an unplayed save has no dead numeral.

`recommendedParty()` now returns `{id, name}` records rather than a joined
string (the tiles need the ids); `bossNames()` is unchanged.

## 2. Narration dialogue — bottom-aligned in an oversized empty box

`src/ui/common/dialogue-box.css` only; `DialogueBox.ts` was not changed.

`.dbox__win` is a fixed 900x190 slab with a bottom-anchored body, which is
right for a two-line spoken line with a portrait cut-in beside it and wrong for
Tidus's one-sentence retrospectives: the line sat in the bottom-left corner of
a mostly empty plate. The `--narrate` rules at the foot of the file now:

- centre the plate in the frame with `left`/`right` (**not** a transform — the
  window must stay untransformed; the skew belongs to the two plates, and
  `tests/unit/dialogue-box-inkgold.test.ts` asserts it),
- drop the fixed height and put the body back in flow (`position: relative`,
  padding 2.85vw x 5.2vw) so the plate is as tall as its own text,
- centre the text and set it in Cormorant Garamond bold italic at 2.15vw
  (31 on the 1440 grid), per the spec's serif role,
- hang the advance triangle inside the plate's right end instead of at the
  mockup's fixed x.

The body stays *positioned* (relative, not static) on purpose: the ivory slab
is absolute and first in the DOM, so a static body paints underneath it and the
line vanishes. The spoken variant is untouched — `dialogue-speaker.png` is the
regression shot.

## 3. Party prep — inconsistent portrait crops

`src/ui/common/portrait.ts` (new head-crop table), `PartyPrepScreen.ts`.

The tiles were `object-fit: cover; object-position: 50% 8%` on paintings that
were generated one character at a time, so every head landed at a different
size and height: Tidus filled his tile, Auron was a head-and-shoulders two
sizes down, Kimahri's muzzle was shoved to the left edge.

`portrait.ts` now owns a measured `CROPS` table — for each portrait, the
midpoint between the eyes (`fx`, `fy`), the eye-to-eye distance as a fraction of
the file's width (`ipd`, the scale handle) and the file's aspect. The new
`faceImgHtml(id, alt, opts)` turns that into inline percentage geometry that
places the painting so every face renders at the same head scale
(`TARGET_IPD = 0.3` of the frame) with its eyes on the same line
(`TARGET_EYE_Y = 0.42` down the frame). It needs a **square** frame with
`overflow: hidden`; `.prep__face` and the new `.cselect__face` are both square.

`portraitImgHtml` is unchanged and still used by `DialogueBox` (a 220x300
cut-in, not a square head tile) and by `ResultsScreen`, which this agent does
not own — **its 48px per-member faces still use the old uncropped path and will
still look mismatched**. One line each in `ResultsScreen.ts` (line ~224) swaps
them over, if its owner wants it.

They are art data: if the art fleet re-rolls a portrait, that row needs
re-measuring. An id with no row gets `DEFAULT_CROP` (the roster average), so a
missed row is a slightly-off crop and never a broken one.

### 3a. Second pass — the rows are now measured, not estimated

The first cut of the table was measured by eye off the PNGs, which got the
roster close but left Lulu's head small and low, Auron's small, and Wakka's and
Rikku's oversized. This pass replaced the eyeballing with a **calibration rig**:
each portrait rendered through the very geometry `faceImgHtml` uses, into a
600 px reference tile, with the target eye line and the target eye-to-eye ticks
drawn on top — so a row is right when the pupils land on the crosshairs, and the
error is a number of pixels rather than an impression. Four rounds converged
every FFX party row to within ~1 % of the tile, which is a third of a pixel at
the 42 px tile they actually render at. Two lessons worth keeping:

- For a **rolled** head (Wakka ~25°, Lulu ~18°) the eye *midpoint* carries the
  line and the *diagonal* eye-to-eye distance carries the scale; the horizontal
  projection alone reads the head as smaller than it is.
- For a **turned** head (Kimahri, Seymour, Shuyin, Lenne) only one eye is on
  camera, so `fx`/`ipd` are the human-equivalent values that land the head at
  the roster's scale, not literal pupil measurements, and the visible eye sets
  the line.

The five boss / FFX-2-ghost rows (`seymour`, `yunalesca`, `jecht`, `shuyin`,
`lenne`) were placeholders — `fx: 0.5, fy: 0.33, ipd: 0.25`-ish for every one of
them — and rendered about five times too zoomed, because those paintings are
looser shots than the party's tight close-ups and their heads sit much smaller
in the file. Nothing renders them through `faceImgHtml` *today*, so the defect
was latent; they are now measured through the same rig (three rounds) and sit at
the roster's head scale. `DEFAULT_CROP` was re-derived as the mean of the seven
calibrated party rows.

The rig is throwaway (it lived in this agent's scratchpad, not in `tools/`): it
is ~40 lines that build a page of tiles with guides, route it through the dev
server so the paintings load same-origin, and screenshot it. Rebuilding it is
cheaper than maintaining it, but the *method* is the thing to repeat — do not go
back to eyeballing a crop.

## 4. PartyPrepScreen split (495 → 372 lines)

`src/app/screens/PartyPrepContent.ts` is new: `faceHtml`, `rosterHtml`,
`slotsHtml` and `statSheetHtml`, all pure `build -> HTML`. The screen keeps the
frame, the cursor, the tab routing and the flow contract. Markup, class names
and `data-action` names are identical, and the prep test suites pass unchanged.

## Verification

- `npx tsc --noEmit` — clean for every file in this pass. (It reports
  `src/ui/ffx2/BossGauges.ts(61,20): TS6133`, another agent's in-flight file.)
- `npx vitest run` on `dialogue-box-inkgold`, `party-prep-inkgold`,
  `party-prep-panels`, `ui-ffx-party-prep`, `ui-ffx2-party-prep` — 57 passed.
- Visual: own dev server on :5208, captures driven through `window.__pyrefly`
  with the HMR socket stubbed (other agents were saving files throughout).
- Second pass re-ran `npx tsc --noEmit` clean after the crop table was
  recalibrated, and re-captured all three verification shots plus
  `roster-crop.png` (now a 2x device-scale crop of the roster column, which is
  what the eye line is actually checked against).

**Stub the HMR *socket*, not the client module.** Routing `**/@vite/client` to
an empty module looks like it blocks reloads and instead stops the app booting
outright — in dev, every transformed module imports `createHotContext` from it,
so the page dies with "does not provide an export named 'createHotContext'" and
`__pyreflyReady` never arrives. `tools/screenshot.mjs` gets this right: leave
the client module alone and stub only the WebSocket opened with the `vite-hmr`
sub-protocol. Copy that block rather than reinventing it.

## Notes for whoever picks this up

- The chapter-select screen keeps the gold accent on FFX-2 chapters. The spec
  swaps the accent to `--pyre-pink` "for the whole accent role in FFX-2
  chapters"; toggling `.ig--ffx2` on the stage per selected chapter would do
  it, but it repaints the whole screen's accent as the cursor moves, so it is
  deliberately not done here — a call for Bailey.
- The dossier distributes its four blocks with `space-between`; if a location
  or boss list ever runs to three lines the gaps close up rather than
  overflowing, but nothing clamps them.
- `faceImgHtml` inherits `portraitImgHtml`'s `onerror="this.remove()"`, which is
  right for a portrait that does not exist yet (Paine) but also swallows a
  *transient* load failure: one capture during this pass came back with Rikku
  reduced to her initial while `art/portraits/rikku.png` was serving 200 the
  whole time, and the next capture was clean. Harmless in play (the tile falls
  back to the initial), but if a screenshot ever shows one letter where a face
  should be, re-shoot before believing it.
- `ResultsScreen.ts` (not this agent's file) still draws its 48 px per-member
  faces through the old uncropped `portraitImgHtml`. Now that every row in the
  table is measured, switching that one call to `faceImgHtml` is the last place
  the roster looks mismatched.
