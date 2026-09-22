# Living-portrait video preview — Wan 2.2 TI2V-5B image-to-video

Bailey's brief (2026-09-21): "make it looks more natural and more fluid, yuna's
expression also needs to be animated just like in until dawn" — and, offered a
local image-to-video model as the expensive option, "I'm ok with an expensive
option for that ... Show me a preview of what you can do." This is that
preview: not the living-portrait rig, a genuine video-generation pass over the
approved plate so Bailey can watch actual motion before anyone commits to
building it into the rig.

**Character:** the same Yuna plate prototype v1 used
(`docs/concepts/pause-until-dawn/prototype/README.md`) —
`public/art/pause/yuna-ffx2.png` (2x master `yuna-ffx2.2x.webp`), sidecar
identity in `public/art/pause/yuna-ffx2.json`: brown hair with one long thin
braid, heterochromia (green + blue eye), Gunner dressphere. **The approved
painting is never edited** — everything here is a derived copy under this
folder or `D:/Tools/pyrefly-video/`.

**Reference:** `docs/plans/pause-living-portraits-motion-spec.md`, the
measured Until Dawn character-screen numbers (spring settle, blink timing,
mouth-as-busiest-region, non-periodic sway, relighting on turn). The clip set
below targets that reference's *kinds* of motion; it does not attempt to hit
every measured constant frame-for-frame — the model has its own idea of
motion, and this pass is about whether Wan's motion reads as alive at all.

## Tool

`tools/gen/video.mjs` — an API client against the same local ComfyUI as
`tools/gen/comfy.mjs`, built from `/object_info` (never guessed). Builds the
Wan 2.2 TI2V-5B image-to-video graph:

```
UNETLoader(wan2.2_ti2v_5B_fp16.safetensors) -> ModelSamplingSD3(shift=8)
CLIPLoader(umt5_xxl_fp8_e4m3fn_scaled.safetensors, type=wan) -> CLIPTextEncode x2
VAELoader(wan2.2_vae.safetensors)
LoadImage(staged plate) + VAELoader + size/length -> Wan22ImageToVideoLatent
KSampler(uni_pc, scheduler=simple, cfg=5, steps=24, denoise=1) -> VAEDecode
  -> SaveImage (PNG sequence — what the contact sheet reads)
  -> SaveAnimatedWEBP (quick-look preview)
```

Native Wan 2.2 TI2V-5B size: **1280x704 @ 24 fps, 121 frames (~5.04 s)**.

**Fitting the plate.** The plate is 1344x768 (aspect 1.750); the native frame
is 1280x704 (aspect 1.818, proportionally wider/shorter). Scaling to fill the
width (1280) makes the height 731px — 27px (3.7%) taller than 704. Rather than
letterbox, `preparePlate()` **center-crops** that 27px off the top and bottom:
the sidecar's `focal.y = 0.33` (well inside the frame, headroom above) means a
symmetric ~13px-per-edge crop cannot touch the head, and it was confirmed by
eye against the staged 1280x704 frame before any render ran.

**Deliverable format.** ComfyUI's own `SaveVideo` node exposes its container
and codec as a dynamic combo (`format` is a nested tree of choices, awkward to
fill correctly in raw API-format JSON without the frontend). Instead this
tool saves the PNG frame sequence (`SaveImage`) plus a quick WebP preview
(`SaveAnimatedWEBP`) from ComfyUI directly, then runs `ffmpeg` itself
(`framesToWebm()`) to encode the committed VP9 WebM, trying `-crf` 30, 34, 38,
42, 46 in that order (VP9 constant-quality, `-b:v 0`) until the file is under
3 MB — never relaxing quality further than the budget requires.

**Negative prompt.** The standard Wan negative prompt (Alibaba's own model
card text, the same one ComfyUI's Wan templates ship), left in the original
Chinese.

**Prompts.** Plain English, motion only, this exact painted character, no
restyling and no camera move — every prompt is suffixed with: "the camera is
locked, the background does not move, painted anime illustration style
unchanged, three-quarter view unchanged, she returns to the exact starting
pose and expression at the end of the clip" (`CLIP_SET` in `tools/gen/video.mjs`
has the per-clip motion text).

## The clip set

Two seeds each, contact sheet reviewed at 1:1 before acceptance:

| Clip | Motion |
|---|---|
| `idle-breathing` | subtle breathing, one slow blink, tiny head drift |
| `idle-blinks` | two full blinks + one half-blink, otherwise still |
| `turn-left-and-back` | head turns ~60° left, holds, returns |
| `turn-right-and-back` | head turns ~60° right, holds, returns |
| `look-up-and-back` | head tilts up, holds, returns |
| `smile` | a warm smile grows over ~0.5 s, relaxes |
| `determined` | brows lower, jaw sets, eyes narrow, relaxes |
| `hurt` | a wince, one eye closes, relaxes |
| `hair-breeze` | a light breeze moves hair and braid, face still |

## Run it

```
node tools/gen/video.mjs list
node tools/gen/video.mjs render idle-breathing --seed 1
node tools/gen/video.mjs render-all --seed 1 --seed 2
```

Renders land under `D:/Tools/pyrefly-video/<clip>/<seed>/` (frames, a
`preview.webp`, `clip.webm`, `contact-sheet.png`, `job.json` with the exact
graph parameters and wall time). Nothing under that path or `D:/Tools/tha4/`
is committed; only the contact sheets and WebM clips that pass review are
copied into this folder for Bailey to watch.

## Results (2026-09-21/22, first pass)

Full numbers and per-clip notes: `status.json`. Reviewed clips (webm + contact
sheet) are under `clips/`. Watch the webm, don't judge from the contact sheet
alone — it exists to check identity and catch a dead/static render fast.

| Clip (seed) | Wall time | Verdict | What I saw at 1:1 |
|---|---|---|---|
| `idle-breathing` (1) | 452 s | **PARTIAL — keep, disclose** | Identity holds (eyes, hair, braid, outfit). But frame 1 → 121 shows a head-angle/hairstyle change and a slight camera push-in; doesn't fully honour "camera locked" / "ends at the starting pose". |
| `turn-left-and-back` (1) | 496 s | **REJECTED** | By frame 60 her heterochromia is gone — both eyes read blue. The head also never reaches the prompted ~60° turn (a small yaw, mouth opens as if speaking). Fails the brief's own reject rule. |
| `turn-left-and-back` (101, reseed) | — | **queued, not confirmed** | Re-seeded once per the brief's rule; still in ComfyUI's queue when this pass ended. |
| `smile` (1) | 960 s | **PASS** | Best of the three: identity and framing both hold steady across the clip. The plate's own expression already reads as a soft smile, so the "grows" beat is subtle — worth watching at full frame rate. |
| `hair-breeze` (1) | >1000 s | **in progress** | Still rendering (queued behind other agents' jobs) when this pass ended; not reviewed. |
| `idle-blinks`, `look-up-and-back`, `turn-right-and-back`, `determined`, `hurt` | — | **not started** | Not yet rendered in this pass. |

**Queue reality, disclosed plainly:** ComfyUI at :8188 is shared with other
agents' work tonight (the living-portrait rig and the Leblanc chapter's art
both use it). A render landing while the queue was quiet took 452-496 s; one
queued behind other agents' jobs — which forces Wan's ~10 GB model out of
VRAM and back in — took 960-1024 s. At that rate the full brief (9 clips x 2
seeds, plus any re-seeds) is several hours of wall time on this shared GPU,
not something one pass finishes. This pass proves the pipeline end to end and
gives Bailey three real clips to judge; the rest of the clip set is queued
work for a follow-up pass, not a blocked or failed one.

**What this says about Wan 2.2 TI2V-5B for this character, so far:** it can
hold this exact painted identity (eye colours, hair, braid, outfit, art style)
across a 5-second clip when the motion is small (`smile`), but a bigger ask
(a real head turn) both under-delivered the motion and broke the identity in
the same clip — so identity is not free at every motion amplitude, and each
clip needs the same eyes-at-1:1 check the brief asks for, not a spot check.
