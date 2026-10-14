# Paper preflight: Valefor at Besaid Temple, a new hidden FFX-2 chapter (branch `ch-besaid-valefor`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs --paths ...` classes this work **DEEP**
(`encounters.ts` and the chapter registry, the FFX-2 ATB engine's AI table, `scenes`, the board's door table are shared systems), so the plan comes first.
Written 2026-10-14 ~02:00 EDT, before any code, by the sub-agent building the chapter overnight for the driver.

**Authority (Bailey, 2026-10-13, verbatim, relayed by the driver):** "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and
Valefor at Besaid Temple." and "full speed ahead while I sleep". The driver's decisions: the chapter ships **hidden behind the typed word `valefor`** (first `besaid`, moved by the driver: §7), hidden chapter number
**24** (the Yojimbo lane is 23, word `daigoro`, on branch `ch-tourist-trap`); listing it on the board waits for Bailey; the art is **provisional** and reuses approved
paintings where they fit; no approved painting is replaced; the music is one of our own original cues (the retail "Aeons" is never used).

**Game case: FFX-2 only.** The fight is the story mission "Protect Besaid Temple!" of FFX-2 Chapter 3 (research `ffx2-fallen-aeons.md` §0.3 and §7.1): ATB, dresspheres,
the FFX-2 monster row #178, the fallen aeons' action counter. Nothing in it is true of an FFX chapter, and **no FFX number is used** (FFX has its own possessed Valefor in
`research/re-ffx-ai-yunalesca-bfa.md`; a different monster, a different game: rule 14). The shared plumbing it needs (one row in the board's door table, the chapter
registry) is "both" (CHK-020) and is written so that every other chapter behaves exactly as before.

**Environment note (disk).** The project drive had 3 to 5 GB free tonight, not the briefed 25 GB. A full worktree (6.5 GB tracked) did not fit ("No space left on device"); this tree is a
**sparse worktree** (the 2026-09-26 "lighter worktrees" recipe: no `docs/screenshots`, no `docs/concepts` beyond the folders tests read), about 540 MB. The coordinator then
ordered the production build **off the project drive** (vite `--outDir` on the second drive) and no build or full suite while the project drive is under 15 GB free; §9 follows that.

> **Update 2026-10-14 ~01:10 (two course corrections from the driver, both applied; the rest of this plan stands).**
> **(1) The game's own monster row landed** (`research/re-ffx2-yojimbo-valefor.md`, origin/re-ffx2-yojimbo-valefor at 91ef1fd3): `monster.bin` **row 164** is the Besaid Temple Valefor (formation 0393
> `bsyt05_229`), and it equals the research §7.1 in every shared field. §2 below is re-pinned to it: the row wins wherever it says more (MP, Accuracy, the status list, the steal byte, **Gravity nulled**),
> row 363 (Lv 48, HP 38,000, in no formation) is not used, the columns the note marks "unmapped (raw N)" are wired to nothing, and the Bribe flag is assumed neither way. Her AI script (`m164`) is not decompiled yet,
> so §3 stays the research's tagged reading. **(2) The door word is `valefor`, not `besaid`** (the driver's decision): `besaid` ended in `d`, the first letter of the Tourist Trap lane's `daigoro`, which the shared
> rule in `chapter-doors.test.ts` forbids; `valefor` overlaps no other word (§7). The chapter id is `ffx2-valefor-besaid` (the boss first, as `ffx2-ixion-djose`); the formation id is `ffx2-besaid-valefor`.

> **Update 2026-10-14 ~01:25 (the RE review; applied, the rest of this plan stands where not contradicted).** The RE session reviewed the battle code against **the game's own script `m164`, the move rows, all 200
> bytes of row 164 and the Besaid scene's start positions** ("RE review 2026-10-14, m164, row 164, pos_bsyt05_229"; `research/re-ffx2-ai-valefor.md` on origin/re-ffx2-yojimbo-valefor). **Five majors, applied:** (1) the gauge is
> read before the turn's own gain, a Ray or Blast turn adds nothing: **Rays on her 7th and 14th turn, the Blast on her 23rd** (the first build fired them on the 6th, 12th and 21st); (2) the Besaid scene ships start
> positions, so the old claim "no geometry exists" (§4 as first written) is **withdrawn**: Sonic Wings goes to the greatest ground distance (**Yuna** at the start, 53.00 against 52.39), the Attack is near-weighted (41.9 / 29.1 /
> 29.0 percent), and Ormi's highest-slot stand-in is gone from this chapter; (3) **Energy Blast is not magical** (its row's damage flags are 0: neither Shell nor Protect reduces it), Energy Ray is; (4) **Sonic Wings never misses**
> (rule 5), is physical and MP-only; (5) the charge and recovery of the three special moves come from their rows. Minors applied: slots 17 and 18 (Itchy, Auto-Life) are in the record at 255, bits 7, 8 and 9 of the special word make
> her immune to Interrupt and Bribe, the texts say Shell halves the Rays only and Sonic Wings drains the girl farthest from her, and facts read from the script are tagged `[script]`, not `[model]`.

## 1. What the chapter is

- **One boss, one link.** Valefor, bestiary #178, possessed by Shuyin's pyreflies in the Chamber of the Fayth at Besaid Temple; compulsory mission "Protect Besaid Temple!"
  (Chapter 3; Besaid and Kilika can be done in either order, Djose opens after both) `[verified: 2 sources: wiki Besaid Temple mission notes, SinirothX formation
  "Besaid Temple - Fayth - BOSS 229 Valefor 1"]`.
- **The shape of the fight** is the research's own: an **action counter** (AC) that rises as she acts and as she is struck; two **Energy Rays** on the way up (at 30 and 60), then
  the finisher **Energy Blast** at 100, after which the counter starts over. Between them she swings, or hits one girl's MP with Sonic Wings. It is the first, gentlest member of
  the family the Road's aeons (Chapter XI) and Ixion (Chapter XVI) belong to, and it reuses their counter machinery (`ai/fallen-aeons.ts`: `AC`, `acOf`, `bumpAc`).
- **No pre-set menu, no dial, no second act.** One formation, `canEscape: false`, the party restored for a retry by the engine's normal rules (a loss reopens the same fight).
  The chapter's attempts and clears go to the experiments' own store (`experimental: true`), never the save: no save change, no migration.

## 2. The data: the game's own row, then the research (rule 6), each field with its source and tag

Sources, in order of authority: **`research/re-ffx2-yojimbo-valefor.md`** (the RE session's read of the Steam build's `monster.bin`, **row 164**, `[RE row 164]`), then `research/ffx2-fallen-aeons.md` §7.1
(SinirothX's *Enemy Encyclopedia*, GameFAQs 31807, and the FF Wiki page, revision 3979327; HP, EXP, AP, gil and items also FFExodus, GamerGuides and Split_Infinity). The two **agree in every field they
share**; the row adds the rest. `tests/fixtures/parity/ffx2/besaid_valefor_rows.json` carries the row's 200 raw bytes, and `besaid-valefor-data.test.ts` decodes them and pins the data and the record to them.

| Field | Value | Source | Tag |
|---|---|---|---|
| Level | 22 | row 164 = §7.1 | `[RE row 164]`, `[verified: 2 sources]` |
| HP | 8,430 | row 164 = §7.1 | `[RE row 164]`, `[verified: 5 sources]` |
| MP | **9,999** | row 164 | `[RE row 164]`: §7.1 gives none (the first draft's placeholder 0 is replaced); no move of hers costs MP |
| STR / MAG / DEF / MDEF | 97 / 11 / 76 / 20 | row 164 = §7.1 | `[RE row 164]` |
| AGI / EVA / Luck | 125 / 25 / 3 | row 164 = §7.1 | `[RE row 164]` |
| Accuracy | **95** | row 164 | `[RE row 164]`: §7.1 gives none; the monster record lays the same byte |
| EXP / AP / Gil / Pilfer Gil | 1,500 / 15 / 1,200 / 1,500 | row 164 = §7.1 | `[RE row 164]` |
| Elements | neutral to Fire, Ice, Lightning, Water, Holy; **Gravity nulled** | row 164 (null byte 0x10) | `[RE row 164]`: **a disagreement with §7.1** ("neutral"): set to immune |
| Status immunities | Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject (group 1, 0 to 8 and 10); Stop, Doom (group 2, 6 and 14); Slow and every Break land | row 164 | `[RE row 164]`; §7.1 says only "Breaks and Slow land" (agrees) |
| Special word | 0x3c3: no percent-HP formulas (bit 0), hit reactions do not slow her (bit 1), no ATB damage (bit 6); bits 7 and 8 unmapped, bit 9 contested (Bribe or magic cancel) | row 164 | bits 0, 1, 6 `[RE row 164]` + the note's checked bit meanings; 7, 8, 9 not read |
| Steal | Healing Spring x4, rare x6, chance byte **128** (50.2 %) | row 164 = §7.1 (the byte is new) | `[RE row 164]` |
| Drop | Moon Bracer (common and rare), chance byte 255 | row 164 = §7.1 | `[RE row 164]` |
| Zantetsu byte | 80 | row 164 | carried in the record, not modelled (no Zantetsu status) |
| Bribe | no slot | row 164 | `[RE row 164]`; Bribe immunity unproven either way: none set, none denied |
| Normal Attack | physical, DC 16 (the game's row 0x41da) | §7.1; row 164 lists 0x41da | `[verified: 2 sources]` + `[RE row 164]` |
| Sonic Wings | MP damage only (formula 0, power 2), DC 2, physical (Protect applies), **never misses** (accuracy formula 0, no Darkness bit), no critical, on the girl at the greatest ground distance | §7.1; row 164 lists 0x4092; `[RE review]` the script and the row | `[verified: 2 sources]`, `[script]` |
| Energy Ray | magical (**Shell applies**), DC 20, on every girl (the arc covers all three), never misses; charge 120 (3.37 s), recovery 100 (2.80 s) | §7.1; row 164 lists 0x4091; `[RE review]` | `[verified: 2 sources]`, `[script]` |
| Energy Blast | **not magical: its row's damage flags are 0, so neither Shell nor Protect reduces it**, DC 25, on every girl, never misses; charge 120 (3.37 s), recovery 100 (2.80 s) | §7.1; row 164 lists 0x4093; `[RE review]` | `[verified: 2 sources]`, `[script]` |
| Basic mix | 2/3 Normal Attack, 1/3 Sonic Wings (`random() mod 3`: 0 is Sonic Wings), one draw per attack-class turn on stream 2 | §7.1; the script (m164) | `[verified: 2 sources]`, `[script]` |
| Counter | one gauge and a Rays-fired counter: at 100 the Blast (both reset); else at 60 with fewer than 2 Rays, a Ray; else at 30 with none, a Ray; else an attack-class turn (gauge + 5, then the roll). The gauge is read before the turn's gain; Ray and Blast turns add nothing; every result applied to her adds 5. No HP phases, no timer | §7.1 §11 row 9; the script (m164) | `[verified: 2 sources]`, `[script]` |
| Music | retail "Aeons" | §6.3 | `[single source]`; **not used** |

**Disagreements with the research** (each listed again in the handoff with its row number as the source): (1) **Gravity**: the row nulls it, §7.1 says neutral. (2) **MP** 9,999 and **Accuracy** 95: §7.1 gives
neither (new, not a disagreement). (3) **Status list**: §7.1 gives only "Breaks and Slow land"; the row gives the full list (agrees on Breaks and Slow). (4) the steal byte 128 and the drop byte 255 are new.
Nothing in §7.1 is contradicted by the row beyond Gravity. **Row 363** (a second Valefor: Lv 48, HP 38,000, ACC 108, Excalibur, Full Break, Crackdown) is **not** this chapter's and is not used.

**What is still a model, and said so in the code (each a `[model]`):**

1. **What the script does not give.** Nothing about her AI is a model any more: the order, the marks, the roll values, the targets and the search idiom are the game's (`[script]`; the RE re-review closed the question of a
   discarded first search: m164 makes none, each branch is one search call, unlike Ixion's pair form). What stays open is disclosed in the handoff: the body radii (so "Yuna is the lone farthest, about 61 in 100, or the three are tied,
   about 39 in 100"), the extreme search over all girls (with Yuna down, if the game took the extreme over all three before filtering the living it would pick nothing and this engine substitutes the nearest living girl), the start
   facing, and whether the girls stand at their start spots at each poll. The reaction handler's guard can only filter her own results, since she is immune to every status that would switch it off.
2. **The Normal Attack's critical byte and shatter.** It runs on the game's plain Attack row 0x41da (crit byte 5, shatter 10), which the monster record carries.
3. **Party levels at Besaid.** No source gives a level. Anchors: Valefor is Lv 22; the Chapter 2 preset (`ffx2/builds/bevelle.ts`) is Lv 23 / 24 / 25 (research `ffx2-bahamut.md` §4.1); the Djose preset is 32 / 33 / 34
   (an estimate). The first Chapter 3 mission follows Chapter 2 directly, so the **Chapter 2 preset is carried forward** (same girls, same dresspheres: Yuna White Mage, Rikku Dark Knight, Paine Warrior; no Samurai, no
   Lady Luck, which come later in Chapter 3 `[verified]`), `[estimate]`, and **measured, not tuned** (§8).
4. **Items.** Moon Bracer (no stats, Auto-Shell, `ffx2-combat-core.md` §5.4) and Healing Spring (a recovery item, §5.5) get held-only `ItemDef` rows (`items/held.ts`), as every other steal and drop of the FFX-2 bosses does;
   Healing Spring's Regen effect is not wired (disclosed).
5. **Action time (the animation window).** Chapters XI, XIII and XVI ship it at 3 s; **here it is kept by precedent (D-151 Cloister, D-187 and D-197 Road, D-269 Ixion), awaiting Bailey's pick for this chapter** (the rule is
   sourced, the length is not). One named constant, ON at 3 s, and measured both ways in the bench (§8; the numbers with and without it are in the handoff). Not a boss number.

## 3. The AI (deterministic, `src/battle/ffx2/ai/valefor.ts`, no DOM and no `three`: rule 1)

**The game's own script, `m164`** (the RE review, `[script]`). One gauge and a "Rays fired" counter, no HP phases (it reads none of her own HP, MP or statuses), no timer (nothing scripted ends the fight; the "too long" Meteor
block never runs). Each turn, in order: (1) gauge at least 100: **Energy Blast** on all girls, gauge and Rays fired reset; (2) else gauge at least 60 and fewer than 2 Rays fired: **Energy Ray**; (3) else gauge at least 30 and none
fired: **Energy Ray**; (4) else an attack-class turn: gauge + 5, then `random() mod 3`: 0 **Sonic Wings**, 1 or 2 **Normal Attack**. The gauge is read BEFORE the turn's gain; Ray and Blast turns add nothing; every result applied to her
adds 5 (`resultGauge(5)`). RNG: `random()` on stream 2, one draw per attack-class turn only; target searches on stream 4 (fewer than two candidates: no draw). With nobody hitting her: Rays on her turns 7 and 14, Blast on turn 23.
The reaction entry's memory key is `valeforRays`; the ability ids are `x2-valefor-*` (the FFX Valefor's ids are never touched); the Ray, the Blast and Sonic Wings are `canMiss: false` (rule 5), only the plain Attack rolls.

## 4. The two positional moves: the game's own start positions (the first draft's "no geometry exists" is withdrawn)

**What the engine knows.** It tracks no live positions (a girl is her party `slot`; stage positions are presentation and must not leak into the engine, rule 1), but it carries the scenes' **start positions** for every boss whose
script uses `searchr` (`ai/script-rolls.ts#SCENES`: the game's `PlayerPos` and `EnemyPos` lines, numbers only) and the game's near-weighted search (`searchNear`, `sceneWeights`). The first draft of this plan said the research gives no
geometry for Besaid and chose Ormi's owner-approved stand-in (the highest slot, D-018/q3). **The RE review found the Besaid scene's file** (`pos_bsyt05_229.psc`, byte for byte Ixion's): the boss at (0, 26), Yuna (0, -27), Rikku (-12, -25),
Paine (12, -25). They are added to `SCENES` as `besaid`, and the stand-in is **not used** by this chapter.

- **Sonic Wings** goes to the girl at the **greatest 2-D ground distance** from the boss: **Yuna at the start (53.00 against 52.39 for Rikku and Paine)**. Body radii are not read, so exact ties (Rikku and Paine, when Yuna is down)
  are near-weighted (one draw among two), and an unambiguous extreme draws nothing. `[script]`.
- **The Normal Attack** is the near-weighted pick of a living girl: Yuna 41.9 percent, Rikku 29.1, Paine 29.0 (the weights are the game's, `1 + floor(32768 / floor((1 + d)(1 + 2a) + 1))`, with the boss facing the middle of the girls;
  one draw of the whole range gives 597, 415 and 414 of 1,426 values, pinned in `besaid-valefor-engine.test.ts`). `[script]`.
- **Energy Ray and Energy Blast** reach the whole party. The research says "everyone in a 160 degree arc in front of her"; the girls stand in front of the boss in every start formation on record (the largest angle from the boss's
  facing to a girl is about 17 degrees against an 80 degree half-arc) and the engine tracks no later movement, so **Energy Ray hits every living girl, as the Blast does**; the difference between them is the gauge mark, the damage
  constant (20 against 25) and the class (the Ray is magical and Shell halves it, the Blast is not magical and nothing halves it). Stated in the guide and in a test.
- The positions are the start positions, as for every other boss that uses `searchr`: a girl who has since run elsewhere is not modelled (the engine has no live positions).

## 5. What gets built, in files

| File | What | Source |
|---|---|---|
| `src/data/ffx2/enemies/valefor.ts`, `valefor-abilities.ts`, `monster-records/records-valefor.ts` | `x2-valefor` and its four moves, the group (`canEscape: false`, the aeon cue, action time), rewards, and the game's own row 164 laid on her | row 164, §7.1, tagged |
| `src/battle/ffx2/ai/valefor.ts` (+ one line in `ai/index.ts`) | the script of §3, `furthestGirl`, `attackTarget`; one row (`besaid`) in `ai/script-rolls.ts#SCENES` | the game's m164 and `pos_bsyt05_229` (the RE review) |
| `src/data/ffx2/builds/besaid.ts` | the Chapter 2 preset carried forward, `[estimate]` | §2.8 |
| `src/data/chapter-ffx2-valefor-besaid.ts`, `chapter-meta-ffx2-valefor-besaid.ts` | the record (id `ffx2-valefor-besaid`, number 24, `experimental`), the pause meta (quote, handwritten, objectives, tip), one line in `chapters-experiments.ts` and one in `chapter-meta.ts` | the sibling chapters |
| `src/story/scripts/ffx2-valefor-besaid.ts` | a short intro and a short close, our own words over the sourced beats (`research/writing-bible.md`; attributed speakers; `story/textLint.ts`) | §0.3, §7.1 |
| `src/scenes/djose-chamber.ts` (two small additions) | the Chamber of the Fayth on the existing plate (§6): Valefor's spot added to the Chamber's maps and to the phone camera's list; no new scene key | staging, ours |
| `src/app/screens/frontend/valeforDoor.ts` (+ one row in `chapterDoors.ts`) | `VALEFOR_DOOR_WORD = 'valefor'`, `VALEFOR_DOOR_CHAPTER` | the other doors |
| `src/data/guides/ffx2-valefor-besaid.ts` (+ docs entry), `src/engine/tactics/ffx2-valefor-besaid.ts` (+ index/lookup lines) | the guide card and the move advisor, in our words, citing the research's sources | the project's guide rules |
| `src/data/encounters.ts` | `ChapterId`, `ListedChapterId`, `Chapter.number` gain the id and 24 on their existing lines (the file stays at 397 of 400 lines: no new lines) | additive |
| tests (§8), `docs/CONTRACT-CHANGES.md` entry, the handoff, CHANGELOG | | |

## 6. Art and music (provisional, nothing approved is touched)

- **Valefor**: the approved painting set `characters/valefor/{idle,attack,cast,hurt}` (the FFX aeon's painting; `x2-` possessed treatments exist only for Shiva, Anima and Ixion), reused
  as provisional. No `ko` or `overdrive` painting exists for her; the presenter's fallback is checked in the browser (§9) and disclosed. Not a "possessed" look: a violet derived
  painting would be a new art step, held for Bailey (the Ixion precedent, D-268).
- **Backdrop**: no approved Besaid chamber exists. The stand-in is the Chamber of the Fayth plate `backdrops/djose-chamber-provisional`: **Bailey's approved pick for Chapter XVI** (D-273, hash-locked; the
  `-provisional` suffix no longer means unapproved for it), used here as the **provisional stand-in for Besaid's own chamber** (it has the pit that belongs to Chapter 5, and Ixion's spot). The chapter's scene key is that
  plate's own key, so the cutscene screen and the prep wash find the painting with no new art file (`public/art` is a read-only junction here), and Valefor stands on Ixion's spot. **A small local render pilot for a
  Besaid Chamber of the Fayth backdrop is queued into art run 8** (one queue file, candidates only, never installed); the handoff names the candidates folder.
- **Music**: field bed `scene-bevelle-underground` (the FFX-2 chapters' fallback bed), fight `boss-ffx2-fallen-aeons` (our own ElevenLabs take; the same cue Chapter XI and Ixion play, the
  sourced mood of the game's "Aeons"), fanfare `victory-ffx2`, defeat `defeat-ffx2`. Existing cues by reference only; no new audio. Bailey's call by ear (rule 13).

## 7. The door

`valefor` on the chapter-select board opens the chapter's party prep, like the other doors. Letters against `app/Input.ts` `KEY_MAP`: **V is `select`**, **A is `left`**, L is nothing, **E is `start`**, **F is `l1`**,
O is nothing, **R is `r1`**. On the board the word claims its later letters (so the A, the only board key in it, never moves the cursor, `KeyFeed.claimed`), `select`, `start`, `l1` and `r1` are ignored by the board, and
the last letter opens on the board's next frame, which takes every press (`opening`). The title screen is not where the word is typed (Enter and E start the flow there, and the word has an E). The F and the R are two
thirds of FF7's pad sequence, which the word never completes (the matcher is per visit). Pinned with the real `Input`, the real board and the real title screen in `tests/unit/valefor-door.test.ts` (a copy of the method of
`fayth-door.test.ts`).

**The driver's decision (2026-10-14): the word is `valefor`.** The first pick, `besaid`, ended in `d`, which begins the Tourist Trap lane's `daigoro`; `chapter-doors.test.ts` forbids any suffix of one word equalling a prefix of
another, so the two lanes would have failed it at the merge. `valefor` has no such overlap with `limit`, `leblanc`, `experiment`, `mushroom`, `fayth` or `daigoro`: it ends in `r` (none of them starts with `r`,
`or`, `for`, `efor`, `lefor` or `alefor`) and starts with `v` (none ends in `v`, `va`, `val`, ...), and none begins with, ends with or contains the other. **Proved**: `valefor-door.test.ts` runs the shared rule over the table's words
plus `daigoro` and types the two words back to back in both orders, and the shared `chapter-doors.test.ts` was also run on a scratch copy with `daigoro` added to its word list (green). The shared rule is unchanged.

## 8. Tests (written with the code)

Unit: the data against a numbers-only fixture with its sources (`tests/fixtures/parity/ffx2/besaid_valefor_rows.json`, `source` and per-field tags; re-pinned to the RE row when it lands, with the
disagreements listed); the abilities' rows (DCs, targeting, `canMiss`); the AI on seeded runs (the decision table: the gauge read before the gain, the Rays on turns 7 and 14, the Blast on 23 and the reset, the 2/3 : 1/3
mix over 300 rolls, the reaction +5 per result, a multi-hit volley), `furthestGirl` (the greatest ground distance: Yuna; the Rikku and Paine tie near-weighted; no draw for an unambiguous extreme), Energy Ray on all living girls (a KO'd girl is not hit), Sonic Wings'
MP loss on the furthest girl in the real engine (and her HP untouched); the build; the chapter record and its registration (not in `CHAPTERS` or `CHAPTER_IDS`, found by `getChapter`,
number 24, the board still shows 18, the numbers test, the batch-2 music table, the party-stature list, the guide and advisor lookups); the door (`valefor-door.test.ts`); the experiments' store (a clear goes to
`pyrefly-reprise:experiments:v1`, the save is byte-identical); story lint; a bench (the advisor line and a naive line on the Wait and Active clocks, action time on and off: **measured, never
tuned**, disclosed). Then `tsc --noEmit`, `node tools/orphans.mjs`, `node tools/audio/qa.mjs`, and **the full suite once, after the project drive has 15 GB or more free** (TEMP and TMP on
the scratch folder, or on the second drive if the coordinator says the project drive cannot). Browser: a production build of this tree built **to the second drive** (`BASE_PATH='/'`, vite directly, never `npm run build`, never
`tools/gen/manifest.mjs`, one dist), served on port 5531, headless Playwright from node (`PYREFLY_BROWSER=gpu`): `valefor` opens the chapter, the intro plays, the first menu, a win, a loss, Sonic Wings
on the farthest girl (Yuna while she is up: the game's positions replaced the first plan's "back girl"), the other words still work, the board has no card; frames at 1600x900 and 390x844 under `docs/screenshots/ch-besaid-valefor/`, looked at with the Read tool. **Done 2026-10-14, all passed** (`docs/handoff/ch-besaid-valefor.md` section 8).

## 9. Risks and how each is checked

1. **The word's keys** (§7): V (`select`), A, E (`start`), F (`l1`) and R (`r1`) are bound; pinned with real input, not argued. The overlap with `daigoro` is gone with the new word.
2. **Shared registries edited by two lanes at once** (`encounters.ts`, `chapters-experiments.ts`, `chapter-meta.ts`, `chapterDoors.ts`, the music and number tests): each edit here is one added item
   on an existing line, so the merge with `ch-tourist-trap` is a mechanical union (`Chapter.number` gains 23 there and 24 here).
3. **`encounters.ts` at 397 of 400 lines:** no lines are added (the union lines grow), and `yojimbo-repair.test.ts` pins the count.
4. **A test that iterates every registered chapter** (found by the full suite last time: the two row-fixture tests, the pyrefly canon, the batch-2 music table, party stature): run early, fix the table, not the rule.
5. **Sonic Wings is MP damage, and the legacy derived path ignores `damagesPool`** (it is data-only; the working key is `extra.mpOnly`): checked by a real-engine test (MP down, HP unchanged, events).
6. **No `ko` or `overdrive` painting for Valefor:** checked in the browser (the KO frame and Energy Blast's frame); the fallback is disclosed.
7. **The provisional plate has a pit that belongs to Chapter 5:** disclosed in the handoff; the pilot's candidates are the way out.
8. **Disk:** one dist, on M:; the sparse tree; no copies; screenshots few; the dev or preview server stopped by its port at the end; PAUSE for the overnight art run created only while the browser proof runs
   and renamed away right after (`PAUSE.released-by-ch-besaid.txt`).
9. **The RE row lands mid-build:** the data keeps one place for each number (`valefor.ts`), the fixture one file, and the re-pin is a diff of numbers; every disagreement with the research is listed in the
   handoff, and the RE row wins.

## 10. Verdict

**PROCEED.** Everything above is research-sourced or a tagged model; nothing is tuned; nothing approved is replaced; the door, the registry edits and the AI are small and additive. The review class stays
DEEP: the driver integrates, runs the focused pass, and the deep review is owed on the live build. Open for the driver: the party's levels (§2.8, measured), the provisional
plate and the missing KO and overdrive paintings (§6).
