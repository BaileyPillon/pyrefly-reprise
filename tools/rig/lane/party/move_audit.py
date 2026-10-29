"""move_audit.py <rig folder> <config name> --art <art dir> [--pairs a>b[:ms],...] [--game ffx|ffx2] [--flip 0.5] [--out audit.json] [--strips dir] : the OFFLINE continuity audit of a party rig's key changes (rigs-v2, 2026-10-29;
both games, shared plumbing; no browser, no GPU, no game: numpy and the kit's compiled silhouette kernels).

What it replays is what the engine does with a rig on a settled figure (`engine/rig/RigKeys.ts`, `RigPartState.ts`): the bone channels (rot, dx, dy, sx, sy, and the key's `root`) move from key A to key B on the game's quadInOut
over B's `ms` (one frame every 1/60 s), and the part state of B takes over at progress `--flip` (0.5, the engine's `STATE_FLIP`; `fadeMs` 0, a cut, as the pilots ship). Each frame is a SILHOUETTE (the kit's `grid_mask`, the same raster
the gate reads), and the numbers are read from the silhouettes only, so the audit is fast and the same on every machine:

  crack_frames / crack_max frames whose interior transparent area (the background showing THROUGH the figure: a crack where two parts no longer meet) exceeds the larger of the two end poses' by 0.01 of the figure's area / the largest excess
  tear_frames / tear_max   frames whose stray share (area not in the largest piece, over all area) exceeds the larger of the two end poses' by 0.03 / the largest excess: a figure that has come apart (a shard of a limb, a part off its joint)
  dip                      the smallest frame's area over the smaller end pose's: a figure that shrinks mid-move (a part turned edge-on, a torso gone thin)
  pop_sil                  1 - IoU of the silhouette drawn in state A against state B at the bone pose of the flip frame: how much the figure changes AT the cut (0 = an invisible cut)
  step_max / step_med      the largest and median one-frame step of the silhouette's centroid, in figure heights (the head and feet are the continuity probe's; a rig's tracker reads the skeleton's own landmarks)
  ghost_eq                 what the PAINTING SET's dissolve of the same two poses costs: (1 - IoU of the two end silhouettes) x the dissolve frames at 0.15 to 0.85 weight over `--paint-ms` (110): the see-through frames a
                           rig does not have, in the unit "frames of a second figure"

`--strips <dir>` also writes, for each pair, a strip of the move in colour (row 1: the painting set's dissolve of the two paintings; row 2: the rig, frame by frame, the kit's renderer, nearest texel, no lighting) so the numbers can be LOOKED at; the numbers decide nothing a person cannot see.
"""
from __future__ import annotations

import json
import math
import os
import pathlib
import sys

_REPO = pathlib.Path(__file__).resolve().parents[4]
a = sys.argv[1:]
rigdir, name = pathlib.Path(a[0]), a[1]
opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d  # noqa: E731
cfg = json.loads((_REPO / "tools" / "rig" / "subjects" / f"{name}.json").read_text(encoding="utf8"))
os.environ["XID"] = cfg["subject"]
os.environ["XWORK"] = name
os.environ["XART"] = opt("--art", os.environ.get("PYREFLY_ART_DIR", "D:/pyrefly-art-r64"))
sys.path.insert(0, str(_REPO / "tools" / "rig" / "lane" / "expressive"))
sys.path.insert(0, str(_REPO / "tools" / "rig" / "lane"))
sys.path.insert(0, str(_REPO / "tools" / "rig"))
import numpy as np  # noqa: E402
from scipy import ndimage  # noqa: E402
from rig_common import read_json  # noqa: E402
from rig_kernels import cover, raster  # noqa: E402
from rig_skin import RigModel  # noqa: E402
from rig_v2 import state_of  # noqa: E402
import xl  # noqa: E402

FPS = 60.0
DT = 1000.0 / FPS
rig = read_json(rigdir / "rig.json")
T = xl.targets()
model = RigModel(rig, rigdir, grid_affine=T["gridFromMaster"], grid=T["grid"], tex_downsample=2)  # alpha at half the part texture (the kit's fit uses 4): a crack of a few master px is not lost
W, H = rig["image"]["w"], rig["image"]["h"]
PAD = 600  # a figure that falls or lunges leaves the idle frame: room on every side
SC = 0.2  # master px to mask cells: a cell is 5 master px, 2.5 px of the 1x painting
keys = rig["keys"]
names = [b["name"] for b in rig["bones"]]
NB = len(names)
GAME_PAIRS = {
    # the key changes the figure makes in its chapter under the release 67 picks (docs/handoff/rigs-v2.md has the list and the reason for each): `ready` is the wind-up (the menu stays on the idle key: `paint`)
    "ffx": "idle>ready,ready>attack,attack>follow,follow>idle,idle>attack,idle>cast,cast>idle,idle>item,item>idle,idle>hurt,hurt>idle,idle>critical,critical>idle,critical>hurt,hurt>critical,hurt>ko,idle>ko,critical>ko,ko>idle,idle>victory,victory>idle,idle>defend,defend>idle,idle>sleep",
    "ffx2": "idle>ready,ready>attack,attack>follow,follow>idle,idle>attack,idle>cast,cast>idle,idle>item,item>idle,idle>hurt,hurt>idle,idle>critical,critical>idle,critical>hurt,hurt>critical,hurt>ko,idle>ko,critical>ko,ko>idle,idle>victory,victory>idle,idle>sleep",
}


def chan_of(pose: str) -> np.ndarray:
    """A key as channels: per bone [rot, dx, dy, sx, sy], then the key's root [dx, dy, rot]."""
    v = []
    k = keys[pose] if pose != "idle" else {"bones": {}}
    for b in names:
        e = k.get("bones", {}).get(b, {})
        sx = e.get("sx", 1.0)
        v += [e.get("rot", 0.0), e.get("dx", 0.0), e.get("dy", 0.0), sx, e.get("sy", sx)]
    r = k.get("root", {})
    v += [r.get("dx", 0.0), r.get("dy", 0.0), r.get("rot", 0.0)]
    return np.array(v, np.float64)


def ease(u: float) -> float:
    return 2 * u * u if u < 0.5 else 1 - 2 * (1 - u) ** 2


def pose_model(ch: np.ndarray, pose_state: str) -> np.ndarray:
    """Pose the model at channels `ch` drawing `pose_state`'s part state; return its silhouette on the kit's grid."""
    rot, off, scl = {}, {}, {}
    for i, b in enumerate(names):
        r, dx, dy, sx, sy = ch[i * 5:i * 5 + 5]
        rot[b] = r
        if dx or dy:
            off[b] = (dx, dy)
        if abs(sx - 1) > 1e-6 or abs(sy - 1) > 1e-6:
            scl[b] = (sx, sy)
    model.set_state(state_of(rig["parts"], keys[pose_state].get("parts") if pose_state != "idle" else None))
    model.pose(rot=rot, root=(float(ch[NB * 5]), float(ch[NB * 5 + 1]), float(ch[NB * 5 + 2])), off=off, scl=scl)
    return mask_fine()


def mask_fine() -> np.ndarray:
    """The posed model's silhouette on a fine canvas (the kit's raster, `SC` cells a master px, `PAD` of margin): True where the figure is."""
    ww, wh = int((W + 2 * PAD) * SC), int((H + 2 * PAD) * SC)
    hi = np.zeros((2 * wh, 2 * ww), np.uint8)
    base = np.zeros_like(hi)
    mask = np.zeros((wh, ww), np.uint8)
    cov = np.zeros((wh, ww), np.float32)
    raster(model.P, model.TUV, model.tri, model.live, model.tri_part, model.tex_off, model.tex_w, model.tex_h, model.TEX, SC, PAD * SC, SC, PAD * SC, ww, wh, hi, base)
    cover(hi, ww, wh, mask, cov)
    return mask > 0


def holes(mask: np.ndarray) -> float:
    """Interior transparent area over figure area: the background showing through the figure (a crack where two parts no longer meet; a gap between an arm and the body counts too, so it is read against the end poses)."""
    a = float(mask.sum())
    return float((ndimage.binary_fill_holes(mask) & ~mask).sum() / a) if a else 0.0


def stray(mask: np.ndarray, min_share: float = 0.004) -> tuple[float, int]:
    """(share of the area outside the largest piece, number of pieces over `min_share` of the area)."""
    lab, n = ndimage.label(mask, structure=np.ones((3, 3)))
    if n == 0:
        return 0.0, 0
    sizes = ndimage.sum(mask, lab, index=np.arange(1, n + 1))
    tot = float(sizes.sum())
    big = int((sizes >= min_share * tot).sum())
    return float(1.0 - sizes.max() / tot), big


def iou(m1: np.ndarray, m2: np.ndarray) -> float:
    u = (m1 | m2).sum()
    return float((m1 & m2).sum() / u) if u else 1.0


def centroid(mask: np.ndarray) -> tuple[float, float]:
    ys, xs = np.nonzero(mask)
    return (float(xs.mean()), float(ys.mean())) if len(xs) else (0.0, 0.0)


def shard_parts(ch: np.ndarray, state_pose: str, min_share: float = 0.002) -> list[dict]:
    """The pieces of the figure at `ch` (state `state_pose`) other than the largest, and which PART each one is: every active slot drawn alone, the one whose silhouette covers most of the piece. A shard that
    belongs to a part is a defect of that part's cut in that pose (a cloth tail given to a limb that is not where the cloth is), fixed in the partition, not in the move."""
    m = pose_model(ch, state_pose)
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n < 2:
        return []
    sizes = ndimage.sum(m, lab, index=np.arange(1, n + 1))
    tot = float(sizes.sum())
    big = int(np.argmax(sizes)) + 1
    per_part = {}
    live_all = model.live.copy()
    for i, (pname, vname, _p) in enumerate(model.slots):
        if not model.active[i]:
            continue
        model.live = model.part_live[i]
        per_part[f"{pname}:{vname or 'own'}"] = mask_fine()
    model.live = live_all
    out = []
    for k in range(1, n + 1):
        if k == big or sizes[k - 1] < min_share * tot:
            continue
        comp = lab == k
        best = max(per_part.items(), key=lambda kv: int((kv[1] & comp).sum()))
        ys, xs = np.nonzero(comp)
        out.append({"share": round(float(sizes[k - 1] / tot), 4), "part": best[0], "centre1x": [round(float((xs.mean() / SC - PAD) / 2), 0), round(float((ys.mean() / SC - PAD) / 2), 0)]})
    return out


def audit_pair(frm: str, to: str, ms: float, flip: float, paint_ms: float) -> dict:
    A, B = chan_of(frm), chan_of(to)
    n = max(1, int(round(ms / DT)))
    d = ms / 1000.0
    mA = pose_model(A, frm)
    mB = pose_model(B, to)
    sA, cA = stray(mA, 0.002)
    sB, cB = stray(mB, 0.002)
    base_stray = max(sA, sB)
    base_holes = max(holes(mA), holes(mB))
    areaA, areaB = int(mA.sum()), int(mB.sum())
    H = float(np.ptp(np.nonzero(mA.any(1))[0]) or 1)  # the idle figure's height in grid cells (centroid steps are in figure heights)
    strays, pieces, areas, cents, frames, hole_ex = [], [], [], [], [], []
    prev_c = centroid(mA)
    flip_i = None
    for i in range(1, n + 1):
        u = min(1.0, i / n)
        cur = A + (B - A) * ease(u)
        state = to if u >= flip else frm
        if flip_i is None and u >= flip:
            flip_i = i
        m = pose_model(cur, state)
        s, c = stray(m, 0.002)
        c_xy = centroid(m)
        pieces.append(c)
        hole_ex.append(holes(m) - base_holes)
        strays.append(s)
        areas.append(int(m.sum()))
        cents.append(math.hypot(c_xy[0] - prev_c[0], c_xy[1] - prev_c[1]) / H)
        prev_c = c_xy
        frames.append((i, u, state))
    tear = [s - base_stray for s in strays]
    # the pop at the flip: the bone pose of the flip frame drawn in state A and in state B
    fi = (flip_i or n)
    uf = min(1.0, fi / n)
    chf = A + (B - A) * ease(uf)
    pop = 1.0 - iou(pose_model(chf, frm), pose_model(chf, to))
    ghost_frames = sum(1 for k in range(int(paint_ms / DT) + 1) if 0.15 <= k * DT / paint_ms <= 0.85)
    return {
        "from": frm, "to": to, "ms": ms, "frames": n, "flipFrame": fi,
        "endStray": [round(sA, 4), round(sB, 4)], "endPieces": [cA, cB],
        "tearFrames": int(sum(1 for k, t in enumerate(tear) if t > 0.01 or pieces[k] > max(cA, cB))), "tearMax": round(max(tear), 4), "piecesMax": max(pieces), "endPiecesMax": max(cA, cB),
        "crackFrames": int(sum(1 for h in hole_ex if h > 0.01)), "crackMax": round(max(hole_ex), 4),
        "dip": round(min(areas) / max(1, min(areaA, areaB)), 4),
        "popSil": round(pop, 4),
        "stepMax": round(max(cents), 4), "stepMed": round(float(np.median(cents)), 4),
        "ghostEq": round((1.0 - iou(mA, mB)) * ghost_frames, 2),
        "shards": [{"i": f[0], "u": round(f[1], 3), "state": f[2], "pieces": shard_parts(A + (B - A) * ease(f[1]), f[2])} for k, f in enumerate(frames) if pieces[k] > max(cA, cB)],
        "frameList": [{"i": f[0], "u": round(f[1], 3), "state": f[2], "stray": round(strays[k], 4), "pieces": pieces[k], "crack": round(hole_ex[k], 4), "area": round(areas[k] / max(1, max(areaA, areaB)), 4)} for k, f in enumerate(frames)],
    }


def colour(ch: np.ndarray, state_pose: str, down: float):
    """The posed model in colour (the kit's slow renderer, nearest texel, no lighting) on the padded canvas, `down` times smaller: a PIL RGBA image."""
    from PIL import Image
    pose_model(ch, state_pose)
    model.P[:, 0] += PAD
    model.P[:, 1] += PAD
    try:
        arr = model.render_rgba(W + 2 * PAD, H + 2 * PAD, scale_down=down)
    finally:
        model.P[:, 0] -= PAD
        model.P[:, 1] -= PAD
    return Image.fromarray(arr, "RGBA")


def strip(frm: str, to: str, ms: float, flip: float, out: pathlib.Path, down: float = 4.0, count: int = 7) -> None:
    """Row 1: the painting set's two paintings dissolved over the move; row 2: the rig frame by frame (the frames before and after the flip are both shown). One PNG a pair, for LOOKING."""
    from PIL import Image, ImageDraw
    A, B = chan_of(frm), chan_of(to)
    n = max(1, int(round(ms / DT)))
    us = sorted({0.0, 1.0, *[k / (count - 1) for k in range(1, count - 1)]} | ({max(0.0, flip - 0.5 / n), min(1.0, flip + 0.5 / n)} if n > 3 else set()))
    pa, pb = xl.painting_in_master(frm, pad=PAD), xl.painting_in_master(to, pad=PAD)
    bg = (110, 124, 148, 255)
    rows = [[], []]
    box = None
    for u in us:
        cur = A + (B - A) * ease(u)
        state = to if u >= flip else frm
        rg = colour(cur, state, down)
        pm = Image.blend(pa, pb, ease(u)).resize(rg.size, Image.LANCZOS)
        for r, im in ((0, pm), (1, rg)):
            c = Image.new("RGBA", im.size, bg)
            c.alpha_composite(im)
            rows[r].append(c)
        bb = np.nonzero(np.asarray(rg)[..., 3] > 40)
        if len(bb[0]):
            b2 = (bb[1].min(), bb[0].min(), bb[1].max(), bb[0].max())
            box = b2 if box is None else (min(box[0], b2[0]), min(box[1], b2[1]), max(box[2], b2[2]), max(box[3], b2[3]))
    # the frame: the union of the figure's boxes over the move, from the end poses too
    for p in (pa, pb):
        bb = np.nonzero(np.asarray(p.resize(rows[1][0].size))[..., 3] > 40)
        if len(bb[0]):
            b2 = (bb[1].min(), bb[0].min(), bb[1].max(), bb[0].max())
            box = b2 if box is None else (min(box[0], b2[0]), min(box[1], b2[1]), max(box[2], b2[2]), max(box[3], b2[3]))
    m = 10
    box = (max(0, box[0] - m), max(0, box[1] - m), min(rows[1][0].size[0], box[2] + m), min(rows[1][0].size[1], box[3] + m))
    tw, th = box[2] - box[0], box[3] - box[1]
    canvas = Image.new("RGB", (tw * len(us), th * 2), (20, 20, 24))
    d = ImageDraw.Draw(canvas)
    for k, u in enumerate(us):
        for r in (0, 1):
            canvas.paste(rows[r][k].crop(box).convert("RGB"), (k * tw, r * th))
        fr = round(u * n, 1)
        d.text((k * tw + 4, 3), f"{frm}>{to} {ms:.0f}ms u={u:.2f} f{fr:g}/{n} {'' if u < flip else '[' + to + ' pieces]'}", fill=(255, 235, 120))
    d.text((4, th + 3), "rig", fill=(255, 235, 120))
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out)


def main() -> int:
    game = opt("--game") or ("ffx" if cfg["subject"] == "tidus" else "ffx2")
    flip = float(opt("--flip", 0.5))
    paint_ms = float(opt("--paint-ms", 110))
    raw = opt("--pairs") or GAME_PAIRS[game]
    out = []
    for item in raw.split(","):
        pr, _, ms = item.partition(":")
        frm, _, to = pr.partition(">")
        if frm not in keys and frm != "idle" or to not in keys:
            print(f"skip {item}: no key", flush=True)
            continue
        m = float(ms) if ms else float(keys[to].get("ms", 120))
        r = audit_pair(frm, to, m, flip, paint_ms)
        out.append(r)
        if opt("--strips"):
            strip(frm, to, m, flip, pathlib.Path(opt("--strips")) / f"{name}-{frm}-to-{to}-{m:.0f}ms.png")
        print(f"{frm:>9s} > {to:<9s} {m:5.0f} ms {r['frames']:2d} f  tear {r['tearFrames']:2d} ({r['tearMax']:.3f}) crack {r['crackFrames']:2d} ({r['crackMax']:.3f})  dip {r['dip']:.2f}  pop {r['popSil']:.3f}  step {r['stepMax']:.3f}/{r['stepMed']:.3f}  ghostEq {r['ghostEq']:.1f}", flush=True)
    summary = {
        "rig": str(rigdir), "config": name, "flip": flip, "pairs": len(out),
        "tearPairs": sum(1 for r in out if r["tearFrames"] > 0), "tearFrames": sum(r["tearFrames"] for r in out), "crackFrames": sum(r["crackFrames"] for r in out), "worstCrack": max((r["crackMax"] for r in out), default=0.0),
        "worstTear": max((r["tearMax"] for r in out), default=0.0), "worstPop": max((r["popSil"] for r in out), default=0.0),
        "worstDip": min((r["dip"] for r in out), default=1.0), "ghostEqTotal": round(sum(r["ghostEq"] for r in out), 1),
    }
    print("SUMMARY", json.dumps(summary), flush=True)
    if opt("--out"):
        pathlib.Path(opt("--out")).write_text(json.dumps({"summary": summary, "pairs": out}, indent=1), encoding="utf8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
