# Paper preflight: Angra Mainyu, Zarich and Tawrich, a new hidden FFX-2 chapter (branch `ch-angra-mainyu`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs --paths ...` classes this work **DEEP**
(`encounters.ts` and the chapter registry, the FFX-2 ATB engine's AI table, `scenes`, the board's door table are shared systems), so the plan comes first.
Written 2026-10-14 ~22:15 EDT, before any code, by the sub-agent building the chapter for the release driver.

**Authority (Bailey):** the chapter was adopted on 2026-10-07 (decision D-536: "Angra Mainyu (FFX-2, the Bikanel Desert superboss)") and on 2026-10-14 he wrote, relayed by the driver:
"Please work on finishing the unimplemented chapters STAT". The driver's decisions: the chapter ships **hidden behind the typed word `angra`**, hidden chapter number **26** (Valefor is 24, the
Tourist Trap 23, the Biran and Yenke lane's word `gagazet` is 25); the word must overlap no other door word (`limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor`, `gagazet`);
listing it on the board waits for Bailey; the art is **provisional** and no approved painting is replaced; the music is one of our own cues.

**Game case: FFX-2 only.** The fight is the Chapter 5 mission "Showdown in the Sands" (research `ffx2-angra-mainyu.md` §1): ATB, dresspheres, FFX-2 monster rows. No FFX file changes behaviour,
no FFX number is used. The shared plumbing it needs (one row in the board's door table, the chapter registry, one scene row, three additive lines of the contract) is "both" (CHK-020) and is
written so that every other chapter behaves exactly as before.

**Environment note.** The project drive had 0.6 to 5 GB free when this lane began; the worktree is a sparse one (no `docs/screenshots`) on the second drive, as are the build, the temp folder
and the render staging.

## 1. What the chapter is

- **Three bodies, one fight.** Angra Mainyu (the body, bestiary #175) and its arms Zarich (left, #177) and Tawrich (right, #176), at the Al Bhed excavation camp in the Bikanel Desert; the
  story mission "Showdown in the Sands" of Chapter 5, after the ten Cactuar Gatekeepers `[verified: 2 sources]` (FF Wiki rev 4041096 and Jegged).
- **The shape of the fight** is Jegged's: the body fights from a fixed order (Osmose when its MP is low, Full-Life on a fallen arm, Perdition's Flame on a clock, else Demi, Flare, Perdition's
  Flame or Curaga on an arm); **Zarich is immune to physical damage and Tawrich to magic**, so **Darkness** (neither) is the one move that reaches all three; the body keeps reviving and
  healing the arms; the fight ends when the **body** falls (the arms are parts: `EnemyGroupDef.parts`, as Vegnagun's Bulwarks).
- **No second act, no prep tab, no dial.** One formation, `canEscape: false`. The attempts and clears go to the experiments' own store (`experimental: true`), never the save: no save change,
  no migration.

## 2. The data: the wiki and Jegged first, then the game's own rows (rule 6), each field with its source and tag

Sources, in order: **`research/re-ffx2-angra-mainyu.md`** (the RE session's read of the Steam build: the monster rows, the formation, the scene positions and the three AI scripts; **not landed when
this plan was written** — the chapter is built from the first source below and re-pinned to it when it lands, every disagreement listed in the handoff), then **`research/ffx2-angra-mainyu.md`**
(written for this chapter on 2026-10-14: the FF Wiki, Jegged, the effect rows of the enemy-abilities page).

| Field | Value | Tag |
|---|---|---|
| Angra Mainyu | Lv 47, HP 333,444, MP 9,999, STR 73, MAG 97, DEF 124, MDEF 114, AGI 68, Luck 2; EXP 5,000, AP 30, Gil 5,000, Pilfer Gil 2,000; Gravity halves; drop Ribbon, steal Megalixir; immune to every ailment listed, to fractional damage and to Reflect | HP, drop, steal `[verified: 2 sources]`; the rest `[single source: wiki rev 4041096]` |
| Tawrich | Lv 38, HP 5,440, MP 9,999, STR 85, MAG 42, DEF 99, AGI 113, Luck 1; immune to magic damage; Gravity halves | `[single source: wiki rev 3573851]`; the immunity `[verified: 2 sources]` |
| Zarich | Lv 36, HP 5,440, MP 9,999, STR 70, MAG 25, MDEF 99, AGI 82, Luck 1; immune to physical damage; Fire, Ice, Lightning, Water, Holy half, Gravity nulled | `[single source: wiki rev 3573852]`; the immunity `[verified: 2 sources]` |
| Accuracy, Evasion, the missing DEF / MDEF | no source read | `[unsourced]`: stand-ins marked `[model]` until the rows land |
| Perdition's Flame | 10 non-elemental physical hits, each on a random living girl, each 3/16 of her **maximum** HP | `[verified: 2 sources]` |
| Demi, Flare, Osmose, Curaga, Full-Life, Dispel | as `research/ffx2-angra-mainyu.md` §3 | Demi, Osmose, Full-Life `[verified: 2 sources]`; the others `[single source]` |
| Zarich's moves | Glimmer of Despair (MP and one level of STR, MAG, DEF, MDEF off the party), elemental magic | `[verified: 2 sources]` |
| Tawrich's moves | Punch, Bloody Breath (damage and Poison, Darkness, Silence, Confusion) | Bloody Breath `[verified: 2 sources]`, Punch `[single source]` |
| The body's order | Osmose (low MP, under 200), Full-Life on a fallen arm, Perdition's Flame at the opening and 7 turns later and when 15 turns have passed, else 40/20/20/20 Demi, Flare, Perdition's Flame, Curaga on an arm; Dispel against Reflect | `[single source: Jegged]` (the 200 line: wiki) |
| Party | the Chapter V preset (Lv 46 / 48 / 50), carried as a deep copy; Yuna White Mage, Rikku and Paine Dark Knight | `[estimate]`: no source gives a level for the mission |
| Music | the fight plays "Aeons" per the wiki's OST page; ours is `boss-ffx2-fallen-aeons`, the take Chapter XI, Ixion, Valefor and the Tourist Trap play | `[single source]` |

**Disagreements and gaps** are in `research/ffx2-angra-mainyu.md` §7 (which arm is which; Tawrich and magic; Bio). **What is still a model, and said so in the code:** the arms' odds and choices (no source
gives any), Accuracy and Evasion, the party's level, the action-time length.

## 3. The AI (deterministic, `src/battle/ffx2/ai/angra-mainyu.ts`, no DOM and no `three`: rule 1)

Three scripts, one per body, sharing battle flags in the Vegnagun Redoubts' way (`ctx.flags`). RNG on the game's streams (`random()` stream 2, the target searches stream 4: `script-rolls.ts`).

- **The body:** the order of §2, written as a decision table with one counter for its own turns and one for the turns since its last Perdition's Flame; a Reflect on any girl brings Dispel.
- **Zarich and Tawrich:** a small rotation each (a model until the rows land); each is `autoStatuses: ['null-physical']` and `['null-magic']`, the Vegnagun Leg's nodes' precedent, so the engine's own
  damage pipeline refuses the wrong class and lets Darkness through.
- **Perdition's Flame** is `hits: 10`, `targeting: 'random-enemy'`, formula `percent-total`, power 3 (sixteenths): the engine's own multi-hit random-target machinery, checked by a real-engine test.
- The game's `m268`, `m269` and `m270` scripts are being read by the RE session; their order, thresholds and odds replace this model and the handoff lists each change.

## 4. What gets built, in files

| File | What |
|---|---|
| `research/ffx2-angra-mainyu.md` | the sources (§2) |
| `src/data/ffx2/enemies/angra-mainyu.ts`, `angra-mainyu-abilities.ts`, `monster-records/records-angra-mainyu.ts`, `command-records/angra-mainyu.ts` | the three bodies and their moves; the game's rows laid on them when they land |
| `src/battle/ffx2/ai/angra-mainyu.ts` (+ one line in `ai/index.ts`) | the three scripts |
| `src/data/ffx2/builds/angra-mainyu.ts` | the Chapter V preset, copied |
| `src/data/chapter-ffx2-angra-mainyu.ts`, `chapter-meta-ffx2-angra-mainyu.ts`, `angra-mainyu-ids.ts` | the record (id `ffx2-angra-mainyu`, number 26, `experimental`), the pause meta, the scene constants; one line each in `chapters-experiments.ts` and `chapter-meta.ts` |
| `src/story/scripts/ffx2-angra-mainyu.ts` | a short intro, three mid-fight callouts and a close, our own words (`research/writing-bible.md`) |
| `src/scenes/angra-mainyu-desert.ts` (+ rows in `experiment-scenes.ts` and `engine/pyreflyCanon.ts`) | the Bikanel Desert on a provisional plate, three enemy spots |
| `src/app/screens/frontend/angraDoor.ts` (+ one row in `chapterDoors.ts`) | `ANGRA_DOOR_WORD = 'angra'` |
| `src/data/guides/ffx2-angra-mainyu.ts`, `guides/docs/ffx2-angra-mainyu.ts`, `src/engine/tactics/ffx2-angra-mainyu.ts` | the guide card and page (Jegged's page, our words) and the advisor line the bench measures |
| `src/data/encounters.ts` | `ChapterId`, `ListedChapterId`, `Chapter.number` gain the id and 26 on their existing lines (the file stays at 397 of 400 lines: no new lines) |
| `src/data/ffx2/items/held.ts` | Ribbon as a held-only row (the drop) and Megalixir if it has none |
| tests (§7), `docs/CONTRACT-CHANGES.md`, the handoff, CHANGELOG | |

## 5. Art and music (provisional, nothing approved is touched)

- **Angra Mainyu, Zarich and Tawrich** are new subjects: a small local pilot (ComfyUI, port 8188 only, the generator's own style contract, 6 + 4 + 4 renders, candidates only on the second drive) is
  looked at and one of each picked, then installed **as new files** in the art mirror (`r49`, hard links of `r47`; only new files are added, no linked file is written). The cut-outs and sidecars
  come from the generator. No KO, hurt or cast painting exists for any of them: the presenter's fallback is drawn and disclosed.
- **Backdrop:** none of the approved plates is a desert (the nearest outdoor plates are the Road to the Farplane and Mushroom Rock Road). A **provisional Bikanel Desert plate** is the second pilot,
  installed the same way; until then the scene shows the engine's placeholder plate.
- **Music:** field bed `scene-bevelle-underground`, fight `boss-ffx2-fallen-aeons`, fanfare `victory-ffx2`, defeat `defeat-ffx2`: existing cues by reference. Bailey's call by ear (rule 13).

## 6. The door

`angra` on the chapter-select board opens the chapter's party prep. Letters against `app/Input.ts` `KEY_MAP` (checked with the real `Input`, the real board and the real title screen by the door test):
A is `left`, N and G are bound to nothing (to be confirmed), R is `r1`. **No other word begins with `a` or `an`, `ang`, `angr`, and none ends with `a`, `ra`, `gra`, `ngra`**, so the word overlaps `limit`,
`leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor` and `gagazet` in no position; the shared rule in `chapter-doors.test.ts` is run with `gagazet` added on a scratch copy.

## 7. Tests (written with the code)

Unit: the data against a numbers-only fixture of the game's rows (re-pinned when the RE note lands); the abilities' rows and `canMiss`; the three scripts on seeded runs (the decision table, the 15 and 7
clocks, the 40/20/20/20 mix over many rolls, Dispel on Reflect, Full-Life on a fallen arm, Osmose below 200 MP and the loop when the party has no MP); Perdition's Flame in the real engine (ten hits, random
girls, each 3/16 of the girl's maximum HP); the arms' immunities in the real engine (a Dark Knight's Darkness hits all three, Attack does nothing to Zarich, a spell nothing to Tawrich); the body falling ends the
fight with the arms standing; the build; the chapter record and its registration (not in `CHAPTERS` or `CHAPTER_IDS`, found by `getChapter`, number 26, the board still shows 18); the door; the experiments' store
(a clear goes to `pyrefly-reprise:experiments:v1`, the save byte-identical); a bench (the advisor line and a naive line on the Wait and Active clocks, action time on and off: **measured, never tuned**).
Then `tsc --noEmit`, `node tools/orphans.mjs`, `node tools/audio/qa.mjs`, the full suite once (`--maxWorkers=2`, TEMP and TMP on the second drive). Browser: a production build **to the second drive**, headless Playwright:
`angra` opens the chapter, the intro, the first menu, a win, a loss, the other words, the board "of 18"; frames at 1600x900 and 390x844 under `docs/screenshots/ch-angra-mainyu/`, looked at.

## 8. Risks and how each is checked

1. **The data is first-source, not the game's own.** Everything numeric has one place (`angra-mainyu.ts`, one fixture); the re-pin is a diff of numbers and every disagreement is listed.
2. **The word's keys** (§6): pinned with real input, not argued.
3. **Shared registries edited by three lanes at once** (`encounters.ts`, `chapters-experiments.ts`, `chapter-meta.ts`, `chapterDoors.ts`, the music and number tests): each edit is one added item on
   an existing line; the merge is a mechanical union.
4. **`encounters.ts` at 397 of 400 lines:** no lines are added; `yojimbo-repair.test.ts` pins the count.
5. **Three bodies and victory:** the arms are `parts`; the fight ends on the body (`results.ts`); checked by a real-engine test, as are the revive and heal loops (a fight must not stall on an arm).
6. **The fight length.** 333,444 HP is a long fight; the bench measures it on both clocks and the handoff states the numbers; nothing is tuned.
7. **A test that iterates every registered chapter** (the Valefor and Tourist Trap lanes met it in ten places): run early, fix the table, not the rule.
8. **Disk:** the worktree, the one dist, the temp folder and the render staging are on the second drive; PAUSE is made only while a browser runs; servers are stopped by their port.

## 9. Verdict

**PROCEED.** Everything above is sourced or a tagged model; nothing is tuned; nothing approved is replaced; the door, the registry edits and the AI are small and additive. The review class stays DEEP:
the driver integrates, runs the focused pass, and the deep review is owed on the live build. Open for the driver: the party's level (`[estimate]`), the three provisional paintings and the plate,
the re-pin to the game's rows.
