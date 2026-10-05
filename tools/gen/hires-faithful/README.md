# hires-faithful: backdrop masters that cannot draw what the painting does not imply (release 39, r39-art lane, 2026-10-04)

Game case: both games, one shared recipe over backdrops; each backdrop keeps its own game (Gagazet, Garden of Pain, Via Purifico: FFX only; the Road to the Farplane and its
links variant, Chapter XI: FFX-2 only; `title` is drawn by no screen today). Python with numpy, scipy, Pillow and scikit-image (the ComfyUI embedded python:
`D:/Tools/ComfyUI/python_embeded/python.exe -s`). Paths are the owner's machine's.

Why: the library recipe (RealESRGAN, and for Gagazet the SDXL refine on top of it) turns a soft ripple, a speckle or a faint crack of a painting into a crisp dark line, so six
backdrop masters drew twig-like cracks (Gagazet) or ruled stripes (Garden of Pain, Via Purifico, the Road to the Farplane and its links variant, the title's water) that the
approved painting does not have. They were held back (`HELD_BACKDROPS`, now empty) until they were re-made this way.

| script | what it does |
|---|---|
| `make_e.py` | whole-backdrop ESRGAN images at 2x (RealESRGAN_x4plus and the anime 6B model, Lanczos from the model's 4x), tiled at 512 px with a 24 px margin, through ComfyUI under the shared GPU lock and the PAUSE-GPU gate |
| `fd.py` | the recipe: carrier = bicubic 2x of the painting; ESRGAN's detail relative to the carrier (low frequencies removed, so the tones stay the painting's) is squashed per pixel by tanh to an amplitude the painting allows (a0 + kappa x the local rms of the painting's own fine detail); thin dark lines the painting does not imply (a pixel darker than its 11x11 mean that the carrier has no ridge for within 2 px) are blended back to a bounded adaptive unsharp master. Variants A (adaptive unsharp), B (correlation gate), C (line eraser), D (amplitude cap) are all there; D with the eraser is the recipe |
| `fd_full.py` | the recipe over a whole backdrop (banded, about a gigabyte), the library QC (`qc.likeness_rgb`, backdrop thresholds), the line metrics and the report |
| `linemetric.py` | hairline density and long horizontal dark runs against the painting (bicubic up), the worst windows; they rank windows to look at, they do not replace looking |
| `lib_backdrops.py` | the records of the six masters in the r39 library manifest (`D:/Tools/pyrefly-art-backup/hires-r39-art/manifest.json`, the shape `tools/hires-install.mjs --lib` reads) |
| `run_jobs.py` | runs the library's own jobs (`hires_lib.gpu_plain` / `gpu_refine` / `finish_job`) for chosen ids and tiers under the shared GPU lock and PAUSE-GPU, and merges the records into the library manifest (what the overnight driver does; never run it beside the driver). Used for Evrae's masters from the E1-H paintings |
| `fig_to_lib.py` | after `run_jobs.py` and `tools/gen/hires-alpha-fix/batch.py` (`R39_ART=<tree> R39_FIXED_OUT=D:/Tools/pyrefly-art-backup/hires-r39-art ... --ids a,b`), writes the repaired figure masters' records into the r39 library manifest |
| `qc_held2x.py` | the likeness QC and rim metrics of the held D-315 2x masters against the installed library 2x masters |
| `gpu_watch.py` | keeps the overnight refine batch polite about the driver's PAUSE-GPU file (writes hires/STOP while it exists, starts the supervisor again when it is gone) and stops it for good at 08:00 on 2026-10-05 |
| `r39lib.py` | the lane's helpers: the GPU gate (PAUSE-GPU, the shared lock, a stale-lock cleaner), ESRGAN through ComfyUI, the r39 library manifest |

Run (after `make_e.py <keys>`): `fd_full.py <key>` per backdrop, `lib_backdrops.py`, then
`node tools/hires-install.mjs --lib D:/Tools/pyrefly-art-backup/hires-r39-art --only backdrops/ --scales 2 --apply` and `node tools/gen/manifest.mjs`.
