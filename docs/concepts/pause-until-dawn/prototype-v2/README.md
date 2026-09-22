# Living-portrait prototype v2 — layered rig + runtime

Round 2 of the living-portrait work (round 1: `../prototype/`, a single warped
plane — see its README's "What is FAKED" for why this round exists at all).
Built by several agents in one workflow run against the same brief. **This
file has two parts, one per owner**: Part 1 is the art pass's own README
(`art/rig.json`'s `keys`, `landmarks`, `layers` and `patches`), written before
the runtime existed; Part 2 is the runtime pass's own README (`index.html`,
`src/*.ts`), written after the art pass's `art/rig.json` landed in the shared
tree mid-session and the runtime was updated to use it. Neither pass edited
the other's files; each documents its own half below.

Character: **Yuna, X-2** — `public/art/portraits/yuna-x2.png`, Bailey's
approved pick of 2026-09-21 (card 3). The approved painting is never edited;
every file under `art/` here is a derived copy or a new inpainted/cut piece,
named so it can never be confused with the original (`docs/target/
approved-hashes.json` covers the original, not these derivatives).

Bailey's request this round, 2026-09-21: *"The characters should be
expressive and should be controllable by keyboard ... The characters need to
be animated. In motion."* — and after prototype v1: *"keep reviewing the
reference video ... make it look more natural and more fluid, Yuna's
expression also needs to be animated too."*

---

# Part 1 — the art (yaw keys, landmarks, layers, patches)

## What exists and who owns it

| Piece | Owner (this run) | State |
|---|---|---|
| `art/keys/frontal.png`, `art/keys/picked/*.webp`, `keys.md`, `judge.md` | yaw-key painter + independent judge | 3 of 4 keys PASS (see `art/rig.json`'s `artMeta.keys`); `profile-right` FAILS across 5 rounds, excluded from the rig |
| `art/patches/*` (eyes/mouth/brows inpainted states), `patches.json`, `patches.md` | patch painter | eyes half + mouth (parted/smile/pressed) PASS; eyes closed DISCLOSED (one-side colour leak); brows NOT DELIVERED (no brow linework exists in the source to move); blink intermediates and the hurt set NOT ATTEMPTED |
| `art/keys/aligned/*`, `art/landmarks/*`, `art/layers/*`, `art/rig.json` (art half), `tools/gen/rig-cut.py` | the art pass | see below |
| `index.html`, `src/*.ts` (driver, renderer, state machine, constants) | the runtime pass | done this window — see Part 2 |

## What the art pass did

1. **Aligned the three passing yaw keys onto the plate's own canvas and
   scale** (`art/keys/aligned/*.png` + sidecar `.json`), using
   `tools/gen/yaw-keys-sheet.py place` — the alignment step `keys.md` itself
   flagged as the next concrete blocker ("no `place` alignment pass...
   right now a mesh warp between the plate and an unaligned key would
   translate the whole head"). Each key's own eye-line and chin were
   re-measured by hand off a labelled pixel grid (`yaw-keys-sheet.py grid`)
   before running `place`; the exact inputs used are recorded in each
   `aligned/<key>.json`.
2. **Authored a 24-31 point landmark set per key** (`art/landmarks/<key>
   .json`), naming eye corners, pupils, brow apexes, nose tip, nostrils,
   mouth corners, lip centres, chin, jaw points, temples, hairline, crown and
   (where visible) the earring attachment, in one shared naming scheme across
   all four keys. Checked by rendering `art/landmarks/wire-overlay.png` — a
   wire overlay across all four keys side by side — and looking: the first
   render caught a landmark floating outside the actual pasted content (a
   guessed hairline point that hadn't accounted for the `place` alignment's
   canvas offset) and a mis-measured far eye; both were re-measured against a
   tighter, better-labelled pixel grid and re-checked before this file was
   written.
3. **Cut the frontal key into the full layer set the brief asks for**
   (`art/layers/frontal/`): a pinned `body` layer (shoulders, collar, neck),
   `hairBack`, `hairFront` (bangs), two loose strands (`strand1`, `strand2`),
   `headCore` (face skin/ears/hairline), the `earring`, and a per-eye
   `eyeApertureR`/`eyeApertureL` (sclera + lids) with its own small
   `irisR`/`irisL` disc cut out separately so it can travel inside the
   aperture. Every layer is a polygon mask (hand-authored, read off the
   source at native pixel resolution — no SAM, no MediaPipe on this machine,
   docs/plans/pause-living-portraits-techniques.md Part 1) intersected with
   the source's own already-clean alpha (every key here is already a rembg
   cutout against a transparent background, so a layer's fine edge is the
   true silhouette edge, not a hand-traced one). Checked by recomposing all
   eleven layers back onto one canvas in z-order and looking: it reproduces
   `frontal.png` with no visible seam. The two eye apertures' iris-shaped
   holes are filled with a cheap neighbour-pixel clone (`tools/gen/rig-cut.py
   fillhole`) rather than a diffusion inpaint, per the brief's own allowed
   alternative ("filled from neighbouring sclera pixels").
4. **Cut headCore + hair for the three yaw keys** (`art/layers/<key>/`), a
   coarser split than the frontal key's — see "What I did not do" — plus one
   flattened `head-flat.png` per key (frontal: every non-`body` layer
   pre-composited in z-order; each yaw key: `hair`+`headCore` composited),
   which is what `art/rig.json`'s `keys[].file` actually points at, since the
   runtime's current `Rig` interface takes one image per key, not a layer
   stack.
5. **Wrote `art/rig.json`** — see the schema below — and this README's Part 1.

## `art/rig.json` schema

The **top level matches `src/rig.ts`'s `Rig` interface exactly**, so the
runtime's own `loadRig()` accepts this file as-is:

```
{
  "character": "yuna-x2",
  "canvas": { "width": 832, "height": 1216 },
  "bodyFile": "layers/frontal/body.png",       // the pinned layer; never warped
  "headBox": { "x", "y", "w", "h" },           // normalised 0..1, the region a
                                                // turn is allowed to warp —
                                                // the frontal head-flat
                                                // composite's own alpha bbox
  "keys": [
    { "id": "frontal", "yawDeg": 0, "file": "layers/frontal/head-flat.png", "landmarks": [[x,y], ...] },
    { "id": "q34-left", "yawDeg": -40, "file": "layers/q34-left/head-flat.png", "landmarks": [...] },
    { "id": "q34-right", "yawDeg": 40, "file": "layers/q34-right/head-flat.png", "landmarks": [...] },
    { "id": "profile-left", "yawDeg": -85, "file": "layers/profile-left/head-flat.png", "landmarks": [...] }
  ],
  "patches": { "eyes": {box,pad,feather,states}, "mouth": {...}, "brows": {...} }
}
```

Every `file` is relative to `art/` (matching `main.ts`'s `assetBaseUrl:
'./art/'`) — checked this pass by resolving every single one against the
files that actually exist on disk, not assumed. `keys[].landmarks` is a flat
`[x,y]` array in a **fixed order across all four keys** (`artMeta.
commonLandmarkOrder`) so index `i` names the same point in every key's array
— but that only leaves **8 points** (`pupil_R, noseTip, philtrum,
mouthCorner_R, lipUpper, lipLower, chin, hairlineCenter`), because a true
profile hides one whole side and both non-frontal keys occlude at least one
eye; see `artMeta.landmarks` and `landmarks/<key>.json` for the fuller,
named, per-key set (up to 31 points, including occluded ones with their own
confidence) that an index-based array can't carry. `patches` is
`patches/patches.json`'s own `groups`, **re-prefixed** with `patches/` on
every `file` (that source file's own paths are relative to its own
directory; the renderer resolves `assetBaseUrl + file`, so they need the
segment added) and with the `hurt` group dropped (it has no `box`/`pad`/
`feather` — nothing was attempted for it — so it doesn't fit `PatchGroup`
and would have been embedded malformed; see `artMeta.knownIssues`). `rig.ts`
declares `constants` as a required field but nothing in the runtime source
this pass could see actually *reads* `rig.constants` (`state.ts` and
`renderer.ts` both import `RIG_CONSTANTS` directly from `constants.ts`
instead) — so it is safe to leave out per the brief's own split ("the
runtime owns constants"), confirmed by reading that source rather than
assumed.

**Everything richer this pass produced lives under a sibling `artMeta` key**
the `Rig` interface doesn't declare and therefore ignores: every layer's file
and box (frontal's full 11-layer breakdown, each yaw key's 2-layer one), each
key's judge verdict and alignment record, the landmark files/overlay sheet,
and the known-issues list below, inlined. `box` throughout `artMeta` is
`[x, y, width, height]` in the 832x1216 plate canvas; a layer PNG is trimmed
to its own alpha bounding box (plus a small pad) and pastes back at its
`box`'s `[x,y]` to reconstruct the full picture (`tools/gen/rig-cut.py
layer`'s own sidecar convention) — verified this pass by recomposing every
layer set back onto one canvas in z-order and looking: each reproduces its
source with no visible seam.

## Known issues, found while doing the art pass

- **The earring's canon side is inconsistently stated across this run's own
  documents, and it was flagged, not resolved.** `keys/judge.md` says
  the earring is "anchored to one specific ear (the same side as her blue
  eye)". The frontal plate's own pixels were sampled directly (not by eye) at
  both `PLATE_ANCHORS.pupils` positions: `(338,422)` reads as green
  (`~(0,238,182)`), `(609,406)` reads as blue (`~(7,123,231)`) — and the
  earring is drawn on the **green**-eye side (viewer-left in the frontal
  key), not the blue side. "Her right eye = green = the earring side" was
  used consistently in the landmark files (`earAttach_R`), verified against
  sampled pixels, not against `judge.md`'s sentence. Whoever next touches
  earring continuity across keys should treat this sampled finding as
  authoritative over the prose in `judge.md`, or re-check both against the
  plate directly before trusting either.
- **`profile-left`'s alignment input (`chin=[215,690]` on the raw candidate)
  was imprecise.** The point originally picked does map to the plate's
  `chin` anchor `(470,730)` by construction of `place` (that's what `place`
  does with whatever point you hand it), but a wider look at the aligned
  result shows the *actual* chin tip of this candidate's silhouette sits
  closer to `(350,700)`. The landmark was recorded at the visually true
  position rather than forced to `(470,730)`, which means this key's
  overall scale/position is calibrated to a jaw point that isn't quite the
  chin, not the true chin — a small, systematic offset (**this is also why
  the runtime's chin-anchored key alignment, Part 2, treats it as an
  approximation, not ground truth**). A follow-up pass should re-run `place`
  on this key with a better-read chin point and redo its landmarks.
- **Hidden-region inpainting (forehead under bangs, cheek under a strand,
  neck under the jaw) was not attempted.** See `art/rig.json`'s
  `artMeta.layers.hiddenRegionInpainting.note` — the gap only appears once a
  driver actually displaces a layer. **It does now (Part 2): the runtime
  mitigates the resulting hole with a frontal fill-in layer, which is a
  smaller defect than a black cutout but is not itself correct at extreme
  yaw** — a real hidden-region inpainting pass is still the actual fix.

## What the art pass did not do, and why

- **No front/back hair split or loose strands for the three yaw keys** —
  only `headCore` + one combined `hair` layer each, versus the frontal key's
  eleven-layer breakdown. The brief's own yaw-key scope ("the same head-core
  plus hair layers") is narrower than the frontal scope, read as
  intentional (a yaw key only needs to swap the *head*, not re-derive the
  pinned body or re-cut every hair strand at every angle); if a future pass
  wants independent strand sway at non-frontal angles too, this needs a
  second round of polygon authoring on the aligned yaw images, same method
  as the frontal cut.
- **No `crown` landmark on any key** — every key's hair is cut off by the
  frame edge before the crown of the head is visible (the same finding
  round 1's motion spec already made about the plate itself). Recorded as
  `visible:false` rather than guessed.
- **`profile-right` has no layers or landmarks** — it never passed the
  identity judge in five rounds (`keys.md`, `judge.md`). Building layers for
  a candidate everyone agrees is wrong-handed would ship the mirrored-
  silhouette bug into the rig; `art/rig.json`'s `artMeta.keys.profile-right`
  records why and points at the least-bad candidate kept on disk for a
  future mirror+inpaint attempt. **The runtime's yaw range stops at
  `q34-right` (40°) on that side as a result** (Part 2).
- **Landmark coordinates are a single hand-read pass, cross-checked only
  where cheap to (pupils, against an independent colour-mask centroid)** —
  not measured to sub-pixel accuracy, and not run through a second
  refinement round beyond the one the wire-overlay check triggered. Good
  enough to drive a first mesh-warp attempt and see how it looks at high
  fidelity (which, per this project's own "raise the fidelity of the
  choices" rule, is exactly the point of building this rung of the ladder
  next); not asserted as measured ground truth.
- **Did not touch `public/art/portraits/yuna-x2.png`** — verified
  byte-identical (sha256 `7427dc7f...`, matching `patches.json`'s own record)
  before and after this session.
- **Did not build `index.html`, any driver module, or the runtime's
  constants** — the runtime pass's own piece of the same brief (Part 2).

## Reproducing or extending the art

```
# re-align a yaw key onto the plate canvas (after re-reading eye_y/chin off a grid):
python tools/gen/yaw-keys-sheet.py grid --image <candidate> --box <x0 y0 x1 y1> --zoom 3 --out <grid.png>
python tools/gen/yaw-keys-sheet.py place --image <candidate> --eye-y <n> --chin <x> <y> --out art/keys/aligned/<key>.png

# check a layer spec's polygons before cutting (renders a colour-coded overlay):
python tools/gen/rig-cut.py overlay --source <aligned-or-frontal.png> --spec <key>.spec.json --out <overlay.png>

# cut one named layer (trims to its own alpha bbox, writes a sidecar with the box):
python tools/gen/rig-cut.py layer --source <src.png> --spec <key>.spec.json --name <layerName> --out art/layers/<key>/<layerName>.png

# fill a small revealed hole (e.g. an eye aperture's punched-out iris) with a cheap neighbour clone:
python tools/gen/rig-cut.py fillhole --source <layer.png> --box <x y w h, RELATIVE TO THE CROPPED LAYER> --out <layer.filled.png>
```

Run with any Python 3 that has PIL and numpy — unlike `inpaint-support.py`
and `yaw-keys-sheet.py`, `rig-cut.py` needs no ComfyUI, only those two
packages.

---

# Part 2 — the runtime

This is **the runtime only**: the WebGL2 renderer, the motion math (spring,
noise, blink/expression schedulers), input, and the `PortraitStage` driver
seam. `art/rig.json` (Part 1, above) did not exist when this pass started;
the driver was built against a stand-in generated from the frontal plate
alone, exactly as the brief said to, and updated to use the real file once it
landed in the shared tree mid-session (see "The real rig arrived mid-build").

## Run it

```
cd "D:\Final Fantasy"
npx vite --port 5743
```

then open `http://127.0.0.1:5743/docs/concepts/pause-until-dawn/prototype-v2/`.

Append `?timeScale=8` to speed up the idle clocks (blink/mouth events run on
multi-second timers; useful for poking at them in a live session without
waiting). Debug-only — the real pause screen never sets it.

## Controls

Same as v1, unchanged so the feel test stays comparable:

| Key | What |
|---|---|
| arrows / WASD / mouse / gamepad right stick | turn her gaze |
| E | cycle state: normal → determined → hurt |
| B | blink now |
| R | toggle reduced motion |
| F | diagnostics overlay (live yaw, spring residual, blink/expression state, event log) |
| H | hide the legend |

## Architecture

```
prototype-v2/
  index.html         standalone page (not the real pause screen)
  art/                Part 1's output (rig.json, keys/, patches/, layers/, landmarks/)
  src/
    constants.ts      RIG_CONSTANTS — every number from the motion spec, one place
    rng.ts            seeded PRNG (mulberry32) so schedules are reproducible in tests
    dynamics.ts       ExponentialSpring (head-follow), BandNoise, IdleSway
    face.ts           BlinkScheduler, ExpressionScheduler, lidDroopForGaze
    rig.ts            Rig type, loadRig() (authored -> stand-in fallback), yaw-bracket math
    state.ts          PortraitStateMachine — combines the above into one Frame per tick, no DOM/WebGL
    gl-utils.ts       WebGL2 plumbing (shader compile/link, textures, framebuffers, grid mesh)
    shaders.ts         GLSL ES 3.00 sources
    renderer.ts       WebGL2 layered renderer (body/head/patches), degrades to a no-op with no GPU
    light.ts          relighting + vignette math (JS mirrors of the shader's own formulas, for tests/diagnostics)
    post.ts           the post pass: focus falloff, grain, grade
    input.ts          keyboard/mouse/gamepad -> a gaze target
    driver.ts         LivingPortraitDriver — the PortraitStage seam (mount/setGaze/blink/setExpression/dispose/snapshot)
    main.ts           wiring for this standalone page only
```

`state.ts` has no DOM and no WebGL dependency, on purpose — the same
layering discipline `src/battle/**` keeps from `src/engine/**`/`three`
(AGENTS.md hard rule 1), extended here by convention so the actual motion
math (springs, blink timing, noise) can be driven and asserted on directly in
`tests/unit`, no GPU required. `renderer.ts` degrades to `ok === false` when
`canvas.getContext('webgl2')` returns null or throws (jsdom, `tests/unit`),
so the driver seam works there too — verified by
`tests/unit/pause-living-portrait-driver.test.ts`.

### Decisions worth writing down (AGENTS.md rule 15)

- **The spring is a first-order exponential, not a two-pole mass-spring
  system.** The motion spec's own settle percentages (63%/95%/99% at
  0.14/0.42/0.65s) are exactly `e^-1`, `e^-3`, `e^-4.6` — the textbook
  critically-damped formula `(1+t/tau)e^-t/tau` would only reach ~26%/80%/90%
  at those times. See `constants.ts`'s doc comment for the full reasoning.
  Tested in `tests/unit/pause-living-portrait-dynamics.test.ts`.
- **Reduced motion follows the spec, not the older prototype's control
  legend.** Section 11 says: freeze the *idle* layers (sway noise, continuous
  mouth/brow drift, grain), keep blinks at their measured timings, and let
  the head still follow input but with tau raised to ~0.25s "so nothing
  snaps." That is what `state.ts` does. (v1's own README describes `R` as a
  blunter "reduced motion freezes all of it" — the spec, which is the
  measured reference this build was told to follow, is more specific and
  this build follows the spec.)
- **Band noise is a small sum of incommensurate sines (7 by default), not
  filtered white noise or a value-noise field.** Cheaper, fully deterministic
  under a seed, and its first-lag autocorrelation matches the reference's own
  measured range (0.06–0.42) when checked the same way the spec was measured:
  the *first local maximum* of the autocorrelation curve, not the maximum
  over an arbitrarily wide lag scan (a narrow-band signal's autocorrelation
  necessarily climbs back up at longer lags — the reference source itself
  only ever measured short windows for exactly this reason).

## The real rig arrived mid-build

`art/rig.json` did not exist when this pass started; the driver was built
against a stand-in generated from the frontal plate alone
(`rig.ts: buildStandInRig`), exactly as the brief said to. Partway through,
the art pass (Part 1, above) delivered the real file — four yaw keys
(`frontal` 0°, `q34-left` -40°, `q34-right` 40°, `profile-left` -85°;
`profile-right` is not in the rig — it failed its own judge across five
rounds, see `art/keys/keys.md`), each with 8 shared landmarks, plus the
inpainted eye/mouth patches. This build was updated to use it:

- **`yawRangeForRig`** reads the range straight from the rig's own keys
  instead of a fixed constant — asymmetric (-85° to 40°) for this delivery,
  ±35° for the stand-in.
- **`bracketForYaw`** finds the one or two keys that cover the current yaw and
  a blend weight; the renderer cross-dissolves between them (draws key A
  opaque, then key B on top at `opacity = t`).
- **Landmark-anchored alignment.** The rig's `landmarks[6]` is the chin
  (`commonLandmarkOrder`); each key gets a small rigid NDC offset so both
  keys' chins land on the same blended point mid-dissolve, instead of the
  two paintings' faces sliding past each other during the cross-fade.
- **Placement boxes.** A key's own `head-flat.png` is usually smaller than
  the canvas. `rig.ts: derivePlacementBoxes` reads `artMeta.layers` for
  where each crop belongs; only `frontal`'s own box is stated directly in
  this delivery, so the other three keys fall back to their `hair` layer's
  box (documented in the function's own comment — a few pixels off, not
  claimed exact).

**A real bug this found, fixed before shipping:** every authored layer
(body, the frontal fill-in, both bracket keys) is a cutout with real
per-pixel alpha. The first pass only enabled `gl.BLEND` for the top
cross-dissolved key, so every other layer's *transparent* texels overwrote
whatever was underneath with black instead of showing it through — a sharp
black rectangle wherever a key's crop didn't fully cover its box (visible at
`profile-left` and `q34-right`, both of which are missing "hidden region"
art per `art/rig.json`'s own `knownIssues` — see Part 1). Fixed by keeping
`gl.BLEND` enabled for every layer in the multi-key path.

**Known visual gap, inherited from the art, not from this runtime:** the art
pipeline's own `rig.json.artMeta.knownIssues` discloses that hidden-region
inpainting (forehead under bangs, neck under a turned jaw) "was not
attempted — the gap only shows once a layer is actually displaced by the
driver." This build mitigates it by drawing the frontal key as a fill-in
layer underneath the active bracket (so a gap shows frontal hair/collar
instead of bare canvas), which is a smaller defect than a hole but is not
itself correct at extreme yaw — a hidden-region inpainting pass is still the
real fix, and it is an art-pipeline task, not a runtime one.

## What is real vs. what is a documented stand-in

| Piece | Status |
|---|---|
| Head-follow spring (tau 0.14s, no overshoot, holds at the extreme) | Real, tested |
| Band-limited idle sway (head + chest, independent phase) | Real, tested |
| Blink (close/hold/open at the measured durations, half blinks) | Real, tested |
| Mouth/brow event envelope (400ms onset, ~2.8s decay) | Real, tested |
| Gaze/lid coupling, no saccades | Real |
| Real painted yaw turn (4 keys, landmark-anchored cross-dissolve) | Real, once `art/rig.json` landed mid-build |
| Pinned body layer (never warped) | Real |
| Inpainted eye/mouth patches (half, closed, parted, smile, pressed) | Real art, composited live; `eyes/closed` carries a disclosed identity miss (a green sliver on the wrong eye) per `art/patches/patches.md` — not fixed here, that is an art task |
| Relighting on turn, focus falloff, grain, asymmetric grade | Real, procedural |
| Brow patches | No delivered art (both states `FAIL`) — the scheduler runs (for the diagnostics log) but nothing is drawn |
| `profile-right` | Not in the rig — failed its own judge 5/5 rounds; the turn stops at `q34-right` (40°) on that side |
| Hidden-region fill (forehead/neck at extreme yaw) | Documented gap, mitigated not fixed (see above) |
| Full per-triangle Delaunay mesh warp of hand landmarks | **Not built.** What is built: cross-dissolve + a single rigid (chin-anchored) alignment offset per key, not a per-triangle warp. The 8 shared landmarks are enough to *anchor* the blend; a real piecewise warp of the interior (the brief's literal "triangulated mesh warp between hand-authored landmark sets") was judged not worth the added risk/build time this pass, given the art's own placement boxes were already only approximately known (see `derivePlacementBoxes`) |

## Tests

`tests/unit/pause-living-portrait-*.test.ts` (31 tests, all logic-level, no
GPU): spring settle percentage + no-overshoot, band-noise non-periodicity
(first local autocorrelation peak), blink phase durations and interval
statistics, half-blink aperture band, expression envelope shape, brow
amplitude cap, reduced-motion behaviour (idle layers off, blink still runs,
head still follows a held input), hurt-state gaze tightening, and the driver
seam (mount/setGaze/blink/setExpression/dispose never throw, even with no
`fetch`/WebGL2 — both true under jsdom).

## Browser verification (this pass)

One real-Chromium pass (`PYREFLY_BROWSER=gpu`, via Playwright — the
`tools/browser-mode.mjs` GPU args) at 1440x810, diagnostics overlay on:
8 required stills in `shots/` (centre, three-quarter left/right, mid-blink,
half-blink, a mouth event, hurt, reduced-motion — no profile still, since
this rig has no `profile-right` and `profile-left`'s -85° is already shown
in the three-quarter-left slot's neighbourhood; two bonus stills confirm the
input.ts fix below) plus a dedicated 12s idle clip (`clip-12s.webm`, ~1.4MB,
recorded in its own browser context so it is not the whole test session).

**A second real bug this pass found and fixed:** `input.ts`'s gaze priority
was `gamepad > mouse > keyboard` — a single past mouse position (e.g. from
clicking anywhere near the portrait) would permanently outrank a *currently
held* arrow key, since a key held down is a discrete, ongoing signal but a
mouse position never "releases." A held key now always wins; gamepad, then
the last mouse position, is the fallback. Verified with real Playwright
keyboard/mouse events, not just JS state pokes (`09-mouse-gaze-bonus.png` /
`10-keyboard-overrides-mouse-bonus.png`).

## What this pass did not do

- No per-triangle mesh warp of the landmark interior (see the table above).
- No hidden-region inpainting (an art task, disclosed by the art rig itself).
- No brow patches to draw (no delivered art).
- No attempt to fix `art/patches/patches.md`'s disclosed `eyes/closed`
  identity miss or `profile-right`'s failed turn — both are art-pipeline
  findings from another agent's brief, not runtime bugs.
- Pitch (vertical turn) has no separate painted keys; it stays the v1-style
  procedural nod, small on purpose.
