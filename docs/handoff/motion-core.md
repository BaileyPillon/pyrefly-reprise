# Motion core (conference demo motion pass, lane "core")

Bailey, 2026-10-22 ~00:10-01:30 EDT: "The motion and animations need to be top notch, even above visuals (in the static sense)." and "Pose continuity needs to be tight. It needs to be impressive."
His picks for this lane (the full list is in the driver's brief): the full motion pass (anticipation, arcing lunge and back, subtle squash-and-stretch, recoil-and-recover, cast lift,
overshoot settle, eased, smooth at 120 Hz or more), "Snappy, about 1.1 s", each game's own path and return, the shadow that follows, REDUCE MOTION turning off "Shake, punch, freeze, rumble"
only, demo chapters first.

Branch `motion-core` (from `origin/main` 3e520971e, release 61 + records). Tree `D:/pyrefly-anim-proto`. Step 1 of 3 (CURVES) is built here; steps 2 and 3 are not.

## What step 1 is

ONE pure, sampled timeline for a physical attack replaces the chained tween legs of `PaintedActor.lunge` (x only; no anticipation, no arc, no overshoot; each leg boundary dropped the
previous leg's leftover frame time), plus the pieces around it.

| Piece | File | What it does |
|---|---|---|
| The switch | `src/engine/motion/CurvesSwitch.ts` | `?curves=new\|today`, the shared `?pack=demo`, the chapter gate (`seymour-flux` FFX, `ffx2-bahamut` FFX-2). **Default today**: with no address key and in every unit test the live game is unchanged. |
| The strike curve | `src/engine/motion/StrikeCurve.ts` | Pure. `sampleAt(shape, phase, ms)` / `sampleStrike(shape, t01)` answer `{x, lift, sy, lean}` (x a share of the distance, lift a share of the height, `sx = 1 / sy`); `strikeMarks` / `strikeMarkFractions` name `windupEnd`, `travelPeak` (the fastest frame before contact), `contact`, `holdEnd`, `settlePeak` (the fastest frame of the way home), `end`. The two profiles (`PROFILES.ffx`, `PROFILES.ffx2`), `resolveStrike`, `heftFactors`. |
| The clock | `src/engine/motion/StrikeRun.ts` | Walks a shape on accumulated PACED time (`dt * 1000 * paceRate('action')`; zero in a hit-stop). Three phases (`pre` to contact, `hold` until the blow releases it and at least the profile's hold, `post` = return + settle). `on(mark, fn)` schedules on a mark; leftover frame time carries across phases; a strike begun over another folds the old pose out over 120 ms. |
| The channels | `src/engine/motion/CurveDriver.ts` | Sums strike + cast lift (`LiftChannel`) + leaps (`LeapRun`) into `{x, lift, sy, lean}` for `PaintedActor.update`. |
| The recoil | `src/engine/motion/RecoilCurve.ts` | "Knock-back + flash": a short push (0.3 of today's distance, thinner for a heavy body), 70 ms eased, then ONE small overshoot (13 percent), rest exactly 0. The white flash is the existing `DemoHitBeat.blowFlash`. |
| Actor helpers | `src/engine/motion/ActorCurves.ts`, `StrikePlan.ts` | `startStrike`, `squashPair` (the subtle family), `heftOf`. |
| Presenter helpers | `src/engine/motion/CurveBeats.ts` | `startAttackMove` (today's `lunge` + `squash(260, 0.45)`, or `actor.strike(plan)`), `liftCaster` / `releaseCastLift`, `arcFor` (FFX-2's run-in leap). |
| Wiring | `PaintedActor.ts` (+36 lines), `BattlePresenterBeats.ts` (398 lines), `BattlePresenterSpellFx.ts`, `ContactBeat.ts`, `StrikeBeat.ts`, `BattlePresenterSfx.ts`, `BattlePresenterPorts.ts` (optional `ActorHandle.strike/liftTo/liftRelease/leap`: not a CONTRACTS.md file), `BattleScreen.ts` (names the chapter), `BattleScreenRunIn.ts`, `src/debug/curvesApi.ts`, `main.ts` | |

## Switches (all default OFF)

- `?curves=new` or `?pack=demo` turns the curves on, **only in Chapter I and Chapter IV**; `?curves=today` wins over the pack (A/B captures). Every other chapter is unchanged whatever the address says.
- `window.__pyrefly.curves('new' | 'today')`, `.curvesChapter(id)`, `.curvesOn()`, `.strikeMarks(game, distance, timeScale)` (marks in paced ms and in on-screen ms at the default pace) for the recorder.
- The Thursday test build runs with `?pack=demo`; pieces Bailey approves get their default flipped Friday (one line in `CurvesSwitch.curvesModeFromSearch`).
- REDUCE MOTION does **not** switch the curves off (Bailey's pick: it turns off shake, punch, freeze and rumble only; characters still move). The existing `calmLunge` still shortens a solved reach under it.

## Game case (AGENTS.md rule 14)

| Change | Case | Why / source |
|---|---|---|
| The switch, the driver, the squash family, the cast lift, the recoil, the paced blend clock, the shadow | **both** (shared plumbing) | one engine; the numbers are the same in both games |
| The strike profile | **FFX in Chapter I (`PROFILES.ffx`), FFX-2 in Chapter IV (`PROFILES.ffx2`)** | FFX: the strike clip lands the blow on the LAST frames of the lunge (Tidus frame 20 of 21, 667 ms) and carries 15 frames of follow-through (`research/re-ffx-party-motion-timing.md` sections 3 and 7): committed run-up, later peak speed, low arc, longer pull back. FFX-2: the girls' first hit is 4 to 12 frames into the strike clip after a quick run-in (`src/data/ffx2/action-frames.ts` `GIRL_HIT_FRAMES`: Rikku 4, Paine 11, Yuna 12): earlier contact, higher arc, quicker return. |
| The FFX-2 run-in as a leap, and "no double lift" after it | **FFX-2 only** | the run-in is FFX-2 only (`research/ffx2-combat-core.md` section 1; D-354) |
| Turn-start weight shift | **both, neutral** | the docs are silent on either game's turn-start: one shared small weight shift, listed as an open question |
| Every number | `[ours]` | the sources give frame counts, not paths, arcs or squash |

## The numbers

Profile milliseconds are ON SCREEN at the game's default pace (`steady`: FFX x1.2, FFX-2 x1.1), because `resolveStrike` divides by `defaultPaceFactor`; the actor's clock counts paced ms, so `?pace=relaxed` stretches
the move relative to it and `?pace=current` shrinks it.

| | wind-up | travel | hold (min) | return | settle | total | contact at |
|---|---|---|---|---|---|---|---|
| FFX | 150 | 250 | 200 | 400 | 100 | 1100 | 400 ms |
| FFX-2 | 100 | 200 | 200 | 350 | 150 | 1000 | 300 ms |

Pull back 5 / 3.5 percent of the distance (cap 0.12 / 0.09 units); arc 3.5 / 8.5 percent of the height (apex at 0.5 / 0.42 of the travel); contact overshoot 3 / 2 percent (cap 0.05 / 0.04 units, about 7 px); home
overshoot 4 / 3 percent (cap 0.06 / 0.05 units). Squash and stretch: crouch 5 / 4.5, stretch 4 / 5, contact squash 5 / 4.5 percent, landing squash 2 percent; **never over 6 percent**, `sx = 1 / sy` exactly.
Bosses (scaled by `heftOf(worldHeight)`, 1 at the 4.1 default foe): wind-up and travel x1.3, hold x1.35, return x1.4, arc x0.4, squash x0.65, pull x1.3, overshoot x0.7. Cast lift: 5 / 6 percent of the caster's
height, 240 ms up, held, 260 ms down with a 2.5 percent landing squash. Leap (FFX-2 run-in, 0.42 units over the run; home 0.2): 12 percent crouch, 4 percent stretch, 4 percent landing squash. Turn-start: 3 percent of the
height over 340 ms. Recoil: 0.3 x (0.22 | 0.34 crit) = 0.066 | 0.10 units, 70 ms push, overshoot 13 percent.

## How the other lanes hook in

- Schedule on the strike's marks: `actor.strike({ ..., marks: { travelPeak: fn, contact: fn, settlePeak: fn } })` (or `StrikeRun.on`). They fire once, in order, on the frame that crosses the mark, on the move's own paced clock.
  `window.__pyrefly.strikeMarks('ffx')` lists the times. The smear lane's "cut on the fastest frame" is `travelPeak` (and `settlePeak` for the way home); today `KeyPoses.impactAtApex` still swaps `ready` to `attack` at `contact`.
- The sound lead follows the new contact (`StrikeBeat.strikeBeatNow()`); `BattlePresenterSfx` reads it for the `attack` cue.
- `ContactBeat.armContact` lengthens the hold cap by `CURVES_CONTACT_EXTRA_MS` (150) while the curves are on, because the cap counts from the lunge's start and the contact is 145 ms later than the old apex.
- CHK-027: a swap on a mark is not yet tagged as a planned smear (that is the smear lane's change to `critic/policy.json`).

## Not done in step 1 (the brief's steps 2 and 3, and what step 1 leaves)

- The smear cut and its two styles, the camera A/B, hit-stop and rumble, motion SFX, spell effects (other lanes / later steps).
- KO "rig collapse + settle" and victory "each game's own": only the KO landing and lie-down SQUASH calls are retuned (they ride the subtle family); the fall itself and the victory hop are unchanged.
- The counter lunge (`BattlePresenterEvents` `case 'counter'`, 280 ms) keeps today's `lunge`; the FF7 and scene lunges are untouched.
- `BattleCamera.shakePhase += 0.9` per frame (frame-rate dependent) is the camera lane's; not touched.
- Per-key easing for rig bones (`RigTransition` is still `quadInOut` + carried speed): bosses get the actor-level curves through their carrier, not new per-key anticipation.

## Open questions

1. REDUCE MOTION leaves the whole strike (pull back, arc, lean, squash) on, per Bailey's pick; the accessibility reading might want the lift and lean off. One line to change (`curvesOn()` could also test `reducedMotion`).
2. Is "about 1.1 s" meant on screen at the default pace (what is built: 1.1 s FFX, 1.0 s FFX-2) or at pace 1 (then x1.2 on screen)?
3. FFX-2 total 1.0 s against FFX 1.1 s: the sources only say the girls strike sooner; is the shorter total wanted or should both be 1.1 s?
4. Turn-start is one neutral weight shift for both games (the docs are silent).
5. The knock-back is 9 px (13 on a crit) at 1440p: "a few px" read literally; the white flash stays the existing 80 ms hit flash.
6. The contact overshoot is capped at about 7 px so a solved reach does not bury the figure in its target.
