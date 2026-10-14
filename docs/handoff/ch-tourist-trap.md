# Tourist Trap: Yojimbo and Daigoro in the Cavern of the Stolen Fayth (a hidden FFX-2 chapter)

**Status (2026-10-14, overnight build for Bailey, via the release driver):** built, tested and proved in a production build in a browser; **not merged and not deployed**. Branch `ch-tourist-trap`
(from `origin/r46-rc` ca9fd0b4), worktree `D:\pyrefly-ch-tourist-trap`. Tip: see the last line of this file.

**Authority (Bailey, 2026-10-13/14, verbatim, via the driver):** "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and "full speed ahead
while I sleep". The driver's decisions: the chapter ships **hidden behind the typed word `daigoro`**, hidden chapter **number 23** (Fayth is 22), listing it on the board waits for Bailey's word, the art is
provisional and reuses approved paintings (nothing replaced), the music is an existing cue by reference. Valefor at Besaid is another agent's chapter on its own branch.

**Game case: FFX-2 only** (AGENTS.md rule 14). The optional mission is FFX-2 (ATB, dresspheres, the FFX-2 rows, an action-counter AI whose Zanmato is NOT FFX's 9,999 but "1 HP and 1 MP":
`research/ffx-yojimbo.md` section 0.3). The FFX Chapter IX (`yojimbo-cavern`, Lady Ginnem's Yojimbo) is a different fight with different rows; nothing of its data is reused, only two of its paintings and its plate.
The shared plumbing (the chapter registry, one door row, one scene row, three additive engine pieces) is "both" (CHK-020) and is inert for every other chapter.

## What Bailey should see first

1. On the chapter board type **`daigoro`** (D, A, I, G, O, R, O on the keyboard; the first D moves the cursor one step, the board then leaves for the chapter). No card on the board changes: there is none.
2. The pause screen and party prep say **EXP**; the opening line plays; the first menu is a White Mage (Yuna) and two Dark Knights (Rikku, Paine) at Lv 32 / 33 / 34, facing Yojimbo with Daigoro at his feet.
3. Fight it as the guide says: **Protect early, heal the turn after Zanmato (a Mega-Potion from the bag needs no MP), cure the Poison Kozuka leaves.** Zanmato is the 14th poll of the counter, about seven attacks in
   (four to ten in 96 percent of cycles). The banner names each move, and Zanmato's wind-up is the charge bar filling.
4. Look at: the intent slab names Yojimbo's real next move (or Daigoro's bite when he is called), the dog never takes a menu cursor, and the board shows no card for the chapter.

## What was built

| Area | Files (all under `src/` unless noted) |
|---|---|
| Data: the two bodies, the formation, five abilities | `data/ffx2/enemies/tourist-trap.ts`, `tourist-trap-abilities.ts`; ids `data/tourist-trap-ids.ts` |
| The game's own rows | `data/ffx2/command-records/tourist-trap.ts` (0x40a1 to 0x40a5), `data/ffx2/monster-records/records-tourist-trap.ts` (rows 170 and 174); pinned by `tests/fixtures/parity/ffx2/tourist_trap_rows.json` |
| AI | `battle/ffx2/ai/tourist-trap.ts` (`x2-yojimbo`: the poll; `x2-daigoro`: the bite or sleep), registered in `ai/index.ts` |
| Chapter record, pause metadata | `data/chapter-ffx2-tourist-trap.ts`, `data/chapter-meta-ffx2-tourist-trap.ts` (in `UNLISTED_CHAPTER_META`), `data/chapters-experiments.ts`, `data/encounters.ts` (id, listed exclusion, number 23) |
| Story | `story/scripts/ffx2-tourist-trap.ts`: a short opening and closing and two mid-fight callouts (first Kozuka, first Zanmato), our own words |
| Stage | `scenes/tourist-trap-cavern.ts` (the approved `cavern-stolen-fayth` plate under the FFX-2 camera rig), rows in `scenes/experiment-scenes.ts` and `engine/pyreflyCanon.ts` |
| Guide, advisor | `data/guides/ffx2-tourist-trap.ts`, `data/guides/docs/ffx2-tourist-trap.ts`, `engine/tactics/ffx2-tourist-trap.ts` (+ registries) |
| The word | `app/screens/frontend/daigoroDoor.ts` and one row in `chapterDoors.ts` |
| Additive engine pieces | `battle/ffx2/ai/idle.ts` (`WAKE_ON_FLAG`, `AI_REPOLL`, `AI_NO_INTENT`), `battle/ffx2/atb-engine.ts` (`wakeIdleNow`), `battle/ffx2/intent.ts` (the dry run follows polls that are not turns and skips a sleeper) |
| A held item | `data/ffx2/items/held.ts`: one row, **Power Wrist** (Yojimbo's steal; Str +20, buy 6,000, `research/ffx2-combat-core.md` §5.4), because every FFX-2 steal id must have an `ItemDef` (`ffx2-steal-item-names.test.ts`) |
| Tests | `tests/unit/chapters/tourist-trap-{engine,chapter,bench}.test.ts`, `tests/unit/daigoro-door.test.ts`, `tests/unit/helpers/touristTrapDrive.ts`; edited: `chapter-doors.test.ts` (six words), `guide-ffx2-wait-habit.test.ts`, `data-ffx2-monster-records.test.ts`, `data-ffx2-command-records.test.ts` (the chapter's rows are skipped by the older tables' all-rows checks, by name) |

No source file added is over 400 lines (hard rule 7). **Two files the change touches already exceed it:** `battle/ffx2/intent.ts` is 771 lines (756 before this branch; the dry-run piece adds 15; pre-existing
over 400, not split here) and the test files `tourist-trap-engine.test.ts` (764) and `daigoro-door.test.ts` (417), which follow the repo's practice for tests (107 of the 1,219 unit test files are over 400, these two included).
`encounters.ts` stays at 397 (the three edits are inside existing lines).

## The data, its sources and tags (rule 6: nothing invented)

Sources, in order of weight: **the RE parity session's reading of the live Steam build** (`research/re-ffx2-yojimbo-valefor.md`: `monster.bin` rows 170 and 174; and its review of the game's scripts `m170` and `m174`
and the command rows `monmagic.bin` 0x40a1 to 0x40a5: "RE review 2026-10-14, m170/m174, rows 170/174"; the second look at 95152154, "RE re-review"), then the research the build started on (`research/ffx-yojimbo.md` section 8.2:
the FFX-2 wiki's Cavern page, FFExodus Chapter 3, SinirothX's *Enemy Encyclopedia*; `research/ffx2-fallen-aeons.md` section 7.2).

| Field | Value | Tag |
|---|---|---|
| Yojimbo | row 170: Lv 36, HP 22,000, MP 9,999, STR 44, DEF 50, MAG 61, MDEF 106, AGI 120, ACC 95, EVA 0, LUCK 7; EXP 2,000, AP 15, Gil 1,500, Pilfer Gil 2,000; drop Recovery Bracer, steal Power Wrist (byte 128, x1 and x1, item 0x9008); Zantetsu 120; Gravity null | `[game rows]`; the wiki's six stats and rewards equal the row |
| Daigoro | row 174: his own record, Lv 30, HP 1, MP 1, STR 42 / DEF 50 / MAG 61 / MDEF 106 / AGI 120 / ACC 95 / EVA 0 / LUCK 7; no rewards, no ability list; immune to Curse, Itchy and Auto-Life only | `[game rows]` |
| Immunities | row 170 group 1 at 255: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, **Itchy (17), Auto-Life (18)**; group 2: Slow, Stop, the seven stat stages, Doom | `[game rows]` |
| The poll, the bands, the dog, Daigoro's bite | see "How the fight works" | `[game script m170 / m174, RE review]` |
| The five command rows | Kozuka 0x40a1, Wakizashi A 0x40a2, Wakizashi B 0x40a3, Zanmato 0x40a4, the bite 0x40a5 (costs, power, class, status) | `[game rows]` |
| Daigoro cannot be targeted | the FFX-2 wiki's Cavern page and `research/ffx-yojimbo.md` Y-10; the rows say nothing either way | **`[single source: wiki]`** (my first draft wrote "verified: 2 sources", which was wrong) |
| Telegraph (Zanmato: the raised hand), music "Aeons" in the fight | the wiki's Cavern page | `[single source]` |
| Stage heights | Yojimbo 27.1, Daigoro 8.0 (FFX HD models, ratios 1.529 and 0.450 of the girls); the X-2 possessed aeon is assumed to be the same model | `[datamined]` for the FFX model, `[estimate]` for FFX-2 |
| The party | the Chapter 3 preset (`djoseBuild`, Lv 32 / 33 / 34): the research is silent on the mission's level (it opens at the start of Chapter 3 and is done in 3 or 5); the preset is the end of Chapter 3 and under the boss's Lv 36 | `[estimate]` |
| Daigoro's bite aim | uniform over the living girls; the game's script uses the near-weighted search, which needs the formation's start positions | `[estimate]`, see Disclosures |

### Every change the RE rows made, with the row as its source

1. **Reflect:** the wiki says Yojimbo is immune; **row 170 group 2 index 2 reads 0**: the immunity is removed.
2. **Bribe:** unproven either way (row 170 has no Bribe slot). The special word is wired as the game's own, **0x3c3 (row 170)**; **this engine reads bit 9 of the word as Bribe immunity** (`adapt/words.ts`), so Yojimbo
   is Bribe-immune in the engine as a side effect of wiring the word as it is. Daigoro's word is 0 (row 174).
3. **Gravity null:** element byte 0x10 on row 170, confirmed. 4. **Accuracy 95 and Evasion 0** are read from row 170 (first drafted as estimates).
5. **Daigoro is a record of his own, row 174** (not a placeholder); he is an actor with his own gauge (AGI 120).
6. **Yojimbo's list (row 170: Kozuka, Wakizashi twice, Zanmato, Die) has no Daigoro move:** the bite is **Daigoro's own command, row 0x40a5**, used on his own turn when Yojimbo has raised the flag (`m174`).
7. **Group-1 slots 17 and 18 (Itchy, Auto-Life) are 255 on both rows and are wired** (RE answered this chapter's question: 369 of the game's 370 rows carry 255 at both; the note's "unmapped" wording predates it).
   My first draft left them out on that wording; I will not repeat that, and the RE note's sections 3 and 5 are being corrected on their side.
8. **Kozuka's Poison is the game's status byte 100 (row 0x40a1, group 1 slot 5)**, which agrees with the wiki's "100 percent"; the byte is what is wired.
9. **All five command rows have accuracy formula 0: none rolls to hit** (rule 5, `canMiss: false`; the first draft let the physical blows roll and 11 percent were evaded).
10. **Pace from the rows:** Kozuka and both Wakizashi rest 120, the bite 100, Zanmato charges 120 and rests 200, all over AGI 120. The engine's rounded steps are **105** (ordinary rest and Zanmato's charge), **174**
    (Zanmato's rest), **87** (the dog's rest) and **1** (a dog pick has no rest), pinned by the engine test.
11. **Wakizashi B hits ONE girl (`[strongly indicated]`, RE re-review):** see below. Its row keeps the target byte 0x17.
12. "Multi-attack" has no column in the row: nothing is wired.

## How the fight works

**Yojimbo is polled on every logic step he is ready; a poll is not a turn.** His counter (AI memory) starts at 0. On each poll:

- **counter at 100 or more:** queue **Zanmato** on all the girls and reset the counter to 0 (tested BEFORE the raise: 13 raises of 8 reach 104, so Zanmato is **always the 14th poll** of a cycle);
- **otherwise raise it by 8 FIRST, then read the band on the RAISED value** and roll `random() mod N` on the script's stream 2:

| Raised counter | mod | Picks, by roll 0, 1, 2 ... |
|---|---|---|
| 70 and up | 4 | Wakizashi B, Wakizashi A, Kozuka, the dog |
| 30 to 69 | 4 | Kozuka, Wakizashi A, the dog, the dog |
| below 30 | 3 | Kozuka, the dog, the dog |

- Every real move except Zanmato is aimed at one girl by a uniform pick on stream 4, drawn after the roll.
- **The dog pick is a poll without a turn:** Yojimbo raises the battle flag `daigoroCalled`, queues nothing, spends no recovery and is polled again on the very next step with the counter already raised.
  **Daigoro is an actor of his own** (row 174, AGI 120, his own gauge): he sleeps until the flag is raised, is made ready in the same step as the call, clears the flag and bites one girl (row 0x40a5: physical, power 16,
  rest 100). Several calls before he acts are one bite (it is a flag, not a count); a call during his rest is seen at his next poll, so he bites again.
- **Zanmato** has the 120 charge (the bar fills and the banner names it), then sets every standing girl to 1 HP and 1 MP (the Delta Attack path, formula 0x0a: no Protect, Shell or Defense reduces it, a KO'd girl is
  untouched, nobody dies of it), then Yojimbo rests 200. The turn after is the heal: nobody has MP, so the answer is a Mega-Potion (or a Mix) from the bag, then Phoenix Downs.
- **Real actions before a Zanmato:** 7.25 on average (exact, from the bands) and four to ten in 96.4 percent of cycles. **Daigoro's bites per cycle** (14 polls): 4.3 to 4.55 in the long cells of the bench
  (RE's step model: about 4.3, 3.4 to 4.5 over animation lengths; RE measured 3.48 on its own run).
- The Meteor enrage block of `m170` never runs in play: no timer is added. Nothing raises the counter but his own polls.

### Wakizashi B hits one girl (strongly indicated; one-line switch)

The first reading took B's row at its word (target byte 0x17, "multiple": the whole party). The RE re-review found the script runs the **same uniform one-girl search for B as for A** and queues B on her; the game's
`setdircom` does not read the row's target flags; the target-mask dispatcher (emulated over 44,320 vectors, 0 mismatches) passes a "multiple" row's mask unchanged and never widens it. The only widening is a rebuild
when the chosen girl is KO'd before the strike, which cannot happen here (a command with no charge strikes in the step it is chosen). **Shipped reading: one girl.** The record keeps its 0x17;
**`WAKIZASHI_B_HITS_ONE_GIRL` in `src/data/ffx2/enemies/tourist-trap-abilities.ts`** (`false` = the whole party, with the search draw still made and unused) is the whole switch. Not yet confirmed by a play.

## Pace: the +3 s action-time add-on is an OPEN DECISION for Bailey

The formation carries the flat 3 s action-time add-on (`TOURIST_TRAP_ACTION_TIME_ON`, `enemies/tourist-trap.ts`) on top of the rows, **kept by precedent, awaiting Bailey's pick**: the Road, Ixion at Djose and the
Cloister carry it, but his picks were per chapter (D-151 Cloister, D-187 / D-197 Road, D-269 Ixion) and **there is no row for this chapter**; an earlier comment of mine called it "Bailey's pick", which was wrong
(RE re-review). One constant turns it off; no boss number moves either way.

| Chapter 3 preset, intended line, Wait clock, 40 seeds | rows only (add-on OFF) | with the add-on (as shipped) |
|---|---|---|
| First Zanmato, seconds from the start | **34.1** (RE: 34.1) | **58.5** (RE: 59.5) |
| Zanmato to Zanmato, seconds | **35.4** (RE: 38.6) | **54.7** (RE: 54.2) |
| Wins (the shipped tactic) | 39 of 40 | 38 of 40 |

Mine come from `tests/unit/chapters/tourist-trap-bench.test.ts` (the engine run under the shipped advisor line; the gaps include the engine's chain lock, below); the RE figures are the driver's relay of its own model.

## Difficulty: measured, not tuned (D-410)

Nothing in the boss was tuned to a number. 40 seeds a cell, the shipped tactic (`intendedStrategy`: Yuna Protect first, a Mega-Potion the turn after Zanmato, Esuna for the Poison, the Knights on Darkness):

| Cell | Wins | Zanmato seen | Daigoro bites per cycle |
|---|---|---|---|
| Chapter 3 preset, Wait | 38 / 40 | 40 | 4.37 |
| Chapter 3 preset, Active, 1.5 s a decision | 27 / 40 | 40 | 4.38 |
| Chapter 3 preset, Active, 4 s a decision | 3 / 40 | 40 | 4.31 |
| Chapter 3 preset, naive (attack only, no answers), Wait | 0 / 40 | 40 | 4.55 |
| Chapter 3 preset, Wait, add-on OFF (control) | 39 / 40 | 40 | 4.48 |
| Chapter 5 preset (Lv 46 / 48 / 50), Wait | 40 / 40 | 0 (the fight ends first) | 4.85 per 14 polls on a 10-poll average |

The counter matters: a party that only attacks loses every fight to Zanmato and its aftermath. Bailey can overrule any of this; the level the mission is fought at is an `[estimate]`.

## Art and music (PROVISIONAL, nothing replaced)

- **Art:** `characters/yojimbo-cavern/{idle,attack,cast,hurt}` and `characters/daigoro/{idle,cast}` and `backdrops/cavern-stolen-fayth`: the FFX Chapter IX paintings (same aeon, same dog), unchanged. What does not fit and
  is not done: Yojimbo "possessed by Shuyin's despair" gets no recolour and no new pose; the FFX Ginnem, sakura arrival and pad glow are not used. The card on the prep shows Yojimbo's idle as the hero art fallback.
- **Music (by reference, no new audio):** field bed `scene-bevelle-underground`, battle `boss-ffx2-fallen-aeons` (the cue the Road and Ixion play; the wiki names "Aeons" for the fight, single source), victory
  `victory-ffx2`. `node tools/audio/qa.mjs` green (no audio added). **Bailey judges music by ear** (rule 13).

## Disclosures and what is open

1. **Decision for Bailey: the +3 s add-on** (above).
2. **Wakizashi B** is one girl on RE's strong indication, not a play; the switch is one line.
3. **The bite's aim is uniform.** The game's near-weighted search needs the formation's start positions, and the Cavern scene is PROVED to carry none (the compiled scene file is the generic empty one;
   `pos_nagi05_229.psc` is empty too, RE 2026-10-14), so the uniform stand-in is final unless a positions source turns up. Where the dog bites does not change a number, only who is hit.
4. **Within a step the engine polls Yojimbo before the dog** (the dog is made ready by Yojimbo's own poll); the game's order between two ready monsters in one step is not established.
5. **`battle/ffx2/intent.ts` is 771 lines** (756 before this branch, 15 added): over the 400-line rule already; not split here.
6. **The chain lock lengthens the gaps** between Yojimbo's moves while girls are chaining (`isActionLocked`, section 1.7: a ready monster waits). That is the engine's generic rule, not this chapter's; the pace pins
   use a defending party so no chain forms.
7. **`battleState.turn` counts polls**, and each dog pick is one: nothing in this chapter reads it, but the Defeat screen prints it as TURNS (see "Checks run"). A fix would be in the shared engine; not touched.
8. Daigoro's untargetability is **single source (wiki)**; Bribe on Yojimbo is unproven (and the engine reads bit 9 of the game's word as Bribe immunity).
9. **Not done, waits for Bailey:** listing the chapter on the board (it is hidden, like Leblanc, the Experiment, Mushroom and Fayth), a painting of its own for the card and the stage, a possessed recolour, a
   music cue of its own, a level for the mission other than the Chapter 3 preset.

## Merge notes

- The Valefor chapter is built in parallel on its own branch. **Hot spots (additive lines in the same places):** `src/data/encounters.ts` (the id union, the listed exclusion, the number union), `src/data/chapters-experiments.ts`,
  `src/app/screens/frontend/chapterDoors.ts`, `src/scenes/experiment-scenes.ts`, `docs/CONTRACT-CHANGES.md` (newest first), `CHANGELOG.md`, and the tests that enumerate chapters and had to gain a row for this one:
  `tests/unit/chapter-doors.test.ts` (the word count), `tests/unit/chapters/exp-fayth.test.ts` (the hidden scenes' key list), `tests/unit/chapters/trema-options.test.ts` (the formations with action time: only if Valefor's
  carries it), `tests/unit/audio-music-batch1-2026-10-10.test.ts` and `audio-music-batch2-2026-10-12.test.ts` (the per-chapter music tables), `tests/unit/guide-ffx2-wait-habit.test.ts`.
  The second branch to merge keeps both sets and uses its own hidden number. The additive engine pieces (`wakeIdleNow`, the dry run's re-polls, the idle constants) are this branch's alone.
- Contract entry: `docs/CONTRACT-CHANGES.md` 2026-10-14 (`encounters.ts` is a contract file; hard rule 2).
- Before any deploy: `node tools/critic-plan.mjs` classes this DEEP (shared systems), so the release flow owes the reviews; nothing here deploys.

## Checks run

- `npx tsc --noEmit` (via `node node_modules/typescript/bin/tsc --noEmit`): clean. `node tools/orphans.mjs`: none of this chapter's modules is listed (the list is the repo's own old orphans). `node tools/audio/qa.mjs`: green, 68.87 of 105 MB, 0 findings (no audio added).
- **The full unit suite, once** (2 workers, 2,628 s): 1,220 files (1,198 passed, 14 skipped, **8 failed**), 19,004 tests (18,920 passed, **10 failed**, 73 skipped, 1 todo). Every one of the ten failures was a test that enumerates every
  chapter, scene, formation, data file or guide document meeting the new hidden chapter; none touched a game rule. **Classified and fixed** (the eight files re-run green, 265 tests):
  `audio-music-batch1-2026-10-10` (the owners of the "Aeons" cue gain `ffx2-tourist-trap`) and `audio-music-batch2-2026-10-12` (its per-chapter music table gains a row); `exp-fayth` (the hidden scenes' row list gains
  the cavern); `trema-options` (the formations that carry the 3 s action time gain `ffx2-cavern-yojimbo`, by precedent: see the pace section); `data-ffx2-citations` (two data files lacked a section sign); `ffx2-steal-item-names`
  (Power Wrist, Yojimbo's steal, had no `ItemDef`: **added as a named held item** in `data/ffx2/items/held.ts` from `research/ffx2-combat-core.md` §5.4, Str +20, buy price 6,000 `[verified: 2 sources]`, the same Str +20 the
  accessory table already carried); `guide-doc-words` x2 (the visible word "sources" in one guide sentence) and `guide-doc` (one block was 265 characters, the limit is 260). The full run also picked up an untracked scratch probe
  (`tests/unit/chapters/zz-tourist-trap-probe*.tmp.test.ts`, not committed: it prints, asserts nothing).
- The chapter's own suites: `tourist-trap-engine` 30 tests (rows pinned to the fixture, the poll, the flag, the pace pins, real-engine fights, a real-fight check that every Wakizashi B lands once on one girl), `tourist-trap-chapter` 19,
  `tourist-trap-bench` 7 (the table above), `daigoro-door` 19, `chapter-doors` 10 (six words).
- **Browser proof on a production build** (`vite build` with `BASE_PATH=/`, output to `M:\pyrefly-builds\ch-tourist-trap\dist`, bundle `index-DNR2x4Zs.js`; `vite preview` on :5521; headless Chromium in GPU mode from node,
  never the built-in pane; the overnight art runner paused for the duration and released after; both servers stopped):
  - **Board:** 18 tiles and 18 cards, "of 18 beaten", no `EXP` text, no card for the chapter: PASS.
  - **The word, real keys:** typing `daigoro` on the board opens party prep for `ffx2-tourist-trap` (header "EXP · TOURIST TRAP"); Enter, the opening line plays, then the first menu (White Mage's menu: White Magic, Change, Item) at
    **1600x900** and on a **390x844 touch phone**; Daigoro `untargetable: true`; no page error.
  - **A WIN** (the autopilot's `intended` line, fast speed, the debug API): victory in about 80 s of battle time; 33 Yojimbo polls, **Zanmato on poll 14 and poll 28**, 4 Wakizashi B, **each queued on one girl and landing on one girl**, 12 bites; the
    Victory screen prints EXP 2,000, AP 15, Gil 1,500, Recovery Bracer (the row's numbers); the experiments' store holds the attempt and the clear, and the save key holds no `ffx2-tourist-trap`.
  - **A LOSS** (attack only, no answers): Zanmato on poll 14 leaves the whole party at 1 HP and 1 MP, all three still poisoned, and they are all down within about five seconds of the strike: the Defeat screen, "Never cleared",
    RETRY and CHAPTER SELECT. The counter matters.
  - **The other words:** `leblanc` opens `exp-leblanc`, `experiment` opens `ffx2-masterpiece-theatre`, `mushroom` opens `sinspawn-gui`, `fayth` opens `exp-fayth`, and `limit` still hands the board to FF7's battle screen.
  - **Zero page errors and zero console errors in every run.** Screenshots, which I looked at, under `docs/screenshots/ch-tourist-trap/`: `1600x900-win-first-menu`, `-win-party-prep`, `-win-opening-line`, `-win-zanmato`, `-win-result`,
    `-loss-first-menu`, `-loss-zanmato`, `-loss-result`, `-kozuka`, `-bite-a`, `-bite-b`, `-wakizashi-b`, `-zanmato-charge`, `-zanmato-landed`, `-board-no-card`, `-limit-door`, and on the phone `390x844-first-menu`,
    `-first-menu-settled`, `-p-party-prep`, `-p-opening-line`. The proof script is `D:\Tools\pyrefly-scratch\2026-10-14\ch-tourist-trap\proof.mjs` (scratch, not committed).

### What the screenshots show that is not this chapter's to fix (HUD placement; reported, not changed)

- At 1600x900 the **intent slab** (top right) covers the right part of Yojimbo's hat while it names Kozuka (the slab is anchored to the acting enemy's head; `E` hides it), and the **Daigoro slab** (three target rows
  for the bite) can sit over the command stack's first row while he is next to act (a few seconds at most: only when Yojimbo calls him during his rest). The same family as the disclosed F7297-03 (the command menu over Ixion).
- The **Defeat screen's TURNS** counts every poll: Yojimbo's dog picks are polls without a turn but are `turn-start` events (a 46-second loss printed "46").
- **Yuna is already poisoned at the first menu** (Yojimbo's first Kozuka lands before the girls' first command): the advisor's first tip is Esuna on Yuna. That is the game's opening-gauge rule at AGI 120, not a choice of this chapter's.

---

Last code commit before this note: `abb5d5d6` (branch `ch-tourist-trap`); the commits after it are records only (this note, the changelog, the screenshots, the progress file). Not merged, not deployed.
