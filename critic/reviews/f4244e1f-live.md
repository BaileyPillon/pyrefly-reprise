```text
Build / artifact / target version: main f4244e1f (f4244e1f2c606781046d46259614399b51a6a85e), release 37.1 / bundle DhiL5vEz / artifactHash 505e9ad6cc077616f8bf173e66912e428e47e9b2a5480554de32354919be9b24 / live https://baileypillon.github.io/pyrefly-reprise/ deployed 2026-10-03T23:39:29.936Z / targets.json not consulted (live pass)
Review: live
Deployment: PASS (exact artifact: 1716 of 1716 files byte-identical; hotfix acceptance 3 of 3 Trigger Happy routes and 4 of 4 Chapter IX first menus; smoke 39 of 39 steps ok; 0 console errors, 0 responses of 400 or more)
Changed area: NOT APPLICABLE (a live review does not accept the changed area; the focused report critic/reviews/f4244e1f-focused.json holds that verdict: FAIL on FOC371-01, disclosed)
Ship: N/A (a live review does not gate ship; the focused report holds it: SHIP, disclosing FOC371-01 major, FOC371-02 and -03 polish, FOC371-04 suggestion)
Milestone: not assessed
Quality: not assessed (a live review does not recompute the score); last full score is deep round 20 on cd9dbbb0, provisional, and carries nothing to this build
Targets: not assessed (the one required tile, the cold chamber, belongs to the focused and deep reviews; FOC371-01 stays open)
Top issues: none new. FOC371-01 (major, FFX only, disclosed by the focused report, not a regression) reproduces on the live build as described: a hurried Chapter IX opening never plays the approved arrival (arrival peak opacity 0 in 8 of 8 hurried runs) while the tapped-through opening plays it (peak 1.0 at 8.7 s before the first menu); it stays open for Bailey's answer. LV371-01 (focused pr0341.mjs can leave an actor out of its check) and LV371-02 (a wrong expectation in this pass's first smoke run, fixed and repeated) are informational, not build defects.
Coverage: tested = artifact identity (all 1716 files byte-identical, --full), FOC37-02 Trigger Happy on keyboard, emulated pad and touch (3 presses = 3 hits, the overlay names the input), PR-0341 Chapter IX first menu in 4 hurried runs at 1600x900 and 2000x1012 plus a tapped run, the changed flow's cancel and positive paths, a 39-step real-input smoke on Chapters V and IX (pause, H, music, reload), 0 console errors across every run. reused = none. not tested = the full CHK-024 upgrade matrix, a physical pad or phone, Safari and Firefox, Trigger Happy by mouse / Lv. 2-3 / other chapters, FOC371-02 to -04 re-measurement, win/loss/retry and the other chapters, the deep review
Next required review and why: the deep review this build owes (critic/pending/f4244e1f.json carries the deep debt of 36 earlier builds; deepAfterDeploy is true for this change set); Bailey's answer on FOC371-01 before the next Cavern change. This report settles only the live obligation; the focused one was settled by the deploy gate (result FAIL for the changed area, ship SHIP) and the deep one stays pending.
Elapsed review time / repeated work avoided: about 35 minutes (the 1716-file comparison alone took 6 min 38 s); the focused critic's harness (hlib, th, pr0341) and the critic's route libraries were reused, not rewritten; no earlier evidence reused (first live check of this sha)
```

## Step 1: exact artifact (CHK-017)

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/f4244e1f.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/cd9dbbb0.json --full
```

`--full` because critic/pending/f4244e1f.json plans a deep review (live.js: add --full when the planned review is deep or milestone). The run started 2026-10-03T23:51:51Z and finished 2026-10-03T23:58:29Z (6 min 38 s, one sequential run from the main tree, finished before any browser run began).

```json
{
 "result": "PASS",
 "artifactHash": "505e9ad6cc077616f8bf173e66912e428e47e9b2a5480554de32354919be9b24",
 "liveManifest": "match",
 "checked": 1716,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": []
}
```

Manifest diff from cd9dbbb0 (node tools/artifact-manifest.mjs diff): added assets/index-B8jtRvzT.css and assets/index-DhiL5vEz.js, changed index.html, removed assets/index-BGBDEn_P.js and assets/index-BI-IdB4b.css; nothing else differs between the two manifests. The page serves `assets/index-DhiL5vEz.js` and `assets/index-B8jtRvzT.css`, and the in-page fetch of `artifact-manifest.json` names artifactHash 505e9ad6cc077616f8bf173e66912e428e47e9b2a5480554de32354919be9b24. Cold first load of a fresh context: `__pyreflyReady` after 648 ms.

## Step 2: real-input smoke (CHK-016)

Headless Chromium launched from node by the critic's own openRoute (critic/runner/lib/route-evidence.mjs), PYREFLY_BROWSER=gpu (ANGLE, NVIDIA GeForce RTX 5070 Ti, Direct3D11; no black canvas, no fallback), 1600x900, a fresh context for every run (so an empty profile), a cache-busting query on the live URL, one browser at a time, TEMP and TMP on D:. Never the Claude-in-Chrome extension and never the built-in browser pane. Every game input is a real Playwright key press (and, for the pad and the finger, the critic's navigator.getGamepads stub and a touch context). window.__pyrefly is only read: the screen name, the chapter and game, awaitingMenu, the engine's battle log and audioDebug; the one setup hook is setSeed(1) before the first key, labelled as such. Every screenshot is taken after a read of the screen name (plus awaitingMenu, chapter and game where the capture needs them) and of the stale roots under #ui, and a failed wait throws, so nothing is photographed on the wrong screen (CHK-016). The script is smoke.mjs beside the focused critic's harness copies (hlib.mjs, th.mjs, pr0341.mjs, the fixed pr0341-live.mjs) in D:/Tools/pyrefly-scratch/2026-10-03/live371/h/. The first full run of smoke.mjs failed one step that was a wrong expectation in my script, not a build fault (Yuna opens Chapter V as a White Mage, so her first command list is White Magic / Change / Item, and the script wanted Attack and Skill, which are the Gunner's rows); the expectation was corrected, an extra audio sample was added, and the whole smoke was repeated from a fresh context: the table below is that second run (the first run's report and shots are kept in smoke-run1/). Both runs had 0 console errors and 0 responses of 400 or more.

| # | Step | Result | Detail |
|---|---|---|---|
| 1 | boot: __pyreflyReady on a cold fresh context, under 5 s | ok | readyMs=648 nav={"dcl":612,"load":0} renderer=ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11) |
| 2 | boot: title screen | ok | screen=title |
| 3 | served bundle is index-DhiL5vEz.js and stylesheet index-B8jtRvzT.css | ok | {"scripts":["https://baileypillon.github.io/pyrefly-reprise/assets/index-DhiL5vEz.js"],"css":["https://baileypillon.github.io/pyrefly-reprise/assets/index-B8jtRvzT.css"]} |
| 4 | live artifact-manifest.json names this artifactHash | ok | {"status":200,"artifactHash":"505e9ad6cc077616f8bf173e66912e428e47e9b2a5480554de32354919be9b24","count":1716} |
| 5 | title -> chapter-select with real Enter | ok |  |
| 6 | chapter select: cursor on ffx2-vegnagun-shuyin by real arrow keys | ok | selected=ffx2-vegnagun-shuyin |
| 7 | ffx2-vegnagun-shuyin: Enter on the card -> party-prep | ok | screen=party-prep |
| 8 | ffx2-vegnagun-shuyin: party prep + scene tapped through with Enter (36 taps) -> battle screen | ok | screen=battle |
| 9 | ffx2-vegnagun-shuyin: first command menu reached (awaitingMenu), chapter and game as intended | ok | chapter=ffx2-vegnagun-shuyin game=ffx2 phase=command:yuna |
| 10 | Ch V first menu is the FFX-2 command list of Yuna as White Mage (White Magic, Change, Item) with the FFX-2 HUD up | ok | ["White Magic","Change","Item"] |
| 11 | CANCEL PATH: Skill > Trigger Happy > Escape out of the target step (and out of the Skill list): back at the command rows, no slab, no Trigger Happy command, still awaiting the same menu | ok | {"levels":"targeting -> Skill list -> top rows","targetUpBefore":{"n":1,"lit":1,"selecting":true},"targetUpAfterFirstEscape":{"n":0,"lit":0,"selecting":false},"rowsAfterFirstEscape":["Trigger Happy","Potshot","Cheap Shot","Enchanted Ammo","Target MP","Quarter  |
| 12 | POSITIVE PATH: the Trigger Happy slab is up and names the keyboard (MASH R) | ok | {"text":"Trigger Happy MASH R 0 HITS","input":"keyboard","pe":"auto"} |
| 13 | POSITIVE PATH: three real presses of R show 3 HITS on the slab | ok | {"text":"Trigger Happy MASH R 3 HITS","input":"keyboard","pe":"auto"} |
| 14 | P during the open slab does not open the pause (a minigame blocks it, by design) and the 3 hits stay | ok | {"screen":"battle","slab":{"text":"Trigger Happy MASH R 3 HITS","input":"keyboard","pe":"auto"}} |
| 15 | POSITIVE PATH: engine log: Yuna's gunner-trigger command carries trigger.hits = 3 and 3 damage events landed | ok | {"found":true,"actor":"yuna","hits":3,"landed":[72,81,78],"nextSeq":76} |
| 16 | P opens the pause on Chapter V (any point of the battle, command menu included) | ok | screen=pause |
| 17 | pause screen shows its tabs | ok | ["Yuna*","Rikku","Paine","Chapter","Guide","Options","Controls","Music"] |
| 18 | H hides the pause panels, H again restores them | ok | before=block/bare=false hidden=none/bare=true restored=block/bare=false |
| 19 | pause: OPTIONS tab reached by real ArrowRight | ok |  |
| 20 | MASTER VOLUME lowered with real ArrowLeft | ok | before=80 after=60 |
| 21 | Escape closes the pause (resume to the battle) | ok | screen=battle after 2 Escape press(es) |
| 22 | the battle resumes after the pause (the next command menu comes up) | ok | phase=idle |
| 23 | Escape at the top row opens the pause, Escape again returns to the same command menu | ok | afterFirst=pause afterSecond=battle awaitingMenu=true rowsBefore=["Attack","Skill","Change","Item"] rowsAfter=["Attack","Skill","Change","Item"] |
| 24 | before reload: the save holds the lowered masterVolume and the Chapter V attempt | ok | {"masterVolume":0.6,"attempts":{"seymour-flux":0,"yunalesca":0,"braskas-final-aeon":0,"seymour-anima-macalania":0,"evrae-airship":0,"yojimbo-cavern":0,"seymour-natus":0,"seymour-omnis":0,"isaaru-via-purifico":0,"sin-fins-core":0,"sin-face":0,"ffx2-bahamut":0," |
| 25 | after reload: re-boots, the lowered masterVolume and the Chapter V attempt survived, and the mixer applies the saved volume | ok | {"post":{"masterVolume":0.6,"attempts":{"seymour-flux":0,"yunalesca":0,"braskas-final-aeon":0,"seymour-anima-macalania":0,"evrae-airship":0,"yojimbo-cavern":0,"seymour-natus":0,"seymour-omnis":0,"isaaru-via-purifico":0,"sin-fins-core":0,"sin-face":0,"ffx2-baha |
| 26 | reload: title -> chapter-select with real Enter | ok |  |
| 27 | chapter select: cursor on yojimbo-cavern by real arrow keys | ok | selected=yojimbo-cavern |
| 28 | yojimbo-cavern: Enter on the card -> party-prep | ok | screen=party-prep |
| 29 | yojimbo-cavern: party prep + scene tapped through with Enter (36 taps) -> battle screen | ok | screen=battle |
| 30 | yojimbo-cavern: first command menu reached (awaitingMenu), chapter and game as intended | ok | chapter=yojimbo-cavern game=ffx phase=command:kimahri |
| 31 | Ch IX first menu (opening tapped through): Yojimbo, Daigoro and Ginnem are drawn and the FFX command rows are up | ok | {"ginnem":{"alpha":1,"visible":true},"yojimbo":{"alpha":1,"visible":true},"daigoro":{"alpha":1,"visible":true}} |
| 32 | Ch IX carries no FFX-2 HUD node and no Trigger Happy slab (FFX only) | ok | {"ffx2hud":0,"ffx2Trigger":0} |
| 33 | Ch IX: P opens the pause | ok | screen=pause |
| 34 | Ch IX: Escape resumes to the same command menu | ok | screen=battle |
| 35 | prerendered music is fetched over the network and is what plays (a track is playing, source prerendered, mixer gain above 0) | ok | {"requests":18,"byStatus":{"200":18},"playing":["Ch V first menu: boss-vegnagun (prerendered, gain 1)","Ch V after the pause round trip: boss-vegnagun (prerendered, gain 0.03267132118344307)","Ch IX after the pause round trip: boss-yojimbo (prerendered, gain 0 |
| 36 | every audio response is 200 | ok | {"200":18} |
| 37 | console errors for the whole run | ok | 0 |
| 38 | responses with status >= 400 for the whole run | ok | 0 |
| 39 | image or audio responses served as text/html | ok | 0 |

Screenshots (scratch, not tracked), each written beside the state it was asserted in: 01-title.jpg [screen=title chapter=null game=null awaitingMenu=false]; 02-chapter-select.jpg [screen=chapter-select chapter=null game=null awaitingMenu=false]; chapter-select-ffx2-vegnagun-shuyin.jpg [screen=chapter-select chapter=null game=null awaitingMenu=false]; ffx2-vegnagun-shuyin-party-prep.jpg [screen=party-prep chapter=ffx2-vegnagun-shuyin game=ffx2 awaitingMenu=false]; ch5-first-menu.jpg [screen=battle chapter=ffx2-vegnagun-shuyin game=ffx2 awaitingMenu=true]; ch5-cancel-path-top-menu.jpg [screen=battle chapter=ffx2-vegnagun-shuyin game=ffx2 awaitingMenu=true]; ch5-trigger-happy-slab-open.jpg [screen=battle chapter=ffx2-vegnagun-shuyin game=ffx2 awaitingMenu=false]; ch5-pause-open.jpg [screen=pause chapter=ffx2-vegnagun-shuyin game=null awaitingMenu=false]; ch5-pause-H-hidden.jpg [screen=pause chapter=ffx2-vegnagun-shuyin game=null awaitingMenu=false]; ch5-pause-options.jpg [screen=pause chapter=ffx2-vegnagun-shuyin game=null awaitingMenu=false]; ch5-menu-after-resume.jpg [screen=battle chapter=ffx2-vegnagun-shuyin game=ffx2 awaitingMenu=true]; 03-chapter-select-after-reload.jpg [screen=chapter-select chapter=null game=null awaitingMenu=false]; chapter-select-yojimbo-cavern.jpg [screen=chapter-select chapter=null game=null awaitingMenu=false]; yojimbo-cavern-party-prep.jpg [screen=party-prep chapter=yojimbo-cavern game=ffx awaitingMenu=false]; ch9-first-menu.jpg [screen=battle chapter=yojimbo-cavern game=ffx awaitingMenu=true]; ch9-pause-open.jpg [screen=pause chapter=yojimbo-cavern game=null awaitingMenu=false].

## Hotfix acceptance on the live build

Round 20's two acceptance checks, run on https://baileypillon.github.io/pyrefly-reprise/ (cache-busting query, fresh context each run, seed 1 by the labelled setup hook). Browser: headless Chromium launched from node by the critic's openRoute (critic/runner/lib/route-evidence.mjs), PYREFLY_BROWSER=gpu, renderer ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti, Direct3D11), no black canvas and no fallback, one browser at a time, TEMP and TMP on D: (never C:); never the Claude-in-Chrome extension and never the built-in browser pane.

### FOC37-02, Trigger Happy (FFX-2 only), Chapter V `ffx2-vegnagun-shuyin`, Yuna as Gunner, Skill > Trigger Happy

| Route (3 presses) | Layout | Overlay words | Slab input | UI hits | Engine trigger.hits | Damage events | Slab inert / removed (ms after open) | Console errors / 404 |
|---|---|---|---|---|---|---|---|---|
| keyboard R | 1600x900 | MASH R | keyboard | 3 HITS | 3 | 3 [72, 81, 78] | 1819 / 2146 | 0 / 0 |
| emulated pad R1 (navigator.getGamepads stub, button 5) | 1600x900 | MASH R1 | gamepad | 3 HITS | 3 | 3 [72, 81, 78] | 1777 / 2123 | 0 / 0 |
| touch taps (hasTouch, isMobile) | 390x844 | MASH TAP | pointer | 3 HITS | 3 | 3 [72, 81, 78] | 1660 / 1916 | 0 / 0 |

All three routes: 3 presses give 3 hits on the slab and 3 in the engine's `gunner-trigger` command, and the slab names the input in use (MASH R, MASH R1, MASH TAP). The smoke run repeats the keyboard route in its own session (below, step "POSITIVE PATH") and adds the cancel path.

### PR-0341, Chapter IX `yojimbo-cavern` at the first menu (FFX only), opening hurried (Enter held through the scene), seed 1, per-frame actor probe

| Run | Actors checked | Ginnem, Yojimbo and Daigoro drawn in each of the first 3 frames after awaitingMenu | Drawn after the menu DOM | Frames (ms after awaitingMenu) | Arrival meshes peak opacity | Hidden after staging (Ginnem / Yojimbo / Daigoro) | FFX-2 HUD / slab nodes | Console / 404 / page errors |
|---|---|---|---|---|---|---|---|---|
| live-1600x900-run1 | 3 (first frame had 3) | yes | yes | 0, 11, 27 | 0 at 6.2 s before the menu | no / no / no | 0 / 0 | 0 / 0 / 0 |
| live-1600x900-run2 | 3 (first frame had 3) | yes | yes | 0, 22, 44 | 0 at 5.8 s before the menu | no / no / no | 0 / 0 | 0 / 0 / 0 |
| live-2000x1012-run1 | 3 (first frame had 3) | yes | yes | 0, 10, 37 | 0 at 5.7 s before the menu | no / no / no | 0 / 0 | 0 / 0 / 0 |
| live-2000x1012-run2 | 3 (first frame had 3) | yes | yes | 0, 7, 20 | 0 at 6.0 s before the menu | no / no / no | 0 / 0 | 0 / 0 / 0 |

The tapped-through opening (comparison, not part of the acceptance):

| Run | Actors checked | Ginnem, Yojimbo and Daigoro drawn in each of the first 3 frames after awaitingMenu | Drawn after the menu DOM | Frames (ms after awaitingMenu) | Arrival meshes peak opacity | Hidden after staging (Ginnem / Yojimbo / Daigoro) | FFX-2 HUD / slab nodes | Console / 404 / page errors |
|---|---|---|---|---|---|---|---|---|
| live-tap-1600x900-run1 | 3 (first frame had 3) | yes | yes | 0, 11, 42 | 1 at 8.7 s before the menu | no / yes / yes | 0 / 0 | 0 / 0 / 0 |

Reading the tables: in the four hurried runs Ginnem, Yojimbo and Daigoro are on the field from staging (alpha 1.0, 5.7 to 6.2 s before the first awaitingMenu) and are drawn in each of the first three frames after awaitingMenu and after the command menu's DOM appeared; none was hidden at any frame after staging; the arrival's own meshes (veil, tree, glow, petals) never rose above opacity 0, so the hurried opening skips the approved arrival, which is the disclosed FOC371-01 and not a new fault. The tapped-through run is the comparison the focused report made: the arrival plays (opacity 1.0 at 8.7 s before the first menu), Yojimbo and Daigoro are hidden until it, and all three are drawn in the first three frames after awaitingMenu. The same five runs with the focused critic's UNMODIFIED harness also pass; one of those four hurried runs listed only two actors (see LV371-01), which is why the acceptance table above is from the fixed copy.

## Step 3: reload smoke (CHK-024, lightweight)

Before the reload the save holds settings.masterVolume 0.6 (lowered from 0.8 with real ArrowLeft on OPTIONS > MASTER VOLUME) and attempts 1 for ffx2-vegnagun-shuyin (every other chapter 0) with seenCoach [briefing, firstrun-board, firstrun-prep, firstrun-battle, ffx2-gauge, ffx2-chain]; after page.reload and __pyreflyReady the save holds the same values and audioDebug().volumes.master reads 0.6. Chapter IX was then entered as a returning player through the normal flow. The full upgrade matrix is not part of this pass (see Not tested).

## Observations (none is a new defect)

- LV371-01 (informational, a harness defect and not a build defect): critic/reviews/f4244e1f-focused/harness/pr0341.mjs takes the list of actors it checks from the first frame in which any of Ginnem, Yojimbo or Daigoro is staged. In one of four unmodified live runs (1600x900 run 1) that first frame held Ginnem and Yojimbo only, so the run reported 'drawn in the first 3 frames' for two actors and Daigoro was never checked (the run kept one frame for him, at the first menu, and in it he is drawn with alpha 1.0; frames 2 and 3 were not checked for him). The focused review's six candidate runs all listed three actors, so its conclusion stands. For this pass a copy (pr0341-live.mjs) fixes the three actors, treats an absent actor as not drawn, and records when each was first seen: 5 of 5 runs of the fixed copy list all three actors from the first frame, and all three are drawn in each of the first three frames after awaitingMenu in the four hurried runs. Suggested for the next focused harness: fix the expected actors instead of reading them off the first frame.
- LV371-02 (informational, script defect of this live pass, fixed and repeated): the first full run of smoke.mjs asserted that Chapter V's first menu has Attack and Skill rows; Yuna opens as a White Mage (White Magic, Change, Item). The expectation was corrected and the full smoke repeated: the reported run has 0 failed steps. Both runs had 0 console errors and 0 responses of 400 or more.
- FOC371-01 re-observed live, not new and not a regression: see Top issues and the Chapter IX tables.
- Pressing P while the Trigger Happy slab is open does not open the pause and does not change the hit count: BattleScreen.canPause refuses while a minigame is up ('timed inputs'), the documented behaviour.
- Trigger Happy damage values: all three live routes produced the seeded damage events [72, 81, 78] for the three hits in this pass; the focused report's candidate numbers for the same routes differ (for example [78, 81, 78] for the keyboard). I did not trace why (the fights are seeded, but the two sessions' earlier actions need not be identical); the hit counts, which are the acceptance, agree.
- Host load: the machine was busy with other agents' browsers (CPU about 80 percent at the start of the browser work). Nothing here is timing-sensitive beyond the 1.8 s Trigger Happy window, which the three presses (189, 406 and 306 ms) fit inside with room.

## Not tested

- the full CHK-024 upgrade matrix (fresh player, returning player, a save written by the previous live build, invalid or truncated storage, the reset flow): not part of a live pass
- a physical pad or phone, Safari or Firefox: the pad is a navigator.getGamepads stub and the finger is Playwright touch emulation, Chromium only
- Trigger Happy through the mouse (MASH CLICK), at 2000x1012, in Chapter IV or any other Gunner chapter, at Lv. 2 and 3 (windows of 2.2 and 2.6 s), and windows after the first of a fight
- FOC371-02 (the enemy-intent card over the slab on desktop), FOC371-03 (slab text under the 14 px floor on a phone) and FOC371-04 (the slab covers the guide card) were not re-measured: the focused report holds them; this pass only watched that the slab takes its presses
- win, loss and retry paths, the results screen, the other chapters (I to IV, VI to VIII, X onward) and Chapter IX beyond the first menu
- the deep review of the build (it is a separate obligation)

## Evidence

Scratch, not tracked: D:/Tools/pyrefly-scratch/2026-10-03/live371/ (verify-live.json and verify-live.out.txt for step 1; h/ the harness copies, smoke.mjs, tables.mjs, make-live-report.mjs; ev/th/ one folder per Trigger Happy run with run.json and the after-presses frame; ev/pr0341fix/ the five fixed Chapter IX runs and ev/pr0341/ the five unmodified runs, each with run.json, early frames and the menu+N s frames; smoke/ report.json and the shots of the reported run, smoke-run1/ the first run; th-live-*.log, pr0341*-live-*.log and smoke.log).
