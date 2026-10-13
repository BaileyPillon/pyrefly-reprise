# r44-thumbs: small derived copies of the paintings the chapter board's strips paint

Branch `r44-diffb-thumbs` (the first commit is DIFF-B, `docs/handoff/r44-diffb.md`; this note covers the thumbnail commit, the follow-up that put a small copy under every plate and set the reach of the plates fetched ahead, and the proof), built on `origin/r43-rc` 7b2582e7.
Approved by Bailey on 2026-10-12 at about 23:15 EDT ("I'll go with all of your recommendations", the driver's list item "a yes or no on chapter picture thumbnails", decision 61f), on the finding of `docs/handoff/r43-delivery.md` section 3: **the rail's strips are about 90 of the 110 MB the board loads**.
**Game case: both (shared board and art pipeline).** No painting, no game number, no rule changes. The masters in `public/art` and their hashes are untouched. Not deployed; nothing here is live.

## What it is

Each rail card paints its boss on its scene (D-183) at a strip about 233 px wide and 25 px tall on a 1600 x 900 window. The only files for that were the full 3 to 6 MB backdrop and the boss painting: eighteen cards were 101.4 MB of masters. The strips now show a **thumbnail**, and the full picture loads when its plate is shown.

- **Made by a rule, never by hand** (`tools/art-thumbs.mjs`, one more step of the art-derive pipeline `tools/art-derive-lib.mjs`). For each master named by `src/data/art/strip-art.json` (36: one scene and one boss painting per card) the build decodes it to sRGB RGBA, resizes it with Lanczos3 to **768 px wide (a scene) or 576 px tall (a boss), aspect kept, never enlarged**, and stores it **losslessly**: a WebP where every decoder draws it the same (the picture is opaque: `decoderIndependent`), a PNG where it is not (a boss with soft edges). The cache is content-addressed like the full pictures' (`PYREFLY_ART_CACHE`), keyed by the master's hash, the rule, both encoders and the library versions.
- **Proved.** Because it is lossless a thumbnail has an exact proof: its decoded RGBA must equal the master resized again by the same rule (`referenceThumb`, the one definition). At encode time, and again from the files of the finished build by `node tools/art-derive.mjs verify` (which the deploy runs on the candidate: `tools/art-verify.mjs` -> `tools/art-thumb-verify.mjs`). It also checks: one file per master under the rule's name and the recorded size; smaller than the master in pixels and bytes; a WebP only where the picture is opaque and not under the 64-byte floor; every master of the strip list present in the record (a thumbnail, or `none` with a reason); no `*.thumb.*` file the record does not list; a record that says nothing about thumbnails beside a strip list whose masters are in `public/art` is a problem unless it says it was told to make none.
- **The reference audit** (`auditArtReferences`, also run by the deploy) makes the bundle and `art/derived.json` name the same thumbnail files, each a shipped file; the **whole-set browser load gate** (`tools/art-browser-load.mjs`) loads each in WebKit and Chromium and requires the size the record gives. The deploy log prints what was proved.
- **At run time** `thumbArtUrl` (`src/engine/ArtShipped.ts`, beside `shippedArtUrl`; `artThumbUrl` in `PaintedArt.ts` beside `artUrl`) maps a master's URL to its thumbnail through the constant `__PYREFLY_ART_THUMBS__` the plugin inserts, and to **the full picture the site serves when there is none**: dev, the unit suite, `PYREFLY_ART_THUMBS=off`, a master the tool refused or one no larger than a thumbnail, a master the build forgot. A thumbnail's name (`x.thumb.webp`, `idle.thumb.png`) is nobody's master: `logicalArtUrl`, `shippedArtUrl` and the art manifest's judge leave it alone. `plateArtHtml(tile, 'card')` asks for the thumbnail and names the full picture behind it (`data-lazy-full`); `'hero'` asks for the full picture, with the strip's own thumbnail as a placeholder under it (next bullet). If a thumbnail cannot be loaded (a 404, a file that will not decode) `mountLazyPlates` shows the full picture instead of a blank strip.
- **A plate shows the small copy at once, under its full picture** (`chapterPlates.plateArtHtml(tile, 'hero')`, `data-lazy-ph`; `lazyPlates.put` takes it away the moment the full picture is up, and it stays if the full picture is judged absent). The strip's own thumbnail is already loaded; a plate whose full picture has not arrived when the cursor lands is soft, not empty. After the full picture is up the plate is the plate it always was (measured: 0 differing pixels against the live site).
- **What loads when** (`frontendWarm.boardArtUrls`, `ChapterSelectScreen.refresh`, `frontend/boardAhead.ts`): the opening card's plate and faces are waited on as before (`first`). The rest of the idle lane is now: the strips' thumbnails (the opening card's, then outward), each other card's faces nearest the cursor first with the full plate of the cards **within `PLATE_AHEAD` = 1 press** of the cursor, then the stacked body layers. A card is one press away on to the right, back to the left (the cursor wraps and skips COMING cards), or, for the first card of the other game, up or down; equally near, on to the right comes first, then the other game, then back (`cursorOrder`). The selected card's plate is loaded at urgent when it is shown (`heroPlates`). As the cursor moves the window slides: the new neighbours' plates are asked for, **the next card on to the right at the `normal` lane** (ahead of every other card's faces in the idle queue: a hand is on the keys) and the others in the idle lane; when the board opens, nothing has been pressed, so the whole window waits in the idle lane (the first paint's own set and the first input's music have the pipe: asking for the next card's plate at the opening cost the music 2.5 s on a 1.6 Mbit/s link and was changed). No other card's full plate or full strip painting is fetched until it is needed. `?ahead=N` (0 to 9) names another reach for the measurements, as `?prefetch=` does.
- **The switch.** `PYREFLY_ART_THUMBS=off` (or `PYREFLY_ART_WEBP=off`) ships none and records `thumbs.enabled: false`; the strips show the full paintings again.

## Sizes, measured on the real board

The thumbnails are sized for what the strip really takes on screen. The board was mounted in headless Chromium (`D:/Tools/pyrefly-scratch/r44-results/geometry.mjs`, dev server, real `getBoundingClientRect` of every card's art and boss) at nine windows:

| window @ device pixel ratio | strip (scene) in device px | tallest boss in device px |
|---|---|---|
| 1280 x 720 @1 | 186 | 90 |
| **1600 x 900 @1** | **233** | **118** |
| **1600 x 900 @2** | **467** | **236** |
| 2560 x 1440 @1 | 374 | 194 |
| 3840 x 2160 @1 | 562 | 295 |
| **390 x 844 @2** | **481** | **319** |
| **390 x 844 @3** (a phone) | **722** | **478** |
| 768 x 1024 @2 (a tablet) | 974 | 391 |
| 1024 x 1366 @2 (a large tablet) | 1,299 | 528 |

A thumbnail at least as wide (tall) as the strip's device pixels is as sharp as the full picture the browser would scale down: against the browser-free reference, the loss is 45 to 52 dB (invisible) when the thumbnail is as wide as the strip, and 30 dB (an upscale, soft) when it is narrower (scene thumbnails of 512 to 1,024 px against strips of 264 to 1,301 px, six backdrops). **768 px and 576 px** are sharp at 2x on a desktop and at 3x on a phone, and cover a 5K retina; a tablet in portrait at 2x (974 and 1,299 px strips) shows its strips at about 0.8 and 0.6 of their device resolution, and `THUMB_SPEC.sceneWidth = 1024` would cover the first at about 6 MB more. `tests/unit/art-thumbs.test.ts` pins the sizes against the table above.

## What changed in the pictures: measured

One headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`) per run, a fresh profile, real key presses, the HTTP cache off, the link emulated through the DevTools protocol (`tools/delivery-proof.mjs`, extended here with `--viewport/--dpr/--mobile`, the rail's strips, bytes by kind of art, a plate's blank/soft pictures and `--mash`). Three builds, the same runs: **the live site** `https://echoesofspira.com/` (r42, over the real internet under the emulated link), **the base build** (`D:/pyrefly-r43-rc/dist-gate`, built at 21:31 EDT from that worktree at origin/r43-rc 7b2582e7 with nothing else modified, served by `vite preview` on the same machine) and **the new build** (this branch, `BASE_PATH=/ vite build`, 11 GB in `dist/`, bundle `index-BfvOTAIv.js`, served by `vite preview`). The base build is the apples-to-apples "before" (same machine, same code but for this change); the live site is the literal "against the live site" and carries the internet's own variance (its bytes before the first input are lower because the real link is slower than 100 Mbit/s). The machine was shared with other agents' work throughout. Raw runs: `D:/Tools/pyrefly-scratch/r44-results/`; the compact record is `docs/handoff/r44-thumbs-results.json`.

### Bytes the board loads (100 Mbit/s, 20 ms; 6 s on the title, Enter, the board, one cursor press once it settles)

| build | before the first input | whole session | of it, the strips (thumbnails) | full backdrops and bosses | strips painted when the board is up |
|---|---|---|---|---|---|
| live site | 45.3 MB (43.1 art, 42 requests) | **129.1 MB** (114.8 art) | the full paintings (79.0 MB of files) | 101.1 MB in 66 files | 13 of 36 (8.6 s) |
| base build (r43-rc) | 66.7 MB (64.5 art, 50 requests) | **129.0 MB** (114.8 art) | the full paintings (79.0 MB of files) | 101.1 MB in 66 files | 23 of 36 (3.9 s) |
| new, reach 0 (?ahead=0) | 34.6 MB (32.4 art, 66 requests) | **70.0 MB** (55.8 art) | 11.7 MB | 30.4 MB in 31 files | 36 of 36 (all, before it) |
| new, reach 1 (the default) | 48.9 MB (46.7 art, 72 requests) | **83.8 MB** (69.5 art) | 11.7 MB | 44.1 MB in 37 files | 36 of 36 (all, before it) |
| new, reach 2 (?ahead=2) | 57.4 MB (55.2 art, 78 requests) | **93.1 MB** (78.8 art) | 11.7 MB | 53.4 MB in 43 files | 36 of 36 (all, before it) |

### When every strip is painted

| build | 6 s on the title: painted before the board is up / all painted after it is up | Enter at 0.5 s: all painted after the board is up (after Enter) | phone 390x844, 6 s: all painted after the board is up |
|---|---|---|---|
| live site | 13 of 36 / 8.6 s | 14.6 s (16.0 s) | 9.9 s |
| base build (r43-rc) | 23 of 36 / 3.9 s | 9.4 s (10.0 s) | 4.6 s |
| new (reach 1) | 36 of 36 / at once | 2.6 s (3.3 s) | at once |

### The plate when the cursor moves (per press, +60 ms after it: `blank/soft` = pictures of the plate with nothing painted / painted as the strip's small copy; a plate has 2 or more)

**Enter at 0.5 s, first press 1.5 s after the board, 3 presses 2.5 s apart**

| build | per press, blank/soft | session MB |
|---|---|---|
| live site | 2/0 2/0 2/0 | 138.3 |
| base build (r43-rc) | 2/0 0/0 0/0 | 140.3 |
| new reach 0 | 0/2 0/2 0/2 | 94.5 |
| new reach 1 (default) | 0/2 0/0 0/0 | 102.5 |
| new reach 2 | 0/2 0/0 0/0 | 110.9 |

**6 s on the title, first press 1.5 s after the board, 6 presses 2.5 s apart**

| build | per press, blank/soft | session MB |
|---|---|---|
| live site | 0/0 0/0 0/0 0/0 0/0 0/0 | 156.3 |
| base build (r43-rc) | 0/0 0/0 0/0 0/0 0/0 0/0 | 156.2 |
| new reach 0 | 0/2 0/2 0/2 0/2 0/2 0/2 | 129.2 |
| new reach 1 (default) | 0/0 0/0 0/0 0/0 0/0 0/0 | 134.9 |
| new reach 2 | 0/0 0/0 0/0 0/0 0/0 0/0 | 142.9 |

**6 s on the title, 8 presses 250 ms apart**

| build | per press, blank/soft | session MB |
|---|---|---|
| live site | 0/0 0/0 0/0 0/0 0/0 0/0 0/0 0/0 | 124.1 |
| base build (r43-rc) | 0/0 0/0 0/0 0/0 0/0 0/0 0/0 0/0 | 125.4 |
| new reach 0 | 0/2 0/2 0/2 0/2 0/2 0/2 0/2 0/2 | 97.8 |
| new reach 1 (default) | 0/0 0/2 0/2 0/2 0/1 0/1 0/1 0/1 | 110.2 |
| new reach 2 | 0/0 0/0 0/1 0/2 0/1 0/1 0/1 0/1 | 118.5 |

**Enter at 0.5 s, 8 presses 250 ms apart**

| build | per press, blank/soft | session MB |
|---|---|---|
| live site | 2/0 2/0 2/0 2/0 2/0 2/0 2/0 2/0 | 126.5 |
| base build (r43-rc) | 2/0 2/0 2/0 2/0 2/0 2/0 2/0 2/0 | 126.5 |
| new reach 0 | 0/2 0/2 0/2 2/0 2/0 2/0 2/0 2/0 | 101.6 |
| new reach 1 (default) | 0/2 0/2 0/2 2/0 2/0 2/0 2/0 1/0 | 112.8 |
| new reach 2 | 0/2 0/2 0/2 2/0 2/0 2/0 2/0 1/0 | 121.2 |

### 1.6 Mbit/s, 150 ms; 6 s on the title, then 120 s

| build | first input's music (`chapter-select.mp3`, 2.11 MB) finished after Enter | art received by 120 s | of it, thumbnails |
|---|---|---|---|
| live site | **89.0 s** | 12.35 MB | 0 MB |
| base build (r43-rc) | **81.3 s** | 12.34 MB | 0 MB |
| new (reach 1) | **81.6 s** | 13.23 MB | 0.89 MB |

### The strips and the plate against the live site (same window, reduced motion, every strip painted; the rail and the plate photographed and compared)

| window | rail: mean abs. difference (of 255) | rail PSNR | rail: 99th percentile of the difference | plate: pixels that differ |
|---|---|---|---|---|
| 1600x900@1 | 0.61 | 40.6 dB | 11 | **0 percent** (mean difference 0, PSNR 99) |
| 1600x900@2 | 0.56 | 41.1 dB | 10 | **0 percent** (mean difference 0, PSNR 99) |
| 390x844@3 | 0.68 | 38.2 dB | 12 | **0 percent** (mean difference 0, PSNR 99) |
| 390x844@1 | 0.71 | 39.5 dB | 12 | **0 percent** (mean difference 0, PSNR 99) |

### What the numbers say

1. **The strips are 79.0 MB of files before and 11.7 MB after** (36 files: 18 lossless WebP scenes 5.8 MB, 18 lossless PNG bosses 5.9 MB; 14.8 percent). Every strip is painted **before the board is up** when the player has been on the title for a few seconds (the base build: 23 of 36 up, the rest 3.9 s later; the live site 8.6 s), and 2.6 s after it when Enter is pressed at 0.5 s (the base build 9.4 s, the live site 14.6 s; on a phone 4.6 s and 9.9 s against "at once").
2. **The whole board's bytes fall by a third, not by the strips' share.** The session (title, board, one cursor press) is 129.0 MB in the base build and **83.8 MB** in this one (reach 1; 70.0 at reach 0, 93.1 at reach 2). By kind: the full backdrops fall from 70.5 to 26.6 MB and the full boss paintings from 30.6 to 17.4 MB (the 17 other cards' plates and the strips' own copies of them are no longer fetched), for 11.7 MB of thumbnails. What the board still loads, as before: the title's art and code (2 MB), the opening card's plate (its scene, 4.1 MB, and its bosses) and **every card's faces (13.7 MB of portraits)**, the music and the sound (12.0 MB), and now the plates one press from the cursor. **A few MB for the whole board is not reachable by the strips alone**: the faces are the next 14 MB, and thumbnails of the faces were not part of this yes.
3. **"Nothing may pop in later than today on a fast link."** At a human pace (a press every second or two) every plate is there when the cursor lands, as before, with a reach of 1 (the next card, the other game's first card, the card behind; the window slides with the cursor) and **a plate that has not loaded is soft instead of empty** (the plate shows the strip's own small copy under its full picture until that is up, `data-lazy-ph`): on an early press (Enter at 0.5 s, first press 1.5 s after the board) the base build and the live site show an empty plate (`2/0`), this build a soft one and then, from the second press, the full plate. **A hand scanning at four presses a second is the one place it is later than today**: the base build is fully warm by then (every plate is cached after the first seconds), this build shows the next plates soft for up to about 0.4 s each (`0/2 0/2 0/2 0/1 0/1 0/1 0/1` at reach 1, `0/0 0/1 0/2 0/1 ...` at reach 2, `0/2` throughout at reach 0), never empty, except in the first seconds after an immediate Enter, where the base build and the live site are empty throughout too. `PLATE_AHEAD` (`src/app/screens/frontend/boardAhead.ts`) is **1**; 2 costs 9.3 MB more on the session and shortens the soft moments of a fast hand by about a press; 0 saves 13.8 MB and every press shows a soft plate. One constant.
4. **The first input's music on a 1.6 Mbit/s link does not move**: 81.6 s after Enter against 81.3 s in the base build (the live site 89.0 s), as the r43 note predicted ("what shares the pipe with the first input's music is the opening card's own art", 12.3 MB of plate and faces). The strips were never in that window: in all three builds only 2 of the 36 strips are painted by 120 s, because the idle lane waits behind the first paint's own set. What would move it is the lane rule r43 proposes (the music ahead of the opening card's art), not built and needing its own yes. A first version of this change that asked for the next card's plate at the board's opening cost the music 2.5 s here and was changed: the whole window waits its turn at the opening, and the next card goes ahead of the idle queue only once a hand is on the keys.
5. **The plate is the plate it was, pixel for pixel**: photographed with reduced motion once every picture was painted, the plate (`.fe-hero`) of the new build and of the live site differ in **0 pixels** at 1600x900 at 1x and 2x and at 390x844 at 1x and 3x. **The strips are not softer to the eye**: against the live site's strips the mean absolute difference is 0.56 to 0.71 of 255 over the whole rail (PSNR 38 to 41 dB; the text, the numerals and the frames are identical, the difference is the paintings' finest grain: `docs/screenshots/r44-thumbs/*-diff-x8.png` shows it eight times amplified), the 99th percentile of the difference is 10 to 12 levels, and at two to four times pixel zoom the only difference is that single-pixel speckle in a snowfield is slightly smoother in the thumbnail's strip than in the browser's own scale-down of the 2,688 px master. Edges, figures and text are as sharp. That is with 768 px scenes and 576 px bosses at the strip sizes of the table above: 722 px is the widest strip on a phone at 3x. **The one size that is soft** is a tablet in portrait at 2x (974 px and 1,299 px strips against 768 px thumbnails): `THUMB_SPEC.sceneWidth = 1024` covers the first and costs about 6 MB more; not done.
6. **The deploy's art checks pass on the real build** (the same commands the deploy runs, on `dist/`): `node tools/art-derive.mjs verify --dir dist`: **PASS**, 3,778 masters checked (478 WebP, 3,300 PNG, 3,399 compared pixel for pixel) and **36 strip thumbnails checked (18 WebP, 18 PNG, none missing), each decoded and compared with its master resized again by the rule**, 0 problems, 190 s; `audit --dir dist`: **PASS**, 36 thumbnail names in the record and 36 in the bundle, each a shipped file and each in both; `node tools/art-browser-load.mjs --dir dist`: **PASS**, 3,778 art files, 36 strip thumbnails and 36 other images, **3,850 of 3,850 loaded and decoded at their recorded size in Chromium 153 and in WebKit 26.6**, 20 of 20 portrait plates living, 203 s. (The deploy refuses the candidate on any of the three.)

### Screenshots (`docs/screenshots/r44-thumbs/`)

`board-live-1600x900.png` and `board-new-1600x900.png`, `board-live-390x844.png` and `board-new-390x844.png`: the chapter board, before (the live site) and after (this build), 6 s on the title, every strip painted (real key presses, headless Chromium, 1x). Close-ups of the rail at 2x (1600 x 900) and 3x (390 x 844, a phone): `1600x900@2-rail-live.png`, `...-new.png`, `...-diff-x8.png` and the same for `390x844@3`. `1600x900@2-plate-new.png` is the plate (identical to the live site's, as measured).

## Tests

`tests/unit/art-thumbs.test.ts` (14: the rule's sizes, pinned against the measured table; the list; every thumbnail decodes to its master resized by the rule; cache and determinism; the record and the files `applyPlan` writes; the Vite plugin, on, off and with no list), `tests/unit/art-thumbs-gates.test.ts` (14: `verifyShippedArt` and `auditArtReferences` on tampered builds, a different picture, a lossy copy, a wrong size, a missing, doubled or unlisted file, a record that lies, a WebP of soft edges, no section, told-none; the browser load gate's plan; the deploy's wiring), `tests/unit/art-shipped-thumbs.test.ts` (7: `thumbArtUrl`, the base path, query and hash, either form of the master's name, **the full picture where the build has no thumbnail**, the manifest's judge), `tests/unit/board-thumbs.test.ts` (17: the strip list recomputed from the board and pinned, the markup of a card and a plate, the small copy under a plate and its removal, **the fallback to the full picture if a thumbnail cannot be loaded**, the cursor's reach and ranking, the plates asked for at the opening and after a move and in which lane), `tests/unit/load-time-preload.test.ts` (the board's warm list: strips first, faces next, full plates only within reach). 36 files, 520 tests of the art, board and front-end suites pass; `npx tsc --noEmit` clean; `node tools/orphans.mjs` 36 (unchanged). The full suite is the integration's.

## Not done, and for the driver

- **Not deployed.** The CHANGELOG, NOW.md and the ledgers are the integration's. The build in `dist/` has no `fx/` (this worktree has no `public/fx`, which is local-only): the deploy's `fx-assets` check needs the main tree's.
- **`PLATE_AHEAD`** (1) is the one dial between bytes and a fast hand; the table above is the evidence for 0, 1 and 2.
- **The first input's music on a slow link** (81 s) is the opening card's first-paint set and the music sharing the pipe; thumbnails cannot change it (r43's "(a)", a lane rule, needs a yes). **The faces** (13.7 MB of portraits, prefetched for every card) are the next-largest part of the board and were not part of this yes.
- **Tablets in portrait at 2x** show the strips at 0.8 and 0.6 of their device resolution (above).
- **A mishap, disclosed**: the first full build of this branch was made from Git Bash, whose path conversion turned `BASE_PATH=/` into `C:/Program Files/Git/`; it was caught by reading `index.html`, and the build was redone in place from PowerShell (`dist/` is the one dist of this tree; four builds in all: the wrong base, the same code with the right one, and one each for the two code changes the measurements asked for, the lane at the board's opening and the plate's small copy; none is left over).
- **Rebuilding.** `dist/` is 11 GB (the art ships as 10.7 GB); a build needs about that much free on D:. The thumbnails are in the art cache (`D:/Tools/pyrefly-art-cache/thumbs/...`, about 12 MB for this rule), so a second build derives nothing again.

