# Re-parity RC4-L3: the item reactions (Auto-Potion, Auto-Med, Auto-Phoenix) and the Overdrive results (rider test, hit removal)

Status: **built, tested and pushed on branch `re-parity-rc4-items`; not merged into `main`, not deployed** (2026-10-11). Cut from `origin/re-parity-rc4-base` (`f39cd57b`: the live build `fcecfa74` plus RC3 plus each game's own random streams). **Game case: FFX only** (AGENTS.md rule 14): FFX-2 has its own auto-abilities in its own exe and no Swordplay, Bushido or Fury. Nothing under `src/battle/ffx2`, `src/data/ffx2`, `src/battle/ff7` or `src/data/ff7` is in these commits; `ffx2-atb-golden` and `ff7-golden` pass unchanged. Owner: Bailey; the standing orders this answers are in the briefs README (2026-10-08 "It needs to be a 1:1 parity", 2026-10-09 "Your findings need to be implemented into live builds as the decompilation work progresses", 2026-10-10 "go full speed ahead please" and "ill go with all your recommendations"). Nothing on a boss or a party member was tuned. No new screen, no new content.

## 0. In one paragraph

The item reactions and a Bushido's rider test are single functions of `FFX.exe` that the engine had approximated. They now run the game's own rules, each proven against the game's machine code run in an emulator: **Auto-Potion** fires at or below half after a hit that dealt HP damage (also at 0 HP, where the potion is then lost), **Auto-Med** answers only a Poison, Zombie, Darkness or Silence that the hit newly inflicted (so it no longer answers Petrify, Sleep, Confuse, Berserk, Slow or Curse), **Auto-Phoenix** is tried in the death check when there was no Auto-Life, by the first able holder in slot order, with a Phoenix Down only. Every one of them pays its item **once** when it is queued (the engine used to pay it twice), and the death check cancels what a dying character had queued. A clean Bushido takes its (Immune) row for a target on which the first pass lands no rider, which includes a target that already carries it. And a random-target Overdrive (Slice and Dice, Lulu's Fury) plans every hit of its menu record over the enemies first, then the result takes the missing ones away from the enemies holding the most (stream 16), where the engine drew a fresh target for each remaining hit.

## 1. Commits on `re-parity-rc4-items` (oldest first)

| Commit | What | Case |
|---|---|---|
| `fb9ba2f4` | Kernels `kernel/reaction-items.ts`, `kernel/overdrive-result.ts`, three vector fixtures, two kernel tests; nothing imports them yet | FFX only |
| `95edfda9` | Lane F wired: `adapt/reactions.ts`, hooks in `hit-apply.ts`, `hp.ts`, `engine-end.ts`, `engine.ts`, `execute.ts`, `ticks.ts`; three engine-level tests | FFX only |
| `26284b8d` | Lane B wired: `adapt/overdrive-result.ts`, `overdriveShape.ts`, `abilities.ts`, `FfxStream.OverdriveRemoval = 16`; engine-level test | FFX only |
| `15d284ca` | `ffx-engine-golden`: one digest re-baselined with its cause (section 4); the dry-run clone copies the new runtime fields | FFX only; tests plus 4 lines of the clone |
| (this commit) | this handoff | docs |

## 2. What changed, row by row (the plan's ids; the note and its line)

Notes: `FFX-G02` (KO, Petrify, equipment statuses, the auto-items), `FFX-G05` (Mix, bag, the action-record queue), `FFX-G01` (Overdrive results). Lines are the note's own section numbers.

| Row | Game (proof) | The engine before (file:line on the base) | Now |
|---|---|---|---|
| **F1** Auto-Potion (G02 E9 = G05 4.2, G02 3.9) | HP <= floor(max/2) (unsigned compare, so 0 qualifies), only after a hit that dealt positive HP damage, one record per character, Can-act, Potion then Hi-Potion then X-Potion [E, 6,000 vectors on 0x007b2850; the hit applier's gating is read only] | `ticks.ts:148-155`: after the action, `hp*2 < max`, no class limit, no Can-act; fed by `counter-inputs.ts:36-37` (HP damage above 0 **or MP damage**) | `adapt/reactions.ts#reactToHit` from `hit-apply.ts`, the decision is `kernel/reaction-items.ts#autoPotion`. A wearer at 0 HP queues and loses the potion |
| **F2** Auto-Med (G02 E10 = G05, 3.9) | only a status **newly inflicted by this hit** among Poison, Zombie, Darkness, Silence and not given by equipment; one record per character; Can-act; Remedy first for two or more, else Antidote, Holy Water, Eye Drops, Echo Screens, else Remedy [E, 9,000 vectors on 0x007b2510; the old values taken before the write-back are read only] | `ticks.ts:27-33,156-167`: Eye Drops, Echo Screen, Antidote, Holy Water, Remedy; any of ten statuses present on any later hit | `reactToHit` compares the hit record before and after (`before.record`, `step.result.record`); `kernel/reaction-items.ts#autoMed` |
| **F3** Auto-Phoenix (G02 E11 = G05, 3.8) | once, in the death check of a victim that died of HP loss with **no Auto-Life**; the first able holder in slot order (party, then aeons), stock of Phoenix Down 0x2006 at least 1, no Mega Phoenix [E, 6,000 vectors on 0x007b27b0] | `ticks.ts:27-28,175-186`: after any action, any wearer, Phoenix Down then Mega Phoenix, repeatedly | `hp.ts#koActor` calls `reactToDeath` only when the victim has no Auto-Life; `kernel/reaction-items.ts#autoPhoenix`. A monster victim has no rescuer (a monster's auto-ability block is zero in the exe; G02 open question 6) |
| (found by the new tests) | the item is paid when the record enters the queue, once (G02 3.9, G05 3.4) | `collectReactions` spent the item (`ticks.ts:123`), then `executeCommand` spent it again (`execute.ts:303`); with a stack of 1 the reaction failed with "No items left" | one payment, at queue time; `FFXRuntime.prepaidItem` makes `executeCommand` take it as spent |
| **B1** the Immune row per target (G01 15, 16; 4.3) | a clean Bushido takes the (Immune) row for a target on which the first pass lands **zero riders**: Eject spent when the target is immune or already carries it; the weak Delay when the delay byte is odd; the four Breaks when each is immune (255) or already carried [E-probe: real 0x00789740 on 6,708 targets; the rule is mapped for the swept inputs] | `overdriveShape.ts:61-66 immuneToRider`: immune iff every rider status has resistance 255 or the Delay flag | `immuneToRider` asks `kernel/overdrive-result.ts#ridersLanding` through `adapt/overdrive-result.ts`. **Petrified targets are unmapped (G01 open question 6) and are not special-cased** |
| **B5** hit removal (G01 4.2, 8; the plan's own finding) | the full menu hit count is spread over the targets first (stream 5 per pick), the missing hits are removed one at a time from the targets holding the most (stream 16, a draw each, also with one target and none when nothing is left), the rest land target by target in character order; Demi and Ultima Fury and Tornado subtract from every target [E, the real result handler over the real command table, 19,970 scenarios] | `abilities.ts:154-159`: Slice and Dice's Fail (`failHits: 3`) and Fury (`hits = casts`) pick a fresh target for every remaining hit | `ResolveOptions.spreadHits`; `adapt/overdrive-result.ts#planSpreadHits`; `FfxStream.OverdriveRemoval = 16` |

What waits: **F4 and F5** (the 62-slot reaction queue and its priority insertion: a record paid at insert and refunded by the executor, the order of reactions inside one hit) need an architecture change and Bailey's yes (rule 10). **B2 to B4** wait for their gates (the rank store emulation, the animation script read). The reactions run in the order they were queued, Auto-Med before Auto-Potion within a hit, after the action's counters (the game puts a counter ahead of the Med and Potion records of its pass, so for a single wearer the order already agrees).

## 3. Proofs and mutants

**Kernel vectors** (private harness `D:\Tools\ffx-parity\rc4-items\export_*.py`, which re-use the FFX-G02 and FFX-G01 emulation scripts; the real machine code, the independent Python model agreed on every exported vector):

| File | Vectors (of runs) | What |
|---|---|---|
| `tests/fixtures/parity/ffx/reaction_items.json` | 1,932 (of 16,000) | Can-act 0x007b24a0, Auto-Potion, Auto-Med, Auto-Phoenix; the stock, queue-class and Can-act inputs were read from the real functions on the same memory |
| `tests/fixtures/parity/ffx/overdrive_removal.json` | 1,600 (of 19,970) | the real result handler 0x007afe00: pending hits per target before and after, the mask, the draws taken and their stream |
| `tests/fixtures/parity/ffx/bushido_rider.json` | 1,908 (of 6,708) | byte 0x16 of the real first-pass record for the four Bushido on random and swept targets. 1,642 non-Petrified targets agree with the kernel except **6 Dragon Fang targets** (the note's open case); the 266 Petrified targets are not claimed (164 of them disagree (Dragon Fang 56 of 69, Banishing Blade 58 of 63, Tornado 50 of 66, Shooting Star 0 of 68): the rule is unmapped there) |

**Fresh vectors** (not selected into the fixtures; a scratch test replayed them and they are not committed): 12,000 more reaction vectors (seed 777: Can-act 1,500, Auto-Potion 3,000, Auto-Med 4,500, Auto-Phoenix 3,000) and 7,391 more removal vectors (seed 31337, 2,619 of them drawing on stream 16) all agree with the kernels, and the independent Python model agreed with the emulation on every one.

**Tests**: `parity-ffx-reaction-items.test.ts` (16) and `parity-ffx-overdrive-result.test.ts` (15) replay every vector and show deliberate wrong kernels disagree; `parity-ffx-engine-reactions.test.ts` (700 generated fights against an oracle typed again from the note, nine mutants), `parity-ffx-engine-reactions-live.test.ts` (15, the real hit pipeline and the real item records, including the spent-once check and the dry-run clone), `parity-ffx-engine-overdrive-result.test.ts` (17: 900 generated targets for the rider test, Banishing Blade through `shapeOverdrive` and `resolveAbility` against carried and immune Breaks; 400 Fury and 200 Slice and Dice fights over one to four enemies against an oracle that reads streams 5 and 16 from its own generator).

**Mutation sweep of the real engine** (`D:\Tools\ffx-parity\rc4-items\mutate.cjs`: one source line changed, the named test files run, the file restored byte for byte):

| Mutant (one change to the real source) | Result |
|---|---|
| F: an item reaction is spent again when it runs (the old double spend) | caught (Tests  6 failed / 11 passed (17)) |
| F: the hit applier never asks Auto-Med or Auto-Potion | caught (Tests  6 failed / 11 passed (17)) |
| F: the death check does not cancel the dead character's queued records | caught (Tests  1 failed / 10 passed (11)) |
| F: the death check never tries Auto-Phoenix | caught (Tests  4 failed / 24 passed (28)) |
| F: Auto-Phoenix is tried even when the victim had Auto-Life | caught (Tests  1 failed / 27 passed (28)) |
| F: an Auto-Phoenix whose rescuer cannot act keeps the Phoenix Down | caught (Tests  2 failed / 9 passed (11)) |
| F: the reactions never run (the list is dropped) | caught (Tests  6 failed / 11 passed (17)) |
| B1: the Immune row only for a target immune to every rider (the old rule) | caught (Tests  2 failed / 15 passed (17)) |
| B5: the removal is not made (the old fresh pick per remaining hit) | caught (Tests  4 failed / 13 passed (17)) |
| B5: the removal draws on the wrong stream (5 instead of 16) | caught (Tests  3 failed / 14 passed (17)) |
| B5: the spread is not set for Fury (every cast picks for itself) | caught (Tests  3 failed / 14 passed (17)) |
| F: the dry-run clone shares the queued reactions with the battle | caught (Tests  1 failed / 16 passed (17)) |
| B5: a Fury with no casts still plans and draws (the zero-hit guard removed) | caught (Tests  1 failed / 16 passed (17)) |

## 4. Goldens, explained

`ffx-engine-golden`: **one digest of 18 moves**, `braskas-final-aeon#1` (all seven links, seven victories before and after). The other 17, `braskas-final-aeon#7` included, are byte for byte what they were. `ffx2-atb-golden` and `ff7-golden` are unchanged. Cause, event by event (logs dumped before and after, `D:\Tools\ffx-parity\rc4-items\logs`): link 1 is identical for 617 events and differs at the turn Jecht Beam lands **Petrify** on Auron (Tetra Bracer, Auto-Med). The old engine answered it at once with a Remedy and spent **two** Remedies; the game's Auto-Med does not answer Petrify, so nothing happens and the line's own Soft (Lulu) cures it on her turn. Links 2 to 7 follow because the chain carries the bag and each member's state on. Ablation: with the lane B files put back the digest is the same new value (lane B moves no golden: no golden line sends Slice and Dice or a Fury at two enemies); with the lane F files put back the log is the old one.

## 5. Measurement (every FFX chapter, shipped line, 12 and 500 seeds, before and after)

Before = `origin/re-parity-rc4-base` (`f39cd57b`); after = the branch head. `tests/unit/ffx-parity-measure.test.ts`, `PYREFLY_MEASURE=1`, `PYREFLY_MEASURE_SEEDS=1-500`; raw files `D:\Tools\ffx-parity\rc4-items\{base,after}-{12,500}.json`. `z` is the two-proportion z of the win rate.

### FFX, 500 seeds

| Chapter | wins before | wins after | turns b/a | KOs b/a | z | seeds that changed outcome |
|---|---|---|---|---|---|---|
| seymour-flux (identical per seed) | 499 | 499 | 48.9 / 48.9 | 1 / 1 | 0 | 0 |
| yunalesca (identical per seed) | 474 | 474 | 154.9 / 154.9 | 12.9 / 12.9 | 0 | 0 |
| braskas-final-aeon | 481 | 473 | 241 / 242.2 | 5.5 / 5.6 | -1.2 | 22 |
| seymour-anima-macalania (identical per seed) | 467 | 467 | 54.9 / 54.9 | 4.8 / 4.8 | 0 | 0 |
| evrae-airship (identical per seed) | 488 | 488 | 72.6 / 72.6 | 0.7 / 0.7 | 0 | 0 |
| yojimbo-cavern (identical per seed) | 493 | 493 | 67.4 / 67.4 | 3.9 / 3.9 | 0 | 0 |
| seymour-natus (identical per seed) | 483 | 483 | 34 / 34 | 1.7 / 1.7 | 0 | 0 |
| seymour-omnis (identical per seed) | 436 | 436 | 103 / 103 | 1.3 / 1.3 | 0 | 0 |
| isaaru-via-purifico (identical per seed) | 452 | 452 | 38.2 / 38.2 | 2.9 / 2.9 | 0 | 0 |
| sin-fins-core | 442 | 441 | 328.1 / 327.9 | 3 / 3 | -0.1 | 13 |
| sin-face (identical per seed) | 500 | 500 | 47.2 / 47.2 | 0 / 0 | 0 | 0 |

### FFX, 12 seeds

| Chapter | wins before | wins after | turns b/a | KOs b/a | z | seeds that changed outcome |
|---|---|---|---|---|---|---|
| seymour-flux (identical per seed) | 12 | 12 | 48.3 / 48.3 | 1.3 / 1.3 | 0 | 0 |
| yunalesca (identical per seed) | 10 | 10 | 165.7 / 165.7 | 14.1 / 14.1 | 0 | 0 |
| braskas-final-aeon | 11 | 11 | 233 / 235.1 | 6 / 5.8 | 0 | 0 |
| seymour-anima-macalania (identical per seed) | 11 | 11 | 54 / 54 | 5 / 5 | 0 | 0 |
| evrae-airship (identical per seed) | 12 | 12 | 71.3 / 71.3 | 0.6 / 0.6 | 0 | 0 |
| yojimbo-cavern (identical per seed) | 11 | 11 | 65.3 / 65.3 | 3.6 / 3.6 | 0 | 0 |
| seymour-natus (identical per seed) | 11 | 11 | 35.4 / 35.4 | 2.4 / 2.4 | 0 | 0 |
| seymour-omnis (identical per seed) | 9 | 9 | 102.1 / 102.1 | 1.9 / 1.9 | 0 | 0 |
| isaaru-via-purifico (identical per seed) | 11 | 11 | 37.6 / 37.6 | 3 / 3 | 0 | 0 |
| sin-fins-core | 11 | 10 | 355.5 / 353.3 | 4.1 / 4.2 | -0.6 | 1 |
| sin-face (identical per seed) | 12 | 12 | 47.3 / 47.3 | 0 / 0 | 0 | 0 |


### The two chapters that moved, and the cause (500 seeds, ablation by putting one lane's files back)

Eleven chapters, nine of them identical to the seed (every outcome, party turn and KO the same). **Two moved**, both inside sampling (z -1.2 and -0.1), each named to its rows:

| Chapter | configuration | wins of 500 | party turns | party KOs | seeds whose outcome differs from base |
|---|---|---|---|---|---|
| braskas-final-aeon | base (before) | 481 | 241 | 5.5 | 0 |
| braskas-final-aeon | after (the branch) | 473 | 242.2 | 5.6 | 22 |
| braskas-final-aeon | lane B files put back | 473 | 242.2 | 5.6 | 22 |
| braskas-final-aeon | lane F files put back | 481 | 241 | 5.5 | 0 |
| sin-fins-core | base (before) | 442 | 328.1 | 3 | 0 |
| sin-fins-core | after (the branch) | 441 | 327.9 | 3 | 13 |
| sin-fins-core | lane B files put back | 443 | 327.9 | 3 | 5 |
| sin-fins-core | lane F files put back | 439 | 328.2 | 3 | 11 |

- **Chapter III (Braska's Final Aeon), 481 -> 473 of 500** (15 seeds won to lost, 7 lost to won; only 22 seeds are identical to the seed, because a Petrify that is cured on a turn instead of at once changes everything after it in a 240-turn chain). **Row F2, and nothing else**: with the lane F files put back all 500 seeds are the base's, to the turn and the KO; with the lane B files put back it is the same 473. Cause, seen in the event log (section 4): Auron's Auto-Med used to drink a Remedy, two of them, on a Petrify (and on Sleep, Confuse, Berserk, Slow, Curse); the game's does not. The line cures it on a turn instead.
- **Chapter XVII (Sin: the Fins and the Core), 442 -> 441** (7 seeds won to lost, 6 lost to won; 421 of 500 identical to the seed). **Both lanes move it**: with the lane B files put back (so only lane F) it is 443, five seeds' outcome different; with the lane F files put back (only lane B) it is 439, eleven different; together 441, thirteen. Lane F is the same Auto-Med rule (the build carries Auron's Tetra Bracer); lane B is B5: this is the one shipped chapter where Slice and Dice, Fury or a Bushido meets several enemies (two Fins and the Core).
- The other nine chapters do not move at all, which is the expected size of lanes that only act where an Auto-Med/Auto-Potion/Auto-Phoenix wearer is hit, or an Overdrive meets two or more enemies (Auto-Potion and Auto-Phoenix are worn by no authored build).
- The "after" tables were measured on `26284b8d` (the two wiring commits); the later commit changes nothing a measurement can see (a guard for a Fury with no casts, the dry-run clone, tests, the golden file), which the golden at the head confirms.


### The suite: all 1,103 test files at `4b0607b7`

`npx tsc --noEmit` is clean. The whole suite ran in two parts with `--maxWorkers=4 --testTimeout=400000` (the first attempt, with the default 15 s, crawled: the PC had 16 logical CPUs at 100 percent and about 110 node processes from the other lanes, so 85 of 1,103 files finished in 20 minutes and two tests of `chapters/sin-fins-core-bench` timed out at 15 s; with the long timeout that file passes in 22 s and 24 s). Part one is `vitest related` over every changed source file: **457 files, 443 passed, 13 skipped, 1 failed** (5,457 tests passed). Part two is the other 646 files: **all passed** (11,482 tests). The one failure is `tests/unit/chapters/trema-ship-content.test.ts` "shipped kit on Trema: a Soul Spring drains him first, Three Stars follows, the Dark Knights use Darkness" (FFX-2, Chapter XIII; expected `x2-soul-spring`, got `x2-alchemist-stash-phoenix-down`): it fails identically on the unchanged base tree `f39cd57b` (run in the worktree `re-parity-w2`), so it is not this lane's. Art-only failures: none in this worktree (`public/art` is present). `node tools/orphans.mjs`: 36 orphaned modules before and after, none of this lane's.

## 6. Open items

1. **The first pass's own draws are not modelled** (found while reading G01 section 3, not a row of the plan): the game calculates the menu record once for every target before the minigame, spending the user's mode 0 and mode 1 streams, and the recalculation draws again (G01 section 4.1: "Draws of the first pass are not reused"). The engine has no first pass, so the user's own streams sit that many draws behind the game's after an Overdrive. It changes which numbers later hits get, not any rule.
2. The plan path (`spreadHits`) applies to a **clean** Slice and Dice and to Fury at 16 casts as well, because the game's handler recalculates every target's hits in character order whatever the grade: with two or more enemies the hits land target by target instead of in pick order (same picks, same distribution, other damage rolls). The generic random-target move (FFX-G row G6, lane L2) still resolves hit by hit; when it lands, these Overdrives are already on the same footing.
3. Equipment-given Poison, Zombie, Darkness or Silence (the exclusion in Auto-Med) cannot occur in the engine: no auto-ability gives them (G02 3.4). The kernel and the adapter honour the exclusion anyway; the engine drops a permanent instance at a KO where the game keeps the equipment word (lane FFX-E).
4. Auto-Phoenix for a monster victim (monsters rescuing monsters, slots 0x14 to 0x1b) is not wired: a monster's auto-ability block is zero (G02 open question 6).
5. A character who is asleep when a physical hit lands counts as awake for the reactions of that hit (the engine's own wake rule; the note does not say where the game wakes a sleeper).
6. Petrified targets of a Bushido (G01 open question 6) and six Dragon Fang targets of the probe are unmapped; the rider rule is the one the note maps.
7. Stale text: `research/ffx-combat-core.md` lines 1784 to 1787 (Auto-Potion "below 50 percent", Auto-Phoenix "any KO'd ally") and the comment history of `ticks.ts` (removed) describe the old rules; the `FFX-G02` section 7 table lists the corrections. `ffx/estimate.ts` and `engine/tactics/advisor-roll.ts` run the real engine on a copy, so they follow; `cloneCtx` copies the new runtime fields.

## 7. Decisions for Bailey

1. **Chapter III and XVII: Auron's Auto-Med no longer answers Petrify** (nor Sleep, Confuse, Berserk, Slow, Curse). That is the game's rule (G02 3.9), and the old engine's Remedy for a Petrify was never the game's. The shipped line cures it with Lulu's Soft on a turn instead. Nothing was tuned; Chapter III went from 481 to 473 wins of 500 (z -1.2, inside sampling) and Chapter XVII from 442 to 441. If you would rather keep the old gift, it is a deliberate departure from 1:1 and I will not do it without your word. (Your 2026-10-01 picks D-310 and D-311 for the Bushido rows, "all four Breaks" and "per target", stand: the game's rule agrees with both and only adds the already-carried case.)
2. **The reaction queue (F4, F5)**: building the game's 62-slot record list (priority insertion, pay on insert, refund by the executor) is an architecture change (XL). Recommended: not now; the visible effect is only the order of reactions inside one hit.
3. Nothing else here needs a decision; every row is parity.

## 8. Re-run

```
TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/parity-ffx-reaction-items.test.ts tests/unit/parity-ffx-overdrive-result.test.ts tests/unit/parity-ffx-engine-reactions.test.ts tests/unit/parity-ffx-engine-reactions-live.test.ts tests/unit/parity-ffx-engine-overdrive-result.test.ts tests/unit/ffx-engine-golden.test.ts
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=<file> node ".../vitest.mjs" run tests/unit/ffx-parity-measure.test.ts
D:\Tools\ffx-parity\venv\Scripts\python.exe -I D:\Tools\ffx-parity\rc4-items\export_reaction_vectors.py 20261111 2000 <out>   (also export_b16_vectors.py, export_removal_vectors.py, make_fixtures.py)
```

## 9. Player-facing CHANGELOG paragraph (FFX)

**FFX: Auto-Med, Auto-Potion and Auto-Phoenix now work the way the game's do, and two Overdrive details follow the game.** Auto-Med only reaches for a cure when a hit gives you a Poison, Zombie, Darkness or Silence you did not already have, and it no longer burns a Remedy on Petrify, Sleep, Confuse, Berserk, Slow or Curse; when two land at once it uses a Remedy, otherwise the matching cure (Antidote, Holy Water, Eye Drops, Echo Screens) and a Remedy only if that one has run out. Auto-Potion drinks at exactly half HP or below, only after a hit that took HP off, and a character who is knocked out by that same blow loses the potion; Auto-Phoenix raises a fallen friend once, with a Phoenix Down only (never a Mega Phoenix), using the first able wearer in party order, and does nothing for someone who still had Auto-Life. Each of these now spends one item, not two. In the Overdrives, Auron's Banishing Blade, Shooting Star and Dragon Fang now also take their stronger "immune" strike against a foe that already has the status they would inflict, and Slice & Dice's miss and Lulu's Fury with fewer casts now spread all their hits over the foes first and then take the missing ones away from the foes that were hit most, instead of re-aiming each remaining hit (it only shows when two or more foes are standing).
