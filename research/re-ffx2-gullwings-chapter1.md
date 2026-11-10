# FFX-2 Chapter 1 bosses (Boris, Flame Dragon, Guardian Beast, YSLS-Zero): rows 132, 122, 162 and 47, their four scripts and scenes, read from the game's own files

**Game case: FFX-2 only.** The four fights are the Chapter 1 hotspot missions of FFX-2 (ATB, dresspheres, the FFX-2 kernel tables). The FFX Sanctuary Keeper (which the Flame Dragon is said to resemble) and every FFX number are untouched; no FFX number is used.
Written 2026-11-09 by a Sonnet sub-agent of the Echoes of Spira driver (program plan row 51, `PLAN.md` of 2026-11-06, wave 56). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed; the game was not run; no browser, no GPU, no Ghidra.** Authority (relayed words, verbatim): 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers and described behaviour from the owner's Steam copy (FFX-2 half of the HD Remaster), read by the earlier lanes' node tools (`x2read.mjs` with the output folder changed, `dump-rows.mjs`, `formations.mjs`, `ffx2-src-moves.mjs`, `cmp-src-bin.mjs`, `x2dis.mjs`, `scan-events.mjs`; kept in the research scratch, not in this repo). Names are the game's English name tables; **no dialogue, no script lines, no byte dumps**; developer labels are given in a few translated words.

**Tags.** **[R]** read from a game file (kernel table, the shipped plain-text AI source, the compiled worker, a scene file); **[I]** inferred from [R]; **[G]** a guide (Jegged FFX-2, Gamer Guides FFX-2 HD); **[calc]** arithmetic with the repo's formulas (`research/re-ffx2-damage.md` section 1), a size and not a claim; **[gap]** no source. **GameFAQs was tried for this note (HTTP 403, a Cloudflare challenge to a headless read; the browser is out of scope for treeless research), so Jegged and Gamer Guides stand in for it; where a guide and the game's own files differ, the files win (they are the game's data), and the difference is written in the "against the files" section. A GameFAQs read through the built-in browser remains owed if Bailey wants a third guide.**

## Summary for the driver

1. **Four rows, four short scripts, no new mechanic.** Boris 480 HP (Lv 8), Flame Dragon 980 (Lv 16), Guardian Beast 2,886 (Lv 18), YSLS-Zero 1,935 (Lv 11). Each stands **alone** in its formation; the sources equal their compiled workers (command ids, the `random() % n` moduli, the scene constant: `cmp-src-bin.out.txt`). [R]
2. **Boris (script).** Three Spider Attacks, then **Sticky End once** (all three girls, about 50 each, Stop 40 percent [the base at equal levels; about 15 percent at this chapter's levels: Corrections 1 below]), then for ever: Spider Attack three polls in four, Spider Bite one in four. **The guides say Sticky End loops every fifth turn; the compiled worker sets a one-shot flag.** The file wins (it is the game's data). [R; G conflict]
3. **Flame Dragon.** **Flame Breath on all three on its first poll**, then Attack on the girl with the **most current HP**, and one more Flame Breath the first time its own HP is under 100. Weak to Ice, half Fire. [R; G agrees]
4. **Guardian Beast.** A four-poll beat: three Attacks then **Curse** on the first living girl who does not already carry it; once its HP is under a third (under 962) the Curse becomes **Damocles Photon on all three, half of each girl's maximum HP** (formula 7, power 8). Weak to Fire, Ice, Thunder, Water and Holy. [R; G agrees, both quote "half"]
5. **YSLS-Zero.** One draw of 4 per poll: Haymaker (two hits, always hits) about 46 percent of polls, **Blast Punch** (half of max HP on one girl, cast 140, delays) about 21 percent, Attack about 33 percent. Targets: lowest-HP girl, highest-HP girl, the farthest girl, or a living girl. [R, calc]
6. **A "battle too long" block is live in each scene** (Boris from poll 135, YSLS-Zero 135, Flame Dragon 140, Guardian Beast 180; each ends in Time Up Meteor, power 200, 12 hits): unreachable in play, port with one test as the Ifrit chapter did. [R]
7. **Chapter 1 has no party in the repo.** The nearest sourced party is the Chapter 2 preset (Yuna 23, Rikku 24, Paine 25), which is **above** this chapter. A new Chapter 1 build is an `[estimate]`; the lever is the party, never a boss number. [gap]
8. **The cost** is about 26 h against the plan's 36 (preflight section 9); research is done.

## 0. Result in one screen (`monster.bin` rows)

| Field | **Boris (132)** | **Flame Dragon (122)** | **Guardian Beast (162)** | **YSLS-Zero (47)** |
|---|---:|---:|---:|---:|
| Id | 0x1084 | 0x107a | 0x10a2 | 0x102f |
| Level | 8 | 16 | 18 | 11 |
| HP / MP | 480 / 0 | 980 / 620 | 2,886 / 1,000 | 1,935 / 0 |
| STR / DEF / MAG / MDEF | 16 / 3 / 2 / 1 | 37 / 38 / 48 / 1 | 65 / 60 / 46 / 3 | 74 / 104 / 0 / 3 |
| AGI / ACC / EVA / LCK | 95 / 95 / 0 / 3 | 78 / 95 / 0 / 4 | 112 / 95 / 0 / 6 | 62 / 95 / 0 / 2 |
| Special word | 0x18 (bits 3, 4) | 0x25b (0, 1, 3, 4, 6, 9) | 0x2db (0, 1, 3, 4, 6, 7, 9) | 0x31b (0, 1, 3, 4, 8, 9) |
| Elements | **weak Fire and Ice**; null none | **weak Ice; half Fire; null Gravity** | **weak Fire, Ice, Thunder, Water, Holy; null Gravity** | null Gravity |
| Ailment walls | Death, Sleep, Poison, Confusion, Berserk, Curse, Itchy, Auto-Life 255; Eject 100; Stop, Doom 255; Petrify, Silence, Darkness land | Death, Petrify, Sleep, Silence, Confusion, Curse, Itchy, Auto-Life 255; Darkness 50; Eject 40; Stop 255; Poison, Berserk land | Death, Petrify, Sleep, Silence, Poison, Confusion, Curse, Itchy, Auto-Life 255; Darkness 50, Berserk 60, Eject 200; Stop, Doom 255 | Death, Petrify, Sleep, Silence, Poison, Confusion, Berserk, Curse, Itchy, Auto-Life 255; Eject 32; Stop, Doom 255; Darkness lands |
| Moves (waza) | Spider Attack, Sticky End, Spider Bite | Attack, Flame Breath | Attack, Damocles Photon, Curse, Die | Attack, Blast Punch, Haymaker |
| EXP / Gil / Pilfer Gil / AP | 26 / 300 / 700 / 1 | 60 / 300 / 800 / 1 | 170 / 200 / 1,500 / 1 | 350 / 1,000 / 1,400 / 1 |
| Drop (both slots) / steal | Star Pendant x1 / Remedy x1 or x2 | Red Ring x1 / Hi-Potion x1 or x2 | Amulet x1 / Defense Veil x1 | Wristband x1 / Mythril Gloves x1 |
| Bribe | Antidote x30 / Pretty Orb x1 | Fire Gem x30 / x40 | Oath Veil x1 | none (Bribe bit set) |
| Zantetsu byte | 45 | 15 | 80 | 10 |

The special-word bits mean (earlier notes, `re-ffx2-farplane-cup.md` section 3): bit 0 percent-HP formulas do nothing, 1 hit reactions do not stop it, 3 and 4 unnamed, 6 no ATB damage, 7 no Zantetsu, 8 no Bribe, 9 immune to Interrupt. **Boris is the only one of the four that percent-HP formulas can touch** (bit 0 clear), and **Boris and YSLS-Zero can be delayed** (bit 6 clear); Flame Dragon and Guardian Beast cannot. [R]

Each also carries an Oversoul id (0xa00b, 0xa024, 0xa022, 0xa00c) and an Oversoul script (`o###.src`): **the Oversoul forms are not read and not in this chapter** (the Guardians chapter's BG7 precedent). The guides give their HP for reference only: Boris 804, Flame Dragon 1,883, Guardian Beast 4,030, YSLS-Zero 4,831. [G]

| Scene | Formation (btl.txt) | Slot, scale | Map name (Japanese label, translated) | Launcher package |
|---|---|---|---|---|
| `mtgz17_229` | 1696 | Boris, 100 | Floating Ruins summit | `mtgz1700` |
| `bsil08_229` | 399 | Flame Dragon, 70 | Besaid, natural parts C | `bsil0800` |
| `dome08_229` | 1727 | Guardian Beast, 75 | ruin-type parts (Zanarkand Ruins) | `dome0800` |
| `klyt01_226` | 469 | YSLS-Zero, 100 | Kilika temple approach | `klyt0100` |
| `stbv03_224` | 1419 | YSLS-Zero, 100 | Bevelle Underground outside | `stbv0300` (a later fight, same script) |

Start positions: only Boris's scene has a position file: the girls at (0,0,-45), (15,0,-45), (-15,0,-45), Boris at (0,0,25). The other three position files are empty, so every near-weighted pick in them is uniform, as in the Tourist Trap and Leblanc notes. [R: the scene event scan and the formation table]

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf` (Steam HD Remaster, FFX-2 half) read with the repo's node VBF reader into a research scratch folder only |
| Kernel tables [R] | the same files as `re-ffx2-farplane-cup.md` section 1 (`monster.bin` 96,596 bytes, `monmagic.bin`, `command.bin`, `item.bin`, `btl.txt`, English `monster.bin`) |
| AI sources [R] | `m132.src` (2,209 bytes; 3ca32425c31a6200), `m122.src` (2,906; 8e0e6d8c6b03ce0b), `m162.src` (2,646; fb60e9437c3f6314), `m047.src` (3,052; 531241ed551b6d41); compiled `battle/mon/_m132/m132.bin` (92,304; f3e63f282f99e8d0), `_m122` (89,872; d5b0bb1224d490e4), `_m162` (174,128; 3333a8b74689c14d), `_m047` (68,480; 458d0c368f39a0c8) |
| Checks | `cmp-src-bin.mjs`: command ids, `random() % n` moduli and scene constants of each source equal its compiled worker 1 (Boris {4}; YSLS-Zero {2, 3, 4}; Flame Dragon and Guardian Beast draw nothing). The one difference, Flame Dragon's Tail Smash (0x40d9) in the source, sits inside a commented-out block; the worker does not queue it. A read of the worker confirms Boris's Sticky End is a one-shot flag |

## 2. Where each fight is, and the party (guides)

* **Boris.** The first hotspot mission, "Mt. Gagazet: Floating Ruins", after the timed outrun of the Leblanc Syndicate; the party is **Yuna, Rikku and Paine** with the Chapter 1 dresspheres (Gunner, Warrior, Thief, Songstress; the Festivalist for the HD builds). After the fight the Black Mage dressphere is given. [G: Jegged Chapter 1 page 2; Gamer Guides "Mt. Gagazet - Floating Ruins"]
* **Flame Dragon.** The Besaid cave ("Where's Wakka?"): Wakka's sphere on the pedestal. The White Mage dressphere is given after it. The Black Mage is owned by now. [G: Jegged Chapter 1 page 3]
* **Guardian Beast.** Zanarkand Ruins, the sphere on the pedestal in the lattice room; White Mage owned. [G: Jegged Chapter 1 page 14; Gamer Guides "Zanarkand"]
* **YSLS-Zero.** Kilika and the Awesome Sphere, the last fight of Chapter 1; the guides recommend a Gun Mage with Mech Destroyer if the player has one (no source says Chapter 1 gives one), White Mage healing, Warrior Power Break. The achievement is "Zeroed Out". [G]
* **No source gives the girls' levels or kit at these four fights.** The anchor table of `src/battle/ffx2/dressphere-stats.ts` begins at Lv 20; below that the repo extrapolates. [gap]

## 3. The scripts, poll by poll (normal worker; `random() % n` is stream 2, the near-weighted `searchr` stream 4, `searchr_nop` uniform)

### 3.1 Boris (`m132`)

Counters: a poll count `i` (starts 0) and a flag `k` (0). Each poll, in order: **(a)** the "too long" block (section 5); **(b)** if `i` < 3: **Spider Attack** on a near-weighted living girl, `i` + 1; **(c)** else if `k` is 0: `k` := 1 and **Sticky End** on all three; **(d)** else a draw `% 4`: 0 **Spider Bite** on a living girl, 1 to 3 **Spider Attack** on a living girl. No reaction, no HP phase, no status test; one draw per poll from the fifth on. [R, worker read]

So: Attack, Attack, Attack, **Sticky End**, then Attack three in four and Bite one in four for ever. With nobody dying Boris acts about every 2 s of the girls' ATB; the fight is meant to take eight to twelve blows of a Lv 8 band. [I]

### 3.2 Flame Dragon (`m122`)

Flags `flame1` and `flame2` (0), a last-hit memory `reaction` that nothing reads. Each poll: **(a)** the "too long" block; **(b)** if `flame1` is 0: `flame1` := 1 and **Flame Breath on all three**; **(c)** else if its own HP is **under 100**: if `flame2` is 0 then `flame2` := 1 and Flame Breath again, else Attack; **(d)** else **Attack on the girl with the most current HP** (a search over the living girls keeping the one with the highest HP). [R]

The Attack is the only repeated move; it always goes to the healthiest girl, which is why the guides advise Sentinel on that girl. The tail attack in the source is commented out and the worker does not queue it. [R, G]

### 3.3 Guardian Beast (`m162`)

A counter `turn` (0). Each poll: **(a)** the "too long" block; **(b)** `turn` + 1; **(c)** if its HP is **under a third of its maximum** (under 962): if `turn` is 4 or more then `turn` := 0 and **Damocles Photon on all three**, else **Attack** on a living girl; **(d)** otherwise: if `turn` is 4 or more, search for the first living girl **who does not carry Curse**: with none, **Attack**; else `turn` := 0 and **Curse** on her; if `turn` is under 4, **Attack**. Death: a death-animation row (0x40dc), nothing else. [R]

Two readings the guides do not state: (1) once all three girls are cursed the beast keeps `turn` at 4 or more and **only Attacks until its HP is under a third, then fires Damocles Photon on its very next poll**; (2) a girl who was cured of Curse is cursed again on the next beat. Curse in FFX-2 is "cannot change dressphere" (the repo's `abilities-core.ts`), so it matters to a party that plans to Spherechange to a White Mage. [R, I]

### 3.4 YSLS-Zero (`m047`)

Init: it cannot move (`disable_move`), its cursor sits on the chest. Each poll: **(a)** the "too long" block; **(b)** a draw `% 4`:
* **0:** **Haymaker** on the living girl with the **lowest current HP**;
* **1:** a second draw `% 2`: 0 **Blast Punch** on the girl at the greatest distance, 1 **Haymaker** on the living girl with the **highest HP**;
* **2:** pick a living girl; a third draw `% 3`: 0 Blast Punch on the farthest girl, 1 Haymaker on the picked girl, 2 Attack (no cancel) on the picked girl;
* **3:** Attack on a near-weighted living girl.
Per poll: Haymaker 1/4 + 1/8 + 1/12 = **55/120 (45.8 percent)**, Blast Punch 1/8 + 1/12 = **25/120 (20.8 percent)**, Attack (both kinds) 1/12 + 1/4 = **40/120 (33.3 percent)**. [R, calc] The farthest pick needs positions, which the scene lacks, so it is a uniform pick here. [R]

## 4. The moves (`ffx2-src-moves.mjs`; formulas as `re-ffx2-damage.md` section 1)

| Move | Row | Class and formula | Power | Target | Cost, timing and riders |
|---|---|---|---:|---|---|
| Spider Attack (Boris) | 0x40c7 | physical, f0, accuracy formula 1 (acc 95) | 16 x **2 hits** | one | ATB 100; crit 10 |
| Sticky End (Boris) | 0x40c8 | f8 (fixed with variance: v x P x 50 / 256) | 1 | all three | cast 10; **Stop at 40 percent, count 20** [40 is the base at equal levels, lowered by the level gap: Corrections 1 below]; no Shell/Protect effect |
| Spider Bite (Boris) | 0x40ca | f1 (no DEF term) | 32 | one | cast 180; "eats and spits out" |
| Attack (no cancel) | 0x41da | physical, f0, accuracy formula 2 (acc 95) | 16 | one | ATB 100; crit 5 |
| Flame Breath (Flame Dragon) | 0x40d8 | magical, **f9**, Fire | 32 | all three | cast 140, MP 30 |
| Damocles Photon (Guardian Beast) | 0x40da | magical, **f7 (percent of max HP)** | 8 = 8/16 | all three | cast 180, MP 28; **half of each girl's max HP**; Shell halves it |
| Curse (Guardian Beast) | 0x4046 | status | | one | cast 120; Curse 254 (cannot change dressphere) |
| Haymaker (YSLS-Zero) | 0x4057 | physical, f0, accuracy formula 0 (always hits) | 15 x **2 hits** | one | ATB 100; shatter 35 |
| Blast Punch (YSLS-Zero) | 0x4056 | **f7** | 8 = half of max HP | one | cast 140; delay bits set (the guide says it delays) |
| Time Up Meteor and the four "too long" rows | 0x4236, 0x4232 to 0x4235 | | 200 x 12 hits | all | after 135 to 200 polls |

**Cross-check against the guides [calc]** (a girl of the repo's Lv 20 anchors is a ceiling for Chapter 1): Sticky End is 46 to 52 on every girl (Jegged "around 50", Gamer Guides "40 to 50"); Flame Breath on a Gunner, Thief or Warrior block is 180, 162 or 197 (Jegged "150 to 200 on all"); the Flame Dragon's Attack is 45 to 64 (Gamer Guides "40 to 60"); the Guardian Beast's Attack is 109 to 153, half of that under Protect, 54 to 76 (Gamer Guides "50 to 70"); the YSLS-Zero Attack is 96 to 136. The formulas reproduce the guides' numbers in every case where the guide states one. Boris's Spider Attack is 13 to 18 a hit against the guides' "20 to 40": the guides count critical and back-attack hits. [calc, G]

## 5. The "battle too long" block (each scene; no friendly guest in the party)

A poll counter rises by one each poll while no friendly guest is present. In the named scene only: above the first mark "Angry", the second "Furious", the third "About to Blow", the fourth "This Battle Ends Now", then **Time Up Meteor (power 200, 12 hits, everyone) every poll**. The first four rows are announcements (power 0). [R: the compiled workers' constants]

| Boss | Scene(s) | Marks (polls) |
|---|---|---|
| Boris | `mtgz17_229` | 135, 140, 145, 150 |
| Flame Dragon | `bsil08_229` | 140, 150, 155, 160 |
| Guardian Beast | `dome08_229` | 180, 190, 195, 200 |
| YSLS-Zero | `klyt01_226` and `stbv03_224` | 135, 140, 145, 150 |

None is reachable in play (Boris acts about every other beat of the girls). The Ifrit chapter ported the equivalent block (about 15 lines, one test) because its scene constant matched; the same applies here. [R, note: `re-ffx2-ifrit-kilika.md` section 3]

## 6. Guides against the files

| Statement | The files |
|---|---|
| Gamer Guides: Boris uses an attack "for four turns, then Sticky End, looping from there" | **disagrees**: three Spider Attacks, one Sticky End, then no more (a one-shot flag in the compiled worker) |
| Jegged: Boris's Sticky End "hits all party members for around 50 and inflicts Stop", claw attack twice for 20 to 30 | agrees (f8 power 1 = 46 to 52; two hits; Stop 40 percent at equal levels, about 15 percent at this chapter's: Corrections 1 below) |
| Both guides: Flame Dragon opens with Flame Breath (150 to 200), the Attack aims at the highest-HP girl | agrees exactly |
| Both: Guardian Beast Attack x3 then Curse; under about a third (about 960 HP) Damocles Photon replaces Curse, half of max HP | agrees exactly (962) |
| Gamer Guides: YSLS-Zero uses a basic physical, **Blast Punch (half max HP, delay)** and **Haymaker (two hits)** | agrees; the script gives the odds in section 3.4 |
| Gamer Guides, Guardian Beast: Berserk is a legitimate answer, and a berserk beast does not use Damocles Photon | consistent (a berserk actor's scripted command is replaced by an attack); the engine's Berserk rule decides |

## 7. Engine and art facts (checked against `origin/main` bc93b1fdd by reading)

* **The AI template** is `src/battle/ffx2/ai/ifrit.ts` and `valefor.ts` (counter, thresholds, farthest pick, the "too long" block) with `script-rolls.ts` helpers: `extremePick`/`extremeId` (the girl with the highest or lowest current HP: Flame Dragon, YSLS-Zero), `searchNear`, `lacking(girls, 'curse')` (Guardian Beast), `maxHpDiv`, a `SCENES` table for start positions (Boris's scene only). No new AI primitive is needed. The `x2-` ids: `x2-boris`, `x2-flame-dragon`, `x2-guardian-beast`, `x2-ysls-zero`.
* **Data:** four enemy defs, nine ability rows (Attack no-cancel exists as the shared row), five announcement/Time-Up rows (shared with the Ifrit chapter), the monster records from the fixture generator.
* **Chain:** `enemyGroupRef` + `nextGroupId`, `restoresPartyOnEntry` and `noSaveSphereCard` for links 2 to 4, as the Cup and Guardians chapters. **A chain has one `buildRef` and one `sceneKey`** (`encounters.ts`): per-act parties and per-act plates are engine gaps (section 9).
* **Art:** `x2-aranea` (a spider painting) exists and fits Boris recoloured; **no Flame Dragon, Guardian Beast or YSLS-Zero painting exists**. The Flame Dragon is the same model family as the Zalamander (row 121, motion 0x1078, plan row 55) and the Guardian Beast the same as Azi Dahaka (motion 0x10a2, row 55): **one painting serves each pair**. Plates in the art mirror (release 75): `gagazet`, `zanarkand-dome`, `ffx2-djose-chamber-standin`; Besaid's cave and Kilika's approach have none.
* **Music:** stand-ins `boss-ffx2-fallen-aeons` (the cue Ifrit, Valefor, Angra Mainyu play), `victory-ffx2`, the field bed `scene-bevelle-underground` (flagged, rule 13).

## 8. Open items

| # | Item | Decision |
|---:|---|---|
| U1 | The girls' levels and kit at each fight | `[gap]`: a Chapter 1 build is estimated; the bench (T0) fixes a band; levels are never read from a boss |
| U2 | Whether the farthest pick (YSLS-Zero) ever matters | its scene has no positions: uniform |
| U3 | The Oversoul forms | not read, not built |
| U4 | Whether a Gun Mage is owned at Kilika | no source in Chapter 1: not owned |
| U5 | How the game orders the four fights for a player who skips side content | the hotspot order of the guides (Floating Ruins, Besaid, Zanarkand Ruins, Kilika) |

## Research files (kept outside the repo)

The paper preflight is `docs/plans/ch-dragon-review.md` in this repo. The row dumps, the move-row dump, the formation table, the source-to-worker comparison, the arithmetic and the door check were run from the research scratch; their numbers are in sections 0 to 5 above, and the chapter lane re-read the rows from the kernel tables into `tests/fixtures/parity/ffx2/gullwings_ch1_rows.json`.

## Corrections found by building and running it (2026-11-09, the chapter lane)

These are written into the build's tests and the handoff (`docs/handoff/ch-gullwings-ch1.md`); the note above is left as the research lane wrote it, apart from three bracketed pointers (the summary's item 2, the §4 Sticky End row and the §6 Jegged row) that send a reader of "Stop 40 percent" to finding 1 below.

1. **Sticky End's Stop is 40 at equal levels, about 15 percent at this chapter's levels.** The row's Stop slot reads 40 with a counter of 20 (the note's §4 table says "Stop 40 percent", which is right as the base). The engine's status roll is `draw % 101 < c + 5 * (lvA - lvT) - r` (`src/battle/ffx2/kernel/status.ts`), so Boris at Lv 8 against girls at Lv 12 / 13 / 14 gives 20, 15 and 10 in 101 (14.9 percent on average; 52 of 300 girls stopped, 17.3 percent measured); a Lv 8 party would see 40 percent. The guides' "may inflict Stop" agrees with the measure and not with four in ten. (Reading the 40 as "a byte of 40 of 255" was the build's first reading and is withdrawn.)
2. **The Guardian Beast's Curse target is a `searchr` over the girls without Curse** (a random pick among them, uniform here because the scene's position file is empty), not "the first living girl" the note's §3.3 says; the source's search has no "first" in it.
3. **The fallback stat table ran the wrong way below Lv 20** (`src/battle/ffx2/dressphere-stats.ts`): a Lv 12 Gunner had 1,035 HP, more than a Lv 20 one (862), because the loop that finds the segment fell through to the last pair. The preflight said "the engine's stat table extrapolates below its Lv 20 anchor"; it now does (576 HP at Lv 12, the growth formulas' 562).
4. **YSLS-Zero's Defense of 104 does not blunt a blow at this chapter's levels.** At Lv 12 / 13 / 14 a Warrior's blow does 68, a Gunner's 46 and a Thief's 22 twice; a Black Mage's Fire does 93. The guides' "send a mage / a Gun Mage with Mech Destroyer" is advice for a party the repo does not field (no Gun Mage: U4); the bench finds the three starting dresspheres win with fewer knock-outs than two Black Mages and a White Mage.
5. **Boris dies before his Sticky End** unless the party is at Lv 8 or under (0 of 100 seeds at Lv 12 / 13 / 14; the 50-seed human-speed bench: 8 of 50 at Lv 8 / 9 / 10 and 44 of 50 at Lv 4 / 5 / 6, the handoff's table): the first act is a tutorial by design in the guides and by measure here; the party's level is the lever (DR3's alternative, a per-act build, is the way to make the web appear).
