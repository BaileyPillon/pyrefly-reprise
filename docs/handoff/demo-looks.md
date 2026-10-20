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

## Light on the paintings (the maps lane's normal maps; hd2d and cinematic only)

Driver, 2026-10-19 ~23:30: "light the painted figures with their normal map: a key light matching the backdrop plus a rim from behind. Spells and the orb should cast a coloured
point light on nearby figures (Fire = orange, Thunder = yellow-white, Blizzard = cyan, the orb = green). Keep the lighting subtle enough that the painting's own shading stays the
base, roughly a 25-40 percent lift and shade, never flat black. Figures with no map fall back to unlit."

- The maps are `D:/pyrefly-art-maps` (`MAPS-README.txt` there): a mirror of `public/art`, `<pose>.normal.png` and `<pose>@2x.normal.png`, OpenGL tangent space of the billboard. The game asks for
  them next to the painting (`RelightConfig.normalMapUrl`); the dev server of the demo harness serves those names from the mirror (a `configureServer` middleware in the scratch Vite config), so
  copying the mirror into `public/art` is all a build needs.
- `engine/shaders/PaintedShader.ts`: a `PAINTED_RELIGHT` block (compiled only into a material that defines it): the normal in view space from the plane's own axes (`vNR`, `vNU`, `vNF`, so a
  mirrored figure is right), a gain `1 + key * (n.L - flat.L)` clamped to a band (0.6 to 1.4: never flat black), a rim from behind, and four coloured point lights (the frame's uv, a reach, a
  strength), each added in proportion to the painting's own colour. A pose with no map: `relightOn` 0, the block is skipped.
- `engine/look/relight/`: `RelightConfig.ts` (pure: the parameters per look, the colours per effect, the envelopes, the directions, the map URL), `FigureRelight.ts` (the shared uniform cells, the map
  cache, `bindRelight`, called by `PaintedActor.applyPose`; a no-op without a look flag), `RelightLights.ts` (the spell and orb lights). `fx/spellTaps.ts` gained `landListeners` and `notifyLand` (A's own tap
  is unchanged); `fx/orbLight.ts` is the registry of item orbs.
- What it does NOT light: rigged figures (Lulu, Ifrit, Valefor, Pterya are drawn from part textures, whose UVs are not the idle painting's), figures with no maps, the backdrops. Anime stays flat.

## What each look does (passes and numbers; `engine/look/LookConfig.ts` is the source)

All three run after the bloom and the stock tilt-shift and before the grade, in the chain's linear light, and read the figure mask (the frame's alpha). While one is on, A's DOF, shafts, streaks, look LUT and rim are off.

| | hd2d | cinematic | anime |
|---|---|---|---|
| Depth of field | mask-aware tilt-shift (13 taps a pass, jittered): far 10 px, near 7 px at 900p, band centre 0.36 to 0.4, bokeh weight on bright points; figures never blurred, never smeared | the same pass, far 3.4 px, near 2.4 px | none |
| Bloom | selective, threshold 0.6, strength 0.9, radius 0.8, warm tint | selective, 0.72, 0.6, 0.6 | plain luma cut at 1.0: effects only (painted paint never reaches 1.0) |
| Light | shafts from the room's own light (found from the painting: a blob detector over its pixels), 40 samples, beams from noise; three layers of drifting motes | two layers of drifting fbm fog (thick low, thinning to 70 percent of the frame, mostly behind the figures), key-coloured rim on the silhouettes (edge ring over the mask, toward the light), chromatic aberration 0.9 px at the corner | a thin ink outline round every figure (the mask blurred over a ring: a smooth contour, no threshold, so no jaggies), unsharp mask 0.8 |
| Grade | LUT: low-pivot S-curve 0.2, cool blue shadows, warm gold highlights, saturation x1.12 x1.12; vignette +0.1 | LUT per room (Ch I: teal-black shadows, silver-gold highlights, saturation 0.72; Ch IV: violet-black shadows, amber highlights, 0.8), contrast 0.74 / 0.66; vignette +0.42; grain 0.055 at 24 steps | LUT: contrast 0.46, saturation x1.18 x1.12; no grain, no vignette |
| Figures | normal-map relight (key 0.9, rim 0.7, coloured point lights) | normal-map relight (key 1.0, rim 0.9, point lights) | flat |

The relight's gain is clamped to 0.58 to 1.4 (never black), so a surface tilted by a third lifts or shades the painting by a quarter to two fifths.

## Frame cost (RTX 5070 Ti, headless GPU, release 59 candidate; scratch `tools/perf.mjs`)

Mean ms for the post chain plus the scene draw, 240 frames back to back with a GPU sync at the end (today's own cost is the "off" row), and the rAF interval p50 / p95 / p99 over about 480 frames of the game running on its own (the budget is 16.67 ms):

| | 1600x900 off | hd2d | cinematic | anime | 2560x1440 off | hd2d | cinematic | anime |
|---|---|---|---|---|---|---|---|---|
| Ch I Seymour Flux (pinned rung a2) | 1.16 | 1.82 | 1.17 | 1.17 | 2.68 | 5.10 | 3.00 | 2.61 |
| Ch IV Bahamut (pinned rung a2) | 2.08 | 2.21 | 1.94 | 1.94 | 3.27 | 5.50 | 3.53 | 3.14 |
| Ch I, the game's own sharpness ladder (supersampled) | | | | | 5.48 | 7.52 | 5.77 | 5.58 |

The rAF interval is 16.7 / 16.7 to 16.8 / 16.8 in every cell (locked 60 fps); one 50 ms hitch showed in Chapter IV's "off" at 2560x1440 and none under a look. hd2d is the dearest (the blur, 40 shaft samples and nine mote cells a layer): +2.4 ms at 1440p. Quality `low` drops the blur (the stock tilt-shift takes over) and trims the taps.

## Known limits

- The maps lane's normal maps cover the FFX party, the bosses of Chapters 1 to 5 and the FFX-2 first dresspheres; a figure with no map (a rig's part textures, Chapter VII's guardians) is lit by nothing and stays as it was.
- The title screen is DOM, not WebGL, so a look cannot run on it live: the demo stills compose the picture through the same shaders (`tools/zz-demolooks-title.tmp.html`, scratch) and lay the real UI over it.
- A battle capture taken on a paused page clock still has CSS animations on real time (HUD panels fade on their own), so two runs can differ by a panel's opacity.

## Checked by hand (2026-10-20)

- Real keys: `F6` cycles off, hd2d, cinematic, anime and `F7` cycles the quality, in a real page, with no console errors.
- The coloured point lights reach the shader (`__pyrefly.look.stats().relight.lights`): a cure on Tidus puts a green light at his position at strength 0.8, fire an orange one, ice a cyan one; the light starts when the blow lands in the drawn effect and follows its envelope (`RelightConfig.POINT_KINDS`).
- Default off: with no `look` key in the address `lookState.armed` is false, `Renderer` never builds the rig, `bindRelight` returns at once (no `PAINTED_RELIGHT` define, so every figure program is the one it was) and the shader strings are unchanged except for the two `#ifdef` blocks. A pixel comparison against the pre-change build was not possible on the scratch harness (a flag-free run differs from another by the opening camera's real-time easing).
- The three goldens (`ff7-golden`, `ffx-engine-golden`, `ffx2-atb-golden`) and 114 related unit files (1399 tests) pass; `tsc --noEmit` is clean.

## Bold strength (2026-10-20): `?lookstrength=bold`

**Game case: BOTH games (shared plumbing); dev flag only; nothing ships.** Driver, 2026-10-20: pass 1's looks read as "a slight grade" on a conference floor and the normal-map light was nearly invisible, so hd2d and cinematic get a second, bolder table. The default is still pass 1, byte for byte (`lookParams(name, 'subtle')` returns pass 1's own object; `tests/unit/look-bold.test.ts` pins it). Anime is unchanged. `F8` flips subtle / bold live; `__pyrefly.look.strength('bold')`; `?lookdrift=1` adds the backdrop drift (its own flag: the battle camera's grammar is a separate approved test).

What bold changes (the numbers are `LookBoldConfig.ts`, the grades `LookGradesBold.ts`):

| Item | Bold |
|---|---|
| Light on the paintings | relight gain band 0.45 to 1.7 (pass 1: 0.6 to 1.4), key 1.35 / 1.45 (0.9 / 1.0), coloured spell and orb lights at 1.8 with a reach of 0.34 (0.9, 0.24); a bright rim along each figure's **back edge** in the room's key colour (post pass, only edges that face the light; Ch I icy cyan-white, Ch IV cyan); a coloured **pool of light on the floor** under the target of every spell and the orb (screen-space ellipse at the target's feet, sized to the effect: fire orange, ice cyan, cure green) |
| Grounding | a soft **contact shadow** under every figure: an ellipse from the figure's own base width (read once per painting from its alpha), darker core under the feet, leaning away from the light, fading when it hops or hovers; a **floor reflection** (the figure flipped about its foot line, blurred more with distance, faded and cut off at half a figure's height, never over another figure) only where the floor is glossy: Chapter IV yes (gloss 0.8), Chapter I no |
| Atmosphere | shafts 2.2x gain (broad beams, fewer, from the room's own light; cinematic gets them too), a **stage light** (the fight lifted, the room round it darkened, light sources spared), **far fog from the backdrop's depth map** (`D:/pyrefly-art-maps/backdrops/<room>.depth.png`, through a frame-to-painting homography) and a height fog that thickens toward the floor, a trace of mist at the feet and nothing over a face; larger, glowing motes (size 4.6 px, glow, more of them); **embers** rising from Chapter IV's four lamps |
| Depth | far blur 20 px at 900p (10) for hd2d, 9 px (3.4) for cinematic, bokeh on bright points; **every actor's screen box stays razor sharp** (the blur skips each actor's box, party and foes, and never gathers from it, so a boss whose alpha a hit flash raised does not blur or ghost); `?lookdrift=1`: the painting and its parallax layers drift by up to 3 px on a 24 s sine, the nearer layers a touch more, **still while a command menu is open** |
| Grade | per-room recipes with hue pulls (`LookGradesBold.ts`): Chapter I's blues pulled toward cyan so the ice stays luminous, the floor deep rather than flat; Chapter IV: shadows violet, lamps pulled toward amber, the skylight toward cyan |

Files: `LookBoldConfig.ts` (tables, rooms, pure maths: homography, base extents, stage ellipse, drift), `LookBoldShader.ts` + `LookBold.ts` (the extra pass and its per-frame work), `LookDrift.ts`, `LookGradesBold.ts`, `look/relight/RelightLights.ts` (floor pools), `LookBlurShader.ts` (actor boxes), `LookMainShader.ts` (cinematic shafts and motes, mote glow, beam frequency: all off at pass 1's values). Console: `__pyrefly.look.param('bold.fog' | 'bold.pool' | 'bold.rim' | 'bold.gloss' | 'bold.embers' | 'bold.shadow' | 'bold.stage', k)` scales one effect; `__pyrefly.look.recipe({...})` overrides the grade live; `stats().bold` lists the figures the pass found.

A finding about pass 1: the grade LUT has no tone map of its own, so a recipe's exposure of 1.0 to 1.1 lifts Gagazet's floor blue from about 150 to 240 (clipped, flat electric blue, painted detail lost). Bold's recipes are exposed lower (Chapter I hd2d 0.7, cinematic 0.54) so the floor lands near today's and the cave glow stays bright. Pass 1's values were left alone.

Frame cost (RTX 5070 Ti, headless GPU, release 59 candidate, `perf.mjs`; render ms is the post chain plus the scene draw, 240 frames with a GPU sync; rAF is p50 / p95 / p99 over about 480 frames):

| | 1600x900 off | hd2d bold | cinematic bold | 2560x1440 off | hd2d bold | cinematic bold |
|---|---|---|---|---|---|---|
| Ch I Seymour Flux | 0.73 | 1.21 | 1.31 | 1.25 | 3.22 | 3.16 |
| Ch IV Bahamut | 1.54 | 1.59 | 1.63 | 1.54 | 3.44 | 3.43 |

rAF 16.7 / 16.7 to 16.8 / 16.8 in every cell but one (Chapter IV "off" at 1440p showed one 33 ms frame at p99, in today's own look): locked 60 fps. Bold costs about 2 ms more than today at 1440p.

Limits: the depth fog and the reflection need `<room>.depth.png` and a gloss entry (`ROOM_BOLD`); a room with neither gets the height fog and no reflection (only Chapters I and IV are authored). The contact shadow and box tracking cover painted figures, not rigs' part textures (they still have the box, from their plane). The floor pool is a screen-space ellipse at the target's feet, not a 3D decal, so it ignores the floor's perspective beyond the fixed squash. The drift moves the painting's plates by a few pixels; a painting's own edge (Chapter IV's right edge) shows a hair more on one side. Captured and tuned for 16:9; the stills and clips are in `D:/Tools/pyrefly-scratch/2026-10-20/demo-looks-bold/`.
