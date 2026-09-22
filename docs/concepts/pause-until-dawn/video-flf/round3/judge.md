# Living portrait FLF, round 3: judge

**Verdict: NO CLIP TO JUDGE, so FAIL (not shown to Bailey).** Judged 2026-09-22 14:51 EDT,
independent of the generator, without rendering.

## 1. What exists

| Checked | Result |
|---|---|
| `D:/Tools/ComfyUI/output/pyrefly-video-flf/` | only `idle-breathing/` (round 2) and `vae-floor_00001_.png` (13:59) |
| `D:/Tools/pyrefly-video/flf/` | only round 2 `idle-breathing/` + log, and `vae-floor/` |
| `status.json` `clips` | `{}`; `idle-blinks` is in `notRendered` |
| Any `.mp4` / `.webm` / `idle-blinks*` newer than 13:00 | none |
| ComfyUI `/queue` at 14:51 | busy: prompt 216, an Animagine XL image job (another track) |

The generator's report is accurate: the round-3 fix is in the code, the render was never
queued because the shared queue never stayed empty for 10 minutes. So there are no join
numbers, no 1:1 crops, no identity or motion score and no hard-cut strip. None are
invented here.

## 2. Paper check of the fix (the only thing that can be judged)

Read from `ComfyUI/comfy_extras/nodes_wan.py` (`WanFirstLastFrameToVideo.execute`) and
`tools/gen/video-flf.mjs` (commit e8abc6a):

- `length = 97` gives `latent T = (97-1)//4 + 1 = 25`, so the mask has `25*4 = 100` slots
  (0 to 99); real pixel frames are 0 to 96.
- Start: 1-frame `start_image` gives `mask[:4] = 0`: latent 0 fully anchored (pixel frame 0).
- End: `end_image` is now `RepeatImageBatch(amount=4)` of the plate (graph node
  `end_image_anchor`, wired into `start_image`/`end_image` of the FLF node; CLIP vision
  stays on the single frame). So `image[-4:]` = pixel frames 93 to 96 are the plate and
  `mask[-4:]` = slots 96 to 99 = **all four slots of latent 24** are zeroed. The last
  latent, which decodes to pixel frames 93 to 96, is fully anchored.
- Round 2 (length 81, 1-frame end) zeroed only slot 83 of latent 20's four slots, which
  is the asymmetry that left the real last frame loose. That asymmetry is gone.
- 24 fps and the "motion done in the first 60%, still final second" prompt are in place.

**On paper the fix is correct.** It is not evidence of a seamless join: round 2's
join-last failure was measured, and only a render can show whether the anchored last
latent decodes within about 1.5x the VAE floor (face MAD 3.85, eyes 4.70, mouth 1.92).

One small hazard: `WAN_FLF_LENGTH` can override the length. Any value where
`(L-1) % 4 != 0` breaks the alignment above (the last latent's slots no longer map onto
the plate frames). Keep the default 97, or another `4k+1`.

## 3. What round 3 still owes (unchanged from the brief)

1. Wait for `/queue` to be empty for 10 consecutive minutes, then queue exactly one job:
   `node tools/gen/video-flf.mjs render idle-blinks --seed 1`.
2. Judge it: `join_report.py` head boxes with MAD, max-abs and p99.9 against the floor;
   1:1 crops at frames 1, mid and N; identity (heterochromia green screen-left, blue
   screen-right, cyan braid, gold clasp, outfit) and motion scores; the hard-cut test
   (concat the clip onto itself with no fade, six frames around the cut at 1:1, look).
3. Pass = join-first and join-last at 8 or above and the cut invisible at 1:1. Nothing is
   shown to Bailey before that.

*No render was queued by this pass. No number above was produced by the generator.*
