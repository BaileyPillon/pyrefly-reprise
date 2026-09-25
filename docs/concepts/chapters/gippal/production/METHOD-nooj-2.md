# Nooj shade: method check before attempt 5 (rule 15, four failures)

**Game case (rule 14): FFX-2 only** (the Den of Woe shades exist only in FFX-2). Written 2026-09-25, before any
render, after Bailey accepted "a fresh render with a new method, shown to you as options before any more attempts".
Identity anchors: bible §1.23.4 (FF Wiki *Nooj*, `[single source]`) and Bailey's picked portrait `portraits/nooj.png`.

## What failed, and why (judges' named faults: JUDGE.md, JUDGE-2.md, METHOD-nooj.md)

| # | What was done | Independent verdict | Named faults | Root cause |
|---|---|---|---|---|
| 1 | txt2img, `(from side:1.3)`, portrait ref skipped by the monochrome guard | 6.9 FAIL | no hair loops, knee-length ponytail, fur hidden, cane in the metal hand, one belt | pure profile hides the far loop and far shoulder; no identity went in |
| 2 | masked repaint of a loop on the same profile render | 6.6 FAIL | the loop reads as a small braid, no tie, one loop; the rest unchanged | patched pixels on a base whose camera could not show the design |
| 3 | 62 seeds over 9 text-only pilots, ref forced (0.45 to 0.55), one far-loop repaint | 6.8 FAIL | fur on the LEFT (metal) shoulder; claw-like cane glove; hoof foot; both shins armoured; bulky arm | sided words ("right shoulder only") do not bind on this checkpoint (C2); nothing held the pose |
| 4 | fur moved to the right shoulder by block-in and masked repaint | 6.9 FAIL | the fur is a 25x30 px tuft at 1600x900, pale on the B halo; claw glove; pointed ear; blocky cast elbow | a repaint can only fill the space the render left: a tuft behind the far shoulder |

Found now, not named before: every attempt passed the 832x1216 portrait through `comfy.mjs` `stageImage`, which does
not pad. CLIP-Vision centre-crops a square (y 192 to 1024); the portrait's purple fur sits at y 1056 to 1216 (measured
today), so **the reference never showed the adapter the fur**, and the loops' tops were clipped. The shade cast was a
rigid forearm rotation of the idle, which is where the blocky elbow comes from. And after the B treatment colour is
gone: at game size only the silhouette carries identity, so the fur has to be a shape, not a colour.

## What the new method changes

1. **The pose is drawn, not worded.** One OpenPose COCO-18 skeleton each for the idle and the cast (the Trema recipe,
   `docs/concepts/chapters/trema/poses/METHOD.md`, `skeletons.py`), xinsir OpenPose SDXL at 0.75 to 0.85. Three-quarter
   left, `facing: left`, shoulders narrowed (too wide turns him frontal). Idle: weight on the cane, the right (far,
   screen-left) wrist at hip height over the cane top, the machina left arm hanging slightly bent toward camera, feet
   apart, never square. Cast: the right arm extended toward the party at shoulder height levelling the cane, the
   machina arm back at the hip; this brings the fur shoulder forward onto the leading edge. **The cast is rendered
   from its own skeleton**, not rotated from the idle, so there is no elbow seam.
2. **Identity read off the portrait and the bible, not the stale `render1.sh` / `pilot*.sh` block.** Short, in tags
   the checkpoint knows, the portrait's own character tag: `nooj \(ff10-2\), brown hair, hair rings, red hair ties,
   sidelocks, medium ponytail, rimless blue-tinted glasses, blue eyes, red high collar, crimson bodysuit, red and
   black belts, purple fur mantle, grey fur, mechanical arm, black glove, silver cane, purple boots`. No sided words.
   No effect words (aura, glow, magic, spark, swirl, flames, motion) anywhere; they stay in the negative.
3. **IP-Adapter on the portrait, forced on, and seeing the whole picture:** two images batched and concat, the
   portrait **square-padded on white** (so the fur is inside the crop) plus a **square head crop** (loops, ties,
   glasses), ip-adapter-plus SDXL 0.5, ease in, 0.2 to 0.8 (Trema pilot 2 arm B; 0.65 linear burnt colour). Every
   sidecar records both refs and `forced: true`. The cast adds the chosen idle, square-padded, as its costume ref.
4. **Sidedness by region, not by word.** Core `ConditioningSetMask` (no new node, nothing downloaded): a mask over
   the far (right) shoulder carries `purple fur mantle, large grey fur collar`; a mask over the near arm carries
   `thin skeletal mechanical arm, exposed joints, gaps`; a mask over the near shin carries `metal leg, piston`.
5. **The fur mantle sized to read at game size.** Its region is drawn to rise above the shoulder line and break
   the outline outward on screen-left, at least as wide as the head (about 180x135 px on the canvas, 60x45 at
   1600x900, twice attempt 4's area), as the portrait's collar does.
6. **Hands, ears, feet.** Negative adds `pointy ears, elf ears, claws, talons, hooves, high heels, bulky mechanical
   arm, gauntlet, pauldron, armored legs on both sides, very long hair, knee-length ponytail`; positive `human ears,
   five fingers, black glove`. The cane stays in the gloved right hand, tip on the ground past the far foot.

## Arms, budget, stop rule

- **Pilot, same 4 seeds per arm:** A = points 1 to 3, 6; B = A plus the regional masks (4, 5); C = B as img2img
  (denoise 0.7) over a flat-colour block-in painted on the skeleton with the mantle, cane, piston leg and boot drawn
  at target size (`blockin.py` style). 12 idles. Casts only for the arm(s) that pass: at most 8. Touch-ups: at most
  one masked repaint of 64 px or less per candidate (ear or fingers only, disclosed); the fur and the silhouette
  must come from the render. Ceiling 26 GPU jobs.
- Shared ComfyUI: submit only with fewer than 3 pending, never restart; an all-black frame stops the run. Every
  cutout through `tools/gen/cutout-guard.mjs`. Candidates in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj5/`,
  look-only frames JPEG, scratch in `D:/Tools/pyrefly-scratch/nooj5/`. `verify-approved.mjs` before and after.
- **Stop rule:** if no arm meets the gates below at the pilot, stop and rewrite this file; no fifth patch on a
  base that failed.

## Pass bar (to reach Bailey as an option; Bailey picks)

- Rubric of JUDGE.md, bar 7 overall with no category below 6.5, scored by a judge that made none of the files.
- Gates, B-treated, in a real 1600x900 engine frame: the four squint reads (tall red column; **one furred shoulder
  as a shape**, at least 50 px wide and breaking the outline above the shoulder line; one thin skeletal arm; the cane
  as a third leg touching the ground), two loops with ties, blue glasses. At 1:1 and 2x: a human ear, a gloved hand
  with finger reads and no spur, one purple boot and one metal foot (no hoof), at least three belts (five is the
  source), the cast's elbow continuous, the cast the same man as the idle.
- **Shown as options, installed as nothing:** a sheet of 2 to 4 passing idle and cast pairs beside the portrait,
  the installed attempt-4 pair and their engine frames. Nothing goes into `public/art/` or
  `approved-hashes.json` until Bailey names one (rule 9).
