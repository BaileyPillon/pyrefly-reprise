# r34fix-odfail: the FFX Overdrive Fail rows are wired (FFX only)

Branch `r34fix-odfail`, built on `r17fix-combat` (f80e116c) so PR-0267's rule
(a failed Bushido gets no timing bonus) stays in place. Not pushed, not deployed.

## What was wrong

r17fix-combat's independent check found that `extra.failPower` / `failHits` /
`failRank` / `immunePower` / `immuneHits` in `src/data/ffx/abilities/overdrive-tidus.ts`
and `overdrive-auron.ts` were read by nothing. `shapeOverdrive`
(`src/battle/ffx/overdriveShape.ts`) only followed an `extra.failAbilityId` /
`immuneAbilityId` that no shipped record sets, so a failed Swordplay or Bushido
resolved the success row.

Proved by running the engine (rule 3), before the fix: an Overdrive command with the
minigame outcome attached (the path a player's input takes), seed 1, fixture board of
two 99 999 HP dummies:

| Overdrive | success | fail (before) |
|---|---|---|
| Spiral Cut | 1 hit [470] | 1 hit [470] |
| Slice & Dice | 6 hits [93,85,93,94,86,92] | the same 6 hits |
| Energy Rain | [382,408] (2 targets) | the same |
| Blitz Ace | 8 hits, rank 7 | the same, rank 7 |
| Dragon Fang | [265,267] | the same |
| Shooting Star | [374] | the same |
| Banishing Blade | [436] | the same |
| Tornado | 2 hits x 2 targets [311,313,318,319], rank 7 | the same, rank 7 |

The immune flag (`sequence.targetImmuneToRider: true`) changed nothing either.

## The sources (rule 6)

`research/ffx-combat-core.md`:

- §5.3 Swordplay: "Success selects the "success" action row; timer expiry selects the
  distinct weaker "fail" row." Table: Spiral Cut 32 x 1 / fail 24 x 1; Slice & Dice 6 x 6
  / fail 8 x 3; Energy Rain 26 x 1 / fail 20 x 1; Blitz Ace rank 7 (fail 6), 4 x 8 then a
  final 24 x 1 (row 274 "Last Hit") / fail 4 x 8. Note: `[verified: 2 sources]` (rows,
  ranks, DmgCon from the decompile; hit counts from Fandom *Swordplay (Final Fantasy X)*).
- §5.5 Bushido: "Failure (timer expiry) resolves the "(Fail)" row. A third "(Immune)" row
  exists for targets immune to the Overdrive's rider status, with a higher DmgCon
  compensating for the lost effect." Table: Dragon Fang 17 x 1 (immune 19) / fail 16;
  Shooting Star 24 (immune 27) / fail 24; Banishing Blade 28 (immune 30) / fail 28;
  Tornado rank 7 (fail 6), 20 x 2 (row 273, which is its immune row, §11 C15) / fail 15 x 1.
  Note: `[verified: 2 sources]` (rows/DmgCon from the decompile; hit counts from Fandom
  *Bushido (Final Fantasy X)*, cross-checked against Jegged and SuperCheats).

## The fix

`src/battle/ffx/overdriveShape.ts`: new exported `rowFromExtra(def, 'fail' | 'immune')`
builds the row from the record's inline fields: DmgCon, hit count and, where the table
gives one, rank. Everything else is the success record's, `canMiss: false` included
(hard rule 5); the fail row drops Blitz Ace's success-only finisher keys. `shapeOverdrive`
uses it when a record has no `failAbilityId` / `immuneAbilityId` (those still win when
present). Pure engine, no DOM, no `three`, no RNG draw added (rule 1). The presenter only
sees the resulting events.

After the fix, same runs:

| Overdrive | success | fail (after) | immune flag (after) |
|---|---|---|---|
| Spiral Cut | [470] | [353] (x 24/32) | n/a |
| Slice & Dice | 6 hits | 3 hits [125,114,125] (8 DmgCon) | n/a |
| Energy Rain | [382,408] | [293,313] (x 20/26) | n/a |
| Blitz Ace | 8 hits, tick 70 | same 8 hits, tick 60 (rank 6) | n/a |
| Dragon Fang | [265,267] | [249,251] | [295,298] |
| Shooting Star | [374] | [374] (fail = success DmgCon) | [420] |
| Banishing Blade | [436] | [436] (fail = success DmgCon) | [467] |
| Tornado | 4 hits, tick 70 | 2 hits [233,234] (15 x 1 per target), tick 60 | unchanged (no immune row) |

A success is unchanged: the new tests compare each success with the same record stripped of
its Fail/Immune fields and get identical events and forecast.

## Tests and gates

- `tests/unit/ffx-overdrive-fail-rows.test.ts` (new, 21 tests): fail vs success for all
  four Swordplay and all four Bushido records (hit count, DmgCon ratio, no miss events),
  Blitz Ace and Tornado fail rank 6, the three Immune rows, Tornado's missing Immune row,
  PR-0267 still holding, four success-unchanged regressions, `rowFromExtra` itself. Run
  against the old `shapeOverdrive`, 11 of them fail.
- `tests/unit/ffx-engine-golden.test.ts`: Chapter III (Braska's Final Aeon) digests re-pinned.
  Cause, proved by a probe that wraps `shapeOverdrive` during the golden run: the line's
  auto-rolled Energy Rain fails once in link 6 of seed 1 and once in link 6 of seed 7 and
  now deals 20 DmgCon instead of 26. Every outcome stays victory. With the fail wiring
  stubbed out, the golden file is 18/18 on the old values. No other chapter's digest moved.
- `npx tsc --noEmit` clean; full `npx vitest run --testTimeout=60000` green after the
  re-pin; `node tools/orphans.mjs` 24 orphans, all old, none added.

## Still open (not changed here)

1. **Blitz Ace's success finisher is not wired either.** `extra.finisherPower` /
   `finisherHits` (row 274, 24 x 1) are read by nothing, so a successful Blitz Ace deals
   only 4 x 8, exactly like a failed one except for the rank. Sourced in §5.3 (the 8 + 1
   hit count is `[single source]`, §11 C14). This changes success damage, which this brief
   said to leave alone, so it needs its own fix.
2. **Nothing sets `targetImmuneToRider`.** The Immune rows are selected only when the
   minigame result carries the flag (`MinigameResult` contract). `minigameParams` never
   publishes it and `AuronSequence` only passes it through, so in play the Immune row is
   still unreachable. The engine cannot decide immunity itself without a rule the sources
   do not give: for Banishing Blade (four Breaks), is it immunity to any or to all four?
   For Dragon Fang (all enemies), is the row chosen per target or per action? Bailey's
   call, or more research.
3. **Does a Fail row still carry the rider?** The sources do not say whether a failed
   Shooting Star still tries Eject, a failed Banishing Blade still lands the Breaks, or a
   failed Dragon Fang still does its weak Delay. The fail row keeps the success record's
   statuses and flags (behaviour unchanged). The same goes for crit eligibility.

## Game case

**FFX only.** Swordplay and Bushido are Tidus's and Auron's FFX Overdrives. The rows live in
`src/data/ffx/abilities/` and the code in `src/battle/ffx/`, which the FFX-2 ATB engine never
imports. `research/ffx-vs-ffx2-presentation.md` says nothing about Overdrive fail rows, and
the FFX-2 research mentions Overdrives only as FFX cross-references (for example
`ffx2-combat-core.md` §3.11 on Mix). So the sources do not state it outright; FFX-2 has no
Swordplay or Bushido to apply it to.

Scratch: probe outputs in `D:/Tools/pyrefly-scratch/2026-09-30-rel35/odfail-*.txt`; probe
files parked in `F:/pyrefly-parked/2026-09-30/r34fix-odfail/`.
