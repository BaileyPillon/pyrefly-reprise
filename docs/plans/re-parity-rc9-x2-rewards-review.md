# Paper preflight: RE parity RC9, lane X2-C, FFX-2 kill rewards

> AGENTS.md rule 15, `critic/RUBRIC.md` section 4. `node tools/critic-plan.mjs --paths src/battle/ffx2/results.ts,src/battle/ffx2/resolve-hp.ts` classes this as DEEP (the FFX-2 ATB engine is a
> shared system). Paper only: nothing here deploys.
>
> **Owner's words.** 2026-10-08: "It needs to be a 1:1 parity." 2026-10-15: "keep going please all of this reverse engineering needs to be incorporated into our game" and "keep going please full speed
> ahead". The plan's decision Q9 (accepted as recommended): "results screen: mockup first, then yes", so the rules are wired and today's results screen is kept; the per-girl lines are a screen item.

Written 2026-10-15 by the lane's sub-agent. Branch `re-parity-rc9-x2-rewards` on `origin/r49-rc` (f939b87f). Lane X2-C of `D:\Tools\ffx-parity\coverage\wiring-plan-draft-2026-10-11.md`; the source is the private
decompile note FFX2-G03 (213,000 emulator vectors, 0 mismatches) and the game's own monster rows.

## 1. Game case (AGENTS.md rule 14)

**FFX-2 only.** FFX has its own kill-reward routine (`battle/ffx/kernel/drops.ts`), its own rules and no EXP. No file of `src/battle/ffx`, `src/data/ffx` or `src/audio` changes. The shared files touched are
`battle/common/types.ts` (additive: one row type, one ledger type, one optional result field) and `docs/CONTRACT-CHANGES.md`.

## 2. What changes (the plan's nine rows, XC1 to XC9)

1. **A kill pays when it happens** (the KO resolution, not the victory): EXP, gil, AP and the item roll go into a ledger on `BattleState.ffx2Rewards`; `buildResult` reads it. A monster still standing
   when the battle is won pays nothing (the Vegnagun Leg's three Nodes, 24,000 EXP and 9,000 gil that the build used to pay); a monster killed twice pays twice. A girl's own knock-out runs the same
   routine with an empty row and takes the same stream-10 draw (the game's behaviour; it moves later steals).
2. **Drops are the game's rolls** (XC1 to XC3): one draw on stream 10 always, a drop when `(draw mod 255) < drop byte + best chain + current chain + 64 per Item Hunter owner`, then a draw on stream 11
   picks the rare slot when `(draw and 255) < 32 x m + chains` (m = 8 with Butterfingers). The two Bulwarks stop paying both items; the goons, the Bulwarks and Logos (Act III) drop on bytes 128 and 192;
   the rare slots of Shiva, Sandy, Cindy, Paragon, Trema, the Oversoul, the arena Trema, the Nodes and the Bulwarks are their own items. The best chain is tracked per unit.
3. **Per-girl EXP and AP** (XC4, XC5): each present, not ejected girl gets the full EXP (Double EXP doubles only hers, none under Pointless); a girl dead or Petrified when the battle ends loses what she
   gained; AP is credited per girl (x2 Double AP, x3 Triple AP, x6 both, none under Pointless) into a pool capped at 99 for the battle. Not wired: the spending of that AP into the worn dressphere's
   abilities (the build's data keeps one banked number per dressphere, not the AP held per ability and a learn target; "decompiled, not wired", documented).
4. **Gil** (XC6): the row's gil x2 for each Gillionaire owner. Pilfer Gil stays on the results line as today (see 6).
5. **The reward ability bits** (XC7): read from the girl's ability words (`unit.autoWords`, which the X2-B lane builds from her ladder and her garment grid's tags); the grid tags for Double AP, Triple AP,
   Butterfingers, Gillionaire, Double Items, Double EXP and Item Hunter are added to the tag table.
6. **Data** (XC8, XC9): the reward bytes of every shipped monster are read from `monster.bin` with our own reader and laid on the enemy data as numbers (`data/ffx2/monster-records/kill-rewards.ts`, row
   cited, pinned to a fixture the reader wrote); the Syndicate records that differed (Ormi in Act I, Ormi and Logos in Act II) are fixed.

## 3. Kernel and seams

`kernel/kill-rewards.ts` (new, pure): the item function, the roll with its owner modifiers, the AP gain, the end-of-battle rollback; replayed against 535 stratified emulator vectors
(`tests/fixtures/parity/ffx2/kill_rewards.json`). `adapt/kill-rewards.ts` (new): the units as the kernel's terms and the item-id table. `kill-rewards.ts` (new, engine side): the ledger and `payKill`.
Seams: `resolve-hp.ts` (one call at the knock-out, before the chain breaks), `resolve-status.ts` (an Eject by a command other than Steal Will or Bribe pays), `chain.ts` (the best chain),
`results.ts` (`buildResult` reads the ledger). Streams 10 and 11 are the steal streams (`Ffx2FixedStream.Steal`, `StealSlot`), already in the registry.

## 4. Acceptance cases

1. The kernel against the vectors, the note's worked examples by hand, and a hand mutation pass.
2. The data against the reader's fixture; every enemy of every chapter paid by a row.
3. An engine-level test with an independent oracle: real knock-outs through the engine's own path on a real group, expectations written from the note's rules (not from the kernel), the draws tapped
   (stream 10 once per knock-out, stream 11 once per drop), a standing monster paying nothing, a revived monster paying twice, a fallen girl losing her EXP and keeping her AP.
4. 12 seeds on every FFX-2 chapter and 500 on the chapters that move (before/after totals of EXP, AP, gil and items per chapter); the goldens (`ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden`)
   pass or are re-baselined with the cause written in the test file; the whole suite once.

## 5. Risks

- **Standing monsters pay nothing** moves the Vegnagun chain's totals (the Leg link). It follows from the game's rule (the roll runs in the KO resolution); the fight never kills the Nodes, and the core's
  death entry writes HP 0 to the Bulwarks without a KO routine (FFX2-G05 row 9). Disclosed in the handoff; a named constant is not offered because the rule is the game's.
- A girl's knock-out takes a stream-10 draw, which moves later steals, Pilfer Gil and Bribe rolls on the same seed. The seeded goldens move once, with the cause written.
- `engine-core.ts` is at 396 lines: no line is added there (the ledger rides on the state).

## 6. Not done, on purpose

The results screen (per-girl lines, the AP number), the AP spending into abilities, the flee/teardown trigger (G03 open question 2), the pay-nothing death kinds of scripted departures (8), the stats
refresh's draws (10), the self-kill command (12), the pods of a Special dressphere as owners (4). Pilfer Gil stays on the results gil line as today: the game banks it in the wallet at once and the
results show only the kill gil, a screen item for Bailey.
