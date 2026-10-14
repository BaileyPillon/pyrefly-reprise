# Paper preflight: Tourist Trap, a new hidden FFX-2 chapter (branch `ch-tourist-trap`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs` classes this work **DEEP** (`encounters.ts`, `chapter-meta.ts`, the chapters-experiments
registry and `ai/index.ts` are shared systems). Written 2026-10-14 ~01:05 EDT, before any code, by the sub-agent building the chapter overnight for the release driver.

**Authority (Bailey, 2026-10-13/14, verbatim, via the driver):** "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple."
and "full speed ahead while I sleep". The driver's decisions for this chapter: **hidden behind the typed word `daigoro`, hidden chapter number 23** (Fayth is 22), listing it on the board waits
for Bailey's word, the art is provisional and reuses approved paintings where they fit (never replace one), the Valefor chapter is another agent's, on its own branch.

**Game case: FFX-2 only.** The optional mission "Tourist Trap" is FFX-2 (ATB, dresspheres, the FFX-2 item and monster rows, an action-counter AI whose Zanmato is NOT FFX's:
`research/ffx-yojimbo.md` §0.3). No FFX file changes behaviour; the FFX Chapter IX (`yojimbo-cavern`, Lady Ginnem's Yojimbo) is a different fight with different rows and nothing of its data is reused
(its file headers say so). The shared plumbing (the chapter registry, one door row, one scene row) is "both" (CHK-020) and is additive: a build without the chapter behaves as before.

> **Update 2026-10-14 ~01:25 (the RE rows landed).** The RE parity session pushed `research/re-ffx2-yojimbo-valefor.md` (origin/re-ffx2-yojimbo-valefor 91ef1fd3): the game's own `monster.bin` rows, **Yojimbo = row 170, Daigoro = row 174** (formation 1847, slots 1 and 2). The data below is **re-pinned to them**
> (`src/data/ffx2/monster-records/records-tourist-trap.ts`, fixture `tests/fixtures/parity/ffx2/tourist_trap_rows.json`, `tests/unit/chapters/tourist-trap-engine.test.ts`). Every wiki number in the table equals the row. **Where the row disagrees with the research this plan was
> written on** (each also in the handoff, with its row): (1) the wiki's **Reflect** immunity is NOT in row 170 (group-2 Reflect byte 0): removed; (2) **Bribe** immunity is unproven either way: no flag, and the special word is wired as its proven bits only (0x43 of the row's 0x3c3); (3) **Daigoro** is a
> record of his own (Lv 30, HP 1, MP 1, 42 / 50 / 61 / 106 / 120 / 95 / 0 / 7, Curse only, no rewards, no ability list), not a placeholder; (4) **Yojimbo's own move list** (Kozuka, Wakizashi twice, Zanmato, Die) has **no Daigoro move** and the dog's list is empty: the strike stays the sourced
> table's (wiki and SinirothX: a weighted choice of Yojimbo's counter), run as Yojimbo's selection, until the two scripts (`m170`, `m174`) are decompiled; (5) **Accuracy 95 and Evasion 0** are now read, no longer estimates; (6) Gravity null is confirmed (element byte 0x10); (7) "Multi-attack" has no column. Daigoro stays
> untargetable on the FFX-2 wiki's word alone (`research/ffx-yojimbo.md` §8.2 and Y-10, **single source**: the row says nothing either way; my first draft wrote "verified: 2 sources" for that claim, which was wrong). Unmapped columns are not wired (the RE note's section 5).
> The AI is still the tagged wiki and SinirothX table: the scripts are not decompiled.

> **Update 2026-10-14 ~02:00 (the RE review of the game's scripts `m170` and `m174`, rows 170 / 174; "RE review 2026-10-14").** The review replaced the wiki-built AI of the first draft with the game's own poll, and this plan's
> mechanics (§2) and the readings (§1) are rewritten to it: (1) **BLOCKER fixed:** Daigoro is not a Yojimbo turn; a "dog" pick is a poll without a turn that raises a flag, and Daigoro is a separate actor who bites on his own turn
> when the flag is up (row 0x40a5); (2) the band is read on the **raised** counter, only the Zanmato test comes before the raise; (3) the roll-to-move order per band is the game's; (4) all five rows have accuracy formula 0:
> `canMiss: false` on all five (rule 5); (5) the five command rows are attached (costs, targets: Wakizashi B hits the whole party; Zanmato charges 120 and rests 200); (6) the monster rows are attached with the game's special
> word (0x3c3 for Yojimbo, 0 for Daigoro; Reflect byte 0); (7) Kozuka's Poison is status byte 100; (8) Daigoro is in the ATB snapshots with his real AGI 120; (9) the text says "the 14th poll" and "about seven attacks", never "the
> fourteenth turn". Kept on the review's own rule: the flat 3 s action-time add-on stays because the sibling aeon chapters carry it on top of their rows. Added to make the board honest: the intent dry run follows polls that
> are not turns and skips a sleeping part (additive, two lines each). The bite is aimed by a uniform pick (no start positions for formation 1847). The Meteor block adds no timer.

> **Update 2026-10-14 ~04:00 (RE re-review of 95152154; "RE re-review").** The additive engine pieces (`wakeIdleNow`, the dry run's re-polls) were found sound (determinism identical on seeds 1, 7 and 23; 7.58 real actions and
> 3.48 bites per cycle, inside the 3.4 to 4.5 range; ours measure 7.25 real actions exactly and 4.3 to 4.5 bites). What it asked for, all applied: (1) **Wakizashi B hits ONE girl, not the whole party** (`[strongly indicated]`:
> the script runs the same uniform one-girl search for B as for A and queues it on her; `setdircom` does not read the row's target flags; the target-mask dispatcher, emulated over 44,320 vectors with no mismatch, passes a
> "multiple" row's mask unchanged and never widens it; the only widening is the rebuild when the chosen girl is KO'd before the strike, which cannot happen here because a command with no charge strikes in the step it is
> chosen): B now takes `pickGirl` exactly as A does and is `single-enemy`; the record keeps its 0x17; `WAKIZASHI_B_HITS_ONE_GIRL` (`tourist-trap-abilities.ts`) is the one-line switch back; the guide line and the tests follow;
> (2) the action-time add-on is no longer called Bailey's pick for this chapter: **kept by precedent, awaiting his pick** (his picks were per chapter: D-151, D-187 / D-197, D-269); (3) the Cavern scene is PROVED to carry no
> positions (the compiled scene file is the generic empty one), so the uniform bite aim is final, not provisional; (4) disclosed: the engine polls Yojimbo before the dog within a step (the game's order is not established),
> and `src/battle/ffx2/intent.ts` is over 400 lines (756 before this branch, 771 now): pre-existing; (5) the shared `encounters.ts` change has its `docs/CONTRACT-CHANGES.md` entry (rule 2).

## 1. What the chapter is, and the data (rule 6: only what the research says)

Sources: `research/ffx-yojimbo.md` §8.2 (the wiki Cavern page, FFExodus Chapter 3, SinirothX's *Enemy Encyclopedia*), `research/ffx2-fallen-aeons.md` §7.2 (SinirothX confirms the counter and
every weight, so the old open item Y-8 is `[verified: 2 sources]`), and the formation row `Cavern of Stolen Fayth - BOSS 229 Yojimbo 1 Daigoro 1` (`research/ffx2-fallen-aeons.md` §0.3). **No `research/re-ffx2-*.md` note has a row for
Yojimbo or Daigoro** (grep, 2026-10-14). The RE session is reading the game's own rows (FFX-2 `monster.bin`) and will push `research/re-ffx2-yojimbo-valefor.md` (~01:45 EDT): **its numbers will
replace the wiki's for every field it proves**; this build starts on the wiki's and is re-pinned when it lands (the disagreements are listed in the handoff).

| Field | Value | Source / tag |
|---|---|---|
| Where, when | Cavern of the Stolen Fayth; optional mission, opens at the start of Chapter 3, finished in Chapter 3 or 5; tourists trapped, Yuna fights Yojimbo "possessed by Shuyin's despair" | wiki + FFExodus `[verified: 2 sources]` |
| Level / HP / MP | 36 / 22,000 / 9,999 | level: wiki `[single source]`; HP, MP: wiki + FFExodus `[verified: 2]` |
| STR / MAG / DEF / MDEF / AGI / LUCK | 44 / 61 / 50 / 106 / 120 / 7 | wiki `[single source]` |
| Evasion, Accuracy | Accuracy 95, Evasion 0 | **row 170 `[game rows]`** (read; first drafted as estimates) |
| Rewards | EXP 2,000, AP 15, Gil 1,500, Pilfer Gil 2,000; drop Recovery Bracer (common and rare); steal Power Wrist (common and rare), steal rate 128 | wiki + FFExodus `[verified: 2]`; steal rate wiki `[single source]` |
| Immune | Gravity, Silence, Sleep, Darkness, Poison, Confuse, Berserk, Curse, Petrify, Slow, Delay, Stop, Eject, Interrupt, every stat modifier, Death, Doom, fractional damage (**not** Reflect and **not assumed** Bribe: see the update) | wiki `[single source]`, confirmed by **row 170** except Reflect, Bribe and Multi-attack |
| Wakizashi A / B | single target, non-elemental, DC 16 / DC 13 (B is "rare") | wiki + SinirothX `[verified: 2]` |
| Daigoro | non-elemental, DC 16, the dog's follow-through "even if Yojimbo is hit" (wiki + SinirothX `[verified: 2]`); the formation has Daigoro as a separate body (`Yojimbo 1 Daigoro 1`: SinirothX, and **row 174**); **Daigoro cannot be targeted** (wiki `[single source]`) | as tagged |
| Kozuka | takes 25 percent of the target's current MP and inflicts Poison (100 percent) | wiki + FFExodus `[verified: 2]` |
| Zanmato | the whole party to 1 HP and 1 MP ("remaining HP and MP - 1"); telegraph: raises his right hand, palm left | effect `[verified: 2]`, MP half and telegraph wiki `[single source]` |
| AI | an **action counter, +8 on each of his polls** (the review: raised first, the bands read on the raised value; the dog pick is a poll without a turn); at 100 or more: Zanmato, then the counter resets to 0. Bands: 0-29 Daigoro 2/3, Kozuka 1/3; 30-69 Daigoro 1/2, Kozuka 1/4, Wakizashi A 1/4; 70-99 Daigoro, Kozuka, Wakizashi A, Wakizashi B 1/4 each | wiki + SinirothX `[verified: 2]` |
| Music | "Aeons" (the FFX-2 aeon slot), the location theme "Labyrinth" | wiki `[single source]` |

**Where the research was silent, and what settled it.** The first draft chose readings (all `[estimate]`); the RE review of the game's scripts and rows (2026-10-14, below) replaced each one:
(1) **Order of increment and band test**: the research's "14th turn" derivation (ceil(100/8) = 13 raises to reach 104) was right about the 14th and wrong about its meaning: it is the 14th **poll**, the test at 100 is made
before the raise, the raise comes first and the band is read on the **raised** value. (2) **Which roll is which move**: the review gives the order per band (not the table's printed one). (3) **Pace**: the five command rows
carry the costs (rest 120, 120, 120, 200 and 100, Zanmato's charge 120), so the engine defaults are gone. (4) **Does a blow roll to hit?** No: all five rows have accuracy formula 0 (rule 5: `canMiss: false` on all
five; the first draft let Wakizashi and Daigoro roll and 11 percent were evaded). (5) **Daigoro's stats**: row 174. (6) **Party:** unchanged, the Chapter 3 preset (`djoseBuild`, Lv 32/33/34, the end of Chapter 3, the
earliest party that has reached the mission and under the boss's Lv 36; it owns Dark Knight, Samurai, Alchemist, White Mage, Remedies and Esuna); Chapter 5's preset (46/48/50) is measured beside it. The research names
two Dark Knights or Samurai/Warrior/Gunner plus an Alchemist and Poison protection; the Star Pendant and Glass Buckle are not in our accessory table, so the answers in the data are Esuna and Remedy.
(7) **Stage heights:** Yojimbo 27.1 and Daigoro 8.0 are the HD models of FFX (`research/ffx-yojimbo.md` §12, `[datamined]`); the X-2 possessed aeon is assumed to be the same model `[estimate]`; against the girls'
mean 17.727 that is 1.529 and 0.450. (8) **Still an estimate:** the dog's bite is aimed by a uniform pick, where the game uses the near-weighted search (it needs the formation's start positions: `SCENES` in `ai/script-rolls.ts` does not hold formation 1847, and the Cavern scene is PROVED to carry none: the compiled scene file is the generic empty one, `pos_nagi05_229.psc` is empty too, RE 2026-10-14); the action-time add-on (below).


## 2. The mechanics and how our FFX-2 engine models each

- **Yojimbo's poll** (`ai/tourist-trap.ts`, the RE review of `m170`): the existing AI-memory counter (`ai/fallen-aeons.ts`: `AC`, `acOf`, `bumpAc`, `AC_OVERDRIVE`). Each poll: `ac >= 100` -> Zanmato on the whole
  party and `ac = 0`; otherwise `ac += 8` **first**, then the band is read on the raised value (>= 70: roll mod 4 gives Wakizashi B, Wakizashi A, Kozuka, the dog; 30 to 69: mod 4 gives Kozuka, Wakizashi A, dog, dog; below
  30: mod 3 gives Kozuka, dog, dog). The roll is `random() mod N` (stream 2, `scriptModCtx`); every real move but Zanmato, Wakizashi B included (RE re-review: one girl, `[strongly indicated]`), is aimed at one girl by a uniform pick (stream 4, `pickGirl`) drawn after the roll; Zanmato takes the whole
  party and no search. Deterministic under the seeded RNG. No result-driven gain, no timer (the Meteor enrage block never runs in play).
- **The dog pick is a poll without a turn**: Yojimbo raises the battle flag `daigoroCalled`, wakes Daigoro (`wakeIdle(dog, units, WAKE_ON_FLAG)`), marks `AI_REPOLL` and returns `idleFor(self, 1)` (polled again on the
  very next step, no recovery). The intent board's dry run follows such polls to the move that is really coming (`intent.ts#dryRun`, additive), so it never says "No action" for a poll that is not a turn. Zanmato is the
  14th poll of every cycle; the real actions before it number 7.25 on average and 4 to 10 in about 96 percent of cycles (the test computes it from the bands).
- **Daigoro is an actor of his own** (row 174, AGI 120, his own gauge): a second `EnemyDef` in the group's `parts` (`isPart`: never counted for victory, `results.ts`), `untargetable` (the FFX-2 wiki; `targeting.ts#isTargetable`:
  no menu and no area move reaches him) and `hideHpBar`. His script, on his own turn: flag up -> clear it and bite one girl (row 0x40a5); else sleep until woken (`idleFor(self, IDLE_UNTIL_WOKEN, WAKE_ON_FLAG)`, and
  `AI_NO_INTENT` so the intent board looks past a sleeper). The additive pieces are two constants and a marker in `ai/idle.ts`, no change to the engine core. The bite is uniform-aimed (see above).
- **The five command rows** (`command-records/tourist-trap.ts`, attached like every other FFX-2 boss's): Kozuka 0x40a1, Wakizashi A 0x40a2, Wakizashi B 0x40a3 (target byte 0x17, kept as the game's row; the script aims it at one girl), Zanmato 0x40a4 (all enemies 0x17, charge 120, rest 200),
  the bite 0x40a5 (rest 100). Accuracy formula 0 on all five. Zanmato is the Magus Sisters' Delta Attack shape (formula 0x0a, `target.hp - 1` and MP the same, damage type `other`): no Protect, Shell or Defense reduces it,
  it cannot kill, a KO'd girl is untouched. Kozuka: formula 4 power 4 on the MP pool (a quarter of current MP), Poison at status byte 100.
- **Action time** (the flat 3 s add-on) stays ON **by precedent, awaiting Bailey's pick for this chapter** (his picks were per chapter: the Cloister D-151, the Road D-187 / D-197, `docs/plans/fallen-aeons-bench.md`;
  Ixion at Djose D-269, `docs/handoff/chapter-ixion.md`, `docs/plans/ixion-bench.md`): the sibling possessed-aeon chapters carry it on top of their rows, and `docs/handoff/re-parity-rc3.md` keeps it on top of the rows.
  The Zanmato cycle is reported both ways in the handoff as an open decision.
- **Rewards, immunities, steal** laid on `EnemyDef`/`EnemyRewards` by the same shapes the Experiment uses; the game's rows (`attachMonsterRecords`, `MONSTER_RECORDS` keyed `group/enemy`) are attached (special word 0x3c3 for
  Yojimbo, 0 for Daigoro; Reflect byte 0).


## 3. New code (all additive; every file under 400 lines)

| File | What |
|---|---|
| `src/data/ffx2/enemies/tourist-trap.ts`, `tourist-trap-abilities.ts` | the two bodies, the group (`ffx2-cavern-yojimbo`), the five abilities |
| `src/battle/ffx2/ai/tourist-trap.ts` | `x2-yojimbo` (the poll), `x2-daigoro` (the bite, or sleep) |
| `src/data/ffx2/command-records/tourist-trap.ts`, `monster-records/records-tourist-trap.ts` | the five command rows (0x40a1 to 0x40a5) and the two monster rows (170, 174) |
| `src/data/chapter-ffx2-tourist-trap.ts`, `chapter-meta-ffx2-tourist-trap.ts` | the record (id `ffx2-tourist-trap`, number 23, `experimental`), pause metadata |
| `src/scenes/tourist-trap-cavern.ts` | the stage: the approved `cavern-stolen-fayth` plate under the FFX-2 camera rigs and party slots |
| `src/story/scripts/ffx2-tourist-trap.ts` | a short opening and closing in our own words |
| `src/data/guides/ffx2-tourist-trap.ts`, `guides/docs/ffx2-tourist-trap.ts` | the card and the document (sources cited) |
| `src/engine/tactics/ffx2-tourist-trap.ts` | the line the sources' clears use (the autopilot's `intended` plays it) |
| `src/app/screens/frontend/daigoroDoor.ts` | the word and its chapter |
| shared, one line each | `encounters.ts` (id, listed-exclusion, number 23), `chapters-experiments.ts`, `chapter-meta.ts`, `chapterDoors.ts`, `scenes/experiment-scenes.ts`, `ai/index.ts`, `data/ffx2/enemies/index.ts`, guides and tactics registries, `pyreflyCanon.ts` |

## 4. The hidden word `daigoro`

D = `right`, A = `left`, R = `r1`; I, G, O are unbound (`app/Input.ts` `KEY_MAP`). The first D reaches the board as a cursor move (a first letter cannot be claimed in advance: the word is not known to be coming);
the board then leaves for the chapter, so it is harmless, and the same is true of any board key typed by a player (a pinned, stated behaviour, not a defect). The A and the R are later letters of a live match and are
claimed by the word (`WordDoor.continued`, the screen's `wordKey`), so nothing else moves; R1 and START are not board actions; the last letter O is unbound, so no press is left for party prep (F393-03), and the `opening`
frame consumes every button. The title screen starts only on confirm/start (Enter, Space, Z, E, C) and B: no letter of `daigoro` is one. Prefix check: no door word is a prefix, suffix or substring of another, and no word's
end is another's beginning (`chapter-doors.test.ts`). Proven with the real `Input`, the real board and the real title screen like `fayth-door.test.ts`, then in a browser.

## 5. Art, music, story, guide

- **Art (provisional, nothing replaced):** `characters/yojimbo-cavern/{idle,attack,cast,hurt}` and `characters/daigoro/{idle,cast}` and `backdrops/cavern-stolen-fayth` are the FFX Chapter IX paintings (sidecars say "FFX only";
  the model is the same aeon, so they fit; what does not fit is said in the handoff: Yojimbo "possessed by Shuyin's despair" gets no recolour, no new pose, and the FFX Ginnem, sakura arrival and pad glow are not used).
  `public/art` is a read-only junction: no file is written.
- **Music:** `boss-ffx2-aeon` (our original FFX-2 aeon cue; the research says "Aeons"), field bed `scene-bevelle-underground`, `victory-ffx2`. No new audio; `node tools/audio/qa.mjs` must stay green. Bailey's call by ear (rule 13).
- **Story:** an opening and a closing in the writing bible's voice (attributed speakers; no retail text; `story/textLint.ts`). **Guide:** the strategy follows the sources the research read; Jegged's FFX-2 page for this
  mission is not in `research/jegged-encounter-guides-ffx2.md`, so the card says whose strategy it follows (wiki, FFExodus) and is rewritten to Jegged's if his page is read later.

## 6. Risks and how each is checked

1. **The word's keys** (§4): pinned with the real `Input` and board, then in a browser; the other five doors re-typed.
2. **Daigoro as a body**: could stall the turn order, gate victory, or draw a bar. Checked by a unit run to a win and a loss, by `isTargetable`, and in the browser (no bar, no turn, no event).
3. **The counter's band edges and the 14th turn**: a unit test steps the script and pins the 13 ordinary turns, Zanmato on the 14th, the reset, and the bands at 24/32/64/72/96/104.
4. **Zanmato leaves the party at 1/1**: a real-engine test through Protect and Shell; the advisor's answer (a heal, Remedy for Poison) is measured, not tuned.
5. **Difficulty**: nothing in the boss is tuned (D-410). A bench (wins of 40, both presets, both clocks) is reported as measured; a chapter that is too hard or too easy is disclosed with the honest options.
6. **Merge conflicts with the Valefor lane**: it edits the same registries (`encounters.ts`, `chapters-experiments.ts`, `chapterDoors.ts`, `experiment-scenes.ts`); every edit here is one line beside the Fayth line.
   `encounters.ts` is 397 of 400 lines: edits are made inside existing lines, none added.
7. **Disk**: D: is nearly full; the production build goes to `M:/pyrefly-builds/ch-tourist-trap/dist` (coordinator), never started under 15 GB free on D:, and the full suite waits for the same.
8. **RE rows arrive after the build**: the data is one module with tagged fields; re-pinning is a fixture and a few constants.

## 7. Tests (written with the code)

Data pinned to a numbers-only fixture with the sources in comments; the AI and the counter (unit, seeded); abilities (hit rule `canMiss`, Zanmato 1/1, Kozuka MP and Poison); the chapter record, number 23, not in `CHAPTERS` or
`CHAPTER_IDS`, found by `getChapter`, the board still 18; the door (real `Input`, real board and title); the experiments' store (attempts and clears never touch the save); story lint; guide and tactic; a bench. Then `tsc --noEmit`,
`node tools/orphans.mjs`, `node tools/audio/qa.mjs`, the full suite once (`--maxWorkers=2 --testTimeout=60000`, TEMP and TMP on D:/Tools/pyrefly-scratch/tmp, after the free-space check).
Browser: the word on the board, the chapter opens, the opening plays, the first menu at 1600x900 and 390x844, a win and a loss, the counter's Zanmato seen coming, the other doors, no card on the board.

## 8. Verdict

**PROCEED**: the model, AI, data, door, scene, story, guide, tactic and tests now. **Re-pin** to the RE rows when `research/re-ffx2-yojimbo-valefor.md` lands. Review class stays DEEP: the driver integrates and runs the
focused pass; the deep review is owed on the live build.
