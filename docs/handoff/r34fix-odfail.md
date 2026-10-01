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

## od2 (2026-09-30): the Swordplay mis-press and the Blitz Ace finisher (FFX only)

Branch `r34fix-od2`, cut from e942fe11. Not pushed, not deployed. Fixes the Check's majors 1
and 3 (still-open item 1 above). Two commits, one per item.

**1. A Swordplay mis-press restarts the sweep; only expiry fails** (3483de3b). Source,
§5.3 rule 1 `[verified: 2 sources]`: "A miss is not a failure. If the player misses, the
marker will return to its default position (far left of the meter) and start moving again."
"Failure is timer expiry, not a bad press." Rule 3: "timer expiry selects the distinct weaker
"fail" row".

- `src/ui/ffx/minigames/TidusTiming.ts`: a press outside the gold zone puts the cursor back at
  the far left and restarts the sweep; the timer keeps running ("a miss restarts the sweep but
  not the timer"). Only a press in the zone resolves (a success). The timer's expiry always
  sends `{success:false, timeRemainingMs:0}`. Before, a cursor that happened to sit in the zone
  at expiry could even resolve a 0 ms success. The rule itself is pure, in `logic.ts`
  (`pressTidusTiming`, `expireTidusTiming`). The look, the markup and REDUCE MOTION are
  untouched, and so is the engine contract (`MinigameResult`).
- `timingBonusFrom` (`src/battle/ffx/overdrive.ts`) pays 0 ms on a failed `tidus-timing`, as
  PR-0267 does for Bushido, so a fail can never out-damage a success. The file stays at 472
  lines.

| Run (seed 1) | before | after |
|---|---|---|
| Engine, fixture board, Spiral Cut fail with 2 994 ms left | 529 | 353 (= expiry 353) |
| Engine, same board, success with 200 ms / 0 ms left | 485 / 470 | 485 / 470 |
| Real keys, Chapter II, Enter about 15 ms into the overlay | engine got `{false, 2985}`, Yunalesca took **1942** | the sweep restarts, the overlay stays open |
| Real keys, Chapter II, that mis-press then Enter in the zone | n/a (already resolved) | `{true, 2502}`, **2449** (1729 x (1 + 2502/6000)) |
| Real keys, Chapter II, that mis-press then nothing | n/a | `{false, 0}`, **1297** |
| Real keys, Chapter II, no press | 1297 (the Check) | `{false, 0}`, **1297** |

The browser runs used headless Playwright (`PYREFLY_BROWSER=gpu`) against a vite dev server
on 5381, stopped by PID after each run. Setup went through `__pyrefly` (seed 1, Chapter II,
cutscenes skipped, Tidus's gauge set to 100); everything else was real keys: the others
Attack, then Tidus picks Overdrive and Spiral Cut. The "before" run swapped the two old files
in for the run and put the new ones back.

**2. Blitz Ace's success finisher** (9834cba2). Source, §5.3 table `[verified: 2 sources]`:
rows "99 + 274 / 238", rank "7 (fail 6)", success "4 × 8, then a final 24 × 1 (row 274 "Last
Hit")", fail "4 × 8". The 8 + 1 hit count is `[single source]` (§11 C14).

- `overdriveShape.ts`: a new `finisherRow(def)` builds row 274 from
  `extra.finisherPower`/`finisherHits`, with `canMiss: false` and everything else taken from
  the success record. `shapeOverdrive` returns it as `finisher` on a success only. The fail row
  still drops the finisher keys.
- `execute.ts` resolves the finisher after the volley, inside the same action.
- New `ResolveOptions.followUp` (`abilities.ts`, still 419 lines). With it, the finisher does
  not re-pay a per-targeting gauge (Yojimbo, Anima, Isaaru's aeons) or Evrae's targeting
  count. That matches the existing "once per action" comment.
- The finisher shares the action's §5.2 timing bonus. That is a reading: §5.2 applies the
  bonus to the Overdrive's damage, and no source singles out row 274.

Engine, fixture board, seed 1:

- Before: success 8 hits = 484, fail 8 hits = 484 (fail tick 60 against 70).
- After: a success is the same 8 hits plus a Last Hit of 353, 837 in all. A fail is unchanged
  at 484. With 1 100 ms left, a success is 1042 (Last Hit 441).
- This is latent in play, because no shipped build unlocks Blitz Ace.

**Tests**

- `tests/unit/ffx-swordplay-miss-restart.test.ts` (new, jsdom, 12 tests):
  - the pure press rule;
  - the real overlay on a fake clock with real `keydown` events: miss -> restart -> expiry,
    miss -> correct press, and a late miss restarting from the left;
  - `timingBonusFrom` on a fail = 0;
  - for every Swordplay row, a fail deals the same whatever the clock showed and never beats a
    success.

  8 of the 12 fail against e942fe11's overlay and `timingBonusFrom`.
- `tests/unit/ffx-blitz-ace-finisher.test.ts` (new, 7 tests): success = 9 hits with the
  finisher at about 6x a volley hit; fail = 8 hits, the same volley, strictly less; the bonus
  scales the finisher; the other three rows have no finisher; one targeting count per action;
  `finisherRow` itself. 4 of them fail without the fix.
- `ffx-overdrive-fail-rows.test.ts`: the success hit count now adds `finisherHits`.
- Goldens: nothing moved, and none were re-pinned (18/18). Auto-rolled Swordplay fails already
  carry 0 ms, and no golden line casts Blitz Ace.

**Gates:** `npx tsc --noEmit` is clean. The full `npx vitest run --testTimeout=60000` passes:
696 files, 5 skipped, 10524 tests. `node tools/orphans.mjs` shows 24 orphans, unchanged.

**Still open (not changed here; the sources do not settle them):**

1. The Bushido wrong-press rule. `research/visual-bible.md` §3.11.2 says a wrong input ends the
   attempt, while ffx-combat-core §5.5's authored rule is "a wrong press is ignored". Both are
   unsourced, so this is Bailey's call.
2. The Immune rows are still unreachable: nothing sets `targetImmuneToRider`, and the sources
   do not say how immunity is decided.
3. Whether a Fail row keeps its rider, and whether it can crit (unsourced).
4. Seen in passing, not touched: `minigameParams` publishes `travelMs`/`zonePercent` (always
   1400/22), but the overlay reads `zoneHalfWidth`/`speedPxPerSec`. So all four Swordplay
   overlays play with the defaults (360 px bar, ±22 px zone, 340 px/s), and only the timer
   varies per Overdrive. §5.3's per-Overdrive tuning table is `[estimate]` (authored), so this
   is a design question, not a sourced defect. The cursor also ping-pongs at the right end;
   §5.3 describes a left-to-right sweep and says nothing about the end of it.

Scratch: probe JSON, browser JSON and JPEG frames in `D:/Tools/pyrefly-scratch/2026-09-30-rel35/od2/`.
The probe test and the real-key script are parked in `F:/pyrefly-parked/2026-09-30/od2/`.
No server is left running.

Game case: **FFX only**, for the same reason as above.

## Check (od2), independent, 2026-09-30

Checked branch `r34fix-od2` at `eafebb60` in `D:/pyrefly-aeon-hp`; I did not build it. **No
blocker.** FFX only (Swordplay, Blitz Ace and the CTB engine are FFX-only; the diff touches
`src/battle/ffx/**`, `src/ui/ffx/minigames/**`, three FFX unit tests and this note, nothing else).

**Against the source, `research/ffx-combat-core.md` §5.3 (`[verified: 2 sources]`):**
- Rule 1, "A miss is not a failure." Real keys, headless Playwright (`PYREFLY_BROWSER=gpu`, Vite
  dev on 5385, stopped by PID; Chapter II, seed 1, Spiral Cut, gauge set through `__pyrefly`):
  every press outside the zone (an immediate one, one past the zone on the right, five in a
  row) left the overlay open, put the cursor at 0 % and it was moving again 150 ms later
  (about 14 %). The timer kept running: a miss at 906 ms then a zone press gave `{true, 1742}`.
- Rule 3, "timer expiry selects the distinct weaker "fail" row". No press, and five misses then
  nothing, both reached the engine as `{false, 0}` and dealt 1297 (the Fail row, no bonus).
- Success + §5.2 bonus: a first-sweep zone press `{true, 2504}` dealt 2450; after one immediate
  miss `{true, 2488}` dealt 2446; after a late miss `{true, 1742}` dealt 2231. Misses cost time,
  as §5.3's "a miss restarts the sweep but not the timer" says.
- Blitz Ace row "4 × 8, then a final 24 × 1 (row 274 "Last Hit")" / fail "4 × 8", rank 7 (fail 6).
  Engine probe, same probe run on `e942fe11` and on `eafebb60` (copies of `src/` from `git
  archive`), seed 1: before, success 8 hits = 484 and a fail with 1100 ms left 601 (the fail beat
  the success); after, success 9 hits = 837 (1042 with 1100 ms left), fail 8 hits = 484 at any
  time left, ticks 70 / 60. `canMiss: false` on the record and on `finisherRow`, 0 misses.

**No input path lets a fail out-damage a success** (engine, after): all four Swordplay rows,
seeds 1 to 40, Luck 20 and 255, one and three foes, fail with 0 / 1 / 1000 / timer-1 / timer ms
left against success with 0 / 1 / timer ms left: the fail total never varies with the time
left and is below every success in every case (0 exceptions). On `e942fe11` the same probe
fails at the first row (the fail varied with the time left).

**Other checks:** the same seed twice gives a byte-identical event log (all four rows, success
and fail). No DOM or `three` in the changed `src/battle/ffx` files. Rule 7: `abilities.ts` 419
and `overdrive.ts` 472 lines, both unchanged in size; `execute.ts` 359, `overdriveShape.ts` 139,
`TidusTiming.ts` 82, `logic.ts` 160. No golden file changed. `npx tsc --noEmit` clean; full
`npx vitest run --testTimeout=60000`: 696 files passed, 5 skipped, 10524 tests passed;
`node tools/orphans.mjs`: 24 orphans, unchanged.

**Disclosed, not introduced here:**
1. (Major, pre-existing, not a regression.) §5.3 rule 2 is `[verified: 2 sources]` in its
   qualitative form: "stronger Overdrive ⇒ narrower gold zone, faster marker". The overlay
   ignores the published `travelMs`/`zonePercent` and plays all four rows with one zone (±22 px
   of 360, about 12 %) and one speed (340 px/s); only the timer varies. The builder's item 4
   calls this a design question; the numbers are `[estimate]`, but the ordering is sourced, so
   I count it as a sourced gap. Not changed by this branch.
2. (Minor, latent.) If the Blitz Ace target is KO'd during the volley, the finisher still lands
   on it, as the rest of the volley already does for any multi-hit single-target action. The
   sources do not say what happens; Blitz Ace cannot be unlocked in a shipped build.
3. The finisher shares the action's §5.2 bonus. That is the builder's reading; §5.2 does not
   single out row 274, and I found nothing against it.

Scratch: `D:/Tools/pyrefly-scratch/2026-09-30-rel35/od2/check/` (probe outputs, real-key JSON and
JPEG frames). The probe copies and the real-key script are parked in
`F:/pyrefly-parked/2026-09-30/od2/check/`. No server is left running.

Game case: **FFX only**.

## od3 (2026-09-30): a wrong Bushido press resets to input 1 (FFX only)

Branch `r34fix-od3`, cut from f699e828. Not pushed, not deployed. Settles od2's still-open item 1
(and the odfail Check's major 2) now that a source exists. Two commits, one per item.

**The source.** `research/ffx-overdrive-input-rules-2026-09-30.md` (copied unchanged from main
4850175b, blob ec56e897, so the code and its source travel together), Q1, reset-to-start
`[verified: 3 sources]`:

- GF-PF: "if an incorrect button is pressed, you must start the sequence over"
- GF-HD: "if you make a mistake, you must start over from the beginning"; "otherwise there is no penalty"
- AF: "If you make a mistake you'll have to start over."

The timer running on through the reset is `[estimate]` (GF-HD says "a fixed amount of time"; no
source describes the timer at the reset). The wrong press itself not counting as input 1 is also
`[estimate]`. Fail outcome `[verified: 3 sources]`: timer expiry resolves the Fail row, and
PR-0267 (no bonus on a fail) stays.

**1. Code** (457e6521).

- `src/ui/ffx/minigames/logic.ts` `stepAuronSequence`: a wrong press returns
  `{correctSoFar: 0, wrong: true, done: false}`; before it was `done: true` (the attempt ended).
- `src/ui/ffx/minigames/AuronSequence.ts`: on a wrong press every chip returns to unlit and the
  missed chip takes the existing `ffx-mg-key--wrong` colour for 240 ms (the overlay's own flash
  length), then clears. No new art or CSS, no animation added, REDUCE MOTION untouched. Expiry is
  the only fail: `{success:false, correctInputs: <progress>, timeRemainingMs: 0}`.
- Engine contract (`MinigameResult`) and `src/battle/**` untouched. 98 and 168 lines.

| Run | before (f699e828) | after |
|---|---|---|
| Pure, ↑↓← then a wrong ↓ | `{3, wrong, done}`, resolves `{false, 3, 0}` | `{0, wrong, not done}`; the full sequence after it completes, `{true, 7, 2800}` at 1 200 ms |
| Real keys, 3 correct, wrong ↓ ~390 ms in | overlay resolved at once: engine got `{false, 3, 0}`, Yunalesca took **1807** (Fail row) | overlay stays open; chips go `...W...` then `.......` 300 ms later |
| ... then the full correct sequence | n/a (already resolved) | engine got `{true, 7, 2611}` (page clock said 4000 − 1389 = 2611), **2545** (= 1919 × (1 + 2611/8000)) |
| ... then nothing | n/a | `{false, 0, 0}` at expiry, **1807** (= no press) |
| No press | `{false, 0, 0}`, 1807 | `{false, 0, 0}`, 1807 |

Browser runs: headless Playwright (`PYREFLY_BROWSER=gpu`), vite dev on 5391, stopped by PID after
each run. Setup through `__pyrefly` (seed 1, Chapter II, cutscenes skipped, Auron's gauge 100);
everything else real keys: the others Attack, Auron picks Overdrive > Dragon Fang, then the keys
read off the chips. Before = this branch at f699e828, after = 457e6521.

**2. Docs** (a2c728c8). `research/ffx-combat-core.md` §5.5: the wrong-press row now says reset to
input 1, with the tags above, and the old "ignored" `[estimate]` marked contradicted. One-line
"Open" markers, values unchanged: Tornado's timer (D1), the Immune-row rules (Q2), button orders
and Tornado's rank (D3, D4), Blitz Ace's hit count (D5, §5.3). `research/visual-bible.md`
§3.11.2: not "the run ends" (row returns to pending, chip 1 next), and "all four sequences are 7
inputs" corrected to 8 / 7 / 7 / 6 `[verified: 4 sources]` (D2).

**Tests.** `tests/unit/ffx-bushido-wrong-press-reset.test.ts` (new, jsdom, 11 tests): the pure
reset rule (mid-sequence, first input, wrong press equal to input 1, full sequence after a reset,
expiry); the real overlay on a fake clock with real `keydown` events (wrong press does not
resolve, chips unlit and the wrong mark clears; wrong press then the full sequence = success with
3 000 ms left at 1 000 ms, measured from the opening; wrong press then nothing = `{false, 0, 0}`
at the timer; several wrong presses); the engine (reset + expiry = the no-press Fail row; reset +
completion beats a 0 ms success, which beats the fail). 8 of the 11 fail on f699e828.
`ui-ffx-minigames.test.ts`'s wrong-press expectation follows the source.

**Gates:** `npx tsc --noEmit` clean; full `npx vitest run --testTimeout=60000`: 697 files passed,
5 skipped, 10535 tests passed; `node tools/orphans.mjs`: 24 orphans, unchanged. No golden moved.

**Still open (not changed; the sources do not settle them or they wait for Bailey):**

1. Tornado's timer (3 s vs 4 s), the button orders, Tornado's rank, the Immune-row rules, Blitz
   Ace's hit count: see the note's D1, D3, D4, Q2, D5.
2. (Major, pre-existing, not a regression; seen by running `minigameParams`.) The engine publishes
   `{abilityId, timerMs: 4000, inputs: 7}` for all four Bushido rows and no `name` or `sequence`,
   so every Bushido overlay is titled "Dragon Fang" and plays the overlay's default 7 inputs
   ↑↓←→✕○△, not §5.5's per-Overdrive sequence (Dragon Fang is 8). Wiring the sourced sequences
   waits on D3 (which order is the HD baseline).
3. visual-bible §3.11.2 asks for the **whole row** to flash on a wrong press; the overlay marks
   only the missed chip, with the existing colour (the brief said no new art). The "next
   required" chip state is not built either.

Scratch: `D:/Tools/pyrefly-scratch/2026-09-30-rel35/od3/` (pure probe before/after, real-key JSON
and JPEG frames, params probe, full vitest log). The real-key script is parked in
`F:/pyrefly-parked/2026-09-30/od3/`. No server is left running.

Game case: **FFX only**. Bushido is Auron's FFX Overdrive; FFX-2 has none, and no file under
`src/battle/ffx2`, `src/ui/ffx2` or `src/data/ffx2` changed.

## Check (od3) (2026-09-30): independent check of r34fix-od3 at 74475f46, FFX only

Verdict: **no blocker, no new major.** The checker did not build od3 and tried to break it.

**Source.** `research/ffx-overdrive-input-rules-2026-09-30.md` is the same blob as main 4850175b
(ec56e897). Q1 reset-to-start is `[verified: 3 sources]`; GF-PF: "if an incorrect button is
pressed, you must start the sequence over". The code and both docs say reset to input 1, the
attempt continues, expiry is the only fail. The timer running on and the wrong press not counting
as input 1 are labelled `[estimate]` everywhere, as the note requires.

**Real keys, headless** (PYREFLY_BROWSER=gpu, vite on 5395, stopped by PID, nothing listening
afterwards). Chapter II, seed 1, Auron's gauge set through `__pyrefly`, then Dragon Fang with keys
read off the chips. The ring text was read before and after every press, and the timer never
went back to 4.0:

| Run | Chips after the wrong press | Ring | Engine got | Yunalesca took |
|---|---|---|---|---|
| 3 correct, wrong at 4, then the full sequence | `...W...`, then `.......` 300 ms later | 3.6 -> 3.5, ran on to 2.5 | `{true, 7, 2502}` | 2519 = 1919 x (1 + 2502/8000) |
| 3 correct, wrong at 4, then nothing | `...W...` | ran on | `{false, 0, 0}` | 1807 (Fail row, no bonus) |
| wrong, ok, wrong, wrong, ok, ok, wrong, then the full sequence | `W......`, `.W.....`, `W......`, `..W....`; the overlay stayed open | ran on | `{true, 7, 2482}` | 2514 |
| 6 correct, wrong on the last input, then the full sequence | `......W` | 3.3 -> 3.2 | `{true, 7, 2433}` | 2502 |
| 4 wrong presses, then nothing | `W......` each time | ran on | `{false, 0, 0}` | 1807 |

Every success's bonus matches the time left at the last key on the page's own clock (to the ms),
measured from the overlay opening, not from a reset. No page errors.

**Gates, re-run here:** `npx tsc --noEmit` clean; full `npx vitest run --testTimeout=60000`:
697 files passed, 5 skipped; 10535 tests passed, 40 skipped, 1 todo.

**Rules.** Layering: the diff touches only `src/ui/ffx/minigames` (AuronSequence 98 lines, logic
168), tests and docs; `src/battle/**`, `src/data/**` and `MinigameResult` are untouched, so the
seeded engine is unchanged (the same Fail row, 1807, in every no-success run, before and after).
`canMiss: false` still on all four Bushido records. Nothing under any FFX-2 path changed. Rule 7
holds. The docs decide no open item: Tornado's timer (D1), the Immune rules (Q2), button orders
and Tornado's rank (D3, D4) and Blitz Ace (D5) are only marked "Open" with their values unchanged.

**Minor (docs wording, not changed here):**

1. visual-bible §3.11.2 tags the lengths 8 / 7 / 7 / 6 `[verified: 4 sources]`; the note's D2
   names GF-KB's Tornado 5 as a dissent (the line says so), so Tornado's length is strictly
   four against one.
2. ffx-combat-core §5.5's D3 marker says "HD guides give the NA/JP order"; per the note that is
   GF-KB (HD) and AGS, which the note does not call an HD guide.

**Carried (pre-existing, disclosed by the builder, not regressions):** every Bushido overlay plays
the default 7 inputs ↑↓←→✕○△ titled "Dragon Fang" (the engine publishes no `sequence` or `name`;
waits on D3); visual-bible's whole-row flash and the "next required" chip are not built.

Scratch: `D:/Tools/pyrefly-scratch/2026-09-30-rel35/od3/check/` (tsc, vitest log, real-key JSON
and JPEG frames). The check script is parked in `F:/pyrefly-parked/2026-09-30/od3/check/`.

Game case: **FFX only** (Bushido is Auron's FFX Overdrive; FFX-2 has none).

## od4 (2026-09-30): the Bushido and Swordplay overlays are titled with the chosen Overdrive (FFX only)

Branch `r34fix-od4` from `f24d15c4`.

**Defect.** `minigameParams` (`src/battle/ffx/overdrive.ts`) published `{ abilityId, timerMs: 4000,
inputs: 7 }` for every Bushido row and `{ abilityId, timerMs, travelMs, zonePercent }` for every
Swordplay row, with no `name`. `AuronSequence.ts` and `TidusTiming.ts` read `params.name` with the
defaults "Dragon Fang" and "Slice & Dice", so every Bushido was titled "Dragon Fang" and every
Swordplay "Slice & Dice".

**Fix.** The same two `Object.assign` lines now add `name: def.name`: the ability record's own
display name, the record `abilityId` names (`overdrive-auron.ts`, `overdrive-tidus.ts`). No new
strings. Timers, input counts, travel and zone values, sequences and button orders are unchanged
(the HD button order stays open: `research/ffx-overdrive-input-rules-2026-09-30.md` D1-D5).
`overdrive.ts` stays at 472 lines (rule 7: did not grow). Wakka's overlay also reads `params.name`
(default "Slots") and gets none; its subtitle already names the reel set. Not changed here.

**Before/after, real keys, headless (dev server 5371, Chapter II `yunalesca`, seed 1; gauges
filled through the live engine ctx, everything else by keys):**

| Picked | Before: title | After: title | Request after |
|---|---|---|---|
| Auron, Dragon Fang | Dragon Fang | Dragon Fang | `dragon-fang`, name Dragon Fang, 4000 ms, 7 inputs |
| Auron, Shooting Star | **Dragon Fang** | Shooting Star | `shooting-star`, name Shooting Star, 4000 ms, 7 inputs |
| Tidus, Spiral Cut | **Slice & Dice** | Spiral Cut | `spiral-cut`, name Spiral Cut, 3000 ms |
| Tidus, Slice & Dice | Slice & Dice | Slice & Dice | `slice-and-dice`, name Slice & Dice, 3000 ms |

Subtitles unchanged ("BUSHIDO · ENTER THE SEQUENCE", "SWORDPLAY · CONFIRM IN THE GOLD ZONE"); no
page errors. JSON and JPEG frames: `D:/Tools/pyrefly-scratch/2026-09-30-rel35/od4/`.

**Which shipped chapters could show the wrong title** (each chapter's `buildRef`, read by running
`src/data/encounters.ts`; nothing grants an Overdrive mid-battle):

| Ch | Chapter | Tidus (Swordplay) | Auron (Bushido) |
|---|---|---|---|
| I | seymour-flux | Spiral Cut | Dragon Fang |
| II | yunalesca | Spiral Cut, Slice & Dice | Dragon Fang, Shooting Star |
| III | braskas-final-aeon | Spiral Cut, Slice & Dice, Energy Rain | Dragon Fang, Shooting Star |
| VII | seymour-anima-macalania | Spiral Cut | Dragon Fang, Shooting Star, Banishing Blade |
| VIII | evrae-airship | Spiral Cut, Slice & Dice | Dragon Fang, Shooting Star, Banishing Blade |
| IX | yojimbo-cavern | Spiral Cut | Dragon Fang |
| X | seymour-natus | Spiral Cut, Slice & Dice | Dragon Fang, Shooting Star, Banishing Blade |
| XII | seymour-omnis | Spiral Cut, Slice & Dice, Energy Rain | Dragon Fang, Shooting Star |
| XIV | isaaru-via-purifico | not in the party | not in the party |
| XVII | sin-fins-core | Spiral Cut, Slice & Dice, Energy Rain | Dragon Fang, Shooting Star |
| XVIII | sin-face | Spiral Cut, Slice & Dice, Energy Rain | Dragon Fang, Shooting Star |

So the wrong title was visible to players: every Spiral Cut and Energy Rain read "Slice & Dice"
(every FFX chapter with Tidus, Chapter I included), and every Shooting Star and Banishing Blade
read "Dragon Fang" (all but I, IX and XIV). Tornado and Blitz Ace are unlocked in no chapter.

**Tests.** `tests/unit/ffx-overdrive-overlay-title.test.ts` (new): the real engine (no
auto-resolve) emits the `minigame-request` for each of the four Bushido and four Swordplay rows,
its params open the real overlay (jsdom), and the title equals the record's name; `abilityId`,
`timerMs: 4000` / `inputs: 7` (Bushido) and `travelMs` / `zonePercent` (Swordplay) are asserted
unchanged. Without the fix 8 of its 10 tests fail; with it all pass.

**Gates.** `npx tsc --noEmit` clean; full `npx vitest run --testTimeout=60000`: 698 files passed,
5 skipped; 10545 tests passed, 40 skipped, 1 todo; `node tools/orphans.mjs`: 24 orphaned, the
same 24 as before (no new module). Dev server on 5371 stopped by PID.

Game case: **FFX only** (Bushido and Swordplay are Auron's and Tidus's FFX Overdrives; FFX-2 has
neither; `src/battle/ffx/` only).

## Check (od4) (2026-09-30): independent check of `7735e43d`, FFX only

Verdict: **no blocker, no major.** The change does what the builder reported.

- **Diff.** `git diff f24d15c4 7735e43d -- src` is two lines in `minigameParams`
  (`src/battle/ffx/overdrive.ts`): `name: def.name` added to the existing `tidus-timing` and
  `auron-sequence` `Object.assign` calls. `timerMs`, `inputs: 7`, `travelMs: 1400`,
  `zonePercent: 22`, `abilityId` and the sequences are untouched. The only other `minigame-request`
  producer is `execute.ts:246`, which calls `minigameParams`. `name` comes from the ability record
  (`overdrive-auron.ts`, `overdrive-tidus.ts`), so no new strings. `overdrive.ts` stays at 472 lines
  (rule 7).
- **Gates, re-run by me.** `npx tsc --noEmit` clean. Full `npx vitest run --testTimeout=60000`:
  698 files passed, 5 skipped; 10545 tests passed, 40 skipped, 1 todo (same as the builder).
  `node tools/orphans.mjs` output is identical to the builder's saved list (no new module).
- **Headless, real keys, my own script** (dev server 5376, seed 1; gauges set through the live
  battle state, then the menu keys Overdrive row, picker row, Enter). Every unlocked overlay I
  could reach showed its own Overdrive's name:

  | Chapter | Who | Picked | Overlay title | Subtitle |
  |---|---|---|---|---|
  | II yunalesca | Auron | Dragon Fang | Dragon Fang | BUSHIDO |
  | II yunalesca | Tidus | Spiral Cut | Spiral Cut | SWORDPLAY |
  | II yunalesca | Tidus | Slice & Dice | Slice & Dice | SWORDPLAY |
  | II yunalesca | Auron | Shooting Star | Shooting Star | BUSHIDO |
  | III braskas-final-aeon | Auron | Dragon Fang | Dragon Fang | BUSHIDO |
  | III braskas-final-aeon | Auron | Shooting Star | Shooting Star | BUSHIDO |

- **Not reached in a browser, covered by the unit test only** (the test drives the real engine's
  `minigame-request` into the real overlay for all eight records, so it does cover them):
  Banishing Blade, Tornado, Energy Rain, Blitz Ace. My script could not get Auron or Tidus to a
  usable menu in Chapters I, VII and VIII within a sane time (Chapter VII opens on Rikku with Tidus
  and Auron in reserve; Chapter III Tidus never came up in 40 turns); Chapters IX to XVIII were not
  run. This is a limit of my driver, not a defect found. Energy Rain and Banishing Blade have no
  browser frame yet.
- **Unlock table.** I re-ran `src/data/encounters.ts` (builder's `unlocks.mjs`): the table above
  matches each chapter's `buildRef` exactly. Tornado and Blitz Ace unlock nowhere.
- **Housekeeping note.** The builder said its driver scripts were moved to
  `F:/pyrefly-parked/2026-09-30/od4/`; that folder does not exist. The scripts that are in
  `D:/Tools/pyrefly-scratch/2026-09-30-rel35/od4/` (`probe.mjs`, `unlocks.mjs`) are scratch only and
  nothing under `src/` or `tests/` depends on them. Cosmetic.
- My evidence: `D:/Tools/pyrefly-scratch/2026-09-30-rel35/od4/` (`check-vitest.txt`,
  `check-titles.mjs`, `check/*.json`, `check/*.jpg`). Server on 5376 stopped by PID.

## od5 (2026-10-01): the Immune rows fire, chosen per target; Tornado's timer is 3 s (FFX only)

Branch `r34fix-od5`, cut from `25aa1966` (r34fix-od4's tip) in `D:/pyrefly-aeon-hp`. Not pushed, not
deployed. Bailey, 2026-10-01: "all your recommendations, godspeed", which adopts the driver's three
picks on `research/ffx-overdrive-input-rules-2026-09-30.md`, all **our estimates**: D-310 Banishing Blade
uses its Immune row only when the target is immune to **all four** Breaks; D-311 immunity is decided
**per target**; D-312 Tornado's timer is **3 s**. D3 (HD button orders), D4 (Tornado's rank) and D5
(Blitz Ace's hit count) stay open. Three commits, one per item.

**1. The Immune rows are reachable** (d355582c). Before, nothing set `sequence.targetImmuneToRider`, so
odfail's still-open item 2 held: no Immune row ever fired in play.

- `overdriveShape.ts`: new `immuneToRider(def, target)` reads the target's own data. The rider is the
  record's `statusEffects` plus a weak/strong Delay flag. Immune means resistance 255 for each status and
  `immune-to-delay` for the Delay. For Banishing Blade that means all four Breaks. A record with no rider
  (Tornado) is never immune.
- On a **successful** `auron-sequence` only, `shapeOverdrive` sets the new `ResolveOptions.rowFor`.
  `resolveAbility` (`abilities.ts`) asks it once per target and uses the Immune row's DmgCon for that
  target only. The others keep the success row and its rider.
- The Immune row now carries no status and no Delay (TRK rows 270 to 273).
- A failed input never reaches this code: it returns the Fail row first.
- No RNG draw was added. A chance-254 status and Delay never draw, so for a non-immune target the event
  log is identical. The test checks that the mixed Dragon Fang log equals the plain one with only the
  immune foe's number changed.
- `targetImmuneToRider` is no longer read. The overlay's pass-through was dead (`minigameParams` never
  published it) and is removed. `types.ts` keeps the field (additive), with a comment that it is not
  read, and there is a CONTRACT-CHANGES entry.
- `abilities.ts` stays at 419 lines (two comments rewrapped).

**2. Tornado 3 000 ms** (f9c7caff). `timerMsFor` returns 3000 for `tornado` and 4000 for the other three.
It carries the tag `[estimate, Bailey D-312]` (GF-KB, XU, AGS; note D1). The overlay timer, the auto-roll
range and the §5.2 bonus follow it. Engine, before → after:

- Tornado: `timerMsFor` 4000 → 3000, `params.timerMs` 4000 → 3000. The bonus with 1 500 ms left goes
  from x1.1875 to x1.25.
- The other three: 4000, unchanged.

This is latent, because no shipped chapter unlocks Tornado. `overdrive.ts` stays at 472 lines.

**3. Docs** (b6c9324c). `research/ffx-combat-core.md` §5.5 now says when the Immune row applies:

- only on a success;
- immunity is read from the target's data;
- "all four" `[estimate, Bailey D-310]`;
- "per target" `[estimate, Bailey D-311]`;
- Tornado has no Immune row;
- Tornado's timer is 3 000 ms `[estimate, Bailey D-312]`, also noted in §5.2.

Each line points to the research note. The two "Open" markers od3 left for these items are cleared. The
D3/D4/D5 marker stays.

**Immunity, from data** (each shipped chapter's whole chain; `I` = resistance 255; `immune-to-delay` flag
for Delay):

| Ch | Enemy | Delay (Dragon Fang) | Eject (Shooting Star) | Breaks P/M/A/Me (Banishing Blade) |
|---|---|---|---|---|
| I (DF) | Seymour Flux, Mortiorchis | immune | immune | IIII |
| II (DF, SS) | Yunalesca, forms 1 to 3 | immune | immune | IIII |
| III (DF, SS) | Braska's Final Aeon, forms 1 and 2 | immune | immune | ---- |
| III | Yu Pagoda L/R | no | immune | IIII |
| III | Possessed Valefor, Ifrit, Ixion, Shiva, Bahamut | no | immune | IIII |
| III | Yu Yevon | no | immune | ---- |
| VII (DF, SS, BB) | Guado Guardian A/B | no | no | ---- |
| VII | Seymour (Macalania) | immune | immune | I--- (Magic Break 50, a Ward) |
| VIII (DF, SS, BB) | Evrae | no | immune | -II- |
| VIII | Cid | no | immune | ---- |
| IX (DF) | Yojimbo | immune | immune | IIII |
| IX | Ginnem / Daigoro | no / immune | no / no | ---- |
| X (DF, SS, BB) | Seymour Natus | immune | immune | -III |
| X | Mortibody | no | immune | -I-I |
| XII (DF, SS) | Seymour Omnis | immune | immune | II-- |
| XII | Mortiphasm 1 to 4 | no | immune | IIII |
| XVII (DF, SS) | Left Fin / Right Fin | immune | immune | II-- |
| XVII | Sinspawn Genais / Sin Core | immune | immune | --II / II-- |
| XVII | Cid | no | immune | ---- |
| XVIII (DF, SS) | Overdrive Sin | immune | immune | II-- |

~~Of the chapters that unlock Banishing Blade (VII, VIII, X), no enemy is immune to all four Breaks. Its
Immune row therefore never fires in a shipped chapter; only the fixture test reaches it.~~ **Corrected by
Check (od5):** Anima (Chapter VII, `anima-macalania`, shipped in the group's `parts`, on the field once
Seymour summons her) is immune to all four Breaks, Eject and Delay, and Chapter VII unlocks Banishing
Blade, so a clean Banishing Blade on Anima takes the Immune row (30 DmgCon, no Break) in play. The table
above leaves her out. The Seymour pattern, Power Break immune with the other Breaks still landing, is
real data in Chapter VII.

**Before/after, engine** (each chapter's first link, the real `setupForChapter` board, seed 1, a clean
input with 0 ms left, one run per target; Dragon Fang hits all foes in one run). "Before" is the same
probe on the unchanged tree (`25aa1966`), run before the first edit.

| Ch | Overdrive | Target | before → after | row after |
|---|---|---|---|---|
| I | Dragon Fang | Seymour Flux / Mortiorchis | 1523 → 1702 / 885 → 989 | immune (19/17) |
| II | Dragon Fang | Yunalesca | 1927 → 2154 | immune |
| II | Shooting Star | Yunalesca | 2721 → 3061 | immune (27/24) |
| III | Dragon Fang | BFA / Yu Pagoda L / R (one action) | 1011 → 1130 / 2386 = / 2463 = | BFA immune, Pagodas success: the per-target case in shipped data |
| III | Shooting Star | BFA / Yu Pagoda L / R | 1427 → 1606 / 3328 → 3743 / 3328 → 3743 | immune (all three are Eject-immune) |
| VII | Dragon Fang | Guardian A / Seymour / Guardian B | 964 = / 956 → 1069 / 1043 = | Seymour immune, Guardians success |
| VII | Shooting Star | Guardian A, B / Seymour | 1362 = and Eject lands / 1362 → 1532, no Eject | success / immune |
| VII | Banishing Blade | Seymour | 1588 = ; Magic, Armor and Mental Break land | success (partial immunity) |
| VII | Banishing Blade | Guardian A / B | 1588 = ; all four Breaks land | success |
| VIII | Dragon Fang / Shooting Star / Banishing Blade | Evrae | 917 = / 1294 → 1457 / 1511 = (Power and Mental Break land) | success / immune / success |
| IX | Dragon Fang | Yojimbo | 1072 → 1198 | immune |
| X | Dragon Fang | Natus / Mortibody | 2066 → 2309 / 1464 = | immune / success |
| X | Shooting Star | Natus / Mortibody | 2917 → 3282 / 2003 → 2252 | immune / immune |
| X | Banishing Blade | Natus / Mortibody | 3403 = (Power Break lands) / 2336 = (Power, Armor) | success / success |
| XII | Dragon Fang / Shooting Star | Omnis | 385 → 430 / 544 → 611 | immune |

Notes on the table:

- Ch XII's Mortiphasms take 0 either way.
- In Chapters XVII and XVIII, Auron's Overdrive reached no target from the first link's board: the probe
  bypassed the menu, and the Fins are out of melee reach. So those two chapters are covered by the
  immunity table only.
- A failed input on the same boards is unchanged by od5. For example, Yunalesca still takes Dragon Fang
  1814 and Shooting Star 2721 (the Fail row).

**Real keys, headless.** Setup:

- `PYREFLY_BROWSER=gpu`, vite dev on 5481, stopped by PID.
- Chapter II (Yunalesca), seed 1, Auron's gauge set through `__pyrefly`.
- Everything else by real keys: the others Attack, then Auron picks Overdrive > the row > the target, and
  the full sequence is read off the chips.
- "Before" = this worktree switched to `r34fix-od4` (25aa1966) for the run, then switched back.
- "Row" is the engine's own `immuneToRider`, imported in the page, evaluated on the live Yunalesca, who
  has Eject 255 and `immune-to-delay`.

| Overdrive | Engine got | Yunalesca took | Without the §5.2 bonus | Row |
|---|---|---|---|---|
| Dragon Fang, before | `{true, 7, 3277}` | 2704 | 1918 (17 DmgCon) | success (nothing chose the Immune row) |
| Dragon Fang, after | `{true, 7, 3186}` | **2999** | 2145 (= 1918 x 19/17) | **immune row** |
| Shooting Star, before | `{true, 7, 3098}` | 3759 | 2710 (24 DmgCon) | success |
| Shooting Star, after | `{true, 7, 3237}` | **4282** | 3049 (= 2710 x 27/24) | **immune row** |

No status landed on her and there were no page errors. Titles: "Dragon Fang" and "Shooting Star". The
odfail Check's engine probe on the same board gave 1919 / 2145 and 2710 / 3049.

**Goldens** (`ffx-engine-golden.test.ts`). Four digests moved and are re-pinned. Old and new trees were
replayed side by side, listing every Bushido the line fires:

- `yunalesca#1` 6d7a9a3f → b20edebb: link 1's auto-rolled clean Shooting Star on Yunalesca (Eject-immune)
  went 4145 → 4662 (27/24). The rest of the fight follows from that, so the second Shooting Star lands at
  a different turn.
- `yunalesca#7` efc5c8cc → 2b4ba8df: both Shooting Stars on Yunalesca, 5243 → 5899 and 4428 → 4983.
- `braskas-final-aeon#1`, link 2 only, cc1d312c → e41be697: Shooting Star on Possessed Valefor,
  2677 → 3013.
- `braskas-final-aeon#7`, links 1 and 2 (922d7f55 → c1e3482, 6583a70a → 90fc8d41): Shooting Star on
  BFA, 2781 → 3129, and on Possessed Valefor, 3006 → 3382.

Every outcome is unchanged, and the other 14 digests did not move. No golden line fires Dragon Fang or
Banishing Blade.

**Tests.** `tests/unit/ffx-bushido-immune-rows.test.ts` is new, with 16 tests (plus the fixture file's own check):

- Dragon Fang per target across a mixed group, both ways round and both immune; the immune foe gets
  19/17 and no Delay, the other gets exact success damage and the Delay;
- the no-new-draw log check;
- Shooting Star on an Eject-immune target (27/24, no Eject) against one that is not (Eject lands);
- Banishing Blade immune to all four (30/28, no Break) against partial immunity to 1, 2 and 3 Breaks (the
  success row exactly, the other Breaks land);
- Seymour (Macalania) from the shipped data;
- a failed input never uses the Immune row (all three);
- `immuneToRider`, and the Immune row's shape (no status, no Delay, `canMiss: false`);
- Tornado 3000 and the others 4000 (`timerMsFor` and the published params);
- the same seed twice.

Against `25aa1966`'s three engine files, 7 of them fail. Other test changes:

- `ffx-overdrive-fail-rows.test.ts`: the Immune-row tests now use immune foes instead of the flag.
- `ui-ffx-minigames.test.ts`: the pass-through test now asserts the flag is never produced.
- The od4 title test expects 3000 for Tornado.

**Gates.**

- `npx tsc --noEmit` is clean.
- Full `npx vitest run --testTimeout=60000`, run twice: 698 files passed, 1 failed, 5 skipped; 10561
  tests passed, 1 failed, 40 skipped, 1 todo. The one failure both times is
  `audio-manifest-io.test.ts` "loses nothing when four separate renders write at once". The second time
  it was an `EPERM` opening a `.lock` file in `C:\...\Temp`. That is a Windows file-lock race in
  `tools/audio`, which this branch does not touch. The file passes 4 of 4 times on its own.
- `node tools/orphans.mjs`: 24 orphans, the same list as od4.

**Disclosed, not changed here (outside this brief):**

1. **(Major, pre-existing, not a regression; reachable in Chapters VII, VIII and X.) A failed Bushido
   still lands its rider.**
   - The research note's Q3a (`[verified: 5 sources]`, GF-PF "Effects only are applied when sequence is
     entered correctly") and §5.3/§5.5 say the Fail rows carry no status.
   - `rowFromExtra(def, 'fail')` keeps the success record's `statusEffects` and flags. This is odfail's
     still-open item 3.
   - Engine, Chapter VII, seed 1, a failed input: Shooting Star still Ejects a Guado Guardian, and
     Banishing Blade still lands all four Breaks on a Guardian (Magic, Armor and Mental on Seymour).
     By the code, a failed Dragon Fang still Delays (the fail row keeps the `weak-delay` flag; not measured).
   - The fix would be one line in `rowFromExtra` (drop the rider on the fail row, as the Immune row now
     does). It moves goldens wherever an auto-rolled fail hits a non-immune target. Not done: not in this
     brief.
2. ~~Banishing Blade's Immune row is unreachable in every shipped chapter: no BB chapter has an enemy immune
   to all four Breaks.~~ **Corrected by Check (od5):** it is reachable on Anima in Chapter VII (all four
   Breaks at 255); see the Check below.

Scratch:

- Probe outputs: `D:/Tools/pyrefly-scratch/2026-10-01-rel34/od5/` (`immunity`, `damage-before/after`,
  `damage-fail-after`, `golden-probe`, `timer`, `orphans`, both full vitest logs).
- Real-key JSON and JPEG frames: `realkey/`.
- The probe scripts and the `before/` source copy are parked in `F:/pyrefly-parked/2026-10-01/od5/`.
- No server is left running.

Game case: **FFX only**. Bushido is Auron's FFX Overdrive. FFX-2 has none, and no file under
`src/battle/ffx2`, `src/ui/ffx2` or `src/data/ffx2` changed.

## Check (od5), 2026-10-01: independent check of `r34fix-od5` at c50c845b (FFX only)

Verdict: **no blocker.** The three picks are built as D-310, D-311 and D-312 say. One handoff claim was
wrong and is corrected above (Anima). Everything was re-run here, not read off the builder's report.
"Old" means `git archive 25aa1966` (src only) under the scratch folder, run side by side with the branch
in the same vitest process. Nothing in the worktree was switched.

**Immunity table, from live engine state.** I built each shipped FFX chapter's whole chain with
`setupForChapter` and `setupForNextLink`, called `init`, and read every enemy-side combatant (parts
included). I then called the branch's own `immuneToRider` for all four Bushido records. The result
matches the builder's table for Seymour Flux and Mortiorchis, Yunalesca, BFA, the Pagodas, the Possessed
aeons, Yu Yevon, the Guado Guardians, Seymour (Macalania: P255 and M50), Evrae (M255/A255), Yojimbo,
Natus, Mortibody, Omnis, the Mortiphasms, both Fins, Genais, Sin's Core and Overdrive Sin. That covers
every enemy in chapters I, II, III, VII, VIII, IX, X, XII, XVII and XVIII. What the table missed:

- **Anima (VII) is immune to all four Breaks, Eject and Delay**, and VII unlocks Banishing Blade. So the
  BB Immune row *is* reachable in play. This is correct under D-310. The handoff said otherwise and is
  fixed above.
- Daigoro (IX) is Delay-immune, and Yojimbo is also immune to Eject and all four Breaks. Neither matters,
  because IX unlocks Dragon Fang only.

**Old tree against new tree, fixture board** (`fx` dummies, seeds 1, 7 and 42, the Overdrive and then 40
more decisions):

- **No new RNG draw.** These fights give byte-identical logs (old = new, every event): Dragon Fang on
  non-immune targets; Shooting Star and Banishing Blade on non-immune targets; Banishing Blade on a
  Power-Break-only target and on Seymour's shipped immunities; and every failed input (DF on two
  Delay-immune foes, SS on an Eject-immune foe, BB on an all-four-immune foe).
- **Per target.** Dragon Fang with one Delay-immune foe and one plain foe: exactly one event differs,
  the immune foe's damage 265 → 295 (19/17). The plain foe's 267 and its Delay are unchanged. With
  both foes immune, two events differ (265 → 295 and 267 → 298).
- **Banishing Blade.** Immune to all four: 436 → 467 (30/28) and no Break. Anima's shipped immunities
  give the same. Partial immunity (Power only, or Seymour's data) takes the success row, 436, and
  Magic, Armor and Mental Break land.
- **Shooting Star, Eject-immune.** 374 → 420 (27/24) and no Eject. The rest of the log diverges only
  because the foe dies sooner.
- **Tornado.** On an all-immune foe with 0 ms left, the log is identical (no Immune row). With 1 500 ms
  left: 369 → 388 per hit, which is base 311 × 1.1875 → × 1.25, the 4 s → 3 s bonus. Dragon Fang with
  1 500 ms left is unchanged (still 4 s). The branch's unit test checks `timerMsFor` and
  `minigameParams` (Tornado 3000, the rest 4000).

**Shipped board, Chapter III link 1** (old vs new, clean Dragon Fang with 0 ms left): BFA 1011 → 1130.
Yu Pagoda L stays 2386 and Yu Pagoda R stays 2463 in the same action, and every combatant's CTB after
the action is identical. Shooting Star on Yu Pagoda L: 3328 → 3743.

**Goldens.** Every FFX chapter at seeds 1 and 7 was replayed on both trees, with the first differing
event found per link:

- The four moved pinned digests are exactly the builder's: `yunalesca#1` and `#7`, `braskas-final-aeon#1`
  link 2 and `#7` links 1 and 2.
- Each first difference is an auto-rolled Shooting Star on an Eject-immune target: Yunalesca
  4145 → 4662 and 5243 → 5899, Possessed Valefor 2677 → 3013 and 3006 → 3382, BFA 2781 → 3129.
- The other 14 pinned digests and every outcome are identical.
- **Not disclosed before:** `sin-face` (XVIII) is not pinned, and it moves too. Auron's auto-rolled
  Dragon Fang on Overdrive Sin (Delay-immune) goes 2495 → 2788 (seed 1) and 3722 → 4160 (seed 7).
  The outcomes are unchanged (defeat at seed 1, victory at seed 7). This is expected under D-311 and
  is not a defect.

**Real keys, headless.** Setup: `PYREFLY_BROWSER=gpu`, vite on 5491 (stopped by PID 12648, port
verified free), Chapter II, seed 1. The gauge was set through `__pyrefly`; everything else went by keys.

| Overdrive | Engine got | Damage | Without the §5.2 bonus | Status |
|---|---|---|---|---|
| Dragon Fang, clean | `{true, 7, 3325}` | 3036 | 2144.6 (19/17 of 1918) | none |
| Shooting Star, clean | `{true, 7, 3343}` | 4323 | 3048.9 (27/24 of 2710) | none |
| Shooting Star, 3 of 7, timer ran out | `{false, 3, 0}` | 2710 | the Fail row, 24 | none |
| Dragon Fang, 3 of 7, timer ran out | `{false, 3, 0}` | 1807 | the Fail row, 16 (1918 × 16/17) | none |

On the live Yunalesca, the in-page `immuneToRider` says "immune row" for both Overdrives. There were no
page errors.

**Rules.**

- Rule 5: `rowFromExtra` keeps `canMiss: false`, and a test asserts it.
- Rule 1: `src/battle` imports no DOM and no three. `overdriveShape.ts` imports types and `./state`,
  `./abilities`, `./overdrive` and `./reels` only.
- No FFX-2 file changed.
- The commits name the FFX game case and end with the Co-Authored-By line.
- The docs (§5.2, §5.5, CONTRACT-CHANGES) say only what D-310 to D-312 and research note Q2/D1 support,
  tagged `[estimate, Bailey D-31x]`. D3, D4 and D5 stay open.

**Gates (mine).**

- `npx tsc --noEmit` is clean.
- The 5 touched test files pass, 81 tests. The new file has 17 tests, not 16.
- Full `npx vitest run --testTimeout=60000`: 699 files passed and 5 skipped; 10 562 tests passed, 40
  skipped, 1 todo. Exit 0, with no `audio-manifest-io` failure this time.
- `node tools/orphans.mjs`: 24, the same list.

**Findings.**

1. **Major, pre-existing, not a regression (the builder disclosed it): a failed Bushido still lands its
   rider.** I measured it here on both trees, identically: a failed Shooting Star Ejects a non-immune
   foe, and a failed Banishing Blade lands all four Breaks. Research Q3a (`[verified: 5 sources]`) says
   the Fail rows carry no status. NOW.md's 2026-09-30 20:40 line ("already so") is wrong about this.
2. **Minor, docs, fixed above:** Anima was missing from the immunity table, and the claim that the BB
   Immune row was unreachable was wrong.
3. **Minor, rule 7:** `src/battle/common/types.ts` grew 2 676 → 2 680 lines (comments only, on
   `SequenceResult`). A one-line comment on `targetImmuneToRider` would keep it flat.
4. **Minor, pre-existing:** the move advisor and the estimate path do not model the Fail and Immune
   rows. Against a rider-immune boss, the advisor now under-predicts a clean Bushido by 7 to 12.5 per cent.
5. **Known, pre-existing (D2/D3):** every Bushido overlay still plays the default 7-input sequence
   (↑↓←→✕○△), Dragon Fang included.

Evidence: `D:/Tools/pyrefly-scratch/2026-10-01-rel34/od5/check/`. It holds `immunity-table.txt`,
`crosstree.txt`, `golden-crosstree.txt`, `shipped-per-target.txt`, `full-vitest.txt`, `realkey/` (JSON
and JPEGs), the `*.probe.ts` probes, `realkey-check.mjs` and the `old/` source copy.

## od6 (2026-10-01): a failed Bushido carries no rider (FFX only)

Branch `r34fix-od6`, cut from `9f8e47e0` (r34fix-od5's tip) in `D:/pyrefly-aeon-hp`. Not pushed, not
deployed. Fixes od5's disclosed major 1 and odfail's still-open item 3 (the rider half; the crit half is
answered by Q3b and needs no change). Sourced defect, so no pick was needed.

**The source.** `research/ffx-overdrive-input-rules-2026-09-30.md` Q3a, `[verified: 5 sources]`: GF-PF
"Effects only are applied when sequence is entered correctly", GF-HD, GF-KB, AF, AGS, and the decoded
TRK fail rows 266 to 269 and 235 to 238, which carry no status and no Delay/Eject flag while the success
rows 100 to 102 do. `research/ffx-combat-core.md` §5.3 and §5.5 agree (the "(Fail)" rows have no rider).
Q3b: every fail row keeps the can-crit bit (data + 1 source, our estimate), so crit is unchanged.

**The fix.** `src/battle/ffx/overdriveShape.ts` `rowFromExtra`: the Fail row now drops the rider the same
way the Immune row already did: `statusEffects: []` and no `weak-delay`/`strong-delay` flag. Power, hits,
rank, `canMiss: false` (hard rule 5), `crit-eligible` and every other field stay the success record's.
The success record is untouched, so a clean Bushido still lands its rider. The file is 169 lines. No data
file changed. Swordplay's records have no rider, so Tidus is unaffected.

**RNG.** No draw is added or removed inside the Overdrive. Every Bushido rider status is chance 254,
which never draws (`rollStatus`), and Delay never draws. A probe that counted `SeededRng.next` calls
inside the action confirms it: 2 draws (crit, damage) per target before and after. The only draw-count
change in the probe is *after* the action: on the Chapter VII board a Guado Guardian that is no longer
Ejected is still on the field and answers with its `guardian-auto-potion` counter, which rolls its own
damage variance (one extra draw, after `action-end`). That is the fix's intended consequence, not a
change of draw order in the engine.

**Before/after, engine** (the real `setupForChapter` board, first link, seed 1, Auron's gauge full, a
failed input `{success:false, 2 of 7, 0 ms}`, one run per target; Dragon Fang hits all foes in one run;
"CTB" = the target's counter right after the action, which is where Delay shows):

| Ch | Overdrive (failed) | Target | Damage | Before | After |
|---|---|---|---|---|---|
| VII | Shooting Star | Guado Guardian A / B | 1362 = | **Eject** lands, the Guardian leaves | no Eject; it stays and counters |
| VII | Banishing Blade | Guado Guardian A / B | 1588 = | all four Breaks land | no Break |
| VII | Banishing Blade | Seymour (Macalania) | 1588 = | Magic, Armor, Mental Break land | no Break |
| VII | Dragon Fang | Guardian A / Seymour / Guardian B | 908 / 900 / 982 = | weak Delay: A CTB 2 → 21, B 38 → 57 (Seymour Delay-immune) | no Delay: 2 → 2, 38 → 38 |
| III | Dragon Fang | Yu Pagoda L / R | 2246 / 2318 = | Delay: 0 → 10, 19 → 29 | none |
| VIII | Dragon Fang | Evrae | 863 = | Delay: 20 → 35 | none |
| VIII | Banishing Blade | Evrae | 1511 = | Power and Mental Break land | none |
| X | Dragon Fang | Mortibody | 1378 = | Delay: 22 → 35 | none |
| X | Banishing Blade | Natus / Mortibody | 3403 / 2336 = | Power Break / Power and Armor Break | none |
| XII | Dragon Fang | Mortiphasm 1 to 4 | 0 = | Delay: +42 each | none |

Every damage number is identical before and after (the Fail row's DmgCon was already wired in odfail).
A **successful** input is byte-identical on every board in every shipped FFX chapter (I, II, III, VII,
VIII, IX, X, XII): the same damage, statuses and CTB, rider included (for example Shooting Star still
Ejects Guardian A, Banishing Blade still lands all four Breaks on it, Dragon Fang still Delays Guardian A
2 → 21). "Before" ran the same probe on `git archive 9f8e47e0 src` beside the branch.

**Goldens.** Nothing moved, so nothing was re-pinned: `ffx-engine-golden.test.ts` is 18/18 on the old
values. Every FFX chapter (the nine pinned plus the unpinned `sin-fins-core` and `sin-face`), seeds 1
and 7, was replayed on both trees: all 22 run digests are identical. The line fires 11 Bushido in all
of them (Shooting Star on Yunalesca, Possessed Valefor and BFA; Dragon Fang on Genais + Sin's Core and
Overdrive Sin). Every auto-rolled *failure* among them hits a target that is already immune to the rider
(Overdrive Sin is Delay-immune, for example), so dropping the rider changes nothing there; no golden line
fires a Bushido in Chapters VII, VIII or X, where the rider lands.

**Tests.** `tests/unit/ffx-bushido-fail-no-rider.test.ts` (new, 15 tests incl. the fixture file's own
check):

- Dragon Fang: a fail pushes no foe back (CTB as for the record with the Delay removed); a success still
  Delays both foes.
- Shooting Star: a fail lands no Eject, a success does; the same on Guado Guardian A's shipped data.
- Banishing Blade: a fail lands no Break, a success lands all four; Seymour (Macalania) shipped data: a
  fail lands none of the three Breaks a success lands.
- All four Bushido, seeds 1 and 7: the failed log equals the failed log of the same record with its rider
  removed by hand (no new draw, no other change).
- The success records still carry their riders.
- `rowFromExtra(def, 'fail')` for each Bushido: the §5.5 Fail row (DF 16, SS 24, BB 28, Tornado 15, rank
  6), no status, no Delay, `crit-eligible` kept, `canMiss: false`.

Against `9f8e47e0`'s `overdriveShape.ts`, 10 of the 15 fail (the Dragon Fang log test passes on the old
code because Delay emits no event; the CTB test catches it). The existing od5 and odfail tests pass
unchanged.

**Gates.** `npx tsc --noEmit` clean. Full `npx vitest run --testTimeout=60000`: 700 files passed, 5
skipped; 10 577 tests passed, 40 skipped, 1 todo; exit 0. `node tools/orphans.mjs`: 24 orphans, the same
as od5.

**Still open, not changed here:** the move advisor and the estimate path still do not model the Fail
and Immune rows (od5 Check minor 4).

Scratch: `D:/Tools/pyrefly-scratch/2026-10-01-rel34/od6/` (`fail-before/after.txt`,
`success-before/after.txt`, `drawdump.txt`, `golden-crosstree.txt`, `full-vitest.txt`, `orphans.txt`);
the probes and the `before/` source copy are parked in `F:/pyrefly-parked/2026-10-01/od6/`. No server
was started.

Game case: **FFX only**. Bushido is Auron's FFX Overdrive; FFX-2 has none, and no file under
`src/battle/ffx2`, `src/ui/ffx2` or `src/data/ffx2` changed.
