```text
Build / artifact / target version: main b80f772f (full b80f772f8acbec93ba78d6ddb606641876c23037; HEAD of D:/pyrefly-r39-int, the release worktree) / bundle Dk9resVW (assets/index-Dk9resVW.js, assets/index-Ta9GcVj0.css) / artifactHash 0b31ed8767792e02caa0a98484dbfcb55030a4ee5b6607451bb35a0b0b5c936f (4,537 files, 9,482,623,905 bytes) / https://echoesofspira.com/ (Cloudflare Worker echoes-of-spira, deployed 2026-10-07T06:36:11Z) / target version: not applicable to a live review
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (a live review does not gate ship; release 39.3 went live on 2026-10-07 at 06:36:11Z under Bailey's owner override recorded in its marker ("Finish 39.2 + hidden chapter (Recommended)"); its focused review, critic/reviews/b80f772f-focused.json, said changedArea FAIL and ship SHIP, with F393-01 and F393-02 (the hidden chapter's CHK-026 and CHK-027, major, inside the new feature) and the carried F392-01 and F392-03 disclosed)
Milestone: not assessed
Quality: not assessed (a live review does not recompute the milestone score)
Targets: not assessed
Top issues: none critical or major in this pass. LV393-1 (informational, carried F393-03, not a regression): "leblanc" goes from the board straight to the pre-battle scene, with no party prep, because the word's last letter C is START. LV393-2 (informational, carried F393-06): the scene's location caption crosses the window glow. LV393-3 (hosting, carried): the Cloudflare beacon is still injected; the verifier tolerates exactly it. LV393-4 (method): 14 net::ERR_ABORTED are the game's own cancelled art warm-ups. LV393-5 (load time): 3 cold loads on a quiet machine read 3.57 / 0.65 / 0.58 s; the slowest loads were the first of a run (5.18 s once, in a superseded launch with the download running beside it; 3.57 s once, alone), cause not isolated, and every counted load is under the 5 s bar. LV393-6 (method): two harness runs of mine stopped on my own assumptions; no frame from them is kept.
Coverage: tested = every served file byte-compared on the live address (4,537 of 4,537, --full); the board (18 cards, no experiment card) in four fresh sessions; "leblanc" opens the hidden chapter (wrong last letter opens nothing; first menu, cancel path, real turn, pause, H, P); "limit" opens FF7's chapter to its first menu; Chapter I (FFX) and Chapter IV (FFX-2) from the board to the first menu by real keys with cancel path, a real turn, pause and resume by Escape and P, H hide and restore; an options change and a reload; prerendered music; www to apex and http to https; 1,050 responses, 0 console errors, 0 responses >= 400; reused = none (the driver's own live smoke is cited as corroboration only); not tested = the full upgrade matrix, the other 16 chapters, win/loss/retry, the hidden chapter's party prep and defeat, every deep-review system and the continuity checks, other window sizes and browsers, a real phone or controller, audio by ear
Next required review and why: the deep review remains owed on this build (critic/pending/b80f772f.json; it carries the debt of 42 earlier builds, which is why the deploy needed Bailey's override); this pass settles the live obligation only. The focused obligation was settled by the deploy (changedArea FAIL, ship SHIP, per the focused report). The deep review should take F393-01 to F393-03 and F393-05 (the hidden chapter, Bailey's eye on it) and F392-01 and F392-03 as carried.
Elapsed review time / repeated work avoided: about 36 minutes of wall clock (the exact-artifact comparison took 26.3 of them, in the background; the browsers ran for about 10 minutes with the overnight art queue paused). Nothing was reused: the deploy's own 737-file comparison, the focused review's smokes and the driver's live smoke are not counted as evidence.
```

## Step 1 - Exact artifact (CHK-017)

Run in `D:/pyrefly-r39-int` (the release worktree, HEAD b80f772f: `critic/artifacts/b80f772f.json` and the pending marker are there; the main tree at D:/Final Fantasy has neither), 07:08:43Z to 07:35:01Z. The marker's planned review is deep, so `--full` was used, and `critic/artifacts/002928c4.json` exists, so `--changed-from` was given:

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/b80f772f.json --url https://echoesofspira.com/ --changed-from critic/artifacts/002928c4.json --full --out verify-live-full.json
```

```json
{
 "result": "PASS",
 "artifactHash": "0b31ed8767792e02caa0a98484dbfcb55030a4ee5b6607451bb35a0b0b5c936f",
 "liveManifest": "match",
 "checked": 4537,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": [],
 "notes": [],
 "browserPages": {
  "index.html": "identical to the artifact once Cloudflare's Web Analytics beacon is removed (366 bytes and the line feed after it)"
 },
 "assetCacheControl": {
  "path": "assets/index-Dk9resVW.js",
  "value": "public, max-age=0, must-revalidate"
 }
}
```

`--full` compares every one of the 4,537 files of the manifest byte for byte and by content type (this artifact lists no host-read `_headers` and no `.nojekyll`, so nothing is skipped); the stored manifest, the marker and the live `artifact-manifest.json` all name `0b31ed8767792e02caa0a98484dbfcb55030a4ee5b6607451bb35a0b0b5c936f`, 4,537 files and 9,482,623,905 bytes. How the run went: the verifier ran detached beside the browser sessions (started through WMI so no shell limit could stop it), under `node --import` of a preload that only wraps `globalThis.fetch` to count calls and write a progress line every 100 files (4,539 calls logged, 0 non-200) and returns the same Response objects, so what the tool compares is untouched. The tool itself was not edited. The deploy's own 737-file comparison is not counted.

Read from the live address as well:

| What | Result |
| --- | --- |
| index.html, generic Accept | sha256 bef1536b8097a559331510dbe801f126019ad7b3ca3ed98fd2d87ed6e9ec6b6b, the stored manifest's own value (3,572 bytes) |
| index.html, a browser's Accept | the artifact plus one Cloudflare Web Analytics script element (366 bytes) and the line feed after it, nothing else (the verifier cut it out and compared) |
| assets/index-Dk9resVW.js | 200, text/javascript, Cache-Control "public, max-age=0, must-revalidate" |
| Paths that are not shipped | art/does-not-exist-r393.png, nope-r393.js, audio/music/nope-r393.mp3, /pyrefly-reprise/, art/portraits/exp-leblanc-nope.png: all 404 with 0 bytes, never the single-page fallback, so a 200 for a shipped path is the file |
| In the page, every session | document.scripts: /assets/index-Dk9resVW.js; stylesheet /assets/index-Ta9GcVj0.css; window.__pyrefly.build() = {sha: "b80f772f", bundle: "index-Dk9resVW.js"}; one script[data-cf-beacon]; fetch("/artifact-manifest.json") = 0b31ed8767792e02caa0a98484dbfcb55030a4ee5b6607451bb35a0b0b5c936f (count 4537) |
| www.echoesofspira.com | 301 to https://echoesofspira.com/ (path and query kept: /some/path?x=1 stays /some/path?x=1), one hop to a 200 |
| http://echoesofspira.com | 301 to https://echoesofspira.com/ (one hop); http://www goes in two hops to the same 200 |
| Build-time decode "problems" | art/portrait-parts/paine/1x/eyeR-catch.png and 2x/eyeR-catch.png decode to one flat colour: both are in policy.json intentionalFlatImages and were in the previous build's manifest |

## Step 2 - Real-input smoke (CHK-016)

Headless Chromium 153.0.8010.12 from node through Playwright, **`PYREFLY_BROWSER=gpu`** (the launch args of `tools/browser-mode.mjs`; the page's WebGL renderer reads "ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)", never SwiftShader), never Claude-in-Chrome or the built-in pane, one browser at a time. The live URL with a `?cb=` query, **a new browser and an empty profile for every session**, 1600x900, seed 1 pinned by `setSeed(1)` before the first key (the one setup hook), every game decision a real key press (the typed words one `KeyboardEvent.key` at a time, 140 to 150 ms apart). **CHK-016: before every frame the harness reads the screen, chapter, awaiting-menu and open-target state and the stale roots and throws on a mismatch**: 37 of 37 frames asserted, none failed. No frame is black (mean luminance 22.5 to 142.5; the darkest are the pause screens), so no fallback to another renderer was needed.

| Session | What it did and what it read |
| --- | --- |
| **S1, the hidden door (FFX-2 only), 1600x900** | Title (tab title "Echoes of Spira") -> Enter -> chapter select: **18 cards, no experiment card, no FF7 card, strip "0 of 18 beaten"**, 7 pips of X-2 and 11 of X in the strip, nothing on screen names an experiment. "leblank" typed: nothing opens, the cursor stays on Chapter I. "leblanc" typed: **the board leaves for the pre-battle scene at 965 ms on the page timer, which is when the seventh letter lands (seven letters at 150 ms), with no party-prep screen in a 25 ms read (F393-03: the last letter C is START; known, not a regression)**; the scene's first line (Rikku's) is up and typing out before the frame is taken; a held Enter fast-forwards it; the first menu of chapter `exp-leblanc` (game ffx2, scene `exp-leblanc-last-room`; rows Attack / Skill / Change / Item; six figures: Yuna Gunner, Rikku Thief, Paine Warrior, Dr. Goon, Fem-Goon, Ormi, every art id `exp-leblanc-*`, none a placeholder). **Cancel path:** Attack opens the target step (3 reticles; on this fresh profile the first Enter did not open it and the second did), Escape closes it and the four rows are back. **Real turn:** yuna hits dr-goon for 97. **Pause:** Escape opens it (tab member:yuna, stack battle + pause), H hides the panels (panelsHidden true, "H SHOW PANELS · ESC RESUME") and H restores them, Escape resumes; P opens and P closes. The music is boss-ffx2-aeon, prerendered. 190 requests for exp-leblanc art, all 200; the experiments' store `pyrefly-reprise:experiments:v1` appears beside the save. |
| **S2, "limit" (FF7 only)** | Board (18 cards, no experiment card, no FF7 card) -> "limit" typed -> **the board goes to a battle of `ff7-guard-scorpion` (game ff7, scene sector1-reactor) 3854 ms on the timer (typing took about 0.75 s of it)**; the FF7 first menu is up (awaitingMenu true; the FF7 HUD has its own menu markup, so the row list is empty by design), frame shows Cloud and Barret against the Guard Scorpion with the FF7 window HUD. 0 requests for exp-leblanc art. |
| **S3, Chapter I Seymour Flux (FFX), by real keys** | Board with the cursor on Chapter I -> Enter -> party prep -> the scene (Kimahri) -> the first menu (**chapter seymour-flux, game ffx**, Tidus: Talk / Attack / Special / White Magic / Items / Flee); the music is boss-seymour, prerendered. **Cancel path:** Attack, target step (2 reticles), Escape, the six rows are back. **Real turn:** tidus hits mortiorchis for 153, and the boss answers (seymour-flux hits yuna for 789). Pause by Escape and P, H hide and restore, as in S1. Then the options change and the reload (Step 3). 0 requests for exp-leblanc art. |
| **S4, Chapter IV Bahamut (FFX-2), by real keys** | Board: ArrowRight until the cursor is on Chapter IV (strip "0 of 18 beaten") -> Enter -> party prep -> the scene (Rikku) -> the first menu (**chapter ffx2-bahamut, game ffx2**; Yuna as White Mage: White Magic / Change / Item, no Attack row, as in FFX-2); the music is boss-ffx2-aeon, prerendered. **Cancel path:** Change opens its list (Gunner / Black Mage), Escape and the three rows are back. **Real turn:** White Magic -> Cure -> the target step (3 reticles) -> confirm: yuna acts (3 events logged). Pause by Escape and P, H hide and restore. 0 requests for exp-leblanc art. |
| **Load time** | 3 cold loads on a quiet machine (the verifier download had finished and the overnight GPU job was paused) read 3.57, 0.65, 0.58 s from navigation start to the first rendered frame (window.__pyreflyReady; the CHK-017 bar is 5 s); 4 counted sessions read 0.99 / 1.57 / 0.85 / 0.98 s from DOMContentLoaded to ready. The slowest loads of the pass were the first of a run, both times: the first launch of S1 (which stopped on my own board check, below, so it is not a counted session) read 5.18 s, the first page load of the pass, with the full-artifact download running beside it for six minutes and the overnight job's PAUSE only about 30 seconds old; the first quiet-machine load above read 3.57 s; every load that followed read 0.58 to 1.57 s. The cause of a slow first load was not isolated. Every counted load is under the 5 s bar. |

## Step 3 - Reload smoke (CHK-024, lightweight)

On the S3 session after the real turn and the pause tests: in the pause screen's own OPTIONS tab (ArrowRight until the tab, ArrowDown into the body, ArrowDown to MASTER VOLUME, ArrowLeft twice) **masterVolume 0.8 -> 0.6**; progress recorded: `chapters.seymour-flux` attempts 1, cleared false, playTimeMs 21349. `page.reload`, then the save under `pyrefly-reprise:save:v1` (the only localStorage key in a Chapter I run; 833 bytes before and after) reads masterVolume 0.6 and an identical chapter record, `audioDebug().volumes.master` reads 0.6 (the mixer applied it at boot), and the app is at the title. The full upgrade matrix (fresh and returning players, the previous build's save migrating forward, truncated storage, the reset flow) is **not** part of a live pass and was not run.

## Network, console and media over the pass

1,050 responses over the four counted sessions: 1,019 x 200, 5 x 204 (the Cloudflare Web Analytics beacon's report, POST echoesofspira.com/cdn-cgi/rum, one per page load), 26 x 304 (the reload's revalidations); **0 console errors, 0 page errors, 0 responses of 400 or more (0 x 404), 0 images or audio answered as text/html**, no 301/302/307/308 inside the game, hosts only echoesofspira.com and Cloudflare's own analytics beacon. 14 requests ended `net::ERR_ABORTED`: the game dropping its background warm-up of other chapters' art and its pause plates when the board or the pause closes (the same convention as the earlier live passes, not a failure; no frame shows a missing image). 920 art requests; **0 requests for exp-leblanc art in the FF7, FFX and FFX-2 sessions** (the shared plumbing is neutral outside the hidden chapter) and 190 in the hidden chapter's own. 36 audio requests over the sessions (title, chapter-select, the scene cue, the boss cue, pause, the two SFX sprites), all 200; the music at each first menu is prerendered (manifest 26 cues, SFX sprite and 100 v2 cues decoded, `audioDebug().playing` source "prerendered"), never the procedural fallback.

## Observations (none blocks; none is a regression)

- **LV393-1** (informational, carried F393-03): typing "leblanc" skips party prep; live behaves as the focused review found it (a 25 ms read of the screen name: chapter-select, then cutscene at 965 ms on the timer, as the last letter lands; the letter C is START). Evidence: `s1-door.json`, key `door-opened`.
- **LV393-2** (informational, carried F393-06): the hidden chapter's pink location caption ("EXPERIMENTAL · CHATEAU LEBLANC, GUADOSALAM") runs across the pale stained-glass glow at the top of the scene (frame s1-door-03).
- **LV393-3** (hosting, carried LV39-2): the Cloudflare Web Analytics beacon is still injected into the page a browser receives; one script[data-cf-beacon] in every session, a GET of the beacon script from static.cloudflareinsights.com (200) and a 204 answer to its report (the Cloudflare Web Analytics beacon's report, POST echoesofspira.com/cdn-cgi/rum, one per page load).
- **LV393-4** (method): 14 `net::ERR_ABORTED` are the game's own cancellations (see above).
- **LV393-5** (load time, informational): see the Load time row. The first load of a run was the slow one twice (5.18 s under contention in a superseded launch, 3.57 s alone); every counted load is under the 5 s bar and nothing here is a defect of the build. The first load after a quiet spell is worth a measured look in the deep review's performance pass.
- **LV393-6** (method, the escapes of this pass): the first S1 launch stopped at my own board check, which expected the strip's text in lower case (it is drawn in capitals); the first S4 launch stopped because my selector wanted an Attack row, and Chapter IV's first menu belongs to Yuna as a White Mage (White Magic / Change / Item, as in FFX-2). A second S1 run passed, but its pre-battle-scene frame was the scene's black fade-in with only its caption, so S1 was run once more, waiting for the first scene line; that third run is the counted one (its predecessor's log is in `superseded-first-runs/`). No frame from a stopped run is kept.

## Corroboration (cited, not relied on)

The driver's own live smoke at 02:4x EDT (`D:/Tools/pyrefly-scratch/2026-10-07/live393/live393c-log.json`, a patched copy of `tools/exp-smoke.mjs` that accepts the scene after the door): 18 cards and no experiment card, the word opened the pre-battle scene, six figures read from the experiment's art, a party attack landed (paine 190, yuna 150 on dr-goon), 0 console errors, 0 404s. It agrees with S1 on every point it covers; the verdict above rests on this pass's own sessions.

## What this pass did not test

- the full CHK-024 upgrade matrix (fresh and returning players, a 39.2 save migrating forward, truncated storage, the reset flow)
- the other 16 chapters on live (II, III, V and VII to XVIII of the board), win, loss and retry paths, the results screen and the return to the board, cutscene content beyond the held skip
- the hidden chapter's party prep (unreachable by the word, F393-03), its defeat, retry and results; FF7's chapter beyond its first menu (no turn played, its audio not read)
- every deep-review system and the continuity checks CHK-026 and CHK-027 (F393-01, F393-02 and F392-01 stay as the focused review left them), the first-time-fan lens, the guide beyond what the first menus show, art quality, audio by ear
- other window sizes (2000x1012, 1280x720, 4K), the phone at 390x844 by touch, Safari and Firefox, a real controller, a slow or cold connection
- F393-04 (the first arrow press after a partial word is swallowed) was not probed live
- the old GitHub Pages address (a legacy host; no review obligation rides on it)

## Evidence

- `critic/reviews/b80f772f-live.json` (this report, machine-readable) and the folder `critic/reviews/b80f772f-live/`: 37 asserted JPEGs (`s1-door-*`, `s2-limit-*`, `s3-ffx-ch1-*`, `s4-ffx2-ch4-*`), one log per session (`s1-door.json`, `s2-limit.json`, `s3-ffx-ch1.json`, `s4-ffx2-ch4.json`: every step, every frame's asserted state, the network and console counts), `loadtime.json`, `verify-live-full.json`, `verify-progress.log`, `superseded-first-runs/`, and `scripts/` (`live393.mjs`, `loadtime.mjs`, `build-report.mjs`, `fetch-progress-preload.mjs`, `run-verify.cmd`).
- Environment: headless Playwright Chromium 153.0.8010.12 on the GPU (PYREFLY_BROWSER=gpu, ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)), Windows 11, 1600x900, seed 1, https://echoesofspira.com/ with a ?cb= query; no server was started (the live address was used directly), so none needed stopping; the overnight art queue was paused with `D:/Tools/pyrefly-overnight/PAUSE` from 03:13:36 to 03:23:08 EDT and again from 03:35:46 to 03:36:24 EDT for the load-time run, and the file is deleted.
