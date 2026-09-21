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

### Where the build departs from `after.png`, and why

1. **The title painting is `public/art/backdrops/title.png`, not the concept's key art.**
   `after.png` was composited from `_src/plane-far.png` / `plane-near.png`, cut from
   `_src/title-keyart.2.png` — a plate that lives only in the concept folder. The brief
   and hard rule 8 say approved paintings in `public/art` only, generate nothing. So the
   *composition* of `after.png` is reproduced (parallax planes, the two on the shore as
   ink silhouettes, pyreflies, the ivory slab, the vertical strap) over the approved
   title painting. **This is the one thing on this track that needs Bailey's eye.**
2. **The near plane is the same file, clipped.** `card.json` says the shore plane is "cut
   on luminance from one painting". With nothing generated, the near plane is the same
   approved `title.png` clipped to its bottom 43 % and held larger and darker, which puts
   the cut on the horizon — where a luminance cut would put it.
3. **The strap reads "Final Fantasy X and X-2", not "Five encounters · Final Fantasy X
   and X-2".** Bailey approved three more chapters in the same message that approved this
   board, so the count on the plate is an incidental label that is now wrong. A pick
   approves what the owner named and what the picture shows, not incidental labels.
4. **The board carries eight cards in two labelled game groups**, per the brief, where
   `chapter-select.png` shows five in one stack. The hint strip gains an UP/DOWN GAME row
   for the new axis.

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

1. The title uses the approved `backdrops/title.png` (a sea and a horizon), not the
   concept plate's tower key art, because that plate is not an approved asset. Is the
   painting right, or should the art fleet be asked for a title key art to match
   `after.png`?
2. The strap now reads "Final Fantasy X and X-2" instead of "Five encounters · …", since
   eight chapters are approved. Keep it, or restore a count?
3. The three coming chapters show as locked cards reading COMING with their names. Should
   an unbuilt chapter's name be visible at all, or should it read "Chapter to come"?
