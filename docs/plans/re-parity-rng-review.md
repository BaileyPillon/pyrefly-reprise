# Paper preflight — RE parity, each game's own random streams

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths
> src/battle/common/rng.ts,src/battle/ffx/kernel/rng.ts,src/battle/ffx2/kernel/rng.ts` classes this as **DEEP**
> (FFX CTB engine, FFX-2 ATB engine, shared combat core; all 18 chapters; checks CHK-016, 017, 020 to 023).
>
> **Owner's words.** 2026-10-08: *"It needs to be a 1:1 parity."* 2026-10-09, his pick to the question whether to adopt
> each game's own random streams: *"Adopt game streams (Recommended)"* (D-648). 2026-10-10 ~22:15 EDT: *"ill go with all
> your recommendations"*.
>
> **Verdict: PROCEED** on branch `re-parity-rng`, behind the conditions in §6. Nothing deploys without Bailey's word
> (his overnight deploy permission covered release candidate 2 only).

Written 2026-10-11 by the main session, after release candidate 2 went live (39.4.5, 2ae1a9e4).

## 1. Game case (AGENTS.md rule 14)

| Part | Case | Source |
|---|---|---|
| FFX: 68 streams, `v = mult*state ^ xor16`, `state = (v>>16 arith) + (v<<16)`, output `& 0x7fffffff`; the stream for every draw | **FFX only** | FFX.exe build 25501027; `research/re-ffx-rng-hit.md`; kernel `src/battle/ffx/kernel/rng.ts` (3,300 emulator vectors, 0 mismatches) |
| FFX-2: 68 streams, `n = mult*state*5 + add + 1`, the same shift-add step; the stream for every draw | **FFX-2 only** | FFX-2.exe build 25501027; `research/re-ffx2-hit-status.md`; kernel `src/battle/ffx2/kernel/rng.ts` (3,300 vectors) |
| Seeding from our run seed through each game's own seeding routine | each game by its own code | the RNG notes' seeding sections |
| FF7 | unchanged (mulberry32) | — |
| The adapter seam, replay plumbing, the advisor's forked generator | **both** (plumbing) | — |

## 2. What changes

Today every engine draws from one seeded stream through the draw adapters (one engine draw per kernel draw, W1 to W5).
After this batch each draw comes from the game's own stream for that purpose:

- **FFX** (from `re-ffx-rng-hit.md` and the lane notes): party members 20 + slot, aeons 27, monsters 28 and up; hit +0x10,
  status +0x20; fixed streams for Steal (10, 11), AI (2, 4, 14 to 16: `GetRandomValue` = stream 2 & 0xFFFF, the actor
  picker = stream 4), Reflect (6), random multi-hit spread (5), Overdrive hit removal (16), Wakka's reels (19), shakes (9),
  camera shot choice (14 + (n & 1)).
- **FFX camera and scene draws on stream 2** (the camera lane's finding, `D:\Tools\ffx-parity\camera\CAMERA.md` §6, to
  verify): Evrae's Guided Missiles camera shot (formation hiku15_00 w4.f8, one draw per use) and that formation's scene
  worker voice picks advance the AI stream between AI draws. Chapter VIII must count them or every later AI roll drifts.
- **FFX-2**: the stream map of `re-ffx2-hit-status.md` (per slot, plus the fixed AI, steal and reward streams).
- **Seeding**: one run seed feeds each game's own seeding routine (the notes give the routine and its constants), so a run is
  still reproducible from one number.
- **Every seeded golden and replay moves once**, in one commit per game, reason "game RNG streams (Bailey 2026-10-09)".
- **Mirrors** (`ffx/estimate.ts`, `ffx2/intent.ts`, `engine/tactics/advisor-roll.ts`) and the move advisor's forked
  generator follow, so a forecast still equals the real outcome on the same seed.

## 3. Acceptance cases

1. Each kernel's emulator vectors still pass (`tests/unit/parity-ffx-rng*.test.ts`, `parity-ffx2-rng*.test.ts`).
2. **Engine-level stream test per game:** for a few hundred generated situations, record the (stream, call index) of every
   draw the engine makes and compare with an independent table built from the notes' stream map; a mutation that moves one
   purpose to another stream is caught.
3. **Determinism:** the same seed gives the same battle twice; the advisor's forecast on a clone equals the real outcome on
   the same seed (the existing "same fight with and without the preview" tests stay green after re-pinning).
4. Goldens: `ffx-engine-golden`, `ffx2-atb-golden` and every seeded chapter test move once, each with the reason; `ff7-golden`
   unchanged.
5. `tsc` clean; every source file under 400 lines; `node tools/orphans.mjs` shows the RNG kernels wired.
6. Measurement: every chapter of both games on the shipped line, 12 and 500 seeds, before (the branch base) and after. The
   win rates should move only within the sampling band: a stream change re-deals the same odds. A chapter that moves beyond
   noise is a finding (a draw on the wrong stream, or a purpose that shares a stream in the game and not in ours), not a
   difficulty change, and is traced before the batch is called done.

## 4. Base and order

`re-parity-rng` is cut from live `origin/rel-3945` (2ae1a9e4: everything FFX up to RC2). FFX-2's engine is changing on
`origin/re-parity-rc3` (0c729fa5: W4 clock and the boss scripts, awaiting Bailey), so the lane first merges RC3 into this
branch, then does the FFX streams, then the FFX-2 streams. If Bailey declines RC3, the FFX half can be cut out cleanly.

## 5. Risks

- **Every replay moves.** Critic replays, goldens and seeded tests are re-pinned once per game with the reason; nothing else
  may move in those commits.
- **A missed draw.** A draw left on the old single stream silently shifts everything after it. The engine-level stream test
  (acceptance 2) is the guard; a draw site that has no row in the stream map is an error, not a default.
- **Save data.** `src/app/SaveData.ts` holds no seed or RNG state (checked 2026-10-11), so this is not the save-data class.
  The lane re-checks that nothing persists an RNG state elsewhere.
- **Camera stream-2 draws** are scene-side in the game; our engine has no camera scripts. Model them as counted draws at the
  points the camera note names, or list the exact Chapter VIII consequence if they cannot be placed.

## 6. Conditions

- Worktree `.claude/worktrees/re-parity-w2`, branch `re-parity-rng`; one lane; Sonnet; an independent verifier after.
- Numbers only from the RNG notes and the camera note; an unsourced stream assignment is an open item, not a guess.
- No deploy. The release path in AGENTS.md applies when Bailey says yes (DEEP: focused review before, deep after).
