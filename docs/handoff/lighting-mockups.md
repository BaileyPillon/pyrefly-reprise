# Lighting mockups (branch `lighting-mockups`, never merged, never deployed)

Bailey's pick, 2026-10-05 about 21:45: "Repairs + lighting mockups", "have 2 to 3 in-game lighting mockups ready to pick from in the
morning". The idea: light the existing paintings in the engine so they look lit by the world instead of pasted on, while every
painted line stays exactly as approved. This branch is the prototype of three looks. **Game case: both** (shared plumbing); each
room's own light is data, FFX gets an anamorphic streak on its stars and FFX-2 a four-point star (our choice: the research does not
cover light on characters, Bailey should confirm the glint shape).

Branch base: `origin/main` + `origin/r391-int` merged (the figures-true colour path, D-437, is on by default there).

## Try it

```
npx vite --config tools/lighting/vite-lighting.config.mjs --port 6944 --strictPort     # dev only; serves the maps at /__lightmaps/
http://127.0.0.1:6944/?light=1                # also ?light=2, ?light=3; ?lightk=0.6 scales the strength; no flag = off, exactly as before
__pyrefly.fx.light.set({ mode: 2, strength: 1 })      # switch a running battle (0 = off); .tune({ wrap: 1.2 }); .snapshot()
```

Stop the server by its port when done (`Get-NetTCPConnection -LocalPort 6944 -State Listen`, then `taskkill /PID <pid> /T /F`).

## The three looks (all light a painting at draw time; no painted pixel is stored or replaced)

All three live in the figure's own fragment shader (`src/engine/fx/light/lightShader.ts`, injected by the MAX mix's compile hook,
`fx/mix/patch.ts`), after the contact darkening and before the flash, so a hit still reads and the light stays *light* on the
figures-true path. The driver is `fx/light/FigureLight.ts` (built by `MaxMix` only when asked); `PaintedShader.ts` and
`PaintedActor.ts` are untouched.

| | Look | What it adds |
|---|---|---|
| 1 | **Rim, wrap and glint** (no maps) | WRAP: the room's colour just outside each silhouette (a 64x36 blurred copy of the backdrop, built once per painting) bleeds into the edge, strongest on the side that faces the room's key, weighted by the painted brightness and capped at 0.38 linear; thin features (staff rings, spears) get none. GLINTS: painted highlights in a thin band at the key-facing edge, a slow shimmer (static under REDUCE MOTION). STARS: 1 to 4 hand-placed points per weapon pose (`glints.ts`), an additive layer in front that can run past the blade. Band widths are a fraction of the figure's world height, so the look holds at 2x and on a phone. |
| 2 | **Lit by the room** | Look 1 plus a soft two-tone terminator from a normal map of the pose (Depth Anything V2 Small) and the room's two nearest keys, in modulation form against the frontal reference (a pixel facing the viewer keeps the painting's colour exactly), shadow side in the room's ambient hue, floor 0.62, ceiling 1.18. A pose with no map falls back to a dome from the alpha bevel. |
| 3 | **Satsuei** (the compositing stage of anime production) | Look 1 plus a head-to-feet gradient of the room's colour (25 percent, colours softened toward white), the figure's own highlights diffused (high threshold, capped 0.15), and a glow behind each figure (an additive layer behind it, blurred alpha in the key's colour, shifted toward the key). No maps. |

Face guard (all looks): the reviewed head box of `docs/target/pose-measure.json` (`headBoxes.json`, made by `tools/lighting/heads.mjs`),
enlarged 1.7x and feathered, holds the terminator, glints and gradient off the face and cuts the wrap there. A person with no box for
a pose gets the top fifth of the silhouette at 0.55; Seymour Flux's face is placed by eye; a creature (Mortiorchis, Bahamut) has none.

Rooms: **Gagazet** (FFX Chapter I: cold moon `c5e9ff` upper left, behind) and **Bevelle Underground** (FFX-2 Chapter IV: cold skylight,
warm lamp columns left and right) are confirmed by eye in `rooms.ts`; any other room falls back to a key found in the backdrop's
own colour field (plausible, not checked). `keyFrom` in the scene rigs contradicts the painting in several rooms (Evrae, Macalania,
Bevelle Underground, Via Infinito, Djose, Den of Woe); the mockup lights from the painting, not from `keyFrom`. If look 2 or 3 is
picked, the B5 cast shadow and the shadow map should follow the same key: that changes approved B5 behaviour, so it needs Bailey's yes.

## Maps (look 2 only; never in `public/art`)

`tools/lighting/normals.py` (Depth Anything V2 Small, Apache-2.0, revision pinned, on the CPU from the local cache; RGB only, 384 px on
the long side, flat outside the figure) writes to `D:/Tools/pyrefly-scratch/2026-10-06/lighting/normals/` with a `manifest.json`;
the dev config serves them at `/__lightmaps/`. A build has none, the manifest does not load, and look 2 uses the dome. Made for:
FFX Chapter I (tidus, yuna, kimahri, seymour-flux-body, mortiorchis), FFX-2 Chapter IV (yuna-white-mage, rikku-dark-knight,
paine-warrior, ffx2-bahamut) and every FFX-2 dressphere of the three girls (so a Change keeps its terminator).
Seymour Flux's painting fills its canvas: his map is nearly flat, so his look 2 is the wrap and glints plus a gentle terminator.

## Proof and numbers (2026-10-06, this machine: Ryzen 7 7800X3D, RTX 5070 Ti, headless Chromium on the real GPU, `?crisp=fplus` pinned)

Scripts: `tools/lighting/harness/` (they import the r39-color harness by absolute path; output goes to
`D:/Tools/pyrefly-scratch/2026-10-06/lighting/`).

**Zero-light identity** (`identity-proof.mjs`, `identity-url.mjs`): the same frozen frame at 1600x900, compared pixel by pixel
(RGBA, 1,440,000 pixels). Flag off against each look compiled in at strength 0, and against each look switched off again after
running, in both chapters: **0 pixels differ, max channel difference 0**, nine of nine comparisons per chapter (the frame is also
stable against itself, 0 of 1,440,000). The same look at strength 1 differs in 243k to 733k pixels (max 247), so the check can fail.
The URL-flag path (`?light=3&lightk=0`, compiled in from the first frame) against the same session switched off: 0 of 1,440,000.

**Every pose** (`allposes.mjs`): all 50 poses of Chapter I's five figures and all 44 of Chapter IV's four, each in looks 0 to 3 on one
frozen frame: no console error, no black or NaN figure (the share of near-black pixels in a figure's box rises by 0.001 at most).
The mean luminance of a figure's box rises by up to 15 percent in Chapter IV and up to 25 percent in Chapter I, the biggest being
look 3, whose glow behind the figure sits inside the box. Poses without a map use the dome.

**Frame time** (`frametime.mjs`, `ftsum.mjs`): the GPU time of the whole composer render by timer query, looks shuffled and
interleaved over 24 rounds of 120 frames so a clock change of the machine falls on every look alike. ComfyUI had a job running on
the same GPU for part of the time (Chapter IV's runs, the first Chapter I run); the figures below are the clean runs.

| Chapter, size | off | look 1 | look 2 | look 3 |
|---|---|---|---|---|
| I (FFX), 1600x900 | 1.525 ms | +0.022 | +0.033 | +0.082 |
| I (FFX), 2560x1440 | 3.908 ms | +0.135 | +0.039 | +0.177 |
| IV (FFX-2), 1600x900 | 2.329 ms | +0.043 | +0.255 | +0.171 |
| IV (FFX-2), 2560x1440 | 5.618 ms | +0.166 | +0.095 | +0.279 |

The driver's own JavaScript costs 0.04 to 0.07 ms a frame. Every look is under 0.3 ms on this machine at either size; the rAF
interval is not a usable number here (the game does not draw on every rAF with vsync off). Not measured: a phone or a weak GPU.

## Notes for the next step

- The wrap is the look's whole edge: if look 1 or 2 reads as a halo on a dark figure in front of a bright room, lower `wrap` or
  `band` first (`__pyrefly.fx.light.tune`); every number of a look is a tune key (`FigureLight.ts`, `lightCells.ts`).
- Look 3's gradient changes colour across the whole figure (about 6 percent at the default 0.25, colours softened toward white);
  at 0.45 a white robe turned peach in Bevelle Underground, so the default stays low. It is the look's one deliberate colour change.
- Stars for the poses in `glints.ts` only; a pose with none shows the shader's edge glints alone.
- A figure whose painting fills its canvas (Seymour Flux) has no silhouette inside it, so his wrap lies only along his own edges.
- The first set of maps had horizontal stripes (a chamfer distance); the shipped method uses an exact Euclidean distance and a
  smoothed height, and caches each pose's depth (`normals/depth/`, 388 MB, scratch) so the normals can be re-derived without the network.

## Not done, on purpose

- Nothing is merged or deployed; no `public/art` file is written.
- No retargeting of B5's cast shadow or the shadow map to the painting's key (needs Bailey's yes).
- Only two rooms have a confirmed light table and only the two chapters have placed stars.
- Phones: the looks run (look 3's halo included); a phone build would drop look 2's maps and look 3's halo first.

## Mockup renders for the morning pick (2026-10-06)

Comparison sheets of today against the three looks, the same frozen frame in every tile, real keys from the title to the first
command menu, headless Chromium on the real GPU: `docs/screenshots/lighting-mockups/` (2x2 sheets, reading order today, look 1,
look 2, look 3; `sheet__<ch1|ch4>__<size>__<full|canvas>.jpg`, with and without the HUD, at 1600x900 and 2560x1440; and
`sheet__closeups__2560x1440__1to1.jpg`, upper bodies cut 1:1 from the 2560x1440 render). `index.json` there lists every file of the
round and what it shows. The stills, the 1:1 crops, the 5 s clips (webm, GIF under 8 MB, and a 4-up webm per chapter) and the scripts
are in `D:/Tools/pyrefly-scratch/2026-10-06/lighting/out/` (clips are not in the repo). Chapter I is held at its first command menu
(CTB waits); Chapter IV is Active ATB, so its stills use the first calm moment after the first menu and its clips are the live
battle, where Bahamut's next attack lands in every clip. Today drawn again after the three looks equals the first today frame, pixel
for pixel, in all four sets.
