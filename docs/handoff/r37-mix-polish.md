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
