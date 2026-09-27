# Combat switches turned as decided (2026-09-27)

Branch `combat-switches`, worktree `D:/pyrefly-switches` (sparse, junctions to the main tree's
`node_modules` and `public/art`). Built on `iter2-b1` (`docs/handoff/iter2-b1.md`), which built each
switch OFF and measured it.

Bailey, 2026-09-27 ~11:00 EDT, answering items 3 and 4 of the driver's list: "I'll go with all of your
recommendations" (`docs/target/decisions.json` **D-242** and **D-243**).

| Switch | Decision | Game case (rule 14) | Where |
|---|---|---|---|
| IC-1 / PR-0209: an immune hit opens and extends no chain window | **ON** | FFX-2 only (chains are FFX-2's) | `src/battle/ffx2/constants.ts` `IMMUNE_HITS_SKIP_CHAIN = true` |
| PR-0106: Leblanc's failsafe fires once (turn 25 + No Love Lost uses) and turn 5 is Fan Slap (SinirothX) | **ON** | FFX-2 only (Chapter VI) | `constants.ts` `LEBLANC_SCRIPT_SINIROTHX = true` |
| PR-0124: the worn dressphere carries between links | stays **OFF** | FFX-2 only | `src/app/screens/BattleScreenCarry.ts` (untouched) |
| PR-0107: Chapter VI's Acts II and III open on random bars | stays **OFF** | FFX-2 only | `constants.ts` `SEPARATE_BATTLE_GAUGES = false` (comment only) |
| PR-0179: Gagazet aeon rows, arm (a) | **arm a** | FFX only (aeons are FFX's) | `src/data/ffx/builds/gagazet-aeon-arms.ts` `GAGAZET_AEON_ARM = 'a'` |

Arm a gives Chapters I and IX `research/ffx-combat-core.md` §6.4.3's Gagazet rows (Valefor 1,530,
Ifrit 2,075, Ixion 2,055, Shiva 1,830, Bahamut 2,935 HP, every stat of the row), and Chapter X's
Bahamut, which Chapter XIV inherits, takes the same Bahamut row. XIV's other four aeons keep D-186's
rows. No boss number moved anywhere; the measurement overrides (`Ffx2EngineOptions.immuneHitsSkipChain`,
`leblancScriptSinirothX`, `B1_AEON_ARM`) still reach the old behaviour for a measurement run.

## Measurements (200 seeds a row, human / Active / bench)

Human = the live Wait split (1.5 s a menu, 0.5 s on the top list); Active = 1.5 s a menu with the
clock running; bench = zero decision time. Bench file `tests/unit/iter2-b1-bench.test.ts`, which
gained the arm `pre` (both switches forced off, the engine before D-242); `off` now means "every
constant at its default".

```
PYREFLY_MEASURE=1 B1_ARMS=off,pre npx vitest run tests/unit/iter2-b1-bench.test.ts --testTimeout=0
```

### FFX-2, first-try wins of 200, before (pre D-242) -> after (shipped defaults)

| Chapter | before | after | logs that move (human / Active / bench) | why |
|---|---|---|---|---|
| IV Bahamut | 200 / 200 / 200 | 200 / 200 / 200 | 0 / 0 / 0 | |
| V Vegnagun + Shuyin | 181 / 90 / 188 | 181 / **89** / 188 | 17 / 30 / 6 | IC-1 (fight 5.99 -> 5.97 min; damage taken 105,843 -> 105,618 a run) |
| VI Leblanc | 157 / 31 / 195 | **165 / 52 / 198** | 198 / 189 / 200 | PR-0106 (fight 3.81 -> 2.59 min at human pace; damage taken 11,460 -> 8,298) |
| XI Fallen Aeons | 164 / 116 / 174 | 164 / 116 / 174 | 0 / 0 / 0 | |
| XIII Trema | 13 / 13 / 14 | 13 / 13 / 14 | 0 / 0 / 0 | |
| XV Den of Woe | 36 / 13 / 94 | **48 / 18 / 112** | 38 / 16 / 81 | IC-1 (18 % -> 24 % first try at human pace; within 5, computed, 63 % -> 75 %) |

Identity checks: the `pre` arm's 3,600 per-seed log hashes equal, one for one, a hash file taken on
this branch before the constants were turned (0 differ); the shipped defaults differ on exactly
775 = the moved logs above. The numbers are iter2-b1's own "off -> on" table, reproduced.

### FFX (arm a), the chapters' own benches, before ('shipped' rows) -> after (arm a)

Before: `B1_AEON_ARM=shipped npx vitest run --config tests/unit/helpers/aeon-arm.vitest.config.ts <bench>`.

| Chapter (bench) | before | after |
|---|---|---|
| I Seymour Flux (`strategy-seymour-flux`): seeds 1-40 / the four standard windows | 17 / 78 of 160 (17 / 17 / 19 / 25) | **18 / 79 of 160** (18 / 19 / 21 / 21) |
| IX Yojimbo (`yojimbo-bench`, intended line) | 143 / 200 (71.5 %) | **153 / 200 (76.5 %)** |
| X Natus (`natus-shipped-bench`, shipped tactic) | 169 / 200 (84.5 %) | **159 / 200 (79.5 %)** |
| XIV Isaaru (`isaaru-tactic-bench`, shipped tactic, whole chain) | 125 / 200 (63 %) | **173 / 200 (87 %)** |
| XIV, the other lines: sourced order / Shield at full / Grand Summon Bahamut on Grothia | 98 / 50 / 124 | 33 / 17 / **200** |
| I, the advisor card-follower (`advisor-degenerate-boards`, 40 seeds) | 22 / 40 | **18 / 40** |

As iter2-b1 measured and its check noted: under arm a XIV's shipped tactic and Grand Summon win
more, its other lines collapse (the fight leans on Bahamut), and X loses 10 wins.

## Goldens and pins moved for this reason (each shown to pass with the switches forced off first)

With both FFX-2 constants set back to `false` (nothing else changed) the four FFX-2 files below
passed untouched, so every FFX-2 re-pin is the switches' doing; only Chapter VI moves in them
(PR-0106), IC-1 changes nothing on their seeds. The FFX re-pins were measured under `'shipped'`
and arm a on the same tree.

| File | What moved | Why |
|---|---|---|
| `iter2-b1-switches.test.ts` | the two "ships OFF" pins -> ON | D-242 |
| `ffx2-all-target-hits.test.ts` | "ships OFF" -> "ships ON: an immune hit opens no window"; a new case pins the forced-off path | IC-1 |
| `ffx2-hit-closes-menu.test.ts` | Chapter VI's three D = 0 hashes | PR-0106 |
| `chapters/den-of-woe-carry.test.ts` | Chapter 6's eight base hashes (5 and XI unchanged) | PR-0106 |
| `ffx2-menu-cancel-delay.test.ts` | Chapter VI's six ON hashes re-pinned; the "release 17" replay now also forces IC-1 and PR-0106 off, so its eighteen PINNED hashes stay byte for byte | PR-0106; release 17 predates D-242 |
| `strategy-ffx2-leblanc.test.ts` | A2 "Huggles is lethal": 0.8 -> 0.75 (Huggles on 9 of 20 seeds, 7 cost a member; 8 of 9 with PR-0106 forced off) | PR-0106 |
| `iter2-b1-aeons.test.ts` | "ships OFF" -> "ships arm a" (1,530 / 2,075 / 2,055 / 1,830 / 2,935; X and XIV Bahamut 2,935); the `'shipped'` arm still pinned byte for byte | D-243 |
| `strategy-seymour-flux.test.ts` | **seeds 7 and 20260916 leave `KNOWN_LOSSES`** (they win under arm a; seed 1 still loses, 43,187 left at turn 38); titles 17 -> 18 and 78 -> 79; floors unchanged (15 / 73) | D-243 |
| `advisor-degenerate-boards.test.ts` | Chapter I card-follower floor 20 -> 18 (22 -> 18 of 40, 76 raises led instead of 98) | D-243 |
| `chapters/isaaru-engine.test.ts` | build row Bahamut 1,398 -> 2,935; Hellfire on Bahamut 1,840 -> 1,621 and he now survives it from full HP (the other three still die); Energy Ray on Bahamut 382 -> 336; the Pterya gauge case summons Ifrit, not Bahamut (arm a's Bahamut kills Pterya at gauge 75, before Energy Ray) | D-243 |
| `data-ffx-builds.test.ts` | the "no superboss grinding" monotonic rule now pins Zanarkand -> Dream's End only; the Gagazet -> Zanarkand step is pinned as a known gap (open item 1) | D-243 |

## Real-key checks (production build, headless Chromium on the real GPU)

`vite build --outDir D:/Tools/pyrefly-scratch/combat-switches/dist` (not the shared `dist/`),
`vite preview` on **7601**, driven by `D:/Tools/pyrefly-scratch/combat-switches/rk2.mjs`; the server
was stopped by its PID afterwards. Setup through the debug API is labelled: seed and chapter entry by
`setSeed` + `gotoChapter(…, { skipCutscenes: true })`, and the links before the checked one by
`autoBattle('intended')` (auto-play confirmed `null` after hand-back). Every command in the checked
fight is a real key. 0 page errors in every run. Frames in `D:/Tools/pyrefly-scratch/combat-switches/shots/`.

- **Chapter XIV, link 1 (Grothia), seed 1, arm a (FFX):** real ArrowDown / Enter from Yuna's
  menu into the summon list (Valefor, Ifrit, Ixion, Shiva, Bahamut), ArrowDown to Bahamut, Enter. The field reads Bahamut **2,935 / 2,935** in the engine and in the HUD row
  (`xiv-2-bahamut-menu-2935.jpg`). Grothia's Hellfire hit him for 1,608 and he stood at 1,327 (the
  old 1,398-HP row would have died); won by real Enter in 4 presses (`xiv-3-end.jpg`).
- **Chapter VI, Act III, seed 1, PR-0106 (FFX-2):** Acts I and II by debug auto-play; Act III by real
  Enter (7 presses). Leblanc's turns: Not-So-Mighty Guard, Fan Slap, No Love Lost, Love Tap,
  **Fan Slap (turn 5)**, Mach Fan. The old script's turn 5 was the guard. The Enter-only party then
  lost (`vi-1-leblanc-turn5.jpg`, `vi-2-end.jpg`).
- **Chapter XV, Nooj's link, seed 1, IC-1 (FFX-2):** Baralai and Gippal by debug auto-play; in Nooj's
  link Yuna and Rikku each open Item -> Hero Drink -> confirm by real keys (Invincible), then real
  Enter. Shade Nooj hit the Invincible Yuna twice (seq 341 and 602, `miss` reason immune): **no chain
  event on either** (with IC-1 off the engine emits the `chain` event directly before the immune
  `miss`), 23 chain events in all from damaging hits. The Enter-only party lost (`xv-0-after-drinks.jpg`,
  `xv-1-end.jpg`).

## Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| Touched test files | pass (the eleven above) |
| Full suite `--testTimeout=60000` | first run (switches on, before the re-pins): 12 failures in 8 files, every one listed above; final run: **597 files pass, 5 skipped, 0 fail** (9,411 tests) |
| `node tools/orphans.mjs` | 24 orphans, the same as main |
| Files over 400 lines touched | none |

## Open (need Bailey's word)

1. **Aeon rows: Gagazet now sits above Zanarkand and Dream's End (FFX, Chapters II and III).**
   Arm a gives Gagazet §6.4.3's rows (Yuna's §6.4.2 profile through the formula), while Zanarkand
   and Dream's End still ship `ffx-yunalesca.md` §12's rows, the battle-count floor alone (Valefor
   1,341 / 1,465 ... Bahamut 2,542 / 2,840). So a later chapter's aeons are now weaker than an
   earlier one's, for all five. §6.4.3 also prints the Zanarkand block (Valefor 1,674 ... Bahamut
   3,218) and an inside-Sin block that would make the three chapters one model again. Not changed
   here (it moves Chapters II and III, which Bailey has not been asked); the test pins the gap.
   Options to put to him: (a) move II and III to §6.4.3's blocks and bench them, or (b) keep as is.
2. **Leblanc's buff duration (FFX-2, Chapter VI).** `SYNDICATE_BUFF_DURATION` (40, 21.2 s) was
   derived from the old script's cadence ("turns 1 and 5, so it comes back roughly every 21 s",
   `leblanc-syndicate-leblanc-abilities.ts`). Under SinirothX's script the guard opens the fight and
   comes back once at turn 25 + uses, so that derivation no longer describes the script. Left as it
   is: the D-242 benches were measured with it, and no source gives a duration (rule 6).
3. **The advisor card-follower in Chapter I drops 22 -> 18 of 40 under arm a** (the floor moved to
   18). Advisor v3 is due in the next build and will re-measure this board; if it lands after this
   branch, that test's floor is the one to look at.
4. Carried from iter2-b1: PR-0124 and PR-0107 stay off and are asked again when their chapters'
   benches can absorb them (D-242).

## Files

Code: `src/battle/ffx2/{constants,internal,resolve,resolve-hp}.ts`, `src/battle/ffx2/ai/leblanc-syndicate.ts`
(comments), `src/data/ffx/builds/{gagazet-aeon-arms,gagazet,highbridge,via-purifico}.ts`.
Tests: the eleven files in the re-pin table. Paper: this file.
Scratch (not committed): `D:/Tools/pyrefly-scratch/combat-switches/` (bench logs and hash files, the
build, the real-key scripts and frames).
