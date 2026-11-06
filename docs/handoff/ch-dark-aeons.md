# The Dark Aeons: Valefor, Ifrit, Ixion (twice), Shiva, Anima and Bahamut (a hidden FFX chapter, number 34)

**Branch `ch-dark-aeons`** (from `origin/r75-boss-art` `b98906229`, through the paper preflight `b0f1ec35c`), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX only** (AGENTS.md rule 14): the Dark Aeons exist only in the International and HD Remaster builds of FFX; CTB, aeons, the Overdrive gauge and the FFX status set. No FFX-2 or FF7 file changes behaviour; the registry rows, the door row and the scene row are shared plumbing, "both" in kind (CHK-020), inert for every other chapter.
**Status: built, hidden, played in a browser from the title to the results through all seven links (section 8, J1 and J2), reviewed and fixed (section 12), no paintings.** The chapter opens only by a typed word, **`darkaeon`**. Listing it waits for Bailey's word. **The six Dark aeons have no painting yet (section 7): the presenter draws its procedural placeholder for them; all seven plates are existing backdrops standing in.**
Written 2026-11-06 by a Sonnet sub-agent of the release driver.

Authority: Bailey, relayed by the driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (to building Penance, the Dark Aeons and every researched boss he never picked; about 00:55 EST), "you can spend as much meshy credits as you see fit" (not used here) and, 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick in section 4 is the paper preflight's own recommendation, "driver's call, his to overturn"; the alternative is written beside it.**

**UPDATE 2026-11-06 (r76 art install): the six Dark paintings, the seven turn-list faces and the pause plate in sections 6 and 7 are made and registered** (candidates picked by the driver under Bailey's delegation, his to overturn): `docs/handoff/r76-art-install.md` has what is installed, the gate numbers, the five waivers and what is held (the card and thumbnail, the stage heights, which still want a look on the stage). The "none exist" and "falls back" lines below describe the branch before the install. FFX only.

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
| 4 | **Dark Ixion, second fight** (`kami03_71`) | 1,300,000 written over 1,200,000 (our engine clamps it at the first blow: section 3, item 1) | +10 / +10 | 11th | Attack (Confuse; can miss), Aerospark; **Thor's Hammer 18,240 on all + four Breaks** | none |
| 5 | **Dark Shiva** (`mcyt00_70`), the temple road | 1,100,000 | +10 / +10 | 11th (her turns cost 3 to 6 ticks) | Attack (rank 1, strips buffs and Auto-Life), **Heavenly Strike (rank 2: Death, Berserk, Confuse)**; **Diamond Dust 85,123 on all** | none |
| 6 | **Dark Anima** (`mtgz01_70`), Gagazet | 8,000,000 | +10 / +5 (ungated) | 11th | **immune to every magical command, absorbs four elements**; Mega Graviton, **Pain (Death 255)**, Attack; **Oblivion about 86,700 on all** | none |
| 7 | **Dark Bahamut** (`dome06_70`), the Beyond | 4,000,000 | +10 / +10 | 11th | Attack every turn (13,221 on one); **Mega Flare 42,742 on all**; **Luck 102** | **Impulse on all (Slow 255, Petrify, four Breaks) on every fifth allowed hit** |

Every number is the game's own, from `research/re-ffx-dark-aeons-six.md` ("RE six n"): the files `m334` to `m339` and the seven formations, `[bytes]` and `[run]`, with a source note on every line. **The gauge counts hit events, and a many-blow action (an Overdrive) is one event.** Escape and Flee are disabled in five formations (Valefor, Ifrit, Shiva, Bahamut, Anima); Dark Ixion's two disable neither (RE six 2.2).

## 3. The data and its sources (rule 6: nothing invented)

`tests/fixtures/parity/ffx/dark_aeons_six_rows.json` holds the six stat records, the six loot records and the 24 move rows as decoded fields with their offsets, **generated from the game's files by a script (nothing typed by hand)**; `tests/unit/chapters/dark-aeons-six-data.test.ts` (80 tests) compares the enemy data, the command records and the abilities to it field by field, and the ten numbers of every record to the note's table typed a second time. The 24 rows are **21 distinct**: the two Hellfire rows (0x410C, 0x410D), the two Thor's Hammer rows (0x4111, 0x4112) and the two Aerospark rows (0x4110, 0x4116) are identical in every mapped field and are carried once, with a test that pins the equality (the pair differs only in an animation `[inferred]`); Mega Graviton is the row the Dark Magus Sisters share, carried by the Mirror Aeons' data. **Rule 5:** every row is `canMiss: false` except Dark Ixion's two Attack rows (0x4114, 0x4115), which carry accuracy formula 2 on the byte 254 (`percent = 290 - (Evasion + Luck)`).

**Where the note and the engine differ or add (the T0 checks, each a test in `dark-aeons-six-engine.test.ts`, 30 tests):**

1. **L1, Dark Ixion II's HP (not proved in play).** The record's maximum is 1,200,000 and the second fight's script writes 1,300,000 into the current HP. The game's setter does not clamp (note section 3), so **in the game** the fight starts at 1,300,000. **Our engine does not reproduce that:** `applyDarkAeonsSixSetup` writes it as the game's set-up does and the engine lets a combatant start above its maximum, but its damage code clamps HP to the maximum at the first change, so **the first damaging blow is wasted** (it only removes the overage; the review saw 42,000, 84,000 and 42,000 swallowed on three seeds, and the presenter shows that number while the bar does not move). The fight is therefore 1,200,000 after a wasted first blow, which is the figure Jegged, GameFAQs and StrategyWiki print. The note (section 4.3 and L1) now says exactly this. Whether the game clamps the same way is the live check; the data labels it `[bytes]`. **Driver's call (DA15): keep the file's write and the engine's clamp, and say so.** The alternative (carry a maximum of 1,300,000 so that nothing is wasted) needs a maximum no file gives, so it was not taken; it is one line in `dark-aeons-six-setup.ts` if Bailey wants it.
2. **Dark Anima's immunity beats her absorb for spells.** A Fire spell does nothing at all, not even a heal: the special-word bit cancels the HP class before the absorb could flip it. Her absorbs show only where the command is not magical (Ifrit's Hellfire, "neither", heals her: tested).
3. **Auto-Phoenix needs a living holder.** A group Overdrive that takes all three at once is the end of the battle (no rescuer left); with Auto-Life on all three they stand up again. Aerospark and Dark Shiva's Attack strip Auto-Life; the other five Overdrives leave it. **No Overdrive but Aerospark is less than a KO on an undefended 9,999-HP person; Aerospark does about 6,100 through Auto-Protect.**
4. **Dark Shiva's ranks work on the CTB:** the gap to her next turn is exactly 3 ticks after her Attack and 6 after Heavenly Strike (five seeds), so she acts about every 4.
5. **Dark Ixion's blade** never hits a member whose Evasion plus Luck reaches 290 (255 + 60 is 315; 230 + 60 is 290: 8 of 8 seeds a miss) and always hits at Evasion 0 (percent 230).
6. **One hit event per action:** a plain Attack +15 on Dark Valefor, Slice & Dice (many blows) +15 once, Provoke (no damage; the aeon is immune) +15 too. Dark Ifrit answers an Overdrive once. Dark Bahamut's first Impulse comes on the fifth allowed hit and one per five after.
7. **A Doublecast draws one answer (review fix, 2026-11-06).** Lulu's Doublecast raises two hit events in one action. Dark Ifrit and the first Dark Ixion now queue their free Attack through `hit-gates.ts#react`, the engine's `performCommand` rule (it drops a second reaction while the owner already has one waiting, as every Evrae and Sin script does): one answer, and the gauge still takes +5 (+10) for each of the two hit events. Before the fix a Doublecast drew two Attacks (Dark Ixion's twice with Sleep, Armor Break and Mental Break each). The advisor never puts Lulu in front, so no bench figure moved. `dark-aeons-six-review.test.ts`, red before the change and green after.
8. **A Ribbon does not stop Dark Shiva's Death (review fix, 2026-11-06).** The game's Ribbon row (`a_ability` record 128) has no Death byte; only Deathproof (record 48) does, and a Ribbon wearer is killed by every Heavenly Strike (checked on the engine: 13 of 13 in the review, every one in `dark-aeons-six-review.test.ts`). A Ribbon does hold off the Confuse and Berserk of the same blow. The note, the card and the page said a Ribbon turns the Death; they now say only Deathproof does. The preset wears Ribbon and not Deathproof, so Heavenly Strike (one of her ordinary turns in three) kills the member it picks, and the answer is Auto-Life or Auto-Phoenix, as the guide says.

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
| DA15 | Ixion II's HP | the file's 1,300,000 over 1,200,000 is carried and the engine clamps it at the first hit, so the first blow is wasted (section 3, item 1) | carry a maximum of 1,300,000 (nothing wasted; the maximum is no file's number); 1,200,000 only |
| DA16 | listing, Pilgrimage | not listed, not a Pilgrimage stop | list it behind his word |
| DA17 | a Doublecast on a countering aeon | one answer, through `react` (the engine's `performCommand` rule; section 3, item 7) | two answers (no source says the game answers a Doublecast twice) |
| DA18 | Dark Ixion II's Scan and Sensor | its own lines (no counter, a fury that fills fast) | the first fight's lines (they promised a counter) |
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
| **The six Dark paintings** (`characters/dark-<name>/`, six portraits, one pause hero) | **none exist**: the presenter reads the art manifest and draws its procedural placeholder silently (J1 and J2 saw no console warning and no 404). The deploy's reference audit cannot flag them: it reads only literal `art/...png|webp` names in the bundle (`tools/art-verify.mjs`), and the chapter names none (`heroArt` is a key without an extension, as the Biran and Yenke chapter's is) |
| The seven plates | existing backdrops standing in (section 4, DA10); the four plate looks are provisional |
| The foes' stage heights (`scenes/dark-aeons.ts`) | `[estimate]`, 3.0 to 4.4 m against the party's 1.75, one boss spot for all |
| The story | a draft for Bailey to read (pick DA13) |
| The music | existing cues by reference (DA12); Bailey's ears decide (rule 13) |
| The chapter card and thumbnail (`chapter-dark-aeons`, `-card`, `-thumb`) | a key only; held until Bailey's word to list the chapter (D-848) |
| The pause hero `pause/ch34-dark-aeons` | not made; the pause tab falls back to the Gagazet plate |
| The presenter's departure row (the body stays after the Dark aeon's death animation "Boss") | not added (`BattlePresenterDepartures.ts` is at 399 lines: a fold first) |
| The Overdrive gauge on screen (DA14) | not built |
| The guide card and page (`data/guides/dark-aeons.ts`, `data/guides/docs/dark-aeons.ts`) | **built** (a tactic needs a guide: `strategy-guide.test.ts`); five rules, seven hints, seven phase notes, one page per fight; the advisor's card on screen is the generic one, which the J1 and J2 screenshots show (it even names Yojimbo against Dark Anima) |
| The ambushed or preemptive start roll for Dark Anima | not modelled (pick DA9: Normal) |

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

New: `src/data/ffx/dark-aeons-six-ids.ts`, `enemies/dark-aeons-six{,-abilities,-groups}.ts`, `builds/dark-aeons.ts`; `src/data/chapter-dark-aeons.ts`, `chapter-meta-dark-aeons.ts`; `src/battle/ffx/ai/dark-aeons-six{,-rules,-setup}.ts`; `src/scenes/dark-aeons.ts`; `src/story/scripts/dark-aeons.ts`; `src/engine/tactics/dark-aeons.ts`; `src/data/guides/dark-aeons.ts`, `docs/dark-aeons.ts`; `src/app/screens/frontend/darkaeonDoor.ts`; the fixture `tests/fixtures/parity/ffx/dark_aeons_six_rows.json`; the helpers `tests/unit/helpers/darkAeonsDrive.ts` and `darkAeonsBench.ts`; the tests `tests/unit/chapters/dark-aeons-six-{data,ai,engine,overdrives,review}.test.ts`, `dark-aeons-{flow,story,bench,board}.test.ts` (`-overdrives` is the second half of the engine checks, split for the 400-line rule; `-review` pins the review fixes); the tools `tools/dark-aeons-bench.mjs` and `tools/dark-aeons-smoke.mjs`; this note.

Shared files touched (all additive; **likely conflicts with the other new-chapter lanes, in order**):
1. `src/data/encounters.ts`: `ChapterId` gains `'dark-aeons'` (the first long line of the union), `ListedChapterId` excludes it, `Chapter.number` gains `33 | 34` (**take the union with the other lanes' edits of the same line**: 33 is another lane's). No line is added.
2. `src/data/chapters-experiments.ts`, `src/data/chapter-meta.ts`: one item each. `src/app/screens/frontend/chapterDoors.ts`: one row and one import; `tests/unit/chapter-doors.test.ts`, `critic-route-doors.test.ts` and the neighbour lists of `gagazet-door`, `summon-door`, `yojimbo-door` gain `darkaeon` (**union with the other lanes' words**); `critic/runner/lib/route-pure.mjs`: one row.
3. `src/data/ffx/enemies/hidden-ffx.ts` (rows and groups), `src/data/ffx/command-records/enemies.ts` (the twenty records), `src/battle/ffx/ai/index.ts` (one import), `src/battle/ffx/ai/dark-aeons-setup.ts` (**one call** to the new set-up, a no-op for every other group), `src/battle/ffx/kernel/forced-action-table.ts` (seven rows).
4. `src/scenes/experiment-scenes.ts`, `src/scenes/mushroom-rock-road.ts` (**four `MUSHROOM_PLATE_LOOK` entries**), `src/engine/pyreflyCanon.ts`, `src/data/art/artNamespace.ts` (the scene key draws the first link's plate), `src/engine/tactics/{lookup,index}.ts`.
5. `src/data/guides/{index,docs/index}.ts` (one import and one row each), `src/ui/coach/turnOrderLine.ts` (Auron's "He moves after you" line: the party opens in every seed of the first link, engine-checked), `tests/fixtures/parity/ffx/evrae-gaze-classes.json` (21 rows: the class each new record takes from its formula byte), and the pinned lists of these shared tests, each moved to the new truth: `data-ffx-command-records` (539 abilities, 536 records, the cleanse differences), `audio-music-batch2`, `parity-ffx-loot-data`, `parity-ffx-engine-loot-battles`, `scene-backdrop-file`, `exp-fayth`, `exp-yrp-3d`, `experiment-flow` (links 2 to 7 carry the no-card flag), `mirror-aeons-chapter` (the plate looks), `party-stature-chapters`, `r62-auron-turn-order-tip`, `flash-covers` (the seams' 1000 ms white-out is a cover), `prep-tip-band` (33 chapters; the tip is short enough to fit at 1600 x 900).
6. `docs/CONTRACT-CHANGES.md` (the entry on top), `docs/audio/THEMES.md` (the hidden-chapter row). **`CHANGELOG.md` and NOW.md are not edited** (the integrator writes the release entry; the lines are in section 10).

`story/registry.ts` is **not** touched (a hidden chapter's scripts ride on its record; the registry holds the listed chapters). No file added is over 400 lines (the longest, `tests/unit/chapters/dark-aeons-six-data.test.ts`, is 330 and a test); `encounters.ts` gained no line and `chapter-meta.ts` is back at 399 (the review caught it at 400; its header comment lost a line break).

## 8. Browser job specs (predictions written first; J1 was run)

All at 1600x900 (and 390x844 for J7), `PYREFLY_BROWSER=gpu`, headless Chromium from node, against the dev server (no production build: the brief asked for none), **under the review-browser lock** (`tools/rig-record-lock.mjs`, taken by the tool itself). `node tools/dark-aeons-smoke.mjs --base <url> --stop link2|win [--quick] [--touch]`.

| Job | Steps | Prediction (from the engine tests, not a browser) |
|---|---|---|
| **J1 desk, to link 2** (RUN) | the board, the word, party prep, the pre scene, link 1's first menu, two real-key Attacks, the advisor to the seam, link 2's first menu | the board has no card for the chapter; party prep holds after the word; the pre scene is nine lines over the airship's deck; link 1 is Dark Valefor alone, 800,000 HP, gauge 0, a **procedural placeholder** figure on the Mushroom plate, Tidus, Yuna and Auron in front; each real-key Attack adds 15 to her gauge; after her fall the seam plays (three lines, a white-out) and link 2 opens on the desert plate with Dark Ifrit alone, the party whole and no Save Sphere card; console: one warning per missing painting, no error; 404s only on `characters/dark-*`, `portraits/dark-*` and `pause/ch34-dark-aeons` |
| **J2 quick chain** | `--stop win --quick` (each foe left at 5,000 HP at its first menu) | all seven plates photographed at their first menus in order, the second Ixion's bar reads full at its first menu (the engine clamps the 1,300,000 to the 1,200,000 maximum; written first as "1,300,000", which was wrong: the result is below); the post scene on the Dome plate; the results page |
| **J3 Dark Anima's menu** | link 6, Yuna's list | Summon lists **eight rows** (the three Sisters are one entry; Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo and the Sisters) including Anima and Yojimbo; no black spell has an effect on her |
| **J3b Dark Ixion II's Sensor** | link 4, Sensor on him, then Scan | the Sensor line reads "Your blows draw no answer, but the thunder gathers fast..." and the Scan line says he strikes every turn and ends in Thor's Hammer; neither says his blade strikes back |
| **J4 Impulse** | link 7, five real attacks | the fifth allowed hit draws Impulse on all three (Slow, Petrify, four Break icons); Dispel is on Yuna's list |
| **J5 defeat and retry** | defend through link 5 | the defeat panel; RETRY opens link 5 (not link 1) with the party and the aeons whole |
| **J6 pause** | the pause screen on a link | the chapter tab with three objectives ("Send Dark Ifrit home", "Reach the road to Gagazet", "Send the last of them home"); the hero falls back to the Gagazet plate; the snapshots resolve (the plate, Anima's and Bahamut's player paintings) |
| **J7 phone** | 390x844, touch | the placeholder stands on the boss spot (3.0, 0, -2.8) clear of the command list; the intent slab and the HUD do not clip |

**J1 and J2 were run (headless Chromium, `PYREFLY_BROWSER=gpu`, 1600x900, the dev server, under the lock; 2026-11-06; frames in `docs/screenshots/ch-dark-aeons/`, `desk-*` and `quick-*`): both exit 0, every check true.**

- **J1 (desk, to link 2).** The board has nineteen cards and none for the chapter ("0 of 19 beaten"); the word opens party prep and it holds; the pre scene plays over the airship's deck; link 1 is Dark Valefor alone at 800,000 HP, gauge 0, Tidus, Yuna and Auron in front with the four on the bench; **a real-key Attack (Enter, Enter) took 99,999 off her and put 15 on her gauge** (the cap and the hit event, as predicted; the second key pair did nothing, a menu-timing miss of the tool, not of the game); the advisor played link 1 to its fall, the seam, and link 2 opened on the desert plate with Dark Ifrit alone and the three standing. **Predictions that were wrong:** the console showed **no** "procedural placeholder" warning and the run saw **no 404 at all** (the presenter reads the art manifest and draws the placeholder silently, so no request for the missing paintings is made); the stage draws every foe as the same dark cloak with a cyan core at the boss spot.
- **J2 (quick chain, `--stop win --quick`).** All seven links reached in order, each foe alone at its first menu, the party standing, one plate each: **the road, the desert, the ruined road with its lightning towers, the same ruined road, the temple hall, Gagazet, the Dome**; then the post scene and the results ("Victory", AP 175,000 with the overkills, Master Sphere x5 and Dark Matter x5, the caption "BESAID TO MT. GAGAZET, CLEARED"); no console error, no 4xx or 5xx. **What the eye sees:** the plates sit on the 3D ground with no visible seam at 1600x900; **no per-plate grade exists** (the Gagazet plate is saturated blue and the temple bright against the road's dusk: a presentation pick for Bailey, DA10); the second Ixion's bar already read 1,200,000 of 1,200,000 at its first menu (the clamp of section 3, item 1); the placeholder is one size on every link (the heights of `scenes/dark-aeons.ts` are not yet applied to a placeholder). On Dark Anima's and Dark Bahamut's first menu the generic advisor card says "Yojimbo" (it finds the Zanmato answer too).
- **Not run:** J3 to J7 (a defeat and its retry through the browser, the pause screen on a link, the phone). The defeat and the retry are pinned through the real chain loop in `dark-aeons-flow.test.ts`; nothing was run at 390x844.

## 9. Tests and checks

Run on the plate tree after the review fixes (2026-11-06, `npx vitest run --maxWorkers=4`, about 35 minutes): **1979 files: 1947 passed, 1 failed, 31 skipped; 30,709 tests: 30,453 passed, 1 failed, 254 skipped, 1 todo.** `tsc --noEmit` is clean; `node tools/orphans.mjs` lists 24 modules, none of this branch's (all older); the door tests, the neighbours' pinned tests and the guide tests pass.

- **The one failure is not this branch's:** `tests/unit/chapters/boss-art-r75.test.ts` (`pause/ch29-spectral-keeper-card.png is named in src/`, from `src/data/chapter-spectral-keeper.ts`) fails the same way on the base `origin/r75-boss-art`; neither file differs between that branch and this one. It is the release 75 lane's to settle.
- **New and changed files of this pass:** `dark-aeons-six-review.test.ts` (8 tests: the Doublecast pair, the Ribbon and Deathproof gear rows, the engine run of Heavenly Strike, the pages, the gain table, the Ixion II lines, the pause caption), `dark-aeons-six-overdrives.test.ts` (the split-out half of the engine checks), `dark-aeons-six-engine.test.ts` (now 318 lines), `dark-aeons-bench.test.ts` (timeouts only). The two Doublecast tests were run red against the old `queueCounter` call (a second `dark6-ifrit-attack` and a second `dark6-ixion-attack-1`) and green against the fix.
- **Load flakes:** none in this run (the 15 s timeouts the review saw under load are fixed by the explicit timeouts).

## 10. CHANGELOG lines (FFX only; for the integrator's release entry)

- **FFX only (new hidden chapter 34, "The Dark Aeons", not on the board):** the six other Dark Aeons of the International and HD builds as a chain of seven fresh fights, opened by typing `darkaeon` on chapter select: Dark Valefor, Dark Ifrit, Dark Ixion twice, Dark Shiva, Dark Anima, Dark Bahamut, the game's own records, rows and scripts (an Overdrive gauge that fills on every hit event, counters, Impulse on the fifth hit, Dark Anima's immunity to every spell), the party of the Mirror Aeons' preset with Yuna's Anima, a seam and the next plate after each fall. The Dark paintings do not exist yet (placeholders), the plates are existing backdrops, the story is a draft, the music is a stand-in.
- **Both games (shared plumbing, nothing a player sees):** the chapter-select doors table gains a sixteenth word; the Mushroom Rock Road stage can swap to four more existing plates.

## 11. Open questions (for Bailey, or for the RE session where it says so)

1. **Difficulty.** Valefor, Ifrit and the first Ixion are won by a careless line; Anima and Bahamut are won only by Yojimbo's Zanmato (first-try odds 46 and 35 percent, the chain 19). Play it, then pick: the preset as the Mirror's (the driver's pick), or the levers of section 5 (Yojimbo's gauge, the purse and the Pay), or a gentler or harder party (stats).
2. **L1 and L2 (RE):** Dark Ixion II's 1,300,000 over 1,200,000 (the game's setter has no clamp; our engine clamps at the first blow, so the first blow is wasted: DA15), and whether a cleanse precedes the death check (Aerospark, Dark Shiva's Attack) and Impulse's shatter of a Petrified member.
3. **The look and the sound** (DA11, DA12): Bailey's eyes and ears; the six Dark paintings are the largest owed item.
4. **The Overdrive gauge on screen** (DA14): the fights turn on it and the first chapter shipped without it; one mockup round.
5. **Penance** (the guides' last fight, `m344`, after all eight Dark Aeons; room 223) is another lane's. The unlock conditions of each fight are the guides' only, not traced.
6. **Listing and the Pilgrimage** wait for his word (DA16).

## 12. The review and the fix pass (2026-11-06; FFX only)

An independent review of the pushed tip `298c13a65` found no invented or mis-copied number (the six stat records, the twenty command records, the loot fixture, the six scripts, the seven formations and the engine runs all agree with the game's files), no critical defect and four majors. **Game case of every change below: FFX only** (the Dark Aeons are FFX's; the `react` call, the texts and the guides touch only the chapter's scripts and pages; `chapter-meta.ts` lost one comment line break, shared plumbing, both in kind, inert).

| Finding | What was done |
|---|---|
| **MAJOR 1** the pushed tip was red; the fixes sat in an unpushed tree | everything is committed and pushed together (the guide files, the shared pinned tests moved to the new truth, the fixture rows, the `quick-*` screenshots); the full suite is in section 9 |
| **MAJOR 2** `dark-aeons-bench.test.ts` timed out at the suite's 15 s | the five heavy cells carry an explicit 180 s timeout (`BENCH_TIMEOUT`), the table of record 30 minutes; no seed count or assertion changed |
| **MAJOR 3** a Doublecast drew two counters from Dark Ifrit and the first Dark Ixion | `answerWith` queues through `hit-gates.ts#react` (section 3, item 7); `dark-aeons-six-review.test.ts` is red without the change and green with it |
| **MAJOR 4** the note and the guides said a Ribbon stops Dark Shiva's Death | the note (three places), the card and the page now say only Deathproof does; a test pins the gear row and the engine (section 3, item 8) |
| MINOR 1 Ixion II's HP | documented as it is (the game does not clamp, our engine does at the first blow, which is wasted): note 4.3 and L1, section 3 item 1, pick DA15 with the alternative |
| MINOR 2 Ixion II's Sensor and Scan | its own lines (DA18); the first fight keeps the blade line |
| MINOR 3 the pause caption under Bahamut | "and the last of them" |
| MINOR 4 file sizes | `chapter-meta.ts` 399; `dark-aeons-six-engine.test.ts` split, the second half is `dark-aeons-six-overdrives.test.ts` (318 and 123 lines); the longest added file is 330 |
| MINOR 5 a scratch path in `tools/dark-aeons-smoke.mjs` | removed; the header names `tools/rig-record-lock.mjs` only |
| MINOR 6 the false `battleId` comment | reworded: nothing in the battle reads `battleId`, `stage`, `file`, `stop` or `flagWord`; the data test does |
| MINOR 7 the advisor's gain table was not pinned | exported as `DARK_AEONS_GAINS` and pinned equal to `SIX_GAINS`, script by script |
| MINOR 8 "nine blows end her" was a bench figure | the card and the page say "a few heavy blows" (no number of ours is on the page) |
| MINOR 9 the J3 prediction | eight rows, the three Sisters being one entry (section 8) |
| MINOR 10 the deploy's art audit and the missing paintings | read, not run (it needs a build): `tools/art-verify.mjs` flags only a literal `art/...png|webp` name that the bundle holds and the build does not; the chapter names none (`heroArt` is a key without an extension, as the Biran and Yenke chapter's is), and the play run saw no 404 (section 6). Still to confirm on the deploy that carries this chapter |

**No boss row, preset number or bench figure changed** (the advisor never puts Lulu in front, and the clamp is as it was); the bench test was rerun alone: 8 pass, 2 skipped.

**Open issues after the pass:** L1 (the game's setter may or may not clamp Dark Ixion II's 1,300,000; one battle or a run of `pp_AtelSetActorProp` settles it), L2 (the cleanse before the death check; Impulse's shatter), the Doublecast rule is the engine's `performCommand` rule applied to a chapter whose scripts the note says use `performCommand` (no live check of a Doublecast on Dark Ifrit exists), the shared `boss-art-r75.test.ts` failure (section 9), and the deploy-time art audit (MINOR 10).
