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

> **v3 (2026-09-22): see Part 5 at the end** — the art assembly and runtime were rebuilt; Parts 1-4 are the v2 history.

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

---

# Part 3 — integration and tuning (this pass, attempt 3 on Sonnet)

Owner of everything under `prototype-v2/` this round. The brief was to load
the real `art/rig.json` into the runtime, fix every seam between the art and
runtime halves, tune the constants by eye against the spec, make sure the
turn never tears, and re-capture the deliverables. `art/rig.json` had already
landed (Part 1/Part 2 above); this pass found the runtime was drawing it with
two real bugs that only show up with a GPU actually rendering it, not from
reading the source.

## Real bugs found by looking at the render, not by reading the code

**1. `hairBack` was drawn in front of the pinned body, not behind it —
a visible seam at the collar.** `art/rig.json`'s own `artMeta.layers.
frontal.zOrder` is `[hairBack, body, headCore, eyeApertureR, eyeApertureL,
irisR, irisL, hairFront, strand1, strand2, earring]` — the art pass's own
recipe for reconstructing the frontal key puts the body layer *between*
`hairBack` and the rest. The runtime never read `zOrder`: it drew the pinned
body first, then the whole frontal recipe as one flattened `head-flat.png`
(which already has `hairBack` baked on top of everything) on top of that —
so `hairBack` always painted over the collar/shoulder instead of tucking
behind it, visible as a hard silhouette clash right at the join (screenshot
comparison: `01-centre.png` before this fix showed a light rectangular seam
across the collarbone; gone after). Fixed by loading the frontal key's own
11 sub-layer files (`art/layers/frontal/*.png`, listed in `artMeta.layers.
frontal.files`) instead of the flattened composite, and drawing `hairBack`
before the body, the rest of the recipe after — see `renderer.ts`'s
`FRONTAL_SUB_LAYERS`, `drawFrontalLayer`, `drawFrontalFrontStack`. Falls back
to the old flattened-texture path (`frontalReady` false) if any of the 10
files is missing, so a future rig with a coarser frontal delivery still
renders instead of throwing.

**2. Splitting the fill-in from the flattened texture broke the yaw
bracket's own cross-dissolve — a hard rectangle, worse than bug 1.** The
first attempt at fixing bug 1 skipped redrawing frontal inside the yaw
bracket loop (reasoning: "it's already drawn by the fill-in, redrawing it
would undo the z-order fix"). This is wrong: frontal is one end of the
bracket for **every yaw in [-40°, 40°]** (`bracketForYaw` — q34-left to
frontal, then frontal to q34-right), and the bracket's `b`-drawn-on-top-at-
weight-`t` step is what actually *produces* the cross-dissolve, not the
always-opacity-1 fill-in underneath. Skipping it meant the *other* key
(`q34-left`/`q34-right`) ended up as the final, fully-opaque draw at every
yaw near centre — a hard rectangle of a different, wrongly-lit painting
sitting on top of the correctly-layered frontal content (caught in
`01-centre.png`: a sharp rectangle of the correct face floating over a
blurrier, mismatched ghost of `q34-left`'s texture). Fixed by giving frontal
a real slot in the bracket: `drawFrontalFrontStack(opacity, chinOffset, ...)`
runs in `a`'s or `b`'s position exactly like a flattened-texture draw would,
just using the zOrder-correct layer stack and the chin-alignment offset the
bracket already computes for a normal key. Found and fixed by rendering to a
real GPU canvas and looking at 1:1 crops, both times — reading the diff would
not have caught either one, since both are correct-looking code operating on
a subtly wrong draw order.

**3. The gap-mitigation fill-in was drawing small decorative layers
(earring, strands, eyes) at their frontal-pose position underneath an
already-opaque, differently-posed key — a duplicate earring floating over
the turned head.** The original design (Part 2, "known visual gap") always
draws frontal's content underneath whichever key is active, so a key with no
hidden-region art shows frontal hair/collar through its own gaps instead of
bare canvas. That reasoning holds for `headCore`/`hairFront` (a plausible
face/hair smudge in a gap reads as a soft coverage error), but not for
`earring`/`strand1`/`strand2`/the eye layers: q34-left and q34-right's own
crops are otherwise fully opaque over the head region, so these small
layers were never filling an actual gap — they were floating a second
earring at the wrong (frontal) position over an already-complete turned
face (seen at `02`/`03`'s -40°/+40° extremes: a second earring, clearly not
attached to anything). Fixed by scoping the unconditional fill-in to
`headCore` + `hairFront` only (`drawFrontalFrontStack(..., full: false)`);
the decorative layers only draw when frontal is genuinely part of the active
bracket (`full: true`), at the bracket's own weight and offset.

## New this pass: iris travel and independent loose-part lag

The brief's architecture calls for "eyes as a fixed aperture with the iris
travelling inside it" and "loose strands on their own lag" — neither existed
before this pass; the eyes and the earring/strands were baked into the
flattened frontal texture at one fixed pose. The art pass's own per-layer
cuts (`eyeApertureR/L.filled.png` with the iris punched out and neighbour-
filled, `irisR/L.png`, `strand1/2.png`, `earring.png`) already have what a
mesh-free version of this needs — no new art required:

- **Iris travel** (`renderer.ts`, `IRIS_TRAVEL_PX`): `irisR`/`irisL` are
  drawn on top of their own `eyeAperture*.filled.png` with a small NDC
  offset driven by the head's own yaw/pitch — not an independent saccade
  (the spec is explicit that gaze moves *with* the head turn, never on its
  own, and that eye-lead over the head "could not be measured", §5/§12).
  The travel range (±11px / ±7px) is a rig-geometry tuning choice, not a
  measured constant, kept out of `constants.ts` for that reason and
  commented as such.
- **Earring/strand lag** (`LOOSE_LAG_TAU`, `LOOSE_SWING_PX`,
  `LOOSE_IDLE_PX`): each of `earring`, `strand1`, `strand2` gets its own
  `ExponentialSpring` chasing the head's own `yawNorm`, at a *different* tau
  (0.5s / 0.32s / 0.38s) than the head spring itself (0.14s) — the gap
  between the head's current position and this slower-following spring is
  the visible swing, so a fast head turn leaves these parts visibly trailing
  and catching up, and a held pose lets them settle back to rest. A small
  `BandNoise` per part (same band as the head/chest sway, different seed and
  phase) adds continuous idle jiggle so they still move when the head is
  perfectly still, per §6 ("the strand pattern changes independently of
  head position"). This is a disclosed simplification, not a physics sim: a
  real pendulum's period depends on its own length and would ring rather
  than monotonically catch up: the spring here is first-order (same
  reasoning as the head spring, `constants.ts`'s own decision note), chosen
  for the same reason — cheap, deterministic, and visually reads as "lags
  behind," which is what the brief asked for.

## Found and disclosed, not fixed (art-pipeline limitations, not runtime bugs)

- **`q34-left`'s own painted key barely reads as a 3/4 turn.** Looking at
  `art/layers/q34-left/head-flat.png` directly: both eyes are fully visible
  and the face is nearly frontal — compare `art/layers/profile-left/
  head-flat.png`, a genuine profile with one eye occluded, or `art/layers/
  q34-right/head-flat.png`, which does show a real 3/4 angle. This is why
  `02-three-quarter-left.png` looks close to `01-centre.png`: the runtime is
  faithfully cross-dissolving toward a key that itself doesn't commit to the
  angle its `yawDeg: -40` claims. Confirmed by direct pixel inspection of the
  source art, not by eye on the composite alone. Not fixed here — regenerating
  a key is an art-pipeline task (this pass owns integration only, and any
  render queue time is shared with two other active workflows tonight); flagged
  for whoever next touches the yaw keys.
- **Mid-dissolve ghosting between `q34-left` and `profile-left`.** Around
  yaw -55° to -70° (roughly 40-80% blended toward `profile-left`), the two
  keys' structurally different face geometries show through each other as a
  faint double eye/eyebrow, most visible if the head is held at exactly that
  angle. This is the documented limitation from Part 2's own table (a plain
  cross-dissolve + one rigid chin-anchor offset, not a per-triangle mesh
  warp) — confirmed here by actually holding the yaw there and looking, not
  newly introduced. Both endpoints (`q34-left` alone, `profile-left` alone)
  are clean; only the transition between two very different face geometries
  shows it. **Range was not reduced**: unlike a torn/broken key, both ends
  render correctly and the brief's "reduce range" instruction is for a key
  that itself breaks, not for an inherent limitation of a cross-dissolve
  between two honestly-different paintings — cutting the range would remove
  working content to hide a cosmetic transition artifact already on record.
- A faint hair/face outline is still visible at `q34-left`/`q34-right`'s
  extremes from the (now narrower) `headCore`+`hairFront` fill-in showing
  through those keys' own alpha gaps — much fainter than the fixed earring
  duplicate, and the same "smaller defect than a hole" tradeoff Part 2
  already accepted.

## Head turn: does it tear?

Checked by sweeping gaze x from 0 to ±1 in fine steps (a dedicated verification
pass, not eyeballing the live drag) and looking at every frame: no holes, no
misaligned polygons, no broken geometry anywhere in the range. The only
artifact found is the mid-dissolve ghosting above, which is soft (alpha
cross-fade) rather than torn (a rip or a missing region) — so the full
authored range (**-85° to +40°**) stays as-is, unreduced.

## Re-captured deliverables (`shots/`)

All 10 stills and both clips were re-rendered against the fixed runtime,
real-Chromium (`PYREFLY_BROWSER=gpu`), real Playwright input events (mouse
moves, held keys, `driver.setGaze`/`blink`/`forceHalfBlink`/`forceMouthEvent`
— the same seam `PortraitStage.ts` will call) at 900x1300, looked at 1:1
around the eyes/mouth/hairline before trusting any of them:

| File | What it shows |
|---|---|
| `01-centre.png` | Frontal, idle — the seam-check pose (bugs 1/2 above) |
| `02-three-quarter-left.png` | Settled at q34-left's own -40° (polled on `springResidualDeg`, not a fixed wait — see below) |
| `03-three-quarter-right.png` | Settled at +40° (this rig's max on that side) |
| `04-mid-blink.png` | Polled for the `closing`/`closed` eye state, not a fixed wait |
| `05-half-blink.png` | Polled for the `half` eye state |
| `06-mouth-event.png` | A forced `smile` mouth event just past its 400ms onset |
| `07-hurt.png` | Hurt expression |
| `08-reduced-motion.png` | Reduced motion on |
| `09-mouse-gaze-bonus.png` | Real mouse move sets gaze via `input.ts` |
| `10-keyboard-overrides-mouse-bonus.png` | A held arrow key overrides a stale mouse position (the Part 2 `input.ts` fix, re-verified) |
| `clip-12s.webm` | ~14s (the "12s" name is inherited and kept for continuity) of driven motion: a turn, an expression change, a blink, a mouth event, back to centre — recorded in its own browser context |
| `idle-8s.webm` (new) | ~9s of **pure idle, zero input** — sway, blink schedule and mouth/brow drift with nothing else going on, so those layers can be judged in isolation |

**A capture bug found and fixed while producing these, worth recording:** a
fixed `waitForTimeout` after `setGaze`/`blink` is not reliable against a real
`requestAnimationFrame` loop under headless Playwright — a burst of queued
RAF callbacks can each run with `dt` clamped to `driver.ts`'s 50ms cap and
finish an entire ~150ms blink, or fully settle a spring, before the very
first post-call state read ever happens; conversely the *very first* read
right after the call can still show the *previous* target's already-zero
residual, one tick too early. Fixed by polling the actual driver state
(`snapshot().frame.eyeState` / `springResidualDeg`) instead of guessing a
wall-clock delay — this is what actually caught bugs 1-3 above being
consistently reproducible instead of intermittent-looking.

## Updated: what is real vs. a documented stand-in

Rows added or changed this pass (see Part 2's table above for the rest):

| Piece | Status |
|---|---|
| Frontal z-order (`hairBack` behind the pinned body) | Real, fixed this pass (bug 1) |
| Yaw-bracket cross-dissolve including frontal's own layered stack | Real, fixed this pass (bug 2) |
| Iris travel inside its painted socket | Real, new this pass — moves with head yaw/pitch, no independent saccade |
| Earring/strand lag (independent `ExponentialSpring` + idle `BandNoise` per part) | Real, new this pass — disclosed simplification, not a pendulum sim |
| `q34-left`'s painted turn amount | **Art limitation, confirmed this pass** — the key itself barely turns; not a runtime bug, not fixed here |
| Mid-dissolve double-exposure (q34-left ↔ profile-left) | **Known, confirmed this pass** — inherent to the disclosed no-mesh-warp design; both endpoints are clean |

## Tests (unchanged, still pass)

`npx tsc --noEmit` clean. All 31 `tests/unit/pause-living-portrait-*.test.ts`
still pass unchanged — this pass touched only `renderer.ts` (the WebGL2
layer, which those tests exercise only through the driver's no-GPU
degradation path, `pause-living-portrait-driver.test.ts`), so no new test
coverage of the fixes above exists at the logic level; they were verified by
rendering to a real GPU canvas and looking, per this project's own "prove a
bug by running the engine" rule (AGENTS.md hard rule 3) applied to
presentation code, where the equivalent is "prove it by rendering it".

---

# Part 4 — the fix pass (attempt 3 on Sonnet, this pass)

Owner of everything under `prototype-v2/` and `tools/gen/inpaint.mjs` this
round; also added `tools/gen/defringe-layer.mjs` and
`tools/gen/fillhole-fix.mjs`. The brief was an adversarial measurement
refuting Part 3's own "fixed and only a faint, narrow-range double exposure
remains" claim: a severe, hard-edged double-exposure was found at *every*
sampled yaw away from dead centre, including inside the very bracket Part 3
said it had fixed, and even in Part 3's own committed "clean" stills. This
section is the root-cause chase for that finding, what it actually was (not
what Part 3 guessed), and what is fixed versus still disclosed.

## The critical finding was three bugs, not one, and the biggest one wasn't in `renderer.ts`'s bracket logic at all

Reproducing the refutation's own sampled yaws (2.7°, -13.4°, -22.5°, -46°,
-68.8°, -74.6°) at native 1:1 resolution confirmed it immediately: a hard,
rectangular, wrong-toned patch sitting over the face, present even at exactly
yaw 0° with a single fully-opaque key and zero cross-dissolve happening.
That last fact ruled out the cross-dissolve as the sole cause before anything
else was changed — a bracket-blend bug cannot appear at t=0/t=1 with a single
key drawn once. Three real, independent bugs were found this way, each
proven by isolating it (rendering with just that layer, or just that fix,
toggled) rather than reasoned about from source alone:

**1. A duplicate, un-scoped fill-in draw (confirmed, fixed).** The
gap-mitigation fill-in (`drawFrontalFrontStack(1, [0,0], ..., false)`, the
"known visual gap" mitigation from Part 2/3) ran unconditionally every frame,
at a fixed `[0,0]` offset, even for every yaw in `(-40°, 40°]` where frontal
is *also* the bracket's own `a` or `b` key — drawn a second time a few lines
later at the bracket's own chin-alignment offset, which is non-zero
everywhere except exactly yaw 0 (the two blended keys don't share a chin
position). Two full-opacity copies of frontal's own `headCore`+`hairFront`,
one static and one sliding with `t`, is a textbook double exposure that grows
with `|t|` — exactly "every yaw away from dead centre" within that range.
Fixed by computing the bracket *before* the fill-in and skipping it whenever
frontal is already part of the active bracket (`frontalInBracket` in
`renderer.ts`); the bracket step already draws frontal's full, correctly
z-ordered stack at the right offset for every yaw where it applies, so
nothing is lost outside that range either.

**2. Every placed sub-quad fed its own LOCAL texture UV into a shader mask
built for CANVAS-space UV (confirmed, fixed).** `BODY_VERT`'s `headMask()` compares
`aUV` against `uHeadBox`, which is defined in canvas-normalised UV space
(`rig.json`'s own `headBox`, roughly the whole plate). For the stand-in's one
full-canvas grid mesh `aUV` *is* canvas UV, so this was correct there — but
every authored-rig placed quad (an authored key's own crop, a frontal
sub-layer, the pinned body) is drawn as a small quad whose `aUV` always runs
0..1 across *just that crop*, never the canvas. Feeding that straight into
`headMask()` silently mis-scored every one of these draws' own mask/shading
independently of where it actually sits on the plate. Fixed by adding a
`uUVBox` uniform (that quad's own box in canvas-normalised UV; identity for
the stand-in) and reconstructing the true canvas UV from it before masking,
in both the vertex shader (`headMask`) and the fragment shader (`shadowSide`,
which used to read local `vUV.x` the same wrong way). This is a real,
independently-confirmed bug — but rendering the maths by hand for `headCore`'s
own box showed its own mask value was already ≈1 (uniform, no visible edge)
either way at yaw 0, so on its own this did not explain the critical
double-exposure; item 3 did.

**3. `gl.pixelStorei(UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)` against a
straight-alpha shader and blend function (confirmed, fixed — this is the one
that actually produced the reported box).** `gl-utils.ts: createTextureFromImage`
uploaded every texture pre-multiplied. `BODY_FRAG` samples the texture
straight (`vec4 c = texture(uTex, vUV); fragColor = vec4(c.rgb, c.a * uOpacity)`)
and the blend function is `gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)` —
both are the straight-alpha convention, which itself supplies the one
multiply by alpha. Premultiplying on upload multiplied every texel's RGB by
its own alpha *once*, and the straight-alpha blend multiplied by alpha
*again* — any pixel with partial alpha (every soft-feathered cut edge on
every one of these layer PNGs: `hairBack`, `headCore`, `hairFront`, both eye
apertures, both strands, the earring) got darkened by alpha² instead of
alpha. Invisible at alpha 0 or 1 (0²=0, 1²=1), which is exactly why it only
ever showed up as a "box" tracing each layer's own soft-edged crop boundary,
never in a texture's fully-opaque interior or the fully-clear canvas around
it. **Isolated proof:** re-rendering frontal alone (`a`=q34-left, `b`=frontal
at `t`=1, i.e. zero contribution from any other key, reduced motion on so the
spring settles to exactly yaw 0) still showed the full box before this fix
and showed nothing after it; a plain `sharp` composite of the same layer
files at their authored boxes (no WebGL, no premultiply involved at all)
never showed it either, which is what pointed here in the first place. Fixed
by uploading straight (unmultiplied) alpha, matching the shader/blend
pipeline that was already written for it.

## A fourth, separate, real defect: a corrupted "filled" eye-aperture hole

With the box above gone, a smaller, still-clearly-wrong grey-green rectangle
remained sitting on each iris. Isolating layers by skipping them one at a
time in a live page (`renderer.drawFrontalLayer` monkey-patched from outside)
showed skipping `irisR`/`irisL` did **not** remove it, but skipping
`eyeApertureR`/`eyeApertureL` did — so it lives in
`eyeApertureR.filled.png` / `eyeApertureL.filled.png` themselves (the "iris
hole filled from neighbouring sclera pixels" the art pass's own README
describes). Rendering that file's RGB channel alone (alpha ignored) showed a
flat, hard-edged rectangular block sitting over the iris — a real colour
defect baked into the file, not a rendering bug at all. Comparing it against
its own un-filled sibling (`eyeApertureR.png`, `eyeApertureL.png`, both still
on disk) proved the original cut's colour was always fine — the un-filled
file's RGB in that exact region is the real, correct iris art, just gated by
alpha 0 there — so the corruption was introduced specifically by the
original `rig-cut.py fillhole` run, not the cut itself, and not something
this pass needed the plate for.

**Fix: `tools/gen/fillhole-fix.mjs`** (new tool, mine to own this pass).
Reconstructs each `.filled.png`: alpha comes from the existing filled file
(the complete, intended visible shape); colour comes **only** from the
unfilled file's own real pixels (wherever its alpha says there's real
content) — the filled file's own colour is never trusted for anything, since
it's the thing that turned out to be wrong. Whatever the unfilled file still
leaves transparent (the actual hole) gets its colour by iteratively averaging
already-resolved 8-neighbours inward from the hole's real border (the same
ring-dilation idea `rig-cut.py fillhole` and this pass's `defringe-layer.mjs`
both use, just driven by an explicit two-file hole mask instead of an alpha
threshold on one file). A first version of this tool trusted the filled
file's own colour for anything it didn't classify as "the hole" by an alpha
test and dilated from there — checked by rendering the result, and it changed
nothing, because the corruption extended into pixels that test didn't count
as hole-shaped; the version committed here throws away the filled file's
colour entirely and only ever seeds from the unfilled file. Applied to both
eyes; `docs/target/approved-hashes.json` and `public/art/**` are untouched
(these are `prototype-v2/art/` derivatives, never the approved plate).
`tools/gen/defringe-layer.mjs` (also new, an alpha-edge colour-bleed fix for
a plain soft-cut boundary, the same idea without the two-file hole logic) was
built first while chasing this and is kept as a general-purpose tool even
though the actual defect here turned out to need the two-file version.

## Chest sway: built but wired to nothing (AGENTS.md hard rule 4), now wired

`PortraitStateMachine.chestSway()` (correct band-noise maths, independent
phase from the head, already covered by
`tests/unit/pause-living-portrait-dynamics.test.ts`'s phase-independence
check) was never called by anything — `driver.ts` never read it and
`RenderFrame` had no field for it. Measured live: the pinned body/collar
region's luminance over ~4s of idle moved by 0.0025 levels (pure noise
floor) — literally motionless, contradicting the architecture brief's own
"a pinned body layer... that never moves except breathing" and the README's
own status table, which claimed this row "Real, tested" without qualifying
that the chest half produced no visible output.

Fixed by threading it through: `state.ts`'s `Frame` gained a `chestSample`
field (the same value `chestSway()` already computed, now actually reaching
somewhere) → `driver.ts` passes it into `RenderFrame` → `renderer.ts`
converts it to a small NDC offset (`chestOffsetNdc`, amplitude from
`RIG_CONSTANTS.sway.chestAmpPctIpd` against an IPD sampled directly from the
plate's own pupils — `Math.hypot(609-338, 406-422)` ≈ 271.5px, per Part 1's
own colour-sampled anchors) applied to the pinned body layer, mostly
vertical (breathing) with a smaller horizontal component (a tuning split,
not a measured constant, same reasoning as `IRIS_TRAVEL_PX`). Re-measured the
same way: the collar region's luminance now moves by 0.92 levels over the
same window — roughly 370× the old noise-floor reading, and a real, visible
breathing motion on screen (`docs/screenshots` not re-captured for this
specific measurement; verified in the browser and via the luminance probe in
`critic/scratch`-style script, not committed).

**A bug this introduced and this pass also fixed:** giving only the body
layer a chest offset opened a visible seam at the collar during a turn —
`hairBack`'s own box (`[0,0,832,702]`) overlaps the body's box along the
collar, and the two are pixel-identical crops of the same plate there, so
they need to move together. `hairBack` and the body now share one
`chestOffsetNdc` value per frame instead of the body moving alone.

## Idle sway wobbling against the yaw hard stop (plausible finding, addressed)

Measured: held at the yaw limit (gaze target -1, i.e. -85°), the spring
itself settles to a true 0 residual, but the *rendered* yaw (spring + always
present idle sway) kept moving between -85° and about -83.8° indefinitely —
reads as the head bouncing near the wall rather than "holding at the
extreme". Not a spec violation on its own (the spec's hold description is of
a held-stick reference clip, and idle sway is itself required), but easy to
read as a defect and cheap to soften: `state.ts` now tapers the yaw sway's
amplitude over the last 8° of room to whichever hard stop is nearer
(`YAW_EDGE_TAPER_DEG`, a tuning choice, floor 0.2× rather than 0), fading
smoothly rather than clamping the result after the fact. Re-measured the
same way as the refutation: held at -85°, yaw now ranges -85.0° to -83.79°,
a 1.2° spread — down from the refuted ~6° — while a moderate hold (e.g. -22°
target) keeps its full, spec-matching sway amplitude, checked in
`tests/unit/pause-living-portrait-state.test.ts` (spread at the extreme is
asserted smaller than spread near the centre, and the value never dips below
the hard stop).

## Re-measured, re-verified: what changed and what's still exactly as disclosed

| Yaw sampled (refutation's own list) | Before this pass | After this pass |
|---|---|---|
| 0° (dead centre) | Clean (Part 3's own claim) | Still clean |
| 2.7°, -13.4°, -22.5° (inside the frontal↔q34 bracket) | Severe, hard-edged double exposure (refuted "fixed") | Clean eyes, no box; a much fainter residual tint from the inherent linear-then-eased cross-dissolve (see below), well below the severity found |
| -40° (q34-left/frontal boundary) | Severe | The duplicate-draw and premultiply bugs are gone here too, but a visible ghost of a differently-lit pose remains — see "still not fixed" below |
| -46°, -68.8°, -74.6° (profile-left↔q34-left) | Severe | Reduced (no more alpha² darkening), but the underlying gap is still visible — see below |
| Tearing sweep, full range, native capture | No holes/broken geometry (this part of Part 3's claim held) | Still holds; re-swept this pass, no regressions |

**Also addressed alongside the critical finding, both real, both root-caused:**
a fourth eye-region artifact (the corrupted `.filled.png` colour, above), and
a fifth (`headMask`/`uUVBox`), neither separately reported by the refutation
but found while isolating it, described above.

**A smaller, honest reduction, not an elimination — the cross-dissolve
between structurally different paintings itself.** Blending frontal against
`q34-right`/`q34-left` at any weight strictly between 0 and 1 always shows
*some* double exposure, because the two paintings' facial features simply
don't sit at the same pixel positions — that's the disclosed, deliberate
absence of a real per-triangle mesh warp (Part 2's own table: "**Not
built.**... judged not worth the added risk/build time"), and building the
real fix is out of this pass's scope too (a mesh warp needs per-triangle
deformation of the head geometry from the 8 shared landmarks, not a shader
uniform fix or an art-file patch, and the previous pass's own risk/time
judgement on it still applies). What this pass *can* do safely — and did —
is shrink how much of each 40° bracket segment carries a strongly-visible
blend: the cross-dissolve weight `t` is now passed through `smootherstep`
(flat near 0 and 1, all its motion compressed toward the segment's own
midpoint) before it reaches both the opacity and the chin-alignment offset,
so only a narrower band near each transition's centre shows a strong blend
instead of the whole segment showing a weaker one. This is a real,
measurable narrowing of the affected range, not a claim that the ghosting
itself is gone — re-sampling **-40°** and the **profile-left↔q34-left**
range (outside the frontal bracket, where the fill-in — not the
cross-dissolve — is the mechanism) still shows a visible double exposure,
because those two mechanisms sit on top of the same root cause: the art
delivery's own disclosed gap (`art/rig.json`'s `knownIssues`: "hidden-region
inpainting... was not attempted"). Fixing that for real needs painted
hidden-region art for `q34-left`/`profile-left`/`q34-right`, which is an
art-pipeline task this pass does not own (its own scope, per the fix brief,
is `prototype-v2/**` and `tools/gen/inpaint.mjs`/the two new tools above —
runtime and derived-asset colour fixes, not new painted content). **Do not
read the table above as "fixed everywhere" — read it as "the two independent
runtime bugs that made an already-disclosed art gap look far worse than
disclosed are gone; the art gap itself is still exactly what it always
was, disclosed again here.**

## Re-captured deliverables (`shots/`, all 10 stills + both clips replaced)

Same method as Part 3 (real Chromium, `PYREFLY_BROWSER=gpu`, real Playwright
input events, polling actual driver state rather than a fixed wait) —
**and a capture bug of this pass's own found and fixed the same way Part 3
found its own:** polling `springResidualDeg < 0.3` right after a fresh
`setGaze` call can pass on its very first check if the *previous* target had
already converged to ≈0 residual and no animation frame has run yet to
recompute the residual against the *new* target — caught because the first
draft of `02-three-quarter-left.png` came out dead centre instead of turned.
Fixed by waiting ~120ms of real time (a few render ticks) before polling for
convergence, so the check is only ever watching a real settle. All 10 stills
and both clips (`clip-12s.webm`, `idle-8s.webm`) were re-rendered end to end
after this fix and looked at.

## Tests

Full `npx tsc --noEmit` clean. All previous 31
`tests/unit/pause-living-portrait-*.test.ts` still pass unchanged. Six new
ones in `pause-living-portrait-state.test.ts` cover the two logic-level
changes this pass made (chest sway wiring and the yaw-edge taper): `Frame.
chestSample` is present, non-zero and varies over time when not reduced
motion, is exactly 0 under reduced motion, and runs on an independent phase
from the head's own yaw; and held-at-the-extreme yaw wobbles less than
held-near-centre yaw while never dipping below the hard stop. The three
renderer-level fixes (the duplicate draw, the UV-space mask bug, the
premultiply bug) and the fillhole-fix tool have no logic-level test coverage
— same reasoning as Part 3's own tests section: they were verified by
rendering to a real GPU canvas and looking, because that is what "prove a
bug by running the engine" (hard rule 3) means for a shader/compositing bug
that a jsdom no-GPU test can't see at all.

## Not done, and why

- **The real per-triangle mesh warp.** Still not built, for the same
  risk/time reasons Part 2 gave and this pass re-confirmed by measuring the
  cost of *not* having it (see above). This is the actual fix for the
  remaining cross-dissolve and fill-in ghosting.
- **Hidden-region inpainting for `q34-left`/`q34-right`/`profile-left`.** An
  art-pipeline task, disclosed by the art rig itself since Part 1, confirmed
  still needed by this pass's own re-measurement.
- **`profile-right`, `eyes/closed`'s disclosed identity miss, brow patches.**
  Untouched, out of this pass's scope, exactly as Part 2/3 left them.
- **The measurement caveats the refutation itself flagged as unconfirmed**
  (relight-swing confound, grain below the spec band under a resized
  compositor screenshot) were not chased further this pass — both were
  explicitly logged as capture-method caveats, not confirmed defects, and
  nothing this pass touched (`light.ts`, `post.ts`'s grain shader) changed
  either mechanism.

---

# Part 5 — v3 art assembly (2026-09-22)

Answers the re-capture of `8d5c611` (`shots/CAPTURE.md`): a tone seam across
the collar in every still, a doubled iris and a box edge in the hair at -40,
a box seam at -80, colour speckle in the fringe, a lighter blink rectangle,
the braid and pendant floating under a turned face. Game case: **FFX-2 only**
(the plate is Yuna X-2); the runtime plumbing is shared by any plate.

New stills: `shots/v3/` (canvas pixels at native 832x1216, real GPU Chromium,
real keys where a key exists; `capture.json` says which). Contact sheet
`shots/v3/sheet.png`; plate vs rest composite vs live rest frame
`shots/v3/target-vs-rest.png`. Rebuild everything with
`bash tools/gen/rig-build.sh` (no ComfyUI needed: the picked inpaints are
committed under `art/v3/jobs/out/`).

## The collar seam: what it was

Not colour management and not gamma. In v2 the bracket for yaw 0 is
`(a = q34-left, b = frontal, t = 1)`, and `renderer.ts` drew `a` OPAQUE and
frontal's head stack on top. The frontal head stack has no body layer, so
q34-left's rectangular crop (its own neck and collar, graded differently,
boxed to y 860) stayed visible over the pinned body at every yaw, dead centre
and reduced motion included. The same mechanism made the -40 doubled iris
(frontal's iris at partial weight over q34-left's) and the box edges in the
hair (each key's crop rectangle).

Fix (runtime: `src/renderer.ts` rewritten, 262 lines; `src/gl-layer.ts`,
`src/layers.ts`, `src/motion.ts` new): every key renders as one COMPLETE
composite into its own target (frontal: its 11 layers + patches; a yaw key:
its back hair, the pinned body, its front head), and a yaw between keys mixes
two complete composites. At a key, one composite is drawn alone. Proof:
`art/rest-diff.png` (numpy: the 8-bit layer PNGs re-composited in z-order vs
the plate, premultiplied RGB and alpha: **MAD 0.0, max 0, 0 differing
pixels**) and the live WebGL canvas with `?post=0` at rest: **0 differing
pixels** against the plate over the background colour (checked in the
browser). With the post pass on, the grade, grain and vignette apply to the
whole frame uniformly.

Also found by running the runtime's own state machine
(`tools/gen/rig-range.mjs`): v2's `yawNormFor` returned 0 for every left
turn, so the iris, strands, earring and relight never moved to the left.
Fixed in `src/motion.ts`.

## Masks (item 1)

`tools/gen/rig-masks.py`. Figure silhouette = the plate's alpha (binary;
isnet-anime re-run on the plate agrees at IoU 0.9961, `masks/silhouette.json`).
Classes hair / skin / body / earring / eye windows = a geodesic assignment
from hand-drawn seed scribbles (`masks/frontal.seeds.json`) whose edge cost
rises across dark ink and colour edges, so every class boundary snaps to the
painting's own lines (k-means colour clustering found the seed colours). Hair
splits into hairFront / strand1 / strand2 / hairBack the same way
(`masks/frontal.layers.json`). Irises are ellipses fitted to the saturated
iris pixels and grown by the limbal ring; lids are a ring around each eye
window; outline ink within 3 px of an upper layer belongs to that layer (a
moving layer carries its own outline); the tassel's cast shadow rides the
earring. Feathers: 4 px (body, headCore, hairFront), 6 (strands), 3
(earring), 1.5 (irises, lids: a 3 px feather visibly softens the lid line),
0 (hairBack, the bottom layer). A feather only ever falls onto a lower
layer's pixels and carries the plate's colour, which is why the rest pose is
exact. Magenta checks: `art/v3/overlays/<layer>.png`; class maps
`masks/classes-overlay.png`, `masks/owner-overlay.png`.

Straight-edge audit (longest straight run on each layer's alpha boundary off
the canvas edge): 11 to 50 px everywhere, except hairBack's 104 px at x 107,
y 317-420, which is the plate's own alpha edge (the approved painting's cut,
not ours), and hidden-fill boundaries that stay under an upper layer at every
reachable displacement.

## Hidden regions (item 2)

`tools/gen/rig-range.mjs` runs `src/state.ts` for 1200 s per expression under
adversarial input and applies the renderer's offsets: `art/v3/range-sym.json`
(chest +-8.8 x +-25 px, iris +-11 x +-7, earring +-28, strands -34..31).
`tools/gen/rig-fill.py plan` turns that into the region each layer can
uncover and five inpaint jobs, pre-filled from the layer's own visible pixels
and refined with `tools/gen/inpaint.mjs --latent` (new, additive: VAEEncode +
SetLatentNoiseMask, so a low denoise keeps the pre-fill) with the plate's
identity block:

| job | pixels | what | pick |
|---|---|---|---|
| neck | 32587 | the neck under the jaw (every yaw key's head uncovers it) | variant 2, denoise 0.35 |
| earHair | 18327 | hair and cheek under the swinging braid | variant 2, 0.4, row-clone prefill |
| earCollar | 7775 | hood under the tassel | smooth fill only (see below) |
| behind | 22790 | hair behind the body's moving outline and the strands | variant 1, 0.55 |
| face | 10233 | forehead, brows, lids under the fringe's lower edge | variant 2, 0.45 |

`merge` removes the diffusion pass's tone drift (measured in a ring just
outside the mask) and the step at the join. Iris sockets are filled
geometrically (sclera push-pull), no diffusion.

## Profile-right (item 4)

`tools/gen/rig-keys.py mirror`: profile-left mirrored about the pinned neck
axis (x 495), then her visible eye (now her LEFT) recoloured from green to
the plate's blue inside a measured iris mask, keeping every line and
highlight (801 px; before/after at 3x:
`art/v3/overlays/profile-right-iris-check.png`). Markers: the braid hangs on
her right, so a right profile correctly shows none; the red/cyan clasp sits
on her left but neither profile key has it: not added, disclosed. The
mirrored key's old canvas cut is outpainted and the back of the head rounded
by a curve. The rig's yaw range is now symmetric, -85..85.

Also: q34-right re-placed (its first alignment read the chin 110 px too high
and drew the head 13 percent too large, so it could never sit on the frontal
neck); q34-left and q34-right outpainted beyond their crop rectangles. Every
yaw key is cut into `back` (hair below the jaw, under the body) and `front`
(face and head hair, over the body); its own neck and collar are dropped
(the frontal body shows there).

## Eyes, brows, mouth (items 5, 6)

`tools/gen/rig-face.py`. Blink states are measured lid slides: the plate's
own upper-lid band (lid line + lashes) slides down per column over the eye
opening: blink-1 0.66, half 0.5, blink-2 0.33, closed 0. Her left upper lid
is under the fringe, so its band is her right one mirrored. Difference
outside the lid region: **0.0 levels** for every state
(`art/v3/patches/eyes/*.diff.png`). The renderer shows the nearest measured
state (crisp lids, never two cross-faded lash lines). A diffusion refine of
the closed eyes was tried (6 candidates at denoise 0.55 and 0.65, "closed
eyes, eyelashes" + the identity block): all rejected, 4 reopened the eye with
a new iris and 2 changed the lash line. The geometric closed lid is used.

Brows: her right brow is matted against a per-column forehead-to-lid skin
gradient, mirrored across the bisector of the iris centres, and painted into
headCore's hidden fill under the fringe (her left brow never shows in the
plate). `raised` lifts the brows 1-5 px (more at the inner end) and lifts
hairFront 3 px with them; `drawn` pulls the inner ends down 3 px and in 2 px.

Mouth: the v2 inpaints re-matted (drift removed, alpha only where the mouth
changed), so no patch edge shows.

## Still not right (disclosed)

- **Mid-dissolve double exposure.** Between keys (`03`, `05`, `07`, `09`) two
  complete composites are mixed, so a partial blend still shows two faces.
  Only a per-triangle mesh warp removes it; not built in this pass.
- **Collar under the tassel in the yaw keys.** Five inpaint rounds invented
  tassel-like shapes or streaks; the smooth fill used instead reads as a soft
  strip where the braid hangs in the frontal (`06-left-85`, `10-right-85`).
- q34-left still barely reads as a turn (a painting limit, `keys.md`).
- profile-right's back of head is a clean curve, not a hair silhouette.
- Brows, blink intermediates and profile-right have not been through an
  independent judge or Bailey.

# Part 6 — v3.1 runtime: mesh warp, turn continuity, seam-matched patches (2026-09-22)

Game case: **FFX-2 only** (the plate is Yuna X-2); the renderer plumbing
works for any plate. Full check with every still, crop and number:
`shots/RUNTIME-CHECK.md` (+ `shots/runtime-check.json`, `shots/sheet.png`,
`shots/warp-vs-crossfade.png`).

## What was built

- **Per-triangle mesh warp** (`src/warp/delaunay.ts` Bowyer-Watson,
  `src/warp/mesh.ts` `PairWarp` / `lerpLandmarks` / `mapPoint` /
  `paintWeight`, `src/warp/cache.ts`, the warp program in `src/gl-layer.ts`).
  20 shared landmarks per key (`art/v3/warp/landmarks.json`, order in
  `artMeta.commonLandmarkOrder`) plus fixed frame and shoulder pins
  (`artMeta.v3.warp`). One Delaunay topology per bracket, on the pair's
  midpoint shape. Between two keys both are warped onto the interpolated
  landmarks; shape follows smootherstep(t) across the span, paint swaps in the
  middle half only. The two warped head passes (behind the body, in front of
  it) are mixed by coverage (`mixUnion`), and the body is pinned and drawn
  once. At a key (and at rest) nothing is warped: rest = plate, 0 pixels over
  1 level in the live canvas. `?warp=0` shows v3's plain cross-dissolve.
- **Keys re-slotted** (`tools/gen/rig-turns.py mirror|wire`). `q34-right`'s
  painting faces the viewer's LEFT (it is `turn-l45` now); the right turn is
  its mirror with both irises swapped (`turn-r45`); the profiles' visible eye
  colours were backwards and are swapped by mirroring (`turn-l85` blue,
  `turn-r85` green). q34-left and the four v3 key ids stay on disk
  (`artMeta.v3.retiredKeys`). The keys' own collar fringe is keyed out and a
  mirrored source's canvas cut fades out over 48 px.
- **Patches** (`src/patch-blend.ts`, used by `src/layers.ts` at load): each
  patch goes through its own feathered matte (eyes 2.5 px, brows and mouth
  3 px), after a per-channel gain and offset solved by trimmed least squares
  on the seam ring against `art/rest-composite.png`.
- **Turned body** (`tools/gen/rig-collar.py`): the frontal tassel's whole
  footprint inpainted into `art/v3/layers/frontal/body-turned.png`, drawn for
  turned keys and lerped in across a frontal-to-turn blend.
- `renderer.ts` 337 lines, all source files under 400; the driver seam is
  unchanged. Rebuild: `bash tools/gen/rig-build.sh` now ends with the v3.1
  steps. Capture: `node tools/gen/rig-runtime-check.mjs --url <prototype url>`
  with `PYREFLY_BROWSER=gpu`. Landmark overlays:
  `tools/gen/rig-landmarks.py overlay|sheet`.

## Still not right (disclosed; the list with reasons is in shots/RUNTIME-CHECK.md)

The right turn's braid hangs on her left (mirror); the profiles have no braid
on the near side; the frontal's orange hair and the keys' brown hair
cross-fade mid-turn; a faint profile line at -60; blinks exist only on the
frontal key; the lid patch is a flat slab; `rig-range.mjs`'s envelope predates
the warp.

# Part 7 — v3.2/v3.3 fix pass after the v3.1 check (2026-09-22)

Game case: **FFX-2 only** (the plate is Yuna X-2); the renderer plumbing is
shared. Every refuted finding, its root cause, the fix and the re-measured
number: `shots/v3.3/CHECK.md` (stills, crops, strips, `clip.webm`,
`check.json`). Rest with `?post=0` is still the plate to the pixel.

## Runtime

- **One painting at a time** (`src/paint.ts`): the painted key comes from the
  spring's base yaw with 6 deg hysteresis and a 0.2 s dissolve when it
  changes; the geometry still follows the rendered yaw through the mesh warp
  (`src/compose.ts` draws one key or a dissolve of two warped onto the same
  landmarks). A held gaze never mixes two paintings.
- **Motion to the spec's own measure** (`src/motion.ts`, `src/state.ts`,
  `src/constants.ts`): the chest sways on two independent samples calibrated
  to half the peak-to-peak of 5.5 s windows (`windowHalfP2POverRms` 1.48);
  the head sways as a translation carried by the mesh (the neck stretches
  between the jaw and the shoulder pins); the idle yaw wander is 1.2 deg p95.
- **Premultiplied filtering** in the layer and warp programs
  (`src/gl-layer.ts`): no dark fringe along a feathered edge under the warp.
- **Post grade** (`src/shaders.ts`): the vignette darkens only the far corner.
- Checks: `check/` (`npx vitest run --config docs/concepts/pause-until-dawn/prototype-v2/check/vitest.config.ts`):
  paint selection, motion by the spec's window method, and the border pull.

## Art (rebuild: `bash tools/gen/rig-build.sh`, its last block)

- `tools/gen/rig-heads.py`: the backs of the heads painted past x 990 on a
  1152-wide canvas (picks `art/v3/layers/heads/jobs/out3/pl.1`, `qr.1`), so
  a mirrored right turn shows no end of the head; back hair behind the neck.
- `tools/gen/rig-turns.py`: turns cut from those heads; hair to the plate's
  hue; a cool sheen warmed to the plate's highlight; the profile iris whole;
  hair-side landmarks pinned (`art/v3/warp/landmarks.json` `hairSideFixed`),
  four side pins.
- `tools/gen/rig-braid.py`: the right turn's braid on her right side.
- `tools/gen/rig-lids.py`: eight lid frames per key (frontal and every turn),
  harmonic lid skin, one tapered closed lash line, straight-alpha compositing.
- `tools/gen/rig-mouth.py`: mouth patches that change only the mouth.
- `tools/gen/rig-underfill.py`: hairBack and headCore opaque under the layers
  drawn over them (no conflation line under the warp).
- `tools/gen/rig-margins.py`: margins past the canvas (reflected; hairBack's
  right side continued along its strands, `edgeflow`).
- Captures: `tools/gen/rig-check.mjs` -> `tools/gen/rig-measure.py` ->
  `tools/gen/rig-shots.py`. `tools/gen/inpaint.mjs` gained `--identity`,
  `--style` and `INPAINT_WAIT_MIN` (additive).

Still open: `shots/v3.3/CHECK.md`, "Still not right".
