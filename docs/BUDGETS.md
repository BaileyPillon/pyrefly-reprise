# BUDGETS: what a player waits for and what the page may hold

Branch `budgets` (tree `D:/pyrefly-continuity`), from `origin/main` `e50a2b22d` (live release 66, `2b48cee95`, plus records). 2026-10-28, the driver's lane "budgets".
**Game case: both games.** A load, a byte count, a frame spike and a memory peak are properties of the page, not of a game, so every budget below holds for FFX and FFX-2 alike (AGENTS.md rule 14, shared plumbing: CHK-020). Where a number names a chapter, Chapters I to III are FFX and IV and V are FFX-2 (the later ones by their id prefix `ffx2-`). The two game-specific facts that touch a wait are authored, not budgeted: the voiced intro of the demo's Chapter I (FFX only, 10.1 s) and the first ATB gauge before FFX-2's first menu (FFX-2 only, 1.0 s, decision 180b).
Authority: Bailey, 2026-10-28 ~13:00 EDT, "please work on the pose continuity fix and and crtiques for chatgpt i mentioned awhile ago as well as motion fluidity and animation. work on all those. i'll go with all your recommendations and decision-making for the next couple days." The point is ChatGPT's number 5 (2026-10-17), adopted as D-922: "Measure cold load, time to first command, bytes per chapter, frame-time spikes and memory after chapter changes, and add them to the critic's numbers."
**Nothing deploys from this branch and no file of `src/` is touched.** This is the written budgets, the record of what is measured against them today, and the browser jobs (outside git) that measure the rest. **The jobs have not been run: the browser was not this lane's.** Every number marked *proposed* is this document's and waits for the driver; every number marked *existing* was already written down in the repo.

## The short answer

- **17 budget rows, 6 of them existing** (the 5 s load of RUBRIC section 2, the 5 s loading card of r29, the three frame numbers of the round-30 Trema check, the class texture budgets of `ArtBudget.ts`) **and 11 proposed.** Section 1 is the table.
- **What is measured today is old, partial or about something else.** The last browser timing of the live title is r51 (2026-10-17: 1.1 s median, 2.2 MB, on a fast line); the bundle has grown to 5.04 MB raw since. No throttled-line number exists for the first command since the hi-res tiers (r39). Bytes per chapter on the ordinary path were last measured in r38 (45.5 and 42.6 MB). Frame spikes are measured well for Chapters I and IV only. **Memory after chapter changes has never been measured, and the decode cache that matters on a phone has no accessor.** Section 3 and 4.
- **The jobs are written and tested without a browser** (`node --check`, 39 checks on the pure parts and on `judge.mjs`, `--dry` on each): 4 jobs, 16 queue entries, about 54 minutes of browser, on two named profiles (a 50 Mbit/s desktop and a 10 Mbit/s phone) plus two controls. 22 predictions are written below, before any measurement. Section 5.
- **KTX2 is not justified by anything measured today, and the reason is structural, not a matter of numbers:** the look, the matte, the silhouette and the breathing rig read decoded pixels, which a compressed texture cannot give them. Three measurable triggers would change that (section 6); the earliest moment to look is after the jobs have run.
- **Owed, not done (code, outside this lane):** an accessor for the painting cache in `__pyrefly.art.stats()`, and a decode-cache cap that follows the device class (section 7).
- **Update 2026-10-29 (lane `budgets-2`, `docs/handoff/budgets-2.md`):** the jobs ran (section 8): seven rows FAIL on live release 67 (B2a x2, B3a x2, B5a x2, B5d). The accessor is built (`art.stats().memory`, `.hold`, `.gl`), the painting cache is let go of per fight (`?memrelease=off`), and the phone's loads are ordered foreground first (`?phonediet=off`); neither is measured yet.

## 1. The budgets

`desk50` = desktop 1600x900, 50 Mbit/s, 20 ms round trip. `phone10` = phone 390x844 at pixel ratio 2, touch, CPU x4, 10 Mbit/s, 40 ms round trip. Section 2 says why these, and what they do not stand for. "Held to" is the statistic of the runs (or of the chapters) the limit binds: a budget that is about every chapter is held to the worst one.

| ID | What the player sees or the page holds | desk50 | phone10 | Held to | Basis |
|---|---|---|---|---|---|
| B1a | Cold load to an interactive title (nothing cached; one Enter moves the title on) | 5.0 s | 5.0 s | median of 5 runs | **existing**: `critic/RUBRIC.md` section 2 and CHK-017, "a load under five seconds" |
| B1b | Wire bytes to the interactive title | 4.0 MB | 4.0 MB | median | proposed: 3.2 s of a 10 Mbit/s line; the leading indicator for B1a on a phone |
| B1c | Enter on the title to the chapter board up | 1.5 s | 2.0 s | median | proposed: `FRONTEND_WARM_CEILING_MS` is 1000 ms in `frontendWarm.ts` (the title holds that long at most for the board's first card), plus the wipe |
| B2a | Load wait before the boss card (the fight-start split's entry-load + first-draw, the time the loading card covers) | 5.0 s | 8.0 s | worst chapter | desk50 **existing** (`docs/handoff/r29-load.md`: "under the 5 s goal in every run"); phone10 proposed |
| B2b | The same wait on a retry of the same chapter in the same session | 2.0 s | 2.0 s | worst chapter | proposed (D-1027: friction between one attempt and the next) |
| B3a | Wire bytes from navigation to the first command menu, one chapter, by the ordinary path | 100 MB | 50 MB | worst chapter | proposed: 16 s of a 50 Mbit/s line, 40 s of a 10 Mbit/s line (the longest pre-battle scene, Chapter I, is 35 s at a line every 650 ms) |
| B4a | Frame rate after the opening, 60 Hz display | 59.5 fps | (none) | worst chapter | **existing**: the round-30 acceptance check for PR-0544 (Trema), and RUBRIC section 2 |
| B4b | Frame interval p99 | 25 ms | (none) | worst chapter | **existing**: the same check |
| B4c | Frames over 34 ms | 0.5 % | (none) | worst chapter | **existing**: the same check |
| B4d | Frames over 50 ms a minute after the opening | 3 | (none) | worst chapter | proposed: holds the gain of release 66 (Chapter I 2.1 a minute, Chapter IV 0.8); the target is 1 |
| B4e | Frames over 100 ms a minute after the opening | 1 | (none) | worst chapter | proposed: holds the gain (Chapter I 0.6, Chapter IV 0); the target is 0.2 |
| B5a | Private memory (renderer + GPU processes) after three or more chapter changes, the same chapter against its first visit | +10 % | +10 % | worst | proposed: no measurement exists |
| B5b | JS heap after a forced collection, same comparison | +30 MB | +30 MB | worst | proposed |
| B5c | Peak private memory of the whole browser tree, one chapter, high class | 3,500 MB | (none) | max | proposed: 3,011 MB measured once (MF-28, Chapter I) plus 16 % |
| B5d | Peak page memory (renderer + GPU), phone tier | (none) | 1,000 MB | max | proposed, **UNVERIFIED on a real phone**: 220 MB textures + about 290 MB decoded paintings + about 450 MB engine and browser base |
| B6a | Texture memory the art governor holds, by device class | 2,600 MB (high) | 220 MB (phone) | max | **existing**: `src/engine/ArtBudget.ts` (high 2,600, mid 900, low 500, phone 220) |
| B6b | Decoded-painting cache (RGBA, no mips), phone tier | (none) | 300 MB | max | proposed: today the code caps 96 paintings and 900 MB for every class (`PaintedArtCache.ts`) |

**Time to the first command is two things.** The *authored* part is not budgeted: it changes only by Bailey's call (`docs/handoff/post-fight-start.md` section 6 lists every cut with its seconds): the boss card (1.27 s since the fix round), the opening sweep (6.6 s FFX, 6.1 s FFX-2), the pre-battle scene (35.2 s in Chapter I, 15.9 s in Chapter IV at a line every 650 ms; skippable), the voiced intro (demo Chapter I only). The *load wait* is the part a budget can govern, and it is B2a. A retry is B2b.

**Phone limits that are not here.** B4 has no phone limit and B5d is marked UNVERIFIED because a CPU throttle on a desktop GPU is not a phone (RUBRIC section 2: missing hardware evidence is UNVERIFIED, not a pass). A real phone (or the booth's) is the open question in section 9.

## 2. The conditions

| Profile | Shape | Why this one |
|---|---|---|
| `desk50` | 1600x900, DPR 1, no touch, CPU x1, 50 Mbit/s down, 10 up, 20 ms | 1600x900 is the RUBRIC's baseline and the focused reviews' size; 50 Mbit/s and 20 ms is the line `tools/art-load-timing.mjs` used in r38 for "what the saved bytes are worth to a player", so the numbers compare with that table |
| `phone10` | 390x844, DPR 2, touch, CPU x4, 10 Mbit/s down, 2 up, 40 ms | 390x844 at DPR 2 and a 4x CPU throttle are the phone of r29 and r38; 10 Mbit/s is the line this lane was asked for; 40 ms is a round number (r29 used 20 ms at 25 Mbit/s), not a sourced one |
| `phone4x` (control) | the phone with NO line limit | r38's "phone-4x": against `phone10` it says whether a wait is the CPU's or the line's (section 6) |
| `slow16` (control) | desktop, 1.6 Mbit/s, 150 ms | `critic/runner/lib/coldload.mjs`'s default; the r50 and r51 live reviews measured 11.9 s on it |

All of it is headless Chromium on this PC's real GPU (`PYREFLY_BROWSER=gpu`, an RTX 5070 Ti), Windows, one fresh browser per run, the live site at its plain address. What that is **not**: a phone's GPU or memory, Safari, Firefox, a real controller, a mid or low desktop class. The game picks its art tier from the page (`ArtDevice.ts`): the phone layout (an upright window under 600 px) is the phone class; a link the browser reports under 10 Mbit/s is "slow" and starts every painting at the approved file (`slowLink()`): at exactly 10 Mbit/s that reading may say "fast", so every job records `navigator.connection` and the tier it got. A run on a busy host (over 25 % CPU, the same line `tools/pace.mjs` draws) turns a miss into UNQUIET.

## 3. What is measured today, against each budget

**B1, the cold title.** Live browser timings, cold cache, found in `critic/reviews/*-live.md`:

| Date | Build | What | Result |
|---|---|---|---|
| 2026-10-07 | `55db51dd` (`55db51dd-live.md`) | cold loads to the first frame, quiet machine | 0.58 to 0.87 s; the first of a run 3.63 s |
| 2026-10-07 | `b80f772f` | the same | 3.57, 0.65, 0.58 s |
| 2026-10-08 | `a021787a`, `04cdcd45` | the same, busy machine | 2.68 to 6.92 s and 2.81 to 5.51 s |
| 2026-10-16 | `8a3e8eff7` (r50) | `coldload.mjs`, to an interactive title | median 0.9 s (0.8 to 3.7 s of 3), 2.2 MB and 12 requests; **11.9 s at 1.6 Mbit/s and 150 ms** |
| 2026-10-17 | `6b638df95` (r51) | the same | median 1.1 s (1.0 to 4.5 s), 11.9 s throttled |
| 2026-10-28 | live `2b48cee95` (r66) | a transfer probe with curl, **not a browser** (round 30, PR-0520) | bundle `index-BwPs1UaV.js` 1,445,213 bytes brotli, 5,043,734 raw; warm edge 1.5 to 2.7 s; one edge MISS 5.35 s, first byte 3.47 s |

Read against B1a: on a fast line the 5 s holds with room (0.6 to 1.1 s medians); the first load of a session was slow about half the time on a busy machine (3.6 to 6.9 s); at 1.6 Mbit/s the wait is the bytes over the line (2.2 MB, 11.9 s). **No browser has timed the title since r51; the bundle has grown from about 3.95 MB raw (the size the 2026-10-08 review quotes) to 5.04 MB;** no one has timed it at 50 or 10 Mbit/s. Round 30 says so (PR-0520, CHK-017's load clause UNVERIFIED while identity is proved).
*Bytes to the title (B1b), an estimate:* the bundle 1.445 MB brotli, the title painting 0.81 MB (`art/title/echo.2x.webp` in the 2026-10-26 timeline runs), the style sheet (0.50 MB raw, less on the wire), the art manifest (0.13 MB raw), fonts about 0.08 MB and two small chunks: about 2.6 MB on the wire (2.5 to 3.0, depending on how well the style sheet and the manifest compress), which agrees with the r50 and r51 readings (2.2 MB, a smaller bundle then). The title needs the whole game bundle: it is one chunk of 5.04 MB raw (the other chunks, `PaintedActor` 0.13 MB and `DemoGate` 0.43 MB raw, are requested with the page in the timeline runs, and two workers, 1.57 and 0.24 MB raw, were not requested before the title); what share of the bundle runs before the title is not measured (the front-end split question; job q1c).
*Enter to the board (B1c):* the ceiling is in code; the only timings are r29's (2026-09-28, 25 Mbit/s: the board then started about 40 requests of 100 MB at once, fixed by lanes and strips). No number now.

**B2, the load wait.** (a) `docs/handoff/post-fight-start.md` (2026-10-26, release 64 code, a local server, 2560x1440, headless GPU, the demo route and the select route): entry-load + first-draw, median, cold fast press: Chapter I (FFX) 3.0 s, Chapter IV (FFX-2) 4.0 s (bimodal, 2.1 to 5.2 s, a no-script frame of 0.8 s decides it); human pace 0.9 s and 2.1 s; a finished warm 0.7 to 0.8 s; select route 2.5 s and 2.7 s cold, 1.9 s and 2.5 s warm. The final numbers of the fix round are 3.02 to 3.07 s (Chapter I) and 2.67 to 4.03 s (Chapter IV). (b) r29 (2026-09-28, 25 Mbit/s and 20 ms, 4x CPU on the phone, art before the WebP and hi-res changes): the loading card up 1.3 s (Chapter I), 1.7 s (Chapter IV), 0.4 s (XVI) cold on the desktop, 0.9 to 1.0 s on the phone profile; the 5 s goal met in every run. (c) r38 (2026-10-03, before r39's hi-res tiers): from `gotoChapter` to the first menu, with the 8 to 9 s of the opening inside it: desktop local 11.3 and 12.1 s, **phone 390x844 at CPU x4 local 16.8 and 15.9 s (4.4 s more than the desktop)**, 50 Mbit/s 12.6 and 14.1 s. (d) The live reviews of r53 to r55 (2026-10-18 and 10-19) loaded FFX-2 Chapter IV cold on the live site, on no named line: the start card up 3.9, 6.2 and 4.5 s on the desktop (`9c91a8c3a`, hurried), 1.0 s on the desktop and 3.2 s in a phone window (`b24614c05`), 7.3 s in a phone window (`4f4dc77bc`). That is not B2a's measure (the card then also held its own 1.9 s: `?cardhold=full` is that behaviour) but it is the only live reading of a cold battle load; the phone windows read 3.2 s and 7.3 s, the second close to B2a's 8 s.
Read against B2a: desk50 is met by every local reading; **phone10 is the open one**: r38 says the phone's CPU alone costs about 4.4 s more, on a local server; the line then adds. Nothing has timed a retry (B2b); the nearest is the finished-warm 0.7 to 0.8 s.

**B3, bytes.** r29 (pre-WebP): 79 MB (Chapter I) and 57 MB (Chapter IV) of art requested before the battle entry. r38 (WebP, desktop, the battle's own load): 45.5 and 42.6 MB of images (phone 45.5 and 33.0 MB). Since r39 the 2x, 3x and 4x masters exist: the build now ships **11.06 GB in 7,170 files** (`critic/artifacts/2b48cee95.json`): 1x 1.02 GB, 2x 2.15 GB, 3x 3.14 GB, 4x 4.67 GB, audio 0.08 GB; a player fetches a few hundred megabytes at most. The only per-run figure since is an *estimate* made for this document: the request lists of the 2026-10-26 timeline runs (demo route, 2560x1440, high class) summed against the manifest: **284 to 336 MB requested by the first menu, 117 to 166 MB of them after the press** (the demo's warm also builds the other fight and the board's strips, so this is an upper bound for one chapter, not B3a's number). Per-chapter bytes on the ordinary path at 1600x900 have not been measured since r38, for any of the 19 chapters.

**B4, frames.** `docs/handoff/mf-l4-freezes.md` (release 66's lanes; the release route of real keys, seed 1, `?pack=demo`, 2560x1440 capped at 60 Hz, headless GPU): after the opening, Chapter I over a 403 s fight: 21 frames over 33 ms, 14 over 50, 4 over 100 (**about 2.1 and 0.6 a minute**), 235 ms a minute of animation time lost (release 64: 57 to 64, 39 to 42, 19 to 21); Chapter IV over a fight of about 6 minutes: 11, 5, 0 (**about 0.8 and 0 a minute**), 196 ms. The lane's own target (30 or fewer over 33 ms, under 300 ms a minute) is met in both; its stretch (15) is met in Chapter IV (11) and not in Chapter I (21). Round 30 (`critic/rounds/round-30.md`, live r66, 1600x900, a Ryzen 7 7800X3D and the RTX 5070 Ti): every chapter but one at 59.8 to 60 fps with p99 18.6 to 35.3 ms; **Trema (Chapter VII, FFX-2) 57.4 fps, p99 71.2 ms, 2.3 % of frames over 34 ms, worst frame 366.7 ms** (PR-0544; its cause is untraced; the acceptance check B4a to B4c quotes). The RUBRIC asks that spikes be reported and sets no number for them: B4d and B4e are new.

**B5, memory.** One reading: the whole browser tree's private memory, sampled every 1.5 s through the load and 25 s of a Chapter I fight (high class, 2560x1440): **peak 3,011 MB with the alpha worker, 2,927 MB without**, a run-to-run spread of about 150 MB (`mf-l4-freezes.md`, F-6). The whole GPU (nvidia-smi, shared with other programs: a ceiling) read 6.1 GB in Chapter I before the wider warm pool and 6.5 to 6.8 GB after it (F-2), and 5.6 GB in Chapter IV; allocation churn 13.8 MB a second (Chapter I) and 15.7 (Chapter IV), garbage, not retained. **Nothing measures memory after a chapter change.** `PaintedArtCache.ts` states the intent ("the chapter being played plus roughly the last two ... without the session's memory growing with every chapter visited"); nothing has checked it. A rigged Kimahri is about 23 MB of GPU memory (D-922's text); the party-rig pilots of the `motion-rigs` branch (Tidus, Rikku Dark Knight) are off in the public build (`?partyrigs=on` is the only way in, `docs/LIVE.md`).

**B6, the decode and texture budgets.** In code: the art governor's per-class texture budgets (B6a), a warm pool of 640 MB (1,092 MB on the high class), and a decoded-painting cache of 96 paintings and 900 MB for every class. The mean 1x pose is 3.0 MB decoded (1.2 to 5.4 MB; 40 of the 754 approved 1x poses read from their PNG headers for this document), so on the phone tier, which loads 1x files only, the 96-painting count binds first at about **290 MB**; a chapter's 40 poses with mips are about 160 MB of texture against the phone's 220 MB. Both are arithmetic, not readings. The decode cost on a phone: WebP decodes 1.48 times slower than PNG per megapixel (16.4 against 11.1 ms), the cost r38 names for its 0.7 to 0.8 s of extra phone wait.

## 4. What is not measured

1. The cold title at 50 and 10 Mbit/s, on the current bundle, in a browser (q1). 2. How much of the bundle runs before the title (q1c). 3. The load wait on a throttled line since r39, either game, either profile (q2 to q5). 4. A retry's wait (q2, q3). 5. Bytes to the first menu on the ordinary path, for any of the 19 chapters (q6a, q6b, q6c). 6. Frame spikes after the opening by chapter beyond I and IV, and any frame number on a phone (q7a to q7c; the phone's stays UNVERIFIED). 7. Memory after chapter changes, on either profile (q8a, q8b). 8. The decode cache (no accessor; q8b estimates it). 9. Whether the phone's wait is the CPU's or the line's (q3 against q4, q4p). 10. The mid and low desktop classes (900 and 500 MB of texture), Firefox, Safari, a real phone, a real controller. 11. The real-key exit from a battle (the pause menu's quit) as a memory scenario.

## 5. The jobs and the predictions

The scripts are in `D:/Tools/pyrefly-scratch/2026-10-28/budgets/jobs/` (**outside git**; `README.md` there, `queue.json` the order, `budgets.json` the numbers of section 1 and the bands below, `selftest.mjs` fails if an id here is missing from `budgets.json`). They measure the **live site** (no server, no port), take the review-browser lock (7-minute holds), and use the repo's `tools/fight-start-instrument.mjs` and `fight-start-split.mjs`, so a number is comparable with `post-fight-start.md`. The README there lists nine things that may break on the first real run; the main one is that the pad route is verified on the desktop board only, so the phone's pad runs may have to fall back to the API route (q6c).

| Job | Script | What it records | Queue |
|---|---|---|---|
| J1 | `cold-title.mjs` | one fresh browser per run, cache off over CDP, one navigation, the clock before `goto`: the time to an interactive title (Enter must move it on), wire bytes and requests by kind, paint and long tasks, Enter to the board, the next 10 s of the line; `--coverage` the share of each script that had run | q1 (5 runs on `desk50` and `phone10`, 1 on `slow16`), q1c |
| J2 | `first-command.mjs` | the fight-start split to the first command menu per chapter, the loading card's time, wire bytes from navigation and from the press, the tier and link the page saw; `--mode=pad` the player's path (select route, scene taps or held), `--mode=api` r38's route for all 19; `--retry`; `--cpuprofile` | q2 to q6c |
| J3 | `frame-spikes.mjs` | every frame from the first, the 150 s window starting 10 s after the opening sweep ends: fps, p50/p95/p99, frames over 34, 50 and 100 ms a minute, the worst five, the display's rate; the game's own `intended` strategy plays (not the release route: first-sight spikes of summons and items are under-counted) | q7a to q7c |
| J4 | `chapter-memory.mjs` | one page through Chapter I, IV, I, IV, I with the chapter board between: after each, a forced GC, JS heap, DOM counters, private memory of every browser process by type (PowerShell), the art governor's resident MB; peak of the tree and of the page; the decode cache as an estimate | q8a, q8b |
| | `judge.mjs` | every row of section 1 and every prediction below: PASS, FAIL, UNQUIET, NOT-MEASURED, HIT, MISS; exit 2 on a miss | q9 |

**Predictions** (rule 15, written before any measurement; a value outside its band is a MISS, and a miss stops the lane for a written method check):

| ID | Job and profile | Metric (statistic) | Band | Why |
|---|---|---|---|---|
| P1a | J1 `desk50` | title interactive (median) | 0.8 to 2.5 s | 0.6 to 1.1 s unthrottled live, plus 0.4 s for 2.6 MB at 6.25 MB/s and about 5 round trips |
| P1b | J1 `desk50` | title interactive (max of 5) | at most 5.0 s | an edge MISS made one fetch 5.35 s (PR-0520); live reviews saw a slow first run about half the time |
| P1c | J1 `desk50` | wire bytes to title (median) | 2.0 to 3.5 MB | the estimate in section 3; r50 and r51 read 2.2 MB |
| P1d | J1 `phone10` | title interactive (median) | 3.0 to 7.0 s | 2.1 s of transfer, 6 round trips, 5 MB of script at CPU x4; central 4.5 s; **one chance in three of being over 5 s** |
| P1e | J1 `phone10` | wire bytes to title (median) | 2.0 to 3.5 MB | the same files |
| P1f | J1 `slow16` | title interactive (median) | 11 to 18 s | 11.9 s for 2.2 MB before; 2.6 MB is 13 s of transfer |
| P1g, P1h | J1 `desk50`, `phone10` | Enter to the board (median) | 0.3 to 1.6 s; 0.3 to 2.2 s | the code's 1000 ms ceiling plus the wipe |
| P2a | J2 `desk50` | load wait (median of chapters) | 1.5 to 5.0 s | `post-fight-start.md`: 2.1 to 4.2 s locally; prep and scene hide most of the transfer |
| P2b | J2 `phone10` | load wait (median) | 5 to 11 s | r38: the phone's CPU costs 4.4 s more than the desktop; central 7.5 s; **one chance in three of missing the 8 s budget** |
| P2c | J2 `desk50` | retry load wait (median) | 0.2 to 1.8 s | warm HTTP and painting caches; a finished warm read 0.7 to 0.8 s |
| P3a, P3b | J2 `desk50`, `phone10` | wire bytes to the first menu (median) | 45 to 110 MB; 35 to 90 MB | r38's 45.5 and 42.6 MB plus board, portraits, rigs and 9 MB of music; the phone tier loads 1x files only |
| P4a | J3 `desk50` | fps (median of chapters) | 58.5 to 60.5 | 58 to 60 in the route harness |
| P4b | J3 `desk50` | frames over 50 ms a minute (median) | 0.3 to 3.0 | Chapter I 2.1, Chapter IV 0.8 on a shared PC |
| P4c | J3 `desk50` | frames over 100 ms a minute (median) | 0 to 1.0 | Chapter I 0.6, Chapter IV 0 |
| P5a | J4 `desk50` | tree peak (max) | 2,200 to 3,600 MB | 3,011 MB for one chapter; this job holds three |
| P5b | J4 `desk50` | page memory growth, first chapter again after 4 changes | -10 to +10 % | the painting cache keeps 96 paintings or 900 MB: a chapter seen again finds its paintings warm; a leak shows as growth beyond this |
| P5c | J4 `desk50` | JS heap growth after GC | -30 to +30 MB | no leak is known |
| P5d | J4 `phone10` | page memory peak (max) | 500 to 1,600 MB | B5d's arithmetic; headless on a desktop GPU is not a phone: the verdict stays UNVERIFIED |
| P6a | J4 `phone10` | resident textures (max) | 40 to 220 MB | about 40 poses of 3.0 MB with mips is 160 MB |
| P6b | J4 `phone10` | decode cache, estimated (max) | 100 to 330 MB | 96 x 3.0 MB is 290 MB; an estimate (resident x 0.75), no accessor |

## 6. KTX2 (ChatGPT's point 4): what these numbers would justify, and when

ChatGPT's point 4 is GPU-compressed textures (KTX2 with Basis, a WASM transcoder). Bailey adopted it on 2026-10-17 as D-928: "KTX2 and Basis tried as a separate delivery mode with the approved originals preserved", after the measurements of D-922, because it conflicts with the pixel-identical art guarantee. So the trial itself is adopted; what is open is whether the numbers call for it. Section 3 and the jobs of section 5 answer that as follows.

**What the numbers say today.** No measured profile shows a GPU-memory pressure or a decode-bound wait: the phone tier's chapter (about 160 MB with mips) fits its 220 MB; the high class holds 2,600 MB of which the warm pool takes 1,092; the whole-GPU 6.1 GB on a 16 GB card is not binding (a smaller discrete GPU is untested, F-2). The freezes that were measured in Chapter I (`mf-l4-freezes.md`) are first draws of a painting into a **2D canvas** (`getImageData` of a 4x master, 60 to 374 ms): CPU work that a compressed texture does not remove.

**Why it is structural.** The look's extents (`AlphaPrime`), the breathing rig (`breathRig`), the strike silhouette (`Silhouette`), the matte (`PaintedMatte`) and the portraits read the **decoded pixels** of a painting; a KTX2 texture lives on the GPU and cannot be read back on the CPU. So a figure's painting cannot be replaced by a KTX2; at best a KTX2 copy is added for the GPU while the decoded copy stays for the readers (more memory, not less), unless the readers' fields are made offline as sidecars (an engine change on the scale of MF-02's worker). The size is not the lever either: ASTC and BC7 are lossy (a block is 128 bits whatever the format: 8 bits a pixel at 4x4, 3.56 at 6x6, against 32 for RGBA8), so what a player on that mode sees is a lossy copy of the approved painting, while r38's whole premise was a pixel-identical derivative (D-351). D-928 allows it as a separate mode with the originals kept; the difference is still shown as a picture before it ships (AGENTS.md rule 9).

**What would change the answer (decide after the jobs, not before):**

| Trigger | The reading that fires it | Where it comes from |
|---|---|---|
| K1: the phone waits on its CPU | `phone10` misses B2a (8 s) **and** `phone4x` (no line limit) is within 25 % of `phone10`'s load wait **and** the folded CPU profile of the load shows the main thread busy for more than 85 % of it | q3, q4, q4p (the live site has no source maps, so the profile gives busy, idle, `(program)` and GC time and minified names: enough for the share, not for the line) |
| K2: the phone's textures are full | resident textures at 200 MB or more (90 % of 220) at a first menu, or the governor evicting in a fight, or page memory over B5d's 1,000 MB | q8b |
| K3: the rigs reach phones | four rigged party members at about 23 MB each is 92 MB; with a chapter's 160 MB that is about 250 MB against 220 | measured in J4 with `?partyrigs=on` once the rig pilots (Tidus, Rikku Dark Knight) have been seen in motion and picked; the party-rig pilots are off in the public build, and no rig replaces a painting before Bailey has seen it move (D-1086, D-1097) |

**When.** Not tonight and not on today's evidence. The first moment to look is after queue entries q3, q4, q4p and q8b have run (K1 and K2); K3 waits for the rig decision. If one fires, the next step is a **pilot**, not a build: convert one chapter's 40 paintings, measure the bytes, the upload time and the pixel difference on the phone profile, and show the difference as a picture. WebGPU stays later, after the measurements (D-928).

## 7. Owed code (not made here: this lane changes no game file)

1. **`__pyrefly.art.stats()` should carry the painting cache** (`{ paintings: paintingCacheSize(), mb: paintingCacheMB() }`, both already exported from `src/engine/PaintedArtCache.ts`): one line in `src/debug/artApi.ts`. Until then B6b is an estimate.
2. **`PAINTING_CACHE_MB` follows the device class** (900 MB for every class today; the phone's proposed 300 MB is B6b). A behaviour change on shared plumbing: it needs J4's phone numbers first and a focused review.
3. **A critic home for the numbers.** `critic/policy.json` has a `fluidity` block in `report` mode; a `budgets` block of the same kind would let `critic-plan` and the live reviews read B1 to B6, with `mode: "report"` until the driver and Bailey say a number is a gate (RUBRIC needs a line and Bailey's yes, as for the fluidity gates). Not written: it would change the critic's stamp.

## 8. Results

*Run twice, on the live release 67 and on release 68's candidate; the budgets-2 build has not been measured (section 8.3).*

### 8.1 The measuring lane on live release 67 (2026-10-29 ~04:00 to 05:50 EDT, `.../2026-10-28/r68/measure-ui-budgets/RESULTS.md`, the judge's own verdicts)

| budget | desk50 | phone10 |
|---|---|---|
| B1a cold load to an answering title (5 s / 5 s) | 979 ms PASS | 3,441 ms PASS |
| B1b wire bytes to the title (4 MB) | 3.17 MB PASS | 2.67 MB PASS |
| B1c Enter to the board, a returning player (1.5 s / 2 s) | 1,386 ms PASS | 1,833 ms PASS |
| B2a load wait before the boss card (5 s / 8 s) | **10,577 ms FAIL** (a range: 7.0 and 10.6 s on two runs; 17 of 19 chapters over 5 s on the API route) | **49,005 ms FAIL** |
| B2b retry load (2 s) | 1,544 ms PASS | 1,538 ms PASS |
| B3a bytes to the first menu (100 MB / 50 MB) | **111.2 MB FAIL** | **88.3 MB FAIL** |
| B4a to B4e frames after the opening | 59.66 fps, p99 16.8 ms, 0.08 percent, 1.6 and 0.4 a minute PASS | report only (58.6 fps, p99 33.3 ms) |
| B5a memory growth over four changes (10 percent) | **+86.2 percent FAIL** | **+81.5 percent FAIL** |
| B5b JS heap growth (30 MB) | 7.6 MB PASS | 7.7 MB PASS |
| B5c tree peak (3,500 MB) | 3,383 MB PASS | |
| B5d phone-tier page peak (1,000 MB) | | **2,352 MB FAIL** (a desktop GPU's accounting of a phone-sized page: UNVERIFIED for a real phone) |
| B6a / B6b governor resident, decode cache | 18.3 MB PASS | 35 MB and 26 MB (an estimate) PASS |

### 8.2 Release 68's focused review on the candidate `2a9340249` (`critic/reviews/2a9340249-focused/budgets/`, finding R68-B1)

| | Chapter I (FFX) | Chapter IV (FFX-2) |
|---|---|---|
| phone10 load wait, candidate / live r67 | 19.8 s / 20.1 s | 42.4 s / 39.2 s |
| desk50 load wait, candidate / live r67 | 5.9 s / 6.0 s | 4.4 s / 4.5 s |
| phone10 wire MB to the menu, candidate | 93.6 | 94.0 |
| desk50 A B A B A (renderer, battle 1 to 5) | +74.2 percent (live r67 +85.5); tree peak 3,225 MB (3,370); JS heap +6.8 MB (+7.7); DOM at the boards 1,238 to 1,910 and flat from the third (live r67: 1,584 more nodes and rising) | |

The FFX-2 HUD leak is fixed; the load diet moved the phone's wait by nothing; the memory climbs about the same (+74 against +85 percent).

### 8.3 Lane `budgets-2` (this branch; not measured)

`docs/handoff/budgets-2.md`: the phone's foreground-first order and the leave-a-fight release, their 49 predictions (B2a-02: Chapter I phone 4.5 to 12 s, central 8; B2a-05: Chapter IV 8 to 22 s, a subtraction and not a measurement; B3a unchanged in bytes; B5a-02: renderer growth -5 to +25 percent, about one in five after the second review, and a miss with the books hit sends the next step to the in-fight peak), and the job set (`D:/Tools/pyrefly-scratch/2026-10-29/budgets-2/jobs/`, about 59 minutes of browser; the memory entry b2-5 first, its books read before its counters). The cut also moves the missing-art window into the fight: the line stays busy about 12 s (Chapter I) and 29 s (Chapter IV) after the first menu at the central predictions (rows B2a-12, B2a-13), a look call for Bailey. After the queue: `node judge-b2.mjs`, and this table gets a third block with the label of the run and the build.

## 9. Open questions for the driver

1. **Ratify or change the 11 proposed budgets** (the rows of section 1 not marked existing), in particular B2a for the phone (8 s), B3a (100 and 50 MB) and B5d (1,000 MB, UNVERIFIED).
2. **Is `phone10` the phone?** (10 Mbit/s, 40 ms, CPU x4, DPR 2.) And is there a real phone to run the same four jobs on once (the booth's, or Bailey's)? Without one, B4 and B5d stay UNVERIFIED for the phone.
3. **J4's exit from a battle is the API's `chapterSelect()`.** Should the memory scenario use the player's exit (the pause menu's quit) instead, and which entry is it?
4. **J3 plays the plain fight.** The release route (summons, items, Cheer, Talk) runs from a built folder, not the live site; should the frame budget be judged on it before a deploy (a candidate's `dist-gate`), with the live autoplay as the after-the-fact check?
5. **The accessor and the cap** in section 7 (items 1 and 2): which lane, and may the debug line go with the next release?
6. **Where the numbers live:** `critic/policy.json` (section 7, item 3), and an AGENTS.md Map row for this file.

## 10. Sources

`critic/RUBRIC.md` section 2 and CHK-017; `critic/rounds/round-30.md` (PR-0520, PR-0544); `critic/reviews/{55db51dd,b80f772f,a021787a,04cdcd45,8a3e8eff7,6b638df95}-live.md` (cold loads); `critic/artifacts/2b48cee95.json` (shipped sizes); `docs/handoff/post-fight-start.md`, `r29-load.md`, `r38-bytes.md`, `mf-l4-freezes.md`, `mf-l4-freezes-pass2.md`, `perf-trim.md`, `mf-l5-tools.md`; `src/engine/ArtBudget.ts`, `ArtDevice.ts`, `ArtMemory.ts`, `PaintedArtCache.ts`, `src/app/screens/frontendWarm.ts`; `tools/art-load-timing.mjs`, `fight-start-timeline.mjs`, `fight-start-split.mjs`, `fight-start-instrument.mjs`, `rig-record-lock.mjs`, `critic/runner/lib/coldload.mjs`; `DECISIONS.md` D-922, D-928, D-1027, D-351, D-1086, D-1097. The bytes of the 2026-10-26 request lists are from `D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-fight-start/runs/m/*.json` summed against the manifest above (an estimate made for this document); the 3.0 MB mean 1x pose is from 40 randomly drawn PNG headers of `public/art/characters` (seed 3).
