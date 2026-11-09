# Paper preflight: hidden chapter 44 (provisional) — Jenova LIFE at the Forgotten Capital (FF7)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-beast-review.md`, `docs/plans/ch-keeper-review.md` and the other wave-3 drafts: a number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no browser, no engine run** (the one script is standalone arithmetic). Written 2026-11-06 by a Sonnet sub-agent of the release driver (wave 3, FF7 lane, program row 44). Authority (relayed words, verbatim, from the program plan): Bailey 2026-11-06 ~00:30 EST "implement all unimplemented chapters please"; ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick below is the planner's recommendation, "driver's call, his to overturn", with the alternative named.** Nothing deploys.

**Read:** `research/ff7-jenova-life.md` (the sister note; "RE §n" below), the program plan (row 44, §6 to §9), `docs/plans/next-content-2026-09-27.md` §2, `research/ff7-battle-core.md` ("core"), `research/ff7-guard-scorpion.md`, `docs/handoff/ff7-engine.md`, `ff7-guard-scorpion.md`, `ff7-hud.md`, `docs/plans/ff7-engine-bench.md`, and at `origin/main` (4310f6b63, 2026-11-06) `src/battle/ff7/*`, `src/battle/common/types-ff7.ts`, `src/data/ff7/*`, `src/ui/ff7/*`, `src/scenes/sector1-reactor-staging.ts`, `src/app/screens/BattleScreenFf7*.ts`, `src/story/dsl.ts`, `src/app/screens/frontend/chapterDoors.ts`, and `tests/unit/chapter-doors.test.ts`, `chapter-numbers.test.ts`. Lifestream Encore (LE, a separate repo on this PC) `docs/research/*.md` for the party and the scene. **Engine claims were read, not run; rule 3 is owed by T0 and T7.**

**Verdict: PROCEED on data, the AI, and the engine seams now; HOLD everything Bailey will see or hear (Jenova's painting, the altar frame, the three-row HUD tells, the scene format, the music) until the end-state picks of §9 are made (hard rule 9); the winnability numbers wait for the bench.** No end state for this chapter exists in `docs/target/targets.json` or `decisions.json` (searched): the 09-27 plan only proposed it.

> **Outcome, 2026-11-07 (lane `ch-jenova-life`; `docs/handoff/ch-jenova-life.md` is the record).** Built: the status layer (Reflect, Barrier, MBarrier, Regen), the Reflect bounce, Materia levels from AP, Limit Levels 2 and 3 with hit chains, the AI seams, Tifa as a third member and the chapter
> itself (word `bluelight`, number 44, an experiment), a stand-in stage, a guide card and page, the bench and its pins. **Differences from this preflight:** the All link is not built (the FF7 menu has no one-or-all toggle), row 10's reactions stay out as planned, J9 (no results on a win) waits for J10's post scene,
> J7 and J10 are as recommended, the HUD already drew three rows so row 11 was a model change only, and the measured pools are lower than the paper note's because the Materia set is the leaner one (J4). The bands of section 8 were met: sensible 99.5 percent, distracted 86 percent.

## 0. What changes against the plan (read first)

1. **The research is done except Fergusson's *Battle Mechanics*.** Every number of the fight is known and sourced three ways (RE §3 to §5). The unread guide is the one thing GameFAQs, a dead mirror and a 402 wiki kept out (RE §0); six exact questions are in RE §11, none of which blocks a build because each has a labelled estimate (§8).
2. **Four corrections to the earlier research**, not two (RE §8): Blue Light costs **8 MP** (plan); the Wizard Bracelet is a **certain** drop (class 63); Aqualung is **not a two-cast kill** (three casts at full health); and LE's party Materia are **mislabelled** (Lv 3 is the x3 spell). The plan's second named correction (Safer's beat-3 physical) belongs to row 56.
3. **The engine gap list shrinks and moves.** Element absorb and weak **already exist** on the enemy side (`formulas.ts` resolves Death > Recovery > Immune > Absorb > Weak; her Water absorb heals her through the same path as Cure). The HUD **already draws three rows** (`ff7HudModel.ts` takes `activeIds.slice(0, 3)`) and `Ff7PartyBuild.activeSlots` already allows three. The real gaps are a **status layer** (Reflect, Barrier, MBarrier, Regen: none exists), the **Reflect bounce**, **Materia levels from AP**, **Limit Levels 2 to 3**, a **per-ability split flag**, and the FF7 scene and stage work. Section 3 has the table.
4. **The fight is a lesson in not casting at a Reflect, and easy otherwise** (RE §10): paper model 99.5% wins for a player who attacks, 72.5% for a distracted one, 0% for one who casts into the Reflect every turn. Her own MP (300, 8 to 34 a move, 30 held back for the Reflect) is the real pressure, and the party has no way to touch it without Magic Hammer, which the preset does not carry.
5. **Canon removes work:** no victory pose, no results screen, no battle-music change (RE §2): no victory paintings for three members, no results panel, one music decision instead of two.
6. **Size drops** from 76 to **66** agent-hours (§11).

## 1. Game case and sources

**Game case: FF7 only.** Original FF7 ATB, Materia, Limit gauge. New logic lives in new files under `src/battle/ff7` and `src/data/ff7`; the existing Guard Scorpion suites and the `ff7-golden` fixture (seeds 1 to 20, 40 hashes) must stay green **unchanged** (an absence test: a battle with no status applied behaves exactly as before). The chapter registry, the door table and the other shared tables (PLAN §7) are shared plumbing, case "both", inert for every other chapter, left to the wave-3 integrator. FFX and FFX-2 are not touched (`ffx2-atb-golden` named in the absence test).

| Source | What it gives | Tag |
|---|---|---|
| Fergusson *Enemy Mechanics* v1.11, as transcribed in `docs/plans/next-content-2026-09-27.md` §2 and `research/ff7-battle-core.md` | the record, the abilities with MP, the dial | [single source, read 2026-09-27] |
| Gamer Corner, FF7 Speedrun wiki, Jegged, a player report | the record again, the AI script in Fergusson's shape, the Reflect behaviour from play | [read 2026-11-06, RE §1] |
| LE `party.md` §7, `scenes.md` §6, `formulas.md` | the Lv 38 builds, the scene bible, the Reflect and status tables | [LE; errors listed in RE §8] |
| Fergusson *Battle Mechanics*, *Party Mechanics* | the Reflect rules, MP shortfall, armour MD% | **not read** (RE §11) |

## 2. What the player experiences, in plain words (the game's own rules, RE §3 to §6)

**The set-up.** The altar of the Forgotten Capital: still black water, stepping-stone pillars, light from below. The party (Cloud, Tifa, Barret) stands on the left; something rises from the water on the right. Escape is off. The music is whatever the scene was playing (RE §2).

**Her turns.** She acts about 1.6 times as often as one of the three (RE §9). Mostly Blue Light (8 MP, about 400 on one member), sometimes twice in one turn; every third turn Blue Flame (about 460); and one cycle in five at full health, one in two below a quarter, **Aqualung** on all three for about 1,000 each (half with MBarrier). All of it is Water magic and none of it inflicts a status. **Her tell:** the cycle's shape and the dial; the sourced scene bible's tells are the inhale before Aqualung and the unfurling of the tendrils at 75, 50 and 25 percent HP (design, LE scenes §6 F).

**Her answers.** The first magic spell that hits her lands; a moment later **she casts Reflect on herself** (30 MP) and from then on every reflectable spell turns back on its caster. Water heals her (absorb); Earth hurts her twice as much. She cannot be Stopped, slept, poisoned, confused, silenced, frogged, shrunk, berserked, petrified, manipulated or killed outright; Paralysed, Darkness, Slow, Sadness and Fury work.

**The win.** 10,000 HP. 4,000 EXP, 350 AP, 1,500 gil and a Wizard Bracelet, none of it shown: the battle ends mid-phrase and the scene goes on (§9 J9). **The design fact `[derived]`:** physical attacks and Limits are the answer, the Earth weakness is one free hit, the Reflect punishes a player who is not reading her, and the party's healing (Cure2, Regen, MBarrier) decides how many Aqualungs it can afford.

## 3. Engine work

Each row is mapped to files at `origin/main`, marked **existing**, **partly** or **new**, and sized `[estimate]` in agent-hours (S under 1, M 1 to 3, L over 3). Host files near the 400-line cap (`engine.ts` 360, `formulas.ts` 380, `types-ff7.ts` 326) get a one-line hook; the work goes in new files.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | **Status layer:** Reflect (persistent), Barrier and MBarrier (halve, 127 V-Units), Regen (1/32 of max HP per 4 V-Units, 127 V-Units), DeBarrier's cure list; durations on the V-Timer (Haste and Slow already change its rate); immunities read from `statusImmune`; a hard stop at these four, no Stop, Sleep, Confusion in this chapter | **New** (`Combatant.statuses` exists on the shared type and `setup.ts` clones it; `atb.ts` has `vTimerIncrease(time)`; nothing applies, ticks or reads a status) | new `statuses.ts`, hooks in `engine.ts`, `resolve.ts`, `perform.ts` | L, 4 |
| 2 | **Reflect bounce:** a reflectable spell on a Reflect holder turns on its caster, damage recomputed against the caster (RE §6), one spell at most four bounces, Reflect itself and Comet, Demi, summons, items not reflectable; a reflected spell is an automatic hit (`hit.ts` already takes `autoHit`); Aqualung bounced by a party Reflect lands on her and **heals** her | **Partly** (`reflectable` is on the ability record and `hit.ts` has the comment; no redirect) | new `reflect.ts`, `perform.ts` | M, 2 |
| 3 | **AI seams:** (a) `counterMagical` beside `counterGeneral` and a rule for "magical" (the Magical formula, including Cloud's Blade Beam with one enemy); (b) **a turn of two uses** (the double Blue Light) so `main` may return up to two plans; (c) an unaffordable pick fails silently for an enemy (today `payFor` prints "Not enough MP" for anyone); (d) "Choose all opponents" exists | **Partly** (`script.ts` has Setup, Main, General, Death) | `ai/script.ts`, `resolve.ts` | S to M, 1.5 |
| 4 | **Jenova's record and script:** the stat block, forms none, drops class 63, the three attacks and Reflect, Count and SpclChance | **New data on existing shapes** (`Ff7EnemyFields`, `Ff7AbilityDef`; the Guard Scorpion record is the template) | new `data/ff7/enemies/jenova-life.ts`, `ai/jenova-life.ts`, `abilities.ts` rows | S, 1 |
| 5 | **Materia levels from AP and the All link:** AP thresholds (LE `party.md` 3.5), spells per level (Restore: Cure, Cure2, Regen; Fire, Ice, Lightning: x, x2, x3; Earth: Quake, 2, 3; Barrier: Barrier, MBarrier), the stat deltas per tier, and `All` as a support Materia that lets the linked partner's spells hit all (today any spell toggles free, a Guard Scorpion simplification) | **Partly** (`Ff7MateriaDef.spells` is flat, `MateriaInstance.ap` exists, `MateriaSlotLayout.links` exists) | `stats.ts`, `data/ff7/materia.ts`, `ids.ts` | M, 3 |
| 6 | **Limit Levels 2 and 3:** Cloud's Blade Beam, Climhazzard; Barret's Satellite Beam (auto-critical), Angermax (18 hits of 1/2x at random enemies); Tifa's chain (Beat Rush to Dolphin Blow in one command, reels all "Hit" by default); `crit: 'auto'` and a hit list on the ability record; the LNum for the level (data exists in `limits.ts`) | **Partly** (`LimitState.level` and `learnedLimitIds` exist; Level 1 moves only) | `defs.ts`, `perform.ts`, `commands.ts`, `data/ff7/limits.ts`, `abilities.ts` | M, 3 |
| 7 | **A per-ability split flag:** Gamer Corner's Aqualung 850 includes the 2/3 split although Aqualung cannot toggle, while `splits()` splits a Magical hit only if `canToggleAll` (core 4.5 step 8); pin the oracle, add `splitsOnMulti` | **Partly** (`formulas.ts` `splits`) | `formulas.ts` hook, `defs.ts` | S, 0.5 |
| 8 | **Items:** Hi-Potion (500), Ether (100 MP), Phoenix Down (exists), no Elixir, Remedy or Hyper (no status to cure); stock per the preset (LE: 20 Potions, 15 Hi-Potions, 8 Ethers, 10 Phoenix Downs; Grenade 10 as the one damage item) | **Partly** (Potion, Phoenix Down exist) | `data/ff7/items.ts`, `abilities.ts` | S, 1 |
| 9 | **A third member:** `tifa` in the id unions, her build, `Diamond Knuckle`, `Gold Armlet`, `Power Wrist`, three-way retargeting, the grace queue with three | **Partly** (types allow three; every test and the golden use two) | `data/ff7/ids.ts`, `equipment.ts`, new `builds/forgotten-capital.ts`, tests | S to M, 1.5 |
| 10 | **Cover, Counter Attack, Deathblow, Enemy Skill, summons, Destruct** (LE's builds carry them) | **Absent; not built** (each is a system; `ff7-engine.md` lists them unreachable) | none | 0 (left out of the preset, §4) |
| 11 | **HUD:** three party rows (existing); the **phone layout for three** (B has two); a Magic list longer than one page (Cloud: Cure, Cure2, Regen, Bolt to Bolt3, Quake2, Barrier, MBarrier; the grid is 3 columns by 4 rows, paging to check); the existing **Barrier and MBarrier boxes lit** from the status layer; Reflect has no FF7 icon (the shell is a stage effect, row 13) | **Partly** | `ui/ff7/ff7Geometry.ts`, `Ff7PartyRows.ts`, `ff7MenuModel.ts` | M, 3 |
| 12 | **Stage and motion:** a new staging file for the altar (three front-row spots, a back row, her spot on the right, the desk and the phone cameras, solved to the approved frame), the scene switch generalised from `'sector1-reactor'` (62 references in the staging file, 4 in the stage hook, 3 in the motion port, 2 in `battlePreload`, 1 each in `StageFacing`, `entranceCanon`, `pyreflyCanon`), Tifa's strike run and cast pose, Jenova's stand-in motions, the sendOff reused | **New on existing hooks** | new `scenes/forgotten-capital*.ts`, `BattleScreenFf7Stage.ts`, `BattleScreenFf7Motion.ts` | M to L, 4 |
| 13 | **Effects** (on the existing `FxDrawList` kit): Blue Light (the nimbus and the implosion), Blue Flame (the spiral and the release), **Aqualung** (the inhale that draws the water in, then the wave across all three), the **Reflect shell and the bounce arc**, the Water-absorb heal, Quake, Cure2 / Regen, Fire / Ice / Bolt3 at higher tiers, Climhazzard, Blade Beam, Tifa's chain, Satellite Beam; Bolt, Ice, Cure, slash, shot, Braver and Big Shot reuse what exists | **Partly** | `engine/spellfx/ff7/*` | L, 5 |
| 14 | **Story and flow:** an FF7 dialogue window (the blue window; the DSL's speakers have no `tifa`, `aerith`, `sephiroth`), the compact pre and post scenes of §9 J10, a chapter flag for "no results, no victory pose" (today `skipResults` is a run option and the Experiment flow always shows the panel), RETRY straight back into the fight | **New on the DSL** | `story/dsl.ts` (a listed contract file: the `SpeakerId` union), `story/scripts/ff7-jenova-life.ts`, `Ff7DialogueWindow`, `BattleScreenExperiment.ts` | M, 4 |
| 15 | **Chapter record and data tests:** ids, the cite test, the Def-140 oracle (343, 392, 850), clock pins (371, 342, 384, 227 ticks) | **New** | `data/chapter-ff7-jenova-life.ts`, tests | S to M, 1.5 |

**Order of dependence:** 1 before 2 and 11; 5 before the builds; 3 and 4 with 15; 6 independent; 12 to 14 are presentation and wait on §9.

## 4. The party

- **Build point:** LE `party.md` §7 (Lv 38, the median of the level-up algorithm; Cloud 2,298 HP base, Tifa 2,072, Barret 2,573). Pools by the engine's rule (RE §9): **Cloud 2,435 HP / 360 MP, Tifa 1,948 / 308, Barret 2,368 / 295.** `[estimate]` as a preset, never raised toward a result.
- **Recommended front line: Cloud (front), Tifa (front), Barret (back, Long Range)**, the scene bible's three. Alternative: Cloud with Barret and Red XIII or Cid (more research, a different third painting, no benefit).
- **Recommended Materia (a leaner set than LE's, written from AP through the table, J4):** Cloud: Restore (Lv 3: Cure, Cure2, Regen) linked to All; Lightning (Lv 3); Earth (Lv 2: Quake2; bought at Kalm or Junon); Barrier (Lv 2: Barrier, MBarrier). Tifa: Ice (Lv 3), Restore (Lv 2: Cure2). Barret: Fire (Lv 3), Restore (Lv 3) linked to All. **No Enemy Skill** (Aqualung heals her), **no summons, no Cover, no Counter Attack, no Destruct, no Reflect on the party** (that is Barrier Lv 3; with it her own Water spells bounce back and heal her: a trap worth one line in the guide, not a system). The lesson the Materia teach is: MBarrier halves what she throws, Cure2 on all keeps three bars up, and the Earth cast is a free opener.
- **Gaps this lane does not fill (rule 6):** the exact bag, the AP, armour MD%, the Hi-Potion and Ether rows (RE §11). All `[estimate]`, flagged.
- **Boss numbers are never tuned** (PRODUCT-BRIEF "mechanics never bend"). If the measured line is far from the bands (§8), Bailey gets options with numbers: the levers are stock, level and Materia, never hers.

## 5. The arena

- **No altar plate exists.** The art mirror's FF7 backdrops are the reactor only (`ff7-film-reactor`, `ff7-sector1-reactor`). The party stands on the left facing right, the boss on the right (Bailey's D-262 "just have the characters and enemy switch sides", kept for every FF7 chapter).
- **Options (end state first; a mockup at real resolution each, owed before building):** **(a)** a new painted plate of the altar from the scene bible: concentric stone platforms rising out of black water, light from below, the shell-city's spiral far above; the party on the lowest platform, Jenova rising from the water at the right, the camera low and slightly wide; **(b)** the same plate with a higher camera (the Guard Scorpion's raised look: everyone whole above the band); **(c)** a close, cropped frame on the water line (the plate cut to a strip, the party small, Jenova tall at the top). **Recommendation (a) for the first mock, (b) beside it, (c) only if the frame fights the HUD band.** A phone variant (390 x 844) is part of the pick (the FF7 phone layout has the formation drawn in and the camera moved in, E1).
- **The old Lifestream Encore palette** (its art docs name Ice Wash, Crystal Teal, Sage and Arc Blue for this place) is a reference, not an asset: that repo's altar is a live 3D scene, and 3D is out of this program.

## 6. New art needed

Counts are images. Poses follow the Film set's file names (`idle`, `windup`, `attack`, `follow`, `hurt`) because the existing motion port reads them.

| Asset | Images | Note |
|---|---:|---|
| **Jenova LIFE** | 6 to 7 | idle (rising from the water), cast Blue Light, cast Blue Flame, the Aqualung inhale, hurt, a Reflect pose may be code (the shell), and a death frame only if the house sendOff (white flash, explosions, burn-away) is not used; the look is J14 |
| **Tifa** (Film style, front row, melee) | 6 to 7 | idle, windup, attack, follow, hurt, a cast pose, a Limit-chain kick; **no victory pose** (canon); she does not exist in the art mirror (a `tifa.glb` in LE is 3D and out) |
| Altar plate (+ phone variant) | 1 + 1 | J14-adjacent pick of §5 |
| Cloud, Barret | **0 new** | the Film sets (idle, windup, attack, follow, hurt for Cloud; idle, aim, attack, punch, hurt for Barret) are reused as they are; their victory and spin poses go unused |
| Scene stills (compact scenes, J10) | 3 to 4 | Aerith kneeling at the apex; Sephiroth, a silhouette against the light above; the lake edge (post); optionally Cloud at the top of the pillars with his sword arm raised |
| Effects (code, on the FX kit) | n/a | row 13 of §3 |
| Chapter card, thumbnail | 1 | |
| **Total** | **about 18 to 22** | |

- **Recolour of existing paintings:** nothing is close. The reactor boss is a machine; the Film party poses are the only reuse. Aerith and Sephiroth are not in the repo.
- Art route is the driver's (the Art Room per the standing art rules); nobody queues ComfyUI here (rule 12). Retail references are allowed (Bailey, 2026-10-18); the painting that ships must match the approved Film look (the standing art lesson: pilot Tifa's idle and look at it **before** the batch). **Bailey alone approves a painting.** The "AI slop" and uncanny-valley verdicts (2026-10-20) apply to any 3D route; none is used.

## 7. Music (rule 13: only his ears judge)

Canon is "Aerith's Theme" through the scene, the fight and the burial, unbroken, cutting to silence at the end (RE §2). It is a retail cue; the 09-27 plan decided an original score would replace it, the retail-assets rule was lifted on 2026-10-18, and no agent can hear. **Stand-in (J13): silent**, as the Guard Scorpion was before its take, with an entry on `docs/audio/audition.html` for a new original take in the slow, drumless, solo-instrument mood (a spend and a download; rule 11 note to the driver). Alternative: the retail cue if Bailey supplies a source file and listens. Not touched by this lane.

## 8. Winnability method (rule 15: nothing is tuned; the bench measures and the preset moves)

A copy of `tools/ff7-bench.mjs` for this chapter (200 seeds, Recommended; Active and Wait reported), with a player model whose animation and menu times are the Guard Scorpion bench's (`docs/plans/ff7-engine-bench.md`). **Policies and bands, fixed before the first run:**

| Policy | What it does | Band (pre-registered) | Paper model (RE §10) |
|---|---|---|---|
| sensible | Attack and Limits; Cure2 or Hi-Potion below 45%; Phoenix Down on a KO; never casts into a standing Reflect; may open with Quake2 | wins >= 95%, median 60 to 150 s, KO'd members per win <= 0.5 | 99.5%, about 100 s, 0 |
| distracted | half Attack, 30% an element spell whatever her Reflect says, 20% Defend, heals below 25% | wins >= 50% ("beatable by a party playing badly", LE scenes §6 F) | 72.5% |
| spam-magic | every member casts an element spell every turn | reported, **not gated**: it loses by arithmetic, the lesson | 0% |
| literal-hint | none (she has no hint line) | n/a | n/a |

If distracted falls under its band, the levers in order: the Phoenix Down and Hi-Potion stock, MBarrier cast at the start, the preset level (38 to 40), the heal threshold. **Never** hers (HP, MP, damage, the dial). A soft-fail resume is **not** built (J8): RETRY goes straight back into the fight, so no one watches the death scene twice.

**Tests (T0 first, T7 last):** T0 the engine checks of §3 rows 1 to 3 and 7 (and the golden unchanged); T1 data and cites, the Def-140 oracle (Blue Light 343 or 344, Blue Flame 392, Aqualung 850) and the clock pins; **T2 the AI as pins:** the Count draw, the cycle, the dial at exactly 75, 50 and 25 percent (inclusive), Reflect only without Reflect and with 30 MP, the double Blue Light's second draw, an unaffordable pick failing silently, her MP over a fight; **T3 Reflect:** the bounce target and recompute, the four-bounce cap, Reflect not reflectable, a party Reflect bouncing Aqualung to heal her; T4 statuses on the V-Timer under Haste and Slow; T5 the Limit hit lists and the Blade Beam counter case; T6 the bench (12 then 200 seeds); T7 the HUD with three rows at 1600 x 900 and 390 x 844; T8 the real-input e2e (the door, the scene, the fight, the end). Rule 14: FF7 only; the absence test names `ffx2-atb-golden`, `ff7-golden` and the FFX suites unchanged.

## 9. Picks (driver's calls, his to overturn); each perceivable one owes 2 to 4 end-state options before building (rule 9)

| # | Pick | Recommended | Alternative |
|---|---|---|---|
| J1 | Number, word, registration | **44, door word `bluelight`** (PLAN §8; `tools/ff7-jenova-paper.mjs` F re-checked it against the 15 table words, `pilgrim`, `gear` and the 31 proposals: no failure); an **experiment** (`EXPERIMENT_CHAPTERS`, `experimental: true`), a plain typed word with the FF7 gate (`ff7ExperimentReady`), not the board's one secret door | the Guard Scorpion's registration (`UNLISTED_CHAPTERS`, number 0): rejected, `chapter-numbers.test.ts` documents 0 as the unlisted FF7 experiment's alone and the plan reserves 44; either way `chapter-doors.test.ts` (the exact word list, the per-word game array, the gated rows by name) changes |
| J2 | Party | **Cloud, Tifa, Barret** | Cloud, Barret and Red XIII or Cid |
| J3 | Build point | **Lv 38, the Wutai build** (LE's majority case) | Lv 35 (a player report); the Wutai-free swap (about 12 Attack less each) |
| J4 | Materia | **the leaner set of §4**, written from AP through the table | LE's three builds as written (adds Cover, Counter Attack, Deathblow, Enemy Skill, Shiva, Elemental: row 10, about 12 more hours) |
| J5 | The Water Ring | **not in the preset**, no accessory menu (the 09-27 plan; it makes the holder unkillable) | an item the player finds and equips (needs an equip screen) |
| J6 | Reflect on the party | not carried | carried: the Water-heals-her trap (S once row 2 exists) |
| J7 | Tifa's Limit | **the chain with every reel "Hit"**, no mini-game (LE `party.md` 10.3 calls the reel layouts invented) | the reels (L, about 4 more hours) |
| J8 | After a defeat | **RETRY goes straight back into the fight** (the Guard Scorpion's G1), no cutscene replay | LE's soft-fail: revive once and resume |
| J9 | After a win | **no fanfare, no victory pose, no results screen**; the clear goes in the experiments store as for the Guard Scorpion | the house results (against canon) |
| J10 | The scenes | **compact (B):** the pre scene in the blue window over the altar plate with the stills (Aerith kneeling, Cloud's arm, Sephiroth's silhouette), about 12 windows; the post scene (the puppet line, the lake still, the cut to silence, fade to white) | (A) the battle only, as the Guard Scorpion; (C) LE's two full scripts (about 60 and 30 beats; +3 hours, +2 paintings) |
| J11 | Letterbox through the battle | **no** (the FF7 band is already a frame; the Ink & Gold bars are not FF7's) | bars, as LE's staging note |
| J12 | A boss MP bar | **no** (FF7 hides enemy MP); the tell is the Reflect shell failing when she is low | a bar (LE's design note) |
| J13 | Music | **silent stand-in** (§7) | a new original take; the retail cue |
| J14 | Jenova's look | **(A) a pale woman-shaped figure rising from the water with trailing translucent limbs** (closest to the original) | (B) a winged silhouette (a Rebirth import, LE scenes §6); (C) a veiled crystalline shell that echoes the shell-city |
| J15 | Door on a phone | open, with its own 3-row phone layout (the hidden 3D chapters are the only desktop-only doors) | desktop only |

## 10. Review class, tracks, hosting

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/common/types-ff7.ts,src/battle/ff7/**,src/data/ff7/**,src/ui/ff7/**,src/story/dsl.ts,src/app/screens/**` was **not run** (treeless lane); by the sibling wave-3 preflights' reading (the chapter registry, shared contract files and any `BattleScreen*.ts` touch class a change **DEEP**; `types-ff7.ts`, `encounters.ts` and `story/dsl.ts` are all listed in `docs/CONTRACTS.md`, so each edit needs a `CONTRACT-CHANGES.md` entry): expect **review DEEP, focused before deploy, live verification and the deep review after, obligations live + focused + deep**; not save-data class (the clear goes to `pyrefly-reprise:experiments:v1`, never the main save). The driver re-runs the command from the host. **Ship the wave-3 chapters in one release** so they share one deep review.

**Tracks (small vertical slices):** T0 engine checks (rows 1 to 3, 7); T1 data and records (rows 4, 5, 8, 9, 15); T2 the AI and the Reflect (rows 2, 3); T3 the Limits (row 6); T4 the HUD for three (row 11); T5 stage and plate (rows 12, blocked on J14 and §5); T6 art (blocked on J14, serialised through the GPU lock; Tifa's pilot first); T7 FX (row 13); T8 story, dialogue and flow (row 14, blocked on J10); T9 the integrator (shared tables, tests, the door re-check with `door-check.mjs`). **Host (PLAN §6, wave 3, driver's call):** this row "deserves a tree of its own for its whole duration"; a merged-and-live clean tree branched from `origin/r75-boss-art` until r75 merges, `public/art` repointed to the newest mirror first, `node tools/fx-assets.mjs ensure` in it. The row 56 chapter (Safer Sephiroth) reuses rows 1, 2, 6, 11 and 14.

## 11. Size (Sonnet agent-hours, counted the way `ch-keeper-review.md` counts)

| | Plan | This preflight | Why |
|---|---:|---:|---|
| R research | 8 | **2** | the fight is read and corrected; the Battle Mechanics read and the six questions (RE §11) are the remainder |
| B build | 36 | **34** | §3 rows 1 to 9 and 11 to 15: 4 + 2 + 1.5 + 1 + 3 + 3 + 0.5 + 1 + 1.5 + 3 + 4 + 5 + 4 + 1.5; row 10 not built; element absorb and the three-row band are cheaper than the plan assumed, the status layer, the scene and the effects dearer |
| A art | 20 | **18** | Jenova (4), Tifa (4), plate and phone (2), stills (3), options and mock frames (2), install, hashes, QA (2), cards (1) |
| I integration and tests | 12 | **12** | the 12 to 15 shared tables (PLAN §7), the door and number tests, a golden and a bench copy, the e2e at two sizes |
| **Total** | **76** | **66** | +4 if J7 takes the reels, +12 if J4 takes LE's builds, +3 for J10 (C) |

## 12. Top risks

| Risk | Answer |
|---|---|
| The unread Battle Mechanics changes the Reflect rule (spent status, bounce target, MP shortfall) | each is one labelled constant in `reflect.ts` and `statuses.ts`; RE §11 has the exact questions; the Guard Scorpion lane read the same guide in a browser pane in fifteen minutes |
| The status layer grows past four statuses | the hard stop of row 1; the next chapter (row 56) extends it |
| Reflect and the absorb interact oddly (a bounced Water spell heals her) | T3 pins it; it is canon behaviour, kept |
| The status hooks disturb the Guard Scorpion | the absence test: `ff7-golden` unchanged to the hash |
| Tifa's painting does not match the Film look | pilot the idle first, look at it, then the batch (the 2026-09-21 art lesson) |
| The scene's tone (LE: "restraint is canon") | compact scenes, no score swell, no close-up of grief, the camera pulls away; Bailey's ear and eye on J10 |
| A host file at the cap | new files and one-line hooks; shared edits left to the integrator |
| The phone layout for three rows is cramped | the real-input check at 390 x 844 before the pick, as the Guard Scorpion's phone A and B |

## 13. Open questions, and what settles each

1. RE §11 items 1 to 6 (a browser read of Fergusson, about fifteen minutes; or ship on the labelled estimates).
2. **Registration:** experiment (number 44) or unlisted (number 0)? J1 recommends the first; the integrator confirms against `chapter-numbers.test.ts` and the tests that iterate `EXPERIMENT_CHAPTERS` (`chapter-music-warm`, `booth-treated-chapters`, `audio-cue-reachability`).
3. **Is armour MD% real for the preset's armour?** It is the only thing that can make her miss (RE §6); estimate 0.
4. **`SpeakerId` (`story/dsl.ts`, a listed contract file) has no `tifa`, `aerith` or `sephiroth`.** Row 14 adds them additively, with a `CONTRACT-CHANGES.md` entry (rule 2); the cutscene stage's portraits and Ink & Gold chrome are FFX / FFX-2's, so the FF7 window is a separate component, not a reskin.
5. **How long a battle is "a bookend"?** The paper model says about 100 s (sensible) to 170 s (distracted) at 30 ticks a second `[estimate]`; Bailey's feel decides.

## Corrections and findings (what the mapping turned up)

- The plan's "two known errors" are one for this row (Blue Light, 8 MP), and the mapping found three more in the earlier research (RE §8).
- The plan's "Reflect, Barrier, MBarrier, element absorb/weak ... on the Guard Scorpion kernel": absorb and weak exist; the missing piece is one status layer that Reflect, Barrier, MBarrier and Regen share.
- Aqualung needs a split flag (§3 row 7); the engine's toggle rule would deal 1,552 on Cloud (before variance) where Gamer Corner's 850 oracle, which includes the 2/3, implies 1,034.
- A Magic Hammer, Mindblow or MP drain is the only way to touch her pool, so the party's real answer to Aqualung is MBarrier and healing; the preset says so.
- `payFor` prints "Not enough MP" for an enemy (a system line meant for the player's menu); fixed in row 3.

## 14. Changes to `PLAN.md` (the driver's to apply)

1. **Row 44 text:** "two known errors" becomes "four corrections" (Blue Light 8 MP; Wizard Bracelet certain; Aqualung three casts; the Materia labels); Safer's beat-3 stays with row 56. "Fergusson's Battle Mechanics still unread" stays true and is not reachable by fetch or mirror from a treeless lane (RE §0).
2. **Engine gaps** in row 44 and row 56: replace "Reflect, Barrier, MBarrier, element absorb/weak, Limit levels 2 to 3, a three-member party and its HUD" with "a status layer (Reflect, Barrier, MBarrier, Regen), the Reflect bounce, Materia levels from AP with the All link, Limit Levels 2 to 3, a per-ability split flag, AI seams, an FF7 dialogue window, a new altar staging" (element absorb and weak exist; three party rows exist).
3. **Size:** R8 B36 A20 I12 = 76 becomes **R2 B34 A18 I12 = 66** (section 4 table, section 4 wave 3 total 208 becomes 198; cumulative 445 becomes 435).
4. **Registration note:** row 44 is an experiment with number 44 and a plain typed word with the FF7 gate; the Guard Scorpion's number 0 and secret door are its own (section 7 of the plan lists the door test and `chapter-numbers.test.ts` among the shared edits).
5. **Art line:** Cloud and Barret reused from the Film sets (no new poses; no victory poses are needed, canon has none); new: Jenova (6 to 7), Tifa (6 to 7), the altar plate (+ phone), 3 to 4 scene stills (Aerith, Sephiroth, the lake); about 18 to 22 images.
6. **Section 8 of the plan:** `bluelight` re-checked against 47 words, no failure (`research/ff7-jenova-life-paper.txt` F).
7. **Section 10 item 4** ("start row 44's R step"): its two open points are closed or reduced to the six questions of RE §11; the long pole is now the status layer, the scene and the effects, not research.
