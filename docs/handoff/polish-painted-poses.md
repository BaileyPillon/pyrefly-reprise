# Polish: painted poses (`painted-poses`)

**Defect** (`docs/screenshots/48-overdrive.png`, `47-boss-attack.png`): a hurt or
KO'd party member rendered as an oversized billboard with a hard rectangular
seam. A downed Tidus lay at roughly twice his standing scale and overlapped the
actors beside him.

**Cause, confirmed.** The prone/KO art is a *landscape* render (Tidus
`ko.png` is 1216x735, idle is 709x1056) and `PaintedActor` sized every pose to
the same world **height**: `perPx = worldHeight / baselineY`, applied per pose.
A 1216-wide image scaled so that its 735 px of content is 1.75 units tall comes
out **2.9 units wide** — wider than the whole party slot spacing. The seam was a
second, independent defect: see "the white rectangle" below.

## What changed

### 1. New pure module: `src/engine/PaintedScale.ts`

`computePoseScale(pose, opts)` — no `three`, no DOM, unit-tested directly.

What is constant across a subject's poses is the **pixel scale**, not the
height: the generator paints the character at roughly the same pixels-per-metre
in every render. So the scale is computed **once from the idle pose**
(`worldHeight / idle.baselineY` world units per texel) and every other pose
inherits it. A prone pose keeps that scale and comes out wide and low.

Tidus at `worldHeight` 1.88 (Dream's End):

| pose | PNG | before | after |
| --- | --- | --- | --- |
| idle | 709x1056 | 1.21 x 1.81 | 1.21 x 1.81 (unchanged) |
| hurt | 614x1187 | 0.89 x 1.72 | 1.00 x 1.94 |
| ko | 1216x735 | **3.18 x 1.92** | **2.20 x 1.33** |

It also returns `offsetY` (the anchor row sits on the group origin), `prone`,
`footprint` and `clamped`. `maxExtent` (2.2x `worldHeight`) and `minExtent`
(0.35x) are a safety net for a render that comes back at a wildly different
pixel scale; a clamp logs a warning naming the pose.

### 2. Sidecar overrides, read by `PaintedArt.load`

```jsonc
// public/art/characters/<id>/<state>.json
{ "width": 1216, "height": 735, "baselineY": 721,
  "scale": 0.92,      // trim this pose's pixel scale
  "anchorY": 0.98 }   // the row that sits on the ground
```

`anchorY` is in pixels from the top, or a fraction of the height when `<= 1`;
it is clamped into the image. `scale` on the *reference* (idle) calibrates the
whole subject; on any other pose it tweaks that pose alone. Neither is
generated — they exist so the art fleet can fix one awkward render in a text
file. Absent overrides, a prone pose anchors at its **alpha bottom**, which
`fitBaselineFromAlpha` already measures.

### 3. `PaintedActor`

- picks a reference pose on every `loadPoses` / `adoptPoses` / `reloadPose`
  (idle, or the first real upright pose; never a placeholder) and re-sizes both
  planes against it, so a hot-swapped idle re-scales the poses already on
  screen;
- **never rotates the plane** — `mesh.rotation` is explicitly zeroed, mirroring
  stays a negative `scale.x`, and **sway and breathe fade out** as a prone pose
  fades in (blended across the crossfade, so nothing stops dead). A body on the
  ground does not shift its weight, and on a 2.2-unit-wide plane the sway swung
  the corners far enough to show the PNG's rectangle;
- the **contact shadow follows the footprint**: `max(configured radius,
  pose.footprint)`, flattened as it widens, blended across the crossfade;
- `headPoint` / `centerPoint` drop to the top of the actual plane while prone,
  so damage numerals land over the body rather than in the air above it;
- new options: `poseScaling` (`false` restores the old per-pose rule, or
  `{ referencePose, maxExtent, minExtent, proneAspect }`);
- new getters: `isProne`, `poseSize`.

The crossfade, the two-plane structure and every motion layer are untouched.

### 4. The white rectangle — `PaintedShader` + the matte default

Two causes, both fixed:

- **The contact ramp.** `groundShade` darkened the bottom flat 10% *of the
  plane*. On a short landscape plane that band is a wide horizontal stripe
  across the image — a seam. The shader now takes a per-plane `contactBand`
  uniform (`contactBandFor(planeHeight)`, a fixed **world** distance), and the
  ground-bounce ramp is derived from it too.
- **A half-cut studio background.** `kimahri/ko.png` ships with an opaque white
  cloud filling a third of the frame, which drew a literal white box beside the
  body. `cleanMatte` exists for exactly this and `PaintedActor` documents
  `matte: 'auto'` as the default — but `PaintedArt.load` passed `undefined`
  straight through, and `loadPainted` skips the cleanup when `matte` is unset,
  so through `fromSubject` (which is how every scene builds its cast) it never
  ran. `loadSubject` now defaults to `{ mode: 'auto' }`.

  `'auto'` only fires on a handful of PNGs — the ones that really do ship with
  a leftover studio background — because it needs the cleared region to be both
  large (>=5% of the image) and wrapped around the border (>=3 sides). A sweep
  over the character set when this landed hit 7 of 153 (`kimahri/ko`,
  `seymour-flux/idle`, `seymour-flux-body/ko`, two `yunalesca-3` idles and two
  `braskas-final-aeon-2` states); the art fleet re-renders constantly, so treat
  that as an order of magnitude, not a list — this session's captures also
  cleaned `braskas-final-aeon-1/idle`. Each cleanup logs a warning naming the
  file and asking for it to be regenerated with a proper alpha matte; **the art
  fleet owns those files, none were edited here.**

  Deliberately *not* defaulted in `loadPainted` itself: backdrops load through
  it, and a bright sky is precisely the large, border-hugging near-white region
  this would eat.

## Verification

Captured on a dev server at `:5201` with a scratch Playwright driver that walks
`__pyrefly.goto('scene-dreams-end')`, lends all three actors Tidus's painting,
sets one pose each and reports the live plane sizes.

- `docs/screenshots/polish/poses.png` — Tidus idle / hurt / ko side by side on
  one ground line, `rig:idle`.
- `docs/screenshots/polish/poses-before.png` — **the same frame, same camera**,
  with each actor's reference pose nulled at runtime: the old "every pose is
  `worldHeight` tall" rule. Measured off the live actors, at `worldHeight` 1.88:

  | pose | after | before |
  | --- | --- | --- |
  | idle | 1.21 x 1.81 | 1.21 x 1.81 |
  | hurt | 1.00 x 1.94 | 0.89 x 1.72 |
  | ko | **2.20 x 1.33** | **3.18 x 1.92** |

  The KO body is 45% longer and 45% taller before the fix, and its head is
  visibly bigger than the standing figures' — the defect as filed.
- `docs/screenshots/polish/poses-formation.png` — the same KO pose left on the
  scene's own party slots instead of an even row: the body lies behind the two
  standing figures without swallowing them.
- Live plane state in all three shots: `rotationZ` is exactly `0` on the prone
  actor (sway and breathe faded out) and the contact shadow widens from
  `0.82 x 0.41` to `0.97 x 0.45` — the footprint, flattened as it widens.
- `docs/screenshots/polish/48-overdrive.png`, `47-boss-attack.png` — the party
  wipe, regenerated through `tools/gallery.mjs`.
- `tests/unit/engine/painted-scale.test.ts` — 13 tests, all passing: one pixel
  scale per subject, the KO case, the portrait-hurt case, anchoring, both
  sidecar overrides, the clamps, the footprint, and garbage metadata. The pose
  dimensions are copied into the test rather than read from disk, because the
  art fleet re-renders those PNGs constantly; what the test pins is the
  *shapes* (portrait idle/hurt, landscape ko).
- `npx tsc --noEmit` clean across the whole project.

## Notes for whoever is next

- Prone art still draws on an **upright** plane (the body is painted from
  above); that is the 2.5D convention here and it reads correctly, but it means
  a prone figure's plane leans into the camera's near plane more than a standing
  one. Nothing in the five scenes clips today.
- `poseScaling: false` is the escape hatch if a future subject's poses really
  are each cropped to the same standing figure.
- A pose whose render is at a genuinely different pixel scale should get a
  `scale` in its sidecar rather than a code change; the clamp warning names the
  pose when that is needed.
- **Left for the scene owners, not fixed here:** a correctly sized prone body is
  still ~2.2 units long, so on a party wipe the front-left slot's body runs off
  the left edge of the frame in `docs/screenshots/polish/48-overdrive.png`. That
  is slot placement and camera framing (`src/scenes/bevelle-underground.ts`),
  which this agent does not own. `PaintedActor.poseSize` / `isProne` are there
  so a scene can pull a downed actor inboard if it wants to.
