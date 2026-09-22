# Paper preflight: the Active ATB menu keeps its owner, and the Config ATB speed lever

Paper preflight under `critic/RUBRIC.md` §4 / AGENTS.md rule 15, written **before** any
product code. Track: `ffx2-active-menu`. Answers critic round 08 **PR-0076** (chapter 5's
intended line 40/40 → 0/40 at any human decision time) and **PR-0080** (the open command
menu is replaced in place by another girl's list in 262 ms, no keypress), the HOLD on the
next candidate. Written 2026-09-22 by a sub-agent of the orchestrator.

**Verdict: PROCEED**, in three separate commits so the HOLD fix never waits on the
save-data review (§6).

## 1. Game case (rule 14)

| Piece | Case | Why |
|---|---|---|
| Chain-locked owner keeps her command; the open menu keeps its owner | **FFX-2 only** | The clock under an open menu is FFX-2 Active (`research/ffx2-combat-core.md` §1.5, D-009). The lock is §1.7 *"A chained target cannot start executing its own action"* `[verified: 2 sources]`. FFX is CTB, has no clock under a menu and no chain lock; `activeClockEngine()` returns `null` for it (`tests/unit/ffx-no-active-clock.test.ts`). |
| ATB speed lever (engine) | **FFX-2 only** | §1.2 `tickRate(... cfg)`: *"Config ATB speed multiplies the global rate: Slow 0.746x, Normal 1x, Fast 1.262x"*; "ATB Mode and Speed" is an FFX-2 Config entry (`research/ffx-vs-ffx2-presentation.md:278`, single source). FFX's CTB has no tick rate to scale. |
| The `ATB SPEED` pause row | **FFX-2 only** as a row; the options list is shared pause plumbing | Printed only when the pause is over an FFX-2 chapter. |

## 2. What is true today (read from the code, then measured)

- `inputStillValid` (`src/battle/ffx2/active.ts`) is `canTakeTurn && awaitsPlayerInput`, and
  `canTakeTurn` fails on `isActionLocked`. So the instant an enemy hit chains the owner,
  the pump (`runActivePump`) returns `'invalidated'`, the presenter calls
  `closeCommandMenu` and `nextDecision()` opens the next ready girl's list in the same
  place, cursor at row 0. That **is** PR-0080's 262 ms swap, and it is four in five of
  PR-0076's lost menus (`{"chain-lock": 75, "ko": 14, ...}`, handoff `ffx2-active-atb.md` §2).
- `nextDecision()`'s owner preference is `canTakeTurn(owner)`, so even the engine's own
  answer moves the owner to someone else while she is chained.
- Golden hashes recorded on the unchanged engine (this session, `D = 0`, seeds 1-20 per
  chapter, sha256 of every link's event log): pinned in `tests/unit/ffx2-atb-golden.test.ts`.

## 3. The engine change (`src/battle/ffx2/active.ts`, `engine.ts`)

1. **`ownsInput(unit)`** in `active.ts` = ready, `canAct`, not an enemy still thinking — i.e.
   `canTakeTurn` **without** the chain lock. `inputStillValid` uses it: a chained owner's
   menu stays valid. KO, Stop, Sleep, Petrify, Berserk and battle-over still invalidate
   (those owners genuinely cannot answer; unchanged).
2. **`nextActor`'s owner preference** uses `ownsInput`, so `nextDecision()` keeps naming the
   owner while she is chained. Only `submit` or the owner losing `ownsInput` clears it.
3. **`submit` on a chained owner holds the command**: `held = { actorId, command }`,
   `inputOwner = null`, no events, turn not spent yet. Order of guards is unchanged in front
   of it: an owner who cannot answer is refused, an all-dead target set is refused; then
   the lock check holds.
4. **The held command fires when the lock lifts**, as its owner and nobody else:
   - `nextActor(skipReadyPlayers)` does not skip the held girl (she is not awaiting input,
     she has a command), so under the Active pump it fires in the first sub-step after the
     window closes and the pump plays it like an enemy turn;
   - in a Wait-mode `tick` and in `nextDecision`, a ready player who is the held girl fires
     it (`resolved`) instead of stopping for input.
   - It fires through `beginTurn` + `performCommand`, exactly the ordinary submit path.
   - **Dropped, not fired**, if by then she cannot act (KO, Stop, Sleep, Petrify), is
     Berserked (§2.8 takes control), or every target is gone (then she simply gets a fresh
     menu, turn not spent — the §4.4 (a) rule the Active track already ships).
   - A held timed-input command (Trigger Happy, Lady Luck reels) resolves with the engine's
     seeded default (`rollDefault`), because an overlay cannot suspend a running clock
     mid-pump. Rare, and flagged for Bailey in the handoff rather than decided silently.
5. `heldCommand()` — read-only query for tests and the measurement.

No new event type, no `BattleState` field, no save shape: `held` lives on the engine beside
`inputOwner`. Nothing in `src/battle/common/types.ts` changes for the fixes.

## 4. The presenter (`src/engine/BattlePresenterActive.ts`)

No new control flow is needed: the pump already stops only on `settled` or
`!inputValid(owner)`, and `inputValid` no longer fails on a chain lock. The module comment
and `PumpStop` doc are corrected (chain lock is no longer an invalidation). `BattlePresenter.ts`
is not edited. No HudPort change: another ready girl already shows as a full ATB row.

## 5. Invariants and the tests that pin them (each fails on today's code first)

`tests/unit/ffx2-active-menu.test.ts`, real `FFX2Engine`, real chapter 4/5 data, seeded, no DOM:

- **I1** A chain-locked owner's submitted command survives the lock and executes as her,
  once, when the lock lifts (Active pump path and Wait path).
- **I2** `inputOwner` of an open menu never changes without a submit: with every girl ready
  and the owner chained, 3 s of `throughInput` ticks, `nextDecision()` names the owner at
  every 50 ms step while `ownsInput` holds.
- **I3** A held command is dropped (never fired, never fired as someone else) when its owner
  is KO'd before the lock lifts; no turn is spent.
- **I4** Through the real `BattlePresenter`: owner chained with other girls ready, the HUD's
  `chooseCommand` is called once, `closeCommandMenu` never, and after the answer her
  `turn-start` lands on her.
- **I5** `D = 0` golden: chapter 4 and 5, 20 seeds each, event logs byte-identical to the
  pre-change hashes.

## 6. The Config ATB speed lever

- `Ffx2EngineOptions.atbSpeed?: 'slow' | 'normal' | 'fast'` (default `'normal'`) and
  `FFX2Engine.setAtbSpeed()`. Multiplier = §1.2's own expression: `0.53 / 0.71`, `1`,
  `0.53 / 0.42` (0.7465 / 1 / 1.2619), in `constants.ts` with the citation.
- **What scales** (game ticks per real ms): the one global game clock — ATB, CTIM and
  RECTIM gauges, status clocks and Regen/Poison payouts, §1.7's chain windows, AI clocks.
  §1.2 says the Config multiplies *the single global tick rate*, §2.8's 0.71 / 0.53 / 0.42
  s-per-unit constants are exactly that rate change seen on durations, and `chain.ts` runs
  the windows on the global clock. Only elapsed battle time stays real ms.
- **Revised during the build, and why.** The first draft kept the chain window at 2 real
  seconds at every speed. Measured, that made Slow a *balance* change: chapter 5 at zero
  decision time fell from 40/40 to 37/40, because a shorter window in game time breaks
  chains. A player-side speed setting must not re-tune the boss fight, and the research
  names one global rate, so the whole clock scales as one: at any speed the fight is the
  same fight in game time and only the real time per game second changes. Whether retail
  scales the chain window with the Config is still **not sourced**; this is the reading
  that adds no second clock, and it is written down as an open question.
- Byte-identity at Normal: every new multiply/divide is by exactly `1`, which IEEE-754 leaves
  bit-identical; proven by I5 plus a golden at `D = 1500` recorded after the fixes and
  before the lever.
- **Persistence**: `Settings.ffx2AtbSpeed?` in `src/app/SaveData.ts`, **optional, no
  migration**, read as `?? 'normal'`, written through `save.setSettings` exactly like the
  volumes. **Touching `SaveData.ts` puts this commit in the save-data class**
  (`critic-plan` → deep review **before** deploy). Hence the separate commit: the two fixes
  can ship on a focused review without it.
- **Row**: `ATB SPEED` · SLOW / NORMAL / FAST, Left/Right step, in the pause OPTIONS column
  only when the pause is over an FFX-2 chapter (`optionsColumns` gets the game). The engine
  is built with the stored speed and re-told on resume from the pause. A visible row is
  something Bailey sees (rule 9): it reuses the existing row style, no new layout, and is
  flagged for his yes in the handoff.

## 7. What could regress in chapters 4 and 5, and how it is checked

| Risk | Check |
|---|---|
| Any replay at `D = 0` moves | I5 golden; `strategy-ffx2-*` suites; the measure's `D = 0` arm still 40/40 |
| A held command lands on the wrong girl | I1, I3, and the existing "never executes as a different girl" presenter case |
| A held girl blocks the pump (livelock) | she is skipped while locked, fires when free; the pump suite and the 40-seed arms would spin |
| Existing Active tests assumed chain-lock invalidation | read and kept; KO / Stop / Berserk / battle-over still invalidate |
| Speed lever changes Normal | I5 + the `D = 1500` golden with `atbSpeed: 'normal'` explicit and omitted |
| Pause row shows in FFX | pause test: FFX options have no `ffx2AtbSpeed` row |

Acceptance (critic's): re-run `PYREFLY_MEASURE=1 tests/unit/ffx2-active-measure.test.ts`;
chapter 5 at `D = 1500` should clear on a majority of seeds with `D = 0` still 40/40.
Whatever it measures is reported as measured, not as hoped.
