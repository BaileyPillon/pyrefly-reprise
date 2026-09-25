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
