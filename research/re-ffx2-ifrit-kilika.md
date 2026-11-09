# FFX-2 Ifrit at Kilika Temple (Chapter 3, "Pest Control"): row 165 and its script, read from the game's own files

**Game case: FFX-2 only.** The fight is the story mission "Pest Control" of FFX-2 Chapter 3 (ATB, dresspheres, the FFX-2 kernel tables). The FFX aeon Ifrit (Fist/Grothia, Belgemine's, Dark Ifrit) is a different monster with a different script and no number is shared.
Written 2026-11-07 by a Sonnet sub-agent of the release driver (program plan row 46, `PLAN.md` of 2026-11-06, wave 4). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed; the game was not run; no browser, no GPU, no Ghidra.** Authority (relayed words, verbatim): 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers and described behaviour from the owner's Steam copy (FFX-2 half of the HD Remaster), read by the research lane's read-only node reader of the game archive and its row, formation, move, source-comparison and disassembly tools. Names are the game's English name tables; no dialogue, no script lines, no byte dumps.

**Tags.** **[R]** read from a game file (kernel table, the shipped plain-text AI source, the compiled worker, the scene file); **[I]** inferred; **[G]** a guide; **[note]** an earlier note of this program or the repo (`research/ffx2-fallen-aeons.md` §7.1, `re-ffx2-yojimbo-valefor` as quoted by the Valefor chapter).

## Summary for the driver

1. **The row and the scene.** Ifrit is `monster.bin` row 165 (id 0x10a5), Lv 23, **HP 8,820, MP 9,999**; the scene is `klyt11_229` (battle map "Kilika Temple trial"); the only other formation holding him is the test scene `zzzz01_65`. [R]
2. **The script is exactly the guides' action-counter pattern, now with its numbers.** One gauge: **+7 per ordinary action, +5 per hit taken**. Ordinary action: **Firaga on all three one turn in three, Attack on a living girl two in three**. **Meteor Strike on the girl farthest from him** the first time the gauge reaches 30, 60 and 90 (one each), **Hellfire on all three at 100** (gauge and Meteor count back to 0). [R: `m165.src`, equal to the compiled worker's command ids, modulus 3 and scene constant, compared by a source-against-worker check; the constants 7, 30, 60, 90, 100 checked in the worker's disassembly]
3. **A subtlety no guide states:** neither the Meteor Strike nor the Hellfire adds to the gauge, so with nobody hitting him a cycle is **19 actions: 15 ordinary, three Meteors (the 6th, 11th and 16th), the Hellfire (the 19th)**. Every hit he takes brings it forward. [R, I]
4. **A "battle too long" block is live in this scene** (unlike Valefor's, whose scene constant does not match): after his 180th poll he announces anger, then fury at 190, "about to blow" at 195, "this battle ends now" at 200 and then **Time Up Meteor (power 200, 12 hits, everyone)** every poll. At 19 actions a cycle that is nine Hellfires deep; it exists to stop stalling and is unreachable in play. [R]
5. **Elements:** absorbs Fire, weak to Ice, Gravity nulled; immune to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Itchy, Auto-Life, Stop and Doom; **Slow and the Breaks land** [R, matches the Fallen Aeons note]. The special word 0x3c3 (bits 0, 1, 6, 7, 8, 9): percent-HP formulas, delay/Interrupt and ATB damage do nothing, no Zantetsu. **His automatic status is "uses no MP"**, so Firaga is free for him. [R]
6. **Build and cost.** The Chapter 3 pair-mission party is the repo's `besaidBuild` (the Chapter 2 preset, carried) plus the Samurai dressphere, which the guides put on the way to him; no new mechanic; the Valefor chapter is the template; about 12 h against the plan's 17.

## 0. Result in one screen

| Field | Value [R: the row dump] |
|---|---|
| Row / id / name | 165 / 0x10a5 / Ifrit; model, motion and sound 0x10a5 |
| Level, HP, MP | 23, 8,820, 9,999 |
| STR / DEF / MAG / MDEF / AGI | 82 / 98 / 22 / 49 / 114 |
| ACC / EVA / LCK / "thinking" byte | 95 / 14 / 2 / 0 |
| Elements | absorb Fire; weak Ice; null Gravity |
| Moves (waza) | Attack 0x41da, Hellfire 0x4094, Meteor Strike 0x4095, Firaga 0x41f1, death row 0x40ae |
| EXP / Gil / Pilfer Gil / AP | 1,800 / 1,300 / 1,800 / 15 |
| Drop (byte 255: both slots) / steal (byte 128) | Angel Earrings x1 / Fiery Gleam x1 |
| Zantetsu byte | 80 |
| Scene | `klyt11_229` (formation 483): Ifrit alone at slot 1; start positions: the girls at (0,0,-27), (-12,0,-25), (12,0,-25), Ifrit at (0,0,26) [R: `pos_klyt11_229.psc`] |

These equal the Fallen Aeons note's §7.1 block field for field (Lv 23, HP 8,820, STR 82, MAG 22, DEF 98, MDEF 49, AGI 114, EVA 14, LCK 2, EXP/AP/gil/pilfer, drop, steal); the row adds MP 9,999, ACC 95, the status list, the special word and the Zantetsu byte. [note, R]

## 1. The moves (the game's rows)

| Move | Row | Class and formula | Power | Target | Cost and timing |
|---|---|---|---:|---|---|
| Attack (no cancel) | 0x41da | physical, f0, accuracy formula 2 (acc 95) | 16 | one, near-weighted by the script's pick | ATB 100; crit 5 |
| Firaga | 0x41f1 | magical, f2, Fire | 19 | all three | MP 24 (free for him), cast 70, reflectable |
| Meteor Strike | 0x4095 | magical, f2 | 25 | one: the **farthest** from him (greatest 2D distance) | ATB 80, cast 100 |
| Hellfire | 0x4094 | magical, f2, Fire | 24 | all three | ATB 100, cast 180 |
| Time Up Meteor | 0x4236 | f5 | 200 x 12 hits | all | after 200 polls only |
| Anger rows 0x4232 to 0x4235 | | announcements ("battle too long ...") | | himself | |

The farthest girl is the one in the first start slot (distance 53 against 52.4 for the other two) [R, I: from the start positions above; the repo's Valefor chapter uses a fixed formation for the same pick].

## 2. The script, in order (normal worker 0) [R]

Each poll (when no friendly guest is present, a counter of polls runs; see §3):

1. **Gauge 100 or more:** gauge 0, Meteor count 0, **Hellfire** on all three.
2. **Gauge 90 or more:** if fewer than 3 Meteors fired, count +1 and **Meteor Strike on the farthest girl** (no gauge gain); else an ordinary action.
3. **Gauge 60 or more:** the same with "fewer than 2".
4. **Gauge 30 or more:** the same with "fewer than 1".
5. **Ordinary action:** gauge +7, then draw `% 3`: 0 = **Firaga on all three**; 1 and 2 = **Attack** on a living girl (the script's near-weighted pick).

`Reaction` (every hit taken): gauge +5. `Death`: a scripted death row (no Raise). Menu, targeted: empty. No HP phase, no status test, one draw per ordinary action only (stream 2; the farthest and living picks use stream 4). [R: `m165.src`; the compiled worker equals it in command ids {10}, modulus {3}, scene constant 0x8c00e5 = `klyt11_229`]

**The cycle with nobody hitting him:** actions 1 to 5 ordinary (gauge 35), 6 Meteor, 7 to 10 ordinary (63), 11 Meteor, 12 to 15 ordinary (91), 16 Meteor, 17 and 18 ordinary (105), 19 Hellfire. With the girls' hits (+5 each) the cycle is shorter; a long fight stacks Hellfires. Guides: "Meteor Strike on crossing 30, 60 and 90; at 100 Hellfire" [note, G: matches].

## 3. The "battle too long" block

Counter `n_action` rises by one each poll **only when no friendly guest is in the party** (the test counts guests). In the scene `klyt11_229` (and only there): poll > 180: "Angry" row; > 190: "Furious"; > 195: "About to Blow"; > 200 and the last row already shown: "This Battle Ends Now"; then **Time Up Meteor every poll**. The first four rows are announcements (damage formula 0, power 0). [R: the worker's disassembly]. For scale: at 19 actions a cycle, poll 180 is the tenth Hellfire; no bench line reaches it. The Valefor chapter did not port the equivalent block because Besaid's scene constant does not match; **here the constant matches** (the Valefor note says the block never runs there). Recommended: port it (about 15 lines), with one test that pins the thresholds.

## 4. Where it is in the game

Mission "Pest Control" at Kilika Temple, FFX-2 Chapter 3; story-compulsory; opens Chapter 3's "No Way Djose" together with the Besaid mission (they can be done in either order) [note: `ffx2-ixion-djose.md` §1.1, `[verified: 3 sources]`]. The Samurai dressphere is found in the temple on the way to him [note: `ffx2-fallen-aeons.md` §7.1, `[verified: 2 sources]`; `djose.ts` lists it as owned by Djose]. The fight takes place in the Chamber of the Fayth (map name: Kilika Temple trial). No event-package disassembly was needed (the scene is launched by one event package, the only one holding the scene constant besides the debug list).

## 5. Engine and art facts (checked against `origin/main` 63813367c by reading)

* `src/battle/ffx2/ai/valefor.ts` and `data/ffx2/enemies/valefor.ts` are the template: one gauge, the counter, the Rays-fired count; Ifrit changes the increments (+7 / +5), the thresholds (30/60/90) and adds the Meteor count (3), the Firaga branch and the Meteor target pick. `x2-` combatant ids: `x2-ifrit`. Chapter shape: `chapter-ffx2-valefor-besaid.ts`, `builds/besaid.ts` (a deep copy of the Chapter 2 preset).
* Art: the `ifrit` master exists; `x2-ixion`, `x2-shiva`, `x2-anima` are the "possessed look" treatments; **no `x2-ifrit` exists**; plate: Kilika's chamber has none; `ffx2-djose-chamber-standin` (Bailey's approved Djose plate, the Valefor chapter's stand-in).

## 6. Unknowns

| # | Item | Decision |
|---:|---|---|
| U1 | The exact guest test (which characters count as a guest) | none appear in the mission; the block is ported with "no guest" always true |
| U2 | Whether Samurai is worn | the preset owns it and wears the Chapter 2 spheres; measured both ways |
| U3 | The Meteor Strike target when positions move | the repo has no later movement; the fixed first slot is the farthest |

## Working files (kept outside the repo)

The research lane kept a read-only reader of the owner's game archive, the extracted row's AI source and compiled worker, the scene files, and the text outputs the tables above quote (the row dump, the formation list, the move rows, the worker's disassembly). None of it is committed: no game text, script text or byte dump is in this repo; the repo carries the numbers only, in `tests/fixtures/parity/ffx2/ifrit_kilika_rows.json`, which a reader of the implementing lane wrote again from the kernel tables.
