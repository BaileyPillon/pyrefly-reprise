# The Kimahri rig and the pose-intent rule (branch `rig`, 2026-10-18)

Bailey, 2026-10-17: "yes start rigging, you pick kimahri's costume. start rigging for all chapters please. i want a permanent fix now." The driver's costume pick: **Kimahri's IDLE painting** (the gold-trim white vest).
Game case: **FFX only** for the rig (Kimahri is FFX; his paintings are `characters/kimahri/*`, chapter 1 to 3 art and the hidden chapter "Biran and Yenke", which fields him); **both games** for the gate change (shared plumbing, `critic/CHECKS.md` CHK-020: a gate that
judges a key judges it the same for every subject). Contract entry: [CONTRACT-CHANGES](../CONTRACT-CHANGES.md), 2026-10-18. Pipeline and gate background: [rig-pipeline.md](rig-pipeline.md); engine: [rig-engine.md](rig-engine.md); release: [rig-ship.md](rig-ship.md).

**State: the rig is on disk, gated `ok`, not installed into any art mirror, not merged to main, not deployed, no review run.** `D:/pyrefly-art-rigs/kimahri` (15 parts, 32 bones, 13 keys, 6.95 Mpx, 5.22 MB, a `1x/` tier proved). Nothing was written into `public/art`.

## The driver's acceptance rule, as built

A key passes when BOTH hold: (1) its silhouette overlaps the approved painting of its pose by **0.75** or more, both registered at the idle's stature and feet (it was 0.85); (2) its **landmarks** (head, both hands, both feet, the spear tip) are each within **6 percent of the idle's
height** of where the painting puts them. The painting's landmarks are marked once per pose, in the painting's own 1x pixels, in `tools/rig/subjects/kimahri.json` (`landmarks`; `rig.py export` writes each as the key's `expect`; `proof/marks-*.png` in the scratch folder draws them on the paintings).
A pose that cannot reach the overlap after fit hints may be `source: "authored"` (the config's `authored`): the overlap is waived, the landmarks are not, the gate lists it in `result.authored` and the stamp keeps it, and a clip of it beside the painting is saved for the driver. A painting that faces the
other way from the rig is read **turned** about its stance (`fit.mirror`, written as `turn: true`). Everything else the gate demanded stays: stature and feet bands, no joint hole in any key or at 25/50/75 percent between any two keys, the budget, the stamp, full coverage.
Code: `tools/rig/rig-gate-lib.mjs` (`RIG_BANDS.iou` 0.75, `landmarkPct` 0.06; `key-landmark`, `key-landmark-unmarked`, `key-authored-unverified`; a rig file's `acceptance` may only tighten), `rig-targets.mjs`, `rig_export.py`, `rig_fit.py` (+ `rig_fit_terms.py`: the fitter holds each key to its marks).
Tests: `tests/unit/tools/rig-gate-landmarks.test.ts` (15), the puppet fixture (the painter's marks), `rig-kimahri-mini.test.ts` (regenerated with marks: hurt and victory painted), Python `TestExportAcceptance`/`TestFitLandmarks`.

## The per-key table (the gate's own reading; `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/kimahri --art D:/pyrefly-art-r50`)

| pose | source | overlap | worst landmark | stature (head to soles) | feet dx / dy | holes |
|---|---|---|---|---|---|---|
| idle | the costume at rest | 0.986 | - | 0.999 | 0.000 / -0.001 | 0 |
| attack | painting | 0.763 | 0.045 | 0.949 | 0.009 / -0.003 | 0 |
| cast | painting | 0.769 | 0.044 | 1.016 | 0.000 / 0.001 | 0 |
| defend | painting | 0.762 | 0.040 | 0.990 | 0.001 / 0.003 | 0 |
| hurt | painting | 0.751 | 0.045 | 0.987 | 0.012 / 0.008 | 0 |
| critical | painting | 0.884 | 0.039 | 0.887 | 0.000 / 0.001 | 0 |
| sleep | painting | 0.890 | 0.045 | 0.954 | -0.002 / -0.003 | 0 |
| ready | **AUTHORED**, painting turned | 0.645 | 0.045 | 1.009 | -0.011 / -0.007 | 0 |
| follow | **AUTHORED** | 0.712 | 0.045 | 0.904 | 0.004 / 0.005 | 0 |
| item | **AUTHORED** | 0.651 | 0.045 | 1.048 | -0.015 / -0.012 | 0 |
| victory | **AUTHORED** | 0.633 | 0.045 | 0.941 | 0.010 / 0.003 | 0 |
| jump | **AUTHORED**, painting turned | 0.663 | 0.045 | 0.961 | 0.018 / -0.018 | 0 |
| ko | **AUTHORED** (lies down, `planted: false`, feet not marked) | 0.438 | 0.040 | 0.431 | -0.138 / -0.018 | 0 |

Gate: OK, 13 of 13 keys, full coverage (every painted pose has a key, `exempt` empty), 247 poses scanned for holes at 27 joints, none. Six of twelve poses are authored; the six painted ones clear 0.75 by 0.001 to 0.14 (hurt by 0.001, so read it as a pass the
gate reproduces, not a margin). The fitter's own claim and the gate's reading agree to 0.012 on every painted key. Per-landmark errors sit at the fit's free zone of 0.045 on most keys (the limit is 0.06), and the marks are by eye (+-15 to 25 px of a painting about 1000 px
tall, about 0.02 of the height), so the real margin against someone else's marks is thin.

## What a rig built from the idle cannot do (why six are authored)

The paintings of the other poses are drawn in other costumes (a black vest, a blue top, an orange sash, a bigger mane). The idle's cut cannot grow or shrink those, so the overlap is capped by the costume, not by the pose; the fit hints (`fit.keys.<pose>.init`, `limits`, per-pose scales, layer order,
about twenty variants) did not move the six past 0.71. Their landmarks agree, which is the pose.

## Findings worth a decision

- **Two Kimahri paintings face the wrong way.** `characters/kimahri/ready.png` and `jump.png` face LEFT (every other pose, and the rig, faces right); ready's sidecar says `"facing": "right"` and jump's says nothing, so the painting set draws them as they are, turned away from the enemy. The rig
  is unaffected (it always faces right; the gate reads those two paintings turned). Fixing the sidecars is a change to `public/art` and the pose model, so it was not touched.
- **Marks make the fitter harder, and the gate is right to ask for them.** On the pipeline's test rig a silhouette-only fit reached 0.87 to 0.94 on four poses with an arm or a leg swapped (a fist 0.54 of the height from the painting's, a near toe 0.09); with the marks in the fit it reached 0.68 to 0.87 and the poses
  it could not put right were left out. The 0.75 bar without the landmark rule would have passed those swapped limbs.
- **The continuity probe (CHK-026/027) reads painted-plane pixels; a rig draws no plane.** With the rig on it judges nothing (stature null, 0 swaps of Kimahri), so its PASS is vacuous for the rig. the scratch tracker `D:/Tools/pyrefly-scratch/2026-10-18/rig-kimahri/play/trk.mjs` tracks the skeleton's head, feet, pelvis, fist and spear tip through the live camera instead.
  A harness that reads a rig's own landmarks would be the lasting answer (not built).
- **The pose-gate census counts an authored key as rigged** (13 painting rows of Kimahri report `rigged` with the rig). That is the rule as the driver wrote it; say if authored keys should not relabel a painting row.
- **The fixture lost two poses.** `tests/fixtures/rig/kimahri-mini` keeps hurt and victory (the fit with marks reaches 0.82 and 0.87 on those and not on attack or defend); full coverage means a painted pose with no key refuses the rig, so the two were not kept as paintings.

## Making it again

`D:/pyrefly-art-rigs-work/kimahri/` holds the cut and build (parts, skin) and `fit/keys.json` (the merged final keys; a copy is in the scratch folder `D:/Tools/pyrefly-scratch/2026-10-18/rig-kimahri/fit/`). Then:
`PY=D:/Tools/ComfyUI/python_embeded/python.exe; $PY -I tools/rig/rig.py export --subject kimahri --no-gate` and `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/kimahri --art D:/pyrefly-art-r50` (stamps it), `node tools/rig-gate.mjs --rig ... --verify --art D:/pyrefly-art-r50` (what the deploy runs).
The per-pose fits came from `tools/rig/rig.py fit-keys --poses <pose>` runs (about 6 minutes a pose on this machine's CPU) and the 2026-10-17 scratch variants; the final choice per pose is in that folder's `work/final-selection.txt`.

## Still open

- Install and ship: `art-install --rig kimahri` (or `art-mirror-add-rigs.mjs` onto a new mirror), then the focused review (rig-ship.md). The six authored keys want the driver's eye on `D:/Tools/pyrefly-scratch/2026-10-18/rig-kimahri/clips/authored/*.mp4` first.
- The other chapters' figures are cut the same way, one subject config each; Kimahri's config is the worked example for marks, `authored` and `fit.mirror`.
