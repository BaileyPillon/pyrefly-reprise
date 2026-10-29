"""Shared helpers of the party-rig tools (tools/rig/lane/party/; the conference-demo motion program, Bailey 2026-10-22; both games, shared plumbing).

A party rig is built from KEYPOINTS: a hand-read set of points per pose painting (head, crown, neck, shoulders, elbows, hands, pelvis, knees, ankles, toes, the sword's pommel and tip) in that painting's 1x px,
kept beside the subject config (`<name>.keypoints.json`). Three tools read them: `idle_cut.py` (cuts the idle painting into parts), `retarget.py` (turns every pose's points into a bone key, exactly)
and `partition.py` (splits every pose's painting among the parts, for the format-v2 pieces `rig.py variants` cuts). `recut.py` runs everything from whatever pose folder it is pointed at.

Environment: `PYREFLY_ART_DIR` (the pose set, default D:/pyrefly-art-r61; the rig tools read it too), `RIG_WORK` / `PYREFLY_RIGS_DIR` as `rig_common.py`.
Run with D:/Tools/ComfyUI/python_embeded/python.exe -I (numpy, PIL, scipy, skimage).
"""
from __future__ import annotations

import json
import math
import os
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[3]
sys.path.insert(0, str(REPO / "tools" / "rig"))
sys.path.insert(0, str(REPO / "tools" / "rig" / "lane"))

import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import rig_geom as R  # noqa: E402
from rig_common import RIGS_ROOT, WORK_ROOT, Subject, read_json, write_json  # noqa: E402

DEFAULT_ART = "D:/pyrefly-art-r61"
BG = (110, 124, 148)


def art_dir() -> pathlib.Path:
    return pathlib.Path(os.environ.get("PYREFLY_ART_DIR") or DEFAULT_ART)


def load(name: str) -> "Party":
    return Party(name)


class Party:
    """One party subject: config, keypoints, work and rig folders."""

    def __init__(self, name: str):
        os.environ.setdefault("PYREFLY_ART_DIR", DEFAULT_ART)
        self.name = name
        self.sub = Subject(name)
        self.cfg = self.sub.cfg
        self.party = self.cfg["party"]
        self.S = self.sub.scale
        self.id = self.sub.id
        self.work = WORK_ROOT / name
        self.rig_dir = RIGS_ROOT / name
        kp = self.sub.rel(self.party["keypoints"])
        self.kp = json.loads(kp.read_text(encoding="utf8"))
        self.poses = list(self.party["poses"])
        self.order = list(self.party["order"])  # back to front
        self.parts = self.party["parts"]
        self.art = art_dir()
        self.chars = self.art / "characters" / self.id

    # ------------------------------------------------------------------ geometry
    def targets(self) -> dict:
        return read_json(self.work / "targets" / "targets.json")

    def reg(self, T: dict, pose: str):
        import rig_vcut
        return rig_vcut.painting_map(T, pose, self.S)

    def points(self, pose: str, T: dict | None = None, hidden: set | None = None) -> dict:
        """The pose's keypoints in master px of the IDLE frame (the idle's own: x2 only), plus the derived `waist`. `hidden` names are dropped."""
        k = {n: tuple(v) for n, v in self.kp[pose].items() if not hidden or n not in hidden}
        if pose == "idle" or T is None:
            out = {n: (v[0] * self.S, v[1] * self.S) for n, v in k.items()}
        else:
            ax, bx, ay, by = self.reg(T, pose)
            out = {n: (ax * self.S * v[0] + bx, ay * self.S * v[1] + by) for n, v in k.items()}
        if "pommel" in out and "tip" in out:  # the sword's pivot: just beyond its grip end, outside the blade (a joint the sword does not enclose is not one the hole test watches), and the middle for the partition
            out["swordMid"] = ((out["pommel"][0] + out["tip"][0]) / 2, (out["pommel"][1] + out["tip"][1]) / 2)
            out["swordPivot"] = self.sword_pivot(out)
        if "neck" in out and "pelvis" in out:
            f = float(self.party.get("waistT", 0.45))
            out["waist"] = (out["pelvis"][0] + f * (out["neck"][0] - out["pelvis"][0]), out["pelvis"][1] + f * (out["neck"][1] - out["pelvis"][1]))
        return out

    def sword_pivot(self, pts: dict) -> tuple:
        """The sword bone's pivot: a point carried rigidly by the sword, beside its middle by `swordPivotD` (1x px at the idle's length, scaled with the sword), outside the blade, so the hole test (which watches only a joint the
        parts meeting there enclose) leaves it alone and an offset stays small (the middle of a sword moves little between poses)."""
        d = float(self.party.get("swordPivotD", 90)) * self.S
        i = self.kp["idle"]
        l0 = math.hypot(i["tip"][0] - i["pommel"][0], i["tip"][1] - i["pommel"][1]) * self.S
        ax, ay = pts["tip"][0] - pts["pommel"][0], pts["tip"][1] - pts["pommel"][1]
        ln = math.hypot(ax, ay) or 1.0
        sc = ln / l0
        mx, my = (pts["pommel"][0] + pts["tip"][0]) / 2, (pts["pommel"][1] + pts["tip"][1]) / 2
        return (mx - ay / ln * d * sc, my + ax / ln * d * sc)

    def idle_hidden(self) -> set:
        return set(self.party.get("idle_hidden", []))

    def rest_points(self) -> dict:
        """Rest joints and landmarks: every idle keypoint (hidden ones included) in master px, plus waist and ground."""
        out = self.points("idle")
        gx = float(self.party.get("groundX", (out["footA"][0] + out["footB"][0]) / 2 if "footB" in out else out["footA"][0]))
        out["ground"] = (gx, float(self.party.get("baselineY", out["toeA"][1])))
        return out


# --------------------------------------------------------------------------------------------------------------------------------------------------- images


def painting_in_master(party: Party, pose: str, T: dict | None, pad: int, size: tuple[int, int]) -> Image.Image:
    """The pose's @Sx painting drawn into the idle's master frame (+ pad margin), RGBA. The idle itself is read as it is."""
    img = Image.open(party.chars / f"{pose}@{party.S}x.png").convert("RGBA")
    if pose == "idle":
        out = Image.new("RGBA", (size[0] + 2 * pad, size[1] + 2 * pad), (0, 0, 0, 0))
        out.paste(img, (pad, pad))
        return out
    ax, bx, ay, by = party.reg(T, pose)
    inv = (1 / ax, 0, -(bx + pad) / ax, 0, 1 / ay, -(by + pad) / ay)
    return img.transform((size[0] + 2 * pad, size[1] + 2 * pad), Image.AFFINE, inv, Image.BICUBIC)


def seg_dist(shape: tuple[int, int], a: tuple[float, float], b: tuple[float, float], x0: int = 0, y0: int = 0) -> np.ndarray:
    """Distance of every pixel centre of a (h, w) window at (x0, y0) to the segment a-b (a == b: the point)."""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    xx += x0
    yy += y0
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    if L2 < 1e-6:
        return np.hypot(xx - ax, yy - ay)
    t = np.clip(((xx - ax) * dx + (yy - ay) * dy) / L2, 0.0, 1.0)
    return np.hypot(xx - (ax + t * dx), yy - (ay + t * dy))


def part_caps(spec: dict, pts: dict, S: int) -> list:
    """The part's capsules whose points all exist: `[(a, b, radius px)]` (a one-point entry `[p, r]` is a disc). Radii are 1x px in the config, master px here."""
    out = []
    for c in spec.get("caps", []):
        names, r = c[:-1], float(c[-1]) * S
        if all(n in pts for n in names):
            a = pts[names[0]]
            b = pts[names[1]] if len(names) > 1 else a
            out.append((a, b, r))
    return out


def partition(rgba: np.ndarray, pts: dict, parts: dict, order: list, S: int, margin: float = 30.0, snap: bool = True, seeds: dict | None = None):
    """Label every opaque pixel of `rgba` (a master-frame window with pad) with the index (into `order`) of the part it belongs to, -1 outside the figure; None for a part the pose does not show.

    Each part is a set of capsules over the keypoints (`caps`: `[pointA, pointB, radius]` or `[point, radius]`, 1x px); a pixel goes to the part whose capsule SURFACE is nearest (distance minus radius, minus the part's
    `bias` so a front part wins where capsules overlap). Where the winner beats the runner-up by `margin` master px the label is certain; the band round a boundary is decided by a watershed on the painting's
    edges (the ink lines), so a seam runs along a drawn line instead of through the middle of a limb. `seeds` {part: mask} force pixels into a part (a painted-in effect that must not move with the body).
    Returns `(labels int16 (h, w), present: {part: bool})`."""
    from scipy import ndimage as ndi
    from skimage.segmentation import watershed

    h, w = rgba.shape[:2]
    alpha = rgba[..., 3]
    F = alpha > 60
    ys, xs = np.nonzero(F)
    if not len(xs):
        return np.full((h, w), -1, np.int16), {n: False for n in order}
    m = 90
    x0, x1, y0, y1 = max(0, xs.min() - m), min(w, xs.max() + m), max(0, ys.min() - m), min(h, ys.max() + m)
    Fc = F[y0:y1, x0:x1]
    ch, cw = Fc.shape
    costs, idx = [], []
    present = {n: False for n in order}
    for i, n in enumerate(order):
        caps = part_caps(parts[n], pts, S)
        if not caps:
            continue
        present[n] = True
        bias = float(parts[n].get("bias", 0.0)) * S
        best = None
        for a, b, r in caps:
            d = seg_dist((ch, cw), a, b, x0, y0) - r
            best = d if best is None else np.minimum(best, d)
        costs.append(best - bias)
        idx.append(i)
    if not costs:
        return np.full((h, w), -1, np.int16), present
    C = np.stack(costs)
    srt = np.sort(C, axis=0)
    win = np.argmin(C, axis=0)
    gap = (srt[1] - srt[0]) if len(costs) > 1 else np.full((ch, cw), 1e9, np.float32)
    lab_i = np.array(idx, np.int16)[win]
    out = np.full((ch, cw), -1, np.int16)
    out[Fc] = lab_i[Fc]
    if snap and len(costs) > 1:
        markers = np.zeros((ch, cw), np.int32)
        sure = Fc & (gap >= margin)
        markers[sure] = lab_i[sure] + 1
        if (~sure & Fc).any() and sure.any():
            rgb = rgba[y0:y1, x0:x1, :3].astype(np.float32)
            a_ = (rgba[y0:y1, x0:x1, 3:4].astype(np.float32)) / 255.0
            comp = rgb * a_ + np.array(BG, np.float32) * (1 - a_)
            lum = comp @ np.array([0.299, 0.587, 0.114], np.float32)
            lum = ndi.gaussian_filter(lum, 1.5)
            grad = np.hypot(ndi.sobel(lum, 0), ndi.sobel(lum, 1))
            grad = grad + 0.6 * np.hypot(ndi.sobel(a_[..., 0], 0), ndi.sobel(a_[..., 0], 1)) * 255.0
            ws = watershed(grad, markers, mask=Fc)
            res = np.where(ws > 0, ws - 1, -1).astype(np.int16)
            out = np.where(Fc, res, -1).astype(np.int16)
    out = clean_islands(out, len(order))
    if seeds:
        for n, sm in seeds.items():
            if n in order:
                hit = (sm[y0:y1, x0:x1] > 0) & Fc
                out[hit] = order.index(n)
                if hit.any():
                    present[n] = True  # a seeded part (the painted-in effects: `fx`) exists in this pose even with no capsule
    full = np.full((h, w), -1, np.int16)
    full[y0:y1, x0:x1] = out
    return full, present


def clean_islands(lab: np.ndarray, n_parts: int, max_share: float = 0.08, max_px: int = 14000) -> np.ndarray:
    """A part that is split into pieces keeps its biggest piece: a small island (under `max_share` of it and `max_px` px) goes to the label that surrounds it most. A bit of cloth or hair the partition cut off from its
    part would otherwise ride its own bones and drift away from the figure in a move."""
    from scipy import ndimage as ndi

    out = lab.copy()
    for i in range(n_parts):
        m = out == i
        if not m.any():
            continue
        comp, k = ndi.label(m)
        if k <= 1:
            continue
        areas = ndi.sum(m, comp, range(1, k + 1))
        big = int(np.argmax(areas)) + 1
        for c in range(1, k + 1):
            if c == big or areas[c - 1] > min(max_px, max_share * areas[big - 1]):
                continue
            cm = comp == c
            ring = ndi.binary_dilation(cm, iterations=3) & ~cm
            around = out[ring]
            around = around[(around >= 0) & (around != i)]
            if len(around):
                out[cm] = int(np.bincount(around).argmax())
    return out


def dilate_mask(m: np.ndarray, px: int) -> np.ndarray:
    from scipy import ndimage as ndi
    if px <= 0 or not m.any():
        return m
    ys, xs = np.nonzero(m)
    pad = px + 4
    y0, y1, x0, x1 = max(0, ys.min() - pad), min(m.shape[0], ys.max() + pad + 1), max(0, xs.min() - pad), min(m.shape[1], xs.max() + pad + 1)
    sub = m[y0:y1, x0:x1]
    d = ndi.distance_transform_edt(~sub) <= px
    out = np.zeros_like(m)
    out[y0:y1, x0:x1] = d
    return out


def wrap(a: float) -> float:
    return (a + math.pi) % (2 * math.pi) - math.pi


# ------------------------------------------------------------------------------------------------------------------------------------------ marks for the bones


def joints_data(party: Party) -> dict | None:
    jf = party.work / "joints.json"
    return json.loads(jf.read_text(encoding="utf8")) if jf.exists() else None


def joint_radii(party: Party) -> dict:
    """{keypoint: master px of the hole test's disc} (+ `joint_margin`), from <work>/joints.json by `party.joint_points` (bone -> the keypoint that places or aims its joint)."""
    data = joints_data(party)
    if not data:
        return {}
    sx = data["frame"]["sx"]
    jp = party.party.get("joint_points", {})
    out: dict = {}
    for j in data["joints"]:
        pt = jp.get(j["name"])
        if pt:
            out[pt] = max(out.get(pt, 0.0), j["r"] / sx + float(party.party.get("joint_margin", 6)))
    return out


def synth_missing(party: Party, rest: dict, marks: dict) -> dict:
    """A pose that does not show a limb still moves its bones: every keypoint the idle has and the pose lacks is the rest point carried by the similarity that takes the rest pelvis-to-neck onto the pose's (the limb folds
    in with the torso), so a hidden joint lands where the body is and the hole test finds it solid."""
    if not all(k in marks for k in ("pelvis", "neck")) or not all(k in rest for k in ("pelvis", "neck")):
        return marks
    rv = np.array(rest["neck"]) - np.array(rest["pelvis"])
    pv = np.array(marks["neck"]) - np.array(marks["pelvis"])
    if np.hypot(*rv) < 1 or np.hypot(*pv) < 1:
        return marks
    ang = math.atan2(pv[1], pv[0]) - math.atan2(rv[1], rv[0])
    s = float(np.hypot(*pv) / np.hypot(*rv))
    c, sn = math.cos(ang), math.sin(ang)
    out = dict(marks)
    for k, v in rest.items():
        if k in out or k in ("ground", "waist", "swordMid", "swordPivot", "hem", "hairTip", "pommel", "tip", "crown", "head", "headTop"):
            continue
        d = np.array(v) - np.array(rest["pelvis"])
        q = np.array(marks["pelvis"]) + s * np.array([c * d[0] - sn * d[1], sn * d[0] + c * d[1]])
        out[k] = (float(q[0]), float(q[1]))
    return out


def snap_marks(party: Party, pose: str, T: dict, marks: dict, need: dict, size: tuple[int, int], window: int = 150) -> tuple[dict, dict]:
    """Keep every joint the hole test watches clear of the figure's edge: a keypoint that places or aims a joint is moved, the least that does it, to where the painting is solid for `need[point]` master px all
    round it (the nearest such pixel within `window`; else the deepest one). Returns (new marks, {point: px moved})."""
    from scipy import ndimage as ndi

    pad = int(party.party.get("pad", 600))
    img = painting_in_master(party, pose, T, pad, size)
    solid = np.asarray(img)[..., 3] >= 76
    sd = ndi.distance_transform_edt(np.pad(solid, 2))[2:-2, 2:-2]
    out, moved = dict(marks), {}
    H, W = sd.shape
    for pt, c in need.items():
        if pt not in out:
            continue
        x, y = out[pt][0] + pad, out[pt][1] + pad
        if 0 <= int(x) < W and 0 <= int(y) < H and sd[int(y), int(x)] >= c:
            continue
        x0, x1, y0, y1 = max(0, int(x) - window), min(W, int(x) + window), max(0, int(y) - window), min(H, int(y) + window)
        if x1 <= x0 or y1 <= y0:
            continue
        sub = sd[y0:y1, x0:x1]
        yy, xx = np.mgrid[y0:y1, x0:x1]
        d = np.hypot(xx - x, yy - y)
        ok = sub >= c
        k = int(np.argmin(np.where(ok, d, 1e9))) if ok.any() else int(np.argmax(sub - 0.01 * d))
        ny, nx = int(yy.flat[k]), int(xx.flat[k])
        out[pt] = (float(nx - pad), float(ny - pad))
        moved[pt] = round(float(np.hypot(nx - x, ny - y)), 1)
    return out, moved


def marks_for(party: Party, pose: str, T: dict, size: tuple[int, int]) -> tuple[dict, dict]:
    """The pose's marks for the BONES (and the joint discs): keypoints in the idle's master frame, a hidden limb carried with the torso, every joint point kept clear of the figure's edge. (marks, {point: px moved})."""
    rest = party.rest_points()
    marks = party.points(pose, T)
    marks = synth_missing(party, rest, marks)
    need = joint_radii(party)
    moved: dict = {}
    if need:
        first = {k: v for k, v in need.items() if k != "waist"}
        marks, moved = snap_marks(party, pose, T, marks, first, size)
        f = float(party.party.get("waistT", 0.45))
        if "pelvis" in marks and "neck" in marks:
            marks["waist"] = (marks["pelvis"][0] + f * (marks["neck"][0] - marks["pelvis"][0]), marks["pelvis"][1] + f * (marks["neck"][1] - marks["pelvis"][1]))
            if "waist" in need:
                marks, m2 = snap_marks(party, pose, T, marks, {"waist": need["waist"]}, size)
                moved.update(m2)
    if "pommel" in marks and "tip" in marks:
        marks["swordMid"] = ((marks["pommel"][0] + marks["tip"][0]) / 2, (marks["pommel"][1] + marks["tip"][1]) / 2)
        marks["swordPivot"] = party.sword_pivot(marks)
    return marks, moved


def add_joint_discs(party: Party, masks: dict, joints: dict, alpha: np.ndarray) -> None:
    """Every part that meets at a joint carries the disc the hole test keeps solid round it (`party.joint_discs`: [bone, [parts]]): two rigid pieces that turn about one point cover a disc about it together only if each covers
    it alone, and a bone scaled below 1 shrinks what its piece covers about the joint, so the disc is the test's radius over `disc_scale` (default 0.75, the smallest limb scale a key may ask) plus `disc_margin`.
    `joints` {bone: (x, y)} are the POSED joint places in the masks' frame; `masks` {part: bool array} get the disc (inside the painting's alpha) added in place."""
    data = joints_data(party)
    if not data:
        return
    sx = data["frame"]["sx"]
    rr = {j["name"]: j["r"] / sx for j in data["joints"]}
    k = 1.0 / float(party.party.get("disc_scale", 0.75))
    for bone, parts in party.party.get("joint_discs", []):
        if bone not in joints or bone not in rr:
            continue
        R_ = rr[bone] * k + float(party.party.get("disc_margin", 10))
        cx, cy = joints[bone]
        for n in parts:
            m = masks.get(n)
            if m is None:
                continue
            h, w = m.shape
            x0, x1, y0, y1 = max(0, int(cx - R_) - 1), min(w, int(cx + R_) + 2), max(0, int(cy - R_) - 1), min(h, int(cy + R_) + 2)
            if x1 <= x0 or y1 <= y0:
                continue
            gy, gx = np.mgrid[y0:y1, x0:x1]
            disc = (gx - cx) ** 2 + (gy - cy) ** 2 <= R_ * R_
            m[y0:y1, x0:x1] |= disc & alpha[y0:y1, x0:x1]


def rest_joints(party: Party) -> dict:
    """{bone: rest pivot} in master px (the idle's frame): the skeleton's point, or, for a bone `pedge.py` moved to the outline of the idle figure (where the hole test stops watching a joint), that outline point
    (<work>/rest_override.json, keyed by bone)."""
    rest = party.rest_points()
    out = {e[0]: rest[e[2]] for e in party.party["skeleton"]}
    ov = party.work / "rest_override.json"
    if ov.exists():
        for k, v in json.loads(ov.read_text(encoding="utf8")).items():
            if k in out:
                out[k] = (float(v[0]), float(v[1]))
    return out
