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
