# Round 2 — damage numerals: stagger, fan, lanes, safe area

**Key:** `damage-numbers-fan`. Owns `src/ui/common/DamageNumbers.ts`,
`src/ui/common/damageLadder.ts`, `src/ui/common/damage-numbers.css`,
`src/ui/ffx/DamageNumbers.ts`, `src/ui/ffx2/DamageLayer.ts`.

Fixes **issue 2** of `docs/handoff/playability-round-1.md` (multi-hit and
multi-target numerals stacking on one spot) and the **numeral half of issue 3**
(numerals drawn across the right-hand CTB column).

Nothing outside the numeral layer changed. No engine, data, stat, ability or
AI file was touched. `src/ui/ffx/DamageNumbers.ts` needed no edit at all — the
FFX adapter already supplied the HUD panel rects the new safe-area math reads.

---

## 1. What was actually wrong

The old layer had one anti-overlap mechanism: a five-rung ladder, where the rung
was `max(hitIndex, numerals already live on this target) % 5`. Four things went
wrong with it at once, and the screenshots show all four.

| # | Failure | Where it shows |
|---|---|---|
| 1 | **Everything appeared on the same frame.** `delayMs` came from `computeHitOffset(hitIndex)`, so an FFX-2 chain that spawns every link with `hitIndex` 0 — which is exactly what the class doc told callers to do — got `delayMs` 0 for every link. Eight figures popped simultaneously. | `53-ffx2-vegnagun.png` |
| 2 | **The ladder wrapped onto live rungs.** Rung 5 reused rung 0's position while rung 0 was ~400ms into a 900ms life. | `53-ffx2-vegnagun.png` |
| 3 | **The rung was cancelled by the arc.** Even when a stagger did apply, a hit released 80ms later is 80ms earlier in its own ballistic arc, and §3.6's arc climbs ~10px in 80ms against a rung pitch of ~16px. Two consecutive hits sat ~6px apart for the first third of a second. | `48-overdrive.png` |
| 4 | **Different targets shared a position.** Two party members standing shoulder to shoulder project chest points a handful of pixels apart, and nothing separated their ladders. | `50-yunalesca.png` — `2200` under `1850` |

And for issue 3: a numeral only dodged a HUD slab **after** it already
overlapped one, via `deflectFromRects`. By then several numerals had each been
pushed to the *same* nearest free edge — clamping is a pile-up generator, not a
pile-up fix.

## 2. What replaced it

Four mechanisms, all pure functions in `damageLadder.ts`, all unit-tested.

### 2.1 A per-target queue with a short stagger — `nextBurstSlot`

Each target carries `{ next, lastSpawnMs, nextFreeAt }`. A new numeral is held
until at least `HIT_STAGGER_MS` (80ms) after the previous release *on that
target*, capped at 720ms so a 16-hit Trigger Happy still ends.

The delay is relative to the previous **release**, not to the first hit of the
action, which matters: a presenter that already paces its hits 150ms apart gets
**zero** added delay, while eight hits resolved in one engine tick go out
`0, 80, 160 … 560`. That is what FFX's "quick succession" actually looks like —
each numeral on its own clock, rising and fading independently.

The queue restarts after 800ms of quiet on that target, so the next action
starts back at the chest instead of three rungs up in dead air.

### 2.2 A ladder that fans instead of wrapping — `burstSlot`

`rung = index % LADDER_RUNGS` (3), `column = floor(index / LADDER_RUNGS)`. Hits
climb the ladder first — that is the FFX read, a multi-hit is a column of
figures rising off the target — and once the ladder is full the next hit opens a
**new column** `FAN_STEP` (46 logical px) beside it. Columns alternate
right/left (`fanOffset`) so the group stays centred on the actor rather than
marching off in one direction. 15 slots per target before anything wraps, by
which time slot 0 is long gone.

§3.6's `(+4, -3) * i` diagonal survives as the drift *within* a column.

### 2.3 Rung pitch that pays for the stagger — `STAGGER_RISE`

Failure 3 above. The pitch is now `ladderPitch(kind) + 3 + 11` logical px, where
the `11` is the arc's rise across one stagger. There is a regression test that
asserts the pitch exceeds `|bouncePosition(80ms)| + one glyph height`, so the
constant cannot quietly drift back under the arc.

### 2.4 Per-target lanes — `resolveLanes`

Once per frame the layer projects each target with live numerals, sweeps the
anchors left to right pushing overlaps apart, then **re-centres the group on its
original centroid** so a crowded formation spreads symmetrically instead of
walking toward the HUD. Ties break by id, so the result is stable frame to
frame and nothing jitters.

#### 2.4a The sweep had to be given a budget

The first version of §2.4 shipped without one, and the two captures it shipped
with show what that costs. The sweep is greedy and only ever pushes right, so
it will ask for more width than the screen has and post the answer anyway.
Reproduced against the committed code with the Chapter-5 formation — three
party members, three nodes and Vegnagun, each carrying a fan, in a 1600px
frame:

```
yuna      x= 205  shift= -1204  ->    -999
rikku     x= 400  shift=  -834  ->    -434
paine     x= 570  shift=  -439  ->     131
node-a    x= 700  shift=    -4  ->     696
node-b    x= 760  shift=   501  ->    1261
node-c    x= 820  shift=  1006  ->    1826
vegnagun  x=1420  shift=   971  ->    2391
```

Every anchor outside the frame was then flagged `overHud` (it is further than
`SAFE_SLACK` outside the safe rect) and **clamped flat against the edge** — so
the mechanism that exists to stop numerals piling up was generating a pile of
its own, against x=0. That is the row of figures cut off at the left margin in
`r2-47-boss-attack.png` and `r2-53-ffx2-vegnagun-multihit.png` as first
committed, and the numerals floating in dead air between actors in both.

Three changes, all with regression tests:

- **The demand was unsatisfiable, so it is no longer made.** A target used to
  ask the solver for its glyph plus its fan's *whole* reach; seven such targets
  want 3,900px of a 1,600px frame. It now asks for the glyph plus **at most one
  `FAN_STEP`**. Neighbouring fans may reach over each other — their figures are
  on different rungs and on different clocks, which is what keeps them apart —
  but no two *anchors* may coincide.
- **`LaneOptions.bounds`** squeezes whatever demand is left into the room there
  actually is (one factor across all targets and the gap, so the ordering and
  the relative spacing survive) and refuses to post a lane outside it. A target
  that *started* outside the room is left alone: dragging a buried enemy's
  numerals to the safe-rect edge would detach them from it and hide the one
  case §2.6 exists for.
- **`LaneOptions.maxShift`** is the rule that outranks separation. A numeral
  300px from its actor has stopped being that actor's numeral, so the cap has
  the last word and the layer passes `FAN_STEP * scale`. When it binds, targets
  may still overlap slightly — the stagger and the ladder carry it from there.
  `FAN_STEP` (46) is deliberately below `SAFE_SLACK` (64), so a lane push can
  never on its own make a numeral think its target is buried under the chrome;
  there is a test pinning that inequality.

#### 2.4b One ladder per target, not one per numeral

The same recapture caught a second, smaller version of the original bug. The
rung height came from `ladderPitch(kind)` — *the kind of the numeral climbing
it* — so rung 2 of a MISS sat 17 logical px below rung 2 of a crit. Two
numerals that the queue had deliberately given **different slots** on one actor
could therefore still land on each other, which is the `MISS` struck across an
`11500` on Yuna in `47-boss-attack.png`. A ladder is a property of the target,
so the pitch is now the single `LADDER_PITCH`; it is the value the common case
already used, so nothing about a plain multi-hit moved.

### 2.5 A HUD-free safe rect — `safeAreaFrom` + `placeInSafeArea`

`safeAreaFrom(bounds, panels)` reads the HUD layout the adapters already report
and works out the band each **edge-anchored** slab eats: the FFX CTB column down
the right (`.ig-ctb`), the party-status windows across the bottom
(`.ig-stat-list`), the FFX-2 boss strip along the top (`.ffx2hud__enemies`).

Two rules keep it from eating the field:

- A slab that hugs two edges — the bottom-right party window is both — is
  charged to the **cheaper** edge only. Otherwise a 290px-tall corner window
  would have cost 600px of the right-hand field.
- A band wider than its cap is refused outright and left to the old deflector:
  22% of the width for the left/right edges, 34% of the height for top/bottom.
  That is deliberately wide enough for the CTB column (~13%) and the status
  windows (~32%) and deliberately *too narrow* for the open command stack
  (~23%), which is only up while the menu is up and is better dodged than
  designed around.

`placeInSafeArea` then **mirrors before it clamps**: an offset that would leave
the rect flips to the other side of its target first, which preserves the
spacing the fan exists to provide. Clamping is the last resort, and it is what
used to collapse numerals onto one coordinate.

Panels that float *inside* the safe rect (the command stack over the field, the
sensor card) are still handled the old way by `deflectFromRects`, unchanged.

### 2.6 Over the HUD only when unavoidable

A target standing more than `SAFE_SLACK` (64 logical px) outside the safe rect
cannot have its numeral pulled back in and still read as *its* numeral — an
enemy wholly behind the CTB column, for instance. Only then does the numeral
keep its natural position and gain `.dnum--over-hud`, which lifts it above its
neighbours and swaps in a heavier scrim so the figure reads against HUD ink.
Everything else stays in the HUD-free rect and never needs it.

**One honest caveat.** Both HUDs mount the numeral layer in an *unscaled overlay
that is a later sibling of the stage* (`.ffxhud__overlay`,
`.ffx2hud__overlay`), so in paint order numerals have always been above the
chrome and `.dnum--over-hud` cannot lower anything below it — those two files
belong to the HUD owners, not to this task. What `.dnum--over-hud` marks is the
only case where a numeral is *allowed* to sit on the chrome at all; the safe
rect is what keeps every other numeral off it. If the HUD owners ever give the
overlay a z-index below the stage, `.dnum--over-hud`'s `z-index: 3` is the hook
that puts these back on top and nothing else needs to change.

### 2.7 The CHAIN chip rides its numeral (FFX-2)

`DamageNumbers.attachChip(target, chip)` pairs an arbitrary element with a live
numeral on a target, and `update` writes that element's `left`/`top` from the
figure's live box every frame, so it travels with the hit it belongs to instead
of sitting at a fixed offset from the enemy.

**It does not parent the chip into the numeral, and that is the whole point.**
The first implementation did, and the chip drew *nothing* while every DOM
assertion about it passed — `chip.closest('.dnum')` was truthy, the chip's text
was in the numeral's `textContent`, the capture harness reported it riding on
every frame it existed. `.dnum` paints its figure with
`-webkit-background-clip: text`, and that property clips **the element's entire
subtree**, not just its own glyph, to the shape of that glyph. A chip pinned
past the numeral's edge is outside the letterforms and is therefore clipped away
completely. No reset on the child can undo a clip the parent applies. It took a
screenshot to catch: the DOM says yes and the frame is empty.

Following from outside has a second benefit worth keeping even if the clip ever
goes away: `.ffx2-chain-chip`'s own stylesheet is the FFX-2 HUD's, not this
task's, and a chip that is never re-parented is a chip whose author's CSS
applies exactly as written.

#### 2.7a Where the chip sits, after the capture showed it colliding

The first working capture put `CHAIN x1.30` half behind a `674` — the chip was
aimed at the ridden figure's **top**-right corner, and a multi-hit ladder climbs
up and drifts right, so the chip was aimed squarely at where the next rung goes.

Moving it to the *bottom*-right corner is the obvious correction and is also
wrong; the unit test for it caught that before any capture did. `attachChip`
rides the newest **visible** figure, and during a stagger that is routinely a
rung with older, lower rungs still live beneath it. **No cell adjacent to one
figure is guaranteed empty.**

So the chip's two coordinates now come from different places:

- **x** from the ridden figure, so it drifts with that figure's own column;
- **y** from the bottom of the **whole burst** on that target, so it sits under
  every live rung and can collide with none of them.

The burst rises as a group, so the chip still rises with the hit it belongs to —
which is the whole point of §2.7 — while never landing on a numeral. The
regression test reconstructs the box the chip actually *paints* (it centres
itself with `translate(-50%, -50%)`, so the anchor point alone proves nothing)
and asserts it against every live rung.

That fix then traded one collision for another, which the next capture caught:
pushing the chip clear of the burst moves it right and down, and on Bahamut it
landed across the command stack's `WHITE MAGIC` row. **A chip is a
numeral-sized thing sitting on the field, so it now dodges the same chrome the
numerals dodge** — `placeChip` runs the result through `deflectFromRects`
against the floating panels, bounded by §2.5's safe rect, using the placement
context cached by that frame's `update` rather than re-reading layout. It
clamps rather than mirrors: a chip belongs beside its own burst, and flipping it
to the far side of the enemy would read as a different enemy's chain.

Three collisions, three captures, and **each one was invisible to the test suite
until the frame existed** — the numerals were never involved, so nothing in the
layout tests had any reason to fail. Each is now pinned by a unit test.

`attachChip` prefers the newest **visible** numeral on the target over the newest
one outright — the newest is very often one the queue is still holding back by a
stagger (§2.1), and a chip parked on an invisible figure reads as a chip that
jumped. Only the position is written; the chip's fade and its 1,400ms hold timer
stay `FFX2BattleHud.showChain`'s, and the pairing is dropped when the figure
dies, leaving the chip where it was for that timer to remove.

`FFX2BattleHud.showChain` builds `.ffx2-chain-chip` as a sibling of the layer
and re-writes its `left`/`top` on every chain tick, and that file is not mine
this round — so `DamageLayer.update` **adopts** the chip each frame instead,
keying it to the target of the most recent damage event (a `chain` event always
follows the hit that extended the chain, on that same target). `attachChain()`
is there as the direct route if the HUD owner would rather route `chain` events
to this layer; the adoption path can then be deleted.

When there is no live numeral on that target — a chain tick with no damage, e.g.
the HUD mock's `C` key — nothing is touched and the chip floats where the HUD
put it, so `07-ffx2-chain-popup.png` and `10-inkgold-ffx2-chain.png` are
unchanged.

### 2.8 The fan opens asymmetrically near a margin — `fanSequence`

This was on §5's "not done" list for most of the round and is **done**, so it is
written up here rather than left as a promise.

`fanOffset` opens symmetrically and lets §2.5 reflect whatever leaves the rect.
That is right in open field and wrong near a margin: reflection is one-to-one,
so column +2 folds back to within a few px of column -1 and an actor 200px from
the left edge ends up with its outer columns **bunched** — the stress frame in
`r2-53-ffx2-chain-chip.png`.

`fanSequence(room)` decides the columns *before* the fact instead. It opens only
into the room that exists, keeps alternating while both sides have room so the
group stays centred on its actor, and marches into the open side once the near
one is full. The offsets it returns are always distinct, `FAN_STEP` apart, and
all inside the room — which is exactly what reflection could not promise. A
target with room for nothing but column 0 gets `[0]`, and its ladder and its
stagger carry the separation from there; that is honest degradation, not a
pile-up. With ample room (or no room reported) it returns the symmetric fan
unchanged, so nothing about the open-field case moved.

### 2.9 A heal and a hit on one actor ride different tracks — `familyFor`

Also formerly a §5 item, also **done**. §2.4b put every numeral on one ladder,
which fixed the height mismatch but left one crossing: a damage figure is
ballistic and falls back through its rung, a heal floats straight up, so over
~600ms a damage figure two rungs up meets a heal figure one rung up. Two motions
through one column cross no matter how the ladder is spaced.

So a burst now has two tracks. `familyFor` splits **healing alone** — every other
kind flies the same arc, so the ladder already keeps those apart — and when a
second family lands on a target inside one burst it takes `'alt'`, which reads
the same fan from the far end and therefore occupies disjoint columns. A heal on
an actor nothing else is touching still floats straight up the middle of them:
the alt track only exists when there is a first family to avoid.

### 2.10 The strategy guide's rail is chrome too

Found by the recapture of §3's Overdrive shot, not by a test: the guide rail the
player toggles with `G` is open by default, and a party member standing on the
left of the field printed its numeral **straight across the guide's RULES row**
(Yuna's `761` in `r2-overdrive-multihit.png` as first recaptured). The panel
list each adapter reports simply did not mention it, so to the layer that
quarter of the screen was open field.

Both adapters now list it, and **by its two solid children** —
`.sgd__panel` and `.sgd__toggle` — rather than by `.sgd`. That wrapper is
`inset: 0` `pointer-events: none` across the whole stage; listing it would tell
the layer that the entire field is chrome and there is nowhere left to put a
numeral at all.

It is dodged as a **floating slab** (§2.5's `deflectFromRects`) rather than
carved out of the safe rect, and that falls out of §2.5's own cap rather than
being a judgement call: the panel is ~24% of the grid's width, over the 22%
edge cap, so `safeAreaFrom` refuses the band and leaves it to the deflector.
That is also the right treatment on the merits — a panel the player can toggle
off should not permanently shrink the field the numerals live in, which is
exactly the argument §2.5 makes for the command stack.

The rail is on the left in both games (`.sgd--ffx2` only flips which edge takes
the accent border), so this is the same slab in the same place for FFX and
FFX-2, and both adapters got the same two selectors. Three jsdom tests pin it:
"is dodged by an FFX numeral landing on a party member standing under it", "is
dodged by an FFX-2 numeral too", and — the one guarding the `.sgd` trap above —
"does not let the rail wrapper blank the whole field".

---

## 3. Verification

### Type-check and tests

| | Result |
|---|---|
| `npx tsc --noEmit` | clean, whole repo |
| `tests/unit/ui-common-damage-ladder.test.ts` | 92 passed (63 new; the file had 29 before this round) |
| `tests/unit/ui-damage-numbers-layout.test.ts` | 22 passed (new file) |
| `tests/unit/ui-ffx-hud.test.ts` | 35 passed |
| `npx vitest run` | see §5 |

Two new test files' worth of coverage:

- **`ui-common-damage-ladder.test.ts`** — 63 new cases over `fanOffset`,
  `burstSlot`, `nextBurstSlot`, `resolveLanes`, `safeAreaFrom`,
  `placeInSafeArea`, `fanSequence` and `familyFor`, including the four screenshot failures as named
  regressions and the `STAGGER_RISE` guard from §2.3. The last seven are §2.4a
  and §2.4b: the unbounded sweep's own ±1,000px output pinned as the
  regression it is, every anchor inside the room it was given, nothing dragged
  further than `maxShift` from its actor, a three-target AoE that fits not
  being squeezed anyway, a genuinely buried target left alone, `FAN_STEP <
  SAFE_SLACK`, ten targets in a 400px strip degrading to overlap rather than to
  dead air, and rung N landing at one height for all seven numeral kinds.
- **`ui-damage-numbers-layout.test.ts`** also gained the §2.7 chip rewrite: the
  chip is never parented into a numeral, it is repositioned onto the figure's
  corner, it is taken back when the HUD re-pins it mid-flight, and the pairing
  is released when the figure dies.
- **`ui-damage-numbers-layout.test.ts`** — the DOM class driven through a real
  frame loop: an 8-hit Attack Reels swept frame by frame across its whole 900ms
  asserting **no pair of visible figures is ever within (36px, 16px)** of each
  other; a three-target AoE on anchors 6px apart coming out ≥36px apart and
  still centred on the formation; a 6-hit multi-hit held inside the safe rect
  for its entire life; the over-HUD lift firing for a buried target and not for
  a clear one; the chip riding; and §2.9's heal — one hit then a heal on the
  same actor, swept frame by frame, never closing to (36px, 20px), with the
  pre-fix measurement (dx 4, dy 17.2 at 120ms) recorded in the test so the
  regression stays legible from the assertion alone.

**One existing test was edited**, in `tests/unit/ui-ffx-hud.test.ts`: "steps two
hits on the same target clear of each other" ticked a single frame, and the
second event on a target is now held back by one stagger, so it had not been
placed yet. It now runs six frames. The assertion itself is unchanged.

### Captures

All against the real app on a dev server at :5242, at 1600x900. Harnesses live
in `build/r2-capture/` (gitignored).

**Two kinds of capture, because they answer different questions.**
`capture-and-measure.mjs` plays a chapter with the intended tactics and keeps
the frame with the most numerals alive, which is honest about what the game
actually produces but samples whatever frames a loaded box gives it.
`capture-overdrive.mjs` enters a real battle, leaves it at the command menu,
and pushes one exact event burst through the **live HUD's** `onEvent` — real
projector, real panel rects, real scale — so the 12-hit Overdrive and the
whole-party AoE land on a known frame instead of being waited for.

| Shot | What it shows |
|---|---|
| `docs/screenshots/r2/r2-overdrive-multihit.png` | **the multi-hit Overdrive.** 12 hits on Mortiorchis in one engine tick; 10 figures in flight at once, fanned into three columns climbing off it, the last hit's crit `1007` in gold. Measured on that frame: **0 overlapping pairs, 0 clipped, 0 pinned to an edge, 0 over-HUD.** Clear of the open command stack and the guide rail on the left and the CTB column on the right |
| `docs/screenshots/r2/r2-boss-aoe.png` | **the boss AoE.** Yunalesca's whole-party hit: `1588 / 2020 / 1808` side by side, each over its own party member, **0 overlapping pairs, 0 clipped, 0 pinned, 0 over-HUD**. This is `50-yunalesca.png`'s `2200` buried under `1850`, directly |
| `docs/screenshots/r2/r2-47-boss-attack.png` | Chapter 1 played through: across 649 sampled frames, **0 numerals clipped, 0 pinned flat against an edge, 0 over-HUD**, 12 overlapping pairs (worst: two consecutive rungs of one target's own ladder grazing) |
| `docs/screenshots/r2/r2-52-ffx2-bahamut.png` | Chapter 4 played through: 16 figures live at the peak, same three zeros |
| `docs/screenshots/r2/r2-ffx2-chain-chip.png` | **the `CHAIN x1.30` chip riding its numeral**, beside a 6-hit burst on Bahamut fanned into two columns (`674 / 637 / 600` climbing, `711` in the second column). The chip is legible, clear of all four rungs and clear of the chrome. Harness line for the frame: `chip "CHAIN ×1.30" at [723,404,247,83] riding numeral "711" with 4 numerals live`, with the chip confirmed still in the DOM *after* the shot. See §3.1 and §2.7a — it took five captures |

The first two captures are the ones to look at; the last two are the regression
check on the §2.4a fix, and both were recaptured for it. Compare
`r2-47-boss-attack.png` against `docs/screenshots/47-boss-attack.png`, where
`604 / 571 / 578` printed across the CTB column.

**Both of the first two were recaptured again after §2.10**, on the settled tree
at the close of the round, and both measure four zeros — `clipped 0, flush 0,
overlapping pairs 0, overHud 0`. The Overdrive frame is the one that found the
guide-rail bug in the first place, so it is also the frame that shows it gone:
the numeral that used to print on the `RULES` row is not there in the current
PNG. The whole-party AoE is the stronger evidence for §2.10 in principle — its
three figures land on a party that stands directly beside the rail — and they
come out at x `559 / 728 / 853`, all clear of the panel's right edge (~383).

### 3.1 The chain chip took three attempts, and the first two lied

The chip capture is worth writing down, because both failures reported success
of a kind and neither had anything to do with the code under test.

**Attempt 1 — a structural assertion.** The probe asked
`chip.closest('.dnum')`. That is the one thing §2.7 says the chip must *not*
be, so it reported "not riding" for the fix and would have reported "riding"
for the bug — the metric was inverted against the thing it was measuring. Both
harnesses now measure riding **geometrically**: the chip's centre has to land
within a chip-height of a *visible* numeral's box.

**Attempt 2 — two clocks.** With the metric fixed the probe reported no chip at
all, which went into §5 as "a synthetic `chain` event does not reach
`showChain`". `build/r2-capture/diag-chain.mjs` settles it:

```
[diag] chain via onEvent: { "threw": null,
  "afterImmediate": { "text": "CHAIN ×1.20", "left": "989.976px", "parent": "ffx2hud__overlay" } }
[diag] chip disappears at: {"frame":0,"wallMs":1742,"chip":false,"numerals":1}
[diag] 40 hand-stepped frames cost 279439ms of wall clock
```

The chip is built exactly as expected and is then **removed before the capture
can step a single frame**. `showChain` hides it with
`window.setTimeout(..., CHAIN_HOLD_MS)` — 1,400 ms of wall clock — while
numerals are advanced by `dt` from `HudPort.update` and freeze with the stepped
loop. One hand-stepped frame costs 1.7-7 s here under SwiftShader, so the chip
loses that race every time. Numerals survived and the chip did not, which is
precisely why it looked like a chip-specific defect.

There is a third variant of the same bug: even once a frame *did* show a riding
chip, `page.screenshot()` itself takes seconds, and a re-armed hide timer
removed the chip between the measurement and the photograph. That is
`r2-ffx2-chain-chip.png` as first written — a PNG with no chip in it, produced
by a run whose log said the chip was riding.

**The fix is one line of harness**, not of engine: cancel `chainHideTimer`, so
the chip sits on the same frozen clock as the numerals around it. Nothing about
where the chip is drawn or how it is adopted changes; only when it is removed.
The capture now re-pins before the shot and re-checks the chip is still in the
DOM afterwards, so a chipless PNG cannot be reported as a success again.

`capture-and-measure.mjs` reports four numbers per run — clipped, pinned to an
edge, overlapping pairs, over-HUD — so this is re-checkable rather than a
matter of squinting at a PNG. Note that on a loaded box the frame pump samples
a fraction of the frames (each `__pyrefly.frame()` is a round trip while the
battle runs on wall clock), so the *counts* undercount; the zeros are still
zeros across everything it saw.

---

## 4. Files

| File | Change |
|---|---|
| `src/ui/common/damageLadder.ts` | +`LADDER_RUNGS`, `FAN_STEP`, `FAN_COLUMNS`, `HIT_STAGGER_MS`, `fanOffset`, `burstSlot`, `nextBurstSlot`, `resolveLanes`, `safeAreaFrom`, `placeInSafeArea`. Then §2.4a: `resolveLanes` takes a `LaneOptions` third argument (`bounds`, `maxShift`) and squeezes an over-demand before the sweep instead of amplifying it. And §2.4b: `burstSlot` steps by one `LADDER_PITCH` for every kind. Then §2.8/§2.9: `FanRoom`, `fanSequence`, `NumeralFamily`, `familyFor`, `BurstTrack` and a `BurstSlotOptions` third argument to `burstSlot` (`fan`, `track`). Nothing existing was removed — `computeHitOffset`, `ladderPitch` and `deflectFromRects` all still work and are still used/tested. |
| `src/ui/common/DamageNumbers.ts` | spawn takes a queue slot instead of a wrapping rung; `update` does one projection pass (lanes + width re-measure, no layout thrash) then one placement pass through the safe rect; `attachChip`; `clear()` forgets queues; the ±6px x-jitter is gone from the offset (the fan and the lanes own horizontal separation now) and survives only as the ballistic drift. §2.4a: a target now asks the lane solver for its glyph plus at most one `FAN_STEP` rather than its fan's whole reach, and the solver is handed the safe rect's width and a `FAN_STEP * scale` cap. §2.7a: `placeChip` takes its x from the ridden figure and its y from the bottom of the whole burst, then deflects the chip off the floating HUD panels inside §2.5's safe rect, using a placement context (`chipArea`) cached by that frame's `update` so no layout is re-read. §2.8/§2.9: each target's room either side is measured against the safe rect at projection time and handed to `fanSequence`, and a numeral remembers its `track` so re-placement on later frames reproduces the same column. |
| `src/ui/common/damage-numbers.css` | `.dnum--over-hud` (lift + heavier scrim); `.dnum__chip` is now just the marker on a followed element, and the note at the top of the file records why `.dnum` stays a single element and why nothing may be parented into it. |
| `src/ui/ffx2/DamageLayer.ts` | remembers the last damage target; adopts and re-pins `.ffx2-chain-chip` each frame; `attachChain()`. §2.10: the same `.sgd__panel` / `.sgd__toggle` selectors as the FFX adapter. |
| `src/ui/ffx/DamageNumbers.ts` | it already reported the panel rects the safe area needs; §2.10 added `.sgd__panel` and `.sgd__toggle` to `PANEL_SELECTORS`, with the note on why not `.sgd`. |
| `tests/unit/ui-common-damage-ladder.test.ts` | +63 cases (29 -> 92). |
| `tests/unit/ui-damage-numbers-layout.test.ts` | new, 22 cases, jsdom (the last 3 are §2.10's). |
| `tests/unit/ui-ffx-hud.test.ts` | one test ticks six frames instead of one (see above). |

Capture harnesses (in `build/r2-capture/`, gitignored, not shipped):

| Harness | Change |
|---|---|
| `diag-chain.mjs` | new. Answers §3.1's question instead of restating it: walks what `battle().hud` actually is, checks whether `onEvent({type:'chain'})` reaches `showChain`, and times the chip's life against the stepped frame loop. |
| `capture-chain-chip.mjs` | `--mode=synthetic` (deterministic burst through the live HUD, a handful of frames) alongside the original `--mode=play`; cancels `chainHideTimer` so the chip outlives the screenshot; re-checks the chip is still in the DOM *after* the shot, so a chipless PNG cannot be logged as a success. |
| `capture-overdrive.mjs` | the `chip.riding` probe is geometric rather than `closest('.dnum')`, and the stale "a synthetic chain event does not reach showChain" note is replaced by what actually happens. |

`damageLadder.ts` is now ~950 lines, over DEV.md's 400-line house rule. It is
pure functions with the reasoning written down next to each one, and splitting
the motion math from the layout math would put `burstSlot` (which needs
`ladderPitch`) in a different file from the pitch it reads. Flagging it rather
than hiding it; the obvious split if someone wants it is `damageLayout.ts`
taking §2.4 and §2.5.

### Full suite

`npx vitest run`, re-run on the settled tree at the close of the round:
**80 files, 2,715 passed, 0 failed**, 114.6 s.

Mid-round the same command reported 14 failures in 7 files — three audio files
and four intended-tactics strategy files, none of them owned by this task — plus
17 `Failed to start forks worker` errors from several agents' Chromium and
vitest instances contending for the box. Those files pass in the final run; the
audio and balance owners landed their own fixes. Recorded here because the
mid-round number appeared in an earlier revision of this section and someone
comparing the two should know which is the live one: **the clean run is.**

Targeted re-run of the three numeral files on the same tree: 149 passed
(92 + 22 + 35), 0 failed. `npx tsc --noEmit` clean across the repo.

## 5. Not done / for whoever picks this up

- **The sprite half of issue 3 is untouched.** Mortiorchis being ~70% hidden
  behind the CTB list is a stage-anchor or HUD-placement problem, not a numeral
  one, and belongs to whoever owns the stage.
- **`FFX2BattleHud.showChain` still owns the chain chip.** The adoption in
  `DamageLayer.update` works, but routing `chain` to `DamageLayer.attachChain`
  would be one line in that file and would let the adoption code go.

  An earlier revision of this section claimed that pushing a synthetic `chain`
  event into `FFX2BattleHud.onEvent` "does not produce a chip, so `showChain`
  wants something the event alone does not carry". **That was wrong, and it was
  wrong because the instrument was wrong** — see §3.1. `onEvent` reaches
  `showChain` and builds the chip synchronously; there is nothing special about
  a real `chain` event. Left here rather than quietly deleted because the
  mistake is the reusable part: a wall-clock timer and a hand-stepped frame loop
  measure different things, and the `speed: 'skip'` defect in issue 1 of
  `playability-round-1.md` is the same two clocks in a different place.
- ~~A target near a frame edge with a deep fan bunches~~ and ~~a heal and a
  damage numeral on one actor can cross~~ were both on this list and are both
  **fixed** — see §2.8 (`fanSequence`) and §2.9 (`familyFor`). The stress frame
  `r2-53-ffx2-chain-chip.png` predates the first of those and still shows the
  bunching it describes; it is kept as the before-picture, not as current
  behaviour.
- **The chip is placed, but it is still the HUD's element.** `placeChip` writes
  only `left`/`top`. Its size, skew, fade and 1,400 ms hold are
  `FFX2BattleHud.showChain`'s, and that hold is **wall-clock** while everything
  else in the numeral layer runs on `dt` — which is what made it uncapturable
  (§3.1) and is worth fixing at the source if the HUD owner ever revisits it.
  The chip's measured box is also ~247x83 because of its skew transform, which
  is wider than it looks; the deflection is conservative for that reason.

- **Other agents' files had type errors while this ran**, so if `npx tsc
  --noEmit` is dirty it may not be this task's. Seen mid-flight and reported,
  not touched: `src/engine/BattleCamera.ts` (unused `fx`, `rollRad`) and
  `src/engine/PaintedActor.ts` (several unused symbols plus a transient
  `Property 'enterLife' does not exist`, which was a partial save — the method
  is there). Nothing in `src/ui/common/**`, `src/ui/ffx/DamageNumbers.ts` or
  `src/ui/ffx2/DamageLayer.ts` errors.

- **`src/ui/ffx/SensorPanel.ts:109` does not type-check** as of the first pass —
  `ElementId` indexing a `Record` without a `none` key. That was another
  agent's file mid-flight; it is **fixed now** and `npx tsc --noEmit` is clean
  across the repo.
