# Paper preflight: hidden chapter 39 (provisional) — The Sanctuary Keeper, Mt. Gagazet summit (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md` and `docs/plans/ch-maesters-review.md`: a number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-06 by a Sonnet sub-agent of the release driver (wave 2, FFX lane, program row 39). Authority (relayed words, verbatim, from the program plan): Bailey 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick below is the planner's recommendation, "driver's call, his to overturn", with the alternative named.** Nothing deploys.

**Read:** `research/re-ffx-sanctuary-keeper.md` (the sister note in this folder; "RE §n" below), the program plan (kept outside the repo) (row 39, sections 6 to 9), `docs/plans/ch-keeper-review.md` (format and the Spectral Keeper it must not be confused with), `docs/plans/ch-dark-aeons-review.md` §7 (today's winnability method), `src/data/ffx/builds/gagazet.ts` and `gagazet-kit.ts` at `origin/main` (the build point). **Engine claims were read at `origin/main`; nothing was run, so rule 3 is owed by T0 and T10.**

**Verdict: PROCEED on data, AI and the small seams now; HOLD everything Bailey will see or hear (the Keeper's painting, the plate choice, the music) until the end-state picks of section 9 are made (hard rule 9); the winnability numbers wait for the bench.**

## 0. What changes against the plan (read first)

1. **The AI is read in full: 2,407 bytes of code** (the plan's "174 KB script" is the file size, almost all of it model data). R is finished; what remains is half an hour of live checks (section 13).
2. **It is a strategy fight, and the numbers say plain attacks cannot win it**: 40,000 HP, DEF and MDEF 100, and it heals about 9,999 twice per six-turn cycle (144 CTB) when nothing interferes. The sourced answer is the guides' (Reflect on the Keeper, Poison, Hastega, Shell and Protect, Armor Break); the Gagazet preset already carries every piece of it. [RE §6]
3. **The "areas" are presentation:** the four areas the script writes at three quarters, one half and one quarter of its HP hold identical start positions. One plate serves the whole fight. [RE §2]
4. **Switch and Summon are not disabled**, only Escape and Flee: so a front line of three over a bench of four is legal (the repo's Zanarkand-type build), and an aeon can take the first Photon Wings, as the guides advise.
5. **Not the Spectral Keeper.** `m128` (Gagazet summit, 40,000 HP) is a different monster, record and script from `m129` (Zanarkand Dome, 52,000 HP, platforms and mines; Chapter XXIX / `ch-keeper`). The card must not read like a duplicate of that chapter.
6. **The size drops** (29 to 25 hours, section 11), because the research is done and every spell the Keeper casts is a player row the engine has.

## 1. Game case and sources

**Game case: FFX only.** The fight is the last obstacle on the mountain, before the Zanarkand ruins. CTB, aeons, the FFX status set. FFX-2's Bevelle Underground guardians are separate fights in the ATB engine and nothing here applies to them. New logic lives in new files under `src/battle/ffx`, `src/data/ffx` (an absence test pins that no ffx2 file imports it, as for the Keeper); the chapter registration and the other shared tables (PLAN §7) are shared plumbing, case "both", inert for every other chapter, left to the wave-2 integrator commit.

| Source | What it gives | Tag |
|---|---|---|
| RE note: `m128`, `mtgz08_00`, `mtgz0800`, the command rows | the record, the formation, the whole AI, the launch flags, every number below | [R] (FFX_Data.vbf, Steam build 25501027) |
| RE §4 `[run]` | exact tallies of the script in the Atel interpreter: the cycle, the overrides, the sweep fuse | [run] |
| Jegged "Mt. Gagazet Cave"; Gamer Guides; Samurai Gamers | the guides' account: agrees with the files except where RE §7 says | [guide] |
| `src/data/ffx/builds/gagazet.ts`, `gagazet-kit.ts` | the repo's stat cells and bag at this point | [estimate], build point sourced |
| GameFAQs, StrategyWiki | not read (HTTP 403); the tie-break was never needed | [RE header] |

## 2. What the player experiences, in plain words (the game's own rules, RE §4)

**The set-up.** The fight starts as the party leaves the cave. The Keeper (40,000 HP) stands to one side; you pick any three of the seven. **Escape and Flee are off for everyone; Switch and Summon are not.** It is Normal start.

**Its turns, a fixed cycle of six** (each every 24 CTB, as often as Tidus):
1. **Photon Wings** on all three: about 1,000 damage each, **Curse** (no Overdrives) for sure, and rolls for Confuse 25, Sleep 50, Silence 50, Darkness 50 (three turns each). It is always the first thing the Keeper does.
2. **Attack** on the character with the most HP (about 1,300 to 1,550).
3. **Attack** on a random living character.
4. **Mana Breath** on a random living character: a magic breath of **2,500 to 3,600** against the cells, which kills anyone unshelled but a healthy Auron.
5. and 6. **A support turn** each: by default **Curaga on itself** (9,999). With **Regen** missing and HP below a quarter it casts Regen; with **Poison or Darkness** on it, **Esuna**; with **Armor Break** on it and no Protect, **Protect**; and **with Reflect on it, below half HP, it casts its spell at a party member who holds Reflect** (so the spell bounces onto itself) **or casts Reflect on your weakest member to prepare that.** The later in that list, the higher the priority.

**Its reactions.** **After any action of yours that changes its HP** (a hit, a spell, an item, a healing spell too) a hidden count goes up; after **3 to 7** of them (3rd 20 percent, 4th 32, 5th 29, 6th 15, 7th 4; mean 4.5) it answers with **Tail Sweep** on all three: about 1,000 each, **your Haste is stripped and each character's next turn is pushed back** (24 to 39 CTB). Casting Bio, Reflect, Protect, Slow or anything that does not change HP does not count. **If you Slow it** (and a hit lands) it casts **Haste** on itself, or on a party member who holds Reflect. At **three quarters, one half and one quarter** of its HP the script changes the "area" (the camera or stage; nothing moves). It cannot be Slept, Silenced, Petrified, Zombied, Doomed, Provoked or Confused, is immune to Delay and Gravity, and **a Poison lands (2,000 a tick)**.

**The win.** HP 0; the body stays. 6,500 gil, 11,000 AP (16,500 on overkill), Return Sphere, a steal of Turbo Ether, always one piece of gear. [RE §1.3]

**The design fact `[derived]`.** The fight is about **denying the heal and surviving the breath**: Reflect (its Curaga heals you), Poison (it wastes a support turn on Esuna), Shell (the breath), Hastega (the sweeps strip it), Armor Break (the Protect answer costs it a support turn too). Plain hits cannot outpace 20,000 healed per cycle.

## 3. Engine work

Each row is mapped to the files on `origin/main`, marked **existing**, **partly** or **new**, and sized `[estimate]`: S under 1 agent-hour, M 1 to 3, L over 3. Host files at the 400-line cap (`encounters.ts`, `battle/ffx/setup.ts`, `chapter-meta.ts`) get net-zero edits or a one-line hook.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | Record, rows (Photon Wings f9 + Curse + four rolls, Mana Breath f3 power 48 cap 99,999, Tail Sweep with Delay Buster and Haste removal, Attack), loot | **Existing** formulas and statuses (`curse` in `types.ts`; Delay Buster in the damage kernel); new data | new `data/ffx/enemies/sanctuary-keeper.ts` + `loot/records.ts` entry | S |
| 2 | The Keeper casts the **player-side rows** Curaga, Esuna, Protect, Reflect, Regen, Haste | **Existing** (a monster using player rows: Evrae's Haste, Seymour Natus's spells) | `data/ffx/enemies/…-abilities.ts` | S |
| 3 | The six-state cycle with the override priority (Regen < Esuna < Protect < the Reflect branch) | **New logic, existing hooks** (`ai/hooks.ts` onTurn, queue with a target list) | new `ai/sanctuary-keeper.ts` + `-rules.ts` | M |
| 4 | **MAG written to 180 before a support cast and 40 for the breath and the Attack** | **New**: a per-cast stat override on the caster (a hook that writes the stat for the next action and restores it); the alternative, a fixed 9,999 heal, would differ from the game by up to 2.5 percent (the heal is 9,750 to 9,999 after the cap) | `ai/hooks.ts` (+ a small option), `kernel/damage.ts` untouched | S to M |
| 5 | **Reflect bounce of a spell aimed at a Reflect holder or at the Keeper itself** | **Existing**: the target builder flips a spell on a Reflect-bearing target to a random member of the opposite side (`kernel/target-builder.ts`; `ai/evrae-rules.ts` `KEEP_REFLECTED_SELF_HASTE`) | none | none |
| 6 | **The sweep fuse**: count the Keeper's received actions that change HP (not its own, not no-HP ones), fire when the count exceeds a draw modulo 5 plus 2, reset | **Partly**: hit counters exist (`ai/dark-aeons-rules.ts`, `ai/spectral-keeper-rules.ts`); `HitReport.affectsHp` exists (`ai/hooks.ts`); the random threshold and the self-exclusion are new | `ai/sanctuary-keeper-rules.ts` | S |
| 7 | The Slow answer (Haste on itself or on a Reflect holder) | **Existing pattern** (Evrae's Haste counter, `ai/evrae-counters.ts`) | rules file | S |
| 8 | Phase lines (3/4, 1/2, 1/4 of max HP) write a phase used by Regen and the Reflect branch, and an "area" cue | **New, small**: the phase is a rules variable; the area cue is a presentation event (camera) | rules file, `scenes` | S |
| 9 | Formation: Escape and Flee off for all seven, Normal start, three party entries | **Existing** (`formation-commands.ts`, `commandDisables`) | formation data | S |
| 10 | Immunities: CTB damage (Delay), percentage damage, Life; Poison 90 and Break bytes that land; Threaten 100 | **Existing** (flag bytes, status bytes in the record decoder) | data | S |
| 11 | HUD | **None new** (no new command); the standard status icons and the message bar name the spells | | none |
| 12 | Presentation: a summit plate, the Keeper's poses, the breath, the wings, the sweep, three area cues | **New** | `scenes`, `engine` | M |
| 13 | Chapter plumbing: new `ChapterId`, `Chapter.number` 39, meta, story, door word `beast`, guide, tactic; absence tests | **New**, via side tables and new files | PLAN §7 | M |

**Order of dependence:** 4 and 6 are the only seams; they are small and independent; 3 after 2 and 4.

## 4. The party

- **In the game the player picks any three of seven; the repo's convention is a fixed front line over a bench** (Zanarkand's `activeSlots` with four on the bench). Switch is legal, so a bench is real.
- **Build point:** the repo's Gagazet preset (`gagazet.ts`, S.Lv Tidus 30, Yuna 32, Auron 35, Wakka 30, Lulu 30, Rikku 42, Kimahri 25; the §7.3 "28 to 40 band"), `[estimate]`: Tidus HP 2,420 DEF 20 MDEF 18 AGI 30, Yuna 1,500 / 13 / 39 / 15, Auron 3,410 / 28 / 14 / 15, Lulu 1,375 / 15 / 45 / 13, Wakka 2,530 / 20 / 16 / 17, Rikku 1,540 / 15 / 15 / 32, Kimahri 2,310. **The preset already carries the sourced tactics:** Yuna learned Esuna, Shell, Protect, Reflect and Dispel; Tidus Haste, Hastega, Slow and Delay; Auron the four Breaks; Lulu Bio and Focus; the bag holds Poison Fang x5, Holy Water x7, Remedy x3, Phoenix Downs and Elixirs. **Not in the cells' armour:** Confuse Ward (Jegged's advice; Photon Wings' Confuse is the status it calls most dangerous): a lever for the bench, named and `[estimate]`.
- **Recommended front line: Tidus, Yuna, Lulu** (the three the sources need first: Hastega, Reflect/Protect/Shell, Bio), **bench Auron, Wakka, Kimahri, Rikku** (Auron's breaks one Switch away). Alternative: Tidus, Yuna, Auron (the Zanarkand chapter's trio; Armor Break and Mental Break in the front line, Bio from Rikku's Poison Fang). **The bench runs both and reports** (changing `activeSlots` is one line).
- **Gaps, none of which this lane fills (rule 6):** the Overdrive gauges and the aeon gauges on arrival, the exact bag, the armour abilities. All `[estimate]`, never tuned toward a result.
- **Boss numbers are never tuned** (PRODUCT-BRIEF "mechanics never bend"). If the measured line is unwinnable or trivial, Bailey gets options with numbers (the party's Luck and Evasion cells, the bag, Confuse Ward, the front line).

## 5. The arena

- **The Gagazet scene exists** (`src/scenes/gagazet.ts`, key `gagazet`, plus `-giants`, `-ronso`, `-debug`; plate `public/art/backdrops/gagazet.png` with its depth map): the mountain trail where Chapter I's Seymour Flux fight is staged. **The summit region is a different place** (the Jegged heading is "Gagazet - Summit Region", and the game's first sight of the ruins is just past it) and has no plate. The formation puts the party in a line along z (1,097, 1,136, 1,180), the aeons at one point, the Keeper about 100 units toward -x, and **the four areas share every coordinate** (RE §2).
- **Options (end state first, rule 9; a mockup at real resolution each, owed before building):** **(a)** the Gagazet plate as is, with the same rigs (0 new plates; risk: it reads as Chapter I's mountain, not the summit); **(b)** a summit variant *derived from the existing plate* (colder sky, flatter ridge, the ruins' glow on the horizon; 1 derived plate; the approved plate stays untouched); **(c)** a new summit plate with its own rigs. **Recommendation (a) for the first build with (b) mocked up beside it; (b) if the frame shows it fights the story position.** (c) is the expensive fallback.
- **No phone rigs exist for `gagazet`;** a 390 x 844 solve is part of the pick (the party is a line; the Keeper small on a phone).
- **Area cues:** three camera cues at the HP lines (a slow push or a pan), no plate swap, since nothing moves (SK6).

## 6. New art needed

Counts are images. Poses follow the repo's boss sets: idle, attack, cast and hurt; ko where the body stays.

| Asset | Images | Note |
|---|---:|---|
| **The Sanctuary Keeper** (a winged beast with a long tail, per the Photon Wings and Tail Sweep rows) | 5 to 6 | idle, attack, cast (Mana Breath, the support spells), a wings pose for Photon Wings, hurt, ko ("Boss": the body stays) |
| Backdrop | 0 or 1 | (a) as is, (b) one derived variant |
| Effects (wings burst, tail sweep, breath) | 2 | may be drawn in code |
| Chapter card, thumbnail, pause plate | 3 | from the picks |
| **Total** | **about 9 to 12** | |

- **Repaint of the existing `spectral-keeper` set** is an option (SK5) but nothing says the two monsters share a silhouette (different records: model words 0x1080 and the Dome Keeper's); recolouring a different beast is a flagged compromise, not a saving to count on. Th'uban (`m282`, row 54) is the wiki's colour swap of this monster and will reuse this painting, so the Keeper is painted once for two chapters.
- Ronso paintings are for Garik (row 47), not this.
- Art route is the driver's (the Art Room per the standing art rules); nobody queues ComfyUI here (rule 12). Retail references are allowed (hard rule 8) but the painting that ships must match the approved painted look (rule 9). **Bailey alone approves a painting.**

## 7. Music (rule 13: only his ears judge)

The game plays the Boss Theme (BGM 12) at the launch. Stand-ins (flagged, the driver's pick): scene bed `scene-gagazet` (Chapter I's mountain cue, exists), battle cue **`boss-seymour`** (the Seymour Flux fight happens on the same mountain; flagged as a stand-in) with **`battle-ffx`** as the neutral alternative; an entry on the audition page for Bailey. Alternative: one new take under the standing delegation (needs the driver's spend note; rule 11).

## 8. Winnability method (rule 15: nothing is tuned; the bench measures and the preset moves)

**Target (the chain's band):** the advisor's line wins **about 70 percent** (60 to 80 accepted), the Dark Aeons plan's wording. **Levers, in order:** Confuse Ward on the front line; the party's Luck and Evasion cells inside the sourced range; the Poison Fang/Holy Water/Remedy stock; the aeon and Overdrive gauges on arrival; the front line (SK2). **Never** the Keeper's numbers.

**The sourced line the advisor carries (`engine/tactics/sanctuary-keeper.ts`, one named constant per rule):** Hastega first; an aeon or Shell/Protect before the second turn (Photon Wings is guaranteed first, and Mana Breath is the fourth turn); **Yuna's Reflect on the Keeper early** (its Curaga becomes a party heal while its HP is above half); **Bio** (and Poison Fang) kept up; Armor and Mental Break; Dispel/Holy Water for Curse and Remedy for the rest; Slow only with Reflect up; expect the Reflect trick below half HP and Regen below a quarter (**Dispel on the Keeper**).

**Predictions from the arithmetic (to be falsified by the bench, not promises):** (1) a plain-attack line loses outright (about 100 Tidus hits against 20,000 healed per cycle); (2) Mana Breath is the death clock: an unshelled front-line member dies every cycle, so the line needs Shell or an aeon shield; (3) Photon Wings' status rolls (Confuse 25, Sleep 50, Silence 50, Darkness 50 on each of three) mean Remedy/Holy Water turns every cycle without Ward armour; (4) a Reflected Curaga is a free heal of up to 9,999 for the party, which can swing the whole fight; (5) the sweep's mean of 4.5 counted hits means Hastega must be re-cast about once a cycle.

**Tests (T0 first, T10 last):** T0 the engine checks (rows 4 and 6, and formula 9 and Curse end to end); T1 the data fixture; **T2 the AI rules with the interpreter's exact tallies as pins: the cycle order (Photon Wings, Attack highest HP, Attack, Mana Breath, support, support), the override priority (nine cases of RE §4.2), the sweep distribution 20.00 / 32.00 / 28.80 / 15.36 / 3.84 and mean 4.51, the phase lines 30,000 / 20,000 / 10,000, the Slow answer, the self-attack exclusion**; T3 the bench (12 then 500 seeds, copied from `tools/mirror-aeons-bench.mjs`, ablation for any mover); T4 the HUD (none new); T10 the integration. Rule 14: FFX only; the absence test names `ffx2-atb-golden` and `ff7-golden` unchanged.

## 9. Picks (driver's calls, his to overturn); each perceivable one owes 2 to 4 end-state options before building (rule 9)

| # | Pick | Recommended | Alternative |
|---|---|---|---|
| SK1 | Number and word | **39, door word `beast`** (PLAN §8; checked against the 15 words and `pilgrim`) | none |
| SK2 | Front line | **Tidus, Yuna, Lulu**, bench Auron, Wakka, Kimahri, Rikku | Tidus, Yuna, Auron |
| SK3 | Build | the Gagazet preset as is (it carries Reflect, Esuna, Dispel, Bio, Hastega, the Breaks, Poison Fang, Holy Water, Remedy), Confuse Ward as a bench lever | a later-point build (Zanarkand cells; too strong) |
| SK4 | Arena | **(a) the Gagazet plate as is**, mock (b) a summit variant beside it | (c) a new plate |
| SK5 | The Keeper's look | **New painting**, 5 to 6 poses; Th'uban reuses it later | a repaint of `spectral-keeper` (flagged, unverified fit) |
| SK6 | The three "area" changes | camera cues only, no plate swap | a plate swap (nothing moves in the game: not faithful) |
| SK7 | The sweep fuse | **hidden, as in the game**; the guide teaches the mean | an on-screen tell (not faithful) |
| SK8 | Aeons | allowed (Summon is not disabled); the advisor's line uses one to take Photon Wings | barred (not faithful) |
| SK9 | Music | stand-ins of section 7 | a new take |
| SK10 | Start | Normal (the formation writes it) | none |

## 10. Review class, tracks, hosting

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/common/types.ts,src/battle/ffx/**,src/data/ffx/**,src/scenes/**` was **not run** (treeless lane); by the Keeper preflight's reading (§10 there) the same rows apply: the chapter registry, the shared combat core and the FFX engine each class a change **DEEP**, so expect **review DEEP, focused before deploy, live verification and the deep review after, obligations live + focused + deep**; not save-data class. The driver re-runs the command from the host. **Ship the wave-2 chapters in one release** so they share one deep review.

**Tracks (small vertical slices):** T0 engine checks (rows 4 and 6); T1 data + loot; T2 the AI and rules; T3 the build + bench; T4 scene and plate (blocked on SK4); T5 art (blocked on SK5, serialised); T6 guide/story/card; T7 the integrator (shared tables, tests, the door-word re-check with `door-check.mjs`). **Host (PLAN §6):** a clean, merged, live worktree (art mirror old: repoint `public/art` to the newest mirror first), branched from `origin/r75-boss-art` until r75 merges.

## 11. Size (Sonnet agent-hours, counted the way `ch-keeper-review.md` counts)

| | Plan | This preflight | Why |
|---|---:|---:|---|
| R research | 6 | **1** | the AI is read; half an hour of live checks |
| B build | 10 | **11** | the cycle and overrides (M), the MAG override (S to M), the fuse (S), data and loot (S), plumbing (M) |
| A art | 6 | **6** | the Keeper (3), the plate decision (1 to 2), cards and effects (1) |
| I integration and tests | 7 | **7** | the 12 to 15 shared tables (PLAN §7) |
| **Total** | **29** | **25** | |

## 12. Top risks

| Risk | Answer |
|---|---|
| The fight is unwinnable for an uninformed line | by design (the sources' line is the answer); the card and the guide state the line; the bench reports the plain line's win rate honestly |
| Mana Breath kills a member outright | by design; Shell is in the preset's kit; the bench measures with and without |
| The Reflect trick is subtle and an AI port gets the aim wrong | the nine override cases are pinned by tallies (T2) |
| The MAG override seam is wrong (heal off by up to 2.5 percent) | T0 pins 9,750 to 9,999 at MAG 180 |
| The card reads like the Spectral Keeper chapter | name and plate keep them apart (SK4, SK5) |
| A host file at the 400-line cap | net-zero edits and side tables; shared edits left to the integrator |

## 13. Open questions, and the live checks that settle them (about half an hour)

1. **What the "area" index selects** (camera, stage or map layer): read the area-to-camera table in `mtgz08_00` if the area cue is to match the game's; irrelevant to the mechanics.
2. **Whether a Reflect bounce of Curaga lands on a random party member or on the caster's opposite side as a group** (the target builder's rule, stream 6): settle with the existing `kernel/target-builder.ts` test for the Evrae Haste case.
3. **The launch arguments 316 and 20 and the flag bits** (none affects the AI).
4. **Whether Th'uban's script is this script with other numbers** (row 54's question, not this chapter's).

## Corrections and findings (what the mapping turned up)

- The plan said "heals, reflects, counters with a delaying tail": all three are exact (Curaga, the Reflect trick, Tail Sweep with Delay Buster), and the **fuse that decides the counter is 3 to 7 HP-class actions with a draw each**, which neither the plan nor the guides gave.
- The plan's "Tail-Sweep delay uses CTB-delay hooks that exist": confirmed; and the delay is `tick speed x 3` per target, the same Delay Buster rule as Dark Ixion's Thundaja in the Dark Aeons note.
- The guides disagree with the file on one thing only: Jegged's Photon Wings status list omits Curse; the file, Gamer Guides and Samurai Gamers include it (RE §7).
