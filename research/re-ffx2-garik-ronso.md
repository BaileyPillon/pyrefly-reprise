# FFX-2 Garik Ronso and the Ronso Youths (Chapter 3, Mt. Gagazet summit): rows 181 and 182, the two scenes, and what "the earlier answer" really is

**Game case: FFX-2 only.** The fight is the Chapter 3 mission "Battle Blockade" of FFX-2 (ATB, dresspheres, the FFX-2 kernel tables and status set). The Cup versions (row 324 for Garik) are a different fight in the Fiend Arena (plan row 38, `re-ffx2-farplane-cup.md`), and the FFX Ronso (Kimahri, Biran, Yenke) are other monsters; no FFX number is used.
Written 2026-11-07 by a Sonnet sub-agent of the release driver (program plan row 47, `PLAN.md` of 2026-11-06, wave 4). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed; the game was not run; no browser, no GPU, no Ghidra.** Authority (relayed words, verbatim): 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers and described behaviour from the owner's Steam copy (FFX-2 half of the HD Remaster), read by the lane's own node VBF reader and its row, formation, move and event tools (kept outside the repo) and a saved-variable scanner. Names are the game's English name tables; no dialogue, no script lines, no byte dumps; developer labels are translated in a few words.

**Tags.** **[R]** read from a game file; **[I]** inferred from [R]; **[G]** a guide (Jegged FFX-2 Chapters 1 to 3); **unmapped** the raw value is given, no meaning claimed (AGENTS.md rule 6).

## Summary for the driver (the question in PLAN.md section 5 answered)

1. **The "dialogue answer" is a score, and it chooses between two different scenes, not a strength.** The game keeps one saved counter (saved-data offset 0xb90). Eight conversation sites on the mountain (seven in the Mountain Gate package `mtgz0000`, one in the Fayth Scar package `mtgz0600`) each change it by +1, -1 or 0 according to the answer given; the summit package `mtgz1001` reads it once, when it launches the fight: **more than 7 → scene `mtgz10_229`, the friendly bout; 7 or less → scene `mtgz10_228`, the hostile fight.** [R: `sv-writers-b90.out.txt`, `ev-mtgz1001.txt` lines 2352 to 2361]
2. **The two scenes are two scripts of the same two monsters.** *Hostile* (`_228`, the usual first-time result): **two Ronso Youths and Garik**; Garik hunts Black Mages with Bane Lance (Curse), Blinds, and casts **Mighty Guard on his side every seventh turn**; each Youth uses MP Blowout one turn in eight. *Friendly* (`_229`): **one Youth and Garik**; Garik is "not hostile" in the script's own words: he attacks and only buffs himself (Protect, Shell on a fixed beat), the Youth only attacks. [R: `m182.src`, `m181.src`, both equal to the compiled workers: `cmp-src-bin` in `cmp-46-47.out.txt`]
3. **Guides agree:** "With high Ronso trust, Garik brings one Ronso Youth and has a much smaller list of attacks, but with low trust he brings two Youths and some much tougher attacks" (Jegged Chapter 3). The guide also says the easy Garik "never uses Mighty Guard on his own ... only after being Confused": Confuse lands on him, and a confused monster chooses from its whole move list (the Gun Mage's way to learn Mighty Guard). [G, R consistent]
4. **The plan's "default answer and a three-way switch" becomes a two-way switch with the game's own rule.** The honest build is *two values of one setting*, "Ronso trust: low (the hostile fight, the default) / high (the friendly bout)". The game has no neutral third value; a first-time player must answer all eight conversations well to see the friendly bout, so the hostile fight is the likely result. [R for the rule; I for "likely"]
5. **Numbers:** Garik Lv 33, **6,880 HP**, MP 444, AGI 102; Ronso Youth Lv 24, **4,060 HP**, MP 170, AGI 78; pools **15,000 HP hostile, 10,940 friendly**; EXP/Gil/AP 820/130/7 and 600/110/5. [R]
6. **A "battle too long" block is present in both scripts (Garik after 180 polls, a Youth after 140) and never runs.** Its guard is `countchr_player(chr_all_ply3, chr_friend_player) == 0`, the same call as in about twenty other boss scripts, and the sibling notes ran it on the live exe: the count is 3 for a full party and 0 only when no girl can act, and the ATB clock does not step then. (**Corrected 2026-11-08:** this note first read the guard as "no friendly guest", tagged [R] with no run behind it, and the build ported the block live; a review caught it against five sibling notes.) [R for the text; the behaviour is `re-ffx2-ai-bahamut-vegnagun.md` 1.6, a live-exe run]
7. **Cost:** research is done; about 19 h against the plan's 28 (preflight section 10).

## 0. Result in one screen

| Field | **Garik Ronso (182)** | **Ronso Youth (181)** |
|---|---:|---:|
| Id / file offset | 0x10b6 / 0x8e50 | 0x10b5 / 0x8d88 |
| Level | 33 | 24 |
| HP / MP | 6,880 / 444 | 4,060 / 170 |
| STR / DEF / MAG / MDEF | 43 / 34 / 56 / 3 | 51 / 23 / 48 / 3 |
| AGI / ACC / EVA / LCK | 102 / 95 / 0 / 2 | 78 / 95 / 0 / 2 |
| "Thinking" byte | 0 | 30 |
| Special word | 0x3c3 (bits 0, 1, 6, 7, 8, 9) | 0x181 (bits 0, 7, 8) |
| Elements | null Gravity | null Gravity |
| Resist bytes group 1 | Death, Petrify, Sleep, Silence, Berserk, Curse, Eject, Itchy, Auto-Life 255; **Darkness 20, Poison 20**; **Confusion not listed (lands)** | Death, Petrify, Sleep, Silence, Curse, Itchy, Auto-Life 255; Darkness 20 |
| Group 2 | Slow, Stop, Doom 255 | Doom 255 |
| Moves (waza) | Attack, Bane Lance, Mighty Guard, Blind, Shell, Protect | Attack, MP Blowout |
| EXP / Gil / Pilfer Gil / AP | 380 / 90 / 130 / 3 | 220 / 20 / 80 / 2 |
| Drop / steal (byte) | Shining Bracer x1 (128) / Icy Gleam x1 (64) | Remedy x1 or x2 (255) / Mythril Bangle x1 (64) |
| Zantetsu byte | 20 | 0 |

Special-word meanings as in the Farplane Cup note §3 (bit 0 no percent-HP formulas, 1 hit reactions do not stop him, 6 no ATB damage, 7 no Zantetsu, 8 Bribe, 9 magic cancel): **delay and Interrupt do nothing to Garik; the Youths can be delayed** (no bits 1 and 6). [R: `dump-rows.out.txt`, `src-moves-46-47.out.txt`]

| Scene | Formation | Slots (scale 100) | Props | Pool |
|---|---|---|---|---|
| `mtgz10_228` (hostile) | row 1622 | Youth, Youth, Garik | three Weapons (row 206) | 4,060 x 2 + 6,880 = 15,000 HP; EXP 820 / Gil 130 / AP 7 |
| `mtgz10_229` (friendly) | row 1621 | Youth, Garik | two Weapons | 4,060 + 6,880 = 10,940 HP; EXP 600 / Gil 110 / AP 5 |

Map "Mt. Gagazet summit" (`ガガゼト山頂`); both position files are empty (`pos_mtgz10_228.psc` is 0 bytes; no entry for `_229`), so the near-weighted picks are uniform as in the Tourist Trap and Leblanc notes. [R]

## 1. The earlier answer, step by step [R, I]

* **The counter.** Saved-data offset 0xb90 is declared in the Gagazet packages `mtgz0000`, `mtgz0600`, `mtgz1001`, `mtgz1200`, `mtgz0001`, `mtgz1301` and a debug package. **Writers:** `mtgz0000` has seven conversation functions (workers 4 to 9 and 17) and `mtgz0600` one; each writes the counter as itself minus 1, plus 1 or plus 0 — one write per answer, in an order that is not the order of the answers' texts (unmapped which choice is which); `mtgz1200` (a later Gagazet area) sets it back to 0 together with a mission-progress state. [R: `sv-writers-b90.out.txt`]
* **The reader.** The summit package's battle-launch function compares the counter with 7: **more than 7 starts `mtgz10_229`, otherwise `mtgz10_228`**. [R: `ev-mtgz1001.txt`, function w14.f7]
* **What the eight are.** Eight sites match the guide's "eight Ronso to talk to in all, including Kimahri (seven at the Mountain Gate, one at the Fayth Scar)", with a per-Ronso table of the answer to give in Chapter 1 and another in Chapter 2. [G: Jegged FFX-2 Chapter 1 page 13 and Chapter 2 page 25]
* **Reading of the threshold [I].** The counter can reach 8 from one set of right answers; if the two chapters' conversations both add (the same package serves both), up to 16 are possible and the rule is "net score at least 8". The files do not say whether Chapter 2's talks start from zero; **open**, section 6. The chapter does not need the answer: it offers the two outcomes.
* **What it does not do.** No stat scales with the counter (the rows are single and the scripts read no counter): the "strength" in the 10-18 notes is the difference between the two scripts. [R]

## 2. The scripts (normal worker 0) [R: `m182.src`, `m181.src`]

Engine conventions as in the earlier FFX-2 notes: a poll is one call of the action entry; `random() % n` is stream 2; `searchr` is the near-weighted search (stream 4); "a girl" is Yuna, Rikku or Paine; "own side" is the monster side.

### 2.1 Garik, hostile scene `_228`

Each poll increments his turn counter (**starts at 0**) and tests, in this order:
1. **Bane Lance** on the first of Yuna, Rikku, Paine **whose current dressphere is Black Mage and who does not already carry Curse**.
2. else, if the counter is **7 or more**: counter 0 and **Mighty Guard on all monsters** (Garik and both Youths): Shell and Protect (126 each), Regen and Haste (90), Defense and Magic Defense up (2 each), Evasion up (1) [R: `src-moves-46-47.out.txt`].
3. else a draw `% 4`: **0 = Blind** on a girl who is not Darkened (if all are Darkened, Attack), **1 to 3 = Attack** on a living girl.
So at rest: Attack three polls in four, Blind one in four (until all are dark), **Mighty Guard on his 7th, 14th, 21st poll**, Bane Lance whenever a Black Mage without Curse is present (Curse in FFX-2 is "cannot change dressphere", `abilities-core.ts`). [R, I]

**One branch has no Curse test** (`m182.src:405-410`): when neither Yuna nor Rikku wears Black Mage and **Paine** does, the script casts Bane Lance on Paine on every poll without testing Curse (every other branch tests `searchr(chr_<girl>, stat_curse, not)` first). So a cursed Paine, alone in Black Mage, is lanced again every poll, and Garik never reaches the guard, the Blind or the Attack. The build models it (`baneLanceTarget`); the shipped preset does not reach it (Paine's ring has no Black Mage). [R]

### 2.2 Garik, friendly scene `_229`

His counter **starts at 3**; each poll: counter +1, then: **counter 8 or more: counter 0 and Shell on himself; counter exactly 4: Protect on himself; otherwise Attack** on a living girl. The cycle is eight polls: **Protect, Attack x3, Shell, Attack x3**, from his first poll. No Bane Lance, no Blind, no Mighty Guard, no draw. [R]

### 2.3 The Ronso Youth

Hostile: a draw `% 8`: **0 = MP Blowout** on the girl with the most MP (the script's group "own target" is unmapped; the guide says it empties one character's MP), else **Attack**. Friendly: **Attack** only. MP Blowout: row 0x411d, formula 7, power 16, accuracy formula 1 (acc 120), MP cost 10, class 2. [R, G]

### 2.4 The "battle too long" block (both scenes): present in the scripts, INERT in play

Polls counted from the first: **Garik** at > 180 "Angry", > 190 "Furious", > 195 "About to Blow", > 200 "This Battle Ends Now", then **Time Up Meteor (power 200, 12 hits, everyone, 9,999 a hit) each poll**; **each Youth** the same at > 140, > 150, > 155, > 160. [R]

**The guard is `countchr_player(chr_all_ply3, chr_friend_player) == 0`** (`m182.src:63`, `m181.src:59`), and the counter's own increment is inside it. This note first read it as "no friendly guest" and ported the block live. **That reading was wrong.** The identical call opens the block in twenty other boss scripts (m165, m175 to m179, m185, m189, m191 to m193, m210, m211, m214, m215, m254, m256, m258, m262, m263; counted by a text scan of the extracted sources), and `re-ffx2-ai-bahamut-vegnagun.md` 1.6 ran it on the live exe: the count is 3 for a full party, 2 with one girl down and 0 only when every girl is dead or petrified, and **the ATB clock does not step in that state, so the action entry is not polled and the block never runs.** The Leblanc, Valefor, Angra Mainyu and Yuna's Ballad notes (and the scripts built from them) treat it the same way. [R for the text, a sibling lane's live-exe run for the behaviour]

**Consequence for the build:** nothing implements it in play (`RONSO_TOO_LONG_BLOCK_ON` is false; the thresholds stay behind the switch, pinned by a test). **A long fight has no clock**: a line that cannot out-damage Mighty Guard's Regen and Haste does not meet a Meteor, the fight goes on until the girls fall or the party wins (measured in the handoff, section 6).

## 3. The moves (the game's rows; `src-moves-46-47.out.txt`)

| Move | Row | Class | Power | Target | Notes |
|---|---|---|---:|---|---|
| Attack (no cancel) | 0x41da | physical, accuracy formula 2 (acc 95) | 16 | one, near-weighted | crit 5 |
| Bane Lance | 0x411c | physical, accuracy formula 1 (acc 110) | 16 | one (a Black Mage without Curse) | **Curse 254**; MP 8 |
| Blind | 0x406f | status, reflectable | | one | **Darkness 75**; MP 8, cast 60 |
| Mighty Guard | 0x4084 | support | | all monsters | MP 18, cast 120; Shell, Protect 126, Regen, Haste 90, DEF/MDEF stage 2, EVA stage 1 |
| Shell / Protect (own) | 0x30bb / 0x30bc | the player's spells | | himself | MP 10 / 12; Shell 110, Protect 110 |
| MP Blowout | 0x411d | MP damage, accuracy 120 | 16 | one | Youth only; MP 10 |
| Time Up Meteor and the four anger rows | 0x4236, 0x4232 to 0x4235 | | 200 x 12 | | after 140 to 200 polls |

## 4. Where it is in the game, and the party

The mission "Battle Blockade", FFX-2 Chapter 3 (Mt. Gagazet and the Zanarkand Ruins page of Jegged's Chapter 3), after the Trainer dressphere scene; Garik has disabled the teleporters; the fight starts shortly after the cave. [G] The Gun Mage's Mighty Guard learning beat (Confuse on Garik, wait) is a guide strategy, not a script; the engine has the ability id (`x2-gun-mage-mighty-guard`). **The party** is the repo's Chapter 3 end preset **`djoseBuild`** (Yuna 32, Rikku 33, Paine 34; Samurai and Lady Luck owned), the nearest sourced build; the lower bound is `besaidBuild` (Chapter 2 carried). `[estimate]` for the levels (no source gives one at the summit). [note: `data/ffx2/builds/djose.ts`]

## 5. Engine, art and arena facts (checked against `origin/main` 63813367c by reading)

* Hostile and friendly are two enemy groups sharing two enemy defs; the script reads the scene (a group flag in the engine, as the Den of Woe's GP3/GP4 variants).
* Needs: **dressphere-aware targeting** ("the girl's current dressphere is Black Mage": the engine has the unit's dressphere), **Curse as a target filter**, Mighty Guard on all monsters (Leblanc's Not-So-Mighty Guard is the precedent), Confuse choosing from the move list (the engine's confuse behaviour exists; whether it uses the enemy's waza list is a T0 check).
* Art: `biran-ronso` and `yenke-ronso` (FFX) for the Youths (style fit unverified, FFX-era look; FFX-2 Youths have a different model, 0x10b5), **Garik new** (0x10b6), plates `gagazet` and `gagazet-ronso` (the summit has none).

## 6. Unknowns

| # | Item | Decision |
|---:|---|---|
| U1 | Which answer is which at each site | not needed (the chapter offers the outcomes); the guide's tables name them |
| U2 | Whether Chapters 1 and 2 add (max 16, rule "net at least 8") or the second visit starts from zero | not needed; flagged on the setting's tooltip |
| U3 | The script group "own target" (MP Blowout's target set) | read as the girl with the most MP (the guide's wording) |
| U4 | What the "battle too long" guard `countchr_player(chr_all_ply3, chr_friend_player) == 0` tests | **resolved 2026-11-08: not "no friendly guest"**; it is true only when no girl can act, and the clock does not step then, so the block never runs (section 2.4; `re-ffx2-ai-bahamut-vegnagun.md` 1.6) |

## Files and tools

The lane's readers, scanners and their outputs (the saved-variable scan `sv-writers`, the event listings of the two Gagazet packages, the row and move dumps and the Jegged guide pages) are kept outside the repo; `tests/fixtures/parity/ffx2/garik_ronso_rows.json` holds the decoded rows (read again from the game files by a script, not copied from this note) and `tests/unit/chapters/garik-ronso-data.test.ts` pins the data to it.
