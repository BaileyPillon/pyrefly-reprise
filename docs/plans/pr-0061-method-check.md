# PR-0061 method check (rule 15): why two repairs did not move the number

Written 2026-09-24 before the third attempt, as RUBRIC section 8 asks of a
STALLED issue. Game case: **both** (battle entry, loading and the opening
beats are shared plumbing, CHK-020; chapters 1-3 and 8 are FFX, 4-6 FFX-2).

## The issue as the critic measures it

Round 11 (on 76f587c3): the play clock (`__pyrefly.snapshotState()` battle
`playTimeMs`, which `BattleScreen.update` feeds from its first frame) reads
7.0 to 9.5 s when `playback.awaitingMenu` first turns true, and the critic's
own step clock puts 5.6 to 10.5 s between the pre-scene skip and that menu.
Protocol: fresh profile, live production build, real keys, hold Enter through
the pre-scene, **no further key presses** (the run.json `hooks` say "none").
Acceptance: with a hold-Enter skip **followed by Confirm presses**, the first
usable menu at or under the recorded intended length (about 4 s).

## The two earlier attempts

1. `067a613a` let a Confirm press end the opening sweep
   (`OpeningSkip.ts`) and recorded its intended length, 3.8 s.
2. `db7b8323` stopped the presenter awaiting the 0.8 s turn cut-in before it
   opened the command menu.

## Why they did not move the number

- **A different interval.** Both measured "battle screen active to first
  menu" through `gotoChapter(..., { skipCutscenes: true })` on a dev server.
  That clock starts after `enter()` has already loaded everything, so the
  load behind the swirl (network, image decode, texture upload, shader
  compile, staging) was never in the number, and a dev server's unbundled
  modules and uncached art say little about a production build.
- **A different protocol.** Attempt 1 only helps when the player presses
  Confirm. The critic's round-11 run pressed nothing after the hold, so its
  number shows the full passive opening: card 1.9 s + sweep 3.8 s = 5.7 s of
  approved beats, plus the fight's first events. No Confirm shortcut can
  move a passive measurement.
- **Nothing was split.** No attempt said how much of the 5.6-10.5 s is
  loading, how much is authored beats and how much is the fight itself
  (enemy turns first in the CTB/ATB order, ch1's sensor line, ch5's voice).
  Without that split, "under 3 s" was never shown to be reachable.

## What this attempt measures first

One real-key flow per chapter on a **production build** served from its own
port (title, briefing, board, prep, pre-scene hold-Enter), cold (fresh
profile, empty HTTP cache) and warm (same profile, second entry), with an
in-page rAF recorder and resource timings, and a Chrome trace for decode,
texture upload and shader compile. Phases, each timed:

| phase | from | to |
|---|---|---|
| A skip tail | hold released | cutscene screen gone |
| B cover | swirl starts | swirl covers |
| C load | battle `enter()` starts | `enter()` resolves (scene, engine, stage, HUD) |
| D reveal | swirl unwinds | first battle frame |
| E card | card up | card gone |
| F sweep | sweep start | sweep end |
| G fight | sweep end | first `awaitingMenu` |

Both protocols: passive (the critic's) and with Confirm presses (the
acceptance check's).

## Alternatives and the test that tells them apart

- **Continue the Confirm route** (cut more beats on a press). Only helps if
  A-D are small and warm.
- **Change method: overlap the load with what is already on screen**
  (preload the battle's diorama, portraits and poses and compile shaders
  while the pre-scene plays; put the card up while the scene is still being
  staged). Only helps if C is large.
- Deciding test: phase C warm vs cold, and phase C vs E+F. If C is a
  second or more, overlap first; if it is small, the rest is authored beats
  and the fight, and the honest report is that 3 s passive would mean cutting
  an approved beat, which is Bailey's call.

## Choice

**Small probe first, then change method** where the probe points: measure
the split above, cut the load phases by preloading during the pre-scene
(both games), keep every approved beat, and report the passive and Confirm
numbers against the 3 s warm target. Anything that would shorten an approved
beat is written up for Bailey, not built (rule 10).

## Result of the probe (2026-09-24, same day)

Production build served Pages-style (base path, `max-age=600`), real GPU
headless Chromium, 1600x900, seed 1, real keys through title, board, prep and
a held-Enter pre-scene. "Skip -> menu" is from the scene's end (swirl start)
to the first `awaitingMenu`. Scripts: `tools/zz-pr0061-probe.tmp.mjs`,
`tools/zz-pr0061-prof.tmp.mjs` (CPU profile through the source map).

Where the time went, Chapter 1 cold, before: swirl cover 0.3 s; **battle load
2.0 s** (1.1-1.3 s of it three.js forcing ~22 shader programs to finish on the
first frame, 0.9 s decoding, matte-checking and alpha-measuring 30 paintings on
the main thread; network 0.15 s on localhost); battle-start card 2.2 s;
opening sweep 3.8 s; the fight's own first beat (Kimahri's sensor line) 1.8 s.

What was changed (both games, shared loading): the per-painting work is kept
for the session and done during prep and the pre-scene; the field's shaders
and the composer's post chain compile with `compileAsync` against the right
render target (three's PCFSoft-to-PCF swap made first, full-screen-quad
attributes matched, or the first frame rebuilds them), and the one remaining
first-draw stall of ANGLE's D3D11 back end is taken under the swirl cover
instead of on the card.

| chapter | load behind the swirl, cold | warm | skip -> menu, no presses, cold | warm | with Confirm presses, cold | warm |
|---|---|---|---|---|---|---|
| I Seymour Flux | 1961 -> 853 ms | 1479 -> 543 ms | 10.1 -> 9.1 s | 9.7 -> 8.8 s | 5.2 -> 4.3 s | 5.1 -> 4.3 s (3.6 s rerun) |
| II Yunalesca | 857 -> 325 ms | 881 -> 456 ms | 7.5 -> 6.9 s | 7.3 -> 7.1 s | 3.0 -> 2.1 s | 2.7 -> 2.1 s |
| III Braska's Final Aeon | 1718 -> 508 ms | 1173 -> 552 ms | 8.4 -> 7.3 s | 7.6 -> 7.2 s | 3.3 -> 2.4 s | 3.5 -> 2.5 s |
| VIII Evrae | 1373 -> 400 ms | 921 -> 573 ms | 7.8 -> 7.0 s | 7.4 -> 7.1 s | 2.7 -> 2.3 s | 3.4 -> 2.1 s |
| IV Bahamut | 789 -> 433 ms | 1058 -> 348 ms | 8.9 -> 8.3 s | 9.0 -> 8.2 s | 4.6 -> 4.5 s (3.3 rerun) | 4.3 -> 3.1 s |
| V Vegnagun | 1110 -> 553 ms | 1289 -> 521 ms | 10.3 -> 9.8 s | 10.6 -> 9.8 s | 4.4 -> 3.5 s | 3.5 -> 2.7 s |
| VI Leblanc | 1291 -> 314 ms | 1298 -> 272 ms | 10.5 -> 9.5 s | 10.6 -> 9.6 s (one 14.7 s outlier: 1.2-1.5 s stalls inside Leblanc's first enemy action, not loading) | 5.4 -> 4.6 s | 5.6 -> 4.5 s |

Under 3 s warm with Confirm presses: chapters II, III, V, VIII now; IV at
3.1 s. Not reachable by loading work: with no presses, the approved card
(2.2 s) and opening sweep (3.8 s) are 6.0 s on their own, and with presses
Chapter I keeps its 1.8 s sensor line, Chapter IV its 1.4 s of ATB fill before
Yuna's first turn and Chapter VI 2.8 s of opening enemy action. Shortening any
of those is an approved beat or the fight itself, so it is Bailey's call
(rule 10), not built.

## Repair pass after the round 11 verification (2026-09-24, later)

The verifier refuted "partly fixed" for PR-0061 and found three costs of
303d71ea. What each was, and what this pass changed (both games, shared
loading; no approved beat touched):

1. **New art 404s.** `battlePreload.ts` fetched every pose URL and every
   party portrait without asking the art manifest: 5 x 404 for Cid's poses in
   Chapter VIII, 3 x 404 for the FFX-2 dressphere portraits in every FFX-2
   chapter (CHK-016, CHK-017). Now `imageWarm.warmImage` and the preload's pose
   list skip anything the manifest says is absent (with no manifest, the
   request goes ahead as before). `tests/unit/load-time-gates.test.ts` fails
   on 303d71ea's code and passes now.
2. **The bare title after the wipe.** The board (and the briefing) waited for
   their paintings after the title's wipe had already cleared back onto the
   title, for up to 2.5 s, ignoring keys. Now the title waits before its wipe
   starts (`holdForNextScreen`), the screen after it spends only what is left of
   the same ceiling, and the ceiling is 1.0 s, not 2.5 s.
3. **What the board waited for.** 21 MB: the opening card plus every card's
   faces, with the briefing's 4.4 MB backdrop queued first even for a player
   who never sees the briefing. Now it waits for the opening card only (plate,
   silhouettes, the top face layer of each party tile); every other card's
   faces lead the background queue, then the FFX-2 body layers hidden under
   the portraits, then the rail and the other plates. The briefing's art is
   queued only when the briefing is due. The board list is read only after
   the art manifest has landed: read earlier (303d71ea), it warmed plain
   `yuna.png` / `rikku.png` where the FFX-2 cards show `yuna-x2.png` /
   `rikku-x2.png`.
4. **The overclaim.** 303d71ea's table came from one run per cell. This pass
   measures three runs for the contested chapters and reports ranges.

### Front end, 100 Mbit/s, 40 ms, fresh profile per run, real keys

Parent 10c8888c figures are the verifier's runs; 303d71ea is HEAD 37b998c0
(which contains it) built from a clean archive; the repair is HEAD plus this
pass, same build method. Probe: `tools/zz-pr0061r-0065.tmp.mjs` (the
verifier's probe, scratch).

| case | parent 10c8888c | 303d71ea | repair |
|---|---|---|---|
| First launch, title 1.5 s, briefing dismissed 0.6 s after it appears: board up after Enter | 1.07-1.20 s, grey busts | 3.66-3.82 s (4 runs) | 1.11-1.41 s (4 runs) |
| same: bare title on screen after the wipe | 0 | 2.50-2.52 s | 0 (4/4) |
| Briefing's first frame has Auron and the backdrop | 0/3 | 4/4 | 4/4 |
| Board's opening card (plate, silhouettes, three faces) on arrival | busts | complete | complete 4/4 |
| Every card's portrait layer after each ArrowRight (350 ms apart) | busts | complete | complete 4/4 |
| Returning player, cold cache, Enter 0.3 s after load: board up after Enter | 0.43-0.52 s, busts | 2.93-3.01 s | 1.50-1.53 s (3 runs) |
| same: bare title after the wipe | 0 | 2.27 s | 0 (3/3); the title holds 1.25-1.28 s after Enter before its wipe |
| same: opening card complete on arrival | no | faces yes | faces yes; the 5.5 MB plate still painting in 3/3 |

The returning, cold-cache, fast-Enter case is bandwidth-bound: at 100 Mbit/s
the opening card is 11 MB and the title's music and SFX sprite (3.8 MB) load
alongside it, so the plate lands at about 2.2 s after load. With the 1.2 s
ceiling tried first it made it in 1 of 3 runs and the board arrived at 1.7 s.

### Battle entry: swirl start to the first live menu, Confirm presses, seed 1

Probe: `tools/zz-pr0061r-probe.tmp.mjs` (the verifier's, scratch),
production build served Pages-style, GPU, 1600x900.

| chapter | 303d71ea (HEAD) cold / warm | repair cold / warm | art 4xx per entry, 303d71ea -> repair |
|---|---|---|---|
| I Seymour Flux (3 runs) | 3.97-4.89 / 3.47-3.79 s | 3.92-4.00 / 3.47-3.49 s | 0 -> 0 |
| II Yunalesca | 2.04 / 1.91 s | 1.74 / 1.73 s | 0 -> 0 |
| III Braska's Final Aeon | 2.20 / 3.09 s | 1.84 / 1.84 s | 0 -> 0 |
| VIII Evrae | 2.29 / 2.22 s | 1.72 / 1.74 s | 5 -> 0 |
| IV Bahamut | 3.36 / 3.14 s | 3.07 / 2.97 s | 3 -> 0 |
| V Vegnagun (3 runs) | 2.48-2.96 / 2.44-2.93 s | 2.45-2.59 / 2.42-2.49 s | 3 -> 0 |
| VI Leblanc (3 runs) | 4.42-4.69 / 4.37-4.64 s | 4.41-4.49 / 4.41-4.46 s | 3 -> 0 |

Without presses (repair, warm, one run): 9.1, 6.8, 6.9, 6.8, 8.1, 9.6, 9.6 s
in the order above.

On HEAD, Chapter V warm is 2.4-2.9 s where the verifier measured 3.19 s on
303d71ea, and Chapter I 3.5 s where it measured 4.1 s; the 13 commits after
303d71ea or run variance account for that, and this pass does not claim it.

Against the acceptance check (with presses, at or below an intended length
of about 4 s): met warm in six of seven chapters; Chapter I cold sits at
3.9-4.0 s; **Chapter VI is 4.4-4.5 s cold and warm and does not meet it.** The
remainder there is Leblanc's opening enemy turns, not loading. No chapter's
intended length has been recorded by Bailey, and without presses every
chapter is still 6.8-9.6 s because of the approved card and sweep. PR-0061 is
therefore **not fixed**; its loading share is.
