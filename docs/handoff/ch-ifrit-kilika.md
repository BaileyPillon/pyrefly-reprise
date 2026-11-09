# Ifrit at Kilika Temple: the second aeon of Chapter 3, possessed (a hidden FFX-2 chapter, number 46, the word `ifrit`)

**Branch `ch-ifrit-kilika`** (from `origin/r76-release` `36b6e851d`, through the research note and paper preflight `06fcde47c`), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX-2 only** (AGENTS.md rule 14): ATB, dresspheres, the FFX-2 monster row 165 and its AI script; no FFX or FF7 file changes behaviour. The registry rows, the door row, the scene staging, the `SCENES` row and two item names are shared plumbing, "both" (CHK-020), inert for every other chapter.
**Status: built, hidden, stand-in painting only, measured by scripted players over 200 and 100 seeds (section 6), the browser smoke played by real keys from the title to the post scene, desktop and phone-sized (section 9).** The chapter opens only by a typed word on chapter select. Listing it waits for Bailey's word (IK10).
Written 2026-11-07 by a Sonnet sub-agent of the release driver. Research: `research/re-ffx2-ifrit-kilika.md` (the note); plan: `docs/plans/ch-ifrit-review.md` (the paper preflight). **The plan's row 46 was wrong in one word** ("the possessed-aeon pattern of chapter 11"): it is Valefor's (chapter 24) action-counter pattern with its own numbers, and the game's "battle too long" block is live in this scene.

Authority (relayed by the driver, verbatim): "implement all unimplemented chapters please" (2026-11-06) and "yes on all these too" (building every researched boss he never picked); 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick in section 5 is the paper preflight's own recommendation or the bench's, "driver's call, his to overturn".**

**UPDATE 2026-11-09 (r79 art install; FFX-2 only): the paintings of the art list are made, registered and wired** (the possessed Ifrit as `characters/x2-ifrit/`: the approved `ifrit` paintings through the possession grade, with cast and overdrive too; the pause plate `pause/ffx2-ifrit-kilika`; the warm Kilika chamber plate `ffx2-kilika-chamber` installed and pinned but wired to nothing; the driver's picks, his to overturn): `docs/handoff/r79-art-install.md`. `IFRIT_SPRITE` is `x2-ifrit` now; the FFX `ifrit` set is untouched.

## 0. What changed against the preflight (read first)

1. **The preflight's eight picks stood** (IF1 to IF8) with two refinements: the art is the zero-art route (the `ifrit` master as it is, IF5's alternative) with the four-pose restyle listed in section 7, because the brief asked for the reuse; and Samurai is **owned and not worn** (IF2), measured both ways.
2. **T0 found the script exactly as the note reads it** (section 4): the 19-action cycle, the Meteor victims, the free Firaga, the live block. Nothing about the engine had to change: **no engine file changed** (the new rows are data, the script is one file, and `SCENES` gained one key).
3. **The tactic differs from the Valefor line in two places the preflight did not name** (IK9): Paine breaks **Defense first** (his 98 is the wall) and the Mega-Potion rule is **left out** (the Chapter 2 preset's bag holds none, so a rule for one would never fire; the Valefor tactic carries one that is equally dead with this bag). Pinned by `ifrit-kilika-tactic.test.ts`.
4. **No flat action time** (IK11): the chapters made after r56 do not set the old 3 s window (the per-command span supersedes it). The bench still measures the cells with the time taken away (`actionTimeSeconds: 0`), as the Valefor bench did.
5. **The block's "no guest" test is modelled, not read** (U1, IK3): see section 3.

## 1. Play it

1. From the title, reach the chapter-select board. Type **`ifrit`** (any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it. Its letters: I and T are bound to nothing, F is `l1` and R is `r1`, which the board ignores, so no letter moves the cursor; on a phone, the long-press field on the "Chapter select" label takes the same word.
2. Party prep shows **the three girls**: the Chapter 2 preset carried forward (Yuna Lv 23 White Mage, Rikku Lv 24 Dark Knight, Paine Lv 25 Warrior), with the Samurai dressphere owned. Enter starts the chapter: a pre scene (our draft, section 8), then the fight on the Chamber of the Fayth's plate, then the post scene and the results page.
3. A defeat retries the fight from the party prep. Escape is off.
4. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration. The kill rewards are the row's own: EXP 1,800, AP 15, gil 1,300, an Angel Earrings drop, Fiery Gleam to steal.

## 2. What it is

One boss, one link: Ifrit, bestiary #179, **Lv 23, HP 8,820, MP 9,999**, STR 82 / MAG 22 / DEF 98 / MDEF 49 / AGI 114 / ACC 95 / EVA 14 / LCK 2. **Absorbs Fire, weak to Ice, Gravity nulled.** Immune to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Itchy, Auto-Life, Stop and Doom; **Slow and every Break land**; the special word 0x3c3 (no percent-HP damage, no delay, no Interrupt, no Bribe); his automatic status is "uses no MP".

| His move | Row | Class and numbers | Reaches |
|---|---|---|---|
| Attack | 0x41da | physical, power 16, the one move that rolls to hit (accuracy 95) | a near-weighted living girl (Yuna 41.9 %, Rikku 29.1, Paine 29.0 at the start) |
| Firaga | 0x41f1 | magic, **Fire**, power 19, cast 70, MP 24 (free for him) | all three |
| Meteor Strike | 0x4095 | magic, power 25, ATB 80, cast 100 | **the girl farthest from him** (Yuna while she is up; Rikku or Paine, tied, once she is down) |
| Hellfire | 0x4094 | magic, **Fire**, power 24, ATB 100, **cast 180** (the longest) | all three |
| Time Up Meteor | 0x4236 | fixed (power x 50), power 200, **12 hits**, everyone | only after 200 of his turns |

**The script (`m165`), in the game's order.** One gauge and a Meteor count, no HP phases. Each turn: gauge at least 100: Hellfire (gauge and count back to 0); else at 90 with fewer than 3 Meteors fired, at 60 with fewer than 2, at 30 with none: a Meteor Strike at the farthest girl (it adds nothing to the gauge); else an ordinary action: **gauge + 7**, then one draw in three, **0 Firaga on all, 1 or 2 Attack**. Every result applied to him adds 5. **With nobody hitting him a cycle is 19 actions: 15 ordinary, Meteors on the 6th, 11th and 16th, Hellfire on the 19th** (no guide states that the Meteor and the Hellfire add nothing); every hit brings it forward (with a result after every action: Meteors on the 4th, 7th and 10th, Hellfire on the 12th). **The block:** while no friendly guest is present a counter rises each turn; past 180 he shows a first announcement, past 190 a second, past 195 a third, past 200 a fourth (each its own turn, on turns 181, 191, 196 and 201), then **Time Up Meteor on every turn from 202**. At 19 actions a cycle turn 180 is the tenth Hellfire; the bench's longest fight is 34 of his actions.

## 3. The data and its sources (rule 6: nothing invented)

Every number is `research/re-ffx2-ifrit-kilika.md` (the research lane, 2026-11-07: `monster.bin` row 165, the plain-text AI source and the compiled worker, `monmagic.bin`, the scene file `pos_klyt11_229`), tagged `[RE row 165]` in the files and equal to `research/ffx2-fallen-aeons.md` §7.1 (SinirothX + the FF Wiki, `[verified: 2 sources]`) wherever the two speak. **`tests/fixtures/parity/ffx2/ifrit_kilika_rows.json`** holds the monster, the nine moves, the start positions and the script's constants as decoded numbers with their file offsets, written by a reader of this lane from the Steam HD kernel tables (not copied from the note), and `tests/unit/chapters/ifrit-kilika-data.test.ts` (28 tests) compares the enemy data, the monster record and the command records to it field by field. No game text, script text or byte dump is in the repo.

**Gaps, named (not invented):**
- **The guest test of the block (U1).** The worker tests "the count of friendly player characters is zero"; the Yuna's Ballad note read the same call as "no girl alive", and the sources do not settle it. The block is **modelled as live** with "a guest is any party unit other than Yuna, Rikku and Paine" (`guestPresent`), which no mission fight has; either reading leaves a normal fight untouched (turn 180 is unreachable, section 6). `IFRIT_TOO_LONG_BLOCK_ON = false` removes it in one line.
- **Item effects and prices.** Angel Earrings (accessory 0x9045, drop) and Fiery Gleam (0x9020, steal) are held-only rows with **no price** (unsourced); Angel Earrings' effect is `ffx2-combat-core.md` §5.4 (Def +5, MDef +5, Deathproof), Fiery Gleam's is not in the research.
- **The announcements' wording.** The four rows have formula 0, power 0 and no hits; their banner texts are **our own words** (the game's strings are not copied): "Ifrit grows restless", "Ifrit rages", "Ifrit is about to blow", "Ifrit ends this now".
- **The body radii** (which girls tie for "farthest") are not read: the engine takes the start positions as they are, Valefor's disclosure (a)/(b)/(c)/(d) applies unchanged.
- **His motion set 0x10a5** has no frame table in the repo (`MONSTER_MOTION_SET`, `MONSTER_CLIP_FRAMES`, `action-frames.ts`): the engine keeps today's hit-reaction window on him, as on the Bevelle guardians and the Farplane Cup's duelists. **Not read, not guessed.**
- **The party's levels and bag** have no source at Kilika (the Chapter 2 preset carried, `[estimate]`).

## 4. Engine work and what the T0 checks found

| # | Need | What was done |
|---|---|---|
| E1 | the script | `battle/ffx2/ai/ifrit.ts` (182 lines with the header): the gauge, the Meteor count, the band test, the block |
| E2 | the rows | `data/ffx2/enemies/ifrit{,-abilities}.ts`, `command-records/ifrit.ts`, `monster-records/records-ifrit.ts`, the kill-reward row, two held items, `SCENES.kilika`, the fixture |
| E3 | the free Firaga | **no engine change**: his MP is 9,999 and the cost is the row's 24 (416 casts); the status word is pinned by the data test, not read by the engine |
| E4 | chapter plumbing | the id `ffx2-ifrit-kilika`, number 46, meta, the door `ifrit`, the story, the route word in `critic/runner/lib/route-pure.mjs`, the Chamber's staging for his id, the tactic and the guide pair |

**T0 findings (each pinned by a test, run on the real engine first, not written from the note):**
1. **The 19-action cycle holds in the real engine** (3 seeds, a party that only defends): Meteors on his 6th, 11th, 16th, 25th, 30th and 35th action, Hellfire on the 19th and 38th (`ifrit-kilika-engine.test.ts`).
2. **The Meteor goes to Yuna while she is up** and to Rikku or Paine after; the damage reaches that girl alone. Firaga and Hellfire reach exactly the girls who are up, as Fire; the Meteor is non-elemental.
3. **Fire heals him and Ice hurts** (a Black Mage Yuna with the free Fire and Blizzard: the damage event is negative with affinity `absorb`, then positive with `weak`).
4. **The cadence** at his Agility 114, no action time: Attack 92 steps, Firaga 66, Meteor Strike 166, Hellfire 257 (the rows' own costs).
5. **The block, end to end** (the counter preloaded to 178, a level-99 party topped up at every decision): the stages on turns 181, 191, 196 and 201, Time Up Meteor from 202, and the party wiped by it.
6. **One engine observation, not this chapter's and not investigated:** once a girl is knocked out, every one of his actions measured 30 steps (1 s) longer in this rig (Attack 122 for 92, Firaga 96 for 66, Meteor 196 for 166). The cadence test keeps the girls up for that reason. Whether this is the engine's KO hold or something else is for the FFX-2 engine's owner.

## 5. The picks (the driver's, under Bailey's blanket yes; each with its alternative, his to overturn)

| # | Question | Pick | Alternative |
|---|---|---|---|
| IF1 | scope | **one link, the mission as the game has it** | Valefor and Ixion as a trio |
| IF2 | party | **`besaidBuild` carried, Samurai owned, not worn** (`builds/kilika.ts`, a deep copy) | Samurai worn on Paine (measured: no change), the Djose preset (measured: easy) |
| IF3 | the "battle too long" block | **ported, live** (about 40 lines, 6 tests, one constant) | leave it out (Valefor's route: its scene constant does not match; here it does) |
| IF4 | script text | **exactly the game's** (the Meteor and the Hellfire add nothing to the gauge) | none |
| IF5 | art | **the `ifrit` master as is** (the FFX aeon's painting, mirrored by the presenter) | the `x2-ifrit` restyle (section 7), four poses |
| IF6 | arena | **`ffx2-djose-chamber-standin`** (Bailey's approved Djose plate, D-273), Ifrit on Ixion's spot | a warm-graded `ffx2-kilika-chamber` derived from it |
| IF7 | music | **`boss-ffx2-fallen-aeons`, `victory-ffx2`** (existing cues; Bailey's ears, rule 13) | none |
| IF8 | id, number, word | **`ffx2-ifrit-kilika`, 46, `ifrit`** (checked against the table by `chapter-doors.test.ts`) | `kilika` |
| IK9 | the tactic (new) | **the Chapter 2 line with Armor Break first and no Mega-Potion rule**: Yuna revives, heals under 45 %, Protect then Shell, Cura under 75 %, else Pray; Rikku Darkness; Paine Armor Break, Power Break, Attack; **never Fire** | Power Break first (the Valefor order) |
| IK10 | listing | **hidden**; the board, "of 18" and the pilgrimage are untouched | list it on his word |
| IK11 | action time (new) | **none set on the formation** (the per-command span is the model) | the old flat 3 s |
| IK12 | the announcements (new) | **our own words**, scripted turns on himself with no record | the game's strings (not copied) |
| IK13 | the dead Mega-Potion rule (new) | **left out of the tactic and the card** | keep it for the Djose what-if |

**Boss numbers are not tuned.** Difficulty is the party and the line only.

## 6. Difficulty: measured, not tuned

`tests/unit/chapters/ifrit-kilika-bench.test.ts` (100 seeds a cell at bench speed and 40 at human speed in the suite; `PYREFLY_BENCH_SEEDS=200` for the table below, which runs 200 at bench speed and 100 at human speed; Wait ATB; one fight is 1.5 to 2.2 game minutes). A *line* is a test input standing in for a player (`tests/unit/helpers/ifritKilikaDrive.ts`): **advisor** (the shipped tactic) and **naive** (no Protect, no Shell, no Breaks, Cura under 40 %, otherwise Pray, Darkness and the plain Attack). "Action time OFF" takes the time away by the engine option `actionTimeSeconds: 0`.

| line | mode | wins | minutes | his actions | longest (his actions) | Firaga | Meteor | Hellfire | Meteors on Yuna % | KOs | losses |
|---|---|---|---|---|---|---|---|---|---|---|---|
| advisor | bench (0 ms), action time on | 199/200 | 1.58 | 13.47 | 17 | 2.78 | 4.41 | 1.01 | 97 | 0.23 | 1 |
| advisor | bench (0 ms), action time OFF | 174/200 | 1.02 | 12.12 | 28 | 2.54 | 3.69 | 0.97 | 80 | 0.51 | 26 |
| advisor | Wait split 1.5 s, action time on | 96/100 | 1.76 | 15.31 | 33 | 3.10 | 4.85 | 1.04 | 90 | 0.47 | 4 |
| advisor | Wait split 1.5 s, action time OFF | 79/100 | 1.22 | 14.91 | 28 | 3.16 | 4.35 | 1.02 | 74 | 0.74 | 21 |
| advisor | Active 1.5 s, action time on | 65/100 | 2.17 | 18.82 | 32 | 4.14 | 5.25 | 1.21 | 60 | 1.73 | 35 |
| advisor | Active 1.5 s, action time OFF | 57/100 | 1.50 | 18.62 | 34 | 4.24 | 4.79 | 1.17 | 57 | 1.71 | 43 |
| naive | bench (0 ms), action time on | 90/200 | 1.64 | 13.60 | 19 | 2.73 | 4.49 | 1.13 | 78 | 1.98 | 110 |
| naive | bench (0 ms), action time OFF | 48/200 | 0.92 | 10.57 | 17 | 2.19 | 3.35 | 0.88 | 68 | 2.52 | 152 |
| naive | Wait split 1.5 s, action time on | 23/100 | 1.63 | 13.68 | 21 | 2.79 | 4.27 | 1.11 | 70 | 2.57 | 77 |
| naive | Wait split 1.5 s, action time OFF | 11/100 | 0.88 | 10.43 | 16 | 2.21 | 3.20 | 0.78 | 59 | 2.79 | 89 |
| naive | Active 1.5 s, action time on | 6/100 | 1.56 | 13.69 | 23 | 3.00 | 3.77 | 1.04 | 66 | 3.02 | 94 |
| naive | Active 1.5 s, action time OFF | 4/100 | 0.89 | 11.05 | 23 | 2.42 | 2.99 | 0.73 | 52 | 2.97 | 96 |
| advisor | Paine in Samurai, bench (0 ms) | 199/200 | 1.69 | 14.38 | 23 | 2.89 | 4.81 | 1.07 | 94 | 0.40 | 1 |
| advisor | Paine in Samurai, Wait split 1.5 s | 96/100 | 1.85 | 15.70 | 25 | 3.11 | 5.23 | 1.19 | 91 | 0.50 | 4 |
| naive | Paine in Samurai, bench (0 ms) | 103/200 | 1.50 | 12.51 | 18 | 2.52 | 4.11 | 1.02 | 80 | 1.87 | 97 |
| naive | Paine in Samurai, Wait split 1.5 s | 36/100 | 1.54 | 12.88 | 17 | 2.58 | 4.22 | 0.99 | 73 | 2.33 | 64 |
| advisor | Djose preset (32/33/34), bench (0 ms) | 200/200 | 1.08 | 9.45 | 12 | 1.98 | 2.71 | 0.95 | 100 | 0.00 | 0 |
| advisor | Djose preset (32/33/34), Wait split 1.5 s | 100/100 | 1.15 | 10.13 | 12 | 2.14 | 2.87 | 0.96 | 100 | 0.00 | 0 |
| naive | Djose preset (32/33/34), bench (0 ms) | 200/200 | 1.09 | 9.48 | 13 | 1.99 | 2.72 | 0.95 | 98 | 0.10 | 0 |
| naive | Djose preset (32/33/34), Wait split 1.5 s | 100/100 | 1.16 | 10.33 | 15 | 2.23 | 2.83 | 0.94 | 97 | 0.18 | 0 |

**What that says, plainly.** The fight is **winnable and not trivial, and what separates a win from a loss is the line and the clock, not the build.** The shipped advisor line wins **199 of 200 at bench speed** and **96 of 100 at the live default clock (Wait split, 1.5 s a menu)**, and falls to **65 of 100 on the Active clock at 1.5 s a decision** (a player who answers late is hit by the Meteors and the Hellfire in the gaps: 1.7 KOs a fight against 0.2). The naive line, with no Protect, no Shell and no Breaks, wins 45 percent at bench speed and 23 percent on the live default. Taking the action time away shortens the fight (about 1.0 minute against 1.6) and makes it **harder** for the same line (174 of 200 against 199), because the girls act in the gaps less. At bench speed 97 percent of the Meteors went to Yuna (the farthest girl while she is up), who is the White Mage with the least HP: the card says so. **Samurai worn on Paine changes nothing measurable** (199 of 200 against 199 of 200, 96 of 100 against 96 of 100): the sphere is the guides' route, not an advantage here. The **Djose preset (Lv 32 to 34) is easy** (200 of 200 for both lines): the preset's level is the lever if Bailey wants the fight easier or harder, never a boss number. **No fight comes near the block:** the longest in all cells is 34 of his actions against the 180 that starts it. **Nothing was tuned.**

Options with numbers, **not built** (rule 10): a Black Mage Yuna (Ice, the weakness) was **not measured**: the advisor line has no plan for it, so a row would measure nothing; the engine test pins only that Ice hurts and Fire heals. If Bailey wants the Active clock gentler, the levers are the girls' levels or the bag (the Djose preset's five Mega-Potions and Lv 32 to 34 are the measured other end), never his rows.

## 7. ART NEEDS (nothing below exists on disk; no ComfyUI was run)

The chapter plays with the FFX aeon's approved **`ifrit`** set (idle, attack, cast, hurt, ko, overdrive, with their 2x to 4x masters and normal maps), which the presenter mirrors to face the girls. It looks like Yuna's aeon standing there, not like a possessed one. The possessed treatment is a house choice for Bailey (`x2-ixion`, `x2-shiva` and `x2-anima` are the model).

| Subject (key) | Poses (masters) | Notes |
|---|---|---|
| **Possessed Ifrit** `x2-ifrit` | idle, attack, hurt, ko; idle @2x | the restyle recipe that made `x2-ixion`, `x2-shiva`, `x2-anima`; cast and overdrive reuse the `ifrit` poses until a verdict; a sidecar JSON each; the art lane pilots, Bailey looks, then the batch (the pose-recipe lesson) |
| the pause plate `pause/ffx2-ifrit-kilika` | one plate | today's `heroArt` falls back to `characters/ifrit/idle.png` |
| the card thumbnail `chapter-ffx2-ifrit-kilika` | one image | unused while the chapter is hidden |
| a Kilika chamber plate `ffx2-kilika-chamber` (optional) | one plate | a warm-graded derivation of the Djose plate; replaces no approved painting |
| **Total** | **about 6 to 7 images** | all by the house derive method from existing paintings |

On install (the art lane's step, not this one's): the sidecars, a row for the subject in `tools/posescale/subjects.json`, the mirror's `manifest.json` rebuilt (`node tools/gen/manifest.mjs --root=<mirror>`), `src/data/art/poseRegistrationFoes.ts` regenerated by `tools/posescale/measure.py table`, and `IFRIT_SPRITE` in `src/data/ffx2/enemies/ifrit.ts` (and the `spriteKey` and `forms[0].spriteKey` it feeds) pointed at `x2-ifrit`. Bailey alone approves a painting.

## 8. The story draft

`src/story/scripts/ffx2-ifrit-kilika.ts`: **a DRAFT for Bailey to read before it ships.** A pre scene (the chamber thick with pyreflies, Rikku's joke about "pest control", Yuna's "these are somebody's memories", Ifrit rising, Paine's "then we put it out"), two callouts (his first Meteor Strike: "Keep her healed"; his first Hellfire: "Next time, shell up first"), and a post scene (the pyreflies lift, Yuna's one sincere beat, Paine's "then we find them", Rikku's certificate joke and Paine's "No."). Our own words over the sourced beats (`research/ffx2-fallen-aeons.md` §0.3 and §7.1); no line of the game's dialogue is quoted; Kilika's local plot is not staged. `ifrit-kilika-data.test.ts` holds the lint, the cast, the triggers and the shape; the flow test fires each trigger once in the real engine.

## 9. Browser jobs (headless Chromium, `PYREFLY_BROWSER=gpu`, the review-browser lock, `tools/ifrit-kilika-smoke.mjs`)

The tool plays the chapter by REAL KEYS: the word on the board, Enter through party prep and the pre scene, then the girls' turns by the menu's own rows (Yuna's White Magic: Protect, then Shell, then Pray; Rikku's and Paine's Attack at Ifrit, Enter, Enter). **Disclosed edits (the log's `edit:` lines):** every girl's HP is kept above 30 percent so the run cannot end in an accidental defeat (it fired for Yuna only), and Ifrit's HP is set to 500 after eight of his actions so the run is minutes (the last blows are still real Attacks). **The first desktop run failed in the TOOL, not the chapter** (`desk-*` shots, a log in the lane's scratch): Yuna's Protect asks for a target and the tool did not confirm it, so her menu stayed open and the loop stalled; the tool now confirms the target and backs out of a dead menu, and the second run (`desk2-*`) is the one below. `desk-*` keeps the first run's board, party prep, pre scene, first menu and pause shots.

| Job | Steps | Prediction | Result |
|---|---|---|---|
| **J1 board** | type `ifrit` on the board | party prep opens for "Ifrit"; the board still draws nineteen cards and none for the chapter | **as predicted** (`desk2-0-board.jpg`: 19 cards, no card) |
| **J2 prep** | read the card | three roster rows (Yuna 23, Rikku 24, Paine 25), the three objectives, the tip fits the box, the hero plate falls back to the Ifrit idle | **as predicted** (`desk2-1-party-prep.jpg`: "EXP . IFRIT - KILIKA TEMPLE - CHAMBER OF THE FAYTH"; the tip fills about five lines and is whole) |
| **J3 pre scene** | Enter through it | the narration box over the Chamber's plate (the pit is the Djose plate's, the disclosed stand-in), then the girls' lines | **as predicted** (`desk2-2-pre-scene.jpg`) |
| **J4 first menu** | first menu, pause | Ifrit alone at 8,820 painted with the `ifrit` set, facing the girls (the presenter mirrors it); three plates; Yuna's menu is White Magic, Change, Item; the move card and the guide panel open by themselves; the scan names his next move | **as predicted** (`desk2-3a-first-menu-clear.jpg`; `desk2-3c-pause.jpg` reads "Survive Hellfire"). **One finding, not a defect:** Ifrit acts before the girls' first menu (Yuna at 446 of 690 here, 166 of 690 in the first run): he is faster (Agility 114) and the clock starts at once, so the opening is already a fight; and in the first run's shot the move card named "Hi-Potion for Yuna" on Paine's menu with Yuna at 24 percent, the advisor's rescue before the tactic, as in every chapter |
| **J5 real keys** | Protect, Shell, Pray; Attack | Yuna's three casts and the girls' Attacks land | **as predicted**: the turn log is `protect, attack, attack, shell, attack, attack, pray, ...` (22 turns) |
| **J6 his moves** | the engine's own log | only his four moves; the first Meteor Strike goes to Yuna | **as predicted**: nine actions (Attack 4, Firaga 2, **Meteor Strike 3: his 4th, 7th and 9th**, brought forward by the girls' blows), the first Meteor on Yuna; **no Hellfire in this run** (his HP was set to 500 after eight actions; the engine tests and the bench carry Hellfire) (`desk2-4-after-meteor.jpg`, `desk2-6-ifrit-low.jpg`) |
| **J7 the close** | his last blow | the results: EXP 1,800 for each of three, AP 15, gil 1,300, an Angel Earrings drop | **as predicted** (`desk2-10-tally.jpg`, `desk2-11-results.jpg`; the fight took 2:39 of game time) |
| **J8 post scene** | Confirm, then the lines | the post scene's lines in order | **as predicted**: all four searched lines seen (`desk2-12-post-1` to `-4.jpg`) |
| **J9 console** | the whole run | no error, no 4xx | **none** (0 console errors, 0 failed responses, every run) |
| **J10 phone** | the same word and first menu at 390 x 844, touch (`--short`) | the three plates and the three command rows fit; the tip row names the first move | **as predicted** (`phone-3a-first-menu-clear.jpg`: Yuna's, Rikku's and Paine's plates, WHITE MAGIC / CHANGE / ITEM, the tip row "Protect > the party . White Magic", the scan strip "IFRIT NEXT Firaga SCRIPTED"; `phone-3c-pause.jpg`). 0 console errors, 0 failed responses |

Screenshots: `docs/screenshots/ch-ifrit-kilika/` (`desk-*` the first run, `desk2-*` the full run, `phone-*`).

## 10. Files and merge hot spots

New: `src/data/chapter-ffx2-ifrit-kilika.ts`, `chapter-meta-ffx2-ifrit-kilika.ts`; `src/data/ffx2/enemies/ifrit{,-abilities}.ts`; `src/data/ffx2/builds/kilika.ts`; `src/data/ffx2/monster-records/records-ifrit.ts`; `src/data/ffx2/command-records/ifrit.ts`; `src/battle/ffx2/ai/ifrit.ts`; `src/engine/tactics/ffx2-ifrit-kilika.ts`; `src/data/guides/ffx2-ifrit-kilika.ts` and `guides/docs/ffx2-ifrit-kilika.ts`; `src/app/screens/frontend/ifritDoor.ts`; `src/story/scripts/ffx2-ifrit-kilika.ts`; `tools/ifrit-kilika-smoke.mjs`; the fixture `tests/fixtures/parity/ffx2/ifrit_kilika_rows.json`; the helper `tests/unit/helpers/ifritKilikaDrive.ts`; seven chapter test files (`chapters/ifrit-kilika-{ai,data,engine,flow,guide,tactic,bench}.test.ts`) and `ifrit-door.test.ts`; the note, the preflight and this file.

Shared files touched (all additive; **likely conflicts with the other wave-4 lanes, in order**):
1. `src/data/encounters.ts`: `ChapterId` gains `'ffx2-ifrit-kilika'`, `ListedChapterId` excludes it, **`Chapter.number` gains `46`** (take the union with the other lanes' numbers on that line). No line is added (399 of 400).
2. `src/data/chapters-experiments.ts` (one import, one list entry, one header line), `src/data/chapter-meta-hidden-r76.ts` (one import, one list entry), `src/app/screens/frontend/chapterDoors.ts` (the row is **last** in the table), `tests/unit/helpers/doorWords.ts` (**one line: union with the other lanes' words**), `critic/runner/lib/route-pure.mjs` (one row).
3. `src/battle/ffx2/ai/index.ts`, `data/ffx2/enemies/index.ts`, `command-records/index.ts` (the rows and four `NO_COMMAND_RECORD` reasons), `monster-records/records.ts` and `kill-rewards.ts`, `battle/ffx2/adapt/kill-rewards.ts` (`0x9045`), `data/ffx2/items/held.ts` (two items and their entries in `UNSOURCED_PRICE_IDS`), `battle/ffx2/ai/script-rolls.ts` (`SCENES.kilika`).
4. `src/engine/tactics/index.ts` and `lookup.ts` (one registration and one game row each); `src/data/guides/index.ts` and `docs/index.ts` (one entry each).
5. `src/scenes/djose-chamber.ts`: `DJOSE_IFRIT_ID` on Ixion's spot and in the phone camera's list (the file is 300 lines).
6. **Two shared test edits that are not additions:** `wraith-door.test.ts` and `chapters/yunas-ballad-data.test.ts` asserted "last row of the door table" and now assert "a row of the table"; `tests/unit/helpers/doorWords.ts` raises `DOOR_PAIR_TEST_TIMEOUT_MS` from 15 s to 20 s a door (section 11).
7. Pinned lists, one edit each: `audio-music-batch1-2026-10-10`, `audio-music-batch2-2026-10-12`, `guide-ffx2-wait-habit`, `ffx2-hit-reaction-wiring`, `data-ffx2-command-records`, `data-ffx2-monster-records`, `parity-ffx2-ai-rolls` (the `SCENES` key list), `parity-ffx2-rewards-data` and its fixture `kill_reward_rows.json`, `ffx2-steal-item-names`.
8. `docs/CONTRACT-CHANGES.md`: the entry on top. **`CHANGELOG.md` and NOW.md are not edited** (the integrator writes the release entry; the lines are in section 12).

No source file added is over 400 lines (the longest, `tools/ifrit-kilika-smoke.mjs`, is about 330); `src/data/encounters.ts` (399) and `chapter-meta.ts` (398) gained no line. The bench, door and data tests are over 400 lines in the way many of the repository's tests are (the door test is generated from the Wraith one).

## 11. Tests and checks

- `node node_modules/typescript/bin/tsc --noEmit`: clean. `node tools/orphans.mjs`: 24 orphaned of 2,472 modules, the same 24 as on the base, none of this lane's (the smoke tool is not a module).
- **This chapter's tests: AI 22, data 28, engine 9, flow 5, guide 8, tactic 7, bench 3, door 17 = 99**, all green; plus the pinned lists and fixtures of the shared tests named in section 10.
- **Mutation checks** (`mutate.mjs`, kept in the lane's scratch): 16 one-line mutants of the source, each run against the five fast files: the ordinary gain 7 to 6, the hit gain 5 to 4, the third Meteor mark 90 to 100, the modulus 3 to 4, Hellfire not resetting the Meteor count, a band whose quota is met still firing, the Meteor adding to the gauge, the Meteor aimed at a near-weighted girl, the first stage at 181, the block off, a guest never stopping the counter, Fire no longer absorbed, a stat byte, Firaga's power, Hellfire's cast, and the tactic's Armor Break test removed. **All 16 killed** (1 to 10 tests each).
- **The full suite**, `vitest run --maxWorkers=3`, `BOSS_ART_ROOT` at the r76b art mirror, in the background (one run on the tree with the chapter's code committed, `a287aefcd`; what changed after it is two tests' last-row assertions, one helper constant, docs, the smoke tool and screenshots; the machine was shared with other lanes' browser jobs and rigs): **2,063 files, 2,027 passed, 32 skipped, 4 failed; 32,571 tests passed, 195 skipped, 1 todo, 4 failed; 4,400 s.** Every failure explained:
  - `wraith-door.test.ts` ("... and is the last row") and `chapters/yunas-ballad-data.test.ts` ("its door is the word wraith, last in the table"): **this lane's row is now the last of `CHAPTER_DOORS`**, so Yuna's Ballad's two `CHAPTER_DOORS.at(-1)` assertions failed. They say "a row of the table" now (`toContainEqual`), and so does this chapter's own door test; the same edit will be needed by every later door unless it is made once (the integrator's). Both files re-run green (with `ifrit-door` and `chapter-doors`: 79 tests).
  - `windwaker-door.test.ts` and `angra-door.test.ts` ("the first word to finish wins when two are typed in a row"): **load timeouts, not behaviour**: 423 s and 400 s against the 360 s allowance (15 s a door at 24 doors), with three workers and other lanes' jobs on the machine. The same two files alone on two workers: **238 s and 206 s, 22 tests each, pass**. The pair tests mount three boards for every other door, so each added door costs every door suite about 4 percent; `DOOR_PAIR_TEST_TIMEOUT_MS` is now 20 s a door (`tests/unit/helpers/doorWords.ts`, with the measured numbers in its comment). The same shape as the `valefor-door` timeout of the r76 wave-2 run.
  - **Not re-run in a second full suite** (73 minutes; the time box): the four files above and the targeted set of every shared test this lane edited (58 files, 1,586 tests, with the whole Yuna's Ballad set, the door table and the r76 boss-art pins) were re-run green on the final code.
- `node tools/critic-plan.mjs --paths <the shipped src files>` classes the change **DEEP** (the FFX-2 engine's script, the chapter registry and a new chapter are each a deep row): a focused review of the production candidate before a deploy, then live verification and the deep review on the live build. Not save-data class (`SaveData.ts` untouched).
- The suite's own bench is 100 seeds at bench speed and 40 at human speed (about 100 s); `PYREFLY_BENCH_SEEDS=200` takes about 225 s. The table in section 6 is the 200 / 100 run.
- Each test file's new assertions were run against the real engine first (probes), not written from the note: the numbers in section 4 are what the engine produced.

## 12. CHANGELOG lines (FFX-2 only unless tagged; for the integrator's release entry)

- **FFX-2 only (new hidden chapter 46, "Ifrit at Kilika Temple", not on the board):** the second Chapter 3 temple mission, "Pest Control": the possessed fire aeon in the Chamber of the Fayth, opened by typing `ifrit` on chapter select: the game's own row and script (a count that fills by seven with his actions and five with every blow, a Meteor Strike at the girl farthest back at 30, 60 and 90, Hellfire at 100, and the "battle too long" block), the Chapter 2 party with the Samurai dressphere, a Fire-free line for the move card and the auto-battler. Stand-in painting (Yuna's aeon set), a story draft, the aeon cue.
- **Both games (shared plumbing, nothing a player sees):** one more `SCENES` row, two held-item names, one kill-reward row, one door row.

## 13. Open questions (for Bailey, or for the RE session where it says so)

1. **The guest test of the "battle too long" block** (U1, section 3): worth one look in a live replay of a mission with a guest; it changes nothing in a normal fight.
2. **His motion frames** (0x10a5): reading them would let the hit-reaction window and the action span use his body's real frame counts.
3. **The possession look, the plate, the pause painting and the card** (section 7), the story's read (section 8), the music (IF7): Bailey's.
4. **The pace after a knock-out** (section 4, item 6): an engine observation for the FFX-2 engine's owner.
5. **Ice** as the guides' answer: the advisor line plays no Ice (the preset's Yuna is the healer); an Ice line is a different party and a different bench, unbuilt.
6. **Listing the chapter, the Pilgrimage placement and a link to Valefor's** wait for his word (IK10).
