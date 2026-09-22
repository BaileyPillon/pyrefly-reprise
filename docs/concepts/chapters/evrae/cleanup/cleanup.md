# Evrae chapter art cleanup — 2026-09-22

Deterministic, pixel-level fix only (hard rule 15: no re-render). Subject:
Evrae ko. Nothing here is approved (`docs/target/approved-hashes.json` has no
Evrae entry); its 115 files hashed identical before and after this pass. The
changed file is backed up (with its pre-fix original) under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/evrae/`.

## Pin-sized alpha holes between the dorsal spines

`ko.png` had 9 fully-interior alpha holes (found by flood-filling transparency
inward from the canvas border, the same method `tools/gen/fillholes.py` uses —
anything still transparent afterward is enclosed, not background). Two were
large, graceful negative-space gaps that are part of the coiled-serpent
silhouette (16,400 px and 25,330 px) and were left alone; a mid-sized one
(3,393 px) sits in a coil opening next to a spine and was also left alone —
none of these read as a defect at 1:1. Four were small holes right at the base
or tip of the dorsal spines, which do read as a hole punched through solid
scale — sizes 1, 159, 164 and 770 px, all clustered in x265-465, y119-432.

No `*.raw.png` pre-cutout render exists for this file (only the cutout PNG and
sidecar are on disk), so `fillholes.py --raw` was not usable as-is; the same
algorithm was reimplemented with the fallback it already documents for that
case — each hole pixel is filled from the median colour of the surrounding
opaque ring (radius grown from 2px until at least 8 samples are found), not a
flat colour. 1,227 px filled across the 4 holes.

- Before/after (spine tip, ~1px hole): `evrae-ko-hole1-before.png` / `evrae-ko-hole1-after.png`
- Before/after (fold gap, 159px): `evrae-ko-hole2-before.png` / `evrae-ko-hole2-after.png`
- Before/after (spine base, 770px): `evrae-ko-hole3-before.png` / `evrae-ko-hole3-after.png`
- File: `public/art/characters/evrae/ko.json`

## Manifest + backup

`node tools/gen/manifest.mjs` regenerated. The pre-fix original is at
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/evrae/ko.png` /
`ko.json`. `docs/target/approved-hashes.json`'s 115 files hashed identical
before and after (checked both times).

## Round 2 — 2026-09-22, answering the independent judge (`docs/concepts/chapters/evrae/redo/judge.md`, commit 3d410ed)

Deterministic pixel and metadata fixes only (hard rule 15: no re-render, no new
painting method). Nothing here is approved; the 115 `approved-hashes.json`
files hashed identical before and after this pass (checked both times). Every
replaced file's round-1 state is backed up under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-evrae-round2/evrae/`.
Before/after crops for every fix are in `round2/`.

### 1. ko: undo the two mis-filled fin boxes, then white-key the spine oval

The judge found that the aff3fa8 cleanup's `pinHoles` fill mis-applied to two
boxes, `[419,414,443,431]` and `[427,386,465,432]`: these were real gaps
between the tail-fin fronds and the spine (the pre-cleanup file had partial
alpha there — 141.9 and 106.9 mean alpha over the two boxes respectively, not
0), not holes, and the ring-median fill left a hard-edged rectangular red and
brown block. Both boxes were copied back pixel-for-pixel from the pre-cleanup
backup, `D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/evrae/ko.png`.

Separately, an opaque white oval (~93 px, at approximately (429,338), inside
the right-hand spine) that neither the redo nor the first cleanup pass caught
was white-keyed to transparent: distance-from-white ≤ 28, feathered 1.2 px,
boxed to (415,322)-(442,356) so nothing outside that small box was touched.
104 near-white opaque px measured in a 60×60 probe around the reported point
before the fix; 173 px keyed to transparent in the tighter working box.

- Before/after (fin boxes, 3× crop): `round2/ko-fin-before.png` /
  `round2/ko-fin-after.png`
- Before/after (spine oval, checkerboard so the new transparency is visible,
  4× crop): `round2/ko-oval-checker-before.png` /
  `round2/ko-oval-checker-after.png`
- File: `public/art/characters/evrae/ko.png`, sidecar
  `public/art/characters/evrae/ko.json` (new `cleanup[]` entry
  `round2FinRestoreAndOvalKey`)

### 2. breath-charge and hurt: erode the white fringe on the outer silhouette

Both files' alpha is hard-edged (0 or 255 only — no antialiasing at all, so
`dematte.py`'s unmatte-against-white formula has nothing to invert). The
fringe the judge saw is therefore a ring of fully opaque, near-white
(R,G,B > 235) pixels sitting directly on the silhouette's outer edge, not a
blended halo. Fixed by eroding (setting alpha to 0) every opaque near-white
pixel that touches a fully-transparent neighbour — the binary-alpha
equivalent of `dematte.py`'s edge-only decontaminate, limited the same way to
pixels that touch transparency.

Measured "edge" as every pixel with alpha > 0 that touches at least one
0-alpha neighbour, and "fringe" as the near-white subset of that edge:

| File | Eroded px | Edge-near-white share before | after |
|---|---|---|---|
| breath-charge.png | 387 | 3.39% | 1.43% |
| hurt.png | 562 | 6.54% | 1.87% |

(The judge's own numbers — 2.8% for breath-charge, 5.1% for hurt — used a
different edge definition, but both are in the same range and both fall by
more than half after one erosion pass. A second, fainter ring remains on both
files; the brief and the judge both describe a *1 px* fringe, so a single
erosion pass is what was fixed, not repeated further into the art.)

- Before/after (breath-charge, judge's cited region 690,240–820,340,
  checkerboard, 4×): `round2/breath-charge-fringe-checker-before.png` /
  `round2/breath-charge-fringe-checker-after.png`
- Before/after (hurt, checkerboard, 4×): `round2/hurt-fringe-checker-before.png`
  / `round2/hurt-fringe-checker-after.png`
- Files: `public/art/characters/evrae/breath-charge.png`,
  `public/art/characters/evrae/hurt.png`; sidecars `breath-charge.json`,
  `hurt.json` (new `cleanup[]` entries, `edgeFringeErode`)

### 3. hurt: recolour the lavender ghost coil toward the anchor's blue-white

The pale far coil (hue 260–330 in the box x 60–330, y 270–420) read violet-pink
against the anchor's blue-white. Fixed with a boxed hue shift: a spatial mask
(the box, Gaussian-feathered 10 px) times a hue-band mask (trapezoid, full
weight 270–320°, feathered 10° on each side to 260° and 330°), rotating hue
toward 201° — the anchor's own measured cool hue from `judge.md` ("the anchor
is cool hue 201") — with saturation and value untouched.

Hue histogram of the box, compared against
`docs/concepts/chapters/evrae/renders/evrae-b.png` (the picked concept, cited
by the judge as having cool hue 201): lavender-hue (260–330°) pixels in the
box went from 1,830 to 78 (the residue sits at the feather edges of the hue
band); the whole box's median hue moved from 212.7° to 205.0°, closer to the
anchor's 201°.

- Before/after (2× crop): `round2/hurt-ghostcoil-before.png` /
  `round2/hurt-ghostcoil-after.png`
- File: `public/art/characters/evrae/hurt.png`; sidecar `hurt.json` (new
  `cleanup[]` entry, `ghostCoilHueShift`)

### 4. hurt.json / ko.json: pose `scale` so the body reads at idle's thickness

Per `src/engine/PaintedScale.ts`'s `computePoseScale`, a sidecar's top-level
`scale` multiplies that pose's `unitsPerPixel` (derived from idle's own
`baselineY`), which is exactly the lever for "this pose's render came out
smaller than idle's" — confirmed by reading `computePoseScale` and its caller
in `src/engine/PaintedActor.ts` (`applyPose`, around line 928) before writing
anything.

Measured head length (native pixels) as the diagonal of a tight alpha
bounding box around each pose's head (crest to jaw, cut before the neck),
verified by drawing the candidate box over the full painting and checking
it neither clipped the head nor bled into the neck:

| Pose | Head box (x0,y0,x1,y1) | w×h | diagonal (px) |
|---|---|---|---|
| idle-near (reference) | 243,45,395,232 | 152×187 | 240.98 |
| hurt | 240,32,390,143 | 150×111 | 186.60 |
| ko | 102,535,225,614 | 123×79 | 146.18 |

`scale = idle diagonal / pose diagonal`, rounded to 2 decimals:
**hurt.json: `scale: 1.29`** (240.98/186.60), **ko.json: `scale: 1.65`**
(240.98/146.18). Both are well under the 2.2× longest-side clamp
`computePoseScale` enforces. These land close to the judge's ridge-width
estimate (about 1.5 for hurt, about 1.8 for ko) — the head measurement runs a
little lower than the ridge estimate on both, which is expected: the ridge
metric averages the whole coiled body's cross-section, while the head is one
rigid feature whose own foreshortening differs by pose. The two methods agree
in direction and rough size, which is what "confirm by head length" asked
for; the head-length number is what got written, per the brief's formula.

Live verification: Evrae has no registered `ChapterId` yet
(`src/app/screens/frontend/comingChapters.ts` lists `evrae-airship` as
coming, not live), so this used the same fallback the Macalania cleanup used
— a real `PaintedActor` (the class the battle presenter itself uses) injected
into the live scene of a real, playable battle (`seymour-flux`, chapter 1),
via `PaintedActor.fromSubject('evrae', { worldHeight: 4.1, side: 'enemy',
states: ['idle', <pose>], initialPose: <pose> })` so idle loads silently as
the sizing reference exactly as the presenter does it, added with
`scene.add()` to the THREE.Scene found through an existing actor's
`.parent`. Idle-near, hurt and ko were each shown alone at the same camera
framing, next to the real party for scale, and screenshotted. All three now
read at a comparable size — the hurt and ko coils no longer visibly shrink
against Tidus the way the pre-scale renders did.

- `round2/scale-check-idle-near.jpg`, `round2/scale-check-hurt.jpg`,
  `round2/scale-check-ko.jpg`
- Files: `public/art/characters/evrae/hurt.json`,
  `public/art/characters/evrae/ko.json` (top-level `scale` + `scaleNote`)

### 5. idle-far.json: a note, not a scale

NEAR and FAR are not wired into `src/` yet (no reference to `idle-far`
anywhere), so a `scale` value has nothing to consume it and hard rule 6 (never
invent unverifiable numbers) argues against guessing one now. Added a `note`
field instead recording the judge's finding — idle-far's streak is 1024 px
long against idle-near's 1171, and about half idle's ridge thickness, so once
NEAR/FAR is wired this pose will need a `scale` below 1 so Evrae reads as
smaller and farther, not merely thinner at the same length.

- File: `public/art/characters/evrae/idle-far.json`

### Manifest + backup

`node tools/gen/manifest.mjs` regenerated (unchanged — it does not track
pixel content). Round-1 originals of every file this round touched
(`ko.png`/`.json`, `breath-charge.png`/`.json`, `hurt.png`/`.json`,
`idle-near.png`/`.json` for reference, `idle-far.json`) are backed up under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-evrae-round2/evrae/`.
`docs/target/approved-hashes.json`'s 115 files hashed identical before and
after this round (checked both times, see above).
