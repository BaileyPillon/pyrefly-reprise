```text
Build / artifact / target version: main d5bf2206 / bundle Cnc9DuSS / artifactHash f4686f3feaef4797195ceca35ff0cb161d75eb66989626a1c4bbde80c629c4fe (deployed 2026-10-13T22:02:42Z from D:/pyrefly-r45 under the owner override, replacing 7758791e); a live check has no approved target version
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (a live review does not assess it; the focused review of this build, critic/reviews/d5bf2206-focused.json, settled FAIL on the carried CHK-027 with ship SHIP)
Ship: N/A (a live review does not gate ship; this build went out under the owner override)
Milestone: not assessed
Quality: not assessed
Targets: not assessed
Top issues: none that fails the deployment. Re-observed, both already on record: LV43-2 (audio timing, polish): with none of my own traffic running the scene cue was playing at the first spoken line in 17 of 17 runs of the chapters whose opening script starts a cue (II, IV, XI, XIII) and in 0 of 7 runs of Chapter I, whose script opens with music(null); FOC45-01 (polish, the focused review's): FFX-2 Chapter IV's victory-bahamut is still the playing cue 1.5 s after Enter on the results screen, under the scene that follows. UNVERIFIED and named: the FFX-2 defeat results screen (two debug-route attempts stalled, section 2.7). The owed deep review also inherits the focused review's disclosed major FOC43-06 (CHK-027, FFX-2 XIII jerks, on live too) and the debt of 54 earlier builds
Coverage: tested = artifact identity (5217 of 5218 files byte-identical, content types, live manifest, the page as a browser receives it, the 7 removed files 404 at both addresses, both addresses on bundle Cnc9DuSS); the three retired MP3s (404 when asked for, absent from the live manifest, 0 requests in 329 audio requests and in the jukebox walk); FFX I and II and FFX-2 IV, XI and XIII from the title by real keys to the first battle menu with every audio request, the cue at the first line and at the first menu, and the per-game SFX packs; LV43-2 re-measured (24 runs); pause, H and P in both games; the pause jukebox; the FFX and FFX-2 victory cues at the results screens and the FFX defeat cue; Chapter XIII's Paragon opening unhurried and hurried; the music warm's cancel path; the phone MORE BELOW cue; settings and progress reload; console and 404 sweep (0 and 0); reused = none; not tested = the FFX-2 defeat results screen (UNVERIFIED); the full upgrade matrix; audio by ear; a chapter win by real input; the entrances and SFX packs of the chapters not played; WebKit audio decode, a real phone, other sizes
Next required review and why: the deep review this build owes (critic/pending/d5bf2206.json: audio routing, asset loader, presenter, global layout and the chapter registry; it carries the debt of 54 earlier builds and went out under the owner override); Bailey's ear for the audio (CHK-B1) stays owed
Elapsed review time / repeated work avoided: about 85 minutes, 36 of them the byte comparison (10.3 GB, 16-way), which ran while I built and shook down the smoke; the smoke that is reported ran after it finished, with none of my own traffic running (other sessions on this machine are not visible to me); shakedown runs made while the two shared the link are counted nowhere; nothing reused
```

Browser: headless Chromium driven by Playwright from node, **PYREFLY_BROWSER=gpu** (ANGLE D3D11; the eight first-menu captures read mean luminance 62.6 to 89.3, so no black canvas and no fallback), a fresh browser and a fresh context per part (storage empty, HTTP cache empty), a cache-busting query on every URL. 1600x900 with real key presses; 390x844 with `hasTouch`, `isMobile`, device scale 2 and real taps. The debug API is used in these places, said where: the results, defeat and reload parts play their chapter through `gotoChapter` (auto battle at skip speed; the opening and closing scenes of the results parts are played with real Enter presses), the jukebox check enters its battle through it, and read-backs of state (`screen()`, `snapshotState()`, `targeting()`, `audioDebug()`). Never the Claude-in-Chrome tools or the built-in pane. `D:/Tools/pyrefly-overnight/PAUSE` did not exist and I created none. Nobody here can hear: a cue name and a non-zero gain are facts about the mixer, not about sound.

## 1. Exact artifact (CHK-017): PASS

Run in D:/pyrefly-r45: `verifyLive()` from `tools/artifact-manifest.mjs` with `--full` semantics (the marker's planned review is deep) against `critic/artifacts/d5bf2206.json`, through the 16-way prefetch wrapper `critic/reviews/d5bf2206-live-verify.mjs` (the stock sequential CLI is too slow for 5,217 files). Every file except the host-read `_headers` was fetched with a `?v=<time>` query; its sha256 and content type were compared. Artifact: `critic/artifacts/d5bf2206-verify-live.json`.

| | |
|---|---|
| Files in the artifact / compared | 5218 / 5217 (all but `_headers`) |
| Mismatched / missing / wrong content type / errors | 0 / 0 / 0 / 0 |
| Live `artifact-manifest.json` | match (hash f4686f3f...) |
| `index.html` as a browser receives it | identical once Cloudflare's Web Analytics beacon (366 bytes and the line feed) is removed |
| Hashed file caching | `assets/index-92HbUNj_.css`: public, max-age=31536000, immutable |
| Fetched | 10299 MB in 2158 s, 16 workers |
| Against 7758791e | 19 added, 21 changed, 7 removed; the 7 removed (old bundle and workers, boss-dread, boss-ffx2-aeon, boss-yunalesca) answer 404 at both addresses |
| Backup address (the workers.dev one) | page 200 text/html, bundle Cnc9DuSS, the removed files 404 |

## 2. Real-input smoke (CHK-016): PASS (one part UNVERIFIED, named)

78 assertions in runs A and B, 0 failed; console errors 0; 404s 0; HTML served for an image or sound 0. Run A (22:44Z to 22:57Z) died at the start of its results-ffx2 part on a 30 s `page.goto` timeout (one live page load; the site answered in 0.1 s a minute later and no other load failed); its finished parts were saved, run B ran the rest, run C was the one retry of the FFX-2 defeat part.

### 2.1 Chapters from the title to the first battle menu, real keys, every audio request recorded

| Run | First spoken line (ms after the card confirm): cue, gain | First menu (ms after the battle screen): cue | Audio requests |
|---|---|---|---|
| FFX I, fast | 3991: none (script opens `music(null)`) | 10839: boss-seymour | 10, all 200 |
| FFX I, human pace | 5154: none | 10962: boss-seymour | 10, all 200 |
| FFX II, fast | 4147: scene-zanarkand-dome, 0.64 | 8924: boss-challenge | 11, all 200 |
| FFX-2 IV, fast | 5445: scene-bevelle-underground, 0.15 | 11391: boss-bahamut | 11, all 200 |
| FFX-2 IV, human pace | 3963: scene-bevelle-underground, 0.13 | 11526: boss-bahamut | 11, all 200 |
| FFX-2 XI, fast | 3213: scene-farplane, 0.21 | 11122: boss-ffx2-fallen-aeons | 10, all 200 |
| FFX-2 XIII, fast | 5632: scene-bevelle-underground, 0.19 | 9139: scene-bevelle-underground | 9, all 200 |
| FFX-2 XIII, hurried | 4052: scene-bevelle-underground, 0.18 | 4156: scene-bevelle-underground | 9, all 200 |

Every cue at the first menu is the first formation's start cue in the chapter data (`music.battle` through `cueForGroup`). Each run's requests were the manifest (application/json) and mp3s (audio/mpeg) only: title, chapter-select, the chapter's scene, boss (when it is a cue of its own), victory and defeat cues of its own game, `sprite.mp3`, `sprite-v2.mp3` and the game's SFX pack(s). In runs A and B: 318 audio requests, all 200, 30 application/json and 288 audio/mpeg, 23 distinct files; run C adds 11, all 200. `prerendered.manifest` was true and the playing cue's mp3 had been requested and answered 200 audio/mpeg in every run (never the procedural fallback). In prep each run held exactly its chapter's cues (for example FFX-2 IV: scene-bevelle-underground, boss-bahamut, victory-bahamut, defeat-ffx2), none of the other game's.

### 2.2 The 18 recorded sound effects, per game

The live manifest holds six packs with 18 cues (ffx-core, ffx-lady, ffx2-core, ffx2-bahamut, ffx2-machina, ffx2-shuyin). FFX runs fetched only `parity-ffx-core.mp3` (and `parity-ffx-lady.mp3` in Chapter II), FFX-2 runs only `parity-ffx2-core.mp3` (and `parity-ffx2-bahamut.mp3` in Chapter IV); `audioDebug().prerendered.parity` listed the active and decoded packs of the game and `v2.game` read the game; the effects log showed cursor moves and a confirm played `via parity` (for example `cursor-move > v2:cursor-move-x2`). `parity-ffx2-machina` and `parity-ffx2-shuyin` were not requested: their chapters were not played.

### 2.3 The three retired MP3s

`boss-ffx2-aeon.mp3`, `boss-dread.mp3` and `boss-yunalesca.mp3` answer 404 (no body) at both addresses when asked for directly; the live audio manifest lists none of them; 0 requests for them in the 329 audio requests of runs A, B and C and 0 in the jukebox walk (2.9). The live bundle still names them 9, 5 and 5 times: they are the synth fallback scores that stand in for the cues that replaced them (`src/audio/tracks/index.ts`, `RETIRED_MUSIC_CUES`); a name in the bundle is not a request.

### 2.4 Pause, H, P

FFX Chapter I and FFX-2 Chapter IV at their first menus: Escape pauses (screen `pause`), H hides the panels (text length 937 to 596, 1871 to 1489) and H restores them, Escape resumes (`battle`), P pauses, P resumes; the battle cue was still the playing cue afterwards (boss-seymour, boss-bahamut). `music/pause.mp3` answered 200 audio/mpeg.

### 2.5 Chapter XIII, Paragon's opening (FOC44A-05)

Two runs from the title, both to the first menu (enemy: paragon). The BATTLE START card (`.bstart`) was polled with the foe's projected box each frame (about 20 frames a second); the box is the camera's, not the painting's, so this is a clock, not a view of the figure.

| | unhurried | hurried (Enter held 0.9 s on the opening scene) |
|---|---|---|
| Card on screen | 176 to 1602 ms (leaving from 1281) | 145 to 2849 ms (loading until 1843, leaving from 2404) |
| Framing plan landed (box 1.5 times its first height) | 1068 ms, box 447x315 to 1500x1072 | 2314 ms, box 448x315 to 1586x1154 |
| Landed under the card | yes | yes (90 ms before the card began to leave) |
| After the card left: box, largest one-frame height step | 893x628 to 857x605, 0.5 percent | 871x614 to 863x611, 0.2 percent |
| First menu | 9139 ms | 4156 ms |

The condition FOC44A-05 guards, the plan landing after the card has gone, did not occur in either run, so they show no step after the card left, not the fix at work. The twelve-frame contact sheets are `ffx2-ch13-fast-paragon-plan-sheet.jpg` and `ffx2-ch13-hurried-paragon-plan-sheet.jpg` in the scratch folder for the deep review.

### 2.6 Cancel path of the music warm

FFX Chapter I confirmed: held in prep = scene-gagazet, boss-seymour, victory-ffx, defeat-ffx; one Escape back to the board: held = none. FFX-2 Chapter IV then confirmed: held = scene-bevelle-underground, boss-bahamut, victory-bahamut, defeat-ffx2 (none of the FFX four); at its first spoken line (4583 ms) scene-bevelle-underground was playing and the other three were still held. 0 retired requests.

### 2.7 Results screens (debug-assisted battles, the results screens are the game's own)

| Screen | Screen trail | Cue at 4.5 s | Cue past its length |
|---|---|---|---|
| FFX Chapter I victory | cutscene, battle, cutscene, results | victory-ffx, gain 1 | still victory-ffx at 42.6 s (cue 37.6 s) |
| FFX-2 Chapter IV victory | cutscene, battle, cutscene, results | victory-bahamut, gain 1 | still victory-bahamut at 39.8 s (cue 34.8 s) |
| FFX defeat (every non-enemy combatant at 1 HP, defend, skip speed) | battle, then results asserted ("Defeat", turns 18) | defeat-ffx at 3 s | defeat-ffx at 13 s (one-shot cue, 9 s) |
| FFX-2 defeat | not reached | UNVERIFIED | UNVERIFIED |

FFX-2 defeat, method check (two attempts, stop): the auto battle at skip speed with every party member at 1 HP, strategy `defend` then `attack`; both times Rikku and Paine fell and the battle stayed on Yuna's White Magic menu at full HP for 240 s, so the screen never became `results` (screenshots `defeat-ffx2-error-attempt1.jpg` and `defeat-ffx2-error.jpg`). The focused review could not reach that outcome either. The defeat-ffx2 file itself was fetched in every FFX-2 run (all 200 audio/mpeg). A real-input defeat was not attempted. A harness lesson: with `skipCutscenes: true` the debug route reaches the results screen with no closing scene and no victory cue is playing (playing null, seen once in a shakedown, not counted); with the scenes played the cue plays. All 18 chapters have a closing scene (their `post` scripts have 10 to 68 steps), so that is the route, not a player's. FOC45-01 re-observed: after Enter on FFX-2 Chapter IV's results the next screen was a cutscene and `victory-bahamut` was still the playing cue 1.5 s later (FFX Chapter I: none).

### 2.8 Phone, first launch (the MORE BELOW cue)

390x844 touch, fresh profile, title to the board by taps, a tap on the Chapter I plate, party prep with the guide's step 2 up (screen `party-prep`, chapter `seymour-flux`, tab `chapter`, step `2` asserted): the `.prep__phone-cue` "MORE BELOW" has computed `visibility: hidden` while its page state is `is-visible` (box 0,727 390x33, the chevron at 177,742 36x22 pointing down); after the guide is skipped by a tap it is `visibility: visible`. Text floor 0 under 14 px in both states; no sideways scroll. Captures `phone-prep-guide-step2.jpg` and `phone-prep-guide-skipped.jpg`.

### 2.9 Pause jukebox

From a first menu: Escape, then the arrow keys through the tabs (member:tidus to music, 8 tabs): the music panel lists 23 rows (first six "Bright After the Storm", "Noble Rot", "Where the Horns Fell Silent", "A City That Never Was", "Blitz for Two", "Hold the Trail"), none of the retired titles "The Unsent Hymn", "Rite Without End", "Static Coronation". The one Enter pressed afterwards started no row (the mixer's cue was still the pause menu's own `pause` and no new audio file was requested); no row was played. Requests of that run: sprite, sprite-v2, pause, parity-ffx-core; 0 retired; 0 console errors; 0 404s.

## 3. Reload smoke (CHK-024, light): PASS

Fresh profile at 1600x900, guide skipped by a real Esc; FFX Chapter I played through the debug API with its scenes advanced by real Enter presses (clear recorded: attempts 1, best 23284 ms, 78 turns); the save's master volume edited to 0.42 as earlier live checks did; page reloaded. After the reload: the title was up, the Chapter I clear survived unchanged, the volume read 0.42, the save string was byte-identical to the one written, and the board showed Chapter I cleared. The full upgrade matrix is not part of this pass (section 5).

## 4. Findings

- **LV43-2 (carried; audio timing; polish), re-measured.** Same method as `7b2582e7-live-music.mjs` (two loads, board, arrow keys to the card, Enter, prep 1.8 s fast or 3 s human after 3 s on the board, Enter, the first non-empty `.dbox__text`, `audioDebug().playing` against the chapter's scene cue; none of my own traffic running, the byte comparison finished; other sessions on this machine are not visible to me): fast route 6 of 9 (Chapter I 0 of 3, II 3 of 3, IV 3 of 3), human pace 4 of 6 (I 0 of 2, II 2 of 2, IV 2 of 2); the 8 chapter runs and the cancel path add 7 of 9 (II, IV twice, XI, XIII twice and the cancel path's Chapter IV playing; Chapter I 0 of 2). All 24 runs: 17 playing; 17 of the 17 runs whose script opens a cue; 0 of the 7 Chapter I runs, and Chapter I's pre-battle script begins `music(null)` (silence), so the cue is not due at its first line. For comparison, 7b2582e7 measured 2 of 9 fast and 0 of 6 human (Chapter II 2 of 3 and 0 of 2, Chapter IV 0 of 3 and 0 of 2). The scene file finished 0.7 to 2.5 s after the confirm in the 15 timing runs (`sceneDoneMsAfterConfirm`); at the first line the cue was mid fade-in (gain 0.13 to 0.85). The earlier measurement was also taken on a host its reviewer called idle, and I cannot say what else differs (the build, the hour, the edge), so this is a count, not a proof that a change fixed it; shakedown runs made while the byte comparison shared the link showed the old behaviour (the cue late or absent) and are not counted.
- **FOC45-01 (polish, the focused review's), re-observed.** Section 2.7.
- **Informational.** The live bundle still names the three retired cues as synth fallback scores (section 2.3). One 30 s page-load timeout in run A, not seen in the other 50 or so page loads of runs A to C (section 2).

## 5. Not tested (said, not implied)

The FFX-2 defeat results screen (UNVERIFIED, section 2.7); the full upgrade matrix (CHK-024 full); audio by ear: loop seams, loudness, the 18 effects as heard (CHK-B1); a chapter win by real input (the wins went through the debug API's auto battle; the scenes were played by real Enter presses); the entrances, results and SFX packs of the chapters not played (FFX III and VII to XVIII, FFX-2 V, VI, XV, XVI, the hidden chapters, `parity-ffx2-machina`, `parity-ffx2-shuyin`); the figure's gather in Chapter XIII's entrance beyond the clock in 2.5; WebKit or Safari audio decode, a real phone, a real controller, other sizes, LOW EFFECTS and REDUCE MOTION on the entrance.

## 6. Files

`critic/reviews/d5bf2206-live.json`, this file, `critic/artifacts/d5bf2206-verify-live.json`; scripts `critic/reviews/d5bf2206-live-verify.mjs`, `d5bf2206-live-smoke.mjs`, `d5bf2206-live-jukebox.mjs`; checkpoint log `critic/reviews/PROGRESS-live-d5bf2206.md`. Raw results (`live-smoke-a.json`, `-b.json`, `-c.json`, `jukebox.json`, `verify.log`, `merged-summary.json`) and the captures are in `D:/Tools/pyrefly-scratch/2026-10-13/live-d5bf2206/`; no screenshot is committed.
