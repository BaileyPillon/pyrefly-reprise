# Engine API

Contracts the rest of the project builds against. Anything marked **stable** is
imported by other agents' folders; change it only with a note in
`docs/CONTRACT-CHANGES.md`.

Everything in `src/engine/` is presentation. It never imports from `battle/`,
and the battle engines never import from here (see the layering rule in
`ARCHITECTURE.md`).

---

## `SpriteActor` — **stable**, the sprite pipeline's target

`src/engine/SpriteActor.ts`

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

- Bloom: threshold `0.82`, strength `0.55`, radius `0.4`.
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

## Frame contract

`App.step(dt)` runs, in order: input snapshot -> `screen.handleInput` ->
`screen.update(dt)` -> `renderer.render(scene, camera)`. A screen's `update`
must drive everything it owns — actors, particle fields and the battle camera
all take `update(dt)` in **seconds**.
