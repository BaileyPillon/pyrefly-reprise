# FFX Monster Arena creations: records, formations, the arena's rules and the AI of nine creatures, read from the game's own files

**Game case: FFX only.** The Monster Arena (east of the Calm Lands, after the airship) and its "creations" exist only in FFX (and the HD/Steam build the files come from). FFX-2 has the Fiend Arena, a different system (rows 53 and 59); nothing here applies to it. Written 2026-11-09 by a Sonnet sub-agent of the release driver (treeless research lane, program row 54 of `PLAN.md`). **Treeless: no repo file, engine, data, AI or art file was changed; nothing ran in a browser; no GPU.** Authority (relayed words, verbatim): Bailey 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 "implement all unimplemented chapters please", "yes on all these too", "you can spend as much meshy credits as you see fit. use your own judgment."; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is a recommendation, "driver's call, his to overturn".

Companion: `docs/plans/ch-gauntlet-review.md` (the paper preflight). The research lane's scratch (the record dump `rec-arena.out.txt`, the AI runs `t-arena.out.txt`, the arithmetic `calc-54.out.txt` and the disassemblies) stays outside the repository; no script text goes into it. `tools/gauntlet-rows-gen.mjs` turns the record dump into `tests/fixtures/parity/ffx/gauntlet_rows.json`.

**Tags.** **[bytes]** read from the game's own files (Steam build 25501027, unpacked read-only earlier, kept outside the repo, hard rule 8). **[disasm]** read from the Atel disassembly; no script line is reproduced. **[run]** the real bytecode ran in the small Atel interpreter of the earlier AI lanes (`sim2.mjs`, unchanged, with the command-class reads of `t-keeper.mjs`) against a mock battle with the real command rows; exact tallies over all 65,536 results of the shared random stream where a draw is involved. **[arith]** the repo's own kernels (`kernel/ctb.ts`, `kernel/damage.ts`, clean tree, read only): variance 240 to 271, no criticals. **[guide: Jegged / GG]** a community guide, cited by name only (Jegged.com "Monster Arena", "Rewards", "Original > Ultima Buster / Earth Eater"; Gamer Guides "Monster Arena" and "Unlocking the Monster Arena"), read 2026-11-09, nothing copied. **GameFAQs answered HTTP 403 to every automated fetch (tested again today); the Final Fantasy wiki answers 402; StrategyWiki was not tried.** Where a guide and the files disagree the files win (section 7); nothing needed a GameFAQs tie-break. **[estimate]** ours.

## 0. The one-screen summary

- **Nine creatures are worth a chapter, not eight.** The plan lists Ultima Buster, Neslug, Catastrophe, Earth Eater, Jormungand, Don Tonberry, Cactuar King and Th'uban. **It leaves out Greater Sphere (`m281`, 1,500,000 HP)**, the sixth "Original" creation; Nemesis (row 43) and Shinryu (row 48) already have their own chapters. All nine are in HP order below; the sum of their HP is **18.34 million** (240,000 of it in the Ultima Buster's head and arms), the same class as the Dark Aeons chain (16.5 million). [bytes]
- **The formations are one template.** Every arena formation (`zzzz02_55` to `zzzz03_xx`) is **about 19,000 bytes of camera work and nothing else**: it sets **no command bans** (no Escape or Flee flag, no start type) and no music; the arena field launches the battle. Three formations have extra monster slots in their position table: the Ultima Buster's (four: body, Head, two Arms, see 3.1), the Cactuar King's (three) and Don Tonberry's (six: the waypoints of his Waddle). [disasm] [bytes]
- **The scripts are short** (1.3 to 3.9 KB of code each; the plan's "19 KB" is the formation, not the AI). **All nine AIs are read in full** and run (section 3). Seven of the nine are a fixed cycle or a coin flip; the two with real state machines are **Neslug** (shell) and **Earth Eater** (knock-down); the Ultima Buster adds **parts**.
- **What kills the party:** a counter on every hit (Earth Eater's Megaton Punch, Th'uban's Condemn, Cactuar King's 10,000 Needles, Don Tonberry's Karma while it walks in), one-hit lethal moves (Th'uban's Convergence, the Needles, Hydraulic Press at 15/16 of max HP), and sheer length (5,000,000 HP at a 99,999 cap is at least 51 hits). Against the repo's endgame preset (HP 9,999; DEF, MDF, STR, MAG 255) the ordinary moves are small: Ultima 1,262 to 2,850 on each of three, Attack 2,000 to 4,500. [arith]
- **The arena's own rules** (Jegged and Gamer Guides agree): capture Calm Lands fiends to open it; **Area Conquest** (one of each monster of an area) and **Species Conquest** (a count of a species) unlock 13 + 14 smaller creations; **Original** creations unlock by counts: Earth Eater 2 area creations, Greater Sphere 2 species creations, Catastrophe 6 area, Th'uban 6 species, Neslug every area creation, Ultima Buster 5 of every monster, Shinryu 2 each of the three Gagazet water fiends, Nemesis 10 of every monster and all the others beaten. **The fights cost gil: the price is in the file** (`ArenaPrice`, +0x114: 6,000 or 8,000 for the area and species ones, 15,000 for the Originals, 25,000 for Nemesis; the guide's Anacondaur at 1,125 matches the file exactly). The prizes (x99 items) are not in the monster files. (Section 5)
- **Th'uban shares the Sanctuary Keeper's model, not its script:** both are model word 0x1080 with the same 169,024-byte model chunk; the **moves and the AI differ completely** (the Keeper: Photon Wings, Mana Breath, Tail Sweep and a heal cycle; Th'uban: Rainbow, Convergence, Condemn and a buff cycle). So one painting serves two chapters, as the plan says, and nothing else is shared. [bytes] [run]

## 1. The records [bytes]

HP, MP, overkill threshold, STR / DEF / MAG / MDEF / AGI, then flags. All nine: **no elemental affinity of any kind** (except the Cactuar King); **AP 50,000 (Originals) or 8,000 (the area three), gil 0**; certain drop; steal and arena price as shown. Immune to Scan (extra word) and to Sensor (all nine; Neslug is also immune to Doom); Threaten byte 0 on all (the byte is the Threaten chance, so 0 = it never lands; see section 6, errata); Poison, Zombie, Death, Petrify, Confuse, Berserk, Provoke, Sleep, Darkness 255 on all nine; **Slow lands on Jormungand only** (byte 0), 255 elsewhere; the four Breaks 255 everywhere except **Jormungand 90**; **Silence lands on Neslug only**. Shell, Protect, Reflect, the Nuls, Regen, Haste land (0) on all except **Th'uban's Reflect (255)**.

| Id | Creature | HP | MP | STR | DEF | MAG | MDEF | AGI | Other flags | Drop (common / rare) | Steal (common / rare) | Arena price |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---:|
| m314 | Cactuar King | 100,000 | 0 | 255 | 100 | 255 | 255 | 80 | EVA 240, ACC 180; **immune to Fire, Ice, Thunder, Water, Holy** | Blessed Gem x3 / Dark Matter | Chocobo Wing x2 / Designer Wallet | 6,000 |
| m317 | Don Tonberry | 480,000 | 120 | 95 | 100 | 75 | 100 | 37 | ACC 80 | Farplane Wind x3 / Dark Matter | Candle of Life x2 / Designer Wallet | 8,000 |
| m311 | Jormungand | 520,000 | 63 | 77 | 33 | 80 | 186 | 53 | EVA 6, ACC 130; Breaks 90, **Slow lands** | Supreme Gem x2 / Dark Matter | Petrify Grenade x4 / Three Stars | 6,000 |
| m279 | Earth Eater | 1,300,000 | 30 | 117 | 200 | 186 | 210 | 47 | **Armored; starts with Reflect** | Fortune Sphere / Dark Matter | Gambler's Spirit / Lv. 1 Key Sphere | 15,000 |
| m281 | Greater Sphere | 1,500,000 | 999 | 87 | 130 | 102 | 120 | 55 | ACC 200; floats | Luck Sphere / Dark Matter | Gambler's Spirit / Return Sphere | 15,000 |
| m277 | Catastrophe | 2,200,000 | 380 | 120 | 80 | 77 | 80 | 34 | **Armored (first form)**; ACC 150 | Designer Wallet / Dark Matter | Gambler's Spirit / Lv. 2 Key Sphere | 15,000 |
| m282 | Th'uban | 3,000,000 | 85 | 102 | 80 | 212 | 80 | 53 | ACC 180; **Reflect 255** | Underdog's Secret / Dark Matter | Gambler's Spirit / Teleport Sphere | 15,000 |
| m105 | Neslug | 4,000,000 | 999 | 130 | 80 | 130 | 80 | 43 | **Silence lands**; overkill 12,000 | Pendulum / Dark Matter | Gambler's Spirit / Friend Sphere | 15,000 |
| m280 | Ultima Buster | 5,000,000 | 140 | 168 | 60 | 178 | 71 | 72 | ACC 130; with Head m272 and two Arms m273 | Winning Formula / Dark Matter | Gambler's Spirit / Lv. 3 Key Sphere | 15,000 |

Drops are x1 (x2 on overkill) unless a quantity is shown; the rare slot is one Dark Matter (x2 on overkill) on every row. Overkill threshold 99,999 on the Originals except Neslug (12,000), 10,000 on the area three. The Ultima Buster's **Head (`m272`)** and **Arms (`m273` x2)**: 80,000 HP each, **Armored, immune to fractional damage and Sensor**, poison 25, STR 1, AGI 80, no drops, "Boss" death (the body stays). **The Arms get no turns and are not on the CTB bar; the Head has turns.** [bytes]

**Guide cross-check (Jegged, Ultima Buster and Earth Eater pages):** HP 5,000,000 / 1,300,000, overkill 99,999, AP 50,000, steal and drop lines **all match the file**. The guide's "Rewards" table (x99 items) is a separate thing: the **prize** the arena pays for a first win, not the drop. [guide] [bytes]

## 2. The moves [bytes] (rows read with `rec.mjs`; statuses as chance bytes, 254 = lands on anything not immune, 255 = certain)

| Creature | Move (id) | Formula, power, hits | Class | What it adds |
|---|---|---|---|---|
| all but Cactuar, Greater Sphere | **Attack** (0x40F0 etc.) | f1 p16 | physical | can crit |
| Ultima Buster | **Ultima** 0x40F3 | f3 p70, pierces armor | magic | the whole front line |
| | **Contamination** 0x40FE | f3 p75 | special (type 0) | Zombie 255, Poison 255, the four Breaks, Confuse, Slow 254 |
| Neslug | **Megaton** 0x60BE | f1 p32 | physical | Confuse 254 |
| | **Slime** 0x60BF | f3 p60 | special | Poison, Silence, Slow 254; Armor Break and Mental Break 255 |
| Catastrophe | **Toxic Cloud** 0x40F7 | f3 p43 | magic | Poison, Confuse 254 |
| | **Toxic Spray** 0x40F8 | f3 p52 | physical class | the four Breaks 254 |
| | **Hundred Thorns** 0x40F9 | f1 p16 | physical | can crit |
| | **Demi** 0x304E | f5 p4 | magic | **25 percent of current HP** of each target; costs 32 MP |
| Earth Eater | **Megaton Punch** 0x40F5 | f1 p32 | special | **Death 100** |
| | **Flare** 0x3052 | f3 p60 | magic | reflectable; cast **at itself**, so Reflect bounces it onto the party |
| Greater Sphere | **Hydraulic Press** 0x40FD | f8 p15 | physical | **15/16 of the target's maximum HP** |
| | Firaga/Blizzaga/Thundaga/Waterga 0x3049-4C, Flare, Ultima | f3 p42 / p60 / p70 | magic | the element machine's counters |
| Th'uban | **Rainbow** 0x40FA | f1 p14 | special | Confuse 25, Sleep 50, Silence 50, Darkness 50 on the front line |
| | **Convergence** 0x40FB | **f4 p63** | magic, **MDEF ignored** | one target |
| | **Condemn** 0x40FC | f1 p12 | physical | **strips Shell, Protect, Reflect, the Nuls, Regen, Haste** |
| | Haste, Protect, Shell, Regen, Curaga | player-side rows | | cast on itself |
| Jormungand | **Cold Stare** 0x40BB | f3 p20 | special | **Petrify 254** |
| | **Space-Time Vorpal** 0x40E2 | f3 p40 | magic | the whole front line |
| Cactuar King | **10000 Needles** 0x40BC | f6 p200 = **10,000 flat** | special | |
| | **99999 Needles** 0x40F2 | **f23 p51 = 509,949, capped to 99,999** | special | lethal to any member |
| | Run Away 0x4033 | | | leaves the battle |
| Don Tonberry | **Attack** 0x4062 | f1 p20 | physical | |
| | **Voodoo** 0x40EA | f3 p255 | special | used when an aeon stands in the front line |
| | **Karma** 0x40FF | **f22 p100 = kill count x 100** | special | the target's kill counter |
| | Waddle 0x4081 | | | a move to the next waypoint |

## 3. The AI of each creature [disasm] [run]

Hook names as in the earlier notes; "queues nothing" means the turn is lost and pays the default recovery (`re-ffx-ai-evrae-yojimbo-isaaru-sin.md`).

### 3.1 Ultima Buster (`m280`) with Head (`m272`) and Arms (`m273` x2)

- **Parts.** The set-up marks the Head and Arms as hosted by the body. **Both Arms alive or one alive: against a physical, HP-affecting command the body writes DEF 255, Armored 1 and the status-defend flag** (on targeting); **both dead: DEF 0, Armored 0**. Spells (damage type 2) and special commands (type 0) are not touched. After every hit the body's DEF is set to 50 and Armored 0. [run] So **the arms are a gate for physical attackers only**: magic and Overdrives go through.
- **The body's own turn:** a counter `v10` of turns. If `v10` is 2 or more it casts **Ultima on the front line and then an Attack** on one random member (and `v10` starts again); otherwise a **coin flip: Attack on one random member, or Ultima on the front line** (50.00/50.00, 32,768 of 65,536 each). The first two turns are coin flips, the third is forced, then they alternate (coin, forced, coin, forced). So **Ultima comes on about 75 percent of its turns and an Attack on about 75 percent**. Two variables (a counter that resets after 2 to 3 turns once both arms are dead, and a threshold compared with its HP) are **inert**: they change nothing in the run. [run]
- **The Head's turns** (AGI 80): a three-turn cycle: **the body Attacks one member** (the Head passes the order through Special 1), the Head **passes**, **the body casts Contamination on one member**; then again. [run]
- Clock: body AGI 72 and Head 80 both tick 5; against a party at AGI 255 with Auto-Haste one creature turn comes per **11.3 party actions** each, so the body and the Head together are one creature action per 5.7 party actions. [arith]

### 3.2 Neslug (`m105`)

- **Three states** by HP: **normal (above 1/2)**: each turn a three-way draw (1/3 each): **Attack on the front-line member with the most MP**; **Megaton** on a random member (or an Attack if a particular group member stands in the front line); **Slime on the whole front line** (or an Attack on the highest-MP member if nobody is unslowed). **Below 1/2 (and 1/4 or more):** on the first hit it is **forced into its shell** ("Hides in shell"): **NullPhysical on, Regen at 255 (permanent)**; in the shell its turn is **Curaga on itself** until its HP is above 3/4, then it comes out (NullPhysical 0, Regen 0, back to normal). **Below 1/4:** the shell **breaks** (a forced "Broken shell"), NullPhysical 0, Regen 0, **AGI 120** (tick 4: a turn every 12 CTB), and the normal mix of moves resumes at that speed. Its death row varies by state. [run]
- **The design:** it cannot be hurt by physical commands while in the shell, heals itself and regenerates; only magic and Overdrives push it from 1/2 to 1/4. [run] [bytes]

### 3.3 Catastrophe (`m277`)

- **Form 1 (HP at or above 4/5 of max = 1,760,000):** the turn alternates **nothing / Toxic Cloud on the front line** (a rest turn, then the cast). **At the first hit that leaves it below 4/5:** it **transforms** (Armored off, Luck 30, **AGI 60** from 34, a Transform row). **Form 2:** a fixed three-turn cycle **Toxic Spray on the highest-HP member -> Demi on the front line -> Hundred Thorns on the front line**. No counters. [run]

### 3.4 Earth Eater (`m279`)

- **Standing:** each turn a coin flip (50/50): **one Attack** on a random member, or **two Megaton Punches** on random members. **On every hit it takes while standing it counters with one Megaton Punch** on a random living member (Death 100; the Ribbon is no Death ward in the repo's engine, see section 6, errata). It **adds up the HP damage it takes**; **when the total passes 100,000** it **falls**: Armored off. [run]
- **Down:** its first two turns do nothing, on the **third it "Gets up"** (Power Break and Darkness cleansed from itself, **Armored back on**, the counter and total reset). **Every hit while it is down is answered by a Flare it casts at itself, which its own Reflect bounces onto a random party member** (2,355 to 2,660 each, Shell halves). So **the player wants to knock it down with a burst and then wait out two turns, not keep hitting it**. [run] [arith]
- Jegged's account ("counters with Megaton Punch standing, reflects Flare on its back") matches. [guide]

### 3.5 Greater Sphere (`m281`) — read in outline only

The same idea as Spherimorph (row 41, `re-ffx-spherimorph.md`) at 1,500,000 HP: at the start it draws one of four states (Fire, Ice, Thunder, Water) and **writes absorb on the other three elements and Holy and weakness on its own element**; its turn is **Hydraulic Press on the front line (50 percent below half HP, otherwise a coin flip with an Attack)**; its reactions to spells depend on the element used (the -aga spell of the matching tier on the attacker or on the front line, Flare, Ultima, Hydraulic Press again after an HP-affecting physical hit). **Not run end to end; owed:** the exact reply table (about 2 hours with the Spherimorph harness, `t-sphere.mjs`).

### 3.6 Th'uban (`m282`)

- **A four-turn cycle** (starts on its third step): **Attack on the front-line member with the most HP -> Rainbow on the front line -> a self buff** (the first of **Protect, Shell, Regen** that it lacks, else nothing) **-> Convergence on one random member**, then again. [run]
- **Reactions:** after **any HP-affecting command** that hits it it casts **Condemn on the front line** (a counter, once per command; it strips every buff the party has); after **any CTB-affecting command** (Slow, Haste on others...) it casts **Haste on itself**. [run]
- Against the Sanctuary Keeper it has **no heal, no Reflect trick and no sweep**. The Keeper's chapter (row 39) does not carry over. [run]

### 3.7 Jormungand (`m311`)

- **No aeon on the field:** if nobody in the front line is petrified, a three-way draw (1/3 each, 21,846 / 21,845 / 21,845 of 65,536): **Attack, Cold Stare (Petrify) or Space-Time Vorpal on the front line**; **if a member is petrified it Attacks that member** (the shatter). **With an aeon on the field:** 75 percent Attack, 25 percent Cold Stare, never the Vorpal. [run]

### 3.8 Cactuar King (`m314`)

- **Each turn** (draws mod 6 over 65,536): **99,999 Needles on one random member 50.00 percent (32,769)**, **10,000 Needles 33.33 percent (21,844)**, and **16.67 percent (10,923) a rest turn that counts toward leaving: after two such turns the third one makes it Run Away**. [run]
- **Counter:** every hit it takes (if counterattacks are allowed and the hitter is not itself) draws **10,000 Needles on a random member**. [run]
- **It is a speed-and-survival fight:** EVA 240, MDEF 255 (black magic at MAG 255 does 877 to 990), DEF 100, HP 100,000: two capped Attack hits if they land. It leaves on the **third** rest roll (three rolls of one in six), so after **about 18 of its turns** on average, and 83 percent of its turns until then are a lethal Needle. [run] [arith]

### 3.9 Don Tonberry (`m317`)

- **No aeon on the field:** four turns of **Waddle** (one waypoint each: the formation's chunk-3 monster positions, 112 to 91 units from the party), then each turn an **Attack** on a random member. **With an aeon in the front line:** **Voodoo** every turn, from the start. [run]
- **Counter:** while it is still walking in (fewer than four Waddles done) and no aeon is on the field, a hit draws **Karma on the attacker**, except the first hit after each Waddle. Once it has arrived it counters nothing. **Karma is the attacker's kill count x 100** (`saveCounter` in the damage kernel). [run] [bytes]

## 4. Numbers against the repo's endgame party (all `[estimate]`: HP 9,999, MP 999, DEF/MDEF/STR/MAG 255, AGI 255, Auto-Haste, Auto-Protect, Break Damage Limit; `calc-54.out.txt`)

- **Clock.** Party rank-3 recovery: 4 CTB hasted. Creatures: Ultima Buster 15, Head 15, Cactuar King 15, Neslug 21 (12 in the broken shell), Earth Eater and Th'uban and Jormungand 18, Catastrophe 24 (18 transformed), Don Tonberry 21. [arith]
- **Their damage per target** (Protect or Shell halves where the class says): Ultima 2,524 to 2,850; Attack (Ultima Buster) 3,996 to 4,512; Contamination 2,707 to 3,057; Megaton 3,703 to 4,181; Earth Eater's Flare 2,355 to 2,660; Hundred Thorns 1,456 to 1,645; Hydraulic Press 9,374; **Convergence 99,999 (Shell halves; the member dies either way)**; Catastrophe's Demi 2,499. [arith]
- **Ours per hit** (cap 99,999): a physical Attack reaches the cap on every creature except the ones behind DEF or Armored: **Earth Eater 16,415 to 18,535 (49,245 to 55,606 with Piercing)**, **Ultima Buster 4,658 to 5,260 while an arm lives (13,975 to 15,780 with Piercing), 99,999 once both arms are down**. Black magic (the -aga row, p42) 55,891 to 63,111 on Neslug, Catastrophe and Th'uban, 8,801 to 9,938 on Earth Eater. **Hits to empty**: Ultima Buster body 51 (arms dead), Neslug 41 (out of the shell), Th'uban 31, Catastrophe 24 to 27, Greater Sphere 16, Don Tonberry 5, Jormungand 6, Cactuar King 2. [arith]
- **What the preset hides:** like the Dark Aeons chapter (`docs/handoff/ch-dark-aeons.md`), the preset makes the ordinary moves harmless and the length the cost; the lethal ones are the counters and the one-hit moves above. **The bench will show a cliff, not a slope; the levers are the party's stat caps, Auto-Phoenix, the Phoenix Down stock and Break HP Limit, never the creatures.**

## 5. The arena's own rules, from the files and the guides

- **Unlock.** Take the exit on the east side of the Calm Lands; the owner asks for fiends to be caught. Capturing **one of each of the nine Calm Lands fiend kinds** (machina cannot be caught) opens the arena and unlocks the first creation, the Chimerageist. [guide: GG, Jegged]
- **Capture.** A weapon with Capture (sold only there, one slot, cannot be customised in); Attacks and Skills count, Overdrives do not; up to 10 of any kind are kept. [guide: GG]
- **Creations.** **Area Conquest:** every kind of an area, once each, unlocks that area's creation (13 areas); **Species Conquest:** a count of a species (3 to 10 each, 14 species); **Original:** milestones, below. The three area creations the plan names: **Cactuar King (Thunder Plains), Jormungand (Djose Highroad), Don Tonberry (the Cavern of the Stolen Fayth)**. [guide: Jegged, GG agree]

| Original | Unlock | Prize on a first win (guides) | In the file: drop |
|---|---|---|---|
| Earth Eater | 2 area creations | Three Stars x60 | Fortune Sphere / Dark Matter |
| Greater Sphere | 2 species creations | Supreme Gem x60 | Luck Sphere / Dark Matter |
| Catastrophe | 6 area creations | Door to Tomorrow x99 | Designer Wallet / Dark Matter |
| Th'uban | 6 species creations | Gambler's Spirit x99 | Underdog's Secret / Dark Matter |
| Neslug | every area creation (Jegged: one of every fiend) | Winning Formula x99 | Pendulum / Dark Matter |
| Ultima Buster | 5 of every monster | Dark Matter x99 | Winning Formula / Dark Matter |
| Shinryu | 2 each of Splasher, Achelous, Maelspike | Megalixir x30 | row 48 |
| Nemesis | 10 of every monster and every other creation beaten | Master Sphere x10 | row 43 |

- **The fights cost gil.** `ArenaPrice` in the loot record is the price to spawn the fight: **Anacondaur 1,125 (file) = 1,125 (Gamer Guides: spawn 1,125, 750 returned when it is killed)**. Creation prices: Cactuar King, Jormungand 6,000; Don Tonberry 8,000; the six Originals above 15,000; Nemesis 25,000. [bytes] [guide: GG]
- **Open / not in the files:** the **prize** quantities and the capture counts live in the field and menu code, not in the monster files; **a conflict**: the guides' prize for Neslug (Winning Formula x99) and Ultima Buster (Dark Matter x99) is not the file's drop (Neslug drops Pendulum, Ultima Buster drops Winning Formula x1); read as the prize being a separate payment, which Jegged's "Rewards" page also implies by listing quantities. **Can the player flee a creation fight?** GG does not say; the arena formation script sets no ban, so it is the field's flag (unread).

## 6. Corrections and findings against the plan

- **"19 KB scripts for each":** the 19 KB is the **formation's camera work**; the AI scripts are 1.3 to 3.9 KB. The Ultima Buster formation is longer (19.9 KB) because of its head and arms.
- **Greater Sphere is missing from row 54.** Recommended: add it (9 acts); its mechanic is Spherimorph's, so it is cheap.
- **Th'uban does not share the Keeper's AI** (3.6), only its painting.
- **Neslug is not a plain brute:** a shell machine with permanent Regen and physical immunity (3.2).
- **Earth Eater's two modes** are the whole fight (3.4); a plain grind gets a Megaton Punch per hit.
- **The Cactuar King is a survival-and-speed check, not a grind:** 100,000 HP is two capped hits, but 83 percent of its turns (and every hit it takes) are a lethal Needle, and it leaves after about 18 of its turns.
- **Errata found while building the chapter (2026-11-10):** (1) **Threaten:** the record's byte is the Threaten *chance* (a default creature has 100), so byte 0 means Threaten never lands on any of the nine; the summary's "(lands)" read it the wrong way round (the chapter ships `threatenChance: 0`, the repo's convention for "immune"). (2) **Earth Eater's Megaton Punch and the Ribbon:** the Ribbon does not stop Death in the repo's engine (it is no Death ward there), so the Punch kills the member it lands on unless the party wears a Deathproof armour; section 3.4's "the party's Ribbon answers it" was a guess. (3) **Earth Eater's down-state Flare:** the bytes (3.4) have no counter-attack gate, so a Flare that its own Reflect no longer bounces (Dispel) would land on itself and be answered by the next Flare; the sources do not say what the game does there, and the chapter cuts that one loop (a hit it deals to itself asks for nothing). (4) **Zanmato byte (record +0x112):** this note prints none; the plan that cites it says "3 on the area three, 4 on the Originals", but the records give 3 to the area three and to Neslug (an Original) and 4 to the other five bodies.

## 7. Sources against the files

| Point | Files | Guides |
|---|---|---|
| Ultima Buster HP 5,000,000, drops Winning Formula / Dark Matter, steal Gambler's Spirit / Lv. 3 Key Sphere | same | Jegged: same |
| Earth Eater 1,300,000; Megaton Punch standing, Flare reflected on its back | same | Jegged: same |
| Unlock tiers of the Originals | not in the files | Jegged = GG (Neslug worded differently, same condition) |
| Spawn price | `ArenaPrice` | GG: Anacondaur 1,125 = file |
| Prize items x60 / x99 | not in the files | Jegged / GG (a few quantities differ between the two pages: Hornet 60/99, Abaddon's item) |
| Ultima Buster arms gate the body | physical only (DEF 255 + Armored while an arm lives) | Jegged: "hit head, arms and body at once with Ultima" (magic is not gated: consistent) |

## 8. Live checks (about an hour on a Steam copy; ask Bailey first)

1. Whether a creation fight can be fled. 2. The party and Sphere Grid at the arena (player data). 3. Greater Sphere's reply table (or the harness run, section 3.5). 4. The Cactuar King's Run Away: does the battle end as a loss or as a draw. 5. What "Karma" reads (kills per character) at a typical endgame. 6. The music (the arena field sets it). 7. That the Ultima Buster's Head is optional.

## 9. Sources actually read

The game's own files for the nine records, `m272`, `m273`, the command rows, the arena formations `zzzz02_77/79/80/81/82`, `zzzz03_11/14/17` and the formation table; Jegged "Monster Arena", "Rewards", "Original > Ultima Buster", "Original > Earth Eater"; Gamer Guides "Monster Arena" and "Unlocking the Monster Arena" (the fetch tool, 2026-11-09). Not read: GameFAQs (403), the Final Fantasy wiki (402), StrategyWiki.
