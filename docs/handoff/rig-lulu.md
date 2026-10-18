# The Lulu rig (branch `rig`, 2026-10-18)

Bailey, 2026-10-17: "yes start rigging, you pick kimahri's costume. start rigging for all chapters please. i want a permanent fix now." The driver's costume pick for Lulu (decision queue item 104e): **Lulu's IDLE painting**, exactly as for Kimahri.
Game case: **FFX only** (Lulu is an FFX figure, `characters/lulu/*`; nothing here is shared plumbing: no pipeline, gate or engine file changed, only a subject config, a hook module and a test). Pipeline and gate: [rig-pipeline.md](rig-pipeline.md),
[rig-kimahri.md](rig-kimahri.md) (the worked example and the pose-intent rule); engine: [rig-engine.md](rig-engine.md); release: [rig-ship.md](rig-ship.md).

**State: the rig is on disk and gated `ok` with full coverage, `--verify` passes, nothing is installed into any art mirror, nothing is merged to main or deployed, no review was run.** `D:/pyrefly-art-rigs/lulu`: 8 parts, 18 bones, 13 keys, 1,731 vertices, 2.81 Mpx, 3.86 MB, the `1x/` tier
proved (16 files, 1.41 Mpx, 1.12 MB), 7.2 MB of texture on the GPU in a battle. Work files: `D:/pyrefly-art-rigs-work/lulu` (cut, build, `fit/keys.json`, targets). Nothing was written into `public/art`, `D:/pyrefly-art-r50` or the release tree.

## Where Lulu fights (the chapters this rig changes)

On the field from the first turn: **Sinspawn Gui** (hidden, door word `mushroom`: Tidus, Auron, Lulu), the **Yojimbo cavern** chapter (`yojimbo-cavern`: Lulu, Kimahri, Yuna; her focal chapter) and **Mirror Aeons** (hidden, door word `yojimbo`: Tidus, Yuna, Lulu).
On the bench (she can be switched in, `reserve`): Seymour Flux (`seymour-flux`, chapter 1), Yunalesca (`yunalesca`, 2), Braska's Final Aeon (`braskas-final-aeon`, 3), Evrae (`evrae-airship`), Seymour Natus (`seymour-natus`, Highbridge), Seymour and Anima (`seymour-anima-macalania`) and
Seymour Omnis (`seymour-omnis`, Garden of Pain). Sources: `src/data/ffx/builds/*.ts` (`activeSlots`, `reserve`, the `lulu()` member builds). The clips and the harness below are the Sinspawn Gui chapter.

## The costume, the parts, the bones

One painting, `characters/lulu/idle@2x.png` (970 x 2330, sha in `rig.json`), cut into **8 parts** back to front: `braid`, `skirt`, `doll`, `torso`, `armA`, `armB`, `shoulders`, `head`.
**No SAM and no generative model**: the cut is polygons and bone capsules over the painting's own alpha (`tools/rig/subjects/lulu.json` `cut`), which is enough because every seam but one is black on black and the rest composite is exact
(rest overlap 0.994; the gate asks 0.95). Classical fills only: `skirt` underlaps (a part gains its front neighbour's own pixels so a bend opens no wedge) and `extend` (the arm tops under the fur, the torso under the hand, the skirt where the doll sat).

- `armA` is the arm with the hand on her hip (the back arm in the idle; the forearm lies in front of the torso), `armB` the arm that hangs at her front. In the marks and the fitter `fist` / `upperarm` / `forearm` / `hand` are B and `fistF` / `upperarmF` ... are A.
  `shoulders` (the fur collar, the bare shoulders, the neck, the necklace) is drawn over both arms so their tops hide under it; the head over everything but the braid.
- `doll` is the moogle doll: in her idle it sits at her hem (a prop, part of the approved costume). A key moves it to her hand wherever the painting shows it in her hand (`doll.dx` / `doll.dy`, up to 0.7 and 0.9 of the image), and holds it at the hem where the painting has no doll (critical, item, victory).
- **Skeleton:** `root` and two hem bones `skirtL`, `skirtR` (held, only SCALED by a key: each side of the skirt flares or narrows about the hem's centre, her idle's train trails to the left, the flared paintings flare to the right too, and each may sway
  up to 20 degrees), `pelvis`, `spine`, `chest`, `head`, `upperarm` / `forearm` / `hand`, `upperarmF` / `forearmF` / `handF`, `doll`, and a 4-bone lag chain `braid0..3` on the long braid (`motion.chains`; the idle sways the torso, head and arms).
- **The skirt hook** (`tools/rig/subjects/lulu_hooks.py`): a vertex blends `pelvis` (above row 600 it is the pelvis's alone) and the two hem bones (below row 1120 it is theirs alone, a smoothstep between; left and right split by x across 90 px).
  The row 600 is a gate lesson, not a taste: the pelvis joint sits in the middle of her hips, the gate tests a disc of 0.75 of the depth around the POSED joint, and a hips zone that deforms (an earlier row 470 or 500) dented the outline inside that disc ("a hole at pelvis", up to 685 px) in a bent pose.
- Landmarks: `head` and `headCenter` (the face's centre), `fist`, `fistF`, `doll`, `feet` (the root, at the hem: her feet are always under the skirt, so no foot is marked; the planted-feet check reads `feet`), plus the shoulder, elbow, wrist, chest and pelvis points the engine and tracker use.

## The marks (tools/rig/subjects/lulu.json `landmarks`, in the paintings' own 1x pixels, by eye, +-15 px = 0.013 of the idle's height)

`headCenter` = the centre of the face (eyes to chin), `fist` / `fistF` = the front / back arm's hand, `doll` = the moogle's centre; a mark is left out where the painting does not show the part (defend and victory hide a hand; critical, item and victory have no doll). Proof images:
`D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu/proof/marks-1.png` to `marks-3.png`. **The registered head box of the pose model is not the face** in hurt, critical, ko and sleep (it is the hair or an earring), so the face is marked; **sleep is the exception**: the gate holds a `low` key to a stature of 0.75
read from the head box's top, and her painting is registered at 0.696, so a face mark (0.60 of the figure) and the band cannot both hold; the sleep head is marked on the registered head box's centre (522, 86), which is what the gate's own band reads. Three paintings face LEFT (attack, ready, victory: bust and arm to the left, braids to the right) and
say `turn: true` (`fit.mirror`); defend and od-fury face the viewer.

## The per-key table (the gate's own reading: `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/lulu --art D:/pyrefly-art-r50`)

| pose | source | overlap | worst landmark | stature (head to soles) | feet dx / dy | holes |
|---|---|---|---|---|---|---|
| idle | the costume at rest | 0.994 | - | 1.000 | 0.001 / -0.001 | 0 |
| attack | **AUTHORED**, painting turned | 0.729 | 0.030 | 0.965 | -0.013 / 0.008 | 0 |
| cast | painting | **0.755** | 0.039 | 1.023 | -0.009 / -0.003 | 0 |
| critical | **AUTHORED** | 0.731 | 0.049 | 0.799 | -0.001 / 0.004 | 0 |
| hurt | **AUTHORED** | 0.542 | 0.040 | 0.940 | -0.009 / 0.003 | 0 |
| item | painting | **0.826** | 0.038 | 1.026 | 0.007 / 0.006 | 0 |
| victory | painting, turned | **0.754** | 0.040 | 0.965 | -0.012 / 0.006 | 0 |
| defend | **AUTHORED** (faces the viewer) | 0.524 | 0.056 | 1.039 | -0.002 / 0.010 | 0 |
| follow | **AUTHORED** | 0.661 | 0.042 | 0.910 | 0.004 / 0.006 | 0 |
| od-fury | **AUTHORED** (faces the viewer) | 0.532 | 0.040 | 0.957 | -0.013 / 0.010 | 0 |
| ready | **AUTHORED**, painting turned | 0.738 | 0.055 | 0.951 | 0.001 / 0.006 | 0 |
| sleep | **AUTHORED** | 0.515 | 0.049 | 0.782 | 0.002 / 0.006 | 0 |
| ko | **AUTHORED** (lies down, `planted: false`, feet not marked) | 0.220 | 0.030 | 0.364 | -0.020 / 0.012 | 0 |

Gate: OK, 13 of 13 keys, full coverage (every painted pose has a key, `exempt` empty), **247 poses scanned for holes at 8 joints (every key and 25/50/75 percent between every two): none**. Three painted keys (cast, item, victory), nine authored. Cast and victory pass by 0.005 and 0.004, not by a margin; the full table with
every landmark is `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu/key-table.txt`, the verbatim gate runs `gate-stamp-run.txt` and `gate-verify.txt`, the machine-readable report `gate-report.json` (same folder).

## Why nine are authored (the rule as built: the overlap is waived, the landmarks are not, a clip of each beside its painting)

Her silhouette is a skirt: about two thirds of it, a wide pleated column in the idle, and **every other painting redraws it** (blue tiered underskirts, flares that open to both sides, a long left train, a hem of lace points), so the overlap is capped by the costume, not by the pose, exactly as for Kimahri's six.
The hem bones, the sway and the longest searches moved the borderline poses from 0.55 to 0.73 and then stopped (0.73 to 0.755 for attack, cast, critical, ready, victory; the structural fix would be a skirt cut into panels). What each authored key is:
- **attack, ready, critical, follow, hurt, sleep**: the nearest natural side pose with the head, the hands and the doll where the painting has them; 0.52 to 0.74. The fit keeps the body natural by limits per pose (head 25, spine and chest 20, pelvis 15 degrees; the two bends, critical and sleep, 45 to 70).
- **defend and od-fury**: the paintings face the viewer (crossed arms with the doll at her chest; both arms raised, a doll in each hand). A one-sided rig cannot draw a front view; the key puts the head, the hands and the (one) doll where the painting has them.
- **ko**: she lies down about the root (`root_rot` 70 to 95 degrees, `planted: false`); see the findings.
The clips: `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu/clips/authored/<pose>.mp4` (1524 x 924 at 60 Hz, the rig left, the painting the game draws right, the same real-game frame, the gate's numbers in the caption) and the sheet `authored-sheet.jpg`.

## Clips (real game, headless Chromium on the real GPU, 1600 x 900, an exact 60 Hz on a virtual clock; `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu/clips/`)

- `lulu-cast-rig-1600x900-60fps.mp4` and `lulu-cast-painted-1600x900-60fps.mp4` (the painting set, same seed and keys): Tidus defends, then Lulu's own menu, BLACK MAGIC, Fire, the first target, played by the presenter (her `ready` key, then `cast`, the doll in her hand, the flash, back to idle); 477 frames.
- `lulu-hurt-then-ko-real-flow-rig-1600x900-60fps.mp4` and `...-painted-...`: the presenter plays an auto battle, an enemy action hurts her (the `hurt` key), her HP is set to 1 (the only debug write), she slouches into the `critical` rest key and the next enemy action downs her (`ko`); 1,647 frames.
- `clips/authored/*.mp4`: the nine authored poses beside their paintings. `critical` and `sleep` are driven the way the game drives them (HP under half, the sleep status: `restPoses.ts`; a plain `setPose('critical')` is mapped to the rest the figure is in).
Scripts: `play/lulu-moment.mjs` (cast, hurtko, poses), `play/fight-virtual-lulu.mjs`, `play/trk-lulu.mjs`, `play/authored_clips.py`, `encode.py` (same folder tree), adapted from the Kimahri lane's.

## The continuity harness, rig on and off (`harness-summary.txt`; the whole Sinspawn Gui fight, 362 s, 22,639 frames, seed 1, `autoBattle('intended')`)

| | rig on | rig off (painting set) |
|---|---|---|
| pose swaps recorded (all figures) | 705 | 791 (86 of them Lulu's) |
| CHK-026 / CHK-027 | PASS / FAIL (26 jerks at a swap, worst 207 px) | PASS / FAIL (the same 26: Tidus, Auron and Gui are painted either way) |
| Lulu's head: largest step in one frame | 67 px | 192 px (a painted plane changing size and place) |
| Lulu's head, feet, pelvis jerks (the tracker) | 8 | 25 |

The probe reads painted-plane pixels, so with the rig on it judges nothing of her (the same vacuous PASS as for Kimahri); the tracker (`trk-lulu.mjs`) follows the skeleton's own points through the camera instead. A caveat is written into the summary: the rig run's 6 feet jerks against 1 are a different definition of "feet" (the skeleton follows a lunge, a painted actor's anchor does not), not a sliding sole.

## Tests run

`npx tsc --noEmit` clean. vitest: the 18 rig files (`tests/unit/tools/rig-*.test.ts` and `tests/unit/rig/*`): **199 passed, 0 failed**, including the new `tests/unit/tools/rig-subject-lulu.test.ts` (7: the config's parts, skin, bones, landmarks and marks cannot drift). Python `tools/rig/test_rig_pipeline.py`: 12 passed.
`node tools/pose-gate.mjs --check --rigs D:/pyrefly-art-rigs`: 26 rigged (13 of Kimahri's and 13 of Lulu's: the census counts an authored key as rigged, as for Kimahri), 0 fail.

## Findings worth a decision

- **Three Lulu paintings face the wrong way**: `attack`, `ready` and `victory` face LEFT (the bust and the arm to the left, the braids to the right) and every sidecar says `"facing": "right"` (the same fault as Kimahri's ready and jump). The rig always faces right and the gate reads those three turned. Fixing the sidecars is a `public/art` change; not touched.
- **Two paintings are front views** (`defend`, `od-fury`); the rig's keys for them are the nearest side pose (above). In the game the rig's defend looks nothing like the painted crossed arms.
- **The KO is life-size**: the painted ko is a cropped figure at 0.40 scale (0.42 of the idle's height long, the skirt running off the frame); the rig lies down at her real length (head to hem), about 2.4 times longer, with the skirt trailing out to the left. Its landmarks agree, its overlap with the painting is 0.22.
- **Costume conflicts**: the other twelve paintings draw other costumes (a blue scaled underskirt, brown or red belts, a lace collar, other necklaces and sticks). The rig wears the idle's everywhere, which is the point of the program, and it is what the driver will see differ in the clips. The idle's doll sits at her hem; where a key sends it to her hand the skirt shows a **dark classical fill** where it sat (a smudge about 80 x 130 px at the hem).
- **Thin margins**: cast 0.755 and victory 0.754 pass the 0.75 bar by 0.005 and 0.004; defend's head (0.056) and ready's doll (0.055) sit at 0.06's edge against marks that are +-0.013 by eye.
- **Arms**: the sleeves are narrow side views (and a thin sleeve is what a raised arm shows: item's raised arm reads as a ribbon). Extremes show the skinning (a grey sliver, a dark smear where the hand left the waist); the keys are natural poses, not extremes.
- `?rig=on` asks for `rig.json` of every subject and logs a 404 for the ones with none (6 in the Sinspawn Gui chapter): expected, not a fault.
- The fit's stance term saturates (`min(3, ...)`): a start far from the idle's stance is a flat region the search never leaves (follow settled 0.109 off the stance). The fix that worked is a per-pose `root_dx: [-45, 45]` for a planted pose; a pipeline change to the term was not made.

## Making it again

`PY=D:/Tools/ComfyUI/python_embeded/python.exe` then `$PY -I tools/rig/rig.py cut --subject lulu` and `build --subject lulu` (seconds; no SAM), `fit-keys --subject lulu --poses a,b --seed n` (1 to 13 minutes a pose, one thread; the `fit` section of `tools/rig/subjects/lulu.json` carries the limits that make a body natural, the per-pose limits,
`root_dx`, the doll and the skirt scales), `export --subject lulu --no-gate`, `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/lulu --art D:/pyrefly-art-r50` (stamps it), `node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/lulu` (the 1x twins), then `node tools/rig-gate.mjs --rig ... --verify --art ...` (what the deploy runs).
`fit-keys` writes one `fit/keys.json` per work folder, so side-by-side runs each get their own: `RIG_WORK=<dir>` per batch (copy `build/` and `targets/` in first) and merge the winners; the sweep helpers are `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu/fitbatch.sh`, `select_best.py` (a rig per candidate, gated, the highest gate overlap with no other flag wins) and `claims.py`.
The merged final keys are in `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu/fit/keys.json` (and in the work folder). 174 pose fits ran in 14 rounds (103 batches); the lessons are in the commit subjects and above.

## Still open

- Install and ship: `art-install --rig lulu` (or `art-mirror-add-rigs.mjs` onto a new mirror), then the focused review ([rig-ship.md](rig-ship.md)); the nine authored keys want the driver's eye on `clips/authored/*.mp4` first, the KO and the two front views above all.
- A skirt cut into panels (a back panel, a front panel, the train) would lift attack, critical, ready and follow over the bar and make the front views less wrong; it is a cut and a skin hook, not a pipeline change.
- The doll's hem fill (a better classical fill than the smooth one), and a doll-in-hand key for the two-doll od-fury painting (the rig has one doll).
- The other chapters' figures are cut the same way, one subject config each; Lulu's config is the example for a figure with no hand-cut prototype (parts by polygons and capsules, a hook for a skirt, marks, `authored`, `fit.mirror`, per-pose limits).
