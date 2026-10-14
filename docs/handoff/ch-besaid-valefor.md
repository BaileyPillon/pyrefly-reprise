# Valefor at Besaid: a hidden FFX-2 chapter (Besaid Temple, the mission "Protect Besaid Temple!", FFX-2 Chapter 3)

**Branch `ch-besaid-valefor`** (from `origin/r46-rc` ca9fd0b4), pushed; **not merged, not deployed.** **Game case: FFX-2 only** (AGENTS.md rule 14): ATB, dresspheres, the FFX-2 monster row 164 and the fallen aeons' action counter; no FFX or FF7 file changes behaviour.
**Status: built, hidden, provisional art.** It is not on the board, not in "of 18", and not listed anywhere; it opens only by a typed word. Listing it waits for Bailey's word.

Bailey, 2026-10-13 (verbatim, relayed by the driver): "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and "full speed ahead while I sleep". The driver's decisions: hidden behind a typed word; hidden chapter number **24** (the Tourist Trap lane is 23, word `daigoro`); **the word is `valefor`** (the first pick, `besaid`, ended in the first letter of `daigoro`, which the shared door rule forbids); listing waits for Bailey; the art is provisional and no approved painting is replaced; the music is one of our own cues (the retail "Aeons" is never used).

## 1. Play it

1. From the title, reach the chapter-select board (the title advances on Enter and E, so the word cannot be typed there).
2. Type `valefor` on the board (any case, letters at most 2 s apart; the board never shows a hint). **It opens the chapter's party prep itself**, with no card and no sound before it. Enter starts the battle: a short intro (Yuna, Rikku and Paine in the Chamber of the Fayth, Valefor rising wrapped in pyreflies), then the fight.
3. The word's letters are V (SELECT), A (left), E (START), F (L1) and R (R1), L and O are nothing: pinned with the real `Input`, the real board and the real title screen in `tests/unit/valefor-door.test.ts` (22 tests), and the word is proven against every other door word including `daigoro` (below).
4. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration.

## 2. What it is

One boss, one link, no chain. Valefor, bestiary #178, Lv 22, 8,430 HP, possessed by Shuyin's pyreflies. The party is the Chapter 2 preset carried forward (Yuna White Mage 23, Rikku Dark Knight 24, Paine Warrior 25: `[estimate]`, no source gives a level at Besaid; **measured, not tuned**).

| | |
|---|---|
| Her moves | Normal Attack (the game's plain Attack row 0x41da), Sonic Wings (MP only, physical, never misses), Energy Ray (magical, all girls), Energy Blast (not magical: neither Shell nor Protect reduces it; all girls) |
| Her script (**the game's own `m164`**, the RE review) | one gauge and a "Rays fired" counter, no HP phases, no timer. In order: gauge >= 100: Energy Blast, both reset; else gauge >= 60 and fewer than 2 Rays: Energy Ray; else gauge >= 30 and no Ray: Energy Ray; else (an attack-class turn) gauge + 5, then `random() mod 3`: 0 Sonic Wings, 1 or 2 Normal Attack. The gauge is read **before** the turn's gain; Ray and Blast turns add nothing; every result applied to her adds 5. With nobody hitting her: Rays on her 7th and 14th turn, Blast on her 23rd |
| Targets (from `pos_bsyt05_229`: boss (0, 26), Yuna (0, -27), Rikku (-12, -25), Paine (12, -25)) | Sonic Wings: the greatest ground distance, **Yuna** (53.00 against 52.39), ties near-weighted, an unambiguous extreme draws nothing. Attack: near-weighted, Yuna 41.9 %, Rikku 29.1 %, Paine 29.0 %. Ray and Blast: the whole party |
| Stage | the Chamber of the Fayth plate (Bailey's approved Djose pick, D-273) as the **provisional stand-in** for Besaid's own chamber; Valefor on Ixion's spot |
| Art | Valefor's approved set `characters/valefor/{idle,attack,cast,hurt}` (the FFX aeon's painting), reused; **no `ko` or `overdrive` painting exists for her** and no possessed look |
| Music | field bed `scene-bevelle-underground`, fight `boss-ffx2-fallen-aeons` (our own take, the cue Chapter XI and Ixion play), fanfare `victory-ffx2`, defeat `defeat-ffx2`. **Bailey's call by ear (rule 13)** |
| Guide | a card (rules, hints, phase note) and a page in our words; the move advisor's tactic (`engine/tactics/ffx2-valefor-besaid.ts`) is the line the bench measures |

## 3. The data, source by source (the RE session's rows win; every change from the first build is listed with its row as the source)

Sources, in order of authority: **`research/re-ffx2-yojimbo-valefor.md`** (the game's own `monster.bin` row 164 of the Steam build, read by the RE session), the RE review of 2026-10-14 ("RE review 2026-10-14, m164, row 164, pos_bsyt05_229": her own AI script, the move rows and the Besaid scene's start positions), then `research/ffx2-fallen-aeons.md` §7.1 (SinirothX + the FF Wiki, `[verified: 2 sources]`). **Row 164 equals §7.1 in every field they share** (level, HP, the eight stats, EXP, AP, Gil, Pilfer Gil, the drop, the steal and its quantities). Pinned by `tests/unit/chapters/besaid-valefor-data.test.ts` against `tests/fixtures/parity/ffx2/besaid_valefor_rows.json` (the row's 200 raw bytes, decoded by the test).

**Every change from the first build (written from §7.1 alone), with its source:**

| Field | First build | Now | Source |
|---|---|---|---|
| MP | 0 (a placeholder) | 9,999 | row 164 |
| Accuracy | 0 (the sibling aeons' reading) | 95 | row 164 |
| Gravity | neutral (§7.1) | **nulled** (`affinities: { gravity: 'immune' }`) | row 164, null byte 0x10 (the one disagreement with §7.1) |
| Status list | Ixion's list as a model | the row's: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (slots 0 to 8), Eject (10), **slots 17 and 18** (Itchy, Auto-Life), Stop, Doom; Slow and every Break land | row 164; the slot-17/18 correction and the Interrupt/Bribe immunity (special bits 7, 8, 9 set) from the RE review |
| Steal byte | 128 (a model) | 128 | row 164 |
| Her script | the research's description on the engine's counter (Rays on turns 6 and 12, Blast on 21) | the game's own: Rays on turns **7 and 14**, Blast on **23**; the gauge read before the gain; no gain on Ray and Blast turns | RE review, m164 |
| Sonic Wings' target | the highest slot (Ormi's stand-in, D-018/q3) | the greatest ground distance from the Besaid start positions (Yuna) | RE review, pos_bsyt05_229 |
| Normal Attack's target | uniform | near-weighted (41.9 / 29.1 / 29.0 %) | RE review, pos_bsyt05_229 |
| Energy Blast | magical | **not magical** (damage flags 0): Shell and Protect do not reduce it | RE review, the move row |
| Sonic Wings | rolls to hit | **never misses** (accuracy formula 0, no Darkness bit); physical, MP only, no crit | RE review, the move row |
| Charge and recovery | the engine's derived values | Energy Ray and Energy Blast charge 120 (3.37 s), recover 100 (2.80 s); Sonic Wings charge 100 (2.80 s), recover 80 (2.24 s) | RE review, the move rows (TBD-ROWS) |
| Texts | "Shell halves the Ray and the Blast"; "the back of the line" | Shell halves the Rays only; Sonic Wings drains the girl farthest from her (Yuna at the start) | RE review |

**Not used:** row 363, a second Valefor (Lv 48, HP 38,000, ACC 108, Excalibur, Full Break, Crackdown) that sits in no formation. **Not read, so not claimed:** the columns the note marks "unmapped (raw N)" (the "basaku" word, the sound id, the monster-type word, special bit 7 and 8's own meaning, element bits 6 and 7). **Still a model:** whether m164 makes a first, discarded target search before Sonic Wings' search (none is made here, as for Ormi's single `searchr`), the Chapter 2 party's levels, the action-time length (3 s, the sibling aeon chapters' pick, D-269), Healing Spring's Regen effect (a held-only row: it can be stolen and held, not used), and **the research's "160 degree arc"**: the girls stand in front of the boss in every start formation on record, so Energy Ray hits all three, as the Blast does (stated in the guide and pinned).

## 4. Difficulty: measured, not tuned (D-410)

`tests/unit/chapters/besaid-valefor-bench.test.ts`, 100 seeds a cell; the advisor line is the shipped tactic, the naive line has no Protect, Shell, Breaks or healing but Cura below 40 %:

TBD-BENCH

The first aeon of the family is the gentlest: the advisor line wins at every pace with action time on; with it off (the animation window removed) it still wins about nine of ten on the Active clock. The naive line loses often, as it should. **No boss number moved.**

## 5. Art (provisional) and the backdrop pilot

- **No approved painting was replaced.** `public/art` here is a read-only junction to the approved tree. Valefor's four paintings are the FFX aeon's approved set; the stage is Bailey's approved Chamber plate (Djose, D-273) as the stand-in for Besaid. **Disclosed:** the plate's pit belongs to Chapter 5, not Chapter 3; there is no `ko` or `overdrive` painting for her (the browser proof below shows what the presenter draws instead).
- **A small local render pilot for a Besaid Chamber of the Fayth backdrop is queued** into tonight's art run 8 (one queue file, candidates only, nothing installed, nothing replaced): `D:/Tools/pyrefly-overnight/queue-1014/023-pilot-besaid-chamber.json` (6 candidates, txt2img, the approved Djose plate as the style adapter, no pit). The candidates land in **`M:/pyrefly-overnight-art/2026-10-14/besaid-chamber/backdrop/`** (`t8-besaid-chamber-p1-cand-N.png`, with `.json` sidecars). If Bailey likes one, installing it is a record move: copy it under a new name, point `VALEFOR_BESAID_SCENE_KEY` and the scene's plate frame at it.

## 6. Files and merge hot spots

New: `src/data/chapter-ffx2-valefor-besaid.ts`, `chapter-meta-ffx2-valefor-besaid.ts`; `src/data/ffx2/enemies/{valefor,valefor-abilities}.ts`; `src/data/ffx2/builds/besaid.ts`; `src/data/ffx2/monster-records/records-valefor.ts`; TBD-COMMANDS `src/battle/ffx2/ai/valefor.ts`; `src/engine/tactics/ffx2-valefor-besaid.ts`; `src/data/guides/ffx2-valefor-besaid.ts` and `guides/docs/ffx2-valefor-besaid.ts`; `src/story/scripts/ffx2-valefor-besaid.ts`; `src/app/screens/frontend/valeforDoor.ts`; the plan `docs/plans/ch-besaid-valefor-review.md`; the tests (section 8); the fixture `tests/fixtures/parity/ffx2/besaid_valefor_rows.json`.

Shared files touched (all additive; `docs/CONTRACT-CHANGES.md`, newest entry on top). **Likely conflicts with the Tourist Trap lane (`ch-tourist-trap`), in order:**

1. `src/data/encounters.ts`: `ChapterId` gains `'ffx2-valefor-besaid'` (on the `'exp-fayth'` line), `ListedChapterId` excludes it, `Chapter.number` gains `24` (**the Tourist Trap lane widens the same three lines with `23`: take the union, `... | 22 | 23 | 24`**). No line is added (397 of 400 stays).
2. `src/data/chapters-experiments.ts`, `src/data/chapter-meta.ts`: one added item each (the lists of hidden records and of their metadata).
3. `src/app/screens/frontend/chapterDoors.ts`: one row and one import; `tests/unit/chapter-doors.test.ts`: the word list and the game list gain `valefor` (**the other lane adds `daigoro` to the same two lines: union**). **The pair is green:** `valefor` ends in `r` and starts with `v`, and none of `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro` starts with `r`, `or`, `for`, `efor`, `lefor` or `alefor` or ends in `v`; `valefor-door.test.ts` runs the shared rule over the table plus `daigoro`, and the shared `chapter-doors.test.ts` was run on a scratch copy with `daigoro` added to its word list (green).
4. `src/battle/ffx2/ai/index.ts`, `data/ffx2/enemies/index.ts`, `data/ffx2/monster-records/records.ts`, TBD-COMMAND-INDEX `src/data/guides/index.ts`, `guides/docs/index.ts`, `engine/tactics/index.ts` and `lookup.ts`: one registration line each.
5. `src/battle/ffx2/ai/script-rolls.ts`: one row (`besaid`) in `SCENES`. `src/scenes/djose-chamber.ts`: Valefor's spot (the same as Ixion's) and her id in the phone camera's list. `src/data/ffx2/items/held.ts`: `moon-bracer` and `x2-healing-spring`; `tests/unit/ffx2-steal-item-names.test.ts`: the pinned unsourced-price list gains `moon-bracer` (**the other lane may add items to the same list: union**).
6. Tests that count every chapter gained her row: `chapter-numbers`, `audio-music-batch2-2026-10-12` (the table of beds and cues), `guide-ffx2-wait-habit` (the carriers), `data-ffx2-monster-records` (skips her key; her row is pinned by her own test).
7. `CHANGELOG.md` (the header count 66 becomes 67; the other lane adds its own entry: union and recount).

## 7. Open points for Bailey and the driver

1. **Listing**: the chapter stays hidden until Bailey says. Listing is a record move (into `CHAPTERS` and `CHAPTER_IDS`, removing `experimental`), a number and a numeral, plus the board's card art.
2. **Her look**: the FFX aeon's painting, not a possessed one (the Shiva, Anima and Ixion treatments exist; a possessed Valefor would be a new art step); no KO or Overdrive painting; the stage is the Djose chamber with its pit.
3. **Music by ear**: existing cues only.
4. **The party's level and loadout at Besaid** are an estimate (the Chapter 2 preset carried forward), measured above; **action time** (3 s) is the sibling chapters' pick.
5. **Whether her script makes a discarded first target search before Sonic Wings** (the RE note's idiom, open).
6. The game's text is not quoted anywhere: the intro and close are our own words over the sourced beats; Besaid's local plot (Wakka and Beclem) is not staged because the research names it and nothing more.

## 8. Tests and verification

TBD-VERIFY

## 9. For the driver: NOW.md line and release notes

NOW.md (suggested): "Valefor at Besaid (hidden FFX-2 chapter, typed word `valefor` on the board, number 24 `EXP`): built on branch `ch-besaid-valefor`, pushed; the game's own row 164, script m164 and Besaid positions (RE review 2026-10-14); one fight, the Chapter 2 party carried forward; art provisional (Valefor's approved paintings, the approved Djose chamber as the stand-in; a local backdrop pilot queued, candidates on M:); listing waits for Bailey."

CHANGELOG (FFX-2 only): in the file (an entry at the top, "not live"). Ledger rows are the driver's: the word move (`besaid` to `valefor`), the party-level estimate, the art picks (provisional).
