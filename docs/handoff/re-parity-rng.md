# Re-parity RNG lane: each game draws from its own 68 random streams

Status: **built, tested and pushed on branch `re-parity-rng`; not merged into `main`, not deployed** (2026-10-11). Cut from `origin/rel-3945` (`2ae1a9e4`, live release 39.4.5) plus the
paper preflight `d6444b31` ([plans/re-parity-rng-review.md](../plans/re-parity-rng-review.md)). **Game case: each game by its own code** (AGENTS.md rule 14): FFX draws from FFX's
generator, FFX's stream map and FFX's seeding routine; FFX-2 from FFX-2's. They are different executables and different tables; the shared part is plumbing (`BattleRng`, the
snapshot, the fork) and is "both". **FF7 is unchanged** (mulberry32, one stream). Owner: Bailey. His words, as the brief quoted them: 2026-10-08 "It needs to be a 1:1 parity. this is very
useful for our project."; 2026-10-09 "Adopt game streams (Recommended)" (D-648); 2026-10-10 "go full speed ahead please" and "ill go with all your recommendations". Deploys need his word.

## 0. In one paragraph

Until now every engine drew every roll from one seeded stream. The games do not: each has 68 independent streams, a roll takes the stream the game gives it (the roller's own, the
hit roll's, the status roll's, and a handful of fixed ones for scripts, target picks and theft), and a battle is seeded through the game's own seeding routine. The engines now do
exactly that. Every draw is mapped; the draws the game does not make (a stand-in for a player's minigame input, the engine's own drop model, a placeholder aim) come from a separate
engine-side stream that can never move one of the 68. The goldens and the seeded tests moved once per game, in their own commit. Every chapter of both games, 500 seeds before and
after, stays inside the sampling band except one FFX chapter (Chapter VII, Seymour and Anima), which I traced to the draw of the seed block and not to a bias (section 8).
Nothing on a boss or a party member was tuned.

## 1. The merge (step 1 of the order)

`git fetch`, then `git merge origin/re-parity-rc3` (`0c729fa5`) into `d6444b31`: commit **`b774ee7e`**. It merged **with no conflicts**, so there was no side to choose: both sides are in.
**Its commit message is the single letter "x"**: I cannot amend it under the no-amend rule, so it stays and is disclosed here; the sha identifies it. What it moved, measured with `git diff --stat d6444b31 b774ee7e`: 208 files, all FFX-2 or shared FFX-2 types. `src/battle/ffx`, `src/data/ffx`, `src/battle/ff7`, `src/data/ff7`
and `src/app` are **byte-identical** across the merge; the only shared file is `src/battle/common/types.ts` (+59/-25, FFX-2 types). So the FFX "before" measurement below is the pre-merge FFX
engine, and the FFX-2 "before" is the RC3 engine. The "before" files are measured **after** the merge, as asked.

## 2. Commits on `re-parity-rng` (oldest first)

| Commit | What | Case |
|---|---|---|
| `b774ee7e` | Merge `origin/re-parity-rc3` (message "x", section 1) | FFX-2 content |
| `72d944ab` | Part 1: the `BattleRng` plumbing, each game's stream map and seeding, the contract entry; no engine draws from it yet | both (plumbing); each map its own |
| `51bedd86` | Part 2: the FFX engine draws every roll from the stream the game gives it; Chapter VIII's scene and camera draws counted on stream 2 | FFX only |
| `2847016d` | Part 3: `ffx-engine-golden` and the seeded FFX tests re-pinned once, reason "game RNG streams (Bailey 2026-10-09)" | FFX only; tests only |
| `c03b21b7` | Part 4: the FFX-2 engine draws every roll from its stream | FFX-2 only |
| `6b59fec7` | Part 5: `ffx2-atb-golden` and the seeded FFX-2 tests re-pinned once, same reason | FFX-2 only; tests only |
| `946c6ca8` | `ffx2/targeting.ts` back under 400 lines: the menu's no-draw generator moves to `ffx2/menu-rng.ts` (a pure move) | FFX-2 only |
| `ee64c146` | `FfxStream.Reels` comment corrected (it is named, not drawn); this handoff | docs |
| (later) | the final-checks section of this note | docs |

## 3. How it is built

- **`BattleRng`** (`src/battle/common/streams.ts`): `on(stream): Rng`, `aux: Rng`, `seed`, `saveState`, `restoreState`, `fork(seed, state?)`, `streamCount`. There is **no unqualified `int()` or
  `pick()`** on it, so a draw nobody mapped to a stream is a compile error, not a silent default. `GameStreams` is the game's 68 states over a `StreamGame` (its generator and its seeding routine);
  it carries a tap hook so tests can see every draw with its stream.
- **`aux`** is a separate engine-side generator. It serves the draws the game does not make at all: the stand-in for a player's minigame input and Overdrive timing, a placeholder aim, a Berserk
  pick in FFX-2 (unsourced), the drop model, an unscripted combatant's attack. A draw on `aux` can never move one of the 68, so the game's stream positions stay what the game's would be.
- **`SeededRng`** (`common/rng.ts`) is the one-stream `BattleRng` (`streamCount` 1, `on(s)` returns itself, `aux` is itself). That keeps FF7, `RollPolicyRng` previews and every scripted test
  generator working as before.
- **A run seed is the game's seed product**: FFX's `k` (`kernel/rng.ts#seedProduct`, clock byte taken as 1), FFX-2's `p` (clock fold taken as 0). `engine.setSeed(n)` / `init(setup)` seed all 68 states
  through that game's own seeding routine (`seedStates`), so a run is still reproducible from one number. The two seeding routines yield the same states for the same product (FFX-2 writes in
  closed form what FFX does with a discarded step); the two generators still differ, so neither stands in for the other (tested).
- **Draw shape.** The kernels reduce a raw 31-bit value themselves (`& 0x1f`, `% 101`, `& 0xff`...). The adapters (`drawsOf` in FFX, `modDraw` and friends in FFX-2) take one draw of the named stream
  as `int(0, M - 1)`, which equals `raw % M` (the power-of-two masks included), so the kernel's own reduction leaves it unchanged and a preview policy still steers the same calls.
- **The target picker** (`pickDrawn`): `value % count` along the candidates in ascending actor/slot order, and **no draw at all under two candidates** (the game spends none).
- **Forks and forecasts.** `FFXEngine.fork` / `FFX2Engine.fork` and the intent module's `cloneCtx` fork through `rng.fork(seed, state)`: the advisor's forked generator is the same kind as the engine's and
  starts where the engine is. `sampleSnapshot` gives the forecast sampler sample 0 = the position itself and the other samples moved on every stream, deterministically.
- **Contracts.** One entry in `docs/CONTRACT-CHANGES.md` (top, 2026-10-11): additive; `HitDraws` (FFX, engine-private) loses `percent()` and gains `hit()` and `crit()` because the two rolls now sit
  on two streams. `FFXEngineSnapshot.rngState` and `fork(seed, rngState?)` take an `RngSnapshot` (number for one stream, 69 numbers for a game: 68 streams plus `aux`).

## 4. The stream map as built

### FFX (`src/battle/ffx/adapt/streams.ts`; `research/re-ffx-rng-hit.md` section 2, exe function at 0x0078d210)

| Roll | Stream | Source / engine line |
|---|---|---|
| damage variance, critical roll, Escape, the opening CTB | the roller's own, mode 0: party slot + 20, **every aeon and party slot 7: 27**, a monster slot + 8 (28 to 35) | note section 2; `adapt/draws.ts:34`, `adapt/ctb.ts:182`, `execute.ts:57` |
| the hit-or-evade roll | the user's mode 1 (+16) | same; `adapt/draws.ts:35` |
| status infliction, extra statuses, shatter, Threaten | the user's mode 2 (+32) | same; `adapt/draws.ts:36` |
| Steal success and amount | 10 (`% 255`); the rare slot 11 (`& 0xff`) | note section 2 (0x0078b760, 0x0078b920); `steal.ts:90` |
| a script's `GetRandomValue` | 2, `& 0xFFFF`, one stream for every script and actor | note section 2 (0x00857400); `ai/script-random.ts:33`, `ai/game-rolls.ts:42` |
| a script's actor picker (`findMatchingChr`) | 4, `% candidates`, ascending actor order, no draw under two | `re-ffx-ai-*.md`; `ai/script-random.ts:87,100`, `ai/game-rolls.ts:58` |
| a Berserk or Confuse target (single-target forced action) | 4, the same picker | `pp_BtlPickAutoTarget` (0x007996d0); `execute.ts:376` |
| the target of each hit of a random-target command | 5, the same picker, one draw per hit | `pp_BtlBuildTargetHits` (0x0078ba70) calling `pp_BtlPickTarget` (0x007acd40); `targeting.ts:264` |
| a Reflect bounce | 6, the same picker over the other side | same function; `targeting.ts:398` |
| Chapter VIII's scene and camera draws, the Fins' caption | 2, counted (section 5) | formation scripts `hiku15_00`, `ssbt00_00`, `ssbt01_00`; `ai/airship-scenes.ts` |
| the engine's own stand-ins and drop model | `aux` (no game stream) | `overdrive.ts`, `results.ts:49`, `targeting.ts:256`, `doublecast.ts:117`, `ai/index.ts:277`, `ai/possessed-aeons.ts:119` |

### FFX-2 (`src/battle/ffx2/adapt/streams.ts`; `research/re-ffx2-hit-status.md` section 1.1, exe function at 0x0061adb0)

| Roll | Stream | Source / engine line |
|---|---|---|
| damage variance, critical roll, ATB start / reset / thinking time, Poison and Regen phase | the unit's own, purpose 0: a party slot + 0x14, a monster slot + 0x0d | note 1.1; the kernels name the stream, `adapt/draws.ts:19-36` |
| the hit-or-evade roll | the attacker's purpose 1 (+0x10) | same; `adapt/draws.ts:44-59` |
| status infliction, the shatter roll | the attacker's purpose 2 (+0x20) | same; `adapt/draws.ts:34` |
| first strike, and the gauge reset it triggers | 1 (the roll), the unit's own (the reset) | `re-ffx2-atb-status.md` section 4; `atb-open.ts` |
| the target of each hit of a random-target row | 5, `value % candidates`, ascending slot order, no draw under two | note 2.6; `adapt/draws.ts:46` (the kernel asks only when it needs a pick) |
| Steal, Pilfer Gil, Bribe | 10 and 11 | note section 5; `adapt/draws.ts:64-80`, `steal.ts` |
| a script's `random()` | 2, the low 16 bits (also a command-row variant pick) | `re-ffx2-ai-*.md`; `ai/script-rolls.ts:45`, `adapt/command.ts:307` |
| a script's target search (`searchr`, `searchr_nop`) | 4 | `re-ffx2-ai-*.md`; `ai/script-rolls.ts:68,75,153,185,240,251` |
| a Berserk pick, a placeholder aim, a minigame default | `aux` (the sources do not name Berserk's stream) | `targeting.ts:87-98,396`, `active.ts:187`, `execute.ts:247,273`, `resolve-status.ts:137` |

## 5. The Chapter VIII camera and scene draws (FFX only)

The game's scripts and its battle scenes share stream 2, so a scene that rolls a voice line moves every AI roll after it. The engine has no scenes, so it **counts** them
(`src/battle/ffx/ai/airship-scenes.ts`, read from the formation scripts' disassembly, numbers and structure only):

| Where | Draws on stream 2 |
|---|---|
| Cid's turn begins with an order standing (scene A1, the pre-turn caption) | one `mod 2` |
| Tidus or Rikku gives Pull back or Move in (scene A2, the voice reply) | one `mod 100`; when it is below the speaker's threshold (255 at the start, so the first reply always draws again) a second `mod 100`, which becomes the new threshold |
| Cid's Guided Missiles (the camera shot) | one `mod 100` (`< 50` picks a shot) |

The same A1 caption is wired for the two Fins (Chapter XVII, `sin-fins.ts:170`). **Consequence if one of these were left out:** every later AI roll of the fight would drift by one draw per
scene, which is why they are modelled. **Not modelled** (open items, section 10): the victory camera's 48 draws (it comes after the last roll of the battle), the Fins' voice-reply scene, other
formations' scenes (`nagi05_10` in Chapter IX, `bvyt09_10` and `bvyt09_11` in Chapter XIV).

## 6. Proofs and mutants

| Test file | What it proves |
|---|---|
| `tests/unit/rng-streams.test.ts` | both seeding routines equal an independent restatement (the worked example of the note, k = 1: stream 0 starts at 1520130368, stream 1 at 846530240); every seeded state is below 2^31; 200 draws on each of 8 streams equal the restated generator in any interleaving; `int(0, n-1)` is `value % n` and a power-of-two modulus is the games' mask; `aux` and the game streams cannot move each other; the tap sees every draw with its stream; snapshots, forks, `sampleSnapshot`; the picker draws nothing under two |
| `tests/unit/parity-ffx-rng-streams.test.ts` | **independent stream table, written out again from the note**: 400 generated hits, every draw on the stream its role names, for a party member, an aeon and each of the 8 monster slots; the opening counters (26 draws: slots 20 to 26, slot 7 and ten aeons on 27, monsters 28 to 35); `GetRandomValue` on 2 (16 bits), the picker on 4; Berserk/Confuse on 4; random-target on 5; Reflect on 6; Steal on 10 then 11; Escape first; `aux` moves no game stream; the Chapter VIII scene draws |
| `tests/unit/parity-ffx2-rng-streams.test.ts` | the same for FFX-2: 400 generated actions; first strike (1) and the opening starts; `random()` on 2, searches on 4, Russian Roulette is `random() % 5`; `aux` moves no game stream |
| **mutants** (inside the two parity files) | FFX: the hit roll on the damage stream, the status roll on the hit stream, the aeons on a monster's stream, every monster one stream along: each is **caught**. FFX-2: the hit roll on the variance stream, the status roll on the hit stream, the monsters at FFX's offset (slot + 8), the random-target pick on the search stream, Steal on the slot stream: each caught. |
| determinism | the same run seed gives the same draws, hit after hit and action after action; a fork at the engine's position replays its draws |
| advisor non-interference | 14 files, 157 tests (noop-guard, covered, in-flight, lethal, simulate, enemy-intent, v4, roll) pass: the advisor's forecasts still never move the engine's streams |

## 7. The goldens, explained (once per game, own commit)

Reason on every pin: **"game RNG streams (Bailey 2026-10-09)"**. A stream change is a different deal of the same odds, so every log moves; that is the point, not a defect.

- **FFX** (`2847016d`): `ffx-engine-golden` (all 18 digests) moved. **Seventeen outcomes are unchanged; one moved**: `seymour-anima-macalania#7` victory to defeat, a seed nobody tuned (one sample;
  the 500-seed rate in section 8 is the evidence). The seeded tests that pinned a seed re-pinned in the same commit: `advisor-forecast`, `advisor-note`, `advisor-ownership`, `advisor-plan-recovery`,
  `advisor-v4-card` (seed 2 now opens on a Zombie board: Holy Water on Kimahri; seed 3 opens with Kimahri acting; seed 1 unchanged), `chapters/evrae-breath-hold`, `chapters/natus-phases`,
  `chapters/sin-fins-core-bench`, `ffx-overdrive-menu-rows`, `guide-advisor-target-agreement`, `intent-random-target`, `presenter-vitals-hp-ceiling`, `strategy-braskas-final-aeon`, `strategy-guide`,
  `ui-move-advisor`. Each file's comment names the old and new fact.
- **FFX-2** (`6b59fec7`): `ffx2-atb-golden` (all **60** digests) moved; **the outcomes did not** (Chapter 4 is still 20/20 at D = 0 and Chapter 5 still 20/20: `CH5_D0_OUTCOMES` unchanged).
  Re-pinned with it: `chapters/den-of-woe-carry` (32 logs; Chapter 5's eight equal `ffx2-atb-golden` CH5_D0 seeds 1 to 8 again), `ffx2-hit-closes-menu` (nine, all victories, no menu closed),
  `ffx2-menu-cancel-delay` (18), `advisor-v3-final`, `strategy-ffx2-bahamut`, `strategy-ffx2-leblanc` (the careless-line and mash-line results, see decisions), `target-frame-hold`, `ui-ffx2-battle-message`.
- FF7: `ff7-golden` passes unchanged (it does not import either game's streams).

## 8. Measurement (every chapter of both games, shipped line, 12 and 500 seeds, before and after)

Method: `tests/unit/ffx-parity-measure.test.ts` and its FFX-2 twin, `PYREFLY_MEASURE=1`, the intended line in every chapter. **Before** = HEAD of the merge (`b774ee7e`, section 1); **after** = HEAD.
`z` is the two-proportion z of the win rate. Raw files: `D:\Tools\ffx-parity\rng\` (`base-*`, `after-*`, `legacy-*`).

### FFX, 500 seeds (wins; mean party turns; mean party KOs)

| Chapter | before | after | turns b/a | KOs b/a | z |
|---|---|---|---|---|---|
| I Seymour Flux | 493 | 499 | 48.4 / 48.9 | 1.1 / 1.0 | 2.13 |
| II Yunalesca | 469 | 474 | 158.1 / 154.9 | 13.2 / 12.9 | 0.68 |
| III Braska's Final Aeon | 475 | 481 | 238.5 / 241 | 5.5 / 5.5 | 0.93 |
| VII Seymour and Anima | 488 | **467** | 55.7 / 54.9 | 4.6 / 4.8 | **-3.20** |
| VIII Evrae | 489 | 488 | 72.3 / 72.6 | 0.8 / 0.7 | -0.21 |
| IX Yojimbo | 495 | 493 | 67.8 / 67.4 | 4.0 / 3.9 | -0.58 |
| X Seymour Natus | 485 | 483 | 34.5 / 34.0 | 1.8 / 1.7 | -0.36 |
| XII Seymour Omnis | 423 | 436 | 102.7 / 103 | 1.3 / 1.3 | 1.18 |
| XIV Isaaru | 440 | 452 | 38.0 / 38.2 | 3.0 / 2.9 | 1.22 |
| XVII Sin: the Fins and the Core | 434 | 442 | 327.4 / 328.1 | 2.8 / 3.0 | 0.77 |
| XVIII Sin: the Face | 500 | 500 | 47.2 / 47.2 | 0 / 0 | 0.00 |

### FFX-2, 500 seeds

| Chapter | before | after | turns b/a | KOs b/a | z |
|---|---|---|---|---|---|
| IV Bahamut | 500 | 500 | 44.2 / 43.9 | 0 / 0 | 0.00 |
| V Vegnagun and Shuyin | 488 | 490 | 95.8 / 96.0 | 0.9 / 1.0 | 0.43 |
| VI Leblanc | 500 | 500 | 67.8 / 67.3 | 0.7 / 0.7 | 0.00 |
| XI Fallen Aeons | 500 | 500 | 47.8 / 48.0 | 0.1 / 0.1 | 0.00 |
| XIII Trema | 348 | 363 | 162.5 / 165.7 | 1.3 / 1.2 | 1.05 |
| XV Den of Woe | 500 | 500 | 31.4 / 31.3 | 0.3 / 0.3 | 0.00 |
| XVI Ixion | 500 | 500 | 26.9 / 26.9 | 0 / 0 | 0.00 |

12-seed tables (the same files, `base-*-12`, `after-*-12`), wins out of 12, before to after. FFX: Flux 12 to 12, Yunalesca 12 to 10, Braska 12 to 11, Anima 12 to 11, Evrae 11 to 12, Yojimbo 12 to 11, Natus 12 to 11,
Omnis 10 to 9, Isaaru 11 to 11, Fins and Core 9 to 11, Face 12 to 12. FFX-2: 12 to 12 in every chapter except Trema 7 to 10. With 12 seeds a one-seed move is z about 1, so this table
is a sanity check and not evidence; the 500-seed tables are the evidence.

### The one chapter beyond the band, traced (FFX Chapter VII, z = -3.2)

A finding to trace, not a difficulty change. Method: an **ablation** (`PYREFLY_ABLATE=legacy`, a local hack that is not committed) makes the new code use the old one-stream generator, so it
reproduces the old engine on any seed block; then an **independent block** of seeds (501 to 1500) tests whether the streams move the rate.

- Legacy generator on seeds 1 to 500 gives **exactly 488**: this chapter's draw order did not change, so the old engine is reproduced draw for draw and the move is the generator and nothing else.
- Legacy generator on seeds 501 to 1500: **949 of 1000**. Streams on the same 1000 seeds: **959 of 1000**. The streams are not below the old generator on the independent block (it is 1 point higher),
  so the 500-seed drop is the draw of the first block and not a bias. (Seeds 1 to 500 happen to be a lucky block for the old generator: 97.6 percent against 94.9 percent on the next 1000.)
- Collapsing the streams to one (every stream the same) still gives 468 to 481 on seeds 1 to 500, in the same range as 467.

### The independent block: is the move a bias? (seeds 501 to 1500, 1000 seeds, and all 1500 pooled)

Each cell is wins, **old one-stream generator on the new code (the ablation) / the game's streams**, on the same seeds. This isolates the generator from every other change in the lane.

| Chapter | seeds 1-500 | z | seeds 501-1500 | z | all 1500 | z |
|---|---|---|---|---|---|---|
| I Seymour Flux | 497 / 499 | 1.00 | 993 / 991 | -0.50 | 1490 / 1490 | 0.00 |
| II Yunalesca | 479 / 474 | -0.75 | 952 / 938 | -1.37 | 1431 / 1412 | -1.56 |
| III Braska's Final Aeon | 475 / 481 | 0.93 | 967 / 958 | -1.06 | 1442 / 1439 | -0.28 |
| VII Seymour and Anima | 488 / 467 | -3.20 | 949 / 959 | +1.07 | 1437 / 1426 | -0.96 |
| VIII Evrae | 487 / 488 | 0.20 | 968 / 973 | 0.66 | 1455 / 1461 | 0.66 |
| IX Yojimbo | 490 / 493 | 0.73 | 988 / 982 | -1.10 | 1478 / 1475 | -0.44 |
| X Seymour Natus | 485 / 483 | -0.36 | 958 / 962 | 0.46 | 1443 / 1445 | 0.19 |
| XII Seymour Omnis | 423 / 436 | 1.18 | 839 / 838 | -0.06 | 1262 / 1274 | 0.61 |
| XIV Isaaru | 440 / 452 | 1.22 | 875 / 888 | 0.90 | 1315 / 1340 | 1.43 |
| XVII Sin: the Fins and the Core | 454 / 442 | -1.24 | 866 / 875 | 0.60 | 1320 / 1317 | -0.17 |
| XVIII Sin: the Face | 500 / 500 | 0 | 1000 / 1000 | 0 | 1500 / 1500 | 0 |
| IV Bahamut (FFX-2) | 500 / 500 | 0 | 1000 / 1000 | 0 | 1500 / 1500 | 0 |
| V Vegnagun and Shuyin (FFX-2) | 488 / 490 | 0.43 | 971 / 978 | 0.99 | 1459 / 1468 | 1.07 |
| VI Leblanc (FFX-2) | 500 / 500 | 0 | 1000 / 1000 | 0 | 1500 / 1500 | 0 |
| XI Fallen Aeons (FFX-2) | 500 / 500 | 0 | 999 / 998 | -0.58 | 1499 / 1498 | -0.58 |
| XIII Trema (FFX-2) | 348 / 363 | 1.05 | 709 / 714 | 0.25 | 1057 / 1077 | 0.81 |
| XV Den of Woe (FFX-2) | 500 / 500 | 0 | 1000 / 1000 | 0 | 1500 / 1500 | 0 |
| XVI Ixion (FFX-2) | 500 / 500 | 0 | 1000 / 1000 | 0 | 1500 / 1500 | 0 |

On the independent 1000 seeds no chapter of either game is beyond |z| = 1.4, and pooled over 1500 none is beyond |z| = 1.6: **the streams do not move any chapter's win rate beyond the sampling band.** Turns and KOs
on the same block move by a tenth of a turn or less (FFX Yunalesca 156.7 to 158.9 turns is the largest; FFX-2 Trema 163.7 to 164.5).

**Why the "old engine" column of the 500-seed tables is not the ablation column.** The ablation is the new code on the old generator; the "before" is the old code. They agree to the win exactly where the new code spends the
same draws in the same order (FFX-2: all seven chapters; FFX: Braska 475, Anima 488, Natus 485, Omnis 423, Isaaru 440, Face 500) and differ a little in five FFX chapters (Flux 493 vs 497, Yunalesca 469 vs 479, Evrae 489 vs 487,
Yojimbo 495 vs 490, Fins and Core 434 vs 454) where the lane also changed *which* draws are spent and *in what order* (a target pick spends no draw under two candidates, Escape is rolled ahead of the can-escape check, the
random-target hit reuses its first pick, Chapter VIII counts its scene draws). I did not bisect which of these moves which chapter; each is a different sample of the same distribution, and the 500-seed "before" to "after" moves of those
five chapters (Flux +6, Yunalesca +5, Evrae -1, Yojimbo -2, Fins +8) are all inside the band except Flux (+2.13, in the player's favour, and gone on the independent block: 993 vs 991).

Other chapters beyond |z| = 2: Chapter I (Flux, 493 to 499, **+2.13**, better for the player) and nothing else. It is inside the multiple-comparison allowance (18 comparisons at 500 seeds, one near 2 is expected), and is
checked in the independent block above.

## 9. Nothing persists an RNG state (checked)

`src/app/SaveData.ts` has no RNG or seed field, and the only files that touch `saveState`, `restoreState` or `rngState` are the generators (`common/rng.ts`, `common/streams.ts`), the two engines and the two intent clones (plus one bench test). The advisors (`advisor-covered`, `-inflight`, `-lethal`, v4 `search.ts`) fork the engine in memory with `engine.fork(seed)`; nothing leaves the page. The mark recorder (`src/app/markRecorder.ts`) stores a run **seed** and the **build sha** in `localStorage` as a debugging aid, never as save data; a mark taken on an older build replays against that build's sha. So this change is **not in the save-data class** and needs no migration. **Not checked:** whether the real game's save stores its 68 states (the note says so
too, section 3 of `re-ffx-rng-hit.md`); the engine has nothing to persist either way.

## 10. Open items (none touches a boss or party number)

- **FFX placement shuffle** (0x007842f0): linked monster groups spend mode-0 monster-stream draws at battle start; not modelled (it would shift the monsters' opening streams for those groups).
- **Streams the engine never draws from, by design (no engine feature uses them):** FFX 0, 1, 3, 9 (cosmetic), 12/13 (gear and item drops: the engine's drop model is its own, `aux`), 14/15 (battle-script
  random op), 16 (monster action-list shuffle, and the minigame Overdrive hit removal at 0x007afe00), 17 (Yojimbo's roll), 18, **19 (Wakka's reels: the result here is the player's, `aux`)**; FFX-2 6, 9, 14 to 17.
  Streams 16 and 19 are the two that would matter if the minigame Overdrives were ever driven by the game's own roll (decision below).
- **Random-target hits are processed in pick order**, where the game picks every target up front and processes by target slot. Same draws, possibly different order of effects.
- **Hits on dead targets are not wasted** (the game's random target can land on a corpse and spend the hit).
- **The victory camera's 48 draws** and other formations' scene draws (`nagi05_10`, `bvyt09_10`, `bvyt09_11`), and the Fins' voice-reply scene, are not counted.
- **Range guards:** FFX-2 stream >= 68 raises `RangeError` in the kernel (a monster in slot 23 or later rolling purpose 2; no fight is near it); FFX `slotOf` raises for an enemy with index >= 8.
- **FFX-2 Berserk's stream is unsourced**: it is on `aux`. **The drop model is the engine's own** (`aux`).
- **Per-battle reseed vs the game's global streams.** FFX seeds once, at New Game, and the 68 streams run on across battles; FFX-2 seeds when a battle loads. The engine reseeds per battle from the run seed in
  both, which is exact for FFX-2 and an approximation for FFX (each battle starts from the seed product of its run seed rather than from where the previous battle left the streams).
- **Escape is rolled before the can-escape check**, in the order the note gives (a battle that cannot be escaped still spends the draw on the escaper's own stream; tested).
- **Not run:** the full browser e2e, a live deploy, or the critic's reviews (`node tools/critic-plan.mjs` classes this as DEEP: `focusedBeforeDeploy` and `deepAfterDeploy` are owed before it ships).

## 11. Decisions for Bailey

1. **Stand-ins on `aux`, not guessed streams.** Where the sources do not name a stream (FFX-2 Berserk, the drop model, minigame inputs, placeholder aims) I used the engine-side stream rather than inventing
   a number. Confirm, or name the source for any you want on a game stream.
2. **The Fins' scenes.** I modelled Chapter XVII's pre-turn caption exactly as Evrae's (same formation-script pattern). The Fins' voice-reply scene is not wired. Wire it, or leave it?
3. **The placement shuffle** (FFX linked groups): model it now, or leave it for the next lane?
4. **Wakka's reels (stream 19) and the minigame Overdrive hit removal (stream 16):** keep the player's input as it is (the result is the player's), or drive them from the game's streams?
5. **Pick order vs target order** for random-target commands (open item above): move to the game's order (pick up front, process by slot)?
6. **Two FFX-2 strategy results moved** (`strategy-ffx2-leblanc` careless line, `strategy-ffx2-bahamut` mash line): both are a different deal of the same odds; the 500-seed rates are unchanged (Leblanc 500, Bahamut 500).
   No guide wording changes follow; say so if you want the guide's numbers refreshed.
7. **Nothing deploys without your word.** This lane is branch-only; the plan classes it DEEP, so a deploy needs a focused review first and a deep review after.

## 11b. Final checks (2026-10-11, on the pushed tree)

- `tsc --noEmit`: exit 0. `node tools/orphans.mjs`: 36 orphans, all older than this lane; none of `common/streams.ts`, `ffx/adapt/streams.ts`, `ffx2/adapt/streams.ts`, `ffx/ai/airship-scenes.ts`, `ffx2/menu-rng.ts` or the test helpers is one.
- **The whole suite, once** (`vitest run --maxWorkers=4`, JSON report `D:Toolsfx-parityngsuite-final.json`): 4,487 suites, 16,268 tests, 185 failed in **23 files**. **22 are art-only**: this worktree has no `public/art` (the paintings are gitignored and live on the main
  tree's disk), so `art-ref-defaults`, `chapter-meta`, `chapter-meta-evrae`, `chapter-meta-ffx2-leblanc`, `chapter-meta-seymour-anima-macalania`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapters/den-of-woe-ship-content`, `chapters/den-of-woe-ship-scene`,
  `chapters/experiment-scene`, `chapters/fallen-aeons-ship-content`, `chapters/fallen-aeons-ship-scene`, `chapters/isaaru-ship`, `chapters/leblanc-art`, `chapters/leblanc-party-sprites`, `chapters/natus-ship-content`, `chapters/natus-ship-scene`,
  `chapters/trema-ship-content`, `chapters/yojimbo-content`, `cutscene-story-poses`, `party-face-manifest`, `pause-remake` and `ui-portrait-face-crop` (145 of the 185) fail on a missing painting or manifest and import neither engine's streams.
  **The 23rd is `chapters/sin-fins-core-bench`**: two of its four smoke tests hit the 15 s default timeout under four workers (18.0 s and 17.3 s); run alone it passes, 4 of 4 (14.6 s and 15.0 s for those two, so they sit
  right at the limit; the same 15 s-under-load class earlier lanes recorded in `r38-evrae.md`, and the first whole-suite run of this lane failed it the same way). The chapter's 500-seed measurement took the same wall time before and
  after (480.8 s and 479.6 s), so the streams add no measurable cost to the FFX engine.
- Pushed: branch `re-parity-rng` on `origin`. No deploy, no `main`, no `CHANGELOG.md`, NOW.md, ACTIONS or DECISIONS edits.

## 12. Re-run commands (from the repo root; Node 24; tools by path)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/rng-streams.test.ts tests/unit/parity-ffx-rng-streams.test.ts tests/unit/parity-ffx2-rng-streams.test.ts
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 tests/unit/ffx-parity-measure.test.ts
node tools/orphans.mjs
```

The FFX-2 measurement twin lives beside it (`tests/unit/ffx2-parity-measure.test.ts`, same variables). The ablation is not in the repo.

## 13. CHANGELOG paragraphs (plain words; for the main session to paste, not edited into `CHANGELOG.md` here)

**FFX only.** Final Fantasy X battles now draw their luck the way the game does. The game keeps 68 separate random-number streams: each party member rolls on their own, all the aeons share one, each monster
has its own, and hit rolls, status rolls, steals, the monsters' decisions, random targets and Reflect bounces each have a stream of their own. The fights now do the same, and a battle starts from the game's own
seeding routine, so the sequence of luck inside a fight is a different but fair deal of the same odds. Chapter VIII also counts the voice lines and camera shots that the real fight rolls for, so the monsters' later decisions keep their place in the sequence. Nothing about the bosses or your party changed.

**FFX-2 only.** Final Fantasy X-2 battles now draw their luck the way that game does: its own 68 random-number streams, one per character for damage, hit and status rolls, plus the shared ones for first strikes, random targets, theft and the
bosses' scripts, started from the game's own seeding routine. Every fight is therefore a different but fair deal of the same odds. Chapters IV to XVI keep the same win rates and nothing about the bosses or the girls changed.
