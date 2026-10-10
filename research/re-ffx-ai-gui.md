# FFX Sinspawn Gui and the guest Seymour: what the game's own files say (Mushroom Rock Road, both fights)

**Game case: FFX only.** Sinspawn Gui, the Ridge fights and Seymour as a party member exist only in FFX; FFX-2 has none of it.
Research lane for the new-chapters work (2026-10-10). **Records only: no repo file was changed and nothing was committed** (the earlier lanes'
notes in the `re-parity` worktree were only read, to cite their formulas). Working files and raw extractions:
`D:\Tools\ffx-parity\new-chapters\ffx-sinspawn-gui\raw\` (never in a repo).

**Source note (applies to every statement below unless a line says otherwise).** FFX.exe / FFX_Data.vbf Steam build 25501027
(FFX.exe SHA-256 0537B2A1...686D; FFX_Data.vbf 20,701,622,962 bytes, SHA-256 starts b22025d4c39e799e, re-hashed today from the live E:
copy: b22025d4c39e799e3b292140ef38dbe1472e217225a88714509099460365c41f). The scripts are data in the archive (`ffx_ps2/ffx/master/jppc/battle/mon/_mNNN/mNNN.bin`
for monsters, `.../battle/btl/<formation>/<formation>.bin` for formations, `.../event/obj/ki/kinoNNNN/kinoNNNN.ebp` for the field
events that launch the fights, `.../battle/kernel/*.bin` for the tables). Everything is written in our own words: no script text, no game
dialogue and no decompiled code is reproduced; the captions and voice lines of the fights are described by what they do.
Rule tables give conditions, actions, probabilities and where in the script each rule lives (monster id, hook, code offset).

| Fight | Launched by | Battle id | Formation | Party | Scripts read |
|---|---|---|---|---|---|
| 1, "the Ridge" first fight | `kino0200.ebp` @0xc8b5 | 0x00DE0000 | `kino02_00` | the player's own frontline (3 of Tidus, Yuna, Auron, Kimahri, Wakka, Lulu); Switch allowed | m117 body, m160 head, m161 arm (x2), formation script |
| 2, after Sin's attack | `kino0300.ebp` @0x1dea | 0x00DF000A | `kino03_10` | **forced: Yuna, Seymour, Auron** (slots 1, 2, 3); Switch disabled | the same four scripts, fight-2 branches |

Sections: 0 how this was read; 1 answers at a glance; 2 the encounter; 3 the monster rows; 4 the commands; 5 the AI; 6 engine facts
read in this lane; 7 Seymour as the guest; 8 worked numbers; 9 rules a build must reproduce; 10 answers to the driver's open
questions and corrections to `research.md`; 11 what is still open.

## 0. How this was read, and how far to trust it

1. **Extraction.** 89 files (5 monster scripts: the three Gui parts plus the boss Seymour and Anima for comparison; 7 formation scripts; 77 kernel
   tables of the jppc and new_uspc trees) and the 10 Mushroom Rock Road field-event scripts (`kino0000` to `kino0900`) were extracted from the live E:
   archive with our own reader; all 89 are byte-identical to the earlier lane's extraction under `D:\Tools\rea\work\extract`. SHA-256 prefixes: m117 119,456 B
   91bf9d28; m160 3,668 B 5e6a3c27; m161 3,164 B cec55251; `kino02_00` 20,400 B 57ff7d68; `kino03_10` 18,176 B 8b5d0800; `ply_save.bin`
   9c9fb4be; `weapon.bin` 1ebc2df4; `command.bin` 88e6a63a; `monmagic2.bin` 455be7f0; `monster1/2/3.bin` 76dc8a40 / d39a5a09 / 7978736a;
   `ctb_base.bin` 72eaa7b3; `kino0200.ebp` 59bd4ae6; `kino0300.ebp` 8a5306e6. (m124 f4cd4e19 and m125 0b1dd8d9 equal the Seymour lane's.)
2. **The scripts were run, in two independent interpreters.** The bytecode of m117, m160, m161 and both formation scene workers ran in
   (a) the Seymour lane's hook interpreter (unmodified copy) in a mock battle, and (b) the Yunalesca lane's separate VM with the game's real
   battle RNG streams (4,000 seeds per case). Both reproduce every rule below: the body's Attack/Demi counter in both fights, the head's
   three-state cycle and its relay through the body, the cancel rule, the arm-regrowth timer (49.3 / 50.7 percent over 4,000 seeds against the
   predicted 50 / 50), the armour gating for 12 different commands, and the fight-2 overrides. Files: `t-gui-body.mjs`, `t-gui-parts.mjs`,
   `t-gui-vm.mjs` and their outputs under `raw\out\`.
3. **Engine handlers read in Ghidra 12.1.4 (read-only GETs)**, besides those the Seymour / Evrae notes already list: the Atel group tables
   and the field-call handlers for `SetBattleFlags`, `addPartyMember` / `removePartyMember`; the reset call `revive/reinitialize` (0x7a89c0 with
   `pp_BtlInitChr` 0x79b4f0 and `pp_BtlReviveChr` 0x78d530); the property setter 0x7b4b70 (the properties these scripts write); the range
   check 0x791fa0 with the reach function 0x799690; the hit-reaction routine 0x78ca20 (the meaning of "Host"); the battle-end test
   0x7928d0 and the end-of-battle state machine 0x7917d0; the death handler 0x78c740; the action executor 0x792210 (order of onTargeted,
   range check and damage calculation); the party-stat builder 0x7860f0 with 0x785b60; the status infliction 0x78ae00 (temporal statuses);
   the action-done recovery 0x7b20e0.
4. **Confidence labels.** **A** = the rule ran in the interpreters and matches the reading. **B** = rests on an engine handler read in Ghidra but
   not executed. **C** = inferred, or a cutscene read only partly. **D** = derived by me from documented formulas with example inputs (not
   executed in the game). Unlabelled rows are A.
5. **Damage and CTB formulas are not re-derived here.** They are in the earlier lanes' notes: `research/re-ffx-damage.md` (base damage, the
   modifier chain, Armored / Defend / Shell), `research/re-ffx-ctb-status.md` (tick speed, opening counters, recovery, status infliction),
   `research/re-ffx-overdrive-steal-aeons.md` (Overdrive gauge modes, kill rewards, steal, gear drops), `research/re-ffx-ai-seymour.md` (hooks,
   queued commands, RNG streams). Section 8 applies them to the numbers of these fights.

## 1. Answers at a glance

| Question | Answer | Label |
|---|---|---|
| How many fights? | Two, each with the same four actors (body 20, head 21, arms 22 and 23). The second is the weaker rematch with the guest. | A |
| Is there a second "form"? | No form change. The only HP-based change is an acceleration of the body's Demi cycle (fight 1 below a third of its HP; fight 2 always). | A |
| Does Sin appear in either battle? | No. Neither monster script nor formation script mentions or spawns Sin; the formations hold only the four Gui parts. Sin's appearance is field cutscene / FMV outside the battle files (an FMV is loaded after each fight). | A |
| Who must die for the battle to end? | The body only. The head and arms carry `MustBeKilledForBattleEnd = 0`. | A / B |
| Fight 2 numbers | Body 6,000 HP, STR 15, MDF 1 (the script writes 0, the engine clamps to 1); head 1,000 HP; body AP 0; drops kept. | A |
| Arms | Never take turns; shield the body; regrow at full HP on the body's 3rd (50 percent) or 4th (50 percent) turn after both are dead. | A |
| Head | Out of reach of melee (BattleDistance 1); runs a 3-turn cycle (Thunder, warning turn, Venom) through the body; a damaging hit during the warning window resets it. | A / B |
| Body's turn | Attack, Attack, Demi, Attack, Demi, ... (fight 1 above 4,000 HP); with the random extra step it is Demi 0, 50, 75, 62.5, 68.8 ... percent per turn, tending to 2/3 (fight 1 below 4,000 HP; fight 2 from turn 1). | A |
| Is Seymour player-controlled? | Yes. No script gives him AI, forced actions or lines. Only fight 2. | A |
| Seymour's Overdrive | **Requiem** (0x30E3): magic, power 40, all enemies, cost 100 of a 100 gauge; mode Stoic; the gauge starts at 0. | A / B |
| Does Anima appear? | No. Not in either formation; Seymour has no summon command. | A |
| How does he leave? | The field event removes him (`removePartyMember(7)`) and restores the stored party after the fight. | A |
| Elements | Neutral on all three parts (no absorb, immune, resist or weak bit). | A |
| Threaten | Cannot land on any part: the record byte is 0 and Threaten treats that byte as a success percentage. | A / B |

## 2. The encounter

### 2.1 Launch, flags and what the field events do

| | Fight 1 (`kino0200.ebp`) | Fight 2 (`kino0300.ebp`) |
|---|---|---|
| Party set-up before | none: the current frontline is stored for the cutscenes (`storeFrontlineInArray` @0xc6be) | party setup saved (@0x1d4c); slots cleared; Tidus, Yuna, Wakka, Kimahri, Lulu, Auron, Rikku and Seymour removed; **Seymour, Yuna, Auron added**; slot 1 = Yuna, slot 2 = **Seymour**, slot 3 = Auron (@0x1d55 to 0x1dc4) |
| `SetBattleFlags(flags, a, b)` | (17665 = 0x4501, 0, 0) | (83204 = 0x14504, 297, 20) |
| `launchBattle(id, transition)` | (14548992 = 0x00DE0000, Fade) | (14614538 = 0x00DF000A, Fade) |
| After the battle | an FMV is loaded and played (FMV 32); no party change | menu 0x40011100 on a black screen (not identified), **Seymour removed (@0x1ed5)**, stored party restored (@0x1ed8), an FMV (FMV 36); a four-way branch on the save variable below picks one of four cutscene variants |

* **The id of a battle** is (group id << 16) | the formation number. The group ids come from the game's own table `kernel/btl.bin` (96 records of group id, two list offsets and an 8-byte name; parsed in `raw/btlbin.mjs`):
  **kino02 = 0x00DE, kino03 = 0x00DF**, kino00 = 0xDC, kino01 = 0xDD, kino04 = 0xE0, kino05 = 0xE1, kino07 = 0xE3 (mcyt06, the Macalania Seymour fight, = 0x0159). The formation number is the decimal suffix of the
  formation file (kino02_00 = 0, kino03_10 = 10 = 0x0A; the table's second section lists 0 under group 0xDE and 10 under group 0xDF). The other launches of the road agree (kino05_70 and _71 launch 0x00E10046 and
  0x00E10047). The monster scripts test `CurrentBattle() == 0x00DF000A` to detect fight 2; `CurrentBattle()` returns exactly (group id << 16) | formation number (0x782970). (A)
* **Flag words.** The low byte picks the battle-start transition (1 in fight 1; 4 in fight 2, which also passes 297 and 20 to it). Bits read by the
  end-of-battle state machine (0x7917d0 with the three one-line readers 0x86c280, 0x86c290, 0x86c4d0): bit 8 (0x100) is set in both, which switches off the branch taken for the
  normal victory result (the victory-fanfare path); bit 9 (0x200) is clear in both, which keeps the Game Over branch of a defeat; bit 16 (0x10000) is set only in fight 2 and
  skips the victory-pose request and its wait. These meanings are read from the branches, not run (C). I found nothing in these bits that hides or changes the results panel
  (section 11, item 1).
* **No heal between the fights.** Neither event calls a heal or refill for the party around the launches (the heal calls in the road's events sit in the first worker's function 6, the generic Save Sphere routine, C). Yuna and Auron therefore enter fight 2 with the HP, MP, statuses and Overdrive gauge fight 1 left them; Seymour enters with his row values. (B)
* **Save variable 0xa7c.** The body writes which arms were dead when it died (+1 for arm 22, +2 for arm 23; reset to 0 at the start of fight 2). The only
  consumer is the post-battle branch in `kino0300.ebp`: four cutscene variants. Several other scripts declare the same save offset (`testpub1`, `cdsp0700`, `bjyt0200`, `m101`,
  `m120`, `m155`, `stbv00_10/11`, `bjyt02_00`), so it looks like a shared battle-to-field scratch value (C). No gameplay effect. (A)
* **Music around the launches (the events' own calls).** Fight 1: track 28 ("Crisis" in the data's list) is started before the launch and faded out after the battle; fight 2: track 145 ("Challenge")
  is started before the launch and faded out after. This agrees with the driver's two track names. Whether the battle itself keeps or replaces the field track is an engine matter I did not trace (B).

### 2.2 The formation (chunk 2 and 3 of each `btl` file)

Both formations list the same four monsters in the same order: formation slot 0 = **m117 body (actor 20)**, slot 1 = **m160 head (actor 21)**,
slots 2 and 3 = **m161 arm (actors 22 and 23)**. Formation header bytes are identical in the two files (voice-line flag 0, water 0). Party
actors: Tidus 0, Yuna 1, Auron 2, Kimahri 3, Wakka 4, Lulu 5, Rikku 6, **Seymour 7**, aeons from 8.

| | Fight 1 (`kino02_00`, area 0) | Fight 2 (`kino03_10`) |
|---|---|---|
| Party stand points (x, y, z) | (399.9, -300.4, 3247.5), (427.1, -300.4, 3246.6), (448.7, -300.4, 3235.5) | (225, -300, 3140) slot 1 Yuna, (190, -300, 3150) slot 2 Seymour, (155, -300, 3140) slot 3 Auron |
| Aeon stand point | (396.4, -301.4, 3245.7) | (184.8, -300.5, 3169.3) |
| Body (20) | (400, -300, 3100) | (190, -300, 3294) |
| Head (21) | (420, -350, 3160) | (190, -350, 3234) |
| Arm 22 / arm 23 | (460, -320, 3120) / (340, -320, 3120) | (250, -320, 3267) / (130, -320, 3267) |
| Map centre | (400, -301.4, 3178) | (189, -300.3, 3210) |
| Number of area records | 2 (area 1: party (397.6, -300, 3221.2), (362.4, -300, 3183.3), (436.3, -300, 3218); monsters at z 3100) | 1 |

Distance from the body to the party stand points: about 144 to 149 units in fight 1 and 144 to 158 in fight 2 (the middle point is the nearest). Start-of-battle settings (setup worker, slot 63): the random-position flag is written off (read as "area 0 is used", C) and the ambush state is 3 ("normal", the start
can neither be preemptive nor an ambush). Escape (0x3003) and Flee (0x3018) are disabled for everyone in both fights; **Switch (0x3002) is also
disabled in fight 2 only**. No other command is disabled: Summon, Overdrives, items stay. The parts are linked to the body model (attach points 2, 4, 5
for the head and the two arms, at the body's init) and their "Host" property (89) is set to the body.

**What "Host" does (B, read in the engine).** It is a presentation link only: when a part is hit or targeted, the hit-reaction and target effects play on the host
(0x78ca20, 0x7a30f0, 0x791fa0). It moves no damage and no target. The body detaches the parts on its death (host := self).

**End of the battle (B, 0x7928d0).** The battle is won when no monster that is in the battle, not dead and flagged "must be killed" remains: only the body
is flagged, because the head's and the arms' init scripts clear the flag. It is lost when no party member of the stored formation has HP above 0 and
passes the same flags; **Seymour counts like any party member** (nothing special-cases him in the death handler 0x78c740). A defeat takes the Game Over route in both
fights. When the body dies its in-battle flag is cleared (death animation "boss": the body stays but is untargetable).

### 2.3 Fight 1 against fight 2, in one table

| | Fight 1 | Fight 2 | Where |
|---|---|---|---|
| Body HP / max HP | 12,000 | 6,000 (written) | m117 init @0x02af, @0x02bb |
| Body STR | 29 | 15 (written) | @0x02c7 |
| Body MDF | 30 | 0 written, **1 in play** (stat writes clamp to 1..255) | @0x02d3; setter 0x7b4b70 |
| Body DEF | 0 in the record, **1 in play** (init clamps stats to at least 1) | same | 0x79b4f0 |
| Head HP / max HP | 4,000 | 1,000 (written onto actor 21) | m117 init @0x02df, @0x02eb |
| Body AP (normal / overkill) | 400 / 600 | **0 / 0** (written) | @0x02f7, @0x0303 |
| Body item and gear drop chances | **written to 0** | left at 255 / 0 / 255 | @0x0312 to 0x033a |
| Demi-cycle acceleration line (`v11`) | max HP / 3 = 4,000 | the record's max HP read **before** the overwrite = 12,000, so always on | @0x033a vs @0x0297 |
| One-time voice-line flags (body v15 to v17, head v5) | 0 (lines play once) | 255 (no lines) | @0x027f to 0x028b; m160 @0x0115 |
| Switch | allowed | disabled | formation init |
| Party | the player's | Yuna, Seymour, Auron | events |
| Scenes with speech | scene 2 (3 one-time lines) and scene 3 (one line) | none (captions only) | formation w0 |

## 3. The monster rows

All rows are the monster file's own stat chunk (chunk 2, bytes 0x14 to 0x7f), byte-identical to the kernel table rows (`monster1/2/3.bin`, row = monster id); the
loot rows are chunk 4. Field layout: the community data parser's list, used as documentation only (as the Evrae lane's `monrec.mjs` does). Stats are clamped to 1..255 when
the battle starts (HP, MP and the overkill threshold are not).

### 3.1 Stats

| Field | m117 body | m160 head | m161 arm (x2) |
|---|---:|---:|---:|
| HP | 12,000 (fight 2: 6,000) | 4,000 (fight 2: 1,000) | 800 |
| MP | 30 | 200 | 1 |
| Overkill threshold | 800 | 800 | 500 |
| STR / DEF / MAG / MDF | 29 (fight 2: 15) / 0 / 20 / 30 (fight 2: 0) | 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 |
| AGI / LCK / EVA / ACC | 10 / 15 / 0 / 100 | 15 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Misc flags (+0x28, +0x29) | 0x04 Immune to Life; 0x07 immune to CTB damage, Slice, Bribe | 0x00; 0x07 | 0x01 **Armored**; 0x07 |
| Poison damage byte | 0 | 25 | 25 |
| Element absorb / immune / resist / weak | none / none / none / none | none | none |
| Auto-statuses | none | none | none |
| Extra-status immunities | Eject, Auto-Life, Doom | + the four Distillers | + the four Distillers |
| Command list | 0x6000 Attack, 0x6031 Venom (+ Thunder 0x3043 and Demi 0x304E added by the init) | 0x6001 Special 1 | none |
| Forced action | 0x6000 | none | none |
| CTB icon type / number | 21 / none | 22 / none | 22 / 1 and 2 (written by the formation) |
| Turns | yes | yes | **no** (GetsTurns := 0, hidden from the CTB list) |
| Overdrive | **none**: no command in any of the three lists carries an Overdrive cost and no script touches a gauge | none | none |
| Zanmato level byte | 3 (level 4) | 3 | 3 |

Zeros in AGI, DEF, MDF are clamped to 1 at the start (so the arms have AGI 1 and tick speed 28). Natural affinities, immunities and auto-statuses are all empty:
**no element is better than another on any part.**

### 3.2 Status table (record byte; 255 = immune; otherwise the command's chance minus the byte)

| Status | Body | Head | Arm | Note |
|---|---:|---:|---:|---|
| Death, Zombie, Petrify, Poison, Confuse, Berserk, Sleep, Silence, Darkness, Slow | 255 | 255 | 255 | immune |
| the four Nul statuses | 255 | 255 | 255 | immune |
| Power Break | **0 (lands)** | 255 | 255 | Power Break command chance 100 |
| Magic Break, Mental Break | 255 | 255 | 255 | immune |
| Armor Break | 255 | 255 | **0 (lands)** | on the arms it removes Armored and the DEF term |
| Provoke | **0 (lands)** | 255 | 255 | the body keeps control of its script when Provoked |
| Threaten | 0 | 0 | 0 | for Threaten the byte is a success percentage (`draw % 100 < byte`), so **it can never land on any part** (B, 0x78ae00) |
| Shell, Protect, Reflect, Regen, Haste | 0 | 0 | 0 | positive statuses are not blocked |

A command's chance 100 against byte 0 lands when the status roll (`draw % 101`) is below 100, that is 100 in 101 (99.0 percent).

### 3.3 Loot (chunk 4 of each monster file)

| | Body | Head | Arm (each death) |
|---|---|---|---|
| Gil | 1,000 | 200 | 300 |
| AP normal / overkill | 400 / 600 (fight 2: 0 / 0) | 48 / 72 | 37 / 55 |
| Item drop chances (primary / secondary) | 255 / 0 | 255 / 0 | 255 / 0 |
| Primary drop, normal | 3 x Lv. 1 Key Sphere (common and rare slots equal) | 1 x Mana Sphere | 1 x Speed Sphere |
| Primary drop, overkill | 6 x Lv. 1 Key Sphere | 2 x Mana Sphere | 2 x Speed Sphere |
| Gear drop chance | 255 | 30 | 30 |
| **Item and gear chances in play** (after the init scripts) | fight 1: 0 and 0; fight 2: 255 and 255 | 0 and 0 | 0 and 0 |
| Steal | Potion x1 (common) and Potion x1 (rare), chance 255 | same | same |
| Bribe item | Potion x1 (all parts are Bribe-immune) | same | same |
| Pilfer / Nab Gil byte (x100 gil) | 10 (up to 1,000) | 2 | 3 |
| Ronso Rage / Monster Arena price | none / 1,500 | none / 300 | none / 450 |

**What the scripts change:** the head's init writes 0 to its own item and gear drop chances; each arm's init writes 0 to its own three chances; the
body's init does the same **in fight 1 only**; the formation's regrowth scene writes 0 to both arms' chances again after the reset (the reset restores the
record, B). So the item drops that can actually appear are the body's, in fight 2 only: **3 Lv. 1 Key Spheres (6 on an overkill) plus one gear piece
(chance 255)**. Gil and AP are paid for **every death of every part that has a loot record** (B: the death handler calls the reward routine for each monster
death that is not a silent removal; the arms die again after each regrowth and pay again; the research file's farming note is confirmed by the data).

**The gear piece (B, formulas from the rewards note, D for the odds).** Formula 1, power 16, crit 3; slots byte 7 and ability byte 13. Slot count 1 (5 in 8) or 2 (3 in 8); ability
tries 1 (7 in 8) or 2 (1 in 8). Weapons carry **Piercing as a forced first ability for Auron and Kimahri**, and **Sleepstrike** is the only random ability for
every owner; armour carries **Sleepproof** only. The owner, weapon-or-armour choice and the draws are the generic gear-drop rules.

## 4. The commands the parts use

| Command | Id | User of the record | Target | Formula, power, hits | Type bits | Notes |
|---|---|---|---|---|---|---|
| Attack | 0x6000 | body | one party member | 1 (STR vs DEF), power 16, accuracy 90, 1 hit | physical | rank 3; can be Darkened; can miss; reach 0 |
| Special 1 | 0x6001 | head | the body (explicit target) | none, no hits | none | rank 3; the relay (section 5.3); no hit record, so no onHit |
| Thunder | 0x3043 | body (in reaction) | one party member | 3 (MAG vs MDF), power 12, element Thunder | magical | rank 3, MP 4 (not paid by monsters); reflectable; never misses |
| Venom | 0x6031 | body (in reaction) | one party member | 3 (MAG vs MDF), power 24, 1 hit | **neither physical nor magical** (type 0) | Poison chance 100, Slow chance 100, **Slow duration byte 0** (below); not reflectable; Shell and Protect do not apply |
| Demi | 0x304E | body | the whole party (Frontline) | 5 (current HP x 4 / 16 = 25 percent), no variance | magical, piercing flag | rank 3; cannot kill; Shell halves it |

* **Venom's Slow (B, 0x78ae00).** The infliction step writes the status counter from the command's duration byte, which is 0 for Slow on Venom, and clears
  the target's Haste counter. So Venom poisons (permanent status, 25 percent of max HP per tick for Seymour's row) and **removes Haste, but leaves no Slow counter**.
  Whether the game then shows a "Slow" pop-up is not known.
* **Reach (0x799690).** reach = ((targeting byte bit 7) | (allowed byte bit 0) << 1); 3 for commands with allowed-byte bit 1 when the user is Wakka (4), Valefor
  (8) or Anima (13). A target is out of reach when reach < its BattleDistance and it is not the user. Computed: **Attack and all melee skills reach 0**; Steal, Mug,
  Threaten, Provoke, the Breaks reach 0; **every spell, Scan, Cure family and Requiem reach 3**; Lancet 3; Use / items 2; Wakka's Attack 3; Overdrives of Tidus / Auron 0.
  The head has BattleDistance 1 (its init, @0x0105), everything else 0: **the head can only be hit by commands of reach 1 or more**.

## 5. The AI

### 5.1 Hooks, variables, scenes

| Script | Worker (slot) | init | onTurn | onTargeted | onHit | onDeath | other |
|---|---|---|---|---|---|---|---|
| m117 body | w1 (61) | f0 @0x00ad | f2 @0x0384 | f3 @0x044c | f4 @0x065d | f5 @0x06f5 | postTurn f6 @0x071a; no preTurn |
| m160 head | w0 (61) | f0 @0x0000 | f3 @0x012a | f4 @0x0237 | f5 @0x027c | f6 @0x02e1 | onMove f2 (empty) |
| m161 arm | w0 (61) | f0 @0x0000 | f3 @0x010e (empty) | f4 @0x010f | none | f5 @0x017d | onMove f2 (empty) |
| formation (scenes) | w0 (62) | f0 @0x0000 | scene 0 = f2, scene 1 = f3, scene 2 = f4, scene 3 = f5: `kino02_00` @0x003b / 0x0193 / 0x0283 / 0x0390; `kino03_10` @0x0047 / 0x019f / 0x028f / 0x0293 | | | | setup worker w4 (63): `kino02_00` f0 @0x2aaf, `kino03_10` f0 @0x2242 |

Neither formation has party or aeon hook workers (no per-actor combat handlers): **no scripted AI or forced action exists for Yuna, Auron, Seymour or any aeon.**

Shared battle variables: `[04]` relay selector (1 = Thunder, 2 = Venom; written by the head, cleared by the body); `[08]` "head hit" flag (255, consumed by scene 0); `[0c]` which
of Tidus / Wakka / Auron (1, 2, 3) gets the first-shield line; `[10]` who speaks the first head warning (1 Wakka, 2 Lulu, 3 Auron, 4 Tidus); `[1c]` 255 when the body is hit by
Hellfire; `[20]` which fight (1 or 2; only the death animation reads it). Body private: v7 chosen target, v8 last attacker, v9 shield-applied flag, v10 command in use, v11 the
acceleration line, **v12 the Attack / Demi counter**, **v13 the arm-regrowth counter**, v14 Venom animation flag, v15 to v17 one-time line flags. Head private: **v3 state (1, 2, 3; starts at 1)**, v4 last
damage, v5 first-warning flag, v6 saved animation variant. Save variable 0xa7c = body v0.

### 5.2 The body's turn (m117 onTurn @0x0384; A)

In order, every turn:

| # | Condition | Action | Draw |
|---|---|---|---|
| 1 | arms 22 **and** 23 both dead | if `v13 > (GetRandomValue() mod 2) + 1`: run scene 1 (regrowth, 5.5) and `v13 := 0`; else `v13 := v13 + 1`. The turn then continues. | one stream-2 draw per turn spent in this state |
| 2 | `v12 >= 2` | perform **Demi** on all of Frontline (every non-monster actor in the battle); `v12 := 0` | none |
| 3 | otherwise | perform **Attack** on the Provoker if the body is Provoked, else on `findMatchingChr(Frontline, alive)` | stream 4, one draw if two or more candidates (ascending actor number; with three alive: Yuna, Auron, Seymour in fight 2) |
| 4 | after 2 or 3 | `v12 := v12 + 1` | |
| 5 | `v11 > body HP` (strict) | `v12 := v12 + (GetRandomValue() mod 2)` | one stream-2 draw, after the command is queued |

* The body keeps script control when Provoked (property 256 := 1), so row 3 still queues the Attack, aimed at the Provoker; **Demi is not redirected**. Run: Provoked by Seymour, the turns are Attack->Seymour,
  Attack->Seymour, Demi->everyone, Attack->Seymour, Demi->everyone, with **no stream-4 draw** (the target is read from the Provoker property, not picked). (A)
* **Pattern without the extra step** (fight 1 above 4,000 HP): Attack, Attack, **Demi**, Attack, **Demi**, Attack, Demi ... (the first Demi on turn 3, then strict alternation).
* **With the extra step** (fight 1 at 3,999 HP or below; fight 2 from turn 1 because the line is 12,000): P(Demi) on body turn 1 to 8 = 0, 50, 75, 62.5, 68.75, 65.6, 67.2, 66.4 percent, tending to 2/3.
  A Demi can follow a Demi. Verified exactly by an enumeration of the counter chain and by 4,000 seeds under the real streams.
* Recovery after any of these: AGI 10 gives tick speed 14; rank 3 gives **42 ticks**.

### 5.3 The head's turn and the relay (m160 onTurn @0x012a, m117 onTargeted @0x044c; A for the scripts, B for the reaction timing)

The head never attacks for itself. Its private state `v3` cycles 1, 2, 3, 1 ...

| State at the turn | The head does | Then |
|---|---|---|
| 1 | writes `[04] := 1` and performs **Special 1 on the body** (a normal command of rank 3 for the head) | state 2 |
| 2 | **no command**: sets the body's animation variant to "head raised", picks the speaker (first warning only, fight 1), plays the warning caption (scene 3) | state 3 |
| 3 | writes `[04] := 2` and performs **Special 1 on the body** | state 1 |

**The body answers (onTargeted, "used command is 0x6001").** It picks `findMatchingChr(Frontline, alive)` (stream 4, drawn even when the selector later turns out to be
neither 1 nor 2), then: selector 1 queues **Thunder** at that member; selector 2 queues **Venom** at that member; the selector is cleared. These are
**reactions of the body** (user = body, MAG 20, no CTB cost; the body keeps its own turn schedule), run after the head's action resolves. If the body is dead, the
queued command targets nothing and is dropped.

**Cancel rule (head onHit @0x027c).** If the head's `LastDamageTaken` is above 0 **while the state is 3** (after the warning turn, before the Venom turn), the head resets to state 1,
sets `[08] := 255` and plays the "head stops moving" scene; the Venom never happens and the next head turn is Thunder. Damage in states 1 or 2, a miss, a heal or a zero-damage hit changes
nothing. Damage type does not matter. If the head **dies**, its onDeath plays the same scene flag; no more Thunder or Venom ever occur.

Head recovery: AGI 15 gives tick speed 12; rank 3 gives **36 ticks**, also for the empty warning turn (the rank resets to 3). So the head takes about 7 turns while the body takes 6.

### 5.4 The body's reactions: the shield (m117 onTargeted / onHit)

onTargeted runs for every command that targets the body, **before the range check and before any damage is calculated** (0x792210: the hook, then the range check, then the
calculation). In order:

| # | Test | Result |
|---|---|---|
| 1 | always | DEF := 0 (clamped to 1), Defend := off, Armored := off |
| 2 | the used command is 0x6001 | the relay (5.3); stop |
| 3 | the used command is 0x30D1 (Hellfire) | set `[1c] := 255` and detach the three parts (host := self); continue |
| 4 | the command does not affect HP (damage class bit 0 clear) | stop (no shield) |
| 5 | damage type = 2 (magical flag only) | stop |
| 6 | damage type = 0 (neither flag) | stop |
| 7 | **types 1 (physical) or 3 (both flags)** and arm 22 or arm 23 alive | **DEF := 100, Armored := on, Defend := on** for this command (the motion level is also changed, animation only); the first strike by Tidus, Wakka or Auron while shielded records a voice-line request (fight 1 only) |
| 8 | the same with both arms dead | DEF := 0 (clamped to 1); the three one-time line flags are set |

onHit (once per action, after the damage, before the death check) resets DEF, Armored and Defend again; if `[1c] = 255` it runs scene 0; if a voice line is owed and the
body lives it runs scene 2. If the body's HP is 0 it records the dead arms (bit 1 / 2) in the save variable instead.

**What the shield catches (A, run on the real command bytes; list in `raw\out\shield-list.txt`).** Only commands that affect HP and carry the **physical flag only (type 1)**:
the 44 physical commands of the party table: Attack, Delay Attack / Buster, Sleep / Silence / Dark / Zombie Attack and Buster, Triple Foul, the four Breaks, Full Break, Mug, Quick Hit, the four Extract
commands, Nab Gil, and the aeons' physical commands (every aeon's Attack, Valefor's Sonic Wings, Ixion's Aerospark, Shiva's Heavenly Strike, Bahamut's Impulse, Yojimbo's three attacks, the Magus Sisters' Attack, Camisade, Razzia and Passado, and Struggle).
**Not caught: every spell and healing (type 2), every Overdrive (Tidus, Auron, Kimahri's Rages, Wakka's Reels, Lulu's Furies, Rikku's and the aeons' 20-cost Overdrives are all type 0; Seymour's Requiem is type 2, magical),
Lancet and Steal / Provoke / Threaten (type 0), Ifrit's Meteor Strike (type 0), Anima's Pain (type 2) and monster commands such as Venom.** No command in the tables has both flags (type 3). On top of the shield the generic modifiers apply
(`research/re-ffx-damage.md` section 4, steps 13 and 14): **Armored divides by 3 unless** the command has the piercing flag, the user has Piercing or the target has Armor Break; **Defend halves physical damage**; DEF 100 cuts the
formula-1 term to 311 / 725 of the unshielded value. Piercing weapons (Seymour's staff, Auron's and Kimahri's) skip only the Armored third.

### 5.5 The arms and their regrowth (m161, formation scene 1)

* Arms never act and are hidden from the CTB list; they start with the record's HP 800 and the Armored flag, so **non-piercing damage to an arm is divided by 3** (spells carry the piercing flag; Requiem does not).
* Arm death: onDeath plays scene 0 (the destruction effect) if the body is alive. Arms use the "boss" death: the model is hidden and the arm leaves the battle (not targetable, not in Frontline or AllMonsters).
* **Regrowth (scene 1, formation f3).** When the body's counter test passes (5.2 row 1, so on the body's 3rd turn after both arms are dead with probability 1/2 and on the 4th with probability 1/2; one arm alive
  freezes the counter, and the counter is not reset by an arm dying), the scene runs, unless the body is dead: both arms are re-initialised (full HP 800, statuses cleared, in the battle again with a fresh
  CTB base), the CTB icon numbers 1 and 2 and the zero drop chances are written again, and a caption announces the regrowth (about 80 frames).
* Each arm death pays its gil and AP again (3.3).

### 5.6 Scenes that carry no rules

**Game-state writes of the four scenes, run in the interpreter for both formations (A):** scene 0 writes only the body's animation variant (:= 0); scene 1 re-initialises both arms and rewrites their CTB icon numbers (1, 2) and zero drop chances;
scene 2 writes nothing; scene 3 writes only the body's animation variant (:= 2). Nothing else in the battle state changes; the formation scenes draw no battle random numbers (the camera worker has its own camera RNG).

Scene 0 (arm or head destroyed: effects, hides the arm models, caption), scene 1 (regrowth caption), scene 2 (fight 1 only: one voice line each the first time Tidus, Wakka or Auron strikes the
shielded body), scene 3 (the head's warning caption; fight 1 adds one voice line the first time, priority Wakka, then Lulu, then Auron, then Tidus among those present and able). The scenes pause the battle clock (B).
Fight 2 uses captions only.

### 5.7 Timing and the opening counters (B: 0x78ded0, 0x7909c0, 0x7b20e0; numbers from `ctb_base.bin`)

| Actor | AGI used | Tick speed | Base counter (x3) | Rank-3 recovery | Opening counter (normal start) |
|---|---:|---:|---:|---:|---|
| Body | 10 | 14 | 42 | 42 | 42 .. 46: `42 x 100 / (100 - draw % 11)` with the draw from stream 28 |
| Head | 15 | 12 | 36 | 36 | 36 .. 40 (stream 29) |
| Arm | 1 (0 clamped) | 28 | 84 | n/a | 84 .. 93 (never act) |
| Seymour | 20 | 10 | 30 | 30 (Requiem rank 4: 40; Nul spells and items rank 2: 20) | `30 - draw % 3` = 30, 29 or 28 (stream 27, the stream of slot 7 and every aeon) |

The smallest opening value in the battle is subtracted from every slot (the earlier lane's rule). The tie key for equal counters is `(255 - AGI) * 256 + id` for party members
(Seymour AGI 20 beats Yuna and Auron unless they are faster) and `id + 0x10000` for monsters (after all party members). The party's own AGI is the player's.

### 5.8 Draw order for replay parity

Draws by script (A; run on the real bytecode): **m117 onTurn** up to two stream-2 draws (`GetRandomValue`: the regrowth test, the extra step) and up to one stream-4 draw (`findMatchingChr` for the Attack); **m117 onTargeted** one stream-4 draw per relay reaction (the
`LastAttacker` lookup has one candidate and draws nothing); **m160, m161 and the formation scenes** none. Per body turn: (1) the regrowth test draw (stream 2) when both arms are dead, (2) the target draw (stream 4) for the Attack branch with two or more candidates, (3) the extra-step draw (stream 2)
when the body's HP is under the line. Per head Special 1: one stream-4 draw in the reaction (two or more candidates). Damage, hit and status draws are the generic ones
(`research/re-ffx-rng-hit.md`): Attack rolls to hit; Thunder and Venom do not; Venom's Poison and Slow each spend one stream draw (status roll, `% 101`).

## 6. Engine facts read in this lane (all VA in FFX.exe build 25501027)

| Fact | Where | Label |
|---|---|---|
| `revive/reinitialize(actor)` = re-init from the monster record (HP, MP, statuses, stats, loot copy, so the scripted drop-chance writes are lost), keeps the CTB icon bytes, revives (HP at least 1, Death cleared, in-battle flag set), CTB counter := stored base. Script-set fields outside the cleared block (GetsTurns, VisibleOnCTB, Host, MustBeKilled, Tough, Heavy) survive | 0x7a89c0, 0x79b4f0, 0x78d530, 0x78de40 | B |
| A monster's death with a non-zero "DeathAnimation" property clears its in-battle flag; the kill rewards are rolled for each death that is not a silent removal | 0x78c740 | B |
| Property writes to STR, DEF, MAG, MDF, AGI, LCK, ACC clamp to 1..255 (EVA to 0..255) | 0x7b4b70 | B |
| onTargeted hooks run before the range check and before the damage calculation; onHit after the damage and before the death check | 0x792210, 0x7ad0c0 | B |
| An actor that already has a reaction record queued does not get another onTargeted hook run (the gate before the hook) | 0x7ad0c0, 0x7b0720 | B |
| BattleDistance (Chr+0x4ff) is written only by the script setter and read only by the range check | 0x791fa0 | B |
| `Host` is a hit-reaction / target-effect redirect, not a damage redirect | 0x78ca20, 0x7a30f0 | B |
| Victory test counts only in-battle, not-dead, "must be killed" monsters; defeat counts party members of the stored formation | 0x7928d0 | B |
| `addPartyMember(id)` sets the save record's flags (0x11), adds the id to the roster, does not change stats; the stat builder takes base values plus sphere-grid bonuses plus gear percent bonuses | 0x85b700, 0x7869b0, 0x7860f0, 0x785b60 | B |
| Temporal-status landing writes the counter from the command's duration byte (0 means no counter) | 0x78ae00 | B |
| Recovery of an empty turn uses the actor's last rank (reset to 3 at counter zero) | 0x7b20e0 | B |
| **Ordering of a queued reaction.** `performCommand` / `forcePerformCommand` reach `FUN_007929b0`, which puts a turn entry into the 8-byte queue at 0x112aa80 (`pp_BtlQueueAction` 0x7b2300; a kind-1 reaction does not zero the actor's CTB counter) and the record into the 0x48-byte record queue at 0x112ac70 (`FUN_007b0a30`). A record of the lowest priority class goes directly after the actor's own current record, or at the end of the queue. The executor (0x792210) always takes the first record and finishes it before the next, so the body's Thunder or Venom runs **after the head's Special 1 has completed and before any record queued later** | 0x7929b0, 0x7b2300, 0x7b0a30, 0x7b0a10 | B |
| The earlier lane's open point "Host (property 89), meaning not read" is now read (presentation link) | | B |

## 7. Seymour as the guest (fight 2 only)

### 7.1 Joining, leaving, control

* **Joins** in `kino0300.ebp` just before the launch: the party setup is stored, all slots are cleared, the roster is emptied and **Seymour, Yuna, Auron** are added in the slots 2, 1, 3 order
  given above. `addPartyMember` sets the record flags; the record is Seymour's row 7 of `ply_save.bin`.
* **Control.** He is a normal party member of the stored formation: the player picks his commands in the ordinary menu. The formation scripts contain no hook for him, no forced command and no spoken line; nothing in the
  monster scripts targets him specially. (A)
* **Leaves** in the same event after the fight: a menu runs on a black screen, then `removePartyMember(7)` and `RestorePartyMemberSetup`. He is never in another battle (the only `addPartyMember(7)` in all 397
  field-event scripts of the archive's event tree is this one; many other events call `removePartyMember(7)` as routine clean-up). If he is KO'd at the end nothing changes. (A)
* **Dying.** Nothing special-cases him: the battle is lost only when Yuna, Seymour and Auron are all at 0 HP. He can be revived by the player's items or Life like anyone else. (B)

### 7.2 His record (`ply_save.bin` row 7; the row index is the actor number)

| Field | Value |
|---|---|
| Base HP / MP | **1,200 / 999** (the row's max-HP and max-MP fields hold 1,000 / 1,000 placeholders; the party-stat builder, which the game runs for all 18 slots when a game starts or loads, recomputes them from the base values; current HP / MP 1,200 / 999) |
| STR / DEF / MAG / MDF | 20 / 25 / 35 / **100** |
| AGI / LCK / EVA / ACC | 20 / **18** / 10 / 10 |
| Poison damage byte | 25 |
| Weapon row 26 (`weapon.bin`) | owner 7, formula 1, power 16, crit 3, slots byte 4, ability **Piercing** (0x800B) |
| Armour row 27 | owner 7, slots byte 4, ability **Sensor** (0x8000) |
| Overdrive mode / gauge / max | mode 2 **Stoic**; gauge **0**; max **100**; all 17 modes are marked learned in the row, but nothing in these scenes offers the mode menu (C) |
| Starting statuses | none; sphere level 0 (no grid bonuses) |
| Effective battle stats | the base values above (no sphere bonuses, no percent abilities on his gear); HP and MP clamp to their maxima |

### 7.3 His command list and where it sits in the menu

| Menu | Commands (MP) |
|---|---|
| Top level | **Attack** (0x3000; weapon formula 1 power 16, physical, Piercing), **Item** (0x3001; shared bag), Escape (0x3003; disabled by the script), **Requiem** (0x30E3) when the gauge is full |
| Black Magic | Fire 0x3042, Thunder 0x3043, Water 0x3044, Blizzard 0x3041 (MP 4, power 12); Fira 0x3045, Thundara 0x3047, Watera 0x3048, Blizzara 0x3046 (MP 8, power 24); all formula 3, reach 3, piercing flag, reflectable, silenceable |
| White Magic | Cure 0x302B (MP 4, power 24), Cura 0x302C (MP 10, power 40), Scan 0x3032 (MP 1), NulBlaze 0x302F, NulShock 0x3030, NulTide 0x3031 (MP 2 each, rank 2, party-wide) |
| Not in his list | NulFrost, Esuna, Haste, Life, Dispel, Curaga, the third magic tier, Demi, Summon, Anima in any form (Switch is disabled for everyone in this fight) |

**Reach (section 4):** his Attack has reach 0, so it cannot target the head (BattleDistance 1); all his spells, Scan and Requiem have reach 3 and can. Yuna's and Auron's plain Attack cannot target the head either.

Recoveries: tick speed 10; Attack / spells rank 3 = 30 ticks; Nul spells and items rank 2 = 20; Requiem rank 4 = 40. He has 999 MP, so MP is effectively free.

### 7.4 Requiem and the Stoic gauge (A for the record, B for the gauge rule)

* **Requiem (0x30E3)**: user 7 only, formula 3 (MAG vs MDF), power 40, 1 hit, **all enemies**, rank 4, Overdrive cost 100, damage type magical (Shell halves it), can crit, **no piercing flag**
  (an Armored arm takes a third), no element, no status. It hits the body, the head and both living arms in one action (the body's shield rule does not touch magical commands).
* **Gauge.** Mode Stoic: for each hit record in which a **monster** damages Seymour, the gauge gains `floor(damage x 30 / his max HP) + 1` (a hit of any size gives at least 1; max HP 1,200). It
  starts at 0 and the cost is the whole gauge (100). Examples (D): body Attack 111 gives 3, Thunder 98 gives 3, Venom 229 gives 6, a Demi from full HP (300) gives 8, a Demi from 600 HP gives 4.
  Nothing in the scripts or the event raises it.

### 7.5 Anima

Anima does not appear in either Gui formation (only the four Gui parts are listed) and no script summons her. Seymour's command table has no summon. (Her data, `m125`, belongs to the Macalania boss fight and is covered in
`research/re-ffx-ai-seymour.md` section 3.6.) If Yuna summons an aeon in fight 2 (the formation scripts do not disable Summon), the aeon replaces the party on the field, Frontline becomes the aeon alone, and Gui's Attack and Demi
then aim at it (B, from the party-swap routine documented in the Seymour note).

## 8. Worked numbers (D: formulas of `research/re-ffx-damage.md`, example inputs, variance factor 240 to 271, no crit, no element, no Protect or Shell)

| Hit | Range |
|---|---|
| Body Attack, fight 1 (STR 29) against DEF 25 / DEF 10 / DEF 1 | 618..698 / 690..780 / 736..832 |
| Body Attack, fight 2 (STR 15) against Seymour (DEF 25) / DEF 10 / DEF 1 | 105..118 / 117..132 / 125..141 |
| Body Thunder (MAG 20, power 12) against Seymour (MDF 100) / MDF 20 / MDF 1 | 92..104 / 189..213 / 217..245 |
| Body Venom (MAG 20, power 24) against Seymour / MDF 20 / MDF 1 | 215..243 / 437..494 / 502..567 |
| Demi (power 4, formula 5) | exactly 4/16 of the target's current HP, no variance |
| Seymour Fire family (power 12) against the fight-2 body, head or arm (MDF 1) / fight-1 body (MDF 30) | 602..680 / 487..550 |
| Seymour Fira family (power 24), same targets | 1,273..1,437 / 1,029..1,162 |
| Requiem (power 40), same targets, per target | 2,271..2,564 / 1,835..2,072 |
| Seymour Attack (STR 20) against the body unshielded (DEF 1) / shielded (DEF 100) | 260..294 / 111..125 before Defend's halving |

Fira-family spells kill an arm (800) or the fight-2 head (1,000) in one cast (Fire-family spells never do). Requiem on an Armored arm does one third, 757..854, which is lethal for 18 of the
32 variance values (56 percent). The fight-2 body (6,000) falls to 5 Fira casts or 3 Requiems. The overkill thresholds are 800 (body), 800 (head) and 500 (arm); the rule that sets the overkill
bit is in `research/re-ffx-damage.md` section 6.

## 9. Rules a build must reproduce

| # | Rule | Where | Label |
|---|---|---|---|
| G-01 | Two fights; actors 20 body, 21 head, 22 and 23 arms; positions of section 2.2; normal start; Escape and Flee off; Switch off in fight 2 only | formations | A |
| G-02 | Victory when the body dies, whatever the other parts do; defeat when the whole party is at 0 HP (Seymour counts) | 0x7928d0 | B |
| G-03 | Fight 2 overrides: body HP 6,000, STR 15, MDF 0 (1 in play); head HP 1,000; body AP 0 / 0; drops left; acceleration line 12,000 | m117 init | A |
| G-04 | Fight 1: body drop chances 0; acceleration line 4,000 (strict, HP below) | m117 init | A |
| G-05 | Stat, affinity, status and loot rows of section 3; Threaten never lands; Armor Break only on arms; Power Break and Provoke only on the body | rows | A / B |
| G-06 | Body turn: regrowth test (both arms dead), then Demi if counter >= 2 else Attack (Provoker if Provoked, else random living), counter + 1, plus a 50 percent extra step while under the line | m117 onTurn | A |
| G-07 | Head cycle 1, 2, 3 with the relay; Thunder and Venom are the body's reactions (MAG 20, no CTB cost); a damaging hit in state 3 resets to state 1; the head's recovery is 36, the body's 42 | m160, m117 | A / B |
| G-08 | Shield on commands that affect HP with the physical flag only while an arm lives: DEF 100, Armored, Defend for that command, cleared after the hit; spells, Overdrives, Lancet, Steal and statuses pass | m117 onTargeted / onHit | A |
| G-09 | Head BattleDistance 1: only reach 1+ commands can target it | m160 init | B |
| G-10 | Arms: no turns, Armored by record, 800 HP, regrow together on the body's 3rd or 4th turn (50 / 50) once both are dead; reset clears statuses; their drops stay 0 | m161, scene 1 | A / B |
| G-11 | Every death of a part pays its gil and AP (body 1,000 / 400 or 600; head 200 / 48 or 72; arm 300 / 37 or 55); fight-2 body pays 0 AP; items only from the fight-2 body (3 or 6 Key Spheres) plus one gear piece | loot | A / B |
| G-12 | Seymour: row 7 values of 7.2; the command list of 7.3; Requiem and the Stoic rule of 7.4; player-controlled; gauge starts at 0; leaves after the fight | events, `ply_save` | A / B |
| G-13 | Opening counters and recoveries of 5.7; draw order of 5.8 | engine | B |
| G-14 | No Sin, no Anima, no scripted party actions, no time limit in either battle | scripts | A |

## 10. Answers to the driver's open questions (`research.md` section 12), and corrections

| Q | Answer | Status |
|---|---|---|
| Q-1 pairing | `kernel/btl.bin` gives the group ids: **kino02 = 0x00DE, kino03 = 0x00DF**; with the formation numbers 0 and 10 the ids are 0x00DE0000 = `kino02_00` (fight 1, launched by `kino0200.ebp`) and **0x00DF000A = `kino03_10`** (fight 2, launched by `kino0300.ebp`, the event that builds the Yuna / Seymour / Auron party). `CurrentBattle() == 0x00DF000A` in m117 and m160 is therefore fight 2. Not just consistent: proved by the table and the launches. | answered (A) |
| Q-2 run the scripts | Done in two interpreters (section 0): head cycle and cancel rule (only state 3, damage above 0), relay through `[04]`, body counter in both fights (**opening is Attack, Attack, Demi**, alternation after; fight 2's extra step always on), regrowth 3rd / 4th turn 50 / 50, shield catches only type-1 commands. **Your four leftovers:** (1) RNG streams: stream 2 (`GetRandomValue`) and stream 4 (`findMatchingChr`) only, counts per script in 5.8; (2) the Provoke branch: Attack goes to the Provoker with no draw, Demi is unchanged (5.2); (3) scenes B0 to B3: they write only animation variants, and scene 1's arm reset with its icon and drop-chance rewrites (5.6); (4) reaction ordering: a kind-1 record is appended and runs after the triggering action completes, with no CTB cost (section 6, 0x7929b0 chain). | answered (A / B) |
| Q-3 `readCommandProperty` | Property 1 is the damage-flag word `& 3` (bit 0 physical, bit 1 magical; 0 = neither, 3 = both), property 2 the HP damage-class bit, 3 and 4 the MP and CTB class bits, property 0 the formula byte: your revised reading ("0 none or Other, 1 physical, 2 magical, 3 both") is the engine's. The earlier reading "3 = other" is not: **Venom, the party and aeon Overdrives (Requiem excepted, it is 2) and Lancet are 0**, and no command is 3. Handler 0x78cd30. | answered (B) |
| Q-4 commands the shield catches | The 44 commands of `raw\out\shield-list.txt` (physical flag only); **Lancet, Wakka's Reels, Kimahri's Rages, Tidus' and Auron's Overdrives and all aeon Overdrives are type 0 and are not caught; the aeons' ordinary physical abilities are type 1 and are caught (they pierce Armored but meet DEF 100 and Defend); Requiem is type 2**. Your leftovers: the monster-side commands cannot reach the shield (a reflected Thunder is type 2 and a reflected Venom is type 0; Provoke only redirects Gui's own Attack onto a party member), and Wakka's Reels are type 0 in the table, so they are never shielded (the table is the whole rule; a play check would only confirm it). Correct `research.md` 3.2 and 4.5 ("other (3)" and "Overdrives of type Other meet it") if those words are still there. | answered (A) |
| Q-5 fight-2 overrides | Read back by running the init with the fight-2 id: HP and max HP 6,000, STR 15, MDF 0 (clamped to 1), head 1,000, body AP 0 / 0; drops left at the record; fight 1 writes the three body drop chances to 0 (so fight 1 pays no items and no gear from the body, A). A live-battle read was not possible (the game is not run in this lane). | answered (A) |
| Q-6 banking of fight 1's rewards, no spoils screen | Gil and AP are added to the reward list at each death; the party is paid at the end of battle. I found **no** flag in the two launch words that hides the results panel (bit 8 removes the fanfare / pose request; bit 16 skips the pose wait in fight 2). The "no spoils after fight 1" claim is not supported or refuted by the files I read. Equipment and Key Spheres can only come from fight 2 (fight 1's body drop chances are 0). | partial (B); see 11 |
| Q-7 Seymour's record | Section 7.2: commands Attack, Item, Escape, Cure, Cura, NulBlaze, NulShock, NulTide, Scan, Blizzard, Fire, Thunder, Water, Fira, Blizzara, Thundara, Watera (**no NulFrost, Esuna or Haste**); Overdrive mode Stoic, gauge 0, max 100; weapon row 26, armour row 27; Luck 18; actor 7 confirmed by `addPartyMember(7)`. | answered (A) |
| Q-8 Requiem | Magical flag (Shell applies), can crit, **no piercing flag**, rank 4, cost 100, all enemies; same gauge code as any party member. The wiki's camera remark is a presentation matter: not read. | answered (A / B) |
| Q-9 Stoic for a guest | `floor(damage x 30 / maxHP) + 1` per damaging monster hit (note the added 1); max 100; start 0. | answered (B) |
| Q-10 Venom and Demi | Venom: Poison 100 and Slow 100, damage type 0, **Slow duration 0 (no Slow counter; removes Haste)**. Demi: formula 5 power 4, piercing flag, magical, 25 percent of current HP. "Ignores Heavy and Tough" is not a property I could find on the command. | answered (B) |
| Q-11 status bytes | Threaten byte 0 on all parts and the engine reads it as a success percentage, so **it never lands**; Power Break and Provoke land on the body only; Armor Break lands on the arms only; the wiki's "Capture immune" has no byte in the row. | answered (A / B) |
| Q-12 save variable 0xa7c | Written by the body at its death (+1 / +2 for arms 22 / 23), read only by `kino0300.ebp`'s four-way cutscene branch. No gameplay effect. | answered (A) |
| Q-13 in-battle size | not read in this lane | not mine |
| Q-14 party preset | not in the game files (player data) | not mine |
| Q-15 Summon in fight 2 | The formation does not disable Summon; with an aeon out Frontline is the aeon alone and Demi / Attack aim at it; whether anything else blocks it was not found. | answered (B) |
| Q-16 staging facts | Section 2.2: positions, map centres, attach points 2, 4, 5. The camera and layer toggles are in the formation's camera worker (not decoded further). | partial |

**Corrections to `research.md`:**

1. §3.2 and §4.5: Lancet, Overdrives and every non-physical-flag command are **not** shielded; "damage type other (3)" does not exist in the tables (the Overdrives and Venom are 0).
2. §2.3 and §11 G-10: Threaten is effectively **immune** (byte 0 = a 0 percent success chance), not "landable".
3. §5.1: the staff and armour records show **slots byte 4** with one ability each (Piercing, Sensor); the "one slot" reading comes from the wiki.
4. §5.4 / Q-9: Stoic's gain is `floor(damage x 30 / max HP) + 1` (add 1); the percent figures there (damage / 40) are about 1 point low per hit.
5. §3.1: Venom's Slow does not slow (duration 0); it only removes Haste.
6. §6.1: Ifrit's Hellfire is special-cased in the body's script (it detaches the parts), but I found nothing that gives the player Ifrit at the Ridge; treat the Ifrit line as unverified.
7. Confirmed: elements neutral (Jegged outvoted), body opening Attack, Attack, Demi (wiki reading outvoted), regrowth 3 or 4 turns, fight-2 numbers (MDF is 1 in play, as your derived numbers already floor it), rewards per death,
   head out of melee reach, the cancel window, Seymour's record (HP 1,200, MP 999, 20 / 25 / 35 / 100, AGI 20, LCK 18, EVA 10, ACC 10).

## 11. What is still open

1. **Results panel and banking of fight 1's rewards.** The launch words differ (0x4501 against 0x14504); I traced their end-of-battle readers but not the results-panel code (0x788c60 family). Settle in the running game
   or by reading the results-panel start condition.
2. **Which arena area applies in fight 1** (the file holds two area records; the random-position flag is off, so area 0 is assumed).
3. **The menu opened on the black screen after fight 2** (id 0x40011100 passed to `showModularMenu`; not identified) and the FMV contents (ids 32 and 36).
4. **The meaning of the written-but-unclassified properties** (135, 241, 158, 163, 164, 218, 219, 228 to 234, 278, 291; motion values): presentation-class by the setter's shape, not decoded.
5. **Seymour's gauge start** is the row's 0; no script raises it. If the game's own play shows him starting with a charged gauge, something outside the files read here sets it.
6. **Whether Seymour can be chosen as the owner of the gear drop** (the owner rule counts members who have joined; he has the joined flag during the fight).
7. **Pop-up for Venom's Slow with duration 0**, and whether a Hasted party member visibly loses Haste.
8. **Yuna's Summon in fight 2** end to end (hand-off of the party and the return), by play.
9. The party's stats, gear and Sphere Grid state at the Ridge are player data, not in the files.

## Appendix: files in `raw\`

* `extract\` the 89 battle files plus the ten `kino` event scripts (about 1.8 MB), the original archive is untouched.
* `dis\` disassemblies: `m117 m160 m161 m124 m125`, `btl-kino02_00`, `btl-kino03_10`, the other Gui formations, and `ev-kino0000..0900` (field events).
* Interpreters and tests: `sim.mjs`, `sim2.mjs` (copies of the Seymour / Evrae lanes' files with the extraction path changed), `gui-world.mjs`, `t-gui-body.mjs`, `t-gui-parts.mjs`, `t-gui-vm.mjs`, `t-gui-extra.mjs` (Provoke branch, scene effects); outputs in `out\`.
* Readers: `mon-full.mjs` (stat row and loot), `plysave.mjs`, `gear-tbl.mjs`, `gear.mjs`, `cmd-dump.mjs`, `cmd-reach.mjs`, `cmd-user.mjs`, `btlbin.mjs` (battle group table), `shield-list.mjs`, `od-list.mjs`, `ctb-base.mjs`, `dmg-final.mjs` (section 8), `ebp.mjs` (field events), `scan-events.mjs`, `scan-savevar.mjs`,
  `export-json.mjs` (`out\gui-data.json` holds every number of sections 3, 4 and 7).
