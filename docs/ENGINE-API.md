# Engine API

Contracts the rest of the project builds against. Anything marked **stable** is
imported by other agents' folders; change it only with a note in
`docs/CONTRACT-CHANGES.md`.

Everything in `src/engine/` is presentation. It never imports from `battle/`,
and the battle engines never import from here (see the layering rule in
`ARCHITECTURE.md`).

---

## `SpriteActor` — **retired**, the pixel path's target

`src/engine/SpriteActor.ts`

> **Retired.** The game moved to painted 2.5D; `PaintedActor` below is the live
> actor class and the one to build against. `SpriteActor` is unreachable from
> `src/main.ts` and is kept only because `PaintedActor`'s API was modelled on
> it, so this section documents the shape both share. Do not add to it.

A `THREE.Group` holding one billboarded plane plus a blob shadow. It owns a
small animation state machine and a set of effect helpers. It never rasterises
anything itself: the sprite pipeline hands it finished canvases.

### Factory

```ts
SpriteActor.fromCanvases(
  frames: Record<string, HTMLCanvasElement[]>,
  opts?: SpriteActorOptions,
): SpriteActor
```

- `frames` maps a **state name** (`idle`, `ready`, `attack`, `cast`, `item`,
  `hurt`, `ko`, `victory`, `defend`, plus per-boss states) to that state's
  ordered frames. All frames of one state must share dimensions; different
  states may differ. An empty list is ignored.
- Each canvas becomes a `THREE.CanvasTexture` with `NearestFilter`, no mipmaps
  and `SRGBColorSpace`, so pixels stay crisp and colours stay as authored.
- The plane is sized **pixel-perfectly** from the canvas: a 48x64 canvas at the
  default `logicalPixelSize` of `0.03` is 1.44 x 1.92 world units.

```ts
interface SpriteActorOptions {
  name?: string;                    // also set on the Group
  logicalPixelSize?: number;        // world units per sprite pixel, default 0.03 (LOGICAL_PIXEL)
  anchor?: 'feet' | 'center';       // default 'feet': the group origin sits on the ground line
  anchorOffsetPx?: number;          // feet anchor only: empty logical pixels below the feet line,
                                    // sunk so the feet (not the canvas edge) touch the ground.
                                    // buildSpriteActorInput() derives it from SpriteDef.anchor.
  initialState?: string;            // default 'idle', else the first state supplied
  frameDurationMs?: number;         // default 160, used where a state gives no timing
  states?: Record<string, SpriteStateOptions>;
  shadow?: boolean | { radiusPx?: number; opacity?: number; color?: number };
  facing?: 1 | -1;                  // 1 = faces +x ("right"), -1 flips the billboard
  billboard?: boolean;              // default true: yaw toward the camera each render
  brightness?: number;              // flat multiplier, default 1
}

interface SpriteStateOptions {
  durationMs?: number;   // ms per frame for this state
  durations?: number[];  // per-frame ms, index-aligned with the frame list
  loop?: boolean;        // default true; a non-looping state holds its last frame
  next?: string;         // state to fall through to when a non-looping state ends
}
```

### Instance API

| Member | Meaning |
| --- | --- |
| `setState(name, { restart?, onComplete? })` | Switch animation state. Re-entering the same state is a no-op unless `restart`. `onComplete` fires when a non-looping state reaches its last frame. |
| `state` / `stateNames` | Current state name; all known state names. |
| `update(dt)` | **Must be called every frame**, `dt` in seconds. Advances frames, tweens and shake. |
| `flash(colour?, ms?)` | Blend the sprite toward `colour` (default white) and back. Hit feedback. |
| `shake(px?, ms?)` | Damped jitter in logical pixels; leaves `position` untouched. |
| `fadeTo(alpha, ms?, easing?)` | Promise; tweens sprite + shadow opacity. |
| `setAlpha(alpha)` | Immediate opacity. |
| `moveTo(pos, ms?, easing?)` | Promise; tweens `position` to a `Vector3`-like. |
| `setFacing(1 \| -1)` | Flip the billboard horizontally. |
| `setBrightness(mult)` | Multiplies the constructor `brightness`. |
| `plane`, `shadow`, `tweens` | The mesh, the blob shadow (or `null`), and the actor's `TweenGroup`. |
| `dispose()` | Releases textures, geometry, material and detaches from the parent. |

`easing` is an `EasingName` from `Tween.ts` or a raw `(t: number) => number`.

### Contract notes for the sprite pipeline

1. Hand over `HTMLCanvasElement`s, already at logical pixel size (party 48x64,
   aeons 96x96–160x128, bosses 128x160–256x192). Do not pre-scale.
2. Draw with a transparent background; fragments below alpha 0.02 are
   discarded, which is what keeps the pixel silhouette hard-edged.
3. Keep every frame of a state the same size. Size changes between states are
   fine (the plane is re-scaled per frame).
4. Do not mutate a canvas after handing it over unless you also set
   `texture.needsUpdate` — `fromCanvases` snapshots each canvas into its own
   texture at call time.

---

## `Renderer`

`src/engine/Renderer.ts`. Owns the `WebGLRenderer`, a `PerspectiveCamera`
(fov 34 by default) and the post chain:

```
RenderPass -> UnrealBloomPass -> TiltShift(horizontal) -> TiltShift(vertical) -> Grade
```

- Bloom: threshold `0.90`, strength `0.50`, radius `0.55` by default; every scene overrides them through its `ScenePalette` (see **Painted 2.5D** below).
- Tilt shift: `src/engine/shaders/TiltShiftShader.ts`. Blur radius grows with
  the distance from a horizontal focus band in screen-space Y, nine taps per
  pass. Uniforms: `focus`, `bandWidth`, `maxBlur`, `falloff`, `direction`,
  `resolution`.
- Grade: `src/engine/shaders/GradeShader.ts`. `lift` / `gamma` / `gain`
  (`Vector3` each), `saturation`, `vignette`, `vignetteRadius`, `dither`.

```ts
const renderer = new Renderer({ container, fov: 34, maxPixelRatio: 2 });
renderer.applyPost({ bloomStrength: 0.7, tiltFocus: 0.38 });
renderer.render(scene, camera);   // camera defaults to renderer.camera
renderer.resize();                // also wired to window resize
```

Resize handles `devicePixelRatio` (capped by `maxPixelRatio`) and feeds the
tilt-shift its texel size.

## `BattleCamera`

Named rigs with position + lookAt (+ optional `fov`, `sway` multiplier),
smooth tweens between them, and a permanent gentle idle sway.

```ts
const cam = new BattleCamera(renderer.camera, {
  rigs: { idle: { position: [0, 3, 9], lookAt: [0, 1.4, 0], fov: 34 } },
  initial: 'idle',
});
cam.addRig('action', { position: [2, 2, 5], lookAt: [3, 2, -2], sway: 0.7 });
await cam.moveTo('action', 850, 'cubicInOut');
cam.snapTo('idle');
cam.update(dt); // every frame
```

Every scene registers at least `idle`, `action`/`enemy` and `victory`.

## `Particles`

`ParticleField extends THREE.Points` with a custom `ShaderMaterial`: soft round
glowing motes, size attenuation, per-particle phase / colour / speed, wrapped
inside a bounds box so a field never empties. All motion is in the vertex
shader; `update(dt)` writes one uniform.

```ts
const field = makeParticles('pyreflies', { count: 200 });
scene.add(field);
field.update(dt);
```

Presets: `pyreflies` (green / white / pink, drifting up, sine wobble), `snow`,
`embers`, `petals`. Options include `count`, `bounds`, `colors`, `size`
(pixels at 10 world units), `drift`, `wobble`, `wobbleSpeed`, `twinkle`,
`opacity`, `additive`, `hardness`, `gravity`, `pixelScale`.

## `Diorama`

Scene-building helpers, all NearestFilter by default for a crisp pixel look:

- `canvasTexture(draw, opts)` — wrap any 2D drawing routine into a tiling
  texture (`size`, `repeat`, `filter`).
- `noiseTexture({ base, speck, density, contrast, grain, seed })`
- `stripeTexture({ a, b, width, direction })`
- `stoneTexture({ base, mortar, highlight, brick, seed })`
- `makeGroundPlane(w, h, texture?, color?)` — XZ plane at the origin.
- `makeGradientSky(top, bottom, { mid, midpoint, radius })` — unlit inward sphere.
- `makeRock({ size, color, scale, jitter, detail, seed, flatShading })`
- `makePillar({ height, radius, taper, sides, color, texture, cap })`
- `makeSlab(w, d, thickness, color, texture)`

## `Tween`

Pure, DOM-free, unit-tested. `Easing` (linear, quad/cubic/sine in/out/inOut,
expoOut, backOut, elasticOut, bounceOut), `resolveEasing`, `lerp`,
`damp(current, target, lambda, dt)`, `Tween`, and `TweenGroup` with
`to(...)` / `toAsync(...)` / `update(dt)` / `killAll()`.

---

# Painted 2.5D

The painted path is the project's actual art direction: AI-painted matte
backdrops and cut-out characters composed in 3D. It lives alongside the pixel
path (`SpriteActor`, `Diorama`) and shares nothing with it but `Tween` and the
`Renderer`.

The whole thing is built so that **no asset is required**. Every loader
resolves a miss to a procedural stand-in and a console warning, so a scene is
composable — and screenshot-able — before a single PNG exists.

## `PaintedArt` — **stable**, the loader

`src/engine/PaintedArt.ts`. Where the painted pipeline reads from disk.

```
public/art/backdrops/<scene>.png                 a wide matte painting
public/art/characters/<id>/<state>.png + .json   a transparent, cropped figure
public/art/portraits/<id>.png                    a CTB / menu portrait
```

```ts
const tidus = await PaintedArt.load('tidus');
tidus.real;            // ['idle', 'attack', ...] — states with their own PNG
tidus.fellBack;        // states that resolved to idle
tidus.placeholder;     // true when even idle.png was missing
tidus.poses.cast;      // always a PaintedTexture, whatever happened
```

`PaintedArt.load(id, opts?)` is the entry point. Three rules, and it never
rejects:

1. `<id>/<state>.png` plus its `.json` sidecar is the source of a state.
2. A **missing state** falls back to `idle` — a character with only an idle
   painting still answers `setPose('attack')`.
3. A **missing subject** falls back to a soft grey silhouette for every state
   and logs one warning naming the id.

| Export | Meaning |
| --- | --- |
| `PaintedArt.load(id, opts?)` / `loadSubject` | Load every state for one character id. `opts`: `states`, `matte`, `fitBaseline`, `silhouette`. |
| `PaintedArt.states` / `CHARACTER_STATES` | `['idle','attack','cast','hurt','ko','victory']` |
| `characterUrl(id, state)` / `portraitUrl(id)` / `backdropUrl(id)` | Path helpers, base-path aware. |
| `artUrl(path)` | Any path under `public/`, resolved against Vite's `BASE_URL`. |
| `loadPainted(url, fallback, fallbackBaseline?, matte?, fit?)` | One image plus its sidecar. |
| `watchAssets(urls, onAppear, opts?)` | Dev-only polling, so a running session hot-swaps art the moment it lands. |
| `sampleBand(img, from, to)` / `bandHex` / `normaliseLuma(hex, luma)` | Read colours back out of a painting. |
| `cleanMatte(image, opts?)` | Strip a leftover white studio background. |
| `fitBaselineFromAlpha(image, w, h, opts?)` | Measure where a figure's feet actually are. |
| `softSilhouette(id)` | The grey stand-in for a missing subject. |
| `setPaintedAnisotropy(n)` | Called once by `Renderer`. |

### Two things that decide whether a cut-out looks pasted on

**`baselineY` is measured, not trusted.** The sidecar's `baselineY` is written
by the art tool and is almost always a flat `height - 16`, which leaves a
figure floating or sunk by a few percent of its height — the exact error the
eye reads as "sticker". `loadPainted` re-derives it from the alpha *after* the
matte cleanup (`fitBaselineFromAlpha`), so the feet land on the ground plane.
Pass `fitBaseline: false` for genuinely hand-measured art.

**`normaliseLuma` is why the 3D layer belongs to the painting.** A band average
taken from a painting carries its *hue* honestly and its *brightness*
accidentally: a night painting full of dark rock averages to near-black, and a
light rig built from that average lights nothing. Sample for hue, set the value
explicitly.

## `PaintedActor` — **stable**, a painted character

`src/engine/PaintedActor.ts`. A `THREE.Group` holding **two** textured planes
(so poses crossfade instead of popping) plus a soft contact shadow.

```ts
const tidus = await PaintedActor.fromSubject('tidus', {
  worldHeight: 1.75,
  rim: { color: lights.rimColorHex, strength: 0.85, dir: lights.rimDir },
  bounce: { color: lights.bounceColorHex, strength: 0.28 },
  shadow: { radius: 0.82, opacity: 0.74 },
});
tidus.position.copy(scene.partySlots[0]);
scene.group.add(tidus);
// per frame
tidus.update(dt);
```

Sizing is driven by a **world height**, never by pixels: a human is ~1.75 world
units whether the painting is 900 px or 1600 px tall, and the figure's feet sit
exactly on the group's origin. Canonical heights: party 1.68–1.86, Seymour
Flux 2.6, an aeon 3–4.

### Options

| Option | Meaning |
| --- | --- |
| `worldHeight` | Feet-to-top height in world units. Default 1.8. |
| `facing` | `1` faces +x, `-1` mirrors the plane (a negative scale, not a UV flip). |
| `crossfadeMs` | Pose crossfade. Default 120. |
| `tint`, `brightness` | Multiply colour and exposure trim. |
| `rim` | `{ color, strength, dir, width }` — a rim band derived from the alpha silhouette. |
| `bounce` | `{ color, strength }` — ground bounce added into the lower body. |
| `groundShade` | Contact darkening ramp at the feet, 0..1. Default 0.24. |
| `shadow` | `false`, or `{ radius, opacity, squash, color }`. |
| `breathe`, `sway` | Idle motion layers; `false` disables. |
| `hover` | `number` or `{ height, bobAmplitude, bobSpeed }` for something that levitates. The contact shadow stays on the ground and shrinks. |
| `edgeFade` | Feather the outer band of the plane, 0..0.3, for art whose aura bleeds to the PNG border. |
| `alphaCut` | Discard threshold. Default 0.02. |
| `matte` | `{ mode: 'auto' \| 'force' \| 'off' }` white-background cleanup. |
| `castShadow`, `shadowAlphaTest` | Real shadow from the painted silhouette. |
| `fitBaseline` | See above. On by default. |
| `poses`, `initialPose`, `placeholder`, `placeholderBaseline` | The low-level path used by `PaintedActor.create`. |

### Instance API

| Member | Meaning |
| --- | --- |
| `update(dt)` | **Every frame**, seconds. Drives tweens and every motion layer. |
| `setPose(name, { immediate?, force? })`, `pose`, `poseNames` | Crossfade between poses. |
| `adoptPoses(map, initial?)` | Take already-loaded textures (a stand-in borrowing another actor's painting). Borrowed textures are never disposed by this actor. |
| `reloadPose(name, url?)` | Re-read one pose from disk; used by the dev hot-swap. |
| `flash(colour?, ms?, peak?)` | Additive hit flash, weighted by alpha. |
| `lunge(distance?, ms?)` | Step forward along `facing` and settle. Promise. |
| `recoil(ms?, distance?)`, `squash(ms?, amount?)`, `hop(height?, ms?)` | Promise-returning impact layers. |
| `shake(amount?, ms?)` | Damped jitter in world units. |
| `dissolveTo(v, ms?, colour?)` / `setDissolve(v)` | Pyrefly dissolve; 0 solid, 1 gone. KO and sending. |
| `fadeTo(a, ms?, easing?)` / `setAlpha(a)` / `alpha` | Opacity, shadow included. |
| `moveTo(pos, ms?, easing?)` | Promise; tweens `position`. |
| `setFacing(1 \| -1)`, `facingDir` | Mirror. |
| `setBrightness(m)`, `setTint(c)`, `setRimLight(c, s, dir?)`, `setBounceLight(c, s)` | Drive the look from the scene's light rig. |
| `headPoint(out?)`, `centerPoint(out?)`, `height` | Anchors for VFX and damage numerals. |
| `subject` | What `PaintedArt.load` found, or `null`. |
| `shadow`, `tweens`, `dispose()` | |

**The motion layers stack.** Breathe, sway, lunge, recoil, squash, hop, shake
and hover all contribute to one transform per frame, so an actor can be
mid-lunge, mid-hop and shaking at once without any of them fighting.

## `PaintedShader`

`src/engine/shaders/PaintedShader.ts`. Unlit — the paintings carry their own
lighting, and relighting them destroys it. What it adds is the handful of
things a cut-out needs to belong to a 3D scene: an alpha cutout, an
**alpha-silhouette rim light** (sampling alpha a few texels toward `rimDir` and
differencing gives a band that hugs one side of the outline — this is what
actually welds a cut-out into a lit scene), a ground bounce, a contact ramp at
the feet, an alpha-weighted flash, a noise-threshold dissolve with an emissive
edge, and an optional `edgeFade`.

## `Backdrop`

`src/engine/Backdrop.ts`. The painting turned into a parallax stack.

```ts
const backdrop = await Backdrop.create({ url: artUrl('art/backdrops/gagazet.png'), width: 92 });
backdrop.applyTo(group);      // parents the stack, installs fog + background
backdrop.update(dt);
backdrop.palette;             // { sky, horizon, ground, key, bounce }, sampled from the painting
```

What it builds: the painting on a far plane, 1–3 **masked parallax layers**
carved out of bands of the same painting and scaled toward `cameraRef` (so at
rest every layer registers exactly and any camera move produces true parallax),
a lit **3D ground plane** in front, drifting **mist sheets**, a matched
**distance fog** and a flat **`scene.background`**.

Two decisions do most of the work:

- **The ground is tinted from the painting's own bottom rows** — its hue comes
  from `sampleBand(…, 0.86, 1.0)` and its value from `ground.luma`. That is why
  the seam between painted snow and real geometry disappears without anyone
  picking a hex.
- **The ground is faded out radially** (`ground.fade`), so it exists only where
  it is needed — under the actors, catching their shadows — instead of running
  an opaque plane to the horizon and burying the painted valley.

Options: `url`, `placeholder`, `width`, `distance`, `centreY`, `cameraRef`,
`layers[]`, `ground`, `fogPlanes`, `fog`, `background`, `sampleBands`.

### Framing the backdrop

The painting must **fill the frame at its own depth**, for every rig the scene
publishes — not just the idle one.

1. Put the plane's centre on the idle rig's view axis. For the Gagazet rig
   (camera `(0, 2.95, 9.4)` looking at `(0.55, 1.3, -1.1)`) at `distance = -48`
   that is `centreY = -6`.
2. Size it for the **widest** rig, not the idle one. A plane that just covers
   `idle` runs out at the frame edge the moment `action` or `party` swings the
   view axis sideways, and the shot shows black. Gagazet needs 64 for `idle`
   and ships 92.
3. Leave `background` on as the safety net for camera sway and for rigs added
   later.

## `Lighting`

`src/engine/Lighting.ts`. `LightRig` builds key / fill / rim / ambient plus a
flickerable practical, **coloured from `backdrop.palette`** and re-exposed with
`normaliseLuma`, so the rig takes its hue from the painting and its value from
`opts.luma`.

```ts
const lights = new LightRig({ palette: backdrop.palette, shadows: { mapSize: 1024, area: 14 } });
group.add(lights.group);
lights.flicker(0xdcefff, 4.6, 420, 14);   // an impact kicks the practical
lights.placePractical(x, y, z);
lights.update(dt);
actor.setRimLight(lights.rimColorHex, 0.85, lights.rimDir);
actor.setBounceLight(lights.bounceColorHex, 0.28);
```

Nothing here lights the painted characters — their material is unlit by design.
The rig lights the *ground* and any real geometry, and hands the characters
matching rim and bounce colours. `makeLightPool(opts)` is the additive pool on
the ground under a figure; together with the contact shadow it is the cheapest
thing that stops a cut-out reading as a sticker.

## `VFX`

`src/engine/VFX.ts`. `HitEffects` bundles the three:

- `SlashArc` — an annulus-sector shader whose bright head sweeps the arc and
  drags a wake. Billboarded. `thickness` is read against `radius`, so anything
  much over `0.1` stops being an arc and becomes an additive blob.
- `SparkBurst` — a GPU points burst with per-particle velocity and life.
- `ImpactFlash` — a soft additive bloom at the point of impact.

```ts
const hits = new HitEffects(slashOpts, sparkOpts, flashOpts);
group.add(hits);
void hits.slash.play(point, 380, roll);
hits.sparks.emit(point, 1);
hits.flash.play(point, 260, 0.72);
hits.update(dt, camera);           // the camera is required: these billboard
```

## `ProceduralArt`

`src/engine/ProceduralArt.ts`. Deterministic canvas painting, so the scene is
beautiful *before* the PNGs land and screenshots stay reproducible:
`paintGagazetBackdrop`, `paintPlaceholderFigure`, `paintBossSilhouette`,
`radialCanvas`, `noiseCanvas`, `cloudCanvas`, `groundCanvas`, `rng(seed)`.

## `ScenePalettes`

`src/engine/ScenePalettes.ts`. One `ScenePalette` per location — `gagazet`,
`zanarkandDome`, `dreamsEnd`, `bevelleUnderground`, `farplane` — handed to
`Renderer.applyPalette`.

Two deliberate departures from `research/visual-bible.md` §6.4.3:

1. **Bloom threshold is raised to ~0.90.** The bible's 0.46–0.72 assumes
   *selective* bloom on an emissive layer. We bloom the whole frame, and an
   AI-painted backdrop has bright paint everywhere — at 0.66 the entire
   painting glows. At 0.90 only the sun band, the boss core, the VFX and the
   pyreflies cross the line, which is what the selective setup was reaching
   for.
2. **Saturation stays near 1.0.** Flat sprite palettes needed desaturating; a
   painting already has its colour decisions baked in.

Post per palette: `bloomThreshold ≈ 0.9`, `tiltFocus 0.38` with
`tiltBandWidth ≈ 0.16` (the band sits on the actors, so the ground and the
painted sky defocus and the figures do not), `vignette`, `grain ≈ 0.02`, plus
the lift / gamma / gain grade.

---

<a id="scene-builder-contract"></a>

# Scene builder contract

`src/scenes/types.ts`. **This is the interface every location implements.**

A scene owns *the world*: the backdrop, the light rig, the weather, the ground,
the camera rigs and the grade. It owns **no actors**, no battle state and no
UI — the battle presenter parks its own `PaintedActor`s on the slots the scene
publishes, and drives its own `BattleCamera` from the rigs it publishes.

That split is the point: five scene agents can build five locations in parallel
against one interface, and the battle and presenter agents can build against it
before a single painting exists.

```ts
export interface SceneBuild {
  readonly group: THREE.Group;          // everything the scene owns, one node
  readonly backdrop: Backdrop;
  readonly lights: LightRig;
  readonly particles: ParticleField[];  // already parented and already updated
  readonly rigs: Record<'intro' | 'idle' | 'action' | 'victory', CameraRig>;
  readonly partySlots: Vector3[];       // 7: [0..2] active, [3..6] reserve, off-camera
  readonly enemySlots: Vector3[];       // right of frame, front-to-back
  readonly palette: ScenePalette;
  update(dt: number): void;
  dispose(): void;
}

export type SceneFactory = (opts?: SceneBuildOptions) => Promise<SceneBuild>;

export interface SceneBuildOptions {
  cameraRef?: [number, number, number];
  quality?: 'low' | 'high';
  watchAssets?: boolean;
}
```

### How to write one

```ts
// src/scenes/zanarkand-dome.ts
import { mountScene, type SceneBuild, type SceneFactory } from './types.ts';

export const buildZanarkandDomeScene: SceneFactory = async (opts = {}) => {
  const group = new Group();
  const backdrop = await Backdrop.create({ /* … */ });
  backdrop.applyTo(group);
  const lights = new LightRig({ palette: backdrop.palette });
  group.add(lights.group);
  // … particles, light pools, props …
  return { group, backdrop, lights, particles, rigs, partySlots, enemySlots, palette, update, dispose };
};
```

and on the consuming side:

```ts
const build = await buildZanarkandDomeScene();
mountScene(build, scene);              // adds the group AND installs fog + background
renderer.applyPalette(build.palette);
const cam = new BattleCamera(renderer.camera, { rigs: build.rigs, initial: 'idle' });
// per frame
build.update(dt);
```

Always use `mountScene(build, scene)` rather than a bare
`scene.add(build.group)`: the fog colour is sampled from the painting's horizon
band, and without it the 3D ground runs to a hard edge the painting does not
have. `unmountScene` undoes it without disposing.

### Rules

1. **Never reject.** Missing art degrades to a procedural stand-in
   (`PaintedArt.load`, `Backdrop.placeholder`) plus a warning.
2. **Four rigs, always:** `intro` (the establishing shot the battle opens on),
   `idle` (the default CTB framing, party and enemies both in frame), `action`
   (pushed in for an ability beat — it must keep the *attacker* in frame, not
   only the target), `victory`. FFX framing: fov 30–34, slight elevation, party
   in a shallow left-facing arc in the lower left, enemies right and further
   back. Extra rigs are welcome.
3. **Seven party slots.** `[0..2]` are the active arc; `[3..6]` are reserve
   positions parked outside every rig's frustum, so a switched-in character can
   walk in from one.
4. **`update(dt)` drives everything you own** — backdrop, lights, particles,
   props. The caller calls it once.
5. **`dispose()` frees every texture, geometry and material you created**, and
   detaches `group`.
6. Honour `quality: 'low'` by trimming particle counts, the shadow map and the
   parallax layer count. Nothing else should change.

`src/scenes/demo.ts` is the reference implementation: `buildGagazetScene` is the
`SceneFactory`, and `buildDemoScene(camera)` is the demo screen's layer on top
of it (actors, VFX, beats, a `BattleCamera`).

---

## Capturing a painted scene

`tools/screenshot.mjs`, against your own dev server:

```
npx vite --port 5173 --strictPort &
node tools/screenshot.mjs --url=http://localhost:5173/ --screen=demo --hud=on \
  --out=docs/screenshots/05-painted-scene.png
node tools/screenshot.mjs --url=http://localhost:5173/ --screen=demo --hud=on \
  --action=attack --action-frames=0 --wait-ms=215 \
  --out=docs/screenshots/05b-painted-action.png
node tools/screenshot.mjs --url=http://localhost:5173/ --screen=demo --hud=on \
  --trigger=chrome:off --out=docs/screenshots/06-concept-battle.png
```

Three flags matter for painted shots:

- `--wait-ms` runs the scene for a slice of **scene** time, pumping frames the
  whole way. `App` clamps `dt`, so on a software renderer a wall-clock sleep
  advances the scene by far less than it claims and an action beat is caught in
  the wrong pose.
- `--trigger=a,b` fires arbitrary `__pyrefly.trigger` beats before the settle
  frames. `chrome:off` strips the demo screen's dev furniture.
- With `--url`, the tool stubs Vite's HMR **WebSocket** (not the client module,
  which is what injects CSS in dev), so another agent saving a file mid-shot
  cannot reload the page out from under the frame pump. `--hmr` opts back in.

---

## Frame contract

`App.step(dt)` runs, in order: input snapshot -> `screen.handleInput` ->
`screen.update(dt)` -> `renderer.render(scene, camera)`. A screen's `update`
must drive everything it owns — actors, particle fields and the battle camera
all take `update(dt)` in **seconds**.
