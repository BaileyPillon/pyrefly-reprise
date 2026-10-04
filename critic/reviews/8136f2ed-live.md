```text
Build / artifact / target version: main 8136f2ed / bundle X5kGUd9G / artifactHash 4cd8518e36908f41743c633942159f7b6893a0a435e602d339f7e34d7f3cad84
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (a live review does not gate ship; release 38 went to https://echoesofspira.com/ under Bailey's owner override "Yes I will go with your recommendation" (2026-10-04) with no focused or deep report for 8136f2ed, and those two obligations stay pending in critic/pending/8136f2ed.json)
Milestone: not assessed
Quality: not assessed (a live review does not recompute the milestone score)
Targets: not assessed
Top issues: none critical or major. LV-1 (hosting, needs Bailey's decision): Cloudflare Web Analytics injects a third-party analytics script into the page a browser receives (+367 bytes; invisible to verify-live). LV-2 (polish): the 50 @2x figure paintings and their 50 JSON sidecars are fetched through a 307 redirect (32 in 12 sessions, each ends in a 200). LV-3 to LV-7 are hosting notes, build warnings and method notes.
Coverage: tested = every shipped file byte-compared on the new address (1,932 of 1,932) and the served manifest on the apex and the workers.dev address; title at 1600x900 and 390x844 with no "we've moved" note; chapter select; FFX Ch I (turn, cancel path, pause, hide, resume, an options change, music, save round trip by reload), Ch II first menu, Ch VIII first menu plus a turn; FFX-2 Ch IV turn; one phone turn by touch; www 301 to the apex; plain-http behaviour; a network sweep of 12 game sessions; reused = none; not tested = the full upgrade matrix, the other chapters, win/loss/retry, the per-mechanic release-38 behaviours and the Evrae measurements and plate wings (done on the GitHub address, not repeated here), slow-connection load, other browsers, a real phone, audio by ear
Next required review and why: the focused review and the deep review remain owed on this build (critic/pending/8136f2ed.json; the deep one carries 38 earlier builds); this pass settles the live obligation only. LV-1 to LV-4 are host settings and tooling, not product code: after any change to the zone's Web Analytics setting, a browser-header fetch of index.html (LV-1) is the one-step re-check.
Elapsed review time / repeated work avoided: about 24 minutes (23:04Z to 23:28Z); the exact-artifact step was run again from scratch with --full (the deploy's own 1,932-file comparison is not reused as evidence); the previous live pass of this product (6461999e, GitHub address) is not reused either
```

## Step 1 - Exact artifact (CHK-017)

Run in `D:/pyrefly-live-cf` (origin/main dae5ed9e, the record commit on top of 8136f2ed), 2026-10-04 23:09:35Z to 23:13:26Z. The marker's planned review is deep, so `--full` was added (`critic/runner/live.js`):

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/8136f2ed.json --url https://echoesofspira.com/ --changed-from critic/artifacts/6461999e.json --full
```

```json
{ "result": "PASS", "artifactHash": "4cd8518e36908f41743c633942159f7b6893a0a435e602d339f7e34d7f3cad84", "liveManifest": "match", "checked": 1932, "mismatched": [], "missing": [], "wrongType": [], "errors": [], "notes": [] }
```

`--full` compares every one of the 1,932 files (797,684,655 bytes) byte for byte and by content type. The served `artifact-manifest.json` was also read on its own: the same `artifactHash`, 1,932 files and 797,684,655 bytes on `https://echoesofspira.com/` and on `https://echoes-of-spira.baileypillon.workers.dev/`. A missing path answers a real 404 (`art/does-not-exist.png`, `nope.js` and the old base `/pyrefly-reprise/` are all 404, so there is no single-page fallback), which means a 200 for a shipped path is the file. No image was answered as `text/html` in any session.

**The limit of that tool (LV-1).** `verify-live` fetches with `Accept: */*`. Cloudflare adds its analytics script only to HTML requested with an `Accept` that includes `text/html`. Fetched with Chrome's own `Accept` and `User-Agent`, 34 sampled files (the page, the four files under `assets/`, 7 images, 7 audio files, 8 fonts, 7 JSON files) were identical to the manifest except `index.html`, which arrives 367 bytes longer (3,939 against 3,572; sha256 `7df4d15d` against `03d54497`) with one injected `<script>` tag. The artifact's files are exact; the page a browser receives carries one addition from the host.

## Step 2 - Real-input smoke (CHK-016)

Headless Chromium from node through Playwright, `PYREFLY_BROWSER=gpu` (the real GPU through ANGLE D3D11, never SwiftShader), never Claude-in-Chrome or the built-in pane. The live URL with a `?cb=` query, a new browser with an empty profile for every session and one navigation each (so every first load is a plain 200), seed 1 pinned before the first key, real key presses (real touch taps for the phone's turn). Every chapter session asserts title, chapter-select, battle and an open command menu and reads the chapter and game back from the battle's own state before it captures anything; a wrong state throws. No canvas was black (mean luminance 31.6 to 109.3 on the 21 frames read), so no fallback was needed.

| Session | Result |
|---|---|
| Title 1600x900 | Tab title `Echoes of Spira`; description "Echoes of Spira - an unofficial HD-2D fan tribute to Final Fantasy X and X-2."; the old name is in no text or meta; the page is at the root path of `echoesofspira.com`. **No "we've moved" note**: no `[data-moved-notice]` or `.fe-title__moved` element, no moved text on screen, no moved markup in the DOM, and none in the frame. Enter reaches chapter-select (selected `seymour-flux`, the guide card up). |
| Title 390x844 (touch, mobile) | The same tab title, description and absence of the note; "TAP TO BEGIN". One real tap opened the briefing card. |
| Ch I, FFX, `seymour-flux`, 1600x900 (three sessions) | Cancel path: Attack opens the target step (2 reticles, 1 lit), Escape closes it, the command rows are back. Real turn: Attack, confirm, battle log 3 to 21, Kimahri's menu next. P pauses, H hides the panels, a second H restores them, `masterVolume` 0.8 to 0.7 by ArrowLeft in the OPTIONS tab, Escape twice resumes (the first leaves the options body); Escape from the open command menu pauses and one Escape resumes. Music `boss-seymour` and the `pause` track are source `prerendered` (manifest 26 cues, 100 v2 SFX cues decoded); every `/audio/` request was 200 (manifest, title, chapter-select, scene-gagazet, boss-seymour, pause, sprite, sprite-v2). |
| Ch II, FFX, `yunalesca`, 1600x900 (two sessions) | First menu by real keys; staged tidus, yuna, auron, yunalesca; rows Talk, Attack, Special, White Magic, Items, Flee. |
| Ch IV, FFX-2, `ffx2-bahamut`, 1600x900 (two sessions) | Yuna's menu (White Magic, Change, Item); the card's pick Shell > the party; White Magic > Shell, target confirmed; Paine's menu opened 3.4 s later (Attack, Skill, Change, Item; card Magic Break > Bahamut); log 16 to 19. |
| Ch VIII, FFX, `evrae-airship`, 1600x900 | First menu (Orders, Attack, Special, White Magic, Items, Flee; camera z 9.91); one real turn: Tidus Attack, log 1 to 6, Rikku's menu next. |
| Phone 390x844 (touch; two sessions) | Ch I: Attack and the target by two real taps (`row:Attack`, `target:mortiorchis`, 0 blocked), log 3 to 21, Kimahri's menu next (7 key presses are the walk through title, board, prep and scene). |
| www | `https://www.echoesofspira.com/?cb=...` answers 301 with `Location: https://echoesofspira.com/?cb=...` (query kept), and the game loads after it (tab title, 0 console errors); `curl` shows the same 301 for `/` and `/?x=1`. |

The log counts and next-actor menus (3 to 21, 16 to 19, 1 to 6, Paine after 3.4 s) equal those of the previous live pass of this product on the GitHub address, which a pinned seed predicts.

**Network sweep, 12 game sessions (title x2, Ch I x3, Ch II x2, Ch IV x2, Ch VIII, phone x2):** 2,304 responses, **0 console errors, 0 page errors, 0 failed requests, 0 images answered as `text/html`, no 4xx or 5xx, no Cloudflare challenge** (no 403, 429 or 503, no `cf-mitigated` header, no interstitial page; the 1,932 sequential fetches of Step 1 met none either). Every page was ready in 0.63 to 0.82 s. By status: 2,254 x 200, 12 x 204 (the beacon's POST, LV-1), 6 x 304 (the browser revalidating after the reload in the Ch I sessions, LV-4) and **32 x 307** (a redirect from a file name containing a literal `@` to its percent-encoded form, each ending in a 200, LV-2). The only host besides `echoesofspira.com` was `static.cloudflareinsights.com` (LV-1). Frames: `docs/screenshots/release-38-cf-live/` (6 JPEGs).

## Step 3 - Reload smoke (CHK-024, lightweight)

On the Ch I session, three times: after the real turn, `masterVolume` changed 0.8 to 0.7 through the pause screen's own OPTIONS row and the chapter record `seymour-flux` existed (attempts 1, cleared false, play time 18,515.6 / 18,732.5 / 20,532.3 ms). After `page.reload()` and `window.__pyreflyReady`, the save under `pyrefly-reprise:save:v1` (the only `localStorage` key on the new origin; 833 bytes before and after) read `masterVolume` 0.7 and an identical chapter record, `audioDebug().volumes.master` read 0.7, and the app came back at the title. The full upgrade matrix is not part of this pass (RUBRIC section 5) and was not run. A save made on the old GitHub address does not appear here, by design (a different origin; pick S0 of `docs/handoff/r39-cloudflare.md`).

## Step 4 - Host checks beyond the file list

| Probe | Observed |
|---|---|
| `https://www.echoesofspira.com/` and `/?x=1` | 301 to the apex, query kept |
| `https://echoesofspira.com/` | 200, `Server: cloudflare`, `Cache-Control: public, max-age=0, must-revalidate` |
| `http://echoesofspira.com/` (three probes) | 200 over plain http (no forward to https) |
| `http://www.echoesofspira.com/` (three probes) | 522 |
| `http://echoes-of-spira.baileypillon.workers.dev/` | 200 |
| `https://echoesofspira.com/art/characters/tidus/idle@2x.png` | 307 to `/art/characters/tidus/idle%402x.png`; that path is 200 (the workers.dev address does the same) |
| Real browser DOM | one `script[data-cf-beacon]` (type module, from `static.cloudflareinsights.com`, with an integrity hash): GET 200, then `POST /cdn-cgi/rum` 204 |

## Findings (all informational; none critical or major)

**LV-1 (hosting; needs Bailey's decision).** The HTML a browser receives is not the artifact's `index.html`. Cloudflare's Web Analytics automatic setup injects one script tag before `</body>` for requests whose `Accept` includes `text/html` (3,939 bytes against the manifest's 3,572): a `type="module"` script from `static.cloudflareinsights.com` (`beacon.min.js`, with an integrity hash and a `data-cf-beacon` config: version 2024.11.0, a 32-character site token, `r` 1, `spa` 2). Every page load fetches it (200; 15 loads over my 12 game sessions, the reloads included) and the page POSTs to `https://echoesofspira.com/cdn-cgi/rum` (204; 12 of them): one third-party host and a telemetry beacon per visit. No hand-off note mentions it, and the project's own deploy tooling runs wrangler with telemetry off. It does not touch play (0 console errors). `verify-live` and the deploy's own byte comparison fetch with `Accept: */*` and never receive the tag, which is why both passed. Suggested, not tried: decide whether it is wanted; if not, turn Web Analytics off for the zone in the Cloudflare dashboard and re-check with a browser-header fetch of `index.html` (the 3,572-byte page is the artifact's); and make `verify-live` fetch `index.html` once with a browser `Accept` as well, so the difference cannot hide again.

**LV-2 (hosting; polish).** A request for any shipped file whose name contains a literal `@` (100 of the 1,932: the 50 `@2x` figure paintings under `art/characters` and their 50 JSON sidecars) is answered 307 Temporary Redirect to the percent-encoded path (`idle%402x.png`), and only that path answers 200; the workers.dev address does the same. The game asks for the literal `@`, so each such figure costs one extra round trip: 4 in each of the 1600x900 chapter sessions (a different four per chapter), 32 over the 12 game sessions, none on the phone or the title. Every redirect ends in a 200 with the right bytes (the byte comparison follows redirects, which is why it passed), so nothing is missing or broken; but they are the only non-2xx responses the sessions saw other than reload revalidations, and the GitHub address did not have them (0 non-2xx in the previous live pass). They are in no hosting note or test. **I counted them as redirects that resolve, not as failed responses, and the verdict says so; Bailey or the driver may rule otherwise.** Suggested, not tried: build the art URLs with `%40` (or ship the files without `@`) so the first request is the 200.

**LV-3 (hosting; known).** Plain http is not forwarded to https. `http://echoesofspira.com/` answers 200 (a different origin from https, so a player who arrives by an http link plays on a separate save) and `http://www.echoesofspira.com/` answers 522 (the www redirect rule matches https only); `https://www` forwards with a 301 as required. `docs/handoff/cf-switch.md` section 3 step 3 already recommends "Always Use HTTPS" for exactly this and leaves it to Bailey; it is still off.

**LV-4 (hosting; informational).** Every file, the hashed bundle and the art alike, is served with `Cache-Control: public, max-age=0, must-revalidate` and an ETag (the Workers static-assets default), so a reload or a return visit revalidates each file (6 x 304 on the reloads here). The deploy's upload gate refuses a `_headers` file today (`docs/handoff/r39-cloudflare.md`: the byte check could not match it), so changing this is a tooling decision.

**LV-5 (informational; from the build, not the host).** 4 console warnings in 12 sessions, 2 distinct: "[painted] /art/characters/yunalesca-1/ko.webp still had an opaque white studio background; cleaned it at load time. Regenerate the PNG with a proper alpha matte." (Ch II) and an ANGLE shader-compile warning X3595 from `THREE.WebGLProgram` (the phone session). Also: the page links no icon and `/favicon.ico` is a 404 (a headed browser asks for it; headless Playwright does not).

**LV-6 (method notes).** My first two sessions (the two titles) used the old live harness's habit of loading the page twice to clear storage; Chromium then revalidated its cache and Cloudflare's must-revalidate headers produced six 304s that my counter called non-2xx, so the harness now loads once (a new browser has empty storage anyway); those two sessions are exploratory and not counted (0 console errors in them too). Two first captures were taken mid-animation (a cut-in wipe), so Ch I's second-menu frame was re-taken after a 1.8 s settle and Ch IV's frame is its first menu; nothing but the picture changed. 80 requests were cancelled by the browser itself (`net::ERR_ABORTED`; in the one session where I listed them, Ch IV, they were the game's background warm-up of other chapters' art being dropped) and are not counted as failures, the same convention as the previous live pass.

**LV-7 (informational).** The first SFX of a run (a confirm at t = 1.9 s in the Ch I audio log) plays through the synth path before the SFX packs decode; every later cue read v2 or sprite. The same as in the previous live pass.

## Settlement

`node tools/critic-clear.mjs --report critic/reviews/8136f2ed-live.json` was run in `D:/pyrefly-live-cf` to settle the `live` obligation only (output in the commit message and the task result). Nothing under `critic/pending/` was edited or deleted by hand; the focused and deep obligations were not touched.
