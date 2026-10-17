# Re-parity RC10, lane FFX hit order and recoil (gap-scan rows S1, S2, S3): an action's hits are applied round by round, Drain heals once, and the rank is asked of the game's rule

Status: **built, tested, measured and pushed on branch `re-parity-rc10-ffx-hit-order`; not merged, not deployed** (2026-10-17). Cut from `origin/r51-rc` (`d6dc0bdd7`). **Game case: FFX only** (AGENTS.md rule 14): the orchestrator, the results driver, the hit applier and the recoil
append are FFX.exe functions (0x007892e0, 0x0078d980, 0x0078f060, 0x0078a240, 0x007895b0); FFX-2 has its own strike resolver and its own timeline. `src/battle/ffx2`, `src/data/ffx2`, `src/battle/ff7` and `src/audio` are untouched; `ffx2-atb-golden` (6) and `ff7-golden` (3) pass unchanged.
Owner: Bailey. His words, as the brief quoted them: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-17 "continue on please". Deploys need his word.
Sources: the private note `D:\Tools\ffx-parity\coverage\ffx\FFX-H01.md` (sections 3.4 to 3.7, 5 and 7 rows 1, 3, 5 and 7) and the gap scan `coverage\gap-scan-2026-10-17.md` section 3 (rows S1, S2, S3). Condensed in [`research/re-ffx-hit-order.md`](../../research/re-ffx-hit-order.md). Paper preflight (written and pushed first): [`docs/plans/re-parity-rc10-ffx-hit-order-review.md`](../plans/re-parity-rc10-ffx-hit-order-review.md).

## 0. In one paragraph

The game **calculates** an action's hits target by target, lowest slot first, and **applies** them round by round (hit 1 of every target, then hit 2 ...), handling each target's death in the round of its last hit. The engine already calculated in the first
order for a target kernel's output but not for the cheap path (a group command went through the party in formation order), and it ran each target's death before the next target's hits were calculated. Now: calculation is by slot (`HIT_CALC_SLOT_ORDER`), the events replay round by round and each death
runs in its round (`HIT_ORDER_ROUND_ROBIN`), Drain, Osmose, Lancet and the two Furies heal their user once after every target (`DRAIN_RECOIL_ONE_RECORD`) and skip their own slot, and `rankOf` asks `kernel/ctb.ts#actionRank` (S3, equal to the plain rule for every ability).
**Two findings the paper preflight did not have:** (1) the slot order of calculation was wrong in the engine's cheap target path, which moves nearly every chapter's log through other draws (section 6): it is its own switch so the causes can be told apart; (2) the hit-order change alone
(B) moves no outcome in any chapter, only the order of events and deaths. No boss or party number moved.

## 1. Commits (oldest first, on `re-parity-rc10-ffx-hit-order`)

| Commit | What | Case |
|---|---|---|
| `d1f99ec4c` | The paper preflight (`docs/plans/re-parity-rc10-ffx-hit-order-review.md`) | FFX only; docs |
| `24bce9008` | The code: `hit-order.ts` (the scheduler: capture, slot order, rounds, the recoil), `kernel/recoil.ts` (the append step's three answers), `abilities.ts`, `hit-apply.ts`, `state.ts#rankOf` | FFX only |
| `ee563db43` | The tests: the note's 47 scenarios against a model of the results driver (scheduler and engine), the recoil table and engine boards, the registry-wide rank equality | FFX only; tests |
| `cbc06c21d` | `HIT_CALC_SLOT_ORDER` as its own switch (the measurement found the cheap path's order) | FFX only |
| `6caf6324b` | Seven existing tests that pinned the old order now pin the game's; the cases the mutation pass showed missing | FFX only; tests |
| `dfb2eb65f` | `ffx-engine-golden` re-pinned for ten digests, the three causes in its header | FFX only; test |
| `93851391b` | A test: the engine's drain flags equal the record's absorb bit for every ability that has a record | FFX only; test |
| (the commit after them) | This note and `research/re-ffx-hit-order.md` | FFX only; docs |

## 2. The rows

| Row | What the engine did | What it does now | Switch |
|---|---|---|---|
| S1 order of application | Each target's hits, then its death handling, then the next target; the deaths of a spread ordered by the index of the last hit in calculation order | Every hit still calculated target by target (so every draw is where it was), the events each hit emits **held** and replayed round by round, slots ascending; a target's finish step (Tidus's counter update, the script's `onHit`, the death check with its loot) runs right after the replay of its last hit | `HIT_ORDER_ROUND_ROBIN` |
| (found) calculation order | A group command with nothing to cover or reflect went through its targets in the order they came (the party's formation order) | Ascending game slot, as the kernel path already did (`target-build.ts` header) and as the note's 12,000 level-2 vectors show the game does. A script-aimed row keeps the order its script named | `HIT_CALC_SLOT_ORDER` |
| S2 Drain, Osmose, Lancet, the two Furies | The user healed (HP) and fed (MP) hit by hit; nothing for a drain aimed at its own user | The sums of the whole action (HP of landed hits, MP actually drained) heal the user once, HP then MP, in round 1 at the user's slot; the user's own slot is skipped, and with nothing landed and the user targeted the record is empty (the note's flag 1) | `DRAIN_RECOIL_ONE_RECORD` |
| S3 `kernel/ctb.ts#actionRank` | Imported by nothing (hard rule 4) | `rankOf(def)` asks it (`[record id, 0xff]`, Copycat flag 0 since the engine has no Copycat); equal to the plain rule for every ability of the registry (test) | none (equal by proof) |

Not changed, by the note: counters (one per armed target, decided at the first hit that arms: single-target commands only in the engine, so the multi-target armed scenarios of the note never arise), Steal (single-target rows only), Quick Pockets (= N4), the clock holds (by design).

## 3. The proof

- **The oracle** is a model of the game's results driver written from the note (`driverModel` in `tests/unit/parity-ffx-hit-order.test.ts`): call after call, every slot ascending, one hit per slot, the counter queue once per armed byte, the death check when no hit is pending. It shares no line with `hit-order.ts`.
- **The note's 47 scenarios** (32 with one target, 1 to 16 hits, armed or not; 15 with two targets (2,5), (5,2), (1,16), (3,3), (4,1), armed on none, one or both) run through the scheduler (`runInRounds`) with the model's order of hits and deaths, the model's counter order (queued in slot order, once per armed byte) and the call count (= the largest hit
  count), and the ones an engine board can set up run through `resolveAbility` as well (the 32 one-target scenarios and the (3,3) pair directly; the four unequal pairs (2,5), (5,2), (1,16) and (4,1) by finding the seed whose spread deals exactly that pair, and one more, (3,4); 400,000 seeds searched at most).
- Engine cases: slot order beats formation order (hit index 0, 2, 4, 1, 3, 5 for three targets of two hits), a script-aimed row is untouched, `ctx.emit` is restored when a hit throws, `seq` stays the log index, one counter for a single-target multi-hit hit and none for a group.
- **S2**: the append step's three answers over 36 combinations, and engine boards: one heal with the summed amount for two targets of three hits; the heal before the monsters' damage for a party user and after the party's for a monster; Osmose's gain is what the targets actually lost (one target had less than a hit takes); a self-aimed drain does nothing and a group drain skips its caster; a drain turned aside by a Nul heals nothing; HP then MP for Lancet; the engine's drain flags equal the record's absorb bit for every ability.
- **S3**: every ability of the registry (`ALL_ABILITIES`, hundreds of records), `rankOf` = the record's rank byte (0 is 3); the scan rules (stop ids, the last record, none is 3).
- **101 tests in two files** (`parity-ffx-hit-order.test.ts`, `parity-ffx-recoil-rank.test.ts`) and a helper (`tests/unit/helpers/ffxHitOrder.ts`).
- **Mutation pass: 25 faults over six production files, all caught.** The first pass caught 22 and let three live (HP before MP in the recoil, the slot sort of the calculation index, the script-aimed row staying out of it); tests for each were added and the three are now caught. One fault (`ctx.emit` never restored) is caught because the run does not end: the replay loops over the buffer it is appending to (I killed that vitest child by its PID).
  The faults: switches off (3), finish in the last round only / in the first round, slots descending in the replay and in the calculation, calculation reversed, replay of the first segment only, recoil in the last round / at the last slot, `emit` never restored, Osmose out of the absorb test, HP and MP swapped, `landed >= 0`, flag 1 a cancelled record, a net loss gaining, no self-skip, no landed count, no MP sum, a constant HP sum, a double heal, the rank asked of no id, the rank-0 rule removed.
- **Existing tests that moved with the order** (all pinned the old order, each now pins the game's with the cause in a comment): `ffx-overdrive-fail-rows` (Tornado's success hits compared with the fail hits by calculation index), `parity-ffx-ai-hooks` (see open item 1), `parity-ffx-engine-k-zanmato` (two tests: all three status draws, then the two script draws), `parity-ffx-engine-wiring` (events alternate, hit indexes 0, 2, 1, 3), `parity-ffx-rng-streams` (the landed order is round by round), `chapters/yojimbo-callouts` (Zanmato on the party hits Yuna, Kimahri, Lulu: slot order).
- **Test sets run (no full suite, by the brief)**: 160 files `parity-ffx-*` and `ffx-*` (not FFX-2): 6 tests in 5 files failed on the first run, all of them the pins above; 108 chapter files of the FFX and hidden chapters: 2 failed (one is a 15-second timeout under load that passes alone, 34 of 34; the other is the Zanmato order above); 129 presenter, HUD and engine files: only the five known art-only failures (`engine/pose-install-0926`, `-0930`, `-songstress-0929`, `-thief-0926`, `engine/pose-scale-art`: this disk's art differs from the locked hashes); 60 advisor, strategy and intent files: see section 9. The three goldens: section 7.
- `npx tsc --noEmit` is clean; every file is under 400 lines (`hit-apply.ts` 346, `abilities.ts` 291, `hit-order.ts` 123, `recoil.ts` 54); `node tools/orphans.mjs` lists neither `hit-order.ts` nor `recoil.ts`.

## 4. The census (12 seeds of every FFX chapter on the base: which actions meet the change)

| Action | Chapter(s) | Actions | Several targets, one hit twice or more | Unequal hit counts | With a KO |
|---|---|---:|---:|---:|---:|
| Fire Gem (5-hit random spread over Seymour Flux and the Mortiorchis) | I | 118 | 107 | 107 | 38 (2 with two KOs) |
| Ice Gem (same) | I | 14 | 13 | 13 | 11 (3 with two KOs) |
| Total Annihilation (the party, 5 hits each) | I | 2 | 2 | 0 | 0 |
| Photon Spray (random spread over the party) | VIII, hidden exp-fayth | 75 + 75 | 75 + 75 | 68 + 68 | 1 + 1 |
| Fire Fury (Lulu's Overdrive, planned spread) | XVII, hidden sinspawn-gui | 10 + 3 | 7 + 3 | 5 + 3 | 0 + 1 |
| Absorb (Yunalesca) | II | 138 heals | | | S2 |
| Lancet (Kimahri) | VIII, exp-fayth, biran-yenke | 82 + 82 + 89 heals | | | S2 |
| Steal (Rikku) | VII | 24 | | | unchanged (one target) |
| Bribe | none (not in the engine) | 0 | | | |

The census counts events per action; a group command of one hit per target (Hastega, Nulblaze, Blade Blitz, Zanmato) is not in it but is moved by `HIT_CALC_SLOT_ORDER`, which is why more chapters move than the census lists.

## 5. Twelve seeds, base against tip (seeds 1 to 12, every chapter, whole event log of every link)

| Chapter | Seeds | Wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Identical event logs |
|---|---:|---|---|---|---|---|
| I `seymour-flux` | 12 | 12 | 53.3 | 73.2 | 1.1 | 0 of 12 |
| II `yunalesca` | 12 | 12 | 148.5 -> 148.3 | 210.7 -> 209.4 | 12 -> 11.7 | 0 of 12 |
| III `braskas-final-aeon` | 12 | 11 | 240.1 -> 242.5 | 386.2 -> 391.7 | 5.5 | 0 of 12 |
| VII `seymour-anima-macalania` | 12 | 12 | 54.2 | 87.9 | 4.8 | 11 of 12 |
| VIII `evrae-airship` | 12 | 12 | 70.9 -> 69.5 | 88.6 -> 86.8 | 0.7 | 0 of 12 |
| IX `yojimbo-cavern` | 12 | 11 | 65.3 | 92.5 | 3.6 | 11 of 12 |
| X `seymour-natus` | 12 | 11 | 35 | 51.5 | 2.4 | 12 of 12 |
| XII `seymour-omnis` | 12 | 11 -> 12 | 91.5 -> 90.7 | 124.3 -> 122.8 | 0.8 -> 0.4 | 0 of 12 |
| XIV `isaaru-via-purifico` | 12 | 11 | 37.6 | 83.3 | 3 | 12 of 12 |
| XVII `sin-fins-core` | 12 | 11 -> 12 | 314.1 -> 300.2 | 402.2 -> 387.3 | 2.7 -> 2.4 | 0 of 12 |
| XVIII `sin-face` | 12 | 12 | 45.5 -> 45.1 | 50.5 -> 50.1 | 0 | 1 of 12 |
| hidden `mirror-aeons` | 12 | 8 | 187 | 238 | 19.2 | 12 of 12 |
| hidden `sinspawn-gui` | 12 | 12 | 83.7 | 115.3 | 1.1 | 0 of 12 |
| hidden `biran-yenke` | 12 | 12 | 16.5 | 36.7 | 0 | 0 of 12 |
| hidden `exp-fayth` | 12 | 12 | 70.9 -> 69.5 | 88.6 -> 86.8 | 0.7 | 0 of 12 |

**Rollback proof:** with the three switches false, **180 of 180 seeds have a byte-identical event log in every link** (all fifteen chapters). Tooling and method are the RC9 counters lane's (section 11).

### 5.1 The cause of every move (each switch alone on a scratch copy; identical logs of 12)

| Chapter | A calculation by slot | B rounds | C one recoil | All three |
|---|---:|---:|---:|---:|
| I seymour-flux | 12 | **0** | 12 | 0 |
| II yunalesca | **0** | **0** | **0** | 0 |
| III braskas-final-aeon | **0** | **0** | 12 | 0 |
| VII seymour-anima-macalania | **11** | **11** | 12 | 11 |
| VIII evrae-airship, exp-fayth | 1 | 0 | 12 | 0 |
| IX yojimbo-cavern | **11** | **11** | 12 | 11 |
| XII seymour-omnis | **0** | **0** | 12 | 0 |
| XVII sin-fins-core, hidden sinspawn-gui | **0** | **0** | 12 | 0 |
| XVIII sin-face | 1 | 1 | 12 | 1 |
| hidden biran-yenke | 11 | 11 | **0** | 0 |
| X, XIV, hidden mirror-aeons | 12 | 12 | 12 | 12 |

- **B alone** (rounds, with the calculation in the old order) and **C alone** (the one recoil) **move no wins, no party turns, no engine turns and no KOs in any chapter**: they reorder the log and the deaths, nothing in the fight. **A alone** reproduces every outcome that moves (the table above), because it gives
  the variance, critical and status draws of a group command to other targets.
- Chapter I moves through B only (the Fire and Ice Gem spreads over Seymour Flux and the Mortiorchis: the target that takes fewer of the five hits now falls first, and the Mortiorchis's script and loot come in its own round).
- The first differing event, Chapter III seeds 1 to 3: Blade Blitz at the party; the base calculates Lulu first (formation order), the tip Yuna first (slot 1). Chapter VII seed 2 and Chapter IX seed 11 differ late in a long fight at a group command for the same reason.

## 6. Five hundred seeds, base against tip (the twelve chapters that move at 12 seeds)

First-try wins (each seed is one try at the whole chain, played by the chapter's line), seeds 1 to 500 of each chapter that moved at 12 seeds, base against tip. The three chapters that do not move at 12 seeds (X, XIV, hidden mirror-aeons) are identical there and were not repeated.

| Chapter | Seeds | First-try wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Wins lost / won back | Identical event logs |
|---|---:|---|---|---|---|---|---|
| yunalesca | 500 | 453 (90.6%) -> 446 (89.2%) | 157.7 -> 157.1 | 224 -> 223 | 13.6 -> 13.4 | 35 / 28 | 0 of 500 |
| braskas-final-aeon | 500 | 479 (95.8%) -> 478 (95.6%) | 232.1 -> 233.2 | 373 -> 375 | 5.4 -> 5.5 | 3 / 2 | 0 of 500 |
| sin-fins-core | 500 | 432 (86.4%) -> 423 (84.6%) | 295.5 -> 295.4 | 381.8 | 3 | 16 / 7 | 0 of 500 |
| evrae-airship | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 0 of 500 |
| seymour-omnis | 500 | 462 (92.4%) -> 452 (90.4%) | 95.3 -> 94.9 | 129.1 -> 128.7 | 0.8 -> 1.1 | 44 / 34 | 0 of 500 |
| seymour-flux | 500 | 500 (100.0%) | 52 | 70.8 | 0.9 | 0 / 0 | 0 of 500 |
| sin-face | 500 | 500 (100.0%) | 45.3 -> 45.2 | 50.3 -> 50.2 | 0 | 0 / 0 | 25 of 500 |
| sinspawn-gui | 500 | 496 (99.2%) | 80.6 | 110.5 | 0.6 | 0 / 0 | 2 of 500 |
| biran-yenke | 500 | 500 (100.0%) | 16.6 | 36.9 | 0 | 0 / 0 | 0 of 500 |
| exp-fayth | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 0 of 500 |
| seymour-anima-macalania | 500 | 470 (94.0%) | 54.7 | 86.7 | 4.7 | 0 / 0 | 407 of 500 |
| yojimbo-cavern | 500 | 493 (98.6%) | 67.4 | 95.9 | 3.9 | 0 / 0 | 493 of 500 |

- **Wins that moved:** yunalesca 453 -> 446, sin-fins-core 432 -> 423, seymour-omnis 462 -> 452, braskas-final-aeon 479 -> 478; no other chapter wins one fight more or less (sin-face's mean party turns go 45.3 -> 45.2; every other turn and KO mean of the other eight chapters is the base's). Each is inside the noise of 500 fights (z = -0.73, -0.81, -1.13, -0.16).
- **The cause, told apart at 500 seeds** (the three switches alone on scratch copies, the three chapters above): **A (calculation by slot) alone reproduces every number above to the seed** (the same wins, the same flips: 35 won-to-lost and 28 back at II, 16 and 7 at XVII, 44 and 34 at XII); **B (rounds) alone and C (one recoil) alone change no win, no party turn, no engine turn and no KO of the 500 seeds of any of the three** (Chapter XVII and XII under C alone are byte-identical, 500 of 500: no drain there).
- **Is the small fall real? No.** The pooled split of the 500-seed flips is 98 lost against 71 won back (sign test p = 0.045), so I played **1,500 more seeds (501 to 2000)** of the three chapters on both trees. There the tip wins **more**: yunalesca 1,352 -> 1,369 of 1,500, sin-fins-core 1,299 -> 1,304, seymour-omnis 1,367 -> 1,392 (flips 211 lost, 258 won back). Over all 2,000 seeds of the three chapters: yunalesca 1,805 -> 1,815 (90.3 -> 90.8 percent), sin-fins-core 1,731 -> 1,727 (86.6 -> 86.4), seymour-omnis 1,829 -> 1,844 (91.5 -> 92.2), 5,365 -> 5,386 of 6,000 together. A group command's draws go to other targets: the same average fight, a different fight seed by seed.

## 7. The goldens

- `ffx2-atb-golden` (6) and `ff7-golden` (3): **unchanged and passing** (FFX only).
- `ffx-engine-golden` (18 digests: seeds 1 and 7 of nine chapters): **ten re-pinned, eight unchanged.** Moved: `seymour-flux#1` and `#7`, `yunalesca#1` and `#7`, `braskas-final-aeon#1` (links 1 and 4) and `#7` (link 1), `evrae-airship#1` and `#7`, `seymour-omnis#1` and `#7`. Unchanged: Macalania, Yojimbo, Natus and Isaaru (both seeds each). Every outcome is still a victory. The causes
  are in the file's header, by seed: seymour-flux moves through B only; yunalesca through A, B and C; braskas-final-aeon and seymour-omnis through A and B; evrae-airship seed 1 through A and B and seed 7 through B. Proof: the 12-seed ablation above (the same seeds 1 and 7) and the all-switches-false run, which is the base's logs again.

## 8. Disclosures in player words (FFX only)

1. **A group spell or attack now goes through your party by character, not by the order you lined them up in.** Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku, then the aeons, then the monsters, as in the game. The rolls for damage, critical hits and status effects are dealt out in that order, so a given fight plays out differently from before
   (the same on average: see the win rates in section 6). No number of any attack changed.
2. **An attack that hits several targets more than once now shows its hits in rounds**: the first hit on everyone, then the second, as the game does, instead of every hit on the first target and then the next. A target that takes fewer of the hits (the spread of a Fire Gem, Photon Spray or Fire Fury) falls in the round of its own last hit, before a target that takes more.
3. **Drain, Osmose, Lancet and Lulu's Drain and Osmose Furies give their caster everything in one go after all targets** (one heal number, not one per hit); for a party member the caster's number comes first in the round, for a monster after the party's. A drain turned back on its own caster (a Reflect or a Confused swing) does nothing.
4. Unchanged: counters, Steal, who a spread picks, how much anything hits for, boss and party numbers.

## 9. The advisor sets

60 advisor, strategy and intent files (`advisor-*`, `strategy-*` not FFX-2, `intent-*`, `enemy-intent*`, `ui-move-advisor`, `tactics-lookup`): 8 tests failed on the first run, in three files. **Seven were the 15-second default timeout under load** (`advisor-floor` Chapters 3, 9, 10, 12 and 27; `advisor-note` Chapters 1 and 27; plus `advisor-menu`'s worker that did not start): `advisor-floor`, `advisor-note` and `advisor-menu` pass **76 of 76** alone with `--testTimeout=240000`.
**One is an assertion and is left failing: `advisor-plan` "yunalesca (ffx): the card is within one seed of the chapter line"**: following the card won 4 of 6 seeds against the chapter line's 6 of 6 (it needs at least 5); on the base it passes (6 of 6). It is a six-seed smoke test and the seeds are chaotic: over 20 seeds (1 to 20) of the same two drivers the card wins **18 of 20 on the base and 17 of 20 on the tip, the line 19 of 20 on both** (the card loses seeds 7 and 8 on the base and seeds 1, 3 and 8 on the tip; the line loses seed 17 on both). I did not touch the test (its bar is the advisor lane's, and moving seeds or slack would be tuning).
Decision for the driver: widen that test's sample (it is cheap to raise `SEEDS` from 6 to 12 or 20) or accept the 6-seed result; the advisor itself plays as before.

## 10. Open items

1. **The larger split (calculation from application).** HP and statuses are written when a hit is calculated, not when its round comes. A lower slot's script and death handling therefore see the higher slot's last hits already written (the game has applied all but its last). The one test that measured it
   (`parity-ffx-ai-hooks`, a probe script reading its neighbour) is pinned at 4,800 with the game's 4,900 in the comment; no shipped script reads a sibling's HP in `onHit` and B alone moved no outcome in 12 seeds of any chapter. Doing it means separating the running HP / MP / CTB the pipeline reads from the target's, and writing `applyOneHit`'s tail at replay.
2. **The animation scripts (the note's open question 1).** Which frame each hit lands on and with which selector is set by the animation scripts, which were not read. Rounds are what the post-action flush guarantees, so they are the floor of the rule; a script that applies one target at a time would show per target.
3. **Auto-Med and Auto-Potion across targets** are decided and paid in calculation order (their stock is shared), the game's in round order; they differ only when stock runs out inside one action. The relative order of a counter and the item reactions (the note's row 8, = F5) is still open.
4. **The recoil's arithmetic (0x0078a240, the note's open question 3).** Only its arguments were compared. A net HP or MP sum at or below 0 (the targets together gained) does nothing here; no shipped target produces one. The CTB class of the recoil is not modelled: no absorb row has it.
5. **Steal's zero-hit case** (the note's row 6) and a multi-target Steal do not exist in the shipped rows.
6. **`hitIndex` on damage events stays the calculation index** (so 0, 2, 1, 3 for two targets of two hits). The presenter reads it for "first blow" and "last blow" and for the numeral ladder; I did not watch the fights in a browser. Recommended for the focused review: Chapter I (Fire Gem), Chapter VIII (Photon Spray) and Lulu's Fire Fury, once each, real input.
7. **Decision for Bailey, with a recommendation:** `HIT_CALC_SLOT_ORDER` is on because it is the game's order and the note proves it (12,000 level-2 vectors, 0 violations); it is a draw reassignment, not a rule change, and it is what moves the win rates in section 6 within noise. Setting it to `false` keeps S1's rounds, S2 and S3 and leaves the calculation in the party's formation order. Recommendation: keep it on.
8. **Merge hot spots:** `abilities.ts`, `hit-apply.ts`, `state.ts` (other RC10 lanes may touch them; keep both sides). The five test files that moved (section 3) pin the game's order.

## 11. CHANGELOG paragraph (plain words; for the main session to paste, not edited into `CHANGELOG.md` here)

**FFX only.** An action that hits several targets now lands the way the game's code lands it. The game works out every hit of every target first, the lowest character first (Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku, then the aeons, then the monsters), and only then shows the hits across all the targets at once: the first hit on everyone, then the second, and each target falls, pays its loot and triggers its boss's reaction in the round of its own last hit. Our fights now do the same. A group spell or attack goes through your party by character rather than in the order you lined them up in, so the damage, critical-hit and status rolls land on other characters than before (the same fight on average: over 2,000 simulated fights of each of three chapters it wins 89.4 percent before and 89.8 percent after); the numbers of a multi-target attack come in rounds; and in Chapter I the Fire Gem and Ice Gem throws, which spread five hits over Seymour Flux and the Mortiorchis, now let the one that takes fewer hits fall first. Drain, Osmose, Lancet and Lulu's Drain and Osmose Furies now give their caster everything in one go after all targets, and an attack that would turn on its own caster does nothing. No boss or party number changed, and no chapter's win rate moved beyond the noise of 500 fights.

## 12. Re-run commands (repo root of the worktree; Node 24; TEMP and TMP on D:, here the per-lane folder `D:/Tools/ffx-parity/tmp/ffx-hit-order`)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .
TEMP=... TMP=... node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx-hit-order.test.ts tests/unit/parity-ffx-recoil-rank.test.ts
TEMP=... TMP=... node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
node tools/orphans.mjs
```

Measurement (outside the repo, in the lane's folder, deleted at the end of the lane): the RC9 counters lane's `zz-digest.test.ts` with a census added, `digest-compare.mjs`, `digest-md.mjs`, `classify-diff.mjs` (`D:\Tools\ffx-parity\rc9\ffx-counters\`), run in scratch copies made with `git archive <ref> src vitest.config.ts package.json tsconfig.json`, one per switch setting (the three constants of `hit-order.ts` edited with `sed`),
`ZZ_SEEDS=1-12` or ranges, `ZZ_CHAPTERS=<id>`. Mutation: `mutate2.mjs` of the same folder with this lane's two test files and 25 mutants, run in a scratch copy of the tree.
