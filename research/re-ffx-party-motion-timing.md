# FFX party motion timing: phase frames of Lulu's, Tidus's and Auron's attack, cast, item, hurt, KO, victory and idle (what the game's motion data says)

**Game case: FFX only.** FFX-2 has its own motion banks and its own signal handler; none of the addresses or frame numbers here apply to it.
Part of the `re-parity` track, requested by the animation track ("it needs to look amazing"). Research only: no code in the repo reads this yet.

**Source note (applies to every number below unless a line says otherwise):** Bailey's own Steam copy, FFX.exe build 25501027 (SHA-256 0537B2A1...686D, image base 0x00400000) and the PS2-tree files inside `FFX_Data.vbf`
(`chr/pc/c001`, `c003`, `c006` `mot/resident0..3.mgrp`, `battle/mot/regmot.mgrp`, `battle/btl/system_01/system_01.bin`, `new_uspc/battle/kernel/command.bin` and `item.bin`), read with our own VBF reader and a read-only
motion-bank reader (the FFX-2 lane's `mgrp.py`, which parses FFX banks unchanged). The game was not run for any table below; the one exception is the live reading in section 6 (label [M]). **Only timings were read** (frame counts, event frames, program structure). No mesh, skeleton, texture or animation curve
was extracted, converted or copied (hard rule 8 and the 2026-10-13 rule). Everything is in our own words; no game code or game text is reproduced.

Labels: **[R]** = read in the game's files or in the exe's decompile (not run). **[E]** = taken from our earlier notes, cited. **[I]** = inferred; nothing ran it. **[M]** = measured live: Bailey's own Steam copy running, read from screen frames and the read-only sampler's logs of live session 6 (2026-10-19); the logs and frames stay local and nothing from them is in the repo (frames are cited by name only). Motion names are the community names for the numeric motion ids
(`refs/FFXDataParser/.../motions.csv`, matched by id [E]); the ids themselves are in the bank [R].

## 1. How the game plays a motion (what the tables mean)

| Fact | Value | Label |
|---|---|---|
| Frame rate | Every clip of the three characters has the rate field 7680 = 30.0 frames per second in 8.8 fixed point. The per-tick advance is (clip rate x speed / 256) / 7680, so at the default speed 1.0 a clip moves **exactly one frame per update tick** (routine 0x838C90; the clip-start routine 0x839B80 stores 0x1E00 = 7680 as the base scale and speed 0x100). | [R] |
| Milliseconds | 1 frame = 33.33 ms **if the update tick is 30 Hz.** The tick rate itself is not read here; the live frame counter at 0x112C900 ran at 31.7 per second over 3.6 s [E: live session 4, "consistent with about 30 per second, still unverified"]. | [E]/[I] |
| Clip header | `{u16 frames, u16 bones, u16 rate, u16 event count, ... u32 event-list offset at +0x10}`; the clip-bind routine 0x839980 copies the rate to Chr+0x7E0, the count to Chr+0x7F0 and the list pointer to Chr+0x7F4. | [R] |
| Motion program | A named motion is a small program: PLAY(clip, repeat count, segment start, segment end), WAIT n frames, GATE, GOTO, WAITCNT, END. The executor 0x837900 agrees with the op list our FFX-2 reader uses. **A PLAY with repeat count 0 loops until something replaces it** (the `_01` hold clips). | [R] |
| Event record | `{u8 type, u8 extra words, i16 start, i16 end, u16 id}` + 4 bytes per extra word. The dispatcher 0x834350 fires an event on the tick the played frame reaches `start` (given that the previous event frame is below `end`). Types: 1 = SND (sound), 2 = EFF (effect callback), 3 = TEX (texture), 5 = **BTL (battle signal)**; the debug names are in the exe at 0xB5993C, 0xB59944, 0xB59940 and 0xB59938. | [R] |
| Battle signal 0 (and 9) | The **hit/release signal.** Handler 0x7B74D0 sets bit `id` in Chr+0x39C, and only acts while the actor's action-state byte (Chr+0x446) is 1 or 4 (an action is running). Id 0 adds one to a counter (Chr+0x429), runs the per-hit reaction routine (0x7B7680) and, when the state byte is 1, applies the next planned hit through the results driver (0x78D980, see `re-ffx-hit-order.md`); id 9 runs the same routine without the counter or the hit, and clears two bytes. | [R] |
| Battle signal 1 | Applies a hit of the other form (result kinds 1 and 0x11) through the same driver (0x7B75C0). The FFX-2 note calls this the "second hit form". | [R] read, not run |
| Battle signal 2 | **Attack end:** clears byte Chr+0x425 on every target of the attacker (0x78D620). | [R] |
| Battle signals 3 to 8 | Further hit forms (0x7B77C0); not read, not present in the clips below. | open |
| Idle | The battle idle loop of each fighter is in `regmot.mgrp` (record n = party member n): Tidus 28 frames, Auron 50, Lulu 60. The idle script plays IDLE1 a random number of times (the draw is modulo Chr property 228) and then the variation IDLE2. | [R] data + [R] script (system_01 w37) |
| Structure of an action | Every action is `_00` (start, once) -> `_01` (hold, looping) -> `_02` (release/finish) as three programs of one family. The tag functions of the common script start `_00`, wait for it, start `_01`, and a later tag (magic launch, item launch) swaps in `_02`. | [R] (system_01 w37, tags 4/5 magic, 6/7 item) |

Unit used below: **f** = frames at 30 fps; the ms column is f x 33.33. "Hit" = BTL signal 0, "end" = BTL signal 2, "alt" = BTL signal 1.

## 2. Lulu (motion set c006; names LULU_*)

Her doll attack, her three cast types and her item/hurt/KO clips, all from `c006/mot/resident1.mgrp` (idle from `regmot`).

| Action (clips in play order) | Clip frames | Anticipation start | Hit/release frame | Follow-through end | Recovery end | Total |
|---|---|---|---|---|---|---|
| **Idle** IDLE1 (loop) | 60 f = 2000 ms | | | | | variation IDLE2 50 f = 1667 ms |
| **Attack** ATTACK2 (stand-still; the one with signals) | 60 f = 2000 ms | f0 | **20** (667 ms, 33 %); alt at 2 | **54** (end signal, 1800 ms, 90 %) | 60 (6 f = 200 ms after the end signal) | 60 f = 2000 ms |
| Attack, run-in set ATTACK1_00 / _01 (loop) / _02 | 25 / 45 loop / 40 | | no signals in any of the three | | | not her normal attack [I], see below |
| **Black Magic, cast type 1** MAGIC1_00 / _01 (loop) / _02 | 45 / 24 loop / 43 | f0 of _00 | _02 frame **28** = 73 f after the cast starts (2433 ms) + dwell | _02 end 43 (15 f after the hit, 500 ms) | same | 88 f without dwell (2933 ms) |
| **cast type 2** MAGIC2_00 / _01 / _02 | 49 / 23 loop / 48 | f0 | _02 frame **15** = 64 f (2133 ms) + dwell | _02 end 48 (33 f after the hit, 1100 ms) | same | 97 f (3233 ms) |
| **cast type 3** MAGIC3_00 / _01 / _02 | 55 / 30 loop / 90 | f0 | _02 frame **20** = 75 f (2500 ms) + dwell | _02 end 90 (70 f after the hit, 2333 ms) | same | 145 f (4833 ms) |
| **Item** ITEM_00 / _01 (loop) / _02_1 or _02_2 | 22 / 50 loop / 64 or 56 | f0 of _00 | _02_1 frame **37** (= 59 f in, 1967 ms); _02_2 frame **33** (= 55 f, 1833 ms); a sound event 2 or 1 frames earlier (35 / 32) | clip end | same | 86 f (2867 ms) or 78 f (2600 ms) without dwell |
| **Hurt** DMG1 / DMG2 | 50 / 47 | the reaction starts at f0 | no signals | | | 1667 / 1567 ms |
| Hurt, heavy HDMG1 / HDMG2 | 50 / 54 | f0 | none | | | 1667 / 1800 ms |
| **KO** DEAD_00 -> DEAD_01 (hold) | 65 / 1 loop | f0 | floor-impact sound at 37 (57 %) | DEAD_00 end 65 | held on the last pose forever | 65 f = 2167 ms to the hold |
| Revive DEAD_02 | 90 | | | | | 3000 ms |
| **Victory** WIN_00 -> WIN_01 (loop) | 118 / 30 loop | f0 | | | | 3933 ms, then a 1000 ms loop |
| Guard GUARD_00 / _01 loop / _02 | 35 / 65 / 30 | | | | | for completeness |
| Low HP WEAK1_00 / _01 loop / _02 | 31 / 45 / 44 | | | | | for completeness |

## 3. Tidus (motion set c001; names TIDU_*)

His melee set is the run-in (RUN_00, RUN_01) plus ATTACK1_00..03; his stand-still strike is ATTACK2. (The `TIDU_S_*` clips in resident3 are the swim variants, left out [I].)

| Action | Clip frames | Anticipation start | Hit/release frame | Follow-through end | Recovery end | Total |
|---|---|---|---|---|---|---|
| **Idle** IDLE1 | 28 f = 933 ms | | | | | IDLE2 also 28 f |
| **Attack, melee** RUN_00 15 + RUN_01 16 (loop) then ATTACK1_00 -> ATTACK1_01 | 21 + 15 | f0 of ATTACK1_00 (after the run-in) | ATTACK1_00 frame **20** of 21 (667 ms; alt at 14) | ATTACK1_01 end signal at **10** (= 31 f, 1033 ms from the strike start) | ATTACK1_01 end 15 (= 36 f, 1200 ms) | strike clips 36 f = 1200 ms |
| the way back ATTACK1_02 -> ATTACK1_03 | 14 + 11 | | | | | run-back time is distance-dependent [I] |
| **Attack, stand-still** ATTACK2 | 86 f = 2867 ms | f0 | **26** (867 ms, 30 %); alt at 3 | **80** (2667 ms, 93 %) | 86 | 86 f |
| **Skill / cast** (his set has only cast type 2) MAGIC2_00 / _01 loop / _02 | 20 / 16 / 39 | f0 | _02 frame **12** = 32 f in (1067 ms) + dwell | _02 end 39 (27 f after the hit) | same | 59 f (1967 ms) |
| Skill clip SKILL_00 / _01 loop / _02 | 21 / 20 / 34 | f0 | _02 frame **15** = 36 f in (1200 ms) + dwell | _02 end 34 | same | 55 f (1833 ms) |
| **Item** ITEM_00 / _01 loop / _02_1 or _02_2 | 25 / 16 / 54 or 74 | f0 | _02_1 frame **21** (= 46 f, 1533 ms); _02_2 frame **28** (= 53 f, 1767 ms); sound 1 f earlier | clip end | same | 79 f (2633 ms) or 99 f (3300 ms) |
| **Hurt** DMG1 / DMG2 | 30 / 30 | f0 | none | | | 1000 ms each; no heavy-hit pair in his bank |
| **KO** DEAD_00 -> DEAD_01 hold | 61 / 1 loop | f0 | impact sound at 29 (48 %) | 61 | held | 2033 ms to the hold |
| Revive DEAD_02 | 55 | | | | | 1833 ms |
| **Victory** WIN_00 -> WIN_01 loop | 110 / 50 loop | f0 | | | | 3667 ms, then a 1667 ms loop |

Observation: Tidus's ATTACK1_00 carries each of its four events **twice** (the clip's list has 8 records: the same hit, alt and two sound events repeated). The dispatcher fires both copies on the same tick, so the hit signal reaches the handler twice at frame 20. What the second delivery does to a one-hit attack is not read (open).

## 4. Auron (motion set c003; names AURO_*)

| Action | Clip frames | Anticipation start | Hit/release frame | Follow-through end | Recovery end | Total |
|---|---|---|---|---|---|---|
| **Idle** IDLE1 | 50 f = 1667 ms | | | | | IDLE2 70 f = 2333 ms |
| **Attack, melee** RUN_00 10 + RUN_01 16 (loop) then ATTACK1_00 (no signals) -> ATTACK1_01 | 10 + 39 | f0 of ATTACK1_00 | ATTACK1_01 frame **12** = **22 f from the strike start** (733 ms, 45 % of 49); alt at 3 | ATTACK1_01 end signal **32** = 42 f (1400 ms, 86 %) | 49 f (1633 ms) | 49 f |
| the way back ATTACK1_02 -> ATTACK1_03 | 14 + 10 | | | | | |
| **Attack, stand-still** ATTACK2 | 80 f = 2667 ms | f0 | **20** (667 ms, 25 %); alt at 1 | **64** (2133 ms, 80 %) | 80 | 80 f |
| **Skill / cast** (cast type 2 only) MAGIC2_00 / _01 loop / _02 | 25 / 30 / 85 | f0 | _02 frame **34** = 59 f in (1967 ms) + dwell | _02 end 85 (51 f after the hit) | same | 110 f (3667 ms) |
| Skill clip SKILL_00 / _01 loop / _02 | 20 / 20 / 60 | f0 | _02 frame **13** = 33 f in (1100 ms) + dwell | _02 end 60 | same | 80 f (2667 ms) |
| **Item** ITEM_00 / _01 loop / _02_1 or _02_2 | 30 / 30 / 70 or 70 | f0 | _02_1 frame **31** (= 61 f, 2033 ms); _02_2 frame **32** (= 62 f, 2067 ms); sound 3 f earlier | clip end | same | 100 f (3333 ms) |
| **Hurt** DMG1 / DMG2 | 40 / 40 | f0 | none | | | 1333 ms |
| Hurt, heavy HDMG1 / HDMG2 | 65 / 60 | f0 | none | | | 2167 / 2000 ms |
| **KO** DEAD_00 -> DEAD_01 hold | 65 / 1 loop | f0 | sounds at 8 and 28 (43 %) | 65 | held | 2167 ms to the hold |
| Revive DEAD_02 | 85 | | | | | 2833 ms |
| **Victory** WIN_00 -> WIN_01 loop | 120 / 50 loop | f0 | | | | 4000 ms, then a 1667 ms loop |

## 5. Which clip an action plays (the script side)

All from the common battle script `system_01.bin` (worker 37, the motion handler), read in the disassembly [R]; the slot numbers are the engine's standard motion slots (hex 0x01 idle, 0x02..0x06 attack, 0x38..0x41 hurt, 0x48..0x4A KO, 0x50/0x51 run, 0x58..0x5D attack set 1/2, 0x60/0x68/0x70 cast types 1/2/3, 0x88..0x8B item, 0x90/0x91 victory; slot names from the community table [E]). The pairing of a slot to a model's named clip is by name [I].

- **Attack.** The script reads a per-attacker flag (property 247). Flag 0 (a runner): it homes on the target playing RUN_00 then RUN_01 (hold), starts slot 2 (ATTACK1_00) with the lunge, waits, then slot 3 (ATTACK1_01) or, when a bit of the attack flags is set and the calculation result is 1 (read as a miss [I]), slot 6 ("attack miss"), ends the action, and (if the return bit is set) plays slot 4 (ATTACK1_02) while moving back and slot 5 (ATTACK1_03). Flag set: no run-in, slot 0x5C (ATTACK2) in place. Lulu's ATTACK1 clips carry no signals and ATTACK1_01 is an endless hold, while ATTACK2 has hit and end signals, so her normal attack is ATTACK2 [I]. Tidus and Auron use ATTACK1 on ground targets and ATTACK2 in the place-and-strike case [I: flag meaning not read; "ranged or flying target" is the guess].
- **Black Magic / Skill.** Magic-start tag: weak state reset, MP limit applied, then a switch on the cast type (Chr property 133, values 0, 1, 2) -> slot 0x60 / 0x68 / 0x70 once, wait, then the matching `_01` hold. Magic-launch tag: the matching `_02` (slot 0x62 / 0x6A / 0x72), wait to its end, end the action, return to idle. **How long the hold lasts is set by the spell effect, not by the clip** (the hold clip loops until the launch tag). Which spell uses which cast type was not read (see live checks). Lulu has all three types, Tidus and Auron only type 2 [R: bank contents].
- **Item.** Item-start tag: sound effect 30, slot 0x88 (ITEM_00) then slot 0x89 (ITEM_01, hold). Item-launch tag: sound effect 29, then slot 0x8A (ITEM_02_1) if the target group overlaps the party's front line, else slot 0x8B (ITEM_02_2); wait to the clip end; end the action. So the first release variant is for party targets and the second for others [R script; reading of the group names is the disassembler's, interpretation I].
- **Hurt.** Light hit: sound effect 11, slot 0x38 (DMG1) or 0x39 (DMG2) depending on the side the hit came from (a direction test on the actor), wait for the clip, back to idle. Heavy hit: sound effect 12, slot 0x40 / 0x41 (HDMG1 / HDMG2). No battle signal is involved. The exe has the same pair of calls from the damage routine (MsDamageSetMotion 0x78CA20 [E: fh-ffx-calls]).
- **KO.** Slot 0x48 (DEAD_00) played once and waited on, then slot 0x49 (DEAD_01, one frame, looping) is held for good; the actor is marked dead. Revival plays slot 0x4A (DEAD_02) [R].
- **Victory.** Slot 0x90 (WIN_00) once, then slot 0x91 (WIN_01) looping until the results screen takes over [R].
- **Idle.** Slot 0x01 repeated a random number of times, then slot 0x11 (the variation) [R].

## 6. Item use: what the original shows

**The files do not settle it.** What is read: there is a start clip (ITEM_00), a hold loop (ITEM_01) and two release clips, each with **a sound event (type 1, id 1) one to three frames before the release signal 0**; the start tag and the launch tag each start their own sound effect (30, then 29); and the release variant depends on whether the target is in the party's front line. The item records themselves (`item.bin`) point at effect ids (Potion 0x6C, Hi-Potion 0x6E, X-Potion and Mega-Potion 0x70, Phoenix Down 0x72/0x73, Mega Phoenix 0x74/0x75, Grenade 0xF1/0xF2) and use caster animation class 2 (Attack is 1, Black Magic spells 3); the effect files themselves were not opened, so whether an object is drawn, thrown or only a glow appears is **not read**. The shape of the data (a swing with a release signal in the middle, a different swing for allies and enemies, a sound just before the release) is that of a toss toward the target, but that is an inference [I], not a reading. It is on the live-check list (frames only).

**Live answer (live session 6, 2026-10-19) [M].** Two item uses were played in a real battle and read frame by frame (Silenced party, a lone foe; frame names s6-i03 to s6-i10 and s6-r05 to s6-r12, local only):

| Item use | What the screen showed | Label |
|---|---|---|
| **A Potion used on oneself** (Yuna on Yuna) | The camera closes in on the user. **The staff stays in her hand and no item object is drawn.** Green glow particles gather around her, and the gesture ends with her hands brought to her chest. The heal (HP 428 to 628) lands about 5.8 s after the command is taken, read from the sampler: a wall-clock figure that includes the camera move and the hold. | [M] |
| **A Phoenix Down used on an ally** (Tidus on a K.O.'d Yuna) | The camera closes in on the user. **A green glowing orb rises from his hand, he makes an overhand toss toward the target, and sparkles fall on the target.** No item model is drawn at any point. The revive (Yuna HP 0 to 1937) lands about 3.5 s after the command is taken, read from the sampler, wall-clock. | [M] |

What this settles: the earlier [I] reading that the item swing "reads like a toss" is **confirmed for an ally target** (Tidus, Phoenix Down on a party member): there is an overhand toss, but what is thrown is a glowing orb of effect light, not a bottle or any model. For a Potion used on oneself there is no throw at all, only a glow and a hands-to-chest finish with the weapon still held.

What it does not settle: whether the no-throw of the first use comes from the self target or from the character (the two uses differ in both: Yuna on herself, Tidus on an ally), which release clip ran (`_02_1` or `_02_2`; a party-target use is the first one by the script reading, but nothing on screen tells them apart), an **enemy** target (a Grenade or a damaging item thrown at a foe), Lulu's and Auron's item gestures (the two uses above are Yuna's and Tidus's; Yuna's own motion set is not in the tables here), and the frame counts of the gesture (the two times above are wall-clock, command to HP change, and include the hold).

## 7. What this means for our rigs (plain words)

- **The hit is not at the end of the clip, except Tidus's strike.** Lulu's doll throw puts contact a third of the way in (20 of 60) and then spends 34 frames in follow-through and 6 frames settling: the throw is a quick snap with a long, lazy finish. Tidus's stand-still strike is the same shape (26 of 86). Tidus's normal melee hit lands on the **last frame of its 21-frame lunge** (frame 20), so everything before it is anticipation and run-in, and the follow-through is the next 15-frame clip. Auron needs a 10-frame step first and then lands the hit 12 frames into a 39-frame swing (22 of 49 overall, 45 %), with 20 frames of follow-through to the end signal and 7 more to the end of the clip.
- **Casts are three-part, and the middle part has no fixed length.** Wind-up is long (Lulu 45 to 55 frames, 1.5 to 1.8 s), then a short hold loop of about a second that plays only until the spell is ready, then the release clip with the cast gesture landing 15 to 28 frames in. After the release the character is not free for 15 frames (type 1), 33 (type 2) or **70 frames (type 3, 2.3 s)**. Rigs should keep the three parts as separate clips with the hold looping seamlessly, because the hold length varies with the spell's effect.
- **Items are slower than attacks.** From the command to the release signal it is about 1.5 s (Tidus), 1.8 to 2.0 s (Lulu) to 2.1 s (Auron) plus the hold, then the clip finishes (another 0.3 to 1.1 s). Two release gestures are needed per character: one for party targets, one for the rest.
- **Hurt reactions are one clip each, with no signal:** the whole recoil starts on the first frame of the hit (a tick after the damage) and lasts 1.0 s (Tidus) to 1.7 s (Lulu) for a light hit, 2.0 to 2.2 s for Auron's heavy hit. They are the longest "locked" time in a fight after a cast.
- **KO is a fall plus a permanent hold.** The body reaches the floor (impact sound) 43 to 57 percent of the way through a 61 to 65 frame fall, then holds the last pose with no motion at all. Revival is a separate get-up clip of 55 to 90 frames.
- **Victory is a one-shot cheer of 3.7 to 4.0 s, then a 1 to 1.7 s loop.** The idle loops are short: 0.9 s (Tidus), 1.7 s (Auron), 2.0 s (Lulu), with a random longer variation.
- **Blends.** Each clip start cross-fades from the previous pose over a number of frames stored per actor (Chr+0x73A, copied to Chr+0x752 at clip start [R]). The value was not read, so the tables are clip-to-clip with no blend time added.

## 8. Open items and the live-check list (frames only; the game was not run)

1. **Update tick rate.** Confirm one Lulu ATTACK2 (60 frames) takes 2.0 s wall-clock in the HD game; that fixes the ms column. (Count frames from the command to the idle pose.)
2. **Item gesture.** ANSWERED IN PART by live session 6 (section 6) [M]: no bottle or other object is drawn; a self-use Potion shows only a glow and a hands-to-chest finish, an ally-use Phoenix Down shows a glowing orb tossed overhand. STILL OPEN: an enemy target (the other release clip), Lulu's and Auron's gestures, and frame-stepped counts (about frames 55 to 64 after the command for Lulu) instead of wall-clock seconds.
3. **Cast type per spell.** Which of Lulu's three cast types Fire, Fira, Firaga (and the other elements) use; type 3's long 90-frame finish suggests the top tier, but nothing here sources that.
4. **Cross-fade length** between clips (Chr+0x73A): the value in a running battle.
5. **Tidus's double hit event.** Does a single normal attack show one slash or two, and does the second delivery of signal 0 do anything.
6. **Attack-miss clip** (slot 6): which clip plays on a miss, and its length.
7. **Which attack set** (ATTACK1 or ATTACK2) a fighter uses against flying targets and the meaning of property 247.
8. Signals 3 to 8 and the hit-form routines 0x7B77C0 / 0x7B75C0 were not read in depth.

## Provenance

The tables come from `tables.py` over the motion banks (frame counts, repeat counts and event records; 100 percent of listed clips decode) and from the system_01 disassembly kept in `D:\Tools\ffx-parity\camera\work\dis-system_01.txt`. Working files were in `D:\Tools\ffx-parity\tmp\motion-timing\` and are deleted. The exe addresses above were read through the FFX Ghidra server with GET requests only.
