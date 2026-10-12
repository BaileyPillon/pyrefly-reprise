# Re-parity RC4, lane FFX-G (reactions and targeting), slices G-a and G-b: the engine builds an action's targets once, as the game does

Status: **built, tested and pushed on branch `re-parity-rc4-react`; not merged, not deployed** (2026-10-11). Cut from `origin/re-parity-rc4-base` (`f39cd57b` = the live build 39.4.5 plus RC3 plus each game's own
random streams, merged with `origin/r40-rc`). **Game case: FFX only** (AGENTS.md rule 14): the note's own case line says FFX-2 has its own spread routine (0x634E40) and its own counters, and none of these
addresses exist there; every row below is FFX only. FFX-2 files, `ffx2-atb-golden` and `ff7-golden` are untouched and pass unchanged. Owner: Bailey. His words, as the brief quoted them: 2026-10-08 "It needs to be a 1:1
parity. this is very useful for our project."; 2026-10-09 "Your findings need to be implemented into live builds as the decompilation work progresses."; 2026-10-10 "go full speed ahead please" and "ill go with all
your recommendations". Deploys need his word. Source: the checked decompile note `D:\Tools\ffx-parity\coverage\ffx\FFX-G04.md` (every statement used here carries its proof label; nothing under its "Open questions"
was built from), condensed into [`research/re-ffx-targeting.md`](../../research/re-ffx-targeting.md). Plan: `D:\Tools\ffx-parity\coverage\wiring-plan-draft-2026-10-11.md`, lane FFX-G.

## 0. In one paragraph

Until now the engine decided Cover and Reflect hit by hit (`resolveOneHit`), picked a fresh random target for every hit of a spread, sent a Confused actor at "either side" and redirected a Provoked monster's target.
The game does all of that once, **before any hit**, in one function (`pp_BtlBuildTargetHits`, FFX.exe 0x0078ba70) and turns Provoke, Berserk and Confuse into a forced attack at the start of the actor's turn. The
engine now does the same: a pure kernel of that function with the game's Cover (best score, Sentinel doubled, the Tidus counters, must be able to act), Reflect (back to the caster off an opposite-side holder, a random
opposite-side member on stream 6 off a same-side one, per target and by the record's bit, so Hastega, Slowga and the Nul spells bounce too), the random spread (every pick first on stream 5), and the
Berserk / Confuse / Provoke turns; an adapter that maps the engine's combatants onto the game's 31 slots; and `target-build.ts` / `forced-turn.ts` as the engine seams. Every boss and party number is untouched. At 500 seeds
no chapter moved beyond the sampling band (|z| at most 1.2); the one chapter whose line had to change is Chapter II, because the game turns a Hastega back off a Reflect (section 6).

## 1. Commits (oldest first, on `re-parity-rc4-react`)

| Commit | What | Case |
|---|---|---|
| `b0a35142` | The kernels (`kernel/target-builder.ts`, `cover.ts`, `legal-set.ts`, `forced-turn.ts`, `target-world.ts`), nine fixtures of the game's own vectors (3,215), four kernel test files, the research note. Wired to nothing | FFX only |
| `98a67e32` | The engine wiring: `target-build.ts`, `forced-turn.ts`, `adapt/target-world.ts`, `resolveAbility` rebuilt around the builder, `hit-apply.ts` loses its redirect and bounce, the turn start tries Provoke, Berserk, Confuse; the Chapter II tactic mirror; the tests the old rules pinned; `parity-ffx-engine-targets` | FFX only |
| `c7e71fa4` | One path for a spread; the engine-level test gains the turn loop, the physical sweep and gouge, Provoked members, zero-hit members (the first mutation pass left three survivors) | FFX only; tests and a tidy |
| `24ad482e` | `ffx-engine-golden` re-pinned once: six digests move, twelve do not (section 5) | FFX only; tests |
| `1c0cc399` | The enemy-intent panel follows the forced turn | FFX only |
| `32f248f6` | Reflect's status text says what the game does; the engine-level test pins a Provoked monster that keeps control (the last mutation survivor) | FFX only |
| `32407992` | The two Chapter XVII bench chain tests get a 60 s timeout (they sat at the 15 s default) | FFX only; tests |
| (the commit with this note) | docs | FFX only |

## 2. The rows (plan id, note row and line, what changed)

Note lines are `FFX-G04.md`: section 8 table row *n* is line 269+*n*; section 1 bullets are lines 15 to 29.

| Plan | Note | What the engine did | What it does now |
|---|---|---|---|
| G1 | row 1 (:270; :16) | a Reflect bounce chose a random living member of the side opposite the holder, whoever cast it | a holder on the **other side from the caster** sends the spell **back to the caster**, always, no draw; a holder on the caster's own side (an ally, or the caster) sends it to a random opposite-side member, one stream-6 draw with two or more legal candidates, the hits lost with none (`kernel/target-builder.ts`) |
| G2 | row 2 (:271; :17) | `bouncesOffReflect`: the authored `reflectable` flag and never a party-wide row | the **record's misc bit 7 decides, per target** (`statuses.ts#reflectableDef`): Hastega, Slowga, the four Nul spells and the monster Fire, Blizzard, Thunder, Water bounce; so do Scan, Life and Full-Life, whose authored flag was missing (9 abilities carry the bit without the flag, none the other way round). An ability with no record keeps its flag |
| G3 | row 5 (:274; :18) | party side: the first Guard or Sentinel holder in list order, no can-act test; enemy side: the highest HP with the Guard mark | the **best score** (current HP, doubled for Sentinel, plus half a Tidus counter in the two Tidus cases), **lowest slot on ties**, the holder must be able to act, for either side (`kernel/cover.ts`) |
| G4 | row 6 (:275) | re-decided for every hit | **once per target, when the targets are built** (`resolveOneHit` no longer redirects) |
| G5 | row 7 (:276) | the enemy Cover's can-act ignored Confuse, Berserk and Provoke | the one can-act gate (`canActSlot`: not Petrified, Confused, Berserk, asleep, Ejected, in battle, not Provoked, not Threatened) serves Cover on both sides |
| G6 | row 9 (:278; :23) | a fresh pick per hit from the living, interleaved with the hit's own draws, always one draw | **all picks first** from the action's whole target set, stream 5, a draw only with two or more candidates, every member of the set a target even with zero hits; each target then runs its hits in a row (`resolveTargets` returns the set; `target-build.ts`) |
| G7 | row 11 (:280; :24) | Confuse: a random living actor of either side except the actor | **own side only, the actor included** (stream 4 for a single-target default attack, none with one candidate) |
| G8 | row 12 (:281) | Berserk: a random foe, always one draw, no legality | the opposite side's **legal set** (Targetable, dead flag, reach), stream 4 only with two or more candidates |
| G9 | row 13 (:282; :24) | Provoke replaced the target of whatever the script chose | at the turn start, after the provoker test (out of battle, dead or Petrified: the bit is cleared and the actor acts normally), the **whole turn is the default attack at the provoker** and the script does not run; a monster whose script keeps control (Natus, Braska's Final Aeon, the Gui body: `research/re-ffx-ai-seymour.md`, `re-ffx-ai-yunalesca-bfa.md` 3.2, `re-ffx-ai-gui.md` 5) still runs it, and its single-target rows go to the provoker (`target-build.ts#provokedAim`, the old per-target redirect, now limited to single-target and random rows) |
| G14 | row 21 (:290; :19) | none | the seven Tidus counters (`rt.coverBond`): +1 when Tidus covers a monster's blow on a party slot and when his action nets a heal on a party slot, -1 (not below 0) on a net loss; they weigh into the Cover score |
| G13 | row 20 (:289) | not done | **needs script data** (note open question 1: which actors set the target class, the only-by id or Targetable 0); the engine's `untargetable` / `hidden` stay the approximation. Listed, not built |

Not in this lane: G10, G11, G12 (slice G-c: the counter chain, the holder's own default attack, the Chapter XII reach path); they wait, as the brief says.

## 3. How it is built

- **Kernels** (`src/battle/ffx/kernel/`, pure, no DOM, no `three`, draws are a callback; rule 1): `target-world.ts` (the 31-slot array, the can-act gate, the picker), `cover.ts` (Cover and the counter array), `legal-set.ts`
  (legal set, reach, group pick, auto-target), `forced-turn.ts` (Berserk / Confuse and Provoke turns), `target-builder.ts` (the builder). Each is a port of one game function (`research/re-ffx-targeting.md` section 0 has the addresses
  and the vector volume the note proved it on: 68,000 builder vectors, 28,000 Cover, 12,000 counter-array, 28,000 legal-set, 28,000 auto-target, 16,000 group-pick, 23,000 + 23,000 forced-turn, 25,240 picker, 0 mismatches).
- **Adapter** (`adapt/target-world.ts`): the engine's combatants onto the game's slots (`actorNumber`: party 0 to 7, aeons 8 to 0x11, monsters 0x14 up in formation order; a combatant the game has no slot for is left out), the
  facts the engine already keeps standing in for the game's flags (in battle = on the field, dead = KO, Petrified = the status, Guard / Sentinel = the statuses plus an enemy's Guard mark), **Targetable** folding in everything
  the engine already decides (untargetable, hidden, this ability's reach, and for a bounce or a spread the never-a-random-pick flag), the command words of an ability (damage kind and reflectable bit from its record), the picker (the
  candidates go to the generator as objects carrying the combatant id, so a preview's `RollPolicyRng` still steers a pick toward an aimed combatant, PR-0153) and the Tidus counters.
- **Engine seams**: `target-build.ts#buildAction` (the targets of one action, with the hits each takes; the plain path when nothing can change them), `buildAimedAction` (a script-aimed row is one build per hit, as the game queues one
  command per named target), `provokedAim`; `forced-turn.ts#forcedTurn` (called by `engine.ts` at the turn start; also by `intent.ts` so the panel is truthful). `resolveAbility` calls `onTargeted` first (a script's `onTargeted` may
  put the Guard on a Guardian that this very action's Cover then finds), then builds the targets, then runs each target's hits.
- **No contract file changes** (`docs/CONTRACTS.md` lists none of the files touched), so there is no `CONTRACT-CHANGES.md` entry; `FFXRuntime` (engine-private) gains the optional `coverBond`.
- **Files under 400 lines**: `targeting.ts` fell from 399 to 295 (the old Cover, Provoke and bounce code is gone); every new file is under 190.

## 4. Proofs and mutants

| Test file | What it proves |
|---|---|
| `tests/unit/parity-ffx-target-builder.test.ts`, `-cover`, `-sets`, `-forced` | the kernels equal the game's machine code: **3,215 vectors** from the note's runs (620 builder over the ten generator classes, 200 Cover, 250 counter array, 400 legal set, 200 group pick, 360 auto-target, 360 Berserk / Confuse and 375 Provoke turns, 450 picker), every output, every changed counter and **every draw's stream and order** compared, plus the note's worked examples E1 to E9 |
| `tests/unit/parity-ffx-engine-targets.test.ts` | the engine equals an **independent oracle** (`helpers/ffxTargetBoard.ts`, which imports nothing from the kernels or adapters; it restates the note in its own terms): 3,000 generated boards of Cover, Reflect and the spread (hits per combatant, lost hits, the stream-4/5/6 draws in order), 2,500 forced turns (Provoke, Berserk, Confuse, a gone provoker clears the bit, a script that keeps control), the Tidus counters, a real engine driven through a Berserk and a Confused party member, a Provoked monster, a gone provoker, Provoke before Berserk, the intent panel, and the record bit (Hastega off a Reflecting Rikku reaches an enemy) |
| `parity-ffx-rng-streams`, `parity-ffx-engine-status`, `sin-core-engine`, `helpers/ffxEngineStatus` | updated for the rules they pinned, with the reason in each |

Mutation check (`D:\Tools\ffx-parity\rc4-react\mutate.mjs`, 51 one-rule changes of the production code, each run against the four kernel files and the engine-level file, the file put back byte for byte after every one):

**51 of 51 caught.** The first pass left three survivors (the turn loop's use of `forcedTurn`, the spread's plain-path clause, the zero-hit members of a spread); the tests added in `c7e71fa4` kill them, and the last pass's one survivor (a script-kept redirect rewriting an all-target row) is killed by the test of the last commit. A mutant that only the kernel fixtures catch is a rule the engine-level boards cannot reach (a dead Guard holder cannot exist after a KO; the equipment Reflect bit; the counter-array arithmetic).

| Mutant | Rule it breaks | Result | Caught by |
|---|---|---|---|
| `refl-always-random` | G1: a holder on the other side sends the spell back to the caster | caught | engine-targets, target-builder |
| `refl-never-random` | G1: a holder on the caster's own side sends the spell to a random opposite member | caught | engine-targets, target-builder |
| `refl-wrong-stream` | the bounce draws stream 6 | caught | engine-targets, target-builder |
| `refl-single-only` | G2: the record bit decides, per target (a multi-target spell bounces too) | caught | engine-targets, target-builder |
| `refl-flag-not-record` | G2: the record bit, not the authored flag | caught | engine-targets |
| `refl-bounce-twice-hits-lost` | a bounce with nobody to land on loses the hits | caught | engine-targets, target-builder |
| `spread-wrong-stream` | G6: the spread picks on stream 5 | caught | engine-targets, target-builder |
| `spread-draw-for-one` | G6: no draw with one candidate | caught | engine-targets, target-builder, target-forced, target-sets |
| `spread-total-per-hit` | G6: the hit total grows by the hit count once | caught | target-builder (kernel fixtures only) |
| `spread-engine-uniform` | G6: a spread deals its hits over the set (the engine's cheap path must not take it) | caught | engine-targets |
| `spread-engine-first-only` | G6: every member of the set is a target (zero hits included) | caught | engine-targets |
| `cover-tie-last` | G3: the lowest slot wins a tie | caught | engine-targets, target-builder, target-cover |
| `cover-no-sentinel` | G3: Sentinel doubles the HP score | caught | engine-targets, target-builder, target-cover |
| `cover-first-holder` | G3: the best score wins, not the first holder | caught | engine-targets, target-builder, target-cover |
| `cover-no-target-term` | G14: half the candidate's counter when the target is Tidus | caught | target-builder, target-cover (kernel fixtures only) |
| `cover-no-candidate-term` | G14: half the target's counter when the candidate is Tidus | caught | target-builder, target-cover (kernel fixtures only) |
| `cover-not-halved` | G14: the counter term is halved | caught | target-builder, target-cover (kernel fixtures only) |
| `cover-ignores-can-act` | G3/G5: the holder must be able to act | caught | engine-targets, target-builder, target-cover |
| `cover-ignores-dead` | G3: a dead holder does not cover | caught | target-builder, target-cover (kernel fixtures only) |
| `can-act-threaten` | G5: Threatened cannot cover | caught | engine-targets, target-builder, target-cover |
| `can-act-confuse` | G5: Confused cannot cover | caught | engine-targets, target-builder, target-cover |
| `can-act-provoke` | G5: Provoked cannot cover | caught | engine-targets, target-builder, target-cover |
| `cover-magic` | G3: only a physical single-target command is covered | caught | engine-targets, target-builder |
| `cover-multi-target` | G3: only a single-target command is covered | caught | target-builder (kernel fixtures only) |
| `cover-user-covered` | G3: the user is never covered | caught | engine-targets, target-builder |
| `cover-hits-kept` | G4: the target keeps none of the hits it handed over | caught | target-builder (kernel fixtures only) |
| `cover-no-bond-feed` | G14: Tidus covering a monster's blow feeds the counter | caught | target-builder (kernel fixtures only) |
| `tidus-only` | G14: only Tidus own actions feed the counters | caught | engine-targets |
| `refl-equipment-bit` | the equipment Reflect bit counts | caught | target-builder (kernel fixtures only) |
| `group-one-no-draw` | the group pick draws also for one group | caught | target-forced, target-sets (kernel fixtures only) |
| `legal-user-exempt` | the user is exempt from the reach test | caught | target-forced, target-sets (kernel fixtures only) |
| `intent-forced` | the intent panel follows the forced turn | caught | engine-targets |
| `provoked-aim-multi` | G9: the script-kept redirect aims single-target rows only | caught (caught after the test added in the last commit) | engine-targets |
| `provoked-aim-off` | G9: a Provoked monster that keeps control aims at the provoker | caught | natus-provoke |
| `cover-engine-guard-mark` | G3: an enemy's Guard mark is a Guard | caught | engine-targets |
| `cover-engine-no-fast-cover` | G3: the engine builds a Cover when someone stands ready | caught | engine-targets |
| `tidus-counter-sign` | G14: a net heal adds, a net loss takes one off | caught | engine-targets |
| `tidus-counter-floor` | G14: a net loss does not take a counter below 0 | caught | engine-targets |
| `confuse-berserk-swapped` | G7/G8: Berserk the opposite side, Confuse its own | caught | engine-targets, target-forced, target-sets |
| `confuse-engine-side` | G7: the engine asks the kernel for Confuse (side 1) when Confused | caught | engine-targets |
| `confuse-picker-stream` | G8: the single-target pick is stream 4 | caught | engine-targets, target-forced, target-sets |
| `group-pick-stream` | a group-target pick is stream 5 | caught | target-forced, target-sets (kernel fixtures only) |
| `provoke-ignores-keeps` | G9: a monster that keeps control ignores the forced attack | caught | engine-targets, target-forced |
| `provoke-keeps-before-provoker` | G9: the provoker is tested first | caught | engine-targets, target-forced |
| `provoke-no-validity` | G9: a gone provoker clears the bit | caught | engine-targets, target-forced |
| `provoke-petrified-ok` | G9: a Petrified provoker is gone | caught | engine-targets, target-forced |
| `provoke-legal-set` | G9: an illegal provoker drops the turn | caught | engine-targets, target-forced |
| `provoke-after-berserk` | G9: Provoke is tried first, then Berserk, then Confuse | caught | engine-targets |
| `provoke-engine-clear` | G9: a gone provoker has the bit cleared | caught | engine-targets |
| `provoke-engine-keeps` | G9: the scripts that keep control are the sourced ones | caught | engine-targets |
| `forced-engine-order` | G9: the turn is forced before the script runs | caught | engine-targets |

## 5. The goldens, explained (once, in their own commit `24ad482e`)

`ffx-engine-golden`: **six of 18 digests move, twelve do not, every outcome stays a victory**. `ffx2-atb-golden` and `ff7-golden` pass unchanged.

| Digest | Old, new | Cause (proved by putting the one rule back and running the file) |
|---|---|---|
| seymour-flux#1, #7 | d362acf6 to 33074c0e, 9f8aaa5c to c3845a | G6, the spread. The line throws Rikku's Gems (17 and 12 spread actions); the hits are now dealt first and each target runs its hits in a row. With the old per-hit processing put back these return to their old values |
| evrae-airship#1, #7 | e5ecff52 to f4927a78, 4740e2ef to b67a717e | G6, the same rule: Photon Spray (7 and 8 times) and Wakka's Power Shot. Evrae's 10 and 22 reflected self-Hastes draw as before |
| yunalesca#1, #7 | c694ec20 to eced7435, a99a90c3 to ae1bbe58 | G2 and its mirror: Hastega off the Reflecting party hastes Yunalesca, so the line's opening changed (section 6). With the bounce rule and the tactic put back, both return |
| the other twelve | unchanged | they build nothing the new rules change: Chapters III, VII, XII, XIV have no Guard holder, Reflect holder or multi-hit random row on the line; IX's Daigoro bites are single-hit spreads (one pick, as before); X's bounces are same-side ones over the same candidates on the same stream |

## 6. Measurement (every FFX chapter on the shipped line, 12 and 500 seeds, before and after)

Method: `tests/unit/ffx-parity-measure.test.ts`, `PYREFLY_MEASURE=1`, `maxWorkers=1`. **Before** = `origin/re-parity-rc4-base` (`f39cd57b`), run in this worktree before any change; **after** = the head of this branch. `z` is the
two-proportion z of the win rate. Raw files: `D:\Tools\ffx-parity\rc4-react\` (`base-12`, `base-500`, `after-12`, `after-500`, `abl-*`).

**500 seeds** (wins; mean party turns; mean party KOs; z of the win rate; seeds that flipped win to loss / loss to win)

| Chapter | before | after | turns b / a | KOs b / a | z | flipped |
|---|---|---|---|---|---|---|
| I Seymour Flux | 499 | 497 | 48.9 / 48.8 | 1 / 1 | -1.00 | 2 / 0 |
| II Yunalesca | 474 | 465 | 154.9 / 148.4 | 12.9 / 14.2 | -1.19 | 31 / 22 |
| III Braska's Final Aeon | 481 | 481 | 241 / 241 | 5.5 / 5.5 | 0.00 | 0 / 0 |
| VII Seymour and Anima | 467 | 468 | 54.9 / 55 | 4.8 / 4.8 | 0.13 | 1 / 2 |
| VIII Evrae | 488 | 488 | 72.6 / 72.6 | 0.7 / 0.7 | 0.00 | 0 / 0 |
| IX Yojimbo | 493 | 493 | 67.4 / 67.4 | 3.9 / 3.9 | 0.00 | 0 / 0 |
| X Seymour Natus | 483 | 483 | 34 / 34 | 1.7 / 1.7 | 0.00 | 0 / 0 |
| XII Seymour Omnis | 436 | 436 | 103 / 103 | 1.3 / 1.3 | 0.00 | 0 / 0 |
| XIV Isaaru | 452 | 452 | 38.2 / 38.2 | 2.9 / 2.9 | 0.00 | 0 / 0 |
| XVII Sin: the Fins and the Core | 442 | 443 | 328.1 / 328.1 | 3 / 3 | 0.10 | 0 / 1 |
| XVIII Sin: the Face | 500 | 500 | 47.2 / 47.2 | 0 / 0 | 0.00 | 0 / 0 |

**12 seeds** (a one-seed move is z about 1, so this is a sanity check and not evidence): wins before to after I 12 to 12, II 10 to 11, III 11 to 11, VII 11 to 11, VIII 12 to 12, IX 11 to 11, X 11 to 11, XII 9 to 9, XIV 11 to 11, XVII 11 to 11, XVIII 12 to 12. Party turns move only in Chapters II (165.7 to 159.4), VIII (71.3 to 74.1: the spread, which reorders the hits and so some fights; with it put back the 500-seed rows are identical seed by seed) and VII (54 to 54.3: a Confused actor).

**Causes, by ablation** (a local switch or a temporary edit, never committed):

- **Chapters I, VIII, XVII** (the spread fires: Gems, Photon Spray, the Fins' Fire Fury): with the old per-hit processing put back (`RC4_ABLATE=spread`) Chapters I and VIII return to the **before** numbers on **all 500 seeds,
  seed by seed** (outcome, party turns, KOs), and Chapter XVII on 499 of 500 (one seed's turns differ, which is the ablation's own approximation of the old order). Chapter I's two lost seeds (499 to 497) and Chapter XVII's one gained seed are a different
  deal of the same odds, not a bias.
- **Chapter II (Yunalesca)**: 474 to 465 wins (z -1.19), party turns 154.9 to 148.4, KOs 12.9 to 14.2. The old line under the new engine collapses (0 of 40 seeds: Hastega cast through Yuna's Reflect hastes the boss), so the line was
  changed to the order the game rewards: Tidus's opening Hastega first, Yuna's Reflect after, and never a Hastega through a Reflect (`src/engine/tactics/yunalesca.ts`; Reflect arrives a turn or two later, hence the extra KOs from the
  boss's counters). With the Hastega bounce put back to the old reading **but the new tactic kept**, the chapter measures **465 / 148.4 / 14.2, identical to the after numbers**: the whole move is the tactic's new opening, and G2 is the
  reason it had to change. With both put back it returns to the before numbers exactly.
- **Chapter VII**: 467 to 468 (z +0.13), turns 54.9 to 55.0: the only mechanism that fires is a Confused actor (G7, seeds 6 and 11 of the first twelve), 1 seed lost and 2 gained at 500.
- Chapters III, IX, X, XII, XIV, XVIII: no change on any seed (the line builds nothing the rules change).

## 7. Open items (none touches a boss or party number)

1. **G13** (the target class, the "only targetable by" id, Targetable 0 from scripts) needs script data; not built. **G-c** (G10 to G12) waits.
2. **Random rows without the record's spread bit** (the reel shots, the Mix ally rows `mix-*`, Daigoro's bite, `anima-pain-boss`, `guardian-shremedy`, 44 rows in all) are the authors' `random-*` stand-ins for group and all-target
   records, where every target takes the full hit count in the game. They are dealt as spreads, as before, because the repo's records carry no target-type word (`Cmd+0x1a`). A group-type spread also deals over every legal foe, where the
   game's mask is the one group the player or the script chose (no fight on the line has two groups).
3. **Processing order.** When the kernel runs, the targets come back in ascending slot order (the order the game visits them: inferred from the builder's output, whose arrays are indexed by slot); when nothing can change the targets
   they keep the list order, as before. A different deal of the same odds, no more.
4. **The Tidus counters start at 0 in every battle**; the game's array is global and its reset point was not read (research open item 4).
5. **"Keeps control when Provoked"** is taken from three scripts' notes (Natus, Braska's Final Aeon, the Gui body); every other monster is taken as 0 (Isaaru's three forms, Ginnem and Daigoro are Provoke-landable and now spend a Provoked turn on the provoker).
6. **Mirrors.** Followed: the Chapter II tactic, the enemy-intent panel (`intent.ts#dryRun`), the status-wiring test helper, comments that named removed helpers. `engine/tactics/advisor-roll.ts` is simulation-driven and follows the engine.
   `ffx/estimate.ts` models none of these rules. **Stale, not changed**: the doc comments of `src/battle/common/types.ts:241` and `:1300` (a contract file: "not party-wide spells"), `research/ffx-combat-core.md:580`, and the prose of
   `src/data/ffx/abilities/whitemagic-haste-slow.ts` and `whitemagic-cure.ts` ("per `bouncesOffReflect`"); the Reflect status text in `src/data/ffx/statuses/core.ts` is updated. `ai/game-rolls.ts#canQueue` (the scripts' own gate) has no Provoke
   test, as the AI lanes read it.
7. **Scan on a Reflecting enemy now bounces** (the record flags it) and reveals nothing; likewise Life and Full-Life on a Reflecting ally. The authored `reflectable` flags of those nine abilities stay as they were; the record decides.
8. The Chapter II line, after the change, still passes `strategy-chapter2` (37 of 40 seeds, the test asks 36).

## 8. Decisions for Bailey

1. **Chapter II's opening.** The game turns a party-wide Hastega back off any Reflect holder, so the shipped line now opens Hastega first and Reflect second (465 wins of 500 against 474, 1.3 more KOs). Keep it, or ask for another
   way to protect the party from Yunalesca's counters (it is a strategy change, not a number).
2. **Hastega, Slowga and the Nul spells bounce off Reflect now** in every chapter (the record bit, per target). It is the game's rule; the guide's wording and `research/ffx-combat-core.md` §4.2 say otherwise and are listed stale above. Say if the strategy guide
   should carry a line about it ("do not Haste a Reflecting character").
3. **Random rows without a spread bit** (open item 2): keep the stand-ins, or add a target-type word to the records so those rows follow the game's group and all-target rules? It touches data for the reel shots and the Mix results.
4. **G13** needs a read of the scripts' property writes; it is the same data the boss-AI lanes would use. Do it with the next read, or leave the approximation.

## 9. Re-run commands (repo root; Node 24; TEMP and TMP on D:)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/parity-ffx-target-builder.test.ts tests/unit/parity-ffx-target-cover.test.ts tests/unit/parity-ffx-target-sets.test.ts tests/unit/parity-ffx-target-forced.test.ts tests/unit/parity-ffx-engine-targets.test.ts tests/unit/parity-ffx-rng-streams.test.ts
TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 tests/unit/ffx-parity-measure.test.ts
node tools/orphans.mjs
```
Tooling outside the repo (`D:\Tools\ffx-parity\rc4-react\`): `export-g04.mjs <repo>` re-exports the fixtures from the note's vector files (a stratified subset per function); `mutants-def.mjs` + `mutate.mjs` run the mutation pass; `compare.mjs base.json after.json` prints the table above;
`abl-apply.mjs` / `abl-multi.mjs` / `inst-apply.mjs` are the temporary ablation and counting switches.

## 10. Final checks

- `tsc --noEmit`: exit 0. `node tools/orphans.mjs`: 36 orphans, the same 36 as the base (the two ffx kernels among them are `drops.ts` and `gear-drop.ts`); none of this lane's modules is one.
- **The whole suite, once** (`vitest run --maxWorkers=4`, JSON report `D:\Tools\ffx-parity\rc4-react\suite.json`, run on `32f248f6`): 4,611 suites, 16,638 tests: 16,340 passed, 111 skipped, 186 failed in **24 files**.
  **22 are art-only**: this worktree has no `public/art` (the paintings are gitignored and live on the main tree's disk), so `art-ref-defaults`, `chapter-meta`, `chapter-meta-evrae`, `chapter-meta-ffx2-leblanc`,
  `chapter-meta-seymour-anima-macalania`, `cutscene-story-poses`, `party-face-manifest`, `pause-remake`, `ui-portrait-face-crop` (145 of the 186) and, under `chapters/`, `chapters-6-7-8-enemy-sprite-manifest`, `den-of-woe-ship-content`,
  `den-of-woe-ship-scene`, `experiment-scene`, `fallen-aeons-ship-content`, `fallen-aeons-ship-scene`, `isaaru-ship`, `leblanc-art`, `leblanc-party-sprites`, `natus-ship-content`, `natus-ship-scene`, `trema-ship-content` and `yojimbo-content`
  fail on a missing painting or manifest (the same 22 files as the RNG lane's note). **The other two were timeouts under load**: `advisor-floor` (1 test, the 15 s default; alone it passes 22 of 22, the longest case 7.9 s) and
  `chapters/sin-fins-core-bench` (2 tests at the 15 s default; alone one took 16.3 s). The latter sat at 14.6 to 15.0 s alone on the RNG lane's tree already; this lane's cost on that chapter is 2 to 3 percent (60 seeds of the
  Fins chapter, base against branch, alternating: 16.5 and 15.9 s against 17.0 and 16.2 s), so the two tests now carry a 60 s timeout (`32407992`, tests only) and pass alone (4 passed, 2 skipped).
- Goldens: `ffx-engine-golden` 18 of 18 on the new pins, `ffx2-atb-golden` and `ff7-golden` unchanged and green. FFX-2 and FF7 source: no diff against the base (`git diff origin/re-parity-rc4-base -- src/battle/ffx2 src/data/ffx2 src/battle/ff7` is empty).
- The final head measures the same as the earlier "after" run on all 500 seeds of every chapter (outcome, turns and KOs, seed by seed), so the table in section 6 is the final one.
- No server was started; the ablation and counting switches were temporary edits that put every file back byte for byte (`git status` clean after each).
- Pushed: branch `re-parity-rc4-react` on `origin`. No deploy, no `main`, no `CHANGELOG.md`, NOW.md, ACTIONS or DECISIONS edits.

## 11. CHANGELOG paragraph (plain words; for the main session to paste, not edited into `CHANGELOG.md` here)

**FFX only.** Spells and blows now find their targets the way the real game does. A spell aimed at an enemy that wears Reflect comes straight back at whoever cast it; a Reflect on your own side sends the spell to a random enemy
instead, and that now includes Hastega, Slowga and the Nul spells, which used to ignore Reflect altogether, so a Haste meant for a party member wearing Reflect goes across to an enemy. Guard and Sentinel now cover for whoever is best
placed (the one with the most HP, doubled for Sentinel, leaning toward whoever Tidus has been looking after), once for the whole attack, and only if the guard is in a state to act. Multi-hit random attacks such as the Gems, Slice and Dice,
the Furies and Evrae's Photon Spray now choose all their targets up front. A Confused fighter strikes only its own side, itself included; a Berserk one only the other side; and a Provoked monster spends its whole turn attacking whoever
provoked it, unless it is one of the few that keep their own head (Seymour Natus, Braska's Final Aeon, the Sinspawn Gui). Chapter II's recommended opening changed with it: Tidus casts Hastega before Yuna puts Reflect up, so the Haste
is not turned back onto Yunalesca. Nothing about any boss or party member's numbers changed.
