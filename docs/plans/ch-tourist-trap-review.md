# Paper preflight: Tourist Trap, a new hidden FFX-2 chapter (branch `ch-tourist-trap`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs` classes this work **DEEP** (`encounters.ts`, `chapter-meta.ts`, the chapters-experiments
registry and `ai/index.ts` are shared systems). Written 2026-10-14 ~01:05 EDT, before any code, by the sub-agent building the chapter overnight for the release driver.

**Authority (Bailey, 2026-10-13/14, verbatim, via the driver):** "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple."
and "full speed ahead while I sleep". The driver's decisions for this chapter: **hidden behind the typed word `daigoro`, hidden chapter number 23** (Fayth is 22), listing it on the board waits
for Bailey's word, the art is provisional and reuses approved paintings where they fit (never replace one), the Valefor chapter is another agent's, on its own branch.

**Game case: FFX-2 only.** The optional mission "Tourist Trap" is FFX-2 (ATB, dresspheres, the FFX-2 item and monster rows, an action-counter AI whose Zanmato is NOT FFX's:
`research/ffx-yojimbo.md` §0.3). No FFX file changes behaviour; the FFX Chapter IX (`yojimbo-cavern`, Lady Ginnem's Yojimbo) is a different fight with different rows and nothing of its data is reused
(its file headers say so). The shared plumbing (the chapter registry, one door row, one scene row) is "both" (CHK-020) and is additive: a build without the chapter behaves as before.

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
| Evasion, Accuracy | not in the research. Accuracy 95 (every monster row in the W3 lane's table reads 95, `src/data/ffx2/monster-records/index.ts`); Evasion 0 | `[estimate]` until the RE row |
| Rewards | EXP 2,000, AP 15, Gil 1,500, Pilfer Gil 2,000; drop Recovery Bracer (common and rare); steal Power Wrist (common and rare), steal rate 128 | wiki + FFExodus `[verified: 2]`; steal rate wiki `[single source]` |
| Immune | Gravity, Silence, Sleep, Darkness, Poison, Confuse, Berserk, Curse, Petrify, Slow, Delay, Stop, Eject, Interrupt, every stat modifier, Death, Doom, Bribe, fractional damage; Reflect | wiki `[single source]` |
| Wakizashi A / B | single target, non-elemental, DC 16 / DC 13 (B is "rare") | wiki + SinirothX `[verified: 2]` |
| Daigoro | non-elemental, DC 16, the dog's follow-through "even if Yojimbo is hit"; **Daigoro cannot be targeted**; the formation has Daigoro as a separate body (`Yojimbo 1 Daigoro 1`) | wiki + SinirothX `[verified: 2]` |
| Kozuka | takes 25 percent of the target's current MP and inflicts Poison (100 percent) | wiki + FFExodus `[verified: 2]` |
| Zanmato | the whole party to 1 HP and 1 MP ("remaining HP and MP - 1"); telegraph: raises his right hand, palm left | effect `[verified: 2]`, MP half and telegraph wiki `[single source]` |
| AI | an **action counter, +8 on each of his turns**; at 100 or more: Zanmato, then the counter resets to 0. Bands: 0-29 Daigoro 2/3, Kozuka 1/3; 30-69 Daigoro 1/2, Kozuka 1/4, Wakizashi A 1/4; 70-99 Daigoro, Kozuka, Wakizashi A, Wakizashi B 1/4 each | wiki + SinirothX `[verified: 2]` |
| Music | "Aeons" (the FFX-2 aeon slot), the location theme "Labyrinth" | wiki `[single source]` |

**Where the research is silent, and the reading chosen** (each tagged `[estimate]` in the code, reported in the handoff, re-pinned when the RE session lands):
(1) **Order of increment and band test.** The research derives Zanmato on his 14th turn (ceil(100/8) = 13 turns to reach 104): the counter is tested before it is raised. So turn n reads the counter
8(n-1): turns 1-4 band one, 5-9 band two, 10-13 band three, 14 Zanmato. (2) **Which roll value is which move** inside a band (only the fractions are sourced): roll mod 3 or mod 4, the move order as the table prints it.
(3) **Pace** (charge and rest of each move): no source; the engine default (rest 70, no charge) at his Agility 120, the same stand the Experiment's note takes when a row is missing ("the pace is the rows' gauge costs only");
animation lengths are not modelled. (4) **Does Wakizashi or Daigoro roll to hit?** Both are physical, so they roll (rule 5); Kozuka (MP and status) and Zanmato never roll (`canMiss: false`). (5) **Daigoro's own stats:** none
in the research for the FFX-2 body (the FFX row `m266` is FFX's); placeholders, never read, because he is untargetable and takes no turn. (6) **Party:** the Chapter 3 preset (`djoseBuild`, Lv 32/33/34, the end of
Chapter 3, which is the earliest party that has reached the mission and sits under the boss's Lv 36; it owns Dark Knight, Samurai, Alchemist, White Mage, Remedies and Esuna); Chapter 5's preset (46/48/50) is
measured beside it. The research names two Dark Knights or Samurai/Warrior/Gunner plus an Alchemist and Poison protection; the Star Pendant and Glass Buckle are not in our accessory table, so the answers
in the data are Esuna and Remedy. (7) **Stage heights:** Yojimbo 27.1 and Daigoro 8.0 are the HD models of FFX (`research/ffx-yojimbo.md` §12, `[datamined]`); the X-2 possessed aeon is assumed to be the same
model `[estimate]`; against the girls' mean 17.727 that is 1.529 and 0.450.

## 2. The mechanics and how our FFX-2 engine models each

- **The action counter** is the existing AI-memory counter (`ai/fallen-aeons.ts`: `AC`, `acOf`, `bumpAc`, `AC_OVERDRIVE`, the helpers Ixion's script also imports). `ai/tourist-trap.ts` is one script,
  `x2-yojimbo`: at the start of each poll, `ac >= 100` -> Zanmato on the whole party and `ac = 0`; otherwise pick by band (`scriptModCtx`: the game's `random() mod N` stream), aim at a uniform living girl
  (`pickGirl`), then `ac += 8`. Deterministic under the seeded RNG; the memory is on the unit, so the intent board's clone-and-sample dry run sees the counter (Zanmato is a certain, visible next move at 100+).
  No result-driven gain (that is Shiva's and Anima's rule, not his).
- **Zanmato** is the Magus Sisters' Delta Attack shape (`extra: { setHpTo: 1, setMpTo: 1 }`, formula 0x0a in `kernel/damage.ts`, `target.hp - 1`, damage type `other`, all enemies, `canMiss: false`): no Protect, Shell or
  Defense reduces it, it cannot kill, a KO'd girl is untouched. The effect is the sourced one; the engine path already exists, nothing new.
- **Kozuka**: `percent-current` power 4 (4/16 = 25 percent of current), `extra.mpOnly` (the MP pool only), plus Poison at chance 254 (lands unless the girl resists); `canMiss: false`.
- **Daigoro the body**: a second `EnemyDef` with `flags: { untargetable, isPart, hideHpBar }` (`results.ts#battleOutcome` counts only non-part enemies, so he never gates victory; `targeting.ts#isTargetable` honours `untargetable`), and an idle
  script that waits forever (`idleFor(self, IDLE_UNTIL_WOKEN)`: one poll, no turns, no events). The **move** "Daigoro" belongs to Yojimbo's list (he commands the dog), is a physical `strength` hit, DC 16.
  Nothing FFX's `orders.ts` does is reused.
- **Rewards, immunities, steal** laid on `EnemyDef`/`EnemyRewards` by the same shapes the Experiment uses; the game's row (`attachMonsterRecords`, `MONSTER_RECORDS` keyed `group/enemy`) is added when the RE rows land.

## 3. New code (all additive; every file under 400 lines)

| File | What |
|---|---|
| `src/data/ffx2/enemies/tourist-trap.ts`, `tourist-trap-abilities.ts` | the two bodies, the group (`ffx2-cavern-yojimbo`), the five abilities |
| `src/battle/ffx2/ai/tourist-trap.ts` | `x2-yojimbo` (counter script), `x2-daigoro-bystander` |
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
