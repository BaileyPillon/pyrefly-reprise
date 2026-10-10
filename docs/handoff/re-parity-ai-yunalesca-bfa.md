# Re-parity AI lane B: Yunalesca, Braska's Final Aeon, the Yu Pagodas, the possessed aeons and Yu Yevon follow the game's own scripts

> **Release candidate 1 note (2026-10-09):** merged with AI-Seymour, the engine has ONE `onHit` runner (`ai/hooks.ts`); `hit-hooks.ts`, `hit-event.ts` and `FFXRuntime.reactions` described below no longer exist, and `registerHitScript` / `queueCounter` live in `ai/hit-script.ts`. The scripts and their rules are as written here. See [re-parity-rc1](re-parity-rc1.md).

Status: **built and committed on branch `re-parity-ai-ffx-b`, not merged, not deployed** (2026-10-09). Track `re-parity`
([plan](../plans/re-parity.md), [paper preflight](../plans/re-parity-ai-review.md) section 2, row "FFX Yunalesca, Braska's Final Aeon,
Yu Pagodas, Yu Yevon"). Owner: Bailey. **Game case: FFX only** (AGENTS.md rule 14): Chapters II and III. Nothing here is shared with FFX-2
or FF7: `ffx2-atb-golden` and `ff7-golden` are unchanged, and every FFX golden other than Chapter II's and Chapter III's is byte for byte the same.

Bailey, 2026-10-08 14:11: "It needs to be a 1:1 parity." Later that night: "Full speed ahead you don't need to conserve". 2026-10-09, on Braska's fight:
"Keep fixed chain for now" (the chain-shape rows A1 and A2 are decided, below).

The rules are `research/re-ffx-ai-yunalesca-bfa.md` (the game's compiled scripts read as decision tables, with the engine facts they rely on). Every
rule below cites its section there. The evidence that stays reusable is outside the repo: the note's interpreter and run logs under
`D:\Tools\ffx-parity\ai\ffx-yunalesca-bfa\`, this lane's measurements and scratch drivers under `D:\Tools\ffx-parity\ai-b-measure\`.

Commits (all on `re-parity-ai-ffx-b`; nothing pushed):

| Commit | What |
|---|---|
| `7d0a7077` | Yunalesca (rows Y1 to Y6) and the engine's hit events (`hit-hooks.ts`, `hit-event.ts`): the game's `onHit` once per target per sub-action, before the death check |
| `59a15530` | Braska's Final Aeon, the Yu Pagodas and the five possessed aeons (rows B1 to B7, P1 to P5, A3 to A8), the data they need |
| `25e69af5` | Yu Yevon (rows V1 to V5) and the scripted group target |
| `1ed2b6ef` | Tests: four new parity files, the pins that moved with the rules, the two Chapter III goldens |
| `76ecbb09` | One more Braska's Final Aeon test: a Pagoda's Power Wave on a Zombie boss |
| `863ac4f9` | `audio-chain-entrance-owner`: Chapter 3's chain is walked on seed 7 (found by the whole-suite run) |
| the commit that adds this note | This note and the CONTRACT-CHANGES entry |

## 1. What the engine does now

**Hit events** (engine, shared by every boss that registers a script; inert for any other combatant). After the last hit record of a sub-action has been
applied to a target, whether it damaged, missed, healed or only touched statuses, the target's script hook runs, **before** the death check (note 1.1).
`HitEvent.lastDamage` is `LastDamageTakenHP` (note 1.6): the sub-action's HP results on that target after the 9,999 cap and before the clamp to the HP
that was left, so overkill counts and a heal is negative. A script that `managesHp` sees its target held at 0 HP while the hits land and decides refill or
death in the hook; the free actions a hook asks for (counters) run once the action is done, and a hit one of them lands queues nothing further. A Doublecast
is two sub-actions, so two events. Files: `hit-hooks.ts` (registry and shapes), `hit-event.ts` (the runner), `hit-apply.ts` (the tally), `hp.ts#dealDamage`
(the held KO), `engine-end.ts` (the queued reactions).

**Rolls** (`ai/game-rolls.ts`): `GetRandomValue()` is sixteen bits from the engine's one seeded stream and each script reduces it with its own `mod`; a pick
(`findMatchingChr`) filters to the living and targetable and draws, in ascending actor order, **only with two or more candidates**. Adopting the game's own
generators and stream map (plan P3) is a separate decision and is not made here.

**Braska's Final Aeon** (`ai/braskas-final-aeon.ts`, note 3): the phase table (rows B2: 1/3 Beam and 2/3 Left Arm Strike; 1/5, 2/5, 2/5 in phase 1 with the
Blade Blitz opener; 1/3 and 2/3 in phase 2), the gauge as the script computes it (B1: +2 or +3 on his turn, +5 per hit event, +20 per Pagoda Power Wave, no
randomness), the Overdrive test on the **stored** gauge so the turn it reaches 100 is not an Overdrive turn (B5; the two hooks that return before the
script copies its running number into the property are reproduced), phase 2 latched once a hit leaves him below 60,000 (B3), the opener spent even when
an Overdrive or Talk replaces the action (B4), the Overdrive targets (B6) and Talk as a flag that clears the gauge and cancels the pending Overdrive when his
next turn starts (B7). His transformation writes no CTB (`forms.ts`: unlike Yunalesca's it leaves the turn order alone).

**The Yu Pagodas** (`ai/yu-pagoda.ts`, note 4): who gets the Power Wave (P1), the Curse / Osmose split when the partner is down (P2: m173 `yu-pagoda-right`
above 30 of `mod 100`, m174 `yu-pagoda-left` above 70), destruction in the hook with the pool it absorbed in the life that just ended, overkill included,
compounding from life to life (P4), hidden for two or three of its own turns on a draw, one if Slowed (P3), coming back with the rank-3 delay counted from
the moment it was due (`hp.ts#resolveDuePartRevivals`).

**The possessed aeons** (`ai/possessed-aeons.ts`, `ai/possession-setup.ts`, note 5): the per-aeon move tables with the pick before the roll (A5), the gauge
(own turn, hit event, Power Wave 15 to 33, Yojimbo 5 to 14; A6 and P5), the stats copied from the player's aeon with Luck 0 and MP 1 (A3), affinities and
Slow immunity in the data (A4), a character the fayth revives acts next (A7, `hp.ts#koActor`), and the opening turn order (A8).

**Yu Yevon** (`ai/yu-yevon.ts`, note 6): one idle turn, then Gravija every turn on the front line plus himself (V1, V2; `targeting.ts` honours the new
`extra.groupTarget`), Osmose as one single-target action on each of Character #1 to #3 who is alive, then Ultima (V3), and the Curaga counter as his own hook
(V4, V5).

## 2. Row by row

Rows are the note's section 9. "Done" means built, tested against the decision table and mutation-checked.

| Rows | Verdict |
|---|---|
| Y1 to Y6 (Yunalesca) | Done in `7d0a7077` |
| B1 to B7 (Braska's Final Aeon) | Done. B7's "the scene needs Tidus alive" is unreachable (Talk is Tidus's command); Talk's menu row stays usable while a Talk is pending (the game greys it until he has lost the turn) and is greyed for the third Talk (the game offers it and it only speaks) (section 8) |
| P1 to P5 (the Pagodas) | Done |
| V1 to V5 (Yu Yevon) | Done |
| A3 to A8 (inside each possession link) | Done. A8's "+2 for the party" (the battle's start hook and the aeon's own init) is the note's inference and is built as such |
| **A1 (the order of the aeon battles), A2 (the Magus Sisters)** | **Decided, not built:** Bailey, 2026-10-09: "Keep fixed chain for now" (also D-412: seven links, the five story aeons). The chain stays Valefor, Ifrit, Ixion, Shiva, Bahamut. Anima, Yojimbo and the Magus Sisters stay outside it, as optional data |

**Owner-decision check** (DECISIONS.md, `docs/target/decisions*.json`): D-412 and "Keep fixed chain for now" are respected (rows A1 and A2). **D-129** ("Braska's
Final Aeon's Provoke left as is, unsourced") is respected and its premise has moved: the script is now read (note 3.4 step 3: a Provoked boss with a single-actor
target aims at the provoker, and Blade Blitz on the front line is not redirected; he keeps control when provoked), whereas the engine redirects every
target of every move he makes. Left alone under D-129; Bailey may reopen it with the script in hand. PR-0069 (a possessed aeon's affinities are not mirrored from
the player's) still holds: the data file now carries the game's own affinities. No other row contradicts a recorded decision.

## 3. Tests

New, 93 tests in four files, each against its decision table, with the exact odds from all 65,536 draws where a roll decides and the note's interpreter
tallies reproduced (the Pagoda Curse split 68.97 and 28.98 percent, Form II's heal with one Zombie; the interpreter's own sample read 69.18, 29.24 and 40.31):

| File | Covers |
|---|---|
| `re-parity-ai-bfa.test.ts` (33) | the three phase tables and their odds, the opener, the Overdrive branch and its targets, the stored gauge, hit-event gains, the transformation (CTB untouched, the two hooks that skip the property copy), the latch, Talk |
| `re-parity-ai-pagodas.test.ts` (19) | who gets the Power Wave, the Curse / Osmose split and its odds, destruction, the pool across lives, Zanmato, heals and non-HP commands, the delay draw and Slow, the return, the Power Wave's gauge on an aeon |
| `re-parity-ai-possessed.test.ts` (26) | stats and affinities, each aeon's table with the draw order, the gauge, the Overdrive and Valefor's choice, hit events, the opening, the fayth's revival |
| `re-parity-ai-yu-yevon.test.ts` (15) | the idle first turn, Gravija's group and what it hurts, Osmose, Ultima and the count, the counter per sub-action, a Doublecast, the Zombie route |

**Mutation check:** sixteen one-line mutants of the rules above (a mod, a gain, a boundary, a target filter, an opening counter, the Luck copy, the hook's
self-exclusion, the group-target switch ...) were applied one at a time and run against these files; all sixteen were caught (scratch driver
`D:\Tools\ffx-parity\ai-b-measure\`, results in the scratchpad log).

Changed, with the game's reason:

| Test | Change | Reason |
|---|---|---|
| `ffx-ai` | the Yu Yevon tests rewritten (first turn only idle; Gravija's group; the counter through hit events); the Talk title | note 6.2 and 6.3; note 3.4 and 3.6 |
| `ffx-yu-yevon-counters` | Gravija reaches the party and Yu Yevon, not the Pagodas; the 4th Curaga of the attack line is a Pagoda's Power Wave on a Zombie Yu Yevon; the attrition route waits and swings under 1,000 | V2, V5; his Pagodas return with what they absorb, so suppressing them is not the route |
| `ffx-yu-yevon-exit` | the defend-only end HP is under 10,000 and above 0 (it was above 1,000: the old reading parked him on 6,001; he now cycles between a few hundred and about a thousand) | V1, V2 |
| `chk023-runtime-proofs` | Gravija must not reach the Pagodas; a counter may follow a Pagoda's Power Wave on a Zombie Yu Yevon and nothing else of his side | V2, V5 |
| `late-aeon-rows`, `iter2-b1-switches` | Luck 0 and MP 1; the mirror lives in `possession-setup.ts` | A3, A4 |
| `parity-ffx-engine-wiring` | the "set aside" bound on a seeded sample 25 -> 35 (27 of 400 now): four possessed specials became single-target rows like the player's own and joined the pool | data correction, a sample bound |
| `enemy-intent` | two new tests: the Overdrive note and Talk's timing; Yu Yevon's counter line | previews follow the rules |
| `strategy-braskas-final-aeon` | seed 1 -> 3 (the shipped line now loses seed 1's first link); 37 of 40 (was 39); the swinging block rewritten (below) | measured, section 4 |
| `flow-encounter-chain`, `audio-chain-entrance-owner` | Chapter 3 is walked on seed 7 (seed 1 loses link 1) | a seed pin that moved with the rules |
| `ffx-engine-golden` | `braskas-final-aeon#1` seven victories -> a defeat on link 1; `#7` seven victories with new digests; **every other digest unchanged** | "game-script parity" |

## 4. Before and after

Harness: the shipped `intendedStrategy` through the whole chain, the same code path as `ffx-parity-measure.test.ts` (here a scratch copy with per-link turns,
`D:\Tools\ffx-parity\ai-b-measure\`). Before = this lane's base (`a563e1d8`), after = this branch. 500 seeds:

| Chapter | Wins | Party turns | Party KOs | Per link (engine turns) |
|---|---|---|---|---|
| II Yunalesca | 499 -> **483** | 132.4 -> 162.9 | 8.2 -> 12.7 | 184.9 -> 226.6 |
| III Braska's Final Aeon (7 links) | 488 -> 486 | 257.7 -> 245.3 | 5.3 -> 5.2 | 225.1, 15.9, 44.8, 38.2, 37.8, 84.7, 15 -> 231.2, 11.6, 23.4, 21.7, 24, 70.3, 15 |

12 seeds: Chapter II 12 -> 10 of 12 (134.6 -> 159.1 party turns), Chapter III 12 -> 11 of 12 (255.4 -> 238.5). Every Chapter III loss is on link 1, before and after
(12, now 14 of 500): from the possessed aeons on the party carries the fayth's Auto-Life and cannot lose.

**Chapter II got harder** (this part is `7d0a7077`; unchanged by the later work): 3.2 points fewer wins (16 of 500) and 55 percent more party KOs. Cause, from ablations: her Form III
answer to a summoned aeon, Mind Blast with its Curse and then Osmose, lands on the aeon on the field as her script says (the engine aimed it at the first party member,
who was not on the field), and a cursed aeon cannot spend its Overdrive; and her counters now follow a hit that missed. Reverting both: 497 wins and 132.4 turns.

**Chapter III did not move beyond noise in wins** (488 -> 486 is well under one standard deviation). What moved, and why, from ablations on a scratch copy with one rule put back at a time
(500 seeds each):

| Configuration | Wins | Party turns | Per link |
|---|---|---|---|
| before | 488 | 257.7 | 225.1, 15.9, 44.8, 38.2, 37.8, 84.7, 15 |
| every row put back (old scripts, no opening or revival rule, old mirror, old Yu Yevon), the new engine | 488 | 258.8 | 225.1, 21.6, 43.1, 36.2, 36.6, 86.4, 15.9 |
| after | 486 | 245.3 | 231.2, 11.6, 23.4, 21.7, 24, 70.3, 15 |
| after, but no opening or fayth-revival rule (A7, A8) | 486 | 262.0 | 231.2, 18.5, 37.5, 32.9, 35.3, 95.9, 15.9 |
| old scripts, new opening and revival | 488 | 242.4 | 225.1, 13.5, 30.5, 20.7, 22, 62.6, 15.3 |
| after, but the Pagodas' old fixed return (5,000 plus overkill, 63 or 72 ticks) | 486 | 243.6 | 231.2, 11.6, 23.2, 21.8, 23.8, 67.9, 15 |
| after, but Yu Yevon as before (alternating no-op, Pagodas in Gravija, counters for the party only) | 486 | 244.8 | 231.2, 11.6, 23.4, 21.7, 24, 70.3, 13.3 |

- **The engine changes alone (hit events, the group target, the Pagoda's exact return) move nothing**: row 2 reproduces the "before" numbers.
- **Links 2 to 6 are 30 to 45 percent shorter** because of **A7 and A8**: a character the fayth revives acts next (CTB 0), and the possessed aeon, the Pagodas and the party open in
  the script's order. Those fights are won by a party that keeps getting KO'd and keeps getting up; it now gets up at once. Putting those two rules back restores the old lengths.
- **Link 1 is 2.7 percent longer and loses 2 more seeds of 500** because of the Braska's Final Aeon and Pagoda scripts themselves (rows B1 to B7, P1, P2): the old scripts
  reproduce the old link exactly. Per run he now casts Jecht Beam 10.7 times (8.3 before: 1/3 in phases 0 and 2, not 1/4), Ultimate Jecht Shot 2.2 (2.5), Blade Blitz 11.3 (10.5).
  The Pagodas' compounding return is not what moves it: the shipped line Slows the Pagodas and leaves them standing, so it destroys few (1.8 a run, was 4.3).
- Yu Yevon's rows barely touch the shipped line (15 -> 15 turns; 13.3 with the old rows): Doom decides that fight.

**A party that swings at Yu Yevon now wins in about 24 turns, not hundreds.** On the last link alone, forty seeds, the party only swings (Auron's weapon lands Zombie, so each Curaga he
draws on himself is 9,999 of damage until a Pagoda's Power Wave strips it): old engine 35 wins in 410 to 842 turns and 5 stalemates; now 40 of 40 in 18 to 46 turns (median 24). The
cause is again A7 and A8 (either alone: 64 and 27 turns median; both put back: 37 of 40 stalemate). This is one of the five exits the research lists (note 6.3 and `ffx-bfa-yu-yevon.md` 3.5),
now at the game's pace. The block in `strategy-braskas-final-aeon.test.ts` that pinned "swinging stays the slow route" is rewritten to pin this.

Chapters other than II and III: every golden digest is unchanged, so their event logs are byte for byte the same.

## 5. Behaviour the player will see

1. Braska's Final Aeon overdrives on a fixed schedule he no longer rolls for: +2 or +3 a turn, +5 a hit, +20 a Power Wave, the Overdrive the turn *after* the gauge reads 100, Talk clearing it when his next turn starts.
2. Jecht Beam comes a third of the time in his first and third phases; the Blade Blitz opener is as before.
3. Destroyed Pagodas come back after two or three of their own turns with everything they absorbed (a Slowed one after one), so a Pagoda broken by a 12,000-point blow comes back with 12,000.
4. A possessed aeon's special lands on one actor (not the whole party), Bahamut's Impulse on all, Anima always uses Pain, and an Overdrive is forced on the whole front line.
5. A party member the fayth revives gets up at once.
6. Yu Yevon casts Gravija every turn; it no longer reaches his Pagodas; seven damaging actions make his next turn Osmose on each of the three, then Ultima.
7. The advisor previews: Braska's Final Aeon's Overdrive note says his next turn is the Overdrive when the gauge reads 100 and that Talk clears it then; Yu Yevon's counter line names the rule.

## 6. Stale text and code that still describes the old fight (listed, not changed)

- `src/engine/tactics/braskas-final-aeon.ts` (the shipped auto-battle line and the advisor card): written against the old fight: the 63-tick Pagoda return (killing the pair is costed at 10,000 to 15,000 damage a cycle),
  "nobody hits Yu Yevon until his own Gravija has taken him under 900" (`YU_YEVON_FINISH`: he now cycles around 250 to 1,000, so the line waits for a dip or its Doom), the claim that Gravija cannot outrun the Pagodas. The line still wins 486 of 500; nothing was retuned.
- `src/data/guides/braskas-final-aeon.ts`: the Yu Yevon cards say "damage does not [beat him]" and "do not hit him"; with his own Gravija every turn a hit that is worth more than his few hundred HP finishes him (the Curaga he queues is refused by the death check), and the Zombie weapon turns his counter on him.
  "With both alive he Overdrives about every other turn" is the old gauge. `src/data/guides/docs/braskas-final-aeon.ts` (Jegged's page) describes the real game and agrees with the new Pagodas.
- `src/data/guides/yunalesca.ts`: the Form I Blind counter is described for "every landed physical hit"; it follows every action that reaches her, a miss included, and its gate reads the target she last picked.
- `research/ffx-bfa-yu-yevon.md` 3.3 to 3.5 (Gravija reaches the Pagodas; the half-idle turns; "kill the Pagodas to win by attrition") is the wiki's reading and is superseded by `re-ffx-ai-yunalesca-bfa.md` 6.

## 7. Not done, and what could not be sourced

- **Draws the game takes and ours does not:** Braska's Final Aeon in phase 2 spends one discarded `findMatchingChr` (stream 4) on every hit event (m132 @0x06C8); it changes no outcome in a single-stream engine and matters only if plan P3 adopts the game's streams.
- **Empty sub-actions** (Special 1 and 2, the Summon and "Possessed by Yu Yevon" actions): cosmetic here, not modelled; a turn on which a script queues nothing is charged a rank-3 recovery (the note's guess, 7.1).
- **Yu Yevon's own opening CTB** (First Strike in `sins07_10`): the engine's, and batch W2's (opening CTB), not set here.
- **A Doublecast's hit-event cadence** (two events) follows the note's reading of the executor; it has not been observed in the game.
- **Possessed Yojimbo's Kozuka and Wakizashi** are not in our data: both sides of his coin use the Daigoro row. Anima's Oblivion row is a random-target row where her script casts it on the whole front line, and the Magus Sisters keep their old three-battle script (rows A2, decided). All three are outside the default chain.
- **The possessed aeons' Overdrive bar:** the game shows it; ours is kept in the actor's memory and not drawn.
- **The note's own open points** that these rules lean on: private variables start at 0, the party's +2 at the opening, and the rank-3 recovery of a turn that queues nothing (note 7). The timing session could measure the opening CTB and the revival's first turn in a possession fight.
- **Browser check:** no UI file changed except preview copy, and this worktree has no `public/art`, so the plan's real-input browser check is left to the main session's validation.

## 8. Decisions for Bailey

1. **A party that swings at Yu Yevon now wins in about 24 turns** (the game's Zombie route at the game's pace; the shipped Doom line is unchanged at 15). Keep, as it is the script's pace and the 1:1 reading (recommended)? If you would rather keep the long fight,
   the cause is two rules, A7 (the fayth's revival acts next) and A8 (the opening order), and neither can be put back without being less true to the game.
2. **Chapter II is 3.2 points harder** (96.6 percent of seeds, was 99.8) and its party KOs rose by 55 percent, from two script rules (above). Both are the game's.
3. **Braska's Final Aeon and Provoke (D-129):** the script is read now (a Provoked boss aims a single-actor target at the provoker; Blade Blitz on the front line is not redirected). Ours redirects every target. Left alone under D-129; say if you want the script's rule.
4. **Talk's menu row:** in the game Talk is greyed until his next turn once used, and the third Talk is offered and does nothing but speak. Ours keeps it usable between the first and second use and greys the third ("Nothing left to say"). A visible menu change, so it needs your yes first (AGENTS.md rule 9).
5. **The auto-battle line and the advisor card for Chapter III** still teach the old fight (section 6). They win 486 of 500; retuning them is a separate batch and needs your yes.

## 9. Full suite

One run of the whole unit suite on `76ecbb09` (2026-10-09): **936 files: 901 passed, 22 failed, 13 skipped; 13,922 tests: 13,671 passed, 162 failed, 88 skipped, 1 todo.** The run used
`--fsModuleCache --fsModuleCachePath D:/Tools/ffx-parity/ai-b-vitest-cache --testTimeout=60000 --maxWorkers=4` because the host was saturated by every lane's own whole-suite run: a plain run had
finished 81 files in 29 minutes (and two timing tests, the Evrae orders copy and the Zanmato gauge banner, and the Sin bench timed out at the default 15 and 60 seconds; all three pass alone, in 2, 4 and 32 seconds).

**21 of the 22 failing files are the art-only failures this worktree has without `public/art`** (the same 21 files and the same tests as W1's list: `ui-portrait-face-crop` 125 tests, `chapters/trema-ship-content` 4,
`art-ref-defaults` 4, `pause-remake` 3, `chapters/isaaru-ship` 3, `chapters/den-of-woe-ship-content` 3, `chapter-meta-seymour-anima-macalania` 3, `chapter-meta-evrae` 3, `chapters/natus-ship-scene` 2, `chapters/natus-ship-content` 2,
`chapters/leblanc-art` 2, `chapters/fallen-aeons-ship-content` 2, `chapter-meta-ffx2-leblanc` 2, `cutscene-story-poses` 1, `chapters/fallen-aeons-ship-scene` 1, `chapters/den-of-woe-ship-scene` 1, and five files that fail on import because
`public/art/manifest.json` is missing: `party-face-manifest`, `chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`). That is 161 failing tests.

**The 22nd was this lane's:** `audio-chain-entrance-owner` walked Chapter 3's chain on seed 1, whose first link the shipped line now loses. Fixed in `863ac4f9` (seed 7) and re-run green. Nothing else outside the art-only set failed, and
`ffx2-atb-golden` and `ff7-golden` passed unchanged.

## How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/re-parity-ai-*.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ffx-yu-yevon-*.test.ts tests/unit/strategy-braskas-final-aeon.test.ts tests/unit/strategy-chapter2.test.ts
PYREFLY_MEASURE=1 node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-parity-measure.test.ts   # every FFX chapter, 12 seeds
node tools/orphans.mjs
```

The 500-seed measurements and the ablations used scratch copies of the harness (`zz-measure-b.tmp.test.ts`, kept with the results in `D:\Tools\ffx-parity\ai-b-measure\`, never in the repo).

`NOW.md` is left to the main session (other agents are active in the tree).
