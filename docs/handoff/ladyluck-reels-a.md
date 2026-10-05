# ladyluck-reels-a: Lady Luck's reels, timed by the press (Bailey's pick A, "the slow strip")

**Branch:** `ladyluck-reels-a` (from `origin/r381-lady-luck` c0be1147; pushed, **never merged into main, never deployed**).
**Game case: FFX-2 only.** Lady Luck is an X-2 dressphere and her reels share no rule with Wakka's Slots; nothing under
`src/battle/ffx`, `src/data/ffx`, `src/ui/ffx` or the FFX HUD changed. **critic-plan class** (`node tools/critic-plan.mjs --paths` on
the seven shipped files): DEEP, a focused review before deploy and the deep review on the live build afterwards (FFX-2 ATB engine,
FFX-2 HUD); **not the save-data class** (no `SaveData.ts`, schema, migration or setting).

**The decision.** Bailey, 2026-10-04 about 23:58 EDT, verbatim: "I'll go with pick A, the slow strip." Option A of the options page
(https://claude.ai/artifact/MyzvY8f4Lj4oyYiN3D1uva, source `critic/scratch/ladyluck-reels-1004/index.html`) is an explicit yes for
building it (AGENTS.md rule 10). The approved target is that page's option A and its in-game frame
(`critic/scratch/ladyluck-reels-1004/img/game-a.jpg`); `docs/screenshots/ladyluck-a/target-above-build-1600x900.jpg` has the target
above the build's frame of the same moment. The driver records the decision itself (`decisions.json` and the ledgers are not touched here).

## The rule, and what is ours

> The symbol dead centre on the gold line at the instant of the press is the result.

Each of the three reels is a strip of its six symbols in a fixed order (the data's order, `src/data/ffx2/reels.ts`, the same on every
reel), running at a constant rate and scrolling downward. A press stops **the reel the pink arrow marks**, on the symbol on the line at
that instant; the strip eases the last fraction of a symbol onto it. The engine's pay table, the Dud and the stop-order marker are as
they were.

| What | Value | Where it comes from |
|---|---|---|
| Three reels, six symbols a reel (Red 7, BAR, Cherry and Sword/Helmet/Paw or Skull/Hat/Staff), a random stop order, one press per reel, the pay table, the Dud (75 % of every ally's current HP) | unchanged | sourced: `research/ffx2-combat-core.md` 3.12 (two sources), `research/visual-bible.md` 4.10.2 |
| **Reel speed** | **5 symbols a second (200 ms a symbol)** | **OUR ESTIMATE.** No source gives Lady Luck's reels a rate. Bailey picked it as option A. `REEL_RATE` in `src/ui/ffx2/ladyLuckTiming.ts` |
| **Safety timer** | **12 s: when it runs out the remaining reels stop where they are** | **OUR ESTIMATE.** No source gives these reels a timer (the old overlay's own default was 20 s). `REEL_TIMER_MS` |
| Snap | 0.15 s ease-out onto the symbol | the options page; the visual bible says 0.18 s. `REEL_SNAP_MS` |
| The window | the symbol on the line whole and a piece of the one above and below (the page's compact window, 60 grid px = 150 px at 1600x900; held to 72 px on the phone), neighbours at 45 % | the page's in-game frame; the bible's "three symbols visible, centre at full alpha, neighbours at 45 %" |
| The ties | exactly half a symbol belongs to the symbol that is arriving (`Math.round`); a symbol is on the line for 200 ms, 100 either side of its centre | ours, pinned by a test |

The three numbers are labelled "our estimate" in `ladyLuckTiming.ts`, `LadyLuckReels.ts` and the tests that pin them. Retuning one is a
one-line edit plus the test that names it. The single source line on aiming (the reels can be lined up by pausing again and again) is not
used: a pause freezes the reels and the timer, so it can neither line one up nor cost a spin.

## What changed

| File | What |
|---|---|
| `src/ui/ffx2/ladyLuckTiming.ts` (new, 130 lines, pure) | The rule: `positionAt`, `indexOnLine`, `symbolOnLine`, `msUntilCentred`, `snappedPosition`, `layoutFrom`, and the three estimates. No DOM, no clock |
| `src/ui/ffx2/LadyLuckReels.ts` (rewritten, 368 lines) | The overlay: strips, arrow, pay line, timer bar, the three input routes, the device-named prompt, the pause, the safety timer. Same exports (`createLadyLuckReels`, `mountLadyLuckReels`, `LadyLuckHandle`); `forcedStops` is gone, `press(atMs?)` and `params.now` are the test seams |
| `src/ui/ffx2/ladyLuckSymbols.ts` (new, 94 lines) | The nine symbols as original SVG drawings (the page's six, with the Red 7 and the BAR plate redrawn as shapes, plus Skull, Hat and Staff drawn to match); no retail asset |
| `src/ui/ffx2/minigames.css` | The reel window, strip cells, pay line, arrow, timer bar; the slab takes pointer events back from its layer (as Trigger Happy does); the prompt takes its own row in a window under 960x540 |
| `src/battle/ffx2/minigames.ts`, `execute.ts`, `index.ts` | `rollReelLayout` and `requestLayout`: the engine draws the stop order and the strip phases from the **seeded stream** and puts them on the `minigame-request` (see Determinism) |
| `docs/CONTRACT-CHANGES.md` | One entry, newest first (additive; no contract file changed) |
| `tools/ladyluck-reels-bench.mjs` (new) | The measurement below, reproducible (`pay`, `chapters`) |
| tests | `ladyluck-timing` (16), `ui-ffx2-lady-luck` (32, rewritten), `ffx2-lady-luck-layout` (6, new); `ffx2-minigame-type-floor` updated (the symbols are pictures now; the prompt wraps) and `ffx2-lady-luck-human` made robust (below) |

## Determinism and layering (hard rule 1)

- `src/battle` has no time in it. The press time maps to a symbol in the presentation layer (`ladyLuckTiming.ts`), and what reaches the
  engine is what always did: `ReelResult.symbols` on the command's `extra`.
- Everything about a spin except the player's timing is a function of the seed. Before this the overlay drew the stop order with
  `Math.random`. Now the engine draws it at the request: `rollReelLayout` takes **five values in a fixed order** (two for the stop order,
  three for the phases) and only on a human's request. An unattended spin never emits a request and still draws exactly three values
  (`rollReels`), so every shipped line is untouched: **the autopilot's event-log digest over seeds 1 to 200 is identical to r381's
  recorded values in all seven FFX-2 chapters** (IV `10be3653d65ace71` 200/200, V `a2bdf7ce055958dd` 188/200, VI `2c17fadc43601d6b`
  198/200, XI `0e47b91402fcb4f1` 174/200, XIII `9aebd9f707d6cd9c` 14/200, XV `c5e43cb264008c79` 111/200, XVI `545d43dfeae497c5` 197/200;
  `digest.mjs` in the parked scratch below, the r381 harness's own hash).
- The browser runs show it: every Wait run of the same chapter and seed (twelve in the final matrix, eleven in the first) raised the same layout (stop order `[2,1,0]`,
  phases `3.16 4.99 3.24`, phone and desktop alike), and the Active runs another (`[0,2,1]`, `3.24 0.07 5.26`).
- One existing test needed a repair, not a rule change: `ffx2-lady-luck-human` asserted that every Yuna-sourced hit in a log that keeps
  playing 12 more menus was the Dud's; the five extra draws moved her next plain Attack (on the boss) into that window. It now reads the
  Dud's own hits (from the `Dud!` message to the spinner's `action-end`).

## Input

The bound button is the abstract `confirm` of `src/app/Input.ts`, the key Lady Luck listened to before.

| Input | Route | The overlay says |
|---|---|---|
| keyboard | `keydown` of Enter, NumpadEnter, Space or Z (a test pins these against `Input.KEY_MAP`), repeats ignored | `PRESS ENTER TO STOP` |
| gamepad | standard button 0, polled by the shared `RawInputWatcher` (a test pins it against `Input.PAD_MAP`) | `PRESS CROSS TO STOP` (the game's own word, `ControlsHint.PAUSE_HINTS`) |
| pointer | `pointerdown` on the slab: a finger or a click (a right click does not) | `TAP TO STOP` / `CLICK TO STOP` |

The words follow the input last used and, before the first press, a touch screen, else a connected pad, else the keyboard. The instant
of a keyboard or pointer press is the event's own timestamp where the browser gives one on this clock and it is fresh (under 250 ms),
else the clock now; a pad is read at the next frame (up to 17 ms late, like every pad input in the game). While the pause is open
(`rawInputSuspended`) the reels and the timer stand still and a press counts nothing. In a window under 960x540, which takes in the phone, the longer prompt takes its own row, as Trigger
Happy's does.

## Proof

### The timing, pinned by tests
`ladyluck-timing.test.ts` pins the rule on plain arithmetic (phase 0: Red 7 until 100 ms, then each symbol for 200 ms; the half-symbol tie goes
to the arriving symbol, to the millisecond; 20,000 random presses against a brute-force nearest-symbol check; every symbol is on the
line one sixth of the time; the snap lands on the symbol and never overshoots). `ui-ffx2-lady-luck.test.ts` drives the overlay on a
manual clock: a sweep of presses every 37 ms from 0 to 2.4 s each stops on the symbol nearest the line, three presses at three moments
give three symbols read left to right whatever the stop order, a press 99 ms either side of a centre gets the symbol and 101 does not,
the 12 s timer stops the rest where they are (decided at the deadline, not when the timer noticed), all three input routes, the words,
the pause, teardown.

### Real input in the game
A production build of this tip (`vite build`) on a copy of the r381 scratch static server, which serves Lady Luck's paintings from the
install-ready package as a dev-only overlay (nothing written under `public/art`); headless Chromium with the GPU args, one browser at a
time. The debug API only starts Chapter XVI (Djose) at seed 3; the girl changes into Lady Luck and throws Magic Reels by real keys; the
reels are stopped by real input sent at the instant the player model chose (key: CDP key events; tap: CDP touch taps on the phone viewport;
pad: a fake standard pad, which is how the Gamepad API reports a real one). "Aim" reads the layout off the overlay (`data-layout`, `data-t0`)
and presses when the wanted symbol is centred; the error is the instant the overlay recorded against the instant intended.

| Run | Input, ATB, viewport | Prompt | Aimed at (reel 1, 2, 3) | Stopped on | The engine said | Error of the three presses |
|---|---|---|---|---|---|---|
| key-cherry | key, Wait, 1600x900 | PRESS ENTER TO STOP | Cherry, Cherry, Cherry | cherry cherry cherry | **Flare** | +7.6, -1.3, +46.3 |
| key-three-red7 | key, Wait |  | Red 7 x3 | red7 red7 red7 | **Ultima** | +1.9, +1.5, +22.5 |
| key-pair | key, Wait |  | Cherry, Cherry, Hat | cherry cherry hat | **Bio (a pair in slots 1 and 2)** | +67.6, -20.4, +1.9 |
| key-lone | key, Wait |  | Cherry, Hat, Skull | cherry hat skull | **Cura (a lone Cherry in slot 1)** | +1.0, +0.2, +12.1 |
| key-dud | key, Wait |  | Hat, Skull, Staff | hat skull staff | **Dud!** | +2.1, +61.2, +12.5 |
| key-masher | key, Wait |  | three Enters 150 to 260 ms apart, not looking | red7 bar cherry | **Dud!** | n/a |
| pad-cherry | pad, Wait, 1600x900 | PRESS CROSS TO STOP | Cherry x3 | cherry cherry cherry | **Flare** | +14.3, -3.6, +13.1 |
| pad-red7 | pad, Wait |  | Red 7 x3 | red7 red7 red7 | **Ultima** | +10.9, +9.4, +10.5 |
| pad-masher | pad, Wait |  | three pad taps 150 to 260 ms apart, not looking | bar cherry skull | **Dud!** | n/a |
| tap-cherry | touch tap, Wait, **390x844** | TAP TO STOP | Cherry x3 | cherry cherry cherry | **Flare** | +2.6, +7.3, +0.8 |
| tap-red7 | touch tap, Wait, 390x844 |  | Red 7 x3 | red7 red7 red7 | **Ultima** | +0.8, +1.5, +0.4 |
| tap-masher | touch tap, Wait, 390x844 |  | three taps, not looking | hat staff cherry | **Dud!** | n/a |
| active-cherry | key, **Active**, 1600x900 | PRESS ENTER TO STOP | Cherry x3 | cherry cherry cherry | **Flare** | +1.3, +0.0, +1.3 |
| active-red7 | key, Active |  | Red 7 x3 | red7 red7 red7 | **Ultima** | +52.2, -24.4, +5.5 |

All four result kinds are reached on purpose (three of a kind, a pair, a lone Cherry, a Dud) and the masher gets a Dud. The real-input error
(the instant the overlay recorded minus the instant meant) is small against a 200 ms symbol, with the full unit suite, the bench and a build all using the machine at the same time:
keys +14.4 ms mean and 67.6 at worst (15 presses), taps +2.2 and 7.3 (6), Active keys +6.0 and 52.2 (6), the pad +9.1 and 14.3 (6; it is read on the next frame). The same 13 runs on a quiet machine, one
build earlier (before a CSS-only fix that makes a three of a kind glow gold), gave identical results (Flare, Ultima, Bio, Cura, Dud) with keys +2.3 and 9.3, taps +2.8 and 9.2, Active keys +4.5 and
8.9, the pad +12.1 and 23.1. No console error and no failed request in any run of either matrix. The key-three-red7 frame is from an identical rerun of that run (all three reruns gave
Ultima): the matrix run's own screenshot landed after the slab had closed, because the machine was loaded. Frames: `docs/screenshots/ladyluck-a/` (below).

### Pay rates by player type
The players are the options page's (inputs to a measurement, never game data): the **masher** taps three times 150 to 260 ms apart without
looking; the **casual** player aims at a Cherry on every reel and presses about 120 ms off the moment it meant (one standard deviation); the
**careful** player aims at a Cherry, 60 ms off; the **greedy** one is careful aiming at Red 7. Pays = not a Dud, by the engine's own pay table
on the shipped Magic Reels.

| Player | Model, 20,000 spins | In the game, real keys on the real overlay, 100 spins | The page's table (20,000) |
|---|---|---|---|
| Masher | 25.4 % pay, Dud 74.6 %, three of a kind 2.8 %, 0.61 s a spin | 23 % pay (95 % interval 16 to 32), Dud 77 %, three of a kind 2 %, 0.64 s a spin | 25.5 % |
| Casual, aims at Cherry | 66.0 %, Dud 34.0 %, three of a kind 24.8 %, 2.86 s | 74 % pay (95 % interval 65 to 82), Dud 26 %, three of a kind 26 %, 2.81 s a spin | 65.6 % |
| Careful, aims at Cherry | 91.0 %, Dud 9.0 %, three of a kind 75.0 %, 2.70 s | 95 % pay (95 % interval 89 to 98), Dud 5 %, three of a kind 79 %, 2.67 s a spin | 91.4 % |
| Careful, aims at Red 7 | 75.2 %, Dud 24.8 %, **Red 7 three times 75.0 %**, 2.70 s | 77 % pay (95 % interval 68 to 84), Dud 23 %, three of a kind 77 %, Red 7 three times 77 %, 2.74 s a spin | 75.6 % |
| Today's random draw | 26.0 %, Dud 74.0 %, three of a kind 2.6 %, Red 7 x3 0.5 % | | 26.0 % |

The model column is `node --experimental-transform-types tools/ladyluck-reels-bench.mjs pay`: the engine's layout, the overlay's timing rule
and the engine's pay table, with no screen. The in-game column is the same players sending real Enter key events to the real
`LadyLuckReels.ts` (a scratch page that mounts it as `FFX2BattleHud` does, dev server, `lab-measure.mjs` in the parked scratch below).
The model reproduces the page's numbers to within sampling error, and the game reproduces the model (every in-game interval holds the model's value; 100 spins is a wide net,
plus or minus 5 to 9 points). Real-input error of the aimed presses in those runs, ms after the instant meant, 300 presses a row: careful +3.3 (SD 3.4, at worst 19.9, a quiet machine);
casual +5.2 (SD 15.8, at worst 210) and greedy +8.4 (SD 19.0, at worst 185) ran while the bench and the other jobs of this lane were using the CPU, so a few presses landed late, which can only
lower a pay rate.

### Chapters V and XIII, as the page promised
"A lets a careful player land Red 7 three times in about three spins in four ... I would measure Chapters V and XIII with it before anything ships, and I
would not tune a boss for it." Measured; **no boss was touched.** `node --experimental-transform-types tools/ladyluck-reels-bench.mjs chapters`:
each chapter's own build and link chain, Wait ATB, no decision time (the autopilot's clock), seeds 1 to **1000**, headless engine. The shipped
lines never open a reel, so the reference is the shipped autopilot (`intendedStrategy`). In the other arms one girl wears Lady Luck from the start
(what one Change on turn one gives: Lady Luck is one Change away for Yuna and Rikku in V and for all three in XIII; Paine in V is two Changes away, so her column assumes she changed twice early) and throws **Magic Reels every turn**; the other two follow the
shipped line. "Today's reels" is the engine's blind roll (the answer is a bare re-submit, uniform over six symbols a reel, the same as the old overlay's
random draw); "timed" is a careful player (60 ms off) answering the real request with the overlay's rule.

| Chapter V (Farplane, five links), clears of 1000 | Yuna spins | Rikku spins | Paine spins |
|---|---|---|---|
| The shipped line, no reels (reference) | 950 (95.0 %) | 950 | 950 |
| **Today's random reels** | **0 (0.0 %)** | **0 (0.0 %)** | **0 (0.0 %)** |
| Timed, careful, aiming at three Red 7 (Ultima) | 24 (2.4 %) | 211 (21.1 %) | 244 (24.4 %) |
| Timed, careful, aiming at three Cherries (Flare) | 193 (19.3 %) | 631 (63.1 %) | 609 (60.9 %) |
| Timed, careful, and **only gambling while every ally has 90 % HP**, Red 7 | 886 (88.6 %) | 471 (47.1 %) | 510 (51.0 %) |
| the same, Cherries | 957 (95.7 %) | 524 (52.4 %) | 646 (64.6 %) |
| All three girls on the reels (a ceiling, not a line): Red 7 / Cherries | 0 / 0 | | |

| Chapter XIII (Via Infinito: Paragon, then Trema), clears of 1000 | Yuna spins | Rikku spins | Paine spins |
|---|---|---|---|
| The shipped line, no reels (reference) | 76 (7.6 %) | 76 | 76 |
| **Today's random reels** | **1 (0.1 %)** | **12 (1.2 %)** | **8 (0.8 %)** |
| Timed, careful, Red 7 | 22 (2.2 %) | 37 (3.7 %) | 30 (3.0 %) |
| Timed, careful, Cherries | 24 (2.4 %) | 38 (3.8 %) | 27 (2.7 %) |
| Timed, careful, only gambling while every ally has 90 % HP, Red 7 | 50 (5.0 %) | 34 (3.4 %) | 78 (7.8 %) |
| the same, Cherries | 58 (5.8 %) | 37 (3.7 %) | 76 (7.6 %) |
| All three girls on the reels: Red 7 / Cherries | 0 / 2 | | |

Intervals (Wilson 95 %) are plus or minus 1.3 to 3 points: the shipped line in V is 93.5 to 96.2, in XIII 6.1 to 9.4; the rows above carry theirs in the bench output.
What it says:

1. **The timed reels move a Lady Luck line from hopeless to playable, and no further.** Today's reels lose Chapter V every time (0 of 1000 for every spinner: the
   first Dud in link 1 takes three quarters of everyone's HP). A careful timed player clears 19 to 63 % of V with Cherries and 2 to 24 % with Red 7.
2. **No line beats the shipped line in either chapter beyond noise.** The best reel lines are 95.7 % in V (Yuna spinning only at full health, against 95.0 % shipped, intervals
   94.3 to 96.8 and 93.5 to 96.2) and 7.8 % in XIII (Paine, against 7.6 %). Landing Red 7 three times in about three spins in four (75.0 % measured) does not break these
   chapters: it comes with a Dud in about one spin in four (24.8 %), which takes three quarters of every ally's current HP, and the lines that gamble on it die early (in V, 40 to 71 % of the
   ungated Red 7 runs are dead in link 1, against 0.2 % of the shipped line's). So the page's flag does not show up as a balance problem in V or XIII: there is no case here for tuning
   a boss, none was touched, and option C's per-slot pace (the page's next dial) is not called for on this evidence.
3. XIII is a hard chapter for every line here (the shipped autopilot clears 7.6 % of seeds); the reels do not change that.
4. Not covered: Chapters IV, VI, XI, XV and XVI (Lady Luck is not offered in IV and VI; XI, XV and XVI were not asked for), other lines than the ones above, a human's
   judgement about when to gamble (the gated rows are one such rule), and Item and Random Reels (not shipped commands). The bench's own checks: in every timed arm the
   engine's message agrees with the symbols the player stopped (the `engine!=` column is 0 in every timed arm of both chapters), and a few answers are **refused** (the `refused` column: 0.1 to 0.3 % of
   a one-girl line's spins in V, almost none in XIII, 3 to 6 % in V with three girls charging at once): everything the reels aimed at died during the long charge (Vegnagun's parts fall one by
   one), so the engine keeps the turn and offers it again (a rule from r37, `allTargetsGone` in `ffx2/engine.ts`). The overlay still opens for such a spin and the player plays it for
   nothing. Not changed here; noted for the driver.

## Frames (`docs/screenshots/ladyluck-a/`, JPEG, real game, Chapter XVI)

1600x900: `xvi-wait-key-spin` (strips running, the arrow over the first reel to stop), `xvi-wait-key-first-reel-stopped` (one reel on its gold-outlined symbol, the arrow moved
on), `xvi-wait-key-three-cherries-flare`, `xvi-wait-key-three-red7-ultima`, `xvi-wait-key-pair-bio`, `xvi-wait-key-lone-cherry-cura`, `xvi-wait-key-dud`,
`xvi-wait-pad-spin-cross` (the prompt reads PRESS CROSS TO STOP; the HUD hint reads TRIANGLE), `xvi-wait-pad-three-red7-ultima`, `xvi-active-key-spin` and
`xvi-active-key-three-red7-ultima` (Active ATB). 390x844: `phone-xvi-wait-tap-spin` (TAP TO STOP on its own row), `phone-xvi-wait-tap-first-reel-stopped`,
`phone-xvi-wait-tap-three-cherries-flare`, `phone-xvi-wait-tap-three-red7-ultima`, `phone-xvi-wait-tap-masher-dud`. And `target-above-build-1600x900`.
Lady Luck's paintings are not installed (the shared `public/art` is gitignored): the frames use the r381 dev-only overlay, so Yuna wears the painted dress.

## Gates

- `node node_modules/typescript/bin/tsc --noEmit` (TypeScript 7.0.2, main's `node_modules` through the worktree's junction): clean.
- The vitest files this lane touched or added, run together with their neighbours (the Lady Luck engine tests, Trigger Happy's input test, the minigame stacking and layer
  tests, the CSS scoping and comment gates): all pass. New or rewritten: `ladyluck-timing` 16, `ffx2-lady-luck-layout` 6, `ui-ffx2-lady-luck` 32; updated: `ffx2-minigame-type-floor` 15, `ffx2-lady-luck-human` 2.
- **Full suite**, once, at the end, in this worktree (`node_modules` and `public/art` junctions in place): `node node_modules/vitest/vitest.mjs run --maxWorkers=2 --testTimeout=90000`:
  **802 files passed, 5 skipped (807); 11,823 tests passed, 46 skipped, 1 todo; 0 failed**, 1,338 s. r381's recorded run was 800 files and 11,773 tests: the difference is the 2 new files
  and 50 new tests. **`--testTimeout=90000` was needed**: `strategy-ffx2-bahamut` "heal-only route clears Mega Flare" took 21 s against the config's 15 s (the known slow test).
- `node tools/orphans.mjs`: 24 orphaned of 1,222 modules, none of them mine (24 on `origin/r381-lady-luck`); the two new UI modules are reached from `src/main.ts` through `LadyLuckReels.ts`.
- House rule 7: new and changed source files are under 400 lines (`LadyLuckReels.ts` 368, `ladyLuckTiming.ts` 130, `ladyLuckSymbols.ts` 94, `minigames.ts` 127, `execute.ts` 301).
- Autopilot identity: the shipped line's event-log digest over seeds 1 to 200 equals r381's recorded values in all seven FFX-2 chapters (above).
- Servers started and stopped by PID: a Vite dev server on 5191 (the lab page) and a static server on 7091 (the production build). Nothing was written under `public/art`.

## Decisions I took, and what I left (for the driver to veto)

- The mockup's `OPTION A` tag and the `5.0/s` captions under each reel are **not drawn** (the page said of option C's captions that the game would not print them; the same goes here).
- The thin timer bar under the title (the mockup has it) is drawn: it fills as the 12 s run, so the safety timer is not a surprise.
- The whole slab is the tap or click target, not only the three windows (a bigger thumb target on the phone).
- A pause freezes the reels and the timer (otherwise 12 s could run out under the pause menu).
- The prompt names the input in the game's own words (Enter, Cross, tap, click). Under 960x540 it takes its own row (the phone), so it stays inside the slab.
- The phone's reel window is held to 72 px (60 grid px elsewhere) so the symbols stay about 31 px; the slab is about 30 px taller there than before and covers more of the boss while the reels are open.
- Escape still does nothing at the overlay (unchanged from r37; FFX-2's engine has no back-out of a charged minigame).
- A pad press is read at the next frame (up to 17 ms late). The Gamepad API's own timestamp would tighten that; it is not worth a change to the shared watcher for 17 ms of a 200 ms symbol.
- Not built, not asked for: Item Reels and Random Reels, Lady Luck's paintings in `public/art` (see r381's room table), any boss change.

## How to run it again

- Unit: `node node_modules/vitest/vitest.mjs run tests/unit/ladyluck-timing.test.ts tests/unit/ui-ffx2-lady-luck.test.ts tests/unit/ffx2-lady-luck-layout.test.ts tests/unit/ffx2-minigame-type-floor.test.ts`
- Measure: `node --experimental-transform-types tools/ladyluck-reels-bench.mjs pay` and `... chapters --seeds=1000 [--spinner=yuna|rikku|paine] [--arms=a,b]`.
- The browser drivers, the lab page, the digest harness, the production build and every raw output are scratch, parked in `F:/pyrefly-parked/2026-10-04/ladyluck-a/` (the lab page, `zz-ll-lab.tmp.*`, at its top;
  everything else under `scratch/`: `ll-aim.mjs` and `lib.mjs` are the drivers, `serve.mjs` the static server with the dev-only Lady Luck overlay, `lab-measure.mjs`, `digest.mjs`, `tojpg.mjs`, the `out/` PNGs and
  reports, `dist/`). The paths inside the scripts still name the old `D:/Tools/pyrefly-scratch/2026-10-04/ladyluck-a` folder; the method is in the sections above.
- One side effect to know about: the lab page ran on a Vite dev server with the default cache folder, which through the worktree's `node_modules` junction is the main tree's `node_modules/.vite/deps`
  (rewritten at 23:30). It is a cache, so nothing is lost, but a dev server running from the main tree may have re-optimised once. The dev server and the static server were stopped by PID.
