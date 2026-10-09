# FFX-2 boss AI read from the game's own scripts: the Leblanc Syndicate, the three Den of Woe shades and Ixion at Djose

**Game case: FFX-2 only.** FFX has its own scripts and its own engine; they have their own notes. This note covers three FFX-2
chapters: `ffx2-leblanc` (Act I the Chateau entrance, Act II Logos' room, Act III the Last Room), `ffx2-den-of-woe` (Baralai,
Gippal, Nooj) and `ffx2-ixion-djose` (Ixion). Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)),
P6 (boss AI follows the scripts). Drafted 2026-10-08. Research only: no engine or AI code is changed by this note. It continues
[re-ffx2-ai-bahamut-vegnagun.md](re-ffx2-ai-bahamut-vegnagun.md); that note's section 1 (polls, random sources, the weighted target
pick, the inert time-out block) applies here unchanged, and section 1 below adds only what these scripts need beyond it.

**Source note (applies to every statement below unless a line says otherwise):** FFX2_Data.vbf Steam build 25501027
(FFX-2.exe SHA-256 6EA7F142...CD69). The AI is the developers' own script source shipped in the archive under
`ffx_ps2/ffx2/master/jppc/battle/mon/`: `m243.src`, `m244.src`, `m245.src` (Ormi, Acts I to III), `m249.src`, `m250.src` (Logos,
Acts II and III), `m253.src` (Leblanc), `m135.src` (Dr. Goon), `m138.src` (Fem-Goon), `m176.src` (Baralai), `m177.src` (Gippal),
`m258.src` (Nooj) and `m166.src` (Ixion), each checked against the compiled package next to it (`_mNNN/mNNN.bin`). Ability numbers
are rows of `battle/kernel/monmagic.bin` and `command.bin`; stats and rewards are rows of `monster.bin`; formations are rows of
`btl.txt`; start positions are from `btl/djyt08_229/pos_djyt08_229.psc` (the other scenes ship none). Engine behaviour is read from
FFX-2.exe in Ghidra 12.1.4 (the older copy; the 21 functions cited below that the alignment map lists were compared
instruction by instruction with the live build and are the same, and the target re-validation chain of 1.12 was run from the
live exe itself; the 8-byte "friend" getter of 1.7 is not in the map and was read in the older copy only). Everything is
written in our own words: no script text, no game text and no decompiled code is reproduced here.

## Main findings in one screen

1. **All twelve actors have complete scripts, and the compiled scripts equal the sources.** The research files' statements
   that "no AI script is published for Logos" and that the goons' behaviour is unknown are wrong for the Steam build: Logos
   has a 4-poll cycle in Act II and a 6-poll cycle in Act III, and both goons have short scripts (sections 3.4 and 3.6).
2. **Leblanc's No Love Lost does not use up a step of her five-step cycle.** Her trio counter fires it on her 3rd command and then
   on every 8th poll after a clean-up poll (7 ordinary turns between), so turns 3, 11, 19, 27 ... while Ormi and Logos both live.
   The cycle goes Attack, spell (Osmose below 15 MP), Love Tap or White Wind, Attack, Mach Fan or a grenade; turn 5 is a plain
   Attack. Not-So-Mighty Guard is cast on all three exactly twice in the whole fight: on her first turn and on her 25th ordinary
   turn (turn 25 + the number of No Love Losts used so far), never again.
3. **Ormi's Concussive Blast exists only in Act III and is a 25% roll per poll below one quarter of his HP**, not a
   guaranteed move, and not in Acts I and II. His Huggles go to the girl with the highest MP (Acts I and II) or the highest HP
   (Act III) when he is alone; his Supercollider goes to the girl **farthest from him**; while any other enemy lives he repeats
   Attack, Attack, Attack, Supercollider.
4. **Logos' Russian Roulette picks one of five rows with equal chance (Death 30, Curse 100, Silence 100, Petrify 30, Poison 100)**; a
   sixth, harmless row exists but the script's `% 5` can never reach it, and there is no Eject. Act III adds a 25% Hail of
   Bullets (a three-hit physical move on all three girls) to his five ordinary turns.
5. **Baralai's low-HP move is an extra command, not a replacement, and its test is Reflect.** Below a third of his HP, every
   poll rolls 25%; on a hit he queues Regen (or Absorb below 60 MP) and then **also** queues that poll's normal move, so he acts
   twice in one turn. The branch "cast Not-So-Mighty Guard" is taken only when Baralai himself has Reflect, which nothing in
   the fight gives him; the research files' "if he already has Regen" is not what the script tests.
6. **Baralai's counter and Ixion's action counter both count every result another character applies to them**, one per hit
   per target, misses and no-effect results included, never their own Regen or Poison ticks. A multi-hit action adds once
   per hit. Baralai's Drill Shot target is whoever applied the last result (which can be his own Regen tick, 4.2).
7. **Baralai's Triple Attack has fixed targets**: with all three girls alive it strikes Yuna, then Rikku, then Paine, once each;
   with one down the missing girl's strike goes to the next girl in a fixed order (4.2). It is not three random hits.
8. **Gippal's low-HP Attack goes to the girl with the lowest current HP**; his one-third line is `HP < max / 3` in integer
   arithmetic (4,933 of 14,800, so 4,932 turns him). **Nooj's script is exactly the research's cycle plus Lightfall at HP below
   3,000, once.**
9. **Ixion keeps his place in the Attack/Thundara cycle across Recharge and Thor's Hammer**; the research's "restart at step 1"
   is not what the script does. The Attack:Thundara split is 3:1 (`% 4`), as in the research's choice. Recharge heals him 200
   HP and 200 MP (HP+MP class, fixed) and nothing in his script ever looks at MP.
10. **Pace is set by each move's own rest and charge numbers** (section 6): the three shades' special moves have rest 0, so
    they follow one another after their charge and animation only; Ormi's Supercollider charges for 296 steps at AGI 63. While
    any command's effect plays, every gauge in the battle stands still, the party's included.
11. **The authored values in our data are replaced by the files' numbers** (section 2): every actor has ACC 95 (we have 0); the
    two goons are Lv 14 and Lv 16 with DEF 6 and 5 (we author 30 and 20); Acts I and II Ormi and Act II Logos carry their
    own STR/AGI (63 AGI for both Ormi, 90 for Logos); steals are 255/255 for the goons, 192/255 for the trio and 128/255
    for the shades and Ixion; Pilfer Gil always succeeds on its first use and pays 50% to 100% of the figure.
12. **Every actor's "battle too long" block is dead code** (the guard is the one analysed in the Bahamut note, section 1.6).

## 0. How this was checked, and how to read the tables

- **Script against binary.** For all twelve actors, the set of command ids the source text issues (names resolved with the
  game's own `monmagic.ath` and `command.ath`) is identical to the set in the disassembly of the compiled action entry, and
  the set of `random() % n` moduli is identical (a script compared them). The control flow, constants and thresholds of
  every action entry were then read side by side; the reaction and death entries of Ixion, Baralai, Ormi, Logos and Leblanc
  were read too. The weapon, shield and gun props (`m139`, `m202` to `m205`, `m259`, `m265`) are empty in both forms.
- **Engine.** Call numbers of the script VM come from the previous lane's recovery of the exe's call table. This lane
  decompiled, in the older copy, `btlSetLinkCommand`, `btlSetDirectCommand`, `btlSearchChr`, the target filter, `btlGetReaction`
  with its guard, `btlCheckFriend`, the result-applying routine and its callers, the command queue's append and completion
  code, the target re-validation and its helpers, and the enemy stat copy at battle start, and compared 21 of them with the
  live build (all identical). The re-validation chain (1.12) was run on the live exe in the emulator with synthetic characters
  and the real `monmagic.bin` table (only the random generator and the two geometry providers are scripted); the
  target-search weights and the base formulas were run by the previous lane. Everything else was read, not run.
- **Confidence tags.** [H] source and binary agree and the engine part was read in both builds; [M] read from the code but not
  run, or partly inferred; [L] open.
- **Notation.** A "poll" is one call of a monster's action entry, a "step" one battle logic step, a "unit" one count of a gauge
  (95 units fall per step at Normal speed). "Girl" is a party member (Yuna slot 0, Rikku 1, Paine 2). "Slot 1 to 3" are the
  formation's monster slots. Numbers are written as the files have them. Seconds are shown as "at 30/s" and "at 60/s" because
  the PC logic rate is not settled (the previous note's section 0 gives the evidence, which favours 30/s).
- **Rows.** A command id is a row of `monmagic.bin` (4xxx) or `command.bin` (3xxx). Section 3.2 explains how to read the
  formula, class and damage-type columns.

## 1. Engine rules these scripts rely on (beyond the Bahamut and Vegnagun note)

### 1.1 Several commands in one poll form one batch [H for the code, M for the timing between records]

Every `setdircom` or `setlinkcom` a poll executes appends one record to the monster's queue (eight places). The monster stays
in the "command queued or executing" state while records are pending, so it is not polled again. When the last pending normal
record has finished, the queue code puts the gauge state back to idle and calls the completion routine **once**, which sets
the recovery from the `cost_atb` of the **last** record and then the thinking time ([re-ffx2-atb-status.md](re-ffx2-atb-status.md)
section 3.8). So several commands from one poll run in order as one turn, with one rest at the end, taken from the last
command. That the next record starts as soon as the previous one has finished was not traced; none of the batches here
depends on it (the Chain Attack rows and the three No Love Lost parts all have rest 0 and charge 0; Baralai's extra command
is an ordinary command with its own charge that runs before the second one).

`setlinkcom` (used only by Leblanc's No Love Lost) differs from `setdircom` in two ways: it skips the test that the monster
may issue a command at all, and the new record is chained to the record queued just before it in the same poll (the earlier
record's "next" pointer is set). The re-validation of targets walks these chains. That a chain executes as one unbroken action
was not traced [M].

### 1.2 What a reaction sees [H]

The reaction entry is run from inside the routine that applies a result to a character, after HP, MP and statuses are
applied: once per result, so once per hit per target. It also runs for results that change nothing: a physical attack that
misses reaches the same routine at its hit frame with an empty result (so does a "no effect" result), whereas the earlier
dodge-animation event does not apply a result and so does not reach it. The routine stores the **attacker's slot on the target**
(`chr_reaction`) before the entry runs. The guard `getreaction` is true unless the attacker is the monster itself or the
monster is stopped, asleep, petrified, confused, berserk or ejected. Poison and Regen ticks are applied with the same id
for attacker and target (the call passes the id twice), so they never pass the guard, but they **do overwrite `chr_reaction`
with the monster's own slot**. Results applied by the monster's allies pass the guard.

### 1.3 More on target searches [H]

The previous note covers `searchr` (near-weighted) and `searchr_nop` (uniform). Four more facts the scripts use:

- `max` and `min` keep **all candidates tied for the extreme value**; the pick among the ties then follows the macro (near-weighted
  for `searchr`, uniform for `searchr_nop`), and nothing is drawn when there is a single extreme.
- `not` keeps the candidates for whom the status test is **false**. An empty set gives 255 ("nothing").
- A search stores its candidate set as `chr_own_target`; the second half of the common pair (`searchr(all girls, alive, nop)` then
  `searchr(chr_own_target, stat, max or min)`) searches that set. The first search of such a pair still makes its
  weighted draw on stream 4 when two or more girls live, and the pick is thrown away.
- `stat_distance2d` is the ground-plane distance between the monster and each girl **minus the sum of the two body radii**, cut
  to a whole number.

"Alive" in these tests means "not flagged dead": a petrified girl is alive; a girl who has been blown away is not.

### 1.4 Thinking time and the first gauge [H]

The base for the thinking draw is 0 in play (the ATB note found that every battle-start call stores 0), so the monster
record's own thinking byte (30 for the two goons) is read by nothing here. A monster waits **30 steps for every girl who is
dead or petrified**, added to its recovery each time a command ends ([re-ffx2-atb-status.md](re-ffx2-atb-status.md) section
3.4). The first gauge is 25% to 74% of `70 x 10000 / (AGI + 1)` units, drawn once at battle start (section 6 gives the windows).
The tick of a monster whose special word has bit 1 set (Ormi, Logos, Leblanc, the shades and Ixion: words 0x183 and 0x3c3)
is **not** halved while it charges or is in hit reaction; the two goons (word 0x98) are, so a goon's charge takes twice as
long as the units suggest.

### 1.5 Death patterns and the death entry [H for the entries, M for the effect]

Acts I and II Ormi and Act II Logos use the "falls, cannot be raised" pattern plus a death command (row 0x4060, called Die in the
table): they leave the battle instead of lying down. Act III Ormi and Logos and Leblanc use the fade-out
pattern. The goons fade out. In Act III, the death entries of Ormi, Logos and Leblanc set the character's HP to 1 when
the battle flag `bf_keisuke00` is 1 (the No Love Lost window, 3.5); setting HP to a positive value clears the Death bit in the
applied status mask, so the character survives that death at 1 HP. Whether anything else in the kill path (the dead flag, the
rewards) is undone was not traced [L].

### 1.6 Monsters pay MP; no script gates a command on it except where stated [M]

The routine that pays a command's MP cost is not restricted to the party, so Thundara (12), Fira and the other "-ra" spells
(12), Fire and the other base spells (4), Regen (40), Not-So-Mighty Guard (10), White Wind (10), Silence (8), Greedy Aura (16)
and Lightfall (30) are paid from the caster's MP. The only MP tests in these scripts are Leblanc's Osmose gate (MP below 15),
Fem-Goon's (below 13), Baralai's (Absorb instead of Regen below 60, instead of Silence below 20). Leblanc starts with 460 MP,
Fem-Goon 270, Baralai 720, Gippal 235, Nooj 720, Ixion 9,999.

### 1.7 The "friend" getter [H, older copy only]

`checkfriend` returns a byte that battle setup raises by one for each of the three active party places whose character is a
Creature Create "friend" monster (ids 15 to 22). With the normal party of Yuna, Rikku and Paine it is 0, so every
`checkfriend == 0` test below is true. (It switches Ormi's Huggles to a plain Attack and switches Leblanc's No Love Lost off
when a friend monster is in the party; our game has none.)

### 1.8 The time-out block [H]

Every script starts its action entry with the block analysed in the Bahamut note, section 1.6: it counts actions only while the
party-alive count is 0 and, past 160/170/175/180 actions (Ormi, Logos, Leblanc), 180/190/195/200 (the shades, Ixion) or
85/90/95/100 (the goons), would cast four warning messages and a last move (a 12-hit Meteor on the party; for the goons a
Self-Destruct Flare). The guard is true only when no girl stands and
the ATB clock does not step in that state, so **the block never runs**. Its line ranges are not repeated in the tables.

### 1.9 Steal and Pilfer Gil setup [H]

Battle setup copies from the monster record: the Pilfer Gil figure (record bytes 0xa4), the item-steal chance byte (0xab), the
common and rare steal slots and the bribe slots. **The gil chance byte is set to 255 for every monster** (the exe's stat
copy writes 0xff there). With the formulas of [re-ffx2-hit-status.md](re-ffx2-hit-status.md) section 5: a steal attempt
succeeds when `draw % 255 < chance byte` (128 gives 50.2%, 192 gives 75.3%, 255 always), the rare slot is taken on 12.5% of
successes when it holds an item, and a success clears the chance (one steal per monster). Pilfer Gil always succeeds the first
time and pays `floor((draw % 101 + 100) x figure / 200)`, which is **50% to 100% of the record's figure (75% on average)**,
and is then spent.

### 1.10 The clock stands still while a command's effect plays [H]

While a command's effect sequence plays, every gauge, the charge countdown and the group-2 status clocks stand still, in
Active and in Wait mode, for the whole battle ([re-ffx2-atb-status.md](re-ffx2-atb-status.md) section 2). The length is the
animation's, which was not read. This is the whole of the game's "action time"; section 8 row E1 compares it with ours.

### 1.11 Formula glossary (own words; the bases are validated in the damage notes)

| Formula | Reading (v = the variance draw, 240 to 271 out of 256) |
|---|---|
| 0 | physical attacker formula with the target's DEF term, `E x power / 16 x v / 256` |
| 1 | the same without the DEF term |
| 2 / 3 | magic formula with / without the target's MDEF term |
| 4 | `power / 16` of the target's **current** HP (MP for class MP, both for class HP+MP) |
| 5 | fixed `power x 50` |
| 7 | `power / 16` of the target's **maximum** HP (or MP) |
| 8 | `power x 50 x v / 256` (a "constant" with the usual spread) |
| 15 | fixed `power` |

Damage-type bits of a row: P (physical only: Protect halves it, Sentinel/Defense cuts it to 1, a hit from behind doubles it), M
(magical only: Shell halves it), none (nothing reduces it). Accuracy: "never rolls", "byte N" (accuracy formula 1) or "ACC"
(formula 2, the attacker's ACC, 95 for every actor here). A target whose special word has bit 0 (the trio, the shades, Ixion)
takes **0** from formula 4 and formula 7 rows, whoever uses them.

### 1.12 When a target is gone before a command starts [H for the routine (run on the live exe), M for which commands reach it]

A queued command's target mask is re-validated when the command starts and again on each step before it begins to execute. A
member is invalid when it is dead, ejected, not in the battle or not targetable (a command that may target the dead keeps dead
members). The side is **not** checked: a mask naming the caster himself passes. The mask is rebuilt from the command's target
pool (the living targetable members of the opposing side) in two cases: **every** member is invalid (an **empty mask**
counts: it is what a script search that found nobody, value 255, produces), or **some** are, but then only at the start of
an instant command. The row's sequence class (its byte at +0xc) decides: classes 2 to 4, 21 to 28, 31 and several others
start a charge and are not repaired when only some targets are gone; class 1 (the plain Attacks, Chain Attack) and 37
(1H Pistol, Nooj's Attack) are instant. A rebuilt mask for a **multi-target** row (target flag bit 2) keeps all the living
members; for a **single-target** row (bits 2 and 3 clear, even with the 0x80 "can target all" bit set) it is the **one
nearest** by the weighted-pick cost `(1 + distance) x (1 + 2 x |angle|)`, ties to the lower slot, no random draw.

Run on the live exe with synthetic characters (caster at Ixion's start position): an Attack aimed at a dead Yuna goes to Rikku
(Rikku and Paine tie; with Yuna and Rikku dead, Paine); a party mask of three with one girl dead becomes one girl on a
single-target row and the two living on a multi-target row; an empty mask on a single-target row becomes the nearest living
girl; with all girls alive nothing changes; with none alive the mask is left alone. Consequences here: the elemental
spells and Silence that scripts aim at the whole party (Ixion's Thundara, Fem-Goon's four base spells, Baralai's Silence;
class 3) are charged, so they keep a dead girl in the mask and she is skipped when the hits land [M: the skip was not run];
Looming Glacier with no target and Drill Shot with a dead target are repaired to the nearest living girl before they execute;
a Drill Shot aimed at the caster himself stays aimed at him (4.2).

## 2. The fights, their slots and the records

| Fight | Scene, formation row | Slot 1 | Slot 2 | Slot 3 | Props (out of battle) |
|---|---|---|---|---|---|
| Act I, entrance | guad08_229, row 0951 | Ormi m243 | Fem-Goon m138 | Dr. Goon m135 | shield m265 (slot 5) |
| Act II, Logos' room | guad08_228, row 0952 | Ormi m244 | Logos m249 | - | shield m265 (slot 5) |
| Act III, Last Room | guad08_227, row 0953 | Ormi m245 | Logos m250 | Leblanc m253 | shield m265 (slot 5), weapon m139 (slot 7) |
| Baralai | kino13_227, row 1807 | Baralai m176 | - | - | staff m202 (5), guns m203 (9) |
| Gippal | kino13_226, row 1808 | Gippal m177 | - | - | grinder m204 (5), guns m205 (9) |
| Nooj | kino13_225, row 1809 | Nooj m258 | - | - | weapon m259 (5) |
| Ixion | djyt08_229, row 0840 | Ixion m166 | - | - | - |

The scripts address monsters by slot number (`chr_mon1` to `chr_mon3`), so the slot order above is load-bearing. The props
have the existence, in-battle and cursor flags off and empty scripts. Scene event, camera and position files are empty for all
of these scenes except Ixion's (players at (0, -27), (-12, -25), (12, -25); Ixion at (0, 26)).

**Records (`monster.bin`; the JP and US copies are identical).** ACC is 95 for every actor. Special words: 0x183 for the
trio, 0x3c3 for the shades and Ixion, 0x98 for the goons (bit 0 makes the character immune to percentage-HP formulas 4 and
7; bit 1 stops hit reactions slowing it, see 1.4). The table gives, per actor, the record values that replace the
authored numbers in our data:

| Actor (index) | Lv | HP | MP | STR | DEF | MAG | MDEF | AGI | EVA | LCK | Steal (chance byte) | Common / rare steal | Pilfer Gil | Drop (chance byte), item |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ormi, Act I (m243) | 19 | 1640 | 40 | 80 | 120 | 20 | 4 | 63 | 0 | 4 | 75.3% (192) | X-Potion / Elixir | 560 | 100% (255), Black Choker |
| Ormi, Act II (m244) | 19 | 1840 | 42 | 64 | 121 | 24 | 8 | 63 | 0 | 4 | 75.3% (192) | X-Potion / Elixir | 580 | 100% (255), Defense Veil |
| Ormi, Act III (m245) | 19 | 1344 | 45 | 53 | 84 | 26 | 16 | 42 | 0 | 4 | 75.3% (192) | X-Potion / Elixir | 600 | 100% (255), Twist Headband |
| Logos, Act II (m249) | 20 | 1432 | 64 | 16 | 4 | 26 | 14 | 90 | 38 | 10 | 75.3% (192) | Mega Potion / Elixir | 580 | 100% (255), Favorite Outfit |
| Logos, Act III (m250) | 21 | 989 | 70 | 17 | 4 | 28 | 18 | 49 | 40 | 10 | 75.3% (192) | Mega Potion / Elixir | 640 | 75.3% (192), Charm Bangle |
| Leblanc (m253) | 23 | 1380 | 460 | 33 | 10 | 32 | 62 | 53 | 22 | 16 | 75.3% (192) | Elixir / Elixir | 1500 | 100% (255), Reassembled Sphere |
| Dr. Goon (m135) | 14 | 232 | 41 | 35 | 6 | 10 | 6 | 56 | 0 | 3 | 100% (255) | Budget Grenade / Grenade | 160 | 50.2% (128), Potion / Grenade |
| Fem-Goon (m138) | 16 | 167 | 270 | 26 | 5 | 8 | 10 | 62 | 0 | 4 | 100% (255) | Potion / Potion x2 | 200 | 50.2% (128), Potion / Hi-Potion |
| Baralai (m176) | 52 | 12220 | 720 | 68 | 67 | 67 | 26 | 112 | 12 | 6 | 50.2% (128) | Nature's Lore (both) | 300 | 100% (255), Crystal Ball |
| Gippal (m177) | 56 | 14800 | 235 | 73 | 68 | 55 | 33 | 118 | 23 | 6 | 50.2% (128) | White Lore (both) | 15000 | 100% (255), Kaiser Knuckles |
| Nooj (m258) | 63 | 23800 | 720 | 75 | 144 | 101 | 103 | 121 | 0 | 8 | 50.2% (128) | Arcane Lore (both) | 20000 | 100% (255), Magical Dances Vol. I |
| Ixion (m166) | 28 | 12380 | 9999 | 62 | 106 | 21 | 82 | 138 | 35 | 4 | 50.2% (128) | Sprint Shoes (both) | 3000 | 100% (255), Soul of Thamasa |

Resist bytes (255 = immune). The shades and Ixion are immune to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion,
Berserk, Curse and Eject, and to Stop and Doom; the shades are also immune to Slow, Ixion is not. The trio is immune to
Death, Petrify, Silence, Confusion, Berserk, Curse, Eject, Stop and Doom, takes Darkness at 0 resist, and resists Poison by 10
(Ormi Act I), 20 (Ormi Act II), 30 (Ormi Act III), 40 (both Logos) and 100 (Leblanc); **Ormi Act II and Logos Act II also have
Sleep 0 (not immune)**. Leblanc is further immune to the stage bytes 7, 9 and 11 (STR, DEF and ACC in the engine's order; the
research files call the third one Luck). All of the trio, the shades and Ixion null Gravity; Ixion absorbs Lightning and is
weak to Water. Both goons are immune only to Curse; their bribe slots hold S-Bomb x4 and M-Bomb x4; the others have no bribe
slot. The Zantetsu byte is 50 (Ormi, Logos), 60 (Leblanc), 160 (Baralai, Gippal), 200 (Nooj), 80 (Ixion), 0 (goons).

## 3. The Leblanc Syndicate (scenes guad08_227 to 229)

### 3.1 Targets and random sources used below

`near` = `searchr` (near-weighted, stream 4); `uniform` = `searchr_nop` (stream 4); `% n` = `random() % n` (stream 2). A line
that names two searches means the pair of 1.3 (one discarded weighted draw when two or more girls live).

### 3.2 Rows the scripts call [H]

| Row | Name | Class, formula, power, hits | Accuracy | Bits | Rest / charge cost | Notes |
|---|---|---|---|---|---|---|
| 0x41da | Attack | HP, f0, 16, 1 | ACC | P, can crit (fixed 5%) | 100 / 0 | shatter byte 10; goons use row 0x4000, the same numbers |
| 0x40e5 | Supercollider | HP, f4, 8, 1 | never rolls | P, fixed 0% crit, Delay weak | 0 / 180 | 8/16 = 50% of the girl's **current** HP; Protect halves it; shatter 100 |
| 0x40e6 | Huggles | HP, f8, 6, 3 hits | never rolls | none, Delay strong | 100 / 60 | about 281 to 317 per hit before the chain, nothing reduces it; shatter 100 |
| 0x40fb | Concussive Blast | HP, f8, 6, 1 | never rolls | none | 0 / 80 | all party, about 281 to 317 each |
| 0x40e7 | 1H Pistol (Double Shot) | HP, f0, 8, 2 hits | byte 140 | P, can crit (fixed 20%) | 40 / 0 | single target |
| 0x40e8 | Hail of Bullets | HP, f0, 8, 3 hits | never rolls | P | 0 / 120 | all party, three hits on each; shatter 100 |
| 0x40e9, 0x40ea, 0x40eb, 0x40ee, 0x40ef | Russian Roulette (5 rows) | HP, f0, 8, 1 | never rolls | none | 150 / 100 | status chance: Death 30, Curse 100, **group-1 slot 3** 100, Petrify 30, Poison 100; shatter 100 |
| 0x40f0 | Russian Roulette (blank) | HP, f15, 1, 1 | never rolls | none | 150 / 100 | never selected by either script |
| 0x40f6 | No Love Lost, part 1 | HP, f1, 5, 8 hits | never rolls | none, random target per hit | 0 / 0 | caster is Leblanc: about 21 to 24 per hit |
| 0x40f7 | No Love Lost, part 2 | HP, f1, 22, 1 | never rolls | none | 0 / 0 | all party; about 94 to 106 each |
| 0x40f8 | No Love Lost, part 3 | HP, f4, 6, 1 | never rolls | none | 0 / 0 | 6/16 = 3/8 of one girl's **current** HP |
| 0x4086 | Not-So-Mighty Guard | none, f2, 0 | never rolls | M | 80 / 120, MP 10 | Shell 254/126, Protect 254/126, Regen 254/50 (chance/counts); allies |
| 0x4087 | White Wind | HP, f7, 2 | never rolls | none, heal, cleanse | 80 / 120, MP 10 | 2/16 of **max** HP to every ally; removes Sleep, Silence, Darkness, Poison, Confusion, Berserk |
| 0x40f5 | Love Tap | none | never rolls | none | 100 / 0 | Haste, chance 255, 40 counts, on one ally |
| 0x406d | Osmose | MP, f4, 3 | never rolls | none, absorbs | 0 / 90 | takes 3/16 of the girl's **current** MP for Leblanc |
| 0x41ed, 0x41ef, 0x41ee, 0x41f0 | Fira, Thundara, Blizzara, Watera | HP, f2, 12 | never rolls | M, reflectable | 0 / 70, MP 12 | shatter 20 |
| 0x41e9, 0x41eb, 0x41ea, 0x41ec | Fire, Thunder, Blizzard, Water (goons) | HP, f2, 7 | never rolls | M, reflectable | 0 / 70, MP 4 | shatter 20 |
| 0x40fd, 0x40fe | Flash Bomb, Hush Grenade | HP, f8, 1 | never rolls | none | 0 / 80 | about 46 to 52, plus Darkness / Silence chance 50 |
| 0x40f4 | Mach Fan | HP, f0, 24, 1 | never rolls | none, Delay weak | 0 / 140 | formula 0: uses her STR and **the girls' DEF**; all party |

Rows that scripts aim at the whole party (Thundara and the goons' base spells, Mach Fan, the grenades, Concussive Blast, Hail of
Bullets, two parts of No Love Lost) get the party mask, and a script never sets the "all targets chosen" byte, so none of the
multi-target halving applies to them.

### 3.3 Ormi (m243 Act I, m244 Act II, m245 Act III) [H]

One counter (`mf_turn`) counts the polls that reach it. "An ally" means a living monster in the slot named.

**Act I** (`m243.src`; slot 2 is Fem-Goon, slot 3 is Dr. Goon):

| # | Condition (in order) | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | time-out block (1.8) | never runs | | 61-95 |
| 1 | counter +1 every poll | | | 97 |
| 2 | slot 2 alive, counter 1 to 3 | Attack on a living girl | near | 98-104 |
| 3 | slot 2 alive, counter 4 | counter 0; Supercollider on the girl farthest from Ormi | max distance, ties near | 105-110 |
| 4 | slot 2 dead, slot 3 alive | the same two rows | | 114-127 |
| 5 | both dead, `% 4 = 0`, no friend monster | Huggles on the girl with the highest current MP | 25%, near then max | 130-138 |
| 6 | both dead, `% 4 = 0`, a friend monster | Attack | | 139-143 |
| 7 | both dead, `% 4 = 1` | Supercollider on the farthest girl | 25% | 147-151 |
| 8 | both dead, `% 4` = 2 or 3 | Attack | 50%, near | 152-156 |

Death entry (175-180): the flee command 0x4060 (named Die in the table) when a death reaction is allowed, so he leaves instead of
lying down.

**Act II** (`m244.src`; slot 2 is Logos): the same, with "Logos alive" in place of the two goon tests (98-111) and the same
alone table (112-142: Huggles on the highest-MP girl, Supercollider on the farthest, Attack); death entry 158-163 flees.

**Act III** (`m245.src`; slot 3 is Leblanc, slot 2 is Logos):

| # | Condition (in order) | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | time-out block | never runs | | 61-95 |
| 1 | HP below `max / 4` (1344 / 4 = 336, so 335 or less) and `% 4 = 0` | Concussive Blast on all party; **the poll ends** (the counter is not advanced) | 25% per poll | 98-105 |
| 1b | HP below `max / 4` and `% 4` is not 0 | go on | 75% | 106-114 |
| 2 | counter +1 | | | 116 |
| 3 | slot 3 (Leblanc) alive: counter 1 to 3 | Attack | near | 118-124 |
| 4 | slot 3 alive: counter 4 | counter 0; Supercollider on the farthest girl | | 125-130 |
| 5 | slot 3 dead, slot 2 (Logos) alive | the same two rows | | 134-147 |
| 6 | both dead, `% 4 = 0`, no friend monster | Huggles on the girl with the highest current **HP** | 25%, near then max | 150-158 |
| 7 | both dead, `% 4 = 1` | Supercollider on the farthest girl | 25% | 168-172 |
| 8 | both dead, `% 4` = 2 or 3 | Attack | 50%, near | 173-177 |

Death entry (196-207): HP set to 1 while the combo flag is 1; the fade-out pattern. The HP test comes first, so a dying Ormi
who is alone still rolls the Blast before his own 25/25/50 table. His cycle is therefore Attack, Attack, Attack, Supercollider
for as long as Leblanc or Logos stands (pace: section 6).

### 3.4 Logos (m249 Act II, m250 Act III) [H]

A counter (`mf_turn`) counts every poll; every pick is `uniform` among living girls.

**Act II** (`m249.src`):

| # | Condition | Action | Chance | Source |
|---|---|---|---|---|
| 0 | time-out block | never runs | | 42-76 |
| 1 | counter +1 = 1 to 3 | 1H Pistol (two hits) | | 79-85 |
| 2 | counter 4 | counter 0; `% 5` picks one Roulette row on a living girl: 0 Death 30, 1 Curse 100, 2 the slot-3 row (Silence) 100, 3 Petrify 30, 4 Poison 100 | 1/5 each | 86-122 |

The blank sixth row is the `default` case of that switch and is unreachable. Death entry (138-143) flees.

**Act III** (`m250.src`):

| # | Condition | Action | Chance | Source |
|---|---|---|---|---|
| 0 | time-out block | never runs | | 42-76 |
| 1 | counter +1 = 1 to 5, `% 4 = 0` | Hail of Bullets on all party | 25% | 80-86 |
| 2 | counter 1 to 5, otherwise | 1H Pistol on a living girl | 75% | 87-91 |
| 3 | counter 6 | counter 0; one of the five Roulette rows on a living girl (as above) | 1/5 each | 93-129 |

Death entry (145-157): HP set to 1 while the combo flag is 1. The "Slow" in the script's own name for the third Roulette row is a stale
label: the row's status byte is group-1 slot 3, the slot Silence and Hush Grenade use, so the row inflicts Silence at
chance 100 [M: the engine's status order was read, the effect was not seen in play].

### 3.5 Leblanc (m253, Act III) [H]

Four variables matter: the trio counter (starts at 5), the combo flag `bf_keisuke00` (a battle-local variable; assumed 0 at the start, as in the previous note), the
Guard counter (starts at 0) and the cycle position (starts at 0). The first poll makes the trio counter 6.

| # | Condition (in order) | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | time-out block | never runs | | 70-104 |
| 1 | trio counter +1 | | | 106 |
| 2 | counter at least 8 **and** no friend monster, flag = 1 (the poll after a No Love Lost) | flag 0, counter 0; the invincibility of slots 1, 2 and 3 (Ormi, Logos, herself) off; AGI back to 53; **the poll ends with no command** (she stays ready and is polled again on the next step) | | 107-118 |
| 3 | counter at least 8, no friend monster, flag = 0, slot 1 alive and slot 2 alive | flag 1; AGI set to 254; slots 1 and 2 invincible; **three linked commands**: No Love Lost part 1 on all party (8 hits on random living girls), part 2 on all party, part 3 on one living girl; the poll ends | part 3 target uniform | 119-134 |
| 4 | counter at least 8 but Ormi or Logos dead | nothing here; fall through (the counter stays at 8 or more, so the test repeats every poll and No Love Lost never returns) | | 135-145 |
| 5 | Guard counter = 0 | counter 1; Not-So-Mighty Guard on **all monsters** | | 151-155 |
| 6 | else Guard counter +1; it is now 25 | counter 26; Not-So-Mighty Guard on all monsters (the only other cast; the counter never equals 25 again) | | 156-163 |
| 7 | cycle position 0 | position 1; Attack on a living girl | near | 166-171 |
| 8 | position 1 | position 2; MP below 15: Osmose on a living girl; otherwise `% 4` picks Fira, Thundara, Blizzara or Watera on a living girl | 1/4 each, uniform | 174-213 |
| 9 | position 2 | position 3; coin flip (`% 2`) picks Ormi (slot 1) or Logos (slot 2): that one alive: Love Tap on it; dead: White Wind on all monsters | 50/50 | 216-242 |
| 10 | position 3 | position 4; Attack on a living girl | near | 245-250 |
| 11 | position 4 | position 0; `% 5`: 0 Flash Bomb, 1 Hush Grenade, 2 to 4 Mach Fan, all on the party | 20 / 20 / 60% | 251-270 |

**What this makes in play, with Ormi and Logos alive and no repeated rolls shown** (MG = Not-So-Mighty Guard, A = Attack,
S = spell or Osmose, L = Love Tap or White Wind, M = Mach Fan or a grenade, N = No Love Lost, - = the clean-up poll that issues
nothing): `MG A N - S L A M A S L N - A M A S L A M N - A S L A M A S N - L MG A M A S L N - ...`. Commands 3, 11, 19, 27, 35 ...
are No Love Losts; the second Not-So-Mighty Guard is command 29 (25 ordinary turns plus the four No Love Losts before it). The
No Love Lost never takes the place of a cycle step, so the cycle phase at each No Love Lost drifts.

**Death entry (291-306):** if the flag is 1 her HP is set to 1; the flag is cleared and slots 1 and 2 lose their invincibility.

Details of the combo [L]: Leblanc's AGI of 254 changes no gauge arithmetic (every part has rest 0 and charge 0, and her AGI is
back to 53 before her next command), so it is probably about animation speed. The invincibility of Ormi and Logos zeroes
every damage result they receive during the window; the HP-to-1 death hooks cover results that bypass it. The three parts are
computed from **Leblanc's** stats (STR 33, Lv 23): formula 1 gives `74 x 5 / 16 = 23` and `74 x 22 / 16 = 101` before the
variance, which spread to about 21 to 24 and 94 to 106; the published bands (22 to 25 and 99 to 112) imply a base about 4% to
5% higher than the record gives.

### 3.6 Dr. Goon (m135) and Fem-Goon (m138), Act I [H]

**Dr. Goon**: every poll, Attack (row 0x4000) on a living girl, `near` (76-77). Nothing else.

**Fem-Goon** (`m138.src`):

| # | Condition | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | time-out block | never runs | | 40-74 |
| 1 | `% 4 = 0` | Attack on a living, **unpetrified** girl | 25%, near | 76-81 |
| 2 | MP below 13 | Attack on a living unpetrified girl; the poll ends | near | 85-90 |
| 3 | Yuna, Rikku and Paine are **all** below half their max HP (a KO'd girl counts as below) | the living girl with the lowest current HP (ties near): Fira, Thundara, Watera or Blizzara (`% 4`, 1/4 each); the poll ends | | 96-142 |
| 4 | otherwise `% 2 = 0` | a uniform living girl: Fira, Thundara, Watera or Blizzara (1/4 each) | 37.5% overall | 144-171 |
| 5 | otherwise | all party: Fire, Thunder, Water or Blizzard (1/4 each) | 37.5% overall | 172-199 |

Overall (MP at least 13, not all three girls below half): 25% Attack, 37.5% one single-target spell, 37.5% one party-wide base
spell. Both goons fade out at death and have no other entries.

## 4. The Den of Woe shades (scenes kino13_225 to 227)

### 4.1 Rows the scripts call [H]

| Row | Name | Class, formula, power, hits | Accuracy | Bits | Rest / charge cost | Notes |
|---|---|---|---|---|---|---|
| 0x41da | Attack (Baralai, Gippal) | HP, f0, 16, 1 | ACC | P, crit 5% | 100 / 0 | as 3.2 |
| 0x41e8 | Attack (Nooj) | HP, f0, 16, 1 | byte 95 | P, crit 10% | 100 / 0 | |
| 0x4100 | Chain Attack | HP, f0, 12, 1 | never rolls | P | 0 / 0 | the unit of the Triple Attack |
| 0x4101 | Glint | HP, f0, 20, 1 | never rolls | P | 0 / 200 | all party; any reach limit would be in the effect data, not read |
| 0x4102 | Looming Glacier | **MP**, f7, 16 | never rolls | none | 0 / 140 | 16/16 of the girl's max MP (her MP to 0), plus Stop (chance 254, 126 counts) |
| 0x4103 | Drill Shot | HP, f7, 12 | never rolls | P | 0 / 100 | 12/16 = 3/4 of the girl's **max** HP; Protect halves it |
| 0x4071 | Silence | none | never rolls | none, reflectable | 60 / 60, MP 8 | Silence chance 75, all party |
| 0x4040 | Absorb | HP+MP, f4, 3 | never rolls | none, absorbs | 40 / 100 | 3/16 of the girl's **current** HP and MP into Baralai |
| 0x30b6 | Regen | none | never rolls | M, reflectable | 0 / 60, MP 40 | Regen chance 254, 50 counts, on himself |
| 0x4086 | Not-So-Mighty Guard | as 3.2 | | | 80 / 120, MP 10 | on himself only (the script aims it at `chr_own`) |
| 0x4112 | Mortar | HP, f1, 22 | never rolls | P | 0 / 120 | all party |
| 0x4113 | Grinder | HP, f1, 14 | never rolls | P, can crit (luck based) | 0 / 120 | single target |
| 0x4114 | Bullseye | HP, f4, 9 | never rolls | none | 0 / 120 | 9/16 = 56.25% of each girl's **current** HP, all party |
| 0x4104 | Potion Plus | HP, f5, 12, heal | never rolls | none | 0 / 100 | 600 HP to himself |
| 0x40fd, 0x40fe | Flash Bomb, Hush Grenade | as 3.2 | | | 0 / 80 | |
| 0x4115 | Rippling Chroma | HP, f3, 20 | never rolls | M | 0 / 120 | magic without MDEF, single target |
| 0x4116 | Greedy Aura | HP+MP, f7, 3 | never rolls | none | 0 / 120, MP 16 | 3/16 of every girl's **max** HP and MP; no absorb flag |
| 0x4117 | Lightfall | HP, f5, 100 | never rolls | none | 0 / 160, MP 30 | 5,000 to each girl |

### 4.2 Baralai (m176) [H]

Variables: the cycle counter and the burst counter (the reaction's), both 0 at the start. Target picks are `near` unless marked.

| # | Condition (in order) | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | time-out block | never runs | | 64-98 |
| 1 | HP below `max / 3` (12220 / 3 = 4073, so 4,072 or less), `% 4 = 0` | **queue** one of: no monster lacks Reflect (that is, he has Reflect) -> Not-So-Mighty Guard on himself; else MP below 60 -> Absorb on the living girl with the highest current MP (uniform ties); else Regen on himself. **The poll goes on to rows 2 and 3**, so a second command is queued | 25% per poll | 100-124 |
| 2 | burst counter at least 8, the last attacker alive | counter 0; Drill Shot on the last attacker; **no cycle step this poll** (the cycle counter is not advanced) | | 126-132 |
| 2b | burst counter at least 8, the last attacker dead or gone | counter 0; Drill Shot on a living girl (`near`) | | 133-138 |
| 3 | otherwise cycle counter +1, then by value: | | | 140-242 |
| | 1 | Attack on a living girl | near | 152-155 |
| | 2 | Glint on all party | | 157-159 |
| | 3 | one living girl: Attack on her. Two or three living: **three Chain Attacks, one command each**, targets by the order below | | 161-218 |
| | 4 | Looming Glacier on the girl with the highest current MP among the girls **not in Stop** (ties near); if every living girl is in Stop the target is "nothing", which the engine turns into the nearest living girl when the command starts (1.12) | | 220-224 |
| | 5 (and then the counter goes to 0) | MP below 20: Absorb on the highest-MP living girl (a `uniform` tie-break); otherwise Silence on all party | | 226-239 |
| | 0 | never reached (the counter is incremented before the test) | | 147-150 |

**Triple Attack order (rows 161-218).** The three strikes are queued in this order and each falls back as shown:
strike 1 on Yuna, else Paine, else Rikku; strike 2 on Rikku, else Paine, else Yuna; strike 3 on Paine, else Yuna, else
Rikku. With all three alive that is one strike each, Yuna, Rikku, Paine; with Yuna down: Paine, Rikku, Paine; with Rikku down:
Yuna, Paine, Paine; with Paine down: Yuna, Rikku, Yuna. The three commands have rest 0 and charge 0.

**Reaction (246-253).** If `getreaction` holds, the burst counter gains 1: once per result applied to him by anyone but himself,
hit, miss or no effect, once per hit (1.2). Poison or Regen ticks do not count. The counter is only read on his next poll,
and Drill Shot resets it to 0 (hits beyond the eighth are lost). The target is the attacker slot of the **latest** result, not
of the eighth. If his own Regen tick was the latest result, the slot is his own and the Drill Shot is aimed at himself: the
re-validation leaves a self target alone (1.12, run on the live exe) and the damage routine gives formula-7 damage on a target
with the "immune to percentage-HP formulas" bit, which Baralai has, as 0, so that turn does nothing [M: the damage step was
read, not run]. Death entry: empty.

**Pace.** First poll in 16 to 48 steps; then a poll every (charge + animation + rest) of the last command: Glint 186 steps
of charge with no rest, Looming Glacier 130, Silence 56 + 56, Attack 93 of rest, Chain Attack 0, Drill Shot 93 (section 6).

### 4.3 Gippal (m177) [H]

`mf_turn` is the cycle counter; the targets are `uniform` except where marked.

| # | Condition (in order) | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | time-out block | never runs | | 61-95 |
| 1 | HP below `max / 3` (14800 / 3 = 4933, so 4,932 or less), `% 5 = 4` | `% 3`: Flash Bomb, Hush Grenade or Potion Plus (1/3 each) | 1/5 then 1/3: 1/15 each | 99-117 |
| 2 | HP below `max / 3`, `% 5` = 0 | Bullseye on all party | 1/5 | 122-124 |
| 3 | | `% 5` = 1: Grinder on a uniform living girl | 1/5 | 126-129 |
| 4 | | `% 5` = 2: Attack on the **living girl with the lowest current HP** (ties near; the pair of 1.3) | 1/5 | 131-135 |
| 5 | | `% 5` = 3: Mortar on all party | 1/5 | 137-140 |
| 6 | HP at or above the line, `% 16 = 0` | `% 2`: Flash Bomb or Hush Grenade (1/32 each); the cycle counter does **not** advance | 1/16 | 145-157 |
| 7 | otherwise cycle counter +1: | | 15/16 | 158-195 |
| | 1, 3 | Grinder on a uniform living girl | | 161-166, 175-179 |
| | 2, 4 | Attack on a uniform living girl | | 168-172, 182-186 |
| | 5 (counter back to 0) | Bullseye on all party | | 187-191 |

No reaction, menu or death code. The counter keeps its value across the two HP regimes (only the cycle branch touches it).
Pace: Attack has rest 88, every other move rest 0 with charge 71 to 106 steps (section 6).

### 4.4 Nooj (m258) [H]

`mf_turn` is the cycle counter; every target is `uniform`.

| # | Condition (in order) | Action | Chance | Source |
|---|---|---|---|---|
| 0 | time-out block | never runs | | 60-94 |
| 1 | HP below 3,000 (2,999 or less) and the Lightfall flag is clear | flag set; Lightfall on all party; the cycle counter is not advanced | once per fight | 96-103 |
| 2 | otherwise, by cycle counter 0, 1, 2, 3, 4 (then 0) | Attack, Attack, Rippling Chroma on one girl, Attack, Greedy Aura on all party | | 105-143 and 145-185 (two copies, identical) |

No reaction, menu or death code. The two copies of the cycle are the same table; Lightfall simply interrupts it once, when
his HP first goes under 3,000. Pace: Attack rest 86; Rippling Chroma and Greedy Aura charge 104 steps with no rest; Lightfall
charge 138.

## 5. Ixion at Djose (m166, scene djyt08_229) [H]

Variables: the counter (`mf_limitGage`, called AC in our research), the energy flag, the cycle counter. All start at 0.

| # | Condition (in order) | Action | Chance / RNG | Source |
|---|---|---|---|---|
| 0 | time-out block | never runs | | 47-81 |
| 1 | AC at least 100, energy flag 0 | energy flag 1; **Recharge** on himself | | 85-89 |
| 2 | AC at least 100, energy flag 1 | energy flag 0, **AC = 0**; **Thor's Hammer** on all party | | 90-95 |
| 3 | AC below 100: cycle counter +1; the counter reaches 3 | counter 0; AC +10; **Aerospark** on a living girl | near | 100-106 |
| 4 | counter 1 or 2 | AC +5; `% 4 = 0`: Thundara on all party; else Attack on a living girl | 25 / 75%, near | 107-120 |

The test of AC comes first on every poll and uses the value before this poll's own increase. **The cycle counter is not touched by
rows 1 and 2**, so after Thor's Hammer the cycle carries on from where it was: with no hits taken AC reaches 100 right after an
Aerospark (the counter is 0), but with hits it can come mid-cycle and the cycle then resumes at the step that was next.

**Reaction (125-132):** if `getreaction` holds, AC gains 5, for every result applied to him by anyone but himself, hit, miss or
no effect, once per hit (1.2): a two-hit move adds 10, a three-hit move 15. A girl's Steal and status moves count as results;
his own Recharge (attacker = himself) and any tick do not; neither do the Recharge and Thor's Hammer rows add to AC. Hits taken
**after** the Hammer's poll count towards the next cycle (AC was reset at the poll); hits taken between Recharge and
Hammer are lost with the reset.

**Timeline with no hits at all** (as in the research): AC after polls 3, 6, 9, 12 and 15 is 20, 40, 60, 80 and 100; the 16th poll
is Recharge and the 17th Thor's Hammer. In general AC after `n` polls with `r` results received is `5 n + 5 floor(n / 3) +
5 r` (when no Recharge or Hammer has intervened), and the next poll is Recharge once it is 100 or more.

Death entry (142-149): the "Die" command 0x40af when a death reaction is allowed. Initial setup (29-37) sets the death pattern and
two motion flags only; nothing changes a stat.

**Rows (shared with 3.2 where listed):** Attack 0x41da (power 16, ACC 95, rest 100); Thundara 0x41ef (HP, f2, power 12, M,
reflectable, charge 70, MP 12, all party by mask, **not** halved); Aerospark 0x4096 (HP, f4, 10, **no damage-type bit**, rest 80,
charge 100): **10/16 = 62.5% of the girl's current HP**, which Shell and Protect do not touch; Recharge 0x4098 (HP+MP, f5,
power 4, heal, rest 100, charge 120): 200 HP and 200 MP, no variance, on himself; Thor's Hammer 0x4097 (HP, f2, power 30,
M, rest 100, charge 120): magic on all party, **no element byte** (so Lightning absorbers do nothing), never rolls to hit.
"MP recharge" is therefore the flavour of the telegraph: his MP is 9,999 and no branch reads it.

**Targets.** Attack and Aerospark are `near`. Illustration only, from the start positions (Ixion at (0, 26), the girls at (0, -27),
(-12, -25), (12, -25) for slots 0, 1, 2) and the model of the previous note: facing the party, the odds are about 41.9, 29.1 and
29.0 percent for slots 0, 1, 2; facing away, about 32, 34 and 34. Positions and facing at each poll decide the real odds.

## 6. Cadence reference (units from the rows; steps at Normal speed, no Haste or Slow)

Recovery = `cost_atb x 10000 / (AGI + 1)`, charge = `cost_cast x 10000 / (AGI + 1)`; 95 units fall per step; divide steps by 30
or by 60 for seconds (the rate is unsettled). A goon's charge takes twice the steps shown (1.4). The thinking wait of 1.4
(30 steps per fallen girl) is added after every command.

| Actor (AGI) | Move | Charge units (steps) | Rest units (steps) |
|---|---|---|---|
| Ixion (138) | Attack | 0 | 7,194 (76) |
| | Thundara | 5,035 (53) | 0 |
| | Aerospark | 7,194 (76) | 5,755 (61) |
| | Recharge, Thor's Hammer | 8,633 (91) | 7,194 (76) |
| Baralai (112) | Attack | 0 | 8,849 (93) |
| | Glint | 17,699 (186) | 0 |
| | Chain Attack (each of three) | 0 | 0 |
| | Looming Glacier | 12,389 (130) | 0 |
| | Silence | 5,309 (56) | 5,309 (56) |
| | Absorb | 8,849 (93) | 3,539 (37) |
| | Regen | 5,309 (56) | 0 |
| | Not-So-Mighty Guard | 10,619 (112) | 7,079 (75) |
| | Drill Shot | 8,849 (93) | 0 |
| Gippal (118) | Attack | 0 | 8,403 (88) |
| | Grinder, Bullseye, Mortar | 10,084 (106) | 0 |
| | Flash Bomb, Hush Grenade | 6,722 (71) | 0 |
| | Potion Plus | 8,403 (88) | 0 |
| Nooj (121) | Attack | 0 | 8,196 (86) |
| | Rippling Chroma, Greedy Aura | 9,836 (104) | 0 |
| | Lightfall | 13,114 (138) | 0 |
| Ormi, Acts I and II (63) | Attack | 0 | 15,625 (164) |
| | Supercollider | 28,125 (296) | 0 |
| | Huggles | 9,375 (99) | 15,625 (164) |
| Ormi, Act III (42) | Attack | 0 | 23,255 (245) |
| | Supercollider | 41,860 (441) | 0 |
| | Huggles | 13,953 (147) | 23,255 (245) |
| | Concussive Blast | 18,604 (196) | 0 |
| Logos, Act II (90) | 1H Pistol | 0 | 4,395 (46) |
| | Russian Roulette | 10,989 (116) | 16,483 (174) |
| Logos, Act III (49) | 1H Pistol | 0 | 8,000 (84) |
| | Hail of Bullets | 24,000 (253) | 0 |
| | Russian Roulette | 20,000 (211) | 30,000 (316) |
| Leblanc (53; 254 during No Love Lost) | Attack, Love Tap | 0 | 18,518 (195) |
| | Fira, Thundara, Blizzara, Watera | 12,962 (136) | 0 |
| | Osmose | 16,666 (175) | 0 |
| | Not-So-Mighty Guard, White Wind | 22,222 (234) | 14,814 (156) |
| | Mach Fan | 25,925 (273) | 0 |
| | Flash Bomb, Hush Grenade | 14,814 (156) | 0 |
| | No Love Lost (each of three) | 0 | 0 |
| Dr. Goon (56) | Attack | 0 | 17,543 (185) |
| Fem-Goon (62) | Attack | 0 | 15,873 (167) |
| | any of the eight spells | 11,111 (117, so about 234 with the goon's halved tick) | 0 |

**First polls.** The first gauge runs 25% to 74% of `70 x 10000 / (AGI + 1)` units: Ixion 1,258 to 3,736 units (13 to 39
steps), Baralai 16 to 48, Gippal 16 to 46, Nooj 15 to 45, Ormi 29 to 85 (Acts I and II) or 43 to 127 (Act III), Logos 20 to 60
(Act II) or 37 to 109 (Act III), Leblanc 34 to 101, Dr. Goon 32 to 96, Fem-Goon 29 to 87. Delay (Supercollider and Mach
Fan weak, Huggles strong) pushes a girl's gauge back by 4,000 or 8,000 units (42 or 84 steps) per application; whether each of
Huggles' three hits applies it was not traced [M].

## 7. Open items, and what could not be decoded

- **Drill Shot at himself** [M]: when the last result on Baralai was his own Regen tick, the Drill Shot is aimed at him (kept by the
  re-validation, run on the live exe) and should do nothing because of his percentage-formula immunity bit; the damage step was
  read, not run.
- **Which commands take the partial re-aim of 1.12** [M]: read from the class switch of the command-start routine (classes 2 to 4,
  21 to 28 and 31 charge and are exempt; 1 and 37 are instant); the small adjustments the routine makes for flagged characters
  were not applied, and the charged path was not run end to end.
- **Whether the queued commands of one poll run without a gap** [M] and whether a linked chain is one unbroken action [M].
- **Purpose of Leblanc's AGI 254** during No Love Lost [L]; the HP-to-1 death hooks and the invincibility are described, their
  edge cases are not.
- **The third Roulette row** [M]: labelled Slow by the script, built as group-1 slot 3 (Silence).
- **Animation lengths, effect reach (the arcs of Bullseye and Mortar, the 5 m of Glint), and the length of "action time"** [L]: not
  in the scripts; the freeze itself is read (1.10).
- **Logic rate** [L]: 30 or 60 steps per second.
- **Near-weighted odds in practice** [L]: positions and facing at each poll; only Ixion's start positions are known.
- **Per-hit application of Delay for Huggles** [M].
- Dialogue, camera and message text were not extracted, and the scripts contain none of the speech that the Vegnagun fight has.

## 8. Differences from our AI

Row key: *game* = this note (source file and lines); *ours* = file:line in `src/`. A bare `:line` is in `src/battle/ffx2/ai/leblanc-syndicate.ts` for rows O, L, G1 and K, in `ai/den-of-woe.ts` for rows D and in `ai/ixion.ts` for rows I; data files are named in full (`src/data/ffx2/enemies/`).

| # | Rule | Game (source) | Ours | Effect |
|---|---|---|---|---|
| O1 | Concussive Blast | Act III only, a 25% roll on each poll below `max / 4`, and the poll ends (m245.src:98-114) | always, every poll below 25% (`ai/leblanc-syndicate.ts:120-122`), and in Acts I and II too (their records copy Act III's ability list and script, `leblanc-syndicate-acts.ts:40-66,69-78`; Acts I and II have no such branch) | a dying Ormi blasts every turn in ours; the game blasts a quarter of his polls and never in Acts I and II |
| O2 | Huggles target | the girl with the highest current MP (Acts I and II, m243.src:130-137, m244.src:114-121) or HP (Act III, m245.src:150-157) | a random girl (`:132`, `randomPartyTarget` 67-70) | the game aims the fight's strongest hit at the best-stocked girl |
| O3 | Supercollider target | the girl farthest from Ormi (ground distance minus radii, m243.src:105-110, m245.src:125-130) | the highest formation slot (`:43,73-79,130,137`; owner-approved stand-in) | positional rule stays unhonoured; ours is a fixed girl |
| O4 | Ormi's Attack target | near-weighted (m243.src:102) | uniform (`:127,139`) | central/closest girl is hit more in the game |
| O5 | Ormi's cycle counter | an own counter that moves only on polls that reach it (the Blast poll ends before it, m245.src:116) | the turn number (`:82-86,135`), so a Blast turn shifts the cycle | cycle phase after a Blast differs |
| O6 | Ormi's "alone" test | slots 2 and 3 (Act I), slot 2 (Act II), slots 3 and 2 (Act III) tested separately; Huggles only if no friend monster | `allies().length === 0` (`:124`) | same in normal play |
| O7 | Death | Acts I and II: flee command; Act III: HP to 1 while the combo flag is set (m243.src:175-180, m245.src:196-207) | none | presentation and an edge case in Act III |
| L1 | Cycle after No Love Lost | a fixed five-step cycle A, S, L, A, M that No Love Lost never uses up: commands go `MG A N S L A M A S L N A M A S L A M N ...` (m253.src:106-275) | the step comes from the turn number (`:193`), so No Love Lost replaces a step: `MG A N L A M A S L A N A S L A M A S N ...` | No Love Lost turns match (3, 11, 19, 27 ...), the other turns do not |
| L2 | Not-So-Mighty Guard | on all monsters at the first generic poll and at the 25th, never else; turn 5 is an Attack (m253.src:151-163,245-250) | with the default reading it matches (`:185-198`, SinirothX flag); with the other flag it is also cast at step 5 | none with the default; the research's wiki reading is wrong |
| L3 | Leblanc's Attack target | near-weighted (m253.src:169) | uniform (`:200`) | |
| L4 | Spell step | Osmose below 15 MP, else four spells 1/4 each, uniform (m253.src:178-209) | the same (`:202-208`) | none |
| L5 | Love Tap / White Wind | coin flip, then the chosen one or White Wind on all monsters (m253.src:219-241) | the same (`:209-218`) | none |
| L6 | No Love Lost window | Ormi and Logos invincible from the start of the combo to the clean-up poll; Leblanc's AGI 254 then 53; HP-to-1 death hooks; the clean-up poll issues nothing (m253.src:107-134,291-306, m245.src:196-207, m250.src:145-157) | none; the combo is one ability with a sequence of parts (`:179-183`) | a hit that would kill Ormi or Logos inside the window is possible in ours |
| L7 | No Love Lost numbers | three linked commands, formula 1 (STR based, no DEF term) power 5 x 8 hits and power 22, then 6/16 of current HP (rows 0x40f6 to 0x40f8); about 21 to 24 and 94 to 106 from Leblanc's record | flat 24 and 106 and 6/16 (`leblanc-syndicate-leblanc-abilities.ts:333-390`) | the same size; the game's follow Leblanc's STR and Lv with the usual spread |
| L8 | Row differences | Fira etc. power 12; Osmose takes 3/16 of the girl's current MP (class MP, formula 4); Mach Fan is formula 0 power 24 with the girls' DEF term, Delay weak | power 13 (`:111`), Osmose as a magic formula power 8 (`:285-301`), Mach Fan a flat constant that ignores DEF (`:130-146`) | damage values move; Mach Fan is reduced by DEF in the game |
| G1 | Logos' script | Act II: Pistol x3 then a Roulette row; Act III: five turns of Pistol 75% / Hail of Bullets 25%, then a Roulette row (m249.src:79-122, m250.src:78-129) | three-turn loop of two Double Shots then Roulette or Hail 50/50, labelled AUTHORED (`:247-262`) | Act II: a Roulette on every 4th turn and no Hail in the game, against one Roulette in 6 turns and one Hail in 6 in ours; Act III: the same Roulette rate (1 in 6), Hail on 5 in 24 turns against 1 in 6 |
| G2 | Roulette rows | five rows, 1/5 each: Death 30, Curse 100, Silence 100, Petrify 30, Poison 100 (chance bytes, then the level and resist terms); no Eject; the blank row unreachable | one ability that always lands exactly one of six statuses, Eject included (`leblanc-syndicate-abilities.ts:297-324`, research 4.3) | ours always inflicts something and can eject; the game's Death and Petrify rows fail about 70% of the time before resist |
| G3 | Logos' rows | Pistol power 8, two hits, accuracy byte 140, fixed 20% crit; Hail of Bullets is **physical** (formula 0, power 8), three hits on all party, charge 120; Roulette rows are formula 0 power 8, no bits | Double Shot at the standard attack constant (`:255-265`), Hail and Roulette as 'multiple'/'other' (`:297-340`) | Protect does halve Hail in the game; Logos' power is half ours |
| K1 | Dr. Goon | Attack, near-weighted (m135.src:76-77); Lv 14, DEF 6, MDEF 6, AGI 56, steal 100% | Attack, uniform (`:274-277`); Lv 17, DEF 30, MDEF 10, AGI 40 (authored), steal 75% (`leblanc-syndicate-acts.ts:135,152`) | the authored goons are far tougher than the record |
| K2 | Fem-Goon | the 25% / MP 13 / all-below-half / coin-flip table of 3.6 (m138.src:76-199); Lv 16, MP 270, DEF 5, AGI 62, steal 100% | half party-wide base spells, half single spells or Fan Slap, uniform (`:279-306`); MP 172, DEF 20, AGI 45 (authored), steal 75% (`leblanc-syndicate-acts.ts:173,190`) | no Fan Slap in the game; she Attacks 25%; the lowest-HP girl is her target when all three are hurt |
| R1 | Acts I and II records | Ormi Act I STR 80, AGI 63, MP 40; Act II STR 64, AGI 63, MP 42; Logos Act II MP 64, MDEF 14, AGI 90; Act II Ormi and Logos not immune to Sleep (monster.bin) | Act III's STR 53 / AGI 42 / MP 45 and Logos' AGI 49 carried over (`leblanc-syndicate-acts.ts:40-84`); all immune to Sleep | Acts I and II act 50% faster (Ormi) and almost twice as fast (Logos) in the game |
| R2 | Accuracy | ACC 95 on every actor, Attack formula 2 | `acc: 0` on all (`leblanc-syndicate.ts:141,213,257`, `den-of-woe.ts:65,120,172`, `ixion-djose.ts:69`) routed to the enemy baseline | physical hits use 95 in the game |
| D1 | Baralai's low-HP move | tests Reflect (not Regen); Guard only if he has Reflect, else Absorb (MP below 60) or Regen; **in addition to** the poll's normal command (m176.src:100-124 then 126-242) | tests Regen: with Regen on it casts Not-So-Mighty Guard; replaces the turn (`ai/den-of-woe.ts:163-167`) | ours casts the Guard (Shell, Protect and Regen on himself) that the game casts only if he has Reflect; ours loses the normal command on those turns |
| D2 | Order inside the poll | HP move, then Drill Shot or the cycle step (m176.src) | Drill Shot first and returns, then the HP move (`:156-167`) | on a poll where both apply, the game does both |
| D3 | The counter | +1 per result applied by anyone but himself: per hit, misses and no-effect results included, ticks excluded (m176.src:246-253, 1.2) | +1 per action that damages him, and +1 per Regen payout (`:63-70,182-189`) | multi-hit and missed attacks count in the game; his Regen ticks do not |
| D4 | Drill Shot target | the latest result's attacker slot, own slot possible (m176.src:128-131) | the last damaging attacker (`:158-160`) | an own-Regen tick can redirect it in the game |
| D5 | Triple Attack | three Chain Attacks with fixed targets Yuna, Rikku, Paine and fallbacks (m176.src:161-218) | `triple-attack` with three random hits (`data/ffx2/enemies/den-of-woe-abilities.ts:152-157`) | with all alive each girl takes one strike |
| D6 | Looming Glacier target | highest MP among girls not in Stop, ties near; with all in Stop the target is "nothing", which the engine turns into the nearest living girl (m176.src:220-224, 1.12) | highest MP not in Stop, falling back to the highest-MP girl (`:93-100,177`) | edge case |
| D7 | Absorb | HP+MP class, 3/16 of the girl's current HP and MP, absorbs (row 0x4040) | `percent-current` on HP (`den-of-woe-abilities.ts:204-215`) | MP half missing |
| D8 | One-third line | `HP < max / 3`, integer: Gippal turns at 4,932 and Baralai at 4,072 (m177.src:97, m176.src:100) | `3 x HP < max`: 4,933 and 4,073 (`ai/den-of-woe.ts:73-75`) | one HP of difference at the boundary |
| D9 | Gippal's low-HP Attack | on the living girl with the lowest current HP (m177.src:131-135) | a random girl (`:125`) | focus-fire on the weakest girl |
| D10 | Target rules | Baralai's Attack and Looming Glacier ties: near; Gippal, Nooj: uniform | uniform everywhere (`randomGirl`) | Baralai's Attack favours the nearer girl |
| D11 | Nooj | cycle A, A, Rippling Chroma, A, Greedy Aura; Lightfall once below 3,000 (m258.src) | the same (`:201-213`) | none |
| D12 | Steal rates | 128/255 = 50.2% for all three shades and Ixion; Pilfer Gil 50% to 100% of the figure | `baseChance: 50`, flagged estimate (`den-of-woe.ts:86,139,191`, `ixion-djose.ts:90`); fixed Pilfer figures | rate confirmed; Pilfer pays 75% on average |
| I1 | What adds to AC | +5 per result applied to him by anyone but himself, per hit, misses included (m166.src:125-132) | +5 once per party action that targets him (`ai/fallen-aeons.ts:47-56`, `engineHooks.ts:153-188`) | multi-hit moves fill the counter faster in the game |
| I2 | Cycle after Thor's Hammer | the cycle counter is untouched, so it continues (m166.src:83-121) | restarts at step 1 (`ai/ixion.ts:65`, labelled an estimate) | different next move when AC passes 100 mid-cycle |
| I3 | Attack / Thundara split | `% 4`: 3 Attack : 1 Thundara (m166.src:110) | 3/4 : 1/4 default, 2/3 : 1/3 behind a flag (`:81`) | the default is right; the wiki flag is wrong |
| I4 | Targets | Attack and Aerospark near-weighted (m166.src:104,117) | random (`:78,83`) | |
| I5 | Action time | see E1 | `DJOSE_ACTION_TIME_SECONDS = 3` on Ixion's own gauge (`ixion-djose.ts:43-46`) | see E1 |
| H1 | Hit rolls and Darkness | only the plain Attacks (ACC 95 or byte 95) and the 1H Pistol (byte 140) roll to hit, and Darkness cuts those; Grinder, Mortar, Glint, Chain Attack, Drill Shot, Supercollider, Huggles, Hail of Bullets, Mach Fan and every spell and grenade never roll, and Supercollider and Huggles ignore Darkness (rows, misc bits) | Grinder, Mortar, Glint and the Triple Attack roll to hit (no `canMiss: false`, `den-of-woe-abilities.ts:60-66,74-79,92-104,152-171`); Supercollider rolls and is affected by Darkness (`leblanc-syndicate-abilities.ts:155-185`); Huggles is authored "accuracy checked" and affected by Darkness (`:91,212`) | ours can miss with moves that never miss, and Darkness blunts two moves it cannot touch in the game |
| H2 | Delay size | Supercollider and Mach Fan carry the weak Delay (4,000 units, 42 steps), Huggles the strong one (8,000 units, 84 steps) (rows, [re-ffx2-atb-status.md](re-ffx2-atb-status.md) section 1) | all three `weak-delay`, magnitude a named constant (`leblanc-syndicate-abilities.ts:185,212`, `leblanc-syndicate-leblanc-abilities.ts:143`; research ffx2-leblanc-syndicate.md:447) | Huggles delays twice as much in the game |
| E1 | Action time | every gauge in the battle stands still while a command's effect plays, in both modes; the length is the animation's (1.10) | a flat 1.5 s (3 s in the Road, Cloister and Djose links) added to the **actor's own** recovery while the other gauges keep filling (`action-time.ts:1-20,54-82`) | in the game the party gets no gauge time during a boss animation; in ours it does |
| E2 | Pace | per-move rest and charge (section 6); the shades' special moves have rest 0 | tier estimates (charge 0 / 16 / 26 / 39, rest baseline 70) (`constants.ts:79,100-103`, research/ffx2-leblanc-syndicate.md:429-447) | the real turn lengths differ per move |
| E3 | Thinking | 0 plus 30 steps per fallen girl; the record's thinking byte (30 on the goons) is unused (1.4) | `thinkingTicks` is set to 0 at setup and nothing raises it (`setup.ts:160`, `active.ts:135`) | none while the party stands; see [re-ffx2-atb-status.md](re-ffx2-atb-status.md) row 13 |
| E4 | Damage-type bits | Supercollider and Drill Shot are physical-only (Protect halves them); Hail of Bullets physical; Mortar, Grinder, Glint, Chain Attack physical; Thundara, Thor's Hammer, Rippling Chroma magical; Aerospark, Huggles, Concussive Blast, Bullseye, Greedy Aura, Lightfall, No Love Lost, Roulette none | Supercollider, Drill Shot, Hail 'other' (`leblanc-syndicate-abilities.ts:172-182`, `den-of-woe-abilities.ts:189-198`) | Protect would not halve them in ours |
| E5 | Time-out block | never runs (1.8) | none | no action needed |
