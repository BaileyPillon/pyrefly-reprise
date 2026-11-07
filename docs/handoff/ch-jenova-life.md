# Handoff: the hidden Jenova LIFE chapter (lane ch-jenova-life; FF7 ONLY)

Branch `ch-jenova-life`, from `origin/r76-release` `36b6e851d`, built 2026-11-07 in a clean worktree. Authority: Bailey, 2026-11-06 ~00:30 EST "implement all unimplemented chapters please" and ~00:55 EST "yes on all these too"
(every researched boss he never picked, FF7 included); 2026-11-07 "ok keep going we have full usage here"; on FF7, 2026-09-27, the art "higher fidelity than the original" with crisp menus and eye candy. Every pick below is the
driver's recommendation, **his to overturn**, with the alternative named. Nothing deploys from this branch. **Not run in a browser** (the review-browser lock was held by another job for the whole window): the job specs and the
prediction are section 7; everything else was run, on the real engine and the real HUD and board in jsdom.

**Game case: FF7 only** (AGENTS.md rule 14): the original 1997 fight at the altar of the Forgotten Capital, the end of Disc 1; ATB, Materia and the Limit gauge. Remake's and Rebirth's Jenova is a different fight and is not used. FFX and
FFX-2 are untouched: the Guard Scorpion's pin (`ff7-golden`, 40 hashes), `ffx2-atb-golden` and the FFX suites pass unchanged. The research is `research/ff7-jenova-life.md` (the note, "jl"), the paper preflight
`docs/plans/ch-jenova-life-review.md`, the paper arithmetic `tools/ff7-jenova-paper.mjs` (output `research/ff7-jenova-life-paper.txt`).

## 1. What is playable now

- Type **`bluelight`** on chapter select (desktop, any case; the phone's long-press field takes the same word) and the FF7 swirl opens the fight; `window.__pyrefly.gotoChapter('ff7-jenova-life')` does too. Behind the same FF7 switch as the Guard
  Scorpion's door (`FF7_EXPERIMENT_READY`). No card, no count; attempts and clears go to the experiments' store, never the save.
- **Cloud, Tifa and Barret** (Lv 38; Cloud and Tifa in front, Barret behind with Long Range) against **Jenova LIFE** (10,000 HP, 300 MP, Water absorbed, Earth weak). Three HUD rows, ten spells in Cloud's Magic window, Limit Levels 2 and 3
  (Blade Beam and Climhazzard; Tifa's five-hit chain; Satellite Beam and Angermax), Hi-Potions, Phoenix Downs. Her Reflect, Aqualung, the double Blue Light and the dial that follows her HP are all in.
- Stand-ins, said plainly: **the plate is the Guard Scorpion's reactor** (graded cooler), **Tifa and Jenova draw the stage's fallback figures** (no painting exists), the effects of her three moves, Fire and Quake are the house bloom, the music is silent,
  there is no cutscene. The art list is section 6.

## 2. Driver picks (his to overturn); the alternatives

| # | Pick | Alternative | Why |
|---|---|---|---|
| J1 | Number **44**, word `bluelight`, an experiment (`EXPERIMENT_CHAPTERS`, `experimental: true`), a plain typed word behind `ff7ExperimentReady` | the Guard Scorpion's `UNLISTED_CHAPTERS` number 0 and secret door | `chapter-numbers.test.ts` documents 0 as the Guard Scorpion's alone; the plan reserves 44 |
| J2 | Cloud, Tifa, Barret | Cloud, Barret and Red XIII or Cid | the scene bible's three |
| J3 | Level 38, the Wutai build | Level 35; the Wutai-free swap (about 12 Attack less each) | LE's majority case |
| J4 | A leaner Materia set, **written from AP through the table** (Cloud: Restore Lv 3, Lightning Lv 3, Earth Lv 2, Barrier Lv 2; Tifa: Ice Lv 3, Restore Lv 2; Barret: Fire Lv 3, Restore Lv 3) | LE's three builds as written (adds Cover, Counter Attack, Deathblow, Enemy Skill, Shiva, Elemental) | LE's spell labels are wrong (jl section 8 item 4) |
| J5 | No Water Ring | an item the player finds and equips | it makes the holder unkillable |
| J6 | No Reflect on the party | carried: a trap, her Aqualung then heals her | a system worth a line, not a build |
| J7 | Tifa's Limit is the whole chain with every reel a Hit | the slot reels | LE calls the reel layouts invented |
| J8 | RETRY goes straight back in | LE's soft-fail resume | no one watches the death scene twice |
| J9 | **Not applied yet**: the win still shows FF7's results windows | no results on a win (canon) | the canon pairs with the post scene (J10), which is not built; a silent return to the board would read as a bug |
| J10 | The scenes are **not built** | compact scenes (B), LE's full scripts (C) | they need the FF7 blue dialogue window, `SpeakerId` additions (a contract) and three stills, and they are Bailey's to see first (hard rule 9) |
| J13 | Silent | a new original take; the retail cue | rule 13: only his ears judge |
| J14 | Jenova's look and the altar plate are **not painted** | the three options of the preflight, section 5 | hard rule 9: options before paint |
| J15 | The door works on a phone | desktop only | painted 2D, as Penance |

**Picks made while building, also his to overturn:**

| # | Pick | Alternative |
|---|---|---|
| P1 | The stand-in field is the reactor scene derived (`scenes/forgotten-capital.ts`): the same plate, camera, lights and motes, Jenova on the Guard Scorpion's boss spot so the opening, victory and game-over rigs still look at her | a flat procedural plate; waiting for the altar |
| P2 | Tifa takes the nearer of the reactor frame's front spots and Barret the upstage one he had (`forgotten-capital-staging.ts`) | the reactor's slot order |
| P3 | Blade Beam counts as a magical attack for her Counter - Magical when one enemy is on screen (LE party 9.1, one source for the clause) | it does not (she would Reflect only on a spell) |
| P4 | A win after Jenova plays no victory poses (canon has none), only a short hold, then the results | the Film win poses |
| P5 | A guide card and page are registered (FF7; no tactic: the advisor is off for FF7 and the FF7 battle screen has no guide panel yet) | none |
| P6 | The Limit gauges start empty (the research gives no figure; the Guard Scorpion's pick) | full gauges (a Rebirth import in LE's scene bible) |
| P7 | Her Reflect is **not spent** by use; one spell turns at most 4 times between two holders | the status exhausted after four bounces (LE 6.6 words it that way; the walkthroughs and players describe it standing) |

## 3. What changed, by area (all FF7 only; inert elsewhere; `docs/CONTRACT-CHANGES.md` has the entry)

**Engine gaps built (the brief's list), each with tests:**

| Gap | Where | Proof |
|---|---|---|
| **A status layer**: Reflect, Barrier, MBarrier, Regen on the holder's V-Timer; 127 V-Units; Regen `[MaxHP / 32]` per 4 V-Units; a KO clears them; the step lands on the exact tick | `battle/ff7/statuses.ts`, a hook in `engine.ts#tick` | `ff7-statuses.test.ts` (Barrier on at tick 5,716, off at 5,717; 31 Regen heals; the Guard Scorpion never grows one) |
| **Barrier and MBarrier** halve Physical, and Magical and Cure (core 4.5 step 9) | `perform.ts` reads the target's statuses; `formulas.ts` already had the step | `ff7-statuses.test.ts` |
| **Reflect**: a reflectable spell aimed at a holder turns on its caster (a random opponent of the holder when an ally cast it), an automatic hit, damage recomputed, at most 4 turns; her Aqualung turned by a party Reflect lands on her and her Water absorb heals her | `battle/ff7/reflect.ts`, `perform.ts` | `ff7-statuses.test.ts` (seven cases), `ff7-jenova-life-ai.test.ts` |
| **Element absorb and weak** (existing; now exercised) | `formulas.ts#resolveElements` | Quake2 on her is x2; Water heals her |
| **Limit Levels 2 and 3**: Blade Beam, Climhazzard, Satellite Beam (all enemies, auto-critical), Angermax (18 hits), Tifa's five-hit chain; LNum at the level; the Diamond Knuckle's +2% critical on Attack | `defs.ts` (`hits`, `crit`), `perform.ts#strike`, `data/ff7/abilities-ch44.ts`, `limits.ts` | `ff7-jenova-life-limits.test.ts` |
| **A three-member party and its HUD**: Tifa in the id unions, her build and kit, three rows (the HUD already drew three), the Barrier box lit from the status layer, a Magic list of ten | `data/ff7`, `ui/ff7/ff7HudModel.ts` | `ff7-hud-jenova.test.ts` (1600x900, phone A and B) |
| **AI seams**: Counter - Magical; a turn of two uses (the double Blue Light); a counter that costs MP pays it; an enemy that cannot pay does nothing and prints nothing | `ai/script.ts`, `resolve.ts` | `ff7-jenova-life-ai.test.ts` |
| **Materia levels from AP** (Cure, Cure2, Regen; x, x2, x3; Quake to Quake3; Barrier, MBarrier) | `stats.ts#materiaLevel`, `data/ff7/materia.ts` | `ff7-jenova-life-data.test.ts` (the boundaries 1,999/2,000 and so on; an orb with no AP is level 1, so the Guard Scorpion's Magic is unchanged) |
| **A per-ability split flag** (Aqualung cannot toggle yet its printed 850 includes the 2/3) | `defs.ts#splitsOnMulti`, one expression in `perform.ts` | the Def-140 oracle 343, 392, 850 in `ff7-jenova-life-data.test.ts` |

**The chapter:** `data/chapter-ff7-jenova-life.ts`, `data/ff7/enemies/jenova-life.ts` (the record, sourced digit by digit), `ai/jenova-life.ts`, `data/ff7/builds/forgotten-capital.ts` (the preset, every number `[estimate]`), `abilities-ch44.ts`,
`equipment-ch44.ts`, `materia.ts`, `items.ts`, `bluelightDoor.ts`, the scene (`scenes/forgotten-capital*.ts`), the guide card and page (`data/guides/ff7-jenova-life.ts`, `docs/ff7-jenova-life.ts`), `story/scripts/ff7-jenova-life.ts` (battle only).

**The measured pools** (the engine's output for the preset; the note's paper numbers used LE's richer builds): Cloud 2,046 HP / 350 MP, Att 108; Tifa 1,990 / 302, Att 117; Barret 2,471 / 284, Att 95. The clock at Battle Speed 128 matches the note
to the tick: Cloud full in 371 ticks, Tifa 342, Barret 384, **Jenova 227** (she acts 1.6 times as often as one of them).

## 4. Tests

New, all passing: `ff7-statuses` (17), `ff7-jenova-life-data` (18), `-ai` (16), `-limits` (14), `-bench` (7), `-chapter` (10), `ff7-jenova-golden` (4; seeds 1 to 20 for three players), `ff7-hud-jenova` (6), `bluelight-door` (9),
`chapters/ff7-jenova-life-guide` (8). Edited for the new chapter: `chapter-doors` (the gated rows), `chapters/prep-tip-band`, `strategy-guide` (the cite form), `helpers/doorWords`, `helpers/guideDocStrings`. **The Guard Scorpion is unchanged to the hash**
(`ff7-golden.test.ts`, 40 hashes; every FF7 suite). `tests/e2e/ff7-jenova-life.spec.ts` is written and type-checked, **not run** (section 7).

**The full suite** (`vitest run --maxWorkers=3`, 2,065 files, 32,760 tests, the machine's CPU at 91 to 100 percent from other work, about 85 minutes): 32,130 passed, 621 skipped, **8 failed in 8 files, every one explained and fixed, and each file re-run green**:
six were lists that pin "the last row" or "every chapter" and now name the chapter (`audio-music-batch2` the cue table, `voice-chapter-wiring` the games, `wraith-door` and `yunas-ballad-data` "the last door" is now found by chapter, `chapters/exp-fayth` the scene table,
`ff7-data-cites` wanted a section mark and a tag in `jenova-life-ids.ts`); two (`valefor-door`, `windwaker-door`, the pair test "the first word to finish wins") **ran out at their 360 s allowance under that load**: alone they take 347 s and 357 s, so the
door allowance in `tests/unit/helpers/doorWords.ts` is now 25 s a door (600 s), not 15; both pass with it. `tsc` is clean for the app and the e2e project. `node tools/orphans.mjs`: 24, the same list as before (no FF7 module).

## 5. Where the engine departs from the note, or reads it literally (rule 6: said, not tuned)

1. **Reflect is not spent** (P7); the cap of 4 is per spell. One constant (`reflect.ts#REFLECT_MAX_BOUNCES`) and the status entry decide it. The note's question 1 (Battle Mechanics) settles it.
2. **The bounce target** is the caster for an opposing caster, one draw among the holder's opponents for an ally's spell (the note's question 1b, one source).
3. **An unaffordable pick** makes her turn pass silently (the note's question 2: the guide was not read).
4. **Her General counter fires on a miss too** (as the Guard Scorpion's does; unsourced).
5. **Draw order** is ours throughout (the Count in Setup, the target then the 1-in-SpclChance roll in Main), as every draw order is.
6. **Armour MD% is 0** for every piece (unsourced; the only thing that could make her miss). She never misses.
7. **A status ticks on the V-Timer, which does not run during the grace pause or an animation** in Recommended and Wait: a Barrier lasts 127 V-Units of battle time, not of wall time.
8. **Not built**: the All link and the one-or-all toggle (the FF7 menu has no toggle at all, Bolt and Cure are single-target there), Enemy Skill, summons, Cover, Counter Attack, Deathblow, Destruct, HP Plus, the Ribbon, Ether (the engine has no MP-restoring item),
   Cure3 and Reflect as party spells, Tifa's slot reels, the choice of a lower Limit Level in the menu, the random pick of Angermax's and Tifa's targets (she is alone).
9. **The Reflect shell, the bounce arc, Regen and Barrier glows have no drawing**; the state is there (`ff7.status`) and a bounce is a `damage` event whose `sourceId` is the holder and whose target is the caster.

## 6. ART NEEDS (nothing is painted; nobody queued ComfyUI: rule 12, and Bailey alone approves a painting)

Style reference: the approved Film set (`public/art/characters/ff7-film-cloud`, `-film-barret`): idle, windup, attack, follow, hurt, victory; the FF7 look rule is **crisp and higher fidelity than the original**. Retail references are allowed since 2026-10-18; the painting that
ships must match the approved Film look. No 3D route (rejected 2026-10-20).

| Sprite key / file | Poses (each with `@2x` to `@4x` like the Film set) | Used by | Today |
|---|---|---|---|
| **`characters/ff7-film-tifa/`** (pilot the idle and LOOK before the batch) | `idle`, `windup` (also her cast pose), `attack`, `follow`, `hurt`; optional `kick` for the chain. **No victory pose** (canon). 1230x947-class canvas with `baselineY`, `facing: right`, `mirrored: false` | `forgottenCapitalBuild` Tifa `spriteKey` | the stage's fallback figure |
| **`characters/ff7-film-jenova-life/`** | `idle` (rising from the water), `hurt`; optional `cast` (Blue Light and Blue Flame) and `inhale` (Aqualung); the Reflect shell is code; the death is the house `sendOff` | `jenovaLife` `spriteKey`, `forms[0]` | the stage's fallback figure |
| **`backdrops/ff7-film-forgotten-capital`** (2304x1296, the Film plate's size; the phone crop is `plateZoom`) | the altar: stepping-stone pillars rising out of black water, light from below, the shell-city far above; one of the preflight's three framings | `scenes/forgotten-capital.ts` (today `SCENE_PLATES` and the scene use the reactor's plate) | the reactor plate, graded cooler |
| `chapter-ff7-jenova-life` (card) | one image | `thumbnailKey` (today `chapter-ff7-guard-scorpion`) | the Guard Scorpion's |
| Tifa's head in the results windows | a head box in her idle, as fractions | `Ff7ResultsScreen.ts#HEADS` (no `tifa` entry; the default box shows) | blank crop |
| Scene stills for J10 | Aerith kneeling at the apex, Sephiroth's silhouette, the lake edge (3 to 4) | not wired | none |
| **Effects**, on the `FxDrawList` kit (`engine/spellfx/ff7`): Blue Light (nimbus, implosion), Blue Flame (spiral, release), **Aqualung** (the inhale that draws the water in, then the wave across all three), **the Reflect shell and the bounce arc**, the Water-absorb heal, Quake, Fire/Fire2/Fire3, Regen/Barrier/MBarrier glows, Blade Beam and Climhazzard, Tifa's chain, Satellite Beam, Angermax | code | ids in `ff7FxSpecs.ts#BY_ABILITY` (stand-ins today: Bolt, Ice, Cure, Braver, Big Shot, the slash; the rest the house bloom) | stand-ins |
| Music | an original slow, drumless, solo-instrument take for the altar (an `audition.html` entry; a spend and a download: rule 11) | `music` is `null` | silent |

## 7. Browser job specs, with predictions (nothing was run)

One heavy browser job at a time, headless, under the review-browser lock (`RIG-RECORD` in the scratch folder); a production build (`vite build` to a scratch outDir, `vite preview`), then
`npx playwright test tests/e2e/ff7-jenova-life.spec.ts` (headless GPU Chromium, one browser). Stop every server by its port afterward.

1. **1600x900, keys.** Type `bluelight` on the board: the swirl, the opening, the first command window. **Prediction:** three rows named Cloud, Tifa, Barret; the three figures are the stage's fallback silhouettes, Cloud and Barret
   the Film paintings; Barret left of Cloud, Jenova right and taller; the plate is the reactor's, cooler. An attack-only player **loses about 87 percent** (26 wins in 200, the bench), so the run walks G1's pan, GAME OVER and RETRY with the seed +1000;
   a win shows the two results windows with 4000 EXP, 350 AP, 1500 gil and the Wizard Bracelet. The board and the save are as before either way.
2. **390x844.** `gotoChapter('ff7-jenova-life')` (the door's phone field takes the word too): three rows in the band, the formation drawn in (Cloud at least 110 px), every window inside the frame.
3. **A longer look, by hand**, for Bailey: a sensible player (heals under 45%, Limits when full) wins 99.5 percent in about 110 s; cast Bolt2 at her after her Reflect rises and watch it come back. The spell effects are the house bloom until they are drawn.

## 8. Winnability, MEASURED (`tools/ff7-jenova-bench.mjs`, seeds 1 to 200, Recommended, zero decision time; the bands were fixed before the first run)

| Player | Wins | A win takes (median) | Jenova turns | Aqualungs | Party KOs |
|---|---|---|---|---|---|
| **sensible** (revive, heal under 45%, Limits, never a spell) | **199/200 (99.5%)** | 110 s (81 to 179) | 12 | 1.16 | 0.14 |
| sensible + Cloud's Quake2 opener | 200/200 (100%) | 109 s | 12 | 1.22 | 0.10 |
| **distracted** (half Attack, three in ten a spell into the Reflect, two in ten Defend, heals under 25%) | **172/200 (86.0%)** | 219 s (110 to 375) | 24 | 1.67 | 3.33 |
| attack-only (no heal, no item, no spell) | 26/200 (13.0%) | 98 s | 10 | 0.97 | 2.71 |
| spam-magic (every member casts into the Reflect) | 0/200 | | 4 | 0.43 | 3.00 (all three) |

**Bands** (`docs/plans/ch-jenova-life-review.md` section 8): sensible at least 95 percent, the median win 60 to 150 s, at most half a member down per win: **met** (99.5%, 110 s, 0.14); distracted at least 50 percent: **met** (86%, against the paper model's 72.5%);
spam-magic reported and not gated: it **loses by arithmetic** (a reflected Bolt3 is 2,300 to 2,450 on Cloud, more than his 2,046 HP, so the first Bolt3 into the Reflect kills the caster outright; the median spam-magic fight is over after 4 Jenova turns, all three down). In the three Config modes and the
timed player (1.5 s an animation, menus 0.5 and 1.5 s) the fight is the same within a point or two (sensible 99.0 to 99.5 percent, 120 to 135 s; distracted 74 to 86 percent). **Honest reading:** the fight is easy for a player who attacks and heals and
**hard for one who only attacks** (13 percent): the preset leans on its healing (Cure2, Hi-Potion, Phoenix Down). Her 300 MP is a real budget (a sensible win leaves her a median 120 MP; a distracted one runs her dry, median 2). Nothing about her was touched; if Bailey
wants it easier or harder the levers in order are the stock (Hi-Potions, Phoenix Downs), MBarrier at the start, the preset level (38 to 40) and the heal threshold, never her numbers. Three seeded runs, sensible: seed 1 won in 116 s (13 Jenova turns, Aqualung x3,
a double Blue Light x3, her Reflect once, no KO), seed 2 in 81 s (9 turns, no Reflect: nobody cast), seed 3 in 128 s (14 turns, one KO); each paid EXP 4000, AP 350, gil 1500 and the Wizard Bracelet.

## 9. CHANGELOG lines (FF7 only; for the release note that ships it)

- **FF7 only (hidden chapter 44, the word `bluelight`): Jenova LIFE at the altar of the Forgotten Capital.** Cloud, Tifa and Barret against the boss at the end of Disc 1: her Water magic and Aqualung, the Reflect she raises after the first spell
  that hits her (spells turn back on whoever cast them; blows and Limit breaks go through), Earth her weakness, Water healing her, her 300 MP the only budget she has. New in the FF7 engine: Reflect, Barrier, MBarrier and Regen, Materia levels from AP, Limit Levels 2 and 3, a third
  member. The plate, Tifa's and Jenova's paintings, the music and the scenes are stand-ins and owed.

## 10. Owed, and open questions for Bailey

1. **The end-state picks** (hard rule 9): the altar's framing (the preflight's options a to c), Jenova's look (A, B or C), the scene format (J10) and the music. No mockups were made in this lane.
2. **Fergusson's Battle Mechanics**, six questions (note section 11): Reflect's life, the bounce target, the unaffordable pick, the counters on a miss, the armour MD%, the Hi-Potion row. About fifteen minutes with a browser; each is one labelled constant.
3. **The browser runs** of section 7, and a screenshot set under `docs/screenshots/ff7-jenova-life/`.
4. **Row 56 (Safer Sephiroth)** reuses this kernel (statuses, Reflect, Limits, the third member); its first slice is the same bench method.
5. **`NOW.md` and the CHANGELOG were not touched** (parallel lanes; the integrator's commit).
