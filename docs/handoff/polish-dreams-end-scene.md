# Polish — Dream's End, the drifting Zanarkand ruins

Scope: `src/scenes/dreams-end.ts`, `src/scenes/dreams-end-debug.ts`. Nothing
else was touched.

## The defect

`docs/screenshots/51-bfa.png`, and a fresh Chapter 3 capture taken before any
of this, show the same thing: the five fragments of Zanarkand that hang at
mid-depth render as **flat black polygons with a thin orange edge**. At the
upper left of the battle frame two of them read as holes cut in the painting
rather than as masonry, and the only thing describing either shape is the line
drawn round it.

The cause was not the lighting rig. Every mesh in a fragment was an untextured
`MeshPhongMaterial` over a near-black albedo, so **each facet was one uniform
value however it was lit** — an unbroken area of colour at the darkest end of
the frame's range, with a hot additive shell taped around its silhouette. That
is the definition of a cut-out.

A second, smaller fault made it worse: `rimShell`'s offset is expressed in the
*fragment's own* frame, and each fragment is yawed by up to 2.4 rad, so the
hard-coded `+x` offset pointed in a different direction on every one of the
five — on the worst of them nearly at the camera, which spreads the shell
evenly around the whole outline. The "rim" was an ink line.

## What changed

**`stoneCanvas(seed)`** — a new 256px, **tileable** procedural masonry canvas.
Four octaves of value noise for weathered blotching, ridged noise
(`1 - |2n - 1|`, raised to the 7th) for mortar courses and hairline cracks, and
a soft noise-warped horizontal banding for the stadium's stacked construction.
Everything is generated on a **periodic lattice** whose octaves double, so the
canvas wraps exactly and can be tiled at any density without a seam. The canvas
is deliberately **bright** (mean ≈ 0.85): it multiplies an albedo that has to
stay near-black for the floaters to sit behind the haze, so it supplies
*variation* while the material colour supplies *value*.

Cost: it is generated once per scene build, 256 x 256 px at roughly three dozen
`Math.sin` per pixel — tens of milliseconds, next to a 4.4 MB backdrop PNG on
the same load. 256 is deliberate: it is a power of two (so `RepeatWrapping` plus
mipmaps is safe everywhere), and these are 20–26 units back through haze.

**`stoneUVs(geo, tiles)`** — box projection, per triangle, from the face's
dominant axis. `makeRock` builds an `IcosahedronGeometry` whose stock UVs are a
spherical unwrap: it pinches at the poles and seams down one side, which on a
stone texture smears exactly where the silhouette is. Writing per triangle
requires that no vertex is shared between faces, so `emberStone` un-indexes
anything indexed first — `makeSlab`'s `CylinderGeometry` shares a vertex column
between adjacent side faces and would otherwise shear.

**`emberStone(mesh, skin, tiles, specular, shininess)`** — same Phong-over-
Lambert swap as before, now with `map`, `bumpMap` (`bumpScale` 0.42, the same
canvas as a **linear** second texture — read through the sRGB transfer the mid
greys land far too low and the relief flattens) and an `emissive` of `#2E0D07`
modulated by `emissiveMap`, which keeps the undersides — reachable by no lamp
in the rig — from clipping to a literal hole. Flat shading is kept: three takes
the facet normal from derivatives and the bump perturbs that, so the rock still
reads as broken masonry and now has relief *inside* each facet.

Every mesh in a fragment is dressed, at a tile density divided by its own size
so a big floater does not wear coarser stone than the small one beside it:
bodies and shoulders `1.25 / r`, seating tiers `1.9 / s`, struts `5.5 / s`.
The struts were bare Lambert before and were the one black shape left.

**Albedo lifted** from luma 0.19/0.12 to **0.23/0.15**, because the colour is
now multiplied by the map's ≈0.85 mean: the product lands back on the value the
framing in `docs/screenshots/23-scene-dreams-end.png` was approved at.

**The rim is now aimed.** `LightRig`'s `keyFrom` is normalised to a direction
and rotated *into* each node's frame, so the band always sits on the side the
fire is on. That made it safe to raise: opacity `0.15 → 0.22`, colour
`#D8571E → #E0621F`, offset `0.075r → 0.14r`, growth `1.045 → **1.03**`.

The growth going *down* while the opacity goes up is the counter-intuitive half,
and it is what finally killed the outline. The band a grow spills past the
silhouette has to be read in **world** space: a fragment is tilted and yawed, so
its thin local axis is not vertical and the band can be `(grow - 1)` times the
body's *largest* world half-extent (`1.79r`, jitter included) in any screen
direction. At 1.05 that is `0.09r` — more than the `0.074r` the offset supplies
vertically, so the biggest, most-tilted floater kept a pale line along its top.
1.03 caps it at `0.054r`, under the offset on both screen axes, and the far side
goes empty whatever the rotation is. Verified by toggling the `ruin-rim` meshes
off and re-shooting the same crop.

0.22 stays under the bloom threshold, which is the other ceiling: past it the
band blooms and the un-antialiased facet edges stair-step.

**Drift.** The fragments bobbed and yawed; they now also **slide**, on a slower
period than the bob (`0.055–0.09 rad/s`) and out of phase with it, up to 0.25
world units laterally. Capped there on purpose: the five positions are solved
against the boss's projected silhouette and a floater that wandered a metre
would walk back into the box they were moved out of.

## The placeholder flag

`__pyrefly.scenes()` reports `dreams-end` as **`placeholder: false`** — verified
live at the start and end of this pass. The registry entry in
`src/scenes/index.ts` (not owned here) was already corrected, and the backdrop
loads for real: `snapshotState().screenState.backdropPlaceholder === false`.

So that nobody has to cross-reference two files to know which of those two
things is true, `DreamsEndSceneScreen.snapshot()` now publishes **both**:
`backdropPlaceholder` (did `public/art/backdrops/dreams-end.png` load, or is
this `Backdrop`'s procedural stand-in?) and `scenePlaceholder`
(`isPlaceholderScene('dreams-end')` — the same value `scenes()` reports). A run
where they disagree says which of the two regressed.

## Verification

`npx vite --port 5205 --strictPort`, then the `scene-dreams-end` debug screen
and a Chapter 3 (`braskas-final-aeon`) battle, captured through `__pyrefly`:

| Shot | What it shows |
|------|---------------|
| `docs/screenshots/polish/dreams-end.png` | the debug screen at the `idle` rig |
| `docs/screenshots/polish/dreams-end-ruins.png` | crop on the two upper-left floaters — the defect's own framing |
| `docs/screenshots/polish/dreams-end-ruins-before.png` | the same crop before this pass: two black polygons with a hot edge |
| `docs/screenshots/polish/dreams-end-intro.png` | the `intro` rig, where the floaters sit against the brightest part of the sky |
| `docs/screenshots/polish/dreams-end-battle.png` | Chapter 3 in a real battle, HUD and all |
| `docs/screenshots/polish/dreams-end-battle-ruins.png` | the floaters in that battle frame |
| `docs/screenshots/polish/dreams-end-battle-ruins-before.png` | and the same crop before |

The composition still matches `docs/screenshots/23-scene-dreams-end.png`: the
grade, the framing, every rig and every position are untouched, and the albedo
lift is cancelled by the map's mean, so what changed inside the fragments'
outlines is all that changed.

`npx tsc --noEmit` is clean — for these two files and, as of the last run, for
the whole tree. Mid-pass it twice reported errors in files owned by other
sessions (`src/story/scripts/ffx2-vegnagun-shuyin.ts(447,7)`, `Cannot find name
'flash'`; `src/ui/ffx2/BossGauges.ts(61,20)`, `'c' is declared but never read`);
both were gone by the end, fixed by whoever owns them.

---

## Re-verification pass, 2026-09-17 00:30–00:55

A second pass re-ran the whole check against the live tree. **No source change
was made in this pass** — see "Write conflict" below.

### What is confirmed fixed

Captured from `npx vite --port 5205 --strictPort`, page pinned against HMR so a
concurrent save cannot reload the tab mid-pump:

- `__pyrefly.scenes()` → `{"key":"dreams-end","title":"Dream's End — inside Sin","placeholder":false}`;
- `DreamsEndSceneScreen.snapshot()` → `backdropPlaceholder: false`,
  `scenePlaceholder: false`, all six rigs present, boss `braskas-final-aeon-1`;
- a real Chapter 3 battle reports `{screen: "battle", scene: "dreams-end", placeholder: false}`;
- **zero** console or page errors across the whole run;
- `npx tsc --noEmit` clean for the whole tree.

The original defect in `docs/screenshots/51-bfa.png` — two flat black polygons
with a thin orange edge at upper left — is gone. At 1:1 the floaters read as
faceted, textured masonry with a warm lit top and a dark underside, and the
composition still matches `docs/screenshots/23-scene-dreams-end.png`.

### Residual: the rim shell is still drawing an outline

Isolated with a four-way A/B at the `idle` rig, same frame, loop stopped, crop
on the largest floater upscaled 3x (`docs/screenshots/polish/diag/`):

| Variant | `ruin-rim` | hemisphere fill | Result |
|---------|-----------|-----------------|--------|
| `a-asis.png` | on | on | pale constant-width band around ~3/4 of the silhouette, plus a milky wash over the upper half |
| `b-norim.png` | **off** | on | clean faceted stone, warm top, dark belly, **no outline** |
| `c-norim-nofill.png` | off | **off** | indistinguishable from `b` |
| `d-rim-nofill.png` | on | off | the band is back, exactly as in `a` |

`b` ≈ `c` rules the cold hemisphere fill out entirely. `a` ≈ `d` puts the band
wholly on `rimShell`. The earlier claim in this document that the outline was
killed by tightening `grow` to 1.03 does not hold up: the band is still there,
and it is there right round the shape.

The mechanism is the one the current `rimShell` doc block itself identifies —
the offset empties the arc *opposite* the light but gives no separation on the
two arcs **perpendicular** to it, so a constant-width band always survives. The
`map` multiplication added on top of that does not remove the band, because the
opacity was raised `0.22 → 0.3` in the same edit, which roughly cancels the
masonry canvas's mean.

**Recommended fix, on the evidence above: delete the shell from the fragments.**
`emberStone` now does the modelling the shell was originally compensating for,
and the rig already carries a real warm rim lamp (`rim`, `#FFB070`, intensity
0.9, from `[7.2, 3.2, 5.2]`) that rims these correctly. `b-norim.png` is simply
the better image. If the depth cue `depthFade` currently applies through the
shell's opacity is wanted, it belongs on the material's `emissive` instead.

This is polish-grade, not a showstopper: the band only reads as ink at ~3x. At
1:1, in `dreams-end.png` and `dreams-end-battle.png`, it is subtle.

### Write conflict

`src/scenes/dreams-end.ts` was modified by another agent **three times during
this pass** — 00:32:14, 00:47:10 and again during the final capture (md5
`1745da64…` → `75cf20c7…`). The 00:32 edit is the one that gave `rimShell` its
`map` parameter and moved opacity/grow to `0.3`/`1.024`.

Two writers were therefore live in a file this key is supposed to own, so this
pass deliberately made **no** source edit rather than clobber work in progress.
The orchestrator needs to serialise ownership of this file before the residual
above is acted on.

### Shots refreshed in this pass

All captured against the tree as of ~00:47 and overwriting the 14:22 versions:
`dreams-end.png`, `dreams-end-ruins.png`, `dreams-end-intro.png`,
`dreams-end-battle.png`, `dreams-end-battle-ruins.png`, plus the new
`diag/a-asis.png`, `diag/b-norim.png`, `diag/c-norim-nofill.png`,
`diag/d-rim-nofill.png`. The `*-before.png` crops from the first pass are left
untouched.
