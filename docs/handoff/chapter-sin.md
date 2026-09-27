# Chapter XVI, Sin: link 4 (Overdrive Sin) first, UNLISTED behind the switch

**Game case: FFX only** (AGENTS.md rule 14): CTB, the airship range, aeons, and a boss whose turn
clock ends in a scripted Game Over. None of it exists in FFX-2 (`research/ffx-sin.md` §0.3).

- **The shared engine seams** are FFX plumbing, and each one is inert outside this battle:
  - the scripted Game Over flag;
  - the Cid guard on airship orders;
  - the counted-foe mark.
- **Checked unchanged:** the FFX chapters' event logs and menus are byte-identical before and
  after (see "Verified" below).

**Where it lives:** branch `chapter-sin`, worktree `D:/pyrefly-ch-sin` (sparse, no
`docs/screenshots` except `sin/`).

**Bailey, 2026-09-27 ~13:40 EDT: "all your recommendations"**, answering the driver's list "Sin A
through B, the Garden of Pain party, and Ixion A". For Sin:

- **End state:** concept A.
- **Route:** through B. That means:
  - a painting pilot of the head;
  - link 4 benched at human speed;
  - link 4 shipped unlisted behind a switch;
  - then links 1 to 3 in front, reusing Evrae's range command.
- **Party:** `garden-of-pain.ts` with Yuna's Tetra Ring back (S-29, our estimate).
- **S-1:** Giga-Graviton on Sin's 13th turn by default. S-1 stays open until the Steam check,
  which only Bailey can schedule.

## What is built

| Piece | File | Source |
|---|---|---|
| Overdrive Sin's rows: Drawn to Sin, Gaze (three statuses, plus the aeon version), Giga-Graviton | `src/data/ffx/enemies/overdrive-sin-abilities.ts` | research §3.4, every row tagged; all `canMiss: false` (§3 "Always hits") |
| Overdrive Sin: stats, elements, statuses, rewards; formation `overdrive-sin` | `src/data/ffx/enemies/overdrive-sin.ts` | §2.1 to §2.4. S-6 Threaten is immune (the Evrae C-4 shape) |
| The clock and the scripted Game Over | `src/battle/ffx/ai/overdrive-sin.ts` | §5.4 pseudocode, step for step |
| Rules: constants, flags, setup, Gaze counter, the estimates as data | `src/battle/ffx/ai/overdrive-sin-rules.ts` | §5.4, §10 (S-1, S-16, S-28) |
| The party | `src/data/ffx/builds/sin-fahrenheit.ts` | §7.3 option B (S-29, our estimate) |
| The chapter, unlisted, number 16 | `src/data/chapter-sin.ts` → `UNLISTED_CHAPTERS` | the concept sheet's slot XVI |
| Scripted Game Over (engine) | `src/battle/ffx/results.ts` (`SCRIPTED_GAME_OVER_FLAG`); `engine.ts#checkEnd` | §3.4, `[verified: 4 sources]` |
| No orders without Cid; the counted foe | `src/battle/ffx/ai/evrae-rules.ts` | §3.5, `[verified: 3 sources]` |
| Tests | `tests/unit/chapters/sin-engine.test.ts` (18), `tests/unit/chapters/sin-bench.test.ts`, helpers `sinUnits.ts` and `sinPolicies.ts` | |
| Bench write-up | `docs/plans/sin-link4-bench.md` | |

**How the fight runs:**

1. **The pulls.** Sin's turns 1 to 3 are "Drawn to Sin." with the ship FAR. This reuses Evrae's
   `airship.range` gap: only Wakka, Blk and Wht Magic, Lancet and long-range rows reach. The ship
   is NEAR after the third pull.
2. **The mouth.** Turns 4 to 12 are the mouth. These turns pass and carry a telegraph line, with
   no action row (§3.4: a pose).
3. **The end.** Turn 13 is Giga-Graviton: 16/16 of max HP, Death 255, and a scripted Game Over
   that Auto-Life and an aeon cannot stop.
4. **Gaze.** Gaze is a counter after six party targetings, with an aeon's targeting counting two.
   It hits the whole party with one status at 30 %, or the aeon at power 50.

**The flags on `state.flags`** (for the HUD clock later):

- `sin.turn`, `sin.turnsLeft`, `sin.gigaGravitonTurn` (the S-1 switch, per battle);
- `sin.gazeCounter`;
- `sin.mouthStage`: 0 during the pulls, then 1 to 3, then 4 for fully open. This is presentation,
  our estimate.

**Placeholders, each labelled in the code:**

- **Scene:** Chapter VIII's deck, `evrae-airship-deck`. Its range director follows the same flag.
  The painted backdrop, the deck over Bevelle at dusk, is not painted.
- **Enemy art:** the stage's grey boss silhouette. There is no painting yet.
- **Music:** `scene-fahrenheit` and `boss-evrae` (S-21: no source names the head's track).
- **Story:** silent. A pre scene opens the battle, and a post scene shows results.
- **Card copy:** our own summaries, `title: 'Sin'`. It is not shown, since there is no card.

## The bench (summary; full tables in `docs/plans/sin-link4-bench.md`)

Settings: 200 seeds, first try, human pace equal to bench speed (CTB). Nothing was tuned.

| Line | Giga-Graviton on | Wins | Ended by Giga-Graviton | Sin HP left on a loss (median) | Damage per Overdrive |
|---|---:|---:|---:|---:|---:|
| sensible | 13th (default) | **62/200 (31 %)** | 138/200 | 13,329 | 3,087 (Auron's Dragon Fang, the only gauge that fills) |
| sensible | 12th (Gestahl) | 7/200 (3.5 %) | 193/200 | 16,881 | 3,091 |
| naive | 13th | 0/200 | 200/200 | 114,588 | 2,229 |
| naive | 12th | 0/200 | 200/200 | 116,037 | 2,229 |

**Verdict:** one sitting of concept A looks too long.

- **The estimate:** the first pass is about 215 to 265 engine turns. Links 1 to 3 in that are an
  estimate from §6.2; link 4 is measured at 75.
- **Against the project:** the longest line today is Chapter III's first link, at about 195 turns.
- **The retries:** a first clear needs about three link-4 attempts at 31 %.
- **The recommendation:** split at the save into concept C. The built link 4 is C's second
  chapter as it stands. The alternative is to keep A only with a checkpoint at the save.
- **Bailey's pick.**

## Verified (2026-09-27)

- `npx tsc --noEmit`: clean.
- **Tests:**
  - `tests/unit/chapters/sin-engine.test.ts`: 18/18.
  - `sin-bench.test.ts`: green, and it prints the tables.
  - Full suite: see the commit body.
- **Unchanged elsewhere:**
  - FFX chapters I, II, III, VII to X, XII and XIV, 6 seeds each, sha256 of the event log and of
    every menu offered: identical on this branch and on `main` (a scratch hash harness, not
    committed).
  - `ffx2-atb-golden` and the FFX engine suites pass unchanged.
- `node tools/orphans.mjs`: 29 before and 29 after. No new module is orphaned.
- **Browser**, headless Chromium on the GPU, a dev server on port 7300 (stopped afterwards):
  - `window.__pyrefly.gotoChapter('sin')` reaches the battle.
  - `chapters()` does not list it.
  - It opens FAR with the clock at 13.
  - Real keys submitted Tidus's Cheer. Attack reads "Out of reach" at FAR, and the advisor card
    offers Cheer.
  - At Sin's 5th turn the ship is NEAR and the mouth is at stage 1.
  - The fight ends on the Defeat results screen.
  - Screenshots: `docs/screenshots/sin/link4-placeholder-far.png`, `-near.png`, `-end.png`.

## Open (Bailey's, or the next track's)

1. **S-1.** Giga-Graviton on the 12th or the 13th turn is worth 31 % against 3.5 %. It needs the
   Steam HD Remaster check, which only Bailey can schedule. Do it before listing.
2. **A or C for one sitting.** The bench says C (split at the save), unless A gets a checkpoint at
   the save. Bailey's pick.
3. **The painting pilot of Sin's head** at colossal scale: 9 states in the concept sheet. Options
   first, and nothing is installed until Bailey picks (rules 8 and 9). This agent did not queue
   renders.
4. **The HUD clock (mouth as clock, concept B's frame)** needs a mockup and Bailey's approval before
   it is built. The flags it would read are already published.
5. **Links 1 to 3:** the Fins' range fight and the Genais and Core link (§5.1 to §5.3). These are
   research §11 items 1 to 8, with S-12's Negation formulas behind named tunables. After that, a
   real bench of links 1 to 3 to replace the estimate above.
6. **Music:** the countdown cue and the assault cue, sketched and judged by ear (rules 8 and 13).
7. **Listing is the switch.** Move `SIN` from `UNLISTED_CHAPTERS` into `CHAPTERS`, with a card,
   meta, story, guide and tactic, once the picks above are made.
8. **Not built on purpose:**
   - S-28 (Use reaching after the 2nd pull, single source).
   - Aeon Overdrive lines in the bench (the preset's aeon gauges are not full).
   - The equipment drops (S-7).

## CHECK (independent, 2026-09-27 ~16:15 EDT; did not build it)

Branch `chapter-sin` at 410c4cf8, worktree `D:/pyrefly-ch-sin`. **FFX only**, as the build says.
Every claim below comes from running the engine (rule 3), not from reading the code. The probes are
untracked scratch in `tests/unit/zz-scratch/zz-check-sin*.test.ts` and `tools/zz-sin-*.tmp.mjs`.
**Verdict: PASS. No blockers.**

**Data against `research/ffx-sin.md`:** every field was read against its tag, and all of them match.

- **§2.1 stats:** HP 140,000, MP 999, STR 30, DEF 40, MAG 30, MDEF 40, AGI 30, Luck 15, Eva 0, Acc 0.
  Overkill 16,000; Zanmato 4; Doom 30. The head is Armored, immune to percentage damage and to Delay.
- **§2.2 and §2.3 resistances:** no elemental affinities. Every 255 row in §2.3 is 255. Armor and
  Mental Break and Reflect are landable. Threaten is immune (S-6).
- **§2.4 rewards:** 12,000 gil and 20,000 AP (30,000 on Overkill); steal Ether / Supreme Gem; drop
  Lv. 3 Key Sphere; Bribe immune.
- **§3.4 rows:**
  - Gaze: Magic, power 20, Special, whole party, one status at 30 %. There are three versions, and
    the aeon version is power 50.
  - Giga-Graviton: percent-total 16, Break Damage Limit, Death 255.
  - Every row has `canMiss: false` (rule 5).
  - The estimates are labelled: rank 3, and Confuse's duration of 254.

**The clock, over seeds 1 to 25 with the party defending (engine log):**

- **Giga-Graviton on turn 13:** all 25 seeds give the same shape.
  - Drawn to Sin on turns 1, 2 and 3. The range is FAR, FAR, then NEAR from the third pull.
  - `turnsLeft` counts down 12, 11, 10 ... 0.
  - There are 9 mouth telegraphs and no action row on turns 4 to 12.
  - Giga-Graviton comes on turn 13. The outcome is defeat, and `battle.scriptedGameOver` is set.
- **Giga-Graviton on turn 12:** the same shape, with 8 telegraphs.
- **What Giga-Graviton does:** it deals 100 % of max HP to anyone at full HP (Tidus 6492/6492), or
  their current HP. The log shows `damage`, then `ko`, then `defeat`, in that order.

**The scripted Game Over:**

- **Auto-Life:** Auto-Life was put on all seven members over seeds 1 to 8. Three revives fire after
  Giga-Graviton, and every seed still ends in defeat.
- **Aeons:** an aeon was called on Yuna's first turn and held the field to turn 13. This was tried
  with each of Valefor, Ifrit, Ixion, Shiva and Bahamut. Giga-Graviton hit only the aeon, and every
  run still ended in defeat.

**Gaze:**

- **The count:** over 60 seeds, 1,466 party targetings drew 216 Gazes. That fits the six-count
  resetting after each Gaze, with 0 to 5 left over at the end of each fight.
- **What does not count:** five hits plus cures and defends draw no Gaze, and the count stays at 5.
- **The variants:** Petrify 72, Confuse 77, Zombie 67, uniform as S-16 intends.
- **How often the status lands:** on a member without a ward it lands 18 % to 33 % of the time
  (Auron: Petrify 17/72, Confuse 18/77, Zombie 19/67). That fits a 30 % chance.
  - The wards hold completely: Tidus and Yuna are never Confused (both wear Confuse Ward), and Yuna
    is never Petrified (Stoneproof).
- **The aeon version:** `sin-engine.test.ts` covers it (three aeon attacks draw it), and that test
  passes here.

**Reach at FAR, Sin's first turn:**

- Tidus reaches with Slow only. It is White Magic, and Sin is immune to it.
- Yuna reaches with Reflect and Dispel.
- Auron reaches with nothing.
- No Trigger Command is offered, and Cid is absent.
- Asking for Sin's intent leaves `state.flags` byte-identical: the preview does not move the clock.

**The bench reproduces exactly.** `npx vitest run tests/unit/chapters/sin-bench.test.ts` printed the
same tables to the digit:

- sensible line: 62/200 with Giga-Graviton on turn 13, and 7/200 on turn 12;
- naive line: 0/200 both ways;
- every other column matches too.

The same seed gives the same log.

**Unlisted:**

- **The debug API:** `__pyrefly.chapters()` returns the 15 listed ids, and `sin` is not among them.
- **Chapter select** (headless GPU Chromium, dev server on port 7410, since stopped) shows the same
  cards as main.
  - The FFX row is I, II, III, VII (coming), VIII, IX, X, XII and XIV.
  - The FFX-2 row is IV, V, VI, XI, XIII and XV.
  - There is no "Sin" and no "XVI" on the board.
- **Nothing changed underneath:** `src/app/**`, `src/ui/**`, `CHAPTERS` and the chapter-select code
  are unchanged, both from the branch base to HEAD and from the base to `origin/main`.
- **Reaching it:**
  - `gotoChapter('sin')` reaches the battle. It opens FAR, with 13 turns left.
  - Real Enter keys submitted Tidus's Cheer.
  - The fight ran to Giga-Graviton on turn 13 and ended in defeat.
  - There were no page errors.

**Goldens and the rest of the build:**

- **FFX:** `tests/unit/tools/ffx-chapter-hashes.test.ts` was run with 6 seeds and 4 policies, skipping
  `sin`. It was run on a `git archive` of the base 60cf703c and on HEAD, and the results are
  identical: 408/408 entries across the nine FFX chapters.
- **FFX-2:** `ffx2-atb-golden` passes, 6/6. `ff7-golden` passes.
- **Type check:** `tsc --noEmit` is clean on tracked code. The only errors are in untracked
  `tests/unit/zz-scratch/` probes: the builder's `sin-probe*.test.ts`, and two of mine that I have
  since fixed.
- **Orphans:** 29, and none of them is a Sin module.
- **Full suite (run once):** 555 files pass and 2 fail, 9235 tests pass and 2 fail. The two failures
  are timeouts under machine load:
  - `strategy-ffx2-bahamut` heal-only route, 30.5 s;
  - `ui-ffx2-atbmode` FFX HUD chip, 22.9 s.
  Both pass when run alone (25/25), and neither touches Sin code.

**Findings (all minor):**

1. **The record still reads as concept A.** Bailey picked C on 2026-09-27 ("all your
   recommendations"), which settles "Open" item 2. This link becomes "Sin: the Face", and links 1 to
   3 become "Sin: the Fins and the Core". `src/data/chapter-sin.ts` still says `title: 'Sin'` and
   number 16, and the handoff's Open list still asks the question. Rename it, renumber it and reword
   the Open list before listing.
2. **An aeon's targeting counts 2 toward the six.** That is a labelled reading of "three times by an
   aeon". The research pseudocode keeps separate thresholds instead (3 for an aeon, 6 for the
   party). The two agree when only one side attacks. They differ when a party count carries over
   into a summon: at 5, one aeon hit fires Gaze. Neither is sourced, and it is already in
   `OVERDRIVE_SIN_ASSUMPTIONS`.
3. **Cosmetic, in `learn/atlas/cites.ts`:** the Chapter XVI comment was joined onto the
   `'ffx2-den-of-woe': {},` line.
4. **The worktree's scratch probes break `tsc` in this worktree.** They sit untracked under
   `tests/unit/`, so the type check here is not clean. No tracked file is affected.
