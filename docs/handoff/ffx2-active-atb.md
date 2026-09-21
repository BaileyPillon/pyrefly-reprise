# FFX-2 Active ATB — the clock runs while a command menu is open

**Game case: FFX-2 only** (chapters 4 and 5). The presenter's pump and the two
new optional `HudPort` methods are shared plumbing and are **inert for FFX**
(AGENTS.md rule 14, `critic/CHECKS.md` CHK-020); `tests/unit/ffx-no-active-clock.test.ts`
is the absence test. FFX is CTB and has no clock to run under a menu
(`research/ffx-vs-ffx2-presentation.md` §4.3).

**The owner decision this implements, verbatim** (`docs/target/decisions.json`
D-009, 2026-09-21):

> **"For ffx-2 I choose active."** — Active only, no Wait toggle.

**Source:** `research/ffx2-combat-core.md` §1.5, Active row — *"Time never
stops, including while browsing the item list or a magic submenu"* — and §1.1's
command-input row. Built to `docs/plans/ffx2-active-atb-review.md` (paper
preflight, verdict PROCEED). Commit: `45f98b9`.

Status: **built, measured, verified in a browser.** Deep review owed before it
goes public (`node tools/critic-plan.mjs` says DEEP: `live + focused + deep`,
because the FFX-2 ATB engine and the battle presenter are both shared systems).

---

## 1. What changed

| File | Change |
|---|---|
| `src/battle/ffx2/active.ts` | **new** — the `throughInput` sub-step policy, the input-owner and menu-validity predicates, the dead-target guard, the sub-step size |
| `src/battle/ffx2/engine.ts` | `tick(ms, { throughInput })`; `nextActor(skipReadyPlayers)`; an `inputOwner`; `inputValid(actorId)`; refuse-and-reopen on an all-dead target set; unspent ticks carried across an early break |
| `src/battle/common/types.ts` | `FFX2BattleEngine.tick` gained the options argument and the interface gained `inputValid`. Both additive |
| `src/engine/BattlePresenterActive.ts` | **new** — the pump: real elapsed time, clamped, on the pause gate |
| `src/engine/BattlePresenter.ts` | the `'player-input'` branch starts the pump for an engine that offers an Active clock, and abandons a menu the pump invalidated |
| `src/engine/BattlePresenterPorts.ts` | `PresenterDeps.now?` (defaults to `Date.now`), so a test can drive a fake clock |
| `src/engine/HudPort.ts` | `syncGauges?(snapshot)` and `closeCommandMenu?()`, both optional and additive |
| `src/ui/ffx2/FFX2BattleHud.ts` | implements both |
| `src/ui/ffx2/CommandMenu.ts` | `onOpen(close)` — an external teardown that releases the cancel claim |
| `src/ui/coach/CoachMark.ts` | the C3 badge restored to the approved mockup's words (§6) |

Two new modules rather than growing the old ones: `engine.ts` and
`BattlePresenter.ts` were both already over the 400-line house limit (DEV.md
"House rules") before this change. `node tools/orphans.mjs` is unchanged —
each new module has exactly one importer.

### The three seams

1. **The engine lets the clock run past an open input.** `tick`'s sub-step loop
   no longer stops at a ready player when `throughInput` is set: she is queued
   for input, not acting. It still ends the step after a ready *enemy* acts, so
   its events are played — which is also how §1.5's single-sourced **"Automatic
   Wait"** is honoured without inventing a list of animations: the pump is not
   running while `play()` animates, so nothing ticks then. That alignment is
   **structural, not sourced**, and the deep review should read it that way.
2. **An input owner**, so a command reaches the right girl. `submit` used to
   resolve its actor as `nextActor()`, which was safe only because one girl
   could be ready at a time. Under Active, Yuna can fill her bar while Rikku's
   menu is open and `actorOrder` puts the lower slot first — Rikku's command
   would have executed as Yuna's, silently. `nextActor` now returns the owner
   first while she can still act. It lives on the engine, not in `BattleState`,
   so no save or event shape changed, and setting it is idempotent, so
   `nextDecision()` still never mutates for `'player-input'`.
3. **`inputValid(actorId)`**, polled once per pump step: ready, able to act, not
   chain-locked, not Berserked, battle still on. An invalid menu is torn down
   through `HudPort.closeCommandMenu` — which releases the cancel claim, or Esc
   belongs to a menu that is no longer on screen and the pause key stops working.

### The two AUTHORED constants

Presentation only. Neither can change an outcome, because `tick` sub-steps to
the next scheduled event, so the pump period affects only render smoothness and
how promptly an enemy action interrupts. **No game data was touched** (hard
rule 6).

| Constant | Value | Why |
|---|---|---|
| `PUMP_MS` | 50 (20 Hz) | Enough for a bar carrying a ~100 ms CSS transition; one snapshot and two row renders per step are invisible in a frame budget |
| `MAX_STEP_MS` | 250 | The largest jump a hidden tab, a GC pause or a slow art load may hand the engine at once |

### Deliberately **not** built (preflight §3.3)

`research/ffx2-combat-core.md` §1.5 and §1.1 also say, `[single source: Split
Infinity G0913]`, that an enemy hit landing while a menu is open **closes the
menu and applies Delay** to that girl, and that "any damage perturbs the bar".
Both are left out: single-sourced, and asked of Bailey on 2026-09-21 with no
answer yet (hard rule 10). An enemy hit now lands under an open menu and the
menu stays open and usable — verified in the browser pass below.

Menu **invalidation** (§4.3) is not that rule: it is forced by mechanics we
already ship.

---

## 2. Measured, before and after

`tests/unit/ffx2-active-measure.test.ts`, gated:

```
PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-active-measure.test.ts
```

Forty contiguous seeds per arm per chapter, the shipped `intendedStrategy`, a
fake clock and no browser. `D` is a **modelled human decision time — an input
to a measurement, not game data**: at every `'player-input'` decision the driver
hands the engine `D` ms of `throughInput` clock, then submits the strategy's
pick. **`D = 0` is today's behaviour and the regression control**, because the
auto-battler and `intendedStrategy` take zero decision time by construction
(`BattlePresenter.chooseCommand` returns synchronously when `auto` is set, so
the pump never starts a step). Chapter 5 is the whole five-link chain, driven
through the same `setupForNextLink` the screen uses.

| chapter | D | wins | median s | worst s | player turns | enemy actions | KOs | chained hits | Mega Flares | menus invalidated | commands refused |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ch4 Bahamut | 0 ms | **40/40** | 100.7 | 108.0 | 47 | 19 | 1 | 9 | 2 | 0 | 0 |
| ch4 Bahamut | 1500 ms | **40/40** | 170.1 | 196.1 | 51 | 30 | 1 | 7 | 4 | 510 | 0 |
| ch4 Bahamut | 4000 ms | **40/40** | 229.7 | 262.2 | 55 | 42 | 1 | 0 | 6 | 762 | 0 |
| ch5 Vegnagun | 0 ms | **40/40** | 373.0 | 644.9 | 158 | 105 | 37 | 388 | 0 | 0 | 0 |
| ch5 Vegnagun | 1500 ms | **0/40** | 141.6 | 999.4 | 35 | 71 | 10 | 155 | 0 | 948 | 0 |
| ch5 Vegnagun | 4000 ms | **0/40** | 126.8 | 455.1 | 33 | 63 | 9 | 143 | 0 | 806 | 0 |

Medians across the forty runs; "menus invalidated" and "commands refused" are
totals across all forty.

**The two predictions the preflight said to check, not assume, both held.**
Bahamut's countdown advances on his own turns, so more of his turns per player
turn means Mega Flare arrives sooner: **2 → 4 → 6** fired per run. And §1.7's
~2 s chain window means chained hits fall as `D` rises: **9 → 7 → 0** in
Chapter 4. If neither had moved, the pump would not have been doing what it
claims.

**Chapter 4 survives Active. Chapter 5 does not**, for the shipped intended
line: 40/40 → 0/40 at 1.5 s per decision. The party gets roughly one turn per
two enemy actions instead of three per two, and it loses faster (median 373 s →
142 s).

**Why the menus are invalidated**, measured separately over five chains at
D = 1500: `{"chain-lock": 75, "ko": 14, "battle-over": 1, "petrify": 1}`. Four
in five are §1.7's rule that a **chained target cannot start a new action** —
Vegnagun's multi-hit attacks chain the girls while they read the menu, the lock
lands, and the menu has to close. She is re-offered as soon as the lock lifts
with her ATB intact, so no turn is destroyed; what she loses is time.

**Two honest caveats on the D arms.**

- The harness charges the full `D` at **every** decision, including re-offers
  after an invalidation and including decisions a real player answers in
  reflex ("Darkness again"). It is therefore an **upper bound** on the cost,
  not an estimate of it.
- `D = 0` reproduces the shipped results exactly — 40/40 both chapters, zero
  invalidations, zero refusals — which is the regression gate the preflight
  asked for, and it is why the whole existing FFX-2 test body stays valid as a
  regression net.

**Nothing has been tuned in response.** Under hard rule 6 and the standing rule
in memory ("boss-side fix needs measured options"), the answer to a collapsed
win rate is never a weaker boss; it is measured options on the player's side,
put to Bailey. Those are in §7.

---

## 3. Browser pass

`PYREFLY_BROWSER=gpu node .ffx2-active-browser-tmp.mjs 5744`, own Vite server on
port 5744 (`--strictPort`), 1600x900, real `gotoChapter` into a live command
menu, `__pyrefly.battleState().ticks` read twice 2 s apart.

| chapter | ticks at t0 | ticks at t+2 s | delta | wall ms | menu still open |
|---|---|---|---|---|---|
| Ch. 4 Bahamut | **8189** | **11344** | **+3155** | 2445 | yes |
| Ch. 5 Vegnagun | 7891 | 9724 | +1833 | 2423 | yes |
| Ch. 1 Seymour Flux (FFX control) | 0 | 0 | **+0** | 2393 | yes |

The Chapter 4 t0 reading is **the same 8189** round 05's PR-0046 measured, which
read 8189 again after 2013 ms. Same chapter, same read, same viewport: the
before/after pair is exact.

The deltas are below 3000 ticks/s of wall time on purpose: part of each two
seconds was spent playing an enemy turn's animation, and the pump does not run
during `play()`. That is §1.5's Automatic Wait, reached structurally.

Screenshots (both chapters, both readings, plus the FFX control):
`docs/screenshots/ffx2-active/{ch4,ch5,ffx-control}-menu-{t0,t2s}.png`. The
Chapter 4 pair shows the command stack open, Yuna's bar mid-fill, Paine's full,
and a damage numeral from a hit that landed **while the menu was open** — with
the menu still up, which is §3.3's rule visibly not implemented.

---

## 4. Determinism

The engine's outcome is still a pure function of `(seed, setup, the ordered
sequence of tick amounts and submitted commands)`. Active only changes **who
supplies the numbers**.

What does change: **a human fight is no longer reproducible from the seed and
the command list**, because real elapsed time during input now enters the
engine. That is inherent to Active, not a defect. It costs us one future thing:
a replay feature would need the tick stream recorded, not just the commands.
Written down here because nothing else would remember it.

Everything automated is untouched: the auto-battler returns synchronously, so
not one millisecond of ATB is consumed by a test, an e2e spec, a critic capture
or `__pyrefly.autoBattle('intended')`.

---

## 5. Tests

`tests/unit/ffx2-active-atb.test.ts` (19) and `tests/unit/ffx-no-active-clock.test.ts`
(2). Real `FFX2Engine`, real Chapter 4 and Chapter 5 data, real pump, fake
clock; the last two cases drive the **real `BattlePresenter`** with a HUD that
opens a menu and never answers it.

- ticks advance under an open Chapter 4 menu, and every millisecond handed to
  the pump reaches the engine (the carry);
- the same at Chapter 5;
- at least one gauge moves and the HUD is told;
- **mutation check**: with Wait-mode ticking, no enemy ever acts while a girl
  stands ready — thirty seconds of it, zero enemy actions;
- an enemy takes its turn under the menu and the menu stays open (§3.3 absent);
- the clamp holds a 10 s jump to `MAX_STEP_MS`;
- a 3 s animation does not pay the clock;
- the pause gate freezes the ATB and the pump never returns while parked;
- the command executes as the menu's owner with three girls ready;
- a queue of ready girls is offered one at a time in `actorOrder`;
- asking twice with no tick in between returns the same decision;
- the menu goes invalid on KO, Stop, battle-over and Berserk;
- a dead target refuses the command without spending the turn, and a
  `can-target-dead` revival still reaches a KO'd ally;
- the Berserk line (§6);
- through the real presenter: the clock runs and the gauges sync; a KO'd owner
  gets `closeCommandMenu` and the loop moves on without aborting;
- **FFX absence**: the FFX engine offers no `tick`, `activeClockEngine` returns
  null, and five seconds of fake clock under an open FFX menu move nothing.

`npx tsc --noEmit` clean. Full suite green (§8).

---

## 6. Two things that rode along

**Critic PR-0052 — a Berserked girl with no Attack no longer passes in
silence.** FFX-2 only. §2.8 says a Berserked girl loses player control and may
only Attack; §3.4-3.6 say three dresspheres have no Attack command at all, and
`research/` does not settle what she does then. `berserkCommand` passes the
turn, which is right under hard rule 6 — but `performCommand`'s no-ability
branch emits only `action-end`, so a Berserked White Mage Yuna lost her turn
with **nothing on screen**. `runBerserkTurn` now emits an `action-start` banner
naming her and "Berserk", plus a `message` through the existing path:
`"<Name> is Berserk — no command is available; the turn passes."` The turn still
passes; the open question is unchanged and still Bailey's.

**The C3 onboarding badge is back to the approved mockup's words.** It read
"Nothing paused · gauges running", was demoted to "Keep playing · nothing to
press" when round 05 measured the opposite, and is restored now that the engine
claim is true (§3). `tests/unit/ui-coach-layer.test.ts` pins it in the new
direction and says why. **The C3 tile note in `docs/target/targets.json` is owed
and is not edited here** — another agent owns that file this wave; the tile's
note should record that the badge departure is closed and cite the 8189 → 11344
measurement.

Onboarding itself is still switched off (`ONBOARDING_LIVE = false`,
`src/ui/coach/coachState.ts`). Switching it on is a separate step and is not
part of this change.

---

## 7. Open for Bailey

1. **Chapter 5 at human decision speed.** Active costs the shipped intended line
   every chain at 1.5 s per decision (§2). Nothing has been tuned. Measured
   options on the player's side, none of them built:
   - **(a) Keep the menu open through a chain lock** and submit the command the
     moment the lock lifts, instead of closing it. Four in five invalidations
     are chain locks, so this is the single biggest lever and it costs the
     player nothing she had.
   - **(b) A ready chime / clearer bar state**, so a player is not reading the
     menu when a girl comes up.
   - **(c) A shorter path through the menu** (last-command repeat).
   - **(d) Leave it.** Chapter 5 is the last fight in the game and the measured
     line is an upper bound, not an estimate.
2. **Does Active include "an enemy hit closes the open menu and delays that
   character"?** Single source; asked on 2026-09-21; still open. This build
   leaves it out. §2's numbers say what adding it would cost.
3. **Should the `ACTIVE — ATB RUNNING` chip be visible whenever a command menu
   is open**, rather than only while a target cursor is live? With a real clock
   the chip is the one thing telling a player time is passing — but it is
   something Bailey sees, so under hard rule 9 it wants an options round rather
   than a builder's decision. The chip's text is unchanged and now tells the
   truth: `atbMode` is hard-wired to `'active'`, so it only ever reads ACTIVE.
4. Noted, not asked: auto-**retargeting** a command whose target died, instead
   of refusing and reopening (preflight §4.4 (b)). The retail games generally
   retarget, but there is no citation for X-2 specifically.

---

## 8. How it was verified

- `npx tsc --noEmit` clean.
- `node tools/orphans.mjs` unchanged.
- New tests: 21, each failing without its repair.
- Full unit suite green, run once at the end of the branch.
- Browser pass at 1600x900 with `PYREFLY_BROWSER=gpu`, both FFX-2 chapters and
  the FFX control, six screenshots under `docs/screenshots/ffx2-active/`.
- Measurement: 240 headless chapter runs, table in §2.
- Scratch, not product code: `.ffx2-active-browser-tmp.mjs` (agent scratch, per
  AGENTS.md "Shared working tree").
