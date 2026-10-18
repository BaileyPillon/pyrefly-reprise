# Paper preflight: RC9 lane FFX-B, the Overdrive results (FFX only)

Written before the build (AGENTS.md rule 15; `critic-plan` classes the engine folder as deep). Branch `re-parity-rc9-ffx-od-results`, cut from the tip of
`re-parity-rc9-ffx-overdrives` (`1c21857eb`, lane FFX-A: the controllers and the `frame` field of the result). Plan: `wiring-plan-draft-2026-10-11.md` lane FFX-B
(rows B2, B3, B4; B1 and B5 landed in RC4) and the addendum; note `FFX-G01` sections 3, 4.1, 5, 10 (rows 17, 22, 22b) and 12 (open questions 4 and 10), and
`FFX-H01` section 3.5 (which closes open question 10).

**Game case (rule 14): FFX only.** Swordplay and Bushido (the moves with a result row and a timing factor) do not exist in FFX-2. Nothing under
`src/battle/ffx2`, `src/data/ffx2` or `src/audio` is touched; `ffx2-atb-golden` and `ff7-golden` are not affected. No file of `docs/CONTRACTS.md` is touched
(`TimingBonus` is an FFX-internal type in `adapt/hit.ts`); no boss number and no party number changes.

## The three rows, and what gates each

| Row | What the game does | Gate | Can the harness settle it now? | Plan |
|---|---|---|---|---|
| **B2** the Fail rank | The user's recovery is the **menu command's** rank whatever the grade: the rank is stored in `Chr+0xDE8` when the action is first calculated (`0x7892E0`), the result handler (`0x7AFE00`) never writes it, the action-done call (`0x7B20E0`) pays it. Tornado and Blitz Ace cost 7 on a Fail; the engine charges 6 (`failRank: 6` in the two records). | `FFX-G01` open question 10: nobody had run the rank store and the delay. | **Yes, and it has been**: `FFX-H01` section 3.5 ran `0x7892E0` -> `0x7B0470`/`0x7AFE00` -> `0x7B20E0` on the real code (2,400 end-to-end vectors, 770 of them Fail grades, 0 mismatches). This lane re-runs that chain from its own seed and exports 476 vectors of it as a fixture. | Build. Drop `failRank`; a Fail row carries the menu row's rank. |
| **B3** the timing factor from the frame | `A` and `B` are float32 **seconds**, `A = float32(B - frame / 30)`; about 1 percent of (instant, damage) pairs differ by one point from the engine's float32 milliseconds. | The `frame` field of the result (lane FFX-A, landed). | Nothing to settle: the arithmetic (`0x78BD90`, 92,400 vectors) and the timer (`0x891AC0`) are proven. This lane exports the timer and the override chained, every frame of every limit (267 frames x 64 damages), from the real code. | Build. `timingBonusFrom` hands the hit pipeline `A` and `B` in float32 seconds for Swordplay and Bushido; Wakka's reels keep their milliseconds (what his script passes is unread). |
| **B4** which hits the factor reaches | The factor reaches only the hits the result handler recalculated: all hits of the three Swordplay moves started before the animation (the engine matches); for Blitz Ace only the last pending hit [I]; for Bushido it depends on where the controller starts. | `FFX-G01` open question 4: where the Blitz Ace and Bushido controllers start in the animation. The start gate `0x7AFC90` admits only categories 0x20, 0x25, 0x30 and 0x40; the other controllers are started by the animation script through the script native `0x7AFD30`. | **No.** The harness runs functions of the exe over a world it builds. The start point is a property of the animation scripts (the order of the hit-apply natives and the minigame starter inside Tidus's and Auron's action scripts, which are data inside the install's character and magic archives, in a container whose layout nobody has read), not of any function. `audit-round2.md` (FFX-H07) classes it "a play or script read". | **Not built.** The reach stays as it is (every hit of the ability); the lane measures what the change would cost Blitz Ace and discloses it. |

## What changes

| Change | Where |
|---|---|
| B2: a Fail row keeps the menu row's rank; `failRank` is gone from Blitz Ace and Tornado | `overdriveShape.ts#rowFromExtra`, `data/ffx/abilities/overdrive-tidus.ts`, `overdrive-auron.ts` |
| B3: `TimingBonus.scale` (the game's `A` and `B` as float32 seconds), built by `timingBonusFrom` from the controller's frame (or, for a result that carries none, from its milliseconds); read by the hit pipeline | `adapt/hit.ts`, `overdrive.ts`, `kernel/minigame-timer.ts#timingScale` |
| B4: nothing (a comment where the finisher shares the timing, naming the gate) | `execute.ts` |
| Vectors | `tests/fixtures/parity/ffx/overdrive_rank.json`, `overdrive_scale.json` (from the real code in the Unicorn harness) |

## Acceptance

1. The two fixtures are real runs of the game's code; the engine's rank, recovery and scaled damage equal them for every vector (a test per row).
2. An engine-level test with oracles typed again from the note (the menu ranks, the seconds), a mutant list of the old rules that the same comparisons catch, and a mutation pass of about 20 one-rule faults of the production code.
3. Goldens: only what a changed number can reach moves, with the cause written next to each digest. 12 seeds on every FFX chapter and 500 on the chapters whose shipped line fires a Swordplay or Bushido move, against the lane FFX-A tip, with causes by ablation.
4. The whole suite once.

## Risks

- The shipped lines fire only Spiral Cut, Energy Rain, Dragon Fang, Shooting Star and Banishing Blade (never Tornado, Blitz Ace or Slice and Dice): B2 cannot move a chapter, and B3 moves a log only where a headless instant is a whole millisecond whose float32 second differs by a point (about 0.1 percent of timed hits). Both are reported as measured, not argued.
- The headless stand-in (`rollDefaultMinigame`) rolls whole milliseconds, not frames. It keeps its draws (same count, same order, same stream); only the unit its number is read in changes.
- Blitz Ace's total will drop when B4 is built (only the last hit scaled); the lane reports by how much, from the engine, so the later decision is made on a number.
