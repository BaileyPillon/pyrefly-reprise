# Paper preflight: RE parity RC10, lane FFX hit order and recoil (gap-scan rows S1, S2, S3)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only, written before anything is built. The change is the core hit loop of the FFX engine
> (`src/battle/ffx/abilities.ts`, `hit-apply.ts`), so `node tools/critic-plan.mjs --paths` classes it **DEEP**; it is built behind switches and moves
> `ffx-engine-golden`.
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into
> our game"; 2026-10-17 "continue on please". Source note: `D:\Tools\ffx-parity\coverage\ffx\FFX-H01.md` (private, not in the repo), sections 3.4 to 3.7, 5 and 7
> (rows 1, 3, 5 and 7). Gap scan: `coverage\gap-scan-2026-10-17.md` section 3, rows S1, S2, S3.
>
> **Verdict: PROCEED** on branch `re-parity-rc10-ffx-hit-order`, cut from `origin/r51-rc` (`d6dc0bdd7`), with the limits of section 7 disclosed. Nothing deploys without Bailey's word.

Written 2026-10-17 by the lane (a Sonnet sub-agent of the RE parity session).

## 1. Game case (AGENTS.md rule 14)

| Row | Case | Why |
|---|---|---|
| S1 hit order inside a multi-hit, multi-target action | **FFX only** | FFX.exe 0x007892e0 (orchestrator), 0x0078d980 (results driver), 0x0078f060 (hit applier). FFX-2 has its own strike resolver (`src/battle/ffx2/resolve-strike.ts`) and its own timeline |
| S2 Drain and Osmose recoil | **FFX only** | FFX.exe 0x0078a240 (the recoil append). FFX-2's Drain is `ffx2/resolve-strike.ts:251`, a different engine and a different exe |
| S3 `kernel/ctb.ts#actionRank` | **FFX only** | FFX.exe 0x007895b0. FFX-2 times its turns with an ATB gauge |

`src/battle/ffx2`, `src/data/ffx2`, `src/battle/ff7`, `src/audio` are not touched. `ffx2-atb-golden` and `ff7-golden` are run and must stay byte for byte.

## 2. The game's order, from the note (labels are the note's: [E n/m] emulated, [E-scn] a scripted run of the game's code, [R] read only, [I] inferred)

1. **Calculation is target by target, slot ascending, every hit of a slot before the next slot** [E L1 30,000/0; E L2 12,000/0, 0 call-order violations, 7,816 runs with two or more
   targets] (§3.4 step 5, §5): per slot, the hit pipeline's draws in hit order (the user's streams: hit check mode 1, variance and crit mode 0, status mode 2), then that slot's Steal
   draws (stream 10, then 11 on a success), then the next slot. **Nothing is applied yet.**
2. **The recoil record is appended last** (§3.4 step 6) [E L1 arguments and call position; the record's own arithmetic is open question 3, [R]]: with the action-wide landed-hit counter
   non-zero, one record on the user with flag 0 carrying the three running sums; else, if the user's own slot was targeted, the record with flag 1 (an empty class mask: it changes
   nothing); else the record is cancelled. The user's own slot, when the user holds an absorb record (Drain, Osmose, Lancet, the two Furies of those), is **counted and skipped**: no
   calculation against itself (§3.4 step 5, first bullet; [E L1] 2,412 vectors).
3. **Application is round by round** (§3.6, §3.7) [E 40,000/0 applier; E 30,000/0 driver; E 8,000/0 calculation-then-application chain; **E-scn 47 scenarios**]: one call of the results
   driver visits every slot in the selection, ascending, and the applier applies at most one hit per matching record. Call k therefore applies hit k of every target that has one. The
   user's recoil record is one pending hit on the user's slot, so it is applied in call 1, in slot order among the round's targets.
4. **A target's death check runs in the call that applies its last hit** (the call after which it has no hit pending), then again in every later call (a no-op once it is dead or while
   HP is above 0). With equal hit counts both deaths fall in the last call, lower slot first; **the lower slot's death handling happens before the higher slot's last hit has been subtracted**
   (§3.7 "Consequences", [I] from the scenarios).
5. The 47 scenarios: 32 with one target (H = 1 to 16 hits, counter armed or not) and 15 with two targets ((H1, H2) = (2,5), (5,2), (1,16), (3,3), (4,1), armed on one, both or neither).
   In every one: H (or max(H1, H2)) driver calls; call k applies hit k of each target that has one, targets ascending; **one counter per armed target, in call 1**; the death check in the call
   that applies the last hit; the action-done call in the last call only.
6. **S3:** the user's CTB rank is stored at the first calculation from the **command ids of entry 0** (the record of the last id found; ids 0x3029, 0x305F and 0x311E end the scan; 3 when
   none is found or the byte is 0) and every sub-action reads entry 0 [E 8,000/0, 1,920/0 over every one of the 320 rows, 2,400/0 end to end]. The note's section 7 says the engine
   matches for ordinary commands, Doublecast and the 46 rank-0 rows, and that B2 fixed the two Overdrive Fails: no behaviour difference is left.

What is **not** known (open question 1 of the note): which frame each hit lands on, and with which selector, is set by the animation scripts; they were not read. The rule above is what
the driver does when it is called for all slots, and the post-action pass **always** flushes what is left with the all-slots selector (§3.9), so round by round is the rule's floor. The engine
ports the rule, not the animation timeline (its hook cadence stays "B", as the note says).

## 3. The engine today (file:line at `d6dc0bdd7`)

| Where | What it does |
|---|---|
| `abilities.ts:215-230` | three loops. Planned Overdrive (`plan`): per target, all hits, then `finishTouched`. Spread or script-aimed (`perHitRandom`): all targets' hits, then one `finishTouched` for the lot. Everything else: per target, all hits, then `finishTouched` for that target |
| `abilities.ts:117-130` | `finishTouched`: touched targets sorted by the index of their **last hit in calculation order**, each: Tidus's counter update, the script's `onHit`, `settleDeferredDeath` (the death check: loot on streams 10 and 11, Auto-Life, SOS, queue cancel) |
| `hit-apply.ts:122-335` | `resolveOneHit` = `applyOneHit` (calculation **and** application of one hit fused: the pipeline, the HP / MP / CTB write, the status write-back, Auto-Med / Auto-Potion decisions, the scripted extras incl. Steal) then `noteCounterHit` |
| `hit-apply.ts:244-247, 282-284` | Drain / Osmose / Lancet: **per hit**, the target's MP is drained and the user gains it at once, the user is healed the hit's HP at once (`healOutsideChain(... 'drain')`) |
| `state.ts:220`, `execute.ts:93, 264, 344` | `rankOf(def)`: the ability's own `rank` (copied from its record by `attachCommandRecords`), 0 becomes 3. `kernel/ctb.ts#actionRank` has fixture tests and **no importer** (hard rule 4) |

The calculation order of the engine (target by target, slot ascending when the kernel builds the targets, `target-build.ts` header) **is already the game's** (step 1 above). What differs is the
order of what the game does at application: the engine decides each target's death and runs its script **before the next target's hits are calculated**, and orders the deaths by calculation
index instead of by round.

## 4. The change

**S1 `src/battle/ffx/hit-order.ts` (new) behind `HIT_ORDER_ROUND_ROBIN = true`.** `resolveAbility` runs a row's passes (the built targets with their hit counts; not a script-aimed row, whose
hits are separate commands in the game, `target-build.ts#buildAimedAction`) in two phases:

1. *Calculation*, exactly as today: target by target, every hit through `resolveOneHit` (so every draw, every running HP / MP / CTB figure, every status record is what it was). The events each
   hit emits are **captured** (`ctx.emit` is swapped for the duration of the hit and restored in a `finally`), one buffer per (target, hit).
2. *Application order*: round r = 1, 2, ... up to the largest hit count; in a round, the passes in ascending game slot; the buffer of (target, r) is replayed through the real `emit` (so `seq`
   is assigned in the game's application order); in the round of a target's last hit its finish step runs right after (Tidus's counter update, the script's `onHit`, the death check). The
   recoil of S2 is one more entry of round 1, at the user's slot.

`false` runs the three old loops unchanged. `hitIndex` / `hitCount` on damage events keep their calculation-order meaning (no event is edited, only reordered).

**S2 `kernel/recoil.ts` (new, pure) behind `DRAIN_RECOIL_ONE_RECORD = true`.** The three sums are kept on the `HitScope` (HP of landed hits, MP actually drained, the landed-hit count, whether the
user's own slot was targeted); one decision function gives the game's three answers (record with flag 0, flag 1 = empty, cancelled). The user is healed **once**, with the sums, in round 1 at its
slot; an absorb command aimed at its own user skips that slot's calculation. Signed HP sums that end at or below 0 do nothing (the record's arithmetic for a net healing of the target is open
question 3, so not modelled; no shipped target produces one).

**S3 `state.ts#rankOf`** reads the rank through `kernel/ctb.ts#actionRank` (`[record id, 0xff]`, Copycat flag 0 because Copycat is not in the engine) when the ability has a game record id, and as
before otherwise. A test enumerates every ability in the registry and proves old and new rank equal; the orphan check then reaches `actionRank`. No switch: equal by proof.

Not changed, by the note: the counter queue (already once per armed target; counters are single-target only in the engine), Steal (single-target in every shipped row; the zero-hit case is the
note's open row 6), Quick Pockets (= N4), the clock holds (by design).

## 5. Who can see it: the census (12 seeds of every FFX chapter on the base `d6dc0bdd7`; events of every link's log, counted per action)

| Action | Chapter(s) | Actions | Targets 2+ with a target hit 2+ times | Unequal hit counts | With a KO |
|---|---|---:|---:|---:|---:|
| Fire Gem (5-hit random spread over Seymour Flux and the Mortiorchis) | I | 118 | 107 | 107 | 38 (2 with two KOs) |
| Ice Gem (same) | I | 14 | 13 | 13 | 11 (3 with two KOs) |
| Total Annihilation (all party, 5 hits each) | I | 2 | 2 | 0 | 0 |
| Photon Spray (random spread over the party) | VIII and the hidden exp-fayth | 75 + 75 | 75 + 75 | 68 + 68 | 1 + 1 |
| Fire Fury (Lulu's Overdrive, planned spread) | XVII and the hidden sinspawn-gui | 10 + 3 | 7 + 3 | 5 + 3 | 0 + 1 |
| Absorb (Yunalesca, drain, one target) | II | 138 heals | - | - | S2 only |
| Lancet (Kimahri, HP and MP drain, one target) | VIII, hidden exp-fayth and biran-yenke | 82 + 82 + 89 heals | - | - | S2 only |
| Steal (Rikku, one target) | VII | 24 | - | - | unchanged (single target, no deaths between targets) |
| Bribe | none (the command is not in the engine: `ActorRuntime.bribed` is never set) | 0 | | | |

No other chapter meets a multi-target multi-hit action or a drain in 12 seeds (II, III, VII, IX, X, XII, XIV, XVIII show none of the first kind). The census is repeated on the tip and on 500 seeds for
the movers (§9).

The bosses' scripts that hear `onHit` and are therefore ordered by S1 are in `ai/*.ts` (`listensToHit`): Seymour Flux and the Mortiorchis (Fire and Ice Gem, Total Annihilation), Evrae (Photon Spray),
Sin's parts (Fire Fury). No script of the above acts on another target of the same action before the action is over except through queued reactions (the Mortiorchis's Mortibsorption is a queued
reaction, `ai/reaction-drain.ts`).

## 6. RNG streams it re-aligns

- **None of the calculation draws.** Streams 5 and 6 (spread, Reflect), the user's hit / variance / crit / status streams (20 to 67) and the Steal pair (10, 11) are drawn in the same order as before:
  calculation stays target by target.
- **The death-time draws, streams 10 to 13** (`adapt/loot.ts`: two item slots on stream 10, stream 11 after a success, one gear draw on stream 10), now follow the game's death order across the targets
  of one action. They differ from today only when an action kills **two or more** targets whose last hits fall in different rounds (unequal hit counts: Fire Gem, Ice Gem, Photon Spray, Fire Fury; 3
  Ice Gem and 2 Fire Gem actions in 12 seeds kill two) or whose order the old sort by calculation index got wrong. They then pay the loot of the other monster first.
- Stream 9 (pose picks) and the bribed kill's killer stream: not reached (no pose draws in the engine, no Bribe).

## 7. Risks and what stays unmodelled

1. **A target's hits are applied (HP, statuses) at calculation time, not in the round.** Only the log order and the death-handling order are the game's; when a lower slot's death handling runs, the
   engine's higher slot already carries all its hits (the game's has not yet received its last). Nothing in the shipped scripts reads a sibling's HP in its `onHit` (the scripts above read their own
   target and the queue); a full split of calculation from application is the larger refactor and is **not** attempted (named open item).
2. **The presenter** sees damage events from different targets alternate (A1 B1 A2 B2) and a drain's heal in the user's slot order (a party user's heal before the monster's damage in the same round). The
   events are unchanged, only reordered; `hitIndex` stays the calculation index. Checked by the presenter-facing test files that replay engine events, and recorded in the handoff.
3. **Unequal counts of a spread** move the order of the deaths of Fire Gem / Ice Gem in Chapter I, a boss fight with `onHit` scripts on both bodies: this is the cause the measurement must show per seed.
4. **Event capture swaps `ctx.emit` for one hit.** A hit's code that read the log while it ran would see nothing of its own hit (none does: `engine.ts` reads the log before and after the action only). The
   swap is restored in a `finally`; nested `resolveAbility` calls nest.
5. **Animation timing (open question 1).** If the game's scripts apply hits with per-target selectors for some animation, the observed order for that animation is per target. The rule ported is the one
   the post-action flush guarantees.
6. **Merge hot spots:** `abilities.ts`, `hit-apply.ts`, `state.ts` (other RC10 lanes may touch them; keep both sides).

## 8. Rollback switches

`HIT_ORDER_ROUND_ROBIN` and `DRAIN_RECOIL_ONE_RECORD` in `src/battle/ffx/hit-order.ts`: set either to `false` and that part runs the code that is there today (the three old loops stay in `abilities.ts`; the
per-hit drain stays in `hit-apply.ts`), proved by the ablation in the measurement (all 500 seeds of every moved chapter byte-identical to the base with both off). S3 has no switch (equal by proof).

## 9. Acceptance

1. `npx tsc --noEmit` clean; every source file under 400 lines; `node tools/orphans.mjs` shows `hit-order.ts`, `kernel/recoil.ts` and `kernel/ctb.ts#actionRank` reached.
2. The 47 scenarios of the note run against the scheduler and (for the cases the engine can set up) the real engine, compared with an independent oracle written from the note's rules (a model of the
   driver, sharing no code with `hit-order.ts`): damage-event order, the death order, one counter per armed target, `action-end` last.
3. S2: the recoil decision vs. a table written from §3.4 step 6 (flag 0 / flag 1 / cancelled); engine cases: a multi-hit Drain heals once with the sum, a self-aimed absorb is skipped, a miss heals nothing.
4. S3: all registry abilities, old rank = new rank; the kernel fixture test still passes.
5. A mutation pass of about 15 faults over the production code (each caught by a test).
6. Goldens: `ffx2-atb-golden` and `ff7-golden` unchanged; `ffx-engine-golden` re-pinned only for the digests that move, with the cause in its header.
7. Measurement: 12 seeds of every FFX chapter, base against tip (event-log digests); every chapter whose log moves is named with its cause (ablation: each switch alone); movers at 500 seeds with first-try wins
   before and after. No boss or party number is retuned.

## 10. Addendum written after the build (2026-10-17)

The preflight said the calculation order stays. The first 12-seed measurement showed that it did not need to: the engine's **cheap target path** (nothing to cover or reflect) keeps the order a group command's targets come in, the party's formation order, where the game visits the lowest slot first (the note's 12,000
level-2 vectors). That is a fourth cause, so it got its own switch, `HIT_CALC_SLOT_ORDER` (on), and the ablations tell the three causes apart: it alone moves every outcome that moves; the rounds (`HIT_ORDER_ROUND_ROBIN`) and the one recoil (`DRAIN_RECOIL_ONE_RECORD`) move only the log and the deaths. Details and the 500- and 2,000-seed
measurements: `docs/handoff/re-parity-rc10-ffx-hit-order.md`.
