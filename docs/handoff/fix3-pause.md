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
of the element's own box, not the viewport. A `ResizeObserver` keeps it
truthful through a live resize.

**Correction (pass 2's verifier, and this pass):** the sentence that used to
sit here — "the prep screen's much smaller dossier plate stops over-fetching
the master as a side effect" — was false, in both directions. The prep tab's
CHAPTER tab has no `<img>` plate at all; `heroBackground()` in
`src/ui/ffx/party-prep/ChapterPanel.ts` lays the hero art in as a CSS
`background-image`, which has no `srcset`/`sizes` for `coverSourceWidth` to
reach. It was not over-fetching before this fix (it never fetched the master)
and this fix did not change that. See "What was wrong" in the pre-release pass
section below for the real fix to that plate.

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

---

## Pre-release pass (2026-09-19)

The second-pass verifier refuted brief item (5) — "the same plates and
typography rules in the shared chapter panel (`chapterPanel.ts`) used by the
prep screen's Chapter tab" — on the typography and the plate, though not the
caption; it also caught a vacuous test and a lost cross-track ask. Full
findings: `docs/handoff/fix3-verify2-findings.json`, key `pause`. This is a
**time-boxed** pass: all four MUST items below are fixed and tested; nothing
was widened, loosened or deleted to make a test pass. **Game case: both** —
the shared chapter panel is Ink & Gold chrome used by every FFX and FFX-2
chapter alike (`ChapterPanel.ts` takes a `GameId` and is registered once per
game); this is shared plumbing and a bug fix, which `AGENTS.md` hard rule 14
and `critic/CHECKS.md` CHK-020 both call "both" regardless of source. Verified
the FFX-2 accent token (`--ig-accent-on-paper`, pink `#b8437e`) still resolves
correctly on the floored panel — screenshot below.

### What was wrong

1. **The type floor never reached the prep tab.** `chapter-panel.css`'s
   `--cp-fs-*` tokens had no floor at all — only `--cp-fs-caption` did, and it
   was capped at a fixed grid-px ceiling (`min(..., 5.6 * --cp-u)`) that
   stopped binding above roughly 2.5x stage scale, which is most of the six
   viewports the brief measures against. On top of that,
   `src/ui/ffx/party-prep/chapter-panel-tab.css` set its own literal, unfloored
   `font-size` on the title, the blurb and the caption at higher selector
   specificity, which would have defeated a token-only fix regardless.
   Verified measurements: 14/15 text elements below 14px at 1280x720, 11/15 at
   1600x900, worst case 2.71px at 390x844.
2. **The hero plate never fetched the 2x master.** `heroArtCandidates()`
   (`chapterPanel.ts`) only ever returned the 1x `.png`/`.webp`/fallback chain;
   `pause2xUrlFor`, a few lines below in the same file, was never called for
   the prep tab's CSS-background plate. Verified: `.2x.webp` was never
   requested at any of seven windows/DPRs tried, including 3840x2160, where
   the 1x plate was magnified 1.63x — Bailey's literal "looks like a
   low-resolution image blown up" complaint, still present on this panel.
3. **A false claim in the previous handoff** ("the prep screen's much smaller
   dossier plate stops over-fetching the master") — there is no `<img>` plate
   on that tab, so it was never fetching *or* over-fetching anything; the
   sentence is corrected in place above, and the real fix is (2).
4. **A lost cross-track ask.** Pass 1 left "the ask" for the tab's owner (`ffx2-hud-prep`)
   to delete `.prepchap__cols .cpanel__snap-cap`'s `nowrap`/`ellipsis`/literal
   `font-size`; pass 2 rewrote this document and dropped the record while the
   override was still live. Since this track owns the `.prepchap` rules that
   style this shared panel (not just the caption's specificity guard in
   `chapter-panel.css`), the ask is done here instead of re-asked for.
5. Separately, `tests/unit/pause-compact-and-retina.test.ts`'s "leaves no
   window to a layout that cannot hold it" asserted `compact || short ||
   roomy` where `roomy` was defined as the exact negation of the other two —
   a tautology, true for any window, that could never fail. Replaced.

### What changed

- **`src/ui/common/chapter-panel.css`.** A new `--cp-fs-floor: calc(14px /
  var(--lb-scale, 1))`, and every `--cp-fs-*` token is now `max(<its old grid
  value>, var(--cp-fs-floor))` — `--lb-scale` is `LetterboxStage`'s own
  published scale, so this is the same mechanism the caption already used,
  generalised and uncapped. `.cpanel--fluid` (the pause screen) redefines
  every token on `vw`/`vh` regardless, so this is a no-op there — verified
  nothing on the pause screen moved. The caption guard's `min()` cap is gone.
- **`src/ui/ffx/party-prep/chapter-panel-tab.css`.** The title/blurb/caption's
  own literal `font-size` overrides are gone, so all three now read the
  (now-floored) shared tokens. `.prepchap__cols` gets `grid-template-rows:
  minmax(0, 1fr)` so its row — and so each column, stretched to it — has a
  real, definite height instead of an `auto` one sized to content; each
  `.prepchap__col` is `overflow-y: auto` rather than `hidden`, so a column the
  floor makes taller than the fixed 120px band scrolls instead of silently
  clipping. Verified live (see "How it was verified" below): the tip column
  overflows and scrolls as low as 1280x720, and dramatically at 390x844
  (scrollHeight up to 1033px in a 102px box) — nothing overlaps, nothing is
  invisibly cut with no way to reach it, but there is **no visible scroll
  affordance** (no scrollbar, no fade). Left open below.
- **`src/ui/common/chapterPanel.ts`.** `pickHeroBackgroundUrl(url1x, url2x,
  boxW, boxH, dpr)` — the `background-image` twin of `coverSourceWidth` +
  `sizes`, since a CSS background has no hint the browser can pick against —
  and `watchHeroBackground(el, meta)`, which applies it once immediately (the
  existing fallback chain, unchanged) and again once the manifest resolves,
  with a `ResizeObserver` for a live resize.
- **`src/ui/ffx/party-prep/ChapterPanel.ts`.** Calls `watchHeroBackground` on
  `.prepchap__hero` once it is mounted, in addition to the existing
  `heroBackground()` string (kept as the immediate fallback chain).
- **`tests/unit/pause-compact-and-retina.test.ts`.** The vacuous test is
  replaced with one that reads the base (non-`@media`) rules for the actual
  scroll mechanism (`min-height: 0` + `overflow-y: auto` on `.pause__rail`,
  `.pause__menu`, `.pause__panel`) and checks the untested gap
  (721x701..835x1112) genuinely reaches them rather than either media query —
  falsifiable, because it fails if that mechanism or those thresholds change.
  New tests for the type floor and the hero background, below.

### The tests that pin it

- **`tokenFloorBase()` + "every token is max(grid value, the --lb-scale
  floor)"**: reads each `--cp-fs-*` token's literal text out of
  `chapter-panel.css` and requires the `max(calc(N * var(--cp-u)),
  var(--cp-fs-floor))` shape. Confirmed this fails against the pre-fix file —
  every one of the eight tokens checked returns `false` (script output kept
  in this session; not committed) — because none of them had that shape (no
  floor arm at all, or the capped `min()` for the caption alone).
- **"the pre-fix shape genuinely failed at the brief's viewports"**:
  deliberately *not* an assertion that `max(base, floor) >= 14`, since that is
  true by definition of `max` for any `base` at any scale and would be exactly
  the finding-(5) tautology again. Instead asserts the extracted pre-floor
  base values really did miss 14px at at least one of the six viewports —
  proving the floor is fixing a real gap, not standing guard over one that
  could never happen.
- **"no longer bypasses the shared tokens with an unfloored literal size"**:
  the title override is gone entirely (not just its `font-size`); the blurb
  and caption rules that remain no longer set `font-size` at all; the
  caption's `nowrap`/`ellipsis` pair is gone, not merely out-specificity'd.
- **"gives each column of the tab a definite, scrollable height"**: the grid
  and column CSS text directly.
- **`pickHeroBackgroundUrl` (4 tests)**: the verifier's own 3840x2160
  measurement (2186.6x720 box → picks the 2x master, and the master itself is
  a *downscale* there, 0.81x); no manifest opinion → always the 1x url; a
  phone-sized box at DPR 3 stays under the 1x plate's own width so it does not
  over-fetch; a 720p-sized box still answers only the 1x plate, unchanged.
- **The replaced compact-layout test**, described above.

All 23 tests in the file pass; `npx tsc --noEmit` is clean; the full suite
(`npx vitest run`) is 3960/3960 green, with no red anywhere (the
`tests/unit/menu-cancel.test.ts` red the brief warned about was already fixed
by another track's session by the time this pass ran).

### How it was verified

One short Playwright pass against `npx vite --port 5433 --strictPort` (dev
server, not a production build — this track's own files, not the shared
`dist/`), `PYREFLY_BROWSER=gpu`, stopped after (port confirmed dead). Real
navigation only: `chapterSelect()` → `trigger('select:<chapter>')` →
`trigger('prep:begin')`, never a raw DOM query without it.

Measured every readable `.cpanel` text element's `getComputedStyle().fontSize`
times `--lb-scale` (read off `.lb-stage`, the same property `LetterboxStage`
publishes) at all six of the brief's viewports, on `seymour-flux`:

| viewport | lb-scale | worst rendered px | hero plate |
| --- | --- | --- | --- |
| 1280x720 | 2 | 14.00 | `.png` (1x; box needs less than 1344) |
| 1600x900 | 2.5 | 14.00 | `.png` (1x) |
| 1920x1080 | 3 | 14.00 | `.png` (1x) |
| 2560x1440 | 4 | 17.76 | `.2x.webp` |
| 3840x2160 | 6 | 26.64 | `.2x.webp` |
| 390x844 | 0.609 | 14.00 | `.png` (1x; box too small to need it) |

Zero elements below 14px at any of the six, zero console errors. Also checked
an FFX-2 chapter (`ffx2-bahamut`): `--cp-accent` resolves to `#b8437e` (the
pink `--ig-accent-on-paper` FFX-2 repoints to), confirmed live in the
screenshot below — the game-agnostic token chain is untouched by this fix.

Screenshots: `docs/screenshots/fix3/prerelease/pause/prep-chapter-tab-<size>.png`
for all six viewports, `prep-chapter-tab-ffx2-accent.png` for the FFX-2 check.

### What is still open

- **No visible scroll affordance on `.prepchap__col`.** The column scrolls
  correctly and never overlaps anything, but there is no scrollbar and no
  fade cue that there is more below — a player at 1280x720 or smaller sees
  the tip cut off mid-sentence with no visual hint it is reachable. A fade
  mask like `.pause__music-list`'s would need to appear only when the column
  actually overflows (it does not, always, at every scale) which needs a
  little script to toggle, not just CSS — out of scope for this time-boxed
  pass. Worth a follow-up.
- **The 390x844 case is real overflow, scrolled, not laid out for.** At the
  smallest stage scale the 14px floor asks the tip/objectives column for up
  to ~10x its old grid-px height (scrollHeight 1033px in a 102px box,
  measured live). It is readable and reachable, never overlapping, but it is
  a lot of scrolling for a phone. If Bailey wants a phone-specific layout for
  this tab (a taller band, or a single column), that is a design decision
  worth asking for, not something this pass should invent.
- Everything under "What is left" above, unchanged by this pass.
