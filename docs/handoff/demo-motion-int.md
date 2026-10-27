# demo-motion-int: the integration of the motion lanes

Branch `demo-motion-int` in `D:/pyrefly-rig-v2`, from `origin/r62-rc` (c8ecbcb31, release 62, live). Merged in this order: motion-core 3596b0da2, motion-feel a47907f6a, motion-fx f8744101a,
motion-art (dd0989aef, then its later tips 4c21168ad, a698fe8b4, 1ac5b5441 and 6b78aed89 = install r2). **The install lane was STILL installing at 14:55 EDT: merge origin/motion-art once more at the build, then run the art-pin files** (below). motion-rigs is NOT merged (tooling and configs only; the driver installs the rigs). Game case for the whole branch: BOTH games, Chapter I
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
| fx hit-stop, punch, rumble for an Overdrive's first blow, Cross Cleave's first blow (review M2: NOT Mega Flare or Total Annihilation, which feel's own rules stop once: `BattlePresenterBossFx.FEEL_STOPS_IT`) | feel's own rules: the fx beat CLAIMS the damage event (`feel/BlowClaim.ts`) and `planHit` / `rumbleHit` read the claim as "the finisher of a big action" (67 ms, 0.03, the finisher pulse). One stop, not two; every gate stays (REDUCE MOTION, speed, FFX-2 menu, `?hitstop=`, `?punch=`, `?rumble=`) | `fx/c/SpectacleRules.planHit` (`HitInfo.fxBig`), `fx/c/presenterHooks.fxHit`, `BattlePresenterBossFx.bigBlow` |
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

Free keys: `app/Input.ts` maps WASD, arrows, Enter, Space, Z, X, Esc, Backspace, Shift, Tab, Q, E, C, M, V, R, F, PageUp/Down; other screens use P, H, B, L, T, Home; Backquote is the mark key; F6-F8 the look keys. The number row, `-` and `=` are used by nothing. Ctrl/Alt/Meta combinations and text fields are left alone. The board listens in the CAPTURE phase and swallows its own keys (review m2 and m4): they work under the pause screen (whose keyboard claim stops every key before a bubble listener), and a board key no longer counts as "the last input was the keyboard", so pressing `4` does not silence the rumble until the next pad press. A flip outside a fight is remembered for the next Chapter I / IV fight.
The corner label (top right since the review fix m3: bottom left it covered the FFX `Y DEFEND` chip and the results and defeat pad strips at 1440p; at 2560 x 1440 and 1600 x 900 it now clears every HUD element of both chapters, the results and the defeat page) shows every value (green = new), flashes the one just flipped, and says whether the fight is live (Chapter I / IV) or not. `window.__pyrefly.switchboard()` returns the state, `switchboardPress(code)` presses a key (for checks).
Not on the board on purpose: `?timing=` (the 120 Hz fix for the camera shake and impact frame) stays off the board: it is a fix, not a look to judge (it was with the pack until 2026-10-26; it is on in every chapter now, `?timing=frames` is the off word, `post-shake-time.md`). `?fxoff=bosses,openings,banner,slab,status` still switches fx's pieces off one by one by address.

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
- New test file `tests/unit/engine/demo-motion-int.test.ts` (25 tests): the shared gate, the lunge, smear and landing beats on the real actor, the claim (also through the real presenter), the menu rule on the short stop and the fx pieces, the gather, the switchboard model and key map (no key the game uses), the Tidus server's routing.
- Targeted vitest (524 files: `tests/unit/engine`, `tests/unit/rig`, `feel-`, `fx-`, `spellfx`, `critic-continuity`, `demo`, `presenter`, `battle-screen`, `pose`, `rig-`, `smear`, `curves`): 511 pass. The lanes' own test files pass unchanged. The only failures are the art lane's old pins, see item 4 below. `vitest-targeted.txt`.
- **Full suite on the tip (1588 files, run in 16 chunks of 100 with a RAM guard, `vitest-final.txt`)**: every file passes except (a) nine tests in seven files that pin the art lane's installs (item 4) and (b) one failure of MINE the suite found: `ui-pause-stack` (the pause root must be the highest explicit z-index; the switchboard label had 2147483000). Fixed in 1c39b7e23 (the label is 998, under the pause screen's 999 and over every HUD layer; the label hides while the pause screen is up, the keys still work). The art lane's second install (6b78aed89, Yuna's follow and the White Mage victory back to the colour lock) cleared `pose-scale-art` and `pose-gate-art`, which had failed for about 20 minutes while the mirror was ahead of the pushed rows (`vitest-art-r2.txt`).
- Real-input smoke (headless Chromium on the real GPU, 1600 x 900, real keys from the title through the demo picker; Vite on :5320 started and stopped by PID; RIG-RECORD held per job; **0 console errors in every run**):
  - `?demo=1&pack=demo&switchboard=1`, Chapter I (seymour-flux) and Chapter IV (ffx2-bahamut): to the first player menu, 7 to 8 Attack actions, every switch flipped (keys 1 2 3 4 5 6 7 9 -) and the master key `0` three times: every press changed the state (11 of 11 and 12 of 12), the label showed it, `=` hid and showed it. Motion-sound beats appear in the log with sounds on (a boss lunge with heft 0.88, smears, landings, casts) and none are added while sounds are off; 1 to 28 planned smears per fight. `smoke-board2/results.json`, screenshots `smoke-board2/*.png`.
  - `?demo=1` only (no switches), both fights, 4 actions each: every gate off (curves, smear, moments, fx today; punch and stop today, rumble, shadow, sounds and timing off), 0 smears logged, 0 motion beats, the switchboard not installed. `smoke-off/results.json`.
  - Tidus: key `8` reloads with `tidus=t2`; `/art/characters/tidus/idle.png` then answers `X-Pyrefly-Tidus: t2` with 675,992 bytes (T1: 685,823), the label reads T2; key 8 again returns to T1. `smoke-tidus/results.json`.
  - The Overdrive opening, Chapter I, through the real presenter (`fxPlay`), sampled every animation frame: with the pack Tidus's scale falls to 0.9576 over 1.2 s (the gather), springs to 1.0268 with 0.082 units of lift and settles to 0.986; the strike follows at 3.3 s as before. With `?curves=today` the scale stays 0.98 to 1.03 (idle breath) and the lift is 0. The whole move is 5.9 s in both, 6.4 s with everything today. `overdrive/results.json`, `overdrive/new/s*.png`.
- **"With no switches Chapter I and IV behave as release 62"**: the exact-120 Hz recorder (fake page clock + manual rAF, real keys) ran the same scripted fight on an extract of `origin/r62-rc` (`r62src`) and on this tree with no switches and with the pack plus the master key (everything today). The sequence of every pose change and every HP change of every actor is IDENTICAL in all three, frame for frame inside the deterministic part of the fight: Chapter IV, all 60 events (the all-today run 0 frames off r62; the plain run has one boss pose change 6 frames earlier at the very start); Chapter I, identical up to the voiced line of the first Zombie, after which the whole second action is shifted by a constant (8 frames plain, 300 frames all-today: the voiced line's own length varies from run to run) with identical relative timing. The continuous channels (idle breath, sway) already differ at frame 0 between any two runs of the same tree (the page clock's phase), so they were not compared. `trace-*/`, `compare-events.mjs`.

### Re-check after the power cut (2026-10-22, 14:12 to 15:02 EDT; the work had been pushed at bc7e01157; the cut killed the full-suite run at its eighth chunk)

- Merged `origin/motion-art` again (1ac5b5441, then 6b78aed89: install r2); both clean, rows only. `tsc` clean, orphans the same 24.
- The full suite ran again from the start on the new tip (the numbers are in the "Full suite" bullet above).
- Real-input smoke again on the tip (headless Chromium, 1600 x 900, Vite on :5320 stopped by PID, RIG-RECORD per job): `?demo=1&pack=demo&switchboard=1`, Chapter I: 11 of 11 flips changed the state, Chapter IV: 12 of 12, `=` hid and showed the label, 0 console errors; Tidus key `8` T1 to T2 to T1 (the art server answers 685,823 bytes for T1 and 675,992 for T2); `?demo=1` only: every gate off, the board not installed, 0 console errors. The one console WARNING in every run (`[fx-b] depth plates unavailable ... cannot be decoded`, release 62's `LivingPaintings`) is in the first-run results too; it is release 62's own loader asking for `fx/<room>/depth.png`, which neither art folder (r59 or the motion mirror) holds (checked: the files are absent in both), so the dev server has no plate to decode; none of the lanes touch it. `smoke-final-*/` in the scratch folder.

## Fixes from the adversarial review of 813c364f3 (2026-10-22, evening; the review is in D:/Tools/pyrefly-scratch/2026-10-22/motion/int/review/REVIEW.md)

Game case for every fix: BOTH games (shared presentation plumbing), Chapter I (FFX) and Chapter IV (FFX-2) only, behind the same switches; with no switch named the game is release 62 (the review's differential runs; unchanged by these fixes, which sit behind the pack).

| finding | fix | evidence |
|---|---|---|
| **M1** (major) every turn start played a landing thud | the turn-start leap under the curves lands with a squash of 0.011 (was 0.015), a sound strength of 0.18 under feel's floor of 0.2 (`PaintedActor.playCue('step')`). Chosen over raising the floor so the feel lane's own test (`feel-motion-sfx`, strength 0.2) stays unchanged; the visual difference is 0.4 percent of the figure | pad runs, Chapter I and IV with the pack: 0 of 10 menu opens followed by a footstep (was 10 of 10 and the same in IV); 10 landings of 0.183 refused as 'small', the real landings (0.30 to 0.53) still play. `pad-fix-ch1/`, `pad-fix-ch4/` |
| **M2** (major) Mega Flare stopped twice and swelled twice | the fx beat's claim is skipped for Mega Flare (`mega-flare`, `x2-bahamut-mega-flare`) and Total Annihilation: feel's own rules stop them once (Mega Flare is a Special: its last blow, 67 ms, a 420 ms swell; Total Annihilation is a headline move: its first blow, 50 ms). The beat itself still fires (the fx lane's hooks and tests are unchanged: `fx-boss-presenter` passes). Cross Cleave keeps its claim | real Chapter IV fight at 60 Hz: the Mega Flare at 198.3 s has ONE stop (67 ms on Paine, the last blow, 3 of 3) and ONE 420 ms swell (was two of each, 484 ms apart). `cap-fix-ch4-60/` |
| m1 a sourceless poison tick after a boss headline move read as its blow | `fx/c/presenterHooks.fxHit`: under the motion program's switches a damage event with no `sourceId` takes no action's facts (no `bossBig`, no `big`); with every switch at today the old reading stands | unit test (`demo-motion-int-review`) and the Chapter I capture (below) |
| m2 board keys dead under the pause screen | the board's keydown listener is a capture listener | `switch/results.json`: `keyWorksUnderPause: true` in both chapters (was false) |
| m3 label covered real hints | the label sits at the top right | screenshots `switch-ch1-label.png`, `switch-ch4-label.png`, `fix-ch1-01-first-menu.png`, `fix-ch1-03-after-fight.png` at 1600x900 and 2560x1440 |
| m4 a key press silenced the rumble | the board swallows its keys (see m2) | unit test (`demo-motion-int-board`): the game never hears a board key. Pressing a NUMBER key is therefore no longer a keyboard press; any OTHER key still turns the rumble off until the next pad press (feel's rule) |
| m5 nine art-pin tests fail | NOT touched: the pins belong to the art lane and need Bailey's yes to move (INSTALL notes); the eight in the targeted run are the same eight, plus `exp-leblanc` (Paine's Warrior attack painting changes Chapter VI too) | `int2/vitest-targeted2.txt` |
| m6 the Overdrive gather ends in a landing thud about 0.75 s before the opening pulse | NOT changed: for Bailey's ear (the sound pack judgement), disclosed | |

New tests: `tests/unit/engine/demo-motion-int-review.test.ts` (M1, M2, m1) and `tests/unit/engine/demo-motion-int-board.test.ts` (m2, m4; jsdom). All of them fail on the 813c364f3 code and pass now.
Left as disclosed (not a regression): an Overdrive's first blow is claimed and its last blow gets feel's finisher rule, so a multi-blow Overdrive stops (67 ms) and pulses at both (the review's "Overdrive case", open item 2 below). Total Annihilation now stops at its FIRST blow (50 ms, feel's headline rule) rather than its fifth (the fx lane's intent); one constant if Bailey wants the fifth.

### Checks after the review fixes (2026-10-22, 16:50 to 17:30 EDT; scratch under D:/Tools/pyrefly-scratch/2026-10-22/motion/int/review/, tags fix-*, and int2/)

- `tsc --noEmit` clean; orphans: the same 24, none new. Targeted vitest (227 files: `tests/unit/engine`, `rig`, `feel-`, `fx-`, `spellfx`, `critic-continuity`, `demo`, `presenter`, `battle-screen`, `smear`, `curves`, `ui-pause-stack`): 2,999 passed, 8 failed, the same eight art-pin tests as before (m5); the lanes' own files pass unchanged. The rest of the suite was not re-run (the fixes touch five source files; the full suite ran on 1c39b7e23).
- Real input, headless Chromium on the real GPU, Vite on :5320 started and stopped by PID, RIG-RECORD per job, 0 console errors in all five: `switchtest` (22 presses per chapter flipped exactly their own piece, the label told the truth, modified keys inert, the menu stayed open, no leak into Chapters II and V, `keyWorksUnderPause: true`); `padplay` Chapter I and Chapter IV (title, picker, fight by pad, results, thanks card, back to the picker; 0 of 10 turn starts played a footstep); `capture` at an exact 60 Hz, Chapter IV (216 s, the whole fight: one stop and one 420 ms swell for the Mega Flare) and Chapter I (212 s: no stop and no pulse for the poison ticks after a boss headline move).

## Open items and what is not done

1. **The Overdrive opening has no smear.** The fx lane's `od-open` beat calls `anticipate` and `smear`; `anticipate` is wired (the gather). The smear needs a swap to ride: the Overdrive's key painting is cut in at the action's start (`KeySlots.showOdOnOpen`) before the beat, at rest, and core's planner refuses a figure at rest (`MIN_SPEED`). I did not invent a pose swap or a pure streak for it; it would be a new look Bailey should see first (rule 9).
2. **The fx beats' hit-stop, punch and rumble hooks are deliberately not registered** (the claim path replaces them, see "The adapters"). Bailey's numbers sit in feel's rules; a claimed blow gets 67 ms, 0.03 and the finisher pulse. An Overdrive's first blow now stops and its last blow stops (feel's rule); a one-blow Overdrive stops once.
3. **No separate contact sound** (feel's design: the hit sound is there; core already leads the attack cue to the contact).
4. **Art pins (re-counted at 6b78aed89: nine tests in seven files).** `exp-leblanc` is NEW since the first count: "Chapter VI is unchanged" pins the sha256 of every Chapter VI painting against the release tree, and the art lane replaced `paine-warrior/attack.png` (a head retouch, its pick; INSTALL-v2.md row 1). Art is per character, so Paine's Warrior painting changes in Chapter VI (FFX-2) too, outside the two demo chapters; that is a decision for the driver and Bailey, not an integration fault. Before: eight tests in six files fail because the art lane's installs moved what they pin, not because of the integration: `pose-install-0926` (2) and `-0930` (1) (the locked hashes; the lane disclosed these three), `held-defend-ffx` and `-ffx2` (a Defend painting of Tidus and one of Rikku Dark Knight is now installed and registered where the test says the table has no Defend row for a held one), `pose-stature-hold` (2: Yuna's and Tidus's hurt readings moved) and `critic-continuity-pose-motion` (1: the nine holds' ratios in pose-measure.json). `pose-gate-art` and `pose-scale-art` pass at the latest art tip (they failed while the mirror was ahead of the pushed rows). The pins need moving, or the lane's rows reconciling, with Bailey's yes; I changed none.
5. **Tidus T2 is the stash's older set.** T2 answers from `D:/pyrefly-art-motion-t2-tidus-stash` (14 paintings, its idle the shorts repaint). The T1 mirror has had later GPU waves (tidus/defend, od-energy-rain, od-slice-and-dice and the earlier attack, cast, hurt, item) that T2 does not carry. The registration rows are identical, so nothing breaks. Only the dev server and `vite preview` of `vite.demo.config.ts` do the switch; a production build ships T1 only.
6. **Not testable here:** a pad's rumble (no pad, headless: the log stays at 0; the pad-side sink is feel's own tested code), 120 Hz on a real display (headless is 60 Hz; the stepped recorder proves the logic at 120), hearing any of the sounds, and whether the gather and the shadow read well to Bailey's eye (his judgement; the numbers and frames are in `overdrive/`).
7. **Shadow on a landing** can stack core's squash spread (about 20 percent for a 4 percent squash) with feel's landing spread (up to 16 percent decaying over 70 ms): a blip of about 36 percent on the run-in's landing with both on. Left as is; one constant on either side if it looks like a pulse.
8. **The fx painted finish and the party effects** (`fxNewOn`) are not held under an open FFX-2 menu (only the ADDED looks are): by design, a fight would otherwise change style with every menu.
9. **`public/art` in D:/pyrefly-rig-v2 now points at `D:\pyrefly-art-motion` (T1)**; it was `D:\pyrefly-art-r59`. Restore with `cmd /c rmdir public\art` then `cmd /c mklink /J public\art <target>`. Key 8 reloads the page, so it restarts a demo run: press it at the title or between fights.
10. **Not merged:** motion-rigs (tooling and configs only; the rigs are installed by the driver). No CHANGELOG entry (nothing deploys), no deploy, no review (`critic-plan` would class this DEEP: the presenter, the audio sink and `main.ts` are shared systems).
11. The untracked `.r61-rc-vite-tmp.config.mts` in the tree is not mine. Each smoke job writes and removes `tools/zz-int-5320.tmp.config.mjs`.
