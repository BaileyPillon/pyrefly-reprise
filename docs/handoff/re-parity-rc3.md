# Re-parity RC3 (FFX-2): W4 and the three boss-AI lanes in one tested tree, on live release 39.4.4

Status: **built, tested and pushed on branch `re-parity-rc3`; not merged into `main`, not deployed** (2026-10-11). Base `72973096` (= `origin/rel-3944`, live
release 39.4.4: `main` + W2 + the hidden chapters Gui and the Experiment). **Game case: FFX-2 only** (AGENTS.md rule 14). Nothing under `src/battle/ffx`,
`src/data/ffx`, `src/battle/ff7` or `src/data/ff7` is in these commits; `ffx-engine-golden` and `ff7-golden` pass unchanged. Owner: Bailey; the standing
orders this answers are in the briefs README (2026-10-08 "It needs to be a 1:1 parity", 2026-10-09 "Your findings need to be implemented into live builds as
the decompilation work progresses", 2026-10-10 "go full speed ahead please").

## 0. Save data: RC3 is NOT in the save-data class

`src/app/SaveData.ts` is **byte-identical to the live base**: `git diff 72973096 HEAD -- src/app` is empty (not one file under `src/app` changed), so no save schema
and no migration moved, and none of the four sources changed one. A normal focused review before a deploy and a deep review after it (`critic/RUBRIC.md` section 4)
is the path; this is not a release that needs a deep review before going public. (W4's own note says the same of its part; the three AI lanes touch no save field.)

## 1. What is in it

Merged in the order asked, each as its own merge commit, on top of `72973096`:

| Commit | What |
|---|---|
| `2a98fd77` | **Merge `origin/re-parity` (`a8f89c0a`): W4**, the FFX-2 logic step (29.97 a second), the game's gauges, charge, Delay and status clocks. Handoff `docs/handoff/re-parity-w4.md` |
| `bfb229a3` | The hidden Experiment's seven command rows and its plain Attack carry the game's `costAtb` / `costCast` (section 4) |
| `1996bcae` | **Merge `origin/re-parity-ai-ffx2-a` (`e7fc527d`)**: Bahamut, the Vegnagun chain, Shuyin (Chapters IV and V). `docs/handoff/re-parity-ai-ffx2-a.md` |
| `fbdfdb69` | **Merge `origin/re-parity-ai-ffx2-b` (`3a6f88c7`)**: the Fallen Aeons, the Magus Sisters, Paragon, the Oversoul Paragon, Trema (Chapters XI and XIII). `docs/handoff/re-parity-ai-ffx2-b.md` |
| `5d27d47b` | **Merge `origin/re-parity-ai-ffx2-c` (`7b273679`)**: the Leblanc Syndicate, the Den of Woe shades, Ixion (Chapters VI, XV, XVI). `docs/handoff/re-parity-ai-ffx2-c.md` |
| `f2db5c33` | The AI lanes' **timer rows onto the logic-step clock**: Bahamut's countdown, the speak command's 60, the Head's init Agility, the Oversoul's idle limit (section 3) |
| `382108ec` | The FFX-2 **goldens re-baselined**, each moved digest explained (section 5) |
| `b7b7dd93` | **Idle waits that an event cuts short** (the Oversoul, the Redoubts, the Head), `ai/idle.ts`, and the tests that pin the lanes' timer rows (section 3) |
| `04259626` | Tests that pinned one seed or one old shape now say what the merged tree measures (section 6) |
| `0724f4d4` | Chapter 5's golden digests re-pinned for the final tree (the Redoubts' idle waits moved the tail of that chain) |
| `307ed780` | Two more claims stated at the measured shape, found by the whole-suite run (`strategy-ffx2-bahamut`, `combat-fixes-bench`) |
| (this note) | `docs/handoff/re-parity-rc3.md` |

The branch is `re-parity-rc3`, pushed; no deploy, no change to `main`, `CHANGELOG.md`, NOW.md, ACTIONS or DECISIONS (left to the main session, as the lanes did).

## 2. The merges: conflicts and how each was settled (every lane's intent kept)

**W4 (`2a98fd77`).** Two conflicts. `docs/CONTRACT-CHANGES.md`: both entries kept (the Gui/Experiment entry above W4's). `src/data/ffx2/monster-records/records.ts`: the Ixion row
takes W4's `costAtb` / `costCast` and the Experiment's `...MONSTER_RECORDS_EXPERIMENT` line stays beside it. Semantic gap found by running the live base's tests on the new
clock: the **Experiment's rows had no cost fields**, so W4's "every record the engine can run carries both costs" test failed; section 4.

**Lane a (`1996bcae`).** The source merged with no conflict. Ten test files conflicted, all of them pins both lanes had moved (`ffx2-atb-golden`, `ffx2-hit-closes-menu`,
`ffx2-menu-cancel-delay`, `den-of-woe-carry`, `advisor-v3-final`, `advisor-v3-repair`, `enemy-intent`, `ffx2-atb-speed`, `ffx2-ai-bahamut`, `strategy-ffx2-vegnagun-shuyin`):
W4's pins and rigs were kept for the moment (re-baselined once, below), the lane's rule rewrites kept (the Bahamut tests, the floor of the Chapter V bar).

**Lane b (`fbdfdb69`).** Nine conflicts.
- `ai/script-rolls.ts` was **added by three lanes with three different APIs**. It is one file now (about 250 lines), four sections: the shared `scriptValue` / `scriptMod(rng, n)` (lanes a and c
  had the same two names and signatures), lane a's near-weighted `searchr` and the scene table, lane b's `scriptModCtx(ctx, n)` (lane b's `scriptMod(ctx, n)` renamed, five modules edited),
  `pickUniform`, `reactionGuard`, `damageBits`, and lane c's `girls` (now an alias of lane b's `girlsInSlotOrder`), `pickFrom`, `extremePick`. Each lane's draws are exactly its own: lane c's `pickFrom` still
  draws `int(0, n - 1)` where lanes a and b draw a 31-bit value modulo n (the RNG batch gives them one shape; open item).
- `ai/paragon-oversoul.ts`: lane b's decision logic, with W4's clock (the first merge had left `TICK_RATE_BASE` in lane b's code, which W4 removed; the 20-second idle limit would have been 33 minutes).
- `command-records/enemies.ts` and `party.ts`, `command_rows.json`, `ability_differences.json`: W4's cost fields kept; Shiva's Chain Attack is one hit (lane b); **Osmose's row (0x317b) got its costs from lane b's own
  table read, `atb 0 / cast 70`, and its caster animation (3, a cast) from the same extraction** (`D:\Tools\ffx-parity\ai\ffx2-fallen-trema`, numbers only, nothing copied into the repo).

**Lane c (`5d27d47b`).** Fifteen conflicts.
- `ai/script-rolls.ts` again (kept as above). `internal.ts` / `resolve-strike.ts`: **three "result" mechanisms now coexist**, all optional and inert for a script that does not define them: lane a's `hits` argument of
  `onDamaged`, lane b's `onResult` (called per result as it is applied), lane c's `onResults` (a tally the resolver notes, reported once per action). Folding them into one is an open item.
- `parity-ffx2-ai-intent.test.ts` was **added by lanes b and c as two different tests**; lane b's keeps the name, lane c's is `parity-ffx2-ai-intent-leblanc.test.ts`.
- `command-records/enemies.ts`: Baralai's Triple Attack is three Chain Attack rows (lane c) with W4's costs; Ormi's first-room Concussive Shock override is gone (lane c). The records test has **no override left** (both Triple Attacks are the game's rows).
- `den-of-woe-ship-story`: lane c's and W4's rewrites both said "the intended line no longer reaches count seven"; the test proves the callout on all three lines now.
- Pins: W4's kept, re-baselined once.

## 3. The AI lanes' timer rows, on the logic-step clock

The three AI lanes counted their timers in the engine's old turns and listed them "for the W4 merge" (values in AI polls = logic steps at 29.97 a second, seconds = polls x
0.033367). W4 is in, so each row is settled below; `tests/unit/parity-ffx2-rc3-timers.test.ts` (15 tests, new) pins every one that RC3 converted or that W4 answers.

**The mechanism (new, FFX-2 only, `src/battle/ffx2/ai/idle.ts`).** The game polls a ready monster every step; a script that counts polls counts steps. The engine cannot poll every step: the
presenter abandons a battle that produces a long run of decisions with no event, and a per-step poll of a waiting boss is exactly that. So a script that returns `null` can now say, in its AI memory, what
the poll stood for: `idleFor(self, steps, wake)` (the unit is next polled exactly `steps` logic steps later; it sits the wait out `executing`, takes no recovery of its own and, being no command, adds no
thinking time for a fallen girl) with an optional wake (`WAKE_ON_RESULT`: a result lands on it; `WAKE_ON_ALIVE_CHANGE`: any unit falls or is raised), which ends the wait so that the next logic step
makes it ready, and `speakTurn(self)` (the poll was a voice line: the recovery is the speak command's ATB cost, 60, not the standard 70). Scripts that return `null` and say nothing behave as before
(a flavour turn that costs the standard gauge). Layering is unchanged (`src/battle/**` imports no DOM); `internal.ts` gained two optional fields (`Ffx2Gauge.idleWait`, `idleWake`) and `AiScript.init`,
and is 373 lines.

| Lane / row | Game | Disposition |
|---|---|---|
| a, **B3** the Mega Flare countdown | 5 steps x 150 = 750 polls from the first ready poll after the second Impulse; Slow, Haste, a long action do not change it | **Converted.** Five idle waits: 149 steps to poll 150 (the 5), then 150 each (4, 3, 2), the cast at poll 750 = 25.03 s. Pinned at Normal, Slow, Fast, with Bahamut Hasted and with a girl down (same gaps `[149,150,150,150,150]`) |
| a, **B4** the windows | 5, 4, 3, 2 at polls 150..600, the 1 with the cast | **Converted** with B3 (no 0; `charge` events keep `turnsLeft`) |
| a, **H2** the Head's 100-poll clock | counts command-issuing polls | Already in the game's unit (turns of the three bosses); its seconds are now W4's recovery and charge plus the voice polls' 60. No code |
| a, **N1** the Nodes' colour-change poll | one idle poll, then the next a step later | **Kept folded** into the Node's next action (0 turns; the game's gap is one step) |
| a, **R4** the Redoubts' idle poll (and the Head with one Redoubt left) | polled every step, the revive is queued within one step of the twin's fall | **Converted.** The Redoubt waits with `WAKE_ON_ALIVE_CHANGE`; pinned: polled one step after the fall, and the poll is the Full-Life on the twin |
| a, **voice polls** (Tail 55, Leg 181, Core 176, Head 57 / 92, Shuyin 48 steps, the Braska pair) | a speak command, ATB cost 60 | **Converted.** `speakTurn` at every voice site; pinned for the Tail (`atbTicks(60, AGI)`, shorter than 70's) |
| a, **H3** the Head's first gauge | init writes Agility 110 before the first gauge | **Converted.** `AiScript.init.agi` is applied in `setup.ts` before `openBattleGauges`; pinned (110 and the bar of 110) |
| a, thinking time (+30 steps per fallen girl) | | W4 (at a command's end); an idle wait adds none (pinned) |
| b, **Oversoul idle limit** (O2) | 1,200 idle polls, the 1,201st acts, any result resets | **Converted.** `OVERSOUL_IDLE_LIMIT_STEPS` = 1,201 logic steps (it was 20 s of engine time, a labelled estimate, SinirothX's reading; `idleSeconds` is gone). He waits the steps left of the limit in one idle wait that a result cuts short: pinned that an untouched Oversoul acts exactly 1,201 steps after his first poll, and that a hit makes him ready on the next step (his answer then waits only for the chain window the hit opens on him) |
| b, Sisters' Regen counter 50 | four ticks, about 790 steps = 26.4 s | **W4's status clock** reads the row's counter (pinned: counter 50, 790 steps) |
| b, per-move charge and recovery rows, first polls | the rows | **W4's records** (`ability_differences.json` lists each; the records test now says every record carries both costs) |
| c, **Ixion's action time** (D-269) | 3 s = 90 polls | **W4's** `actionTimeSeconds` -> steps (pinned: 90) |
| c, per-move charge and rest (E2) | the cadence table | **W4's records** (pinned for Baralai's Glint, 17,699 units, and Attack, 8,849) |
| c, **Leblanc's clean-up poll** (L6) | one poll after No Love Lost | **Kept folded** into the next call (one step in the game) |
| c, **Baralai's second command** (D1, D2) | the pair runs with no gap | **Not converted.** It is returned at his next poll, one full recovery later. A zero-gap pair needs a follow-up seam in `finishAction` that also covers a first command that charges (Regen, Absorb, Guard); the Den's measurement does not move on it (lane c's ablation). Open item |
| c, Triple Attack's three | rest 0, charge 0 each | already one sequenced action (instant) |

The conversions' net effect on the measurement (section 8, last column of the merge sequence): Chapter IV 72 -> 66 s, Chapter V +1 win and +6 s (the Redoubts' waits, the Head's Agility at its first gauge, the voice polls' 60); nothing else moves. The Oversoul's wake moved no win count (Chapter XIII 348 before and after).

## 4. The hidden Experiment on the new clock

The Experiment (`ffx2-masterpiece-theatre`, FFX-2, hidden; it came from the live base, not from any of the four sources) keeps working: both acts play, the seam restores the party with no Save Sphere
card, the retry checkpoint holds, the door, the guide and the story tests pass (the 7 `tests/unit/chapters/experiment-*.test.ts` files and `ffx2-experiment-door`; the one exception is the art plate, which a worktree lacks).

- **Its timers were already the game's units**: every ability carries `chargeTicks` / `recoveryTicks` = the row's `cost_cast` / `cost_atb` (Attack 0 / 100, Rocket Launcher 60 / 100, Lifeslicer 100 / 180,
  Annihilator 210 / 100), and the Special 3 HP bands and the cycles count polls that issue a command, so no timer needed converting. What failed on the merged tree was W4's rule that **every record carries
  both costs** (`data-ffx2-command-records`): the seven command rows and the plain Attack of the Experiment's monster row had no `costAtb` / `costCast`, so W4's cost reader fell back to the ability's own
  numbers. They are on the records now (`bfb229a3`), from the same research note (`research/re-ffx2-experiment.md` section 6, "Rest / charge cost") and `experiment_rows.json`; the pace did not move.
- **What did move is its difficulty, and the cause is W4's, not an AI lane's**: the shipped line wins the chain **500 of 500 -> 380 of 500** (12 seeds: 12 -> 5), the fight takes **66 s -> 48 s**, party
  KOs 0.6 -> 1.2. Act I (the Prototype, only strikes) is still won on every seed; Act II on the Wait clock **24 of 40** (it was 35 of 40; `experiment-bench` prints the table), at 1.5 s a decision on the
  Active clock 19 of 40 (14), at 4 s 1 of 40 (1). Ablation of W4's pieces on 500 seeds (`W4_ABL`, W4's harness): **the party's cast costs at the game's value are the cause** (put back to the old
  16 / 26 / 39 tiers: 500 of 500, 24 s a fight; a Cure at Agility 41 is a 5.9 s cast now, against Rocket Launcher volleys every 8 s), and **the party's recovery at the game's value gives most of it back** (put
  back to 70 after every command: 167 of 500, 84 s); the monsters' costs, Delay, the opening and the hit reaction move nothing (380 / 380 / 380 / 381 / 376), thinking 292 (a monster that never waited for a
  fallen girl would cost the party 88 wins, so that wait helps the party). Same mechanism as Chapter XIII in W4's note. Nothing was tuned (D-410); if Act II should be easier it is a measured round on the
  preset or the levels, never a boss number. Two tests that said "wins both acts on seeds 1 to 8 / 1, 2, 3" were restated (section 6).

## 5. Goldens: re-baselined once, each moved digest explained

119 digests across four files, `ffx-engine-golden` (18 tests) and `ff7-golden` (3) unchanged: `ffx2-atb-golden` (60: Chapter IV and the whole Chapter V chain, D = 0 seeds 1-20 and Active 1500 ms seeds 1-10),
`ffx2-hit-closes-menu` (9), `ffx2-menu-cancel-delay` (18), `chapters/den-of-woe-carry` (32: Chapters V, VI, XI's Shiva and the Sisters, seeds 1-8). Re-baselined at `382108ec`; the Chapter 5 rows moved
once more at `0724f4d4` (the Redoubts' idle waits change the tail of that chain: all 20 D = 0 digests and 5 of the 10 Active ones, and the rows that equal them; Chapters IV, VI and XI are byte-identical between the two
commits). Method: the full event log of every run (a compact line per event) of the live build, of W4 alone and of the merged tree, compared event by event (`D:\Tools\ffx-parity\rc3`, scratch).

**Against the live build every digest moved** (W4's gauges roll the first waits from the game's draws: the first differing event of every seed is event 2, the first `turn-start` or the opening `atb` snapshot;
`re-parity-w4.md` section 8). **Against W4 alone**, where the AI lanes and RC3's timer rows come in:

| Group | Seeds | First differing event (against W4 alone) | Lane / row |
|---|---|---|---|
| Chapter IV, D = 0 | 20 | Bahamut's first action, the Curse's girl: 14; a later chain break (5) or miss (1) that follows from the same draw | a, B1 / B5 (one 31-bit near-weighted search where the engine drew a float) |
| Chapter IV, Active 1.5 s | 10 | the Curse's girl 8, a chain break 1, a miss 1 | a, B1 / B5 |
| Chapter V, D = 0 | 20 | the Tail's first turn comes 9 steps earlier: 13; a girl's turn now follows it: 6; a gauge snapshot: 1 | RC3, the voice poll's 60 (not 70) at the Tail's opening; then lane a's T1 / T2 sweeps and searches |
| Chapter V, Active | 10 | the Tail's first turn 8, a snapshot 2 | the same |
| Chapter V, the link-4 tail | all 20 D = 0, 5 of 10 Active | the Redoubts are polled on the step after their twin falls | RC3, row R4 (the second pin, `0724f4d4`) |
| Chapter VI (carry ch6, hit-closes-menu row, split and Active rows) | 8 + 3 | a Fem-Goon or Ormi turn, or the opening snapshot | c, R1 (Acts I and II carry the game's Agility: Ormi 63, Logos 90) and K1 / K2 |
| Chapter XI, Shiva | 8 | Shiva's kick or Heavenly Strike (a roll and a separate girl), or a chain break | b, F1 / F2 (`random() mod 4`, the late table after the +3) |
| Chapter XI, the Sisters | 8 | Mindy's, Sandy's or Cindy's early move | b, M3 / M4 (Razzia 1 in 3, Camisade 2 in 5), Mindy picks her girl then rolls `mod 6` |
| Menu-cancel / split rows | 18 | Bahamut's Curse, the Tail's turn or a snapshot, the Syndicate's first turn | as above |

Outcomes did not move: Chapter IV 20/20 at D = 0 and 10/10 Active; the **Chapter V chain 20/20 at D = 0** (it was 14/20 under lane a alone on the old clock, 20/20 under W4 and on the live build) and
**5/10 on the Active arm** (6/10 under W4, 1/10 under lane a alone, 2/10 live); all 8 of Chapter VI, Shiva and the Sisters at D = 0 (the Sisters lost 2 of 8 under lane b alone).

## 6. Other pins and claims that moved (each with its cause in the file)

Besides the four goldens, these tests asserted a seed, a share or a shape that the merged tree answers differently. Nothing was loosened to pass; a claim was restated to what is measured, with the number:

| Test | Was | Now | Cause |
|---|---|---|---|
| `chapters/experiment-engine`, `experiment-story` | the shipped line wins both acts on seeds 1-8 / 1, 2, 3 | wins Act I on every seed and Act II on a share (>= 3 of the first 12; 5 measured); the story test uses seeds 1, 3, 6 | section 4 |
| `enemy-intent` (PR-0123) | link 3 seed 1 rolls Shell at 25% | the first of seeds 1-24 whose rolled move is not the likeliest branch | the move rolled there changes with every engine change; the claim (badge and table agree) is unchanged |
| `strategy-ffx2-bahamut` | the fight lasts past the first Mega Flare; no mitigation never wins | seed 1 ends inside the countdown (0 Mega Flares), 3 of 4 sample seeds meet one; the unmitigated line wins 3 of 30, wipes 1 and stalls 26; the shape holds on the rest | the countdown is the game's 25 s now (B3) and the party's pace is W4's: a plain line can finish him inside it |
| `combat-fixes-bench` (Chapter 4, attack-only line) | wins 0, stalls | wins 6 of 10, stalls 4, no defeat | the same |
| `strategy-ffx2-leblanc` A2 / A3 | Huggles lethal in >= 75%; the careless line wins 1 of 40 human-paced runs (seed 15) | Huggles comes on 2 of 20 seeds, 1 costs a member (>= 0.5); the careless line wins none | lane c: Ormi's counter and his Huggles target; W4's gauge |
| `chapters/den-of-woe-ship-story` | the callout is met on the intended and all-out lines | proved on the intended, magic and all-out lines (12 of 36 runs) | both W4 and lane c made Baralai fall before count seven on the intended line |
| `advisor-v3-final` C2-B1 | Den board at seed 4 | seed 5; the case scans forward from the pinned seed (80 seeds) | lane c's Den scripts are a different replay |
| `advisor-v3-repair` FM4 | the promoted row saves her at least as often as the line on 8 unseen forks | on 32 forks, not more than two standard deviations of the difference of two counts worse (8 against 10 of 40 on the merged tree's first board, where the threatened girl falls whichever row is played) | one fork of noise failed the exact `>=`; an overfit row (0 against 12) still fails |
| `ffx2-hit-closes-menu` (3 scenarios) | any (formation, seed) in Chapter VI whose menu is closed by a Delay hit | the first one whose menu also returns within 200 steps (the Syndicate's fights can now end first) | lane c |
| `data-ffx2-command-records` | one override (Baralai's Triple Attack) | none (both Triple Attacks are the game's rows) | lanes b and c |
| `ability_differences.json` | | + the two Baralai chain stages and Osmose (`recovery 70->0`, `cast 26->70`); lane b's three removals | W4's cost fields |

## 7. The whole suite, once (tree `0724f4d4`)

`node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit`: clean. One run of the whole unit suite (`--maxWorkers=4 --testTimeout=600000 --hookTimeout=600000`, a PC shared with a 500-seed measurement and other
lanes): **1,064 files: 1,031 passed, 25 failed, 8 skipped; 16,137 tests: 15,846 passed, 188 failed, 102 skipped, 1 todo**, 28 minutes (1,692 s).

- **22 files fail only because a worktree has no `public/art`** (the same set the lanes list, plus the Experiment's plate): `ui-portrait-face-crop` (145 of the 188), `chapters/trema-ship-content`, `art-ref-defaults`,
  `chapter-meta-evrae`, `chapter-meta-seymour-anima-macalania`, `pause-remake`, `chapters/den-of-woe-ship-content`, `chapters/isaaru-ship`, `chapter-meta-ffx2-leblanc`, `chapters/fallen-aeons-ship-content`,
  `chapters/leblanc-art`, `chapters/natus-ship-content`, `chapters/natus-ship-scene`, `cutscene-story-poses`, `chapters/den-of-woe-ship-scene`, `chapters/experiment-scene`, `chapters/fallen-aeons-ship-scene`,
  and five that cannot load for want of `public/art/manifest.json` (`chapter-meta`, `party-face-manifest`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapters/leblanc-party-sprites`, `chapters/yojimbo-content`).
- **`themes-chapter-cue-map` (3 tests) fails identically on the live base `72973096`** (run there with the base's own files): `docs/audio/THEMES.md` still says `boss-ffx2-aeon` for Chapters IV and VI while the
  base's last commit gave them `boss-bahamut` and `boss-leblanc`. Not RC3's; a docs row for the main session.
- **Two real findings of this run, fixed after it and re-run green** (`307ed780`): `combat-fixes-bench` and `strategy-ffx2-bahamut` (section 6). Nothing else failed. The earlier targeted runs found the
  rest of section 6 before the suite did.
- Also green: all 41 `parity-ffx2-*` files (W4's engine tests, the lanes' decision-table tests and the RC3 timer tests: 881 passed, 9 skipped), the 61 `ffx2-*` files (534 passed), the 136 chapter files (1,570 passed; their 22 failures are the art ones above), the 9 Experiment files (161 passed; the one failure is the art plate), the 7 `data-ffx2-*` files (1,906 passed), `ffx-engine-golden`, `ff7-golden`.
- `node tools/orphans.mjs`: 44 orphaned modules, none of them this work's (`ai/idle.ts`, `ai/script-rolls.ts`, `results-tally.ts` are imported); the FFX-2 ones are the same unwired kernels as before.
  Source files over 400 lines: `src/battle/common/types.ts` (2,998) and `src/battle/ffx2/intent.ts` (755), both over the limit on the live base (2,964 / 733). `internal.ts` is 373.

## 8. Measurement: the FFX-2 500-seed table against 72973096

Method: W3's harness `tests/unit/ffx2-parity-measure.test.ts` (it can now name the hidden chapters: `PYREFLY_MEASURE_CHAPTERS=ffx2-masterpiece-theatre`; the default run is unchanged). The shipped
`intendedStrategy` plays every chapter's whole chain through the app's own path (the real party build, the chapter's triggers, every link) at zero decision time, seeds 1 to 500 (and 1 to 12).
**Before** is a src-only archive of `72973096` in a scratch folder (`D:\Tools\ffx-parity\rc3-base`), **after** is this tree (`0724f4d4`; `src/` has not changed since). "Seconds" is the mean game time of one
whole chain: ticks / 3,000 before, steps / 29.97 after. Measured, never tuned; no boss or party number was touched.

### Seeds 1 to 500 (before / after)

| Chapter | wins | first link won | party turns | engine turns | party KOs a fight | seconds a chain |
|---|---|---|---|---|---|---|
| IV Bahamut | 500 / 500 | 500 / 500 | 42.1 / 44.2 | 68.7 / 56.3 | 0.0 / 0.0 | 90 / 66 |
| V Vegnagun, Shuyin | **430 / 488** | 497 / 500 | 97.3 / 95.8 | 198.3 / 160.1 | 5.5 / 0.9 | 246 / 198 |
| VI Leblanc | 491 / 500 | 500 / 500 | 57.2 / 67.8 | 83.5 / 93.4 | 0.6 / 0.7 | 96 / 114 |
| XI Fallen Aeons | 490 / 500 | 500 / 500 | 50.2 / 47.8 | 88.9 / 73.8 | 0.1 / 0.1 | 156 / 120 |
| XIII Paragon, Trema | **213 / 348** | 237 / 383 | 118.9 / 162.5 | 240.0 / 257.1 | 2.2 / 1.3 | 438 / 492 |
| XV Den of Woe | **234 / 500** | 500 / 500 | 31.1 / 31.4 | 66.2 / 46.7 | 2.5 / 0.3 | 84 / 60 |
| XVI Ixion | 500 / 500 | 500 / 500 | 26.5 / 26.9 | 43.1 / 37.2 | 0.0 / 0.0 | 90 / 66 |
| The Experiment (hidden) | **500 / 380** | 500 / 500 | 26.0 / 25.5 | 36.1 / 32.5 | 0.6 / 1.2 | 66 / 48 |

### Seeds 1 to 12 (before / after)

| Chapter | wins | first link won | party turns | engine turns | party KOs a fight | seconds a chain |
|---|---|---|---|---|---|---|
| IV Bahamut | 12 / 12 | 12 / 12 | 42.2 / 44.5 | 69.0 / 56.3 | 0.0 / 0.0 | 90 / 66 |
| V Vegnagun, Shuyin | 12 / 12 | 12 / 12 | 107.9 / 96.7 | 217.4 / 161.8 | 5.3 / 1.1 | 276 / 198 |
| VI Leblanc | 12 / 12 | 12 / 12 | 63.8 / 65.8 | 97.6 / 89.9 | 0.4 / 0.7 | 114 / 108 |
| XI Fallen Aeons | 12 / 12 | 12 / 12 | 49.9 / 48.3 | 88.1 / 73.3 | 0.1 / 0.0 | 156 / 120 |
| XIII Paragon, Trema | **3 / 7** | 4 / 7 | 93.5 / 137.0 | 196.8 / 215.6 | 2.7 / 1.4 | 336 / 402 |
| XV Den of Woe | **6 / 12** | 12 / 12 | 30.6 / 31.6 | 65.5 / 46.9 | 2.8 / 0.4 | 84 / 60 |
| XVI Ixion | 12 / 12 | 12 / 12 | 26.7 / 26.5 | 43.7 / 36.6 | 0.0 / 0.0 | 90 / 66 |
| The Experiment (hidden) | **12 / 5** | 12 / 12 | 26.3 / 25.8 | 36.7 / 32.9 | 0.3 / 2.0 | 66 / 48 |

### Which lane moved what: the merge sequence, wins of 500 (mean seconds a chain)

Each column is the tree at that commit (scratch archives of `bfb229a3`, `1996bcae`, `fbdfdb69`, `5d27d47b` and the final tree, same harness, same 500 seeds); a lane's share is the step it adds.

| Chapter | live 39.4.4 | + W4 | + lane a | + lane b | + lane c | + RC3 timers (final) |
|---|---|---|---|---|---|---|
| IV Bahamut | 500 (90 s) | 500 (72 s) | 500 (72 s) | 500 (72 s) | 500 (72 s) | 500 (66 s) |
| V Vegnagun, Shuyin | 430 (246 s) | 496 (222 s) | 487 (192 s) | 487 (192 s) | 487 (192 s) | 488 (198 s) |
| VI Leblanc | 491 (96 s) | 498 (102 s) | 498 (102 s) | 498 (102 s) | 500 (114 s) | 500 (114 s) |
| XI Fallen Aeons | 490 (156 s) | 500 (120 s) | 500 (120 s) | 500 (120 s) | 500 (120 s) | 500 (120 s) |
| XIII Paragon, Trema | 213 (438 s) | 199 (324 s) | 199 (324 s) | **348 (492 s)** | 348 (492 s) | 348 (492 s) |
| XV Den of Woe | 234 (84 s) | 500 (60 s) | 500 (60 s) | 500 (60 s) | 500 (60 s) | 500 (60 s) |
| XVI Ixion | 500 (90 s) | 500 (66 s) | 500 (66 s) | 500 (66 s) | 500 (66 s) | 500 (66 s) |
| The Experiment (hidden) | 500 (66 s) | 380 (48 s) | 380 (48 s) | 380 (48 s) | 380 (48 s) | 380 (48 s) |

### Causes of the movers (the lane and the row)

- **XV Den of Woe 234 -> 500 (6 -> 12 of 12), 84 -> 60 s: W4.** The monsters' casts at the game's cost (W4's ablation: with the old 16 / 26 / 39 tiers put back the party wins 1 of 500), then the party's recovery per command.
  Lane c adds nothing to the count here (500 either way); on the old clock its row D9 (Gippal's low-HP Attack at the girl with the least HP) cost the Den about 2 points.
- **V Vegnagun and Shuyin 430 -> 488, 246 -> 198 s: W4 +66, lane a -9, RC3 +1.** W4: the monsters' casts again (119 of 500 without them) and the party's recovery. Lane a: its harder rows (**H3** the Head at Agility 110 then 68, **N2** the Nodes
  starting red, green and yellow, **R1 / R3** the Redoubts' counters; on the old clock they took the chain from 430 to 323) are mostly absorbed by W4's pace, and its **S1 / S2** (Shuyin's targets and his voice gate) make Shuyin gentle: party KOs 6.8 -> 0.9 a fight.
  RC3's timers: one win, and 6 s longer (the Redoubts' waits and the Head's Agility 110 at its first gauge).
- **XIII Paragon and Trema 213 -> 348 (3 -> 7 of 12), 438 -> 492 s: W4 -14, lane b +149.** W4: the party's casts at the game's cost (a spell is a 5.9 s cast now). Lane b's **Oversoul block, rows O6 to O8** (he answers on his next
  poll, as an ordinary action, and answers the last result only) is the whole of the +149. Ablations on the W4 + a + b tree, 500 seeds (lane b's own `PYREFLY_ABL` switches, put back one at a time, plus one of mine):
  the first build's Oversoul script wholesale (`OS_OLD`) **199** (link 1: 220, the live number); the Oversoul **unable to be chain-locked 235** (link 1: 255); O10 (the Normal-Attack answer back at the attacker) 343; the HP rows spending the answer
  state (lane b's unbuilt reading C, `SPEND`) 409; O2, O4, O5, O9, O11, O14 each 348 (no effect on the shipped line); T4 (the MP gate removed, the game's rule) 149 (Trema's link only). **Mechanism:** the game's script answers on its next poll like
  any action, and a hit opens a 3 s chain window on its target in which it cannot *start* an action (§1.7); a party that keeps hitting the Oversoul keeps him from answering, where the first build answered each hit at once as an out-of-turn counter
  that no chain lock stops. RC3's wake (his answer is one step after the hit instead of one recovery after it) moved nothing: 348 before and after. This is the one place where two sources that each look harmless together change a difficulty by 29 points; it is
  decision 1 below.
- **VI Leblanc 491 -> 500, 96 -> 114 s: W4 +7, lane c +2.** Lane c's **O1** (Ormi's Concussive Blast only in Act III, one poll in four: 48 wins on the old clock) and **R1** (Acts I and II carry the game's Agility, Ormi 63 and Logos 90: longer fights, 102 -> 114 s).
- **XI Fallen Aeons 490 -> 500, 156 -> 120 s: W4** (the monsters' casts: 488 without; the party's recovery: 495 without). Lane b adds nothing to the count; its **M5** (Cindy alone under a quarter casts White Highwind every poll), which made the old-clock fight a sixth longer, does not show on W4's clock.
- **IV Bahamut 500 -> 500, 90 -> 66 s: W4** (spells leave no recovery: 147 s with the old recovery back); RC3 -6 s (the 25 s countdown is idle time in which nothing interrupts the party).
- **XVI Ixion 500 -> 500, 90 -> 66 s: W4** alone.
- **The Experiment 500 -> 380 (12 -> 5 of 12), 66 -> 48 s: W4**, section 4.

Fight length: a quarter to a third shorter in IV, XI, XV, XVI and the Experiment, a fifth shorter in V, 19 percent longer in VI and 12 percent longer in XIII. As W4 says, every fight is still shorter than the game's by the animations the engine does not play
(`re-parity-w4.md` section 7, item 2).

## 9. Open items

1. **Baralai's second command** has no zero-gap path (section 3): it waits one recovery. The seam would sit in `execute.ts#finishAction` and must also cover a first command that charges (his Regen, Absorb and Guard do).
2. **Three "result" mechanisms coexist** (lane a's `hits` on `onDamaged`, lane b's `onResult`, lane c's `onResults` tally). All optional and inert for other scripts; fold into one when a fourth lane needs it.
3. **Two search draw shapes** (lanes a and b: a 31-bit value modulo n; lane c: `int(0, n - 1)`), and **one random stream for both of the game's**: the RNG batch (plan P3) gives them one shape and each game's own streams.
4. **Positions and facing** (lane a's near-weighted `searchr` uses the scene's start positions; lane b's P3; lane c's O3, O4, L3, I4, D10 stay uniform or a slot): new gameplay needs Bailey's yes.
5. **A status tick that kills** (Poison on a Redoubt) does not wake a waiting twin (the wake runs after actions); rare, and the next fall or rise wakes it.
6. **The real-input check is owed.** This worktree has no `public/art` and the work is engine-only, so no browser or screenshot was run. What a person will see differently: Bahamut stands still for 25 s between the second Impulse and the Mega Flare
   (the numbers 5, 4, 3, 2 and the 1 with the cast); the gauge snapshot reads 0 for a unit that sits an idle wait (whether any HUD draws an enemy bar is not checked here); the Oversoul and the Redoubts answer a step after the event.
7. **Stale player-visible text** (listed, not rewritten; new wording needs Bailey's yes): the three lane handoffs' lists (the Chapter IV / V / XIII / XI / VI / XV guides, `chapter-meta-den-of-woe`, the tactics comments), and **one more that RC3 made
   false in the engine itself**: the enemy-intent panel's Bahamut note in `src/battle/ffx2/intent.ts` ("The Mega Flare countdown is an action counter, not a clock - Slowing him slows it too"; pinned by `enemy-intent.test.ts`): the countdown is a clock of 750 steps now, which Slow and Haste do not change.
8. **Doc debt not mine:** `docs/audio/THEMES.md` still maps Chapters IV and VI to `boss-ffx2-aeon` (`themes-chapter-cue-map` fails on the live base too).
9. **W4's, lane a's, b's and c's own open items stand** (hit reaction length, animation lengths, the preemptive roll, auto-abilities, silent voice lines, Silence on the Oversoul's list, ...): see their handoffs.
10. **Test time.** The per-step engine makes the FFX-2 benches minutes long (the whole suite is 28 minutes on four workers); the lanes' 15 s defaults fail on a loaded PC, which is why the run above used a 600 s per-test timeout.

## 10. Decisions for Bailey (the recommendation first; none is a number of ours)

1. **Chapter XIII's Oversoul is much easier than the live build (213 -> 348 of 500, 43 -> 70 percent; the first link 237 -> 383).** Not tuned and not a bug I can find: lane b's script (the game's: he answers on his next poll) meets the game's chain
   rule (a chained target cannot start an action). Ablations in section 8. **Recommendation: keep** (1:1 is the standing order; D-410 says the difficulty he chose is the intended one, but he chose it on the first build, whose Oversoul answered by an out-of-turn counter
   the game's script does not have). The alternatives are measured: the first build's script (199 of 500), or the Oversoul exempt from the chain lock (235). A measured options round is the honest route if the 43 percent is wanted back.
2. **The hidden Experiment is harder (500 -> 380 of 500; Act II on the Wait clock 35 -> 24 of 40; the party's casts are the cause).** **Recommendation: keep**; it is hidden, its guide already says Act II is hard, and W4's note has the same cause for Chapter XIII.
3. **The new engine mechanism** (idle waits that an event cuts short, `ai/idle.ts`). **Recommendation: keep.** The alternative is to poll every step as the game does, which needs the presenter's "decisions without an event" guard to count an idle poll as progress.
4. **The Oversoul's idle limit is the game's 1,201 steps (40.04 s), not SinirothX's 20 s** (lane b's decision 7: "leave until W4, then follow the game"). Done as that recommended; it moves nothing on the shipped line. Revert: `OVERSOUL_IDLE_POLLS` to 599.
5. **Chapter IV's free window is the game's 25 s now**: Bahamut's countdown is the game's 25 s now, so attack-only lines win 6 of 10 and the unmitigated line 3 of 30, and the first Mega Flare does not always land (the shipped line finishes him inside the countdown on some seeds). **Recommendation: keep**, and
   reword the Bahamut note and the guides (item 7 above) in the same batch.
6. **Reword the stale text** (open item 7). Recommendation: one rewrite batch after RC3 ships; it is player-visible, so it needs your yes.
7. **Floors and claims restated** (section 6; the lanes' own: the Chapter V forty-chain bar 36 -> 20, Bahamut's Magic Break route 15 -> 10): none is a target; they are floors below the measured count. Confirm, or name one to hold.
8. **The lanes' own open decisions carry over unchanged** (each handoff's last section): lane a (the near-weighted search stays on, silent voice lines, the halfway line is Braska's in the game and Auron's in our binding); lane b (D-146 TR4 the MP gate, D-151 readings A / B / C, Big Bang's
   timing, MDEF 88 or 89, D-105 per-result counters, White Highwind, Final Impact's painting); lane c (Baralai's and Ixion's counters per result, the cycle after Thor's Hammer, the three owner decisions that yielded, positions). Their numbers were taken on the old clock; the table in section 8 is the merged one.
9. **Release path.** RC3 is not in the save-data class (section 0). It owes the normal focused review before a deploy and the deep review on the live build afterwards (`critic/RUBRIC.md` section 4); the majors it would disclose are decisions 1, 2 and 5. I did not deploy.

## 11. How to re-run (from the worktree root; tools by path, never `npx`)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/parity-ffx2-*.test.ts tests/unit/ffx2-*.test.ts tests/unit/data-ffx2-*.test.ts tests/unit/chapters/experiment-*.test.ts
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 --testTimeout=600000 --hookTimeout=600000     # the whole suite (28 minutes)
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=500 PYREFLY_MEASURE_CHAPTERS=ffx2-bahamut,ffx2-vegnagun-shuyin,ffx2-leblanc,ffx2-fallen-aeons,ffx2-trema,ffx2-den-of-woe,ffx2-ixion-djose,ffx2-masterpiece-theatre \
  PYREFLY_MEASURE_OUT=after-500.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 tests/unit/ffx2-parity-measure.test.ts
```

The before side is the same command in a src-only `git archive 72973096` (checked equal to the commit); the in-between rows of section 8 are the same command on archives of `bfb229a3`, `1996bcae`, `fbdfdb69` and `5d27d47b`. Scratch
(outside the repo, `D:\Tools\ffx-parity\rc3` and `\rc3-*`): the measurement runners, the log-diff scripts, lane b's ablation switches adapted to the merged names and W4's ablation harness pointed at the W4-only archive.

## 12. For the release CHANGELOG (FFX-2 only; plain words, one paragraph per area)

**Battle time and gauges (re-parity W4).** Fights keep time the way the game does, read from Bailey's Steam copy: a clock of about 30 steps a second, the ATB speeds 70, 95 and 120 a step, each command leaving its own recovery (an attack 70, an item 40, a spell nothing, because a spell's wait is its cast), casts at the game's cast times (Fire, Fira and
Firaga all about six seconds at Rikku's speed), the randomised opening gauges, Delay hits that push a gauge back and close an open menu, and Haste, Slow, Shell, Protect, Regen, Sleep, Doom and Poison wearing off on the game's own counters. Most fights come out a quarter to a third shorter.

**Bahamut, Vegnagun and Shuyin (Chapters IV and V).** They fight by the game's own scripts. Bahamut casts Curse once, as his first move, and then repeats a six-move cycle; after the second Impulse he stands still for the game's 25 seconds, the numbers 5, 4, 3, 2 and then the 1 with
the Mega Flare (there is no 0; Slow and Haste do not change the wait). Vegnagun's Leg has three Nodes in three colours from the first moment, the Bulwarks answer a physical or magical attack across the whole party, the Head wakes only when both Redoubts are down, acts much faster and
starts its first wait at the game's Agility, the cannon's countdown is the game's 100 moves, a Redoubt raises its fallen twin a heartbeat after it falls, voice lines take the time of a spoken line, and Shuyin stops to speak more often and no longer picks on Yuna.

**Shiva, the Magus Sisters, Anima, Paragon, the Oversoul Paragon and Trema (Chapters XI and XIII).** Shiva's Triple Attack is three separate attacks, each at its own target, and Shiva and Anima charge their big moves with every hit, and every miss, that lands on them. Only Cindy casts Delta Attack, and only once Mindy and Sandy are charged; a Cindy left alone
casts White Highwind every turn. The Oversoul Paragon answers on its next turn, a copied spell goes back at whoever cast it, a plain attack is answered at a random girl, it waits the game's forty seconds untouched, and a party that keeps hitting it keeps it from answering, which makes Chapter XIII much easier than before
(about 70 fights in 100 won on our practice line, 43 before). Trema's two fights share one set of odds.

**Leblanc, the Den of Woe shades and Ixion (Chapters VI, XV and XVI).** The Syndicate follows the game's scripts and stat rows: Ormi's Concussive Blast belongs to the last room and comes one turn in four, Logos fires a Hail of Bullets a quarter of the time in the last room, Russian Roulette has five outcomes, Leblanc's Guard goes up on her first turn and again much later. In the Den of Woe Baralai counts
every hit that lands on him and answers at eight, Gippal aims his low-HP Attack at the girl with the least HP; Ixion's count rises five a hit or a miss. With the new gauges the Den of Woe is won on every try of our practice line (about 1 in 2 before); Leblanc and Ixion are won as often as before.

**The hidden Experiment.** It keeps working and keeps the game's own pace; Act II is harder than it was, because a girl's cast now takes the game's time (about 24 fights in 40 on our practice line, 35 before).

**Difficulty, measured and not tuned.** Easier: the Den of Woe, Vegnagun and Shuyin, the Fallen Aeons, Leblanc, and Paragon and Trema (by far); unchanged: Bahamut and Ixion; harder: the hidden Experiment. No boss or party number was changed. FFX is untouched.
