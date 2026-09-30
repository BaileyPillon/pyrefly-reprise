# Battle pacing options (fb-0929): measured beats, three presets, clips

Bailey, 2026-09-29, passing on a friend's feedback: "moves and transitions happen too fast". This is a taste
item, so it is an **option for Bailey**: a switch on branch `fb-0929-pacing`, **default off** (`'current'` = the
live build). Nothing here ships until Bailey picks. Handoff: `docs/handoff/fb-0929-pacing.md`.

**Update 2026-09-30: Bailey picked `steady` as the default** ("yes, all your recommendations"); see
[steady-default.md](steady-default.md). No parameter now plays steady; `?pace=current` is the old timing. The text
below is the options round as it was written.

**How to try it:** add `?pace=steady` or `?pace=relaxed` to the URL, or run `__pyrefly.pace('relaxed')` in the
console (takes effect from the next beat). `__pyrefly.pace()` reads the current setting.

## The presets (every number is `[ours]`; no source gives battle timings in seconds)

| Preset | Game | Actions (waits, actor moves, camera, sparks, spell effects) | Damage numerals held | Battle entry + results wipe |
|---|---|---|---|---|
| `current` | both | x1 (live) | x1 (0.9 s) | x1 |
| `steady` | FFX (CTB) | x1.2 | x1.3 | x1.2 |
| `relaxed` | FFX (CTB) | x1.4 | x1.6 | x1.4 |
| `steady` | FFX-2 (ATB) | x1.1 | x1.25 | x1.1 |
| `relaxed` | FFX-2 (ATB) | x1.25 | x1.5 | x1.3 |

FFX-2 stretches less because the sources call it "ATB, but faster", with party members acting at once
(`research/ffx-vs-ffx2-presentation.md` §4.2). FF7 is never paced. The engine, the RNG, the CTB order and the FFX-2
ATB clock are untouched: in Wait and Active an animation never pays the ATB clock in this build
(`src/engine/BattlePresenterActive.ts` property 5), so a slower animation costs wall time only, never ATB.

## Measured beats, 1600x900, real keys, headless Chromium (GPU), seed 3

Chapter I, Seymour Flux (FFX). `live-ch1` is the live site (release 31a); the others are this branch's build.

| Beat (median ms) | live | current | steady | relaxed |
|---|---|---|---|---|
| Confirm key to actor moving | 11 | 25 | 20 | 9 |
| Party action, start to settle | 1207 | 1200 | 1443 | 1685 |
| First party turn (Tidus, Attack), start to settle | 794 | 791 | 937 | 1102 |
| Enemy action, start to settle | 1286 | 1268 | 1516 | 1798 |
| Wind-up (action-start beat) | 382 | 382 | 458 | 534 |
| Hit reaction (damage beat) | 352 | 356 | 427 | 489 |
| Settle (action-end beat) | 202 | 204 | 247 | 284 |
| Damage numeral on screen | 900 | 900 | 1182 | 1449 |
| Last beat to the next menu | 0 | 0 | 0 | 0 |
| KO beat | 623 | 629 | 755 | 875 |
| Turn-start beat | 95 | 96 | 112 | 127 |
| Battle entry overlay on screen (includes the load, noisy) | 1257 | 1422 | 1330 | 1487 |
| Battle screen up to first menu (start card + opening camera) | 8263 | 8464 | 9330 | 10560 |
| Defeat beat | 1101 | 1107 | 1323 | 1550 |
| Defeat start to results screen | 1347 | 1370 | 1637 | 1900 |
| Results wipe | 496 | 497 | 597 | 700 |

Chapter IV, Bahamut (FFX-2, Wait mode, the default).

| Beat (median ms) | live | current | steady | relaxed |
|---|---|---|---|---|
| Confirm key to actor moving | 114 | 118 | 124 | 136 |
| Party action, start to settle (4 manual turns) | 2817 (whole auto-finished fight, spells; not comparable) | 801 | 926 | 987 |
| Enemy action, start to settle | 1377 | 1370 | 1529 | 1715 |
| Wind-up (action-start beat) | 809 | 815 | 891 | 1009 |
| Hit reaction (damage beat) | 352 | 350 | 397 | 445 |
| Settle (action-end beat) | 202 | 203 | 230 | 259 |
| Damage numeral on screen | 904 | 900 | 1130 | 1360 |
| Last beat to the next menu | 19 | 17 | 26 | 21 |
| Turn-start beat | 94 | 95 | 105 | 115 |
| Battle entry overlay on screen (includes the load, noisy) | 1440 | 1439 | 2047 | 2113 |
| Battle screen up to first menu | 6941 | 6920 | 7860 | 8491 |
| Victory beat (live run, auto-finished) | 902 | not run | not run | not run |

Phone (390x844, Chapter I): same beats as desktop within a few ms (Tidus's Attack 791 current, 1119 relaxed;
numeral 900 current, 1448 relaxed). Raw data: `beats/*.json`. Tool: `node tools/pace-measure.mjs`.

## Clips and stills (8 s, H.264, 1280 wide; the clip starts 1 s before the first party action)

| | current | steady | relaxed |
|---|---|---|---|
| Chapter I (FFX) | `ch1-current.mp4` | `ch1-steady.mp4` | `ch1-relaxed.mp4` |
| Chapter IV (FFX-2) | `ch4-current.mp4` | `ch4-steady.mp4` | `ch4-relaxed.mp4` |

Stills: `<clip>-windup.jpg` (0.12 s after the actor starts to move) and `<clip>-numeral.jpg` (just after the
first damage numeral lands).
