# The Sanctuary Keeper: the beast on the Mt. Gagazet summit (a hidden FFX chapter, number 39, the word `beast`)

**Branch `ch-sanctuary-keeper`** (from `origin/r75-boss-art` `2aa42f7a7`, through the paper preflight `bb56e7631`), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX only** (AGENTS.md rule 14): the fight is the last obstacle on the mountain, before the Zanarkand ruins; CTB, aeons, the FFX status set. FFX-2's Bevelle Underground guardians are separate fights in the ATB engine and nothing here applies to them. The registry rows, the door row and the pinned lists are shared plumbing, "both" in kind (CHK-020), inert for every other chapter.
**Status: built, hidden, played in a headless browser from the title to the results by real keys (section 8), measured by scripted players over 200 seeds (section 6), no painting.** The chapter opens only by a typed word on chapter select. Listing it waits for Bailey's word. **The Keeper has no painting yet (section 7): the presenter draws its procedural silhouette; the stage is Chapter I's Mt. Gagazet plate standing in for the summit.**
Written 2026-11-06 by a Sonnet sub-agent of the release driver. **Not the Spectral Keeper** (chapter 29, the Zanarkand Dome, `m129`): a different monster with a different record and script.

Authority: Bailey, relayed by the driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (about 00:55 EST), and, 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick in section 5 is the paper preflight's own recommendation or the bench's, "driver's call, his to overturn"; the alternative is written beside it.**

## 0. What changed against the preflight (read first)

1. **The shipped front line is Tidus, Yuna, Auron, not the preflight's Tidus, Yuna, Lulu (SK2).** The preflight said the bench would run both and report. It did: the guides' line wins **138 of 200 seeds (69 percent) with Auron** (the preflight's own target band, 60 to 80) and **39 of 200 (19.5 percent) with Lulu**. Auron's Armor Break is the damage; Lulu's Bio can be a Poison Fang from Tidus's hand. One line in `src/data/ffx/builds/sanctuary-keeper.ts` turns it back.
2. **Poison first, then Reflect.** A Reflect on the Keeper bounces every spell the party casts at it back on its caster (the game's target builder: a reflectable spell at a Reflect holder on the other side goes back to the user, always), Bio included. So the answer is Bio (or a Poison Fang), then Reflect: its own Curaga then heals the party, its Esuna cures the party, and **the Poison ticks 2,000 every Keeper turn with nothing to cure it** until it is under half, when the Reflect trick of its script begins to work for it (section 3). Measured: without Poison the best line wins 1 percent; without Reflect 30.5 percent.
3. **The script is 2,407 bytes of code** (the plan's "174 KB" is the file size); it is ported whole, in two small files, and uses no new engine seam: every spell it casts is a player row the engine has, the sweep fuse is `HitReport.affectsHp` plus one draw, and the MAG write is a stat write inside the script.
4. **No engine file changed.** The edits outside new files are one-line registrations and the pinned lists that read them (section 9).

## 1. Play it

1. From the title, reach the chapter-select board. Type **`beast`** (any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it; the cursor does not move (B and T are bound to nothing; E, A and S are claimed by the word once it has begun). On a phone the long-press field on the "Chapter select" label takes the same word.
2. Enter starts the chapter: a pre scene (our draft, section 7), then the fight, the post scene and the results page. The party is Tidus, Yuna and Auron in front (Lulu, Wakka, Kimahri and Rikku on the bench: Switch is legal, as in the game), Chapter I's preset. **Escape and Flee are off for everyone; Switch and Summon are not.** A defeat is the retry card.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration.

## 2. What it is

Forty thousand HP, Defense and Magic Defense 100, no element, and it heals about 9,999 twice every six turns when nothing interferes. **Plain blows cannot win it**: the careless and the plain lines of the bench win 0 of 200 on either front line.

| Turn of the cycle (every 24 CTB, as often as Tidus) | What it does (the game's own script, RE 4.2) |
|---|---|
| 1 (the very first turn) | **Photon Wings** on the whole front line: about 1,000 each (neither physical nor magical: Protect and Shell do not reduce it), **Curse** always (no Overdrives), and rolls for Confuse 25, Sleep 50, Silence 50, Darkness 50 (three turns each) |
| 2 | **Attack** on the member with the most HP (about 1,300 to 1,550) |
| 3 | **Attack** on a random living member |
| 4 | **Mana Breath** on a random living member: **2,500 to 3,600**, half with Shell; it kills Tidus and Yuna unshelled |
| 5 and 6 | **A support turn** each: **Curaga on itself** (9,750 to 9,999: the script writes its MAG to 180 for it); or **Regen** (HP under a quarter, none on it), **Esuna** (Poison or Darkness on it), **Protect** (Armor Break on it, none on it), each later one beating the one before; or, with **Reflect on it and HP under a half**, the same spell **aimed at a party member who holds Reflect** (it bounces onto itself) or **Reflect on the lowest-HP member** (to prepare that) |

**The counter, hidden as in the game:** after any action of the party that changes its HP (a hit, a spell, an item, a heal) a count goes up; at the **3rd to the 7th** (20.00, 32.00, 28.80, 15.36 and 3.84 percent; mean 4.51) it lashes the whole line with **Tail Sweep**: about 1,000 each, **Haste taken off, each person's next turn pushed back** (three times their tick speed). Bio, Reflect, Protect, Slow and Scan do not count. **Slow on it** makes it cast Haste (on a Reflect holder, so it bounces onto itself, or on itself). It cannot be Slept, Silenced, Petrified, Zombied, Doomed, Provoked or Confused; it is immune to Delay and Gravity; Poison lands (2,000 a tick). At three quarters, one half and one quarter of its HP the script writes the "area" (presentation only: the four areas hold identical coordinates). Rewards: 6,500 gil, 11,000 AP (16,500 on an overkill), a Return Sphere, a steal of Turbo Ether.

## 3. The data and its sources (rule 6: nothing invented)

Every number is `research/re-ffx-sanctuary-keeper.md` (the game's own files: monster file `m128`, formation `mtgz08_00`, the Atel script run in the earlier lanes' interpreter; "RE n" in the files), tagged `[bytes]`, `[run]`, `[arith]`. The three move rows are pinned **word for word** to the kernel fixtures `tests/fixtures/parity/ffx/command_records.json` and `command_status.json` (rows 0x6042 to 0x6044: type, flag words, damage class, rank, chance and duration bytes, extra-status word) by `tests/unit/chapters/sanctuary-keeper-data.test.ts` (23 tests); the Attack is the game's row 0x6000 (`POSSESSED_PLAIN_ATTACK`); Curaga, Esuna, Protect, Reflect, Regen and Haste are the player's own rows, used by their ids (each is reflectable, which is the whole of the Reflect trick). **Rule 5:** Photon Wings and Mana Breath have accuracy formula 0 and never miss (`canMiss: false`); Tail Sweep and the Attack roll.

**Gaps, named (not invented):**
- **The gear drop** ("always one piece of gear": a Half MP Cost weapon, Piercing too for Auron and Kimahri, and an MP +10 percent armour) is not modelled: the loot record of `m128` is not in `loot/records.ts` (its digest is not in the repo), as for the Spectral Keeper and Penance. The Keeper pays the sourced fields (gil, AP, the Return Sphere, the Turbo Ether steal); the loot tests list it as a body without a record.
- **The party** is Chapter I's preset (`[estimate]` over a sourced build point); the Overdrive and aeon gauges on arrival, the exact bag and the armour abilities are not sourced for this fight. Nothing was tuned toward a result.
- **Height and position:** no stature row exists for `m128`; the Keeper's 3.8 is an `[estimate]`, on Chapter I's boss spot.
- **What the "area" selects** (a camera, a stage or a layer) and the launch arguments 316 and 20 were not decoded (RE 8); the area is a flag.
- **MP:** the player's rows carry their MP costs, taken from the Keeper's 256 (the engine never refuses an AI command for MP and no source says a monster runs dry).

## 4. Engine work and what the T0 checks found

The preflight's 13 rows, as built:

| # | Need | What was done |
|---|---|---|
| 1, 2 | the record, the rows; the six player rows | `data/ffx/enemies/sanctuary-keeper.ts`, `-abilities.ts`; the player rows by id |
| 3 | the six-state cycle and the override priority | `battle/ffx/ai/sanctuary-keeper.ts` and `-rules.ts` (126 and 141 lines) |
| 4 | MAG written to 180 for a support cast, 40 otherwise | a stat write in the script, **per move** (the script writes it every turn and a post-turn handler restores it; Attack and Photon Wings read no MAG, so the result is the same). Pinned: the Curaga heals 9,750 to 9,999 on every one of 24 seeds |
| 5 | the Reflect bounce | **existing** (`kernel/target-builder.ts`): pinned end to end |
| 6 | the sweep fuse | `HitReport.affectsHp` plus one `gameMod(5)` draw on every counted action, through `hit-gates.ts#react` (not while a reaction is itself resolving, not when one is already waiting: the game's queue). Pinned to the interpreter's tally: 20.00 / 32.00 / 28.80 / 15.36 / 3.84 and mean 4.51 over all 65,536 values, and 4,000 trials of the real hook |
| 7 | the Slow answer | in the script; pinned (Haste on itself, or on a Reflect holder, which bounces back) |
| 8 | the phase lines | `advancePhase`; `sk.phase` is the "area" index too; a flag, no camera cue (SK6) |
| 9, 10 | the formation; the immunities | data: Escape and Flee off for everyone; the status bytes (Poison 90, Power and Magic Break 50, Darkness 100, the rest 255 or 0) and the flag bytes |
| 11 | HUD | none new |
| 12 | presentation | a stage on Chapter I's plate; the painting is owed |
| 13 | chapter plumbing | `chapter-sanctuary-keeper.ts`, `-meta-`, the door, the registrations |

**T0 findings (each pinned by a test):**
1. **The Reflect trick works end to end on the engine.** Reflect on the Keeper above half: its Curaga heals a party member, not itself. Under half with a Reflect holder in the party: both support turns are aimed at him and bounce back (it is healed twice). Under half with none: the first support turn is Reflect on the lowest-HP member, the second is aimed at him.
2. **Poison plus Reflect is the whole answer.** With both on it above half, both support turns are Esuna, bounced to the party, and the Poison stays: five ticks of 2,000 and no heal.
3. **Bio is reflected like any spell** (see section 0 item 2): the order is Bio, then Reflect.
4. **Photon Wings can put the whole party out at once** (all three Confused or asleep, about 1.5 percent a cast): nobody has a turn, the Keeper goes on, and the engine's stalemate rule ends a fight with no HP progress for 400 turns as "escape". The tests read their stop condition after every decision for this reason.
5. **Tail Sweep takes exactly three times the tick speed off each person's clock and strips Haste** (`status-remove haste` with reason `dispelled`), checked on six seeds with the counters read at the action's start and end.
6. **The Keeper never acts before the first menu** (0 of 100 seeds): the old Auron tip line ("He moves after you") is true and is keyed.
7. **Rewards:** a kill pays 6,500 gil, 11,000 AP and a Return Sphere (the results page shows them, section 8).

## 5. The picks (the driver's, under Bailey's blanket yes; each with its alternative, his to overturn)

| # | Question | Pick (built) | Alternative |
|---|---|---|---|
| SK1 | number and word | **39, `beast`**, not listed (the door test pins sixteen words; `beast` overlaps none, in any position) | any word that passes the door test |
| SK2 | front line | **Tidus, Yuna, Auron** (the bench: 69 against 19.5 percent for the advisor's line) | Tidus, Yuna, Lulu (the preflight's pick); one line in `builds/sanctuary-keeper.ts` |
| SK3 | build | Chapter I's preset as is; **Confuse Ward not applied** (a lever, measured: section 6) | a later-point build (too strong); Confuse Ward on every free slot (the bench: 93.5 percent) |
| SK4 | arena | **(a) Chapter I's Gagazet plate as is** (0 new plates; it is the mountain trail, not the summit) | (b) a summit variant derived from the approved plate (mock beside it first); (c) a new plate |
| SK5 | the Keeper's look | **a new painting, 5 to 6 poses, owed**; the stage draws its procedural silhouette; Th'uban (row 54) reuses it | a repaint of `spectral-keeper` (a different monster: flagged, unverified fit) |
| SK6 | the three "area" changes | **a flag only** (`sk.phase`), no camera cue built | camera cues at the HP lines (a slow push or a pan; a mockup first, rule 9) |
| SK7 | the sweep fuse | **hidden, as in the game**; the card and the guide teach the mean | an on-screen tell (not faithful) |
| SK8 | aeons | allowed (Summon is not disabled); the bench's lines do not use one (untried) | barred (not faithful) |
| SK9 | music | scene bed `scene-gagazet`, battle cue **`boss-seymour`** (Chapter I's, the fight on the same mountain), victory `victory-ffx`: **flagged stand-ins** (the game plays its Boss Theme; Bailey's ear decides, rule 13) | `battle-ffx`, or a new take under the delegation (needs a spend note, rule 11) |
| SK10 | start | Normal (the formation writes it) | none |
| new | MAG | a stat write per move inside the script (section 4 row 4) | a hook that writes per cast (the same numbers) |
| new | the tip on the card | "Plain blows cannot outrun its healing. Poison it, then Reflect it, and its own spell mends you. Shell before the breath." (the bench's order; 120 characters, so it fits the prep card's band at 1600 x 900 and needs no short form) | the card's first wording named the Reflect first and was wrong, then ran six lines and overflowed the band (`prep-tip-band.test.ts` said so): shortened |

## 6. Difficulty: measured, not tuned (rule 15)

`tests/unit/chapters/sanctuary-keeper-bench.test.ts` (7 always-on at 60 seeds a cell, 1 behind `SANCTUARY_BENCH=200`), the harness `tests/unit/helpers/sanctuaryBot.ts` and the tool `node --experimental-transform-types tools/sanctuary-keeper-bench.mjs --seeds 200 --front tidus,yuna,auron`. **No boss number was touched**; the levers are the party's own commands, the front line, Luck, the bag and the armour. A *line* is a scripted player that reads only what a player reads: **careless** (everyone Attacks), **plain** (care and Attack), **advisor** (the guides' play: Hastega, Bio or a Poison Fang then Reflect on the Keeper, Shell and Protect on each member, Armor Break, Dispel on a party Reflect once it is under half, Phoenix Down, Echo Screen, Esuna and Curaga as the skeleton), and the advisor with one piece removed.

**The table of record, 200 seeds a cell (seeds 1 to 200), no god mode:**

| Line | Tidus, Yuna, **Auron** (shipped) | Tidus, Yuna, Lulu |
|---|---:|---:|
| careless | **0** of 200 | 0 |
| plain | **0** | 0 |
| **advisor** | **138 (69 percent)** | **39 (19.5 percent)** |
| no Reflect | 61 (30.5) | 3 (1.5) |
| **no Poison** | **2 (1)** | 0 |
| no Shell | 129 (64.5) | 32 (16) |
| no Haste | 129 (64.5) | 11 (5.5) |
| no Dispel | 129 (64.5) | 1 (0.5) |

Median fight for the advisor with Auron: 290 ticks (two cycles), the Keeper's HP at the end 0 (the median of a won-in-69-percent cell) and the median of the lowest HP it reached 1,826; about 2.3 sweeps and 3.6 KOs a fight. **The plan's target (about 70 percent for the advisor's line, 60 to 80 accepted, a careless line under 20) is met by the shipped front line (69; careless 0) and not by the preflight's (19.5).**

**What that says, plainly.** (a) **The preflight's predictions held:** plain blows lose outright (0 of 200); Mana Breath is the death clock (unshelled, it kills Tidus and Yuna; 3.6 KOs a fight with Shell, 4.7 without); Photon Wings' roll of Confuse is the biggest single danger (below); a Reflected Curaga is a free heal for the party; the sweep comes about once a cycle, so Hastega is cast again about once a cycle (the no-Haste ablation matters little with Auron, a lot with Lulu: 5.5 percent). (b) **Poison and Reflect are the movers**; Shell, Haste and Dispel are inside the noise at this front line. (c) **Auron's Armor Break is the damage**: with the Keeper Reflected, its Protect answer bounces to the party and it never gets it.

**Levers with numbers, for Bailey** (the advisor's line, 200 seeds; none is applied): **Confuse Ward on every free armour slot: 93.5 percent with Auron, 26.5 with Lulu** (Confuse is what scatters the party: it is the guides' own advice and the preset leaves it out); **Luck 40 on everyone: 78 and 34 percent**; the bag's Echo Screens, Remedies, Eye Drops and Holy Waters raised: no change (the bot cures with what the preset already holds). **Driver pick: keep the preset as Chapter I's with Auron in front, and say so;** if Bailey wants it easier, Confuse Ward is one armour ability and the lever with the biggest effect. **Not tried (named):** an aeon to take the first Photon Wings (the guides' advice), a Switch to Lulu or Auron mid-fight, the Overdrives (Curse takes them for most of a cycle), Slow while Reflected, Mental Break, Holy Water for Curse, Poison Fang beside Bio, Cheer. They are the line's, not the data's; a thinking player's ceiling is above these numbers.

## 7. Stand-ins and what is a draft (listed)

| What | State |
|---|---|
| **The Keeper's painting** (`characters/sanctuary-keeper/`) | **none exists**: the presenter reads the art manifest and draws its procedural silhouette silently (the smoke saw no console error and no 4xx/5xx for it) |
| The stage | Chapter I's Mt. Gagazet plate and scene, the party on Chapter I's slots, the Keeper on its boss spot at 3.8 `[estimate]`; the summit has no plate (SK4) |
| The story | a draft for Bailey to read (`story/scripts/sanctuary-keeper.ts`: eleven lines before, six after; the Keeper speaks no word; "THIS IS A DRAFT FOR BAILEY TO READ") |
| The music | existing cues by reference (SK9); Bailey's ears decide |
| The chapter card and thumbnail | `thumbnailKey` is Chapter I's card (`chapter-seymour-flux`); the chapter's own is owed and unused until the board lists the chapter |
| The pause hero `pause/ch39-sanctuary-keeper` | not made; the pause tab falls back to the Gagazet plate (`heroArtFallback`) |
| The camera cues at the HP lines (SK6) | not built (no mockup was shown: rule 9) |
| The guide card and page, the advisor's tactic line | **not built** (the Spectral Keeper's lane left the same owed); the engine's own coach already names the right cures at the menu (the smoke's first-menu frames) |
| The painted effects (the wings' burst, the tail sweep, the breath) | may be drawn in code; none exist |

### ART NEEDS (nothing below exists on disk; no ComfyUI was run, nobody generated art: rule 12, and only Bailey approves a painting)

Style reference: the approved boss sets in `public/art/characters` (`yunalesca-1`, `spectral-keeper`: idle with `baselineY`, attack, cast, hurt, ko, `idle@2x`), the painted 2.5D look, facing left toward the party, a sidecar JSON each (`width`, `height`, `baselineY`, `pose`, `facing`, `nonBiped`). Retail references are allowed (hard rule 8 lifted 2026-10-18); the painting that ships must match the approved painted look.

| Subject (art key) | Poses | Notes |
|---|---|---|
| **The Sanctuary Keeper** `sanctuary-keeper` | idle, attack (the tail), cast (Mana Breath and the support spells), **wings** (Photon Wings), hurt, ko (the body stays: death animation "Boss"), idle@2x | a winged beast with a long tail, per the rows; **Th'uban (program row 54) reuses the painting** with a colour change, so it is painted once for two chapters |
| the portrait | one, cut from the idle | the CTB tile |
| the pause hero `pause/ch39-sanctuary-keeper` | one | the Keeper close and low over the summit |
| the card `chapter-sanctuary-keeper` and its thumbnail | two | unused until listed |
| a summit variant of the Gagazet plate (optional, SK4 (b)) | one | colder sky, flatter ridge, the ruins' glow on the horizon; derived from the approved plate, which stays untouched |

**Count: 6 poses + @2x + portrait + pause hero + card + thumbnail = 11 required images** (+1 optional plate), each with a sidecar, a row in `tools/posescale/subjects.json`, the mirror's `manifest.json` rebuilt and `src/data/art/poseRegistrationFoes.ts` regenerated by `tools/posescale/measure.py table` (generated, never edited). Art route is the driver's (the Art Room).

## 8. Browser job specs, with predictions (written first; what the run said beside each)

Headless Chromium from node, `PYREFLY_BROWSER=gpu`, a dev server on a port of its own, the review-browser lock, `node tools/fx-assets.mjs ensure` first; `node tools/sanctuary-keeper-smoke.mjs` (the tool plays them all). The party's HP is kept up by a state edit through the debug API (said so), the Keeper's HP is set to 1 for the last blow; **every command is a real key press**.

| Job | Prediction | The run |
|---|---|---|
| **J1 the board and the word (1600x900)** | the board draws nineteen cards and none for the chapter; typing `beast` opens party prep for "The Sanctuary Keeper" (numeral EXP), Tidus, Yuna and Auron in front, four on the bench; the tip box fits | **as predicted**: 19 cards, no card, party prep holds after the word (`docs/screenshots/ch-sanctuary-keeper/desk-0-board.jpg`, `desk-1-party-prep.jpg`) |
| **J2 the pre scene and the first menu** | eleven lines play over the mountain; the first menu opens with the Keeper alone at 40,000 on Chapter I's plate, the procedural silhouette at screen x about 0.67 to 0.80, inside the rail; the coach's first card appears | **as predicted** (`desk-2-pre-scene.jpg`, `desk-3a-first-menu-clear.jpg`); the Keeper's silhouette stands on the boss spot inside the rail, its name tag reads SANCTUARY KEEPER, the party panel overlaps its feet (as in every Gagazet fight) |
| **J3 a real Attack, then Photon Wings** | one Attack takes about 420 to 475 off (Tidus); the Keeper's first action is Photon Wings: three numerals near 1,000, Curse on all three, status icons for what rolled | **as predicted**: 40,000 to 39,575; first action `sanctuary-photon-wings`; Curse on all three; Sleep, Darkness, Silence and Confuse rolled on different members (`desk-4-after-photon-wings.jpg`) |
| **J4 the counter** | within 24 real Attacks the Keeper answers with Tail Sweep on the three; after it the cycle goes on in the game's order | **as predicted**: the sweep came within the window (`desk-5-after-tail-sweep.jpg`); the cycle check is in the run's output |
| **J5 the win** | the Keeper at 1 HP falls to one real Attack; the post scene plays (six lines) and the results page reads 6,500 gil, 11,000 AP for each of three and a Return Sphere | **as predicted**: "MT. GAGAZET — THE SUMMIT · CLEARED", Victory, AP 11,000 x3, GIL 6,500, ITEMS Return Sphere (`desk-7-results.jpg`); **no console error, no 4xx or 5xx** |
| **J6 a phone (390x844, touch)** | the Gagazet scene has phone rigs for Chapter I's fight; the Keeper's silhouette and the party are on screen and the command list does not cover the Keeper; the typed word works through the long-press field | **as predicted, and the same checks pass**: the silhouette stands on the right of the frame, the party on the left, the command list (Attack, Special, White Magic, Items, Flee, Escape, Defend) is below and covers neither; the intent strip over the scene reads "Photon Wings, CURSE 100 percent, Tid 937 to 1,058, Yun 937 to 1,058, Aur 937 to 1,058", which is the note's range for the row (`phone-3a-first-menu-clear.jpg`); the whole fight plays to the results (AP 11,000 x3, 6,500 gil, a Return Sphere; `phone-7-results.jpg`); no console error and no 4xx or 5xx. **The word was typed with the keyboard** (Playwright's `keyboard.type`), not through the long-press field; the field is `doorField.ts`'s and takes any word in `CHAPTER_DOORS` (the door suite pins the word list), so it was not run separately |

**What the two runs found beyond the predictions:** (1) the engine's own coach already teaches the right cures at the first menu after Photon Wings ("GUIDE SILENCE: Echo Screen, Esuna or a Remedy cures it; Tidus is cursed: Holy Water cures it"), so the chapter needs no coach copy of its own; (2) the cycle in the browser is the game's order with the counter between ("Photon Wings, Attack, Tail Sweep, Attack, Mana Breath, Tail Sweep, Curaga, Curaga"), which is what the script is meant to do when the sweep fuse fires early; (3) the first run's cycle check was written too strictly (it did not allow a sweep before the second Attack) and failed once; the tool now plays on until the Keeper has taken six turns of its own, and the second run is the record; (4) the phone run needed no change.

**Not run (named):** an aeon summoned in the browser, the Reflect trick in the browser (the engine tests pin both end to end), the pause screen's chapter tab, and a second seed.

## 9. Files and merge hot spots

New: `src/data/ffx/sanctuary-keeper-ids.ts`, `chapter-sanctuary-keeper.ts`, `chapter-meta-sanctuary-keeper.ts`; `src/data/ffx/enemies/sanctuary-keeper.ts` and `-abilities.ts`; `src/data/ffx/builds/sanctuary-keeper.ts`; `src/battle/ffx/ai/sanctuary-keeper.ts` and `-rules.ts`; `src/scenes/sanctuary-keeper.ts`; `src/story/scripts/sanctuary-keeper.ts`; `src/app/screens/frontend/beastDoor.ts`; `research/re-ffx-sanctuary-keeper.md`; `docs/plans/ch-beast-review.md`; the tool `tools/sanctuary-keeper-bench.mjs` and the smoke `tools/sanctuary-keeper-smoke.mjs`; the helpers `tests/unit/helpers/sanctuaryDrive.ts` and `sanctuaryBot.ts`; nine test files (`chapters/sanctuary-keeper-{data,ai,engine,bench,board,door,story,scene,absence}.test.ts`).

Shared files touched (all additive and inert elsewhere; **likely conflicts with the other new-chapter lanes, for the integrator, in order**):
1. `src/data/encounters.ts`: `ChapterId`, `ListedChapterId` and `Chapter.number` gain `'sanctuary-keeper'` and `39` (the same three lines every lane edits: take the union; 399 of 400 lines, no line added).
2. `src/data/chapters-experiments.ts`, `src/data/chapter-meta.ts` (**now exactly 400 lines**: fold an import before the next lane adds one), `src/data/ffx/enemies/hidden-ffx.ts`, `src/data/ffx/command-records/enemies.ts`, `src/battle/ffx/ai/index.ts`, `src/battle/ffx/kernel/forced-action-table.ts` (m128's forced action is Tail Sweep 0x6044), `src/app/screens/frontend/chapterDoors.ts` (the word `beast`, the sixteenth), `src/engine/pyreflyCanon.ts`, `src/engine/tactics/lookup.ts`, `src/data/art/artNamespace.ts`, `src/scenes/experiment-scenes.ts`, `src/ui/coach/turnOrderLine.ts`, `critic/runner/lib/route-pure.mjs`: one item each.
3. Pinned lists and fixtures: `chapter-doors`, `critic-route-doors`, the neighbour lists of `gagazet-door`, `yojimbo-door` and `summon-door` (their pair tests' 180 s raised to 240 s for sixteen doors), `data-ffx-command-records` (**522 abilities and 519 records**: three rows), the gaze-class fixture (`0x6042`, `0x6043`, `0x6044`), `parity-ffx-loot-data` and `parity-ffx-engine-loot-battles` (a body without a record), `parity-ffx-isaaru-commands` (the groups that carry `commandDisables` gain `sanctuary-keeper`), `prep-tip-band` and `prep-tip-short-forms` (they pinned "32 chapters"; they now count the registries, so every later hidden chapter's lane makes the same edit and the merges are clean), `audio-music-batch2` (the mountain's bed and `boss-seymour` by reference), `r62-auron-turn-order-tip`, `scene-backdrop-file`, `party-stature-chapters`, the two seeded oracle pools (`tests/unit/helpers/ffxEngineWiring.ts#SANCTUARY_OWN_ROWS`, read by `ffxEngineStatus.ts`: the Keeper's three rows stay out of the seeded samples, as the Spectral Keeper's do out of the wiring one; with them in, the status oracle's picks moved onto its situation 448, an older Mix (`mix-dark-rain`) whose engine and oracle words differ: **a latent difference in that Mix, found by the sample shift and not caused by this chapter; named for the driver, not chased**), `exp-fayth`, `exp-windwaker` and `exp-yrp-3d` (the hidden scenes' side table: this chapter's row is appended last; the Wind Waker's test no longer asserts it is the last).
4. `docs/CONTRACT-CHANGES.md`: the entry on top. **`CHANGELOG.md`, NOW.md, ACTIONS.md and DECISIONS.md are not edited** (the integrator writes them; the lines are in section 11).

No source file added is over 400 lines (the longest, `sanctuary-keeper-rules.ts`, is 141). Two new test files are near the line (the engine 395, the AI 342).

## 10. Tests and checks

- `node node_modules/typescript/bin/tsc --noEmit`: clean. `node tools/orphans.mjs`: 24 orphaned of 2,354 modules, the same 24 as before, none of this lane's.
- **This chapter's tests, all green: data 23, AI 27, engine 24, bench 6 (+1 skipped table), board 13, door 4, story 10, scene 5, absence 4 = 116 tests, 1 skipped.** The AI file pins the cycle order on six seeds, the nine override cases, the phase lines, the sweep fuse's exact distribution and 4,000 trials of the real hook, the Slow answer and the self-exclusion; the engine file runs Photon Wings, Mana Breath, Tail Sweep, the Reflect trick, Poison with and without Reflect, Protect, Regen, the immunities, the menu, an aeon and the payout on the real engine; the bench file plays seeds 1 to 3 to a result twice and pins the win counts as bounds.
- The 18 shared files the registrations touch (the pinned lists above): **334 tests, all green** (after the edits; 17 failed before them, each a list that had to learn the new chapter).
- FULL_SUITE_PLACEHOLDER
- `node tools/critic-plan.mjs --paths <the shipped src files>` was not run in this tree; by the Keeper's reading (the chapter registry, the shared combat core and the FFX engine are each a DEEP row) expect review DEEP, focused before deploy, live verification and the deep review after; not save-data class (`SaveData.ts` untouched). Ship it with the other wave-2 chapters to share one deep review (the deploy cap).

## 11. CHANGELOG lines (FFX only; for the integrator's release entry)

- **FFX only (new hidden chapter 39, "The Sanctuary Keeper", not on the board):** the beast on the Mt. Gagazet summit, opened by typing `beast` on chapter select: the game's own six-turn cycle (Photon Wings, two Attacks, Mana Breath, two support turns), its Curaga, Esuna, Protect, Regen and Reflect trick, and the hidden counter that answers three to seven blows with a Tail Sweep that strips Haste and delays everyone. Poison it, then Reflect it, shield before the breath. Tidus, Yuna and Auron in front, Chapter I's party. The painting is a stand-in, the story is a draft, the music is a stand-in.
- **Both games (shared plumbing, nothing a player sees):** three more rows in the FFX command-record table, a sixteenth door word, and the pinned lists that read them.

## 12. Owed, and open questions for Bailey

- **Owed (built nowhere):** the Keeper's painting and the card art (section 7); the camera cues at the HP lines; a mockup of the summit variant of the plate; the guide card and page and the advisor's tactic line; the pause hero; Th'uban (row 54) after the painting.
- **The Keeper's size on the stage** (3.8, `[estimate]`) and the plate (the mountain trail stands for the summit): read in the browser job and judged by Bailey.
- **Questions:** (1) Is 69 percent for the guides' line with Auron (and 19.5 with Lulu) the right hardness, or should the preset carry a Confuse Ward (93.5 percent)? (2) Hidden behind `beast` (this build) or listed on the board now? (3) The Keeper's look and the plate: three concepts each are still to be drawn (SK4, SK5), rule 9. (4) The music: `boss-seymour` is Chapter I's cue as a stand-in; the game plays its Boss Theme.
- **Live checks nobody has made (RE 8):** what the "area" index selects, the launch arguments 316 and 20, whether Th'uban's script is this one with other numbers (row 54's question).
