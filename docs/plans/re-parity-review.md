# Paper preflight — RE parity, wiring the proven kernels into the engines

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths
> src/battle/ffx/formulas.ts,src/battle/common/rng.ts,src/battle/ffx2/formulas.ts` classes this
> as **DEEP** (FFX CTB engine, FFX-2 ATB engine, shared combat core; all 18 chapters).
>
> **Owner's words, 2026-10-08:** *"use this https://github.com/morluto/rea and
> https://github.com/bethington/ghidra-mcp to reverse engineer and decompile final fantasy x/x-2
> battle mechanics. I have it installed in my pc with steam. it's the x/x-2 remaster. It needs to
> be a 1:1 parity. this is very useful for our project."*
>
> **Verdict: PROCEED** in four wiring batches (§5), each behind the conditions in §6.

Written 2026-10-08 by the main session from the kernel lanes' reports on branch `re-parity`
(commits 440239f7 to fbf30f62) and the main session's own reading of the decompiled functions
(FFX 0x7988f0, 0x78a890, 0x789690, 0x78a360; FFX-2 0x61e290, 0x617230).

---

## 1. Game case (AGENTS.md rule 14)

| Part | Case | Source |
|---|---|---|
| FFX kernels: RNG, hit, crit, base damage, per-hit modifier order, element, clamp, CTB, status | **FFX only** | FFX.exe build 25501027 (`research/re-ffx-*.md`) |
| FFX-2 kernels: RNG, hit, crit, base damage, per-target order, element, chain, ATB, status timers, steal | **FFX-2 only** | FFX-2.exe build 25501027 (`research/re-ffx2-*.md`) |
| The draw adapter (engine stream → raw 31-bit draw), the fixture loader, `int32` helpers | **both** (plumbing) | — |

The two games share almost nothing at this level: different RNG update (FFX xors a 16-bit
constant; FFX-2 multiplies by 5 and adds), different hit rolls (FFX `% 101` with a nine-step
table; FFX-2 a linear sum), different crit rolls (FFX `% 101`, Luck stacks +1; FFX-2 `% 100`,
Luck stages ×5), different damage curves. No change below is "both" except the plumbing.

## 2. What is wrong today — measured on the engine at 157562f8

Each row was run side by side (engine versus kernel, same inputs) by the lane named; the kernels
themselves match the game's own machine code, emulated, on every vector (§4).

**FFX** (lanes: RNG/hit/crit, damage)
- Crit: Luck and Jinx stacks add +10 each in the engine, +1 in the game (0x789690). Five stacks:
  111 versus 21.
- Hit: Darkness divides the final chance by 10, only for commands with the Darkness flag; the engine
  divides accuracy by 4 and waives it on a 90-point Luck lead (single wiki source). Target Luck is
  floored at 1 in the engine, raw in the game. Evade & Counter forces a miss in the game. Aeon
  Attack accuracy multipliers ×2.5 / ×1.5 are dead data in the engine.
- Damage: natural DEF/MDF 0 raised to 1 (STR 4, power 4: 6 versus 7); target Cheer/Focus applied
  to formulas that have no such term (Cure with Focus 5 on the target: −512 versus −768);
  multi-element priority wrong (absorb fire + resist ice: engine absorbs, game halves); modifier
  order differs (3 to 4 percent of ordinary hits off by one); Armored keyed on damage type instead
  of the command's pierce bit; the 9999 buff read on the target instead of the user; Berserk on
  every physical command instead of the default attack only; Magic Booster and Alchemy keyed too
  broadly; nine formulas missing.
- Draw order: the game draws hit, then variance, then crit; the engine hit, crit, variance. The
  game loops targets outside hits; the engine hits outside targets.

**FFX-2** (lane: damage; hit/crit/status lane pending)
- Rounding: the engine computes in floats with one truncation; the game truncates after every
  step. Physical hits differ on 70 percent of samples, up to 27 points.
- Variance applied where the game has none: 55 of 285 shipped damaging abilities (%-current,
  fixed-no-variance, %-total, deal-9999). Percent-current power 4 on 5,000 HP: 1,171–1,323
  versus always 1,250.
- Piercing formulas drop the ×270/255 term and the target's DEF/MDEF stage (13 abilities).
- `user-max-hp` divides by 10 instead of 16 (Charon: 4,000 versus 2,500).
- All-target halving: the game halves after Shell/Protect, for any all-flagged command the player
  aimed at all; never for scripted monster commands. Chain multiplier `(n+28)/20` in integers;
  the engine's float `1.4 + 0.05n` loses a point on 378 of 39,600 pairs.
- Crit (main session's own reading of 0x617230): chance = Luck − target Luck + 5 × stage
  difference, or the ability's crit byte; the engine's `⌊(luck − tLuck)/4⌋` is about a quarter
  of it.

## 3. Acceptance cases

1. Every `tests/unit/parity-*.test.ts` passes, including its fixture block (reduced emulator
   vectors in `tests/fixtures/parity/`). The full local vector sets (`D:\Tools\ffx-parity\vectors`)
   pass through the same kernels in one local script run, recorded in the handoff note.
2. **Engine-level parity test per batch**: drive the engine's own damage (or hit, CTB, ATB) path on
   a few hundred generated situations and assert it equals the kernel with the same draws. This is
   what proves the wiring, not only the kernels.
3. `tsc` clean; `npm test` green in the main tree before any push, except goldens re-baselined on
   purpose (`ffx-engine-golden`, `ffx2-atb-golden`, chapter benches), each in the same commit as the
   change that moves it, with the reason "game-code parity".
4. `node tools/orphans.mjs`: no kernel module left unimported after its batch.
5. The three hand-kept mirrors follow the change: `ffx/estimate.ts` `statusOdds`,
   `ffx2/intent.ts` `statusOddsFFX2`, `engine/tactics/advisor-roll.ts`; the forecasts in
   `ffx/simulate.ts` / `ffx2/simulate.ts` keep running the real engine on a clone.
6. A real-input browser check of one FFX and one FFX-2 chapter with a screenshot under
   `docs/screenshots/re-parity/` (damage numbers on screen are the visible effect).

## 4. Evidence that stays reusable

- The kernels and their emulator proof: FFX hit 10,606 and base damage 9,876 harness vectors plus
  the damage lane's 690,000 (whole per-hit pipeline 270,000, mutation-checked); FFX-2 hit 23,670,
  base damage 11,857, per-target orchestrator 33,440; both RNGs 3,300 each. Zero differences.
  The main session re-ran the harness self-test (24 checks) and the port checks (38,939 vectors,
  0 mismatches) itself.
- The research notes `research/re-ffx-rng-hit.md`, `re-ffx-damage.md`, `re-ffx2-damage.md` (and
  the pending CTB, ATB and status notes) are the citations for every number the wiring adds.
- Existing chapter tests and the strategy benches stay; their expectations move only where a
  mechanic moved.

## 5. Before-and-after measurement (balance)

Parity will move difficulty in all 18 chapters (example: FFX-2 crits roughly four times as likely;
FFX Luck stacks almost worthless for crits). Bailey's standing rule: never tune boss numbers;
build and measure each sourced answer, then ask once. For each batch, before (main 157562f8) and
after (branch):
- `intendedStrategy` auto-battler, the harness of `tests/unit/advisor-noop-guard.test.ts`,
  every chapter of the batch's game, 12 seeds: wins, losses, mean party turns, party KOs.
- The existing benches of the chapters touched (`strategy-*`, `combat-fixes-bench`,
  `ffx2-engine-fixes-bench`, `iter2-b1-bench` with `PYREFLY_MEASURE=1`).
- A chapter whose win rate moves by 2 or more of 12 seeds is reported to Bailey with the cause;
  nothing is retuned without his answer.

## 6. Batches and conditions

| Batch | Scope | Ready | Conditions |
|---|---|---|---|
| W1 | FFX hit, crit, base damage, modifier order, element, clamp; the draw order; per-command fields the kernels read (accuracy formula and byte, crit bonus, flag bits, damage-class bits, command type) added to the FFX ability data from the game's command table, each with a citation | now | data fields cited to the command records; the advisor mirrors follow; measurement §5 |
| W2 | FFX CTB (tick table, initial CTB, rank delay, Haste/Slow, Delay, ties) and status infliction and ticks | after the CTB/status lane | same |
| W3 | FFX-2 hit, crit, base damage, per-target order, element, chain counter, all-target halving with the player's choice recorded, status infliction, steal | after the FFX-2 hit/status lane commits `ffx2/kernel/rng.ts` | same; the "magic never misses" rule (AGENTS.md rule 5) is checked against each ability's accuracy formula and any conflict goes to Bailey before wiring |
| W4 | FFX-2 ATB (speed per step, recovery, thinking, charge, opening gauge, delay, interruption) and status timers, Poison/Regen | after the ATB lane | the real-seconds conversion waits for the 30-or-60 logic-rate check; until then the engine keeps its clock rate and only the formulas change |

Not in these batches: adopting each game's own RNG (P3) — a decision for Bailey, it moves every
replay; the chain window length (set by hit-reaction animations, not a number in the exe); boss AI
(wave 4).

## 7. Risks

- **Replays move.** Draw order and counts change, so every seeded golden and critic replay moves
  even where the numbers are right. Re-baseline once per batch, with the reason.
- **Data gaps.** A kernel input the engine cannot supply would silently fall back to a default.
  Each batch lists every kernel input and its engine source; an unsourced input is an error, not a
  default (the `canMiss` lesson of rule 5).
- **File size.** `ffx/formulas.ts` and `ffx2/formulas.ts` shrink as the kernels take over; adapters go
  in new files rather than growing old ones past 400 lines.
- **Shared tree.** The wiring happens on branch `re-parity` only; nothing merges to main without
  the focused review, and release follows `critic/RUBRIC.md` (DEEP: focused before the deploy, deep
  on the live build).
