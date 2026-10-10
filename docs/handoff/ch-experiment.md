# The Experiment: a hidden FFX-2 chapter (Djose Temple, the mission Masterpiece Theatre)

**Branch `ch-experiment`** (from `re-parity-rc1` 931613a8, the live build 39.4.3), pushed. **Game case: FFX-2 only** (AGENTS.md rule 14): ATB, dresspheres, the FFX-2 monster rows; no FFX or FF7 file changed behaviour.
**Status: built, hidden, provisional art.** It is not on the board, not in "of 18", and not listed anywhere; it opens only by a typed word. Listing it waits for Bailey's word.

Bailey, 2026-10-10 (verbatim, via the driver): "I'll add in those 2 chapter recommendations"; "i want those chapters added in over night while im sleep along with what you are working on now. also include the reverse engineered and decompiled game mechanics please. this is really important." The driver's reading (recorded as his delegation): end state first waived for tonight, the chapter ships hidden behind a typed word (the Leblanc preview's precedent), art is provisional (new subjects only, no approved painting replaced), game case FFX-2 only, **concept B** (the game's own two-act Rematch) picked.

## 1. Play it

1. From the title, reach the chapter-select board (the title screen advances on Enter/E, so the word cannot be typed there).
2. Type `experiment` on the board (any case, letters at most 2 s apart; the board never shows a hint). **It opens the chapter's party prep itself**, with no card and no sound before it. Enter starts the battle.
3. The word's letters E, X, R, M are buttons on the board (START, CANCEL, R1, SELECT); the guard that makes the word safe is pinned with the real `Input` in `tests/unit/ffx2-experiment-door.test.ts` (33 tests) and the real-input e2e below.
4. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration.

## 2. What it is (concept B)

| | Act I | The seam | Act II | Post |
|---|---|---|---|---|
| What | the prototype at Attack 1, Defense 1, Special 1 | a story beat over the fight at Act I's fall (about 17 s): the machine breaks, the cheeky Al Bhed gag, the girls rest, the rebuild readout (5 / 5 / 5), the confession | the full weapon at 5 / 5 / 5, the retry checkpoint | results, the crew's callback, Paine's one sincere beat, the run and the chase |
| Combatant id | `x2-experiment-prototype` | | `x2-experiment` | |
| Moves | Attack only | | Rocket Launcher (10 hits), Attack, Rocket Launcher, Attack, Lifeslicer, Annihilator, Attack, repeat | |
| Party | the Chapter 5 preset (`farplaneBuild`): Yuna White Mage LV 46, Rikku and Paine Dark Knight LV 48 and 50 | restored at Act II's entry (full HP and MP, a KO'd girl up, items stay spent) | | |

- **There is no upgrade dial and no prep tab**: the game has no pre-battle upgrade menu (the machine's levels come from parts dug up in the Bikanel Desert), and Bailey's product brief puts "one more try" in the fight itself. The three Special/Attack/Defense levels are internal data that make the two acts (`src/data/ffx2/enemies/experiment-levels.ts`); the model keeps all five Special levels and their scripts (tested), but the chapter plays only 1 and 5.
- **No "SAVE SPHERE" card** at the seam (the driver's call: there is none at Djose). Act II sets `restoresPartyOnEntry` (the engine restores; the link is the retry checkpoint) and the new optional `EnemyGroupDef.noSaveSphereCard` (the flow re-stages plainly). One narration line in the seam says the girls rest. Chapter XI keeps its card (control test).
- **Music is existing cues only**: field bed `scene-bevelle-underground`, Act I `boss-ffx2-aeon`, Act II `boss-vegnagun`, `victory-ffx2`. Agents cannot hear (rule 13): **Bailey's call by ear**.
- **Prompts not built**: the game's repair-manual prompt and fight-or-walk prompt (a `choice` step is a defect in a mid-battle seam, and "not yet" has nowhere to go in a chain).
- **HUD as the other FFX-2 chapters**: the intent board, the move advisor card, the written strategy guide (a card and a document following Jegged's Chapter 5 page in our words), the pause screen meta, the prep CHAPTER tab (`EXP` numeral, objectives, tip).

## 3. The game's own numbers (the reverse-engineering lane's note, `research/re-ffx2-experiment.md`)

The new-chapters RE lane read the live Steam build (25501027): monster row 194, command rows `0x41da` and `0x4121` to `0x4126`, the compiled AI script `m194`, the Djose event, the cadence. **Every number here is the game's row, not a reading of the guides.** They are laid on the enemies by two additive maps (`command-records/experiment.ts`, `monster-records/records-experiment.ts`) and pinned by `tests/unit/chapters/experiment-engine.test.ts` against `tests/fixtures/parity/ffx2/experiment_rows.json` (numbers only; no game text or code in the repo):

- HP 18,324, level 50, AGI 68, ACC 95, EVA 0; neutral to every element but Gravity (immune); immune to every harmful status and every stat-change status (the Breaks do nothing); the special word 0x7c3 (percent formulas and Delay do nothing). AP 40; Steal always succeeds (Turbo Ether x1 common, x2 rare); drop Elixir; Pilfer Gil 5,000.
- Attack (physical, power 16, rolls to hit with ACC 95: the only move that can miss); Rocket Launcher A to D (4, 6, 8, 10 hits, power 4/3/3/3, random girl per hit, never rolls: `canMiss: false`); **Lifeslicer** = the target's maximum HP, whatever Protect, Shell or Defense (its row has no damage bits), never rolls; **Annihilator** = magic that ignores Magic Defense, Shell halves it, a weak Delay on each girl, never rolls. The kernel reproduces the note's emulator runs of the live damage function (Attack Level 1 to 5 against five Defense values; Annihilator 626 to 707 at Level 1 and 1,240 to 1,400 at Level 5).
- Cadence from the rows (`cost_cast`, `cost_atb` over AGI 68): Attack rest 5.1 s; Rocket Launcher 3.1 s charge then 5.1 s; Lifeslicer 5.1 s then 9.2 s; Annihilator 10.7 s then 5.1 s.
- The AI is the game's script, one branch per Special level (the formation, not the level, selects it), including Special 3's once-per-band Lifeslicer at 60, 40 and 20 percent HP (the counter jumps to its band, so one drop through several lines fires one Lifeslicer).

### Not modelled (so not claimed)

- The nearness weighting of an Attack's target (50, 25, 25 percent by start position): a girl is picked uniformly, as the other FFX-2 scripts do.
- Animation and effect lengths (the RE note's open question 1): the pace is the rows' gauge costs only; the chapter runs with the action-time switch off.
- Preemptive and ambush rolls for this formation (the engine's normal roll applies); hits planned for a girl who falls mid-volley (the engine re-picks per hit).
- **Auto-Life** against Lifeslicer (no Garment Grid in the data grants it: the one answer given is the Phoenix Down) and **learning the Annihilator by being hit** (a boxed hint in the guide document only).
- The dig for parts, the repair manuals, the Primer and trophy notes, Episode Complete and New Game+ (not traced and not part of a battle).
- The unlisted Special levels 2 to 4 have no chapter path (the model and its tests keep them).

## 4. Difficulty: measured, not tuned (D-410: nothing in the boss was tuned to a number)

The shipped line (`src/engine/tactics/ffx2-experiment.ts`: Yuna Protect first, then Shell once the Annihilator is on the field, heals, Phoenix Down; the Knights Darkness) is an input to a measurement. `tests/unit/chapters/experiment-bench.test.ts`, 40 seeds a cell (`wins/40`; the "fights with a KO" and the other columns are in its printed table):

| | Wait clock (default), any pace | Active clock, 1.5 s a decision | Active clock, 4 s a decision |
|---|---|---|---|
| Act I, intended line | 40 | 40 | 40 |
| Act I, naive (attack only, no heals) | 40 | 40 | 40 |
| Act II, intended line | **35** | **14** | **1** |
| Act II, naive | 0 | 0 | 0 |

- Act I is the game's own on-ramp: nearly unlosable. **Act II is hard**: the Chapter 5 preset's girls are LV 46 to 50 (Yuna has 2,488 HP), the full weapon's Rocket Launcher volleys put several hits on one girl, and Lifeslicer takes a girl whatever is up. On the Wait clock the shipped line wins 35 of 40; on the Active clock at human pace it mostly loses.
- **The guides call 5/5/5 easy with Dark Knights** (Split_Infinity, with three Dark Knights and Light Curtain; KeyBlade999 calls it fairly hard; Jegged: well-levelled girls, no complex strategy). That is for girls well above the preset, and the sources disagree; the measurement here is what the game's rows do to this party. **This is a disclosure, not a defect**: if Bailey wants it easier the honest options are a measured round (a different preset or levels), never boss numbers (`boss-side-fix-needs-measured-options`).
- The real-input e2e below won both acts on seed 3 by following the advisor's own card.

## 5. Art (provisional, new subjects only)

New subject folders in `public/art` (which is gitignored on main and local only): `characters/ffx2-experiment/idle` (the Overbuilt, Act II), `characters/ffx2-experiment-proto/idle` (the Prototype, Act I), `backdrops/ffx2-experiment-grounds` (+ `@2x`). **No approved painting was replaced.**

This worktree's `public/art` points at a **hard-link mirror of the release art tree**, `D:/pyrefly-art-experiment`: 5,247 files, 5,239 of them hard links (no extra bytes; my first note to the driver said 4,239, which was wrong) and 8 real files of ours (the seven new-subject files below and the mirror's own `manifest.json`, a real copy because the manifest tool rewrites it in place). Nothing was written into the release art tree.

- The two machines are the **overnight art run's picks** (Z-Image Turbo): `experiment-overbuilt/idle/t10-exp-over-z1-cand-1401.png` and `experiment-prototype/idle/t10-exp-proto-z1-cand-801.png` (from `D:/pyrefly-overnight-art/2026-10-10/`), trimmed to the content with the house 16 px margin, facing left, sidecars marked `PROVISIONAL ... notApproved` with the candidate's own settings embedded. Hashes are in the sidecars.
- **The backdrop is a stand-in**: a real copy of Chapter XVI's approved Chamber plate under a new name (sidecar `notApproved`). I looked at the art run's hall candidates after it finished (the teal crystal hall, `experiment-hall/backdrop/t10-exp-hall-p4-teal-cand-703` and its 2688 x 1536 upscale `t10-up-hall-p4-703-cand-1.raw.png`, and the img2img variants of the Chamber) and **tried the teal one in the scene** with the plate shifted so its floor band lands under the girls' feet: it matches the research's description of the room better (teal panels, cyan glass columns) but its floor is a neon reflective band that blows the bloom out around the party at every hit, and its flat emblem panels are far from the approved paintings' painterly style, so it was **not** installed (the trial was reverted, files restored byte for byte). To swap a plate later: replace `backdrops/ffx2-experiment-grounds.png`/`@2x.png`, then re-solve `EXPERIMENT_GROUNDS_FRAME` in `src/scenes/experiment-grounds.ts` against it (the trial that looked least bad: centreY 30, phoneCentreY 25.5, shiftX 0, horizon 0.74 to 0.86, groundBand 0.88 to 0.99). **Not installed either:** the art run's attack, cast, hurt and KO candidates for the two machines (each is a re-roll of the same description, so the machine changes between frames) and its Rebuilt and Half-built machines (the chapter has two acts, two bodies); the idle is used for every pose.
- **Files for the driver to copy into the release art tree** (never write through a hard link): `characters/ffx2-experiment/{idle.png,idle.json}`, `characters/ffx2-experiment-proto/{idle.png,idle.json}`, `backdrops/ffx2-experiment-grounds{.png,@2x.png,.json}`; then regenerate the manifest there (`node tools/gen/manifest.mjs`). The build's art derive step makes the shipped WebP/PNG as it does for every master.
- The scene stages both bodies at the game's own height: 50.78 over the party's 17.727 mean = **2.86 times the girls** (5.098 over the Chamber's 1.78), by the RE note's engine height (the shared fiend-stature table holds engine scales 1 and 4 only, so the ratio lives in the scene file). **On an upright phone it stands at 0.7 of that (3.569)**, the share Bailey picked for the giants on the phone (2026-10-08): at its real height the machine was cut by the phone's 390 px slice in the first browser run. A staging pick of mine by analogy, his to change (`EXPERIMENT_PHONE_SHARE` in `src/scenes/experiment-grounds.ts`).

## 6. Files and merge hot spots

New: `src/data/chapter-ffx2-experiment.ts`, `chapter-meta-ffx2-experiment.ts`, `experiment-plates.ts`; `src/data/ffx2/enemies/{experiment,experiment-abilities,experiment-levels}.ts`; `command-records/experiment.ts`; `monster-records/records-experiment.ts`; `src/battle/ffx2/ai/experiment.ts`; `src/engine/tactics/ffx2-experiment.ts`; `src/data/guides/ffx2-experiment.ts` and `guides/docs/ffx2-experiment.ts`; `src/story/scripts/ffx2-experiment.ts`; `src/scenes/experiment-grounds.ts`; `src/app/screens/frontend/experimentDoor.ts`; the two research notes; the plan `docs/plans/ch-experiment-review.md`; the tests listed in section 8.

Shared files touched (all additive; recorded in `docs/CONTRACT-CHANGES.md`, newest entry on top). **Likely conflicts with the `ch-gui` lane, in order:**

1. `src/data/encounters.ts`: `ChapterId` gains `'ffx2-masterpiece-theatre'` (on the `'ff7-guard-scorpion'` line), `ListedChapterId` excludes it, `Chapter.number` gains `20`, `EXPERIMENT_CHAPTERS` gains a member, and its import shares the Leblanc import's line (the Gui lane edits the same union and array). **The file is at 399 of the house limit of 400 lines with these** (`yojimbo-repair.test.ts` pins it: the full suite caught my first draft at 401), so the merged file with the Gui lane's additions will exceed it: move the hidden experiments' registrations out (a small `experiment-chapters.ts`), do not trim comments blindly.
2. `src/app/screens/ChapterSelectScreen.ts`: one `WordDoor` field, one `armDoor` line, one `onDoorKey` block (the Gui lane adds its own word beside).
3. `tests/unit/exp-leblanc.test.ts` and `exp-leblanc-door.test.ts`: four lines that assumed `EXPERIMENT_CHAPTERS` was exactly the Leblanc preview now filter by id, byte for byte as the Gui lane changed them.
4. `src/data/guides/index.ts`, `guides/docs/index.ts`, `src/engine/tactics/index.ts` and `lookup.ts` (registrations); `tests/unit/strategy-guide.test.ts` (the hard `GUIDES` length now counts the listed chapters' guides only, 18) and `tests/unit/guide-ffx2-wait-habit.test.ts` (the carriers list gains this id).
5. `src/battle/common/types.ts` (one optional field, `EnemyGroupDef.noSaveSphereCard`) and `app/screens/BattleEncounterChain.ts` (one condition).
6. `src/scenes/index.ts`, `src/battle/ffx2/ai/index.ts`, `data/ffx2/enemies/index.ts`, `command-records/index.ts`, `monster-records/records.ts`, `data/chapter-meta.ts`: one registration line each.
7. Found by the full suite and fixed here: `tests/unit/data-ffx2-command-records.test.ts` and `data-ffx2-monster-records.test.ts` iterate every attached record against the fixtures of the seven LISTED chapters, so they skip the Experiment's rows by prefix (those are pinned by `experiment-engine.test.ts` against `experiment_rows.json`); `src/engine/pyreflyCanon.ts` needs one row per registered scene (the Experiment's: unattested, citing the research's arena section). The Gui lane's scene and records will meet the same three tests.

## 7. Open points for Bailey and the driver

1. **Listing**: the chapter stays hidden until Bailey says. Listing is a record move (into `CHAPTERS`/`CHAPTER_IDS`, an `ExperimentalLeblanc`-style removal of `experimental`), a number and a numeral, plus the board's card art.
2. **Difficulty** (section 4): Act II as the game's rows make it, which is hard on the Active clock at human pace. His call, by a measured round if he wants it changed.
3. **Art**: the two machines are candidates he has not seen; the plate is a copy of an approved one. Approve, replace or keep.
4. **Music by ear**: existing cues only.
5. **The seam is short on purpose** (about 17 s, about 340 typed characters). A mid-battle beat is cut at its authored length plus 1.5 s at the default text speed, so a slower text setting (the settings go to 0.5) loses the tail of any seam; the first draft was 24.1 s inside the 26 s cap and the browser showed what the cap hides. Worth a look at the shared deadline (it does not scale the grace with the text speed): not changed here.
6. A frame-rate caution for anyone running the e2e: software GL on this machine renders about one frame a second at 1600x900, and a mid-battle beat is paid for in scene time (frames, each at most 50 ms), so the runner cuts it at its wall-clock deadline when frames stall. The seam's text is pinned by unit tests; the e2e checks that the beat fired and that no Save Sphere card was drawn, and reads the rest line when the page is fast enough (`EXPERIMENT_E2E_STRICT_SEAM=1` requires it).

## 8. Tests and verification

- New unit files (all in the branch): `ffx2-experiment-door` (33), `chapters/experiment-model` (17), `experiment-engine` (36: the rows against the fixture, the kernel damage against the note's emulator runs, the AI per Special level with stubs, the real engine for Lifeslicer through Protect and Shell, ten Rocket hits, the Annihilator band, the seam trigger, the restore, the checkpoint), `experiment-flow` (9: the chain with the real loop, no card, the restore, the checkpoint, the control at Chapter XI), `experiment-story` (17), `experiment-guide` (10), `experiment-scene` (7), `experiment-bench` (27: the table above); the e2e `tests/e2e/ffx2-experiment.spec.ts` (desktop keys and phone touch).
- `tsc --noEmit` and `tsc -p tsconfig.e2e.json --noEmit` clean; `node tools/orphans.mjs` lists none of this chapter's modules.
- VERIFICATION_RESULTS_PLACEHOLDER

## 9. For the driver: NOW.md line and release notes

NOW.md (suggested): "The Experiment (hidden FFX-2 chapter, typed word `experiment` on the board, number 20 `EXP`): built on branch `ch-experiment`, pushed; the game's own rows from the RE note, two acts with a restore and a retry checkpoint, no Save Sphere card; art provisional (machines from the overnight run, plate a copy of the Chamber's); Act II is hard on the Active clock at human pace (35 of 40 on Wait), measured not tuned; listing waits for Bailey."

CHANGELOG (FFX-2 only): "A hidden chapter, The Experiment (type `experiment` on the chapter-select board): the Machine Faction's weapon at Djose Temple, fought twice, as a first test and then rebuilt to the limit, on the game's own numbers."

Ledger rows are the driver's: the concept pick (B), the no-card decision, the difficulty disclosure, and the art picks (provisional).
