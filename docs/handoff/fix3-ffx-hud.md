# fix3 — FFX battle HUD cleanup

Track `ffx-hud` of the fix-3 round. Bailey played the live build (main `88e5b64`)
and reported, from one Chapter 1 capture:

1. a **stale "Ronso Rage · CHOOSE A RAGE" title banner** still on screen during
   Tidus's turn, over the `G GUIDE` chip and the Mortiorchis name/HP header;
2. the **NEXT BEST MOVE card and its `N HIDE MOVES` chip on top of the party
   sprites**, and the **`E ENEMY MOVE` chip over the boss's painting**;
3. **CTB names truncating** — "Seymour F…";
4. carried over from round 2: telegraph/sensor collisions, guide chip collisions
   and edge clipping, damage numerals overlapping and clipping, fighters drawn
   over the party status window.

Everything below is measured on the **640x360 authoring grid** both FFX HUD
stages are letterboxed from, because that is the frame the CSS is written in and
the one the numbers stay constant in across viewports.

---

## 1. No title slab outlives its decision

**What it actually was.** `OverdriveOverlay` is only ever taken off the stage by
its own `close()`, and `close()` is only reached from a picker's `finish()`.
The three **untimed** pickers — Ronso Rage, Grand Summon, Mix — all opened with

```ts
if (settled || !rages.length) return;   // KimahriRage, before
```

so with an **empty list** (Kimahri has Lancet-ed no Rage yet, Yuna has no aeon,
Rikku's pouch is empty) every button was swallowed, the promise never settled,
and the ivory title slab stayed on the field for the rest of the fight. That is
the blank "Ronso Rage" slab in Bailey's capture, printed across the `G GUIDE`
chip and the Sensor card. The second, quieter half was `.ig-banner`:
`setMessage` showed it and nothing ever hid it again, so the last line of one
actor's turn labelled the next actor's.

**Fixed at both ends.**

- *At source.* The three pickers now back out on `cancel`, and accept `confirm`
  as a way out when there is nothing to pick, by rejecting with
  `MinigameCancelled` (`src/ui/ffx/minigames/params.ts`). `askMinigame`
  (`engine/BattlePresenterUtil.ts`) has always caught a thrown overlay and
  re-submitted the command bare, so **no engine, command or battle-math path is
  new** — the rejection simply takes the branch that already existed. The empty
  list now also says why it is empty, and the head's instruction line says how
  to leave. Each picker claims Esc through `setMenuOwnsCancel`
  (`ui/common/menuCancel.ts`) while it is up, so backing out of a picker does
  not *also* open the pause menu — it did, and it is what polluted the first
  verification run.
- *At the HUD.* `FFXBattleHud.clearTransientOverlays()` sweeps any `.ig-minigame`
  off the stage and hides `.ig-banner` at the four moments a decision ends: a new
  `chooseCommand` (submit, and the actor change with it), a `turn-start` for a
  **different** actor, a `sync` whose state carries a `result`, and `unmount`.
  `openMinigame` brackets its dispatch with the same sweep. Every picker awaits
  `overlay.close()` *before* it settles, so the sweep is a no-op on the happy
  path; it exists for the overlay that threw or was abandoned.

**Tested** in `tests/unit/ui-ffx-hud-safe-zones.test.ts` — a leaked slab is gone
by the next `chooseCommand`, gone when the turn passes to another actor, **not**
gone while the same actor is still deciding, gone once the battle has a result;
the banner goes with it; and an empty Ronso Rage picker rejects and removes
itself on both Esc and Enter while a non-empty one still resolves normally.

---

## 2. HUD safe zones

### Why a fixed zone could not work

The party stands somewhere different in every encounter. Measured live through
the debug API at 1600x900, in grid px:

| chapter | party sprites (union) | boss |
|---|---|---|
| 1 Seymour Flux | x 65..285, y 153..314 | 340..491, 23..238 |
| 2 Yunalesca | x 205..373, y 185..340 | 348..480, 69..258 |
| 3 Braska's Final Aeon | x 68..284, y 185..339 | 310..501, 67..256 |

The always-on chrome, identical in all three:

| panel | rect |
|---|---|
| command area `.ffx-cmd-area` | 30.2..210.7, 204.5..334.2 |
| party status `.ig-stat-list` | 402.7..616.9, 258.3..348 |
| CTB queue `.ig-ctb` | 547.6..620.5, 49.8..200.4 |
| strategy guide `.sgd__panel` | 21.3..153.3, 44..200 |
| Sensor card `.ffx-sensor` | 191.7..308.3, 24..102 |

The advisor card shipped in the band between the command area and the party
status column — x 211..403 — and the party's union is x 65..373. **No fixed
sub-rectangle of that band is free in all three chapters**, which is why the
card was printed across Tidus and Kimahri. Chapter 2 is the awkward one: its
party reaches x 373 against a rail at 403, so the pocket is 30px wide.

### The two zones

`src/ui/ffx/hudSafeZones.ts` is pure arithmetic on the grid and picks the first
that fits:

1. **the pocket** — bottom-anchored, between the rightmost party sprite and the
   party-status rail. ~99px wide in chapters 1 and 3 once the gap is paid.
2. **the shelf** — above the party's heads, between the guide's rail and the
   boss column, dropped below the Sensor card when that is up. ~183px wide in
   chapter 2.

`FFXBattleHud.placeAdvisor()` applies the winner **after** `MoveAdvisor.update`,
so the inline geometry the advisor writes for itself is the one that gets
overruled. Sprite rects come from the projector's head and feet points with the
width reconstructed at `SPRITE_HALF_WIDTH_RATIO = 0.45` of the height — a
deliberate over-estimate (the nine measured sprites run 0.33..0.41 of height per
half), so the reconstructed rect always contains the real one and the "no panel
on a fighter" assertion cannot pass by luck.

`MIN_ADVISOR_WIDTH` is **96** here against `MoveAdvisor.MIN_CARD_WIDTH`'s 132,
because FFX's pocket measures 99..101 and holding out for 132 would send every
chapter to the shelf and put the card over the boss instead. See the request
below.

### The other two panels

- **`E ENEMY MOVE`** parks on the CTB queue's top-right corner while the panel
  is off, through a new opt-in `EnemyIntentMountOptions.chipDock`. With the
  panel up the slab still hangs over the boss's head, which is the relationship
  it is claiming; with the panel off there is no slab and the chip had simply
  inherited the same anchor, which is how it ended up in the middle of the
  painting. FFX-2 passes no `chipDock` and is unchanged.
- **`G GUIDE`** rides 11 grid px *above* the guide rail's top edge, and the rail
  anchors below the action banner (`.ig-banner`, y 17.8..48) — so the rail
  cleared the banner and the chip landed on it. `StrategyGuide.layout` now
  reserves `CHIP_RISE` under the `below` anchor.
- The enemy-intent slab's edge clamp was a flat **4 viewport px**, which is 1.6
  grid px at 1600x900 and 1.1 at 2560x1440: a slab pushed against the top of the
  frame sat flush on the edge and read as clipped. It is `EDGE_MARGIN * scale`
  now, 4 grid px at every viewport.

---

## 3. CTB names that fit

`.ffxhud .ig-ctb__name` kept `max-width: 48px` — that cap is what makes the HUD
safe area's right rail the **constant 0.843** every FFX scene solves against, and
raising it would drag the rail to 0.866 and cost every scene ~5% of its usable
width. What changed is what the cap does when a name is too long for it: it used
to ellipsise, and at this font size that caught "Seymour Flux", not just
"Braska's Final Aeon".

The plate now wraps (up to three lines) and `CtbList.fitNames()` steps the font
down `NAME_SIZES` only if three lines at the full 5.6px still overflow. Every
name in the five chapters fits at full size — "Seymour Flux" and "Yunalesca" on
one or two lines, "Braska's Final Aeon" on three — so **no name in the game is
abbreviated any more and the rail has not moved**. A three-line plate is 22px
against the 20.44px tile, so the column grows about 2px in the worst case. The
fit is measured once per name and cached, because the queue re-renders several
times a second while the cursor moves.

---

## 4. The round-2 carry-overs

| carry-over | what was done |
|---|---|
| telegraph banner colliding with the sensor card | the banner is centred at x 290..349 and the sensor ends at 308; the measured matrix now asserts the pair every frame it captures. No geometry change was needed once the overlay sweep stopped a third slab landing in the same band. |
| guide chip/panel collisions and edge clipping | `CHIP_RISE` reserved under the banner (above); intent slab's edge clamp made grid-relative (above). |
| damage numerals overlapping and clipping at the edge | the advisor card, its chip and the intent slab and chip joined `PANEL_SELECTORS` in `ffx/DamageNumbers.ts` — they are opaque, they both ship **on**, and between them they were the last two panels a numeral could vanish into. The matrix fires a five-hit burst on every combatant at once and asserts no numeral leaves the frame and no pair covers more than half of the smaller glyph box. |
| fighters drawn over the party status window | `--ig-ink-panel` is 84% opaque and the four FFX bosses' quads all stop within 2 grid px of the column's top rail, so Yunalesca's dress glowed through the Tidus row. The FFX rows are 96% now (`.ffxhud .ig-stat`), scoped to this HUD — the shared token, FFX-2 and every other `.ig-stat` are untouched. |

---

## How it was verified

`npx tsc --noEmit` clean; `tests/unit/ui-ffx-hud-safe-zones.test.ts` (23 cases)
plus the six pre-existing suites over the touched files green.

The real check is a Playwright matrix against a vite dev server, driving the game
through `window.__pyrefly` and real `page.keyboard` input: **chapters 1-3 x
1280x720, 1600x900, 2000x1000, 2560x1440 x nine HUD states** (all panels open, a
submenu, that submenu cancelled, the Sensor card, a stage-2 telegraph, a
five-hit numeral burst on every combatant, an Overdrive picker, that picker
cancelled, and every optional panel switched off). Each state computes DOM
bounding boxes for fifteen HUD elements plus every party sprite's screen rect —
projected from the live `PaintedStage` actors through the render camera — and
asserts:

- zero pairwise overlap among the HUD panels, with one declared exception
  (the intent chip parks **on** the CTB queue's corner on purpose);
- zero overlap between any HUD panel and a party sprite, except the command
  stack, its breadcrumb and its help card, which stand in front of the party by
  FFX's own arrangement (`docs/ENGINE-API.md#hud-safe-area` says so outright);
- no panel and no numeral outside the viewport;
- no `.ig-ctb__name` whose `scrollWidth` exceeds its `clientWidth`.

Screenshots are under `docs/screenshots/fix3/ffx-hud/`, `before-*` and `after-*`.

---

## Requests for other tracks

**To whoever owns `src/ui/common/MoveAdvisor.ts`** (the `adv-advisor` track):

1. `MoveAdvisorAnchors` can only describe a horizontal band between two
   elements, which cannot express "the pocket beside the party" or "the shelf
   above their heads". Please take an optional `zone?: () => { left, width,
   bottom, maxHeight } | null` that, when it answers, wins over `layout()`'s own
   measurement. `FFXBattleHud.placeAdvisor()` then goes away and stops being a
   post-hoc overwrite of another component's inline styles.
2. `MIN_CARD_WIDTH = 132` is a global constant; FFX needs 96. Please make it a
   per-instance option rather than a module constant.

**To whoever owns `src/engine/HudPort.ts` / `BattlePresenterStage.ts`:** the
projector answers with *points* (`head` / `chest` / `feet`), so a HUD that needs
an actor's screen **rect** has to reconstruct the width from the height. A
`projectRect(id)` — the stage already has `PaintedActor.poseSize` — would make
`SPRITE_HALF_WIDTH_RATIO` and its safety margin unnecessary.

---

## What is left

- The **Overdrive row is still offered when its picker has nothing to pick** —
  Kimahri with no Rage learned still gets an Overdrive row that opens an empty
  list. Backing out is now instant and harmless, but the row should not be
  enabled at all; whether it is offered is decided by the engine's
  `AvailableCommand[]`, which this track does not own.
- The **shelf overlaps the boss's painting** in a chapter whose party stands
  across the pocket (chapter 2, by up to `SHELF_RIGHT = 340` against Yunalesca's
  left edge at 348 — so in practice it does not, but a future encounter with a
  boss further left would). The assertion this track was given is about the
  party, and the intent slab already lives over the boss, so this was left as a
  courtesy rail rather than a hard one.
- **`.ffx-sensor` is still 84% opaque** over the boss art. It reads fine because
  it sits on dark backdrops in all three chapters, but it is the same class of
  problem as the party rows and would be worth the same treatment if a brighter
  scene ever lands behind it.
