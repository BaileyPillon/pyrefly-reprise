# Re-parity RC9 X2-L: how Chapter VI's chained links open (lane X2-L, row XL1 = PR-0107), re-measured on today's engine

Status: **measured, tested and committed on branch `re-parity-rc9-x2-link-open` (from `origin/r50-release`, `6b638df95`) with the switch OFF, pushed to `origin`; not merged to main, not deployed** (2026-10-16).
**The ON build is the separate branch `re-parity-rc9-x2-link-open-on` (one commit on top of the first). It is NOT FOR MERGE and NOT FOR DEPLOY until Bailey says yes** (plan question Q19; his own D-242 kept PR-0107 OFF).
**Game case: FFX-2 only** (AGENTS.md rule 14), and why: the flag (`EnemyGroupDef.opensAsSeparateBattle`), the Chateau chain and the gauge kernels (`kernel/atb-start.ts`) are FFX-2's; the game's FFX start-up is the FFX-G10 note's, and FFX already starts a chain's later link as a normal start (`ffx/adapt/ctb.ts` `startTypeOf`). No FFX file and no shared file is touched; `ffx-engine-golden` and `ff7-golden` are unchanged.
Sources: private note FFX2-G10 (battle lifecycle) sections 4, 5, 6, 7.2, 8, 9.3 and 16 (row 4), FFX-2.exe Steam build 25501027 (SHA-256 6EA7F142...CD69); the wiring plan addendum of 2026-10-13, lane X2-L; `docs/handoff/iter2-b1.md` section "PR-0107"; D-242 (`docs/target/decisions.json`).
Authority: Bailey, 2026-10-08 "It needs to be a 1:1 parity.", 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game" and "Keep going!". Turning the switch on reverses a pick of his (D-242), so the build waits for his word.
**No boss number and no party number was changed or added. No file under `src/` is touched in the first commit.** Measurement and proof tests only.

| Commit | Branch | What |
|---|---|---|
| A (this note's commit) | `re-parity-rc9-x2-link-open` | the bench (`tests/unit/x2-link-open-bench.test.ts`, gated by `PYREFLY_MEASURE=1`), the other-chapters check (`x2-link-open-others.test.ts`, same gate), the path proof (`x2-link-open-path.test.ts`, runs always), the driver (`tests/unit/helpers/x2LinkOpenDrive.ts`), the numbers-only results (`docs/handoff/re-parity-rc9-x2-link-open-results.json`) and this note |
| B | `re-parity-rc9-x2-link-open-on` | `SEPARATE_BATTLE_GAUGES = true`, the tests that pinned the old default re-pinned with their cause; section 11 |

## 1. What the switch is and the code it drives

| Piece | Where |
|---|---|
| the flag | `EnemyGroupDef.opensAsSeparateBattle` (`src/battle/common/types.ts`, contract, additive; entry in `docs/CONTRACT-CHANGES.md` 2026-09-27), set on Chapter VI's Act II (`data/ffx2/enemies/leblanc-syndicate-acts.ts`, `leblancLogosRoomGroup`) and Act III (`data/ffx2/enemies/leblanc-syndicate.ts`, `leblancLastRoomGroup`) and on no other group (pinned by `iter2-b1-rules.test.ts`) |
| the switch | `src/battle/ffx2/constants.ts` `SEPARATE_BATTLE_GAUGES` (false), overridden per run by `Ffx2EngineOptions.separateBattleGauges` |
| the read | `src/battle/ffx2/setup.ts` `buildState`: `separate = enemies.opensAsSeparateBattle === true && (options.separateBattleGauges ?? SEPARATE_BATTLE_GAUGES)`, then `continuation: setup.condition === 'scripted' && !separate` |
| the opening | `src/battle/ffx2/atb-open.ts` `openBattleGauges`: with `continuation` every wait is whole and nothing is trimmed; without it, `kernel/atb-start.ts` `atbInit` (random start), no preemptive or ambush roll unless `rollFirstAttack`, and `openingTrim` |
| who sets `'scripted'` | `src/app/screens/BattleScreenSetup.ts` `setupForNextLink` (`condition: 'scripted'`), the one place a chain's next link is made; the app never sets `separateBattleGauges`, so the constant is the whole switch |

## 2. Is the ON path the game's full start? Yes, to the note's resolution

The note (FFX2-G10 sections 4 to 6, 16 row 4): the game has no continuation mode. Every `btlExe` is a full battle start through phases 4 to 0x19: a random opening wait for every character in play, the opening trim, and no first-attack roll because the scene master presets "plain start" for the Chateau's three scenes (section 7.2; the note marks the order, the scene master's init running before phase 0x17, as inferred, open question 8). The draws, in time order: one per character on its own purpose-0 stream (a girl's slot + 20, a monster's slot + 13), the girls first; none in the first-attack step; none in the trim.

`tests/unit/x2-link-open-path.test.ts` (7 tests, always run) restates that arithmetic itself and runs the real links through `buildState` with a tap on every draw:
- the draws are exactly one per character, girls first then monsters in slot order, each on its own stream (20, 21, 22, then 28, 29 and 30 for the Act III trio), and **none on stream 1 (the first-attack roll) or stream 17 (the layout)**;
- each character's wait afterwards equals `((draw & 63) + 32) * full / 128` less `floor(2 * smallest / 3)`, checked on seeds 1 to 40 of both acts against the tapped values; `full` equals `70 * 10000 / (AGI + 1)`;
- the continuation (flag off) spends the same draws and keeps none of the result: every wait whole, nothing trimmed; Act I is a normal start and the flag does not touch it.
Three scratch faults in the source were each caught (the 0x20 start constant, the trim's two thirds, the random start switched off) and the source was restored byte for byte.

**Drift since 2026-09-27: yes, but in the engine, not in the note; the ON path today is the note's.** D-242's ON path was a hand-written fill: one draw per unit from the single battle stream, a bar filled to `int(0, 60)` percent of its length (`8630f7735`), no trim, on the old 3,000-ticks-a-second clock, against an OFF path whose bars all started at 0. Re-parity W4 and the RNG lane replaced it with the kernel's opening (25 to 74 percent of the wait left, then the trim) on each unit's own stream; the OFF path became "every wait whole". So the D-242 numbers (section 6) were taken on an opening the game never uses. Also changed since, and not this lane's: the damage and clock kernels (W3, W4), the game's random streams, and the Syndicate's scripts and Agility (RC3, lane c: Logos 90, Ormi 63).
Not modelled, and not claimed (plan row XL2, no chapter's rolls depend on them): the layout roll and placement draws on stream 17, and the party-side characters the game builds beyond the three in play.

## 3. Method

- Bench: `tests/unit/x2-link-open-bench.test.ts` (new). **Why not an existing one:** `critic/bench/leblanc/bench.test.ts` measures Active only, 40 seeds, three decision times; `tests/unit/iter2-b1-bench.test.ts` is the harness D-242 used and defines the three paces, but its minutes column divides by 3,000 (the clock before W4), so on this engine it would print a fight 100 times too short, and it has no per-act arm, opener count or JSON. The new bench keeps iter2-b1's chain loop (checked event for event against `driveChapter6`, seeds 1 to 3, all paces) and its definitions, and counts minutes with `STEPS_PER_SECOND`.
- Paces, as iter2-b1 defines them: **human** = the live Wait split (1.5 s a menu, 0.5 s of it on the top list); **Active** = 1.5 s a menu with the clock running; **bench** = zero decision time.
- 500 seeds a row (1 to 500), the shipped line (`intendedStrategy`), one unbroken run Acts I to III in the shipped order, each link seeded `seed + link` as the app does. Arms: OFF (`separateBattleGauges` false), ON (true), ON for Act II only and ON for Act III only (the other act's flag taken off for the run and put back).
- First try = wins over seeds; within 5 = `1 - (1 - p) ** 5` (independent retries, as iter2-b1 computed it); fight = logic steps over `STEPS_PER_SECOND` (29.97); damage = HP the girls lost; "acts first" = whose command begins first in the link's log (a girl's `turn-start` is logged when she submits, so the decision time counts); "smallest wait" = who holds the smallest wait on the field the moment the link opens, i.e. whose bar fills first.
- The band (`docs/plans/iter2-b1-review.md` section 3): first try at human pace within 5 points of today, within 5 unchanged.
- Re-run: `PYREFLY_MEASURE=1 X2L_OUT=<file> X2L_SPEEDS=human node vitest.mjs run tests/unit/x2-link-open-bench.test.ts --testTimeout=0` (about 4 minutes a pace); the numbers are in `docs/handoff/re-parity-rc9-x2-link-open-results.json`.

## 4. Results

| Pace | Switch | First-try wins | First try | vs OFF (points) | Within 5 tries | Mean fight (min) | vs OFF (s) | Damage taken / run | Standard error (points) | Seeds won with ON but not OFF / lost |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| human (live Wait split) | OFF (shipped) | 499/500 | 99.8 % | - | > 99.99 % | 2.53 | - | 4091 | 0.2 | - |
| human (live Wait split) | ON, both acts | 499/500 | 99.8 % | +0.0 | > 99.99 % | 2.44 | -5.4 | 4125 | 0.2 | 1 / 1 |
| human (live Wait split) | ON, Act II only | 500/500 | 100.0 % | +0.2 | > 99.99 % | 2.45 | -4.8 | 3950 | 0.0 | 1 / 0 |
| human (live Wait split) | ON, Act III only | 499/500 | 99.8 % | +0.0 | > 99.99 % | 2.52 | -0.6 | 4252 | 0.2 | 1 / 1 |
| Active | OFF (shipped) | 467/500 | 93.4 % | - | > 99.99 % | 3.98 | - | 8950 | 1.1 | - |
| Active | ON, both acts | 465/500 | 93.0 % | -0.4 | > 99.99 % | 3.86 | -7.2 | 8908 | 1.1 | 26 / 28 |
| Active | ON, Act II only | 474/500 | 94.8 % | +1.4 | > 99.99 % | 3.85 | -7.8 | 8649 | 1.0 | 28 / 21 |
| Active | ON, Act III only | 460/500 | 92.0 % | -1.4 | > 99.99 % | 3.96 | -1.2 | 9163 | 1.2 | 22 / 29 |
| bench (D = 0) | OFF (shipped) | 500/500 | 100.0 % | - | > 99.99 % | 2.11 | - | 3043 | 0.0 | - |
| bench (D = 0) | ON, both acts | 500/500 | 100.0 % | +0.0 | > 99.99 % | 2.01 | -6.0 | 3067 | 0.0 | 0 / 0 |
| bench (D = 0) | ON, Act II only | 500/500 | 100.0 % | +0.0 | > 99.99 % | 2.03 | -4.8 | 2935 | 0.0 | 0 / 0 |
| bench (D = 0) | ON, Act III only | 500/500 | 100.0 % | +0.0 | > 99.99 % | 2.10 | -0.6 | 3170 | 0.0 | 0 / 0 |

Chapter VI today is a far easier fight than it was on 2026-09-27, switch off or on: 99.8 % first try at human pace (it was 78.5 %), and the switch does not move it.

### Who opens Acts II and III

| Pace | Switch | Act II: smallest wait is a girl's | Act II: a girl acts first | Act III: smallest wait is a girl's | Act III: a girl acts first |
|---|---|---:|---:|---:|---:|
| human (live Wait split) | OFF (shipped) | 0 % | 0 % | 100 % | 100 % |
| human (live Wait split) | ON, both acts | 28 % | 7 % | 62 % | 34 % |
| human (live Wait split) | ON, Act II only | 28 % | 7 % | 100 % | 100 % |
| human (live Wait split) | ON, Act III only | 0 % | 0 % | 63 % | 33 % |
| Active | OFF (shipped) | 0 % | 0 % | 100 % | 0 % |
| Active | ON, both acts | 28 % | 0 % | 63 % | 4 % |
| Active | ON, Act II only | 28 % | 0 % | 100 % | 0 % |
| Active | ON, Act III only | 0 % | 0 % | 62 % | 3 % |
| bench (D = 0) | OFF (shipped) | 0 % | 0 % | 100 % | 100 % |
| bench (D = 0) | ON, both acts | 28 % | 32 % | 63 % | 64 % |
| bench (D = 0) | ON, Act II only | 28 % | 32 % | 100 % | 100 % |
| bench (D = 0) | ON, Act III only | 0 % | 0 % | 62 % | 64 % |

(The Syndicate's share is 100 minus the girl's. "Smallest wait" is the bars alone; "acts first" adds the girl's decision time, which is why a girl's bar can fill first and the Syndicate still moves first.)

### What each act costs (OFF against ON, both acts on)

| Pace | Act | OFF seconds | ON seconds | OFF damage taken | ON damage taken | OFF girls KO'd (500 runs) | ON girls KO'd | OFF link won | ON link won |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| human (live Wait split) | II | 50.5 | 46.3 | 1809 | 1707 | 412 | 392 | 500/500 | 500/500 |
| human (live Wait split) | III | 80.4 | 78.8 | 1560 | 1696 | 38 | 40 | 499/500 | 499/500 |
| Active | II | 79.8 | 74.9 | 3018 | 2911 | 644 | 628 | 500/500 | 499/500 |
| Active | III | 128.4 | 126.1 | 4623 | 4697 | 393 | 404 | 467/500 | 465/499 |
| bench (D = 0) | II | 43.1 | 38.7 | 1409 | 1352 | 302 | 298 | 500/500 | 500/500 |
| bench (D = 0) | III | 66.1 | 64.2 | 1034 | 1115 | 8 | 3 | 500/500 | 500/500 |

### Does the opener decide the link?

| Pace | Act | Opener (first turn of the link) | Links, ON | Won, ON | Won, OFF (same opener) |
|---|---|---|---:|---:|---:|
| human (live Wait split) | II | a girl | 33 | 33 (100 %) | never |
| human (live Wait split) | II | the Syndicate | 467 | 467 (100 %) | 500/500 |
| human (live Wait split) | III | a girl | 168 | 167 (99 %) | 499/500 |
| human (live Wait split) | III | the Syndicate | 332 | 332 (100 %) | never |
| Active | II | a girl | 0 | - | never |
| Active | II | the Syndicate | 500 | 499 (100 %) | 500/500 |
| Active | III | a girl | 19 | 16 (84 %) | never |
| Active | III | the Syndicate | 480 | 449 (94 %) | 467/500 |

## 5. The movers, in player words

There is no mover in the result; the movers are in the opening.
- **Everything starts sooner.** With the switch off a link opens with every wait whole, so nothing can happen for 2.7 s in Act II (Logos's bar) and 4.03 s in Act III (Rikku's). On, each fighter's first wait is a random quarter to three quarters of a full bar and the quickest one's wait is then cut to a third: the first bar fills after 0.4 s on average in Act II (at most 0.67 s) and 0.49 s in Act III (at most 0.85 s), at the Normal ATB speed. The chapter runs 5 s shorter at human pace, 7 s at Active and 6 s at bench pace.
- **Act II (Logos's room): the Syndicate still moves first.** Logos has Agility 90 against the girls' 50 to 60 (the enemy data and the Chateau build), the fastest thing in the room, so with whole waits he always went first (100 percent) and now goes first 93 percent of the time at human pace (68 at bench pace, where the girl's decision time costs nothing). A girl gets the opening move in about 1 fight in 14 at human pace. The act is 4.2 s shorter and the girls lose 102 HP less on average (1809 to 1707); it is won 500 times in 500 either way.
- **Act III (the Last Room): Rikku no longer always goes first.** Leblanc 53, Logos 49 and Ormi 42 sit close to the girls' 53, 60 and 50, so with whole waits Rikku (60) went first every time (100 percent), and now the draws decide: the Syndicate moves first 66 percent of the time at human pace (36 at bench pace). Cost: 136 more HP lost per run in that act at human pace (1560 to 1696, about 9 percent), no more knock-outs to speak of (38 to 40 in 500 runs), and no lost fights: the link is won 499 of 500 on, 499 of 500 off.
- **Why the result does not move.** At the live Wait pace the clock holds while a girl chooses, so a Syndicate move that lands first costs a little HP and nothing else; the shipped line wins whoever opens (section 4, last table). At Active pace the clock runs through the 1.5 s menu, so the Syndicate already moves first in 100 percent of the Act III fights with the switch off and 96 percent with it on, and nearly all of the 7 first tries in 100 that are lost are lost in Act III (off: 33 of 33; on: 34 of 35) (467 wins off, 465 on, of 500; the paired seeds that flip are 28 to a loss and 26 to a win, a re-deal of the same odds).
- The two one-act arms agree with that: Act II alone is +1.4 points at Active and Act III alone -1.4, both inside the standard error of 1.1 points; at human and bench pace neither moves a seed in a way that shows.

## 6. D-242, the band, and what changed since

| Pace | D-242 OFF (200 seeds, 2026-09-27) | D-242 ON | Change | Today OFF (500 seeds) | Today ON | Change |
|---|---:|---:|---:|---:|---:|---:|
| human (live Wait split) | 157/200 (78.5 %) | 124/200 (62.0 %) | -16.5 | 499/500 (99.8 %) | 499/500 (99.8 %) | +0.0 |
| Active | 31/200 (15.5 %) | 26/200 (13.0 %) | -2.5 | 467/500 (93.4 %) | 465/500 (93.0 %) | -0.4 |
| bench (D = 0) | 195/200 (97.5 %) | 183/200 (91.5 %) | -6.0 | 500/500 (100.0 %) | 500/500 (100.0 %) | +0.0 |

- **The 5-point band no longer blocks the switch.** At human pace the first try goes +0.0 points and within 5 stays above 99.99 percent in both arms; at Active -0.4 points (standard error 1.1); at bench pace 0.
- **Why D-242's 16.5 points are gone.** (1) The ON path it measured is not today's: a 0-to-60 percent fill with no trim (section 2). (2) The fight it measured was close (78.5 percent first try at human pace) and is not now (99.8 percent), so an opening that costs the girls a free move had something to tip. Between then and now the engine took the game's own damage, clock and gauge kernels (W3, W4), its random streams, and the game's scripts and Agility for the Syndicate (RC3 lane c); they are recorded in `docs/handoff/re-parity-rc3.md` and `re-parity-w4.md`, and which of them moved Chapter VI from 78.5 to 99.8 percent was not isolated here. (3) The D-242 OFF arm ("bars at zero": the fastest girl opens both acts) is also gone: with whole waits Logos opens Act II every time.
- Statistics: 500 seeds a row, so the standard error is 1.1 points at Active and 0.2 or less elsewhere. Seeds flip both ways between arms (28 and 26 at Active), as a different deal of the same odds does.

## 7. The other FFX-2 chapters: none moves

12 seeds of every FFX-2 chapter record on this tip, run twice (`separateBattleGauges` false and true) at the three paces; "differ" counts seeds whose whole event log differs (`tests/unit/x2-link-open-others.test.ts`, same gate).

| Chapter | Seeds | Logs that differ, human / Active / bench | Wins OFF -> ON, human | Active | bench |
|---|---:|---|---|---|---|
| IV | 12 | 0 / 0 / 0 | 12 -> 12 | 12 -> 12 | 12 -> 12 |
| V | 12 | 0 / 0 / 0 | 11 -> 11 | 11 -> 11 | 12 -> 12 |
| VI (flagged) | 12 | 12 / 12 / 12 | 12 -> 12 | 11 -> 11 | 12 -> 12 |
| XI | 12 | 0 / 0 / 0 | 12 -> 12 | 12 -> 12 | 12 -> 12 |
| XIII | 12 | 0 / 0 / 0 | 8 -> 8 | 1 -> 1 | 10 -> 10 |
| XV | 12 | 0 / 0 / 0 | 12 -> 12 | 11 -> 11 | 12 -> 12 |
| XVI | 12 | 0 / 0 / 0 | 12 -> 12 | 12 -> 12 | 12 -> 12 |
| hidden: the Leblanc preview (Chapter VI's record by reference) | 12 | 12 / 12 / 12 | 12 -> 12 | 11 -> 11 | 12 -> 12 |
| hidden: the Experiment | 12 | 0 / 0 / 0 | 10 -> 10 | 6 -> 6 | 10 -> 10 |
| hidden: Tourist Trap | 12 | 0 / 0 / 0 | 12 -> 12 | 8 -> 8 | 12 -> 12 |
| hidden: Valefor at Besaid | 12 | 0 / 0 / 0 | 12 -> 12 | 12 -> 12 | 12 -> 12 |
| hidden: Angra Mainyu | 12 | 0 / 0 / 0 | 11 -> 11 | 1 -> 1 | 11 -> 11 |

Only Chapter VI and the Leblanc preview (which is Chapter VI's record by reference) move, as they must. **The Vegnagun links (Chapter V) carry no flag and do not move.** They stay unflagged until the events are read: FFX2-G10 open question 3 asks whether a chained link is ever kept inside one battle; the events start the Vegnagun links by separate `btlExe` calls (four of them with a second argument of 1), so the note's default reading is that they too are full starts, but that is not read.

## 8. Tests

Commit A (switch OFF): `npx tsc --noEmit` clean. 41 test files were run, with `--maxWorkers=2`: the three goldens (`ffx2-atb-golden`, `ffx-engine-golden`, `ff7-golden`, all unchanged and passing), `iter2-b1-rules` and `iter2-b1-switches`, the advisor, strategy, guide, chain, menu-cancel, hit-closes-menu, steal, grenade and Leblanc chapter tests that run the FFX-2 engine over Chapter VI, the parity ATB tests, and the new files. **38 passed, 2 skipped (the gated bench and the other-chapters check), 1 failed:** `exp-leblanc.test.ts` "serves Chapter VI's art exactly as the release tree holds it" (a painting hash in this worktree's art folder, the art-only failure the lane brief expects; the run was on the base plus only new test files, so it is the base's). The path test (7) passes; three scratch faults in the source were each caught and restored byte for byte. Not run: the full suite (brief: none).

## 9. Five lines for Bailey

1. With PR-0107 on, Acts II and III start like fresh fights: everyone's first wait is a random quarter to three quarters of a full bar, and the quickest one's wait is cut to a third, so the first bar fills in about half a second instead of 2.7 to 4.03 seconds.
2. In Logos's room the Syndicate still moves first almost every time (93 fights in 100 at the live pace, it was 100); in the Last Room Rikku no longer always goes first, and Leblanc's side does about 66 in 100, which costs the girls about 136 HP more in that act.
3. It does not make Chapter VI harder: 499 of 500 first tries win at the live pace with it on or off, 465 against 467 of 500 at Active, 500 of 500 at zero decision time; the chapter runs 5 to 7 seconds shorter.
4. The 16.5-point drop you saw on 2026-09-27 does not come back: it was measured on an older engine, with an opening the game never uses, in a fight that was much closer (78.5 percent first try then, 99.8 now).
5. Nothing else moves (0 of 12 logs change in any other FFX-2 chapter), and the Vegnagun links stay as they are until the events are read. The ON build waits on a branch for your yes.

## 10. Open items and decisions

1. **Decision for Bailey (Q19): turn PR-0107 on for Chapter VI's Acts II and III?** Recommended: **yes**. The reason it was refused (outside the 5-point band) no longer holds; the game starts every link this way; the cost is about 136 HP in Act III at the live pace and a Chapter VI that is 5 s shorter. Branch `re-parity-rc9-x2-link-open-on` is ready; the hidden Leblanc preview would change with it (same record).
2. **The Vegnagun links** (Chapter V; FFX2-G10 open question 3, the events). Not flagged, not measured with the flag. If the events show full starts, flag them and measure Chapter V (the same bench takes a second chain with a few lines).
3. **Stale comments, left alone** (comment-only; `types.ts` is a contract file): `internal.ts` `rollFirstAttack` still says the game's presets are "not in the sources we have" (FFX2-G10 section 7.2 answers it: plain start for every chapter scene, on the note's inferred init-before-phase-0x17 order); `atb-open.ts`'s header still says the sources do not say what the game does for a continuation (the note says there is no continuation mode); `types.ts` `opensAsSeparateBattle` says "randomised fills".
4. **`tests/unit/iter2-b1-bench.test.ts` is stale after W4**: its minutes column divides ticks by 3,000, the pre-W4 clock (use `STEPS_PER_SECOND`). Not changed here (not this lane's file).
5. **Not modelled** (plan row XL2, no chapter's rolls depend on them): the layout roll and placement on stream 17, the shuffle draws (only the Experiment has linked monsters), the party-side characters beyond the three in play that the note says the game's character init starts (ids 0 to 8). Each link here re-seeds from `seed + link`, where the game's streams run on across battles: a different deal of the same odds (RNG lane's design).
6. Act I is a normal start in the engine and is unchanged in every arm.

## 11. Commit B: the ON build (branch `re-parity-rc9-x2-link-open-on`; NOT FOR MERGE and NOT FOR DEPLOY until Bailey says yes)

**What it changes.** `SEPARATE_BATTLE_GAUGES` goes from `false` to `true` in `src/battle/ffx2/constants.ts` (its comment names the branch and the condition), and nothing else under `src/`. Chapter VI's Acts II and III, and the hidden Leblanc preview, which is the same record, open as fresh battles. No other group is flagged. The branch is one commit on top of this branch.

**Tests re-pinned.** Four places pinned Chapter VI's old behaviour. One cause for all: Act I is identical, the first differing event is Act II's opening gauge snapshot, every log is still a victory in three links, and with `separateBattleGauges: false` passed as an option **every old hash returns exactly** (3 of 3, 6 of 6, 8 of 8).

| File | What was re-pinned |
|---|---|
| `tests/unit/iter2-b1-rules.test.ts` | "the switch ships OFF ... still opens at zero" becomes "the switch is ON on this branch": a default engine opens Act II with every wait below whole, and the option still turns it off. The old "at zero" check (`atb.ticks === 0`) was already vacuous after W4, because nothing sets the old count-up bar now; the wait that remains is `atb.recovery` |
| `tests/unit/ffx2-hit-closes-menu.test.ts` | Chapter VI's row of `PINNED` (D = 0, default Wait split, seeds 1 to 3) |
| `tests/unit/ffx2-menu-cancel-delay.test.ts` | Chapter VI's six hashes (Active and the Wait split at human pace, seeds 1 to 3) |
| `tests/unit/chapters/den-of-woe-carry.test.ts` | `BASE.ch6` (the eight Chapter VI logs, D = 0); Chapter V, Chapter XI and the Sisters did not move |

**Goldens.** `ffx2-atb-golden` (Chapters IV and V; there is no Chapter VI in it) unchanged and passing; `ffx-engine-golden` and `ff7-golden` unchanged and passing. Each re-pin's cause is written in the header of the test it touches.

**Run on the ON branch.** `npx tsc --noEmit` clean. 54 test files (the 41 of section 8, plus 13 more that mention Chapter VI: the advisor, critic, FX and data files): 51 passed, 2 skipped (the gated bench and the other-chapters check), 1 failed: the same art-hash failure (`exp-leblanc.test.ts`) as on the base, in this worktree's art folder. The bench itself was run on the OFF branch with the option set per arm, so its numbers are the ON build's.

**If Bailey says yes.** Merge the branch (or take its `constants.ts` line and the four re-pins). `node tools/critic-plan.mjs --paths src/battle/ffx2/constants.ts` says DEEP (the FFX-2 ATB engine is a shared system): a focused review of the production candidate before the deploy and the deep review on the live build after it. The driver then writes the decisions row (it reverses the PR-0107 part of D-242) and the actions row, and updates `docs/handoff/combat-switches.md` (still says OFF) and NOW.md.

**CHANGELOG paragraph, for the driver to paste** (lanes never write `CHANGELOG.md`):

- **FFX-2 only, Chapter VI, Acts II and III start like fresh fights (re-parity-rc9, lane X2-L, PR-0107):** the game starts every link of the Chateau as a new battle, so Act II and Act III now open the way Act I does: each fighter's first wait is a random quarter to three quarters of a full bar and the quickest one's wait is cut to a third, instead of every wait starting whole. The first bar fills in about half a second instead of 2.7 seconds (Act II) or 4 seconds (Act III), and the chapter runs 5 to 7 seconds shorter. In Logos's room the Syndicate still moves first almost every time (Logos is the fastest thing in the room); in the Last Room Rikku no longer always goes first, and Leblanc's side moves first about two fights in three at the live Wait pace, which costs the girls about 140 HP in that act. It does not make the chapter harder: 499 of 500 first tries win at the live Wait pace either way, 93 in 100 at Active either way, and no other chapter changes. The 16.5-point drop that kept this switch off on 2026-09-27 (D-242) was measured on an older engine and does not come back.
