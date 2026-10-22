# Motion core (conference demo motion pass, lane "core")

Bailey, 2026-10-22 ~00:10-01:30 EDT: "The motion and animations need to be top notch, even above visuals (in the static sense)." and "Pose continuity needs to be tight. It needs to be impressive."
His picks for this lane (the full list is in the driver's brief): the full motion pass (anticipation, arcing lunge and back, subtle squash-and-stretch, recoil-and-recover, cast lift,
overshoot settle, eased, smooth at 120 Hz or more), "Snappy, about 1.1 s", each game's own path and return, the shadow that follows, REDUCE MOTION turning off "Shake, punch, freeze, rumble"
only, demo chapters first.

Branch `motion-core` (from `origin/main` 3e520971e, release 61 + records). Tree `D:/pyrefly-anim-proto`. All three steps are built here: 1 (CURVES), 2 (SWAP TIMING + SMEAR) and 3 (the per-game MOMENTS and the evidence clips, at the end).

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
- CHK-027: a swap on a mark is a planned smear when the engine logs it as one: step 2 below.

## Evidence

Unit tests (all green; `node node_modules/vitest/vitest.mjs run tests/unit/engine/motion-core-curves.test.ts tests/unit/engine/motion-core-actor.test.ts`): the switch (default OFF, demo chapters only), the profiles (the brief's numbers),
the sampled timeline (exact rest pose, continuity at 120 Hz, volume preservation, never over 6 percent, marks in order and on the fastest frames), the clock (60, 120, 240 Hz and an uneven train land on the same curve, leftover carried,
the contact hold, the carry fold), the cast lift, the leap, the recoil, and the REAL `PaintedActor` (the whole beat: contact at 0.4 s, the blow waits for it, 0.2 s hold, rest at 1.1 s; boss heavier; shadow; lean signs;
frame-rate independence; hit-stop holds the move; the blend on the paced clock). Targeted existing suites (172 files: engine, presenter, r38, r39, contact, item, fx-c, sfx, demo, battle-screen) pass with the switch OFF.
`npx tsc --noEmit` clean; `node tools/orphans.mjs` shows none of the new modules.

Real game, headless GPU Chromium, real keys, the game stepped at an EXACT 120 Hz (Playwright's fake clock for timers plus a manual `requestAnimationFrame` queue, one game frame per 1/120 s; `?coach=off`, seed 1), today
(`?curves=today`) against `?pack=demo`, in `D:/Tools/pyrefly-scratch/2026-10-22/motion/core/` (scratch, not committed):

- `cap/<chapter>-<today|new>/` : 120 Hz JPEG frames (`f*.jpg`), `timeline.json` (every actor's channels every frame), `sheet.png` (contact sheet), `clip120.mp4`; `cap/*-new/` for Chapter I (`seymour-flux`) and Chapter IV (`ffx2-bahamut`).
- `evidence/curves-strike.png` (the two profiles against today's lunge), `evidence/analysis-120hz.json`, `evidence/series-*.txt` (the attacker's channels every 3 or 4 frames).
- Chapter I, Tidus (FFX, default pace): the move starts 25 ms after Enter, contact at about 390 ms (today 300 ms), a 3-frame hit-stop at the blow (identical frames 400 to 425 ms), hold, return, rest; scale Y 0.9475 to 1.0389
  (today 0.984 to 1.037 plus the 8.1 percent attack call), volume error under 1 percent (the idle breath), lift 0.095 units, lean -0.017 to +0.074 rad, **shadow gap to the figure 0.07 units (today up to 1.06: the shadow lagged)**.
- Chapter I, Seymour Flux (a RIG, `RigActor`): his strike is the same curve heavier and slower: travel about 300 ms, hold about 350 ms, return about 500 ms, lift 0.03 to 0.08 units.
- Chapter IV, Paine (FFX-2): the run-in is a leap (take-off crouch 3.5 percent, lift 0.45 units, stretch 5.4 percent, landing squash 5.1 percent), then the strike (crouch, travel, `attack` painting at 658 ms on the travelPeak mark,
  `follow` at 800 ms), then the run home as a leap (lift 0.19 units, landing squash 5.8 percent). Her strike plays no arc of its own. Shadow gap 0.07 units (today 0.34).
- Chapter I recapture after the impact-painting fix (`cap2/seymour-flux-new/`, `evidence/series-ch1-new-tidus-after-impact-fix.txt`): ready, then `attack` at 300 ms (the travelPeak mark), `follow` at 408 ms (the blow), `idle` at 733 ms:
  the same key-pose sequence as today. (The first Chapter I recording skipped the `attack` painting: the blow landed on the contact and the follow-through replaced it in the same frame.)
- Console errors: 0 in all five recordings.
- Full unit suite (1549 files, `--maxWorkers=3`, 57 minutes): 1521 passed, 26 skipped, 2 failed; both are artifacts and pass alone on the final tree: `tourist-trap-bench` timed out at 15 s under load (an engine bench, not
  presentation), and one new test of mine ran against a KeyPoses.ts that vitest had transformed before I edited it mid-run. The targeted set (178 files) is green on the final code with the switch OFF.

## Step 2: swap timing + smear (MAP 10b)

Bailey, 2026-10-22: "Cut on the motion peak with a smear": big pose changes cut on the FASTEST frame inside a 1-2 frame smear plus a light flash; small changes keep the quick blend; "BOTH styles (painted streak and soft motion blur) behind a switch,
he picks Thursday"; the motion checker "may excuse a fast swap ONLY when the engine logged it as a planned smear on a big change" ("Yes, only planned smears.").

### What step 2 is

| Piece | File | What it does |
|---|---|---|
| The switch | `src/engine/motion/SmearSwitch.ts` | `?smear=paint\|blur\|off`; `?pack=demo` alone is `paint`; `?smear=` wins. **Default off** (no key, every unit test). Plays only in Chapter I (`seymour-flux`) and Chapter IV (`ffx2-bahamut`): the chapter is the one `BattleScreen` names to `CurvesSwitch.setCurvesChapter`. REDUCE MOTION does **not** switch it off (Bailey: it turns off shake, punch, freeze, rumble only); REDUCE FLASHES switches the smear's flash off (the cut and the streak stay). |
| The planner | `motion/SmearPlan.ts` (pure) | `smearPlan({from, to, overlap, anchorDistance, speed, frameMs, style})` is null (the blend stays) or `{cutMs, style, strength, length, flash}`. **Big** = outline overlap under 0.5 (the harness's own reading, `PoseAlign.footprintOverlap`) or the two heads 0.12 of the figure's height apart. **On a moving figure** = at least 0.45 body heights a second. Window 24 to 34 ms (more of a pair that shares nothing), never fewer than 2.25 frames of the display actually running (so 2 frames at 60 Hz, 3 to 5 at 120 Hz), cap 70 ms. The cut is at the middle (`CUT`: the old painting whole, then the new one whole; no frame shows both), the amount is `sin(pi u)^0.8` over the window, full AT the cut. A light flash (ivory, peak 0.28, about 1.5 windows) only on a cut INTO an action painting (`attack`, `cast`, `item`, `special`, `od-*`...): never the struck figure's `hurt` swap (it has the hit flash: two on one big plane is a white blob, `demo-motion.md` item 4), never a return to idle. KO and `twirl-*` are left alone (KO is step 3, the twirl is the spherechange's own sequence). `rigSmearPlan` is the rig twin (the share of the figure's mesh area whose image flips stands in for the overlap, no speed gate). |
| One figure's state | `motion/ActorSmear.ts` | speed (smoothed over 30 ms, a hit-stop leaves it), the display's frame time, a **hint** (a recoil's first frame is its fastest and the `hurt` swap is made on it, so `PaintedActor.recoil` says which way and how fast the push will go), the window and its `sample(u)`. |
| The director | `motion/SmearDirector.ts` | `PaintedActor` calls it in four places only: `track` (every frame), `hintRecoil`, `swap` (in `beginBlend`: reads the speed, then the pair, plans, retunes the blend to the cut, logs, lights the flash), `step` (writes the amount onto the planes' uniforms). **The window IS the blend's progress**, so the cut and the streak cannot drift apart at any frame rate, pace or hit-stop (the blend runs on the real clock). Hooks stay inside `PaintedActor`/`PoseBlend` (not a third `setPose` wrapper, MAP fact 10). |
| The render, painting sets | `shaders/PaintedShader.ts` | one smear block, off at `smearAmt` 0: **blur** = 13 taps centred on the pixel (triangular weight); **paint** = the pixel takes the paint that lies AHEAD of it along the travel, so the figure's own colours trail behind it (a little lighter than the figure), in dry-brush bristles (noise across the travel sets each bristle's reach 0.28 to 1.0), the body itself crisp. Both jitter their taps per pixel (grain, not combs) and sample with the pixel's own derivatives (`textureGrad`: the first recording's compiler warned of an undefined mip level in a loop). Shared cells `smearAmt`, `smearStyle` on the actor's `u`; `smearVec` (the streak at full amount in the plane's own coordinates: flipped on a mirrored plane, scaled by the aspect upward) per plane. `motion/SmearApply.ts` writes them. A CPU port on the real paintings: `D:/Tools/pyrefly-scratch/2026-10-22/motion/core/evidence/smear-preview.png`. |
| Rigs (the bosses) | `rig/RigSmearWindow.ts`, `rig/RigMaterial.ts` | Both bosses' keys swap EVERY part's image, flipped at progress 0.5 of the move and hidden by a 40 ms cross-fade that shows two figures for a few frames (PR-0478). Under the smear the flip is a CUT (`fadeMs` 0: "a smear frame is meant to snap", `rigTypes.ts` v2.1) and the window is centred on it, on the move's own clock. **A part is a mesh cut to its own outline, so a streak drawn by the fragment shader cannot leave it** (the first recording showed no smear on either boss): the rig's VERTEX shader stretches the figure's trailing side back along the travel (the classic smear frame: a vertex moves back by up to 0.6 (blur) or 1.0 (paint) of the streak's length, the more the further behind the middle it lies), and the fragment block still blurs or drags inside the meshes (a patch in `RigMaterial.SHADER_PATCHES` carries the streak into each part's own uv through the screen-space derivatives). A figure that only changes key streaks the way it FACES (a foe to the left); one that travels, along its travel. **This replaces the brief's port of anim-proto-3's `RigSmear.ts`** (a canvas-drawn blurred copy of a part's image shown for two frames): no canvas, no extra texture, both styles, and it follows the bones. |
| Swap timing on the marks | `KeyPoses.ts` (`impactAtApex`, `settleSwap`, `settleDone`, `idleAtEnd`, `followThrough`), `ContactBeat.ts`, `motion/CurveBeats.ts`, `BattlePresenterBeats.ts` (one call) | **FFX (Chapter I), curves on:** `ready` to `attack` on `travelPeak` (step 1), the impact painting held through the blow and the 0.2 s hold, then `attack` to `follow` (when painted, else `idle`) on **`settlePeak`**, the fastest frame of the way home, and `follow` to `idle` on the strike's `end` mark (home, at rest: a plain blend). The blow no longer swaps to `follow`. **`actionEnd`'s idle waits for those marks** (`idleAtEnd`; a 900 ms net does it when they never come): the first recording showed the action ending about 0.1 s BEFORE the fastest frame home, so its idle swap skipped the follow-through entirely and cut at 60 percent of the peak speed. **FFX-2 (Chapter IV), a girl who ran in:** the run home is hers (`BattleScreenRunIn.close` puts the idle up as she sets off, before `settlePeak`: the second recording showed attack, idle, then a follow-through painted over the run home), so only the impact painting moves to its mark and her follow-through stays at the blow, as in the live game. The settle swap also leaves a figure alone that has taken another painting since. The victim's `hurt` swap is made on the recoil's first frame (the push's peak speed), which `recoil` hints. |
| The log | `motion/SmearLog.ts`, `src/debug/smearApi.ts` | every planned cut (who, from, to, style, window, the overlap, head distance and speed it was planned from, `kind` plane or rig, `moveMs` of a rig) with `performance.now()`; `window.__pyrefly.smearLog(reset?)`, `smear('paint'\|'blur'\|'off')`, `smearOn()`, `smearStats()`. |
| The normal maps | `look/relight/FigureRelight.ts`, `PaintedActor.prefetchLights` | MAP fact 11: a pose is drawn unlit until its normal map arrives, and the cache let a staged figure's map go (cap 56; Chapter I stages 50 maps, Chapter IV 56). `prefetchRelight` fetches and **pins** every pose's map the moment a figure's paintings are staged (a rig's never-drawn carrier plane is skipped), the cap is 112, a pinned map is never evicted, `dispose` lets them go. Only with a look armed (the two demo chapters arm theirs). On the recordings: 42 maps requested, none missing, none re-fetched. |

### Switches (all default OFF)

- `?smear=paint|blur|off`, `?pack=demo` (paint), only in Chapter I and Chapter IV. `window.__pyrefly.smear('blur')` etc. flip it live for the recorder (one battle can play one attack per style: that is how the recordings below were made).
- The settle swap is part of the curves: `?curves=new` or `?pack=demo`.
- Harness: `continuity.smear` in `critic/policy.json` (`excuse: true`, `slackMs` 12, `maxJerkPx` 120, `bigOverlap` 0.5, `bigAnchor` 0.12; the note quotes Bailey 2026-10-22, as a test asks). `false` (or no block) gives the earlier reading back.

### Game case (AGENTS.md rule 14)

| Change | Case | Why / source |
|---|---|---|
| The switch, the planner, the director, the render, the log, the relight pin | **both** (shared plumbing) | one engine; WHICH pairs are big is read from each game's own paintings (their silhouettes), so there is no per-game number |
| The rig window and stretch | **both**; Seymour Flux (FFX, Chapter I) and Bahamut (FFX-2, Chapter IV) | both bosses swap every part's image per key |
| `attack` held through the blow, `follow` on `settlePeak`, `idle` at the end | **FFX only** (Chapter I), `[ours]` | the sources give frame counts, not which painting is up on the way home (`research/re-ffx-party-motion-timing.md` sections 3 and 7: Tidus carries 15 frames of follow-through after the blow) |
| `follow` stays at the blow; idle as she runs home | **FFX-2 only** (Chapter IV girls who run in) | the run-in and the run home are FFX-2 only (`research/ffx2-combat-core.md` section 1; D-354) and own the way out |
| The victim's `hurt` on the recoil's first frame | **both** | the recoil is shared plumbing (step 1) |
| CHK-027's planned-smear excuse | **both** (shared critic plumbing) | the engine plays the smear only in Chapters I and IV |

### The numbers (every one `[ours]`; the sources give no smear length, window or threshold)

Big: overlap under 0.5 or heads 0.12 of the height apart. Moving: 0.45 body heights a second (a lunge peaks at 4 to 11, a recoil at about 1). Window 24 to 34 ms, at least 2.25 display frames, cap 70. Cut at 0.5 of the window. Strength
`(0.55 + 0.45 difference) * clamp(speed / 3, 0.35, 1)` (rigs `0.6 + 0.4 q`). Streak at full amount: blur 0.14, paint 0.34 of the plane's width; rig stretch 0.6 / 1.0 of it. Flash: ivory `0xfff3d9`, peak 0.28, 1.5 windows.
Harness: slack 12 ms, jerk cap 120 px (the camera-cut threshold). Relight cap 112.

### How the other lanes hook in

- The planned-smear log (`__pyrefly.smearLog()`) says when a cut falls; a camera punch, the motion SFX (whoosh on the smear) or a hit spark can ride it instead of guessing. The window is `blend.progress`; the cut is `CUT_AT` (0.5) of `cutMs` (a rig's: half its key move).
- Anything that sets a pose on a figure the planner calls fast and big gets the smear for free; a lane that wants a pose change NOT smeared sets it at rest or asks for a pose the planner skips (`SKIP` in `SmearPlan.ts`: `ko`, `dead`, `twirl-*`).
- Step 3 (the KO "rig collapse + settle", victory) starts from `SKIP`: the KO is not smeared here and the rig's KO key is not either.
- `KeyPoses.idleAtEnd` is the one place `actionEnd`'s idle is decided now; a lane that adds a way out of an action should swap on a strike mark (`StrikePlan.marks`) and register it through `LungeContact.settle` / `done`.
- Harness: the log's names are the harness's pose names (a painting set logs the planes' `pose`, a rig its key). A lane that renames poses must keep them.

### CHK-027 (critic/policy.json + `critic/runner/lib/continuity-smear.mjs`)

A cut is a snap and a head that steps in one frame is a jerk at a swap, so the harness excuses a swap ONLY when the engine logged it: the same figure and pair of paintings (or rig keys), the logged change big by the POLICY's numbers, the flip inside the entry's window (a painting set: the cut's own window; a rig: its whole key move, because the harness sees the change of key when the move BEGINS; each less `slackMs` and a frame, to its end plus `slackMs` and two frames), one entry per swap. It is then not a `snap` (`hardCut` stays true; `snapSmear` keeps what it would have been) and a jerk AT it of at most `maxJerkPx` is `smeared`: kept in the report and the strips, counted in `summary.motion.jerksSmeared`, left out of the verdict. Every other fast swap (no entry, another pair, outside the window, small), a jerk over the cap and every CHK-026 reading are judged as before. `summary.motion.smearsPlanned`, `smearSwaps`, `smearSnapsExcused`, `jerksSmeared`, `worstSmearedJerkPx`, the chapter's `smear` block (in `continuity.json`) and a note on the CHK-027 result say what it excused. `critic/CHECKS.md` 8a, `critic/runner/lib/README.md`.
**r62-fixes' `continuity.mjs` (+42 lines, PR-0512)**: my hunks there are separate: one aggregate line (`smearsPlanned`...) and one `smear: res.smear` line in `continuity.json`; everything else is in the new `continuity-smear.mjs` and one-line additions to `continuity-analyze.mjs`, `continuity-summary.mjs`, `continuity-probe.mjs` (`meta.smears`), which r62-fixes does not touch.

### Evidence (step 2)

Unit tests (`node node_modules/vitest/vitest.mjs run tests/unit/engine/motion-core-smear.test.ts tests/unit/engine/motion-core-smear-actor.test.ts tests/unit/engine/motion-core-relight.test.ts tests/unit/rig/rig-smear-window.test.ts tests/unit/critic-continuity-smear.test.ts`):
the switch, the planner (big or small, moving or at rest, the window at 60, 120 and 240 Hz, the flash rules), the log, the state, the uniform writer; the REAL `PaintedActor` (a cut in a few frames at 60, 120 and 240 Hz with no frame showing both paintings, the same cut time at any frame rate, both styles, the
flash, the hurt swap on the recoil's hint, what stays a plain blend, travelPeak and settlePeak are fast enough to be planned cuts for both profiles and a boss); the way out (follow on `settlePeak`, idle at the end, `actionEnd` waiting, the net, a later attack taking over, FFX-2's follow at the blow); the REAL `RigActor`
(a cut with no cross-fade, the window centred on the flip, a foe streaks left); the normal maps (pinned, never evicted, the cap); the harness (matching, the policy, the jerk cap, the probe's clock, end to end on a synthetic recording, a rig's whole-move window). Targeted regression on the final code: 359 files (every test whose name has presenter, battle-screen, demo, pose, rig, look, relight, critic, motion, hit, recoil, lunge, ko-, spellfx, sfx, contact, item or engine/) 4738 tests green; `npx tsc --noEmit` clean; `node tools/orphans.mjs` shows none of the new modules. The full suite was NOT run (free RAM 4 to 9 GB all night, the brief asks for more than 12 GB).

Real game, headless GPU Chromium, real keys, the game stepped at an EXACT 120 Hz (the step-1 recorder), `?pack=demo`, ONE battle per chapter with the style switched between the player's attacks (`off`, `paint`, `blur`, `paint`) through `__pyrefly.smear(...)` and the boss acting in between, the continuity probe riding the same
recording. In `D:/Tools/pyrefly-scratch/2026-10-22/motion/core/` (scratch, not committed): `cap4/<chapter>/` (`f*.jpg`, `timeline.json` every actor's pose, plane fades, smear amount, `meta.json`, `raw/` the probe's data, `analysis/events.json` and `events.txt` every pose change with its round and whether it was a planned cut,
`analysis/sheets/*.png` eight frames around each, `analysis/clips/*.mp4` slow-motion clips (120 Hz frames at 30 fps), `analysis/reanalysis.json` the harness run with the excuse OFF and ON), `evidence/step2/summary.json`, `evidence/smear-preview.png`, `evidence/zoom-*.png`, `cap3-first-recording/` (the first recording, before the fixes below).

**Results** (final code; every number is read from the recordings' own timeline and the probe's raw data, `evidence/step2/summary.json`):

| | Chapter I (FFX, `seymour-flux`) | Chapter IV (FFX-2, `ffx2-bahamut`) |
|---|---|---|
| Recording | 3301 probe frames, 27 s of battle | 2364 probe frames, 20 s of battle |
| Pose changes read (party, boss rig, the second foe) | 33 | 42 |
| Planned cuts the probe saw (painting set + rig; the engine logged 19 / 19, the rest fell before the probe attached) | 15 (6 + 9) | 16 (7 + 9) |
| Window of a cut | 26 to 34 ms, 3 to 5 lit frames at 120 Hz | 27 to 34 ms, 3 to 5 lit frames at 120 Hz |
| Frames with BOTH paintings showing, a planned cut | 0 | 0 |
| Frames with both paintings showing, a plain blend (a swap at rest, the `off` round) | 12 to 19 frames (100 to 160 ms), 16 swaps | 15 to 23 frames (125 to 190 ms), 24 swaps |
| Speed at the cut as a share of the fastest frame within 30 frames | `ready` to `attack` (travelPeak) 0.90 to 1.00; `attack` to `follow` (settlePeak) 0.97 to 1.00 (it was 0.64 before `idleAtEnd`) | `ready` to `attack` (travelPeak) 0.83 to 0.88; `follow` to `idle` (the run home sets off) 0.56 to 0.70 |
| Harness re-run on the raw probe data, excuse OFF | 6 snaps, 4 jerks at a swap (worst 95 px) | 7 snaps, 7 jerks at a swap (worst 104 px) |
| Excuse ON (`continuity.smear`) | **15 swaps matched, 0 snaps, 0 jerks at a swap** (4 excused, worst 95 px), 0 hard cuts left unexplained | **18 swaps matched, 0 snaps, 0 jerks at a swap** (7 excused, worst 103.9 px), 0 hard cuts left unexplained |

Chapter I's key poses on the way out of an attack: `ready`, `attack` (travelPeak), `follow` (settlePeak), `idle` (the strike's end mark); Chapter IV's: `ready`, `attack` (travelPeak), `follow` (the blow, a plain blend as today), `idle` (the run home sets off, a gentle cut).
CHK-026 and CHK-027 print UNVERIFIED on these recordings (20 and 27 s of battle, under the harness's 60 s minimum): the numbers above are for the excuse's before and after on one recording, not a verdict. The frame time p99 of both recordings is 9 ms (120 Hz is 8.3 ms) with the probe riding along.


What the first recordings found (all fixed, each with a test): (1) the bosses showed NO smear (the part meshes clip the streak): the vertex stretch; (2) `actionEnd`'s idle pre-empted the settle mark in Chapter I, so `follow` never showed and the cut fell at 60 percent of the peak speed: `idleAtEnd`; (3) the 24 rig smears were logged and none
matched: the harness sees a rig's key change when the move begins, 45 ms before the window; (4) in Chapter IV the run home's idle came first and the settle swap painted `follow` over it; (5) the compiler's X3595 warning (a texture sample with an implicit mip level in a loop) and the GL_INVALID_VALUE warnings that came with it: `textureGrad`. The final
recordings log one console message, the pre-existing `[fx-b] depth plates unavailable`.

## Not done in step 1 (history: step 2's list is at the end)

- The smear cut and its two styles, the camera A/B, hit-stop and rumble, motion SFX, spell effects (other lanes / later steps).
- KO "rig collapse + settle" and victory "each game's own": only the KO landing and lie-down SQUASH calls are retuned (they ride the subtle family); the fall itself and the victory hop are unchanged.
- The counter lunge (`BattlePresenterEvents` `case 'counter'`, 280 ms) keeps today's `lunge`; the FF7 and scene lunges are untouched.
- `BattleCamera.shakePhase += 0.9` per frame (frame-rate dependent) is the camera lane's; not touched.
- Per-key easing for rig bones (`RigTransition` is still `quadInOut` + carried speed): bosses get the actor-level curves through their carrier, not new per-key anticipation.

## Open questions (step 1)

1. REDUCE MOTION leaves the whole strike (pull back, arc, lean, squash) on, per Bailey's pick; the accessibility reading might want the lift and lean off. One line to change (`curvesOn()` could also test `reducedMotion`).
2. Is "about 1.1 s" meant on screen at the default pace (what is built: 1.1 s FFX, 1.0 s FFX-2) or at pace 1 (then x1.2 on screen)?
3. FFX-2 total 1.0 s against FFX 1.1 s: the sources only say the girls strike sooner; is the shorter total wanted or should both be 1.1 s?
4. Turn-start is one neutral weight shift for both games (the docs are silent).
5. The knock-back is 9 px (13 on a crit) at 1440p: "a few px" read literally; the white flash stays the existing 80 ms hit flash.
6. The contact overshoot is capped at about 7 px so a solved reach does not bury the figure in its target.
7. In FFX-2 the cast lift lasts the whole charge: the `cast` painting is already held through the CTIM charge, and the lift is held "until the spell lands" as picked, so in the Chapter IV capture Yuna floats for about 3.5 s
   (rise 4.3 s, down at 8.1 s, 0.10 units up). FFX casts have no charge, so there it is the spell's own 0.5 to 1.5 s. A cap (for example release after 1.2 s of hold) is one constant if the long float reads wrong.
8. The stretch axis: the stretch at the fastest travel frame and the squash at the contact are VERTICAL (a jump's stretch and a landing's squash, `sx = 1 / sy`), which suits the arc (FFX-2's especially); for FFX's low run-up
   lunge a stretch along the line of travel is the other reading. A one-constant change in `StrikeCurve.sampleAt` (swap the sign of the travel stretch) if Bailey's Thursday look wants it.

## Not done after step 2 (step 3 and what step 2 leaves)

*Step 3 (the end of this file) built the knock-out's cut and settle and the per-game victory moments; the rest of this list stands.*

- KO "rig collapse + settle" and victory "each game's own": the planner skips `ko`, `dead` and `twirl-*` on purpose (step 3 owns the KO cut and the settle); the fall itself and the victory hop are unchanged.
- The smear on a swap at rest: the menu's idle to ready, `follow` to `idle` once the strike is home (FFX) or at the blow (FFX-2), a painting-set foe that does not move (Mortiorchis: its `idle` to `cast` and `attack` stay the plain 19-frame blend) keep their blend: a cut with a streak on a standing figure has nothing to hide behind.
- Chapter IV: a girl's `follow` is shown at the blow over a figure at rest (a plain blend), and her `follow` to `idle` at the start of the run home is cut only gently (strength 0.24 to 0.34, the speed at that frame is low). A harder cut there is `BattleScreenRunIn.close` hinting the actor, which is not this lane's file.
- The painting sets' streak is drawn inside the figure's own plane (the shader), so it is clipped at the plane's edge (it fades 4.5 percent before it, so no hard line); a figure whose painting touches the trailing edge gets a shorter streak there. A separate brush-stroke quad would not be clipped; it is the other reading of "painted streak".
- The rigs' smear is a stretch of the trailing side plus the in-mesh blur or drag: its look was judged on the Chapter I and Chapter IV recordings only (the stage camera), not under the other camera presets.
- The motion SFX (whoosh on the smear), the camera A/B, hit-stop and rumble are other lanes; the log (`__pyrefly.smearLog()`) says when a cut falls for them.
- The counter lunge, FF7 and the scene lunges are untouched (step 1's list stands).

## Open questions (step 2)

1. **Where `follow` goes.** The brief says attack to follow/idle on `settlePeak`; D-313 put `follow` up at the blow and held it 180 ms at full reach. Built as briefed for FFX (Chapter I): the impact painting is held through the blow and the 0.2 s hold, `follow` goes up on the
   fastest frame of the way home, `idle` when the strike is home. For FFX-2 girls who run in it stays at the blow (their run home owns the way out). With the curves OFF nothing changed. If FFX's follow-through should show AT the blow too, make `KeyPoses.impactAtApex` return early for every figure (the FFX-2 branch is already there).
2. **The window is in milliseconds** (24 to 34, at least 2.25 display frames): 2 frames at 60 Hz, 3 to 5 at 120 Hz (3 to 5 lit frames on the recordings). "1-2 frames" at 120 Hz would be 8 to 17 ms; one constant (`CUT_MS_MIN/MAX`, `FRAMES_MIN`).
3. **Streak lengths and flash** (`LENGTH` blur 0.14, paint 0.34 of the plane's width; rig stretch 0.6 / 1.0; flash ivory 0.28, only into an action painting): Bailey picks the style Thursday, the lengths are tuned by eye from the preview and the recordings. The painted streak is made of the figure's own colours (lightened a little) and is lost against a backdrop of the same hue (Yuna on Chapter I's blue): is a brighter or warmer streak wanted?
   Is the flash wanted on every attack cut, or only on the first hit of a turn?
4. **The hurt smear is gentle on purpose** (the recoil's push is about 1.5 units a second, 0.8 body heights, so its strength is 0.23 to 0.28): it reads as a flick, not a streak. A harder smear on a hit is `REF_SPEED` or a minimum strength for `hurt`.
5. **Only a figure that is moving is cut.** A swap at rest keeps its blend. If the menu's idle to ready (a leaning figure) should be a cut too, that is the speed gate (`MIN_SPEED`).
6. **Rigs: every boss key change is "big"** (both bosses swap all parts' images per key), so every key move of Seymour and Bahamut (idle, telegraph, attack, hurt, cast) gets a cut and a stretch, KO excepted. If a quiet key (idle to cast) should keep its cross-fade, raise `RIG_BIG_SHARE` or give those keys `fadeMs`.
7. **Harness cap 120 px.** A jerk at a planned cut over `maxJerkPx` stays a jerk. The recordings' excused jerks are at most about 104 px (a cut between two paintings whose heads are far apart: the registration is within 1 percent, the poses are not); the cap can come down if Bailey wants a smear to hide less.
8. **The first-use hitch of a map:** the maps are pinned and fetched at staging but a Three texture uploads to the GPU on its first draw; if a first draw of a pose still hitches, `renderer.initTexture` at staging is the next step (not measured here: no 120 Hz frame in the recordings was slower than 9 ms at p99).

## Step 3: the per-game moments (victory, the knock-out) and the evidence clips

Bailey, 2026-10-22: victory "Each game's own" (each game's after-battle victory moment); KO "Rig collapse + settle" (rigged figures collapse through the rig with a small landing bounce; painted ones get the closest equivalent: a smear
cut into the KO pose plus the settle); turn start and return to place "Each game's own way"; "Pose continuity needs to be tight."

### What step 3 is

| Piece | File | What it does |
|---|---|---|
| The switch | `src/engine/motion/MomentsSwitch.ts` | `?moments=new\|today`; `?pack=demo` alone is `new`; `?moments=today` wins over the pack (A/B). **Default off** (no key, every unit test). Plays only in Chapter I (`seymour-flux`) and Chapter IV (`ffx2-bahamut`), by the chapter `BattleScreen` names to `CurvesSwitch.setCurvesChapter`. REDUCE MOTION does not switch it off. |
| The numbers | `motion/MomentsPlan.ts` (pure) | `victoryKind('hold'\|'pose')` (stand-down or cheer), `cheerShape`, `standDownShape`, `koSettleShape(height, heft)`, `koCutMs(frameMs)`. Every number `[ours]`. |
| The helpers | `motion/ActorMoments.ts` | `startCheer` / `startStandDown` / `startKoSettle`: a leap on the actor's curve driver (step 1's `LeapRun`, which now takes `marks`: things to do on the frame the leap reaches a point of its time). |
| The victory cheer (FFX, Chapter I) | `PaintedActor.setPose` + `playCue('hop')` + `beginCheer` / `landCheer` | The victory cue no longer hops: it starts a cheer (crouch 4 percent, spring 18 percent of the figure's height, landing 4 percent squash, 480 ms on screen at the default pace, after the fighter's own stagger of up to 240 ms) and HOLDS the victory painting back; `LeapRun` fires a mark a tenth of the way into the flight, where the spring is fastest, and the painting is asked for then: with the smear on that is a planned cut on a moving figure (step 2's director: no frame shows both paintings), else the usual blend. A second `setPose('victory')` while it waits is ignored; any other pose ends the wait. |
| The stand-down (FFX-2, Chapter IV) | `motion/MomentBeats.ts` (`standDownParty`), `BattlePresenterBeats.victory` (one call in the `'hold'` branch), `PaintedActor.standDown`, port member `ActorHandle.standDown?` | The sources withhold the pose, so nothing is posed and nothing leaves the floor: one slow breath out (a settle of 3.5 percent over 500 ms, a 1.2 percent rise, 1 s on screen), staggered per fighter. A figure that is down stays where it lies. |
| The knock-out's cut | `KoFall.fallRun(mode, game, cutMs)` + `KoRun.cut` / `crossU`, `fx/mix/living.ts` (`driveCut`; `meeting`), `SmearDirector.beginManual / stepManual / endManual`, `PaintedActor.koCutWindow / koCutBegin / koCutStep / koCutEnd` | A TOPPLE (a party figure falling to a lying painting) has its 75 ms (100 under `?motion=demo`) capped cross replaced by a CUT inside the smear's own window (24 to 34 ms, at least 2.25 display frames: 3 to 4 frames at 120 Hz, 3 at 60): the standing painting whole until half-way, the lying one from there, a streak the way the body falls and a little down. The hold before it is lengthened by what the cross gave up, so the fall takes the same time and the cut falls at the end of the topple, where the turn is fastest. A cut has no cross to hide the difference in length between the long standing body and the curled lying one, so it aligns them middle to middle (a cross keeps aligning the heads): the harness read the head-aligned cut as a 115 to 141 px step at the feet. Needs `?smear=` as well (the pack has both). Logged as a planned smear with `big: true`. |
| The knock-out's settle | `PaintedActor.fall` (one line) | After the landing squash and shake the fall always had, the figure rebounds a little: 1.4 percent of its height over 190 ms, a 3 percent landing squash; a boss 0.4 times that height and 1.5 times as slow. Painted party figures and the rigged bosses (the carrier moves the rig) alike. |
| CHK-027 | `critic/runner/lib/continuity-smear.mjs` (`loggedAsBig`: `e.big === true`), `continuity-probe.mjs` (`readSmears` passes `big`) | A knock-out's standing and lying bodies share no outline by construction and a plane laid on the floor has no footprint to read an overlap from, so the engine marks the pair big itself and the harness takes its word. One narrow clause, tested; the probe copied a fixed list of fields and dropped `big` until the first probe run over the KO recording found it. |
| The debug API | `src/debug/momentsApi.ts` | `__pyrefly.moments('new'\|'today')`, `.momentsOn()`, `.cheer(id?)`, `.standDown(id?)`, `.koSettle(id?)` (the last three call the actor's own `setPose` / `standDown`: what the presenter calls). |

Not rebuilt here, because step 1 already is it (and is on the recordings below): the return to place per game (FFX: the strike's 400 ms way home plus a 100 ms settle with a 4 percent overshoot; FFX-2: the girl's run home is a leap with a
landing squash, `arcFor`) and the neutral turn-start weight shift.

### Switches (all default OFF)

- `?moments=new|today`, `?pack=demo` (new), only in Chapter I and Chapter IV; `window.__pyrefly.moments('new'|'today')` flips it live for the recorder (the A/B clips are one battle with the three switches flipped between actions: `curves`, `smear`, `moments`).
  The knock-out's CUT needs `?smear=` too (the pack has both); `?moments=new&smear=off` keeps the plain cross and adds only the settle.
- Recorder triggers: `__pyrefly.cheer()` / `.standDown()` / `.koSettle(id)` call what the presenter calls (`setPose('victory')`, `standDown()`, `setPose('ko')`), so a victory or a KO can be seen without winning or losing.
- REDUCE MOTION: the moments play (Bailey: it turns off shake, punch, freeze and rumble only). Under it a KO stays the plain cut it always was (`KoFall.koMode`: `rm` is `cut`), so there is no smear to plan, and the settle is the figure's own movement.

### Game case (AGENTS.md rule 14)

| Change | Case | Why / source |
|---|---|---|
| The switch, the leap marks, the KO cut and settle, the log's `big`, the harness clause | **both** (shared plumbing) | one engine; the numbers are the same in both games |
| The victory cheer | **FFX only (Chapter I)** | FFX poses the party to the fanfare (WIN_00 3.7 to 4.0 s, then a short loop): `research/re-ffx-party-motion-timing.md` sections 4, 5, 7; `research/ffx-vs-ffx2-presentation.md` 2.1. The cheer's shape is `[ours]` (a clip length and a loop, no path) |
| The quiet stand-down | **FFX-2 only (Chapter IV; the same code serves any chapter whose `victoryPose` is `hold`)** | the sources withhold the pose after Bahamut (`research/ffx-vs-ffx2-presentation.md` 2.2 and FC-6a; `research/ffx2-bahamut.md` beat 9) and do NOT say what is shown instead (open question 11 there, `[absence]`): a held stance with a settle is `[ours]` |
| The turn start | **both, neutral** (step 1's small weight shift, unchanged) | no source describes either game's turn start (searched `research/ffx-vs-ffx2-presentation.md`, `ffx2-combat-core.md`, `re-ffx-party-motion-timing.md`, `visual-bible.md`); listed as an open question |
| The return to place | **FFX and FFX-2 each their own, from step 1** | FFX: the strike's 400 ms way home (the game plays ATTACK1_02 then _03 while it moves back, 14 + 11 frames: `re-ffx-party-motion-timing.md` section 5) and a 100 ms settle; FFX-2: the girl's run home (`RunInMotion.close`) is a leap with a landing squash. Bailey's "about 1.1 s" sets the FFX length, so it is shorter than the clips' 0.8 s |

### The numbers (every one `[ours]`)

- Cheer: spring 0.18 of the figure's height, 480 ms on screen at the default pace (crouch 0.18 of it, 4 percent; stretch 5 percent; landing 4 percent over 200 ms); the victory painting is asked for at 0.26 of the cheer (a tenth of the flight in). The stagger per fighter is the
  one the hop always had (`beatOffset * 240` ms).
- Stand-down: 1000 ms on screen, half of it a 3.5 percent settle, then a 1.2 percent rise; lift 0.
- KO settle: 1.4 percent of the figure's height over 190 ms (a boss 0.4 times that height, 1.5 times as long), a 3 percent landing squash, a 1.2 percent stretch; the fall's own squash (5 percent with the curves on) and shake are unchanged.
- KO cut: window `24 + 10 * 0.85` = 32.5 ms at least, at least 2.25 display frames, cap 70 ms (30 ms is 3.6 frames at 120 Hz; 37.5 ms is 2.25 frames at 60 Hz); strength 0.85; no flash; the streak runs the way the body falls and a little down.

### How the other lanes hook in

- The cheer, the stand-down and the KO settle are leaps on the actor's curve driver (`PaintedActor.leap`, step 1): a sound lane can ride the same moments (the landing thud on the cheer's landing squash and on the KO's rebound, a rustle on the stand-down) by hooking
  `ActorMoments.startCheer` / `startKoSettle`, which return a promise that settles when the flight is over. The KO's cut and the cheer's cut are in `__pyrefly.smearLog()` like every planned smear (`kind: 'plane'`; the KO's carries `big: true`), so a whoosh or a flash on the smear can read them.
- The camera lane's big-moment punch for a KO or a victory can ride `ctx.moments.victory()` (unchanged) and the log; the actor's own motion does not depend on the camera.
- The KO cut needs the smear (`?smear=`); a lane that turns the smear off (`?smear=off`) gets the plain cross and the settle only.

### CHK-027 (`critic/runner/lib/continuity-smear.mjs`, one clause; `continuity-probe.mjs`, one field)

The harness excuses a fast swap only when the engine logged it as a planned smear on a BIG change. A knock-out's standing and lying paintings share almost no outline, but a plane laid on the floor has no footprint to read an overlap from, so the log had `overlap: null` and
`loggedAsBig` said no. The engine now writes `big: true` for the KO cut (only a topple, a party figure falling to a lying painting), `loggedAsBig` accepts `e.big === true`, and the probe hands the flag over. Everything else about the excuse is unchanged (same figure, same pair,
inside the window, one entry per swap, a jerk over 120 px still counts). Tested (`tests/unit/critic-continuity-smear.test.ts`).

### Evidence (step 3)

`D:/Tools/pyrefly-scratch/2026-10-22/motion/core/clips/` (one page in `CLIPS.md` there): for Chapter I and Chapter IV, one attack, one cast, one hit taken, one knock-out, the victory moment, and the real victory, each today against `?pack=demo`, recorded headless from the
real game with real key presses on a virtual clock at an exact 60 Hz and at 120 Hz, as `.mp4` (a quarter-speed slow version of every 120 Hz pair), A/B side by side, full-frame stills, and a per-frame `.json` (pose, life, lift, scale, smear amount, blend, HP) beside each.
The first recordings, with their faults (a menu cursor that was not where the script thought, a cast that was an item), are kept in `clips-round1/`. Probe recordings (the continuity harness riding the knock-out and victory sets): `clips-probe/`.

What the recordings show (120 Hz unless said):

- **The knock-out, today against the cut** (Chapter I, Yuna; Chapter IV, Rikku): today the standing painting and the lying one share the screen for 5 to 6 ghost frames (the harness's own count) in a 75 ms cross; the cut shows no frame with both, a 3 to 4 frame window (3 at
  60 Hz), a streak peaking at 0.81 (0.84 at 60 Hz), the lying painting from the cut, then the landing squash and the 1.4 percent rebound. A real in-fight KO is on the recordings too: Tidus's in `ch1-hit-demo-*` (the boss's move and his fall) and Kimahri's in the Chapter I smear log.
- **The victory cheer** (Chapter I): the victory painting arrives 133 ms after the cue for Tidus and 183 ms for Yuna (the stagger), a planned cut 4 frames long at the take-off (smear 0.36 and 0.31; the figure is already 0.17 units off the floor), a 0.34 unit spring, crouch and landing
  squash 3.5 percent; today the painting is a plain blend at the cue and the figure hops 0.24 units.
- **The stand-down** (Chapter IV): the figures keep their stance and painting; the settle takes a figure's height scale to 0.972 and back (today it only breathes, 0.992 to 1.008; with the moments 0.972 to 1.017); nothing leaves the floor. In the real victory clips (`ch4-victory-real-*`) the party holds its stance through the camera's victory framing and the screen goes on to the next scene.
- **The real victory** (`ch1-victory-real-*`, `ch4-victory-real-*`): every foe at 1 HP and `autoBattle('intended')`: the boss's last blow, its rig collapse to the `ko` key, the sending, then the party's cheer (Chapter I) or hold (Chapter IV), to the next scene.
- **CHK-027** (the harness riding a KO and a victory set at 120 Hz, `clips-probe/`): see the table.

| the harness riding a recording at 120 Hz | planned smears logged | excused as planned | snaps | worst excused jerk | jerks over the 120 px cap |
|---|---|---|---|---|---|
| Chapter I: a KO (Yuna) and the victory (Tidus, Yuna), today then `?pack=demo` (`clips-probe/ch1-ko-120-*`) | 8 | 3: the KO cut and both cheers (the rest are the boss's rig keys, which have no planes for the probe to read, and Kimahri's moves before it attached) | 0 | 74 px (Yuna's KO, the feet landmark) | 0 |
| Chapter IV: a KO (Rikku) and the stand-down, today then `?pack=demo` (`clips-probe/ch4-ko-120-*`) | 9 | 8 | 0 | 41 px | 1: Rikku's KO, the feet landmark, 134 px (Dark Knight, a long sword: the standing body is much longer than the curled lying painting) |

Today's crosses show 5 to 8 ghost frames (both paintings over the harness's ghost threshold) at every KO and victory swap; the planned cuts show 0. CHK-026 and CHK-027 read UNVERIFIED because a 19 second recording is under the 60 seconds the policy asks for; the numbers above are the
readings the full-length review would take. The first probe run found that the probe dropped the `big` flag (fixed, tested); the second, after the middle-to-middle alignment, took Chapter I's KO feet step from 115 to 74 px and left Rikku's at 134 (141 before): the harness's `feet` landmark compares a toppled standing body's
feet with a lying painting's registered stance, which is about the middle of the body, so a hard cut at a topple carries about half a body length there whatever the alignment (a cross hides it by dissolving).

### Not done after step 3

- **Haste speeds the victory pose** (true of both games, `research/ffx-vs-ffx2-presentation.md` 2.1 and 2.2, FC-7): the presenter does not read a status at the victory beat; the cheer and the stand-down run at the default pace. Not built.
- **The victory's length against the results.** The beat still waits `TIMING.victory` (900 ms, `fxVictory` can lengthen it) before the results flow, as it always did; the cheer is 480 ms plus a 200 ms landing, the stand-down 1000 ms. The sourced clip (3.7 to 4.0 s, then a 1.0 to 1.7 s loop)
  is not matched in length: the victory painting is held, with the victory posture's faster breath, until the results take over. The WIN_01 loop has no movement of its own.
- **One cheer shape for every fighter.** The game gives each character a different victory clip; our paintings carry the pose, the motion is shared (a stagger per fighter, the height a share of the figure's own).
- **A boss's KO has no smear.** `rigSmearPlan` still skips `ko` (a rig key change to the rig's own `ko` key is a bone move; Seymour Flux and Bahamut both have one and it plays, then the rebound), and a boss that is sent (the demo's default, a dissolve) gets only the settle rebound.
  The colossus modes (`buckle-cross`, `cross`) keep the capped cross.
- **A real in-fight KO of a party member in Chapter IV was not recorded** (the clips use the presenter's own beat through `__pyrefly.koSettle`); a real one is on the Chapter I recordings.
- **Turn start and return to place per game**: no new code (see the game-case table); the turn start stays the neutral weight shift of step 1.
- **No sound, no camera, no flash on any of this** (other lanes). The KO cut and the cheer's cut carry no flash (`flashInto` does not list `ko` or `victory`).
- **The cheer's cut is gentle** (a smear amount of about 0.3: the spring is 1.1 to 1.7 body heights a second, the planner's strength reads speed over 3): it reads as a clean cut at the take-off, not a streak.
- **The stand-down is subtle** (3.5 percent, a little over the idle's own breath): on a 1440p screen about 15 px of a figure's height.

### Open questions (step 3)

1. **FFX-2, Chapter IV: what is shown when the pose is withheld?** The sources withhold the pose and do not say. Built: the stance held, one slow breath out (3.5 percent). Alternatives: the stance with nothing at all (today), a lowering of the weapon, a turn away. `[absence]`.
2. **The cheer's height and weight** (18 percent of the figure's height, 480 ms): a bigger, slower leap, or two small ones (the WIN_00 / WIN_01 reading), is `CHEER_OPTIONS` and `cheerShape`.
3. **Should the cheer's smear be stronger?** It is the planner's own (speed over 3): about 0.3. A minimum strength for a moment swap is one number in `SmearDirector.beginManual` / `smearPlan`.
4. **The KO's cut and streak**: strength 0.85, window 30 to 38 ms, no flash, middle to middle; and whether a boss's collapse should also be cut (it is not today).
5. **The KO rebound** (1.4 percent of the height, a boss 0.4 times that): is the little bounce wanted, or only the squash the fall always had? One constant (`koSettleShape`).
6. **Turn start per game**: nothing in the sources; if Bailey wants them to differ, say how (FFX: the weight comes forward as the menu opens; FFX-2: a bounce when her gauge fills?).
7. **REDUCE MOTION** leaves the cheer, the stand-down and the rebound on (his pick: it turns off shake, punch, freeze and rumble only); a KO under it stays the plain cut it always was (`koMode`: `rm` is `cut`).
8. **The excused-jerk cap for a knock-out** (`continuity.smear.maxJerkPx` 120): a KO's feet step 74 px at the cut with the middle-to-middle alignment (141 with the heads aligned); a taller cap would let a head-aligned KO through, a lower one would not.
