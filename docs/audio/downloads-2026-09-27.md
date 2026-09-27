# Downloads, 2026-09-27 (Direction B score re-render)

Bailey allowed downloads onto D: for this work (2026-09-27 ~00:50 EDT: "you can
download whatever you need but on the D: drive you have my permission").

**Nothing was downloaded.** The render used the model already on disk:
`D:/Tools/ComfyUI/ComfyUI/models/checkpoints/ace_step_v1_3.5b.safetensors`
(7 699 743 341 bytes, on disk since 2026-09-21), which is the model that made
the clip Bailey picked.

## Newer official release, checked and not taken

Checked 2026-09-27 against the Hugging Face API for the ComfyUI repackage
`Comfy-Org/ace_step_1.5_ComfyUI_files` (split_files/): ACE-Step 1.5 exists as
`acestep_v1.5_base` and `acestep_v1.5_turbo` (4 787 825 604 bytes each), XL
variants (`acestep_v1.5_xl_base_bf16`, `acestep_v1.5_xl_sft_bf16`, about 9.97 GB
each), plus its own VAE (`ace_1.5_vae`) and Qwen text encoders
(`qwen_0.6b_ace15`, `qwen_4b_ace15`). ComfyUI 0.35.0 here already has the 1.5
nodes (`TextEncodeAceStepAudio1.5`, `EmptyAceStep1.5LatentAudio`,
`ReferenceTimbreAudio`) and a text-to-audio blueprint.

Why it was not downloaded: Bailey picked a sound by ear, and that sound is v1
3.5B at denoise 0.40. v1.5 is a different model with a different VAE and
latent (48 kHz, 64 channels), so it would be a new direction, not a better
render of the picked one, and no agent can hear whether it is better (hard
rule 13). If Bailey wants it tried, it is one download of about 15 GB
(turbo + VAE + encoders) and a side-by-side clip for his ear.
