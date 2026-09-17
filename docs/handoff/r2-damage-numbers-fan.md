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

`DamageNumbers.attachChip(target, chip)` parents an arbitrary element to the
newest live numeral on a target, pinned to its top-right corner, so it inherits
the figure's motion, pop and fade. Two CSS resets matter and are in
`damage-numbers.css`: `.dnum` paints its glyph by clipping a gradient to text,
and both `-webkit-text-fill-color: transparent` and the italic inherit into any
child.

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

---

## 3. Verification

### Type-check and tests

| | Result |
|---|---|
| `npx tsc --noEmit` | clean for every file in this task |
| `tests/unit/ui-common-damage-ladder.test.ts` | 64 passed (was 26) |
| `tests/unit/ui-damage-numbers-layout.test.ts` | 13 passed (new file) |
| `npx vitest run` | see §5 |

Two new test files' worth of coverage:

- **`ui-common-damage-ladder.test.ts`** — 38 new cases over `fanOffset`,
  `burstSlot`, `nextBurstSlot`, `resolveLanes`, `safeAreaFrom` and
  `placeInSafeArea`, including the four screenshot failures as named
  regressions and the `STAGGER_RISE` guard from §2.3.
- **`ui-damage-numbers-layout.test.ts`** — the DOM class driven through a real
  frame loop: an 8-hit Attack Reels swept frame by frame across its whole 900ms
  asserting **no pair of visible figures is ever within (36px, 16px)** of each
  other; a three-target AoE on anchors 6px apart coming out ≥36px apart and
  still centred on the formation; a 6-hit multi-hit held inside the safe rect
  for its entire life; the over-HUD lift firing for a buried target and not for
  a clear one; and the chip riding.

**One existing test was edited**, in `tests/unit/ui-ffx-hud.test.ts`: "steps two
hits on the same target clear of each other" ticked a single frame, and the
second event on a target is now held back by one stagger, so it had not been
placed yet. It now runs six frames. The assertion itself is unchanged.

### Captures

Chapters played through the real app with the intended tactics (dev server on
:5242, harness at `build/r2-capture/capture-numerals.mjs`, gitignored), grabbing
the frame with the most numerals alive at once.

| Shot | What it shows |
|---|---|
| `docs/screenshots/r2/r2-47-boss-attack.png` | Chapter 1 at its worst frame — **30 numerals in flight at once**, fanned into legible columns on Seymour and Mortiorchis, every one of them clear of the CTB column and the party-status windows |
| `docs/screenshots/r2/r2-53-ffx2-vegnagun-multihit.png` | the Chapter 5 multi-hit that produced the original eight-figure blob |
| `docs/screenshots/r2/r2-52-ffx2-bahamut-chain.png` | FFX-2 chain: the `CHAIN ×N` chip riding its figure |

Compare `r2-47-boss-attack.png` against `docs/screenshots/47-boss-attack.png`:
`604 / 571 / 578` used to print across the CTB column; the same fight now keeps
thirty figures off it.

---

## 4. Files

| File | Change |
|---|---|
| `src/ui/common/damageLadder.ts` | +`LADDER_RUNGS`, `FAN_STEP`, `FAN_COLUMNS`, `HIT_STAGGER_MS`, `fanOffset`, `burstSlot`, `nextBurstSlot`, `resolveLanes`, `safeAreaFrom`, `placeInSafeArea`. Nothing existing was removed — `computeHitOffset`, `ladderPitch` and `deflectFromRects` all still work and are still used/tested. |
| `src/ui/common/DamageNumbers.ts` | spawn takes a queue slot instead of a wrapping rung; `update` does one projection pass (lanes + width re-measure, no layout thrash) then one placement pass through the safe rect; `attachChip`; `clear()` forgets queues; the ±6px x-jitter is gone from the offset (the fan and the lanes own horizontal separation now) and survives only as the ballistic drift. |
| `src/ui/common/damage-numbers.css` | `.dnum--over-hud` (lift + heavier scrim), `.dnum__chip` (the two inheritance resets). |
| `src/ui/ffx2/DamageLayer.ts` | remembers the last damage target; adopts and re-pins `.ffx2-chain-chip` each frame; `attachChain()`. |
| `src/ui/ffx/DamageNumbers.ts` | **unchanged** — it already reported the panel rects the safe area needs. |
| `tests/unit/ui-common-damage-ladder.test.ts` | +38 cases. |
| `tests/unit/ui-damage-numbers-layout.test.ts` | new, 13 cases, jsdom. |
| `tests/unit/ui-ffx-hud.test.ts` | one test ticks six frames instead of one (see above). |

`damageLadder.ts` is now 686 lines, over DEV.md's 400-line house rule. It is
pure functions with the reasoning written down next to each one, and splitting
the motion math from the layout math would put `burstSlot` (which needs
`ladderPitch`) in a different file from the pitch it reads. Flagging it rather
than hiding it; the obvious split if someone wants it is `damageLayout.ts`
taking §2.4 and §2.5.

## 5. Not done / for whoever picks this up

- **The sprite half of issue 3 is untouched.** Mortiorchis being ~70% hidden
  behind the CTB list is a stage-anchor or HUD-placement problem, not a numeral
  one, and belongs to whoever owns the stage.
- **`FFX2BattleHud.showChain` still owns the chain chip.** The adoption in
  `DamageLayer.update` works, but routing `chain` to `DamageLayer.attachChain`
  would be one line in that file and would let the adoption code go.
- **`src/ui/ffx/SensorPanel.ts:109` does not type-check** as of this writing —
  `ElementId` indexing a `Record` without a `none` key. That is another agent's
  file mid-flight in this round, not a regression from here.
