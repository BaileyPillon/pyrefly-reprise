# tools/audio/ear: the automated ear (a screen, not a verdict)

Agents cannot hear (AGENTS.md rule 13). `ear.py` measures music and SFX renders so that an
obviously damaged render can be caught before Bailey listens. It never decides how anything
sounds; Bailey does, from `docs/audio/audition.html`. Game: both (shared tooling).

## What it measures

| Instrument | Output | Licence |
|---|---|---|
| Meta audiobox-aesthetics | `aes.PQ` production quality, `aes.PC` production complexity, `aes.CE` content enjoyment, `aes.CU` content usefulness (1-10), plus the lowest 10 s window of each | CC-BY-4.0 |
| LAION CLAP `clap-htsat-unfused` | `clap.sims` per text prompt, `clap.contrast` = mean(professional prompts) - mean(cheap/tinny/hissy prompts) | Apache-2.0 |
| DSP | loudness, loudness range, crest, L/R correlation, mono-sum loss, band shares, 99 % roll-off, quiet-passage hiss | ours |
| `screen` | flags when a file falls outside the range of nine professional reference recordings: dark top end, thin predicted arrangement, decorrelated stereo | ours |

Files are loudness-matched to -16 LUFS before the models see them; DSP loudness is measured
before that.

## How to read it (from `calibration.md`, 2026-09-30)

- **PQ is a paired measure only.** It drops 0.1 to 2.1 when one piece is damaged (band-passed,
  bit-crushed, hissed), but across different pieces it ranked our shipped cues above public
  orchestral recordings. Compare a new render with the one it replaces, same cue, same window.
- **The screen flags are the part that separated references from shipped cues** (6-12 kHz
  share AUC 0.99, predicted complexity 0.86).
- **CLAP prompts are a style probe, not a defect detector:** its "tinny" prompt scored lower on
  deliberately tinny copies than on the originals.

## Setup (once; everything on D:)

See `requirements.txt` for the venv commands. Models (Hugging Face, no login), into
`D:/Tools/audio-libs/audiobox-aesthetics/` (`model.safetensors`, `config.json`) and
`D:/Tools/audio-libs/clap-htsat-unfused/` (whole repo). Override the folder with
`PYREFLY_EAR_MODELS`. ffmpeg must be on PATH (`D:/Tools/FFmpeg/.../bin`). Runs on CPU (about
3 s per minute of audio); it leaves the GPU to ComfyUI. Set `HF_HUB_OFFLINE=1`.

`laion/larger_clap_music` does not work here: with transformers 4.49 and 5.17 every clip and
prompt embeds to one point. transformers 5.x also changes the feature API, hence the pin.

## Use

```
set HF_HUB_OFFLINE=1
D:/Tools/venvs/audio-ear/Scripts/python tools/audio/ear/ear.py a.mp3 b.wav --window loudest --seconds 60 --out scores.json
D:/Tools/venvs/audio-ear/Scripts/python tools/audio/ear/ear.py --list files.tsv --out scores.json   # path<TAB>group
python tools/audio/ear/report.py scores.json --files --versus shipped
```

`--no-clap` / `--no-aes` skip a model; `--no-norm` skips the loudness match; `--window first`
or `full` changes the excerpt. Groups whose name starts with `ref-` are treated as references by
`report.py`. Reference recordings used for calibration are local only
(`D:/Tools/audio-libs/ear-references/`, `manifest.txt` there) and never ship.
