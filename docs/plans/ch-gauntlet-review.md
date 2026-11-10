# Paper preflight (draft): hidden chapter 54 (provisional) — The Monster Arena creations, a gauntlet in the Calm Lands (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md` and the wave drafts (`ch-beast-review.md`). A number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-09 by a Sonnet sub-agent of the release driver (treeless lane, program row 54). Authority (relayed words, verbatim): Bailey 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; "you can spend as much meshy credits as you see fit. use your own judgment."; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick below is the planner's recommendation, "driver's call, his to overturn", with the alternative named.** Nothing deploys.

**Read:** `re-ffx-monster-arena-creations.md` (`research/re-ffx-monster-arena-creations.md`; "RE §n" below), the program plan (`PLAN.md` of the release driver, outside the repository; row 54, sections 5 to 9), `docs/handoff/ch-dark-aeons.md` and `src/data/ffx/builds/dark-aeons.ts` at `origin/main` bc93b1fdd (the chain this chapter reuses and the party it inherits), the Spherimorph and Omega Ruins file lists (the two mechanics it reuses). **Engine claims were read at `origin/main`; nothing was run, so rule 3 is owed by T0 and T10.**

**Verdict: PROCEED on data, AI and the small seams now, in three releasable tiers; HOLD everything Bailey will see or hear (the eight new paintings, the arena plate, the music) until the end-state picks of section 9 are made (hard rule 9); the winnability numbers wait for the bench.** This is the chapter whose cost is art and length, not research.

## 0. What changes against the plan (read first)

1. **All nine AIs are read in full** (R drops from 14 hours to about 3: the Greater Sphere's reply table and the live checks). Seven are a cycle or a coin flip; Neslug (a shell) and Earth Eater (a knock-down) are the two state machines; the Ultima Buster adds a head and two arms. [RE §3]
2. **Greater Sphere (`m281`, 1,500,000 HP) is missing from the plan's list** and is the sixth Original creation. Recommended: **nine acts**. It is Spherimorph's mechanic at a larger scale, so it costs little. Nemesis (row 43) and Shinryu (row 48) stay in their own chapters.
3. **The plan's "19 KB scripts" are the formations' camera work.** The AI scripts are 1.3 to 3.9 KB. The formations set no command bans and no start type (the arena field launches the battle).
4. **Th'uban shares only the Sanctuary Keeper's painting** (model word 0x1080 and the same model chunk), not its script. The Keeper chapter's mechanics do not carry over. [RE §0, §3.6]
5. **The arena's own rules are in two places:** the unlock tiers and prizes in the guides (Jegged and Gamer Guides agree), the **spawn price in the files** (`ArenaPrice`; Anacondaur 1,125 matches the guide exactly). The chapter does not gate acts by captures (pick GA7).
6. **The art is the real cost** (eight new creatures, one with parts): the plan's A of 16 hours is low; section 11 says 26.
7. **Yojimbo's Zanmato applies** (Slice is not blocked on any creation; Zanmato byte 3 on the area three, 4 on the Originals): the Dark Aeons bench measured it as the way its two long fights fall. The gauntlet needs the same pick (GA6).

## 1. Game case and sources

**Game case: FFX only.** The Monster Arena and its creations are FFX content; FFX-2 has the Fiend Arena (rows 53 and 59), a different system with different creatures. New logic lives in new files under `src/battle/ffx` and `src/data/ffx` (an absence test pins that no ffx2 file imports it); the chapter registration and the other shared tables (PLAN §7) are shared plumbing, case "both", inert for every other chapter, left to the wave's integrator commit.

| Source | What it gives | Tag |
|---|---|---|
| RE note: nine monster records, `m272`, `m273`, the command rows, eight arena formations | every number below | [bytes] (FFX_Data.vbf, Steam build 25501027) |
| RE §3 [run] | exact tallies of the nine scripts in the Atel interpreter | [run] |
| Jegged (Monster Arena, Rewards, Original > Ultima Buster / Earth Eater); Gamer Guides (Monster Arena, Unlocking the Monster Arena) | the unlock tiers, prizes, spawn rule; HP and drop lines agree with the files | [guide] |
| `src/data/ffx/builds/dark-aeons.ts`, `mirror-aeons.ts` | the endgame party (HP 9,999, every other stat 255, Luck 60, Evasion 255, Auto-Haste, Auto-Protect, Ribbon, Break Damage Limit) | [estimate], every cell flagged in the file itself |
| GameFAQs, the Final Fantasy wiki, StrategyWiki | not read (403 / 402 / not tried); no tie-break was needed | |

## 2. What the player experiences, in plain words (the game's own rules, RE §3)

**The set-up.** A hidden chapter in the Monster Arena of the Calm Lands. The party is the endgame party; the nine creations come one after another, a heal between acts (the Mirror Aeons and Dark Aeons chain). Ordered by HP, which is also the arena's own unlock order:

| Act | Creation | HP | What it asks of you |
|---:|---|---:|---|
| 1 | **Cactuar King** | 100,000 | Be fast: 83 percent of its turns are a lethal Needle, and it leaves after about 18 turns. Evasion 240; no element touches it |
| 2 | **Don Tonberry** | 480,000 | It walks in over four turns; hitting it on the way draws Karma (your kill count x 100); with an aeon out it casts Voodoo instead |
| 3 | **Jormungand** | 520,000 | Cold Stare petrifies, then it shatters the statue; with an aeon out it only attacks and stares |
| 4 | **Earth Eater** | 1,300,000 | Every hit on it standing draws a Megaton Punch (Death); 100,000 damage in one go knocks it down for two turns; hitting it down bounces a Flare onto you |
| 5 | **Greater Sphere** | 1,500,000 | Spherimorph's puzzle at a larger scale (one element hurts it, three heal it) |
| 6 | **Catastrophe** | 2,200,000 | At 80 percent it transforms: Toxic Spray, Demi (a quarter of your HP), Hundred Thorns, faster |
| 7 | **Th'uban** | 3,000,000 | Condemn strips your buffs after every hit; Convergence kills one member; Rainbow Confuses, Sleeps, Silences, Darkens |
| 8 | **Neslug** | 4,000,000 | Below half it hides in its shell: physical damage nullified, permanent Regen, Curaga; magic must break it |
| 9 | **Ultima Buster** | 5,000,000 (+ Head 80,000, two Arms 80,000) | Ultima on three-quarters of its turns; while an Arm lives, physical hits barely scratch the body |

**The win.** The last act's death; each act pays the file's drop (a certain item plus a rare Dark Matter), AP 8,000 or 50,000, no gil. [RE §1] The game's x99 prizes are the arena's, not the monsters' (pick GA8).

**The design fact `[derived]`.** The preset makes the ordinary moves small (Ultima 1,262 to 2,850 on each of three against a 9,999-HP member); the cost is **length** (5,000,000 HP at a 99,999 cap is at least 51 hits) and a handful of **lethal moves and counters**. Like the Dark Aeons, the bench will show a cliff, not a slope.

## 3. Engine work

Each row is mapped to the files on `origin/main`, marked **existing**, **partly** or **new**, and sized `[estimate]`: S under 1 agent-hour, M 1 to 3, L over 3. Host files at the 400-line cap (`encounters.ts`, `battle/ffx/setup.ts`, `chapter-meta.ts`) get net-zero edits or a one-line hook.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | The chain: nine acts, a heal between, the endgame party and bench | **Existing** (`ai/dark-aeons-six*.ts`, `builds/mirror-aeons.ts`, `builds/dark-aeons.ts`, `tools/dark-aeons-bench.mjs`) | new `data/ffx/gauntlet-ids.ts`, `enemies/gauntlet*.ts` | M |
| 2 | Records, moves and loot of the nine, the Head and the Arms (rows with formulas 4, 5, 6, 8, 22, 23) | **Existing** formulas (`research/re-ffx-damage.md` lists all 23); **check**: formulas 22 and 23 and the random-spread/finite-hit flags, and `ArenaPrice` as data | data | M |
| 3 | AI: the seven simple creatures (cycle or coin: Cactuar King, Don Tonberry, Jormungand, Catastrophe, Th'uban, Ultima Buster body, Head) | **New logic, existing hooks** (`ai/hooks.ts`, queue; the aeon-on-the-field test `countChrOverlap` exists as a rules helper) | `ai/gauntlet-*-rules.ts` (one file each, under 400 lines) | L (about 1 h each) |
| 4 | Neslug's shell: forced "Hides in shell" at 1/2, NullPhysical on, permanent Regen, Curaga until 3/4, break at 1/4 with AGI 120 | **New, small** (property writes; `NullPhysical` exists as a command-start gate if the Spherimorph/Omega work added it, else S) | rules | M |
| 5 | Earth Eater's knock-down: a running total of HP damage taken, a 100,000 line, Armored off while down, a two-turn lie, a **Flare cast at itself that its Reflect bounces** | **Partly**: the Reflect bounce exists (`kernel/target-builder.ts`, Evrae's Haste); a creature starting with Reflect is data | rules | M |
| 6 | Ultima Buster's parts: the Arms gate physical damage on the body (DEF 255 + Armored while an arm lives); the Head's three-turn cycle asks the body to act (Special 1) | **Partly**: parts exist (Sin's, Gui's, Penance's arms); the DEF-on-targeting write is new | rules | M |
| 7 | Greater Sphere: the four-state element machine | **Existing** (`ai/spherimorph*.ts`) reused with the larger replies (Firaga-class, Flare, Ultima, Hydraulic Press) | rules + a read of the reply table (R, 2 h) | M |
| 8 | Counters on every hit: Megaton Punch, Condemn, 10,000 Needles, Karma | **Existing** counter machinery (`kernel/counter-chain.ts`); **new**: Karma needs a per-member **kill counter** (formula 22) the kernel already takes as `saveCounter`; the preset has none (pick GA5) | data + rules | S to M |
| 9 | Cactuar King's **Run Away** (leaves the battle) | **New**: how a fight that the monster leaves ends (a loss, a draw, a retry) is a pick (GA9) | rules | S |
| 10 | Don Tonberry's four Waddle waypoints | **Partly** (a position move command exists for Gui/Kilika scripts; the waypoints are the formation's monster positions) | scene + rules | S |
| 11 | HUD | **None new** (no new command); the extra parts show as rows (Penance's three-actor rows exist) | | none |
| 12 | Presentation: the Calm Lands arena plate, nine creature sets, the Head and Arms as separate sprites, a Cactuar leaving | **New** | `scenes`, `engine` | L |
| 13 | Chapter plumbing: new `ChapterId`, `Chapter.number` 54 (the union ends at 44, 46, 49 today), meta, story, door word `gauntlet`, guide, tactic; absence tests | **New**, via side tables and new files | PLAN §7 | M |

**Order of dependence:** 2 first; 3, 4, 5, 6 independent; 7 after the harness read; 8 after 2; 12 blocked on the picks.

## 4. The party

- **The endgame party of row 34** (`darkAeonsBuild`): Tidus, Yuna, Auron on the field, Lulu, Wakka, Kimahri, Rikku on the bench, the nine aeons, Yojimbo and the Sisters as the Mirror preset has them; HP 9,999, MP 999, every other stat 255, Luck 60, Evasion 255, Auto-Haste, Auto-Phoenix, Auto-Protect, Ribbon, Break Damage Limit on every weapon, 17 Phoenix Downs, 1,500,000 gil. **Every cell an `[estimate]` the preset itself flags.** [source: `builds/dark-aeons.ts`]
- **Adjustments the creatures call for (each a flagged lever, none a boss change):** a **Piercing weapon on one attacker** (Earth Eater and Catastrophe are Armored; Auron's and Kimahri's weapons pierce), a **Death ward is already the Ribbon**, **Switch open** so Lulu can take the Ultima Buster's arm-proof magic. **A kill count per member for Karma** (`saveCounter`): the preset has none; a stated `[estimate]` (pick GA5).
- **Boss numbers are never tuned** (PRODUCT-BRIEF "mechanics never bend"). If the measured line is unwinnable or trivial, Bailey gets options with numbers (the party caps, Auto-Phoenix, the Phoenix Down stock, Yojimbo's purse, the kill count).

## 5. The arena

- **No Calm Lands arena plate exists** (the newest art mirror, the one of release 79: Gagazet, Macalania, Bevelle, Via Purifico, Mushroom Rock, Wendigo lake, Zanarkand dome, Dream's End, the Farplane...). The Monster Arena is one small ring, so **one plate** serves all nine acts.
- **Options (end state first, rule 9; a mockup at real resolution each, owed before building):** **(a)** one new `monster-arena` plate (a stone ring under an open sky, the Calm Lands' pale grass beyond, a spectators' wall), reused by every act, with a **per-creature light colour** to tell the acts apart (**recommended**); **(b)** the same plate with a different time of day per tier (three variants of one painting); **(c)** a stand-in: `zanarkand-dome` (a round arena; wrong place). **Recommendation (a), (b) as the follow-up if Bailey wants the tiers to feel different.**
- **Positions**, from the formations (RE §0): party (30.4, 0, -7.3) / (0.06, 0, -28.0) / (-26.1, 0, -11.5) in the Ultima Buster's; the creature at (4, 0, 74); the Head and Arms at the same entry; Don Tonberry's Waddle moves him along the formation's monster position entries (six are listed; the first two are 112 and 91 units from the party). The scene slots follow these.
- **Phone:** a 390 x 844 solve is part of the pick (the Ultima Buster is the widest set).

## 6. New art needed

Counts are images; poses follow the repo's boss sets: idle, attack, cast (where it casts), hurt, ko (or the state change).

| Asset | Images | Note |
|---|---:|---|
| **Cactuar King** (a giant Cactuar) | 4 | idle, Needles, hurt, leaves |
| **Don Tonberry** (a king Tonberry with a lantern and a knife) | 4 | idle, waddle, attack/Karma, hurt |
| **Jormungand** (a great serpent) | 4 | idle, Cold Stare, hurt, ko |
| **Earth Eater** | 5 | standing idle, punch, **down**, getting up, hurt |
| **Greater Sphere** | 4 | idle plus the four element glows (code), hurt, ko |
| **Catastrophe** (two forms) | 6 | form 1 idle/cast, form 2 idle/attack, transform, hurt |
| **Th'uban** | 5 | the **Sanctuary Keeper's painting recoloured** (`sanctuary-keeper` exists in the mirror); poses by the `baralai-shade` recolour method |
| **Neslug** (shell) | 5 | out, in the shell, broken shell, attack, hurt |
| **Ultima Buster** body, **Head**, **Arm** (x2 use) | 7 | body idle/Ultima/hurt/ko, Head idle/attack, Arm idle/dead |
| Backdrop `monster-arena` | 1 | (+ depth, 2x) |
| Effects (Needles, Ultima, Flare, petrify) | 3 | mostly code |
| Chapter card, thumbnail, pause plate | 3 | from the picks |
| **Total** | **about 51** | of which 5 are a recolour, not a painting |

- **Existing and reused:** `sanctuary-keeper` (Th'uban's base); `tidus`, `yuna`, `auron`, `lulu`, `wakka`, `kimahri`, `rikku` and the aeons (all in the mirror, as the Dark Aeons chapter uses them). **Nemesis (`nemesis`) and Shinryu (`shinryu`) already exist** but belong to rows 43 and 48. No Cactuar King, Tonberry, Jormungand, Earth Eater, Greater Sphere, Catastrophe, Neslug or Ultima Buster painting exists.
- Art route is the driver's (the Art Room per the standing art rules); nobody queues ComfyUI here (rule 12). The painting that ships must match the approved painted look (rule 9). **Bailey alone approves a painting.** Alternative: the Wendigo chapter's route (Meshy 3D bodies on a lit stage): the driver's call, not the plan's; it would also cut the per-pose cost, at the price of the rig work the Wendigo lane measured (about 100 MB to fetch).

## 7. Music (rule 13: only his ears judge)

The arena formations set no music (the field does; **unsourced**). Stand-ins (flagged): the boss cue `boss-seymour` (the Seymour Flux fight on Gagazet is the nearest "strong fiend" cue) with `battle-ffx` as the neutral alternative; the Dark Aeons chapter's choice if it made one; an entry on the audition page for Bailey. Alternative: one new take under the standing delegation (needs the driver's spend note; rule 11).

## 8. Winnability method (rule 15: nothing is tuned; the bench measures and the preset moves)

**Target (the chain's band):** the advisor's line wins each act **about 70 percent** (60 to 80 accepted), the Dark Aeons plan's wording, and the **chain** is reported (the Dark Aeons chain was 19 percent with the preset; this one will be a cliff too). **If nine acts cannot land in the band, split 3 + 3 + 3** (the three tiers of section 2 are already releasable cuts). **Levers, in order:** the party's stat caps (a cliff in the Dark Aeons), Auto-Phoenix and the Phoenix Down stock, the kill count (Karma), Yojimbo's purse and gauge, the front line and Switch, Piercing on one weapon. **Never** a creature's numbers.

**The sourced line the advisor carries (`engine/tactics/gauntlet.ts`, one named constant per rule):** Cactuar King: Haste, then burst it (two capped hits) before the third rest roll; Don Tonberry: attack only after it has arrived, or use an aeon to take Voodoo; Jormungand: keep an aeon out (it only attacks and stares), or Esuna/Stone; Earth Eater: one burst to 100,000, then **wait two turns**; Greater Sphere: the Spherimorph probe; Catastrophe: Shell for Demi; Th'uban: re-buff after Condemn, Shell before Convergence; Neslug: magic through the shell; Ultima Buster: kill both Arms first (80,000 each) if the line is physical, Shell for Ultima.

**Predictions from the arithmetic (to be falsified by the bench, not promises):** (1) the six simple acts are won by a careless line (a capped Attack empties Jormungand in 6 hits, Don Tonberry in 5); (2) the Ultima Buster body is 51 capped hits and 51 turns of Ultima at about 75 percent: a long act, survivable with Shell and Auto-Protect; (3) Th'uban's Convergence kills a member every fourth turn, which Auto-Phoenix and the stock must absorb; (4) the Cactuar King's Needles kill a member most turns until it falls, so the act is decided in the first dozen of its turns; (5) Yojimbo's Zanmato ends any act at once when it lands (Slice is not blocked), so the bench runs **with and without** him.

**Tests (T0 first, T10 last):** T0 the engine checks (formulas 4, 22, 23; the Reflect bounce of a self-cast Flare; the parts' gate); T1 the data fixture generated from the files (as the Dark Aeons did: `tests/fixtures/parity/ffx/gauntlet_rows.json`); **T2 the AI rules with the interpreter's exact tallies as pins**: the Ultima Buster's coin and forced turns, the Head's Attack/pass/Contamination cycle, Catastrophe's rest/Toxic Cloud and 80 percent transform, Earth Eater's 50/50 turn and 100,000 line and two-turn lie, Th'uban's cycle and the Condemn/Haste replies, Jormungand's 21,846/21,845/21,845 and 75/25, the Cactuar King's 32,769/21,844/10,923, Don Tonberry's four Waddles and Karma window, Neslug's three states; T3 the bench (12 then 500 seeds, copied from `tools/dark-aeons-bench.mjs`, ablation for any mover, chain mode); T4 the HUD (none new); T10 the integration. Rule 14: FFX only; the absence test names `ffx2-atb-golden` and `ff7-golden` unchanged.

## 9. Picks (driver's calls, his to overturn); each perceivable one owes 2 to 4 end-state options before building (rule 9)

| # | Pick | Recommended | Alternative |
|---|---|---|---|
| GA1 | Number and word | **54, door word `gauntlet`** (PLAN §8; re-checked 2026-11-09 against the 29 merged words, the 15 pending plan words and `pilgrim`: 0 failures, `door-recheck.mjs`) | `catastrophe` (fails: two clashes) |
| GA2 | Which creations | **nine acts**: the plan's eight **plus Greater Sphere** | the plan's eight; or all fourteen Originals+area (not recommended) |
| GA3 | Shape | **one chapter, three tiers** (area three / Earth Eater, Greater Sphere, Catastrophe / Th'uban, Neslug, Ultima Buster), a heal between acts, each tier a releasable cut | two chapters (needs a number) |
| GA4 | Party | **row 34's endgame party** with Switch open, one Piercing weapon | a fixed front line |
| GA5 | Karma's kill count | each member **500 kills** (`[estimate]`, flagged; lethal at any value above 100) | 0 (Karma = 0: the creature loses its teeth, not faithful) |
| GA6 | Yojimbo's Zanmato | **allowed, as in the Mirror/Dark Aeons preset**; the bench reports with and without | barred in this chapter (not faithful) |
| GA7 | The arena's captures and tiers | **no gating**; the three tiers are the order of the acts; the card names the unlock rule in one line | a board where each bout unlocks by the game's own counts (a new setting; +6 h) |
| GA8 | Prizes | **the file's drops only** (a certain item + Dark Matter, AP, no gil); the card names the x99 prize as "not in this build" | pay the guides' x99 items (the game's own prize; inventory has no use after the chapter) |
| GA9 | The Cactuar King leaving | **a retry**: the act ends as "it got away", the chain can be retried at that act | a loss of the chain |
| GA10 | The looks | **eight new paintings, Th'uban the Keeper's recolour** | Meshy 3D (the Wendigo route; the driver's call) |
| GA11 | Arena | **(a) one plate, a light colour per creature** | (b) three time-of-day variants; (c) the stand-in |
| GA12 | Music | stand-ins of section 7 | a new take |
| GA13 | Start and flee | the formations set neither: **Normal start, Escape and Flee off** (unsourced: the field's flag) | flee allowed |

## 10. Review class, tracks, hosting

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/common/types.ts,src/battle/ffx/**,src/data/ffx/**,src/scenes/**` was **not run** (treeless lane); by the Keeper preflight's reading the chapter registry, the shared combat core and the FFX engine each class a change **DEEP**: expect **review DEEP, focused before deploy, live verification and the deep review after, obligations live + focused + deep**; not save-data class. The driver re-runs the command from the host. **Ship each tier as its own release if the bench shows the chain cannot land, otherwise one release.**

**Tracks (small vertical slices):** T0 engine checks (rows 2, 5, 6, 8); T1 data + loot (generated from the files); T2 AI and rules, one creature per slice, tier 1 first; T3 build + bench; T4 scene and plate (blocked on GA11); T5 art (blocked on GA10, serialised, tier by tier); T6 guide/story/card; T7 the integrator (shared tables, tests, the door-word re-check with `door-check.mjs`). **Host (PLAN §6):** a clean merged-and-live tree with `node_modules` and a `public/art` junction repointed to the newest mirror (the one of release 79 at this writing); the driver's choice, as the table in PLAN §6 is two releases old.

## 11. Size (Sonnet agent-hours, counted the way `ch-keeper-review.md` counts)

| | Plan | This preflight | Why |
|---|---:|---:|---|
| R research | 14 | **3** | all nine AIs read; the Greater Sphere reply table (2 h), the live checks (1 h) |
| B build | 24 | **26** | nine data sets (M), nine rules files (L), the shell, knock-down and parts seams (M each), Karma and Run Away (S each), the chain reuse (S), build and bench (M), story/guide/cards (M) |
| A art | 16 | **26** | eight new creatures (about 5 images each, 0.6 h an image), the plate (2), Th'uban's recolour (2), cards (2) |
| I integration and tests | 10 | **12** | the 12 to 15 shared tables (PLAN §7) plus nine creature test files |
| **Total** | **64** | **67** | |

## 12. Top risks

| Risk | Answer |
|---|---|
| The art volume (51 images) stalls the chapter | ship tier 1 (three creatures, about 13 images) first; Th'uban is a recolour; the Greater Sphere is code-driven glows |
| The bench shows a cliff (careless wins six acts, the long ones are won only by Zanmato) | the Dark Aeons precedent: report with numbers, pick the lever with Bailey, never touch a creature |
| Karma (formula 22) is not in the damage kernel | `saveCounter` already is an input; T0 proves it; fallback a per-member counter in the build |
| The Ultima Buster's arms gate misbehaves for magic and special commands | the script writes DEF/Armored only on a physical HP-affecting command; T2 pins the three cases |
| The Cactuar King leaving ends the chain | pick GA9; the retry is a one-line flow |
| A host file at the 400-line cap | net-zero edits and side tables; shared edits left to the integrator |

## 13. Open questions, and the live checks that settle them (about an hour)

1. Can a creation fight be fled (the field's flag)? 2. The Greater Sphere's reply table (harness run, 2 h). 3. How a Cactuar King that runs away ends the fight. 4. Kill counts at a typical endgame (Karma). 5. The music. 6. Whether the Ultima Buster's Head can be left alone (it must not need to be killed: `MustBeKilledForBattleEnd` is 0 for the Head and Arms).

## Changes to PLAN.md (for the driver)

Row 54: add **Greater Sphere m281 (1,500,000 HP)**; replace "19 KB each" with "AI scripts 1.3 to 3.9 KB; formations are 19 KB of camera"; note "Th'uban shares only the painting with the Keeper"; "Yojimbo's Zanmato applies (Slice not blocked)"; the three tiers; size R14 B24 A16 I10 = 64 -> **R3 B26 A26 I12 = 67** (art is the cost); arena: "no plate; one new `monster-arena` plate". The word `gauntlet` is confirmed against `origin/main`.
