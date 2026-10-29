"""blend_preview.py <config name> <rig dir> <from pose> <to pose> [--frames 24] [--out file.mp4] [--ease quad|lin] [--crop x0,y0,x1,y1] [--painting] : an OFFLINE preview of one move between two keys, no game and no GPU.

The rig moves the way the engine moves it (`RigKeys.RigTransition`: every bone channel from the old key to the new on a quadInOut curve; the part state of the key you are moving INTO takes over at progress 0.5, or
cross-fades over the key's `fadeMs`), drawn by the lane kit's own numpy rasteriser (xl.py: nearest texel, no lighting), beside the painting set's cross-dissolve of the two paintings (`--painting`). One panel each, 60 fps,
`--frames` frames (the key's `ms` at 60 Hz is the real length: 6 frames = 100 ms). Good enough to see a piece that pops, a limb that tears or a seam that opens; the real game (the recorder) is the verdict.
"""
import json
import math
import os
import pathlib
import subprocess
import sys

a = sys.argv[1:]
name, rigdir, A, B = a[0], a[1], a[2], a[3]
opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d  # noqa: E731
cfg = json.load(open(f"D:/pyrefly-rig-rikkudk/tools/rig/subjects/{name}.json", encoding="utf8"))
os.environ["XID"] = cfg["subject"]
os.environ["XWORK"] = name
os.environ.setdefault("XART", os.environ.get("PYREFLY_ART_DIR", "D:/pyrefly-art-r61"))
sys.path.insert(0, "D:/pyrefly-rig-rikkudk/tools/rig/lane/expressive")
from xl import *  # noqa: E402,F401,F403
from rig_v2 import state_of  # noqa: E402

N = int(opt("--frames", 24))
ease = (lambda t: 2 * t * t if t < 0.5 else 1 - 2 * (1 - t) ** 2) if opt("--ease", "quad") == "quad" else (lambda t: t)
W, H = rig_size()
PAD = 500
rig, T, model = load_model(rigdir)
keys = rig["keys"]


def chan(k, b, c, d):
    return keys[k].get("bones", {}).get(b, {}).get(c, d) if k != "idle" else d


def params(t):
    e = ease(t)
    rot, off, scl = {}, {}, {}
    for b in [x["name"] for x in rig["bones"]]:
        r0, r1 = chan(A, b, "rot", 0.0), chan(B, b, "rot", 0.0)
        rot[b] = r0 + (r1 - r0) * e
        dx = chan(A, b, "dx", 0.0) + (chan(B, b, "dx", 0.0) - chan(A, b, "dx", 0.0)) * e
        dy = chan(A, b, "dy", 0.0) + (chan(B, b, "dy", 0.0) - chan(A, b, "dy", 0.0)) * e
        sx = chan(A, b, "sx", 1.0) + (chan(B, b, "sx", 1.0) - chan(A, b, "sx", 1.0)) * e
        sy = chan(A, b, "sy", chan(A, b, "sx", 1.0)) + (chan(B, b, "sy", chan(B, b, "sx", 1.0)) - chan(A, b, "sy", chan(A, b, "sx", 1.0))) * e
        if dx or dy:
            off[b] = (dx, dy)
        if abs(sx - 1) > 1e-6 or abs(sy - 1) > 1e-6:
            scl[b] = (sx, sy)
    return rot, off, scl


def state(t):
    src = keys[B] if t >= 0.5 else keys[A]
    return state_of(rig["parts"], src.get("parts") if (B if t >= 0.5 else A) != "idle" else None)


# framing: the union box of both paintings' figures in the idle frame
pa = painting_in_master(A, pad=PAD)
pb = painting_in_master(B, pad=PAD)
box = None
for im in (pa, pb):
    bb = im.split()[3].point(lambda v: 255 if v > 40 else 0).getbbox()
    box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
if opt("--crop"):
    c = [int(v) + PAD for v in opt("--crop").split(",")]
    box = tuple(c)
box = (max(0, box[0] - 30), max(0, box[1] - 30), min(W + 2 * PAD, box[2] + 30), min(H + 2 * PAD, box[3] + 30))
panels = []
for i in range(N + 1):
    t = i / N
    rot, off, scl = params(t)
    model.set_state(state(t))
    model.pose(rot=rot, root=(0.0, 0.0, 0.0), off=off, scl=scl)
    im = render_pose(model, W, H, pad=PAD)
    SC = float(opt("--scale", 0.3))
    sz = (int((box[2] - box[0]) * SC), int((box[3] - box[1]) * SC))
    row = [over(BG, im.crop(box)).resize(sz, Image.LANCZOS)]
    if "--painting" in a:
        mix = Image.blend(Image.alpha_composite(Image.new("RGBA", pa.size, BG + (255,)), pa), Image.alpha_composite(Image.new("RGBA", pb.size, BG + (255,)), pb), t)
        row.insert(0, mix.convert("RGB").crop(box).resize(sz, Image.LANCZOS))
    panels.append(row)
out = pathlib.Path(opt("--out", f"D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/look/blend-{name}-{A}-{B}.mp4"))
out.parent.mkdir(parents=True, exist_ok=True)
tmp = out.with_suffix("")
tmp.mkdir(exist_ok=True)
for i, row in enumerate(panels):
    w = sum(p.width for p in row) + 6 * (len(row) - 1)
    img = Image.new("RGB", (w + (w % 2), row[0].height + (row[0].height % 2)), (20, 20, 24))
    x = 0
    for p in row:
        img.paste(p, (x, 0))
        x += p.width + 6
    img.save(tmp / f"b{i:03d}.png")
sys.path.insert(0, "D:/pyrefly-rig-rikkudk/tools/rig/lane")
import lane_sheets as L  # noqa: E402

fps = opt("--fps", "12")
subprocess.run([L.FFMPEG, "-y", "-loglevel", "error", "-framerate", fps, "-i", str(tmp / "b%03d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", str(out)], check=True)
# a contact sheet: a few frames across, the painting set's dissolve above the rig's move
ns = int(opt("--strip", 6))
strip_idx = sorted(set(round(k * N / (ns - 1)) for k in range(ns)))
cols = []
for i in strip_idx:
    row = panels[i]
    c = Image.new("RGB", (row[0].width, sum(p.height for p in row) + 4 * (len(row) - 1)), (20, 20, 24))
    y = 0
    for p in row:
        c.paste(p, (0, y))
        y += p.height + 4
    ImageDraw.Draw(c).text((6, 4), f"{A} to {B}  t={i / N:.2f}", fill=(255, 255, 0))
    cols.append(c)
strip = Image.new("RGB", (sum(c.width for c in cols) + 4 * (len(cols) - 1), cols[0].height), (20, 20, 24))
x = 0
for c in cols:
    strip.paste(c, (x, 0))
    x += c.width + 4
strip.save(out.with_suffix(".strip.png"))
print("wrote", out, strip.size)
