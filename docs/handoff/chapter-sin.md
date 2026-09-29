# Sin as two chapters, UNLISTED behind the switch: XVII "the Fins and the Core", XVIII "the Face"

**Game case: FFX only** (AGENTS.md rule 14): CTB, the airship range, aeons, and a boss whose turn
clock ends in a scripted Game Over. None of it exists in FFX-2 (`research/ffx-sin.md` §0.3).

**Since 2026-09-29 (D-270, package S):** Sin is two chapters, split where the game saves.

- **Chapter XVII, `sin-fins-core`**, "Sin: the Fins and the Core" (working title): links I to III
  (`sin-left-fin` → `sin-right-fin` → `sin-genais-core`) on one party state, `src/data/chapter-sin-fins-core.ts`.
- **Chapter XVIII, `sin-face`**, "Sin: the Face" (working title): link IV, Overdrive Sin, as built
  below. It is the branch-only `sin` renamed and renumbered (`git mv` to `src/data/chapter-sin-face.ts`).

Everything below the "Package S" section is the link-4 record of 2026-09-27; read `sin` there as
`sin-face`, and "Chapter XVI" as Chapter XVIII.

## Package S, the spine (2026-09-29; `docs/plans/sin-two-chapters-plan.md` §2.1, §2.2, REVIEW)

**What F, G, P and H can rely on.** Every name the packages share is in
`src/battle/ffx/ai/sin-ids.ts` (constants and the `SinCounter` type only):

- **Enemy ids:** `left-fin`, `right-fin`, `sinspawn-genais`, `sin-core`, and `cid` in both Fin formations.
- **Formation ids:** `sin-left-fin`, `sin-right-fin`, `sin-genais-core` (chained by `nextGroupId`).
- **Script ids:** `sin-left-fin`, `sin-right-fin`, `cid-fahrenheit-sin` (Cid, no missiles, S-19),
  `sinspawn-genais`, `sin-core`.
- **Row ids** (`src/data/ffx/enemies/sin-fins-abilities.ts`, `sin-genais-core-abilities.ts`): `sin-fin-ram`,
  `-smack`, `-gravija`, `-gravija-far`, `-negation`, `-negation-far`, `-gathers`, `sin-motionless`;
  `sin-genais-venom`, `-thrashing`, `-sigh`, `-waterga`, `-cura`, `-shell-in`, `-shell-out`,
  `sin-magic-absorbed`; `sin-core-inactive`, `-gathers`, `-gravija`, `-negation`, `-fire`, `-blizzard`,
  `-thunder`, `-water` (`SIN_CORE_ELEMENT_CYCLE` is the F, B, T, W order). Every row is `canMiss: false`
  and rank 3 (§3 `[decompiled]`). Counter rows carry `is-counter`; silenceable rows (Waterga, Cura, the
  Core's four) carry the Blk/Wht Magic category (the `flare-self` precedent), so an AI can ask
  `blockedBySilence`.
- **Flag keys** (`state.flags`): `sin.fin.hits`, `sin.fin.regularActs`, `sin.fin.charged`,
  `sin.fin.latched` (F); `sin.genais.shelled`, `sin.core.state` (`inactive | charging | ready | free`),
  `sin.core.counterStep`, `sin.core.down` (G); `sin.negation.lastTaken` (both:
  `Record<CombatantId, StatusId[]>`). None collides with link 4's `sin.turn` family.

**The stubs, with their final signatures** (each a no-op or `null` today, each file F's or G's to fill):

| File | Owner | Exports (signature) |
|---|---|---|
| `src/battle/ffx/ai/sin-fins-rules.ts` | F | `applySinFinsSetup(ctx: Ctx): void`; `markSinFinsRuntime(flags, actors): void`; `collectSinFinsCounters(ctx, attacker, def, damagedEnemyIds): SinCounter[]`; `SIN_FINS_ASSUMPTIONS` (holds S's `seam-lineup`); re-exports `sin-negation.ts` |
| `src/battle/ffx/ai/sin-fins.ts` | F | `leftFinAi`, `rightFinAi`, `cidSinAi` (`(ai: AiContext) => Command \| null`), registered under the three script ids |
| `src/battle/ffx/ai/sin-negation.ts` | F (G reads) | `NEGATION_REMOVES` (the 24 of §3.1, sourced, S's), `NEGATION_SPARES`, `NEGATION_MERCY`; `finNegationChance(ctx, finId): number` (stub, 0) |
| `src/battle/ffx/ai/sin-genais-core-rules.ts` | G | `applySinGenaisCoreSetup(ctx)`; `markSinGenaisCoreRuntime(flags, actors)`; `syncGenaisCoreLiveness(ctx)` (the must-change 2 hook); `collectSinGenaisCoreCounters(ctx, attacker, def, damagedEnemyIds): SinCounter[]`; `SIN_CORE_ASSUMPTIONS` |
| `src/battle/ffx/ai/sin-genais-core.ts` | G | `genaisAi`, `sinCoreAi`, registered |

**The aggregators and the swapped lines** (none of the four shared files grew, but `reactions.ts` by the
one line the review asked for):

- `setup.ts`: `applySinSetups(ctx)` (`sin-setup.ts`: link 4's setup first, unchanged, then the Fins,
  then Genais and the Core).
- `simulate.ts`: `markAirshipRuntime(flags, actors)` (`sin-setup.ts`: `markEvraeRuntime`, then
  `markSinRuntime` = the Fins' and Genais/Core marks). A preview gets every mark.
- `reactions.ts`: `collectSinCounters(ctx, attacker, def, damagedEnemyIds)` (`sin-counters.ts`: link 4's
  Gaze first, then the Fins', then link 3's), pushed with `targets: c.targets ?? []` (must-change 1:
  **G returns the caster in `targets` for Waterga**). And one added line at the top of
  `runMortibsorptionIfDown`: `runSinLivenessHooks(ctx)` → `syncGenaisCoreLiveness(ctx)`, which runs at the
  start of every `afterAction`, for every command kind and a Doom KO alike (must-change 2).
- `ai/index.ts`: `import './sin-scripts.ts'` (it imports `overdrive-sin.ts`, `sin-fins.ts`,
  `sin-genais-core.ts`).

**The status carry** (`src/app/screens/BattleScreenSetup.ts#carryFfx`): when the next link sets
`carriesPartyState` (only `sin-right-fin` and `sin-genais-core` do), each member's and aeon's live statuses
are copied into the build, less `ko` (re-derived from HP), `eject` and the Defend/Guard/Sentinel stances
(our estimate: §1.2 says only that statuses carry). Chapters III and XIV carry no statuses, as before
(`tests/unit/chapters/sin-carry.test.ts`).

**Chapter XVII's party** is `sinFinsCoreBuild` (`src/data/ffx/builds/sin-fahrenheit.ts`): D-264's preset
with **Tidus's and Rikku's orders to Cid** (`pull-back`, `close-in`) back, because the Fins' range fight is
Evrae's (§4 `[verified: 4 sources]`) and `highbridge.ts` strips them for every later chapter. The markers
ride the chain into link 3, where no Cid stands, so the rows grey out there ("Not your call", Evrae's
reason): **F or P decides how that row reads in link 3** (§3.5: no Trigger Command in links 3 and 4).

**What is still F's (the stubs do nothing yet):** Cid is not a non-combatant in the Fin fights until F's
setup publishes `airship.range` (then `markEvraeRuntime` marks him), so **a Fin link cannot be won
before F lands**; the carry test drives the seam directly. The same for G: the Core's reach, magic
absorption and "victory when the Core dies" are G's.

**The golden-hash base (must-change 10), for F, G and P:**

- Base tree: `D:/Tools/pyrefly-scratch/overnight-0929/sin-S/base` (`git archive 56026029` of `src`,
  `tests/unit/tools`, `tests/unit/helpers` and the configs). Its `node_modules` is a **junction** to
  `D:/Final Fantasy/node_modules`: unlink it with `cmd /c rmdir` before anyone deletes the folder.
- Base hashes: `D:/Tools/pyrefly-scratch/overnight-0929/sin-S/base.json` (6 seeds, 408 runs, written with
  `FFX_HASH_SKIP=sin,sin-face,sin-fins-core`). Also `base-link4.json` (skip `sin-face,sin-fins-core`, so it
  holds link 4 under its old id `sin`).
- To diff: from `D:/pyrefly-ch-sin`, `FFX_HASH_OUT=<your file> FFX_HASH_SEEDS=6
  FFX_HASH_SKIP=sin,sin-face,sin-fins-core npx vitest run tests/unit/tools/ffx-chapter-hashes.test.ts`,
  then compare with `base.json` key for key.
- **Package S's result:** 408/408 identical; link 4 (`sin` → `sin-face`) 24/24 identical; the link-4
  bench prints the same tables (62/200 on the 13th turn, 7/200 on the 12th).

**D-270's re-equip is a deviation, not a default** (must-change 9): Chapter XVIII does not open with a
re-equip. The Right Fin's Stoneproof drop is not built (which part drops is `[unsourced]`, §2.4;
equipment drops are not modelled, S-7) and the FFX prep screen cannot change equipment (Q10). Recorded in
`docs/target/decisions.json` on D-270 (`deviation`, this branch's copy) for Bailey.

**New open questions** (they belong on the plan's Q list; recorded here):

- **Q16, the seam line-up** (must-change 6): links 2 and 3 reopen with the build's front row (Tidus,
  Yuna, Auron), whoever ended the previous link in front. Our estimate, in `SIN_FINS_ASSUMPTIONS`
  (`seam-lineup`); bench B measures both readings.
- **Q17, link 3's reveal plate:** `sin-genais-core` has no `headline`, so the plate names its first
  enemy, Sinspawn Genais. The Core's in-game name is "Sin" (`m138`), kept as the record's name. P or L
  decides the plate.

**Tests:** `tests/unit/chapters/sin-data.test.ts` (28: the records, the chain, the table, every row, the
24-status list and the permanent-status rule on the real engine, the ids, the stubs registered) and
`sin-carry.test.ts` (4). `sin-engine.test.ts` and `sin-bench.test.ts` renamed to `sin-face`.

- **The shared engine seams** are FFX plumbing, and each one is inert outside this battle:
  - the scripted Game Over flag;
  - the Cid guard on airship orders;
  - the counted-foe mark.
- **Checked unchanged:** the FFX chapters' event logs and menus are byte-identical before and
  after (see "Verified" below).

**Where it lives:** branch `chapter-sin`, worktree `D:/pyrefly-ch-sin` (sparse, no
`docs/screenshots` except `sin/`).

## Packages F, G, P and H, merged into `chapter-sin` (2026-09-29 ~01:20 EDT; FFX only)

Merged in the plan's order with `git merge --no-ff`, no conflicts (the four own disjoint files):
F `b5f393c2` → `8d6edae3`, G `6ba35582` → `b29419f8`, P `cd0a6c0b` → `401d6126`, H `d8958e15` →
`b9abbd96`. Nothing is listed yet (plan §6, package L).

**F, the Fins and Cid** (`src/battle/ffx/ai/sin-fins.ts`, `sin-fins-rules.ts`, `sin-negation.ts`;
`tests/unit/chapters/sin-fins-engine.test.ts`, 19 tests):

- **Left Fin** (research §5.1.4, step for step). At NEAR it attacks 33, 67 or 100 % of the time after 0,
  1 or 2+ hits (Ram, strong Delay); at FAR only from 7 hits (Smack); otherwise "Sin remains motionless.".
  At NEAR it takes three regular turns, then "Core gathers energy." (`sin.fin.charged`), then Gravija (75 %
  of current HP, floored, so it cannot kill). A charge that resolves at FAR is the no-damage row: the dodge.
- **Right Fin** (§5.2): attacks from 4 hits at NEAR, 5 at FAR. Below 16,250 HP it latches for good: always
  at NEAR, from 3 at FAR.
- **The hit counter:** each party action naming the Fin counts 1, an aeon's 2 (S-27, labelled); NEAR and
  FAR share it; it resets when the Fin attacks.
- **Negation** (S-12): the wiki's single-source formula behind named `NEGATION_*` tunables, a bench
  switch (`sin.negation.off`), and `sin.negation.lastTaken` as a JSON string (flags hold scalars).
- **Cid** (S-19) flies a queued order with Evrae's telegraph line and fires no missiles; the Fins open FAR
  (S-8). `SIN_FINS_ASSUMPTIONS` names S-8, S-12, the Negation slots, S-19, S-20, S-25, S-27, the latch,
  aeon reach at FAR (REVIEW 13), C-7 and S's `seam-lineup`.

**G, Genais and the Core** (`sin-genais-core.ts`, `sin-genais-core-rules.ts`;
`tests/unit/chapters/sin-core-engine.test.ts`, 21 tests):

- **Genais:** Venom, Venom, Thrashing; on its turn at 10,000 HP or less it shells (Armored,
  percentage-immune) and uses Sigh; it leaves on its turn at 12,000 or more (S-2: the wiki and the in-game
  Scan text).
- **Waterga** answers magic aimed at Genais and lands on the caster, aeons included (REVIEW 1). **Cura**
  answers each action that damages shelled Genais, once per action (labelled).
- **The Core:** inactive while Genais is out, gathers and casts Gravija while it is shelled, a free cycle
  once Genais dies. While Genais lives it is out of melee reach and magic-immune ("Magic absorbed.").
  Counters when targeted: Negation on the S-12 chance, else Fire, Blizzard, Thunder, Water in turn. The
  pre-death counter chance and "an absorbed spell draws a counter" are their own labelled tunables
  (REVIEW 8), in `SIN_CORE_ASSUMPTIONS`.
- **The liveness hook** (REVIEW 2) recomputes the Core's marks, `sin.core.down` and Genais's
  non-combatant mark from `isAlive` on every action: the Core falling wins with Genais standing, and Doom or
  Zombie plus Cura free the Core.

**P, the story and ship layer:**

- **Story:** `src/story/scripts/sin-fins-core.ts` (§9.2 beats 1 to 8, with mid beats for the Fin's charge,
  Tidus's and Rikku's order asks with Cid's "wait", both chain seams, and Genais) and `sin-face.ts` (beats 9
  to 11). Every line original; the "ball" line is our paraphrase; "Brother" has a name plate only. XVIII has
  one callout, on the first "Drawn to Sin."; a stage-3 callout would need a trigger from
  `overdrive-sin.ts` (named in the file header, not built).
- **Meta, guides, tactics:** `src/data/chapter-meta-sin.ts` in `UNLISTED_CHAPTER_META` (REVIEW 12, so no new
  orphan; `chapter-meta.ts` stays at 399 lines, its numeral union gains XVII and XVIII);
  `src/data/guides/sin-fins-core.ts` and `sin-face.ts` in `GUIDES`; `src/engine/tactics/sin-common.ts`,
  `sin-fins-core.ts`, `sin-face.ts`, `sin-tactics.ts`, registered by one line in `tactics/index.ts`, with
  `CHAPTER_GAME` rows in `lookup.ts`. R9 lives in the tactic: pull back when charged unless Cid's forecast
  turn comes after the Fin's.
- **Ship layer:** the range director in `BattleScreenAirship.ts` binds Evrae or a Fin only, never Overdrive
  Sin (REVIEW 3; Chapter VIII and link-4 staging pinned in `sin-ship-layer.test.ts`). The order widget
  (`AirshipOrders.ts`, `AirshipOrderWidget.ts`) shows no pip strip without a missile flag (REVIEW 4; Evrae
  unchanged). `phaseCanon.ts`'s `evrae-far` grade is labelled a placeholder for Sin's FAR.
- **THEMES.md:** the two owed cues (assault, countdown), outside the audited map until listing.

**H, the HUD** (package M's recommended frames, the driver's picks under D-279, not Bailey's words):

- **The link 4 clock (M1-A, the mouth ring):** `sin.turn`, `sin.turnsLeft`, `sin.gigaGravitonTurn`,
  `sin.mouthStage`; 3 pull segments, the melee window, 1 last; the numeral red at 1 or 0; the stage chip,
  the S-1 estimate line and the Gaze pill.
- **The Fins' plate (M4-B):** `airship.range` and `sin.fin.charged`; NEAR and charged gives the red bar,
  FAR the quiet line, NEAR uncharged neither.
- `src/ui/ffx/sinHudModel.ts` (pure), `SinHud.ts`, `sin-hud.css`, wired in `BattleScreenWiring.createHud`
  on the FFX HUD only; the node is not appended outside Sin's flags. `SIN_HUD_SELECTORS` join the advisor's
  and the chapter panel's avoid lists. Measured deviations from the frames (desk clock at x 500; phone
  Gaze pill at 352, Fin plate at 100) are in the H commit.

**The one integration fix** (`tests/unit/chapters/sin-tactic.test.ts`): P's "once Genais is gone the Core
is Broken first" killed Genais by hand against G's stub and reused the rows offered before. With G merged
the Core is out of reach until the liveness hook runs after an action, so the test now kills Genais with a
real Attack (HP set to 1) and reads Auron's next rows. No source changed.

**Gates after the merges (2026-09-29):**

- `npx tsc --noEmit`: clean (only the untracked `tests/unit/zz-scratch/` probes error).
- Every `tests/unit/chapters/sin-*.test.ts`, `evrae-engine.test.ts`, `guide-link-title`, `strategy-guide`,
  `tactics-lookup`: 14 files, 260 pass, 1 skipped (the `PYREFLY_SIN_MEASURE` measurement).
- **FFX golden hashes** against S's base (`56026029`, 6 seeds, `FFX_HASH_SKIP=sin,sin-face,sin-fins-core`):
  408/408 identical. Every other FFX chapter is unchanged.
- `node tools/orphans.mjs`: 24, none of them a Sin module (no growth).
- Full suite once (`npx vitest run --testTimeout=60000`): 628 files pass, 5 skipped; 9,791 tests pass,
  38 skipped, 1 todo. No failure.
- **An engine probe of the whole XVII chain** (the intended line, `setupForChapter` then
  `setupForNextLink`, seeds 1 to 8; untracked `tests/unit/zz-scratch/zz-merge-sin-probe.test.ts`): links 1
  and 2 won on 8/8 and 7/8 seeds (about 120 to 160 and 60 to 125 inputs); the Fins' plate showed the
  charged state 32 to 96 times per link and nothing in link 3; the clock never showed in XVII. **Link 3 was
  won on no seed:** 3 defeats and 4 stalemates (`escape`, the engine's no-progress watch) with Genais dead
  and the Core at 16,000 to 26,000 HP. Seed 2, read turn by turn: once Genais falls every swing at the
  Core draws its elemental counter on the whole front row (about 400 to 600 each), the revives stop
  (Phoenix Downs spent, by the look of the rows), Tidus and Auron stay down, and Yuna casts Pray alone
  until the watch ends it. No summon shows in the part of the log read. That is bench B's to measure and explain (REVIEW 13), with the Core's after-death counter
  chance (S-13, Gestahl: every time) as the first suspect; nothing was tuned.

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

## Package B, the Chapter XVII bench (2026-09-29; FFX only; full tables in `docs/plans/sin-fins-core-bench.md`)

Measured on `chapter-sin` after F, G, P and H merged. Nothing was tuned (no boss number, data row or engine file
changed; only tests, helpers and the note). 200 seeds per line, first try, the sensible line (research §8 rows 1 to
4, 6, 9), the naive line, and the advisor card's top row (`critic/bench/advisor-v3/drive.ts` primitives).

**Does XVII clear the 90 % intended-line bar? No.**

| | Chain (links 1 to 3, carried) | Link 1 | Link 2 | Link 3 |
|---|---:|---:|---:|---:|
| Sensible, chain | 13/200 (6.5 %) | 100 % | 100 % | 13/200 |
| Sensible, each link rested | - | 100 % | 100 % | 78.5 % |
| Advisor card, chain | 1/200 (0.5 %) | 95 % | 43.7 % | 1/83 |
| Advisor card, each link rested | - | 95 % | 98 % | 82.5 % |
| Naive | 0/200 | 0 % | 0 % | 0 % |

- **The cap is carry into link 3** (rested 78.5 %, carried 6.5 %), and the Core's four elemental counters end the
  sensible line's losses. A chain attempt is **413 engine turns** (a full clear 380 to 490), about twice Chapter III's
  first link (about 195) and 2.2 to 2.9 times the plan's estimate (140 to 190).
- **S-12 (Negation) is the biggest lever and the least sourced:** off, the sensible chain is 91/200 (45.5 %) and the
  card's 29/200 (14.5 %). **S-8** NEAR barely moves the sensible line (9 % against 6.5 %; the card's rested link 2 is 88 %
  against 98 %). **The seam line-up (Q16)**, both readings: within noise for the sensible line (8 % against 6.5 %).
- **Aeons reach nothing at FAR** (REVIEW 13): every attack, ability and Overdrive row is off for all five aeons on both
  Fins, even with a full gauge; at NEAR every row reaches. §7.2's guides summoning Bahamut on the Fins would have to be
  NEAR; unreconciled, a question for the plan's Q list.
- **`escape` (the 400-turn stalemate) is its own cause:** naive loses every Fin fight that way; 10 of the 200 sensible
  chains end in it at link 3. **No line wins with Genais standing;** the Core-first variant (row 6) is 0/200.
- **Options for Bailey (none built):** a checkpoint at link 3 (Q3: 78.5 % rested), confirming S-12 against the game,
  an aeon line for link 3, or listing XVII with its difficulty disclosed.
- **Tests:** `tests/unit/chapters/sin-fins-core-bench.test.ts` (a smoke set in the suite; the tables behind
  `PYREFLY_SIN_BENCH=1`, about 17 minutes), `tests/unit/helpers/sinFinsBench.ts` and `sinFinsPolicies.ts`.
  `sin-bench.test.ts` gained the advisor line and the same gate (6 seeds in the suite; `PYREFLY_SIN_BENCH=1` for the
  200). Link 4 with the card: **44/200 (22 %)** on the 13th turn, **4/200 (2 %)** on the 12th; the other two lines are
  unchanged (62/200 and 7/200; 0 and 0).

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
   Steam HD Remaster check, which only Bailey can schedule. Do it before listing. (D-280: the 13th
   for now, labelled our estimate.)
2. **A or C for one sitting: settled.** Bailey picked C (D-270): XVII "the Fins and the Core" and
   XVIII "the Face", split at the save. Still open inside XVII: the retry starts at the Left Fin (the
   default) or at a link-3 checkpoint (plan Q3), once bench B has the length.
3. **The painting pilot of Sin's head** at colossal scale: 9 states in the concept sheet. Options
   first, and nothing is installed until Bailey picks (rules 8 and 9). This agent did not queue
   renders.
4. **The HUD clock (mouth as clock, concept B's frame)** needs a mockup and Bailey's approval before
   it is built. The flags it would read are already published.
5. **Links 1 to 3 (Chapter XVII):** the spine is in (package S, above). Packages F (the Fins and Cid),
   G (Genais and the Core) and P (story, meta, guides, tactics, the director bind, the widget) fill the
   stubs; then bench B measures the chain to replace the estimate above.
6. **Music:** the countdown cue and the assault cue, sketched and judged by ear (rules 8 and 13).
7. **Listing is the switch.** Move `SIN_FINS_CORE` and `SIN_FACE` from `UNLISTED_CHAPTERS` into
   `CHAPTERS` (and both ids into `CHAPTER_IDS`), with cards, meta, story, guides and tactics, once the
   picks are made (plan §6; D-279 has the driver make the picks tonight).
8. **Not built on purpose:**
   - S-28 (Use reaching after the 2nd pull, single source).
   - Aeon Overdrive lines in the bench (the preset's aeon gauges are not full).
   - The equipment drops (S-7), and so D-270's re-equip at the top of XVIII (a recorded deviation, above).

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
