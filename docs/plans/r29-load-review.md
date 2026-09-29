# Paper preflight: cold load and art (r29-load: PR-0221, PR-0240, PR-0222, PR-0223, PR-0224)

Written 2026-09-28 by a sub-agent of the driver session, after the "before" measurement and
before any product code. `node tools/critic-plan.mjs --paths` classes the change **deep**
(`src/app/imageWarm.ts` is an unclassified shared path, `victoryLine.ts` is shared layout),
so this page is the rule-15 preflight.

**Game case.** The loading plumbing (image warm lanes, the board's rail strips, the chapter
preload, the pre-scene art wait, the pause plate warm) is **both** games: one front end, one
preload, one cutscene screen, one pause (CHK-020). PR-0222 and PR-0223 are **FF7 only** (the
hidden experiment's swirl and its pause plate). PR-0224 is **FFX-2 only** in effect (the
fallen-pose path only differs for an FFX-2 dressphere), shared code.

## 1. What the measurement proved (before, production build)

Harness: `D:/Tools/pyrefly-scratch/r29/load/measure.mjs` (headless Chromium, GPU, one browser)
against a Pages-like server (`pages-server.mjs`: HTTP/2 over TLS, `max-age=600` + ETag, as
GitHub Pages sends) with a named network, **25 Mbit/s down, 20 ms RTT** (round 15 measured the
live host at about 24 Mbit/s by curl). Cold = fresh context; warm = same context, reload.

- Cold, 1600x900: Chapter I entry to the battle's own card **25.4 s**, IV **31.4 s**, XVI
  **33.3 s**; FF7 door to engine **29 s of pure black** (9307-byte all-black JPEG every second).
- The cause is **bandwidth order, not decode**: long tasks during the whole entry total about
  0.3 to 0.5 s. At the moment the board opens, about **40 image requests / 100 MB start at once**
  (every rail card's 4-6 MB backdrop plus its boss idle, `plateArtHtml(tile,'card')` markup with
  a plain `src`), and by the battle entry **115-123 MB** had been requested. On HTTP/2 every
  stream shares the pipe, so the chosen chapter's speaker portrait (`rikku-x2.png`, 1.43 MB,
  requested at 5.5 s) finished at **36.7 s**, its scene backdrop at 17 s, the pause close-ups
  later still. The warm cache is fast (IV 0.6 s, I 0 s), which confirms the cold cost is fetch
  order.
- The chapter preload itself is serial (`await` per portrait, backdrop then idles then poses),
  and its portraits go through `imageWarm`'s single FIFO queue *behind* the board's `rest`.
- A dwell preload started for a card the player moved past keeps downloading (every pose of that
  chapter) while the chosen chapter loads.

## 2. What is built (the smallest set that fixes the order)

1. **Lanes in `imageWarm`**: `urgent` > `normal` > `idle`. Idle loads run at most two at a time,
   only while nothing urgent or normal is waiting and no *idle hold* is held; a hold aborts the
   idle loads in flight (the element's `src` is dropped, which cancels the request) and re-queues
   them. A URL asked for again at a higher lane is promoted. Same idempotent API.
2. **The rail strips load in the idle lane, nearest the cursor first**, and a strip's images are
   put up only once decoded (the markup carries `data-lazy-src`; the board assigns `src` when the
   warm resolves, so a strip never shows half a painting). The hero plate (the selected card) is
   unchanged and still gated by the existing `boardGate`.
3. **`runChapter` holds the idle lane** from the moment a chapter is confirmed until the flow
   comes back, so nothing of the board competes with prep, the scene, the battle or the pause.
4. **The chapter preload runs in priority order with a small parallel fetch window** (3):
   scene backdrop and the pre-scene speakers' portraits, then the boss and party idles and faces
   (the battle-start card chips), then every other pose, then the party's pause close-ups (the
   file the pause's `srcset` will pick). A newer preload supersedes an older one (it stops at its
   next step and aborts its fetches), so a card the player passed stops downloading.
5. **The pre-battle scene waits, bounded, for its first frame**: the backdrop and the first
   speaker's portrait decoded, or 2.5 s, whichever first (the fade stays down meanwhile); the
   backdrop is put up only once decoded, and every speaker portrait of the scene is warmed at
   `urgent` when the scene opens.
6. **FF7 (PR-0222)**: the swirl holds the twisted frozen board (no black) while the FF7 battle's
   art preloads, bounded, then cuts to black and swaps as before; the preload starts at the door.
   No new look: the frame held is the swirl's own last frame (the critic's suggested option); the
   house loading card is *not* put on the FF7 fight (that would need Bailey's look, rule 9).
7. **PR-0223**: `PortraitStage` never requests a plate, sidecar or fallback the manifest says is
   absent; the FF7 pause is then deliberately empty (pointing it at `ff7-film-cloud/idle.png` is a
   look for Bailey, returned as a proposal).
8. **PR-0224**: the fallen-pose chain is filtered through the manifest; an FFX-2 dressphere with
   neither pose painted falls back to that dressphere's own idle painting (FOC17b-01's suggested
   art she has), dimmed by the existing fallen style; with nothing on disk, no figure and no
   request.

## 3. Risks and how each is checked

- *A strip that never loads* (lane starved): the hold is released when the flow returns to the
  board; unit test for hold/release and for promotion; board screenshot at 390x844 after 10 s.
- *Aborting a load resolves its promise false and the board removes the image*: an aborted
  idle load is re-queued, never settled; unit test.
- *The scene holds too long on a slow line*: the wait is bounded (2.5 s), and a warm cache
  resolves at once; measured before/after.
- *Preload order changes what the battle finds cached*: the same URLs and the same
  `prewarmPainted` options as before; the battle still loads anything missed.
- *Tests that read the board markup's `src`*: `frontendWarm.srcsIn` reads `data-lazy-src` too.

## 4. Acceptance (measured with the same harness, before and after)

Cold and warm, 1600x900 and 390x844 (4x CPU), Chapters I, IV, XVI and the FF7 door: entry to
the battle's own card; the scene's portrait and backdrop decoded at 1.2 s; the pause close-up
decoded 1.1 s after Esc and on tab-next; FF7 frames not black for more than 400 ms; zero 404s.
