# Paper preflight (draft): hidden chapter 50 (provisional) — The Oblitzerator and the crane, Luca dock (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md` and the wave-2 drafts (`ch-beast-review.md`). A number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-09 by a Sonnet sub-agent of the release driver (treeless lane, program row 50). Authority (relayed words, verbatim): Bailey 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick below is the planner's recommendation, "driver's call, his to overturn", with the alternative named.** Nothing deploys.

**Read:** `research/re-ffx-oblitzerator-crane.md` (the research note; "RE §n" below), the program plan (row 50, sections 6 to 9), the built Wendigo and Spherimorph chapters' file lists on `origin/main` bc93b1fdd (`docs/handoff/ch-wendigo.md`, `ch-spherimorph.md`) as the template of what a chapter contains, `src/data/ffx/builds/mushroom-rock.ts` (the start records) and `macalania.ts` (the Luca build's two ends). **Engine claims were read at `origin/main` bc93b1fdd; nothing was run, so rule 3 is owed by T0 and T10.**

**Verdict: PROCEED on data, AI, formation rules and the crane seams now; HOLD everything Bailey will see or hear (the Oblitzerator's and the crane's paintings, the dock plate, the music) until the end-state picks of section 9 are made (hard rule 9); the winnability numbers wait for the bench.** A small chapter: a tutorial-grade fight whose whole point is one idea (use the crane).

## 0. What changes against the plan (read first)

1. **Both scripts are read in full and are tiny:** 783 and 723 bytes of code; the formation is 8,205 bytes, **all camera except five lines of rules**. The plan's "187 KB" is the file size (model data). R is finished; only live checks remain (RE §8).
2. **The fight is a puzzle with one answer, not a damage race:** the Crane (65,535 HP, **absorbs Thunder**) powers on the **third** player Thunder (or one Thunder Fury) and then Tidus's Trigger Command **Use crane** takes **15/16 of the Oblitzerator's current HP** (5,625 from full) and ends its turns and counters. [RE §4.5]
3. **The Oblitzerator speeds up when hurt** (AGI 1, +15 below one third HP, +10 below one twelfth): a slog gets harder as it goes. [RE §4.2]
4. **The Doze Ball counter does not exist in play** (no player command has formula 2): two guides say Overdrives draw it. The files win; a live check settles it. [RE §4.3]
5. **No Luca build exists in the repo.** The earliest FFX presets are the Ridge's and the Temple's. A new `[estimate]` build is needed (section 4). It is the chapter's one real piece of invention and is flagged as such.
6. **The size drops** (35 to 23 hours, section 11).

## 1. Game case and sources

**Game case: FFX only.** CTB, the FFX status set, the Trigger Command system. FFX-2 has no Oblitzerator; nothing here applies to it. New logic lives in new files under `src/battle/ffx` and `src/data/ffx` (an absence test pins that no ffx2 file imports it, as for the Keeper); the chapter registration and the other shared tables (PLAN §7) are shared plumbing, case "both", inert for every other chapter, left to the wave's integrator commit.

| Source | What it gives | Tag |
|---|---|---|
| RE note: `m110`, `m133`, `cdsp02_00`, the command rows | the records, the formation, the whole AI, every number below | [bytes] (FFX_Data.vbf, Steam build 25501027) |
| RE §4 [run] | exact tallies of both scripts in the Atel interpreter: the counters 21,846/65,536, the crane count, the speed-up | [run] |
| Jegged "09 Luca"; Gamer Guides "Oblitzerator" (HD); Samurai Gamers; Game8 and Ludo.guide (search summaries) | the guides' account: agrees with the files except Doze Ball and Threaten | [guide] |
| `START_RECORDS` (`mushroom-rock.ts`), `macalania.ts` | the Luca build's two ends | [game table], [estimate] |
| GameFAQs, the Final Fantasy wiki, StrategyWiki | not read (403 / 402); the tie-break was never needed | |

## 2. What the player experiences, in plain words (the game's own rules, RE §4)

**The set-up.** Yuna has been taken at the docks. Tidus, Lulu and Kimahri stand on the dock, the Oblitzerator (a blitzball-throwing machine) ahead of them, a crane to their right. **No escape.** Normal start. On Tidus's first turn he points the crane out (a short scene), and a **Trigger Command "Use crane"** is on his menu from the start.

**Its turns.** Very few at first (one per about six of the party's actions): **Blitzball Rush**, ten balls spread at random over whoever is standing, 32 to 39 each against the Luca cells; the Cheer helps, Protect and Shell do not. Below a third of its HP it is about twice as fast; below a twelfth, three times.

**Its reactions.** Hit it with a weapon or any physical command and in one case out of three a **Blind Ball** gives the attacker Darkness; hit it with a spell and in one case out of three a **Mute Ball** Silences the caster. (Eye Drops and Echo Screens cure them.) **Spells aimed at the crane draw nothing.**

**The way through.** "Use crane" first does nothing: the crane has no power, and Tidus and Lulu say so and say what to try. **Three Thunder spells on the crane** (Lulu's; Thunder Fury does it in one) and the crane answers each time and wakes on the third. "Use crane" then drops the Oblitzerator to a sixteenth of its HP, it stops acting, and one more hit ends the fight.

**The win.** HP 0, battle won. 580 gil, 36 AP (54 on overkill), an Elixir, a Potion to steal, one piece of gear. [RE §1.1]

**The design fact `[derived]`.** The first-time player is meant to read the crane, not out-damage 6,000 HP. A fan who ignores the crane can still win (about twelve Thunders or thirty physical hits), against a machine that doubles its speed. The chapter keeps both ways open and says which is the intended one.

## 3. Engine work

Each row is mapped to the files on `origin/main`, marked **existing**, **partly** or **new**, and sized `[estimate]`: S under 1 agent-hour, M 1 to 3, L over 3. Host files at the 400-line cap (`encounters.ts`, `battle/ffx/setup.ts`, `chapter-meta.ts`) get net-zero edits or a one-line hook.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | Records of `m110` and `m133`, rows (Blitzball Rush 10-hit random spread, the three balls, Crane row f5 p15), loot | **Existing** formulas and statuses; new data. Random spread exists for player Furies (`targeting.ts` `isPerHitRandom`, `target-builder.ts`); wiring a monster ability to it is data | new `data/ffx/enemies/blitz.ts` + `blitz-abilities.ts`, `loot/records.ts` entry, `data/ffx/blitz-ids.ts` | S |
| 2 | The counters by command formula (1 -> Blind Ball, 3 -> Mute Ball, 1 in 3, on the attacker); no counter after the crane | **New, tiny**: the formula of a command is on the used-command report | new `ai/blitz-rules.ts` | S |
| 3 | The speed-up: AGI +15 below one third, +10 below one twelfth, one step per hit | **Existing pattern** (scripts that write AGI: the Spectral Keeper's AI) | rules file | S |
| 4 | The Crane as an actor: no turns, not on the CTB bar, absorbs Thunder, immune to the rest, targetable, 65,535 HP, **does not end the battle** | **Existing** (turnless targets: Sin's and Gui's parts; `getsTurns` in the scheduler) | enemy data | S |
| 5 | Thunder count on the crane (exact command 0x3043 x3, or Thunder Fury once), messages, power flag | **New, small** | rules file | S |
| 6 | **"Use crane" Trigger Command on Tidus only**: no effect before power (a line), after power it queues the Crane row on the Oblitzerator, then removes itself and makes the crane untargetable | **Partly**: the Trigger Command machinery exists (`commands.ts`, `special-menu-markers.ts`, Talk, Evrae's orders); a new marker and a handler | `abilities/special-orders-*.ts` (new file), `commands.ts` hook | M |
| 7 | **A monster's command landing on another monster as a reaction** (the Crane row, f5 p15, on the Oblitzerator) | **Partly**: the hook reaction queue runs a command "as its owner" (`ai/hooks.ts` `queueReaction`, `forced` option); the owner here has no turns | rules file + a test | S to M |
| 8 | The Oblitzerator's "ended" state: no turns, no counters, exit animation on being hit by the Crane row (Special 1 forced), `endBattle(Victory)` on death | **Existing** hook set (`onDeath`, `forced`) | rules file | S |
| 9 | Formation: Escape and Flee off for all, Normal start, three party entries, no aeon entry | **Existing** (`formation-commands.ts`) | formation data | S |
| 10 | The Luca build (new `[estimate]`) and its bag | **New data**, from `START_RECORDS` and `macalania.ts` | `builds/luca.ts` | S |
| 11 | HUD | **None new** (the Trigger Command shows in the existing menu) | | none |
| 12 | Presentation: a dock plate, the Oblitzerator's poses (idle, rush, hurt, exit, the body stays), the crane in two states (dead, powered), a balls effect | **New** | `scenes`, `engine` | M |
| 13 | Chapter plumbing: new `ChapterId`, `Chapter.number` 50 (the union ends at 44, 46, 49 today), meta, story (the first-turn scene and the crane lines), door word `blitz`, guide, tactic; absence tests | **New**, via side tables and new files | PLAN §7 | M |

**Order of dependence:** 6 and 7 are the only real seams, small and independent; 5 after 4; 8 after 7.

## 4. The party

- **Fixed trio: Tidus, Lulu, Kimahri**, no bench, no aeon (Yuna is not there). [guide] [RE §5]
- **Build point:** `builds/luca.ts`, new, derived and flagged: the game's start records moved **3/10 of the way to the repo's Macalania preset** (stop 3 of 10; the Ridge's rule is 1/2 at stop 5), rounded down. Tidus HP 709, MP 24, STR 16, DEF 10, MAG 6, MDF 6, AGI 13, Luck 18, EVA 12, ACC 12; Lulu HP 521, MP 125, STR 5, DEF 8, MAG 24, MDF 31, AGI 6, EVA 40; Kimahri HP 810, MP 84, STR 17, DEF 15, MAG 17, MDF 6, AGI 7. **Lower bound** the raw start records. `[estimate]`, never tuned toward a result.
- **Kits** carry only what the fight and the guides name: Tidus **Cheer, Haste** (the start commands) and the Trigger Command **Use crane**; Lulu **Thunder** (and Fire, Blizzard, Water: the first-tier four, `[estimate]`), **Focus** if the grid has reached it (`[estimate]`: leave out); Kimahri's Lancet and Jump are not needed. **Bag `[estimate]`:** Potions (10), Phoenix Down (2), **Eye Drops (3), Echo Screen (3)** (the guides' cures for the two balls), Antidote (2). All `[estimate]`.
- **Gaps, none of which this lane fills (rule 6):** the Overdrive gauges (Lulu's Thunder Fury needs a gauge and an unlocked Fury), the real bag, the real Sphere Grid state. **Boss numbers are never tuned**; if the measured line is unwinnable or trivial, Bailey gets options with numbers (the build fraction, the bag, the gauge).

## 5. The arena

- **No Luca dock plate exists** (the newest art mirror holds the Gagazet, Macalania, Bevelle, Via Purifico, Mushroom Rock Road, Wendigo lake plates and others; nothing named for Luca or a harbour). The dock is a new plate.
- **Options (end state first, rule 9; a mockup at real resolution each, owed before building):** **(a)** a new `luca-dock` plate (the Number 4 Dock: warehouse wall, containers, the crane at the right, a blitzball-machine ramp ahead; 1 plate + depth + 2x); **(b)** the plate plus the **crane as a separate overlay with two states** (dead, powered: sparks on the arm) so the fight's one visual beat is on screen (**recommended**: it reads without a line of text); **(c)** a stand-in: `mushroom-rock-road` (the coast road) with the crane overlay drawn on it (cheapest, wrong place). **Recommendation (b).**
- **Positions** (RE §2): party (31, 0, -47), (1, 0, -62), (-29, 0, -47); Oblitzerator (-1, 2.9, 25); Crane (68.6, -2.9, -67.1) behind and to the right. The scene's slots follow these.
- **Phone:** a 390 x 844 solve is part of the pick (the crane to the right edge must stay in frame).

## 6. New art needed

Counts are images; poses follow the repo's boss sets.

| Asset | Images | Note |
|---|---:|---|
| **The Oblitzerator** (a large machine that throws blitzballs, with a cannon arm) | 5 | idle, attack (the Rush), hurt, exit (lifted by the crane), ko ("Boss": the body stays) |
| **The crane** | 2 | dead, powered (overlay) |
| Backdrop `luca-dock` | 1 | (+ depth, 2x), option (a)/(b) |
| Effects (balls, sparks) | 1 | may be drawn in code |
| Chapter card, thumbnail, pause plate | 3 | from the picks |
| **Total** | **about 12** | |

- **Existing and reused:** `tidus`, `lulu`, `kimahri` (all in the mirror). No Oblitzerator, no crane, no Luca anything exists.
- Art route is the driver's (the Art Room per the standing art rules); nobody queues ComfyUI here (rule 12). The painting that ships must match the approved painted look (rule 9; the retail-assets rule was lifted 2026-10-18, but this chapter is painted 2.5D). **Bailey alone approves a painting.** Alternative the Wendigo chapter took (a 3D Meshy stage): the driver's call, not recommended for a one-idea fight.

## 7. Music (rule 13: only his ears judge)

The formation sets no music; the field launches it (**unsourced**). Stand-ins (flagged): the normal battle cue `battle-ffx`, which the game most plausibly plays, with the Seymour boss cue `boss-seymour` as the louder alternative; an entry on the audition page for Bailey.

## 8. Winnability method (rule 15: nothing is tuned; the bench measures and the preset moves)

**Intent:** a tutorial-grade fight: the **crane line** should be near-certain; the **slog** and the **naive line** are measured and reported, not tuned. **Target (the chain's band does not apply):** the crane line wins **at least 95 percent**; the slog line (no crane, cures used) reported; the naive line (no crane, no cures) reported. **Levers, in order:** the build fraction (S0 / S3), the bag (Eye Drops, Echo Screens, Potions), Tidus's Cheer and Haste, the Overdrive gauge. **Never** the Oblitzerator's numbers.

**The sourced line the advisor carries (`engine/tactics/blitz.ts`, one named constant per rule):** Cheer and Haste first; **Lulu's Thunder on the Crane three times** (a cast at the crane draws no ball); **Use crane**; finish with any attack; cure Darkness and Silence only if the line needs it; never spend Thunder on the Oblitzerator itself unless the crane is gone.

**Predictions from the arithmetic (to be falsified by the bench, not promises):** (1) the crane line takes 5 to 7 party actions, one Blitzball Rush, no deaths (a full-HP Lulu survives all ten balls on her: 340 to 390 against 521); (2) the slog needs about 14 Lulu Thunders or 30 to 40 physical hits and meets the speed-up; (3) a Silenced Lulu is the main way the crane line slips (a Mute Ball needs her to have cast at the Oblitzerator, so only the slog sees it).

**Tests (T0 first, T10 last):** T0 the engine checks (rows 6 and 7, and the Crane row on the Oblitzerator end to end); T1 the data fixture; **T2 the AI rules with the interpreter's exact tallies as pins: the counter 21,846/65,536 for formula 1 and for 3, none for 7 and for the crane; the crane count (2 responses, power on the 3rd Thunder, or on one Thunder Fury; Thundara and Fire do nothing); the speed-up lines 2,000 and 500 and the one-step-per-hit rule; the Crane row 15/16 of current HP; the ended state**; T3 the bench (12 then 500 seeds, copied from `tools/mirror-aeons-bench.mjs`, ablation for any mover); T4 the HUD (none new); T10 the integration. Rule 14: FFX only; the absence test names `ffx2-atb-golden` and `ff7-golden` unchanged.

## 9. Picks (driver's calls, his to overturn); each perceivable one owes 2 to 4 end-state options before building (rule 9)

| # | Pick | Recommended | Alternative |
|---|---|---|---|
| OB1 | Number and word | **50, door word `blitz`** (PLAN §8; re-checked 2026-11-09 against the 29 merged words, the 15 pending plan words and `pilgrim`: 0 failures, `door-recheck.mjs`) | `oblitzerator` (fails: five clashes) |
| OB2 | Party | **Tidus, Lulu, Kimahri**, no bench | add Wakka (no source) |
| OB3 | Build | **S3**: start records 3/10 of the way to Macalania; the raw start records as the lower bound | the Ridge's 1/2 rule (too strong for Luca) |
| OB4 | Arena | **(b) a new dock plate + a two-state crane overlay** | (a) plate only; (c) the stand-in |
| OB5 | The Oblitzerator and crane looks | **New paintings**, 5 + 2 poses | a repaint of an existing machine (none fits) |
| OB6 | Doze Ball | **follow the files**: the branch is dead; the guide says so | implement "Overdrives draw Doze Ball" per two guides |
| OB7 | The crane's wake | Thunder x3 or one Thunder Fury, **exact commands** (Thundara, Fire, weapons do nothing) | any Thunder-element hit (not the files) |
| OB8 | Counters | the file's rule, hidden (1 in 3, no tell); the guide teaches the cures | an on-screen tell (not faithful) |
| OB9 | Music | stand-ins of section 7 | a new take |
| OB10 | Start and flee | Normal; Escape and Flee off | none |
| OB11 | Reward screen | the file's loot (580 gil, 36 AP, Elixir, gear) | none |

## 10. Review class, tracks, hosting

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/common/types.ts,src/battle/ffx/**,src/data/ffx/**,src/scenes/**` was **not run** (treeless lane); by the Keeper preflight's reading the chapter registry, the shared combat core and the FFX engine each class a change **DEEP**: expect **review DEEP, focused before deploy, live verification and the deep review after, obligations live + focused + deep**; not save-data class. The driver re-runs the command from the host. **Ship with the wave's other chapters in one release** so they share one deep review.

**Tracks (small vertical slices):** T0 engine checks (rows 6 and 7); T1 data + loot; T2 AI and rules; T3 build + bag + bench; T4 scene and plate (blocked on OB4); T5 art (blocked on OB5, serialised); T6 guide/story/card; T7 the integrator (shared tables, tests, the door-word re-check with `door-check.mjs`). **Host (PLAN §6):** a clean merged-and-live tree with `node_modules` and a `public/art` junction repointed to the newest mirror (the newest one at this writing); the driver's choice, as the table in PLAN §6 is two releases old.

## 11. Size (Sonnet agent-hours, counted the way `ch-keeper-review.md` counts)

| | Plan | This preflight | Why |
|---|---:|---:|---|
| R research | 7 | **1** | both scripts read; half an hour of live checks |
| B build | 14 | **9** | data and loot (S), counters and speed-up (S), crane count and messages (S), Trigger Command (M), reaction on a monster (S to M), build and bag (S), story lines (S), guide and tactic (S) |
| A art | 7 | **6** | the machine (3), the crane and overlay (1), the plate decision (1 to 2), cards (1) |
| I integration and tests | 7 | **7** | the 12 to 15 shared tables (PLAN §7) |
| **Total** | **35** | **23** | |

## 12. Top risks

| Risk | Answer |
|---|---|
| The Trigger Command has no handler pattern for a monster-to-monster hit | rows 6 and 7 are the seams; T0 proves them first; fallback: apply the Crane row as the command's own effect on the Oblitzerator (same numbers, no reaction) |
| The Luca build is invented | said plainly in the card and the handoff; S0 / S3 both measured; never tuned toward a result |
| The chapter feels thin (one idea) | it is a tutorial-grade fight by the game's own design; the PLAN's section 5 "honest build" applies; the card says so |
| The guides' Doze Ball claim is right and the files are mis-read | the live check (RE §8.1) is ten minutes; the branch is one data row |
| A host file at the 400-line cap | net-zero edits and side tables; shared edits left to the integrator |

## 13. Open questions, and the live checks that settle them (about thirty minutes)

1. Which ball an Overdrive draws (Doze Ball or Blind/Mute). 2. That the ten balls spread over the members. 3. The real party stats, bag and Sphere Grid at the dock. 4. The music. 5. That the AGI writes show as faster turns. 6. Whether the field event can end in a game over or only a retry (the chapter treats a wipe as a normal defeat).

## Changes to PLAN.md (for the driver)

Row 50: text "m110 (6,000 HP, 187 KB)" -> "6,000 HP, script 783 bytes"; add "crane powers on the 3rd Thunder or one Thunder Fury; Trigger Command 'Use crane' on Tidus; Crane takes 15/16 of current HP; the Doze Ball counter is unreachable"; size R7 B14 A7 I7 = 35 -> **R1 B9 A6 I7 = 23**; arena: "no plate; a new dock plate + crane overlay". The word `blitz` is confirmed against `origin/main`.
