# Judge pass — Wan 2.2 clip set (independent of the generator)

**Judge:** a separate sub-agent from the one that rendered these clips. I did not
render anything; I only read `D:/Tools/pyrefly-video/**` and the frame PNGs already
saved there by `tools/gen/video.mjs`, extracted/verified frames with `ffprobe`/`ffmpeg`,
built my own crops with Python/PIL/numpy, and looked at every image below at 1:1
before writing a verdict. Reference: `docs/plans/pause-living-portraits-motion-spec.md`.
Character identity: `public/art/pause/yuna-ffx2.png` / `.json` — brown hair, one long
thin braid, heterochromia (green left eye, blue right eye, as she faces the camera),
Gunner dressphere, Al Bhed pendant on the choker. **No earring is visible anywhere on
this plate** (the ear is fully covered by hair in every frame I checked) — I used the
Al Bhed pendant as the closest fine identity detail in its place; this is noted, not
invented.

**What exists to judge, as of this pass:** only three clips have any rendered frames —
`idle-breathing/1`, `smile/1`, `turn-left-and-back/1` (121 frames / 5.04 s each, all
verified via `ffprobe` to match the committed `clip.webm`, 1280x704 @ 24 fps).
`turn-left-and-back/101` (the re-seed) and `hair-breeze/1` exist as empty directories
on disk (0 frame files) — still queued/running or stalled, nothing to score. The other
6 clip types (`idle-blinks`, `look-up-and-back`, `turn-right-and-back`, `determined`,
`hurt`) have no directory at all yet.

## Method

For each of the three clips: extracted frame 1/40/80/121 (already present as lossless
PNGs from the `SaveImage` node — verified these are the same frame count and
resolution as the committed `clip.webm` via `ffprobe -count_frames`), cropped 1:1
regions around both eyes, the mouth and the Al Bhed pendant at each of those four
frames, and built a contact sheet (`judge-contact-sheet.jpg`, 1.0 MB) showing the full
frame with the crop boxes marked plus the four crop rows per clip. For
**RETURNS_TO_NEUTRAL** I additionally computed the plain `numpy` mean absolute
difference (MAD, 0–255 per channel-average) between frame 121 and frame 1 over a fixed
340x260 face-region box, per the brief's instruction. That raw number turned out to be
dominated by a small camera push-in/shift present in **all three** clips (confirmed by
a brute-force shift+scale search that only brought the floor down from ~86–90 to
~72–77 before hitting the search window's edge — i.e. it is not purely a translation,
there is a real small zoom too) rather than by a difference in facial content. I report
the raw number for the record and then score what the frames actually show by eye,
which is what the box's "Bailey judges by eye" rule and this brief's own "PICK ... or
REJECT" language are actually asking for.

Raw MAD(frame121, frame1), fixed 340x260 face box, per clip:

| Clip | Raw MAD | Best-aligned MAD (shift+scale search) |
|---|---|---|
| idle-breathing (1) | 90.2 | 72.3 |
| smile (1) | 89.8 | 72.2 |
| turn-left-and-back (1) | 86.3 | 76.1 |

The three raw numbers are within 4 points of each other and do **not** separate the
clips usefully — by eye, `smile` frame 121 is nearly indistinguishable from frame 1
while `turn-left-and-back` frame 121 is a visibly different hairstyle, head angle and
eye state. So I do not let this single number drive the RETURNS_TO_NEUTRAL score by
itself; I use it as one input alongside the direct visual comparison, and say so.

## Scores (0–10)

| Clip (seed) | IDENTITY | MOTION | RETURNS_TO_NEUTRAL | Verdict |
|---|---|---|---|---|
| `idle-breathing` (1) | **8** | 6 | 4 | **PASS — pick** |
| `smile` (1) | **9** | 6 | 5 | **PASS — pick** |
| `turn-left-and-back` (1) | **2** | 3 | 1 | **REJECTED** |

### idle-breathing (seed 1) — IDENTITY 8, MOTION 6, RETURNS_TO_NEUTRAL 4

Both eyes hold their correct colours and sides at every sampled frame (f1/40/80/121 —
see the contact sheet's `blue_eye`/`green_eye` rows): green stays her screen-left eye,
blue her screen-right, at full saturation throughout. Hair colour, the braid, the
Al Bhed pendant and the cel-shaded line/colour style are unchanged at every frame — no
3D or photo drift anywhere in the set. That is a clean 8.

MOTION loses points for a real, visible defect: by frame 121 the framing has crept in
and the head angle has drifted (confirmed independently of the generator's own report
— my frame-121 crop boxes had to be moved up and enlarged relative to frames 1/40/80
to keep the eyes inside them at all, which only happens if the face got bigger/shifted
in-frame). Frames 1/40/80 themselves are smooth with no popping or face-shape
morphing. This is the brief's own "camera locked" instruction being broken, so MOTION
is capped at 6 rather than higher.

RETURNS_TO_NEUTRAL: raw MAD 90.2, but by eye the frame-121 face is the *same* face,
same closed-lip half-smile, same identity, just noticeably re-scaled/re-positioned in
frame — i.e. it settles back to the same expression but not to the same shot. I score
that a 4: real, disclosed drift, but not a different pose or a different person.

### smile (seed 1) — IDENTITY 9, MOTION 6, RETURNS_TO_NEUTRAL 5

The best of the three by a clear margin. Eye colours, hair, braid, pendant and style
are essentially pixel-stable across all four sampled frames — the full-frame thumbnails
in the contact sheet line up almost exactly, unlike `idle-breathing`'s visible push-in.
IDENTITY 9 (not a 10 only because there is still a small amount of the same
whole-clip drift the metric below picks up, just smaller than the other two clips by
eye).

MOTION: the prompt asked for "a warm smile slowly grows... over about half a second."
Comparing f1/40/80/121 by eye, the mouth-shape change is real but subtle — the plate's
own expression is already a soft closed-lip smile, so there isn't much room for the
motion to read as a dramatic "grows" beat within the sampled frames. It is fluid, with
no popping or face-shape morphing, and the background/shoulders are the most stable of
the three clips. MOTION 6: faithful and clean, but under-delivers on the named
action's amplitude.

RETURNS_TO_NEUTRAL: raw MAD 89.8 (same camera-drift floor as the other two), but the
f1-vs-f121 crops in the contact sheet are the closest visual match of the whole set —
same expression, same framing scale, same eye state. Scored 5, the best of the three.

### turn-left-and-back (seed 1) — IDENTITY 2, MOTION 3, RETURNS_TO_NEUTRAL 1 — REJECTED

Confirmed independently, not just taking the generator's word: cropping the same eye
positions at frames 40/80/121 shows the **green eye is gone by frame 80** — both eyes
read blue in my own crops (see the `green_eye` row for this clip in the contact sheet:
it shows a blue eye at f80 and f121, not green). This trips the brief's own explicit
reject rule ("worst of: eye colours on the correct sides... unchanged") on its own,
independent of anything else. IDENTITY 2, not 0, because the hair colour, pendant and
line-art style are still recognisably hers up to about frame 40.

MOTION: the prompt asked for a controlled ~60° turn, hold, and return. What actually
happens (visible in the four sampled frames) reads as a downward head-tilt plus the
mouth opening as if starting to speak, not a profile turn — by frame 80 the pose looks
like a different, unrelated shot rather than a turn-and-hold of the same one. MOTION 3.

RETURNS_TO_NEUTRAL: frame 121 has a visibly different, shorter/bob-styled haircut
silhouette, a blank/neutral-different expression (not the soft smile of frame 1), and
still the broken (all-blue) eye colours — this is not the starting pose. RETURNS_TO_NEUTRAL 1.

**turn-left-and-back is rejected for this pass.** The only other data point for this
clip, seed 101, is an empty directory (queued/running, not confirmed complete) — there
is nothing else to pick from, so this clip has no accepted result this pass.

### hair-breeze — not judged

`D:/Tools/pyrefly-video/hair-breeze/1/` exists but contains 0 frame files. Nothing was
rendered by the time of this review; not scored, not rejected, just not yet available.

## Picks

| Clip | File | Identity | Motion | Returns to neutral |
|---|---|---|---|---|
| idle-breathing | `docs/concepts/pause-until-dawn/video-preview/clips/idle-breathing/seed1.webm` | 8 | 6 | 4 |
| smile | `docs/concepts/pause-until-dawn/video-preview/clips/smile/seed1.webm` | 9 | 6 | 5 |

**Rejected:** `turn-left-and-back` seed 1 (identity 2, heterochromia lost by frame 80,
does not return to neutral; seed 101 not renderable — empty).
**Not judged (no frames rendered):** `hair-breeze`, and the six clip types with no
directory at all (`idle-blinks`, `look-up-and-back`, `turn-right-and-back`,
`determined`, `hurt`).

## Bottom line for Bailey

Of what exists to watch, `smile` is the one that best proves Wan 2.2 can hold this
exact painted Yuna (both eye colours, hair, braid, pendant, art style) through a full
5-second clip with a fluid, non-popping result. `idle-breathing` is close behind but
visibly creeps the camera in over the clip, which breaks the "locked camera" ask.
`turn-left-and-back` is a real miss — not a subtle one — on the exact thing this whole
preview exists to prove (a real head turn), and should not be shown as a positive
result without a re-render. This matches the generator's own disclosed read, confirmed
independently against the actual pixels rather than its report.
