# Living portrait FLF, round 4: the end-anchor A/B result

**What this is.** `method-check.md` SS3(b) asked for one controlled experiment to
isolate two candidate causes of round 3's blown-out ending (`judge-clip.md`, commit
`d8770f0`): the 4-frame `RepeatImageBatch` end anchor itself, versus clip length (97
frames giving the model's own colour drift more steps to compound). Both arms hold
length at 81 frames and the same seed and prompt, and differ only in `--endBatch`.
This file reports what was rendered, the two tone series side by side, the post-process
(colour-match + ping-pong) join numbers for each arm, and which arm is usable today.

Tool: `tools/gen/video-flf.mjs render ab-end-anchor-<a|b> --seed 7 --length 81
--endBatch <1|4>`. Plate: `pyrefly-video-plate-f1efe21f6c75-1280x704.png`. Prompt (both
arms, identical): *"Subtle breathing, hair still, no blink, the character at rest for
the whole last second."* + the standard no-restyle suffix. 1280x704, 24 fps, 81 frames
(3.375 s) each.

## 1. What was rendered, and when

Both jobs ran on the shared ComfyUI instance, one at a time, each gated on 10
consecutive idle minutes on `GET /queue` (the brief's rule — a 60-90 minute job would
otherwise block the other three active tracks). Full log:
`D:/Tools/pyrefly-video/flf/round4-ab.log` (not committed — a local run log, not
evidence; the numbers below are drawn from each render's own `join-report.json` and
this pass's own measurement scripts, both committed alongside this file).

| | queue-idle gate | render | wall time | output |
|---|---|---|---|
| Arm A (`endBatch=1`) | empty 21:03:39-21:13:41 (602 s) | 21:13:46-22:04:08 | 3020.0 s (50.3 min) | `D:/Tools/pyrefly-video/flf/ab-end-anchor-a/7/` |
| Arm B (`endBatch=4`) | empty 22:06:09-22:07:09, reset by another track's inpaint job, re-idled 22:07:40-22:17:42 (602 s) | 22:17:42-23:08:55 | 3067.7 s (51.1 min) | `D:/Tools/pyrefly-video/flf/ab-end-anchor-b/7/` |

Total wall time for the whole pass (idle waits + both renders): 2 h 5 min. Arm B's
queue-idle wait includes one reset when another track (an IPAdapter inpaint job, seen
in `/queue`) queued a job mid-wait — the gate correctly restarted its 10-minute count
rather than queueing over it, per the shared-GPU rule. ComfyUI was never restarted;
exactly one render job ran at a time.

## 2. The render-time join numbers (frame 1 / frame N vs the plate, vs the VAE floor)

From each render's own `join-report.json` (`tools/gen/join_report.py`, the same boxes
and floor probe every prior round used) —
[`arm-a-render-join-report.json`](arm-a-render-join-report.json),
[`arm-b-render-join-report.json`](arm-b-render-join-report.json):

| box | Arm A f1 xFloor | Arm A f81 xFloor | Arm B f1 xFloor | Arm B f81 xFloor | round 3 (97/4) f97 xFloor, for reference |
|---|---|---|---|---|---|
| face | 1.28 | **1.34** | 2.31 | **5.81** | 5.78 |
| eyes | 1.26 | 1.30 | 2.08 | 4.84 | 4.95 |
| mouth | 1.50 | **1.36** | 3.72 | **13.12** | 13.14 |
| braid | 1.21 | 1.21 | 1.90 | 4.03 | 4.01 |
| hairline | 1.31 | 1.44 | 2.54 | 7.28 | 7.18 |

**Arm A's ending is flat and near the floor, at 81 frames and 24 fps, with no
post-processing at all** — no round-2-era loose drift, no round-3-era blow-out. **Arm
B's ending reproduces round 3's blow-out almost exactly, number for number, at 81
frames** — length was cut from 97 to 81 (a 16-frame, 4-second-shorter clip) and the
blow-out did not move. That is the experiment's answer on its own, before either arm's
internal tone series or its post-process numbers are even considered: **the cause is
the 4-frame `RepeatImageBatch` end anchor itself, not clip length.**

## 3. The two tone series, side by side

Own measurement (`tone-series.py`; per-frame saturation and body-box MAD-vs-frame-1 —
the pinned, no-motion region every prior judge pass used — plus face/mouth MAD vs the
plate). Full series: [`arm-a-tone.json`](arm-a-tone.json) / [`arm-b-tone.json`](arm-b-tone.json).
VAE floor for reference: face 3.85, mouth 1.92, body 3.74.

| frame | Arm A saturation | Arm A bodyMAD-vs-f1 | Arm A faceMAD-vs-plate | Arm B saturation | Arm B bodyMAD-vs-f1 | Arm B faceMAD-vs-plate |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 0.633 | 0.00 | 4.95 | 0.609 | 0.00 | 8.91 |
| 2 | 0.636 | 2.37 | 4.72 | 0.589 | 7.11 | 14.62 |
| 10 | 0.636 | 3.89 | 4.76 | 0.555 | 12.31 | 19.30 |
| 30 | 0.634 | 3.90 | 4.69 | 0.535 | 14.37 | 20.76 |
| 50 | 0.634 | 3.94 | 4.71 | 0.536 | 13.31 | 19.47 |
| 65 | 0.634 | 4.14 | 5.10 | 0.532 | 14.09 | 19.81 |
| 70 | 0.635 | 4.09 | 5.09 | 0.511 | 15.78 | 21.51 |
| 74 | 0.634 | 4.12 | 5.07 | 0.422 | 20.09 | 26.04 |
| 76 | 0.635 | 4.10 | 5.09 | 0.358 | 24.23 | 31.34 |
| **77** | 0.635 | 4.11 | 5.17 | **0.343 (min)** | **25.57 (max)** | **32.96** |
| **78** | 0.635 | 4.04 | 5.08 | **0.517** | 16.92 | 16.72 |
| 79 | 0.635 | 4.04 | 5.09 | 0.644 | 20.27 | 18.87 |
| 80 | 0.634 | 4.02 | 5.03 | 0.681 (max) | 24.00 | 21.08 |
| 81 | 0.634 | 4.06 | 5.15 | 0.671 | 24.44 | 22.36 |

**Arm A never leaves a narrow band** (saturation 0.633-0.637 across all 81 frames, body
MAD settling to ~4.0-4.2, right at the VAE floor of 3.74 — this is measurement noise,
not drift). There is no frame-to-frame anomaly anywhere in the clip (own frame-to-frame
face step, whole clip: median 1.02, max 2.56 — a 2.5x ratio, unremarkable).

**Arm B drifts from frame 2 onward** — saturation falls from 0.609 to the 0.53-0.54
band by frame 10 and holds there (a washed grade appearing well before any end anchor,
confirming `method-check.md`'s SS1 point 2 that tone wander is not purely an
end-anchor-boundary effect), then **collapses further to a minimum of 0.343 at frame
77** (a dark, desaturated trough), then **at exactly frame 78 — the first of the four
`RepeatImageBatch`-anchored end frames in this 81-frame clip — saturation snaps to an
over-saturated 0.517 and climbs to 0.681 by frame 80**. The frame-to-frame face step at
this exact boundary is **36.44**, against the clip's own median step of ~1.7-1.9 (a
~20x jump) — own measurement, [`arm-b-tone.json`](arm-b-tone.json)'s `faceStep[76]`
(0-indexed, i.e. the f77->f78 step). **This is the same phenomenon at the same relative
position**: round 3's 97-frame clip (`endBatch=4`) popped at f93->f94, exactly 4 frames
from its own end; this 81-frame clip (`endBatch=4`) pops at f77->f78, exactly 4 frames
from *its* end. Two clips of different lengths, same end-anchor batch size, same
"exactly 4 frames from the end" pop location — this is the controlled result rule 15
asked for.

## 4. The post-process (colour-match + ping-pong) numbers, both arms

Run via `tools/gen/video-post.mjs` (round 4's productionised tool, `post.md`) with
`--vae-floor` given, auto-turnaround. Full reports:
[`arm-a-report.json`](arm-a-report.json) / [`arm-b-report.json`](arm-b-report.json).

| | Arm A | Arm B |
|---|---|---|
| Auto turnaround T | **81** (the clip's own last frame) | **67** (14 frames short of the last frame — the tool rejects everything from ~68 onward as not calm) |
| Ping-pong length | 160 frames (1..81, 80..2), 6.667 s | 132 frames (1..67, 66..2), 5.5 s |
| Reversal seam, cm, face MAD | 1.14 (below the 3.85 floor) | 2.16 (below the floor) |
| Reversal seam, cm, mouth MAD | 0.62 (below the 1.92 floor) | 0.95 (below the floor) |
| Whole-clip step, motion boxes, raw median/max | 1.02 / 2.56 (2.5x) | 1.74 / 35.48 (20.4x) |
| Whole-clip step, motion boxes, cm median/max | 1.05 / 2.53 (2.4x) | 1.89 / 19.48 (10.3x) |
| Saturation, cm f1/min/max | 0.620 / 0.611 / 0.620 | 0.617 / 0.510 / 0.621 |

**The ping-pong seam itself is invisible on both arms** — both land below the VAE
floor, matching `pingpong.md`'s round-3 finding that the reversal-at-a-still-frame
construction works regardless of the source clip's own tone problems, because the seam
sits between two adjacent original frames (T-1, T), not between two independent
decodes. Colour-matching cuts arm B's worst internal step from 20.4x its own median to
10.3x — a real reduction, same direction as round 3's pingpong.md finding (27.95 -> 17.04
there) — but it does not eliminate the pop; a ~10x jump is still a visible flash if that
exact frame pair is on screen. **The auto-turnaround pick is the more consequential
number**: for arm B, the tool refuses to use anything past frame 67, which throws away
frames 68-81 (the whole desaturation trough and the blow-out) rather than trying to
loop through them. That is the tool doing exactly what `post.md` documented it for, but
it means **arm B's usable clip is 14 frames (0.58 s) shorter than the one that was
rendered** — the dedicated "return to stillness" tail the round-3 prompt asked for is
the part being cut.

## 5. Verdict: which arm is better, and is either usable today

**Arm A (`endBatch=1`, 81 frames) is better on the end, and is usable today with the
standing post-process.** Its render alone — no colour-match, no ping-pong — already
ends within measurement noise of the plate (face 1.34x floor, mouth 1.36x floor), never
leaves a narrow tonal band anywhere in the clip, and needs no truncation: the
auto-turnaround pick keeps the full 81 frames, so the post-process's only job is to
build the seamless loop, not to hide anything. That said, arm A's own `frame1XFloor`
sits at 1.5x on the mouth — small, but not zero — so calling it "solved" outright would
overstate a single 81-frame, seed-7, inert-motion sample; the standing recommendation
below still asks for one more confirming data point before this becomes the new
default.

**Arm B (`endBatch=4`, 81 frames) is not usable even with the post-process**, not
because the ping-pong seam is bad (it is not — it is below the floor, same as arm A) but
because achieving that requires cutting the clip to 67 of its 81 rendered frames,
discarding the dedicated still ending the prompt was written to produce. A clip that
must be truncated by 17% to hide its own defect is not "usable with the post-process"
in the sense `method-check.md` SS3(a) meant when it said colour-match + ping-pong
recovers a join — that method assumes the *whole* clip is worth keeping and only the
cut needs fixing, not that a fifth of the clip gets thrown away.

**Answer to `method-check.md`'s open question:** the 4-frame end-anchor batch is
implicated, not clip length. Arm B (81 frames, `endBatch=4`) reproduces round 3's
blow-out (97 frames, `endBatch=4`) almost number-for-number, and the pop lands at
exactly "4 frames from the end" in both clips regardless of their different total
lengths. Arm A (81 frames, `endBatch=1`) shows none of it, matching round 2's
originally-measured flat ending. A length-only control (97 frames, `endBatch=1`) is
still not rendered and is not needed to answer the question this pass asked — it would
help decide whether 81 or 97 frames gives a better *motion* budget for the blink clips,
a separate question already tracked in `method-check.md` SS5.

## 6. Recommendation

Switch the standing default to `endBatch=1` for future renders of this clip set
(`END_ANCHOR_FRAMES` in `tools/gen/video-flf.mjs` currently defaults to 4) — but this
pass does not make that change itself: `method-check.md` SS3(a) already commits round 4
to one controlled experiment, not a default change plus a second untested variable, and
a one-arm, one-seed, inert-motion sample is not enough evidence to flip a constant every
future clip inherits. The next render (the real `idle-blinks` or `idle-breathing`
re-render, whichever Bailey picks next) should use `--endBatch 1 --length 81`
explicitly and re-check the ending on real (non-inert) motion before the default itself
changes, since a real blink's own motion could interact with the end anchor differently
than this pass's deliberately inert prompt.

## 7. What this is not

Not a fix to the blink motion (double blink, timing) — unchanged, still tracked in
`method-check.md` SS1. Not a change to `tools/gen/video-flf.mjs`'s defaults
(`END_ANCHOR_FRAMES` / `LENGTH` are untouched; both arms used the `--endBatch`/`--length`
CLI overrides added for this experiment). Not a render of `idle-blinks` or
`idle-breathing` with the new setting — those still need their own pass. Not a claim
that arm A is ready to show Bailey — this experiment used a deliberately inert prompt
with no blink and no head motion specifically so tone could be measured without a
motion confound; the actual clip set still needs real motion re-rendered and judged.

## 8. Game-aware classification (rule 14)

**Both.** Shared living-portrait plumbing (the FLF render tool and its end-anchor
setting), used identically for FFX-only and FFX-2-only characters; no combat, chapter
or game-specific system touched.
