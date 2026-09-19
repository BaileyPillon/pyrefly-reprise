# Handoff — fix round 3, track `pause`

**The full-bleed, high-resolution pause screen.** Bailey played the live build
on a ~2000x1012 window and reported three things about this screen: the hero
painting did not reach the edges (ink bars left and right), it looked like a
low-resolution image blown up, and the chrome — "PAUSE", the `H show panels /
Esc resume` line — was nearly unreadable.

All three were the same root cause wearing three hats, plus one asset fact.

---

## What was actually wrong

`PauseScreen` mounted through `createStage(root, 'pause')`, the shared
**640x360 letterbox** every other screen uses (`src/ui/common/LetterboxStage.ts`).

1. **The bars.** A 640x360 stage is 16:9. `.pause__art` is `inset: 0` *of the
   stage*, so on a 1.976:1 window the stage was 1799px wide inside 2000px and
   the painting stopped 100px short of each edge. The "PAUSE" chip Bailey could
   see top-left is `BattleScreen`'s `.battle-pause-chip` showing through that
   left bar — it was never meant to be visible with the menu up.
2. **The "low-resolution image".** Two separate things. The stage's
   `transform: scale(2.81)` meant every glyph on the screen was rasterised at
   640x360 and resampled up; Chromium composites a scaled layer from one
   rasterisation, so no font-size could have fixed it. And the plates
   themselves are 1344x768, which is genuinely being magnified past ~1400 CSS px.
3. **The tiny chrome.** `pause-screen.css` was authored in grid px
   (`font-size: 5.33px /* 12 */`) and `controls-hint.css`'s strip is 12 device
   px. At the letterbox scale the dossier body copy came out at 10.7 CSS px.

## What changed

### 1. The layer escapes the stage

`LetterboxStage.ts` gains **`createFullBleedStage(root, className)`** — the same
`{ el, stage }` shape, `position: absolute; inset: 0` on the inner element, no
640x360 grid and **no transform**. `layout()` is a no-op; CSS does the work.
It keeps the `lb-stage` class and the `<name>__stage` class so photo mode's
`[data-photo='on']` rule and `tests/e2e/pause.spec.ts`'s selectors are unchanged.

`.pause` is now `position: fixed; inset: 0; z-index: 60`, so the painting is the
window at any aspect. `.pause__chrome` (the hint strips, which mount on the
screen root) is `fixed` too.

### 2. Resolution contract with the art track

- `public/art/pause/<id>.png` stays the **1344x768 fallback**.
- `public/art/pause/<id>.2x.webp` is the **2688x1536 master**.
- `tools/gen/manifest.mjs` scans for `<stem>.2x.webp` and writes
  **`pause2x: string[]`** into `public/art/manifest.json` — only for stems that
  *also* have the 1x PNG, so a half-landed render can never leave a browser
  with nothing. `tools/gen/manifest.d.mts` and `src/engine/ArtManifest.ts`
  mirror it; a manifest written before this exists parses to `pause2x: []`.
- `ArtManifest.ts` gains `hasPause2xArt(key)`, `pauseStemOf(url)` and
  `pause2xUrlFor(url)`.
- `mountHeroArt` (`chapterPanel.ts`) sets
  `srcset="<1x> 1344w, <2x> 2688w" sizes="100vw"` **only when the manifest says
  the 2x file exists**, so nothing 404s while the fleet is still rendering
  them. `src` is assigned first and unconditionally, so the painting starts
  decoding on the tick the menu opens.

**Art track: this is the ask.** For each of the 19 stems in
`public/art/pause/`, drop a `<stem>.2x.webp` at 2688x1536 beside the PNG and
re-run `npm run art:manifest`. No code change is needed — the manifest picks it
up and the screen upgrades itself.

> One temporary `ch1-seymour-flux.2x.webp` was generated locally (sharp,
> lanczos3, q88, 301 KB) to prove the path end to end, and **deleted after the
> run**. `public/art/` is gitignored, so nothing of it is in the commit.

### 3. Focal points

`mountHeroArt` reads `focal: { x, y }` (0..1) from the plate's sidecar
`public/art/pause/<id>.json` and writes it to `object-position`. Default
**x 0.5, y 0.35** — every plate is a head-and-shoulders close-up and `50% 50%`
pushes a chin off the bottom of an ultrawide. One `fetch` per plate per session,
cached including the misses; anything malformed falls back to the default
(`parseArtFocal`, unit-tested against the shape a real generator sidecar has).

Only real pause plates get it: the shipped CTB portrait the candidate chain
ends on keeps its own `[data-art='fallback']` framing rule.

**Art track:** adding `"focal": { "x": 0.42, "y": 0.28 }` to a plate's sidecar is
now a supported, no-code-change way to re-frame it.

### 4. Ink & Gold finish over the painting

- A **3% drift**: `@keyframes pause-art-drift`, 46s, `ease-in-out
  infinite alternate`, constant `scale(1.03)` with the translate kept inside
  the overscan so no edge is ever uncovered. Off under
  `prefers-reduced-motion: reduce`.
- **Vignette** (tightened) and a **paper grain** — an inline `feTurbulence`
  data URI at 7% `mix-blend-mode: overlay`. The grain is the one layer HIDE
  PANELS keeps, because it is the painting's surface, not chrome.
- **No blur filter anywhere on the art**, pinned by a unit test.

### 5. Every metric is viewport-relative

`pause-screen.css` declares its scale once on `.pause` and everything reads it:

| Token | Clamp | 1280x720 | 2000x1012 | 3840x2160 |
|---|---|---|---|---|
| `--pu` (the old grid px) | `clamp(2px, 0.08vw + 0.12vh, 4.2px)` | 2.0 | 2.8 | 4.2 |
| `--pause-fs-body` | `clamp(14px, 0.4vw + 0.48vh, 22px)` | 14 | 14 | 22 |
| `--pause-fs-row` | `clamp(15px, 0.44vw + 0.53vh, 27px)` | 15 | 15.7 | 27 |
| `--pause-fs-game` | `clamp(20px, 0.76vw + 0.92vh, 46px)` | 20 | 24.5 | 46 |

`--pu`'s clamp deliberately tracks the letterbox factor it replaced on a 16:9
window, so spacing keeps the approved proportions while the type is free to be
bigger than a 1/2.25 reduction of a 1440 comp ever was. **Every type floor is
>= 14 CSS px**, including the fractional ones (`max(14px, 0.82em)`), and a unit
test fails if a bare literal under 14px reappears.

The six absolutely-positioned slabs became a **grid** (`.pause__frame`) with
safe margins (`clamp(18px, 3.4vw, 96px)` / `clamp(16px, 3.2vh, 72px)`) and a
reserved band at the foot for the hint strip — which is not in the grid, because
`controls-hint.css` is another agent's file and the strip mounts on the screen
root. Under 720px wide, or at portrait aspect, the grid folds to one column and
drops the quote and the polaroids.

### 6. The shared dossier, both grounds

`chapter-panel.css` is used by the pause screen **and** by the prep menu's
CHAPTER tab, which is still inside a letterboxed stage. So it is now tokenised
rather than converted: `--cp-u: 1px` plus twelve `--cp-fs-*` tokens whose
defaults reproduce the old 640x360 numbers **exactly**, and `.cpanel--fluid`
(which only the pause screen adds) repoints them at `clamp()`ed viewport units.
The prep tab is unchanged to the pixel except for the caption fix below.

**The polaroid caption ellipsis is fixed.** `-webkit-line-clamp: 2` with
`overflow: hidden` printed "Limbo, a thousand years…" on a tile with room for
the words. The box now grows to what it holds and the type wraps
(`overflow-wrap: break-word; hyphens: auto`). Measured in the browser at all six
sizes: `scrollHeight <= clientHeight` on all three tiles, every time.

### 7. Second pass — what the re-verification screenshots caught

The first pass measured six viewports and every number came back inside the
contract, but the numbers were not the whole story: reading the 390x844
screenshot rather than its measurements showed three things a
`fullbleed && !under14 && !hscroll` assertion cannot see.

- **The hint strip ran off the screen.** `.pause__hint.chint` is anchored
  `left: var(--pause-pad-x); right: auto` — it has to start somewhere fixed
  because it is skewed — and nothing bounded its width, so on a phone the last
  hint read `F PHO`. It now carries `max-width: calc(100vw - 2 * pad-x)` and
  `flex-wrap: wrap`. No horizontal page scroll appeared before this fix either,
  because the strip was *clipped*, not scrolled, which is why the measurement
  passed.
- **The party cards drew the OD gauge over the HP numerals.** `flex: 1 1 0`
  with `min-width: 0` let three cards share 354px — ~123px each, of which the
  body got ~29 — and `2420/2420` is `nowrap` by contract (14px is the floor for
  a full HP pair too), so it simply overprinted the gauge. `.pause__party` is a
  `repeat(auto-fit, minmax(min(100%, 210px), 1fr))` grid in the narrow query
  now: three tracks become two, then one, at exactly the width where a card
  can no longer hold its own contents.
- **The dossier's fade ran under the hint strip.** `--pause-hint-band` floored
  at 30px, and a single-line strip at its own floor is ~34px tall before its
  offset. Floor raised to 44px, and to 64px inside the narrow query where the
  strip may now wrap to a second line.

The same pass raised the **clamp ceilings**, which were shaving 10-15% off a
4K screen: `--pause-fs-body` 22 -> 26, `row` 27 -> 29, `num` 28 -> 30, `name`
35 -> 38, `quote` 40 -> 43, `game` 46 -> 50, `--pu` 4.2 -> 5. Nothing below
about 2800 CSS px reaches any of these — at 2560x1080 every token is still on
its formula, and at 2000x1012 most are still on their floor — so this is a 4K
change only, and no floor moved.

### 8. Third pass — the aspects the six sizes did not cover

The brief names 4:3, and the second pass's six viewports had none: `390x844`,
then a jump to `1280x720` and up. Every size it measured was 16:9 or wider. A
window with width to spare and no height turned out to be a different screen,
and it was broken in a way no measurement so far had been pointed at.

- **The quote printed over three live menu rows.** The left column was three
  grid rows — `brand`, `menu`, `quote` — and the quote sat in a
  `minmax(0, 1fr)` row with `align-self: end`, so it hung at the bottom of
  whatever was left over. At 800x600 there was nothing left over: the row
  collapsed to zero height, and a grid item aligned to the `end` of a
  zero-height row is laid out **upwards out of it**. The Seymour quote was
  drawn straight across MUSIC PLAYER, CHAPTER SELECT and QUIT TO TITLE — rows
  the cursor could still land on and activate.

  Grid areas may overlap; flex items may not. So the whole left column is one
  grid area (`rail`) holding one flex column, and "hang the quote at the
  bottom" is `margin-top: auto` — a margin that gives its space back when
  there is none, instead of reversing. Pinned by
  `tests/unit/pause-fullbleed.test.ts`.

- **The layout folded on width alone.** `@media (max-width: 720px)` is why an
  800x600 window — not narrow by that test, and nowhere near enough room by any
  other — was handed the full desktop layout in the first place. There is a
  height query beside it now, `(max-height: 700px) and (min-width: 721px)`: the
  rail's contents are a fixed cost (a wordmark and ten real commands), so the
  decoration gives way. The quote and the polaroids go, and the party strip
  takes the full width back.

- **The menu scrolls rather than pushing a row off the window.** `flex: 0 1
  auto; overflow-y: auto` on `.pause__menu`, and `renderMenu` calls
  `scrollIntoView({ block: 'nearest' })` on the selected row so a pad player
  never loses the cursor. `nearest` means nothing moves on a window with room.
  The menu also carries a `padding-inline` gutter given straight back as a
  negative margin: every row is skewed and its corners stick out past the box,
  which a scroll container would otherwise answer with a second scrollbar.

- **A party card was still allowed to shrink past its own numerals**, in the
  721–1100px band the first pass's `max-width: 720px` query did not reach —
  and 4:3 is exactly that band. `flex: 1 1 0; min-width: 0` says "share
  whatever is there, however little"; at 1024x768 the left rail is 464px, each
  card got ~149 and the OD gauge printed through `2420/2420`. **Leaving
  `min-width` alone** is the fix: a flex item's automatic minimum size is its
  content's, so flex lines are collected honestly and the third card takes a
  new row. Nothing measures a number or guesses a breakpoint.

- **The polaroid caption fix stopped at the prep tab's doorstep.** §6 fixed
  `.cpanel__snap-cap` in the shared stylesheet, but the prep menu's CHAPTER tab
  adds `src/ui/ffx/party-prep/chapter-panel-tab.css` — another track's file —
  with `.prepchap__cols .cpanel__snap-cap { white-space: nowrap; text-overflow:
  ellipsis }`, which outranks a bare class. So the CHAPTER tab, the *default*
  tab on the path into every chapter, still printed Bailey's exact reported
  string one screen over. The reset is restated at three classes
  (`.cpanel .cpanel__snap .cpanel__snap-cap`) so it wins from whichever sheet
  lands last, and `.cpanel__snap` is the middle term because the pause screen
  lifts the bare `<figure>`s out of the dossier and has no `.cpanel__snaps`
  wrapper at all. The floor is converted into the caller's units with
  `calc(14px / var(--lb-scale, 1))` — `LetterboxStage.createStage` now publishes
  its scale factor as `--lb-scale`, because CSS has no unit that survives a
  transform and no way to ask what one is. The full-bleed layer publishes `1`,
  so the same expression is plain px there.

  **Ask for the prep tab's owner (`ffx2-hud-prep`):** delete the `nowrap` /
  `text-overflow: ellipsis` pair from `.prepchap__cols .cpanel__snap-cap` in
  `src/ui/ffx/party-prep/chapter-panel-tab.css`, and the guard here (with the
  two sizing rules under it) can go. A caption is three to five words in the
  author's voice; truncating one is worse than any amount of wrapping.

### 9. Fourth pass — two defects the third pass's own fixes introduced

Both were found by re-measuring rather than by reading the diff, and both are
the same shape: a declaration that was right about one window and wrong about
another.

- **`max-width` clamps the automatic minimum size too.** So a cap *below* what
  the card holds does not make the card wrap — it makes the card overflow. At
  800x600 the cap's floor was `150px` and a card with `2420/2420` and the OD
  gauge beside it needs about 157: all three cards reported `scrollWidth`
  154 / 150 / 149 against `clientWidth` 147 and painted their gauge past their
  own right border. (1024x768, where `16vw` is 164, had none — which is why the
  third pass's run passed.) The floor is `168px` now.

- **`flex: 1 1 auto` cost Bailey's own window its party strip.** Flex lines are
  collected on each item's *hypothetical* main size — the basis clamped by min
  and max — so with the automatic minimum back in force a basis of **0** still
  reports "I need 157px", which is all the honest wrapping needed. A basis of
  `auto` reports the card's full content width instead, ~300px at 2000x1012:
  three of them plus their gaps overran the 900px rail by a hair and the strip
  came apart into two rows on a window with room for three. Back to
  `flex: 1 1 0`, with `min-width` still left alone — and now 800x600 lays three
  cards at 165px each with nothing clipped, 1024x768 wraps to 2+1 because it
  genuinely cannot hold three, and 2000x1012 is three across again.

---

## How it was verified

A vite dev server on **port 5846** (watcher and HMR off via a throwaway config —
several agents are editing this tree and a full reload mid-measurement takes
`window.__pyrefly` with it), driven by Playwright with **real key presses**:
Enter, `select:seymour-flux`, `prep:begin`, skip the cutscene, then `Escape`/`P`
to open the pause exactly as a player does. Nothing used `trigger('pause:open')`.

Measured at six viewport sizes, in ascending order because a browser upgrades
an `srcset` pick but never downgrades it:

| Viewport | painting rect == viewport | `currentSrc` | smallest font | under 14px | h-scroll | transforms on the art's chain |
|---|---|---|---|---|---|---|
| 390x844 | yes (0,0,390,844) | `.png` | 14 | 0 of 68 | no | drift only |
| 1280x720 | yes | `.png` | 14 | 0 of 74 | no | drift only |
| 1600x900 | yes | `.2x.webp` | 14 | 0 | no | drift only |
| 2000x1012 | yes | `.2x.webp` | 14 | 0 of 74 | no | drift only |
| 2560x1080 | yes | `.2x.webp` | 14 | 0 of 74 | no | drift only |
| 3840x2160 | yes | `.2x.webp` | 18 | 0 of 74 | no | drift only |

`object-position` read back as `42% 28%` — the focal written into the Chapter 1
sidecar for the run, so the sidecar path is proven, not assumed. "transforms on
the art's chain" is the old defect's fingerprint: the only transform between the
`<img>` and the document is now the drift's own `matrix(1.03, …)`. There is no
layer scale left to resample text through.

Keys, at 2000x1012: `Escape` opens and resumes, `P` opens over a live command
menu, `H` hides the panels (`panelsHidden: true`, `.pause--bare` on the stage,
menu not rendered, the surviving line at 14px, painting still exactly the
viewport) and `H` again brings them back, `ArrowDown` still moves the cursor,
`F` enters photo mode and `Escape` leaves it. No page errors, no console errors.

Screenshots: `docs/screenshots/fix3/pause/`. Three generations, oldest first,
because the interesting thing about this screen is what each pass caught.

- `390x844-phone.png` … `3840x2160.png` — the first pass, before the
  hint-band fix.
- `v2-*.png` — after it: the same six sizes plus `panels-hidden`, the PARTY,
  MUSIC and OPTIONS panels, and the prep menu's CHAPTER tab (the other
  consumer of `chapter-panel.css`).
- `v5-*.png` — the second pass's measured run, with `2000x1012` and
  `panels-hidden` as the two worth putting in front of Bailey.
- `v6-*.png` — the final state: the phone after the party-grid and hint-band
  fixes, and the two large sizes re-measured against the art track's **real**
  2688x1536 masters rather than the one file this track generated to prove the
  path.

- `v8-*.png` — the third and fourth passes' run, and the one to look at: it is
  the only generation taken against the current tree, and the only one that
  covers a 4:3 window.

(The `v3-*`, `v4-*` and `v7-*` runs are not in the repo. `v3` was the run whose
`Escape` was refused, so every shot in it is of the battle screen with no pause
up; `v4` was superseded by `v5` at every size it covered, and six 4K PNGs is
30MB of nothing new; `v7` was the third pass's run, superseded at every size by
`v8` once the fourth pass's two fixes landed.)

### The third and fourth passes' run

A vite dev server on **port 5627**, the same throwaway HMR-off config, a fresh
browser context per viewport, and **eight** sizes rather than six — 800x600 and
1024x768 were added because the brief names 4:3 and every size measured up to
that point had been 16:9 or wider. That is the whole reason §8 exists.

| | 390x844 | 800x600 | 1024x768 | 1280x720 | 1600x900 | 2000x1012 | 2560x1080 | 3840x2160 |
|---|---|---|---|---|---|---|---|---|
| painting rect == viewport | yes | yes | yes | yes | yes | yes | yes | yes |
| `currentSrc` | png | png | png | png | **2x** | **2x** | **2x** | **2x** |
| smallest font | 14 | 14 | 14 | 14 | 14 | 14 | 14 | 18 |
| text under 14px | 0/54 | 0/54 | 0/60 | 0/60 | 0/60 | 0/60 | 0/60 | 0/60 |
| quote over the menu | no | no | no | no | no | no | no | no |
| party rows / card width | 2 / 170 | **1 / 165** | 2 / 165 | 1 / 184 | 1 / 231 | **1 / 289** | 1 / 372 | 1 / 392 |
| card clipped, numerals over the gauge | none | none | none | none | none | none | none | none |
| caption clipped or ellipsised | none | none | none | none | none | none | none | none |
| hint strip inside the window | yes | yes | yes | yes | yes | yes | yes | yes |
| dossier bottom to hint top | +9px | +74 | +187 | +121 | +240 | +284 | +256 | +997 |
| transforms on the art's chain | drift only | drift only | drift only | drift only | drift only | drift only | drift only | drift only |
| blur on the art / h-scroll / errors | none | none | none | none | none | none | none | none |

The two bolded cells are §9's fixes landing: 800x600 lays three cards in one
row at 165px each with nothing clipped (the third pass had three cards
overflowing their own border there), and 2000x1012 — Bailey's window — is three
across again at 289px (the third pass had split it into two rows). 1024x768's
two rows are correct and not a regression: the left rail is 464px and three
cards genuinely need about 490.

`currentSrc` crosses to the 2x master between 1280 and 1600 CSS px, which is
the contract. The 4K run is the only one where any type is off its floor.

Keys, at 2000x1012, all real presses: the **first** `Escape` out of a fresh
battle is eaten by the FFX command menu (`src/ui/ffx/cancelClaim.ts`, another
track — Esc is that menu's back button and "one tap of Esc means one thing"),
and the **second** opens the pause; at four of the eight sizes above the run's
opening `Escape` landed after the menu had already given the claim up and
opened it first time. `H` hides the panels (`panelsHidden: true`, `.pause--bare`
on the stage, the menu not rendered, the surviving line at 14px, the painting
still exactly the viewport) and `H` again brings them back; `ArrowDown` moves
the cursor `RESUME -> RESTART ENCOUNTER`; the PARTY, MUSIC and OPTIONS panels
all render without scrolling; `F` enters photo mode and `Escape` leaves it;
`Escape` resumes and `P` opens over a live command menu. No page errors, no
console errors.

### The second pass's run

A fresh vite dev server on **port 5723**, same throwaway HMR-off config, and a
**fresh browser context per viewport** — the first pass resized one page
through all six sizes, which had two costs. A screenshot of a 2000px+ viewport
started hanging once several resizes had each reallocated a SwiftShader
framebuffer, and one `Escape` landed while the battle's opening beat still
owned the keyboard, so the pause never opened and every later measurement in
that run read `null` against a screen that was not up. A fresh page per size
also makes the `srcset` check honest: a browser upgrades a picked candidate and
never downgrades it, so measuring small viewports after large ones in one page
proves nothing about the small ones.

Three assertions were added for the things the first pass's numbers were blind
to — the hint strip's right edge against the viewport (it was *clipped*, not
scrolled, so `documentElement.scrollWidth` was right to pass), the intersection
of each party card's numerals with its OD gauge, and the dossier's bottom
against the top of the hint strip.

| | 390x844 | 1280x720 | 2000x1012 | 3840x2160 |
|---|---|---|---|---|
| painting rect == viewport | yes | yes | yes | yes |
| `currentSrc` | `.png` | `.png` | `.2x.webp` | `.2x.webp` |
| smallest font / under 14px | 14 / 0 of 68 | 14 / 0 of 74 | 14 / 0 of 74 | 18 / 0 of 74 |
| hint strip inside the window | yes | yes | yes | yes |
| numerals over the OD gauge | none | none | none | none |
| polaroid captions clipped | none | none | none | none |
| blur on the art | none | none | none | none |

A third run then re-measured the two sizes those fixes touched, plus 21:9,
against the art track's real masters:

| | 390x844 | 2560x1080 | 3840x2160 |
|---|---|---|---|
| painting rect == viewport | yes | yes | yes |
| `currentSrc` | `.png` | `.2x.webp` | `.2x.webp` |
| smallest font / under 14px | 14 / 0 of 68 | 14 / 0 of 74 | 18 / 0 of 74 |
| hint strip inside the window | yes | yes | yes |
| numerals over the OD gauge | none | none | none |
| numerals clipped in the card | none | none | **none** (was all three) |
| dossier bottom to hint top | **+9px** (was -17) | +256px | +997px |
| page or console errors | none | none | none |

The two bolded cells are the second pass's fixes landing: the phone's dossier
no longer runs underneath the hint strip, and the 4K card no longer clips
`2420/2420` — that one was caused by this pass's own ceiling bump and is why
the numeral ceiling went back to 28 while the card's width cap took the
headroom instead.

The key contract was re-run on its own against the current tree, because
another track landed a change to how the FFX menus claim `cancel` while this
was in flight: `P` opens over a live command menu, `H` hides the panels
(`panelsHidden: true`, `.pause--bare` on the stage, menu not rendered,
surviving line at 14px, painting still exactly the viewport), `H` again brings
them back, `ArrowDown` moves the cursor `RESUME -> RESTART ENCOUNTER`, the
MUSIC panel still lists its 10 rows, `Escape` resumes (`battle > pause` ->
`battle`), `F` enters photo mode and `Escape` leaves it. No page errors, no
console errors.

Unit tests: `tests/unit/pause-fullbleed.test.ts` (18, new) — the manifest's
`pause2x` rules against a fixture tree, `parseArtManifest`, `pauseStemOf` /
`pause2xUrlFor`, `parseArtFocal`, and the stylesheet contracts (layer is
`fixed`, no font literal under 14px, every `--pause-fs-*` and `--cp-fs-*` clamp
floors at 14px, no blur on the art, drift off for reduced motion, no
`-webkit-line-clamp`). `tests/unit/pause-panels.test.ts` had its `slabs()`
helper updated for the new `.pause__frame` wrapper.

`npx tsc --noEmit` reports nothing in any file this track owns. The whole
vitest suite was run once at the end: **3254 passed, 6 failed, all six in
`tests/unit/audio*.test.ts`** — the audio track was mid-edit in the same
working tree and was, for a stretch of this round, throwing at import
(`pizz is not defined`) and failing `tsc` in 15 of its own files. That is
noise from a neighbour, not a regression here; every pause and chapter-panel
test passes.

## Files

| File | Change |
|---|---|
| `src/app/screens/PauseScreen.ts` | full-bleed stage, `.pause__frame` wrapper, grain layer, `.cpanel--fluid` |
| `src/ui/common/pause-screen.css` | rewritten on fluid tokens; grid layout; drift, grain, vignette |
| `src/ui/common/chapter-panel.css` | tokenised (`--cp-u`, `--cp-fs-*`), `.cpanel--fluid`, caption fix |
| `src/ui/common/chapterPanel.ts` | `srcset`/`sizes` for the 2x master, `focal` sidecar, `parseArtFocal` |
| `src/ui/common/LetterboxStage.ts` | `createFullBleedStage` (additive; `createStage` untouched) |
| `src/engine/ArtManifest.ts` | `pause2x`, `hasPause2xArt`, `pauseStemOf`, `pause2xUrlFor` |
| `tools/gen/manifest.mjs`, `tools/gen/manifest.d.mts` | scan and type `pause2x` |
| `tests/unit/pause-fullbleed.test.ts` | new |
| `tests/unit/pause-panels.test.ts` | `slabs()` follows the frame wrapper |

## What is left

- ~~**The 2x masters do not exist yet.**~~ **Delivered.** The art track landed
  all **19** during this round: every `public/art/pause/<stem>.png` now has a
  `<stem>.2x.webp` beside it, and all nineteen measure exactly 2688x1536 (PIL,
  checked file by file). `npm run art:manifest` reports "19 pause paintings (19
  with a 2x master)", so `pause2x` lists every stem and no plate is left on the
  1x file at a large viewport. The throwaway `ch1-seymour-flux.2x.webp` this
  track generated to prove the path was overwritten by the real one; there is
  nothing of it left to delete.
- ~~**`focal` is in no shipped sidecar.**~~ **Delivered**, and by exactly the
  no-code-change route §3 describes — all 19 sidecars carry one now, and they
  are real per-plate framings rather than the default repeated (`lulu` at
  `x 0.20`, `yuna-ffx2` at `x 0.84`, `auron` at `x 0.70`). Chapter 1 reads
  `{ x: 0.37, y: 0.47 }`, which supersedes the `0.42 / 0.28` this track wrote
  by hand for its first run.
- **`.battle-pause-chip` is still 12px device type.** It belongs to
  `BattleScreen`, not to this screen, and it is no longer visible with the pause
  up now that the painting covers the window — but it is the same "tiny chrome"
  defect one screen over. `BattleScreen.ts` is another track's file.
- **`controls-hint.css` is another agent's file**, so the hint strip is resized
  from this stylesheet (`.pause__hint.chint`) rather than at its source. If that
  file ever moves to fluid type, delete the override here.
- **The three all-black FFX-2 portraits** (`paine.1.raw.png`,
  `yuna-ffx2.1.raw.png`, `rikku-ffx2.1.raw.png`, RGB mean exactly 0) are still
  black, and still what Chapter 4's third polaroid is showing. Art-pipeline
  defect, carried over from `docs/handoff/pause-screen.md` Part 3.
- **The PARTY tab's third card** used to clip once buffs added a status row;
  the panel now scrolls (`overflow-y: auto`), which closes it, but the cards
  have not been re-designed for the larger type.
- **The phone dossier is a sliver.** With the menu's ten rows, the three party
  cards each on their own row and a three-line hint strip, a 390x844 screen has
  about 130px left for the dossier. It scrolls, and nothing is clipped or
  overlapped any more, but a phone layout that gave the dossier a tab of its own
  rather than a slot in the stack would be the real answer. Nobody has asked for
  one — Bailey plays at 2000x1012 — so this is noted, not done.
- **Chapter 1's pause plate is a painting of Tidus**, while the dossier beside
  it is Seymour Flux. It may well be deliberate (the plates are hero-side
  portraits, and the quote under it is Seymour's), but it reads as a mismatch on
  a full-bleed screen where the painting is now the whole window rather than a
  panel. Art track's call: `public/art/pause/ch1-seymour-flux.png`.
- **Esc-opens-the-pause was not re-proven on the second pass.** `Escape`
  *resuming* is proven, and `P` opening over a live command menu is proven, but
  the run that would have shown `Escape` opening it from the command menu's top
  row could not boot the app: `src/audio/**` was mid-edit by another track and
  throwing at import (`pizz is not defined`), with `tsc` showing 15 errors in
  files this track does not own. The first pass proved it, and the `cancel`
  claim has since moved (`src/ui/ffx/cancelClaim.ts`, another track's commit
  "FFX HUD: one tap of Esc means one thing"), so it is worth one more run once
  the tree boots. Nothing in this track's files bears on it.
