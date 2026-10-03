# r37-mix-polish: MAX mix polish (round 19 polish issues PR-0313 to PR-0320, PR-0327)

Branch `r37-mix-polish` (worktree `D:/pyrefly-fixes-r28`), from `origin/main` c69de96a (the r36fix merge). Not merged, not deployed, not reviewed.
Written 2026-10-03 by one Sonnet agent under the driver's overnight brief. critic-plan class: **DEEP after deploy** (focused review of the candidate
before deploy, live verification, then the deep review on the live build); **not** the save-data class (no `SaveData.ts`, schema, migration or
settings persistence touched), so there is no `-savedata` branch. Paper preflight: `docs/plans/r37-mix-polish-review.md`.

## Items

| Key | Game case | What changed | Proof (real keys, headless GPU, seed 1; frames in `docs/screenshots/r37-mix-polish/`) | Left |
|---|---|---|---|---|
| PR-0313 | FFX-2 only | The shot is not cut while anyone else is acting, is handed back at the first action-start of anyone but its subject, and the presenter holds the next decision until the shot has run (so an enemy action starts after the shot, not inside it). `heldShots.ts`, `shotHold.ts`, `BattlePresenter.play`. | Ch IV 1600x900, per-frame `shot` / `phase`: 4 of 4 changes held and no enemy action inside (`enemyActionPlayedInsideShot []`); Ch XVI 2000x1012 (the chapter of the critic's Ixion hit): 2 shots, none with an enemy action inside. `pr0313-handback-at-enemy-action-start.jpg` is an earlier build's run in which the hand-back fired at Bahamut's action-start (shot until frame 12, master at frame 13 with Bahamut in frame). | none |
| PR-0314 | FFX-2 only | The shot now runs its 1.6 s (D-316) by making the presenter wait for what the shot still needs after a burst (about 1.1 s). A first attempt, skipping the cut when a menu is "due within 1.6 s" read from the party rows' gauges, was measured to be impossible and was withdrawn (see below). | Ch IV 1600x900, 4 changes: held 1600, 1600, 1600, 1617 ms (before: 467 to 583 ms or none), handed back on the idle frame, next menu or action after (`pr0314-shot-holds-1600ms-then-next-decision.jpg`). Ch XVI 2000x1012: 1634 and 1617 ms, one change with no clean frame for Paine (PR-0309's strict check, as r36fix left it). REDUCE MOTION: static cut held 1600 and 1650 ms, no twirl keys. Phone 390x844: no shot, no wait, keys still play on the master. | the phone: see "For Bailey" |
| PR-0315 | FFX-2 only | While a change plays, the plane showing a key is pinned at full and the other at none each frame (`twirl.ts pin`). A key is a cut (`applyPose` on one plane); the double image was the other plane, left at partial or full opacity by a pose crossfade the presenter had already started. | `fx.mix.snapshot().twirl.ghostNow` (the other plane's opacity before the pin) per rAF frame during a change, Ch XI `ffx2-fallen-aeons` 1600x900, pin switched off (`fx.mix.twirlPin(false)`): 1.0 for all 38 twirl frames of one of four changes (0 in the other three); Ch IV: 1.0 in one of three changes with the pin on (`ghost` is read before the pin). With the pin on the other plane is 0 by construction. Unit test `fx-mix-twirl-pin`. | the screenshots at 10 fps do not show the ghost reliably; the number is the proof |
| PR-0327 | FFX-2 only | Keys are fetched and decoded ahead through `prewarmPainted` (shared cache, one file per 250 ms, idle): at battle start only on a desktop full tier (9 files in Ch IV: each girl's own `twirl-start`, `-going` and the girl's `twirl-mid`), else when her Change submenu opens, which also fetches the `-forming` and `-end` of every outfit offered (`CommandMenu.ts` fires `pyrefly:garment-grid`). A change whose keys are not ready within 300 ms plays today's white flash instead of keys that land after the outfit. | Network held 2.5 s on every `twirl-*.png`: `late 1, played 0`, 0 key frames, today's flourish, the change completes. Desktop 1600x900 `prewarmed 9` at battle start, phone 390x844 `prewarmed 0`; `prewarmed` rose by 4 per submenu open. Frame hitch: one long frame in the first 15 s of a battle with prewarm (100 to 233 ms, in 1 of 2 runs) and one without (117 ms): no worse. | cost: about 5 MB at battle start on desktop (see "For Bailey") |
| PR-0318 | both | `ProneLay.setProneAvoid`: the MAX mix hands the HUD's panels (`hudPanels`, moved back by the lens shift) to the place a body is laid when a figure goes down, counted like a standing neighbour, while CHAPTER FRAMING is on. Each party figure also carries where she would lie (`downed.ts`, from her KO painting's measured box, rolled as `restPlacement` sets it down) and the fit ranks poses by it as a SOFT rule (never part of `ok`: as a hard rule Bahamut's BOSS SCALE fell to 0.7 at 2560x1080). `clearance.ts`, `framing.ts` (`FramingReport` moved to `framingReport.ts` for the 400-line rule), `geometry.ts` (`Fig.down`), `MaxMix.ts`. | Ch I seymour-flux, Yuna KO'd by Lance of Atrophy, by keys: body under a panel **24 % (1600x900) and 33 % (2000x1012) before, 0 % and 0 % after** (`fx.mix.bodyAvoid(false/true)`, the body's own rect against every `.ig-stat`, `.ig-ctb`, command and card rect). FFX-2 Ch IV 2000x1012, Yuna KO'd: 0 % off and on (she lies at the left, clear either way). `pr0318-ko-before-after.jpg`. Framing matrix against a control run of the base commit: Yojimbo (3 sizes), Braska, Evrae, Natus, Yunalesca, Ch I Flux and Bahamut 1920x1080 identical in blend, back and lens. | the standing check was already counting the rows (`.ig-stat-list`); only the downed footprint and the body's slide were missing |
| PR-0316 | FFX-2 only | **Not reproduced on this build; nothing changed.** | Ch IV Bahamut first menu, 4 frames each at 1600x900 and 2000x1012, head region: clipped white (min channel >= 235) share 0.000; eye, jaw and crest read (`pr0316-bahamut-head-target-vs-build.jpg`, next to the critic's frame). The r36fix master blends toward today's rig (`blend 0.5`), which moved the lamp off the neck. Turning each mix part off in turn and sweeping the renderer's bloom (strength, threshold, radius) showed the bright band is the painted lamp bank itself, not the bloom pass. | the deep review to confirm |
| PR-0317 | FFX only | **No code change.** Measured: the clip is not the keys (the cast and attack sidecars are within 2 % of the idle's height). It is the action camera's push on Flux plus the master's lens shift (lens y -36 to -43 px moves everything up in every camera). | Over an 80 s Ch I fight, Flux's crown at his highest: 13.3 px from the top at 1600x900 (13.9 px in an earlier run), **3.0 px at 2000x1012 in one run (14.0 px in another), 2.4 to 3.9 px at 1920x1080**: always inside the frame, under the critic's 8 px margin at two of three sizes in some runs (`pr0317-flux-crown-headroom-measured.jpg`). A first attempt that fit the master to the tallest key found no key taller and was removed. | see "For Bailey" |
| PR-0319 | FFX only | **Not reproduced; nothing changed** (low confidence in the report as well). | Ch IX Yojimbo first menu 2000x1012: Ginnem stands on the far platform at about 0.55 of a party member's height, clearly behind the line (`pr0319-ginnem-critic-vs-build.jpg`). | none |
| PR-0320 | FFX-2 only | `html.mix-held` also hides `.coach-mark[data-game='ffx2']` (with the Sensor and intent cards); it is back when the shot hands back. FFX's Auron line (holds for a confirm) is untouched. | The CSS rule by keys: the line visible with the class off, `visibility: hidden` with it on, visible again after (Ch IV 2000x1012). The natural first CHANGE in that chapter skipped the shot (another actor was acting), so no frame has both a held shot and the line: the rule is shown, not the flow. | the line's own timer keeps running while hidden |

## The withdrawn estimate (for the next agent, PR-0314)

`c9bb84a7` first built `atbDue.ts` (skip the cut when another girl's menu is due within 1.6 s, from the party rows' gauges). Measured in Ch IV: the
rows are frozen on screen while a burst plays and jump when it ends (Rikku 47.8 % to 99.99 % in 40 ms, then her menu 50 ms later), because the engine
fast-forwards to the next ready girl or the next enemy move; a try predicted 5.8 s and the menu opened at 0.47 s. The next menu or enemy action begins
almost at once after any burst, so the shot could not be predicted to hold; `0e1cb3f5` replaced it by making it hold. The files are parked in
`F:/pyrefly-parked/2026-10-03/r37-mix-polish/`.

## Commits (no history rewrite)

`c9bb84a7` dressphere first pass (twirl pin, prewarm, late fallback, the menu-due estimate), `b5a2b72c` KO footprint + body avoidance + coach CSS + the paper
preflight, `0e1cb3f5` the presenter hold (replaces the estimate), `59b74180` the eager gate; then this note and the frames.

## Gates

`npx tsc --noEmit` clean. Full `npx vitest run --testTimeout=60000 --maxWorkers=4` at the last code commit `59b74180` (and again at the note's commit): **752 files passed, 5 skipped, 0 failed**
(11,077 tests passed, 40 skipped, 1 todo).
`node tools/orphans.mjs`: 24 orphans, unchanged (`shotHold.ts`, `downed.ts`, `framingReport.ts` are reachable). New tests: `fx-mix-shot-hold`,
`fx-mix-twirl-pin`, `fx-mix-downed`. `framing.ts` is 377 lines, `twirl.ts` 363, `heldShots.ts` under 300.

Captures: dev server on 5910 (stopped by PID), one headless Playwright browser at a time with `PYREFLY_BROWSER=gpu`, scripts and raw frames under
`D:/Tools/pyrefly-scratch/2026-10-03/r37-mix-polish/` (`cap/` has sc, ko, strip, flux, coach, late, hitch, meas, head; `base-src/` is a copy of c69de96a used
as a control, with the junction links to `node_modules` and `public/art`: leave its removal to the cleanup session).

## For Bailey

1. **Pacing (PR-0314).** To make the approved 1.6 s minimum true, the next menu or enemy action now waits about 1.1 s after a dressphere change when the
   close shot plays (desktop, DRESSPHERE SHOT on; also under REDUCE MOTION as a static cut). Without the wait the shot is handed back after about half a
   second in most changes. Options if the extra second is unwelcome: shorten the shot's minimum to the twirl's own 0.8 s (a one-line change in
   `HeldShots.MIN_HOLD`), or keep the old half-second cut. I built the first reading because D-316 says "at least 1.6 s".
2. **The phone (PR-0314).** The shot is closed on the upright phone (the EYE CANDY page's `OFF HERE`); the twirl keys still play there. Whether the phone
   should get the shot is not decided; nothing was changed.
3. **PR-0317 (Flux crown).** Real only at the action camera's push (and the lens shift), outside this lane. Two ways, both visible: keep a margin in the
   action push's fit for the acting boss (`FrameFit.ts`, a change to every action shot in both games), or cap the lens's upward shift when a boss has little
   headroom (costs the party clearing the status rows). Not built; yours to pick.
4. **Download cost (PR-0327).** About 5 MB at battle start on a desktop in every FFX-2 fight, before anyone changes; on the phone it waits for the Change submenu.
5. **A slip.** I ran `git checkout -- src/ui/ffx2/SpherechangeWheel.ts` once to undo my own one-line edit (a shared-tree ban; the file had no other change; the
   edit was abandoned because the Change command in battle does not use that wheel). Nothing else was touched.
6. Not seen in the evidence and so not fixed: the first-time coach line was never up at the same moment as a played shot in a natural run (see PR-0320).

## Check (independent critic, 2026-10-03, tip 52d582b4; one Sonnet agent that did not build it)

Method: the pushed tip served on its own dev server (port 6040) against a control served from `git archive origin/main` (6041; src identical to c69de96a, the base);
headless GPU Chromium, one browser at a time, real keys from the title through the Change submenu (the one hook is `setSeed(1)` before the first key, as in the
routes); the builder's own numbers were not read as proof. Per-frame logger on the shot (`mix.snapshot().shot`), the presenter phase and the event presented; the
other plane's opacity read at `renderer.render` time; HUD gauge width against the engine's ATB ticks. Scripts and frames under
`D:/Tools/pyrefly-scratch/2026-10-03/r37-check/` (the `main-src` control has two junctions, `node_modules` and `public/art`: leave their removal to the cleanup session). Both servers stopped by PID.

| Key | Game case | Verdict | What I measured |
|---|---|---|---|
| PR-0313 | FFX-2 | PASS | Changes over Ch IV (1600x900, several runs), Ch XI and Ch XVI Ixion (2000x1012): no enemy action presented inside a held shot in any (`enemyInside []`). Control on Ch IV: the shot ran 517 and 466 ms in two changes and Bahamut's action (seq 36) was presented inside a 1534 ms shot in a third. A change while another actor acts is not cut to (Paine's changes in Ch XI and Ch XVI ran no shot, see disclosure 1). |
| PR-0314 | FFX-2 | PASS | Held 1600 to 1717 ms in every desktop change that cut to the shot (dozens of changes over the runs, none under 1600). Control: 517 and 466 ms in 2 of 4 Ch IV changes and 550 ms on Ixion. After the shot the next menu or enemy action begins 130 to 700 ms later (not inside it). REDUCE MOTION: static cut held 1717, 1633 and 1600 ms, `twirl.played 0`, zero twirl-key renders; the frames show one close framing and no camera move. |
| PR-0315 | FFX-2 | PASS (mechanism confirmed, the double image itself not reproduced) | Over 8 changes (Ch IV and Ch XI, pin on) the changing girl's two planes were never both visible at a render. Renders where both planes of some other actor were visible are that actor's own pose crossfade (named by figure in the log: rikku-dark-knight, yuna-black-mage, x2-ixion) and occur on the control too. With the pin off (`fx.mix.twirlPin(false)`) I did not reproduce a both-visible render for the changing girl either; what the pre-pin read does show is the other plane left at 1.0 in 2 of 4 changes (so the key plane at 0, the key not on screen), which the pin corrects. So: no double image on this build, and the pin only helps. |
| PR-0327 | FFX-2 | PASS | Ch IV network log: desktop 1600x900, tier full: 9 files prewarmed (18 requests, png and json) within 9 s of the first menu, then opening the Change submenu added 8 requests (the two outfits' forming and end); phone 390x844 touch: 0 requests at battle start, 14 when the Change submenu opened. No console or page errors in any run. |
| PR-0318 | both | PASS in FFX; FFX-2 unchanged | Ch I seymour-flux, Yuna KO'd by keys: body under a panel 28 % (1600x900) and 26 % (2000x1012) with `bodyAvoid(false)`, 0 % and 0 % with it on; the frames show her below Tidus and Kimahri, clear of the status rows (her hair touches Kimahri's feet). FFX-2 Ch IV 2000x1012: body at about the same place on the branch and on the control (404,757 vs 413,756); see disclosure 2. |
| PR-0320 | FFX-2 | PASS (the rule, not the flow) | In the live page a `.coach-mark[data-game='ffx2']` is `visibility: hidden` with `html.mix-held` and visible before and after; an `ffx` one is never hidden. The natural flow (the line up together with a held shot) was not reached, as the builder said. |
| PR-0316 | FFX-2 | CONFIRMED not reproduced | Ch IV first menu at 1600x900 and 2000x1012: head, eye and crest read; the bright patch is the painted lamp behind the neck, not a clipped head. Nothing changed, agreed. |
| PR-0319 | FFX | CONFIRMED not reproduced | Ch IX Yojimbo first menu 2000x1012: Ginnem stands on the far platform, about half a party member's height, behind the line. Agreed. |
| Active ATB with the wait | FFX-2 | PASS | HUD gauge fill against engine ATB during the shot: 0 points apart in every change (gauges and engine both wait). After a change the HUD catches up at once (one case 28 points for a frame or two after the following burst; the control shows the same kind of jump). 30 to 45 s tails of real-key play after the changes (Ch IV, Ch XVI, and Ch IV under REDUCE MOTION): enemy actions 1 to 7 and party actions 4 to 13, the same order as the control (1 and 5 on Ch IV, 5 and 13 on Ixion); the battle never stalled. Sampled gauge p95 difference 0.02 points in the long Ixion run (one earlier run read 7.3 on a few frames and the control read 25.7 on a Ch IV tail: burst timing, not the hold). |
| FFX regression (shared presenter hook) | FFX | PASS | `shotHoldMs()` is 0 whenever no FFX-2 `sc` shot is held (`HeldShots.holdMs` returns 0 for `od`). Auto-play, `intended`, seed 1, fast: Ch I seymour-flux defeat, 38 turns, 244 events and Ch II yunalesca victory, 178 turns, 1105 events, identical on the branch and the control; FFX-2 Ch IV victory, 77 turns, 2042 events, identical. 0 page errors. (Ch III braskas-final-aeon did not finish inside the 400 s I allowed on either server: inconclusive, not a difference.) |
| `SpherechangeWheel.ts` | n/a | PASS | `git diff origin/main HEAD -- src/ui/ffx2/SpherechangeWheel.ts` is empty and `git log origin/main..HEAD` on that path is empty: the builder's `git checkout --` left no stray change. |
| Gates | | PASS | `npx tsc --noEmit` clean. `node tools/orphans.mjs`: 24, as on main. vitest (targeted): the three new files (18 tests) plus `fx-mix*`, `presenter*`, `ffx2-wait*`, `eye-candy*`, `comfort-presenters` and related, 39 files, 362 passed, 5 skipped, 0 failed (the integrator runs the full suite). Layering: `shotHold.ts` is pure and the presenter imports only it (no DOM, no `three`). New and touched mix files are under 400 lines (framing 377, twirl 363, MaxMix 322). Each of the five commits carries its game case and the Co-Authored-By line. |

### Blockers

None. No acceptance unmet, no regression against origin/main or release 35, no crash, no rule broken.

### Disclosures (majors that are not regressions, carried forward)

1. **Paine's changes get no dressphere shot** in Ch XI and Ch XVI (`shotMs 0`, skipped by the strict clean-frame check of PR-0309). The control is the same. The 1.6 s promise holds for every girl who gets a shot, not for Paine there.
2. **A KO'd girl under the enemy-intent card.** FFX-2 Ch IV 2000x1012: Yuna's KO body lies fully under the "ACTS NEXT" Bahamut card at the lower left (100 % of her rect), on the control too. PR-0318's avoid list is the status rows only, so it does not move her, and the card does not dodge a lying body. Not new; a candidate for the next batch.
3. **Already over the 400-line rule:** `BattlePresenter.ts` (703 lines, 698 on main) and `CommandMenu.ts` (626, 622 on main); this branch adds 5 and 4 lines.
4. **Pacing.** The extra second or so after each dressphere change with the shot up is real and measured (hold to the 1.6 s mark, then the next menu or action 130 to 700 ms later); the builder put the choice to Bailey.
5. **PR-0315 is done but not shown fixed**: the double image was not seen on this build with the pin off either.
6. Download cost (about 5 MB at battle start, desktop full tier only) confirmed by request count.
