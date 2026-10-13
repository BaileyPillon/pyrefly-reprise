# Re-parity RC6-CH2: Chapter II's line after the KO rule, and the Auto-Life icon (FOC43-04)

Status: **built, tested and committed on branch `re-parity-rc6-ch2` (from `origin/r43-rc`, `7b2582e7` = the build live since 2026-10-13 05:56Z); pushed to `origin/re-parity-rc6-ch2`; not merged, not deployed** (2026-10-13).
**Game case: FFX only, both parts** (AGENTS.md rule 14). Part 1: Chapter II (Yunalesca), her Zombie, Hellbiter and Mega Death are FFX's. Part 2: the permanent Auto-Life flag exists only in the FFX engine (`src/battle/ffx`); the FFX-2 engine takes a
KO'd unit's statuses without an event and FF7's emits no status events. `ffx2-atb-golden` and `ff7-golden` pass unchanged.

Bailey, 2026-10-12 ~17:50 EDT, to the release driver's question whether to accept the game-true KO rule that drops Chapter II from 476 to 398 of 500 ("accept" = ship it and rework our strategy later): **"I'll go with all of your recommendations"**.
This is the rework. Yunalesca's script and numbers, the KO rule and the party preset are **untouched**; no number of ours was added anywhere.

## 1. Result

| | Before (`origin/r43-rc`) | After (this branch) |
|---|---|---|
| Chapter II, the shipped line, seeds 1 to 500 | 398 (79.6 %) | **453 (90.6 %)** (z +4.9; 83 seeds lost to won, 28 won to lost) |
| holdout, seeds 501 to 1000 | 405 (81.0 %) | **457 (91.4 %)** (z +4.8; 80 and 28) |
| first 12 seeds | 9 of 12 | **12 of 12** |
| party turns, party KOs a fight (1 to 500) | 159.1, 14.6 | 157.7, 13.6 |
| Chapter III, seeds 1 to 500 | 479 (95.8 %) | 479, **identical on all 500 seeds** (turns, KOs and outcome) |
| the old figure, before RC5's Zombie rule | 476 (95.2 %) | not reached; 453 and 457 is the best sourced line (section 3) |

The rework is **one rule**: on his first turn in Form III, Tidus hands the turn to Wakka (the free switch). Wakka wears no Zombie Ward, so Hellbiter always makes him a Zombie, and his Death Ward gives a plain Wakka about an even chance against Mega Death. Part 2 is a
four-line engine fix with a test that pins the event sequence.

| Commit | What |
|---|---|
| `3e8b9b2c` | Part 2: the fayth's permanent Auto-Life has no status event at a KO (`hp.ts`, `statuses.ts`), the pin test, `ffx-engine-golden` re-baselined for Chapter III |
| `78b92007` | the Chapter II candidate ladder as a committed harness (`re-parity-rc6-ch2-ladder.test.ts`) and its ring reader (`helpers/yunalescaRing.ts`, checked by `re-parity-rc6-ch2-ring.test.ts`) |
| `401c9310` | Part 1, the line: `yunalesca-bench.ts` and its call in `yunalesca.ts`, `strategy-chapter2` re-pinned, `ffx-engine-golden` re-baselined for Chapter II |
| `14945a29` | Part 1, the guide: rules, hint, phase note, page paragraphs, the dated update in the Jegged note, `re-parity-rc6-ch2.test.ts` |
| (this note) | `docs/handoff/re-parity-rc6-ch2.md` |

## 2. Diagnosis of Part 1 (hard rule 3: the engine, real seeds)

`origin/r43-rc`, the whole chapter through `setupForChapter`, the shipped `intendedStrategy`. Scratch lab (outside the repo): `D:\Tools\ffx-parity\rc6-ch2\scratch\`.

- **Every loss is a Form III loss, and 71 of the 102 losses in 500 seeds end on a Mega Death.** (Seeds 1 to 40: 10 losses, all in Form III with 4,900 to 42,900 HP left.) The same shape in the traces of seeds 3, 7, 11, 15, 18 and 19: the last
  Zombie dies, the clean party members are raised, and the next Mega Death finds nobody zombified.
- **How often a Mega Death finds no Zombie.** Over 150 seeds there were 516 ordinary Mega Deaths (not the entry one); **43 (8.3 %) found no living Zombie.** 24 of those 43 ended the fight; the other 19 were survived (Auron's Death Ward, 49.5 %, is the likely
  reason; not traced). By Zombies standing at the Mega Death (the first 40 seeds, 172 Mega Deaths): 0 Zombies killed 2.4 members, 1 killed 1.5, 2 killed 0.8, 3 killed none. The entry Mega Death never wiped anyone (the line's Form II hold works).
- **Where the Zombies go.** Her Form III runs a fixed ring with no aeon out: ordinary turn, ordinary turn, Mind Blast, ordinary turn, Mega Death (`re-ffx-ai-yunalesca-bfa` 2.7; the ring reader below predicts every Mega Death exactly). Zombie members die in bulk to
  **Mind Blast** (450 to 670 to everyone, `ffx-yunalesca` 4.3): the share of ordinary turns that start with no Zombie standing goes from 4.7 % before Mind Blast to 14.3 % after it (559 turns, 150 seeds). The Zombies sit at 3 to 40 % HP because nothing can heal them: Dispelling Slap
  (190 to 280, on every swing in Form III) and Curaga (4,400, one shot) wear them down, and a KO clears the Zombie (RC5). After Mind Blast there is one ordinary turn left, one Hellbiter chance, before the Mega Death: with three clean members alive, Hellbiter
  (90 % at no Zombie) lands on at least one of them 87 % of the time because Zombie Ward turns away 49.5 % of every Hellbiter aimed at Tidus, Yuna or Auron (`zanarkand.ts`; `ffx-yunalesca` 7.1); it leaves the party with no Zombie on 23 % of those turns (18 of 78 measured).
- **What the old line relied on.** The tactic's comments say a fallen Zombie comes back "at half max HP and still zombified, which is the sustain here". That was RC5's old rule. A KO takes the Zombie, so each of the ~7 Zombie deaths a fight now returns a plain member,
  and the line spends 14 more party turns repairing it (RC5 handoff, section 6). The line itself had no way to make a Zombie: only Hellbiter does.
- **Who wears what** (`src/data/ffx/builds/zanarkand.ts`): Tidus, Yuna and Auron: **Zombie Ward** (from Mt. Gagazet; the party has no equipment screen) and Confuse Ward; Auron also a Death Ward. **Wakka, Kimahri, Rikku: Death Ward and Confuse Ward, no Zombie Ward.** Lulu: neither.
  Hellbiter's Zombie lands at 100 minus the resistance, so it always lands on a member with no Ward.

## 3. The candidates and the ladder

Every row plays Chapter II from `setupForChapter` with the stated change to our line, the same seeds, `autoResolveMinigames` on. The harness is committed (`tests/unit/re-parity-rc6-ch2-ladder.test.ts`, env-gated by `PYREFLY_MEASURE=1`); `base` is the line before this
batch (it hides the switch rows from the tactic); the harness's `tactic`, its own `swapTidus` and the real `intendedStrategy` equal each other seed for seed (100 seeds). "L to W / W to L" is paired against `base`.

**The candidates (all changes to OUR line only):**

| # | Change | Source | Game |
|---|---|---|---|
| **A (ships)** | **Tidus hands his first Form III turn to Wakka** | Jegged's armour rule ("do not block Zombie, keep at least one character a Zombie", `src/data/guides/docs/yunalesca.ts`, `research/jegged-encounter-guides-ffx-a.md` ch. 2) applied to the preset's armour; `ffx-yunalesca` 10.1, 10.8 (Death Ward or Deathproof as the non-Zombie survivor, verified 2 sources), 10.10; `re-ffx-ai-yunalesca-bfa` 2.12; the free switch `ffx-combat-core` 1.7. **No guide names Wakka or the turn: derived and measured.** | FFX only |
| B | a lone Zombie at or under 300 HP (one Slap, `ffx-yunalesca` 4.2) Defends instead of swinging while Mega Death is within 2 of her turns | the ring (`re-ffx-ai-yunalesca-bfa` 2.7), `ffx-yunalesca` 10.1 (keep one Zombie) | FFX only |
| C | Yuna cures the worn Zombie with Holy Water or Remedy early in the ring (right after a Mega Death, at least 2 Zombies, under 40 % HP), even with aeons to call, then heals it | `ffx-yunalesca` 10.2 (the Holy Water rhythm; Jegged: "Heal a Zombie with Holy Water") | FFX only |
| D | a clean acting member switches for Wakka, Kimahri or Rikku when no Zombie stands and Mega Death is within 2 turns (the Death Ward standby) | `ffx-yunalesca` 10.8, 10.10 | FFX only |

**Seeds 1 to 500 and the holdout 501 to 1000** (the candidates that reached the second round; wins of 500):

| Line | 1 to 500 | L to W / W to L | holdout | L to W / W to L | party KOs a fight | losses at a Mega Death (1 to 500) |
|---|---:|---:|---:|---:|---:|---:|
| `base` (before) | 398 | | 405 | | 14.6 / 14.9 | 71 |
| **A: Tidus for Wakka in Form III (ships)** | **453** | 83 / 28 | **457** | 80 / 28 | 13.6 / 13.4 | 28 |
| A and B (the guard) | 456 | 87 / 29 | 462 | 81 / 24 | 13.7 / 13.5 | 23 |
| A and C (the early cure) | 447 | 83 / 34 | 446 | 80 / 39 | 13.1 / 13.2 | 32 |
| A and D (the standby swap, 2 turns) | 443 | 84 / 39 | 438 | 76 / 43 | 13.9 / 13.9 | 25 |
| A with Kimahri in Wakka's place | 420 | 76 / 54 | 426 | 74 / 53 | 15.4 / 15.2 | 46 |
| B alone | 401 | 10 / 7 | 413 | 16 / 8 | 14.5 / 14.9 | 69 |
| C alone | 372 | 47 / 73 | 396 | 49 / 58 | 14.2 / 14.2 | 92 |

**Seeds 1 to 200, the screening round** (wins of 200 against `base` 157; paired with `base` in `lad200*.json`):

- *Hold the Phoenix Down while Mega Death is close*: 1 turn 153 (18 up, 22 down). At 60 seeds, 2 turns 36 and 3 turns 31 against 44.
- *Guard the lone low Zombie*: Mega Death next 159, within 2 turns 162 (6 up, 1 down), always in Form III 142; with a bar of 700 or 1,500 HP 158 and 156, up to 2 Zombies 156, within 3 turns 154, within 5 turns 117.
- *Cure early* (Holy Water or Remedy on the worn Zombie, then heal): right after a Mega Death 160 (keep 1 Zombie) and 159 (may cure the last); a wider window of 1 to 3 turns after it, or a bar of 60 or 80 percent HP: 150, 155, 154, 157, 157, 145, 150, 145.
- *Shell on a Zombie Mind Blast would kill, the turn before it*: 156.
- *Any actor raises the fallen while Mega Death is close*: 157, identical to `base` on every seed (a no-op: the tactic already lets everyone raise in Forms II and III).
- *Wakka for Tidus*: from Form I 144, from Form II 171, **in Form III 180**. *In Form III, in Wakka's place*: Kimahri 171, Rikku 149, Lulu 116. *Wakka for Auron* 155, *for Yuna* 149.
- *The Death Ward standby swap* (a clean member switches for Wakka, Kimahri or Rikku when no Zombie stands and Mega Death is within 2 or 3 turns): 170 and 169; on top of Wakka for Tidus 180.

**Reading it.**

- **A is the one lever that moves the rate** (+55 and +52 of 500, z +4.9 and +4.8, 83 seeds up against 28 down). It does what the diagnosis says is missing: a member Hellbiter *always* zombifies, who also has a Death Ward. Losses at a Mega Death fall from 71 to 28.
  Both Tidus's jobs (Hastega in Form I, the Cheer ladder) are done before Form III; the same switch in Form II is worse (171) and from the start much worse (144), so the timing is the first Form III turn.
- **Who comes in and who leaves matters**: Kimahri (420) is not Wakka (453); Rikku and Lulu lose (Lulu 116 of 200: frail and no Death Ward); Auron leaving (155) and Yuna leaving (149) lose, they are the damage and the support.
- **B (the guard) is the best of the rest and not shipped**: +3 and +8 alone, +3 and +5 on top of A (21 seeds up, 13 down over the 1,000; z 1.4 by the sign test). A small gain inside the noise for a rule that needs the ring reader in game code.
- **C and D do not pay.** More Holy Water and Remedy does not buy Zombie HP back at this stock (4 and 4): the early cure *loses* alone (372). The standby swap trades the damage of the fighters for a second Death Ward and costs 10 to 19 wins against A alone.
- **Holding the Phoenix Down into a Mega Death loses**, and the longer it is held the worse (153 of 200 for one turn; 36 and 31 of 60 for two and three against 44): the member left down is one chance fewer for Hellbiter to make a Zombie.
- **Why not Shell, the old comment's "surviving a hit is worth less"**: that premise was the old KO rule's. Re-measured, Shell before Mind Blast wins 156 of 200 against 157.
- The ring reader (`helpers/yunalescaRing.ts`) is **exact**: 1,098 ordinary Form III turns and 197 Mega Deaths over 60 seeds, every one predicted from the log, no false alarm (committed on 30 seeds).

## 4. The shipped line

`src/engine/tactics/yunalesca-bench.ts` (38 lines) and a four-line call near the top of `src/engine/tactics/yunalesca.ts`:

```
form 2 (Form III) and the actor is Tidus and the engine offers the switch row to Wakka  ->  play the switch
```

Everything else in the tactic is the line that shipped. Once he has swapped, Tidus is on the bench and the rule never fires again; one switch a fight (pinned on 12 real seeds). If Wakka is down or unable the row is off and the old line plays. The tactic's header and two stale
premises (the Phoenix Down "sustain", Shell "worth less than dying") now carry the 2026-10-13 numbers.

| Claim | Source |
|---|---|
| keep at least one character a Zombie; do not block Zombie | Jegged (`research/jegged-encounter-guides-ffx-a.md` ch. 2; the guide page's armour line) and `ffx-yunalesca` 10.1 `[verified: 5 sources]` |
| Zombie Ward is resistance 50, so Hellbiter's chance-100 Zombie lands about half the time | `ffx-yunalesca` 7.1 `[verified: 2 sources]`, `ffx-combat-core` 4.1 |
| Hellbiter is the only source of Zombie in this fight, and a KO clears it | `ffx-yunalesca` 7.1; `FFX-G02` (the game's KO reset), RC5 (`docs/handoff/re-parity-rc5.md`) |
| Death Ward (resistance 50) as a non-Zombie survivor of Mega Death | `ffx-yunalesca` 10.8, 10.10 `[verified: 2 sources]` (written for Deathproof; a Ward is the half-strength version, **derived**) |
| the free switch: the incoming member takes the turn happening now | `ffx-combat-core` 1.7 |
| who wears what | `src/data/ffx/builds/zanarkand.ts` (pinned in `re-parity-rc6-ch2.test.ts`) |
| **the choice of Wakka and of the first Form III turn** | **derived and measured, not a source's** (section 3) |

## 5. The guide text, old to new (`src/data/guides/yunalesca.ts`, `docs/yunalesca.ts`)

| Where | Old | New |
|---|---|---|
| rules 1 and 2 | two rules: "Keep one Zombie. Form III opens with Mega Death, and a zombified member is immune to it — cure all three and the active party is wiped from full health." / "Never cure the last Zombie while a Mega Death is due. Cure, heal, then let the next Hellbiter re-apply it." | one rule, same words plus "A knock-out takes the Zombie away too, so a raised ally is a plain target again until Hellbiter lands on him." (short "Keep one Zombie alive for Mega Death"; cite `ffx-yunalesca §10.1, §10.2, §15.2`) |
| rule 2 (new; the five-rule cap) | none | "For Form III, bring Wakka in for Tidus. Tidus, Yuna and Auron wear Zombie Ward, which blocks about half of every Hellbiter; Wakka wears none, so Hellbiter always zombifies him, and his Death Ward gives a plain Wakka an even chance against Mega Death. Tidus has already cast Hastega and Cheer by then." (short "Form III: Wakka replaces Tidus as the Zombie carrier"; cite `ffx-yunalesca §10.1, §10.8, §10.10; re-ffx-ai-yunalesca-bfa §2.12`) |
| hint on the switch row (new, first) | none | "Wakka takes Tidus's turn: Hellbiter lands on him every time, where Zombie Ward turns away about half of the Hellbiters aimed at Tidus, Yuna and Auron, and the Zombie is what lives through Mega Death" (same cites) |
| Phoenix Down hint | "Stand {target} up — and single-target only while anyone living is a Zombie, because a revival effect kills a living Zombie outright" | "Stand {target} up — he returns plain, not zombified, until the next Hellbiter lands; and single-target only while ..." (same cite) |
| Form III phase note | "Mega Death opens the form and recurs on her cycle. Only a Zombie survives it. Aeons postpone it ..." | "... Only a Zombie survives it. Wakka takes Tidus's place here, because Hellbiter always lands on him. Aeons postpone it ..." |
| guide page (after Jegged's armour line) | none | two paragraphs, each under the sheet's 260-character block limit: "Tidus, Yuna and Auron already wear Zombie Ward, which turns away about half of every Hellbiter. Before the last phase, swap Wakka in for Tidus: he wears no Zombie Ward, so Hellbiter always zombifies him." / "Wakka's Death Ward also gives him an even chance against Mega Death. A knock-out takes a character's Zombie away, so someone you raise is a plain target for Mega Death until the next Hellbiter." The file header marks them as ours, not the guide's. |
| `research/jegged-encounter-guides-ffx-a.md` ch. 2 | | a dated update under "Our adaptation of Jegged": no guide names this swap |

The Chapter II advisor card plays `intendedStrategy` forward (advisor v4 rollouts), so it now suggests the switch on Tidus's first Form III turn and prints the new hint; nothing in the card's code changed. **Not looked at in a browser** (no `public/art` in a worktree): the release driver should open the card at Form III.

## 6. Part 2: FOC43-04, the permanent Auto-Life icon in Chapter III's last link

**The cause is in the engine, not the presenter.** Traced on Chapter III seed 1 (the possessed Valefor link): `koActor`'s fayth branch ran the KO reset, which emitted `status-remove` (reason `ko`) for every status the body held, the permanent Auto-Life included; emitted `revive` (cause
`fayth`); and then wrote the status back onto the body (`target.statuses['auto-life'] = { ...autoLife }`) **with no event**. A row that follows the stream therefore had a `status-remove` and never a `status-add`: the icon left on the wipe (about 125 ms into the burst) and stayed
off for the revive beat, until the board was read again. The reading in the review ("the engine re-grants Auto-Life without an event") was right. Per the log of seed 1: 16 such removals in link 2 alone.

**What the game does** (FFX-G02 3.1, 3.6, 3.7): the KO reset wipes the extra word, Auto-Life included; the permanent flag `Chr+0x3b` puts the status back inside the revive, in the same call; nothing observes the gap.

**The fix** (`src/battle/ffx/hp.ts`, `statuses.ts`; one optional parameter): the engine leaves the permanent Auto-Life on the body through the wipe and emits nothing for it (`clearStatusesOnKo(ctx, target, alsoKeep)`; default empty). Every other status is wiped with its event as before. A **cast** Auto-Life
is unchanged: removed with `status-remove` (consumed) before the wipe, not given back. I chose "the status is not removed when the game keeps it" over emitting `status-add` after the revive because a `status-add` would play the presenter's flash, cue and message line at every revive (the presenter
plays every add that is not a same-action KO-wipe pair, `BattlePresenterKoWipe.ts`), and the icon would still be off for the revive beat between the remove and the add. **No presentation file was touched.**

**The pin** (`tests/unit/re-parity-rc6-autolife.test.ts`): (1) on the death rig, a fayth holder hit four times, Zombie on him: `damage x4, status-remove zombie ko, revive fayth` and no Auto-Life event, the status still on the body; a cast holder: `damage x4, status-remove auto-life consumed,
status-remove zombie ko, revive auto-life`; (2) Chapter III's whole chain on 8 seeds (every link; more than 20 fayth revives asserted): each member's Auto-Life read off the events equals the board at every decision. **Mutant check**: with the old behaviour put back, the fayth story and the chain check fail
(the chain check at "seed 1 link 2: tidus's Auto-Life by the events (false) against the board").

**The golden.** `ffx-engine-golden` moves exactly Chapter III: #1 links 2 and 4 to 7 and #7 links 4 to 6 (the possession fights, the only lines with a permanent Auto-Life). Proof by comparison: both engines' logs dumped (the old with the removal put back), compared event by event with `seq` left out: **identical apart from exactly one
`status-remove auto-life (ko)` per fayth revive** (16, 4, 7, 15, 1 and 7, 13, 19) and the `seq` renumbering; same outcomes, HP and turns. Chapter III over 500 seeds is identical on every seed (479 of 500, 232.1 party turns, 5.4 KOs). The presenter's 7b2582e7 rule and its tests (`presenter-ko-wipe*`) pass unchanged.

## 7. The goldens, explained (both re-baselines are in `tests/unit/ffx-engine-golden.test.ts`, with the headers)

| Digest | Cause | Evidence |
|---|---|---|
| braskas-final-aeon#1 links 2, 4 to 7; #7 links 4 to 6 | Part 2: one `status-remove auto-life (ko)` fewer per fayth revive | the logs equal the old ones minus those events and `seq` |
| yunalesca#1 (4cc7ce75 to 73fd4f55, victory both) | Part 1: the switch | the new log equals the old for the first 982 events, then the switch |
| yunalesca#7 (97c45011 defeat to 8e48c312 victory) | Part 1: the switch | identical for the first 737 events, then the switch |

The other 14 digests, `ffx2-atb-golden` (6) and `ff7-golden` (3) are untouched.

## 8. Measurement (the shipped line, `tests/unit/ffx-parity-measure.test.ts`, `PYREFLY_MEASURE=1`)

Before = `origin/r43-rc` (this branch's base), after = the tip. Raw files in `D:\Tools\ffx-parity\rc6-ch2\` (`before-ch2-500.json`, `after-ch2-500.json`, `before-ch2-hold.json`, `after-ch2-hold.json`, `before-ch3-500.json`, `after-ch3-500.json`; the ladder: `lad200*.json`, `lad500.json`, `ladhold.json`).
Chapter II's first 12 seeds are the first 12 of the 500-seed run.

| Chapter | Seeds | Wins | Party turns | Engine turns | Party KOs |
|---|---|---|---|---|---|
| II Yunalesca before | 1 to 500 | 398 | 159.1 | 226.5 | 14.6 |
| II after | 1 to 500 | **453** | 157.7 | 224.0 | 13.6 |
| II before | 501 to 1000 | 405 | 161.9 | 230.4 | 14.9 |
| II after | 501 to 1000 | **457** | 158.6 | 225.1 | 13.4 |
| II before / after | first 12 | 9 / **12** | 149.8 / 148.5 | 212.7 / 210.7 | 13.9 / 12.0 |
| III Braska's Final Aeon before / after | 1 to 500 | 479 / 479 | 232.1 / 232.1 | 373.0 / 373.0 | 5.4 / 5.4 |
| III before / after | first 12 | 11 / 11 | 240.1 / 240.1 | 386.2 / 386.2 | 5.5 / 5.5 |

No other chapter's line or the engine paths they use changed (the goldens of the other chapters stand).

## 9. Checks

- `tsc --noEmit`: clean. `node tools/orphans.mjs`: nothing of mine (`yunalesca-bench.ts` is imported by the tactic; the ring reader is test tooling only).
- Targeted, all green: `re-parity-rc6-ch2` (the preset facts, the helper, 12 real seeds, the guide text), `re-parity-rc6-ch2-ring`, `re-parity-rc6-autolife`, `strategy-chapter2` (re-pinned, 38 of 40), `ffx-chapter2`, `advisor-v4-card`, `advisor-note`, `re-parity-ai-yunalesca`, `strategy-guide`, `guide-doc`, `guide-advisor-target-agreement`,
  `parity-ffx-engine-death` (1,200 generated actions), the three goldens, `presenter-ko-wipe` and `-chapter3`, `ffx-yu-yevon-exit`, `re-parity-ai-possessed`.
- **Mutants**: the switch in Form II, Auron leaving instead of Tidus, and no switch: each fails `re-parity-rc6-ch2` and `strategy-chapter2`; the old Auto-Life behaviour put back fails `re-parity-rc6-autolife` (two tests).
- Whole suite, once: `--maxWorkers=4 --testTimeout=60000 --exclude '**/zz-*'` (the two `zz-*.tmp` files in the tree are other lanes' scratch), 914 seconds, on the tip before this note: **1,140 files: 1,104 passed, 22 failed, 14 skipped; 17,303 tests: 17,006 passed, 182 failed, 114 skipped, 1 todo.** All 22 failing files are the art-only set a worktree has without `public/art` (every failure is an ENOENT on `public/art/...`, a missing `public/art/manifest.json`, "Reference image not found" or an `existsSync` of a plate): `ui-portrait-face-crop` (145 tests), `art-ref-defaults`, `pause-remake`, `chapter-meta`, `chapter-meta-evrae`, `chapter-meta-ffx2-leblanc`, `chapter-meta-seymour-anima-macalania`, `cutscene-story-poses`, `party-face-manifest`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapters/den-of-woe-ship-content`, `chapters/den-of-woe-ship-scene`, `chapters/experiment-scene`, `chapters/fallen-aeons-ship-content`, `chapters/fallen-aeons-ship-scene`, `chapters/isaaru-ship`, `chapters/leblanc-art`, `chapters/leblanc-party-sprites`, `chapters/natus-ship-content`, `chapters/natus-ship-scene`, `chapters/trema-ship-content`, `chapters/yojimbo-content`. Not fixed, by rule. Nothing else failed; `ffx-engine-golden` 18, `ffx2-atb-golden` 6 and `ff7-golden` 3 pass.

## 10. Open items

1. **The critic planner classes this batch DEEP** (`node tools/critic-plan.mjs`: `hp.ts` and `statuses.ts` are the shared FFX engine; the strategy guide and the advisor are touched): focused review before the deploy, deep review on the live build after (this build owes it), and AGENTS.md rule 15 asks for a paper
   preflight (`docs/plans/<track>-review.md`) *before* a deep change is built. **I did not write one first**; sections 2, 3 and 6 are its content. The release driver decides whether that satisfies it.
2. **Chapter II is 90.6 and 91.4 percent, not the old 95.2.** The best sourced lines reach 91 to 92 (A and the guard: 456 and 462). Closing the last four points needs either more Zombie HP (the Holy Water and Remedy stock is 4 and 4, and the early cure loses) or a change of
   preset (below). Nothing was tuned toward a rate.
3. **Not browser-checked** (no `public/art` here): the Form III advisor card with the switch hint; Party Prep needs Wakka on the reserve (he is: `reserve: wakka, lulu, kimahri, rikku`).
4. **The Auto-Life revive is still not a queued action** (RC5 open item 1): unchanged.
5. **`research/ffx-yunalesca.md` 10.8 is written for Deathproof**; a Death Ward's even chance against Mega Death is derived (resistance 50, `ffx-combat-core` 4.1), not read from a source for this fight.
6. The art-only test failures a worktree has (no `public/art`) are expected and unrelated; they are listed in the suite line above.

## 11. Decisions for Bailey

1. **Keep the Wakka switch? (the one that matters.)** The suggested line now switches Tidus out for Wakka at the start of Form III. It is a change to what the move advisor and the auto-battler play, built only from things the game already has (the free switch, the armour in the preset), and it is the only candidate that
   moved the rate (79.6 to 90.6 percent; 81.0 to 91.4 on a second block of seeds). No guide names it: the guide page says so by setting the paragraph apart as ours. **Yes** keeps it (recommended). **No** reverts one call in `yunalesca.ts` (the line goes back to 79.6 percent). AGENTS.md rule 10
   wants a yes for new play; the Chapter IX and XVIII reworks shipped on his "rework our line" in the same way, and this one is to be undone in a line.
2. **Zombie Ward on the three actives (a preset question, not touched).** The reason Hellbiter misses half the time is the Ward that the Gagazet loadout carries onto Tidus, Yuna and Auron. Giving the party a way to take it off (a Party Prep equipment screen, or a Zanarkand build without it) would be a preset change and a new screen (rule 9: a mockup first).
   Not measured; his call.
3. **The lone-Zombie guard (+3 and +5 on top of the switch)** is inside the noise and is not shipped. If he wants every point, it is one rule and the ring reader already exists in the test helpers.

## 12. Re-run (repo root `D:\Final Fantasy\.claude\worktrees\re-parity-ai-ffx-b`, Node 24, TEMP and TMP on D:)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/re-parity-rc6-ch2.test.ts tests/unit/re-parity-rc6-ch2-ring.test.ts tests/unit/re-parity-rc6-autolife.test.ts tests/unit/strategy-chapter2.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
# Chapter II and III over 500 seeds (about 90 s each on a quiet machine); change the seeds to 501-1000 for the holdout
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_CHAPTERS=yunalesca,braskas-final-aeon PYREFLY_MEASURE_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 --testTimeout=3000000 tests/unit/ffx-parity-measure.test.ts
# the candidates (base, tactic, swapTidus, sT2Wg2, guard2, cure2, sT2K, sT2Wstandby2, ... see LINES); about 1 minute a line for 500 seeds
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_YUNA_LINES=base,tactic,swapTidus,sT2Wg2 PYREFLY_MEASURE_OUT=ladder.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 --testTimeout=3000000 tests/unit/re-parity-rc6-ch2-ladder.test.ts
```

## 13. For the release CHANGELOG (plain words)

**Chapter II, Yunalesca (FFX).** Since the game's own rule that a knock-out takes a character's Zombie away, the suggested way to fight her lost about one fight in five, because the party often reached her Mega Death with nobody zombified. The suggested line now has Tidus step out for Wakka at the start of her last form:
Wakka wears no Zombie Ward, so her Hellbiter always zombifies him, and his Death Ward gives him a fair chance against Mega Death even when it has not. Following the card, the fight is won about nine times in ten again (it was about eight). The guide says so and says why, and notes that a raised ally is a plain target until her
next Hellbiter. Yunalesca's own numbers and the Zombie rule are unchanged. **Chapter III, the fayth's Auto-Life (FFX).** When a party member is knocked out in the last chain of fights and the fayth's Auto-Life stands him back up, its icon no longer disappears from his row for the length of the revive. Nothing about
the fights themselves changed.
