# FFX Belgemine's aeon duels: Mi'ihen, Moonflow, Calm Lands and the eight at Remiem Temple, read from the game's own files

**Game case: FFX only.** The duels are fought with FFX's CTB engine, Yuna's FFX aeons and the FFX monster files (`ffx_ps2/ffx/master/jppc/battle`). Nothing here applies to FFX-2 (where aeons are enemies of another kind, rows 164 to 180 of its kernel), and no FFX-2 number is used.
Written 2026-11-07 by a Sonnet sub-agent of the release driver (program plan row 45, `PLAN.md` of 2026-11-06, wave 4). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed; the game was not run; no browser, no GPU; Ghidra not used.** Authority (relayed words, verbatim): 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick named here is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers and described behaviour read from the unpacked archive (kept outside the repo, read only) by the RE parity tools: the Atel disassembler `dump.mjs`, the record reader `rec.mjs` (both of the wave-3 lane), a new event-package scanner (`scan-events.mjs`) and a new run of the **real hook bytecode** of ten monster files in the earlier AI lanes' interpreter (`t-belgemine.mjs`, `t-extra.mjs`, `t-extra2.mjs`; harness `sim2.mjs`, unchanged). No dialogue, no script text, no byte dumps. Monster and move names are the game's English names.

**Tags.** **[R]** read from a game file by this lane's tools; **[H]** run on the real bytecode in the interpreter (output files named below); **[I]** inferred from [R]/[H]; **[G]** a published guide (Gamer Guides HD, Jegged); **unmapped** raw value, no meaning claimed (AGENTS.md rule 6).

## Summary for the driver

1. **The plan's rows are corrected by the files.** `m258` (Valefor, HP 1, no behaviour) and `m259` (Ifrit, HP 3,500, formation `kino04_40`) are **not** the player-side aeons of the plan's list: they are unused prototypes (no event package launches `kino04_40`, the record lists no commands; scan: `scan-kino04.out.txt`). The duels the game launches use **`m284` (the file named Fist), `m254` (Wing), `m285` (Ixion), `m286` (Shiva), `m287` (Sword), `m288` (Yojimbo) with the dog `m266`, `m265` (Anima), `m289`, `m290`, `m291` (the Sisters)**, and the **same files are Isaaru's three aeons** (Fist, Wing, Sword = Grothia, Pterya, Spathi): each script tests the battle id and writes its own numbers for each fight. [R, H]
2. **Eleven duels, three places in the field and eight at Remiem.** Mi'ihen Highroad (`mihn00_60`, the first challenge, Ifrit), Moonflow (`genk00_40`, Ixion), the Calm Lands (`nagi00_40`, Shiva) and the Remiem Temple set `lmyt01_00` to `_07` (Valefor, Ifrit, Ixion, Shiva, Bahamut, Yojimbo with Daigoro, Anima, the three Magus Sisters). Each is launched from its place's own event package (`mihn0000`, `genk0000`, `nagi0000`, `lmyt0100`). [R: `scan-events.out.txt`]
3. **The Remiem numbers (the stat block each script writes at start):** Valefor 20,000 HP, Ifrit 28,000, Ixion 30,000, Shiva 20,000, Bahamut 35,000, Yojimbo 32,000, Anima 54,000 (the record, no override), Sandy 35,000 + Cindy 48,000 + Mindy 20,000 (records). Strength 21 to 48, Magic 18 to 60 (the main aeons 25 to 40 and 31 to 60): these are the numbers of a **Yuna in the middle of her Sphere Grid, not at the caps** (section 6: against endgame-tier aeons every enemy move hits for under 250). [R, H]
4. **A duel is lost without a game over.** When every aeon Yuna has recruited (except the one the enemy holds, which she cannot summon) is at 0 HP, the enemy aeon's script ends the battle as "player escaped" (code 3); only Isaaru's battle id ends it as a defeat (code 1). The mirror lock exists in the repo (`aeon-duel.ts`). [R, H: `t-belgemine.out.txt` section 5]
5. **Behaviours worth keeping**, all [R, H]: Mi'ihen's Ifrit strictly alternates Attack and Meteor Strike and has no Overdrive move at all in that fight; Remiem Ifrit answers a **physical** hit with Meteor Strike next turn; Remiem Valefor fires Energy Ray after a **magical** hit once her gauge is at 30; **Remiem Ixion braces (Defense and Magic Defense 255) or evades (Evasion 255) one turn in two and charges his gauge by 25 for each hit of the matching type**; Remiem Bahamut does nothing for five turns, then Mega Flare, and counters hits (a fifth counter is Impulse); Yojimbo picks his move by the gauge band; **Anima's gauge fills only from hits she takes (5 each)**; the Sisters act as three bodies, Cindy leads Mighty Guard every seventh turn and Delta Attack when all three gauges are full.
6. **Guides and files disagree on three small things**, each recorded in section 8: Mi'ihen Ifrit's HP (files 3,000, guides 3,500), whether he is weak to Ice (files: no), and the first-win rewards (two guides, two quantities).
7. **Size.** Research is done here. Build is eight Remiem scripts and eleven records on the existing duel engine, no new mechanic except the per-act party question (section 7); the plan's 30 h holds (preflight section 11).

## 0. Result in one screen

Battle id = (area key << 16) | formation suffix [R: the `CurrentBattle` tests in the scripts; area keys from `tables_zones.md`]. "Record" = the stat block of the kernel monster record; "script" = values the script writes at start for that battle id. Blank stats are the record's. All gauges have a maximum of 100.

| # | Duel (formation, id) | Aeon file | HP | MP | STR | DEF | MAG | MDF | AGI | EVA | ACC | Element |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | Mi'ihen, `mihn00_60`, 13,762,620 (area 210) | m284 Ifrit | 3,000 | 200 | 15 | 20 | 10 | 10 | 10 | 10 | 15 | absorbs Fire |
| 2 | Moonflow, `genk00_40`, 16,056,360 (area 245) | m285 Ixion | 6,000 | 450 | 22 | 0 | 23 | 0 | 17 | 0 | 0 | absorbs Thunder |
| 3 | Calm Lands, `nagi00_40`, 27,852,840 (area 425) | m286 Shiva | 15,000 | 900 | 20 | 180 | 20 | 180 | 21 | 0 | 0 | absorbs Ice |
| 4 | Remiem `lmyt01_00`, 29,229,056 (area 446) | m254 Valefor | 20,000 | 500 | 35 | 85 | 48 | 0 | 17 | 0 | 0 | none |
| 5 | `lmyt01_01`, +1 | m284 Ifrit | 28,000 | 800 | 29 | 40 | 45 (35 on ordinary turns, 48 on Hellfire) | 40 | 18 | 10 | 15 | absorbs Fire |
| 6 | `lmyt01_02`, +2 | m285 Ixion | 30,000 | 720 | 40 | 40 | 50 | 40 | 12 | 10 | 15 | absorbs Thunder |
| 7 | `lmyt01_03`, +3 | m286 Shiva | 20,000 | 950 | 25 | 0 | 31 | 0 | 22 | 50 | 15 | absorbs Ice |
| 8 | `lmyt01_04`, +4 | m287 Bahamut | 35,000 | 1,500 | 32 | 0 | 47 | 0 | 18 | 0 | 15 | none |
| 9 | `lmyt01_05`, +5 | m288 Yojimbo (+ m266 dog, HP 1) | 32,000 | 1,200 | 30 | 0 | 45 | 0 | 25 | 50 | 15 | none |
| 10 | `lmyt01_06`, +6 | m265 Anima | 54,000 | 3,000 | 38 | 0 | 60 | 0 | 15 | 0 | 0 | none |
| 11 | `lmyt01_07`, +7 | m291 Mindy / m289 Sandy / m290 Cindy | 20,000 / 35,000 / 48,000 | 7,000 / 3,000 / 8,000 | 21 / 35 / 48 | 0 | 28 / 18 / 38 | 0 | 20 / 24 / 15 | 0 | 0 | none |

Rows 1 to 3 and 4 to 11 are the game's own numbers; the Mi'ihen HP differs from both guides (section 8). Belgemine herself (`m250`) is HP 10, untargetable, not on the turn list, and her death is not needed to end the battle; she summons the aeon on its first turn [R]. All eleven aeons are immune to Scan, Sensor, Distill and Eject, to CTB delay (`ImmuneCTB`), Slice and Bribe; the Sisters lack the "fractional damage" immunity the others carry [R: `rec-aeons.out.txt`]. No gil, no AP, no drops by record; every reward is script (section 8).

## 1. Source block

| Item | Value |
|---|---|
| Archive | the unpacked FFX archive, `ffx_ps2/ffx/master/jppc/` of the unpacked archive (kept outside the repo, read only), the build the earlier waves read (Steam HD Remaster 25501027) |
| Monster files | `battle/mon/_m250`, `_m254`, `_m259`, `_m265`, `_m266`, `_m284` to `_m291` (`mNNN.bin`), disassembled by `dump.mjs mon <id>` (outputs `m250.txt` ... `m291.txt`); records by `rec.mjs` (`rec-aeons.out.txt`) |
| Formations | `battle/btl/lmyt01_00` to `_07`, `mihn00_60`, `genk00_40`, `nagi00_40`, `kino04_40` (`pos-all.txt`, `btl-*.txt`). **Correction (2026-11-09, the ch-belgemine review):** an earlier version of this row called the formation scripts "camera only". They are not: the first function of `lmyt01_00` and `_07` (the two dumped and read) calls `setDefendingEnabled(0)`, `setCommandDisabled` for Switch (all characters and aeons) and for Yuna's Attack, Item, Weapon, Armor, Black Magic, White Magic, Skill and Special (0x3000, 0x3001, 0x3004, 0x3005, 0x3115, 0x3116, 0x3113, 0x3114), `setCommandDisabled(1, 8, 0)` in `_00` (the Valefor availability byte, and 15 to 17 in `_07` for the Sisters; "available") and `btlSetCounterFlag(0)`. `lmyt01_00` to `_07` are all under `setDefendingEnabled(0)` and `btlSetCounterFlag(0)` in the repo's formation-flag fixture (`tests/fixtures/parity/ffx/formation_flags.json`); `_01` to `_06` were not dumped, so their command lists are inferred equal. Also from the review: Remiem Bahamut's script writes ImmuneToFractionalDmg = 0 (`m287` @0x0214), and Cindy's single buff picks (`m290` @0x0526, @0x0542, @0x0572, @0x0590) read AllMonsters without the `removeFromMatchingGroup(4346)` her group moves use (so Belgemine may be a candidate in the game: unverified) |
| Zone and stage | `coverage/ffx/FFX-H02/formations_all.tsv` and `tables_zones.md`: Remiem is area 446 (map `lmyt01`), Mi'ihen 210, Moonflow 245, Calm Lands 425; `kino04_40` has no zone entry |
| Event packages | `event/obj/*`, scanned for the battle ids by `scan-events.mjs` (`scan-events.out.txt`, `scan-kino04.out.txt`) |
| Interpreter | `sim2.mjs` of the Evrae, Yojimbo, Isaaru and Sin lane (unchanged, kept outside the repo); my wrapper `t-belgemine.mjs` sets the battle id and a mock battle (Yuna chr 1, her aeons 8 to 17, Belgemine chr 20, the duel aeons from chr 21) |
| Damage arithmetic | `calc-45.mjs` on the repo's kernels of a clean checkout (read only); output `calc-45.out.txt` |
| Guides | Gamer Guides HD boss pages (`web/gg-*.txt`), Jegged (`web/jegged-remiem.txt`, `jegged-calm.txt`, `jegged-mihen-south.txt`, `jegged-moonflow.txt`); GameFAQs was searched and not reachable for these pages, so no GameFAQs figure is quoted |

## 2. How the duels were found

1. **The formations.** `formations_all.tsv` lists 12 formations holding Belgemine (`m250`, word 0x10fa): `lmyt01_00` to `_07`, `mihn00_60`, `genk00_40`, `nagi00_40`, `kino04_40`. [R]
2. **Which are launched.** The battle ids of the first three and of the eight Remiem ids occur as literal constants in exactly one field event package each (`mihn0000.ebp`, `genk0000.ebp`, `nagi0000.ebp`, `lmyt0100.ebp`, which holds all eight in a table). **No package holds `kino04_40`'s id (14,680,104)**: that formation, with `m259` (a 3,500-HP Ifrit with no commands in its record), is the prototype of the Mi'ihen fight and is unused. [R]
3. **The scripts carry the numbers.** The monster files are shared: `m284`, `m254` and `m287` are Isaaru's Fist, Wing and Sword (Via Purifico, area 419, ids 27,459,594 to 27,459,596) **and** Belgemine's Ifrit, Valefor and Bahamut. Each tests `CurrentBattle()` and writes its own stats and its own behaviour; the Isaaru branch is what the repo's Chapter XIV already builds from the wiki (`ai/isaaru.ts`). The Belgemine branches are new reading. [R, H]
4. **Positions.** The formations carry party, aeon and monster start positions (`pos-all.txt`); the duel set uses the same layout per place (Remiem: Yuna's party at the left, the aeon slots all on one spot, the monster 1 at the right, the Sisters in a row). Stage ids were not read (the plates are the art lane's, section 5 of the preflight).

## 3. The turn scripts, duel by duel

Engine rules as in the earlier notes: a "turn" is one call of the script's turn hook; `GetRandomValue() mod n` is the battle RNG stream 2; "front line" is the group of Yuna's side (aeons and Yuna in battle); a gauge is the Overdrive gauge (0 to 100). Exact splits are over draws 0 to 119 (so mod 2/3/4/5/6/8/10 are fully covered) [H: `t-belgemine.out.txt` section 3].

### 3.1 Common to all eleven

* **First turn: Belgemine summons the aeon** (a scripted Summon with a short scene); the aeon's own first turn is the second call. [R, H]
* **Loss:** no recruited aeon of Yuna's left alive (the check reads the ten aeon slots, skipping the slot the enemy holds): the battle ends "player escaped". [R, H]
* **Win:** the enemy aeon (or the last Sister) reaches 0 HP: it falls as a "Boss" death (body stays, untargetable), the battle ends in victory. Belgemine does not need to die. [R, I]
* Every duel aeon shows an Overdrive bar; `onHit` hooks raise the gauge as listed per duel. [R, H]

### 3.2 Mi'ihen: Ifrit (m284, `mihn00_60`) [R, H]

3,000 HP, absorbs Fire. Turn 2 is a **scripted Attack** with a tutorial scene about Shield and Boost; from turn 3 a strict alternation **Meteor Strike, Attack, Meteor Strike, Attack ...** (the choice flag toggles each turn), each at a random living member of the front line. Gauge +2 per action, +3 per allowed hit; **the Mi'ihen branch has no Overdrive move at all** (Hellfire exists only in the Isaaru and Remiem branches), and the gauge would need 34 hits to fill. Meteor Strike is magical (power 28), Attack physical (power 16, an Attack row that rolls to hit). Guides: Jegged says "alternates ... then Hell Fire once its Overdrive gauge is maxed", Gamer Guides says the pattern is preset; the file has no Hellfire here. [G disagrees with R; R stands]

### 3.3 Moonflow: Ixion (m285, `genk00_40`) [R, H]

6,000 HP (record), absorbs Thunder. After the summon and a tutorial scene: **Aerospark one turn in three, Attack two in three** (Aerospark strips positive statuses from the target: its row carries the removal list), gauge +5 per action and per allowed hit; at 100 (20 actions): **Thor's Hammer** on the front line (a variant row when Anima is in the front line, a presentation detail). **Below half HP he casts Haste on himself** (once, whenever he lacks it; the first time a scene plays), then continues the same pattern at double speed. Guide match: Gamer Guides "at 50 percent health Ixion will cast Haste on itself". [R, H, G agrees]

### 3.4 Calm Lands: Shiva (m286, `nagi00_40`) [R, H]

15,000 HP, **Defense 180 and Magic Defense 180** (the record), absorbs Ice. Each turn: **Blizzara one turn in four, Attack three in four**; gauge +10 per action, +2 per allowed hit; at 100: **Heavenly Strike** (a variant row that adds Threaten 100 to the target). A tutorial scene plays on the first hit. Guides: "high defense and magic defense so your attacks are not going to deal too much damage ... Overdrives are going to inflict a lot more" (Gamer Guides) matches. [R, H, G agrees]

### 3.5 Remiem 1: Valefor (m254, `lmyt01_00`) [R, H]

Stat block in section 0. Gauge +10 per action; **hit by a magical command: +15, and a flag is raised; any other allowed hit: +5.** Turn order: gauge at 100: **Energy Blast** on the front line (gauge to 0); else with the gauge at **30 or more and the flag raised: Energy Ray** on the front line (flag cleared, +10); else **Sonic Wings one turn in three, Attack two in three**. [H: `t-extra.out.txt`] Guide match (Energy Ray "above a certain point", Overdrive Energy Blast). Sonic Wings is physical (power 8) and delays the target; aeons carry delay immunity (the guides use Blizzard on Mi'ihen Ifrit for the same reason).

### 3.6 Remiem 2: Ifrit (m284, `lmyt01_01`) [R, H]

Gauge +7 per action, +3 per allowed hit. **A physical hit raises a flag; the next turn is Meteor Strike** (flag cleared), otherwise Attack. At 100: **Hellfire** on the front line (MAG written 48 for it, 45 after); on ordinary turns MAG is rewritten to 35. [H] Guide match ("counters physical attacks with Meteor Strikes"). He absorbs Fire (Ifrit's own Fire heals him; Gamer Guides: Shiva with NulBlaze is the suggested answer).

### 3.7 Remiem 3: Ixion (m285, `lmyt01_02`) [R, H]

Every turn Defense and Magic Defense are reset to 40 and Evasion to 10, then: gauge at 100: **Thor's Hammer**; else a draw mod 4: **0 = brace** (a scene; **Defense and Magic Defense 255 for the turn, no action**), **1 = evade** (Evasion 255 for the turn, no action), **2 = Aerospark**, **3 = Attack** (gauge +5 for the last two). `onHit`: **while braced a magical hit adds 25 to the gauge** (other hits 5); **while evading a physical hit adds 25** (other hits 5). [H: gauge 5 to 30 and to 10 in `t-extra.out.txt`] Guide match ("spend a turn either defending or evading"). **Open (unmapped):** on his second turn the script queues an Attack and then, in the same call, the random pick; the harness shows both queued, the game's queue rule (`btlSetDirectCommand` queues only if the actor can act, replaced or ignored) decides; the build does one command that turn.

### 3.8 Remiem 4: Shiva (m286, `lmyt01_03`) [R, H]

Evasion 50, Defense and Magic Defense 0. Gauge +10 per action, +5 per hit that took HP. At 100: **Diamond Dust** on the front line. **Above half HP: draw mod 4: 0 Heavenly Strike, 1 Blizzara, 2 and 3 Attack. Below half HP: 0 Blizzaga on herself (a heal: Ice is absorbed; gauge +20), 1 Heavenly Strike, 2 Blizzara, 3 Attack (+10).** [H: `t-extra.out.txt`] Guide match (Heavenly Strike "small delay", Blizzaga to heal under half).

### 3.9 Remiem 5: Bahamut (m287, `lmyt01_04`) [R, H]

**Five empty turns, then Mega Flare**: gauge +20 per turn from 0 (a charge scene plays), 100 on the sixth turn after the summon, **Mega Flare** on the front line on the seventh call, gauge back to 0, repeat (period six). Every allowed hit is **countered with Attack on the last attacker; the fifth counter (and every fifth after) is Impulse on the front line** instead. [H] Guide match ("five turns", "counter your attacks ... after five attacks, Impulse"). Mega Flare is power 44 magic (cap 9,999 for a party member, no break), Impulse physical power 25.

### 3.10 Remiem 6: Yojimbo and the dog (m288, m266, `lmyt01_05`) [R, H]

Gauge +2 per action, +3 per allowed hit (so Zanmato needs about 50 actions or hits). By band: **below 25: Daigoro** (the dog, chr 22, attacks); **25 to 49: Kozuka one turn in four, Daigoro three in four**; **50 to 79: Wakizashi one in five, Kozuka one in five, Daigoro three in five**; **80 to 99: Wakizashi one in four, Kozuka one in four, Daigoro two in four**; **100: Zanmato** on the front line. [H: splits in `t-belgemine.out.txt`] Guide match (Daigoro first, Kozuka above 25, Wakizashi above 50, Zanmato at full). The repo's Cavern Yojimbo (`ai/yojimbo.ts`) is the base.

### 3.11 Remiem 7: Anima (m265, `lmyt01_06`) [R, H]

No stat override: the record (54,000 HP, MAG 60, STR 38). Each turn: gauge at 100: **Oblivion** (16 hits of power 6) on the front line; else a draw mod 10: **0 Dispel** (one target), **1 and 2 Demi** (front line, a quarter of current HP, power 4), **3, 4, 5 Pain** (one target, Death 100), **6 to 9 Attack**. **Her gauge rises only when she is hit (+5 each, 20 hits)**; none of her own actions adds to it [H: `t-extra2.out.txt`, all ten draws leave the gauge at 0]. Guide match (Pain, Dispel, Demi, Oblivion).

### 3.12 Remiem 8: the Magus Sisters (m291 Mindy, m289 Sandy, m290 Cindy, `lmyt01_07`) [R, H]

Three bodies in one battle (chr 21 Mindy, 22 Sandy, 23 Cindy), each with its own script; gauge +10 per action and +5 per hit that took HP, for each.

* **Mindy:** above a quarter HP a draw mod 6 picks Flare, Thundara, Fira, Blizzara, Watera or Passado (a 15-hit physical of power 2); **below a quarter HP** the second table: Ultima (front line), Thundaga, Firaga, Blizzaga, Waterga, Passado.
* **Sandy:** Attack three turns in four, **Razzia** (physical, power 21) one in four.
* **Cindy** (counter starts at 4, so her first Mighty Guard is her third turn after the summon, then every seventh turn): if **all three gauges are at 100: Delta Attack** on the front line (all three gauges to 0); else on the counter: **Mighty Guard** on all three Sisters (+5); else if **all three are below half HP: White Wind** one turn in four; else one turn in four a mod 6 pick of Holy, Drain, Osmose, Demi, Dispel or **Camisade** (physical, power 21); otherwise she **buffs**: **Shell** on a Sister who lacks it, else **Protect** on one who lacks it, else (both up on all three) a random living Sister gets **Cura** one time in three and **Regen** otherwise. Each action adds 10 to her gauge (a Mighty Guard or White Wind 5).
* **A fallen Sister goes dormant while another stands** (a flag is set and her bar hidden); the battle ends when all three are down. [R, H]
Guide match (Gamer Guides section on the Sisters). Delta Attack is six hits of power 10; the actor's Strength is the caster's.

## 4. Moves (the game's rows)

The kernel rows of every move the ten scripts use are in `cmd-rows.out.txt` (power, formula, target class, element, status chances, shatter and cap bits). The rows the Remiem set needs that are **not yet** in the repo's enemy data are Aerospark (22, strips statuses), Thor's Hammer (40, thunder), Heavenly Strike (30, two rows, one with Threaten 100), Diamond Dust (40, ice), Energy Blast (40), Energy Ray (26), Sonic Wings (8), Mega Flare (44), Impulse (25), Kozuka (16), Wakizashi (28 and a 24 magical variant), Daigoro (20 for the dog), Zanmato (formula 6, power 200), Pain (20, Death 100), Oblivion (6 x 16), Razzia (21), Camisade (21), Passado (2 x 15), Delta Attack (10 x 6), Mighty Guard (Shell, Protect, the four Nul statuses), plus the player spells Belgemine's aeons cast (Blizzara, Blizzaga, Fira, Firaga, Thundara, Thundaga, Watera, Waterga, Flare, Ultima, Holy, Drain, Osmose, Demi, Dispel, White Wind, Cura, Regen, Shell, Protect, Haste); several already exist for the Dark Aeons and the possessed aeons (`dark-aeons-six-abilities.ts`, `possessed-aeons.ts`), the build lane reuses them by id.

## 5. What the player's side is

Yuna alone (the game's duels have no other party member); her aeons are the player's [G: Gamer Guides, Jegged]. **Mi'ihen: Valefor is the only aeon she owns, and the enemy is Ifrit; Moonflow: Valefor and Ifrit against Ixion; Calm Lands: Valefor, Ifrit, Ixion, Shiva (mirrored) and Bahamut; Remiem: all she has**, Valefor first, and the guides say the later ones need Anima, Yojimbo and the Flower Scepter plus Blossom Crown for the Sisters [G: Gamer Guides, Jegged]. The mirror lock (she cannot summon the aeon she faces) is the repo's `lockedAeons`. A Remiem win over Bahamut gives the Flower Scepter; the Sisters' win offers "send Belgemine" for the Moon Sigil [G]. **The player's aeon stats come from Yuna's stats and the battle count** (the repo's `aeonStatsFromYuna`, verified three ways), so the duels' difficulty is set by the party preset (section 6).

## 6. Difficulty arithmetic (`calc-45.out.txt`, a check, not a tuning)

Against **Yuna's aeons at the endgame tier** (`mirror-aeons.ts` Yuna at the caps, 600 battles: Defense and Magic Defense 255, HP 13,897 to 43,827) **no enemy move does more than 241** (Ifrit's Hellfire), most do 20 to 140: the duels cannot be lost. Against the repo's **sourced Zanarkand-Dome-tier rows** (`late-aeon-rows.ts`, N = 300: Valefor 1,674 HP / Defense 51, Bahamut 3,218 HP / Defense 65) the same moves hit for **15 to 195 percent of an aeon's HP** (Ifrit's Hellfire 303 to 343 percent, Mega Flare 82 to 196, Cindy's Camisade 80 to 196): a real contest in which the player's Shield, mirror pick and Overdrive choice matter, which is how the guides describe Remiem ("how easy or hard things are depends solely on how well you built Yuna"). The enemy HPs are 20,000 to 54,000, several hits at the 9,999 cap. So the **party preset is the lever, never a duel row** (rule 15): the preflight recommends the Zanarkand-tier Yuna (section 4 of the preflight) and the bench measures both.

## 7. Engine facts (checked against `origin/main` 63813367c by reading)

* **Exists:** the aeon-duel module (`aeonsOnly`, `lockedAeons` as the mirror lock, `victoryBonusAp`, the greyed "Only an aeon can fight an aeon"), the Isaaru enemy aeons (`ai/isaaru.ts`, `data/ffx/enemies/isaaru.ts`: Grothia, Pterya, Spathi with their art), Yuna's ten aeons with the formula-derived stats (`endgame-aeons.ts`), the Sisters as one battle (`ai/possessed-sisters.ts`), Yojimbo with the dog (`ai/yojimbo.ts`), the Mirror Aeons chain with heal-between-acts and the Dark Aeons six-act chain.
* **New (small):** eight scripts (section 3.5 to 3.12) and eleven stat records; the hit-type-sensitive gauge bonuses (Valefor's +15 and flag on magic, Ifrit's physical flag, Ixion's +25 while braced or evading) use the `onHit` hook with the command's damage type, which the Isaaru and Evrae scripts already read; the Sisters' shared Delta Attack across three scripts (the Dark Sisters do the same).
* **Gap (decision):** the engine has **one `buildRef` per chapter**. The three field duels belong to three different points of the game (Valefor alone at Mi'ihen, Valefor and Ifrit at Moonflow, five aeons at the Calm Lands) and Remiem to a later one; one chapter can carry one party. The recommendation (preflight section 10, BD1) is the eight Remiem duels with one preset; the three field duels as a later add-on behind a small per-act party seam (about 4 h).

## 8. Conflicts and unknowns

| # | Item | Files | Guides | Decision |
|---:|---|---|---|---|
| C1 | Mi'ihen Ifrit HP | 3,000 (`m284` script under `mihn00_60`); the unused prototype `m259` record says 3,500 | Gamer Guides and Jegged: 3,500 | The launched battle is the file's 3,000. The guides' figure equals the unused record, so I read it as the guides quoting the wrong row. **Flagged**; GameFAQs could not be fetched, ask the owner's Steam copy (a Scan at Mi'ihen) if it matters. |
| C2 | Mi'ihen Ifrit weakness | none (weak byte 0) | Jegged: "weakness to Ice"; Gamer Guides: "doesn't seem to have a weakness to Ice" | file wins: no weakness |
| C3 | First-win rewards | script (not read; the records pay 0) | Gamer Guides Valefor x4 Lightning Gem, Ifrit 30 X-Potions, Ixion 10 Chocobo Feather, Shiva 60 Mega-Potions, Yojimbo 8 Shadow Gem, Anima 60 Stamina Spring, Bahamut the Flower Scepter; Jegged x3 Lightning Gem, x3 Feather | `[G conflict]`; not needed for the chapter (the results screen pays the chapter's own spoils) |
| U1 | Remiem Ixion's second call queues two commands | see 3.7 | | one command; flagged |
| U2 | Which sub-flags make a loss "player escaped" vs a game over for the formation | the formation flag words are unmapped (as in the Dark Aeons note) | | use the engine's ordinary loss for the chain; the card says it |
| U3 | Stage ids (plates) for the eleven formations | not read | | the art lane |
| U4 | The sourced reward items of the first-win/retry split | script not read | | not modelled |

## Scripts and outputs (kept outside the repo, in the lane scratch folder)

`m250.txt` ... `m291.txt` (disassembly), `rec-aeons.out.txt`, `cmd-rows.out.txt`, `pos-all.txt`, `btl-*.txt`, `scan-events.mjs` with `scan-events.out.txt`, `scan-kino04.out.txt`, `t-belgemine.mjs` with `.out.txt`, `t-extra.mjs`, `t-extra2.mjs` with outputs, `calc-45.mjs` with output, `ggfetch.mjs`, `web/*.txt`.
