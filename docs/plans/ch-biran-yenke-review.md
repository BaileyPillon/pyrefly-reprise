# Paper preflight: Biran and Yenke Ronso, a new hidden FFX chapter (branch `ch-biran-yenke`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs --paths ...` classes this work **DEEP** (the chapter registry, the FFX CTB engine's AI table and its
hit/extras path, the shared combat-core types, a scene row, the board's door table are shared systems; obligations live + focused + deep, nothing here deploys). Written 2026-10-14 ~22:20 EDT, before any
code, by the sub-agent building the chapter for the release driver.

**Authority.** Bailey, 2026-10-07 08:24:49 EDT, D-536 (his blanket yes took the driver's recommendation): "Biran and Yenke Ronso (FFX, Kimahri's solo trial)"; and tonight, verbatim, relayed by the driver:
"Please work on finishing the unimplemented chapters STAT". The driver's decisions: the chapter ships **hidden behind the typed word `gagazet`**, hidden chapter **number 25** (Fayth is 22, the Tourist Trap
23, Valefor at Besaid 24), listing it on the board waits for Bailey's word, the art is **provisional** and no approved painting is replaced, the music is an existing cue by reference. This follows the
precedent of the Sinspawn Gui chapter (FFX, hidden, `docs/handoff/ch-gui.md`) and last night's Tourist Trap and Valefor chapters.

**Game case: FFX only** (AGENTS.md rule 14). Kimahri's Lancet and Ronso Rage, CTB, the FFX statuses and the two Ronso at the Mountain Gate are FFX's; FFX-2's Gagazet mission (Garik and the Youths) is another
fight and shares nothing with this one. Shared plumbing (the registry row, the door row, one scene row, one scripted-extra dispatch line, one optional hook) is "both" (CHK-020) and inert for every other chapter.

**Verdict: PROCEED**, with the data in two layers (section 3): everything the written sources fix is built to them; everything they do not (every number of the two monsters) is a **labelled stand-in in one
place**, to be re-pinned to the game's own rows when the reverse-engineering session's note (`research/re-ffx-biran-yenke.md`) lands. The re-pin is a diff of numbers and of one script, never a redesign.

## 1. What the chapter is

- **One fight, two enemies, one party member.** Kimahri alone (`activeSlots: ['kimahri']`, the precedent is Chapter XIV's Yuna alone) against **Biran Ronso** and **Yenke Ronso** at the Mountain Gate of Mt.
  Gagazet, after Kelk grants passage and before the trail (`research/ffx-seymour-flux.md` §7.1; Jegged's Mt. Gagazet walkthrough, the "Biran and Yenke" boss battle). The battle is won when both have fallen.
- **The point is what Kimahri learns.** Lancet learns a Ronso Rage from a Ronso that carries it, and a new Rage fills his Overdrive gauge at once (`research/ffx-combat-core.md` §2.7 and §5.8;
  `ffx-seymour-flux.md` §6.1 and §7.9.2). The chapter models exactly that, in the battle (section 4); the party after the fight is the story's, not ours: nothing is saved.
- **Hidden, an experiment.** `experimental: true`: attempts, clears and time go to the experiments' own store, never the save (no schema change, no migration, not the save-data deep class); it is no
  part of "N of 18"; the board has no card; the word opens party prep.

## 2. Authority for the stage, the art and the music (all provisional)

- **Stage: Chapter I's Mt. Gagazet backdrop, reused** (the night valley with the moon, `backdrops/gagazet`). It is **not** the Mountain Gate itself (no painting of the gate exists); it is the provisional
  stand-in, said so in the handoff. The scene is a thin wrapper over Chapter I's scene (`scenes/gagazet-ronso.ts`): the same painting, lights, snow and rigs, with the staging of this fight (Kimahri's
  spot, the two Ronso's spots and heights). Chapter I's scene file is not touched.
- **Kimahri: his approved paintings** (`characters/kimahri/*`), unchanged. **Biran and Yenke are new subjects** with no painting yet: provisional paintings from a small local ComfyUI pilot (SDXL, the
  approved Kimahri as the style and anatomy reference), 6 to 12 renders each, looked at, one picked, cut out and installed as NEW subjects (`characters/biran-ronso`, `characters/yenke-ronso`) in a new
  hard-linked art mirror; nothing under an existing subject is written. Candidates only: Bailey alone approves a painting.
- **Music: existing cues by reference, no new audio.** Field bed `scene-gagazet` (the mountain's own); the fight's cue is picked from the existing FFX boss cues (open item 1 in section 9) and recorded in
  the handoff. Bailey judges music by ear (rule 13).

## 3. The data, source by source (rule 6: nothing invented), two layers

**Layer A: what the written sources fix** (built to them, tagged).

| Fact | Value | Source | Tag |
|---|---|---|---|
| The fight: Kimahri alone vs Biran and Yenke, at the Mountain Gate, after Kelk and before the trail | | `ffx-seymour-flux.md` §7.1; Jegged (Mountain Gate, "Biran and Yenke", Boss Battle) | `[verified: 2 sources]` |
| Biran carries Self-Destruct, Thrust Kick, Doom, and Mighty Guard **after he has used it once** | | `ffx-seymour-flux.md` §6.1 and its pass-2 table; `ffx-combat-core.md` §5.8; Jegged | `[verified: 2 sources]` |
| Yenke carries Fire Breath, Stone Breath, Aqua Breath, and White Wind **after he has used it once** | | the same | `[verified: 2 sources]` |
| The twelve Rage rows (rank, target, formula, DmgCon, effect) | | `ffx-combat-core.md` §5.8 | `[verified: 2 sources]` (already in `data/ffx/abilities/overdrive-kimahri-*.ts`) |
| Lancet: Magic 6, both pools, damage type Other, ignores Armored, rank 2, 0 MP, always hits; learns a Rage "where available" | | `ffx-combat-core.md` §2.7, §7.7 | `[verified: 2 sources]` (already `data/ffx/abilities/special-utility.ts`) |
| Learning a new Rage fills Kimahri's gauge at once | | `ffx-combat-core.md` §5.8; `ffx-seymour-flux.md` §7.9.2 | `[verified: 2 sources]` for the rule; the value after a learn is 100 |
| Kimahri without a fresh Rage starts the fight at about 45 percent | 45 | `ffx-seymour-flux.md` C-16, as the Cavern build already uses (`CAVERN_DOOM_PREP`) | `[estimate]` |
| Each Ronso uses Guard on the other, so regular attacks do a quarter of their damage; a Bulldoze that leaves them on opposite sides of Kimahri ends it | | Jegged | `[single source: Jegged]` |
| Each casts its Rage (Biran Mighty Guard, Yenke White Wind) once, after losing HP | | Jegged | `[single source: Jegged]` |
| Biran falls first: Yenke is Hasted for the rest of the fight. Yenke falls first: Biran is Berserk, and **a Berserk Biran cannot teach**; so learn his Rages before Yenke falls | | Jegged | `[single source: Jegged]` |
| Their HP **varies with the party's level** (no number on the page) | | Jegged | `[single source]`, no number |
| Steal: Lv. 3 Key Sphere. Drops: Return Sphere (common), Friend Sphere | | Jegged | `[single source: Jegged]` |
| Look: Biran tall, muscular, grey-blue fur, blond mane, intact horn (the largest), leather on torso, arms and legs, loincloth. Yenke tall, muscular, light fur, brown hair, **dark** horn, leather on forearms and chest only (bare upper arms) | | `visual-bible.md` §1.22.4 | `[single source: FF Wiki]` |
| Their height: a standard adult Ronso, Kimahri's own | | `visual-bible.md` §1.22.4 (the base sheet is Kimahri's) | `[estimate]` |

**Layer B: what no source in the repository gives, and the stand-in used until the game's own rows land.** The research holds the duel only as a lead-in note, and the decision record says so (D-536: "research/
holds the Biran and Yenke duel only as a lead-in note"). Unsourced: every stat of both monsters (HP, MP, STR, DEF, MAG, MDEF, AGI, ACC, EVA, LUCK), the plain Attack's record, the AP and gil, the Steal and
Drop odds, elements, status immunities, the order and odds of their moves, how Guard and Bulldoze work and when a Bulldoze leaves them on opposite sides, and when exactly "after losing HP" fires.
**The conservative reading, labelled `[stand-in: unsourced]` wherever it appears:** both Ronso carry **Kimahri's own preset block** (the Gagazet preset's STR 26, DEF 22, MAG 22, MDEF 16, AGI 18, LUCK 18,
EVA 14, ACC 14), **HP 2,310 each (his own max HP)**, MP 130, neutral to every element and no status immunity, the engine's default monster Attack, **no AP, no gil and no drops** (the sources give items
only, and the engine needs an item record for each; nothing is paid until the rows land), and an AI of: plain Attack on Kimahri, plus each Ronso's one after-use Rage once when it has lost HP, plus the
partner-down rules (Haste, Berserk). **Guard and Bulldoze are not modelled in the stand-in** (they need the rows: the engine's native Guard is a cover, and "a quarter" is not a primitive of ours); the guide says
nothing about them until they are. The numbers live in ONE module (`data/ffx/enemies/biran-yenke.ts`, a `ROWS` constant) pinned by ONE fixture, so the re-pin is a diff of numbers and of the script file.
This is the same shape the Besaid and Tourist Trap chapters had before their rows landed (their first builds were written from the written sources, then re-pinned with every change listed).

## 4. The Lancet learning model (the chapter's point)

Today Lancet is `learnsRonsoRage: true` on its ability record and **nothing reads the flag**; Kimahri's Rage list is whatever the build gives him (`overdrive.unlockedOverdriveIds`, the list the Rage
picker draws). The chapter adds the missing rule, additively:

1. **`data/ffx/ronso-rages.ts`** (data): `RAGE_LESSONS`, keyed by enemy id: `{ rage, afterUse }` rows. Biran: Thrust Kick, Self-Destruct, Doom (from the start), Mighty Guard (after use). Yenke: Aqua Breath,
   Stone Breath, Fire Breath (from the start), White Wind (after use). It holds only what the sources name; any other monster teaches nothing, as today.
2. **`battle/ffx/ronso-rage.ts`** (engine): `learnRonsoRage(ctx, user, target)`, called from `scripted.ts#runScriptedExtra` when the action's `extra.learnsRonsoRage` is true (a two-line dispatch, after a
   hit that landed). Conditions, each from a source: the user has an Overdrive record with a Rage list; the target is alive and carries lessons; the target is **not Berserk** (Jegged: a Berserk Biran cannot
   teach; generalised to any target, `[single source, generalised]`); the Rage is **not already known**; an `afterUse` Rage is taught only after the monster has used it (its AI memory holds
   `used:<rage>`). Effects: the Rage joins the list (in learn order), the gauge goes to 100 (`overdrive-gauge`, `cause: 'lancet-learn'`), a banner says so ("Kimahri learns Thrust Kick") in our words. A
   target that teaches several Rages teaches one per Lancet (the first in the table not yet known, `[estimate]`: Jegged says "learn every ability you don't already have" with Lancet, not whether one cast
   teaches all). Nothing is written to the save.
3. **Contract surface:** none. `learnsRonsoRage` already exists on the ability record; the table is data; the gauge event's `cause` is a free string. No `types.ts` change is needed, so no CONTRACT-CHANGES row
   is owed for the learning rule itself (one is written for the chapter's registry edits to `encounters.ts`, hard rule 2).
4. **Safety:** every other chapter: Lancet's extra never finds a lesson row for its target, so the function returns before it touches anything (a test pins that Lancet on a Seymour Flux, a Ghost-like
   stand-in or the Cavern's enemies changes no list and no gauge, and the FFX golden digests, 18 of them, are the net).

## 5. What gets built, in files

| File | What |
|---|---|
| `src/data/ffx/biran-yenke-ids.ts` | ids: chapter `biran-yenke`, group, the two enemy ids, script ids, the scene key `gagazet-ronso`, art keys |
| `src/data/ffx/enemies/biran-yenke.ts` (+ `biran-yenke-abilities.ts` if a record is needed) | the two bodies and the formation (`canEscape: false`, `bossId`, the music cue); `ROWS` is the stand-in block |
| `src/data/ffx/ronso-rages.ts`, `src/battle/ffx/ronso-rage.ts` | the lessons and the learn rule (section 4); one dispatch line in `battle/ffx/scripted.ts` |
| `src/battle/ffx/ai/biran-yenke.ts` (+ one import in `ai/index.ts`) | the two scripts and their hooks (after-use Rage once, partner down) |
| `src/data/ffx/builds/kimahri-trial.ts` | the party: Kimahri alone, from the Gagazet preset with what the duel teaches taken off (Mighty Guard, White Wind, Self-Destruct, Talk), his Rages `['jump']`, gauge 45 |
| `src/data/chapter-biran-yenke.ts`, `chapter-meta-biran-yenke.ts` | the record (number 25, `experimental`), the pause metadata; one line each in `chapters-experiments.ts` and `chapter-meta.ts` |
| `src/story/scripts/biran-yenke.ts` | a short opening and closing, our own words over the sourced beats (`research/writing-bible.md`) |
| `src/scenes/gagazet-ronso.ts`, a row in `scenes/experiment-scenes.ts`, a row in `engine/pyreflyCanon.ts`, two rows in `BattlePresenterDepartures.ts` | the stage; the Ronso **yield** rather than dissolve into pyreflies (they are people, beaten and alive: `[derived]` from the Leblanc, Logos and Ormi precedent, D-035) |
| `src/data/guides/biran-yenke.ts` (+ docs), `src/engine/tactics/biran-yenke.ts` (+ index and lookup lines) | the guide card and page, in our words, citing Jegged and the research; the advisor's line (Lancet first, then the Rages) |
| `src/app/screens/frontend/gagazetDoor.ts` and a row in `chapterDoors.ts` | the word |
| `src/data/encounters.ts` | `ChapterId`, `ListedChapterId` and `Chapter.number` gain the id and 25 on their existing lines (397 of 400 lines stays) |
| tests, `docs/CONTRACT-CHANGES.md`, `CHANGELOG.md`, the handoff, `NOW.md` | section 7 |

## 6. The word

`gagazet` on the board. Letters against `app/Input.ts` `KEY_MAP`: **G** is nothing, **A** is `left`, **Z** is `confirm`, **E** is `start`, **T** is nothing. The two board keys inside it are claimed by the word
(`WordDoor.continued`, the screen's `wordKey` consumes `left`, `right`, `up`, `down`, `confirm` and `cancel`), so the A never moves the cursor and **the Z never opens the card the cursor stands on** (the first
door with a `confirm` letter; pinned with the real `Input` and the real board); `start` is ignored by the board; the last letter T is bound to nothing and the board's next frame (`opening`) takes every press
before party prep can see it. On the title screen Enter, Space, Z and E advance, so a word with a Z and an E cannot be typed there: it is typed on the board, as the others are. **Overlap rule** (no word
begins, ends or contains another; no end of one is the beginning of another): `gagazet` ends in `t` (none of `limit`, `leblanc`, `experiment`, `mushroom`, `fayth`, `daigoro`, `valefor` begins with `t`, `et`,
`zet`, ...) and begins with `g` (none ends in `g`, `ga`, `gag`, ...). Checked by script against the table before this plan, and pinned by `tests/unit/chapter-doors.test.ts` (the table gains the row) and the new door
suite (run with every sibling word, in both orders).

## 7. Tests (written with the code)

Unit: the lessons (Biran's four and Yenke's four, `afterUse` flags, nothing for any other enemy); the learn rule in the real engine (Lancet on Biran learns a Rage, fills the gauge to 100, the list grows in
order, a second Lancet learns the next, a known Rage learns nothing, a Berserk Biran teaches nothing, Mighty Guard only after he has used it, a missed or dead target teaches nothing, Lancet on any other
enemy changes nothing); the data against a fixture (`tests/fixtures/parity/ffx/biran_yenke_rows.json`: the stand-in block, marked `standIn: true` until the game's rows replace it, with a test that fails
the day the rows exist and the fixture still says stand-in); the AI on seeded runs (the Rage once after losing HP, never twice, Haste on Yenke when Biran falls, Berserk on Biran when Yenke falls); the build
(Kimahri alone, his Rage list, the gauge); the chapter record (not in `CHAPTERS` or `CHAPTER_IDS`, found by `getChapter`, number 25, the board still 18, the experiments' store takes the attempt and the clear
and the save is byte-identical); the door (real `Input`, real board, real title screen, every sibling word); the pause metadata; the story lint; the guide and advisor registrations; the scene row
and the canon row; a bench (the advisor's line and a naive line, measured and never tuned). Then `tsc --noEmit`, `node tools/orphans.mjs`, `node tools/audio/qa.mjs`, and the full suite once
(`--maxWorkers=2`, temp on the second drive). Browser: a production build of this tree (one dist, outside the repository tree, vite directly with `BASE_PATH='/'`, never `npm run build`), headless
Playwright from node: the word opens the chapter, the opening plays, the first menu (Kimahri alone), a win, a loss, Lancet learning in the real menu, the other words still work, the board stays "of 18";
frames under `docs/screenshots/ch-biran-yenke/`, each looked at.

## 8. Risks and how each is checked

| # | Risk | Closure |
|---|---|---|
| R1 | The stand-in numbers are taken for game data | one module, one fixture marked `standIn`, the handoff's first table, no number quoted in the guide or the Sensor lines |
| R2 | The learn rule moves another chapter | gated on a lesson row (only Biran and Yenke have one); Lancet's other uses return before any write; golden digests unchanged |
| R3 | `Z` (`confirm`) in the word opens the card under the cursor | the screen's `wordKey` consumes `confirm`; a real-key test types the word on the real board with a card selected and asserts no chapter opens but the Gagazet one |
| R4 | A solo party breaks a surface that assumed three (prep, CTB list, results, the advisor's roster) | Chapter XIV already fields Yuna alone; the browser proof and the suites over `activeSlots` length one are the check |
| R5 | Self-Destruct (a Rage Kimahri can learn here) ejects the only party member | it is the Rage's row (`destroys-user`); the guide warns, the advisor never picks it, and a test shows the engine ends the battle as a defeat (not a hang) |
| R6 | New art overwrites or mimics an approved painting | new subject folders only, a hard-link mirror that never writes into a linked file, the approved Kimahri only read |
| R7 | Disk | one dist and every temp and staging folder on the second drive; only the picked PNGs and their sidecars go into the mirror; a free-space check before any step that writes more than a gigabyte |
| R8 | The game's rows land mid-build and disagree | section 10 |

## 9. Open points

1. **Music.** The fight needs a cue by reference. The candidates are the existing FFX boss cues (`boss-seymour` is Chapter I's, played on this same mountain; `boss-challenge`; `boss-yojimbo`). No source says
   what plays in the game for this fight (`docs/audio/THEMES.md` names none). The pick and its reason go in the handoff; Bailey's ear decides.
2. **Listing** the chapter on the board waits for Bailey, as for the other hidden chapters.
3. **The Mountain Gate painting** (the stage is Chapter I's valley), the paintings of the two Ronso (provisional), a victory or yield pose for them, and the music are Bailey's picks.

## 10. The re-pin plan (when `research/re-ffx-biran-yenke.md` lands)

1. Read the note against section 3 row by row; write every disagreement with this plan and with the written sources into the handoff, each with the row as its source (the Besaid and Tourist Trap handoffs
   are the format).
2. Replace `ROWS` and the fixture with the game's rows; the fixture loses `standIn`; add the rows' own columns the engine reads (immunities, elements, plain Attack record, AP, gil, drops, Zanmato byte).
3. Replace the stand-in script with the game's own (the move order, the Guard, the Bulldoze, the partner-down rules, the HP-loss trigger); keep the learning rule's table to what the rows say (`afterUse`,
   which Rages, whether Berserk blocks, how many per cast).
4. Re-measure the bench (never tune), update the guide, the advisor line and the Sensor lines to the rows, re-run the suites and the browser proof.

## 11. Update, 2026-10-14 (after the build): what the plan said and what was built

The plan above was written before any code and before the reverse-engineering note landed; the note (`research/re-ffx-biran-yenke.md`, merged as 0d62b069) made section 10 the plan, and the stand-in layer of section 3 was never built.
Where the text above and the build differ, **the build wins**; the differences, each with its reason:

| Plan (sections 3, 4, 5, 7) | Built | Why |
|---|---|---|
| Layer B: a labelled stand-in block (`ROWS`), one fixture marked `standIn: true`, no Guard or Bulldoze | **No stand-in anywhere.** Both records, the loot, the move rows, the formation, the two scripts, the sides, the defence swap and the stats derived from Kimahri's are the note's, and `biran-yenke-data.test.ts`, `biran-yenke-stats.test.ts` and `biran-yenke-engine.test.ts` pin them to it | The note landed before the build started |
| The lessons table in data (`data/ffx/ronso-rages.ts`) | `battle/ffx/ronso-rage.ts` | `src/battle/**` imports no `src/data` (hard rule 1); the ids are copied there and pinned by the data test |
| "A Berserk Biran cannot teach" (Jegged), built as a block on every Berserk target | A Berserk Biran **still teaches** Thrust Kick, Self-Destruct and Doom; only his Mighty Guard is lost, because his half-HP action is cancelled when Yenke falls first (RE sections 5.4, 5.5, 7) | The note is the game's own file and wins over the walkthrough (rule 6); the guide's advice is true under both, and the disagreement is in the handoff |
| The gate on "after use" Rages opens when the monster has used the Rage | It opens when he **queues** it at half strength (not when it resolves), and only if his brother still lives (RE section 7) | The note's decoded gate |
| "The fixture `tests/fixtures/parity/ffx/biran_yenke_rows.json`" | None; the values are asserted directly against the note in `biran-yenke-data.test.ts` | There was nothing to re-pin |
| Music "picked from the existing FFX boss cues" (open item 1) | `boss-challenge` (the generic boss cue Chapter II and the Gui guest hour play), the mountain's own bed `scene-gagazet` for the scene | No source names this fight's cue; Bailey's ear decides |
| Kimahri: "the Gagazet preset with what the duel teaches taken off, his Rages `['jump']`, gauge 45" | As planned (`data/ffx/builds/kimahri-trial.ts`, one constant `KIMAHRI_KEEPS_THE_PRESETS_RAGES`), also lacking Talk; the driver accepted the call | The preset already holds Mighty Guard and White Wind, which this fight teaches |
| Open item: "a stand-in drop table" | One drop slot that pays **one** item (`ItemDrop.rare`, a contract field added at the RE review) | The game gives exactly one item from one slot |

Added after the RE review of 09b3f268 and 4281febc (all pinned by tests): the seven command records the data-layer test asked for, the contract note for `encounters.ts` and `types.ts`, the data index folded back under 400 lines, the
script stream's one draw per non-lethal hit on a brother (no dialogue), the guard released only while Sentinel is on. New research file: `research/ffx-biran-yenke.md` (what the written sources say, and where the game's file overrules them).
Not changed from the plan: the word `gagazet` and its Z (section 6), the hidden number 25, the registry shape, the provisional art (two new subjects in a new art mirror, nothing approved replaced).
