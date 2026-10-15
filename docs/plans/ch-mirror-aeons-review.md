# Paper preflight: "Mirror Aeons", the Dark Magus Sisters and Dark Yojimbo against Yuna's own Magus Sisters and Yojimbo (hidden FFX chapter 27, branch `ch-mirror-aeons`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs --paths ...` classes this work **DEEP** (the chapter registry, a trigger condition in the shared combat-core
types, a scene row, the board's door table and the data index are shared systems; obligations live + focused + deep, nothing here deploys). Written 2026-10-15, before any code, by the sub-agent building the
scaffold for the release driver.

**Authority.** Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters that would be so awesome. the most epic encounter ever!!!!!!!!!" and then "keep going
full speed ahead, i'll go with all of your recommendations i like the mirror match but make the difficulty appropriate not too easy not too hard". The driver's decisions: the chapter is FFX only, hidden behind a typed
word like `gagazet` and `angra`, hidden chapter number 27, two acts, art provisional (no approved painting replaced), listing it on the board waits for Bailey's word.

**Game case: FFX only** (AGENTS.md rule 14). The Dark Aeons, the player's Yojimbo and Magus Sisters, CTB and the Cavern of the Stolen Fayth are FFX's (Dark Aeons exist only in the International and HD Remaster
releases); FFX-2's Yojimbo ("Tourist Trap") is a different record and shares nothing with this one. The shared plumbing (a registry row, a door row, one scene row, a data-index barrel, one trigger condition in
`battle/common/types.ts` and its evaluator) is "both" (CHK-020), additive and inert for every other chapter: the FFX goldens and the FFX-2 and FF7 goldens must not move.

**Verdict: PROCEED as a scaffold.** Everything the files give (`research/re-ffx-yojimbo-sisters-feasibility.md`, "RE section n") is built to them. The two things the reverse-engineering session has not finished are
**seams, not guesses**: the Dark aeons' AI and the player's Yojimbo and Sisters in the engine (section 4). The lane writes **no boss AI and no summon engine**.

## 1. What the chapter is

- **Two acts, one chain, no menu between** (the Sinspawn Gui precedent: `EnemyGroupDef.nextGroupId`, a seam script, `EnemyGroupDef.plate` for the second backdrop).
  - **Act I, the Dark Magus Sisters, on Mushroom Rock Road.** Dark Cindy (m341), Dark Sandy (m342), Dark Mindy (m343). The trio formations (`kino00_70`, `kino01_70`) start **every Overdrive gauge at 100**, so the
    opening move is the joint Delta Attack (RE section 4.2; Jegged Sisters / StrategyWiki in `research/ffx-mirror-aeons.md`). Backdrop: the Mushroom Rock Road plate that Sinspawn Gui already uses.
  - **Act II, Dark Yojimbo, in the Cavern of the Stolen Fayth.** Dark Yojimbo (m340) and the dog stand-in. The game fights him five times (tiers `nagi05_70` to `_74`); the chapter fights **one tier** (section 3).
    Backdrop: the Cavern plate that Chapter IX (Yojimbo) already uses.
- **The player: Yuna with Yojimbo AND the Magus Sisters in her summon list**, plus Tidus and Lulu on the field and Auron, Wakka, Kimahri and Rikku on the bench (**Lulu takes the third seat because of Dark Mindy:** her Evasion is 240, and the engine, run on the preset in this lane, lands 0 of 55 blades on her; a spell never misses; see the update at the end). The mirror is the point: the Dark Sisters meet Yuna's
  Sisters, Dark Yojimbo meets Yuna's Yojimbo (Pay him, and hope for Zanmato against a resistance byte of 4).
- **Hidden, an experiment.** `experimental: true`: attempts, clears and time go to the experiments' own store, never the save (no schema change; not the save-data deep class); no part of "N of 18"; the board has
  no card. Number **27** (26 is Angra Mainyu; `tests/unit/chapter-numbers.test.ts`).
- **The word is `yojimbo`.** The brief asked to consider `zanmato`; it **fails**, and why is in section 6.

## 2. Sources, in the order the rules ask

1. **The files** (`research/re-ffx-yojimbo-sisters-feasibility.md`, merged into this branch): the four records, loot, formations, move rows, start positions, flags, the AI described in words, the player-side summon rules.
2. **The player-side rules** (private coverage note FFX-G08, summarised in RE section 5; and `research/ffx-combat-core.md` §6.4 for the aeon stat formula): "(d)" in the brief.
3. **The written guides** (`research/ffx-mirror-aeons.md`: Jegged first, then StrategyWiki and GamerGuides), which the files overrule where they disagree (its section 6, conflicts C1 to C8).
4. Nothing else. **Nothing is invented (rule 6):** an unsourced value is a named constant tagged `[estimate]` in one place, listed in the handoff.

## 3. The difficulty plan (Bailey: "appropriate, not too easy, not too hard")

**Target, in numbers.** With the party preset and the advisor's line, a full chapter (both acts) is won about **70 percent** of the time (**60 to 80** accepted); a careless line (plain Attack, no summon, no Pay)
mostly **loses** (under 20 percent). Measured by a bench on the real engine over 100 seeds a line; **never tuned by editing a boss row** (Bailey's rule: boss numbers are the game's own).

**The two levers, and only these:**

1. **The party preset** (`data/ffx/builds/mirror-aeons.ts`, all `[estimate]`): stats, gear, the aeons' stats derived from Yuna's by the §6.4 formula, gauges and the bag. One constants block; the source of each
   number (Jegged Stat Maxing for the caps, Best Armor for the auto-abilities, GamerGuides' 250 to 255) is in `research/ffx-mirror-aeons.md` section 4. **Its levers, in the order the bench turns them, each a named constant:** the party's **Luck** (`ENDGAME_LUCK`, 60: Dark Yojimbo's Luck 114 and Dark Mindy's Evasion 240 are what the party's hit chance fights, Jegged: "high Luck will make the battle much easier"), the **stats fraction** of the caps, **Anima** in or out of the aeons, the **First Strike** seats, the **gil** Pay draws on, and the aeons' starting **gauges**.
2. **Which of the game's own formations and tiers each act uses.** The files give a ladder in each act, so the choice is a **pick among real fights, not a number of ours**:
   - Act I, easiest to hardest: Mindy alone `kino05_71` (2.0M HP), Sandy alone `kino05_70` (2.5M), Cindy alone `kino01_71` (3.0M), Sandy and Mindy `kino01_72` (4.5M, pair), the trio `kino01_70` / `kino00_70` (7.5M,
     all gauges at 100). A lone sister has no Delta Attack (guides; RE section 4.2: the joint attack needs all three).
   - Act II, easiest to hardest: tiers `nagi05_70` (gauge +6 a turn) to `nagi05_74` (+26): Zanmato after about 17 turns down to about 4 (RE section 4.1). Tier 1 alone is an ambushed start.
   - **Default until the bench says otherwise (`[estimate]`, named constants `MIRROR_ACT_I` and `MIRROR_ACT_II` in `data/ffx/mirror-aeons-ids.ts`): Act I the trio `kino00_70`, Act II tier 3 `nagi05_72`.** The trio is
     the mirror Bailey asked for (three against three); tier 3 is the middle rung. If the bench puts the trio out of the 60-to-80 band, the pick moves one rung (a pair, then Cindy alone) before any preset number moves.
3. **The harness** (`tests/unit/helpers/mirrorAeonsDrive.ts`, `tests/unit/chapters/mirror-aeons-bench.test.ts`): runs each rung with the advisor's line and the careless line over 100 seeds and prints the ladder with
   win rate, decisions per win and turns. It is **a skeleton until RE's AI and the engine's summon rules land** (the bench skips itself, with the reason printed, while either is absent).

## 4. The seams (what is RE's, and exactly where it plugs in)

| Seam | What exists in this lane | What RE writes | How it is found |
|---|---|---|---|
| **Dark aeons' AI** (four scripts: one per Sister, one for Yojimbo; the dog's bite) | the four script ids (`data/ffx/mirror-aeons-ids.ts`), each `EnemyDef.aiScriptId` set; the **battle id of the game's own formation** each group stands for (`DARK_FORMATION_BATTLE_ID`), which the scripts branch on; the moves' rows and command records with the game's words; the dog as a bystander that takes no turns and is untargetable; `ai/dark-aeons-seams.ts` lists the ids and says which are registered | `registerAiScript(DARK_*_SCRIPT, ...)` in a file RE adds and imports in `ai/index.ts`; the gauge rules, rolls, hit hooks | `getAiScript(id)`; until a script exists the engine's own fallback is a plain Attack on the party (`chooseAiCommand`). The chapter's tests for the scripts are `it.skipIf(!registered)` and fail loudly on a half-registered set |
| **The starting gauges** | `ai/dark-aeons-setup.ts` writes the formation's start gauge (100 for each Sister in the trio formations; 0 elsewhere, `[inferred]` from the absence of a write, RE section 9 item 3) and the battle id into the battle's flags, once, at the start. It is *state*, not a decision | may replace it by the scripts' own init (the same numbers) | `applyDarkAeonsSetup(ctx)` called from `battle/ffx/setup.ts` like Biran and Yenke's |
| **The player's Yojimbo** (hire answer, compatibility, Pay, free attack, command roll, wipe rules) | the aeon in the build with the catalogue's four attack ids and Zanmato; `YOJIMBO_HIRE_ANSWER = 2` and `YOJIMBO_START_COMPATIBILITY` as named **estimates** (the files hold no start value; G08 section 3.5 gives the answer from the third reply, the community says 128) | the Pay command and its rolls (G08 section 3), the first-action dismissal and knocked-out penalties | the build's `aeons`; the engine reads the two constants through `MIRROR_PLAYER_AEON_RULES` |
| **The player's Magus Sisters** (three actors in one summon, orders, motivation, Combine powers, the wipe for three) | the three aeons in the build with their own stats; the engine's kernel for summon / dismiss / wipe is already there (RE section 5.6); the chapter does **not** call the Sisters through a one-aeon path | the three-aeon wiring (`aeonId` is one today), the order menu, motivation, Combine powers | `isMagusSister` on the catalogue (`data/ffx/aeons/index.ts`) |
| **Tests that wait** | `tests/unit/chapters/mirror-aeons-seams.test.ts`: `it.skipIf` blocks naming each seam, so the day a script or a rule lands the block runs by itself and a wrong shape fails | the scripts and rules | `registeredAiScriptIds()`, `getAiScript`, and a probe of the engine's summon command for `'cindy'` |

**One shared-contract addition, additive (CONTRACT-CHANGES):** a mid-battle trigger `{ type: 'all-ko'; who: CombatantId[] }` (every listed actor is down). A trio has no single "last" sister, so the Act I seam
("the sisters fall; the cave") cannot hang on one `ko`. It is evaluated from state like `hp-below`; no existing chapter names it.

## 5. What gets built, in files (all under `src/` unless noted)

| Area | Files |
|---|---|
| ids and the formation table | `data/ffx/mirror-aeons-ids.ts` (ids; `SISTER_FORMATIONS` and `YOJIMBO_TIERS` from RE section 3; `MIRROR_ACT_I`, `MIRROR_ACT_II`) |
| the bodies and rows | `data/ffx/enemies/dark-aeons.ts` (records), `dark-aeons-abilities.ts` (rows and the game's command records, word for word), `dark-aeons-groups.ts` (the 11 formations) |
| the party | `data/ffx/builds/mirror-aeons.ts` (preset, `[estimate]`), `builds/endgame-aeons.ts` (the §6.4 formula as a pure function, pinned to the existing canonical blocks) |
| chapter | `data/chapter-mirror-aeons.ts`, `chapter-meta-mirror-aeons.ts`, one line each in `chapters-experiments.ts`, `chapter-meta.ts`, `encounters.ts` |
| scene | `scenes/mirror-aeons.ts` (two plates on one painted stage), a row in `scenes/experiment-scenes.ts` and `engine/pyreflyCanon.ts`; one departure row (`dark-yojimbo`: the body stays, RE section 4.1) |
| story, guide, advisor | `story/scripts/mirror-aeons.ts` (our own words, `research/writing-bible.md`), `data/guides/mirror-aeons.ts` + docs, `engine/tactics/mirror-aeons.ts` (+ index lines) |
| the word | `app/screens/frontend/yojimboDoor.ts` and a row in `chapterDoors.ts` |
| seams | `battle/ffx/ai/dark-aeons-seams.ts`, `dark-aeons-setup.ts`; the `all-ko` trigger in `battle/common/types.ts` and `battle/ffx/triggers.ts` |
| tests, bench, records | `tests/unit/chapters/mirror-aeons-*.test.ts`, `tests/unit/yojimbo-door.test.ts`, the helper above; `docs/CONTRACT-CHANGES.md`, `CHANGELOG.md`, the handoff, `NOW.md` |

## 6. The word

`zanmato` (the brief's suggestion) **cannot be typed on the board**: its first letter Z is `confirm` in `app/Input.ts` `KEY_MAP`, and the first letter of a word is never claimed by the door
(`WordDoor.continued` is true only for later letters; `chapter-doors.test.ts` pins "the first letter is never claimed"), so the first press would open the card under the cursor. `gagazet`'s Z is its fourth letter
and is claimed. A first-letter confirm needs a change to the board's shared input, which this lane will not make. **`yojimbo`** instead: Y, O, J, I, B are bound to nothing, M is `select` and is claimed as a later
letter. Overlap rule (no word begins with, ends with or contains another; no end of one is the beginning of another): it ends in `o` (no word starts with `o`, `bo`, `mbo`, `imbo`, `jimbo` or `ojimbo`) and begins
with `y` (no word ends with `y`, `yo`, `yoj`, `yoji`, `yojim` or `yojimb`), so it overlaps `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor`, `gagazet` and `angra` in no position.
Pinned by `tests/unit/chapter-doors.test.ts` (the table gains the row) and the new door suite with every sibling word in both orders.

## 7. Risks and how each is checked

| # | Risk | Closure |
|---|---|---|
| R1 | The trio's opening Delta Attack ends Act I before the party acts (the guides: many players are "defeated very quickly") | the bench's rung ladder; the party's First Strike on one member (StrategyWiki lists it) is a preset estimate; the formation pick falls back one rung before any number moves; the guide's first tip says to summon an aeon as fodder |
| R2 | The default fight is too easy while RE's AI is absent (the engine's fallback is a plain Attack) | the handoff says so; the bench skips and prints the reason; nothing is tuned against the fallback |
| R3 | The player's aeons in the build crash the summon menu (Yojimbo and Cindy, Sandy, Mindy are in no other build) | a probe in the seams test summons each through the real engine; the result goes in the handoff |
| R4 | The estimate preset is taken for game data | one module, the handoff's first table, every cell tagged `[estimate]` with its source |
| R5 | A second backdrop on one painted stage (Mushroom plate, then the Cavern plate) lights wrongly | `scenes/mirror-aeons.ts` keeps each plate's own sampled bands; a browser frame per act is the check |
| R6 | A shared file ends over 400 lines (`data/ffx/index.ts` is 399) | the new data joins one barrel with Biran and Yenke's (`enemies/hidden-ffx.ts`); line counts checked |
| R7 | The trigger addition moves another chapter | the evaluator's new case is reached only by the new condition; the 18 FFX goldens are the net |
| R8 | The art | no art is made: the Dark aeons reuse the aeons' own paintings (the possessed aeons' precedent); Dark variants are Bailey's pick |

## 8. Tests, the proof

Unit: the records and the loot against the note, field by field; the 11 formations (monster slots, battle ids, stage ids, start gauges, escape off); the command records equal the kernel fixture word for word;
the aeon formula reproduces `AEON_CANONICAL_STATS` for the three declared Yuna profiles; the preset; the chapter record (not in `CHAPTERS`, found by `getChapter`, number 27, board still 18, the store takes the
attempt and the clear, the save byte-identical); the chain (Act I to Act II, the plate, the seam on `all-ko`); the door (real `Input`, real board, real title screen, every sibling word); the pause metadata; the
story lint; the guide and advisor registrations; the scene and canon rows; the seams. Then `tsc --noEmit`, `node tools/orphans.mjs`, `node tools/audio/qa.mjs`. Browser: a production build of this tree in a
separate folder (`vite build` with `BASE_PATH=/` from PowerShell, one dist), headless Playwright from node: the word opens party prep, a frame of party prep, the opening on each act's backdrop; the other words still
work. Frames under `docs/screenshots/ch-mirror-aeons/`, each looked at.

## 9. Open questions (for the driver, Bailey or RE)

1. The formation pick and the preset's numbers wait for the bench, which waits for RE's AI and the engine's summon rules.
2. Dark paintings (red and black) of the four aeons, the Mushroom Rock Road and Cavern plates (both are provisional stand-ins already), and the music (no source names these fights' cues) are Bailey's picks.
3. The player's Yojimbo's starting compatibility (named estimate) and the hire answer 2 (the third reply, which Jegged and the files agree is the cheaper path).
4. Whether the five tiers should become five links (the game's own structure) instead of one tier; it multiplies Act II by five.

## 10. Update, 2026-10-15 (after the build): what the plan said and what was built

| Plan | Built | Why |
|---|---|---|
| Tidus, Yuna and Auron on the field | **Tidus, Yuna and Lulu**; Auron on the bench | Dark Mindy's Evasion is 240 (RE section 2): on the engine a Luck-60 party's blades land 0 of 55 on her, 80 percent on Sandy, all on Cindy, two in five on Dark Yojimbo; a spell never misses. GamerGuides and StrategyWiki both send a mage (Doublecast Flare or Ultima). The advisor's target rule follows: blades to Cindy and Sandy, spells to Mindy (digest C9) |
| `enemies/dark-aeons.ts`, `dark-aeons-abilities.ts`, `dark-aeons-groups.ts` | the same, plus `enemies/hidden-ffx.ts` | one barrel keeps `data/ffx/index.ts` at 399 lines |
| "the dog as a bystander" | the dog stand-in is **untargetable, takes no turns, is no part of the victory and bites on Yojimbo's order with Strength 244** | the RE session's reading of the dog's own script (the file m116) closed the note's open question about the order row 0x4086; recorded in the handoff |
| the seam on `all-ko` | built, and played on the real engine in every fall order, for the trio, a lone sister and never in Act II | |
| Act II a retry checkpoint, one results screen for both acts | `checkpointOnEntry` and `poolsChainSpoils` on the Yojimbo groups (existing flags) | the game lets the player heal at the Save Sphere between its five tiers (Jegged Yojimbo) |
| the word `yojimbo` | built; `zanmato` is the rejected word, with its control in `tests/unit/yojimbo-door.test.ts` | section 6 |
| the bench | the harness and its fallback smoke run, the reach measurement (always on), the real ladder `skipIf` the AI and the summon rules are absent | section 3 |
| the Master and Teleport Spheres | added to the item data with records at `[inferred]` table indices 0x2050 and 0x2062 | the note names the items and not their indices; every Sphere Grid item's row is the same blank row |

## 11. Update, 2026-10-15 (after the reverse-engineering session's second note, `research/re-ffx-dark-aeons.md` at 36c3cdb8, merged)

| Plan or first build | Now | Why |
|---|---|---|
| The first note's section 2.2 read the formations' call `ct_7126` as a lock on the matching aeon | **Nothing is barred:** Yuna's own Yojimbo and Magus Sisters are summonable in both acts, against their dark twins | RE note section 9: `ct_7126` is a memory pin on the aeon's loaded data; the game's real lock (script call 0x703B) is used by none of the eleven formations. Proved at the usability gate and in the summon kernel, not yet seen on screen |
| Yojimbo's starting compatibility 128, "the community says" | 128, **strongly indicated by the owner's saves, live confirmation pending** | RE's lane FFX-K asks the chapter to say so where it gives the value (`data/ffx/builds/mirror-aeons.ts`) |
| The Master and Teleport Sphere ids `[inferred]` | `[bytes]`: 0x2050 and 0x2062 | RE note 1.3 (the loot rows) |
| The start gauge 0 outside the trio formations `[inferred]` | `[bytes]` `[run]` | RE note 2.5 and 5.1 |
| Act II's default: tier 3 `nagi05_72`, the middle of the five | unchanged; **RE recommends tier 2 `nagi05_71`**, and tiers 1 to 3 are the candidates (tiers 4 and 5 leave one to two player actions between Zanmatos) | RE note 2.6; the pick stays the bench's and the driver's |
| Act I's fallbacks if the trio is out of the band: a pair, then Cindy alone | the pair `kino01_72`; or **the trio at gauge 0, which is OUR adjustment and not a game formation and must be disclosed if it is used** | RE note 2.6: the faithful trio opens with Delta Attack as the third enemy action in 87.5 percent of normal starts |
| Seams: "the engine's Yojimbo rules read the two constants" | RE's summon engine (`origin/re-parity-ffx-yojimbo-sisters`, lane FFX-K, not final) asks a build for `yojimbo` and `sisters` fields and **throws without them** | the handoff, section 5, says what the merge needs |
