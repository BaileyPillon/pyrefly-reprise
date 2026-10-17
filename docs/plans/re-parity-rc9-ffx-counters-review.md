# Paper preflight: RE parity RC9, lane FFX-G slice G-c (counters, the holder's default attack, reach as a 4-level rule)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/ffx/counter-chain.ts,src/battle/ffx/kernel/counter.ts,src/battle/ffx/hit-apply.ts,src/battle/ffx/engine-end.ts,src/battle/ffx/targeting.ts,src/battle/ffx/reach.ts`
> classes this as **DEEP** (the FFX CTB engine is a shared system; FFX game data; the combat core).
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please"; 2026-10-15 "keep going please all of this reverse engineering needs
> to be incorporated into our game" and "keep going please full speed ahead". The wiring plan marks lane FFX-G **Bailey first: no**
> (`D:\Tools\ffx-parity\coverage\wiring-plan-draft-2026-10-11.md`, lane FFX-G; rows G10, G11 and G12 are its slice G-c; slices G-a and G-b landed in RC4).
>
> **Verdict: PROCEED** on branch `re-parity-rc9-ffx-counters`, cut from `origin/r49-rc` (`f939b87f`). Nothing deploys without Bailey's word.

Written 2026-10-15 by the lane (a Sonnet sub-agent of the RE parity session).

## 1. Game case (AGENTS.md rule 14)

| Row | Case | Source |
|---|---|---|
| G10 when a counter fires | **FFX only** | FFX-G04 §1, §4.3, §8 row 15 (FFX.exe 0x0078c1d0, 0x0079e340, 0x0078d8d0). FFX-2 has its own counters (FFX2-G04 / lane X2-D) |
| G11 the holder's own default attack | **FFX only** | FFX-G04 §8 row 17; FFX-H02 §3.2 line 82 (the character initialiser 0x0079b4f0) |
| G12 reach as a 4-level rule | **FFX only** | FFX-G04 §4.7 and §8 row 19 (0x00799690, 0x00791fa0); FFX-2 reach is its own |

`src/battle/ffx2`, `src/data/ffx2`, `src/audio` are not touched. `ffx2-atb-golden` and `ff7-golden` are run and must not move.

## 2. The three blockers of the plan, and how each was settled (reads of the exe, no game run)

| Open question | Blocks | Settled how | Answer |
|---|---|---|---|
| FFX-G04 oq 10: how many counters a multi-hit action queues | G10 | read the decompiled orchestrator, per-target step and apply function (the private note's `work\0078f060.dec.txt`, `00789740.dec.txt`, `007892e0.dec.txt`) | **one per target per command**: all hits are calculated before any is applied; the armed flag is one byte; the first apply queues and clears it |
| FFX-G04 oq 4: what `Chr+0x6dd` and `Chr+0x446` do | none of G10 to G12 | a linear scan of the whole `.text` section for memory operands with those displacements (`D:\Tools\ffx-parity\rc9\ffx-counters\scan_disp.py`, 2,760,405 instructions, read only) | presentation: `+0x6dd` has one reader, the position getter; `+0x446` is script property 0xe0, read by animation helpers |
| FFX-G04 oq 5: the Tidus-counter reader 0x007b7d00 | G14 only (landed) | not needed for G10 to G12; left open | unchanged |

Two more things the plan did not know: the holder's default attack is the constant 0x3000 for every party member **and aeon** (the initialiser's non-monster branch, the field has no other writer in the executable), so row G11 changes
nothing in effect; and the Mortiphasm discs' BattleDistance is **2** (the formation script's init worker), which G12 needs to replace the Chapter XII flag.

## 3. What changes

1. **G10** `kernel/counter.ts` (three functions, the game's counter kind, harmful test and queue), `adapt/counter.ts`, `counter-chain.ts`: every hit that is not a "no effect" outcome arms its target; the first hit that arms decides (can the holder act now?); the answer is queued
   in `FFXRuntime.counters` and run by `engine-end.ts#afterAction` as the old equipment counter was. `ticks.ts#collectReactions` goes. A reaction attacker meets no counter and no forced miss.
2. **G11** the counter is `{ kind: 'attack' }`, the holder's default attack; pinned by a test with the reading of the initialiser; the monster side (a forced-action word per monster) is listed as an open data item.
3. **G12** `kernel/command-reach-table.ts` (the target word of the 979 command records), `reach.ts#reachOf`, `targeting.ts#reachesTarget` = reach against `battleDistance`; the Mortiphasm discs (2) and Sin's Genais Core (3, then 0) use it instead of `outOfMeleeReach`.

## 4. Acceptance cases

1. Kernel: 1,830 emulator vectors (840 counter kind, 550 harmful, 440 queue; a stratified subset of 28,000 + 20,000 + 14,000) replayed with 0 mismatches; hand-worked rules from the note.
2. Engine: 4,000 generated boards against an independent oracle (answers, cause, once per command, can-act, reaction attacker, no-effect, harmless statuses, group commands, lethal blows), plus named cases and the end of the action through `afterAction`.
3. Reach: the table equals the note's counts (204 / 8 / 638 / 129), agrees with the hand-written reach-0 set on every shipped party and aeon command, and the engine reaches/refuses by distance 0 to 3 for twelve named commands.
4. A mutation pass over the production code of the lane (every rule put back or broken is caught).
5. Goldens: `ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden` unmoved (no shipped build wears a counter ability; the line meets no disc or Core target a changed reach rule refuses). Any digest that moves is re-pinned once with the cause written in the file.
6. Measurement: 12 and 500 seeds of every FFX chapter before and after; expected **no chapter moves** (Chapters XII and XVII are the only ones that meet changed reach rules).
7. `tsc` clean, every source file under 400 lines, `node tools/orphans.mjs` shows `counter.ts` and `command-reach-table.ts` reached.

## 5. Risks

- **A visible reach change (G12).** Steal and the reach-1 commands stop reaching a disc; items and Valefor's Energy Ray stop reaching the Core while Genais stands. Both are the game's rule with a read distance; the line the party plays (Wakka, spells) is unaffected. Disclosed in player words.
- **The counters are latent in the shipped chapters** (no build wears Counterattack, Evade and Counter or Magic Counter): the rules are proven by the kernel vectors and the engine-level boards, not by a chapter measurement.
- **Merge hot spots**: `hit-apply.ts`, `engine-end.ts`, `targeting.ts`, `runtime.ts` (other RC9 lanes touch the engine files near these: keep both sides).
