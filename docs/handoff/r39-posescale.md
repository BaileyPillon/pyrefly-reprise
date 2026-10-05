# r39-posescale: one head size and one stance for a figure in every pose (release 39 material)

Date 2026-10-04. Branch `r39-posescale` (from the local `r39-hires-engine` tip d6810315), worktree `D:/pyrefly-r39-posescale`. Nothing is merged and
nothing is deployed. Game case: **both games, shared plumbing**; the per-figure data is FFX (Tidus, Yuna, Auron, Wakka, Lulu, Kimahri, Rikku) and
FFX-2 (the 24 dressphere paintings of Yuna, Rikku and Paine) in their own tables. Trigger, Bailey 2026-10-04: "As poses change for the characters
their size changes too sometimes and that looks really bad".

## Result

The painted figures change size and slide when the pose changes. Measured in real battle frames (headless Chromium on the GPU, 1600x900, the
live plane projected through the live camera, the camera divided out), before this branch and after:

| figure (chapter) | worst head size off its idle's, before -> after | worst feet slide at 1600x900, before -> after |
|---|---|---|
| Tidus (I and VIII) | 38 percent -> 1.1 percent (victory 0.62 of his idle head, energy-rain 1.19, item 1.07) | 120 px -> 0 (follow) |
| Yuna (I) | 34 percent -> 1.6 percent (item 1.34, victory 1.30, attack 1.27, hurt 1.25) | 76 px -> 0 (follow) |
| Auron (III) | 56 percent -> 0.6 percent (ready 1.56, attack 1.45, item 1.45, hurt 1.33) | 49 px -> 0 |
| Kimahri (I), Wakka and Rikku (VIII) | heads not reviewed yet (see "Owed") | 37, 72 and 47 px -> 0 (Wakka's cast stays 52, flagged) |
| Yuna White Mage, Rikku Dark Knight, Paine Warrior (IV, FFX-2) | heads not reviewed yet | 59, 51 and 22 px -> 0 |

"After" is exact by construction for the feet (the engine now puts each pose's stance where the idle's is) and is the **reviewed reading** for the
heads: the reviewed scale is read by eye (see "How good is it") to about 10 percent, so "1.1 percent" says the engine applies the recorded
numbers, not that the numbers are true to 1 percent. What is true: the old errors were 20 to 60 percent and are gone to within the reading.
Real turn by real keys in Chapter I (Tidus Attack: ready, attack, follow, idle), camera divided out: head 152.8, 154.6, 152.2 and 157.8 (x 0.001
world units) after; 158.0, (attack missed), 166.4 and 155.3 before. `docs/screenshots/r39-posescale/c1-real-turn-tidus-before-after.jpg`: before,
the crossfade from follow to idle shows two Tidus at two places (the feet slide); after, one.

## The causes, proven by running the engine (hard rule 3)

1. **No pose was painted at the idle's pixels per metre, and only a guess corrected it.** The engine sizes every pose from the idle's pixel
   scale times the sidecar's `scale`. Of 651 paintings only the KO table (VP-1001-05) and the overnight keys carried one, by eye (poses-0930 found
   those 15 to 40 percent off). The table above is the effect. The sidecar scales are not touched; the measured table replaces them per pose.
2. **A plane is centred on the actor by its PNG, not by its feet.** A pose's feet are 50 to 190 px (of its idle's pixels) off its PNG's middle, so the
   figure slid 20 to 120 px on screen at every pose change (the FF7 film set had the same fault and a manual `poseShiftPx`; no FFX or FFX-2 art had
   one). Fix: each plane is slid so its stance sits where the idle's does (`PaintedActor.registrationShift`).
3. **A standing lunge wider than tall was laid down like a KO.** `computePoseScale` calls a pose prone at width/height > 1.15; Tidus, Auron and
   Yuna's `follow` are 1.16 to 1.21, so they were placed by the rest rule (rolled by their silhouette's underside, no breath, no lean), which is
   where their 76 to 120 px slides came from. The table marks them `upright`. A KO is never marked.
4. **Two sidecars sized the plane from the wrong picture.** `braskas-final-aeon-1/ko.json` says 981x942 for a 1216x772 painting and
   `yunalesca-1/ko.json` 981x788 for 1216x832, so those KOs were stretched and sized from the wrong pixel count. The loader now uses the painting's
   own size when the sidecar disagrees by more than a pixel (console warning); the sidecars are untouched (approved-hashes).

Refuted: **a master swap changes the size** (hypothesis in the brief). The library's own QC for all 760 masters says alpha IoU at least 0.997 and
shift 0.0 px; on screen, with every Tidus painting pinned to its 2x and then its 4x master (`?artscale=2|4`), every pose's head-versus-idle ratio
changed by at most 0.0001 and 0.0020 and its stance by 0.00 px. **A missing sidecar falls back to a default:** none is missing (651 of 651 have one).
The `maxExtent` clamp never fired in any measured pose.

## What is built

| | file | what |
|---|---|---|
| engine | `src/engine/PoseRegistration.ts`, `src/data/art/poseRegistration{Types,Ffx,Ffx2,Foes}.ts` | the table (generated), its lookup by painting URL, `stanceShift`; `?posereg=off` restores the old behaviour for A/B |
| engine | `PaintedArt.ts`, `PaintedScale.ts`, `PaintedActor.ts` | the table beats the sidecar's and the KO table's `scale`; `stanceX`, `feetRow` (as `anchorY`) and `upright` ride in `PoseMeta`; the stale-size guard; `registrationShift` |
| tool | `tools/posescale/` (`measure.py`, `ps_lib.py`, `ps_sheets.py`, hand inputs `*.json`) | measure: `tiles` (review sheets), `props` (SAM proposals), `measure --write`, `table` |
| record | `docs/target/pose-measure.json` | every measured painting: sha256, its head box and scale, its stance, who read it (reference / reviewed / kept) |
| check | `tools/pose-scale-check.mjs` (+ `.d.mts`), `tests/unit/engine/pose-scale-art.test.ts`, `pose-registration.test.ts` | the gate (see below) |

Hand inputs, all in `tools/posescale/`: `subjects.json` (each idle's face box, read off the painting), `anchors.json` (a pose's head centre),
`reviews.json` (the scale read off the rulers: a number, or `"keep"` = the readings disagree, the sidecar stays), `overrides.json` (a stance, `standing`, `skip`),
`seeds.json` (SAM seeds). Run the python with ComfyUI's embedded interpreter: `D:/Tools/ComfyUI/python_embeded/python.exe -s tools/posescale/measure.py ...`.

## The check, for the art lane's new keys (r39-art)

```
node tools/pose-scale-check.mjs                    # PASS/FAIL for every measured subject against public/art; --subjects a,b; --art <dir>; --new lists unmeasured subjects
```
It fails (and says what to run) for: a painting of a measured subject with no record (a new key); a painting whose bytes changed since it was
measured; a table that is not the record; a reviewed pose whose head, drawn at the table's scale, is more than 3 percent off its idle's; a standing
pose wider than tall not marked upright; a subject whose heads are reviewed for some poses and not others. `npx vitest run tests/unit/engine/pose-scale-art.test.ts`
runs the same (and its seven rules against synthetic art). For a new key:

```
... measure.py tiles yuna-warrior --poses ready --out <dir>      # the ruler sheet; centre it with anchors.json if the proposal misses the head
(write the scale into tools/posescale/reviews.json)
... measure.py measure yuna-warrior --write ; ... measure.py table ; node tools/pose-scale-check.mjs
```

## How good is it

- **Stance**: automatic (the middle of the lowest thick part of the silhouette; blades, staffs and tails are opened away) and checked by eye on a stance sheet
  per figure (Tidus, Yuna, Auron looked at; the others are the same code). 19 of 640 poses had a doubtful band; the rule now flags only a band more than six times
  the idle's (ground glyphs and effects: Wakka cast, Yuna Songstress item), which stay unregistered.
- **Head size**: read by eye against ten rulers (the idle's face box at 0.60 to 1.85) at one zoom, about +-10 percent. SAM 2.1 (small) was tried for an automatic
  reading: it follows the hair mass and was unstable on half the poses (spread above 8 percent), so it only proposes. **The face and the hair mass disagree** in
  some poses (Tidus cast: hair says grow 1.12, face says shrink 0.85; Tidus attack the same way): those are set between the two (0.95) or `keep`. The rule the brief
  states (3 percent) is the check's test on the recorded boxes; it cannot be proven by eye. A better reading (a face detector, or a second reviewer) would tighten the table; nothing else changes.
- Nothing in `public/art` was edited (no painting, no sidecar, so no backup was needed); the corrections live in git.

## Owed, and not done tonight

- **Heads reviewed**: Tidus (12 of 12), Yuna (11 of 12; sleep `keep`), Auron (6 of 10; critical, follow, sleep, victory `keep`: the anchors missed). **Not yet**: Wakka, Lulu, Kimahri,
  Rikku, and all 24 FFX-2 dresspheres (their stances ARE registered; their head sizes are as before), the 12 FFX-2 `twirl-*` frames, every aeon and boss (the same method applies; each needs a face box).
- **Across dresspheres** (FFX-2): the idle `scale`s already differ per dressphere (1.09 to 1.41) and the face sizes on screen still vary by an estimated 15 to 30 percent between a girl's
  dresspheres (the boxes are rough). Equalising them would change statures (Rikku Thief is painted with a head 1.4 to 1.7 of the others'), so it needs a decision, not a guess.
- **KO placement** is untouched (`PaintedRest`): a KO's head is within 4 percent after the table, but its resting roll (up to 0.48 rad for Yuna) is the rest rule's.
- The life layer's posture (ready leans 8.5 percent of a figure's height, guard crouches) is deliberate motion and is not corrected.
- The two stale sidecars are guarded in code; the files stay as they are.

## Pictures, `docs/screenshots/r39-posescale/` (JPEG; real battle frames, every pose of the figure at battle scale, 1600x900; before on top, after below; yellow = the idle's head top, red = its stance, cyan = its feet)

`c1-tidus-before-after`, `c1-yuna-before-after` (heads and feet), `c1-kimahri-feet-before-after`, `c4-*-feet-before-after` (Yuna White Mage, Rikku Dark Knight, Paine Warrior: the FFX-2 Chapter IV line-up),
`c8-tidus-before-after`, `c8-wakka-feet-before-after`, `c1-real-turn-tidus-before-after`. The harness (`measure.mjs`, `turn.mjs`, `dress.mjs`, `compose.py`, `summ.py`) and every run's JSON are parked in
`F:/pyrefly-parked/2026-10-04/r39-posescale/`.
