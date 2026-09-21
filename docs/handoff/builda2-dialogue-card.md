# Handoff — track `dialogue-portraits` (Build A.2)

Critic round-06 `PR-0020`, `PR-0056`, `PR-0057`: the cutscene / mid-battle
dialogue card (`src/ui/common/DialogueBox.ts`, `dialogue-box.css`) drew every
speaker portrait larger than its slot, framed Jecht off his face, and crushed
to an unreadable strip under the key-hint bar at phone width. All three are
fixed. Game: **both** (`DialogueBox` is shared plumbing between FFX and
FFX-2 — AGENTS.md rule 14, `critic/CHECKS.md` CHK-020).

Screenshots: `docs/screenshots/builda2/dialogue/` — five speakers at 1600x900
(Jecht, Tidus, Auron, Wakka, Yuna) plus Kimahri at 390x844, all real chapter 2
(`yunalesca`) lines, real keyboard `Enter` taps, `PYREFLY_BROWSER=gpu`.

## PR-0020 — the portrait always fits its slot now

**Root cause was two bugs, not one.** `.dbox__portrait img` forced every
portrait to a fixed `20.83vw` width regardless of the frame's own size (which
is how every speaker overhung it) — but fixing that CSS rule alone did nothing,
because `portrait.ts` watches the whole document for any
`<img src=".../art/portraits/...">` and silently **adopts and re-styles it**
with the square-frame `cropStyle()` system (`refineFaceCrop`, wired through a
capture-phase `load` listener and a `requestAnimationFrame` sweep). That system
is right for the roster tiles it was built for; it was overwriting the dialogue
card's own inline style on the very next frame, which is why the bug survived
even a correct-looking CSS change.

Fix, two parts:

1. `dialogue-box.css`: `.dbox__portrait img` is now `position:absolute; inset:0;
   width:100%; height:100%; object-fit:cover;` — the browser always covers a
   box of any shape with no distortion, so there is no per-portrait width to
   compute and no way to leave the frame's grey background showing as filler.
2. `portrait.ts`: `portraitImgHtml(id, alt, { manualCrop: true })` stamps
   `data-face-crop-manual="1"` on the `<img>`, and `refineFaceCrop` now refuses
   any element carrying it — the one, additive opt-out. Every existing caller
   (`ChapterSelectScreen`, `ResultsScreen`, the roster tiles the sweep was built
   for) is unaffected: nobody else passes `manualCrop`.

`object-position` (where to centre the cover crop) comes from
`portrait.ts`'s new `dialogueObjectPosition(id)`, set as an inline style per
line by `DialogueBox.ts`. It is deliberately **not** the shared `cropStyle()` —
that geometry assumes a square frame (its own doc comment says so) and clamps
its zoom to avoid gaps, which cannot serve a non-square cut-in without either
distorting the art or (for Jecht, see below) failing outright. Plain
`object-fit: cover` needs only *where the face is*, so `dialogueObjectPosition`
supplies `fx`/`fy` and nothing else.

## PR-0056 — Jecht's dialogue framing

Root cause: the shared `face-crops.json` `portraits.jecht` row (`fy 0.2673`)
was never run through the dialogue frame's geometry at all before this round —
it is his nose-bridge shadow, not his eyes, which is how it shipped wrong and
stayed wrong.

Re-measured with `tools/portraits/measure-face-crops.mjs sheet` / `probe`: his
eyes sit at file pixels (312, 42) and (520, 90) of the 832x1216 painting, right
under the headband — `fx 0.5`, `fy 0.0543`. The painting gives him almost no
headroom above them (the topmost ink pixel, hair spikes, is row 0), so the
square-frame zoom-and-clamp system (`portraitCrop`/`cropStyle`) cannot place
his eyes at the house eye line without either an extreme, roster-breaking zoom
or a visible gap — the same reason `tight` rows exist, one step further.

**Fix scope: a new `dialogue` table in `face-crops.json`, not the shared
`portraits` table.** `dialogue.jecht` carries only `fx`/`fy` (no `ipd`, no
zoom math — `object-fit: cover` doesn't need it) and is read by
`dialogueObjectPosition` in preference to `portraits.jecht`. Every other
speaker has no `dialogue` row and falls back to the shared table's own
`fx`/`fy`, which is right for all of them. **The shared `portraits.jecht` row
is untouched** — it belongs to whichever track owns the square-frame roster
tiles, and this brief scoped me to "face-crops.json rows for DIALOGUE framing
only." `tests/unit/ui-portrait-face-crop.test.ts` (that track's guard test)
still passes unmodified.

## PR-0057 — phone width (390x844)

Two independent, additive fixes at the same `@media (max-width: 560px)`
breakpoint:

- `dialogue-box.css`: `.dbox__win` and its children switch from the desktop's
  `vw`-only sizing (which has no floor on the box's *height*, unlike the text,
  which already uses `max(px, vw)`) to a fixed-px phone layout — `min-height:
  124px`, raised to `bottom: 88px`. The portrait shrinks to a 62x82px frame but
  keeps the same `object-fit: cover` rule, so PR-0020's fix covers it too.
- `controls-hint.css`: `.chint` shrinks its font/padding/gap, gets
  `max-width: calc(100vw - 24px)`, and switches `white-space: nowrap` to
  `normal` with `flex-wrap: wrap` — it no longer measures wider than the
  viewport or draws over the card sitting above it.

Verified live at 390x844: `.chint` does not intersect `.dbox__body`, and its
rect is entirely inside `0..390`.

## What I did not touch

`src/ui/common/portrait.ts`'s square-frame system (`portraitCrop`,
`cropStyle`, `faceImgHtml`, the `portraits`/`bodies` tables) is unchanged in
behaviour for every existing caller — the only new surface is the additive
`manualCrop` option and the `data-face-crop-manual` opt-out it sets, which
nothing else uses. `tests/unit/ui-portrait-face-crop.test.ts` (not mine) is
unmodified and green.

## Verification

- `npx tsc --noEmit` clean.
- `tests/unit/dialogue-box-inkgold.test.ts` (mine, extended: 22 tests) and
  `tests/unit/ui-portrait-face-crop.test.ts` (not mine, unmodified): green.
- One `npm test` full-suite run: 4631 passed, 2 skipped, 1 failed
  (`tests/unit/strategy-guide.test.ts` — `seymour-macalania` missing from a
  guide's `bossIds` — unrelated to every file this track touched; left alone
  per "stay inside the files your brief names").
- Real browser pass, `PYREFLY_BROWSER=gpu`, dev server, real `Enter` key
  taps, chapter 2 (`yunalesca`): six speakers, `object-fit: cover` measured
  equal to the slot's own `getComputedStyle` size at every line (no overflow),
  Jecht's eyes visible in frame, phone card readable with the hint bar clear
  of it. Screenshots under `docs/screenshots/builda2/dialogue/`.

## Files

- `src/ui/common/DialogueBox.ts` — per-line `object-position` + `manualCrop`.
- `src/ui/common/dialogue-box.css` — `object-fit: cover` portrait rule, phone
  breakpoint.
- `src/ui/common/controls-hint.css` — phone breakpoint for `.chint`.
- `src/ui/common/portrait.ts` — `portraitImgHtml` options object,
  `dialogueObjectPosition`, `manualCrop` opt-out in `refineFaceCrop` /
  `adoptUntaggedPortraits` / the `load` listener.
- `src/ui/common/face-crops.json` — new `dialogue` table (`jecht` row only).
- `tests/unit/dialogue-box-inkgold.test.ts` — PR-0020/0056/0057 coverage.

---

# Fix pass — the two PR-0020 refutations (2026-09-21)

**FFX and FFX-2, both.** `DialogueBox` and `dialogue-box.css` are one card for
every chapter of both games (AGENTS.md rule 14, `critic/CHECKS.md` CHK-020:
shared plumbing is "both"). The measurements below are taken in chapter 2
(FFX, Braska) *and* chapters 4 and 5 (FFX-2, Rikku and Nooj), and the unit
tests assert both — the FFX case is the absence test for the FFX-2 change and
the other way round.

The verifier refuted the previous pass twice. Both were real, both are fixed at
the root, and each is pinned by a test that fails on the rule it replaced.

## R1 — the counter-skew left two wedges of bare frame

`.dbox__portrait` is a rectangle with **both** `overflow: hidden` and
`transform: skewX(-12deg)`. The clip is applied in the frame's own coordinates
and then skewed with it, so what it clips to is a **parallelogram**. The
previous rule made the `<img>` exactly the frame (`inset: 0` + 100%/100%) and
counter-skewed it `+12deg`, which cancels to an *upright rectangle of the same
width*. An upright rectangle cannot cover a parallelogram of equal width: it
misses a triangle bottom-left and a triangle top-right, each half the shear
wide at the extreme row. Measured at 1600x900: a constant `113,111,112` for 28
px on chapter 2 and 58 px on chapter 4, starting at x=103 — the verifier's own
number.

The `<img>` is now the parallelogram's **bounding box**: half a shear further
left, a full shear wider. Its centre is unchanged, so the two skews still
cancel and the painting still stands upright; at every row it spans the frame's
width plus the lean, which is the smallest upright rectangle that can cover the
clip. The shear is derived, not typed: `--dbox-portrait-h` carries the frame
height and `--dbox-shear: calc(0.21256 * var(--dbox-portrait-h))` (tan 12deg)
follows it, so the phone breakpoint overrides the height alone and cannot
regrow the wedges.

## R2a — the frame's own backing plate, behind a cut-out painting

Fixing the geometry did not clear chapter 4: the flat `113,112,112` band was
still 47 px wide at y=800, under Rikku's braid. The cause is different and was
underneath the first one all along. Every file in `public/art/portraits/` is a
**figure on an alpha canvas**, and `.dbox__portrait` carried
`background: linear-gradient(rgba(11,10,18,.2), rgba(11,10,18,.6))` — invisible
behind an opaque painting, a flat grey field behind a transparent one. PR-0020's
own fix note asks for exactly this: *"remove the placeholder fill behind it"*.
The frame now has no fill; a transparent corner shows the ivory slab the card
is made of, which is what a cut-in standing on the card should show. The
`box-shadow` stays, so the cut-in still casts onto the card.

## R2b — a speaker the fleet has not painted got an empty frame

`portraitImgHtml` answers `''` for a speaker the art manifest says has no
`portraits/<id>.png`, but the `dbox--no-portrait` class was decided from
`portraitId`, which is *truthy for exactly those speakers*. Nooj (chapter 5),
and anyone else unpainted, therefore got the frame with nothing in it, and the
body text stayed indented around art that was never there. The class is now
decided from the markup that was actually produced, and an `<img>` that 404s on
a cold manifest folds the frame too.

## Measured, live, real keys (`PYREFLY_BROWSER=gpu`, dev server, `Enter`/arrows)

Longest run of near-constant dark-neutral pixels across the slot, scanned at
four rows, `critic/scratch/wave1a-quick-wins/scan-wedge.mjs`:

| row (1600x900) | ch.2 before | ch.2 after | ch.4 before | ch.4 after |
|---|---|---|---|---|
| y=800 | 28 px @x=103, `113,111,112` | **0** | 58 px @x=103, `113,111,112` | **0** |
| y=760 | 19 px @x=112 | **0** | 60 px @x=112 | **0** |
| y=700 | 7 px @x=124 | **0** | 15 px @x=88 (off-card, unchanged) | 15 px @x=88 |
| y=600 | 0 | **0** | 13 px @x=101 (off-card, unchanged) | 13 px @x=101 |

The two rows that do not go to zero start **left of the frame** (the slot's left
edge is x=95.6 and the parallelogram's left edge is x=145 at y=600), are
identical before and after, and are the scene behind the card.

Bottom-left wedge region mean, and the fraction of its pixels that are dark and
neutral: ch.2 `96,94,97` / 0.618 → `134,121,111` / 0.024; ch.4 at 390x844
`157,155,152` / 0.638 → `240,222,195` / **0.000**.

DOM readback at every size: slot bounding box `315.3x333.3`, `<img>`
`315.3x333.3` (was `244.5x333.3`) at 1600x900; `79.4x82` / `79.4x82` (was
`62x82`) at 390x844.

Chapter 5, Nooj, 1600x900 **and** 390x844: `dbox--no-portrait` true,
`.dbox__portrait` computed `display: none`, no `<img>` in the DOM.

Screenshots: `docs/screenshots/fix3/quick-wins/` — `ch4-wedge-before-4x.png` is
the defect at 4x, `ch2-card-fixed-1600x900.png` and
`ch4-card-fixed-1600x900.png` are the same cards after,
`ch5-nooj-no-frame-*.png` are the unpainted speaker at both sizes.

## Tests (each fails on the rule it replaced)

- `tests/unit/dialogue-portrait-geometry.test.ts` (new) resolves the two rules
  out of the stylesheet and does the coverage geometry in numbers at 390,
  1280, 1600, 1920, 2000 and 2560 px. Two of its cases feed it the **previous**
  `<img>` rules and require it to refuse them — the frame-sized one by the
  35 px wedge it leaves, the one before that by the width it takes from the
  viewport instead of from the frame. One more asserts the frame declares no
  fill of any kind.
- `tests/unit/dialogue-box-inkgold.test.ts` gains four cases for the unpainted
  speaker (Nooj folded, Tidus and FFX-2 Yuna unaffected, the frame restored on
  the next line, a 404 on a cold manifest folding it). Verified failing against
  the old `!portraitId` toggle before the fix went in: 2 failed, 24 passed.
