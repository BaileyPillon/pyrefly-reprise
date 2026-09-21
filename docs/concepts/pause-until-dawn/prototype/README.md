# Living portrait — a feel test for the Until Dawn pause screen

A still cannot answer "does she feel alive, and is driving her gaze fun?", so this
is the rung of the ladder that can: **a minimal interactive prototype**
(AGENTS.md rule 9). It is a throwaway. It is not the layout mockup — that lives
beside this folder and belongs to another agent — and none of this code is meant
to be merged as-is.

**Nothing was downloaded and no dependency was added.** Plain HTML plus one
WebGL2 fragment shader, ~530 lines, no build step.

## Run it

```
cd "D:\Final Fantasy"
npx vite --port 5477
```

then open <http://127.0.0.1:5477/docs/concepts/pause-until-dawn/prototype/>

Any static server rooted at the repo works too. `file://` does **not**: WebGL
refuses to upload a texture from a local file.

## Controls

| Key | What |
|---|---|
| arrows / `WASD` / mouse / right stick | turn her gaze |
| `E` | cycle state: calm → determined → hurt |
| `B` | blink now |
| `R` | toggle reduced motion |
| `F` | frame-time diagnostics |
| `H` | hide the legend |

Let go for ~1.4 s and she starts looking around on her own.

## The painting

`public/art/portraits/yuna-x2.png` — Bailey's own pick of 2026-09-21 (card 3),
referenced by relative path. **Nothing was copied into this folder** and no art
is committed here; `public/art/` stays gitignored.

The rig reads `src/ui/common/face-crops.json` at runtime for her eye positions
and inter-pupil distance, so every number below is a multiple of measured data,
not a magic constant. Every painting in the roster already has such a row.

## What is real

- **The depth is procedural.** A face ellipsoid, a hair shell, a nose lobe and a
  chest dome, all sized in multiples of the measured ipd and gated by the
  cut-out's own alpha. No depth model, no download.
- **Gaze** moves near surfaces more than far ones (parallax), plus a horizontal
  squash across the head so it reads as a turn rather than a slide. The irises
  get their own local warp and travel ~1.6x further than the head, so the eyes
  lead. Critically damped spring, ~11° equivalent at full deflection.
- **Always-on life:** breathing (chest most, head a quarter as much), masked
  noise sway in the hair and cloth that never crosses the face core, micro head
  drift, a slow camera push, motes, grain, and an idle look-around with
  occasional saccades.
- **State changes the body, not the paint:** resting lid aperture, breathing rate
  and depth, blink frequency, and the colour grade.
- **`prefers-reduced-motion`** freezes all of it: static portrait, gaze snaps,
  no drift, no blinking. Verified in both modes.

## What is FAKED, and what the real build must paint

1. **The blink.** There is no closed-eye painting, so the lid is drawn: a patch
   of her own cheek skin, shaded, curved, with a lash line along the closing
   edge. It reads at 90 ms and at real screen size; at 4x zoom it is obviously
   synthetic. **The real build needs an inpainted closed-eye variant** of each
   painting. Two earlier attempts stretched strips of the painting downward
   instead and both failed the same way — any painted line inside the source
   strip (her eyebrow, then the eyelid crease) smears into a black bar across
   the eye. Do not retry that approach.
2. **The expressions.** `E` changes lid aperture, breathing and grade. That is a
   *proxy* that shows how state should read and how it should be driven; it is
   not a change of expression. The real build cross-fades to an inpainted
   variant (pained, determined). The hook is the same texture unit.
3. **The eye anatomy is per-painting and measured by hand here.**
   `face-crops.json` records the pupils but not the lash lines, so `TUNE.eye`
   holds five numbers read off this painting's own pixels. The real build needs
   an `eyeBox` row per character.
4. **Level eyes.** Her pupils are 3.4° off level, so a horizontal lid sweep is
   fine. Wakka's are 22° off; his lid must follow the eye line. Auron and
   Kimahri show one eye. This rig handles neither yet.

## Shots

`shots/` — `01-centre`, `02-look-left`, `03-look-right-up`, `04-mid-blink`, the
two fight states, and two montages of the frames a still cannot show
(`07-blink-sequence`, `08-gaze-sweep`).

## Measured

GPU draw, real GPU, 1440x810, gaze held off-centre: **p50 0.036 ms, p95
0.058 ms, max 0.068 ms** (`EXT_disjoint_timer_query_webgl2`, 240 samples) —
about 0.35% of a 60 fps frame. `perf-swiftshader.json` holds the headless
SwiftShader run, which is a CPU rasteriser and not representative.

Real-input check: 24 assertions over actual key events in both motion modes —
arrows and WASD turn the gaze, it springs back, idle drift resumes, `E` cycles
state, `H` toggles, no page errors — all passed.
