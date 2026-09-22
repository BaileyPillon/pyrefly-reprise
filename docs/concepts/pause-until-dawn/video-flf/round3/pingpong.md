# Living portrait FLF, round 3: the ping-pong loop test

**What this is.** `judge-clip.md` (commit `d8770f0`) failed `idle-blinks` for a visible
join at both ends and a visible hard cut. This pass does not re-render or re-judge that
clip. It tests one idea instead: play a clip forward to a still turnaround frame **T**,
then back down to frame 2 (never re-showing frame 1), so the clip always returns to
exactly the pixels it started from. The cut between two different clips then happens at
their shared anchor, frame 1, instead of at whatever the model's last rendered frame
happens to look like. No render was queued, no ComfyUI was touched; everything here is
`ffmpeg` + `numpy`/`PIL` over the two clips that already existed on disk:
`idle-breathing` (round 2, 81 frames, 16 fps) and `idle-blinks` (round 3, 97 frames,
24 fps). Every number below was computed by this pass from the frame PNGs or from the
built webm/mp4 files, not asserted.

**Mid-pass addition.** After the turnaround analysis below was done, the coordinator
added a requirement based on `judge-clip.md`'s own finding: `idle-blinks` is
geometrically pinned (phase correlation `(0,0)` on every frame) but tonally wanders
(frame 2 snaps to a washed grade, frames 78-93 brighten, frames 94-97 blow out orange).
So a **per-frame global colour-match** step was added, fit only on the regions
`judge-clip.md` already proved are pinned (no motion) -- the body box and the two
background boxes -- and applied to the whole frame. Every build and every join test
below exists in two variants, **raw** and **cm** (colour-matched), so they can be
compared side by side.

---

## 1. Picking the turnaround frame T

### 1a. `idle-blinks` (97 frames, 24 fps) -- eye-aperture measurement

Per-frame mean luminance and MAD-vs-frame-1 were measured in the eye boxes (`eyes`
460,140-635,285; `greenEye` 468,203-546,278; `blueEye` 548,145-626,220 -- the boxes
`judge.md`/`join_report.py` already use). In this footage a closing eyelid is *brighter*
than the open iris (skin over a saturated green/blue iris raises the box mean, it does
not lower it), so blink events show as **MAD peaks**, not dips -- the opposite of the
brief's naive assumption, and worth recording since it would trip up a threshold tuned
the other way.

| frames | eyesMAD vs f1 | reading |
|---|---|---|
| f1-f44 | 0 to ~20, rising slowly | settling / a small gaze drift, no lid event (matches `judge-clip.md`'s own finding of "no lid event at all" here) |
| f47-f64 | rises to two peaks, 32.0 at f52 and 34.8 at f61 | the double-blink `judge-clip.md` measured independently by iris-pixel count (close f45-50, shut, half reopen f54-57, closes again f58-59, shut, reopens f66-73) |
| f65-f77 | falls from 31.0 to 17.2 | the blink's reopen tail |
| **f78-f82** | **falls further to a floor of 13.3-13.4 at f80/f81, the global minimum of the whole 97-frame series** | eyes, mouth, face, hairline and braid are *all* simultaneously at or near their own minimum here (cross-checked across every box, not just eyes) |
| f83-f97 | climbs again to 25-35 | a second, later mouth/expression event the "done by 3 s" prompt did not prevent -- consistent with `judge-clip.md`'s own note that "the still end flickers in exposure" |

**T = 81.** It is a few frames after the measured last-blink settle (not "frame 72" as
guessed in the brief -- the real double-blink does not finish settling until ~f77-78,
later than the prompt's intended 3 s/72-frame cutoff), it is the calmest frame available
in *every* box at once, and it sits before the late second event picks back up at f83+.

### 1b. `idle-breathing` (81 frames, 16 fps) -- collar/chest box motion

A vertical-shift search (+-6 px, best-MAD alignment of the collar box `540,360-860,620`
against frame 1) found **dy = 0 on all 81 frames**. There is no measurable chest
displacement in this clip -- the collar box's rising MAD-vs-frame1 (2.3 at f2 to a
plateau of 4.5-4.6 from f66 onward) is a slow tonal drift, not motion. So there is no
"breathing peak" to find by displacement; the honest finding is that this clip's
visible motion is the same kind of blink/mouth activity `idle-blinks` has (confirming
round 2's `judge.md`: "it breathes and blinks, clear events at f29-37 and f65-73") and
what actually needs a calm turnaround is that motion, not a breath cycle.

Per-frame-to-frame ("velocity") MAD in mouth and eyes stays large (2.4 to 23+) through
f77, then drops to 1.3-3.1 for f78-81 -- the same kind of late settle `idle-blinks` shows,
just with no spare footage after it. **T = 81**, the clip's last frame, chosen because it
is empirically the calmest available point (collar plateaued, mouth/eyes velocity at
their lowest), not because a breath cycle peaks and returns there. The forward portion
therefore uses the entire clip.

Both clips landing on T = 81 is coincidence, not a shared property -- one is 81 of 97
frames (with 16 frames of a second event left unused after it), the other is 81 of 81
(all of it).

---

## 2. Per-frame global colour match

Fit per channel `a, b` minimising `sum((a * frame_pixel + b - plate_pixel)^2)` over the
pinned pixels only (`body` 560,400-900,690, `bgLeft` 0,120-330,560, `bgRight`
950,0-1280,500 -- `judge-clip.md`'s own boxes), least squares, then apply `a * frame + b`
(clipped to 0-255) to the *whole* frame. A plain per-channel gain/offset turned out to be
enough -- no cross-channel 3x4 matrix was needed; see the residual drop below.

| clip | pinned residual MAD before -> after (median / max) | saturation before -> after (f1 / min / max) |
|---|---|---|
| `idle-blinks` | **15.24 / 18.99 -> 6.43 / 14.26** | 0.612/0.448/0.672 -> 0.622/0.587/0.629 |
| `idle-breathing` | 3.43 / 4.09 -> 2.92 / 3.06 | 0.633/0.633/0.640 -> 0.616/0.610/0.616 |

`idle-blinks` had the real tonal problem `judge-clip.md` found, and the fit shows it:
gains swing from 0.83 to 1.20 and offsets from -39 to +23 across the 97 frames (worst at
f97, the blown-out frame: `a=(0.92,0.83,0.83)`, `b=(+8.8,+13.0,+22.5)`), and correcting
for it collapses the saturation swing from 0.448-0.672 down to 0.587-0.629 -- close to
the plate's own 0.61-0.62. `idle-breathing` needed almost nothing (`a` within 0.99-1.01,
`b` within +1.6 to +4.7 everywhere): its problem was never tone.

| clip | box | vs plate before (f1 / fN / clip max) | vs plate after (f1 / fN / clip max) |
|---|---|---|---|
| `idle-blinks` | face | 6.75 / 22.26 / 26.54 | 5.49 / 19.01 / 19.01 |
| `idle-blinks` | mouth | 4.39 / 25.23 / 25.23 | 3.92 / 13.55 / 13.64 |
| `idle-blinks` | full | 4.68 / 18.93 / 19.57 | 3.35 / 14.98 / 14.98 |
| `idle-breathing` | face | 5.23 / 5.75 / 11.60 | 5.33 / 5.22 / 11.10 |
| `idle-breathing` | mouth | 3.03 / 4.24 / 35.81 | 3.52 / 2.73 / 35.75 |
| `idle-breathing` | full | 3.56 / 4.22 / 5.00 | 3.27 / 3.16 / 4.02 |

| clip | step (velocity) median -> after / max -> after | |
|---|---|---|
| `idle-blinks` stepFace | 1.63 -> 1.88 | max **27.95 -> 17.04** (the f93->f94 blow-out pop, cut 39%) |
| `idle-blinks` stepFull | 0.93 -> 1.03 | max **19.41 -> 13.12** |
| `idle-breathing` stepFace | 1.31 -> 1.31 | max 7.03 -> 6.99 (no change -- confirms no tone problem here) |
| `idle-breathing` stepFull | 0.70 -> 0.72 | max 1.60 -> 1.51 |

Colour-matching cannot fix a mouth *shape* (the double-blink, the late second event) --
it only pulls the grade back toward the plate. It substantially helps `idle-blinks`
(its real defect was tonal) and does almost nothing for `idle-breathing` (its real
defect is unfinished motion, not grade).

---

## 3. The builds

All at `D:/Tools/pyrefly-video/flf/pingpong/`, VP9 crf 30 + an h264 mp4 copy, all
well under the 3 MB / 8 MB budgets:

| file | frames | fps | duration | size (webm / mp4) |
|---|---|---|---|---|
| `pingpong-blinks.webm/.mp4` | 160 (1-81, 80-2) | 24 | 6.667 s | 0.81 / 0.92 MB |
| `pingpong-blinks-cm.webm/.mp4` | 160 | 24 | 6.667 s | 0.86 / 0.96 MB |
| `pingpong-breathing.webm/.mp4` | 160 (1-81, 80-2) | 16 | 10.0 s | 0.74 / 0.93 MB |
| `pingpong-breathing-cm.webm/.mp4` | 160 | 16 | 10.0 s | 0.74 / 0.97 MB |
| `pingpong-breathing-24fps.webm/.mp4` | 238 (minterpolate) | 24 | 9.92 s | 0.63 / 0.96 MB |
| `pingpong-breathing-cm-24fps.webm/.mp4` | 238 | 24 | 9.92 s | 0.63 / 1.00 MB |

**16 fps vs the 24 fps retimed copy, recommendation:** looked at 1:1 across the busiest
motion window in the clip (the f65-70 mouth event, a burst-extract compared frame by
frame), `minterpolate` produced no visible ghosting or warping -- the extra in-between
frames read as smoother motion, not artefacts. **Recommendation: use the 24 fps retimed
copy** whenever this clip sits in a library alongside 24 fps clips like `idle-blinks`
(so a scheduler never has to fps-switch mid-playback); keep the native 16 fps file as
the source of truth and re-derive the 24 fps copy if the source ever changes, rather
than hand-editing the interpolated one.

---

## 4. Join tests

### 4a. Reversal seam vs the clip's own median step

The only real "seam" inside one ping-pong loop is the direction change at T; frame 1
never repeats. Compared the frame-(T-1)-to-T MAD against that clip's own median
frame-to-frame MAD (its normal motion):

| variant | clip | box | seam MAD | clip median step | seam / median |
|---|---|---|---|---|---|
| raw | idle-blinks | face | 2.14 | 1.63 | 1.31x |
| raw | idle-blinks | eyes | 2.40 | 2.38 | 1.01x |
| raw | idle-blinks | full | 1.37 | 0.93 | 1.47x |
| raw | idle-breathing | face | 1.21 | 1.31 | 0.93x |
| raw | idle-breathing | full | 0.65 | 0.70 | 0.94x |
| cm | idle-blinks | face | 2.25 | 1.88 | 1.20x |
| cm | idle-blinks | full | 1.43 | 1.03 | 1.40x |
| cm | idle-breathing | face | 1.21 | 1.39 | 0.87x |
| cm | idle-breathing | full | 0.65 | 0.73 | 0.90x |

**Every reversal seam is within about 1-1.5x the clip's own ordinary frame-to-frame
motion** -- nowhere near the 6-20x multiples `judge-clip.md` measured for a forward-only
loop's join. This confirms the reasoning behind ping-pong: reversing at any frame is
*pixel-continuous by construction* (frame T to T-1 is the same pair the forward pass
already played, just re-ordered), so the only way to get a visible reversal is to pick T
mid-motion. Looking directly at the reversal (frames 78-81-78 for both clips, eyes and
mouth, in `pingpong-strip.jpg`), both are visually static across the turnaround -- the
choice of T lands in a genuinely still moment for both clips, as intended.

### 4b. Cross-clip: idle-blinks frame 1 vs idle-breathing frame 1

Both clips' frame 1 are separate, independent decodes of the *same* plate. How close are
they to each other, next to the VAE floor and next to each clip's own frame-1-vs-plate
number:

| variant | box | floor | blinks-f1 vs breathing-f1 | (x floor) | blinks-f1 vs plate | (x floor) | breathing-f1 vs plate | (x floor) |
|---|---|---|---|---|---|---|---|---|
| raw | face | 3.85 | 4.44 | 1.15x | 6.75 | 1.75x | 5.23 | 1.36x |
| raw | eyes | 4.70 | 4.83 | 1.03x | 7.42 | 1.58x | 6.11 | 1.30x |
| raw | mouth | 1.92 | 3.87 | 2.02x | 4.39 | 2.29x | 3.03 | 1.58x |
| raw | full | 2.22 | 3.51 | 1.58x | 4.68 | 2.11x | 3.56 | 1.61x |
| cm | face | 3.85 | **3.03** | **0.79x** | 5.44 | 1.41x | 5.24 | 1.36x |
| cm | eyes | 4.70 | **3.30** | **0.70x** | 6.57 | 1.40x | 6.32 | 1.34x |
| cm | mouth | 1.92 | **1.76** | **0.92x** | 3.63 | 1.89x | 3.19 | 1.66x |
| cm | full | 2.22 | **2.06** | **0.93x** | 3.32 | 1.50x | 3.25 | 1.46x |

Two clips' frame-1s are already closer to *each other* than either is to the true plate
(both raw and cm) -- their independent decode errors correlate more than they diverge.
**After colour-matching, every box's cross-clip distance drops below the VAE noise
floor itself** (0.70x-0.93x): the theoretical best case for cutting between two
different loops' shared anchor frame is, after the colour match, indistinguishable from
re-encoding noise.

### 4c. The actual hard cut: `pingpong-blinks` into `pingpong-breathing`

Concatenated the *built* files (`ffmpeg concat`, no fade, re-encoded so the analysis
reads real decoded pixels, matching `judge-clip.md`'s method). Because a ping-pong loop
ends at frame 2 (frame 1 is never doubled), **the real cut is blinks-frame-2 to
breathing-frame-1, not frame-1-to-frame-1** -- worth stating plainly since it is not what
4b measures and it is measurably worse than 4b's idealised number, for a specific
reason: `judge-clip.md` found frame 1 to frame 2 is itself `idle-blinks`'s biggest single
step (the wash-grade snap), so the loop's exit point (frame 2) is not as close to the
plate as frame 1 is.

**In the tight 1:1 identity crops (eyes, mouth, hairline -- see `pingpong-strip.jpg`,
"HARD CUT" rows), the cut is not visible in either variant.** But at *full frame*, it is
a different story:

| region | raw cut step | cm cut step | neighbouring in-clip steps (raw) |
|---|---|---|---|
| face | 13.74 | 7.68 | 1.5-2.2 |
| eyes | 15.25 | 7.92 | 1.3-2.4 |
| mouth | 15.50 | 4.67 | 1.4-2.2 |
| hairline | 12.46 | 7.44 | 1.3-2.0 |
| full frame | 10.04 | 4.81 | 1.3-1.6 |

Looked at full-frame 1:1 (`pingpong-strip.jpg`, "FULL-FRAME AT THE CUT"): the **raw** cut
shows a real, visible background/skin tone shift -- the lantern and warm side of the
frame are brighter/warmer just before the cut and cooler just after, and the amplified
difference map (x6) shows broad flat-region colour, not just edges. The **colour-matched**
cut brings the two sides much closer -- the side-by-side stills read as the same shot,
and the x6 difference map is now dominated by edge lines rather than flat-region colour,
consistent with the numeric ~2x reduction in every box above. Colour-matching turns a
cut that is invisible in a close-up but visible in a wide shot into one that is close to
invisible in both.

A second cut (`breathing`(24 fps) end -> `blinks` start, inside the 20 s demo, opposite
direction) was also pulled and looked equally clean in the tight eye crop
(`pingpong-strip.jpg`, "DEMO 2nd CUT").

---

## 5. The 20-second demo

Built as specified -- `blinks-pingpong, breathing-pingpong, blinks-pingpong,
breathing-pingpong`, hard cuts only, using the recommended 24 fps retimed breathing copy
so the whole thing runs at one frame rate -- for both raw and cm.

**Honesty check on the name: the result is not 20 seconds.** Each full loop is inherently
6.667 s (blinks) or 9.917 s (breathing, either fps), so four loops back to back run
**33.17 s**, not 20 s. T was chosen from measured settle points (section 1), not to hit a
duration budget, and shortening it just to reach "20 s" would have meant cutting into
still-moving footage on one or both clips. Filenames follow the brief's literal request
(`demo-20s.*`); the doc states the real number instead of quietly padding or trimming to
match it.

| file | duration | size |
|---|---|---|
| `demo-20s.webm` | 33.17 s | 2.60 MB |
| `demo-20s.mp4` | 33.17 s | 4.11 MB |
| `demo-20s-cm.webm` | 33.17 s | 2.53 MB |
| `demo-20s-cm.mp4` | 33.17 s | 4.17 MB |

Both mp4s are under the 8 MB copy-into-docs threshold and are included in this folder.

---

## 6. Verdict

**Ping-pong works, and colour-matching is worth doing on top of it.** Reversing a clip
at a still frame is pixel-continuous by construction, so both clips' reversal seams
measure within 1-1.5x their own ordinary motion and read as static in the 1:1 strip;
the technique fully rescues `idle-breathing`'s known join-last failure (it never has to
play the bad tail) and sidesteps `idle-blinks`'s worst frames (94-97's blow-out is never
reached because T=81, not 97). Cutting between the two different clips at their shared
anchor is the weaker of the two joins tested: in tight identity crops (eyes, mouth,
hairline) it is invisible in both the raw and colour-matched builds, but at full frame
the **raw** cut shows a real, visible background/skin tone step (10-15 MAD across boxes,
6-10x the clip's ordinary motion) inherited from `idle-blinks`'s own frame-1-to-frame-2
wash-grade snap that `judge-clip.md` already flagged; the **colour-matched** cut cuts
that step roughly in half (4.7-7.9 MAD) and reads as the same shot in the full-frame
side-by-side, so **colour-matched is the one closer to invisible** and the recommended
default if this technique ships. Reversed motion looks natural on both clips because the
turnarounds sit in genuinely still 4-frame windows, not mid-gesture -- neither the
mouth nor the eyes are moving at T=81 in either clip, so nothing here tests what a
reversed blink or a reversed smile-relax looks like *mid-motion*; that only matters if a
future clip's calmest available point is not still, and the implication for the clip set
stands regardless: **every future clip should be planned so its motion is finished and
the pose is at rest well before the last rendered frame**, giving the ping-pong turnaround
a genuinely still window to land in, exactly as this pass had to find empirically for both
existing clips instead of getting for free.

---

## Files

**Videos, analysis JSON and scripts** (source of every number above):
`D:/Tools/pyrefly-video/flf/pingpong/` -- `pingpong-blinks{,-cm}.{webm,mp4}`,
`pingpong-breathing{,-cm}{,-24fps}.{webm,mp4}`, `demo-20s{,-cm}.{webm,mp4}`,
`hardcut-{raw,cm}.mp4` (intermediate, used only to pull the cut frames in section 4c).

**Committed with this doc** (`docs/concepts/pause-until-dawn/video-flf/round3/`):
- `pingpong.md` -- this file
- `pingpong-strip.jpg` -- the 1:1 evidence strip (reversal seams, hard-cut identity
  crops raw+cm, full-frame cut comparison raw+cm, demo 2nd cut)
- `demo-20s.mp4`, `demo-20s-cm.mp4` -- the 20 s (actually 33.17 s) demos, both variants
- `pingpong-turnaround-analysis.py` -- eye-aperture / box-MAD turnaround analysis (section 1)
- `pingpong-breathing-shift.py` -- the vertical phase-correlation-style shift search (section 1b)
- `pingpong-colour-match.py` -- the per-frame colour-match fit (section 2)
- `pingpong-join-tests.py` -- reversal seam + cross-clip frame-1 tests (section 4a, 4b)
- `pingpong-colour-match-blinks.json`, `pingpong-colour-match-breathing.json` -- full
  per-frame colour-match stats (params, box MADs, saturation, steps)
- `pingpong-join-tests.json` -- full reversal/cross-clip numbers

*No render was queued and no ComfyUI workflow was touched by this pass.*
