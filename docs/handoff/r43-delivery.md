# r43-delivery: three delivery improvements from round 25 (PR-0373, PR-0396, PR-0405)

Branch `r43-delivery`, built on origin/main 2868c195 (the code of the live a061e9dc; nothing in `src/`, `public/` or `tools/` differs).
Approved by Bailey on 2026-10-12 at about 17:50 EDT ("I'll go with all of your recommendations", the driver's list item 6,
decision items 59d, 59e, 59f). **Game case for all three: both (shared plumbing).** Not deployed; nothing here is live.
One commit per item. The proof run is section 4 (`docs/handoff/r43-delivery-proof.json`, `tools/delivery-proof.mjs`); the deploy-time checks that only a deploy can answer are section 5.

| Item | Issue | What it changes |
|---|---|---|
| 1 | PR-0373 (audio, polish) | The confirmed chapter's scene, boss and victory music is fetched and decoded behind party prep, and kept until played |
| 2 | PR-0396 (delivery, suggestion) | Content-hashed bundles get a year-long `immutable` cache header on the Cloudflare deploy; nothing else does |
| 3 | PR-0405 (delivery, suggestion) | The board's art can wait for the player's first input (`?prefetch=first` or `defer`): built, tested, measured, and **left off by default** because on a fast link it costs something a player sees (section 3) |

## 1. PR-0373: warm the chapter's music at the confirm

**Problem (round 25).** At about the fourth line of a chapter's opening scene the scene cue was not playing in 10 of 30 non-Ch-I runs
(round 23: 5 of 55): nothing asked for the 3 MB cue until the scene opened, so its fetch and decode stood in front of the first line.

**Change.**
- `BattleScreenFlow.runChapter` now starts `musicChapter(id, ...)` (`src/app/chapterMusicWarm.ts`) as the first thing a run does, beside
  `sfxChapter` and `preloadBattle`. The board hands the flow the confirmed card, the flow starts the run in the same task, so this is the
  moment of the confirm. Every route into a run (the board, the doors, `__pyrefly.gotoChapter`, a restart) goes through `runChapter`.
- `chapterWarmCues(chapter)` is the list: **the scene's bed (`Chapter.music.scene`), the first formation's theme (`cueForGroup(..., 'first')`,
  the rule the fight itself uses), the victory sting (`Chapter.music.victory`)**, in that order, without duplicates or silences. Chapter IV
  has no victory cue, so it warms two. A fight in several parts warms the first theme only (Yu Yevon, Shuyin are fetched when their part opens).
- `AudioManager.warmMusic(names)` fetches and decodes them **one at a time in that order** after the manifest is read, so the scene cue is
  never slowed by the cues behind it. It plays nothing, queues nothing, is never awaited, never throws, and does nothing while the audio is
  still locked or in a synth-only build. A cue with no rendered file in the manifest is left alone (synthesising early is a render, not a
  fetch). A play that arrives while its warm is in flight joins it (one fetch).
- **Why a hold (`src/audio/MusicWarm.ts`).** `playMusic` keeps the cue it starts and drops every other decoded buffer (35 MB each).
  Without a hold the scene cue's own start threw away the boss and victory cues fetched for it and the battle fetched the boss cue again.
  A warm now leaves the cues it asked for, until each is played, the run ends (`musicChapter`'s release, run in `runChapter`'s `finally`) or a
  newer run replaces them. `playMusic` passes the owed, decoded cues to the same `evictionPlan`, so the cap of three buffers after a play is
  unchanged and the caller's own `upcoming` list still comes first. `audio.debug().music.held` lists what is owed.
- **Memory.** At the confirm the board's cue is still playing, so up to four decoded cues (about 140 MB) are held until the scene cue starts;
  after that three at most, as before.

**Only that chapter's cues, only its own game's.** The list is built from the chapter's own record. `tests/unit/chapter-music-warm.test.ts`
pins it for all 18 listed chapters, the unlisted ones and the hidden experiments against the record, and against the lists of FFX-only and
FFX-2-only cues that `flow-encounter-chain.test.ts` uses: an FFX chapter warms no FFX-2 cue and the reverse.

**Tests.** `tests/unit/music-warm.test.ts` (14: the hold; order and one-at-a-time fetching; returns at once; no rendered file; locked and
synth-only; joining an in-flight warm; a newer run; the cues surviving the scene, fight and results plays with no fetch after the confirm;
the end of a run; an older run cannot end a newer hold; the cap of three), `tests/unit/chapter-music-warm.test.ts` (11, including the real
`GameFlow` calling the warm before prep, the scene and the fight and releasing at the end, FFX and FFX-2). Mutation check: with the hold
disabled three of the fourteen fail.

## 2. PR-0396: the year-long cache for content-hashed files

**Problem (round 25).** `curl -I https://echoesofspira.com/assets/index-CvOwYJX5.js` read `public, max-age=0, must-revalidate`: every
return visit asked the server about every file, including bundles whose names change with their content.

**What was already built (release 39, 44dc6dca) and what was missing.** The upload gate already accepted exactly one `_headers`
(`checkHeadersFile`, `VETTED_HEADERS` in `tools/deploy-host.mjs`: the pattern `/assets/*` with `Cache-Control: public, max-age=31536000,
immutable`, nothing else), listed it in the artifact and skipped it in the live byte check (`HOST_READ_FILES` in
`tools/artifact-manifest.mjs`). The file itself was never added ("here is the proposed file for the driver to review", r39-int.md), so
the live site never had the rule. Cloudflare's Workers static assets have no header setting in the wrangler config (`assets` takes a
directory, `html_handling`, `not_found_handling`, `run_worker_first`); `_headers` in the assets directory is the supported way, and the
Worker stays assets-only (no script, no per-request cost).

**Change.**
- `public/_headers` (new): the vetted rule, with comments. `.gitattributes` pins it to LF, so its bytes (which the artifact hashes) do not
  depend on the machine that checks it out.
- `tools/cache-class.mjs` (+ `.d.mts`, new): the classification. A file is **content-hashed** only when it sits under `assets/` **and**
  is named `<name>-<8 base64url characters>.<ext>`, the way Vite names what it emits. Both conditions are needed: the live art has 23
  names that end in a dash and eight characters (`art/backdrops/road-to-the-farplane.webp`, `via-infinito`, `od-slice-and-dice`) and
  must not be cached for a year. `classifyCache(path)` gives `immutable` or `revalidate` (the host's default: `index.html`, the art, audio,
  fonts, depth maps, the artifact manifest); `cacheFromHeaders` reads a `_headers` text the way Cloudflare does (`*` is a splat that
  matches slashes too); `unhashedUnderRule` lists what the rule would cache that is not hashed.
- `prepareCloudflareUpload` (`tools/deploy-cloudflare.mjs`): a shipped `_headers` must still be the vetted one, and now every file its rule
  matches must be content-hashed, or the deploy stops ("would cache 1 file(s) for a year whose names carry no content hash, e.g.
  assets/logo.svg"). So a `public/assets/logo.svg` can never be pinned for a year to a visitor.

**How the byte-for-byte check is unaffected** (read before the change, `tools/artifact-manifest.mjs` `verifyLive`): it fetches each
selected file from the live address with a cache-busting `?v=<time>` and compares the sha256 with the artifact manifest; headers do not
change a file's bytes, and a fetch from Node has no cache. `_headers` is listed and hashed in the artifact like any file, never counted
as an uploaded file, and never downloaded (`HOST_READ_FILES`; no address serves it). The hashed files cannot be stale under `immutable`:
a new build changes their names, and `index.html`, which names them, keeps the default. `verifyLive` already reports what the first
hashed bundle was served with (`assetCacheControl`), so the next live check records whether the rule applied.

**Proof without a deploy (the real Cloudflare asset runtime, locally).** `wrangler dev` 4.147.0 (the pinned one, workerd, no login, state
and logs on D:) on a probe directory holding this `_headers`: it printed "Parsed 1 valid header rule", and
`/` and `/art/backdrops/road-to-the-farplane.webp` came back `public, max-age=0, must-revalidate`; `/assets/index-Chs9J3OY.js` came back
`public, max-age=31536000, immutable`, also with a `?v=` query; `/_headers` was 404; with CRLF line endings the result was the same. The one
unhashed file placed under `assets/` (`logo.svg`) was cached for a year too: that is exactly the case the new gate check stops.
The deploy itself is the proof that counts: the checks are below.

**Tests.** `tests/unit/cache-class.test.ts` (43): the classification table (the four live hashed files; 24 real plain paths including the
look-alike art names; the path forms; folder and shape both needed), the splat matching, `public/_headers` being the vetted file and making
exactly the classifier's immutable files immutable, and a **real Vite build** (a page with a script, a style sheet, a lazy chunk, a worker
and an imported image) whose five emitted files are all under `assets/`, all hashed, and all matched by the shipped rule, with
`index.html` the one file outside. `tests/unit/deploy-headers.test.ts` (+3, fixture hash lengthened to a real 8 characters): the gate
refuses an unhashed file under the rule, passes the live names and the look-alike art, and does not care without a `_headers`.

## 3. PR-0405: the board's art at the player's first input: built, measured, **left off by default**

**Problem (round 25).** 26 responses carrying 29.7 MB arrived in the 4.5 seconds after the title was ready (121 MB in the first 24 s on an
unthrottled link) before anyone had touched anything: the title asks for the next screen's paintings and then for every other card's
(`warmFrontEnd` in `frontendWarm.ts`, called when the title appears). The proposal: defer the board's art to the first key, "so a slow link's
first input is not competing with it". The driver's condition: nothing visible may pop in later than today on a fast link, measure before and after.

**What was built.** `?prefetch=now|first|defer` (`frontendWarm.ts`), so one build can be compared with itself, and the live build with it:

| Mode | The title asks for | The first input (key, press, touch, wheel, pointer movement, or the press that leaves the title) asks for |
|---|---|---|
| `now` (**the default: r42 and before, unchanged**) | the next screen's first paint, then every other card's art | nothing more |
| `first` | the next screen's first paint only: the briefing's two paintings when it is due, else the board's opening card with its faces | every other card's art (the faces, then the rail's strips and plates) |
| `defer` | nothing | everything; the press that leaves the title holds (ceiling 1 s) for the next screen's first paint |

What is asked for and in what order (`boardArtUrls`: the opening card first, every other card's faces next, pinned by `load-time-preload.test.ts`) is
unchanged, and so is the title's hold for the next screen's first paint. One constant, `DEFAULT_PREFETCH_MODE`, turns `first` or `defer` on for everyone.

**What was measured.** The live build a061e9dc and this build, served by `vite preview` on one machine and driven by `tools/delivery-proof.mjs`: one fresh headless
Chromium per run (`PYREFLY_BROWSER=gpu`, 1600x900, real key presses, the HTTP cache off), the link emulated through the DevTools protocol (fast: 100 Mbit/s, 20 ms; slow: 1.6 Mbit/s,
150 ms, round 25's own slow link). The two builds are byte-identical in every art, audio, font and depth-map file (the same sha256 for all 5,169 files of the live manifest; this build
adds `_headers` and differs in `index.html` and the bundle). `now` reproduces the live build run for run (same bytes, timings equal within noise), so the modes are comparable with it.
The host was 60 to 95 percent busy with other agents' work throughout; the runs repeat to within a few percent.

**Fast link, a player who sits 6 s on the title, then presses Enter** (2 runs per cell):

| | bytes before the first input | Enter to the board | board images still arriving 0.5 s after it is up | last strip in (after the board is up) |
|---|---|---|---|---|
| live r42 | 66.7 MB (64.5 MB art), 50 requests | 0.43 to 0.47 s | 12 | 3.9 s |
| `now` | 66.7 MB, 50 requests | 0.41 to 0.43 s | 12 | 3.9 to 4.0 s |
| `first` | 11.1 MB (8.9 MB art), 15 requests | 0.42 s | 34 | 9.2 s |
| `defer` | 2.17 MB (the title's own files), 9 requests | 1.41 s | 34 | 9.1 s |

**Fast link, Enter at 0.5 s:** live 5.0 MB before the input, board at 0.63 s, last strip 9.1 s; `now` the same; `first` 5.0 MB, 0.64 to 0.70 s, 9.0 s; `defer` 2.17 MB, 1.39 to 1.42 s, 9.0 to 9.2 s.
**First launch (the briefing is due), 3 s on the title:** bytes before the input live 33.1 MB, `first` 15.1 MB, `defer` 2.17 MB; Auron's briefing is up 285 ms after Enter live, 284 ms `first`,
**1,255 ms `defer`**; with the real 19-second briefing left up, the board comes up complete in the live build and in `first` alike (nothing arrives after it is up).
**A cursor move 1.5 s after the board is up (6 s on the title):** of the new card's 5 images, still missing at +60, +250, +800, +2000 ms: live 0, 0, 0, 0; `first` 2, 2, 0, 0; `defer` 2, 2, 0, 0.
**What a player sees** (`docs/screenshots/r43-board-live-1500ms.jpg` and `r43-board-first-1500ms.jpg`, the board 1.5 s after it comes up, after 6 s on the title): the live build has 13 of the 18 strips painted, `first` has one.

**Slow link (1.6 Mbit/s, 150 ms), 6 s on the title, the 120 s after Enter** (one run per mode; bytes received, not only finished files):

| | art received before the first input | the board's first-input music (`chapter-select.mp3`, 2.11 MB) finished | when the first other-card art (`rest`) began |
|---|---|---|---|
| live r42 | 1.08 MB (the opening card, still arriving) | 81.3 s after Enter | 18.7 s after Enter |
| `first` | 1.09 MB | 81.3 s | 18.7 s |
| `defer` | 0 | **87.0 s** | 27.0 s |

**What that says.**
1. **The premise does not hold on a slow link.** The 29.7 MB window is the fast link. On the slow link the idle lane (`imageWarm.ts`) already keeps the rest of the board behind the opening card (no
   `rest` file began before 18 s after Enter), and what shares the pipe with the first input's music is the opening card's own art (the next screen's first paint, which `defer` and `first` both still need).
   `first` equals the live build there, and `defer` is 6 s worse (the lingerer's head start on the opening card is gone).
2. **`defer`, the proposal as worded, breaks the condition on a fast link:** the board arrives a second later after Enter and Auron's briefing a second late, for every player.
3. **`first` keeps Enter as fast as today and removes 55 of the 66 MB before any input, but it leaves the rail's strips empty for a player who sat on the title** (the screenshots; 5 s later than today,
   and a cursor move in the first second shows the next card's plate 0.3 to 0.8 s late). That is "later than today" on a fast link, which the condition forbids, for a gain nobody sees (bytes nobody
   watches, on a link where nothing competes). A first-time player is not affected (the 20-second briefing is when the strips arrive).
4. So **the default stays `now`** and nothing a player sees or waits for changes. The mechanism, its tests and the measurements are in; if the critic's check ("bytes before the first input at most the
   title's own files") is to be met anyway, `first` meets all but the opening card and `defer` meets it exactly, at the costs above.

**What would actually help a slow link's first input (not built; needs a yes, hard rule 10):** (a) let the board's music have the pipe ahead of the opening card's art (or the other way round), so the
player's first sound arrives in seconds, not 80 (a lane rule in `imageWarm.ts`, both games); (b) thumbnails for the rail's strips: each strip paints a 4 MB backdrop at about 350x30 px,
and the rail is 90 of the 110 MB. A small derived tier (the art pipeline already derives tiers; the masters stay untouched) would let the whole board prefetch cost a few MB, which is the only change that makes
deferring it unnecessary on every link.

**Change.**
- `src/app/screens/frontendWarm.ts`: `PrefetchMode`, `prefetchModeFrom` (`?prefetch=`), `warmNextScreen` (the first paint only), `armFrontEndWarm` (listens once for the first `keydown`, `pointerdown`, `pointermove`,
  `touchstart` or `wheel` on the window; arming twice never stacks), `startFrontEndWarm` (the press that leaves the title, which a pad or a trigger makes with no DOM event), `beginFrontEndWarm` (what the title calls).
- `src/app/screens/TitleScreen.ts`: `enter()` calls `beginFrontEndWarm(...)` with the mode from the address; `advance()` calls `startFrontEndWarm` before the hold for the next screen. With the default nothing differs from r42.

**Tests.** `tests/unit/frontend-warm-input.test.ts` (21): nothing asked for before an input whatever the time (`defer`); each of the five input kinds starts it, once; nothing else does (keyup, click, resize, focus); the
briefing-due question is asked when the input comes; cancel, and arming twice; the pad path; the three modes by function and through the real `TitleScreen` (`?prefetch=now|first|defer`, and the default `now`); with the
briefing due its two paintings lead. `load-time-gates.test.ts` and `load-time-preload.test.ts` pass unchanged. Mutation check: with the title asking for everything again, the "nothing before an input" test fails.

**Harness.** `tools/delivery-proof.mjs` (new; all the numbers here): `--link=none|fast|mid|slow`, `--linger`, `--coach=on|off`, `--briefingMs`, `--query=prefetch=first`, `--stage=title|board|confirm|battle`, `--cursorAt`,
`--shot`, `--shotEarly`; it writes the network log (with received bytes), the mixer's state at each step and the board's images, timestamped, and a summary. It starts no server: `vite preview --outDir <build>` with `BASE_PATH=/`,
and the PID is the caller's to stop.

## 4. The proof run (headless GPU Chromium, `vite preview` of this build, real keys, the HTTP cache off)

One run of `tools/delivery-proof.mjs`: headless Chromium (`PYREFLY_BROWSER=gpu`), 1600x900, a fresh profile, real key presses, the HTTP cache **off** (so a refetch cannot hide behind it), the link
emulated at 100 Mbit/s and 20 ms, on `vite preview` of this build (bundle `index-DZIrKCYq.js`) with `?prefetch=first`, the mode that shows both items (a second run with `?prefetch=defer` shows the strict form of the
second one). The route: 6 s on the title with no input, Enter, the board, ArrowRight (Chapter II, Yunalesca), Enter (the card), Enter (party prep), then Enter through the opening scene to the battle. The compact record is
`docs/handoff/r43-delivery-proof.json` (the raw runs are 5 to 15 MB each and stay on the scratch disk); no console errors in any of the 48 runs made for this handoff. Every run, the live build's included, lists two or three art requests with
status 200 and an error text: the idle lane cancels loads in flight when something urgent is asked for (`net::ERR_ABORTED`); they are not failures.

**(1) PR-0373: the cues are requested at the card confirm, and none is requested again at the battle start** (fast link, Chapter II):

| request | started (ms after the card was confirmed) | done | size |
|---|---|---|---|
| `audio/music/scene-zanarkand-dome.mp3` | +20 | +1,042 | 3.94 MB |
| `audio/music/boss-yunalesca.mp3` | +1,558 | +2,200 | 3.06 MB |
| `audio/music/victory-ffx.mp3` | +2,601 | +2,995 | 2.32 MB |

All three at the confirm, in the order the run needs them, once each. With the HTTP cache off a refetch would show, and **no music request was made in the five seconds before the battle started or after it**
(`musicRequestedInTheFiveSecondsBeforeBattleStartOrAfter: []`). The mixer at the first spoken line: playing the scene cue, all three cues decoded, boss and victory held; at the battle start: playing the boss cue,
the victory cue held. The live build on the same route: the scene cue requested 2,577 ms after the confirm (when the scene opened) and the boss cue 51.5 s after it, 0.3 s before the battle started.
**On a 25 Mbit/s link the live build reproduces the round-25 failure and this build does not:** live, at the first spoken line the mixer is still playing `chapter-select`, the scene cue not decoded (requested 2.6 s after the
confirm, 4.0 s to arrive); this build, at the first line it is playing the scene cue (fetched +17 ms to +3.1 s, the boss cue +3.6 s to +6.9 s, the victory cue +7.3 s to +9.0 s, all before the fight).

**(3) PR-0405: what is asked for before the first input, and when the prefetch starts** (6 s on the title with no input, then Enter):

| | live r42 | this build, default (`now`) | `first` | `defer` |
|---|---|---|---|---|
| finished before the first input | 66.68 MB, 50 requests, 64.5 MB of art | identical (66.68 MB, 50, 64.5 MB) | 11.1 MB, 15 requests, 8.9 MB of art: the opening card | **2.17 MB, 9 requests, no art: the title's own files** |
| first art request after the first input | +184 ms | +154 ms | +2 ms | +4 ms |

The nine requests of the `defer` run, which are the title's own: `/`, `art/title/keyart.2x.webp`, the bundle, the style sheet, four fonts, `art/manifest.json`. In the `first` run the prefetch of the rest of the board starts 2 ms
after the Enter (and the audio, which unlocks on the first key, starts `title.mp3` and the sound sprites 0.17 s after it, as in every build). The default run shows that this build with no parameter does what the live build does.

## 5. Deploy-time checks owed (nothing here is deployed)

The headers can only be proved on the deployed site; the repeat-load check of the issue was run here against the local Workers runtime (section 2). After the deploy, with `SITE=https://echoesofspira.com`:

```
# 1. every content-hashed file gets the year-long rule (the names come from the live page and bundle)
HTML=$(curl -s "$SITE/")
BUNDLE=$(echo "$HTML" | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'  | head -1)
CSS=$(echo "$HTML"    | grep -o 'assets/index-[A-Za-z0-9_-]*\.css' | head -1)
WORKERS=$(curl -s "$SITE/$BUNDLE" | grep -o 'assets/worker-[A-Za-z0-9_-]*\.js' | sort -u)
for f in $BUNDLE $CSS $WORKERS; do echo "== $f"; curl -sI "$SITE/$f" | grep -i -E '^(HTTP|cache-control|content-type)'; done
#    each: a 200 and   cache-control: public, max-age=31536000, immutable

# 2. everything else keeps the host's default (revalidated, answered 304 when unchanged)
for p in / /art/title/keyart.webp /art/backdrops/road-to-the-farplane.webp /art/manifest.json /audio/manifest.json /artifact-manifest.json; do
  echo "== $p"; curl -sI "$SITE$p" | grep -i -E '^(HTTP|cache-control|etag)'; done
#    each: cache-control: public, max-age=0, must-revalidate   and an etag

# 3. the query string the live check adds does not change the rule, and _headers itself is not served
curl -sI "$SITE/$BUNDLE?v=1" | grep -i '^cache-control'          # public, max-age=31536000, immutable
curl -s -o /dev/null -w '%{http_code}\n' "$SITE/_headers"         # 404

# 4. a conditional request for the page still works (the page must keep revalidating)
ETAG=$(curl -sI "$SITE/" | grep -i '^etag' | cut -d' ' -f2 | tr -d '\r')
curl -s -o /dev/null -w '%{http_code}\n' -H "If-None-Match: $ETAG" "$SITE/"    # 304

# 5. the byte-for-byte live check still passes, and now reports the header the first bundle was served with
node tools/artifact-manifest.mjs verify-live --manifest <dist-release>/artifact-manifest.json --url "$SITE/" --sample 0
#    result PASS and  "assetCacheControl": { "path": "assets/index-<hash>.js", "value": "public, max-age=31536000, immutable" }

# 6. the acceptance check of the issue: a repeat load sends no request for a hashed file
PYREFLY_BROWSER=gpu node tools/repeat-load-check.mjs --url="$SITE/"            # PASS (exit 0); add --reload for F5
```

What a failure means: a bundle still answering `max-age=0, must-revalidate` means the rule was not applied (check that `_headers` is in the deployed artifact: `artifact-manifest.json` lists it and the deploy log says the vetted
`_headers` shipped); an art, audio or page path answering the long rule means the gate was bypassed (it refuses any file under `assets/` without a hash, and the `/assets/*` pattern matches nothing else). Rolling a bad bundle
back is a redeploy of the previous build: `index.html` always revalidates and names the hashes, so no browser keeps a bad bundle longer than its next visit.
`tools/repeat-load-check.mjs` was validated here against the local Workers runtime serving this build's `index.html`, bundle, style sheet and `_headers` (wrangler 4.147.0, workerd): PASS, both hashed files served from cache with
`public, max-age=31536000, immutable` and no request on the second visit; against the same build under `vite preview`, which applies no `_headers`: FAIL, both files revalidated (304), the behaviour round 25 saw.

PR-0373 needs no deploy-time check of its own beyond the live check; the round's acceptance ("on 20 runs with the chapter chosen by real input on an idle host, the scene cue is playing by the first line in 20 of 20")
needs the critic's idle host. Section 4 shows the mechanism on a 25 Mbit/s link, where the live build reproduces the failure (the board's cue still playing at the first line) and this build does not.

**For the release notes (draft, both games):** a chapter's opening music is fetched while you are in party prep, so the first line of the opening scene no longer waits on a download; the site's code and style sheet are cached for
a year (their names change when they do), so a returning visit does not ask the server about them. (The board-art deferral is built and off; nothing for players.)
