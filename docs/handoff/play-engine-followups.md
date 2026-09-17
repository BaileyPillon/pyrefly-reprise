# Play: engine-followups

Key: `engine-followups`. Scope: `src/battle/ffx/**`, `src/battle/ffx2/execute.ts`,
`src/engine/BattlePresenterTactics.ts` + the new `src/engine/tactics/`, and
tests under `tests/unit/`. No data file, no build config, no `src/scenes/**`,
no `public/art/**`.

Four things: three engine defects reported from outside the engine, and a
refactor that splits the per-chapter tactics into one file per chapter so five
agents can work in parallel. The refactor is **behaviour-preserving and
measured** — see "Before / after" at the bottom.

---

## 1. Every party-switch row was disabled [ffx-combat-core §1.7]

`src/battle/ffx/commands.ts` built each Switch row with `enabled: isAlive(bench)`,
and `isAlive` (`state.ts`) is:

```ts
c.alive && !has(c, 'ko') && onField(c)
```

`onField` is `!c.removed && !has(c, 'eject')`, and `removed === true` is exactly
what being on the bench *means* — `setup.ts` builds a reserve member with
`removed: !active`. So the predicate could never be true for a benched member
and **every Switch row the engine has ever offered was disabled**. Four of the
seven guardians could not enter a battle.

### The rule

§1.7: "Switch is a rank-3 command … the incoming reserve member **takes the
turn that is happening right now** … Any reserve member may be swapped in at
any point; all seven can therefore participate."

The only member who may not is one who cannot take that handed-over turn: a
KO'd, petrified or ejected body would be handed an open menu it could never
close. §1.7 also notes that a shattered character "removes one bench slot
permanently for that battle".

### The change

- `state.ts`: new `canSwitchIn(c)` — `c.alive && !ko && !petrify && !eject`,
  with a comment saying in as many words why it is not `isAlive`.
- `commands.ts`: the row is gated on `canSwitchIn` and carries
  `disabledReason: 'Unable to fight'` when it is off.
- `execute.ts`, `case 'switch'`: the engine also refuses a switch to a member
  who cannot fight, returning `rejected` so the turn stays open rather than
  being burned. `commands.ts` already disables the row; this is the engine
  refusing a command that should never have arrived.

Nothing about the swap itself changed: the incoming member still inherits the
outgoing member's CTB counter and still takes the current turn (`handOffTo`).

---

## 2. A bare re-submit of a timed Overdrive asked forever [docs/CONTRACTS.md]

`docs/CONTRACTS.md`, "Minigame protocol", has two halves. The engine emits
`minigame-request` and **stops**; the UI re-submits the *same* command with the
outcome attached as `extra`. And: "If `extra` is absent — AI, auto-battle, a
deterministic test — the engine rolls a default outcome from the seeded RNG and
never emits a `minigame-request` at all."

The FFX engine only implemented the first half for a *player* actor. When the
same command came back **bare**, `execute.ts` emitted the request again, and
again — a presenter probe re-picked Spiral Cut 19,916 times without the battle
advancing one tick.

### The change (FFX)

`src/battle/ffx/execute.ts`, the `command.kind === 'overdrive'` branch:
`ctx.rt.pendingMinigame` now carries the `abilityId` as well as the actor and
the minigame kind, and a bare submit that matches the *suspended* request is
read as "nobody is going to play this overlay" — the engine rolls the outcome
with `rollDefaultMinigame` from the seeded RNG and resolves the Overdrive. The
gauge is spent, which is what actually stops the loop.

Backing out is still backing out: submitting anything other than an Overdrive
clears the pending request at the top of `executeCommand`, and picking a
*different* Overdrive opens its own overlay, because the match is on the
ability id and not just the minigame kind.

The presenter's workaround stays compatible — a presenter that re-submits bare
now gets a resolved turn instead of a request.

### The change (FFX-2)

`src/battle/ffx2/execute.ts` already suppressed the request whenever anything
was awaiting (`needsMinigame`'s `if (env.getAwaiting()) return false`), so the
loop could not happen there — but that blanket suppression also swallowed the
overlay for a *different* timed action chosen after backing out of one. It is
now scoped the same way FFX's is: a bare re-submit of the **same** action rolls
the default; a different action opens its own overlay.

### Tests

- `tests/unit/ffx-engine-followups.test.ts` — asks once, then rolls; 50
  consecutive bare submits produce exactly one request; backing out to Attack
  re-opens the overlay next time; the rolled outcome is reproducible from the
  seed.
- `tests/unit/ffx2/minigame-resubmit.test.ts` — the same five properties for
  Trigger Happy, plus Attack Reels opening its own overlay after a back-out and
  `minigames: false` never asking at all.

---

## 3. FFX Sensor and Scan were inert [ffx-combat-core §9]

`docs/handoff/fix-ffx2-sensor.md` fixed this for FFX-2 and recorded, read-only,
that "FFX is not equivalent — it is broken in the same way, and in two places".
Both are now fixed.

§9: **Sensor** "Reveals target's current/max HP, elemental affinities and
statuses. **No combat effect.**" **Scan** is a rank-3 action [§1.3] and, being
pure information, is `canMiss: false` in the data.

### The change

New `src/battle/ffx/sensor.ts`, deliberately mirroring `src/battle/ffx2/sensor.ts`
so the shared `'sensor'` event means the same thing in both games:

- `sensorKind(def)` — FFX's own marker is the **`scan` status** the ability
  applies (that is how `special-utility.ts` encodes Scan). An explicit
  `extra.reveals` marker wins over it.
- `revealTarget(...)` — emits `'sensor'` and latches `Combatant.revealed`.
  `full: true` is the Scan panel, `full: false` the one-line Sensor bar.
  `immune-to-scan` blocks a full reveal as an `'immune'` miss; `immune-to-sensor`
  and `flags.hideHpBar` keep the numerals hidden while still announcing the
  enemy — X-2's own "- - -" row.
- `revealForSensorAuto(ctx)` — the passive half. Runs when any **active** member
  wears the `sensor` auto-ability.

Wiring:

- `abilities.ts` — after the hits have landed, a Scan-type ability reveals its
  targets. A reveal rolls nothing (no accuracy, no crit, no variance), so it
  **cannot move the seeded RNG by one draw**; that is load-bearing and the
  chapter bench below proves it empirically.
- `engine.ts` `advance()` — the passive sweep, so it lands at battle start.
  Deliberately *not* in `buildBattle`: `init()` runs before the first
  `nextDecision()` clears the buffer, so anything emitted during setup would
  reach `state().log` and never reach the presenter.
- `execute.ts` `case 'switch'` — and again on switch-in, because the bench is
  where a Sensor is usually parked [§1.7].

`FFXRuntime.sensedIds` records which enemies the passive bar has already been
printed for. It is **not** `Combatant.revealed`: an `immune-to-sensor` enemy is
announced with no numerals and deliberately stays unrevealed, so latching
`revealed` on it would hand the HUD numbers the fight is keeping back.

Both readers were already written and dead: `BattlePresenterEvents.ts`
`case 'sensor':` and `src/ui/ffx/FFXBattleHud.ts` `case 'sensor':` → `SensorPanel`.

---

## 4. The tactics split (no behaviour change)

`src/engine/BattlePresenterTactics.ts` was a 695-line module that only one
chapter could be edited in at a time. It is now a **thin re-export**, and the
logic lives in:

| Chapter | File |
|---|---|
| 1 — Seymour Flux | `src/engine/tactics/seymour-flux.ts` |
| 2 — Lady Yunalesca | `src/engine/tactics/yunalesca.ts` |
| 3 — Braska's Final Aeon / Yu Yevon | `src/engine/tactics/braskas-final-aeon.ts` |
| 4 — Bahamut | `src/engine/tactics/ffx2-bahamut.ts` |
| 5 — Vegnagun / Shuyin | `src/engine/tactics/ffx2-vegnagun-shuyin.ts` |

plus `src/engine/tactics/common.ts` (the reading helpers: `row`, `aim`, `has`,
`stacksOf`, `hpFraction`, `activeParty`, `revive`, `hasAeonLeft`, `cheerUp`,
`holdOverdrive`) and `src/engine/tactics/index.ts` (the registry and
`tacticFor`).

Yunalesca's module is the old code moved, not rewritten: same constants, same
order of rules, same `bestOverdrive` / `nextAeon` lists. The only edit inside it
is the comment about the free switch, which said the switch rows were all
disabled — true before item 1 above, false now. The tactic still does not
switch, deliberately: the 392/400 line is the one the research documents and
every rule below it is tuned against the three actives it names. A switch rota
is a new tactic to be measured on its own, not a free win to be assumed.

**The four chapters with no line yet export `null`, not a tactic that returns
`null`.** The difference is load-bearing: `intendedStrategy` reads a *registered*
tactic's `null` as "swing" and skips its own revive/heal ladder — that is the
whole point of a tactic overriding the generic rules. Registering an empty one
would have quietly changed how four chapters play. `index.ts` filters the nulls
out of `TACTICS`.

### Before / after — Chapter 2, same seeds, same build

| | Before | After |
|---|---|---|
| `tests/unit/strategy-chapter2.test.ts` seed 1 | victory, 408 decisions, 3 forms | victory, 408 decisions, 3 forms |
| seed 7 | victory, 336 decisions | victory, 336 decisions |
| seed 42 | victory, 452 decisions | victory, 452 decisions |
| seed 20260916 | victory, 414 decisions | victory, 414 decisions |
| seeds 1–40 | 39 wins (loses 13) | 39 wins (loses 13) |
| `critic/scratch/bench-ch2.test.ts`, seeds 1–400 | **392/400 = 98.0%** | **392/400 = 98.0%** |
| losing seeds | 13, 65, 81, 126, 171, 242, 349, 379 | 13, 65, 81, 126, 171, 242, 349, 379 |

Identical to the decision count and to the loss list, which is the strongest
statement available that the switch fix, the Sensor reveal and the module split
left the seeded stream untouched.

(`bench-ch2.test.ts`'s `console.log` is swallowed by this vitest build under
`critic/scratch/vitest.scratch.config.ts`; the numbers above were read back by
running it under a throwaway config with a setup file that tees `console.log`
to a file. The before column was measured with an equivalent harness driving
the same `intendedStrategy` over the same seeds, and its loss list matches
`bench-ch2`'s after column exactly.)

---

## Verification

- `npx tsc --noEmit` — clean.
- `npx vitest run` — **69 files, 2442 tests, all passing.**
- New: `tests/unit/ffx-engine-followups.test.ts` (14 tests),
  `tests/unit/ffx2/minigame-resubmit.test.ts` (7 tests).

Every claim above was produced by running the engine. Nothing was established
by grepping for it.

## Left for someone else

- **Confuse is never cleared by physical damage** despite the status data
  saying it is. It is the whole of Chapter 2's remaining 8/400 losses. Outside
  this task's scope (`src/battle/ffx/statuses.ts` reaction path).
- The four placeholder tactic modules are empty by design. Each chapter's agent
  writes its own, citing its research file the way `yunalesca.ts` does.
- A **switch rota** for Chapter 2 is now actually playable and unmeasured. It
  should be benched against the 392/400 baseline before it is adopted.
