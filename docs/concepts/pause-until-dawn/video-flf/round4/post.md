# Living portrait FLF, round 4: `tools/gen/video-post.mjs` (post-process, productionised)

**What this is.** `docs/concepts/pause-until-dawn/video-flf/round3/pingpong.md` (commit
`5ed1f92`) proved, by hand, with one-off scratch scripts
(`round3/pingpong-colour-match.py`, `round3/pingpong-join-tests.py`,
`round3/pingpong-turnaround-analysis.py`), that colour-matching a clip against the plate
on its pinned (no-motion) regions and then ping-ponging it at a still turnaround frame
turns a 6-20x-median hard-cut join into one within 1-1.5x the clip's own ordinary motion.
`round4/method-check.md` SS3(a) adopted this as the standing join method and named the
tool this file documents: **`tools/gen/video-post.mjs`** (+ its numpy helper
`tools/gen/video-post.py`), so the next clip that passes a *motion* judge does not need
a bespoke script the way round 3's pass did. This pass built that tool, ran it on both
clips that already exist on disk (`idle-breathing`, `idle-blinks`), and checked its
numbers against `pingpong.md`'s hand-computed ones. **No render was queued and no
ComfyUI workflow was touched.**

## What the tool does

```
node tools/gen/video-post.mjs <clipDir> --plate <plate.png> \
    [--turnaround N | --auto-turnaround] [--fps 24] [--out <dir>] \
    [--vae-floor <floor.png>] [--pinned-boxes body,bgLeft,bgRight] \
    [--motion-boxes face,eyes,mouth,braid,hairline] \
    [--still-window 4] [--calm-factor 3.0] [--search-start-frac 0.5] \
    [--lookahead-factor 1.1]
```

The numpy-heavy pixel work lives in `tools/gen/video-post.py` (same split as
`tools/gen/join_report.py`); `video-post.mjs` shells out to it, then does the ffmpeg
half. `--out` defaults to `<clipDir>/post/`.

1. **Colour match.** A per-frame, per-channel affine fit (`a*x+b`, least squares) against
   the plate, fit only on the configured **pinned** boxes (default `body`, `bgLeft`,
   `bgRight` -- the regions `judge-clip.md` proved carry zero motion), applied to the
   whole frame. Writes the corrected frames to `<out>/frames-cm/`.
2. **Turnaround (T).** Given explicitly (`--turnaround N`), or auto-detected: the end of
   the **latest** `--still-window`-frame (default 4) run that is both (a) calm -- every
   internal step, plus the one step leading *out* of the window, stays under
   `--calm-factor` (default 3.0) times the clip's own median frame-to-frame step -- and
   (b) not immediately followed by a rise back above `--lookahead-factor` (default 1.1)
   times its own mean MAD-vs-frame-1, searched only from `--search-start-frac` (default
   0.5) of the clip onward. See "Why two conditions, and why raw frames" below for what
   each one is for and why it is enough to reproduce `pingpong.md`'s hand-picked T on
   both clips it exists for.
3. **Videos.** Builds the forward-only sequence (colour-matched frames 1..N as they are)
   and the ping-pong sequence (1..T, then T-1..2 -- frame 1 is never re-shown, matching
   `pingpong.md`'s construction exactly), each encoded to WebM (VP9, `crf 30`) and MP4
   (H.264, `crf 20`) — fixed quality, not the round-1 tool's size-fitting ladder, per this
   round's brief.
4. **Contact sheet.** 1:1 crops (face / eyes / mouth boxes) of the plate, frame 1, frame
   T-1 and frame T -- "frames 1, T and the seam" (T-1 vs T is the seam).
5. **Report** (`<out>/report.json`): frame-1-vs-plate and frame-T-vs-plate per box (raw
   and colour-matched, plus the ratio to the VAE floor when `--vae-floor` is given), the
   reversal seam (T-1 -> T, raw and cm, every box), the whole-clip frame-to-frame step
   series median/max (raw vs cm, per the configured motion boxes and full-frame), and the
   saturation series (raw vs cm, f1/min/max), plus the two builds' file paths and sizes.

## Why two conditions for "calm", and why they run on the raw frames

Getting the auto-turnaround right needed both a look at the step *right after* the
window and a rejection of a window that is calm now but not still afterward -- and it
needed to look at the frames the model actually rendered, not the colour-matched ones:

- **Internal-only step checks miss a one-frame pop.** `judge-clip.md`'s tone blow-out at
  frame 93->94 (a 27.95 head-box step, 17x the clip's median) sits *one frame past* any
  4-frame window ending at 93 -- an internal-steps-only check does not see it, and an
  early version of this tool picked T=93, one frame before the pop. Checking the single
  step leading *out* of the candidate window (T -> T+1) catches this directly.
- **A lookahead-only check is not enough either**, because on `idle-blinks` the pop's
  MAD-vs-frame-1 sometimes *dips* right at the pop frame before climbing again (the tone
  flip briefly lands closer to the plate by pure coincidence) -- so a lookahead window
  immediately after the pop can read as calm. The leading-step check and the lookahead
  check fail in different places; together they close both gaps.
- **The lookahead check also does the opposite job on `idle-breathing`**: frames 41-62
  sit in a calm-*looking* plateau that is really "before the breathing/mouth event has
  started", not "after it finished" -- it scores lower on MAD-vs-frame-1 than the true
  post-motion tail (f78-81) simply because nothing has drifted yet. The lookahead check
  (a big rise follows immediately, in this case the real f63-77 event) rejects it, and
  preferring the **latest** surviving window then lands on the true tail.
- **Auto-detection reads the RAW frames, not the colour-matched ones.** The colour match
  is a per-frame tone fit against the plate; on a clip with real tonal drift, that fit
  itself trends across frames (each one chases a slightly different plate-relative
  grade), which smooths away the very valley-then-rise shape this function is looking
  for. `idle-blinks`' auto-pick landed on T=86 or T=93 (depending on the lookahead
  factor) when run against the colour-matched series, and exactly T=81 -- `pingpong.md`'s
  own hand-picked value -- once switched to the raw frames. `idle-breathing` gave T=81
  either way (it never had a tone problem to begin with, per `pingpong.md` SS2).

## Unit-check: both existing clips, numbers against `pingpong.md`

Run against `idle-blinks` (`D:/Tools/pyrefly-video/flf/idle-blinks/1`, 97 frames, 24 fps)
and `idle-breathing` (`D:/Tools/pyrefly-video/flf/idle-breathing/1`, 81 frames, 16 fps),
plate `pyrefly-video-plate-f1efe21f6c75-1280x704.png`, `--vae-floor` given. **Auto-detect
picked T=81 for both clips**, exactly `pingpong.md`'s hand-picked value for both (also
checked explicitly with `--turnaround 81` to isolate the colour-match/join numbers from
the turnaround pick -- identical results either way, since auto landed on 81 anyway).

| number | `pingpong.md` | this tool | within rounding? |
|---|---|---|---|
| idle-blinks frame1 vs plate, raw, face MAD | 6.75 | 6.7528 | yes |
| idle-blinks frame1 vs plate, raw, mouth MAD | 4.39 | 4.3889 | yes |
| idle-blinks frame1 vs plate, raw, full MAD | 4.68 | 4.6837 | yes |
| idle-blinks frame1 vs plate, cm, face MAD | 5.49 | 5.4857 | yes |
| idle-blinks reversal seam (T-1,T), raw, face/eyes/full | 2.14 / 2.40 / 1.37 | 2.1368 / 2.4043 / 1.3693 | yes |
| idle-blinks reversal seam, cm, face/full | 2.25 / 1.43 | 2.2508 / 1.4297 | yes |
| idle-blinks stepFull median/max, raw -> cm | 0.93 -> 1.03 / 19.41 -> 13.12 | 0.9318 -> 1.0286 / 19.4111 -> 13.1234 | yes |
| idle-blinks saturation, raw f1/min/max | 0.612 / 0.448 / 0.672 | 0.6123 / 0.4479 / 0.6721 | yes |
| idle-blinks saturation, cm f1/min/max | 0.622 / 0.587 / 0.629 | 0.6219 / 0.5865 / 0.6292 | yes |
| idle-breathing frame1/frameN vs plate, raw, face MAD | 5.23 / 5.75 | 5.2307 / 5.7484 | yes |
| idle-breathing frame1/frameN vs plate, cm, face MAD | 5.33 / 5.22 | 5.3337 / 5.2151 | yes |
| idle-breathing frame1/frameN vs plate, raw, mouth MAD | 3.03 / 4.24 | 3.0325 / 4.2428 | yes |
| idle-breathing reversal seam, raw, face/full | 1.21 / 0.65 | 1.2134 / 0.6540 | yes |
| idle-breathing reversal seam, cm, face/full | 1.21 / 0.65 | 1.2330 / 0.6720 | close (within ~0.02, same order) |
| idle-breathing stepFull median/max, raw -> cm | 0.70 -> 0.72 / 1.60 -> 1.51 | 0.6951 -> 0.7212 / 1.6001 -> 1.5051 | yes |
| idle-breathing saturation, raw f1/min/max | 0.633 / 0.633 / 0.640 | 0.6325 / 0.6325 / 0.6402 | yes |
| idle-breathing saturation, cm f1/min/max | 0.616 / 0.610 / 0.616 | 0.6163 / 0.6100 / 0.6163 | yes |

Every number matches `pingpong.md` to within its own reported precision (2 decimal
places), the one exception (idle-breathing's cm reversal seam, 0.65 vs 0.672) still
agreeing to within 0.02 and the same conclusion (well inside 1-1.5x the clip's own
motion). `pingpong.md`'s ping-pong builds (160 frames, 1-81/80-2, 24fps = 6.667s for
`idle-blinks`; 160 frames at 16fps = 10.0s for `idle-breathing`) also match this tool's
builds frame-for-frame and duration-for-duration (confirmed with `ffprobe`).

**Outputs committed with this doc** (`docs/concepts/pause-until-dawn/video-flf/round4/post/`,
under the 10 MB budget -- 2.5 MB total): `idle-blinks-pingpong.mp4`,
`idle-blinks-contact-sheet.jpg`, `idle-blinks-report.json`,
`idle-breathing-pingpong.mp4`, `idle-breathing-contact-sheet.jpg`,
`idle-breathing-report.json`. The full outputs (forward builds, WebM copies, frames-cm)
live next to each clip's source frames at `D:/Tools/pyrefly-video/flf/<clip>/1/post/`
(not committed -- generated, and the source frames themselves are gitignored).

## What this is not

Not a fix to any clip's motion (the double blink, the second late event in
`idle-blinks`) -- those are the separate, already-measured defects
`round4/method-check.md` tracks; colour-match + ping-pong only recovers grade and join
continuity, exactly as `pingpong.md`'s own verdict says. Not a judgement that either
existing clip is ready to show Bailey -- `judge-clip.md`'s FAIL verdict on `idle-blinks`'
motion stands unchanged; this tool only means that *if* a clip passes a motion judge, its
join no longer needs a bespoke script. Not a run of the round-4 A/B experiment
(`method-check.md` SS3(b), `round4/ab/tone-series.py`) -- that is a separate, in-flight
piece of this round's work; this pass did not queue a render and did not touch
`round4/ab/`.

## Game-aware classification (rule 14)

**Both.** This is shared plumbing for the pause-menu living portrait (used identically
for FFX-only and FFX-2-only characters); it touches no combat, chapter or game-specific
system.
