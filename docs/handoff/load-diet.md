# load-diet: what the first fight downloads, and the cuts that change nothing a desktop player sees

Branch `load-diet` (tree `D:/pyrefly-r39-color`), from `origin/r68-int` `7d80590d0`. 2026-10-29, the driver's lane "load-diet" (ChatGPT's point 5, load and memory; `docs/BUDGETS.md` B2a and B3a).
**Game case: both games.** A pose, a request and a wait are properties of the page, not of a game (shared plumbing, CHK-020); Chapters I to III are FFX, IV and V FFX-2, the later ones by id prefix `ffx2-`. Nothing here reads a rule or a number of either game.
Authority: Bailey, 2026-10-28 ~13:00 EDT, "please work on the pose continuity fix and and crtiques for chatgpt i mentioned awhile ago as well as motion fluidity and animation. work on all those. i'll go with all your recommendations and decision-making for the next couple days."; at midnight "I'm going to sleep please keep going".
**Nothing deploys from this branch. No browser, dev server or Playwright was run for it** (the tree and the browser belong to the lanes that hold them overnight): everything below is code, the unit tests and arithmetic on the shipped-file list of release 66; the browser jobs are written and tested without a browser (section 6) and wait for the morning.

## The short answer

- **Round 30b's cold Chapter I (`4c-reqlog-ch1.json`: 446 requests, 170 MB, 41.8 s from the card unthrottled, 76 s on Fast 4G, never in 400 s on Slow 4G) was not slow because of hi-res tiers.** At 1600 x 900 every painting is the approved 1x file; a phone asks for the same files (section 2). What the first command waited for was **every pose of every figure**: `PaintedActor.create` awaited the whole set, so a line that could not move about 48 MB of art before the pre-battle scene ended (Fast 4G, the phone) held the first menu for poses nothing on screen draws for seconds (victory, sleep, critical, follow, an Overdrive's keys).
- **Three cuts, one word (`?loaddiet=off` restores release 67 in every part):** (1) a figure waits for its opening poses (`idle*`, `ready*`) without a limit and for the others at most 3 s, then is built and they install as they land; (2) the others are started in the order a fight draws them, six at a time (all at once, every pose arrived with the last); (3) the preload's lookahead is one `<img>` per file instead of a `fetch` the decode asks for again (58 files twice in round 30b's cache-off run, 46 of the 170 MB). **A line that brings the other poses inside the ceiling sees release 67 exactly** (the same set, in the same order; tested).
- **The offline byte budget** (section 4, from the real engine, `resolveArt`, `pixelUrlFor` and the release 66 shipped-file list, 19 chapters on a 1600-wide desktop, a 2,560-wide desktop and a phone): **the first menu waits for a median of 14.1 MB of art (worst 19.4 MB, Chapter I) instead of 35.9 MB (worst 47.8 MB)**; the rest (28 MB of other poses in Chapter I, 18 MB of lighting maps, the pause close-ups) streams after it. The 2,560 x 1440 desktop: median 43.3 MB instead of 63.9.
- **What the diet does not do:** it does not make a phone's first fight small. 14 to 19 MB of paintings at the first menu is 11 to 15 s of a 10 Mbit/s line, and the board (46 MB of idle-lane warm), the SFX sprites (7.3 MB) and the music (up to 12 MB) are still asked for. B3a (50 MB to the first menu on a phone) is missed by about 8 MB for a player who presses a card within seconds and by about 44 MB for one who waits; the cut that would reach it changes a phone's pictures (a half-size derivative, section 5) and needs Bailey's yes.
- **20 predictions (LD1 to LD20) are written below, before any measurement**; the jobs are in `D:/Tools/pyrefly-scratch/2026-10-29/load-diet/jobs/` (outside git, `README.md` there). Tests: 42 new, 1,971 related tests pass, `tsc` clean.

## 1. Where the bytes of the first fight go (round 30b G4, read again)

Source: `D:/pyrefly-release55/critic/rounds/round-30/gaps2/g4/4c-reqlog-ch1.json` (read only): the live site, a fresh Chromium, **cache disabled**, 1600 x 900, Chapter I (Seymour Flux, FFX), from the title to the first menu. Every number below is summed from that file.

| | requests | wire MB | unique MB | what |
|---|---|---|---|---|
| Title and the board's warm (t 0 to 4.8 s) | 87 | 61.3 | 56.4 | bundle 1.5, the title plate 1.4, the board: 8 backdrops of 4 MB, ten portraits, the neighbours' idles and strips, the SFX sprites 7.3, the title and chapter-select music 4.4 |
| The card to the end of the preload (4.8 to 13.7 s) | 178 | 72.9 | 42.1 | the chapter's voices and music, **every pose of Tidus, Yuna, Kimahri, Seymour Flux's body and Mortiorchis at 1x** (119 files, 43.8 MB; 174 requests and 81.8 MB with the repeats), the pause close-ups |
| The scene's 14 s wait | 3 | 0.1 | 0.1 | |
| The battle's entry (28 to 30 s) | 178 | 35.3 | 24.9 | the backdrop again, the HD-2D look's **40 normal maps (about 15 MB)**, the boss's rig pieces (109 files, 4.7 MB) |
| **Total** | **446** | **169.6** | **123.4** | 58 requests (46.1 MB) are second asks of a file already asked for |

Read with care: the run is cache-OFF, so a second ask is a second download; with the cache on (a player's browser) it is a conditional request or a cache read (the art is served `max-age=0, must-revalidate`, `public/_headers`). The 46 MB is real as requests and as time on a high-latency line, and an artefact as bytes. The throttled runs (`4c-fast4g-ch1`, `4c-slow4g-ch1`, the same script) say the rest: Fast 4G (9 Mbit/s, 60 ms) 116.9 MB moved and **76 s from the card to the first menu, 52 s of them from the battle screen appearing to the first menu**; Slow 4G (1.6 Mbit/s, 150 ms) 83 MB in 459 s and no first menu in 400 s. A first menu that comes only when the link has moved nearly everything is a first menu that waits for everything.

## 2. The suspects, one by one

| Suspect (the brief's list) | What the code and the evidence say | Done |
|---|---|---|
| **Art tiers by device** | `ArtTier.baseScaleFor`: 1x under a 2,560-wide buffer, the 2x masters for the opening poses and the backdrop from 1440p, 3x and 4x only when the governor sees a figure magnified past one texel per pixel, never above the class's cap (phone and low 2, mid 2, high 4). G4's desktop asked for **no** `@Nx` file. The offline model (section 4) gives the phone and the 1600-wide desktop identical bytes: both start every painting at the approved file. | **Not the cost.** Pinned by `load-diet-bytes.test.ts` ("a phone and a 1600-wide desktop ask for the same approved paintings") |
| **Hi-res tiers on small screens** | The phone class caps masters at 2x and the base at 1x; the governor asks for a bigger one only for a figure it draws magnified (a close-up on a 390-wide window can: the phone then fetches 2x for that figure, which it can show). The pause close-up picks its 2x master by the window's cover width times the pixel ratio (`pickHeroBackgroundUrl`): 1,477 css px x 2 on a 390 x 844 window, more than the 1x plate's 1,344, so a phone takes the 2x plate and shows it. | **No leak found.** The phone's cost is the 1x set itself (section 5) |
| **The other chapter warmed in the demo** | `warmDemoFights` returns at once outside demo mode and `main.ts` starts it only `if (demoModeOn())`; `r62-demo-warm.test.ts` pins both ("does nothing outside demo mode"). G4's public run fetched no other chapter's battle art. | **Demo only; already pinned.** The board's own warm of neighbouring cards is section 3's last row |
| **Audio** | 17.9 MB of the 123: the SFX sprites 8.2 MB (`sprite.mp3` 2.7 and the recorded set `sprite-v2.mp3` 4.6 at the first input, high priority; the parity packs 0.9 at the chapter), music 9.3 (the title and chapter-select tracks 4.4, the chapter's cues 4.9), voices 0.44 (27 clips). Every one is "fetched and decoded in the background and none is ever waited for" (`SfxSprites.ts`). | **Not cut** (an audio change is Bailey's ear, rule 13). Candidate: section 5 |
| **Fx** | The depth plate of the room (`fx/gagazet/depth.png`, 0.12 MB) and the spell-effect atlas (computed, not fetched). | Nothing to cut |
| **The voiced opening** | FFX Chapter I only, 27 small clips (0.44 MB). | Nothing to cut |
| **The lighting maps** | 40 normal maps (about 15 MB in G4, 17.9 MB in the model) for the chapters whose default look is on (I and IV), all pinned at the figure's creation (`prefetchLights`, new motion on). Not waited for by the first menu (a pose is drawn unlit until its map lands). | **Streams** (they were already background); with the diet a late pose's map is asked for when the pose installs |
| **Every pose** | `loadPoses` is `Promise.all` over every pose of every figure; the stage adds all figures in parallel (`Promise.all(live.map(add))`). On a line slower than the scene is long, the first menu is the end of the whole transfer. | **The cut: sections 3 and 4** |

## 3. What was built (all behind `?loaddiet=off`)

| # | Change | Files | Tests |
|---|---|---|---|
| 1 | **The stream.** `PaintedActor.create` passes `streamCeilingMs` (3,000 ms, `LoadDiet.STREAM_CEILING_MS`) from the stage's figure request; `loadPoses` waits for the opening poses (`idle*`, `ready*` and any pose that is the same file) without a limit and for the others at most the ceiling. Inside it: the whole set in the order it was asked for (release 67). Past it: the figure is built, and each pose installs as it lands (`installLate`: set, size, map prefetch; nothing is shown or restarted; a request for a pose not there yet draws its `POSE_FALLBACKS` chain, cast then attack then idle). A figure disposed first frees what lands. A blend reload never streams. | `src/engine/LoadDiet.ts` (new, the switch and the pure rules), `src/engine/PoseStream.ts` (new), `PaintedActorPoses.ts` (`loadPoses`, `installLate`; 379 lines), `PaintedActor.ts`, `PaintedActorState.ts`, `PaintedActorTypes.ts` (three optional fields), `StageFigureRequest.ts` (one line) | `load-diet.test.ts` (12), `load-diet-pose-stream.test.ts` (6), `load-diet-stream.test.ts` (6, on the real `PaintedActor`), `load-diet-request.test.ts` (3: the stage's request carries the ceiling and `?loaddiet=off` takes it away) |
| 2 | **The order.** The other poses start only after the opening ones, in the order a fight draws them (`poseNeed`: 0 idle and ready, 1 attack / cast / hurt / item / defend / telegraph, 2 the rest, 3 victory / sleep / critical / follow / Overdrive keys), **six at a time** (`LATE_WINDOW`), so that on a slow line the poses a fight draws first arrive first (started all at once they share the line equally and every one arrives with the last). The preload's phase 4 downloads in the same order, the boss before the party inside a need. | `PoseStream.ts` (`startWindowed`, `loadStreamed`), `battlePreload.ts` | `load-diet-preload.test.ts` (5 of 8), `r39-preload-masters.test.ts` (now run both ways) |
| 3 | **One request per file.** The preload's lookahead was `fetch(url).blob()` and the decode asked again through an `<img>` (`PaintedArt.tryLoadImage`). It is now an `<img>` of its own, `crossOrigin = 'anonymous'` (three's `ImageLoader` asks the same; a different request mode would not share the memory cache), held until that pose's decode is done and cancelled when the preload is stopped. | `src/app/screens/preloadFetch.ts` (new), `battlePreload.ts` | `load-diet-preload.test.ts` (3 of 8) |

**Why 3 s and six.** A fast line (50 Mbit/s) moves 19 MB in 3 s; the card (1.3 s) and the opening sweep (6.1 to 6.6 s) put 7 to 8 s between the figure being built and the first command, so a pose that lands within 10 s of the build is in before anyone can ask for it. Six in flight keeps a fast line full and leaves the first-needed poses most of the line. Both are constants in `LoadDiet.ts` / `PoseStream.ts`; the morning's jobs are where they are tuned, not here.

**What a player can see, honestly.** On a line that moves the other poses inside 3 s (and for any player who reads the pre-battle scene on a fast line, which is where the preload has them all long before): nothing. On a slower line the fight starts as soon as the opening poses are in, and for the seconds until a move's own painting lands that move draws the fallback painting. The one case where a fallback is wrong rather than approximate is a figure KO'd before its `ko` painting has landed (the existing no-KO-painting path lays the standing painting down; `KoFallback`). `ko` is in need class 2, after the everyday moves. The by-eye job (ld8) is how this is looked at.

**Not done, and why** (each is a thing the brief's list suggests, looked at and left):

| Candidate | Why not tonight |
|---|---|
| Fewer plates within the board's reach, or none until the cursor moves | The board's warm is the idle lane: held and cancelled the moment a chapter is chosen (`holdIdleLane`), behind the opening card's set. On Slow 4G only about 4 MB can arrive before a quick press, and a player who waits has the time to spend. It costs bytes for a player who never plays, not time for one who does; a change there is a visible change to the board. |
| Defer the recorded SFX set (4.6 MB) to the chapter's start | `SfxSprites` already degrades (a v2 cue before its sprite plays the first bank's stand-in), but which sound the title and the menus make is Bailey's ear (rule 13). A candidate for him. |
| Stream the boss rig's variants (attack / cast / hurt / telegraph / ko pieces) | The rig loads before the figure exists (`tryRigFigure`) and its pieces are not poses; it is 3.5 MB of the first menu (four chapters: Seymour Flux, Bahamut, Yojimbo, the Mirror Aeons). A second change of the same kind, with its own risk. |
| The painted poses of a RIGGED boss | `RigActor.createRigged` loads only the idle painting; the boss is drawn from its rig's pieces (Seymour Flux's body in Chapter I: attack, cast, hurt, telegraph and ko, 4.3 MB of painted poses that G4 shows fetched and nothing draws). They are the fallback if the rig fails to build (`noteRigFailure`), so the preload would have to know the rig's verdict (`chooseRig`, async). Under the diet they are streamed after the first menu anyway; skipping them saves background bytes in four chapters. A candidate. |
| The board's focused-card preload (A-3: 450 ms on a card starts its scene art, backdrop and idles) | It is what hides a cold battle load on a fast line; a newer focus stops the older run and demotes what it asked for, and choosing a chapter holds the idle lane. Not changed. |
| A phone-sized derivative of the 1x set | Section 5. |
| `PAINTING_CACHE_MB` by class, the `art.stats()` accessor | BUDGETS section 7 items 1 and 2; memory, not load. |

## 4. The byte budget, per chapter, computed offline

`tests/unit/helpers/load-bytes-model.ts` + `tests/unit/load-diet-bytes.test.ts` (7 tests; `LOAD_DIET_REPORT=<file>` writes the rows). For each of the 19 listed chapters and each profile it builds the opening state with the real engine (as `battlePreload` does), resolves each figure's poses with the real `resolveArt` over `public/art/manifest.json`, picks the file each is drawn from with the real `pixelUrlFor` on the profile's class and buffer, takes the scene's paintings from the real `sceneArtUrls`, the party's pause close-up from the real `pickHeroBackgroundUrl`, the lighting maps from the real `normalMapScaleFor` (a chapter whose default look is on), the rig pieces from the manifest (a rig the stage builds: not the party pilots), and sizes every file from `critic/artifacts/2b48cee95.json` (the path and bytes of what release 66 served). The model's Chapter I (66.7 MB of art, 4.7 MB of music) matches G4's card-to-menu unique bytes (67 MB, audio apart).

Desktop 1600 x 900 (buffer 1600, high class) and phone 390 x 844 at pixel ratio 2 (phone class) are the same table: both start every painting at the approved 1x file. MB, art only (the music column is the chapter's own cues, not in the first-menu columns).

| Chapter | Game | Scene + plate + faces | Opening poses | Other poses | Rig pieces | Pause plates | Lighting maps | Music | First menu, release 67 | First menu, diet | Streamed after |
|---|---|---|---|---|---|---|---|---|---|---|---|
| seymour-flux | FFX | 10.4 | 5.5 | 28.4 | 3.5 | 1.0 | 17.9 | 4.7 | 47.8 | **19.4** | 47.3 |
| yunalesca | FFX | 13.9 | 4.9 | 25.7 | 0.0 | 0.9 | 0.0 | 3.3 | 44.5 | **18.8** | 26.7 |
| braskas-final-aeon | FFX | 6.7 | 5.4 | 26.3 | 0.0 | 0.9 | 0.0 | 5.1 | 38.4 | **12.0** | 27.3 |
| ffx2-bahamut | FFX-2 | 10.7 | 4.5 | 18.2 | 3.8 | 1.1 | 13.7 | 3.4 | 37.2 | **19.0** | 33.1 |
| ffx2-vegnagun-shuyin | FFX-2 | 12.3 | 4.8 | 16.2 | 0.0 | 1.1 | 0.0 | 5.3 | 33.3 | **17.1** | 17.4 |
| ffx2-leblanc | FFX-2 | 11.7 | 4.4 | 15.8 | 0.0 | 1.1 | 0.0 | 4.2 | 31.9 | **16.1** | 17.0 |
| seymour-anima-macalania | FFX | 11.4 | 5.0 | 22.7 | 0.0 | 1.1 | 0.0 | 3.3 | 39.1 | **16.4** | 23.8 |
| evrae-airship | FFX | 9.7 | 4.4 | 21.8 | 0.0 | 1.0 | 0.0 | 3.6 | 35.9 | **14.1** | 22.8 |
| yojimbo-cavern | FFX | 9.1 | 5.6 | 22.8 | 1.5 | 1.1 | 0.0 | 3.5 | 39.0 | **16.2** | 23.9 |
| seymour-natus | FFX | 11.3 | 5.5 | 26.3 | 0.0 | 1.0 | 0.0 | 3.4 | 43.2 | **16.8** | 27.4 |
| ffx2-fallen-aeons | FFX-2 | 9.0 | 4.7 | 16.5 | 0.0 | 1.1 | 0.0 | 3.8 | 30.2 | **13.7** | 17.7 |
| seymour-omnis | FFX | 6.5 | 5.3 | 22.6 | 0.0 | 0.9 | 0.0 | 3.5 | 34.4 | **11.8** | 23.5 |
| ffx2-trema | FFX-2 | 8.5 | 5.1 | 18.1 | 0.0 | 1.1 | 0.0 | 3.7 | 31.7 | **13.6** | 19.2 |
| isaaru-via-purifico | FFX | 7.6 | 2.9 | 10.3 | 0.0 | 0.4 | 0.0 | 3.6 | 20.8 | **10.5** | 10.7 |
| ffx2-den-of-woe | FFX-2 | 7.2 | 4.5 | 15.3 | 0.0 | 1.1 | 0.0 | 3.8 | 27.1 | **11.7** | 16.5 |
| ffx2-ixion-djose | FFX-2 | 7.6 | 4.7 | 16.9 | 0.0 | 1.1 | 0.0 | 3.9 | 29.2 | **12.2** | 18.0 |
| sin-fins-core | FFX | 9.8 | 5.2 | 21.4 | 0.0 | 0.9 | 0.0 | 3.5 | 36.4 | **15.0** | 22.4 |
| sin-face | FFX | 8.5 | 4.9 | 20.6 | 0.0 | 0.9 | 0.0 | 3.5 | 34.0 | **13.4** | 21.6 |
| mirror-aeons | FFX | 7.2 | 4.1 | 23.3 | 1.5 | 1.1 | 0.0 | 5.1 | 36.1 | **12.8** | 24.5 |

Median over the 19 chapters: first menu 35.9 MB under release 67, **14.1 MB** under the diet; worst 47.8 MB and **19.4 MB**. The 2,560 x 1440 desktop (the 2x masters start there): median 63.9 to **43.3 MB**, worst 86.6 to **58.2 MB**.

Front end (the board's warm, the same on every profile): the opening card's set the board waits for 8.8 MB; the rest 46.4 MB (rail strips 12.1, faces 6.4, plates within reach of the cursor 28.0), in the idle lane.

2,560 x 1440 desktop:

| Chapter | Game | Scene + plate + faces | Opening poses | Other poses | Rig pieces | Pause plates | Lighting maps | Music | First menu, release 67 | First menu, diet | Streamed after |
|---|---|---|---|---|---|---|---|---|---|---|---|
| seymour-flux | FFX | 24.2 | 23.6 | 28.4 | 10.4 | 1.0 | 17.9 | 4.7 | 86.6 | **58.2** | 47.3 |
| yunalesca | FFX | 27.8 | 23.4 | 25.7 | 0.0 | 0.9 | 0.0 | 3.3 | 77.0 | **51.2** | 26.7 |
| braskas-final-aeon | FFX | 18.2 | 25.6 | 26.3 | 0.0 | 0.9 | 0.0 | 5.1 | 70.2 | **43.8** | 27.3 |
| ffx2-bahamut | FFX-2 | 25.2 | 19.6 | 18.2 | 11.3 | 1.1 | 13.7 | 3.4 | 74.3 | **56.0** | 33.1 |
| ffx2-vegnagun-shuyin | FFX-2 | 24.1 | 22.8 | 16.2 | 0.0 | 1.1 | 0.0 | 5.3 | 63.2 | **47.0** | 17.4 |
| ffx2-leblanc | FFX-2 | 24.7 | 17.8 | 15.8 | 0.0 | 1.1 | 0.0 | 4.2 | 58.3 | **42.5** | 17.0 |
| seymour-anima-macalania | FFX | 26.1 | 25.5 | 22.7 | 0.0 | 1.1 | 0.0 | 3.3 | 74.3 | **51.6** | 23.8 |
| evrae-airship | FFX | 21.4 | 21.1 | 21.8 | 0.0 | 1.0 | 0.0 | 3.6 | 64.4 | **42.5** | 22.8 |
| yojimbo-cavern | FFX | 18.9 | 21.8 | 22.8 | 4.6 | 1.1 | 0.0 | 3.5 | 68.0 | **45.2** | 23.9 |
| seymour-natus | FFX | 26.0 | 23.3 | 26.3 | 0.0 | 1.0 | 0.0 | 3.4 | 75.6 | **49.3** | 27.4 |
| ffx2-fallen-aeons | FFX-2 | 19.9 | 22.1 | 16.5 | 0.0 | 1.1 | 0.0 | 3.8 | 58.6 | **42.0** | 17.7 |
| seymour-omnis | FFX | 18.5 | 27.4 | 22.6 | 0.0 | 0.9 | 0.0 | 3.5 | 68.5 | **45.9** | 23.5 |
| ffx2-trema | FFX-2 | 21.9 | 20.9 | 18.1 | 0.0 | 1.1 | 0.0 | 3.7 | 60.9 | **42.9** | 19.2 |
| isaaru-via-purifico | FFX | 18.8 | 14.6 | 10.3 | 0.0 | 0.4 | 0.0 | 3.6 | 43.7 | **33.4** | 10.7 |
| ffx2-den-of-woe | FFX-2 | 16.6 | 20.0 | 15.3 | 0.0 | 1.1 | 0.0 | 3.8 | 51.9 | **36.6** | 16.5 |
| ffx2-ixion-djose | FFX-2 | 17.9 | 22.2 | 16.9 | 0.0 | 1.1 | 0.0 | 3.9 | 57.1 | **40.2** | 18.0 |
| sin-fins-core | FFX | 20.6 | 21.1 | 21.4 | 0.0 | 0.9 | 0.0 | 3.5 | 63.1 | **41.7** | 22.4 |
| sin-face | FFX | 20.0 | 23.3 | 20.6 | 0.0 | 0.9 | 0.0 | 3.5 | 63.9 | **43.3** | 21.6 |
| mirror-aeons | FFX | 7.2 | 16.1 | 23.3 | 4.6 | 1.1 | 0.0 | 5.1 | 51.2 | **27.9** | 24.5 |

**B3a (BUDGETS: 100 MB on a desktop and 50 MB on a phone, "wire bytes from navigation to the first command menu, one chapter"), worst chapter, by the arithmetic of section 1's table:** title and bundle 3.0 + the board (first 8.8 + rest 46.4, idle lane) + the SFX sprites and the two menu tracks 11.7 + the chapter's art and music. **Release 67: 3.0 + 55.2 + 11.7 + 47.8 + 5.2 = 123 MB** (G4's 123.4 unique), over 100 on a desktop; **the diet: 3.0 + 55.2 + 11.7 + 19.4 + 5.2 = 94 MB**, inside 100 by 6 for a player who waits at the title until the board has finished warming and by about 44 over 50 on a phone; for a player who presses a card within seconds the board's `rest` is cut short (about 10 MB of it arrives) and the sum is about 58 MB: **8 over the phone's 50**. The board is the next biggest piece after the diet and the paintings themselves.

## 5. What would take a phone to 50 MB (needs Bailey's yes: it changes a phone's pictures)

The model's finding is a fact worth stating plainly: **a phone is shown, and fetches, the same 1x paintings as a 1600-wide desktop.** A figure on a 390 x 844 window at pixel ratio 2 is at most about 600 device pixels tall; the approved 1x painting is about 1,200 px of figure. The texture is minified 2x on the phone's GPU. A half-size copy for the phone class (`<state>@0.5x`, derived from the approved master, never written over it) would be about a third of the bytes (a PNG's size follows its pixels; an estimate, not measured): the first menu's 19.4 MB would be about 7 MB and the other poses 28 MB about 10 MB. It is a new kind of tier (the code's tiers are 2, 3 and 4: `scaleOfUrl`, `realW = image.width / scale` and the sidecars assume `scale >= 1`), a derivation step in `tools/art-derive-lib.mjs`, and a picture to approve (a minified-by-GPU figure against a pre-minified one, AGENTS.md rule 9). It is **not built and not proposed as built**: rule 10, ideas need a yes. It is the only lever on the phone's paintings that does not wait on the line.

## 6. The jobs and the predictions (written before any measurement; AGENTS.md rule 15)

`D:/Tools/pyrefly-scratch/2026-10-29/load-diet/jobs/` (outside git; `README.md`, `queue.json`, `ld-predictions.json`, `judge-ld.mjs`, `selftest.mjs`: 24 checks pass; `first-command.mjs` is the budgets lane's J2 patched by `make-ld-jobs.mjs` for an address word and a per-request log). The candidate is built lean (`tools/lean-vite.config.mts`) and served over the live artifact's art (`tools/overlay-static.mjs`, port 5611, read-only), **both arms one build, the arm is `&loaddiet=off`**. 8 entries, about 58 minutes of browser: desktop 50 Mbit/s and phone 10 Mbit/s, the scene held and the scene read, three runs an arm; round 30b's Fast 4G and a phone on its Slow 4G; the frame job both arms; a look by eye at the first attacks on the phone. Chapter I (FFX, seed 7) is the measured chapter, Chapter IV (FFX-2) the second where time allows.

| ID | Run | Metric (median of 3) | Expected | Why |
|---|---|---|---|---|
| LD1 | desk50, hold, arm off | loadMs | 3 to 9 s | 40 MB still to come at 6.25 MB/s is 6.4 s, less 4 s of prep and a held scene, plus the 2 to 3 s work floor |
| LD2 | desk50, hold, arm on | loadMs | 1.5 to 4.5 s | 11 MB to wait for is 1.8 s of line; the work floor of the entry (2.1 to 3.0 s) is what is left |
| LD3 | desk50, hold, both arms | loadMs | gain >= 0.5 s | the diet must not be slower, and on the hurried path it should save at least half a second |
| LD4 | phone10, hold, arm off | loadMs | 20 to 50 s | 45 MB at 1.25 MB/s is 36 s, four of them hidden by the held scene, plus the phone's CPU |
| LD5 (info) | phone10, hold, arm on | loadMs | 3 to 14 s | 11 MB at 1.25 MB/s is 9 s; the phone's CPU work adds 4 s (r38); about a 45 percent chance of 8.0 s or under (B2a, phone) |
| LD6 | desk50, hold, both arms | mbToMenu | on / off <= 0.6 | the diet's first menu waits for 19.4 of release 67's 47.8 MB of art; with the part already on the page, 11 of 40 MB |
| LD7 | desk50, taps, arm off | loadMs | 1.2 to 4.5 s | a 35 s scene hides every byte; the work floor of the entry load alone (post-fight-start: 1.5 to 3.0 s) |
| LD8 | desk50, taps, both arms | loadMs | on and off differ by at most 1 s | nothing a desktop player sees changes where the line is fast and the scene is read: both arms within one second |
| LD9 | desk50, taps, both arms | authoredMs | on and off differ by at most 0.3 s | the authored parts (card, sweep, first turn) are untouched |
| LD10 | phone10, taps, arm on | loadMs | 1.5 to 7 s | 19.4 MB is 15 s of a 10 Mbit/s line, under a 35 s scene; the phone's CPU is what is left; about an 80 percent chance of meeting B2a (8.0 s) |
| LD11 (info) | phone10, taps, arm off | loadMs | 2 to 14 s | 47.8 MB is 38 s, a little longer than the scene: release 67 can miss B2a here |
| LD12 | desk50, taps, arm off | dupRequests | 40 to 140 requests | round 30b G4 saw 58 files asked for twice with the cache off; with it on each second ask is still a request (a 304 or a cache read) |
| LD13 | desk50, taps, both arms | dupRequests | on / off <= 0.6 | the lookahead is one <img> the decode's <img> reuses (same request mode); if the browser does not share them this MISSES (about a one in three chance), and the fix is to key the lookahead on the decode's own load |
| LD14 (info) | desk50, taps, both arms | s304 | on / off <= 0.7 | fewer conditional requests when the second ask is gone |
| LD15 | desk50, hold, arm on | lastPoseAfterMenuMs | -3 to 10 s | 28 MB of other poses is 4.5 s of a 50 Mbit/s line after the menu, minus what arrived before it |
| LD16 | phone10, hold, arm on | lastPoseAfterMenuMs | 5 to 60 s | 17 to 28 MB at 1.25 MB/s is 14 to 22 s after the menu, with the normal maps and the music behind it |
| LD17 | fast4g, taps, arm off | pressToMenuMs | 52 to 80 s | round 30b measured 76 s card-to-menu with the cache off and a scene read at 350 ms a line; with the cache on, 60 MB after the press is 53 s at 1.125 MB/s |
| LD18 | fast4g, taps, arm on | pressToMenuMs | 38 to 55 s | 16 MB after the press is 14 s; the 35 s scene and the entry are what the menu waits for |
| LD19 | phone16, taps, arm on | pressToMenuMs | 100 to 235 s | 16 MB at 0.2 MB/s is 80 s, the phone's CPU and the music on top; round 30b's Slow 4G never reached the menu in 400 s; about a 60 percent chance this arm reaches it inside the job's 240 s |
| LD20 | every run | errors | none | no console error, no failed request, in either arm |

Which budget each answers: **B2a** (the load wait before the boss card) LD1 to LD5, LD7, LD10, LD11 and LD17 to LD19; **B3a** (bytes to the first menu) LD6, LD12 to LD14 and the offline table of section 4; **B2b** is not touched (a retry's wait is the warm cache; the budgets lane's `--retry` can ride on ld1). A MISS that is not marked (info) stops the lane for a written method check. The two this lane is least sure of: **LD13** (does the browser share the lookahead `<img>` with the decode's? about two chances in three; if not, the lookahead should be keyed on the decode's own load, and the cache-off view of round 30b is the check) and **LD19** (does a phone on Slow 4G reach the menu inside the job's 240 s?).

## 7. Review class and the kill switch

`node tools/critic-plan.mjs --paths <the seven shipped files>` says DEEP (77 checkpoints since the last deep review: the count, not the change); the paper preflight is `docs/plans/load-diet-review.md`. The change is on the **asset loader and the presenter's figure build**, so it gets the focused pass before a deploy and the deep review on the live build (RUBRIC section 4: not the save-data class). The switch for a live problem is the address word `?loaddiet=off`; a deploy that wants it off for everyone is one line (`LoadDiet.loadDiet()` returning false).

## 8. Open questions for the driver

1. **Ship it?** The cuts are the kind the brief asked for (nothing a desktop player sees on a line that brings the poses in 3 s), but a fallback painting for a move on a slow line is a visible difference, and `PaintedActorPoses.loadPoses` is the figure build for every battle. My recommendation: build the candidate, run entries ld1 to ld4 and ld8, and ship on LD13 being a HIT or a fix for it; the by-eye look at the first attacks decides the ceiling (3 s may want to be 5).
2. **The ceiling and the window** (`STREAM_CEILING_MS` 3,000, `LATE_WINDOW` 6): defaults from arithmetic, tuned by ld1 and ld3.
3. **The phone's half-size derivative** (section 5): Bailey's yes, or not.
4. **The recorded SFX set** (4.6 MB at the first input, high priority): defer it to the chapter's start on a slow link (Bailey's ear)?
5. **B3a for a phone** stays at 50 MB (BUDGETS): after the diet it is missed by 8 MB for a quick press; keep 50, or ratify about 60 until the half-size derivative exists?
6. **The board's 46 MB of idle warm** (plates within reach 28, strips 12, faces 6): leave (no time cost; bytes only) or trim on a phone by the same argument as the half-size copy?

## 9. Paste-ready lines

**CHANGELOG (both games; not shipped):** *Load diet (candidate, behind nothing: `?loaddiet=off` restores the old behaviour).* The first command menu no longer waits for every pose of every figure: a figure is built as soon as its opening poses are in (and at most 3 seconds after for the rest), the others load in the order a fight draws them and appear as they arrive; the preload asks for each file once. A fast connection sees no difference; a slow one gets its first menu after about 14 MB of paintings instead of about 36 (a median chapter; Chapter I 19 MB instead of 48).

**Commits:** `8b7f7223d` (part 1: the stream, the order, the lookahead), `85ec6b45b` (part 2: the window, the byte model).

**Files:** `src/engine/LoadDiet.ts`, `src/engine/PoseStream.ts`, `src/app/screens/preloadFetch.ts` (new); `src/engine/PaintedActorPoses.ts`, `PaintedActor.ts`, `PaintedActorState.ts`, `PaintedActorTypes.ts`, `StageFigureRequest.ts`, `src/app/screens/battlePreload.ts`, `docs/DEV.md` (changed); `tests/unit/load-diet*.test.ts` (6 files, 42 tests), `tests/unit/helpers/load-bytes-model.ts`, `tests/unit/r39-preload-masters.test.ts` (both ways).
