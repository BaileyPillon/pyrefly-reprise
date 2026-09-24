"""Living portrait v6 pilot (both): the three 8 s option clips (A measured, B livelier, C quiet).

Same framing as shots/v4/living-portrait-v4.mp4 and shots/v51/clip.mp4: a 720 x 1200 page, the
832 x 1216 canvas drawn at 512 x 748 from (104, 228) on the page's #080808, legend hidden. The
runtime's post pass is reproduced (POST_FRAG: focus falloff and the bottom-right grade; grain off).
The head's idle sway (and its follow of the input) is a smooth warp of the whole head above the
collar, identical in the three clips; the pilot has the frontal painting only, so the head does not
turn. H.264 yuv420p, faststart, 60 fps.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY make_clips.py [A B C]     # writes ../clip-A-measured.mp4 ... and WORK/log-<name>.json
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

import common as C
import drivers
import rig6

PAGE_W, PAGE_H = 720, 1200
CAN_X, CAN_Y, CAN_W, CAN_H = 104, 228, 512, 748
BG = 8 / 255.0
NAMES = {"A": "clip-A-measured.mp4", "B": "clip-B-livelier.mp4", "C": "clip-C-quiet.mp4"}
FFMPEG = "D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe"

_yy, _xx = np.mgrid[0:C.H, 0:C.W].astype(np.float32)
_head_mask = (1 - rig6.smoothstep(560, 820, _yy)).astype(np.float32)  # the head above the collar


def head_warp(img, hx, hy, roll_deg, pivot=(416.0, 760.0)):
    th = np.deg2rad(roll_deg)
    cx, cy = pivot
    X, Y = _xx - cx, _yy - cy
    rx = np.cos(th) * X - np.sin(th) * Y - X
    ry = np.sin(th) * X + np.cos(th) * Y - Y
    mx = _xx - _head_mask * (hx + rx)
    my = _yy - _head_mask * (hy + ry)
    return C.remap(img, mx, my)


def post(rgb):
    """POST_FRAG on the canvas (vUV: y = 0 at the bottom), grain off."""
    h, w = rgb.shape[:2]
    u = (_xx[:h, :w] + 0.5) / w
    v = 1 - (_yy[:h, :w] + 0.5) / h
    hb = C.rig()["headBox"]
    c = np.array([hb["x"] + hb["w"] / 2, hb["y"] + hb["h"] / 2])
    half = np.array([hb["w"] / 2, hb["h"] / 2])
    d = np.sqrt(((u - c[0]) / half[0]) ** 2 + ((v - c[1]) / half[1]) ** 2)
    focus = np.clip(1 - rig6.smoothstep(0.8, 1.8, d), 0, 1)[..., None]
    r = 1 - focus  # blur radius in px (at most 1)
    blurred = 0.25 * (C.remap(rgb, _xx + r[..., 0], _yy) + C.remap(rgb, _xx - r[..., 0], _yy) +
                      C.remap(rgb, _xx, _yy + r[..., 0]) + C.remap(rgb, _xx, _yy - r[..., 0]))
    col = blurred * (1 - focus) + rgb * focus
    dd = np.sqrt((u - 0.35) ** 2 + ((v - 0.7) * 0.8) ** 2)
    vig = 0.22 * rig6.smoothstep(0.55, 1.25, dd)
    return col * (1 - vig)[..., None]


def params(R, fr):
    port = R.vis_to_port(fr["lid"])
    return {"gazeX": fr["gazeX"], "gazeY": fr["gazeY"], "lidR": port, "lidL": port, "droop": fr["droop"],
            "open": fr["open"], "smile": fr["smile"], "press": fr["press"], "browRaise": fr["browRaise"],
            "browDraw": fr["browDraw"]}


def page(R, fr):
    """(720 x 1200 uint8 page, the canvas-resolution frame after head motion and post)."""
    img = R.render(params(R, fr))
    img = head_warp(img, fr["headX"], fr["headY"], fr["roll"])
    rgb = C.unpremul_on(img, (BG, BG, BG))
    rgb = post(rgb.astype(np.float32))
    small = cv2.resize(rgb, (CAN_W, CAN_H), interpolation=cv2.INTER_AREA)
    out = np.full((PAGE_H, PAGE_W, 3), BG, np.float32)
    out[CAN_Y:CAN_Y + CAN_H, CAN_X:CAN_X + CAN_W] = small
    return C.to_u8(out), rgb


def encode(frames_iter, dst, fps=drivers.FPS):
    cmd = [FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{PAGE_W}x{PAGE_H}", "-r", str(fps),
           "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for fr in frames_iter:
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    if p.wait() != 0:
        raise SystemExit("ffmpeg failed")


def main(names):
    R = rig6.Rig()
    for name in names:
        tl = drivers.timeline(name)
        (C.WORK / f"log-{name}.json").write_text(json.dumps(tl))
        dst = C.OUTDIR / NAMES[name]

        def gen():
            for i, fr in enumerate(tl):
                pg, _ = page(R, fr)
                if i % 60 == 0:
                    print(name, i, flush=True)
                yield pg
        encode(gen(), dst)
        print(dst, os.path.getsize(dst))


if __name__ == "__main__":
    main(sys.argv[1:] or ["A", "B", "C"])
