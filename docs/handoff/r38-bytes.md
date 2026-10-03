# r38-bytes: the painted art ships as lossless WebP (release 38 material)

Date 2026-10-03. Branch `r38-bytes` (from `origin/main` b96b5f4d). Game case: **both** (shared build plumbing; no game content,
no painting, no data value changes). Bailey, 2026-10-03: "I'll go with all your recommendations thank you <3", adopting ask 1 of
the Visual Options page (recorded as D-351, on `main` from 4b7adea6): make room under the 800 MB line (D-332, D-344: the strict 800,000,000 bytes of shipped files) without
changing a pixel, so the adopted art waiting for room can ship. The measurement behind it is
`D:/Tools/pyrefly-scratch/2026-10-03/visual-options/bytes/README.md`.

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

Switch: `PYREFLY_ART_WEBP=off|partial|safe|all` (default `all`). `off`: every PNG ships as before. `partial`: the 24 `@2x` masters
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

