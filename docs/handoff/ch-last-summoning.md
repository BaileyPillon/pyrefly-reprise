# The Last Summoning: Yu Yevon takes your aeons, in the order you choose (a hidden FFX chapter)

**Status (2026-10-16, built for Bailey, via the release driver):** built, tested and shown in a headless browser against the dev server (frames below); **not deployed**. Branch `ch-last-summoning`: written on `origin/r49-rc`, then merged with
the **live line `origin/r50-release`** (release 50.1: Chapter XXVII Mirror Aeons listed, the RE engine at its final tip `53ce98a0`) and with RE's Zanmato note `origin/re-ffx-zanmato-and-orders` (`f59c4592`), so the branch is the live line plus
this chapter and RE can review it as a diff against `origin/r50-release`. In a worktree of its own (a sibling folder of the main tree). Tip: see the last line of this file.

**Update 2026-10-17:** RE's review of `ee4469eb` (SHIP WITH MINOR FIXES) is applied: see "Review fixes" below; the commits after `ee4469eb` on this branch are those fixes (`git log ee4469eb..ch-last-summoning`). Still not deployed.

**Authority:** Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters ... the most epic encounter ever!!!!!!!!!" and "I'll go with all your recommendations I like the last
summoning" (concept 2 of `aeons-chapter/concepts.md`; the approved target for the new screen is its `frame-2b-offering-menu.png`). The driver's decisions: the chapter stays **hidden behind the typed word `summon`**, hidden
chapter **number 28** (27 is Mirror Aeons, listed on Bailey's word), **Chapter III itself stays unchanged (D-651)**, the music is existing cues by reference. The paper preflight is `docs/plans/ch-last-summoning-review.md` (its
section 11 says where the build parted from it); the contract entry is `docs/CONTRACT-CHANGES.md`, "The Last Summoning".

**Game case: FFX only** (AGENTS.md rule 14). Aeons, Summon, the Pay-and-free-attack Yojimbo, the Sisters' orders and the possession chain are FFX's; FFX-2's Yojimbo and Sisters are other fights and nothing here reads them. The shared
plumbing (the registry row, the door row, one scene row, the chain loop's optional hook, two optional fields of `EnemyGroupDef` and one on its locks, the presenter's folds for three aeons out together, the guide and advisor lookups)
is "both" (CHK-020), additive and inert for every other chapter: Chapter III's twelve seeds and the 18 FFX goldens do not move (below).

## Review fixes (RE's review of `ee4469eb`: SHIP WITH MINOR FIXES; applied 2026-10-17 by a Sonnet sub-agent for the release driver)

**Game case: FFX only** for every item (the Sisters, Yojimbo, Summon and the possession chain are FFX's); the label and the picker change are "both chapters that own the Sisters", Chapter XXVII and this one, both FFX. The picks below are the release driver's delegated picks on RE's review, **not Bailey's own words** (Bailey's word for the chapter: "I'll go with all your recommendations I like the last summoning").

| # | Fix | Where |
|---|---|---|
| F-01 | Sandy's Haste branch makes the game's discarded `findMatchingChr(Sisters, Reflect, Not)` stream-4 draw (m179 @0x0305) before the Haste pick (@0x0317); it is made whenever the branch is reached, even when the Haste search then finds nobody and Razzia follows, and only when two or more Sisters qualify | `src/battle/ffx/ai/possessed-sisters.ts:136`; tests `tests/unit/chapters/last-summoning-sisters-ai.test.ts` (the Haste, Razzia and one-Sister cases) |
| F-new | `gainAfterTurn` skips the 0-to-9 roll when that Sister's gauge is already 100 or more (the game's `if (v3 < 100)`: m178 @0x04bb, m179 @0x0352, m180 @0x031d) | `possessed-sisters.ts:79-83`; tests for Cindy, Sandy and Mindy at 100 |
| Label | the Sisters' Summon row and Grand Summon entry read **"Magus Sisters"** in both chapters (the game's own: `FFX_Data.vbf` `command.bin` row 0xFF, command 0x30FF, field 0; help text "Summon the Magus Sisters."; label `[R]`, a static read). The three keep Cindy, Sandy and Mindy in battle. **The Last Summoning event's own choice window (`sins0700`) is left as it is: its label was not read, and nothing here assumes it** | `src/battle/ffx/aeon-duel.ts:180-185` (`SISTERS_SUMMON_LABEL`, `summonLabel`), `commands.ts:198`, `pickerParams.ts:61`, the advisors `engine/tactics/last-summoning.ts:56` and `mirror-aeons.ts:50-57`, the guide line `data/guides/docs/last-summoning.ts`; the TAKEN badge reads the row's label, so it now says "Magus Sisters TAKEN"; tests: `summon-label-sisters.test.ts` (new) and the chapters' pinned labels |
| Disclosure | **live Chapter XXVII's Grand Summon picker goes from 9 entries to 7** on this branch (Sandy and Mindy no longer separate entries), because `ctx.rt.sisters` is set by Chapter XXVII's build too; that matches the game (one entry). Comments that said "No other build has `ctx.rt.sisters`" are corrected | `aeon-duel.ts:194`, `commands.ts:192`; `CHANGELOG.md` (the Last Summoning entry) and `docs/CONTRACT-CHANGES.md` (2026-10-17 entry) |
| Saves | the 107 saves are **a community pack downloaded 2026-09-26, not the owner's**. Every "owner's / Bailey's saves" wording in the tree now says "a community save pack (not the owner's)" at the same evidence level (strongly indicated, live confirmation pending): Chapter XXVII's compatibility label and hire-answer note, the roster header, `kernel/yojimbo.ts`, `types.ts` (comments), the handoffs, plans, the contract log and the research note. The "default 0" comments (`kernel/yojimbo.ts`, the roster header, `types.ts`) now say the pack contradicts them; **no value changed** | `src/data/ffx/builds/last-summoning-roster.ts`, `mirror-aeons.ts`, `src/battle/ffx/kernel/yojimbo.ts`, `src/battle/common/types.ts` |
| Pagodas | RE's wording is adopted in the data note, the tests and here: The Pagodas count (emulated at battle start: spawn loop sets DC8 for every formation word, selector -15 tests only DC8, DCD and monster slot, getter takes the maximum). After a Pagoda is destroyed it is unproven. L = 4 in every possession link, 5 against Braska. The 15 in 64 at 10,000 gil and 17 in 64 at 100,000 gil (hire answer 1, full gauge) are right | `src/data/ffx/enemies/braskas-final-aeon.ts:374`, `last-summoning-zanmato.test.ts`, `last-summoning-bench.test.ts` |
| Nit | Yu Yevon's `zanmatoLevel` is 5 (byte 4 plus 1, RE section 1.5 "Yu Yevon m176"); it is read only by a player's Yojimbo, never in Chapter III, so no Chapter III digest moves | `braskas-final-aeon.ts:514`; pinned in `last-summoning-records.test.ts` |
| Nit | the script-trigger's place in the Zanmato test's event order is pinned: `ko` for each foe, `action-end`, one `script-trigger`, `victory` | `last-summoning-zanmato.test.ts` |
| Nit | the `evrae-gaze-classes.json` entries 0x60e0 and 0x60e1 = 2 have a source, written in a test because JSON holds no comment: the game's own rows hold formula byte 1 for Kozuka and Wakizashi (`command_records.json`), which the Stone Gaze rule (`gazeStepOf`, note section 2.5) reads as step 2 | `last-summoning-records.test.ts` (last describe) |

**Both stream fixes change which random numbers are used, not any outcome's odds.** The bench (`PYREFLY_BENCH_SEEDS=24`, 5 orders, 120 chains), before and after:

| line | before | after |
|---|---|---|
| the advisor's line | 120 of 120 won (100%), 9.0 of 9 links | **120 of 120 won (100%)**, 9.0 of 9 links; first loss: none |
| a plain swing | 90 of 120 won (75%), first losses at the Sisters x30 | 92 of 120 won (77%), first losses at the Sisters x28 (the same kind of spread; every loss is still at the Sisters) |

The 18 FFX goldens (`ffx-engine-golden.test.ts`) and Chapter III's twelve-seed digest `a26660257ba2716c` (13 of 13 in `last-summoning-iii-pin.test.ts`) pass unchanged. The per-link tables in "The bench" below are the after run; the Cindy-first comparison in "What the numbers say" was measured before the fixes.

**Hire answers STAY as they are: Chapter XXVII 2, Chapter 28 1.** The reason: aligning them moves a chapter's Zanmato odds, and no source picks between two legal player histories. RE's odds, out of 64 at compatibility 128, both Pagodas up, each cell (no gauge \| full gauge):

| Pay | Answer 1 | Answer 2 |
|---|---|---|
| 1,000 | 0 \| 12 | 0 \| 20 |
| 10,000 | 0 \| 15 | 6 \| 26 |
| Pay all (50,000) | 0 \| 16 | 9 \| 29 |

**Not done, by the driver's word:** no oversized file was split; the optional 0x6001 joint-action token was skipped.

## What Bailey should see first

1. On the chapter board type **`summon`** (S, U, M, M, O, N: S is `down`, M is `select`, the others are bound to nothing; the first S moves the board's cursor one step, as the first letters of two other words do). No card changes:
   there is none, and the board still says what it says (nineteen listed with Mirror Aeons).
2. Party prep says **EXP** (header "EXP · THE LAST SUMMONING"); the opening plays (eleven lines and the chant: Yuna says "I am saying goodbye."); then **the offering screen**: Dream's End's painting as the ground, Yu Yevon above
   "Yu Yevon reaches for one of your aeons.", eight cards in the game's order (Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo, the Magus Sisters), the panel "IF YU YEVON TAKES ..." and "WHAT YOU LOSE". Left and Right (or A and D)
   choose, Enter gives; a tap focuses and a second tap gives. **What you give up is fought next, as a copy of your own** (the same Strength, Defense, Magic, Magic Defense, Agility, Evasion, Accuracy and maximum HP, at full HP), with
   the two Yu Pagodas, and it is gone from your Summon list for the rest of the chain ("TAKEN"). Nothing heals between battles. After each win the offering comes back with that card crossed.
3. Then the chain goes on for nine battles: eight possessions (the Magus Sisters are **one** battle with three bodies, as the game fights them) and Yu Yevon last, the fight Chapter III has, with all eight aeons gone.
4. **The part to try**: summon your own **Yojimbo** (Summon, Yojimbo: his menu is Aeon, which opens **Chapter XXVII's Pay ladder**: Pay 1,000, Pay 10,000, Pay all; a bigger payment buys a better stroke, and a Zanmato, rare, kills the
   twin and both Pagodas at once) and your **Magus Sisters** (the Summon row says **Magus Sisters** and stands for the three, in Chapter XXVII too; their menu is their orders, **Combine** among them: the Delta Attack on every foe in reach,
   six hits each; their bars start full). Look at the possessed **Yojimbo**, who now wears the approved painting (a flat 9,999 Zanmato on everyone at the front when his gauge is full, Kozuka or Wakizashi otherwise), and at the possessed
   **Sisters** (Cindy mends and drains and calls the Delta Attack when all three are ready; **fell Cindy first**).
5. Press `G` for the guide's page for this chain. The advisor's "NEXT BEST MOVE" card names the line's move on every ordinary turn; **on Yojimbo's and the Sisters' menus it is off** (Chapter XXVII's rule: the simulation cannot price Pay or an order).

## What was built

| Area | Files (all under `src/` unless noted) |
|---|---|
| The chain | `data/ffx/last-summoning-ids.ts` (ids, no imports), `data/ffx/enemies/last-summoning-chain.ts` (formations as a pure function of what has been given up; the locks), `data/ffx/builds/last-summoning.ts` + `last-summoning-roster.ts` (the party and every estimate in one place) |
| The record fixes and the two battles | `data/ffx/enemies/braskas-final-aeon-abilities.ts` and `braskas-final-aeon.ts`, `data/ffx/command-records/enemies.ts` + `index.ts`, `battle/ffx/ai/possessed-aeons.ts` (Yojimbo's coin), **`battle/ffx/ai/possessed-sisters.ts`** (the three scripts, gauges, the token that makes Cindy throw the Delta Attack), `ai/yu-pagoda.ts` (the Power Wave to the lowest-gauge Sister), `ai/possession-setup.ts` (three bodies at the start) |
| The chain loop's hook | `app/screens/BattleEncounterChain.ts` (`choose`, `ChainChoice`, `chainLengthOf`), `BattleScreenSetup.ts` (`findEnemyGroup` resolves the chapter's ids), `BattleScreen.ts` (the wiring and the input forwarding), `BattleScreenOffering.ts` (the chooser) |
| The offering screen | `ui/ffx/offering/` (`OfferingScreen.ts` the overlay, `offeringModel.ts` the pure model, `offeringText.ts` our words, `offering.css`); Yojimbo's card is cut from his approved painting |
| The player's Yojimbo and Sisters | **Chapter XXVII's, shared**: the Pay ladder and the Sisters' short order words (`engine/PayRows.ts`), the three Sisters' spots and `summonArtId`. **This chapter's seams**: the presenter's folds for three aeons out together (`engine/BattlePresenterStage.ts`, `app/screens/battlePreload.ts`, `ui/ffx/fieldRows.ts`, `ui/common/phoneFraming.ts`), the TAKEN badge (`ui/ffx/commandMenuRows.ts`), Sandy's and Mindy's Summon rows left out so Cindy's one row stands for the three (`battle/ffx/commands.ts`, `aeon-duel.ts#grandSummonChoices`). `battle/ffx/aeon-commands.ts` and `pickerParams.ts` are exactly the RE lane's. (A digit-by-digit Pay panel this lane built first was removed at the merge.) |
| Chapter record, pause metadata, registry | `data/chapter-last-summoning.ts` (number 28, `experimental`), `chapter-meta-last-summoning.ts` (EXP, three objectives), one line each in `chapters-experiments.ts`, `chapter-meta.ts`, `encounters.ts` |
| Story | `story/scripts/last-summoning.ts`: eleven opening lines, six closing, one arrival and one fall for each aeon (order-agnostic), our own words, Yu Yevon never speaks, every mid line on an `auto`; the triggers fire on the real engine (checked) |
| Stage | `scenes/last-summoning.ts` (a thin derivation of Dream's End's scene: the party and the Pagodas keep Chapter III's staging, the new bodies are added), a row in `scenes/experiment-scenes.ts` and `engine/pyreflyCanon.ts` |
| Guide and advisor | `data/guides/last-summoning.ts` (card), `data/guides/docs/last-summoning.ts` (the page), `engine/tactics/last-summoning.ts`, registered ahead of Chapter III's and found only on this chapter's board (`engine/tactics/lookup.ts#onLastSummoningBoard`); `GuideDoc.onlyWhenFlag` |
| The word | `app/screens/frontend/summonDoor.ts` and one row in `chapterDoors.ts` |
| Tests | `tests/unit/chapters/last-summoning-{iii-pin,records,sisters-ai,yojimbo-ai,chain,flow,offering,chapter,zanmato,bench}.test.ts`, `tests/unit/last-summoning-presentation.test.ts`, `summon-door.test.ts`, `tests/unit/helpers/lastSummoningDrive.ts`, `ffxChainDigest.ts`; edited, each saying why: the pinned lists of `chapter-doors`, `gagazet-door`, `yojimbo-door`, `audio-music-batch2-2026-10-12`, `engine/party-stature-chapters`, `chapters/exp-fayth`, `data-ffx-command-records` (508, 505 and 3), `strategy-guide`, `strategy-guide-sheet` and `guide-link-title` (the one shared-id exception), `possessed-aeons`, `re-parity-ai-possessed` and `audio-sfx-parity-pin` (the record fixes) |

No source file added is over 400 lines (hard rule 7); the files over 400 that were touched were over it already (`types.ts`, `BattleScreen.ts`, `BattlePresenterStage.ts`, `braskas-final-aeon*.ts`, `ffx-hud.css`). `encounters.ts` stays at 397.
Two of this lane's new test files are over 400 lines (the chapter's and the door's), as many of the repository's tests are.

## The data, its sources and tags (rule 6: nothing invented)

**Every number of the fights is the game's own**, read from its files by the reverse-engineering session (`research/re-ffx-last-summoning.md`, "RE section n", tagged `[bytes]`/`[static]`; `research/re-ffx-zanmato-and-orders.md`)
unless this table says `[estimate]`. The record fixes (RE sections 1.4 and 4), each pinned to the game's own command-record fixture (`tests/unit/chapters/last-summoning-records.test.ts`):

| Record | Before | The file (RE) |
|---|---|---|
| Possessed Yojimbo's strikes | Daigoro, power 10, a plain Attack | **Kozuka 0x60E0 and Wakizashi 0x60E1**, power 14, one target, rank 3, a coin on a random living front-line actor; no Daigoro, no plain Attack |
| Possessed Yojimbo's Zanmato | Death at chance 255 | **row 0x60E2**: formula 6 (fixed, no variance), power 200, damage kind neither, **no status**, all enemies with `extra.groupTarget: true`, never misses: 9,999 on each front-line actor, not a kill (RE's spec, handoff section 10.5 item 1) |
| Camisade, Razzia | power 30 rank 3; power 28 on all | power 21, **rank 5**, shatter 30; Razzia on one target |
| Delta Attack (the possessed Cindy's own) | power 65, one hit | formula 15 (cube of MAG), power 10, **six hits** on the front line |
| Cindy, Mindy | Camisade, Delta, Curaga; Passado only | **adds Drain** (under two thirds of her HP) and **Flare** (a coin with Passado; on Cindy while she has Reflect) |
| The Sisters | three battles | **one battle, three bodies** (Mindy, Sandy, Cindy), each on her own script; gauges 0 to 9 a turn, 10 to 19 a hit, 30 to 39 more from a Power Wave; the Pagodas' Power Wave goes to the lowest-gauge living Sister and is skipped when that is 100; one dead Sister makes the Delta Attack impossible |
| Zanmato bytes | none | possessed Valefor to Yojimbo 2, the Sisters 3 (`zanmatoLevel` is the byte plus 1: 3 and 4), the Pagodas 4, Yu Yevon 4 (`zanmatoLevel` 5, set in the review fixes); The Pagodas count (emulated at battle start: spawn loop sets DC8 for every formation word, selector -15 tests only DC8, DCD and monster slot, getter takes the maximum). After a Pagoda is destroyed it is unproven. L = 4 in every possession link, 5 against Braska (RE review, 2026-10-17). Our engine KOs a destroyed Pagoda rather than removing it, so it still counts here: that is the unproven case |
| The possessed Yojimbo's painting | the navy aeon painting | `characters/yojimbo-cavern`, the approved one (D-054), as Chapter XXVII gave Yuna's own Yojimbo |

**Our estimates, each in one place** (`data/ffx/builds/last-summoning-roster.ts`; labelled there and in the plan): Yojimbo's starting **compatibility 128** ("strongly indicated by a community save pack (not the owner's: 107 saves, downloaded 2026-09-26): slots 1-84 all read 128; 164 by slot 106; live confirmation pending"; the pack contradicts the image's default of 0 for the compatibility, and for the hire answer's default 0 too, RE review 2026-10-17; no value changed) and his **hire answer 1** (the neutral answer; **Chapter XXVII uses 2, the guides' reply, and the two STAY as they are, see "Review fixes" below**); the
party's **gil 50,000** (Dream's End's own estimate); each Sister's starting **motivation 50** (the middle of 0 to 100; the engine says UNSOURCED); the Sisters' **starting gauges full** (Chapter XXVII's choice too; the engine offers Combine
only while all three bars are full) and the other extra aeons' **gauges 0**; the five extra aeons' **stats** (inside Sin's block, `ffx-combat-core` §6.4.3, N = 360, estimates in that note's own sense); the stage spots and heights of the
bodies Chapter III never fields; the words of the offering, the card, the page and the story; **the advisor's payment rule** (the smallest power of two that reaches a motivation of 63, derived from RE 8.1 point 4, for hire answer 1)
and **the order it calls aeons in** (Bahamut, Anima, Cindy's row for the Sisters, Ixion, Shiva, Ifrit, Valefor, Yojimbo).

**Not built from the file, said plainly:** how Sandy and Mindy enter play in the real battle (RE section 9 item 6: untraced; all three stand from the first turn here); the helper actor and the Sinscale stand-in (they never act and are
not targetable); the raw properties 295, 296, 217 and 238.

## What RE's final engine changed (merged: `53ce98a0`, and the note `f59c4592`)

The two relays from the RE session's check, and how this lane stands:

- **A landed player Zanmato kills every legal foe of the one group it picks** (here: the possessed twin and both Pagodas), ignoring Death resistance; the Sisters' **eight orders work**; the Delta Attack hits **every foe in reach, six hits
  on each**. `tests/unit/chapters/last-summoning-zanmato.test.ts` runs the first on the chapter's own first link: with Yojimbo's gauge full a payment of 10,000 lands one within a few seeds, the three foes fall, and the events run
  `ko` for each, `action-end`, then `victory` (the order the driver gave); without a full gauge a payment of 50,000 never does at this compatibility and hire answer (RE: none below 131,072 gil at compatibility 255).
- **The best case for a player's Zanmato is 5 in 64 (7.8 percent), not 12.5** (RE's check of its own note; the extreme Pay it counts is far above anything Dream's End's gil buys). In this chain the odds are what the engine gives: at
  compatibility 128, hire answer 1, byte 4 (the Pagodas count, see the table above) a **full gauge** (a Grand Summon fills it for the turn) lifts a payment of 10,000 to 100,000 gil to 15 to 17 in 64; without one, none. Nothing here tunes them.
- **The possessed aeons carry `zanmatoLevel`** (3 and 4; written in `possessedAeonEnemyDef`, pinned by the records test) and the possessed Yojimbo's Zanmato is RE's row (table above).
- **What the bench rests on, and leaves out:** the advisor's line calls aeons only through Yuna's Grand Summon and **never calls Yojimbo** (he is last in its order, and the others are always on offer first), so no Zanmato of the player's
  is in the bench's chains (the bench asserts it); it uses only Combine of the Sisters' eight orders. A line that called Yojimbo first would win many links by one Pay (about one in four with a full gauge), and would be a
  different line, measured separately if Bailey wants it.
- **Chapter XXVII's patterns are adopted, not copied twice**: the Pay ladder, the short order words, the Sisters' three spots, `summonArtId` and the rule that the card is off on the aeons' menus are the live line's; this lane's
  digit-by-digit Pay panel and its own text pass were removed at the merge.

## Chapter III is byte for byte what it was (decision D-651)

`tests/unit/chapters/last-summoning-iii-pin.test.ts` plays Chapter III's whole chain on **twelve seeds** with the chapter's own line and hashes every link's complete event log (SHA-256, 16 hex characters) and its outcome.
It was **recorded before any change of this lane** (on the merged tree), and the same file passes **after** all of it, the live line and RE's final engine included (13 of 13: twelve seeds and the one digest of the whole table,
**`a26660257ba2716c`**). Eleven seeds are a seven-link victory; seed 3 is a defeat on link 1 (the line is not tuned, and nothing here is a balance measurement). `tests/unit/ffx-engine-golden.test.ts` (the 18 FFX goldens),
`possessed-aeons.test.ts` and `re-parity-ai-possessed.test.ts` pass as well. A digest that moves is a change of Chapter III to explain, never a number to re-pin.

## The bench (what the chain is like to play)

`tests/unit/chapters/last-summoning-bench.test.ts` plays the whole chain on the real engine, link by link, in five orders (the offering's own, its reverse, Yojimbo and the Sisters and Anima first, two shuffles) over
24 seeds each (`PYREFLY_BENCH_SEEDS=<n>`; the suite runs 4), with the chapter's own line and with a naive one (a swing on the first target, nothing else). **Nothing is tuned** (the fight's numbers are the game's and
Chapter III's); the figures are what the chain does, **on the engine at its final tip and without a Zanmato or an order of the Sisters' other seven (see above: the line calls neither)**. "Aeon standing" is the share of links that ended
with one of the player's aeons on the field (only the advisor's line calls any); "party down" is always 0.0 because the fayth's Auto-Life stands a fallen friend up at once (it revives at a quarter of HP).

**The chapter's own line (the advisor).** All five orders together, chains 120, won 100%, links fought 9.0 of 9 on average. First loss at: none. Aeons called (links): bahamut 96, anima 13, sisters 7, ixion 1; player's Combine 7, player's Zanmato 0:

| link | fought | won | turns | ticks | party down | aeon standing |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 120 | 100% | 32.9 | 168.2 | 0.0 | 5% |
| 2 | 120 | 100% | 39.0 | 209.8 | 0.0 | 14% |
| 3 | 120 | 100% | 26.4 | 144.9 | 0.0 | 8% |
| 4 | 120 | 100% | 36.0 | 184.6 | 0.0 | 16% |
| 5 | 120 | 100% | 28.4 | 137.6 | 0.0 | 11% |
| 6 | 120 | 100% | 23.6 | 121.2 | 0.0 | 6% |
| 7 | 120 | 100% | 10.6 | 54.2 | 0.0 | 0% |
| 8 | 120 | 100% | 24.5 | 118.7 | 0.0 | 0% |
| 9 | 120 | 100% | 8.2 | 54.0 | 0.0 | 0% |


Per order:
- offering order: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none; aeons called (links): anima 13, sisters 7, bahamut 2; player's Combine 7, player's Zanmato 0
- reversed: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none; aeons called (links): bahamut 23, ixion 1; player's Combine 0, player's Zanmato 0
- yojimbo, sisters, anima first: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none; aeons called (links): bahamut 24; player's Combine 0, player's Zanmato 0
- shuffle 1: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none; aeons called (links): bahamut 23; player's Combine 0, player's Zanmato 0
- shuffle 2: chains 24, won 100%, links fought 9.0 of 9 on average; first loss at: none; aeons called (links): bahamut 24; player's Combine 0, player's Zanmato 0

**The naive line (a swing on the first target, nothing else).** All five orders together, chains 120, won 77%, links fought 7.9 of 9 on average. First loss at: sisters x28. Aeons called (links): none; player's Combine 0, player's Zanmato 0:

| link | fought | won | turns | ticks | party down | aeon standing |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 120 | 96% | 59.0 | 368.1 | 0.0 | 0% |
| 2 | 115 | 97% | 74.0 | 458.9 | 0.0 | 0% |
| 3 | 111 | 100% | 28.6 | 167.0 | 0.0 | 0% |
| 4 | 111 | 95% | 82.6 | 503.4 | 0.0 | 0% |
| 5 | 105 | 94% | 78.1 | 480.8 | 0.0 | 0% |
| 6 | 99 | 100% | 31.0 | 167.6 | 0.0 | 0% |
| 7 | 99 | 100% | 10.4 | 59.6 | 0.0 | 0% |
| 8 | 99 | 93% | 81.1 | 502.5 | 0.0 | 0% |
| 9 | 92 | 100% | 12.0 | 67.4 | 0.0 | 0% |


Per order:
- offering order: chains 24, won 71%, links fought 8.7 of 9 on average; first loss at: sisters x7; aeons called (links): none; player's Combine 0, player's Zanmato 0
- reversed: chains 24, won 79%, links fought 7.3 of 9 on average; first loss at: sisters x5; aeons called (links): none; player's Combine 0, player's Zanmato 0
- yojimbo, sisters, anima first: chains 24, won 83%, links fought 7.8 of 9 on average; first loss at: sisters x4; aeons called (links): none; player's Combine 0, player's Zanmato 0
- shuffle 1: chains 24, won 75%, links fought 8.0 of 9 on average; first loss at: sisters x6; aeons called (links): none; player's Combine 0, player's Zanmato 0
- shuffle 2: chains 24, won 75%, links fought 7.8 of 9 on average; first loss at: sisters x6; aeons called (links): none; player's Combine 0, player's Zanmato 0

**What the numbers say.** The chain is nine battles; a link takes a few turns to about a hundred. **The advisor's line wins all 120 chains** (24 seeds in each of five orders), and the Sisters' fight is the longest link in
every order (three bodies, 17,000 HP between them, Cindy's Drain and Curaga and the Pagodas' 1,500 a Power Wave against a party that hits for 500 to 900): 68 to 98 turns on average in the five orders, against 5 to 67 for the
single aeons. **A plain swing wins 92 of 120 and loses the other 28, every one of them at the Sisters** (the engine's stalemate watch calls "The battle cannot be won from here", `escape`), most often when they come last and
no aeon is left to call. The line fells **Cindy first** for exactly this reason, and it was measured rather than argued: aimed at the weakest first (Mindy, then Sandy) the party left Cindy alone, draining as fast as it hurt her,
and the same bench won 105 of 120 (the Sisters last: 19 of 24; second: 21 of 24); aimed at her first it wins 24 of 24 in both orders in about a third of the turns (69 turns on average for the Sisters last, against 219; 74 for the
Sisters second, against 214). The aeons the line calls are the roster's use, not a need. **None of this tunes a number of the fight**; it is what the advisor's line does with them. (The figures of the tables above were re-run after the review fixes of 2026-10-17; the Cindy-first comparison in this paragraph is from the run before them.)

## What was observed, and is disclosed (not defects of this lane)

- **The possessed Sisters' and Yojimbo's blows are large against Dream's End's party** (Camisade is capped at 9,999 on a 6,492-HP Tidus: the file's power 21 against the copy of the player's Strength 82), so a party member is
  knocked out by many a blow and the fayth's Auto-Life stands him up at once (a quarter of his HP, 1,623 for Tidus). Nobody is ever "down" at the end of a link in the bench for that reason, and a **petrified** party is the only way
  to lose a link by being beaten. The party is Dream's End's estimate (Chapter III's), not this chapter's.
- **Sandy's Haste on a Cindy who holds Reflect bounces onto the party** (the engine's own rule for a reflected buff), and Mindy's Flare through Cindy's Reflect reaches the front line, as the file says (RE 6.2).
- **The stalemate**: see "What the numbers say". The shared watch ends such a battle as `escape`, so the chain ends on the results screen; there is no checkpoint (only the Sin links have one), so a retry starts at the offering.
- **The Summon list says "Magus Sisters" for the Sisters' one row, in both chapters** (the game's own label, see "Review fixes"); a taken Sisters row reads "Magus Sisters TAKEN". The Sisters keep Cindy, Sandy and Mindy as their names in battle.
- **A Grand Summon of Yojimbo is a shortcut**: his full temporary gauge makes a Zanmato possible (15 to 17 in 64 per payment of 10,000 to 100,000 at this compatibility; byte 4 as in the table above), and one landed Zanmato wins the link. It is
  the game's rule through RE's engine, not tuned here; whether it is what Bailey wants in "the most epic encounter" is his call.
- **The cursor skips a greyed row** in the Summon list (every FFX menu does), so a taken aeon's reason could not be read; it says **TAKEN** on its row instead.
- **The first-time tutorial hints** of the battle HUD ("He moves after you...", "Call the aeon...") appear in this chapter as in every other; the frames dismiss them.
- **Skip speed** gives the first held aeon at every offering (a run nobody watches never parks on it).
- **Art-dependent tests**: `tests/unit/chapters/mirror-aeons-art.test.ts` fails in a tree whose `public/art` is r49 (the Dark paintings are in r50); it is the live line's test and passes against r50.

## Art

**No painting is new.** Dream's End presents its possessed aeons from the player's own paintings, and the same holds for Anima, Yojimbo and the three Sisters (`characters/anima`, `yojimbo-cavern`, `cindy`, `sandy`, `mindy`). **Yojimbo
is the approved painting** (`characters/yojimbo-cavern`, D-054; the navy `characters/yojimbo` and `portraits/yojimbo.png` are not used): the possessed Yojimbo, the offering's card and Yuna's own Yojimbo (Chapter XXVII's fix, which this
chapter's roster uses through the catalogue) all draw it, and his turn-bar and status-row faces are cut from its idle. Gaps, disclosed: the possessed Yojimbo has no hurt or KO painting (the presenter holds the idle), Mindy has
no attack painting, no Sister has a portrait (the turn rail crops the idle), and a **possessed look** for the paintings would be an addition for Bailey's yes (rule 10), not built.

**The one new file is a plate copy**, because every derived scene draws `backdrops/<sceneKey>.png` on the 2D screens (the cutscene and party prep): `backdrops/last-summoning.png` (a byte-for-byte copy of Dream's End's) and its
sidecar, installed as **new files in the r50 mirror** with `node tools/gen/manifest.mjs --root=<r50>` regenerating its `manifest.json` (one entry, `"last-summoning"`). **r49 is unchanged**: a listing of every file of r49
(5,346 files: path, size, modification time) and the SHA-256 of its `manifest.json` are identical before and after this lane's work (list hash `49752badd...`, manifest `6349dcc5...`); r50 gained exactly the two files and the
regenerated manifest. **In this tree `public/art` stays on r49**, so a build from it shows the fallback where the 2D screens want the plate (the cutscene's ground is black). **The frames below were taken against a dev server
that serves every `/art/` file from the r50 mirror** (a small private config, a scratch file, deleted; nothing under `public/art` is written), so they show the plate; the final art frames come from a tree that points at r50.

## Proof run (what was run, and what it said)

- `node node_modules/typescript/bin/tsc --noEmit`: clean. `node tools/orphans.mjs`: 28 modules nothing imports, **none of this lane's** (the same legacy ones).
- The lane's suites (records, Sisters' AI, Yojimbo's AI, chain, flow, offering, chapter, **Zanmato**, presentation, door, Chapter III's pin, the bench), the 18 FFX goldens, the possessed-aeon and command-record suites, the doors, the guide tests, the
  pinned lists the merge moved and the RE lane's six engine suites plus Chapter XXVII's: 185 test files, 3,244 tests, **3,220 pass**; the 4 that fail are `mirror-aeons-art.test.ts`'s Dark paintings, which need `public/art` on r50 (this tree's is r49; the live line's test,
  not this lane's). **The full unit suite** (`npm test`, about 77 minutes at `--maxWorkers=4`): 1,320 files and 20,794 tests, 1,300 files passed and 16 skipped, **4 files failed with 7 tests, all accounted for**: six need the Dark Aeons' art that only r50 holds (`mirror-aeons-art` four times, `board-thumbs`'s strip master `dark-mindy`, `chapter-meta`'s Mirror Aeons snapshot), and `advisor-degenerate-boards` timed out at 180 s under load and passes alone. An earlier full run of this lane, before the live line was merged, failed 7 tests in 5 files, all accounted for and fixed (three pinned lists that did not
  yet name the new chapter, the chapter's own test caught mid-edit, and one test that timed out under load and passes alone).
- Frames, from the dev server with real key presses from the title to the first fight for the keys path and through the debug API for the rest (`gotoChapter`, cutscenes skipped), at 1600x900 and 390x844 at 2x (headless
  Chromium, `PYREFLY_BROWSER=gpu`): `docs/screenshots/ch-last-summoning/`:
  - desktop: `1600x900-party-prep.jpg`, `1600x900-cutscene-plate.jpg` (the r50 plate under the opening), `1600x900-offering.jpg`, `1600x900-offering-yojimbo-focus.jpg` (his approved painting on the card),
    `1600x900-offering-three-taken.jpg` (round four: Valefor, Ifrit and Ixion crossed out), `1600x900-possessed-yojimbo.jpg`, `1600x900-possessed-yojimbo-guide.jpg` (his page of the guide open),
    `1600x900-possessed-sisters.jpg`, `1600x900-summon-list-taken.jpg` (Valefor says TAKEN), `1600x900-yojimbo-called.jpg` (his menu: Aeon and Dismiss), `1600x900-pay-ladder.jpg` (Chapter XXVII's ladder),
    `1600x900-after-pay.jpg` (Pay 10,000 and the twin and both Pagodas down), `1600x900-sisters-orders.jpg` (the three Sisters called: Free choice, Cindy: support, Combine), `1600x900-delta-attack.jpg` (a Pagoda
    taking 15,455 from the Delta Attack, the group), `1600x900-results.jpg` (the whole chain, nine links, at skip speed);
  - phone (390x844 at 2x): `390x844-party-prep.jpg`, `390x844-offering.jpg`, `390x844-offering-yojimbo-focus.jpg`, `390x844-possessed-yojimbo.jpg`, `390x844-summon-list-taken.jpg`, `390x844-pay-ladder.jpg`, `390x844-sisters-orders.jpg`.
  How they were made: party prep, the opening, the offering and the Yojimbo link with its guide page are real key presses from the title (the word `summon` included). The others start the chapter through the debug API
  (`gotoChapter`, cutscenes skipped) and then use real keys; "three taken" lets the advisor's line fight three links at fast speed first, and the results frame lets it fight the whole chain at skip speed. The Yojimbo and
  Sisters frames use a plain Summon and no debug state (the Sisters' bars start full; Yojimbo's gauge starts empty). The frames come from the dev server serving r50's art; `public/art` itself is untouched.

**After the review fixes (2026-10-17, a Sonnet sub-agent for the release driver):** `tsc --noEmit` clean; `node tools/orphans.mjs`: the same 28 legacy modules, none of this work; the chapter's files, Chapter XXVII's, the 18 FFX goldens, Chapter III's twelve-seed digest (13 of 13), the command-record, guide, door and strategy suites, the RE lane's engine suites and the pickers: 190 files, 3,559 tests, **3,534 pass, 20 skipped, 5 fail, all five environmental**: `chapters/mirror-aeons-art` four times (the Dark Aeons' paintings, which only the r50 art holds; this tree's `public/art` is r49) and `chapter-meta`'s Mirror Aeons snapshot (the same art). The full `npm test` was not re-run (about 77 minutes); the earlier full run's other environmental failures were `board-thumbs`'s strip master `dark-mindy` (art) and `advisor-degenerate-boards` (a timeout under load that passes alone), neither touched by this work.

## The review this change would owe

`node tools/critic-plan.mjs --paths <this branch's 50 shipped paths against r50-release>` classes it **DEEP**: a focused review of the production candidate before a deploy, then live verification and the deep review on the live build
(obligations live + focused + deep). The systems it names: the FFX CTB engine, the FFX HUD and game data, the battle presenter, the chapter registry, the cutscene scripts, effects and sprites, global layout and input, the move advisor;
the checks include CHK-020 (both games). The paper preflight the rule asks for is `docs/plans/ch-last-summoning-review.md`. Nothing was deployed and no review was run by this lane.

## Open questions (for Bailey, or for the RE session where it says so)

1. **The Pay screen** is Chapter XXVII's ladder (provisional there too: Bailey's pick between this ladder, a stepper or a fixed payment). One question for both chapters.
2. **Hire answer** (1 here, 2 in Chapter XXVII; DECIDED to stay, see "Review fixes"), Yojimbo's compatibility (live confirmation), the Sisters' motivation and starting gauges (one place each, `last-summoning-roster.ts`).
3. **Telegraphs** when Yojimbo's gauge is full or the three Sisters' gauges are: the HUD's `charge` banner could carry them. Not built (rule 10).
4. **A possessed look** for the eight paintings, the Sisters' portraits, Yojimbo's hurt and KO paintings, Mindy's attack: art, Bailey's picks. The pause hero art `pause/ch28-last-summoning` is not made (the fallback is Yu Yevon's portrait).
5. How Sandy and Mindy enter play in the real battle, and whether a destroyed Pagoda still counts for the Zanmato byte (RE section 9 items 6 and 4; the Pagodas count at battle start, emulated; after one is destroyed it is unproven).
6. **The Sisters when they come last.** Is a stalemate acceptable there, or should that order warn the player on the offering ("the Sisters last: no aeon will be left to call")? Nothing was tuned; the card and the page say Cindy first.
7. **The Sisters' Summon row** is "Magus Sisters" in both chapters (the game's label; DECIDED, see "Review fixes").
8. **The Zanmato shortcut** (Grand Summon Yojimbo, then Pay): leave it as the game's rule, or does "the most epic encounter" want it fenced? Not tuned; measured only if asked.
9. Listing the chapter on the board waits for Bailey, as for every hidden chapter; the music is existing cues by reference (Bailey's ear, rule 13).

## Merge notes

The branch already contains the live line, so there is nothing of Chapter XXVII's to merge: the hot spots (two lanes adding a line at the same place) were resolved here with both sides kept, listed in the contract entry. What is left
for the driver is the release itself (listing, review, deploy) and the final art frames from a tree whose `public/art` points at r50. The files this lane left alone on purpose: `NOW.md` (the driver's) and the ledgers.

Tip of the code: `2cdf46c8d` (the commits after it are this note, the changelog entry, the contract entry, the plan and the frames).

**Resume note (2026-10-16, written for a restart):** the branch before this note was `8711a1a1b`, pushed. **Done:** the chapter end to end (offering, chain, record fixes with Chapter III's twelve-seed digest `a26660257ba2716c` pinned before and after, story, guide, advisor, tests, bench, the live line r50.1 and RE's final engine merged, the frames at 1600x900 and 390x844, the handoff, changelog, contract and plan entries); `tsc` clean; 185 touched test files pass except the live line's `mirror-aeons-art` (needs art r50); `node tools/orphans.mjs` lists none of this lane's modules. **Left:** nothing of the chapter itself (the full `npm test` on the final tree is in "Proof run" above); the driver's release steps (the final art frames from a tree whose `public/art` is r50, the review, listing and deploy). Game case: FFX only; the chapter stays hidden behind its word `summon`.
