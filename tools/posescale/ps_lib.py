"""Pose scale measurement: the shared library (r39-posescale; both games, art tooling only).

Why this exists. The painted figures are generated one pose at a time and the generator does not paint them at one pixels per
metre, so a figure's head changes size when it changes pose (Tidus's victory head is 0.62 of his idle's on screen) and, because the
engine centres a plane by its PNG, the feet slide when the pose changes (up to 119 px at 1600x900). The engine sizes every pose from
the idle's pixel scale times a per-pose `scale` (PaintedScale.ts); this module is the measuring side.

What is automatic and what is read by eye (there is no face detector on this machine and nothing may be downloaded):

- STANCE (automatic). The middle of the lowest thick part of the silhouette (thin blades, staffs and tails are opened away): where the
  figure stands. `stance_from_hem`. Shown on a stance sheet and checked by eye; a hand `stance` overrides it.
- HEAD SCALE (read by eye, SAM helps). The reference is the idle's face box (hand, subjects.json). `measure.py tiles` draws every pose's
  head at one fixed zoom with ten concentric rulers (the idle's box at scales 0.60 to 1.85) and the reviewer writes the scale of the
  ruler the face fills (reviews.json). `measure.py props` adds SAM 2.1 (small, D:/Tools/sam2, as tools/gen/rig-sam.py) cutting the head
  mask out from a seed inside it and proposing the ratio of the masks; it is only a second reading (it follows the hair mass and was
  unstable on half the poses), the reviewed number is the one used.

Everything is read from `public/art` (local, gitignored) and the verdict is written to `docs/target/pose-measure.json` with each
painting's sha256, so a re-rendered painting makes its record stale and `tools/pose-scale-check.mjs` fails until it is measured again.
Run with ComfyUI's embedded python: `D:/Tools/ComfyUI/python_embeded/python.exe -s tools/posescale/measure.py ...`
(numpy, scipy, PIL; torch and sam2 only for `props`).
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

REPO = pathlib.Path(__file__).resolve().parents[2]
ART = pathlib.Path(os.environ.get("PYREFLY_ART_DIR", REPO / "public" / "art"))
CHAR = ART / "characters"
HERE = pathlib.Path(__file__).resolve().parent
SUBJECTS_JSON = HERE / "subjects.json"
OVERRIDES_JSON = HERE / "overrides.json"
RECORDS_JSON = REPO / "docs" / "target" / "pose-measure.json"

SAM_REPO = pathlib.Path("D:/Tools/sam2/repo")
SAM_CKPT = pathlib.Path("D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt")

# ---------------------------------------------------------------- files


def sha256_file(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pose_names(subject: str) -> list[str]:
    """Every painting the game can ask for: no `@2x` masters, no `.1` candidates, no `.raw` cutouts."""
    out = []
    for f in sorted((CHAR / subject).glob("*.png")):
        stem = f.stem
        if "@" in stem or "." in stem:
            continue
        out.append(stem)
    return out


def load_json(path: pathlib.Path, default):
    return json.loads(path.read_text(encoding="utf8")) if path.exists() else default


class Painting:
    """One painting, loaded once: the RGBA pixels, the alpha mask, the SAM input (colour over mid grey)."""

    def __init__(self, subject: str, pose: str):
        self.subject, self.pose = subject, pose
        self.path = CHAR / subject / f"{pose}.png"
        self.im = Image.open(self.path).convert("RGBA")
        self.w, self.h = self.im.size
        self.rgba = np.asarray(self.im)
        self.alpha = self.rgba[..., 3] > 128
        bg = Image.new("RGBA", self.im.size, (128, 128, 128, 255))
        bg.alpha_composite(self.im)
        self.rgb = np.asarray(bg.convert("RGB"))
        ys, xs = np.nonzero(self.alpha)
        self.bbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1) if len(xs) else (0, 0, self.w, self.h)

    @property
    def prone(self) -> bool:
        """The engine's own test (PaintedScale.ts proneAspect 1.15)."""
        return self.w > self.h * 1.15


# ---------------------------------------------------------------- SAM

_PRED = None


def sam_predictor():
    global _PRED
    if _PRED is None:
        import torch

        torch.jit.script = lambda f, *a, **k: f  # the embedded python ships no stdlib sources (rig-sam.py does the same)
        cwd = os.getcwd()
        os.chdir(SAM_REPO)  # hydra resolves the config name inside the package
        from sam2.build_sam import build_sam2
        from sam2.sam2_image_predictor import SAM2ImagePredictor

        dev = "cpu"
        if torch.cuda.is_available() and torch.cuda.mem_get_info()[0] > 2 * 1024 ** 3:
            dev = "cuda"
        model = build_sam2("configs/sam2.1/sam2.1_hiera_s.yaml", str(SAM_CKPT), device=dev)
        os.chdir(cwd)
        _PRED = SAM2ImagePredictor(model)
        _PRED.device_name = dev
    return _PRED


def sam_predict_many(p: Painting, prompts):
    """Run several prompts on one painting (the image is embedded once). Each prompt is a dict(points=[[x,y],...], box=[x0,y0,x1,y1]|None);
    returns, per prompt, a list of (mask & alpha, score) for SAM's three granularities (0 = a part such as the hair mass, 2 = the largest)."""
    import torch

    pr = sam_predictor()
    out = []
    with torch.inference_mode():
        pr.set_image(p.rgb)
        for q in prompts:
            pts = q.get("points") or []
            masks, scores, _ = pr.predict(
                point_coords=np.array(pts, np.float32) if pts else None,
                point_labels=np.ones(len(pts), np.int32) if pts else None,
                box=np.array(q["box"], np.float32) if q.get("box") is not None else None,
                multimask_output=True,
            )
            out.append([(masks[i].astype(bool) & p.alpha, float(scores[i])) for i in range(len(scores))])
    return out


def robust_bbox(m: np.ndarray, lo: float = 0.5, hi: float = 99.5):
    ys, xs = np.nonzero(m)
    if len(xs) == 0:
        return None
    return [float(np.percentile(xs, lo)), float(np.percentile(ys, lo)), float(np.percentile(xs, hi)) + 1, float(np.percentile(ys, hi)) + 1]


def head_size(b) -> float:
    """The head's size: the geometric mean of its box. Turns and tilts trade width for height, this keeps one number."""
    return math.sqrt(max(1.0, b[2] - b[0]) * max(1.0, b[3] - b[1]))


# Seed offsets, in units of the idle's head box (width, height): the prompts of one ensemble. SAM's smallest mask for a
# point (or a few) on a head is the hair mass with the upper face; it is stable across these prompts when the seed is on a
# head, and it jumps (to a weapon, a torso) when it is not, which is what the spread flags.
VARIANTS = [
    [(0.0, 0.0)],
    [(0.0, 0.0), (-0.22, -0.12)],
    [(0.0, 0.0), (0.20, -0.18)],
    [(0.0, 0.0), (-0.05, 0.20)],
    [(0.0, 0.0), (-0.20, -0.10), (0.20, -0.15)],
    [(0.07, 0.06)],
    [(-0.07, -0.06)],
]


def sam_head(p: Painting, seed, ref_wh):
    """The head's box and mask from a seed point inside it: the median of an ensemble of SAM prompts. See the module docstring."""
    bw, bh = ref_wh
    prompts = []
    for v in VARIANTS:
        pts = [[min(p.w - 1.0, max(0.0, seed[0] + dx * bw)), min(p.h - 1.0, max(0.0, seed[1] + dy * bh))] for dx, dy in v]
        prompts.append(dict(points=pts, box=None))
    res = sam_predict_many(p, prompts)
    items = []
    for r in res:
        m, sc = r[0]
        if not m.any():
            continue
        bb = robust_bbox(m)
        items.append(dict(box=bb, mask=m, score=sc, size=head_size(bb)))
    if not items:
        return None
    sizes = np.array([i["size"] for i in items])
    med = float(np.median(sizes))
    spread = float((np.percentile(sizes, 90) - np.percentile(sizes, 10)) / med)
    rep = min(items, key=lambda i: abs(i["size"] - med))
    return dict(box=rep["box"], mask=rep["mask"], score=rep["score"], size=rep["size"], spread=spread, n=len(items), sizes=[round(float(x), 1) for x in sizes])


# ---------------------------------------------------------------- stance

def opened(p: Painting, frac: float = 0.022):
    """The silhouette with thin parts (blades, staffs, tails, fingers) removed (opening by a disk, done at half resolution)."""
    H = p.bbox[3] - p.bbox[1]
    r = max(1, int(frac * H / 2))
    yy, xx = np.ogrid[-r: r + 1, -r: r + 1]
    disk = (xx * xx + yy * yy) <= r * r
    o = ndi.binary_opening(p.alpha[::2, ::2], structure=disk)
    big = np.kron(o, np.ones((2, 2), bool))
    out = np.zeros((p.h, p.w), bool)
    out[: big.shape[0], : big.shape[1]] = big[: p.h, : p.w]
    return out


def stance_from_hem(p: Painting, frac: float = 0.02):
    """The middle of the lowest thick part of the silhouette (boots or a hem; thin blades, staffs and tails are opened away)."""
    o = opened(p, frac)
    rows = np.nonzero(o.sum(1) >= 2)[0]
    if len(rows) == 0:
        return None
    fb = int(rows.max())
    band = max(4, int(0.03 * (p.bbox[3] - p.bbox[1])))
    cols = np.nonzero(o[max(0, fb - band): fb + 1].any(0))[0]
    return dict(x=float((cols.min() + cols.max() + 1) / 2), row=float(fb + 1), x0=float(cols.min()), x1=float(cols.max() + 1), area=0)


def auto_idle_seed(p: Painting):
    """A point in the head of an upright idle painting, and a guess of the head's size: the topmost thick part of the silhouette
    (blades, staffs and hair spikes are opened away). Wrong for beasts and for figures with a thick weapon above the head: those
    get a hand seed in subjects.json."""
    H = p.bbox[3] - p.bbox[1]
    o = opened(p, 0.035)
    rows = np.nonzero(o.sum(1) >= 2)[0]
    if len(rows) == 0:
        return None
    t = int(rows.min())
    band = np.zeros_like(o)
    band[t: t + int(0.16 * H)] = o[t: t + int(0.16 * H)]
    lab, n = ndi.label(band)
    if n == 0:
        return None
    sizes = ndi.sum(band, lab, range(1, n + 1))
    k = int(np.argmax(sizes)) + 1
    ys, xs = np.nonzero(lab == k)
    return dict(x=float(xs.mean()), y=float(ys.mean()), wh=0.17 * H, top=float(ys.min()))


def auto_top_seed(p: Painting, wh: float):
    """A proposal for any pose: the topmost thick part of the silhouette, as for the idle (auto_idle_seed). Good for an upright
    figure with nothing raised above its head; the sheet shows it and the reviewer fixes the rest."""
    a = auto_idle_seed(p)
    return None if a is None else [a["x"], a["y"]]


def auto_top_anchor(p: Painting):
    """The hair-top centre proposal for any pose: the top of the topmost thick part of the silhouette and its centre column."""
    a = auto_idle_seed(p)
    return None if a is None else [a["x"], a["top"]]
