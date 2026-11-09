# Belgemine's Challenge: Yuna's eight aeon duels at the Remiem Temple (hidden Chapter 45, FFX only; the typed word `sidequest`)

**Status (2026-11-09, lane `ch-belgemine`, built by a Sonnet sub-agent for the release driver): a finished, HIDDEN chapter, data to door, on the real engine, with its tests, bench, tactic and guide; branch `ch-belgemine` (from `origin/main`, merged up to `bc93b1fdd`), pushed; nothing deployed, nothing listed on the board, no production build; a headless browser smoke passed on desktop and phone landscape (section 8).** Tip: the head of branch `ch-belgemine` (`git log -1 ch-belgemine`).

**Authority (relayed by the driver, verbatim):** Bailey, 2026-11-06 ~00:30 EST "implement all unimplemented chapters please" and ~00:55 EST "yes on all these too"; 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick below (section 3) is the driver's, taken under that delegation, **his to overturn**; each names its alternative.

**Game case: FFX only** (AGENTS.md rule 14). Belgemine, the Remiem Temple, the eight aeons and CTB are FFX's (`research/re-ffx-belgemine-aeon-duels.md`, from the game's own files). Nothing here applies to FFX-2 or FF7. The shared plumbing (one row in each registry, one door row, one scene row, one setup call) is "both" in kind, additive and inert for every other chapter (CHK-020); `tests/unit/chapters/belgemine-absence.test.ts` pins that no other formation gets the chapter's scripts, flags or gauges.

**Sources:** the paper preflight `docs/plans/ch-belgemine-review.md` (committed `d56053b5d`) and the research note `research/re-ffx-belgemine-aeon-duels.md` (the stat block each script writes, the turn scripts, the rows). **Rule 6:** every enemy number is the note's, `[R]`/`[H]`; the party's numbers are `[estimate]` (the sources give none), declared as such in `data/ffx/builds/belgemine.ts`. **No enemy number was ever tuned.** Two behaviours are estimates and are labelled so in the code and in section 3 (Yuna's command list in a duel; the forced-action word of seven bodies left unmatched): see section 7, item 1b.

## 1. What the chapter is

Yuna alone, with all ten aeons, against Belgemine's eight aeons one after the other, in the game's order, with no menu between. In each act the aeon the enemy holds is **locked** on Yuna's menu (the mirror; the Sisters lock all three of hers), her menu is Summon and Grand Summon only (an aeon duel, `aeonsOnly`), a loss retries the act (`checkpointOnEntry`), and every act after the first opens on Yuna and every aeon whole (the bag and the Overdrive gauges carry).

| Act | Duel (`lmyt01_0n`) | Foe(s) and HP | Habit the script writes (our guide card says it in words; the numbers are the HUD's) |
|---|---|---|---|
| 1 | Valefor (`_00`) | Valefor 20,000 | a magical hit wakes her Energy Ray; a physical hit does not |
| 2 | Ifrit (`_01`) | Ifrit 28,000 | answers a physical hit with Meteor Strike; Hellfire when his gauge fills |
| 3 | Ixion (`_02`) | Ixion 30,000 | braces and evades about half his turns (a gauge bonus the guides never print), charges Thor's Hammer |
| 4 | Shiva (`_03`) | Shiva 20,000 | Heavenly Strike, Diamond Dust; gauge on HP damage |
| 5 | Bahamut (`_04`) | Bahamut 35,000 | five quiet turns, then Mega Flare; answers with counters |
| 6 | Yojimbo and Daigoro (`_05`) | Yojimbo 32,000, the dog untargetable | the Cavern Yojimbo's gauge bands with Remiem's +2/+3; Zanmato |
| 7 | Anima (`_06`) | Anima 54,000 | grows angry only when hit; Pain kills outright, Oblivion |
| 8 | The Magus Sisters (`_07`) | Mindy 20,000, Sandy 35,000, Cindy 48,000 | Cindy guards them all every seventh turn; when all three burn, Delta Attack; Cindy first |

Belgemine stands on the field untargetable, off the turn list and no part of the victory (her script clears all three flags); each aeon's first turn is its own Summon, aimed at her. The chapter pays **no AP, no gil, no drops** (every reward in the game is a script item, not modelled: U4 in the note).

## 2. What was built (all FFX only)

| Layer | Files |
|---|---|
| Ids (no imports) | `src/data/ffx/belgemine-ids.ts` (the eight acts, the script ids, the row map, the flags) |
| Data | `src/data/ffx/enemies/belgemine.ts` (the stat blocks, bodies, eight formations), `.../belgemine-abilities.ts` (**21 new rows**, 14 reused ones; the records pinned word for word to the shipped command tables), `src/data/ffx/builds/belgemine.ts` (the party: three tiers), `src/data/chapter-belgemine.ts`, `chapter-meta-belgemine.ts` |
| AI (the script of each duel, draw for draw with the note's harness) | `src/battle/ffx/ai/belgemine-rules.ts` (setup, gauges), `belgemine.ts` (Valefor, Ifrit, Ixion, Shiva, the bystander), `belgemine-b.ts` (Bahamut, Yojimbo, the dog, Anima), `belgemine-sisters.ts` (Mindy, Sandy, Cindy) |
| Story | `src/story/scripts/belgemine.ts` (a DRAFT for Bailey to read, our own words: nine lines before, six after; Belgemine is narrated because no `SpeakerId` exists for her) |
| Stage | `src/scenes/belgemine.ts` (the Mushroom Rock Road stage on the Cavern of the Stolen Fayth's plate, Belgemine and her aeons staged) |
| Door | `src/app/screens/frontend/sidequestDoor.ts` (the word `sidequest`), the `CHAPTER_DOORS` row |
| Tactic and guide pair | `src/engine/tactics/belgemine.ts` (the line: ten bosses), `src/data/guides/belgemine.ts` (card), `src/data/guides/docs/belgemine.ts` (page, one head per duel) |
| Registrations (shared, additive) | `docs/CONTRACT-CHANGES.md` (the 2026-11-09 entry lists every one) |
| Tools | `tools/belgemine-bench.mjs` (prints the bench table, the same harness the test pins) |

**Layering held** (hard rule 1): the scripts import no DOM and no `three`; the draws are the seeded streams. **No engine kernel file changed** (the duel machinery, the mirror lock and the restores were already in the tree); the one battle-layer edit is a call in `dark-aeons-setup.ts` that returns at once for any other group.

## 3. The picks (BD1 to BD10 of the preflight, as built; each is the driver's call, his to overturn)

| # | Pick as built | Alternative (one change away) |
|---|---|---|
| BD1 Scope | **The eight Remiem duels only.** The three field duels (Mi'ihen, Moonflow, Calm Lands) need three different parties and the engine has one party build per chapter | a per-act party seam (about 4 h, additive) and three small presets; the note's rows for those duels are in `research/` |
| BD2 Party | **The `'sin'` tier**: Chapter III's Yuna (HP 5,130) and the canonical "inside Sin" block for all ten aeons (the last sourced block, `[estimate]` Yuna). **This differs from the preflight's recommendation (the Zanarkand tier)**: the bench measured Zanarkand as a wall (4 to 8 percent for the whole chain), so the shipped tier is the sourced one that can be beaten | `BELGEMINE_TIER = 'zanarkand'` (a wall) or `'endgame'` (a walkover); one constant |
| BD3 Seams | HP and MP restored at every act's entry (Yuna and all aeons whole); **gauges and the bag carry**, as a Save Sphere does not touch a gauge | reset each act to the preset's gauges (an engine seam, small); or no heal |
| BD4 Aeons | all ten owned from the start; the held aeon locked per act | gate Anima, Yojimbo and the Sisters behind the game's items (not modelled) |
| BD5 Loss | the chain's ordinary loss and retry from the act (`checkpointOnEntry`); the card says "a lost duel costs nothing" | restart the whole gauntlet |
| BD6 Script text | **follow each script exactly**, odd ones included (Anima never fills her own gauge; Ixion's brace bonus); the guide card says so in plain words | none: a boss-side change needs a measured option and Bailey's yes |
| BD7 Art | the player's aeon paintings unchanged on both sides; the Cavern plate as the stand-in court; Belgemine's figure owed | the Isaaru-style tint for the enemy side (11 recolours) |
| BD8 Music | stand-ins: battle `boss-isaaru`, victory `victory-ffx` (rule 13: Bailey judges from the audition page) | `boss-challenge` |
| BD9 Id, number, word | `belgemine`, **45**, **`sidequest`** (the door rule checked in the plan's pool; the natural word `belgemine` fails it) | `contest` |
| BD10 "Send her" | a closing line in the post scene, no mechanic | a yes/no choice with a mock reward |
| Yuna's menu in a duel (**an estimate, not in the note**) | Summon and Grand Summon (and Dismiss, Defend): `aeonsOnly` greys her foe-aimed rows, and `commandDisables` (`BELGEMINE_COMMAND_DISABLES`: Switch for everyone; her Attack, Item, Weapon, Armor, Skill, Special, Black Magic, White Magic) greys the rest. **The note's source block says the `lmyt01` formation scripts are camera only, so the list is not read from them**: its basis is the guides' "Yuna can only summon" and Chapter XIV's contest list as the pattern. **No `defendOff`** (the Isaaru formations' `setDefendingEnabled(0)` has no Remiem source), so Defend stays on offer | change the one list in `data/ffx/enemies/belgemine.ts` after a read of the Remiem event package |
| Forced-action word (rule 6) | five bodies carry 0x0000 because their monster files (m254, m284, m287, m288, m266) are already matched in `forced-action-table.ts`; **Ixion, Shiva, Anima, the three Sisters and Belgemine are unmatched** and keep the generic Attack (all are immune to Berserk, Confuse and Provoke, the only readers of the word) | match the files in the private census |

**The tactic's options, each measured** (section 4): Cindy first (shipped), a Grand Summon when the gauge is full (shipped), Shield before a big move (shipped), wait out a guard (shipped), prefer a charged Overdrive (shipped), **no Dismiss** (shipped: measured counterproductive), **a plain Summon, not a Grand Summon, against Anima** (shipped: the Grand Summon there is the worse opening, 88 of 100 against 100). Two options were measured and left OFF: Dismiss (87 percent of the chain) and holding every Overdrive against Anima (63 percent).

## 4. The bench of record (100 seeds a cell; measured, never tuned)

The harness is `tests/unit/helpers/belgemineDrive.ts`; `tests/unit/chapters/belgemine-bench.test.ts` pins it and prints these tables; `node --experimental-transform-types tools/belgemine-bench.mjs --seeds 100 --tiers` prints them again. A line is a plan among the party's own commands (the **advisor** is the shipped tactic, the **careless** line only Attacks); the lever is the party tier. Seeds 1 to 100.

**Every duel on the shipped tier (the `'sin'` tier), the shipped line against the careless one**

| Duel | Shipped line | Careless | Shipped: aeon KOs a duel |
|---|---:|---:|---:|
| Valefor | 100 / 100 | 100 / 100 | 0.0 |
| Ifrit | 100 / 100 | 100 / 100 | 0.1 |
| Ixion | 100 / 100 | 100 / 100 | 0.0 |
| Shiva | 100 / 100 | 97 / 100 | 0.0 |
| Bahamut | 100 / 100 | 100 / 100 | 0.0 |
| Yojimbo | 100 / 100 | 90 / 100 | 0.0 |
| Anima | 100 / 100 | 100 / 100 | 0.9 |
| The Sisters | 100 / 100 | 55 / 100 | 2.9 |
| **the chain** | **98 / 100** (lost in act 8: 2) | 50 / 100 (lost in act 4: 3, act 6: 9, act 8: 38) | |

**The party is the lever (the chain, 100 seeds)**

| Tier | Shipped line | Careless |
|---|---:|---:|
| `zanarkand` (the preflight's recommendation) | 8 % | 1 % |
| `sin` (**shipped**) | 98 % | 50 % |
| `endgame` | 100 % | 100 % |

**What each piece of the line is worth (the chain, shipped tier)**

| Line | Chain wins |
|---|---:|
| Cindy first (shipped) | 98 % |
| the weakest Sister first | 79 % |
| no Grand Summon at all | 99 % |
| no Shield before the big move | 98 % |
| Dismiss an aeon under a third of its HP | 87 % |
| Anima not owned | 0 % |
| Grand Summon against Anima too | 98 % (Anima's duel alone: **88** of 100, against **100** with the plain Summon the line plays) |
| no Overdrive against Anima | 63 % (the loss moves to the Sisters) |

**Reading it, honestly:**

1. **Neither of the Mirror Aeons precedent's bands is met exactly** (the advisor's line 60 to 80 percent for the chain, a careless line under 20). The shipped tier is above the band on both: the advisor here is a near-perfect player and the careless line one that thinks of nothing, so a real player falls between the two. The three tiers are the only lever the sources allow (the guides' one statement is that the difficulty "depends solely on how well you built Yuna"); the tier below is a wall and the one above a walkover, so the shipped tier is the nearest sourced block to the band, not a tuned one.
2. **The first six duels are trivial for any line** on the shipped tier (the careless line wins them nearly all); the chain's difficulty is the **Sisters** (the careless line loses about half of them) and, for the advisor, two runs in a hundred there too. **Anima's duel is won on every seed by both lines**, but it kills about one aeon a duel (Pain kills outright, her gauge is fed by every hit).
3. **A finding that changed the line:** the first draft of the shipped line opened every duel with a Grand Summon. Against Anima that was worse than doing nothing clever: 88 of 100 for the line against 100 for a line that only Attacks, because the Grand Summon's ready Overdrive pours many hits into her hit-fed gauge (+5 a hit, RE 3.11). The line now opens Anima's duel with a plain Summon (`noGrandSummonVs`, measured: 100 of 100, the chain unchanged). Holding every Overdrive against her too (`holdOverdriveVs`) was measured and rejected: her duel is no better and the chain falls to 63 percent.
4. **Cindy first is the line's one big piece:** the weakest-first line loses nineteen points of the chain. **Anima in the party is the other:** without her the Sisters are not beaten (0 percent).
5. **Dismiss is counterproductive** (87 against 98), so the tactic never plays it; **the Grand Summon matters little elsewhere** (99 percent without it).
6. `unfinished` is zero in every duel cell: no duel stalls on any seed.

## 5. Art list (what is a stand-in, what is owed; nothing was written into `public/art/` or the mirror)

| What | State | Notes |
|---|---|---|
| The eight enemy aeons and the dog | **existing approved paintings**, unchanged (Valefor, Ifrit, Ixion, Shiva, Bahamut, Yojimbo of the Cavern, Anima, Mindy, Sandy, Cindy, Daigoro) | BD7; the tint alternative is 11 recolours |
| Belgemine's figure (`belgemine`, the sprite key on her body) | **OWED.** No painting exists; until it does the painted actor draws the engine's procedural placeholder figure (a stand-in, by design) | the art lane pilots her and Bailey looks before anything else (the pose-recipe lesson); the staging spot is at the left and behind the boss spot |
| The court (`remiem-temple` plate) | **stand-in:** the Cavern of the Stolen Fayth's approved plate (every formation names it; `SCENE_BACKDROP_FILE` maps the scene key to it) | the preflight's recommendation: derive `remiem-temple` from it (an inner temple chamber, open sky at the top; prompt and seed saved; replaces no approved painting) |
| The pause plate `pause/ch45-belgemine` | **owed**; `heroArt` uses the Cavern plate meanwhile | |
| The ladder HUD chip (preflight E5/T5, option A: eight crest pips, an act banner) | **NOT built.** It is a new screen element and needs the end-state mockup and Bailey's pick (hard rule 9) before it is integrated; the intent-board lines are the guide card (built); the first menu's screenshot shows no act count, so the chain HUD does not print one for this chapter (section 8) | the mockup lane |
| Music | stand-ins (BD8) | rule 13: Bailey auditions |

## 6. Tests, and what the integration touched

New (all pass): `tests/unit/chapters/belgemine-{data,ai,engine,bench,door,scene,story,absence,guide,tactic}.test.ts` and the helper `tests/unit/helpers/belgemineDrive.ts`. What they pin: the data to the note field by field (and the 21 records to the shipped command tables); each script against the note's harness draw for draw; a seeded engine run of each duel on three seeds and of the chain; the winnability bench (100 seeds a cell); the door with the real `Input` and the real board; the stage; the story lint and voices; the absence of the chapter's machinery from every other formation; the card and page against the data; the tactic's rules on the real engine.

**The full suite** (`npx vitest run --maxWorkers=3`, run twice, before and after the integration fixes below): the final run is **2,171 files: 2,138 passed, 1 failed, 32 skipped; 34,657 tests: 33,899 passed, 7 failed, 750 skipped, 1 todo** (3,654 s). `npx tsc --noEmit` is clean; `node tools/orphans.mjs` reports 24 orphaned modules, none this chapter's (the same 24 as the base: the audio presets, `sprites/` templates and so on).

**The one failing file is not this lane's and is environmental: `chapters/r78-boss-art-resolves.test.ts` (7 tests).** This worktree's `public/art` is a link to the older art mirror `r64`, whose manifest has no `spherimorph`, `ultima-weapon`, `omega-weapon` or `nemesis` subject; run with `BOSS_ART_ROOT` set to the r78 mirror it passes 10 of 10 (run here). It touches no file of this chapter.

**The first full run had 10 failing files (16 tests): that file's seven, and nine shared pins that did not yet know the chapter. Each is fixed by teaching the pin the chapter, nothing loosened:**

| Shared test | What it pinned, and what changed |
|---|---|
| `data-ffx-command-records` | the abilities and records count: `ROWS_SINCE_KEEPER` gains `['belgemine', 21, 21]` |
| `re-parity-ai-evrae` | its fixture must hold every shipped record: `tests/fixtures/parity/ffx/evrae-gaze-classes.json` gains 20 rows, each class read from the game's command table (`command_records.json`'s formula byte); and Cindy's Mighty Guard needs `0x40de: 3` in `FORMULA_BYTE_OVERRIDES` (a status row of ours with no formula, as Penance's arm's) |
| `scene-backdrop-file` | the set of code-keyed scenes, and the plate each stands for |
| `engine/party-stature-chapters` | the hidden FFX chapters scaled like the listed ones: `belgemine` joins |
| `r62-auron-turn-order-tip` | every FFX chapter is accounted for: `belgemine` is in NO_LINE (no "he moves after you" line is claimed: the line was not engine-checked for these duels) |
| `audio-music-batch1` and `-batch2` | who plays `boss-isaaru` (Chapter XIV and now this chapter's eight duels) and each chapter's bed and cues |
| `parity-ffx-loot-data`, `parity-ffx-engine-loot-battles` | the bodies with no loot record: the chapter's twelve (it pays nothing) |
| `parity-ffx-isaaru-commands` | the groups that carry `commandDisables`: the eight formations join |
| `parity-ffx-default-attack` | the forced-action word table: five of the chapter's bodies are matched (their monster files were); the other seven are listed as unmatched, not invented |
| `guide-link-title` and `guide-doc` | the guides with link titles (the chapter joins); and one number a line on a page's HP (the Sisters' page prints one line per body) |
| `chapters/exp-fayth`, `experiment-flow` | the hidden scenes' side table (a last row); the formations that set `noSaveSphereCard` (acts 2 to 8) |
| `chapters/isaaru-duel`, `chapters/yojimbo-engine` | the formations that carry a duel rule (`aeonsOnly`, `lockedAeons`: the eight join Chapter XIV's); the ordering rows (a third, the dog's bite) |

The door pair test took 460 s under the suite's load against its 1,120 s allowance (28 doors at 40 s); nothing was raised.

## 7. Open issues (none blocks the hidden build; each is for the driver or Bailey)

1. **Belgemine's painting and the Remiem plate are owed** (section 5), and the **ladder HUD chip** needs a mockup and Bailey's yes first.
1b. **Two things in the data are estimates, not the files' numbers** (section 3's last two rows): Yuna's command-disable list in these duels, and the party preset (`[estimate]` by the project's rule). A first draft of this lane cited the research note for the disable list and for a Defend-off flag; **neither is in the note** (it says the formation scripts are camera only), so the Defend-off flag was removed and the list was relabelled as an estimate before this was committed.
2. **Difficulty is not in the Mirror Aeons band** (section 4). The honest figures are printed; the lever is `BELGEMINE_TIER`; no enemy row moved. A different band is Bailey's call, and the options are measured above.
3. **Anima's Pain is a kill risk** (about one aeon lost a duel, though every seed is won), faithful to the script (RE 3.11); the guide card names it. A softer Anima would be a boss-side change and needs a measured option and Bailey's yes.
4. **Unmodelled, flagged in the note:** the first-win and retry reward items (U4); the formation flag words that make a loss "player escaped" instead of a game over (U2; the chain's ordinary loss stands in); the stage ids (U3; the plate stand-in); Remiem Ixion's second call queues two commands in the game's script (U1; one command is run and flagged in the AI test); a dormant Sister flag.
5. **BD1's three field duels** (Mi'ihen Ifrit at 3,000 HP in the file against 3,500 in the guides, Moonflow Ixion, Calm Lands Shiva) are not built; settle the Ifrit figure by a Scan on the owner's Steam copy if BD1 is overturned.
6. **Story and music are drafts/stand-ins** for Bailey to read and hear (rule 13).
7. **No production build and no deploy** (this lane builds nothing and ships nothing); the browser smoke of section 8 ran on a dev server.
8. **NOW.md is left to the integrating driver** (several lanes edit it; this lane touched only its own handoff and the shared contract log). The case for the changelog line: FFX only; the chapter is hidden, so a player sees nothing until the word is typed.

## 8. The browser smoke (run: PASS, desktop and phone landscape)

`tools/belgemine-smoke.mjs`, headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`), one job under the review-browser lock, against a dev server this lane started on port 5190 and stopped by its PID afterwards. On the software renderer the battle never reached its first menu in 120 s (a control run of the Penance chapter, same environment, did not either); on the GPU both sizes pass every check: the board has no card for the chapter; the word `sidequest` opens party prep (`EXP · BELGEMINE'S CHALLENGE — REMIEM TEMPLE`, Yuna alone at S.LV 175, three objectives and the tip); the pre scene plays on the Cavern plate; the first menu shows Belgemine's figure (the engine's placeholder, a lantern shape), Valefor on the Cavern plate and Yuna alone; the guide card (the **AEON DUEL** tag, HP 20,000, our words) and the NEXT BEST MOVE panel read Grand Summon; the Summon list opens with VALEFOR dimmed above IFRIT; no page errors and no 4xx. Screenshots: `docs/screenshots/ch-belgemine/desk-0` to `desk-4` (1600 by 900) and `phone-3-first-menu.jpg` (844 by 390, touch).

**Not covered:** playing a duel by keys, the pause plate, the results page, audio (Bailey's ear). The duels and the chain are proved on the real engine by the tests and the bench instead.

**Seen on the screen, for the driver:** (1) at 844 by 390 the guide's HIDE GUIDE row and the NEXT BEST MOVE panel overlap: shared HUD layout at phone landscape height, not this chapter's, and not checked against another guided chapter; (2) the first menu's cursor starts on the greyed Special group, so the first Enter opens a list of dimmed rows (Scan, Pray) while the useful rows, Overdrive (Grand Summon) and Summon, are two and three rows down; whether Chapter XIV's contest behaves the same was not checked; (3) the objectives read "Win the first duel", "Reach the fifth duel", "Win the last duel".

## 9. Resume

`git log ch-belgemine`; `npx vitest run tests/unit/chapters/belgemine-*.test.ts`; `node --experimental-transform-types tools/belgemine-bench.mjs --seeds 100 --tiers`. To change the difficulty, change `BELGEMINE_TIER` in `src/data/ffx/builds/belgemine.ts` (never an enemy row) and re-run the bench; to list the chapter on the board, Bailey's word is needed (BD9).
