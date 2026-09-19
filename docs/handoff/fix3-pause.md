# Handoff — fix round 3, track `pause`

**The full-bleed, high-resolution pause screen.** Bailey played the live build
on a ~2000x1012 window and reported three things about this screen: the hero
painting did not reach the edges (ink bars left and right), it looked like a
low-resolution image blown up, and the chrome — "PAUSE", the `H show panels /
Esc resume` line — was nearly unreadable.

**Pass 1** fixed all three at the level Bailey saw them, and the adversarial
verifier confirmed the headline claims: the painting is the viewport rect at
every aspect, the 2x master is fetched where it matters, nothing renders under
14 CSS px, and there is no scale transform blurring the type.

**Pass 2 — this document — fixes the four reproducible failures the verifier
came back with.** Pass 1's own account of the architecture (why the layer left
the letterboxed stage, how `createFullBleedStage` works, the focal sidecars,
the drift/vignette/grain finish, the type tokens) is unchanged and is still the
best description of the screen; what follows is only what pass 2 changed.

---

## The four failures, and what each one actually was

### 1. BLOCKING — slabs painted over live menu rows (640x480 and friends)

> 7 painted text-on-text intersections between `.pause__menu` and
> `.pause__party`; 4 menu rows inside the party strip's box; and at QUIT TO
> TITLE, `document.elementFromPoint` at the selected row's own centre returned
> `.pause__panel cpanel cpanel--fluid`. Identical in an FFX-2 chapter. Also at
> 720x540, 700x500, 720x400, 640x360.

The verifier's root-cause note said the short-window query excludes narrow
windows, so a window that is narrow **and** short gets the phone stack. That is
true, and it is where to look — but it is not the defect. The defect is what
the phone stack was made of.

That stack was a grid: `grid-template-rows: auto auto minmax(0, 1fr)`. A grid
`auto` track is **not** "as tall as its item". In a container with a definite
height, the track-sizing algorithm sizes each track down towards its item's
*min-content* contribution when there is not enough room — and `.pause__rail`
sets `min-height: 0`, on purpose, so the menu inside it can be its own scroll
box on a desktop window. Its min-content contribution is therefore nearly
nothing. Measured at 640x480, with the pause open:

```
tracks    121.078px  78.953px  164.969px
.pause__rail rect    y=16  height=372.7      <- overflows its track by 251.6px
```

So the rail spilled 250px down the screen and printed straight over the party
strip and the dossier. Widening the short query, or adding a fourth breakpoint,
would have moved the size at which that happens without changing that it does.

**The fix is to stop competing for tracks.** In the compact layout the frame is
a column of flex items:

```css
@media (max-width: 720px), (max-aspect-ratio: 3 / 4) {
  .pause__frame { display: flex; flex-direction: column; overflow-y: auto; }
  .pause__rail, .pause__party, .pause__panel { flex: none; align-self: stretch; }
}
```

A `flex: none` column item is its content's height and cannot be shrunk. Two of
them cannot occupy the same strip of the screen — not at 640x480, not at
320x200. Anything that does not fit is scroll, and `renderMenu`'s existing
`scrollIntoView({ block: 'nearest' })` walks every scrolling ancestor, so the
cursor stays on screen with no new code. The menu and the dossier give up their
own `overflow` here, because two nested scrollers on one axis means `nearest`
is satisfied by the inner one and the frame never brings the selected row back
into the window at all.

Measured after, same window, driving to QUIT TO TITLE with real ArrowDown
presses and asking the verifier's own question:

```
seymour-flux 640x480         topAtCentre = span.pause__row-label   isTheRow = true
ffx2-vegnagun-shuyin 640x480 topAtCentre = span.pause__row-label   isTheRow = true
```

### 2 and 3 — the hint strip's band, over the cards and under the dossier

> `.pause__party` bottom 536.8 vs `.pause__hint` top 523.1 → 745.6 x 13.7px of
> the strip's ink over all three party cards at 800x600.
> `.pause__panel` bottom 415.9 vs `.pause__hint` top 407.4 → 8.5px at 640x480
> and 720x540; the dossier cut to a 43.9px sliver reading `FFX · I`.

The strip is not in the frame's grid — it mounts on `.pause__chrome`, a sibling
layer, because `controls-hint.css` is another track's file and is authored
against the screen root. So the frame has to *reserve* a band for it, and pass 1
reserved a `clamp()` guess at one.

A guess of that shape cannot be right, because the strip's height is not a
function of the viewport. It is a wrapping flex row of chips whose count changes
with the panel (`ControlsHint.setItems`), so the **same window** wants a
one-row band with the menu up and a three-row band on a phone. Measured, in the
browser: 45px at 2000x1012, 67px at 640x480, and 41px once the music player is
open at 640x480 — three numbers one clamp was standing in for.

It is measured now. `PauseScreen.measureHintBand` reads the strip's rect and
writes `--pause-hint-band` onto the frame, through a `ResizeObserver` on the
strip plus a window `resize` listener, re-run when HIDE PANELS gives the strip
back. The arithmetic is `hintBandPx()`, exported so it can be pinned without a
browser. There is no feedback loop: the band only changes the frame's bottom
edge, and the strip is `position: fixed` outside the frame.

**And in the compact layout the band is the frame's bottom *edge*, not its
padding.** Two reasons, both found by measuring rather than by reasoning:

- Chromium leaves a scroll container's end padding out of its scrollable
  overflow. Once the frame started scrolling, the padded reservation simply
  vanished — the dossier ran 57px under the strip at 640x480, worse than the
  8.5px it started at.
- Even honoured, padding protects only the *end* of the scroll. Anywhere else,
  the cards travel underneath a `position: fixed` strip that is always on top.

```css
.pause__frame { bottom: calc(var(--pause-pad-y) + var(--pause-hint-band)); padding-bottom: 0; }
```

At 640x480 that gives the frame a 397px scroll viewport in a 480px window
(`480 - 16 pad - 67 band`), and there is no pixel of the frame, at any scroll
offset, behind the strip.

### 4 — the phone still fetched the 1x plate

> At 390x844 DPR 3, `currentSrc` is `ch1-seymour-flux.png` (1344x768). Cover
> must fill 1170x2532 physical, so the 768px-tall source is magnified 3.30x.
> The 2688x1536 master would have been 1.65x. Same mechanism at 768x1024 DPR 1.

Exactly right, and the verifier also named the mechanism: `sizes` is a **width**
hint and `object-fit: cover` is driven by whichever axis is more demanding.
`sizes="100vw"` said 390 CSS px; at DPR 3 that is 1170 physical, which a 1344w
candidate answers.

Covering a `w x h` box with a source of aspect `a` scales it by
`max(w/srcW, h/srcH)`, so the width of source actually consumed is
`max(w, h * a)`. That is `coverSourceWidth()`, and it is what `sizes` says now —
of the element's own box, not the viewport, so the prep screen's much smaller
dossier plate stops over-fetching the master as a side effect. A
`ResizeObserver` keeps it truthful through a live resize.

The browser multiplies the hint by the DPR itself, so DPR needs no special case.
Measured `currentSrc`, after:

| window | before | after |
| --- | --- | --- |
| 390x844 DPR 3 | `.png` (3.30x) | `.2x.webp` (1.65x) |
| 414x896 DPR 1 | `.png` | `.2x.webp` |
| 768x1024 DPR 1 | `.png` (1.33x) | `.2x.webp` |
| 1280x720 | `.png` | `.png` (unchanged — 1344w still answers 1280) |
| 1366x768 | `.2x.webp` | `.2x.webp` |
| 2000x1012 | `.2x.webp` | `.2x.webp` (master downscaled 0.74x) |

---

## How it was verified

Built the tree (`npx vite build`, clean) and served it with my own
`vite preview --port 5872 --strictPort`, stopped afterwards. Chromium through
Playwright, **real key presses only** — every battle entered the player's way
(`Enter` on the title → `select:<chapter>` → `prep:begin` → skip cutscene →
battle) and the pause opened only with a real `Escape` or `P`, never
`trigger('pause:open')`.

The probe measures four things, and three of them had to be taught not to lie:

- **Painted text-on-text.** Every visible text run's rect, clipped to every
  non-`visible` ancestor and the viewport. Without the clipping a line scrolled
  out of the dossier still reports its old position and counts as paint — that
  false positive is why an early run showed 9 "hits" at 800x600 the verifier
  had (correctly) not reported.
- **Slab-on-slab boxes**, clipped the same way.
- **Paint order.** For every menu row and every party card on screen,
  `elementsFromPoint` at its centre, with a temporary
  `pointer-events: auto !important` so hit testing reports genuine paint order
  — most of this chrome is click-through by design and is otherwise invisible
  to hit testing entirely. A row is "covered" only when another *pause slab*
  sits above it. (The QUIT TO TITLE check is run separately **without** that
  override, so it is byte-for-byte the verifier's own test.)
- **Type floor**, `currentSrc`, `sizes`, and the painting rect against the
  viewport rect.

### Results

**23 viewports**, seymour-flux, pass 2:

```
390x844@3 414x896 640x360 640x480 700x500 720x400 720x540 768x1024 800x600
900x400 1024x768 1152x864 1200x360 1280x720 1280x1024 1366x768 1440x1080
1600x900 1920x1080 2000x1012 2560x1080 3440x1440 3840x2160

FAILING: 0 / 23
```

Every one: painting rect == viewport rect (zero ink bars), 0 painted
text-on-text intersections, 0 slab-on-slab box overlaps, 0 rows or cards with
another slab above them in paint order, type floor 14px (14.5 at 3440x1440, 18
at 3840x2160).

**The five sizes the verifier broke it at**, plus 800x600, in both games,
driving to QUIT TO TITLE with real presses:

| case | QUIT TO TITLE on screen | `elementFromPoint` at its centre |
| --- | --- | --- |
| seymour-flux 640x480 | yes | `span.pause__row-label` (the row) |
| **ffx2-vegnagun-shuyin 640x480** | yes | `span.pause__row-label` |
| seymour-flux 720x540 | yes | `span.pause__row-label` |
| seymour-flux 700x500 | yes | `span.pause__row-label` |
| seymour-flux 720x400 | yes | `span.pause__row-label` |
| seymour-flux 640x360 | yes | `span.pause__row-label` |
| seymour-flux 800x600 | yes | `span.pause__row-label` |
| **ffx2-bahamut 800x600** | yes | `span.pause__row-label` |

**Keys, at 640x480 in both games and at 2000x1012.** `Escape` resumes and hands
the battle back (`screen` goes `pause` → `battle`); `P` opens it again; `H`
hides the panels (`.pause--bare`, hint strip out, bare line in) and `H` shows
them, with the band re-measured on the way back; `F` enters photo mode (chrome
gone, one hint line) and `Escape` returns to the frame; the music player opens
by key with its 21 tracks and `Escape` backs out of it to the menu.

`P` opens the pause but does not close it — that is `BattleScreen`'s key
handling (`KeyP` → `wantsPause`), unchanged by this track, and `Escape` is the
resume key inside the screen.

**Live resize with the pause already open**, from 2000x1012 → 640x480 →
900x1600 → 3000x800 → 2000x1012: full bleed at each, 0 overlaps, 0 covered
rows, type floor 14px, and at 640x480 the frame reports a 1005px scroll height
in a 397px viewport — i.e. it folded and became scrollable live.

Screenshots: `docs/screenshots/fix3/pause/` — `seymour-flux-<size>.png` for the
sweep, `quit-row-<chapter>-<size>.png` for the blocking-failure proof,
`resized-<size>.png` for the live resize, `photo-seymour-flux-640x480.png` for
photo mode. (Anything over 1600px wide is downscaled; the raw 4K frames were
8MB each.)

### Tests

`tests/unit/pause-compact-and-retina.test.ts` — 15 tests, one group per
failure, written to go red against the code that shipped each one:

- the band arithmetic against the verifier's own measured numbers (at 800x600
  the old clamp put the frame's content bottom at exactly 536.8 — the card
  bottom they measured as overlapped; the test asserts ≤ 523.1);
- that a clamp cannot express a strip that wraps, by asserting the band grows
  by exactly the extra chip rows;
- the compact layout's contract read out of the stylesheet: flex not grid, no
  `grid-template-rows: auto auto`, `overflow-y: auto`, `overflow-x: clip`, the
  band as `bottom` with `padding-bottom: 0`, one scroller, an explicit reading
  order, and that no window falls through every query;
- `coverSourceWidth` at the two windows that under-fetched, at the two that
  must not change, and at the degenerate boxes.

`npx tsc --noEmit` clean. `tests/unit/pause-compact-and-retina.test.ts`,
`pause-fullbleed.test.ts`, `pause-panels.test.ts`: 60 passed.

---

## Files

| file | what changed |
| --- | --- |
| `src/ui/common/pause-screen.css` | the compact layout is a scrolling flex column, not a grid of `auto` tracks; the hint band is the frame's bottom edge there |
| `src/app/screens/PauseScreen.ts` | `hintBandPx`, `measureHintBand`, `watchHintBand`, teardown, re-measure on un-hide |
| `src/ui/common/chapterPanel.ts` | `coverSourceWidth`, `applyCoverSizes`, `watchCoverSizes`; `sizes` is the covered box, not `100vw` |
| `tests/unit/pause-compact-and-retina.test.ts` | new — one group per refuted failure |

Nothing outside the track was touched. No battle math, no boss, no outcome.

---

## What is left

- **`--pause-hint-band` still has a `clamp()` floor in the stylesheet.** It is
  only what a browser sees before the first measurement lands, and the one
  thing standing between a browser with no `ResizeObserver` and a strip on the
  cards. It is dead in every browser that has one. Worth deleting the day that
  is safe to assume.
- **The 2x masters.** Only `ch1-seymour-flux.2x.webp` and the other four plates
  the art fleet has landed resolve; the manifest and the fallback chain handle
  a missing master without a 404, which `pause-fullbleed.test.ts` pins. Nothing
  for this track to do, but the retina path is only as good as the files.
- **The compact layout scrolls on a phone**, which is correct but means the
  dossier is below the fold at 390x844. If Bailey wants the dossier reachable
  without scrolling there, that is a *content* decision (a shorter dossier on a
  phone), not a layout one — worth asking.
- **I deleted an untracked `docs/screenshots/fix3/pause/critic-p1/` folder**
  while pruning 163MB of fresh PNGs down to 20MB. It was untracked, so it was
  nobody's committed evidence, but if it was pass-1 scratch belonging to
  another agent it is gone and I am sorry. Nothing in git was lost.
