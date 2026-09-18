# Handoff — the in-battle move advisor

**Key:** `advisor`. Dev server: **5359** (the assigned 5352 and the next two
ports were already held by other agents' servers when this started; every
capture below was taken against `npx vite --port 5359`).

Owns `src/battle/ffx/simulate.ts`, `src/battle/ffx2/simulate.ts`,
`src/engine/tactics/advisor.ts`, `src/ui/common/MoveAdvisor.ts` +
`move-advisor.css`, `tests/unit/advisor-simulate.test.ts`,
`tests/unit/advisor.test.ts`, `tests/unit/ui-move-advisor.test.ts`, plus small
additive edits in `src/ui/ffx/FFXBattleHud.ts`, `src/ui/ffx2/FFX2BattleHud.ts`,
`src/app/SaveData.ts` and `src/ui/common/ControlsHint.ts` (all listed in §7).

Nothing else was touched. `src/engine/tactics/guide.ts`, the five
`src/engine/tactics/*.ts` encounter modules, `src/data/**` and `public/art/**`
are **read only** here — the first two are run, read-only, every time the card
draws a row.

---

## 1. What it is

A card docked in the **bottom-centre band** of the battle HUD, in addition to
(never instead of) the strategy guide's left rail. It answers the narrower
question the player is holding a controller for:

```
NEXT BEST MOVE                                    TIDUS
  Holy Water → Yuna   [chapter line]
  NO MP · ALWAYS HITS · 1% CRIT · CURES ZOMBIE
  Cures Zombie and Curse.
  Clears Zombie from Yuna.
  ffx-seymour-flux §6 row 4, §3.3
```

Every field the brief asked for is on it: the move's **name**, **what it does**
(derived from its own `AbilityDef`), the **estimated damage or healing** against
the chosen target as a range from the engine's own formulas, **MP cost**, **hit
chance**, **crit chance** (outside the range — see §3), the **statuses** it
applies or cures, a **kill** flag when the typical roll finishes the target, and
one line of **why**. When the pick is the chapter's shipped tactic it carries a
`CHAPTER LINE` badge and the written guide's research citation.

It follows the selection: `showDecision` is called by both HUDs from
`chooseCommand`, so the card names whoever the menu is open for, recomputes when
the turn passes to another character, and clears the moment the command is
taken.

`N`, the pad's **right trigger** (standard button 7) or the card's own chip
hides it and leaves a chip two words wide. Remembered in
`Settings.advisorVisible`; default **on**.

## 2. The three layers, and why the cut is there

| Layer | File(s) | Owns |
|---|---|---|
| Estimating | `src/battle/ffx/simulate.ts`, `src/battle/ffx2/simulate.ts` | resolving a command on a copy of the battle |
| Ranking | `src/engine/tactics/advisor.ts` | which move, which target, what to say about it |
| Drawing | `src/ui/common/MoveAdvisor.ts` + `.css` | DOM, layout, input, the preference |

The same split `StrategyGuide` uses, one layer deeper: the guide's reasoning
half asks the tactic *what*, and this one asks the engine *how much*.

### 2.1 The estimate is the engine, not a second formula

`simulateFFXCommand` deep-clones the state, rebuilds the small amount of engine
runtime `BattleState` does not carry, and calls the shipped
`executeCommand(ctx, actor, command, true)` on the copy. Every formula, every
affinity table, every status branch and every one-off `extra` rule is the real
code. Re-deriving damage in the UI is how a panel starts lying to the player the
first time a data agent retunes a stat block, and it is the one failure mode a
number on screen cannot survive.

The X-2 half calls `resolveAbility` rather than `performCommand`, because
`performCommand` is the whole *turn* — the purple charge bar, the ATB recovery,
the AI hooks, the story triggers, the battle-end check — all of which is either
scheduling a preview must not predict or a consequence of the turn ending.
`resolveAbility` is exactly the action.

**It resolves the action and nothing after it** in both games. Counters, the CTB
charge, status ticks and the boss's reply are the rest of the turn; a preview
that ran them would be predicting the boss's answer as though it were a
consequence of the player's choice.

### 2.2 The top row is the shipped tactic

Rule 1 of the ranking is the same claim the guide's NEXT line makes:
`recommendedCommand` runs `intendedStrategy` read-only through `guide.ts`'s
`stateOnlyEngine`, and when that command is legal it **is** the top row. The
advisor's contribution on that row is the price and the effect, which the tactic
does not carry.

`tests/unit/advisor.test.ts` is that claim as an assertion: it drives real FFX
engines through real Chapter 1 and Chapter 2 battles and compares the card's top
suggestion against `intendedStrategy` at **every** decision, across several
seeds. One row of disagreement fails on the turn it happens.

Rule 2 only runs when the tactic declines: every legal row is simulated at the
typical roll and scored by `scoreOutcome` — damage (a part is worth 0.6 of the
same damage on the boss), kills, healing, healing that prevents a KO, revives,
cures, inflicted statuses, minus MP, minus harm to the party, minus the
canon-aware penalties.

### 2.3 The canon-aware penalties are mostly the simulation's own verdict

Three of the five encounters punish a move that looks obviously right, and the
simulation catches most of it without being told:

* **Healing a Zombie is damage.** The previewed `damage` event comes back
  *positive*, lands in `harmToAllies`, and is scored at 4x against. The warning
  line names the member: *"Healing a Zombie is damage — Yuna takes it"*.
* **An immune Break lands nothing.** No `status-add` is emitted, so a move that
  tried to apply a status, applied none and dealt no damage takes
  `WASTED_TURN_PENALTY` and says *"This target is immune — nothing lands"*.
* **Reflect on the party at Yunalesca** is the one that cannot be read off the
  events (it *works*; it is just the losing play), so it is the single named
  board rule in the scorer.

### 2.4 Switches are rare, and never alone

A switch resolves to nothing this turn by construction — `executeCommand` swaps
the slots and hands the turn to the incoming member — so there is no simulation
to read. `switchValue` prices the bench instead (a downed or Petrified/Zombied/
Confused member in the slot, a healthier replacement) and `SWITCH_PENALTY`
(12 000) is set above the value of a *good* ordinary turn, per the user's
instruction that switching must be rare.

When a switch does reach the top — which in practice means the chapter's own
tactic chose one, and Chapter 1's and Chapter 3's both do — the card shows the
best **non**-switch beneath it, because "switch" on its own is not an answer to
"what do I press".

## 3. Three rolls, and why crit is not one of them

FFX's damage chain draws one variance roll per hit (`int(0, 31)`, a 32-step
ladder from x0.9375 to x1.0586, [ffx-combat-core §2.1]); X-2 draws the step-7
randomiser (`int(240, 271)`, §2.1). Around those sit *branch* rolls that decide
whether something happens at all: the hit check, the critical check, every
status application, escape.

`RollPolicyRng` sweeps the first and never the second:

| Draw | `'min'` | `'mid'` | `'max'` |
|---|---|---|---|
| Magnitude (`int(0,31)`, a Trigger Happy shot count, a reel's hits) | low end | midpoint (16 of 0-31 — the exact x1.0 step) | high end |
| Branch (`int(0,100)`, `int(0,99)`, `int(0,255)`) | median | median | median |

A branch roll at its median is the *likely* outcome: an action whose hit chance
is over 50 lands in all three rolls, and a critical whose chance is under 50
fires in none of them. That is deliberate. A range whose top end silently
included a critical would read as "this move might do double", which is not what
a range means — so the card prints hit chance and crit chance as their own
chips, beside the band rather than inside it.

The three branch ranges are the engine's own named helpers (`percentRoll`,
`byteRoll`, and the bare `int(0, 99)`), so recognising them by range is
recognising the helper rather than guessing at intent.

**Trigger Happy** is the one action whose hit *count* is the whole point, and
`resolveAbility` never sees a minigame outcome from a preview, so
`expectedMinigameHits` supplies one from the engine's own `rollTriggerHappy`
through the same policy: 6 shots at `min`, 16 at `max` [`minigames.ts`,
ffx2-combat-core §3.1]. The chain multiplier is read off the cloned target, so a
preview taken while a chain is live quotes the chained figure.

## 4. Performance: why the clone is hand-written

The first working version cost **258 ms per open menu** and would have been a
visible hitch every time the command stack appeared. Three things fixed it, in
order of how much they were worth:

1. **The combatant clone.** `structuredClone` on a full FFX combatant is ~0.2 ms
   and one menu runs sixty of them — 2.44 ms per *state* clone, three quarters
   of the whole cost. Almost all of it is three fields the damage chain only
   ever reads: the sphere grid (hundreds of activated node ids), the learned
   ability list and the equipment block. `cloneCombatant` shares those by
   reference and deep-copies the mutable rest. Clone cost fell 8x.
   *Checked, not assumed*: `sphereGrid` is touched only in `results.ts` (after
   the battle), `learnedAbilityIds` only in lookups, `equipment` only in
   `equipment.ts`'s readers and `applyEquipmentToCombatant`, which runs at
   `setup.ts` time. `advisor-simulate.test.ts` deep-compares the live state
   across a battery of previews, which is what would catch this going stale.
2. **The content registry.** `FFXEngine.init` clones the registry so two battles
   cannot mutate each other's content; nothing on the resolve path writes to it,
   and cloning ~250 records per candidate row was pure waste. A preview reads it
   directly.
3. **Two of the three rolls are deferred.** Ranking only ever compares typical
   outcomes, so `min` and `max` are run for the one or two rows the card
   actually prints, not for the forty a black mage is offered.

Worst case measured after all three: **16 ms** per open menu on Chapter 1's
widest command list, once per decision, never per frame. The state's event log
is dropped rather than copied (it reaches ~600 events in Chapter 1 and nothing
in the command path reads it).

## 5. Layout: measured, in a band that is empty in both games

The card is squeezed between two anchors the HUD owner names — the element on
its left and the element on its right — re-measured every frame:

| | FFX | FFX-2 |
|---|---|---|
| left anchor | `.ffx-cmd-area` (the command stack) | none (a constant, clear of the guide rail) |
| right anchor | `.ig-stat-list` (party status) | `.ffx2hud__party` |
| fallbacks | 196 → 414 | 160 → 458 |

FFX's command stack is `column-reverse` and bottom-anchored, so its right edge
moves with the widest row a submenu currently holds; measuring is what makes
"never over the command menu" true rather than true-on-the-screenshot. The
strategy guide is a *left rail* in both games and this is a centre card, so they
never share a column at any height.

**FFX-2 is not the mirror the CSS suggests, and this cost a capture.** The
shared layer has `.ig--ffx2 .ig-stat-list { left: 23.11px }`, which reads as
"the party column is on the left in X-2" — so the first version anchored the
card *after* it and the card landed at x 636, off a 640-wide stage. Measured on
a real board (`critic/scratch/adv-probe.mjs` prints the boxes), this HUD's party
column is at left **464** and its command stack at 477: both on the right, with
the boss gauge strip top-left and the guide rail running down the left to y 255.
The free band is therefore the bottom-left/centre, and the card has one wall
rather than two. If you touch these anchors, run the probe rather than reading
the stylesheet.

Both anchors are gated on `offsetWidth > 0`, not on existence:
`.ffx2hud__command` is `hidden` between decisions and a hidden element reports
zero for both offsets, which believed would pin the card to the stage's left
edge. That is the same trap `StrategyGuide.layout` documents, and a test pins it.

**The card keeps the house skew** where the guide's rail dropped it. The reason
the rail dropped it was height: at 200px a 12° skew puts its top and bottom
edges in different columns. This card is capped at 104px and usually nearer 60,
which is `.ffx-sensor`'s register (78px) — and that is skewed. So the two
optional panels read as one family without either being deformed.

## 6. Input, without touching `Input.ts`

`KeyN` on `window`, edge-only, ignored with ctrl/meta/alt or `repeat`; standard
gamepad **button 7** (the right trigger), polled from `update(dt)` and
edge-detected; and the chip, for mouse and touch. `PAD_MAP` binds 0, 1, 3, 4, 5,
8, 9 and the d-pad, and `StrategyGuide` has taken 2 — the triggers are free in
both. `ADVISOR_HINT_ITEM` in `ControlsHint.ts` is the shared wording, so the
chip and any future controls strip say the same thing, worded per device (`N`
with no pad attached, `R2` once one is).

`Settings.advisorVisible` is its own preference beside `guideVisible` and
`intentVisible`, read and written through `SaveData.ts`'s `activeStore`, because
the HUD is built by `BattleScreenWiring.createHud(game)` and has no route to the
app's `SaveStore`.

## 7. Additive edits in other agents' files

| File | Edit |
|---|---|
| `src/app/SaveData.ts` | `Settings.advisorVisible`, defaulting to `true` |
| `src/ui/common/ControlsHint.ts` | `ADVISOR_HINT_ITEM` |
| `src/ui/ffx/FFXBattleHud.ts` | construct/mount/unmount/sync/update the card, `showDecision`/`clearDecision` beside the guide's, a `moveAdvisor` getter, and `.mad__card` added to `intentAvoidRects()` |
| `src/ui/ffx2/FFX2BattleHud.ts` | the same, plus `ffx2EngineOptions()` handed to the simulator (X-2 takes its ability and item tables by injection; with the engine's baseline fallback alone the card would price every dressphere skill as "unknown") |

`.mad__card` in both `intentAvoidRects()` lists is the one edit made *for*
another agent's component rather than in it: the enemy-intent slab already
dodges the CTB list, the command stack and the party status, and the card is now
in that class. If the intent agent re-writes that list, keep the entry.

## 8. Verification

```
npx tsc --noEmit          # clean, whole tree
npx vitest run            # 93 files, 3 019 tests, all green
```

New tests, 65 in total:

* `tests/unit/advisor-simulate.test.ts` (11) — the estimator, headless against
  real engines. The roll policy's magnitude/branch split and its determinism;
  **the live state deep-compared across a battery of previews**; and the central
  one: the same command submitted to the real engine on a fixed seed, with the
  damage it actually emits required to land inside the min-max band the preview
  quoted, across five seeds, skipping the rolls that crit or miss (both of which
  the card prints separately by design).
* `tests/unit/advisor.test.ts` (32) — the ranking. The agreement-with-tactic walk
  across Chapters 1 and 2 at several seeds; a switch at the top always carrying a
  runner-up; every field the card prints being filled in; a heal aimed at a
  Zombie scoring below the same heal on a clean ally and naming the member in its
  warning; `switchValue` under the penalty for an ordinary swap and over it when
  the slot cannot act; and the wording helpers.
* `tests/unit/ui-move-advisor.test.ts` (22) — the card, jsdom. Default on;
  remembered off; independent of `guideVisible`; N, the right trigger (edge only,
  and *not* the guide's button 2), the chip, the chord and repeat guards;
  listeners dying with the card; the card following the selection from one actor
  to the next; escaping; the four layout cases including the hidden-anchor bug;
  and both HUDs mounting it into their own scaled stage.

An earlier full run had `tests/unit/party-prep-panels.test.ts` time out in its
`beforeEach` — the load-related failure mode `vitest.config.ts` documents in as
many words. It passed on its own and in the final full run, which is green.

### 8.1 Captures

Taken on port 5359 by driving the real game through `window.__pyrefly` with
`critic/scratch/adv-shot.mjs`:

| File | What |
|---|---|
| `docs/screenshots/adv/advisor-ffx-ch1.png` | FFX, Chapter 1, Kimahri's Mighty Guard on the party with the chapter-line badge |
| `docs/screenshots/adv/advisor-ffx-ch1-zombie.png` | the Holy Water case — Yuna is a Zombie, the card cures it and says why |
| `docs/screenshots/adv/advisor-ffx-ch1-off.png` | the same board with `N` pressed — chip only |
| `docs/screenshots/adv/advisor-ffx-ch2.png` | FFX, Chapter 2 (Yunalesca) |
| `docs/screenshots/adv/advisor-ffx2-ch4.png` | FFX-2, Chapter 4 (Bahamut), mirrored band and pyre-pink accent |
| `docs/screenshots/adv/advisor-two-moves.png` | the two-suggestion case: the tactic's pick is a party switch, so the best non-switch is shown beneath it |

The script is worth keeping for the next agent, because the obvious version does
not work: **the card only draws when a human is being asked.**
`BattlePresenter.chooseCommand` returns early while `this.auto` is set and never
calls `HudPort.chooseCommand` at all, so a fight driven by a strategy has no card
to photograph. `adv-shot.mjs` therefore runs in two passes over one seed —
`--scan` plays the chapter with the shipped tactic and asks the (pure, read-only)
advisor about each decision to find the index of the board worth photographing,
then `--stop=N` replays the same seed, hands the fight back after answering N
decisions, and parks on decision N+1 with the real menu and the real card up.
`--stop=0` installs no driver at all and parks on the very first decision.

The frame pump has to be driven in chunks and the battle only advances while it
is — the same two traps `docs/handoff/bp1-strategy-guide.md` §6.1 records.

## 8.2 A second consumer landed on it

The enemy-intent agent's `src/battle/ffx/intent.ts` / `estimate.ts` are built on
`simulateFFXCommand` rather than on a second estimator of their own — its own
header says why, and it is the right call: two independently derived figures on
one screen ("1 204" under the player's cursor, "about 1 400" over the boss's
head) is worse than either number alone. If you change the shape of `SimOutcome`
or the roll policy, that file is the other caller.

## 9. Known gaps

* **The tactic almost always has an opinion**, so rule 2's simulated ranking is
  in practice a fallback rather than the usual path: `intendedStrategy` falls
  through to a generic ladder that returns a command on nearly every board, and
  the brief's rule 1 says the chapter's line wins when it is legal. The scoring
  is fully exercised by the tests and by the runner-up row; if a future brief
  wants the simulated pick shown *beside* the chapter line on every turn, the
  view already carries both — `buildAdvisorView` sorts every candidate and only
  the presentation limits it to one row.
* **`AbilityDef` has no description field.** "What it does" is derived
  (`describeAbility`) from formula, damage type, element, hit count, statuses and
  the row's own `help` when the menu wrote one. Deriving it means a retuned
  spell cannot leave a stale sentence behind, but it also means the copy is
  mechanical where a hand-written line would read better. `AvailableCommand.help`
  is preferred wherever it exists, which is most FFX items.
* **The `heals` flag is a sign flag, not a promise of HP.** Hastega carries it
  with `formula: 'ctb'`. `describeAbility` gates on the formula for that reason;
  if another `ctb`-formula spell arrives with different phrasing needs, that is
  the branch to extend.
* **Port 5352 was taken.** Captures are on 5359; nothing in the code depends on
  either number.
