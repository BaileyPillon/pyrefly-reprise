```text
Build / artifact / target version: main ca9fd0b4 / bundle Cg05Z3H_ / artifactHash 19d1b6207f3fb2450b3d3276461ccd9df0c5cef83075f3c85b478bc6a215050a (deployed 2026-10-14T04:33:27Z from D:/pyrefly-r46 under the owner override, replacing d5bf2206); a live check has no approved target version
Review: live
Deployment: PASS (the exact artifact is what the site serves and every flow the change names ran on it; one finding already on record is re-observed live, FOC46-04, named under Top issues)
Changed area: NOT APPLICABLE (a live review does not assess it; the focused review of this build, critic/reviews/ca9fd0b4-focused.json, settled FAIL on carried checks with ship SHIP)
Ship: N/A (a live review does not gate ship; this build went out under the owner override)
Milestone: not assessed
Quality: not assessed
Targets: not assessed
Top issues: none that fails the deployment. Re-observed on live, all already on record: FOC46-04 (polish, new feature only): the hidden Fayth chapter asks for art/backdrops/exp-fayth-deck.png, which the build does not hold, so the host answers 404 (3 console errors per run), the prep is a flat navy page and the scene before the fight is black behind the dialogue; no other chapter asks for it. FOC46-06 (polish): 620 shipped files still carry a private page link and 969 art JSON the owner's first name (counted only; the FOC46-01 gate is clean: 0 drive-letter or user-profile paths in the 1291 text files of the live site, 1278 of them JSON). LV43-2 (audio timing, polish): with none of my own traffic running the scene cue was playing at the first spoken line in 7 of 9 runs (all 7 runs of Chapters II, IV, XI, XV and the Fayth chapter; 0 of 2 in Chapter I, whose opening script begins with music(null)). UNVERIFIED and named: Chapter II's Form III advisor line and the permanent Auto-Life fix as played (no fight to Form III was played on live). The owed deep review also inherits the focused review's disclosed majors FOC43-06 (CHK-027) and FOC46-05 (the Fayth chapter's boss out of frame on a phone) and the debt of 55 earlier builds
Coverage: tested = artifact identity (5221 of 5222 files byte-identical, content types, live manifest, the page as a browser receives it, the 3 removed files 404 at both addresses, both addresses on bundle Cg05Z3H_; all 1291 text files downloaded and run through the project's local-path gate: 0 hits; /__ffx-local/ 404); the art JSON sidecars (30 sampled and all 1278 JSON files scanned, 0 hits); FFX I, II and FFX-2 IV, XI, XV and the hidden Fayth chapter from the title or the typed word by real keys to the first battle menu with every audio request, the cue at the first line and at the first menu, the per-game SFX packs and the hidden chapter's door; LV43-2 (9 runs); pause, H and P in both games; the victory loops, Chapter IV's cue stopping after the tally, Chapters XI and XV's scene beds returning, and the enemy-defeat sound in both games; the phone Party Prep's four shades; Chapter II's guide line; settings and progress reload; console and 404 sweep; reused = none; not tested = Chapter II's Form III line and Auto-Life as played (UNVERIFIED); the full upgrade matrix; audio by ear; a chapter win by real input; the Fayth chapter on a phone; WebKit, a real phone, other sizes
Next required review and why: the deep review this build owes (critic/pending/ca9fd0b4.json: the FFX engine, the presenter and stage, the asset loader and manifests, a new chapter and the audio routing; it carries the debt of 55 earlier builds and went out under the owner override); the owner's ear for the audio (CHK-B1) stays owed
Elapsed review time / repeated work avoided: about 85 minutes, 49 of them the byte comparison (10.3 GB, 16-way), which ran while I built and shook down the smoke; the smoke that is reported ran after it finished (19 minutes), with none of my own traffic running (other sessions on this machine are not visible to me); six shakedown runs made while the two shared the link are counted nowhere; nothing reused but the previous check's scripts as a starting point
```

Browser: headless Chromium driven by Playwright from node, **PYREFLY_BROWSER=gpu** (the nine reported first-menu captures read mean luminance 75.1 to 94.9, so no black canvas and no fallback), a fresh browser and a fresh context per part (storage empty, HTTP cache empty), a cache-busting query on every page URL. 1600x900 with real key presses; 390x844 with `hasTouch`, `isMobile`, device scale 2, an Android phone user agent and real taps on the prep tabs and the guide's skip (in the phone parts the title was passed with a tap and the chapter card was chosen with real arrow keys and Enter, as the build's own shade check did). The debug API is used in these places, said where: the results parts play their chapter through `gotoChapter` (auto battle at skip speed; the opening and closing scenes and the Continue are real Enter presses) and so does the reload check; read-backs of state (`screen()`, `snapshotState()`, `battleState()`, `audioDebug()`). Never the Claude-in-Chrome tools or the built-in pane. `D:/Tools/pyrefly-overnight/PAUSE` was created by my wrapper only when none existed and renamed to `PAUSE.released-by-live-ca9fd0b4.txt` after each browser run; another session's PAUSE was left alone. Nobody here can hear: a cue name and a non-zero gain are facts about the mixer, not about sound.

## 1. Exact artifact (CHK-017): PASS

Run in D:/pyrefly-r46: `verifyLive()` from `tools/artifact-manifest.mjs` with `--full` semantics (the marker's planned review is deep) against `critic/artifacts/ca9fd0b4.json`, through the 16-way prefetch wrapper `critic/reviews/ca9fd0b4-live-verify.mjs` (the previous check's wrapper, re-pointed). Every file except the host-read `_headers` was fetched with a `?v=<time>` query; its sha256 and content type were compared. Artifact: `critic/artifacts/ca9fd0b4-verify-live.json`.

| | |
|---|---|
| Files in the artifact / compared | 5222 / 5221 (all but `_headers`) |
| Mismatched / missing / wrong content type / errors | 0 / 0 / 0 / 0 |
| Live `artifact-manifest.json` | match (hash 19d1b620...) |
| `index.html` as a browser receives it | identical once Cloudflare's Web Analytics beacon (366 bytes and the line feed) is removed |
| Hashed file caching | `assets/exp-fayth-table-DKYNX064.js`: public, max-age=31536000, immutable |
| Fetched | 10300 MB in 2924 s, 16 workers (the six shakedown runs shared the link, hence 49 minutes) |
| Against d5bf2206 | 7 added (the bundle, stylesheet, worker and Fayth shot table under `assets/`, three SFX packs), 962 changed (952 art JSON, 9 audio files, `index.html`), 3 removed (`assets/index-92HbUNj_.css`, `assets/index-Cnc9DuSS.js`, `assets/worker-Mv1HVYXb.js`); the 3 removed answer 404 at both addresses |
| Backup address (the workers.dev one) | page 200 text/html, bundle Cg05Z3H_, the removed files 404 |
| Text of the site, downloaded from live | all 1291 text files of the artifact (11 MB): 1291 of 1291 sha256 equal the manifest; `node tools/dist-local-paths.mjs --dir <the download>` scanned 1291 files, 0 hits (exit 0) |
| The converter's dev-only route | `/__ffx-local/manifest.json` and `/__ffx-local/` answer 404 at both addresses |

## 2. Real-input smoke (CHK-016): PASS (one finding on record, re-observed)

The reported run: one node process, 17 parts, 05:33Z to 05:52Z, on an idle link: 114 assertions, 0 failed, no page load retried. Console errors 6 and 404s 6: all the one request named in 2.2, 3 in each of the two Fayth runs; 0 in the other 13 browser parts. HTML served for an image or sound 0. One part was run a second time at once, for a reason in 2.1.

### 2.1 Chapters from the title (or the typed word) to the first battle menu, real keys, every audio request recorded

| Run | First spoken line (ms after the card confirm or the word's last letter): cue | First menu (ms after the battle screen): cue | Audio requests | SFX packs fetched |
|---|---|---|---|---|
| FFX I, fast | 3989: none (script opens `music(null)`) | 13556: boss-seymour | 11, all 200 | parity-ffx-flux, parity-ffx-core |
| FFX I, human pace | 5151: none | 13430: boss-seymour | 11, all 200 | same |
| FFX II, fast | 2965: scene-zanarkand-dome | 10279: boss-challenge | 11, all 200 | parity-ffx-lady, parity-ffx-core |
| FFX-2 IV, fast | 5162: scene-bevelle-underground | 10704: boss-bahamut | 11, all 200 | parity-ffx2-bahamut, parity-ffx2-core |
| FFX-2 IV, human pace | 3986: scene-bevelle-underground | 11555: boss-bahamut | 11, all 200 | same |
| FFX-2 XI, fast | 3429: scene-farplane | 27859: boss-ffx2-fallen-aeons | 11, all 200 | parity-ffx2-aeons (new), parity-ffx2-core |
| FFX-2 XI, run again | 3599: scene-farplane | 12245: boss-ffx2-fallen-aeons | 11, all 200 | same |
| FFX-2 XV, fast | 1932: scene-bevelle-underground | 11313: boss-den-of-woe | 10, all 200 | parity-ffx2-core |
| Fayth (hidden), fast | 4253: scene-fahrenheit | 6979: boss-evrae | 10, all 200 | parity-ffx-core |
| Fayth (hidden), human pace | 5434: scene-fahrenheit | 7031: boss-evrae | 10, all 200 | parity-ffx-core |

- The cue at the first menu is the chapter data's first-formation cue in all 9 reported runs; the music is the prerendered MP3 (manifest loaded, the playing cue's file requested and answered 200 audio/mpeg), never the procedural fallback.
- 177 audio requests in the reported run, all 200 (161 audio/mpeg, 16 application/json); none for boss-ffx2-aeon, boss-dread or boss-yunalesca; the 28 distinct files are all files of this artifact. Each run fetched only its own game's SFX packs; the debug surface reports 92 v2 cues, 8 retired, and only that game's packs active.
- Chapter XI's first menu took 27.9 s in the reported run against 11.1 s on the previous live check; run again at once it took 12.2 s with nothing else different. Read as machine noise (another session shares this machine), not a finding.

### 2.2 The hidden Fayth chapter (FFX only)

- Door, on the board with the first-run guide skipped: the word with a wrong letter in it (`faygth`) leaves the board where it was; the word `fayth` typed by real keys opens the chapter's party prep (chapter `exp-fayth` asserted); Escape returns to the board; the word again leads through the opening scene (Wakka speaks first; scene-fahrenheit playing) to the first menu with Evrae and Cid, boss-evrae, in 7.0 s. Both runs identical in outcome.
- FOC46-04 re-observed: the prep and the opening scene ask for `art/backdrops/exp-fayth-deck.png`, which the build does not hold; the host answers 404 and the console logs one failed request per ask (3 per run). The prep shows a flat navy page where other chapters show the blurred painted wash, and the scene before the fight is black behind the dialogue box (frames `fayth-prep.jpg`, `fayth-first-line.jpg`); the battle itself draws the deck painting. No other chapter asks for this file.

### 2.3 Results, the real Continue and the enemy-defeat sound

Debug-assisted: the chapter is played by the debug API's auto battle at skip speed; the opening and closing scenes are advanced by real Enter presses and the Continue on the results screen is a real Enter. A sampler in the page records the music state every 100 ms on change.

| Run | Victory cue at 4.5 s, and past its length | The loop in the manifest | Enemy-defeat ask v2:dissolve-pyreflies: what played | After the real Continue |
|---|---|---|---|---|
| FFX I | victory-ffx at gain 1; still current at 43.2 s | 38.14 s file, loop 8.46 to 35.14 s | x7: dissolve-pyreflies from ffx-core (via parity) | the cue is gone at 394 ms; the scene is silent (as before) |
| FFX-2 IV | victory-bahamut at gain 1; still current at 42.2 s | 37.16 s file, loop 8.88 to 34.16 s | x1: v2:dissolve-pyreflies (via v2) | gone at 394 ms (fading from 92 ms); silent through the 43 s of the scene observed |
| FFX-2 XI | victory-ffx2 at gain 1; still current at 48.3 s | 43.26 s file, loop 8.26 to 40.26 s (32.0 s) | x5: v2:dissolve-pyreflies (via v2) | scene-farplane is back at 87 ms; the victory loop is gone from under the scene by 1.0 s |
| FFX-2 XV | victory-ffx2 at gain 1; still current at 48.3 s | same file | x3: v2:dissolve-pyreflies (via v2) | scene-bevelle-underground is back at 473 ms; the victory loop is gone by 1.4 s |

- Chapter IV's victory cue stops after the tally and the scene that follows is silent (FFX-2 IV, FOC45-01's repair); Chapters XI and XV re-cue their scene beds (FFX-2 only, as the change says). FFX Chapter I's behaviour is unchanged.
- The enemy-defeat sound is FFX-2 only: FFX-2 plays the v2 recording it has always played, FFX plays its recorded original from the FFX pack; no run of one game played a pack of the other.
- Each loop is still the current cue after its whole length at a non-zero gain. The levels across the loop joins are not decoded here (see 4).

### 2.4 The phone Party Prep's four shades (both games), 390x844, touch

The prep reached with real keys on the board and Enter on the card, the first-run guide skipped by a tap, each tab opened by a real tap and asserted (screen, tab, stacked phone page), the computed colour read from every matching element:

| View | Element | Elements (on screen) | Computed colour | Hex |
|---|---|---|---|---|
| FFX I, Stats | `.prph-bonus` ("+10%" note) | 2 (2) | rgb(127, 92, 10) | #7f5c0a |
| FFX I, Items | `.prph-item__qty` (bag counts) | 27 (27) | rgb(127, 92, 10) | #7f5c0a |
| FFX-2 IV, Items | `.prph-item__qty` (bag counts) | 8 (8) | rgb(156, 50, 103) | #9c3267 |
| FFX-2 IV, Stats | `.prph-ud__up` (up counts) | 9 (9) | rgb(127, 208, 154) | #7fd09a |
| FFX-2 IV, Stats | `.prph-ud__dn` (down counts) | 9 (9) | rgb(240, 138, 138) | #f08a8a |

Every element of each kind reads the same colour. The three `--prph-*` variables read #7f5c0a (FFX) or #9c3267 (FFX-2), #7fd09a and #f08a8a (the three new Ink & Gold tokens), and `--ig-accent-deep` is unmoved (#a67c16 FFX, #b8437e FFX-2). No sideways scroll. These are the four colours the build's handoff lists; their contrast figures were not re-measured here. Frames in the scratch folder: `shades-ffx-stats-gold-note.jpg`, `shades-ffx-items-gold-bag-count.jpg`, `shades-ffx2-items-raspberry-bag-count.jpg`, `shades-ffx2-stats-up-count-green.jpg`, `shades-ffx2-stats-down-count-red.jpg`.

### 2.5 The art JSON sidecars and the text of the site (FOC46-01)

- 30 art JSON files, evenly spread over the 1264 in the artifact, fetched from live: all 200 JSON, none contains a drive-letter path or a user-profile path. Then every JSON file of the site (1278: the 1264 art sidecars and 14 others, 5.2 MB) was fetched and scanned the same way: 0 hits.
- The project's own gate (`tools/dist-local-paths.mjs`) on a download of all 1291 text files of the live site: 0 hits.
- Control: the unredacted local master of one sidecar does hold a drive path (field `candidateSource`) and the same scan flags it; the live file holds the bare name `highbridge-c2.png` in that field. The sidecars still hold repo-relative names (`docs/...`, `public/art/...`), which the rule does not call local paths.
- FOC46-06 (disclosed polish) counted only: 620 shipped files carry a private page link and 969 art JSON carry the owner's first name, exactly the focused review's counts; none of it is a path.

### 2.6 LV43-2, the scene cue at the first spoken line

Counted on the 9 reported chapter runs (the cue the chapter's scene plays, read from the audio debug surface when the first line appears): playing in 7 of 9: Chapter II 1 of 1, FFX-2 IV 2 of 2, XI 1 of 1, XV 1 of 1, the Fayth chapter 2 of 2; Chapter I 0 of 2, whose opening script begins with `music(null)` (no scene cue is meant to play). Chapter XI's re-run also had it (8 of 10 with it). The previous live check counted 17 of 17 and 0 of 7 the same way.

### 2.7 Pause, hide, resume

FFX Chapter I and FFX-2 Chapter IV, at the first menu: Escape opens the pause screen, H drops the panels (page text 959 to 618 characters in FFX, 1827 to 1444 in FFX-2) and the second H restores them to the same length, Escape returns to the battle, P pauses, P returns to the battle.

### 2.8 Chapter II's guide

At the first menu of Chapter II the in-battle guide panel (opened with the real key G; the pause screen's Guide tab only holds the designed line and the on/off switch) carries the new text: before the last phase swap Wakka in for Tidus because he wears no Zombie Ward, and a knock-out takes a character's Zombie away. The advisor's line itself (Tidus hands the turn to Wakka on the first Form III turn) and the Auto-Life fix need the fight to Form III or Chapter III's last link: UNVERIFIED here, named in section 4.

## 3. Reload (CHK-024, light): PASS

Fresh profile, 1600x900: Chapter I cleared through the debug API's auto battle (scenes by real Enter; clear recorded: attempts 1, best time 18627 ms, best turns 78), the save's master volume edited from 0.8 to 0.42, the page reloaded: the game returned to the title, the clear survived unchanged, the volume read 0.42, the save string was byte-identical to what was written, and the board showed Chapter I cleared. The full upgrade matrix is not part of this pass.

## 4. Not tested

- Chapter II's Form III advisor line and the permanent Auto-Life fix as played (UNVERIFIED on live; the focused review carries them).
- The full upgrade matrix (CHK-024 full).
- Audio by ear: the 29 re-levelled takes, the three re-cut loops and Chapter IV's silence as heard (CHK-B1 stays owed to the owner).
- The level across the three loops' join and the takes' levels as decoded: measured in the candidate by the focused review; the live bytes equal the candidate's and were not decoded again here.
- A chapter win by real input (the wins reached results through the debug API's auto battle); the defeat results screens; FFX III, IV to XVIII and FFX-2 V to X, XII to XIV and XVI to XVIII entrances and packs (`parity-ffx-final-aeon` verified byte for byte, but no run fetched it).
- The Fayth chapter on a phone (FOC46-05) and with the owner's local FFX models (dev server only); the phone prep's other tabs and the desktop prep.
- WebKit or Safari audio decode, a real phone, a real controller, other sizes.

## 5. Reproduction

In D:/pyrefly-r46: `node critic/reviews/ca9fd0b4-live-verify.mjs` (the byte comparison, writes `critic/artifacts/ca9fd0b4-verify-live.json`); `PYREFLY_BROWSER=gpu node critic/reviews/ca9fd0b4-live-smoke.mjs` (all parts; `ONLY=<part,part>` runs some, `MENU_TIMEOUT_MS` raises the first-menu wait). Raw results and frames: `D:/Tools/pyrefly-scratch/2026-10-14/live-ca9fd0b4/` (`live-smoke.json`, `retry-ch11.json`, `removed-check.json`, `live-text-scan.json`, `shots/`). Progress record: `critic/reviews/PROGRESS-live-ca9fd0b4.md`.
