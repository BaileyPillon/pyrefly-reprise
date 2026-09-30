# fb-0929 music: "Music quality sounds kinda bad" (diagnosis + options)

**Game case (AGENTS.md rule 14): BOTH.** The music chain is shared plumbing. The auditions
cover one FFX cue (`boss-seymour`, Chapter I, Seymour Flux) and one FFX-2 cue (`boss-ffx2-aeon`,
Chapter IV, Bahamut; it also plays in Chapters VI, XI and XIII).
**Options only (rules 9, 10, 13):** nothing under `public/audio/music/`, `public/audio/manifest.json`
or `src/` changed. No agent can hear, so everything below is measurement. Bailey picks by ear in
`docs/audio/audition.html`, in the section at the top called "Music quality options (29 Sep)".

## The feedback

Bailey, 2026-09-29 ~19:00 EDT, passing on a friend's feedback: "My friend gave me this feedback
and I concur ... -Music quality sounds kinda bad." Earlier, on 2026-09-28, Bailey said of Direction B:
"they sound kind of tinny and hollow". Release 31a (52a431d0) ships the whole score as Direction B
through remaster R1 (D-283).

## What was measured, and how

- **Tool:** `tools/audio/quality-measure.py`, new. It builds on `remaster-measure.py`'s bands,
  stereo, LUFS, LRA and crest, and adds: top edge; a lowpass "cliff"; 4-10 kHz spectral flatness
  (how noise-like the top is); 2-8 kHz attack rise time; PLR. With `--pair` it also measures the
  coding error against a lossless twin, per band, plus the pre-echo before the 40 strongest attacks.
- **Lossless twin of what ships:** `tools/audio/r1-encode.py`, new. It re-runs the exact
  `remaster-ship.py` chain with the final encode swapped. With `--encode q5` it reproduces the
  shipped `boss-seymour.mp3` and `boss-ffx2-aeon.mp3` **byte for byte**, so the `wav` twin is exactly
  what the MP3 encoder was given.
- **Codec floor of the AI:** `tools/audio/quality-ace-probe.mjs --mode=roundtrip`, new. It runs
  ACE-Step v1 `VAEEncodeAudio -> VAEDecodeAudio` with no sampling, on 45 s excerpts of the sampled
  render.
- **In the browser:** `AudioManager` sends music through gain nodes and then a master limiter
  (threshold -2 dBFS). At the default volumes (music 0.7 x master 0.8), the music peaks at about
  -6.4 dBFS, so the limiter never touches music alone. The game plays the MP3 as decoded
  (`docs/audio/soundtrack-r1-2026-09-29-browser.json` is the earlier browser decode proof).
- **References (measured only, not in the repo):** two public-domain Musopen Symphony FLACs from
  Wikimedia Commons (Beethoven, Egmont Overture; Tchaikovsky 6/III). They are recorded in
  `D:/Tools/downloads.md` with their SHA-1, which matches Commons. The Tchaikovsky file is itself
  band-limited above about 11 kHz, so it serves only as a width and dynamics reference.
- All numbers are in `docs/audio/candidates/fb-0929/measurements.json`: stages, roundtrip, tag
  probes, references, and all 26 shipped cues.

## The cause, stage by stage (full cues)

| boss-seymour | 2.5-6k / 6-12k share dB | L/R corr | 4-10k flatness dB | rise ms | lowpass cliff |
|---|---|---|---|---|---|
| sampled render fed to the AI | -16.7 / -35.9 | 0.62 | -12.0 | 5.0 | (its old q5 MP3) |
| raw ACE-Step take (s202) | -20.8 / -37.8 | 0.03 | -7.4 | 9.5 | none |
| Direction B master | -20.0 / -36.2 | 0.08 | -7.0 | 11.5 | none |
| R1, lossless twin | -17.6 / -35.3 | 0.78 | -8.0 | 15.0 | none |
| **shipped MP3 (q5, ~125 kbps)** | -17.6 / -34.9 | 0.77 | -8.2 | 13.5 | **43.8 dB at 16.6 kHz** |
| Egmont (Musopen, reference) | -15.2 / -30.2 | 0.75 | -11.8 | 33 (a hall) | none |

`boss-ffx2-aeon`, in the same order: flatness -16.8 -> -6.6 -> -6.8 -> -7.6 -> -7.7; rise 4.0 ->
11.5 -> 12.5 -> 16.0 -> 18.0 ms; L/R correlation 0.58 -> 0.04 -> 0.04 -> 0.70 -> 0.70; cliff 41.2 dB
at 16.6 kHz.

1. **Generator: the ACE-Step v1 audio codec. This is the largest fault.**
   - The top becomes noise-like: 4-10 kHz flatness rises 4.6 dB on Seymour and 10.2 dB on the aeon
     cue.
   - Attacks are about twice as slow: 4-5 ms become 9.5-11.5 ms.
   - Left and right lose their phase relation, which is the "hollow" measured on 09-29.
   - 2.5-6 kHz is 3-4 dB duller.
   - **This comes from the codec, not from the settings.** The pure encode+decode roundtrip, with
     no generation, already gives correlation 0.60 -> 0.04 and 0.55 -> 0.07, and flatness -12.5 ->
     -9.6 and -17.5 -> -13.0.
   - Adding "pristine high fidelity, crisp bright highs, sharp clear transients" to the words moved
     the bands by under 1 dB and flatness by 0.1-0.2 dB.
   - Denoise 0.30 or 0.35 instead of 0.40 does not bring the take closer to the score's timing:
     onset-envelope agreement with the render stays at 0.12-0.25, against 0.10-0.26 at 0.40.
2. **Remaster R1.** It fixed the stereo (correlation 0.73-0.84 on all 26 cues, close to the
   reference's 0.70-0.75), and mono loss is now -0.6 dB. Two costs remain:
   - Its 4096-sample phase repair slows attacks a further 3.5-5.5 ms (to 15-16 ms).
   - By design (`LIMITS_BASE`) it never lifts anything above 6 kHz.
3. **Encode (libmp3lame -q:a 5, 110-155 kbps).**
   - Every shipped cue has a brick-wall lowpass at 16.6-17.3 kHz, 26-48 dB deep (median 41).
   - Coding noise sits close under the music: 2.5-6k -13.8/-14.5 dB, 6-12k -7.5/-8.7 dB, 12-16k
     -3.1/-3.7 dB. That is a fizz on the already-weak top.
   - Pre-echo is -11.4 / -10.6 dB.
   - V0 gives: 6-12k -17.2/-17.7 dB, pre-echo -20.5/-19.7 dB, no wall. 320 kbps gives: -21.2/-22.5,
     pre-echo -28.5/-26.2.
   - The encode is a real but secondary part of the problem. It is the only part that is cheap to fix.
4. **Not a fault of any stage: dynamics.** LRA is 3.2-17.1 LU across the score (median 7.7),
   against 18.6-20.9 for the concert recordings. Crest is 15.5-18.4 dB against 18.8-23.0. That low
   range was already in the render (LRA 4.2-5.3) and is the loud battle-loop writing. PLR is 14.5 dB,
   so the limiter is not squashing anything.

## The options (sketches: 45 s, loop start, -16 LUFS, true peak <= -1 dBTP)

Sketch files are in `docs/audio/candidates/fb-0929/`. Their `manifest.json` lists each file's
LUFS, peak and measures.

| | Seymour: flatness / rise / corr | Aeon: flatness / rise / corr | Fixes | Whole 26-cue score |
|---|---|---|---|---|
| 0 today (q5) | -8.8 / 15.0 / 0.76 | -7.1 / 22.0 / 0.73 | - | - |
| **O1** same R1 master, MP3 V0 | -8.7 / 12.5 / 0.76 | -7.1 / 20.0 / 0.73 | stage 3: no wall, coding noise about 10 dB lower | ~7 min CPU (`r1-encode.py` ~15 s per cue), ~1 h agent; music grows 39 MB -> ~73 MB (x1.87 measured). Opus 160 would be ~49 MB, but needs a Safari/iOS decode check and an MP3 fallback |
| **O2** "AI body, real top" (`tools/audio/quality-rebuild.py`), V0 | -12.7 / 9.5 / 0.73 | -15.8 / 12.5 / 0.60 | stages 1-3 above 4 kHz | no GPU; ~half a day of agent work to fold it into the ship chain's loop, run-on and seam repair; ~1 min CPU per cue plus a lossless re-render (`render.mjs --wav`, ~15 s per cue); an ear check per cue for doubled hits |
| **O3** "real samples, no AI" (Direction A, `render-a.mjs`, VSCO 2 CE via sfizz), V0 | -9.8 / 3.0 / 0.53 | -13.6 / 4.0 / 0.63 | none of the AI's faults | ~1 day of agent work: 25 instruments have no seat yet (choir, bell, harp, pad, shaker, synth bass...; the choir has no CC0 sample); ~1 min CPU per cue; it drops the Direction B sound picked on 27 Sep |

How O2 is built:
- It uses the Direction B master below 4 kHz, as a coherent mid: a magnitude average of L and R with
  L's phase, from a 1024-point STFT.
- Above 4 kHz it uses the losslessly re-rendered sampled render. That render matches the one fed to
  the AI (SNR 27-28 dB against its old MP3, lag 0).
- The render is first moved onto the take's own timing by `local_warp` (3 s windows, +-80 ms). The
  measured warp was -50..+10 ms on Seymour and -10..+10 ms on the aeon cue.
- The render's side forms the stereo image.
- **Risk:** the Seymour take follows the score loosely. Its onset F was 0.47 in the Direction B
  report, and 5 s window lags stay within +-30 ms after the warp at correlation 0.10-0.27. Hits may
  sound doubled there. The aeon cue is tighter.

O3: `boss-ffx2-aeon` reuses the 2026-09-22 Direction A float WAV. `boss-seymour` was rendered today
after adding an `organ` seat (VSCO OrganLoud) to `tools/audio/modern/seating-map.mjs`. That is the
only change to an existing tool; its report in `docs/audio/sketch-a-report.json` was put back
unchanged. Bailey heard Direction A on 26 Sep and did not pick it ("7 is the only one that sounds
good to me"). It is re-offered only because it has none of the AI's measured faults.

**Not tried:**
- A stronger model. Only `ace_step_v1_3.5b` is on disk. ComfyUI ships an "ACE-Step 1.5" and a
  "Stable Audio 3" blueprint, but their weights are not downloaded. This brief allowed only models
  already on disk; see questions.
- A mono decode plus synthetic stereo.
- R2 or R3 on the whole score.

## Evidence

- Stage and codec numbers: `docs/audio/candidates/fb-0929/measurements.json`.
- Sketch numbers: `docs/audio/candidates/fb-0929/manifest.json`.
- The listening page: `docs/audio/audition.html`, section "Music quality options (29 Sep)". Headless
  Chromium from a node script (in-process server on 8201, stopped): the 8 players decode at 45 s, no
  console error, no horizontal scroll at 1000 or 375 px, and the Collect button works. Screenshots:
  `docs/screenshots/fb-0929/music/audition-section-{1000,375}.jpg`.
- Test: `tests/unit/audio-fb0929-music-options.test.ts`. It pins the package: every player resolves
  to a listed file, both cues carry 0/O1/O2/O3, all at -16 LUFS within 0.3 and <= -1 dBTP, and the
  game manifest still routes both cues to `public/audio/music`. There is no defect-fix test because
  no game code changed.
- Scratch, outside the repo: `D:/Tools/pyrefly-scratch/fb-0929/music/`. It holds the R1 twins and
  encodes, the probes, the lossless renders, and the O2 and O3 WAVs.

## Re-run

```
python tools/audio/r1-encode.py --cue boss-seymour --encode wav --out <scratch>/boss-seymour-wav.wav
python tools/audio/quality-measure.py <files> [--pair TEST=LOSSLESS] --json out.json
node tools/audio/quality-ace-probe.mjs --in=<45 s wav> --out=<dir> --stem=x --mode=roundtrip
npm run audio:render -- --only=boss-seymour --wav --out=<scratch>/render-lossless
python tools/audio/quality-rebuild.py --take <direction-b master> --render <lossless render> --out o2.wav --window 7.272721 45 --fade --min-corr 0.05
python tools/audio/quality-sketch.py --in <wav> --window START 45 --encode v0 --out sketch.mp3
```

## Not done

- **Bailey's ear:** which option, if any; whether O2 doubles hits; whether O1 is audible at all.
- **Nothing ships.** Whichever option is picked still needs its ship path built, `qa.mjs`, and a
  focused review, because this touches shared audio routing.
- `boss-vegnagun` and `scene-bevelle-underground` still ship the old sampled render at q5. They were
  outside R1 (the stereo gate), so only O1 or O3 would touch them.
