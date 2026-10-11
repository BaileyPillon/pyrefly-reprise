# RC4 lane L1: gear and auto-ability decode, then equipment auto-statuses and SOS statuses (FFX only)

Status: **built, tested, measured and pushed on branch `re-parity-rc4-gear`; not merged, not deployed** (2026-10-11). Cut from `origin/re-parity-rc4-base` (`f39cd57b`: live r40-rc + RC3 + the games' own random streams). **Game case: FFX only** (AGENTS.md rule 14): FFX-2 builds its characters from dresspheres and the garment grid, and none of these addresses exist in `FFX-2.exe`. `ffx2-atb-golden` and `ff7-golden` pass unchanged; nothing under `src/battle/ffx2` or `src/data/ffx2` changed.
Owner: Bailey. His words, as the brief quoted them: 2026-10-08 "It needs to be a 1:1 parity. this is very useful for our project."; 2026-10-09 "Your findings need to be implemented into live builds as the decompilation work progresses."; 2026-10-10 "go full speed ahead please" and "ill go with all your recommendations". Deploys need his word.
Plan: `D:\Tools\ffx-parity\coverage\wiring-plan-draft-2026-10-11.md`, lanes FFX-C and FFX-E. Notes: `FFX-G03.md` (gear and the stat builder) and `FFX-G02.md` (auto-statuses, sections 3.3 to 3.6 and 4).

## 0. In one paragraph

The engine read gear in a narrower way than the game does. It took the **best** tier of a family where the game **adds** every worn percent (Yuna's Blessed Ring, the Dream's End and Garden of Pain builds and the Sin build wear two tiers of one family); it gave a character a critical bonus of 3 where the game gives **3 per worn piece** (6 with a weapon and an armour, read by the 47 commands with the equipment-crit bit, the plain Attack among them); it raised a resistance byte "to a maximum" where the game **adds** the bytes and clamps at 255, and it made a Curse Ward half a Curseproof where the game makes them the same full immunity. It also never applied an SOS status at all (Rikku's Shell Targe in Macalania, SOS Shell, did nothing), applied the Auto-* statuses once at battle start and lost them at the first KO for good. All of it is the game's own functions now: a gear kernel over the game's 134 auto-ability records and an auto-status kernel (apply, restore, the SOS toggle, the sweep at the end of every action), each proven against the real machine code in the emulator, and engine-level tests against oracles that do not import the kernels. Nothing on a boss or a party member was tuned.

## 1. Commits on `re-parity-rc4-gear` (oldest first)

| Commit | What | Rows |
|---|---|---|
| `ad70296e` | Gear kernel `kernel/gear.ts`, the table as numbers `kernel/gear-table.ts`, our ids over it `adapt/gear-ids.ts`, the engine's view `adapt/gear.ts`; 708 emulator vectors `tests/fixtures/parity/ffx/gear_loop.json`; nothing wired | FFX-C kernel |
| `4fb4da45` | Auto-status kernel `kernel/auto-status.ts`; 746 emulator vectors `auto_status.json`; nothing wired | FFX-E kernel |
| `c495426e` | The engine reads gear through the kernel: `equipment.ts`, `effectiveStats.ts`, the `EquipmentDef.bonusCrit` default and doc comments (CONTRACT-CHANGES entry), `parity-ffx-engine-gear.test.ts` | C1 to C4 |
| `94664425` | `adapt/auto-status.ts` wired: battle start, the sweep after every action and reaction, the Regen payout, revive, the fayth's Auto-Life, Petrify ending; 110 scenario traces `auto_traces.json`; `parity-ffx-engine-auto-status.test.ts` | E1 to E3 |
| `75de9029` | `ffx-engine-golden` re-baselined once, each moved digest explained in the comment beside the table | goldens |
| `8aa468d9` | The gear decode is shared between calls while the gear is unchanged; two function names I had written in comments without a source are removed; the prep screen's summed chips get a DOM test | no behaviour change |
| (this note) | the handoff and the screenshot | docs |

The golden table is stale between `c495426e` and `75de9029` (the commit that moves it was split from the commit that re-pins it, so that there is one re-baseline for the whole lane, not two). The branch tip is green.

## 2. The difference rows, what changed, proofs

| Row | Note and line | What changed | Proof |
|---|---|---|---|
| **C1** percents summed | FFX-G03 section 1 (line 19), section 4.1 steps 3 to 5 (138-140), section 8 item 1 (610) | `equipment.ts#bonusPercentFor`, `#offensiveBonusPercent`, `#defensiveBonusPercent` return the sum of every worn tier (for the four damage families the low byte of it, the byte the game's percent modifier reads); `effectiveStats.ts#effectivePool` is the builder's arithmetic (32-bit product, truncating division, caps 9,999 / 999 or 99,999 / 9,999 with the Break limits); the doc comment "tiers never stack" is gone | gear vectors (every record alone, then stacked); mutants C1, C3, C4, C9, C10, C13, C17, C18 |
| **C2** crit 3 per piece | section 1 (22), section 8 item 2 (611), section 5.4 | `equipmentCrit` is the sum of the pieces' crit bytes; `EquipmentDef.bonusCrit` now defaults to the game's 3 for the piece it sits on (CONTRACT-CHANGES). The authored weapons still say 3; the armours inherit it. All 56 members of the shipped builds: engine 3, game 6, now 6 | gear vectors; `parity-ffx-engine-gear.test.ts` walks every chapter's party; mutants C2, C16 |
| **C3** Curse Ward | section 5.1 note (345), section 8 item 4 (613) | the Curse extra-immunity bit, like Curseproof (255 in the engine's map, the number the status step reads for an extra bit) | mutants C12, C15 |
| **C4** resistance sums | section 4.2 step 3 (149), section 8 item 5 (614) | `applyEquipmentToCombatant` adds each worn ability's byte per status and clamps to 255 (two Death Wards 100, a Ward with a Proof 255) and sets the extra-immunity bits to 255; an Auto-Haste no longer gives Slow resistance of its own (the game's record has none; the infliction step refuses a Slow while a Haste counter is 255) | gear vectors; 50 random gear sets through the real setup; mutants C5, C6, C14, C19 |
| C5 Aeon Ribbon Threaten | section 8 item 6 (615) | **no change**: the same outcome through the status lane's rule (the note says so); the optional tidy is left | none needed |
| C6 weapon formula and power | section 8 item 7 (616) | **no change**: latent, no authored build wields a row with another formula or power, and which rows above 34 are gear in play is an open question (G03 open question 11); the plan says do last or not at all | none |
| C7 Fahrenheit HP | section 8 item 11 (620); plan Q5 | **not changed, listed for Bailey (section 6)** | the source note is read in section 6 |
| C8 stock rows | section 8 item 12 (621) | **no change** (not wrong by itself) | none |
| **E1** SOS statuses | FFX-G02 section 3.3 (99-104), section 4.1, section 6 E3 (300) | SOS Shell, Protect, Haste, Regen, Reflect and the four Nuls go on while the wearer's weak level is 1 or 2 (HP under half) and off when it is not; switched by the sweep at the end of every action and every reaction, after a Regen payout and after a Poison tick. `equipment.ts#SOS_STATUS_ABILITIES` (no importer) is gone | auto-status vectors; 110 real-code traces; the Macalania turn loop; mutants E1, E4, E5, E7, E9, E12, E13, E20 |
| **E2** timing | G02 section 6 E5 (302) | the level byte (`critical`) still refreshes after every HP change, as the game refreshes it after every hit; the statuses it switches wait for the sweep, so SOS Shell does not appear between two hits of one action | the two-hit engine test; mutant E12 |
| **E3** Auto-* and revive | G02 section 3.4 (106-113), 3.5 (118), 3.6 (125), section 6 E6 (303) | the kernel applies the Auto-* statuses at battle start (a status the previous link carried in that the gear alone granted is dropped first); a KO takes them, and the revive (Phoenix Down, Life, Auto-Life, the fayth's Auto-Life) and a Petrify that ends restore and apply them again; a Haste that appears ends a Slow in progress; a Regen that appears restarts the Regen clock, and so does every restore-then-apply | traces; engine tests for each path; mutants E2, E3, E6, E8, E10, E11, E14 to E19 |

### What the kernels are

- **`kernel/gear.ts`** (FFX-G03 sections 3.1, 4.1, 4.2): every ability slot of both pieces is read (a word of 0 or 0xff is empty; others name their record by the low 12 bits, an index past the table reads record 0); percents are added to the 14 builder entries by mask; an entry with a non-zero sum is raised by `trunc(entry * sum / 100)` in 32-bit signed arithmetic; crit is the sum of the pieces' crit bytes as a byte; elements are OR-ed; inflict chances and durations are added and clamped to 254; resistance bytes added and clamped to 255; extra words, the three auto words (normal or SOS trio, with the SOS flag) and words A, B, C OR-ed. **`kernel/gear-table.ts`** is the game's `a_ability.bin` as numbers (134 records), `adapt/gear-ids.ts` maps our 125 ids onto it (exhaustive: an id added without a record is a compile error).
- **`kernel/auto-status.ts`** (FFX-G02 sections 3.3, 3.4): apply, restore, the toggle, the sweep and the weak level of an HP pair (`trunc(4 * HP / max)`: 3 below 1 HP, then 2, 1, 0).

## 3. Proofs and mutants

| Test file | What it proves |
|---|---|
| `parity-ffx-gear.test.ts` | hand-worked numbers with their arithmetic (including the two single-vector probes of the note: save HP 21,474,837 with a percent sum of 100 gives 2, not 1); **708 emulator vectors** `gear_loop.json`: the real 0x7860f0 and 0x79c5f0 run with each of the 134 records alone on the weapon and on the armour, then stacked, percent-heavy, resistance-heavy, junk and auto-status sets; every field the engine reads (maxima, damage bytes, crit, elements, chances, durations, resistances, extra words, trios, flag, words A/B/C) |
| `ffx-gear-table.test.ts` | each id's record does what its name says, written by hand (Ward 50, Proof 255, tier N, counter bits, word bits...); the engine's older readers (`adapt/words.ts`, the weapon strikes) agree with the table |
| `parity-ffx-auto-status.test.ts` | **746 emulator vectors** `auto_status.json`: apply, restore, toggle, the sweep over 31 characters, the weak-level grid; the note's hand-worked scenarios J1 and J2 (a restore then an apply restarts the Regen clock and ends a Slow) |
| `parity-ffx-engine-gear.test.ts` | the engine's real setup, damage path and prep views against an oracle written from the ability names: 400 situations through `resolveAbility` with Strength / Magic / Defense / Magic Def spread over up to three slots (the engine's first hit equals the damage kernel's with the oracle's bytes); crit 6 for every member every chapter fields; 50 random gear sets through `buildBattle` for the resistance bytes and Curse immunity; 400 random pools through `effectivePool`; the shared decode follows every change |
| `parity-ffx-engine-auto-status.test.ts` | **110 traces recorded from the real game functions** (`auto_traces.json`: HP and the weak-level refresh, sweeps, KOs, revives through the Death-bit handler, casts, lapses) replayed on the engine, 1,000+ steps, counters and Regen clock and HP equal after each; the SOS set appears at the sweep, not between hits; `critical` stays the level read at once; the events; a forked context; Auto-Life and the fayth's; the Regen payout toggle; the real setup; **Macalania through the engine's turn loop: at every decision Rikku's SOS Shell is on exactly while she is under half HP** (24 seeds); a Petrify Grenade then a Soft puts the equipment status back |
| `ui-ffx-party-prep.test.ts` (one test) | the Stats tab prints Magic Def +10 with +5 as "-15% taken", Strength +10 with +5 as "+15% dmg", two HP +10 as 1000 to 1200 (+20%) |

**Larger sets, run outside the repo** (same layout, same tests, `PYREFLY_GEAR_BIG` and `PYREFLY_AUTO_BIG`): 6,000 gear vectors; 4,000 each of apply, restore and toggle, 333 sweeps and a 1,500-point weak-level grid; **0 mismatches**. The proof of the table itself is the note's: 41,498 vectors, 0 mismatches.

**Mutants** (a mutant is one exact-string edit of the source; the named test files must fail; each file restored byte for byte, sha1 checked; runner `D:\Tools\ffx-parity\rc4-gear\mutate.cjs`, results `mutants-c-result.json`, `mutants-c2-result.json`, `mutants-e-result.json`): **39 of 39 caught** (C1 to C19, E1 to E20). One was first an equivalent mutant (C14: `max` for `+` in `applyEquipmentToCombatant` gives the same answer when the byte starts at 0, which a party member's does); a test that starts a combatant with a byte already set was added and catches it.

**Emulator vectors and traces, how they were made:** `D:\Tools\ffx-parity\rc4-gear\gen_gear.py`, `gen_auto.py` and `gen_scenarios.py` (the G03 and G02 environments, the real code, `D:\Tools\ffx-parity\venv\Scripts\python.exe -I`). The repo holds numbers only (inputs and outputs of the functions; no exe bytes, no game text).

## 4. The goldens, explained (own commit, `75de9029`)

`ffx-engine-golden`: **eleven of the 18 digests move, seven are byte for byte what they were** (seymour-flux#1 and #7, evrae-airship#1 and #7, seymour-natus#7, isaaru-via-purifico#1 and #7). Each row put back alone on the tree and all 18 run: **crit** moves yunalesca#1, braskas-final-aeon#1 and #7 (all seven links), seymour-anima-macalania#1 and #7, seymour-natus#1, seymour-omnis#1 and #7; **summed percents** move yunalesca#1 and #7, braskas-final-aeon#1 and #7, yojimbo-cavern#1 and #7, seymour-omnis#1 and #7; the SOS and Auto-* statuses move none (on those two Macalania seeds Rikku never goes under half). With all three rows put back the file is **18/18 on the old values**, so these three rows are all of it. First diverging event of each moved link (in the comment beside the table): macalania#7 event 95, Rikku's hit on Seymour 138 before, 277 now (a critical); natus#1 event 350, Auron's 3,736 and 7,472; macalania#1 event 410, Rikku's 181 and 363; yojimbo#1 event 118, Yuna's Cure on herself 1,411 before and 1,332 now (Magic Def +10 with +5 takes 15 percent off); yunalesca#7 event 398, 1,215 and 1,148. **One outcome moves: seymour-anima-macalania#7 defeat to victory** (its first difference is the critical above); the other 17 keep theirs. One seed is one sample. `ffx2-atb-golden` and `ff7-golden` unchanged.

## 5. Measurement (every FFX chapter, shipped line; before = `origin/re-parity-rc4-base` `f39cd57b`, after = `8aa468d9`)

`tests/unit/ffx-parity-measure.test.ts`, `PYREFLY_MEASURE=1`, seeds 1 to 500 in one run (the 12-seed table is seeds 1 to 12 of the same run). Raw: `D:\Tools\ffx-parity\rc4-gear\before-500.json` and `after-500.json`; the comparison script is `compare.cjs`. (The run took 591 s before and 746 s after, under shared load and before the decode was memoised.)

### 12 seeds

| Chapter | Wins | Losses | Link 1 wins | Party turns | Engine turns | Party KOs | Seeds that flipped (W->L / L->W) |
|---|---|---|---|---|---|---|---|
| seymour-flux | 12 -> 12 | 0 -> 0 | 12 -> 12 | 48.3 -> 48.3 | 68.3 -> 68.2 | 1.3 -> 1.3 | 0 / 0 |
| yunalesca | 10 -> 11 | 2 -> 1 | 10 -> 11 | 165.7 -> 158.9 | 230.9 -> 221.4 | 14.1 -> 13.3 | 0 / 1 |
| braskas-final-aeon | 11 -> 11 | 1 -> 1 | 11 -> 11 | 233 -> 224.6 | 378.4 -> 365.8 | 6 -> 6.3 | 0 / 0 |
| seymour-anima-macalania | 11 -> 12 | 1 -> 0 | 11 -> 12 | 54 -> 53.9 | 87.2 -> 86.8 | 5 -> 4.6 | 0 / 1 |
| evrae-airship | 12 -> 12 | 0 -> 0 | 12 -> 12 | 71.3 -> 69.5 | 89.1 -> 86.9 | 0.6 -> 0.6 | 0 / 0 |
| yojimbo-cavern | 11 -> 11 | 1 -> 1 | 11 -> 11 | 65.3 -> 65.3 | 92.5 -> 92.5 | 3.6 -> 3.6 | 0 / 0 |
| seymour-natus | 11 -> 11 | 1 -> 1 | 11 -> 11 | 35.4 -> 35 | 52.1 -> 51.5 | 2.4 -> 2.4 | 0 / 0 |
| seymour-omnis | 9 -> 11 | 3 -> 1 | 9 -> 11 | 102.1 -> 91.5 | 138.8 -> 124.3 | 1.9 -> 0.8 | 0 / 2 |
| isaaru-via-purifico | 11 -> 11 | 1 -> 1 | 12 -> 12 | 37.6 -> 37.6 | 83.3 -> 83.3 | 3 -> 3 | 0 / 0 |
| sin-fins-core | 11 -> 11 | 1 -> 1 | 12 -> 12 | 355.5 -> 309.9 | 450.8 -> 395.6 | 4.1 -> 1.7 | 1 / 1 |
| sin-face | 12 -> 12 | 0 -> 0 | 12 -> 12 | 47.3 -> 45.5 | 52.4 -> 50.5 | 0 -> 0 | 0 / 0 |

### 500 seeds

| Chapter | Wins | Losses | Link 1 wins | Party turns | Engine turns | Party KOs | Seeds that flipped (W->L / L->W) |
|---|---|---|---|---|---|---|---|
| seymour-flux | 499 -> 500 | 1 -> 0 | 499 -> 500 | 48.9 -> 48.6 | 67.5 -> 67 | 1 -> 1 | 0 / 1 |
| yunalesca | 474 -> 476 | 26 -> 24 | 474 -> 476 | 154.9 -> 152 | 216.9 -> 212.7 | 12.9 -> 12.6 | 19 / 21 |
| braskas-final-aeon | 481 -> 483 | 19 -> 17 | 481 -> 483 | 241 -> 229.1 | 387.7 -> 368.6 | 5.5 -> 5.4 | 3 / 5 |
| seymour-anima-macalania | 467 -> 470 | 33 -> 30 | 467 -> 470 | 54.9 -> 54.7 | 87.1 -> 86.6 | 4.8 -> 4.7 | 2 / 5 |
| evrae-airship | 488 -> 488 | 12 -> 12 | 488 -> 488 | 72.6 -> 71.1 | 91.7 -> 89.8 | 0.7 -> 0.7 | 0 / 0 |
| yojimbo-cavern | 493 -> 493 | 7 -> 7 | 493 -> 493 | 67.4 -> 67.4 | 95.9 -> 95.9 | 3.9 -> 3.9 | 0 / 0 |
| seymour-natus | 483 -> 483 | 17 -> 17 | 483 -> 483 | 34 -> 33.5 | 49 -> 48.3 | 1.7 -> 1.7 | 1 / 1 |
| seymour-omnis | 436 -> 462 | 64 -> 38 | 436 -> 462 | 103 -> 95.3 | 139.7 -> 129.1 | 1.3 -> 0.8 | 25 / 51 |
| isaaru-via-purifico | 452 -> 452 | 48 -> 48 | 500 -> 500 | 38.2 -> 38.2 | 84.4 -> 84.4 | 2.9 -> 2.9 | 0 / 0 |
| sin-fins-core | 442 -> 442 | 58 -> 58 | 499 -> 499 | 328.1 -> 296.1 | 419.4 -> 382.4 | 3 -> 3 | 36 / 36 |
| sin-face | 500 -> 500 | 0 -> 0 | 500 -> 500 | 47.2 -> 45.3 | 52.5 -> 50.3 | 0 -> 0 | 0 / 0 |

**Movers and causes** (a mover: wins outside two standard errors of the difference of two proportions at 500 seeds, or 2 of 12). Ablation: each row put back alone on the tree, the chapter run on the same 500 seeds; with both rows put back every number below equals the before table to the digit (`D:\Tools\ffx-parity\rc4-gear\measure-ablation-logs\`).

| Chapter | before | crit only | percents only | both (after) | Reading |
|---|---|---|---|---|---|
| **X Seymour Omnis** (the only mover on wins) | 436 wins, 103.0 turns, 1.3 KOs | 448 | 450 | **462**, 95.3 turns, 0.8 KOs | **+26 wins (87.2 to 92.4 percent), outside the band (2 se = 19.1).** Each row adds about half; the two add. The Omnis party wears two tiers of Strength and Magic: Magic +15 instead of +10 and Strength +15, plus 3 more crit points on every Attack |
| XVII Sin: Fins and Core | 442 wins, 328.1 turns | 442, 319.0 turns | 442, 306.0 turns | 442, **296.1 turns (-10 percent)** | wins unchanged, 36 seeds flip each way; the line kills faster: summed percents -22 turns, crit -9 |
| XVIII Sin's face | 500, 47.2 turns | 500, 46.9 | 500, 45.6 | 500, 45.3 | faster, same wins |
| III Braska's Final Aeon | 481 wins, 241.0 turns | 480, 236.5 | 483, 232.7 | 483, 229.1 turns (-4.9 percent) | within the band; percents -8 turns, crit -4.5 |
| II Yunalesca | 474 wins | 479 | 470 | 476 | +2, within the band; the rows pull opposite ways on wins (crit +5, percents -4: the Magic Def sum takes more off her heals) and agree on turns |
| VII Seymour and Anima | 467 wins | crit only 468 | SOS only 469 | 470 | +3, within the band; SOS Shell alone +2, crit +1: the first time Rikku's Shell Targe does anything. (Percents cannot matter here: no member wears two tiers.) |

Every other chapter is inside the band: I Flux 499 to 500; VIII Evrae 488 to 488 (72.6 to 71.1 turns, crit only: no build there wears two tiers of a family); IX Yojimbo 493 to 493 (identical turns and KOs); X Natus 483 to 483 (34.0 to 33.5 turns); XIV Isaaru 452 to 452 (identical in every column: its build wears no two tiers of a family and nothing in the fight reads a party weapon's crit). The builds that wear two tiers of one family are the Gagazet, Zanarkand and Yojimbo builds (Yuna's Magic Def +10 and +5), and the Dream's End (III), Garden of Pain (X) and Sin (XVII, XVIII) builds (Strength and Magic +10 and +5 on six members); Macalania, Highbridge, Via Purifico and the Fahrenheit build wear none. Nothing on a boss or a party member was tuned.

## 6. Decisions for Bailey, and what I did not do

1. **Q5: Fahrenheit's Lulu 700, Auron 2,000 and Kimahri 1,250 (C7).** The authored source note is `research/ffx-evrae-airship.md` section 9.3, "Authored preset at Evrae, [estimate]": a table of HP, MP, STR and so on per member under a "Sphere Lv" column. **It does not say whether the HP column is before or after gear**, and section 9.5 names no HP +10 armour (the "Glorious" armours with `hp-10` are the builder's choice, from "slot-rich"). The same table gives Tidus 1,150 and Wakka 1,300 and the build raises those two by 10 percent (1,265 and 1,430); it leaves Lulu, Auron and Kimahri as the table says though they wear `hp-10` too. The rule I was given (apply the gear HP +10 only if that note says the maxima are Sphere Grid HP before gear) is not met, so **I left the numbers and list it**: (a) treat the three as Sphere Grid HP and give 770, 2,200 and 1,375, consistent with Tidus and Wakka; (b) keep them as effective values. **Measured for you:** with (a) applied, Chapter VIII (Evrae) wins 488 of 500 either way (it was 488), mean party turns 70.9 (71.1), KOs 0.7 (0.7): no measurable difference in the win rate.
2. **Chapter X (Seymour Omnis) is easier by 5 points** (436 to 462 of 500) because the party's critical and percent bonuses are now the game's. It is parity, not tuning; I disclose it because it is the one chapter whose win rate leaves the band.
3. Nothing else needs your word. No new screen, no new content, nothing deployed.

## 7. Open items

- **C5, C6, C8 not changed** (section 2). C6 waits on G03 open question 11 (which `weapon.bin` rows above 34 are gear in play).
- **Timing of the SOS sweep.** The game runs it at the end of every action; whether a real action reaches it between two hits by a queue-failure route was not measured (FFX-G02 open question 13), so the engine switches the SOS set only at the end of an action.
- **A KO'd member who wears an SOS ability gets her Auto-* statuses back on the corpse at the next sweep**, as the game's sweep does (it does not skip the dead); nothing shows it, and the revive restores them anyway.
- **Not touched:** FFX-D (KO order, Zombie and Scan at a KO, Auto-Life timing: the equipment statuses are lost at the engine's KO, which is the first lethal hit, not after the target's last hit), FFX-F (Auto-Potion and the rest), `autoWordA/B` in `adapt/words.ts` (still the narrow readers; cross-checked against the table by `ffx-gear-table.test.ts`), aeons (their fixed gear is `aeon-gear.ts`; no aeon wears an Auto-* ability), in-battle gear swapping (the engine has none).
- **Mirrors.** `ffx/estimate.ts` and `engine/tactics/advisor-roll.ts` read the same engine fields (the resistance bytes, `equipmentCrit`, the percent bytes through `simulate.ts` and `adapt/status.ts`), so they follow with no edit; none is stale. `node tools/orphans.mjs` lists none of the new modules (`kernel/drops.ts` and `kernel/gear-drop.ts` were already orphans).
- A screenshot of the Stats tab after the change: `docs/screenshots/rc4-gear-prep-stats-yuna.png` (Yuna at Chapter I: Magic Def 39, "-15% taken"; the art is missing because worktrees lack `public/art`). The dev server I started on 5190 is stopped.

## 8. Re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/parity-ffx-gear.test.ts tests/unit/ffx-gear-table.test.ts tests/unit/parity-ffx-auto-status.test.ts tests/unit/parity-ffx-engine-gear.test.ts tests/unit/parity-ffx-engine-auto-status.test.ts tests/unit/ffx-engine-golden.test.ts
# the larger proof sets (same command with the two variables)
PYREFLY_GEAR_BIG=D:/Tools/ffx-parity/rc4-gear/big/gear_big.json PYREFLY_AUTO_BIG=D:/Tools/ffx-parity/rc4-gear/big/auto_big.json (same vitest) tests/unit/parity-ffx-gear.test.ts tests/unit/parity-ffx-auto-status.test.ts
# regenerate the vectors (the real code in the emulator)
D:/Tools/ffx-parity/venv/Scripts/python.exe -I D:/Tools/ffx-parity/rc4-gear/gen_gear.py 20261011 440 gear_loop.json
D:/Tools/ffx-parity/venv/Scripts/python.exe -I D:/Tools/ffx-parity/rc4-gear/gen_auto.py 20261012 170 auto_status.json 220
D:/Tools/ffx-parity/venv/Scripts/python.exe -I D:/Tools/ffx-parity/rc4-gear/gen_scenarios.py 20261014 110 auto_traces.json
# the 500-seed measurement, all FFX chapters
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=after-500.json (same vitest) tests/unit/ffx-parity-measure.test.ts
```

## 9. The player's changelog paragraph (FFX)

**Gear works the way the game's does.** Bonuses of one kind on a piece now add up: Magic Def +10% and +5% on Yuna's Blessed Ring is 15%, two HP +10% are HP +20%. Every weapon and every armour adds 3 to your critical chance, so a character wearing both has 6 and criticals land a little more often. Curse Ward now stops Curse completely, like Curseproof, and two Wards against the same status add together. Rikku's Shell Targe finally does what it says: while she is under half HP she gets Shell, and loses it again when she is healed; the Auto-Shell, Auto-Haste and other auto-statuses a character wears come back after a revive or when Petrify wears off. In Braska's Final Aeon, the Garden of Pain (Seymour Omnis) and the two Sin fights the party hits a little harder and a little more often.
