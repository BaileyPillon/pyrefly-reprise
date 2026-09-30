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

## Check (independent, 2026-09-30, on 58f333a0)

Verdict: **no blocker.** The Fail and Immune rows resolve exactly as the sourced tables say, a
success is byte-identical to f80e116c, and a real-key Swordplay timeout in the browser deals the
number the engine gives. Three majors below, none of them a regression against live.

**Engine, before and after (rule 3).** A probe played Chapter II (Yunalesca, the real
`setupForChapter` board, seed 1): the others Attack, and Tidus or Auron fires each Overdrive on
their second turn. It ran twice, once with f80e116c's `shapeOverdrive` swapped back in through
`vi.mock`. The log before the Overdrive is identical in every run.

| Overdrive | success (old = new) | fail, new (old) | immune, new (old) | recovery, fail vs success | source row (§5.3 / §5.5) |
|---|---|---|---|---|---|
| Spiral Cut | 1729 | 1297 (1729), 0.750 | n/a | same | 32 x 1 / fail 24 x 1 |
| Slice & Dice | 6 hits, 1916 | 3 hits 417/430/440 (6 hits) | n/a | same | 6 x 6 / fail 8 x 3 |
| Energy Rain | 1404 | 1080 (1404), 0.769 | n/a | same | 26 x 1 / fail 20 x 1 |
| Blitz Ace | 8 hits | same 8 hits | n/a | +39 vs +47 ticks | 7 (fail 6), 4 x 8 (+24 x 1) / fail 4 x 8 |
| Dragon Fang | 1919 | 1807 (1919), 16/17 | 2145, 19/17 | same | 17 x 1 (immune 19) / fail 16 x 1 |
| Shooting Star | 2710 | 2710 | 3049, 27/24 | same | 24 x 1 (immune 27) / fail 24 x 1 |
| Banishing Blade | 3162 | 3162 | 3388, 30/28 | same | 28 x 1 (immune 30) / fail 28 x 1 |
| Tornado | 2259 + 2232 | 1694 x 1 hit (2 hits) | unchanged | +44 vs +54 ticks | 7 (fail 6), 20 x 2 / fail 15 x 1 |

The quoted sources: §5.3, "Success selects the "success" action row; timer expiry selects the
distinct weaker "fail" row", and §5.5, "Failure (timer expiry) resolves the "(Fail)" row". Both
tables are marked `[verified: 2 sources]`. Every number in the table matches its row, and no data
file changed in the diff.

- **Hit rule:** 0 misses in all 32 runs. `rowFromExtra` spreads the success record, so
  `canMiss: false` survives, and the diff adds or changes no `canMiss` guard.
- **Determinism:** the same seed run twice gives the same full event log (Spiral Cut fail and
  Tornado fail).
- **Layering:** `git diff f80e116c..58f333a0 -- src/battle` adds no import at all, and no RNG
  draw.
- **FFX-2:** no file under `src/battle/ffx2` or `src/data/ffx2` changed.
- **Rule 7:** `overdriveShape.ts` is 118 lines and the new test is 176.
- **Goldens:** f80e116c's `ffx-engine-golden.test.ts` passes 18/18 with the old shape swapped
  in. With the new shape, the only two that fail are `braskas-final-aeon` seeds 1 and 7, which
  are exactly the digests that were re-pinned.
- **The new tests:** 21/21 pass. Against the old `shapeOverdrive`, 10 fail. The builder counted
  11; the difference is because my swap kept the new `rowFromExtra`.
- **Gates:** `tsc --noEmit` is clean. The full `vitest run --testTimeout=60000` passes: 694 files,
  5 skipped, 10505 tests. `node tools/orphans.mjs` shows 24 orphans, unchanged.

**Browser (real keys).** Headless Playwright (`PYREFLY_BROWSER=gpu`) against the vite dev server
on 5337, stopped by PID afterwards. The setup was Chapter II at seed 1, with Tidus's gauge set to
100 through the debug API. The rest was real keys: the others Attack, then Tidus picks Overdrive,
Spiral Cut and the target.

- **Timeout.** No key pressed, so the timer ran out. The engine received
  `{success:false, timeRemainingMs:0}`, and Yunalesca took **1297**. That is the same event as
  the engine probe's fail run (field for field), where a success deals 1729.
- **Wrong press.** Enter was pressed about 6 ms into the overlay. The engine received
  `{success:false, timeRemainingMs:2994}`, and the hit dealt **1944**. See major 1.

**Majors (disclosed; not introduced by this commit's code, not a regression against live):**

1. **A Swordplay mis-press is a failure, and it still earns the timing bonus.** The overlay
   resolves on the first press. §5.3 rule 1 (`[verified: 2 sources]`) says "A miss is not a
   failure": the sweep restarts, and only timer expiry fails. Now that the Fail row is wired, an
   early wrong press resolves the Fail row. `timingBonusFrom` also keeps the remaining time for a
   failed `tidus-timing`; PR-0267 zeroes it only for Bushido. So a wrong press at about 6 ms (1944)
   out-damages a correct press made with 200 ms or less left (1786, or 1729 at 0 ms).
   - On live the same wrong press dealt 2564, so the candidate narrows the inversion and does not
     add it.
   - Fix options (FFX only): make the overlay restart the sweep on a miss and report a fail only at
     expiry, or zero the bonus on a failed Swordplay as PR-0267 did.
2. **A single wrong Bushido press ends the sequence.** `research/visual-bible.md` §3.11.2 says
   "wrong inputs end the attempt", while ffx-combat-core §5.5's authored shipping rule is "a wrong
   press is ignored". Both are unsourced authored rules and they conflict: Bailey's call.
   - With the Fail row wired, one wrong press now costs Dragon Fang 16/17 of its damage.
   - It would cost Tornado 15 x 1 against 20 x 2, but no shipped build unlocks Tornado.
3. **A failed Blitz Ace now beats a successful one: same damage, turn back sooner.** The success
   finisher (row 274, 24 x 1) is still unwired (still-open item 1 above). With fail rank 6 now
   wired, a failed Blitz Ace deals the same 4 x 8 and comes back 8 ticks sooner (+39 against +47).
   - No shipped build unlocks Blitz Ace, so this cannot happen in play today. It should be fixed
     together with the finisher.

Still open items 2 and 3 above were confirmed by reading the code: nothing publishes
`targetImmuneToRider`, and the Fail row keeps its rider.

Scratch: `D:/Tools/pyrefly-scratch/2026-09-30-rel35/odfail-chk-*` (probe JSON, browser logs,
JPEG frames). The probe files are parked in `F:/pyrefly-parked/2026-09-30/r34fix-odfail-check/`.
No server is left running.

Game case: **FFX only**, for the same reason as above.
