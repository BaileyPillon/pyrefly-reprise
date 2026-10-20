# Demo looks (conference demo, 2026-10-19)

**Game case: BOTH games (shared plumbing); dev flag only; nothing ships.** Branch `demo-look`, made from `origin/r59-rc` (6db09ac86).

Bailey, 2026-10-19 ~21:50 EDT: "I need a way to quickly improve the graphical fidelity of the game as well as the motion, animation, visual style. I demo my game in a
week at a huge gaming conference." His picks: "One FFX + one FFX-2 chapter", "Show me 3 looks in-game tomorrow", "This PC", "Yes, use the GPU" (decision 150). These
are OPTIONS for him to pick from (AGENTS hard rule 9); none of this is the product until he picks.

## What it is

Three post-processing looks over the existing renderer, chosen by the address (no flag = today's look, byte for byte; nothing is built):

| Address | Look | What it does |
|---|---|---|
| `?look=hd2d` | Octopath-style diorama | a tilt-shift depth of field that keeps the fighters sharp (mask-aware, with bokeh on bright points), soft selective bloom, light shafts from the backdrop's own light, drifting motes in three layers, a warm/cool grade, a gentle vignette |
| `?look=cinematic` | painterly, Expedition-33-like | a strong colour grade per room (a 3D LUT from the room's palette), drifting fog between backdrop and fighters, a key-coloured rim on the silhouettes, film grain at 24 steps, a trace of chromatic aberration, a deeper vignette |
| `?look=anime` | crisp | more saturation and contrast, clean sharpening, a thin ink outline round every figure, bloom on effects only, no grain, no blur |

Quality: `?lookq=high|medium|low`. While `?look=` is in the address, `F6` cycles off / hd2d / cinematic / anime live and `F7` cycles the quality. The console:
`__pyrefly.look` (`set`, `get`, `quality`, `param(path, v)` for a live override of one number, `debug('mask')`, `stats()`).

## Where it lives

`src/engine/look/`: `LookConfig.ts` (the address, the presets as data, the quality tiers), `LookState.ts` (the switch), `LookRig.ts` (the passes and the per-frame
values), `LookRoom.ts` (the room's painting, light and LUT), `LookGrades.ts` (the LUT recipes, per room), `LookLight.ts` (finds the painting's light), `LookMaths.ts`
(the maths the shaders mirror), `LookBlurShader.ts` and `LookMainShader.ts` (GLSL). `src/debug/lookApi.ts` is the console API. `Renderer.ts` has three lines of hook
and `GoldenHour.ts` one exported getter. Unit tests: `tests/unit/look-presets.test.ts`, `tests/unit/look-maths.test.ts`.

The figure mask is the frame's alpha (`BloomMask.ts`: 0 where a painted figure covers the pixel); every look that needs "the figures" (the blur, the fog, the rim, the
outline) reads it, so none of them needs a second scene render. The HUD is DOM above the canvas and is untouched.

While a look is on, the eye-candy sub-effects it replaces (option A's depth of field, shafts, streaks, look LUT, rim; option B's plate focus for anime) are switched
off and put back when it goes.
