# Showpiece front end — parallax title and silhouette chapter cards

**Track:** `frontend-showpiece` · **Status:** built, verified locally, not deployed
**Game-aware case (AGENTS.md rule 14): BOTH.** The title is the front door to both
halves of the game and the chapter board holds both games' encounters; nothing in it is
true of one and not the other. The only per-game thing is which accent a group heading
and its cards carry, and that is the existing `.ig--ffx2` token swap from
`src/ui/inkgold/tokens.css`, not a new idea.
**Why "both" and not "shared plumbing, therefore skip":** `critic/CHECKS.md` CHK-020 —
shared plumbing is "both" by default, and the front end is the most shared thing there is.

## What Bailey approved

- 2026-09-19, among the twelve presentation changes: **"A front end that moves: parallax
  title and silhouette chapter cards"** (`docs/concepts/polish/showpiece-frontend/card.json`).
  `after.png` is the target for the title; `chapter-select.png` is the target for the board.
- 2026-09-19, three new chapters: Seymour and Anima at Macalania Temple (FFX), Evrae on
  the deck of the *Fahrenheit* (FFX), the Leblanc Syndicate at Chateau Leblanc (FFX-2).
- 2026-09-21: *"Next build needs to include the new chapters I approved of and the new
  title screen I approved of."*

The base look stays the approved tiles `docs/screenshots/mockups/A-title.jpg` and
`A-chapter-select.jpg`; this adds the motion and the silhouettes to them.

## Target versus build

| | Pair |
|---|---|
| Title | `docs/screenshots/frontend/pair-title.jpg` |
| Chapter select | `docs/screenshots/frontend/pair-chapter-select.jpg` |

Captures: `docs/screenshots/frontend/title-1600x900.png`, `title-390x844.png`,
`chapter-select-1600x900.png`, `chapter-select-390x844.png`.

### The key art now ships (2026-09-21) — open question 1 is closed

The first cut of this screen used `public/art/backdrops/title.png` (a sea and a horizon)
and reproduced only the *composition* of `after.png`, because `_src/title-keyart.2.png`
lived in the concept folder and the brief said "only art already in `public/art`". That
read was wrong for this one case: **the key-art plate is this project's own render**,
made by the local pipeline for that very mockup, and it is what Bailey approved. Hard
rule 8 forbids *retail Square Enix* assets; this is ours.

So the plate is installed, and the title is the painting:

| File | What |
|---|---|
| `public/art/title/keyart.2x.webp` | 2688x1536, the concept plate unaltered, re-encoded (373 KB) |
| `public/art/title/keyart.png` | 1344x768, the same painting at the project plate size |
| `public/art/title/keyart.json` | the generation record (seed 771205, animagine-xl-4.0, RealESRGAN_x4plus) plus provenance |

No generation was needed: the plate was already 2688 px wide, past the 2560 px the brief
set as the upscale threshold. Backed up to
`D:\Tools\pyrefly-art-backup\approved\2026-09-21-title-keyart\` (with the concept-folder
source beside it); hashes recorded in `docs/target/approved-hashes.json` under
`title:keyart`.

`public/art/title/` is a **new indexed folder**: `tools/gen/manifest.mjs` now lists
`title` and `title2x` exactly as it lists `pause` / `pause2x`, and `ArtManifest.ts` grew
`hasTitleArt`, `hasTitle2xArt`, `titleStemOf` and `title2xUrlFor` beside the `pause`
twins. Its own folder rather than `backdrops/` because a backdrop is a scene a battle is
staged in, and nothing in the battle presenter should pick the key art up by accident.

### Where the build departs from `after.png`, and why

1. **The near plane is the same file, masked.** `card.json` says the shore plane is "cut
   on luminance from one painting", and the concept baked that cut into
   `plane-near.png`'s alpha. Measured off that file, the alpha is nothing at 62 % of the
   frame and ramps to about 0.95 at the bottom edge — so the near plane is now that ramp
   as a CSS `mask-image` over the same `<img>`. No second file, and no hard line: the
   earlier `clip-path: inset(57% 0 0 0)` cut straight across *above* the painting's
   horizon, which is what the verifier saw.
2. **The grades are the concept's, twice.** `plane-far.png` and `plane-near.png` were
   themselves already graded before `after.html` put a CSS filter on top (measured
   against the plate: 0.86 and 0.713). Working from the ungraded plate, the screen has to
   do both: far `saturate(.94) brightness(.78) contrast(1.08)`, near
   `brightness(.6) saturate(.88)`. Sampled over seven regions of the frame the build now
   sits within 0–11 % of `after.png` per channel (see the table below).
3. **The strap reads "Final Fantasy X and X-2", not "Five encounters · Final Fantasy X
   and X-2".** Bailey approved three more chapters in the same message that approved this
   board, so the count on the plate is an incidental label that is now wrong. A pick
   approves what the owner named and what the picture shows, not incidental labels.
4. **The board carries eight cards in two labelled game groups**, per the brief, where
   `chapter-select.png` shows five in one stack. The hint strip gains an UP/DOWN GAME row
   for the new axis.

### The verifier's minor notes, each one

- **The horizon cut.** Gone — item 1 above. There is no hard edge anywhere on the plate.
- **The reflections were invisible.** They were, and it was a real bug: the reflection's
  `<img>` was sized to the *band* (62 % of the figure) and then `scaleY(-1)` about
  `top center` threw every pixel of it above the box, where `overflow: hidden` ate it.
  The image is now the whole figure — `height: calc(100% / var(--fe-refl))` — flipped
  with `translateY(100%) scaleY(-1)`, so the feet meet the feet and the band clips the
  rest, which is what `after.html` did with its `top:208px; height:208px`. Opacity .3
  against the concept's .22, because our figures are the approved character paintings
  rather than the concept's pre-rimmed cut-outs. Pinned by
  `tests/unit/frontend-title-motion.test.ts`.
- **The rim was a halo.** `.fe-sil`'s third drop-shadow is 14 grid units; on a small
  chapter card that reads as a lit edge, on a 225 px figure in open sky it reads as a
  glow. Restated thinner **scoped to `.fe-title__cast`**, so the board — which matches
  its own target — is untouched.
- **Two clicks, and the hint bar says so.** Clicking a rail card has always only *chosen*
  it (the card becomes the plate) and the second click, on the plate, starts it. Nothing
  said so. The hint strip now words itself for a pointer: "Click a card choose · Click
  the plate begin". Four tests in `frontend-chapter-select-screen.test.ts` drive real
  `MouseEvent`s through the real `Input` to pin it, including that three clicks in a row
  on three different cards start nothing.
- **The "a coming chapter that lands is dropped" branch.** `buildChapterTiles` now takes
  an optional registry pair, so `frontend-chapter-grid.test.ts` can hand it a `CHAPTERS`
  that already holds Macalania (by id) or Leblanc (by title alone) and watch the COMING
  row disappear and the card become playable. The real filter, the real rows, and still
  nothing fake in `src/data` (hard rule 6).

### The plate on the wire

The manifest is prefetched at bundle init, so by the time the title mounts it is normally
already in hand and the `srcset` goes into the markup with the element. Measured: emitting
`src` alone and adding `srcset` a tick later made Chromium start the 1.9 MB 1x plate and
abort it — a wasted megabyte and a failed request in the panel. With the candidates in the
markup the title makes exactly one image request, for `keyart.2x.webp` (373 KB), at both
1600x900 and 390x844. `sizes` is a cover width, not `100vw`: a plane is `object-fit:
cover` held at up to 1.11 scale, so a tall window crops far more image than its own width.

No manifest, or a manifest with no `title2x`, leaves the 1x plate alone rather than
risking a 404 on the one image the screen is. A plate that 404s anyway marks its plane
`data-art="missing"` and the stylesheet paints the dusk gradient the screen shipped with —
which is what a build served without `public/art` (gitignored) gets.

## What was built

New, and used only by these two screens:

| File | What it is |
|---|---|
| `src/app/screens/frontend/comingChapters.ts` | The three approved-but-unbuilt encounters as **labels only** — name and location quoted from `research/ffx-seymour-anima-macalania.md`, `research/ffx-evrae-airship.md`, `research/ffx2-leblanc-syndicate.md`. No stat, no party, no formation: hard rule 6. |
| `src/app/screens/frontend/chapterGrid.ts` | Pure. Builds the eight tiles from `CHAPTERS` + the coming rows, groups them by game, resolves each chapter's silhouette painting, reads cleared state, and moves the cursor (skipping COMING cards). |
| `src/app/screens/frontend/chapterCards.ts` | The board's markup builders. |
| `src/app/screens/frontend/parallax.ts` | The drift. Pointer / stick / unattended time, transforms only, static under reduced motion. |
| `src/app/screens/frontend/motes.ts` | The concept's sixteen pyreflies, at the concept's own positions. |
| `src/app/screens/frontend/titleMarkup.ts` | The title card's markup. |
| `src/app/screens/frontend/frontend.css` | Both screens. Every literal is a 1440-grid concept pixel times `--fe-k`. |

Rewritten: `src/app/screens/TitleScreen.ts`, `src/app/screens/ChapterSelectScreen.ts`.
Tests: `tests/unit/frontend-chapter-grid.test.ts`,
`tests/unit/frontend-title-motion.test.ts`,
`tests/unit/frontend-chapter-select-screen.test.ts` (31 assertions; the screen test drives
the **real** `Input` with **real** `KeyboardEvent`s against a **real** `SaveStore`).

### The eight chapters light up by themselves

`buildChapterTiles` drops any coming row whose `id` **or** `title` already exists in
`CHAPTERS`. The day `src/data/encounters.ts` gains the real Macalania / Evrae / Leblanc
chapter, its card stops saying COMING and becomes playable with **no edit to this track**.
`tests/unit/frontend-chapter-grid.test.ts` pins that, and pins that no coming id is
currently in the registry. Nothing fake was written into `src/data`.

### Silhouettes

An uncleared chapter's card shows its boss as an ink silhouette (the approved
`public/art/characters/<key>/idle.png` under a `brightness(0)` + gold-rim `drop-shadow`
filter — cropped and lit by CSS only, never a second asset) with its name and nothing
else: no subtitle, no location, no blurb, because those are the spoiler. A cleared one
shows the painting instead. Chapter 1 uses `mortiorchis` + `seymour-flux-body`, the pair
`card.json` recorded as necessary because `seymour-flux/idle.png` is 90 % opaque.

### Both screens are now full bleed

They were letterboxed 640x360 stages scaled by one transform. Bailey plays at 2000x1012,
which is not 16:9: the transform put ink bars down the frame and rasterised every glyph at
640x360 before blowing it up — the `fix3-pause` finding, restated. CSS sizes everything
from `--fe-k` instead.

## Measured, GPU browser (`PYREFLY_BROWSER=gpu`), own vite server on 5731

| Check | Result |
|---|---|
| Frame time, both screens, all five window shapes | median **16.7 ms**, max **16.8 ms** — 60 fps locked |
| Smallest rendered text @1600x900 | **14.44 px** (both screens) |
| Smallest rendered text @2000x1012 | **16.24 px** (both screens) |
| Clipping / page scroll @1280x720, 1600x900, 2000x1012, 2560x1080, 390x844 | **none** on any |
| Console errors / page errors | **none** |
| Smallest rendered text @1280x720 | 11.56 px — **disclosed, not clamped**; the floor is specified at 1600x900 and 2000x1012, and clamping here pushes the rail off frame. Same disclosure the guide track made. |
| Smallest rendered text @390x844 | 9.54 px on the CTB/ATB badge; the phone layout is re-laid rather than shrunk (single column, the rail scrolls internally) so nothing clips. |

`npx tsc --noEmit` clean · `npx vitest run` **4549 / 4549 green, 181 files** ·
`node tools/orphans.mjs` lists none of the new modules.

### The key-art round, GPU browser, own vite server on 5473 (2026-09-21)

Seven regions of `after.png` against the same regions of
`docs/screenshots/frontend/title-1600x900.png`, build ÷ target per channel:

| Region | R | G | B |
|---|---|---|---|
| sky, left of the spire | 0.95 | 0.96 | 0.91 |
| the spire | 1.01 | 0.97 | 0.91 |
| the lit cumulus | 1.04 | 0.98 | 0.91 |
| the headland, right | 0.90 | 0.89 | 0.89 |
| water, mid frame | 1.00 | 0.98 | 0.94 |
| the shore, left | 1.00 | 0.96 | 0.91 |
| the moon | 1.01 | 0.99 | 0.93 |

The residual is a flat ~9 % on blue — the build is a shade warmer than the target
everywhere. A per-channel gain is not something a CSS `filter` chain can express without
an SVG `feColorMatrix`, and 9 % on one channel of a painted plate is not visible beside
the picture; **disclosed rather than chased.** Everything else — the moon, the spire, the
clouds, the headland, the wet shore, the two figures and their rim — lands where
`after.png` has it (`docs/screenshots/frontend/pair-title.jpg`).

No console error, no page error, no failed request and no page scroll at 1600x900 or
390x844. The cast geometry is now read straight off `after.html`'s 1440x810 stage
(Tidus `948/494/208`, Yuna `1068/512/194`) rather than rounded, which closed a ~2 % gap in
how far apart the two stood.

## Things the next agent should know

- `src/ui/common/chapter-select.css` (358 lines) now has **no importer**. It is left on
  disk rather than deleted, because deleting a file in `src/ui/common` while other agents
  are in the tree is not this track's call. Vite does not bundle an unimported stylesheet,
  so nothing ships. Someone should remove it once the tree is quiet.
- `src/ui/common/controls-hint.css` sets a flat `12px`, below the 14-effective-px floor at
  every window size. It is shared with results and the cutscene screens, so it was **not**
  edited: the size is restated scoped to `.fe-cselect` in `frontend.css`. Results and the
  cutscene screens still read at 12 px and someone owns that.
- `docs/target/targets.json` was **not** touched (another agent is editing it). The
  `presentation` tile "Chapter select" still points at `A-chapter-select.jpg`;
  `docs/plans/build-b-review.md` REQUIRED 11 asks for `supersededBy: "showpiece-frontend"`
  and a re-shot tile. That edit is owed.
- `docs/handoff/NOW.md` was not touched either; the driver session owns it.

## The paper critique (`docs/plans/build-b-review.md`), item by item

Applied here:

- **REQUIRED 12** (verification matrix): 1280x720, 1600x900, 2000x1012, 2560x1080 and
  390x844 all measured, legibility and hittability at 390x844 a pass condition — done.
- **REQUIRED 1** acceptance for item 1: "no black placeholder card remains at chapter
  select, every chapter card's silhouette is identifiable at 390x844, and the card grid
  holds the final chapter count without horizontal scroll" — done; the grid holds eight.
- **REQUIRED 17 / OPTIONAL 17** (chapter count): answered by building for eight now, so
  the board is not approved twice.
- **REQUIRED 6** (reduced motion has nothing to attach to): partially. This track honours
  `prefers-reduced-motion` **and** `SaveData.reduceMotion`, and reads `lowEffects` to halve
  the mote field — the first code in the project that reads either. The `EffectsBudget`
  module and the settings surface the critique asks for are still owed by whoever owns the
  WebGL items; nothing here needs them.
- **REQUIRED 11** (two approved pictures of one screen): flagged above, the targets.json
  edit is owed and belongs to the agent holding that file.

Does not apply to this idea:

- REQUIRED 2 (the FFX/FFX-2 source-of-truth file) — `research/ffx-vs-ffx2-presentation.md`
  now exists, and this item is "both" anyway.
- REQUIRED 3, OPTIONAL 16, OPTIONAL 18 — the CTB preview solver. Different item.
- REQUIRED 5 — `ChainCounter` / `SpherechangeFlourish`. Different items, different files.
- REQUIRED 7 (presentation speed) — this track adds no sequence to a retry: the drift is
  ambient and costs the player no time.
- REQUIRED 8, 9, 10, 13 — `Backdrop.ts`, battle entry, phase lighting, per-enemy `death`.
  Different items; none of their files are touched here.
- REQUIRED 14 (a sound line per card) — **silent, by design** for this one. The drift and
  the motes are ambient; the board keeps the existing `cursor-move` / `confirm` / `cancel`
  cues and adds none.
- REQUIRED 15 (a defaults table) — this track ships **no feature flag**: the front end is
  the front end, and a title screen behind a flag is two title screens.

## Open questions for Bailey

1. ~~The title uses the approved `backdrops/title.png`, not the concept plate's key
   art.~~ **Closed 2026-09-21: the key art ships.** It is the project's own painting and
   the one in `after.png`, so it belongs in `public/art`. `backdrops/title.png` is now
   unused by the title screen; it is left on disk because other screens may reach for it
   and deleting a shared file while the tree is busy is not this track's call.
2. The strap now reads "Final Fantasy X and X-2" instead of "Five encounters · …", since
   eight chapters are approved. Keep it, or restore a count?
3. The three coming chapters show as locked cards reading COMING with their names. Should
   an unbuilt chapter's name be visible at all, or should it read "Chapter to come"?
