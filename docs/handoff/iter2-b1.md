# Iteration 2, batch B1: combat engine and data (2026-09-26/27)

Branch `iter2-b1`, worktree `D:/pyrefly-iter2-b1` (lighter copy, junctions to the main tree's
`node_modules` and `public/art`). Plan: `docs/plans/iteration-2-batches.md` §3 B1. Preflight:
`docs/plans/combat-polish-0926-review.md` plus the addendum `docs/plans/iter2-b1-review.md`.
Deep-review class: focused before deploy, deep after. **Batch game case: both** (FFX-2 engine and
data; FFX builds for PR-0174, PR-0179 and PR-0069). Each commit names its own case.

Bailey, 2026-09-26 ~23:25 EDT: "i'll go with all of your recommends. full speed ahead please. godspeed."

## What was built

| Item | Game | State | Where |
|---|---|---|---|
| PR-0083 / F3 split | FFX-2 | done, pure move | `engine.ts` 643 -> 331 + `engine-core.ts` 343; `resolve.ts` 485 -> 309 + `resolve-hp.ts` + `resolve-targets.ts` |
| PR-0145 all petrified = Game Over | FFX-2 | done (sourced) | `results.ts` |
| PR-0108 Sleep never expires at Fast | FFX-2 | done (single source, labelled) | `constants.ts` STATUS_CLOCKS_HELD_AT, threaded through the status clocks |
| PR-0107 Acts II/III random bars | FFX-2 (VI) | **built OFF** (stop rule) | `EnemyGroupDef.opensAsSeparateBattle` + `constants.ts` SEPARATE_BATTLE_GAUGES |
| PR-0138 chain spoils | FFX-2 | done | `BattleChainSpoils.ts`, `BattleEncounterChain.ts` (no `BattleScreenFlow.ts` line needed) |
| Acta F4 guard | FFX-2 | done | `data/ffx2/enemies/shuyin-abilities.ts` |
| PR-0106 / PR-0054 / PR-0069 labels | FFX-2 / FFX-2 / FFX | done | Leblanc AI + test names; `ai/vegnagun.ts`; `battle/ffx/setup.ts` |
| PR-0106 switch (failsafe once, turn 5 Fan Slap) | FFX-2 (VI) | **built OFF**, measured | `constants.ts` LEBLANC_SCRIPT_SINIROTHX |
| IC-1 / PR-0209 label | FFX-2 | switch stays OFF, measured | `constants.ts` IMMUNE_HITS_SKIP_CHAIN comment, `resolve.ts` |
| PR-0124 switch (dressphere carry) | FFX-2 | **built OFF**, measured | `BattleScreenCarry.ts` FFX2_DRESSPHERE_CARRIES, `setupForNextLink(..., seam)` |
| PR-0174 Rikku S.Lv | FFX | done, 53 -> 41 `[estimate]` | `data/ffx/builds/fahrenheit.ts` |
| PR-0179 aeon arms | FFX | **built OFF** (`'shipped'`), measured | `data/ffx/builds/gagazet-aeon-arms.ts`, `gagazet-kit.ts` |
| D-217 checkpoint at Shuyin | FFX-2 (V) | done, labelled an adaptation | `data/ffx2/enemies/shuyin.ts` |
| PR-0053 | FFX-2 | paper, below | this file |
| GP-G2, PR-0217 | FFX-2 / FFX | **open** (no GameFAQs reading available) | below |

## Measurements (200 seeds a row; run after the round-14 capture finished, 03:47 EDT)

Bench: `tests/unit/iter2-b1-bench.test.ts` (`PYREFLY_MEASURE=1`). Speeds: **human** = the live
Wait split (1.5 s a menu, 0.5 s on the top list), **Active** = 1.5 s a menu with the clock running,
**bench** = zero decision time. Each chapter is one unbroken run in the shipped order with its
shipped line; XV is the shipped Den. "Before" is the same bench on `0bf77169` (exported to a scratch
tree), "off" is this branch with every switch off.

### Every FFX-2 chapter, before -> after (switches off), first-try wins of 200 (human / Active / bench)

| Chapter | before (0bf77169) | after, off | logs that move (human / Active / bench) | why |
|---|---|---|---|---|
| IV Bahamut | 200 / 200 / 200 | 200 / 200 / 200 | 0 / 0 / 0 | |
| V Vegnagun + Shuyin | 181 / 90 / 188 | 181 / 90 / 188 | 6 / 22 / 6 | PR-0145: losing runs end at once when the last free girl falls beside petrified ones |
| VI Leblanc | 157 / 31 / 195 | 157 / 31 / 195 | 1 / 15 / 0 | PR-0145, as above |
| XI Fallen Aeons | 164 / 116 / 174 | same | 0 / 0 / 0 | |
| XIII Trema | 13 / 13 / 14 | same | 0 / 0 / 0 | |
| XV Den of Woe | 36 / 13 / 94 | same | 0 / 0 / 0 | |

Every win is unchanged; only defeats move (they end sooner). PR-0083's split alone was byte-identical
(50 seeds x three speeds x six chapters, 0 moved) before any behaviour change landed.

### The three sourced FFX-2 switches, off -> on (plan §8 Q4), first-try wins of 200 (human / Active / bench)

| Switch | Chapter it moves | off | on | Other numbers (human pace unless said) |
|---|---|---|---|---|
| **IC-1 / PR-0209** (an immune hit opens no chain; Split_Infinity G1032, our estimate) | V | 181 / 90 / 188 | 181 / 89 / 188 | 17 / 30 / 6 logs move; fight 5.99 -> 5.97 min; damage taken 105,843 -> 105,618 a run |
| | XV | 36 / 13 / 94 | **48 / 18 / 112** | 18 % -> 24 % first try; within 5 (independent retries) 63 % -> 75 %; 38 / 16 / 81 logs move |
| | IV, VI, XI, XIII | unchanged | unchanged | 0 logs move |
| **PR-0106** (Leblanc's failsafe once on turn 25 + uses; turn 5 Fan Slap; SinirothX, conflicts with the wiki) | VI | 157 / 31 / 195 | **165 / 52 / 198** | fight 3.81 -> 2.59 min; damage taken 11,460 -> 8,298 a run; 198 / 189 / 200 logs move |
| | every other chapter | unchanged | unchanged | 0 logs move |
| **PR-0124** (the worn dressphere carries at a plain seam; KADFC, our estimate) | IV to XV, shipped lines | unchanged | unchanged | **the shipped lines never spherechange before a seam**, so nothing moves |
| | V, "change once" probe | 184 / 85 / 192 | **0 / 0 / 0** | a player who changes each girl on her first turn and never changes back |
| | VI, "change once" probe | 120 / 13 / 177 | **27 / 2 / 98** | the same player |
| all three on | V / VI / XV | as above | V 181 / 89 / 188; VI 165 / 52 / 198; XV 48 / 18 / 112 | the switches do not interact |

What the carry probe means: our chains have **no menu between links**, so under the carry a girl
who changed mid-fight stays in that dressphere for every later link, while in the real game the
player changes back in the menu between battles (that is exactly what KADFC's guide does between the
Chateau fights). The source is about a game with a menu step; our chain has none. So the carry is
harsher here than in the game, not merely "faithful".

**Recommendation for Bailey (plan §8 Q4 rule: turn on each switch whose benches stay inside the band):**
- **IC-1: turn on.** Moves only V (1 Active win) and XV (+12 wins human, +6 %), both toward easier,
  no chapter leaves its band; GameFAQs' reading (D-214).
- **PR-0106: turn on.** Moves only VI, +8 wins human, +21 Active, shorter fights; GameFAQs preferred
  over the wiki on the conflict (D-184 / D-214).
- **PR-0124: keep off and ask again.** Faithful only with a between-link dressphere menu we do not
  have; with it on, a player who changes dressphere mid-chain can lose the chapter outright (V 184 -> 0
  in the probe). The option to put to Bailey: carry plus a between-link Change screen, or keep reverting.

### PR-0107 (Chapter VI Acts II and III open on randomised bars), built OFF by the stop rule

| | off | on |
|---|---|---|
| VI first try, human / Active / bench | 157 / 31 / 195 | **124 / 26 / 183** |
| VI first try, human, as a rate | 78.5 % | 62 % (-16.5 points; within 5, computed: 99.95 % -> 99.2 %) |
| VI "change once" probe | 120 / 13 / 177 | 93 / 13 / 160 |

Sourced (§1.6, single source; §2 separate battles), but it moves Chapter VI 16.5 points at human pace,
outside the 5-point band this batch set in its preflight, so it stays **off** and goes to Bailey. The
numbers are why: with fills at zero the fastest girl always opens Acts II and III; randomised, the
Syndicate sometimes opens first.

### PR-0179: the Gagazet aeon arms (FFX only; plan §8 Q3), the chapters' own benches

Run with `B1_AEON_ARM=<arm> npx vitest run --config tests/unit/helpers/aeon-arm.vitest.config.ts <bench>`.

| Chapter (bench) | shipped (today) | arm a (§6.4.3 everywhere) | arm b (§6.4.3 in I and IX; X, XIV keep D-186) | arm c (b + P3 floor HP in XIV) |
|---|---|---|---|---|
| I Seymour Flux (`strategy-seymour-flux`, four 40-seed windows) | 78 / 160 (seeds 1-40: 17) | 79 / 160 (18) | 79 / 160 (18) | 79 / 160 (18) |
| IX Yojimbo (`yojimbo-bench`, intended line) | 143 / 200 (71.5 %) | 153 / 200 (76.5 %) | 153 / 200 | 153 / 200 |
| X Natus (`natus-shipped-bench`, shipped tactic) | 169 / 200 (84.5 %) | **159 / 200 (79.5 %)** | 169 / 200 | 169 / 200 |
| XIV Isaaru (`isaaru-tactic-bench`, shipped tactic, whole chain) | 125 / 200 (63 %) | **173 / 200 (87 %)** | 125 / 200 | 159 / 200 (80 %) |

Under arm a, Chapter XIV's D-186 figure (125/200) no longer holds: Bahamut's duel against Spathi
(2,935 HP against 1,398) lifts it to 173/200, and Grand Summon Bahamut on Grothia wins 200/200.
Chapter X loses 10 wins (the bigger Bahamut is on the line; the shipped tactic was chosen on 1,398).
Two of Chapter I's pinned single-seed tests (seeds 7 and 20260916, "a documented loss") become wins
under every arm; they would need re-pinning with the arm Bailey picks. **Recommendation: arm a**, as
the method check says (rule 6: sourced rows; every chapter stays winnable, XIV gets easier, X drops
five points); arm c if Bailey wants XIV kept near the shipped difficulty.

## Real-key checks (production build, headless Chromium on the real GPU, port 6100, stopped after)

`vite build` into a scratch folder (not the shared `dist/`), `vite preview` on 6100, driven by
`D:/Tools/pyrefly-scratch/iter2-b1/realkey-ch5b.mjs`. Debug inputs are labelled: links 1 to 4 by
`autoBattle('intended')` at fast playback, then auto-play cleared. 0 page errors in every run.

- **D-217, seed 1 and seed 4:** Shuyin by **real Enter presses** (107 and 95): both lost. The defeat
  panel opens with RETRY focused; one **real Enter** re-entered the battle with `enemyIds = ["shuyin"]`,
  the checkpoint, not the Tail. Frames: `docs/screenshots/iter2-b1/ch5-shuyin-realkey-defeat-seed1.jpg`,
  `ch5-retry-at-shuyin-checkpoint-seed1.jpg`.
- **PR-0138, seed 1, every link by debug auto-play:** the results read **EXP 42,400 x3, AP 120 per
  dressphere, gil 18,300**, items Megalixir x5, Mythril Bangle, Mega-Potion x2, X-Potion x2 (before:
  Shuyin's EXP 0 / AP 20 / gil 0). Frame: `ch5-summed-spoils-seed1.jpg`.
- **Not reached: a Chapter V win by real keys.** Enter-only play loses to Shuyin on seeds 1 and 4.
  The win after the checkpoint retry (debug auto-play) shows **Shuyin's spoils only** (EXP 0), because
  a checkpoint retry starts a new ledger: `ch5-results-after-checkpoint-retry-seed1.jpg`. See open item 3.

## Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| New and touched vitest files | pass: `iter2-b1-rules` (13), `iter2-b1-switches` (16), `iter2-b1-spoils` (6), `iter2-b1-aeons` (7), `leblanc-engine`, `ffx2-ai-vegnagun`, `ffx2-menu-cancel-delay` (2 pins re-pinned, reasons in the file), `fallen-aeons-flow-chain` (Shuyin named in the guard) |
| Full suite `--testTimeout=60000`, once | 495 files pass, 1 fails: `load-time-gates.test.ts` "the board spends only what the title left of the wait", a wall-clock test under full-suite load; it passes alone (12/12). Front-end timing, not touched by B1 |
| `node tools/orphans.mjs` | 24 orphans, the same set as main |
| Files over 400 lines that B1 touched | none left over: `engine.ts` 331, `engine-core.ts` 343, `resolve.ts` 309, `gagazet.ts` 377; `constants.ts`, `setup.ts`, `statuses.ts` under 400. `src/battle/common/types.ts` is the contract file (already 2,667) |
| Browser | headless only, port 6100 only, stopped by PID; no Claude browser pane, no OS input |

One slip, disclosed: while checking PR-0179 on the code stage I ran the four FFX chapter test files,
which include three 200-seed benches (`isaaru-tactic-bench`, `natus-shipped-bench`, `yojimbo-bench`),
before the round-14 capture had finished. They are engine-only unit tests (about 10 s); no browser.

## Contract change (for the driver to write into `docs/CONTRACT-CHANGES.md`)

`src/battle/common/types.ts`, additive: `EnemyGroupDef.opensAsSeparateBattle?: boolean` (FFX-2: a
chained link the source makes a separate battle opens on randomised bars while HP, MP and items carry;
read only while `constants.ts` SEPARATE_BATTLE_GAUGES is on; set on Chapter VI's Acts II and III).
Not contract files but shared signatures: `setupForNextLink(previous, next, state, seed, seam?)` gains
an optional `SeamOptions` (PR-0124's override); `Ffx2EngineOptions` gains `separateBattleGauges` and
`leblancScriptSinirothX` (measurement overrides).

## PR-0053 (paper)

Restated as **withdrawn**. The round-06 record never reached consolidation; seven rounds have carried
it with no expected, observed, repro or evidence, and nothing in `critic/rounds/round-06*` restates it.
Every value the round-06 change set touched was re-audited here against the research and matches:
`BERSERK_MULTIPLIER` 1.25 (§2.8 step 10), the Leg's Berserk at chance 75 (`ffx2-vegnagun-shuyin.md`
line 247) for 133 units = 70.5 s (§2.8 global default), `hasAttack === false` for exactly White Mage,
Black Mage and Songstress. The one Berserk detail the engine does not model is §2.8's "gains STR +1
level in some cases", which the research itself leaves vague; if the lost record was that, it needs a
source for "some cases" before it can be a defect. Recommend closing PR-0053 as withdrawn.

## Open (need Bailey's word, a reading, or another batch's file)

1. **GP-G2 (FFX-2, Alchemist fixed damage):** not built. D-214 says use GameFAQs' reading, but no
   GameFAQs line has been read for it: GameFAQs refuses non-browser fetches (HTTP 403), browser work
   was barred during the capture, and the reading pass is L-4's. The research is silent on whether
   Stash heals roll (`research/ffx2-combat-core.md` §2.9.3 says damage items roll; Potion "recovers 200
   HP"). Needs L-4's read of Split_Infinity / SinirothX, then a one-line data change.
2. **PR-0217 (FFX, Zombie through KO):** not built, same reason (the plan puts it after L-4's read).
3. **PR-0138 after a checkpoint retry:** a retry at a checkpoint (XI's Save Spheres, now also V's
   Shuyin, D-217) starts a new ledger, so the results show only the links fought in the retry (seen
   live: EXP 0 after a Shuyin retry). The fix is two lines in `BattleScreen.ts` (not B1's file): pass the
   won links into `checkpointAt` from `onLink`, and hand `resumeAt`'s stored spoils back to
   `runEncounterChain`. Suggest B5.
4. **Part rows in a link's result (Chapter V):** each link pays every unit with a rewards row, parts
   included, so the Leg link pays its three Nodes' 8,000 EXP each and V totals 42,400 EXP (the critic's
   expected line implies 26,000). Whether the Nodes, Bulwarks and Redoubts pay out when they are not
   killed is unsourced; not changed (rule 6). Needs a reading.
5. **The three FFX-2 switches and PR-0107** (tables above): Bailey's word (plan §8 Q4). Recommendation:
   IC-1 on, PR-0106 on, PR-0124 off unless a between-link Change screen is added, PR-0107 off.
6. **PR-0179 arm** (plan §8 Q3): recommendation arm a; the pinned Chapter I seeds 7 and 20260916 need
   re-pinning with whichever arm is picked.
7. **XV's full carry keeps passed gates** (GP3 = a, Bailey 2026-09-25), while §10.2 says gate
   effects end with a battle. Recorded, not changed: it is an approved rule of that chapter.

## Files

Code: `src/battle/ffx2/{engine,engine-core,resolve,resolve-hp,resolve-targets,results,constants,internal,statuses,active,engineHooks,setup}.ts`,
`src/battle/ffx2/ai/{leblanc-syndicate,vegnagun}.ts`, `src/battle/ffx/setup.ts` (comment),
`src/battle/common/types.ts`, `src/app/screens/{BattleScreenCarry,BattleScreenSetup,BattleEncounterChain,BattleChainSpoils}.ts`,
`src/data/ffx2/enemies/{leblanc-syndicate,leblanc-syndicate-acts,shuyin,shuyin-abilities}.ts`,
`src/data/ffx/builds/{fahrenheit,gagazet,gagazet-kit,gagazet-aeon-arms,highbridge,via-purifico}.ts`.
Tests: `tests/unit/iter2-b1-{bench,rules,switches,spoils,aeons}.test.ts`, `tests/unit/helpers/aeon-arm-{setup.ts,vitest.config.ts}`,
plus the re-pins and renames named above. Paper: `docs/plans/iter2-b1-review.md`, this file.
Scratch (not committed): `D:/Tools/pyrefly-scratch/iter2-b1/` (bench outputs, hash files, the
real-key scripts, a scratch build and a base-commit export with a `node_modules` junction; unlink the
junction with `rmdir` before deleting that folder).

## CHECK (independent, 2026-09-27; the checker did not build B1)

Head `465a9459`, worktree `D:/pyrefly-iter2-b1` (junctions recreated for the check, links removed after).
Round-14 capture done file present before any browser or bench work. Production build into a scratch
folder (not the shared `dist/`), `vite preview` on **6110**, headless Chromium on the real GPU, server
stopped by its PID. Scratch: `D:/Tools/pyrefly-scratch/iter2-b1-check/` (logs, frames in `shots/`).
Game case of the check: **both** (FFX-2 engine and data; FFX builds and the shared chain loop).

**Verdict: 0 blockers.** Everything the handoff claims reproduces, with the corrections below.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| Full `vitest run --testTimeout=60000`, once | **496 files pass, 5 skipped, 0 fail** (8,619 tests; the `load-time-gates` flake did not recur) |
| `node tools/orphans.mjs` | 24 orphans, the same count as main |
| Byte identity, independent base | my own export of `0bf77169` against the branch, arm off, 200 seeds x 3 paces x IV, V, VI, XI, XIII, XV, outcome + log hash per seed: win counts identical everywhere; logs moved only on V (6 / 22 / 6) and VI (1 / 15 / 0), **every moved log a defeat in both trees** (PR-0145); IV, XI, XIII, XV 0 moved |
| Switch arms (200 seeds) | reproduced exactly: IC-1 V 181 / 89 / 188, XV 48 / 18 / 112, others unchanged; PR-0106 VI 165 / 52 / 198; PR-0107 VI 124 / 26 / 183; PR-0124 "change once" V 184 / 85 / 192 -> 0 / 0 / 0, VI 120 / 13 / 177 -> 27 / 2 / 98 |
| PR-0179 arms | reproduced exactly (IX 143 -> 153; X 169 -> 159 under a; XIV 125 -> 173 under a, 159 under c) |
| PR-0174, real keys | title -> board -> ArrowRight -> Enter: VIII prep shows **Rikku S.LV 41**, X prep **Rikku S.LV 41** (`shots/prep-Evrae.jpg`, `prep-Natus.jpg`) |
| D-217, real keys, seed 2 (a seed the builder did not use) | links 1-4 by debug auto-play (labelled); Shuyin by real Enter lost after 183 presses; one real Enter on RETRY re-entered with `enemyIds = ["shuyin"]` and the **same carried HP** as the first entry (Yuna 2,488, Rikku 3,954, Paine 4,642) (`shots/d217-*.jpg`) |
| PR-0138, debug auto-play (labelled) | XI reads **EXP 23,000 / AP 54 / gil 7,000**, Shiva's 8,000 and 2,000 included, Tetra Band listed; VI reads 1,640 / 14 / 1,590 summed over the Acts |
| FFX regression (shared chain loop) | III reads AP 0 / gil 0 (the last link, as before); II reads AP 14,000 / gil 9,000 (the last link); 0 page errors in every run |
| Mockups | B1 has no picked visual item; nothing to compare |

**Findings**

1. **PR-0138, Chapter V's total (major, not a blocker; introduced as a visible number, not a
   regression: live shows 0).** V's 42,400 EXP / 18,300 gil includes rows of parts that are never
   killed: the Leg link's three Nodes (8,000 EXP / 3,000 gil each; research: "the Nodes are not meant
   to be killed") and the Body link's two Bulwarks (200 / 150 each). `results.ts buildResult` pays every
   enemy unit with a rewards row, alive or not. Round 13's acceptance expects the link rows
   (5,000 + 6,000 + 7,000 + 0 + 0 = 26,000 EXP, 12,000 gil). The V unit test in `iter2-b1-spoils` sums
   the engine's own per-link results, so it cannot catch this; it should pin the sourced totals once
   the rule is decided. Needs a reading or Bailey's word (pay killed units only / skip parts); the
   drops list has the same question.
2. **House rule 7 (minor).** `src/battle/ffx/setup.ts` is **402** lines (399 at `0bf77169`); PR-0069's
   comment pushed it over 400. The "none left over" line in Checks above is wrong for this file. A
   two-line trim of the comment fixes it.
3. **PR-0179 table for Bailey (minor, decision input).** Under **arm c** the Chapter XIV bench's own
   assertion fails (`isaaru-tactic-bench.test.ts:66`: shipped line 159 < "sourced order as written"
   163), so picking c also means re-choosing XIV's tactic. Under **arm a** XIV's other lines collapse
   (sourced order 98 -> 33, Shield-at-full 50 -> 17) while Grand Summon Bahamut goes 124 -> 200; the
   fight becomes one-line. Both belong in the §8 Q3 table beside the shipped-tactic numbers.
4. **PR-0124's probe overstates (minor, decision input).** The "change once" bot turns all three girls
   into Gunners on their first turn and never changes back, even mid-battle; the 0 / 200 on V is the
   Body link's Bulwarks countering three Gunners' physical attacks (seeds 1 and 2 lose in link 3). A
   player can spherechange mid-battle, so "can lose the chapter outright" is the bot, not the rule.
   Keeping the switch off is still sound (no between-link menu); the stated reason should say this.
5. **Still open (carried, as the handoff says):** no Chapter V win by real keys (Enter-only also lost
   on seed 2); a checkpoint retry shows only the retried links' spoils (B5); GP-G2 and PR-0217 wait on
   L-4's GameFAQs read; the contract entry for `EnemyGroupDef.opensAsSeparateBattle` is the driver's.
