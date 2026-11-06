# The Dark Aeons: Valefor, Ifrit, Ixion (twice), Shiva, Anima and Bahamut (a hidden FFX chapter, number 34)

**Branch `ch-dark-aeons`** (from `origin/r75-boss-art` `b98906229`, through the paper preflight `b0f1ec35c`), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX only** (AGENTS.md rule 14): the Dark Aeons exist only in the International and HD Remaster builds of FFX; CTB, aeons, the Overdrive gauge and the FFX status set. No FFX-2 or FF7 file changes behaviour; the registry rows, the door row and the scene row are shared plumbing, "both" in kind (CHK-020), inert for every other chapter.
**Status: built, hidden, played in a browser from the title to link 2 (section 8, J1), no paintings.** The chapter opens only by a typed word, **`darkaeon`**. Listing it waits for Bailey's word. **The six Dark aeons have no painting yet (section 7): the presenter draws its procedural placeholder for them; all seven plates are existing backdrops standing in.**
Written 2026-11-06 by a Sonnet sub-agent of the release driver.

Authority: Bailey, relayed by the driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (to building Penance, the Dark Aeons and every researched boss he never picked; about 00:55 EST), "you can spend as much meshy credits as you see fit" (not used here) and, 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick in section 4 is the paper preflight's own recommendation, "driver's call, his to overturn"; the alternative is written beside it.**

## 1. Play it

1. From the title, reach the chapter-select board. Type **`darkaeon`** (any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it. **The first letter D is the board's `right`, which a first letter cannot claim, so the cursor takes one step** (as the `daigoro` door's does, `tests/unit/chapters/dark-aeons-board.test.ts`); A, R and E are claimed by the word; K, O and N are bound to nothing, so the last letter leaves no press latched. On a phone the long-press field on the "Chapter select" label takes the same word.
2. Enter starts the chapter: a pre scene on the airship's deck (our draft, section 6), then **link 1: Dark Valefor**. After each fall a seam (the foe goes with the light, two lines, a white-out, the next place, the plate swaps) and the next fresh fight: **Dark Ifrit, Dark Ixion (twice: the second fight is another script), Dark Shiva, Dark Anima, Dark Bahamut**, then the post scene and the results page. Every link from the second on opens at full HP and MP with every aeon whole and **no Save Sphere card**; items spent stay spent (the Phoenix Downs, the gil Yojimbo is paid from); statuses do not carry. A defeat on links 2 to 7 retries **that link**; a defeat on link 1 starts the chapter over. Escape is off on all seven links.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration. The party is Tidus, Yuna and Auron in front (Lulu, Wakka, Kimahri and Rikku on the bench), HP 9,999, every other stat 255, Luck 60, Auto-Haste, Auto-Phoenix, Auto-Protect and Ribbon, Break Damage Limit on every weapon (the Mirror Aeons' preset, `[estimate]`), Yuna's ten aeons with Anima.

## 2. What it is

| Link | Foe (formation) | HP | Gauge per own turn / per allowed hit | First Overdrive, own turns, no hits | What it does | Counters |
|---|---|---:|---|---|---|---|
| 1 | **Dark Valefor** (`bsil07_70`), the road | 800,000 | +5 / +15 | 21st | Attack, Energy Ray (all), Sonic Wings (delay); **Energy Blast 50,279 on all** | none |
| 2 | **Dark Ifrit** (`bika03_70`), the desert | 1,400,000 | +10 / +5 | 11th | **Meteor Strike 21,664 on one every turn**; **Hellfire 32,497 on all** | **his Attack on every hit event** |
| 3 | **Dark Ixion, first fight** (`kami03_70`), the plains | 1,200,000 | +5 / +10 | 21st | Thundaja (one), **Aerospark (one; strips buffs and Auto-Life)** | **his Attack (Sleep, Armor Break, Mental Break; can miss) on every hit event** |
| 4 | **Dark Ixion, second fight** (`kami03_71`) | 1,300,000 written over 1,200,000 | +10 / +10 | 11th | Attack (Confuse; can miss), Aerospark; **Thor's Hammer 18,240 on all + four Breaks** | none |
| 5 | **Dark Shiva** (`mcyt00_70`), the temple road | 1,100,000 | +10 / +10 | 11th (her turns cost 3 to 6 ticks) | Attack (rank 1, strips buffs and Auto-Life), **Heavenly Strike (rank 2: Death, Berserk, Confuse)**; **Diamond Dust 85,123 on all** | none |
| 6 | **Dark Anima** (`mtgz01_70`), Gagazet | 8,000,000 | +10 / +5 (ungated) | 11th | **immune to every magical command, absorbs four elements**; Mega Graviton, **Pain (Death 255)**, Attack; **Oblivion about 86,700 on all** | none |
| 7 | **Dark Bahamut** (`dome06_70`), the Beyond | 4,000,000 | +10 / +10 | 11th | Attack every turn (13,221 on one); **Mega Flare 42,742 on all**; **Luck 102** | **Impulse on all (Slow 255, Petrify, four Breaks) on every fifth allowed hit** |

Every number is the game's own, from `research/re-ffx-dark-aeons-six.md` ("RE six n"): the files `m334` to `m339` and the seven formations, `[bytes]` and `[run]`, with a source note on every line. **The gauge counts hit events, and a many-blow action (an Overdrive) is one event.** Escape and Flee are disabled in five formations (Valefor, Ifrit, Shiva, Bahamut, Anima); Dark Ixion's two disable neither (RE six 2.2).

## 3. The data and its sources (rule 6: nothing invented)

`tests/fixtures/parity/ffx/dark_aeons_six_rows.json` holds the six stat records, the six loot records and the 24 move rows as decoded fields with their offsets, **generated from the game's files by a script (nothing typed by hand)**; `tests/unit/chapters/dark-aeons-six-data.test.ts` (80 tests) compares the enemy data, the command records and the abilities to it field by field, and the ten numbers of every record to the note's table typed a second time. The 24 rows are **21 distinct**: the two Hellfire rows (0x410C, 0x410D), the two Thor's Hammer rows (0x4111, 0x4112) and the two Aerospark rows (0x4110, 0x4116) are identical in every mapped field and are carried once, with a test that pins the equality (the pair differs only in an animation `[inferred]`); Mega Graviton is the row the Dark Magus Sisters share, carried by the Mirror Aeons' data. **Rule 5:** every row is `canMiss: false` except Dark Ixion's two Attack rows (0x4114, 0x4115), which carry accuracy formula 2 on the byte 254 (`percent = 290 - (Evasion + Luck)`).

**Where the note and the engine differ or add (the T0 checks, each a test in `dark-aeons-six-engine.test.ts`, 30 tests):**

1. **L1, Dark Ixion II's HP (not proved in play).** The record's maximum is 1,200,000 and the second fight's script writes 1,300,000 into the current HP. `applyDarkAeonsSixSetup` writes it as the game's set-up does and **the engine lets a combatant start above its maximum, but the first damaging blow clamps it back to the maximum** (the damage code's clamp): the over-maximum lasts until the first hit. In effect the fight is 1,200,000 HP plus a first blow that only removes the overage, which is what Jegged, GameFAQs and StrategyWiki print. Whether the game clamps the same way is the live check; the data labels it `[bytes]`.
2. **Dark Anima's immunity beats her absorb for spells.** A Fire spell does nothing at all, not even a heal: the special-word bit cancels the HP class before the absorb could flip it. Her absorbs show only where the command is not magical (Ifrit's Hellfire, "neither", heals her: tested).
3. **Auto-Phoenix needs a living holder.** A group Overdrive that takes all three at once is the end of the battle (no rescuer left); with Auto-Life on all three they stand up again. Aerospark and Dark Shiva's Attack strip Auto-Life; the other five Overdrives leave it. **No Overdrive but Aerospark is less than a KO on an undefended 9,999-HP person; Aerospark does about 6,100 through Auto-Protect.**
4. **Dark Shiva's ranks work on the CTB:** the gap to her next turn is exactly 3 ticks after her Attack and 6 after Heavenly Strike (five seeds), so she acts about every 4.
5. **Dark Ixion's blade** never hits a member whose Evasion plus Luck reaches 290 (255 + 60 is 315; 230 + 60 is 290: 8 of 8 seeds a miss) and always hits at Evasion 0 (percent 230).
6. **One hit event per action:** a plain Attack +15 on Dark Valefor, Slice & Dice (many blows) +15 once, Provoke (no damage; the aeon is immune) +15 too. Dark Ifrit answers an Overdrive once. Dark Bahamut's first Impulse comes on the fifth allowed hit and one per five after.

## 4. The picks (the driver's, under Bailey's blanket yes; each with its alternative, his to overturn)

| # | Question | Pick (built) | Alternative |
|---|---|---|---|
| DA1 | chapter shape | **One chapter, six stops, seven fresh links**; `nextGroupId`, `restoresPartyOnEntry`, `restoresAeonsOnEntry`, `noSaveSphereCard`, `checkpointOnEntry` on links 2 to 7; the last link pays every link's spoils (`poolsChainSpoils`); the bag carries | six links with Ixion once; a picker of six (a new screen, rule 9) |
| DA2 | order | **Valefor, Ifrit, Ixion I, Ixion II, Shiva, Anima, Bahamut** (one array, `DARK_SIX_LINKS`) | the Jegged order (Bahamut before Anima); a ladder by HP |
| DA3 | number, id, word | **34, `dark-aeons`, `darkaeon`**, not listed. The door test (`chapter-doors.test.ts`, sixteen words) is the proof | any word that passes the door test (`dark` alone fails: it ends in `k`, which `keeper` begins with) |
| DA4 | party | **Tidus, Yuna, Auron** on `builds/dark-aeons.ts`, a spread of the Mirror preset | Tidus, Yuna, Lulu; Tidus, Yuna, Wakka. **Measured: the third seat changes nothing on the two long links** (section 5) |
| DA5 | preset numbers | the Mirror preset as is (17 Phoenix Downs, 1,500,000 gil, Luck 60, Evasion 255, Yojimbo's gauge 0), **Evasion a new named lever** (`DARK_AEONS_PARTY_EVASION`) | other values: section 5 prints them |
| DA6 | aeons | the full roster including **Anima** (27,862 HP at 600 battles, gauge 55 `[estimate]`), Yojimbo and the Sisters | the six story aeons only |
| DA7 | matching aeon | not barred (the first note's section 9) | bar it (needs his yes, rule 10) |
| DA8 | Escape | **off on all seven**, a departure for Dark Ixion alone (his two formations disable nothing) | on for the two Ixion links |
| DA9 | start | Normal on all seven (the game rolls for Dark Anima) | the game's roll for Dark Anima |
| DA10 | arenas | existing plates, provisional: Valefor `mushroom-rock-road`, Ifrit `bikanel-desert-provisional`, Ixion `mushroom-rock-road-ruined` (a storm-struck road for the Thunder Plains; seen: its lightning towers fit), Shiva `macalania-temple`, Anima `gagazet`, Bahamut `zanarkand-dome`. **Four plate looks (floor row, bands) are an estimate read off each plate by eye** (`MUSHROOM_PLATE_LOOK`) | new plates (a Besaid slope, the Thunder Plains) |
| DA11 | paintings | a Dark recolour of each player aeon's painting (section 7); **none made** | one hue per aeon; a fresh repaint |
| DA12 | music | stand-ins by reference: `scene-gagazet`, `boss-challenge` for six, `boss-yojimbo` for Bahamut, `victory-ffx` | one cue; an own cue (D-685) |
| DA13 | story | **a draft in our words** (airship pre scene, six seams, seven callouts, a post scene; `story/scripts/dark-aeons.ts`, "THIS IS A DRAFT FOR BAILEY TO READ") | none |
| DA14 | the gauge on screen | **not built**; the first Overdrive of each foe is announced by a callout (one line) | the boss strip's intent slab reads "Overdrive next"; a party-side gauge widget (a mockup first, rule 9) |
| DA15 | Ixion II's HP | the file's 1,300,000 over 1,200,000 is carried and the engine clamps it at the first hit (section 3, item 1) | 1,200,000 only |
| DA16 | listing, Pilgrimage | not listed, not a Pilgrimage stop | list it behind his word |
| new | the advisor's line | **Yojimbo is called in and paid 100,000 a turn against the two long fights only** (the purse is one for the whole chain), an aeon is sent in ahead of an Overdrive, Auto-Life on everyone, Dispel for Impulse's Breaks (section 5) | the line without Yojimbo wins neither long fight |

## 5. Difficulty: measured, not tuned (rule 15)

`tests/unit/chapters/dark-aeons-bench.test.ts` (8 always-on, 2 behind `DARK_AEONS_BENCH=1`), the harness `tests/unit/helpers/darkAeonsBench.ts` and the tool `node --experimental-transform-types tools/dark-aeons-bench.mjs --seeds 200 --chain`. **The plan's target (about 70 percent per link and for the chain, 60 to 80 accepted, a careless line under 20 percent) is NOT met and is reported, not tuned: no boss row was touched and the preset is the Mirror preset unchanged.**

**The table of record, 200 seeds a cell (seeds 1 to 200), the preset as shipped:**

| Link | advisor | careless (plain Attack) | no Zanmato | no aeon fodder | no Auto-Life | Pay 1,000,000 |
|---|---:|---:|---:|---:|---:|---:|
| 1 Valefor | 100 | **100** | 100 | 100 | 100 | 100 |
| 2 Ifrit | 99 | **100** | 99 | 100 | 98 | 99 |
| 3 Ixion I | 100 | **100** | 100 | 100 | 100 | 100 |
| 4 Ixion II | 100 | 0 | 100 | 100 | 100 | 100 |
| 5 Shiva | 100 | 1 | 100 | 100 | **57** | 100 |
| 6 Anima | **46** | 0 | **0** | 46 | 46 | 22 |
| 7 Bahamut | **35** | 0 | **0** | 35 | 35 | 21 |
| **whole chapter, first try** | **19** (37 of 200; lost at link 6: 103, at link 7: 56) | 0 | 0 | 19 | 9 | 0 |

**What that says, plainly.** (a) **Valefor, Ifrit and the first Ixion are too easy for the preset**: a careless line wins them every time (a Lv-99 party with Break Damage Limit kills them in 9, 17 and 36 blows). The lever is the stat caps and it is a cliff, not a dial: at 0.8 of the caps Ifrit is 96 for the advisor and 0 careless and Shiva 93 and 0, but Valefor and the first Ixion stay at 100 and 100 down to 0.6, and at 0.6 Ifrit falls to 1; Evasion is not the first Ixion's lever (the fight is as easy at Evasion 0). (b) **The second Ixion fight and Dark Shiva are in the band** (Auto-Life is what holds Shiva: 57 without it). (c) **Dark Anima and Dark Bahamut are won only by Yojimbo's Zanmato.** No other line of the harness wins either at all (the party needs 297 and 161 plain hits, and each Overdrive and each fifth hit is a KO); the advisor's Pay buys one roll a turn and Yojimbo lives about three turns (Pain on one of three kills him, Dark Bahamut's Attack twice), so the first-try odds are about 46 and 35 and the chain **19 percent**. A defeat retries its link in the chapter, so a player is not stopped; this is a first-try figure, as the Mirror Aeons' bench is. (d) **The third seat changes nothing** (Wakka, Lulu, Kimahri, Rikku: identical to the seed on links 6 and 7: the outcome is the Zanmato roll); Luck 100 and 99 Phoenix Downs change nothing either; a 1,000,000 Pay with the shipped 1,500,000 purse spends the purse in one Pay.

**Levers with numbers, for Bailey** (200 seeds; links 6 / 7 alone, then the chain): Yojimbo's gauge **full** at the start (a full gauge adds 20 to the Pay's motivation; the shipped 0 is the Mirror preset's own estimate): **67 / 59, chain 26**; **purse 10,000,000 and a Pay of 1,000,000**: 60 / 48, chain 32; **both**: **77 / 69, chain 40**. The plan's 60 to 80 for the chain is out of reach by these estimate levers, because Yojimbo's three turns bound a link near 70. **Driver pick: keep the preset as the Mirror's and say so; the hidden chapter's hardest two are the hard post-game bosses the guides say they are.** If Bailey wants the chain nearer 40 percent: gauge 100, purse 10,000,000 and Pay 1,000,000 (three constants: `YOJIMBO_START_GAUGE` for this build, the party's `gil`, `LineOptions.payGil`). **Not tried (named):** Break Damage Limit alternatives, the Evade-and-Counter line for Bahamut (a counter-attack pays no Impulse and no gain), Cheer stacks, Lulu's Doublecast, a smarter Yojimbo stay (he dies to Pain; Auto-Life cannot be put on him), Wakka's Attack Reels. They are the line's, not the data's.

## 6. Stand-ins and what is a draft (listed)

| What | State |
|---|---|
| **The six Dark paintings** (`characters/dark-<name>/`, six portraits, one pause hero) | **none exist**: the presenter draws its procedural placeholder (one console warning per missing key, 404s on the sidecars) |
| The seven plates | existing backdrops standing in (section 4, DA10); the four plate looks are provisional |
| The foes' stage heights (`scenes/dark-aeons.ts`) | `[estimate]`, 3.0 to 4.4 m against the party's 1.75, one boss spot for all |
| The story | a draft for Bailey to read (pick DA13) |
| The music | existing cues by reference (DA12); Bailey's ears decide (rule 13) |
| The chapter card and thumbnail (`chapter-dark-aeons`, `-card`, `-thumb`) | a key only; held until Bailey's word to list the chapter (D-848) |
| The pause hero `pause/ch34-dark-aeons` | not made; the pause tab falls back to the Gagazet plate |
| The presenter's departure row (the body stays after the Dark aeon's death animation "Boss") | not added (`BattlePresenterDepartures.ts` is at 399 lines: a fold first) |
| The Overdrive gauge on screen (DA14) | not built |

### ART NEEDS (nothing below exists on disk; no ComfyUI was run, nobody generated art: rule 12, and only Bailey approves a painting)

Every Dark aeon has a **player painting to recolour**: `characters/valefor`, `ifrit`, `ixion`, `shiva`, `bahamut` and `anima` each carry the poses idle, attack, cast, hurt, ko (and overdrive at 1x to 4x; the first five also normal maps; Anima's set has none). The Mirror Aeons' four Dark sets (`characters/dark-yojimbo`, `dark-cindy`, `dark-sandy`, `dark-mindy`) are the shape and the method (image to image from the player's painting, graded dark and cool first, denoise 0.50 to 0.60; the IP-Adapter route redesigned the figures and was dropped).

| Subject (art key) | Recolour of | Poses | Notes |
|---|---|---|---|
| **Dark Valefor** `dark-valefor` | `characters/valefor` | idle, attack, cast, hurt, ko | the cast pose is Energy Blast |
| **Dark Ifrit** `dark-ifrit` | `characters/ifrit` | idle, attack, cast, hurt, ko | must still read as Ifrit (horns, mane), not a recoloured flame |
| **Dark Ixion** `dark-ixion` | `characters/ixion` | idle, attack, cast, hurt, ko | one painting serves both fights (`spriteKey` of `dark-ixion-2` is `dark-ixion`) |
| **Dark Shiva** `dark-shiva` | `characters/shiva` | idle, attack, cast, hurt, ko | her Attack is her most used (rank 1): a clear, quick silhouette |
| **Dark Anima** `dark-anima` | `characters/anima` | idle, attack, cast, hurt, ko | the hardest to recolour without redesign (the chained figure); no normal map exists |
| **Dark Bahamut** `dark-bahamut` | `characters/bahamut` | idle, attack, cast, hurt, ko | must read against the Dome plate |
| the six portraits | cut from each idle (`portraits/dark-<name>.png`) | one each | the Mirror precedent |
| the pause hero | `pause/ch34-dark-aeons` | one | one of the six, or the six together |

**Count: 30 masters (6 x 5), 6 portraits, 1 pause hero = 37 required images** (+2 held: the card and thumbnail), each with a sidecar (`width`, `height`, `baselineY`, `pose`, `facing`, `nonBiped`), a row each in `tools/posescale/subjects.json`, the mirror's `manifest.json` rebuilt and `src/data/art/poseRegistrationFoes.ts` regenerated by `tools/posescale/measure.py table` (generated, never edited). **Render budget (an estimate from the Mirror precedent): about 45 renders a subject, about 270 in all**, on the ComfyUI of the scheduled task `PyreflyComfyUI`, port 8188 only. **Optional new plates (not required):** a Besaid slope and the Thunder Plains (rule 9: options first).

## 7. Files and merge hot spots

New: `src/data/ffx/dark-aeons-six-ids.ts`, `enemies/dark-aeons-six{,-abilities,-groups}.ts`, `builds/dark-aeons.ts`; `src/data/chapter-dark-aeons.ts`, `chapter-meta-dark-aeons.ts`; `src/battle/ffx/ai/dark-aeons-six{,-rules,-setup}.ts`; `src/scenes/dark-aeons.ts`; `src/story/scripts/dark-aeons.ts`; `src/engine/tactics/dark-aeons.ts`; `src/app/screens/frontend/darkaeonDoor.ts`; the fixture `tests/fixtures/parity/ffx/dark_aeons_six_rows.json`; the helpers `tests/unit/helpers/darkAeonsDrive.ts` and `darkAeonsBench.ts`; the tests `tests/unit/chapters/dark-aeons-six-{data,ai,engine}.test.ts`, `dark-aeons-{flow,story,bench,board}.test.ts`; the tools `tools/dark-aeons-bench.mjs` and `tools/dark-aeons-smoke.mjs`; this note.

Shared files touched (all additive; **likely conflicts with the other new-chapter lanes, in order**):
1. `src/data/encounters.ts`: `ChapterId` gains `'dark-aeons'` (the first long line of the union), `ListedChapterId` excludes it, `Chapter.number` gains `33 | 34` (**take the union with the other lanes' edits of the same line**: 33 is another lane's). No line is added.
2. `src/data/chapters-experiments.ts`, `src/data/chapter-meta.ts`: one item each. `src/app/screens/frontend/chapterDoors.ts`: one row and one import; `tests/unit/chapter-doors.test.ts`, `critic-route-doors.test.ts` and the neighbour lists of `gagazet-door`, `summon-door`, `yojimbo-door` gain `darkaeon` (**union with the other lanes' words**); `critic/runner/lib/route-pure.mjs`: one row.
3. `src/data/ffx/enemies/hidden-ffx.ts` (rows and groups), `src/data/ffx/command-records/enemies.ts` (the twenty records), `src/battle/ffx/ai/index.ts` (one import), `src/battle/ffx/ai/dark-aeons-setup.ts` (**one call** to the new set-up, a no-op for every other group), `src/battle/ffx/kernel/forced-action-table.ts` (seven rows).
4. `src/scenes/experiment-scenes.ts`, `src/scenes/mushroom-rock-road.ts` (**four `MUSHROOM_PLATE_LOOK` entries**), `src/engine/pyreflyCanon.ts`, `src/data/art/artNamespace.ts` (the scene key draws the first link's plate), `src/engine/tactics/{lookup,index}.ts`.
5. `docs/CONTRACT-CHANGES.md` (the entry on top), `docs/audio/THEMES.md` (the hidden-chapter row). **`CHANGELOG.md` and NOW.md are not edited** (the integrator writes the release entry; the lines are in section 10).

`story/registry.ts` is **not** touched (a hidden chapter's scripts ride on its record; the registry holds the listed chapters). No source file added is over 400 lines (the longest, `tests/unit/chapters/dark-aeons-six-data.test.ts`, is a test); `encounters.ts` gained no line.

## 8. Browser job specs (predictions written first; J1 was run)

All at 1600x900 (and 390x844 for J7), `PYREFLY_BROWSER=gpu`, headless Chromium from node, against the dev server (no production build: the brief asked for none), **under the review-browser lock** (`tools/rig-record-lock.mjs`, taken by the tool itself). `node tools/dark-aeons-smoke.mjs --base <url> --stop link2|win [--quick] [--touch]`.

| Job | Steps | Prediction (from the engine tests, not a browser) |
|---|---|---|
| **J1 desk, to link 2** (RUN) | the board, the word, party prep, the pre scene, link 1's first menu, two real-key Attacks, the advisor to the seam, link 2's first menu | the board has no card for the chapter; party prep holds after the word; the pre scene is nine lines over the airship's deck; link 1 is Dark Valefor alone, 800,000 HP, gauge 0, a **procedural placeholder** figure on the Mushroom plate, Tidus, Yuna and Auron in front; each real-key Attack adds 15 to her gauge; after her fall the seam plays (three lines, a white-out) and link 2 opens on the desert plate with Dark Ifrit alone, the party whole and no Save Sphere card; console: one warning per missing painting, no error; 404s only on `characters/dark-*`, `portraits/dark-*` and `pause/ch34-dark-aeons` |
| **J2 quick chain** | `--stop win --quick` (each foe left at 5,000 HP at its first menu) | all seven plates photographed at their first menus in order, the second Ixion's bar reads full at 1,300,000 until the first hit; the post scene on the Dome plate; the results page |
| **J3 Dark Anima's menu** | link 6, Yuna's list | Summon lists ten aeons including Anima and Yojimbo; no black spell has an effect on her |
| **J4 Impulse** | link 7, five real attacks | the fifth allowed hit draws Impulse on all three (Slow, Petrify, four Break icons); Dispel is on Yuna's list |
| **J5 defeat and retry** | defend through link 5 | the defeat panel; RETRY opens link 5 (not link 1) with the party and the aeons whole |
| **J6 pause** | the pause screen on a link | the chapter tab with three objectives ("Send Dark Ifrit home", "Reach the road to Gagazet", "Send the last of them home"); the hero falls back to the Gagazet plate; the snapshots resolve (the plate, Anima's and Bahamut's player paintings) |
| **J7 phone** | 390x844, touch | the placeholder stands on the boss spot (3.0, 0, -2.8) clear of the command list; the intent slab and the HUD do not clip |

**J1 result:** see section 9.

## 9. Tests and checks

(Filled at the end of the lane: see the last commit's message and the return value.)

## 10. CHANGELOG lines (FFX only; for the integrator's release entry)

- **FFX only (new hidden chapter 34, "The Dark Aeons", not on the board):** the six other Dark Aeons of the International and HD builds as a chain of seven fresh fights, opened by typing `darkaeon` on chapter select: Dark Valefor, Dark Ifrit, Dark Ixion twice, Dark Shiva, Dark Anima, Dark Bahamut, the game's own records, rows and scripts (an Overdrive gauge that fills on every hit event, counters, Impulse on the fifth hit, Dark Anima's immunity to every spell), the party of the Mirror Aeons' preset with Yuna's Anima, a seam and the next plate after each fall. The Dark paintings do not exist yet (placeholders), the plates are existing backdrops, the story is a draft, the music is a stand-in.
- **Both games (shared plumbing, nothing a player sees):** the chapter-select doors table gains a sixteenth word; the Mushroom Rock Road stage can swap to four more existing plates.

## 11. Open questions (for Bailey, or for the RE session where it says so)

1. **Difficulty.** Valefor, Ifrit and the first Ixion are won by a careless line; Anima and Bahamut are won only by Yojimbo's Zanmato (first-try odds 46 and 35 percent, the chain 19). Play it, then pick: the preset as the Mirror's (the driver's pick), or the levers of section 5 (Yojimbo's gauge, the purse and the Pay), or a gentler or harder party (stats).
2. **L1 and L2 (RE):** Dark Ixion II's 1,300,000 over 1,200,000 (the engine clamps at the first blow), and whether a cleanse precedes the death check (Aerospark, Dark Shiva's Attack) and Impulse's shatter of a Petrified member.
3. **The look and the sound** (DA11, DA12): Bailey's eyes and ears; the six Dark paintings are the largest owed item.
4. **The Overdrive gauge on screen** (DA14): the fights turn on it and the first chapter shipped without it; one mockup round.
5. **Penance** (the guides' last fight, `m344`, after all eight Dark Aeons; room 223) is another lane's. The unlock conditions of each fight are the guides' only, not traced.
6. **Listing and the Pilgrimage** wait for his word (DA16).
