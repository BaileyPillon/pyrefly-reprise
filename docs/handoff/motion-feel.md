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
- **Boss big attacks** are a short `[ours]` list by ability id (`feel/HitStopShort.BOSS_BIG_MOVES`): Seymour Flux's `lance-of-atrophy` (the one move `TelegraphHold.ts` already marks as his headline), `cross-cleave`, `total-annihilation`; Bahamut's `impulse` and `mega-flare` (the ids the engine's events carry: the first browser run found the enemy data file's `x2-bahamut-*` ids are not what an event holds, so Impulse got no stop). Each blow reads the action of its OWN source (`presenterHooks`: the latest action of each actor is kept): under FFX-2's Active ATB another actor's action opens before a boss move's blows land (the second browser run: Impulse's three blows landed after Rikku's attack had begun), so "the latest opened action of all" named the wrong one. FFX's CTB plays one action at a time, so it is unchanged by construction; the spectacle's own `big` flag keeps reading the latest opened action unless a feel switch is on (the live game is unchanged). A headline move that hits several targets stops, punches and rumbles ONCE, on its first blow.
- When BATTLE SPECTACLE is OFF there is no field to hold, so `short` does nothing and the presenter's own `holdBlow` keeps today's rule (the demo motion's).

### (c) The rumble, `?rumble=on`

- `feel/Rumble.ts` (patterns, pure) -> `feel/FeelHooks.ts` (the presenter's gates; called from `presenterHooks.fxActionOpen/fxHit/fxVictory`) -> `app/gamepadRumble.ts` (the page: `vibrationActuator.playEffect('dual-rumble', ...)`).
- Pulses: a crit or heavy blow dealt 110 ms (weak 0.2, strong 0.35), taken 160 ms (0.3, 0.5); a boss headline move taken 200 ms (0.4, 0.6; once per move, on its first blow); an Overdrive or Special opens with a 140 ms soft thud (0.15, 0.3); the last blow of an Overdrive 240 ms (0.4, 0.7); Mega Flare's last blow 420 ms (0.5, 0.8); the win 160 ms then a 360 ms swell (0.25/0.35, then 0.3/0.5). Middle blows of a flurry are silent. Nothing above 0.8, nothing over 600 ms.
- Gates, all of which must hold: the switch is on in the running chapter; playback is `normal`; REDUCE MOTION is off (the presenter's flag and, again, the page's `prefersReducedMotion`); the last thing the player pressed was a PAD (`inputDevice.padActive`: **never on keyboard play**, whatever is plugged in); a connected pad has a `vibrationActuator.playEffect`; the last pulse is not still playing. Every Gamepad API call is guarded (Firefox and Safari have no actuator: silence; a pad that vanishes mid-pattern: a swallowed rejection). `rumbleLog()` says why a pulse did not play.
- **Not verified on a real pad** (no pad in the tests): the browser exercise used a scripted pad with a recording actuator, so the Gamepad API contract is checked, not the motors.

### (d) The contact shadow, `?shadow=follow`

- Found: the shadow is a disc under the actor group and slid with the figure at **0.55 of the offset** (`shadow.position.x = ox * 0.55`), so on a 1.4 to 4 unit lunge it trailed the boots by up to 45 percent of the lunge. `follow` puts it under the boots at every frame (a lying body keeps today's 0.55 for its swing about its feet), and adds `feel/ContactShadow.ShadowFollow`: a smoothstepped shrink (35 percent) and fade (45 percent) by how far the figure is off the ground **by a hop** (the one input is `this.hopHeight`, see the merge note), and a landing spread of up to 16 percent (a quarter of it at least) that decays over 70 ms of FIELD time (a hit-stop holds it; 60 and 144 Hz agree). A boss's steady hover is not counted, so a hovering Seymour's resting shadow is untouched (today's hover shrink stays).
- **Merge note for the motion-curves lane:** when it adds a lunge arc (`lungeLift` into `oy`), pass it in the one place that feeds the shadow: `this.shadowAir.step(dt, this.hopHeight, ...)` in `PaintedActor.update` (the "contact shadow reacts to squash and hop" block); the shadow will then shrink and fade with the arc and spread when it lands.

### (e) REDUCE MOTION

`planHit` returns zero stop, zero shake and zero kick under it, in every mode (tested for 3 x 3 mode pairs); `StillCamera.punch` passes 0 for the moment punch; the rumble hook and the page sink both refuse it; the figure's own hit jitter (`actor.still`) was already off. **Characters still move**: nothing in this lane touches a lunge, a hop or a pose under REDUCE MOTION. (Today's REDUCE MOTION does trim some character motion: `calmLunge` halves the extra reach, the wind-up painting is skipped, the FFX-2 run-in is off. That is existing behaviour and not Bailey's new wording: see the open question.)

### (f) 120 Hz and above

Read every `+= <constant>`, every frame-counted list and every `1/60` in the update loops of `src/engine`, `src/app` and `src/ui`. Two things ran per DRAWN frame, both fixed:

1. `BattleCamera`'s shake advanced its phase by 0.9 **per frame** (54 rad/s at 60 Hz, 108 at 120 Hz, 130 at 144 Hz: a shake twice as frantic on the booth monitor; and it kept advancing through a hit-stop). Now `dt * 54` in `update`: identical at 60 Hz, identical in time at every rate, and still during a stop.
2. Option C's 2-frame ink-and-paper **impact frame** was a list that lost one entry per drawn frame (33 ms at 60 Hz, 17 at 120, 14 at 144). Now `fx/c/SpectacleImpact.ImpactFrames`: each level stays one 60 Hz frame of real time and never less than one drawn frame, so 60 Hz draws exactly the two frames it drew (jitter included), 30 Hz still draws both, 120 and 144 Hz draw about 33 ms.

Already time-based (read, not changed): tweens, `damp` / `approach`, the pose blend (real clock), `Trauma` (kick, shake, decay), `HitStop` (ms of real time), `stepCEnergy`, the lift decay, the rig dynamics, the damage numerals. **Known and NOT fixed here:** chained tween legs lose the leftover of the frame in which a leg ends (`PaintedActor.lunge` is legs joined by `.then`), so the lunge's walk-back starts up to a frame late at 60 Hz and less at 144 Hz; the motion-curves lane's sampled timeline replaces those legs (MAP section 10c), so it is not patched in `Tween`. Measured below: Chapter I's walk-back differs by at most 0.106 world units (16 px at the battle camera, about 12 ms of motion) between 60, 120 and 144 Hz; Chapter IV's matched at all three rates.

**Also found, not a bug of this lane:** option B's living-paintings camera drift (`fx/b/DriftRig.ts`, on in both demo chapters) wanders the live camera by tenths of a world unit and cuts itself to zero whenever the camera moves faster than 0.25 units a second, so every punch and every shot change briefly switches it off and eases it back. It is time-based, so it does not break the 60 / 144 Hz match, but it is why the comparison below turns it off (`__pyrefly.fx.sub('drift', false)`).

## Files

New: `src/engine/feel/{FeelSwitch,PunchCurve,HitStopShort,Rumble,FeelHooks,ContactShadow}.ts`, `src/engine/fx/c/SpectacleImpact.ts`, `src/app/gamepadRumble.ts`, `src/debug/feelApi.ts`. Changed (small): `fx/c/{Trauma,SpectacleRules,SpectacleFx,presenterHooks}.ts`, `BattleMoments.ts` (2 lines), `BattleCamera.ts` (net -3 lines), `PaintedActor.ts` (+5 lines, 2,473), `app/screens/{BattleScreen,battleSpectacle}.ts`, `main.ts`. Every file touched that was under 400 lines still is (SpectacleFx 397, BattleCamera 397). Shared contract files: none touched, so no `CONTRACT-CHANGES.md` entry. Tests: `tests/unit/feel-{switch,punch,stop-rumble,shadow,120hz}.test.ts`.

## Review class (`critic/policy.json`)

`BattleMoments.ts` is the deep `battle-presenter` class (deep review AFTER the deploy; CHK-026/027 required) and `presenterHooks.ts` / `fx/c/*` / `BattleCamera.ts` / `PaintedActor.ts` fall to focused (`BattleCamera.ts` with CHK-027). Nothing here touches the save schema (no `Settings` field: URL switches only), so there is no deep-before-deploy obligation. Run `node tools/critic-plan.mjs --paths <files>` for the exact plan. With every switch off the live game is unchanged, which is the argument for merging it dark.

## Tests and evidence

**Unit tests** (`node node_modules/vitest/vitest.mjs run tests/unit/feel-*.test.ts`): 5 files, 69 tests, all green, plus the existing spectacle, hit-recoil, painted-actor and moments files still green. A mutation check: putting the old `shakePhase += 0.9` back fails the 60 / 120 / 144 Hz camera test and the hit-stop-holds-the-shake test. `npx tsc --noEmit` is clean for everything this lane touches (this tree is sparse and lacks `docs/concepts/pause-until-dawn`, so 26 old `pause-living-portrait` test errors remain; they are not from this branch). `node tools/orphans.mjs`: no module of this lane is an orphan.

**Browser runs** (headless Chromium on the real GPU, 1600 x 900, Vite dev server on :5302 started and stopped by PID, one hold of `RIG-RECORD` per job; the harness is scratch in `D:/Tools/pyrefly-scratch/2026-10-22/motion/feel/browser/`, the frames and traces in `.../feel/evidence/`, the numbers in `docs/screenshots/motion-feel/evidence-summary.json`). Both chapters were reached by REAL KEYS from the title through the chapter board (the lane kit's route), `?pack=demo` in the address.

1. **The punch, in the real renderer, stepped at 1/120 s** (`__pyrefly.simStep`; the idle sway and option B's drift off so the punch is all that moves the camera; a frame captured after every step): `docs/screenshots/motion-feel/punch-ab-chapter-i-seymour-flux.jpg` and `punch-ab-chapter-iv-ffx2-bahamut.jpg` (top row `new`, bottom row today's, at 8, 67, 117, 217 and 433 ms).

   | | camera to the foe | `?punch=new` (0.025) | today (kick 0.05 x 9 units, and the 0.11 moment punch) |
   |---|---|---|---|
   | Chapter I | 19.5 units to Mortiorchis (about 7.8 to 8.3 to the party) | **+2.59 % depth, +2.61 % on-screen height** at 67 ms, undershoot -0.30 %, at rest by 370 ms | +6.35 % at 108 ms, no undershoot |
   | Chapter IV | 15.4 units to Bahamut | **+2.57 %, +2.59 %** at 67 ms, undershoot -0.30 % | the kick alone +3.01 % at 92 ms (the 0.11 moment punch was swallowed: the first command menu was open, the target-frame hold working) |

   So 2.5 percent is 2.6 percent on screen in both chapters, measured from the projected height of the struck figure, and today's big hit is 2.5 times that in Chapter I.
2. **60, 120 and 144 Hz** (the same events stepped as whole frames of the real app at each rate, a macrotask turn between frames so promise chains drain as they do between animation frames; compared at the nine times the rates share, 83.3 ms to 750 ms): the camera's x, y, z and the depth to the foe are **identical at every shared time (difference 0 to 5 decimals)** in both chapters, through a 0.03 punch, a 0.12 `BattleCamera` shake and a 50 ms hit-stop of real time; the hop is identical; a control with no events at all moved the camera 0. The lunge: Chapter IV identical, Chapter I up to 0.106 units (the chained legs, above). The trauma shake's noise is a function of the spectacle's age, so it is compared in the unit tests (`feel-120hz.test.ts`), not across runs.
3. **Real turns at an exact 60 Hz** (Playwright's page clock; Enter or a scripted pad's A pressed at each command menu; the spectacle's `hit` call wrapped to record what each blow asked for; a scripted standard-mapping pad whose `vibrationActuator` records every `playEffect`), the new pack against `?pack=demo&punch=today&hitstop=today&shadow=today&rumble=off` from the same seed:
   - **Chapter I, 45 s, 5 blows.** New: ordinary blows get no stop and no punch. Seymour Flux's Lance of Atrophy on Tidus and on Yuna (the boss headline move) each got a **3-frame stop (50 ms)**, a **camera punch peaking 0.235 and 0.25 world units at 67 ms** (3 percent of the 7.8 and 8.3 unit depth) and a **200 ms rumble** on the pad. Today: every blow stops (17 to 67 ms) and the same two blows 67 ms.
   - **Chapter IV, 60 s, 23 blows.** New: Bahamut's Impulse (three targets, twice) stopped on its first blow only (66.7 and 50 ms measured at the page clock's 16/17/17 ms frames; 50 planned), punched 0.239 and 0.249 units at 67 ms on that blow, and rumbled once per move. An earlier run of the same fight is why two things changed (below): Impulse got nothing at first.
   - **The contact shadow.** Worst distance of the shadow from the figure's boots over the fight: new **0.000** for every figure; today up to 1.07 (Tidus), 0.69 (Yuna) and 1.67 (Seymour Flux) units in Chapter I, 0.12 to 0.34 (the girls) and 1.16 (Bahamut) in Chapter IV. Through the girls' run-in and hops (Rikku, Chapter IV) the shadow shrank to 0.59 of its rest radius and faded to 0.49 of its rest opacity, and spread to 1.14 of rest on landing; today's range for the same figure was 0.84 to 1.04 of rest and 0.81 of the opacity. `shadow-ab-chapter-i-lunge.jpg` shows Tidus's lunge in both (the shadow is faint on the dark floor; the numbers are the evidence).
   - **The win.** With the foes' HP written to 1 (a labelled debug write), the first Attack won the fight and the win's two-segment rumble (160 ms, then 360 ms) reached the pad in both chapters.
   - **Keyboard.** `pack-keys` played the same Lance with its stop and its punch, and the two pulses it asked for were refused (`rumbleLog`: `keyboard`, `keyboard`), 0 actuator calls.
   - **REDUCE MOTION** (the OS media query, as `prefersReducedMotion` reads it): trauma 0, kick 0, no stop, no pulse sent (the presenter's own gate refused, `rumbleLog` empty), and the characters still lunged (the farthest lunge of the run 2.45 units in Chapter I and 1.90 in Chapter IV, against 3.53 and 2.45 without it: today's `calmLunge` trims them; see the open questions).
   - **0 console errors** in the 12 runs whose records are kept (reruns overwrote the earlier ones; no run printed one). Not seen in real play: a critical, an Overdrive, Mega Flare (its countdown did not arrive inside 60 s); those paths are covered by the unit tests and the debug `punch()`.
4. **What the browser runs found and the code now does** (each found by playing the fight, each fixed and covered by a test): Bahamut's headline moves are `impulse` and `mega-flare`, the ids his events carry, not the `x2-bahamut-*` ids of his data file; under FFX-2's ATB a boss move's blows land after another actor's action has opened, so each blow now reads its own source's action; a headline move that hits three targets rumbled six times for two casts, now once per move; my first harness pressed Escape and opened the pause menu, and pressed B on the pad, which cancelled FFX-2's command menu (both harness bugs, fixed in the scratch script).

**Not run:** the full `npm test` (the machine had under 12 GB free); the critic's CHK-026 / CHK-027 on these pieces; a real 144 Hz display (the stepper runs the real app at 1/144 s, a monitor was not available); a real pad in hand.

## Open questions (for the driver, not for Bailey tonight)

1. **Does the A/B include the shake?** Under `?punch=new` the trauma shake is today's. Bailey's words list "moment punch 0.11 + spectacle kick + shake" as today's camera and "a subtle 2-3 percent zoom-and-settle punch" as the new one. If the new one should also be quieter in shake, `?fxdial=shake:0.5` does it live; the planner can bake a number in if he wants.
2. **Per-game numbers.** The sources are silent for both games, so the numbers are one neutral set. Should FFX-2 (pink, quick) get a slightly shorter stop or a smaller punch than FFX (gold, calm), as `SPECTACLE_TUNING` already does for shake and the old stop?
3. **Boss "big attacks".** The list is five ability ids, `[ours]`. Add or remove any (e.g. Bahamut's Curse, Seymour's Flare or Banish)?
4. **REDUCE MOTION and characters.** Bailey's pick says REDUCE MOTION turns off "Shake, punch, freeze, rumble" only and characters still move and smear. Today it also halves the lunge's extra reach (`calmLunge`), skips the wind-up painting and the FFX-2 run-in. Should those change with the motion pass? (Not touched by this lane.)
5. **A live key for the A/B.** The playable A/B is two URLs (`?pack=demo` and `?pack=demo&punch=today`) or `__pyrefly.punchMode('today' | 'new')` from the console. A live key (e.g. F9) would make it instant on Thursday; it is a thing Bailey would see, so it waits for his word.
6. **Rumble on real hardware.** The motors need a real pad in Bailey's hands (Xbox and DualSense pads give `dual-rumble` in Chrome and Edge; DualShock 4 and the Switch pad may differ).
7. **Where is the rumble for the Mega Flare's opening?** The splash cut-in gets the soft 140 ms thud and the last blow the 420 ms swell; the 1.45 s between them is silent. A rising rumble under the effect is easy to add if wanted.

---

# Step 2: the motion sounds and the playable test

Written 2026-10-22 overnight. Bailey, 2026-10-22: "Subtle synced sounds": a whoosh on a lunge and on a smear, a landing thud matched to the squash, a cloth rustle on a cast, from the existing sound library, mixed under the music (he judges by ear on `docs/audio/audition.html`; agents cannot hear, so this note gives measurements and never a verdict on how anything sounds). Also: a playable A/B of today's big-hit camera and the new punch, hit-stop on/off, rumble on/off and motion sounds on/off, and evidence clips of a big hit in each chapter.

## Game case (AGENTS.md rule 14)

**BOTH games, one neutral set, behind a switch; ON only in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2).** Why neutral: the library separates no whoosh, thud or cloth by game. The only game-tagged families it has are the weapon swings (`sfxV2/cues.ts`: FFX's sword, katana, spear, blitzball, staff, doll and claw; FFX-2's gun, daggers and greatsword) and the `-x2` spell twins (`magic-charge-x2`), and both already play on the attack and the cast. `research/*.md` and `research/ffx-vs-ffx2-presentation.md` describe no motion sound for either game (searched: whoosh, thud, rustle, footstep, cloth, foley). So no per-game difference is sourced; `MOTION_GAME_OVERRIDES` (`audio/sfxV2/motionCues.ts`) is where one goes, empty today, and `cueAllowedFor` refuses a v2 cue tagged for the other game (tested). One piece is FFX-2 only in effect: the **dash** (the whoosh of a girl's run in and run home), because only FFX-2 runs in (`research/ffx2-combat-core.md` section 1, D-354); the beat is reported by `BattleScreenRunIn`, which only an FFX-2 chapter has.

## The switch

`?motionsfx=on|off`, and the shared `?pack=demo` (which turns it on, with the other feel pieces, in the two demo chapters). OFF at compile time: no key, no pack, any other chapter, every unit test = silent here and every call a no-op. `?pack=demo&motionsfx=off` is the A/B. `__pyrefly.motionSfx(on?)`, `motionSfxLog(reset?)`, `motionBeat(kind, strength?, heft?, atMs?, ms?)` (plays one beat now), and for recorders `sfxTap()` / `sfxTapLog()` (every `playSfx` ask with the page's clock and what the mixer says it played) and `simNow()`. Gates in force even with the switch on: a chapter with a game voice (`sfxChapter` names it), playback speed `normal` (not fast, not skip), the same beat not inside its gap (lunge 160 ms, dash 200, smear 70, land 100, cast 250), at most three motion sounds in 300 ms (FFX-2's Active ATB overlaps three girls' actions). **REDUCE MOTION does not gate it**: Bailey's pick turns off "Shake, punch, freeze, rumble" only, and a sound is none of them.

## What each sound is (nothing new ships as audio; every number is `[ours]`)

Each beat names a cue of the shipped sprites and shapes it with the mixer's own parameters (`pitch`, `volume`, and the new additive `trimMs` and `fadeMs` of `sfxSource.ts` / `PlaySfxOptions`: a cue cut short must fade or the cut clicks). The pick was made by measuring each cue's shape (`D:/Tools/pyrefly-scratch/2026-10-22/motion/feel/sfx/analysis.txt` has all 273 slices: duration, attack, decay, spectral centroid and flatness), because no one on the team can hear:

| Beat | Cue (first bank) | Shaping | Why it is the closest the library has |
|---|---|---|---|
| `lunge` | `whiff` | pitch 0.80, 360 ms, 120 ms fade, volume 0.42 | the synth design is "cloth and air": band-passed noise (flatness 0.06 to 0.15, centroid 1.7 to 3.8 kHz) that swells over 20 to 60 ms and has faded by 280 ms; 20 percent lower reads as a body, not a blade |
| `dash` | `whiff` | pitch 0.72, 440 ms, 160 ms fade, volume 0.40, cut to the run's own length | the same air, longer, for the FFX-2 run (0.32 to 0.47 s) |
| `smear` | `whiff` | pitch 1.45, 130 ms, 55 ms fade, volume 0.28 | the same air as a quick zip on the cut; halved within 90 ms of a lunge or a dash (one movement, one whoosh) |
| `land` | `footstep` | pitch 1.0, 110 ms, 50 ms fade, volume 0.33 | "one boot on stone": a 110 Hz thump that is 20 dB down by 45 ms (the 338 ms slice is thump plus grit; trimmed to the thump) |
| `cast` | `steal-success` | pitch 1.0, 105 ms, 40 ms fade, volume 1.5 | its first 105 ms are "a quick grab of cloth" (noise, centroid 2.7 to 4.2 kHz, 28 to 39 dB under the jingle that starts at 120 ms); cut before the jingle; the head is quiet, hence the 1.5 |

Planner (`feel/MotionSfx.ts`, pure, tested): strength scales the volume (a lunge 60 to 100 percent over reaches of 0 to 2.4 world units; a landing 45 to 100 percent over hops of 0 to a third of the figure), a heavier body is lower and longer (a boss's lunge 22 percent lower, 10 percent louder and 30 percent longer; its landing 35 percent lower, 15 percent louder, 50 percent longer), and `atMs` ("ms to the visual peak") starts a cue early by its own peak time (measured per cue: 80, 90, 45, 5, 45 ms, scaled by the pitch ratio) but never before now.

**Levels, measured** (ffmpeg EBU R128 and sample peak on the cue as the mixer plays it, SFX bus 0.7 x master 0.9, dry; the game adds a 0.22 hall send to every effect; `sfx/render-cues.mjs`, `sfx/out-planned/measure.json`):

| | peak dBFS | momentary max LUFS (400 ms) | loudest 43 ms dBFS |
|---|---|---|---|
| hit-sword at 0.8 (a Chapter I hit) | -7.1 | -20.1 | -14.8 |
| swing-sword at 0.8 (the attack cue) | -8.0 | -24.6 | -18.6 |
| hit-greatsword at 0.8 (Chapter IV, the recorded original) | -11.6 | -19.9 | -22.3 |
| battle theme (boss-seymour / boss-bahamut) | -7.4 / -6.4 | | -14.3 / -15.0 (average -22.5 / -21.7) |
| **lunge** (strength 1, party) | -13.3 | -28.9 | -26.7 |
| **dash** | -14.1 | -29.0 | -27.3 |
| **smear** | -17.2 | -34.7 | -31.2 |
| **land** | -15.2 | -32.6 | -23.7 |
| **cast** | -19.5 | -36.3 | -32.4 |
| a boss's lunge (heft 0.885) / landing | -12.8 / -14.2 | -27.7 / -31.3 | -26.0 / -21.6 |

So each sits at least 5.7 dB under the hit-sword's peak and 7 dB under its momentary loudness, and its loudest 43 ms is 7 to 18 dB under the theme's. The short ones read low on a 400 ms meter; the peak and the 43 ms columns are the fairer ones for them. (In Chapter IV the recorded greatsword hit is itself quieter, peak -11.6, so the boss's lunge, -12.8, sits only 1.2 dB under it in peak though 8 dB under it in loudness: the first number to look at if the whoosh is too present there.) The levels are single numbers in `motionCues.ts`; a change is a minute.

## Files

New: `src/audio/sfxV2/motionCues.ts` (the table, the game rule, the measured levels), `src/engine/feel/MotionBeats.ts` (the seam, below), `src/engine/feel/MotionSfx.ts` (the planner), `src/engine/feel/MotionHooks.ts` (the presenter's cast beat, `actorHeft`), `src/app/motionSfxSink.ts` (the page side: planner to `audio.playSfx`, the log), `tests/unit/feel-motion-sfx.test.ts` (42). Changed (small): `audio/sfxSource.ts` (+`trimMs`, `fadeMs`, `shapedLength`; a cue with neither is exactly what it was, pinned by a test), `audio/AudioManager.ts` (two optional `PlaySfxOptions` fields), `engine/feel/FeelSwitch.ts` (+`motionsfx`), `engine/PaintedActor.ts` (+3 lines, now 2,475), `engine/BattlePresenterSfx.ts` (+2), `app/screens/BattleScreen.ts` (+3), `app/screens/BattleScreenRunIn.ts` (+4), `main.ts` (+2), `debug/feelApi.ts`, `tests/unit/feel-switch.test.ts`. `docs/audio/audition.html` gains the Motion sounds section (a jump link at the top; the section sits after the music options so the existing page test's order holds) and `docs/audio/candidates/motion-sfx/` holds its 24 clips (676 KB). None of these is a `docs/CONTRACTS.md` file, so no `CONTRACT-CHANGES.md` entry.

## Where each beat comes from today (stable beats that exist in `origin/main`)

| Beat | Reported by | When |
|---|---|---|
| `lunge` | `PaintedActor.lunge` (a rig is a `PaintedActor`, so the bosses too) | the move begins; `atMs` 0.19 of the move (the step's fastest frame: measured in the real game, Chapter I, stepped at 60 Hz, +84 ms of a 440 ms move; the smooth `reachOffset` step), `strength` reach / 2.4, `heft` from `worldHeight` |
| `land` | `PaintedActor.hop`'s `onComplete` (a hop that is killed when the actor is disposed never lands; tested) | the hop comes down: FFX-2's run-in and run-home hops, a dodge, a revive; `strength` = height / (a third of the figure) |
| `dash` | `BattleScreenRunIn.strike` and `.close`, next to `world.smear(...)` | the afterimage streak of the run begins |
| `cast` | `BattlePresenterSfx.playCue` when the cue is `cast` (the one place `actionStart` asks for it) | a cast begins; `heft` from the caster's height |

Not reported today, on purpose or because it does not exist: **contact** (the hit sound is there; a thud on top would only add mud), **the KO fall and lie-down landings** (`ko-fall` already plays and is a body falling), **the return home** (nothing lands), and **the planned smear** (this tree has none: its only smear is the run's afterimage, which is `dash`).

## What to wire when motion-core merges (exactly)

`origin/motion-core` replaces the lunge by a sampled strike and adds planned smears and leaps. Each is one `motionBeat(...)` call from `feel/MotionBeats.ts` (the adapter; its header carries the same table). Motion-core's `heftOf` is `clamp01((h - 1.82) / (4.1 - 1.82))`; mine is `(h - 1.8) / 2.6`; either will do, but use one.

1. **Lunge.** `PaintedActor.strike()` does not call `lunge()`, so the lunge beat is lost under the curves. In `src/engine/motion/ActorCurves.ts` `startStrike` (line 16, next to the `run.on(...)` registrations at lines 21 and 24) add `run.on('windupEnd', () => motionBeat({ kind: 'lunge', strength: plan.distance / 2.4, heft: heftOf(worldHeight), atMs: marks.travelPeak - marks.windupEnd, ms: <the travel's ms> }))`, the marks being `strikeMarks(shape)` in on-screen ms (paced ms divided by `paceRate('action')`; `__pyrefly.strikeMarks(game)` prints both). The whoosh then peaks on the fastest frame before contact, where the smear's cut is.
2. **Smear.** In `SmearLog.noteSmear` (`src/engine/motion/SmearLog.ts:44`) or in `SmearDirector.swap` right after it, add `motionBeat({ kind: 'smear', strength: plan.strength, heft, atMs: plan.cutMs * 0.5 })` (the cut is at half the window, `CUT_AT`). A smear within 90 ms of a lunge or a dash is halved by the planner, so nothing else needs coordinating.
3. **Landings.** `arcFor` sends the FFX-2 run-in through `actor.leap` instead of `hop`, so the hop's landing beat is lost: add `motionBeat({ kind: 'land', strength: options.land / 0.06, heft })` where the leap's flight ends and its landing squash begins (`CurveDriver.LeapRun`, the `landMs` branch). Optional, recommended OFF: the strike's end-of-move landing squash (2 percent: strength 0.33) and the cast lift's release (`LiftChannel.release`, 2.5 percent); they are barely a thud.
4. **Cast.** Unchanged: `playCue('cast')` is still the one call, and `liftCaster` rises at the same moment.
5. **The attack cue's lead.** `BattlePresenterSfx` already reads `strikeBeatNow()` for the attack cue; the whoosh needs nothing from it.

## Playable A/B

`D:/Tools/pyrefly-scratch/2026-10-22/motion/feel/PLAYTEST.md`: the exact addresses and console calls to flip the camera (today / new / off), the hit-stop (today / short / off), the rumble, the shadow and the motion sounds, in Chapter I and Chapter IV; what to watch in each fight; REDUCE MOTION; what could not be checked. The URL keys are pinned by `feel-switch.test.ts`; the console setters are in `feelApi.ts`.

## Tests and evidence

**Unit tests:** `node node_modules/vitest/vitest.mjs run tests/unit/feel-motion-sfx.test.ts` (42; mutation-checked: removing the actor's lunge beat, the mixer's rate arithmetic or the speed gate fails 7 of them) and the rest of the feel files (`feel-switch`, `feel-punch`, `feel-shadow`, `feel-stop-rumble`, `feel-120hz`: 111 tests in all, green). They pin: the switch (default OFF, the demo chapters only, a key beside the pack wins); the cue table against the shipped manifest (every cue exists, its trim fits its slice, every cue fades, none is tagged for the other game); the planner (every gate, the strength and heft shaping, the beat-timing arithmetic, the smear's duck, bounds on every output); the sink (an ask reaches `playSfx` with its options, off = nothing is planned or kept, a throwing context is silence); the mixer (a cue with neither new option starts exactly as before, the trim and fade arithmetic, a looped source is never cut, the synthesised stand-in is shaped too); the REAL `PaintedActor` (a lunge reports itself with its reach, heft and the step's fastest frame; a hop reports its landing when it comes down and not when it is killed) and the presenter's cast hook. `npx tsc --noEmit` is clean for everything this lane touches (26 old `pause-living-portrait` errors remain, as in step 1). `node tools/orphans.mjs`: none of the new modules is an orphan.
**Regression** (targeted, `--maxWorkers=2`; the full `npm test` was NOT run: 7.8 GB of RAM was free, under the 12 GB rule): `tests/unit/engine/`, `r38-*`, `r391-*`, `flash-*`, `fx-*`, `contact-shadow`, `chain-victory`, `audio-*` and the feel files, 205 files. Results: every engine, r38, r391, flash and fx file passes (119 files, 1,488 tests, with `docs/target/` checked out); the first run caught one real defect of mine (the run-in's `headPoint()` call threw on the test doubles of `r38-run-in-staging`; now `actorHeft`, which never throws), fixed and rerun. What failed at first was the sparse worktree, not the branch: this tree checks out only part of `docs/`. With `docs/target` and the `docs/audio` json and markdown checked out (a local sparse setting, not committed) `tests/unit/audio-*` is 828 passed and 2 failed, the two page tests that need mp3 sketches (`docs/audio/candidates/fb-0929`) this tree does not check out; `audio-manifest-io`'s two timing tests, which time out under load, passed on the rerun. None touches this lane's code.

**The real game** (headless GPU Chromium, Vite on :5302 started and stopped by PID, one `RIG-RECORD` hold per job, 1280 x 720, real keys from the title through the chapter board, `?pack=demo`, the page clock stepped at an exact 60 Hz; every fight run twice per variant, the second time capturing, and the first headline blow fell on the same frame in both passes of all four runs; harness in `D:/Tools/pyrefly-scratch/2026-10-22/motion/feel/browser/job-clips.mjs` and `make-clips.mjs`, scratch, not committed):

- **Clips**, `D:/Tools/pyrefly-scratch/2026-10-22/motion/feel/clips/` (9 MB): per chapter (`ch1` = Chapter I, `ch4` = Chapter IV) and window (`bighit` = the foe's first headline blow: Seymour Flux's Lance of Atrophy, Bahamut's Impulse; `party-attack` = the party's first Attack): `chN-<window>-today.mp4` and `chN-<window>-new.mp4` (1280 x 720, 60 fps, with the sound the game asked for in that window rendered offline from the shipped sprites over the chapter's battle theme, dry, at the game's mix; today = `?pack=demo&punch=today&hitstop=today&shadow=today&rumble=off&motionsfx=off`, new = `?pack=demo`), `chN-<window>-today-vs-new.mp4` (silent, today left, new right) and `...-quarter-speed.mp4`; `chN-timing.json` lists every sound with its time, every motion beat and the frame of the blow. Stills: `docs/screenshots/motion-feel/motion-sfx-ch{1,4}-{bighit,party-attack}-today-vs-new.jpg`; numbers: `docs/screenshots/motion-feel/motion-sfx-evidence.json`.
- **The sounds fire on the beats.** Chapter I, Tidus: the swing at the lunge's first frame and the whoosh with it; the lunge's fastest approach frame is +84 ms (19 world units a second) and the whoosh's loudest moment is at +83 ms (1 ms apart). Seymour Flux's lunge: fastest at +66 ms, whoosh peak +103 ms (37 ms after: the cue is 22 percent lower for a boss, so its swell is longer than the wait, it starts at once and that is the limit). Chapter IV, Paine after her run in: fastest +68 ms, whoosh peak +83 ms. The first run read the fastest frame at 84 ms, not the 57 ms I had assumed from the classic curve (the smooth `reachOffset` step), so the code now says 0.19 of the move.
- **Chapter IV in 27 s of the real fight** (ATB, three girls): 12 lunge whooshes, 17 dashes (the run in and the run home), 18 landing thuds, 7 cast rustles; never more than 2 motion sounds in 300 ms, none refused for being too close or too many. The first run (75 s) found that the life layer's turn-start weight shift (a hop of 3.5 percent of the figure) made a landing thud at every turn start; the threshold is now a fifth of a hop, and in the second run 23 of the 41 landing beats were that shift and all 23 were refused (`small`). (The commit message of that fix says 66 beats and 15 of them: the 15 were the beats the first run refused as too close together, not the turn-start ones; the numbers here are the right ones.)
- **The party's attack in Chapter IV reads as one movement:** the run's whoosh at +88 ms, the landing thud and the greatsword swing and the strike's short whoosh together at +432 ms (as she arrives), the recorded hit at +784 ms, the run home's whoosh at +1,048 ms and its landing at +1,312 ms.
- **0 console errors** in all four runs. Today's runs (`motionsfx=off`) planned and kept no motion beat at all (0 beats in 410 and 1,658 frames), which is the off switch working in the real game.
- **Not seen in real play:** a smear (none exists in this tree), a critical or an Overdrive (the unit tests and the debug `punch()` cover those), Mega Flare.

## What is [ours] and what is sourced

Sourced: only the two chapters' ids and games (`data/encounters.ts`), that FFX-2 runs in and FFX does not (`research/ffx2-combat-core.md` section 1, D-354), the game tags of the library's cues (`sfxV2/cues.ts`), and the existing levels of the hits (`audio/sfxV2/parityTrims.ts`, the manifest). **Everything else is [ours]**: which cue stands for which beat, every pitch, volume, trim and fade, the strength and heft curves, the beat gaps (160, 200, 70, 100, 250 ms), the 3-in-300 ms cap, the 90 ms duck, the 0.2 landing threshold, `heftOfHeight`'s 1.8 and 4.4, the lunge's 0.19, the dash's 0.3 of its run, and the target levels (at least 6 dB under the hit's peak, 7 dB under its loudness, inside the music). No source describes a motion sound in either game.

## What is NOT done

- **The smear's whoosh is not wired**: this tree has no planned smear. The sound, the table and the planner exist and are tested through `motionBeat({kind:'smear'})`; the one call at integration is above.
- **Under motion-core's curves the lunge and landing beats are lost until the calls above are added** (its strike and leap replace `lunge` and `hop`). Merging this branch alone loses nothing.
- **Panning:** every sound is centred (the first-bank `whiff` carries its own left to right sweep). A pan from the figure's screen position is easy and not built.
- **A thud on contact, on the KO fall or on the return home**: deliberately not added (see "Not reported today").
- **A live key (F9) for the camera A/B**, **a per-game choice of sounds**, **the sounds' level in the booth's room**: his to say.
- **The sounds themselves:** nobody here has heard them. The clips and `audition.html` are rendered without the game's hall send. No real pad, no 120 Hz monitor.
- **The full `npm test`** (RAM) and **the critic's CHK-026 / CHK-027 and the audio checks** (`critic-plan --paths` says: DEEP review, a focused review of the candidate before the deploy and the deep review on the live build afterwards, because `AudioManager.ts`, `BattlePresenterSfx.ts`, `main.ts` and `motionSfxSink.ts` are shared systems; checks CHK-001, 002, 003, 006, 008, 009, 013, 015 to 017, 019 to 023, 026, 027 and B1). With every switch off the live game is unchanged, which is the argument for merging it dark.
- **D: had 9.9 GB free when this step began (under the 12 GB rule) and 7.5 GB at the end**; this step added about 0.7 MB to the repo and removed its own work files (about 100 MB) as it went.

## Open questions (for the driver, not for Bailey tonight)

1. **Per-game sounds.** The library and the sources give no game difference for a whoosh, a thud or cloth, so both games share one set. Should FFX-2 (pink, quick) get a higher, shorter whoosh and FFX (gold, calm) a lower one? `MOTION_GAME_OVERRIDES` takes it as data.
2. **Which A or B on the audition page.** The B candidates are the one other cue the library offers for each beat at the same measured level; his ear decides, and a pick is one table row.
3. **Landing thuds on the victory hop.** `PaintedActor`'s victory hop (0.13 of the figure, staggered per fighter) makes a quiet thud under the fanfare for each of the three. Wanted? (Motion-core's own victory moments change that beat anyway.)
4. **A thud at contact** (the planted foot of the strike's 5 percent contact squash, motion-core): left out so the hit sound is not muddied; say if he wants it.
5. **The boss whoosh is 37 ms behind its fastest frame in Chapter I** (below the usual 45 ms audio-lead tolerance but the one place it is not on the frame); a smaller pitch drop for bosses (now 22 percent) would pull it in.
6. **In Chapter IV's Active ATB a basic attack makes four or five motion sounds in a second** (the run, the landing, the strike's whoosh, the run home, its landing). They are 8 or more dB under the hits; if it is too busy, the first thing to cut is the run home's whoosh and landing.
