# Handoff: music, modern sound — Sketch A (the renderer upgrade)

**Date:** 2026-09-22. **Game case (hard rule 14): BOTH.** Offline renderer plumbing that plays
FFX cues (`battle-ffx`, chapters 1 to 3) and FFX-2 cues (`boss-ffx2-aeon`, chapter 4) through
one path; the plan's absence test holds (see `docs/plans/music-modern-sound.md` header). No
note of any score changed, and nothing in the shipped cue routing changed:
`public/audio/manifest.json` and `public/audio/music/` are untouched, and no file in
`src/audio/**` was edited.

**Status: built and measured, awaiting Bailey's ear.** Agents cannot hear (hard rule 13):
everything below is measurement. Bailey listens at `docs/audio/audition.html`, section
"Modern sound: sketch A" (blind X/Y pairs, the key is behind a fold).

## What was built (`tools/audio/modern/`, all new, each file under 400 lines)

| File | Job |
|---|---|
| `render-a.mjs` | The CLI. `node tools/audio/modern/render-a.mjs [--only=cue,cue]`. Default: `battle-ffx,boss-ffx2-aeon`. |
| `render-felt.mjs` | The felt-piano audition (title's piano parts, concert vs felt, same performance). |
| `sfizz.mjs` | Drives `D:/Tools/sfizz/bin/Release/sfizz_render.exe` (unzipped from the approved zip; not a download). |
| `midi.mjs` | SMF writer: seconds in, 0.5 ms ticks, notes + CC1 + CC11. |
| `sfz.mjs` | SFZ parser, velocity-layer / round-robin counter, wrapper-SFZ writer (CC1 crossfade, legato regions, range stretch, detune, headroom). |
| `vcsl-kit.mjs` | SFZ built from VCSL WAV names for the hi-hat and toms (VCSL ships no SFZ). |
| `seating-map.mjs` | Score instrument name -> VSCO/VCSL desks + seats. |
| `perform.mjs` | The performance model (plan A3). |
| `stems.mjs` | Channel -> desks -> lanes -> sfizz stems, with per-channel level calibration. |
| `hall-ir.mjs` | Synthesised hall IR + FFT convolution + RT60 estimate. |
| `loudness.mjs` | ffmpeg `ebur128` + `astats` (LRA, crest), Ogg encode. |
| `proof.mjs` | The repeat-hash proof. |
| `felt-piano.mjs` | `felt-piano` voice from Salamander. |

Generated wrapper SFZs and MIDI go to `build/audio-sfz/` (gitignored); float WAVs to
`build/audio-candidates/` (gitignored: `public/audio/candidates/` is NOT gitignored, so no
WAV was put there).

### How SFZ gets in (plan A4)

Route (ii), sfizz as an external step, because the brief asked for sfizz and it works here:
the sfizz 1.2.3 Windows build has no C headers and Node has no FFI without an npm install, so
the C API was not an option. The CLI takes a MIDI file, and MIDI carries everything the
performance model needs (velocity, CC1, CC11, held-note overlap for `trigger=legato`). CCs
are per channel, so polyphonic parts are split into **monophonic lanes**, each rendered on its
own with its own curves. **Proof it renders:** one A4 on `ViolinEnsSusVib.sfz`: 129 024 frames,
peak -26.8 dBFS in 0.08 s; CC11=40 gave -19.8 dB against CC11=127 (sfizz's default expression
law), CC1 alone changed nothing until the wrapper mapped it. sfizz is deterministic: the same
SFZ + MIDI twice gave the same sha256; three renders of `battle-ffx` from the final code gave
the same WAV (sha256 `599198db74299b25...`).

## Measurements (all in `docs/audio/sketch-a-report.json`)

### Velocity layers and round robins per patch (evidence for causes 1.2 and 1.5)

Counted from the SFZ regions per key (default articulation; drums at their GM key).
Sonatina, which these replace, has essentially one layer and no round robins (plan 1.1).

| Instrument | Patch | Velocity layers (min-max, median) | Round robins |
|---|---|---|---|
| strings | ViolinEnsSusVib | 2-2, 2 | 1 |
| strings | ViolaEnsSusVib | 2-2, 2 | 1 |
| strings / strings-low | CelloEnsSusVib | 2-3, 2 | 1 |
| strings-low | ContrabassSusVB | 2-2, 2 | 1 |
| strings-short | ViolinEnsSpic | 2-2, 2 | 2 |
| strings-short | ViolinEnsPizz | 2-2, 2 | 2 |
| strings-short | ViolaEnsSpic | 2-2, 2 | 2 |
| brass | FHornSus (two desks) | 1-4, 3 | 1 |
| brass | TromboneSus | 2-3, 3 | 1 |
| brass-stab | TrumpetStac / TrumpetSus (held) | 3-3, 3 / 2-2, 2 | 2 / 1 |
| brass-stab | TromboneStac | 4-7, 4 | 2 |
| flute | FluteSusVib | 1-2, 1 | 1 |
| timpani | Timpani | 2-3, 3 | 2 |
| kick | GM-StylePerc @36 (BDrumNewhit) | 7 | 2 |
| snare | GM-StylePerc @38 | 3-5, 5 | 2 |
| crash | GM-StylePerc @49 | 1-4, 4 | 2 |
| hat | VCSL hi-hat @42 | 4 (open hat 1) | 2 |
| tom | VCSL toms | 3 | 2 |
| felt piano | Salamander (SF2) | 16 at keys 48/60/72; felt reaches the bottom 7 (MIDI vel 8-53) | - |

Honest reading: cause 1.2 is fixed where a patch has 2+ layers, and on sustains the layers
**crossfade on CC1** inside the note (measured on one A4 with CC1 ramped 0 to 127: the
high-frequency share rose from -18.5 to -14.5 dB while velocity-switching stayed at -15.4 to
-14.5). VSCO strings are only p/f (2 layers); the flute is mostly one layer, so the flute
barely gains here. Cause 1.5 is fixed for shorts and percussion (2 takes); VSCO sustains
have no alternate takes, so their repeats differ by timing, velocity and CC, not by sample.

### Repeat-hash proof (cause 1.6)

Bars whose written notes are identical, with the two bars before them identical too, hashed
over the channel's dry audio. OLD = the shipped `renderTrack` path; NEW = Sketch A.

| Cue / channel | Bars | OLD hashes | NEW hashes | NEW difference |
|---|---|---|---|---|
| battle-ffx kick | 8, 12 | da683c0ed380ff27 = da683c0ed380ff27 | d6a091f05f41f279 / 263f268e649a5d31 | +3.4 dB |
| battle-ffx snare | 11, 12 | 651368820e4cd12c = 651368820e4cd12c | 8a955a0df4b654eb / d40eab3186dbea12 | +4.5 dB |
| battle-ffx hats | 8, 9 | 90380864c7d812b3 = 90380864c7d812b3 | fbb26d62eab7ca9a / 2a61ad5cd2e0d01e | +3.1 dB |
| battle-ffx brass stabs | 31, 36 | 046d9821671027fe = 046d9821671027fe | 4d47466d5a10daf5 / 92360719781d47cc | +3.1 dB |
| boss-ffx2-aeon supersaw (SF2 voice) | 14, 19 | 23f2a654f7d671d7 = 23f2a654f7d671d7 | f6211c045e6f049b / 44407dd9e7f6d204 | +5.1 dB |

The old path is bit-identical (difference -inf), the diagnosis confirmed by running it. The new
difference is the energy of (bar1 - bar2) against bar1: about +3 dB means the two bars are as
different as two separate takes.

### Performance (onset deviation from the grid, ms; distinct velocities written -> played)

battle-ffx, from the report: strings lead sd 7.1 (mean 0), 25 -> 52 velocities, 110 of 122
notes slurred; horns desk 1 mean +10.5 / desk 2 +15.1 (the section sits behind the beat), 57 of
63 slurred; cellos +5.8, basses +9.5; kit sd 2.4-2.5; brass stabs 6 -> 40 velocities. Every
channel's numbers are in `cues[].channels[].desks[].performance`.

### Delivered dynamics (cause 1.10), ffmpeg `ebur128` + `astats`, whole cue

| Cue | File | LUFS | LRA (LU) | True peak | Crest (dB) |
|---|---|---|---|---|---|
| battle-ffx | shipped MP3 | -15.9 | 4.6 | -1.8 | 16.21 |
| battle-ffx | Sketch A mix through the SHIPPED master | -15.9 | 3.9 | -1.4 | 16.41 |
| battle-ffx | **Sketch A** | -15.9 | **6.5** | -1.4 | **16.45** |
| boss-ffx2-aeon | shipped MP3 | -15.9 | 4.2 | -1.4 | 16.49 |
| boss-ffx2-aeon | Sketch A mix through the SHIPPED master | -15.9 | 4.8 | -1.4 | 16.78 |
| boss-ffx2-aeon | **Sketch A** | -15.9 | **7.7** | -1.2 | **17.06** |

Reading: the loudness range widens by 1.9 and 3.5 LU, and most of that is the master (the bus
compressor moved from -18 dB 2:1 to -10 dB 1.5:1; loudness target and ceiling unchanged). Crest
factor hardly moves (+0.2, +0.6 dB): at -16 LUFS integrated with a -1 dBTP ceiling there is no
more headroom to give; only a lower target for quiet cues (plan A3.7) would widen it.
All shipped gates pass on both candidates: LUFS -16.02 / -16.04, true peak -1.40 / -1.33,
loop seam ok, spectral balance ok. 0 clipped samples across 80 sfizz stems.

### Hall

Synthesised IR: pre-delay 20 ms, 16 early-reflection taps 20-115 ms, tail RT60 2.2 s mid /
2.6 s low / 1.3 s high; measured broadband T20 = 2.09 s. Energy matched to the shipped FDN
hall, so the wet/dry balance is unchanged. **A real concert-hall IR needs Bailey's yes**
(downloads rule); swapping one in is one function (`synthHallIr` -> a WAV reader).

### Felt piano

`title`'s three piano parts, same performance, loudness-matched to -20 LUFS: energy above
2 kHz -15.1 dB (felt) against -12.4 dB (concert); LRA 3.4 vs 4.8; the felt voice reaches the
bottom 7 of Salamander's 16 layers.

### Render time

battle-ffx 30.7 s (40 sfizz stems), boss-ffx2-aeon 51.8 s, full run with encoding and
measurement 2 min 12 s on this machine.

## Files for the audition (committed, 5.8 MB)

`public/audio/candidates/`: `A-battle-ffx.ogg` (1:20), `A-boss-ffx2-aeon.ogg` (1:57),
`A-<cue>-excerpt.ogg` (12 s: battle-ffx from beat 48, the hook with brass and the V-i;
boss-ffx2-aeon from beat 96, the chorus), `control-<cue>-excerpt.ogg` (the same 12 s of the
shipped MP3, loudness-matched), `A-felt-piano-title-excerpt.ogg`,
`A-concert-piano-title-excerpt.ogg`. Spectrograms of each pair: `docs/audio/sketch-a/`.
Ogg Vorbis q6: Chrome/Firefox/Edge play it; Safari before 17 does not.

## Not done, and why

- **Electric bass, sub, Rhodes, supersaw, celesta stay on the shipped FluidR3/SF2 voices**
  (performed by the new model, seeded per occurrence): neither VSCO 2 CE nor VCSL has them.
  They are load-bearing in `boss-ffx2-aeon` (724 Rhodes notes, 312 bass notes), so the FFX-2
  cue changes less than the FFX one. That is a library gap, not a code gap.
- **No recorded legato**: no CC0 library on disk has legato transitions. Legato is simulated
  through sfizz `trigger=legato` regions (offset 0.2 s into the sample, 30 ms fade-in, 120 ms
  fade-out of the old note, measured: ~2 dB dip at the join against 10 dB with the first
  settings). No pitch glide (sfizz 1.2.3 has no portamento opcode; not attempted).
- **Choir** is not in either audition cue and was not touched (plan 1.9 still open).
- **Levels are calibrated, not mixed**: each channel is scaled so a reference note matches the
  shipped voice's energy (e.g. timpani +19.7 dB, strings low +16.4 dB: VSCO is recorded quiet).
  A reference-note match can misjudge a part whose range or articulation varies a lot.
- No change to `src/audio/**` or to the shipped cues; no unit tests were added (`tests/` is
  outside this track's owned paths). `tsc` does not cover `tools/`.
- ACE-Step (option B) belongs to another workflow; nothing here touched ComfyUI.

## Next, if Bailey picks A

Extend the seating map to all 21 cues (choir, organ, harp, keys), move the renderer into the
shipping path behind a flag, lower the quiet cues' loudness target, and ask Bailey about a real
hall IR. Every cue's bytes and every `artifact-manifest` hash will move at once (plan A5).

---

# Sketch B — ACE-Step through ComfyUI (the model restyle)

**Date:** 2026-09-22. **Game case (hard rule 14): BOTH.** One client renders the FFX cue
(`battle-ffx`, chapters 1 to 3) and the FFX-2 cue (`boss-ffx2-aeon`, chapter 4). The only
per-game difference is the style tags, taken from THEMES.md "Harmonic language, by world":
FFX gets a symphony orchestra with taiko; FFX-2 gets orchestra plus electric bass, drum kit
and electric piano. Nothing routed into the game; `public/audio/manifest.json`,
`public/audio/music/` and `src/audio/**` untouched.

**Status: built and measured, awaiting Bailey's ear.** Section "Modern sound: sketch B" in
`docs/audio/audition.html` (blind X/Y pairs against today's cue, the key behind a fold).

## What was built

| File | Job |
|---|---|
| `tools/audio/ace-step.mjs` | ComfyUI client (the `tools/gen/comfy.mjs` pattern). `--mode=restyle` (shipped MP3 in, `--denoise`), `t2m` (tags only, cue length), `source` (12 s excerpt of today's cue), `remeasure` (no GPU). Waits for an empty queue before each job. |
| `tools/audio/ace-measure.py` | numpy-only measurements, run with the ComfyUI embedded python (no librosa on this machine; nothing installed). |

The graph (input names read from the live `/object_info`, ComfyUI 0.35.0):
`CheckpointLoaderSimple(ace_step_v1_3.5b)` -> `TextEncodeAceStepAudio(tags, lyrics "[inst]")`
(+ `ConditioningZeroOut` as negative) -> `ModelSamplingSD3(shift 5)` ->
`LatentApplyOperationCFG(LatentOperationTonemapReinhard 1.0)` -> `KSampler(euler, simple,
50 steps, cfg 5, denoise)` on `VAEEncodeAudio(LoadAudio(shipped cue))` or on
`EmptyAceStepLatentAudio(cue seconds)` -> `VAEDecodeAudio` -> `SaveAudio`. Then ffmpeg trims
to the cue length, gains to -16 LUFS, limits, encodes Opus 112k. Not used: a repaint path
(`SetLatentNoiseMask` exists in core, but the brief asked for a restyle by denoise), and the
`TextEncodeAceStepAudio1.5` nodes (they need the v1.5 checkpoint, which is not on disk).
ComfyUI was not running at the start; it was started once with
`schtasks /Run /TN PyreflyComfyUI` (nothing was queued, so no job was interrupted). Render
time: 14 s for the 80 s cue, 20 s for the 117 s cue. The same seed and denoise rendered twice
gave identical measurements.

## How it was measured (no listening)

Per render against the shipped cue: onset F-measure (+-50 ms); per 4-bar window the lag of
the best onset-envelope cross-correlation (+-250 ms) = the onset-grid drift (median, max,
slope in ms per minute); beat-by-beat chroma cosine similarity (8192-point STFT, 110 Hz to
4.2 kHz) against a same-key baseline (the source against itself two bars later); share of
onsets on the cue's eighth-note grid (+-40 ms; chance = 0.40 at 150 bpm, 0.43 at 160);
autocorrelation tempo, octave-folded; Krumhansl key (coarse: it reads the aeon source as F
minor, not Bb minor); energy-weighted spectral centroid; ebur128 integrated loudness and LRA.
`structureFidelity` = mean of onset F, window correlation, and chroma gain over the baseline.
The VAE round trip alone (denoise 0.05) scores 0.847: the ceiling of this metric.

## Results

Denoise sweep, 3 seeds each (mean fidelity; tempo per seed):

| denoise | battle-ffx | tempo | boss-ffx2-aeon | tempo |
|---|---|---|---|---|
| 0.35 | 0.595 | 150/150/150 | 0.530 | 160/158/160 |
| 0.40 | 0.575 | 150/150/150 | 0.500 | 160/160/160 |
| 0.42 | 0.462 | 176.5/150/150 | 0.484 | 160/158/160 |
| 0.45 | 0.447 | 176.5/150/150 | 0.389 | 160/160/130.5 |
| 0.50 | 0.320 | 176.5/150/166.5 | 0.279 | 222/160/130.5 |
| 0.55 | 0.303 | 171.5/150/166.5 | 0.278 | 120/160/133.25 |

**Committed: denoise 0.40** (the highest at which all six runs kept the tempo), seeds 101,
202, 303. Best by fidelity: `battle-ffx` seed 101 (0.628), `boss-ffx2-aeon` seed 303 (0.511).

| file | fidelity | onset F | lag median / max | drift | grid | centroid (source) | LRA (source) |
|---|---|---|---|---|---|---|---|
| B-battle-ffx-101 | 0.628 | 0.804 | 10 / 230 ms | 13 ms/min | 0.92 | 437 Hz (343) | 6.1 LU (4.6) |
| B-battle-ffx-202 | 0.549 | 0.688 | 5 / 210 ms | 8 ms/min | 0.82 | 392 Hz | 6.8 LU |
| B-battle-ffx-303 | 0.548 | 0.733 | 10 / 190 ms | 18 ms/min | 0.96 | 548 Hz | 6.5 LU |
| B-boss-ffx2-aeon-101 | 0.496 | 0.691 | 30 / 40 ms | -6 ms/min | 0.78 | 210 Hz (282) | 5.4 LU (4.2) |
| B-boss-ffx2-aeon-202 | 0.494 | 0.684 | 20 / 40 ms | 4 ms/min | 0.74 | 221 Hz | 3.8 LU |
| B-boss-ffx2-aeon-303 | 0.511 | 0.627 | 30 / 50 ms | 30 ms/min | 0.67 | 285 Hz | 3.9 LU |

Reading: battle-ffx 101 sits at -10 ms in 8 of 12 windows; the four windows from 32 to 58 s
lock one eighth note away (+-190 to 230 ms) at lower correlation (0.28 to 0.53): either the
B-section ostinato moved by an eighth or the correlator picked the neighbouring eighth; the
numbers cannot tell which. The aeon restyles sit a constant 20 to 30 ms early (no drift).
The FFX restyles got brighter (+49 to +205 Hz centroid); the FFX-2 ones mostly darker. LRA
rose on every FFX take (4.6 -> 6.1 to 6.8 LU): more dynamic movement than today.

Text-to-music controls (seed 101 committed, nearest tempo of three): `battle-ffx` asked for
150 bpm E minor, got 166.5 bpm (others 187.5, 171.25), key read D major, grid 0.40 = chance;
`boss-ffx2-aeon` asked for 160 bpm Bb minor, got 176.5 (others 184.5, 130.5), key read D
minor, grid 0.427 = chance. Unconstrained, the model follows neither tempo nor key.

## Files (`public/audio/candidates/`, 25 files, 14 MB)

`B-<cue>-<seed>.ogg` (full length) and `-x12.ogg` (12 s from loopStart: 6.4 s / 12 s) for
seeds 101/202/303; `B-<cue>-t2m-101(.ogg|-x12.ogg)`; `B-<cue>-source-x12.ogg` (today, same
window, same loudness); the ladder `B-battle-ffx-101-d35|d45|d55-x12.ogg` and
`B-boss-ffx2-aeon-303-d35|d45|d55-x12.ogg`; `B-report.json` (every number, lag windows
included, and the `best` pick with its rule). Opus 112k in Ogg: Safari before 17 will not
play it.

## Not done, and why

- **No listening claim**; the pick is by measurement only. Bailey decides by ear.
- **Loop seam**: not attempted. A model pass regenerates the audio; the restyles are
  auditions, not loopable cues (plan §3 risk).
- **Provenance**: whether model-generated audio may ship is still Bailey's question 3.
- **No repaint / cover path** (the custom node pack needs Bailey's yes); no v1.5 checkpoint.
- The key estimate is coarse and the chroma measure is energy-based; neither is a
  transcription. The onset measures are the reliable ones.
- No unit tests (`tests/` is outside this track's owned paths); `tsc` does not cover `tools/`.
