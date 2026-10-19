# Re-parity RC10, lane FFX boss data (gap-scan rows S5 and S6): the boss rows' remaining differences from the game's monster records, built as six switches, all off, and measured; **turned ON by Bailey on 2026-10-17 (section 11)**

Status: **built, tested, measured and pushed on branch `re-parity-rc10-ffx-boss-data`; every switch was OFF in that state; not merged, not deployed** (2026-10-17). **Update, 2026-10-17 evening: Bailey chose "All six (Recommended)" and all six switches are now ON, on branch `re-parity-rc10-ffx-boss-data-on`: read section 11 first** (sections 0 to 10 below describe the lane as built and measured, with the switches off). Cut from `origin/r52-rc` (`3c92b60cc`). **Game case: FFX only** (AGENTS.md rule 14): the monster records and the character initialiser that clamps them (FFX.exe 0x0079b4f0) exist only in FFX; `src/battle/ffx2`, `src/data/ffx2`, `src/battle/ff7`, `src/audio` are untouched; `ffx2-atb-golden` (6) and `ff7-golden` (3) pass unchanged.
**Independent check (2026-10-17): PASSED**, with text corrections that are made here and in the preflight: D10 has a second visible change (Scan on a Pagoda stops working, 5.7), Sensor on Yu Yevon replaces the plate "Immune to sensors." (D-221) rather than "- - -", C-3 is a research conflict and not a decision of Bailey's (section 2, D8), D1 is a small deterministic effect and not noise (5.2), and the other visible effects are listed in one place (5.10). No number, table or test changed.
Owner: Bailey. His words, as the brief quoted them: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-17 "keep going full speed". House rule (memory `boss-side-fix-needs-measured-options`): **never tune boss numbers**: build each sourced answer behind its own switch, measure it, ask him once. **This lane turned nothing on and decides nothing.** (Bailey then decided, on 2026-10-17: all six, section 11.)
Sources: the private note `D:\Tools\ffx-parity\coverage\ffx\FFX-H02.md` section 7 (rows D1 to D10) and the sections it cites; gap scan `coverage\gap-scan-2026-10-17.md` section 3, rows S5 and S6. Paper preflight: [`docs/plans/re-parity-rc10-ffx-boss-data-review.md`](../plans/re-parity-rc10-ffx-boss-data-review.md) (DEEP by `critic-plan`; written after the inert module landed, which the page discloses).

## 0. In one paragraph

Of the rows the note lists, **six are real differences and are now switches** (D1 stat floors, D3 Zanmato level, D7 Flux's Slow, D8 Evrae's Doom, D9 the Life flag, D10 the record's remaining immunity bits and flags). **D5 (steal chance byte 255) is already the game's** since re-parity W5, so it is dropped, together with the Regen byte, the Pagoda HP and a few others (section 2). Each switch changes one table of numbers on the battle's own copy of the enemy group (`applyBossDataCorrections`, called once in `buildBattle`); with every switch off it returns before reading anything, and **180 of 180 twelve-seed event logs of every FFX chapter equal `origin/r52-rc`'s byte for byte**. Measured at 500 seeds on every chapter a switch touches: **only D1 changes any fight**, and only through the Defence and Magic Defence floors (three chapters move first-try wins by +3, -3 and -5 of 500; a small deterministic effect, not random noise: each blow on a boss with Defence 0 lands about 0.7 percent weaker, so over 2,000 paired seeds Chapter XIV loses 16 fights and wins none back and Chapter VII loses 6 and wins 20, while the unpaired z stays at or below 1.05; 6,000 fights together 5,700 -> 5,695); **D3, D7, D8, D9 and D10 change not one event of any fight** (2,500 + 500 + 1,000 + 3,000 + 3,500 chapter-seeds, all byte-identical) because the chapter line never casts the commands they matter for; direct casts show the difference (section 5.9), and a player who casts those commands sees it (the list in 5.10). All six on together equal D1 alone on all 6,000 fights. **Recommendation: match the game on all six.** D8 (Evrae's Doom) is the one where the data departs from the research note's own ruling: `research/ffx-evrae-airship.md` row C-3 says "trust the decompile", yet the data followed the wiki for Doom immunity. C-3 is a research conflict that the researcher and the driver resolved; it was never a decision of Bailey's. D8 is inert either way. D10 has two visible changes (Scan on a Yu Pagoda stops working; Sensor on Yu Yevon reveals him), see 5.7 and 6.

## 1. Commits (oldest first, on `re-parity-rc10-ffx-boss-data`)

| Commit | What | Case |
|---|---|---|
| `ec9d5fe87` | The module `src/battle/ffx/boss-data-corrections.ts`, its one call in `setup.ts#buildBattle`, the record fixture | FFX only |
| `fee603e60` | The paper preflight and the first 19 tests | FFX only; docs, tests |
| `0b3505eea` | Tests: real casts at the rows, the words the steps read, the all-off test made independent of hook order (a mutation found it), fixture trimmed to 32 records | FFX only; tests |
| `35c020011` | The handoff note | FFX only; docs |
| `10bb51852` | The test file split in two under the 400-line rule (data side, engine side, shared helper); the 1,500 extra seeds of section 5.2 in this note | FFX only; tests, docs |
| (the commit after it) | The independent check's text corrections to this note and the preflight (no code, no test, no number) | FFX only; docs |

## 2. The candidates: confirmed, built, or dropped, with the evidence

How each was checked: the note's row quoted with its proof label; the value **re-read from the game's own monster files** with our VBF reader (`D:\Tools\rea\tools\vbf.mjs`, read only; the lane's `read-records.mjs`): **361 records, 6,498 fields compared with the note's decode, 0 differences**; the engine field found at file:line on `r52-rc`; the shipped chapters that use the row (`src/data/encounters.ts`, walked link by link, the four hidden FFX chapters included). Labels are the note's: [E] emulated on the game's own code, [P] parsed from the files, [R] read only, [I] inferred.

| Row | The note says | Record (re-read) | Engine (file:line) | Shipped in | Verdict |
|---|---|---|---|---|---|
| **D1** stat floors | the monster branch raises STR, DEF, MAG, MDEF, AGI, LCK and ACC to at least 1 (EVA may be 0); "the engine copies the raw bytes" (3.2 step 5, [E] 41,743 vectors, 0 mismatches; 7 D1) | 63 cells in 29 of our rows have record byte 0 and engine 0 (MDEF 19, DEF 18, ACC 15, AGI 7, MAG 3, LCK 1; the record ids are in `D1_FLOORS`) | `setup.ts` `enemyToCombatant` `stats: { ...e.stats ... }` (line 198); `adapt/hit.ts:134` and `kernel/hit.ts:133` read the enemy's ACC; the damage steps read DEF and MDEF | I to XVIII except mirror-aeons, sinspawn-gui, biran-yenke (their rows are already floored by their own lanes) | **built: switch D1** |
| **D3** Zanmato level | "the byte is 3 (m119); every other mapped enemy uses the byte plus 1" (7 D3, [P]; the rule that reads the byte is open, 9.1, [I]) | m119 byte 3 -> level 4. **Found by this lane, the same rule:** m127 byte 3, m249 byte 4, m248 byte 4 where our rows carry no level | `evrae.ts:196` `zanmatoLevel: 3`; the only consumer is `adapt/yojimbo.ts:110` (the player's Yojimbo) | VIII and hidden exp-fayth (Evrae), X (Mortibody), IX (Ginnem), XIV (Isaaru) | **built: switch D3** |
| **D5** steal chance | "byte 255 in every stealable boss ... the engine uses 100, 50, 25" (7 D5, [E] 21,780 runs) | byte 255 and both quantities equal on all 22 stealable mapped rows | **already the game's**: `adapt/steal.ts` `stealByteOf` turns the table's 100 percent into 255 and `stealChanceAfter` halves a byte: 255, 127, 63, 31, 15, 7, 3, 1, 1 (re-parity W5) | n/a | **dropped: nothing differs** (a test pins it) |
| **D7** Flux Slow | "the Slow byte of m142 is 255 ... the 'copy/paste artefact' reading is wrong for Slow" (7 D7, [P]) | m142 Slow 255, Haste 0 | `seymour-flux.ts` header (lines 28 to 48) ships Slow landable; no `slow` in `immunities` | I | **built: switch D7** |
| **D8** Evrae Doom | "the record's Doom bit is not set ... the engine follows the wiki" (7 D8, [P]; filed as C-3) | m119 extra-immunity bit 14 clear; Doom start 30 (= our `doomTurns`) | `evrae.ts:153` `doom: 255` | VIII, exp-fayth | **built: switch D8**. C-3 is row C-3 of `research/ffx-evrae-airship.md` (about line 774), a research conflict (decompile against wiki) that the researcher and the driver resolved; it is not a decision of Bailey's. That row says "trust the decompile", yet the data followed the wiki for Doom immunity |
| **D9** Life flag | "f28 bit 2 is set for all of them (99 records in all)" (7 D9, [P]) | set on m119, m124, m136, m137, m138, m139, m140, m173, m174 | the nine rows lack `immune-to-life`; read at `hp.ts:332` and `adapt/words.ts:124` | VII, VIII, XVII, XVIII, III, hidden | **built: switch D9** |
| **D10** record bits | Pagodas: Shell, Protect, Reflect, four Nuls, Scan, Life, Bribe, Scan flag; Braska's Final Aeon: Auto-Life; Yu Yevon: Scan, Auto-Life; Cid, Isaaru, Mira (our `ginnem`), Daigoro: Scan, Auto-Life, Eject; Mortiphasm: Percentage, Delay (7 D9, D10 and the paragraph under 7, [P]) | confirmed byte by byte (the closure test). **Also found:** both Pagodas and the Mortiphasm hold Curse immunity (255) where the record's bit 10 is clear (FFX-G04 names bit 10 Curse); Yu Yevon holds `immune-to-sensor` where f28 bit 3 is clear; Mortiphasm EVA is 1 where the record has 0. **Two visible changes** (5.7): the Pagoda record has f28 bit 4 and extra bit 0 set, so Scan stops working on a Pagoda; and Yu Yevon loses the sensor flag, so Sensor reveals him | rows named in `D10_ROWS`; read through `adapt/status.ts` (`resistBytesWith`, `extraImmuneWord`), `adapt/words.ts`, `sensor.ts`, `adapt/hit.ts:221` | III, XII, VIII, IX, XIV, XVII, hidden | **built: switch D10** |

**Dropped, with the reason** (asserted in `parity-ffx-boss-data.test.ts` where it can be):

- **D5** (above): already the game's.
- **Regen 255 on Braska's Final Aeon and the Yu Pagodas** (D10 list): their `immune-to-regen` flag makes the Regen resistance byte 255 (`adapt/status.ts#resistBytesWith`, asserted for all three).
- **Yu Pagoda HP 65,535** (D10): the game's init script writes 5,000 (`research/re-ffx-ai-yunalesca-bfa.md` 4.1, the AI lane's read), so our 5,000 is the fight's number. The overkill threshold the Pagoda row carries (99,999 where the record has 5,000) is the engine's deliberate "never an overkill" and is not in the note's list.
- **Sinspawn Gui's second fight "steal with no record"** (in the note's working file): the note mapped it to m118; the rematch is the same record **m117**, whose steal byte is 255. No difference. The rematch's STR 15 and MDEF 1 are the rematch's init script (RE 2.3).
- **Dark Daigoro, the possessed aeons, the Dark Aeons**: stand-in or script-copied rows (stats copied from the player's aeon or written by the script). The Dark Aeons' rows are the records' own (`mirror-aeons-data.test.ts` pins them).
- **D2** (enemy Overdrive reference damage: no reader), **D4** (two drops, closed by the kill-rewards lane in r51), **D6** (Bribe items of Bribe-immune bosses: unreachable), **D11 to D16** (match; D13 and D15 are the language-11 branches and the kill-rewards rules).
- **Mortiphasm LCK**: the Chr value is 1 (the D1 floor), which the row already has.

## 3. What was built

`src/battle/ffx/boss-data-corrections.ts` (186 lines; it lives under `src/battle/` because that tree imports nothing from `src/data/`): `BOSS_DATA_SWITCHES` (all false), `setBossDataSwitches(on)` (returns the function that restores them), one exported table per switch keyed by our enemy ids with the record id in a comment, and `applyBossDataCorrections(group)`, called once in `setup.ts#buildBattle` on the battle's own deep copy (`cloneData`), so the module rows in `src/data/ffx/enemies/**` are never edited. With no switch on it returns before it reads the group. Numbers and our ids only: no game text, no game code. No contract file is touched. To turn a switch on the owner's word is needed; then its constant becomes `true` in that one object, `ffx-engine-golden` is re-pinned with the cause in its header (section 7, item 5), and the guide/strategy cards are read for text the switch makes untrue (none found for D7).

## 4. The proof

- **Switches off = the base.** The 12-seed whole-chain event logs of all fifteen FFX chapters (listed and hidden; seeds 1 to 12; SHA-1 of every link's whole log): **180 of 180 byte-identical** to `origin/r52-rc`. `ffx-engine-golden` (18), `ffx2-atb-golden` (6), `ff7-golden` (3): 27 of 27 pass unchanged.
- **Each table is the record.** `tests/fixtures/ffx-boss-records.json` holds the bytes of 32 records (numbers only). `tests/unit/parity-ffx-boss-data.test.ts` (13 tests, the data side) and `parity-ffx-boss-data-engine.test.ts` (10 tests, the engine side), sharing `tests/unit/helpers/ffxBossData.ts`: every listed byte is in the record and nothing the record disagrees with is added (per switch); a **closure test**: with all six on, every mapped row equals its record on the floored stats, the 24 status bytes (Regen through its flag), the five extra bits, the seven flags and the Zanmato level, except two script-written residues listed with their reasons (Cid's AGI 11; the Gui rematch's STR and MDEF); the switches-off test hands `applyBossDataCorrections` a group whose `enemies` getter throws; the module rows are never edited; the words the game's steps read (resistance bytes, extra word, special word, Zanmato byte) move with the switch and only with it; and real casts through the engine's own status path (5.9).
- **Mutation pass: 18 faults over `boss-data-corrections.ts` and its one call in `setup.ts`, all caught.** The 17 of the first pass caught 16: `default-on` (D1 shipped true) survived because the ability-fixture file the test imports runs its own tests first and its `afterEach` reset the switches before the all-off test read them. Fixed (the test now reads the shipped values when the file loads); that fault and a second default-on fault (D10) are caught. The faults: D1 value 2, D1 dead, parts skipped, D3 Evrae and Ginnem levels, D7 byte 254, D8 immunity kept, D9 wrong flag and a row dropped, D10 Curse kept, sensor flag kept, a Nul missing, EVA 1, the off guard removed, defaults on (two), no restore, the call in `buildBattle` removed.
- `npx tsc --noEmit` clean; `node tools/orphans.mjs` lists neither module nor fixture; every source file under 400 lines (`setup.ts` 395, `boss-data-corrections.ts` 186).

## 5. Measurements

Method (the RC9 counters lane's, `D:\Tools\ffx-parity\rc9\ffx-counters\`): the shipped line (`intendedStrategy`) plays each chapter through all its links, one try per seed; per seed the outcome, party turns, engine turns, party KOs and the SHA-1 of every link's whole event log are kept; the base is `git archive origin/r52-rc` in a scratch folder, each switch a scratch copy of this branch with `ZZ_SWITCHES=<id>`. The 12-seed runs of all fifteen chapters said first which chapters move (D1 only: macalania, evrae-airship and exp-fayth, yojimbo-cavern, seymour-natus, isaaru, braskas-final-aeon); then **seeds 1 to 500 of every chapter the switch's table touches**. "First-try wins" is the seed's one try at the whole chain. Two workers, no full suite. The hidden Chapter 28 (the Last Summoning) cannot be benched (its chain asks the player for the order of the aeons); its Pagoda and Yu Yevon rows are Chapter III's, which are measured, and a test shows the corrections reach its groups.

### 5.1 Switches off against the base

12 seeds of all fifteen chapters: **180 of 180** event logs identical in every link; the same wins, party turns, KOs (the base's numbers equal the hit-order lane's tip numbers, as they should).

### 5.2 D1, stat floors: the only switch that changes a fight

What the game does: every monster's STR, DEF, MAG, MDEF, AGI, LCK and ACC is at least 1 in battle. What we do: 63 cells of 29 rows read 0. 500 seeds of the twelve chapters whose rows carry a 0 (Gui, Biran and Yenke and the Mirror Aeons are already floored):

| Chapter | Seeds | First-try wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Wins lost / won back | Identical event logs |
|---|---:|---|---|---|---|---|---|
| seymour-flux | 500 | 500 (100.0%) | 52 | 70.8 | 0.9 | 0 / 0 | 500 of 500 |
| yunalesca | 500 | 453 (90.6%) | 157.7 | 224 | 13.6 | 0 / 0 | 500 of 500 |
| braskas-final-aeon | 500 | 479 (95.8%) | 232.1 | 373 | 5.4 | 0 / 0 | 21 of 500 |
| seymour-anima-macalania | 500 | 470 (94.0%) -> 473 (94.6%), z 0.41 | 54.7 -> 55.2 | 86.7 -> 87.5 | 4.7 | 2 / 5 | 2 of 500 |
| evrae-airship | 500 | 488 (97.6%) | 71 -> 71.4 | 89.8 -> 90.3 | 0.7 | 0 / 0 | 0 of 500 |
| yojimbo-cavern | 500 | 493 (98.6%) -> 490 (98.0%), z -0.73 | 67.4 -> 68.4 | 95.9 -> 97.4 | 3.9 -> 4.1 | 3 / 0 | 0 of 500 |
| seymour-natus | 500 | 483 (96.6%) | 33.5 -> 33.7 | 48.3 -> 48.5 | 1.7 | 0 / 0 | 0 of 500 |
| seymour-omnis | 500 | 462 (92.4%) | 95.3 | 129.1 | 0.8 | 0 / 0 | 500 of 500 |
| isaaru-via-purifico | 500 | 452 (90.4%) -> 447 (89.4%), z -0.52 | 38.2 -> 38.5 | 84.4 -> 85 | 2.9 -> 3 | 5 / 0 | 0 of 500 |
| sin-fins-core | 500 | 432 (86.4%) | 295.5 | 381.8 | 3 | 0 / 0 | 500 of 500 |
| sin-face | 500 | 500 (100.0%) | 45.3 | 50.3 | 0 | 0 / 0 | 500 of 500 |
| exp-fayth | 500 | 488 (97.6%) | 71 -> 71.4 | 89.8 -> 90.3 | 0.7 | 0 / 0 | 0 of 500 |
| **all rows** | 6000 | 5700 -> 5695 (95.0% -> 94.9%) | | | | | 2523 of 6000 |

**The cause, told apart** (D1 with only some stat families on, 500 seeds of the five chapters that move plus 12 of Chapter III):

| D1 restricted to | What moves | Wins (of the 2,500 fights of macalania, evrae, yojimbo, natus, isaaru) |
|---|---|---|
| ACC, AGI, MAG and LCK floors | **nothing**: 2,500 of 2,500 logs identical (and Chapter III's 12 of 12) | 2,386 -> 2,386 |
| DEF floor only | Chapter VII (+3 wins), VIII, X, XIV (-5 wins), III: logs differ; Chapter IX's do not | 2,386 -> 2,384 |
| MDEF floor only | Chapter IX (-3 wins) and VIII: logs differ; VII, X, XIV and III do not | 2,386 -> 2,383 |
| DEF and MDEF together | all of the above | 2,386 -> 2,381 |

In player words: **a boss whose sheet says 0 Defence or 0 Magic Defence is treated by the game as 1, so each physical blow (or spell) lands about 0.7 percent weaker on it** (the note's figure: 730 against 725 in the damage formula's defence term). That shifts a few damage numbers by a point, so later HP thresholds and the rolls after them fall differently: the Guado Guardians, Seymour and Anima in VII, Evrae and Cid in VIII, Yojimbo, Ginnem and Daigoro in IX, Seymour Natus in X, Isaaru, Grothia and Spathi in XIV and the Pagodas in III play a different fight seed by seed, and the same fight on average (turns 54.7 -> 55.2, 86.7 -> 87.5 engine turns in VII). Things that sound as if they would matter and do not, in these fights: the Accuracy floor (a boss command carries its own accuracy byte, formulas 1 and 2 of `kernel/hit.ts`, and the user's Accuracy is read only by formulas 3 to 7), and the Agility, Magic and Luck floors; no event of any measured fight depends on them. In Chapters I, II, XII, XVII and XVIII the only floors that apply are Accuracy (all five), the Mortiorchis's Magic Defence (I) and the Mortiphasm's Defence, Magic Defence and Agility (XII): 500 of 500 logs identical in each. The three win changes are small (z 0.41, -0.73, -0.52 unpaired at 500 seeds; 5,700 -> 5,695 of 6,000); the 2,000-seed run below shows they are a deterministic effect and not random noise.

**More seeds, to settle whether it is noise** (seeds 501 to 2000 of the five chapters D1 moves, base and D1; with seeds 1 to 500 that is 2,000 fights of each; the seeds are paired, so the same seed is replayed against the same boss with the floor off and on):

| Chapter | 2,000 seeds, first-try wins | z |
|---|---|---:|
| seymour-anima-macalania | 1,899 (95.0%) -> 1,913 (95.7%) | 1.05 |
| evrae-airship | 1,945 (97.3%) -> 1,944 (97.2%) | -0.10 |
| yojimbo-cavern | 1,965 (98.3%) -> 1,959 (98.0%) | -0.69 |
| seymour-natus | 1,927 (96.3%) -> 1,928 (96.4%) | 0.08 |
| isaaru-via-purifico | 1,780 (89.0%) -> 1,764 (88.2%) | -0.80 |
| **five chapters, 10,000 fights** | 9,516 (95.2%) -> 9,508 (95.1%) | |

**This is a small deterministic effect, not random noise.** Every blow on a boss with Defence 0 (and every spell on one with Magic Defence 0) lands about 0.7 percent weaker, which is a fixed change, so the paired seeds flip in one direction more than the other. Over the 2,000 paired seeds of each chapter (lost / won back, seeds 1 to 2000 together): **Chapter XIV loses 16 fights and wins none back; Chapter VII loses 6 and wins 20**; VIII 2 / 1, IX 6 / 0, X 0 / 1. The effect on a win rate is small, so the unpaired z of the two win counts stays at or below 1.05 in absolute value (that test cannot tell a shift this size from zero at 2,000 seeds, and it is not the evidence that the effect is deterministic). Chapter XIV is the one that leans down (-16 of 2,000) and Chapter VII the one that leans up (+14 of 2,000). Flips over seeds 501 to 2000 alone (lost / won back): VII 4 / 15, VIII 2 / 1, IX 3 / 0, X 0 / 1, XIV 11 / 0.

### 5.3 D3, the Zanmato level

What the game does: Evrae's byte 3 is level 4 (and Mortibody 4, Ginnem 5, Isaaru 5). What we do: Evrae 3, the other three none. Only the player's own Yojimbo reads it (his Pay divides its motivation by the highest byte on the field plus one), and no shipped fight puts the player's Yojimbo against these four.

| Chapter | Seeds | First-try wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Wins lost / won back | Identical event logs |
|---|---:|---|---|---|---|---|---|
| evrae-airship | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 500 of 500 |
| yojimbo-cavern | 500 | 493 (98.6%) | 67.4 | 95.9 | 3.9 | 0 / 0 | 500 of 500 |
| seymour-natus | 500 | 483 (96.6%) | 33.5 | 48.3 | 1.7 | 0 / 0 | 500 of 500 |
| isaaru-via-purifico | 500 | 452 (90.4%) | 38.2 | 84.4 | 2.9 | 0 / 0 | 500 of 500 |
| exp-fayth | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 500 of 500 |
| **all rows** | 2500 | 2404 -> 2404 (96.2% -> 96.2%) | | | | | 2500 of 2500 |

Player words: nothing changes in any shipped fight; if a Yojimbo contract against Evrae were ever offered, he would be one level harder to please (Pay motivation divided by 4, not 3).

### 5.4 D7, Seymour Flux cannot be Slowed

| Chapter | Seeds | First-try wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Wins lost / won back | Identical event logs |
|---|---:|---|---|---|---|---|---|
| seymour-flux | 500 | 500 (100.0%) | 52 | 70.8 | 0.9 | 0 / 0 | 500 of 500 |

Player words: **Slow no longer works on Seymour Flux; Haste on him still does** (the record's Haste byte is 0). The shipped line never casts Slow at him, so no fight differs (5.9 shows the cast).

### 5.5 D8, Evrae can be Doomed

| Chapter | Seeds | First-try wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Wins lost / won back | Identical event logs |
|---|---:|---|---|---|---|---|---|
| evrae-airship | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 500 of 500 |
| exp-fayth | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 500 of 500 |
| **all rows** | 1000 | 976 -> 976 (97.6% -> 97.6%) | | | | | 1000 of 1000 |

Player words: **a Doom that lands on Evrae would now stick, with the record's 30-turn countdown**. The data's own comment (`evrae.ts:153`) says a 30-turn Doom never resolves in this fight (the whole fight is 89.8 engine turns, all actors together); the visible change is a Doom marker that does not run out. The line casts no Doom.

### 5.6 D9, the Life flag

| Chapter | Seeds | First-try wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Wins lost / won back | Identical event logs |
|---|---:|---|---|---|---|---|---|
| braskas-final-aeon | 500 | 479 (95.8%) | 232.1 | 373 | 5.4 | 0 / 0 | 500 of 500 |
| seymour-anima-macalania | 500 | 470 (94.0%) | 54.7 | 86.7 | 4.7 | 0 / 0 | 500 of 500 |
| evrae-airship | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 500 of 500 |
| sin-fins-core | 500 | 432 (86.4%) | 295.5 | 381.8 | 3 | 0 / 0 | 500 of 500 |
| sin-face | 500 | 500 (100.0%) | 45.3 | 50.3 | 0 | 0 / 0 | 500 of 500 |
| exp-fayth | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 500 of 500 |
| **all rows** | 3000 | 2857 -> 2857 (95.2% -> 95.2%) | | | | | 3000 of 3000 |

Player words: **Life, Phoenix Down and the other revivals no longer kill these nine bosses when they are a Zombie.** Eight of the nine cannot be made a Zombie at all (byte 255); only Sinspawn Genais can (byte 80). No fight differs.

### 5.7 D10, the record's remaining bits

| Chapter | Seeds | First-try wins | Party turns (mean) | Engine turns (mean) | Party KOs (mean) | Wins lost / won back | Identical event logs |
|---|---:|---|---|---|---|---|---|
| braskas-final-aeon | 500 | 479 (95.8%) | 232.1 | 373 | 5.4 | 0 / 0 | 500 of 500 |
| evrae-airship | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 500 of 500 |
| yojimbo-cavern | 500 | 493 (98.6%) | 67.4 | 95.9 | 3.9 | 0 / 0 | 500 of 500 |
| seymour-omnis | 500 | 462 (92.4%) | 95.3 | 129.1 | 0.8 | 0 / 0 | 500 of 500 |
| isaaru-via-purifico | 500 | 452 (90.4%) | 38.2 | 84.4 | 2.9 | 0 / 0 | 500 of 500 |
| sin-fins-core | 500 | 432 (86.4%) | 295.5 | 381.8 | 3 | 0 / 0 | 500 of 500 |
| exp-fayth | 500 | 488 (97.6%) | 71 | 89.8 | 0.7 | 0 / 0 | 500 of 500 |
| **all rows** | 3500 | 3294 -> 3294 (94.1% -> 94.1%) | | | | | 3500 of 3500 |

Player words: **Shell, Protect, Reflect and the four Nul spells no longer land on a Yu Pagoda** (nothing in the line casts them there); the Pagodas and the Mortiphasm can be Cursed; the Scan marker is refused by Yu Yevon, Cid, Isaaru, Mira, Daigoro, the Pagodas and the Mortiphasm; the Mortiphasm cannot be Delayed or hit for a percentage (they are untouchable already). No fight the line plays differs. **Two changes a player sees:**

- **Scan on a Yu Pagoda stops working.** With D10 off, a Scan reveals the Pagoda and the Scan status lands. With D10 on, nothing is revealed and the status is refused, so the player sees an immune miss. This is the game's data: the Pagoda record has f28 bit 4 and extra-immunity bit 0 set. Earlier lanes mapped f28 bit 4 to `immune-to-scan`; what that bit means is not read in FFX.exe. (This corrects an earlier line of this note, which said the Pagodas' Scan reveal "already fails": it does not, the Pagoda row carries no `immune-to-scan` flag today and D10 adds it; open item 2 has the rows other than the Pagodas.)
- **Sensor on Yu Yevon reveals him.** Today Sensor on Yu Yevon shows the plate "Immune to sensors." (D-221, `src/ui/ffx/sensorImmune.ts`), not "- - -". With D10 he is revealed: HP 99,999, MP 1. It shows in Chapter III's last link and in Chapter 28.

### 5.8 All six together

D1 + D3 + D7 + D8 + D9 + D10 on the same twelve chapters as D1: 6,000 fights, 5,700 -> 5,695 first-try wins (95.0% -> 94.9%), the same flips as D1 (VII 2 lost / 5 won back, IX 3 lost, XIV 5 lost), 2,523 of 6,000 logs identical to the base, and **6,000 of 6,000 logs identical to D1 alone**: the other five add nothing to any fight the line plays.

### 5.9 What the line never does, shown by direct casts (the engine's own path: `buildBattle`, then `resolveAbility` with the status step; seeds 1 to N, party member as caster)

| Cast | Switch off | Switch on |
|---|---|---|
| Slow at Seymour Flux (1,000 casts) | lands 987 times (13 are the status roll's misses) | 0 |
| Haste at Seymour Flux (1,000 casts) | 1,000 | 1,000 (D7 does not touch it) |
| Doom (a status-only command) at Evrae (200) | 0 | 200 |
| Life at a Zombified Left Fin (200); the target dies | 200 | 0 (D9) |
| Shell at a Yu Pagoda (200) | 200 | 0 (D10) |
| Protect at a Yu Pagoda (200) | 200 | 0 (D10) |

(The Left Fin is not a Zombie-able boss; the status is set by hand to show the rule the flag changes.) The unit file also asserts the engine inputs: Flux's Slow resistance byte 0 -> 255; Evrae's extra-immunity word loses the Doom bit; the special word gains the Life bit; Evrae's Zanmato byte reads 2 -> 3; a Pagoda's Shell, Protect, Reflect and Nul bytes 0 -> 255, its Scan bit in and its Curse bit out.

### 5.10 The visible effects of the switches, in one list (the independent check's findings; none shows in a fight the shipped line plays)

- **D10, Scan on a Yu Pagoda stops working:** nothing is revealed and the status is refused (5.7).
- **D10, Sensor on Yu Yevon:** today the plate "Immune to sensors." (D-221); with D10 he is revealed, HP 99,999, MP 1 (5.7; Chapter III's last link and Chapter 28).
- **D10, the Scan status marker is refused** by Yu Yevon, Cid, Isaaru, Mira, Daigoro and the Mortiphasm.
- **D10, Shell, Protect, Reflect and the four Nuls fail on a Pagoda,** showing an immune miss.
- **D7, Slow fails on Flux.**
- **D10, Auto-Life fails** on Braska's Final Aeon, Yu Yevon, Mira, Isaaru and Daigoro.
- **D8 puts a Doom marker on Evrae that never runs out** (the 30-turn countdown cannot finish in the fight).
- **D1, a small deterministic effect** on the fights of Chapters III, VII, VIII, IX, X and XIV (5.2).

## 6. Decision table for Bailey (one row per switch; the main session asks him)

| Switch | What the game does | What we do | Measured effect (500 seeds per chapter touched) | Recommendation |
|---|---|---|---|---|
| **D1** monster stat floors (FFX only) | Every monster's Strength, Defence, Magic, Magic Defence, Agility, Luck and Accuracy is at least 1 in battle [emulated, 41,743 runs] | 63 stat cells of 29 boss rows read 0 | 6,000 fights: first-try wins 5,700 -> 5,695 (95.0 -> 94.9 percent). Chapter VII +3 (470 -> 473), IX -3 (493 -> 490), XIV -5 (452 -> 447) (z 0.41, -0.73, -0.52). It is a small deterministic effect, not noise: over 2,000 paired seeds of each of the five chapters that move, 9,516 -> 9,508 of 10,000, unpaired |z| at most 1.05, and Chapter XIV loses 16 fights and wins none back while Chapter VII loses 6 and wins 20. 3,477 of 6,000 fights play out differently event for event (VII, VIII, IX, X, XIV, III); I, II, XII, XVII, XVIII are identical. Cause: only the Defence and Magic Defence floors (each blow 0.7 percent weaker on a boss that had 0) | **Match the game.** The cost is a re-pin of 12 of the 18 `ffx-engine-golden` digests (III, VII, VIII, IX, X, XIV; every outcome still a victory) |
| **D3** Zanmato level (FFX only) | Evrae's byte 3 is level 4 (Mortibody 4, Ginnem 5, Isaaru 5) | Evrae 3; the other three none | None. Only the player's Yojimbo reads it and no shipped fight pairs him with these | **Match the game** (free; one uniform rule) |
| **D7** Flux's Slow (FFX only) | Seymour Flux cannot be Slowed (byte 255); Haste lands (byte 0) | Slow lands (the header's "copy/paste artefact" reading was wrong for Slow) | None in 500 Chapter I fights (the line never Slows him). A direct Slow lands 987 of 1,000 today, 0 with D7; Haste 1,000 of 1,000 both ways | **Match the game.** Nothing else to change: the guide card never promised Slow (checked); the Haste on Seymour the research prized still works |
| **D8** Evrae's Doom (FFX only) | Evrae is not Doom-immune; the Doom counter starts at 30 | Doom-immune. The data followed the wiki; that is research conflict C-3 (`research/ffx-evrae-airship.md`, about line 774), which the researcher and the driver resolved, and it is not a decision of Bailey's. The research said "trust the decompile", yet the data followed the wiki for Doom immunity | None in 1,000 fights. A direct Doom lands 0 of 200 today, 200 of 200 with D8, and its 30-turn countdown does not run out in this fight (`evrae.ts:153`): the visible change is a Doom marker on Evrae that never runs out | **Match the game.** There is no earlier owner decision to reverse. Inert either way |
| **D9** Life-immune flag (FFX only) | Nine of our rows (Evrae, Sin, Seymour in VII, both Fins, Genais, the Core, both Pagodas) are immune to Life | The flag is missing | None in 3,000 fights. A revival on a Zombified target kills it today and no longer does (200 of 200 -> 0). Only Genais can be made a Zombie | **Match the game** |
| **D10** the record's remaining bits (FFX only) | The record also makes the Pagodas immune to Shell, Protect, Reflect, the four Nuls, Scan and Bribe, Braska's Final Aeon, Yu Yevon, Isaaru, Mira and Daigoro immune to Auto-Life and Scan, Daigoro to Eject, the Mortiphasm to Percentage, Delay and Bribe with EVA 0; it does **not** make the Pagodas or the Mortiphasm Curse-immune, and Yu Yevon is not sensor-immune | The first group is absent; the Curse immunity and Yu Yevon's sensor flag are ours | None in 3,500 fights. Direct: Shell and Protect land on a Pagoda 200 of 200 today, 0 with D10 (an immune miss). **Two visible changes a player meets (5.7):** Scan on a Yu Pagoda stops working (today a Scan reveals it and the Scan status lands; with D10 nothing is revealed and the status is refused; the Pagoda record has f28 bit 4 and extra bit 0 set, and what f28 bit 4 means is not read in FFX.exe); Sensor on Yu Yevon, which today shows the plate "Immune to sensors." (D-221), reveals him: HP 99,999, MP 1 (Chapter III's last link and Chapter 28). Other refusals in 5.10 | **Match the game**, with the two visible changes checked by hand before release. If the Pagoda Scan change is unwanted, drop `scan` from the Pagoda's `immune` list and from its `flagsOn` (two table entries); if the Sensor change is unwanted, keep the sensor flag (one table entry) |

## 7. Open items

1. **Script writes beat records.** A script that writes a stat after the initialiser is not clamped by it; this lane could only check the writes earlier lanes had read (Cid's AGI, the Gui rematch, the Pagoda HP, the possessed aeons, the Dark Aeons). D1 raises Yu Yevon's LCK and ACC (the AI lane overruled the wiki's 1 with the record's 0, `re-ffx-ai-yunalesca-bfa.md` 6.1) to the Chr value 1; whether any of the other rows' scripts write a 0 over it is unread.
2. **The Scan bits.** Two conventions meet: the engine's Scan reveal fails on the `immune-to-scan` flag (f28 bit 4), and the Scan status is refused by the extra-immunity word's bit 0. D10 sets both from the record. For every row but the Pagodas the flag was there already, so the Scan reveal fails as before and only the status marker is newly refused; **for the Pagodas the flag is new, so Scan on a Pagoda stops working** (5.7). The Pagoda record has f28 bit 4 and extra bit 0 set; earlier lanes mapped f28 bit 4 to immune-to-scan, but its meaning is not read in FFX.exe. What the game shows when the status step refuses a Scan is not read.
3. **The Curse bit's name** (bit 10) is FFX-G04's; no record in the shipped chapters sets it.
4. **Chapter 28 is not benched** (the chain needs the player's offering picks). Its rows are Chapter III's.
5. **If Bailey says yes to D1:** set `D1: true`, re-pin 12 `ffx-engine-golden` digests (braskas-final-aeon#1 and #7, seymour-anima-macalania, evrae-airship, yojimbo-cavern, seymour-natus, isaaru-via-purifico, each at seeds 1 and 7; every outcome a victory; the other six digests do not move), put the cause in that file's header, and read `CHANGELOG.md`'s Chapter VII, VIII, IX, X, XIV and III lines. For D7, D8 and D10 also add the real-input check that Sensor and Scan read as intended.
6. **Merge hot spots:** `setup.ts` (one import and one call line added; 395 lines, the 400-line limit is close), nothing else shared. The RC10 hit-order lane's branch touches `abilities.ts`, `hit-apply.ts`, `state.ts` and not `setup.ts`.
7. **Not mine, seen:** the Pagoda row's overkill threshold (99,999 against the record's 5,000, deliberate); the Mortiphasm LCK/EVA and Yu Pagoda HP rows the gap scan called "script or placeholder questions" are answered above (EVA is in D10; HP stands).

## 8. Tests run (no full suite, by the brief; two workers at most)

- `parity-ffx-boss-data.test.ts` (13) and `parity-ffx-boss-data-engine.test.ts` (10): 23 of 23. Both files and the helper are under 400 lines (218, 169, 84).
- The three goldens: `ffx-engine-golden` (18), `ffx2-atb-golden` (6), `ff7-golden` (3): 27 of 27, unchanged.
- The related engine and data files: `parity-ffx-*`, `ffx-engine*`, `data-ffx-*` (96 files): **1,781 tests passed, 5 skipped, 0 failed**.
- The FFX chapter engine, data, stats and rewards files of `tests/unit/chapters/` (21 files: besaid-valefor data and engine, biran-yenke data, engine, rewards and stats, evrae-engine, isaaru-engine, ixion-engine, macalania-engine, mirror-aeons aeon-stats, data and engine, natus-engine, omnis-engine, sin-core-engine, sin-data, sin-engine, sin-fins-engine, sinspawn-gui-data, yojimbo-engine): **423 passed, 0 failed**. A first attempt at all 194 files of that folder was stopped by its PID after 15 minutes with no file finished (the machine was loaded by other sessions' suites); the FFX-2 and scene files were not run.
- `npx tsc --noEmit` clean; `node tools/orphans.mjs` clean for the new files.
- Not run: the rest of the suite (the main session's job at the end).

## 9. CHANGELOG paragraphs (plain words, one per switch; for the main session to paste when Bailey turns one on; none is in any build)

**D1, FFX only.** A boss whose sheet carries a 0 in Defence, Magic Defence, Magic, Agility, Luck or Accuracy is now treated as the game treats it, as a 1. The only one that touches a fight is the Defence and Magic Defence floor: each blow or spell on such a boss lands about 0.7 percent weaker, so fights in Chapters III, VII, VIII, IX, X and XIV play out a little differently from seed to seed. It is a small deterministic effect, not random noise: over 2,000 paired simulated fights Chapter XIV loses 16 fights and wins none back (about 0.8 point lower), and Chapter VII loses 6 and wins 20 (about 0.7 point higher); across 6,000 fights the line wins 95.0 percent before and 94.9 percent after. Chapters I, II, XII, XVII and XVIII are unchanged.

**D3, FFX only.** Evrae's Zanmato level reads 4, as the game's file says (it read 3), and Mortibody, Ginnem (Mira) and Isaaru carry theirs. Only a player's Yojimbo reads it and no chapter pairs him with them, so nothing in play changes.

**D7, FFX only.** Seymour Flux cannot be Slowed, as his record says; Slow now fails on him and Haste still lands. The shipped line never Slows him.

**D8, FFX only.** Evrae can be Doomed, as his record says. A Doom that lands puts a marker on him that never runs out, because his 30-turn countdown cannot finish in the fight. Nothing in the line casts Doom.

**D9, FFX only.** Nine bosses (Evrae, Sin, Seymour in Macalania, both Fins, Sinspawn Genais, the Sin Core, both Yu Pagodas) are immune to Life as the game has it: a revival no longer kills them if they are Zombies. No fight differs.

**D10, FFX only.** The Yu Pagodas, Braska's Final Aeon, Yu Yevon, the Mortiphasm, Cid, Mira, Isaaru and Daigoro take the immunities and flags their records carry (Pagodas immune to Shell, Protect, Reflect and the Nuls, which now fail on them as an immune miss; the Pagodas and the Mortiphasm no longer immune to Curse; Auto-Life fails on Braska's Final Aeon, Yu Yevon, Mira, Isaaru and Daigoro; the Scan marker is refused by Yu Yevon, Cid, Isaaru, Mira, Daigoro and the Mortiphasm). Two changes a player sees: **Scan on a Yu Pagoda stops working** (before, a Scan revealed it and the Scan status landed; now nothing is revealed and the status is refused, so it shows as an immune miss), and **Sensor on Yu Yevon reveals him** (before, it showed the plate "Immune to sensors."; now it shows HP 99,999 and MP 1), in Chapter III's last link and in Chapter 28. No fight the line plays differs.

## 10. Re-run commands (repo root of the worktree; Node 24; TEMP and TMP on D:, here the per-lane folder `D:/Tools/ffx-parity/tmp/ffx-boss-data`)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .
TEMP=... TMP=... node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx-boss-data.test.ts tests/unit/parity-ffx-boss-data-engine.test.ts
TEMP=... TMP=... node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
node tools/orphans.mjs
```

Measurement and mutation tooling (outside the repo, in the lane's folder, deleted at the end of the lane; each script is small): `read-records.mjs` (the VBF read), `compare.mjs` (engine rows against records), the RC9 counters lane's `zz-digest.test.ts` with a `ZZ_SWITCHES` line (and `ZZ_D1_KEYS` for the ablation), `digest-compare.mjs`, `tables.mjs` (the tables above), `mutate2.mjs` with `mutants.json`, run in scratch copies made with `git archive <ref> src vitest.config.ts package.json tsconfig.json`. To turn a switch on for a measurement without editing the repo: `ZZ_SWITCHES=D1,D7` in the digest test, or `setBossDataSwitches({ D1: true })` in any test (and call the function it returns).

## 11. Turned on (Bailey 2026-10-17)

**Status: all six switches are ON** (`BOSS_DATA_SWITCHES` in `src/battle/ffx/boss-data-corrections.ts` is `{ D1: true, D3: true, D7: true, D8: true, D9: true, D10: true }`), on branch `re-parity-rc10-ffx-boss-data-on`: the merge `8c0dd80d2` (`origin/r53-rc` `aef7e0e73` plus this lane's `cd962ee25`, switches still OFF in that commit) and, on top of it, the commit that turns them on. **Game case: FFX only** (AGENTS.md rule 14): `src/battle/ffx2`, `src/data/ffx2` and `src/battle/ff7` are untouched, and `ffx2-atb-golden` (6) and `ff7-golden` (3) pass unchanged. Not merged to `main`, not deployed.
Bailey's decision (2026-10-17, asked which FFX boss-data fixes should match the game): **"All six (Recommended)"**, so D1, D3, D7, D8, D9 and D10; his standing order of 2026-10-08, "It needs to be a 1:1 parity." Nothing here was tuned: the numbers are the game's own record bytes, as in sections 2 and 3.

### 11.1 What changed in the code

- `boss-data-corrections.ts`: the one constant `BOSS_DATA_SWITCHES` (`false` x 6 -> `true` x 6) and the header comments (they cite the decision). `setBossDataSwitches(on)` still returns the function that puts every switch back, so a bench or a test can read the tree as it was before (`ALL_OFF`).
- `setup.ts`: one comment ("each behind a switch, all six ON since 2026-10-17"). The call in `buildBattle` is the same line; it still works on the battle's own deep copy, so the module rows in `src/data/ffx/enemies/**` are not edited (the tests that read those rows, e.g. `chapters/evrae-engine.test.ts` with Evrae's Zanmato level 3, stay true: the corrected row exists only in a battle).

### 11.2 The re-pin of `ffx-engine-golden` (12 of 18 digests; all outcomes still victories)

| Digest | Before (r53-rc) | After (all six ON) |
|---|---|---|
| braskas-final-aeon#1 link 2 | c45dcb19 | 2ae22767 |
| braskas-final-aeon#1 link 4 / 5 / 6 / 7 | e32d5371 / b8fc718 / fc9cfb11 / 70b56493 | cb91b2df / cf6bdf71 / 97585c97 / 420d8443 |
| braskas-final-aeon#7 link 4 / 5 / 6 / 7 | 31e06759 / ab0e939f / 76f6bfc5 / f2f0106a | 46ee87e5 / e43f9a91 / a8adb1e1 / b6291175 |
| seymour-anima-macalania#1 / #7 | 3f4769eb / c69441ce | c4ad03e / ff0b2fa0 |
| evrae-airship#1 / #7 | 398f2884 / 9bc2532c | 9c6cc0f9 / d82a7350 |
| yojimbo-cavern#1 / #7 | daacc3d9 / 164be66a | aaafef63 / b8d03c28 |
| seymour-natus#1 / #7 | 336d9ea6 / 8097fc70 | ac9d49d4 / 72c18e1e |
| isaaru-via-purifico#1 / #7, link 3 (the boss) | 13b0bd8a / a36d68be | 78ff97b5 / d0a1f362 |

braskas-final-aeon links 1 and 3 (#1) and 1 to 3 (#7), isaaru links 1 and 2, and the six digests of seymour-flux, yunalesca and seymour-omnis (both seeds) do not move.

**The cause is D1 alone**, the Defence and Magic Defence floors: the game treats a monster's 0 as 1, so each blow or spell lands about 0.7 percent weaker on a boss row that read 0, which shifts a few damage numbers by a point and so the rolls after them. D3, D7, D8, D9 and D10 move no digest, as the lane's own runs said (section 5).

**Proof** (re-run on this tree, `r53-rc` `aef7e0e73` + the lane; a scratch test played the 18 digests of the golden under 9 switch sets, the driver being the golden's own; the scratch file is not committed):

| Switch set | Digests that differ from r53-rc's table (the line before this commit) | Digests that differ from the new table |
|---|---:|---:|
| all six OFF | **0 of 18** | 12 |
| D1 alone | 12 | **0** |
| all six ON | 12 | **0** |
| D3 alone / D7 alone / D8 alone / D9 alone / D10 alone | 0 of 18 each | 12 |
| D3 + D7 + D8 + D9 + D10 together (all but D1) | **0 of 18** | 12 |
| D1 on the Defence floor only | 10 (all but yojimbo-cavern) | 4 |
| D1 on the Magic Defence floor only | 4 (evrae-airship, yojimbo-cavern) | 10 |
| D1 on Accuracy, Agility, Magic and Luck only | 0 | 12 |

So the table before this commit is exactly what the tree gives with the six OFF, and the table after it is exactly what D1 gives. `ffx-engine-golden` itself passes on the new table (18 of 18) and the header of that file carries the cause.

**A correction to the commit that turned the switches on** (`a66426afe`; its subject cannot be amended here): it says "13 digests re-pinned"; the count is **23 rows**: 12 digests of `ffx-engine-golden` (11.2) plus 11 seed rows of Chapter III's pin in `chapters/last-summoning-iii-pin.test.ts` (11.3).

### 11.3 The lane's tests, from "all off" to "all on, with the off state kept as its own proof"

- `parity-ffx-boss-data.test.ts` (13 -> 14 tests): "the switches are all ON" (was "are all off"); `setBossDataSwitches` is shown by switching two OFF and putting them back to ON; a new test that a battle copy built with the shipped switches carries every corrected row (Evrae 1/1/4, no Doom bit, the Life flag; and every mapped row equals `corrected(id, ALL_ON)`) while the module rows stay as they were; the off-state test is explicit now (`setBossDataSwitches(ALL_OFF)` or `applyBossDataCorrections(group, ALL_OFF)`: the group is not read, a getter that throws is never reached, and the copy equals the group), so it is the proof that the six OFF give back the tree as it was before they were turned on. `afterEach` puts the switches back to the shipped values (it used to put them to false).
- `parity-ffx-boss-data-engine.test.ts` (10 -> 11 tests): every state is named (`ALL_OFF` for the old row, `only('Dn')` for one switch, `{}` for "as shipped"), so each case proves both states: Evrae (DEF 0, MDEF 0, Zanmato 3, Doom immune, no Life flag with the six OFF; 1, 1, 4, no Doom bit, the Life flag as shipped), Flux's Slow byte (0 off, 255 as shipped), the Pagoda's resistance bytes and Scan bit, the Last Summoning's Pagodas, and the real casts (Slow at Flux 200: lands with D7 off, 0 as shipped; Doom at Evrae 50: 0 off, 50 as shipped; **new:** Shell and Protect at a Yu Pagoda, 200 casts each: land with D10 off, 0 as shipped).
- `ffx-engine-golden.test.ts`: the 12 re-pins above, the cause in the header.
- `chapters/last-summoning-iii-pin.test.ts` (**the one other test that pinned the old data**: Chapter III's twelve seeds, whole chain, a SHA-256 of every link's log): 11 of its 12 seed rows moved, so `NOW` is now the boss-data-ON table (whole-table digest `81dec25351f5f13d`) and the old `NOW` is kept as `RELEASE_53` (digest `1a75c7ad63ce11ae`, as the record, like `BEFORE` and `RELEASE_52`). The cause is D1 (the Yu Pagodas' and Yu Yevon's Defence, and his Magic Defence, read 1 in the game): no outcome, no number of links and no formation moved; seed 3, the defeat on link 1, is the one seed that does not move; the other eleven move in 2 to 5 of their 7 links. Proved on this tree with a scratch test (not committed) over 9 switch sets: all six OFF = `RELEASE_53`, 12 of 12; D1 alone = all six ON = `NOW`; D3, D7, D8, D9, D10 alone and together move 0 of 12. The file now also holds the off-state proof as tests: a test that plays the twelve seeds with the six false and with only D3, D7, D8, D9, D10 on and expects `RELEASE_53`, and a test that the move changes no outcome and no link count and leaves exactly seeds 1, 2, 4 to 12 moved. 15 -> 17 tests.
- **No other FFX test pinned the old data**: **272 test files** that run the FFX engine, build a battle, or read an immunity, a flag or a Zanmato level (211 found by grep for `FFXEngine`, `buildBattle`, `setupForChapter`, `immunities.`, `zanmatoLevel`, `immune-to-` and the module's name, plus 61 FFX files that reach the engine only through a helper) were run with the six ON: every test passes (2,855 + 858 tests) apart from (a) three 15-second timeouts of `advisor-floor.test.ts` in the first batch, run on a machine shared with other lanes, which passes alone (23 of 23, 165 s), and (b) four assertions of `chapters/mirror-aeons-art.test.ts` (art-manifest rows for dark-cindy, dark-sandy, dark-mindy and dark-yojimbo are undefined: the art-only failure the brief expects in a worktree, nothing to do with the engine). The tests that read the module rows (e.g. `chapters/evrae-engine.test.ts`: Evrae's `zanmatoLevel` 3 and no Sensor flag; `chapters/last-summoning-records.test.ts`: Yu Yevon's level 5) are still true because the corrected row exists only in a battle's own copy. The three-seed FFX-2 and FF7 goldens are unchanged; nothing of FFX-2 or FF7 was touched.
### 11.4 Visible text for the release driver (found by grep, NOT edited)

No strategy-guide line or card claims that Slow lands on Seymour Flux, that Shell, Protect or Reflect lands on a Yu Pagoda, or that Scan works on a Pagoda (searched `src/data/guides/**`, `src/engine/tactics/**`, `src/ui/**`, `src/data/chapter-*.ts`, `learn/**`, `CHANGELOG.md`). The nearest lines, all still true:

- `src/data/guides/seymour-flux.ts:42` (Provoke, the Breaks and Delay Attack are dead rows; "Slowga" is the Mortiorchis's reply to a Delay hit, not a Slow on Flux) and `:60-61` (Haste, which still lands on Flux; D7 touches only Slow).
- `src/data/guides/braskas-final-aeon.ts:43` ("Killing or slowing them") and `:81-82` ("Slow a Pagoda and its Power Wave stops feeding him"): Slow is the one status a Pagoda still takes (resistance 50), so these stay true. `:86-87` and `:102`, and `src/data/guides/last-summoning.ts:106` and `:115-116`, are the party's Protect, not a Protect on a Pagoda. `src/engine/tactics/braskas-final-aeon.ts:70` and `:282` (code comments: a Pagoda is immune to everything but Slow and Delay) are now closer to true.

In-game **data text whose reach changes** (the Sensor and Scan readouts):

- `src/data/ffx/enemies/braskas-final-aeon.ts:129-130`, the Yu Pagodas' `scanText` ("Support construct. Restores HP ...", also Chapter 28's Pagodas): Scan on a Pagoda now fails (D10 sets the Pagoda's `immune-to-scan` flag), so this line is never shown; the Pagodas' Sensor line at `:128` is unchanged.
- `src/data/ffx/enemies/braskas-final-aeon.ts:508`, Yu Yevon's `sensorText` ("It cannot be reasoned with ..."): D10 removes his `immune-to-sensor` flag, so Sensor now reveals him with this line, HP 99,999 and MP 1, where it showed "Immune to sensors." (D-221, `src/ui/ffx/sensorImmune.ts:17`) before; his `scanText` (`:509-510`) stays unreachable (he was already Scan-immune). Chapter III's last link and Chapter 28.
- `CHANGELOG.md`: the paragraphs are written (section 9 of this note, one per switch, plain words, FFX only); the release driver pastes them. D10's two visible changes are the ones a player meets.

### 11.5 Open items

1. **Real-input check of the two visible D10 changes** (Scan on a Yu Pagoda; Sensor on Yu Yevon) in a browser, Chapter III and Chapter 28, before release (this note's section 7, item 5; not run here: this lane runs no game and no dev server).
2. **Data-file comments that describe the old rows**: `src/data/ffx/enemies/seymour-flux.ts` (header, lines about Slow), `evrae.ts` (the `doom: 255` line and the Zanmato 3 comment) and `braskas-final-aeon.ts` (the Pagodas' flags) say what the module row holds, which is unchanged; the battle copy differs from it by `boss-data-corrections.ts`. A one-line pointer in each would help the next reader; not done here (those files are shared and the rows must not move).
3. **Merge order**: `ffx-engine-golden` is also re-pinned by other RC10 lanes (hit order is already in this tree). Whichever lands second must re-derive its digests on the merged tree: the recipe is the 9-set run above (a scratch vitest file that plays the golden's 18 chains under `setBossDataSwitches(...)`), whose "all six OFF" row must equal the table before the commit that turns them on.
4. **Everything in sections 6 and 7** that does not depend on the decision still stands (script writes beating records, the Scan bits, the Curse bit's name, Chapter 28 not benched).
