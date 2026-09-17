# Polish pass: damage numerals

Key: `damage-numbers`. Scope: where a damage figure is drawn, what it looks
like, and who owns the code.

## The defect

`docs/screenshots/46-attack.png`, `47-boss-attack.png` and `48-overdrive.png`
all show a numeral in the wrong place: `789` printed across the ATTACK row of
the command menu, `5958` and `5431` hanging in empty air beside the party.

Three separate causes, all in `src/ui/ffx/DamageNumbers.ts`:

1. **Head anchor, not chest.** `PaintedStage.project()` returns
   `PaintedActor.headPoint()` — `worldHeight * 0.92`, the top of the figure.
   Hanging a numeral off that and then floating it upward puts it well clear of
   anybody's silhouette, which is the "empty air" in 47/48.
2. **Nothing dodged the HUD.** The projection was in fact *correct* in 46 — a
   probe against the live stage puts Yuna's anchor at `(280, 437)` at
   1600x900, which is exactly where `789` is drawn. Yuna simply stands behind
   the opaque command stack, so a correct numeral was invisible on top of a
   menu row. Nothing in the numerals code knew the HUD had panels.
3. **The glyph was an ink splash, not an FFX numeral.** `.ig-damage` is a
   ~170px black/gold polygon with a 57px Cormorant italic figure, anchored at
   the glyph's *top-left* (no centring transform) and then `scale(1.3)`-ed
   about its own centre, so the visible mass sat roughly `+70px` right of the
   point it was supposed to mark. It also swallowed the character it belonged
   to and read as a blot rather than a hit.

Secondary: numerals were spawned once at a fixed screen point and animated by
CSS transition, so a moving battle camera left them behind; crits were not
distinguished at all; and the multi-hit "ladder" was a flat `6px/5px` nudge
per hit rather than the staggered diagonal in `research/visual-bible.md` §3.6.

## What changed

### `src/ui/common/DamageNumbers.ts` — now the single implementation

Per `docs/CONTRACT-CHANGES.md` decision 12 (the HUD mounted for a battle owns
its numerals, and FFX-2 reuses this rather than writing a third copy). It was
orphaned — `tools/orphans.mjs` had flagged it as having no importers. It now
backs the FFX HUD, and the API is documented for FFX-2 to mount the same way:

```ts
const numbers = new DamageNumbers({
  root: this.overlay,                    // optional: or place `numbers.el` yourself
  project: (id, anchor) => stageProject(id, anchor),  // viewport px, or null
  anchor: 'chest',                       // default
  scale: () => this.stageScale,          // HUD authoring grid -> viewport px
  avoid: () => this.panelRects(),        // opaque HUD slabs, viewport px
});
numbers.mount();
numbers.update(dt);                      // once per frame
const el = numbers.spawnEvent(event);    // returns the element, or null
if (el) el.appendChild(chainChip);       // FFX-2's CHAIN xN rides the hit
```

- `spawnEvent(event)` maps a `BattleEvent` (`damage` incl. negative amounts and
  the `immune`/`absorb` affinities, `heal`, `miss`, `mp-damage`, `mp-heal`) to a
  numeral and **returns the element**, which is how an FFX-2 chain chip can ride
  the hit it belongs to without a second numeral system.
- Every live numeral **re-projects its target every frame**, so it stays pinned
  to the actor that was struck while the battle camera moves.
- Positions are converted from the projector's viewport pixels into the layer's
  own coordinate space via one `getBoundingClientRect()` per frame, instead of
  assuming the layer sits at `0,0`.
- `scale()` multiplies §3.6's sizes (quoted on the 640x360 grid) and every
  ladder/bounce offset, so a plain hit is `16 * 2.5 = 40px` at 1600x900 rather
  than 16 real pixels.
- `max` caps simultaneous numerals (48) so a long chain cannot pile up.

### Stacking: one ladder per target, not per action

Anchoring alone was not enough. A recapture showed two numerals printing
*through* each other whenever two things landed on one actor in the same beat —
a `MISS` struck across an `11500` on Yuna in `47-boss-attack.png`, two figures
sharing Tidus in `48-overdrive.png`. §3.6's `(+4, -3) * i` diagonal is a
sub-glyph step (7px at 1600x900 under a 40px figure), and it only ever applied
*within* one action's hit list, so unrelated events both sat on rung 0.

`DamageNumbers.spawn` now takes the rung a numeral starts from as
`max(hitIndex, numerals already riding that target)`:

- a multi-hit action still ladders by its own hit list (hit *i* is rung *i*,
  because *i* numerals are already up);
- a hit and the MISS chasing it, an AoE plus a counter, or the same actor
  struck twice in a second step clear of each other;
- the spawn *delay* still comes from `hitIndex` alone — an event that simply
  arrived later is already late and must not be held back a second time;
- rungs wrap at `LADDER_RUNGS` (5, about 170px), so a reel or a long chain
  cannot walk numerals off the top of the screen and pile them against the
  clamp.

The rung's vertical step is `ladderPitch()` — just under a glyph height rather
than §3.6's 3px — which is the change that actually makes a five-hit ladder
readable. §3.6's diagonal survives as the horizontal drift.

Two smaller fixes fell out of the same recapture:

- **Width is measured on the first frame a numeral draws**, not at spawn.
  `offsetWidth` reads 0 before the layer has layout or the numeral font has
  loaded, and a numeral that thought it was 16px wide hung off the edge of the
  layer instead of being clamped.
- **The spawn pop counts toward the dodge.** The 1.35x/1.7x pop is a transform
  about the glyph's own centre, so a numeral landing near an edge or a panel
  overhung it for the first 0.12s; `deflectFromRects` now gets the popped
  extent.

### `src/ui/common/damageLadder.ts` — added `deflectFromRects`

Pure, unit-tested. Given the numeral's centre and half-extent plus the HUD's
opaque panels, it returns the cheapest single-axis push that clears them and
still fits the layer. Up is slightly preferred (numerals rise anyway), down is
heavily penalised (that is where the party-status slabs live). Panels packed
closer together than the numeral is wide have no gap to sit in, so a final pass
clears the whole cluster at once rather than shuttling between them.

`classifyDamageEvent` now also accepts `crit`, which is `BattleEvent`'s own
spelling of `critical`; everything else in the module is untouched and its
existing tests still pass unchanged.

### `src/ui/ffx/DamageNumbers.ts` — now a thin FFX adapter

Same public surface `FFXBattleHud` already used (`el`, `setProjector`,
`setSideResolver`, `spawn(event)`), so the HUD's wiring did not move. It only
supplies the FFX-specific bits:

- **Panel rects**: `.ig-cmd-stack` (which the trigger prompt draws itself as),
  `.ffx-cmd-info`, `.ffx-cmd-breadcrumb`, `.ig-ctb`, `.ig-stat-list` and
  `.ffx-sensor`, queried live (the stack grows and shrinks a level at a time)
  and skipped when hidden. The telegraph banner is deliberately *not* in the
  list: it is a transient band across the middle of the field, and dodging it
  would shove every numeral on screen exactly as the boss winds up.
- **Letterbox scale**: the same `min(w/640, h/360)` `FFXBattleHud.layout()`
  applies, read from the `.ffxhud` root.
- **Ticking**: `update(dt)` from the battle screen's frame loop. Standalone
  hosts (the HUD demo screen, unit tests) never call it, so the first spawn
  starts an internal rAF loop that shuts itself off the moment a real `update`
  arrives.

`setSideResolver` is kept as a no-op hook: the FFX numeral style is the same
glyph whichever side is struck (the ink splash used to invert), and keeping it
meant `FFXBattleHud` did not have to change there.

### Anchors: `'head' | 'chest' | 'feet'`

Small additive change so numerals can ask for the chest without moving the
target cursor, which still wants the head:

- `BattleStage.project(id, anchor?)` (`src/engine/BattlePresenterPorts.ts`),
  implemented in `src/engine/BattlePresenterStage.ts` over the `PaintedActor`
  points that already existed (`centerPoint`, `headPoint`, `position`).
- `HudPort.setProjector` widened, plus a new optional `HudPort.update?(dt)`.
- `BattleScreen` forwards the anchor and ticks the HUD from `update()`, so HUD
  motion freezes with the rest of the game when a capture calls `App.stop()`
  (the old CSS transitions kept running through a screenshot).

### CSS

- `src/ui/common/damage-numbers.css` is unchanged and is now actually used: the
  FFX numeral style the task asks for was already here — Chakra Petch bold
  italic, white with a dark multi-drop-shadow outline, `.dnum--critical`
  yellow-white and larger, `.dnum--heal` green, `.dnum--mp` blue,
  `.dnum--miss`/`--immune`/`--absorbed` plain.
- `src/ui/ffx/ffx-hud.css`: the `.ffxhud .ig-damage` / `.ffx-numeral-chip`
  rules are gone (nothing draws those elements in this HUD any more). What is
  left is placement only — `.ffx-numerals-layer`, plus a `.ffxhud`-scoped
  `z-index: 30` so it wins over `.dnum-layer`'s own `z-index` regardless of
  stylesheet emission order. `.ig-damage` itself still lives in
  `src/ui/inkgold/slabs.css`, untouched, for the mocks that reference it.

## Tests

- `tests/unit/ui-common-damage-ladder.test.ts`: 5 new cases for
  `deflectFromRects` (clear miss, the 46-attack command-menu case, up-over-down
  preference, two panels with no gap between them, staying inside the layer).
- `tests/unit/ui-ffx-hud.test.ts`: the two numeral cases now assert against
  `.dnum` instead of `.ig-damage__value` / `.ffx-numeral-chip--miss`, and check
  that the numeral asks for the `'chest'` anchor, re-projects on `update()`,
  marks a crit, stacks one element per hit of a multi-hit action, and prints
  MISS.

`npx tsc --noEmit` reports nothing in any file this pass owns. Four pre-existing
errors elsewhere are noted in the handoff JSON.

## Verification

Captured at 1600x900 against `npx vite --port 5202`, each shot frozen from
inside the page (`__pyrefly.app.stop()` on the frame the numeral is up — the
first hit on Seymour cues a mid-battle cutscene, so a round trip out to node
loses the frame).

- `docs/screenshots/polish/damage-numbers.png` — Tidus attacks Seymour Flux and
  `803` sits on Seymour's chest. Measured: numeral centre `(1179, 283)` against
  a projected chest of `(1154, 324)` — a jitter and a bounce above the anchor,
  not over the menu and not in open air.
- `docs/screenshots/polish/damage-numbers-multihit.png` — a five-hit ladder
  plus a crit pushed through `hud.onEvent` with the command menu open:
  `700 / 737 / 774 / 811` climb Seymour, the crit `848` tops the ladder in
  yellow-white, and the `789` on Yuna — who stands *behind* the command stack
  (her chest projects to `(288, 554)`, inside the menu's `76,511 - 527,836`) —
  is pushed clear above the ATTACK row. That is the `46-attack.png` case.
- `docs/screenshots/polish/damage-numbers-ladder.png` — the same during
  ordinary autoplay: three hits on three different actors, each numeral on the
  figure it belongs to, one of them deflected out of the CTB column.

Watch out when re-capturing: **a dev server left running from an earlier
session serves its own stale modules**. The first pass of this capture was
measured against pre-fix code (five numerals reported the identical `y`) until
the port was checked. `curl http://localhost:<port>/src/ui/common/DamageNumbers.ts`
and grep it for the code you just wrote before trusting a screenshot. Vite also
full-reloads the page whenever any agent saves a file in this tree, which
destroys the execution context mid-capture — the capture scripts retry.
