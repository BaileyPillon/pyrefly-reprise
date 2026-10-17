# Paper preflight: RE parity RC10, lane X2-minigames (Trigger Happy with no presses, Lady Luck's Dud and Two Dice)

> **WRITTEN AFTER THE BUILD, OWED BY RULE 15.** AGENTS.md rule 15 asks for a 5-to-10-minute paper preflight *before* a change that `critic-plan --paths` classes as deep is built. This one was
> not written first. The build (commits `78912b7cc` to `e79ddb237` on `re-parity-rc10-x2-minigames`) came first and this page was written on 2026-10-17 afterwards, at the request of the
> lane's independent check. Read it as a review of the finished change, not as the plan the change followed.
>
> `node tools/critic-plan.mjs --paths <the 11 changed source files>` (run 2026-10-17 at `e79ddb237`) says **DEEP**: "FFX-2 ATB engine is a shared system" for `adapt/command.ts`,
> `dice.ts`, `execute.ts`, `kernel/die.ts`, `minigames.ts`, `resolve-strike.ts`, `resolve.ts` and `simulate.ts`; systems FFX-2 ATB engine and FFX-2 game data; obligations live + focused + deep.
> The deep review is owed on the live build after the deploy (`critic/RUBRIC.md` §4); it is not a save-data change.
>
> **Game case (rule 14): FFX-2 only.** Trigger Happy (Gunner) and Lady Luck's Dud and Two Dice exist only in FFX-2 (command rows `0x3032`, `0x31E5`, `0x30EB`, `0x317D`, `0x317E` of FFX-2's
> `command.bin`). Nothing under `src/battle/ffx`, `src/data/ffx` or `src/audio` changes; `ffx-engine-golden` and `ff7-golden` do not move.
> **Owner's words:** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game".
> Details and proof: [docs/handoff/re-parity-rc10-x2-minigames.md](../handoff/re-parity-rc10-x2-minigames.md).

## 1. The change

Three corrections to FFX-2 minigame commands, each read from FFX-2's own code and data (private working notes FFX2-H05 and FFX2-H04, rows S10, E8 and E10 of the gap scan of 2026-10-17):

1. **Trigger Happy with zero presses plays no shot** (S10). The press count used to reach the hit determination as its *override*, where 0 means "no override", so a window nobody pressed in played the row's 60 hits.
   It now travels as `StrikeOptions#shots`; zero shots plan zero hits. One or more presses are byte for byte what they were.
2. **The Dud has no element** (E8). The game's row `0x31E5` carries none; the engine's carried gravity. Every girl now takes the same 75 percent of her current HP, and the damage event carries no element.
3. **Two Dice rolls its dice** (E10). It was a command that did nothing. It now rolls two dice with the game's own face generator (`kernel/die.ts`), plays as many hits as the sum (2 to 12), swaps to the
   row `0x317D` (power 4) on a pair of 2 to 6 and to `0x317E` (power 40, two hits) on two ones, costs 4 MP, never misses, is aimed at one enemy and charges the row's 100.

Files: `adapt/command.ts`, `dice.ts` (new), `execute.ts`, `kernel/die.ts` (new), `minigames.ts`, `resolve-strike.ts`, `resolve.ts`, `simulate.ts`, `data/ffx2/abilities/lady-luck.ts`, `data/ffx2/command-records/{index,lady-luck}.ts`.
No contract file is touched (`TriggerHappyResult` already says "Range 0 to 16").

## 2. Who can see it

The first version of the handoff said no player can reach this. That was wrong. It is true only of the **automated line** (the shipped intended strategy, which never casts these rows). A human reaches it:

| Change | Who sees it | Where |
|---|---|---|
| Trigger Happy, zero presses | a human Gunner who presses nothing | wherever Yuna (or another girl) wears Gunner, Chapter IV included |
| The Dud's element and its hit burst (generic impact becomes the white slash burst) | a Lady Luck wearer whose reels land on a Dud | Chapters V, XI, XIII, XV, XVI and the Tourist Trap |
| Two Dice (now 2 to 12 hits per cast, each with its hit cue; charge 100 where it was the old tier of 26, about 3.85 times longer; enemies only) | a Lady Luck wearer who picks it | the same chapters, no row disabled |
| Attack Reels and Magic Reels | unchanged by this lane, listed because they spin the Dud | the same chapters |

The automated line replays **byte for byte**: 12 seeds on all 12 FFX-2 chapters, 144 of 144 event-log digests identical, base against tip. That says nothing about what a human sees. Nobody has watched the Two Dice
sequence, the longer charge, the enemy-only picker, the Dud's new burst or the empty Trigger Happy; the tests and the harness read the event log. **The release driver should look at each.**

## 3. The random stream

Every draw this change makes is on the engine-side stream `rng.aux` (`BattleRng.aux`), which cannot move any game stream (the 68 FFX-2 streams are untouched).

- **Two Dice's face generator is not a battle stream.** The game's walk is global to the effect module and other effects draw from it, so where in its 185-value cycle a battle's first dice land cannot be known.
  The engine places it uniformly with **one draw `rng.aux.int(0, 184)` at the first dice roll of a battle** (`dice.ts#generatorOf`), keeps the walk's state in `state.flags.dieGenState`, and takes no further draw
  for the rest of the battle. An ability that rolls no dice (everything but Two Dice) takes no draw and sets no flag. This is a modelling choice, not game data; the cycle (185), the transient (1,412 calls) and the faces are the game's.
- **Pinned after the independent check.** A mutant `aux.int(0, 90)` (half the cycle) survived the first mutation pass. `parity-ffx2-two-dice.test.ts` now asserts the range directly (`[0, 184]`, one call, none on
  the next roll), that each of the 185 positions gives a distinct generator equal to the game's walk that many calls into the cycle, and that 4,000 battles on real streams reach all 185. The mutant now fails two tests.
- **Trigger Happy** draws nothing new. The 6 to 16 stand-in for a headless player still draws from `aux` as before.
- **The advisor's preview** (`simulate.ts`) never rolls: it quotes 3, 7 and 11 hits for Two Dice and 6, 11, 16 for Trigger Happy, draws nothing and holds no generator.

## 4. Risks

| Risk | State |
|---|---|
| A shipped chapter's line changes | Measured: it does not (144 of 144 identical). The change runs only when Trigger Happy fires, a Dud or Two Dice resolves, or the advisor previews Two Dice. |
| A game stream moves | No: the one new draw is on `aux`; `ffx2-atb-golden` passes unchanged. |
| Two Dice is a visible new behaviour no one has watched | **Open.** Hit sequence, 100-cost charge, enemy-only picker. Needs a look before release (handoff §6 items 8 to 13). |
| The Dud's burst changes without a mockup | Disclosed (§6 item 7). It is a one-line presenter special case if Bailey wants the old look; the rule stays. |
| A zero-press Trigger Happy looks broken to a player | It now closes on "0 HITS", plays her action with no shot and passes the turn, the game's own behaviour. Disclosed (§6 item 12). |
| The 6 to 16 headless stand-in, the 16-press cap, the Lv. 2 and Lv. 3 windows, the reels redesign | Left out on purpose (handoff §8); they rest on inferred constants or a visible redesign that needs Bailey's yes (rule 9). |
| The change reaches a save | No: no save schema, no migration. `dieGenState` lives in the battle's flags only. |
| `simulate.ts` is 398 lines | Under the 400-line limit, with no room left; the next change there must split it. |

## 5. Rollback

All of it is in five commits on `re-parity-rc10-x2-minigames` (`78912b7cc`, `7e35fe194`, `94feee793`, `c1acef926` and the handoff), none merged into `main` or a release candidate yet, so before a merge the rollback is **not to merge the branch**.
After a merge, a **revert commit** of those commits (never a reset) restores the old behaviour. The three changes are independent and can be reverted one at a time:

- S10 alone: `78912b7cc` (the `shots` option and its two call sites).
- E8 alone: `7e35fe194` (one data field and its test).
- E10 alone: `94feee793` and `c1acef926` (the dice kernel, `dice.ts`, three records, two abilities and their wiring).

No data migrates, no file format changes and no contract changes, so a revert needs nothing besides the revert and a rebuild.
