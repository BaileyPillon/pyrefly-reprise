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
| `PaintedArt.load(id, opts?)` / `loadSubject` | Load every state for one character id. `opts`: `states`, `matte` (default `{ mode: 'auto' }`), `fitBaseline`, `silhouette`. |
| `computePoseScale(pose, opts)` / `contactBandFor(h)` | `src/engine/PaintedScale.ts` — pure pose sizing, no `three`. See below. |
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

### The sidecar

```jsonc
{ "width": 1216, "height": 735, "baselineY": 721,   // written by the art tool
  "scale": 0.92,        // optional, hand-set: trim this pose's pixel scale
  "anchorY": 0.98 }     // optional, hand-set: the row that sits on the ground
```

`scale` and `anchorY` are the two **hand overrides**. Nothing generates them;
they exist so one awkward render can be corrected in a text file instead of in
code. `anchorY` is in pixels from the top of the PNG, or — for convenience — a
fraction of the height when it is `<= 1`. Both are read by `computePoseScale`.

### Pose sizing — `computePoseScale`

`src/engine/PaintedScale.ts` is pure (no `three`, no DOM) and unit-tested in
`tests/unit/engine/painted-scale.test.ts`.

The obvious rule — "every pose is `worldHeight` tall" — breaks the moment a
pose is not a standing figure. A KO painting is a **landscape** render (~1216
x 800) of a body lying down; forcing it to 1.75 units *tall* also makes it 2.6
units *wide*, so a downed character is about twice his standing size, sprawls
across his neighbours, and shows the PNG's rectangle.

What is actually constant across a subject's poses is the **pixel scale**. So
it is computed once from the idle pose — `worldHeight / idle.baselineY` world
units per texel — and every other pose inherits it. A prone pose keeps that
scale and comes out wide and low, which is what lying down looks like. The
plane is never rotated: the pose's orientation is painted into the texture.

| Result field | Meaning |
| --- | --- |
| `unitsPerPixel` | World units per texel — shared across the subject. |
| `width`, `height`, `offsetY`, `topY` | Plane size and where its centre goes, so `anchorY` lands on the group origin. |
| `prone` | Wider than tall (`proneAspect`, default 1.15) — a downed body. |
| `footprint` | Ground-shadow radius for this pose. |
| `clamped` | The `maxExtent` / `minExtent` net had to bite; a warning names the pose. |

A pose is sized against itself when there is no reference (a procedural
placeholder, or a subject with no idle painting), which is the old behaviour.

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

`worldHeight` sizes the **idle** pose; every other pose inherits idle's pixel
scale (`computePoseScale`, above), so a KO render comes out wide and low rather
than blown up to a standing figure's height. A prone pose also switches off
breathe and sway — a body on the ground does not shift its weight — widens the
contact shadow to the body's footprint, and pulls `headPoint` / `centerPoint`
down to the top of the actual plane, so damage numerals land over the body.

### Options

| Option | Meaning |
| --- | --- |
| `worldHeight` | Feet-to-top height in world units. Default 1.8. |
| `side` | `'party'` \| `'enemy'` \| `'aeon'`. The one you want: it sets `facing` from the team. |
| `facing` | Which way the **body** is turned: `1` toward +x, `-1` toward -x. Not a mirror instruction — see [Facing](#facing-two-numbers-not-one). |
| `artFacing` | Which way this subject's *paintings* face when their sidecars do not say. Default `'auto'` = "already correct for its side", never mirrored. |
| `interimYaw` | Degrees of [interim turn](#the-interim-turn) for art that is still straight-on. Default 26; `false` or `0` keeps the plane flat to camera. |
| `turnRing` | `true`, or `{ color, radius, opacity }`, for the soft ground ring under whoever is acting. **Off by default**; the battle stage opts in. |
| `life` | `false` to make `setPose` a plain texture swap — hand-animated scene demos want this. |
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
| `matte` | `{ mode: 'auto' \| 'force' \| 'off' }` white-background cleanup. `'auto'` by default, including through `fromSubject`. |
| `poseScaling` | `false` to size every pose to `worldHeight` (the old rule), or `{ referencePose, maxExtent, minExtent, proneAspect }`. |
| `castShadow`, `shadowAlphaTest` | Real shadow from the painted silhouette. |
| `fitBaseline` | See above. On by default. |
| `poses`, `initialPose`, `placeholder`, `placeholderBaseline` | The low-level path used by `PaintedActor.create`. |

### Instance API

| Member | Meaning |
| --- | --- |
| `update(dt)` | **Every frame**, seconds. Drives tweens and every motion layer. |
| `setPose(name, { immediate?, force? })`, `pose`, `poseNames` | Crossfade between poses — **and enter the matching life state**. See [Life](#life-the-pose-name-is-also-a-state). |
| `lifeState` | What the body is doing: `idle \| ready \| act \| guard \| hurt \| down \| victory`. |
| `adoptPoses(map, initial?)` | Take already-loaded textures (a stand-in borrowing another actor's painting). Borrowed textures are never disposed by this actor. |
| `reloadPose(name, url?)` | Re-read one pose from disk; used by the dev hot-swap. |
| `flash(colour?, ms?, peak?)` | Additive hit flash, weighted by alpha. |
| `lunge(distance?, ms?)` | Step forward along `facing` and settle. Promise. |
| `recoil(ms?, distance?)`, `squash(ms?, amount?)`, `hop(height?, ms?)` | Promise-returning impact layers. |
| `shake(amount?, ms?)` | Damped jitter in world units. |
| `dissolveTo(v, ms?, colour?)` / `setDissolve(v)` | Pyrefly dissolve; 0 solid, 1 gone. KO and sending. |
| `fadeTo(a, ms?, easing?)` / `setAlpha(a)` / `alpha` | Opacity, shadow included. |
| `moveTo(pos, ms?, easing?)` | Promise; tweens `position`. |
| `setFacing(1 \| -1)`, `setSide(side)`, `facingDir` | Turn the body. |
| `setArtFacing(a)`, `artFacingDir`, `mirrored` | Declare which way the art faces, and read back whether the plane is actually being drawn flipped. |
| `setInterimYaw(deg)`, `interimYawDeg`, `yawDeg` | The [interim turn](#the-interim-turn): how far a still-frontal painting's plane is yawed toward the enemy, and the eased value on the planes right now. |
| `setTurnRing(on)` / `clearTurnRing()` | Take the ring off the life layer and drive it by hand, and give it back. |
| `setBrightness(m)`, `setTint(c)`, `setRimLight(c, s, dir?)`, `setBounceLight(c, s)` | Drive the look from the scene's light rig. |
| `headPoint(out?)`, `centerPoint(out?)`, `height` | Anchors for VFX and damage numerals. Both follow the pose: over a prone body they aim at the plane's top, not at where the head used to be. |
| `isProne`, `poseSize` | Whether the pose on screen is a downed painting, and its `[width, height]` in world units. |
| `subject` | What `PaintedArt.load` found, or `null`. |
| `shadow`, `tweens`, `dispose()` | |

**The motion layers stack.** Breathe, sway, lunge, recoil, squash, hop, shake
and hover all contribute to one transform per frame, so an actor can be
mid-lunge, mid-hop and shaking at once without any of them fighting.

## `BattlePresenterActors` — **stable**, facing and life

`src/engine/BattlePresenterActors.ts`. The two rule sets `PaintedActor` reads
every frame, as plain functions and one small class.

**This module imports nothing** — no `three`, no DOM, same rule as
`BattlePresenterPorts.ts` — so the whole state machine runs in Node and is
tested directly in `tests/unit/engine/actor-life.test.ts`. The actor is a thin
renderer of what these functions decide. Anything you want to assert about how
a fighter carries itself belongs here, not in a screenshot.

### Facing: two numbers, not one

Two different questions used to share one `facing: 1 | -1`, which is why an
enemy's painting was mirrored whether or not it needed to be.

| | What it is | Who owns it |
| --- | --- | --- |
| **World facing** | Which way along ±x this fighter is turned. Aims the lunge, the lean and the posture tilt; never touches the texture. | The **side**: party and aeons `+1`, enemies `-1` (`facingForSide`). |
| **Art facing** | Which way the painting was painted. | The **PNG**, through its sidecar's `"facing"` field. |

The plane is mirrored only when the two disagree — `mirrorFor(art, want)`:

```ts
mirrorFor('right',  1) === 1    // party art on the party's side: as painted
mirrorFor('left',  -1) === 1    // enemy art on the enemy's side: as painted
mirrorFor('right', -1) === -1   // wrong way round for this side: flip it
mirrorFor('front',  ±1) === 1   // a figure facing camera has no wrong side
mirrorFor(undefined, ±1) === 1  // undeclared: assumed correct for its side
```

Under the v3 art contract (`docs/handoff/art3-contract.md`: party art faces
**right**, enemy and aeon art faces **left**) the two never disagree, so
**nothing is mirrored** and no painting is handed to the player back-to-front.
That is the point of the change: the engine's job is to stop flipping correct
art, not to guess.

`parseArtFacing` reads the sidecar field and accepts the pipeline's own
spellings — `none`, `straight-on` and friends all mean `'front'`. Anything it
does not recognise reads as absent, which falls through to `'auto'`.

Facing is **per pose**, not per subject: one leftover frontal `cast.png` in an
otherwise right-facing set declares `"facing": "front"` in its own sidecar and
is left alone while its neighbours are not. `PaintedArt.loadSubject` also
surfaces the subject-level default it found as `subject.facing`, which is what
`PaintedActor.fromSubject` hands to `setArtFacing`.

### The interim turn

**Interim, and it deletes itself.** The v3 contract has every battlefield
subject *painted* at ~45° toward the other team, and the roster is being
re-rendered to it one subject at a time. Until a given painting lands, the
figure meets the camera's eye while supposedly fighting someone stood beside
it. So the engine yaws the **plane** toward the enemy instead: party and aeons
toward +x, fiends toward -x, `INTERIM_YAW_DEG` (26) either way.

```ts
interimYawFor('front', 1)      // +26  — v2 straight-on, turn it
interimYawFor(undefined, -1)   // -26  — nothing declared, assume v2
interimYawFor('right', 1)      //   0  — painted turned already; leave it
interimYawFor('left', -1)      //   0
```

The `undefined` row is a **deliberate divergence from `mirrorFor`**, which
reads the same silence as "already correct for its side, do not flip". For the
mirror that is the safe assumption; here the safe one is the opposite, because
everything in `public/art/characters/` that has not been re-rendered is
straight-on and says nothing about it. An explicit `right` / `left` is the only
thing that opts a pose out — which is exactly what `flip.py` and the generator
write the moment a repaint lands, so this layer switches itself off subject by
subject as the art fleet ships. It is **per pose**, like the mirror: a v3 `idle`
sits flat while the same subject's un-rendered `cast` is still turned by the
engine.

Turning a plane is not painting a figure turned — the far shoulder does not
come forward — but a foreshortened plane with a near edge and a far edge reads
as a body angled into the fight. 26° is where that stops being invisible and
has not yet become a squeeze: at 18° it is indistinguishable from flat, and by
42° a frontal figure just looks compressed (`docs/screenshots/bp1/yaw-sweep-*`).

`clampYawToCamera(yaw, camAzimuth, maxOff)` is the guard on the other side. A
yawed plane is still a plane, and turned square to the view it flattens to a
line, so the turn is given back as the camera swings round the side —
**always somewhere between 0 and the full yaw**, never reversed, because a
fiend turning away from the party to keep its plane toward the lens is a worse
lie than a flat cut-out. `camAzimuth` is `atan2(dx, dz)` from the figure to the
camera, in degrees: the same frame as the yaw, so a plane yawed to exactly
`camAzimuth` faces the camera square on. `PaintedActor` harvests it in
`onBeforeRender` — the main pass only, since the shadow pass goes through
`onBeforeShadow` — so no caller has to hand an actor a camera. At every chapter-1
rig the turn lands 5–23° off the view axis and nothing is clamped
(`MAX_YAW_OFF_CAMERA_DEG` is 34).

The yaw rides on the actor's inner group, which carries both planes and nothing
else, so:

- the plane's bottom edge stays in the ground plane (a rotation about Y moves no
  y), and the contact shadow and turn ring are siblings that stay lying flat;
- `lunge` and `recoil` are `inner.position`, applied *after* the rotation, so
  forward is still world ±x however far the body is turned;
- it is faded out with the same `upright` weight as the sway and the posture
  tilt, so a prone KO painting — a *wide* plane, whose corners swing furthest —
  lies flat.

`window.__pyrefly.interimYaw(on?)` turns it off and on for every actor on the
field, for an A/B against the same staged frame:
`docs/screenshots/bp1/yaw-before.png`, `yaw-after.png`, `yaw-action.png`.

### Life: the pose name is also a state

`setPose` is not a texture swap. The pose name maps to a **life state**
(`lifeStateForPose`), the state carries a resting **posture**, and the
transition between two states fires one-shot **cues**. The presenter did not
have to learn any of this — it still just names poses.

| Pose(s) | State | Posture | Cues on entry |
| --- | --- | --- | --- |
| `idle`, anything unknown | `idle` | square, normal breathing, ring out | — |
| `ready` | `ready` | half-step forward, weight up, quicker breath, **ring lit** | `step` (a small hop onto the front foot) |
| `attack`, `cast`, `item`, `pray` | `act` | slight lean, breath held, ring lit | — |
| `defend`, `guard`, `sentinel` | `guard` | braced *back*, low, very still | — |
| `hurt` | `hurt` | rocked back, quick shallow breath | `flinch` (tint + knock-back) |
| `ko`, `dead` | `down` | tilted over, all but no breath, ring out | `fall` |
| `victory` | `victory` | up on the toes | `hop`, staggered per fighter |
| *(any → leaving `down`)* | | | `rise` + a soft glow |

Every distance in `POSTURES` is a **fraction of the figure's world height**, so
the same numbers read the same on a 1.8-unit summoner and a 4.1-unit boss.
Postures are eased into with `approach` (exponential, framerate-independent),
never snapped — except by `set(state, { immediate: true })`, which is what
staging a party member who was *already* KO'd uses so nobody watches a corpse
topple over on frame one.

**One rule overrides the pose name** (`nextLifeState`): a fighter who is already
`down` does not enter `hurt`. Damage still lands on a KO'd party member and the
presenter still names `hurt` for it; without the rule the body would sit up to
wince, and `cuesFor` would read that as *leaving* `down` and play the revive
rise, glow and all, on a character who is still dead. `PaintedActor.setPose`
drops the painting too, so the body keeps its `ko` pose.

### The attack step

`attackOffset(t)` is the shape of the lunge — and it is deliberately not one
ease out and back. That is a *drift*, and it reads as the figure sliding into
the enemy and sliding home. What reads as an attack is punctuation, in four
beats (`ATTACK_BEATS`, fractions of the move):

```
step 0.26   quick step in, cubic-out, to 86% of the distance
hold 0.20   a beat of stillness — the wind-up, and where the eye catches up
strike 0.12 the push through the top of it, peaking at 1.0 (ATTACK_IMPACT)
settle 0.42 smoothstep back home
```

The peak is still the `distance` passed to `lunge()` and the whole move still
takes `ms`, so every existing call site keeps its staging.

### The turn ring

A soft additive annulus on the ground, brightest just inside its rim, scaled
0.46 in z so it reads as a ring lying on the floor rather than a disc facing the
camera. It comes up fast (τ 0.09 s) and leaves slowly (τ 0.2 s), so a highlight
never flickers between two events of the same turn, and it is left *alone* by
the `guard` and `hurt` postures (`ring: null`) so being hit mid-turn does not
put it out.

It is **off unless the actor asks for it**. `BattlePresenterStage` opts in —
gold under the party, a colder violet under the fiends — because "whose decision
is this?" is a question only a battle has. A scene demo drives the same poses
for staging reasons, and a highlight under a character who is not taking a turn
is a lie in every screenshot it lands in.

## `PaintedShader`

`src/engine/shaders/PaintedShader.ts`. Unlit — the paintings carry their own
lighting, and relighting them destroys it. What it adds is the handful of
things a cut-out needs to belong to a 3D scene: an alpha cutout, an
**alpha-silhouette rim light** (sampling alpha a few texels toward `rimDir` and
differencing gives a band that hugs one side of the outline — this is what
actually welds a cut-out into a lit scene), a ground bounce, a contact ramp at
the feet, an alpha-weighted flash, a noise-threshold dissolve with an emissive
edge, and an optional `edgeFade`.

The contact ramp is sized per plane through the `contactBand` uniform
(`contactBandFor(planeHeight)`), so the darkening is a fixed *world* distance
off the ground. Given the standing figure's flat 10%-of-plane band, a short
landscape KO plane reads as a hard horizontal seam across the whole image
instead of as contact.

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

## HUD safe area

**The rule: an enemy standing on `enemySlots[n]` must be fully inside the safe
area at the `idle` rig, and its head, torso and every targetable part must stay
inside it at `action` too.** A scene that ignores this draws its boss behind the
CTB queue, and the fight's second enemy stops existing — which is exactly what
`docs/handoff/playability-round-1.md` §4 issue 3 reported.

Both HUDs are a **640x360 authoring stage** scaled by `min(w/640, h/360)` and
pinned to the top-left of the canvas (`.ffxhud__stage`, `.ffx2hud__stage`), so
at any 16:9 canvas every panel lands on the same *fraction* of the frame. Every
number below is a fraction of the canvas, measured live at **1600x900 and
1920x1080** (they agree to ±0.001), and it is a fraction, not a pixel count,
that a scene solves against.

### The rails

| HUD | Panel | Rect (x0..x1, y0..y1) |
|---|---|---|
| FFX | CTB queue `.ig-ctb` | **0.843**..0.970, 0.138..0.557 |
| FFX | party status `.ig-stat-list` | 0.629..0.964, **0.717**..0.967 |
| FFX | command stack `.ig-cmd-stack` | 0.047..0.329, 0.568..0.928 |
| FFX | Sensor panel `.ffx-sensor` | 0.300..0.482, 0.067..0.283 |
| FFX-2 | party status `.ig-stat-list` | **0.725**..0.984, **0.722**..0.972 |
| FFX-2 | command window `.ffx2hud__command` | 0.745..0.981, 0.390..0.677 |
| FFX-2 | boss strip `.ffx2hud__enemies` | 0.033..0.407, 0.049..0.102 |
| both | strategy guide `.sgd__panel` | 0.033..0.240, 0.108..0.700 (soft) |

The CTB column's left edge is the one rail that is **not** a constant of the
stylesheet on its own: its rows are right-anchored and each carries a name
plate, so without a cap the rail moves with whatever the longest combatant name
in the encounter happens to be. `.ffxhud .ig-ctb__name { max-width: 48px }` is
what bounds it. Measured three ways in the live Chapter 2 queue, identical at
1600x900 and 1920x1080:

| CTB `.ig-ctb` left edge | value |
|---|---|
| as it ships, current cast | 0.866 ("Yunalesca"), 0.856 ("Braska's F…") |
| **worst case under the cap**, any name | **0.843** |
| with the cap removed, one long name | 0.629 |

**0.843 is the number a scene solves against** — the leftmost the column can
travel for any name a later encounter brings, not the 0.856/0.866 today's cast
happens to produce. Removing the cap would hand a third of the frame to one
name plate.

The cap is deliberately *shorter* than the longest name in the cast, so that
name is abbreviated in the queue: "Braska's Final Aeon" reads "Braska's F…"
(`docs/screenshots/r2/framing-braskas-final-aeon.png`). Everything else in the
five chapters fits whole. The queue plate is not the only place the name
appears — the target reticle and the Sensor panel both render it in full,
untruncated — so the abbreviation costs nothing the player needs.

### The safe area

```
FFX     x <= 0.79   y <= 0.717      (right rail 0.843 - 0.053 of sway/quad margin)
FFX-2   x <= 0.72   y <= 0.722      (right rail 0.745 - 0.025)
```

The top is free on both, and so is the left **for enemies** — but the left is
not empty. Three panels live there, and the distinction that matters is which
side of the field they cover:

- the FFX command stack (0.047..0.329, y from 0.568) and the FFX-2 command
  window sit over the party's lower third, which is FFX's own arrangement: the
  party stands behind the command window and always has;
- the Sensor panel is transient;
- the **strategy guide** (`src/ui/common/strategy-guide.css`, `left: 21.33px;
  width: 132px` on the 640-wide stage = 0.033..0.240) is new, taller than
  either, and reaches up to y 0.108 — over the party's *heads*, not their
  boots. It is dismissible with `G`, so it is a soft rail, but a party slot
  left of 0.240 is behind it for as long as it is up. See the overlap column in
  `docs/handoff/r2-framing-safe-area.md`; the guide's geometry is not this
  note's to change.

Two things about the numbers:

- **The right rail is hard.** The CTB column and the FFX-2 command window are
  tall, opaque and always up. `sway` on a rig moves the frame a little every
  frame, and a painted actor's quad is wider than the figure on it — the aura
  runs to the plane's edge — so the safe area sits well inside the panel it is
  protecting, and a slot solved to the panel rather than to the rail will cross
  it on some sway phase. Chapter 1's boss did exactly that: solved from his
  nominal width to 0.783, measured at 0.793. **Measure more than once**, too —
  Chapter 4's Bahamut measured 0.714 on one pass and 0.722 on the next, because
  his wings beat; a slot is only inside the rail if its *widest* sampled phase
  is. Leave at least 0.01 of headroom and re-measure.
- **The bottom rail is soft, and only for feet.** A ground-planted boss's *quad*
  may descend a little past it, because the quad has transparent margin under
  the painted feet and because the party column is bottom-anchored under the
  right half of the frame. What may not cross it is the figure's readable mass:
  no enemy's centroid, and no targetable part's centroid, may fall below it.
  Lifting a boss's feet 3% of the frame means pushing him far enough back to
  stop being the largest thing in the shot, which is a worse bug than the one it
  fixes.

### Checking a scene against it

The rails are measured, not asserted, so re-measure after any change to a slot,
a rig, or a HUD column's width or margin:

```js
// in a battle, with the HUD up
const { scene, camera } = window.__pyrefly.app.lastRendered;
// project the 8 corners of each enemy actor's mesh bounds through
// camera.matrixWorldInverse then camera.projectionMatrix, and compare against
// getBoundingClientRect() on '.ig-ctb', '.ig-stat-list', '.ffx2hud__command'.
```

`docs/handoff/r2-framing-safe-area.md` has the per-chapter table this produced,
and each scene's `ENEMY_SLOTS` block carries the numbers its own boss measured.

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
