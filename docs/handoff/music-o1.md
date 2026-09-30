# music-o1: the whole score at LAME V0 (D-292)

**Game case (AGENTS.md rule 14): BOTH.** The music chain is shared plumbing; every cue of both games is
re-encoded. Branch `music-o1` (from `origin/main` 1a6fd3cc), worktree `D:/pyrefly-r29-audio`. Not pushed, not
deployed; no `NOW.md` edit (the driver owns both).

**Approval.** Bailey, 2026-09-29 ~23:00 EDT: "yes, all your recommendations", answering recommendation 1:
"O1 now for the whole score (the same R1 music re-encoded at a high MP3 quality, V0; the music grows from
about 39 MB to about 73 MB ...)". This is option O1 of `docs/handoff/fb-0929-music.md` for all 26 cues.
The "test a newer AI music model" half of that recommendation is **not** in this track (see Not done).

## What changed

- `public/audio/music/*.mp3`: all 26 cues, LAME V0 (`libmp3lame -q:a 0`, 44.1 kHz stereo). Nothing else about
  a cue changed: same music, same loop points (to the sample), same seam crossfade, same 3 s run-on, same
  -16 LUFS gain, same score fingerprint, same duration (asserted per cue against the manifest).
- `public/audio/manifest.json`: only `bytes`, `lufs` and `truePeakDb` moved (75 lines in, 75 out).
- Sources, as `music-o1-ship.py` chooses them:
  - 23 cues: the Direction B master through remaster R1 "focus", `tools/audio/r1-encode.py` (the same chain
    as the shipped files, with the encode swapped). `scene-zanarkand-dome` keeps its `--tp-max -1.3`
    (`remaster-score.mjs` TP_MAX).
  - `scene-macalania-temple`: sketch A master `macalania-a.wav` through the same chain, loop 12.857143 to 60,
    xfade 1.0 (`docs/audio/scene-macalania-temple-2026-09-29.json`).
  - `boss-vegnagun`, `scene-bevelle-underground`: they never passed R1's stereo gate and ship the sampled
    render. Their lossless source is `render.mjs --wav` (into a scratch root; nothing under `public/` is
    touched by that run). At q5 it reproduces the shipped bytes exactly.
- **Reproduction proof.** For every cue the same chain at the shipped `-q:a 5` writes a file whose SHA-1 equals
  the file in `public/audio/music` before this change: 26 of 26. So the lossless twin used for the
  measurements is exactly what the shipped encoder was given.
- `tools/audio/manifest-io.mjs` (+ `.d.mts`): new `AUDIO_BUDGET_BYTES = 85e6`, comment citing D-292 and
  Bailey's words. `qa.mjs` (now also a finding when over), `render.mjs` and
  `tests/unit/audio-shipped-files.test.ts` read it. Was three separate `60e6` literals.
- `tools/audio/r1-encode.py`: `run()` takes an optional `entry` (additive) so a cue outside the R1 report
  (macalania-temple) can use the same chain.
- New: `tools/audio/music-o1-ship.py` (sources, three encodes per cue, `--install`),
  `tools/audio/music-o1-measure.py` (before/after against the twin, `--report`), `tests/unit/audio-music-o1.test.ts`.
- `tools/audio/r1-browser-proof.mjs`: `PYREFLY_PROOF_ALL=1` decodes all 26 cues and plays every chapter's
  battle cue (default behaviour unchanged).
- Docs: `docs/audio/THEMES.md` ("The encode (2026-09-30, D-292)" paragraph under "How each cue ships"),
  `docs/audio/audition.html` (a "30 Sep" note above the options section; the fb-0929 block is untouched, so its
  "0 Today" clips are the old q5 and "O1" is what plays now).

## Measurements (`docs/audio/music-o1-2026-09-30.json`, all 26 cues, before = shipped q5, after = V0)

Median over 26 cues, coding error measured against the lossless twin (lag 0 on all 52 pairs):

| | before (q5) | after (V0) |
|---|---|---|
| average bitrate | 111 to 155 kbps (about 125 typical) | 219 to 283 kbps |
| encoder lowpass wall (steepest step above 10 kHz) | 41 dB at 16.6 kHz (26 to 48 dB on every cue) | 9 dB (worst 12.6 dB), no wall |
| coding noise under the music, 6-12 kHz | -8.2 dB | -17.9 dB |
| coding noise under the music, 12-16 kHz | -3.3 dB | -13.6 dB |
| coding noise under the music, 2.5-6 kHz | -14.8 dB | -25.3 dB |
| noise in the 20 ms before the 40 strongest attacks | -10.8 dB | -20.0 dB |
| whole-file signal over coding error | 26.5 dB | 37.3 dB |
| 4-10 kHz flatness | -9.7 dB | -9.3 dB (the lossless twin's own; the encode did not fix the AI's hiss) |
| attack rise 2-8 kHz | 13.0 ms | 14.5 ms (twin: 15.0 / 16.0 / 12.5 / 10.0 on the four checked; V0 is within 1.5 ms of it) |

`qa.mjs --strict`: **0 findings, 0 sfx findings**, 80.93 MB of the 85 MB budget. After the re-encode: LUFS
-16.21 to -15.98 (gate -16 +/- 0.5), true peak at most -1.34 dBTP (gate -1), no clipped samples, seam step
under the allowed step on all 26, seam flux at most 1.01x (gate 2x; before 1.0x). The encoder's own
`--tp-max` loop never had to lower a ceiling (`ceilDb` -1.5 on every R1 cue in the lossless, q5 and V0 runs).

Browser (headless Chromium, `PYREFLY_BROWSER=gpu`, vite preview on 8801, stopped; `npm run build` = tsc + vite
clean): `docs/audio/music-o1-2026-09-30-browser.json`. All 26 cues answer HTTP 200 and decode to within
0.000045 s of the manifest duration; the title and all 18 chapter battle cues play from the prerendered file
(not the synth), gain rising, no console error. Loading and routing only; nobody heard it (rule 13).

Checks: `tsc --noEmit` clean; the 29 audio test files (484 tests) and the new 5 pass; full suite result is in
the driver's return.

## Things to know

- **The size is 78.2 MB of music, not "about 73".** The recommendation extrapolated x1.87 from two cues; the
  whole score measured x1.94 (40.24 to 78.22 MB; 80.93 MB with the 2.71 MB sfx sprite). The budget is set at
  85 MB to fit that. If Bailey wants nearer 73 MB, the only knob is a lower VBR quality (V1 is about 10 %
  smaller), which I did not pick.
- **What V0 does and does not fix** (from `fb-0929-music.md`): stage 3 only, the encode. The AI decoder's noisy
  top and slow attacks are unchanged, as the table shows. Bailey's ear decides whether it is audible.
- `git` shows 26 large binary diffs. The working tree grows by 38 MB, but .git gains about 78 MB of new blobs (the old 40 MB stay in history).
- Gapless: Chromium decodes each file to within 0.05 ms of the manifest length, so the loop points still land.
  Safari/iOS was not tested (no device here); LAME writes the same gapless header at V0 as at q5.
- `render.mjs` writes q5 again if anyone re-renders a cue into `public/audio`; use `music-o1-ship.py` to
  re-encode (its header says so). `audio-music-o1.test.ts` fails if a cue goes back below 200 kbps.

## Re-run

```
node tools/audio/render.mjs --only=boss-vegnagun,scene-bevelle-underground --wav --out=<scratch>/render --quiet
python tools/audio/music-o1-ship.py --all --work <scratch>/work --jobs 3      # wav + q5 + v0 per cue
python tools/audio/music-o1-measure.py --work <scratch>/work --jobs 3
python tools/audio/music-o1-ship.py --install --work <scratch>/work            # copy V0 in, update the manifest
node tools/audio/qa.mjs --strict --json=<scratch>/qa-after.json
python tools/audio/music-o1-measure.py --work <scratch>/work --report docs/audio/music-o1-2026-09-30.json --qa-before <before>.json --qa-after <scratch>/qa-after.json
npm run build && PYREFLY_BROWSER=gpu PYREFLY_PROOF_ALL=1 node tools/audio/r1-browser-proof.mjs docs/audio/music-o1-2026-09-30-browser.json
```

Scratch, outside the repo: `D:/Tools/pyrefly-scratch/picks-0930/music-o1/` (the lossless twins, q5 twins, V0
files, per-cue measurements, qa before/after, the render root, the full-suite log).

## Not done

- **A newer AI music model** (the second half of Bailey's recommendation 1: download to D: from official
  sources, then decide O2 or O3): not part of this brief, nothing downloaded. Still open.
- Bailey's ear on O1; the deploy and its review (this touches shared audio routing and the asset weight, so it
  needs the focused pass `critic-plan` asks for); the D-292 record in `docs/target/decisions.json` (the driver
  owns it); a Safari/iOS decode check.

## CHECK (independent, 2026-09-30, not the builder)

Run on branch music-o1 (6725a612) with a fresh production build, served on port 8520 (stopped by PID).

- Manifest diff against origin/main changes only `bytes`, `lufs`, `truePeakDb` (loop points, duration, score untouched). Every `bytes` equals the file size on disk; 26 files, 78,216,163 bytes.
- Independent ffmpeg/ffprobe pass over all 26 cues: stereo 44.1 kHz, average bitrate 218 to 283 kbps (V0 range), duration within 0.01 s of the manifest, integrated loudness -16.1 to -15.9 LUFS, true peak -1.6 to -1.3 dBTP. 0 failures.
- `qa.mjs --strict`: 0 cues with findings, 0 sfx findings, 80.93 MB of 85 MB.
- Headless Playwright on the production build: all 26 cues HTTP 200, decode to within 0.000045 s of the manifest, stereo, audible, under full scale; no console errors. This proves loading, not sound (rule 13).
- `tsc --noEmit` clean; 27 audio test files (499 tests) pass; `git merge-tree` against origin/main is clean; no src/ change, so no new orphans.
- Full suite: run 1 (builder) and two runs by the checker, each red on a different timing-sensitive test under load (`strategy-ffx2-bahamut` heal-only route; `audio-manifest-io` four concurrent writers). Both pass alone (19/19 and 9/9); neither touches this diff. Not blockers.
- Disclosed, not a blocker: the music is 78.2 MB (x1.94), above the 73 MB the recommendation quoted; Bailey should be told. Not checked: the ear (rule 13), Safari/iOS decode, the second half of recommendation 1 (newer AI music model), D-292 in decisions.json (driver's).
