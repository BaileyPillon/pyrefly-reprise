# FFX-2 boss AI read from the game's own scripts: Yojimbo and Daigoro in the Cavern of the Stolen Fayth ("Tourist Trap")

**Game case: FFX-2 only.** FFX's Yojimbo is a different record with a different script on a different engine
([ffx-yojimbo.md](ffx-yojimbo.md) §2); nothing here applies to FFX. This note covers the one FFX-2 fight that uses monster rows 170
(Yojimbo) and 174 (Daigoro): formation 1847 `nagi05_229`, the optional mission "Tourist Trap" (our hidden chapter `ch-tourist-trap`).
Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)), P6 (boss AI follows the scripts). Written
2026-10-14 by the RE parity session for the release driver. Research only: no engine or AI code is changed by this note. It continues
[re-ffx2-yojimbo-valefor.md](re-ffx2-yojimbo-valefor.md) (the monster rows of Yojimbo, Daigoro and Valefor, which this note does not
repeat) and [re-ffx2-ai-bahamut-vegnagun.md](re-ffx2-ai-bahamut-vegnagun.md); that note's section 1 (polls, random streams, target
searches, the inert time-out block) applies here unchanged.

**What is in this note.** The AI is the developers' own script source shipped in the archive, checked against the compiled package
beside it. Move rows come from `monmagic.bin`. Everything is written in our own words: no script text, no decompiled code and no game
text is reproduced. Scripts are cited by line number (`m170.src:86-90`), compiled scripts by code offset in the disassembly
(`0x01c5`), moves and monsters by their identifiers.

**Tags (one per fact).**
**[src]** read from the `.src` text, with line numbers.
**[bin]** confirmed in the compiled package, with the code offset the lane's disassembler prints.
**[row]** read from `monmagic.bin` / `monster.bin`.
**[note]** proved by an earlier checked note (file and section).
**[computed]** derived here from the above (the method is stated where it is used).
Two more mark what is not settled: **[open]** the evidence does not decide it, and **[review run]** a measurement of the branch
`origin/ch-tourist-trap` taken by the RE session's review of it (2026-10-14, branch commit 36b37ed2) and not repeated here; the ten
differences of §9 come from that review, and every code reference in §9 was re-read at 36b37ed2. A trailing **M** (as in the sibling notes)
means the earlier note read the fact from the code without running it.

## Main findings in one screen

1. **Daigoro is not a Yojimbo move; he is an actor with his own gauge.** When Yojimbo's roll picks "the dog", the script only raises a
   battle-wide flag and queues nothing. Daigoro (row 174: Lv 30, HP 1, MP 1, STR 42, AGI 120) is polled on his own gauge, and when he
   finds the flag up he lowers it and bites one living girl with row 0x40a5, chosen by the near-weighted pick (Yojimbo's own targets
   are uniform). His reaction, menu, targeted and death handlers are empty (§4.4, §5).
2. **A poll that queues nothing leaves Yojimbo ready, so he is polled again on the next logic step.** The counter rises by 8 on every
   poll, dog picks included, so a dog pick costs one step, not a turn. Zanmato is queued on the **14th poll** of every cycle, always,
   but that is **not** his 14th visible move: 13 polls precede it and on average 7.25 of them are real actions and 5.75 are dog picks
   (§4.2, §7).
3. **Order inside a poll: Zanmato test, then the +8 raise, then the band on the raised value.** The test is on the old value (100 or
   more), the bands (70 and above, 30 to 69, below 30) on the new one. Polls 1 to 3 see 8, 16, 24; polls 4 to 8 see 32 to 64; polls 9 to
   13 see 72 to 104 (§4.2, §4.4).
4. **The roll-to-move tables.** 70 and above, roll mod 4: 0 Wakizashi B, 1 Wakizashi A, 2 Kozuka, 3 dog. 30 to 69, roll mod 4: 0 Kozuka,
   1 Wakizashi A, 2 and 3 dog. Below 30, roll mod 3: 0 Kozuka, 1 and 2 dog (§4.3).
5. **None of the five moves rolls to hit and none can crit** (accuracy formula 0 on every row). Wakizashi A and B and the dog's bite are
   physical (formula 0, power 16, 13 and 16); Kozuka takes 25 percent of one girl's current MP and inflicts Poison at chance 100;
   Zanmato takes every living girl's HP and MP down to 1 and is softened by neither Protect nor Shell (§6).
6. **Pace comes from the rows.** At AGI 120 an ordinary move rests 105 steps (3.50 s), the dog's bite rests 87 steps (2.90 s), Zanmato
   charges 105 steps and then rests 174 steps (5.81 s). Counting only the rows, a Zanmato cycle is about 1,046 steps, about 35 s (§6.3,
   §7).
7. **Yojimbo's choices depend on his counter and two random draws, nothing else.** His reaction entry is empty, the poll reads no HP,
   MP or status, and no hit moves the counter (§4.1).
8. **His "battle too long" block is dead code**: the same guard as Bahamut's, true only when no girl is alive and un-petrified, a state
   in which the ATB clock does not step (§4.6).
9. **The branch `origin/ch-tourist-trap` (36b37ed2) differs on ten counts**, the first of which is the dog being a Yojimbo turn
   (§9).

## 1. Source block

| Item | Value |
|---|---|
| Archive | `FFX2_Data.vbf`, the Steam HD Remaster (FFX-2 half), the owner's own install, 17,867,755,272 bytes. As in the sibling notes: Steam build 25501027, FFX-2.exe SHA-256 `6EA7F142...CD69` (the exe was not re-hashed for this note) |
| Reader | our own VBF reader (standard library only, opens the archive read-only), kept outside the repo; a short extraction script run with `python -I` pulled the files below, hashes taken from the extracted bytes |
| Tools (by name) | the Atel disassembler `x2dis.mjs` (battle call names from the game's own header), the row printer `moves.mjs` and the row decoder `ffx2-abil.mjs`, the source-against-binary checker `cmp-src-bin.mjs` (all from the Leblanc-den-Ixion lane, kept outside the repo), the package header reader `atel.mjs`, and four short scripts of this note's own (row parser, statistics, step model, source table). All kept outside the repo |

Files read (paths inside the archive; size in bytes; SHA-256):

| Path | Size | SHA-256 |
|---|---:|---|
| `ffx_ps2/ffx2/master/jppc/battle/mon/m170.src` | 3,566 | `c350e362718f4c3f692f8fb1b74120748cfe9d991d41238b5dddc43f118a2ea6` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/_m170/m170.bin` | 105,024 | `5728ce749ce137a1ebde7a252e29c891682da7b141287b57ff80be0f97c7f1d8` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/_m170/mm170.src` | 540 | `182272de3638c9a7ca16f245870b716fa2e6adf624e3939695a43431814afa1e` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/_m170/mt170.src` | 886 | `47836e8d41d46b12e9a560c1331dc1b32bde1b81836bf4674e37de6cb220106e` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/mt170.src` | 2,666 | `c9328c4a764cf23b87c42763410514acd220bb39e24df4c0a1775322ec8cbde4` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/m174.src` | 1,045 | `92818c76bbc3e5515f703a3e91aa63b2305d57662cffc903329248803bcf2edd` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/_m174/m174.bin` | 41,264 | `122b6e5ca8fdb9e6e2b0185c0d5ae476392f50830e60f1b9742fb47774e73c19` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/_m174/mm174.src` | 478 | `76aae673d19e6d176dbb92f092fbc07a6f35b5f5f1f1bebb3dba9fd63b82ea38` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/_m174/mt174.src` | 719 | `77c47ea8013f516dc35d1df4bf177ed79f77617d3dcb6738cd3c8b055bcc4462` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/mt174.src` | 2,614 | `214c370c9ab444e06e43e389943fcde555a2eb26051c8a27f1d77789a9052dcf` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/m168.src` | 7,965 | `eaa82f7b478f7190d443598215c823c4a0ad7c43fc0967147fcb963a18efa387` |
| `ffx_ps2/ffx2/master/jppc/battle/mon/_m168/m168.bin` | 65,408 | `2495bb499d84fb64f3346b6d836c89f4b6d3ac1f0b748129f832b288e741d841` |
| `ffx_ps2/ffx2/master/jppc/battle/kernel/monmagic.bin` | 85,222 | `35b432bbbec34bac06d1fad293eba5cc4cb7eb766441b6b8eaa6ce301c6c3279` |
| `ffx_ps2/ffx2/master/jppc/battle/kernel/monster.bin` | 96,596 | `50964278e7b164e6c93f51b2bbacad054104e3142ef47f05f726e3377e3ec504` |
| `ffx_ps2/ffx2/master/jppc/battle/kernel/btl.txt` | 781,815 | `a2a9d7e0a28559f76da0661c47740f00066a6605afd7cd988022468f0a193c46` |
| `ffx_ps2/ffx2/master/jppc/battle/btl/nagi05_229/nagi05_229.bin` | 2,060 | `6ed911b9694e8f7fad872a75e6ca303272e64774175815fe6bf03f2d0bd0946a` |
| `ffx_ps2/ffx2/master/jppc/battle/btl/nagi05_229/pos_nagi05_229.psc` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `ffx_ps2/ffx2/master/jppc/battle/btl/nagi05_229/evt_nagi05_229.src` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `ffx_ps2/ffx2/master/jppc/battle/btl/nagi05_229/scn_nagi05_229.src` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `ffx_ps2/ffx2/master/jppc/battle/header/btlhead.src` | 74,969 | `8d113cf4a2eb8b191e71b085da34c050df4fb2d8dfb8d2eac9eda56c5778cec7` |
| `ffx_ps2/ffx2/master/jppc/battle/header/btl.h` | 78,776 | `3f9235cdb1dbcd7df70aa92f68651365327946ac588a7cd42b9e67a499f992f8` |
| `ffx_ps2/ffx2/master/jppc/battle/header/local.src` | 15,658 | `12283162eb76145310b57c5a113cc8f9a6b2106322ed9c42d286f80b436c319f` |
| `ffx_ps2/ffx2/master/jppc/battle/header/monmagic.ath` | 27,755 | `fa2326c573051e06c1b682ac355d4c57ba1c54c105097e8e098a5f299114f86b` |
| `ffx_ps2/ffx2/master/jppc/battle/header/btlatel.ath` | 11,178 | `7348da54ad391473998cdaa263a0b06e5825f5212209e059e04c3c6c6549a58a` |
| `ffx_ps2/ffx2/master/jppc/battle/header/command.ath` | 22,651 | `04d9cd36dd2840f4cb06fa9bbc398417ea58fdb77218512afa10cea15bfd5926` |
| `ffx_ps2/ffx2/master/new_uspc/battle/kernel/monmagic.bin` | 89,185 | `2bb41633b94885b3fe6a6ec6c8cbb9fae43e89d8d387e8cbcf5c3c37d852b0d7` |

`pos_nagi05_229.psc`, `evt_nagi05_229.src` and `scn_nagi05_229.src` are present in the archive with size zero (the SHA-256 shown is
that of empty input). `m168.src` and `_m168/m168.bin` (Bahamut) were read only to compare the guard of the time-out block (§4.6). The
`mt###.src` and `mm###.src` files are motion-setup macros (run speeds, stand-off distances) with no AI in them.

## 2. How this was checked

- **Script against binary.** For both actors the set of command ids the source issues (names resolved through the game's own
  `monmagic.ath`) equals the set in the disassembly of the compiled action and death entries: Yojimbo ten ids (0x40a1 to 0x40a4,
  0x40b2, 0x4232 to 0x4236), Daigoro one (0x40a5), no id on either side only; the `random() mod` moduli are the same list on both
  sides (4, 4, 3 for Yojimbo, none for Daigoro). The control flow, thresholds and constants of both action entries were then read
  side by side, branch by branch (offsets in §4.2). The compiled-script offsets are code offsets as the disassembler prints them,
  the same convention as the sibling notes.
- **Entry layout.** Both packages carry the same entry order. The tag table `[2,4,5,3,6]` [bin; note: bahamut-vegnagun §1.1] maps the
  engine's kinds to functions: action = function 2 (Yojimbo entry 0x00f6, Daigoro 0x00ce), reaction = 3, menu = 4, targeted = 5, death =
  6. Initialisation is function 0, the idle "main" function 1 (a bare halt).
- **Rows.** The five move rows (and the Die row) were parsed twice: with the lane's decoder and with a separate short parser written
  from the layout in [re-ffx2-commands.md](re-ffx2-commands.md) §1. Both give the same values (§6.1). The stat record embedded in each
  compiled package (bytes 8 to 199) equals the `monster.bin` row (170 and 174), as the Bahamut note found for its actors.
- **Variables.** The script's variable table was read from the package header: both actors' flag is the battle-local variable at
  block offset 0x24, which the game's `local.src` declares as the battle flag `bf_keisuke00` (the tenth integer of the block, the same
  variable the Leblanc scripts use in their own scenes [note: leblanc-den-ixion §1.5]); Yojimbo's counter, random roll, target and the three action counters are in his private block (28 bytes), Daigoro's
  target in his (12 bytes). Both private blocks have private-data offset 0, i.e. no initial image [bin].
- **Confidence.** Anything tagged [note] is as sure as the earlier note; this note did not re-run the engine functions it leans on and
  ran no game. The step model of §7 is a model, not a measurement.

## 3. Engine rules these two scripts lean on (from the sibling notes; nothing new is claimed here)

| Rule | Where proved |
|---|---|
| A ready actor is polled once per logic step; **if the action entry queues no command the actor falls back to the start of the gauge state machine and is ready again on the next step** (exactly one poll per step while the clock runs). Several `setdircom` calls in one poll form one batch. | [note] fallen-trema §1.1; bahamut-vegnagun §1.1; leblanc-den-ixion §1.1 |
| Logic rate 29.97 steps a second; a gauge falls 95 units a step at Normal speed; recovery = `cost_atb x 10000 / (AGI + 1)` units and charge = `cost_cast x 10000 / (AGI + 1)`; step counts are rounded up. | [note] timing-measured §3; bahamut-vegnagun §1.1 and the notation of §0 |
| `random()` is the low 16 bits of one draw of **global stream 2**; `random() % n` is a plain uniform pick. Target searches draw on **global stream 4**; with one candidate nothing is drawn. | [note] bahamut-vegnagun §1.3, §1.4 |
| `searchr_nop` (the search call's last argument 0) is a **uniform** pick among the living, targetable candidates in slot order; `searchr` (last argument 1; the game's header defines the modes 0 uniform, 1 near, 2 far) is the **near-weighted** pick: weight `1 + floor(32768 / floor(cost + 1))`, `cost = (1 + d) x (1 + 2 x abs(a))` with `d` the ground distance and `a` the angle from the actor's facing. "Alive" means not flagged dead (a petrified girl is alive). | [note] bahamut-vegnagun §1.4; leblanc-den-ixion §1.3 |
| The reaction entry runs once per result applied to the actor; an actor with an empty reaction entry does nothing about hits. | [note] leblanc-den-ixion §1.2; bahamut-vegnagun §1.5 |
| Thinking time after a command is **30 steps for every girl who is dead or petrified**; the monster record's own thinking byte is never read (Daigoro's byte 1 is inert). | [note] atb-status §3.4; fallen-trema §1.6; leblanc-den-ixion §1.4 |
| Variables with no initialiser start at 0 (every consumer assumes it; allocation not traced). | [note] fallen-trema §1.3 (tag M) |
| Scripted commands carry no "all targets chosen" byte, so the multi-target damage halving never applies to a boss move. | [note] fallen-trema §1.1 |
| The cursor flag off makes an actor untargetable (the search filters on it); an actor with the cursor flag off (the Head until phase 2) or the existence flag off (the Redoubts) still runs its script. The existence flag off is read as "does not count toward victory" (inferred from the flag). | [note] bahamut-vegnagun §1.4, §4.1, §6, §6.1 (tag M for the victory reading) |
| A queued command's target mask is rebuilt only when every member is invalid, or, for instant rows, when some are. | [note] leblanc-den-ixion §1.12 |

## 4. Yojimbo (m170): the poll in words

### 4.1 Layout and initialisation

- **Initialisation** [src 25-42; bin 0x0006-0x00f1]: the death pattern is "falls, cannot be raised" (0x00a2); movement is disabled
  (0x00ae); the two "invincible during motion" flags are cleared (0x00ba, 0x00c6); the three private action counters are zeroed
  (0x00e2, 0x00e8, 0x00ee). **The limit counter and the dog flag have no initialiser**, so they start at 0 [note: fallen-trema §1.3,
  M]. In one other scene, `crcr00_099` (no formation row of `btl.txt` names it; the sibling notes' arena scenes are the `crcr00_09x`
  family, so it is probably the arena copy of this fight, [open]), the init sets his EXP stat to 1,000 (0x00d0 to 0x00dc); in
  `nagi05_229` the row's 2,000 stands [row; src 33-36].
- **Reaction, menu and targeted entries are empty** [src 165-175; bin 0x0331, 0x0332, 0x0333]. Nothing a girl does changes his counter
  or his choices.
- **Death entry** [src 177-184; bin entry 0x0334, the queue at 0x0340]: if a death reaction is allowed, he queues his own Die row 0x40b2 on himself.
- **The only state he keeps** is the limit counter (private variable), plus the dog flag he writes; the script calls the counter its
  "limit gauge". The three other private variables (action count, a reaction count that nothing reads, a warning stage) belong to the
  inert block of §4.6.

### 4.2 The action entry, in the order the script tests it

| # | What happens | Source lines | Compiled offsets |
|---|---|---|---|
| 0 | the "battle too long" guard, action count and warnings: **never runs in play** (§4.6) | 50-84 | 0x0103-0x01bd |
| 1 | if the counter is **100 or more**: counter back to 0; queue **Zanmato (0x40a4) on the whole party group**; the poll ends | 86-90 | test 0x01c5, reset 0x01cb, queue 0x01d4 (jump to the end, 0x0330) |
| 2 | otherwise the counter is **raised by 8** | 93 | 0x01e1 |
| 3 | if the **raised** value is 70 or more: roll `random() mod 4` and choose by the table of §4.3 | 94-122 | band test 0x01eb, roll 0x01f5, moves 0x0214-0x0273, dog flag 0x027c |
| 4 | else if the raised value is 30 or more: roll `random() mod 4` | 125-145 | band test 0x0289, roll 0x0293, moves 0x02b2-0x02e6, dog flag 0x02ef |
| 5 | else: roll `random() mod 3` | 146-158 | roll 0x02fc, move 0x031b-0x0324, dog flag 0x032d |
| 6 | end of entry | 163 | 0x0330 |

Every single-target move (Kozuka, Wakizashi A, Wakizashi B) is aimed with one uniform pick over the living girls, `searchr_nop` over the
whole party group with the "alive" filter [src 99, 106, 113, 130, 137, 151; bin search call with last argument 0 at 0x0214, 0x023f,
0x026a, 0x02b2, 0x02dd, 0x031b; note: bahamut-vegnagun §1.4]. Zanmato takes the whole party group, KO'd girls included in the mask; the
hit step skips a girl who is down [note: damage §2 target gate: a command without the "may target the dead" flag needs a living
target; leblanc-den-ixion §1.12 for the mask, the skip itself not run].
The script's own macro names tell A from B by a one-word mark ("single" on A, "all" on B); B is aimed at **one** girl like the others
(see §8 for what the multiple-target flag on its row may widen).

The test of 1 is on the counter's value **before** the raise; the bands of 3 to 5 are on the value **after** it. The counter is never
cleared except by Zanmato.

### 4.3 The roll-to-move tables [src and bin agree on every cell]

| Band (raised counter) | Roll | roll 0 | roll 1 | roll 2 | roll 3 | Probabilities |
|---|---|---|---|---|---|---|
| 70 and above (polls 9 to 13) | `random() mod 4` | **Wakizashi B** (0x40a3) | **Wakizashi A** (0x40a2) | **Kozuka** (0x40a1) | **dog flag** | each 1/4 |
| 30 to 69 (polls 4 to 8) | `random() mod 4` | Kozuka | Wakizashi A | dog flag | dog flag | Kozuka 1/4, Wakizashi A 1/4, dog 1/2 |
| below 30 (polls 1 to 3) | `random() mod 3` | Kozuka | dog flag | dog flag | none | Kozuka 1/3, dog 2/3 |

Compiled cells: 70-and-above band, roll 0 queues 0x40a3 at 0x021d, roll 1 queues 0x40a2 at 0x0248, roll 2 queues 0x40a1 at
0x0273, anything else sets the flag at 0x027c. 30-to-69 band: roll 0 queues 0x40a1 at 0x02bb, roll 1 queues 0x40a2 at 0x02e6, else flag at
0x02ef. Below-30 band: roll 0 queues 0x40a1 at 0x0324, else flag at 0x032d. The marginal odds do not depend on the order of the cells; the
order matters only to anyone replaying the game's own draws.

### 4.4 Polls, bands and the dog flag

With the counter starting at 0 [note: fallen-trema §1.3, M], each poll takes it up by 8 and the band test sees the new value:

| Polls | Raised counter | Band | What the poll does |
|---|---|---|---|
| 1, 2, 3 | 8, 16, 24 | below 30 | Kozuka 1/3, dog 2/3 |
| 4, 5, 6, 7, 8 | 32, 40, 48, 56, 64 | 30 to 69 | Kozuka 1/4, Wakizashi A 1/4, dog 1/2 |
| 9, 10, 11, 12, 13 | 72, 80, 88, 96, 104 | 70 and above | Wakizashi B, Wakizashi A, Kozuka, dog, each 1/4 |
| **14** | (104 is read, then reset to 0) | Zanmato test | **Zanmato on the whole party**, counter 0, a new cycle starts |

[computed] from §4.2: thirteen raises (8 x 13 = 104) are needed before the test sees 100 or more, so Zanmato is the 14th poll.

**The dog pick.** The "dog" cell sets the battle-local flag to 1 and issues no command [src 118, 142, 156; bin 0x027c, 0x02ef,
0x032d]. Yojimbo therefore stays ready and is polled again on the next logic step [note: fallen-trema §1.1], with no recovery, no
charge and no animation of his own, and with the counter already raised. A run of dog picks is a run of consecutive steps, and each
step adds 8. The flag is a single on/off value, not a count: a pick made while the flag is still up changes nothing.

### 4.5 Random draws per poll

| Draw | Stream | Used for | Proved by |
|---|---|---|---|
| `random()` (low 16 bits) | global stream 2 | the roll of §4.3 (one draw per band poll; none on the Zanmato poll) | [note] bahamut-vegnagun §1.3; [bin] the `GetRandomValue() mod` at 0x01f5, 0x0293, 0x02fc |
| target pick, uniform | global stream 4 | one draw for each single-target move, only when two or more girls are alive | [note] bahamut-vegnagun §1.4; [bin] search call, last argument 0 |

A dog pick draws only the roll. The modulo bias of `mod 3` and `mod 4` on 16 bits is below 0.01 percentage points and is ignored, as in
the sibling notes.

### 4.6 The "battle too long" block is inert

The first 35 lines of the action entry [src 50-84; bin 0x0103-0x01bd] count actions and, in scene `nagi05_229` only (scene constant
0x01ae00e5 in `btl.h`, tested at 0x0117), warn four times at more than 180, 190, 195 and 200 actions (rows 0x4232 to 0x4235, each cast on
himself) and then cast the 12-hit random-target Meteor (row 0x4236: formula 5, power 200, always 9,999) on the whole party
[src 54-82; bin 0x0129-0x01ab; row]. It is **inert** [bin; note: bahamut-vegnagun §1.6]:

- the whole block, including the line that raises the action count, sits inside a guard that is true only when the count of living,
  un-petrified party members is 0 [src 50; bin 0x0103, group argument -25 and filter argument -30]. The
  guard of Bahamut's script is the same text and the same compiled arguments (`m168.src:50`, compiled 0x00ed) [src; bin];
- run on the live exe by the Bahamut note, that count is 3 with a full party and 0 only when every girl is dead or petrified, and in
  that state the ATB clock does not step, so the action entry is never polled [note: bahamut-vegnagun §1.6].

So the action count never moves and the warnings and the Meteor are unreachable. The branch's header comment mentions none of this;
nothing needs to be ported.

## 5. Daigoro (m174): the script in words

**Record** [row 174, `monster.bin` offset 0x8810; note: re-ffx2-yojimbo-valefor §4, §6.3]: Lv 30, HP 1, MP 1, STR 42, DEF 50, MAG 61,
MDEF 106, AGI 120, ACC 95, EVA 0, LCK 7, thinking byte 1 (inert), special word 0, no element bytes, immune to Curse only (group-1
index 8) plus the unmapped group-1 indexes 17 and 18, no rewards, an **empty ability list**. Slot 2 of formation 1847 [row; note:
rows note §2.3].

**Initialisation** [src 20-29; bin 0x0006-0x00c9]: death pattern "fade out" (0x00a2); **cursor flag off** (0x00ae), so the target searches skip
him [note: bahamut-vegnagun §1.4] and, as the guides say, no girl can target him; **existence flag off** (0x00ba), read as "not counted toward victory" [note: bahamut-vegnagun §4.1, §6, M];
movement disabled (0x00c6). Nothing else.

**Action entry** [src 35-48; bin entry 0x00ce, first test 0x00d5]:

1. If the battle-local flag is 1 [src 37; bin 0x00d5], he **lowers it to 0** [src 39; bin 0x00db], picks one living girl with the
   **near-weighted** search over the whole party group [src 40; bin 0x00f0, search call with last argument **1** where Yojimbo's calls
   have 0], and queues **row 0x40a5** on her [src 41; bin 0x00f9].
2. Otherwise nothing (the else branch is empty, [src 43-46]); he stays ready and is polled again on the next step.

**Reaction, menu, targeted and death entries are empty** [src 50-64; bin 0x0100, 0x0101, 0x0102, 0x0103].

What this means [computed from the above and the notes]:

- The dog bites on **his own gauge**: the flag is read whenever he is ready, not when Yojimbo acts. After a bite he rests for his row's
  cost (§6.3, 87 steps), so a flag raised during that rest waits until he is ready again; a second pick while the flag is still up is
  absorbed. Yojimbo being mid-move, charging Zanmato, recovering or hit makes no difference to the bite (consistent with the guides'
  remark, quoted in the branch's header, that the bite still comes when Yojimbo is hit).
- **The bite is not Yojimbo's attack.** It uses the dog's level and strength (Lv 30, STR 42), not Yojimbo's (Lv 36, STR 44) (§6.2), and
  Yojimbo's own ability list (row 170: 0x40a1 to 0x40a4 and the Die row) has no Daigoro entry [row; note: rows note §4, §6.2].
- **The bite's target is not uniform.** The near-weighted pick favours the girl closest to the dog and most squarely in front of him
  (weights in §3). The scene ships **no position file** (`pos_nagi05_229.psc` is empty in the archive; the scenes that do ship one are listed in
  [re-ffx2-ai-scene-positions.md](re-ffx2-ai-scene-positions.md)), so no odds can be stated;
  for illustration only, the Bahamut note gives 47.6 / 26.2 / 26.2 percent for one head-on geometry and 35.0 / 32.7 / 32.3 when facing
  away [note: bahamut-vegnagun §1.4].
- Both flags off on an actor that must act is new in these notes (the Head acts with the cursor flag off until its phase 2, the
  Redoubts with the existence flag off [note: bahamut-vegnagun §6.1, §6.2]). That Daigoro's gauge runs and he is polled follows from his
  having an action handler that issues a command; it was not traced separately [M].
- Whether party spells aimed at "all enemies" reach him (cursor flag off) was not traced [open].

## 6. The five move rows

Rows of `battle/kernel/monmagic.bin` (jppc; the English copy differs only in text), table header: 568 rows of 136 bytes from file
offset 0x20, row index = id - 0x4000 [row]. All five rows have: **hits 1, element 0, critical byte 0, accuracy byte 0, MP cost 0,
shatter 0, accuracy formula 0** (misc bits 3 to 5 clear). Decoded with the layout of
[re-ffx2-commands.md](re-ffx2-commands.md) §1; every value below was read by two parsers.

### 6.1 Numbers

| Field | Kozuka 0x40a1 | Wakizashi A 0x40a2 | Wakizashi B 0x40a3 | Zanmato 0x40a4 | Daigoro 0x40a5 |
|---|---:|---:|---:|---:|---:|
| Row index / file offset | 161 / 0x55a8 | 162 / 0x5630 | 163 / 0x56b8 | 164 / 0x5740 | 165 / 0x57c8 |
| Target flags | 0x13 | 0x13 | 0x17 | 0x17 | 0x13 |
| (meaning) | one enemy | one enemy | enemies, multiple-target flag | enemies, multiple-target flag | one enemy |
| Misc flags | 0x41200006 | 0x41200006 | 0x41200006 | 0x41200006 | **0x41000006** |
| Damage flags | 0 | 1 (physical) | 1 (physical) | 0 | 1 (physical) |
| Damage class | 2 (MP) | 1 (HP) | 1 (HP) | 3 (HP and MP) | 1 (HP) |
| Formula | 4 | 0 | 0 | 10 (0xa) | 0 |
| Power | 4 | 16 | 13 | 1 | 16 |
| Accuracy formula (misc bits 3 to 5) | 0 | 0 | 0 | 0 | 0 |
| ATB cost (rest after the command) | 120 | 120 | 120 | 200 | 100 |
| Cast cost (charge before it) | 0 | 0 | 0 | 120 | 0 |
| Status chances, group 1 | Poison (index 5): 100 | none | none | none | none |
| Sequence class (byte +0x0c) | 22 | 23 | 23 | 3 | 1 |

Misc bit 0x200000 is set on the first four and clear on the dog's bite (unmapped). The accuracy-formula bits (3 to 5) read 0 on all
five, and none of the other misc bits the notes name (Darkness 0x40, reflectable 0x80, absorbs 0x100, steals 0x200, delay 0x1000 and
0x2000, random spread 0x4000, weapon properties 0x10000, dead target 0x40000, Bribe 0x4000000) is set on any of them [note:
re-ffx2-commands §1], so none of the five bounces off Reflect. The sequence class is the byte that decides which commands are "instant" for target repair
(1 is; 3, 22 and 23 start a charge class) [note: leblanc-den-ixion §1.12]. The Die row 0x40b2 (Yojimbo's death command) is target
flags 0x41, misc 0x2, everything else 0.

### 6.2 What the numbers do (damage §1, §2; hit-status §2.1, §4.1)

- **Never roll, never crit** [row; note: hit-status §2.1: accuracy formula 0 "always hits"; damage §2.1 step 2: a critical needs damage
  flag 4, which no row has]. No Evasion or Luck of a girl matters.
- **Wakizashi A (power 16) and B (power 13) and the dog's bite (power 16)** are formula 0, physical (so Protect halves them and a
  Defense status cuts them to 1 [note: damage §2.1 step 11]): base `a = ((STR + L) x STR x L) / 1024 + STR`, then `x (270 - DEF) / 255`,
  the stage terms, then `(a x P / 16) x v / 256` with `v` 240 to 271. **The base differs by attacker**: Yojimbo (STR 44, L 36) gives
  **167**, Daigoro (STR 42, L 30) gives **130** before the DEF term [computed from damage §1]. So at the same power the bite does
  about 78 percent of a Wakizashi A, and Wakizashi B is 13/16 = 81 percent of A.
- **Kozuka** is an **MP move**: damage class 2 with formula 4 and power 4 is `4 x current MP / 16` = **25 percent of the target's
  current MP**, cut to the MP she has; there is no HP damage; damage flags 0, so Shell and Protect do not touch it [computed from damage
  §1, §2.2]. It also inflicts **Poison with chance byte 100**. The landing rule is `roll(0 to 100) < c + 5 x (attacker level - target
  level) - resist`, with `c` 100, Yojimbo's level 36 and the girl's Poison resist [note: hit-status §4.1]: it lands every time on a girl
  below Lv 36 with no resist, fails one time in 101 at Lv 36, and fails more often above it (Lv 40: 80 of 101).
- **Zanmato** is class 3 (HP and MP) with formula 10: each pool is taken down to 1 (an HP of `tHP - 1` removed; "leave 1" can never
  kill [note: damage §1 formula 0xa]); a girl who already has 0 or 1 MP loses none; a KO'd girl is untouched. Damage flags 0, so Protect,
  Shell and Defense do nothing; target flag 0x80 is absent, so no all-target halving [note: damage §2.4]. It matches the guides'
  "HP and MP to 1", and the same formula with class 1 is the Magus Sisters' Delta Attack (row 0x40a9: class 1) [row].

### 6.3 Timing at AGI 120 (29.97 steps a second)

| Quantity | Row cost | Units: cost x 10,000 / 121 | Steps (units / 95) | Rounded up | Seconds |
|---|---:|---:|---:|---:|---:|
| Rest after Kozuka, Wakizashi A or B | 120 | 9,917 | 104.39 | **105** | **3.50** |
| Zanmato charge (before it lands) | 120 | 9,917 | 104.39 | **105** | **3.50** |
| Rest after Zanmato | 200 | 16,528 | 173.98 | **174** | **5.81** |
| Daigoro's rest after a bite | 100 | 8,264 | 86.99 | **87** | **2.90** |
| First gauge, each actor (drawn once, 25 to 74 percent of the refill of a cost-70 command) | window 1,446 to 4,293 of 5,785 | | 15.2 to 45.2 | | 0.51 to 1.51 |

[computed] with the rule of the sibling notes (units truncated, steps rounded up, first-poll windows left exact); every dead or
petrified girl adds 30 steps to each rest [note: atb-status §3.4]. A dog pick has no rest at all. **Animation and execution lengths
of the five moves were not traced** [open], so every time in this note is the rows' own, and real fights are longer by those.

## 7. Derived cycle statistics [computed from the script model]

**Method.** (a) Exact: the thirteen polls of §4.4 are walked with their per-poll odds (a binomial-style dynamic programme over the number
of dog picks, plain floating point). (b) Step model: a Monte Carlo of 100,000 to 200,000 cycles over logic steps. Yojimbo polls every
step while ready; a real action keeps him busy for the row's rest (105 steps) plus an added animation time, Zanmato for its charge plus
its rest plus two animation times; Daigoro polls every step while ready and, on seeing the flag, lowers it and is busy for 87 steps
plus an added animation time. Three girls alive, no hits taken, counter 0 at the start. The result does not change with which actor is
polled first inside a step. Not a measurement: it uses only the script and the rows.

| Statistic | Value |
|---|---|
| Polls before Zanmato | **13** (Zanmato is poll 14) |
| Dog picks per cycle | **5.75** (3 x 2/3 + 5 x 1/2 + 5 x 1/4) |
| Real actions per cycle | **7.25**: Kozuka 3.50, Wakizashi A 2.50, Wakizashi B 1.25 |
| Distribution of real actions | 0 to 3: 1.25 %; 4: 3.86 %; 5: 9.80 %; 6: 17.69 %; 7: 22.94 %; 8: 21.40 %; 9: 14.20 %; 10: 6.52 %; 11: 1.96 %; 12: 0.35 %; 13: 0.03 % |
| Real actions in 4 to 10 | **96.4 %**; in 7 or 8: **44.4 %**; in 5 to 9: 86.0 % |
| Zanmato is his 14th visible move (no dog pick in 13 polls) | 0.03 % (243 / 884,736) |
| Separate runs of consecutive dog picks per cycle | **3.15** (1 run: 3.3 %, 2: 21.4 %, 3: 40.2 %, 4: 27.7 %, 5: 7.0 %, 6: 0.5 %) |
| Bites per cycle (step model) | **about 4.3** (range 3.4 to 4.5 over added animation times of 0 to 200 steps for Yojimbo and 0 to 120 for the dog; 4.30 when both add the same time) |
| Cycle length, rows only (7.25 x 105 + 105 + 174 + 5.75 + 1 steps) | **about 1,046 to 1,047 steps, 34.9 s**: 25.6 s of moves and dog picks, 3.5 s Zanmato charge, 5.8 s Zanmato rest |

"Bites" are counted per flag raised and consumed: the first dog pick of a run is bitten at once (the dog is ready), and a **second
pick in the same run raises the flag again after he has lowered it**, so he bites a second time when his 87-step rest ends. Runs of 2 or
more therefore give up to two bites, while a flag raised during an earlier rest merges into the one already waiting. The review's
3.15 is the number of **runs**, not the number of bites; the step model nets about 4.3 (a trace of the model shows both effects).

## 8. Open items and what could not be pinned

1. **Wakizashi B's reach.** The script aims it at one uniform girl, but its row carries the multiple-target flag (0x17, as Zanmato) while A
   does not (0x13). That the executed hit set is the named girl alone (the sibling notes' re-validation leaves a mask with every member
   valid untouched) is read, not traced for a multiple-target row with a one-girl mask [open]. The guides cited in the branch (wiki, SinirothX) describe both Wakizashi as single-target.
2. **Animation and execution lengths** of Wakizashi, Kozuka, Zanmato and the bite, and how long a bite's execution keeps the dog from
   his rest [open]. The bite count of §7 depends on the ratio of the two actors' busy times (range given).
3. **The counter starts at 0** is the sibling notes' assumption (no initialiser, no initial image in the package), not traced in the exe
   [note: fallen-trema §1.3, M].
4. **Existence flag off = "not counted toward victory"** and **whether all-enemy party spells reach the dog** (cursor flag off) [open].
5. **The bite's odds.** The pick is near-weighted but the scene ships no positions, so the weights are unknown [src; open].
6. **Unmapped:** misc bit 0x200000 (set on four rows, clear on the bite), special-word bits 7 and 8 (set on Yojimbo), group-1 resist
   indexes 17 and 18 [row].
7. **Scene `crcr00_099`** (the EXP-1,000 override) is in no formation row; its identification as the arena copy is by the sibling notes'
   naming pattern only [open].
8. **Not repeated here:** every [review run] figure in §9 (the branch was not run for this note) and the exe hash.

## 9. Differences from `origin/ch-tourist-trap` (reviewed at 36b37ed2; severities are the review's)

Paths are in the repo at 36b37ed2. "Game" means this note.

**1. BLOCKER: Daigoro is a Yojimbo turn.**
*Code.* `src/battle/ffx2/ai/tourist-trap.ts:37-47` makes "daigoro" one of Yojimbo's four moves in every band; `:54-56` and `:71` queue it
as his command on a uniform girl; the dog's own script is `idleFor(self, IDLE_UNTIL_WOKEN)` (`:76-79`), so he never acts.
`src/data/ffx2/enemies/tourist-trap-abilities.ts:84-94` defines the bite as a Yojimbo ability (no `canMiss`), and
`src/data/ffx2/enemies/tourist-trap.ts:115` puts it on Yojimbo's `abilityIds`; `:124-140` makes the dog a placeholder body (HP 1, every other
stat 0 including AGI, no ability) and `:143-152` a `parts` entry.
*Game.* The dog pick is a flag (§4.4); Daigoro is an actor with row 174's numbers who bites with row 0x40a5 on his own gauge, near-weighted
target (§5); the row 170 ability list has no Daigoro entry (§5). So in the game Zanmato is the 14th **poll** (13 polls, §4.4), a fixed
count of Yojimbo polls but about the 8th visible move (7.25 real actions, 4 to 10 in 96 percent of cycles, §7). The branch gets Zanmato on
Yojimbo's 14th **turn** every cycle [review run: 12 of 12 seeds; also evident from the code: eight counter steps, no skipped turn]. At the
branch's band odds (4 turns x 2/3 + 5 x 1/2 + 4 x 1/4) it has **6.17** bites a cycle against about **4.3** [computed], each at Yojimbo's
base 167 against the dog's 130 (about 28 percent too hard per bite, §6.2).
*Fix in words.* A dog pick sets a battle-wide dog flag and ends the poll with no command; Yojimbo is polled again on the next logic step
(the counter has already risen), with no recovery (the repo's `idleFor(self, 1)`; the review cautions that a per-step idle poll must not trip
the presenter's no-event limit, so a small additive wake is needed [review; not checked here]). Daigoro becomes a real enemy with row
174's stats, flagged untargetable and a part (not counted for victory), whose script, when the flag is up, lowers it and bites one living
girl with a row-0x40a5 ability (physical, formula 0, power 16, never rolls, ATB cost 100, cast 0) by the near-weighted pick; with no
positions in this scene a uniform fallback is acceptable (the review names the Paragon script's pick as the existing stand-in). Remove
the bite from Yojimbo's list.

**2. MAJOR: the band is tested before the raise.**
*Code.* `ai/tourist-trap.ts:64-70`: the counter is read (`:64`), tested for Zanmato (`:65-68`), raised (`:69`), and the band is looked up from
the **old** value (`:70`, `bandFor(counter)`); the header says the same (`:9-14`, `:40`).
*Game.* The Zanmato test is on the old value, the band on the **raised** value (§4.2). The branch therefore has bands of 4 / 5 / 4 turns
(old values 0 to 24, 32 to 64, 72 to 96) where the game has 3 / 5 / 5 polls (raised 8 to 24, 32 to 64, 72 to 104): one poll moves from the
2/3-dog band to the 1/4-dog band.
*Fix.* Raise first (`raised = counter + 8`), pick the band from `raised`; the Zanmato test stays on the old counter.

**3. MAJOR: the roll-to-move order differs from the game's in all three bands.**
*Code.* `ai/tourist-trap.ts:43-47`: band 1 `[dog, dog, kozuka]`, band 2 `[dog, dog, kozuka, wakizashiA]`, band 3 `[dog, kozuka,
wakizashiA, wakizashiB]`, indexed by `random() mod n`.
*Game.* §4.3: band 1 `[Kozuka, dog, dog]`, band 2 `[Kozuka, Wakizashi A, dog, dog]`, band 3 `[Wakizashi B, Wakizashi A, Kozuka, dog]` (bands 1
and 3 are exact reverses of the branch's lists; band 2 also swaps Kozuka and Wakizashi A). The odds per band are the same; the order
matters when the game's own draws are replayed (golden vectors, forced rolls). [The MAJOR is the review's; with the seeded RNG alone the
order changes no probability.]
*Fix.* Use the §4.3 tables, and the moduli 3, 4, 4.

**4. MAJOR (hit rule, AGENTS.md rule 5): Wakizashi A, B and the bite roll to hit.**
*Code.* `tourist-trap-abilities.ts:60-71`, `:72-83`, `:84-94` set no `canMiss` (the engine rolls anything but `canMiss: false`); Kozuka
(`:105`) and Zanmato (`:118`) do set it. [review run: 69 of 622 physical actions evaded over 40 seeds, 11.1 percent.]
*Game.* All five rows have accuracy formula 0: never roll (§6.1, §6.2).
*Fix.* Attach the five rows through `command-records` (the engine then reads formula 0 from the row) and/or set `canMiss: false` on all five.

**5. MAJOR: pace.**
*Code.* The abilities carry no rest or charge, so the engine default stands (the header says "rest 70, no charge", `tourist-trap-abilities.ts:21-22`);
the formation adds the flat 3-second action time (`enemies/tourist-trap.ts:47-52`, `:151`); the Road (XI), Cloister (XIII) and Djose
(XVI) formations use the same add-on (`ROAD_ACTION_TIME_ON`, `CLOISTER_ACTION_TIME_ON`, `DJOSE_ACTION_TIME_ON`). [review run: median 6.0 s
between turns; about 85 s per Zanmato cycle.] A cost of 70 is 5,785 units = 61 steps (2.04 s) for every move, plus the 3 s.
*Game.* §6.3: rests of 105 / 105 / 105 / 174 / 87 steps (Kozuka, Wakizashi A and B, Zanmato, bite), a **105-step charge for Zanmato** (the
branch has none), and a dog pick that costs one step (the branch spends a full turn on it). Rows only, a cycle is about 35 s (§7).
*Fix.* Attach the five rows through `command-records` (`src/data/ffx2/command-records/index.ts`) so the engine times each move by its own
row, as it does for the abilities of the seven chapters. Whether to keep a 3-second add-on for animation time is **Bailey's call**;
animation lengths are not traced (§8).

**6. MINOR: the two monster rows are not attached.**
*Code.* `MONSTER_RECORDS` (`src/data/ffx2/monster-records/index.ts:52`, keyed group id / enemy id) has no entry for `ffx2-cavern-yojimbo`.
The branch authors `reflect: 255` for Yojimbo (`enemies/tourist-trap.ts:65`), and derives the special word from `immunityFlags` (`:96`)
as 0x241 (bits 0, 6, 9; `src/battle/ffx2/adapt/words.ts:139-141`). Daigoro is zeros, ACC 0, with the percent/delay/bribe flags (`:129-139`).
*Game.* Yojimbo's Reflect resist byte is **0** (Reflect lands on him; the wiki's Reflect immunity is not in the record [row; rows note
§6.2]), and none of his moves is reflectable anyway (§6.1); his special word is **0x3c3**, which adds bit 1 (a hit reaction does not slow his
gauge, read at `src/battle/ffx2/atb-engine.ts:107`) and the unmapped bits 7 and 8; Daigoro's special word is **0**, Curse the only resist
(plus the unmapped 17 and 18), ACC 95, AGI 120 (§5; rows note §4, §6.3).
*Fix.* Add `MONSTER_RECORDS` entries for both bodies from rows 170 and 174, and drop the authored Reflect.

**7. MINOR: Kozuka's Poison chance is 254.**
*Code.* `tourist-trap-abilities.ts:104`: `chance: 254` (lands unless resisted).
*Game.* Chance byte **100** (§6.1), the landing rule of §6.2: certain below Lv 36, 80 of 101 at Lv 40. (The branch's preset girls are
Lv 32 to 34 per its plan, `docs/plans/ch-tourist-trap-review.md:41`, where the two agree if those are the level fields the formula reads.)
*Fix.* Chance 100 (via the attached row).

**8. MINOR: `x2-daigoro` shows up in the ATB snapshots.**
*Code.* The placeholder body (`enemies/tourist-trap.ts:129`, AGI 0) is in every ATB snapshot with a 700,000-unit bar and one empty
turn-start / action-end about 15 s in [review run, all 40 runs].
*Game.* Daigoro has a real gauge (AGI 120, first fill 0.5 to 1.5 s) and a real, rare action (§5, §6.3). Item 1's fix replaces this.

**9. MINOR (driver text): the "14th turn" and "Yojimbo's own move" wording.**
*Code.* `src/data/guides/ffx2-tourist-trap.ts:26-27` (RULES[0], "fourteenth turn") and `:41` (RULES[3], "his bite arrives as one of Yojimbo's own
moves"); the same file's header `:13`; `src/data/guides/docs/ffx2-tourist-trap.ts:36` ("rises with every move he makes"), `:41` ("mostly sends
Daigoro"), `:53` ("comes on his fourteenth move"), `:61` ("the damage is Yojimbo's to take"); `src/engine/tactics/ffx2-tourist-trap.ts:10`
("Zanmato on his 14th turn"); `docs/plans/ch-tourist-trap-review.md:37-38` (ceil(100/8) as the 14th **turn**); `ai/tourist-trap.ts:9-10, 22-23`.
*Game.* The count rises on every **poll**, dog picks included; Zanmato is the 14th poll, usually about his 8th visible move (4 to 10 in
96 percent of cycles); the dog bites on its own (§4.4, §5, §7). Still right: "Daigoro cannot be targeted", "Zanmato takes HP and MP to 1 and
Protect and Shell do not soften it" (§6.2), the physical wording for the Wakizashi and the bite (tactic header `:17`), and the heal-after-Zanmato advice.
*Fix.* Say "Zanmato comes after about eight of his moves (anywhere from four to ten)", and that Daigoro bites by himself.

**10. NOTES.**
The Die row (0x40b2, Yojimbo's death command) and the Meteor and warning rows (0x4232 to 0x4236, never reached, §4.6) are absent from the
branch; nothing is lost. Whether all-enemy party spells skip the untargetable dog is not traced (§8, item 4).

## 10. Notes cited

In the repo (`research/`): [re-ffx2-yojimbo-valefor.md](re-ffx2-yojimbo-valefor.md) (rows 170, 174 and the formation),
[re-ffx2-ai-bahamut-vegnagun.md](re-ffx2-ai-bahamut-vegnagun.md) (§1.1 to §1.7, §4.1, §6),
[re-ffx2-ai-fallen-trema.md](re-ffx2-ai-fallen-trema.md) (§1.1, §1.3, §1.6),
[re-ffx2-ai-leblanc-den-ixion.md](re-ffx2-ai-leblanc-den-ixion.md) (§1.1 to §1.5, §1.12),
[re-ffx2-damage.md](re-ffx2-damage.md) (§1, §2.1, §2.2, §2.4), [re-ffx2-hit-status.md](re-ffx2-hit-status.md) (§2.1, §4.1),
[re-ffx2-atb-status.md](re-ffx2-atb-status.md) (§3.4), [re-ffx2-timing-measured.md](re-ffx2-timing-measured.md) (§3),
[re-ffx2-commands.md](re-ffx2-commands.md) (§1, §8), [re-ffx2-ai-scene-positions.md](re-ffx2-ai-scene-positions.md),
[ffx-yojimbo.md](ffx-yojimbo.md) (§2, §8.2). Kept outside the repo: the lane's working notes
for the Leblanc-den-Ixion and Bahamut-Vegnagun scripts, and this note's scratch scripts and extracted files (deleted after the commit).
