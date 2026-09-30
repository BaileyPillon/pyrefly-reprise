# Downloads for the eye-candy options round (2026-09-29)

Everything is on D:. Nothing was installed into ComfyUI. Bailey's standing permission covers official sources on D:
(2026-09-27: "you can download whatever you need but on the D: drive").

| What | Source (official) | Revision | Size | sha256 | Where | Date | Used by |
|---|---|---|---|---|---|---|---|
| Depth Anything V2 **Small** (`model.safetensors` plus `config.json`, `preprocessor_config.json`, `README.md`) | Hugging Face `depth-anything/Depth-Anything-V2-Small-hf` (https://huggingface.co/depth-anything/Depth-Anything-V2-Small-hf) | `5426e4f0f36572d16453bbda7a8389317b1bef99` | 99,173,660 bytes (weights) | `3152477ce0d8d6978d76b995120de97cb5b928701fd0f817769f59e249a16b70` (weights, the LFS hash) | `D:/Tools/pyrefly-scratch/eye-candy/hf/hub/` (HF cache; `HF_HOME` pointed there) | 2026-09-29, 12:36 EDT | Option B, `tools/fx/depth.py` |

Licence: Apache-2.0 for the **Small** weights only. The Base and Large weights are CC-BY-NC and are not used.

The model runs on the CPU in ComfyUI's embedded Python (`transformers` 5.15, `torch` 2.13 already installed there), so
it never queues on the GPU. It read the four approved backdrops and wrote only the derived greyscale depth maps in
`public/fx/<scene>/depth.png`. Each map has a `depth.json` beside it with the source PNG's sha256, the model and
the revision.
