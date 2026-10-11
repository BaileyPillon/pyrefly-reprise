# Re-parity, boss AI, FFX-2 group (c): the Leblanc Syndicate (Chapter VI), the Den of Woe shades (XV) and Ixion at Djose (XVI) follow the game's own scripts

Status: **built and committed on branch `re-parity-ai-ffx2-c`, pushed, not merged, not deployed** (2026-10-10). Lane AI-FFX2 (c) of
[the re-parity plan](../plans/re-parity.md) ([boss-AI preflight](../plans/re-parity-ai-review.md)); the source is the research note
[`research/re-ffx2-ai-leblanc-den-ixion.md`](../../research/re-ffx2-ai-leblanc-den-ixion.md), section 8, rows O, L, G, K, R, D and I. Owner: Bailey.
**Game case: FFX-2 only** (AGENTS.md rule 14). No file under `src/battle/ffx`, `src/data/ffx` or `src/battle/ff7` changed; `ffx-engine-golden` and `ff7-golden`
are unchanged, and so are `ffx2-atb-golden` (Chapters IV and V) and the Chapter XI, Sisters and Chapter V rows of `den-of-woe-carry`. Base: `931613a8`
(origin/re-parity-rc1, the code of live release 39.4.3).

Bailey, 2026-10-08: "It needs to be a 1:1 parity." 2026-10-10: "go full speed ahead please i have a ton of usage on several other accounts".

Nothing on a boss or a party was tuned (hard rule 6 and the lane brief). Every number is the script's, as the note records it, or a row of `monster.bin` that
W3 already attached; every effect on the fights is measured, with ablations, in section 8.

Commits on `re-parity-ai-ffx2-c` (oldest first; base `931613a8`):

| Commit | What |
|---|---|
| `3b73a564` | FFX-2 engine: results a monster has taken reach its script, and a scripted batch can name its girls (`results-tally.ts`, `AiScript.onResults`, `sequenceTargets`); inert for every other script |
| `ce62681e` | FFX-2 data: Acts I and II and both goons carry the game's monster rows; Baralai's Triple Attack is three Chain Attacks; the first-room Concussive Shock override is gone |
| `f9f1219d` | FFX-2 boss AI: the Syndicate, the Den shades and Ixion follow the game's decision tables, with its rolls and per-result counters |
| `5f575789` | Tests: a decision-table test per boss walks every row, with the note's interpreter tallies |
| `a17526b6` | Tests: the FFX-2 chapter tests and Chapter VI goldens move to the game's scripts ("game-script parity"), each with its reason |
| `d4aab481` | FFX-2 enemy-intent panel lists Baralai's and Ixion's counters as per result; a test pins that asking the panel never moves these fights |
| `3ea947d0` | Tests: the mutation check's two survivors pinned (Fem-Goon's half line by target; Baralai's low-HP roll by its exact 16,384 of 65,536); 60 s timeouts for the loop-heavy tests |
| `83c10d7c` | Tests: the battle-message test's Pilfer Gil pin moves from 1,267 to 1,350 (the Syndicate's scripts spend a different number of draws before Rikku's turn; the 750 to 1,500 range check stays the rule) |
| (this note) | Handoff note `docs/handoff/re-parity-ai-ffx2-c.md` |

## 1. What the engine does now

Twelve game scripts (`m135 m138 m166 m176 m177 m243 m244 m245 m249 m250 m253 m258`) read against ours, in our own words: eleven engine scripts rewritten as the game's
decision tables (Ormi's three rooms, Logos' two, both goons, Leblanc, Baralai, Gippal, Ixion) and Nooj's (`m258`), which already agreed with the game's, carried over unchanged
(row D11). The pieces they share are small and **inert for every script that does not use them** (the goldens prove it, section 7):

| Piece | Where | What it is |
|---|---|---|
| The script's rolls | `ai/script-rolls.ts` | `random()` is one engine draw `int(0, 0xFFFF)` and a script's `random() % n` is that value mod `n` (`scriptMod`), so `% 5` leaves residue 0 one value ahead, as the game's does. A target search keeps the girls that are alive and targetable in slot order, **draws nothing for fewer than two candidates**, and otherwise takes the `(value mod n)`-th (`pickFrom`). The common pair, `searchr(all girls, alive)` then `searchr(that set, stat, max or min)`, makes its first search's draw and throws it away when two or more girls live, and picks among **every** candidate tied for the extreme (`extremePick`). One engine stream stands in for the game's stream 2 and 4 until the RNG batch |
| Results a monster has taken | `results-tally.ts`, `AiScript.onResults`, `engineHooks.ts#notifyEnemiesResults`, a note in `resolve-strike.ts` | The game runs a monster's reaction entry once **per result** applied to it (each landing strike; one for a miss however many strikes it had; one for a no-effect result; never its own; not while it is stopped, asleep, petrified, confused or berserk). The resolver notes each result as it applies it; after the action the script is told the count and the latest attacker, once. Baralai's burst counter and Ixion's action counter are the two scripts that count them. The tally is a `WeakMap` beside the engine (not state, not an event: no replay, save or snapshot moves) and is emptied for every enemy whether or not its script listens |
| A batch aimed at named girls | `resolve.ts` (`AbilityDef.extra.sequenceTargets`) | The game's scripted batches (Baralai's Triple Attack is three Chain Attack commands at three fixed girls) run as one action: the ability is the first command and `extra.sequence` the rest, as No Love Lost already was; with `sequenceTargets` the AI's target list gives one girl per command in order (without it every stage picks its own, as before) |
| The second command of a poll | `ai/den-of-woe.ts` (`MEM.queued`) | Baralai's low-HP move is an **extra** command beside the poll's normal one (D1, D2). The engine runs one command a turn on this base, so the second is kept in his AI memory and returned at his next poll; the game runs the batch without a gap (a timing row for W4, section 5) |

Files: `ai/script-rolls.ts`, `ai/syndicate-ormi.ts`, `ai/syndicate-logos.ts` (Logos and both goons), `ai/leblanc-syndicate.ts` (Leblanc and the registry), `ai/den-of-woe.ts`,
`ai/ixion.ts`; data `enemies/leblanc-syndicate-acts.ts`, `enemies/den-of-woe-abilities.ts`, `command-records/enemies.ts`, `monster-records/records.ts`. All under 400 lines.
Shared engine files touched (small, additive, none in W4's list): `internal.ts` (`onResults` on `AiScript`), `engineHooks.ts` (`notifyEnemiesResults`, one call in `runAfterActionHooks`),
`resolve.ts` (the `sequenceTargets` branch, 5 lines), `resolve-strike.ts` (two `noteResult` calls), `intent.ts` (`countersFor` lists two counters, 8 lines). No contract file (`docs/CONTRACTS.md`) changed, so no `CONTRACT-CHANGES` entry.

## 2. The rows (research section 8)

"Built" means a decision table of the script with its rolls and a test that walks it (section 4). "Record" means W3's command or monster record already carries the game's
row and this lane pins it. "Held" means the row waits and says why. Row ids are the note's.

| Row | Now | Test |
|---|---|---|
| O1 Concussive Blast | **Built.** Act III only: `HP < max / 4` in integers (335 or less of 1,344) and `random() % 4 = 0`; the Blast ends the poll. Acts I and II have no such branch and their ability lists no longer carry the move | leblanc: "Acts I and II have no Concussive Blast...", "the quarter line is integer" |
| O2 Huggles target | **Built.** The girl with the highest current MP (Acts I and II) or HP (Act III), the pair of searches, ties drawn | leblanc: "Huggles goes to the girl with the highest MP..." |
| O3 Supercollider target | **Held (owner decision).** The farthest girl is the highest formation slot (D-018/q3); the engine has no positions and Ormi's rooms ship no position file | leblanc: the cycle test pins the stand-in |
| O4 Ormi's Attack target | **Held.** The game weights by closeness and facing (positions); a uniform pick, as before | |
| O5 Ormi's counter | **Built.** An own counter that moves only on polls that reach it; a Blast poll does not advance it | leblanc: "the Blast roll costs the cycle nothing" |
| O6 Ormi's alone test | **Built** by room: Act I Fem-Goon or Dr. Goon, Act II Logos, Act III Leblanc or Logos; alone, `% 4`: 0 Huggles, 1 Supercollider, 2 or 3 Attack (exact 16,384 / 16,384 / 32,768 over the 65,536 values) | leblanc: "either ally keeps the cycle going", "alone, the 65,536 values..." |
| O7 Death | **Held (presentation, owner decision D-035 "Yields").** Acts I and II flee instead of lying down; Act III's HP-to-1 hook belongs to the No Love Lost window (L6) | |
| L1 Leblanc's cycle | **Built.** The trio counter (starts 5) gains 1 a poll; at 8 or more with Ormi and Logos alive she uses No Love Lost; the poll after it, still at 8 or more with the flag set, issues nothing and zeroes the counter. No Love Lost comes on commands 3, 11, 19, 27 ... and **never takes a step of the five-step cycle** (Attack, spell or Osmose, Love Tap or White Wind, Attack, Mach Fan or a grenade). With Ormi or Logos dead the counter stays at 8 and it never returns | boss: "walks the note's command order", "with Ormi or Logos down..." |
| L2 Not-So-Mighty Guard | **Built.** On the first command and on the poll where the Guard counter reaches 25 (command 29 with four No Love Losts before it, command 25 with a henchman down), never else; command 5 is not a second Guard. `Ffx2EngineOptions.leblancScriptSinirothX` (PR-0106, D-242) is no longer read: its OFF reading was the wiki's | boss: "Not-So-Mighty Guard is cast on...", `iter2-b1-switches` |
| L3 Leblanc's Attack target | **Held** (positions); uniform | |
| L4, L5 spell, Osmose, Love Tap, White Wind | **Built.** Osmose below 15 MP, else `% 4` Fira, Thundara, Blizzara, Watera; a coin picks Ormi or Logos, alive: Love Tap on it, dead: White Wind on all monsters | boss: "the cycle in detail", "Osmose below 15", "a coin picks" |
| L6 the No Love Lost window | **Partly.** The clean-up poll is folded into the next poll (one call, one command). Invincibility of Ormi and Logos, Leblanc's Agility 254 and the HP-to-1 death hooks are **not built**: the engine's actions are instant, so the window would be either zero length or the engine's whole recovery, and the animation length belongs to W4 (note section 7 tags it [L]) | |
| L7 No Love Lost numbers | **Record** (W3): three parts, formula 1, 5 x 8 hits, 22, then 6/16 of current HP | boss: "No Love Lost is one action of three parts" |
| L8 row differences | **Record** (W3): Fira power 12, Osmose class MP, Mach Fan formula 0 power 24 | boss: "Fira and its kin are power 12..." |
| G1 Logos' scripts | **Built.** Act II: three 1H Pistols then Russian Roulette (no Hail of Bullets); Act III: five turns of `% 4 = 0` Hail of Bullets (25%) else Pistol, then Roulette. The Hail takes exactly 16,384 of the 65,536 values on each of the five turns | leblanc: the Logos block |
| G2 Roulette rows | **Record** (W3): five rows, 1 in 5 each, Death 30, Curse 100, Silence 100, Petrify 30, Poison 100, no Eject. The row is the engine's one draw (`pickOne`) in place of the script's `% 5`, same odds, same order | leblanc: "Russian Roulette is the engine's one pick..." |
| G3 Logos' rows | **Record** (W3) | |
| K1, K2 the goons | **Built.** Dr. Goon: Attack every poll. Fem-Goon: `% 4 = 0` Attack on an unpetrified girl; MP under 13 an Attack; all three girls below half their maximum HP (a fallen girl counts, integer `max / 2`) one single-target spell on the lowest-HP girl; else `% 2` one single-target spell or one party-wide base spell. Overall 25 / 37.5 / 37.5. **Level, HP, MP and every stat byte are the game's rows** (Dr. Goon Lv 14, Def 6; Fem-Goon Lv 16, 270 MP, Def 5) | leblanc: the goon block, "the records are the game's rows" |
| R1 Acts I and II records | **Built.** Ormi Act I Str 80, Mag 20, Agi 63, MP 40; Act II Str 64, Mag 24, Agi 63, MP 42; Logos Act II Str 16, Mag 26, MDef 14, Agi 90, MP 64. All eight Syndicate enemies equal `monster_rows.json` on every stat | boss: "level, HP, MP and every stat byte..." |
| R2 Accuracy | **Record** (W3): ACC 95 on every actor | boss: the same test (`acc`) |
| D1 Baralai's low-HP move | **Built.** Below a third each poll rolls `% 4 = 0`: queue Regen, Absorb on the highest-MP girl below 60 MP, or Not-So-Mighty Guard only if he has Reflect (nothing gives it: the Guard is gone from his fight) | den: the low-HP tests |
| D2 order inside the poll | **Built.** The HP move, then the Drill Shot or the cycle step; both are commands of the one poll | den: "the Drill Shot comes after the low-HP move" |
| D3 the counter | **Built.** +1 per result another character applies to him; his Regen tick does not count | den: the burst-counter tests, resolver block |
| D4 Drill Shot target | **Built.** The attacker of the latest result, a living girl (drawn) if that one is gone, himself after a Regen tick (which does nothing: he is immune to percentage formulas, proved on the engine) | den: "the Drill Shot goes to a living girl...", "a Drill Shot he aims at himself" |
| D5 Triple Attack | **Built.** Three Chain Attacks, strike 1 Yuna (else Paine, else Rikku), 2 Rikku (else Paine, else Yuna), 3 Paine (else Yuna, else Rikku); one girl left, a plain Attack. Never rolls, cannot crit (row 0x4100) | den: the target table, resolver block |
| D6 Looming Glacier | **Built.** The highest-MP girl not in Stop (ties drawn); all in Stop, the target is "nothing" and the engine picks (its nearest living girl needs positions) | den: "Looming Glacier" |
| D7 Absorb | **Record** (W3): HP and MP class, 3/16 of current HP and MP into him | den: resolver block |
| D8 one-third line | **Built.** `HP < max / 3` in integers: Gippal turns at 4,932, Baralai at 4,072 | den: both |
| D9 Gippal's low-HP Attack | **Built.** On the living girl with the lowest current HP (the pair; ties drawn) | den: "below a third", "the lowest-HP Attack draws..." |
| D10 targets | **Held** for Baralai's Attack and ties (positions); Gippal and Nooj were uniform | |
| D11 Nooj | Unchanged: the script and the earlier build agree | den: Nooj |
| D12 steal rates | **Record** (W3): 128 of 255, Pilfer Gil 300, 15,000, 20,000 | den: "the steal bytes..." |
| I1 what adds to AC | **Built.** +5 per result another character applies to him (a two-hit command that lands is 10, a miss 5); Recharge and the Hammer add nothing; hits between Recharge and the Hammer are lost with the reset | ixion: the reaction tests, resolver block |
| I2 cycle after the Hammer | **Built.** Rows 1 and 2 leave the cycle counter alone, so the cycle continues | ixion: "Recharge and the Hammer leave the cycle..." |
| I3 Attack to Thundara | **Built.** `% 4`: 16,384 Thundara and 49,152 Attack of 65,536. The wiki's 2 to 1 bench flag is deleted | ixion: the tally |
| I4 targets | **Held** (positions); uniform | |
| I5 action time | **W4** (section 5) | |

Rows of section 8 outside the lane's list and what became of them: H1 (which moves roll to hit) and E4 (damage-type bits) are W3's records, now pinned for these moves in the parity tests; H2 (Huggles' Delay twice
Supercollider's) and E1 to E3 (action time, per-move pace, thinking) wait for W4; E5 and the time-out blocks need nothing.

## 3. Owner-decision check (`DECISIONS.md`, `docs/target/decisions*.json`)

Read in the order the lane brief gives it: a row that contradicts a decision stays and is listed; a decision that rests on an estimate or an assumption and says so in its own words
yields to the script, listed with its one-place revert (Bailey's relayed answer to the AI-Seymour lane's reading, "Script wins", RC1 decision 11).

| Decision | What it said | What the engine does now | Revert |
|---|---|---|---|
| D-018/q3 | Ormi's Supercollider hits the highest slot | **Stays** (row O3, and the engine has no positions) | n/a |
| D-035 "Yields" | Leblanc, Logos and Ormi stay standing, dim and step back instead of dissolving | **Stays** (row O7, presentation) | n/a |
| D-242/pr-0106 | Leblanc's failsafe once, turn 5 a Fan Slap (SinirothX) | Agrees with the script; the switch is now dead | n/a |
| D-269 | Djose Ixion's 3 s action time ON | **Stays**, in W4's hands (section 5) | n/a |
| D-148/GP11 | Baralai's counter is +1 per party action that damages him, "labelled estimate" | **Yields:** per result, ticks excluded (D3, D4). Consequence: the intended line kills him in about six big hits, so the counter rarely reaches 8 against it | `onResults` and `onRegen` in `ai/den-of-woe.ts` |
| D-105 / FA8 a, Ixion's Q4 | AC +5 once per party action aimed at him, hit or miss, a `[conflict]` between wiki readings | **Yields:** per result (I1) | `onResults` in `ai/ixion.ts` |
| IX-12 (plan) | After Thor's Hammer the cycle restarts at step 1, "our estimate" | **Yields:** it continues (I2) | `ai/ixion.ts`, rows 1 and 2 |
| F-8 (3/4 : 1/4 default, the wiki 2/3 : 1/3 behind a flag) | | Agrees; the wiki branch is deleted | n/a |
| D-410 / D-191 | The Den's difficulty is the intended one (about 1 in 6 first try, 3 in 4 within five); nothing tuned | **Nothing is tuned**; the script's rules moved the chapter's rate by -4.6 points (section 8): reported, not corrected | |
| D-018/q5 | The boss ships at full canonical strength | The Syndicate's stats are now the game's own rows | |

No other row contradicts a recorded decision.

## 4. Proofs and tests

* `tests/unit/parity-ffx2-ai-leblanc.test.ts` (22 tests: Ormi in three rooms, Logos in two, both goons), `parity-ffx2-ai-leblanc-boss.test.ts` (15: Leblanc, the records, the rows W3 answers),
  `parity-ffx2-ai-den.test.ts` (29: Gippal, Baralai, Nooj, then the real resolver), `parity-ffx2-ai-ixion.test.ts` (11), with `tests/unit/helpers/ffx2ScriptRig.ts` (a scripted `Rng` that returns
  queued 16-bit values and records the range of every draw, so a test feeds a script exactly what its `random() % n` needs and checks how many draws a poll made). 77 tests in the four files.
* **`tests/unit/parity-ffx2-ai-intent.test.ts` (5 tests, new):** the enemy-intent panel dry-runs these scripts on a clone every time a menu opens, and the scripts move AI memory and spend draws at decision
  time, so each chapter's whole chain is played twice on seeds 1 to 3, asking the panel at every player decision the first time and never the second: every event log, the flags after each link and every
  enemy's AI counters are identical byte for byte (the panel was asked 20+ times and answered more than half). A clone that shares the live combatants is caught. `ffx2/intent.ts#countersFor` now lists
  Baralai's and Ixion's counters as per result (two tests). The preview itself follows the new scripts because it dry-runs `decide` on a clone (and `simulate.ts` runs the real resolver, so the Triple Attack's
  three strikes are in its estimate).
* **Interpreter tallies reproduced** (the note's walks and exact residue counts): Leblanc's command order `MG A N - S L A M A S L N - ...` for 60 commands on four seeds (No Love Lost on commands 3, 11,
  19, 27, 35, 43, 51, 59; the Guard on 1 and 29, and on 1 and 25 with a henchman down); Ixion's timeline with no hits (AC 20, 40, 60, 80, 100 after polls 3, 6, 9, 12, 15; Recharge on the 16th poll, the Hammer
  on the 17th) and the closed form `AC = 5n + 5 floor(n / 3) + 5r`; the exact residues of `random() % 5` over 65,536 values (13,108 / 13,107 / 13,107 / 13,107 / 13,107: Leblanc's grenade step
  13,108 Flash Bomb, 13,107 Hush Grenade, 39,321 Mach Fan), of `% 4` for Ormi alone (16,384 / 16,384 / 32,768), Logos' Hail (16,384 of 65,536 on each of five turns) and Ixion's Thundara (16,384 of 65,536);
  Fem-Goon's overall 25 / 37.5 / 37.5 over the 32 residue combinations; Gippal's chances 3 of 15 each and 1 of 15 each over the 15 combinations of `% 5` and `% 3`.
* **Engine-level:** the resolver counts results exactly as the game does (landing strikes + misses = the tally, over 24 seeds of a two-hit command that both lands and misses); his own Regen and a
  stopped monster count nothing; the Triple Attack lands one strike on each named girl in order and nothing on a girl not named; Absorb takes exactly 3/16 of both HP and MP; a Drill Shot at himself does nothing.
* **Old tests moved to the script**, each with its reason in a comment: `leblanc-engine` (command 5 is not a Guard; the second Guard is command 29), `den-of-woe-ai` (the integer thirds, the counter, the
  low-HP move), `den-of-woe-engine` (the Triple Attack never rolls), `den-of-woe-ship-story` (the count-seven callout is met by a line that hits him often, not by the intended line), `ixion-engine`
  (per result, the cycle after the Hammer, no wiki split), `iter2-b1-switches` (the OFF reading is gone), `data-ffx2-command-records`, `data-ffx2-monster-records` (two named exceptions deleted, the
  first-room Concussive Shock override deleted) and their two fixtures (`ability_differences.json` loses Baralai's Triple Attack line, `monster_differences.json` loses the five Chapter VI rows),
  `strategy-ffx2-leblanc` (careless mashing at D = 0 wins 1 of 12, was 9 of 12), `advisor-v3-final` (the Leblanc board is found on seed 4, was 74).
* **Mutation check** of the decision tables: 37 one-line mutants of the decision tables and the engine pieces, a scratch driver outside the repo (`D:\Tools\ffx-parity\ai-ffx2-c\mutate.py`: one change at a time, the file restored from a byte copy after each, the four parity files run against each). **35 were caught on the first run; 2 survived, the tests were strengthened, and both are caught now (37 of 37).** The survivors: Fem-Goon's "below half" made inclusive (the old test compared only the spell, which is the same on both sides of the line; it now compares the target) and Baralai's low-HP roll `% 4` made `% 5` (no test used a value where the two residues differ; the new one tries 4 and 5 and counts exactly 16,384 of the 65,536 values). The mutants:

* Ormi: the quarter line as a third; the cycle's three Attacks as two; the Blast roll 1 in 3; Act III's Huggles by MP instead of HP; the alone table's Huggles and Supercollider swapped; the Blast in Act I.
* Logos: Act II with two Pistols; the Hail 1 in 3; four Hail turns instead of five.
* Fem-Goon: the MP gate at 12; the party spells out of order; "below half" inclusive (the survivor).
* Leblanc: No Love Lost at 7; the clean-up poll zeroing to 0; the second Guard at 26; the Osmose gate at 14; the spells out of order; the Love Tap coin swapped; the grenade order swapped.
* Baralai: the third not floored; the Guard without the Reflect test; the Triple Attack's fall-back order; the Drill Shot taking a cycle step; his Regen tick counting; the Absorb gate at 70; the queued second command dropped; the low-HP roll `% 5` (the survivor).
* Gippal: the bomb 1 in 15; the Attack at the highest-HP girl.
* Ixion: the Hammer resetting the cycle; a result worth 4; Recharge above 100 instead of at 100; Thundara 1 in 3.
* Engine: the tally counting a monster's own results; misses not counted; sequence targets off by one; the tally not emptied after the report.
* The enemy-intent panel: a clone that shares the live combatants is caught by `parity-ffx2-ai-intent.test.ts` (all three chains).
* `tsc --noEmit` clean; `node tools/orphans.mjs` lists none of the new modules; every new or changed source file is under 400 lines (`syndicate-ormi.ts` 99, `syndicate-logos.ts` 108,
  `leblanc-syndicate.ts` 131, `den-of-woe.ts` 253, `ixion.ts` 81, `script-rolls.ts` 70, `results-tally.ts` 59).
* **The whole suite, once, on the final code tree** (`--maxWorkers=4`, 1,666 s on a PC shared with a dozen other lanes; log `D:\Tools\ffx-parity\ai-ffx2-c\final\full-suite.log`; run at `3ea947d0`, after the last change to any source or test file but one): 1,015 files, 15,145 tests passed, 193 failures in 27 files (188 tests and 5 files that could not load). Every one is accounted for:

| Kind | Count | Which | Why it is not this lane's |
|---|---|---|---|
| Art-only (`public/art` is gitignored, so a worktree has none) | 186 | `ui-portrait-face-crop` (145), `chapter-meta`, `party-face-manifest`, `chapters-6-7-8-enemy-sprite-manifest`, `leblanc-party-sprites`, `yojimbo-content` (five files that fail to load on `public/art/manifest.json`), `art-ref-defaults` (4), `chapter-meta-evrae` (3), `chapter-meta-ffx2-leblanc` (2), `chapter-meta-seymour-anima-macalania` (3), `cutscene-story-poses`, `pause-remake` (3), `den-of-woe-ship-content` (3), `den-of-woe-ship-scene`, `fallen-aeons-ship-content` (2), `fallen-aeons-ship-scene`, `isaaru-ship` (3), `leblanc-art` (2), `natus-ship-content` (2), `natus-ship-scene` (2), `trema-ship-content` (4) | each error is a missing file under `public/art` (ENOENT, "has no installed idle.png", "expected false to be true" on an art-exists check); none reads a script |
| 15 s timeouts on the loaded PC | 6 | `art-derive`, `art-exact`, `exp-art-sync`, `ui-pause-stack` (2), `sin-fins-core-bench` | rerun alone with a 180 s timeout: all five files pass (61 passed, 2 skipped) |
| **A real pin this lane moved** | 1 | `ui-ffx2-battle-message` > "shows Pilfer Gil's amount from the real engine (Leblanc...)": expected 1,267, got 1,350 | the same seed's Pilfer Gil draw lands elsewhere once the Syndicate's scripts spend a different number of draws; **fixed in `83c10d7c`** with the reason in the comment; the 750 to 1,500 range check, the real rule, is unchanged. The file passes (15 tests) |

After the fix, the lane's five parity files plus the battle-message test were run again (`--maxWorkers=4`): four parity files passed (67 tests: Syndicate 22, Den of Woe 29, Ixion 11, intent panel 5); the other two (`ui-ffx2-battle-message`, `parity-ffx2-ai-leblanc-boss`) did not get a worker on the overloaded PC ("Failed to start forks worker"), were run again alone and passed (30 tests: 15 and 15). **82 tests in the five parity files** (22 + 15 + 29 + 11 + 5). `ffx-engine-golden`, `ff7-golden`, `ffx2-atb-golden`, the Chapter XI, Sisters and Chapter V rows of `den-of-woe-carry` and every FFX or FF7 test passed unchanged in the full run.

## 5. Timer rows for the W4 merge

Script timers are AI polls = logic steps at 29.97 a second (seconds = polls x 0.033367). **None of these scripts keeps a step-based timer of its own**: every counter is in polls that issue a command
(or, for Baralai and Ixion, in results), so the move to the game's clock changes no decision. What W4 owns, with the value in polls and in seconds:

| Row | Where it lives now | Value | Polls | Seconds |
|---|---|---|---|---|
| Ixion's action time (D-269, E1) | `DJOSE_ACTION_TIME_SECONDS` on his own gauge (`ixion-djose.ts`) | 3 s | 90 | 3.00 |
| Leblanc's clean-up poll (L6) | folded into the next call (`leblanc-syndicate.ts`) | 1 poll | 1 | 0.03 |
| Baralai's second command and the Triple Attack's three (D1, D5) | the second waits in `MEM.queued` and returns at the next poll (a full gauge refill on this base); the three Chain Attacks are one instant action | rest 0, charge 0 each in the game | 0 | 0 |
| Per-move charge and rest (E2), thinking (E3), first polls, Delay size (H2) | tier estimates in `constants.ts` and the abilities' `chargeTicks`; thinking 0 | the table below | | |

The cadence the note computed (units at AGI, steps rounded up, 95 units a step at Normal speed; thinking +30 polls for every girl dead or petrified):

| Actor (AGI) | Move | Charge: units (polls) = seconds | Rest: units (polls) = seconds |
|---|---|---|---|
| Ixion (AGI 138) | Attack | 0 = 0 s | 7,194 (76) = 2.54 s |
| Ixion | Thundara | 5,035 (53) = 1.77 s | 0 = 0 s |
| Ixion | Aerospark | 7,194 (76) = 2.54 s | 5,755 (61) = 2.04 s |
| Ixion | Recharge, Thor's Hammer | 8,633 (91) = 3.04 s | 7,194 (76) = 2.54 s |
| Baralai (112) | Attack | 0 = 0 s | 8,849 (94) = 3.14 s |
| Baralai | Glint | 17,699 (187) = 6.24 s | 0 = 0 s |
| Baralai | Chain Attack (each of three) | 0 = 0 s | 0 = 0 s |
| Baralai | Looming Glacier | 12,389 (131) = 4.37 s | 0 = 0 s |
| Baralai | Silence | 5,309 (56) = 1.87 s | 5,309 (56) = 1.87 s |
| Baralai | Absorb | 8,849 (94) = 3.14 s | 3,539 (38) = 1.27 s |
| Baralai | Regen | 5,309 (56) = 1.87 s | 0 = 0 s |
| Baralai | Not-So-Mighty Guard | 10,619 (112) = 3.74 s | 7,079 (75) = 2.50 s |
| Baralai | Drill Shot | 8,849 (94) = 3.14 s | 0 = 0 s |
| Gippal (118) | Attack | 0 = 0 s | 8,403 (89) = 2.97 s |
| Gippal | Grinder, Bullseye, Mortar | 10,084 (107) = 3.57 s | 0 = 0 s |
| Gippal | Flash Bomb, Hush Grenade | 6,722 (71) = 2.37 s | 0 = 0 s |
| Gippal | Potion Plus | 8,403 (89) = 2.97 s | 0 = 0 s |
| Nooj (121) | Attack | 0 = 0 s | 8,196 (87) = 2.90 s |
| Nooj | Rippling Chroma, Greedy Aura | 9,836 (104) = 3.47 s | 0 = 0 s |
| Nooj | Lightfall | 13,114 (139) = 4.64 s | 0 = 0 s |
| Ormi Acts I, II (63) | Attack | 0 = 0 s | 15,625 (165) = 5.51 s |
| Ormi I, II | Supercollider | 28,125 (297) = 9.91 s | 0 = 0 s |
| Ormi I, II | Huggles | 9,375 (99) = 3.30 s | 15,625 (165) = 5.51 s |
| Ormi Act III (42) | Attack | 0 = 0 s | 23,255 (245) = 8.17 s |
| Ormi III | Supercollider | 41,860 (441) = 14.71 s | 0 = 0 s |
| Ormi III | Huggles | 13,953 (147) = 4.90 s | 23,255 (245) = 8.17 s |
| Ormi III | Concussive Blast | 18,604 (196) = 6.54 s | 0 = 0 s |
| Logos Act II (90) | 1H Pistol | 0 = 0 s | 4,395 (47) = 1.57 s |
| Logos II | Russian Roulette | 10,989 (116) = 3.87 s | 16,483 (174) = 5.81 s |
| Logos Act III (49) | 1H Pistol | 0 = 0 s | 8,000 (85) = 2.84 s |
| Logos III | Hail of Bullets | 24,000 (253) = 8.44 s | 0 = 0 s |
| Logos III | Russian Roulette | 20,000 (211) = 7.04 s | 30,000 (316) = 10.54 s |
| Leblanc (53) | Attack, Love Tap | 0 = 0 s | 18,518 (195) = 6.51 s |
| Leblanc | Fira, Thundara, Blizzara, Watera | 12,962 (137) = 4.57 s | 0 = 0 s |
| Leblanc | Osmose | 16,666 (176) = 5.87 s | 0 = 0 s |
| Leblanc | Not-So-Mighty Guard, White Wind | 22,222 (234) = 7.81 s | 14,814 (156) = 5.21 s |
| Leblanc | Mach Fan | 25,925 (273) = 9.11 s | 0 = 0 s |
| Leblanc | Flash Bomb, Hush Grenade | 14,814 (156) = 5.21 s | 0 = 0 s |
| Leblanc | No Love Lost (each of three) | 0 = 0 s | 0 = 0 s |
| Dr. Goon (56) | Attack | 0 = 0 s | 17,543 (185) = 6.17 s |
| Fem-Goon (62) | Attack | 0 = 0 s | 15,873 (168) = 5.61 s |
| Fem-Goon | any of the eight spells | 11,111 (117) = 3.90 s | 0 = 0 s |

The first gauge is 25% to 74% of `70 x 10000 / (AGI + 1)` units: Ixion 14 to 40 polls (0.47 to 1.33 s), Baralai 17 to 49, Gippal 16 to 46, Nooj 16 to 45, Ormi 29 to 86 (Acts I, II) or 43 to 128 (Act III),
Logos 21 to 61 (Act II) or 37 to 110 (Act III), Leblanc 35 to 102, Dr. Goon 33 to 96, Fem-Goon 30 to 87.

For the merge: `decide` still returns one command (or `null` for no command), never a batch; if W4 runs the queue of records without a gap it should read `MEM.queued` after Baralai's first command
and treat it as the second record. The shared files this lane touched are not in W4's list (`engine.ts`, `engine-core.ts`, `active.ts`, `gauges.ts`, `execute.ts`, `paragon-oversoul.ts`).

## 6. The experimental Leblanc chapter ("leblanc")

It plays Chapter VI's encounter by reference (`chapter-exp-leblanc.ts`: the same groups, builds, scripts and Sensor lines), so every change above applies to it unchanged: the Syndicate's scripts, the Acts I and II
stat rows, the ability lists, the 65,536-value tallies. Nothing in the experiment's own files changed. Its fight is exactly Chapter VI's measurement (section 8).

## 7. Goldens ("game-script parity")

| Golden | Moved | Why |
|---|---|---|
| `ffx2-atb-golden` | none | Chapters IV and V only |
| `ffx2-hit-closes-menu` (D = 0 Wait split) | Chapter VI, 3 hashes | Acts I to III follow the scripts; Acts I and II carry the game's stat rows |
| `ffx2-menu-cancel-delay` | Chapter VI, 12 hashes (6 release-17 arm, 6 default arm) | the same |
| `chapters/den-of-woe-carry` | Chapter 6, 8 hashes | the same; Chapters 5 and XI and the Sisters did not move |
| `advisor-v3-final` | the Leblanc board is found on seed 4 (was 74) | the same board, found again by running the engine |
| `ui-ffx2-battle-message` (a pin, not a golden) | Pilfer Gil from the real engine: 1,267 to 1,350 (`83c10d7c`) | found by the one full-suite run; the same seed's draw lands elsewhere once Ormi, Logos and Leblanc spend a different number of draws before Rikku's turn; the 750 to 1,500 range check is the rule and did not move |
| `ffx-engine-golden`, `ff7-golden` | none | FFX-2 only |

Each Chapter VI hash moved first at the opening gauge snapshot (the new Agility of Ormi, Logos and the goons changes their bar lengths). **With the old scripts and the old stat rows put back
in the new engine, the eight Chapter 6 hashes are exactly the old ones** (a scratch run, `ad3e5b13a4b416a2` ... `4a90f06e891eda74`), so the results tally, the hook and the sequence targets move nothing
by themselves, and the whole movement is the rows.

## 8. Measurement (the shipped `intendedStrategy`, whole chain, seeds 1 to 500)

`tests/unit/ffx2-parity-measure.test.ts`, before = the untouched tree at `931613a8` (run first, in this worktree), after = this branch.

The shipped `intendedStrategy` plays each chapter's whole chain through the app's own path (the real party build, every link, minigames auto-resolved). "Before" is the untouched tree at `931613a8`, run first in this worktree; "after" is this branch's final tree (re-run after the last commit; the 500-seed rows are byte-identical to the first after-run). Nothing was tuned. Game time is the engine's clock (the 3,000-ticks-a-second clock until W4), so the minutes column moves only with the fights' length.

**Seeds 1 to 12**

| Chapter | Wins before -> after | Party turns | Party KOs | Minutes | Engine turns |
|---|---|---|---|---|---|
| VI Leblanc Syndicate (3 acts) | 12 -> 12 | 63.8 -> 62.9 | 0.4 -> 1.0 | 1.9 -> 1.8 | 97.6 -> 99.0 |
| XV Den of Woe (3 shades) | 6 -> 5 | 30.6 -> 30.8 | 2.8 -> 2.8 | 1.4 -> 1.5 | 65.5 -> 67.6 |
| XVI Ixion at Djose | 12 -> 12 | 26.7 -> 26.8 | 0 -> 0 | 1.5 -> 1.5 | 43.7 -> 44.3 |

No chapter moved by 2 of 12 (the plan's flag).

**Seeds 1 to 500**

| Chapter | Wins before -> after | Paired (loss -> win / win -> loss) | Party turns | Party KOs | Minutes | Engine turns |
|---|---|---|---|---|---|---|
| VI | 491 -> 499 (98.2% -> 99.8%, 2.5 sd) | 9 / 1 | 57.2 -> 64.1 | 0.6 -> 1.4 | 1.6 -> 1.9 | 83.5 -> 100.5 |
| XV | 234 -> 211 (46.8% -> 42.2%, -1.5 sd) | 98 / 121 | 31.1 -> 30.3 | 2.5 -> 2.7 | 1.4 -> 1.4 | 66.2 -> 64.6 |
| XVI | 500 -> 500 | 0 / 0 | 26.5 -> 26.5 | 0 -> 0 | 1.5 -> 1.5 | 43.1 -> 43.2 |

The first link of every chain (Act I, the first shade, Ixion) is won on 500 of 500 seeds before and after, so every loss is in a later act or shade. The Den's paired churn (219 of 500 seeds change their result) is the draw order shifting under any change to what a script draws, not a cause: its net move is the number to read.

**What moved each chapter (ablation: one row put back into the new tree, same seeds; the arms are in `D:\Tools\ffx-parity\ai-ffx2-c\abl\` and `den2000\`)**

*Chapter VI, 500 seeds.* The wins mover is one row, **O1, Ormi's Concussive Blast**. The old script cast it on every poll below a quarter of his HP in all three rooms; the game rolls it 1 poll in 4 and only in Act III. Putting the old rule back alone costs 48 wins. The fight is longer and costs more KOs because of **R1, the Acts I and II stat rows**, and within them Agility alone (Ormi 63 and Logos 90 where the earlier build borrowed 42 and 49 from Act III).

| Arm (what is put back) | Wins of 500 | Party turns | Party KOs |
|---|---|---|---|
| before (`931613a8`) | 491 | 57.2 | 0.6 |
| everything back (old scripts and old stat rows) | 491 | 57.3 | 0.6 |
| **after (this branch)** | **499** | **64.1** | **1.4** |
| O1 alone, the old Blast rule | **451** | 64.5 | 2.1 |
| all of Ormi's old script (O1, O2, O5, O6) | 449 | 65.2 | 2.1 |
| O2 alone, Huggles at a uniform girl | 499 | 64.1 | 1.3 |
| Logos' old scripts (G1) | 498 | 64.1 | 1.2 |
| Leblanc's old script (L1, L2) | 500 | 63.3 | 1.3 |
| the goons' old scripts (K1, K2) | 499 | 64.2 | 1.3 |
| R1, the Acts I and II stat rows, all back | 500 | **57.2** | **0.5** |
| R1, Agility only back | 500 | **57.3** | **0.5** |
| R1, Strength, Magic and MDef only back | 499 | 62.5 | 1.2 |
| K1 and K2, the goons' stat rows back | 499 | 64.3 | 1.4 |

*Chapter XV, seeds 1 to 500 and 501 to 2,500.* Nothing moved by a clear margin on 500 seeds (1.5 sd), so the arms were also run on seeds 501 to 2,500. The mover is **Gippal's rows, and within them D9, the Attack below a third of his HP going to the girl with the lowest current HP** where the earlier build picked a uniform girl: a lowest-HP girl dies more often. Baralai's rows (D1 to D6, including the counter per result and the Drill Shot) move nothing measurable. The pooled difference is about 2 points.

| Arm | Seeds 1-500 | Seeds 501-2,500 | Pooled 2,500 | Against after |
|---|---|---|---|---|
| after (this branch) | 211 | 861 | 1,072 (42.9%) | |
| Baralai's old script back (D1 to D6) | 207 | 845 | 1,052 (42.1%) | -0.8 points, 0.6 sd |
| **D9 alone back (Attack at a uniform girl)** | 220 | 903 | 1,123 (44.9%) | +2.0 points, 1.5 sd |
| **Gippal's old script back (D8, D9)** | 226 | 911 | 1,137 (45.5%) | +2.6 points, 1.9 sd |
| both old scripts back | 227 | 899 | 1,126 (45.0%) | +2.2 points, 1.5 sd |
| Triple Attack aimed by the engine's pick (D5's targets) | 211 | not run | | none |
| before (`931613a8`) | 234 | not run | | |

Baralai's Not-So-Mighty Guard (52 uses over the 500 seeds before) is gone: it needs Reflect, which nothing gives him. Party turns (30.3 to 31.2), KOs (2.5 to 2.8) and minutes (1.4) are close across every arm.

*Chapter XVI.* No mover: 500 of 500 before and after, 26.5 party turns, no KOs. With the old Ixion script put back in the new tree the result is the same, so the three Ixion rows (AC per result, the cycle after the Hammer, 3 to 1) change no outcome on this line. What changed in play: Thundara is 1,314 of 5,058 attack-or-Thundara moves before and 1,238 of 5,055 after (26.0% to 24.5%, the script's 25%); Recharge and Thor's Hammer come as often (506 and 502 before, 505 and 503 after over 500 seeds).

**Per-ability usage over the 500 seeds** (`before-500-usage.json`, `after-500-usage.json`; the abilities that moved)

| Ability | Uses before -> after | Why |
|---|---|---|
| Ormi's Concussive Blast | 950 -> 96 | O1 |
| Ormi's Huggles / Supercollider / Attack (Shield Bash) | 165 / 634 / 3,569 -> 740 / 1,504 / 6,185 | O5, O6 (his counter and alone test per room) and longer fights (R1) |
| Logos' Pistol / Hail / Roulette | 1,685 / 116 / 119 -> 2,835 / 269 / 388 | G1 and Agility 90 in Act II, 49 in Act III (more turns) |
| Leblanc's Love Tap / Mach Fan | 438 / 451 -> 397 / 398 | L1 (No Love Lost no longer takes a cycle step) |
| Fem-Goon's eight spells | 271 -> 347 | K2 and her 270 MP |
| Baralai's Not-So-Mighty Guard / Regen | 52 / 244 -> 0 / 277 | D1 (the Guard needs Reflect) |
| Baralai's Triple Attack, average damage per strike | 153.3 -> 135.5 | D5 (three one-strike Chain Attacks; each strike is counted and averaged on its own) |
| Gippal's Potion Plus / Attack average | 147 / 235.8 -> 113 / 254.9 | D9 (the lowest-HP girl takes the Attack) |
| Ixion's Thundara | 1,314 -> 1,238 | I3 |

## 9. Stale strategy-guide text and comments (listed, not rewritten: player-visible text needs Bailey's yes)

Player-visible text that no longer matches the scripts (nothing here was edited; each needs Bailey's yes). The first four are the guide and chapter blurbs, the rest is code and comments.

| Where | Says | The script now |
|---|---|---|
| `src/data/guides/ffx2-leblanc.ts`, rule 4 ("Bank a heal before Ormi crosses a quarter of his max HP") and the Cure / Cura / Vigor / Hi-Potion / Potion hint ("Top up before Ormi drops under a quarter HP") | Concussive Blast follows once Ormi is under a quarter, in any room | Only **Act III** has the Blast, and it is rolled 1 poll in 4 below the quarter line (335 HP or less of 1,344). Acts I and II Ormi never cast it (O1). Both lines should name Act III and say "can" |
| `src/data/guides/ffx2-leblanc.ts`, rule 5 ("Nothing in the bag cures Eject. Russian Roulette rolls exactly one of Death, Petrify, Eject or three lesser statuses"), the Soft hint ("Eject on the same roll has no cure at all") and the Act II phase note ("Death, Petrify or Eject on a random target") | Eject is one of the Roulette's outcomes | The five rows are Death 30, Curse 100, Silence 100, Petrify 30, Poison 100, one in five each. **There is no Eject row** (G2; W3's command records already say so). Killing Logos first is still right |
| `src/data/guides/ffx2-den-of-woe.ts`, phase "BARALAI, BELOW A THIRD" ("He may Regen or raise his own guard now") | Regen or Not-So-Mighty Guard | The Guard is cast only if he has Reflect and nothing gives it to him, so it never comes. Under a third, one poll in four, he adds Regen, or Absorb on the girl with the most MP when he is under 60 MP, **beside** his normal move (D1, D2) |
| `src/data/guides/ffx2-den-of-woe.ts`, rule 3 ("Baralai counts every blow. At eight, the last girl to hit him loses three quarters of her max HP") and `src/data/chapter-meta-den-of-woe.ts` line 63 (the same words) | A blow is a hit | It is a **result**: each landing strike counts (a two-hit move counts twice), a miss counts once, his own Regen tick counts nothing. The shot goes to whoever applied the latest result, and to himself, doing nothing, if a Regen tick came last (D3, D4) |
| `src/data/guides/ffx2-ixion-djose.ts` rule 2 and `src/data/chapter-meta-ixion-djose.ts` line 47 ("Every blow he takes fills a hidden count") | | True as written (a result is a landing strike, a miss or a no-effect hit, +5 each). No change needed; listed so nobody edits it by mistake |
| `src/engine/tactics/ffx2-leblanc.ts` (the advisor's "bank a heal for Concussive Blast" step, lines 60, 116 and 364, and its Eject notes, lines 37 and 159) | Banks a heal when Ormi is low in any room; counts Eject | In Acts I and II the banked heal is never needed (harmless); there is no Eject. Behaviour left as it is |
| `src/battle/ffx2/constants.ts` lines 49 to 56 (`LEBLANC_SCRIPT_SINIROTHX`), `setup.ts` line 337 and `internal.ts` line 207 (`Ffx2EngineOptions.leblancScriptSinirothX`) | "The engine sets `flags.leblancScriptSinirothX` for the AI" | The AI no longer reads it (L2: the failsafe is the script's own counter, so both readings of PR-0106 collapse into it). The switch is dead; it stays so `iter2-b1-bench.test.ts` and `ffx2-menu-cancel-delay.test.ts` still compile. Not touched here because `constants.ts` is where W4 keeps the tier estimates |
| `tests/unit/chapters/ixion-bench.test.ts` line 95 and `tests/unit/helpers/ixionDrive.ts` line 131 (`ixionThundaraSplit: 'wiki'`, `fallenAeonsAcTrigger`) | A "wiki 2:1" reading and an "AC on landed damage" reading | The wiki split is deleted (I3), so that bench arm now equals the default; Ixion no longer reads the AC-trigger switch (I1, per result). Fallen Aeons still does |
| `docs/handoff/chapter-ixion.md`, `combat-switches.md`, `iter2-b1.md`, `docs/plans/iter2-b1-review.md`; `research/ffx2-leblanc-syndicate.md` section 5, `research/ffx2-gippal-den-of-woe.md` GP11, `research/ffx2-ixion-djose.md` Q4 and IX-12 | The older readings | Superseded by `research/re-ffx2-ai-leblanc-den-ixion.md`; history, not rewritten |

## 10. Open items

* **Target rows that need positions stay uniform (O3, O4, L3, I4, D10).** The game's `searchr` weights a pick by closeness and facing, and "the farthest girl" needs distances; the engine has no positions and Ormi's rooms ship no position file. Supercollider keeps D-018/q3 (the highest formation slot); every other aimed pick is a uniform draw over the living girls (the pair-of-searches draw order is already the script's, `script-rolls.ts`). A position model is new gameplay: it needs Bailey's yes (hard rule 10).
* **Two presentation rows wait.** O7 (Ormi, Logos and the goons flee instead of lying down; D-035 "Yields" keeps them standing) and L6 (the No Love Lost window: Ormi and Logos invincible, Leblanc's Agility 254, the HP-to-1 death hooks) are not built; the window's length is the animation's, which is W4's, and the note tags it [L].
* **Timing is W4's** (section 5): Ixion's 3-second action time, per-move charge and rest (E2), thinking (E3), first polls, Delay (H2), and Baralai's second command and the Triple Attack's three (one batch in the game, one command a poll here).
* **The RNG batch** (Bailey said yes 2026-10-09): one engine stream stands in for the game's streams 2 and 4. The script expressions are exact (`random() % n` of a 16-bit draw; no draw under two candidates), so the batch only has to swap the source.
* **Inferred rows (C or L):** none built. The note's [L] and [M] items (Silence behind the Roulette's slot-3 row, a Drill Shot at himself doing nothing) are built as the note records them, and the second is proved on the engine (section 4).
* **The options benches and their recorded figures describe the old scripts** (`den-of-woe-options-bench`, `ixion-bench`, the human-pace figures behind D-191, D-269 and D-410: "39 of 200 first try" and "191 of 200"). They were not re-run (the lane's measurement is the shipped line, 12 and 500 seeds). If Bailey wants fresh human-pace figures for the Den and Ixion, those benches are the way.
* **Dead switches and stale comments** are listed in section 9; removing `leblancScriptSinirothX` and the two Ixion bench flags is a one-commit cleanup after W4 lands, to stay out of `constants.ts`.
* **Shared-file changes for the merge** (section 1): `internal.ts` (+8, `AiScript.onResults`), `engineHooks.ts` (+`notifyEnemiesResults` and one call), `resolve.ts` (the `sequenceTargets` branch), `resolve-strike.ts` (two `noteResult` lines), `intent.ts` (`countersFor`), new `results-tally.ts`. None is in W4's list (`engine.ts`, `engine-core.ts`, `active.ts`, `gauges.ts`, `execute.ts`, `paragon-oversoul.ts`); the AI modules and tests are the rest. `src/data/ffx2/**` changes are confined to the Syndicate, the Den's Triple Attack and two record lines.
* **AI lanes (a) and (b) are separate branches** (`re-parity-ai-ffx2-a`, `-b`); `src/battle/ffx2/ai/index.ts` and `fallen-aeons.ts` are theirs and were not touched (this lane uses `bumpAc` and `acOf` from `fallen-aeons.ts` as they are).

## 11. Decisions for Bailey

1. **The Den of Woe is harder on the intended line, and D-410 / D-191 say its difficulty is the intended one.** The shipped line wins 234 of 500 seeds on the old scripts and 211 on the game's (46.8% to 42.2%; on 2,500 seeds the new scripts win 42.9% against 45.0% with Gippal and Baralai put back, a difference of about 2 points, 1.5 sd). Nothing was tuned; the cause is one row of Gippal's, D9, his low-HP Attack going to the girl with the lowest HP (section 8). Recommendation: accept it, because the scripts are the game's own and "1:1" is the standing order. Alternative: leave it and ask for a measured boss-side options round (a boss number is never tuned on an agent's say-so).
2. **Chapter VI is easier to win and longer.** 491 to 499 of 500 on the intended line; the cause is one row, Ormi's Concussive Blast (the old script cast it on every poll below a quarter of his HP in all three rooms; the game rolls it 1 poll in 4, in Act III only). The chain is also longer (57.2 to 64.1 party turns, 1.6 to 1.9 game minutes) and costs 0.8 more KOs a seed, because the Acts I and II rows are now the game's: Agility alone does it (Ormi 63 where the earlier build had 42, Logos 90 where it had 49). D-018/q5 ("full canonical strength") is why this is reported, not corrected. Recommendation: accept.
3. **Three owner decisions yielded to the script** (the lane brief's rule for a decision that rests on an estimate and says so): Baralai's counter (D-148/GP11, "+1 per party action that damages him, labelled estimate" is now per result), Ixion's AC (D-105 / FA8 a, "once per party action aimed at him, hit or miss" is now per result), and the cycle after Thor's Hammer (IX-12, "restarts, our estimate" now continues). One-place reverts are in section 3. Please confirm all three, or name the ones to put back.
4. **Positions.** Five target rows (O3, O4, L3, I4, D10) need the game's closeness and facing. Build a coarse position model so "farthest" and "nearest" follow the game? It is new gameplay and needs a yes; today they are a slot or a uniform pick.
5. **Stale guide text** (section 9) in the Leblanc and Den guides and the Den's chapter blurb: rewrite now, or hold until W4's timing lands so the guide is edited once?
6. **The experimental Leblanc chapter ("leblanc")** plays Chapter VI's encounter by reference, so it moves with these scripts and is exactly Chapter VI's measurement. If the driver wants the experiment kept on the old scripts, that is a separate registry entry (not built).

## 12. Re-run

From the worktree root, tools by path, never `npx`:

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/parity-ffx2-ai-leblanc.test.ts tests/unit/parity-ffx2-ai-leblanc-boss.test.ts tests/unit/parity-ffx2-ai-den.test.ts tests/unit/parity-ffx2-ai-ixion.test.ts
node tools/orphans.mjs
```

The measurement (off unless `PYREFLY_MEASURE=1`; the three chapters, 12 and 500 seeds):

```
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=500 PYREFLY_MEASURE_CHAPTERS=ffx2-leblanc,ffx2-den-of-woe,ffx2-ixion-djose PYREFLY_MEASURE_OUT=after-500.json PYREFLY_MEASURE_USAGE=after-500-usage.json \
  node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/ffx2-parity-measure.test.ts
```

The before side is the same command on a tree at `931613a8`; the numbers produced for this note are kept at `D:\Tools\ffx-parity\ai-ffx2-c\` (`before-*.json`, `after-*.json`, `abl\*.json`). The ablation arms
put one row back in the new engine from a scratch copy of the harness (the old scripts are the `git show 931613a8:src/battle/ffx2/ai/<file>.ts` text with import paths changed; stats are set back by field).

## 13. For the release CHANGELOG (plain words)

Leblanc and her crew, the three shades in the Den of Woe, and Ixion at Djose now follow the game's own battle scripts instead of our reading of the guides (FFX-2 only). Leblanc: her Not-So-Mighty Guard goes up on her first turn and only again much later, No Love Lost comes on her 3rd, 11th, 19th turn and so on without ever taking the place of a move in her five-move cycle, and it never returns once Ormi or Logos is down. Ormi's Concussive Blast belongs to the last room only, and he casts it one turn in four once he is almost beaten, instead of every turn; in the first two rooms he does not have it. Ormi, Logos and the two goons now have the game's real speed and strength (Logos is a lot quicker in the second room), Logos fires pistols and, in the last room, a Hail of Bullets a quarter of the time, and Russian Roulette has five outcomes, each one in five. In the Den of Woe, Baralai counts every hit that lands on him (a two-hit move counts twice, a miss once) and at eight answers with a Drill Shot at whoever hit him last; under a third of his HP he sometimes adds a Regen or an Absorb to his usual move, his Triple Attack is three separate hits on three set girls, and Gippal aims his low-HP Attack at the girl with the least HP. Ixion's hidden count goes up by five for every hit or miss he takes, and after Thor's Hammer his Attack, Attack, Aerospark cycle carries on where it was. On our test line Chapter VI is easier to win (a bit longer) and the Den of Woe is a few points harder; Ixion is unchanged.
