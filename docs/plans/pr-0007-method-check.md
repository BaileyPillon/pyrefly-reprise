# PR-0007 method check — the Zombie → Full-Life window (FFX only)

RUBRIC §8 method check (AGENTS.md rule 15) for PR-0007, open and STALLED since round 04.
Paper only: nothing under `src/` or `tests/` changed. Every number below comes from
engine runs on `main` (1ff12d1c), seeds 1–40, `gagazetBuild`; the probes are in the
session scratchpad (`paper-pr0007/*.probe.ts`, run through vitest with the scratchpad as root).

**Game case: FFX only.** Seymour Flux, Lance of Atrophy, Full-Life and Zombie exist only in
chapter 1. FFX-2's data layer has no `zombie` status. Nothing here touches FFX-2.

## Recommendation

1. **Stop treating this as a balance defect. Never change the boss, the CTB or the AI.**
   The zero-turn window comes straight from sourced FFX CTB math (§2). The recreation
   did not lose it. FFX has it too, in about 69 % of fights.
2. **Change the acceptance check, and repair the bench behind it.** The round-04 bench
   only counts Zombies that ended in a death, and it misses every cure the player makes
   (§1). The honest statement is this: every Zombie that leaves the player a turn gets
   cured (34 of 34), and every Zombie that leaves no turn kills (47 of 47).
3. **Build option A: tell the player before the Lance lands.** Say whether a turn exists
   before Full-Life, and correct the guide line that promises one. PR-0011's chip (commit
   333bc2c7) names the Zombie but not the pairing. This is a perceivable change, so rule 9
   applies: mockups first.
4. **Park options B and C as research.** Neither goes ahead without a second source and
   Bailey's yes (rule 10).

## 1. The current route and why it stalled

The critic's metric is "median player turns between a Zombie landing and the kill ≥ 1".
Two problems with it:

- **Survivor bias.** It only counts Zombies that died. A Zombie with a window gets cured,
  so it never enters the sample. Opening a window lowers the number of deaths. It never
  raises the median window among them.
- **Instrumentation gap.** `critic/rounds/round-04/bench/zz-critic04-ch1.test.ts` reads
  events only from `nextDecision()` and never from `submit()`'s return value. So it never
  sees a player's Holy Water. A cured member who later died to something else was counted
  as a "Zombie kill" with a long window. That explains its odd non-zero windows
  (4, 12, 17, 19, 28, 33).

The corrected probe reads both event streams. Shipped `intendedStrategy`, seeds 1–40:

| Measure | Value |
|---|---|
| Wins | 26/40 (matches the suite's 26/40) |
| Zombies landed | 82 |
| Cured by Holy Water before the mount acted | **34** (every one that had a player turn) |
| Killed by Full-Life | **47**, all with **0** player turns in between |
| Ticks from Zombie to the mount's next turn, among the 47 | 0 (31), 1 (12), 2 (4); 19–20 (4, all right after Cross Cleave) |
| Same policy, Holy Water/Remedy forbidden | 10/40 wins; 22 of 70 Zombies had ≥ 1 player turn |

So the player already has counter-play where a window exists. The shipped tactic uses it,
and it is worth 16 wins in 40. No tactic revision can open a window that CTB does not
give, and that is why three batches stalled.

## 2. Why the window is zero, and whether FFX has it (turn order, AI timing)

- Both enemies have Agility 38. That gives base 7 and a rank-3 recovery of 21 ticks, the same for both
  [ffx-seymour-flux §4.1 `[decompiled]`; ffx-combat-core §1.2 `[verified: 2 sources]`].
  Their gap therefore never changes during the fight.
- The enemy opening counter is `floor(21 × 100 / (100 − rng%11))` ∈ {21, 22, 23}
  [ffx-combat-core §1.9 `[single source]` decompile]. The engine implements exactly this
  (`seedInitialCtb`), so the two enemies start 0–2 ticks apart.
- Ties go to the boss: formation order, Seymour is slot M1 [ffx-seymour-flux §2.2
  `[decompiled]`; tie rule ffx-combat-core §1.6 `[single source]`]. Probability from the
  sourced formula: Seymour first or tied 83/121 ≈ **69 %** of fights, mount first 38/121 ≈ 31 %.
  Engine seeds 1–40: tie 19, Seymour first 12, mount first 9, which is 77.5 % against 69 %.
- In a Seymour-first fight, every Lance → Full-Life pair is 0–2 ticks apart for the whole
  fight. The party's recovery is 24–36 ticks, so the only turn possible is a party member
  who is tied on that exact tick. In a mount-first fight the gap is 19–20 ticks and the party
  gets 1–5 turns. The one exception is the Lance straight after Cross Cleave's strong Delay
  (§4.2's Dispel → Cross Cleave → Lance chain), which leaves no turn.
- The research gives the FFX answers as *beat it on CTB, or prevent it*:
  §6 row 4 (Holy Water, which "requires beating it on CTB"), rows 1–3 (Zombie Ward −50 pp,
  Auto-Med, which is unaffordable at Gagazet), row 10 (party Haste), row 11 (Haste *Seymour*
  to desynchronise the pair). With a 0–2 tick gap, party Haste cannot help.

**Verdict:** by the sourced model, FFX itself gives no reactive window in about 69 % of fights.
Two gaps remain unsourced and could change that (options B and C). Nothing else in the turn
order or AI timing differs from the sources.

Cures, checked in the engine (seed 3 or 5, living zombified target): Holy Water removes
Zombie, and so does Remedy. **Esuna does not** and **Dispel does not**. Both match
ffx-combat-core §4.2 ("NOT Esuna") `[verified: 2 sources]`. Inventory: Holy Water 7,
Remedy 3, Phoenix Down 30.

## 3. Options (all FFX only)

**A: Information and teaching (recommended).** Keep every number. At the moment the Lance
is queued, the player should see two things: the Zombie (PR-0011 chip, done) and whether
the Mortiorchis acts before any party member does. `intent.ts` already holds
`predictTurnOrder(ctx, 8)`, so this is a derived read, not new data. Correct the guide
line "Holy Water a Zombie before the mount acts" (`src/data/guides/seymour-flux.ts:29–30`).
It promises a turn that about 69 % of fights never give. It should add what the player can
do in advance: the Ward (−50 pp) and killing fast. It also needs the engine's own post-kill
rule: a KO'd Zombie stays a Zombie, and the advisor already says "leave them down".
Cost: small, UI and data text only. Risk: rule 9 (mockups) and PR-0010's height cap on the panel.

**B: Restore Haste on an enemy (faithfulness, not difficulty).** The research says Seymour
takes Haste (§1.3 "the player *can* Haste him"; §6 row 11 `[single source: wiki]`). The
recreation's Haste is `targeting: 'single-ally'`
(`src/data/ffx/abilities/whitemagic-haste-slow.ts`), so that sourced strategy is out of reach.
Probe with a `single-any` Haste set through the registry and one cast on Seymour: Full-Life
kills 47 → 34, cures 34 → 45, zombies 82 → 87, **wins 26 → 21**. It is a real, sourced
player option and not a fix. Before building: a second source for Haste's target-switch
flag (command row 54), a check against chapters 2 and 3, and Bailey's yes.

**C: Source the enemy action ranks (research only).** Every m142 action is
`rank: 3 // [estimate]` (`src/data/ffx/enemies/seymour-flux-abilities.ts`). If Lance,
Full-Life or Cross Cleave has a different rank byte in `ffx_monmagic2.csv`, the two enemies'
counters drift apart. FFX's own window would then open and close through the fight, and
correcting the data would be faithful, not a weakening. This is the only unsourced value
the window depends on. Until it is sourced, change nothing.

**Measured and rejected:**
- Clearing Zombie on KO (the ffx-combat-core §4.2 reading, against the Yunalesca §15.2
  reading the engine follows in `SURVIVES_KO`): wins **26 → 23** and zombies 82 → 131,
  because a zombified corpse soaks Full-Lifes. This is a separate source conflict, not a
  lever for PR-0007.
- Switching warded Auron in for Kimahri on Kimahri's first turn: wins **26 → 17** under the
  shipped tactic, which is not built for Auron. Not a lever unless the tactic changes.
- Any change to the ICV, the alternation guard, the cycle, a telegraph turn or a mount delay
  would weaken the boss or invent data (rules 6 and 10).

## 4. The smallest test that separates the options

One vitest file, `tests/unit/seymour-flux-zombie-window.test.ts`, seeds 1–40. It reads
events from **both** `nextDecision()` and `submit()`. For each Zombie it records the ticks
and the party turns before the Mortiorchis's next turn, and the outcome.

It asserts: (1) every Zombie with ≥ 1 party turn before that mount turn is cured under
`intendedStrategy` (34/34 today); (2) wins stay at 26/40 (the regression guard for option A);
(3) the enemy opening gap is ∈ {0, 1, 2} ticks mod 21. Option C would break (3), and option B
would move (1). That makes it the test that separates them.

## 5. Build steps for the agent that builds option A (after Bailey picks a mockup)

**Owning files:**
- `src/battle/ffx/intent.ts`: pure layer, no DOM or `three`. Add a derived
  `pairing?: { nextEnemyId; partyTurnsBefore: number }` to the enemy intent when the queued
  action inflicts a status the other enemy's next action exploits. Read it from the preview
  the module already computes. Do not invent a new source of truth.
- `src/ui/common/enemy-intent-brief-status.ts` (+ `.css`): render the pairing at brief
  density inside PR-0010's cap. This file carries uncommitted PR-0011 work: read its
  handoff note and extend it. Do not restart it.
- `src/data/guides/seymour-flux.ts` lines 29–30: correct the guide text so the promise
  matches what CTB gives.
- If the intent view type is a shared contract, add a `docs/CONTRACT-CHANGES.md` entry
  (additive field).

**Steps:**
1. Paper mockups: 2–3 options at 1600×900 and 390×844 with Lance queued, one Seymour-first
   board and one mount-first board. Bailey picks. Save the pick in
   `docs/target/targets.json` with its `reaction`.
2. Write the §4 test first. It must pass on today's code, apart from any new assertions.
3. Implement the `intent.ts` field, then the chip, then the guide text.
4. `npx tsc --noEmit`; `npx vitest run tests/unit/seymour-flux-zombie-window.test.ts`
   plus the intent and advisor tests (`advisor-floor`, the enemy-intent tests); then the
   full `npm test`; then `node tools/orphans.mjs`.
5. Real-input browser check in chapter 1, press E with Lance queued, on two seeds (one
   Seymour-first, one mount-first). Screenshots go to
   `docs/screenshots/pr-0007/`, shown side by side with the approved mockup.

**Acceptance checks** (proposed wording for the critic; this document does not edit `critic/`):
- Chapter 1, Lance queued: the panel names Zombie with its chance (PR-0011) **and** says
  whether any party member acts before the Mortiorchis. It is correct on both lead cases.
- The guide no longer promises a cure turn the CTB does not give.
- The §4 test: 34/34 windowed Zombies cured, wins 26/40, enemy gap ∈ {0, 1, 2}. The
  Seymour Flux data and AI files are byte-identical before and after the build.
- PR-0007's acceptance check is replaced. The old one was "median window ≥ 1 over seeds
  1–30", which sourced FFX math cannot meet without weakening the boss. The new one is
  "every windowed Zombie is curable, and the player is told before the Lance when there is
  no window".

## Review (adversarial, 2026-09-23, paper only)

Verdict: **recommendation stands (option A, information), with two corrections.** Re-run with an independent probe
that reads the engine's full log, not either event stream (scratch `paper-review/zw/zw.probe.ts`).
- CONFIRMED: seeds 1-40: 26 wins and 82 Zombies. 47 are killed by the Mortiorchis with **0** party turns in between. 34 are cured by the party, each after at least 1 party turn. The last one is still open at battle end with 0 turns, which explains 34 + 47 = 81.
- CONFIRMED (arithmetic): the enemy ICV `floor(2100/(100 - rng%11))` gives 21 / 22 / 23 with weights 5 / 4 / 2 out of 11. Seymour first or tied = 83/121, mount first = 38/121.
- CONFIRMED (sources): the ffx-combat-core §1.9 formula; §4.2 "NOT Esuna"; and `SURVIVES_KO` includes zombie. research ffx-seymour-flux §6 row 4 goes further than this document says: it names the "**CTB turn prediction UI** so the player can see whether they get there first" as the mechanic the strategy requires. Cite that line, because it makes option A fidelity rather than a hint.
- PLAUSIBLE: ties go to Seymour. §1.6 orders "a boss icon with no number first", and §2.2 puts Seymour in slot M1. No source orders two boss-side actors directly (single source, gap C-7).
- CORRECTED: `src/ui/common/enemy-intent-brief-status.ts` has no uncommitted work. PR-0011 is committed (333bc2c7, 73d98c59).
- CORRECTED: `src/battle/ffx/intent.ts` is already 709 lines, over the house cap. Put the `pairing` derivation in a new pure module, for example `intent-pairing.ts`, that `intent.ts` re-exports, and run `orphans.mjs`.
- Builder: coordinate the guide edit with PR-0008 (the same file, one wording round). Option B's win delta disagrees with PR-0008's probe (see that review). Mockups first (rule 9). B and C stay parked (rule 10). No boss value changes.
