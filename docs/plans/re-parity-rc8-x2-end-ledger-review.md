# Paper preflight: RC8, FFX-2 item ledger and battle-end commit window (lane `re-parity-rc8-x2-end-ledger`)

> AGENTS.md rule 15, `critic/RUBRIC.md` §4: paper only, written before the build. The change set is under `src/battle/ffx2`, which the
> 2026-10-11 wiring plan classes **DEEP** (every lane of it); nothing here deploys without Bailey's own words.
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please";
> 2026-10-13/14 "so it can go in live builds asap", "keep going please, please incorporate all of your findings into our game". The
> addendum marks all three slices "Bailey first: no" (numeric parity; disclose, no yes needed).

Written 2026-10-15 for branch `re-parity-rc8-x2-end-ledger`, cut from `origin/r48-rc` (`ea431aa0`).

## 1. Game case (AGENTS.md rule 14)

**FFX-2 only**, all three slices. FFX has its own bag (`src/battle/ffx/kernel/bag.ts`, `deduct.ts`), its own end-of-battle machine
(FFX-G10) and a CTB battle with no ATB queue; nothing here is read from FFX, and nothing under `src/battle/ffx`, `src/data/ffx` or
`src/audio` is touched. Sources: `D:\Tools\ffx-parity\coverage\ffx2\FFX2-G10.md` sections 1 (items 4, 5), 10, 11, 16 and
`FFX2-G06.md` sections 1 to 4 and 7, both checked under the method check on 2026-10-11 (FFX-2.exe, Steam build 25501027).

## 2. What changes, in the order built

| Slice | Game rule (note, label) | Engine today | After |
|---|---|---|---|
| **XK-petrify** | the evaluation `0x61EF70` counts a monster that is in battle, present, not dead and not Death only if it is not Petrified (G10 10.1, E 20,000) | `results.ts#battleOutcome` counts a Petrified, not-dead enemy as standing, so an all-stone enemy side never ends the fight | `battleOutcome` treats a Petrified enemy as defeated, as it already does for the girls (PR-0145) |
| **XF1 item ledger** | an item leaves the stock when the command is queued (reserve `0x620D90`); every way out of the queue refunds, capped at 99 (`0x620C00`, flag 1); the start gate `0x6314C0` is the only commit; monsters never reserve (G06 1, 3.3 to 3.7, E 357,509, 0 draws) | `execute.ts` decrements `inventory:<id>` when the action resolves; a second girl with the menu already open could take the last one | reserve when the command is picked (before the charge begins), commit where the item is spent today, refund when a charge is dropped, cancelled, interrupted or the battle ends |
| **XK2 commit window** | the end is evaluated every step but committed only when every queue and magic execution has drained; a revive or Auto-Life before the commit cancels it; an ejected girl is alive but not in battle; all-stone enemies count as defeated; parts gate unless out of battle or not present (G10 10.1, 10.2, E 20,000 x 3) | `checkBattleEnd` ends the battle on the first evaluation after a step or an action | a new kernel (evaluation, commit machine, step-tail decision) and an engine window: menus close, nothing new starts, charges in flight resolve, then the end is committed or lapses |

## 3. Decisions made on paper (each one is a stand-in or a boundary, not a game number)

1. **Result codes and story flow are not changed (XK3 is gated).** The kernel returns the game's four codes. The adapter maps 1 and 3 to
   the engine's existing `defeat` and 2 and 4 to `victory`; `escape` is not produced. Result 3 (an ejected or escaped girl, none left in
   battle) therefore ends the fight exactly as it ends it today (`defeat`: today's `partyAlive` already drops a removed girl). What the
   events do with result 3 is unread (G10 open questions 11 and 12).
2. **Parts are fed to the evaluation as "not present".** The kernel implements "parts gate unless out of battle or not present", but how
   the game's scripts take the Leg's Nodes and the Experiment's parts out of the evaluation was not traced (G10 open question 9, rule 6), and the
   engine's standing rule is that parts never gate victory (`results.ts` header; the Leg's Nodes carry 300,000 HP). The adapter keeps that rule by
   marking every `isPart` unit not present.
3. **What "queued" means in this engine.** A command is queued from its pick; one with no charge resolves in the same call (reserve and commit
   together, the old behaviour), one with a charge holds its reservation on the unit until the cast fires (commit), is dropped by Stop,
   Petrify, ejection, a KO or a dress change, or is cancelled by a magic cancel (refund). Holds are released by one sweep per step and per action, so
   no cancel path has to know about the stock. The window counts a charge in flight, a command held for a chain lock, a suspended timed input and a
   command in its action time; it does not count an owner who is asleep, petrified or Stopped (the game's own exclusion, G06 3.5, G10 10.2).
4. **No new draws.** The ledger and the window spend none (G06 section 5: 0 draws in 357,509 vectors; G10: none in the evaluation or the
   machine). The stream registry (`adapt/streams.ts`) gets a line saying so and a test pins that the rng is untouched.
5. **Gil stays as it is.** The kernel reserves gil as the game does, but the engine never fills a gil amount (no picker exists, XF2), so
   `resolve-strike.ts` keeps spending a Bribe at the strike and Spare Change stays free. No screen is touched.

## 4. Acceptance cases

1. XK-petrify: a Petrified last enemy ends the fight (`victory`); a Petrified enemy beside a standing one does not; a part never gates.
2. XF1: two girls pick the last Phoenix Down: the second cannot (the menu shows 0 at once; a forced submit is refused, the turn is not spent);
   a KO, a Stop, a dress change and a magic cancel each give the item back (cap 99); a cast that fires keeps it spent; the battle's end refunds a
   cast that never fired; a monster never touches the party's stock. Kernel: vector subsets of the stock, reserve, refund, gate and queue
   functions replayed against the harness oracles.
3. XK2: kernel evaluation (2,000+ of the 20,000 harness vectors), commit machine (every start phase, every branch signature) and step tail replayed
   exactly, calls included. Engine: the last enemy falls while a girl's cast is in flight: the cast resolves first, the end is committed after; a
   revive that lands inside the window cancels the end; a charge of a sleeping or petrified girl does not hold the window; a defeat waits for an
   enemy's cast in flight; the window closes menus and starts nothing new; `badEnding` still ends a fight.
4. Independent oracle for the engine tests: the Python models of the notes' harness (restated in the test, not imported from the engine).
5. Mutation pass: a handful of one-line faults (cap 100, refund on commit, no refund on drop, window ignores the drain, window never lapses,
   parts gate) each make a named test fail.
6. `tsc --noEmit` clean; the three goldens (`ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden`) pass or are re-baselined with the cause written in the
   test file; `node tools/orphans.mjs` shows both kernels reached; every source file under 400 lines.
7. Measurement: 12 seeds on every FFX-2 chapter (the seven listed plus the Experiment, the Tourist Trap and Valefor), 500 seeds on IV, V, VI, XI,
   XIII, XV, XVI: wins, defeats, party turns, KOs, item use per fight, the seeds whose event log moved and why, and the window's own counters.

## 5. Base, order and size

Cut from `origin/r48-rc` (the live line plus RC7). Order: XK-petrify (its own commit), XF1 (kernel and fixtures, then the wiring), XK2 (kernel and
fixtures, then the wiring), goldens, handoff. `engine-core.ts` is 396 lines: the window goes into new modules (`adapt/battle-end.ts`,
`end-window.ts`) and the sweep into `adapt/item-ledger.ts`; `execute.ts` (309) and `atb-engine.ts` (351) take only a few lines. Shared contracts
(`docs/CONTRACTS.md`) are not changed; the new unit field and the new engine methods are internal to `battle/ffx2` (not on the `FFX2BattleEngine`
interface).

## 6. Risks

- The window changes event logs wherever a cast is in flight at the end of a fight (a few hundred events on some seeds); the goldens move and the
  outcome measures must not (a win stays a win unless a cast that was cut off would have changed the outcome, which is the point).
- A chain-lock hold, a minigame overlay or a long cast could hold the window longer than the game's timing would; a generous step cap guards a
  hang (an engine safety, not a game number) and the measurement counts how often it is reached (expected: never).
- `settleGauges` drops a Stopped or Petrified girl's charge at once, where the note reads the game as leaving the record queued until a KO or the
  battle's end (G06 3.7, [R]); the refund timing differs (the ledger refunds at the drop), the stock a player sees is the same at the end of the
  fight. Not changed here (it belongs to the animation lane, X2-A).
