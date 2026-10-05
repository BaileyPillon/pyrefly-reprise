# r39-posescale: one head size and one stance for a figure in every pose (release 39 material)

Date 2026-10-04 to 05. Branch `r39-posescale` (from the local `r39-hires-engine` tip d6810315), worktree `D:/pyrefly-r39-posescale`. Nothing is merged and
nothing is deployed. Game case: **both games, shared plumbing**; the per-figure data is FFX (Tidus, Yuna, Auron, Wakka, Lulu, Kimahri, Rikku, Evrae) and
FFX-2 (the 24 dressphere paintings of Yuna, Rikku and Paine) in their own tables. Trigger, Bailey 2026-10-04: "As poses change for the characters their
size changes too sometimes and that looks really bad".

## Result

Two things were wrong, and both are fixed for every figure measured:

1. **The feet slid.** A plane is centred on the actor by its PNG, not by its feet, so at every pose change the figure jumped 20 to 120 px sideways (1600x900).
   Every standing pose of the 31 hero paintings sets (FFX party, 24 FFX-2 dresspheres) and Evrae's near set now stands where its idle stands: **0.0 px** in real
   frames (was 18 to 121 px), 1.2 px vertical at worst.
2. **The head changed size.** No pose was painted at the idle's pixels per metre, and only guesses corrected it. Read against the idle's face, the large errors
   are fixed: Tidus's victory head was 0.62 of his idle's and the energy-rain 1.19; Auron's ready, attack, item and hurt were 1.33 to 1.56; Yuna's item, victory,
   attack and hurt 1.25 to 1.34; Rikku's follow 1.49 and attack 1.33. **What is left is the size of a by-eye reading, 5 to 9 percent** (the rule asked for 3; see "How good is it").

Measured in real battle frames (headless Chromium on the GPU, 1600x900, the live plane projected through the live camera, the camera divided out, effects
frozen), before this branch (`?posereg=off`) and after; the head columns are the worst of a figure's poses against its idle, for the figures whose heads were read:

| chapter | figure | worst head off its idle's, before -> after | worst feet slide, before -> after |
|---|---|---|---|
| I, III, VIII | Tidus | 38 percent -> 7 | 51 to 121 px -> 0.0 |
| I, III, IX | Yuna | 34 percent -> 9 | 43 to 76 px -> 0.0 |
| III | Auron | 56 percent -> 1 | 33 px -> 0.0 |
| VIII | Wakka | 14 percent -> 6 | 27 px -> 0.0 |
| VIII | Rikku | 49 percent -> 5 | 47 px -> 0.0 |
| I, IX | Kimahri | heads not changed (readings disagreed) | 60 to 70 px -> 0.0 |
| IX | Lulu | heads not changed (readings disagreed) | 18 px -> 0.0 |
| IV (FFX-2) | Yuna White Mage, Rikku Dark Knight, Paine Warrior | heads not read | 60, 55 and 23 px -> 0.0 |
| spherechange (FFX-2) | Rikku Berserker `ready`, Rikku Gunner `ready` and `victory`, Paine Samurai `cast`, Paine Gunner `attack` | 2.00, 1.70, 1.24, 1.29 and 1.17 of the idle's head -> 1.20 (gated), 1.03, 1.00, 1.00 and 1.00 | 27, 31, 14, 16 and 8 px -> 0.0 |

**The independent cross-check's swaps** (driver, from visfix; "painted box" is the silhouette's height on screen, which changes with the pose by design: a
crouch is shorter, a raised arm taller; the rule is about the head and the feet), live 38 and r39 against this branch:

| swap | painted box height | head size | feet shift |
|---|---|---|---|
| Tidus idle -> ready | x0.88 -> x0.88 (the wind-up crouches) | x1.03 -> x1.03 (the by-eye head match of the overnight key was right) | -38.5 px -> 0.0 |
| Wakka idle -> ready | x1.12 -> x1.12 (arm and ball overhead) | x0.97 -> x0.97 | 1.8 px -> 0.0 |
| Wakka ready -> item | x0.81 -> x0.81 | x1.09 -> x1.08 (inside the reading) | -9.8 px -> 0.0 |
| Lulu critical -> idle | x1.37 -> x1.37 (the slouch is 0.74 of her height) | not read | 7.3 px -> 0.0 |
| Evrae: attack start moves the head 54 to 57 px | the head strikes down and left in the painting: 135 painted px; the coil's mass centre moves -0.4 px | | |
| Evrae: near-range hurt draws the plane 11.5 percent taller | the hurt PNG is 874 px high against 784 (the coil reaches lower in it); the figure is drawn at the same scale: silhouette 425 against 397 px, mass centre -0.3 px | | |

The sidecar scales the cross-check lists (ready 1.05 to 1.45, follow 1.10 to 1.40, critical 0.72 to 0.95, Yuna ko 0.52) are the *compensation* for those
paintings having been rendered at other pixel scales, not a fault: the ones I could read (Tidus ready 1.30 and follow 1.40, Wakka ready 1.45) agree
with the idle's head to within 3 to 7 percent; the ones that did not agree (Tidus's victory, Auron's, Yuna's, Rikku's) are replaced by the table.

A real turn by real keys in Chapter I (Tidus Attack: ready, attack, follow, idle), `docs/screenshots/r39-posescale/c1-real-turn-tidus-before-after.jpg`: before, the
crossfade shows two Tidus at two places (the feet slide); after, one.

## The causes, proven by running the engine (hard rule 3)

1. **No pose was painted at the idle's pixels per metre, and only a guess corrected it.** The engine sizes every pose from the idle's pixel scale times the
   sidecar's `scale`. Of 651 paintings only the KO table (VP-1001-05) and the overnight keys carried one, by eye (poses-0930 found those 15 to 40 percent off).
2. **A plane is centred on the actor by its PNG, not by its feet.** A pose's feet are 50 to 190 painted px off its PNG's middle (the FF7 film set had the same
   fault and a manual `poseShiftPx`; no FFX or FFX-2 art had one). Fix: each plane is slid so its stance sits where the idle's does (`PaintedActor.registrationShift`).
3. **A standing lunge wider than tall was laid down like a KO.** `computePoseScale` calls a pose prone at width/height above 1.15; Tidus, Auron and Yuna's `follow`
   are 1.16 to 1.21, so they were placed by the rest rule (rolled by their silhouette's underside; no breath, lean or sway), which is where their 76 to 120 px
   slides came from. The table marks them `upright` (and Evrae's near set, which the airship director already forces upright). A KO is never marked.
4. **Two sidecars sized the plane from the wrong picture.** `braskas-final-aeon-1/ko.json` says 981x942 for a 1216x772 painting and `yunalesca-1/ko.json` 981x788
   for 1216x832, so those KOs were stretched and sized from the wrong pixel count. The loader now uses the painting's own size when the sidecar disagrees by more
   than a pixel (a console warning); the sidecars are untouched (approved-hashes).

Refuted: **a master swap changes the size** (the brief's hypothesis). The library's own QC for all 760 masters says alpha IoU at least 0.997 and shift 0.0 px; on
screen, with every Tidus painting pinned to its 2x and then its 4x master (`?artscale=2|4`), each pose's head-versus-idle ratio changed by at most 0.0001 and 0.0020
and its stance by 0.00 px. **A missing sidecar falls back to a default:** none is missing (651 of 651 have one). The `maxExtent` clamp never fired in a measured pose.
**The life layer** (ready leans 8.5 percent of a figure's height, guard crouches 4.5) is deliberate motion and was left alone; it is on in the real-turn frames.

## What is built

| | file | what |
|---|---|---|
| engine | `src/engine/PoseRegistration.ts`, `src/data/art/poseRegistration{Types,Ffx,Ffx2,Foes}.ts` | the table (generated), its lookup by painting URL, `stanceShift`; `?posereg=off` restores the old behaviour for A/B |
| engine | `PaintedArt.ts`, `PaintedScale.ts`, `PaintedActor.ts` | the table beats the sidecar's and the KO table's `scale`; `stanceX`, `feetRow` (as `anchorY`) and `upright` ride in `PoseMeta`; the stale-size guard; `registrationShift` |
| tool | `tools/posescale/` (`measure.py`, `ps_lib.py`, `ps_sheets.py`, hand inputs `*.json`) | `tiles` (review sheets), `props` (SAM proposals), `measure --write`, `table` |
| record | `docs/target/pose-measure.json` | every measured painting: sha256, its head box and scale, its stance, who read it (reference / reviewed / noise / kept) |
| check | `tools/pose-scale-check.mjs` (+ `.d.mts`), `tests/unit/engine/pose-scale-art.test.ts`, `pose-registration.test.ts` | the gate (see below) |

Hand inputs, all in `tools/posescale/`: `subjects.json` (each idle's face box, read off the painting), `anchors.json` (a pose's head centre), `reviews.json` (the scale
read off the rulers: a number, `"="` = the face fills the ruler drawn at the pose's current scale, or `"keep"` = the readings disagree and the pose keeps what it has),
`overrides.json` (a stance, `standing`, `skip`), `seeds.json` (SAM seeds). Run the python with ComfyUI's embedded interpreter:
`D:/Tools/ComfyUI/python_embeded/python.exe -s tools/posescale/measure.py ...` (numpy, scipy, PIL; torch and sam2 only for `props`).

## The check, for the art lane's new keys (r39-art)

```
node tools/pose-scale-check.mjs                    # PASS/FAIL for every measured subject against public/art; --subjects a,b; --art <dir>; --new lists unmeasured subjects
```
It fails (and says what to run) for: a painting of a measured subject with no record (a new key); a painting whose bytes changed since it was measured; a table that is
not the record; a pose that is `upright`-by-shape but not marked; a reading more than 8 percent from the scale the engine will use that is not applied; a gated pose whose stature is under the floor; a new
key of a subject whose heads were fully reviewed. `npx vitest run tests/unit/engine/pose-scale-art.test.ts` runs the same (and its rules against synthetic art; and the
real art when `public/art` is there). For a new key (say `yuna-warrior/ready`):

```
... measure.py tiles yuna-warrior --poses ready --out <dir>      # the ruler sheet; give anchors.json the head centre if the automatic one misses
(write the scale into tools/posescale/reviews.json: a number, "=" or "keep")
... measure.py measure yuna-warrior --write ; ... measure.py table ; node tools/pose-scale-check.mjs
```
A new key of a subject whose heads were not fully reviewed (most FFX-2 dresspheres, aeons, bosses) is registered by `measure --write` (its stance) and passes with a note; once every pose of a
subject has a reading (`headsComplete` in its record) every later key owes one.

## How good is it

- **Stance**: automatic, the middle of the support under the figure (every opaque pixel in the 4 percent of its height above the lowest thick row, thin soles
  included, the 3rd to 97th percentile of their columns). Checked by eye on stance sheets for Tidus, Yuna, Auron and Wakka; the harness shows 0.0 px by construction
  and the contact sheets show the feet on the line. A band wider than six times the idle's (a ground glyph: Wakka's cast, Yuna Songstress's item) is not trusted and
  stays unregistered; a thin ring is opened away first. Evrae uses the centre of its coil's lower half (`"stance": "mass"`).
- **Head size**: read by eye, at one fixed zoom, against ten rulers (the idle's face box at 0.60 to 1.85) and then in a normalised sheet; about +-8 percent. A reading
  within 8 percent of the scale a pose already has is recorded and not applied (`scaleSrc: noise`: applying it would add as much error as it removes); a larger one
  replaces it. **That is why the residuals are 1 to 9 percent and not 3.** The face and the hair mass disagree in some poses (Tidus cast: the hair says grow 1.12, the
  face shrink 0.85): those are left or set between. Lulu's face (a hair curtain over one eye) and Kimahri's (a muzzle, a mane) were read twice with answers 20 to 40 percent
  apart, so their heads are `keep`. SAM 2.1 (small) was tried for an automatic reading and was unstable on most poses (spread above 12 percent on 152 of 160 FFX-2 poses
  with automatic seeds), so it only proposes; a face detector or a second reviewer is what would tighten the table, and nothing else would change.
- Nothing in `public/art` was edited (no painting, no sidecar, so no backup was needed); the corrections live in git. Every pose of a subject whose head is read is in
  the record with its reading, so a change of method can be re-applied.

## Owed, and not done tonight

- **FFX-2 dressphere heads** (24 dresspheres, 160 poses): stances registered for all; heads read only for five poses (above). A scan of every `ready`, `follow` and
  `victory` key (idle beside the pose at the same on-screen scale, `measure.py pairs`) and a quick look at the rest found nothing else more than about 15 percent off by eye;
  80 of the 160 scales were set by overnight or day-pass eye guesses and are the first to check. A **reading is limited by the painting**: Rikku Berserker's `ready` and Rikku
  Gunner's `ready` are close-ups with a head 1.7 to 2.0 of the idle's against a normal body, so no scale fits both; they carry poses-0930's stature gate (D-298: not under 0.60 of the
  idle's height), which leaves Berserker's head 1.20 and Gunner's 1.03 at 0.60 of the height. **A re-render of those two is the real fix** (art lane). Rikku Thief is the Thief rule's (her idle's head is
  1.4 to 1.7 of the others', poses are sized by body height) and was left. **Across dresspheres** the idle `scale`s differ per sphere (1.09 to 1.41) and the faces on screen still vary by an estimated
  15 to 30 percent between a girl's spheres; equalising them changes statures, so it needs a decision, not a guess.
- **Aeons and bosses** (Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo, Yunalesca, Seymour, Sin's parts, the Moorish...): no records, so no change; their poses share the engine's
  rule 2 (centred by PNG) and have not been measured. The tool takes any subject with a face box (`subjects.json`), or `"stance": "mass"` for a beast.
- **Heads read but not applied**: Lulu, Kimahri, Evrae (`keep`); Auron's critical, follow, sleep and victory (`keep`); Yuna's critical and sleep; Wakka's critical and sleep.
- The 12 FFX-2 `twirl-*` keys are skipped (staged by `fx/mix/twirl.ts` with its own rule). **KO placement** is untouched (`PaintedRest`).
- The sidecars stay as they are; the two stale ones are guarded in code.
- `tests/unit/ui-portrait-face-crop.test.ts` "Chapters 4 and 5, every owned sphere with a painting" fails on this branch only (six dresspheres lack face-crop rows that
  main and r39-int carry); it passes on main and is not this change.

## Pictures, `docs/screenshots/r39-posescale/` (JPEG; real battle frames, every pose of the figure at battle scale, 1600x900; before on top, after below; yellow = the idle's head top, red = its stance, cyan = its feet)

`c1-tidus`, `c1-yuna`, `c1-kimahri-feet`, `c3-auron`, `c8-tidus`, `c8-wakka`, `c8-rikku`, `c9-lulu-feet`, `c4-{yuna-white-mage,rikku-dark-knight,paine-warrior}-feet` (the FFX-2
Chapter IV line-up), `c1-real-turn-tidus` (before / after strips of one real turn); `c8-wakka-feet-before-after.jpg` is an earlier run of the same figure. The harness (`measure.mjs`,
`turn.mjs`, `dress.mjs`, `compose.py`, `summ.py`, `swaps.py`) and every run's JSON are parked in `F:/pyrefly-parked/2026-10-04/r39-posescale/`.
