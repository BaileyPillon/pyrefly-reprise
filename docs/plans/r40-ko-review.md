# r40-ko: how a KO plays, and the revive that mirrors it (paper preflight, rule 15 style)

Date 2026-10-10. Lane L2 of the visual and feel pass (`D:/Tools/pyrefly-scratch/2026-10-10/visual-feel-pass/plan.md`, items 3, 4 and 8: FA-1, FA-2, FA-3). Branch `r40-ko`, from `r40-blend` 1ac44a91 (L1's exported capped KO cross). No browser was used: the measuring comes later.

Authority, Bailey 2026-10-10: "I want a pass going over visual and feel ..."; at about 18:05 "I'll go with all your recommendations", which accepted P1-B on the Motion Options page: fall, puff, land, with dust, and a revive that mirrors the fall; REDUCE MOTION and the Steam capture take the page defaults.

## Game case (rule 14)

Both games, one shape. The sources are silent on a KO's pose and blend in both games (`research/status-display.md` 97 and 144 say "unsourced"; `ffx-vs-ffx2-presentation.md` 297, a single source, says FFX plays a KO animation a character can leave by getting up). The only per-game number is the buckle's tempo, 220 ms FFX and 170 ms FFX-2, which `living.ts` already had (VP-1001-49, `[ours]`). Every other duration and shape here is `[ours]`. Nothing is FFX-only or FFX-2-only.

## The three items, in the order they ship (one commit each)

1. **FA-1, a defect fix.** A KO painting that does not lie down crosses over instead of cutting. `LivingFigure.onSetPose` forced `crossfadeMs = 0` for every KO, held the standing painting for the buckle and flipped in one frame; it also took a plain cut when the standing painting was itself flagged prone (`from.scale.prone`: Vegnagun's tail, Overdrive Sin, Sin fins: the 807 and 513 px jerks of round 23). Now `KoFall.koMode` decides: `buckle-cross` (the same buckle, then the capped cross: the page's option X, shown on Anima and a Yu Pagoda), `cross` (no buckle: a prone standing painting, and REDUCE MOTION), `flip` and `cut` (a KO with no painting of its own: two layers of one painting would dim for a moment, and `KoFallback` lays that figure down).
2. **FA-2, P1-B.** `topple` mode: a party character (party side, not in `KO_GIANTS`, `KO_AEONS` or `KO_MACHINES`) whose KO painting is a lying body: the standing painting tips about its toe edge toward the side the KO painting's head lies, slides so the two bodies' centres meet, the cross (75 ms, capped) runs under a dust puff, and the landing squash and shake follow at 300 ms as before. A per-slot tip survives the head lock's per-frame `sizeSlot` through a seam in `PaintedActor.placeSlot`.
3. **FA-3.** The revive mirrors the fall: the lying painting crosses to the standing one already toppled, which stands up over 320 ms from the floor pivot under a smaller puff. 395 ms in all, inside `TIMING.revive` (520), so the presenter's wait and the menu are unchanged.

## Where this differs from the plan text, and why

- **The buckle stays for a standing KO painting** (the plan's FA-1 test said "no hold"). The Motion Options page, which Bailey saw and answered, shows Anima and the pagoda with "the same buckle, then the 75 ms capped cross"; the buckle is the existing look and the cross replaces only the cut.
- **REDUCE MOTION is a short cross, not a cut** (the plan said "still cuts"). The brief and Bailey's acceptance say the page default, and the page's `RMcross` is a 75 ms capped cross with no buckle, no tilt, no shake and no puff. (The page's own recommendation text said "stays a cut unless you say otherwise"; the lane brief says cross, and the brief wins.) The landing squash still plays, as on the page.
- **The topple is for party characters only.** Foes, colossi, summoned aeons (`KO_AEONS`, `KO_GIANTS`), machines and statues whose KO painting lies take `buckle-cross`. The page showed the topple on characters only, and a plane the size of a colossus swinging 80 degrees about its feet is a look nobody has seen.
- **The pivot is the toe edge, not the stance, and there is no lift.** Pivoting about the stance dips the fall-side feet under the floor and the page lifted the figure by a mask-measured amount; the engine has no mask at KO time. Pivoting about the front-most near-floor point of the underside hull (`PoseMeta.ground`, measured for every painting) never sinks a boot, and needs no lift. A figure with no hull pivots about its stance.
- **The slide aligns content-box centres**, where the page picked the slide by mask overlap. Approximate; to be tuned in the capture lane.
- **The cross runs on the real clock** (`updateLivingScene(fieldDt, dt)` -> `MaxMix.update(dt, realDt)` -> `LifeCtx.realDt`), as FB-1 does for the pose blend; the buckle and the rise run on the field clock, so a hit-stop still holds them.
- **No `QuadField` change.** `QuadField` is a wrapping ambient field, not a one-shot emitter (its puffs repeat on a seeded phase); a one-shot needs its own clock. The puff is six CPU-driven quads (`KoPuff.ts`) with the page's numbers; no shader was written blind.

## Shared systems touched, risks, rollback

- `PaintedActor.ts`: three small seams in the regions the plan assigns this lane (`placeSlot`, the fall tilt in `update`, two public methods), no change to `setPose` or `update`'s signature (L1's hunks). `living.ts` is this lane's alone. `BattleScreen.ts`, `LivingPaintings.ts`, `MaxMix.ts`: the real frame time handed down, three one-line signature changes with a default.
- The head lock: rotation preserves area, but the plane moves lower and so farther from the camera, so the lock's factor follows the turn (1.07 at most for the hurt painting at the test camera); `ko-fall-actor.test.ts` checks the head size through the real `PaintedActor` and the probe's corner maths (within 1.1 percent in every frame, the two planes of the swap frame equal to 0.01 percent). The reference plane (the idle) was never held; a TIPPED reference plane is now (`PaintedActor.lockHead`, one condition), so a revive's toppled idle meets the lying body's held head.
- Rollback: `?kofall=off` plays the KO as before FA-1 (the buckle and a cut) and the revive as before FA-3 (the actor's own blend), for a same-build A/B capture. No contract file changes shape.
- Looks that cannot be judged here: the toppled plane's pose at its last frame, the puff over the cross, the revive's first frames. The main session reads the strips after the capture lane runs.
