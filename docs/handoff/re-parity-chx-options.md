# Re-parity CH-X-OPTIONS: measured options for our Chapter X line now that Natus's Flare has the game's rank

Status: **built and committed on branch `re-parity-chx-options` (from `919f2c78`, the RC2-W2 merge), pushed to `origin/re-parity-chx-options`; not merged, not deployed.
Nothing is switched on: the shipped line is exactly what it was, and Bailey picks.**
**Game case: FFX only** (AGENTS.md rule 14): Seymour Natus, Mortibody and the Highbridge exist only in FFX (research `ffx-seymour-natus-highbridge.md` 0.3). The FFX-2 and
FF7 engines import none of the files this batch touched; `ffx2-atb-golden` and `ff7-golden` pass unchanged, and so does `ffx-engine-golden` (18 of 18; it plays the registered line for
Chapter X, seeds 1 and 7, which is still `shipped`, so its digests did not move and no golden was re-pinned).

Bailey, 2026-10-08: "It needs to be a 1:1 parity." The consequence this lane answers: RC2-W2 (`919f2c78`) gives Natus's Flare the game's rank 3 (command record 0x6079; our data
had 5), and Chapter X fell from 386 to 302 wins of 500 on the shipped line. This lane builds measured options for **our line only** (the tactic, the guide's steps and the
pause tip; the move advisor plays the tactic). **Never touched:** boss numbers, Natus's script, the Flare rank, enemy data, the party preset, any engine file.

## 1. Result

Every row plays Chapter X through the app's own `setupForChapter` (the real party build and formation), `autoResolveMinigames` on, the same seeds, the RE-parity harness's own path
(`tests/unit/chapters/natus-options-lib.ts`; the `shipped` row equals the committed `ffx-parity-measure` harness run at `919f2c78` seed by seed: 302 of 500, 9 of 12).

| Line | What it changes | 12 seeds | 500 (1 to 500) | holdout (501 to 1000) | party turns a fight | party KOs a fight |
|---|---|---:|---:|---:|---:|---:|
| `shipped` (live; Bailey's pick of 2026-09-25) | nothing | 9 | **302 (60.4 %)** | **304** | 56.7 | 5.4 |
| `bahamut` | send only Bahamut | 12 | **453 (90.6 %)** | **456** | 53.8 | 4.9 |
| `reflect` | Bahamut alone, and Rikku Reflects Natus | 12 | **492 (98.4 %)** | **493** | 33.2 | 1.3 |
| `mirror` | Provoke Natus, Reflect on Tidus, no aeons | 12 | **500 (100 %)** | **500** | 46.9 | 0.6 |
| (for reference) `shipped` with Flare at the old rank 5 | | | 386 (77.2 %) | | | 2.4 |

The same four lines on **`origin/re-parity-w5`** (W5 branches from `919f2c78` and touches no tactic or guide file, so the candidate files overlay it unchanged; measured
in a src-only copy under `D:\Tools\ffx-parity\chx-options\w5`, not in the repo):

| Line | 500 (1 to 500) | holdout (501 to 1000) | 12 seeds |
|---|---:|---:|---:|
| `shipped` | **342** | 353 | 10 |
| `bahamut` | 427 | 419 | 10 |
| `reflect` | 485 | 477 | 12 |
| `mirror` | 500 | 500 | 12 |

The order is the same on both trees; W5 lifts the shipped line (342, the number W5's note reports) and trims `bahamut` by 5 to 7 points and `reflect` by 1 to 3. The picks below do not depend on which tree ships.

Commits (all on `re-parity-chx-options`, each ends with the Co-Authored-By line):

| Commit | What |
|---|---|
| `34c4940d` | The tactic split into its row readers, the knobs each line turns, Kimahri's slot detour and the mirror play; `NATUS_LINE` picks the line; `shipped` is rules 1 to 10 untouched |
| `6ea6bc66` | The guide, the pause tip and the NEXT line follow `NATUS_LINE`; each candidate's sentences, cited; the shipped guide untouched |
| `3a0c667e` | The tests: the switch, the whole game path per id (off by default), the bench and the diagnosis |
| `83c58f9f` | The switch test: a pick flips exactly one assertion (probed) |
| (this commit) | This note, and a dated correction in the research note (Flare's rank is 3) |

## 2. Diagnosis (hard rule 3: the engine, real seeds, the event logs)

The shipped line, 500 seeds, the whole chapter through `setupForChapter`, read from the event log (`natus-options-diag.test.ts`; raw output `D:\Tools\ffx-parity\chx-options\diag\`).

| Per fight (mean of 500) | Flare at the old rank 5 | **Flare at the game's rank 3 (now)** |
|---|---:|---:|
| wins | 386 | **302** |
| Flares Natus casts | 4.67 | **7.3** |
| party turns between two Flares | 4.7 | **3.13** (ticks between his Flares: 30, always) |
| party KOs | 2.42 | **5.37**, of which **5.30 are Flares** |
| party turns spent on revives (Phoenix Down + Life) | 2.3 | **5.0** |
| Claws straight after a Break (no party turn between, so no Soft in time) | 1.8 | 1.85 |
| shatters (a guardian gone for the battle) | 0.62 | **0.65** (lost battles: 1.54; won: 0.07) |

- **The mechanism is Flare, and Shell.** A Flare takes **2,017 on average from a guardian without Shell and 1,013 with it** (party preset: Tidus 2,420 HP, Yuna 1,650, Auron 3,410). Without Shell
  it kills 86 percent of the time in won battles and 95 percent in lost ones; with Shell 8 and 13 percent. Yuna (1,650) is one-shot by an unshelled Flare at any HP (82 percent kill),
  and an unshelled Flare at 90 percent HP still kills 52 percent of the time. Only 25 percent of the Flares that land in won battles (14 percent in lost ones) meet a Shell: the shipped
  line heals before it Shells, a KO strips the Shell and the Haste along with the guardian, and Mortibody's Desperado (0.82 a fight) strips the rest.
- **It is a death spiral, not one bad hit.** Each KO costs a revive turn (5 of the 57 party turns), brings the guardian back without Haste or Shell, and the next Flare is 3 party turns away.
  Won battles: 4.96 KOs, 27.5 party turns after the first Flare; lost battles: 5.98 KOs and **14.5 party turns after the first Flare**, 46.5 turns in all, Natus left with 13,082 HP.
  The log of seeds 3 and 17 is the whole pattern: `yuna:life>auron | natus-flare>auron | mortibody-cura>natus | yuna:life>auron | natus-flare>auron | ...`.
- **Every loss but one has a shatter** (197 of 198; 132 in the 12,000 to 24,000 band, 65 below 12,000). The band is where the party *fell*; Mortibody's Cura heals Natus back above 12,000
  (the script recomputes the phase from his HP at every hit, research `re-ffx-ai-seymour.md` 4.4), so a battle that is in phase 3 most of the time ends in the band above it.
- **The four extra aeons are the line's second leak.** Claw-straight-after-Break is 2.42 a fight in lost battles (1.48 in won), and sending Bahamut alone takes it from 1.85 to **0.51** and shatters
  from 0.65 to **0.15**. Observed, not isolated: each aeon on the field makes Natus spend his turn on Banish while Mortibody passes, which looks like it moves the two bosses' turns back to back.
  What is certain is the effect (section 3.1) and that the four aeons arrive without a full gauge (research 6.2, 6.3 row 3).
- **What did not move it** (section 5): hasting nobody (302 to 248), spending Tidus and Auron's Overdrives on Natus (330), the Al Bhed Potion for a stone (340), Yuna Shelling before she heals (333).

## 3. The candidates

Rule I wrote down before measuring: a candidate is a change to our line that has a source line for every step, that the guide can say in its three to five rules, and that is one named id behind one constant.
`NATUS_LINE` (`src/data/guides/natus-line.ts`) is the switch: **picking one is one edit to that constant** (`'bahamut'`, `'reflect'`, `'mirror'`), and the registered tactic (auto-battle), the guide's
NEXT line, the move advisor, the guide's rules, hints and phase notes and the pause tip all follow it (`natus-line-pick.test.ts` proves it for each id). `'shipped'` puts it all back.

### 3.1 `bahamut`: send only Bahamut (the smallest step)

- **What.** Yuna sends Bahamut once, whose Overdrive gauge arrives full, and spends his one turn on the Overdrive (as the shipped line does); the other four aeons are not sent, so her turns go to Shell, heals and Haste.
  Nothing else in the 10 rules changes.
- **Why.** Research `ffx-seymour-natus-highbridge.md` 6.3 row 3 ("summon aeons with full gauges") and 6.2 (only Bahamut is known to arrive full), and Jegged (`jegged-encounter-guides-ffx-b.md` 3, item 5: "casting an aeon
  is mostly useless because Natus Banishes it, except for a Grand Summon Overdrive"). The guide's own rule 4 already says "Send one with a full gauge".
- **Rates.** 12 of 12; **453 of 500 (90.6 %); holdout 456**; W5 tree 427 and 419. Party KOs 4.9, shatters 0.15 a fight (shipped 0.65), Claw straight after Break 0.51 (1.85), party turns 53.8.
- **Guide steps.** Rule 4 becomes "Only Bahamut is worth a turn ... The other four arrive without a full gauge and only swing once, at the cost of a turn of Yuna's." The summon hint says the same; the phase-3 note and the Cura / Hi-Potion hint carry the Flare cadence (section 6).
- **Plain words.** Right now Yuna sends all five aeons before she does anything else, and four of them arrive with an empty Overdrive and just take one swing before Natus banishes them. This option sends only Bahamut, who arrives with a full gauge and
  spends it, and Yuna's other turns go back to Shell and healing. Nothing else changes. It wins about 9 fights in 10 where the live line wins 6.

### 3.2 `reflect`: Bahamut alone, and Rikku Reflects Natus (recommended)

- **What.** `bahamut`, plus Kimahri's opening slot goes to Rikku before Auron: Rikku casts Reflect on Natus once (a switch gives the incoming member the turn at once, so it costs only the cast), then hands the slot to Auron.
  Mortibody's Cura (1,200 a cast, aimed at Natus) bounces onto a guardian instead of healing him.
- **Why.** Research 4.3 and 6.3 row 5 (`[verified: 2 sources]`, wiki Mortibody and Jegged); Jegged section 3 item 4: "Reflect on Natus bounces the Cura onto the party". Rikku, not Yuna, because the Highbridge preset gives Yuna no Reflect and Rikku has it
  (Jegged's own adaptation, `jegged-encounter-guides-ffx-b.md` 3 "Fit to our chapter"). Cast with no spell of ours aimed at Natus, so nothing of ours bounces. The Desperado count only reads the three active slots, so a Reflect on Natus never adds to it.
- **Measured behaviour.** In 100 battles Mortibody cast Cura 179 times, **all 179 after the Reflect and all 179 bounced; Natus was healed 0 times**; the Reflect was never stripped before Natus fell.
- **Rates.** 12 of 12; **492 of 500 (98.4 %); holdout 493**; W5 tree 485 and 477. Party KOs **1.3** (5.4), party turns **33.2** (56.7), Flares that reach the party 1.9 a fight (7.3), shatters 0.09, Mortibody's Cura 1.7 a fight (7.15) because the fight is
  over before the long tail. All 8 lost seeds have a shatter: the Break and the Claw land back to back before a Soft (2.25 of the 3 Claws a lost fight come straight after a Break; 3.88 stones, 1.75 shatters).
- **Guide steps.** Rule 4 is one rule with two halves ("Send Bahamut alone, and let his Overdrive be the one turn ... Then have Rikku put Reflect on Natus"); a hint on the Reflect row and one on Kimahri's switch; the Flare phase note and hint.
- **Plain words.** Same as the first option, and in the opening Rikku steps in for one turn to put Reflect on Natus, then Auron takes her place. In the last phase Mortibody keeps trying to heal Natus for about 1,200 a cast; with Reflect on him the heal
  bounces off and mends one of you instead, so the last 12,000 HP stop being a slog. Fights get much shorter (33 party turns instead of 57) and far fewer guardians fall. It wins 49 fights in 50.

### 3.3 `mirror`: Provoke Natus, Reflect on Tidus (the biggest change)

- **What.** Kimahri hands his turn to Rikku and Yuna hers to Auron (the party is Tidus, Rikku, Auron); no aeon is sent and nobody is Hasted. Tidus Provokes Natus; Rikku keeps Reflect on Tidus; heals are items (a Cura on a Reflected Tidus would bounce);
  Auron Talks and swings. This is the bench's old `provokeReflect` line moved into the tactic without a rule changed.
- **Why.** Research 6.3 row 2 (GameFAQs strategy 2, `[single source]`) and now the game's own script (`research/re-ffx-ai-seymour.md` 4.1 and 4.3: Natus **keeps control when Provoked**, and Multi-ra, Break and Flare are each "Provoked: on the
  provoker, forced"). A Reflected Provoker sends all of them back (Flare and the Multi-ra pair land on Natus, Magic Defense 0; Break misses him, he is Petrify-immune).
- **Rates.** 12 of 12; **500 of 500; holdout 500**; W5 tree 500 and 500. Party KOs 0.57, party turns 46.9. No Flare ever reaches the party, **0 stones, 0 shatters, 0 Desperados** in 500 battles; Mortibody (which cannot be Provoked) still Claws,
  Curas and casts, and the bounces also hit Mortibody (1.32 kills a fight, each a Mortibsorption on Natus).
- **Guide steps.** Rules 1 to 3 are rewritten (a Reflected Break misses; Provoke and keep Reflect on the Provoker; Reflect on Tidus is the whole plan, put it back if he falls); five hints; the phase-2 note.
- **Plain words.** Tidus Provokes Natus so that every spell he casts is aimed at Tidus, and Rikku keeps Reflect on Tidus, so Natus's own Multi-ra and Flare bounce back onto him and his Break misses. There are no aeons and no Haste, and Yuna steps out for Auron.
  The party mostly waits (it defends about 18 turns a fight) while Natus beats himself; it never loses. It is a single-source trick (GameFAQs plus our engine's bounce rule) and it removes every threat but Mortibody's Claw, so it is the "solved by a trick" option.

**Not a candidate, measured as a dial:** `healUnder` (the HP fraction at which the line heals; shipped 0.45). Raising it is the cheapest change to the shipped line and the numbers are knife-edge, not a rule a guide can teach (section 5).

## 4. Recommendation

**`reflect`.** It is the line Jegged's plan describes (aeon only for the Overdrive, Reflect on Natus against the Cura; the guide follows Jegged), it keeps the fight a fight (a mean of 1.3 guardians fall and 8 seeds in 500 lose, against 5.4 and 198 today, and 33
turns against 57), the party that wins it is the party the player already has, the Reflect holds to the end, and it holds on the W5 tree too (485 and 477). `bahamut` is the smaller step if Bailey wants the shipped feel with the leak closed (90 percent);
`mirror` is the pick only if he wants Natus solved by a trick. `bahamut` rests on no new rule, `reflect` on the engine's Reflect bounce (the Cura lands on a guardian, 179 of 179 times), `mirror` on Provoke as well (the script says Natus keeps control, section 3.3).

## 5. What else was measured (the dials; not offered, so they are not pickable ids)

All on the shipped line unless noted, seeds 1 to 500 unless the row says 1,000 (the first block ran as real `NatusLine` knobs, `PYREFLY_CHX_KNOBS`; the rows marked scratch ran in a throwaway prototype of the same rules, not kept).

| Change | Wins of 500 | Party KOs | Reading |
|---|---:|---:|---|
| nothing (`shipped`) | 302 | 5.4 | |
| heal under 0.6 / 0.8 / 0.9 (shipped 0.45) | 368 / 405 / **494** | 2.9 / 2.0 / 1.7 | a cliff: 0.85 is 410, 0.9 is 494, and 1,000 seeds: 822 and **992** |
| heal under 0.9 on top of `bahamut` | 350 (of 1000: 704) | 3.7 | **worse** than either alone: the heal dial fights the other fixes, so it is a fit, not a rule |
| heal under 0.9 on top of `reflect` | 457 (of 1000: 916) | 2.3 | the same |
| Yuna Shells a bare guardian before she heals (`shellBeforeHeal`) | 333 | 5.4 | more Shell, and the same 5.4 KOs a fight: the cause was not isolated |
| the Al Bhed Potion for a stone (`alBhedForStone`) | 340 | 3.9 | |
| Tidus and Auron spend a full Overdrive on Natus (`partyOverdrives`) | 330 | 4.4 | |
| nobody Hastes (scratch) | 248 | 5.1 | the shipped Haste rule is right |
| aeons: none (scratch) / held for the Flare phase (scratch) / Bahamut only | 445 / 458 / 453 | 4.7 / 3.4 / 4.9 | the four extra aeons are the leak; where Bahamut goes does not matter much |
| Lulu's Bio on Natus (`detour.bio`), shipped relay | 408 (of 1000: 807) | 2.0 | Jegged's "Bio early": Poison ticks never move the phase, and the fight is shorter (41.5 turns) |
| Bio + Reflect, shipped relay | 439 | 0.9 | |
| Reflect alone, shipped relay kept (`detour.reflectNatus`) | 488 (of 1000: 973) | 1.2 | the first definition of `reflect`; the Bahamut trim adds 1 point on top (985). If Bailey wants the five-aeon relay kept, this is the option |
| Bahamut alone + Lulu's Bio (1,000 seeds) | 949 of 1000 | 1.9 | Jegged's "Bio early" adds 4 points to `bahamut` (909) |
| Bahamut alone + Bio + Reflect (1,000 seeds) | 953 of 1000 | 0.7 | fewer KOs, but 32 fewer wins than `reflect` alone (985): Kimahri's slot stops at Lulu and Rikku before Auron, one more turn spent |
| `reflect` + Tidus and Auron's Overdrives on Natus (1,000 seeds) | 985 of 1000 | 1.3 | no change |
| `reflect` + Yuna Shells before she heals (1,000 seeds) | 963 of 1000 | 1.5 | 22 fewer |

The heal dial is why `healUnder` is not offered as a fourth id: it reaches 99 percent alone and loses 25 points when it is combined with either of the sourced changes, so it cannot be explained to a player as one rule. The 0.9 is also an unsourced number of ours.

## 6. The guide text

### 6.1 For the shipped line (text only; nothing else changes; Bailey's call whether to apply it with or without a line pick)

The shipped guide says only "Natus casts Flare; Mortibody Curas him for about 1,200" (phase 3) and "Multi-ra hits two guardians for about a thousand each, and Flare one for twice that" (the Cura / Hi-Potion hint). They teach nothing wrong, but they teach
nothing about the pace the game's rank gives. Drafts, in players' words (no ticks, no ranks), each cited:

| Where | Draft | Cite |
|---|---|---|
| phase 3 note | "Natus casts Flare at one of you about every third turn of yours, as often as any other spell he has; Mortibody Curas him for about 1,200 in between." | `ffx-seymour-natus-highbridge` 3.1 (corrected 2026-10-10), 4.1; this note, section 2 |
| Cura / Hi-Potion hint | "Flare comes about every three of your turns and takes about 2,000 from a guardian without Shell, half that with it: mend {target} before the next one" | `ffx-seymour-natus-highbridge` 3.3; this note, section 2 |

Every candidate's guide already carries both sentences (`src/data/guides/natus-line-text.ts`, `FLARE_PHASE` and `FLARE_HINT`). To ship the two sentences on the shipped line alone, add them to `NATUS_LINE_TEXT.shipped`
(`{ phases: { 2: FLARE_PHASE }, hints: [FLARE_HINT] }`) and change the test that pins `NATUS_LINE_TEXT.shipped` to `{}`; this note does not do that, because the shipped guide is Bailey's approved wording.

### 6.2 Per candidate

All text lives in `src/data/guides/natus-line-text.ts` (the rules a line replaces, the hints it adds, each one fires on a real board in the test; one phase note; the pause tip) and every sentence cites. The pause tips:

- `bahamut`: "He has no Defense, so every swing lands in full. Soften a stone guardian at once, Haste only Tidus and Auron, and send Bahamut alone."
- `reflect`: "He has no Defense, so every swing lands in full. Soften a stone guardian at once, Haste only Tidus and Auron, send Bahamut alone, and have Rikku Reflect Natus so Mortibody's Cura bounces off him."
- `mirror`: "He has no Defense, so every swing lands in full. Provoke Natus with Tidus and keep Reflect on him: his spells and his Break bounce back."

Research note: `ffx-seymour-natus-highbridge.md` 3.1 now carries a dated correction (Flare is rank 3; "his turns come further apart" is superseded).

## 7. How to pick

1. Edit `NATUS_LINE` in `src/data/guides/natus-line.ts` (`'shipped'` today).
2. Nothing else. Probed with the constant set to `reflect` and then put back (nine `natus-*` test files, `guide-doc`, `tactics-lookup`, `guide-advisor-target-agreement`), and to `mirror` for the switch test: everything passes but one assertion, `natus-line-switch`'s "the shipped line stays live until Bailey picks another", which is the one to change in the same commit (the 4 art-only failures in `natus-ship-content` and `natus-ship-scene` are the missing `public/art`).
3. The measurement commands are in section 9.

## 8. Checks

- `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit`: clean.
- The switch test (10 tests, in the default suite): the shipped line answers every menu of 6 whole battles exactly as a verbatim copy of the tactic at `919f2c78` (the registered tactic too), and the registered guide and tip are the shipped ones; each line plays to the end and does
  what it says in the log; each line has three to five cited rules and every hint it adds fires on a real board.
- `PYREFLY_CHX_SWITCH=1 ... natus-line-pick.test.ts` (4 tests, 127 s): with `NATUS_LINE` replaced by each id, the registered tactic (menus 118 / 103 / 66 / 92 over 2 seeds), the guide's NEXT line (agrees on every menu) and the pause tip follow the line. The advisor's
  top card is the line's pick on 6 of 9, 5 of 8, 3 of 5 and 4 of 7 sampled menus (counted, not pinned: the advisor's own look-ahead sits on top of the tactic and picks a row of its own on about a third of menus, the shipped line included).
  (An earlier version of this test mocked the constant with `doMock` per id, and every line after the first played the first line's tactic; the mock is now a getter over one variable.)
- Targeted, before the push: the nine `natus-*` test files, `guide-doc`, `guide-doc-start`, `tactics-lookup`, `guide-advisor-target-agreement` pass (the only failures are the four art-only ones in `natus-ship-content` and `natus-ship-scene`: no `public/art` here); `ffx-engine-golden` (18), `ffx2-atb-golden` and `ff7-golden` pass unchanged.
- The full suite, once, at the end: (result added in the last commit of this branch)
- `node tools/orphans.mjs`: nothing under the Natus tactic or guide files.
- Servers started: none. Outputs kept outside the repo in `D:\Tools\ffx-parity\chx-options\` (the bench and diagnosis files this note names). The W5 measurement was a src-only copy
  (`git archive origin/re-parity-w5 src package.json vitest.config.ts`, the nine changed or new tactic, guide and meta files copied over it, the three bench files added, `node_modules` a junction to the
  main one); it was deleted after the run, junction first. No worktree and no full copy of the repo was made.

## 9. How to re-run

```
# the four lines, 1000 seeds (about 5 minutes): 12 = first 12 of perSeed, 500 = first 500, holdout = 501 to 1000
PYREFLY_CHX_BENCH=1 PYREFLY_CHX_SEEDS=1-1000 PYREFLY_CHX_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/chapters/natus-options-bench.test.ts
# a dial the game does not offer (JSON of NatusLine overrides on the shipped line), no named lines
PYREFLY_CHX_BENCH=1 PYREFLY_CHX_LINES=none PYREFLY_CHX_KNOBS='[{"healUnder":0.9}]' ... natus-options-bench.test.ts
# the diagnosis of a line (default: the live one), and the old Flare cadence
PYREFLY_CHX_DIAG=1 PYREFLY_CHX_LINE=reflect PYREFLY_CHX_SEEDS=1-500 ... natus-options-diag.test.ts
PYREFLY_CHX_FLARE_RANK=5 PYREFLY_CHX_DIAG=1 ... natus-options-diag.test.ts
```

## 10. Open items

1. **Bailey's pick** (section 11). Nothing is applied.
2. Mirror rests on the engine's Provoke and bounce rules (a reflected spell lands on a random living enemy of the reflector: Natus or Mortibody) and on one GameFAQs strategy plus the script's "Provoked: on the provoker, forced"; the real game was not run.
3. The move advisor's own look-ahead picks a different top card than the line on about a third of menus; if a pick is made, a card-follower measurement (the advisor's top card, 100 seeds) is the next number to take.
4. `research/ffx-seymour-natus-highbridge.md` 4.1's "(rank 5, so his turns come further apart)" is corrected by a dated note under 3.1, not rewritten.
5. The statistical caveat: all rates are the engine's, 500 and 1,000 seeds; a 1-point difference between `reflect` and `mirror` is noise, 90 against 98 is not.

## 11. Decisions for Bailey

1. **Which line is live: `shipped` (60 percent), `bahamut` (91), `reflect` (98, recommended) or `mirror` (100)?** Picking is one constant.
2. Whether the Flare-cadence sentences (section 6.1) go onto the shipped guide even if he keeps `shipped`.
3. Whether he wants the smallest change to the shipped feel (`bahamut`) or the closest to Jegged (`reflect`); `healUnder` is not offered because it is a fit, not a rule.
