# r37-lady-luck: paper preflight (critic-plan class DEEP after deploy)

Backlog key `BR-LADY-LUCK-REELS`. **Game case: FFX-2 only** (Lady Luck is X-2's dressphere; the reels share no rule with
Wakka's Slots in `src/battle/ffx/reels.ts`, and nothing under `src/battle/ffx` or `src/battle/common` behaviour changes except
one additive optional field). Source: `research/ffx2-combat-core.md` §3.12 `[verified: 2 sources]`, §2.3 (the Dud), §2.9.1.

## What changes, and what could go wrong

| Change | Failure it could cause | How it is bounded |
|---|---|---|
| Reel wrappers resolve to a payload (`reels.ts`, `execute.ts`) | An unattended spin used to be a no-op; it is now a Dud 90 % of the time (six symbols a reel) | Only a girl who chooses Attack/Magic Reels reaches it. No shipped line or autopilot does (measured, `docs/handoff/r37-lady-luck.md`); the Dud cannot kill (`noChain`, 75 % of *current* HP) |
| `AbilityCommand.extra`, `attachedResult` accepts `'ability'` | A human's Trigger Happy count, thrown away before, now reaches the engine | One field, optional; the bare path is unchanged |
| A charged `minigame-request` is parked and answered (`BattlePresenter`, `BattlePresenterActive`) | A stuck overlay, a menu that never comes back, a reel answered by the wrong girl | `suspendedActor` keys the answer to the girl who asked; the pump's new `interrupted` dep closes the open menu and the loop re-offers it; test `ffx2-lady-luck-active.test.ts` is red on the old code |
| Status-only action on an immune target emits `miss/immune` (`resolve-targets.ts`) | A new event in every FFX-2 chapter's log (Break, Bio, Tantalize against bosses) | Events only: no roll moves, no state moves. The full suite and the Chapter 4/5 strategy suites are the check |
| Pay table data (`src/data/ffx2/reels.ts`, five payload records) | An unsourced number | Every row is §3.12 / §2.9.1 / §3.9; estimates are labelled in the data file (CT tiers, Auto-Life targeting, re-aiming) |

## What is not ported

Reflect's bounce (§2.8), which commit `946918c69` also carried: a separate sourced rule, not named by this item.

## Review asks (deep, after deploy)

1. A human at the reels in Chapter V and Via Infinito, Wait split and Active: overlay opens once, once only, after the charge;
   the spin names itself (`Dud!` or the payload); the command menu that was open comes back.
2. Chapter 4 and 5 strategy suites unchanged (the old commit measured 40/40 and 40/40 chains; re-measured here).
3. CHK-020/021: the case is written (FFX-2 only) in the handoff, the CONTRACT-CHANGES entry and every commit.
