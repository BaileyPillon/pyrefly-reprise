# r38-bytes: the painted art ships as lossless WebP (release 38 material)

Date 2026-10-03. Branch `r38-bytes` (from `origin/main` b96b5f4d). Game case: **both** (shared build plumbing; no game content,
no painting, no data value changes). Bailey, 2026-10-03: "I'll go with all your recommendations thank you <3", adopting ask 1 of
the Visual Options page (recorded as D-351, on `main` from 4b7adea6): make room under the 800 MB line (D-332, D-344: the strict 800,000,000 bytes of shipped files) without
changing a pixel, so the adopted art waiting for room can ship. The measurement behind it is
`D:/Tools/pyrefly-scratch/2026-10-03/visual-options/bytes/README.md`.

> **Repair, 2026-10-03: `exact` is the default now, and it supersedes `safe` and `all` wherever this note says otherwise.** The independent check
> (head 85c71746, "Check" near the end) failed `safe` on one blocker and one risk; the driver's decision was to ship the set that is the same in
> any decoder. A build that sets nothing now ships a lossless WebP only for art that is opaque or has only alpha 0 and 255 with no colour under
> alpha 0 (482 of 897 masters) and every other master as a PNG recompressed at maximum effort with its pixels proved identical (415):
> 662,321,405 bytes with the deploy's manifest, headroom 137,678,595. **Read "Repair" at the very end first.** The numbers in "Result", "Gates" and
> "Bytes and headroom" below are the builder's, for `PYREFLY_ART_WEBP=all` unless they say `safe`, and are history.
>
> **Re-check, 2026-10-03 (an independent critic, head 342a19a3): FAIL on one narrow blocker, B3.** The two fully transparent catchlight layers of Paine ship as 28-byte WebP, which WebKit cannot load, so
> in WebKit her living pause portrait stays static; the fix is a floor of 30 bytes on the WebP choice (178 bytes). B1 and B2 are fixed and every one of the nine items passes. **Read "Re-check" at the very end.**

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

Switch: `PYREFLY_ART_WEBP=off|partial|safe|exact|all` (default **`exact`** since the repair, see "Repair" at the end; the builder's default was `all`, the critic's `safe`). `off`: every PNG ships as before. `partial`: the 24 `@2x` masters
and the 30 backdrops (phase 1). `safe`: every master the browser draws the same from a WebP on every path in Chromium, plus the 24 `@2x` (superseded: not exact, see "Check" B1 and B2). `exact`: a WebP only where
every decoder draws it the same, every other master a recompressed PNG. `all`: every art PNG.

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
- A new painting ships as a lossless WebP only if it is opaque or a clean cut-out (alpha only 0 and 255, nothing under alpha 0); one with soft edges, or with colour left under its transparent pixels, ships as a recompressed PNG on purpose ("Repair" below). Nothing to decide: the build reads the pixels.
- A reviewer of a candidate build runs `node tools/art-derive.mjs verify --dir <build>` and `node tools/art-play-audit.mjs --dir
  <build>` (and, for the stricter screen claim, `node tools/art-browser-identity.mjs --dir <build> [--screen-exact]`).
- The first deploy of this change sends every painting as a new file: a cold push of about 576 MB (the deploy's own
  child-of-the-live-commit fallback applies if it times out) and a live check that downloads about 930 files (about 470 MB).
  Later releases change only what changed.

Re-running the proofs on any build folder (`dist-gate`, `dist-release`, a scratch `--outDir`):

```
node tools/art-derive.mjs warm --jobs 8                         # fill the cache ahead of a build (about 12 minutes cold, seconds warm)
node node_modules/vite/bin/vite.js build --outDir dist-gate     # any vite build derives the art (PYREFLY_ART_WEBP=off|partial|safe|exact|all; default exact)
node tools/art-derive.mjs verify --dir dist-gate                # pixel identity of every shipped file, from the files
node tools/art-derive.mjs audit --dir dist-gate --baseline <an earlier build>   # nothing names an art file the build left out
PYREFLY_BROWSER=gpu node tools/art-play-audit.mjs --dir dist-gate [--compare <report of the PNG build>] [--settle 4000] [--mobile]
PYREFLY_BROWSER=gpu node tools/art-browser-identity.mjs --dir dist-gate [--screen-exact]
PYREFLY_BROWSER=gpu node tools/art-decode-cost.mjs --dir dist-gate               # decode time of the WebP against the PNG
PYREFLY_BROWSER=gpu node tools/art-load-timing.mjs --before <url of a PNG build> --after <url of this build>   # on a quiet machine
```

## The one thing to decide, and what else the driver should know

*Decided on 2026-10-03: the driver ships `safe`, and `safe` is the default now (see "Check" at the end, which also finds that `safe` as built is
not yet exact for one `@2x` master). **Superseded the same day by "Repair": the default is `exact`.** The builder's text follows as written.*

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

**Default switched to `safe`** (history; the default is `exact` now, see "Repair"). `resolveScope` (`tools/art-derive-lib.mjs`) then defaulted to the new `DEFAULT_SCOPE = 'safe'`, declared in
`art-derive-lib.d.mts`; the planner, the plugin and the CLI follow it. `tests/unit/art-derive.test.ts` pins it four ways (the resolver, an override from
the environment with a typo still refused, the planner with no scope, the plugin with no options) and three of the four fail when the default is put back
to `all` (checked). `AGENTS.md`, `docs/DEV.md` and `docs/ART-PIPELINE.md` no longer say that every master is derived. `PYREFLY_ART_WEBP=all` still ships
everything. A build with the variable unset reports `scope safe: 547 lossless WebP, 0 recompressed PNG, 350 unchanged`.


## Repair (2026-10-03, after the independent check): `exact` ships by default

Branch `r38-bytes`. Game case: **both** (shared build plumbing; no game content, no painting, no data value changes). The independent check (section "Check" above)
failed `safe` on one blocker and one risk: **B1**, the `@2x` master of Yunalesca's third form is not the same picture on a desktop (the game's matte reads it back through
a 2D canvas, where Chromium's WebP and PNG decoders premultiply differently: 24,069 pixels by up to 124 in 255) and **B2**, in Playwright's WebKit a WebP loses the
colour under fully transparent pixels where its PNG keeps it (the 24 `@2x` masters and 41 binary-alpha masters). It also noted that D-351's "tighter PNG compression" had not been applied to the PNG that
`safe` keeps. The driver's decision: ship the decoder-independent set, as the default. **This section is the repair; where an older section of this note disagrees with it, this one wins.**

Everything below was run on 2026-10-03 against full production builds written to `D:/Tools/pyrefly-scratch/2026-10-03/r38-bytes-repair/out-*` (never `dist/`), in headless Chromium
153 on the real GPU (`PYREFLY_BROWSER=gpu`, an RTX 5070 Ti) and in Playwright's WebKit 26.6, Playwright from node (never the Claude-in-Chrome extension or the built-in pane). Scripts, logs and JSON
reports are in the same folder (`scripts/`, `logs/`, `*.json`). Every server was started by its run and stopped by PID; nothing was deployed and `deploy-pages.mjs` was not run.

### The rule

A master ships as a lossless WebP **only if its pixels are the same in any decoder**, which is exactly when premultiplying alpha is the identity on every one of its pixels:

- it is **opaque** (every alpha 255), or
- its alpha is **only 0 and 255 and no fully transparent pixel carries colour** (RGB is (0, 0, 0) under every alpha 0), so a decoder that premultiplies, or one that drops the colour under alpha 0 from a WebP
  (WebKit), has nothing to lose.

That is `decoderIndependent(alpha, hidden)` in `tools/art-image-facts.mjs`, applied by `inScope(rel, 'exact', alpha, hidden)` to what `alphaInfoOf` read from the decoded master (its class, its fully
transparent texels, how many of them still carry colour; remembered by the master's hash in the cache). An unknown fact is a no. **Every other master ships as a PNG**, recompressed at maximum effort (libvips, level 9,
adaptive filtering, no palette, no metadata chunks) with its decoded RGBA proved identical in all four channels, colour under alpha 0 included, before it is cached; where the recompressed file is not smaller, the
master's own bytes ship. The masters in `public/art` are untouched.

Why one condition covers both halves of the driver's wording. "Hidden RGB preserved, or already zero": a WebP file cannot promise to keep hidden colour in every decoder (WebKit drops it), so only "already zero" holds
everywhere. "No shipped code path cleans or re-reads it through a 2D canvas in a way that depends on premultiplication": for these pictures premultiplying is the identity, so the matte (`PaintedMatte.cleanMatte`:
drawImage, getImageData, putImageData), an `<img>`, a CSS background, a texture upload and every mip level all see the same pixels, in any engine and for any code added later; no list of code paths has to be kept true.
No name buys an exception: all 24 `@2x` masters are partly transparent with colour under alpha 0, so all 24 ship as PNG, `yunalesca-3/idle@2x` included, and the blanket "the `@2x` are only ever textures"
exemption is gone from the identity tool (`--screen-exact` exempts nothing) and from the deploy's gate.

### Which files are WebP, which are PNG, and why (897 art masters)

| What the master is | Files | Ships as | Master bytes | Shipped bytes | Saved |
|---|---|---|---|---|---|
| opaque | 63 | lossless WebP | 167,141,866 | 121,724,564 | 45,417,302 (27.2%) |
| alpha only 0 and 255, nothing under alpha 0 | 419 | lossless WebP | 235,447,768 | 161,970,006 | 73,477,762 (31.2%) |
| partly transparent, 1x | 239 | PNG, recompressed | 83,512,908 | 78,829,396 | 4,683,512 (5.6%) |
| partly transparent, `@2x` (all 24) | 24 | PNG, recompressed | 119,068,276 | 110,680,610 | 8,387,666 (7.0%) |
| alpha only 0 and 255, colour under alpha 0 | 20 | PNG, recompressed | 15,023,808 | 14,138,629 | 885,179 (5.9%) |
| recompression not smaller (111 partly transparent, 21 alpha 0 and 255 with colour under alpha 0) | 132 | PNG, the master's own bytes | 66,710,962 | 66,710,962 | 0 |
| **all** | **897** | **482 WebP, 283 recompressed PNG, 132 as they are** | **686,905,588** | **554,054,167** | **132,851,421 (19.3%)** |

So **482 files ship as WebP and 415 as PNG** (283 of them recompressed: 13,956,357 bytes less, 6.4 percent of the 217.6 MB they were; the 132 where the recompressed file was not smaller ship as the master's own bytes: their masters are already at least as tight as libvips at level 9 makes them). By folder
(masters to shipped): `backdrops` 30 files, all WebP, 125.2 to 92.4 MB; `characters` 1x 573 files (349 WebP, 127 recompressed PNG, 97 as they are) 343.2 to 280.9 MB; `characters` `@2x` 24 PNG 119.1 to 110.7 MB;
`pause` 32 WebP 40.0 to 28.5 MB; `portraits` 45 (38 WebP, 2 PNG, 5 as they are) 54.4 to 38.0 MB; `portrait-parts` 192 (32 WebP, 130 PNG, 30 as they are) 3.1 to 2.7 MB; `title` 1 WebP 2.0 to 0.9 MB.
The 482 are the check's S3 set exactly (63 + 460 - 41), and the independent scan agrees: 63 opaque, 460 binary alpha of which 41 carry colour under alpha 0 (876,123 texels), 350 partly transparent 1x of which
264 carry colour under alpha 0, 24 `@2x` all with colour under alpha 0 (47,403,800 texels).

### Bytes and headroom

Full production builds of the same sources, every file counted; the deploy adds `artifact-manifest.json` (240,268 bytes here) and the empty `.nojekyll`. The line is the strict 800,000,000 bytes (D-332, D-344).

| Build | Files | Bytes | With the deploy's manifest | Headroom under 800,000,000 |
|---|---|---|---|---|
| Before: `origin/main` b96b5f4d, PNG masters, 16-bit depth maps | 1,715 | 798,329,071 | | 1,670,929 |
| `PYREFLY_ART_WEBP=off` (the PNGs; 8-bit depth maps) | 1,715 | 794,711,808 | | 5,288,192 |
| `safe` (the check's build, superseded) | 1,716 | 627,108,618 | 627,348,953 | 172,651,047 |
| **`exact` (the default)** | **1,716** | **662,081,137** | **662,321,405** | **137,678,595** |

`exact` is 136,247,934 bytes (17.1 percent) smaller than before and 34,972,519 bytes larger than `safe`: moving the 65 masters that `safe` shipped as WebP although a decoder could draw them differently (the 24 `@2x`, 41 binary-alpha) back to PNG costs
about 48.9 MB (the check's S3), and the PNG pass takes 13.96 MB of it back. By type (the PNG build to this one): `.png` 909 files 687,901,503 bytes to 427 files 271,355,512 (415 art, 12 fx), `.webp` 32 files 10,349,514 to 514 files 294,044,084,
`.js` 4,842,023 to 4,859,430, `.json` 2,481,713 to 2,685,054 (`art/derived.json`, 203,341 bytes, now also carries each master's colour-under-alpha-0 count, the rule and the PNG pass). The first deploy of this change sends 765 changed art files, about 487 MB
(283.7 MB of WebP and 203.6 MB of recompressed PNG), plus the bundle. The cache folder `D:/Tools/pyrefly-art-cache` gained `alpha/*/*.json` (the transparency facts, 892 files: masters with the same bytes share one) and a PNG folder
`png-l9-adaptive-nopalette-nometa-sharp0.35.4-vips8.18.6-png1.6.58-zlib2.3.3` (282 files, 202.9 MB, 411 records); the WebP folder was reused as it was (all 482 needed were already there), so a cold build elsewhere spends its minutes on the
283 PNG and the facts, not on WebP.

**What the held art needs.** D-332's adopted art waiting for room is about 14.6 MB of images and about 150 MB of 2x masters. The 2x masters are partly transparent, so they ship as recompressed PNG (7.0 percent smaller on the 24 there are:
about 139.5 MB for 150), the images as WebP or PNG by their pixels (about 11 to 14 MB): roughly 150 to 154 MB against 137.7 MB of headroom. **It does not all fit** (an estimate from these ratios, not a measurement; 13 to 16 MB over).
Room could come from fewer or smaller 2x masters, or from a stronger PNG pass (see below).

### What changed

- `tools/art-image-facts.mjs` (new, with `.d.mts`): `alphaInfoOf`, `decoderIndependent`, `COLOUR_CHUNKS`, `pngChunks`, `stripAncillaryChunks`; no dependencies. The file header holds the argument above.
- `tools/art-derive-apply.mjs` (new): `applyPlan`, `derivedReport`, `shippedList`, `webpName` and `DERIVED_REPORT`, moved out of the library (which re-exports them) so it stays under 400 lines (337). The record gains `rule`, `pngEncoder`
  and, per master, `hidden`; `applyPlan` also checks the size of a recompressed copy.
- `tools/art-derive-lib.mjs`: scope `exact` and `DEFAULT_SCOPE = 'exact'`; `inScope(rel, scope, alpha, hidden)`; the transparency facts cached as `alpha/<xx>/<sha>.json` (the old `.txt` files are unused); `recompressOne` for every master that is not a WebP
  under `exact` (cached in its own folder keyed by the encoder and the libvips, libpng and zlib-ng versions); `PNG_ENCODER`; `proveSame` exported (size and every byte of all four channels, by sha256); `pixelsOf(input, { facts })`. `partial`, `safe` and `all`
  work as before, ship kept PNG as the master's own bytes, and are for measurement: the deploy's gate refuses what they ship on the real art.
- `tools/art-verify.mjs`: `verifyShippedArt` is strict by default (`exact: true`; `--allow-inexact` on the command line, `exact: false` in code): a WebP of a master that has partly transparent pixels or colour under alpha 0 is a problem, judged from the decoded
  master and not from the record, and the record's `alpha` and `hidden` must agree with it; a recompressed PNG may not carry a colour or orientation chunk its master lacks. The deploy calls it with the default, so it cannot publish a WebP of a master that a decoder could draw differently.
- `tools/art-browser-identity.mjs`: no `@2x` exemption, no exemption of any file. It now also compares each recompressed PNG with its master on every path (the same decoder on both sides, so exactly equal), and under `--screen-exact` it fails a WebP whose
  master, as the browser's own WebGL read sees it, has a partly transparent texel or colour under alpha 0.
- `tools/art-derive.mjs`, `tools/art-derive-plugin.mjs` (comments, `--allow-inexact`), `tools/deploy-pages.mjs` (a comment and the failure text), `tools/art-derive-lib.d.mts`, `tools/art-verify.d.mts`.
- Tests: `tests/unit/art-exact.test.ts` (new, 11 tests: the rule, the plan, the proof that a hidden colour, an alpha step or a size is refused, the chunks, determinism and the cache, the record, the strict gate on a build made with `all`, on a lying record and on a
  tampered PNG), `art-derive.test.ts` (the default pinned as `exact` four ways, the facts, `exact` in `inScope`), `art-verify.test.ts` (the mechanics tests opt out of exactness explicitly). Checked by mutation: weakening the rule, keeping the metadata chunks, dropping the strict
  test and disabling the proof each fail named tests.
- `AGENTS.md` (the art row and the proof row), `docs/DEV.md`, `docs/ART-PIPELINE.md` and this note.

### Gates and their numbers

| Gate | Result |
|---|---|
| Identity in the browser, `node tools/art-browser-identity.mjs --dir <exact build> --screen-exact`, no exemption | **PASS**: 765 pairs (482 WebP, 283 recompressed PNG) in 95 s, Chromium 153 on the RTX 5070 Ti. Exact as a WebGL texture 765 of 765; exact on a 2D canvas and over black and over white 765 of 765, largest difference 0 (WebP: 63 opaque, 419 binary alpha; PNG: 263 partly transparent, 20 binary alpha); the browser's own read of each of the 482 WebP masters found 0 partly transparent texels and 0 texels of colour under alpha 0. |
| Negative control for that tool: Yunalesca's `@2x` as the WebP `safe` shipped | **FAIL, as it must**: 1 problem, `art/characters/yunalesca-3/idle@2x.png: shipped as a WebP, yet the master has 100738 partly transparent texel(s) and 908976 texel(s) of colour under alpha 0: not drawn the same by every decoder`; the 2D canvas shows 80,100 pixels differing. The old tool passed exactly this pair, because it exempted every `@2x` and allowed one step in 255 on a screen pixel. |
| Pixel identity from the files, `node tools/art-derive.mjs verify --dir <build>` (strict) | **PASS**: 897 masters (482 WebP, 415 PNG), 765 pixel-compared, 0 problems, 12 s. |
| A second decoder, Pillow 12.3.0 with its own libwebp and libpng, every byte of all four channels | **PASS**: 897 entries, 672,010,533 pixels decoded on both sides, 0 differences; the 132 unchanged PNG are the master's bytes; the colour-under-alpha-0 count of each of the 765 derived files equals the record's. |
| The game's real matte on masters and shipped files (`src/engine/PaintedMatte.ts` as it is, in Chromium; plain draw, `auto`, `force`; canvases compared over all four channels) | **PASS**: 40 of 40 identical, 0 differing pixels, largest difference 0: all 24 `@2x` (recompressed PNG) and 16 binary-alpha masters (WebP) including `yunalesca-1/ko` and `yunalesca-3/hurt`; the default `auto` matte cleans three of them (`yunalesca-3/idle@2x`, `yunalesca-1/ko`, `yunalesca-3/hurt`). **Positive control**: the same harness on `safe`'s WebP of `yunalesca-3/idle@2x`: plain draw 80,100 pixels differ, the cleaned canvas 76,692 pixels by up to 255. |
| The real game, Yunalesca fought to results (1600x900, GPU, canvas hooks installed before boot) | **PASS**: the PNG build and this build give the same five hashes: cleaned canvas `yunalesca-3/idle@2x` `adee2707` (the PNG build's, the one `safe` broke: `1470abcc`), its canvas texture `3b6491cd`, `yunalesca-1/ko` `b6d48f88`, `yunalesca-3/hurt` `5a3cfbc0` and its texture `18cfcb75`; 0 console errors, 0 HTTP errors, 95 art files in both. |
| The whole game, hooked, 19 chapters to results, PNG build against this build | **PASS**: all 19 chapters fought to results on the PNG build and on this build with the canvas hooks installed before boot (1600x900, GPU): 0 console errors, 0 HTTP errors, 0 failed requests in both; the same 1,442 art files requested in total (per chapter 30 to 105); the hash of every cleaned canvas (3, all Yunalesca's) and of every canvas uploaded as a texture (18, across 15 chapters) is the same in both; no translucent WebP master was drawn to a 2D canvas in any chapter. One difference only, and it is noise: `[presenter] an actor animation did not finish within 2340ms; carrying on` (a watchdog that fires when the machine is loaded) was printed once, in `seymour-natus`, by this build, as it was printed once by the PNG build, not by `safe`, in the check's run; four quiet repeats of that chapter (two per build) print no warning at all and give the same canvas-texture hashes. |
| Another engine: Playwright's WebKit 26.6, 20 binary-alpha and 4 opaque shipped WebP against their PNG (2D canvas, over three colours, WebGL texture; every pixel, four channels) | **PASS**: 24 of 24 identical on every path, 0 pixels differ. Controls, to show the harness sees what the rule keeps out: 4 of 4 binary-alpha masters with colour under alpha 0 as WebP differ as WebGL textures (325, 6,190, 21,609 and 16,741 texels by up to 255), 2 of 4 partly transparent ones do. Firefox: Playwright's binary will not start here (`spawn UNKNOWN`), as for the check. |
| Reference audit, `node tools/art-derive.mjs audit --dir <build> --baseline <the PNG build>` | **PASS**: 724 text files; 2 names in pages (the title preload), each a shipped file; bundle 492 literal names (10 shipped files, 482 derived masters), 0 dangling (0 in the baseline, 0 new); 230 provenance mentions counted, not judged. |
| Real play, desktop, `node tools/art-play-audit.mjs --dir <build>` (22 scenarios) | **PASS**: 22 of 22 scenarios (the title and chapter select with all 19 tiles, all 18 chapters and the FF7 fight to their first command menu with the pause screen and its panels, two results screens); 3,252 image requests (2,442 WebP, 810 PNG), every one `200` with `image/webp` or `image/png`; **0 HTTP errors, 0 console errors**; 13 min. |
| Real play, 390x844 touch, CPU throttled 4x, `--mobile` (5 scenarios) | **PASS**: 22 of 22 scenarios at 390x844, touch, CPU throttled 4x (`--mobile` plays the whole list, so the five asked for are in it: the title and select, Chapter I, Chapter IV and their two results screens); 3,201 image requests (2,376 WebP, 825 PNG), every one `200` with an image type; **0 HTTP errors, 0 console errors**; 17 min. |
| The masters are untouched | `verify-approved`: 634 ok (586 approved, 48 judge-locked), 0 mismatched, 0 missing; `git diff origin/main...HEAD` holds no `public/` file and not `approved-hashes.json`; the build only reads `public/art`. |
| Bytes | 1,716 files, 662,081,137 bytes; with the manifest 662,321,405; **headroom 137,678,595** under 800,000,000. The manifest decode check lists only Paine's two flat catchlight layers (listed in `critic/policy.json`). |
| Two builds byte-identical | **PASS**: the default build and one made with `PYREFLY_ART_WEBP=exact`: 1,716 files, 662,081,137 bytes, 0 differing files; and a third build, from the committed tree (`adbec637`) with the switch unset, is byte-identical to the earlier ones (1,716 files, 662,081,137 bytes; `verify` PASS on it). |
| `npx tsc --noEmit` | clean |
| `node tools/orphans.mjs` | 24 orphaned, as expected |
| The changed tests | `art-exact` (11), `art-derive` (17), `art-verify` (11) and the neighbours `art-shipped`, `art-url-sources`, `deploy-pages-builds`, `deploy-dirty-classify`, `artifact-manifest`, `dist-filter`: 164 tests in 9 files pass. |
| Full suite, `vitest run --maxWorkers=3` | **PASS**: 778 files (773 passed, 5 skipped), 11,329 tests passed, 41 skipped, 1 todo, 793 s, exit 0, with the 19-chapter loop and a browser job running beside it. The known load timeout (`strategy-ffx2-bahamut` "heal-only route") did not occur. |

### Unresolved, and what a reviewer should know

- **Other engines.** Firefox could not be started on this machine and real Safari and iOS were not tested. The rule is decoder independent by construction (premultiplying is the identity on every pixel of every WebP), and the one other engine that runs here, WebKit, agrees on 24 of 24;
  the controls show it would have caught the defect. Every measured result is Windows, Chromium 153 and WebKit 26.6.
- **A stronger PNG pass.** "Maximum effort" here is zlib-class: this libvips is built on zlib-ng, and re-deflating the same scanlines with Node's zlib gained only 0.1 to 0.4 percent (four masters). A different deflate (zopfli, oxipng) would take more
  off the 415 PNG, probably several percent of 284 MB, but none is installed and a download needs approval (hard rule 11); it would also need the same decode proof. Not done.
- **Bytes of the PNG are not the masters' any more.** 283 shipped PNG are re-encodings: a reviewer who hashes `art/**.png` in a candidate build and compares with `docs/target/approved-hashes.json` finds them different, and the decoded pixels equal (`art/derived.json` records the master's
  `rgba`, and `node tools/art-derive.mjs verify` proves it from the files). `critic/runner/*.js` still compare art by name and were not touched: a reviewer now meets 482 WebP, 283 recompressed PNG and 132 PNG that are the masters' own bytes.
- **Load time was not measured again.** The check's +314 ms (Chapter I) and +96 ms (Chapter IV) were for `safe`; this build has 65 fewer WebP to decode (the 24 `@2x` are the biggest of them) and ships 35 MB more.
- **The held art does not all fit** (see "Bytes and headroom").
- `PYREFLY_ART_WEBP=partial|safe|all` remain for measurement. Built on the real art and run through the strict gate, all three are refused: `safe` with 65 problems (the 24 `@2x` and the 41 binary-alpha masters with colour under alpha 0, the check's B1 and B2 set), `partial` with 24 (the `@2x`), `all` with 415 (every master that is not opaque or a clean cut-out);
  with `--allow-inexact` the same builds pass, because their decoded pixels are equal. `off` and `exact` pass. Where the builds are: `out-exact-1` (the candidate every gate above ran on) and `out-off` (the PNG build) stay in the scratch folder `D:/Tools/pyrefly-scratch/2026-10-03/r38-bytes-repair/`; `out-exact-2`, `out-exact-3`, `out-safe`, `out-partial` and `out-all` are parked under `F:/pyrefly-parked/2026-10-03/r38-bytes-repair/`; the strict-gate logs are `logs/verify-*.log` in the scratch folder.


## Re-check (critic, 2026-10-03): the repaired build, `exact`, at branch head 342a19a3

A Sonnet critic that did not build or repair this lane re-checked it as the driver asked: the nine items, run, not read. Scripts, logs and JSON reports are in
`D:/Tools/pyrefly-scratch/2026-10-03/r38-bytes-recheck/` (`scripts/`, `logs/`, `results/`). The scratch builds are `out-exact` (the default candidate: built from the committed
head with no variable set), `out-off` (`PYREFLY_ART_WEBP=off`, the PNG build) and `out-safe` (`PYREFLY_ART_WEBP=safe`, the gate's negative control); `out-safe`, the gate
fixtures and the fresh cache were parked to `F:/pyrefly-parked/2026-10-03/r38-bytes-recheck/`. Nothing was written to `dist/`, `public/` or the masters; every server on ports 6750 to 6759
was started by these runs and stopped by PID (none is left); nothing was merged, deployed or pushed anywhere but this branch, and `deploy-pages.mjs` was not run in any form. Browsers:
headless Playwright from node, Chromium 153 on the RTX 5070 Ti (`PYREFLY_BROWSER=gpu`) and Playwright's WebKit 26.6 (a Windows build, so not proof about Safari or iOS); never the
Claude-in-Chrome extension or the built-in pane. Firefox still will not start on this machine (`spawn UNKNOWN`). The repair (85c71746..342a19a3) touched only `tools/`, three test files, the docs and
`AGENTS.md`: no `src/`, no `vite.config.ts`, no `tools/fx`, no `public/`. None of the first check's evidence is reused; its scripts `art-grep.mjs`, `resolver-closure.mjs`, `depth-readback.mjs` and
`timing-run.mjs` were re-run as instruments on my own builds (only the ports changed).

**Verdict: FAIL, on one narrow blocker (B3) that none of the nine items asked about and that a sample did not show: two of the 482 shipped WebP are 28 bytes long, and WebKit cannot load a 28-byte
WebP.** They are Paine's two fully transparent catchlight layers (`art/portrait-parts/paine/{1x,2x}/eyeR-catch`). In WebKit the game's `loadPlateImages` then leaves Paine's living pause portrait
static, and prints nothing. B1 and B2 are fixed, and every one of the nine items passes as it was specified; B3 is a one-rule fix that costs 178 bytes.

| # | Item | Verdict | Numbers |
|---|---|---|---|
| 1 | The default candidate, bytes and headroom | PASS | 1,716 files, **662,081,137 bytes**; with the deploy's manifest (240,268 bytes, 1,717 files listed; its decode check lists only Paine's two flat layers, both named in `critic/policy.json`, 0 problems after the filter) and `.nojekyll`: 1,718 files, **662,321,405 bytes, headroom 137,678,595** under 800,000,000. The plugin said `scope exact: 482 lossless WebP, 283 recompressed PNG, 132 unchanged`. My build is byte-identical to the repair builder's `out-exact-1` in all 1,717 files both hold. The PNG-only build is 1,715 files, 794,711,808 bytes. |
| 2 | B1: Yunalesca's 2x master through the real matte | PASS | The game, Yunalesca fought to results (1600x900, GPU, canvas hooks installed before boot), PNG-only build against the candidate: **the same five hashes**, the cleaned canvas of `yunalesca-3/idle@2x` **`adee2707:4046848`** on both (the candidate ships that master as a recompressed PNG, the same name), its canvas texture `3b6491cd`, `yunalesca-1/ko` `b6d48f88`, `yunalesca-3/hurt` `5a3cfbc0` and its texture `18cfcb75`; 0 console errors, 0 HTTP errors, 0 failed requests, 0 resource errors, 95 art files requested on both. The real `PaintedMatte.cleanMatte` (the source transpiled as it is) in Chromium on 38 masters, each as the master PNG and as the file the candidate ships, in three modes (a plain 2D draw, `auto`, `force`), every output compared over all four channels (the canvas read back and the bytes handed to `putImageData`): **39 entries, identical on every output, 0 differing pixels**; the 24 `@2x` masters, the Yunalesca trio, 6 binary-alpha masters that ship as WebP, 6 partly transparent masters that ship as PNG. `auto` cleans exactly the three Yunalesca masters, and the harness's `adee2707:4046848` is the game's. Positive control, the WebP that `safe` shipped: `1470abcc` (the check's value), 80,100 pixels differ on a plain draw and 76,692 by up to 255 after the matte (Evrae's `@2x` 124,220 and Paragon's 71,369 on a plain draw). |
| 3 | B2: WebKit | PASS as specified; **FAIL on the whole population (B3)** | Playwright WebKit 26.6, WebGL2. My seeded picks (7331): **20 shipped WebP** (14 binary-alpha with nothing under alpha 0, 6 opaque) and **10 recompressed PNG** (B1's file, 2 more `@2x`, 3 binary with colour under alpha 0, 4 partly transparent). Every pixel of all four channels, on a 2D canvas (straight and over three colours) and as a WebGL texture (premultiply off, `texelFetch`, `readPixels`): shipped against master, shipped against the truth (the master decoded by sharp, served to the page), master against the truth: **30 of 30 exact**; 8 of the 10 PNG carry colour under alpha 0 (4,591,785 texels), all of it present in the WebGL read. Controls, the `safe` WebP: **4 of 4 differ** (WebGL: 908,976, 86,303, 35,229 and 36,986 texels by up to 255, exactly the hidden colour). Chromium 153 as a second opinion: 30 of 30, and the whole derived set (482 WebP, 283 PNG, 3 min 18 s) **765 of 765 exact on every path, 0 load failures**; its control differs only on the Yunalesca `@2x` (80,100 pixels), B1's. **The whole derived set in WebKit (the same 765, 2 min 36 s): 763 exact, and 2 files did not load at all** (B3). |
| 4 | My 40 recompressed PNG, all four channels | PASS | Seed 4242: 8 `@2x`, 8 binary-alpha with colour under alpha 0, 24 partly transparent 1x. **sharp** (libvips, libpng 1.6.58), every byte compared with `Buffer.compare`: 40 of 40; **Pillow 12.3.0** (its own libpng and libwebp): 40 of 40; 17,225,939 texels of colour under alpha 0 in the sample (33 of the 40 files), the same count in the shipped files. The whole population, both decoders: **897 of 897 identical** (482 WebP, 283 recompressed PNG, 132 files that are the masters' own bytes; Pillow decoded 754,613,431 pixels a side), 65,515,489 texels of hidden colour in the 283 recompressed PNG, all kept. My own recount of the masters' transparency: 63 opaque and 419 binary with nothing under alpha 0 ship as WebP, **no WebP of any other class**, no decoder-independent master left as PNG, and the record's `alpha` and `hidden` agree with my count for all 897. |
| 5 | The deploy gate | PASS | `verifyShippedArt` (what `deploy-pages.mjs` calls, strict by default): on the exact build **PASS** (897 masters, 482 WebP, 415 PNG, 765 pixel-compared, 0 problems, 12 s); on the `safe` build **FAIL, 65 problems** (the 24 `@2x` and the 41 binary masters with colour under alpha 0: the check's B1 and B2 set), and PASS with `--allow-inexact`; on the PNG build PASS. Ten negative controls on real masters (a fixture of six, built with the repo's own code, then tampered by my code), **10 of 10 as expected**: the good build passes; colour under alpha 0 zeroed in a recompressed PNG, a WebP made without `exact`, one texel's alpha off by one and a `gAMA` chunk the master lacks are each refused; the `safe` scope is refused and still refused when its record is rewritten to say opaque and nothing hidden; `safe` passes only with `exact: false`; a doubled file and a missing file are refused. The only caller that passes `exact: false` is the command-line flag; the deploy does not. The builder's `art-browser-identity --screen-exact` on the exact build: **PASS**, 765 pairs in 93 s, exact as a WebGL texture 765 of 765, exact on screen 765 of 765, largest difference 0; on the `safe` Yunalesca `@2x` it **FAILS** with the right reason. |
| 6 | Reference audit and real play | PASS | `art-derive audit` PASS (0 new dangling against the PNG build); my own grep of every text file: 733 files, 2,118 distinct art names, 0 dangling, none in a page or a style missing; my file-by-file diff of the PNG-only build and the candidate: 813 non-art files byte-identical, 482 art PNG replaced by their WebP, 283 recompressed under the same name (13,956,357 bytes less, each smaller), 132 the masters' bytes, only `index.html` (the title preload) and the bundle's content-hashed names differ, `art/derived.json` added; the bundle's list (482 names) through the real `ArtShipped.ts`: all 897 masters map to a file the build holds (482 WebP, 415 PNG). **Desktop, 1600x900, the builder's `art-play-audit` in two runs: 22 of 22 scenarios** (the title and chapter select with all 19 tiles highlighted, all 18 chapters and the FF7 fight to their first command menu with the pause screen and its four panels, the results of Chapter I and Chapter IV): 3,246 image requests (2,439 WebP, 807 PNG), every one `200` with an image type, **0 HTTP errors, 0 console errors**. **390x844 touch, CPU throttled 4x: Chapter I and Chapter IV, 2 of 2**, 320 image requests, 0 errors. The three console warnings printed (the matte notice for `yunalesca-1/ko`, a pose-scale clamp in `sin-fins-core`, a shader compile warning) are printed by the PNG-only build too. |
| 7 | Masters untouched | PASS | `git diff origin/main...HEAD` holds no `public/` file and not `approved-hashes.json` (its blob, c3b9f889, is main's); `verify-approved`: 634 ok (586 approved, 48 judge-locked), 0 mismatched, 0 missing, on this worktree and on main; the newest file under `public/art` is from 10:22 on 2026-10-03, before this lane's first commit (16:53). |
| 8 | Static checks and tests | PASS | `npx tsc --noEmit` clean; `node tools/orphans.mjs`: 1,204 modules, **24 orphaned**; the changed tests and every test that imports a changed tool, 13 files, **290 tests pass** (`art-exact` 11, `art-derive` 17, `art-verify` 11, `art-shipped`, `art-url-sources`, `artifact-manifest`, `deploy-pages-builds`, `deploy-dirty-classify`, `dist-filter`, `fx-d-default`, `critic-owner-override`, `critic-policy-v2`, `critic-release-rules`). **The full suite was not run**: the repair changed no shared code outside `tools/` (the one `deploy-pages.mjs` change is a comment and a failure message). |
| 9 | Depth maps and the fx backup | PASS | `tools/fx/fx-assets.json` (24 entries) against `D:/Tools/pyrefly-art-backup/fx`: `fx-assets verify` PASS and my own hashing of the backup: 0 problems and no file the list does not name; the candidate's `fx/` and the worktree's `public/fx` PASS too. The list differs from main's in exactly 8 entries (`depth.png` and `depth.json` of the four rooms); once this branch is on main they agree. The 8-bit maps equal the 16-bit originals shifted right by 8, value for value, in all four rooms (Pillow, 0 differing pixels; 4,014,682 bytes to 396,493); in Chromium the game's canvas readback of the 16-bit original and of the 8-bit file the candidate ships differ by 0 pixels in 4 rooms at 5 sizes. |

**B3 (blocker): WebKit cannot load a 28-byte WebP, and the exact build ships two.** `art/portrait-parts/paine/1x/eyeR-catch` and `.../2x/eyeR-catch` are fully transparent pictures (every pixel (0,0,0,0)); the rule
files them as binary alpha with nothing under alpha 0, so they ship as lossless WebP of **28 bytes** each (the masters are 95 and 139). Running my WebKit pass over the whole derived population rather than a
sample (the first check's and the repair's samples, like mine of 20, did not draw them): for those two files `<img>` fires `error`, `decode()` rejects with `EncodingError: Loading error.` and
`createImageBitmap` throws, while their master PNG loads. The cause is the size, not the picture: every WebP of 28 bytes fails in WebKit (the same blank picture re-encoded by sharp at effort 6, a 1x1 transparent one), and
every one of 30 bytes or more loads (a solid red 30 bytes, 32, 34, 36 with an empty `JUNK` chunk added to the shipped file, 38, 40, and the shipped chunk inside a VP8X container, 46 bytes); that fits a minimum-size check in the
decoder, which I have not confirmed in WebKit's source. Chromium 153 loads all of them. The two are the only WebP under 584 bytes in the build. **What it does in the game:** `livingParts.loadPlateImages` resolves to null when any part fails ("a half-installed plate
stays static") and `LivingPortraitDriver.build` returns on null without a word, so in WebKit **Paine's living pause portrait stays a still picture** at both scales (a replica of the loader over `art/portrait-parts/manifest.json`: 18 of 20 plate and scale pairs
living, `paine@1x` and `paine@2x` static, failing part `eyeR-catch`; Chromium 20 of 20; the PNG-only build 20 of 20 in WebKit). It is FFX-2 only (Paine), a **regression against the live build** in that engine, silent (no console error,
so no error-count gate sees it), and whether Apple's own builds share the check is unknown. The fix, shown to work: with the two masters shipped as their PNG, the same WebKit run gives 20 of 20 plates living.
It costs 178 bytes (the two PNG are 234 bytes, the two WebP 56).

**Fix and gate for B3.** (1) A size floor in the choice of the shipped kind: no WebP under 30 bytes (`chooseKind` in `tools/art-derive-lib.mjs`; such a master stays PNG, recompressed if that is smaller, else its own bytes), pinned by a test with an
all-transparent master; the two layers then ship as the masters' own bytes and `critic/policy.json` already lists their `.png` names as deliberately flat. (2) The same floor in `verifyShippedArt`, so a later one-colour layer cannot bring it back (a one-colour picture
is always 28 or 30 bytes). (3) A whole-population load and identity pass in WebKit as a standing part of the review of this lane's builds (`scripts/webkit-check.mjs`, 2 min 36 s for 765 files; the picks file is `results/samples-all.json`; the script lives only in the scratch
folder, so it should be promoted to `tools/` together with the fix, for instance as an engine option of `art-browser-identity.mjs`): a sample cannot find two files in 765, and a failed load leaves no console error.

**Observations, none blocking.**
- **Other engines.** Real Safari, iOS and Firefox are untested (Firefox will not start here). The rule is decoder independent for the pixels by construction and WebKit agrees on 763 of 765 files; B3 is a container edge case that the pixel rule does not cover.
- **The CLI ignores `PYREFLY_ART_CACHE`.** `tools/art-derive.mjs plan` and `warm` call `resolveCache(option(argv, '--cache'))`, and `option` returns `null` when the flag is absent, so the default parameter that reads the environment never runs: the documented
  variable is honoured by the Vite plugin (which is what a build uses) but not by the command line (my first cold-cache run went to the default cache and encoded nothing; `--cache <dir>` works). Not a defect of a build.
- **No master carries a colour or orientation chunk** (the 897 are 8-bit, not interlaced, colour type 2 for the 63 opaque and 6 for the rest; only 18 carry `tEXt` and the title key art `pHYs`), so nothing is lost today when the recompressed PNG and the WebP drop chunks. The gate refuses a recompressed PNG that gains
  `sRGB`, `cICP`, `eXIf` and the like; it does not refuse a copy that loses one, so a later master that carries such a chunk would lose it in both shipped forms.
- **Load time**, measured again on this machine (cold cache, first load to the first command menu, 3 runs alternating, PNG-only against the candidate, the builder's `art-load-timing`): desktop Chapter I 11,553 ms against 11,870 ms (**+317 ms**), Chapter IV 12,216 against 12,418 (**+202 ms**), inside the run-to-run spread; on a 50 Mbit/s line
  Chapter I **-625 ms**, Chapter IV **-1,053 ms**; the image bytes fetched for a battle fall from 66.4 to 51.8 MB and from 57.2 to 45.8 MB. The phone profile was not re-measured.
- **The held art.** Still the builder's estimate, not a measurement, that D-332's adopted art (about 150 MB of `@2x` masters and 14.6 MB of images) is 13 to 16 MB more than the 137.7 MB of headroom.
- **`critic/runner/*.js`** still compare art by name; their approved-art check is `verify-approved.mjs` on the masters, which is unchanged and passes.
- **Determinism.** A cache that this critic filled from scratch (`art-derive warm --scope exact --cache <a fresh folder>`, 4 jobs, 16 min 38 s: 482 WebP, 283 recompressed PNG, 132 unchanged) holds a byte-identical file for all 765 derived files and the
  same decision (kind, shipped size, master size, decoded-RGBA hash) for all 897 masters as the default cache `D:/Tools/pyrefly-art-cache`, so a cold build in another worktree ships the same bytes as this one; and my build of the committed head is byte-identical to the repair builder's
  `out-exact-1`. (A first attempt at the cold run encoded nothing: it went to the default cache, see the CLI note.)

**What to do next.** (1) Apply B3's fix (a floor of 30 bytes under `exact`, the same floor in the gate, a test) and rebuild; then re-run, on the new build only, `art-derive verify` (expect 480 WebP and 417 PNG), the WebKit whole-population pass
(expect 0 load failures and 0 differing pixels) and `webkit-plates` (expect 20 of 20), and the `art-play-audit` scenario of Chapter IV (Paine); everything else above is unaffected by it. (2) The driver may instead accept B3 as a disclosed major (WebKit only, silent, FFX-2 only, real Safari unconfirmed), in which case
this re-check has no other finding: B1 and B2 are fixed and verified in two engines, and the gate holds. (3) Until one of the two, the build should not be deployed as a "pixels unchanged" release.
