"""keydiff.py <config name> [rig dir] [--out sheet.png] : every key of a party rig drawn by the offline rasteriser and compared pixel for pixel with its painting (in the idle's frame): the mean colour difference over the
painting's opaque pixels and the share of pixels that differ by more than 40 (a wrong draw order, a piece the partition lost, a seam), and a sheet with the painting, the key and the difference (x4) for the worst poses.
No game, no GPU (the lane kit's numpy rasteriser: nearest texel, no lighting)."""
import json
import os
import pathlib
import sys

a = sys.argv[1:]
name = a[0]
rigdir = a[1] if len(a) > 1 and not a[1].startswith("--") else f"D:/pyrefly-art-rigs/{name}"
out = a[a.index("--out") + 1] if "--out" in a else f"D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/look/keydiff-{name}.png"
cfg = json.load(open(f"D:/pyrefly-rig-rikkudk/tools/rig/subjects/{name}.json", encoding="utf8"))
os.environ["XID"] = cfg["subject"]
os.environ["XWORK"] = name
os.environ.setdefault("XART", os.environ.get("PYREFLY_ART_DIR", "D:/pyrefly-art-r61"))
sys.path.insert(0, "D:/pyrefly-rig-rikkudk/tools/rig/lane/expressive")
import numpy as np  # noqa: E402
from xl import *  # noqa: E402,F401,F403

W, H = rig_size()
PAD = 500
rig, T, model = load_model(rigdir)
rows = []
for pose in [p for p in rig["keys"] if p != "idle"]:
    pm = painting_in_master(pose, pad=PAD)
    pose_key(model, rig, rig["keys"][pose])
    rm = render_pose(model, W, H, pad=PAD)
    pa = np.asarray(over(BG, pm)).astype(np.int32)
    ra = np.asarray(over(BG, rm)).astype(np.int32)
    op = np.asarray(pm.split()[3]) > 127
    d = np.abs(pa - ra).sum(-1)
    mean = float(d[op].mean()) / 3 if op.any() else 0.0
    bad = float((d[op] > 120).mean()) if op.any() else 0.0
    rows.append((pose, mean, bad, pm, rm, d))
    print(f"{pose:20s} mean diff {mean:5.1f} (of 255), share over 40 per channel {bad * 100:5.2f} percent")
rows.sort(key=lambda r: -r[2])
sel = rows[:5]
tiles = []
for pose, mean, bad, pm, rm, d in sel:
    bb = pm.split()[3].point(lambda v: 255 if v > 40 else 0).getbbox() or (0, 0, 10, 10)
    box = (max(0, bb[0] - 20), max(0, bb[1] - 20), bb[2] + 20, bb[3] + 20)
    sc = 520 / max(box[3] - box[1], 1)
    tw, th = int((box[2] - box[0]) * sc), 520
    dd = Image.fromarray(np.clip(d * 1.2, 0, 255).astype(np.uint8), "L").crop(box).resize((tw, th)).convert("RGB")
    t = Image.new("RGB", (tw * 3 + 8, th), (20, 20, 24))
    t.paste(over(BG, pm).crop(box).resize((tw, th)), (0, 0))
    t.paste(over(BG, rm).crop(box).resize((tw, th)), (tw + 4, 0))
    t.paste(dd, (2 * tw + 8, 0))
    ImageDraw.Draw(t).text((6, 4), f"{pose}  mean {mean:.1f}  over {bad * 100:.2f}%", fill=(255, 255, 0))
    tiles.append(t)
Wt = max(t.width for t in tiles)
sheet = Image.new("RGB", (Wt, sum(t.height for t in tiles) + 4 * (len(tiles) - 1)), (20, 20, 24))
y = 0
for t in tiles:
    sheet.paste(t, (0, y))
    y += t.height + 4
pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
sheet.save(out)
print("wrote", out)
