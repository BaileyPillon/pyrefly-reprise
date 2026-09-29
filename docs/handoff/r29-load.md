# r29-load: cold load and art order (PR-0221, PR-0240, PR-0222, PR-0223, PR-0224)

Branch `r29-load` (worktree `D:/pyrefly-r29-load`), from main `c9c1c295`. A defect batch from critic
round 15 (`critic/rounds/round-15.json`). Paper preflight: `docs/plans/r29-load-review.md` (the change
classes **deep**: `imageWarm.ts` is a shared path). No new screen, setting, gameplay or art.

**Game case.** The loading plumbing (image lanes, the board's rail strips and hero plate, the chapter
preload, the pre-battle scene's first frame, the pause plate warm) is **both** FFX and FFX-2: one
front end, one preload, one cutscene screen, one pause (CHK-020, shared plumbing). PR-0222 and PR-0223
are **FF7 only** (the hidden experiment's swirl and pause plate). PR-0224 is **FFX-2 only** in effect:
the fallen-pose path only differs for an FFX-2 dressphere (FOC17-01); FFX folders all ship hurt/ko.

## How it was measured

Harness (scratch, not shipped): `D:/Tools/pyrefly-scratch/r29/load/`
- `pages-server.mjs`: a GitHub-Pages-like static server for a production build (`npx vite build
  --outDir .dist-r29-load-*-tmp`): HTTP/2 over TLS, base `/pyrefly-reprise/`, `Cache-Control:
  max-age=600` plus ETag, as Pages sends. Before = main `c9c1c295` on port 7940, after = this branch on 7941.
- `measure.mjs`: headless Chromium from node, `PYREFLY_BROWSER=gpu` (this PC's GPU, ANGLE D3D11), one
  browser at a time, a fresh persistent profile per run (a real disk cache). **Named network: 25 Mbit/s
  down, 20 ms RTT** (CDP emulation; round 15 measured the live host at about 24 Mbit/s by curl).
  Desktop 1600x900 DPR 1; phone 390x844 DPR 2, touch, **4x CPU throttle**. Real keys: title, Enter to
  the board, arrows to the card, Enter, prep Enter at once, the scene advanced by Enter every 350 ms,
  Esc 1.5 s after the battle card leaves, Tab. Cold = empty profile; warm = the same profile, reload.
  It records the `[entry]` loading-card lines and `performance.mark`s, long tasks, the full resource
  timing list, and probes the first dialogue line, the battle card, the pause and tab-next.
- **Harness trap found on the way (worth knowing for the critic):** a self-signed HTTPS server makes
  Chromium skip its HTTP cache entirely (a certificate error disables caching), so every image was
  downloaded two or three times per run and "warm" was not warm. Fixed with
  `--ignore-certificate-errors-spki-list=<hash>`; every number below is from the fixed harness.
- `board-strips.mjs` (the rail strips on a cold phone), `trema-loss.mjs` (PR-0224).

## Results (before = main c9c1c295, after = this branch; 25 Mbit/s, 20 ms)

"Card" = the loading card's time on screen over the ink (the `[entry]` "handed over after" line; 0 = a
warm load that never needed it). "Prep→battle" = prep Enter to the battle's own card (includes the
scene, advanced by Enter every 350 ms). "1st line" = scene start to the first dialogue line, with the
speaker portrait and the backdrop as they were at that moment. Pause = the member close-up 1.1 s after
Esc in the battle, and after Tab. MB = art requested before the battle entry.

| Chapter | Size | Cache | Card before → after | Prep→battle before → after | 1st line before | 1st line after | MB before → after |
|---|---|---|---|---|---|---|---|
| I Seymour Flux (FFX) | 1600x900 | cold | **18.6 s → 1.3 s** | 43.2 → 30.1 s | 2.1 s, portrait NOT decoded, backdrop half-arrived | 6.1 s, portrait decoded, backdrop not yet up | 121 → 79 |
| I Seymour Flux | 1600x900 | warm | 0 → 0 | 25.2 → 25.3 s | 2.1 s, decoded, painted | 2.3 s, decoded, painted | 170 → 78 |
| I Seymour Flux | 390x844, 4x CPU | cold | **17.5 s → 0.9 s** | 42.3 → 31.2 s | 2.1 s, NOT decoded, half-arrived | 6.3 s, decoded, painted | 121 → 80 |
| I Seymour Flux | 390x844 | warm | 0.8 → 0.7 s | 27.2 → 26.4 s | decoded, painted | decoded, painted | 171 → 78 |
| IV Bahamut (FFX-2) | 1600x900 | cold | **25.8 s → 1.7 s** | 37.8 → 17.6 s | 0.9 s, NOT decoded, half-arrived | 5.0 s, NOT decoded, not yet up | 123 → 57 |
| IV Bahamut | 1600x900 | warm | 0 → 0 | 12.0 → 15.0 s | decoded, painted | decoded, painted | 149 → 63 |
| IV Bahamut | 390x844, 4x CPU | cold | **26.4 s → 1.0 s** | 38.3 → 17.7 s | 0.9 s, NOT decoded, half-arrived | 4.9 s, decoded, not yet up | 123 → 61 |
| IV Bahamut | 390x844 | warm | 0.6 → 0.6 s | 13.4 → 13.4 s | decoded, painted | decoded, painted | 149 → 63 |
| IV Bahamut, 3 s on prep | 390x844, 4x CPU | cold | **23.6 s → 0.03 s** (entry→card) | | 0.9 s, NOT decoded, half-arrived | 4.2 s, **decoded, painted** | 123 → 61 |
| XVI Ixion (FFX-2) | 1600x900 | cold | **29.1 s → 0.4 s** | 34.4 → 8.6 s | at once, NOT decoded, half-arrived | 3.7 s, decoded, painted | 122 → 51 |
| XVI Ixion | 1600x900 | warm | 0 → 0 | 5.3 → 5.3 s | decoded, painted | decoded, painted | 145 → 57 |

Pause close-up 1.1 s after Esc and on Tab: decoded in every run, before and after (in this harness the
pause opens 20+ s into a cold run, after everything had landed; the preload now also warms the party's
close-ups, phase 5). 404s: none in any chapter run.

**FF7 door (1600x900, frames sampled every ~0.2 s):** before, cold: **pure black from 1.0 s to 39.3 s**,
field at 39.5 s; warm: black 1.0-1.5 s. After, cold: the twisted board holds (never black) until the
art is in, then one black sample (the designed cut plus the battle build, under 1 s), field at 6.8-8.6 s;
warm: one black sample, field at 1.4 s. FF7 pause: before 3 requests 404 (`art/pause/cloud.json`,
`art/pause/cloud.png`, `art/portraits/cloud.png`) per run; after 0, the close-up deliberately empty.

**Trema loss (1600x900, `__pyrefly.gotoChapter('ffx2-trema', {auto:'defend', skipResults:false})`, the
loss set up by the debug API, the results screen real):** before, 2 404s (`yuna-dark-knight/hurt.png`,
`ko.png`), 2 console errors, empty wedge; after, 0 404s, 0 errors, Dark Knight Yuna's idle painting
under the fallen style.

**Board rail strips on a cold phone (390x844, 4x CPU):** before, 15 strips in view all half-arrived
(progressive PNGs) for 15 s, the first whole one at 20 s, 7 at 30 s; after, never a half-painted strip,
2 whole at 6 s, 6 at 15 s, 12 at 30 s. Desktop: the same shape (0 whole until 20 s before; 2 at 6 s after).

Evidence: `docs/screenshots/r29-load/` (JPEG): `ch4-phone-cold-first-line-before/after.jpg` (3 s prep),
`ch4-phone-cold-first-line-after-fast-prep.jpg` (the residual: 0.4 s prep, portrait up, backdrop not yet),
`ff7-cold-door-hold-after.jpg`, `ff7-pause-after.jpg`, `trema-defeat-results-before/after.jpg`,
`board-phone-cold-15s-before/after.jpg`. Raw runs (JSON with resource timing and long tasks) under
`D:/Tools/pyrefly-scratch/r29/load/runs/` (`B-*` before, `A-*` after).

## What each issue was, the cause proven, the fix

**PR-0240 (cold first battle 12-40 s), both games.** Cause, measured: *bandwidth order, not decode*.
Long tasks during the whole entry were 0.3-0.8 s (3-7 s only at 4x CPU); the board started about 40
image requests (100 MB: every rail card's 4-6 MB backdrop and boss idle) the moment it opened, the hero
plate, wash and dossier faces of every card the cursor passed kept downloading, and 115-123 MB had been
requested by the battle entry; on HTTP/2 every stream shares the pipe, so the chosen chapter's files
arrived last. The preload itself was serial. Fix: `imageWarm` lanes (urgent / normal / idle; idle two at
a time, cancelled and requeued by anything more urgent or by a hold; demotion), the board's strips, hero,
wash and faces through the lanes and up only once decoded (`frontend/lazyPlates.ts`), the cursor's old
card demoted, `runChapter` holding the idle lane, and a phased preload (`battlePreload.ts`: scene opening
frame, other speakers, battle opening frame and card chips, other poses, pause close-ups; a dwell stops
after the opening frame until chosen; a newer preload stops an older one). Result: the loading card is up
0.03-1.8 s after the scene instead of 17-29 s, under the 5 s goal in every run.

**PR-0221 (art paints late or not at all), both games.** Same cause for the speaker portraits, backdrops,
chips and strips. Fix as above, plus: the pre-battle scene puts its backdrop up only once decoded (never
half-painted) and holds its first frame (bounded, 4 s) for the backdrop and first speaker
(`sceneArt.ts`); the battle-start card's chips (faces and FFX-2 dressphere bodies) are warmed before the
entry. Result: the first line's portrait was decoded in 5 of 6 cold after-runs (0 of 6 before) and every
warm run; the backdrop was painted at the first line whenever the player spent about 3 s on prep, and is
never half-painted any more. **Residual, not fixed:** a cold player who skips prep in 0.4 s on 25 Mbit/s
reaches the scene before its 6 MB backdrop can arrive (it shares the pipe with the prep screen's own
paintings): the first line then waits up to 4 s and the backdrop goes up whole a moment later
(`ch4-phone-cold-first-line-after-fast-prep.jpg`). Only smaller files fix that (proposal below).

**PR-0222 (FF7 opens on 20-27 s of black), FF7 only.** Cause, traced and measured: `experimentPlayIn`
gave the swirl no cover wait, and the FF7 art (4 MB plate, 15 poses) queued behind the board's 100 MB,
all under the swirl's black. Also the preload named the plate `backdrops/sector1-reactor.png` (the scene
key), which does not exist: the FF7 scene's file is `ff7-film-reactor.png` (`plateUrlFor`). Fix: the
preload starts at the door and `playFf7Swirl` holds its own last twisted frame (bounded 30 s) until it
settles; no new look (the frame held is the swirl's own, as the critic suggested; the house loading card
is not put on the FF7 fight). During the hold the frozen board no longer answers keys (`openDoor` keeps it confirming; before, it re-armed after 250 ms, so an arrow could move the cursor and start another card's preload under the swirl); Esc during the hold was not re-tested in a browser.

**PR-0223 (FF7 pause requests three missing Cloud files), FF7 only.** Fix: `PortraitStage` asks for no
plate, sidecar or fallback the manifest says is absent; the FF7 close-up is deliberately empty.

**PR-0224 (Trema loss requests hurt.png and ko.png, 404), FFX-2 only in effect.** Fix: `wedgeFallenArt`
filters hurt/ko/idle through the manifest; a dressphere with neither pose painted stands in its own idle
painting under the fallen style (FOC17b-01's "FFX-2 art she has"); nothing on disk, nothing requested.

## Tests, checks

- New: `tests/unit/r29-load-order.test.ts` (lanes, hold, promotion, demotion, lazy strips, scene URLs,
  fallen pose with a manifest, the FF7 hold), `tests/unit/r29-preload-phases.test.ts` (dwell stops before
  the other poses, supersede, the FF7 plate). They fail on main (the APIs and the behaviour do not exist).
  `pause-chapter-plate-fallback.test.ts`: the case that pinned the absent plate request now asks for
  nothing (PR-0223); the no-manifest chain is unchanged.
- `npx tsc --noEmit` clean; full `npx vitest run` 613 files passed; `node tools/orphans.mjs` 24 (no growth).
- House rule 7: `PortraitStage.ts` stays at 398 lines. `CutsceneScreen.ts` (420 → 428) and
  `BattleScreenFlow.ts` (519 → 525) were already over 400 on main; the new logic went into new modules.

## Not fixed, and proposals (need Bailey's yes)

1. **Smaller files for what the board and scenes show (the real cure for a cold link).** Every rail
   strip is a full 4-6 MB 2688x1536 PNG shown at about 300x80; a build-time derivative (a downscaled WebP of
   the same approved painting for the strips, and WebP encodes of the backdrops) would cut the board from
   about 90 MB to a few MB and the scene backdrop from 6 MB to about 1 MB. It touches the art pipeline and
   the deploy's artifact manifest (hard rule 8 forbids changing `public/art`; this would add derived files
   at build time), so it is a proposal, not built.
2. **FF7 pause close-up**: point Cloud's (and Barret's) pause plate at the existing Film paintings
   (`characters/ff7-film-cloud/idle.png`) — a look for Bailey (the critic's own suggestion). Today it is
   deliberately empty.
3. **Trema defeat wedge**: Dark Knight Yuna's idle under the fallen style is the chosen stand-in; the
   alternative is her dimmed `yuna-x2` portrait (FOC17b-01 named both). One word from Bailey picks.

## Open

- The pause close-up for an Esc in the first second of a cold pre-battle scene was not measured (the
  harness pauses in battle); the preload warms the close-ups last (phase 5), so on a cold link they can
  still be in flight then.
- The measurement is headless Chromium on this PC over an emulated link, not the live host; the deep
  review should repeat the table on the live build.
