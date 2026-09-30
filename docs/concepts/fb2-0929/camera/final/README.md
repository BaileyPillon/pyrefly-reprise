# The calm camera as the default: the build

Bailey's pick, 2026-09-29 (D-291). Built on branch `firstrun-o2`. Handoff: `docs/handoff/firstrun-o2.md`.

With no parameter the game now plays `calm`, in both games. `?cam=current` (or `__pyrefly.cam('current')`)
gives the camera as it was. REDUCE MOTION still wins (every rig change a cut), and the FFX-2 enemy-intent
card rests over the boss as `calm` already did.

- `ch1-default-calm.mp4`, `ch4-default-calm.mp4`: 8 s from the first command, H.264 1280x720, seed 1,
  real Enter presses every 0.65 s, loaded with no `?cam=` (the page reported `calm`).
- `ch*-default-calm-a.jpg` / `-b.jpg`: 2.5 s and 5.5 s into each clip.
- `sheet-target-vs-default.jpg`: the approved `?cam=calm` stills (left) beside the default build (right).

Measured on this branch, 22 s from the start of each fight, 1280x720, headless Chromium on the GPU
(scripts `D:/Tools/pyrefly-scratch/picks-0929/camera/clip.mjs`, `analyze.mjs`):

| run | camera | median move | median turn | median peak / max peak | largest cut | roll peak | shakes | median frame |
|---|---|---|---|---|---|---|---|---|
| Ch. I (FFX) | default (calm) | 810 ms | 3.2° | 5 / 42 °/s | 7.1° | 0 | 0 | 16.6 ms |
| Ch. I (FFX) | `?cam=current` | 566 ms | 8.3° | 37 / 102 °/s | 17.3° | 63 °/s | 6 | 16.7 ms |
| Ch. IV (FFX-2) | default (calm) | 792 ms | 2.0° | 5 / 20 °/s | 4.9° | 0 | 0 | 16.6 ms |
| Ch. IV (FFX-2) | `?cam=current` | 560 ms | 6.9° | 38 / 62 °/s | 11.3° | 51 °/s | 5 | 16.7 ms |

These agree with the options round's `calm` numbers (`../README.md` section 5). Frame time is unchanged.
