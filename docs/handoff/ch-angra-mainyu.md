# Angra Mainyu: a hidden FFX-2 chapter (the Bikanel excavation camp, FFX-2 Chapter 5)

**Branch `claude/vigilant-galileo-h6yf7j`** (from main 8934a41b), pushed; **not merged, not deployed, no review run.** **Game case: FFX-2 only** (AGENTS.md rule 14): ATB, dresspheres and the FFX-2 status set; Angra Mainyu and his arms exist only in FFX-2 (the name belongs to unrelated monsters elsewhere in the series). The shared plumbing (one door row, the registries, one more figure on the Experiment's plate) is "both" as plumbing (CHK-020) and inert for every other chapter.
**Status: built end to end, hidden, provisional art, the weakest-sourced chapter of the project** (no game row of the three monsters was read). It is not on the board, not in "of 18", not listed anywhere; it opens only by a typed word. Listing it waits for Bailey's word after he has played it (D-848), and the research says it should not be listed before the reverse-engineering session has read the three rows and the script. Built in the same session as the FFX chapter Biran and Yenke ([ch-biran-yenke](ch-biran-yenke.md)).

Bailey, 2026-10-15, verbatim: "Implement the unimplemented chapters please." and "I would like to add, don't just implement the unimplemented chapters. Implement the unimplemented chapters end-to-end please. It needs to be a finished product. Thank you ❤️ . it is lovely working ont his project with you!" The unimplemented chapters are D-536's (2026-10-07, on D-520): Biran and Yenke and this one. The reading, following D-842, D-843 and D-848: **hidden behind a typed word**, hidden chapter number **26**, **provisional** art (approved paintings reused, nothing replaced), an existing cue by reference. Recorded as D-851.

## 1. Play it

1. From the title, reach the chapter-select board (the title begins on Enter, Space, Z, E or C; the word is typed on the board).
2. Type `angra` (any case, letters at most 2 s apart). **It opens party prep itself**, with no card and no sound. The first A is a press of `left`, so the cursor takes one step before the board leaves (a first letter cannot be claimed: the board cannot know a word is coming; the `daigoro` precedent, whose D is `right`); N and G are bound to nothing, R is R1 (not a board action), and the last A belongs to the live match, so no second step and nothing latched for party prep. Enter starts it: the opening scene (Enter steps it), then the fight.
3. Pinned with the real `Input`, the real board and the real title screen in `tests/unit/angra-door.test.ts` (22 tests), and against every other door word (and `kimahri`) there and in `tests/unit/chapter-doors.test.ts` (nine doors).
4. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration.

## 2. What it is

One battle, one link: **Angra Mainyu** and his two arms, **Tawrich** (right) and **Zarich** (left), against the Chapter 5 party (`data/ffx2/builds/farplane.ts`: Yuna 46 White Mage, Rikku 48 and Paine 50 Dark Knights; `[estimate]`, the same preset Chapters V and XI and the Experiment stand on; the party every strategy source fights him with).

| | Angra Mainyu | Tawrich | Zarich |
|---|---|---|---|
| Level, HP, MP | 47, **333,444**, 9,999 | 38, 5,440, 9,999 | 36, 5,440, 9,999 |
| Str / Def / Mag / MDef | 73 / 97 / 124 / 114 | 85 / 99 / 42 / 1 (`[estimate]`) | 42 / 70 / 85 / 99 (Def sourced, the rest `[estimate]`) |
| Agi / Eva / Acc / Luck | 68 / 0 / 2 / 0 | 113 / 0 / 99 / 0 (`[estimate]`) | 82 / 0 / 99 / 0 (Agi, Acc sourced) |
| Guard | none; immune to Gravity | **Null Magic, permanent** | **Null Physical, permanent** |
| Rewards | 5,000 EXP, 30 AP, 5,000 gil, Pilfer Gil 2,000; steal a Megalixir; drop the **Ribbon** | nothing | nothing |

| | |
|---|---|
| His turn | (1) an arm down and 60 MP: **Full-Life** on it (Tawrich first); (2) an arm down and less: **Osmose** on a random girl; (3) both arms up and the Flame due (his first turn, or the seventh of his turns since the last): **Perdition's Flame**; (4) else Demi, Flare or Curaga at equal odds, any he cannot pay for becoming Osmose. Every turn counts toward the Flame's clock, a revive included, so arms kept down make the Flame wait and it comes the first turn both stand again |
| Perdition's Flame | **ten hits on random girls, each 3/16 of her maximum HP**, physical (**Protect halves each hit**), never misses; each later hit on the same girl lands harder (the chain); a girl who falls mid-Flame takes no more of hers (the engine drops hits on a fallen target). Called out as it is chosen; a Flame chosen while both arms stand goes off even if they fall during its charge (one GameFAQs poster's reading of the one Flame he saw with the arms down, conflict A-4) |
| The arms | **Tawrich**: Bloody Breath on every girl one turn in three (Confusion, Silence, Darkness, Poison, each at 50 `[estimate]`), else Punch on a random girl. **Zarich**: Glimmer of Despair on every girl one turn in five (3/16 of current MP, absorbed `[estimate]`, and Strength, Magic, Defense and Magic Defense one stage down), else an -ara (two in five) or -aga (two in five) spell of a random element on a random girl. Odds `[estimate]` |
| Guards | the engine's permanent automatic statuses `null-magic` and `null-physical` (the Vegnagun Nodes' precedent): Dispel never removes them, **they survive the arm's fall and its Full-Life**, and **the Dark Knight's Darkness passes both** (its row's damage flags are 0) |
| Victory | **the body falls, whoever stands**: the arms are parts and never decide the battle |
| Stage | the Machine Faction's grounds (`backdrops/ffx2-experiment-grounds`, the hidden Experiment's plate), the provisional stand-in for the excavation camp (a dig site of the same kind); the body on the Experiment's spot at its giant's height; the arms figure-less on his painting, hung either side of his chest (the D-044 overhead anchors), Tawrich on the viewer's left |
| Art | the body is drawn from **Chapter XI's approved `x2-anima` set** (a dark giant of the same game); the arms have no painting. No painting of the three exists and no source described his look |
| Music | `scene-bevelle-underground` (the FFX-2 field bed), the fight `boss-ffx2-fallen-aeons` (our own take on the "Aeons" role the game gives it, research §8, `[single source]`), `victory-ffx2`. **Bailey's call by ear (rule 13)** |
| Action time | **ON at 3 s, kept by precedent (D-846)**, awaiting his pick for this chapter (`ANGRA_ACTION_TIME_ON`); the bench measures it both ways |
| Story | the opening (the Gatekeepers calm the storm, the fiend from the dig sites turns on the camp, "two of them, attached", Yuna's go-call), two mid-battle beats (the first Flame: "Both arms were up. Keep them down."; the first Full-Life), the close (it sinks into the sand, the one sincere beat, the Ribbon). Every line is ours, in the writing bible's FFX-2 voices; Nhadala is named, not staged |
| Guide | a card (the Wait habit, 5 rules, 9 hints, a watch line for the Flame, a phase note) and a page; the advisor's tactic (`engine/tactics/ffx2-angra-mainyu.ts`) is the line the bench measures: two Dark Knights on Darkness (drinking when low, raising Yuna), Yuna reviving, healing herself first, **Protect while both arms stand**, cleansing Bloody Breath (Confusion first), Curaga, Pray |

## 3. The data, source by source

`research/ffx2-angra-mainyu.md`. **No row of these three monsters was read** (§0.2: none is in the repository's fixtures, no game files exist here, and the session's network policy refused the wiki and guide hosts, so every written fact was read through the web search tool's summaries, `[search: N sources]`). Each number is one of:

- **a written source's**, tagged with how many pages the summaries named (HP 333,444 `[search: 5 sources]`; the Flame's ten hits of 3/16 `[search: 3 sources]`; the arms' immunities `[search: 3 sources]`; the Ribbon `[search: 3 sources]`), with six conflicts resolved in §11.1 (Str 73 or 23, inert; MP 9,999 or 6,666; the arms' 5,440 or 5,540; the Flame with both arms or one; the seven-turn clock; 3/16 or "16.75 %");
- **a stand-in row of the game's own table**, another monster's, already in the repository and pinned to the Steam build (`data/ffx2/command-records/angra-mainyu.ts`, copied from its users so the two cannot drift): Demi 0x3082 (Trema's), Flare 0x41fa (the Nodes'), Curaga 0x30b5 (the party's), Full-Life 0x4069 (Vegnagun's Core), Osmose 0x406d (Leblanc's), the -ara rows 0x41ed to 0x41f0 and the -aga rows 0x41f1 to 0x41f4. Perdition's Flame, Punch, Bloody Breath and Glimmer of Despair have no row and are derived from the abilities' own fields;
- **an estimate**, said as one: the arms' unread stats (§2.4's stated method), the three's status lists beyond his Darkness immunity (the common FFX-2 boss list of the repository's read rows), the move odds, Full-Life's 60 MP, Bloody Breath's chance, Glimmer's fraction.

**What the estimates do to the fight, measured:** Flare is the shared monster row (power 30) cast with his sourced Magic 124, so it takes **about two-thirds of a girl's maximum HP** (mean 3,947 on Paine, 1,704 on Yuna, at most 2,382 of her 2,488); if his real Flare is weaker, the fight is easier. **Not modelled, said plainly:** the dig-site encounters of Chapters 1 to 3 (an unwinnable ejection) and the HP they wear off him (the chapter's fight is fresh).

## 4. Difficulty: measured, not tuned (rule 6)

`tests/unit/chapters/angra-mainyu-bench.test.ts`, 40 seeds a cell (a fight runs about ten minutes of game time). Advisor: the shipped move advisor. Naive: no Darkness, no Protect, no cleansing (the girls swing at the body, Yuna cures below 40 %).

| line | mode | wins | minutes | minutes of a win | his actions | Flames | arm falls | arm revives | KOs | losses |
|---|---|---|---|---|---|---|---|---|---|---|
| advisor | bench (0 ms), action time on | 24/40 | 11.87 | 10.39 | 42.38 | 2.80 | 34.65 | 33.83 | 4.10 | 16 |
| advisor | bench (0 ms), action time OFF | 36/40 | 6.42 | 6.17 | 24.48 | 1.30 | 22.93 | 21.55 | 1.00 | 4 |
| advisor | Wait split 1.5 s, action time on | 23/40 | 12.22 | 11.20 | 43.50 | 2.67 | 35.42 | 34.63 | 4.92 | 17 |
| advisor | Wait split 1.5 s, action time OFF | 31/40 | 6.69 | 6.86 | 25.65 | 1.40 | 23.40 | 22.23 | 1.63 | 9 |
| naive | bench (0 ms), action time on | 0/40 | 0.83 | - | 4.97 | 1.30 | 0.00 | 0.00 | 3.90 | 40 |
| naive | bench (0 ms), action time OFF | 0/40 | 0.48 | - | 3.60 | 1.10 | 0.00 | 0.00 | 3.60 | 40 |
| naive | Wait split 1.5 s, action time on | 0/40 | 0.82 | - | 5.00 | 1.23 | 0.00 | 0.00 | 4.03 | 40 |
| naive | Wait split 1.5 s, action time OFF | 0/40 | 0.45 | - | 3.38 | 1.02 | 0.00 | 0.00 | 3.45 | 40 |

**Reading it.** It is the hardest of the hidden chapters: with action time on (the precedent) the guide's line wins about three fights in five, at human speed too, in about eleven minutes; with it off, nine in ten at bench speed and about three in four at human speed, in about seven. Without the trick (Darkness, Protect) nothing wins. The lesson shows in the numbers: the arms fall about 35 times a fight and come back every time, and he looses fewer Flames than his clock alone would (2.8 against about 6). **What kills, in the 16 lost fights at bench speed with action time on:** Perdition's Flame 90 of the girls' knock-outs, Flare 34, Zarich's spells 19, Tawrich's Punch 17 (each knock-out counted against the move its source had in flight). **Measured and left out of the advisor's line** (same 40 seeds, bench speed, action time on, against the line's 24 wins): adding Shell 22, Protect kept up while an arm is down 23, both 21, both with Shell before cleansing 17, both with Confusion cleansed first 22 (with action time off: 33, 37, 34, 34 and 34 against 36). **Bailey's pick:** action time on or off for this chapter (D-846 is the precedent; the numbers are both ways above). No boss number moved.

## 5. Art (provisional)

The body wears Chapter XI's approved `x2-anima` paintings; the arms are figure-less (a ring and a plate on his painting, as Vegnagun's Redoubts and Bulwarks); the camp is the Experiment's grounds plate; the pause card falls back to the stand-in's idle painting. **Briefs for Bailey's pick (rule 9; art generation is OFF):** Angra Mainyu himself (the sources describe no look; the FF Wiki's concept art was not described by any summary: a huge desert fiend with a body and two independent arms, Tawrich the right, Zarich the left, "the same, but mirrored"), the two arms as paintings of their own, and a Bikanel desert plate (the Al Bhed excavation camp: sand, machina, tents, lamps). Each needs his pick first; none is made.

## 6. Files and merge hot spots

New: `research/ffx2-angra-mainyu.md`; `src/data/angra-mainyu-ids.ts`, `data/ffx2/enemies/angra-mainyu.ts`, `angra-mainyu-abilities.ts`, `data/ffx2/command-records/angra-mainyu.ts`, `data/chapter-ffx2-angra-mainyu.ts`, `chapter-meta-ffx2-angra-mainyu.ts`; `src/battle/ffx2/ai/angra-mainyu.ts`; `src/story/scripts/ffx2-angra-mainyu.ts`; `src/app/screens/frontend/angraDoor.ts`; `src/engine/tactics/ffx2-angra-mainyu.ts`; `src/data/guides/ffx2-angra-mainyu.ts`, `guides/docs/ffx2-angra-mainyu.ts`; the tests listed in section 8, with `tests/unit/helpers/angraDrive.ts` and the browser support `tests/e2e/support/hidden-chapter-play.ts`.

Shared files, one line or one block each (**merge hot spots** with any branch that adds a chapter): `data/encounters.ts` (contract: the unions gain the id, `Chapter.number` gains 26; `docs/CONTRACT-CHANGES.md`), `data/chapters-experiments.ts`, `data/chapter-meta-unlisted.ts`, `data/ffx2/enemies/index.ts`, `data/ffx2/command-records/index.ts`, `data/ffx2/items/held.ts` (the `ribbon` row, its ward the accessory table's; no price in the research), `battle/ffx2/ai/index.ts`, `scenes/experiment-grounds.ts` (his spot, height and the arms' anchors; inert for the Experiment, which fields none of these ids), `app/screens/frontend/chapterDoors.ts`, the guide and tactic registries. Shared tests that count every chapter gained his row: `chapter-doors`, `chapter-numbers`, `audio-music-batch1-2026-10-10` (the aeon cue's chapters), `audio-music-batch2-2026-10-12`, `chapters/trema-options` (the formations that carry action time), `chapters/experiment-scene` (the spot he shares), `guide-ffx2-wait-habit`, `ffx2-steal-item-names` (the `ribbon` row has no price in the research).

## 7. Open points for Bailey and the driver

1. **Play it, then say whether to list it** (D-848). The word is `angra`. The research's own advice: not before the RE session has read his rows.
2. **Action time on or off** for this chapter (section 4).
3. **Art**: the briefs in section 5 (rule 9). **Music by ear** (rule 13).
4. **Verify before listing** (research §11.2): Perdition's Flame (the 3/16, the ten hits, physical, its accuracy); the arms' stats and HP; the turn rules and the arms' odds; Full-Life's MP cost; Bloody Breath's chance and targets; Glimmer of Despair's fraction; his status list beyond Darkness.
5. **RE questions** (research §12): the three monster rows; his script (the order of its checks, the Flame's clock, the weights of the random pool, and whether the Flame is also in it); the arms' scripts; the rows of Perdition's Flame, Bloody Breath and Glimmer of Despair and of the Demi, Flare, Curaga, Full-Life and Osmose he uses; Full-Life's MP cost.
6. **Deploy + review owed**: the critic plan classes the change DEEP (the FFX-2 ATB engine's AI table and the chapter registry are shared systems): a focused review of the production candidate before any deploy, the deep review on the live build after. Nothing was deployed from this cloud session (no art, no deploy tooling).

## 8. Tests and verification

- `tests/unit/chapters/angra-mainyu-data.test.ts` (21: the ids every layer keeps agree, the records against the research table, the stand-in rows equal their users', the chapter's registration), `angra-mainyu-engine.test.ts` (16: the decision table with exact draws, and on the real engine the opening Flame, 3/16 times the chain halved by Protect, Darkness through both guards and the immune misses, the guard surviving the revive, Osmose absorbed, the clock exact with no arm down, no Flame chosen with an arm down, victory with both arms up and the rewards), `angra-mainyu-story.test.ts` (10: the scenes lint, both beats fire on the real engine, the voices), `angra-mainyu-bench.test.ts` (3, about 2.5 minutes), `tests/unit/angra-door.test.ts` (22): all pass, with every shared suite listed in section 6.
- `npx tsc --noEmit` clean; `node tools/orphans.mjs`: every new module reachable from `src/main.ts`, the orphan list unchanged at 28.
- The full suite: running when this file was first committed; the result follows in the records commit after it.
- The browser: a real-input run against the dev server (`tests/e2e/ffx2-angra-mainyu.spec.ts`) follows the first commit; its result and frames follow in the records commit after it.

## 9. For the driver: NOW.md line and release notes

NOW.md: "Angra Mainyu (FFX-2, hidden chapter 26, word `angra`; D-851) is built on branch claude/vigilant-galileo-h6yf7j with Biran and Yenke (FFX, 25, `kimahri`; D-850): not merged, not deployed, focused and deep reviews owed; listing waits for Bailey (D-848) and, by the research's advice, for the RE session's rows; action time on or off is his pick." CHANGELOG: the lane entry "2026-10-15 · Two hidden chapters" (not live) is to be folded into the release entry of the build that ships it.
