```text
Build / artifact / target version: main 1a6fd3cc / bundle ChAAAZ-I / artifactHash 2011851984efc73c88b12be5f0b6b5f07abe1bf4c2bd3659f7f2f69cb025e591
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (a live review does not gate ship; the deep review round 17 recorded SHIP for this exact candidate)
Milestone: not assessed
Quality: not assessed (live review does not recompute the score; round 17's score is provisional)
Targets: not assessed
Top issues: none found in this pass; one harness observation (OBS-1) below, unproven
Coverage: tested = full artifact compare (1006 files), FFX Seymour Flux and FFX-2 Bahamut to a player turn by keys and by touch, OPTIONS rows by keys, release-31a save, Items list wheel, pause/resume music, FF7 LIMIT door, reload; reused = changed-area verdict from round 17; not tested = full upgrade matrix, a played-out chapter, the default-off switches, pixel layout and Sphere Grid fixes
Next required review and why: none newly triggered; the deep obligation for this build was discharged by round 17 (SHIP) and any further owed reviews stay as recorded in critic/pending
Elapsed review time / repeated work avoided: about 110 minutes, most of it harness tuning (coach timing, chapter-card selection, touch hold time); nothing reused from earlier live passes except the harness library
```

## Step 1. Exact artifact (CHK-017)

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/1a6fd3cc.json --url https://baileypillon.github.io/pyrefly-reprise/ --full
```

Result: PASS. `liveManifest: match`, 1006 files checked, no mismatched, missing, wrong-type or errored file. The full compare was used because a deep review was owed. The manifest hash equals the pending marker's `artifactHash`.

## Step 2. Real-input smoke (CHK-016)

Headless Playwright from node, `PYREFLY_BROWSER=gpu`, one browser at a time, fresh context per stage, cache-busting query. No black canvas, no fallback used. Screen, chapter card (by its hero text) and battle state were asserted before each measurement.

| Flow | Result |
|---|---|
| FFX Chapter I Seymour Flux, keys 1600x900 | player turn reached; ATTACK grew the battle log 16 to 21; cancel path (open SPECIAL, Escape) returned to the same rows |
| FFX Items list, mouse wheel | 27 items; page one POTION to MEGA PHOENIX, after one wheel EYE DROPS to AL BHED POTION, after two STAR CURTAIN: the list scrolls |
| Pause (P, Escape), H | pause screen opens, battle log frozen for 1.5 s, H hides then restores the panels (694 to 1117 characters), Escape and P resume |
| Music across pause | boss-seymour prerendered before, pause.mp3 (prerendered) during, boss-seymour prerendered after. mp3 files fetched from /audio/music/, sprite decoded, 26 cues: not the synth fallback |
| OPTIONS by keys | P then E x5; TEXT SIZE steps 100, 115, 130 and back; REDUCE MOTION and LOW EFFECTS toggle by Enter; `data-text-size=130` on the page |
| FFX-2 Chapter IV Bahamut, keys | player turn reached; ATTACK grew the log 17 to 23; cancel path (SKILL then Escape) returned to the same rows; boss-ffx2-aeon prerendered before and after pause |
| Touch 390x844, FFX and FFX-2 | title, chapter card, plate tap, START BATTLE, cutscene dialogue taps, coach tap, ATTACK tap, pause button and resume all worked |
| FF7 door | typing L I M I T on chapter select then Enter reached ff7-guard-scorpion; Attack grew the log 0 to 4 |
| Console errors and 404s, whole run | 0 and 0 |

## Step 3. Reload smoke (CHK-024, lightweight)

Changed TEXT SIZE to 130, REDUCE MOTION on, LOW EFFECTS on, reloaded: all three kept, the save string byte-identical. A release-31a-shaped save (no textSize, reduceMotion, lowEffects; volumes 0.42, 0.33, 0.61, text speed 2, guide off) loaded with those values kept. The full upgrade matrix is NOT part of this pass. No chapter was played to its end, so progress beyond settings was not exercised.

## Observations

OBS-1 (harness, unproven, informational). A touch tap with zero hold time did not advance the cutscene dialogue, a 140 ms held touch did. Separately, in two of about five FFX-2 desktop runs the first Enter after dismissing the first-time coach did not open the submenu, and the next Escape opened the pause; not reproduced in the clean runs. Suspected coach timing in the harness; not called a product defect. A touch tap through the FFX-2 first turn (Yuna, no ATTACK row) is weak evidence of the tap itself because the log also grows from enemy actions.

## Not tested

Full upgrade matrix; a chapter played to victory or defeat; the default-off switches (`?zombiewarn=`, `?sfxmix=`, `?pace=`, `?cam=`); the FFX Zombie pip ordering and target-plate warning, the six Sphere Grid fixes, the miss sound and HUD pixel layout against the camera rest pose; FFX-2 Items list scrolling; real touch hardware; audio by ear.
