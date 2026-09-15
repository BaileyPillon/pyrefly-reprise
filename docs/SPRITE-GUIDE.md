# Sprite Guide

How to draw a Pyrefly Reprise sprite. Everything is code: a sprite is a
`SpriteDef` object in a `.ts` file, the rasteriser turns it into pixels, and
`tools/render-sprite.mjs` shows you your work so you can fix it.

Read this before you draw. It takes five minutes and saves an hour.

- Contract: `src/sprites/format.ts` (**stable** — do not edit without a note in
  `docs/CONTRACT-CHANGES.md`)
- Rasteriser: `src/sprites/raster.ts` + `src/sprites/shapes.ts` (pure,
  deterministic, no DOM)
- Browser adapter: `src/sprites/canvas.ts` (feeds `SpriteActor.fromCanvases`)
- Preview tool: `tools/render-sprite.mjs`
- Template: `src/sprites/TEMPLATE.ts`
- Worked example: `src/sprites/characters/tidus.ts`

---

## 1. The loop

```bash
cp src/sprites/TEMPLATE.ts src/sprites/characters/yuna.ts   # start from the template
node tools/render-sprite.mjs src/sprites/characters/yuna.ts --all --grid
# then LOOK at build/sprites/yuna/yuna-review@8x.png with the Read tool
```

Iterate at least three times. You are drawing blind until you look at the
picture; the first render is never the one you ship.

| Flag | Effect |
| --- | --- |
| `--state=attack` | render one state (default: `defaultState`) |
| `--all` | every state, plus `<name>-review@8x.png` — the sheet to review |
| `--scale=8` | preview zoom (default: the sprite's `scale`, else 8) |
| `--grid` | faint 1px grid every logical pixel |
| `--out=dir` | output root (default `build/sprites`) |
| `--contact` | point at a *folder*: one sheet with every sprite in it |
| `--quiet` | print only paths |

Output per sprite: `<state>-<i>.png` at 1x (what the game actually uses),
`<state>@8x.png` (one state, frame timings labelled), and with `--all` the
review sheet: every state stacked, zoomed, with a **1x strip** beside each row.
The pink cross is the anchor. Judge the sprite by the 1x strip, not the zoom.

The tool runs on Node's built-in TypeScript stripping, so **sprite modules must
use type-only imports** (`import type { SpriteDef } from '../format.ts'`) and no
DOM. A sprite module that imports a value from anywhere else will fail to load.

---

## 2. Sizes and proportion

| Kind | Canvas | Notes |
| --- | --- | --- |
| Party member | 48x64 | ~6 heads tall, anime proportion. Head ≈ 10px. |
| Portrait | 32x32 | Head and shoulders. |
| Aeon | 96x96 – 160x128 | |
| Boss | 128x160 – 256x192 | |

- `anchor` is the **feet point** — where the sprite meets the ground. The engine
  puts that line on the floor. Party sprites: `[22..24, 60]`.
- Leave **at least 1px of margin** on every edge: the outline pass draws
  *outside* the silhouette and anything at the canvas edge loses its outline.
  There is a unit test for this on Tidus; add one for your sprite.
- Characters face **+x (right)**. `SpriteActor.setFacing(-1)` flips them.
- Keep the body near the horizontal centre. A weapon may reach out to the side;
  the body should not, or the character will look off-centre in world space.

---

## 3. The format in one page

```ts
const sprite: SpriteDef = {
  name: 'yuna',                       // file-safe, used for output paths
  size: [48, 64],
  anchor: [24, 60],                   // feet point
  palette: { o: '#161225', s: '#f2c9a0', /* ... */ },
  outline: 'o',                       // default silhouette outline colour
  shading: { light: 'top-right', strength: 0.25 },
  fps: 5,                             // default frame duration = 1000/fps
  scale: 8,                           // preview zoom
  defaultState: 'idle',
  frames: { body: { ops: [...] } },   // named frames, reusable as layers
  stateOptions: { ko: { loop: false } },
  states: { idle: [ /* Frame[] */ ] },
};
```

### Frames

A frame is one of three things, and may carry
`outline`, `shading`, `duration`, `offset` and `overlays`:

```ts
{ rows: ['..a..', '.aaa.'] }                      // literal grid, '.' = transparent
{ ops: [ /* ShapeOp[] */ ] }                      // shapes
{ base: 'body', ops: [ /* deltas */ ] }           // layers: reuse a named frame
```

**Layers are how you animate.** Put the parts that do not change in
`def.frames`, then compose:

```ts
idle: [
  { base: ['legs', 'torso', 'head'], ops: idleSword, duration: 520 },
  { base: ['legs', { frame: 'torso', offset: [0, -1] },
                   { frame: 'head',  offset: [0, -1] }],
    ops: idleSword, duration: 460 },   // one pixel of breath
],
```

`offset` on a `BaseRef` shifts just that layer; `offset` on the frame shifts
everything, bases included. Cycles and missing names throw with a clear message.

### Shape ops

| Op | Fields | Pixel rule |
| --- | --- | --- |
| `ellipse` | `cx, cy, rx, ry, fill?, thickness?` | midpoint; integer centre gives an odd diameter (`2r+1`), `x.5` gives an even one |
| `rect` | `x, y, w, h, fill?, radius?` | exactly `w*h` pixels; `radius` chamfers corners |
| `poly` | `points, fill?, strokeEdges?` | even-odd scanline fill, boundary stroked by default |
| `line` | `x1, y1, x2, y2, thickness?` | Bresenham, both endpoints inclusive |
| `arc` | `cx, cy, rx, ry, from, to, thickness?` | degrees, 0 = +x, clockwise (y is down) |
| `pixels` | `x, y, rows` | hand-placed grid, part of the shading pass |
| `mirror` | `ops, axis?, keep?` | draws `ops`, then a mirrored copy across the vertical centre |

Every op also takes:

- `color` — a palette key.
- `outline` — `false` (this shape emits no outline) or a **colour key** so this
  material gets its own outline colour.
- `shade` — `false` to keep the shading pass off this shape (faces, FX, glints).

A palette entry of `'transparent'` **erases**: paint a shape with it to cut a
notch out of what you have already drawn.

### Outline

One pixel, painted *outside* the opaque silhouette (4-neighbour), never on top
of your art. Colour comes from the neighbouring shape's `outline` key if it has
one, otherwise the frame's, otherwise the sprite's. Anything at the canvas edge
gets no outline — keep that 1px margin.

### Shading

```ts
shading: { light: 'top-right', strength: 0.25 }
shading: { light: 'left', lightKey: 'w', shadeKey: 'S' }   // crisper, fewer colours
```

The 1px rim facing the light is lifted, the 1px rim facing away is dropped.
With `lightKey`/`shadeKey` it paints those palette colours; without them it
tints each pixel's own colour by `strength`. `edges: 'keys'` also shades where
two different materials meet — usually too noisy; leave it off.

The pass runs **before** `overlays`, so faces never get muddied.

### Overlays

```ts
overlays: [{ x: 18, y: 12, rows: ['.q...q.', '.oe..oe', '.......', '....p..'] }]
```

Hand-placed pixels stamped after shading, before the outline. This is where
faces, buckles, eyes and glints go. Overlays live on the frame that owns them
(put a face on the `head` layer frame and it moves with the head).

---

## 4. Palette advice

- **Max 24 colours.** Tidus uses 19. Fewer colours read better at 48x64 and keep
  the HD-2D grade consistent across the cast.
- **Never pure black.** Use a dark colour tinted toward the material: hair gets
  a dark gold outline, skin a dark warm brown, cloth a near-black navy. Pure
  `#000` reads as a hole once bloom hits it.
- **Three values per material is plenty**: base, one shade, one highlight. Ramp
  by shifting hue as well as value (shadows toward blue/violet, highlights
  toward yellow), not by darkening in place.
- **Key colours identify the character at 1x.** Tidus = blond + yellow + one
  blue blade. Pick two or three and protect them; everything else is support.
- Name keys mnemonically and keep the case convention: lowercase = base,
  uppercase = the shade of the same material (`y`/`Y`, `s`/`S`, `h`/`H`).

---

## 5. States

`idle`, `ready`, `attack`, `cast`, `item`, `hurt`, `ko`, `victory`, `defend`;
bosses add per-attack states and forms. Frame counts that work:

| State | Frames | Note |
| --- | --- | --- |
| `idle` | 2 | 1px of breath, ~500ms each. Never move the feet. |
| `ready` | 1–2 | weight forward, weapon live |
| `attack` | 3 | wind-up (slow, ~170ms), strike (fast, ~110ms), follow-through (~220ms) |
| `hurt` | 1 | recoil away from the attacker |
| `ko` | 1 | lying down; a completely different composition, not a rotated stand |
| `victory` | 2 | held pose plus a small lift |

Timing lives on the frame (`duration`) or on the sprite (`fps`). Non-looping
states and fall-through go in `stateOptions`, which `canvas.ts` hands straight
to `SpriteActor`.

---

## 6. Wiring a sprite into the game

```ts
import { SpriteActor } from '../engine/SpriteActor.ts';
import { buildSpriteActorInput } from '../sprites/canvas.ts';
import { tidus } from '../sprites/characters/tidus.ts';

const { frames, options } = buildSpriteActorInput(tidus);
const actor = SpriteActor.fromCanvases(frames, { ...options, shadow: true });
scene.add(actor);
// every frame: actor.update(dt)
actor.setState('attack', { onComplete: () => actor.setState('idle') });
```

`buildActorFrames(def)` alone gives you the `Record<string, HTMLCanvasElement[]>`
if you want to supply your own options; `buildFrameDurations(def)` gives the
timing map.

---

## 7. Do / don't

**Do**

- Render and *look* after every change. Three iterations minimum.
- Build the silhouette first — if it does not read as the character in the 1x
  strip, no amount of interior detail will save it.
- Reuse named frames as layers. One base pose, deltas on top.
- Keep the feet planted in `idle`; breathe with the chest and head.
- Give each material its own outline colour key.
- Put faces in `overlays`, not in `ops`.
- Add a unit test: state list, canvas size, palette budget, edge margin.

**Don't**

- Don't use pure black, pure white fills, or gradients. This is a pixel format.
- Don't dither or add single stray pixels; at 48x64 noise reads as dirt.
- Don't exceed 24 palette colours or let two materials share a value.
- Don't let art touch the canvas edge — the outline needs that pixel.
- Don't import anything but types into a sprite module (the node loader will
  reject it).
- Don't mutate a canvas after handing it to `SpriteActor`.
- Don't copy, trace or reference retail Square Enix art, textures or rips.
  Everything here is drawn from description, in code, from scratch.

---

## 8. Template

`src/sprites/TEMPLATE.ts` is a working 48x64 sprite with `idle`, `ready`,
`hurt` and `ko` built from a single named base frame. Copy it, rename `name`,
replace the palette and the `body` ops, and start the render loop.
