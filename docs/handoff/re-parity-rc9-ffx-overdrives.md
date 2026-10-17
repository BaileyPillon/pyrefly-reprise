# Re-parity RC9, lane FFX-A: the Overdrive minigames are the game's controllers (FFX only)

Status: **built, tested, measured, mutation-checked and pictured on branch `re-parity-rc9-ffx-overdrives` (from `origin/r49-rc`, `f939b87f`); pushed; not merged, not deployed** (2026-10-15). The source under `src/` is the same as at `6f0e3834b` (the RC9 lane's last code commit); `tests/` gains the tests the mutation pass asked for (five in `parity-ffx-engine-minigames` and the new `ffx-raw-input-edge-only`), in the commit before this note. The pictures are `a6e4c109c`; the commit that carries this note is the branch tip. `node tools/critic-plan.mjs --paths <the lane's source files>` says DEEP (the FFX CTB engine and the shared combat core; it prints `games: both` only because `battle/common/types.ts` is a shared contract, and the field added there is optional and FFX only): a focused review before a deploy and the deep review on the live build after it; this lane deploys nothing.
**Game case: FFX only** (AGENTS.md rule 14): Swordplay (Tidus), Bushido (Auron), Fury (Lulu) and Wakka's reels exist only in FFX. Nothing under `src/battle/ffx2`, `src/data/ffx2` or `src/audio` is touched; `ffx2-atb-golden` and `ff7-golden` are untouched.
No boss number and no party number was changed or added. Every figure below is from `FFX-G01` (private note; FFX.exe, Steam build 25501027) and the game's own machine code run in an emulator.

Bailey's words, as the brief quotes them: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please" (plan questions Q1 to Q3, D-763 to D-765); 2026-10-13 "keep going please all of this reverse engineering needs to be incorporated into our game" and "keep going please full speed ahead". The release driver owns every screen: no overlay was redesigned and no input was added.

## 0. Result in one paragraph

Tidus's Swordplay, Auron's Bushido and Lulu's Fury play by the game's own controllers: the limits (Energy Rain 3 s, Blitz Ace 2 s), the narrower Swordplay window and the frame-stepped marker, the exe's button orders for three of the four Bushido, the game's table of casts for Fury with its digital rule on a keyboard, and the line classifier for Wakka's reels where the symbols are known. Each kernel replays the game's own machine code (run in an emulator) on its vectors, and mutants of each rule disagree with them; the three overlays keep their look and add no new input (one opt-in option of the shared key watcher, section 3b, is the one thing the release driver should read). **Nothing a chapter measures moved except two things, both named and ablated:** Chapter III's logs move on 227 of 500 seeds (Energy Rain's limit; no outcome and no turn count changes) and Chapter XVII's on 364 of 500 (Fire Fury's table; wins 437 to 433); the other five chapters that fire these Overdrives are byte for byte the base's at 500 seeds, and so are all the chapters at 12 seeds but those two. `ffx-engine-golden` carries one moved digest (Braska seed 1, link 4, cause written in the test); `ffx2-atb-golden` and `ff7-golden` are unchanged. **Two things the player will notice and that the release should say:** Swordplay is clearly harder, and a keyboard Fury is stingier (about half the casts at a brisk pace for the same key presses). One finding of this lane, read from the code, corrects the note: the digital Fury reads newly pressed buttons, not held ones (section 3). **Checks:** `tsc` is clean; the lane's tests and the three goldens pass (23 files, 467 tests); the whole suite, once, fails only on missing paintings (23 files, all art-only, 21 of them pass with the art linked, section 4); a mutation pass of 65 one-rule faults of the production code catches 54 on the first run and leaves 11 alive; each of those is accounted for, the tests it asked for are added, and at the end 61 are caught and 4 equivalent ones survive (section 4); a held key counts once, checked with real auto-repeat events in a browser (section 7).

## 1. What changed

| Row | Before (`origin/r49-rc`) | Now (the game's) | Where |
|---|---|---|---|
| A1 limits | Energy Rain 2.6 s, Blitz Ace 2.2 s | **3.0 s and 2.0 s** (Spiral Cut and Slice and Dice were 3.0 s already) | `overdrive.ts#timerMsFor` through `adapt/minigame.ts#minigameLimitMs`, `kernel/minigame-swordplay.ts` |
| A2 Swordplay | a marker sliding smoothly, a gold zone of 22 / 16 / 12 / 9 percent of the bar (an estimate Bailey adopted on 2026-10-04) | the game's controller a frame at a time: a marker that moves a whole **11 / 12 / 13 / 14** units every 1/30 s on a 275-unit bar, a centred window **24 / 20 / 20 / 18** units wide (**8.7 / 7.3 / 7.3 / 6.5 percent**); a press is seen by the next frame, judged on the marker as drawn; a miss restarts the marker at the left and the limit goes on; the result carries the frame, and the time left is `limit - frame / 30` | new `kernel/minigame-swordplay.ts`, `kernel/minigame-timer.ts`; `TidusTiming.ts`, `ui/ffx/minigames/frameDriver.ts` |
| A3 Dragon Fang | down, left, up, right, L1, R1, **Circle, Cross** | ..., L1, R1, **Cross, Circle** | `kernel/minigame-bushido.ts`; `data/ffx/overdrives/inputs.ts` derives the overlay's tokens from the kernel's pad words |
| A4 Shooting Star | Triangle, **Circle**, Square, Circle, Left, Right, **Cross** | Triangle, **Cross**, Square, Circle, Left, Right, **Circle** | same |
| A5 Tornado | **Cross**, Right, R1, Left, L1, Triangle | **Circle**, Right, R1, Left, L1, Triangle | same (Banishing Blade, Up, L1, Down, R1, Right, Left, Triangle, was already the game's) |
| A6, A7 Fury | casts interpolated between three anchors (Magic 0, 128, 255); each alternate left or right press half a rotation; zero casts possible | the game's **17 digit rows chosen by spell group and Magic** (at most six brackets a group; Drain and Osmose have their own set, not Fira's), a free first cast so **at least 1 cast**, **two left+right pairs make one rotation** (a cast is gained when the halved step counter reaches the threshold) | new `kernel/minigame-fury-tables.ts`, `kernel/minigame-fury.ts`; `fury.ts#furyCastsFor`; `LuluFury.ts` |
| A8 reels | a pair of Aurochs symbols was the Aurochs shot at one enemy | a pair of Aurochs symbols is no match: a Power Shot; the line classifier of the exe is ported and proven for every line | new `kernel/reel-line.ts`; `reels.ts` (wired for the symbols whose number the command table fixes) |
| B3 seam | the result carried milliseconds only | `TimingResult.frame` and `SequenceResult.frame` (additive), so the damage lane can rebuild A and B in float32 seconds | `types.ts`, `docs/CONTRACT-CHANGES.md` |
| held keys | a held arrow key (the keyboard's auto-repeat, a pad direction's repeat) fed Bushido and Fury a stream of presses | a press counts once, when the key goes down, in all three overlays: the game reads a button as newly pressed | `ui/ffx/rawInput.ts` option `edgeOnly`, opt-in, used only by the three overlays (section 3b) |

What is NOT changed (kept on purpose): the three overlays' look (slab, bar, chips, ring, words, the keys they print); the Wakka reel overlay and the Attack Reels rule (Miss, the four lines per spin and what Wakka's script passes as time are unread: note open questions 1 to 3); the headless stand-in `rollDefaultMinigame` keeps its draws (same count, same order, same stream: only the limits and the Fury table it is read against changed); no gamepad stick input was added (the analog controller is proven in the kernel and left unwired).

## 2. The rules, where they come from (FFX only)

Every number is in `FFX-G01` (private working note, sections 6 and 7) and was checked by running the game's own functions in the Unicorn emulator over scripted input, with an independent model agreeing; the vectors are in `tests/fixtures/parity/ffx/`:

| Kernel | Game function (FFX.exe, Steam build 25501027) | Proof in the repo |
|---|---|---|
| `kernel/minigame-timer.ts` | the limit timer 0x00891AC0: `A = float32(B - ticks / 30)`, 0 once it is not above 0 | replayed inside every Swordplay, Bushido and Fury vector |
| `kernel/minigame-swordplay.ts` | the controller 0x00892320 with its set-up 0x00898180 and 0x00898CA0 | `minigame_swordplay.json`: 1,040 vectors (4 geometry, 8 free runs with the marker before every frame, 624 single presses, 404 multi-press scripts; 3 s and 2 s limits; with and without the PAL tick rate); the kernel agrees on grade, A, frame, misses and the markers |
| `kernel/minigame-bushido.ts` | the controller 0x00890F70, sequences 0x00C86B70, limits 0x00C86B60 | `minigame_bushido.json`: 396 vectors (the four sequences the real set-up wrote, 64 gap runs, 56 finished-in-frame runs, 272 random runs with wrong words; index trace on a sample); the kernel agrees on grade, A, frame, wrong presses, the index after every frame |
| `kernel/minigame-fury-tables.ts` | the selector 0x00A5CC70, the thresholds 0x0089A2F0, the limit 0x00A5CB10, the 17 rows at 0x00B7B7F4 | `minigame_fury.json`: all 19 spells x 256 Magic values (4,864 rows) |
| `kernel/minigame-fury.ts` | the controller 0x00891B80 (analog quadrants and the digital fallback), the frame order of the dispatcher 0x0089AE20 | `minigame_fury.json`: 97 scripted runs (analog and digital, every cast count 1 to 16), the analog ladder (exact rotations 0 to 40 both ways, 21 spell x Magic cells) and the digital ladder; casts, counter, frames, calls and the result (A = B = 0) agree |
| `kernel/reel-line.ts` | the line classifier 0x007B1710 | `reel_line.json`: all 4,913 triples of 17 symbols and 1,500 random lines |

**Mutants built into the kernel test** (`tests/unit/parity-ffx-minigames.test.ts`; the separate mutation pass of section 4 changes the production code instead): a window one step wider or narrower or shifted, a faster marker, the wrong limit, a shorter bar (Swordplay: 6 mutants, all caught); no reset on a wrong press, a wrong press tried as input 1, the last two words swapped (Bushido: 3, all caught); the dead-zone edge 0x9F, no halving of the digital counter, one rotation direction only, a 0.6 s stall clock, a threshold plus one (Fury: 5, all caught, the same five as the note's); a pair of the Aurochs symbol counting as a match (reels: caught). One honest equivalence: an exclusive window end cannot be told from the inclusive one, because no marker ever stands on an end for these four speeds (the ends minus 118 are 125 and 149, 127 and 147, 127 and 147, 128 and 146, none a multiple of 11, 12, 13 or 14); the test says so.

**Engine seam** (`parity-ffx-engine-minigames.test.ts`, numbers restated from the note, not read back from the kernels): the limits of all 27 abilities, the Swordplay params of each tier, every input of the four Bushido against the note's pad names, the casts after 5 / 10 / 15 / 20 / 30 rotations at the note's own examples (Fire Fury at Magic 0, 128 and 255; Flare and Ultima at 128), Fire Fury at Magic 90 (5 / 8 / 10 / 13), Drain and Osmose Fury's own brackets, the headless roll (same draws, same order), and each overlay opened with the engine's own request and played with real key events on a fake clock (a Swordplay press in frame 13 hits and is graded `3 - 13/30`; in frame 15 it misses; a Bushido run with a wrong word in it succeeds after the reset; four Fury pairs at Magic 20 make two rotations and two casts; and, added by the mutation pass, a part of a rotation buys nothing, Left and Right both held with auto-repeat make one step, a wrong key and the right one inside one frame are one wrong press, and a move ends in the ring's own frame).

## 3. The pad bit to key mapping, and what the overlay keeps

The live read of 2026-10-13 (`live/2026-10-13-live-session.md`, section 2) gives the keys behind each bit on the Steam PC build: Up, Down, Left and Right arrows; **Circle (0x20) is Enter or C, Cross (0x40) Backspace or X**, Triangle V, Square Z, L1 S, R1 D. The kernel holds the sequences as those pad words, so the order the game checks is exact whatever key a port binds. **The overlay keeps its own keys and glyphs** (the screen is the driver's): its Cross (a `confirm`, drawn with the cross glyph) is Enter and its Circle Esc, Triangle Q, Square K, L1 F, R1 R. A player follows the chips on the screen, so the sequence they type is the game's order; only the physical key a glyph sits on differs from the PC game. Which is better (the game's keys, or ours) is decision 1 below.
One check the note raised stays open: the live pressed word is the bit in both 16-bit halves (`0x00200020`), while the controller was proven against single-bit words; the controller either masks the word or compares a doubled value, or the word read at 0x025D09D4 is not the one it reads. It changes nothing in these rules (the order and the whole-word comparison are what was proven) and needs one look at a running Bushido.

**A finding of this lane, read from the code (not in `FFX-G01`, which marked it [I]): the digital Fury reads newly pressed buttons, not held ones.** The fallback (0x00645EB0) asks 0x00630CF0 whether Left (0x8000) and Right (0x2000) are down; that routine calls 0x00631360 on the pad object at 0x00CCB170, which is true when the bit is set in the pad's current word (offset 0) and not set in the previous one (offset 4): a rising edge (its neighbours at 0x00631340 and 0x00631380 are the held and the released reads). So a held key counts once, a step needs a press on each side, and the overlay gives the frame's presses to the controller's first call only (the second call, after the extra pad poll, finds none new). Before this was read the overlay fed each press to both calls, which counted every press after the first as a step and doubled the keyboard's casts; `parity-ffx-engine-minigames.test.ts` pins the pair rule, that a key held or pressed twice on one side makes no step, and that Left and Right both held with auto-repeat make one step. **Unread:** whether a keyboard-only Steam session reports an analog pad (arrow keys as stick axes, so the quadrant rule) or none (this digital rule): `0x00638E30` and `0x00C58EF0` were not traced. Q2 was decided for the digital rule; if a keyboard session is analog, the casts at a keyboard pace are different (decision 5).

### 3b. The one input-layer change, for the release driver to review

`src/ui/ffx/rawInput.ts` (the key and pad watcher every HUD screen shares, which the release driver owns as presentation) gains **one opt-in option, `edgeOnly`** (`RawInputWatcherOptions`; default **off**, so every other screen reads input exactly as before; the diff is 9 added and 2 changed lines: `git diff origin/r49-rc..HEAD -- src/ui/ffx/rawInput.ts`, commit `6f0e3834b`). With it on, the watcher reports a button once, when it goes down: the keyboard's auto-repeat events are dropped (the existing rule dropped them for everything but the four arrows, which menus repeat) and a held pad direction (d-pad or stick) no longer repeats after its delay. It is switched on in exactly three places, the three Overdrive overlays (`TidusTiming.ts`, `AuronSequence.ts`, `LuluFury.ts`), because the game reads a button as newly pressed (the pad's pressed-edge word; for Fury the reader at 0x00630CF0 is true only on the frame the bit rises, section 3).

Why it was needed: a player holding an arrow while Bushido or Fury was open sent the overlay a stream of presses the game never sees. In Bushido every repeat of a held arrow is a wrong press that sends the progress back to the start; in Fury the repeats fed steps. **What to review:** (1) that nothing else passes `edgeOnly` (`tests/unit/ffx-raw-input-edge-only.test.ts` fails if another file does); (2) the pad branch, where the repeat is skipped with the option on (the same file pins it with a held d-pad and a held stick, and shows a default watcher still repeats); (3) the real auto-repeat result in a browser (section 7, held keys). Swordplay's `edgeOnly` changes nothing in practice (its press is Confirm, which never repeats on the keyboard or the pad in either mode): it is set so that all three overlays read presses the same way, and a test pins that it is set (mutation U01, section 4).

## 4. Tests

All run from the worktree with the tools by path and `TEMP` / `TMP` on `D:` (section 13).

| File | What it pins |
|---|---|
| `parity-ffx-minigames` (new, 41 tests) | the six kernels against the emulator vectors, hand-worked blocks first, mutants of every rule |
| `parity-ffx-engine-minigames` (new, 40) | the engine seam and the three overlays on the engine's own request (numbers restated from the note), including a held key, a miss, a wrong word, the digital pair rule |
| `parity-ffx-frame-driver` (new, 4) | the 30 Hz clock: frames in order, a press seen by the next frame |
| `ffx-raw-input-edge-only` (new, 10) | the `edgeOnly` option on the keyboard and on a pad (a held direction, a held stick, a held confirm), that a default watcher still repeats a held direction, that two watchers do not affect each other, and that only the three overlays pass the option |
| `ffx-swordplay-miss-restart`, `ffx-bushido-wrong-press-reset`, `ffx-overlay-input`, `ffx-overdrive-inputs`, `ui-ffx-minigames`, `ffx-formulas`, `ffx-engine`, `ffx-bushido-fail-bonus`, `ffx-bushido-immune-rows`, `ffx-blitz-ace-finisher`, `parity-ffx-engine-overdrive-result` (updated) | the same behaviours on frames: a press is seen by the next frame, the game's windows, orders, limits and casts; the one RC4 test that said a Fury with no casts plans nothing now says it casts once |
| `ffx-engine-golden` | ONE digest re-baselined, cause written in the file (section 5.2) |

### The whole suite, once, and the mutation pass

**The whole suite, once** (`D:\Tools\ffx-parity\rc9\ffx-overdrives\out\suite.log`; one run by the lane on the code tip `6f0e3834b`, `--maxWorkers=2`, started 15:32 EDT, 44 minutes 46 seconds, in the worktree without its paintings): **1,268 files, 19,626 tests: 19,319 passed, 183 failed, 123 skipped, 1 todo; 1,230 files passed, 15 skipped, 23 failed** (18 files with failed tests and 5 that could not load). **All 23 are art-only** (the same 22 files every RC lane's note lists, plus `ffxcam-load`, whose one failure is a stat of `public/art`, a folder that was listed and not there):

| Files | Tests | What is missing |
|---|---|---|
| `ui-portrait-face-crop` | 145 | a face-crop row measured against a painting on disk |
| `trema-ship-content` 4, `art-ref-defaults` 4, `pause-remake` 3, `chapters/isaaru-ship` 3, `chapters/den-of-woe-ship-content` 3, `chapter-meta-seymour-anima-macalania` 3, `chapter-meta-evrae` 3, `chapters/natus-ship-scene` 2, `chapters/natus-ship-content` 2, `chapters/leblanc-art` 2, `chapters/fallen-aeons-ship-content` 2, `chapter-meta-ffx2-leblanc` 2, `ffxcam-load` 1, `cutscene-story-poses` 1, `chapters/fallen-aeons-ship-scene` 1, `chapters/experiment-scene` 1, `chapters/den-of-woe-ship-scene` 1 | 38 | an ENOENT on `public/art/...`, an `existsSync` of a plate or a pause-card image |
| `party-face-manifest`, `chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta` | 5 files that failed to load | `public/art/manifest.json` or a sprite manifest |

**Proof that they are art-only** (`D:\Tools\ffx-parity\rc9\overdrives\art23-with-junction.log`): the 23 files re-run with `public/art` linked to the main tree's paintings: **21 pass.** The other two, `ui-portrait-face-crop` (26 tests) and `chapters/experiment-scene` (1 test), fail only on paintings that are not in the main tree's art folder at all (the `exp-leblanc-*` portraits and idle poses of the experimental chapter, the Lady Luck idle poses of the three girls, and the Experiment grounds plate: 13 distinct files, each an ENOENT, plus one plate): not in this lane's reach. No test about a minigame, an Overdrive, Fury, the key watcher or a golden failed. (The art junction the first pass made was malformed, so the earlier pictures were taken without paintings, section 7; it was recreated correctly for this check and removed at the end.)

**Mutation pass: 65 faults; the first run caught 54 and left 11 alive; after the tests it asked for, 61 are caught and 4 equivalent ones survive** (`D:\Tools\ffx-parity\rc9\overdrives\mutants.mjs` lists them and `mutate.mjs` runs them, the way the RC4 and RC7 lanes did: one exact-string change of the production code at a time, the lane's 20 test files run with `--bail=1`, a fault is CAUGHT when any test fails, the file is put back byte for byte after each run and again at the end; `git diff` is empty after the pass). Each fault puts one rule back the way it was, or breaks it the way a later edit could: the old estimates (Spiral Cut's 60-unit window, Energy Rain 2.6 s, Blitz Ace 2.2 s, the three old Bushido orders), a dropped reset, a wrong press tried as input 1, a swapped button, a limit frame one early, a bracket edge or a digit of the Fury table, Drain and Osmose on Fira's brackets, no halving of the digital counter, the 0xA0 dead-zone edge, the 0.5 s stall clock, the Aurochs pair counting, the held-key option off, and so on. The baseline of the same 20 files is 443 passed. **Second run:** the 11 survivors again, against the same 20 files plus the new `ffx-raw-input-edge-only`, with every failing file reported (no `--bail`). Two runner accidents are on record and were re-run clean: the first version of the new file's opt-in guard scanned all of `src/` and timed out at 15 s on a loaded machine, which made E05 look caught (the guard now scans `src/ui` and `src/app`, about 1 s, and E05 re-run: it survives); and S09's run ended in a runner error (non-zero exit, no failing test, 193 s on a saturated machine; the harness now counts a kill only when a test fails) and was run again alone: it survives.

| Fault | What it puts wrong | Caught by (the first failing test file) |
|---|---|---|
| | **Swordplay (Tidus)** | |
| S01 | Swordplay: Spiral Cut window back to the old 22 percent estimate (60 units, was 24) | parity-ffx-engine-minigames |
| S02 | Swordplay: Blitz Ace marker speed 13 (the game: 14) | parity-ffx-engine-minigames |
| S03 | Swordplay: Energy Rain limit back to 2.6 s (the game: 3.0) | parity-ffx-engine-minigames |
| S04 | Swordplay: Blitz Ace limit back to 2.2 s (the game: 2.0) | parity-ffx-engine-minigames |
| S05 | Swordplay: a miss no longer sends the marker back to the left end | parity-ffx-minigames |
| S06 | Swordplay: a press is judged on the marker after this frame's move, not as drawn | parity-ffx-minigames |
| S07 | Swordplay: a hit is graded with the timer before the frame's tick (A one frame too big) | parity-ffx-minigames |
| S08 | Swordplay: the right end reflects at the end itself, not past it | **survives**: equivalent: reflecting at the bar's end itself instead of past it changes only the velocity's sign at a frame start, and a press there resets the marker with its velocity made positive; 0 differences in 49,212 cases (every move, every press frame 1 to 100, 4,000 random scripts; `equiv-swordplay.cjs`) |
| S09 | Swordplay: the left end reflects at the end itself, not past it | **survives**: equivalent: the same argument at the left end |
| S10 | Swordplay: the limit frame is the frame that still sees the timer above 0 (one frame early) | parity-ffx-minigames |
| | **the shared timer and clock** | |
| T01 | Timer: 25 ticks a second (the PAL rate) instead of 30 | parity-ffx-minigames |
| T02 | Clock: a frame is due on the nearest frame, not once it has fully passed | parity-ffx-minigames |
| | **Bushido (Auron)** | |
| B01 | Bushido: Dragon Fang ends Circle, Cross (the old order) | parity-ffx-minigames |
| B02 | Bushido: Tornado opens with Cross (the old order) | parity-ffx-minigames |
| B03 | Bushido: Shooting Star inputs 2 and 7 are Circle and Cross (the old order) | parity-ffx-minigames |
| B04 | Bushido: Banishing Blade inputs 5 and 6 swapped | parity-ffx-minigames |
| B05 | Bushido: a wrong press does not send the progress back | ffx-overlay-input |
| B06 | Bushido: a wrong press is tried as the first input | parity-ffx-minigames |
| B07 | Bushido: Tornado limit 4 s (the game: 3) | parity-ffx-minigames |
| B08 | Bushido: the limit frame is one frame early | parity-ffx-minigames |
| B09 | Bushido: the whole word is not compared (any press that has a Circle bit counts) | parity-ffx-minigames |
| | **Fury tables (Lulu)** | |
| F01 | Fury table: the first bracket edge of Blizzard, Fire, Thunder and Water Fury is Magic 36 (the game: 35) | parity-ffx-minigames |
| F02 | Fury table: one digit of row 0 wrong | parity-ffx-minigames |
| F03 | Fury table: Drain and Osmose take Fira's brackets (they have their own) | parity-ffx-minigames |
| F04 | Fury table: a cast needs the counter to pass its threshold, not reach it | parity-ffx-minigames |
| F05 | Fury table: no free first cast (casts start at 0) | parity-ffx-minigames |
| F06 | Fury table: Magic 255 clamps to 254 (it is its own bracket) | parity-ffx-minigames |
| F07 | Fury table: Ultima's first bracket takes row 14 (the game: 13) | parity-ffx-minigames |
| | **Fury controller (Lulu)** | |
| C01 | Fury: a digital step is worth one rotation (no halving of the counter) | parity-ffx-minigames |
| C02 | Fury: the stall clock clears a half-finished pair after 0.6 s (the game: 0.5001) | parity-ffx-minigames |
| C03 | Fury: the analog dead-zone edge is 0x9F (the game: 0xA0) | parity-ffx-minigames |
| C04 | Fury: only the increasing run of quadrants is a rotation | parity-ffx-minigames |
| C05 | Fury: no second controller call after the extra pad poll | parity-ffx-minigames |
| C06 | Fury: the digital rotations count is steps, not pairs of steps | parity-ffx-minigames |
| C07 | Fury: both buttons in one reading set the left flag | parity-ffx-minigames |
| | **Wakka's reels** | |
| R01 | Reels: a pair of symbol 10 (Aurochs) counts as three | parity-ffx-minigames |
| R02 | Reels: a pair of Fire, Ice, Water or Thunder makes the all-enemies result | parity-ffx-minigames |
| R03 | Reels: Attack Reels count a two-hit symbol as one | parity-ffx-minigames |
| R04 | Reels wiring: the Aurochs shot at three symbols goes at one enemy | ffx-overdrive-menu-rows |
| R05 | Reels wiring: Water and Thunder symbol numbers swapped | ffx-overdrive-menu-rows |
| | **the engine seam and data** | |
| E01 | Seam: Blitz Ace's record id maps to Energy Rain's category | ffx-overdrive-inputs |
| E02 | Seam: every Swordplay limit is 3 s again | ffx-overdrive-inputs |
| E03 | Seam: the headless Fury roll reaches 16 rotations (the stand-in's range is 5 to 15) | parity-ffx-engine-minigames |
| E04 | Seam: casts from swept degrees round a rotation up instead of waiting for the whole turn | **survived the first run** (a gap: no test gave the engine a part-rotation angle (the headless roll does); now the test 'a part of a rotation buys nothing'); **caught by the added tests**: parity-ffx-engine-minigames |
| E05 | Seam: a spell that is none of the 19 is taken as Blizzard Fury, not Fire Fury | **survives**: equivalent: variants 0 to 3 (Blizzard, Fire, Thunder, Water Fury) are one spell group, so the default variant 0 or 1 gives the same row, thresholds and casts: 31,488 (variant, Magic, rotation) cells compared |
| E06 | Seam: a Fury with no rotation casts nothing (the game: at least once) | parity-ffx-engine-overdrive-result |
| E07 | Seam: the overlay is told a window 11 units too far left | parity-ffx-engine-minigames |
| E08 | Seam: every Fury limit is 3 s | parity-ffx-engine-minigames |
| E09 | Data: Bushido tokens: Cross and Circle names swapped (the overlay would show the wrong chips) | parity-ffx-engine-minigames |
| | **the overlays and the frame clock** | |
| U01 | Overlay: Swordplay takes a held key as repeated presses | **survived the first run** (equivalent in behaviour: Swordplay's press is Confirm, which the watcher never repeats, with or without the option; the option is set so the three overlays read presses alike, and the new `ffx-raw-input-edge-only` pins by text that it is set); **caught by the added tests**: ffx-raw-input-edge-only |
| U02 | Overlay: Bushido takes a held key as repeated presses | parity-ffx-engine-minigames |
| U03 | Overlay: Fury takes a held direction as repeated presses | **survived the first run** (a gap: the Fury tests held one side only, which sets one flag either way; now a test holds Left and Right with auto-repeat); **caught by the added tests**: ffx-raw-input-edge-only + parity-ffx-engine-minigames |
| U04 | Overlay: two buttons in one frame count as the last one (not one word that matches nothing) | **survived the first run** (a gap: no test pressed a wrong key and the right one inside one frame; now one does); **caught by the added tests**: parity-ffx-engine-minigames |
| U05 | Overlay: the overlay's confirm is Circle and cancel is Cross (swapped) | **survives**: equivalent: the overlay turns the sequence's tokens and the presses into pad words with the same table, so a one-to-one relabelling inside it cannot be seen (the published tokens, which E09 breaks, are caught) |
| U06 | Overlay: Fury gives the frame's presses to both controller calls (the old double count) | parity-ffx-engine-minigames |
| U07 | Overlay: Swordplay queues a press without letting the frames already due go by | ffx-overlay-input |
| U08 | Overlay: Swordplay's ring running out does not force the frame that ends the move | **survived the first run** (a gap in timing only: without the forced frame the move ends one frame (33 ms) after the ring reads 0, with the same result; now a test pins that the fail shows in the ring's own frame); **caught by the added tests**: parity-ffx-engine-minigames |
| U09 | Frame driver: runs one frame ahead of the clock | parity-ffx-engine-minigames |
| U10 | Frame driver: catchUp does nothing | ffx-bushido-wrong-press-reset |
| U11 | Overlay: Bushido's missed chip is never marked wrong | ffx-bushido-wrong-press-reset |
| U12 | Overlay: Swordplay result drops the controller frame | parity-ffx-engine-minigames |
| | **the input layer (`RawInputWatcher`, disclosed to the driver)** | |
| I01 | Input: edgeOnly no longer stops a held key's repeat on the keyboard | parity-ffx-engine-minigames |
| I02 | Input: edgeOnly no longer stops a held direction's repeat on a pad | **survived the first run** (a gap: nothing held a pad direction; now `ffx-raw-input-edge-only` holds a d-pad and a stick); **caught by the added tests**: ffx-raw-input-edge-only |
| I03 | Input: the edgeOnly option is ignored | parity-ffx-engine-minigames |
| I04 | Input: edgeOnly is on for every watcher (menus would stop repeating a held direction) | **survived the first run** (a gap: nothing showed a default watcher still repeats a held direction (menus); now `ffx-raw-input-edge-only` does, on the keyboard and a pad); **caught by the added tests**: ffx-raw-input-edge-only |

**The survivors.** The first run left 11 faults alive. **5 are equivalent** and stay alive on purpose, each with its reason in the table (S08 and S09 proved by brute force over 49,212 cases, E05 by comparing 31,488 cells, U05 and U01 by how the code is built); **6 were real gaps in the tests** (E04, U03, U04, U08, I02, I04) and are closed by the tests added in this lane: a part of a rotation buys nothing, a wrong key and the right one inside one frame make one wrong press, Left and Right held together make one step, the move ends in the ring's own frame, and the `edgeOnly` option on the keyboard and on a pad (a held d-pad, a held stick, a default watcher still repeating). Re-run against the extended set (`mutants2.mjs`, `mutation-results2.json`): 7 of the 11 first-run survivors are now caught (E04, I02, I04, U01, U03, U04, U08; U01 only by the textual guard that the three overlays set the option), and 4 still survive (E05, S08, S09, U05), all four equivalent. **Final count: 65 faults, 61 caught, 4 equivalent survivors.**

## 5. Measurement

Method: the shipped `intendedStrategy` plays each chapter's whole chain through the app's own path (the same wiring as `ffx-parity-measure.test.ts` and the goldens), every minigame auto-resolved by the engine's stand-in, seeds 1 to 12 on every FFX chapter and seeds 1 to 500 on the seven chapters whose shipped line fires one of these Overdrives (I Seymour Flux: Dragon Fang; II Yunalesca: Shooting Star, Spiral Cut; III Braska's Final Aeon: Shooting Star, Energy Rain; VII Anima: Spiral Cut, Banishing Blade; VIII Evrae: Spiral Cut; XVII Sin the Fins and the Core: Spiral Cut, Fire Fury, Dragon Fang; XVIII Sin the Face: Dragon Fang). The other four (IX Yojimbo, X Natus, XII Omnis, XIV Isaaru) fire none (Grand Summon only) and are identical at 12 seeds. **Before is `origin/r49-rc` itself, measured in this worktree before any source was changed** (no repo copy was made); **after is the tip.** The same scratch test played both sides and kept, per seed, the outcome, the party and engine turns, the party KOs and a digest of the whole event log; raw files are in the lane's scratch folder. Nothing was tuned.

### 5.1 Seeds 1 to 12, every FFX chapter

Wins before and after are the same on every chapter. The whole-chain event log (every field) is byte for byte the base's on 9 of the 11 chapters; it moves on Chapter III (3 of 12 seeds: 1, 2, 4) and Chapter XVII (9 of 12), and nowhere else.

| Chapter | wins (12) | party turns | party KOs | seeds whose log moved |
|---|---|---|---|---|
| I Seymour Flux | 12 / 12 to 12 / 12 | 53.33 to 53.33 | 1.08 to 1.08 | 0 |
| II Yunalesca | 12 to 12 | 148.5 to 148.5 | 12 to 12 | 0 |
| III Braska's Final Aeon | 11 to 11 | 240.08 to 240.08 | 5.5 to 5.5 | **3** |
| VII Seymour and Anima | 12 to 12 | 54.17 to 54.17 | 4.75 to 4.75 | 0 |
| VIII Evrae | 12 to 12 | 70.92 to 70.92 | 0.67 to 0.67 | 0 |
| IX Yojimbo | 11 to 11 | 65.25 to 65.25 | 3.58 to 3.58 | 0 |
| X Seymour Natus | 11 to 11 | 35 to 35 | 2.42 to 2.42 | 0 |
| XII Seymour Omnis | 11 to 11 | 91.5 to 91.5 | 0.75 to 0.75 | 0 |
| XIV Isaaru | 11 to 11 | 37.58 to 37.58 | 3 to 3 | 0 |
| XVII Sin: the Fins and the Core | 11 to 11 | 310 to 311.58 | 1.67 to 2.25 | **9** |
| XVIII Sin: the Face | 12 to 12 | 45.5 to 45.5 | 0 to 0 | 0 |

### 5.2 Seeds 1 to 500, the seven chapters whose line fires these Overdrives

| Chapter (Overdrives the line fires, uses in 500 seeds) | wins | party turns | engine turns | party KOs | seeds whose log moved | outcome of any seed changed |
|---|---|---|---|---|---|---|
| I Flux (Dragon Fang 107) | 500 to 500 | 51.96 to 51.96 | 70.76 to 70.76 | 0.92 to 0.92 | 0 | 0 |
| II Yunalesca (Shooting Star 1,116, Spiral Cut 419) | 453 to 453 | 157.66 to 157.66 | 223.97 to 223.97 | 13.59 to 13.59 | 0 | 0 |
| III Braska (Shooting Star 1,070, **Energy Rain 1,490**) | 479 to 479 | 232.13 to 232.13 | 373.04 to 373.04 | 5.37 to 5.37 | **227** | **0** |
| VII Anima (Spiral Cut 326, Banishing Blade 44, Dragon Fang 5) | 470 to 470 | 54.68 to 54.68 | 86.72 to 86.72 | 4.75 to 4.75 | 0 | 0 |
| VIII Evrae (Spiral Cut 281) | 488 to 488 | 71.03 to 71.03 | 89.79 to 89.79 | 0.73 to 0.73 | 0 | 0 |
| XVII Sin: Fins and Core (Spiral Cut 1,117, **Fire Fury 451**, Dragon Fang 649) | **437 to 433** | 296.40 to 294.15 | 382.86 to 380.14 | 2.99 to 2.82 | **364** | **28** (16 won to lost, 12 lost to won) |
| XVIII Sin: the Face (Dragon Fang 500) | 500 to 500 | 45.27 to 45.27 | 50.27 to 50.27 | 0 to 0 | 0 | 0 |

### 5.3 Causes, by ablation (not by reading)

- **Chapter III (227 of 500 logs move, no outcome, no turn count).** Energy Rain's limit. The shipped line rolls Tidus's Swordplay from a stand-in: one draw for the 75 percent test and, on a success, one `aux.int(0, limit)` for the time left. The draws are the same and in the same order; the second is read against 3000 instead of 2600, so the timing bonus differs by a point or two. Ablation: with Energy Rain's limit put back to 2.6 s in the kernel table, seeds 1 to 100 of Chapter III equal the base's digests, 100 of 100.
- **Chapter XVII (364 of 500 logs move; wins 437 to 433).** Fire Fury's casts: Lulu's Fury is the only call that reads the new table on this line (Spiral Cut and Dragon Fang keep their limits, draws and windows). The stand-in rolls 5 to 15 rotations and the game's table buys a few casts more or fewer than the old interpolation depending on her Magic, so fights go a little differently: 16 seeds that were won are lost and 12 that were lost are won (net four seeds, 0.8 percent of 500; party turns 296.4 to 294.2, party KOs 2.99 to 2.82). Ablation: with the old Fury model put back, seeds 1 to 100 equal the base's digests, 100 of 100. (Not a balance change by choice: the game's table, as the plan asked; reported as the brief asks for a chapter that moves.)
- **The five other chapters** are byte for byte the base's at 500 seeds (Dragon Fang, Spiral Cut, Shooting Star and Banishing Blade keep their limits, their draws and their windows in the stand-in).
- `ffx-engine-golden`: one digest, Braska seed 1 link 4, moves (the same cause as the first bullet); `ffx2-atb-golden` and `ff7-golden` are unchanged.

## 6. What a player meets, in numbers

**Swordplay: how often a press lands, before and after.** A press whose timing is off by a random amount around the best moment (a standard deviation of 15, 30 or 50 ms), the first press of a move. Before: the smooth marker and the estimated zones (closed form: half the zone in time against the error). After: the game's controller, 200,000 simulated presses each (`tests` kernels, scratch Monte Carlo); the real-key play-through of section 7 agrees within sampling.

| Move | zone in time before / after | error 15 ms | error 30 ms | error 50 ms |
|---|---|---|---|---|
| Spiral Cut | 308 ms / 2 frames (67 ms) | 100 % to 97 % | 100 % to 73 % | 99.8 % to 50 % |
| Slice and Dice | 184 ms / 2 frames | 100 % to 97 % | 99.8 % to 73 % | 93 % to 50 % |
| Energy Rain | 108 ms / 2 frames | 100 % to 97 % | 93 % to 73 % | 72 % to 49 % |
| Blitz Ace | 63 ms / 1 frame (33 ms) | 96 % to 73 % | 71 % to 42 % | 47 % to 26 % |

(The window is 2 frames for the first three moves and 1 frame for Blitz Ace because the marker moves 11, 12, 13 and 14 units a frame against windows of 24, 20, 20 and 18: Spiral Cut hits in frames 13 and 14, 38 and 39, 63 and 64, 88 and 89; Slice and Dice 12 and 13, 35 and 36, 58 and 59, 81 and 82; Energy Rain 11 and 12, 32 and 33, 54, 75; Blitz Ace 11, 30 and 31, 50.)

**Fury: casts at a keyboard pace, now and before, for the same key presses** (Left and Right in turn, 4 seconds; "before" is the engine's old model, 180 degrees a press; "now" is the overlay's rule on the game's table; the dial now starts at 1, not 0, because a Fury always casts once):

| Spell, Magic | pairs a second | presses | steps | casts now | casts before |
|---|---:|---:|---:|---:|---:|
| Fire Fury, Magic 40 | 2 | 16 | 7 | 4 | 4 |
| | 3 | 23 | 7 | 4 | 6 |
| | 4 | 31 | 14 | 6 | 8 |
| | 5 | 39 | 15 | 6 | 10 |
| | 6 | 46 | 21 | 7 | 12 |
| Fire Fury, Magic 128 | 2 | 16 | 7 | 4 | 6 |
| | 4 | 31 | 14 | 8 | 12 |
| | 6 | 46 | 21 | 9 | 16 |
| Firaga Fury, Magic 60 | 4 | 31 | 14 | 4 | 7 |
| | 6 | 46 | 21 | 5 | 11 |
| Flare Fury, Magic 128 | 4 | 31 | 14 | 3 | 6 |
| Ultima Fury, Magic 128 | 4 | 31 | 14 | 3 | 4 |

The keyboard is the game's digital fallback: a step needs a press on each side, and the half-second stall clock drops a half-finished pair, so the steps are fewer than half the presses at a slow pace (7 of 16). The game's own anchors are untouched: 15 turns of the stick at Magic 0, 128 and 255 give Fire Fury 7, 12 and 16, the -ga spells 6, 10 and 12, Flare 4, 6 and 7, Ultima 4, 4 and 4; between them the casts are the game's (Fire Fury at Magic 90 after 5, 10, 15 and 20 turns: 5, 8, 10, 13; the estimate gave 3, 6, 9, 13).

## 7. Pictures and the play-through

**Pictures** (`docs/screenshots/rc9-overdrives/`, 44 PNGs, 21 MB, each under 2 MB; before is `origin/r49-rc` (`f939b87f`) and after is this branch; headless Chromium from node with the real GPU, never the browser pane; `?coach=off`, seed 1, real key presses on the menus; commit `a6e4c109c`):

| Subject | 1600x900 before | 1600x900 after | 390x844 before | 390x844 after |
|---|---|---|---|---|
| swordplay-spiral-cut | `swordplay-spiral-cut-before-1600x900.png` (1815 KB) | `swordplay-spiral-cut-after-1600x900.png` (1814 KB) | `swordplay-spiral-cut-before-390x844.png` (259 KB) | `swordplay-spiral-cut-after-390x844.png` (258 KB) |
| swordplay-slice-and-dice | `swordplay-slice-and-dice-before-1600x900-crop.png` (227 KB) | `swordplay-slice-and-dice-after-1600x900-crop.png` (227 KB) | `swordplay-slice-and-dice-before-390x844.png` (260 KB) | `swordplay-slice-and-dice-after-390x844.png` (259 KB) |
| swordplay-energy-rain | `swordplay-energy-rain-before-1600x900-crop.png` (227 KB) | `swordplay-energy-rain-after-1600x900-crop.png` (227 KB) | `swordplay-energy-rain-before-390x844.png` (260 KB) | `swordplay-energy-rain-after-390x844.png` (260 KB) |
| swordplay-blitz-ace | `swordplay-blitz-ace-before-1600x900-crop.png` (228 KB) | `swordplay-blitz-ace-after-1600x900-crop.png` (233 KB) | `swordplay-blitz-ace-before-390x844.png` (258 KB) | `swordplay-blitz-ace-after-390x844.png` (259 KB) |
| bushido-dragon-fang | `bushido-dragon-fang-before-1600x900.png` (1811 KB) | `bushido-dragon-fang-after-1600x900.png` (1813 KB) | `bushido-dragon-fang-before-390x844.png` (228 KB) | `bushido-dragon-fang-after-390x844.png` (228 KB) |
| bushido-shooting-star | `bushido-shooting-star-before-1600x900-crop.png` (233 KB) | `bushido-shooting-star-after-1600x900-crop.png` (231 KB) | `bushido-shooting-star-before-390x844.png` (228 KB) | `bushido-shooting-star-after-390x844.png` (228 KB) |
| bushido-banishing-blade | `bushido-banishing-blade-before-1600x900-crop.png` (231 KB) | `bushido-banishing-blade-after-1600x900-crop.png` (231 KB) | `bushido-banishing-blade-before-390x844.png` (228 KB) | `bushido-banishing-blade-after-390x844.png` (227 KB) |
| bushido-tornado | `bushido-tornado-before-1600x900-crop.png` (235 KB) | `bushido-tornado-after-1600x900-crop.png` (235 KB) | `bushido-tornado-before-390x844.png` (227 KB) | `bushido-tornado-after-390x844.png` (228 KB) |
| fury-fire | `fury-fire-before-1600x900.png` (1746 KB) | `fury-fire-after-1600x900.png` (1747 KB) | `fury-fire-before-390x844.png` (238 KB) | `fury-fire-after-390x844.png` (237 KB) |
| fury-fire-16presses | `fury-fire-16presses-before-1600x900-crop.png` (336 KB) | `fury-fire-16presses-after-1600x900-crop.png` (334 KB) | `fury-fire-16presses-before-390x844.png` (236 KB) | `fury-fire-16presses-after-390x844.png` (236 KB) |

`compare-bushido-1600x900.png` (459 KB), `compare-fury-1600x900.png` (322 KB), `compare-phone-390x844.png` (352 KB), `compare-swordplay-1600x900.png` (464 KB)

- **The four Bushido sequences, the Swordplay zones and the Fury dial, side by side:** the three `compare-*-1600x900.png` sheets (before left, after right; the Fury sheet shows the opening and the dial after sixteen presses) and `compare-phone-390x844.png` (the phone layout, the slab of every subject, before left and after right). The sheets' headers say `origin/r49-rc`; the first set said "the live build", which was not established, so the sheets were regenerated from the same frames with only the label changed (the panels are pixel-identical to the first set).
- **What they show.** The Swordplay zone is the game's narrower window (Spiral Cut about 9 percent of the bar, was 22). The four Bushido show the exe's orders (Dragon Fang ends Enter, Esc; Shooting Star Q, Enter, K, Esc, left, right, Esc; Tornado starts Esc; Banishing Blade unchanged). The Fury dial starts at 1; after the same sixteen presses it reads 4 where it read 6. The slab, the chips, the ring and the words are the same.
- **One caveat about the scenes.** The lane's worktree has no `public/art` (the paintings are gitignored and live on the main tree's disk) and the junction made for the first capture was malformed (it pointed at `D:\D:\Final Fantasy\public\art`), so the dev server answered every painting with its index page: **the deck, the party and Sin behind each slab are the engine's procedural stand-ins, in the before and the after frames alike**. The slab, the bar, the chips, the ring and the dial are HTML and CSS and are identical with the paintings. The junction is valid now and was removed at the end; the frames were not retaken (the before frames need `origin/r49-rc`'s source, which cannot be checked out in this shared tree), and nothing they are for depends on the scene.
- **How each state was reached.** Chapter XVII (Sin: the Fins and the Core), seed 1, by real key presses on the menus: Orders then Close in (Sin within reach), Defend (Q) for the turns in between, Overdrive then the move, Switch to Lulu for Fury. **Set by hand:** every party member's gauge set to 100 at a menu so the next menu offers the Overdrive row, and the preset's lists of moves widened (Tidus's by Blitz Ace, Auron's by Banishing Blade and Tornado, the preset gives Tidus three and Auron two) so each move could be pictured; the moves the preset already offers were framed before without the widening and after with it, and the overlay is the same either way. Each frame was taken a moment after its overlay opened, so the ring and the marker differ from pair to pair. At 1600x900 the full frame is kept for one subject of each family (Spiral Cut, Dragon Fang, Fury); the others are a crop around the overlay's slab (`-crop`, the same pixels); at 390x844 every frame is the whole screen (a mobile emulation, which puts the HUD on its phone layout).
- **Builds.** Before: this worktree at `f939b87f` (`origin/r49-rc`) with its source unchanged, a Vite dev server on port 5199 started for this lane (its PID checked: an early set was taken against a server on that port that was not this lane's and was thrown away; every frame here was retaken). After: the branch tip's source on the same server. The server was stopped by its PID at the end.

**Play-through, real key presses** (headless Chromium, keys sent by the browser's own input channel, the overlays opened with the engine's own request params; `playthrough.mjs`, 20 tries a set, the bot's own press error measured: mean 4 ms, standard deviation 4 ms):

| Swordplay, the first press aimed at the best moment, plus a random error | 15 ms | 30 ms | 50 ms |
|---|---:|---:|---:|
| Spiral Cut | 20 / 20 | 15 / 20 | 10 / 20 |
| Slice and Dice | 20 / 20 | 13 / 20 | 8 / 20 |
| Energy Rain | 19 / 20 | 13 / 20 | 14 / 20 |
| Blitz Ace | 15 / 20 | 8 / 20 | 7 / 20 |

The Monte Carlo of section 6 gives 97 / 73 / 50 percent for the first three and 73 / 42 / 26 for Blitz Ace: the play-through agrees within twenty tries. **On the base (`origin/r49-rc`)** the same bot's first run was taken while the machine was loaded (its presses landed up to 700 ms late in some sets) and is not used; the 'before' numbers in section 6 are the closed form for its estimated zones.

| Bushido, the sequence typed with the keys the chips name | clean, 110 ms between inputs | clean, 220 ms | a slip (a wrong key, then the sequence again from the start), 160 ms |
|---|---:|---:|---:|
| Dragon Fang (8) | 19 / 20 | 20 / 20 | 19 / 20 |
| Shooting Star (7) | 18 / 20 | 19 / 20 | 20 / 20 |
| Banishing Blade (7) | 19 / 20 | 20 / 20 | 20 / 20 |
| Tornado (6) | 20 / 20 | 20 / 20 | 19 / 20 |

The failures are the bot's hiccups: two key presses landing inside one thirtieth of a second are one word that matches nothing, which the game counts as a wrong press by design. (An earlier run whose bot did not restart after a slip is not used.)

| Fury, Left and Right in turn for 4 seconds (8 tries each) | 2 pairs a second | 3 | 4 | 5 |
|---|---|---|---|---|
| Fire Fury, Magic 40 | 4, 4, 4, 3, 4, 4, 4, 4 | 4 in all 8 | 5, 6, 6, 6, 5, 5, 5, 5 | 6, 6, 6, 6, 6, 5, 6, 6 |
| Fire Fury, Magic 128 | 4 in all 8 | 4, 5, 4, 4, 4, 4, 5, 5 | 7, 7, 7, 7, 7, 7, 8, 7 | 7, 8, 5, 8, 7, 8, 5, 9 |
| Flare Fury, Magic 128 | 2 in all 8 | 2 in all 8 | 3, 3, 3, 1, 3, 3, 2, 2 | 2, 3, 3, 2, 3, 3, 3, 3 |

(casts reached; the simulation of section 6 gives 4, 4, 6, 6 for the first row and 4, 4, 8, 8 for the second, the same within a cast; the one Flare run that reached 1 cast is a hiccup of the bot.)

**Held keys, real auto-repeat events** (`D:\Tools\ffx-parity\rc9\overdrives\held-keys.mjs`, headless Chromium, the overlays opened with the engine's own params, a key sent down again while it is already down, which Chromium delivers as a keydown with `repeat: true`; timed on the overlay's own clock): **Bushido** (Dragon Fang: Down held, then Left pressed; Banishing Blade: Up held, then L1 pressed): each time 8 key-downs reached the page, 1 real press and 7 auto-repeats; after the hold exactly **1 chip** was done (the old reading counted each repeat as a wrong press that reset the run) and after the next real press **2**, as expected. **Fury** (Fire Fury at Magic 128 and at Magic 40): Left and Right both held, each time 10 key-downs, 2 real presses and 8 auto-repeats; the dial read **1 cast** after the hold (a stream of steps would have read 3 or more) and **2 casts** after one real pair, as expected. All four runs matched and the page raised no error other than the dev server's hot-reload socket, which the harness stubs.

## 8. Disclosures, in player words (what the release should say, and what it should admit)

**FFX only**

- **Tidus's Swordplay is harder, as the game's is.** The gold zone on the bar is much narrower: Spiral Cut's is about 9 percent of the bar (it was 22), Slice and Dice's and Energy Rain's about 7 percent (16 and 12 before) and Blitz Ace's 6.5 percent (9 before). The marker no longer slides smoothly: it moves a whole step thirty times a second, faster for the stronger moves, and a press is judged on the marker as it is drawn. A press outside the zone sends the marker back to the left and the timer keeps running, as before. This is a clear difficulty step; the numbers a player sees are in section 6.
- **Energy Rain gives 3 seconds and Blitz Ace 2** (they gave 2.6 and 2.2).
- **Three of Auron's four button orders changed to the game's.** Dragon Fang now ends Cross, Circle (it ended Circle, Cross); Shooting Star is Triangle, Cross, Square, Circle, Left, Right, Circle (it was Triangle, Circle, Square, Circle, Left, Right, Cross); Tornado now starts with Circle (it started with Cross). Banishing Blade is as it was. Two buttons pressed inside the same thirtieth of a second count as one wrong press.
- **Lulu's Fury follows the game's table, and on a keyboard it is clearly stingier.** How many turns of the stick a cast costs is the game's own list for each group of spells and each Magic bracket, a Fury always casts at least once, and Drain and Osmose Fury have their own brackets. On a keyboard or a d-pad a Left press and a Right press make a step and two steps are a turn, so four presses (two pairs) are one turn where two presses were. The game counts a press only when the key goes down (holding does nothing), a press on the same side twice does nothing, and it forgets a half-finished pair every half second. **For the same key presses a keyboard Fury casts the same or fewer times than before, about half as many at a brisk pace** (Fire Fury at Magic 40, 4 pairs a second for 4 seconds, 31 presses: 6 casts, it was 8; at Magic 128: 8, it was 12; 6 pairs a second at Magic 128: 9, it was 16). The three points the old model matched, 15 turns at Magic 0, 128 and 255, are unchanged (Fire Fury 7, 12 and 16); what changed is how many presses a turn takes. Section 6 has the table.
- **Wakka's Aurochs Reels:** a pair of Aurochs symbols is now a Power Shot at one enemy, not the Aurochs Shot at one enemy. Three still fire it at every enemy.
- **Held keys count once, in all three overlays.** A held arrow no longer feeds Bushido or Fury a stream of presses (in Bushido each repeat of a held arrow used to be a wrong press that sent the run back to the first input). A step or an input needs a key that goes down again. This is the one change to the shared key watcher (section 3b), opt-in and used only by these three overlays.
- **What does NOT change:** the look of the three screens; no chapter's wins; no boss or party number. The shipped line plays Tidus's and Auron's Overdrives through a stand-in (`rollDefaultMinigame`), so a fight's numbers move only where a limit or the Fury table is read: Chapter III (Energy Rain) and Chapter XVII (Fire Fury); section 5.
- **Unverified, kept as the engine's reading (said so in the notes):** a battle runs the minigames at 30 frames a second (read on the title screen, not in a battle: `FFX-G01` open question 9); the x87 precision of the damage scale is 53 bits (open question 11); Wakka's four lines a spin, the time he passes and the symbol called Miss are unread, so the Attack Reels rule and the reel overlay are unchanged.

## 9. CHANGELOG paragraph (for the main session to paste; `CHANGELOG.md` is not edited here)

**FFX only.** The three Overdrive minigames now run the game's own controllers. Tidus's Swordplay moves its marker in whole steps thirty times a second, faster for the stronger moves, and the gold zone is the game's narrower one (about 9 percent of the bar for Spiral Cut instead of 22, 7 percent for Slice and Dice and Energy Rain, 6.5 for Blitz Ace); a press is judged on the marker as it is drawn, a miss still sends it back to the left, and Energy Rain now gives 3 seconds and Blitz Ace 2 (they gave 2.6 and 2.2). In all three screens a key that is held down counts once, as the game reads a button as newly pressed (a held arrow used to feed Bushido and Fury a stream of presses). Three of Auron's four Bushido button orders are the game's: Dragon Fang ends Cross, Circle; Shooting Star is Triangle, Cross, Square, Circle, Left, Right, Circle; Tornado starts with Circle (Banishing Blade is as before), and two buttons pressed in the same instant count as one wrong press. Lulu's Fury casts from the game's table for each spell and her Magic, and always at least once; on a keyboard or a d-pad a Left press and a Right press make a step and two steps are a turn, and a half-finished pair is forgotten after half a second, so for the same key presses a keyboard Fury casts the same or fewer times than before (about half as many at a brisk pace); the three points the old model matched (15 turns at Magic 0, 128 and 255) are unchanged. A pair of Aurochs symbols on Wakka's Aurochs Reels is now a Power Shot. No boss number and no party number changed; Chapter III (Energy Rain) and Chapter XVII (Fire Fury) are the only fights that go differently, and Chapter XVII's chain is won 433 times in 500 where it was 437.

## 10. Open items

1. **Keys.** The overlay keeps its own keys and glyphs (section 3). If the game's keys are wanted (Circle on Enter or C, Cross on Backspace or X, Triangle V, Square Z, L1 S, R1 D), it is a screen and input choice for the driver (decision 1).
2. **The doubled pad word.** The live pressed word is the bit in both 16-bit halves while the controller was proven on single-bit words; one look at a running Bushido (the controller's read of the word) settles it. It changes none of these rules.
3. **Wakka's reels stay as they are** apart from the Aurochs pair: four lines of three symbols a spin, the time and start time the script passes, and the Miss symbol (`FFX-G01` open questions 1 to 3) need the Atel script (G06 territory). `reel-line.ts` is proven for every line and wired for the eight symbols whose number the command table fixes.
4. **Damage lane (FFX-B).** `TimingResult.frame` and `SequenceResult.frame` exist so B3 can build A and B in float32 seconds (about 1 percent of (instant, damage) pairs differ by a point today); B4 (which hits of Blitz Ace and Bushido the factor reaches) still waits for where those controllers start in the animation.
5. **No gamepad stick.** The analog Fury controller is proven (quadrants, the dead zone, the cyclic run) and the overlay takes only the digital rule. A stick would turn the dial by quadrants: a new input, left to the driver.
6. **Stale text, not rewritten:** `research/ffx-combat-core.md` sections 5.3 and 5.7 (the zone, crossing and Fury interpolation estimates) and `research/ffx-overdrive-input-rules-2026-09-30.md` (D3, the Bushido order, Q3 and the Swordplay numbers) still describe the estimates; the CONTRACT entry and this note carry the facts.
7. **The Fury caption always reads "FIRA"** (`LuluFury.ts` reads `spellName`, which nothing supplies): existing, unchanged, and a visible text, so it is listed for the driver (decision 3).
8. The `+NN%` readout under the Swordplay and Bushido ring still follows the ring's real time (it is `A / (2 B)` of the clock, close to the game's factor but not frame-stepped); a screen detail, unchanged.
9. **Bailey plays each Swordplay tier and Fury once (feel).** The plan asks for it; the numbers in section 6 say what to expect (a clear difficulty step in Swordplay, a stingier keyboard Fury), and the pictures cannot say how it feels.
10. **The 30 frames a second is read, not measured in a battle** (`FFX-G01` open question 9): the stepper assumes 30; a live look at a battle's frame rate settles it, and the kernel already carries the 25 of the other languages (proof only).
11. **The pictures were taken without the paintings** (section 7): the scene behind each slab is the engine's stand-in. A retake with the paintings needs the working junction (section 13), this branch on one dev server and `origin/r49-rc`'s source on another (an exported copy of the base `src`, since a shared tree cannot check it out), and `capture.mjs`, which needed five runs the first time because a battle can stall between two menus; the slabs, which are what the pictures are for, are unaffected.
12. **Wakka's reels still use the engine's stand-in in the headless line**, which is why no shipped chapter measures them; the Aurochs pair is covered by unit tests only.

## 11. Findings now wired, and findings still only decompiled (the three states)

| Finding (`FFX-G01`) | Decompiled | Wired (this branch) | Live |
|---|---|---|---|
| limits 3 / 3 / 3 / 2 s and 4 / 4 / 4 / 3 s, Fury 4 s | yes | yes | not yet (not merged) |
| Swordplay controller, window, speed, miss rule | yes | yes | not yet |
| Bushido controller and the four orders | yes | yes | not yet |
| Fury tables, at-least-one cast, digital rule | yes | yes | not yet |
| Fury analog stick (quadrants and rotations) | yes | kernel only | not yet |
| Wakka's reel line classifier | yes | the eight named symbols | not yet |
| Wakka's four lines, time floats, Miss | no (Atel script unread) | no | no |
| the timing factor from frames (B3), which hits it reaches (B4) | yes (the arithmetic), the animation start no | seam only (`frame`) | no |

## 12. Decisions for Bailey

1. **Keys behind the Bushido and Swordplay glyphs.** The game's PC keys are Enter or C for Circle and Backspace or X for Cross; the overlay prints Enter for Cross and Esc for Circle. Keep ours (recommended: the chips name the keys, so the order a player types is the game's whatever the keys) or mirror the game's (a screen and input change)?
2. **The stepped marker.** The marker now moves in visible steps (the game's 30 frames a second) and what is drawn is what is judged. Smoothing it on screen would show a marker up to a step away from the one the press is judged on (a step is 4 percent of the bar and the window 6.5 to 8.7). Recommendation: keep it stepped.
3. **The Fury caption** ("FIRA" for every spell) and a hint line for the digital rule ("a left and a right press are a step; two steps a turn"): both are visible text. Recommendation: pass the ability's name as the caption; leave the instruction line as it is.
4. **A gamepad stick for Fury** (a new input): wire the proven analog controller to the stick, or keep the digital rule only?
5. **Is a keyboard session's Fury the digital rule?** The table in section 6 shows how much stingier it is than the estimate. Q2 was decided for the digital rule; whether a keyboard-only Steam session counts as an analog pad (then the quadrant rule, which the kernel has) or as no pad is unread (`0x00638E30`, `0x00C58EF0`). A live look at Lulu's Fury on the keyboard settles it; until then keep the digital rule (recommended: it is what the note proved), or soften it for the keyboard?
6. **Which of the next lanes goes first:** FFX-B3 (the exact timing factor from the frame) is ready to take the `frame` field; B4 needs the animation script.
7. **For the release driver (not a game choice): review the input-layer change** (section 3b): one opt-in option of `RawInputWatcher`, used only by the three overlays, with a test that fails if any other caller adopts it. Recommendation: accept it as is; the alternative (a per-overlay filter that drops `e.repeat` and a pad direction held across polls) would duplicate the watcher's logic in three places.

## 13. Re-run

From the worktree root, Git Bash, tools by path, `TEMP` and `TMP` on `D:`:

```
export TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx-minigames.test.ts tests/unit/parity-ffx-engine-minigames.test.ts tests/unit/parity-ffx-frame-driver.test.ts tests/unit/ffx-raw-input-edge-only.test.ts tests/unit/ffx-swordplay-miss-restart.test.ts tests/unit/ffx-bushido-wrong-press-reset.test.ts tests/unit/ffx-overlay-input.test.ts tests/unit/ffx-overdrive-inputs.test.ts tests/unit/ui-ffx-minigames.test.ts tests/unit/ffx-formulas.test.ts tests/unit/ffx-engine.test.ts tests/unit/ffx-bushido-fail-bonus.test.ts tests/unit/ffx-bushido-immune-rows.test.ts tests/unit/ffx-bushido-fail-no-rider.test.ts tests/unit/ffx-blitz-ace-finisher.test.ts tests/unit/parity-ffx-engine-overdrive-result.test.ts tests/unit/parity-ffx-overdrive-result.test.ts tests/unit/parity-ffx-overdrive.test.ts tests/unit/ffx-overdrive-fail-rows.test.ts tests/unit/ffx-overdrive-menu-rows.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
node tools/orphans.mjs
```

The mutation pass is `node D:/Tools/ffx-parity/rc9/overdrives/mutate.mjs <worktree> D:/Tools/ffx-parity/rc9/overdrives/mutants.mjs <out.json>` from any directory (`CHECK=1` only validates the fault strings; it needs the same environment variables, and it writes every file back byte for byte). The paintings, when a test or a picture needs them, are one junction away: `cmd /c mklink /J public\art "D:\Final Fantasy\public\art"` in the worktree (from PowerShell or cmd, not Git Bash, which rewrites the path), and `cmd /c rmdir public\art` to remove it (never `Remove-Item -Recurse`, which follows the junction); never `git add` it.

The vectors are regenerated from the game's code by the lane's `gen_vectors.py` (in the scratch folder, not committed: it needs the private harness and the exe copy; run with the harness venv, `python -I gen_vectors.py <out> swordplay bushido fury reel`). The before and after measurement is the same scratch test run on the base tree and on the tip with `PYREFLY_CENSUS_SEEDS=1-500` and the seven chapters in `PYREFLY_CENSUS_CHAPTERS`. The pictures and the play-through are the lane's `capture.mjs` and `playthrough.mjs` (headless Chromium from node, a Vite dev server on port 5199, real key presses). The held-key check is `node D:/Tools/ffx-parity/rc9/overdrives/held-keys.mjs --url=http://127.0.0.1:5199/` with the server up (`node "D:/Final Fantasy/node_modules/vite/bin/vite.js" --port 5199 --strictPort --host 127.0.0.1` from the worktree, stopped by its PID afterwards: `Get-NetTCPConnection -LocalPort 5199 -State Listen`, then `taskkill /PID <pid> /T /F`).
