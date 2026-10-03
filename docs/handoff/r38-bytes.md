# r38-bytes: the painted art ships as lossless WebP (release 38 material)

Date 2026-10-03. Branch `r38-bytes` (from `origin/main` b96b5f4d). Game case: **both** (shared build plumbing; no game content,
no painting, no data value changes). Bailey, 2026-10-03: "I'll go with all your recommendations thank you <3", adopting ask 1 of
the Visual Options page (recorded as D-351, on `main` from 4b7adea6): make room under the 800 MB line (D-332, D-344: the strict 800,000,000 bytes of shipped files) without
changing a pixel, so the adopted art waiting for room can ship. The measurement behind it is
`D:/Tools/pyrefly-scratch/2026-10-03/visual-options/bytes/README.md`.

> **Critic check, 2026-10-03 (head 85c71746): FAIL on one blocker, and `safe` is now the default.** The numbers in "Result", "Gates" and
> "Bytes and headroom" below are the builder's, for `PYREFLY_ART_WEBP=all` unless they say `safe`. What a build ships when nothing is set is
> `safe` now: 627,108,618 bytes, headroom 172,651,047 once the deploy's manifest is counted. Read "Check" at the end first: it holds the verdict
> per item, the blocker (`yunalesca-3/idle@2x` on a desktop), its fix, and one risk in other engines.

## Result

- **Bytes.** A full production build ships **576,019,006 bytes against 798,329,071 before: 222,310,065 fewer (27.85 percent)**, and the
  headroom under the strict 800,000,000-byte line goes from 1,670,929 to **223,980,994 bytes**. Art 686.9 MB to 468.0 MB (all 897
  masters are smaller as lossless WebP), the four depth maps 4.01 MB to 0.40 MB. The adopted art that is waiting for room fits with
  most of that headroom to spare.
- **Pixels.** For all 897 masters the shipped WebP decodes to the master's RGBA (sha256, both sides decoded again from the files, by
  the gate the deploy now runs), and as a WebGL texture in Chromium it is bit-identical to the PNG: the 3D scenes show the same
  pixels. 523 of them (63 opaque, 460 with alpha only 0 and 255) are identical on every path, screen included. The other 374, with
  partly transparent pixels, differ by at most 1 step in 255 on those pixels where Chromium composites them through the DOM or a 2D
  canvas (its WebP and PNG decoders premultiply with different rounding). **That is the one thing to decide (below):** `all` ships it,
  `safe` (`PYREFLY_ART_WEBP=safe`) keeps those PNG and costs 51,089,612 bytes of headroom.
- **Real play.** A headless Chromium on the real GPU played the title, chapter select, every one of the 18 chapters and the
  unlisted FF7 fight to their first command menu and pause screen, and two results screens: 22 of 22 scenarios clean in both phases,
  3,255 image requests (3,241 WebP) all answered with an image, 0 HTTP errors, 0 console errors, nothing new in the console against
  the PNG build, the same paintings asked for (a few idle-time preloads differ with timing, in both directions).
- **Load time and decode.** To the first command menu of Chapter I and Chapter IV on a first load with a cold cache, WebP against PNG: desktop on this machine -0.34 s and +0.17 s (inside the run-to-run spread); a 390x844 window with the CPU throttled 4x +0.78 s and +0.70 s (the cost: the art decodes 1.48 times slower per megapixel, 11.1 to 16.4 ms); on a 50 Mbit/s line -1.01 s and -1.61 s, because a battle fetches about a third fewer image bytes (67.3 to 45.5 MB in Chapter I). The estimate for this release was +0.3 s on a desktop and a longer first load: it is no slower here and about 0.7 s slower on a throttled phone, and on a 50 Mbit/s line the fewer bytes more than pay it back.
- **Switches and safety.** `PYREFLY_ART_WEBP=off` ships every art PNG byte for byte as before (checked); the masters,
  `approved-hashes.json` and the backups are untouched; dev and the unit suite still serve PNG.


## What it is

The masters stay PNG. `public/art/**.png` is what is approved, hashed (`docs/target/approved-hashes.json`) and backed up
(`D:/Tools/pyrefly-art-backup`), and nothing here touches it (a build with the switch off ships all 897 art PNGs byte for byte
as before). A production build **derives** a lossless WebP for each art PNG it ships and ships that instead; the PNG is left out of
the build output only.

| Piece | File | What it does |
|---|---|---|
| Derive, cache, apply | `tools/art-derive-lib.mjs` | Plans what every art PNG becomes. Encodes with sharp's libwebp, lossless, quality 100 (the exhaustive search), effort 6, `exact` (keeps the colour under alpha 0), and proves each file at encode time (decoded 8-bit RGBA, sha256, equal to the master's) before it is cached. Cache: content-addressed, `PYREFLY_ART_CACHE` (default `D:/Tools/pyrefly-art-cache`, 447 MB for the whole art set), key = master hash + encoder + library versions. A WebP that is not smaller leaves the PNG, recompressed at maximum effort when that is smaller still (pixel-identical; never needed by the real art: every one of the 897 masters is smaller as WebP). Refuses (keeps the PNG) what a WebP could not carry: an `iCCP`/`gAMA`/`cHRM` chunk, 16 bits, several frames. `applyPlan` writes the derived files into a build output, removes the PNG it replaced **from that output only**, and writes `art/derived.json` (every mapping, with the master's decoded-pixel hash). |
| Vite plugin | `tools/art-derive-plugin.mjs`, wired in `vite.config.ts` | Any `vite build` (npm run build, the deploy, a critic's `--outDir dist-gate`) plans in `config()` (the list of derived masters is inserted into the bundle as the constant `__PYREFLY_ART_WEBP__`), then in `closeBundle` applies the plan and rewrites the names in the finished `index.html` (the title plate's preload hint). Not loaded by the dev server or `vite preview`. |
| The one resolver | `src/engine/ArtShipped.ts` | `shippedArtUrl` (master name to the file that ships), `logicalArtUrl` (the inverse), `sidecarUrlOf`, `setShippedArt` (tests). Synchronous on purpose: `artUrl` runs before the art manifest has loaded. Identity in dev, in the unit suite and with the switch off. |
| Proofs | `tools/art-verify.mjs`, CLI `tools/art-derive.mjs verify` / `audit` | Pixel identity from the files (both sides decoded again) and the reference audit. The deploy runs both on the build it is about to publish (`tools/deploy-pages.mjs`). |
| Real-play audit | `tools/art-play-audit.mjs` | Headless Chromium (Playwright, from node, `PYREFLY_BROWSER=gpu`) plays a built game and fails on any missing file. |
| Browser identity | `tools/art-browser-identity.mjs` | The same pixels as Chromium decodes them, as a WebGL texture and on a 2D canvas. |
| Cost | `tools/art-load-timing.mjs`, `tools/art-decode-cost.mjs` | The battle's first load before and after (desktop, a throttled phone, a 50 Mbit/s line) and the decode time of the WebP against the PNG. |
| Depth maps | `tools/fx/depth8.py`, `tools/fx/fx-assets.json` | Four 16-bit depth maps to 8 bits with `d >> 8`. |

Switch: `PYREFLY_ART_WEBP=off|partial|safe|all` (default `safe` since the critic's check of 2026-10-03; the builder's default was `all`). `off`: every PNG ships as before. `partial`: the 24 `@2x` masters
and the 30 backdrops (phase 1). `safe`: every master the browser draws the same from a WebP on every path (see "The one thing to
decide"). `all`: every art PNG.

## Every way art is referenced, and where each one goes

`artUrl` (`src/engine/PaintedArt.ts`) is the only place an art URL is made, and it now returns the file that ships. The names the
logic keys on stay the masters' names (`art/<...>.png`): the functions that read a URL back apart first call `logicalArtUrl`.

| Way art is reached | Where | How it reaches a shipped file |
|---|---|---|
| three.js textures (`TextureLoader`, `ImageLoader`) | `PaintedArt.ts` `tryLoadImage`, `tryLoadTexture` | the URL comes from `artUrl`; the 2x master's URL from `hiResUrl` (`ArtTier.ts`), which reads either form and returns the shipped one |
| `new Image().src` (warm-ups, splash, cut-in, sphere grid, chapter panel, pause plate) | `imageWarm.ts`, `CutsceneStage.ts`, `splash.ts`, `PortraitStage.ts`, ... | URLs from `artUrl` |
| `<img src>` / `srcset` in markup strings | `titleMarkup.ts`, `chapterPlates.ts`, `portrait.ts`, `ResultsScreen.ts`, `HudMock.ts`, ... | URLs from `artUrl`; the title's 2x fallback reads the master's name first |
| CSS `url(...)` set from code (pause plates, portraits, title, chapter select, washes) | `chapterPanel.ts`, `BattleStartBanner.ts`, `PartyPrepScreen.ts`, `lazyPlates.ts`, `cutscenePlate.ts`, ... | URLs from `artUrl`. No `.css` file names art (checked) |
| `fetch` (HEAD probes, preload prefetch, sidecars) | `BattlePresenterArt.ts`, `battlePreload.ts`, `chapterPanel.ts`, `restPoses.ts`, `portrait.ts`, `portraits.ts` | probes and prefetch use `artUrl` URLs; a sidecar URL is named after the master (`sidecarUrlOf`, or the extension swap `tryLoadMeta` already did) |
| `createImageBitmap` | none in `src/` | |
| Sidecar JSON (`art/**.json`), `art/manifest.json`, `art/portrait-parts/manifest.json` | shipped as they were | no code reads an image path out of a JSON file (every JSON reader in `src/` checked); the `.png` names in sidecars and `fx/*/depth.json` are provenance and are counted, not judged, by the audit |
| Art manifest (`ArtManifest.ts`) | `judge`, `pauseStemOf`, `titleStemOf`, the 2x helpers | read the master's name (`logicalArtUrl`); a `.webp` that is not a derived master is still "an encoding nobody produced" |
| KO painting checks | `KoFallback.ts`, `KoPoseScale.ts` | read the master's name |
| Face-crop id from an `<img src>` | `portrait.ts` `portraitIdFromSrc` | read the master's name |
| Portrait parts (pause "living portraits") | `livingParts.ts` | part-file URLs built from a folder URL are passed through `shippedArtUrl` |
| Hand-built art URLs | `battleSpectacle.ts` (Bahamut splash, Ixion Overdrive, party attack paintings) | rebuilt with `artUrl` (the only file that built URLs from `BASE_URL` itself) |
| Story scripts and data tables (`art: 'art/characters/...png'`, `heroArt`, `snap.image`) | `src/story`, `src/data`, `cutsceneFigures.ts`, `chapter-meta*.ts` | hold master names; every consumer goes through `artUrl` |
| fx assets | `fx/<room>/depth.png` | not derived: they stay PNG and `tools/fx-assets.mjs` still verifies them byte for byte |
| Preload lists | `battlePreload.ts`, `frontendWarm.ts`, `imageWarm.ts`, `lazyPlates.ts` | built from `artUrl` URLs, so they warm the file the page then uses |
| `index.html` title preload (`href`, `imagesrcset`) | built page | rewritten on the finished file by the plugin (a first version did it in `transformIndexHtml` and Vite wrote `imagesrcset` after it: the reference audit caught that) |
| Service worker, web manifest | none exist | |
| `learn/` (the three learning sites) | not shipped (`copyPublicDir: false`; "publishing needs Bailey's decision") | `learn/shared/urls.ts` reads art from the game's origin; **if it is ever published it must map names through `art/derived.json`**, or it will 404 on every painting the game stopped shipping as PNG. Not done: nothing is deployed |

Two rules keep this from rotting, pinned by `tests/unit/art-url-sources.test.ts`: only the art loader, the art manifest's own path
and the audio loader may read `import.meta.env.BASE_URL`; and a file whose code matches a pattern naming `.png` must import
`ArtShipped`.

## Gates, and what each one measured

Every number is from a run on 2026-10-03 against full production builds written to a scratch folder
(`D:/Tools/pyrefly-scratch/2026-10-03/r38-bytes/out-*`, never the shared `dist/`), in headless Chromium 153 on the real GPU
(`PYREFLY_BROWSER=gpu`, Playwright from node; never the Claude-in-Chrome extension or the built-in browser pane). The phases the
brief asked for were run in order: **phase 1** (`PYREFLY_ART_WEBP=partial`: the 24 `@2x` masters and the 30 backdrops, 54 files) with
every gate, then **phase 2** (`all`, the default) with every gate again. Nothing failed that could not be fixed; the full set ships.

| Gate | Phase 1 (54 files) | Phase 2 (all 897) |
|---|---|---|
| (a) Pixel identity from the files: `node tools/art-derive.mjs verify --dir <build>`. Master PNG and shipped file both decoded again; width, height and the sha256 of the 8-bit RGBA must be equal; the build holds exactly one of the PNG and its WebP; `art/derived.json` must agree. The deploy runs it on `dist-release` (`tools/deploy-pages.mjs`). | PASS: 897 masters checked (54 WebP pixel-compared, 843 PNG byte-identical), 0 problems, 3 s | PASS: 897 masters checked (897 WebP, 897 pixel-compared), 0 problems, 11 to 18 s |
| Encode-time proof (each file, before it is cached) | the same sha256 test; any mismatch writes nothing and stops the build | 897 of 897 proved; every master smaller as WebP (worst ratio 0.86, best 0.20); 0 PNG recompressed, 0 kept |
| (b) Reference audit: `node tools/art-derive.mjs audit --dir <build> --baseline <the PNG build>`. Every `art/<...>.png\|webp` named in a page, stylesheet or JSON value must be a shipped file; every literal name in the bundle must be a shipped file or a derived master, and no name may be dangling that was not already in the baseline. The deploy runs it (without a baseline). | PASS: 724 text files; 2 names in pages (the title preload), each shipped; bundle 76 literal names (22 shipped files, 54 derived masters), 0 dangling (0 in the baseline) | PASS: the same 724 files; the title preload names `keyart.webp` and `keyart.2x.webp`; bundle names all shipped or derived, 0 dangling (0 in the baseline); 43 names built at run time, covered by the next row; 230 provenance mentions in JSON counted, not judged |
| (c) Real-play audit: `node tools/art-play-audit.mjs --dir <build>`. Per scenario: HTTP status of every request, content type of every image request, a `.png`/`.webp` under `art/` that is not a file of the build, console errors, page errors, "art missing" warnings. 22 scenarios in a fresh context each (cold cache): the title and chapter select with all 19 tiles highlighted by real keys; for all 18 chapters and the unlisted FF7 Guard Scorpion: select the tile by real keys, party prep and its tabs, begin, the pre-battle scene tapped through with real Enter presses, the battle to its first command menu, the pause screen and its four panels; the results screen of Chapter I (FFX) and Chapter IV (FFX-2) after an auto-fought battle. | 22/22 pass. 3,249 image requests: 507 WebP, 2,742 PNG, all `200` with `image/webp` or `image/png`. 0 HTTP errors, 0 console errors | 22/22 pass, on the final candidate build and on the build before the last refactor of the resolver alike. Final build: 3,255 image requests, 3,241 WebP and 14 PNG (the fx depth maps, which stay PNG), all `200` with `image/webp` or `image/png`; 0 HTTP errors, 0 console errors. `--compare` against the same 22 scenarios on the PNG build (22/22 pass, 3,260 requests): 0 console lines that the PNG build did not print |
| (c) again, phone-sized: `--mobile` (390x844, touch, CPU throttled 4x): the title and chapter select, Chapter I, Chapter IV and their two results screens | not run | 5/5 pass on the final build; 605 image requests (601 WebP, 4 PNG), 0 HTTP errors, 0 console errors |
| Same paintings asked for? (art requests with the extension ignored, as sets, per scenario, against the PNG build) | identical in 16 of 22; the other 6 differ by 1 to 5 idle-time preloads in both directions | final build: identical in 16 of 22; the other 6 differ by 1 to 5 idle-time preloads (`art/pause/yuna-ffx2`, `art/portraits/braska`, ...), in both directions, because the candidate run waited 4 s after each scenario and the baseline run did not. The FF7 scenario's 16 portraits are the same timing: with an equal 20 s wait after its first menu both builds ask for the same 28 paintings (0 on either side only) |
| (d) The browser's own pixels: `node tools/art-browser-identity.mjs --dir <build>`. Each master PNG and its shipped file loaded as images in Chromium and compared as a **WebGL texture** (`texImage2D`, premultiply off, `texelFetch` 1:1, `readPixels`: what three.js uploads and the shader samples) and on a **2D canvas** (raw, and drawn over black and over white: what a screen shows). | PASS: 54 pairs; exact as a WebGL texture 54 of 54; 30 backdrops exact everywhere; the 24 `@2x` masters differ by at most 1 in 255 on a 2D canvas | PASS: 897 pairs in 154 s. **Exact as a WebGL texture: 897 of 897.** Exact on every path, screen included: 63 of 63 opaque masters and 460 of 460 whose alpha is only 0 and 255. The 374 masters with partly transparent pixels: exact as textures (374 of 374), and on a 2D canvas or in the DOM at most **1 step in 255** on those pixels (see "The one thing to decide") |
| Artifact manifest (`tools/artifact-manifest.mjs build`: hash and decode-check every shipped file) | not run | 1,716 files, 576,019,006 bytes, every WebP decodes; the only problems are Paine's two deliberately flat catchlight layers, now listed under their `.webp` names in `critic/policy.json` (as the `.png` names were) |
| The switch off (`PYREFLY_ART_WEBP=off`) | | the same 1,715 files as the baseline but the bundle and the 8 depth-map files; all 897 art PNGs byte for byte; `verify` PASS (897 PNG) |
| `safe` (see below) | | `verify` PASS (547 WebP pixel-compared, 350 PNG), `audit` PASS, `art-browser-identity --screen-exact` PASS (547 pairs: 523 exact on every path, the 24 texture-only `@2x` masters exact as textures) |
| Static: `npx tsc --noEmit` | clean | clean |
| Unit tests | the 321 art-adjacent files (4,290 tests) passed; the new `art-shipped`, `art-derive`, `art-verify` and `art-url-sources` files pass | the full suite, `vitest run --maxWorkers=3` (777 files): 772 passed, 5 skipped (as before); 11,313 tests passed, 41 skipped, 1 todo, in 760 s; exit 0 |

What the new tests pin (`tests/unit/`): `art-shipped` runs the resolver and every function that reads an art URL back apart with a
pinned derived set (the manifest judge, the pause and title 2x lookups, `hiResUrl`, `poseScaleFor`, `lacksKoPainting`, the face-crop
id, the chapter-panel candidates); `art-derive` the phases, the alpha classes, the size choice, the cache, the refusals;
`art-verify` the gates on tampered builds (a different picture under the right name, a lossy copy, both files, neither, a stale
record), the audit, and the Vite plugin; `art-url-sources` the two source rules.


## Bytes and headroom

Full production builds of the same sources into scratch folders, every file counted (the deploy adds `artifact-manifest.json`,
240,518 bytes on the full build, and the empty `.nojekyll`, which this table leaves out). The line is the strict 800,000,000 bytes
(D-332, D-344).

| Build | Files | Bytes | Headroom under 800,000,000 |
|---|---|---|---|
| Before: `origin/main` b96b5f4d, PNG masters, 16-bit depth maps | 1,715 | 798,329,071 | 1,670,929 |
| This branch, `PYREFLY_ART_WEBP=off` (the PNGs ship; only the 8-bit depth maps differ) | 1,715 | 794,711,808 | 5,288,192 |
| Phase 1, `partial` (24 `@2x` masters + 30 backdrops) | 1,716 | 719,751,368 | 80,248,632 |
| `safe` (523 opaque and binary-alpha masters + the 24 `@2x` masters) | 1,716 | 627,108,618 | 172,891,382 |
| **Phase 2, `all` (the default)** | **1,716** | **576,019,006** | **223,980,994** |

The full build is **222,310,065 bytes (27.85 percent) smaller** than before: art 686.9 MB to 468.0 MB (218.9 MB, 31.9 percent;
all 897 art PNGs are smaller as lossless WebP), the four depth maps 4,014,682 to 396,493 bytes (3,618,189), less the 35,096 bytes the bundle grew (the list of
derived masters and the resolver) and the 197,654 bytes the JSON grew by (197,314 of them `art/derived.json`, the record of every
mapping). By type (before to after): `.png` 909 files / 691,519,692 bytes to 12 / 995,915 (the fx depth maps); `.webp` 32 /
10,349,514 (the lossy 2x plates and the title's) to 929 / 478,330,474; `.js` 4,841,437 to 4,876,533; `.json` 2,481,373 to 2,679,027;
`.mp3`, `.css`, `.woff2` unchanged.

| Folder | Files | PNG masters | Shipped (WebP) | Saved |
|---|---|---|---|---|
| `characters` 1x | 573 | 343.2 MB | 231.3 MB | 111.9 MB (32.6%) |
| `backdrops` | 30 | 125.2 MB | 92.4 MB | 32.8 MB (26.2%) |
| `characters` `@2x` | 24 | 119.1 MB | 76.8 MB | 42.2 MB (35.5%) |
| `portraits` | 45 | 54.4 MB | 36.1 MB | 18.3 MB (33.7%) |
| `pause` | 32 | 40.0 MB | 28.5 MB | 11.5 MB (28.8%) |
| `portrait-parts` | 192 | 3.1 MB | 2.0 MB | 1.0 MB (34.3%) |
| `title` | 1 | 2.0 MB | 0.9 MB | 1.1 MB (54.1%) |
| **all** | **897** | **686.9 MB** | **468.0 MB** | **218.9 MB (31.9%)** |

By what is in the picture (this is the axis the one decision below turns on): opaque 63 files, 167.1 MB to 121.7 MB; only alpha 0
and 255 ("binary") 460 files, 253.6 MB to 173.5 MB; partly transparent 374 files, 266.2 MB to 172.8 MB.

The adopted art that waits for room (D-332: 14.6 MB of images and about 150 MB of 2x masters) now fits with the whole 224 MB of
headroom, and what is installed later is itself derived (a third smaller), so the line moves out for good rather than once.


## Load-time cost

What a player waits for: the time from asking for a chapter (pre-battle scene skipped, so only the battle's own load) to its first command menu, on the first load of the page, with a cold HTTP cache (a fresh browser context per run), 3 runs per build, builds alternating, medians. Before = the PNG build, after = the default (`all`) build, both of the same sources, both served by `vite preview`. Headless Chromium 153 on the real GPU. The harness is `tools/art-load-timing.mjs`; the raw runs of this measurement are in `D:/Tools/pyrefly-scratch/2026-10-03/r38-bytes/logs/load-timing.json`. The time includes the battle's own opening moment, which is the same in both.

| Profile | Chapter | Before (PNG) | After (WebP) | Change | Image bytes fetched for the battle (before to after) | Runs, before / after |
|---|---|---|---|---|---|---|
| desktop 1600x900, no throttle (a local server: all the decode cost and none of the byte saving) | Chapter I (FFX, Seymour Flux) | 11.6 s | 11.3 s | -0.34 s | 67.3 to 45.5 MB | 11.8 s, 11.2 s, 11.6 s / 11.2 s, 11.3 s, 11.5 s |
| desktop 1600x900, no throttle (a local server: all the decode cost and none of the byte saving) | Chapter IV (FFX-2, Bahamut) | 11.9 s | 12.1 s | +0.17 s | 58.2 to 42.6 MB | 11.9 s, 12.0 s, 11.9 s / 12.2 s, 12.0 s, 12.1 s |
| phone 390x844, touch, CPU throttled 4x (local server) | Chapter I (FFX, Seymour Flux) | 16.0 s | 16.8 s | +0.78 s | 67.3 to 45.5 MB | 15.3 s, 16.0 s, 19.5 s / 16.2 s, 16.8 s, 17.6 s |
| phone 390x844, touch, CPU throttled 4x (local server) | Chapter IV (FFX-2, Bahamut) | 15.2 s | 15.9 s | +0.70 s | 48.8 to 33.0 MB | 15.1 s, 16.7 s, 15.2 s / 15.0 s, 17.6 s, 15.9 s |
| desktop 1600x900 on a 50 Mbit/s line with 20 ms round trip (what the saved bytes are worth to a player) | Chapter I (FFX, Seymour Flux) | 13.6 s | 12.6 s | -1.01 s | 67.3 to 45.5 MB | 13.5 s, 13.6 s, 13.7 s / 12.5 s, 12.6 s, 12.9 s |
| desktop 1600x900 on a 50 Mbit/s line with 20 ms round trip (what the saved bytes are worth to a player) | Chapter IV (FFX-2, Bahamut) | 15.7 s | 14.1 s | -1.61 s | 68.3 to 45.4 MB | 15.7 s, 15.7 s, 15.7 s / 14.1 s, 14.2 s, 14.0 s |

**Decode cost** (`tools/art-decode-cost.mjs`; the thing the table above pays for): `img.decode()` of the PNG master and of its WebP in the same Chromium, network excluded, median of 5 alternating runs, over a stratified sample of 90 of the 897 files (75.1 megapixels): PNG 834 ms, WebP 1233 ms, **1.48 times** (11.1 against 16.4 ms per megapixel). By kind, per file: backdrops 42 to 82 ms; characters 9 to 11 ms; 2x 51 to 78 ms; portraits 11 to 17 ms; pause 12 to 19 ms; title 13 to 22 ms. A battle decodes one backdrop, about ten sprites and the 2x masters of the figures that have them, so the added decode work is roughly a tenth to a fifth of a second of CPU, spread over the asynchronous `decode()` calls, nothing per frame. (The measurement note for this release estimated about 0.3 s.)


## Depth maps

`DepthPlates.ts` reads `fx/<room>/depth.png` through a canvas, which is 8 bits, so the low byte of the four 16-bit maps
(bevelle-underground, djose-chamber-provisional, gagazet, macalania-temple) was download weight only. `tools/fx/depth8.py` used
`round(d / 257)`, which differs from what Chromium reads out of the 16-bit file by 1 in 255 on 28 to 37 percent of the pixels;
Chromium reads a 16-bit grey PNG as its high byte, so the file is now written with `d >> 8` (the tool is fixed). Measured in
headless Chromium 153 (GPU mode): the canvas readback of the old 16-bit file against the new 8-bit one is 0 differing pixels in
all four rooms at 1344x768, 672x384 and 1024x585. The four maps went from 4,014,682 to 396,493 bytes (3,618,189 saved).
In this worktree `public/fx` verified PASS before the change (`fx-assets restore` had nothing to copy); the four maps were converted here,
not in the main tree. `tools/fx/fx-assets.json` is re-recorded (the four `depth.json` gained `"bits": 8` and a `generator` line) and
`D:/Tools/pyrefly-art-backup/fx` is updated (`node tools/fx-assets.mjs backup`: 8 files copied, verify PASS). The previous backup,
16-bit, is parked at `F:/pyrefly-parked/2026-10-03/r38-bytes/fx-backup-before/`. The main tree's own `public/fx` still holds the
16-bit files and the old list until this branch is merged; the first `npm run build` or deploy after the merge finds the mismatch
and `fx-assets ensure` restores the four rooms from the updated backup (no step to remember). The four maps are PNG in the
output (not derived): `fx-assets verify --dir <build>/fx` needs the files byte for byte.

## What a future art install must do

Nothing special. Put the PNG masters in `public/art`, regenerate the art manifest (`tools/gen/manifest.mjs`) as before, build. The
build derives the new files (a few seconds each at maximum effort, cached). For a big install, run
`node tools/art-derive.mjs warm --jobs 8` first (the whole set takes about 12 minutes on 8 jobs and is the only slow case; a cold
`vite build` does the same work on 4). The approved-hash flow is unchanged: the hashes are of the PNG masters.

- New code that makes an art URL must use `artUrl`; code that reads one back apart must call `logicalArtUrl` first.
- A deliberately flat (one-colour) image must be listed in `critic/policy.json` `intentionalFlatImages` under **both** spellings,
  `.png` and `.webp` (Paine's two catchlight layers are, and are listed).
- A master that carries `iCCP`, `gAMA` or `cHRM`, is 16-bit or has several frames ships as it is (and the plan says why).
- A reviewer of a candidate build runs `node tools/art-derive.mjs verify --dir <build>` and `node tools/art-play-audit.mjs --dir
  <build>` (and, for the stricter screen claim, `node tools/art-browser-identity.mjs --dir <build> [--screen-exact]`).
- The first deploy of this change sends every painting as a new file: a cold push of about 576 MB (the deploy's own
  child-of-the-live-commit fallback applies if it times out) and a live check that downloads about 930 files (about 470 MB).
  Later releases change only what changed.

Re-running the proofs on any build folder (`dist-gate`, `dist-release`, a scratch `--outDir`):

```
node tools/art-derive.mjs warm --jobs 8                         # fill the cache ahead of a build (about 12 minutes cold, seconds warm)
node node_modules/vite/bin/vite.js build --outDir dist-gate     # any vite build derives the art (PYREFLY_ART_WEBP=off|partial|safe|all)
node tools/art-derive.mjs verify --dir dist-gate                # pixel identity of every shipped file, from the files
node tools/art-derive.mjs audit --dir dist-gate --baseline <an earlier build>   # nothing names an art file the build left out
PYREFLY_BROWSER=gpu node tools/art-play-audit.mjs --dir dist-gate [--compare <report of the PNG build>] [--settle 4000] [--mobile]
PYREFLY_BROWSER=gpu node tools/art-browser-identity.mjs --dir dist-gate [--screen-exact]
PYREFLY_BROWSER=gpu node tools/art-decode-cost.mjs --dir dist-gate               # decode time of the WebP against the PNG
PYREFLY_BROWSER=gpu node tools/art-load-timing.mjs --before <url of a PNG build> --after <url of this build>   # on a quiet machine
```

## The one thing to decide, and what else the driver should know

*Decided on 2026-10-03: the driver ships `safe`, and `safe` is the default now (see "Check" at the end, which also finds that `safe` as built is
not yet exact for one `@2x` master). The builder's text follows as written.*

**Ship `all` (the default, as adopted) or `safe`?** The finding, from `tools/art-browser-identity.mjs`: for all 897 masters the
decoded RGBA is identical and the picture Chromium hands to WebGL as a texture is identical (the whole 3D battle). For 523 of them
(the 63 opaque and the 460 whose alpha is only 0 and 255) it is identical on every path, the DOM and 2D canvases included, because
premultiplying alpha 0 or 255 is exact in every decoder. For the other **374 masters, the ones with partly transparent pixels**,
Chromium's WebP and PNG decoders premultiply with different rounding (the only way two formats that give the same RGBA and the
same texture can give a different composited pixel; the difference is 0 where alpha is 0 or 255 and never more than 1 elsewhere),
so where the page draws one through the DOM or a 2D canvas (an `<img>`, a CSS background, `drawImage`) a partly transparent pixel
can come out **1 step in 255** different, over black and over white alike (359 of the 374 files differ somewhere; 15 do not at
all). That is far below what an eye can tell, so I left the default at `all`, as adopted. But "without changing a pixel" is then
true of the decoded pixels and of every texture, not of every composited edge pixel of that art, and Bailey's words are the ones to
read that against.

`safe` is the answer that keeps the letter: it derives the 523 masters that are identical everywhere plus the 24 `@2x` masters
(only ever loaded as textures, where the read is exact) and leaves the other 350 translucent masters as PNG. It builds to
627,108,618 bytes (headroom 172,891,382), 51,089,612 bytes more than `all`, and `art-browser-identity --screen-exact` passes on it. The
switch is one line: `PYREFLY_ART_WEBP=safe` in the environment of the deploy, or the default in `resolveScope`
(`tools/art-derive-lib.mjs`). The cache serves both, so changing it later encodes nothing.

Smaller things:

- **The cache folder** `D:/Tools/pyrefly-art-cache` (447 MB, 897 WebP and their records, plus the alpha classes) was created by this
  work and holds every file this build needs; every later build in any worktree reuses it (a cold `vite build` would spend about 12
  minutes of encoding on 8 jobs). It is safe to delete (it refills); `PYREFLY_ART_CACHE` moves it.
- **The first deploy of this change** sends every painting as a new file: a push of about 576 MB (the deploy's child-of-the-live-commit
  fallback exists for the HTTP 408 of 2026-10-01) and a live check that downloads about 930 changed files (about 470 MB; `--sample`
  does not shorten the changed set). Later releases change only what changed.
- **Reviews.** `critic-plan --paths` on this change says DEEP (shared systems: asset loader and manifests; build configuration and
  dependencies; global layout, input and boot; the title, chapter-select, prep, pause and results screens; effects, lighting and
  sprites), `focusedBeforeDeploy` true, `deepBeforeDeploy` false, `deepAfterDeploy` true, obligations live + focused + deep: not
  the save-data class. A reviewer who hashes `art/**.png` in a candidate build will find them missing by design: for the shipped
  art they run `node tools/art-derive.mjs verify --dir <build>` and `node tools/art-play-audit.mjs --dir <build>` (and, for the
  stricter screen claim, `art-browser-identity`); the approved-art check on the masters (`verify-approved`) is unchanged. I did not
  edit `critic/runner/*.js`: adding those two commands to the focused-review brief is the driver's call.
- **Merging.** The branch has not been merged or deployed. After the merge, the first build in a tree whose `public/fx` still holds
  the 16-bit depth maps restores the four rooms from the backup (`fx-assets ensure`), so nothing has to be copied by hand.
- **The worktree** `D:/pyrefly-r29-text` now sits on `r38-bytes` (it was on `rel37-int`); the junctions to `node_modules` and
  `public/art` are as they were, and nothing was written through `public/art`. Servers on 6500 to 6505 were all started by me and
  stopped by PID.


## Check (critic, 2026-10-03): `safe` as the shipping mode

A Sonnet critic that did not build this lane checked branch head 85c71746 as the driver asked: the shipping mode is `safe`, `all` only as a
note. Everything below was run, not read. Scripts, logs and JSON reports are in
`D:/Tools/pyrefly-scratch/2026-10-03/r38-bytes-check/` (`scripts/`, `logs/`, `*.json`; the scratch builds were parked to
`F:/pyrefly-parked/2026-10-03/r38-bytes-check/`). Builds went to scratch folders, never `dist/`; every server on ports 6700 to 6709 was started
by the critic and stopped by PID; nothing was deployed and `deploy-pages.mjs` was not run in any form.

**Verdict: FAIL on one blocker (B1), with one risk for the driver to decide (B2). Every other item passes.** The default is now `safe` (commit
"Make safe the default art scope", below). B1 costs one file, 2,077,508 bytes, and the fix has already been shown to work.

| # | Item | Verdict | Numbers |
|---|---|---|---|
| 1 | Bytes of the `safe` build | PASS | 1,716 files, **627,108,618 bytes**; with the deploy's `artifact-manifest.json` (240,335 bytes) 627,348,953: **headroom 172,651,047** under 800,000,000. The PNG-only build is 1,715 files, 794,711,808. |
| 2 | Pixel identity | decode PASS; on screen **FAIL (B1)** | below |
| 3 | Reference audit | PASS | below |
| 4 | Real play | PASS for files and errors; B1 shows in the differential | below |
| 5 | Masters untouched | PASS | `git diff origin/main...HEAD` has no `public/art` and no `approved-hashes.json`; the blob is main's (c3b9f889); `verify-approved` 634 ok (586 approved, 48 judge-locked), 0 mismatched, 0 missing |
| 6 | Depth maps | PASS | the 8-bit file equals `d >> 8` value for value in all four rooms; 0 differing pixels through the game's canvas path |
| 7 | Deploy plumbing | PASS | below |
| 8 | Code | PASS | below |
| 9 | Load time | PASS, within the noise | Chapter I +314 ms, Chapter IV +96 ms (medians of 3); 22 percent fewer image bytes fetched; below |

**2. Pixel identity.** From the files, the builder's `art-derive verify`: PASS (897 masters, 547 WebP and 350 PNG, 547 pixel-compared). My own
scripts, not the builder's: sharp, raw RGBA byte for byte, **547 of 547** shipped WebP equal their master's decode and 350 of 350 kept PNG are
the master's own bytes; a seeded random 40 (seed 38) 40 of 40; PIL with its own libwebp and libpng, a third decoder, 93 of 93 (the 40, all 24
`@2x`, all 30 backdrops), its bytes equal to sharp's hashes. In Chromium 153 on the GPU: the builder's `art-browser-identity --screen-exact`
PASS on 547 pairs in 83 s, 63 opaque and 460 binary-alpha exact on every path, the 24 `@2x` exact as WebGL textures and **not** exact on
screen paths (up to 1 in 255), which the tool exempts. My own check, 21 shipped opaque or binary files and 5 `@2x`, plus 8 positive controls
(translucent masters as the WebP `all` would ship, to prove the harness can see a 1 in 255 difference: it saw it in 8 of 8), over five paths (a
2D canvas, composited over three colours, a WebGL texture, real `<img>` screenshots at 1:1 and at 0.5x): the 21 exact on every path; the 5
`@2x` exact as textures with alpha exact. One correction to the builder's "never more than 1 step in 255": when the DOM scales a translucent WebP (0.5x)
the difference reaches 2.

**B1 (blocker): `art/characters/yunalesca-3/idle@2x` is not the same picture on a desktop.** The exemption "the 24 `@2x` are only ever
textures" holds for 23 and fails for this one. On a hi-tier device (not a phone, and at least 1280 px wide or a pixel ratio above 1) the game
loads the `@2x` master, and `PaintedArt.preparePainting` runs the default `auto` matte (`PaintedMatte.cleanMatte`) on it. For this painting
the matte decides to clean, so its pixels go through a 2D canvas (`drawImage`, `getImageData`, `putImageData`) and become a `CanvasTexture`. On
that route Chromium's WebP decoder premultiplies differently from its PNG decoder, the difference is magnified where alpha is low, and it is
carried into the mip levels. Measured with the game's real `cleanMatte` and the real three.js (r186) on the GPU, the PNG source against the
WebP source, with the sampling of `configurePaintedTexture`: **24,069 pixels differ by up to 124 in 255 at scale 0.5, 16,967 by up to 54 at
0.35 (mean 1.8; a thin rim along the silhouette, visible only when the difference is amplified), 7,489 by up to 11 at 0.2.** In the real game
(a hook on `putImageData` and on texture uploads, installed before the app boots; Yunalesca fought to results on a 1600x900 page) the cleaned
canvas hashes `adee2707` on the PNG build and `1470abcc` on the safe build, the uploaded texture `3b6491cd` against `d2178d84`; the cleaned canvases of
`yunalesca-1/ko` and `yunalesca-3/hurt`, which are binary-alpha WebP, are identical on both. For the other 23 `@2x` masters `cleanMatte` returns null
(PNG and WebP source alike), the image itself reaches WebGL, and two of them rendered through the same pipeline at the same three scales give
**0 differing pixels**. The tool's `@2x` exemption is how this passed.
Fix, shown to work: keep `art/characters/yunalesca-3/idle@2x.png` as PNG. A scratch copy of the safe build with only that file as its PNG,
played the same way, gives all five cleaned-canvas and canvas-texture hashes of the PNG build. It costs 2,077,508 bytes. Options, priced from
`art/derived.json` against today's headroom of 172,651,047: S1 that one file, headroom 170,573,539; S2 every `@2x` stays PNG, +42,232,420, headroom
130,418,627; S3 below. Whichever is chosen, `tools/art-browser-identity.mjs` should stop exempting `@2x` blindly: the exemption should hold only where
the game's own `cleanMatte('auto')` returns null for the master, or the next install of 2x art can bring the same defect back
(`scripts/matte-2x-check.mjs` in the scratch folder does exactly that, with the real function, for all 24).

**B2 (risk to decide): the same files in another engine.** In Playwright's WebKit 26.6 (a Windows build, so not proof about Safari or iOS) the
WebGL texture of a lossless WebP and of its PNG is the same where alpha is 255 or partial, but the colour under fully transparent texels is kept
for the PNG and zeroed for the WebP (Chromium keeps it for both). That moves filtered edges: a near-white creature gets a black halo. It affects
the shipped WebP that carry non-zero colour under alpha 0: the 24 `@2x` and **41 of the 460 binary-alpha masters** (the evrae idle poses, ixion
overdrive, bahamut hurt, the FF7 figures among them), none of the 63 opaque; the kept PNG are unaffected. Firefox could not be tested: its
Playwright binary will not run on this machine (permission denied). Real Safari and iOS were not tested. If the promise has to hold for phone
Safari too, the rule that holds in any decoder is alpha only 0 or 255 and nothing hidden under alpha 0: S3, 482 WebP files, +48,897,651 bytes,
headroom 123,753,396, which leaves no room for the held 2x masters as PNG (they would have to ship as WebP and pass B1's gate).

**3. Reference audit.** The builder's audit PASS (724 text files, 0 dangling). Mine: every `art/<...>.(png|webp|json)` in all 732 text files of the
build, 1,446 distinct names, 899 shipped files and 547 masters shipped as WebP, 0 dangling, and 0 in the PNG-only build; no page or stylesheet names
a file that is not there. A file-by-file diff of the PNG-only build and the safe build: 1,166 byte-identical, 547 PNG replaced by their WebP, the only
changed file `index.html` (the title preload now names `keyart.webp`), the bundle (a new hash name), `art/derived.json` added, nothing missing. The
list the bundle carries (the folded `__PYREFLY_ART_WEBP__`: 547 names, sorted, distinct) run through the real `ArtShipped.ts`: all 897 masters map to a
file the build holds (547 WebP, 350 PNG), the inverse and the sidecar name are right, query strings are kept, other URLs are untouched.

**4. Real play.** Headless Chromium 153 on the GPU (`PYREFLY_BROWSER=gpu`), Playwright from node, the builder's `art-play-audit` on the safe build.
**Desktop 22 of 22** (the title, chapter select with all 19 tiles, all 18 chapters and the FF7 fight to their first command menu with the pause screen and
its four panels, two results screens): 3,337 image requests (2,674 WebP, 663 PNG), every one `200` with an image type, **0 HTTP errors, 0 console
errors**; 19 scenarios reached the pause screen and its living-portrait parts were served (216 requests, 108 WebP and 108 PNG). **390x844 touch, CPU
throttled 4x, 5 of 5** (the title and select, Chapter I, Chapter IV and their two results screens; 610 image requests, 0 errors); on the first run
`results:ffx2-bahamut` hit the tool's 180 s cap while my other browser jobs held the CPU at 100 percent, and on its own it passed in 86 s. The pause
screens of Chapter I and Chapter IV from the safe build look right, and differ from the PNG build only by animation (at most 4 in 255; the PNG build differs from a second run of itself by at most 3). My own hooked runs (`drawImage`, `putImageData` and `texImage2D` hooks, 1600x900), all 19 chapters on the PNG-only build and
the safe build: to the first command menu, 0 console errors, 0 HTTP errors, 0 failed requests in both, 1,032 and 1,031 art files requested, the hash of every
cleaned canvas and canvas texture equal, no console warning that the PNG build did not print. Fought to results by the `intended` strategy at skip speed (the same hooks, all 19 chapters, both builds): 0 console errors, 0 HTTP errors, 0 failed requests, 1,442 art files requested on each, and **exactly two differences in the whole game, both `yunalesca-3/idle@2x`** (B1): its cleaned canvas and that canvas as a texture. Nothing else that was played differs.

**7. Deploy plumbing.** Read and run. `deploy-pages.mjs` runs `verifyShippedArt` and `auditArtReferences` on `dist-release` after the build and before
the manifest, and stops on either. `tools/artifact-manifest.mjs` did not change; its blank-image test already reads alpha through sharp's `stats()`: on
synthetic lossless WebP and PNG alike a one-colour alpha mask with a shape is `ok`, a flat opaque image and a fully transparent one are `blank`, a
normal image is `ok` (`scripts/webp-blank-check.mjs`). `intentionalFlatImages` names Paine's two catchlight layers under both spellings: the manifest
of the safe build lists exactly those two `.webp` and the deploy's filter leaves 0 problems; the manifest of the PNG-only build lists exactly the two
`.png` and leaves 0. With the switch off: `verify` PASS (897 PNG, byte for byte), `audit` PASS. The unit tests that touch the plumbing pass
(`deploy-pages-builds`, `deploy-dirty-classify`, `artifact-manifest`, `dist-filter`, `art-derive`, `art-verify`, `art-shipped`, `art-url-sources`: 152 tests).

**8. Code.** `npx tsc --noEmit` clean; `node tools/orphans.mjs` 24 orphaned, as expected; every new file is under 400 lines (the largest, 347); four files
that were already over 400 grew (`PaintedArt.ts` 854 to 860, `deploy-pages.mjs` 787 to 806, `portrait.ts` 760 to 761, `chapterPanel.ts` 498 to 502: rule 7
was already broken there); no battle or presenter file changed and `ArtShipped.ts` has no imports and no DOM; no new `any` or ts-ignore; relative imports
carry their extension; the game case is "both" in all three lane commits. Full suite, `vitest run --maxWorkers=3` (777 files, 810 s, with other sessions' test runs and my browsers on the machine): 771 files passed, 5 skipped, 1 failed, and that one is a load timeout: `strategy-ffx2-bahamut` "heal-only route (no Shell, no Breaks) clears Mega Flare", a simulation that takes 10 s alone against a 15 s limit; it passed on its own in 10.1 s (one earlier lone re-run, with browsers still running, timed out again). The rest: 11,316 tests passed, 41 skipped, 1 todo, which with that one is the builder's 11,313 plus the 4 new tests. Determinism: two safe builds, one with `PYREFLY_ART_WEBP=safe` and
one with the variable unset, are byte-identical in all 1,716 files (627,108,618 bytes).

**9. Load time.** Cold cache (a fresh browser context per run), first load to the first command menu, the builder's `art-load-timing` on a desktop 1600x900 page against a local `vite preview` of each build, 3 runs each, alternating, PNG-only build against the safe build, Chromium 153 on the GPU, other sessions holding the CPU near 50 percent: Chapter I 10,878 ms against 11,192 ms (medians; runs 11,431, 10,810, 10,878 against 11,028, 11,290, 11,192), **+314 ms**, inside the PNG build's own 620 ms spread; Chapter IV 11,765 ms against 11,861 ms (runs 11,765, 11,621, 11,819 against 11,861, 11,849, 11,941), **+96 ms**. The battle fetches 22 percent fewer image bytes (66.4 to 51.6 MB in Chapter I, 57.2 to 44.5 MB in Chapter IV), which a real network line turns into a gain; a local server pays only the decode. The estimate in D-351 was about 0.3 s slower; that is what `safe` costs.

**Smaller things, not blocking.** D-351 also adopted "tighter PNG compression": the 350 PNG that `safe` keeps ship as the masters' own bytes, and
maximum-effort recompression of them (decoded pixels proven identical, 40 of 40 sampled) would save about 2.7 percent, roughly 3.9 MB. `all`, for
the record: 374 translucent masters would be WebP, the same decode and texture in Chromium and a move of 1 in 255 in composited edge pixels (2 when the DOM
scales them), and B1's matte route would apply to every cleaned figure. Every identity result here is Chromium 153 on Windows. `critic/runner/*.js` still
compare art by name: a reviewer of a safe candidate now meets 350 PNG and 547 WebP.

**What to do next.** (1) Decide B1's fix (S1 is the cheap one: a named list in `inScope`, `safe` keeping `yunalesca-3/idle@2x.png` as PNG with the reason
beside it, and a test that pins the list) and B2 (S3, or accept it and say so: every identity result here is Chromium, which is what this machine runs). (2) Make `art-browser-identity --screen-exact`
exempt an `@2x` master only where the game's `cleanMatte('auto')` returns null for it. (3) Re-run on the fixed build, in this order, each against a scratch
build and never `dist/`: `art-derive verify` and `audit`; `art-browser-identity --screen-exact`; the hooked Yunalesca run to results (the scratch `scripts/hook-play.mjs`,
`hook-yunalesca-*.json` are the PNG-build reference: the five hashes must match); `art-play-audit` desktop and `--mobile`. (4) Until then the build should not
be deployed as a "pixels unchanged" release.

**Default switched to `safe`.** `resolveScope` (`tools/art-derive-lib.mjs`) now defaults to the new `DEFAULT_SCOPE = 'safe'`, declared in
`art-derive-lib.d.mts`; the planner, the plugin and the CLI follow it. `tests/unit/art-derive.test.ts` pins it four ways (the resolver, an override from
the environment with a typo still refused, the planner with no scope, the plugin with no options) and three of the four fail when the default is put back
to `all` (checked). `AGENTS.md`, `docs/DEV.md` and `docs/ART-PIPELINE.md` no longer say that every master is derived. `PYREFLY_ART_WEBP=all` still ships
everything. A build with the variable unset reports `scope safe: 547 lossless WebP, 0 recompressed PNG, 350 unchanged`.
