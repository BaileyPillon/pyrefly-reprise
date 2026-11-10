# FFX-2 Luca opener (Logos and Ormi, then Leblanc; and the concert fight before them): rows 130, 129, 131 and 280, their scripts and the two Luca scenes, read from the game's own files

**Game case: FFX-2 only.** The fights are the first fights of FFX-2 Chapter 1 (Luca stage and docks): ATB, dresspheres, the FFX-2 kernel tables. The Leblanc Syndicate material (the Chateau Leblanc fights of Chapter VI, scripted from rows 243 to 245 and others, and the later Syndicate fights) uses **other rows** of the same three people (Ormi 241 to 246, Logos 247 to 251, Leblanc 252 and 253; the repo's `ai/syndicate-ormi.ts`, `syndicate-logos.ts` and `leblanc-syndicate.ts` script those); no number is shared with them.
Written 2026-11-09 by a Sonnet sub-agent of the Echoes of Spira driver (program plan row 52, `PLAN.md` of 2026-11-06, wave 56). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed; the game was not run; no browser, no GPU, no Ghidra.** Authority (relayed words, verbatim): 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers and described behaviour from the owner's Steam copy (FFX-2 half of the HD Remaster), read with the earlier research lanes' node tools. No dialogue, no script lines, no byte dumps; developer labels are translated in a few words.

**Tags.** **[R]** read from a game file; **[I]** inferred; **[G]** a guide (Jegged FFX-2 Chapter 1, page 1 "Luca"); **[calc]** arithmetic with the repo's formulas, a size and not a claim; **[gap]** no source. The second guide (Gamer Guides) has no page for the prologue fights, so every statement of [G] below rests on Jegged alone. **GameFAQs was tried for this note (HTTP 403, a Cloudflare challenge to a headless read; the browser is out of scope for treeless research), so Jegged and Gamer Guides stand in for it; where a guide and the game's own files differ, the files win (they are the game's data), and the difference is written in the "against the files" section. A GameFAQs read through the built-in browser remains owed if Bailey wants a third guide.**

## Summary for the driver

1. **Three scenes, not two.** The files hold the **concert fight** (`lchb19_229`: two Goons and the Yuna look-alike, row 280, with a drum machine and a microphone as props), the **dock fight with Logos and Ormi** (`lchb03_229`) and the **dock fight with Leblanc** (`lchb03_228`). The plan names the last two; the concert is the game's very first battle and is the "opener" proper. [R]
2. **The plan's two acts are tiny and exactly readable.** Logos 86 HP (Lv 2), Ormi 97 (Lv 2), Leblanc 130 (Lv 5, MP 101); each script is under 2 KB and equals its compiled worker. Sizes: Ormi's blow is 10 to 11 a hit against a girl of DEF 10 to 30, Logos's two pistol shots 2 to 3, Leblanc's Attack 14 to 15 and Thunder 12 to 13. [R, calc]
3. **Ormi** hits twice, then throws his shield at the farthest girl (power 26), for ever. **Logos** shoots a random girl for 2 hits and throws one Potion at Ormi when Ormi is under a fifth of his HP. **Leblanc** attacks three polls and casts Thunder on the girl with the most HP on the fourth. None has a "battle too long" block. [R]
4. **Ormi starts with 45 HP when he stands alone** (the script halves-ish him when no friend monster is in the formation); in the real scene Logos is beside him and he keeps his 97. A trap for anyone testing him in isolation. [R]
5. **The concert fight** is a different shape: the Yuna look-alike (HP 82, MP 9,999, hidden name) first casts Ecstasy (Double HP, Regen and Haste) on the two Goons, then Thunder on a random girl twice, then keeps the Goons hasted and regenerating and casts Thunder otherwise; below 80 MP it drains the girls. The fight is Rikku and Paine only (two girls in the position file). [R]
6. **Recommendation (driver's call):** build the plan's two acts, and offer the concert as an **optional act 0** (a 2-girl party is the open engine question). About 14 h against the plan's 14.

## 0. Result in one screen

| Field | **Logos (130)** | **Ormi (129)** | **Leblanc (131)** |
|---|---:|---:|---:|
| Id | 0x1082 | 0x1081 | 0x1083 |
| Level | 2 | 2 | 5 |
| HP / MP | 86 / 18 | 97 / 0 | 130 / 101 |
| STR / DEF / MAG / MDEF | 6 / 2 / 5 / 1 | 11 / 60 / 1 / 1 | 14 / 2 / 8 / 37 |
| AGI / ACC / EVA / LCK | 70 / 95 / 18 / 5 | 40 / 95 / 0 / 4 | 88 / 95 / 12 / 10 |
| "Thinking" byte | 30 | 30 | 30 |
| Special word | 0x19b (bits 0, 1, 3, 4, 7, 8) | 0x19b | 0x19b |
| Elements | null Gravity | null Gravity | null Gravity |
| Ailment walls | Silence, Berserk, Curse, Eject, Itchy, Auto-Life 255; Stop, Doom 255 | the same | Berserk, Curse, Eject, Itchy, Auto-Life 255; Stop, Doom 255 (**Sleep, Silence, Darkness, Poison, Confusion, Petrify and Death are not listed: they land**) |
| Moves (waza) | 1H Pistol, Potion, Die | Attack, Pirouette Pitch, Die | Attack, Thunder |
| EXP / Gil / Pilfer Gil / AP | 3 / 60 / 200 / 1 | 3 / 60 / 200 / 1 | 8 / 180 / 500 / 2 |
| Drop / steal | Potion (common), Phoenix Down (rare) / Silver Glasses | Potion, Phoenix Down / Iron Bangle | Hi-Potion, Phoenix Down / Silver Bracer |
| Zantetsu byte | 50 | 50 | 60 |

Special bits (earlier notes): 0 percent-HP formulas do nothing, 1 hit reactions do not stop it, 3 and 4 unnamed, 7 no Zantetsu, 8 no Bribe. [R] Ormi's Death resistance is not listed (he can be killed outright); his DEF 60 is the only high stat among the three: the shield-bearer. Props with HP 1 and no moves: row 265 "SHIELD" (Ormi's shield) and row 139 "Fan" (Leblanc's weapon). [R]

| Scene | Formation | Slots (scale) | Map | Launcher package |
|---|---|---|---|---|
| `lchb19_229` | 484 | drum machine (301), Goon (133), Goon (133), look-alike (280), microphone (281) | Luca stage | `openbtl` |
| `lchb03_229` | 487 | Logos (130) in slot 1, Ormi (129) in slot 2, Ormi's shield (265) in slot 6 | Luca docks, harbour No. 3 | `open0300` |
| `lchb03_228` | 488 | Leblanc (131) in slot 1, her weapon (139) in slot 5 | Luca docks, harbour No. 3 | `open0300` |

**Start positions [R: `pos_*.psc`].** Docks (both scenes): the girls at (21,0,0), (24,0,12) and (24,0,-12); in `_229` Logos stands at (-27,0,9) and Ormi at (-27,0,-12), in `_228` Leblanc at (-27,0,0). From Ormi the farthest girl is the one at (24,0,12) (56.4 against 51.0 and 49.5), the target of his shield throw. Stage: two girls only, at (9,0,-12) and (-9,0,-12); the props and Goons at (0,0,0), (14.2,0,17), (-11,0,17.4), (0,0,17).

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf` (Steam HD Remaster, FFX-2 half) read with the repo's node VBF reader into a scratch folder only |
| Kernel tables [R] | as `re-ffx2-farplane-cup.md` section 1 |
| AI sources [R] | `m129.src` (1,906 bytes; 616201f1efd1dcd0), `m130.src` (1,333; 24ab7326ac4c238d), `m131.src` (1,975; fd43070057b82613), `m280.src` (3,657; 2c128e81a502ae1c), `m133.src` (Goon, 1,780; bfc0f9cf85d8b0ae); compiled workers `_m129/m129.bin` (68,048; 4d37ae4a34b7965d), `_m130` (69,232; 6e94bceb35fd6142), `_m131` (68,672; ba92fc6702a49374), `_m280` (67,248; e05369483ffb5f34) |
| Checks | `cmp-src-bin.mjs`: for 129, 130, 131 and 280 the set of queued command ids equals the compiled worker 0 (these packages have one worker). None names a scene constant. The scripts carry **no "battle too long" block** |
| Launch | `open0300.ebp` (docks) and `openbtl.ebp` (stage) hold the scene constants (read by the event scan of the same wave); not disassembled: the fights are launched by cutscene packages |

## 2. Where they are in the game, and the party (Jegged)

* **Concert.** After the opening concert Rikku and Paine fight two Goons and "????" at centre stage; the Yuna look-alike buffs the Goons, then casts Thunder; "very easy". [G]
* **Dock 3, Logos and Ormi.** The real Yuna joins first: **three girls against two**, "very easy"; Rikku steals from both. After it Yuna gets the Songstress dressphere back, plus the First Steps Garment Grid. [G]
* **Dock 3, Leblanc.** A short tutorial on changing dresspheres in battle; **Yuna is held to the Songstress with one command (Darkness Dance)**, Rikku has time to steal. "Just as easy as the last one." [G]
* **Dresspheres** at this point: Gunner, Warrior, Thief, Songstress (the Festivalist from Brother in the HD builds). The girls' levels are `[gap]`; the stat table of `src/battle/ffx2/dressphere-stats.ts` starts at Lv 20, far above this fight. *Correction, 2026-11-10 (the engine's table, not a game fact): below its Lv 20 anchor the table extrapolated the wrong pair of anchors until the fix of 2026-11-09 (the Gullwings chapter), so a Lv 2 Gunner read 828 HP; it now reads 219 (Thief 212, Lv 3 Warrior 263, Songstress 138). The damage sizes of section 4 below are calculations for a girl of DEF and MDEF 10 to 30, as they say; the chapter's measured blows on its Lv 2 / 2 / 3 party are in `docs/handoff/ch-luca-opener.md` (Ormi's Attack 7 to 16, his shield throw 15 to 25 on Rikku, Logos' pistol 1 to 4, Leblanc's Attack 10 to 15 and Thunder 12 to 13).*

## 3. The scripts (`random() % n` is stream 2, `searchr` near-weighted stream 4, `searchr_nop` uniform)

### 3.1 Ormi (`m129`)

Init: death leaves no revive (`death_nop`); **if no friendly monster is in the formation his HP is set to 45** (so a lone Ormi has 45, a real one 97); his shield is linked to his body as a weapon. Each poll, a counter `t`: if `t` is 2 or more: `t` := 0 and **Pirouette Pitch** (the weak shield throw) on the girl at the **greatest 2-D distance**; else `t` + 1 and **Attack** (no cancel) on a living girl. So the cycle is **Attack, Attack, Shield throw** for ever. Death: a "speak and fall" row (0x405f) if death reactions are allowed. [R]

### 3.2 Logos (`m130`)

Flag `portion` (0). Each poll: if `portion` is 0 and **Ormi's HP is under a fifth of his maximum**: `portion` := 1 and **Potion** (the weak one, f15 power 20 = 20 HP) on Ormi; **otherwise 1H Pistol (two hits) on a uniformly chosen living girl**. After the Potion he only shoots. Death: the same "speak and fall" row; no revive. [R]

### 3.3 Leblanc (`m131`)

Init: she **starts with the ATB wait her record presets** (a delayed first turn); death fades out. Each poll, a counter `t`: if `t` is 0 to 2: `t` + 1 and **Attack** on a near-weighted living girl; else `t` := 0 and: if her MP is **under 8**, Attack; otherwise **Thunder on the living girl with the most HP**. So **Attack, Attack, Attack, Thunder** for ever (Thunder costs 4 MP, she has 101: she never runs dry in a fight). No HP phase, no status test, no reaction. [R]

### 3.4 The concert fight (`m280`, `m133`) — optional act 0

The look-alike (row 280, name masked in the table like row 317's, 82 HP, **MP 9,999**, Lv 1) has no death revive and her weapon (the microphone) is linked. Each poll: **if her MP is under 80: Absorb** (Osmose + Drain, 3/16 of current HP and MP) on a uniform girl; **else** a turn counter + 1 and: **turn 1: Ecstasy on the other monsters** (the two Goons: Double HP 255, Regen and Haste 255, 100 percent heal); **turns 2 and 3: Thunder** on a uniform girl; **later turns:** if the first Goon is alive and lacks Regen, Regen on it; else Haste if it lacks Haste; the same for the second Goon; with both kept up, Thunder. The Goons (13 HP, row 133) just attack. [R]

## 4. The moves (`src-moves-51-52.out.txt`)

| Move | Row | Class and formula | Power | Target | Notes |
|---|---|---|---:|---|---|
| Attack (no cancel / cancel) | 0x41da / 0x4000 | physical, f0, acc formula 2 (acc 95) | 16 | one | ATB 100; crit 5 |
| Pirouette Pitch (Ormi) | 0x40e4 | physical, f0, always hits | 26 | one (the farthest) | cast 180; crit 40; shatter 100 |
| 1H Pistol (Logos) | 0x40e7 | physical, f0, acc formula 1 (acc 140) | 8 x **2 hits** | one | ATB 40; crit 20 |
| Potion (the weak one, Logos) | 0x40f1 | f15 (the power itself) | 20 | one (Ormi) | ATB 100 |
| Thunder (Leblanc, the look-alike) | 0x41eb | magical, f2, Thunder | 7 | one (the script) | cast 70, MP 4, reflectable |
| Ecstasy (look-alike) | 0x405c | f7 (percent of max HP), a heal | 16 = 100 percent | the other monsters | ATB 60; Double HP, Regen, Haste |
| Absorb, Haste, Regen (look-alike) | 0x4040, 0x3176, 0x30b6 | | | | MP gate and upkeep |
| Die ("speak and fall") | 0x405f | | | self | st2 slot 23 (unmapped) |

**Sizes [calc]** (`calc-52.out.txt`; a girl of DEF and MDEF 10 to 30, the Chapter 1 opening is an estimate): Ormi's Attack 10 to 11, shield throw 16 to 17; Logos's pistol 2 to 3 per shot; Leblanc's Attack 14 to 15, Thunder 12 to 13; a Goon's Attack 6 to 7; the look-alike's Thunder 8 to 9.

## 5. Guides against the files

| Statement | The files |
|---|---|
| Jegged: Logos 86 HP and Ormi 97 (Silver Glasses, Iron Bangle steals; Potion and Phoenix Down drops), Leblanc 130 (Silver Bracer; Hi-Potion, Phoenix Down) | **agrees exactly** with rows 130, 129, 131 |
| Jegged: the dock Logos/Ormi fight is "three versus two" and "very easy" | agrees (two enemy slots; the girls' numbers are small) |
| Jegged: the Floating Ruins trio is Leblanc 120, Logos 100, Ormi 130 | **rows 252, 247 and 241**, a different set: not this chapter |
| Jegged: the concert opponents are two Goons and "????"; the look-alike buffs the Goons, then casts Thunder | agrees with `m280` |

## 6. Engine and art facts (checked against `origin/main` bc93b1fdd by reading)

* **AI:** `ai/syndicate-ormi.ts`, `syndicate-logos.ts` and `leblanc-syndicate.ts` exist for the **other** rows; rows 129 to 131 are new scripts (each 6 to 10 lines) and a new data file `enemies/luca-opener.ts`. Ids `x2-luca-ormi`, `x2-luca-logos`, `x2-luca-leblanc` (a distinct prefix so they cannot collide with the Syndicate chapters' defs). `SCENES.lucaDock` for the positions above (Ormi's farthest pick; Leblanc's near-weighted Attack).
* **Needs to check:** a **2-girl party** (the concert) and a Songstress held to one command (Leblanc's act). The chain loop re-inits "with the party's carried-over state"; a party of two is not known to be supported. Item rows (Potion on a monster ally) exist for the Syndicate's goons.
* **Art:** `leblanc`, `logos`, `ormi` (and `exp-leblanc-leblanc`, `-logos`, `-ormi`), the Goons (`ffx2-dr-goon`, `ffx2-fem-goon`) and every Chapter 1 dress painting exist (`yuna-gunner`, `yuna-songstress`, `rikku-thief`, `paine-warrior`, ...). **The act-0 look-alike has no painting** (Leblanc dressed as Yuna's Songstress). Plates: none for the Luca docks or stage in the mirror; `leblanc-last-room` and `ffx2-djose-chamber-standin` are the nearest stand-ins.
* **Music:** `boss-leblanc` (the Syndicate chapters' cue), `victory-ffx2`, the field bed `scene-chateau-leblanc` or `scene-bevelle-underground`; flagged stand-ins (rule 13).

## 7. Open items

| # | Item | Decision |
|---:|---|---|
| U1 | The girls' levels and the bag at Luca | `[gap]`; a Chapter 1 opening build, estimate, measured |
| U2 | Whether a 2-girl party works in the chain and the HUD | T0 check; if not, act 0 is dropped (the plan's two acts stand) |
| U3 | How the game restricts Yuna to Darkness Dance in the Leblanc fight | scripted by the event package, not read; the chapter's prep can set the Songstress with only that command |
| U4 | The meaning of Die's group-2 status 23 (126) | unmapped; it is the "speak and fall" row, not needed |

## 8. Addendum (the fix pass after the adversarial review, 2026-11-09): the three steals' buy prices

Section 0 named the three steal items and the note said "no price". The game's own accessory table gives one. **`accessory.bin` of the Steam HD build (the same file the item names come from): 128 records of 84 bytes starting at byte 32; the u32 at +32 of a record is the BUY price** [verified: the game's own table], the record index being the accessory id minus 0x9000.

| Accessory | Id | Index | Buy price | Role |
|---|---|---|---:|---|
| Iron Bangle | 0x9000 | 0 | **500** | Ormi's steal (row 129) |
| Silver Bracer | 0x9004 | 4 | **500** | Leblanc's steal (row 131) |
| Silver Glasses | 0x9049 | 73 | **3,000** | Logos' steal (row 130) |

That the field is the buy price (not a sell price or a stat): the same field reads **Power Wrist 6,000, White Cape 3,000 and White Lore 50,000**, exactly the buy prices the research already gives for those rows (`ffx2-combat-core.md` §5.4 "1500 / 6000 (sell / buy)", `ffx2-leblanc-syndicate.md` §7.5 "3,000 gil", §5.4 "50,000 gil each to buy"). The US and the Japanese tables read the same numbers for all six. The decoded values and their file offsets are in `tests/fixtures/parity/ffx2/luca_opener_rows.json` (`accessories`). (The same field reads 40 for story items such as Ribbon and Moon Bracer; those rows keep their price as unsourced, they are not this chapter's.)

## Where the numbers came from

This note; the paper preflight `docs/plans/ch-debut-review.md`; the size arithmetic of section 4 (the repo's damage formulas on a girl of DEF and MDEF 10 to 30); the rows, the move tables and the AI sources it quotes were read from the Steam HD files by the research lane's tools. The chapter lane re-read the three monster rows and the seven move rows itself and committed them as `tests/fixtures/parity/ffx2/luca_opener_rows.json` (decoded fields with their file offsets, numbers only).
