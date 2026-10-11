# r40-ko: how a KO plays, and the revive that mirrors it (FA-1, FA-2, FA-3)

Branch `r40-ko` (worktree `D:/pyrefly-r40-ko`), from `r40-blend` 1ac44a91. Date 2026-10-10. Lane L2 of the visual and feel pass
(`D:/Tools/pyrefly-scratch/2026-10-10/visual-feel-pass/plan.md` items 3, 4, 8). Paper preflight: [r40-ko-review](../plans/r40-ko-review.md).
**No browser, no server, no Playwright was used. Nothing here has been looked at on a screen.** The numbers below are from unit tests that read the real
`PaintedActor` through the continuity harness's own maths; the strips are the main session's to read after the capture lane runs.

Authority, Bailey 2026-10-10: "I want a pass going over visual and feel ..." and at about 18:05 "I'll go with all your recommendations", which accepted P1-B (fall,
puff, land with dust; a revive that mirrors the fall; REDUCE MOTION and the Steam capture take the page defaults).

**Game case (rule 14): both games, one shape.** The sources are silent on a KO's pose and its blend in both games (`research/status-display.md` 97 and 144 say
"unsourced"; `ffx-vs-ffx2-presentation.md` 297, a single source, says FFX plays a KO animation a character can leave by getting up). The only per-game number is the
buckle's tempo, 220 ms FFX and 170 ms FFX-2, which `living.ts` already had (VP-1001-49). Everything else is `[ours]`.

## What is built (four commits)

| Item | Commit subject | What it does |
|---|---|---|
| FA-1 | KO COLLAPSE: a KO painting that does not lie down crosses over instead of cutting | `KoFall.koMode` decides; a standing KO painting buckles then crosses (75 ms, the capped curve); a standing painting already flagged prone (`from.scale.prone`: Vegnagun's tail, Overdrive Sin, Sin fins) crosses at once instead of the plain cut; REDUCE MOTION stays a plain cut (corrected, see "Correction" below); a KO with no painting of its own keeps the buckle and the flip. |
| FA-2 | KO COLLAPSE: the topple | A party character (not an aeon, a giant, a machine or a statue) whose KO painting lies tips the standing plane about its toe edge toward the side the KO painting's head lies (80 degrees, `KoTip.ts`), slides it so the two heads meet, crosses under a dust puff (`KoPuff.ts`), then the landing as before. |
| FA-2 refined | KO COLLAPSE: the topple turns through the buckle AND the cross and meets the lying body at the head | Found by measuring twelve characters in both tempos: the turn and the slide run on one clock over the whole fall, and the standing plane slides until its head meets the lying painting's. (Its commit message says "48 falls"; it is 24 falls and 24 revives: twelve characters, two tempos.) |
| FA-3 | The revive mirrors the fall | The lying painting crosses to the standing one already toppled, which stands up over 320 ms from the floor pivot, under a smaller puff; 395 ms in all, inside `TIMING.revive` (520), so the presenter's wait and the menu are unchanged. Foes, aeons and giants cross without travel; REDUCE MOTION plays no run of ours (the actor's own blend, as before FA-3). `PaintedActor.lockHead` now also holds a TIPPED reference plane (the idle toppled on the floor), so its head meets the lying body's held head. |

New files: `src/engine/KoFall.ts` (pure: the mode table, the clock `KoRun`, the puff's numbers, `?kofall=off`), `src/engine/KoTip.ts` (pure geometry, `SlotTip`),
`src/engine/KoPuff.ts` (six CPU-driven quads). Seams: `PaintedActor.placeSlot` (`slot.tip`), `PaintedActor.tipSlot`, `PaintedActor.fallGain`; `living.ts` drives it
all; `LifeCtx.realDt` is handed down by `BattleScreen` -> `updateLivingScene(fieldDt, dt)` -> `MaxMix.update(dt, realDt)`.

**The clock.** The buckle, the topple and the rise run on the field clock (a hit-stop holds them); the cross runs on the REAL clock (a hit-stop never freezes a half-mixed
pair of paintings, the lesson of FB-1). The cross is the capped curve `PoseBlend.KO_CROSS`: the plane going out 1 - s, the plane coming in s squared, the lesser never above 0.382.

## Where it differs from the plan text (each one is a judgement; say so if you disagree)

- A standing KO painting keeps the buckle before its cross (the plan's FA-1 test said "no hold"); the Motion Options page, which Bailey answered, shows "the same buckle, then the 75 ms capped cross".
- **Correction (r40-int fixer, 2026-10-11): REDUCE MOTION stays a plain cut, as the plan said.** This lane first built a short cross and called it "the page default"; that was false. The Motion Options page recommends "REDUCE MOTION stays a cut unless you say otherwise" (line 214); its sub-question says "Today the KO is a plain cut to the lying painting. The plan keeps that. The alternative is a short fade that moves nothing"; the tile P1-RM-cut ("Keep the cut") is today's behaviour and P1-RM-cross carries no recommendation flag. Bailey took "the page defaults", so the default is the cut. The short fade is a question the page asked and he did not answer: it is not built, and if he wants it, it is a one-line change in `KoFall.koMode` (`rm` returns `cross` again). The revive under REDUCE MOTION is the actor's own blend again, as before FA-3 (the page never asked about it). The landing squash is the actor's own and plays as it always did.
- The topple is for party characters only. Foes, colossi (`KO_GIANTS`), summoned aeons (`KO_AEONS`), machines and statues (`KO_MACHINES`) whose KO painting lies take buckle-then-cross. The page showed the topple on characters only.
- The turn is the page's quadIn softened to half quadIn, half linear (`toppleEase`), and it, and the slide, run on one clock over the buckle AND the cross (a revive's over the cross and the rise): a pure quadIn over the hold alone swung a head 47 to 70 px in its last frame, and with the heads far apart the fade-weighted head read a jerk event (Tidus, 52 px at the first cross frame). The feet slide at most 19 px a frame (the plan's bound is 24).
- The pivot is the toe edge (the front-most near-floor point of the underside hull) and there is no lift; the slide aligns the two heads (the registered head boxes; the content-box middles when a painting has none). The page lifted by a mask-measured amount and chose the slide by silhouette overlap.
- No `QuadField` change: it is a wrapping ambient field, not a one-shot emitter.

## Numbers (unit tests, real `PaintedActor`, the harness's own maths at 1600x900, a camera 3 up and 8 back = 213 px to the world unit, synthetic masks)

Twelve characters (Tidus, Yuna, Auron, Kimahri, Lulu, Wakka, Rikku and her Thief and Gunner, Yuna's Gunner and White Mage, Paine's Warrior), each in both tempos, fall and revive (48 swaps),
through `analyzeSwap`, `figureTrack` and `detectJerks` with `critic/policy.json`'s thresholds:

| Measure | Fall FFX (220 ms) | Fall FFX-2 (170 ms) | Revive (both) | Bound |
|---|---|---|---|---|
| snaps, hard cuts | 0, 0 | 0, 0 | 0, 0 | none |
| blend frames (both planes over 0.02) | 4 or more | 4 or more | 4 or more | 2 or more |
| ghost severity, worst of 12 | 0.372 | 0.372 | 0.333 | under 0.40 |
| head ratio through the two planes of the swap frame | 1.0000 | 1.0000 | 0.9999 to 1.0000 | within 3 percent |
| jerk events (`detectJerks`) | 0 | 0 | 0 | none |
| biggest single step of the tracked head, worst of 12 | 47 px | 55 px | 49 px | the plan's stricter 40 is not met by all |
| feet slide per frame (linear: the whole slide over the frames of the run) | about 12 px | about 15 px | about 10 px | at most 24 (asserted for the fall) |

The biggest step is the turn at its fastest (the head swinging down or up). The harness reads it as no jerk because it is a ramp and not a pop, but the plan's own unit-test line
("no track step of 40 px or more") is met by 13 of 24 falls (8 of 12 in FFX, 5 of 12 in FFX-2) and 8 of 12 revives (a revive is the same in both games), not all. The camera has 213 px to the world unit; the options page's inferred game number is 227.
The head size through the turn is within 1.1 percent of the idle's in every frame for Tidus and Yuna (the plan said 1.0). The ghost severity uses synthetic masks at an overlap far
below the real pairs, so it is a worst case; the cap makes 0.382 times (1 - overlap) the most it can be.

## What the capture lane must look at (it is the only thing that can say whether it is right)

1. The toppled standing plane's last frame against the lying painting: the heads are aligned by construction, so look at the legs (the toppled plane is up to 1.25 times as long as the lying body) and at how high the toppled body's back is over the floor (the plane is turned, not squashed).
2. The puff over the cross: its size, its colour, whether it reads as dust, whether it draws over the figure and under the HUD (render order 12, z +0.3, depth test on).
3. The revive's first frames: the toppled plane appears where the lying body was. If a `ProneLay` shift is set the body jumps by it when the figure is no longer prone (the same jump the old revive had).
4. The buckle leaning the way the body falls (it leaned forward before).
5. Same-build A/B with `?kofall=off` (the old KO and the old revive) for the strips.
6. The harness chapters of the plan: seymour-flux, yunalesca, ffx2-vegnagun-shuyin, sin-face, ffx2-bahamut, then braskas-final-aeon, ffx2-fallen-aeons, ffx2-trema: snaps into KO 0, snaps a minute at most 0.25, no KO-caused jerk of 40 px, CHK-026 still PASS.

## Not done, and why

- The records: `docs/target/targets.json` tile, the decision and action ledger rows, NOW.md, CHANGELOG (FFX and FFX-2 tag), the CONTRACT-CHANGES entry (none needed: `PaintedActor.ts` is not a listed contract file). They collide with the other lanes' edits and are the driver's.
- The Steam HD capture of a real KO (option in P1): asked first, never taken.
- A topple for foes, colossi and aeons that lie: needs a look at one first.
- Option D (a painted fall frame per member): new art, not without Bailey's yes.

Suggested CHANGELOG line (both): "A knock-out no longer cuts. The figure buckles, a standing party member tips over toward the side the lying painting's head is on, the two paintings cross over under a puff of dust, and a revive plays it back, standing up from the floor. REDUCE MOTION keeps the plain cut."
