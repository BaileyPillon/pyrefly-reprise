# r31-soundtrack: the whole score in remaster R1 (2026-09-29, D-283)

**Game case (rule 14): BOTH.** One chain over every FFX cue, every FFX-2 cue and the shared menu
cues; nothing in it depends on the game. **Branch** `r31-soundtrack` (worktree
`D:/pyrefly-r29-audio`), off `origin/main` 8dce5e75. Not pushed, not merged, not deployed.

**Why.** Bailey, 2026-09-29 ~10:30 EDT: "all your recommendations, full speed ahead."
Recommendation 1 of the driver's morning brief was the whole soundtrack in remaster R1: the
Direction B cues (`docs/audio/direction-b-2026-09-27.md`) through R1 "focus"
(`docs/audio/remaster-2026-09-29/README.md`), shipped the way the Chapter VII scene cue already is.

## What shipped

- **23 of 25 cues** in `public/audio/music/` are now Direction B + R1: battle-ffx, boss-dread,
  boss-evrae, boss-ffx2-aeon, boss-jecht, boss-seymour, boss-seymour-macalania, boss-shuyin,
  boss-yojimbo, boss-yu-yevon, boss-yunalesca, chapter-select, ending-ffx, ending-ffx2, pause,
  scene-dreams-end, scene-fahrenheit, scene-farplane, scene-gagazet, scene-zanarkand-dome, title,
  victory-ffx, victory-ffx2. `scene-macalania-temple` (already R1, D-278) is untouched.
- **2 kept at today's sampled render**, because their R1 take failed the stereo gates:
  `boss-vegnagun` (L/R correlation 0.553, side 5.3 dB under the mid, mono-sum loss -1.1 dB) and
  `scene-bevelle-underground` (0.548, 5.0 dB, -1.2 dB). Both FFX-2. See "Not done".
- Every cue key, loop point and score fingerprint is unchanged; `public/audio/manifest.json`
  took the new bytes, duration, LUFS and true peak. Shipped music is 39 MB (42.95 MB with the
  effects sprite, of the 60 MB budget).

## How it was made

`node tools/audio/remaster-score.mjs render|measure|ship`:

- **Source**: the lossless Direction B masters,
  `D:/Tools/pyrefly-scratch/direction-b-0927-work/master/<cue>.wav` (float WAV, outside the repo).
- **Chain**: `tools/audio/remaster-ship.py` over `remaster.py`, preset `focus`, unchanged: phase
  repair, image (mono bass under 120 Hz, side 8 dB under the mid), tone EQ, -16 LUFS, limiter,
  loop repair, MP3 through libmp3lame `-q:a 5`, 44.1 kHz stereo, as the game's cues are encoded.
- **Loops**: the shipped manifest's points (the candidate manifest's are identical; the script
  stops on a mismatch), sample-exact; seam crossfade = one beat, 60/bpm clamped to 0.3-1.0 s,
  bpm from `tools/audio/modern/b-score-cues.mjs`, as the Direction B render did.
- **One level-only exception**: `scene-zanarkand-dome` measured -0.99 dBTP on qa.mjs's meter
  with the default ceiling, so it was re-rendered with `remaster-ship.py --tp-max -1.3` (new
  option; only the encoder loop's true-peak target moves). Now -1.42 dBTP.
- Stage files: `D:/Tools/pyrefly-scratch/r31-soundtrack/stage/` (MP3s, per-cue ship reports,
  the stage manifest, qa.json).

## How it was proven (measurement only: nobody heard it, rule 13)

- **Gates per cue** (`docs/audio/soundtrack-r1-2026-09-29.json`): LUFS -16 +/- 0.5, true
  peak <= -1 dBTP, L/R correlation 0.6-0.85, side 6-10 dB under the mid, mono-sum loss under
  1 dB, every `tools/audio/qa.mjs` per-cue gate (seam step, seam flux <= 2x, clipping, spectral
  tilt, silence, manifest agreement), length = loopEnd + 3 s run-on (within one MP3 frame), and
  whole-file alignment with the lossless source at lag 0 (`tools/audio/remaster-align.py`).
- **The 23 shipped**: correlation 0.654-0.836 (today's files 0.036-0.75), side 6.4-9.3 dB under
  the mid, mono-sum loss -0.5 to -0.9 dB (today -0.8 to -2.9), -15.9 to -16.0 LUFS (qa.mjs
  -16.05 to -16.19), true peak -1.10 to -1.73 dBTP, qa seam flux 0.02-1.0x, alignment lag 0 on all.
- `node tools/audio/qa.mjs --strict` on the shipped tree: **0 cues with findings, 0 sfx findings**,
  no stale render.
- **Production build, headless Chromium** (`npm run build`, then
  `PYREFLY_BROWSER=gpu node tools/audio/r1-browser-proof.mjs`, vite preview on :8801, stopped by
  PID; results `docs/audio/soundtrack-r1-2026-09-29-browser.json`): all 17 distinct scene and
  battle cues of every chapter in THEMES.md's chapter cue map fetched **HTTP 200** and decoded at
  their manifest lengths (to the millisecond); after a real key press, `audioDebug()` reported
  `title` playing with source `prerendered` on the title, `boss-seymour` in Chapter I (FFX) and
  `boss-ffx2-aeon` in Chapter IV (FFX-2), each fading in (gain 0.0002-0.0006 -> 1.0 four seconds
  later), each with its `music/*.mp3` response 200; 0 console errors. Screenshots:
  `docs/screenshots/r31-soundtrack/` (title, Chapter I battle, Chapter IV battle).
- `npx tsc --noEmit` clean. Targeted vitest (audio-shipped-files, audio-manifest,
  audio-manifest-io, audio-cue-reachability, load-time-gates, dist-filter, artifact-manifest,
  macalania-ship): 8 files, 120 tests pass. Full `npx vitest run`: 625 files pass, 2 fail on
  things this branch does not touch (`strategy-ffx2-bahamut` "heal-only route" 1/30 wins and a
  15 s timeout; `ui-portrait-face-crop` four painted dresspheres with no head row, because the
  worktree's `public/art` junction shows the main tree's newer paintings); two more files failed
  once in the loaded first run and passed on the second. `node tools/orphans.mjs`: 24, all in
  `src/`, untouched by this branch (no growth).

## Docs changed

`docs/audio/THEMES.md` (a "How each cue ships" table after the cue map), `docs/audio/CREDITS.md`
(the three-step provenance for all cues, and the ACE-Step licence), `docs/audio/audition.html`
(a "Shipped: the whole score in R1" note at the top; its 38 players on `public/audio/music/` now
play R1).

**ACE-Step licence: Apache-2.0**, read from the Hugging Face API on 2026-09-29
(`ACE-Step/ACE-Step-v1-3.5B` sha 82cd0d7b; the ComfyUI repackage
`Comfy-Org/ACE-Step_ComfyUI_repackaged` sha e39503e8, which lists the file name on this disk).
A courtesy credit line is in CREDITS.md.

## Not done / open

1. **`boss-vegnagun` and `scene-bevelle-underground` still play the sampled render.** Cause,
   measured: both mixes put about 65 % of the mid below 80 Hz; R1 sets the side 8 dB under the mid
   *before* its tone EQ, and the EQ then cuts 20-80 Hz by 2 dB and lifts 80 Hz-6 kHz by 2-5 dB, so
   the mid falls and the side rises. An experiment (not shipped, scratch
   `D:/Tools/pyrefly-scratch/r31-soundtrack/experiment/`) that runs R1's image trim once more after
   the EQ lands both at correlation 0.73-0.75, side 8.0 dB under, mono-sum loss -0.6 dB, -16 LUFS,
   -1.3/-1.4 dBTP. That changes the R1 chain, so it needs the driver's (or Bailey's) yes.
2. **Seams for an ear.** Every shipped cue passes the pipeline's seam gate (qa.mjs flux 1.0x or
   under). remaster.py's stricter log-flux figure reads over 2 on 12 cues (boss-seymour 3.55,
   scene-dreams-end 3.54, boss-jecht 3.52, boss-shuyin 2.84, boss-yojimbo 2.58, ending-ffx2 2.49,
   scene-farplane 2.38, battle-ffx 2.28, chapter-select 2.2, boss-evrae 2.08, boss-ffx2-aeon 2.02,
   pause 2.01); most were already over 2 in the Direction B candidates Bailey heard
   (`seamSecondary` in the report). Not a gate; the first wraps to listen to.
3. **A re-render undoes R1.** `tools/audio/render.mjs` writes a plain sampled render over a
   cue's MP3 and manifest entry; for these cues re-run `remaster-score.mjs` (from the lossless
   master) instead. Nothing in the manifest marks an R1 cue; THEMES.md's table does.
4. **CHK-B1 listening score** is still owed (rule 13); the audition page is where Bailey judges.
5. The on-disk ACE-Step checkpoint's hash was not compared with the published file.
6. `D-283` in `docs/target/decisions.json` (on main, not on this branch) can move to
   `delivery: implemented` when this merges; not edited here.
7. `docs/audio/remaster-2026-09-29/README.md` and `direction-b-2026-09-27.md` still describe
   themselves as options; this handoff and THEMES.md say what shipped.
