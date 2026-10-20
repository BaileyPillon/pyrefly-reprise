# The item gesture ships: FFX's orb of light and FFX-2's white-blue spark (branch `anim-orb-ship`, from `origin/r58-rc` `2a1777281` = live release 58, 2026-10-19)

Bailey, 2026-10-19, on the animation prototype's second pass: **"I like the orb toss, keep going"**, then **"i'll go with all of your recommendations"**; earlier (2026-10-18) **"no flask for items"**. Driver decisions 142, 143d, 143e and 147 (FFX-2's own gesture, from the RE session's live check of the real FFX-2).
This branch takes ONLY the item effect out of the prototype (`anim-proto-2`: the clip system, the styles and the springs stay there) and puts it in the live build, for every party member, painted or rigged.
**State:** built, unit-tested, checked in a real browser with real key presses; **not merged, not deployed, no review run.** `critic-plan --paths` classes it DEEP (the presenter is a shared system): focused review before the deploy, deep review on the live build after (`docs/plans/anim-orb-ship-review.md`).

## Game case (AGENTS.md rule 14), decided from the sources, one look per game

| | What a player sees | Source | Switch |
|---|---|---|---|
| **FFX only** | No flask. On an ally: a green orb forms over the user's hand, is tossed overhand, arcs to the target with a short trail and bursts into sparkles; the heal's own effect follows. On the user: a small glow at the hand, green motes rising around the user. **The target decides, not the character.** | `research/re-ffx-party-motion-timing.md` section 6 [M] (Steam copy, frames read) | `deps.itemGesture = 'orb'` |
| **FFX-2 only** | A short gesture; on an ally a small white-blue spark tossed in half the orb's flight (no trail, no held glow) and a white-blue sparkle burst on the target; on the user only the burst. No orb. The spell layer's green heal is not drawn for an item (the burst is its picture) and the heal flash is white-blue. | the RE session's live check of the real FFX-2 [M], driver decision 147 (the report, `D:/Tools/ffx-parity/live/` session 7, had not landed) | `deps.itemGesture = 'spark'` |
| FF7 | unchanged | not asked | none |

`BattleScreenGameDeps.presenterGameDeps` sets the switch from the chapter's game; `tests/unit/item-gesture-presenter.test.ts` runs each branch against the other game's deps.

## Where it lives (every file under 400 lines; `BattlePresenter*.ts` import no DOM and no `three`)

| File | What |
|---|---|
| `src/engine/BattlePresenterItem.ts` | The presenter's half (types and a pure table only): which gesture an `action-start` plays, its pose, how long the action waits, the call to the stage. Wired into `BattlePresenterBeats.actionStart` in four lines. |
| `src/engine/ItemGestureTable.ts` | The hand of each FFX party member (see below), the stance each takes, and the times. Pure. |
| `src/engine/ItemOrbStage.ts` | The stage's half: the hand (a rig's `fist` landmark, or the painting's anchor through `PaintedActor.paintPoint`), the target's middle (a rig lying in its `ko` key is read through the key's box), a pool of three lights. `PaintedStage` owns one (`BattlePresenterStage.ts`, +20 lines) and answers `itemStance`, `vfx.itemToss`, `vfx.itemGlow`. |
| `src/engine/fx/ItemOrbFx.ts`, `ItemOrbShapes.ts` | The light: additive sprites (a glow, a ring, a four-point star drawn once in a 64 px canvas; no file), a timeline (form, flight with an arc and a trail, burst; or the self glow; or FFX-2's spark and burst). Deterministic: no `Math.random`. |
| `src/engine/BattlePresenterPorts.ts` | Optional, additive: `BattleStage.itemStance`, `VfxPort.itemToss` and `itemGlow`, `PresenterDeps.itemGesture`. `docs/CONTRACTS.md` does not list this file, so no CONTRACT-CHANGES entry. |
| `src/engine/BattlePresenterSpellFx.ts` | `sparkItem`: FFX-2's item skips the spell layer's heal. |

## The hand, per character (how it was measured)

A rig (Lulu and Kimahri with the rig switch on, the default in release 58) follows its own `fist` landmark: the hand of the pose the rig is in or moving to, and it takes its rig's `item` key (the arm raised; no flask is in any rig part). Everyone else, and Lulu and Kimahri with `?rig=off`, is read off the painting: **each painting drawn on a grid of tenths, the hand found by eye, (u, t) = across from the left edge and down from the top (the coordinates `PaintedActor.paintPoint` takes, through the live plane, so mirror, bob and lunge come with it); good to about 0.03 of the painting; checked in the running game** (`gallery-*` below). The five painted item poses that hold a glass flask (Tidus, Auron, Lulu, Kimahri, Rikku) are not shown: those figures stand in their `idle`. Yuna's item painting (an open hand, the staff planted) holds nothing and she keeps it.

| | stance | hand (u, t) |
|---|---|---|
| Tidus | idle | 0.77, 0.13 (the gloved fist on the sword's grip at his shoulder) |
| Yuna | item (open hand) | 0.87, 0.32 (the open palm) |
| Auron | idle | 0.80, 0.13 (the gloved hand on the katana's hilt) |
| Wakka | idle | 0.80, 0.30 (above the hand under the ball) |
| Lulu | idle (rig off) / the rig's item key | 0.88, 0.47 (the hand at her belt) / `fist` |
| Kimahri | idle (rig off) / the rig's item key | 0.46, 0.60 (the fist in front of the sash) / `fist` |
| Rikku | idle | 0.62, 0.26 (the hand in the claw) |
| anyone else | idle | 0.72, 0.42 |

FFX-2 has no measured hand (a dozen dressphere paintings a girl): the spark starts at the generic spot.

## Timing (the engine is untouched; this is only how long the presenter's own `actionStart` waits)

FFX: the orb forms 300 ms and flies 420 ms, and the action holds 720 ms (on an ally) or 520 ms (on the user) where it held 380: **+340 / +140 ms an item use**, the effect's own length; the heal's effect and numeral begin as the sparkles burst. FFX-2: the spark is over inside today's 380 ms wait, **+0 ms**. At the default pace ("steady") every one of these is 1.2 times longer on screen, the effect clock is scaled the same way, and a hit-stop freezes it with the field. REDUCE MOTION and skip speed draw nothing and change the stance only.

## Tests

`tests/unit/item-gesture-presenter.test.ts` (26: every FFX party member on an ally and on themself, Phoenix Down on a KO'd ally, a group, a foe, REDUCE MOTION, skip, a stage with no hand for the figure, FFX-2's spark in the same cases, the spell layer's skip, and the gates in both directions), `tests/unit/item-orb-stage.test.ts` (25: the hand table, the hand of a painted and a rigged figure, a rig that cannot say where its fist is, the orb's timeline, arc, live target, a KO'd body, a group, the effect clock's rate, the self glow, FFX-2's spark and burst, the pool). `npx tsc --noEmit` clean; the three goldens pass; `node tools/orphans.mjs` 24, the base's.

## What is not done / what to know

- **The painted figures do not toss.** A painting cannot raise an arm: the orb is what moves. On the user the arm does not go overhead either (the game's does, per the RE note): only a rigged Lulu or Kimahri (their rig's `item` key) lift a hand. A body beat (a squash at the release) was not added; it is a one-line `actor.squash` if wanted.
- The foe case (a thrown damaging item) is not sourced for FFX: it is the same toss in an amber tone. For FFX-2 it is the same white-blue spark.
- The light is flat (additive sprites over everything, no depth, no cast shadow), as pass 2 noted.
- The camera is the build's own. The RE note says FFX-2's stays wide during an item use; with the spell layer skipped, the heal no longer hard-cuts to the target in FFX-2 (the cut lived in `awaitSpellLanding`), which matches that, but the FFX-2 shot director was not otherwise touched or checked.
- The three goldens and the unit suite: see the CHANGELOG entry; screenshots and the contact sheets of the real-input check are in `D:/Tools/pyrefly-scratch/2026-10-19/anim-pass3/orb-ship/`.
