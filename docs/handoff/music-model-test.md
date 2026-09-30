# music-model-test: a newer AI music model for the score (N1, options only)

**Game case (AGENTS.md rule 14): BOTH.** The music chain is shared plumbing. As in fb-0929, one FFX
cue (`boss-seymour`, Chapter I) and one FFX-2 cue (`boss-ffx2-aeon`, Chapter IV; also VI, XI, XIII).
The words given to the model are Direction B's per-game words (FFX: orchestra and pipe organ;
FFX-2: hybrid pop band with strings and brass), unchanged.
**Nothing ships (rules 9, 10, 13).** Nothing under `public/audio/music/`, `public/audio/manifest.json`
or `src/` changed. Bailey judges by ear in `docs/audio/audition.html`, section "Music quality options".

## Why

Bailey, 2026-09-29 ~23:00 EDT: "yes, all your recommendations". Recommendation 1 was: O1 now for
the whole score, and test a newer AI music model (downloaded to D: from official sources) before
choosing O2 or O3. fb-0929 (`docs/handoff/fb-0929-music.md`) measured the largest fault as ACE-Step
v1's own audio codec: a plain encode/decode round trip already makes 4-10 kHz noise-like, slows
attacks and wrecks the L/R correlation.

## Which model, and why only one

| Candidate | Newest version | Official source | Licence / gate | Used? |
|---|---|---|---|---|
| **ACE-Step 1.5** | turbo DiT (Jan 2026; XL variants Apr 2026) | `ACE-Step/Ace-Step1.5` on Hugging Face (ACE-Step org) | **MIT**, not gated, no login. The model card says generated music may be used commercially, so a public fan project may ship it | **Yes** |
| Stable Audio 3 Medium / Stable Audio Open 1.0 / Open Small | May 2026 | `stabilityai/...` | Stability AI Community licence, and the official repos are **gated** (licence click with a login) | **Skipped**: the brief forbids a login or gate click. Comfy-Org hosts ungated copies, but using them would sidestep the official gate, so they were not used |
| MiniMax Music 3 | Aug 2026 (newest) | `MiniMaxAI/MiniMax-Music3` | MiniMax-Music3 Community Licence: permissive, but its Acceptable Use Policy item 11 requires output published in public to be clearly disclosed as machine-generated | **Skipped**: 32 kHz output (nothing above 16 kHz, worse than what ships); it is a lyrics-and-text song generator with no audio input path, so it cannot be conditioned on our score and its codec cannot be round-tripped the same way; 57 GB and a 24 GB+ VRAM recommendation against this PC's 16 GB card. Only its licence and model card were downloaded, to decide |

## Downloads

All from `ACE-Step/Ace-Step1.5`, each SHA-256 equal to the Hub's LFS id, recorded in
`D:/Tools/downloads.md` (2026-09-30 entry): the VAE (337 MB), the turbo DiT (4.8 GB), the
Qwen3-Embedding-0.6B text encoder (1.2 GB) and the 5 Hz LM 1.7B (3.7 GB, needed only because
ComfyUI's ACE 1.5 text-encoder loader wants a pair; the LM itself is switched off). Files live in
`D:/Tools/music-models/ace-step-1.5/`. No Python package was installed and nothing executable was
downloaded. The diffusers VAE test ran in the existing `D:/Tools/sd-scripts/.venv`, read only.

ComfyUI (0.35.0) loads the official DiT as it is: its SHA-256 equals Comfy-Org's repackaged turbo.
The VAE and the two text encoders only needed their tensor names changed, which
`tools/audio/ace15-comfy-files.py` does. A strict load succeeds. ComfyUI's module and diffusers'
module decode the same latent to bit-identical audio (TF32 off). Hard links sit in
`D:/Tools/ComfyUI/ComfyUI/models/{diffusion_models,text_encoders,vae}/pyrefly-ace15/`.

## (1) Codec round trip, same inputs as fb-0929

Inputs: the 45 s sampled-render excerpts that fb-0929 used for v1
(`D:/Tools/pyrefly-scratch/fb-0929/music/probe/{seymour,aeon}-render-x45.wav`).
Tool: `tools/audio/quality-vae15-roundtrip.py` (encode to the posterior mean, then decode; no text,
no sampling). A resample-only control (44.1 -> 48 -> 44.1 kHz) changes nothing (0.0 on every measure).

| | 4-10 kHz flatness dB (lower = more like notes) | rise ms (per file) | paired rise change ms | L/R corr | 2.5-6 kHz share dB |
|---|---|---|---|---|---|
| Seymour input | -12.5 | 5.0 | - | 0.60 | -16.3 |
| ACE-Step v1 round trip | -9.6 | 8.0 | +2.5 | **0.04** | -17.0 |
| **ACE-Step 1.5 round trip** | **-12.9** | 10.0 | +5.0 | **0.64** | -16.7 |
| Aeon input | -17.5 | 21.0 | - | 0.55 | -20.4 |
| ACE-Step v1 round trip | -13.0 | 28.0 | +5.0 | **0.07** | -20.7 |
| **ACE-Step 1.5 round trip** | **-14.7** | 13.5 | +2.0 | **0.62** | -21.0 |

Plain verdicts:
- **L/R correlation: fixed.** v1 destroys it (0.04 and 0.07). 1.5 keeps it (0.64 and 0.62).
- **Top noisiness: much better.** On Seymour 1.5 leaves it as it was, where v1 added 2.9 dB. On the
  aeon cue 1.5 adds 2.8 dB, where v1 added 4.5 dB.
- **Attacks: not better.** 1.5 slows them by +5.0 and +2.0 ms. v1 slowed them by +2.5 and +5.0 ms.
  The paired measure is `tools/audio/quality-codec-pair.py`, which takes the rise at the same 60
  input onsets. The per-file rise disagrees in direction on the aeon cue, so read it as "about the same".
- **2.5-6 kHz presence: the same.** Both stay within 0.7 dB.
- Spectral error (1/3-octave magnitude, phase-blind) is lower with 1.5 in every band. For example,
  12-16 kHz is 1.9 / 1.7 dB against 3.5 / 3.3 dB.

The codec measured clearly better on the fault that made the music "hollow", and better on the
hiss, so the sketches were made.

## (2) The N1 sketches

Graph (`tools/audio/quality-n1-ace15.mjs`): turbo DiT, 8 steps, cfg 1, euler/simple, AuraFlow
shift 3 (ComfyUI's own ACE 1.5 template). Direction B's words, bpm and key; "[Instrumental]"; the LM
audio codes are off. **Cover mode**: `ReferenceTimbreAudio` gets our render's latent, so the model
takes its structure hints from our score. The start is the render's latent at a denoise.
Conditioning is only our own sampled render and our words, never any retail audio.

Sweep (seed 101, `D:/Tools/pyrefly-scratch/picks-0930/music-model-test/structure.txt`, also in
the manifest's `takesSweep`):
- Denoise 0.40 keeps the score best (structure fidelity 0.80 and 0.74, onset F 0.87 and 0.76).
- Denoise 0.6 drops it to 0.62 and 0.54. Denoise 0.8 and 1.0 drop it to 0.23-0.33.
- Without cover mode, denoise 0.6 loses the grid on Seymour (1/6 windows correlated).
- At 0.40, 1.5 moves the timbre about as far from the render as v1 did at 0.40 (1/3-octave error
  4-6 dB for both).

So 0.40 is used, the strength of Bailey's 27 Sep clip. Seeds 101/202/303 were then picked by
Direction B's written rule: highest structure fidelity among the takes that keep the tempo within 3 %.
- Seymour: **s303** (SF 0.789). s202 scored 0.805 but its tempo estimate folded to 176.5 against
  the source's 130.5, so the rule excludes it.
- Aeon: **s303** (SF 0.751).

Against v1's 45 s takes on the very same inputs:

| | structure fidelity | flatness dB | rise ms | L/R corr | 2.5-6 kHz dB |
|---|---|---|---|---|---|
| Seymour v1 take (s202) | 0.466 | -6.9 | 22.5 | 0.03 | -21.8 |
| **Seymour N1 take (s303)** | **0.789** | **-12.1** | **11.5** | **0.45** | **-18.4** |
| Aeon v1 take (s303) | 0.524 | -4.9 | 8.0 | 0.13 | -27.9 |
| **Aeon N1 take (s303)** | **0.751** | **-13.5** | 19.0 | **0.60** | **-23.4** |

Aeon rise: the score itself rises in 21 ms on this passage (per-file measure), so N1's 19 ms is
close to the score; v1's 8 ms is faster than the score it was given.

Then, as the brief asked, R1 (`tools/audio/quality-n1-r1.py`: `remaster.py` focus with a lossless
output) and V0 (`quality-sketch.py`: -16 LUFS, true peak <= -1 dBTP measured on the MP3). The final
sketches, next to fb-0929's:

| Seymour | flatness | rise | corr | 2.5-6k | 6-12k |
|---|---|---|---|---|---|
| 0 today | -8.8 | 15.0 | 0.76 | -17.8 | -35.6 |
| O1 | -8.7 | 12.5 | 0.76 | -17.8 | -36.0 |
| O2 | -12.7 | 9.5 | 0.73 | -18.5 | -38.0 |
| O3 | -9.8 | 3.0 | 0.53 | -21.0 | -33.5 |
| **N1** | **-12.1** | 16.5 | 0.73 | -15.8 | -30.2 |

| Aeon | flatness | rise | corr | 2.5-6k | 6-12k |
|---|---|---|---|---|---|
| 0 today | -7.1 | 22.0 | 0.73 | -20.1 | -31.9 |
| O1 | -7.1 | 20.0 | 0.73 | -20.1 | -32.1 |
| O2 | -15.8 | 12.5 | 0.60 | -19.6 | -32.6 |
| O3 | -13.6 | 4.0 | 0.63 | -18.6 | -34.0 |
| **N1** | **-14.2** | 20.5 | 0.68 | -18.2 | -28.4 |

Plain reading:
- N1's top is about as note-like as O2's.
- N1 is 3.5-6 dB brighter above 6 kHz than today.
- Its stereo is as wide as today's.
- Its attacks are no sharper than today's. On Seymour, R1's phase repair adds 5 ms to the take's
  11.5 ms.
- The MP3 coding noise is -18 dB at 6-12 kHz and pre-echo is -34 / -25 dB (the V0 of O1).
- A 15-21 dB lowpass step at 16.5-17 kHz remains in the takes. The model copied it from the input
  (the old q5 MP3 of the render, which has the same step). A lossless render input would remove it.

## Files

- `docs/audio/candidates/music-model-test/boss-seymour-N1-newer-model-v0.mp3`,
  `boss-ffx2-aeon-N1-newer-model-v0.mp3`, and `manifest.json` (codec rows for input / v1 / 1.5 on
  both inputs with the paired measures, the sketch measures, the raw take and v1 take on the same
  input, and the sweep).
- `docs/audio/audition.html`: the N1 paragraph, one N1 player per cue, the N1 cost line, the pick
  question now lists N1, and there is a new "N1 against today" question.
- Tools, all new: `tools/audio/quality-vae15-roundtrip.py`, `quality-codec-pair.py`,
  `ace15-comfy-files.py`, `quality-n1-ace15.mjs`, `quality-n1-r1.py`.
- Test: `tests/unit/audio-music-model-test.test.ts`. It checks that the N1 players resolve to listed
  files, both cues are covered, the sketches are loudness-matched, the codec rows exist for both
  models on both inputs, and the game manifest is untouched. The fb-0929 test still passes, with
  8 fb-0929 players.
- Headless check (Chromium from a node script with an in-process server on 8202, stopped): 10
  players decode at 45 s, no console error, no horizontal scroll at 1000 and 375 px, and Collect
  includes the new question. Screenshots:
  `docs/screenshots/music-model-test/audition-section-1000.jpg`, `audition-n1-375.jpg`.
- Scratch (outside the repo): `D:/Tools/pyrefly-scratch/picks-0930/music-model-test/`. It holds the
  round trips, all 14 takes, the R1 masters, the measurement JSONs and the check script.

## Re-run

```
<torch+diffusers python> tools/audio/quality-vae15-roundtrip.py --vae D:/Tools/music-models/ace-step-1.5/vae --in <x45.wav> --out rt.wav
python tools/audio/quality-codec-pair.py --ref <x45.wav> rt.wav --json pair.json
node tools/audio/quality-n1-ace15.mjs --cue=boss-seymour --in=<x45.wav> --out=<dir> --seed=303 --denoise=0.4 --cover=1
python tools/audio/quality-n1-r1.py --in <take.flac> --out r1.wav
python tools/audio/quality-sketch.py --in r1.wav --out N1.mp3 --encode v0
```

## Not done / open

- **Bailey's ear.** N1 against 0, O1, O2 and O3.
- **For the whole score, if N1 is picked**, three things are still needed:
  - A full-length N1 render of all 26 cues (turbo is about 20 s of GPU per 45 s of music).
  - The Direction B loop, seam and run-on repair from `render-b-score.mjs`, ported to the 1.5 graph.
  - `qa.mjs`, then a focused review (shared audio routing).
- **Worth measuring at that point:**
  - N1 without R1's phase repair. The 1.5 codec keeps phase, so the repair may cost attacks for
    nothing.
  - N1 from a lossless render, to remove the 16.5 kHz step.
  - The XL turbo (about 10 GB bf16), which was not tried on a shared 16 GB card.
- ComfyUI keeps its own model memory. Nothing was freed or restarted, and no image job was
  interrupted: each prompt joined the end of the queue with at most one job ahead.
