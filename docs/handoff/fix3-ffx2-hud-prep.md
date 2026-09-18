# fix3 — ffx2-hud-prep

Track owner: `src/ui/ffx2/**`, `src/ui/ffx/party-prep/**`,
`src/ui/common/party-prep.css`, `src/ui/common/portrait.ts`,
`src/ui/ffx2/party-prep/**`.

Four carried-over defects off Bailey's play of the live build. All four are
closed; the residue and the one request for another track's file are at the
bottom.

Nothing here touches battle math, an ability, an AI script or a boss. Every
change moves chrome or reads data that was already on the board.

---

## 1 — FFX-2 party rows had no painted portraits

**Was:** the three rows drew a two-letter dressphere monogram (`WM`, `DK`,
`WR`) where the FFX side draws a face.

**Now:** `PartyRows.faceStackHtml` stacks the same three layers
`ui/ffx/portraits.ts` does, in one square tile, per the girl's *current*
dressphere:

| z | source | who it is for |
|---|--------|----------------|
| 2 | `portraits/<girl>-<dressphere>.png`, then `portraits/<girl>-x2.png`, then `portraits/<girl>.png` | Yuna and Rikku today; the X-2 ids start working the moment the art fleet promotes a candidate |
| 1 | the head band of `characters/<girl>-<dressphere>/idle.png` | **Paine**, who has no portrait file at all, and any dressphere nobody has painted a portrait for |
| 0 | the two-letter monogram | the floor; nothing ever shows a broken image |

Layers are stacked rather than chosen because the art manifest may not have
landed on the first frame. Each `<img>` carries `onerror="this.remove()"`, so
whichever layer is real wins and a miss costs nothing. The lookup goes through
`portrait.faceImgHtmlFrom` / `portrait.bodyFaceImgHtml`, which ask
`public/art/manifest.json` before emitting an `<img>` at all — no 404s in the
live site's network panel.

## 2 — the FFX-2 prep screen had only a Chapter tab

**Was:** one `CHAPTER` tab where the FFX prep has five, so a player walking
into Bahamut or Vegnagun could read the fight but not the party.

**Now:** four tabs, in `src/ui/ffx2/party-prep/panels.ts`, all reading the real
loadout and all **read-only**:

- **CHAPTER** — the shared briefing, unchanged.
- **DRESSPHERES** — the current sphere, its command set, the AP ladder and next
  ability out of `STANDARD_DRESSPHERES`, the Garment Grid's node position, gates
  passed and bonus out of `GARMENT_GRIDS`, and the rest of the girl's owned
  spheres as chips.
- **ACCESSORIES** — what each girl is wearing and what it actually does, from
  `battle/ffx2/accessories.ts`.
- **ITEMS** — the bag, from `FFX2_ITEMS`, with gil.

FFX's Sphere Grid tab has no X-2 counterpart and is not faked; the Garment Grid
summary lives inside the Dresspheres tab because in X-2 the grid *is* a property
of the sphere set, not a separate board.

Read-only is deliberate: a dressphere swap on this screen would change the
battle each chapter's research was written against. The older standalone
`src/ui/ffx2/PartyPrep.ts` stays unwired — it draws its own chrome and the shell
owns the frame now.

## 3 — Auron's HUD portrait was cropped through the chin

**Root cause:** every portrait in the game was regenerated on 2026-09-18 against
`CROPS` rows measured on the 16th. Auron's row assumed a 671x1216 file; the
painting is 832x1216, so the frame the geometry solved against was 24 % too
tall and his eye line landed a fifth of a tile low.

**Fixed generally, in `src/ui/common/portrait.ts`,** in order of how much each
part matters:

1. **The aspect comes from the file, never from the row.** `refineFaceCrop`
   re-places a portrait from its real `naturalWidth / naturalHeight` as soon as
   the bytes land — on the capture-phase `load` listener for a cold image, and
   on a one-frame sweep for one that came out of the HTTP cache before anything
   could listen.
2. **The placement is clamped to cover the frame.** A row that over-estimates
   the head scale can now only mis-*centre* a head; it can no longer leave bare
   frame under a chin. That is the difference between "slightly off" and "cut".
3. **Sidecar focal data wins over the table.** `portraits/<id>.json` with a
   `focal: { fx, fy, ipd }` block replaces the row entirely
   (`portrait.portraitFocal`, asked once per id, lazily, miss cached). Nothing
   emits one yet — this is the hook that lets a re-rolled painting be right
   without a human re-measuring, and it is the request to the art fleet below.
4. **An unknown id gets a plain top-biased crop** (`DEFAULT_CROP`) rather than a
   guess at somebody's eye line, so an unmeasured painting can never be blown up
   to five times its frame.

Every row in `CROPS` was then re-measured against the current files off the
calibration rig — each portrait rendered through the live geometry into a 320px
reference tile with the target eye line and eye-to-eye ticks drawn on top, so a
row is right when the pupils sit on the crosshairs rather than when it looks
about right.

**Checked across both games**: `portrait-crops-all.png` (below) renders every
portrait id and every FFX-2 body-crop fallback through the live loader at both
the HUD's 56px tile and a 180px blow-up, and asserts no tile has bare frame on
any edge.

## 4 — FFX-2 HUD overlap, chapters 4 and 5

Measured with DOM bounding boxes at 1280x720, 1600x900, 2000x1000 and
2560x1440, against the boss gauges, the chain chip, the spherechange wheel, the
command stack, the party column, the strategy rail, the move advisor, the enemy
intent slab and each of the four fighters' projected bodies.

**Was** (Chapter 4, `report-battle4-c.json`): the strategy rail drawn down
Yuna's face, the advisor card over Rikku and Yuna, the advisor's right edge on
Paine's HP row, and the intent slab sitting square on the advisor card at three
of the four viewports.

Three different causes, three fixes, all in `FFX2BattleHud.ts`:

### 4a — the shared panels were anchored to the wrong things

`StrategyGuide` and `MoveAdvisor` take anchors as *elements*, and this HUD was
handing them HUD panels. In FFX-2 the thing actually in their way is the party
formation, which the 3D stage draws and the DOM knows nothing about — and where
it is **moves with the viewport's aspect**, because the scene renders to the
whole window while this chrome is letterboxed into a 640x360 grid. A fixed
anchor number is right at one aspect and wrong at the next.

So the HUD parks three invisible 1px markers (`.ffx2hud__fence`) in the stage
every frame and hands *those* over as anchors:

| fence | tracks | feeds |
|-------|--------|-------|
| `party-top` | the topmost girl standing in the rail's own column | `StrategyGuideAnchors.above` |
| `party-right` | the rightmost girl standing in the card's own band | `MoveAdvisorAnchors.after` |
| `party-column` | the leftmost `.ig-stat` row's **painted** box | `MoveAdvisorAnchors.before` |

Each falls back to exactly the fixed number it replaced, so a formation that
leaves the chrome alone still gets the full-length rail and the full-width card.

The column fence is measured off `getBoundingClientRect`, not `offsetLeft`,
because `.ig-stat` carries the house `skewX`: the lean pushes the row's corner
out past its layout box, and that 6px sliver is exactly what the advisor card's
right edge was catching.

`.ffx2hud__enemies` also grew a 12px `padding-bottom`. The rail is anchored
under that strip and `StrategyGuide.layout` parks its `G HIDE GUIDE` chip 11px
*above* the rail's top, which put the chip back inside the bottom gauge. Padding
is what the anchor measures (`offsetHeight`), so it is the one place the
clearance can live without moving a gauge or reaching into the shared component.

### 4b — the intent slab needed a real placement, not a dodge

`EnemyIntentPanel.layout` pins the slab over the acting enemy's head, clamps it
into the overlay, then slides it off each avoided rectangle **in one greedy pass
that never re-checks**. That is fine with one obstacle. With nine it ping-pongs
— dodging Bahamut lands it on the gauge strip, dodging the strip lands it back
on Bahamut — and the final "nowhere to go sideways" branch drops it to the floor
of the overlay, onto the move advisor.

Merging the obstacles first is worse. A bounding-box union of Bahamut and the
command stack covers the clean corner *between* them, and every FFX-2 panel is
within a slab's width of the next, so one merge cascades into a single rectangle
the size of the screen. (That merge was tried; `report-battle4-c.json` is what
it produced.)

`src/ui/ffx2/intentPlacement.ts` solves it instead:

- `placeSlab` — a candidate search over the obstacle edges for the free spot
  nearest where the slab wants to be, weighting a vertical move 3x a horizontal
  one (the slab's whole claim is "this is about *that* boss", and it makes it by
  staying on the boss's eye line). It never floats the slab above its natural
  top, keeps it inside the frame, reserves headroom for the slab's own `E HIDE`
  chip, and when genuinely nothing is free returns the least-covering spot.
- `steerRects` — turns that answer into the one or two rectangles whose greedy
  resolution *is* that answer. Each branch of the dodge is invertible, so one
  rectangle per axis is enough. It returns `[]` when the slab is already right,
  which is the common case and means no dodging happens at all.

The HUD reproduces the first two steps of `layout` exactly (project the head,
hang the box `HEAD_GAP` above it, clamp), solves, and returns the steering
rectangles from `avoid()`. Anything it cannot reproduce — no projection yet, no
laid-out overlay, no view — falls back to handing over the raw obstacles, i.e.
the old behaviour.

`tests/unit/ui-ffx2-intent-placement.test.ts` drives it through a **verbatim
copy** of `EnemyIntent.layout`'s dodge and asserts the round trip lands clear of
all eleven real Chapter 4 boxes at every one of the four viewport scales. If
that file's algorithm changes, the test fails — which is the signal to delete
`intentPlacement.ts` and use whatever replaced it.

### 4c — the fighters are obstacles too

The slab and the advisor were treated as if only DOM panels existed. There are
no sprite bounds to ask for (`PaintedStage.snapshot()` reports poses, not
extents), so a fighter's body box is the projected head-to-feet span with a
half-width of 0.28 of that height — about right for the girls, deliberately
narrow for a spread dragon, since a box claiming Bahamut's whole wingspan would
leave the slab nowhere to stand.

---

## How it was verified

A real Chromium (`playwright`, SwiftShader) against a `vite` dev server on a
random port, driven through `window.__pyrefly` — `gotoChapter` into the actual
Chapter 4 and 5 fights, waiting on a real command menu being open, then reading
`getBoundingClientRect` for every panel and `stage.project(id, 'head'|'feet')`
for every living fighter. No grep, no jsdom, for any of §4.

Screenshots and the machine-readable reports are in
`docs/screenshots/fix3/ffx2-hud-prep/`, suffixed by run:

| suffix | what |
|--------|------|
| `-before` | the live build's behaviour |
| `-c` | after the fences, before the placement solver — the merge experiment |
| `-d` | after the placement solver |
| `-e` | final: both prep screens, both battles, all four viewports |

`report-*.json` carries every rect, every pairwise overlap, every fighter-vs-panel
hit, plus page errors and any `/art/` 404. `report-portrait-crops.json` carries
the per-tile bare-frame measurement for §3.

Unit: `tests/unit/ui-ffx2-intent-placement.test.ts` (new),
`tests/unit/ui-ffx2-hud.test.ts`, `tests/unit/ui-ffx2-party-prep.test.ts`,
`tests/unit/party-prep-panels.test.ts`, `tests/unit/ui-portrait-urls.test.ts`.
`npx tsc --noEmit` clean.

---

## Requests for other tracks

**`src/ui/common/EnemyIntent.ts` (advisor track).** `layout()`'s dodge is a
single greedy pass that never re-checks a rectangle it has passed, which cannot
place a panel on a board with more than a couple of obstacles — it is what put
the slab on the advisor card. Replacing it with a real placement pass (the
candidate search in `src/ui/ffx2/intentPlacement.ts` is one, and is pure and
tested) would let both HUDs hand over their raw obstacle list and delete this
track's steering entirely. Until then `intentPlacement.ts` steers from outside,
and its test pins the dodge's current shape so the coupling fails loudly rather
than silently.

Secondary, same file: with the panel up, the `E HIDE` chip is placed at
`top - chipH - 1` and then clamped into the frame, so a slab flush with the top
edge wears its own chip across its first line. This track works around it by
reserving headroom in `placeSlab`; clamping the *panel* down instead of the chip
up would fix it for both games.

**`src/app/screens/PartyPrepContent.ts` (shell).** The prep roster and the
bottom slot cards call `faceImgHtml(id)` alone, so **Paine** — who has no
`portraits/paine.png` — gets her name initial where the FFX-2 battle rows give
her a painted face. The fix is the same three-layer stack `PartyRows` uses:
`faceImgHtmlFrom([...])` over `bodyFaceImgHtml('<girl>-<dressphere>')` over the
initial. Both helpers are already exported from `ui/common/portrait.ts`. Not
done here because the call site is the shell's, and changing `faceImgHtml`'s own
semantics would silently put body crops into the pause screen and chapter select
mid-round.

**Art fleet.** `portrait.portraitFocal` reads `public/art/portraits/<id>.json`
for a `focal: { fx, fy, ipd }` block — eye midpoint and eye-to-eye distance as
fractions of the file — and it wins over the hand-measured table. The pipeline
already writes that sidecar with the generation parameters and `width`/`height`;
adding those three numbers at render time is what stops a re-roll from ever
cutting a face again, and would let `CROPS` be deleted.

## Left / known residue

- **2560x1440 needs a long settle.** The first probe reported zero HUD boxes
  there because the HUD had not mounted yet — on SwiftShader that viewport takes
  minutes to stage its art, and the probe's wait was swallowing its own timeout.
  The final run waits on `.ffx2hud__party .ig-stat` and an open command menu and
  throws rather than measuring an empty screen. This is a harness property, not
  a game defect: the HUD mounts correctly there, it is just slow under software
  GL.
- **Paine's prep tile** — see the request above.
- **The `CROPS` table still exists** and still goes stale on a re-roll. The
  clamp means stale now costs a mis-centred head rather than a cut one, but the
  real fix is the sidecar.
