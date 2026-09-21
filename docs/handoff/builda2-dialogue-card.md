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
