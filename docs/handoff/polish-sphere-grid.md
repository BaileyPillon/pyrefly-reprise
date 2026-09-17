# Polish: the Sphere Grid tab

**Key** `sphere-grid` · **Owns** `src/ui/ffx/party-prep/**`, the grid-tab rules in
`src/ui/common/party-prep.css` · **Dev port** 5203

## The defect

`docs/screenshots/42b-sphere-grid.png` (before): the Sphere Grid tab was a
~340x100 dark strip pinned to the top-left corner of an otherwise empty ivory
slab. Inside the strip the nodes were an illegible grey blob, and the one
caption — "Tidus — S.Lv 30" — was printed in `--ig-paper` on `--ig-paper`, so
it read as a ghost.

Three separate causes, not one:

1. **Resolution.** Every Ink & Gold screen is authored on the 640x360 grid and
   scaled onto the viewport by a single `transform: scale(k)` on
   `LetterboxStage`'s inner element, so a `<canvas>` inside that stage has
   *three* sizes: `clientWidth` (authoring px), `rect.width` (CSS px after the
   transform) and `rect.width * dpr` (device px). The old view sized its
   backing store from `rect.width * dpr` but set the drawing transform from
   `dpr` alone, so the drawing covered `1/k` of the canvas — the dark strip.
2. **No data.** The shipped builds carry placeholder positions
   (`'tidus-sphere-30'`) and empty `activatedNodeIds`, so there was nowhere to
   stand and nothing lit: 860 identical dormant dots, i.e. the grey blob.
3. **Contrast.** The captions were drawn in paper-on-paper instead of ink.

## What the tab is now

- **Canvas fills the slab**, responsive and `devicePixelRatio`-aware.
  `SphereGridView.resize()` computes `viewScale = (rect.width / clientWidth) *
  dpr` and uses it for both the backing store and `ctx.setTransform`, and a
  `ResizeObserver` re-runs it. Verified: a 334x98 authoring box becomes an
  836x245 backing store at dpr 1, 1600x900.
- **Renders `standard-grid.json`** — all 860 nodes, 881 links, 98 clusters, on
  a parallaxed starfield with a horizon wash. Links are drawn: gold between two
  activated nodes, a pulsing pale gold around the node you stand on, slate
  elsewhere. Only the visible window is drawn, plus a 120-unit margin.
- **Zoom and pan.** Mouse wheel zooms about the pointer, drag pans, `+`/`-`
  and L1/R1 (`F`/`R`, PageUp/PageDown) zoom about the cursor node, CENTRE
  re-frames the selected character. Range 0.06x–1.8x. The tab **opens centred
  on the selected character's current node at 0.45x**, where node labels
  render (`LABEL_ZOOM` 0.28), biased up to 45% of a half-viewport toward the
  local centre of mass so the frame holds grid rather than empty space —
  Tidus stands at the tip of his own cluster, so centring on him exactly left
  half the canvas blank.
- **FFX node colouring** [visual-bible §5.4]: HP, MP, Str, Def, Mag, MDef,
  Agi, Luck, Acc, Eva, Ability (gold), Empty (slate) and Lv.1–4 locks, the
  deepest lock darkest. Accuracy and Evasion are this tab's own additions —
  the bible's table omits them and the previous revision reused Agility's and
  Defense's, which made four stats indistinguishable. Locks are drawn as a
  diamond plate, not another circle, so a barrier reads as a barrier. A legend
  strip sits along the canvas's bottom edge (it belongs on the starfield, not
  on the ivory: the sheet is 334 authoring px wide and a 13-swatch legend laid
  out in the ivory row ran off the slab).
- **Activated nodes are tinted per character** — one hue each (Tidus ice
  blue, Yuna rose, Auron rust, Kimahri jade, Wakka orange, Lulu violet, Rikku
  lime) — with a soft bloom, a white inner dot and the character's tint on the
  ring, so a walked cluster reads as a lit constellation.
- **Position markers**: every character's node carries a round portrait chip
  in a ring (`art/portraits/<id>.png`), the selected one larger and haloed.
- **Tooltip** on hover and on the keyboard cursor: the node's name, its effect
  (`+2 AGI`, "Learns an ability", "Blocks the path", "Path only") and its
  sphere cost with how many the pouch holds, in red when it holds none. The
  ivory caption line under the canvas says the same thing in dark ink, plus
  what Enter (or a click) will do and what it costs in S.Lv.
- **Sphere pouch strip** along the ivory foot: the nine families with counts,
  greyed when empty, underlined in gold when the focused node wants that one.
  Caption and pouch sit on **two** rows, not one: sharing a row on a 334px slab
  left the sentence about half a line ("Agility +2 — permanent +2 AGI  Move
  onto the nod…"). Two rows cost the canvas 8px and buy the caption the full
  width.

## The real interaction

`src/data/ffx/sphere-grid/` is **data only** — there is no
`src/data/ffx/sphere-grid.ts` and no engine module that walks the graph — so
the rules live in `src/ui/ffx/party-prep/sphereGridModel.ts` rather than as
edits to the data files, per the brief.

The model writes **straight through to the live `FFXPartyBuild`** the chapter
is fought with:

| Action | Effect |
|---|---|
| Move along a link | `−1 S.Lv`, or `−1` per **four** steps over already-travelled ground (tracked as quarter-steps); `sphereGrid.position` follows |
| Activate a stat node | `−1` matching sphere from `sphereInventory`; `member.stats[field] += value`; `hp`/`mp` lift with `maxHp`/`maxMp`; node recorded in `activatedNodeIds` |
| Activate an ability node | the `AbilityId` is appended to `learnedAbilityIds` when the grid's display name resolves against `ALL_ABILITIES` |
| Open a Lv.N lock | `−1` key sphere, from the node **beside** it, and it opens for **every** character (FFX's rule) |

Two `[estimate]` seams, both in the UI and never written into
`src/data/ffx/**`:

- **Positions** come from `standard-routes.json` when the build's own position
  is a placeholder string. Stats are *not* replayed from the route — the build's
  stat block already reflects the character's progress, so replaying would
  double-count.
- **The pouch.** Every shipped build has `sphereInventory: {}` (Gagazet's says
  so: "assumed fully spent building the stat blocks above"). An empty pouch
  makes activation permanently impossible and the tab a picture rather than a
  screen, so when the party holds nothing at all the model seeds a small
  documented starter pouch (12 power / 8 speed / 8 mana / 4 ability / 1 fortune
  / 4-2-1-1 keys) and sets `pouchIsEstimated`.

## Keyboard, mouse and the shell

The prep shell owns Up/Down (roster) and Left/Right (tabs), so the grid does
not simply grab the d-pad.

| Input | Does |
|---|---|
| Shift / Tab / Q (triangle) | toggle **walk mode** |
| Arrows, in walk mode | step the cursor to the linked node most nearly in that direction (links, not screen proximity) |
| Enter | act on the cursor node: open an adjacent lock, activate the node you stand on, or step onto a linked one |
| Esc | release the grid (walk mode off, canvas blurred); the *next* Esc is the shell's own BACK |
| `F` / `R`, PageUp / PageDown (L1/R1) | zoom, always |
| Wheel / drag / click | zoom about the pointer, pan, select a node; a second click on the selected node is Enter |
| CENTRE | re-frame the character — and from a zoom too far out to render a label, restore the opening zoom, so there is always a way back from being lost |

Two input bugs found and fixed during verification:

- **`#ui` is `pointer-events: none`** (the whole overlay layer is, so the
  WebGL canvas underneath keeps the cursor) and that inherits all the way
  down. Every pointer event over the grid was landing on `#game > canvas`, so
  hover, drag-pan and wheel-zoom did nothing at all. The tab now turns pointer
  events back on for its own canvas and its own view controls, and nothing
  else (`.ffxprep-sg__canvas`, `.ffxprep-sg__btn`).
- **Enter leaked to the shell and started the battle.** Two paths: a focused
  `<button>` turns the next Enter into a second click on itself (which toggled
  WALK straight back off, so the panel no longer consumed the key), and
  clicking a node focuses the canvas but left the panel outside walk mode. The
  buttons now blur after a click, and the panel consumes Enter/Esc whenever it
  is **engaged** — walk mode *or* canvas focus.

## Files

- `src/ui/ffx/party-prep/sphereGridData.ts` — loader/index for the two JSON
  files: typing, adjacency (folded from both the per-node `links` and the
  top-level list), bounds, the palette, the legend, sphere-id / stat-field
  mappings, labels.
- `src/ui/ffx/party-prep/sphereGridModel.ts` — movement, activation, locks,
  hydration, the write-through to `FFXPartyBuild`.
- `src/ui/ffx/party-prep/SphereGridView.ts` — the canvas: resolution, pan/zoom,
  drawing, pointer wiring.
- `src/ui/ffx/party-prep/SphereGridPanel.ts` — the ivory chrome (S.Lv header +
  AP bar, caption, pouch, view controls) and the keyboard contract.
- `src/ui/ffx/party-prep/party-prep.css` — the `.ffxprep-sg*` rules.
- `src/ui/common/party-prep.css` — **grid-tab rule only**: the slab starts at
  `top: 66px` on this one tab (`:has()` on the visible panel container), so the
  map gets the whole gap between the tab strip and the hint line.
- `tests/unit/sphere-grid-model.test.ts` — 10 tests over the rules a
  screenshot cannot check (see below).

## Verification

Dev server on :5203, Playwright at 1600x900, HMR socket stubbed.

| Shot | Shows |
|---|---|
| `docs/screenshots/polish/sphere-grid.png` (+ `-crop`) | the opening view at 0.45x, centred on Tidus, tooltip on a hovered neighbour |
| `docs/screenshots/polish/sphere-grid-zoomed.png` (+ `-crop`) | zoomed in on the selected character, labels at full size |
| `docs/screenshots/polish/sphere-grid-far.png` (+ `-crop`) | zoomed out to the whole grid |
| `docs/screenshots/polish/sphere-grid-walk.png` (+ `-crop`) | walk mode: WALK lit, cursor stepped to a linked node, caption pricing the move |
| `docs/screenshots/polish/sphere-grid-yuna.png` (+ `-crop`) | a second character — her own tint, her own position chip, a Lv.3 lock diamond, Tidus's chip still on the map |

The `-crop` variants are the slab alone, which is where the type is small
enough to need a close look.

Driven interactively in the browser, not just looked at:

- drag-pan tracks the cursor (before/after pair) and the starfield parallaxes;
- wheel zoom runs 0.45x → 0.89x → 0.09x and back;
- walk mode steps the cursor along links, Enter moves, `S.Lv 30 → 29` on both
  the panel header and the shell's roster row, and the quarter-step rule shows
  up as one S.Lv per four travelled steps;
- Enter no longer starts the battle; one Esc releases the grid and leaves the
  screen on `party-prep`.

`tests/unit/sphere-grid-model.test.ts` covers what the pixels cannot: every
placeholder position resolves to a real node id, the starter pouch is seeded
only into an empty one, movement follows links and prices travelled ground,
activation spends exactly one sphere and moves exactly one stat field once,
and a lock opens for everyone. `npx vitest run
tests/unit/sphere-grid-model.test.ts` — 10 passed. `npx tsc --noEmit` clean.

## Notes for whoever is next

- `#ui` being `pointer-events: none` means **the prep shell's own click
  affordances are dead too** — the tabs, the roster rows and START BATTLE all
  carry `data-action` and `role="button"`, and `PartyPrepScreen.handleInput`
  reads `input.actions`, but no pointer event ever reaches them. That is the
  shell's file, not this tab's, so it was left alone; it wants one
  `pointer-events: auto` on the shell's interactive elements.
- `tests/unit/party-prep-panels.test.ts` failed one of its eight on this
  machine with `Hook timed out in 15000ms` inside its own
  `vi.resetModules()` + dynamic-import `beforeEach`. It is load, not this
  work: that test's module graph is `PartyPrepScreen.ts` + `encounters.ts`
  and reaches none of the files here (the dependency runs the other way —
  `party-prep/index.ts` imports the screen, never the reverse). Worth a
  re-run on a quiet machine.
- The panel touches exactly one line of the shell's DOM: it rewrites
  `.prep__member--sel .prep__member-lv` when an S.Lv is spent, because the
  roster column only redraws when its own cursor moves and would otherwise
  keep printing the old level.
