"""sequence_preview.py <config name> <rig dir> <sequence> [--out file.mp4] [--scale 0.25] [--procs 8] : an OFFLINE preview of a whole action (idle, attack, cast, item, hurt, ko, victory) at 60 fps, no game, no GPU.

The rig side replays what the engine does with a rig (`engine/rig/RigKeys.ts`): every bone channel moves from where it is to the next key on a quadInOut curve with the velocity it carries (the same formula), over the key's `ms`
(its own `ms` in rig.json, else 120); the part state of the key being entered takes over at progress 0.5, cross-faded over the key's `fadeMs` when it has one (0 is a cut); the idle's sway (`motion.idle`) is added on top.
The painting-set side is the same timeline with the two paintings dissolved over the same move time (the game's painting blend, 110-200 ms; here the rig's `ms` so the two panels move on one clock).
It does NOT have the presenter's lunge, squash, recoil, hit-stop or camera: those are the engine's and act on the carrier of both. Drawn by the lane kit's numpy rasteriser (nearest texel, no lighting). The real recorder is the verdict;
this is what can be made while the recording slot is taken.
Sequences: idle, attack, cast, item, hurt, ko, victory, defend (steps of `(pose, hold ms)`; the move into each key takes the key's `ms`).
"""
import json
import math
import multiprocessing as mp
import os
import pathlib
import subprocess
import sys

a = sys.argv[1:]
name, rigdir, seq = a[0], a[1], a[2]
opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d  # noqa: E731
cfg = json.load(open(f"D:/pyrefly-rig-rikkudk/tools/rig/subjects/{name}.json", encoding="utf8"))
os.environ["XID"] = cfg["subject"]
os.environ["XWORK"] = name
os.environ.setdefault("XART", os.environ.get("PYREFLY_ART_DIR", "D:/pyrefly-art-r61"))
sys.path.insert(0, "D:/pyrefly-rig-rikkudk/tools/rig/lane/expressive")
sys.path.insert(0, "D:/pyrefly-rig-rikkudk/tools/rig/lane")
import numpy as np  # noqa: E402
from xl import *  # noqa: E402,F401,F403
from rig_v2 import state_of  # noqa: E402
from PIL import ImageFont  # noqa: E402

SEQ = {
    "idle": [("idle", 3000)],
    "attack": [("idle", 500), ("ready", 450), ("attack", 160), ("follow", 260), ("idle", 700)],
    "cast": [("idle", 500), ("ready", 450), ("cast", 700), ("idle", 700)],
    "item": [("idle", 500), ("ready", 450), ("item", 600), ("idle", 700)],
    "hurt": [("idle", 600), ("hurt", 260), ("idle", 900)],
    "ko": [("idle", 500), ("hurt", 200), ("ko", 1200)],
    "victory": [("idle", 500), ("victory", 1400)],
    "defend": [("idle", 500), ("defend", 900), ("idle", 600)],
}[seq]
FPS = 60.0
SC = float(opt("--scale", 0.25))
PAD = 500
W, H = rig_size()
rig, T, model = load_model(rigdir)
keys = rig["keys"]
names = [b["name"] for b in rig["bones"]]
CH = ("rot", "dx", "dy", "sx", "sy")
DEF = {"rot": 0.0, "dx": 0.0, "dy": 0.0, "sx": 1.0, "sy": 1.0}


def chan_of(pose):
    v = []
    for b in names:
        k = keys[pose].get("bones", {}).get(b, {}) if pose != "idle" else {}
        sx = k.get("sx", 1.0)
        v += [k.get("rot", 0.0), k.get("dx", 0.0), k.get("dy", 0.0), sx, k.get("sy", sx)]
    return np.array(v, np.float64)


def ease(u):
    return 2 * u * u if u < 0.5 else 1 - 2 * (1 - u) ** 2


def slope(u):
    return 4 * u if u < 0.5 else 4 * (1 - u)


# ------------------------------------------------------------------ the timeline: for every frame, (channels, state A pose, state B pose, fade weight of B)
MOVES = []


def timeline():
    frames = []
    cur = chan_of("idle")
    vel = np.zeros_like(cur)
    prev_pose = "idle"
    t_ms = 0.0
    dt = 1000.0 / FPS
    first = True
    for pose, hold in SEQ:
        if first:
            first = False
            n_hold = int(hold / dt)
            for _ in range(n_hold):
                frames.append((cur.copy(), "idle", "idle", 0.0, t_ms))
                t_ms += dt
            continue
        ms = keys[pose].get("ms", 120)
        fade = keys[pose].get("fadeMs", 110)
        to = chan_of(pose)
        frm, v0 = cur.copy(), vel.copy()
        d = ms / 1000.0
        n_move = max(1, int(round(ms / dt)))
        MOVES.append({"pose": pose, "from": prev_pose, "start": len(frames), "end": len(frames) + n_move, "ms": ms, "fadeMs": fade})
        for i in range(1, n_move + 1):
            u = min(1.0, i / n_move)
            e = ease(u)
            w = u * (1 - u) * (1 - u)
            cur = frm + (to - frm) * e + d * v0 * w
            dw = (1 - u) * (1 - u) - 2 * u * (1 - u)
            vel = (to - frm) * (slope(u) / d) + v0 * dw if u < 1 else np.zeros_like(cur)
            # part state: the key entered takes over at 0.5, cross-faded over `fade` ms centred there
            if fade <= 0:
                wB = 1.0 if u >= 0.5 else 0.0
            else:
                start = min(0.5, max(0.05, 0.5 - fade / (2 * ms)))
                x = (u - start) / max(1e-6, 1 - 2 * start) if start < 0.5 else (1.0 if u >= 0.5 else 0.0)
                x = min(1.0, max(0.0, x))
                wB = x * x * (3 - 2 * x)
            frames.append((cur.copy(), prev_pose, pose, wB, t_ms))
            t_ms += dt
        cur = to.copy()
        vel = np.zeros_like(cur)
        for _ in range(int(hold / dt)):
            frames.append((cur.copy(), pose, pose, 0.0, t_ms))
            t_ms += dt
        prev_pose = pose
    return frames


IDLE = (rig.get("motion") or {}).get("idle") or {}


def sway(t_ms):
    """The idle's sinusoids (motion.idle): degrees of rotation per bone at the base period."""
    out = np.zeros(len(names) * 5)
    hz = IDLE.get("hz", 0.5)
    for i, b in enumerate(names):
        s = (IDLE.get("bones") or {}).get(b)
        if s:
            v = math.sin(2 * math.pi * hz * t_ms / 1000.0 + s.get("phase", 0))
            out[i * 5] += math.radians(s.get("rot", 0)) * v
            out[i * 5 + 1] += s.get("dx", 0) * v
            out[i * 5 + 2] += s.get("dy", 0) * v
    return out


def render_frame(args):
    i, (ch, pa, pb, wB, t_ms) = args
    ch = ch + sway(t_ms)
    rot, off, scl = {}, {}, {}
    for k, b in enumerate(names):
        r, dx, dy, sx, sy = ch[k * 5:k * 5 + 5]
        rot[b] = r
        if dx or dy:
            off[b] = (dx, dy)
        if abs(sx - 1) > 1e-6 or abs(sy - 1) > 1e-6:
            scl[b] = (sx, sy)
    ims = []
    for pose, wt in ((pa, 1.0 - wB), (pb, wB)):
        if wt <= 1e-3:
            continue
        model.set_state(state_of(rig["parts"], keys[pose].get("parts") if pose != "idle" else None))
        model.pose(rot=rot, root=(0.0, 0.0, 0.0), off=off, scl=scl)
        im = render_pose(model, W, H, pad=PAD)
        ims.append((im, wt))
    if len(ims) == 1:
        rg = ims[0][0]
    else:
        a0 = np.asarray(ims[0][0]).astype(np.float32)
        a1 = np.asarray(ims[1][0]).astype(np.float32)
        wa, wb = ims[0][1], ims[1][1]
        # premultiplied blend of the two draws: the new look comes up on top of the old one
        al0, al1 = a0[..., 3:4] / 255 * wa, a1[..., 3:4] / 255 * wb
        al = al0 + al1 * (1 - al0)
        rgb = (a0[..., :3] * al0 * (1 - al1) + a1[..., :3] * al1) / np.maximum(al, 1e-4)
        rg = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.clip(al * 255, 0, 255)]).astype(np.uint8), "RGBA")
    return i, rg


if __name__ == "__main__":
    frames = timeline()
    if "--json-only" in a:  # the moves' frame numbers only (a clip already rendered)
        o = pathlib.Path(opt("--out", f"D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/clips/{name}-{seq}-offline.mp4"))
        o.with_suffix(".moves.json").write_text(json.dumps(MOVES))
        print("wrote", o.with_suffix(".moves.json"))
        sys.exit(0)
    # framing: the union of every key's painting box in this sequence
    poses = sorted({p for p, _ in SEQ})
    box = None
    for p in poses:
        bb = painting_in_master(p, pad=PAD).split()[3].point(lambda v: 255 if v > 40 else 0).getbbox()
        box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
    box = (max(0, box[0] - 40), max(0, box[1] - 40), min(W + 2 * PAD, box[2] + 40), min(H + 2 * PAD, box[3] + 40))
    sz = (int((box[2] - box[0]) * SC), int((box[3] - box[1]) * SC))
    pimgs = {p: painting_in_master(p, pad=PAD) for p in poses}
    out = pathlib.Path(opt("--out", f"D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/clips/{name}-{seq}-offline.mp4"))
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix("")
    tmp.mkdir(exist_ok=True)
    procs = int(opt("--procs", 8))
    import lane_sheets as L  # noqa: E402

    font = ImageFont.truetype(L.FONT, 16) if pathlib.Path(L.FONT).exists() else ImageFont.load_default()
    with mp.Pool(procs) as pool:
        for i, rg in pool.imap(render_frame, list(enumerate(frames)), chunksize=4):
            ch, pa, pb, wB, t_ms = frames[i]
            rp = over(BG, rg).crop(box).resize(sz, Image.LANCZOS)
            # the painting set: the two paintings dissolved with the same weights (no motion of their own)
            if pa == pb:
                pm = pimgs[pa]
            else:
                pm = Image.blend(pimgs[pa], pimgs[pb], wB)
            pmi = over(BG, pm).crop(box).resize(sz, Image.LANCZOS)
            w = sz[0] * 2 + 8
            canvas = Image.new("RGB", (w + (w % 2), sz[1] + 28 + (sz[1] % 2)), (20, 20, 24))
            canvas.paste(pmi, (0, 28))
            canvas.paste(rp, (sz[0] + 8, 28))
            d = ImageDraw.Draw(canvas)
            d.text((6, 6), f"{name} {seq}  A painting set (dissolve)", fill=(255, 235, 120), font=font)
            d.text((sz[0] + 14, 6), f"B rig   t {t_ms / 1000:.2f}s  {pa}->{pb}", fill=(255, 235, 120), font=font)
            canvas.save(tmp / f"f{i:04d}.png")
    subprocess.run([L.FFMPEG, "-y", "-loglevel", "error", "-framerate", "60", "-i", str(tmp / "f%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", str(out)], check=True)
    import shutil
    shutil.rmtree(tmp, ignore_errors=True)
    out.with_suffix(".moves.json").write_text(json.dumps(MOVES))
    print("wrote", out, len(frames), "frames", flush=True)
