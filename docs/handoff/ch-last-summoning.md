# The Last Summoning: Yu Yevon takes your aeons, in the order you choose (a hidden FFX chapter)

**Status (2026-10-15, built for Bailey, via the release driver):** built, tested and shown in a production build in a headless browser; **not merged and not deployed**. Branch `ch-last-summoning` (from `origin/r49-rc`, with the
reverse-engineering session's note `origin/re-ffx-last-summoning` and its Yojimbo and Sisters engine `origin/re-parity-ffx-yojimbo-sisters` merged), in a worktree of its own (a sibling folder of the main tree). Tip: see the
last line of this file.

**Authority:** Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters ... the most epic encounter ever!!!!!!!!!" and "I'll go with all your recommendations I like the last
summoning" (concept 2 of `aeons-chapter/concepts.md`; the approved target for the new screen is its `frame-2b-offering-menu.png`). The driver's decisions: the chapter ships **hidden behind the typed word `summon`**, hidden
chapter **number 28**, **Chapter III itself stays unchanged (D-651)**, listing it on the board waits for Bailey's word, `public/art` stays on r49 in this tree, the music is existing cues by reference. The paper preflight is
`docs/plans/ch-last-summoning-review.md` (its section 11 says where the build parted from it); the contract entry is the first one of `docs/CONTRACT-CHANGES.md`.

**Game case: FFX only** (AGENTS.md rule 14). Aeons, Summon, the Pay-and-free-attack Yojimbo, the Sisters' orders and the possession chain are FFX's; FFX-2's Yojimbo (the Tourist Trap) and its Sisters (the Fallen Aeons road) are other
fights and nothing here reads them. The shared plumbing (the registry row, the door row, one scene row, the chain loop's optional hook, two optional fields of `EnemyGroupDef` and one on its locks, the presenter's folds for three
aeons out together, the guide and advisor lookups) is "both" (CHK-020), additive and inert for every other chapter: Chapter III's twelve seeds and the 18 FFX goldens do not move (below).

## What Bailey should see first

1. On the chapter board type **`summon`** (S, U, M, M, O, N: S is `down`, M is `select`, the others are bound to nothing; the first S moves the board's cursor one step, as the first letters of two other words do). No card changes: there is none, and the board still says "of 18".
2. Party prep says **EXP** (header "EXP · THE LAST SUMMONING"); the opening plays (eleven lines and the chant: Yuna says "I am saying goodbye."); then **the offering screen**: Dream's End's painting as the ground, Yu Yevon above
   "Yu Yevon reaches for one of your aeons.", eight cards in the game's order (Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo, the Magus Sisters), the panel "IF YU YEVON TAKES ..." and "WHAT YOU LOSE". Left and Right (or A and D)
   choose, Enter gives; a tap focuses and a second tap gives. **What you give up is fought next, as a copy of your own** (the same Strength, Defense, Magic, Magic Defense, Agility, Evasion, Accuracy and maximum HP, at full HP), with
   the two Yu Pagodas, and it is gone from your Summon list for the rest of the chain ("TAKEN"). Nothing heals between battles. After each win the offering comes back with that card crossed.
3. Then the chain goes on for nine battles: eight possessions (the Magus Sisters are **one** battle with three bodies, as the game fights them) and Yu Yevon last, the fight Chapter III has, with all eight aeons gone.
4. **The part to try**: summon your own **Yojimbo** (Summon, Yojimbo: his menu is Aeon, then Pay, which asks how much, in a digit-by-digit panel that opens on the advisor's amount, Escape goes back) and your **Magus Sisters**
   (a Grand Summon brings them in with the three gauges full; their menu then offers **Combine**, which is the Delta Attack: six hits on everything at the front). Look at the possessed **Yojimbo** (a flat 9,999 Zanmato on
   everyone at the front when his gauge is full, Kozuka or Wakizashi otherwise) and at the possessed **Sisters** (Cindy mends and drains and calls the Delta Attack when all three are ready; **fell Cindy first**).
5. Press `G` for the guide card (its page for this chain) and read the move advisor's "NEXT BEST MOVE": for the possessed aeons it is Chapter III's line; in the Sisters' fight it names Cindy; on Yojimbo's turn it names Pay.

## What was built

| Area | Files (all under `src/` unless noted) |
|---|---|
| The chain | `data/ffx/last-summoning-ids.ts` (ids, no imports), `data/ffx/enemies/last-summoning-chain.ts` (formations as a pure function of what has been given up; the locks), `data/ffx/builds/last-summoning.ts` + `last-summoning-roster.ts` (the party and every estimate in one place) |
| The record fixes and the two battles | `data/ffx/enemies/braskas-final-aeon-abilities.ts` and `braskas-final-aeon.ts`, `data/ffx/command-records/enemies.ts` + `index.ts`, `battle/ffx/ai/possessed-aeons.ts` (Yojimbo's coin), **`battle/ffx/ai/possessed-sisters.ts`** (the three scripts, gauges, the token that makes Cindy throw the Delta Attack), `ai/yu-pagoda.ts` (the Power Wave to the lowest-gauge Sister), `ai/possession-setup.ts` (three bodies at the start) |
| The chain loop's hook | `app/screens/BattleEncounterChain.ts` (`choose`, `ChainChoice`, `chainLengthOf`), `BattleScreenSetup.ts` (`findEnemyGroup` resolves the chapter's ids), `BattleScreen.ts` (the wiring and the input forwarding), `BattleScreenOffering.ts` (the chooser) |
| The offering screen | `ui/ffx/offering/` (`OfferingScreen.ts` the overlay, `offeringModel.ts` the pure model, `offeringText.ts` our words, `offering.css`) |
| The player's Yojimbo and Sisters | `ui/ffx/YojimboPay.ts`, `YojimboPayWidget.ts`, `yojimboPayModel.ts`, `yojimbo-pay.css` (the amount panel, wired in `FFXBattleHud.chooseCommand`); the three-aeon folds in `engine/BattlePresenterBeats.ts` (`SISTER_SLOTS`), `BattlePresenterStage.ts`, `app/screens/battlePreload.ts`, `ui/ffx/fieldRows.ts`, `ui/common/phoneFraming.ts`; the TAKEN badge in `ui/ffx/commandMenuRows.ts`; help lines and shorter order labels in `battle/ffx/aeon-commands.ts` |
| Chapter record, pause metadata, registry | `data/chapter-last-summoning.ts` (number 28, `experimental`), `chapter-meta-last-summoning.ts` (EXP, three objectives), one line each in `chapters-experiments.ts`, `chapter-meta.ts`, `encounters.ts` |
| Story | `story/scripts/last-summoning.ts`: eleven opening lines, six closing, one arrival and one fall for each aeon (order-agnostic), our own words, Yu Yevon never speaks, every mid line on an `auto` |
| Stage | `scenes/last-summoning.ts` (a thin derivation of Dream's End's scene: the party and the Pagodas keep Chapter III's staging, the new bodies are added), a row in `scenes/experiment-scenes.ts` and `engine/pyreflyCanon.ts` |
| Guide and advisor | `data/guides/last-summoning.ts` (card), `data/guides/docs/last-summoning.ts` (the page), `engine/tactics/last-summoning.ts`, registered ahead of Chapter III's and found only on this chapter's board (`engine/tactics/lookup.ts#onLastSummoningBoard`); `GuideDoc.onlyWhenFlag`; `advisor-guard.ts` leaves Pay and Combine be |
| The word | `app/screens/frontend/summonDoor.ts` and one row in `chapterDoors.ts` |
| Tests | `tests/unit/chapters/last-summoning-{iii-pin,records,sisters-ai,yojimbo-ai,chain,flow,offering,chapter,bench}.test.ts`, `tests/unit/yojimbo-pay-panel.test.ts`, `last-summoning-presentation.test.ts`, `summon-door.test.ts`, `tests/unit/helpers/lastSummoningDrive.ts`, `ffxChainDigest.ts`; edited (each says why in its header or comment): `chapter-doors.test.ts` (ten words), `gagazet-door.test.ts` (the other words), `audio-music-batch2-2026-10-12.test.ts` (the music table's chapter rows), `engine/party-stature-chapters.test.ts` (the hidden FFX chapters), `exp-fayth.test.ts` (the scene list), `strategy-guide.test.ts` and `strategy-guide-sheet.test.ts` and `guide-link-title.test.ts` (the one shared-id exception), `data-ffx-command-records.test.ts` and `possessed-aeons.test.ts` and `re-parity-ai-possessed.test.ts` and `audio-sfx-parity-pin.test.ts` (the record fixes) |

No source file added is over 400 lines (hard rule 7); the files over 400 that were touched were over it already (`types.ts`, `BattleScreen.ts`, `FFXBattleHud.ts` 1,772 to 1,778, `BattlePresenterStage.ts`,
`braskas-final-aeon*.ts`, `ffx-hud.css`). `encounters.ts` stays at 397. Two of this lane's new test files are over 400 lines (the chapter's, 482, and the door's, 438), as many of the repository's tests are.

## The data, its sources and tags (rule 6: nothing invented)

**Every number of the fights is the game's own**, read from its files by the reverse-engineering session (`research/re-ffx-last-summoning.md`, "RE section n", tagged `[bytes]`/`[static]`) unless this table says
`[estimate]`. The record fixes (RE sections 1.4 and 4), each pinned to the game's own command-record fixture (`tests/unit/chapters/last-summoning-records.test.ts`):

| Record | Before | The file (RE) |
|---|---|---|
| Possessed Yojimbo's strikes | Daigoro, power 10, a plain Attack | **Kozuka 0x60E0 and Wakizashi 0x60E1**, power 14, one target, rank 3, a coin on a random living front-line actor; no Daigoro, no plain Attack |
| Possessed Yojimbo's Zanmato | Death at chance 255 | **fixed 9,999 on each front-line actor**, no status, not a kill |
| Camisade, Razzia | power 30 rank 3; power 28 on all | power 21, **rank 5**, shatter 30; Razzia on one target |
| Delta Attack | power 65, one hit | formula 15 (cube of MAG), power 10, **six hits** on the front line |
| Cindy, Mindy | Camisade, Delta, Curaga; Passado only | **adds Drain** (under two thirds of her HP) and **Flare** (a coin with Passado; on Cindy while she has Reflect) |
| The Sisters | three battles | **one battle, three bodies** (Mindy, Sandy, Cindy), each on her own script; gauges 0 to 9 a turn, 10 to 19 a hit, 30 to 39 more from a Power Wave; the Pagodas' Power Wave goes to the lowest-gauge living Sister and is skipped when that is 100; one dead Sister makes the Delta Attack impossible |
| Zanmato bytes | none | possessed Valefor to Yojimbo 2, the Sisters 3 (the data's `zanmatoLevel` is the byte plus 1), the Pagodas 4 |

**Our estimates, each in one place** (`data/ffx/builds/last-summoning-roster.ts`; labelled there and in the plan): Yojimbo's starting **compatibility 128** (the driver's value: "strongly indicated by the owner's saves,
live confirmation pending") and his **hire answer 1** (the neutral answer; which answer a player gave is in no source); the party's **gil 50,000** (Dream's End's own estimate); each Sister's starting **motivation 50** (the middle of
0 to 100; the engine says UNSOURCED); the five extra aeons' **starting gauges 0** (the five story aeons' are `ffx-seymour-flux` §7.9.2's); the five extra aeons' **stats** (inside Sin's block, `ffx-combat-core` §6.4.3, N = 360,
estimates in that note's own sense); the stage spots and heights of the bodies Chapter III never fields; the words of the offering, the card, the page, the story and the Pay panel; **the advisor's payment rule** (the smallest
power of two that reaches a motivation of 63, derived from RE 8.1 point 4, for hire answer 1) and **the order it calls aeons in** (Bahamut, Anima, the Sisters, Ixion, Shiva, Ifrit, Valefor, Yojimbo).

**Not built from the file, said plainly:** how Sandy and Mindy enter play in the real battle (RE section 9 item 6: untraced; all three stand from the first turn here); the helper actor and the Sinscale stand-in (they never
act and are not targetable); the raw properties 295, 296, 217 and 238; the player's Sisters' **other seven orders** (the RE session's engine has only Combine; the rest are listed and greyed, so a Sister whose menu does not
offer Combine can only be sent away) and Yojimbo's menu beyond Pay and Dismiss (their open question 3).

## Chapter III is byte for byte what it was (decision D-651)

`tests/unit/chapters/last-summoning-iii-pin.test.ts` plays Chapter III's whole chain on **twelve seeds** with the chapter's own line and hashes every link's complete event log (SHA-256, 16 hex characters) and its outcome.
It was **recorded before any change of this lane** (on the merged tree), and the same file passes **after** all of it (13 of 13: twelve seeds and the one digest of the whole table, **`a26660257ba2716c`**).
Eleven seeds are a seven-link victory; seed 3 is a defeat on link 1 (the line is not tuned, and nothing here is a balance measurement). `tests/unit/ffx-engine-golden.test.ts` (the 18 FFX goldens), `possessed-aeons.test.ts` and
`re-parity-ai-possessed.test.ts` pass as well. A digest that moves is a change of Chapter III to explain, never a number to re-pin.

## The bench (what the chain is like to play)

`tests/unit/chapters/last-summoning-bench.test.ts` plays the whole chain on the real engine, link by link, in five orders (the offering's own, its reverse, Yojimbo and the Sisters and Anima first, two shuffles) over
24 seeds each (`PYREFLY_BENCH_SEEDS=<n>`; the suite runs 4), with the chapter's own line and with a naive one (a swing on the first target, nothing else). **Nothing is tuned** (the fight's numbers are the game's and
Chapter III's); the figures are what the chain does. "Aeon standing" is the share of links that ended with one of the player's aeons on the field (only the advisor's line calls any); "party down" is always 0.0 because
the fayth's Auto-Life stands a fallen friend up at once (it revives at a quarter of HP).

**The chapter's own line (the advisor).** All five orders together, chains 120, won 100%, links fought 9.0 of 9 on average; first loss at: none:

| link | fought | won | turns | ticks | party down | aeon standing |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 120 | 100% | 32.6 | 167.0 | 0.0 | 4% |
| 2 | 120 | 100% | 37.9 | 204.2 | 0.0 | 15% |
| 3 | 120 | 100% | 25.5 | 141.0 | 0.0 | 8% |
| 4 | 120 | 100% | 38.4 | 194.1 | 0.0 | 16% |
| 5 | 120 | 100% | 28.0 | 136.3 | 0.0 | 11% |
| 6 | 120 | 100% | 24.7 | 128.4 | 0.0 | 0% |
| 7 | 120 | 100% | 11.1 | 56.3 | 0.0 | 0% |
| 8 | 120 | 100% | 25.5 | 124.8 | 0.0 | 0% |
| 9 | 120 | 100% | 8.2 | 54.0 | 0.0 | 0% |


Per order:
- offering order: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none
- reversed: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none
- yojimbo, sisters, anima first: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none
- shuffle 1: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none
- shuffle 2: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none

**The naive line (a swing on the first target, nothing else).** All five orders together, chains 120, won 75%, links fought 7.8 of 9 on average; first loss at: sisters x30:

| link | fought | won | turns | ticks | party down | aeon standing |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 120 | 95% | 54.2 | 330.1 | 0.0 | 0% |
| 2 | 114 | 96% | 68.1 | 412.1 | 0.0 | 0% |
| 3 | 109 | 100% | 25.0 | 145.5 | 0.0 | 0% |
| 4 | 109 | 94% | 75.8 | 449.7 | 0.0 | 0% |
| 5 | 103 | 94% | 68.8 | 408.2 | 0.0 | 0% |
| 6 | 97 | 100% | 30.0 | 162.9 | 0.0 | 0% |
| 7 | 97 | 100% | 10.3 | 58.6 | 0.0 | 0% |
| 8 | 97 | 93% | 76.4 | 465.4 | 0.0 | 0% |
| 9 | 90 | 100% | 12.1 | 67.7 | 0.0 | 0% |


Per order:
- offering order: chains 24, won 71%, links fought 8.7 of 9 on average; first loss at: sisters x7
- reversed: chains 24, won 75%, links fought 7.0 of 9 on average; first loss at: sisters x6
- yojimbo, sisters, anima first: chains 24, won 79%, links fought 7.5 of 9 on average; first loss at: sisters x5
- shuffle 1: chains 24, won 75%, links fought 8.0 of 9 on average; first loss at: sisters x6
- shuffle 2: chains 24, won 75%, links fought 7.8 of 9 on average; first loss at: sisters x6

**What the numbers say.** The chain is nine battles; a link takes a few turns to about a hundred. **The advisor's line wins all 120 chains** (24 seeds in each of five orders), and the Sisters' fight is the longest link in
every order (three bodies, 17,000 HP between them, Cindy's Drain and Curaga and the Pagodas' 1,500 a Power Wave against a party that hits for 500 to 900): 69 to 97 turns on average in the five orders, against 5 to 67 for the
single aeons. **A plain swing wins 90 of 120 and loses the other 30, every one of them at the Sisters** (the engine's stalemate watch calls "The battle cannot be won from here", `escape`), most often when they come last and
no aeon is left to call. The line fells **Cindy first** for exactly this reason, and it was measured rather than argued: aimed at the weakest first (Mindy, then Sandy) the party left Cindy alone, draining as fast as it hurt her,
and the same bench won 105 of 120 (the Sisters last: 19 of 24; second: 21 of 24); aimed at her first it wins 24 of 24 in both orders in about a third of the turns (69 turns on average for the Sisters last, against 219; 74 for the Sisters second, against 214). The aeons the line calls (about one link in ten, up to
seven in ten in a few orders) are the roster's use, not a need. **None of this tunes a number of the fight**; it is what the advisor's line does with them.

## What was observed, and is disclosed (not defects of this lane)

- **The possessed Sisters' and Yojimbo's blows are large against Dream's End's party** (Camisade is capped at 9,999 on a 6,492-HP Tidus: the file's power 21 against the copy of the player's Strength 82), so a party member is
  knocked out by many a blow and the fayth's Auto-Life stands him up at once (a quarter of his HP, 1,623 for Tidus). Nobody is ever "down" at the end of a link in the bench for that reason, and a **petrified** party is the only way
  to lose a link by being beaten. The party is Dream's End's estimate (Chapter III's), not this chapter's.
- **Sandy's Haste on a Cindy who holds Reflect bounces onto the party** (the engine's own rule for a reflected buff), and Mindy's Flare through Cindy's Reflect reaches the front line, as the file says (RE 6.2).
- **The stalemate**: see "What the numbers say". The shared watch ends such a battle as `escape`, so the chain ends on the results screen; there is no checkpoint (only the Sin links have one), so a retry starts at the offering.
- **The cursor skips a greyed row** in the Summon list (every FFX menu does), so a taken aeon's reason could not be read; it says **TAKEN** on its row instead.
- **Yojimbo's tile is the ink monogram** ("Y") on the turn rail and in his status row, as in every chapter that has him: the game keeps the navy painting out of the portrait chips (D-054). The Sisters' tiles are crops of their idle paintings.
- **The first-time tutorial hints** of the battle HUD ("He moves after you...", "Call the aeon...") appear in this chapter as in every other; the frames dismiss them.
- **Skip speed** gives the first held aeon at every offering (a run nobody watches never parks on it).

## Art

**No painting is new.** Dream's End presents its possessed aeons from the player's own paintings (`possessedAeonEnemyDef`: the spriteKey is the aeon's own, no tint, no shader), and the same holds for Anima, Yojimbo and the three
Sisters (`characters/anima`, `yojimbo`, `cindy`, `sandy`, `mindy`, all in r49; the Sisters' are tagged FFX-2 only and their design matches the FFX description). Gaps, disclosed: the possessed Yojimbo has no hurt or KO painting (the
presenter holds the idle), Mindy has no attack painting, no Sister has a portrait (the turn rail crops the idle), and a **possessed look** for the paintings would be an addition for Bailey's yes (rule 10), not built.

**The one new file is a plate copy**, because every derived scene draws `backdrops/<sceneKey>.png` on the 2D screens (the cutscene and party prep): `backdrops/last-summoning.png` (a byte-for-byte copy of Dream's End's) and its
sidecar, installed as **new files in the r50 mirror** with `node tools/gen/manifest.mjs --root=<r50>` regenerating its `manifest.json` (one entry, `"last-summoning"`). **r49 is unchanged**: a listing of every file of r49
(5,346 files: path, size, modification time) and the SHA-256 of its `manifest.json` are identical before and after this lane's work (list hash `49752badd...`, manifest `6349dcc5...`); r50 gained exactly the two files and the
regenerated manifest. **In this tree `public/art` stays on r49** (the driver's rule), so the build shows the **fallback** where the 2D screens want the plate: the cutscene's ground is black. (Party prep's hero is Yu Yevon's portrait, the fallback for the pause hero art `pause/ch28-last-summoning`, which is not made in any tree.) The battle, the offering and every battle HUD frame are unaffected (they draw `dreams-end`). The frames marked "plate" were taken against the dev server with a small private config that serves r50's manifest
and that one plate (a scratch file, deleted); the others are the production build itself. The final art frames come from a tree that points at r50.

## Proof run (what was run, and what it said)

- `node node_modules/typescript/bin/tsc --noEmit`: clean. `node tools/orphans.mjs`: 28 modules nothing imports, **none of this lane's** (the same legacy ones: audio presets, sprite templates, ...).
- The chapter's suites: records (14), Sisters' AI (31), Yojimbo's AI (8), chain (23), flow through the real chain loop (6), offering (25), chapter (36), presentation (5), Pay panel (17), door (21 + the ten-word table), Chapter III's pin (13),
  the 18 FFX goldens, the possessed-aeon and command-record suites. All of them pass in one run together with the neighbours this lane edited (the door, strategy-guide, command-record, SFX-pin, hidden-scene and chapter-number suites): 24 files, 383 tests, the bench in that run at 4 seeds per
  order. **The full unit suite** (`npm test`, 1,279 files, 20,199 tests, about 77 minutes) was run once while the lane was still editing: 7 tests in 5 files failed, each accounted for: three in the chapter's own test (the run overlapped the commit that
  moved the card, the page and the advisor to Cindy first; the file passes now, 36 of 36), three pinned lists that did not yet name the new chapter (`gagazet-door.test.ts`'s list of the other door words, the batch-2 music table's
  chapter rows, `party-stature-chapters.test.ts`'s list of hidden FFX chapters), each given one row in its own commit, and `advisor-noop-guard.test.ts`'s Seymour Flux row, which timed out under that load and passes alone in 40 seconds.
  The second full run, on the final tree: running when this note was written (the next commit says).
- A production build on the build drive (`vite build`, `BASE_PATH=/`, from PowerShell; the `prebuild` manifest step was **not** run because it would write into r49), served with `vite preview`, driven by headless Chromium
  (`PYREFLY_BROWSER=gpu`) with real key presses (from the title and the word to the first fight, then through the chain): the word opens the chapter; party prep; the opening; the offering at 1600x900 and 390x844; a link; the
  Summon list with TAKEN; Pay; the Sisters called, Combine lit and the Delta Attack playing; Dismiss bringing the party back; and one run in which the advisor's line fights the whole chain to Yu Yevon's fall and the results screen at skip speed (9 links, "INSIDE SIN - DREAM'S END - CLEARED"). No page error and
  no console error; the warnings are the shader compiler's note and, once at skip speed, the presenter's "an actor animation did not finish ... carrying on".
- **Frames** (`docs/screenshots/ch-last-summoning/`, 1600x900 desktop and 390x844 at 2x phone): 
  - desktop: `1600x900-party-prep.jpg`, `1600x900-cutscene-fallback-plate.jpg` (the build itself: r49 has no plate for the chapter, so the ground is black), `1600x900-cutscene-with-r50-plate.jpg` (the dev server with r50's plate),
    `1600x900-offering.jpg`, `1600x900-offering-yojimbo-focus.jpg`, `1600x900-offering-three-taken.jpg` (round four: Valefor, Ifrit and Ixion crossed out), `1600x900-possessed-yojimbo.jpg`,
    `1600x900-possessed-yojimbo-guide.jpg` (his page of the guide open), `1600x900-possessed-sisters.jpg`, `1600x900-summon-list-taken.jpg` (Valefor says TAKEN), `1600x900-yojimbo-called.jpg` (his menu is Aeon, which holds Pay, and
    Dismiss; the advisor names Pay), `1600x900-pay-panel.jpg` (34,768 gil typed), `1600x900-sisters-combine-lit.jpg` (the three Sisters called, three status rows, the advisor names Combine), `1600x900-delta-attack.jpg`,
    `1600x900-results.jpg`;
  - phone (390x844 at 2x): `390x844-offering.jpg`, `390x844-offering-yojimbo-focus.jpg`, `390x844-possessed-yojimbo.jpg`, `390x844-summon-list-taken.jpg`, `390x844-sisters-combine-lit.jpg`, `390x844-pay-panel.jpg`.
  How they were made: party prep, the opening, the offering, the Yojimbo link and its guide page (desktop and phone) are real key presses from the title (the word `summon` included). The others start the chapter through the
  debug API (`gotoChapter`, cutscenes skipped) and then use real keys; "three taken" lets the advisor's line fight three links at fast speed first, and the results frame lets it fight the whole chain at skip speed. The Sisters
  and Pay frames set the aeon's gauge (the Sisters' three, or Yojimbo's) to full through the debug state before Yuna's Summon, as a Grand Summon would, and everything after that is real keys.

## The review this change would owe

`node tools/critic-plan.mjs --paths <the 73 shipped paths of the branch, the RE lane's merged engine files included>` classes it **DEEP**: a focused review of the production candidate before a deploy, then live verification and the
deep review on the live build (obligations live + focused + deep). The systems it names: the FFX CTB engine, the FFX HUD and game data, the battle presenter, the chapter registry, the cutscene scripts, effects and sprites,
global layout and input, the move advisor; the checks CHK-002 to CHK-027 it lists include CHK-020 (both games). The paper preflight the rule asks for is `docs/plans/ch-last-summoning-review.md`. Nothing was deployed and no
review was run by this lane.

## Open questions (for Bailey, or for the RE session where it says so)

1. **The Pay panel** is a provisional sketch (rule 9): no target was approved for it. A mockup of it is owed; so is the choice between this digit editor and something nearer the game's own.
2. **The Sisters' other seven orders** and Yojimbo's menu beyond Pay (the RE session's handlers); until then a Sister whose menu does not offer Combine can only be sent away.
3. **Telegraphs** when Yojimbo's gauge is full or the three Sisters' gauges are: the HUD's `charge` banner could carry them. Not built (rule 10).
4. **A possessed look** for the eight paintings, the Sisters' portraits, Yojimbo's hurt and KO paintings, Mindy's attack: art, Bailey's picks. The pause hero art `pause/ch28-last-summoning` is not made (the fallback is Yu Yevon's portrait).
5. Yojimbo's compatibility (live confirmation), his hire answer, the Sisters' motivation, the extra aeons' gauges: Bailey's or the RE session's to settle (one place each, `last-summoning-roster.ts`).
6. How Sandy and Mindy enter play in the real battle, and whether the Pagodas count for the Zanmato penalty (RE section 9 items 6 and 4; the engine counts them, which gives byte 4 in every link).
7. **The Sisters when they come last.** Is a stalemate acceptable there, or should that order warn the player on the offering ("the Sisters last: no aeon will be left to call")? Nothing was tuned; the card and the page say Cindy first.
8. Listing the chapter on the board waits for Bailey, as for every hidden chapter; the music is existing cues by reference (Bailey's ear, rule 13).

## Merge notes

The merge hot spots (two lanes adding a line at the same place; keep both sides): `data/encounters.ts`, `chapters-experiments.ts`, `chapterDoors.ts`, `chapter-meta.ts`, `scenes/experiment-scenes.ts`, `engine/pyreflyCanon.ts`,
`tests/unit/chapter-doors.test.ts`, `chapter-numbers.test.ts`, `chapters/exp-fayth.test.ts` (its list of hidden scenes), `gagazet-door.test.ts` (its list of the other words), `audio-music-batch2-2026-10-12.test.ts` (the chapter music table), `engine/party-stature-chapters.test.ts` (its list of hidden FFX chapters: every new hidden chapter adds a row to these three pinned lists, found by the full suite, not by the chapter's own tests), and `docs/CONTRACT-CHANGES.md`. The Dark Mirror lane's word `yojimbo` (chapter 27) is proved
against this word in `tests/unit/summon-door.test.ts` before the two merge. The files this lane left alone on purpose: `docs/handoff/r50-fixes.md` and `docs/screenshots/r50-fixes/` (another lane's), `NOW.md` (the driver's), the
ledgers.

Tip of the code: `42d451605` (the commits after it are this note, the changelog entry and the frames).
