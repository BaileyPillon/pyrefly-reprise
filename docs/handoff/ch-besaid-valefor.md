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

Sources, in order of authority: **`research/re-ffx2-yojimbo-valefor.md`** (the game's own `monster.bin` row 164 of the Steam build, read by the RE session), the RE review of 2026-10-14 ("RE review 2026-10-14, m164, row 164, pos_bsyt05_229": her own AI script, the move rows and the Besaid scene's start positions), then `research/ffx2-fallen-aeons.md` §7.1 (SinirothX + the FF Wiki, `[verified: 2 sources]`). **Row 164 equals §7.1 in every field they share** (level, HP, the eight stats, EXP, AP, Gil, Pilfer Gil, the drop, the steal and its quantities). Pinned by `tests/unit/chapters/besaid-valefor-data.test.ts` against `tests/fixtures/parity/ffx2/besaid_valefor_rows.json` (the row as decoded fields with their record offsets).

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
| Charge and recovery | the engine's derived values | Energy Ray and Energy Blast charge 120 (3.37 s), recover 100 (2.80 s); Sonic Wings charge 100 (2.80 s), recover 80 (2.24 s) | RE review, the move rows (`command-records/valefor.ts`, pinned field by field with the cadence in seconds) |
| Texts | "Shell halves the Ray and the Blast"; "the back of the line" | Shell halves the Rays only; Sonic Wings drains the girl farthest from her (Yuna at the start) | RE review |

**Not used:** row 363, a second Valefor (Lv 48, HP 38,000, ACC 108, Excalibur, Full Break, Crackdown) that sits in no formation. **Not read, so not claimed:** the columns the note marks "unmapped (raw N)" (the "basaku" word, the sound id, the monster-type word, special bit 7 and 8's own meaning, element bits 6 and 7). **Still a model:** the Chapter 2 party's levels, the action-time length (3 s, kept by precedent (D-151, D-187/D-197, D-269), awaiting Bailey's pick), Healing Spring's Regen effect (a held-only row: it can be stolen and held, not used), and **the research's "160 degree arc"**: the girls stand in front of the boss in every start formation on record, so Energy Ray hits all three, as the Blast does (stated in the guide and pinned).

**Disclosed (inferred, low impact; the RE review's open items):** (a) **the body radii are not read**: the game takes the greatest ground distance minus both body radii, cut to a whole number, so "Yuna is the lone farthest" (about 61 in 100 radius sums) or "the three are tied" (about 39 in 100) is the note's open item 1; this engine uses the start positions as given, so Yuna while she is up and Rikku and Paine (exactly tied) once she is down; (b) **Sonic Wings' extreme search is one call over all girls**: if the game takes the extreme over all three before filtering the living, with Yuna down it would pick nothing and our engine substitutes the nearest living girl (the one-search reading, which draws nothing for a lone extreme, is the note's); (c) the start facing is the engine's default (all zero), so the Attack's odds assume the boss faces the middle of the girls; (d) nothing says whether the girls stand at their start spots at each poll: the engine has no live positions, as for every boss that uses `searchr`.

## 4. Difficulty: measured, not tuned (D-410)

`tests/unit/chapters/besaid-valefor-bench.test.ts`, 100 seeds a cell; the advisor line is the shipped tactic, the naive line has no Protect, Shell, Breaks or healing but Cura below 40 %:

| line | mode | wins | minutes | her actions | Rays | Blasts | Sonic Wings | KOs | losses |
|---|---|---|---|---|---|---|---|---|---|
| advisor | bench (0 ms), action time on | 100/100 | 1.58 | 12.34 | 3.04 | 1.01 | 2.76 | 0.10 | 0 |
| advisor | bench (0 ms), action time OFF | 99/100 | 0.88 | 10.39 | 2.44 | 1.00 | 2.35 | 0.04 | 1 |
| advisor | Wait split 1.5 s, action time on | 100/100 | 1.72 | 13.52 | 3.41 | 1.00 | 3.03 | 0.12 | 0 |
| advisor | Wait split 1.5 s, action time OFF | 100/100 | 1.06 | 12.96 | 2.91 | 1.00 | 3.05 | 0.09 | 0 |
| advisor | Active 1.5 s, action time on | 100/100 | 2.00 | 15.81 | 3.57 | 1.01 | 3.73 | 0.23 | 0 |
| advisor | Active 1.5 s, action time OFF | 99/100 | 1.45 | 17.84 | 3.66 | 1.09 | 4.41 | 0.31 | 1 |
| naive | bench (0 ms), action time on | 87/100 | 2.08 | 16.22 | 3.88 | 1.22 | 3.67 | 2.67 | 13 |
| naive | bench (0 ms), action time OFF | 95/100 | 1.15 | 13.12 | 3.49 | 1.03 | 2.89 | 1.38 | 5 |
| naive | Wait split 1.5 s, action time on | 81/100 | 2.22 | 17.16 | 3.90 | 1.34 | 3.96 | 2.94 | 19 |
| naive | Wait split 1.5 s, action time OFF | 86/100 | 1.41 | 16.61 | 3.77 | 1.13 | 3.92 | 2.50 | 14 |
| naive | Active 1.5 s, action time on | 67/100 | 2.50 | 19.28 | 3.99 | 1.41 | 4.79 | 3.70 | 33 |
| naive | Active 1.5 s, action time OFF | 43/100 | 1.79 | 20.97 | 3.85 | 1.52 | 5.20 | 4.26 | 57 |

**Action time (the 3 s animation window) is kept by precedent (D-151 Cloister, D-187 and D-197 Road, D-269 Ixion), awaiting Bailey's pick for this chapter**; the table gives every cell with and without it (`VALEFOR_ACTION_TIME_ON`, one constant). In the real engine her moves cost, start to start, **Attack 84 steps, Sonic Wings 151, Energy Ray and Energy Blast 185 without the window, and 174, 241 and 275 with it** (pinned in `besaid-valefor-engine.test.ts`; the rows' charge and recovery plus 90 steps).

The first aeon of the family is the gentlest: **the advisor line wins 100 of 100 in four of the six cells and 99 of 100 in the other two (bench speed, and the Active clock, with action time off)**; with the window off the fight is quicker and the naive line does worse on the Active clock (43 of 100 against 67). The naive line (no Protect, no Shell, no Breaks) loses often, as it should. **No boss number moved.**

## 5. Art (provisional) and the backdrop pilot

- **No approved painting was replaced.** `public/art` here is a read-only junction to the approved tree. Valefor's four paintings are the FFX aeon's approved set; the stage is Bailey's approved Chamber plate (Djose, D-273) as the stand-in for Besaid. **Disclosed:** the plate's pit belongs to Chapter 5, not Chapter 3; there is no `ko` or `overdrive` painting for her (the browser proof below shows what the presenter draws instead).
- **A small local render pilot for a Besaid Chamber of the Fayth backdrop was queued and has run** in tonight's art run 8 (one queue file, candidates only, nothing installed, nothing replaced): the overnight queue's `023-pilot-besaid-chamber.json` (6 candidates, txt2img, the approved Djose plate as the style adapter, no pit). The six raw candidates are in the art run's output folder for this pilot, on the second drive (**`2026-10-14/besaid-chamber/backdrop/`**; `t8-besaid-chamber-p1-cand-N.raw.png`, with `.json` sidecars). **What they are** (the agent's look at a contact sheet, **not an approval**: only Bailey approves art): daylit wooden-and-stone temple interiors with sea light through an opening; candidates 2 (arched window, a doorway to the sea) and 4 (a round window onto the sea, a carved stone disc, beams) read most like Besaid; none has the fayth pit or the chamber's circular plan. If Bailey likes one, installing it is a record move: copy it under a new name, point `VALEFOR_BESAID_SCENE_KEY` and the scene's plate frame at it (a derived, cleaned plate would come first: these are raw renders).

## 6. Files and merge hot spots

New: `src/data/chapter-ffx2-valefor-besaid.ts`, `chapter-meta-ffx2-valefor-besaid.ts`; `src/data/ffx2/enemies/{valefor,valefor-abilities}.ts`; `src/data/ffx2/builds/besaid.ts`; `src/data/ffx2/monster-records/records-valefor.ts`, `src/data/ffx2/command-records/valefor.ts`; `src/battle/ffx2/ai/valefor.ts`; `src/engine/tactics/ffx2-valefor-besaid.ts`; `src/data/guides/ffx2-valefor-besaid.ts` and `guides/docs/ffx2-valefor-besaid.ts`; `src/story/scripts/ffx2-valefor-besaid.ts`; `src/app/screens/frontend/valeforDoor.ts`; the plan `docs/plans/ch-besaid-valefor-review.md`; the tests (section 8); the fixture `tests/fixtures/parity/ffx2/besaid_valefor_rows.json`.

Shared files touched (all additive; `docs/CONTRACT-CHANGES.md`, newest entry on top). **Likely conflicts with the Tourist Trap lane (`ch-tourist-trap`), in order:**

1. `src/data/encounters.ts`: `ChapterId` gains `'ffx2-valefor-besaid'` (on the `'exp-fayth'` line), `ListedChapterId` excludes it, `Chapter.number` gains `24` (**the Tourist Trap lane widens the same three lines with `23`: take the union, `... | 22 | 23 | 24`**). No line is added (397 of 400 stays).
2. `src/data/chapters-experiments.ts`, `src/data/chapter-meta.ts`: one added item each (the lists of hidden records and of their metadata).
3. `src/app/screens/frontend/chapterDoors.ts`: one row and one import; `tests/unit/chapter-doors.test.ts`: the word list and the game list gain `valefor` (**the other lane adds `daigoro` to the same two lines: union**). **The pair is green:** `valefor` ends in `r` and starts with `v`, and none of `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro` starts with `r`, `or`, `for`, `efor`, `lefor` or `alefor` or ends in `v`; `valefor-door.test.ts` runs the shared rule over the table plus `daigoro`, and the shared `chapter-doors.test.ts` was run on a scratch copy with `daigoro` added to its word list (green).
4. `src/battle/ffx2/ai/index.ts`, `data/ffx2/enemies/index.ts`, `data/ffx2/monster-records/records.ts`, `data/ffx2/command-records/index.ts`, `src/data/guides/index.ts`, `guides/docs/index.ts`, `engine/tactics/index.ts` and `lookup.ts`: one registration line each.
5. `src/battle/ffx2/ai/script-rolls.ts`: one row (`besaid`) in `SCENES`. `src/scenes/djose-chamber.ts`: Valefor's spot (the same as Ixion's) and her id in the phone camera's list. `src/data/ffx2/items/held.ts`: `moon-bracer` and `x2-healing-spring`; `tests/unit/ffx2-steal-item-names.test.ts`: the pinned unsourced-price list gains `moon-bracer` (**the other lane may add items to the same list: union**).
6. Tests that count every chapter gained her row: `chapter-numbers`, `audio-music-batch1-2026-10-10` (the aeon cue's chapter list) and `audio-music-batch2-2026-10-12` (the table of beds and cues), `guide-ffx2-wait-habit` (the carriers), `data-ffx2-monster-records` and `data-ffx2-command-records` (skip her keys; her rows are pinned by her own test), `parity-ffx2-ai-rolls` (the `SCENES` key pin gains `besaid`), `chapters/trema-options` (the action-time allow-list gains her group `ffx2-besaid-valefor`, one constant and one condition; **the Tourist Trap lane did not touch it**).
7. **Not changed, but worth a look (not applied: it would change other chapters' text):** the enemy-intent panel says "damage" for every move whose ability sets `extra.mpOnly`, so Sonic Wings reads "Physical non-elemental damage to one girl" although it only drains MP (the guide card next to it says so). The same wording covers Shuyin's, Vegnagun's, Leblanc's and Trema's MP-only moves. A one-line fix in `src/battle/ffx2/intent.ts` `describeAbility` (`const mp = def.extra?.['mpOnly'] === true ? 'MP ' : ''` before "damage") would correct all of them; it is a change to Chapters V, VI, XIII and this one together, so it is the driver's call.
8. `CHANGELOG.md` (the header count 66 becomes 67; the other lane adds its own entry: union and recount).

**A dry run of the merge** (`git merge-tree --write-tree`, nothing in any tree touched) of this branch against `origin/ch-tourist-trap` at abb5d5d6 reports **22 conflicted files, and every hunk is two lanes adding one line at the same place: keep both sides.** The files: `PROGRESS.md` (add/add: keep both logs), `docs/CONTRACT-CHANGES.md` (both entries), `src/data/encounters.ts` (**the numbers line is `... | 22 | 23 | 24`; the `ListedChapterId` exclusion lists both `'ffx2-valefor-besaid'` and `'ffx2-tourist-trap'`**), `src/app/screens/frontend/chapterDoors.ts` (both imports, both rows, the comment names `valefor` and `daigoro`), `src/battle/ffx2/ai/index.ts`, `src/data/chapters-experiments.ts` (the list gains both records; keep the numbers ascending, 23 then 24, and run the registry tests below if any pins an order), `src/data/chapter-meta.ts` (both metas), `src/data/ffx2/command-records/index.ts`, `src/data/ffx2/enemies/index.ts`, `src/data/ffx2/items/held.ts`, `src/data/ffx2/monster-records/records.ts`, `src/data/guides/index.ts`, `src/data/guides/docs/index.ts`, `src/engine/tactics/index.ts`, `src/engine/tactics/lookup.ts`, and the tests `chapter-doors`, `chapters/trema-options` (both group constants and both ids in the condition), `audio-music-batch1-2026-10-10` and `-batch2-2026-10-12` (both chapters on the aeon cue), `data-ffx2-command-records`, `data-ffx2-monster-records`, `guide-ffx2-wait-habit` (both carriers). The two lanes met in the same ten places because both chapters are hidden FFX-2 chapters with a typed word, a guide, an advisor and the 3 s action-time precedent. After the union, run the registry tests (`chapter-doors`, `chapter-numbers`, `audio-music-batch1`, `audio-music-batch2`, `trema-options`, `data-ffx2-*-records`, `guide-ffx2-wait-habit`, `valefor-door`, `daigoro-door`) and `tsc` before anything else. `src/battle/ffx2/intent.ts` is not conflicted (this lane left it as it was).

## 7. Open points for Bailey and the driver

1. **Listing**: the chapter stays hidden until Bailey says. Listing is a record move (into `CHAPTERS` and `CHAPTER_IDS`, removing `experimental`), a number and a numeral, plus the board's card art.
2. **Her look**: the FFX aeon's painting, not a possessed one (the Shiva, Anima and Ixion treatments exist; a possessed Valefor would be a new art step); no KO or Overdrive painting; the stage is the Djose chamber with its pit.
3. **Music by ear**: existing cues only.
4. **The party's level and loadout at Besaid** are an estimate (the Chapter 2 preset carried forward), measured above; **action time** (3 s) is kept by precedent (D-151, D-187/D-197, D-269), awaiting Bailey's pick.
5. *(Closed by the RE review: m164 makes no discarded first search before Sonic Wings; each branch is one search call, unlike Ixion's pair form, so the no-discard model is right.)* What stays open is the disclosure list in section 3: the body radii, the extreme search over all girls, the start facing.
6. The game's text is not quoted anywhere: the intro and close are our own words over the sourced beats; Besaid's local plot (Wakka and Beclem) is not staged because the research names it and nothing more.

## 8. Tests and verification

**This chapter's tests (79):** `tests/unit/valefor-door.test.ts` (22: the word and every other door word through the real `Input`, the real board and the real title screen, the shared overlap rule run with `daigoro` added), `tests/unit/chapters/besaid-valefor-data.test.ts` (28: the record and row 164 as decoded fields, the three move rows and the cadence in seconds, the status table, the steal, the guide and the meta), `besaid-valefor-engine.test.ts` (22: the decision table, the near-weights 597, 415 and 414 of 1,426, Sonic Wings on Yuna and then on Rikku or Paine, her order in the real engine, the cadence in steps), `besaid-valefor-flow.test.ts` (5: the setup, each story trigger once, the stage, the experiments' store) and `besaid-valefor-bench.test.ts` (2: section 4, about 45 s). Helper `tests/unit/helpers/valeforDrive.ts`; fixture `tests/fixtures/parity/ffx2/besaid_valefor_rows.json` (numbers only, no game text).

**Checks:** `tsc --noEmit` exit 0; `node tools/orphans.mjs`: 36 orphaned modules, all older, none of this chapter; `node tools/audio/qa.mjs`: 0 cues with findings, 0 sfx findings, 68.87 MB of the 105 MB budget.

**Full suite** (`vitest run --maxWorkers=2 --testTimeout=60000` from the worktree, the `public/art` junction in place, started 02:59, on the final code tree): **1,220 files: 1,206 passed, 14 skipped (the repo's usual skips), none failed; 18,930 tests passed, 73 skipped, 1 todo; 2,126 s; exit 0.**

An earlier full run on the tree before the last fixes (01:30, 1,220 files) failed 5 files, all settled since: `besaid-valefor-data` (3 tests: the run raced my own edit of the command rows), `audio-music-batch1-2026-10-10` (the aeon cue's chapter list lacked this chapter), `trema-options` (the action-time allow-list lacked her group), and `pause-remake` and `art-ref-defaults` (the sparse worktree lacked two small concept files, `docs/concepts/pause-until-dawn/options.json` and `docs/concepts/chapters/leblanc/renders/leblanc-b.png`, now checked out; both pass). A broader run after the tip change also caught `guide-doc` (a page paragraph of 273 characters against the 260 limit): split in two.

**Browser proof** (headless Chromium, `PYREFLY_BROWSER=gpu`, a production build made with vite directly at `BASE_PATH=/`, one dist outside the repo tree, a preview on one port, stopped afterwards; the script is scratch and not in the repo; no console errors and no 404s in any run):

- **Board** (1600x900): 18 cards and none for the chapter, no "EXP" numeral, the strip says "of 18"; the word `valefor` opens the chapter's party prep (and the prep holds: the last letter is not a key press); `leblanc`, `experiment`, `mushroom` and `fayth` each still open their own chapter; FF7's `limit` stays shut in a production profile (its own gate, untouched). `daigoro` is the other lane's word and is not in this tree: the shared rule against it is the unit test above.
- **Win** (1600x900, the shipped advisor line through `autoBattle('intended')`): the intro plays (10 lines), the first menu shows Valefor painted on the Chamber plate, won in 1:38. Her moves: Attack 5, Sonic Wings 3, Energy Ray 4, Energy Blast 1. **Sonic Wings was aimed at Yuna all three times** (all three girls up; the farthest girl as modelled) and drained 36, 31 and 30 MP. Results: Victory, EXP 1,500 each, AP 15, 1,200 gil, Moon Bracer.
- **Loss** (1600x900, nobody answers a menu, on the Active clock): defeat at her 24th turn (Attack 11, Sonic Wings 10, two Rays, one Blast), the Defeat panel (turns, attempts, "never cleared"), and RETRY goes back to the party prep.
- **Phone** (390x844, touch): the same win (Attack 5, Sonic Wings 3, Rays 4, Blast 1; Sonic Wings on Yuna three times), the first menu, the results.
- **Screenshots** in `docs/screenshots/ch-besaid-valefor/`: 1600x900 and 390x844 party prep, intro, first menu, the winning blow and results; 1600x900 defeat panel and the retry; the board before the word and the prep after it. All were looked at: the prep's tip had been cut by its box and was shortened; the rest is as meant.

**What the proof does not show:** the audio (rule 13: by ear), the pause screen of the chapter, a possessed look for Valefor, a painting of her knocked out (the presenter's fallback is drawn), Sonic Wings on Rikku or Paine once Yuna is down (unit-tested only), and anything live (not deployed).

## 9. For the driver: NOW.md line and release notes

NOW.md (suggested): "Valefor at Besaid (hidden FFX-2 chapter, typed word `valefor` on the board, number 24 `EXP`): built on branch `ch-besaid-valefor`, pushed; the game's own row 164, script m164 and Besaid positions (RE review 2026-10-14); one fight, the Chapter 2 party carried forward; art provisional (Valefor's approved paintings, the approved Djose chamber as the stand-in; a local backdrop pilot queued, candidates on M:); listing waits for Bailey."

CHANGELOG (FFX-2 only): in the file (an entry at the top, "not live"). Ledger rows are the driver's: the word move (`besaid` to `valefor`), the party-level estimate, the art picks (provisional).
