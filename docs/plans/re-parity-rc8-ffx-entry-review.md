# Paper preflight — RE parity RC8, FFX battle entry (lane FFX-L) and the Wakizashi id (lane FFX-K, slice K3)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/ffx/setup.ts,src/battle/ffx/results.ts,src/battle/ffx/adapt/entry.ts,src/battle/ffx/kernel/placement-shuffle.ts,src/data/ffx/command-records/player.ts`
> classes this as **DEEP** (FFX CTB engine is a shared system; FFX game data; checks CHK-016, 017, 021, 022, 023).
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please"; 2026-10-13 "so it can go in live builds asap";
> 2026-10-15 "keep going please, please incorporate all of your findings into our game". The wiring plan addendum marks all four rows **Bailey first: no**
> (the wiring plan addendum of 2026-10-13, a private working note outside the repository, lane FFX-L; lane FFX-K, row K3 only: K1, K2, K4 and K5 are new content and stay unbuilt).
>
> **Verdict: PROCEED** on branch `re-parity-rc8-ffx-entry`, cut from `origin/r48-rc` (`ea431aa0`). Nothing deploys without Bailey's word.

Written 2026-10-15 by the lane (a Sonnet sub-agent of the RE parity session).

## 1. Game case (AGENTS.md rule 14)

| Row | Case | Source |
|---|---|---|
| L3 Victory Overdrive on every result | **FFX only** | FFX-G10 §3.5, FFX.exe 0x007917d0 / 0x007b1540. FFX-2's battle end is FFX2-G10 and has no such hook |
| L2 the start-type draw (stream 1) | **FFX only** | FFX-G10 §3.2, 0x0078d090; FFX-2's first-attack roll is its own (FFX2-G10 rows 1 to 3 match) |
| L1 the placement shuffle | **FFX only** | FFX-G10 §3.3, 0x007842f0; FFX-2 has its own link opening (lane X2-L) |
| K3 the all-target Wakizashi id | **FFX only** | FFX-G08 D6; FFX-2 has no Yojimbo command table of this kind |

`src/battle/ffx2`, `src/data/ffx2` and `src/audio` are not touched.

## 2. What changes

1. **L3** `results.ts#buildBattleResult` runs `gaugeOnVictory` whatever the outcome (it ran only on a victory). The mode counters stay "never counts" in the engine, so the visible effect is +20 to a
   Victor-mode survivor of a non-victory (Wakka in Chapters II and III).
2. **L2** a new adapter `adapt/entry.ts#spendEntryDraws`, called from `setup.ts#buildBattle` before `seedInitialCtb`, spends one stream-1 draw (`kernel/rolls.ts#rollStartType`, argument 0x20) in every
   battle and discards the answer (`BattleSetup.condition` stays). `FfxStream.StartType = 1` joins the registry.
3. **L1** a new kernel `kernel/placement-shuffle.ts` (the link rule of the monster load and the shuffle, 0x00783680 / 0x007842f0) and the same adapter: 2n draws on the monsters' streams (28 to 35) for each
   group of n linked monsters, **after** the start-type draw and **before** the opening counters. Chapter VII (28, 28, 28, 30), Chapter XII (29 x5, 30, 31, 32) and the Gui chapter's two fights (30, 30, 30, 31).
   The engine learns the monster words of those four formations from a table in the adapter (`LINKED_FORMATIONS`), because `src/battle/**` does not import `src/data/**`; a test pins the ids.
4. **K3** `data/ffx/command-records/player.ts`: `wakizashi-multi` carries `0x30E1`; both ids are pinned in `data-ffx-command-records.test.ts`.

A one-stream generator (`SeededRng`, FF7, the advisor's forecasts, a test's scripted generator) spends none of the new draws, so every scripted sequence and every preview reads as before. The engine's game generator always does.

## 3. Acceptance cases

1. Kernel: `rollStartType` replays 864 sampled emulator vectors; `placementShuffle` replays 300 sampled emulator vectors (each draw's stream and every slot it leaves) and the 28 real formation files (only
   `mcyt06_00`, `sins03_00`, `kino02_00`, `kino03_10` draw, on the streams the note lists); hand-worked corner cases; 1,000 generated formations against an independent model.
2. Engine: for every group of every chapter (12 chapters including the hidden Gui, every link) the draws of `buildBattle` on a tapped game generator are, in order, one on stream 1, the shuffle's, the 26 opening
   draws (20..26, 27 x11, 28..35), each on its stream and each equal to the next output of an independent restatement of that stream; a preemptive or ambush start spends the first two kinds and no opening draw;
   a one-stream generator spends only the 26 it always did.
3. L3: for each of the three outcomes a Victor-mode member gains what the kernel gives for the same field (+20, nothing for Cursed, dead or Petrified), by an independent oracle; the Chapter II build through `finish`.
4. A small mutation pass over the production code: each old or wrong rule put back is caught by a test.
5. Goldens: `ffx-engine-golden` moves where the shuffle or the stream-1 draw reach it (Chapters VII, XII) and is re-baselined with the cause written in the file; `ffx2-atb-golden` and `ff7-golden` unchanged.
6. Measurement: 12 seeds on all 11 chapters and the hidden Gui chapter, before and after; 500 seeds on Chapters II, III, VII, XII and the Gui chapter (and the rest if time allows).
   Expected: **no win rate moves beyond sampling** (a re-deal of the same odds); Chapters I, VIII, IX, X, XIV, XVII, XVIII unmoved seed for seed (no draw they make moves, except L2's, which no one reads).
7. `tsc` clean, every source file under 400 lines, `node tools/orphans.mjs` shows `placement-shuffle.ts` reached and `rollStartType` now has a caller.

## 4. Base and order

`r48-rc` already holds RC7 (FFX command rules, Rikku's Mix, FFX-2 automatic abilities and menu). Order inside the lane (the addendum's): L3, L2, L1, then K3 (independent).

## 5. Risks

- **Every scripted FFX chapter test on a game generator moves** if it asserts a monster-stream value of Chapters VII, XII or the Gui chapter, and every golden that plays them; they are re-pinned once with the cause.
  A battle on a one-stream generator is unmoved, which keeps every older scripted test valid.
- **A wrong slot.** The stream of a shuffle draw is the monster's slot (`28 + slot`). The engine's slot is the index in `enemyIds`; in the three battles that is the game's slot order
  (Macalania: Guardian, Seymour, Guardian, Anima; Omnis: Seymour then the four discs; Gui: body, head, left arm, right arm). The test pins the order.
- **Stream 1 is not used by anything else.** Its only other user, the random-encounter group choice, is in no chapter. The draw has no effect other than keeping the stream where the game has it.
- **Nothing is invented.** The words and streams are from the note's census of the formation files; the stored position the shuffle also makes is read by no script and the engine drops it.
- **Save data.** No save field holds an RNG position or the Victor counter (the counters are "never counts" in the engine). Not the save-data class.

## 6. Conditions

Worktree `.claude/worktrees/re-parity-rc1` (free review worktree), branch `re-parity-rc8-ffx-entry`; stage only the lane's paths; no deploy; the handoff is `docs/handoff/re-parity-rc8-ffx-entry.md`.
