# Living-portrait techniques — a technique scout's inventory

**Status:** research only, nothing built or downloaded. Companion to
`docs/plans/pause-living-portraits.md` (round 1: procedural depth shader +
faked blink, shipped as the prototype at
`docs/concepts/pause-until-dawn/prototype/`) and
`docs/concepts/pause-until-dawn/prototype/README.md`, which already names the
gap this file goes after: real, painted changes of expression and a real
blink, "fluid and natural," at plate resolution (~1440 px tall), in a static
WebGL2 web game, gaze driven by keyboard/mouse/gamepad, never off-model.

Facts only below; the orchestrator ranks. Every unverified claim is marked
**UNVERIFIED**. No file was downloaded or installed to produce this report.

---

## Part 1 — what is already on this machine

GPU: **RTX 5070 Ti, 16 GB VRAM** (from the brief; not re-measured here).

### ComfyUI (`D:\Tools\ComfyUI\ComfyUI`)

`models/checkpoints`:
- `animagine-xl-4.0-opt.safetensors` — 6.94 GB (the model that painted our
  portraits; this is the one round 1 already recommended for inpainted
  expression/blink patches)
- `ace_step_v1_3.5b.safetensors` — 7.70 GB (audio model, not relevant here)

`models/diffusion_models`:
- `krea2_turbo_fp8_scaled.safetensors` — 13.14 GB
- `flux-2-klein-9b-kv-fp8.safetensors` — 9.82 GB
- `z_image_turbo_bf16_v2.safetensors` — 12.31 GB
- `z_image_turbo_bf16.safetensors` — 0 bytes (empty placeholder, not a real file)

`models/vae`: `ae.safetensors` (335 MB, Flux), `flux2-vae.safetensors` (336 MB),
`qwen_image_vae.safetensors` (254 MB).

`models/ipadapter`: `ip-adapter-plus_sdxl_vit-h.safetensors` — 848 MB.
`models/clip_vision`: `CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` — 2.53 GB.
`models/upscale_models`: `RealESRGAN_x4plus.pth` — 67 MB.

**Empty (placeholder file only, nothing installed):** `unet`, `controlnet`,
`detection`, `background_removal`, `geometry_estimation` (not listed but
implied empty by round 1's doc), and there is **no** `animatediff_models`,
`sams`, or `ultralytics` folder under `models` at all — those model classes
are not present on this machine in any form.

`custom_nodes/`: only `ComfyUI_IPAdapter_plus` plus the stock
`websocket_image_save.py` example. **No AnimateDiff, VideoHelperSuite,
LivePortrait, ControlNet-aux, Impact-Pack (which normally carries
ultralytics/SAM), or any video-model custom node is installed.**

`D:\Tools\ComfyUI\rembg-models\models`: contains **`isnet-anime`** only — an
anime-tuned background-removal ONNX model is already on disk.

ComfyUI's embedded Python (`python_embeded\python.exe`, checked directly):

| Package | Present | Version |
|---|---|---|
| `torch` | yes | 2.13.0+cu130 |
| `onnxruntime` | yes | 1.30.0 |
| `rembg` | yes | 2.0.84 |
| `mediapipe` | **no** | — |
| `segment_anything` | **no** | — |
| `cv2` (opencv-python) | **no** | — |

So: no MediaPipe, no Segment Anything, no OpenCV in the ComfyUI Python today.
Any workflow needing face landmarks (MediaPipe/face-alignment) or SAM-based
segmentation needs a `pip install` first — that is a download/install and
needs Bailey's yes under rule 11, even though the packages themselves are
free and small.

### This repo's own art tools (`tools/gen/`)

- `rembg.py` — background removal, presumably using the installed `rembg`
  package (isnet-anime is on disk, matching this).
- `comfy.mjs` / `comfy.d.mts` — the ComfyUI API client used to drive batch
  renders; no inpainting-specific workflow file was found under `tools/gen`
  by name, but `cast.json` and the many `_cand-*.json` / `sheet-*.json` files
  are per-character prompt/pose recipes for the *existing* text-to-image +
  IPAdapter pipeline, not an inpainting graph. **No dedicated mask/inpaint
  `.json` workflow was found in this directory in this pass** — building one
  (empty-latent inpaint + a mask, using the already-installed Animagine
  checkpoint) is pipeline work, not a download.
- `pose-phrases.mjs`, `qc.py`, `despeckle.py`, `fillholes.py`, `islands.py`,
  `connected-components.mjs`, `cutout-guard.mjs` — cutout/mask cleanup
  utilities, general-purpose, reusable for layer-cutting work.
- Identity sidecars: every shipped pause plate under `public/art/pause/*.json`
  (e.g. `yuna.json`, `yuna-ffx2.json`, `auron.json`, …) is present — these are
  the per-painting identity/measurement rows the prototype's README says the
  gaze rig already reads (`src/ui/common/face-crops.json` holds `fx`/`fy`/ipd
  and pupils; the per-plate `.json` files are the art-pipeline's own
  sidecars). No `eyeBox` (lash lines) row exists yet, confirmed by round 1's
  plan — that is still open work, not a tooling gap.

### ffmpeg

Present and on `PATH`: `D:\Tools\FFmpeg\ffmpeg-9.0.1-full_build-shared\bin\ffmpeg.exe`
(gyan.dev full build), version 9.0.1, with `libvpx`, `libaom`, `libsvtav1`,
NVENC/NVDEC and CUDA support built in. Sufficient to encode VP9/AV1 WebM with
alpha and to loop/crossfade clips, entirely offline.

---

## Part 2 — candidates

### (a) Self-made layered rig, Live2D-style, without the Live2D SDK

**What it is.** Cut the approved painting into semantic layers (back hair,
face base, eye whites, irises, lids+lashes, brows, mouth, bangs, neck/clothes,
accessories), inpaint what each cutout reveals behind it (using the installed
`animagine-xl-4.0-opt.safetensors`, low-denoise, masked), paint small aligned
expression-variant patches the same way, then mesh-warp / cross-fade / spring
the layers together at runtime in WebGL — the same mechanism round 1's
prototype already does for the whole painting as one rigid plane, extended to
independently moving parts.

**Licence.** Ours: the layers and inpainted patches are new pixels made with
a model already licensed for this project's use (no new licence exposure).
The *technique* (layered 2D "Live2D-style" rigging) is not itself
patented/licensed — see the two SDK paragraphs below for the two named
alternatives to actually building the runtime rig format.

**Downloads.** None required for the cutting and inpainting (Animagine is
installed). **MediaPipe/face-alignment or SAM-family segmentation, if used to
help find layer boundaries automatically, are not installed** (see Part 1)
and would need a small, free `pip install` — install, not weights, so size is
trivial (MediaPipe wheel is tens of MB) but still needs Bailey's yes per rule
11. Layer-cutting can also be done by hand in an image editor with no install
at all, which is what round 1 implies for the eye/lid geometry today.

**Evidence on anime/painted faces.** This is our own art, cut and inpainted
by our own already-approved model — not a third-party model being asked to
generalize to a style it wasn't trained on. This sidesteps the single biggest
risk found for every diffusion-driven reenactment method below (LivePortrait,
AniPortrait, etc. all show measured quality loss on anime/painted input,
Part 2(d) and the comparison table).

**Interactive gaze.** Layers already separated (iris, lid) can be moved
independently in the existing WebGL2 shader/JS rig — strictly more control
than the current single-plane warp, and gaze remains a numeric transform, not
a generative inference call, so it stays real-time and deterministic.

**Ships as.** PNG layer stack (a handful of small RGBA textures per
character, comparable to or smaller than round 1's plan for full-frame
expression variants, §6 of `pause-living-portraits.md`), rendered with the
already-shipped WebGL2 pipeline. No video, no new runtime dependency.

**Risks.** The most labour-intensive route by far — round 1 estimated "~8 h
per character of manual layer separation" for a full cut-out rig (option D in
that doc's table) and inpainting expression patches "~20 min per variant"
(option E). Getting the mesh warp/spring physics to look natural (not
"paper-doll") is real engineering, not just art work. Ten characters × several
layers × several expressions is a lot of individual review against the
approved-hash rule (AGENTS.md rule 9).

**On-disk tools available for the cutting step:** `rembg` (isnet-anime
present) for silhouette/background separation; the repo's own
`cutout-guard.mjs`, `islands.py`, `connected-components.mjs`,
`fillholes.py`, `despeckle.py` for cleaning masks once cut; Animagine for
inpainting revealed regions and painting expression patches. **Missing:**
anime-aware face-landmark detection (no MediaPipe/face-alignment installed)
and general segmentation (no SAM/Ultralytics installed) — both would help
locate layer boundaries (eyes, mouth, brow) automatically but are not
strictly required, since round 1's `eyeBox` measurement was already being
done by hand-reading pixel coordinates.

**Live2D Cubism SDK for Web — licence position.** The SDK itself downloads
and runs free for development/verification. Live2D requires a separate **SDK
Release License (Publication License Agreement)** before shipping content
made with it, but **individuals and small-scale businesses are exempt from
that agreement and its payment**; the indie/small-enterprise carve-out
applies to businesses with recent annual sales under ¥10,000,000, regardless
of commercial or non-commercial use ([Live2D SDK Release License](https://www.live2d.com/en/sdk/license/),
[Live2D indie/PRO licence FAQ](https://help.live2d.com/en/license/license_25/)).
Pyrefly is a non-commercial fan project by an individual, so this looks like
it would qualify for the exemption **if** we ever wanted the real Cubism
runtime — but adopting it means authoring rigs in Cubism Editor and shipping
its proprietary Web runtime, which is a much bigger toolchain change than the
"cut layers, warp them ourselves" route above, and its output files (`.moc3`)
are a binary format outside our own pipeline. **UNVERIFIED**: whether the
free SDK download itself carries any redistribution restriction for the
*runtime* JS bundle in a public repo — the licence pages above cover content
made with it, not the SDK's own redistribution terms; would need reading the
`Live2D Open Software License Agreement` text directly before adoption.

**Inochi2D — licence position.** Fully open source, BSD-2-Clause, with
`Inochi2D` (runtime spec/SDK), `Inochi Creator` (authoring tool) and `Inochi
Session` (VTuber puppeteering) all under the same org
([Inochi2D on GitHub](https://github.com/Inochi2D)). No commercial-use
carve-outs to reason about — it is a permissive licence outright. It targets
the same "layered PNG parts + deformation" model as our own plan (a). It is a
native/desktop-first project (D-language SDK, Creator app); **UNVERIFIED**
whether a maintained WebGL/JS runtime exists that we could embed directly in
our static site without a native build step — this needs a follow-up look at
`Inochi2D`'s own repo list before counting on it as a drop-in web runtime
rather than as a reference design to imitate in our own shader/JS code (which
is what round 1 already does).

---

### (b) Image-to-video idle loops, shipped as video textures

**What it is.** Generate a short (6–10 s) locked-camera idle loop locally
from the approved painting (idle breathing/blink/hair-sway, or a small clip
graph: idle → glance-left → hold → return), export as WebM, and either play
it as a `<video>`-backed WebGL texture directly, or use it as an *input* to
the existing gaze shader (i.e., a living idle loop for the parts the shader
can't move, with the shader's warp still doing head/eye lean on top).

**Models found, and their state on this machine:**

- **Wan 2.2** — TI2V-5B (text+image-to-video, one model) and I2V-A14B
  (image-to-video, MoE high/low-noise pair), both released under **Apache
  2.0**, weights on Hugging Face, and **natively supported in current
  ComfyUI**, including built-in first/last-frame-to-video templates useful for
  seamless loops ([Wan2.2 ComfyUI native docs](https://docs.comfy.org/tutorials/video/wan/wan2_2),
  [Wan2.2 FLF2V native support](https://blog.comfy.org/p/wan22-flf2v-comfyui-native-support)).
  **Not installed on this machine** — no diffusion model file matching Wan is
  present under `models/diffusion_models` or `models/checkpoints` (Part 1),
  and there is no VideoHelperSuite/WanVideo custom node under `custom_nodes`.
  Fp8 I2V-A14B weights and Q8_0 GGUF quantisations both exist upstream (Q8_0
  GGUF quants run **~15.4 GB per expert** per the QuantStack repo listing —
  the 14B model ships as two experts (high-noise/low-noise), so a full Q8_0
  pair would be in the ~30 GB range; smaller GGUF quants (2–5 bit) are
  available for less VRAM, sizes not individually verified here —
  **UNVERIFIED** exact byte counts for every quant level;
  [QuantStack/Wan2.2-I2V-A14B-GGUF](https://huggingface.co/QuantStack/Wan2.2-I2V-A14B-GGUF)).
  The lighter TI2V-5B model is the more realistic fit for a 16 GB card and a
  single-portrait idle loop, but its own download size was not verified in
  this pass — **UNVERIFIED**.
- **LTX-Video** — LTX-2.5 (22B) is Lightricks' latest, under the "LTX-2.x
  Community License," which is permissive except that entities with **at
  least $10,000,000 in annual revenue** must obtain a separate commercial
  licence — a non-issue for a non-commercial fan project
  ([LTX-2.5 ComfyUI docs](https://docs.comfy.org/tutorials/video/ltx/ltx-2-5)).
  Earlier LTXV 0.9.5 used **OpenRAIL-M**, also fine for commercial-adjacent
  use of outputs. VRAM: full BF16 needs ≥32 GB, **fp8-quantised needs ≥16 GB**
  — right at the edge of the 16 GB card, likely workable for a single short
  clip but with no headroom; **not installed**, no LTX files found on disk.
- **FramePack / HunyuanVideo family** — **HunyuanVideo** (Tencent) is under
  the **Tencent Hunyuan Community License**: usable for research and most
  commercial cases, but with a **100-million-monthly-active-user cap** before
  a separate licence is required, and it is **expressly not licensed for use
  in the EU, UK, or South Korea**
  ([HunyuanVideo LICENSE](https://github.com/Tencent-Hunyuan/HunyuanVideo/blob/main/LICENSE.txt)).
  The MAU cap is irrelevant to us; **the territory exclusion is a real
  question** for a public GitHub Pages site with an unknown audience —
  UNVERIFIED how that clause is meant to apply to a free fan site rather than
  a "Licensee" operating a paid service, and worth a direct read of the full
  licence text (not just the search summary) before relying on it. Not
  installed here. FramePack itself (the sampling/inference wrapper commonly
  paired with HunyuanVideo for long, low-VRAM generation) was not indpendently
  checked for its own licence in this pass — **UNVERIFIED**.
- **AnimateDiff (for SDXL)** — motion-adapter weights and code are
  **Apache-2.0**
  ([guoyww/AnimateDiff](https://github.com/guoyww/AnimateDiff),
  [SDXL beta motion adapter](https://huggingface.co/guoyww/animatediff-motion-adapter-sdxl-beta)),
  and it is the one video-generation route here that plugs into an **SDXL
  checkpoint we could pick ourselves** rather than a fixed foundation model —
  relevant because Animagine XL (already installed) is itself SDXL-family, so
  AnimateDiff is the one candidate that could ride on the *exact* model that
  painted our portraits, which is the strongest anime-style match of anything
  in this list, but **no AnimateDiff motion-adapter weights are on this
  machine** and no AnimateDiff-family custom node is installed.

**Native ComfyUI support / sizes / licences summary:** see table below.

**Loopability.** All are diffusion video models generating fixed-length
clips; a clean loop needs either first-last-frame conditioning back to the
starting frame (Wan 2.2 supports this natively) or a manual crossfade in
post (ffmpeg, already on this machine, handles this offline).

**Identity drift on anime art — general finding, not model-specific:** every
photorealistic-first video/portrait model surveyed for this report (LivePortrait,
AniPortrait, and by extension the diffusion-video family here, none of which
were trained principally on painted/anime imagery) carries the same
theoretical risk category as (d) below: these are large foundation video
models with no anime-specific fine-tune verified in this pass, so a face this
detailed and identity-locked (rule 9) generated wholesale by one of them
is a genuine drift risk that would need a supervised trial per character
before any commitment — **this was not tested in this pass** (no downloads
were made; rule 11 and the economy budget).

**Delivery facts.**
- **WebM VP9 alpha:** supported in Chrome, Firefox, Edge; **Safari does not
  support VP9/WebM transparency** even though it can play opaque
  VP9/WebM on current macOS/iOS/iPadOS
  ([SuperGeekery browser transparency survey](https://supergeekery.com/blog/transparent-video-in-chrome-edge-firefox-and-safari-circa-2022),
  [Rotato 2026 guide](https://rotato.app/blog/transparent-videos-for-the-web)).
- **Safari-compatible alpha path:** HEVC-in-MOV, which Safari supports but
  Chrome/Firefox do not — meaning a fully cross-browser transparent-video
  portrait needs **two encodes served conditionally** (WebM/VP9 for
  Chromium/Firefox, HEVC/MOV for Safari), adding real pipeline complexity.
  ([Jake Archibald, "Video with transparency on the web," 2024](https://jakearchibald.com/2024/video-with-transparency/)).
- **AV1:** growing support, but **animated AVIF transparency is not
  correctly supported in Safari** either — no clean single-format answer for
  transparency across all browsers today.
- **Typical size:** a real-world transparent-video example was **~1.1 MB in
  Chrome/Firefox (VP9)** vs **~3.4 MB in Safari (HEVC)** for a short clip —
  UNVERIFIED how that scales to our resolution (~1440 px tall vs. the source
  example's unspecified size) and duration (6–10 s), but it is evidence that
  a single portrait loop is plausibly a few MB, not tens.
- **A locked-camera portrait with no background removal at all (i.e., no
  alpha, the video simply fills the frame region behind our HUD chrome)**
  sidesteps the whole Safari-alpha problem and is worth calling out as the
  simplest delivery path if the composition allows it.

---

### (c) Talking Head Anime 3 / 4 (pkhungurn)

**Licence.** The distributed **model weights carry a CC-BY-4.0 licence**,
which explicitly permits commercial use with attribution
([pkhungurn/talking-head-anime-3-demo README](https://github.com/pkhungurn/talking-head-anime-3-demo/blob/main/README.md)).
**UNVERIFIED**: the exact licence of the *code* itself (the GitHub repo has
its own top-level `LICENSE` file, not read in full in this pass) — the CC-BY
claim above is specifically about the released model files per the README
text found.

**Input format.** Built for a specific pose: **the character's head must
fit roughly inside a 128×128 box in the top half of a square input image**
— this is a real constraint against our ~1440-px-tall close-up plates,
implying the source painting would need to be resized/cropped to that
convention before the model can drive it, or the model's output re-composited
back onto our full-resolution art (likely losing the fine detail our
paintings carry, since the underlying network almost certainly resolves the
face at a much lower internal resolution than 1440 px). **UNVERIFIED** the
model's exact output resolution — the search pass found the input framing
convention but not a stated output pixel size; this needs a direct read of
the repo's own docs/code before relying on it.

**Anime evidence.** This is the strongest anime-specific evidence of any
candidate in this report — it is designed and trained specifically for
single-image anime portraits (this is literally the project's stated
purpose, not a side finding), unlike every general-purpose video/portrait
model above and below which were built for photographic faces.

**Whether frames or warp fields could be prerendered into a parameter grid.**
Plausible in principle (the model is explicitly parametric — pose/expression
control values drive a lightweight decoder at inference time, per the
project's own framing), which would let us prerender e.g. blink and a handful
of expression states offline and ship them as a small texture grid rather
than running the network at runtime — but this was not verified against the
actual code/weights in this pass (no download was made) — **UNVERIFIED**,
and it is the single most promising "verify next, with a small download"
item in this whole report if identity fidelity holds up at a spot-check.

---

### (d) LivePortrait, driven without InsightFace

**Licence.** LivePortrait's own weights are MIT, but the stock pipeline
depends on InsightFace's `buffalo_l` face-analysis pack, which is
**non-commercial research only** — already flagged and rejected in round 1's
plan for exactly this reason. The community node **ComfyUI-LivePortraitKJ**
documents two InsightFace-free detector options: **MediaPipe** and
**face-alignment**, both under permissive (MIT/Apache-2.0) licences, so the
whole pipeline can run InsightFace-free and stay clean of the non-commercial
clause ([kijai/ComfyUI-LivePortraitKJ](https://github.com/kijai/ComfyUI-LivePortraitKJ),
[detector licence note, GitHub issue #110](https://github.com/kijai/ComfyUI-LivePortraitKJ/issues/110)).
Neither MediaPipe nor `face-alignment`/OpenCV (`cv2`) is installed in the
ComfyUI Python on this machine today (Part 1) — running this route needs a
`pip install`, not a model download, but still needs Bailey's yes (rule 11).

**Whether it holds up on anime faces.** No. Multiple independent sources
found in this pass state the same limitation: LivePortrait "generalizes
poorly to styled portraits such as anime" because it was trained on
realistic portrait video, and a comparison method (X-Portrait) shows a
"noticeable drop in image quality... in the anime and painting styles"
([EmojiDiff, arXiv 2412.01254](https://arxiv.org/pdf/2412.01254)). This is
the same conclusion round 1's plan already reached from a different angle
(the licence problem); this pass adds direct evidence the *technical* result
would likely be poor too, independent of the licence question.

**Retargeting sliders as an offline patch-render tool.** LivePortrait exposes
eyes/lips/head-pose retargeting sliders, which — regardless of the anime
quality concern above — is architecturally exactly the kind of tool that
*could* render expression patches offline for review, the same idea as (a)'s
inpainted patches; it just is not the right generator to point at anime input
per the evidence above.

---

### (e) Other candidates with stylised-face evidence

- **Follow-Your-Emoji / Follow-Your-Emoji-Faster.** Code appears to target
  landmark-driven Stable Diffusion animation; **this is the one candidate
  with explicit published evidence of testing on cartoon input**: the
  authors built **EmojiBench**, a 410-portrait benchmark spanning
  "cartoon style, real-human style, and even animals," specifically to
  measure this
  ([Follow-Your-Emoji project page](https://follow-your-emoji.github.io/),
  [Follow-Your-Emoji-Faster, arXiv 2509.16630](https://arxiv.org/html/2509.16630)).
  **UNVERIFIED**: the exact code/weights licence — not confirmed in this
  pass; the model card/repo would need a direct read before relying on the
  "MIT/Apache" pattern seen elsewhere in this list. Landmark-driven control
  (rather than raw video diffusion) is also a good conceptual fit for driving
  gaze/expression parametrically, similar to (c).
- **AniPortrait.** Code is **Apache-2.0**, confirmed directly from the
  repository's own `LICENSE` file
  ([Zejun-Yang/AniPortrait LICENSE](https://github.com/Zejun-Yang/AniPortrait/blob/main/LICENSE)).
  It is audio-driven ("Audio-Driven Synthesis of ... Portrait Animation") and
  its own title and abstract describe **photorealistic** portrait animation —
  no stylised/anime evidence was found for it in this pass; **not
  recommended** on current evidence, though the clean Apache-2.0 licence
  makes it worth a cheap spot-check if the orchestrator wants a second data
  point on anime generalisation before ruling it out.
- **HelloMeme.** Repository located
  ([HelloVision/HelloMeme](https://github.com/HelloVision/HelloMeme)); its
  licence was **not determined** in this pass and no stylised-face evidence
  was found — **UNVERIFIED** on both counts, not enough to evaluate.
- **SkyReels-A1.** Code and weights are public
  ([SkyworkAI/SkyReels-A1](https://skyworkai.github.io/skyreels-a1.github.io/)),
  and the project claims to beat LivePortrait and Follow-Your-Emoji on
  "image and motion quality" in its own materials — this is the project's
  own claim, not independently verified here, and no anime-specific evidence
  was found. Licence **not determined** in this pass — **UNVERIFIED**.
- **Sonic.** Audio-driven talking-face animation from Tencent + Zhejiang
  University; its own README states the release is **licensed for
  non-commercial use**, with commercial use redirected to Tencent Cloud's
  paid offering
  ([jixiaozhong/Sonic](https://github.com/jixiaozhong/Sonic)). No
  stylised-face evidence found. Given the non-commercial licence and the
  lack of anime evidence, **not recommended** for this project regardless of
  our non-commercial status — same reasoning round 1 used to reject
  InsightFace: relying on a non-commercial clause for a cosmetic gain, on a
  model built for photographic, audio-driven faces, is not worth adopting.

---

## Comparison table

| Candidate | Code licence | Weights licence | Fits 16 GB | Anime/painted evidence | Interactive gaze fit | Ships as | Biggest risk |
|---|---|---|---|---|---|---|---|
| (a) Layered self-rig | ours | ours (Animagine, already installed) | yes (no inference at runtime) | direct — it's our own art | best — parts move independently, real-time, deterministic | small PNG layer stack | labour: ~8h/character cut, review load |
| (a-alt) Live2D Cubism SDK for Web | free dev; **paid release licence unless indie/small-biz exempt** (likely exempt, UNVERIFIED redistribution terms) | n/a (we author) | n/a | n/a (tooling, not a model) | good, mature runtime | proprietary `.moc3` + JS runtime | new proprietary toolchain, exemption not fully verified |
| (a-alt) Inochi2D | BSD-2-Clause | n/a (we author) | n/a | n/a | good if web runtime exists | open rig format | **UNVERIFIED** mature web/JS runtime |
| (b) Wan 2.2 | Apache-2.0 | Apache-2.0 | 5B likely yes; 14B fp8/GGUF tight-to-no (~15–30 GB per expert, UNVERIFIED exact) | none found (photoreal-first) | none (baked loop only) | WebM/MP4 video texture | untested on anime; VRAM for 14B |
| (b) LTX-Video 2.5 | LTX-2.x Community (free <$10M revenue) | same | fp8 needs ≥16 GB — no headroom | none found | none (baked loop) | WebM/MP4 | tight VRAM, no anime evidence |
| (b) HunyuanVideo/FramePack | Tencent Community (MAU cap; **EU/UK/KR excluded**) | same | UNVERIFIED size | none found | none (baked loop) | WebM/MP4 | territory exclusion needs a direct read |
| (b) AnimateDiff (SDXL) | Apache-2.0 | Apache-2.0 | yes, SDXL-scale | rides on Animagine (SDXL) — best licence/model match of the video routes, not independently evidenced on anime *motion* | none (baked loop) | WebM/MP4 | motion quality on painted stills unverified |
| (c) Talking Head Anime 3/4 | weights CC-BY-4.0; code UNVERIFIED | CC-BY-4.0 | small model, likely yes | **strongest** — built for this exact task | good if parametric grid works | prerendered grid (if feasible) or runtime inference | 128×128 input convention vs. 1440px plates; output res UNVERIFIED |
| (d) LivePortrait (no InsightFace) | MIT (detectors MIT/Apache) | MIT | yes | **poor — documented failure on anime/painted styles** | good sliders, wrong generator | pose-grid texture | quality, not licence, is the blocker |
| (e) Follow-Your-Emoji(-Faster) | UNVERIFIED | UNVERIFIED | UNVERIFIED | explicit cartoon benchmark (EmojiBench) — best of the "(e)" group | landmark-driven, plausible | video or patch renders | licence not confirmed |
| (e) AniPortrait | Apache-2.0 | UNVERIFIED (likely same repo terms) | UNVERIFIED | none found; photoreal-first | audio-driven, wrong axis of control | video | no anime evidence |
| (e) HelloMeme | UNVERIFIED | UNVERIFIED | UNVERIFIED | none found | UNVERIFIED | UNVERIFIED | too little verified to evaluate |
| (e) SkyReels-A1 | UNVERIFIED | UNVERIFIED | UNVERIFIED | none found | UNVERIFIED | UNVERIFIED | too little verified to evaluate |
| (e) Sonic | non-commercial | non-commercial | UNVERIFIED | none found; audio-driven, photoreal | audio-driven, wrong axis | video | licence + no anime evidence |

---

## Downloads that would need Bailey's yes

None of these were downloaded. Sizes marked "approx"/UNVERIFIED were not
individually confirmed file-by-file in this pass.

```
animagine-xl-4.0-opt.safetensors        | already installed, 6.94 GB | n/a — already on disk, listed for reference only
MediaPipe (pip package, for LivePortraitKJ or layer-cutting) | tens of MB | Apache-2.0 | https://pypi.org/project/mediapipe/ | anime-safe face landmarks for route (a) or (d)
face-alignment (pip package)            | small (<50 MB, UNVERIFIED exact) | BSD-3-Clause (per project convention; UNVERIFIED exact) | https://github.com/1adrianb/face-alignment | InsightFace-free detector for route (d)
opencv-python (pip package, cv2)        | ~60-90 MB (UNVERIFIED exact) | Apache-2.0/MIT depending on build | https://pypi.org/project/opencv-python/ | needed by several detector/mask paths above
Talking Head Anime 3 weights            | size UNVERIFIED | CC-BY-4.0 (weights) | https://github.com/pkhungurn/talking-head-anime-3-demo | route (c), the strongest anime-specific candidate — worth a small trial download first
Wan2.2 TI2V-5B weights                  | size UNVERIFIED | Apache-2.0 | https://huggingface.co/Wan-AI (exact repo path UNVERIFIED) | route (b), lightest Wan variant, most likely to fit 16 GB
Wan2.2 I2V-A14B GGUF (Q4-Q5 quant, not Q8) | roughly half of the ~15.4 GB Q8_0 figure per expert, exact size UNVERIFIED | Apache-2.0 | https://huggingface.co/QuantStack/Wan2.2-I2V-A14B-GGUF | route (b), only if the 14B model's extra quality is wanted over 5B
AnimateDiff SDXL motion adapter         | size UNVERIFIED (motion adapters are typically small, ~100s of MB) | Apache-2.0 | https://huggingface.co/guoyww/animatediff-motion-adapter-sdxl-beta | route (b), rides on the already-installed Animagine SDXL checkpoint — best licence/model match of the video routes
Depth Anything V2 Small (carried over from round 1, still not downloaded) | 99.2 MB | Apache-2.0 | https://huggingface.co/depth-anything/Depth-Anything-V2-Small | improves round 1's route A parallax separation, unrelated to expression work
```

## Unknowns worth resolving before committing to any route

- Talking Head Anime 3/4's exact output resolution, and whether its
  parameters can be baked into a small prerendered grid rather than run live.
- Whether Inochi2D has a maintained WebGL/JS runtime we could embed without a
  native build step.
- The exact redistribution terms of the free Live2D Cubism SDK for Web
  itself (separate from the release/publication licence already found).
- HunyuanVideo's EU/UK/South Korea exclusion clause's practical meaning for a
  free, public GitHub Pages fan site.
- Exact file sizes for every Wan 2.2 variant and quant level actually
  relevant to a 16 GB card.
- Licence and any anime evidence for HelloMeme and SkyReels-A1.
