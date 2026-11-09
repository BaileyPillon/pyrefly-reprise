# FFX Wendigo and the Guado Guardians on frozen Lake Macalania: records, formation, AI and the story beat, read from the game's own files

**Game case: FFX only.** Wendigo (`m212`) and these Guado Guardians (`m213`) exist only in FFX, in formation `maca02_01` on Lake Macalania, the stretch of the story right after the Macalania Temple (Seymour, Anima, Shiva) and right before the party wakes on the lake bottom. FFX-2 has no counterpart; nothing here applies to it. Part of the `re-parity` track (new chapters), sequel of `re-ffx-spherimorph.md` (the Woods, one region earlier) and the wave-2 notes, whose method it reuses. Drafted 2026-11-06 for program row 49 (`PLAN.md`), hidden chapter 49, door word `wendigo`, for the Meshy tech-demo build. **Treeless: records, formation, AI, story beat. No engine, data, AI or art file was changed; nothing here ran in a browser; no GPU, no ComfyUI, no Meshy call.**

**Source tags** (as in the sister notes).

- **[bytes]** read from the game's own file by a script of this lane (Steam build 25501027, `FFX_Data.vbf`, unpacked read-only earlier and kept outside the repo, hard rule 8). **[disasm: file @offset]** read from the Atel disassembly; no script line is reproduced.
- **[run]** the real bytecode of `m212` and `m213` ran in the small Atel interpreter of the earlier AI lanes (`sim.mjs`, `sim2.mjs`, used unchanged, the same harness as the Spherimorph lane's `t-sphere.mjs`) against a mock battle with the real command-table rows, with exact tallies over all 65,536 results of the shared random stream where a draw is involved. **[arith]** the repo's own kernels (`kernel/ctb.ts`, `kernel/damage.ts`, `kernel/hit.ts` of the clean tree a clean tree of this repository, read only): variance 240 to 271, no criticals. **[engine]** the earlier lanes' RE notes at `origin/main` (`research/re-ffx-ctb-status.md`, `re-ffx-ai-seymour.md`, `ffx-combat-core.md`, `ffx-seymour-anima-macalania.md`).
- **[guide: GameFAQs]** the "Final Fantasy X Remaster Walkthrough (PC)" page "Lake Macalania" (gamefaqs.gamespot.com, faqs/79145), read 2026-11-06 **through headless Chromium** (plain fetch answers 403; the earlier lanes therefore never read GameFAQs). **[guide: Jegged]** Jegged.com "Lake Macalania"; **[guide: GG]** Gamer Guides "Wendigo"; **[guide: SG]** Samurai Gamers "Wendigo Boss Guide". Nothing copied; the texts are kept in `research/web/`. Tie-break: **GameFAQs wins a conflict nothing in-game settles**; a value no source gives is flagged `[estimate]`. Here the files settled almost every conflict (section 7).
- **[observed]** none: the 2026-09-26 Steam session did not reach this fight. **[inferred]** not read directly.

Files used (size in bytes): monster files `m212` (AI 3,133 bytes of code; file 5,200 + 812 + 248 + 284 + 62,928 + 352), `m213` (AI 1,972 bytes of code), `m141`, `m222`, `m122`, `m123` (context); formations `maca02_01` (script 2,841 bytes, 498 lines of disassembly), `maca02_00`; kernel tables `monster*.bin`, `monmagic1.bin`, `command.bin`; the field event `event/obj/ma/maca0200/maca0200.ebp` (62,208 bytes of code, read through the earlier lane's disassembly `ys-feasibility/evt/maca0200.txt`); the motion bank `chr/mon/m212/mot/resident1.mgrp`. The record in the monster file equals the kernel row byte for byte. Move and item names are the English names of the game's own tables; **every Wendigo attack row is named just "Attack"**, so the names "punch", "double punch", "raise arms" below are this lane's labels (the guides' words: SG "Punch", "Double Punch", "Raise Dukes"), the mapping of a row to a guide name is `[inferred]`.

## 0. The one-screen summary

- **One battle, three monsters, one formation.** `maca02_01`, battle id 332 << 16 | 1 = 21,757,953. Slots: Guado Guardian `m213` (actor 20), **Wendigo `m212` (actor 21)**, Guado Guardian `m213` (actor 22). Three party entries, **escape and Flee off for every character**, Normal start, no message, no scene of its own in the battle script. [bytes] [disasm]
- **Which Guardians are in it:** the two `m213` (1,200 HP, "the pursuit and Wendigo variant" of the 2026-09-19 Seymour note). **Not here:** `m141` (2,000 HP, the Temple's, formation `mcyt06_00` with Seymour and Anima) and `m222` (2,600 HP, Silence, Berserk, Fira, Reflect, Nul-Frost; formations `azit03_*` and `tori00_*`). The row order of `PLAN.md` ("m141/m213/m222") names three; **only m213 is in this formation.** [bytes]
- **Wendigo: 18,000 HP, STR 40, DEF 0, MDEF 0, AGI 18, no Armored, no element affinity at all.** The guides agree (GameFAQs, GG, SG's table); **SG's prose "weak to fire" is wrong** (its own table says none). Immune to Death, Zombie, Petrify, Poison, Confuse, Reflect, Slow, Eject, Auto-Life, Bribe; Doom lands (5 turns); **Berserk, Provoke, Threaten (100 percent) and all four Breaks land**; Sleep, Silence and Darkness land at 20 off. [bytes]
- **Its damage is the whole problem.** STR 40 gives a plain punch of **1,634 to 2,015** against the repo's Macalania cells (HP 850 to 1,900); the strong one is **2,450 to 3,023** and never misses; Berserk makes its default punch **2,451 to 3,022**. Protect halves, Power Break halves, both quarter. **A full-HP member dies to one unmanaged hit; only Auron survives a weak punch.** [arith] (6)
- **Its script has three behaviours, not a fixed loop.** Above half HP: 2 turns in 3 a punch on a random front-line member (accuracy 120), 1 turn in 3 the strong "double punch" on the **lowest-HP** front-line member (never misses). Below half HP (9,000): a **seven-turn cycle**, arms up for three turns (**every physical hit on it is answered by a counter punch on the attacker**, 2,041 to 2,519, never misses), arms down, then three attack turns (1 in 3 strong, 2 in 3 weak-accuracy punch), then the arms go up again. [disasm] [run] (4.2, 4.3)
- **The Guardians run the fight's rules.** On their turns: **Berserk on Wendigo** if it is not already Berserk; **Eye Drops on Wendigo** if it is blind; while the arms are up, **Berserk on a party member** (the file only, in no guide); while Wendigo is Berserk, 37.5 percent Thundara, 37.5 percent Blizzara and 25 percent **Auto-Potion on Wendigo** (a stolen-from Guardian casts Blizzara instead: 62.5 percent Blizzara, 37.5 percent Thundara). Hit, a Guardian drinks an Auto-Potion (+1,000) unless stolen from. **When one dies it casts Protect (actor 20) or Shell (actor 22) on Wendigo** (not by Petrify). [disasm] [run] (4.4)
- **A Berserk monster runs no script at all** (the game's turn start hands it the forced default attack, `re-ffx-ctb-status.md` 14.6): a Berserk Wendigo only ever throws punch B (`0x4000`, accuracy 90) at x3/2, **never raises its arms and never throws the strong or the counter punch**. This is why every guide says "remove Berserk". [engine] [run]
- **The ice breaks after the fight, not in it.** The battle script has no ice. The field event (`maca0200`) after the victory plays a magic effect (id 383), hides twelve map layers (8 to 19: the ice sheets), shakes the camera twice, fades to white, shows the post-battle menu and warps to room 54 (the lake bottom). The "big hit cracks the ice" of the Meshy card is **an addition, not the game** (rule 10: needs a yes). [disasm: maca0200 @0xed0e to @0xf005]
- **Rewards:** 3,000 gil, 2,000 AP (3,000 on overkill, threshold 1,432), Power Sphere (x2 rare; overkill x2 or x4), steal Hi-Potion or X-Potion, gear (Counterattack, Piercing, SOS Haste, HP +10 per the guides) at 50 percent; the Guardians 480 gil, 290 AP (580), an Ability Sphere each. [bytes]
- **Party at this point:** all seven (Tidus, Yuna, Auron, Kimahri, Wakka, Lulu, Rikku) and four aeons (Valefor, Ifrit, Ixion, Shiva); the repo's Macalania preset is the build point. (section 12)

## 1. The records (a)

Offsets are record offsets (chunk 2; layout `re-ffx-dark-aeons.md` 1). Heights from the size table the extraction lane's size table `ffx-monsters-size.tsv`, outside the repo.

### 1.1 Wendigo `m212`

| Field | Value | Tag |
|---|---|---|
| Monster word / model word | 0x10d4 / 0x10d4; CTB icon 21; Doom counter 5; death animation "Boss" (the body stays, untargetable) | [bytes] [disasm: m212 @0x00f7] |
| HP / MP / overkill threshold | 18,000 / 32 / 1,432 | [bytes] |
| STR / DEF / MAG / MDEF | 40 / 0 / 0 / 0 | [bytes] |
| AGI / LCK / EVA / ACC | 18 / 15 / 0 / 0 | [bytes] |
| Tick speed | 11 (33 CTB per rank-3 action; 16 Hasted; Slow is immune) | [arith] |
| Flag bytes | +0x28 = 0 (**not Armored**, not Life-immune, not Sensor-immune); +0x29 = 0x04 (immune to Bribe only; **not** immune to Delay) | [bytes] |
| Poison damage byte | 25 (but Poison is immune) | [bytes] |
| Element absorb / immune / resist / weak | none of them: **no affinity** | [bytes] |
| Extra-immunity word | 0x0300: Eject, Auto-Life | [bytes] |
| Command list | 0x4000 Attack, 0x4080 Attack; **the script adds nothing and calls four more by id (0x407F, 0x4062, 0x403B, 0x4063)** | [bytes] [disasm] |
| Forced action (a Provoke or Berserk turn) | 0x4000 Attack | [bytes] |
| Height | **drawn height 28.07 game units (raw mesh x engine scale 1 x script scale 1) = 1.55 x Tidus** (18.15), i.e. about 2.7 m if Tidus stands 1.75 m; 50.29 across in the T pose. (The stored design height E is 26.4, 1.45 x; the size table's ratio column is the drawn one, as `data/ffx/fiend-stature.ts` reads it. Corrected 2026-11-06 by the battle lane: the first draft called 26.4 the 1.55.) | [bytes: size table] |

**Status bytes** (255 immune; otherwise the move's chance minus the byte; Threaten's byte is a success percentage [note: ffx-seymour-anima-macalania.md 0.4]): Death 255, Zombie 255, Petrify 255, Poison 255, **Power, Magic, Armor, Mental Break 0**, Confuse 255, **Berserk 0, Provoke 0**, **Threaten 100**, **Sleep 20, Silence 20, Darkness 20**, Shell, Protect, Reflect (255), the four Nul spells, Regen, Haste 0, Slow 255. [bytes]

What that means for the player moves: all four Breaks land; Berserk, Provoke and Threaten land (Threaten ends Berserk, ends the arms-up stance's counter and stops it acting: `ffx-combat-core.md` 4.4); Sleep, Silence and Darkness need a 100-chance move to land at 80 percent (a 254-chance move lands on anything below 255); Haste, Protect and Shell can be put on it (by its Guardians); Dispel and Ixion's Aerospark strip them; Poison, Slow, Zombie, Petrify, Death, Confuse, Reflect never. [bytes] [arith]

### 1.2 Loot (chunk 4)

3,000 gil; 2,000 AP, 3,000 on overkill; normal drop Power Sphere x1 (rare x2); overkill x2 (rare x4); steal Hi-Potion (common) or X-Potion (rare), one each; bribe item Potion, but Bribe is immune; gear chance byte 128 (50 percent, GameFAQs agrees), arena price 4,500. The gear's ability rows hold codes 0x8003, 0x800b, 0x805b and 0x8073 (**not decoded**: the guides name Counterattack and Piercing for weapons, SOS Haste and HP +10 percent for armour). [bytes] [guide]

### 1.3 The Guado Guardian `m213` (the Wendigo variant)

| Field | Value | Tag |
|---|---|---|
| Monster word / model | 0x10d5; CTB icon 20; Doom 5; death animation "Humanoid" (no pyreflies, the body fades) | [bytes] |
| HP / MP | **1,200** / 330 (monsters pay no MP) | [bytes] |
| STR / DEF / MAG / MDEF | 1 / 0 / 14 / 0 | [bytes] |
| AGI / LCK / EVA / ACC | 20 / 15 / 0 / 0; tick speed 10 (30 CTB) | [bytes] [arith] |
| Status bytes | Death 25, Zombie 0, Petrify 25, Poison 25, **Magic Break 255, Confuse 255, Berserk 255, Sleep 255, Silence 255, Slow 255, Threaten 0 (immune)**; Power, Armor, Mental Break 0; Darkness 0 | [bytes] |
| Other | Auto-Life extra-immune; Bribe immune; poison damage byte 25 | [bytes] |
| Commands | Thundara 0x3047, Blizzara 0x3046, Berserk 0x400F, Auto-Potion 0x4010, Eye Drops 0x200C, Summon 0x408A (**Summon is not used in this formation**, only in the chase battles `maca03_2x`, `mcyt00_2x`) | [bytes] [disasm] |
| Rewards | 480 gil, 290 AP (580), Ability Sphere x1 (overkill x2), steal Hi-Potion or X-Potion, bribe Potion (immune), arena price 720 | [bytes] |
| Height | engine height 20.0 = **1.08 x Tidus** | [bytes: size table] |

**Differences from the other two Guardians** (so nothing is shipped from the wrong one): `m141` (Temple) has Auto-Potion, Hi-Potion, Remedy and Shremedy, Threaten 100, Doom 1; `m222` (Home) has Silence, Berserk, Fira, Reflect, Nul-Frost. The Berserk, Eye Drops and Summon script is `m213`'s alone. [bytes]

### 1.4 Context only: the Crawler fight beside it (`maca02_00`)

Crawler `m122` 16,000 HP, STR 25, DEF 100, MAG 30, MDEF 50, AGI 20, weak to Thunder, resists Fire, Ice, Water and Holy, immune to Life; moves Attack, Mana Beam, Gatling Gun, Bit, Countdown; steal Lunar Curtain, drop Elixir, 7,000 gil, 4,400 AP. Negator `m123` 1,000 HP, no commands (script-run), resists the same four, Life- and Scan-immune. Formation: three party and four aeon entries; party at (97.7, 0, -450.9), (112.2, 0, -425.8), (135.3, 0, -405.5), Crawler (185.9, 0, -489.1), Negator (155.5, 0, -443.1); Jegged says **Yuna is not in the party for it**. Not read further: the plan's second act (Negator's block-magic-and-aeons rule, the Mana Beam charge) is out of this chapter unless the driver adds it. [bytes] [guide: Jegged]

## 2. The formation (b)

`maca02_01`: block bytes: voice 0, foot-sound bank 6, **in-water 0**; monster words 0x10d5, 0x10d4, 0x10d5 in slots 0 to 2, the other five empty. Chunk sizes 5,184 / 1,404 / 28 / 1,200 / 184 / 1,232 / 112. [bytes]

**What the script does.** Disables **Escape (0x3003) and Flee (0x3018) for all seven character slots**; `btlSetMapCenter(118, 0, -430)`; the start type is **Normal** (3); `btlSetRandPosFlag(0)`; four actor lights (the lake's cold light: slot 0 colour (81, 103, 123), slot 1 (29, 53, 69), slot 2 (29, 29, 29), slot 3 (46, 69, 102), angles 298/48, 226/8, 148/346). Nothing else is disabled: **Switch, Summon, Defend and every other command stay**. **No voice line, no banner, no scene**: unlike the Woods and the Temple, this fight teaches nothing in words. The rest is camera work chosen by which actor acts (fixed positions and polar moves, three random shots per action kind, a view for each of the four party-slot dereferences 8 to 11). [bytes] [disasm: maca02_01 @0x0009 to @0x0ab4]

**Start positions** (chunk 3, FFX units; one area plus a placeholder second area whose numbers are not world positions): party (164.0, -0.05, -424.0), (156.9, -0.05, -458.4), (125.0, -0.05, -477.8); **three party entries, never more**; aeon entries at (188.3, 0, -466.8) and (168.1, 0, -467.5) (the table lists twelve aeon slots, all but the first at one spot); monsters: Guardian (actor 20) (89.3, 0, -357.4), **Wendigo (86.0, -0.05, -397.0)**, Guardian (actor 22) (39.5, 0, -418.4); map centre (118, 0, -430). Wendigo stands about 82.5 units (7.9 m at 0.0964 m a unit) from the party's front member, with a Guardian behind and one on its flank. [bytes]

**How the game launches the fight** (the field event, `maca0200`, story state 1570, worker 27): the pursuit music (`Pursuit`, id 43) is loaded and plays, player control is off, the camera and the party and Wendigo (actor 21) are staged through about twenty scripted requests (Wendigo's entrance motion, a sound effect 61001, 61003, a camera shake), then `SetBattleFlags(19713, 0, 0)` and `launchBattle(21757953, Fade)`. The battle flag word and what a defeat does are **not decoded** (a story fight; the chapter treats a defeat as the normal result screen, as the sister notes do). Which music the battle itself plays is **not read** (the field script loads Pursuit before it; the Crawler fight loads `Boss Theme`, id 12). [disasm: maca0200 @0xeb14 to @0xed25]

## 3. The engine facts the scripts lean on

- **Hooks** (tags of `sim.mjs`): `m212` and `m213` each have one AI worker (slot 61) binding **onTurn** (f2), **onHit** (f3) and, for `m213` only, **onDeath** (f6); preTurn, onTargeted and the others are empty returns. Wendigo's second worker (slot 4) carries the motions only. [bytes] [disasm]
- **`performCommand`** queues only if the owner can act: not petrified, asleep, Provoked, **Berserk**, Confused, Threatened. **A Berserk or Provoked monster's script does not run at all** (the turn start hands it the forced attack first). [engine: re-ffx-ai-seymour.md 1.2; re-ffx-ctb-status.md 14.6]
- **`isCounterattackAllowed()`**: ends Wendigo's onHit when false (Threaten, no counters); it is the hook Wendigo's counter answers through. [disasm]
- **Random draws.** `GetRandomValue() mod 3`: residue 0 is 21,846 of 65,536 (33.33 percent), residues 1 and 2 are 21,845; `mod 4` exactly uniform. `findMatchingChr` is a uniform pick among the living, targetable candidates (stream 4, ascending actor number; no draw for 0 or 1 candidate); with selector 2 (**lowest**) it keeps the candidates tied on the lowest value and draws only among those. [run: 65,536 draws]
- **Damage steps** [note: re-ffx-damage.md]: Protect halves a physical hit, Power Break on the attacker halves it, Shell halves a spell; **Berserk x3/2 applies only when the executed command is the user's own default attack** (0x4000 for Wendigo). A command with accuracy formula 0 never rolls. Darkness on the user divides the accuracy term of a formula-2 move by 10 (both punch rows carry the "darkness applies" flag).

## 4. The AI

### 4.1 Wendigo's set-up (init f0) [bytes] [disasm: m212 @0x0037 to @0x0118]

Death animation "Boss"; counters **v5 = 0 (arms-up flag), v6 = 0 (arms-up turn count), v7 = 10 (turns-since-arms counter)**. Motion constants only otherwise (setMotionValue calls, a few scaling properties).

### 4.2 Wendigo's turn (onTurn f2) [disasm: m212 @0x0124 to @0x0286] [run: all 65,536 draws]

1. **If the arms are up (v5 = 1):** v6 steps 0 to 1 (turn 1, nothing queued), 1 to 2 (turn 2, nothing queued), at 2 the arms go down: **Cancel Counter** (0x4063) on itself, v7 = 1, v5 = 0. (Three Wendigo turns pass with the arms up, the first is the one that raised them.)
2. **Else if HP is below half of max (9,000; 9,000 exactly does not count):**
   - v7 below 4: v7 + 1, then **1 in 3 (21,846 of 65,536): the strong punch (0x4080) on the lowest-HP front-line member**, otherwise **the weak punch (0x4000, accuracy 90) on a random living front-line member**.
   - v7 = 4 or more (including the initial 10): v6 = 0, v7 = 10, v5 = 1, **Raise arms (Counterattack, 0x403B)** on itself.
3. **Else (above half HP):** 1 in 3 the strong punch (0x4080) on the lowest-HP front-line member, 2 in 3 **the punch 0x407F (accuracy 120)** on a random living front-line member.

The seven-turn cycle below half HP, by the run (draw 1, mod 3 = 1): turn 1 raise arms, 2 and 3 nothing, 4 lower arms, 5 to 7 three punches, 8 raise arms again, and so on. **Below half HP Wendigo attacks on only 3 of every 7 turns.** A turn is 33 CTB. [run]

### 4.3 Wendigo when hit (onHit f3) [disasm: m212 @0x028a to @0x02ff] [run: the 35 commands of the table in t-wendigo.out.txt]

Only while the arms are up and counters are allowed:
- **Asleep:** the arms come down at once (v6 = 3, v5 = 0, animation variant cleared), no counter.
- **Otherwise, if the command that hit it is physical (damage type 1) and no aeon stands in the front line: counter punch (0x4062, f1 power 20, never misses, can crit) on the last attacker.**

What counts as physical, from the real kernel rows (the run): plain Attack, **Dark, Sleep and Silence Attack, Power, Armor, Magic and Mental Break, Delay Attack and Buster**, Ixion's **Aerospark and Valefor's Sonic Wings** (type 1, but an aeon is on the field, so no counter). **Not countered:** every spell (Fire, Fira, Thunder, Haste, Dispel, Scan: type 2), Steal, Threaten, Provoke, Lancet, Jump, Spiral Cut, Flee, Use, Mix, Cheer, Focus (type 0, special), Overdrives and aeon Overdrives (type 0), Wakka's reels. **A summoned aeon silences the counter entirely** (the hook tests the front line for an aeon; while an aeon holds the field the front line is the aeon alone). Arms down: no reply at all. [run]

### 4.4 The Guado Guardian (`m213`) [disasm: m213 @0x00e1 to @0x058d] [run]

The first branch of every handler tests `CurrentBattle() == 21757953`; the other battle ids (`maca03_2x`, `mcyt00_2x`, the Temple's) take the Summon-on-turn-one path and a plain spell mix, and are not this fight.

**onTurn, while Wendigo (actor 21) is alive**, first match wins:
1. Wendigo is blind (Darkness): **Eye Drops on Wendigo** (0x200C). *No Steal check in the script* (see 8).
2. **Wendigo has the arms-up status (property 61): Berserk (0x400F, chance 120) on a front-line member who is not already Berserk** (uniform among them). While the arms are up the Guardians therefore Berserk the party; a Berserk member's forced attack is physical and walks into the counter. **In no guide.**
3. Wendigo is Berserk: a draw mod 4: **0 (25 percent): Auto-Potion (+1,000) on Wendigo if this Guardian has not been stolen from, otherwise Blizzara on a random member; 1 to 3 (75 percent): a random front-line member takes Thundara or Blizzara, 50/50.** (Two successive draws of stream 2, so overall **37.5 percent Thundara, 37.5 percent Blizzara, 25 percent Auto-Potion on Wendigo**, or **62.5 percent Blizzara and 37.5 percent Thundara** once stolen from: exact over 131,072 draw pairs.)
4. Otherwise (Wendigo calm): **Berserk on Wendigo.** (It lands: Wendigo's Berserk byte is 0 and the move's chance is 120.)

**onTurn, Wendigo dead:** a random living front-line member takes Thundara or Blizzara, 50/50.

**onHit** (the Guardian was hit): nothing if counters are not allowed, if it is asleep (immune), **if it has been stolen from**, or if the hit was a Berserk cast; otherwise **if the hit took HP: Auto-Potion on itself (+1,000)**.

**onDeath** (when a Guardian dies, and Wendigo lives): **actor 20 casts Protect, actor 22 casts Shell, on Wendigo** (command rows 0x303B and 0x303A). A Petrified Guardian does not fire the hook (GameFAQs: "unless through Petrification"; the engine's death routine is the hook's source, `re-ffx-ai-seymour.md` 1.1: not run here for Petrify). [run]

### 4.5 What the pieces do together `[derived]`

- **At the start of the fight the Guardians act on AGI 20 (30 CTB) before Wendigo (33 CTB) and cast Berserk on it.** Wendigo's first own turn is then the forced punch B at x3/2. Every Wendigo script line below runs only after Berserk is stripped (Esuna, Provoke, Threaten, or the Guardians' own death).
- **Berserk on Wendigo removes its three better moves and its stance**; the Guardians put it back on at their next turn (they are Threaten-, Sleep-, Berserk- and Silence-immune; Petrify, Death 25, Power, Armor and Mental Break, Darkness and Zombie land).
- **Killing a Guardian is a trade:** its death gives Wendigo Protect or Shell (halving physical or magical damage to it and its Power Break loss), and each hit on it is answered by +1,000 HP until it is stolen from (a 1,200-HP Guardian needs one hit of 1,200 or a steal first).
- **Below 9,000 HP** the stance turns every physical action into a counter punch unless an aeon is out, and the living Guardians Berserk the party into it.

## 5. The move rows (c)

Rows of `monmagic1.bin` (0x4xxx) and `command.bin` (0x3xxx). Rank 3 for all of these.

| Row | Id | Target | Damage | Formula / power | Hit | Notes | Tag |
|---|---|---|---|---|---|---|---|
| Punch A ("Attack") | 0x407F | one | physical | f1 / 16 | formula 2, byte **120**, Darkness applies | can crit; used above half HP, 2 turns in 3, random member | [bytes] |
| Punch B ("Attack") | 0x4000 | one | physical | f1 / 16 | formula 2, byte **90**, Darkness applies | can crit; below half HP, 2 turns in 3; **the default attack: the only move of a Berserk Wendigo, x3/2** | [bytes] |
| Double punch ("Attack") | 0x4080 | one | physical | f1 / **24** | **formula 0: never misses** | no crit; 1 turn in 3, on the lowest-HP member; shatter 50 | [bytes] |
| Counter punch ("Attack") | 0x4062 | one | physical | f1 / **20** | **formula 0: never misses** | can crit; only as a reply | [bytes] |
| Raise arms ("Counterattack") | 0x403B | self | none | none | | sets the stance (property 61) | [bytes] |
| Lower arms ("Cancel Counter") | 0x4063 | self | none | none | | ends it | [bytes] |
| Thundara / Blizzara (player-side rows) | 0x3047 / 0x3046 | one | magical | f3 / 24 | formula 0 | MP 8 in the row (monsters pay none); reflectable; pierces armor | [bytes] |
| Berserk | 0x400F | one | none | status chance 120 | | | [bytes] |
| Auto-Potion | 0x4010 | one (self or Wendigo) | heal | f6 / 20 (1,000 HP) | | | [bytes] |
| Eye Drops (item) | 0x200C | one | none | cures Darkness | | an item row | [bytes] |
| Protect / Shell (the death buffs) | 0x303B / 0x303A | one | none | | | | [bytes] |

## 6. Numbers (arithmetic only; no engine ran)

Cells are the repo's Macalania preset (`src/data/ffx/builds/macalania.ts` and `macalania-bench.ts` at `origin/main`, an `[estimate]`: the Temple, a few chase battles before this fight). Tidus HP 1,265 DEF 13 MDEF 11 AGI 21 EVA 17 LCK 18; Yuna 1,182 / 9 / 31 / 12 / 33 / 17; Rikku 850 / 11 / 11 / 23 / 9 / 18; Wakka 1,375 / 14 / 9 / 11 / 8 / 19; Auron 1,900 / 21 / 9 / 10 / 8 / 17; Lulu 850 / 11 / 36 / 9 / 42 / 17; Kimahri 1,200 / 17 / 9 / 11 / 9 / 18. Script `calc-wendigo.mjs`, output `calc-wendigo.out.txt`. [arith]

**Wendigo against the party: base damage per hit, min to max over V** (Protect or Power Break halves, both quarter; the top is the share of max HP):

| | Punch A / B (f1 p16) | Double punch (p24, never misses) | Counter punch (p20, never misses) | Berserk punch B (x3/2) |
|---|---:|---:|---:|---:|
| Tidus (1,265) | 1,736 to 1,960 (155 percent) | 2,604 to 2,940 | 2,170 to 2,450 | 2,604 to 2,940 |
| Yuna (1,182) | 1,785 to 2,015 | 2,677 to 3,023 | 2,231 to 2,519 | 2,677 to 3,022 |
| Rikku (850) | 1,759 to 1,986 | 2,639 to 2,979 | 2,199 to 2,483 | 2,638 to 2,979 |
| Wakka (1,375) | 1,723 to 1,945 | 2,584 to 2,918 | 2,153 to 2,431 | 2,584 to 2,917 |
| Auron (1,900) | 1,634 to 1,845 (97 percent) | 2,450 to 2,767 | 2,041 to 2,305 | 2,451 to 2,767 |
| Lulu (850) | 1,759 to 1,986 | 2,639 to 2,979 | 2,199 to 2,483 | 2,638 to 2,979 |
| Kimahri (1,200) | 1,683 to 1,901 | 2,525 to 2,851 | 2,104 to 2,376 | 2,524 to 2,851 |

With **Protect and Power Break together** the weak punch is 408 to 503 and the double punch 612 to 755 (Rikku and Lulu at 850 HP survive one, not two). **Only Auron (1,900 HP) survives a weak punch (1,634 to 1,845); every other cell dies to every punch, and Auron dies to the double punch and the counter punch.** This agrees with the guides: GG "can one-shot", SG "can one-shot most characters", GameFAQs "one-hit kill power under Berserk" and the order to use Power Break first. [arith] [guide]

**Hit chance of the two rolled punches** (Wendigo ACC 0, LCK 15; percent = LCK + (byte - target EVA) - target LCK; a hit needs a roll under it out of 101):

| | 0x407F (120) | 0x4000 (90) | 0x407F, blind | 0x4000, blind |
|---|---:|---:|---:|---:|
| Tidus | 99.0 | 69.3 | 6.9 | 4.0 |
| Yuna | 84.2 | 54.5 | 5.9 | 3.0 |
| Rikku, Kimahri | 100.0 | 77.2 | 7.9 | 5.0 |
| Wakka, Auron | 100.0 | 77.2, 79.2 | 6.9, 8.9 | 4.0, 5.9 |
| Lulu | 75.2 | 45.5 | 5.0 | 2.0 |

**Darkness makes both rolled punches miss about 91 to 98 percent of the time; the double punch and the counter punch ignore it**, and the Guardians cure it with Eye Drops (stolen-from Guardians in GameFAQs' account). [arith] [guide]

**Guardian spells** (Blizzara and Thundara, f3 p24, MAG 14): 290 to 328 on Tidus and Rikku, 250 to 282 Yuna, 295 to 333 Wakka, Auron, Kimahri, 240 to 272 Lulu; half with Shell; the top is 18 to 39 percent of max HP. They are never the danger. Auto-Potion heals 1,000. [arith]

**The party against Wendigo** (DEF 0, MDEF 0, no Armored, no weakness, no Protect or Shell on it): plain Attack **Auron 900 to 1,016**, Wakka 339 to 383, Tidus and Kimahri 299 to 337, Rikku 126 to 142, Yuna 48 to 55; Lulu **Fire 573 to 647, Fira 1,215 to 1,371**, Yuna Fira 922 to 1,041 (Firaga 2,303 to 2,600 is beyond this grid point); aeon Attack Valefor 604 to 682, Ifrit 742 to 838, **Ixion 900 to 1,016**, Shiva 485 to 548. **18,000 HP is 18 Auron swings, 15 Fira casts from Lulu, 54 from Tidus.** With Protect on it every figure halves. [arith]

**Clock.** Wendigo and Guardians: Wendigo 33 CTB per action (16 Hasted), each Guardian 30; Tidus 30, Rikku 27, Yuna 39, Wakka, Auron and Kimahri 42, Lulu 45. The Guardians act before Wendigo and before every party member but Tidus and Rikku, at the start. [arith]

## 7. Cross-check with the guides: agreement and the conflicts (the files win; GameFAQs wins what the files do not settle)

| Point | Files | Guides | Verdict |
|---|---|---|---|
| HP 18,000, overkill 1,432, AP 2,000, gil 3,000, steal Hi-Potion or X-Potion, Power Sphere x1 or x2 | yes | all four | agree |
| Four physical rows: two used 67 percent of turns (the one above half HP "a bit more accurate"), the strongest 50 percent harder at 33 percent regardless of HP, the counter 25 percent stronger than the weak ones | 120 vs 90 accuracy; power 24 vs 16 (+50 percent); 33.33 percent at any HP; counter power 20 vs 16 (+25 percent) | GameFAQs | agree, to the number |
| Arms up below half HP, three turns up, four down, counter on any physical attack | v5/v6/v7 cycle; 3 up, then cancel and 3 attacks, then again | GameFAQs, GG, SG ("below 9,000") | agree; the file adds that an aeon on the field silences the counter and that the strong punch targets the lowest-HP member |
| The Guardians cast Berserk on Wendigo, Eye Drops on its Darkness | yes (and Berserk on the party during the stance: the file only) | GameFAQs, GG, Jegged | agree on the first two |
| **Guardians "cast Haste and Berserk" on Wendigo** | **no Haste anywhere in the scripts or the rows** | Jegged says Haste | **file and GameFAQs win: Berserk only** |
| **Wendigo "weak to fire"** | no affinity at all | SG's prose says weak to fire; SG's own table, GG and GameFAQs say none | **file, GameFAQs, GG win: none** |
| One Guardian casts Protect and the other Shell when defeated, "unless through Petrification" | actor 20 Protect, actor 22 Shell; hook not fired by Petrify | GameFAQs, Jegged, GG | agree |
| **"Any damage Wendigo takes will be countered with a Hi-Potion"** | **the Auto-Potion reaction is the Guardian's own (it heals itself when hit); Wendigo's own hook has no heal; the only Auto-Potion on Wendigo is a 25 percent turn branch while it is Berserk** | GameFAQs; GG ("they can heal it with Auto-Potion") | **the file refines the guide; the "countered" wording is loose** |
| **Steal also stops Eye Drops** | the Eye Drops branch has no steal test (the steal test is on the Auto-Potion branches) | GameFAQs | **GameFAQs wins**: the engine's rule for a monster's item after a steal was not read (open, section 8) |
| Auron's Threaten, Esuna, Provoke remove Berserk; Dispel and Aerospark remove Protect and Shell | engine notes agree; **the Guardians are Threaten-immune** (byte 0), so "Threaten the Guardians" (valid at the Temple, byte 100) does not work here | Jegged, GG, GameFAQs | agree for Wendigo |
| STR 40; "Magic 1, DEF/MDEF 1/1, ACC 30, Evasion 1" | STR 40; MAG, DEF, MDEF, EVA, ACC all 0 | SG | file wins (SG adds 1; its ACC 30 is not the file's 0) |
| Drops: Counterattack and Piercing weapons, SOS Haste and HP +10 percent armour | rows not decoded | GameFAQs, SG | agree; not independently confirmed |
| Guardian Auto-Potion heals "1,000" | f6 power 20 (20 x 50) | Jegged | agree |
| A Berserk Wendigo is far more dangerous | forced punch B at x3/2: 2,451 to 3,022 | all | agree; the file shows why it also never uses its other moves |

## 8. What is not proved

- **Not run in the engine or the emulator.** The AI ran in the Atel interpreter against a mock world (`t-wendigo.mjs`); the game was not run. **Property 61 ("CounterAttack") is assumed to be the stance flag set by command 0x403B**: the run sets it by hand; the real status write was not read.
- **Which Wendigo row has which guide name** (Punch, Double Punch, Raise Dukes in SG): the rows are all "Attack"; the mapping is the lane's. The motion each row plays is **not mapped** (the script starts motions 2 to 5 for the attack, 184, 185, 186 for the stance, 160 to 162 for sleep; the program-to-clip map of the motion bank was not built).
- **Whether the engine blocks a stolen-from monster's item command (Eye Drops).** GameFAQs says it does; the script has no test; the engine rule is unread.
- **The flags word and what a defeat does; which theme plays in the battle; the field event's pre-battle staging in detail** (twenty scripted requests, not decoded).
- **Whether the in-game party has Shiva's gauge, or the HP, the bag and the abilities of the preset, at this exact point** (a few chase battles after the Temple): the preset is the Temple's and is an `[estimate]`.
- **The ability codes of the gear rows** (0x8003, 0x800b, 0x805b, 0x8073).
- **Wendigo's model scale in play** is the size table's drawn height (28.07, the design height E being 26.4); the scale the HD build draws it at was not re-measured.
- **Ghidra was not asked**; the stored decompile corpus and the earlier lanes' notes supplied every engine read.

## 9. The fight, for the chapter (facts only; no number proposed)

- **What it needs that the engine may not have:** the arms-up stance and its counter (a status the Guardians can read), the Guardians' scripts (Berserk on Wendigo or on the party, Eye Drops, the Auto-Potion branches, the Protect or Shell on death, an `onDeath` hook for an ordinary monster: the engine polls one for Macalania's Anima, `ScriptHooks` has none), the lowest-HP target selector, the 25 percent Auto-Potion on Wendigo, a monster-side Berserk and Auto-Potion command rows.
- **What it can reuse:** the Temple Guardians' module (`ai/macalania-guardian.ts`: Auto-Potion, steal count, the `pickMatching` helpers), the forced Berserk turn (`forced-turn.ts` already skips a Berserk or Provoked monster's script), `queueReaction`, Threaten, the aeon front-line test, the status set and the Break statuses, the Macalania preset with its four aeons and bag.
- **What is order-sensitive:** a Guardian's death hook runs at the end of the death routine, **after** onHit; a Berserk Wendigo never reaches onTurn or onHit's counter (no stance); the arms-up counter needs the physical **command type** of the hit (the real kernel rows give it), not the weapon element.
- **What is open:** the first-turn order from the CTB start, the front line of three, the Meshy Wendigo's size against the game's 1.55 x Tidus (the card's frame draws it far larger), which music.

## 10. Things that change PLAN.md

1. **R for row 49 is finished by this note for Wendigo and the Guardians:** the AI is 3,133 plus 1,972 bytes of code and read in full; the Crawler's 149 KB script is not read (out of scope as briefed).
2. **The plan's "Guado Guardian m141/m213/m222" is `m213` alone** for this formation (two copies).
3. **The plan bundles the Crawler and Negator fight; as briefed, this chapter is the Wendigo fight (`maca02_01`).** The Crawler fight (`maca02_00`, Yuna absent, 16,000 HP) is a second act that can follow; its research is not done.
4. **"Wendigo: wiki; AI unread" is now read.** The fight is a status-management fight: the numbers say an unmanaged party loses, a managed one (Power Break, Protect, Darkness, Berserk removal, Steal, then kill the Guardians in an order) wins.
5. The Meshy card's **"a big hit can crack the ice under it" is not the game**: the ice breaks in the field event after the victory (section 2).
6. **The 1.55 x Tidus height** is a measured fact the card's staged frame does not follow.

## 11. How this was checked, and what was not

Scripts and outputs kept outside the repo in this lane's own folder (a scratch folder outside the repo): `rec.mjs` (record and loot decode), `dump.mjs` (disassembly of the monster and formation scripts, and the position tables), `m212.txt`, `m213.txt`, `btl-maca02_01.txt`, `pos-maca.out.txt`, `rec-212-213.out.txt`, `rec-122-123-141-222.out.txt`, `t-wendigo.mjs` and `t-wendigo.out.txt` (the run), `calc-wendigo.mjs` and `calc-wendigo.out.txt` (the arithmetic), `size-ffx-monsters.tsv`, `glb-bones.mjs`, `pw-get.mjs` (a headless-Chromium page reader), `web/` (the guide texts: `gamefaqs-lake-macalania.txt`, `jegged-lake-macalania.txt`, `gg-wendigo.txt`, `sg-wendigo.txt`, `gg-crawler.txt`, `sg-crawler.txt`), `ref-*` (copies of the repo handoffs read). The script outputs call the strong punch 0x4080 "Haymaker" and the others "Punch" or "CounterPunch"; the note calls them the double punch, the punches and the counter punch (labels of this lane, not the game's). Not done: any run of the game, any browser beyond reading the guide pages, any art or GPU work, any change to the repo.

## 12. The party at this point, and where the motions are

- **Story:** the party has left the Temple (Seymour dead and "unsent", Yuna with Shiva, the Guado Guardians chasing). All seven guardians are available (`research/ffx-seymour-anima-macalania.md` 8.1: "verified, 2 sources"); the formation takes three; Yuna is in the party here (she was not for the Crawler). Aeons: Valefor, Ifrit, Ixion, **Shiva** (the Temple's four; Bahamut and Anima are not owned). [guide: Jegged, GameFAQs] [note]
- **The build point is the repo's Macalania preset** (the stats above, the four aeons Valefor 1,146 HP, Ifrit 1,515, Ixion 1,513, Shiva 1,342 with her gauge at 0 as the Temple's rule says, the bag: 30 Potions, 10 Hi-Potions, 2 X-Potions, 17 Phoenix Downs, 3 Remedies, 3 Ethers, 1 Elixir, 10 each of Antidote, Eye Drops, Echo Screen, Soft, Grenade, 4 Petrify Grenades, 2 Silence Grenades, 2 Poison Fangs; 12,000 gil), the **default front line Tidus, Yuna, Rikku** with Wakka, Auron, Lulu, Kimahri on the bench. `[estimate]`, flagged; nothing is raised toward a result.
- **The sourced answers and who owns them in the preset:** Steal on each Guardian (Rikku); Power, Armor and Magic Break and Threaten (Auron); Dark Attack and Silence Attack (Wakka; the preset has no Sleep Attack, which GG recommends); Esuna, Protect, Shell, Life (Yuna); Esuna for Berserk; **Provoke (Tidus) and Threaten (Auron)**, which also end a Berserk (Threaten on Wendigo only: the Guardians are Threaten-immune); Dispel is not in the preset (Yuna lacks it, as at the Temple), **Ixion's Aerospark** strips Protect and Shell; Kimahri's Stone Breath (an Overdrive) petrifies the Guardians so they cast no buff; Petrify Grenades x4 in the bag do the same; Wakka's T.K.O. (O'aka at Mushroom Rock) is in GameFAQs and not in the preset.
- **Real motion banks (for the chapter's real-animation requirement):** FFX party models are `c001` to `c007` (Tidus 136 bones, Yuna 142, Auron 153, Kimahri 156, Wakka 134, Lulu 181, Rikku 162), motion banks `chr/pc/cNNN/mot/resident0..3.mgrp` (Tidus 77 clips in `resident1`, Yuna 109, Auron 64, Kimahri 63, Wakka 64, Lulu 52, Rikku 52); **Tidus, Wakka and Rikku are already converted** to glTF clips with a clip map (the extraction lane's converted-assets folder, outside the repo, Tidus 132 clips, 13.1 MB; local only); the other four are not. Wendigo's own bank is `chr/mon/m212/mot/resident1.mgrp`: **one record, 26 clips, 724 frames at 30 fps, 184 bone targets** (the clips are 0.03 to 2.3 s; clip 3 is 69 frames; clips 4 and 24 are 1-frame poses). The Guardian's bank `chr/mon/m213` was not read. The joints of the converted skeletons are anonymous (`SkeletonNode_<n>`, 53 deforming joints in Tidus's skin of 136 bones), so **a retarget cannot go by bone name**.
