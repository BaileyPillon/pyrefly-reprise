# The Lulu rig (branch `rig`, 2026-10-18)

Bailey, 2026-10-17: "yes start rigging, you pick kimahri's costume. start rigging for all chapters please. i want a permanent fix now." The driver's costume pick for Lulu (decision queue item 104e): **Lulu's IDLE painting**, exactly as for Kimahri.
Game case: **FFX only** (Lulu is an FFX figure, `characters/lulu/*`; nothing here is shared plumbing: no pipeline, gate or engine file changed, only a subject config, a hook module and a test). Pipeline and gate: [rig-pipeline.md](rig-pipeline.md),
[rig-kimahri.md](rig-kimahri.md) (the worked example and the pose-intent rule); engine: [rig-engine.md](rig-engine.md); release: [rig-ship.md](rig-ship.md).

**State (pass 2, 2026-10-18): the rig is on disk and gated `ok` with full coverage, `--verify` passes, it stays OFF: nothing is installed into any art mirror, nothing is merged to main or deployed, no review was run.** `D:/pyrefly-art-rigs/lulu`: 11 parts, 25 bones, 13 keys, 2,868 vertices, 4.03 Mpx, 4.7 MB, the `1x/` tier
proved (22 files, 2.02 Mpx, 1.43 MB). (Pass 1 was 8 parts, 18 bones, 1,731 vertices, 2.81 Mpx; the three new parts are the train and the two front-view upper bodies.) The sections below that describe pass 1 say so; **read "Pass 2" first**. Work files: `D:/pyrefly-art-rigs-work/lulu` (cut, build, `fit/keys.json`, targets). Nothing was written into `public/art`, `D:/pyrefly-art-r50` or the release tree.

## Pass 2 (2026-10-18, Bailey: "One fix pass, then show me (Recommended)")

Game case: **FFX only** (Lulu is an FFX figure; no pipeline, gate or engine file changed: a subject config, its hook module and its test). The rig stays **OFF**: not installed, not merged, not deployed. The pass was bounded (about 3 hours, about 60 fit runs); it ended inside both.
Bailey's five faults from the three sheets of pass 1, and what happened to each:

| # | fault | pass 2 |
|---|---|---|
| 1 | the skirt trails behind her like a train (attack, hurt, follow, ready) | **fixed**: the skirt is a column and a train hung from the hips; no key reaches past 0.27 of the idle's height left of the hem's centre (pass 1: 0.29 to 0.52) |
| 2 | defend and Overdrive face the camera, the rig only turns sideways | **done with the paintings' own pixels**, see "Front parts" (a mixed costume: said plainly below) |
| 3 | the KO lies 2.4 times longer than the painted one | **halved, not matched**: 0.64 of the idle's height long against 1.03 before and 0.43 painted; the gate's own rules stop a smaller one, see "KO" |
| 4 | an 80 x 130 px dark fill where the doll left the hem | **improved, not solved**: the fill is now the painting's own black and the antenna wire leaves with the doll; the belt behind the doll is not carried across (listed) |
| 5 | raised arms read as ribbons (item) | **not fixed** (listed) |

### Skirt: a column and a train, hung from the hips

- **Cut.** `skirt` is now two parts: the column (`skirt`) and the left sweep (`train`: the pixels left of the column's cut line x = 232, from row 880 down, polygon `train_zone`). The train gains 70 px of the column's own pixels under the seam (config op `skirt`, back = train), is drawn behind the column, and so can swing or shrink and open no wedge.
- **Bones.** `skirtL` and `skirtR` keep their names but their joint moved from the hem's centre to the **hips** (245, 620): a key now SWINGS them (positive `rot` on `skirtL` flares the left hem out, on `skirtR` narrows the right) instead of scaling them about the hem, which is what made pass 1's 2.6-times train. `train` is a child of `skirtL` (joint at its floor end, 232, 1142) so it swings with the left of the skirt and may also shrink along the floor (`sx`, `sy`). The weights are pass 1's (pelvis above row 600, the flare bones below row 1120, a smoothstep between; `lulu_hooks.skin_skirt`); the train is blended exactly like the column's left side (`skin_train`), otherwise it swings farther than the column beside it and a wedge opens along the seam.
- **Fit.** The three skirt bones of every key were refit on their own, everything else in each key stayed pass 1's (a 7-number CMA-ES a key, seconds: both flare angles and widths, the train's swing and shrink) under the rule **the hem reaches no farther than 0.24 of the idle's height left of the posed root joint and 0.25 right** (the idle's own reach is 0.20 and 0.19) and the stance stays within 0.01. The result, reach left / right in idle heights, pass 1 against pass 2:
  attack 0.291 / 0.252 -> 0.240 / 0.219; cast 0.458 / 0.159 -> 0.266 / 0.188 (the only key past 0.24: its painting has a wide left flare, a 0.27 cap gave 0.756 against 0.751 and the bar; the real fitter refit its body first); hurt 0.520 / 0.134 -> 0.237 / 0.087; follow 0.514 / 0.241 -> 0.236 / 0.246; ready 0.524 / 0.315 -> 0.236 / 0.246; item 0.285 / 0.253 -> 0.238 / 0.248; critical 0.223 / 0.222 -> 0.195 / 0.240; victory 0.194 / 0.195 -> 0.203 / 0.163; sleep 0.195 / 0.226 -> 0.237 / 0.226; defend 0.293 / 0.347 -> 0.239 / 0.248; od-fury 0.381 / 0.295 -> 0.239 / 0.248.
- **What it cost.** The skirt can no longer widen to the painting's hem: overlaps with the paintings fell for the keys the skirt dominates (item 0.826 -> 0.783, cast 0.755 -> 0.756 only after its body was refit) and rose where the skirt was the fault (attack 0.729 -> 0.755: **attack is no longer authored, it passes the 0.75 bar as a painted turned key**, by 0.005; hurt 0.542 -> 0.519 and ready 0.738 -> 0.531 stay authored, ready fell because its pass-1 overlap was bought with the very train that was the fault).
- **What the format allowed.** A bone rotates, scales and offsets about its own joint and a vertex takes at most two bones: enough for a flare by rotation and for a train that shrinks (a scale is the one thing that must stay in (0, 4]). It has **no per-part visibility**: nothing can be hidden but by scaling it down, which is why the train shrinks rather than vanishes.

### Front parts for defend and od-fury (the painting's own pixels, no model, no repaint)

- **The format cannot swap a part's image per key** (a part's `png` is one file; a key can only move, scale and reorder what is there), **cannot hide a part** (a bone scale must be above 0 and at most 4), and refuses a part whose box leaves the master's image. So a front view is a part that is *always in the file* and that a key brings in.
- **How.** `tools/rig/subjects/lulu_hooks.py` (`FRONTS`) cuts the upper body of the DEFEND painting (head, hair and pins, necklaces, fur collar, crossed arms with the doll) and of the OD-FURY painting (head, both raised arms with a doll in each hand, the corset) from `defend@4x` and `od-fury@4x`: the painting's own pixels, its own alpha, a soft 14 px edge at the waist (row 490 of defend, row 388 of od-fury), **no fill and no repaint**. Each is one rigid part (`fdef`, `fod`) skinned to the last of a **chain of two bones at one joint under the root** (`fdef1/2`, `fod1/2`). The part is *stored as a speck*: its mesh is the real shape divided by 16 and drawn behind every other part at the hips (hidden), and the key that wants it scales each of the two bones 4 times (16 in all), moves the chain to the figure and puts the part in front (`layers`, 20 and 21). Every other key leaves the chain alone, so the speck stays hidden. The figure is drawn at the size the game draws the painting (defend 1.10 of the idle's scale, od-fury 1.18: the gate's landmark rule reads the painting where it is registered).
- **The rest of her stays the idle's.** In these two keys the hips shift under the front body (pelvis `dx`), the side-view head is steered onto the front head (its landmark error is 0.000), the back arm stays on her hip behind the front part, the hanging arm swings in and sits behind the skirt (`layers`, `armB`), the side braid swings down behind the chest, the side head and collar shrink to 0.8, and the doll goes behind the skirt (`layers`, `doll`). Scaling a side part to nothing was tried first and refused by the gate: the hole test watches the joint discs of the arm, the braid and the doll at 25, 50 and 75 percent between any two keys, and a part that shrinks leaves a ring uncovered. Hiding them behind the front part and the skirt passes it (247 poses, no hole).
- **A mixed costume, plainly.** Above the waist she wears the **defend or od-fury painting's** top (defend: black corset with a fur collar and crossed arms, close to the idle's; od-fury: a bare-shouldered corset with white lacing, no fur, long blue-lined sleeves); below it the **idle's** belted skirt with its own pleats (the paintings' skirts are a flared gown with crossed straps in defend, brown belts and a blue sash in od-fury). A soft waist edge joins them; a little of the idle's side-view hips and the lace of its sleeve cuff show under that edge (see the sheets). The paintings' hair ornaments differ from the idle's: a few of the idle's show above the front head. This is the cost of one costume; it is what Bailey's brief asked for ("cut from the DEFEND and OD-FURY paintings themselves").
- **The marks.** These two keys are held to the **head** only (landmark error 0.000, steered onto the painting's mark): the hands and the doll are the front painting's pixels, not bones, so their marks (`fist`, `fistF`, `doll`) were left out of defend and od-fury in the config, and the unit test lets a front pose mark the head alone. That is a weaker pose-intent check than the other keys have; the picture is the evidence.
- Costs and margins: defend reads stature 1.100 (the band's edge, 1.105 with the slack), its overlap with the painting is 0.615 (pass 1: 0.524), od-fury 0.695 (0.532).

### KO: smaller, not the painted size

- The painted KO is a close-up: the head life-size, the body cropped, the skirt running off the frame (0.43 x 0.26 of the idle's height). The gate refuses a KO whose head is under 0.85 of the idle's (`head-small`) and a pelvis joint whose rest disc is not covered, which is what a figure scaled under about 0.75 is (tried at 0.55: a hole at the pelvis of 1,123 px). So the KO key scales the whole figure (the `root` bone) to **0.8**, scales the head bone up 1.1 (head 0.88, inside the band), and pulls the pelvis 540 px (master) toward the hem so the skirt is shorter (a larger pull folds the skirt over itself and opens a hole): it is **0.64 of the idle's height long and 0.31 tall** (pass 1: 1.03 x 0.42; painted 0.43 x 0.26). The head, the hands and the doll are within 0.03 of their marks as before.
- To match the painted size the head would have to be small (refused) or the body cropped (the format cannot crop). Said plainly: the KO is now a small, full-length figure lying with its skirt gathered, not the painted close-up.

### Not fixed

- **The doll's hem fill (4): improved, not solved.** Where the doll leaves the hem the skirt used to show a lighter grey-blue blob with a halo, 80 x 130 px, and the doll's red antenna wire was left standing above it. Now (`lulu_hooks.cut_parts`) the fill is the BLACK of the painting's own ring round the doll (its darkest quarter, by band of rows; the painting there is belt black on belt black, 0 to 15 of 255) and the antenna wire belongs to the doll part, so it leaves with the doll (at rest the picture is unchanged: the rest composite differs from the painting in 6,137 pixels over 30 of 892,638, pass 1 in 5,627). What is still missing: the belt strap that passes behind the doll is not carried across the black patch, and the hem under the doll's feet is ragged. A pleat-matching fill with the belt bridged from its two visible ends was designed and not built.
- **Arms read as ribbons (5)** in raised poses (item, ready, follow): the side-view sleeves are narrow strips and a raised arm is mostly the sleeve. A fix is a wider sleeve cut, which means re-cutting both arm parts and refitting every key that raises an arm; not attempted.
- Thin margins: cast 0.756, attack 0.755, victory 0.769 against the 0.75 bar; defend's stature at the band's edge; sleep's feet 0.019 against 0.02.
- The side braid's lag chain (the game's dynamics) still runs in the two front keys while the braid hangs behind the chest: not seen in a clip.

### Commands and files

`tools/rig/subjects/lulu.json` (the `train` part and bones, the hip joints, `headS` / `chestS` shell bones, the front bone chains, the fit limits in degrees, the KO scales, `authored` without `attack`), `lulu_hooks.py` (`skin_train`, `FRONTS`, `build`, `cut_parts`), `tests/unit/tools/rig-subject-lulu.test.ts` (11 tests). The refit helpers (skirt-only fit, key assembly, sheets) are scratch in `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu-pass2/` (`skirtfit.py`, `p2keys.py`, `assemble.py`, `build_sheets.py`; the final keys are `fits/keys-C1.json`, also in `D:/pyrefly-art-rigs-work/lulu/fit/keys.json`). The real fitter ran for cast (2 runs), item, victory and the KO (6 runs); everything else was the skirt-only search.
Sheets for Bailey: `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu-pass2/for-bailey/` (`lulu-rig-1-defend-overdrive-ko.png`, `-2-attack-hurt-return.png`, `-3-ready-lowhp-asleep.png`, `lulu-rig-4-before-after.png`); the clips behind them in `clips/authored/`.

## Where Lulu fights (the chapters this rig changes)

On the field from the first turn: **Sinspawn Gui** (hidden, door word `mushroom`: Tidus, Auron, Lulu), the **Yojimbo cavern** chapter (`yojimbo-cavern`: Lulu, Kimahri, Yuna; her focal chapter) and **Mirror Aeons** (hidden, door word `yojimbo`: Tidus, Yuna, Lulu).
On the bench (she can be switched in, `reserve`): Seymour Flux (`seymour-flux`, chapter 1), Yunalesca (`yunalesca`, 2), Braska's Final Aeon (`braskas-final-aeon`, 3), Evrae (`evrae-airship`), Seymour Natus (`seymour-natus`, Highbridge), Seymour and Anima (`seymour-anima-macalania`) and
Seymour Omnis (`seymour-omnis`, Garden of Pain). Sources: `src/data/ffx/builds/*.ts` (`activeSlots`, `reserve`, the `lulu()` member builds). The clips and the harness below are the Sinspawn Gui chapter.

## The costume, the parts, the bones (pass 1 text: pass 2 added the `train`, `fdef` and `fod` parts, the `headS`, `chestS`, `fdef1/2`, `fod1/2` and `train` bones and moved `skirtL`/`skirtR` to the hips; see Pass 2)

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

## The per-key table, pass 2 (the gate's own reading: `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/lulu --art D:/pyrefly-art-r50`)

| pose | source | overlap | worst landmark | stature (head to soles) | feet dx / dy | holes |
|---|---|---|---|---|---|---|
| idle | the costume at rest | 0.994 | - | 1.000 | 0.001 / -0.001 | 0 |
| attack | painting, turned | **0.755** | 0.030 | 0.965 | 0.010 / 0.008 | 0 |
| cast | painting | **0.756** | 0.040 | 1.025 | 0.016 / 0.006 | 0 |
| critical | **AUTHORED** | 0.726 | 0.049 | 0.799 | -0.006 / 0.004 | 0 |
| hurt | **AUTHORED** | 0.519 | 0.040 | 0.940 | -0.010 / -0.007 | 0 |
| item | painting | **0.783** | 0.038 | 1.026 | 0.010 / 0.006 | 0 |
| victory | painting, turned | **0.769** | 0.040 | 0.965 | -0.009 / 0.001 | 0 |
| defend | **AUTHORED** (front view: the painting's own upper body cut in) | 0.615 | 0.000 | 1.100 | 0.013 / 0.006 | 0 |
| follow | **AUTHORED** | 0.574 | 0.042 | 0.910 | 0.009 / 0.010 | 0 |
| od-fury | **AUTHORED** (front view: the painting's own upper body cut in) | 0.695 | 0.000 | 0.919 | 0.003 / 0.006 | 0 |
| ready | **AUTHORED**, painting turned | 0.531 | 0.055 | 0.951 | 0.011 / 0.010 | 0 |
| sleep | **AUTHORED** | 0.601 | 0.049 | 0.782 | 0.019 / -0.003 | 0 |
| ko | **AUTHORED** (lies down, `planted: false`, feet not marked; root scale 0.8) | 0.256 | 0.030 | 0.326 | -0.077 / 0.025 | 0 |

Gate: OK, 13 of 13 keys, full coverage (every painted pose has a key, `exempt` empty), **247 poses scanned for holes at 9 joints (every key and 25/50/75 percent between every two): none**. Four painted keys (attack, cast, item, victory), eight authored. (Pass 1's table, before the skirt panels: attack 0.729 authored, cast 0.755, item 0.826, victory 0.754 painted; the rest authored at 0.22 to 0.74.) Cast, attack and victory pass by 0.006, 0.005 and 0.019, not by a margin; the verbatim gate runs are `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu-pass2/gate-stamp-run.txt` and `gate-verify.txt`, the machine-readable report `gate-report.json` (same folder; pass 1's are in `rig-lulu/`).

## Why eight are authored, pass 1 text for nine (the rule as built: the overlap is waived, the landmarks are not, a clip of each beside its painting)

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

Pass 2: see the end of the Pass 2 section for the final numbers. (Pass 1: `npx tsc --noEmit` clean. vitest: the 18 rig files (`tests/unit/tools/rig-*.test.ts` and `tests/unit/rig/*`): **199 passed, 0 failed**, including the new `tests/unit/tools/rig-subject-lulu.test.ts` (7: the config's parts, skin, bones, landmarks and marks cannot drift). Python `tools/rig/test_rig_pipeline.py`: 12 passed.
`node tools/pose-gate.mjs --check --rigs D:/pyrefly-art-rigs`: 26 rigged (13 of Kimahri's and 13 of Lulu's: the census counts an authored key as rigged, as for Kimahri), 0 fail.

## Findings worth a decision

- **Three Lulu paintings face the wrong way**: `attack`, `ready` and `victory` face LEFT (the bust and the arm to the left, the braids to the right) and every sidecar says `"facing": "right"` (the same fault as Kimahri's ready and jump). The rig always faces right and the gate reads those three turned. Fixing the sidecars is a `public/art` change; not touched.
- **Two paintings are front views** (`defend`, `od-fury`). Pass 1: the keys were the nearest side pose and looked nothing like the painted crossed arms. **Pass 2: each key brings in the painting's own upper body as a part** (see Pass 2; a mixed costume).
- **The KO is life-size** (pass 2: 0.64 of the idle's height long, see Pass 2; the pass-1 text follows): the painted ko is a cropped figure at 0.40 scale (0.42 of the idle's height long, the skirt running off the frame); the rig lies down at her real length (head to hem), about 2.4 times longer, with the skirt trailing out to the left. Its landmarks agree, its overlap with the painting is 0.22.
- **Costume conflicts**: the other twelve paintings draw other costumes (a blue scaled underskirt, brown or red belts, a lace collar, other necklaces and sticks). The rig wears the idle's everywhere, which is the point of the program, and it is what the driver will see differ in the clips. The idle's doll sits at her hem; where a key sends it to her hand the skirt shows a **dark classical fill** where it sat (a smudge about 80 x 130 px at the hem).
- **Thin margins**: cast 0.755 and victory 0.754 pass the 0.75 bar by 0.005 and 0.004; defend's head (0.056) and ready's doll (0.055) sit at 0.06's edge against marks that are +-0.013 by eye.
- **Arms** (still true in pass 2): the sleeves are narrow side views (and a thin sleeve is what a raised arm shows: item's raised arm reads as a ribbon). Extremes show the skinning (a grey sliver, a dark smear where the hand left the waist); the keys are natural poses, not extremes.
- `?rig=on` asks for `rig.json` of every subject and logs a 404 for the ones with none (6 in the Sinspawn Gui chapter): expected, not a fault.
- The fit's stance term saturates (`min(3, ...)`): a start far from the idle's stance is a flat region the search never leaves (follow settled 0.109 off the stance). The fix that worked is a per-pose `root_dx: [-45, 45]` for a planted pose; a pipeline change to the term was not made.

## Making it again

`PY=D:/Tools/ComfyUI/python_embeded/python.exe` then `$PY -I tools/rig/rig.py cut --subject lulu` and `build --subject lulu` (seconds; no SAM), `fit-keys --subject lulu --poses a,b --seed n` (1 to 13 minutes a pose, one thread; the `fit` section of `tools/rig/subjects/lulu.json` carries the limits that make a body natural, the per-pose limits,
`root_dx`, the doll and the skirt scales), `export --subject lulu --no-gate`, `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/lulu --art D:/pyrefly-art-r50` (stamps it), `node tools/rig-tiers.mjs write --rig D:/pyrefly-art-rigs/lulu` (the 1x twins), then `node tools/rig-gate.mjs --rig ... --verify --art ...` (what the deploy runs).
`fit-keys` writes one `fit/keys.json` per work folder, so side-by-side runs each get their own: `RIG_WORK=<dir>` per batch (copy `build/` and `targets/` in first) and merge the winners; the sweep helpers are `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu/fitbatch.sh`, `select_best.py` (a rig per candidate, gated, the highest gate overlap with no other flag wins) and `claims.py`.
The merged final keys are in `D:/Tools/pyrefly-scratch/2026-10-18/rig-lulu/fit/keys.json` (and in the work folder). 174 pose fits ran in 14 rounds (103 batches); the lessons are in the commit subjects and above.

## Still open

- Install and ship: `art-install --rig lulu` (or `art-mirror-add-rigs.mjs` onto a new mirror), then the focused review ([rig-ship.md](rig-ship.md)); the nine authored keys want the driver's eye on `clips/authored/*.mp4` first, the KO and the two front views above all.
- ~~A skirt cut into panels~~ (done in pass 2: it lifted attack over the bar, ready and follow did not follow; see Pass 2).
- The doll's hem fill (a pleat-matching fill with the belt carried across the hole; designed, not built), and the arm sleeves that read as ribbons when raised (a wider cut). The two-doll od-fury painting is now served by its own front part (both dolls are its pixels).
- The other chapters' figures are cut the same way, one subject config each; Lulu's config is the example for a figure with no hand-cut prototype (parts by polygons and capsules, a hook for a skirt, marks, `authored`, `fit.mirror`, per-pose limits).
