# Animation prototype on Lulu's rig (branch `anim-proto`, from `origin/rig-v2` e027f779c, 2026-10-18)

Bailey, 2026-10-18 ~20:55 EDT: "The problem is some of the poses look too stiff still. I need better animation. It needs to look amazing. Do your stuff. And no flask for items and cast animation looks subpar."
Today a rig figure blends from one key pose to the next: one key an action, a linear-ish ease, nothing moving on its own. This branch is an **animation prototype**: three contrasting styles of the
same clips on Lulu (whose rig Bailey approved), recorded as short in-game videos for Bailey to pick from (end state first, `AGENTS.md` rule 9). **Nothing ships, no switch is on for players.**
Game case: **FFX** (Lulu is an FFX figure, `characters/lulu/*`); the animation system itself is shared plumbing (both games: no file in it knows which game a figure is from).

**State:** built, unit-tested, recorded; on branch `anim-proto` (pushed). Not merged, not deployed, no review run. Videos and notes: `D:/Tools/pyrefly-scratch/2026-10-18/anim-proto/` (`notes.md` first; "Videos" below).

## What a player sees

Nothing. The prototype is read from the page's query (`?anim=proto&style=A|B|C`) **only in a dev build** (`import.meta.env.DEV`; a production bundle replaces it with `false` and never reads the query), and only a
rig that has the keys the clips are made of (`idle ready attack follow cast item hurt ko victory`) gets a layer. With the flag off the actor is the rig it always was: `tests/unit/rig/rig-v1-unchanged.test.ts`
(the exact geometry golden) and the rest of the base's rig tests (276) pass unchanged, and `anim-actor.test.ts` pins "off means the ordinary move".

## The pieces (`src/engine/rig/anim/`, every file under 400 lines, strict TS, explicit `.ts` imports)

| File | What |
|---|---|
| `AnimEase.ts` | Curves exact at 0 and 1: named, a cubic bezier, `backOut(s)` (the settle), `backIn(s)` (the anticipation). Erasable TS, so a Node tool imports it. |
| `AnimClip.ts` | The timeline: a pose is a rig key, or a blend/EXTRAPOLATION of two (`mix` outside 0..1: `ready` mixed -0.12 toward `attack` is the wind-up), plus additive bone deltas, a bone subset (`only`) and a cap on how far an extrapolation may fling a bone; a segment is "move in `ms` on this curve, then hold"; marks name the moments (`contact`, `release`, `reach`...). `sampleClip` is a pure function of the clip and the time: the pose at a mark is its target to the last bit, and the first move leaves at the speed the figure had (the same carry-over term as `RigTransition`). Optional short-arc unwrapping of rotations (off by default: the gate scanned the linear path). |
| `AnimSecondary.ts` | Secondary motion at a fixed 1/120 s step from the presentation clock: residual springs on the arms, head, chest, skirt panels and train (the whip travels down the chain: forearm lags upper arm, hand lags forearm), a point spring on the doll, a Verlet braid, a `mix` 0..1, a pre-roll from rest, and a half-life spring for single-axis lag. A **residual**: at rest the pose is the authored key exactly. |
| `AnimVerlet.ts` | The braid: a position-based Verlet chain (inertia, stiffness, the figure's travel, a length constraint, an angle limit) of 4 joints. |
| `AnimCarry.ts` | A bone carried by a landmark: the doll rides her fist through every move (its offset from the fist in each key is read off the skeleton and blended with the clip's own eased progress) instead of flying a straight line while the hand swings an arc. |
| `AnimIdle.ts` | The living layer: a breath and a slow weight shift, authored amplitudes per bone, a style's hertz and gain, all sines (deterministic). |
| `AnimLibrary.ts`, `AnimStyles.ts`, `LuluAnim.ts` | The clips (ready, wind-up, strike, follow, cast, item, hurt, KO, victory, recoveries), the three styles as parameter sets, and Lulu's authored accents. |
| `AnimProp.ts` | The potion vial: painted once in a canvas (cobalt glass, bright liquid, cork, gold band, ink outline), held in her fist from `reach`, flown to the target on an arc with a spin on `release`, broken into a burst of droplets. A real scene object, drawn over the figure. |
| `RigAnimator.ts`, `RigAnimLayer.ts` | The runtime: the clip in flight, the scheduled strike, hit-stop, events, the doll carry, the smear window; and the glue to the actor (and the vial). |
| `src/engine/rig/RigSmear.ts` | A smear frame: a motion-blurred copy of the near arm's image, drawn once in a canvas, shown for two frames at the peak speed of the fastest moves (style B only). |

Touched shared files (additive; each a few lines): `RigActor.ts` (the layer: `tryClip` in `setPose`, one branch in `compose`, four beats, 399 lines; `RigAsset` moved to `RigAsset.ts`, re-exported),
`RigKeys.ts` (`RigTransition.drive`), `RigFigure.ts` (`setSmear`), `BattlePresenterPorts.ts` (three OPTIONAL `ActorHandle` members: `animBegin`, `animLead`, `animBeat`), `BattlePresenterBeats.ts` (the hooks:
a wind-up lead before the lunge, a spell's release or a vial's landing as the action's lead, a blow's beat with the camera punch the style asks for). Every hook is a no-op on an actor that does not answer it.

## How an action plays

- **attack**: `animBegin` starts the wind-up at the action's start; the presenter waits the remaining anticipation before the lunge (`animLead`); `RigActor.lunge` schedules the strike so its `contact` mark lands on the lunge's apex (`ATTACK_IMPACT`, on the same pace-scaled clock as the actor's tweens); the presenter's own `setPose('attack')` at the apex finds it running; `follow` and `idle` play their clips. A blow's `animBeat` gives the attacker a hit-stop (first and last hit only), kicks the springs and answers a camera punch.
- **cast**: gather (the doll offered low at her chest), channel (arms rise, a held beat), release (a thrust, on the style's release frame, which the presenter waits for before the spell effect and the numeral), recover.
- **item**: reach to the pouch, draw (the vial appears in her fist and rises to her ear), a beat, the throw; the vial flies to the target and the presenter waits for its landing before the heal or damage.
- **hurt / KO / victory**: recoil and settle; stagger, buckle, fall on a gravity curve, a bounce; a dip, a flourish (the doll held up), the painted victory.
- Everything runs on the actor's own dt scaled by the pacing option's rate (like its one-shot moves): a hit-stop of the whole picture (dt 0) freezes it; the battle engine is untouched; nothing reads a battle timer.

## Run it

```
# the recordings (headless Chromium, 1600 x 900, a virtual 60 Hz clock; refuses while REVIEW-BROWSER exists; Vite stopped by PID)
PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject lulu --out <dir> --modes anim --variants today,A,B,C --alias lulu=lulu-v2 --wait
node tools/rig/lane/anim-assemble.mjs --in <dir> --out <final dir>        # mp4s, 2x2 comparisons, contact sheets
node tools/rig/lane/anim-preview.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --subject lulu --style B --clip strike --from ready --out sheet.png   # a clip as a colour sheet, no browser
node tools/rig/lane/anim-timings.mjs --rig D:/pyrefly-art-rigs/lulu-v2 > timings.md                                                         # every clip's segments, marks and frames
```
By hand: a dev server with the rig served as `lulu` (`tools/vite-rig-art.mjs`, `RIG_ART_ALIAS=lulu=lulu-v2`), the hidden chapter by the door word `mushroom`, `?rig=on&anim=proto&style=B`.

## Tests

`tests/unit/rig/anim-clip.test.ts` (curves, poses, the sampler, exact marks and the hit frame), `anim-secondary.test.ts` (stable and bounded springs, the fixed step, the residual is zero at rest, drag, the braid, the idle), `anim-library.test.ts`
(the three styles; every clip on Lulu's real rig and on a bare rig; the leads), `anim-animator.test.ts` (the strike on the apex, events, the smear), `anim-actor.test.ts` (off by default; on, the clip plays; the beats; determinism).
Counts: 5 new files, 74 tests; the whole rig set (`tests/unit/rig`, `tests/unit/tools/rig-*`) is 350 tests in 31 files, all passing. `npx tsc --noEmit` is clean. `node tools/orphans.mjs`: 26 orphans, the same 26 as the base (the new modules are reachable).
`node tools/critic-plan.mjs --paths <the presenter hooks>` classes the change **DEEP** (`BattlePresenterBeats.ts` and `BattlePresenterPorts.ts` are the shared presenter system; `RigActor.ts` and `RigKeys.ts` the rig engine); nothing ships from this branch without Bailey's pick and the review that class owes.

## Videos

`D:/Tools/pyrefly-scratch/2026-10-18/anim-proto/final/`: `style-A.mp4`, `style-B.mp4`, `style-C.mp4`, `today.mp4`, `compare-cast.mp4`, `compare-item.mp4`, `compare-attack.mp4`, `contact-{today,A,B,C}.png`; `timings.md`, `notes.md`; `sim/` (the no-browser simulation); `rec/` (the raw frames and `segments.json`). The recordings are the real game (hidden Sinspawn Gui chapter, door word `mushroom`), 1600 x 900 at 60 fps from the kit's recorder (`record.mjs --modes anim`), one session a variant, the same script every time: attack, cast and item are real key presses through the real presenter; victory, hurt and KO are the actor calls the presenter makes (`setPose('victory')`; `flash`, `shake`, `recoil`; `setPose('ko')`), so no foe has to hit her; the party's HP is set to full before each of her turns (the one debug write). At the game's default pace ("steady", x1.2 on FFX) every clip and every presenter wait is 1.2 times its base ms.

## What is NOT done and what to know

- Only Lulu has authored accents; any rig with the nine keys gets the procedural set and keeps its own idle and chains (`genericOf`), but it is untried on a second rig.
- FFX-2 was not run (its ATB and Active mode call the presenter differently, and a dressphere's `cast`, `item` and `ko` fall straight to the idle, D-179, which the clips do not honour yet): the presenter's waits would apply to both games, so FFX-2 needs its own case (AGENTS.md rule 14).
- The styles lengthen an item (A +0.4 s, B +0.9 s, C +1.5 s) and an attack (+0.1 to 0.4 s): a pacing decision for Bailey, see `notes.md`.
- The lattice warp (a rippling skirt), a painted smear and the mocap retarget of the research notes are not built (the lattice and the mocap wait for the pick).
- The `ActorHandle` members `animBegin`, `animLead` and `animBeat` are optional and additive; no other actor answers them. `docs/CONTRACTS.md` does not list `BattlePresenterPorts.ts`, so no `CONTRACT-CHANGES` entry was written.
- See "What still looks wrong" and the recommendation in `notes.md` (B's look on A's clock for the actions that repeat).

---

# Pass 2 (branch `anim-proto-2`, from `anim-proto` cfff4367d, 2026-10-19): "B's look on A's clock"

Bailey took the pass-1 recommendation ("I'll go with all of your recommendations"). Still a PROTOTYPE: dev flag only (`?anim=proto&style=P2`), nothing ships, nothing merges, no deploy. Game case: **FFX** (Lulu; the frame counts are FFX's `c006` motion set, `research/re-ffx-party-motion-timing.md`); the clip system, the hold, the light and the recorder are plumbing for both games (no file but `AnimRE.ts` and `LuluAnim2.ts` knows which game a figure is from). Pass 1's styles A, B and C are unchanged (`?style=A|B|C` plays them as before; the vial is theirs).

## What changed, per item

| # | Ask | What is built |
|---|---|---|
| 1 | B's look on A's clock, start -> looping hold -> release, the game's frames | `STYLE_P2` is B's shapes (anticipation, overshoot, stretch, springs, braid, camera punch) with durations from the game's own frame counts at 30 fps (`AnimRE.ts`; `AnimLibrary2.ts` builds every clip from them). A clip segment may carry `sustain` (`AnimClip.ts`): its `hold` is the shortest stay, the pose then swings from the segment's pose to a second pose and back every loop period (the game's `_01` clip), and `RigAnimator.keepHolding(true)` keeps the clip there until `release()` (or 9 s): the engine can hold a cast until its effect resolves (`AnimHold.ts`). |
| 2 | Item: no model | There is no vial, bottle or prop in P2. An ally: a green orb of additive light rises from the raised hand as the clip's glow level grows, the arm cocks back and tosses overhand, the orb arcs to the target with a trail and bursts into sparkles on it (`AnimFx.ts`). The user: no orb, glow particles rise around her at the release. The presenter waits for the orb's landing before the heal. |
| 3 | Cast | gather (the doll offered low) -> rise -> HOLD (a growing glow at the doll, orbiting sparkles, a swing that lifts her and flares the skirt so the springs lift the robe and the hair) -> draw in -> a sharp thrust (smear, camera punch) -> the glow flashes out with a ring on the release frame -> follow-through. Cast type 1 by default (`?cast=2`, `?cast=3` for the others; which spell uses which type was not read). |
| 4 | Knees | A hurt and a KO bend the knees (the pelvis sinks, the skirt bunches, the spine folds) and the KO folds into the KO key as ONE gravity curve; its lowest point is on the floor (re-measured by the tests: within 50 px of `baselineY` every frame) and her feet are pinned from the first blow to the end of the kneel (`tools/rig/lane/anim-measure.mjs`). The rig has no leg bones: the knees are the pelvis and the skirt. |
| 5 | Framing | The recorder's `anim2` mode puts the battle camera on its own rig and FREEZES it (every move the presenter asks is answered and ignored; the shake and the punch still play), 1280 x 720 at a pixel ratio of 1.5, so Lulu is 446 to 501 px tall from her head's centre to her feet (about 490 to 550 with the top of her head) in the 1280 x 720 videos, and the contact stays in frame (the game's impact cut no longer leaves her). |
| 6 | Hit-stop | weak 30 ms, strong (a crit, an overkill, a capped blow) 80 ms, first and last hit of a strike only; the contact lands on the game's frame (hit frame 20: the wind-up is 20 frames less the strike's own 255 ms run-up, which is the lunge's apex). |

## The presenter's three new hooks (optional and additive, `BattlePresenterPorts.ts`; every one a no-op on an actor that does not answer)

`animBeat(kind, hitIndex, hitCount, heavy)` (a strong blow holds longer), `animLead('end')` (pass 2 only: what is left of the clip's end signal; `BattlePresenterBeats.actionEnd` waits for it before it sends the actor home, as the game does: ATTACK2's end signal is frame 54 of 60, a cast type 3's is 70 frames after its hit), and the item's target (`animBegin`'s points: the user is told from an ally by being within 0.6 units).

## Run it

```
node tools/rig/lane/anim-sim2.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --out <dir>      # no browser: the real animator over a flat stage
node tools/rig/lane/anim-timings2.mjs --rig D:/pyrefly-art-rigs/lulu-v2               # every clip in the game's frames and seconds, next to the game's counts
PYREFLY_BROWSER=gpu node tools/rig/lane/record.mjs --subject lulu --out <dir> --modes anim2 --variants today,B,P2 --alias lulu=lulu-v2 --width 1280 --height 720 --dpr 1.5 --wait
node tools/rig/lane/anim2-assemble.mjs --in <dir> --out <final dir>                   # pass2-<action>.mp4, compare-<action>.mp4 (today | pass 1 B | pass 2), contact-<action>.png
```

## Tests

`tests/unit/rig/anim-pass2.test.ts` (the game's clock, the hold track, every clip's frame counts on Lulu's real rig, the KO's floor and feet), `anim-pass2-play.test.ts` (the animator: a kept-open hold and its release, the self/ally item, the strike on the apex, `lead('end')`, the two hit-stops), `anim-fx.test.ts` (the light's state machine, and through the real actor). `tests/unit/tools/rig-lane.test.ts` knows the `anim2` mode. `npx tsc --noEmit` clean; every file under 400 lines; `node tools/orphans.mjs` still 26 (the base's).

## Not done / what to know

See `D:/Tools/pyrefly-scratch/2026-10-19/anim-proto-2/notes.md` (what still looks wrong, with the videos). FFX-2 was not run (its ATB calls the presenter differently; a dressphere's `cast`, `item` and `ko` fall straight to idle). `critic-plan --paths` still classes the presenter hooks DEEP: nothing ships from this branch without Bailey's pick and the review that class owes.
