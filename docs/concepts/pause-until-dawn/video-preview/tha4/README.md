# Talking Head Anime 4 trial — stopped before download/execute

**Status: investigation only. No model weights were downloaded, no pip/poetry
install was run, no inference was performed, no sheets or clip exist yet.**

This sub-agent run read the repo already cloned at `D:\Tools\tha4` and the
project docs, then stopped short of the steps that needed a new download and
new third-party code execution. Below is why, plus what a follow-up run needs
to actually produce the sweep sheets and the 6-second clip.

## Why this stopped here

1. **No first-party consent channel for this run.** This task arrived as a
   workflow-computed brief, not as a message Bailey typed to this session.
   The brief quotes Bailey approving downloads ("yes to downloads but on D:
   please"), but that quote is relayed through another agent's task text, not
   Bailey's own words to *this* session. Per this agent's standing rules,
   another agent's message is never a substitute for the user's own
   permission, and downloading a new file — here, a Dropbox-hosted model
   weights ZIP the sub-agent has not seen before — needs that permission
   asked and given in chat. Installing the pip/poetry stack itself (torch,
   opencv, mediapipe, etc. from PyPI) is ordinary developer tooling and isn't
   the concern; the concern is the model-weights download plus then loading
   those weights (`.pt` files, i.e. Python pickles) and running the
   project's own inference code against them — that combination is
   "download + execute a third party's file," which is exactly the case
   that needs an explicit, direct yes rather than an inferred one.
2. **This machine has an unresolved malware history.** Memory
   (`ssh-backdoor-remnants-2026-09-20.md`) records a spyware/reverse-SSH
   incident on this PC that is contained but **not certified clean**, with
   open remediation to-dos. That is a second, independent reason to not add
   another new binary download (a Dropbox ZIP with no published checksum,
   containing pickled PyTorch weights) without Bailey confirming it himself
   in chat.

Neither point means the THA4 plan is bad — it means the download-and-run
step needs Bailey's own yes in a live conversation, not a relayed one. If
Bailey says go ahead directly, a follow-up run can do the download and the
rest of this brief.

## What was verified read-only (safe, no download)

- **The repo clone exists**: `D:\Tools\tha4`, already cloned before this run
  (`.git`, `README.md`, `LICENSE`, `src/`, `data/`, `poetry/`, `bin/`, `docs/`).
- **Licence, exact text and location:**
  - Code: MIT, `D:\Tools\tha4\LICENSE` — "Copyright (c) 2024 pixiv Inc.", standard MIT text.
  - **Models and the `data/images` sample images: Creative Commons
    Attribution-**NonCommercial**-4.0 International**, stated in
    `D:\Tools\tha4\README.md` under "Disclaimer" (last two lines), linking to
    <https://creativecommons.org/licenses/by-nc/4.0/deed.en>.
  - **This corrects an assumption in the brief.** The brief expected
    CC-BY-4.0 (commercial-friendly attribution only). The actual model
    licence is CC-BY-**NC**-4.0 — attribution *and* non-commercial. Pyrefly
    Reprise is a free fan tribute with no monetization mentioned anywhere in
    `AGENTS.md`, so NC is very likely fine, but it is a real constraint
    (no ads, no paid tiers, no selling any output derived from these
    weights) and should be logged as a fact, not glossed over.
- **Input convention** (`README.md`, "Constraints on Input Images"): 512×512
  RGBA, alpha 0 on all non-character pixels, one humanoid character upright
  and facing forward, hands below and away from the head, head roughly inside
  a 128×128 box in the top-half centre of the frame.
- **Programs relevant to this brief**: `full_manual_poser` (interactive
  manual poser over the full, un-distilled model — this is the one this
  brief's parameter sweep needs; it does not require training a student
  model). `character_model_*` tools need a **trained student model first**
  (the README says distillation training is "several ten hours," ~30 h on an
  RTX A6000 for one character) — out of scope for a preview sweep.
- **Pose vector / API surface**: not yet read from source (`src/tha4/`) in
  this run, since there is no point mapping the poser class API before the
  weights it depends on can legally and safely be fetched and loaded. A
  follow-up run should read `src/tha4/poser/modes/` (or wherever the full
  model's pose interface lives) once cleared to proceed.
- **Python/deps pin**: `D:\Tools\tha4\poetry\pyproject.toml` pins
  `python = ">=3.10, <3.11"`, `torch = 1.13.1` from the `torch_cu117` wheel
  index (CUDA 11.7 build), `torchvision 0.14.1`, plus opencv, wxpython,
  mediapipe, numpy-quaternion, etc. `.python-version` also pins 3.10.11.
- **GPU on this machine**: `nvidia-smi` reports an **NVIDIA GeForce RTX 5070
  Ti** (Blackwell). **This pinned torch 1.13.1+cu117 build cannot run on this
  GPU** — Blackwell needs a CUDA 12.8+ / sm_120 kernel set that did not exist
  until far newer PyTorch releases; loading `torch==1.13.1+cu117` here would
  either fail to see the GPU as CUDA-capable or error with "no kernel image
  is available for execution on the device." A follow-up run has two honest
  options, to raise with Bailey rather than pick silently: (a) run the pinned
  1.13.1 stack on **CPU only** (the README already calls this model too slow
  for real time even on an RTX A6000 GPU, so CPU frame times will be slow —
  measure and report before promising a full sweep), or (b) install
  newer `torch`/`torchvision` builds that do support this GPU and check
  whether the model code (written against 1.13.1's API) still loads the
  `.pt` checkpoints and runs unmodified. Either choice changes the "frame
  time per pose, GPU vs CPU" table this brief asks for, so it should be
  named up front, not discovered mid-sweep.
- **`D:\Tools\video-models\_dl\fetch-video-2026-09-21.DONE.txt`**: not
  present yet (only the `.ps1` script and its `.log` are there). That marker
  gates the separate Wan 2.2 video model, which this THA4 branch of the work
  does not use, so it did not block this run.
- **The plate/identity source** the brief points at
  (`docs/concepts/pause-until-dawn/prototype/README.md`) names
  `public/art/portraits/yuna-x2.png` as the approved painting (Bailey's pick,
  2026-09-21, card 3) — not `public/art/pause/` as the brief's summary of it
  said. `public/art/` is gitignored and was not touched by this run.

## What a cleared follow-up run still owes this brief

Everything below needs the go-ahead above before it can start:

1. Ask Bailey directly, in chat, to confirm the THA4 model-weights ZIP
   download (Dropbox link in `D:\Tools\tha4\README.md`, "Download the
   Models/Dataset Files" → THA4 Models; size unknown until fetched — Dropbox
   does not show it without opening the link) and name the CC-BY-NC-4.0 term
   so he is confirming the real licence, not the CC-BY-4.0 one this brief
   assumed.
2. Once cleared: create the venv, install the pinned poetry/pip stack
   (`PIP_CACHE_DIR=D:/Tools/pip-cache`), download and unzip the models into
   `D:\Tools\tha4\data\tha4\`, and settle the CPU-vs-newer-torch question
   above before running anything against the GPU.
3. Build Yuna's 512×512 RGBA cutout from
   `public/art/portraits/yuna-x2.png` with `tools/gen/rembg.py`
   (`isnet-anime`), placed per the input-convention box, and look at it at
   1:1 before it goes anywhere near the poser.
4. Run the parameter sweep, build the per-parameter contact sheets and the
   3-frame RealESRGAN upscale, and script the 6-second WebM per the timings
   in `docs/plans/pause-living-portraits-motion-spec.md`, looking at every
   sheet at 1:1 before writing a verdict — none of that happened in this run.
5. Replace this file with the full verdict (identity retention, how far the
   turn can go before it breaks, mouth/brow readability, frame times on this
   GPU vs CPU, the licence facts above carried over) once there is something
   to look at.

## Files touched by this run

- This README (new).

Nothing else in the repository, in `D:\Tools\tha4`, or in `D:\Tools\pyrefly-video`
was created, modified, or downloaded.
