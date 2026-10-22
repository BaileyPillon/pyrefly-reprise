# demo-motion-int: the integration of the motion lanes

Branch `demo-motion-int` in `D:/pyrefly-rig-v2`, from `origin/r62-rc` (c8ecbcb31, release 62, live). Merged in this order: motion-core 3596b0da2, motion-feel a47907f6a, motion-fx f8744101a,
motion-art (dd0989aef, then its later tips 4c21168ad and a698fe8b4; the install lane may push more, so merge origin/motion-art again at the end). motion-rigs is NOT merged (tooling and configs only; the driver installs the rigs). Game case for the whole branch: BOTH games, Chapter I
(`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) only, every piece behind its switch, default OFF.

## Conflicts and how each was resolved (every conflict kept BOTH sides' behaviour)

| merge | file | conflict | resolution |
|---|---|---|---|
| core | `PaintedActor.recoil` | r62's `noteImpact(this, distance >= 0.3)` (the living room's hits) next to core's `smear.hintRecoil(...)` | both lines kept, `noteImpact` first |
| feel | `BattleScreenRunIn.ts` | core's `arcFor(actor, 0.42, ms)` (a leap with the curves, else the hop) vs feel's `motionBeat({kind:'dash'})` + `actor.hop` | feel's dash beat kept, then `arcFor` (so the run-in is a leap under the curves, a hop otherwise) |
| feel | `BattlePresenterSfx.ts` imports | core's `strikeBeatNow` vs feel's `castBeat` | both imported |
| feel | `PaintedActor.update`, the contact shadow | radius: core spreads the shadow on a landing's squash, feel shrinks it in the air and spreads on landing; x: core "under the feet minus the posture lean", feel "all of the offset minus a lying body's swing" | radius = both factors; air = `ShadowFollow.step(dt, hopHeight + cv.lift)` (the sum feel's note asked for once the lunge has an arc); x = core's formula when the curves are on (minus feel's lie term when `?shadow=follow` too), feel's `shadowX` otherwise. Either switch alone does exactly what its lane built |
| feel | `main.ts` | the debug installs of core and feel | all kept |
| fx | `BattlePresenterBeats.ts` imports | core's `actionOfBlow` import vs fx's `chargeFx, odOpening, prerollFx` | both kept (and the `BattlePresenterEvents` import folded to one line: the file was 404 lines after the merge, now 395) |
| fx | `main.ts` | feel's installs vs fx's `installFxNewDebug` | all kept |
| art | none | rows only | clean |

Files git merged without a conflict but where two lanes had edited (re-read after merging): `BattlePresenterBeats.ts` (core's `startAttackMove`/`liftCaster`, fx's `odOpening`/`prerollFx`/`chargeFx`),
`BattlePresenterPorts.ts` (core's optional `strike/liftTo/leap`, fx, r62-extra's +3), `BattleScreen.ts`, `MomentOverlay.ts` (fx's banner), `critic/runner/lib/continuity.mjs` + README (core's CHK-027 block next to PR-0512).

## One shared gate

`src/engine/motion/DemoGate.ts` (new, pure): the ONE chapter variable (`setDemoChapter`), the ONE table of the two demo chapters and their games, the ONE `?pack=demo` reader (`packDemo`).
`CurvesSwitch`, `SmearSwitch`, `MomentsSwitch`, `FeelSwitch` and `FxSwitch` keep their own names, keys, defaults and exports (every lane test file still passes unchanged) and point at it: the three
`setXChapter` functions now write the same variable (the battle screen and the spell layer used to set three copies to the same id). `NewMotionGate.ts` (core's "is any core piece on", the relight
prefetch's gate) is unchanged: it asks the same shared chapter through `CurvesSwitch`.

## The adapters

| adapter | wired to | where |
|---|---|---|
| motion sound: lunge | the strike's wind-up end, aimed at `travelPeak` (the fastest frame), in on-screen ms | `motion/ActorCurves.startStrike` |
| motion sound: smear | the cut (half the window; half the key move for a rig), painting sets and rigs | `motion/SmearDirector.swap`, `rig/RigSmearWindow.begin` (not the knock-out's cut: its own fall sound plays) |
| motion sound: landing | the end of a leap's flight (FFX-2 run-in and run home); a leap cut short never lands | `motion/CurveDriver.LeapRun.onLand`, `PaintedActor.leap` |
| motion sound: cast | unchanged (`playCue('cast')` at the cast's start) | `BattlePresenterSfx` |
| contact | no extra sound, by feel's design (the hit sound is there); core's `strikeBeatNow` already leads the attack cue to the contact | |
| fx Overdrive opening: anticipation | the aura's build is a GATHER with core's leap (crouch 4 percent over 80 percent of the build, then a spring and a 2.5 percent landing squash), only with the curves on, not at fast-forward | `motion/FxWiring.ts`, `installFxWiring()` in `main.ts` |
| fx Overdrive opening: smear | NOT wired (see "Not done") | |
| fx hit-stop, punch, rumble for an Overdrive's first blow and a boss's headline blow | feel's own rules: the fx beat CLAIMS the damage event (`feel/BlowClaim.ts`) and `planHit` / `rumbleHit` read the claim as "the finisher of a big action" (67 ms, 0.03, the finisher pulse). One stop, not two; every gate stays (REDUCE MOTION, speed, FFX-2 menu, `?hitstop=`, `?punch=`, `?rumble=`) | `fx/c/SpectacleRules.planHit` (`HitInfo.fxBig`), `fx/c/presenterHooks.fxHit`, `BattlePresenterBossFx.bigBlow` |
| fx boss-charge pulse | `FeelHooks.rumbleCharge` (same gates) | `BattlePresenterBossFx.chargeFx` |

The adapter's hook signatures gained two OPTIONAL trailing arguments (`actor`, `kind`); the fx lane's tests are unchanged.

### The FFX-2 menu rule (D-357: nothing new plays over an open command menu)

core: smear, cast lift, KO cut and settle, moments (already). feel: the camera punch (already); **now also the short hit-stop** (`planHit`: `menuOpen` holds no frame under `?hitstop=short`) and **the rumble** (`FeelHooks.allowed` reads `menuBlocks`).
fx: **`fxPieceOn(piece)` is false while `MenuHold` holds** (bosses, openings, banner, slab, status: the ADDED looks); the painted finish of spells that play anyway (`fxNewOn`) is not held, so a fight does not change style with every menu.
Asked when a look begins, like core's.

## The playtest switchboard (`?demo=1&pack=demo&switchboard=1`; nothing installs without both words)

| key | piece | values |
|---|---|---|
| `1` | smear | paint, blur, off |
| `2` | camera punch | new, today |
| `3` | hit-stop | short, today (today = release 62's stop, not no stop) |
| `4` | gamepad rumble | on, off |
| `5` | motion sounds | on, off |
| `6` | spell effects, the bosses' attacks, Overdrive openings (fx) | new, today |
| `7` | the curves (strike, cast lift, recoil, squash, gather) | new, today |
| `8` | Tidus T1 / T2 | reloads the page (see below): press it at the title or between fights |
| `9` | the per-game moments (victory cheer / stand-down, KO cut and settle) | new, today |
| `-` | the contact shadow | follow, today |
| `0` | everything: if all are new, all go to today's; else all go to new | |
| `=` | hide or show the corner label | |

Free keys: `app/Input.ts` maps WASD, arrows, Enter, Space, Z, X, Esc, Backspace, Shift, Tab, Q, E, C, M, V, R, F, PageUp/Down; other screens use P, H, B, L, T, Home; Backquote is the mark key; F6-F8 the look keys. The number row, `-` and `=` are used by nothing. Ctrl/Alt/Meta combinations and text fields are left alone. A flip outside a fight is remembered for the next Chapter I / IV fight.
The corner label (bottom left) shows every value (green = new), flashes the one just flipped, and says whether the fight is live (Chapter I / IV) or not. `window.__pyrefly.switchboard()` returns the state, `switchboardPress(code)` presses a key (for checks).
Not on the board on purpose: `?timing=` (the 120 Hz fix for the camera shake and impact frame) stays with the pack: it is a fix, not a look to judge. `?fxoff=bosses,openings,banner,slab,status` still switches fx's pieces off one by one by address.

### Tidus T1 / T2

The game cannot swap one figure's paintings at run time, but Tidus's registration rows (scale, stance, head) are IDENTICAL in T1 and T2 (only each painting's sha and overlap record differ, and no code reads those), so the whole switch is which FILE answers `/art/characters/tidus/<file>`.
`vite.demo.config.ts` + `tools/vite-art-variant.mjs` do that for the dev server and `vite preview`: `?tidus=t1|t2` on the page sets a cookie, `X-Pyrefly-Tidus: t1|t2` tells the board which one it is looking at, T2 answers from `D:/pyrefly-art-motion-t2/characters/tidus` while that mirror is up, else `D:/pyrefly-art-motion-t2-tidus-stash` (override: `PYREFLY_TIDUS_T2`), a file T2 lacks falls through to T1.
Server: `node node_modules/vite/bin/vite.js --config vite.demo.config.ts --port 5320`.
The two URLs:
- T1: `http://127.0.0.1:5320/?demo=1&pack=demo&switchboard=1&tidus=t1`
- T2: `http://127.0.0.1:5320/?demo=1&pack=demo&switchboard=1&tidus=t2`
Key `8` flips between them (rewrites `tidus=`, sets the cookie, reloads). A PRODUCTION build ships WebP derivatives of T1; to look at T2 in a build, make a build with the T2 folder as `characters/tidus`.
`public/art` in this tree is now a junction to `D:\pyrefly-art-motion` (T1; was `D:\pyrefly-art-r59`).

## Checks (on the pushed tip unless noted; scratch evidence under D:/Tools/pyrefly-scratch/2026-10-22/motion/int/)

- `npx tsc --noEmit`: clean. `node tools/orphans.mjs`: the same 24 old orphans, none of the new modules. New files all under 400 lines (`BattlePresenterBeats.ts` is 395).
- New test file `tests/unit/engine/demo-motion-int.test.ts` (23 tests): the shared gate, the lunge, smear and landing beats on the real actor, the claim, the menu rule on the short stop and the fx pieces, the gather, the switchboard model and key map (no key the game uses), the Tidus server's routing.
- Targeted vitest (524 files: `tests/unit/engine`, `tests/unit/rig`, `feel-`, `fx-`, `spellfx`, `critic-continuity`, `demo`, `presenter`, `battle-screen`, `pose`, `rig-`, `smear`, `curves`): 511 pass. The lanes' own test files pass unchanged. The only failures are the art lane's old pins, see item 4 below. `vitest-targeted.txt`.
- Full suite: see the last section.
- Real-input smoke (headless Chromium on the real GPU, 1600 x 900, real keys from the title through the demo picker; Vite on :5320 started and stopped by PID; RIG-RECORD held per job; **0 console errors in every run**):
  - `?demo=1&pack=demo&switchboard=1`, Chapter I (seymour-flux) and Chapter IV (ffx2-bahamut): to the first player menu, 7 to 8 Attack actions, every switch flipped (keys 1 2 3 4 5 6 7 9 -) and the master key `0` three times: every press changed the state (11 of 11 and 12 of 12), the label showed it, `=` hid and showed it. Motion-sound beats appear in the log with sounds on (a boss lunge with heft 0.88, smears, landings, casts) and none are added while sounds are off; 1 to 28 planned smears per fight. `smoke-board2/results.json`, screenshots `smoke-board2/*.png`.
  - `?demo=1` only (no switches), both fights, 4 actions each: every gate off (curves, smear, moments, fx today; punch and stop today, rumble, shadow, sounds and timing off), 0 smears logged, 0 motion beats, the switchboard not installed. `smoke-off/results.json`.
  - Tidus: key `8` reloads with `tidus=t2`; `/art/characters/tidus/idle.png` then answers `X-Pyrefly-Tidus: t2` with 675,992 bytes (T1: 685,823), the label reads T2; key 8 again returns to T1. `smoke-tidus/results.json`.
  - The Overdrive opening, Chapter I, through the real presenter (`fxPlay`), sampled every animation frame: with the pack Tidus's scale falls to 0.9576 over 1.2 s (the gather), springs to 1.0268 with 0.082 units of lift and settles to 0.986; the strike follows at 3.3 s as before. With `?curves=today` the scale stays 0.98 to 1.03 (idle breath) and the lift is 0. The whole move is 5.9 s in both, 6.4 s with everything today. `overdrive/results.json`, `overdrive/new/s*.png`.
- **"With no switches Chapter I and IV behave as release 62"**: the exact-120 Hz recorder (fake page clock + manual rAF, real keys) ran the same scripted fight on an extract of `origin/r62-rc` (`r62src`) and on this tree with no switches and with the pack plus the master key (everything today). The sequence of every pose change and every HP change of every actor is IDENTICAL in all three, frame for frame inside the deterministic part of the fight: Chapter IV, all 60 events (the all-today run 0 frames off r62; the plain run has one boss pose change 6 frames earlier at the very start); Chapter I, identical up to the voiced line of the first Zombie, after which the whole second action is shifted by a constant (8 frames plain, 300 frames all-today: the voiced line's own length varies from run to run) with identical relative timing. The continuous channels (idle breath, sway) already differ at frame 0 between any two runs of the same tree (the page clock's phase), so they were not compared. `trace-*/`, `compare-events.mjs`.

## Open items and what is not done

1. **The Overdrive opening has no smear.** The fx lane's `od-open` beat calls `anticipate` and `smear`; `anticipate` is wired (the gather). The smear needs a swap to ride: the Overdrive's key painting is cut in at the action's start (`KeySlots.showOdOnOpen`) before the beat, at rest, and core's planner refuses a figure at rest (`MIN_SPEED`). I did not invent a pose swap or a pure streak for it; it would be a new look Bailey should see first (rule 9).
2. **The fx beats' hit-stop, punch and rumble hooks are deliberately not registered** (the claim path replaces them, see "The adapters"). Bailey's numbers sit in feel's rules; a claimed blow gets 67 ms, 0.03 and the finisher pulse. An Overdrive's first blow now stops and its last blow stops (feel's rule); a one-blow Overdrive stops once.
3. **No separate contact sound** (feel's design: the hit sound is there; core already leads the attack cue to the contact).
4. **Art pins.** Eight tests in six files fail because the art lane's installs moved what they pin, not because of the integration: `pose-install-0926` (2) and `-0930` (1) (the locked hashes; the lane disclosed these three), `held-defend-ffx` and `-ffx2` (a Defend painting of Tidus and one of Rikku Dark Knight is now installed and registered where the test says the table has no Defend row for a held one), `pose-stature-hold` (2: Yuna's and Tidus's hurt readings moved) and `critic-continuity-pose-motion` (1: the nine holds' ratios in pose-measure.json). `pose-gate-art` and `pose-scale-art` pass at the latest art tip (they failed while the mirror was ahead of the pushed rows). The pins need moving, or the lane's rows reconciling, with Bailey's yes; I changed none.
5. **Tidus T2 is the stash's older set.** T2 answers from `D:/pyrefly-art-motion-t2-tidus-stash` (14 paintings, its idle the shorts repaint). The T1 mirror has had later GPU waves (tidus/defend, od-energy-rain, od-slice-and-dice and the earlier attack, cast, hurt, item) that T2 does not carry. The registration rows are identical, so nothing breaks. Only the dev server and `vite preview` of `vite.demo.config.ts` do the switch; a production build ships T1 only.
6. **Not testable here:** a pad's rumble (no pad, headless: the log stays at 0; the pad-side sink is feel's own tested code), 120 Hz on a real display (headless is 60 Hz; the stepped recorder proves the logic at 120), hearing any of the sounds, and whether the gather and the shadow read well to Bailey's eye (his judgement; the numbers and frames are in `overdrive/`).
7. **Shadow on a landing** can stack core's squash spread (about 20 percent for a 4 percent squash) with feel's landing spread (up to 16 percent decaying over 70 ms): a blip of about 36 percent on the run-in's landing with both on. Left as is; one constant on either side if it looks like a pulse.
8. **The fx painted finish and the party effects** (`fxNewOn`) are not held under an open FFX-2 menu (only the ADDED looks are): by design, a fight would otherwise change style with every menu.
9. **`public/art` in D:/pyrefly-rig-v2 now points at `D:\pyrefly-art-motion` (T1)**; it was `D:\pyrefly-art-r59`. Restore with `cmd /c rmdir public\art` then `cmd /c mklink /J public\art <target>`. Key 8 reloads the page, so it restarts a demo run: press it at the title or between fights.
10. **Not merged:** motion-rigs (tooling and configs only; the rigs are installed by the driver). No CHANGELOG entry (nothing deploys), no deploy, no review (`critic-plan` would class this DEEP: the presenter, the audio sink and `main.ts` are shared systems).
11. The untracked `.r61-rc-vite-tmp.config.mts` in the tree is not mine. Each smoke job writes and removes `tools/zz-int-5320.tmp.config.mjs`.
