# The Farplane Cup: Auron, Tidus and Seymour (a hidden FFX-2 chapter, number 38)

**Branch `ch-farplane-cup`** (from `origin/r75-boss-art` `2aa42f7a7`, then the research note and the paper preflight), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX-2 only** (AGENTS.md rule 14): ATB, dresspheres and the FFX-2 monster rows 311, 317 and 319 (the Fiend Arena block of `monster.bin`); the three are FFX characters appearing as FFX-2 enemy rows with FFX-2 ability rows. No FFX or FF7 file changes behaviour; the registry rows, the door row and the kill-reward item table are shared plumbing, "both" in kind (CHK-020), inert for every other chapter.
**Status: built, hidden, no new paintings; the winnability is measured and reported, not tuned (section 6).** The chapter opens only by a typed word, **`duelist`**. Listing it waits for Bailey's word.
Written 2026-11-06 by a Sonnet sub-agent of the release driver.

Authority: Bailey, relayed by the driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (about 00:55 EST, to building every researched boss he never picked) and, 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick in section 4 is the paper preflight's own recommendation, "driver's call, his to overturn"; the alternative is written beside it.** Plan: `docs/plans/ch-duelist-review.md`. Sources: `research/re-ffx2-farplane-cup.md` ("RE n"). Contract entry: `docs/CONTRACT-CHANGES.md` (2026-11-06). The shared ledgers (NOW.md, ACTIONS.md, DECISIONS.md, CHANGELOG.md) are **not touched here**: the driver adds the rows (the CHANGELOG lines are in section 11).

## 1. Play it

1. From the title, reach the chapter-select board. Type **`duelist`** (any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it. **The first letter D is the board's `right`, which a first letter cannot claim, so the cursor takes one step** (as the `daigoro` and `darkaeon` doors do); E (`start`) and S (`down`) are later letters of a live match and are claimed by the word; U, L, I and T are bound to nothing, so the last letter leaves no press latched. On a phone, the long-press field on the "Chapter select" label takes the same word.
2. Enter starts the chapter: a pre scene (our draft, section 8), then **duel 1: Auron**. After his fall a 12-second seam (the arena mends the girls), then **duel 2: the masked duelist** (the HUD shows "????"), another seam, **duel 3: Seymour**, then the post scene (which names the hidden one) and the results page. Links 2 and 3 open at full HP and MP with a fallen girl standing and **no Save Sphere card**; items spent stay spent; statuses and the worn dressphere do not carry. A defeat on duel 2 or 3 retries **that duel**; a defeat on duel 1 starts the chapter over. Escape is off.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration. The party is Chapter XIII's Lv 99 three (Yuna and Paine Dark Knights, Rikku an Alchemist).

## 2. What it is

| Duel | Fighter (game row) | Lv | HP | AGI | What he does, poll by poll (the game's own script) |
|---:|---|---:|---:|---:|---|
| 1 | **Auron** (311) | 74 | 187,500 | 141 | one X-Potion below an eighth of his HP; below a quarter a draw of 8 (Shooting Star on the first Death-resistant girl, else **Shin Zantetsu** on the party; Mega-Potion; Shooting Star; Full Break; Dragon Fang; Attack); above it a draw of 6: **Shooting Star** (an Eject at 254, 2.0 s charge), **Dragon Fang** (the party, power 14), **Full Break** (power 20 and four stat drops), else Attack |
| 2 | **the masked name** (317, Tidus) | 73 | 136,200 | 224 | **opens with Blitz Ace** (nine hits of power 10 on one girl), then **Hastega** whenever his Haste lapses; hasted, a draw of 4: Attack, Spiral Cut (power 32), **Delay Buster**, Attack, with a Mega-Potion below a third, a Hero Drink below a tenth, and a second Blitz Ace once the count passes 4 (and, the count then being 0, a third at once) |
| 3 | **Seymour** (319) | 67 | 145,500 | 159 | a draw of 8: Demi (25 percent of every girl's current HP), Critical Attack, **Black Sky** (10 hits), **Meteor** (12 hits), the Shell / Protect / Break ladder, Magic Up x5 then Strength Up x5 then Confuse, Slowga, Dispel (Ultima below a quarter); below half HP four lines become Curaga, Drain Attack, Absorb, Drain Attack. **Absorbs Fire, Ice, Thunder, Water and Gravity, weak to Holy** |

Every number is the game's own, from `research/re-ffx2-farplane-cup.md`: the three `monster.bin` rows and the 33 move rows, decoded **by a script** into `tests/fixtures/parity/ffx2/farplane_cup_rows.json` (nothing typed by hand; the command-record literals are generated from the same tables). Rewards: the rows' EXP, Gil, AP (1) and Pilfer Gil; steals; the three kill-reward rows.

## 3. The data and its sources (rule 6: nothing invented)

`tests/unit/chapters/farplane-cup-data.test.ts` (71 tests) compares the enemy data, the monster records and the command records to the fixture field by field, and the rows the repo already holds under other names (Demi, Curaga, Dispel, Shell, Protect, Break, Confuse, Black Sky, Mega-Potion, X-Potion, Hero Drink, Magic Up) to these. **Rule 5 (hit rule):** `canMiss` follows each row's accuracy formula (misc word bits 3 to 5): `true` for the three Attacks, Full Break, Delay Buster, Shin Zantetsu, Drain Attack and Shooting Star (formula 3); `false` for every other move, set explicitly.

**Gaps, named (not invented):**
- **Item ids.** The files give ids the repo can pair with a name for the common drops and the steals (Mega Phoenix 0x2007, X-Potion 0x2002, Turbo Ether 0x2005, Hi-Potion 0x2001, Elixir 0x2008); the three rare drops (Bushido, Sword and Arcane Lore, 0x9063, 0x9062, 0x9064) have no item in the repo's tables, so those slots are 0 in the kill-reward rows (the raw ids are kept in the fixture). Bribe slots are laid for Seymour (Crystal Ball, Soul of Thamasa) though his Bribe bit is clear.
- **The cup itself.** No formation row and no launcher is in the files (RE 5): rounds, rewards and recruiting are not sourced and **not built** (DU1, DU8). The cup's other fighters (Brother, Buddy, Kimahri, Lulu, Baralai, Nooj, Gippal and the rest of rows 308 to 327) are not in this chapter (DU7).
- **Positions.** The near-weighted target search needs where everyone stands; the cup ships none, so `CUP_SCENE` (Trema's scene, the same battle-map family; the Maesters' stand-in) is one named constant, `[inferred]`. The alternative is `searchUniform`, a one-line change.
- **`stat_def_death`** (Auron's Shooting Star gate): read as the girl's Death resist byte (`[I]`). The Lv 99 build has none, so his low-HP roll 0 is Shin Zantetsu, which cannot land (T0 a).
- **Action time and stature** (animation length, model height) are unread; the Den of Woe stage's default foe height (2.10 against the girls' 1.78) is the stand-in.

### T0 findings (each pinned by a test in `farplane-cup-engine.test.ts`; the numbers are what the engine produced)

1. **(a) The status layer cannot touch a Lv 99 party except at chance 254 or 255.** The status roll lands when `roll < chance + 5 x (attacker level - target level) - resist` (`kernel/statusGroup1.ts`, the game's own rule), and the duelists are Lv 67 to 74. Shin Zantetsu's Death (80), Full Break's four stat drops (100), Break's Petrify (80), Confuse (100) and Slowga's Slow (130) **can never land on the Lv 99 girls**, even with no Luck (0 of 20 seeds each); the same rows land on a Lv 60 or Lv 74 girl (pinned with the girls' level lowered by the test, a rig). Only Shooting Star's Eject (254) lands: **20 of 20 seeds**, and a girl whose Eject resist byte is 255 is never ejected.
2. **(b) Luck.** The girls wear Rabite's Foot (Luck 111): every physical move that rolls (the three Attacks, Full Break, Delay Buster, Drain Attack; accuracy formula 2) is evaded nearly always (Auron's ACC 112: about 1 in 20; Tidus's ACC 139: 8 of 20 for Delay Buster); a bare party takes every one.
3. **Shooting Star is the fight.** Formula 3 (the resist-byte race) lands at 20 of 20; an ejected girl is out of the fight (no item raises her), about 2.4 girls a fight, which is why duel 1 is the hard one.
4. **The absorbs work.** A Fire spell cast by a Black Mage Yuna heals him (negative damage, affinity "absorb"); Paine's Demi (Gravity) heals him by the cap, 9,999.
5. **Haste and Invincible are his own statuses** (Hastega 40 counts, the Hero Drink 20); he re-hastes about three times a fight.
6. **Blitz Ace** is nine real hits (each over 500, together over Rikku's 5,106 HP); at Rikku's real HP it puts her down.

## 4. The picks (the driver's, under Bailey's blanket yes; each with its alternative, his to overturn)

| # | Question | Pick (built) | Alternative |
|---|---|---|---|
| DU1 | chapter shape | **three fixed duels, a 12-second seam between them** (`nextGroupId`, `restoresPartyOnEntry`, `noSaveSphereCard` on links 2 and 3) | a full "cup" with rounds (no source) |
| DU2 | order | **Auron, Tidus, Seymour** (the rows' own order) | HP order, or the wiki's (unsourced) |
| DU3 | the second name | **"????" during the fight and the real name in the post scene** (the game's table masks it) | "Tidus" shown plainly |
| DU4 | party | **`viaInfinitoBuild` unchanged** (a deep copy) | a lower-level build (no source) |
| DU5 | arena | **the Den of Woe's own stage as a flagged stand-in** (human-sized foes, a clear boss spot, no scene edit). **A deviation from the preflight's first pick, with the reason:** the preflight took the `farplane` plate, but the registered `farplane` scene is Chapter V's Vegnagun colossus stage (a giant behind the fight and giant-sized heights for any other foe), no place for a duel between people; the preflight's alternative (c), the Den plate, is what is built | one new "Fiend Arena" plate (+3 h of art); the `road-to-the-farplane` stage |
| DU6 | music | **`boss-trema` throughout**, `victory-ffx2`, field bed `scene-bevelle-underground` (flagged stand-ins; rule 13) | per-duel cues (`boss-den-of-woe` for Auron, `boss-shuyin` for Seymour) |
| DU7 | the other fighters | **not in this chapter** | an optional second chapter "38b" (+14 h; the digests are in RE 6.5) |
| DU8 | the cup's rewards and recruiting | **not built** (not in the files) | none |
| DU9 | number and word | **38, `duelist`** (PLAN section 8, checked; the door test is the proof) | any word that passes the door test |
| DU10 | the three single-target rows aimed at the party group (Dispel, Confuse, Break) | **Dispel and Confuse go to the whole party; Break to ONE girl picked uniformly** (RE 6.4: "the engine picks one"; the repo's Oversoul Paragon sends Dispel to all). `[inferred]` | all three fanned out to the party; all three single |
| DU11 | `stat_def_death` | the girl's Death resist byte (non-zero = resistant) | the opposite reading (Shooting Star on the first non-immune girl: the fights get harder) |
| DU12 | the Lv 99 line's measured difficulty | **kept as measured**, reported in section 6; no boss row was touched | the options with numbers in section 6 |
| DU13 | the Tidus art | `characters/tidus`, `auron` and `seymour-guest` (existing party paintings; the painted actor mirrors a figure whose art faces the other way) | foe-facing sets (the art list, section 9) |

## 5. Engine work (the preflight's table, as built)

| # | Need | What was done |
|---:|---|---|
| 1 | records for 311, 317, 319 | `data/ffx2/enemies/farplane-cup.ts`, `monster-records/records-farplane-cup.ts`, three kill-reward rows |
| 2 | move rows | 33 command records, generated from the kernel tables (`command-records/farplane-cup.ts`); the party rows (Delay Buster, Hastega, Demi, Curaga, Dispel, Shell, Protect, Break, Confuse, Black Sky, Shin Zantetsu) and the item rows are the game's rows on enemy-side abilities: **an enemy can queue them with no engine change** (checked on the engine) |
| 3 | three scripts | `battle/ffx2/ai/farplane-cup.ts` (304 lines); `farplane-cup-ai.test.ts` (23) |
| 4 | enemy item use | item rows as enemy abilities: Mega-Potion is a fixed 2,000 on his side, the X-Potion is capped at 9,999 (pinned) |
| 5 | absorb of four elements and Gravity | existing `affinities`; pinned on the engine (Fire and Demi) |
| 6 | accuracy formula 3 and Eject | already in the hit kernel; Eject lands 20 of 20 and a 255 resist byte stops it (pinned) |
| 8 | a search over the enemy side for "lacks Haste" | the script reads `ctx.units` for its own side (Tidus alone; the weapon prop is visual) |
| 9 | Break Damage Limit | not on at the start (the build as given); the bench's `walk` line crosses The End's gates |
| 10 | chain plumbing | ids, number, meta, door, story, registrations (CONTRACT-CHANGES) |
| 11 | Reflect redirect | **not built** (the known gap); irrelevant here (no Reflect on either side by the records) |

## 6. Difficulty: measured, not tuned (rule 15)

`tests/unit/chapters/farplane-cup-bench.test.ts` (8 tests, 100 seeds by default, `PYREFLY_BENCH_SEEDS=<n>` for more; seeds 1 to 100, the engine deterministic, so the table is exactly reproducible), the harness `tests/unit/helpers/farplaneCupDrive.ts`. A *line* is a bot standing in for a player: `curtains` (Rikku's first two turns are a Light and a Lunar Curtain, then she mends with a Megalixir below half or a Phoenix Down on a fallen girl; Yuna and Paine cast Darkness), `darkness` (the same without the curtains), `charon` (Charon instead of Darkness), `walk` (Paine first crosses The End's red and green gates, four Changes, then Charon), `remedy`, `defend`. **No boss row was touched and the build is Chapter XIII's as given.**

| Duel | defend | darkness | **curtains** | remedy | walk | charon | girl KOs a fight (curtains) | girls ejected a fight (curtains) | minutes a fight |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 Auron | 0 | 11 | **11** | 11 | 4 | 0 | 0.40 | **2.37** | 1.2 |
| 2 the masked duelist | 0 | 33 | **45** | 45 | 21 | 0 | 2.81 | 0 | 1.3 |
| 3 Seymour | 0 | 46 | **54** | 54 | 25 | 1 | 1.69 | 0 | 1.0 |

(wins of 100 seeds a cell.) **What that says, plainly.** (a) **Duel 1 is the hard one: about one seed in nine.** Auron ejects 2.4 of the three girls a fight (Shooting Star lands every time and nothing raises an ejected girl), so the fight has to be won in about a minute; the chain from the start is ~11 x 45 x 54 percent = about 2.7 percent for the simplest bot, but a defeat on duels 2 and 3 retries only that duel, and duel 1 is a retry of itself. (b) **Duel 2** is the fast one: he opens with nine hits on one girl (a KO for any of them, 2.8 KOs a fight) and a Phoenix Down line keeps up. (c) **Duel 3** is the easy one in this engine: **his status spells (Break, Confuse, Slowga, Shin Zantetsu-class) cannot land on a Lv 99 party** (T0 a), so only Meteor, Black Sky, Ultima and Demi matter. (d) The `walk` and `charon` lines lose to the plain ones: Charon costs its caster HP and the walk spends the opening on Changes.
**Levers with numbers, for Bailey (none applied; boss numbers are never tuned):** (1) a **Lv 74 party** instead of Lv 99 makes the duelists' own status moves land (Full Break's four stat drops, Shin Zantetsu's Death at 80, Break's Petrify), which is how the game's own cup reads at its levels (RE 10 Q2), and is the harder fight, not the easier; (2) an **Eject resist for the girls** would remove Shooting Star's whole effect (an accessory with a source; none is given in the files for this); (3) the safest candidate for making duel 1 less brutal without touching a boss row is to **seed Auto-Life or more bodies**, which the sources do not give. Not measured here: the Gunner chain and Warrior lines, a delay-lock on Auron (he is immune to Interrupt and delay: special bits 6 and 9), Reflect-based lines (Shooting Star and Meteor are not reflectable). The lines, not the data, are the likely lever.

## 7. Stand-ins and what is a draft (listed)

| What | State |
|---|---|
| The three paintings | `characters/auron`, `characters/tidus`, `characters/seymour-guest`: existing party paintings used as foes, mirrored by the painted actor; **style fit as foes is unverified** (no browser read of them in this lane's unit tests; the GPU smoke, section 10, shows the first fight) |
| The arena | the Den of Woe's stage (DU5), human-sized foes at the default boss spot |
| The story | a draft for Bailey to read (`story/scripts/ffx2-farplane-cup.ts`, "A DRAFT FOR BAILEY TO READ") |
| The music | existing cues by reference (DU6); Bailey's ears decide (rule 13) |
| The chapter card and thumbnail (`chapter-ffx2-farplane-cup`) and the pause hero `pause/ffx2-farplane-cup` | keys only; the pause tab falls back to the Den of Woe plate; held until Bailey's word to list the chapter |
| The guide card and the advisor tactic | **not written**; the generic ones play (the flow test shows the shipped bench auto-battler reaches a verdict on every seed) |
| Model scales and the foe heights | the Den stage's default (2.10 against 1.78) |

## 8. The story draft

`src/story/scripts/ffx2-farplane-cup.ts`: a pre scene (the arena, "no rounds, no prizes posted", the first duelist in a red coat), **two seams** of 12.8 s and 11.0 s with the player's hands off (the arena mends the girls; the next fighter; the second's name stays hidden), **three callouts** (Auron's first Shooting Star, the second duelist's first Blitz Ace, Seymour's first Meteor) and a post scene (the hidden name is read out; one short sincere exchange; the joke restored). Our own words over the sourced beats; no line is the game's. `chapters/farplane-cup-story.test.ts` (17) holds the lint, the cast, the rations, the triggers, the budgets and the mask.

## 9. ART NEEDS (nothing below exists; no ComfyUI was run; rule 12)

The three duelists are already painted as party characters and are used as foes with the painted actor's mirror. What an art lane would add, in order of value (the preflight's count was 3 to 5 images):

| Subject (art key) | What | Notes |
|---|---|---|
| the pause hero `pause/ffx2-farplane-cup` | one plate | one of the three, or the three together |
| the chapter card and thumbnail `chapter-ffx2-farplane-cup` | two images | held until the chapter is listed |
| Seymour, a Meteor cast pose | optional | `seymour-guest` has attack, cast, hurt, idle, item, ko, victory |
| foe-facing sets for `auron`, `tidus`, `seymour-guest` | optional | only if the mirrored party sets read wrong against the Den plate |
| a Fiend Arena plate | optional (+3 h) | no source says how it looks |

## 10. Browser job specs (predictions) and the GPU smoke

All at 1600x900 and 390x844, `PYREFLY_BROWSER=gpu`, a production build, headless Chromium from node (the review-browser lock applies; the debug API `window.__pyrefly` may set a duelist's HP low to reach the later links).

| Job | Steps | Prediction |
|---|---|---|
| **J1 board** | type `duelist` on the board; also on a phone through the long-press field | party prep opens for "The Farplane Cup", numeral EXP; the board still draws nineteen cards; the cursor moves one step (the first D) and no more; nothing is written under any key |
| **J2 prep and pre scene** | read the prep card, Enter, play the pre scene | the hero art falls back to the Den of Woe plate; the tip box fits (about four lines); the pre scene is 11 lines with the bed `scene-bevelle-underground`; the last line starts the battle |
| **J3 duel 1** | first menu; defend through a Shooting Star | the boss strip names Auron; the sprite is `characters/auron` mirrored toward the party; a girl vanishes from the party plate when ejected; after the win a seam, then duel 2 opens with the girls at full HP and a fallen girl up, no Save Sphere card |
| **J4 duel 2** | first menu; Blitz Ace | the boss strip reads "????"; he opens with nine hits on one girl (a KO for Rikku); Haste appears on him; the pause screen reads "BATTLE 2 OF 3" |
| **J5 duel 3** | Meteor and Black Sky | twelve and ten damage numbers over the three; a Fire spell shows an absorb number (green, negative); the post scene names the hidden duelist |
| **J6 defeat and retry** | defend through duel 2 | the Defeat panel; RETRY goes back to duel 2, not to Auron; on duel 1 RETRY goes back to party prep |
| **J7 pause and phone** | pause on each duel; 390x844 | the chapter tab with three objectives ("Get past Auron", "Get past the hidden duelist", "Defeat Seymour"), the three snapshots resolve; on the phone the foe stands clear of the command list |
| **J8 console** | the whole run | no 404 other than missing optional paintings; no error |

The GPU smoke of this lane (the first fight by real keys to a result, one browser job under the lock) is recorded in section 12.

## 11. CHANGELOG lines (FFX-2 only unless tagged; for the integrator's release entry)

- **FFX-2 only (new hidden chapter 38, "The Farplane Cup", not on the board):** the Fiend Arena's three fixed duels in a row, opened by typing `duelist` on chapter select: Auron, the masked second duelist (Tidus), Seymour, the game's own rows and scripts, the Lv 99 party of Chapter XIII, the arena mending the party between duels. The stage is the Den of Woe's, the music a stand-in, the story a draft, the paintings the existing party ones.
- **Both games (shared plumbing, nothing a player sees):** one more typed word on chapter select (the door table, sixteen words); two more item ids in the kill-reward table (Turbo Ether, Mega Phoenix); three more kill-reward rows.

## 12. Tests and checks

(see below, filled in after the runs)
