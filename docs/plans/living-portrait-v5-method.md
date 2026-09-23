# Living portrait v5: method check (paper preflight, 2026-09-23)

Game case: **both**. The pause screen and `PortraitStage` are shared plumbing (CHK-020); the method is
game-neutral. The pilot uses the Yuna X-2 plate (an FFX-2 asset) because it is the only rigged plate. FFX
members get the same method per plate later. AGENTS.md rule 15: v4 and v4.1 are two attempts on the same failure
(Bailey: "there is absolutely no continuity whatsoever"), so this is the written method check before a third
try.

## Recommendation: (d) propagated keys every 10 degrees, hard cut, clean range first

1. **Grow the keys out of the plate instead of sampling each one fresh.** Make each new key every 10 degrees by
   pushing the key before it through the existing dense flow (`rig-flow.py`). Repaint only the pixels the push
   cannot carry: disoccluded, stretched, or failing the forward-backward flow check. The LoRA paints those holes
   and nothing else. Two neighbouring keys then share their strands, lashes and shading. They are one painting
   moved 10 degrees, not two paintings of the same girl.
2. **Never blend two paintings.** Each painting is warped at most 5 degrees either side of its key, and the swap
   is a hard cut at the bracket midpoint on the spring's base yaw (`PaintSelector` with `dissolveS = 0`). The
   cut is invisible only because the neighbours are near-identical after registration. The pilot measures this.
3. **Ship the clean range first: -40..+40 (nine keys, the plate plus 8).** The eyes and the idle sway carry the
   rest of the gaze. -50..-80 / +50..+80 come in a second phase and are only switched on when they pass the same
   swap metric. This keeps the invented clip disc (seen at -60 / -85) and the mirrored +60 fringe off screen
   until Bailey rules on them.
4. **Paint expressions once, on the plate, and push them to every key.** The same flow chain carries the plate's
   mouth, brow and lid patches to every key. A masked cleanup runs only where the flow check fails.
5. **Port it through the existing seam.** The prototype's `LivingPortraitDriver` already implements `mount /
   setGaze / blink / setExpression / dispose`. It moves into `src/` and `PauseView` attaches it.

GPU: pilot about 3 min. Phase 1 (+-40 with expressions) about 25-30 min. Phase 2 (+-50..+-80) about 35 min.
Total at most 65 min, 90 budgeted with retries, all on the shared ComfyUI queue (art generation is ON in
NOW.md). The pilot below settles it in under an hour.

## What v4.1 actually does wrong (seen, not grepped)

- Frames at 9.9-10.9 s of `shots/v4/living-portrait-v4.mp4`, every frame at 25 fps (scratch
  `paper-lp5/t99-109.jpg`): for about **9-10 consecutive frames (~0.4 s)** of the +40 -> +60 bracket, two face
  contours and two noses show. That is twice the 0.2 s dissolve, so part of it is the dense warp stretching the
  +40 painting toward a +60 that is a *different* painting (the mirrored -60, with its fringe falling the other
  way: v4.1 "remains" item 2). Cause not isolated further on paper.
- **The v4.1 metric cannot see the defect.** The 5-degree whole-frame sweep (`check/turn-sweep.txt`) flags
  nothing: every swap step is 0.6x to 1.6x the median. `measured.json` still records 38 of 169 degrees with two
  paintings on screen. A step in whole-frame MAD dilutes a ghost across the body and the background. v5 needs a
  head-box metric and a zero-mix rule (acceptance below).
- **Neighbouring keys differ by the sampler, not by the angle.** Registered face mismatch at the pair midpoint
  (v4.1 handoff) is 28-35 levels for every pair: 28 at 0/+20, 32 at -40/-20 and -85/-60 (25 degrees), 35 at
  -60/-40. It does not shrink with a smaller gap, because each key is an independent sample with its own
  strands. For comparison, the whole-frame 1-degree motion step has a median of 9.8 (`mad1deg`).

## The four options

| | What | Removes the swap? | GPU | Verdict |
|---|---|---|---|---|
| (a) | Keys every 10 degrees, each sampled like v4 round 2 (LoRA + OpenPose + IP-Adapter) | **No.** Twice as many swaps, each still about 30 levels, because the mismatch is sampling noise and not angle (above) | about 300 more candidates (v4 round 2: 159 for 8 keys); 1.5-2.5 h at an assumed 20-30 s each (per-candidate time not measured) | Rejected: pays the most and keeps the fault |
| (b) | Morph between the existing keys (DIS flow or the rig's per-triangle warp), no new paint | Morphing is a warp **plus** a cross-dissolve, which is exactly v4.1. "Never blend" leaves two choices: a hard cut at g = 0.5, which pops by the pair MAD (28-35, about 3x a degree of motion), or one painting warped across a whole bracket, which is the v1 stretch ("no 2D warp reaches profile", motion spec section 13.1) | 0 | Keep as the **runtime** (`warp/dense.ts` is already built), but it cannot fix the keys' texture |
| (c) | Limit the turn to where keys are clean; eyes and a smaller head carry the life | Fewer swaps (+-40: four instead of eight), but each is still 28-32. Only the extreme form (c0), the plate alone warped +-12 degrees, has zero swaps | 0 | **(c0) is the fallback** if the pilot fails |
| (d) | (b)'s runtime + keys propagated from the plate every 10 degrees + (c)'s range staging + a hard cut | Yes, if the propagated neighbours match. The pilot tests exactly that | about 65 min | **Recommended** |

**What Until Dawn does** (`docs/plans/pause-living-portraits-motion-spec.md` sections 1, 8 and 11;
`D:/Tools/pyrefly-ref/until-dawn-character-screen/sheets/06-sam-orbit-wide-11.4-14.0.png`): the head alone turns
against a pinned body and camera, three-quarter to near profile and back, on one side in the measured take. A
critically damped spring (tau 0.14 s) drives it, with no overshoot. The eyes do not dart and gaze changes ride
the head turn. It is real 3D, so it has no keys and no swap at all. The measured range is **at least 45 degrees
each side**. That makes (c) a disclosed departure, not the reference, and phase 2 is the way back to it. **Both
sides** of the turn are not established by the footage (section 12).

## How the propagated keys are made (d, per step K -> K+10)

1. Take the dense pair flow the next existing v4 key already gives (`frontal|v4-r20`, and so on) and evaluate it
   at the half step. For +10 that is g = 0.5 of `frontal -> v4-r20`. The v4 keys act as *pose guides only*;
   their texture is not used.
2. Forward-warp key K through it (CPU, OpenCV `remap` in the sd-scripts venv). The hole mask is the union of: no
   source pixel (disocclusion), local stretch det(J) > 1.3 or < 0.7, and forward-backward disagreement > 2.5 px
   (rig-flow's `FB_TOL`).
3. LoRA masked repaint of the hole mask only (`tools/gen/lora-repaint.mjs`, yuna-x2 LoRA, about 9 s a prompt per
   the v4.1 handoff). Mask grown by 8 px and feathered; denoise 0.45 / 0.55 / 0.65; two seeds each. Pick by the
   swap metric and a 1:1 look.
4. Re-register K -> K+10 with `rig-flow.py` (new 10-degree pairs) so the runtime has its per-pair mesh.
5. Expressions: compose the plate -> K+10 map along the chain and warp each plate patch through it. The patches
   are mouth (parted, slight smile, smile, pressed), brow (raised, drawn) and the lid frames with painted closed
   eyes. Repaint only where the patch's own hole mask is non-empty.

Drift control: the chain restarts from the plate on each side, and the existing judged keys at +-20 / +-40 are
the identity check (below), not the source. Past +-50 the far side of the face leaves the frame and the ear and
back hair appear. The holes grow there, which is why that is phase 2.

## The pilot (kills or keeps (d) in under an hour; about 3 GPU min)

0. **CPU baseline, 10 min, 0 GPU.** Set the prototype's `WARP_PAINT.dissolveS` to 0 in a scratch copy (not the
   repo). Sweep 0 -> +40 at 1 degree with `rig-v4shots.mjs` and read the **head-box** step at the +10 and +30
   cuts against the median head-box 1-degree step. Expected well above 1.5 (pair MAD 28-35): this measures (b)-alone.
1. Propagate plate -> +10 -> +20' (steps 1-4 above): 6 + 6 candidates, about 2 GPU min.
2. Measure:
   - **S** = head-box 1-degree step at the +5 and +15 cuts divided by the median head-box 1-degree step over
     0..+20.
   - **Hole share** = the repaint mask as a fraction of the head mask, per step.
   - **Identity** = registered face MAD of +20' against the judged `v4-r20`, plus iris colour by side (green
     right, blue left), tassel and hair tips at 1:1.
3. **Keep (d)** if S <= 1.5 at both cuts, hole share <= 20 percent at +10 and +20', and identity <= 28 with a
   clean 1:1. **Kill (d)** if S > 2.0 at either cut, or hole share > 25 percent at +10 (the warp cannot carry 10
   degrees), or identity drifts (colour or tassel lost). Then build **(c0)**: the plate alone, head warp +-12
   degrees, eyes leading, zero swaps, zero GPU. It is disclosed as short of Until Dawn's range, and Bailey is
   asked. Between those numbers: one retry with a 5-degree step, then decide.
4. Show Bailey the pilot (end state first): the v4.1 clip at the +40 bracket next to a 0 -> +20 sweep of the
   pilot. The target is "one painting that turns". Record the reaction on the tile (liked / disliked / must
   remain / must change / undecided) before phase 1.

## Build steps (for the agent that builds it)

Phase 1 (only after the pilot keeps (d) and Bailey has seen it):

1. `tools/gen/rig-chain.py` (new, under 400 lines; runs in the sd-scripts venv for cv2): `propagate --from <key>
   --to-yaw <deg> --guide <pair>`, `holes`, `merge --pick`, `expressions --key <id>`. Writes into
   `docs/concepts/pause-until-dawn/prototype-v2/art/v5/`. Picks and candidates go to
   `D:/Tools/pyrefly-lora/yuna-x2/rig-v5/` (not committed).
2. `tools/gen/rig-flow.py`: accept the v5 10-degree pair list (additive flag `--set v5`); output to
   `art/v5/flow/`, `artMeta.v5.flow`.
3. Prototype `src/paint.ts`: add `CUT_PAINT = { hysteresisDeg: 3, dissolveS: 0, dissolveDeg: 0 }` behind
   `artMeta.v5.paint = "cut"`. `renderer.ts` picks the v5 key set and the +-40 limit (`rig.json` range). v4
   stays reachable by `?rig=v4` for side-by-side shots.
4. Keys -40..+40 every 10 degrees, with all expressions at every key. Rebuild the lids per key with
   `rig-lids2.py` from the propagated closed-eye patch.
5. Gaze split: head yaw = input x 40 degrees, clamped. The eyes take the remainder inside the fixed aperture
   (iris travel within the lid, the lid following the eye: motion spec section 11 "Gaze"). The spring constants
   are unchanged.

Phase 2 (+-50..+-80, then +-85) is the same chain continued, gated per key by the acceptance below. Past the
clean range the clip disc and the tassel come from propagation plus hole paint, not a fresh invention. The full
disc still needs Bailey's ruling (v4.1 remains item 5) before it shows.

Port (after Bailey approves the phase-1 look; the pause is shared, so both games):

1. Move `docs/concepts/pause-until-dawn/prototype-v2/src/**` to `src/app/screens/pause/living/**`. Keep the
   explicit `.ts` imports and every file under 400 lines (`renderer.ts` is 352). `driver.ts` stays the
   `PortraitDriver` implementation.
2. Rig art (keys, patches, flow `.bin`, `rig.json`) goes under `public/art/pause/living/yuna-x2/`. It is
   gitignored and never on `main` (hard rule 8), and gets backed up to `D:/Tools/pyrefly-art-backup`. The plate
   master is never edited (`docs/target/approved-hashes.json`).
3. `src/app/screens/pause/PauseView.ts`: when the member has a rig, WebGL2 is present and the rig loads, call
   `stage.attachDriver(new LivingPortraitDriver(...))`. Otherwise keep the static plate (today's path). Route
   pointer and right stick to `setGaze`. Map member state to `setExpression('normal' | 'determined' | 'hurt')`.
   Detach on close and on a member change before the cross-fade. `PortraitStage.ts` needs no change (its seam is
   final).
4. Reduced motion: keep the blinks, and head tau 0.25 s (motion spec section 11).
5. `node tools/orphans.mjs`. Then `npx tsc --noEmit`, and `node tools/critic-plan.mjs --paths
   src/app/screens/pause` to see which review it owes.

## Owning files

`tools/gen/rig-chain.py` (new), `tools/gen/rig-flow.py` (additive flag),
`docs/concepts/pause-until-dawn/prototype-v2/{src/paint.ts,src/renderer.ts,art/rig.json,art/v5/**}`, then for
the port `src/app/screens/pause/living/**` (new) and `src/app/screens/pause/PauseView.ts`. Not touched:
`PortraitStage.ts`, and the plate master.

## Tests

- `tests/unit/pause-living-portrait-*.test.ts`: repoint the imports on the port. Keep all 53 green.
- New `tests/unit/pause-living-portrait-cut.test.ts`: `PaintSelector` with `CUT_PAINT` never returns `from !=
  null` over a scripted sweep, including a reverse mid-turn, a held gaze with sway, and a fast turn.
- New `tests/unit/pause-living-portrait-v5-rig.test.ts`: every v5 key has every expression patch and lid frames.
  Keys are every 10 degrees over the enabled range. Every pair has a flow file and the mesh is fold-free at 21
  weights (as in v4.1's `check/dense.test.ts`).
- `tests/unit/pause-living-portrait-driver.test.ts` still passes against the moved driver (jsdom, no WebGL: it
  degrades to a no-op).

## Acceptance checks

1. **Zero mixed frames:** no frame at any held or moving yaw has two paintings (`paint.from === null` in every
   logged frame of the 15 s clip and of a 1-degree sweep). The v4.1 figure is 38 of 169 degrees.
2. **No pop:** head-box 1-degree step at every cut <= 1.5x the median head-box 1-degree step, sweeping both
   directions.
3. **No doubling:** 1:1 crops of the eyes, jaw and fringe at every cut +-1 degree show one iris, one lash line
   and one contour.
4. **Rest** with `?post=0` is still the plate to the pixel (MAD 0). The body band below y 1016 is unchanged.
5. **Expressions at every enabled key:** a contact sheet of keys x (4 mouths, 2 brows, blink mid and closed),
   with change outside each patch < 1 level.
6. **Identity:** +-20 and +-40 propagated keys register to the judged v4 keys within 28 face MAD. Irises are
   green right and blue left. The tassel and the orange and pink hair tips are present.
7. An independent judge at 1:1, then Bailey. Then the port: a real-input check in the pause screen (open the
   pause, move the gaze, change member, close), a screenshot in `docs/screenshots/`, `tsc` clean, and the pause
   test files green.

## Review (adversarial, 2026-09-23, paper only)

Verdict: **the pilot-first plan is sound. Correct the identity gate before the pilot runs.**
- CONFIRMED: `measured.json` gives 38 of 169 degrees mixed and a median `mad1deg` of 9.79. The v4.1 handoff gives pair MADs of 28/30/32/32/35/32. There are 53 portrait tests (5+10+10+6+10+12). `renderer.ts` has 352 lines. `FB_TOL = 2.5`. `PortraitStage.attachDriver` exists. The motion spec gives yaw ">= ±45°" and tau 0.14 s (0.25 s reduced).
- CONFIRMED by reading `PaintSelector.update`: `dissolveS = 0` alone gives a hard cut (progress jumps to 1), even with `dissolveDeg` 5.
- CORRECTED: in `turn-sweep.txt` the swap steps run 0.6x to **1.8x** (75 -> 80), not 1.6x. It is still unflagged, so the point stands.
- CORRECTED: in `t99-109.jpg` the second contour is visible in more than 9-10 frames (roughly 14-16 of 25, about 0.6 s, judged on the downscaled sheet). This strengthens the finding.
- CORRECTED: with 3 degrees of hysteresis, a painting can be warped up to about 8 degrees from its key on a reversal, not 5.
- PLAUSIBLE only: "the mismatch does not shrink with a smaller gap". Only 20- and 25-degree pairs exist, so the rejection of (a) is inferred. The pilot tests (d) directly, which is enough.
- CORRECTED (gate): "identity <= 28 against the judged v4 keys" measures against paintings that differ from their own neighbours by 28-35. A propagated key that stays faithful to the plate can fail it. Gate identity against the plate: iris sides, tassel and tip colours, and face MAD against the plate warped through the same flow. Use v4 keys for pose and silhouette only.
- Builder: `tools/gen/rig-flow.py` is already 418 lines. Put the v5 pair logic in `rig-chain.py`. The expression mapping (`normal/determined/hurt` by member state) is perceivable and INFERRED, so put it in the pilot ask. Rule 9 is otherwise respected: the pilot goes to Bailey before phase 1, and the ±40 departure and the (c0) fallback are disclosed.
