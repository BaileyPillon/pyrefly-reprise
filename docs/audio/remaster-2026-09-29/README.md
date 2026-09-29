# Tinny and hollow: the cause and a remaster chain (2026-09-29)

**Game case (hard rule 14): BOTH.** Shared audio plumbing; the auditions are three FFX
Macalania sketches and two FFX cues, but the chain is game-blind. **Options only**: nothing
under `public/audio/music/`, `public/audio/manifest.json` or `src/audio/**` changed, and
nothing here ships. **No agent can hear (hard rule 13)**: everything below is measurement;
Bailey (or, for Chapter VII, the driver under D-278) picks by ear from
`docs/audio/audition.html`, section "Tinny and hollow: the fix (2026-09-29)".

**Why.** Bailey, 2026-09-28 ~22:30 EDT, after the three Chapter VII scene sketches in
Direction B: "I'm not sure, they all sound pretty good and less snes music BUT they sound
kind of tinny and hollow? Why? It almost sounds good. It's close to good. That goes for all
3 samples, a, b, and c."

## The cause, measured stage by stage

Tool: `python tools/audio/remaster-measure.py FILE...` (per file: mid-channel band shares,
L/R correlation, side/mid, mono-sum loss, per-band waveform correlation, per-band magnitude
correlation, best correlation over +-5 ms of inter-channel delay, LUFS, true peak).
Stages for sketch A: the sampled render fed to the model
(`docs/audio/sketches/2026-09-24/macalania-scene-a-frozen-temple.mp3`), the raw ACE-Step
take (`D:/Tools/pyrefly-scratch/direction-b-0927-work/raw/B-macalania-a-d35-s303.flac`,
lossless), the levelled master (`.../master/macalania-a.wav`, lossless) and the MP3 Bailey
heard.

| Stage (sketch A) | 20-80 / 80-250 / 250-800 / 800-2.5k / 2.5-6k / 6-12k / 12-16k Hz (dB share) | L/R corr | side/mid dB | mono-sum loss dB |
|---|---|---|---|---|
| render fed to the model | -15.4 / -8.4 / -5.5 / -3.0 / -13.3 / -31.7 / -48.5 | 0.09 | -0.8 | -2.6 |
| raw model take (FLAC) | -12.4 / -8.2 / -5.5 / -3.1 / -17.3 / -34.7 / -52.5 | 0.08 | -0.7 | -2.7 |
| levelled master (WAV) | -12.4 / -8.2 / -5.5 / -3.1 / -17.3 / -34.7 / -52.5 | 0.08 | -0.7 | -2.7 |
| the MP3 Bailey heard | -12.4 / -8.2 / -5.5 / -3.1 / -17.3 / -34.5 / -53.4 | 0.08 | -0.7 | -2.7 |

**1. Hollow = the two channels have unrelated phase.**

- *The model decorrelates any input.* `battle-ffx`: the shipped render fed to the model has
  L/R correlation **0.60** (side 6.0 dB under mid, mono-sum loss -1.0 dB); the raw take
  (`B-battle-ffx-d40-s101.flac`) has **0.06** (side 0.6 dB under mid, -2.7 dB).
  `boss-seymour-macalania`: 0.24 -> 0.04. `scene-gagazet`: 0.10 -> 0.01.
- *Same notes, same levels, different phase.* In the raw takes the per-band **magnitude**
  envelopes of L and R still correlate 0.4 to 0.75, while the per-band **waveform**
  correlation is 0.03 to 0.12 in every band from 20 Hz up. It is not a polarity flip (the
  correlation would be strongly negative) and not a delay (the best correlation over
  +-5 ms of offset is 0.04 to 0.08, at 0 ms). That is the signature of a decoder that
  rebuilds each channel's phase on its own (ACE-Step's audio decoder works from
  spectrogram magnitudes per channel), so L and R carry the same music with random
  relative phase. Summed to mono (a phone speaker, a laptop, a TV, anyone sitting off
  centre) about half of it cancels, bin by bin, and what remains swirls: hollow.
- *For these three sketches the render was already hollow before the model*: the sampled
  render fed to the model measures 0.05 to 0.09. The pulsed `battle-ffx` render did not
  (0.60), so this is a property of the reverberant scene mixes (the renderer's hall,
  `src/audio/dsp/hall.ts`, runs at width 0.95, a fully decorrelated tail). That is measured
  on the finished file only: the render's dry and wet stems are not kept, so the split
  between dry mix and hall was not measured tonight.
- The MP3 is not the cause: the lossless master and the MP3 agree to 0.2 dB below 12 kHz
  and to 0.001 in correlation.

**2. Tinny = the spectrum's shape, inherited from the render and tilted a little further by
the model.** The render fed to the model already piles its energy into 250 Hz to 2.5 kHz
(sketch A: -3.0 dB in 800 Hz-2.5 kHz alone) with little under 80 Hz and little above 6 kHz;
the model keeps that shape and takes another 3 to 4 dB out of 2.5 to 12 kHz (sketch A:
2.5-6 kHz -13.3 -> -17.3, 6-12 kHz -31.7 -> -34.7). There is no hard band limit in the
model (its output carries energy to 22 kHz, 55 to 60 dB down, as the render does). A
midrange-heavy spectrum with no floor and no top reads as a telephone or a small box:
tinny. The mono cancellation makes it worse, because the lows cancel with everything else
and a small speaker has no lows to begin with.

## The chain: `tools/audio/remaster.py`

Deterministic (seeded; numpy plus ffmpeg 9.0.1 from `D:/Tools/FFmpeg`, already on this
machine: no download, no new executable, no outside impulse response). Each preset includes
the one before.

| Preset | What it does |
|---|---|
| **R1 focus** | (1) *Phase repair*: per STFT bin (4096 / hop 1024) both channels take one shared phase (the phase of L plus R rotated onto L by their cross-spectrum smoothed over +-4 frames) and keep their own magnitude, so panning survives and the pair becomes coherent. (2) *Image*: the model's original side returns as ambience; below 120 Hz the side is removed (mono bass); the total side is scaled to sit 8 dB under the mid. (3) *Tone*: a zero-phase EQ moves each band's share of the mid toward a target curve (-10 / -5 / -5 / -8 / -14 / -21 / -30 / -42 dB; an engineering choice, pinkish to 800 Hz and falling faster above, not measured from any record), clamped per band: lows up to +6 dB, 250 Hz-2.5 kHz cut by at most 4 dB, 2.5-6 kHz +-3 dB, nothing above 6 kHz. (4) -16 LUFS integrated, 4x-oversampled limiter, true peak <= -1 dBTP, MP3 320 kbps 44.1 kHz stereo. |
| **R2 hall** | R1 plus a convolution hall: a stereo impulse response synthesized in the script (14 early reflections per side after 20 ms, a noise tail with per-band decay, RT60 2.4 s in the lows to 0.6 s at 16 kHz, low-cut 180 Hz, seed 29), mixed 12 dB under the dry. Loops use circular convolution over the loop body so the tail wraps with the music; the last 0.25 s of the intro hands over to the loop's own tail. The image and tone stages run after the hall, so R2 lands on the same correlation targets. |
| **R3 air** | R2 plus a harmonic exciter: the 2.2-6 kHz band through a soft saturator, and only the new harmonics above 6 kHz mixed back (at most +12 dB of mix, aiming at -26 dB for the 6-12 kHz share); the EQ may then lift 6-16 kHz by up to 4 dB. |

Loops (`boss-seymour-macalania` 336000 to 5376000 samples, `scene-gagazet` 1764000 to
4557000, the candidate manifest's points) stay sample-exact: every output has exactly the
source's sample count, the processed audio is aligned to the source at 0 samples (checked by
cross-correlation), the last beat before loopEnd (0.476 s at 126 bpm, 0.833 s at 72 bpm)
fades into the processed audio just before loopStart, and the run-on after loopEnd is an
exact copy of the processed loop head, as the Direction B render did. One-shots keep their
length; their last second gets a cosine fade so the added hall cannot run past the ending
(the sources are 60 to 85 dB down there already).

Re-run from the repo root (the sources are the lossless Direction B masters, outside the repo):

```
python tools/audio/remaster.py --batch docs/audio/remaster-2026-09-29/jobs.json --json docs/audio/remaster-2026-09-29/remaster-report.json
python tools/audio/remaster-measure.py <original> <R1> <R2> <R3> ... --group 4 --json docs/audio/remaster-2026-09-29/measurements.json --spectro docs/audio/remaster-2026-09-29/spectro
```

## Before and after

Bands are the mid channel's share of energy per band, dB, 20-80 / 80-250 / 250-800 /
800-2.5k / 2.5-6k / 6-12k / 12-16k Hz. Mono loss = mono-sum power against the mean channel
power (0 = identical channels, -3 = uncorrelated). Seam = spectral flux across the loop wrap
against the first entry into the loop (1.0 = the join is no busier than the music). Each
original is the MP3 Bailey heard; spectrograms are 2 s from the original's loudest 2 s, the
same window for its three variants.

| File | Bands (dB) | L/R corr | side/mid dB | mono loss dB | LUFS / dBTP | crest dB | seam | spectrogram |
|---|---|---|---|---|---|---|---|---|
| macalania-scene-a-frozen-temple-B | -12.4 / -8.2 / -5.5 / -3.1 / -17.3 / -34.5 / -53.4 | 0.08 | -0.7 | -2.7 | -15.7 / -1.2 | 18.0 | - | [jpg](spectro/macalania-scene-a-frozen-temple-B.jpg) |
| macalania-a-R1-focus | -9.7 / -5.4 / -5.5 / -5.3 / -15.6 / -33.9 / -52.3 | 0.74 | -8.3 | -0.6 | -16.0 / -1.5 | 17.4 | - | [jpg](spectro/macalania-a-R1-focus.jpg) |
| macalania-a-R2-hall | -9.6 / -5.4 / -5.4 / -5.4 / -15.6 / -33.9 / -52.4 | 0.74 | -8.3 | -0.6 | -16.0 / -1.5 | 17.5 | - | [jpg](spectro/macalania-a-R2-hall.jpg) |
| macalania-a-R3-air | -9.6 / -5.5 / -5.5 / -5.4 / -15.5 / -24.7 / -36.7 | 0.74 | -8.3 | -0.6 | -16.0 / -1.5 | 17.5 | - | [jpg](spectro/macalania-a-R3-air.jpg) |
| macalania-scene-b-wedding-proposal-B | -11.2 / -12.1 / -2.2 / -6.2 / -18.4 / -36.6 / -50.6 | 0.07 | -0.6 | -2.7 | -15.8 / -1.4 | 17.1 | - | [jpg](spectro/macalania-scene-b-wedding-proposal-B.jpg) |
| macalania-b-R1-focus | -8.4 / -7.5 / -3.3 / -7.4 / -16.3 / -36.0 / -50.3 | 0.78 | -8.7 | -0.6 | -16.0 / -1.5 | 17.0 | - | [jpg](spectro/macalania-b-R1-focus.jpg) |
| macalania-b-R2-hall | -8.4 / -7.5 / -3.3 / -7.4 / -16.3 / -36.0 / -50.4 | 0.79 | -8.7 | -0.5 | -16.0 / -1.5 | 17.0 | - | [jpg](spectro/macalania-b-R2-hall.jpg) |
| macalania-b-R3-air | -8.4 / -7.5 / -3.3 / -7.4 / -16.3 / -25.8 / -38.4 | 0.78 | -8.7 | -0.6 | -16.0 / -1.4 | 17.1 | - | [jpg](spectro/macalania-b-R3-air.jpg) |
| macalania-scene-c-crystal-and-pyreflies-B | -21.7 / -12.7 / -2.1 / -5.1 / -17.0 / -37.6 / -55.3 | 0.05 | -0.4 | -2.8 | -15.8 / -1.7 | 17.4 | - | [jpg](spectro/macalania-scene-c-crystal-and-pyreflies-B.jpg) |
| macalania-c-R1-focus | -15.1 / -7.3 / -2.9 / -6.4 / -14.6 / -36.5 / -53.0 | 0.75 | -8.1 | -0.6 | -16.0 / -3.3 | 16.0 | - | [jpg](spectro/macalania-c-R1-focus.jpg) |
| macalania-c-R2-hall | -15.4 / -7.4 / -2.8 / -6.4 / -14.7 / -36.6 / -53.1 | 0.75 | -8.1 | -0.6 | -16.0 / -3.1 | 16.0 | - | [jpg](spectro/macalania-c-R2-hall.jpg) |
| macalania-c-R3-air | -15.4 / -7.4 / -2.8 / -6.4 / -14.6 / -24.1 / -35.9 | 0.75 | -8.0 | -0.6 | -16.0 / -3.2 | 16.0 | - | [jpg](spectro/macalania-c-R3-air.jpg) |
| boss-seymour-macalania | -8.6 / -6.4 / -3.9 / -7.0 / -17.7 / -28.2 / -43.0 | 0.04 | -0.3 | -2.9 | -15.9 / -1.2 | 16.8 | 1.25 | [jpg](spectro/boss-seymour-macalania.jpg) |
| boss-seymour-macalania-R1-focus | -9.1 / -5.2 / -4.4 / -7.3 / -15.5 / -27.6 / -43.1 | 0.78 | -8.2 | -0.6 | -16.0 / -1.5 | 16.9 | 0.95 | [jpg](spectro/boss-seymour-macalania-R1-focus.jpg) |
| boss-seymour-macalania-R2-hall | -9.1 / -5.2 / -4.4 / -7.3 / -15.5 / -27.8 / -43.2 | 0.79 | -8.3 | -0.6 | -16.0 / -1.4 | 16.9 | 0.99 | [jpg](spectro/boss-seymour-macalania-R2-hall.jpg) |
| boss-seymour-macalania-R3-air | -9.2 / -5.3 / -4.4 / -7.3 / -15.4 / -22.2 / -33.0 | 0.78 | -8.2 | -0.6 | -16.0 / -1.4 | 17.0 | 0.97 | [jpg](spectro/boss-seymour-macalania-R3-air.jpg) |
| scene-gagazet | -5.4 / -4.1 / -5.5 / -14.0 / -26.7 / -40.0 / -51.8 | 0.01 | -0.1 | -3.0 | -16.1 / -1.1 | 16.2 | 1.0 | [jpg](spectro/scene-gagazet.jpg) |
| scene-gagazet-R1-focus | -7.1 / -4.3 / -4.5 / -11.3 / -23.2 / -38.9 / -50.7 | 0.73 | -7.3 | -0.7 | -16.0 / -1.5 | 16.5 | 1.0 | [jpg](spectro/scene-gagazet-R1-focus.jpg) |
| scene-gagazet-R2-hall | -7.4 / -4.4 / -4.3 / -11.1 / -23.1 / -39.0 / -50.9 | 0.74 | -7.4 | -0.7 | -16.0 / -1.4 | 16.5 | 1.0 | [jpg](spectro/scene-gagazet-R2-hall.jpg) |
| scene-gagazet-R3-air | -7.4 / -4.4 / -4.3 / -11.1 / -23.0 / -32.5 / -43.3 | 0.74 | -7.4 | -0.7 | -16.0 / -1.4 | 16.5 | 1.0 | [jpg](spectro/scene-gagazet-R3-air.jpg) |

Short form: L/R correlation **0.01-0.08 -> 0.73-0.79**, side **0.1-0.7 dB -> 7.3-8.7 dB under
the mid**, mono-sum loss **-2.7 to -3.0 dB -> -0.5 to -0.7 dB**. On the three sketches the
20-80 Hz share rises 2.7 to 6.6 dB and 80-250 Hz 2.8 to 5.4 dB, and the 250 Hz-2.5 kHz peak
comes down (A: 800-2.5k -3.1 -> -5.3; B: 250-800 -2.2 -> -3.3; C: 250-800 -2.1 -> -2.9,
800-2.5k -5.1 -> -6.4). R3 lifts 6-12 kHz by 6.0 to 13.5 dB against the original. Every file is -16.0 LUFS and at or
under -1.4 dBTP; loop seams 0.95 to 1.05 against the originals' 1.0 and 1.25.

**Notes and timing kept** (`tools/audio/ace-measure.py`, each variant against its lossless
master, both summed to mono): chroma similarity 0.995 to 0.999 on all 15, timing lag 0 ms on
all 15; onset F 0.70 to 0.93 for R1 and R2, 0.60 to 0.77 for R3 (the exciter adds high-band
onsets; part of every onset difference is the original's own mono cancellation going away).

## What is not done, and what an ear must decide

- **Which letter** for Chapter VII (A, B or C) and **which remaster** (R1, R2, R3 or none)
  for the whole pack. D-278: Bailey delegated the Chapter VII pick to the driver once these
  exist; that pick is disclosed as the driver's, made without hearing.
- **Not measurable here**: whether the phase repair leaves audible artefacts (a swirl or a
  softened attack on some notes), whether R2's hall is too much on the scene cues (the
  render already carries a hall), whether R3's added top sounds like air or like fizz.
- **Sketch C's floor** stays the thinnest (20-80 Hz -21.7 -> -15.1 dB with the +6 dB cap).
  A sub-harmonic generator would add pitches an octave under the written bass, an
  arrangement change, so it was not added.
- **At the source**: a render with a less decorrelated hall, and a model decode that shares
  phase between the channels (or a mono decode plus a real stereo image), would remove the
  need for R1's repair. Not tried tonight.
- Applying a picked preset to all 25 cues is one batch run (about 7 s per cue); the loop
  points come from `public/audio/candidates/direction-b-2026-09-27/manifest.json` and the bpm
  (for the seam crossfade) from `tools/audio/modern/b-score-cues.mjs`.

## Files

| Path | What |
|---|---|
| `tools/audio/remaster.py` | the chain (presets focus / hall / air) |
| `tools/audio/remaster-measure.py` | the measurements and spectrograms |
| `docs/audio/remaster-2026-09-29/*.mp3` | 15 auditions (5 clips x R1, R2, R3), MP3 320 kbps, 49 MB |
| `docs/audio/remaster-2026-09-29/jobs.json` | the batch: sources, presets, loop points, seam crossfades |
| `docs/audio/remaster-2026-09-29/remaster-report.json` | per render: side gain, EQ per band, exciter mix, gain, limiter ceiling, LUFS, true peak, seam |
| `docs/audio/remaster-2026-09-29/measurements.json` | the table above, with per-band correlations |
| `docs/audio/remaster-2026-09-29/spectro/*.jpg` | 20 spectrograms (5 originals, 15 variants) |
| `docs/audio/remaster-2026-09-29/audition-section.jpg` | the new audition section at 1000 px (headless check: all 135 players on the page resolve, the 20 in this section decode at their full lengths, no console error, no horizontal scroll at 1000 or 375 px, the Collect button fills its box) |
