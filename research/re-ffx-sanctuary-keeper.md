# FFX Sanctuary Keeper (Mt. Gagazet summit): record, formation and AI read from the game's own files

**Game case: FFX only.** The Sanctuary Keeper (`m128`, formation `mtgz08_00`, Gagazet summit region, just before the Zanarkand ruins) exists only in FFX. It is **not** the Spectral Keeper (`m129`, Zanarkand Dome; `research/re-ffx-spectral-keeper.md`) and not Th'uban (`m282`, the Monster Arena colour swap, program row 54). FFX-2's Bevelle Underground guardians are separate fights in the ATB engine; nothing here applies to them. Part of the `re-parity` track (new chapters), wave-2 sequel of the Keeper and Dark Aeons notes, whose method and engine facts this note reuses. Drafted 2026-11-06 for program row 39 (the program plan (kept outside the repo)). **Treeless: record, formation and AI only. No engine, data, AI or art file was changed; nothing here ran in a browser.**

**Source and tags** (as in the sister note `re-ffx-geosgaeno-evrae-altana.md`).

- **[bytes]** read from the game's own file by a script of this lane (Steam build 25501027, `FFX_Data.vbf`; extracted read-only earlier, kept outside the repo, hard rule 8). **[disasm: file @offset]** read from the Atel disassembly; no script line is reproduced.
- **[run]** the real bytecode of `m128` ran in the small Atel interpreter of the earlier AI lanes (`sim.mjs`, `sim2.mjs`, used unchanged; a lookup of a command's damage-class byte was added in this lane's driver) against a mock battle with the real command-table rows, with exact tallies over all 65,536 results of the shared random stream where a draw is involved. **[engine]** the earlier lanes' decompile corpus. **[arith]** the repo's own kernels (`kernel/ctb.ts`, `kernel/damage.ts` of the clean tree a clean tree, read only): variance 240 to 271, no criticals.
- **[note: X]** a checked note in this repo. **[guide: Jegged / GG / SG]** a community guide, cited by name only (Jegged.com "Mt. Gagazet Cave"; Gamer Guides "Sanctuary Keeper"; Samurai Gamers "Sanctuary Keeper Boss Guide"), read 2026-11-06; nothing copied. **GameFAQs and StrategyWiki answered HTTP 403 (a browser check) and the brief bars the browser, so neither was read; the tie-break "GameFAQs wins" was never needed (the files settled every conflict).** **[inferred]** not read directly. Fields no note maps are given as plain values (hard rule 6).

Files used (size in bytes, SHA-256 prefix): monster file `m128` Sanctuary Keeper (174,300, e79b5be5); formation `mtgz08_00` (17,328, f46ba4c6); field event `mtgz0800` (44,160, b357a6ca); kernel tables `monmagic2.bin` (26,191, 455be7f0), `command.bin` (40,957, 88e6a63a), `monster1.bin` (26,496, 76dc8a40), `btl.bin` (4,096, c4e27912), `ctb_base.bin` (530, 72eaa7b3). The record in the monster file (chunk 2, 0x14 to 0x7F) equals the kernel row byte for byte. **The "174 KB script" of the plan is the file size: about 169 KB of it is a model-and-motion chunk; the AI is 2,407 bytes of code.** Move and item names are the English names of the game's own tables.

## 0. The one-screen summary

- **One monster, one formation, one battle.** `mtgz08_00`, battle id 0x01ED0000 (32,309,248), area key 493; the Keeper is slot 0 (actor 20), no helper. **A defeat is a game over; Escape and Flee are disabled for all seven characters; Switch and Summon are not disabled; Normal start.** Not a water battle. [bytes]
- **40,000 HP, DEF 100, MDEF 100, no element weakness or resistance.** Immune to Death, Zombie, Petrify, Confuse, Provoke, Sleep, Silence, the Eject/Auto-Life/Doom family and to CTB damage (Delay Attack/Buster do nothing, Slice and Bribe are immune too); percentage damage ("Gravity") and Life are immune; **Poison lands (a 254-chance move such as Bio always does), the Armor and Mental Breaks land about 99 percent, Power and Magic Break about 49 percent, Slow about 99 percent, Threaten about 99 percent, Darkness lands from a 254-chance move (Smoke Bomb, Dark Buster) and not from a 100-chance one (Dark Attack)**. Scan lands. [bytes] [arith]
- **A six-state cycle, with no randomness in its order:** (0) **Photon Wings** on the whole front line, (1) **Attack** on the front-line member with the most HP, (2) **Attack** on a random living member, (3) **Mana Breath** on a random living member, (4) and (5) a **support turn**: by default **Curaga on itself** (about 9,999 HP, the cap), but Regen (HP below one quarter, none on it), Esuna (Poison or Darkness on it), Protect (Armor Break on it, no Protect) or the Reflect trick (Reflect on it, HP below one half) replace it, in that rising priority. The very first turn is always Photon Wings. [bytes] [run] (4.2)
- **A counter with a random fuse:** after any action that changes its HP (a hit, a spell, an item, a healing spell too) the Keeper counts one; it answers with **Tail Sweep on the whole front line** once the count exceeds 2 plus a draw modulo 5 (fires on the 3rd hit 20.00 percent, 4th 32.00, 5th 28.80, 6th 15.36, 7th 3.84; mean 4.51 hits). Tail Sweep is a 12-power physical hit on everybody, **removes Haste** and **delays each target** by 3 times its tick speed. Casting Bio, Reflect, Slow, Protect or any other no-HP action does not count; its own Curaga does not either. [run] (4.3)
- **Reactions:** a hit while Slowed makes it cast Haste on itself, or on a front-line member holding Reflect if one exists (a Haste cast at a Reflect holder bounces onto the Keeper; with no Reflect holder it casts it on itself, which bounces onto the party only if the Keeper itself carries Reflect: the guides' trick); with its own Reflect up, from HP below one half, it casts its support spell **at a party member who holds Reflect** (so it bounces onto itself) or casts Reflect on the lowest-HP member first. [run] (4.2, 4.3)
- **Phases at three quarters, one half and one quarter of its HP (30,000 / 20,000 / 10,000):** the script writes the "area" of all seven characters to 1, 2 and 3. **The four areas hold identical start positions** (party, aeons and Keeper), so what changes is presentation (camera or stage), not places. The one gameplay use of the phase is Regen (phase 3) and the Reflect trick (phase 2 and up). [bytes] [run]
- **The numbers that matter, against the repo's Gagazet-cell party (an `[estimate]`):** Photon Wings 937 to 1,058 on each of three plus Curse and four status rolls; Attack 1,230 to 1,556; Tail Sweep 922 to 1,166 each; **Mana Breath 2,510 to 3,610 on one target** (half with Shell); Curaga about 9,999 (it writes its own MAG to 180 for it and to 40 for the breath). The Keeper acts every 24 CTB, as often as Tidus. [arith]
- **Rewards:** 6,500 gil, 11,000 AP (16,500 overkill), Return Sphere, steal Turbo Ether x1 / x2, gear: a Half MP Cost weapon (Piercing too for Auron and Kimahri), an MP +10 percent armour. [bytes]
- **Sources agree with the files** on all of the above except that Gamer Guides says the boss "is able to cast Protect, but only if you use Armor Break" (right) and that Darkness makes it Esuna (the file's Darkness branch exists but only a chance-254 move lands it: Smoke Bomb, Dark Buster); Jegged's Photon Wings list omits Curse (the file, Gamer Guides and Samurai Gamers include it). (section 7)
- **Recommendation for the chapter shape and every pick is in `docs/plans/ch-beast-review.md` (the draft beside this note).**

## 1. The monster record (a)

Offsets are record offsets (chunk 2; layout [note: re-ffx-dark-aeons.md 1; FFX-H02 3.1]). Height, model and hit box were not read.

### 1.1 Identity

Monster word 0x1080, model word 0x1080 (record +0x74), CTB icon 21, Doom byte 30, death animation "Boss" (the body stays, untargetable), Tough (no delay recoil), forced action byte Tail Sweep 0x6044 (a Provoke-forced move that never fires: Provoke is immune). Slot 0 = battle actor 20. [bytes] [disasm: m128 @0x00c5, @0x019a]

### 1.2 Stats

| Field | Value | Tag |
|---|---|---|
| HP / MP / overkill threshold | 40,000 / 256 / 6,400 | [bytes] |
| STR / DEF / MAG / MDEF | 37 / 100 / 40 / 100 | [bytes] |
| AGI / LCK / EVA / ACC | 32 / 15 / 0 / 50 | [bytes] |
| Tick speed (from AGI 32) | 8 (24 CTB per rank-3 action; 12 Hasted; 48 Slowed) | [arith] |
| Flag byte +0x28 | 0x06: immune to percentage damage ("Gravity") and to Life | [bytes] |
| Flag byte +0x29 | 0x07: immune to CTB damage (Delay Attack and Buster do nothing), Slice and Bribe | [bytes] |
| Poison damage byte | 5 (**5 percent of 40,000 = 2,000 per tick**) | [bytes] [note: re-ffx-ctb-status.md 14.4] |
| Element absorb / immune / resist / weak | none of them | [bytes] |
| Automatic statuses | none | [bytes] |
| Extra-immunity word | 0x4300: Eject, Auto-Life, Doom (**Scan lands**) | [bytes] |
| Command list (+0x50) | Mana Breath 0x6043, Photon Wings 0x6042, Tail Sweep 0x6044 | [bytes] |
| Added by the script at init | Curaga 0x302D, Esuna 0x3033, Protect 0x303B, Reflect 0x303C, Regen 0x303E, Attack 0x6000 (the player-side rows) | [bytes] [disasm: m128 @0x01f5 to @0x0222] |

**Status bytes** (255 immune; otherwise the move's chance minus the byte, and a move whose chance byte is 254 lands on anything below 255 [engine: pp_BtlInflictStatus 0x0078AE00]; Threaten's byte is a success percentage [note: re-ffx-biran-yenke.md 2]): Death 255, Zombie 255, Petrify 255, **Poison 90**, **Power Break 50, Magic Break 50, Armor Break 0, Mental Break 0**, Confuse 255, **Berserk 0**, Provoke 255, **Threaten 100**, Sleep 255, Silence 255, **Darkness 100**, Shell 0, Protect 0, Reflect 0, the four Nul 0, Regen 0, Haste 0, **Slow 0**. [bytes]

What the player-side moves do against those bytes (the chance and the byte; a roll modulo 101 below `chance - byte`, or always for 254): Bio (Poison 254), Poison Fang (Poison 254), Smoke Bomb (Darkness 254) and Dark Buster (254) **always land**; Armor Break and Mental Break (chance 100, byte 0) land on 100 of 101 rolls; **Power Break and Magic Break (chance 100, byte 50) on 50 of 101**; Slow (100) 100 of 101, Silver Hourglass (254) always; Threaten 100 of 101; **Dark Attack (100 against 100) never**; Sleep, Silence, Zombie, Petrify, Death, Confuse, Provoke never. The Slow and Delay commands' CTB-damage half is nullified by the CTB immunity; the Slow status lands. [bytes] [arith]

### 1.3 Loot (chunk 4; layout [note: FFX-H02 3.4, 3.5])

6,500 gil; 11,000 AP, 16,500 on overkill; normal drop **Return Sphere** x1 (overkill x2); steal **Turbo Ether** x1 common / x2 rare; always one piece of gear: weapon ability Half MP Cost (0x800C; Auron and Kimahri's weapon rows also carry Piercing 0x800B), armour ability MP +10 percent (0x8077); Zanmato level byte 3. [bytes] Jegged, Samurai Gamers and Gamer Guides agree on the drop, the steal and the gear. [guide]

## 2. The formation (b)

`mtgz08_00`: battle id 0x01ED0000 / 32,309,248 (area key 493 << 16, formation 0). Block bytes: voice 0, byte 1 0, foot-sound id 9, **in-water 0**; monster word 0x1080 in slot 0, the other seven empty. Battle flag word at launch 66,820 (0x10504), with two further arguments 316 and 20 that no checked note decodes; bit 9 (0x200) is clear, so **a defeat is a game over**; bit 8 (0x100) is set (no victory pose or fanfare, by the earlier decode [note: FFX-G10 3.6]). The Boss Theme (BGM 12) is loaded just before the launch. [bytes] [disasm: mtgz0800 @0x34EB to @0x3650]

**What the script does.** Disables **Escape (0x3003) and Flee (0x3018) for every character 0 to 6**; `btlSetMapCenter(1153, -30.05, -1136)`; writes the start type **Normal**; `btlSetRandPosFlag(0)`. Nothing else is disabled: **Switch, Summon, Defend and every other command stay**. Most of the file (about 1,300 lines of disassembly) is camera work chosen by which command is chosen and which actor is hit (summon cut-ins, spell casts, Overdrives). The camera workers have no gameplay effect. [bytes] [disasm: mtgz08_00 @0x0009 to @0x00B1, @0x1FC0]

**Start positions** (chunk 3; four areas, 0 to 3): party (1173.34, -30.05, -1097.457), (1178.747, -30.05, -1135.847), (1173.226, -30.05, -1180.447); seven aeon entries, all at (1206.41, -30.05, -1141.72); Keeper (1067, -30.05, -1130). **All four areas carry the same coordinates.** Three party entries, never more: the player's front line is any three of the seven, the rest are bench (Switch is legal). [bytes]

**How the game launches the fight:** from the field event `mtgz0800` at the exit of the Gagazet cave (the guides: "the battle begins as soon as you exit the cave" [guide: Jegged]); the event applies no party restriction. [bytes]

## 3. The engine facts the script leans on

- **Hooks.** One AI worker (slot 61) binds onTurn, preTurn, onTargeted, onHit, onDeath (empty: it only substitutes nothing) and postTurn; a second worker (slot 64) carries presentation only (an onTargeted motion). [bytes] [disasm: m128 @0x022a, @0x0702, @0x03dc, @0x03fb, @0x0701, @0x03cf]
- **onHit** is raised once per action per target, before the death check [note: re-ffx-ai-seymour.md]. This script does **not** call `isCounterattackAllowed`. [disasm]
- **Random draws.** `GetRandomValue()` is stream 2 masked to 16 bits: modulo 5 gives residue 0 on 13,108 of 65,536 and residues 1 to 4 on 13,107 each. `findMatchingChr` is a uniform pick among the living, targetable members of the group, one stream-4 draw with two or more candidates; its "highest" selector picks the highest HP and breaks a tie uniformly. [run]
- **Self-targeted spells under Reflect.** A spell the game's target builder sends to a Reflect-bearing target flips to a random member of the opposite side [note: ffx-evrae-airship.md; `ai/evrae-rules.ts` KEEP_REFLECTED_SELF_HASTE]; the Keeper's script is built on this. [note]
- **Cap rule:** 9,999, or 99,999 with Break Damage Limit, or forced to 99,999 by `Cmd+0x20` bit 0x80 [note: re-ffx-damage.md 6]; Mana Breath carries the bit, the others do not. [bytes]

## 4. The AI (m128, worker 1) [bytes] [disasm: m128 @0x0098, @0x022a, @0x03cf, @0x03dc, @0x03fb, @0x0702] [run]

### 4.1 Set-up (init f0)

Death animation "Boss", Tough; **thresholds saved from actor 20's maximum HP: v10 = 30,000 (three quarters), v11 = 20,000 (one half), v12 = 10,000 (one quarter)**; phase v0 = 0, cycle state v1 = 0, counter v9 = 0; the six added commands. [run]

### 4.2 The turn (onTurn), once per Keeper turn

1. **MAG is written to 180** (Curaga's power comes from it). The default support move is **Curaga on itself**.
2. Overrides, in this order, **each replacing the one before** (so the last that applies wins): **Regen** (if it has no Regen and the phase is above 2, i.e. HP below one quarter); **Esuna** (if Poison **or** Darkness is on it); **Protect** (if Armor Break is on it and Protect is not); **the Reflect branch** (if Reflect is on it and the phase is 2 or more, i.e. HP below one half): if any front-line character holds Reflect, the pending support move (whatever it now is) is aimed **at that character**, so the spell bounces off onto the Keeper; otherwise the pending move becomes **Reflect on the lowest-HP front-line member** (so the next support turn can bounce). [run: all nine cases]
3. The cycle state picks the move and, for states 0 to 3, **discards the override**:

| State (v1) | Move | Target | Next |
|---:|---|---|---:|
| 0 (the first turn and every sixth after) | **Photon Wings** 0x6042 | the whole front line | 1 |
| 1 | **Attack** 0x6000 | the front-line member with the **highest HP** (tie: random) | 2 |
| 2 | **Attack** 0x6000 | a random living front-line member | 3 |
| 3 | **Mana Breath** 0x6043, **MAG written to 40 first** | a random living front-line member | 4 |
| 4 | the support move of step 2 (default Curaga on itself) | as step 2 | 5 |
| 5 | the support move of step 2 | as step 2 | 0 |

Its post-turn handler writes MAG back to 40. So **Curaga is cast at MAG 180 (about 9,750 to 11,009, capped at 9,999, twice per cycle); the breath and the Attack are at MAG 40**. Over 14 turns the observed order is exactly Photon Wings, Attack (highest HP), Attack, Mana Breath, support, support, repeating. [run] No stream-2 draw is used for the order; the only draws are the target picks (stream 4).

### 4.3 When it is hit (onTargeted, onHit, preTurn)

- **onTargeted** stores the used command's id and whether its damage class includes **HP** (v7) and **CTB** (v8). Only the HP bit is used. [run: Attack = HP class 1, CTB 0]
- **onHit (in this order):**
  1. If the last attacker is the Keeper itself (its own Curaga, Regen and the rest), **stop**: nothing below happens, no count. [run]
  2. **If Slow is on it:** queue **Haste on a front-line member who holds Reflect, if there is one, otherwise on itself.** [run]
  3. **Phase moves:** if its HP is below the saved three-quarter line, set the area of all seven characters to 1 and the phase to 1 (once); then below the half line, area 2, phase 2 (once); then below the quarter line, area 3, phase 3 (the quarter line is not cleared, so the writes repeat harmlessly). One hit can run several blocks: a hit that takes it from 30,001 to 19,999 runs the first two. [run: HP 29,999, 19,999, 9,999 give phases 1, 2, 3; a run of hits 35,000 to 9,000 gives 0, 1, 1, 1, 2, 3]
  4. **If the used command changed HP (v7):** the counter v9 is incremented; **if v9 exceeds (a stream-2 draw modulo 5) plus 2 and it is not Asleep (it cannot be), it queues Tail Sweep on the whole front line and v9 returns to 0.** The draw is taken on every counted hit. [run]
- **preTurn** (before each Keeper turn) repeats the phase moves of step 3, so HP lost to Poison also moves the phase. [run: HP 19,000 gives phase 2 at preTurn]
- **onDeath** does nothing but keep the body. [disasm: m128 @0x0701]

**Exact distribution of the sweep (all 65,536 stream-2 results at each hit count):** the chance that the sweep fires on a counted hit, given it has not fired yet: hit 1 and 2, 0; hit 3, 13,108 / 65,536 (20.00 percent); hit 4, 26,215 (40.00); hit 5, 39,322 (60.00); hit 6, 52,429 (80.00); hit 7, 100. So the sweep comes **on the 3rd counted hit 20.00 percent of the time, the 4th 32.00, the 5th 28.80, the 6th 15.36, the 7th 3.84; the mean is 4.51 counted hits** (never before the 3rd, never after the 7th). With a stream-2 value of 0 every time it fires on every third hit. [run] The counter does not reset on a phase change.

### 4.4 Cadence

The Keeper acts every 24 CTB (tick speed 8): **a six-turn cycle is 144 CTB**, as long as 6 plain turns of Tidus (Hastega halves it). In a cycle it deals one Photon Wings, two Attacks, one Mana Breath, and heals 9,999 twice (or does something else on those two turns). [arith]

## 5. The move rows (c)

Rows of `monmagic2.bin` (0x6xxx) and `command.bin` (0x3xxx). Accuracy formula = bits 3 to 5 of `Cmd+0x1c` (0 always hits; 2: the command's accuracy byte minus the target's Evasion, plus the user's Luck, minus the target's Luck [note: re-ffx-rng-hit.md 4]). Rank 3 for all of these rows.

| Row | Id | Target | Damage | Formula / power | Hit | Statuses | Cap | Tag |
|---|---|---|---|---|---|---|---|---|
| Photon Wings | 0x6042 | all three | HP, **neither physical nor magical** (flag word 0: Protect and Shell do not apply) | f9 / 20 (V x 20 x 50 / 256) | always | **Confuse 25, Sleep 50, Silence 50, Darkness 50** (3 turns each) **+ Curse always** | 9,999 | [bytes] |
| Attack | 0x6000 | one | physical | f1 / 16 | formula 2, byte 90 | none | 9,999 | [bytes] |
| Mana Breath | 0x6043 | one | magical | f3 / 48 | always | none | **99,999** (bit 0x80) | [bytes] |
| Tail Sweep | 0x6044 | all three | physical | f1 / 12 | formula 2, byte 100 | **removes Haste** (chance 255, duration 254, read with the guides), **Delay Buster** (CTB damage = tick speed of the target x 3) | 9,999 | [bytes] [note: re-ffx-damage.md 6] |
| Curaga | 0x302D | self (or a Reflect holder) | healing | f7 / 80 (MAG 180) | always | none | 9,999 | [bytes] |
| Esuna | 0x3033 | self | none | f3 / 0 | always | removes Petrify, Poison, Confuse, Berserk, Sleep, Silence, Darkness, Slow | n/a | [bytes] |
| Protect | 0x303B | self | none | f3 / 0 | always | Protect (254) | n/a | [bytes] |
| Reflect | 0x303C | the lowest-HP party member | none | f3 / 0 | always | Reflect (254) | n/a | [bytes] |
| Regen | 0x303E | self | none | f3 / 0 | always | Regen (100, 10 turns) | n/a | [bytes] |
| Haste | 0x3036 | self or a Reflect holder | CTB class | f13 / 8 | always | Haste (254) | n/a | [bytes] |

## 6. Numbers (arithmetic only; no engine ran)

All figures: the wave-2 arithmetic script's output (kept outside the repo) (the two notes share one script). Party cells are the repo's Gagazet preset (`src/data/ffx/builds/gagazet.ts`, `[estimate]`): Tidus HP 2,420 DEF 20 MDEF 18 AGI 30; Yuna 1,500 / 13 / 39 / 15; Auron 3,410 / 28 / 14 / 15; Lulu 1,375 / 15 / 45 / 13; Wakka 2,530 / 20 / 16 / 17; Rikku 1,540 / 15 / 15 / 32. [arith]

| Move | Tidus | Yuna | Auron | Lulu | With Protect (physical) or Shell (magical) |
|---|---:|---:|---:|---:|---|
| Attack (f1 p16, STR 37) | 1,307 to 1,476 | 1,378 to 1,556 | 1,230 to 1,389 | 1,357 to 1,532 | 615 to 778 |
| Tail Sweep (f1 p12), each of three | 980 to 1,107 | 1,033 to 1,166 | 922 to 1,041 | 1,018 to 1,149 | 461 to 583 |
| **Mana Breath (f3 p48, MAG 40)** | **3,105 to 3,507** | **2,637 to 2,977** | **3,197 to 3,610** | **2,510 to 2,834** | 1,255 to 1,805 |
| Photon Wings (f9 p20) | 937 to 1,058 | the same | the same | the same | not reduced |

Hit chance of the two physical moves against Evasion 0 and Luck 17 to 18: Attack about 86 percent (byte 90 + Luck 15 - 18), Tail Sweep about 96 percent (byte 100). Magic and Photon Wings always hit. [arith]

**The numbers the line has to beat.** Tail Sweep delays Tidus by 24 CTB, Wakka 33, Rikku 24, Yuna 36, Auron 36, Lulu 39 (a Hasted rank-3 action costs 12 for Tidus, so a sweep costs him two turns of Haste). **Mana Breath one-shots every Gagazet-cell party member except an Auron at near full HP, and with Shell it takes about half**. Photon Wings is about 1,000 to each of three every sixth turn plus Curse (no Overdrive) and up to four status rolls; Curse is cured by Dispel or Holy Water, the rest by Remedy.

**The race.** A plain Attack of Tidus (STR 31) against DEF 100 does 382 to 431 (Auron 810 to 914, Wakka 315 to 356, Rikku 126 to 142); against DEF 0 (**Armor Break, which the Keeper answers with Protect on its next support turn**) Tidus does about 900 to 1,016 and Auron about 1,900 to 2,150. At 40,000 HP that is 93 to 105 plain Tidus hits against defence, or 19 to 22 Auron hits through an Armor Break. The Keeper heals **up to 19,998 per 144 CTB** (two Curagas) when nothing interferes. Bio (Poison 254 always lands) takes **2,000 per Keeper tick**; Esuna ends it at the next support turn (state 4 or 5), so a Bio cast before state 4 turns that support turn into an Esuna (no Curaga) and the other support turn is a Curaga again unless Poison is re-applied. A Reflect on the Keeper turns its default Curaga into a heal on a party member (below half HP it counters as in 4.2). [arith] [run] The fight is a strategy fight, not a damage race: plain attacks cannot win it (they would take over 100 hits against 20,000 healed per cycle) and the guides' line (Reflect, Poison, Hastega, Protect and Shell, Armor and Mental Break, Slow while Reflected) is the sourced answer.

## 7. Cross-check with the guides: agreement and the conflicts (the files win)

| Point | Files | Guides | Verdict |
|---|---|---|---|
| HP 40,000, DEF/MDEF 100 | 40,000; 100 / 100 | Jegged 40,000; Samurai Gamers 40,000 and 100 / 100 | agree |
| Always opens with Photon Wings, then two attacks, then Mana Breath | cycle of 4.2 | GG (exactly this) | agree |
| Photon Wings: about 1,000 damage; Sleep, Silence, Darkness, Confusion | 937 to 1,058; Confuse 25, Sleep/Silence/Darkness 50 | Jegged (about 1,000; the four statuses), GG, SG | agree |
| Photon Wings also inflicts Curse | Curse always (extra word 0x400) | GG, SG yes; **Jegged omits it** | files, GG, SG win |
| Curaga heals itself, Regen at low HP, Esuna on Poison/Darkness, Protect after Armor Break | all in the script (4.2) | GG, SG, Jegged | agree |
| "Esuna on Darkness" | the branch exists; only a 254-chance Darkness move lands (the byte is 100) | GG | agree; the lands/doesn't-land detail is the file's |
| Reflect on the Keeper bounces its Curaga to the party; it answers with Reflect on a party member | yes, from HP below one half | Jegged, GG, SG | agree (the half-HP gate is not in the guides) |
| Slow answered by Haste, which bounces under Reflect | yes (on itself, or on a Reflect holder) | GG, SG | agree |
| Tail Sweep after a few hits, delays, strips Haste | 3 to 7 counted hits; Delay Buster; Haste removal | GG, SG, Jegged | agree (the 3 to 7 and the mean are from the file) |
| Immune to Delay | CTB immunity bit | SG | agree |
| Not immune to Threaten | byte 100 | GG | agree |
| Bio poison keeps it busy | Poison lands; Esuna spends a support turn | Jegged, GG | agree |
| Gear and drops | as 1.3 | Jegged, SG | agree |

## 8. What is not proved

- **Not run in the engine or the emulator.** The AI ran in the Atel interpreter against a mock world; the game was not run.
- **The two further launch arguments (316 and 20) and the battle-flag bits 0, 2, 10 and 16** are not decoded by any checked note.
- **What the "area" index selects** (a stage, a camera set or a map layer) was not read; the start positions are the same in all four areas, so it is not a place.
- **The decision to cast Curaga with Reflect up** and the resulting bounce target are the engine's target-builder rules (the Evrae precedent), not read from this script.
- **Ghidra was not answering** during this lane; the stored decompile corpus supplied the one engine read (the status landing rule).
- **Th'uban (`m282`, row 54)** is a colour swap by the wiki and was not compared with this record or script.

## 9. The fight, for the chapter (facts only; no number proposed)

- **What it needs that the engine may not have:** a per-cast override of the caster's MAG (180 for Curaga, 40 otherwise); the HP-class action counter with a random fuse that ignores its own spells and no-HP actions; a Reflect-aware support-move selection; the area writes on three HP lines (presentation only).
- **What it can reuse:** every spell is a player row the engine has (Curaga, Esuna, Protect, Reflect, Regen, Haste); the Delay Buster and Haste removal of Tail Sweep; the Curse status; the self-spell-bounces-under-Reflect rule of the airship Evrae; the HP-hit counters of Dark Bahamut and the Spectral Keeper.
- **What is order-sensitive:** the cycle (never random), the first turn (Photon Wings), the override priority, the sweep fuse.
- **What is open:** the build point's Reflect and Bio (the Gagazet preset has them), the choice of three front-line characters.

## 10. Things that change PLAN.md

1. **R for row 39 is finished by this note:** the AI is 2,407 bytes of code and read in full; the residual R is a half-hour of live checks (section 8), not 6 hours.
2. The plan said "Tail-Sweep delay uses CTB-delay hooks that exist": confirmed (Delay Buster, `weak_delay`/`strong_delay` in the combat-core notes), but the **fuse** (3 to 7 HP-class actions) and the **Reflect branch** are new logic.
3. Arena: the Gagazet plate exists (Chapter I); the summit has none (as the plan says); all four areas share one place, so one plate serves the whole fight.

## 11. How this was checked, and what was not

Scripts and outputs in the lane's scratch folder (outside the repo) (kept outside the repo): `m128.txt` and `btl-mtgz08_00.txt` (disassemblies), `rows-39.out.txt` (rows), `t-keeper.mjs` and `t-keeper.out.txt` (the run), `status-moves.mjs` (the player moves against the status bytes), `web/` (the guide texts); the shared arithmetic scripts of the wave-2 lanes. Not done: any run of the game, any browser, any art or GPU work, any change to the repo.
