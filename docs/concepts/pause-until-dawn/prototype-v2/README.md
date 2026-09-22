# Living-portrait prototype v2 — layered rig

Round 2 of the living-portrait work (round 1: `../prototype/`, a single warped
plane — see its README's "What is FAKED" for why this round exists at all).
Built by several agents in one workflow run against the same brief; **this
file documents the art half** (`art/rig.json`'s `keys`, `landmarks`, `layers`
and `patches`) — the runtime driver (`index.html`, `src/*.ts`) is a different
owner's piece of the same brief, being built in parallel in this same commit
window (its own files are not touched or committed by this pass).

`art/rig.json` was written twice this pass: a first draft with a richer,
freely-designed shape, then **rebuilt to match `src/rig.ts`'s own `Rig`
interface exactly at the top level** once that file appeared in the shared
tree mid-session (`character`, `canvas`, `bodyFile`, `headBox`, `keys[]`,
`patches`) — confirmed by loading it and checking every field type and every
referenced file path resolves, so `loadRig()` in `src/rig.ts` picks it up
instead of silently falling back to its built-in stand-in. All of this pass's
fuller data (per-layer files and boxes, named landmarks with visibility and
confidence, judge verdicts, known issues) lives under a sibling `artMeta` key
the `Rig` interface doesn't know about and therefore safely ignores.

Character: **Yuna, X-2** — `public/art/portraits/yuna-x2.png`, Bailey's
approved pick of 2026-09-21 (card 3). The approved painting is never edited;
every file under `art/` here is a derived copy or a new inpainted/cut piece,
named so it can never be confused with the original (`docs/target/
approved-hashes.json` covers the original, not these derivatives).

## What exists and who owns it

| Piece | Owner (this run) | State |
|---|---|---|
| `art/keys/frontal.png`, `art/keys/picked/*.webp`, `keys.md`, `judge.md` | yaw-key painter + independent judge | 3 of 4 keys PASS (see `art/rig.json`'s `artMeta.keys`); `profile-right` FAILS across 5 rounds, excluded from the rig |
| `art/patches/*` (eyes/mouth/brows inpainted states), `patches.json`, `patches.md` | patch painter | eyes half + mouth (parted/smile/pressed) PASS; eyes closed DISCLOSED (one-side colour leak); brows NOT DELIVERED (no brow linework exists in the source to move); blink intermediates and the hurt set NOT ATTEMPTED |
| `art/keys/aligned/*`, `art/landmarks/*`, `art/layers/*`, `art/rig.json` (art half), `tools/gen/rig-cut.py` | **this pass** | see below |
| `index.html`, `src/*.ts` (driver, renderer, state machine, `rig.json`'s `constants`) | a parallel agent in this same run | in progress; not committed by this pass |

## What this pass did

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
5. **Wrote `art/rig.json`** — see the schema below — and this README.

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

## Known issues, found while doing this pass

- **The earring's canon side is inconsistently stated across this run's own
  documents, and I did not resolve it, only flag it.** `keys/judge.md` says
  the earring is "anchored to one specific ear (the same side as her blue
  eye)". I sampled the frontal plate's own pixels directly (not by eye) at
  both `PLATE_ANCHORS.pupils` positions: `(338,422)` reads as green
  (`~(0,238,182)`), `(609,406)` reads as blue (`~(7,123,231)`) — and the
  earring is drawn on the **green**-eye side (viewer-left in the frontal
  key), not the blue side. I used "her right eye = green = the earring side"
  consistently in my own landmark files (`earAttach_R`), verified against
  sampled pixels, not against `judge.md`'s sentence. Whoever next touches
  earring continuity across keys should treat my sampled finding as
  authoritative over the prose in `judge.md`, or re-check both against the
  plate directly before trusting either.
- **`profile-left`'s alignment input (`chin=[215,690]` on the raw candidate)
  was imprecise.** The point I originally picked does map to the plate's
  `chin` anchor `(470,730)` by construction of `place` (that's what `place`
  does with whatever point you hand it), but a wider look at the aligned
  result shows the *actual* chin tip of this candidate's silhouette sits
  closer to `(350,700)`. I recorded the landmark at the visually true
  position rather than force it to `(470,730)`, which means this key's
  overall scale/position is calibrated to a jaw point that isn't quite the
  chin, not the true chin — a small, systematic offset. A follow-up pass
  should re-run `place` on this key with a better-read chin point and redo
  its landmarks; I did not have budget to iterate a second alignment round
  today (AGENTS.md rule 15: one paper preflight, at most a few rounds per
  layer, not unlimited re-measurement).
- **Hidden-region inpainting (forehead under bangs, cheek under a strand,
  neck under the jaw) was not attempted.** See `art/rig.json`'s `artMeta.layers.hiddenRegionInpainting.note` — the gap only appears once a driver actually
  displaces a layer, which doesn't exist yet, so building the inpaint now
  would be guessing at a hole size instead of measuring one.

## What I did not do, and why

- **No front/back hair split or loose strands for the three yaw keys** —
  only `headCore` + one combined `hair` layer each, versus the frontal key's
  eleven-layer breakdown. The brief's own yaw-key scope ("the same head-core
  plus hair layers") is narrower than the frontal scope, and I read that as
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
  silhouette bug into the rig; `art/rig.json`'s `artMeta.keys.profile-right` records why and
  points at the least-bad candidate kept on disk for a future mirror+inpaint
  attempt.
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
- **Did not build `index.html`, any driver module, or `rig.json`'s
  `constants`** — a different owner's piece of the same brief, per the
  orchestrator's file-ownership split for this run.

## Reproducing or extending this

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
