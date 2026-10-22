# Motion program, lane "feel", step 1: camera punch, hit-stop, rumble, contact shadow, 120 Hz+

Branch `motion-feel` (from `origin/main` 3e520971e, release 61 plus records). Written 2026-10-22 overnight. Bailey, 2026-10-22 00:10 to 01:30 EDT: "The motion and animations need to be top notch, even above visuals (in the static sense)." His picks for this lane: camera "Test both, you pick" (a playable A/B between today's big-hit camera and a subtle 2 to 3 percent zoom-and-settle punch on big hits and Overdrives), hit-stop "Short, big hits only" (3 to 4 frames on criticals, Overdrives, boss big attacks), rumble "Light, big moments only", "Contact shadow follows", REDUCE MOTION turns off "Shake, punch, freeze, rumble" only, motion smooth at 120 Hz or more, and "Demo chapters first".

## Game case (AGENTS.md rule 14)

**BOTH games, one set of neutral numbers, behind switches; ON only in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2).** Why both: every piece is shared presentation plumbing (the spectacle's camera and stop, the presenter's hooks, the actor's shadow, the gamepad), which `critic/CHECKS.md` CHK-020 calls "both". The sources are SILENT for each piece in both games: `research/ffx-vs-ffx2-presentation.md` says only that the FFX battle camera is authored and reframes per action (single source); `research/*.md` has no hit-stop, camera-punch, rumble or contact-shadow description for either game (searched: `hit-stop|freeze|rumble|vibrat|shake|shadow`; the only matches are the visual bible's UI numerals and blob-shadow sizes, which the actor's base shadow already follows). So where the games could differ (FFX gold and calm, FFX-2 pink and quick, which `SPECTACLE_TUNING` already encodes for shake and the old stop) the numbers here are one neutral set, listed as a question below. The FFX-2-only rule that does apply: **no camera punch while a command menu is open** (the target-frame hold, D-316, `KeySlots.menuBlocks`); FFX has no clock that runs under a menu, so it never matters there.

## The switches (each pure, read once, OFF at compile time)

`src/engine/feel/FeelSwitch.ts` (the `PoseSwap.motionMode` / `HitRecoil.recoilLegacy` pattern). Every answer is today's outside Chapter I and Chapter IV, and before the battle screen names the chapter (`setFeelChapter(chapter.id)` in `BattleScreen`, cleared on exit): merging this branch changes nothing in the live game.

| key | values | default | piece |
|---|---|---|---|
| `?pack=demo` | | off | turns every piece below ON (`new`, `short`, `on`, `follow`) in the two demo chapters; a key named beside it wins for its piece (`?pack=demo&punch=today` is the A/B) |
| `?punch=` | `today` `new` `off` | `today` | the big-hit camera |
| `?hitstop=` | `today` `short` `off` | `today` | the hit-stop |
| `?rumble=` | `on` `off` | `off` | the gamepad rumble |
| `?shadow=` | `follow` `today` | `today` | the contact shadow |

`window.__pyrefly`: `punch(fraction, ms, 'new'|'today', trauma, stopMs)` plays one punch on the real spectacle camera now (returns the depth it used), `punchMode(m?)`, `hitStopMode(m?)`, `rumble(on?)`, `shadowFollow(on?)`, `feelPack(on?)`, `feel()` (everything in force, the chapter named, whether it counts), `rumbleLog(reset?)`, and `simStep(frames, hz)` / `simResume()` (stop the page's loop and run whole frames of the REAL app at any rate: Playwright's page clock can only fake a 16 ms animation frame, so it cannot show 144 Hz).

## What each piece is, with its numbers (all `[ours]`: no source gives any of them)

### (a) The camera punch, `?punch=new`

- **One punch, not two.** Today a heavy blow (crit, overkill, capped) gets `BattleMoments.impact`'s 0.11 dolly over 460 ms on the FIELD clock (so it stalls inside a hit-stop), BATTLE SPECTACLE's 0.035 / 0.05 kick (x 9 world units, on the animation clock) and the trauma shake. `new` carries the punch on the spectacle's kick (`Trauma.kick`): it runs on the real frame time, so it **reads through the hit-stop**; it is zero under REDUCE MOTION; it composes with every rig. The 0.11 moment punch is dropped while the spectacle is on. With the spectacle off the moment punch stays but at the same 0.025, so the A/B is the same size either way. The trauma shake is left exactly as it is under `new` (the dial `?fxdial=shake:0.5` scales it): see the open question.
- **Size = a fraction of the DEPTH of the struck figure in front of the camera** (`PunchCurve.punchDepth`, along the view axis), so a dolly of `f` of it magnifies that figure by 1 / (1 - f): 2.5 percent is 2.56 percent on screen wherever the figure stands (unit test with a three camera; browser measurement below). 0.025 on a crit or heavy blow, 0.03 on the last blow of an Overdrive or Special and on a boss headline move, 0 on everything else.
- **Shape = a zoom and a short settle:** 70 ms eased out, then 300 ms back with a back-out of constant 1.9, so it undershoots 12 percent of the punch (0.3 percent of the frame for a 2.5 percent punch) before resting at exactly 0. Today's kick (90 ms in, 380 ms smoothstep out, no undershoot) is kept bit-for-bit as the default shape (a test pins the old formula).
- **FFX-2:** no punch while a command menu is open (`HitInfo.menuOpen` from `menuBlocks`); the shake still passes, as it does through `HoldableCamera`.
- Files: `feel/PunchCurve.ts` (envelope, sizes, `momentPunch`, `punchDepth`, `kickArgs`), `fx/c/Trauma.ts` (shape and world scale per kick; `dollyWorld`), `fx/c/SpectacleRules.ts` (`planHit` reads `flags.feel`; new `HitPlan.kickMode`), `fx/c/SpectacleFx.ts` (one call), `BattleMoments.ts` (two lines).

### (b) The short hit-stop, `?hitstop=short`

- It **extends** the stop that exists (`planHit.freezeMs` -> `HitStop` -> the presenter's `holdBlow` wait); there is no second one. `short` replaces today's 40/28 ms on an ordinary first blow, the 85/55 ms heavy stop and the demo's power-scaled 17 to 150 ms with: **50 ms (3 frames at 60 Hz) on a crit and on a boss's headline move, 67 ms (4 frames) on the last blow of an Overdrive or Special, 0 on everything else** (an ordinary blow, an overkill that is not a crit, the middle of a flurry). `off` removes the stop.
- It is REAL time: 50 ms is 3 frames at 60 Hz and 7 at 144 Hz. REDUCE MOTION, `fast` and `skip` playback stop nothing (planHit's rules, unchanged).
- **Boss big attacks** are a short `[ours]` list by ability id (`feel/HitStopShort.BOSS_BIG_MOVES`): Seymour Flux's `lance-of-atrophy` (the one move `TelegraphHold.ts` already marks as his headline), `cross-cleave`, `total-annihilation`; Bahamut's `impulse` and `mega-flare` (the ids the engine's events carry: the first browser run found the enemy data file's `x2-bahamut-*` ids are not what an event holds, so Impulse got no stop). A flag from a foe's own blows only (`presenterHooks`: the acting id is kept; under FFX-2's ATB another actor's blow can land while a boss move is the latest opened).
- When BATTLE SPECTACLE is OFF there is no field to hold, so `short` does nothing and the presenter's own `holdBlow` keeps today's rule (the demo motion's).

### (c) The rumble, `?rumble=on`

- `feel/Rumble.ts` (patterns, pure) -> `feel/FeelHooks.ts` (the presenter's gates; called from `presenterHooks.fxActionOpen/fxHit/fxVictory`) -> `app/gamepadRumble.ts` (the page: `vibrationActuator.playEffect('dual-rumble', ...)`).
- Pulses: a crit or heavy blow dealt 110 ms (weak 0.2, strong 0.35), taken 160 ms (0.3, 0.5); a boss headline move taken 200 ms (0.4, 0.6); an Overdrive or Special opens with a 140 ms soft thud (0.15, 0.3); the last blow of an Overdrive 240 ms (0.4, 0.7); Mega Flare's last blow 420 ms (0.5, 0.8); the win 160 ms then a 360 ms swell (0.25/0.35, then 0.3/0.5). Middle blows of a flurry are silent. Nothing above 0.8, nothing over 600 ms.
- Gates, all of which must hold: the switch is on in the running chapter; playback is `normal`; REDUCE MOTION is off (the presenter's flag and, again, the page's `prefersReducedMotion`); the last thing the player pressed was a PAD (`inputDevice.padActive`: **never on keyboard play**, whatever is plugged in); a connected pad has a `vibrationActuator.playEffect`; the last pulse is not still playing. Every Gamepad API call is guarded (Firefox and Safari have no actuator: silence; a pad that vanishes mid-pattern: a swallowed rejection). `rumbleLog()` says why a pulse did not play.
- **Not verified on a real pad** (no pad in the tests): the browser exercise used a scripted pad with a recording actuator, so the Gamepad API contract is checked, not the motors.

### (d) The contact shadow, `?shadow=follow`

- Found: the shadow is a disc under the actor group and slid with the figure at **0.55 of the offset** (`shadow.position.x = ox * 0.55`), so on a 1.4 to 4 unit lunge it trailed the boots by up to 45 percent of the lunge. `follow` puts it under the boots at every frame (a lying body keeps today's 0.55 for its swing about its feet), and adds `feel/ContactShadow.ShadowFollow`: a smoothstepped shrink (35 percent) and fade (45 percent) by how far the figure is off the ground **by a hop (and by any lift channel added to `shadowLift` later)**, and a landing spread of up to 16 percent (a quarter of it at least) that decays over 70 ms of FIELD time (a hit-stop holds it; 60 and 144 Hz agree). A boss's steady hover is not counted, so a hovering Seymour's resting shadow is untouched (today's hover shrink stays).
- **Merge note for the motion-curves lane:** when it adds a lunge arc (`lungeLift` into `oy`), pass it in the one place that feeds the shadow: `this.shadowAir.step(dt, this.hopHeight, ...)` in `PaintedActor.update` (the "contact shadow reacts to squash and hop" block); the shadow will then shrink and fade with the arc and spread when it lands.

### (e) REDUCE MOTION

`planHit` returns zero stop, zero shake and zero kick under it, in every mode (tested for 3 x 3 mode pairs); `StillCamera.punch` passes 0 for the moment punch; the rumble hook and the page sink both refuse it; the figure's own hit jitter (`actor.still`) was already off. **Characters still move**: nothing in this lane touches a lunge, a hop or a pose under REDUCE MOTION. (Today's REDUCE MOTION does trim some character motion: `calmLunge` halves the extra reach, the wind-up painting is skipped, the FFX-2 run-in is off. That is existing behaviour and not Bailey's new wording: see the open question.)

### (f) 120 Hz and above

Read every `+= <constant>`, every frame-counted list and every `1/60` in the update loops of `src/engine`, `src/app` and `src/ui`. Two things ran per DRAWN frame, both fixed:

1. `BattleCamera`'s shake advanced its phase by 0.9 **per frame** (54 rad/s at 60 Hz, 108 at 120 Hz, 130 at 144 Hz: a shake twice as frantic on the booth monitor; and it kept advancing through a hit-stop). Now `dt * 54` in `update`: identical at 60 Hz, identical in time at every rate, and still during a stop.
2. Option C's 2-frame ink-and-paper **impact frame** was a list that lost one entry per drawn frame (33 ms at 60 Hz, 17 at 120, 14 at 144). Now `fx/c/SpectacleImpact.ImpactFrames`: each level stays one 60 Hz frame of real time and never less than one drawn frame, so 60 Hz draws exactly the two frames it drew (jitter included), 30 Hz still draws both, 120 and 144 Hz draw about 33 ms.

Already time-based (read, not changed): tweens, `damp` / `approach`, the pose blend (real clock), `Trauma` (kick, shake, decay), `HitStop` (ms of real time), `stepCEnergy`, the lift decay, the rig dynamics, the damage numerals. **Known and NOT fixed here:** chained tween legs lose the leftover of the frame in which a leg ends (`PaintedActor.lunge` is three legs joined by `.then`), so a lunge lands up to one frame late per leg at 60 Hz and less at 144 Hz; the motion-curves lane's sampled timeline replaces those legs (MAP section 10c), so it is not patched in `Tween`. Its size is measured below.

## Files

New: `src/engine/feel/{FeelSwitch,PunchCurve,HitStopShort,Rumble,FeelHooks,ContactShadow}.ts`, `src/engine/fx/c/SpectacleImpact.ts`, `src/app/gamepadRumble.ts`, `src/debug/feelApi.ts`. Changed (small): `fx/c/{Trauma,SpectacleRules,SpectacleFx,presenterHooks}.ts`, `BattleMoments.ts` (2 lines), `BattleCamera.ts` (net -3 lines), `PaintedActor.ts` (+5 lines, 2,473), `app/screens/{BattleScreen,battleSpectacle}.ts`, `main.ts`. Every file touched that was under 400 lines still is (SpectacleFx 397, BattleCamera 397). Shared contract files: none touched, so no `CONTRACT-CHANGES.md` entry. Tests: `tests/unit/feel-{switch,punch,stop-rumble,shadow,120hz}.test.ts`.

## Review class (`critic/policy.json`)

`BattleMoments.ts` is the deep `battle-presenter` class (deep review AFTER the deploy; CHK-026/027 required) and `presenterHooks.ts` / `fx/c/*` / `BattleCamera.ts` / `PaintedActor.ts` fall to focused (`BattleCamera.ts` with CHK-027). Nothing here touches the save schema (no `Settings` field: URL switches only), so there is no deep-before-deploy obligation. Run `node tools/critic-plan.mjs --paths <files>` for the exact plan. With every switch off the live game is unchanged, which is the argument for merging it dark.

EVIDENCE_PLACEHOLDER

## Open questions (for the driver, not for Bailey tonight)

1. **Does the A/B include the shake?** Under `?punch=new` the trauma shake is today's. Bailey's words list "moment punch 0.11 + spectacle kick + shake" as today's camera and "a subtle 2-3 percent zoom-and-settle punch" as the new one. If the new one should also be quieter in shake, `?fxdial=shake:0.5` does it live; the planner can bake a number in if he wants.
2. **Per-game numbers.** The sources are silent for both games, so the numbers are one neutral set. Should FFX-2 (pink, quick) get a slightly shorter stop or a smaller punch than FFX (gold, calm), as `SPECTACLE_TUNING` already does for shake and the old stop?
3. **Boss "big attacks".** The list is five ability ids, `[ours]`. Add or remove any (e.g. Bahamut's Curse, Seymour's Flare or Banish)?
4. **REDUCE MOTION and characters.** Bailey's pick says REDUCE MOTION turns off "Shake, punch, freeze, rumble" only and characters still move and smear. Today it also halves the lunge's extra reach (`calmLunge`), skips the wind-up painting and the FFX-2 run-in. Should those change with the motion pass? (Not touched by this lane.)
5. **A live key for the A/B.** The playable A/B is two URLs (`?pack=demo` and `?pack=demo&punch=today`) or `__pyrefly.punchMode('today' | 'new')` from the console. A live key (e.g. F9) would make it instant on Thursday; it is a thing Bailey would see, so it waits for his word.
6. **Rumble on real hardware.** The motors need a real pad in Bailey's hands (Xbox and DualSense pads give `dual-rumble` in Chrome and Edge; DualShock 4 and the Switch pad may differ).
7. **Where is the rumble for the Mega Flare's opening?** The splash cut-in gets the soft 140 ms thud and the last blow the 420 ms swell; the 1.45 s between them is silent. A rising rumble under the effect is easy to add if wanted.
