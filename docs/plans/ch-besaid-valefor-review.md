# Paper preflight: Valefor at Besaid Temple, a new hidden FFX-2 chapter (branch `ch-besaid-valefor`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs --paths ...` classes this work **DEEP**
(`encounters.ts` and the chapter registry, the FFX-2 ATB engine's AI table, `scenes`, the board's door table are shared systems), so the plan comes first.
Written 2026-10-14 ~02:00 EDT, before any code, by the sub-agent building the chapter overnight for the driver.

**Authority (Bailey, 2026-10-13, verbatim, relayed by the driver):** "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and
Valefor at Besaid Temple." and "full speed ahead while I sleep". The driver's decisions: the chapter ships **hidden behind the typed word `besaid`**, hidden chapter number
**24** (the Yojimbo lane is 23, word `daigoro`, on branch `ch-tourist-trap`); listing it on the board waits for Bailey; the art is **provisional** and reuses approved
paintings where they fit; no approved painting is replaced; the music is one of our own original cues (the retail "Aeons" is never used).

**Game case: FFX-2 only.** The fight is the story mission "Protect Besaid Temple!" of FFX-2 Chapter 3 (research `ffx2-fallen-aeons.md` §0.3 and §7.1): ATB, dresspheres,
the FFX-2 monster row #178, the fallen aeons' action counter. Nothing in it is true of an FFX chapter, and **no FFX number is used** (FFX has its own possessed Valefor in
`research/re-ffx-ai-yunalesca-bfa.md`; a different monster, a different game: rule 14). The shared plumbing it needs (one row in the board's door table, the chapter
registry) is "both" (CHK-020) and is written so that every other chapter behaves exactly as before.

**Environment note (disk).** D: has 3 to 5 GB free tonight, not the briefed 25 GB. A full worktree (6.5 GB tracked) did not fit ("No space left on device"); this tree is a
**sparse worktree** (the 2026-09-26 "lighter worktrees" recipe: no `docs/screenshots`, no `docs/concepts` beyond the folders tests read), about 540 MB. The coordinator then
ordered the production build **off D:** (vite `--outDir M:/pyrefly-builds/ch-besaid-valefor/dist`) and no build or full suite while D: is under 15 GB free; §9 follows that.

## 1. What the chapter is

- **One boss, one link.** Valefor, bestiary #178, possessed by Shuyin's pyreflies in the Chamber of the Fayth at Besaid Temple; compulsory mission "Protect Besaid Temple!"
  (Chapter 3; Besaid and Kilika can be done in either order, Djose opens after both) `[verified: 2 sources: wiki Besaid Temple mission notes, SinirothX formation
  "Besaid Temple - Fayth - BOSS 229 Valefor 1"]`.
- **The shape of the fight** is the research's own: an **action counter** (AC) that rises as she acts and as she is struck; two **Energy Rays** on the way up (at 30 and 60), then
  the finisher **Energy Blast** at 100, after which the counter starts over. Between them she swings, or hits one girl's MP with Sonic Wings. It is the first, gentlest member of
  the family the Road's aeons (Chapter XI) and Ixion (Chapter XVI) belong to, and it reuses their counter machinery (`ai/fallen-aeons.ts`: `AC`, `acOf`, `bumpAc`).
- **No pre-set menu, no dial, no second act.** One formation, `canEscape: false`, the party restored for a retry by the engine's normal rules (a loss reopens the same fight).
  The chapter's attempts and clears go to the experiments' own store (`experimental: true`), never the save: no save change, no migration.

## 2. The data: only what the research says (rule 6), each field with its source and tag

Source for the block: `research/ffx2-fallen-aeons.md` §7.1 (Candidate B), which carries SinirothX's *Enemy Encyclopedia* (GameFAQs 31807) block, the FF Wiki page (revision 3979327)
and, for HP, EXP, AP, gil and items, FFExodus, GamerGuides and Split_Infinity. The RE session's note for the game's **own** monster row (`research/re-ffx2-yojimbo-valefor.md`
on `origin/re-ffx2-yojimbo-valefor`, read from the Steam build's `monster.bin`, promised for about 01:45 EDT) **wins for every field it proves**; when it lands the fixture is re-pinned
and this table gets a "RE row" column and a list of every disagreement (`tests/fixtures/parity/ffx2/besaid_valefor_rows.json`, `source` field). Until then:

| Field | Value | Source | Tag |
|---|---|---|---|
| Level | 22 | §7.1 | `[verified: 2 sources]` SinirothX, wiki |
| HP | 8,430 | §7.1 | `[verified: 5 sources]` (also FFExodus, GamerGuides, Split_Infinity) |
| STR / MAG / DEF / MDEF | 97 / 11 / 76 / 20 | §7.1 | `[verified: 2 sources]` |
| AGI / EVA / Luck | 125 / 25 / 3 | §7.1 | `[verified: 2 sources]` |
| EXP / AP / Gil / Pilfer Gil | 1,500 / 15 / 1,200 / 1,500 | §7.1 | `[verified: 2 sources]` + three guides |
| Elements | all neutral | §7.1 | `[verified: 2 sources]` |
| Breaks and Slow | land | §7.1 | `[verified: 2 sources]` |
| Drop | Moon Bracer | §7.1 | `[verified: 2 sources]` |
| Steal | Healing Spring x4, rare x6 | §7.1 | `[verified: 2 sources]` |
| Normal Attack | physical, DC 16 | §7.1 | `[verified: 2 sources]` |
| Sonic Wings | MP damage, DC 2, on the character furthest away | §7.1 | `[verified: 2 sources: SinirothX, wiki prose]` |
| Energy Ray | magic, DC 20, everyone in a 160 degree arc in front of her | §7.1 | `[verified: 2 sources]` |
| Energy Blast | magic, DC 25, all | §7.1 | `[verified: 2 sources]` |
| Basic mix | 2/3 Normal Attack, 1/3 Sonic Wings | §7.1 | `[verified: 2 sources]` |
| Counter | +5 when she acts or is attacked; Energy Ray on crossing 30 and 60; at 100 the counter is 0 and Energy Blast; the wiki's "after 6 / 12 / 20 counts" is the same at 5 per count | §7.1, §11 row 9 | `[verified: 2 sources]` |
| Music | retail "Aeons" | §6.3 | `[single source]`; **not used** |

**Unsourced, left as the nearest sibling or left out, each said in the code:**

1. **MP.** The research gives none; no move of hers costs MP. The record says `0` (tagged), and the RE row replaces it. (Not a game fact: a placeholder.)
2. **Accuracy.** Not in the §7.1 table. The Road's aeons and Ixion carry 0 on the record and the engine's enemy baseline applies; the W3 attach step (`monster-records`) corrects it
   to the game's own byte (the W3 note: every FFX-2 monster row says 95) **when a row for this enemy exists**. `[model: sibling aeons]` until then.
3. **The full status list.** §7.1 says only "Breaks and Slow land". The conservative reading is Ixion's documented list (Instant Death, Petrify, Sleep, Silence, Darkness, Poison,
   Confuse, Berserk, Curse, Eject, Stop, Doom, Delay, Interrupt immune; Breaks and Slow land) and "fractional damage" immune, because the three temple aeons share one row in §7.1
   and Ixion's list is the only one the research documents. `[model: sibling aeon]`; the RE row's resist bytes replace it.
4. **Which roll value is Sonic Wings.** The research gives the weights (2/3 : 1/3) only; `random() mod 3 == 0` is Sonic Wings (the Chapter XI scripts' habit). `[model]`.
5. **Sonic Wings' damage type** (physical or other) and whether it rolls to hit. Not sourced. Read as the Attack family (physical, rolls to hit), the reading under which Protect
   helps; the test shows the other reading's difference. `[model]`.
6. **What "attacked" counts.** Read as the project reads it for Shiva, Anima, the Sisters and Ixion, whose scripts were read from the game's own rows: **+5 per result applied to her**
   (a landing strike, a miss, a no-effect result, from anyone but herself; `AiScript.onResults` / `results-tally.ts`), not +5 per party action. Valefor's own script is not read
   yet. `[model: the sibling aeons' rule]`.
7. **"Crossing".** At 30 and 60 she answers with one Energy Ray each, **once per threshold per cycle**: a flag per threshold, reset when the counter resets at 100. If a multi-hit
   volley passes both thresholds in one go, the two Rays come on her next two turns, in order. `[model]`.
8. **Party levels at Besaid.** No source gives a level. Anchors: Valefor is Lv 22 `[SinirothX]`; our Chapter 2 preset (`ffx2/builds/bevelle.ts`) is Lv 23 / 24 / 25 (research
   `ffx2-bahamut.md` §4.1, a worked example); the Djose preset is 32 / 33 / 34 (an estimate). The first Chapter 3 mission follows Chapter 2 directly, so the **Chapter 2 preset is
   carried forward** (same girls, same dresspheres: no Samurai, no Lady Luck, which come later in Chapter 3 `[verified]`), `[estimate]`, and **measured, not tuned** (§8).
9. **The "Moon Bracer" and "Healing Spring" item ids** must exist in the FFX-2 item tables; if not, the reward is the research's name carried as data and the gap is disclosed.
10. **Action time (the animation window).** Chapters XI, XIII and XVI ship it at 3 s (Bailey's D-269 pick; the rule is sourced, the length is not). Carried as one named constant,
    ON at 3 s as the sibling aeon chapters do, and measured both ways in the bench (§8). Not a boss number.

## 3. The AI (deterministic, `src/battle/ffx2/ai/valefor.ts`, no DOM and no `three`: rule 1)

One script `x2-valefor`, in the shape of Anima's and Ixion's (`decide`, plus the reaction entry). Each poll, in this order:

1. AC at least 100: AC := 0, both thresholds re-armed, **Energy Blast** on all. (AC is read before the poll's own gain, as in Shiva's, Anima's and Ixion's rows.)
2. Otherwise AC gains 5 (her own action). Then, if the new AC has reached 30 and the 30 flag is clear, or has reached 60 and the 60 flag is clear (the lower first): set that flag
   and **Energy Ray**.
3. Otherwise `random() mod 3`: 0 **Sonic Wings** on the furthest living girl; 1 or 2 **Normal Attack** on a living girl (uniform, as the other FFX-2 scripts pick; the game weights
   by closeness and facing, which the engine does not model, `ai/script-rolls.ts`).

The reaction entry adds 5 per result applied to her (`resultGauge(5)` from `fallen-aeons.ts`). Memory keys are this script's own (`valeforRay30`, `valeforRay60`).
The ability ids are `x2-valefor-*`: the FFX Valefor's ids (`valefor`, `possessed-valefor*`) are never touched. Every row carries its sources in its comment; every Overdrive and
every magic row says `canMiss: false` (rule 5); only the Attack, and Sonic Wings by the reading in §2.5, roll.

## 4. The two positional moves: what the engine knows, and the smallest faithful model

**What exists today.** The FFX-2 engine has **no positions**: a girl is her party `slot` (Yuna 0, Rikku 1, Paine 2). Stage positions (`SceneSlots`, the rigs) are presentation and must not
leak into the engine (rule 1). The one precedent for "the character furthest away" is **Ormi's Supercollider** (`ai/syndicate-ormi.ts`): the **highest `slot` among the living,
the back of the formation**, an owner-approved stand-in (decision D-018/q3, 2026-09-21), which draws nothing. The RE lane has the game's own start positions for four scenes
(`research/re-ffx2-ai-scene-positions.md`: Bahamut, the Tail, the Leg, Shuyin; `ai/script-rolls.ts#SCENES`); **Besaid's scene is not among them**, and no research file gives the
Chamber's geometry. So no geometry is invented.

**The model (tagged `[model]`).**

- **Sonic Wings** goes to the **back of the formation: the highest slot among the living girls** (Ormi's rule, D-018/q3, reused, not re-decided). With all three standing that is
  Paine; when Paine is down it is Rikku; with only Yuna up, Yuna. No draw. It is a fixed distance order per party slot (slot 2 is the furthest), which is what the engine can know.
  In the game's own start formations the back girls are about equidistant (Bahamut's scene: Yuna 50, Rikku and Paine 57.6 ground units from the boss), so the order between the
  back two is a tie there; the stand-in breaks it the one way the project already chose.
- **Energy Ray** hits **all living girls**. The arc is 160 degrees in front of her (80 either side of her facing); the girls stand in front of her in our fixed formation (in the game's
  scene files the boss faces the party; the largest angle from the facing to a girl in the four scenes on record is about 17 degrees for Bahamut's, nowhere near 80), and the engine
  tracks no later movement (a girl who has run round behind her mid-fight is not modelled). So in this engine **Energy Ray hits all three, exactly as Energy Blast does**, and the
  difference between them is the counter and the damage constant (20 against 25), not who is hit. It is stated in the guide, in the intent text and in a test, never hidden.
- If the RE note carries this scene's `PlayerPos` and `EnemyPos` lines, the furthest girl is recomputed from the ground distance (the game's own rule: `searchr` on distance, max)
  and the arc from the boss's facing at the start; the model then becomes "the start formation" and is re-tagged. One function (`furthestGirl`) is the whole seam.

## 5. What gets built, in files

| File | What | Source |
|---|---|---|
| `src/data/ffx2/enemies/valefor.ts`, `valefor-abilities.ts` | `x2-valefor` and its four moves, the group (`canEscape: false`, the aeon cue, action time), rewards | §7.1, tagged |
| `src/battle/ffx2/ai/valefor.ts` (+ one line in `ai/index.ts`) | the script of §3, `furthestGirl` | §7.1; Ormi's D-018/q3 |
| `src/data/ffx2/builds/besaid.ts` | the Chapter 2 preset carried forward, `[estimate]` | §2.8 |
| `src/data/chapter-ffx2-besaid-valefor.ts`, `chapter-meta-ffx2-besaid-valefor.ts` | the record (id `ffx2-besaid-valefor`, number 24, `experimental`), the pause meta (quote, handwritten, objectives, tip), one line in `chapters-experiments.ts` and one in `chapter-meta.ts` | the sibling chapters |
| `src/story/scripts/ffx2-besaid-valefor.ts` | a short intro and a short close, our own words over the sourced beats (`research/writing-bible.md`; attributed speakers; `story/textLint.ts`) | §0.3, §7.1 |
| scene | the Chamber of the Fayth on the existing provisional plate (§6): Valefor's spot and height added to the Chamber's maps, no new scene key | staging, ours |
| `src/app/screens/frontend/besaidDoor.ts` (+ one row in `chapterDoors.ts`) | `BESAID_DOOR_WORD = 'besaid'`, `BESAID_DOOR_CHAPTER` | the other doors |
| `src/data/guides/ffx2-besaid-valefor.ts` (+ docs entry), `src/engine/tactics/ffx2-besaid-valefor.ts` (+ index/lookup lines) | the guide card and the move advisor, in our words, citing the research's sources | the project's guide rules |
| `src/data/encounters.ts` | `ChapterId`, `ListedChapterId`, `Chapter.number` gain the id and 24 on their existing lines (the file stays at 397 of 400 lines: no new lines) | additive |
| tests (§8), `docs/CONTRACT-CHANGES.md` entry, the handoff, CHANGELOG | | |

## 6. Art and music (provisional, nothing approved is touched)

- **Valefor**: the approved painting set `characters/valefor/{idle,attack,cast,hurt}` (the FFX aeon's painting; `x2-` possessed treatments exist only for Shiva, Anima and Ixion), reused
  as provisional. No `ko` or `overdrive` painting exists for her; the presenter's fallback is checked in the browser (§9) and disclosed. Not a "possessed" look: a violet derived
  painting would be a new art step, held for Bailey (the Ixion precedent, D-268).
- **Backdrop**: no approved Besaid chamber exists. The existing Chamber of the Fayth plate `backdrops/djose-chamber-provisional` (Chapter XVI's; hash-recorded, **provisional**, with the
  pit in the floor that belongs to Chapter 5) is the stand-in, so the chapter's scene key is that plate's own key: the cutscene screen and the prep wash find the painting with no new art
  file (`public/art` is a read-only junction here). **A small local render pilot for a Besaid Chamber of the Fayth backdrop is queued into art run 8** (one queue file, candidates only,
  never installed); the handoff names the candidates folder.
- **Music**: field bed `scene-bevelle-underground` (the FFX-2 chapters' fallback bed), fight `boss-ffx2-fallen-aeons` (our own ElevenLabs take; the same cue Chapter XI and Ixion play, the
  sourced mood of the game's "Aeons"), fanfare `victory-ffx2`, defeat `defeat-ffx2`. Existing cues by reference only; no new audio. Bailey's call by ear (rule 13).

## 7. The door

`besaid` on the chapter-select board opens the chapter's party prep, like the other doors. Letters against `app/Input.ts` `KEY_MAP`: B is bound to nothing; **E is `start`**; **S is `down`**; **A is
`left`**; I is nothing; **D is `right`**. On the board the word claims its later letters (so S, A and the last D never move the cursor, `KeyFeed.claimed`), the last letter opens on the
board's next frame, which takes every press (`opening`), and the first E is `start`, which the board ignores. The title screen is not where the word is typed (Enter and E start the flow). Pinned
with the real `Input`, the real board and the real title screen in `tests/unit/besaid-door.test.ts` (a copy of the method of `mushroom-door.test.ts`).

**Prefix check against every other door, `daigoro` included.** `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`: none of them begins with, ends with or contains `besaid`, and `besaid` does not begin with, end with or contain any of them. **One thing to flag for the merge:** `tests/unit/chapter-doors.test.ts` also forbids *any suffix of one word equalling a prefix of another*; the last letter of `besaid`
(`d`) is the first of `daigoro`, a one-letter overlap, so that shared test will fail once the two lanes meet, on the pair (`besaid`, `daigoro`). Each branch is green alone. The harm the rule
guards against needs `besaid` and then `aigoro` typed straight after (the board has already left), but the rule is the project's, so the decision (relax it to overlaps of two or more
letters, or move one word) is the driver's, and my own door test states the overlap as a computed fact and pins the property the brief asks for (no word is a prefix of another).

## 8. Tests (written with the code)

Unit: the data against a numbers-only fixture with its sources (`tests/fixtures/parity/ffx2/besaid_valefor_rows.json`, `source` and per-field tags; re-pinned to the RE row when it lands, with the
disagreements listed); the abilities' rows (DCs, targeting, `canMiss`); the AI on seeded runs (the decision table: the counter, the two Rays once each, the Blast and the reset, the 2/3 : 1/3
mix over many seeds, the reaction +5 per result, a multi-hit volley), `furthestGirl` (the highest living slot; none dead; no draw), Energy Ray on all living girls (a KO'd girl is not hit), Sonic Wings'
MP loss on the furthest girl in the real engine (and her HP untouched); the build; the chapter record and its registration (not in `CHAPTERS` or `CHAPTER_IDS`, found by `getChapter`,
number 24, the board still shows 18, the numbers test, the batch-2 music table, the party-stature list, the guide and advisor lookups); the door; the experiments' store (a clear goes to
`pyrefly-reprise:experiments:v1`, the save is byte-identical); story lint; a bench (the advisor line and a naive line on the Wait and Active clocks, action time on and off: **measured, never
tuned**, disclosed). Then `tsc --noEmit`, `node tools/orphans.mjs`, `node tools/audio/qa.mjs`, and **the full suite once, after D: has 15 GB or more free** (TEMP and TMP on
`D:/Tools/pyrefly-scratch/tmp`, or on M: if the coordinator says D: cannot). Browser: a production build of this tree built **to M:** (`BASE_PATH='/'`, vite directly, never `npm run build`, never
`tools/gen/manifest.mjs`, one dist), served on port 5531, headless Playwright from node (`PYREFLY_BROWSER=gpu`): `besaid` opens the chapter, the intro plays, the first menu, a win, a loss, Sonic Wings
on the back girl, the other words still work, the board has no card; frames at 1600x900 and 390x844 under `docs/screenshots/ch-besaid-valefor/`, looked at with the Read tool.

## 9. Risks and how each is checked

1. **The word's keys** (§7): E (`start`), S, A and D are bound; pinned with real input, not argued. The one-letter overlap with `daigoro` is flagged above.
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
DEEP: the driver integrates, runs the focused pass, and the deep review is owed on the live build. Open for the driver: the word overlap with `daigoro` (§7), the party's levels (§2.8, measured), the provisional
plate and the missing KO and overdrive paintings (§6).
