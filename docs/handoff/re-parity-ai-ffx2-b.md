# Re-parity, boss AI: the Fallen Aeons, the Magus Sisters, Paragon, the Oversoul Paragon and Trema (Chapters XI and XIII) follow the game's own scripts

Status: **built and committed on branch `re-parity-ai-ffx2-b`, pushed, not merged, not deployed** (2026-10-10). Lane AI-FFX2-b of [the re-parity plan](../plans/re-parity.md)
([boss-AI preflight](../plans/re-parity-ai-review.md)); the source is the research note [`research/re-ffx2-ai-fallen-trema.md`](../../research/re-ffx2-ai-fallen-trema.md),
section 10, rows F1 to F3, M1 to M7, P1 to P6, O1 to O14, T1 to T5 (and A1, M8, O15, G1, which the note marks "same"). Owner: Bailey. Base: `931613a8`
(`origin/re-parity-rc1`, the code of live release 39.4.3). **Game case: FFX-2 only** (AGENTS.md rule 14): no file of `src/battle/ffx`, `src/data/ffx` or `src/battle/ff7` changed;
`ffx-engine-golden` and `ff7-golden` do not import anything this lane touched and are unchanged.

Bailey, 2026-10-08: "It needs to be a 1:1 parity." 2026-10-10: "go full speed ahead please i have a ton of usage on several other accounts".

Nothing on a boss or a party was tuned (hard rule 6 and the lane brief). Every number in the scripts is the script's, as the note records it; every number in the measurement is measured.
The lane was resumed after a usage limit stopped it; the second session verified the first one's work (tsc, the seven parity files, a mutation pass), fixed the test helper so a changed
modulus is caught, re-ran the baseline and the ablations it had not finished, ran the whole suite and wrote this note. A third session (after a second usage stop) re-ran tsc and every parity file and
golden, classified the whole-suite failures one by one, found four files that failed for a reason this lane caused (not art, not load), fixed them in `6c99c770`, and pushed the branch (the earlier note said
"pushed"; it had not been).

Commits (all on `re-parity-ai-ffx2-b`, on top of `931613a8`; the first five were made by the first session, the next three by the second, the last two by the third):

| Commit | What |
|---|---|
| `f7645671` | The engine seams: `AiScript.onResult` (the reaction entry, once per result applied to an enemy) and `AbilityCommand.exactTargets` (a scripted command that names its targets exactly) |
| `4e3db9c6` | Shiva, Anima and the Magus Sisters (rows F1 to F3, A1, M1 to M7) |
| `eccf078d` | Paragon and the Oversoul Paragon (rows P1 to P5, O1 to O14) |
| `31bee189` | Trema (rows T1 to T3, T5) |
| `92be5431` | The Chapter XI Road golden re-baselined once, the older Trema pins moved, the intent preview proven not to move a fight |
| `5424b487` | The exact outcome tables over 120 residue classes (the Sandy-odds mutant is now caught) |
| `27df80b3` | The Oversoul's gate under 40 percent HP: explained and pinned, no behaviour change |
| `6c99c770` | Four files the whole-suite run showed failing because of this lane: the atlas cite for the Oversoul's Osmose, the flag guard's `reflectable`, the pose pin for Final Impact (tests and one cite; no rule changed) |
| (the last commit) | This note |

## What the engine does now

The six fights run the game's decision tables as the note reads them, in our words. Two small pieces of engine plumbing are new, **FFX-2 only**, inert for every script that does not define them:

| Piece | Where | What it is |
|---|---|---|
| The reaction entry | `AiScript.onResult` (`internal.ts`), `ResolveContext.onResult` (`resolve-hp.ts`), called from `resolve-strike.ts` and `resolve.ts`, wired in `engine-core.ts#resolveCtx` | Runs **once for every result applied to an enemy**, after the result's HP, MP and statuses are in: each strike that lands (a three-hit command that lands is three), one for a command that misses or has no effect (a miss resolves all its strikes at once), a status-only or zero-damage strike, the transfer of a drain (delivered to the drainer, the drainer being the source), a Scan or Libra. Regen and Poison ticks keep `onRegen`. The first build counted "once per party action aimed at her" (`engineHooks.ts#notifyEnemiesTargeted`), which that hook still does for Ixion's script |
| Exact-target scripted commands | `AbilityCommand.exactTargets` (contract, additive, `CONTRACT-CHANGES.md` 2026-10-10), `execute.ts`, `resolve.ts`, `simulate.ts` | The game queues a monster's command with a target mask of the characters its script named, whatever group the row can reach, so a copied all-party spell aimed at one girl hits only her. Set by the Oversoul's copy answer and nothing else |
| The script's rolls | `ai/script-rolls.ts` | `random() mod n` is the low 16 bits of one draw taken modulo `n`; a uniform target is the `(draw mod n)`-th living girl in slot order, **no draw below two candidates**, a raw 31-bit draw. The engine keeps its one seeded stream (adopting the game's streams is the RNG batch); the *expressions* are the scripts'. 65,536 is not a multiple of 3, 5 or 6, so those residues are not even and the tables carry the game's bias (`mod 3`: 21,846 / 21,845 / 21,845) |

## Rows F1 to T5: what changed

"Proof" names the test in `tests/unit/parity-ffx2-ai-*.test.ts`. Every table is run against the shipped script, the shipped records and the real resolver, with the rolls enumerated by
`helpers/ffx2ScriptTally.ts#exactTally` (one run per residue class of each `random() mod n`, the probabilities exact to twelve digits).

| Row | Rule | What the engine does now | Where | Proof |
|---|---|---|---|---|
| F1 | Shiva's Triple Attack | Three consecutive polls of Chain Attack (row 0x4100, power 12, one hit, never rolls, recovery 0), each with its own uniform living girl; the second and third add nothing to the gauge and skip the Diamond Dust test. The ability is now one hit on one target; the command record's `hits: 3` override is gone | `ai/fallen-aeons.ts`, `data/ffx2/enemies/fallen-aeons-abilities.ts`, `command-records/enemies.ts` | "F1: Triple Attack is three polls of Chain Attack ..." |
| F2 | Which table the gauge picks | The counter gains 3 first, and the late table is chosen on the new value (65 or more, so a pre-add 62) | `ai/fallen-aeons.ts` | "F2: the table is chosen on the counter AFTER adding 3" |
| F3 | What raises the counter | `onResult` with the reaction guard (not from herself; not while stopped, asleep, petrified, confused, berserk or ejected): +5 per result, so a three-strike command that lands is +15, a miss +5, a status she resists +5 | `ai/fallen-aeons.ts#resultGauge`, the engine seam | "F3: every result applied to her adds 5", "F3 through the resolver" |
| A1 | Anima | Same shape; counter per F3; Oblivion on the 21st poll with no hits | `ai/fallen-aeons.ts` | "interpreter tally: with no hits Oblivion is the 21st poll" |
| M1 | Who casts Delta Attack | Only Cindy, on her first poll with her counter at 100 or more and both Mindy's and Sandy's flags up; the flags drop only by that cast or that sister's death | `ai/magus-sisters.ts` | "M1: only Cindy casts Delta Attack ...", "a fall lowers the flag for good" |
| M2 | Delta Attack reset | Cindy's counter 0 at once; Mindy and Sandy take a reset flag and show 0 then +5 (so 5) at their next poll or reaction | same | "M2: the cast zeroes Cindy at once ..." |
| M3 | Sandy's odds | `random() mod 3`: 0 Razzia, 1 or 2 Attack (21,846 and 43,690 of 65,536), a girl drawn after the roll | same | "Sandy: Razzia 1/3, Attack 2/3, exactly" |
| M4 | Cindy's odds | `random() mod 5`: 0 Absorb, 1 Demi, 2 Regen (a uniform living sister, herself included), 3 or 4 Camisade | same | "Cindy's row: mod 5 = 0 Absorb ..." |
| M5 | White Highwind | Certain on a non-Guard poll when Cindy's, Sandy's and Mindy's HP are each below their own max/4 (integer division, strict); a fallen sister counts as below, no "alive" test | same | "M5: White Highwind is certain ..." |
| M6 | What raises a gauge | +5 on each of her own polls and +5 on every result with no guard: Cindy's Guard gives +5 to each of the three, Regen +5 to its target, White Highwind +5 to each, Absorb's drain +5 to Cindy, a Regen tick +5 (`onRegen`) | same | "M6: every result adds 5 and nothing is guarded" |
| M7 | Regen's length | The Guard's and Cindy's Regen carry the row's counter 50 (about 790 steps, four ticks); Protect and Shell stay until dispelled | `data/ffx2/enemies/magus-sisters-abilities.ts` | "M7: Regen carries the game's counter 50" |
| M8, G1 | Thinking byte 30; the "battle too long" block | Never read, never runs: nothing built | | |
| P1 | When Big Bang answers | **Owner decision kept** (D-146/TR12 = b): an immediate counter after the party action. The script's own timing (the next poll, replacing the move that was due, once) is built behind `PARAGON_OPTIONS.bigBangTiming = 'next-poll'` | `ai/paragon.ts`, `engineHooks.ts` | "TR12 = b, the immediate counter ...", "in the shipped timing the flag is not used" |
| P2 | What sets it | A command whose damage flags have neither the physical nor the magical bit (`damageBits === 0`): Darkness, Charon, Scan, Libra, Steal, the Pilfers, Mix, items; a miss counts; under either timing | same | "a command with NEITHER damage bit sets it", "many results are one flag" |
| P3 | Single-target picks | **Not built**: the near-weighted search needs battle geometry the engine does not model (about 42 / 29 / 29 percent at the start formation); the pick stays uniform | `ai/script-rolls.ts#pickUniform` | "P3 (not built)" |
| P4 | Which Attack is which | `random() mod 4`: 0 poison, 1 poison and confuse, 2 itchy (recovery 60), 3 pierce; the alternation flag drives the other poll (`mod 2`: drain Attack or Genesis) | `ai/paragon.ts` | "row 2 ...", "row 3 ..." |
| P5 | The MP gate | **Owner decision kept** (D-146/TR4 = b): a drained Paragon casts no Genesis and no Big Bang | same | "TR4 = b (kept)" |
| P6 | Stats | Accuracy 95 already came with W3; **MDEF stays 88** (owner decision D-146/TR8 = a, listed below) | `data/ffx2/enemies/paragon.ts` (untouched) | "P6: the stat bytes stay as authored" |
| O1 | Physical miss rate | The ordinary accuracy race (formula 2, ACC 95, Luck 16) since W3; the flat 50 percent is only the record of what the FAQs said | `data/ffx2/enemies/paragon-oversoul.ts` | `trema-oversoul.test.ts` (W3) |
| O2 | The idle limit | **Structural, waits for W4 and Bailey**: stays 20 s of engine time since the last result; `OVERSOUL_IDLE_POLLS = 1200` documents the script's limit (40.04 s at 29.97 steps a second) | `ai/paragon-oversoul.ts` | "the rows the game gives ..." (the 40.04 conversion) |
| O3 | HP thresholds | Strict 32-bit float tests: 20,999 and 83,999 or less at 210,000 HP | same, `hpBelow` | "the HP rows are 32-bit float tests, strictly" |
| O4, O12 | Acting at low HP and MP 0 | **Owner decision kept** (D-151, "it waits to be hit"): behind `OVERSOUL_ESTIMATES.lowHpActsEveryTurn` (false) the HP rows and the MP-0 branch are only reached once a result has landed or the idle limit has passed. The script's own rule is the switch set true. See "The state is never spent" below | same | "O4 and O12 are the game's rule behind one switch" |
| O5 | Final Impact | 14 hits, never rolls, random targets, once per fight (after the Reflect and MP rows), physical (Protect halves it), one discarded target search | same, `data/ffx2/enemies/paragon-oversoul.ts` | "HP row B ..." |
| O6 | When the answer comes | The next poll, never at once | same | "the answers are made on the NEXT poll" |
| O7 | Which results count | Every result applied to it (`onResult`): misses, status-only, its own drain, a monster's | same | "the reaction entry: every result sets the answer state" |
| O8 | What starts the Demi loop | A heal or buff that lands on Paragon (the 11 of `oversoul-lists.ts`, Life and Full-Life included); the loop repeats every poll until another result lands | `ai/oversoul-lists.ts` | "Demi (3): Demi on the whole party every poll" |
| O9 | The copy list | The 32 commands (31 have an ability here; Silence has none), the spell sent back at the caster alone as an exact-target command, an all-party spell too | same | "copy (1): ... ALONE" |
| O10 | The Normal-Attack answer | A uniform living girl, not the attacker | same | "normal (2): ... a UNIFORM girl" |
| O11 | Attack status | None | `data/ffx2/enemies/paragon-oversoul.ts` | "the rows the game gives" |
| O13 | -aga spells | On all the party, no all-targets halving: already so, nothing changed | | |
| O14 | The first turn | The switch to the Oversoul block spends no AI turn: the line plays and the poll goes on | `ai/paragon-oversoul.ts` | "the first poll plays the 'Paragon oversouls!' line and goes on" |
| O15 | Thinking period | Never read: nothing built | | |
| T1 | Story Trema's odds | One tree for the story and the arena (Demi 4/24, Flare 2/24, Mist, Mire and Moon 2/24 each, the chain 12/24) | `ai/trema.ts` | "T1: the chain 12/24 ..." |
| T2 | Trigger order | Ultima first, then the quarter Meteor (which also swallows a skipped half Meteor), then the half Meteor; strict, integer divisions (166,666 / 249,999 / 499,999); one Meteor when a fall passes both lines | same | "T2 ..." (five tests) |
| T3 | The chain | Three commands queued in one poll, targets rolled then; later links start before any row is read, so no HP row falls inside the chain | same | "T3: the chain is queued in one poll" |
| T4 | MP gate | **Owner decision kept** (D-146/TR4 = b): a rolled Demi, Flare or Ultima he cannot afford fails. The script never reads MP and Spellspring zeroes the costs | same | "T4 (kept, TR4 = b)" |
| T5 | Story Beguiling Mire | Power 5 (the one row 0x40d4), as the Fiend Arena's; consistent with D-146/TR2 = a (International/HD data) | `data/ffx2/enemies/trema-abilities.ts` | "T5: Beguiling Mire is one row" |

Engine proofs: `parity-ffx2-ai-plumbing.test.ts` (nine tests on the real resolver: a strike, a three-hit command, a miss, a drain, a Scan, a status-only strike, an exact-target command).

### The state is never spent: what D-151 does and does not hold back

In the script the Oversoul's HP rows and its MP-0 branch come before the answer states and never clear them. So after the first result lands, while he is under 40 percent HP (or
out of MP) he acts on **every poll**, the way the game's does, whatever D-151's gate says: the gate only keeps him still **before** the first result and between idle-limit actions.
The first pass of this session tried the other reading (an HP-row action spends the pending answer: one hit, one action) and measured it: Chapter XIII 406 of 500 (81 %) against 193 (39 %),
link 1 won 438 times against 209. That is a re-tune by interpretation, so it was not kept; it is listed for Bailey below as option C.

## Owner-decision check (DECISIONS.md, `docs/target/decisions*.json`)

Checked before building. Where a row met a decision, the decision stays and the game's reading is built behind one named switch or listed; where a decision only labelled a source conflict
that the script now answers, the script's answer is built and the decision's place is named so it can be put back.

| Decision | What it said | The row | What the build does |
|---|---|---|---|
| D-151 (Chapter XIII option 1) | The Oversoul "waits to be hit, answers, never opens with Big Bang; ... the 50 percent hit rate and HP thresholds are labelled estimates" | O4, O12 (acts on HP and MP every poll), O2 (idle limit), O1, O3 | Waiting kept (`lowHpActsEveryTurn` false); the estimates the script answers are replaced (the race, the float thresholds); the idle seconds are structural and stay 20 s |
| D-146/TR4 = b | His AI still needs the MP (a drained Trema or Paragon casts no spell) | T4, P5 | Kept; the game's Spellspring makes the costs 0, so in the game draining does nothing. Listed |
| D-146/TR12 = b | Big Bang is an immediate counter (normal Paragon, an OFF option) | P1 | Kept; the script's next-poll timing is built behind `PARAGON_OPTIONS.bigBangTiming` |
| D-146/TR8 = a | Paragon MDEF 88 "if T0 finds no third data source" | P6 | Kept at 88; the game's monster row (a third source) says 89. Listed |
| D-146/TR2 = a | International/HD data | T5 | Consistent: the HD files' one row for Beguiling Mire, power 5 |
| D-105 / FA8 | What raises Mindy's counter: every hostile action aimed at her, hit or miss, tagged `[conflict]`, "measured both ways" | F3, M6 | The script settles the conflict (every result, per strike); built as the script says. To put D-105's per-action reading back (the first build's): `...resultGauge(5)` becomes `...attackedHooks(5)` for Shiva and Anima in `ai/fallen-aeons.ts`, and the Sisters' `onResult` in `ai/magus-sisters.ts` becomes `...attackedHooks(5)`. Listed |
| D-187 / D-197 | Chapter XI: 3 s of action time on the three Road links | all timer rows | Untouched: no timer changed unit or value |
| D-410, D-151 | The difficulty he chose is the intended one; nothing is tuned | all | Nothing tuned; the Chapter XIII shift is measured and reported below |
| D-506, D-146/TR5, D-165 | The Retry rule at Trema, retry at Trema, the 3 s estimate | none | Not touched |
| D-104 (FA7), D-107 (FA10) | Darkness against Mindy; Remedy | none | Not touched |

## Timer rows for the W4 merge

Script timers count AI polls, which are logic steps; the engine here still runs on its own tick clock. **No timer changed unit or value in this lane.** Seconds are steps x 0.033367
(29.97 steps a second). The values come from the note's section 8 (units / 95 a step, rounded up); none of them is a script rule except the first two lines.

| Timer | Where it lives now | Steps (polls) | Seconds | W4 action |
|---|---|---|---|---|
| Oversoul idle limit: 1,200 idle polls, the 1,201st acts; reset by any result | `ai/paragon-oversoul.ts`: `idleSeconds` 20, counted in engine ticks (`osQuietSince`, `TICK_RATE_BASE` 3,000); `OVERSOUL_IDLE_POLLS` documents 1,200 | 1,200 | 40.04 (build: 20) | **Structural, waits.** Replace the tick count by a count of idle polls; `OVERSOUL_IDLE_POLLS` is the constant. The ablation with 40.04 s changed nothing on the shipped line (193 of 500 either way) |
| Sisters' Regen counter 50 (four ticks) | `data/ffx2/enemies/magus-sisters-abilities.ts`, `duration: 50` on Cindy's Regen and the Guard | about 790 | 26.36 | The status clock (W4) reads the counter; a tick is 16,000 units, 169 steps, 5.64 s |
| Thinking per fallen girl | engine (`thinking`), unchanged | 30 | 1.00 | none |
| Shiva Attack recovery / Blizzaga charge / Heavenly Strike charge, recovery / Diamond Dust charge, recovery | the rows | 85 / 59 / 85, 68 / 102, 169 | 2.84 / 1.97 / 2.84, 2.27 / 3.40, 5.64 | W4 wires the records; Chain Attack recovers in 0 (the follow-up polls come straight away) |
| Anima Attack recovery; Pain charge, recovery; Oblivion charge, recovery | the rows | 79; 79, 63; 158, 158 | 2.64; 2.64, 2.10; 5.27, 5.27 | same |
| Cindy Guard / White Highwind charge, recovery; Absorb charge, recovery; Demi charge; Regen charge; Delta Attack recovery | the rows | 174, 116; 145, 58; 116; 87; 289 | 5.81, 3.87; 4.84, 1.94; 3.87; 2.90; 9.64 | same |
| Sandy Attack recovery; Mindy spell charge | the rows | 126; 82 | 4.20; 2.74 | same |
| Paragon Attack recovery; Itchy Attack recovery; Genesis / Big Bang charge, recovery | the rows | 56; 34; 67, 45 | 1.87; 1.13; 2.24, 1.50 | same |
| Oversoul Attack recovery; Judgment charge, recovery; Genesis / Big Bang charge, recovery; Final Impact charge, recovery; -aga and Osmose charge; Demi charge; Ultima and Holy charge; Dispel charge | the rows | 43; 52, 18; 52, 35; 52, 43; 31; 35; 43; 26 | 1.43; 1.74, 0.60; 1.74, 1.17; 1.74, 1.43; 1.03; 1.17; 1.43; 0.87 | same |
| Trema Thundering Wave recovery; Moon, Mire, Mist recovery; Flare and Ultima charge; Demi charge; Meteor charge, recovery | the rows | 98; 66; 82; 66; 98, 82 | 3.27; 2.20; 2.74; 2.20; 3.27, 2.74 | same |
| First poll after the start (opening counter, before the trim and the first-strike roll) | engine opening gauge | Shiva 14.7 to 43.7, Anima 13.7 to 40.8, Cindy 25.2 to 74.9, Sandy 21.9 to 65.1, Mindy 20.5 to 60.7, Paragon 9.7 to 28.9, Trema 14.3 to 42.4 | x 0.033367 | W4's opening gauge |

Counters that count the actor's own polls are action counts, not clocks, and need no conversion: Shiva's gauge (Diamond Dust on the 35th poll at 102 with no hits), Anima's (Oblivion on the 21st),
a Sister's (100 on the 20th poll), Cindy's eight-poll Guard cycle, the Sisters' and Aeons' +5 per result. Not built, as the lane says: "every gauge freezes during an effect" (the live measurement contradicts it).

## Goldens

Re-baselined once, reason **"game-script parity"**: `tests/unit/chapters/den-of-woe-carry.test.ts`, the pins of Chapter XI's Road (`ch11`: the chain starting at Shiva; `sisters`: the chain starting at the
Sisters), seeds 1 to 8 each, so sixteen digests. Chapters 5 and 6 in the same block are byte-identical to the old pins (their sixteen digests did not move), so nothing outside the Road moved.
`ffx2-atb-golden` (Chapters 4 and 5, D = 0 and D = 1500, Wait) and `ffx2-hit-closes-menu` are unchanged and pass; `ffx-engine-golden` and `ff7-golden` import nothing this lane touched and are unchanged.
Outcomes at D = 0: Shiva won 8 of 8 before and after; the Sisters 8 of 8 before and 6 of 8 now (seeds 4 and 7 are lost). The old digests are in git at `931613a8`.

Why each digest moved (first event at which the old and the new log differ, from `D:\Tools\ffx-parity\ai-ffx2b\diverge-*.json`, the same driver as the pin):

| Digest (seed) | Outcome at D = 0, old -> new | Events, old -> new | First event that differs | Cause |
|---|---|---|---|---|
| `ch11` 1 | victory -> victory | 2,472 -> 2,685 | Shiva's first move (event 3): Heavenly Strike on Yuna -> Kick on Rikku | The roll is now the script's `random() mod 4` (16 bits) and the girl a separate 31-bit uniform pick; the old AI rolled a small `int(0, 3)` for the quarter and picked the girl with `rng.pick`. Other draws, so another move or girl (the F2 table is a second reason) |
| `ch11` 2 | victory -> victory | 938 -> 2,804 | event 3: Heavenly Strike -> Kick | same |
| `ch11` 3 | victory -> victory | 2,649 -> 2,134 | event 3: same move, Rikku -> Paine | same (only the girl differs first) |
| `ch11` 4 | victory -> victory | 1,913 -> 1,403 | event 95: Blizzaga, Paine -> Yuna | the first moves agree by chance; the first difference is a later girl |
| `ch11` 5 | victory -> victory | 2,435 -> 2,734 | event 87: Kick on Yuna -> Heavenly Strike on Paine | a later move (the late table after the +3, F2, and +5 per result, F3, change when it starts and when Diamond Dust comes) |
| `ch11` 6 | victory -> victory | 2,589 -> 3,095 | event 3: Blizzaga -> Heavenly Strike | rolls, as seed 1 |
| `ch11` 7 | victory -> victory | 1,841 -> 2,356 | event 51: Kick -> Heavenly Strike | as seed 5 |
| `ch11` 8 | victory -> victory | 2,741 -> 2,360 | event 3: Blizzaga on Rikku -> Kick on Yuna | rolls, as seed 1 |
| `sisters` 1 | victory -> victory | 1,781 -> 2,063 | event 13: Cindy's first Not-So-Mighty Guard puts Regen on Sandy with `ticksRemaining` null -> 43,849 | M7: Regen now carries the row's counter 50 and ends by itself |
| `sisters` 2 | victory -> victory | 2,209 -> 1,828 | event 6: the same Regen, null -> 72,152 | M7 |
| `sisters` 3 | victory -> victory | 693 -> 2,610 | event 6: the same Regen, null -> 45,429 | M7 |
| `sisters` 4 | victory -> **defeat** | 2,189 -> 1,174 | event 3: Mindy's first move, Passado on Paine -> Blizzaga on Rikku | Mindy picks her girl first and then rolls `mod 6`; the old AI rolled sixths first and picked the girl after |
| `sisters` 5 | victory -> victory | 1,763 -> 1,160 | event 3: Mindy, Thundaga on Rikku -> Passado on Paine | as seed 4 |
| `sisters` 6 | victory -> victory | 2,077 -> 2,098 | event 6: the Regen, null -> 72,543 | M7 |
| `sisters` 7 | victory -> **defeat** | 2,219 -> 600 | event 3: Sandy, Attack on Yuna -> Razzia on Paine | M3: Razzia is 1/3, not 1/4; a different first move; the fight is then lost within one link |
| `sisters` 8 | victory -> victory | 1,378 -> 1,735 | event 10: Mindy, Passado -> Blizzaga | as seed 4 |

All sixteen diverge from a rule row, not from a bug: in every case the first differing event is a decision whose roll expression, odds or status length the note replaces. The two new defeats (Sisters, seeds 4 and 7)
are losses at the fixed decision time of this golden and say nothing about play: over 500 seeds the whole chapter's win rate is 490 -> 486.

## Measurement (the shipped `intendedStrategy`, whole chain)

`tests/unit/ffx2-parity-measure.test.ts` (`PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=500 PYREFLY_MEASURE_CHAPTERS=ffx2-fallen-aeons,ffx2-trema`), the base commit `931613a8` as a scratch copy
(`git archive 931613a8 src` plus the harness, checked equal to the commit file by file; outputs in `D:\Tools\ffx-parity\ai-ffx2b\`) against this branch. The 12-seed rows are seeds 1 to 12 of the same run.
**Measured, never tuned.**

| Chapter | 12 seeds, old -> new | 500 seeds, old -> new | link 1 (500) | party turns | engine turns | minutes | party KOs |
|---|---|---|---|---|---|---|---|
| XI Fallen Aeons (Shiva, the Sisters, Anima) | 12/12 -> 12/12 | 490 (98.0 %) -> **486 (97.2 %)** | 500 -> 500 | 50.2 -> 58.3 | 88.9 -> 103.2 | 2.6 -> 3.3 | 0.1 -> 0.2 |
| XIII Trema (the Oversoul Paragon, then Trema) | 3/12 -> 6/12 | 213 (42.6 %) -> **193 (38.6 %)** | 237 -> 209 | 118.9 -> 108.1 | 240.0 -> 189.5 | 7.3 -> 6.6 | 2.2 -> 2.1 |

Paired by seed over 500: Chapter XI 477 won both, 13 won -> lost, 9 lost -> won, 1 lost both; Chapter XIII 78 won both, 135 won -> lost, 115 lost -> won, 172 lost both. Chapter XIII's twelve seeds
read `WWLLLLLLLLWL` -> `LLWWWWWLLLLW`. By the lane's rule (two or more of twelve seeds, or ten points over 500) Chapter XIII is a mover on the twelve and **flat on the 500**: the churn (250 seeds changed hands, net minus 20)
is draws, not odds, the way the Seymour lane's Natus read; the 500 is the measurement, the twelve is a sample of it. **Chapter XI is not a mover on wins**; it is longer, by about a sixth (party turns 50.2 -> 58.3), and the cause is named below.

**Ablation, Chapter XIII, 500 seeds each** (`PYREFLY_ABL=<row>` puts that row back to what the first build did, in the new engine; the control reproduces the measurement seed for seed):

| Variant | Wins | Link 1 | Reading |
|---|---|---|---|
| this branch | 193 | 209 | |
| the old Oversoul script wholesale (`OS_OLD`) | **219** | **237** | link 1 is exactly the old 237: **the Oversoul rows together (the state machine of O6 to O8, with O10) are the whole move of link 1**; the old engine reads 213 |
| `OS_OLD` with T1, T2, T3 put back | 209 | 237 | lands near the old engine (213; the rest is T5's power and the plumbing) |
| O10: the Normal-Attack answer back at the attacker | 173 | 184 | the random girl is worth **+25** to the party on link 1; the other Oversoul rows are therefore worth -53 |
| O4: the game's switch (`lowHpActsEveryTurn` true) | 193 | 209 | identical seed for seed: after one hit the state stands, so the gate no longer matters (see "The state is never spent") |
| O2: the idle limit at 40.04 s | 193 | 209 | no effect: the shipped line never leaves him idle |
| O5 (Final Impact not reducible), O9 (the copy by the row's own group), O11 (Attack with Itchy), O14 (the first turn spent) | 193 each | 209 | no effect on the shipped line |
| T1: the first build's story odds (Demi 3/24, Flare 3/24) | 190 | 209 | -3 |
| T2: the fixed trigger order, half then quarter | 193 | 209 | none |
| T3: one chain link per turn | 192 | 209 | -1 |
| T4: no MP gate (the game's rule; **owner decision kept**) | **96** | 209 | the shipped line drains Trema's MP first; in the game that does nothing |
| the unbuilt reading C: an HP row spends the answer state (one hit, one action) | 406 | 438 | not built; listed for Bailey |

Cause, in a sentence: Chapter XIII moves on its first link because the game's Oversoul keeps acting on every poll once it has been hit under 40 percent HP (the script never clears its answer state in those rows), where the first build
answered each hit once and at once; Trema himself reads the same (92.3 % of the link-1 winners win, 89.9 % before). The Oversoul's physical Attack rolls the game's accuracy race and never hit the chapter's preset builds in the
500 seeds (0 of 4,534 attacks; it was 0 of 9,950).

**Ablation, Chapter XI, 500 seeds each** (it is not a mover on wins, but it is a sixth longer, and the table says which row):

| Variant | Wins | Party turns | Engine turns | Minutes | Party KOs |
|---|---|---|---|---|---|
| old (`931613a8`) | 490 | 50.2 | 88.9 | 2.6 | 0.1 |
| this branch | 486 | 58.3 | 103.2 | 3.3 | 0.2 |
| every F, M row put back (F1 F2 F3 M1 M3 M4 M5 M6 M7) | 489 | 50.5 | 89.2 | 2.6 | 0.2 |
| **M5** put back (White Highwind only with all three alive) | **496** | **50.2** | **88.5** | 2.6 | 0.2 |
| M6 put back (the gauge only on the sister's own turn and when she is targeted) | 488 | 58.3 | 102.9 | 3.3 | 0.1 |
| M1 put back (whichever sister polls first casts Delta Attack) | 484 | 58.3 | 103.1 | 3.3 | 0.2 |
| F3 put back (once per party action aimed at her) | 486 | 58.3 | 103.2 | 3.3 | 0.2 |

**M5 is the whole move of Chapter XI**: with it put back the chain is exactly the old length (50.2 party turns) and wins 496. In the game a Cindy who stands alone under a quarter of her health casts White Highwind on every poll (a fallen sister
counts as "below"), which heals the sisters still standing by about 4,500 a hit: 15 casts in the old 500 seeds, 1,353 now, and the intended line needs about eight more turns a run to get through it. The other rows, M1 (Delta Attack from Cindy only: 19 casts, 12 now), M6 and F3,
move nothing measurable on this line. The ablation of every row lands on the old engine (489 against 490, 50.5 against 50.2 turns).

Per-ability counts over the 500 seeds (hits, the shape of each fight; `before-500-usage.json` and `after-500-usage.json`): Shiva's Heavenly Strike 690 -> 665, Blizzaga 688 -> 662, Kick 1,355 -> 1,442; Anima's Oblivion
519 -> 525; Cindy's Camisade 709 -> 1,663 (2/5 against 1/4 of a longer fight), Guard 569 -> 1,041, **White Highwind 15 -> 1,353**, Delta Attack 19 -> 12; Sandy's Razzia 569 -> 781; the Oversoul's Final Impact 500 -> 481, Firaga 551 -> 274,
Attack 9,950 -> 4,534; Trema's Meteor 441 -> 394, Flare 65 -> 41, Demi 97 -> 103.

## Proofs and tests

All of it run by the third session on the final tree (`--maxWorkers=4`, tools by path), not taken from an earlier report:

* `tsc --noEmit`: clean (2,634 files of the worktree, the seven parity files and the helper among them).
* **The seven parity files, `tests/unit/parity-ffx2-ai-*.test.ts`: 88 tests, all pass** (Magus Sisters 12, Fallen Aeons 11, Trema 13, Oversoul 25, plumbing 9, Paragon 13, intent preview 5). Each walks its fight's decision rows
  against the shipped script and the real resolver, with every `random() mod n` enumerated over 120 residue classes (the Sandy-odds mutant is caught, see `5424b487`). **Interpreter tallies reproduced** (the note's section 0 method:
  every flag and every `random() mod n` expanded, the exact outcome table out): Shiva with no hits, the early table for 21 polls, the late one from the 22nd, Diamond Dust on the 35th poll at counter 102
  ("interpreter tally: no hits ..." in `parity-ffx2-ai-fallen-aeons.test.ts`); Anima with no hits, Oblivion on the 21st poll after twenty polls of +5 (same file); the exact odds Sandy 21,846 / 43,690 of 65,536, Cindy's mod-5 row, the
  Oversoul's mod-3 / mod-8 / mod-2 rows and Trema's 24-way tree to twelve digits.
* **Goldens and the older Chapter XI / XIII files, 13 files, 136 tests, all pass:** `den-of-woe-carry` (the re-baselined Road pins), `ffx2-atb-golden`, `ffx2-hit-closes-menu`, `ffx-engine-golden` and `ff7-golden`
  (unchanged), `data-ffx2-command-records`, `chapters/fallen-aeons-{ai,engine,bench}` (the bench: 11 tests, the whole Road at 200 seeds, intended line 190 of 200) and `chapters/trema-{ai,engine,options,oversoul}`.
* Game-case isolation: `git diff --name-only 931613a8..HEAD` lists nothing under `src/battle/ffx`, `src/data/ffx`, `src/battle/ff7`, nor the FFX and FF7 goldens.
* `node tools/orphans.mjs`: none of the lane's modules (`script-rolls.ts`, `oversoul-lists.ts`, `ffx2ScriptTally.ts`) is listed. Source files over 400 lines among those touched: only `src/battle/common/types.ts` (2,871; 2,864 at the base, +7 for
  `exactTargets`), which was over it long before this lane.
* **The whole unit suite, once, on `27df80b3`** (the second session; 1,949 s under the host's load, `--maxWorkers=4`; log `D:\Tools\ffx-parity\ai-ffx2b\fullsuite.log`): **1,017 files: 980 passed, 30 failed, 7 skipped; 15,413 tests: 15,115 passed,
  196 failed, 101 skipped, 1 todo.** The third session classified every failure by its error text:

  | Class | Files | Tests | What |
  |---|---|---|---|
  | Art-only (no `public/art` in a worktree) | 21 | 181 failed tests, plus 5 files that fail on import | the same 21 files as the Seymour and W-lane lists: `ui-portrait-face-crop` (145 tests), `chapters/trema-ship-content` 4, `art-ref-defaults` 4, `pause-remake` 3, `chapters/isaaru-ship` 3, `chapters/den-of-woe-ship-content` 3, `chapter-meta-seymour-anima-macalania` 3, `chapter-meta-evrae` 3, `chapters/natus-ship-scene` 2, `chapters/natus-ship-content` 2, `chapters/leblanc-art` 2, `chapters/fallen-aeons-ship-content` 2, `chapter-meta-ffx2-leblanc` 2, `cutscene-story-poses` 1, `chapters/fallen-aeons-ship-scene` 1, `chapters/den-of-woe-ship-scene` 1, and the five that fail on import because `public/art/manifest.json` is missing (`party-face-manifest`, `chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`) |
  | Host load (15 s default timeout) | 5 | 7 | `advisor-floor` 2, `ui-pause-stack` 2, `live-url-follows-host` 1, `art-derive` 1, `chapters/sin-fins-core-bench` 1: FFX files and source-scanning tests this lane does not touch; the run took 1,949 s where the Seymour lane's took 658 s. Re-run by the third session: `art-derive` passes (18 tests); with a long timeout `live-url-follows-host` (14), `ui-pause-stack` (6) and `sin-fins-core-bench` (6, 2 skipped) pass; `advisor-floor` timed out again in a whole-file run on the loaded host (716 s) and passes case by case (the Braska case alone: 10 s). None of them reaches a file this lane changed except through the additive type field. |
  | **Caused by this lane** | 4 | 8 | `learn-atlas-data` 4 and `learn-atlas-stage` 2 (no cite for `ffx2-trema` / `x2-shared-osmose`, which the Oversoul's list now carries), `ffx2-ability-flags` 1 (`reflectable` read by nothing), `enemy-action-pose` 1 (Final Impact is physical). **Fixed in `6c99c770` and re-run: all four files pass** (47 tests) |

  Nine of the 30 files are not art-only (five timeouts, four real), so the count alone (the 21 to 24 expected) would have hidden four regressions; the classification was done by error text. The suite was not re-run whole after
  `6c99c770` (the brief allows one whole run; the change is one cite, one list entry and one pin, and every file that failed for a non-art reason was re-run).

## What is stale and waits on Bailey

**Strategy-guide text and comments** (listed, not rewritten: the guides are player-facing wording that is Bailey's to approve):

* `src/data/guides/ffx2-trema.ts`
  * `DRAIN`, the hints on `Target MP`, `Soul Spring` and the Spherechange to Gunner, and the tactic `src/engine/tactics/ffx2-trema.ts` (step 2, "drain his MP first"): the files say Spellspring makes his spell costs 0, so
    in the game draining does nothing. The build keeps the drain because Bailey kept it (D-146/TR4 = b); the guide still calls it "disputed" and "one source", which the game's own files now settle.
  * `METEOR_LINES` and the `TREMA`, `BELOW HALF` phases: "below a half, and again below a quarter, Meteor comes down" is not what the script does when a fall passes both lines between two of his polls (one Meteor,
    the half Meteor skipped for good); Ultima comes before the Meteors when all three lines are passed.
  * `OVERSOUL_WAITS`: "answers each hit", "a spell comes back at whoever cast it" (alone, an all-party spell too: true), "anything else draws its Attack": the Attack goes to a **random** girl, not the one who hit it; the
    answer is made on its **next** turn and only the last result before that turn counts; "Left alone for long" is 40.04 s of running clock in the game, 20 s here (O2).
  * The hint "A plain Attack: it only answers with its own Attack, which often misses": the Attack goes to a random girl, and against the chapter's preset builds it never hit (0 of 4,534 in the 500-seed run; 0 of 9,950 in the old one).
  * Phase `BELOW 4/10`: "It still waits to be hit": after the first hit it acts on every poll under 40 percent (the state is never spent, see above).
  * `BIG_BANG` and its hint (normal Paragon only): "answers any hit its guard cannot soften with Big Bang" is "any result of a command with neither the physical nor the magical damage bit", about 80 party commands
    including Scan, Libra, Steal and the Pilfers, and a miss counts.
* `src/data/guides/ffx2-fallen-aeons.ts`: the SHIVA and ANIMA phase notes, "Every blow on her brings Diamond Dust / Oblivion sooner", mean every **result**: a multi-hit command is +5 per strike and a miss is +5
  (Delta Attack's rule and its "any one sister down" lines in this guide, `chapter-meta-fallen-aeons.ts` and `chapter-ffx2-fallen-aeons.ts` stay true: Sandy, Mindy or Cindy falling disarms it for good). The `Dispel`
  hint and the `DELTA` rule's "Dispel the guard Cindy puts on her sisters": the Regen in it now ends by itself after about 26 seconds, Protect and Shell stay.
  White Highwind: a lone Cindy under a quarter now casts it on every poll (15 casts in the old 500-seed run, 1,353 now), which the guide does not say.
* `src/data/guides/docs/ffx2-trema.ts`, `docs/ffx2-fallen-aeons.ts` (the community FAQ transcriptions: "20 seconds", "Delta Attack ... drops your whole party to 1 HP", the odds): history, left as quoted.
* `research/ffx2-fallen-aeons.md` (sections 4.1 to 4.3), `research/ffx2-trema.md` (4.1, 4.2, 12.2): the note's section 10 names the lines they got wrong.
* `docs/plans/trema-bench.md`, `docs/plans/fallen-aeons-bench.md`, `docs/plans/chapter-trema-review.md`, `docs/plans/chapter-fallen-aeons-review.md`: the old tables and assumptions.
* **What the player sees, not words: Final Impact's pose.** Final Impact is physical now (O5; the row has the physical bit and Protect halves it), and the shared presenter rule `EnemyActionPose` draws a physical enemy
  action with the actor's attack painting when it has one. `public/art/characters/paragon/` has `attack.png`, so on the live build the Oversoul's Final Impact would draw its Attack painting where it drew the cast painting.
  Nothing in this lane touched the presenter; the pin in `enemyPhysicalRows.ts` records the consequence. Listed for Bailey (decision 10).
* The enemy-intent panel (`src/battle/ffx2/intent.ts`) needed **no change**: it dry-runs `AiScript.decide` on a clone of the state and samples it, so the new rules reach it by themselves.
  `parity-ffx2-ai-intent.test.ts` proves that asking does not move a fight: five links are played twice, asking at every decision and never, and the logs and every enemy's AI memory are byte-identical.
  What the panel could newly say (the Sisters' handshake, the Oversoul answering next turn, the one-Meteor skip) is player-visible text and waits for Bailey's yes (hard rule 9).

## Open items

1. **The Oversoul's idle limit in seconds (O2)** is structural and waits: 1,200 idle polls (40.04 s of running clock) against the build's 20 s of engine time. It needs W4's logic-step clock and Bailey's word; `OVERSOUL_IDLE_POLLS`
   is the constant. It does not move the shipped line.
2. **P3, the near-weighted target search** of the normal Paragon's five single-target Attacks (about 42 / 29 / 29 percent at the start formation) needs the positions and facing the engine does not model; the pick stays uniform.
   The normal Paragon is the OFF option; the shipped Chapter XIII fields the Oversoul.
3. **P5, the exact MP check** of the normal Paragon (a Genesis or Big Bang started with too little MP fails when its charge ends and the charge is spent) is not built; the owner's gate (TR4 = b) stays.
4. **Silence** (command row 0x3179) is on the Oversoul's copy list and has no ability here, so 31 of the 32 copies exist; no dressphere of Chapter XIII teaches it.
5. **Trema's chain** is modelled in his AI memory and started at his next polls (the first two links recover in 0); the game queues the three commands in one poll and a queue consumer starts them back to back (the note's [M]: read, not run).
   No HP row can fall between the links in either; an action by another actor at the very same step could in principle land between them here. Not observable in the 500 seeds.
6. **The note's other [M] items** are used as the note reads them and not proven further: variables start at 0, the drain transfer as a result of its own (tested at engine level, not run in the game), Spellspring reaching the effective
   status word, the cost check for monsters.
7. **Shared files changed** (for the W4 and AI-lane merges, all FFX-2 only and inert for a script that defines neither new seam): `src/battle/ffx2/internal.ts` (`AiScript.onResult`), `resolve-hp.ts` (`ResolveContext.onResult`),
   `resolve-strike.ts` and `resolve.ts` (the four call sites; `resolve.ts` also reads `exactTargets`), `engine-core.ts#resolveCtx` (the wiring), `execute.ts` and `simulate.ts` (pass `exactTargets` through), the contract
   `src/battle/common/types.ts` (`AbilityCommand.exactTargets`, entry in `docs/CONTRACT-CHANGES.md`), the command records `data/ffx2/command-records/enemies.ts` (Chain Attack: no `hits` override) and `party.ts` (Osmose), the four enemy
   data files (`fallen-aeons-abilities.ts`, `magus-sisters-abilities.ts`, `paragon-oversoul.ts`, `trema-abilities.ts`), the two numbers-only fixtures (`tests/fixtures/parity/ffx2/ability_differences.json`, `command_rows.json`),
   and, from the whole-suite run, the atlas cite table `learn/atlas/cites.ts` (one entry: Osmose on the Oversoul's list), `tests/unit/ffx2-ability-flags.test.ts` (`reflectable` listed as unread on purpose) and the shared pose pin
   `tests/unit/helpers/enemyPhysicalRows.ts` (Final Impact). Merge note: any lane that adds an ability to a chapter's list needs a cite in `learn/atlas/cites.ts`, or two atlas test files fail.
   **W4 also edits `src/battle/ffx2/ai/paragon-oversoul.ts` and the engine core**: the merge there is `idleElapsed` and `OVERSOUL_ESTIMATES.idleSeconds` (replace by a count of idle polls against `OVERSOUL_IDLE_POLLS`) and the `ticks` argument;
   everything else in the file is decision logic. Lane (c) (Ixion) still uses `attackedHooks`, `AC_TRIGGER_FLAG` and `randomGirl` from `ai/fallen-aeons.ts`; they stay.
8. **Files over 400 lines**: none added; `src/battle/ffx2/intent.ts` (733) was over it before this lane and is unchanged.
9. The orphan check (`node tools/orphans.mjs`) lists none of the new modules.

## Decisions for Bailey

Each of these is a place where the game's script and an owner decision differ, or where the build had to pick. None is changed here; each reverts or flips in one place.

1. **Draining his MP (D-146/TR4 = b).** The game's files say Spellspring makes Trema's and the Oversoul's spell costs 0 and the scripts never read MP, so draining them does nothing in the game. The build still fails a rolled spell he cannot
   afford, because you kept that reading and wrote it into the guide. Measured: with the gate removed (the game's rule) the shipped line, which drains his MP first, wins Chapter XIII 96 of 500 (19.2 %) against 193 (38.6 %); the guide,
   the tactic and the Soul Spring and Gunner hints would all be teaching something the game does not do. Keep, or follow the game (`tremaCanAfford` in `ai/trema.ts`, `paragonDrained` in `ai/paragon.ts`)?
2. **The Oversoul under 40 percent HP (D-151, "waits to be hit").** Three readings are measured on the shipped line, Chapter XIII 500 seeds: **A, as built** (waits before the first hit; after it the script's state stands and he acts on every poll) 193 wins;
   **B, the game's rule** (`lowHpActsEveryTurn` true: he also acts untouched) 193 wins, identical seed for seed; **C, one hit buys one action** (the HP rows spend the answer state, not built) 406 wins, link 1 438. A and B differ only when he
   is left alone. Which reading do you want? C is the nearest to the first build's feel and the furthest from the game.
3. **Big Bang's timing for the normal Paragon (D-146/TR12 = b, an OFF option).** Kept as an immediate counter; the script's next-poll timing is built behind `PARAGON_OPTIONS.bigBangTiming`. Switch, or leave while the option is off?
4. **Paragon's MDEF (D-146/TR8 = a).** 88 stays; your own condition was "if T0 finds no third data source" and the game's monster row (89) is one. One line in `data/ffx2/enemies/paragon.ts`; a one-point change to a defence stat of the normal form, which is the OFF option (the Oversoul block already has 89).
5. **What raises Shiva's, Anima's and the Sisters' counters (D-105 / FA8).** The script settles your `[conflict]`: every result applied to her, per strike, misses and no-effect results included, guarded for the aeons and unguarded for the Sisters. Built as the script says.
   Chapter XI stays at 98 -> 97 percent on the shipped line. Keep, or put your per-action reading back (the place is in the owner-decision table)?
6. **Cindy alone casts White Highwind on every poll while she is under a quarter** (M5: no "alive" test; a fallen sister counts as below). It is the script, it lengthens Chapter XI by about a sixth on the shipped line, and it is the reason the
   intended strategy needs more turns. Keep as the game's?
7. **The Oversoul's idle limit** (20 s here, 40.04 s in the game): leave until W4 puts the engine on logic steps, then follow the game?
8. **Words.** The stale guide text above and the enemy-intent panel (it could say the Sisters' handshake, the Oversoul answering next turn, the one-Meteor skip) are player-visible: a yes for a rewrite batch, or leave until the merge?
9. **Chapter XIII's difficulty.** D-410 records that the difficulty you chose is the intended one; nothing here is tuned. On the shipped line the chapter reads 213 -> 193 of 500 (flat within the draws), the first link moves and Trema does not;
   the benches that D-410 quotes (6.5 percent) play a different line and were not re-run here.
10. **Final Impact's painting.** Now that Final Impact is physical (the game's row), the shared pose rule draws the Oversoul's Attack painting for it instead of the Cast painting (the Paragon art has both). Keep (the pose
    follows the row, as it does for every other boss), or pin Final Impact to Cast? The second is one line in the presenter's rule or the Oversoul's ability data, and is a look decision, so it waits for you.

## Re-run

The third session re-ran the 12-seed measurement on the final tree (`PYREFLY_MEASURE_SEEDS=12`, both chapters): Chapter XI `WWWWWWWWWWWW`, Chapter XIII `LLWWWWWLLLLW`, every sum identical to `after-12.json`, so the tables above are
reproducible and the later commits moved nothing.

From the worktree root (`D:\Final Fantasy\.claude\worktrees\re-parity-ai-ffx2-b`; tools by path, never `npx`; always `--maxWorkers=4`):

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/parity-ffx2-ai-*.test.ts
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/chapters/den-of-woe-carry.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ff7-golden.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=500 PYREFLY_MEASURE_CHAPTERS=ffx2-fallen-aeons,ffx2-trema PYREFLY_MEASURE_OUT=<out>.json PYREFLY_MEASURE_USAGE=<usage>.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/ffx2-parity-measure.test.ts
```

The base measurement: `git archive 931613a8 src package.json tsconfig.json vite.config.ts vitest.config.ts` into a scratch folder with `tests/unit/ffx2-parity-measure.test.ts`, its helpers and a `node_modules` junction to the shared one
(`D:\Tools\ffx-parity\ai-ffx2b-base`, checked equal to the commit's `src` file by file), then the same command there. The 500-seed results are in `D:\Tools\ffx-parity\ai-ffx2b\` (`before-500.json`, `after-500.json`, the usage tables
beside them; `abl\` holds every ablation). The ablation copy (`D:\Tools\ffx-parity\ai-ffx2b-abl`, never committed) is the final tree plus one `PYREFLY_ABL=<rows>` switch per row (`F1 F2 F3 M1 M3 M4 M5 M6 M7 O2 O4 O5 O9 O10 O11 O14 T1 T2 T3 T4`,
`SPEND` for the unbuilt reading, `OS_OLD` for the whole first-build Oversoul script); its control (no switch) reproduces `after-500` seed for seed.

## CHANGELOG paragraph

**FFX-2 only. The bosses of Chapter XI (Shiva, the Magus Sisters, Anima) and Chapter XIII (the Oversoul Paragon and Trema) now decide what to do the way the game's own battle scripts say.** Shiva's Triple Attack is three separate
Chain Attacks, each at its own target, and she and Anima charge their big attacks faster with every hit that lands on them (each hit of a multi-hit move counts, and so does a miss). Only Cindy can cast Delta Attack, and only once both
Mindy and Sandy are charged; Sandy uses Razzia one time in three and Cindy uses Camisade two times in five; Cindy's Regen wears off after about 26 seconds; and a Cindy left alone under a quarter of her health casts White Highwind on every
turn, which makes that fight about a sixth longer. The Oversoul Paragon answers on its next turn, sends a copied spell back at whoever cast it, answers a plain attack at a random girl, and keeps attacking on every turn once it has been
hit and is under 40 percent health. Trema's story and arena fights now share one set of odds (Demi one turn in six), his three-hit chain can no longer be split by a Meteor or an Ultima, and if one blow takes him past both Meteor lines
at once he casts one Meteor, not two; his Beguiling Mire hits harder. The Oversoul Paragon's Final Impact counts as a physical blow, so Protect halves it. Nothing was re-tuned: on the intended strategy Chapter XI is still won about 97 times in 100 (it was 98) and Chapter XIII about 39 in 100 (it was 43).
