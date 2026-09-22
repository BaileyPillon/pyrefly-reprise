# Living-portrait video preview, round 2 — Wan 2.1 FLF2V (first-and-last-frame)

**Why this round exists.** Bailey on round 1's stitched preview (2026-09-21):
"somehow the new live portrait looks even worse than before. there is
absolutely no continuity whatsoever. it looks terrible.... it needs to be
better implemented." Round 1 (`docs/concepts/pause-until-dawn/video-preview/`,
Wan 2.2 TI2V-5B image-to-video) fed the plate in as a *start* frame only and
hoped the model would drift back to it by the end. It mostly didn't:
`status.json`/`judge.md` from that pass show every clip drifting from the
plate by its last frame — a camera push-in at best (`idle-breathing`,
`smile`), a lost eye colour and a failed head turn at worst
(`turn-left-and-back`, rejected).

**The fix Bailey approved:** a first-and-last-frame model, so "every clip
must start and end on the identical frame" **by construction**, not by hoping
the model returns there. `WanFirstLastFrameToVideo` takes both a `start_image`
*and* an `end_image` — this pass sets **both to the same plate**
(`public/art/pause/yuna-ffx2.png`), so frame 1 and the last frame are pinned
to the plate and the model only has to fill in the motion between two
identical anchors.

**Model:** `wan2.1_flf2v_720p_14B_fp8_e4m3fn.safetensors` (14B, fp8), approved
for download by Bailey 2026-09-21 (checksums:
`D:/Tools/video-models/_dl/fetch-flf2v-2026-09-21.DONE.txt`) plus
`clip_vision_h.safetensors`, `wan_2.1_vae.safetensors`,
`umt5_xxl_fp8_e4m3fn_scaled.safetensors`. **No further downloads; core
ComfyUI nodes only** — nothing here uses a custom node.

**The character:** the same plate as round 1 —
`public/art/pause/yuna-ffx2.png` / `.json`. Read directly off the plate (not
assumed): facing the camera, her own **right eye is green** (screen-left) and
her own **left eye is blue** (screen-right). **The approved painting is never
edited** — this pass never writes to `public/art/pause/*.png`.

## Graph

Every input name below is read from this ComfyUI's `/object_info` (saved in
`object-info/*.json` alongside this file), never guessed:

```
UNETLoader(wan2.1_flf2v_720p_14B_fp8_e4m3fn.safetensors, weight_dtype=fp8_e4m3fn)
  -> ModelSamplingSD3(shift=8)
CLIPLoader(umt5_xxl_fp8_e4m3fn_scaled.safetensors, type=wan) -> CLIPTextEncode x2
VAELoader(wan_2.1_vae.safetensors)
CLIPVisionLoader(clip_vision_h.safetensors)
LoadImage(staged plate) x2 (start_image, end_image -- the SAME file both times)
  -> CLIPVisionEncode x2 (crop=center)
WanFirstLastFrameToVideo(positive, negative, vae, width, height, length,
  batch_size, clip_vision_start_image, clip_vision_end_image, start_image,
  end_image) -> (positive, negative, latent)
KSampler(uni_pc, steps=20, cfg=5, denoise=1) -> VAEDecode -> SaveImage (PNG sequence)
```

Tool: `tools/gen/video-flf.mjs` (imports `tools/gen/video.mjs` for
`preparePlate`/`waitForServer`/`framesToWebm`/`PLATE_PATH` — the round-1 5B
path is untouched and still works). Frame plumbing follows round 1's proven
pattern: `SaveImage` PNG sequence downloaded from ComfyUI's `/view`, then
`ffmpeg` builds the committed VP9 WebM (`framesToWebm`, unchanged).

**Size / length.** 1280x704 (round 1's size) at **81 frames, 16 fps** (the
FLF2V model's native rate) = ~5.06 s per clip. `tools/gen/video-flf.mjs`
falls back to 1024x576 on an out-of-memory error (`--width 1024 --height
576`); see the render log for which size an actual clip used.

**Join report.** For every clip, `tools/gen/join_report.py` (numpy + Pillow,
both already on this machine) computes the mean-absolute-difference (0-255
per-channel-average) between the staged plate and the clip's first and last
rendered frame, full-frame and over a fixed face box (30-70% width,
15-48% height of the frame — both eyes plus brow, resolution-independent).
Because `start_image`/`end_image` are both the plate, a well-behaved render
should show both numbers near the sensor/compression noise floor (single
digits); anything else is a real join defect, not a rounding error.

**Contact sheet.** Frames 1/20/40/60/81 at 640px wide, plus 1:1 (well,
scaled-up nearest-neighbour) crops of both eyes at frames 1/40/81, with the
join-report numbers burned into the sheet as text
(`tools/gen/video-flf.mjs buildContactSheet`). Every sheet is looked at
directly (not just trusted from the numbers) before a clip is accepted into
the set, per the brief's own rule.

**Reject rule.** A clip whose frame 1 or frame 81 differs from the plate
beyond noise (face-box MAD above ~2 levels of 255, or anything visible at
1:1 in the eye crops) is a **join failure**: recorded, one re-seed tried, and
if it still fails the clip is left out of the set rather than shown to
Bailey.

## Shared GPU / queue reality

ComfyUI at `:8188` is shared with other active work tonight (per
`AGENTS.md`/`NOW.md`: the Leblanc chapter's art and the living-portrait rig).
The queue serialises — this tool never restarts ComfyUI. This model is
substantially bigger than round 1's (14B fp8, ~16.4 GB of weights alone, vs
5B's ~10 GB) on a 16 GB card that is often already holding another agent's
model in VRAM, so ComfyUI's automatic model-offload management (paging
weight blocks to system RAM as needed) is expected to make each clip
noticeably slower than round 1's 452-1024 s/clip. Actual wall times and
VRAM readings for the clips this pass rendered are in `status.json` and each
clip's own `job.json` (`gpuBefore`/`gpuAfter` from `nvidia-smi`).

## Results

See `status.json` for the per-clip machine-readable log and the sections
below for the narrative. Reviewed clips (webm + contact sheet) that pass the
join check are copied into `clips/<name>/seed<N>.webm` +
`clips/<name>/seed<N>-contact-sheet.png` for Bailey to watch; nothing under
`D:/Tools/pyrefly-video/flf/` is committed.
