# Gullwings, Chapter 1: Boris, the Flame Dragon, the Guardian Beast and YSLS-Zero (a hidden FFX-2 chapter, number 51, the word `dragon`)

**Branch `ch-gullwings-ch1`** (from `origin/main` `bc93b1fdd`), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX-2 only** (AGENTS.md rule 14): ATB, dresspheres, the FFX-2 monster rows 132, 122, 162 and 47 and their four AI scripts; no FFX or FF7 file changes behaviour. The registry rows, the door row, five item names and the kill-reward ids are shared plumbing, "both" (CHK-020), inert for every other chapter. **One FFX-2 engine fix is not additive in effect** (the stat table below Lv 20, section 4 finding 1); it changes no shipped build.
**Status: built, hidden, all four bosses unpainted (the presenter's placeholder), the arena a flagged stand-in, the story a draft, the music a stand-in, the party's levels an estimate (measured).** The chapter opens only by a typed word (`dragon`). Listing it waits for Bailey's word.
Written 2026-11-09 by a Sonnet sub-agent of the release driver (plan row 51, wave 5; the research note `research/re-ffx2-gullwings-chapter1.md` and the paper preflight `docs/plans/ch-dragon-review.md` are committed with it).

Authority (relayed by the driver, verbatim): 2026-11-09 "Keep going please with everything you were doing"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too" (every researched boss he never picked); 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." **Every pick in section 5 is the paper preflight's own recommendation or the bench's, "driver's call, his to overturn".**

## 1. Play it

1. From the title, reach the chapter-select board. Type **`dragon`** (any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it. The first letter D is the board's `right` key, so the cursor takes ONE step for it; the R is `r1` (ignored), the A is claimed by the word, and G, O and N are bound to nothing. On a phone the long-press field on the "Chapter select" label takes the same word.
2. Enter starts the chapter: a pre scene (our draft, section 8), then **act 1, Boris** (the Floating Ruins, Lv 8). After his fall a seam (the Celsius mends the girls, the Black Mage dressphere comes), then **act 2, the Flame Dragon** (Besaid's cave, Lv 16), a seam (the White Mage dressphere), **act 3, the Guardian Beast** (the Zanarkand Ruins, Lv 18), a seam, **act 4, YSLS-Zero** (Kilika's approach, Lv 11), then the post scene. Each link opens at full HP and MP with a fallen girl standing and **no Save Sphere card**; items spent stay spent; statuses and the worn dressphere do not carry. A defeat on act 2, 3 or 4 retries **that act**; a defeat on act 1 starts the chapter over. Escape is off.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration. **The party is a new Chapter 1 build** (Yuna 12 Gunner, Rikku 13 Thief, Paine 14 Warrior; the Songstress, Black Mage and White Mage owned; no Gun Mage): **levels are an `[estimate]`** (no source gives one), measured in section 6.

## 2. What it is

| Act | Boss (game row) | Lv | HP | What it does (the game's own script, poll by poll) |
|---|---|---:|---:|---|
| 1 | **Boris** (132) | 8 | 480 | STR 16, DEF 3. Three Spider Attacks (two hits each), then **Sticky End once** (all three girls, about 46 to 52 each, may Stop: a byte of 40 of 255), then for ever Spider Attack three polls in four and **Spider Bite** (no Defense term, power 32, a long charge) one in four. Weak to Fire **and** Ice; Petrify, Silence and Darkness land |
| 2 | **Flame Dragon** (122) | 16 | 980 | **Flame Breath on all three first** (Fire, magical, 174 to 206 at this chapter's levels, MP 30), then Attack on the girl with the **most current HP**; one more breath the first time its own HP is under 100. Weak to Ice, half Fire, Gravity nulled; Poison and Berserk land |
| 3 | **Guardian Beast** (162) | 18 | 2,886 | A beat of four: three Attacks then **Curse** on a girl who does not carry it (a cursed girl cannot Change dress). With every girl cursed it only Attacks. Under a third of its HP (**under 962**) the Curse becomes **Damocles Photon on all three: exactly half of each girl's maximum HP** (formula 7, magical: Shell halves it). Weak to Fire, Ice, Thunder, Water and Holy; Berserk lands 60, Darkness 50 |
| 4 | **YSLS-Zero** (47) | 11 | 1,935 | DEF 104, MDEF 3, cannot move. One draw of 4 a poll: **Haymaker** (two hits, never misses) 55 in 120, **Blast Punch** (**half of one girl's maximum HP**, cast 140, delays; neither Protect nor Shell reduces it) 25 in 120, an Attack 40 in 120. No weakness; Darkness lands |

**Every boss** carries the game's live "battle too long" block (Boris 135/140/145/150 polls, Flame Dragon 140/150/155/160, Guardian Beast 180/190/195/200, YSLS-Zero 135/140/145/150, then Time Up Meteor every poll): unreachable in play (the longest fight of any line, even a party that only defends, is under the first mark).

Rewards: the rows' EXP, Gil, AP (1 each) and Pilfer Gil; the drops Star Pendant, Red Ring, Amulet, Wristband; the steals Remedy, Hi-Potion, Defense Veil, Mythril Gloves.

## 3. The data and its sources (rule 6: nothing invented)

Every number is `research/re-ffx2-gullwings-chapter1.md` (the RE lane, 2026-11-09: `monster.bin` rows 132, 122, 162 and 47, the plain-text AI sources equal to their compiled workers, `monmagic.bin`), tagged `[RE row n]` in the files. **`tests/fixtures/parity/ffx2/gullwings_ch1_rows.json`** holds the four monsters, the seventeen moves, their statuses, Boris's start positions and the scripts' constants as decoded fields with their file offsets; **the chapter lane read them again from the kernel tables** (its own reader, not the note's prose) and `tests/unit/chapters/gullwings-ch1-data.test.ts` (47 tests) compares the enemy data, the monster records, the command records and the kill-reward rows to it field by field. No game text, script text or byte dump is in the repo.

**Where the note's prose and the rows, the sources or the engine differ, the row, source or engine wins** (listed so nobody trusts the prose; the note itself carries the same list at its foot):
- **Sticky End's Stop is a byte of 40 of 255, not "40 percent"**: 52 of 300 girls stopped on the real engine (17.3 percent; 40 of 255 is 15.7). The data, the AI and the guide print the byte.
- **The Guardian Beast's Curse target** is a `searchr` over the girls without Curse (a random pick, uniform here), not "the first living girl".
- **The fallback stat table ran the wrong way below Lv 20** (section 4, finding 1).
- **YSLS-Zero's Defense of 104 does not blunt a blow at this chapter's levels** (Warrior 68, Gunner 46, Thief 22 twice; a Black Mage's Fire 93), so the guides' "send a mage" does not become the tactic or the tip; the words follow the measure (section 6).
- **Boris dies before his Sticky End** at Lv 10 and over (section 6): the web is rare in play, the party's level is the lever.

**Gaps, named (not invented):**
- **The girls' levels, kit and bag** have no source (U1): the build is an estimate throughout, every number tagged so in `ffx2/builds/gullwings-ch1.ts`. The kit offers only what is free (no learned ability is pre-set).
- **Positions.** Only Boris's scene ships a position file (the girls at (0, -45), (15, -45), (-15, -45), Boris at (0, 25): `SCENES.boris`, the game's own); the other three ship EMPTY files, so every near-weighted pick there is a uniform one and **YSLS-Zero's "farthest girl" is a uniform pick among the living girls** (all three are tied, `[inferred]`; U2).
- **Item effects and prices.** Star Pendant (Poisonproof, Def +4, MDef +4; 4,000 gil), Wristband (Str +10; 1,000), Defense Veil (MDef +20; 1,000) and Mythril Gloves (Def +20; 1,000) are `research/ffx2-combat-core.md` §5.4 / `ffx2-bahamut.md`; the **Red Ring** has no effect and no price in the research (`unsourced`, held-only). None of the five is wired as a new effect (the stat table already carries Defense Veil and Mythril Gloves).
- **Bribe** (Antidote x30 / Pretty Orb x1; Fire Gem x30 / x40; Oath Veil x1) is on the monster records; the enemy data holds none, as for Ifrit.
- **The announcements' wording** is our own ("{user} grows restless", "rages", "is about to blow", "ends this now").
- **Action time and stature** of the four are unread: the per-command span with its fallback stands; every boss stands at the Dome's default boss height (2.9), a stand-in (a spider at that height is too tall; the art lane fixes it with the painting).
- **The Oversoul versions** (`o132` and the rest, own scripts) are not built (DR6). The Dragon's Tail Smash (0x40d9) is inside a commented-out block of its source and in no worker: not built. The Beast's death row (0x40dc) and YSLS-Zero's `disable_move` are presentation only.
- **The Gun Mage** the guides recommend against YSLS-Zero is not owned (U4); the fight is measured without it.

## 4. Engine work and what the T0 checks found

| # | Need | What was done |
|---|---|---|
| E1 | the four scripts | `battle/ffx2/ai/gullwings-ch1.ts` (287 lines): the one-shot Sticky End, the beat of four, the third-of-HP switch, the nested draws and the extreme pairs, the shared live block |
| E2 | the rows | `data/ffx2/enemies/gullwings-ch1{,-abilities}.ts`, `command-records/gullwings-ch1.ts`, `monster-records/records-gullwings-ch1.ts`, four kill-reward rows, five held items, `SCENES.boris`, the fixture |
| E3 | chapter plumbing | the id `ffx2-gullwings-ch1`, number 51, meta, the door `dragon`, the story, the route word in `critic/runner/lib/route-pure.mjs`, the build, the tactic and the guide pair |

**T0 findings (each pinned by a test, run on the real engine first, not written from the note):**
1. **The stat table ran backwards below Lv 20** (`battle/ffx2/dressphere-stats.ts#interpolate`, FFX-2 only, the one non-additive change; `CONTRACT-CHANGES.md`): a level under the first anchor was extrapolated from the LAST pair of anchors (its loop only breaks inside a segment), so a Lv 12 Gunner had 1,035 HP and a Lv 20 one 862. It now runs down the first segment, as the file's header says (576 HP at Lv 12, the growth formulas' 562). No level at or above the first anchor changes; no other shipped build is under Lv 20. The preflight assumed "the engine's stat table extrapolates below its Lv 20 anchor"; it did not.
2. **Formula 7 reads the target's maximum HP**: Damocles Photon takes exactly `floor(max / 2)` of every girl (288, 315, 370 of 576, 630, 741), Shell halves it (magical), Protect changes nothing; Blast Punch takes exactly `floor(max / 2)` of one girl, and neither Protect nor Shell changes it (damage flags 0). The preflight's E4 check ("Shell halves the former") holds.
3. **Sticky End** is 46 to 52 a girl on every girl and seed; the Stop carries a counter of 20; a **Remedy frees a Stopped girl**; the byte is 40 of 255 (finding in section 3).
4. **Curse** lands on the girl it names and does no damage; a cursed girl's menu **offers no Change**; **Holy Water lifts it and the Change returns**.
5. **Haymaker never misses over 300 uses and always lands two hits; Spider Attack hits twice and can miss** (133 misses over 300 uses on Rikku, two hits each).
6. **The elements** on the real engine: Boris takes more from Fire and Ice than from Thunder; the Flame Dragon most from Ice, least from Fire; the Beast the same from its four listed elements, more than YSLS-Zero takes.
7. **Time Up Meteor** is 12 hits of 10,000 on everyone.
8. **The beat resets only on the special**: with every girl cursed the Beast only Attacks until its HP falls under 962, when its very next poll is the Photon (the note's reading 1).
9. **The Beast's Curse can land on a girl who already changed dress** (the Change is a menu row until she is cursed), so the tactic makes the change on the first turn; the tip and the guide say why.
10. **Boris's web is rare in play**: 0 of 100 seeds at the shipped level, 8 of 50 at 8 / 9 / 10, 44 of 50 at 4 / 5 / 6 (section 6).

## 5. The picks (the driver's, under Bailey's blanket yes; each with its alternative, his to overturn)

| # | Question | Pick | Alternative |
|---|---|---|---|
| DR1 | scope and order | **one chain of four acts in the hotspot order of the guides** (Floating Ruins, Besaid, Zanarkand, Kilika: not ascending level), the party mended between acts (`nextGroupId`, `restoresPartyOnEntry`, `noSaveSphereCard` on links 2 to 4) | two chapters (the two early fights, the two late ones); four chapters |
| DR2 | party | **a new `gullwingsCh1Build`**: Yuna Gunner, Rikku Thief, Paine Warrior, the Songstress, Black Mage and White Mage owned, First Steps grids, no accessory (the guides' Red and White Rings are not in the stat table), a small bag; **levels 12 / 13 / 14 `[estimate]`** | the Chapter 2 preset (Lv 23 / 24 / 25, above the chapter; a measured what-if only); levels 8 / 9 / 10 (Boris's web 8 of 50, the Beast 36 of 50, YSLS-Zero 46 of 50, section 6) |
| DR3 | per-act levels | **one build for the chain** | an additive per-link build override read by the chain loop (+3 h, a contract entry): the way to make Boris's web appear and keep the Beast hard; **the bench shows acts 1 and 2 are trivial at any level from 4 to 22, which is what the preflight named as the reason to take this** |
| DR4 | arena | **one plate, `zanarkand-dome`, a flagged stand-in for all four acts** (stone ruins; the Dome's own party and enemy slots; no scene file touched) | per-act plates through an additive scene key (+3 h; two painted plates later) |
| DR5 | the time-out blocks | **ported**, one shared helper, four mark tables, one test file section | left out, and said so |
| DR6 | Oversoul forms | **not built** | a second pass (+8 h; scripts unread) |
| DR7 | art | four unpainted keys, the presenter's placeholder (section 7) | zero-art stand-ins from other chapters' paintings |
| DR8 | music | **`boss-ffx2-fallen-aeons`** (the cue Ifrit, Valefor and Angra Mainyu play), field bed `scene-bevelle-underground`, `victory-ffx2`: flagged stand-ins, Bailey's ears (rule 13) | none needed |
| DR9 | id, number, word | **`ffx2-gullwings-ch1`, 51, `dragon`** (re-checked against the 30 words on `origin/main`; `chapter-doors.test.ts` is the authority) | `boris` |
| DR10 | Sticky End | **once, as the file has it** (a one-shot flag in the compiled worker), not the guides' loop | the guides' loop |
| GC1 | the advisor line | **by the measure, not the guides' words**: a White Mage Yuna and two Black Mages against the Beast, a Black Mage Rikku (Blizzard) against the Dragon, the three starting dresspheres against Boris and YSLS-Zero | the guides' "send a mage against YSLS-Zero" (measured worse: 87 of 100 and 4.0 knock-outs a fight against 99 and 2.1) |
| GC2 | YSLS-Zero's two Attack rows | **two abilities**, `x2-ysls-zero-attack` (0x4000, branch 3) and `x2-ysls-zero-attack-no-cancel` (0x41da, branch 2): the same numbers; the difference is an unmodelled bit | one ability |
| GC3 | the farthest girl | **a uniform pick among the living girls** (the scene's file is empty) | a near-weighted pick on Besaid's or Kilika's positions (no source) |
| GC4 | the prep tip | **one 135-character form**, following the bench ("Ice for the Dragon. Remedy frees Stop, Holy Water lifts Curse. Beast: a White Mage heals, Black Mages cast. YSLS-Zero: strike and heal.") | the guides' words (rejected: measured worse) |
| GC5 | the stat-table fix | **fix `interpolate`** so a level under Lv 20 runs down the first segment | levels of 20 and over (a Lv 20 party beats Boris in five seconds and is not Chapter 1) |
| GC6 | held items | **five held-only rows** with the researched effects and prices where there are some | none (the kill table would print raw ids) |

## 6. Difficulty: measured, not tuned

`tests/unit/chapters/gullwings-ch1-bench.test.ts` (10 tests; 100 seeds a bench-speed cell, 50 at human speed, `PYREFLY_BENCH_SEEDS=<n>` for more; about 6.5 minutes alone) prints the tables. A *line* is a test input standing in for a player (`tests/unit/helpers/gullwingsCh1Drive.ts`): **advisor** (the shipped tactic), **naive** (every girl strikes, a Potion under 40 percent, no Change, no Remedy), **defend** (the control). Wait ATB; seeds 1 to 100 (50 for the human paces and the level sweep). The girls are Lv 12 / 13 / 14.

| Fight | Line | Pace | Wins | Girl KOs a fight | Minutes | Boss actions | Longest | Web seen / Photons / Blast Punches a fight |
|---|---|---|---:|---:|---:|---:|---:|---|
| Boris | advisor | bench | 100/100 | 0.00 | 0.19 | 1.82 | 3 | 0 of 100 |
| | advisor | Wait split 1.5 s | 50/50 | 0.00 | 0.21 | 2.14 | 3 | 0 of 50 |
| | advisor | Active 1.5 s | 50/50 | 0.00 | 0.27 | 2.58 | 4 | 2 of 50 |
| | naive | bench / Wait / Active | 100/100, 50/50, 50/50 | 0.00 | 0.19 to 0.27 | | | the same as the advisor |
| | defend | bench | **0/100** | 3.00 | 6.25 | 61.3 | 71 | 100 of 100 |
| Flame Dragon | advisor | bench | 100/100 | 0.00 | 0.38 | 2.96 | 4 | |
| | advisor | Wait split / Active | 50/50, 50/50 | 0.00 | 0.42, 0.54 | 3.18, 4.72 | 4, 7 | |
| | naive | bench / Wait / Active | 100/100, 50/50, 50/50 | 0.00 | 0.46, 0.51, 0.65 | | | |
| | defend | bench | **0/100** | 3.00 | 3.33 | 37.9 | 48 | |
| **Guardian Beast** | advisor | bench | **97/100** | 0.89 | 1.35 | 15.7 | 32 | 1.41 Photons |
| | advisor | Wait split 1.5 s | 42/50 | 1.90 | 1.59 | 18.4 | 30 | 1.72 |
| | advisor | Active 1.5 s | **19/50** | 5.08 | 2.32 | 26.7 | 42 | 2.74 |
| | naive | bench | **33/100** | 4.50 | 1.96 | 19.8 | 32 | 2.21 |
| | naive | Wait split / Active | **4/50, 0/50** | 5.12, 4.78 | 2.12, 2.27 | | | |
| | defend | bench | **0/100** | 3.00 | 1.84 | 24.1 | 34 | 0 (it is never hurt) |
| **YSLS-Zero** | advisor | bench | 99/100 | 2.13 | 1.89 | 13.8 | 19 | 2.76 Blast Punches |
| | advisor | Wait split 1.5 s | 50/50 | 2.40 | 2.12 | 15.0 | 23 | 3.30 |
| | advisor | Active 1.5 s | 49/50 | 3.48 | 2.78 | 19.9 | 29 | 4.42 |
| | naive | bench / Wait / Active | 99/100, 49/50, **41/50** | 2.55, 3.26, 5.28 | 1.96, 2.20, 3.03 | | | |
| | defend | bench | **0/100** | 3.00 | 1.32 | 10.2 | 14 | 2.09 |

**What that says, plainly.** Boris and the Flame Dragon are the guides' "easy" and then some: every line wins every seed with no knock-out, down to a Lv 4 / 5 / 6 party. **The Guardian Beast is the fight the answer decides**: a party that only strikes wins 33 of 100 (4 of 50 at the live Wait split, 0 of 50 Active), the changed party 97 of 100 (84 percent at the Wait split, 38 percent Active at 1.5 s a decision). **YSLS-Zero hurts rather than beats**: 2.1 knock-outs a fight, the Phoenix Downs do the work, and 99 of 100 is won by the starting spheres.

**The role tables behind the tactic** (advisor heal rules throughout, 100 seeds):

| Fight | Role table | Wins | KOs | Minutes |
|---|---|---:|---:|---:|
| Guardian Beast | **shipped** (White Mage Yuna, Black Mage Rikku and Paine) | **97** | 0.89 | 1.35 |
| | starting spheres | 79 | 3.43 | 2.31 |
| | White Mage Yuna, Black Mage Rikku, Warrior Paine | 89 | 1.52 | 1.91 |
| | Gunner Yuna, two Black Mages | 89 | 1.95 | 1.29 |
| | White Mage Yuna, Thief, Warrior | 83 | 2.81 | 3.47 |
| YSLS-Zero | **shipped = starting spheres** | 99 | 2.13 | 1.89 |
| | White Mage Yuna, Black Mage Rikku, Warrior Paine | 98 | 2.38 | 2.40 |
| | Gunner Yuna, two Black Mages | 87 | 3.95 | 1.91 |
| | White Mage Yuna, Thief, Warrior | 100 | 1.80 | 2.83 |

(A White Mage Yuna beside a Thief and a Warrior takes fewer knock-outs against YSLS-Zero in half again the time: a trade the bench shows and the line does not make.)

**The party's level is the lever** (advisor line, 50 seeds; "web" is Boris's Sticky End seen):

| Fight | 4 / 5 / 6 | 8 / 9 / 10 | **12 / 13 / 14** | 16 / 17 / 18 | 20 / 21 / 22 |
|---|---|---|---|---|---|
| Boris | 50/50 (web 44) | 50/50 (web 8) | 50/50 (web 0) | 50/50 | 50/50 |
| Flame Dragon | 50/50 | 50/50 | 50/50 | 50/50 | 50/50 |
| Guardian Beast | 0/50 (7.5 KOs) | 36/50 (3.5) | **48/50 (1.1)** | 50/50 (0.1) | 50/50 (0.0) |
| YSLS-Zero | 0/50 (8.2 KOs) | 46/50 (4.3) | **50/50 (2.2)** | 50/50 (0.2) | 50/50 (0.0) |

**Options with numbers for Bailey** (none built; the party is the only lever and no boss number is ever touched): **A (the pick)** one build at 12 / 13 / 14: Boris is a tutorial that ends in 11 seconds and never shows his web, the Dragon a tutorial, the Beast and YSLS-Zero real. **B** one build at 8 / 9 / 10: Boris shows his web in one fight in six, the Beast is won 36 of 50 and YSLS-Zero 46 of 50 with 3.5 to 4.3 knock-outs a fight. **C** the per-link build override (DR3): Lv 6 to 8 for Boris and the Dragon, 12 to 14 for the Beast and YSLS-Zero, the web seen about every other fight, a contract entry and +3 h.

## 7. ART NEEDS (nothing below was painted here; nobody queued ComfyUI: rule 12, Bailey alone approves a painting)

Style reference: the approved painted set (the Bahamut chapter's `bahamut`, the FFX-2 boss sets `x2-ixion`, `x2-shiva`, `x2-aranea`), the painted 2.5D look, facing left toward the party, a sidecar JSON each (`width`, `height`, `baselineY`, `pose`, `facing`, `nonBiped`). **Exact sprite keys** (`public/art/characters/<key>/`; the keys are in `src/data/gullwings-ch1-ids.ts`, one constant each):

| Subject (key) | Poses (masters) | Notes |
|---|---|---|
| **Boris** `x2-boris` | idle, attack, hurt, ko; idle @2x (4 poses) | the `x2-aranea` painting (a spider-fiend of the same family) recoloured and rescaled: the cheapest of the four; its Sticky End reads as the attack pose |
| **Flame Dragon** `x2-flame-dragon` | idle, attack, cast (the breath), hurt, ko; idle @2x (5) | new painting; **also serves the Zalamander (plan row 55, the same model family, motion 0x1078) by recolour** |
| **Guardian Beast** `x2-guardian-beast` | idle, attack, cast (the Curse and the Photon, the feather), hurt, ko; idle @2x (5) | new painting; **also serves Azi Dahaka (plan row 55, motion 0x10a2) by recolour and scale** |
| **YSLS-Zero** `x2-ysls-zero` | idle, attack (Haymaker), cast (Blast Punch), hurt, ko; idle @2x (5) | new painting (a machina fiend); YSLS-99 can recolour it later; it never moves (a still body) |
| the card, the pause plate | `chapter-ffx2-gullwings-ch1` (thumbnail), `pause/ffx2-gullwings-ch1` (hero plate) | the meta's fallback is the Dome's plate, the card is unused while the chapter is hidden |
| the arenas | none now (the Zanarkand Dome stands in for all four); optional later: Besaid's cave, Kilika's approach, the Floating Ruins' summit (3 plates; `gagazet` is a near stand-in for the summit) | DR4's alternative |

About 19 poses in all (the preflight's count). On install (the art lane's step, not this one's): the sidecars, a row for each subject in `tools/posescale/subjects.json`, the mirror's `manifest.json` rebuilt, `src/data/art/poseRegistrationFoes.ts` regenerated by `tools/posescale/measure.py table` (generated, never edited by hand), and the Dome's `figureHeights` for the four ids (the art lane measures each; the stage's default boss height 2.9 is a stand-in). **Music:** none new; Bailey's ears decide the stand-in cue (rule 13).

## 8. The story draft

`src/story/scripts/ffx2-gullwings-ch1.ts`: **a DRAFT for Bailey to read before it ships.** A pre scene at the Floating Ruins (ten lines), three seams (the Celsius mends the girls, the Black Mage and the White Mage dresspheres come where the research gives them, the next hotspot; about 15, 13 and 13 seconds with the player's hands off), five callouts (Boris' first Sticky End, the Flame Dragon's first breath, the Beast's first Curse and first Damocles Photon, YSLS-Zero's first Blast Punch: ten words a line at most), and a post scene (YSLS-Zero stops, one sincere exchange, the joke restored). Our words over the sourced beats; no line of the game's dialogue. **The callouts claim only what the rows do** (a Remedy frees the web, Holy Water the Curse, Shell halves the Photon, "No armour stops that one" for the Blast Punch). `tests/unit/chapters/gullwings-ch1-story.test.ts` holds the lint, the cast, the rations, the triggers and the budgets.

## 9. Browser job specs

**J0, run (headless Chromium, `PYREFLY_BROWSER=gpu`, a dev server on its own port, the review-browser lock; `tools/gullwings-ch1-smoke.mjs`):** the real-key smoke of act 1 to its result (the seam, the first menu of act 2), section 10.

All at 1600x900 and 390x844, headless Chromium from node (the lock applies), a production build when the integrator cuts one; the debug API (`window.__pyrefly`) may set a boss's HP low to reach the later links. Every prediction is from the engine tests, not from a browser, unless J0 says so.

| Job | Steps | Prediction |
|---|---|---|
| **J1 board** | type `dragon` on the board; also on a phone through the long-press field | party prep opens for "Gullwings, Chapter 1", numeral EXP; the board still draws nineteen cards; the cursor takes one step for the first D and no more; nothing is written under any key |
| **J2 prep and pre scene** | read the prep card, Enter, play the pre scene | the hero art falls back to the Dome's plate; the tip box fits (the 135-character form); the pre scene is ten lines over the Dome's plate with the bed `scene-bevelle-underground`; the last line starts the battle |
| **J3 act 1** | first menu; three attacks each; win | the boss strip names Boris; the sprite is the procedural placeholder at the Dome's boss height (tall: a stand-in); Boris dies in two or three of his own turns; the Enemy Intent card reads Spider Attack 39-46 / 39-46 / 29-31 on Yuna / Rikku / Paine (seen in J0); his web is not seen at this level |
| **J4 the first seam** | win act 1 | the Celsius seam plays about 15 s with the hands off, then act 2 opens with the girls whole, the Flame Dragon at 980 and no Save Sphere card |
| **J5 act 2** | Rikku Changes to a Black Mage, casts Blizzard | the Flame Dragon's first move is Flame Breath on all three (about 174 / 175 / 206), the callout plays once; its Attacks go to the girl with the most HP; a Blizzard does about 200 |
| **J6 act 3** | Yuna Changes to a White Mage, Rikku and Paine to Black Mages; play on | the Beast's fourth move is a Curse (a cursed girl's Change row is gone, a Holy Water brings it back); under 962 HP its fourth move is Damocles Photon: 288 / 315 / 370 off Yuna / Rikku / Paine, half that under Shell; the callouts play once each |
| **J7 act 4** | strike with the starting spheres | YSLS-Zero's Haymaker is two hits (89 and 142 on Paine seen), Blast Punch takes exactly half of one girl's maximum HP (370 of 741) and delays her; the callout plays once; one to three girls fall in a fight and a Phoenix Down raises them |
| **J8 seams and retry** | win acts 2 and 3; lose act 4 | each seam plays 12 to 15 s hands-off, then the next act opens whole; a defeat on act 4 retries act 4, on act 1 starts the chapter over |
| **J9 pause and phone** | pause on each act; 390x844 | the chapter tab with the three objectives ("Get past the Flame Dragon", "Get past the Guardian Beast", "Defeat YSLS-Zero"); the snapshots resolve (the Dome's plate, Yuna's and Paine's portraits); on the phone the placeholder stands on the boss spot clear of the command list |
| **J10 console** | the whole run | no error and no 404 beyond the four unpainted keys' (none expected: the presenter asks for no pose file of an unpainted key) |

## 10. The smoke run (J0)

`tools/gullwings-ch1-smoke.mjs`, headless Chromium with `PYREFLY_BROWSER=gpu` against a Vite dev server on its own port (5461, stopped by its PID afterwards; no production build, the art is this tree's older mirror through `public/art`), under the machine-wide browser lock (it waited its turn behind another lane's job), seed 7, 1600 x 900, **real keys only, no state edit but the girls' HP floor** (never needed here: Boris never hurt anyone enough). One run, clean on the first try:

- **OK, exit 0, 16 checks.** The board holds nineteen cards and none for the chapter; the typed word `dragon` opens party prep and it holds (the N cannot start the fight); party prep names "Gullwings, Chapter 1" (EXP; Yuna 12, Rikku 13, Paine 14; the three objectives and the 135-character tip fit the card); the pre scene plays by Enter; the battle opens with **Boris alone at 480 HP on his own sprite key** and the girls on the Gunner, Thief and Warrior; **five real-key attacks** (Enter on Attack, Enter on the one foe) take Boris down after **three Spider Attacks** (Yuna, Rikku, Yuna: his web never came, as the bench predicts); the seam plays and names the Celsius; **act 2 opens with the Flame Dragon alone at 980 HP and all three girls at full HP and MP** (576 / 630 / 741 HP); **no console error, no 4xx or 5xx, no request for a missing art file** (the presenter draws a procedural silhouette for the four unpainted keys without asking for pose files).
- Screenshots (committed, `docs/screenshots/ch-gullwings-ch1/`), **captions as the images show them**: `desk-0-board` the chapter-select board, nineteen cards and none for this chapter. `desk-1-party-prep` the prep card ("Gullwings, Chapter 1", FFX-2 EXP, Lv 12 / 13 / 14 Gunner / Thief / Warrior, the three objectives and the tip; **the title wraps its "1" onto a second line at this width**, a cosmetic the title's length causes). `desk-2-pre-scene` the pre scene's first line over the Zanarkand Dome's plate. `desk-3-first-menu` and `desk-3a-first-menu-clear` act 1's first menu with the coach card up and dismissed: **Boris is the presenter's dark hooded cone with a glowing eye, tall on the Dome's plate** (a stand-in at the stage's boss height), the strategy-guide card (Boris's page) on the left, the Enemy Intent card reading **Spider Attack, SCRIPTED, 39-46 / 39-46 / 29-31 on Yuna / Rikku / Paine**, the menu Attack / Skill / Change / Item, and the move advisor's next best move. `desk-3c-pause` the pause screen. `desk-4-boris-down` Boris fallen. `desk-5-seam` the seam's first narration line ("The spider curls up on the stones. The sphere is theirs, and the Celsius ...", mid-typing) with the girls hurt a little (Yuna 533, Rikku 586). `desk-6-act-2-first-menu` act 2's first menu: **the Flame Dragon's page on the guide card, the Intent card reading Flame Breath 170-192 / 155-175 / 183-207 (26 to 31 percent of each girl's HP), the girls whole, and the advisor's next best move "Black Mage, in Change: the chapter's line wants Black Mage back"** (the tactic reads on the real board).
- **Not run:** acts 2 to 4 to a result (the engine's flow test plays all four through `setupForNextLink`), a defeat and retry in a browser, the pause screen on each act. J1 to J10 above are the specs for them.
- **The phone tier (390 x 844, touch, `--short`: stops at the first menu and the pause screen) is also OK, 10 checks, no console error and no 4xx or 5xx:** the board, the word, party prep (the three girls, EXP), the pre scene, then the first menu with Boris alone at 480 HP and the three plates in a row under the stage, the placeholder standing clear of the Attack / Skill / Change / Item grid and the one-line Intent bar reading "Spider Attack, SCRIPTED, random: Yun 39-46 / Rik 48-57 / Pai 29-31"; the pause screen. Screenshots `phone-0-board`, `phone-1-party-prep`, `phone-2-pre-scene`, `phone-3-first-menu`, `phone-3a-first-menu-clear`, `phone-3c-pause`.

## 11. Files and merge hot spots

New: `src/data/gullwings-ch1-ids.ts`, `chapter-ffx2-gullwings-ch1.ts`, `chapter-meta-ffx2-gullwings-ch1.ts`; `src/data/ffx2/enemies/{gullwings-ch1,gullwings-ch1-abilities}.ts`; `src/data/ffx2/builds/gullwings-ch1.ts`; `src/data/ffx2/monster-records/records-gullwings-ch1.ts`; `src/data/ffx2/command-records/gullwings-ch1.ts`; `src/battle/ffx2/ai/gullwings-ch1.ts`; `src/app/screens/frontend/dragonDoor.ts`; `src/story/scripts/ffx2-gullwings-ch1.ts`; `src/engine/tactics/ffx2-gullwings-ch1.ts`; `src/data/guides/ffx2-gullwings-ch1.ts` and `docs/ffx2-gullwings-ch1.ts`; the fixture `tests/fixtures/parity/ffx2/gullwings_ch1_rows.json`; the helper `tests/unit/helpers/gullwingsCh1Drive.ts`; eight test files (`chapters/gullwings-ch1-{ai,bench,data,engine,flow,guide,story,tactic}.test.ts`) and `dragon-door.test.ts`; the tool `tools/gullwings-ch1-smoke.mjs`; `research/re-ffx2-gullwings-chapter1.md`, `docs/plans/ch-dragon-review.md`.

Shared files touched (all additive but the first; **likely conflicts with the other wave-5 lanes, in order**; the full list with reasons is the `CONTRACT-CHANGES.md` entry of 2026-11-09):
1. `src/battle/ffx2/dressphere-stats.ts` (the one fix, section 4 finding 1; no other lane should touch it).
2. `src/data/encounters.ts`: `ChapterId` gains `'ffx2-gullwings-ch1'`, `ListedChapterId` excludes it, `Chapter.number` gains `51` (**take the union with the other lanes' edits of the same lines**; 399 of 400 lines, none added).
3. `src/data/chapters-experiments.ts`, `src/data/chapter-meta-hidden-r76.ts`, `src/app/screens/frontend/chapterDoors.ts` (the LAST row and one import), `tests/unit/helpers/doorWords.ts` (`dragon` last), `critic/runner/lib/route-pure.mjs` (one row); the door suites' lists and `chapter-numbers` where they list every number.
4. `src/battle/ffx2/ai/index.ts`, `ai/script-rolls.ts` (`SCENES.boris`), `data/ffx2/enemies/index.ts`, `command-records/index.ts`, `monster-records/records.ts`, `monster-records/kill-rewards.ts` (four rows), `battle/ffx2/adapt/kill-rewards.ts` (`KILL_ITEM_ID`: 0x9007, 0x900f, 0x9021, 0x904a), `data/ffx2/items/held.ts` (five rows, one `UNSOURCED_PRICE_IDS` entry), `tests/fixtures/parity/ffx2/kill_reward_rows.json` (four rows).
5. `src/data/guides/index.ts`, `src/data/guides/docs/index.ts`, `src/engine/tactics/index.ts`, `src/engine/tactics/lookup.ts` (`CHAPTER_GAME`).
6. The pinned lists that gained a row (each one edit): `parity-ffx2-rewards-data` (four names), `parity-ffx2-ai-rolls` (the scene table), `ffx2-hit-reaction-wiring` (four bodies), `ffx2-steal-item-names` (`red-ring`), `guide-ffx2-wait-habit`, `guide-link-title`, `data-ffx2-command-records`, `data-ffx2-monster-records`, `audio-music-batch1-2026-10-10`, `audio-music-batch2-2026-10-12`, `chapters/experiment-flow` (the `gullwings` flag list and the no-save-card list gained the three later acts) and `helpers/doorWords` (`dragon`, last; the door suites `chapter-doors`, `drillshot`, `wraith` and `ifrit` read it and pass unedited).
7. `docs/CONTRACT-CHANGES.md`: the entry on top. **`CHANGELOG.md` and NOW.md are not edited** (the integrator writes the release entry; the lines are in section 13).

Not touched: any scene file (the Dome is used as it is), `zanarkand-dome.ts`, the presenter, any other chapter's data. No source file added is over 400 lines (the longest, `data/ffx2/enemies/gullwings-ch1.ts`, is 313).

## 12. Tests and checks

**Mine (175 tests in 10 files, all passing):** `chapters/gullwings-ch1-data` 47, `-ai` 27, `-engine` 26 (three seeds a fight, about 16 s), `-flow` 12 (all four links through `setupForNextLink`, the retry rules, the no-save-card rule), `-story` 18, `-guide` 10, `-tactic` 8, `-bench` 10 (100 seeds a cell, about 5.4 minutes; section 6), and `dragon-door` 17. The probe files used while building are not in the repo.

**Shared suites touched and green:** the pinned lists in section 11 item 6, and `entrance-census` (which now walks chapter 51 on its own: every body whole on its first frame).

- `npx tsc --noEmit` clean for `tsconfig.json` and for `tsconfig.e2e.json`.
- `node tools/orphans.mjs`: 24 orphans of 2,597 modules, **none of them mine** (every module this branch adds has an importer).
- `node tools/critic-plan.mjs`: classes the change **deep** (it touches the stat table, the AI index and the kill-reward table); no review has been run and nothing was deployed (the release driver owns that).
- **The full suite** (`--maxWorkers=3`, 2,170 files): the first run was cut off by this lane's own `timeout` after about 1,222 files (1,220 passed, 3 skipped, **1 failed file**); the 948 files it did not reach were then run in four chunks of at most 240, **every chunk exit 0**: 237 + 224 + 239 + 216 = 916 files passed and 3 + 16 + 1 + 12 = 32 skipped, and 3,294 + 3,170 + 3,156 + 2,455 = **12,075 tests passed**, 146 skipped, none failed. (The first run's own tally reached 21,866 passed, 642 skipped, 7 failed before it was cut.)
- **The one failing file, not mine:** `chapters/r78-boss-art-resolves.test.ts`, 7 of 10 tests. Its manifest assertions name Spherimorph, Ultima Weapon, Omega Weapon and Nemesis, and the files on disk for them; this worktree's `public/art` mirror is the older one (r64) and holds none of the r78 art. It reads the mirror's manifest and the Omega Ruins and Youth League data, none of which this branch changes, and this tree's `public/art/characters` holds none of the four subjects' folders (0 found). It was not re-run on a clean `origin/main` checkout; it should pass where the r78 mirror is installed.

## 13. CHANGELOG lines (FFX-2 only unless tagged; for the integrator's release entry)

- **FFX-2 only (new hidden chapter 51, "Gullwings, Chapter 1", not on the board):** Boris at the Floating Ruins, the Flame Dragon in Besaid's cave, the Guardian Beast in the Zanarkand Ruins and YSLS-Zero at Kilika's approach as four fresh fights in a row, opened by typing `dragon` on chapter select: the game's own rows and scripts, a new Chapter 1 party (Yuna Gunner, Rikku Thief, Paine Warrior; levels an estimate), the Celsius mending the party between acts. The four bosses have no paintings yet (placeholders), the arena is the Zanarkand Dome's plate, the story is a draft, the music is a stand-in.
- **FFX-2 only:** the Guardian Beast curses, and under a third of its life looses Damocles Photon (half of every girl's maximum HP); YSLS-Zero's Blast Punch takes half of one girl's maximum HP; Boris' Sticky End comes once.
- **FFX-2 only (engine fix):** a girl below Lv 20 now has fewer stats than one at Lv 20 (the fallback table ran backwards under its first anchor); no shipped chapter has a girl under Lv 20.
- **Both games (shared plumbing, nothing a player sees):** four more game item names in the kill-reward table (Star Pendant, Red Ring, Amulet, Wristband) and five held-only item rows.

## 14. Open questions (for Bailey, or for the RE session where it says so)

1. **Is the level right?** One build at 12 / 13 / 14 makes Boris and the Dragon tutorials and the Beast and YSLS-Zero the fights (section 6); the options are A (shipped), B (8 / 9 / 10) and C (the per-link override). Play it first.
2. **The paintings, the card (section 7), the story draft's read (section 8) and the stand-in cue:** Bailey's.
3. **The Oversoul forms and the Gun Mage** (U3, U4): unbuilt, unowned.
4. **The Stop byte** (section 3): the data follows the row; the research note's "40 percent" is the lane's reading of the byte.
5. **Item effects:** the Red Ring has none in the research; the other four drops and steals are held-only rows with the researched effects (not wired).
6. **Listing the chapter** and its place in the board's order wait for his word.

## 15. Open issues after the build

1. **The party's level is an estimate** (A 12 / 13 / 14 shipped, B 8 / 9 / 10, C the per-link override, DR3): Boris and the Flame Dragon fall to any line at any level from 4 to 22, so they are tutorials at the shipped level, and **Boris' web is seen in 0 of 100 seeds** there (8 of 50 at 8 / 9 / 10).
2. **The paintings, the card and the music are stand-ins and the story is a draft** (sections 7 and 8): the four bosses draw as the presenter's placeholder at the stage's default boss height of 2.9, tall for a spider; no art lane step has run.
3. **The prep card's title wraps its "1" onto a second line** at 1600 x 900 (`desk-1-party-prep`): a cosmetic of the title's length ("Gullwings, Chapter 1"); not fixed here (the title is the meta's; a shorter title is Bailey's word).
4. **The Active clock leaves the Guardian Beast at 19 of 50** with the shipped line (84 percent at the Wait split, 97 of 100 at bench speed): the tuning lever is the party's level (A / B / C), never a boss number.
5. **YSLS-Zero's "farthest girl" is a uniform pick** because the scene's position file ships empty (GC3, `[inferred]`); the Beast's and the Dragon's near-weighted picks are uniform for the same reason.
6. **Unbuilt:** the Oversoul forms (DR6) and the Gun Mage the guides recommend against YSLS-Zero (U3, U4); the Dragon's Tail Smash (in a commented-out block of its source).
7. **The research note's "Stop 40 percent" is a byte of 40 of 255** (15.7 percent; 17.3 percent measured over 300 girls); the data, the AI and the guide print the byte.
8. **The Red Ring has no sourced effect or price**; it is a held-only row in `UNSOURCED_PRICE_IDS` and is not wired as an effect.
9. **`chapters/r78-boss-art-resolves.test.ts` fails 7 of 10 in this tree** because its `public/art` mirror predates the r78 art (section 12); not this branch's.
10. **One shared change is not additive in effect:** `battle/ffx2/dressphere-stats.ts#interpolate` now runs down the first segment below the first anchor (a girl under Lv 20 had MORE stats than one at Lv 20). No shipped build has a girl under Lv 20, so nothing shipped changes; the integrator should keep it and nobody else should touch the file in this wave.
11. **Deploy and review are owed and not done:** `critic-plan` classes the change deep; this lane built nothing for production and touched no release worktree (the release driver owns them).
