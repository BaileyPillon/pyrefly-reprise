#!/usr/bin/env python
"""Numpy/Pillow helper for tools/gen/video-post.mjs (round 4 post-process).

Built from the round-3 ping-pong pass's scratch scripts (docs/concepts/pause-until-dawn/
video-flf/round3/pingpong-colour-match.py, pingpong-join-tests.py,
pingpong-turnaround-analysis.py) and the round-2/3 judge boxes
(tools/gen/join_report.py, docs/concepts/pause-until-dawn/video-flf/round3/judge-clip.md
SS1) -- one reusable tool instead of one-off scripts per round. video-post.mjs shells out
to this for every numpy-heavy step; it does no video encoding itself (that stays in
ffmpeg, driven by the .mjs).

What this does, in order:
  1. Loads every frame_NNNNN.png in <clipDir> plus the plate.
  2. Fits a per-frame, per-channel affine colour match (a*x+b, least squares) against
     the plate, using only the configured PINNED boxes (default: body + both
     backgrounds -- the regions judge-clip.md proved carry zero motion), and writes the
     corrected frames to <outDir>/frames-cm/.
  3. Picks the turnaround frame T: given explicitly, or auto-detected as the frame that
     ends the calmest run of `--still-window` consecutive frames (lowest rolling mean of
     per-frame MAD-against-frame-1 over the configured MOTION boxes) among windows whose
     rolling max frame-to-frame step stays under `--calm-factor` times the clip's own
     median step, restricted to frames at or past `--search-start-frac` of the clip (the
     render prompts already require all requested motion to land in the first ~60%, so
     an early trivially-still stretch before any motion starts must not be picked).
  4. Computes every number round3/pingpong.md and round3/judge-clip.md reported by hand,
     for both raw and colour-matched frames: frame-1 vs plate per box (+ VAE floor
     ratio if given), the reversal seam (T-1 -> T), the whole-clip frame-to-frame step
     series (median/max, per motion box and full-frame), and the saturation series.
  5. Builds a 1:1 contact sheet (frame 1, frame T-1, frame T, next to the plate) in the
     judge-clip-strip.py house style.
  6. Writes <outDir>/report.json and prints a compact summary to stdout for the caller.

Usage:
  python video-post.py <clipDir> <plate.png> <outDir> \
      [--turnaround N] [--vae-floor <floor.png>] \
      [--pinned-boxes body,bgLeft,bgRight] \
      [--motion-boxes face,eyes,mouth,braid,hairline] \
      [--still-window 4] [--calm-factor 3.0] [--search-start-frac 0.5]
"""
import argparse
import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Reference boxes at 1280x704 (the tool's native render resolution), pinned by the
# round-2/round-3 judge passes -- see tools/gen/join_report.py and
# docs/concepts/pause-until-dawn/video-flf/round3/judge-clip.md SS1.
REFERENCE_W, REFERENCE_H = 1280, 704
BOXES = {
    "face": (420, 20, 760, 400),
    "eyes": (460, 140, 635, 285),
    "greenEye": (468, 203, 546, 278),
    "blueEye": (548, 145, 626, 220),
    "mouth": (548, 252, 642, 308),
    "braid": (468, 278, 542, 402),
    "hairline": (436, 18, 724, 122),
    "body": (560, 400, 900, 690),
    "bgLeft": (0, 120, 330, 560),
    "bgRight": (950, 0, 1280, 500),
    "full": (0, 0, 1280, 704),
}
DEFAULT_PINNED = ["body", "bgLeft", "bgRight"]
DEFAULT_MOTION = ["face", "eyes", "mouth", "braid", "hairline"]


def load(path, size=None):
    im = Image.open(path).convert("RGB")
    if size is not None and im.size != size:
        im = im.resize(size)
    return np.asarray(im, dtype=np.float64)


def scaled_boxes(w, h):
    sx, sy = w / REFERENCE_W, h / REFERENCE_H
    return {name: (int(x0 * sx), int(y0 * sy), int(x1 * sx), int(y1 * sy)) for name, (x0, y0, x1, y1) in BOXES.items()}


def crop(arr, box):
    x0, y0, x1, y1 = box
    return arr[y0:y1, x0:x1]


def mad(a, b):
    return float(np.mean(np.abs(a - b)))


def maxabs(a, b):
    return float(np.max(np.abs(a - b)))


def p999(a, b):
    return float(np.percentile(np.abs(a - b), 99.9))


def box_stats(a, b, box):
    ca, cb = crop(a, box), crop(b, box)
    return {"mad": mad(ca, cb), "maxAbs": maxabs(ca, cb), "p999": p999(ca, cb)}


def all_box_stats(a, b, boxes):
    return {name: box_stats(a, b, box) for name, box in boxes.items()}


def saturation(a):
    mx, mn = a.max(-1), a.min(-1)
    return float(((mx - mn) / (mx + 1e-6)).mean())


def ratio(observed, floor):
    out = {}
    for name, o in observed.items():
        f = floor.get(name, {})
        out[name] = {k: (round(o[k] / f[k], 2) if f.get(k) else None) for k in o}
    return out


def pinned_pixels(arr, boxes, pinned_names):
    return np.concatenate([crop(arr, boxes[name]).reshape(-1, 3) for name in pinned_names], axis=0)


def fit_colour_match(frame, plate_pinned_px, boxes, pinned_names):
    """Per-channel affine fit on pinned pixels only; applied to the whole frame."""
    frame_pinned_px = pinned_pixels(frame, boxes, pinned_names)
    a = np.zeros(3)
    b = np.zeros(3)
    for c in range(3):
        x, y = frame_pinned_px[:, c], plate_pinned_px[:, c]
        coef, *_ = np.linalg.lstsq(np.vstack([x, np.ones_like(x)]).T, y, rcond=None)
        a[c], b[c] = coef
    corrected = np.clip(frame * a + b, 0, 255)
    return corrected, {"a": a.tolist(), "b": b.tolist()}


def load_clip(clip_dir, size_ref=None):
    names = sorted(f for f in os.listdir(clip_dir) if f.startswith("frame_") and f.endswith(".png"))
    if not names:
        raise SystemExit(f"No frame_NNNNN.png files in {clip_dir}")
    frames = [load(os.path.join(clip_dir, n), size_ref) for n in names]
    return frames, names


def motion_series(frames, boxes, motion_names):
    """Per-frame mean MAD across motion boxes: vs frame 1, and vs the previous frame."""
    f1 = frames[0]
    vs_f1 = [float(np.mean([mad(crop(f, boxes[b]), crop(f1, boxes[b])) for b in motion_names])) for f in frames]
    step = [0.0] + [
        float(np.mean([mad(crop(frames[i], boxes[b]), crop(frames[i - 1], boxes[b])) for b in motion_names]))
        for i in range(1, len(frames))
    ]
    return vs_f1, step


def pick_turnaround(vs_f1, step, still_window, calm_factor, search_start_frac, lookahead_factor=1.1):
    """Auto-pick T (1-indexed): the LATEST `still_window`-frame run that is (a) calm --
    its own frame-to-frame step never exceeds `calm_factor` times the clip's median
    step -- and (b) not immediately followed by a rise back above
    `lookahead_factor` times its own MAD-vs-frame-1, searched from
    `search_start_frac` of the clip onward (see module docstring SS3).

    Both conditions matter, and each rules out a failure the other alone would not
    catch (checked against docs/concepts/pause-until-dawn/video-flf/round3/pingpong.md's
    hand-picked T=81 for both clips):
      - Condition (a) alone would let a run right before a render's own colour/exposure
        blow-out (round-3 judge-clip.md's f93->f94 pop) pass, since the pop shows up as
        a step spike only ONE frame later, outside a 4-frame window ending just before it.
      - Condition (b) (the lookahead) catches exactly that: it rejects any window
        immediately followed by a sustained rise, whether that rise is the render's own
        drift (idle-blinks' f83+ second event / f94 pop) or a motion event that has not
        actually started yet (idle-breathing's calm-looking f41-62 plateau, which sits
        right before the real f63-77 breathing/mouth event -- lower MAD-vs-frame-1 than
        the true post-motion tail purely because nothing has drifted yet, not because
        motion is over). Preferring the LATEST run that survives both then reads as
        "after the last motion" without needing to locate a single last spike.
    """
    n = len(vs_f1)
    nonzero_steps = [s for s in step[1:] if s > 0]
    median_step = float(np.median(nonzero_steps)) if nonzero_steps else 0.0
    threshold = median_step * calm_factor
    start0 = max(1, int(round(n * search_start_frac)))  # 0-indexed frame position
    for i0 in range(n - still_window, start0 - 2, -1):  # 0-indexed window start, latest first
        t_candidate = i0 + still_window
        # Internal window steps, PLUS the one step leading OUT of the window (T -> T+1
        # if it exists): a still window is not "after the last motion" if the very next
        # frame jumps away from it, which is exactly the shape of round-3's f93->f94
        # blow-out (a single-frame pop that a 4-frame internal-only check would miss
        # because the pop lands one frame past the window's own last internal step).
        window_steps = list(step[i0 + 1 : t_candidate])
        if t_candidate < n:
            window_steps.append(step[t_candidate])
        if window_steps and max(window_steps) > threshold:
            continue
        score = float(np.mean(vs_f1[i0:t_candidate]))
        lookahead = vs_f1[t_candidate : t_candidate + still_window]
        if lookahead and float(np.mean(lookahead)) > score * lookahead_factor:
            continue
        t = i0 + still_window  # 1-indexed last frame of the window
        return t, {
            "method": "auto",
            "medianStep": median_step,
            "threshold": threshold,
            "windowStart": i0 + 1,
            "windowEnd": t,
            "windowMeanVsF1": score,
        }
    return n, {"method": "fallback-last-frame", "reason": "no window passed both the calm and lookahead checks", "medianStep": median_step, "threshold": threshold}


def build_contact_sheet(out_path, plate_path, frame_paths_labeled, boxes_to_show):
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
    except OSError:
        font = ImageFont.load_default()

    def im(path):
        return Image.open(path).convert("RGB")

    def row(items, box, title):
        crops = [(label, im(path).crop(box)) for label, path in items]
        w, h, pad = box[2] - box[0], box[3] - box[1], 4
        strip = Image.new("RGB", (len(crops) * (w + pad) + pad, h + 44), (20, 20, 24))
        d = ImageDraw.Draw(strip)
        d.text((pad, 2), title, fill=(255, 230, 120), font=font)
        for i, (label, c) in enumerate(crops):
            x = pad + i * (w + pad)
            strip.paste(c, (x, 40))
            d.text((x + 2, 22), label, fill=(230, 230, 230), font=font)
        return strip

    items = [("plate", plate_path)] + frame_paths_labeled
    rows = [row(items, boxes_to_show[name], f"1:1 {name} {boxes_to_show[name]}: plate + {', '.join(l for l, _ in frame_paths_labeled)}") for name in ("face", "eyes", "mouth")]
    width = max(r.width for r in rows)
    height = sum(r.height for r in rows) + 6 * len(rows)
    sheet = Image.new("RGB", (width, height), (10, 10, 12))
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height + 6
    sheet.save(out_path, quality=88)
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clip_dir")
    ap.add_argument("plate")
    ap.add_argument("out_dir")
    ap.add_argument("--turnaround", type=int, default=0, help="0 = auto-detect")
    ap.add_argument("--vae-floor", default="")
    ap.add_argument("--pinned-boxes", default=",".join(DEFAULT_PINNED))
    ap.add_argument("--motion-boxes", default=",".join(DEFAULT_MOTION))
    ap.add_argument("--still-window", type=int, default=4)
    ap.add_argument("--calm-factor", type=float, default=3.0)
    ap.add_argument("--search-start-frac", type=float, default=0.5)
    ap.add_argument("--lookahead-factor", type=float, default=1.1)
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    cm_dir = os.path.join(args.out_dir, "frames-cm")
    os.makedirs(cm_dir, exist_ok=True)

    plate = load(args.plate)
    h, w = plate.shape[0], plate.shape[1]
    boxes = scaled_boxes(w, h)
    pinned_names = [b.strip() for b in args.pinned_boxes.split(",") if b.strip()]
    motion_names = [b.strip() for b in args.motion_boxes.split(",") if b.strip()]

    frames, names = load_clip(args.clip_dir, size_ref=(w, h))
    n = len(frames)
    plate_pinned_px = pinned_pixels(plate, boxes, pinned_names)

    corrected = []
    fit_params = []
    for i, f in enumerate(frames):
        corr, params = fit_colour_match(f, plate_pinned_px, boxes, pinned_names)
        corrected.append(corr)
        fit_params.append(params)
        Image.fromarray(corr.astype(np.uint8), "RGB").save(os.path.join(cm_dir, f"frame_{i + 1:05d}.png"))

    vs_f1_raw, step_raw = motion_series(frames, boxes, motion_names)
    vs_f1_cm, step_cm = motion_series(corrected, boxes, motion_names)

    if args.turnaround:
        t = args.turnaround
        if not (2 <= t <= n):
            raise SystemExit(f"--turnaround {t} out of range for a {n}-frame clip")
        turnaround_info = {"method": "manual"}
    else:
        # Detected off the RAW frames, not the colour-matched ones: colour-match is a
        # per-frame tone fit against the plate, and on a clip with the tone drift
        # judge-clip.md documented, that fit can itself trend across frames (each
        # frame's fit chases a slightly different plate-relative grade), which smooths
        # away exactly the calm-then-rising-again shape this function looks for. The
        # raw frames carry the model's own, unmodified motion.
        t, turnaround_info = pick_turnaround(
            vs_f1_raw, step_raw, args.still_window, args.calm_factor, args.search_start_frac, lookahead_factor=args.lookahead_factor
        )

    floor_stats = None
    frame1_x_floor = frameT_x_floor = None
    if args.vae_floor:
        floor_img = load(args.vae_floor, (w, h))
        floor_stats = all_box_stats(floor_img, plate, boxes)

    frame1_raw = all_box_stats(frames[0], plate, boxes)
    frame1_cm = all_box_stats(corrected[0], plate, boxes)
    frameT_raw = all_box_stats(frames[t - 1], plate, boxes)
    frameT_cm = all_box_stats(corrected[t - 1], plate, boxes)
    if floor_stats:
        frame1_x_floor = {"raw": ratio(frame1_raw, floor_stats), "cm": ratio(frame1_cm, floor_stats)}
        frameT_x_floor = {"raw": ratio(frameT_raw, floor_stats), "cm": ratio(frameT_cm, floor_stats)}

    reversal_seam = {
        "raw": {name: box_stats(frames[t - 1], frames[t - 2], box) for name, box in boxes.items()},
        "cm": {name: box_stats(corrected[t - 1], corrected[t - 2], box) for name, box in boxes.items()},
    }

    def step_summary(step_series):
        vals = [s for s in step_series[1:]]
        return {"median": float(np.median(vals)), "max": float(np.max(vals))}

    step_series_full = {
        "raw": {"full": [box_stats(frames[i], frames[i - 1], boxes["full"])["mad"] for i in range(1, n)]},
        "cm": {"full": [box_stats(corrected[i], corrected[i - 1], boxes["full"])["mad"] for i in range(1, n)]},
    }
    step_summary_report = {
        "motion": {"raw": step_summary(step_raw), "cm": step_summary(step_cm)},
        "full": {
            "raw": {"median": float(np.median(step_series_full["raw"]["full"])), "max": float(np.max(step_series_full["raw"]["full"]))},
            "cm": {"median": float(np.median(step_series_full["cm"]["full"])), "max": float(np.max(step_series_full["cm"]["full"]))},
        },
    }

    saturation_raw = [saturation(f) for f in frames]
    saturation_cm = [saturation(f) for f in corrected]

    sheet_path = os.path.join(args.out_dir, "contact-sheet.jpg")
    build_contact_sheet(
        sheet_path,
        args.plate,
        [("f1", os.path.join(cm_dir, "frame_00001.png")), (f"f{t - 1}", os.path.join(cm_dir, f"frame_{t - 1:05d}.png")), (f"f{t}", os.path.join(cm_dir, f"frame_{t:05d}.png"))],
        boxes,
    )

    report = {
        "clipDir": args.clip_dir,
        "plate": args.plate,
        "outDir": args.out_dir,
        "frameCount": n,
        "pinnedBoxes": pinned_names,
        "motionBoxes": motion_names,
        "turnaround": t,
        "turnaroundInfo": turnaround_info,
        "colourMatch": {"params": fit_params},
        "frame1VsPlate": {"raw": frame1_raw, "cm": frame1_cm},
        "frameTVsPlate": {"raw": frameT_raw, "cm": frameT_cm},
        "vaeFloor": floor_stats,
        "frame1XFloor": frame1_x_floor,
        "frameTXFloor": frameT_x_floor,
        "reversalSeam": reversal_seam,
        "stepSeries": step_summary_report,
        "saturation": {
            "raw": {"f1": saturation_raw[0], "min": min(saturation_raw), "max": max(saturation_raw)},
            "cm": {"f1": saturation_cm[0], "min": min(saturation_cm), "max": max(saturation_cm)},
        },
        "framesCmDir": cm_dir,
        "contactSheet": sheet_path,
    }

    report_path = os.path.join(args.out_dir, "report.json")
    with open(report_path, "w") as fh:
        json.dump(report, fh, indent=2)

    print(json.dumps({"reportPath": report_path, "turnaround": t, "frameCount": n, "framesCmDir": cm_dir, "contactSheet": sheet_path}))


if __name__ == "__main__":
    main()
