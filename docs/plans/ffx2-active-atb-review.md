# Paper preflight: FFX-2's ATB runs in **Active** mode

Paper preflight under `critic/RUBRIC.md` §4 (adopted 2026-09-21, AGENTS.md rule 15).
**Docs only. No code was written, no test run, no browser opened, no build made.**
Written 2026-09-21 by a sub-agent of the release orchestrator.

**Verdict: PROCEED** — with five things settled before the first line of code (§11) and two
questions carried to Bailey (§12). Nothing in §11 needs an answer from Bailey to start; §12
does, and neither blocks the engine work.

The owner decision this implements, verbatim (`docs/target/decisions.json` D-009, 2026-09-21):

> **"For ffx-2 I choose active."** — Active only, no Wait toggle.

---

## 1. Game case and sources

**Game case: FFX-2 only** (chapters 4 and 5), with two shared-plumbing carve-outs.

| Piece | Case | Why |
|---|---|---|
| The clock running during command input; the input queue; menu invalidation; gauge/status/chain advance while a menu is open | **FFX-2 only** | `research/ffx2-combat-core.md` §1.5 — Active/Wait is an FFX-2 Config entry. FFX is CTB: `research/ffx-vs-ffx2-presentation.md` §4.3, *"True to FFX. Not true to FFX-2"* for the turn-order preview, and FFX's engine is parked waiting for a command by design. There is no FFX clock to run. |
| `BattlePresenter`'s input branch gaining a pump, and the optional `now` dependency | **both** (shared plumbing, `critic/CHECKS.md` CHK-020) | One presenter serves both engines. The pump must be **inert for FFX** — that is the absence test in §9. |
| `HudPort.syncGauges?` / `closeCommandMenu?` (additive, optional) | **both** as interface, **FFX-2 only** as behaviour | FFX's HUD implements neither and keeps today's behaviour exactly. |

### Sources read for this preflight

- `research/ffx2-combat-core.md` §0 (executive summary), §1.1 (four-phase pipeline), §1.2
  (decoded tick model), §1.3 (CTIM), §1.4 (RECTIM), §1.5 (Active vs Wait), §1.6 (battle
  start), §1.7 (Chain), §2.8 (status durations in seconds), §4.2 (spherechange cost).
- `research/ffx-vs-ffx2-presentation.md` §4.2 / §4.3 and the §9 verdict table.
- `docs/CONTRACTS.md` — the playback protocol and its five rules; `docs/ARCHITECTURE.md`
  layering; `docs/ENGINE-API.md` as far as the HUD ports.
- Code: `src/battle/ffx2/engine.ts` (479 lines), `src/battle/ffx2/gauges.ts`,
  `src/battle/ffx2/results.ts` (`actorOrder`), `src/battle/ffx2/resolve.ts`
  (`targetForHit`), `src/battle/ffx2/ai/bahamut.ts` (the countdown),
  `src/engine/BattlePresenter.ts` (508 lines), `src/engine/BattlePresenterPorts.ts`,
  `src/engine/HudPort.ts`, `src/ui/ffx2/FFX2BattleHud.ts`, `src/ui/ffx2/CommandMenu.ts`,
  `src/app/screens/BattleScreen.ts` (the pause gate and the stall watchdog).
- Tests: `tests/unit/strategy-ffx2-bahamut.test.ts`,
  `tests/unit/strategy-ffx2-vegnagun-shuyin.test.ts`, `tests/unit/ui-ffx2-atbmode.test.ts`.
- `docs/handoff/onboarding-c.md` §3, §4 and Open item 0 (the X-2 clock question);
  `critic/rounds/round-05.md` PR-0046; `docs/target/decisions.json` D-009.
- `node tools/critic-plan.mjs --paths src/battle/ffx2/engine.ts,src/engine/BattlePresenter.ts,src/ui/ffx2/FFX2BattleHud.ts`
  → **review: DEEP**, obligations `live + focused + deep`, because the FFX-2 ATB engine and
  the battle presenter are shared systems. That classification is what makes this preflight
  mandatory.

### Confidence, carried forward honestly

§1.5's Active row is `[single source: Split Infinity G0913]`. So is the "Automatic Wait"
row and so is the hit-closes-the-menu rule. §1.2's tick model is `[single source,
calculator-derived]` but is already shipped and is not touched here. **This change adds no
new numbers at all** — no tuning, no authored constants beyond two presentation-only
timings named in §5.4 and labelled AUTHORED there. Hard rule 6 is satisfied by not
touching data.

---

## 2. What is true today, measured, not assumed

`BattlePresenter.run()` awaits `HudPort.chooseCommand` in the `'player-input'` branch and
ticks the FFX-2 engine **only** in the `'waiting'` branch (`BattlePresenter.ts:309-316`
and `:318-336`). So the X-2 clock does not advance during command input at all.

The round-05 measurement (`critic/rounds/round-05.md` PR-0046): with the Chapter 4 command
menu open, `BattleState.ticks` read **8189 at t0 and 8189 after 2013 ms**, identical at
2000×1012 and 390×844; the FFX control read 0 → 0, correctly, because FFX is turn-based.
`docs/handoff/onboarding-c.md` §3 repeats it for Chapter 5 and shows `?coach=off` is
identical, so the coach layer is not the cause.

Two shipped surfaces already assert the opposite of the build:

- the FFX-2 HUD's `ACTIVE — ATB RUNNING` chip (`FFX2BattleHud.ts:910`, `atbMode` hard-wired
  to `'active'` at `:144`);
- the approved onboarding line **"In hers, the clock does not wait"**, which is why the
  whole onboarding feature ships switched off today (`ONBOARDING_LIVE = false`,
  `src/ui/coach/coachState.ts`).

This change is what makes both true. Switching onboarding back on is a **separate,
following** step (§10) — approved copy is not edited to fit a build, and the build is not
rushed to unlock copy.

---

## 3. What Active means, from the research

### 3.1 What runs while a command menu is open

Everything. §1.5, Active row: *"Time never stops, including while browsing the item list or
a magic submenu."* §1.1, Command input row: *"In **Active** mode time keeps running"*.
Concretely, all of the following are already implemented inside `FFX2Engine.tick()` and
simply stop being called during input today:

| What advances | Mechanism today | Source |
|---|---|---|
| Every unit's green ATB gauge, at the fixed 3000 ticks/s | `advanceGauge` per sub-step | §1.2 |
| Purple CTIM bars, which **fire** when they fill (`fireChargedCommand`) | `advanceGauge` → `'charge-complete'` | §1.1, §1.3 |
| RECTIM recovery owed after an action | `advanceGauge`, recovery paid first | §1.4 |
| Enemy turns — a ready enemy acts | `tick` → `runAiTurn` | §1.1 (enemies run the same pipeline; their bars are simply not drawn) |
| Status clocks: Shell, Protect, Haste, Slow, Poison and Regen payouts, expiries | `advanceStatusClocks` → `advanceStatuses` | §2.8 — durations are **wall-clock seconds** (`seconds = durationValue × 0.53`), so a buff burns while you browse |
| Chain windows (~2 s) closing | `advanceChainWindows` | §1.7 |
| Other girls' gauges filling to full, then **banking overflow** to the 416 % internal ceiling | `advanceGauge` + `atbCeiling` | §1.2, "internal gauge runs to 416 % and is still fully simulated" |

Two consequences worth naming because they are what the player will *feel*:

1. **A chain dies while you read a menu.** §1.7's window is about two seconds; a deliberate
   Attack-chain is broken by any hesitation. That is canon and it is the single biggest
   change to how Chapters 4 and 5 play.
2. **A girl left waiting is not wasting all of her time** — she banks up to 416 % of a bar.
   But `beginRecovery` resets `atb.ticks` to 0 after she acts, so banked overflow is spent,
   not carried. That matches the shipped model and is not changed here.

### 3.2 What still stops time

| Freeze | Status | Decision |
|---|---|---|
| Stop, Sleep, KO, Petrify freeze **that unit's** gauge (×0) | `[verified / single source]` §1.2; already implemented in `isGaugeFrozen` | unchanged |
| "**Automatic Wait** — the game force-freezes time during certain long animations regardless of the setting" | `[single source: Split Infinity G0913]`, and the source does **not** list which animations | **Recommend**: honour it by construction — see below |
| The pause overlay | project rule, not canon | **Recommend**: the pump waits on the existing `pauseGate`, so pause freezes the ATB exactly as it freezes playback today |
| A timed-Overdrive minigame overlay | unsourced | **Recommend**: frozen. The player is being asked for a skill input; charging them ATB time for it is a design choice we would have to defend and nothing in the sources asks for it |
| Mid-battle story scripts (`script-trigger`) and the battle-start / victory / defeat moments | unsourced | **Recommend**: frozen |

**The Automatic-Wait recommendation, in full.** The sourced rule is real but its scope is
single-source and undocumented, so we do not invent an animation list. Instead we get the
behaviour for free from the shape the presenter already has: **game time advances only when
something calls `tick()`**, and the pump proposed in §5 runs *only while a command menu is
open*. While an enemy's attack animation plays, the pump is not running, so the gauges
hold — which is precisely "automatic wait during a long animation", reached without
authoring a list of animations. Write that reasoning into the code comment and into the
handoff, and say in the deep-review report that the alignment is structural, not sourced.

### 3.3 What we are deliberately NOT implementing (single-source, not approved)

§1.5 and §1.1 also say, `[single source: Split Infinity G0913]`:

> "An enemy hit landing while a menu is open **closes the menu and applies Delay effect**
> to that character's ATB."

and §1.1's ATB-fill row: *"being hit while the command menu is open cancels the menu and
delays the turn"*, plus *"Any damage taken perturbs the bar's fill"* for both sides.

**Left out of this build.** It was asked of Bailey on 2026-09-21 and is listed unanswered
under "Waiting on Bailey" in `docs/handoff/NOW.md`. Under hard rule 10 it is not built on a
single source and an agent's judgement. So in this build:

- an enemy hit landing while the menu is open **does not** close the menu;
- it applies **no** extra Delay to the owner's gauge beyond what the ability already does
  (`applyDelayEffect` stays reserved for abilities that carry an explicit delay);
- the generic "any damage perturbs the bar" rule is **not** added either — it is the same
  single source and the same unanswered question, and adding it would silently change every
  X-2 fight's pacing on top of the change we are measuring.

Both are carried in §12 as the one question that must come back to Bailey, with the
measurement from §8 in hand so the answer can be informed.

**Not to be confused with menu invalidation** (§4.3), which is a necessity, not a canon
rule: a girl who has been KO'd, Stopped, Slept, Petrified or Berserked while her menu was
open cannot act, so the menu has to go. That is forced by mechanics we already ship.

---

## 4. Design

Three seams, in dependency order. Layering rule 1 is preserved throughout: the engine
stays pure, deterministic and DOM-free, and **the presenter remains the only thing that
knows what a second is** (`docs/CONTRACTS.md`, "The playback protocol", rule 4).

### 4.1 Engine: let the clock run past an open input

`FFX2Engine.tick()` today stops the clock the instant a player unit is ready
(`engine.ts:227`, `if (actor && actor.controller === 'player') break;`). That is exactly
right for Wait and exactly wrong for Active, so the smallest change is one option:

```ts
tick(ms: number, opts?: { throughInput?: boolean }): BattleEvent[]
```

With `throughInput: true` the sub-step loop:

- **skips** ready player units when deciding whether to stop — they are queued for input,
  not acting;
- still **breaks after running a ready enemy's turn**, so its events are handed back to be
  played (unchanged behaviour, and it is what gives us the animation freeze in §3.2);
- still resolves a **Berserked** ready girl inline (`runBerserkTurn`) and breaks, because
  Berserk already takes the turn away from the player (§2.8, PR-0045);
- still breaks on `checkBattleEnd()`.

One correctness point the implementer must not miss: `nextActor()` sorts party before
enemies (`actorOrder`, `results.ts:20` — side, then slot). Under `throughInput` the
"who acts now" query must **exclude ready player units**, otherwise a ready girl standing
in front of a ready enemy would block the enemy forever and the pump would spin without
advancing anything. Give `nextActor` a `skipReadyPlayers` argument rather than duplicating
the loop.

### 4.2 Engine: the input owner, so a command reaches the right girl

`submit(command)` resolves the actor as `this.nextActor()` (`engine.ts:182`). Today only
one girl can be ready at the moment of input, so that is safe. Under Active it is **not**:
while Rikku's menu is open, Yuna can become ready, and `actorOrder` puts the lower slot
first — Rikku's command would execute as Yuna's. This is the defect most likely to escape
into the build, and it is silent.

Fix, engine-internal, no signature change:

- `inputOwner: CombatantId | null`, set when `nextDecision()` returns `'player-input'` and
  cleared on `submit()`, on battle end, and whenever the owner stops being able to act;
- `nextActor()` returns the input owner first while it is still ready and able;
- setting it stays **idempotent**, so `docs/CONTRACTS.md` rule 1 ("`nextDecision()` never
  mutates for `'player-input'`") still holds in the sense that matters: two calls with no
  `tick()` in between return the same decision and leave `BattleState` untouched. Say so in
  the contract note; `inputOwner` lives on the engine, not in `BattleState`, so no save or
  event shape changes.

An alternative — `submit(command, actorId?)` — is a wider contract change for the same
result and is **not** recommended; it would also let a caller submit for a girl whose turn
it is not.

**Queueing several ready girls**, then, is fully deterministic and needs no new rule: the
engine offers the first eligible unit in `actorOrder` (party by slot, then enemies), the
others keep filling to the 416 % ceiling, and the moment a command is submitted and its
events are played the loop asks again and the next ready girl gets her menu. The
presenter's `INPUT_STREAK_LIMIT` guard counts consecutive decisions **for the same actor**
(`BattlePresenter.ts:319`), so a queue of different girls does not trip it.

### 4.3 Engine: is the open input still valid?

Add one read-only query to the FFX-2 engine:

```ts
inputValid(actorId: CombatantId): boolean   // ready, able to act, not chained-locked, battle not over
```

It is `isReady && canAct && !isActionLocked` — the same three predicates `nextActor()`
already uses — so it cannot drift from the engine's own answer. The presenter polls it once
per pump step (§5.2). This covers the owner being KO'd, Stopped, Slept, Petrified, chained
into an action lock (§1.7: *"chained targets cannot start a new action"*), Berserked, or
the battle ending under her.

### 4.4 The dead-target case, which is new with Active

`targetForHit` (`resolve.ts:108-123`) filters the pool to living units and returns
`undefined` when none remain; the action then lands nothing **but the turn is still spent**
(`beginRecovery` runs in the normal path). Today that is unreachable during input, because
nothing resolves while a menu is open. Under Active it becomes ordinary: you aim at a
fiend, a chained hit or a charged ability kills it, you press confirm, and your turn
evaporates.

Our research does not cover retargeting, so this is a design decision, not a data one. Two
answers:

- **(a) Refuse and reopen** — at submit time, if every chosen target is dead or removed, the
  command is not executed, the turn is not spent, and the menu reopens with a fresh command
  list. Non-punitive, no new numbers, no new on-screen vocabulary.
- **(b) Retarget** — re-point a single-target command at another living member of the same
  side.

**Recommend (a)** for this build: it cannot be wrong in the player's favour by accident, it
needs no source we do not have, and it is one guard in `submit`. (b) is what the retail
games generally do but we have no citation for X-2 specifically, so it goes to Bailey in
§12 as a follow-up, not as a blocker.

### 4.5 Presenter: the pump

In the `'player-input'` branch only, and only for an engine that offers `tick`:

```
open the menu (unchanged)
while the menu promise is unsettled:
    await baseSleep(PUMP_MS)                 // the pause gate; unscaled by playback speed
    dt = clamp(now() - last, 0, MAX_STEP_MS) // real elapsed, never a constant
    events = engine.tick(dt, { throughInput: true })
    if (events.length) await this.play(events)   // serialised: no second pump step inside
    else hud.syncGauges?.(engine.gaugeSnapshot())
    if (!engine.inputValid(actorId)) → close the menu, abandon the decision, continue the loop
```

Five properties this shape buys, each of which is a thing that would otherwise break:

1. **Pause freezes the ATB.** `baseSleep` is `BattleScreen.pauseGate`
   (`BattleScreen.ts:426`), which parks after the real delay while the overlay is up. No new
   pause plumbing.
2. **`skip` and `fast` do not distort the game clock.** `dt` comes from a real clock, not
   from `PUMP_MS`, and the pump deliberately uses `baseSleep` rather than
   `this.sleep` (which multiplies by `SPEED_SCALE` and `timeScale`). Under `speed: 'skip'`
   the waits collapse to zero and almost no wall-clock time passes, so the e2e and critic
   captures consume almost no ATB — they keep behaving as they do today.
3. **A background tab cannot wipe the party.** `MAX_STEP_MS` clamps a throttled timer or a
   long GC pause; without it, switching tabs for ten seconds would deliver ten seconds of
   enemy turns in one step.
4. **Ordering stays exact at any pump period.** `tick()` already sub-steps to the next
   scheduled event (`engine.ts:203-232`), so `PUMP_MS` affects only render smoothness and
   how promptly an enemy action interrupts — never the order or the outcome.
5. **Animations freeze the clock** (§3.2), because `play()` is awaited inside the loop and
   the next step's `dt` is measured after it returns... **and this is the one trap**: `dt`
   must be measured from a `last` timestamp that is **reset after `play()` returns**, or the
   whole animation's duration is handed to the engine in the next step, i.e. the exact
   opposite of the intended freeze. Name it in the code comment; §9 has the test.

`now` becomes an optional `PresenterDeps` member (`() => number`, default `Date.now`) so
tests can drive a fake clock. `BattleScreen` passes nothing and gets `Date.now`.

**Where the code goes.** `src/battle/ffx2/engine.ts` is already **479 lines** and
`src/engine/BattlePresenter.ts` **508** — both over the 400-line house rule (DEV.md "House
rules") before this change. Do not grow them: put the input-owner and `throughInput`
helpers in a new `src/battle/ffx2/active.ts` and the pump in
`src/engine/BattlePresenterActive.ts`, each with its own header comment. That also keeps
`node tools/orphans.mjs` meaningful (hard rule 4) — both new modules have exactly one
importer.

### 4.6 HUD

- `HudPort.syncGauges?(snapshot: AtbSnapshot)` — optional, additive. The FFX-2 HUD already
  has `renderParty` / `renderEnemies` from a snapshot (`FFX2BattleHud.ts:950-968`); this is
  those two and nothing else. It must **not** go through `sync()`, which also rebuilds the
  guide, the advisor and the enemy-intent slab — and the intent prediction deep-clones the
  board two dozen times (`HudPort.ts`, the `syncVitals` note). A per-frame `sync()` would be
  a frame-rate defect, dressed as a feature.
- **Do not emit an `atb` event per pump step.** Every event is appended to `state().log`
  (`engine.ts:464-473`) and e2e snapshots that log; a per-frame event would bloat it by
  thousands of entries per fight. The engine's existing `readyChanged` `atb` emissions stay
  as they are; the smooth motion comes from `syncGauges`.
- `HudPort.closeCommandMenu?()` — optional, additive; needed so §4.3's invalidation can tear
  the DOM menu down and release the keyboard claim (`src/ui/ffx/cancelClaim.ts`, claimed at
  `CommandMenu.ts:35`). Without it the claim leaks and the pause key stops working — a
  defect we have already paid for once.
- The `ACTIVE — ATB RUNNING` chip becomes **true** with no code change. Its visibility rule
  (shown only while a target cursor is live, `FFX2BattleHud.ts:892`) is **not changed here**:
  that is something Bailey sees, so under hard rule 9 it is an options question, not a
  builder's call. It goes to §12.
- Leave `atbMode` in place, hard-wired to `'active'`. D-009 says Active only; deleting the
  field would be a second change with no player-visible benefit, and the chip's `wait`
  branch is one line that `tests/unit/ui-ffx2-atbmode.test.ts` already covers.

---

## 5. Determinism

### 5.1 The engine stays deterministic

The engine's outcome is a pure function of `(seed, setup, the ordered sequence of
tick amounts and submitted commands)`. Nothing about that changes: `tick` still takes its
milliseconds from the caller, and the RNG is still the seeded `SeededRng`. Active only
changes **who supplies the numbers**.

### 5.2 What *does* change: a human fight is no longer reproducible

Today a human playthrough is reproducible from the seed and the command list, because every
`tick` amount is engine-computed (`decision.nextEventMs`). Under Active, real elapsed time
during input enters the engine, so the same seed and the same commands can produce different
fights. This is inherent to Active and is not a defect, but it must be written down, because
two things depend on reproducibility today: the seeded strategy tests (unaffected, see 5.3)
and any future replay feature (would need the tick stream recorded; out of scope, note it in
the handoff).

### 5.3 Tests and the auto-battler take zero decision time — by construction

`BattlePresenter.chooseCommand` returns **synchronously** when `this.auto` is set
(`BattlePresenter.ts:410-420`): no `await`, so the pump never starts a step and not one
millisecond of ATB is consumed. Therefore:

- every existing FFX-2 unit test, every strategy measurement, every e2e spec and every
  `__pyrefly.autoBattle('intended')` capture is **bit-identical to today** after this change.
  That is the strongest single guarantee available here, and it is what makes a green suite
  mean something rather than merely mean "nothing crashed".
- the 40-seed measurement in §8 gets its "before" arm for free: decision time `D = 0` **is**
  today's behaviour, and proving it identical is the regression test for the engine change.
- tests that want to exercise the pump inject a fake `now` and a fake `sleep`; no real timers.

### 5.4 The two authored numbers

Presentation-only, and they cannot change an outcome (see 4.5 property 4). Label both
`AUTHORED` in code and in the handoff:

| Constant | Proposed | Why |
|---|---|---|
| `PUMP_MS` | 50 ms (20 Hz) | Enough for a bar that also carries a ~100 ms CSS transition; cheap enough that one snapshot build and two row renders per step are invisible in a frame budget |
| `MAX_STEP_MS` | 250 ms | The largest jump a hidden tab, a GC pause or a slow art load may hand the engine in one go |

Both are tuned by looking at the measurement in §8 and at a real capture, never by taste
alone, and neither is a game-data number (hard rule 6).

---

## 6. Every file touched

| File | Change | Contract? |
|---|---|---|
| `src/battle/common/types.ts` | `FFX2BattleEngine.tick(ms, opts?)`; add `inputValid(actorId)`. Both additive | **yes** — needs `docs/CONTRACT-CHANGES.md`, newest first (hard rule 2) |
| `src/battle/ffx2/active.ts` | **new** — `throughInput` sub-step policy, input-owner bookkeeping, the dead-target guard | no |
| `src/battle/ffx2/engine.ts` | `tick` takes `opts`; `nextActor(skipReadyPlayers)`; `inputOwner` set/cleared; `submit` resolves through the owner and refuses an all-dead target set | no (behaviour) |
| `src/engine/BattlePresenterPorts.ts` | `PresenterDeps.now?: () => number` | no |
| `src/engine/BattlePresenterActive.ts` | **new** — the pump, the clamp, the invalidation check | no |
| `src/engine/BattlePresenter.ts` | the `'player-input'` branch calls the pump when the engine offers `tick`; abandon-and-continue on invalidation | no |
| `src/engine/HudPort.ts` | `syncGauges?`, `closeCommandMenu?` — optional, additive | not one of the five contract files, but shared: note it in the handoff |
| `src/ui/ffx2/FFX2BattleHud.ts` | implement both; chip text and visibility unchanged | no |
| `src/ui/ffx2/CommandMenu.ts` | an external close path that resolves/rejects the open promise and releases the cancel claim | no |
| `src/app/screens/BattleScreen.ts` | nothing required (`pauseGate` is already the presenter's `sleep`); pass `now` only if a capture needs a fake clock | no |
| `docs/CONTRACTS.md` | the playback-protocol snippet gains the Active branch and its three rules | doc |
| `tests/unit/ffx2-active-atb.test.ts` | **new** — §9 cases 1-7 | — |
| `tests/unit/ffx-no-active-clock.test.ts` | **new** — §9 case 8, the absence test | — |
| `tests/unit/presenter-playback.test.ts` | pump cases: pause freeze, clamp, animation freeze | — |
| `tests/unit/strategy-ffx2-bahamut.test.ts`, `…-vegnagun-shuyin.test.ts` | a decision-time parameter on the harness; 4-seed regression arms at `D = 0` and `D = 1500` | — |
| `docs/handoff/ffx2-active-atb.md` | **new** — the track note, game case, measurement table | — |
| `docs/target/decisions.json` | D-009 `delivery` → built, once measured | — |
| `docs/handoff/NOW.md` | end-of-session update | — |

**Not touched, deliberately:** any file under `src/data/**` (no numbers change),
`src/battle/ffx/**` (FFX has no clock), `src/ui/coach/**` (onboarding is a following step,
§10), and the FFX HUD.

---

## 7. Evidence that stays reusable

- Round 05's PR-0046 measurement is the **before** state; do not re-measure it, cite it.
- The FFX-2 engine's own suites (`ffx2-engine`, `ffx2-gauges`, `ffx2-chain`,
  `ffx2-statuses`, `ffx2-status-locks`, `ffx2-spherechange`, `ffx2-berserk-zero-rows`) cover
  the mechanics this change does not touch; they must stay green unchanged, which is itself
  evidence (5.3).
- The FFX-2 HUD suites (`ui-ffx2-hud`, `ui-ffx2-atbmode`, `ui-ffx2-command-menu`,
  `ui-ffx2-chain-flourish`) cover chrome that is not being restyled.
- Chapter 4 and 5 art, scenes, audio, prep screens and cutscenes are untouched: the deep
  review may carry their round-05 evidence with a reason, per RUBRIC §4.

---

## 8. Measurement plan

Active makes both X-2 chapters harder — that is the whole point of the mechanic — so the
build is not finished until we can say **how much** harder, with a number, before Bailey is
asked anything.

**Harness.** One parameter added to the two existing strategy harnesses: a modelled human
decision time `D`. At each `'player-input'` decision the driver calls
`engine.tick(D, { throughInput: true })`, plays whatever came back into its own log, and
then submits `intendedStrategy`'s pick. No wall clock, no presenter, no browser — a fake
clock in the only place that needs one, so the measurement is reproducible from the seed.

**Arms.** `D ∈ {0 ms, 1500 ms, 4000 ms}` — 0 is today's behaviour and the control; 1.5 s is
a player who knows the menu; 4 s is a first-timer reading it. Both non-zero values are
**modelled inputs to a measurement, not game data**.

**Seeds.** 40 contiguous seeds (1…40) per chapter per arm, plus the four canonical seeds
`[1, 7, 42, 20260916]` the existing tests use, reported separately so the CI arms stay
comparable. 2 chapters × 3 arms × 40 seeds = 240 headless runs; the existing harnesses run a
full Chapter 4 in well under a second, so this belongs in a vitest file gated behind an env
flag (`PYREFLY_MEASURE=1`) rather than in the default suite.

**Recorded per run:** outcome; in-battle seconds (`state().ticks / 3000`, §1.2); player
turns; enemy actions taken; girls alive at the end; KOs suffered; chained hits; strategy
declines; Chapter 4: Mega Flares fired before victory and the Break stacks reached;
Chapter 5: which link the run ended on.

**Reported as** one table, before and after side by side:

| Chapter | D | wins / 40 | median s | worst s | player turns | enemy actions | KOs |
|---|---|---|---|---|---|---|---|

**The two predictions to check, not assume.** Bahamut's countdown advances on *his own
turns* (`src/battle/ffx2/ai/bahamut.ts:66`), so more of his turns per player turn means Mega
Flare arrives after fewer player actions — Chapter 4 should get harder in a specific,
measurable way. And §1.7's ~2 s chain window means chained-hit counts should fall as `D`
rises. If neither moves, the pump is not doing what this document says it does.

**Acceptance.** `D = 0` must reproduce today's results **exactly** (same outcomes, same
turn counts) — that is the regression gate. For `D = 1500` and `D = 4000` there is no pass
mark set here: the numbers are reported to Bailey. If a win rate collapses, the answer is
**never** to weaken a boss or retune a number
(`~/.claude` memory "boss-side fix needs measured options", and hard rule 6); it is to bring
Bailey measured options on the player's side — the advisor, a shorter path through the menu,
a readable ready-chime — and let them choose.

---

## 9. Acceptance cases

Unit, with a fake clock, unless marked. Each is written so it can fail.

1. **Ticks advance while the Chapter 4 menu is open.** A driver shaped like the presenter's
   loop, a HUD double whose `chooseCommand` never resolves, a real `FFX2Engine` on
   `ffx2-bahamut`: advance 2000 ms of fake clock through the pump and assert
   `state().ticks` rose by ≈ `msToTicks(2000)` (±1 sub-step) and that at least one gauge
   moved. Mutation check: with `throughInput` false the test must go red.
2. **The same, at Chapter 5** (`ffx2-vegnagun-shuyin`), because it has parts, a chain of
   links and a head with its own clock.
3. **An enemy acts while the menu is open.** Same driver, long enough for a ready enemy:
   assert an `action-start` event for an enemy id arrived while the menu promise was
   outstanding, and that the menu was still open afterwards (i.e. §3.3's hit-closes-menu rule
   is **not** implemented).
4. **The command reaches the girl whose menu was open.** Two girls ready; the menu belongs to
   the higher slot; the lower slot becomes ready mid-input; submit; assert the `turn-start`
   and the action belong to the menu's owner. This is §4.2, and without the input-owner lock
   it fails today.
5. **A queue of ready girls is deterministic.** Three girls ready: assert the offered order is
   `actorOrder` (party by slot) and that each gets exactly one menu before any enemy that was
   ready at the same moment acts twice.
6. **An invalidated menu closes.** KO the owner mid-input (Stop, and a chained action lock, as
   a second and third case): assert `inputValid` goes false, the presenter calls
   `closeCommandMenu`, no command is submitted, and the loop continues to the next decision
   without tripping `LIVELOCK_SPINS` or `INPUT_STREAK_LIMIT`.
7. **A dead target does not eat the turn** (§4.4 answer (a)): kill the only chosen target
   during input, submit, assert the turn was not spent and a fresh menu was offered.
8. **FFX absence test** (hard rule 14, CHK-021): the FFX engine exposes no `tick`, and the
   presenter's pump is inert for it — with an FFX engine and a HUD double that never answers,
   advance 5000 ms of fake clock and assert **zero** events and an unchanged CTB clock.
9. **Pause freezes the ATB**: with the pump running, hold the `pauseGate`; assert ticks stop
   and resume on release.
10. **The clamp holds**: hand the pump a 10 000 ms jump from the fake clock; assert at most
    `MAX_STEP_MS` reached the engine in that step.
11. **An animation does not pay the clock** (the §4.5 trap): make `play()` take 3000 ms of
    fake clock; assert the next pump step feeds the engine ≈ `PUMP_MS`, not 3000 ms.
12. **Browser, for the deep review, not for this preflight**: real input at Chapters 4 and 5,
    `PYREFLY_BROWSER=gpu`; read `__pyrefly.snapshotState()` ticks with the command menu open
    at t0 and t+2 s and show them differing, with the FFX control unchanged; one screenshot
    each under `docs/screenshots/` showing a gauge mid-fill with the menu up.

---

## 10. Order of work

1. Engine: `active.ts`, `throughInput`, the input owner, `inputValid`, the dead-target
   guard. Cases 4, 5, 7 green. `npx tsc --noEmit` clean, `node tools/orphans.mjs` unchanged.
2. Presenter: `BattlePresenterActive.ts` and the branch change. Cases 1, 2, 3, 6, 8, 9, 10,
   11 green.
3. HUD: `syncGauges`, `closeCommandMenu`, the CommandMenu close path.
4. Measurement (§8), written into `docs/handoff/ffx2-active-atb.md`. **Commit here** — this
   is one coherent green piece.
5. Browser pass (case 12) and screenshots.
6. Then, and only then, a **separate** change: switch onboarding back on
   (`ONBOARDING_LIVE = true`) and restore the C3 badge to the mockup's words, which the
   onboarding note says is owed once the clock is real. Its own commit, its own line in the
   release note; it is not part of the combat-core change and must not be reviewed as one.
7. Deep review before going public (`critic-plan` says DEEP: `live + focused + deep`).

---

## 11. Settled here, before code is written

1. Do **not** implement the hit-closes-the-menu / damage-perturbs-the-bar rules (§3.3).
2. The dead-target answer for this build is **refuse and reopen** (§4.4 (a)).
3. `submit` must resolve through the input owner, never through `nextActor()` (§4.2).
4. Gauges are re-rendered through a new cheap `syncGauges`, never by emitting `atb` events
   per frame and never through `sync()` (§4.6).
5. New code goes in two new modules; `engine.ts` and `BattlePresenter.ts` are already over
   the 400-line house limit and do not grow (§4.5).

## 12. Questions for Bailey (neither blocks the build)

1. **Does Active include "an enemy hit closes the open menu and delays that character"?**
   Already asked on 2026-09-21 and still open in NOW.md. This build leaves it out; the §8
   measurement will say what it would cost if it goes in.
2. **Should the `ACTIVE — ATB RUNNING` chip be visible whenever a command menu is open,
   rather than only while a target cursor is live?** With a real clock the chip is the one
   thing that tells a player time is passing, but it is something Bailey sees, so it wants
   an options round (hard rule 9) rather than a builder's decision.

*(Noted, not asked yet: `resolve.ts`'s auto-retarget — §4.4 (b) — if the refuse-and-reopen
answer turns out to feel wrong in the browser pass.)*

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| A command executes as the wrong girl (§4.2) | **critical if missed** — silent, and it corrupts a fight | Case 4, written before the presenter work |
| The menu owner is KO'd mid-input and the loop hangs or spins | critical | `inputValid` + `closeCommandMenu`, case 6; the `LIVELOCK_SPINS` and `INPUT_STREAK_LIMIT` guards are asserted in that case, not just relied on |
| The pump hands the engine an animation's whole duration (§4.5 trap) | major — silently doubles the difficulty | Case 11 |
| A hidden tab or a stall delivers seconds of enemy turns at once | major | `MAX_STEP_MS`, case 10 |
| Per-frame `sync()` instead of `syncGauges` tanks the frame rate in Chapters 4-5 | major | §4.6; the 60 fps at 1600×900 target is a rubric platform goal and the deep review measures it |
| Chapters 4 and 5 become unwinnable for a real human | major, and **expected to some degree** | §8's measurement, reported to Bailey before anything is tuned; never a boss-side change |
| The cancel claim leaks when a menu is closed from outside | major — the pause key stops working, a defect we have already paid for | `closeCommandMenu` releases it; case 6 |
| A replay/record feature becomes impossible without a recorded tick stream | minor, future | Written into the handoff (§5.2) |
| The `atb` event log bloats e2e snapshots | minor | No per-frame events (§4.6) |
| Deep review is owed and the release runner refuses a shared-system deploy without a passing deep report | process | Planned as step 7; `tools/critic-plan.mjs` already says DEEP |

---

## 14. Verdict

**PROCEED.** The decision is the owner's and is recorded (D-009). The mechanic is sourced
well enough to build the part we are building, and the part that is not sourced well enough
is named and left out. The change is small in surface (two new modules, one option on
`tick`, two optional HUD methods), it is measurable before and after with a harness we
already have, and the auto-battler's zero decision time means the entire existing FFX-2 test
body stays valid as a regression net rather than needing to be re-argued.

The one thing that would turn this into a REPAIR is skipping §8: shipping Active without the
before-and-after numbers would change how both X-2 chapters play and leave nobody able to
say by how much.
