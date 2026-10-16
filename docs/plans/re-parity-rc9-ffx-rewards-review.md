# Paper preflight: RE parity RC9, FFX kill rewards by the game's own rolls (lane FFX-M, row M1)

> `critic/RUBRIC.md` section 4, AGENTS.md rule 15: paper only, written before the build. The engine paths touched are `src/battle/ffx/**` (the death handler, the results), so `node tools/critic-plan.mjs` classes it DEEP; nothing here deploys.
>
> **Owner's words.** 2026-10-08: "It needs to be a 1:1 parity."; 2026-10-15, to the RE session: "keep going full speed ahead" and "all of this reverse engineering needs to be incorporated into our game". For this area the accepted answer
> (addendum `wiring-plan-addendum-2026-10-13.md`, Q14, recorded by the release driver as the RE session's reading of his instruction): **YES** for items, gil and AP as the game's rolls, after a before/after table of item totals; **NO** to gear drops.

## 1. Game case (AGENTS.md rule 14)

**FFX only.** FFX-2 has its own kill-reward routine (lane X2-C: its own exe, its own `kill-rewards` rules). Nothing in this lane is shared with FFX-2 except the `BattleRng` plumbing, which it only uses.

## 2. What changes

| Today | After |
|---|---|
| `results.ts#collectRewards` sums every dead enemy's AP, gil and drops when the battle is won, rolling a percent chance per drop on the engine's side stream (`BattleRng.aux`) | each monster's death pays at once, into a reward struct (`rt.rewards`), by `kernel/drops.ts#rollDrops` on the game's streams: **10** (the two item slots' chance rolls and the gear roll), **11** (the rare entry after a success); `results.ts` only reads the struct |
| an `ItemDrop` list with a percent or none; the older code doubled the quantity on an overkill | each shipped monster's loot record as numbers (`data/ffx/loot/records.ts`, 43 records read from `FFX_Data.vbf` and checked against FFX-H02's table): two slots, a common and a rare item each, the overkill list, the chance bytes |
| AP: the battle's AP total for every member who acted | the 18 slots' running totals (`kernel/ap-award.ts#awardAp`: Double, Triple, No AP by the state of the member at each kill) and the exit's settle left as the engine's existing rule (`earnedAp` gives nothing to a member who never acted or is dead or petrified at the end, which is what FFX-G10 row 9's `settleAp` restores) |
| gil: no multiplier | the Gillionaire multiplier (2 while a living member in the battle wears it) |
| Distill: none | the Distill bit a Distiller or Extract leaves on a monster turns its drop into the matching sphere (`ActorRuntime.distill`) |
| Bribe: not in the engine | the bribed-monster branch (two draws on the killer's stream) is wired to `ActorRuntime.bribed`, which nothing sets until the Bribe command exists |
| Sinspawn Gui: the arms' first deaths banked in `state.flags` when they grow back | no bank: every death pays at once, as the game does |

Kept as they are: the results screen and `BattleResult` (no new field), gear drops (M2: the gear roll's one stream-10 draw is made so every later steal roll stands where the game's would, a hit is only counted; no piece is made and
streams 12 and 13 are not drawn), the Bribe command, the items' bag.

## 3. Acceptance cases

1. The kernel replays the capped vectors already in `tests/fixtures/parity/ffx/drops_*.json` (unchanged) and a new fixture of the real records' rolls.
2. Data: all 43 records equal an independent read (the FFX-H02 table) field by field; every shipped monster's `ap`, `apOverkill`, `gil` and `drops` are the record's; every item a record can drop has an item row.
3. Engine, with an independent oracle (the test restates the roll from the notes and reads only the draws the engine made): AP per slot, gil with and without Gillionaire, both item slots, the rare entry, the overkill list, Distill, the bribed branch, ejected
   monsters, the draw order on streams 10 and 11, no draw on 12 or 13, a dry run that does not pay the battle's ledger.
4. A mutation pass of about 20 faults in the adapter, the hooks and the data is caught.
5. 12 seeds on every FFX chapter: the same outcomes as before (the only draws that move are 10 and 11, which `steal.ts` shares). 500 seeds: item, gil and AP totals per chapter before and after.

## 4. Base, order, risks

Base `origin/r49-rc` f939b87f. Order: the data and its tests, the adapter and the hooks, the engine-level test and the mutation pass, the goldens, the suite, the measurement, the handoff.
Risks: (a) the draws on 10 and 11 move every steal that follows a kill in the same battle (stated, measured); (b) a monster that is removed without a KO or an Eject would pay nothing (the engine has none: `aeons.ts`, a switch and the Anima's
departure remove party members or a body that already died); (c) the stacking of equal items changes the shape of `BattleResult.drops` (one entry per item, as the game's list), not what the results screen prints (it already adds equal ids).
Rollback: the lane is one branch; the data table and the adapter are new files, the hooks are two calls in `hp.ts`.

## 5. Open on the paper

Where the game adds a battle's item stacks to the stock was not found (FFX-G10 open question 1): the claim is "paid to the results" only. The Bribe command, the gear drop and a results layout for per-member AP are not this lane's.
