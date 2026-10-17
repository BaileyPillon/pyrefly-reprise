# Re-parity RC9 X2-A, slice 1: the hit reaction of a body is the chain window (lane X2-A rows XA1, XA2, XA4, XA7)

Status: **built, tested, measured and committed on branch `re-parity-rc9-x2-hit-reaction` (from `origin/r50-release`, `6b638df95`); pushed to `origin/re-parity-rc9-x2-hit-reaction`; not merged to main, not deployed** (written 2026-10-16, resumed and finished 2026-10-17). Tip: the commit that adds this note (code and tests last changed in `077150fc8`).
**Restacked for release 53 (2026-10-17): the same slice, merged onto r52-rc plus the Chapter VI link opening as branch `re-parity-rc9-x2-hit-reaction-r52` (base `35aa31e77`); see section 12 for the merge, the re-pins and the combined Chapter VI numbers. Sections 1 to 11 are the lane's own text, measured on release 50.1; the two corrections of the independent check are folded in below (the Trema damage figure in section 5.2, the CHANGELOG paragraph in section 9, the data-file comment in section 12).**
**Game case: FFX-2 only** (AGENTS.md rule 14), and why: FFX is CTB and has no per-character animation machines of this kind (note FFX2-G01 line 3); nothing here touches an FFX file, and `ffx-engine-golden` and `ff7-golden` run unchanged and green.
Sources: the checked note `FFX2-G01` sections 3 to 7, 13, 14 and 16 (`D:\Tools\ffx-parity\coverage\ffx2\`; 267,652 vectors, 0 mismatches), the live game of 2026-10-13 (`D:\Tools\ffx-parity\live\2026-10-13-live-session.md`, question Q1: three hit-reaction lengths, one tick-halving reading, one animation-ratio reading), and Bailey's decision D-768 (2026-10-11): "FFX-2 chain windows per body, about 1.1 seconds for a girl and 1.7 and 2.7 seconds for Bahamut, after one live measurement in the real game."
Authority: Bailey, 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game", "Keep going!"; 2026-10-17 "continue on please".
**No boss number and no party number was changed or added.** No screen was touched. No random number is drawn by anything in this lane. The game was not run; the emulator harness was run only to regenerate the 93,000 character updates of proof 6 (no game process).

| Commit | What |
|---|---|
| `11fc2b8e6` | data: the game's `dmg1` and `hdmg1` clip lengths for the 51 girl motion sets and the 36 monster ones our FFX-2 chapters use (numbers only) |
| `2fe63ec18` | kernel: the interrupt comparator, the result-to-motion chooser, the animation speed ratio and the per-step chain clear, proven on 20,000 / 30,000 / 20,000 vectors and 93,000 character updates |
| `c01cd6f80` | wiring: the chain window, the halved-tick span and the forced hit are each body's damage clip plus one step; Haste halves them, Stop and Petrify give none; one switch, `CHAIN_WINDOW_PER_BODY`; re-pins `ffx2-atb-golden`, all 60 digests |
| `87c0dc06e` | bench: the before / after and ablation measurement (three speeds, eight arms) and the knobs that take the slice apart |
| `63490f1da` | tests: the three log-pinned tests the slice moved (`ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay`, `den-of-woe-carry`: 59 pins), re-pinned with their cause |
| `077150fc8` | tests: the six seed-dependent tests the slice moved, searched again in seed order (`parity-ffx2-engine-interrupt`, `tourist-trap-turns`, `experiment-story`, `advisor-line-first`, `advisor-v3-final`, `trema-retry-flow`) |
| this commit | this note |

## 0. In one paragraph (player words)

A hit used to open a 2-second chain window (3 seconds after a critical) on everyone. In the game the window is the time the target spends in its own flinch animation: about a second for a girl (0.8 to 1.7 seconds by dressphere), 1.7 seconds for Bahamut (2.7 after a critical), a second for Yojimbo, 0.7 for Nooj, half a second for Trema and a third to a half of a second for Vegnagun's parts. This slice makes each body's window its own flinch, plus one step the live game showed. The flinch also halves the target's gauge for exactly as long, and a target in its flinch cannot dodge; Haste makes the flinch half as long, Stop and Petrify have none. A girl who is hit is therefore locked for about a second instead of two, but her gauge crawls for about a second instead of half a second; chains on the short-flinch bodies (Trema, the Vegnagun parts, Nooj, the Experiment) now need hits much closer together. **Measured over 500 seeds of every FFX-2 chapter at three paces (section 5): four chapters get harder beyond noise, Chapter X (Trema) from 337 to 288 first-try wins at the Wait pace, 244 to 167 at Active and 151 to 127 of 200 at the bench pace, the hidden Tourist Trap from 449 to 423 at Wait, Chapter XII (the Den of Woe) from 484 to 452 at Active, and the hidden Experiment (Masterpiece Theatre) from 362 to 272 at the bench pace only (at Wait 234 to 235, at Active 239 to 228); Chapter V moves within noise and the others not beyond it.** One constant, `CHAIN_WINDOW_PER_BODY` in `constants.ts`, turns the whole slice off; off, the engine is the engine of release 50 byte for byte (and, merged onto r51-rc, r51's byte for byte): proved on the first seeds of Chapters IV and V, on the four golden arrays and on 59 further pinned logs.

## 1. The calibration: one scheduling offset, k = 1 (open question 1 of the note)

The window is the clip plus a few steps of script scheduling (note section 7.2: clip +1, +2 or +3). The live game of 2026-10-13 gave three reaction lengths for a girl as the target (the reaction flag `Chr+0xD98`, in whole steps, 7 of 7, 3 of 3 and 7 of 7 hits):

| Girl and dressphere | Live reaction (steps) | Her motion set (slot 14, the Mascot) | dmg1 frames | Animation ratio | Clip in steps | Offset k |
|---|---:|---|---:|---|---:|---:|
| Yuna, Moogle Mascot | 31 | 0x8 | 30 | 1.0 | 30 | **1** |
| Paine, Tonberry Mascot | 37 | 0x30 | 36 | 1.0 | 36 | **1** |
| Rikku, Black Cat Mascot, Hasted | 15 | 0x1c | 28 | 2.0 (live: `Chr+0x2E2` = 0x200) | 14 | **1** |

**One offset fits all three: k = 1.** No other offset does (k = 0 gives Yuna 30, k = 2 gives Yuna 32; `parity-ffx2-hit-reaction.test.ts` "the scheduling offset is 1" checks 0, 1, 2 and 3). The fit rests on one reading of the order of a girl's sets: **a girl's 17 motion sets are in the order of her dressphere jobs, so slot 14 is the Mascot** (the game's job numbers: 1 Gunner ... 14 Mascot, 15 the Special's body, 16 and 17 its pods). The three Mascot sets are not three free choices: the same ordinal (14) gives all three lengths, no other single ordinal does, and the pods' set numbers run in step across the three girls (0x44, 0x45, 0x46 and 0x3ce, 0x3cf, 0x3d0), which is the frame table's own sign that slots 16 and 17 are the pods. Only slot 14 is fixed by a measurement; the other thirteen dresspheres rest on the same order.

Three things the offset does not settle, and what the code does, and a fourth that it explains:
1. **Monsters.** The monster side was not measurable (every enemy on the reachable floor died to the first hit). The girls' damage script holds a one-step wait that the monsters' does not; if that wait is the whole of the offset, a monster's window is one step shorter than the code gives (0.03 s). The code carries k = 1 over unchanged and says so (`constants.ts` `HIT_REACTION_SCHEDULING_STEPS`).
2. **Odd clips at twice the speed.** Rikku's 28-frame clip at ratio 2.0 is 14 steps and the offset is a step, not a frame, in the code (`ceil(clip / ratio) + 1`); an offset of one frame would give the same 15 for every even clip and one step less for an odd one. One Hasted reading cannot tell the two apart. Affects only a Hasted target with an odd clip.
3. **A defending target.** The game asks for the guard tag (25) when the hit lands on a guard; the girls' guard clip and the monsters' flat 15-frame wait are not wired (the code uses dmg1 / hdmg1 as the brief says).

4. **The old flat 15 steps was a Hasted Rikku.** The release-50 engine halves a hit target's gauge for a flat `HIT_REACTION_STEPS = 15`, read off the 2026-10-09 session ("tick halved for 14 and 15 of those 48 steps", `research/re-ffx2-timing-measured.md` section 5). In that session "Rikku carried Haste throughout (tick 99)", and a Hasted Rikku's flinch is the Black Cat clip of 28 frames at twice the speed, 14 + 1 = 15: the same figure the 2026-10-13 live game gave for her (row 3 above). So the plan's "contradiction to settle before wiring" (`wiring-plan-draft-2026-10-11.md`, lane X2-A) is not one: the measured 14 to 15 was a Hasted girl's reaction, and an ordinary girl's halving is twice as long (24 to 51 steps, 31 for Yuna's Mascot). The constant is kept only for the bodies outside the data and for the switch off.

## 2. What the engine does now

| File | Change |
|---|---|
| `src/battle/ffx2/kernel/hit-reaction.ts` (new, 250 lines) | `interruptMask` (exe 0x632610), `chooseReaction` (0x6327d0), `animationRatio` (0x632200), `chainUpdate` (the chain rule of 0x643d80), `keepsChainAlive` (the kinds 3, 4, 8, 13 to 16 of note section 5) |
| `src/battle/ffx2/reaction.ts` (new, about 220 lines) | body lookup (`bodyOf`), `reactionWindow`, `reactionSpan`, `inHitReaction`, `clearsOnStop`, and the measurement knobs `withReactionKnobs` |
| `src/data/ffx2/hit-reaction-frames.ts` (new, 176 lines) | the numbers (section 4) |
| `src/battle/ffx2/chain.ts` | `bumpChain` opens the window at the body's length; `advanceChainWindows` clears the counter by the game's per-step rule (`chainUpdate`) and at once for a Stopped or Petrified body in the data |
| `src/battle/ffx2/resolve-strike.ts` | `gauge.hitReaction` (the tick-halving span, note row 6 of section 13) is the reaction of this hit; it was a flat 15 |
| `src/battle/ffx2/adapt/inputs.ts` | `inHitReaction` (the forced hit, XA4) reads the reaction, not the chain window, for a body in the data |
| `src/battle/ffx2/constants.ts` | `CHAIN_WINDOW_PER_BODY = true`, `HIT_REACTION_SCHEDULING_STEPS = 1`; `CHAIN_WINDOW_TICKS`, `CHAIN_WINDOW_TICKS_CRIT`, `HIT_REACTION_STEPS` stay (a body outside the data, and the switch off) |
| comments only | `internal.ts`, `atb-engine.ts`, `kernel/apply.ts` |

The rule, in one line: `steps = ceil(clip frames x 256 / ratio) + 1`, with the clip from the chooser's tag (26 a hit, 27 a critical), the ratio from `animationRatio` (Haste 0x200; Slow leaves a damage clip at 0x100, because dmg1 and hdmg1 are motion ids 0x38 and 0x40, outside Slow's 0x10 to 0x2a; Stop and Petrify 0), and a Stopped or Petrified target asked for nothing. A body outside the data keeps 60 / 90 / 15.

`engine-core.ts` is not touched (396 lines on this base); no file went over 400 lines (`resolve-strike.ts` 387, `internal.ts` 393).

**What is left as a comment and not a behaviour** (the brief's out-of-scope rows): XA3 the start gate (`chain.ts isActionLocked` still reads the window; a reacting girl is locked for her reaction now, about a second, where it was two), XA5 the block-mask feeder, XA6 action time, XA8 armour (an armoured command's two-step freeze), XA9 the flinch that replays a cast's start tag, the guard reaction (tag 25), the death tag in flight for the forced hit (a KO'd unit leaves the field at once here), and result kind 8 (a status-only hit that keeps a chain alive). Kind 8 was not wired because the engine cannot classify a result as "status-only" without `pp_result_kind`, which is not recovered (note section 16 item 3); IC-1 (D-242) keeps the immune kinds 3 and 4 out of the chain, and kinds 13 to 16 are the motion signals' reaction-only hits, which the engine has no counterpart for. `keepsChainAlive` is the table for when they are.

## 3. Proofs

| Proof | What | Result |
|---|---|---|
| comparator `0x632610` | all 20,000 vectors of the proof folder (`x1_comparator.jsonl`) | **20,000 of 20,000** |
| chooser `0x6327d0` | all 30,000 (`x3_chooser.jsonl`): the request, the death attempt, the freeze counter, the return value | **30,000 of 30,000** |
| animation ratio `0x632200` | all 20,000 (`x5_speed.jsonl`) | **20,000 of 20,000** |
| per-step chain rule `0x643d80` | 3,000 worlds of 31 characters regenerated with the emulator from the note's own seed (`x6_chain.py`, 93,000 character updates; the original log kept only counts) | **93,000 of 93,000** |
| committed sample | `tests/fixtures/parity/ffx2/hit_reaction.json`: 288 comparator, 452 chooser, 311 ratio vectors and 24 worlds (744 updates), stratified so every branch is in; always runs | all pass |
| mutation check | five deliberate breaks of the kernel (the Slow range, the critical tag, the freeze order, one comparator operator, the Haste factor), then two more on the ratio edges | every one caught by the committed sample alone |
| engine | `ffx2-hit-reaction-wiring.test.ts` (17 tests; its switch-off pins are r50's first golden seeds): the three live Mascot lengths, the bosses' normal and critical windows, Haste, Slow, Stop, Petrify, the chain events step by step, the forced hit, every unit of every FFX-2 chapter looked up, the switch off reproduces the old event logs, each measurement knob | all pass |

The full replay runs with `PYREFLY_X2A_PROOF=<the G01 proof folder> PYREFLY_X2A_WORLDS=<worlds file> node vitest.mjs run tests/unit/parity-ffx2-hit-reaction.test.ts`; without them the four full-proof tests skip. The worlds file comes from `x6_dump.py` (a copy of `x6_chain.py` that also writes each world and the emulator's answer); it is a scratch script kept out of the repo, in the lane's temp folder.

## 4. The numbers

### 4.1 The girls, by dressphere (slot = the game's job number)

Window = `ceil(dmg1) + 1` steps at normal speed (a Hasted girl: `ceil(dmg1 / 2) + 1`); where the critical clip differs (Paine's slot 4, 32 against 35) both are given. 29.97 steps are a second. A girl in a Special dressphere (Floral Fallal, Machina Maw, Full Throttle) is slot 15; the pods (slots 16 and 17) are not units in this engine. `psychic` and `festivalist` have no set and keep 60 / 90 / 15.

| Slot | Dressphere | Yuna set | dmg1 / hdmg1 | window (steps) | Rikku set | dmg1 / hdmg1 | window | Paine set | dmg1 / hdmg1 | window |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | Gunner | 0x1 | 30 / 30 | 31 | 0x1a | 33 / 33 | 34 | 0x33 | 40 / 40 | 41 |
| 2 | Gun Mage | 0x2 | 30 / 30 | 31 | 0x15 | 33 / 33 | 34 | 0x29 | 35 / 35 | 36 |
| 3 | Alchemist | 0x3 | 35 / 35 | 36 | 0x16 | 33 / 33 | 34 | 0x2a | 35 / 35 | 36 |
| 4 | Warrior | 0xb | 24 / 24 | 25 | 0x17 | 33 / 33 | 34 | 0x2b | 35 / 32 | 36 / 33 |
| 5 | Samurai | 0xc | 35 / 35 | 36 | 0x1f | 28 / 28 | 29 | 0x34 | 30 / 30 | 31 |
| 6 | Dark Knight | 0xd | 29 / 29 | 30 | 0x20 | 26 / 26 | 27 | 0x35 | 32 / 32 | 33 |
| 7 | Berserker | 0xe | 28 / 28 | 29 | 0x21 | 32 / 32 | 33 | 0x36 | 32 / 32 | 33 |
| 8 | Songstress | 0x10 | 29 / 29 | 30 | 0x22 | 28 / 28 | 29 | 0x38 | 30 / 30 | 31 |
| 9 | Black Mage | 0x11 | 35 / 35 | 36 | 0x24 | 24 / 24 | 25 | 0x39 | 35 / 35 | 36 |
| 10 | White Mage | 0x12 | 35 / 35 | 36 | 0x25 | 30 / 30 | 31 | 0x3a | 35 / 35 | 36 |
| 11 | Thief | 0x6 | 35 / 35 | 36 | 0x26 | 40 / 40 | 41 | 0x2e | 30 / 30 | 31 |
| 12 | Trainer | 0x7 | 33 / 33 | 34 | 0x1b | 26 / 26 | 27 | 0x2f | 40 / 40 | 41 |
| 13 | Lady Luck | 0x13 | 23 / 23 | 24 | 0x27 | 32 / 32 | 33 | 0x3b | 35 / 35 | 36 |
| 14 | Mascot | 0x8 | 30 / 30 | 31 | 0x1c | 28 / 28 | 29 | 0x30 | 36 / 36 | 37 |
| 15 | Special (body) | 0x14 | 50 / 50 | 51 | 0x28 | 40 / 40 | 41 | 0x3c | 50 / 50 | 51 |
| 16 | Special pod 1 | 0x44 | 34 / 34 | 35 | 0x45 | 36 / 36 | 37 | 0x46 | 32 / 32 | 33 |
| 17 | Special pod 2 | 0x3ce | 26 / 26 | 27 | 0x3cf | 35 / 35 | 36 | 0x3d0 | 32 / 32 | 33 |

### 4.2 Every enemy, part and boss of an FFX-2 chapter

Keyed by the game's monster row (`enemy.ffx2Record.row`). Window = `ceil(clip) + 1` steps; the Hasted column is `ceil(clip / 2) + 1`.

| Unit (our id) | Name | Monster row | Motion set | dmg1 | hdmg1 | Window, normal (steps / s) | Window, critical | Window, Hasted normal / critical |
|---|---|---:|---|---:|---:|---|---|---|
| dr-goon | Dr. Goon | 135 | 0x1085 | 30 | 30 | 31 / 1.03 | 31 / 1.03 | 16 / 16 |
| fem-goon | Fem-Goon | 138 | 0x1088 | 32 | 32 | 33 / 1.10 | 33 / 1.10 | 17 / 17 |
| paragon | Paragon | 152 | 0x1096 | 61 | 75 | 62 / 2.07 | 76 / 2.54 | 32 / 39 |
| x2-valefor | Valefor | 164 | 0x10a4 | 39 | 50 | 40 / 1.33 | 51 / 1.70 | 21 / 26 |
| x2-ixion | Ixion | 166 | 0x10a6 | 34 | 55 | 35 / 1.17 | 56 / 1.87 | 18 / 29 |
| x2-shiva | Shiva | 167 | 0x10a7 | 57 | 65 | 58 / 1.94 | 66 / 2.20 | 30 / 34 |
| bahamut | Bahamut | 168 | 0x10a8 | 51 | 81 | 52 / 1.74 | 82 / 2.74 | 27 / 42 |
| x2-anima | Anima | 169 | 0x10a9 | 40 | 40 | 41 / 1.37 | 41 / 1.37 | 21 / 21 |
| x2-yojimbo | Yojimbo | 170 | 0x10aa | 30 | 57 | 31 / 1.03 | 58 / 1.94 | 16 / 30 |
| cindy | Cindy | 171 | 0x10ab | 44 | 59 | 45 / 1.50 | 60 / 2.00 | 23 / 31 |
| sandy | Sandy | 172 | 0x10ac | 30 | 30 | 31 / 1.03 | 31 / 1.03 | 16 / 16 |
| mindy | Mindy | 173 | 0x10ad | 60 | 60 | 61 / 2.04 | 61 / 2.04 | 31 / 31 |
| x2-daigoro | Daigoro | 174 | 0x10ae | 60 | 60 | 61 / 2.04 | 61 / 2.04 | 31 / 31 |
| shade-baralai | Baralai (shade) | 176 | 0x10b0 | 35 | 36 | 36 / 1.20 | 37 / 1.23 | 19 / 19 |
| shade-gippal | Gippal (shade) | 177 | 0x10b1 | 32 | 32 | 33 / 1.10 | 33 / 1.10 | 17 / 17 |
| x2-experiment(-prototype) | Experiment | 194 | 0x10c2 | 22 | 22 | 23 / 0.77 | 23 / 0.77 | 12 / 12 |
| ormi-entrance | Ormi (entrance) | 243 | 0x1081 | 50 | 50 | 51 / 1.70 | 51 / 1.70 | 26 / 26 |
| ormi-logos-room | Ormi (Logos room) | 244 | 0x1081 | 50 | 50 | 51 / 1.70 | 51 / 1.70 | 26 / 26 |
| ormi | Ormi (last room) | 245 | 0x1081 | 50 | 50 | 51 / 1.70 | 51 / 1.70 | 26 / 26 |
| logos-room | Logos (Logos room) | 249 | 0x1082 | 32 | 32 | 33 / 1.10 | 33 / 1.10 | 17 / 17 |
| logos | Logos (last room) | 250 | 0x1082 | 32 | 32 | 33 / 1.10 | 33 / 1.10 | 17 / 17 |
| leblanc | Leblanc | 253 | 0x1083 | 30 | 30 | 31 / 1.03 | 31 / 1.03 | 16 / 16 |
| shade-nooj | Nooj (shade) | 258 | 0x1102 | 20 | 33 | 21 / 0.70 | 34 / 1.13 | 11 / 18 |
| shuyin | Shuyin (Chapter V) | 260 | 0x1104 | 30 | 30 | 31 / 1.03 | 31 / 1.03 | 16 / 16 |
| x2-angra-mainyu | Angra Mainyu | 268 | 0x110c | 34 | 34 | 35 / 1.17 | 35 / 1.17 | 18 / 18 |
| x2-zarich | Zarich | 269 | 0x110d | 34 | 34 | 35 / 1.17 | 35 / 1.17 | 18 / 18 |
| x2-tawrich | Tawrich | 270 | 0x110e | 34 | 34 | 35 / 1.17 | 35 / 1.17 | 18 / 18 |
| vegnagun-tail | Vegnagun (tail) | 282 | 0x111a | 16 | 16 | 17 / 0.57 | 17 / 0.57 | 9 / 9 |
| vegnagun-leg | Vegnagun (leg) | 283 | 0x111b | 16 | 16 | 17 / 0.57 | 17 / 0.57 | 9 / 9 |
| node-a | Node A | 284 | 0x111c | 10 | 10 | 11 / 0.37 | 11 / 0.37 | 6 / 6 |
| node-b | Node B | 285 | 0x111d | 10 | 10 | 11 / 0.37 | 11 / 0.37 | 6 / 6 |
| node-c | Node C | 286 | 0x111e | 10 | 10 | 11 / 0.37 | 11 / 0.37 | 6 / 6 |
| vegnagun-body | Vegnagun (body) | 287 | 0x111f | 16 | 16 | 17 / 0.57 | 17 / 0.57 | 9 / 9 |
| bulwark-r | Right Bulwark | 288 | 0x1120 | -1 | -1 | none in the data: keeps 60 steps (2.00 s) | keeps 90 (3.00 s) | - |
| bulwark-l | Left Bulwark | 289 | 0x1121 | -1 | -1 | none in the data: keeps 60 steps (2.00 s) | keeps 90 (3.00 s) | - |
| vegnagun-head | Vegnagun (head) | 290 | 0x1122 | 10 | 10 | 11 / 0.37 | 11 / 0.37 | 6 / 6 |
| redoubt-r | Right Redoubt | 291 | 0x1123 | 16 | 16 | 17 / 0.57 | 17 / 0.57 | 9 / 9 |
| redoubt-l | Left Redoubt | 292 | 0x1124 | 16 | 16 | 17 / 0.57 | 17 / 0.57 | 9 / 9 |
| trema | Trema | 295 | 0x1127 | 15 | 15 | 16 / 0.53 | 16 / 0.53 | 9 / 9 |

### 4.3 Bodies not in the data (they keep 60 / 90 / 15 steps, with a comment in the data file and here)

| Body | Why |
|---|---|
| Right Bulwark, Left Bulwark (Chapter V, rows 288 and 289, motion sets 0x1120 and 0x1121) | the sets have no damage clip (dmg1 and hdmg1 are -1); what the game does for a hit on a body with no flinch is not established (it plays the damage script with no clip to wait for), so no number is invented |
| `psychic`, `festivalist` (International-only dresspheres) | the frame table has 17 sets a girl, none for them; no shipped build wears them |
| the Special's pods (slots 16 and 17) | not units in this engine (a Special dress-up is the girl's `dresspheres.current`, slot 15) |
| any unit built without a monster row (a test rig, a hand-made fixture) | nothing to look up |

### 4.4 Chapter V's Shuyin (the judgement note FFX2-G01 leaves open; an open item for Bailey, measured both ways in section 5.4)

The note flags "Shuyin (Vegnagun fight)", motion set 0x1125, whose every clip is 135 frames (4.50 s), as a probable placeholder, and the lane brief asked for Chapter V both ways: the data, and today's window on that one body. **Our Chapter V Shuyin is not that body.** Read again from the game's own monster table (`FFX2-G01\data\monsters.json`, `id - 4096` is the monster row):

| Row (id) | HP | Level | Agility | Commands | Motion set | Where |
|---|---:|---:|---:|---|---|---|
| 260 (4356) | 23,850 | 58 | 133 | five (the Attack is armoured) | **0x1104, 30 frames (31 steps, 1.03 s)** | the Shuyin of Chapter V's link 5 (`m260`, scene `wegn01_225`): the one our `shuyin/shuyin` unit is built from |
| 264 (4360) | 1 | | | | 0x1104 | a one-hit-point record that shares the set |
| 293 (4389) | 80,000 | 1 | 100 | Attack only (unarmoured) | **0x1125, 135 frames** | the second "Shuyin" record of the Vegnagun scene (`m293`), whose script does nothing and whose cursor, existence and in-battle flags are off (`research/re-ffx2-ai-bahamut-vegnagun.md` section 6, line 375) |

So the 135-frame set belongs to the inert record, and the note's two labels ("Den of Woe" for 0x1104 and "Vegnagun fight" for 0x1125) are the note's reading of the two sets, not what the rows say: the Shuyin the player fights has the 30-frame set. The data is applied as it stands (`MONSTER_MOTION_SET[260] = 0x1104`), and no unit of ours is built from row 293. For the record the three ways are measured in section 5.4: **the data (31 steps), today's window on that one body (60 / 90), and the 135-frame set as a what-if (136 steps)**; the third changes nothing a player could meet unless Bailey wants the inert record fought. The knobs are `keepRows: [260]` and `clipsOfRow: { 260: [135, 135] }` in `reaction.ts` (measurement only).

## 5. Measurement: before and after, three paces, 500 seeds; ablation; Shuyin

### 5.0 Method

The SHIPPED `intendedStrategy` plays each chapter's whole chain through the app's own path (`registerBattleContent`, `setupForChapter`, `setupForNextLink`, minigames auto-resolved) on seeds 1 to 500, with the slice **off** (`old`: `withReactionKnobs(OLD_REACTION)`, the engine of release 50 byte for byte) and **on** (`new`: the shipped slice), at three paces: **human** = the default Wait mode with the split (1.5 s a menu, 0.5 s of it on the top list with the clock running, the rest inside a submenu with the clock held); **Active** = Active ATB, 1.5 s a menu with the clock running; **bench** = zero decision time (what the goldens and the parity measurement use). Every one of the twelve FFX-2 chapters of `data/encounters.ts` is covered (`ffx2-bahamut`, `-vegnagun-shuyin`, `-leblanc`, `-fallen-aeons`, `-trema`, `-den-of-woe`, `-ixion-djose`, `-masterpiece-theatre`, `-tourist-trap`, `-valefor-besaid`, `-angra-mainyu`, and the hidden `exp-leblanc`, which plays the same three Leblanc fights as `ffx2-leblanc` and gave the same 500 outcomes and sums at every pace: it is listed for completeness). "Wins" is a **first-try win of the whole chain** (all links, one attempt per seed); "link 1" is the first fight alone. Both arms see the same seeds, so a seed that is won in one arm and lost in the other is counted (`W->L` / `L->W`) and the exact two-sided sign test on those is the `p`; a mover is a chapter where p is below 0.05 at some pace.

**Restart-tolerant:** `D:\Tools\ffx-parity\rc9\x2-hit-reaction\run-all.mjs` writes one JSON file per (chapter, pace, arm, seed range) to `results/` as each job completes, skips any file that exists, runs two vitest processes at a time with `--maxWorkers=2`, and moves a job's file in only after it exited 0 with a valid row. The first session's partial rows (22 rows of seeds 1 to 16 up to 1 to 100, in its own temp folder) were reproduced exactly by this run (every seed outcome equal), so the figures are stable across sessions and processes.

**Partial at the bench pace, said plainly.** The machine was at 100 percent CPU from other sessions while the bench jobs ran (a 500-seed Bahamut bench job took 142 s where the same chapter took 37 s at the human pace an hour earlier), so plan A's driver (`run-all.mjs`) was stopped at the bench pace and plan B (`run-bench2.mjs`) ran it with the heavy chapters at **200 seeds** (Chapters V, VI, IX, X and XVI, and the Shuyin arms); Chapters IV, XI, XII, XIII, XIV and XV have their 500. The Wait and Active paces and the ablation are complete as asked. `exp-leblanc` has no bench row: it is a verified duplicate of Chapter VI at the other two paces. A cell that is not 500 seeds says so.

### 5.1 The tables

Everything below is generated by `analyze.mjs` from the result files.

#### Summary: whole-chain first-try wins out of 500, old -> new (seeds W->L / L->W, sign-test p; ** = p below 0.05)

| Chapter | human (Wait split) | Active | bench (zero decision time) |
|---|---|---|---|
| IV Bahamut | 500 -> 500 (+0; 0 / 0; p=1.000) | 500 -> 500 (+0; 0 / 0; p=1.000) | 500 -> 500 (+0; 0 / 0; p=1.000) |
| V Vegnagun+Shuyin | 473 -> 463 (-10; 20 / 10; p=0.099) | 406 -> 417 (+11; 33 / 44; p=0.254) | [200 seeds] 194 -> 192 (-2; 5 / 3; p=0.727) |
| VI Leblanc | 499 -> 500 (+1; 0 / 1; p=1.000) | 467 -> 474 (+7; 21 / 28; p=0.392) | [200 seeds] 200 -> 200 (+0; 0 / 0; p=1.000) |
| IX Fallen Aeons | 499 -> 498 (-1; 1 / 0; p=1.000) | 499 -> 497 (-2; 2 / 0; p=0.500) | [200 seeds] 200 -> 200 (+0; 0 / 0; p=1.000) |
| X Trema | 337 -> 288 (-49; 114 / 65; p=0.000) ** | 244 -> 167 (-77; 143 / 66; p=0.000) ** | [200 seeds] 151 -> 127 (-24; 42 / 18; p=0.003) ** |
| XII Den of Woe | 499 -> 498 (-1; 2 / 1; p=1.000) | 484 -> 452 (-32; 45 / 13; p=0.000) ** | 500 -> 499 (-1; 1 / 0; p=1.000) |
| XIII Ixion | 500 -> 500 (+0; 0 / 0; p=1.000) | 500 -> 499 (-1; 1 / 0; p=1.000) | 500 -> 500 (+0; 0 / 0; p=1.000) |
| XI Experiment | 234 -> 235 (+1; 11 / 12; p=1.000) | 239 -> 228 (-11; 21 / 10; p=0.071) | 362 -> 272 (-90; 94 / 4; p=0.000) ** |
| XIV Tourist Trap | 449 -> 423 (-26; 54 / 28; p=0.005) ** | 359 -> 339 (-20; 77 / 57; p=0.100) | 470 -> 464 (-6; 21 / 15; p=0.405) |
| XV Valefor | 500 -> 500 (+0; 0 / 0; p=1.000) | 500 -> 500 (+0; 0 / 0; p=1.000) | 500 -> 500 (+0; 0 / 0; p=1.000) |
| XVI Angra Mainyu | 385 -> 383 (-2; 83 / 81; p=0.938) | 29 -> 24 (-5; 27 / 22; p=0.568) | [200 seeds] 190 -> 179 (-11; 18 / 7; p=0.043) ** |
| exp-leblanc (same as VI) | 499 -> 500 (+1; 0 / 1; p=1.000) | 467 -> 474 (+7; 21 / 28; p=0.392) | (not run) |

#### human: first-try wins of the whole chain (500 seeds unless the cell says otherwise), before -> after

| Chapter | link 1 | whole chain old | new | change | seeds W->L / L->W (p) | KOs/seed | enemy chain hits/seed | girl chain hits/seed | longest chain on an enemy (mean) | minutes/seed | party turns/seed |
|---|---|---|---|---|---|---|---|---|---|---|---|
| IV Bahamut | 500/500 -> 500/500 | 500/500 | 500/500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 9.5 -> 8.9 | 0.0 -> 0.0 | 2 -> 2 | 1.3 -> 1.3 | 43.9 -> 43.9 |
| V Vegnagun+Shuyin | 500/500 -> 500/500 | 473/500 | 463/500 | -10 | 20 / 10 (p=0.099) | 1.3 -> 1.7 | 100.4 -> 91.7 | 53.1 -> 53.9 | 19.09 -> 15.86 | 3.8 -> 4.1 | 93.9 -> 101.6 |
| VI Leblanc | 500/500 -> 500/500 | 499/500 | 500/500 | +1 | 0 / 1 (p=1.000) | 1.2 -> 1.4 | 54.7 -> 47.2 | 15.2 -> 18.1 | 6.79 -> 4.66 | 2.5 -> 2.8 | 77.6 -> 86.4 |
| IX Fallen Aeons | 500/500 -> 500/500 | 499/500 | 498/500 | -1 | 1 / 0 (p=1.000) | 0.1 -> 0.1 | 12.9 -> 12.0 | 38.4 -> 37.3 | 2.2 -> 2.16 | 2.5 -> 2.5 | 49.0 -> 49.5 |
| X Trema | 370/500 -> 318/500 | 337/500 | 288/500 | -49 | 114 / 65 (p=0.000) | 1.4 -> 1.7 | 47.6 -> 21.3 | 147.4 -> 159.7 | 3 -> 3 | 8.8 -> 8.3 | 162.1 -> 153.2 |
| XII Den of Woe | 500/500 -> 500/500 | 499/500 | 498/500 | -1 | 2 / 1 (p=1.000) | 0.5 -> 0.6 | 6.2 -> 4.1 | 4.3 -> 5.4 | 2 -> 1.95 | 1.2 -> 1.3 | 31.7 -> 35.1 |
| XIII Ixion | 500/500 -> 500/500 | 500/500 | 500/500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 4.1 -> 2.4 | 0.0 -> 0.0 | 1.92 -> 1.56 | 1.3 -> 1.4 | 27.3 -> 28.6 |
| XI Experiment | 500/500 -> 500/500 | 234/500 | 235/500 | +1 | 11 / 12 (p=1.000) | 1.9 -> 2.0 | 4.4 -> 1.8 | 13.4 -> 13.4 | 1.98 -> 1.37 | 1.0 -> 1.0 | 25.6 -> 27.2 |
| XIV Tourist Trap | 449/500 -> 423/500 | 449/500 | 423/500 | -26 | 54 / 28 (p=0.005) | 0.5 -> 0.8 | 7.3 -> 5.4 | 1.4 -> 1.3 | 1.99 -> 1.75 | 2.3 -> 2.4 | 45.9 -> 46.6 |
| XV Valefor | 500/500 -> 500/500 | 500/500 | 500/500 | +0 | 0 / 0 (p=1.000) | 0.1 -> 0.2 | 3.8 -> 2.7 | 0.0 -> 0.0 | 2.03 -> 1.86 | 1.8 -> 1.8 | 37.6 -> 38.7 |
| XVI Angra Mainyu | 385/500 -> 383/500 | 385/500 | 383/500 | -2 | 83 / 81 (p=0.938) | 4.2 -> 4.1 | 26.1 -> 18.1 | 31.5 -> 29.1 | 1.98 -> 1.95 | 8.1 -> 8.3 | 167.7 -> 174.3 |
| exp-leblanc (same as VI) | 500/500 -> 500/500 | 499/500 | 500/500 | +1 | 0 / 1 (p=1.000) | 1.2 -> 1.4 | 54.7 -> 47.2 | 15.2 -> 18.1 | 6.79 -> 4.66 | 2.5 -> 2.8 | 77.6 -> 86.4 |

#### active: first-try wins of the whole chain (500 seeds unless the cell says otherwise), before -> after

| Chapter | link 1 | whole chain old | new | change | seeds W->L / L->W (p) | KOs/seed | enemy chain hits/seed | girl chain hits/seed | longest chain on an enemy (mean) | minutes/seed | party turns/seed |
|---|---|---|---|---|---|---|---|---|---|---|---|
| IV Bahamut | 500/500 -> 500/500 | 500/500 | 500/500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 6.2 -> 5.4 | 0.0 -> 0.0 | 2.01 -> 2.01 | 1.7 -> 1.7 | 44.1 -> 44.8 |
| V Vegnagun+Shuyin | 500/500 -> 500/500 | 406/500 | 417/500 | +11 | 33 / 44 (p=0.254) | 2.9 -> 2.6 | 98.3 -> 93.8 | 77.4 -> 68.0 | 15.66 -> 12.26 | 4.8 -> 5.0 | 90.7 -> 96.4 |
| VI Leblanc | 500/500 -> 500/500 | 467/500 | 474/500 | +7 | 21 / 28 (p=0.392) | 2.7 -> 2.7 | 40.5 -> 33.9 | 49.4 -> 48.2 | 4.33 -> 3.89 | 4.0 -> 4.2 | 90.4 -> 97.0 |
| IX Fallen Aeons | 500/500 -> 500/500 | 499/500 | 497/500 | -2 | 2 / 0 (p=0.500) | 0.2 -> 0.2 | 9.2 -> 6.7 | 46.3 -> 44.4 | 2.14 -> 2.02 | 3.1 -> 3.1 | 53.5 -> 54.7 |
| X Trema | 274/500 -> 191/500 | 244/500 | 167/500 | -77 | 143 / 66 (p=0.000) | 1.9 -> 2.3 | 28.4 -> 12.8 | 136.8 -> 115.8 | 3 -> 2.98 | 8.3 -> 6.7 | 132.3 -> 106.6 |
| XII Den of Woe | 500/500 -> 500/500 | 484/500 | 452/500 | -32 | 45 / 13 (p=0.000) | 0.9 -> 1.3 | 3.4 -> 1.2 | 5.2 -> 6.1 | 1.98 -> 1.46 | 1.7 -> 1.7 | 35.3 -> 37.3 |
| XIII Ixion | 500/500 -> 499/500 | 500/500 | 499/500 | -1 | 1 / 0 (p=1.000) | 0.0 -> 0.1 | 2.3 -> 1.1 | 0.0 -> 0.0 | 1.8 -> 1.24 | 1.6 -> 1.6 | 28.4 -> 29.6 |
| XI Experiment | 500/500 -> 500/500 | 239/500 | 228/500 | -11 | 21 / 10 (p=0.071) | 2.1 -> 2.2 | 4.3 -> 0.8 | 13.7 -> 13.7 | 2 -> 1.24 | 1.2 -> 1.3 | 24.9 -> 26.8 |
| XIV Tourist Trap | 359/500 -> 339/500 | 359/500 | 339/500 | -20 | 77 / 57 (p=0.100) | 1.3 -> 1.4 | 4.2 -> 1.4 | 1.9 -> 1.8 | 1.94 -> 1.4 | 2.8 -> 2.9 | 46.6 -> 47.6 |
| XV Valefor | 500/500 -> 500/500 | 500/500 | 500/500 | +0 | 0 / 0 (p=1.000) | 0.2 -> 0.2 | 4.9 -> 3.4 | 0.0 -> 0.0 | 2.01 -> 1.91 | 2.1 -> 2.1 | 36.9 -> 37.8 |
| XVI Angra Mainyu | 29/500 -> 24/500 | 29/500 | 24/500 | -5 | 27 / 22 (p=0.568) | 9.8 -> 9.7 | 13.8 -> 7.8 | 45.1 -> 37.7 | 1.88 -> 1.83 | 8.6 -> 8.6 | 143.9 -> 145.5 |
| exp-leblanc (same as VI) | 500/500 -> 500/500 | 467/500 | 474/500 | +7 | 21 / 28 (p=0.392) | 2.7 -> 2.7 | 40.5 -> 33.9 | 49.4 -> 48.2 | 4.33 -> 3.89 | 4.0 -> 4.2 | 90.4 -> 97.0 |

#### bench: first-try wins of the whole chain (500 seeds unless the cell says otherwise), before -> after

| Chapter | link 1 | whole chain old | new | change | seeds W->L / L->W (p) | KOs/seed | enemy chain hits/seed | girl chain hits/seed | longest chain on an enemy (mean) | minutes/seed | party turns/seed |
|---|---|---|---|---|---|---|---|---|---|---|---|
| IV Bahamut | 500/500 -> 500/500 | 500/500 | 500/500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 11.1 -> 9.9 | 0.0 -> 0.0 | 2.07 -> 2 | 1.2 -> 1.2 | 43.9 -> 45.4 |
| V Vegnagun+Shuyin | 200/200 -> 200/200 | 194/200 | 192/200 | -2 | 5 / 3 (p=0.727) | 1.0 -> 1.3 | 92.1 -> 94.2 | 46.3 -> 44.1 | 18.7 -> 17.57 | 3.4 -> 3.6 | 94.5 -> 97.7 |
| VI Leblanc | 200/200 -> 200/200 | 200/200 | 200/200 | +0 | 0 / 0 (p=1.000) | 0.9 -> 1.0 | 57.9 -> 50.9 | 10.3 -> 11.3 | 8.01 -> 5.39 | 2.1 -> 2.3 | 72.8 -> 80.7 |
| IX Fallen Aeons | 200/200 -> 200/200 | 200/200 | 200/200 | +0 | 0 / 0 (p=1.000) | 0.1 -> 0.1 | 13.2 -> 13.8 | 33.6 -> 30.0 | 2.2 -> 2.18 | 2.3 -> 2.2 | 48.4 -> 47.1 |
| X Trema | 156/200 -> 138/200 | 151/200 | 127/200 | -24 | 42 / 18 (p=0.003) | 1.2 -> 1.6 | 55.6 -> 24.2 | 141.3 -> 159.3 | 3.01 -> 3 | 8.5 -> 8.3 | 168.1 -> 162.0 |
| XII Den of Woe | 500/500 -> 500/500 | 500/500 | 499/500 | -1 | 1 / 0 (p=1.000) | 0.3 -> 0.4 | 6.6 -> 4.9 | 3.5 -> 4.6 | 2 -> 1.97 | 1.0 -> 1.1 | 31.3 -> 33.8 |
| XIII Ixion | 500/500 -> 500/500 | 500/500 | 500/500 | +0 | 0 / 0 (p=1.000) | 0.0 -> 0.0 | 4.2 -> 2.9 | 0.0 -> 0.0 | 1.87 -> 1.56 | 1.2 -> 1.3 | 26.9 -> 28.1 |
| XI Experiment | 500/500 -> 500/500 | 362/500 | 272/500 | -90 | 94 / 4 (p=0.000) | 1.3 -> 1.7 | 6.6 -> 4.6 | 12.0 -> 13.4 | 2 -> 2 | 0.8 -> 0.9 | 25.6 -> 26.7 |
| XIV Tourist Trap | 470/500 -> 464/500 | 470/500 | 464/500 | -6 | 21 / 15 (p=0.405) | 0.4 -> 0.5 | 7.6 -> 5.1 | 1.2 -> 1.2 | 1.98 -> 1.56 | 2.1 -> 2.2 | 46.2 -> 47.7 |
| XV Valefor | 500/500 -> 500/500 | 500/500 | 500/500 | +0 | 0 / 0 (p=1.000) | 0.1 -> 0.1 | 3.8 -> 2.8 | 0.0 -> 0.0 | 2.14 -> 1.9 | 1.7 -> 1.7 | 37.6 -> 38.7 |
| XVI Angra Mainyu | 190/200 -> 179/200 | 190/200 | 179/200 | -11 | 18 / 7 (p=0.043) | 2.5 -> 3.0 | 28.9 -> 19.6 | 28.0 -> 27.8 | 2 -> 1.95 | 7.2 -> 7.6 | 164.5 -> 171.3 |
| exp-leblanc (same as VI) | (not run yet) | | | | | | | | | | |

### 5.2 What moved, and why, in player words

**In general.** A chain is broken sooner everywhere: the party lands 5 to 60 percent fewer chained hits on the enemy in every chapter (the "enemy chain hits" columns), because no body's flinch is 2 s any more (a girl's is 0.8 to 1.7 s, the bosses' 0.4 to 2.0 s). Whether that costs a win depends on how close the chapter already is to the edge: Chapters IV, XIII and XV are won 500 of 500 either way, and VI, IX and XVI do not move beyond noise. Four chapters move beyond noise (X at all three paces, XIV at the human pace, XII at Active, XI at the bench pace only); V moves within it, and Angra Mainyu at the bench pace only, marginally (190 to 179 of 200, p = 0.043, one of 33 comparisons: about what chance alone gives once in thirty).

**What the slice changes for a girl, in two parts that pull in opposite directions** (the `girls` and `xa2` arms of the ablation show each): the window in which she cannot start a command, and in which a hit on her cannot be evaded, is her own flinch, about a second (24 to 51 steps) instead of two, which helps her; but her gauge now crawls at half speed for that whole flinch (25 to 41 steps for most dresspheres, 31 for Yuna's Mascot), where it crawled for 15 steps (half a second) before, which hurts her. The 15 was a Hasted girl's figure (section 1). In the chapters below the second part wins whenever the girls are hit often.

**Chapter X, Trema (the one that moves at every pace): 337 to 288 of 500 at the human pace (-49, 114 seeds lost and 65 gained, p below 0.001), 244 to 167 at Active (-77, p below 0.001), 151 to 127 of 200 at the bench pace (-24, p = 0.003).** Two links, two causes (100 seeds at the human pace, per link, old to new):
- *The Paragon (link 1; 370 to 318 wins at the human pace, 274 to 191 at Active).* The Paragon answers every hit, so the girls are hit all the time, and each hit now holds her gauge at half speed for a second and a bit instead of half a second. The party takes 26 percent more damage in this fight (59,600 to 74,900 HP over a fight, 0.9 to 1.3 girls knocked out; **correction of the independent check: that figure is taken over every seed and is mostly the lost fights, which are more of them; among the fights the party wins it is about 7 percent more**) while dealing the same (211,200 to 209,600) and finishing in the same time (107 to 109 s). The Paragon's own window barely changed (62 steps against 60, 76 against 90 after a critical). Ablation at 200 seeds: slice off 134 wins, girls alone 125, monsters alone 128, the halved-tick span and forced hit alone 122, all of it 114. A rerun with the forced hit put back to today's window and only the span changed gave the same figures to the last digit (64 of 100 link-1 wins, 74,168 damage taken), so **the forced hit does nothing in this chapter and the girls' longer slowed gauge is what costs**.
- *Trema (link 2; 90 to 86 percent of the seeds that reach it).* His flinch is 15 frames, half a second (16 steps) against two seconds: the party's chain on him almost never continues, 46 chained hits on him per fight before and 11 after. The fight is 3 percent longer (576 to 591 s) and the party takes 19 percent more damage (146,500 to 174,700 HP a fight).

**Chapter XIV, Tourist Trap (hidden): 449 to 423 of 500 at the human pace (-26, p = 0.005), 359 to 339 at Active (-20, p = 0.10), 470 to 464 at the bench pace (-6, p = 0.4).** Yojimbo's flinch is a second (31 steps; 58 after a critical, 1.9 s) and Daigoro's two (61): the party's chain on them breaks sooner, 7.3 to 5.3 chained hits per fight (200 seeds, human), so the fight takes 3 percent longer (137 to 141 s) and Yojimbo and Daigoro each get 6 to 10 percent more moves in (Daigoro 9.4 to 10.1, Zanmato 1.7 to 1.9 a fight): 0.47 to 0.82 girls knocked out a fight, 185 to 170 wins of 200. The monsters' side alone gives all of it (170 of 200); the girls' side alone costs 5.

**Chapter XII, Den of Woe: 499 to 498 at the human pace, but 484 to 452 at Active (-32, 45 seeds lost and 13 gained, p below 0.001).** All of it is in Nooj's link (200 seeds at Active: 192 to 181 wins of those reaching it). Nooj's flinch is 0.70 s (21 steps; 34 after a critical) against two: the party's chain on him all but disappears (1.5 to 0.4 chained hits a fight), the party takes 17 percent more damage (18,800 to 21,900 HP) and 0.86 to 1.18 girls fall. The monsters' side alone (172 of 200 on that link's chain) is the whole effect; the girls' side alone helps (195). At the human pace the Wait split gives the girls time and the chapter keeps its 498.

**Chapter V, Vegnagun and Shuyin: 473 to 463 at the human pace (-10, p = 0.10), 406 to 417 at Active (+11, p = 0.25): within noise, in both directions.** The counters say what changed: every part of Vegnagun flinches for 0.4 to 0.6 s (11 to 17 steps; the two Bulwarks are not in the data and keep 2 s / 3 s), so the party's chain on the Leg, the Nodes, the Head and the Redoubts breaks (the Leg and Nodes link: 5.0 to 2.2 chained hits a fight; the Head link 26 to 19), the fights run 4 to 13 percent longer (link 4: 54.9 to 62.2 s), the party takes up to 18 percent more damage, and the girls knocked out in Shuyin's link go from 0.97 to 1.3 a fight. Link 2 (the Leg and the Nodes) loses 188 to 184 wins of 200. Shuyin himself is not the cause (section 5.4).

**Chapter XI, the Experiment (hidden; Masterpiece Theatre): 234 to 235 of 500 at the human pace, 239 to 228 at Active (-11, p = 0.07), but 362 to 272 at the bench pace (-90, 94 seeds lost and 4 gained, p below 0.001): the biggest single move of the measurement, at the one pace a player does not play.** The Experiment flinches for 0.77 s (23 steps) against two, so the party's chain on it all but goes (4.3 to 1.8 chained hits a fight at the human pace). At the human pace that is nearly cancelled by the girls' own shorter locks and forced-hit windows (200 seeds: the monsters' side alone takes the chapter from 89 to 81, the girls' side alone to 104, the span and forced hit alone to 118, all of it 88). At the bench pace all the loss is in link 2, the machine rebuilt to the limit (200 seeds: 146 to 105 wins of 200, the Prototype of link 1 still 200 of 200), the party takes 10 percent more damage (14,800 to 16,300 HP) and 1.3 to 1.8 girls fall a fight; and **each part of the slice alone does the same damage: the girls' side, the monsters' side and the span with the forced hit alone give 105, 104 and 105 of 200 where all of it gives 105**. So this is not a sum of separable causes. Comparing the event logs of the same seed with and without a part (seeds 1 and 8, any of the three arms), the logs are identical up to a point and then two events change places (a girl's chain clears before a hit lands, or a girl's turn starts before another hit lands), after which the exchange of blows with the Rocket Launcher and the Lifeslicer goes another way: the old engine's result for this link is the outlier, a timing the shipped line happens to win, and any change to the reaction timings moves it. Not explained further; flagged as an open item (section 10).

**Not moved:** IV Bahamut (always won; his window is 52 and 82 steps against 60 and 90, so his chain barely changes), VI Leblanc (an exact copy as `exp-leblanc`), IX the Fallen Aeons, XIII Ixion, XV Valefor and XVI Angra Mainyu (35 steps for all three bodies; 385 to 383 at the human pace, 29 to 24 of 500 at Active, where the chapter is nearly out of reach either way; the marginal bench figure is above). Their enemy chain hits fall by 5 to 40 percent (Ixion 4.1 to 2.4 a run at the human pace) and the fights are 0 to 5 percent longer.

### 5.3 Ablation (200 seeds, human pace, one part of the slice at a time)

The arms are the bench's own (`reaction.ts` knobs): `girls` (the girls' windows, with the span of their halved gauge, the forced hit and the Haste ratio that go with them, and nothing else), `monsters` (the same for every enemy, part and boss), `xa2` (the halved-tick span and the forced hit of the bodies in the data, with the windows left at 2 s / 3 s) and `xa7` (the Haste ratio alone on today's numbers). `old` and `new` are the first 200 seeds again, run as their own jobs on the same footing.

#### Ablation: 200 seeds, human pace, whole-chain wins (the first 200 seeds), one part of the slice at a time

| Chapter | old | girls | monsters | xa2 | xa7 | new |
|---|---|---|---|---|---|---|
| IV Bahamut | 200 | 200 | 200 | 200 | 200 | 200 |
| V Vegnagun+Shuyin | 188 | 186 | 185 | 183 | 188 | 184 |
| VI Leblanc | 199 | 200 | 200 | 200 | 199 | 200 |
| IX Fallen Aeons | 199 | 198 | 199 | 199 | 199 | 198 |
| X Trema | 134 | 125 | 128 | 122 | 134 | 114 |
| XII Den of Woe | 200 | 200 | 199 | 199 | 200 | 199 |
| XIII Ixion | 200 | 200 | 200 | 200 | 200 | 200 |
| XI Experiment | 89 | 104 | 81 | 118 | 89 | 88 |
| XIV Tourist Trap | 185 | 180 | 170 | 177 | 185 | 170 |
| XV Valefor | 200 | 200 | 200 | 200 | 200 | 200 |
| XVI Angra Mainyu | 150 | 157 | 156 | 149 | 150 | 142 |
| exp-leblanc (same as VI) | 199 | 200 | 200 | 200 | 199 | 200 |

Enemy chain hits per seed / KOs per seed in the same runs:

| Chapter | old | girls | monsters | xa2 | xa7 | new |
|---|---|---|---|---|---|---|
| IV Bahamut | 9.5 / 0.0 | 9.9 / 0.0 | 8.4 / 0.0 | 9.6 / 0.0 | 9.5 / 0.0 | 8.6 / 0.0 |
| V Vegnagun+Shuyin | 99.5 / 1.3 | 96.1 / 1.2 | 90.9 / 1.7 | 98.4 / 1.5 | 99.5 / 1.3 | 92.2 / 1.7 |
| VI Leblanc | 54.6 / 1.2 | 55.0 / 1.1 | 46.9 / 1.4 | 54.5 / 1.3 | 53.6 / 1.2 | 47.2 / 1.4 |
| IX Fallen Aeons | 12.7 / 0.2 | 13.4 / 0.1 | 10.6 / 0.2 | 11.9 / 0.2 | 12.7 / 0.2 | 11.6 / 0.1 |
| X Trema | 48.0 / 1.4 | 46.6 / 1.5 | 22.2 / 1.6 | 45.7 / 1.6 | 48.0 / 1.4 | 21.3 / 1.8 |
| XII Den of Woe | 6.1 / 0.4 | 6.6 / 0.6 | 3.2 / 0.6 | 6.1 / 0.5 | 6.1 / 0.4 | 3.9 / 0.6 |
| XIII Ixion | 4.2 / 0.0 | 4.0 / 0.0 | 2.9 / 0.0 | 4.1 / 0.0 | 4.2 / 0.0 | 2.3 / 0.0 |
| XI Experiment | 4.3 / 1.9 | 6.3 / 1.6 | 1.6 / 2.1 | 5.6 / 1.6 | 4.3 / 1.9 | 1.8 / 2.0 |
| XIV Tourist Trap | 7.3 / 0.5 | 8.5 / 0.6 | 5.2 / 0.8 | 6.9 / 0.6 | 7.3 / 0.5 | 5.3 / 0.8 |
| XV Valefor | 3.6 / 0.2 | 4.0 / 0.1 | 2.7 / 0.2 | 3.6 / 0.2 | 3.6 / 0.2 | 2.8 / 0.2 |
| XVI Angra Mainyu | 25.4 / 4.1 | 24.5 / 4.0 | 19.3 / 4.2 | 25.5 / 4.6 | 25.4 / 4.1 | 17.2 / 4.4 |
| exp-leblanc (same as VI) | 54.6 / 1.2 | 55.0 / 1.1 | 46.9 / 1.4 | 54.5 / 1.3 | 53.6 / 1.2 | 47.2 / 1.4 |

Reading it: **`xa7` moves almost nothing** (not one win; only Leblanc's chained hits, 54.6 to 53.6 a run: almost no Hasted target is chained in these chapters, so the Haste halving, which is in the code and proved, has next to nothing to do here); `girls`, `monsters` and `xa2` each carry part of every mover, and the parts do not add up to `new` (they interact, and 200 seeds leave a few wins of noise), so the ablation is a pointer to the cause, not a decomposition. Where the ablation and the counters of section 5.2 agree the cause is said plainly; where they do not, the text says so.

### 5.4 Chapter V's Shuyin, measured both ways (the open item of section 4.4)

#### Chapter V, Shuyin (row 260) three ways, 500 seeds, whole-chain wins (link 5 is Shuyin; the other links are identical in every arm)

| Pace | today's window on Shuyin only (60/90) | the data (30-frame set, 31 steps) | the 135-frame set (136 steps), a what-if | old engine (all bodies today) |
|---|---|---|---|---|
| human | 463 | 463 | 463 | 473 |
| active | 418 | 417 | 418 | 406 |
| bench (first 200 seeds) | 192 | 192 | 192 | 194 |

human: data vs today on Shuyin: W->L 0, L->W 0, p=1.000; KOs/seed 1.5 -> 1.7; enemy chain hits/seed 89.6 -> 91.7; minutes/seed 4.1 -> 4.1
human: 135 vs today: W->L 0, L->W 0, p=1.000; KOs/seed 1.2; enemy chain hits/seed 88.9; minutes/seed 4.0

active: data vs today on Shuyin: W->L 1, L->W 0, p=1.000; KOs/seed 2.4 -> 2.6; enemy chain hits/seed 93.4 -> 93.8; minutes/seed 4.9 -> 5.0
active: 135 vs today: W->L 0, L->W 0, p=1.000; KOs/seed 1.9; enemy chain hits/seed 92.6; minutes/seed 4.8

bench: data vs today on Shuyin: W->L 0, L->W 0, p=1.000; KOs/seed 1.0 -> 1.3; enemy chain hits/seed 94.0 -> 94.2; minutes/seed 3.5 -> 3.6
bench: 135 vs today: W->L 0, L->W 0, p=1.000; KOs/seed 0.8; enemy chain hits/seed 92.9; minutes/seed 3.5

The three columns differ in Shuyin's row 260 only and nothing else (`keepRows: [260]` for "today's window", the shipped data for "the data", `clipsOfRow: { 260: [135, 135] }` for the what-if), so every earlier link plays out identically and any difference is Shuyin's. **There is none a player could see:** at the human pace all three arms win 463 of 500 and not one seed differs; at Active 418, 417 and 418 (one seed lost between today's window and the data); at the bench pace (first 200 seeds) 192, 192 and 192. The girls knocked out per run move a little (human 1.5 with today's window, 1.7 with the data, 1.2 with the 135 frames), which is noise on a link the party wins. The change from release 50's 473 (human) and 406 (Active) to 463 and 417 is within noise and, to the extent it is anything, the Vegnagun parts' short windows (section 5.2), not Shuyin.

So the open item for Bailey is a correction rather than a decision: **the Shuyin in the "Vegnagun fight" row of note FFX2-G01 section 7.3 (every clip 135 frames, 4.50 s, "looks like a placeholder") is the game's second, inert Shuyin record (row 293, 80,000 HP, scene `wegn01_226`), not the one Chapter V fights (row 260, scene `wegn01_225`, 30 frames).** The data uses row 260's own set. If Bailey ever wants the inert record fought, its 4.5-second window would be the game's own, and the what-if column shows that nothing changes in Chapter V as built. The note's label for 0x1104 ("Den of Woe") should also read "Chapter V's Shuyin"; the note is outside the repo and was not edited.

## 6. The goldens and the other pinned tests

The first commit of the wiring (`c01cd6f8`) re-pinned only `ffx2-atb-golden`. The lane brief for this resume said "no full suite", so the rest was found by running **every test file that drives the FFX-2 engine, the advisor, the chapters or the flow** (176 files in two passes, on the branch). Of the files that failed, four are art-only (`public/art` is absent from worktrees: `den-of-woe-ship-content`, `fallen-aeons-ship-content`, `leblanc-art`, and `pause-remake` in the second pass) and are not this lane's. **Nine were the slice's own (three found first and re-pinned in 63490f1da, six in the next commit), and every one of them passes again with the switch forced off** (`CHAIN_WINDOW_PER_BODY: false` through a module mock in a setup file; the ablation proof of each row below).

| Test | Result | Cause |
|---|---|---|
| `ffx2-atb-golden` | **re-pinned once (c01cd6f8), every array: all 60 digests moved** (`CH4_D0` 20 of 20, `CH5_D0` 20 of 20, `CH4_D1500` 10 of 10, `CH5_D1500` 10 of 10); the cause is in the test header as the fourteenth re-pin | the window, the halved-tick span and the forced hit are each body's clip + 1 step (a girl 24 to 51 steps, Bahamut 52 and 82, Vegnagun's parts 11 to 17) where they were 60 / 90 steps and 15. Found by ablation: the girls' windows alone, the monsters' windows alone and the halved-tick span with the forced hit alone each move all 60; the Haste halving alone moves none. **With the switch off the four arrays are the old ones exactly.** Outcomes: Chapter IV 20/20 at D = 0 and 10/10 Active as before; Chapter V 20/20 at D = 0 as before (the chain takes 126,455 steps over the 20 seeds, was 120,045, +5.3 %; Chapter IV 44,791, was 43,127, +3.9 %); **Chapter V Active D = 1500: 9/10 to 8/10** (seeds 1 and 9 lost, seed 10 no longer) |
| `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay`, `chapters/den-of-woe-carry` | **re-pinned (63490f1da): 9 + 18 + 32 pinned event logs** of Chapters IV to VI at D = 0 and at human pace, XI and the Sisters | the same cause; with the slice off all 59 pins are the old ones, with it on all 59 move; no menu is closed or confirm refused in any of the nine D = 0 logs, as before |
| `parity-ffx2-engine-interrupt` | one expectation: a girl who is hit has her tick halved for **31** steps (Yuna's clip of 30 frames + 1), where it read 15 | the flat 15 was the figure read off a Hasted Rikku (section 1) |
| `chapters/tourist-trap-turns` | seed 1, the intended line: **69** turns, 12 dog picks, 5 sleeping polls (were 66, 12, 4) | Yojimbo's and Daigoro's flinches shorten the party's chains on them, another replay of the seed |
| `chapters/experiment-story` | the three seeds that win both acts: **2, 3, 5** (were 1, 3, 6) | seed 1 now loses Act II; scanned seeds 1 to 24 |
| `advisor-line-first` | the Trema board of the second DIFF-B test: seed **1** (was 7), found by scanning seeds 1 to 30 | seed 7 no longer reaches a board whose projected line differs from the live one; the first DIFF-B test (seeds 1, 2, 3, 7) still passes unchanged |
| `advisor-v3-final` | the C2-M1 "held heal covers nobody" board (Vegnagun): seed **3** (was 1), found by scanning seeds 1 to 40 | seed 1 no longer reaches the held-Megalixir board |
| `chapters/trema-retry-flow` | the run seed of a real Paragon win that leaves Yuna alone: **3116** (was 3543), from a scan of run seeds 1 to 6,000 (4,181 win link 1; six leave one girl, 789, 2659 and 2833 leave Paine, 3116, 4053 and 5723 leave Yuna); the Retry bound "within 22 menus" is now 24, the largest of the four Retries on the new seed (3, 3, 13, 24), all still defeats | the Paragon answers every hit and the girls' gauge now crawls for their whole flinch, so the same run seeds are other fights |
| `ffx-engine-golden`, `ff7-golden` | unchanged, pass | FFX and FF7 are not touched |

The scratch tests that did the scans (`zz-x2a-*.tmp.test.ts`) are agent scratch and are not committed.

## 7. Merge notes (against `origin/r51-rc` d6dc0bdd7; checked 2026-10-17 in a scratch tree, nothing merged into any branch)

`git merge-tree --write-tree origin/re-parity-rc9-x2-hit-reaction origin/r51-rc` (this branch at its tip, merge base `6b638df95`, release 50.1; result tree `4c028c0a`) reports **five textual conflicts**: `src/battle/ffx2/chain.ts`, `tests/unit/ffx2-atb-golden.test.ts`, and the three log-pinned tests this branch re-pinned (`tests/unit/ffx2-hit-closes-menu.test.ts`, `tests/unit/ffx2-menu-cancel-delay.test.ts`, `tests/unit/chapters/den-of-woe-carry.test.ts`), where r51 re-pinned the same lines for its own causes. `atb-engine.ts`, `constants.ts` and `internal.ts` auto-merge, and so do the six seed-searched tests of section 6 (r51 did not touch them). r51-rc is the release driver's assembly of the rewards, stat-setter, confusion, Mix and grids lanes (and the FFX lanes), so the older per-lane tips of the first draft of this note are subsumed. **One more collision has no markers** (row 3). The resolution was built and run in a scratch tree (`git archive` of the merge-tree result, `node_modules` junctioned, the files below edited); the resolved files are kept in `D:\Tools\ffx-parity\rc9\x2-hit-reaction\merge-r51\resolved\` (the driver takes them, or redoes them from the recipe here).

| # | File | Kind | Conflict | Resolution |
|---|---|---|---|---|
| 1 | `src/battle/ffx2/chain.ts` | textual | both lanes rewrote the body of `bumpChain`: the rewards lane (X2-C) adds `bestChain` (`Chr+0x5ae`, the best counter, which the kill-reward roll adds to the current chain), this lane opens the window at the body's reaction | take the rewards signature `bumpChain(target: FFX2Combatant & { bestChain?: number }, before, crit)` and this lane's window, and raise the best by the hit itself even when the reaction clears the counter at once (the game's `applyHpDamage` raises the counter and the best together, then the per-step update clears the counter of a Stopped or Petrified target): `const raised = Math.min(CHAIN_MAX, before + 1); target.bestChain = Math.max(target.bestChain ?? 0, raised); target.chainWindowTicks = reactionWindow(target, crit); target.chainCount = target.chainWindowTicks > 0 ? raised : 0; return target.chainCount;`. The imports of `CHAIN_WINDOW_TICKS` / `_CRIT` are already gone on this side, so nothing is left unused |
| 2 | `tests/unit/ffx2-atb-golden.test.ts` | textual (header and the four arrays) | both lanes re-pin all sixty digests and each adds a header paragraph | keep r51's paragraphs (fourteenth: kill rewards, fifteenth: the Core's death entry) and this lane's as the **sixteenth**; the four arrays are **recomputed on the merged tree** (`CH4_D0`, `CH5_D0`, `CH4_D1500`, `CH5_D1500`; the recipe is a scratch test that runs `driveChapter4` and `driveChapter5` at D = 0 for seeds 1 to 20 and at D = 1500 for seeds 1 to 10 and writes `logHash` of each), not picked from either side. The sixteenth paragraph's "old hashes" line names r51-rc `d6dc0bdd7` |
| 3 | `tests/unit/ffx2-hit-reaction-wiring.test.ts` | semantic (no markers) | `OLD_CH4_D0` / `OLD_CH5_D0` pin the first seeds of the golden as they stood at `6b638df95`; r51 moved those digests (rewards, commit window, stat setter) | set them to r51's pins (`CH4_D0` seeds 1 to 5: `45734a8be5dd203c`, `70e64552622c11e3`, `52b166f112447102`, `ca9ad0689e657475`, `fdc102f04be24914`; `CH5_D0` seeds 1 to 3: `879b56fea2dcf126`, `6653829069c3a0b6`, `2d1beea724981df5`) and say "r51-rc" in the title and comment |
| 4 | `tests/unit/ffx2-hit-closes-menu.test.ts` (9 logs), `tests/unit/ffx2-menu-cancel-delay.test.ts` (18), `tests/unit/chapters/den-of-woe-carry.test.ts` (32) | textual (the pinned arrays and the comment above them) | r51 re-pinned them (119 logs in all, for the rewards and the commit window); this branch re-pinned its own copies (63490f1da) for the hit reaction | **take r51's file and re-apply this lane's re-pin on top**: the slice-on digests recomputed on the merged tree (ablation on the merge: slice off reproduces all 59 of r51's pins, slice on moves all 59), plus this lane's one paragraph of cause (old hashes: r51-rc `d6dc0bdd7`) |

Proofs on the merged scratch tree: `tsc --noEmit` clean; `ffx2-atb-golden`, `ffx2-hit-reaction-wiring`, `parity-ffx2-hit-reaction`, `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay` and `den-of-woe-carry` pass with the resolutions above; **with the switch off (`withReactionKnobs(OLD_REACTION)`) the merged tree reproduces r51's sixty golden digests exactly** and with it on all sixty move (`CH4_D0` and `CH5_D0` still 20/20, Chapter V Active D = 1500 8/10 as on the branch, the same 44,791 and 126,455 steps over the 20 seeds); the six seed-searched tests of section 6 (`parity-ffx2-engine-interrupt`, `tourist-trap-turns`, `experiment-story`, `advisor-line-first`, `advisor-v3-final`, `trema-retry-flow`) pass on the merged tree exactly as this branch has them; the other r51-touched FFX-2 test files that run the engine (the Mix, stat-setter, confusion, rewards, grid, rng-stream and AI-hook tests, `trema-engine`, `trema-bench`, `ffx2-steal`, `ffx2-lady-luck-grid`) pass unchanged on the merge.

**400-line budget.** Merged: `engine-core.ts` 399 (r51 399; this lane adds nothing), `internal.ts` 399 (r51 398 + this lane's one added comment line in the `hitReaction` doc), `resolve-strike.ts` 387, `atb-engine.ts` 352, `chain.ts` 123, `constants.ts` 298, `adapt/inputs.ts` 192, `reaction.ts` 211. Nothing reaches 400, but two files have one line left. If either must grow: for `internal.ts`, shorten the `hitReaction` comment (lines 70 to 74 on the merge) back to two lines, or move the `AiContext` and `AiScript` interfaces (about 85 lines, one block near the end of the file) into a new `ai/types.ts` and re-export them; for `engine-core.ts`, move `nextActor()` (about 40 lines with its comment; it reads only `units`, the held command and the end window) into a pure helper `pick-actor.ts`, or `runLogicStep()`'s argument assembly into `logic-step.ts`.

**Two things the driver should know about the merged behaviour.** (1) The kill-reward roll of the rewards lane adds the chain counter (and the best) at the killing blow to its rare-item odds, and the slice makes chains shorter, so a rare second item can only turn up less often after a long chain than r51's figures say; the rewards lane measured its odds with the 2 s / 3 s windows. Not measured here. (2) Both lanes re-pin the golden for different causes; the merged sixteenth paragraph says so, and the outcomes it quotes are this lane's own on the branch and on the merge.

## 8. Player-facing text that mentions a chain window (the release driver's list; nothing here was edited)

Searched on `origin/r51-rc` and on this branch: the strategy guide and its pages (`src/data/guides/**`), the chapter cards and tips (`src/data/chapter-meta-*.ts`), the coach and hint copy (`src/ui/coach/`), the advisor and guide strings (`src/engine/tactics/`), the HUD copy (`src/ui/ffx2/`), the story scripts, `learn/`, `index.html`, `README.md`, `CHANGELOG.md` and the non-handoff docs, for any wording that puts a number of seconds on a chain window (2 s, 3 s, "two seconds", "three seconds", "within ... of the last hit") or promises how long a chain holds.

**Result: no player-facing string claims a 2 s or 3 s chain window**, so nothing needs a wording change for the numbers to be true. The one visible line about chains is still true, and one behaviour is worth a look:

| Where (r51-rc line numbers) | What | Matters because |
|---|---|---|
| `src/ui/coach/coachCopy.ts:374-379` (id `ffx2-chain`) | Rikku: "Keep hitting the same one! The count climbs, and so does the hurt." | no time claim; still true. A chain on Trema or a Vegnagun part now needs hits within about half a second, on a girl or most bosses within a second or two (section 4) |
| `src/ui/ffx2/ChainCounter.ts:25` and `:247` (`CHAIN_HOLD_MS = 1400`) | not a string: how long the chain chip stays up after the last hit | the chip now outlives the chain on Trema (0.5 s) and the Vegnagun parts (0.4 to 0.6 s) and goes down before a Bahamut critical's 2.7 s window ends; a presentation decision (rule 9, a mockup first); the engine already emits a `chain` event with count 0 when a window ends, so the chip could follow it |

Not player-facing, listed so nobody trusts them: code comments that still say 2 s / 3 s because they describe the fallback for a body outside the data and the switch off (`src/battle/common/types.ts:1245`, the comment on `chainWindowTicks`, a contract file left alone so as not to need a `docs/CONTRACT-CHANGES.md` entry; `src/battle/ffx2/constants.ts:99, 102`; `src/battle/ffx2/kernel/apply.ts:10`; `src/app/screens/BattleScreenRunIn.ts:8`, a quote of the guide's "~2 s running in ... usually breaks the chain"), `docs/CONTRACT-CHANGES.md:286`, `docs/handoff/re-parity-w3.md:495`, and the guide-sourced research notes `research/ffx2-combat-core.md:29, 237, 238, 387, 1151, 3228, 3497, 3564`, `research/ffx2-trema.md:583`, `research/ffx2-vegnagun-shuyin.md:99, 573, 646, 662, 1254, 1383`, `research/re-ffx2-commands.md:733`, `research/re-ffx2-damage.md:280` and `research/battle-camera-perspectives.md:70`, which state the guides' `[verified: 2 sources]` 2 s / 3 s; note FFX2-G01 section 14 shows the exe has no such number. The story lines "Combo's gone." and "No more combo!" (`src/story/scripts/ffx2-leblanc.ts:391, 408`) are about the Syndicate's combo, not the chain.

## 9. CHANGELOG paragraph (for the release driver to paste; FFX-2 only)

- **FFX-2 only, a chain lasts as long as the target's flinch (re-parity RC9, lane X2-A, first slice):** The chain window is no longer two seconds (three after a critical) for everything. In the game it is the time the target spends in its own flinch animation, so it is different for every body: about a second for a girl (0.8 to 1.7 seconds, by dressphere), 1.7 seconds for Bahamut and 2.7 after a critical, a second for Yojimbo, 0.7 for Nooj, 0.8 for the Experiment, half a second for Trema, and a third to a half of a second for the parts of Vegnagun (the two Bulwarks, whose game data has no flinch clip, keep the old two and three seconds). The flinch carries the rest of what the game ties to it: a girl who is hit has her ATB bar filling at half speed for as long as her flinch lasts (about a second, where it was half a second), a target in its flinch cannot dodge, Haste makes the flinch half as long, and a Stopped or Petrified target is never chained. A hit girl can act again after about a second instead of two. What you will feel: chains on enemies with a short flinch break sooner, so the girls' hits have to come closer together, and the fights where the girls are hit all the time are somewhat harder. Measured over 500 seeds of every chapter at three speeds (Wait with a 1.5-second menu, Active with a 1.5-second menu, and instant decisions): Chapter X (Trema and his Paragon) goes from 337 to 288 first-try wins at the Wait speed and from 244 to 167 at Active (the Paragon link takes about a quarter more damage over all the seeds, but that is mostly the fights that are lost; among the fights that are won it is about 7 percent more), the hidden Tourist Trap from 449 to 423 at Wait, Chapter XII (the Den of Woe) from 484 to 452 at Active, the hidden Experiment from 362 to 272 at the instant-decision speed only (at the other two speeds it stays within noise), and the hidden Angra Mainyu from 190 to 179 of 200 at the instant-decision speed only (marginal; at Wait and Active it stays within noise); Chapters IV, VI, IX, XIII and XV do not change beyond noise, and Chapter V (Vegnagun) stays within it. No enemy or party number was changed. The lengths are the game's: they come from its own animation tables, and one rule fits three flinch lengths measured in the real game on 2026-10-13 (Yuna's Moogle Mascot 31 steps, Paine's Tonberry Mascot 37, a Hasted Rikku's Black Cat Mascot 15).

## 10. Open items and decisions for Bailey

**Decisions for Bailey**

1. **The felt difficulty (D-768's consequence).** The per-body windows make Chapter X (Trema) harder by about a tenth of the seeds at the Wait pace (337 to 288 of 500 first-try wins) and about a sixth at Active (244 to 167), the hidden Tourist Trap by about a twentieth (449 to 423 at Wait) the Den of Woe at Active by about a sixteenth (484 to 452) and, at the instant-decision bench pace only, the hidden Experiment by a fifth (362 to 272); nothing else moves beyond noise except the hidden Angra Mainyu at the instant-decision pace, marginally (190 to 179 of 200, p = 0.043; section 12.6) (section 5). No boss or party number was touched, as the rule says. The release driver's choices: (a) ship it as it is, which is the 1:1 reading of D-768 and what this lane recommends; (b) ship with the switch off (`CHAIN_WINDOW_PER_BODY = false` in `constants.ts`) until the next slices (the start gate, action time, armour) are built, since they move the windows again and the chapters would then be measured once; (c) ask for a separate balance look at Chapter X, which is the one finding of this lane that is a chapter's difficulty rather than a rule. Whichever it is, disclose the movers in the release notes (the CHANGELOG paragraph below does).
2. **The next live session.** The calibration fixes slot 14 (the Mascot) for the three girls and nothing else, and the monsters' offset is unread. One reading of a girl in another dressphere (Gunner or Warrior, say) and one of an ordinary monster's flinch would pin the other thirteen slots and the monster side (k for monsters may be 0 or 1). Plan: `D:\Tools\ffx-parity\live\2026-10-15-live-plan.md`.
3. **The Shuyin item is a correction, not a choice** (section 4.4 and 5.4): the 135-frame set is the inert record's; nothing in Chapter V changes with it. Only if Bailey wants the inert 80,000-HP record fought is there anything to decide.
4. **The chain chip's hold time** (`ChainCounter.ts CHAIN_HOLD_MS = 1400`) now outlasts the chain on Trema and the Vegnagun parts and ends before a Bahamut critical's 2.7 s; a presentation change needs a mockup first (rule 9).

**Open items (technical, not decisions)**

- **Bodies outside the data keep 2 s / 3 s / 15 steps** (section 4.3): the Right and Left Bulwark of Chapter V (their motion sets 0x1120 and 0x1121 have no damage clip; what the game does for a hit on a body with no flinch is not established, so no number was invented), the International-only `psychic` and `festivalist` dresspheres (no motion set in the frame table), the Special's pods (not units here) and any unit built without a monster row. The Bulwarks are the one that matters: they are a link of Chapter V.
- **The Experiment at the bench pace** (section 5.2): 362 to 272 of 500 with the slice, none of it separable (each part alone costs the same), and nothing at the Wait or Active paces. It is the one result of this lane without a cause in player words. The hidden chapter plays at the human paces, so the player-facing risk is small, but the parity bench (zero decision time) now reads this chapter 90 wins lower; if a later lane quotes the bench figure for Chapter XI, quote the pace with it.
- **Slice 1 only.** Not built: XA3 the start gate, XA5 the block-mask feeder, XA6 action time, XA8 armour (an armoured command suppresses the reaction and leaves a 2-step window; 392 of 1,122 command rows, most boss moves), XA9 the replayed cast-start tag, the guard reaction (tag 25), and the status-only hit that keeps a chain alive (result kind 8: the engine cannot classify a result as status-only until `pp_result_kind` is recovered). Each moves the windows again, so re-measure against this note's numbers.
- **The odd-clip question** (section 1, item 2): a Hasted body with an odd clip is one step off if the game's offset is a frame rather than a step; one Hasted reading cannot tell.
- **The kill-reward chain term** (section 7): chains are shorter, so the rewards lane's "more after a long chain" has a smaller input; not measured.
- **Art-only test failures in worktrees** (`public/art` absent): `den-of-woe-ship-content`, `fallen-aeons-ship-content`, `leblanc-art`, `pause-remake`; not this lane's.
- **Test-file hygiene:** the scratch tests of this lane (`tests/unit/zz-x2a-*.tmp.test.ts`) and the first session's (`zz-diag-b`, `zz-measure-b`, `zz-x2a-advisor-seed`, `zz-x2a-enum`, `zz-x2a-golden*`) are untracked agent scratch in the lane's worktree and are not committed.
- **Bench pace is partly 200 seeds** (section 5.1): the machine was at 100 percent CPU from other sessions during the bench jobs, so the heavy chapters ran 200 seeds at that pace; `run-bench2.mjs` extends any of them (the file name carries the seed range).

## 11. How to run it again

```
# the proof, in full (the folder holds x1_comparator.jsonl, x3_chooser.jsonl, x5_speed.jsonl; the worlds file comes from x6_dump.py in the first session's temp folder)
PYREFLY_X2A_PROOF=<G01 proof folder> PYREFLY_X2A_WORLDS=<worlds file> node node_modules/vitest/vitest.mjs run tests/unit/parity-ffx2-hit-reaction.test.ts

# the measurement of this note: a restart-tolerant driver, one result file per (chapter, pace, arm, seed range), two jobs at a time, skipping files that exist
node D:\Tools\ffx-parity\rc9\x2-hit-reaction\run-all.mjs          # results in D:\Tools\ffx-parity\rc9\x2-hit-reaction\results\
node D:\Tools\ffx-parity\rc9\x2-hit-reaction\analyze.mjs          # the tables of section 5

# one job by hand (arm old|new|girls|monsters|xa2|xa7|shuyin-today|shuyin-135, speed bench|human|active)
PYREFLY_X2A_MEASURE=1 PYREFLY_X2A_ARM=new PYREFLY_X2A_SPEED=human PYREFLY_X2A_SEEDS=1-500 PYREFLY_X2A_CHAPTERS=ffx2-trema PYREFLY_X2A_OUT=rows.json \
  node node_modules/vitest/vitest.mjs run tests/unit/ffx2-hit-reaction-measure.test.ts --maxWorkers=2
```

Rows carry `perSeed` (one letter a seed) and the sums behind the means, so runs split across processes or extended by a later range merge exactly. The ablation proof of section 6 forces the switch off for a whole run with a setup file that mocks `constants.ts` (`CHAIN_WINDOW_PER_BODY: false`) and `--config` pointing at it; both were scratch and are not committed.

Not done in this slice (rows of lane X2-A that need an action timeline or a live reading, so they stay as they were): XA3 the start gate, XA5 the block-mask feeder, XA6 action time, XA8 armour, XA9 the replayed cast-start tag, the guard reaction (tag 25), a status-only hit that keeps a chain alive (result kind 8), and the death tag in flight for the forced hit. Each of them moves chain windows again (an armoured command suppresses the reaction and leaves a 2-step window; 392 of 1,122 command rows are armoured, including most boss moves), so **this note's numbers are slice 1's, and the next slice should be measured against them, not against release 50**.

## 12. Stacked on r52 + the Chapter VI opening (for release 53)

Written 2026-10-17 by the stacking sub-agent of the RE parity session. **Game case: FFX-2 only** (unchanged from section 0: nothing here touches an FFX file; `ffx-engine-golden` and `ff7-golden` run unchanged and green).
Authority: Bailey, 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-17 "yes turn on chapter VI opening, keep going full speed"; his decision D-768 (2026-10-11): FFX-2 chain windows per body, after one live measurement in the real game (the live measurement is section 1). No boss number and no party number was changed or added; the game was not run; no random number is drawn by anything in this lane.

**What was done.** Branch `re-parity-rc9-x2-hit-reaction-r52`, created from `origin/re-parity-rc9-x2-link-open-on-r52` (`35aa31e77`: r52-rc `3c92b60cc` plus the Chapter VI link opening, `SEPARATE_BATTLE_GAUGES` ON), then `git merge --no-ff origin/re-parity-rc9-x2-hit-reaction` (`74324ea6f`, merge base `6b638df95`, release 50.1). A merge, not a rebase. Nothing was deployed, nothing was pushed to `main`.

### 12.1 The merge: five conflicts and the wiring test

The same five textual conflicts as section 7 (r51), because r52 and the link opening touched none of the files this lane changes in `src` (the stat of `35aa31e77` against r51-rc `d6dc0bdd7` over `src/battle/ffx2` is `death-patterns.ts`, `atb-open.ts`, `constants.ts`, `engineHooks.ts`, `internal.ts`, `resolve-hp.ts`, `targeting.ts`, small edits, none in `chain.ts`, `resolve-strike.ts`, `adapt/inputs.ts`, `atb-engine.ts` or the new files). `atb-engine.ts`, `constants.ts` and `internal.ts` auto-merge; so do the six seed-searched tests of section 6.

| # | File | How it was resolved on this base |
|---|---|---|
| 1 | `src/battle/ffx2/chain.ts` | the lane's resolution from the r51 merge, taken whole: `bumpChain(target: FFX2Combatant & { bestChain?: number }, before, crit)` with r51's best-chain signature and the reaction window, and the best counter raised by the hit itself even when the window is 0 (`raised = min(CHAIN_MAX, before + 1)`; `bestChain = max(bestChain, raised)`; `chainWindowTicks = reactionWindow(target, crit)`; `chainCount = window > 0 ? raised : 0`). The base's `chain.ts` is r51's byte for byte, so the r51 resolution applies as it stands. Verified: the diff of the result against the base is the lane's change and nothing else |
| 2 | `tests/unit/ffx2-atb-golden.test.ts` | the base's file (r51's fourteenth paragraph for the kill rewards, fifteenth for the Core's death entry) plus this lane's paragraph as the **sixteenth**, with the cause "X2-A per-body windows, on top of the link opening"; the four arrays **recomputed on the merged tree** (not picked from either side). They equal digit for digit the arrays the lane recomputed on the r51 merge (60 of 60), as they must: the link opening moves only Chapter VI's Acts II and III |
| 3 | `tests/unit/ffx2-hit-reaction-wiring.test.ts` (no markers) | `OLD_CH4_D0` / `OLD_CH5_D0` set to the base's pins (Chapter IV seeds 1 to 5 `45734a8be5dd203c` ... `fdc102f04be24914`, Chapter V seeds 1 to 3 `879b56fea2dcf126` ...; the same digests r51 had), title and comment say "the base (r52-rc plus the Chapter VI link opening)" |
| 4 | `tests/unit/ffx2-hit-closes-menu.test.ts` (9 logs), `tests/unit/ffx2-menu-cancel-delay.test.ts` (18), `tests/unit/chapters/den-of-woe-carry.test.ts` (32) | **the base's file taken (it carries r51's kill-rewards paragraph and the link opening's Chapter VI paragraph and rows), this lane's re-pin re-applied on top**: the 59 slice-on digests recomputed on the merged tree, plus one paragraph of cause "X2-A per-body windows, on top of the link opening" in each, naming the base 35aa31e77 as the old hashes and carrying the proof of section 12.2 |

Also changed: `src/data/ffx2/hit-reaction-frames.ts`, a comment only (section 12.6, correction 1); no number moved.

### 12.2 The re-pins, and the proof of every one

Method: one scratch test (`zz-x2a-r52-dump.tmp.test.ts`, not committed) dumps every pinned digest of the golden and the three pin files; it was run twice, once as the tree is and once with `CHAIN_WINDOW_PER_BODY` **forced off for the whole run through a vitest setup file that mocks `constants.ts`** (a stricter switch than `withReactionKnobs(OLD_REACTION)`, which is the same switch inside one process and is what `ffx2-hit-reaction-wiring.test.ts` uses). The pins of the base were read out of the base's own test files (`git show 35aa31e77:...`), not from memory.

| Pins | Count | Switch forced off: equal to the base's | Slice on (as shipped): moved |
|---|---:|---:|---:|
| `ffx2-atb-golden`: `CH4_D0` (20), `CH5_D0` (20), `CH4_D1500` (10), `CH5_D1500` (10) | 60 | **60 of 60** | **60 of 60** |
| `ffx2-hit-closes-menu`: Chapters IV, V, VI at D = 0 under the Wait split, seeds 1 to 3 | 9 | **9 of 9** | **9 of 9** |
| `ffx2-menu-cancel-delay`: Chapters IV to VI at human pace, Active and split, seeds 1 to 3 | 18 | **18 of 18** | **18 of 18** |
| `chapters/den-of-woe-carry`: Chapters 5, 6 and XI and the Sisters, seeds 1 to 8 | 32 | **32 of 32** | **32 of 32** |
| **Total** | **119** | **119 of 119** | **119 of 119** |

Outcomes on the merged tree: Chapter IV 20/20 at D = 0 and 10/10 on the Active arm; Chapter V 20/20 at D = 0 (the chain takes 126,455 steps over the 20 seeds, was 120,045, +5.3 %; Chapter IV 44,791, was 43,127, +3.9 %: the same figures as on the r51 merge); **Chapter V Active D = 1500: 9/10 to 8/10** (seeds 1 and 9 lost, seed 10 won), the same as the lane. All 32 `den-of-woe-carry` logs are still victories in every link, no menu is closed or confirm refused in any of the nine D = 0 logs (`invalidated + refused` is 0 in all nine, as before). The Chapter IV and V rows of the pin files equal the golden's CH4_D0 / CH5_D0 seeds 1 to 3 again, and Chapter VI's first three `den-of-woe-carry` logs equal `ffx2-hit-closes-menu`'s.

The six seed-searched tests (`parity-ffx2-engine-interrupt`, `tourist-trap-turns`, `experiment-story`, `advisor-line-first`, `advisor-v3-final`, `trema-retry-flow`) merged without a conflict and **needed no new re-pin on this base** (none of them plays Chapter VI, and r52 and the link opening do not reach them): the lane's versions pass on the merged tree (57 tests in 6 files). Proof that they are the slice's: their **base versions** (`git show 35aa31e77:...`, copied to scratch files) pass **57 of 57 with the switch forced off** (the base's old pins come back), and **fail 8 tests in all six files with the slice on** (one test in five files, three in `trema-retry-flow`).

Each header says the cause in one line: **X2-A per-body windows, on top of the link opening.**

### 12.3 Chapter VI, combined (the link opening ON in both arms; X2-A off against on)

Measured with the X2-A measure test (`tests/unit/ffx2-hit-reaction-measure.test.ts`), not the X2-L bench: it plays the shipped line through the app's own path (`setupForChapter`, `setupForNextLink`), so the link opening is included by the constant being ON, and its `old` arm (the switch off, `withReactionKnobs(OLD_REACTION)`) is the base (it reproduces the base's hashes, section 12.2). The paces are the lane's own and the same as in section 5 (**human** = Wait with the split, 1.5 s a menu of which 0.5 s on the top list; **Active** = 1.5 s a menu with the clock running; **bench** = zero decision time), 500 seeds at Wait and Active, 200 at the bench pace (the lane's own bench seed count for the heavy chapters). First-try win = the whole chain (Acts I to III) in one attempt.

| Pace | Seeds | Link 1 | Whole chain, base -> merged | Seeds W->L / L->W (p) | KOs / seed | Enemy chain hits / seed | Longest chain on an enemy | Fight length (minutes / seed) | Party turns / seed |
|---|---:|---|---|---|---|---|---|---|---|
| human (Wait) | 500 | 500 -> 500 | **499 -> 500** (+1) | 0 / 1 (p = 1.000) | 1.2 -> 1.4 | 54.6 -> 46.6 | 6.8 -> 4.7 | **2.44 -> 2.68** (+10 %) | 77.7 -> 85.4 |
| Active | 500 | 500 -> 500 | **465 -> 472** (+7) | 22 / 29 (p = 0.401) | 2.7 -> 2.6 | 40.1 -> 33.8 | 4.4 -> 3.9 | **3.86 -> 4.05** (+5 %) | 89.5 -> 95.0 |
| bench | 200 | 200 -> 200 | **200 -> 200** (+0) | 0 / 0 (p = 1.000) | 0.8 -> 1.0 | 58.2 -> 51.1 | 7.9 -> 5.4 | **2.01 -> 2.23** (+11 %) | 72.9 -> 80.9 |

How it reads. **The two changes do not interact in Chapter VI: the base's own figures are the link opening's (499 at Wait and 465 at Active are exactly the "ON, both acts" rows of `docs/handoff/re-parity-rc9-x2-link-open.md`), and the slice then moves them by what it moved alone on release 50.1** (section 5.1: Wait 499 -> 500, Active 467 -> 474, bench 200 -> 200; fights 2.53 -> 2.81, 3.98 -> 4.23 and 2.12 -> 2.33 minutes): +1, +7 and +0 first-try wins, none beyond noise, with the fights 5 to 11 percent longer because the party's chain on the Syndicate breaks sooner (enemy chain hits 54.6 -> 46.6 a fight at Wait). Chapter VI stays a won chapter at all three paces (500, 472 and 200 of the seeds). No Chapter VI row of the slice is a mover.

### 12.4 Every other chapter, 12 seeds, against what X2-A alone measured

Two tools, both on the merged tree, each with X2-A off (the base) and on:

- **The X2-A measure test**, 12 seeds of all twelve chapters at three paces, old (the switch off) against new, set beside the lane's own rows (release 50.1, same 12 seeds). **66 of the 70 cells have the same twelve per-seed outcomes as the lane's rows; in all 60 cells of the ten chapters other than Chapter VI and its preview, the win counts and the movement are identical** (largest gap 0), and so is every per-seed string. The four cells that differ are `ffx2-leblanc` and `exp-leblanc` at Active, old and new: where the link opening acts (merged 11 -> 11, lane 11 -> 12).
- **`x2-link-open-others` with `PYREFLY_MEASURE=1`** (12 seeds, the chapters' shipped lines, the flag false against true): passes (13 tests) on the merged tree and with the switch forced off. **Chapter VI and the Leblanc preview move as before: 12 of 12 logs differ at all three paces** (the flag acts); **every other chapter moves 0 of 12** (the flag acts on no other chapter). What differs from the base is therefore X2-A's effect, and it is X2-A's own 12-seed movement:

| Chapter | Wait: base -> merged | Active | bench | X2-A alone (lane, r50.1) |
|---|---|---|---|---|
| IV Bahamut | 12 -> 12 | 12 -> 12 | 12 -> 12 | the same |
| V Vegnagun | 11 -> 11 | 11 -> 10 | 12 -> 12 | the same |
| IX Fallen Aeons | 12 -> 11 | 12 -> 11 | 12 -> 12 | the same |
| X Trema | 8 -> 11 | 1 -> 2 | 10 -> 8 | the same |
| XII Den of Woe | 12 -> 12 | 11 -> 12 | 12 -> 12 | the same |
| XIII Ixion | 12 -> 12 | 12 -> 12 | 12 -> 12 | the same |
| XI Experiment (hidden) | 10 -> 7 | 6 -> 6 | 10 -> 7 | bench the same; at Wait the measure test reads 6 -> 6 (the two tools drive the hidden chapters by different lines) |
| XIV Tourist Trap (hidden) | 12 -> 12 | 8 -> 6 | 12 -> 12 | Active the same; at Wait the measure test reads 11 -> 10 |
| XV Valefor (hidden) | 12 -> 12 | 12 -> 12 | 12 -> 12 | the same |
| XVI Angra Mainyu (hidden) | 11 -> 10 | 1 -> 0 | 11 -> 10 | Active and bench the same; at Wait the measure test reads 8 -> 10 |
| VI Leblanc and its preview | 12 -> 12 | 11 -> 11 | 12 -> 12 | the link flag moves all 12 logs at every pace; the slice's own effect is section 12.3 |

(The row labels are the chapters' numbers as `encounters.ts` and section 5 give them; the others test calls the same chapters by its own numbers, X for Trema, XII for the Den, XIII for Ixion and so on. Where the two tools disagree on an absolute count they drive the hidden chapters by different lines; the direction and size of the move agree.) **12 seeds can only show large moves; they show none the lane did not measure.** The 500-seed figures of section 5 were not re-run for chapters other than VI: the 66 of 70 identical per-seed strings are the evidence that they carry over, and the rest of the release's disclosures stand as section 9 and 10 give them.

### 12.5 Tests, goldens and the line budget

- `npx tsc --noEmit` (the repo's `tsc` by path): clean on the merged tree.
- Passing on the merged tree: `ffx2-atb-golden` (6 tests), `ffx2-hit-closes-menu` (7), `ffx2-menu-cancel-delay` (6), `chapters/den-of-woe-carry`, `ffx2-hit-reaction-wiring` (17), `parity-ffx2-hit-reaction` (14, 4 skipped without the full proof folder), `x2-link-open-path` (7), `ffx-engine-golden` and `ff7-golden` **unchanged** (green, no pin touched), the six seed-searched tests (57), and the wide pass of section 12.7.
- `node tools/orphans.mjs`: none of the new modules is an orphan.
- **400-line budget:** `engine-core.ts` 399, `internal.ts` 399 (both unchanged by the stacking; this lane adds no line to either), `resolve-strike.ts` 387, `atb-engine.ts` 352, `constants.ts` 300, `chain.ts` 123, `reaction.ts` 211, `kernel/hit-reaction.ts` 250, `adapt/inputs.ts` 192, `data/ffx2/hit-reaction-frames.ts` 180. Nothing reaches 400, so **no helper had to move**; the options of section 7 stand for whoever next needs a line in `engine-core.ts` or `internal.ts` (`AiContext` / `AiScript` into `ai/types.ts`, or `nextActor()` out of `engine-core.ts`). No contract file (`docs/CONTRACTS.md`) is touched, so no `docs/CONTRACT-CHANGES.md` entry is owed.

### 12.6 Corrections from the independent check, folded in

1. **The data-file comment was wrong.** `src/data/ffx2/hit-reaction-frames.ts` said "monster.bin and monster2.bin agree on all of them" for the monster rows; they do not for rows **176 and 284 to 286**, where monster2 names another set. The numbers are monster.bin's, and the difference has no effect on any window of ours. The comment now says so (comment only; no number moved).
2. **The CHANGELOG paragraph (section 9) is corrected in two places:** it now names the hidden **Angra Mainyu at the instant-decision pace, 190 to 179 of 200** (marginal, p = 0.043; at Wait and Active within noise; it had been listed among the chapters that do not move), and it says that the Trema Paragon link's "+26 percent damage taken" (section 5.2) is **mostly the lost fights; among the fights the party wins it is about +7 percent**. The sentence in section 5.2 carries the same correction.

### 12.7 The wide pass, and what is left

Two wide passes of the tests that drive the FFX-2 engine, the advisor, the chapters or the flow (no full suite; at most two vitest workers):

- **Pass 1, complete:** every test file whose name contains `ffx2`, `iter2-b1` or `x2-link` (209 files, 14 of them the measurement files that skip without their environment switch). **193 files passed; 4,874 tests passed, 65 skipped, 3 failed in 2 files:** `chapter-meta-ffx2-leblanc` (2 tests, "exists under public/art": the art is absent in worktrees, not this lane's) and `data-ffx2-citations` (1 test: the lane's new `hit-reaction-frames.ts` had no section sign and no confidence tag, which the test asks of every FFX-2 data file; **a defect of the lane's own branch, found here and fixed by a comment** (the file now carries `§ 7.3` and `[verified: ...]`, section 12.6); the test passes, 115 of 115).
- **Pass 2, partial:** `tests/unit/chapters/`, `advisor*`, `trema*`. The machine was at 100 percent CPU from other sessions: the first attempt stalled behind the long bench files (25 files in 30 minutes) and was stopped by its PID; the second (the `*bench*` files excluded) was stopped by its PID after 9 minutes and 14 files. Of those, the engine, AI and flow files passed (`leblanc-engine`, `mirror-aeons-ai`, `mirror-aeons-chapter`, `last-summoning-chapter`, `last-summoning-sisters-ai`, `advisor-line-first`) and the failing ones are the `*-ship-content`, `*-ship-scene`, `isaaru-ship` and `experiment-scene` files, the family of the art-only failures the lane listed (`den-of-woe-ship-content`, `fallen-aeons-ship-content`, `leblanc-art`, `pause-remake`; `public/art` is absent in worktrees). Rerun on their own, the seven failing files give 15 failing tests of 81, every one an existence check of a painting or sprite (the messages name road-to-the-farplane.png, backdrops/den-of-woe.png, isaaru, baralai-shade; seven carry no label), so none is about a chain window. **Not run to the end:** the rest of `tests/unit/chapters/` and `advisor*` / `trema*`; the six seed-dependent tests among them were run on their own (12.2), and the release driver's full-suite run before the push covers the rest (AGENTS.md "Done means").

Open items of this stacking, besides section 10's (which all stand):

- **The 500-seed tables of section 5 were measured on release 50.1** and not re-run on this base for any chapter but VI (12.3); 12.4 is the evidence that they carry over. If the release driver wants them re-run for release 53, the driver of section 11 does it on this branch unchanged (`run-all.mjs` there points at the lane's worktree path; pass the new branch's).
- **The kill-reward chain term** (section 7, item 2 of "Two things the driver should know") is still not measured: the rewards lane adds the chain counter and the best chain at the killing blow to its rare-item odds, and the slice makes chains shorter. Not measured here either.
- **The CHANGELOG paragraph (section 9) is the lane's, with the two corrections of 12.6.** For release 53 it needs no Chapter VI sentence beyond: "Chapter VI is unchanged beyond noise with the new link opening and the per-body windows together (Wait 499 to 500 of 500, Active 465 to 472, instant 200 of 200), and its fights run 5 to 11 percent longer", which is 12.3.
- Scratch of this stacking (`tests/unit/zz-x2a-r52-*.tmp.test.ts`, `tests/zz-x2a-r52-off-setup.tmp.ts`, `zz-x2a-r52-off.tmp.config.ts`) was deleted; the per-lane temp folder `D:\Tools\ffx-parity\tmp\x2a-r52\` was deleted after the numbers above were copied into this note.
