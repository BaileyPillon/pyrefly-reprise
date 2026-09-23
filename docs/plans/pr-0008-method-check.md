# PR-0008 method check: Chapter 1's intended line wins 26 of 40

**FFX only.** This is Chapter 1 (Seymour Flux, Mt. Gagazet), its tactic, its preset and
its guide. Nothing here touches FFX-2 or shared plumbing. The one shared-data item in
section 5 applies to FFX ability data only and is deliberately left out of this fix.
Paper only. Written 2026-09-23 on `main` 31ab2b4 as the AGENTS.md rule 15 / RUBRIC
section 8 method check that PR-0008 owes (STALLED: two reviews left it open). No file
under `src/` or `tests/` was changed. Every number below comes from engine runs of the
shipped `intendedStrategy` against the real FFX engine and data. The probes are
scratch, listed in section 7.

## 1. Recommendation: (c), the bar is wrong for this chapter

The tactic is at a measured local maximum. The data matches the research. The losses
come from the fight's clock, not from the line's choices. So:

1. **Stop tuning the tactic for win rate.** At least fifteen variants on record since
   2026-09-17 (test comments and handoff), plus six measured today, all tie or lose to
   the shipped line. A third batch of this kind is what RUBRIC section 8 exists to stop.
2. **Re-baseline PR-0008's acceptance with Bailey.** Measure the line over the four
   standard windows, not a 36/40 target it has never reached. Proposed: at least
   **95 of 160** (measured 100, so a 5-win guard band), at most 2 of 160 losses before
   battle turn 10 (measured 1), and every loss still a real fight (the existing
   `bossHp < 52,500` check on the named losses). The unit test's 40-seed floor stays
   at 25.
3. **Make the guide tell the truth about the line.** Rule 4 currently says Protect
   standing before the Dispel is a defence. Section 3, point 4, shows it is not. The guide
   should also say plainly that a well-played run still loses about 3 fights in 8, and
   why. That is the product brief's "a loss tells you why in plain words". The player
   sees this text, so show Bailey two wordings before it ships (hard rule 9).

**Nothing about the boss changes.** No stat, script, damage number or preset value is
touched ("never weaken a boss"; product brief "Mechanics never bend").

## 2. What loses (seeds 1-40, shipped line, 26 wins)

| Seed | Battle turn | Seymour HP left | Final blows (victim, by, phase) |
|---:|---:|---:|---|
| 20 | 8 | 65,193 | Tidus by Full-Life (turn 2), Yuna by Full-Life (6), Kimahri by Cross Cleave (8) |
| 10 | 11 | 66,608 | Yuna by Full-Life (2), Kimahri by Full-Life (6), Tidus and Yuna by Cross Cleave (11) |
| 29 / 18 / 15 | 13 / 14 / 15 | ~64-65k | Cross Cleave takes Tidus and Yuna, Full-Life takes Kimahri. No aeon ever summoned |
| 16, 22, 27, 3 | 22-31 | 35-51k | 3 aeons spent by turn 15, then Full-Life and Cross Cleave, phase 1 |
| 14, 36, 1, 25 | 33-53 | 40-49k | same, later |
| 12 | 96 | 10,960 | Total Annihilation on all three, phase 2 (the only phase-2 loss) |

Over the four standard windows (seeds 1-40, 41-80, 101-140, 1001-1040) the line wins
**100 of 160** (26 / 21 / 24 / 29). Over seeds 1-200 it wins 116 (58 percent). The
handoff's "146/200" predates the canon phase-2 fixes and is stale.

## 3. Why it loses (160 seeds, engine log classification)

| Measure | Wins (100) | Losses (60) |
|---|---:|---:|
| Party KOs by Full-Life with **no party turn** between Zombie and Full-Life | 84 | 152 |
| Party KOs by Full-Life where a party turn existed and was not spent on a cure | **0** | **0** |
| Zombie-landing Lances followed **at once** by the mount | 82 of 206 (40%) | 143 of 187 (76%) |
| Cross Cleave KOs | 8 | 80 |
| ... with no party turn between Dispel and Cross Cleave | 5 | 67 |
| ... whose victim had Protect before the Dispel | 2 | 39 |
| Party turns per enemy turn | 1.44 | 1.03 |
| Losses that reached phase 2 (Seymour cast Reflect) | | 18 of 60 |

What the table shows:

1. **The line never misses a curable Zombie.** All 236 Full-Life kills landed with no
   party turn in between. §4.2's Lance then Full-Life pair can only be answered by
   "beating it on CTB" (§6 row 4). Both actors are Agility 38 (§1.1, §2), so when
   Seymour sits just ahead of the mount on the clock the pair lands back to back
   every cycle.
2. **The opening order decides a large share of the chapter.** When Seymour takes the
   first enemy turn the line loses 51 of 114 runs (45%). When the mount goes first it
   loses 9 of 46 (20%). Initial CTB placement is the ICV roll (ffx-combat-core §1.9).
   Its tie handling is research gap C-7, which is still open.
3. **Phase 1 kills, phase 2 mostly does not.** 42 of the 60 losses never reach 50%.
   Once the Dispel has stripped Protect, Cross Cleave (§5.2: 2,299 to 2,596 at
   Defense 20) kills Yuna (1,500) from full every time, Kimahri (2,310) nearly every
   time and Tidus (2,420) more often than not. Only Auron (3,410) reliably survives
   it bare.
4. **Protect before the Dispel buys nothing against Cross Cleave.** 39 of the 80
   Cross Cleave deaths in losses were Protected before the Dispel. §4.2 says so
   outright: the party is "stripped of Protect immediately before the only big
   physical hit". The guide's rule 4 says the opposite (section 1, item 3).
5. **Losing runs are tempo-starved.** They get 1.03 party turns per enemy turn,
   against 1.44 in wins. KO clears Haste, and every Full-Life kill also removes a
   Haste.

## 4. The three options, measured

### (a) The tactic is wrong for the fight: no

All variants were run on the same 160 seeds. The shipped line gets **100**.

| Variant | Wins / 160 | Source |
|---|---:|---|
| Aeons held for phase 2: 0 / 1 / 3 (shipped holds 2) | 91 / 96 / 56 | test comment, 2026-09-19 |
| Party Reflect off Star Curtains | 33 | same |
| Bench Kimahri after Mighty Guard / bench idle Yuna | 91 / 85 | same |
| Rebuild the Cheer ladder after each death / Silence via Wakka swap | 93 / 94 | same |
| Farm the mount while its max HP decays / gate the Fang on safety | 98 / 70 | same |
| Phase 1: Cheer instead of Protect or Light Curtain | 87 | today |
| Tidus builds Cheer to 3 ahead of summons and repairs | 92 | today |
| Both of the above | 83 | today |
| Yuna summons on her first turn instead of the Fang | 55 | today |
| Haste on Seymour (§6 row 11), probe-only data change (section 5) | 99 / 99 (with a Tidus swap) | today |

No variant beats the shipped line. The ones aimed at the measured mechanism (Cheer
because Protect is stripped; an early aeon because the pair cannot be answered) lose
3 to 45 wins. The line's remaining losses are clock losses with no decision
available. The 0-of-236 missed-cure count shows the one decision that does exist is
already played perfectly.

### (b) The fight's data is wrong against the research: no

- Checked against the research and matching it: Cross Cleave uses Seymour's STR 30
  (§5.4; the measured 2,453 on Tidus is §5.2's Defense-20 average). Dispel hits the
  whole party (§3.1). Full-Life picks a living Zombie and whiffs otherwise (§3.3,
  C-6). The §4.1 alternation guard is implemented. Poison ticks 1,400 (§1.1).
- **The preset at the top of every §7.3 band** (HP and Defense, the §7.7.2 HP+10%
  kept) wins **104 / 160**: +4, inside window-to-window noise (21-29 per 40). The
  research's own tension (§5.2's "around 2,000" implies Defense 30-40, while §7.3
  estimates 10-32) cannot be settled without in-game footage (C-11). Moving Defense
  past §7.3 would be inventing data (hard rule 6).
- Where the preset departs from the research, it already leans toward the player:
  Kimahri's full gauge and Mighty Guard assume the Biran lead-in (C-16), and
  Mortibsorption's threshold counters are dropped (`ai/reactions.ts`, handoff
  section 4.5). Correcting either would make the chapter harder, not easier.

### (c) The bar is wrong: yes

- The 0.9 bar in `strategy-ffx2-leblanc.test.ts` is `WIN_BAR = 0.9` with the comment
  "§9 A1 — this is an onboarding chapter". Seymour Flux is not an onboarding fight: it
  is FFX's late-game wall at Mt. Gagazet (§7.1). Its canon design is a pair that is often
  unanswerable (§4.2 "deliberately vicious"). The original answers it by beating the
  pair on CTB (§6 row 4), which this clock often does not allow, or with equipment that
  §7.7.1 shows this preset cannot afford (§6 rows 1-3, C-14).
- The product brief asks for "hard, fair fights": "every chapter is losable if you
  ignore what the fight is asking for, and winnable with the tactics that worked in
  the original". Both hold. Ignoring the line loses every time (the mount test: 4 of
  4 seeds). The line wins 62.5% per attempt, so **86% within two tries and 95%
  within three**. Retry lands at prep in about 3 s (round 09 feel).
- The critic's comparison with chapters 2-6 (39-40/40) is a comparison of different
  fights. Nothing in the research says Seymour Flux should be as reliable as
  Yunalesca under the right line.

## 5. Flagged separately, not part of this fix

- **Haste cannot target an enemy.** `src/data/ffx/abilities/whitemagic-haste-slow.ts`
  gives Haste `targeting: 'single-ally'`. §1.3 lists Seymour's Haste resistance as 0
  ("the player *can* Haste him"), and §6 row 11 is a canon tactic built on it (single
  source). Measured in a probe: poison per run rises from 15,960 to 28,954, because
  the extra turns are §4.1 no-ops that still tick. The win rate does not move (99 vs
  100). This is a fidelity fix for FFX ability data across every FFX chapter.
  Propose it to Bailey on its own (hard rule 10). It is not a PR-0008 lever.
- **Stale handoff numbers.** `docs/handoff/play-seymour-flux.md` still says 73%.

## 6. Build steps, owners, tests, acceptance (for the agent that builds this)

Only after Bailey's yes on the re-baseline and on one of the two guide wordings.
FFX only. No engine, data, AI or preset file changes.

1. `src/data/guides/seymour-flux.ts` (owner: Chapter 1 / guide). Rewrite rule 4 so it
   no longer claims Protect survives the Dispel: "Cross Cleave follows the Dispel;
   what stands through it is HP, Cheer and Auron's 3,410 HP" (§4.2, §5.2, §5.5). Add
   one honest-odds rule using Bailey's chosen wording, for example "Even played well,
   this fight is lost about 3 times in 8, most often when Seymour moves first and
   Lance of Atrophy lands a Zombie right before the mount acts. That is the fight
   (§4.1, §4.2), not a mistake: retry." Keep `cite` fields to research sections.
   Keep every hint `labels` entry as a row the tactic asks for.
2. `tests/unit/strategy-seymour-flux.test.ts`. Add a 160-seed test over the four
   windows that asserts `wins >= 95` and `lossesBeforeTurn10 <= 2`, and prints both.
   Keep the 40-seed `>= 25` test and the mount test unchanged. Update the header note
   with this document's numbers and a pointer to it. Keep the file under 400 lines
   (house style; it is 379 now, so trim prose to fit).
3. `docs/handoff/play-seymour-flux.md`. Replace the 73% status with 100/160 and
   116/200, and link this document.
4. The critic owns `critic/`. The builder does not edit it. Hand PR-0008's new
   acceptance text (from section 1, item 2) to the next focused review, citing Bailey's
   words.

Tests: `npx tsc --noEmit`;
`npx vitest run tests/unit/strategy-seymour-flux.test.ts tests/unit/strategy-guide.test.ts tests/unit/strategy-guide-fold.test.ts tests/unit/strategy-guide-scale.test.ts tests/unit/strategy-guide-chip-and-type.test.ts tests/unit/ui-strategy-guide.test.ts`.

Acceptance:
- The strategy test prints `seeds 1-40: 26 wins` and a 160-seed line of `100` (plus
  or minus 0, because the engine is deterministic). If this changes, something outside
  this plan moved the fight.
- `git diff --stat` shows only the three files above.
- A real-input browser check: open Chapter 1, open the guide, and read the new rule
  4 and the odds rule in full at 1600x900 and 390x844 with no clipping (PR-0112
  class). Save screenshots to `docs/screenshots/pr-0008-guide-*.png`.

## 7. Evidence (scratch, reproducible)

The probes are in the session scratchpad `paper-pr0008/` (`autopsy`, `classify`, `seq`,
`variants`, `stream` `.probe.ts`, plus JSON outputs), run with
`npx vitest run --config <scratch>/vitest.config.mjs <name>` from the repo root.
`critic/scratch/ch1-bench.test.ts` is the committed equivalent for the win-rate
line.

## Review (adversarial, 2026-09-23, paper only)

Verdict: **recommendation stands, with two corrections.** Re-run on the working tree with an independent probe
(own driver, engine log only; scratch `paper-review/zw/win.probe.ts`).
- CONFIRMED: 26 / 21 / 24 / 29 = **100 of 160**; the 14 losing seeds of 1-40 are the ones listed (and match round 09's list); 1 loss before battle turn 10 (seed 20 at 8).
- CONFIRMED: Seymour takes the first enemy turn in 114 of 160 and loses 51 of them. Retry odds 86% / 95% follow from 0.625.
- CONFIRMED (sources): §4.2's "stripped of Protect *immediately before*" line; §6 rows 4 and 11; §1.3 Haste resistance 0. The guide's "only defence is Protect" line (`seymour-flux.ts`) is contradicted by §4.2.
- NOT RE-RUN: the variant table and the Protect-before-Dispel counts (section 3, point 4); taken from the author's probes.
- CORRECTED: the 36/40 bar comes from the critic's own PR-0008 `expected` ("as chapters 2-6 do") and `acceptanceCheck` ("at least 36/40, with no loss before **player** turn 10"). It does not come from `WIN_BAR` in `strategy-ffx2-leblanc.test.ts`, which is another chapter's test. Drop that sentence. The proposed check counts **battle** turns, so it must say that it changes the unit.
- CORRECTED: the Haste-on-Seymour figure (99 vs 100 / 160) disagrees with PR-0007's probe (26 -> 21 on seeds 1-40). The two probes are designed differently. Reconcile them before either number goes to Bailey.
- Builder: `src/data/guides/seymour-flux.ts` is also edited by PR-0007 option A (the Holy Water rule). Build both guide changes in one pass and show Bailey **one** set of wording options. Re-run the guide fold/scale tests, because a new rule can hit the PR-0010 height cap. Rules 9 and 10 are correctly held for Bailey. No boss value changes.
