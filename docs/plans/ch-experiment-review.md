# Paper preflight: the Experiment, a new hidden FFX-2 chapter (branch `ch-experiment`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs` classes this work **DEEP**
(`encounters.ts`, the FFX-2 ATB engine and `scenes/index.ts` are shared systems), so the plan comes first.
Written 2026-10-10 ~01:00 EDT, before any code, by the sub-agent building the chapter overnight for the driver.

**Authority (Bailey, 2026-10-10, verbatim):** "I'll add in those 2 chapter recommendations" and "i want those chapters added in
over night while im sleep along with what you are working on now. also include the reverse engineered and decompiled game
mechanics please. this is really important." The driver's reading, recorded as Bailey's delegation: end state first is waived
tonight because he asked to build now; the chapter ships **hidden behind a typed word** (the `leblanc` precedent), so he plays
it in the morning; listing it on the board waits for his word; the art is **provisional** (new subjects only, never replacing an
approved painting).

**Game case: FFX-2 only.** The Experiment is the Machine Faction's weapon prototype from FFX-2 Chapter 5 (Djose Temple). Its
fight is ATB, dresspheres, FFX-2 items and the FFX-2 monster rows; nothing in it is true of an FFX chapter and no FFX file is
touched. The shared plumbing it needs (the hidden word on chapter select, one prep tab, the chapter registry) is "both"
(CHK-020) and is written so that a chapter without it behaves exactly as before.

> **Update 2026-10-10 ~01:15 (the driver's concept pick, after `research/ffx2-experiment.md` and the RE note landed).** The pick is **concept B, the game's own two-act Rematch**: the game has no pre-battle upgrade menu (research C-1), and Bailey's product brief puts "one more try" in the fight itself with no modifiers. So §3 below (the chosen-levels prep tab, the session-memory store and the accessor)
> is **withdrawn and was never built beyond a first scaffold, which is deleted**; §2 stays as the internal model that makes the two acts. What is built instead: two formations chained by `nextGroupId` (Act I the prototype at 1 / 1 / 1; Act II the full weapon at 5 / 5 / 5, `restoresPartyOnEntry`, the retry checkpoint), a story seam between them,
> the game's own monster and command rows from the RE note (pinned against a numbers-only fixture), the AI per Special level as the game's script has it, the chapter id `ffx2-masterpiece-theatre`, number 20. §4 (the word), §5, §6 (minus the prep tab), §7 and §8 stand; the risks about the accessor seam no longer apply. The "Verdict" below is superseded by the handoff `docs/handoff/ch-experiment.md`.

## 1. What the chapter is (summary; the numbers wait for the game's own rows)

Read so far: the public sources the overnight research gathered (FF Wiki page, Jegged's Chapter 5 Djose page, GameFAQs boss
guide); `research/re-ffx2-ai-leblanc-den-ixion.md` and `research/re-ffx2-commands.md` for the shape of the RE notes; the engine
files named below. **Not yet read: the research's `research.md`, `concepts.md`, `art-brief.md` and the RE session's
`re-ffx2-experiment.md`** (due ~01:30 and later). Nothing below is a number until those land (rule 6).

- **One boss, one link, HP constant.** Level 50, 18,324 HP, Machina, immune to the status list and to fractional damage; drops
  an Elixir, steals Turbo Ether. `[verified: wiki + Jegged]`, to be replaced by the game's own row.
- **Three upgrade tracks, each Level 1 to 5**, which in the game come from "Assembly" pieces dug up in Bikanel Desert (Z = 5
  points, S = 3, A = 1; Level 1 at 0-3 points, 2 at 4-9, 3 at 10-19, 4 at 20-37, 5 at 38 and up). **Attack** sets Strength and
  Magic, **Defense** sets Defense and Magic Defense, **Special** sets the attack pattern (Attack; Rocket Launcher of 4, 6, 8
  or 10 hits; Lifeslicer; Annihilator at Special 5 only). `[verified: wiki + Jegged]`; the RE note says how the game stores
  and applies them.
- **Bailey's chapter asks the player to pick the three levels before the fight** (the driver's brief), instead of digging. So
  the chapter has one genuinely new input, and the question "what is the default" is a fidelity question (§3).

## 2. The upgrade model (data, no DOM, deterministic)

`src/data/ffx2/enemies/experiment-levels.ts` owns the model and nothing else may restate it:

- `ExperimentLevels = { attack, defense, special }`, each `1..5`; `DEFAULT_EXPERIMENT_LEVELS`; `experimentGroup(levels)` builds
  the **one** `EnemyDef` (stats by the Attack and Defense levels, `aiScriptId` by the Special level, rewards from the row) and the
  `EnemyGroupDef`, memoised per triple so object identity is stable (the engine, preload and the card all read the same object).
- The assembly-point arithmetic (`Z5/S3/A1`, the five thresholds) is data too, so a presentation that wants "points" (a bench of
  pieces) and one that wants "levels" (three dials) use the same tables. Which presentation ships is the driver's concept pick.
- **Unsourced means left out.** If the RE note does not carry a number (for example how the game rolls Rocket Launcher's random
  targets, or the Lv 4 weights beyond Jegged's 50/33/17), the data says so in a comment and the sourced reading stands.

## 3. The pre-battle choice (waits for the concept pick; the seam is built now)

- **Where:** inside the existing prep flow, as one more FFX-2 prep tab ("EXPERIMENT") that exists **only** for a chapter that
  declares upgrades (`PrepPanel.appliesTo(chapter)`, additive and optional; every other chapter's tabs are unchanged). It is
  styled like the Ink & Gold prep screens it sits in. The concept pick decides its look and controls.
- **Save data: none touched.** `src/app/SaveData.ts`, the save schema and the experiments' store schema are not edited. The
  choice lives in **session memory** (`src/app/experiments/experimentLoadout.ts`, a Map keyed by chapter id) and is
  forgotten on reload; a retry after a defeat keeps it (the prep screen shows again with the same levels). The chapter's
  attempts and clears go to the experiments' store exactly as the Leblanc preview's do (`experimental: true`).
- **The seam to the fight:** `Chapter.enemyGroupRef` on this chapter is an accessor that returns the memoised group for the
  levels in memory. `BattleScreen`, `battlePreload`, `setupForChapter` and the cards already read that one property, so no
  shared screen file changes and `Chapter` (a contract type) is not widened. The test pins that the accessor is stable for a
  fixed choice and follows a changed one.
- **The default reproduces a faithful baseline:** `DEFAULT_EXPERIMENT_LEVELS` is one of the two fights the game itself offers.
  Which one (all 1s, "the first fight", or all 5s, "the full weapon") is a fidelity call I will make from the RE rows and the
  party's level and then **state in the handoff**; the Lv 1 fight is nearly a formality and the Lv 5 fight carries Lifeslicer
  and Annihilator. Whatever ships, the advisor's line wins it (§6) and every level is reachable.

## 4. The hidden word

- `src/app/screens/frontend/experimentDoor.ts`: `EXPERIMENT_DOOR_WORD = 'experiment'` and its chapter, one constant, a
  `WordDoor` like Leblanc's; `ChapterSelectScreen` gets three additive lines (a door field, its arm, its feed).
- **The real hazard, found by reading `app/Input.ts`:** the word's letters E, X, R and M are bound to START, CANCEL, R1 and
  SELECT. The board acts on CANCEL (X leaves chapter select for the title). The existing `wordKey` guard already swallows a
  later letter of a live match, so X, typed second, is claimed; the first E is START, which the board does not act on, and the
  `opening` frame consumes every latched button. The last letter, T, is bound to nothing. I will pin all of it with the real
  `Input` and real key events (a copy of `exp-leblanc-door.test.ts`'s method for this word: capitals, typos, back-to-back
  keydowns, a held last letter, the three doors not interfering, FF7's pad sequence `F R F R M` still its own).
- Prefix check: neither `limit`, `leblanc` nor `experiment` begins another, so no door fires early.
- **Merge note for the driver:** the parallel lane `ch-gui` adds a word too. My edits to `encounters.ts`, `ChapterSelectScreen.ts`,
  `chapter-meta.ts` and `scenes/index.ts` are each one added line (or one added name in an existing array) next to the
  Leblanc line, so the merge is a mechanical union.

## 5. Engine, AI and data (follows the RE note; the files are named now)

| File | What | Source |
|---|---|---|
| `src/data/ffx2/enemies/experiment-levels.ts` | the model, the per-level tables, `experimentGroup` | RE rows, tagged |
| `src/data/ffx2/enemies/experiment-abilities.ts` | Attack, Rocket Launcher (the four hit counts), Lifeslicer, Annihilator, each with its game command row | RE command rows |
| `src/data/ffx2/monster-records` (additive) | the Experiment's monster row at its levels | RE rows |
| `src/battle/ffx2/ai/experiment.ts` | one script per Special level, registered in `ai/index.ts` | RE script, in our words |
| `src/data/ffx2/builds/djose-experiment.ts` | the Chapter 5 party at Djose | research §party; levels `[estimate]` |

Rules kept: **no decompiled code and no game text** in the repo (the lane brief, rule 8); **hit rule** (rule 5): magic and
Annihilator `canMiss: false`, only the physical rows roll, and the test reads `canMiss === false`; deterministic under the
seeded RNG (rule 1: `src/battle/**` imports no DOM and no `three`); every ability row carries the game's row so the W3 kernels
(`src/battle/ffx2/kernel/`) resolve it, not a reading of ours. **No boss number is tuned** (hard rule); the party's levels
and items are labelled `[estimate]` and measured, not adjusted to make a bench pass.

## 6. Everything else a chapter needs

- **Story:** `pre` and `post` scripts in the writing bible's voice, our own words over the sourced beats (the Al Bhed technician
  and the dare, the repair, Paine's and Rikku's reactions); no verbatim game dialogue; linted by `story/textLint.ts`.
- **Music:** existing tracks only. The Machine Faction fight uses the house FFX-2 boss cue the other FFX-2 chapters use
  (`boss-ffx2-aeon` is an aeon cue; I will check `docs/audio/THEMES.md` for a closer existing fit before choosing) and the
  FFX-2 fanfare. No new audio.
- **Advisor:** `engine/tactics/ffx2-experiment.ts`, registered in `tactics/index.ts` and `lookup.ts`; it must win the default
  fight in the seeded bench and handle every level without error. **Guide:** a basic card citing Jegged, the wiki and GameFAQs
  (`data/guides/`). **HUD:** the FFX-2 HUD as the other FFX-2 chapters (no new HUD).
- **Scene:** a scene key `ffx2-experiment-grounds` over the art run's plate when it arrives, else the existing Djose chamber
  plate as a labelled stand-in; slots and camera from the existing Djose rig. **Art:** new subject folders only (§7).
- **Pause metadata** (`chapter-meta-ffx2-experiment.ts`) with the objectives (survive Lifeslicer; bring it below half; win).

## 7. Art policy

Provisional, new subjects only: the boss's paintings under a new `characters/ffx2-experiment*` subject, the grounds plate under a
new `backdrops/ffx2-experiment-grounds*` name. No approved painting is replaced or rewritten (the hard-link guard of the Leblanc
preview applies: `public/art` here is a junction into the release tree, so I install into a **separate hard-linked workspace**
and point this worktree's junction at it, exactly as `tools/exp-art.mjs link` did, rather than write into the release tree).
Until the art run's picks arrive the chapter plays on a clearly labelled stand-in built from existing approved art, recorded in
the handoff as PROVISIONAL.

## 8. Risks

1. **The word's keys** (§4): X (cancel) leaving the board mid-word; pinned by real-input tests, not argued.
2. **The accessor seam** (§3) is unusual: a property that follows session state. Pinned by a test; documented at the field; the
   alternative (widening `Chapter`) is a contract change with a CONTRACT-CHANGES entry, held in reserve.
3. **Level 4's random pattern** and Rocket Launcher's random targets make the intent board's dry run non-deterministic in
   appearance; I will read how Ixion's and Leblanc's scripts handled it before wiring the HUD.
4. **Lifeslicer** (damage equal to max HP) and a ten-hit Rocket Launcher can end a fight early; the default and the advisor
   have to answer them with the sourced tools (Protect, Auto-Life via the Salvation Promised grid, Phoenix Down), not with a
   changed number.
5. **Disk and servers:** D: has about 2.9 GB free: no production build, no tree copies, screenshots few; one dev server,
   stopped by its port afterwards.
6. **Shared files:** the `ch-gui` lane edits the same registries; every edit here is one line.
7. **Art arrives late or not at all:** the stand-in is a first-class path, so the chapter is playable either way.

## 9. Tests (written with the code)

Unit: the model (thresholds, memoised group per triple, the accessor follows session memory, default pinned); one engine
test per upgrade level (stats at each Attack and Defense level, the AI sequence at each Special level on seeded runs, ability
rows: hits, targeting, `canMiss`, the Lifeslicer and Annihilator arithmetic against the game's rows); the door (real `Input`);
the prep tab (jsdom: appears for this chapter only, keys change levels, session memory, default selected); registration (not in
`CHAPTERS` or `CHAPTER_IDS`, in `EXPERIMENT_CHAPTERS`, found by `getChapter`, the board still shows 18); the save is
byte-identical after a run; story lint; guide and tactic; a bench per level (the advisor wins the default; the naive line is
reported, not tuned). Then `tsc --noEmit`, `node tools/orphans.mjs`, and the full suite once at the end
(`--testTimeout=60000 --maxWorkers=4`). Browser: the hidden word opens the chapter, the upgrade choice works with real keys,
the default is won with the advisor's line; screenshots at 1600x900 and 390x844 under `docs/screenshots/ch-experiment/`.

## 10. Verdict

**PROCEED** on the model, the door, the registry, the seam, the story, the tactic scaffolding and the tests now. **HOLD** the
numbers until the RE note lands, and **HOLD** the choice's look until the driver's concept pick. The review class stays DEEP:
the driver integrates, runs the focused pass, and the deep review is owed on the live build.
