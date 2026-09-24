"""Living portrait v6 pilot (both): the three 8 s option clips (A measured, B livelier, C quiet).

Same framing as shots/v4/living-portrait-v4.mp4 and shots/v51/clip.mp4: a 720 x 1200 page, the
832 x 1216 canvas drawn at 512 x 748 from (104, 228) on the page's #080808, legend hidden. The
runtime's post pass is reproduced (POST_FRAG: focus falloff and the bottom-right grade; grain off).
The head's idle sway (and its follow of the input) is a smooth warp of the whole head above the
collar, identical in the three clips; the pilot has the frontal painting only, so the head does not
turn. H.264 yuv420p, faststart, 60 fps.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY make_clips.py [A B C] [--measure-only]     # ../clip-A2-measured.mp4 ..., WORK/log-<name>.json, WORK/gray-<name>.npz
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
NAMES = {"A": "clip-A2-measured.mp4", "B": "clip-B2-livelier.mp4", "C": "clip-C2-quiet.mp4"}  # part 1's are at 9927c4b5
FFMPEG = "D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe"

_yy, _xx = np.mgrid[0:C.H, 0:C.W].astype(np.float32)
# part 2: the head moves as one rigid piece down to the chin (y ~705) and eases into the body over the neck.
# Part 1 eased it out from y 560, through the mouth (the mouth moved 0.7x the brows), so the stand-in sway
# stretched the lower face every frame; the spec's regions are measured on a rigid head (its nose is the
# rigid baseline), and a real head does not bend at the lips.
NECK = (705.0, 830.0)
_head_mask = (1 - rig6.smoothstep(NECK[0], NECK[1], _yy)).astype(np.float32)
# the chest (breath and its lagged sway) moves below the collar and eases out towards the canvas's
# bottom edge, which stays put (the frame cuts the body there)
_chest_mask = (rig6.smoothstep(NECK[0], NECK[1], _yy) * (1 - rig6.smoothstep(1000, 1216, _yy))).astype(np.float32)


def head_warp(img, hx, hy, roll_deg, cx=0.0, cy=0.0, pivot=(416.0, 760.0)):
    th = np.deg2rad(roll_deg)
    px, py = pivot
    X, Y = _xx - px, _yy - py
    rx = np.cos(th) * X - np.sin(th) * Y - X
    ry = np.sin(th) * X + np.cos(th) * Y - Y
    mx = _xx - _head_mask * (hx + rx) - _chest_mask * cx
    my = _yy - _head_mask * (hy + ry) - _chest_mask * cy
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


def page(R, fr, with_rig=False):
    """(720 x 1200 uint8 page, the canvas-resolution frame after head motion and post[, the rig's own frame])."""
    rig = R.render(params(R, fr))
    img = head_warp(rig, fr["headX"], fr["headY"], fr["roll"], fr.get("chestX", 0.0), fr.get("chestY", 0.0))
    rgb = C.unpremul_on(img, (BG, BG, BG))
    rgb = post(rgb.astype(np.float32))
    small = cv2.resize(rgb, (CAN_W, CAN_H), interpolation=cv2.INTER_AREA)
    out = np.full((PAGE_H, PAGE_W, 3), BG, np.float32)
    out[CAN_Y:CAN_Y + CAN_H, CAN_X:CAN_X + CAN_W] = small
    if with_rig:
        return C.to_u8(out), rgb, rig, img
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


# for pilot_still.py: the page's grey face crop per frame, and each part's frame change on the rig itself
RIG_BOXES = {"mouth": (400, 595, 590, 670), "brow": (262, 318, 390, 352), "lids": (255, 350, 700, 470)}
CHEST = (300, 880, 540, 1000)  # below the collar, after the body motion


def _grey(rgb_u8):
    return (rgb_u8[..., 0] * 0.299 + rgb_u8[..., 1] * 0.587 + rgb_u8[..., 2] * 0.114).astype(np.float32)


def render_clip(name, R=None, dst=None):
    import pilot_still as PS
    R = R or rig6.Rig()
    tl = drivers.timeline(name)
    (C.WORK / f"log-{name}.json").write_text(json.dumps(tl))
    cx0, cy0, cx1, cy1 = PS.page_box(PS.CROP)
    grey, steps, prev = [], {k: [] for k in (*RIG_BOXES, "chest")}, None

    def gen():
        nonlocal prev
        for i, fr in enumerate(tl):
            pg, _, rig, moved = page(R, fr, with_rig=True)
            grey.append(np.clip(_grey(pg[cy0:cy1, cx0:cx1]) + 0.5, 0, 255).astype(np.uint8))
            cur = {k: C.lum(rig[b[1]:b[3], b[0]:b[2], :3]) * 255 for k, b in RIG_BOXES.items()}
            cur["chest"] = C.lum(moved[CHEST[1]:CHEST[3], CHEST[0]:CHEST[2], :3]) * 255
            if prev is not None:
                for k in cur:
                    steps[k].append(float(np.abs(cur[k] - prev[k]).mean()))
            prev = cur
            if i % 60 == 0:
                print(name, i, flush=True)
            yield pg
    if dst is None:
        for _ in gen():
            pass
    else:
        encode(gen(), dst)
        print(dst, os.path.getsize(dst))
    np.savez_compressed(C.WORK / f"gray-{name}.npz", page=np.stack(grey), **{f"rigs_{k}": np.array(v) for k, v in steps.items()})


def main(names, encode_clip=True):
    from concurrent.futures import ProcessPoolExecutor
    with ProcessPoolExecutor(len(names)) as ex:
        list(ex.map(_one, names, [encode_clip] * len(names)))


def _one(name, encode_clip):
    render_clip(name, dst=C.OUTDIR / NAMES[name] if encode_clip else None)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args or ["A", "B", "C"], encode_clip="--measure-only" not in sys.argv)
