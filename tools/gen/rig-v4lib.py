"""Shared helpers for the living-portrait v4 rig (FFX-2 only): the keys, their
landmarks, the plate's tassel moved with the ear, the repaint masks, and the
colour tests the mask and layer tools share. Loaded by path like rig-lib.py.
"""
from __future__ import annotations

import importlib.util
import math
import pathlib

import numpy as np
from scipy import ndimage as ndi

HERE = pathlib.Path(__file__).resolve().parent
_s = importlib.util.spec_from_file_location("riglib", HERE / "rig-lib.py")
L = importlib.util.module_from_spec(_s); _s.loader.exec_module(L)
_i = importlib.util.spec_from_file_location("riginit", HERE / "rig-lora-init.py")
I = importlib.util.module_from_spec(_i); _i.loader.exec_module(I)

V4 = L.ART / "v4"
# intermediates (work images, inpaint jobs and their outputs, the finished keys as PNG) live
# outside the repo; the finished keys are also committed as lossless webp in art/v4/keys/final/
SCRATCH = pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v4")
W, H = 832, 1216
YAWS = [-85, -60, -40, -20, 0, 20, 40, 60, 85]
NAMES = {y: ("yaw0" if y == 0 else f"yaw{y:+d}") for y in YAWS}
IDS = {y: ("frontal" if y == 0 else f"v4-{'l' if y < 0 else 'r'}{abs(y)}") for y in YAWS}
# Each key was painted from the plate turned to its AIM yaw (keys.md section 7: 20 from 25,
# 40 from 48); the tassel was pasted there, so its offset is ear_shift(aim). Measured on the
# keys by template match: -20 -> +12, +20 -> +30, +40 -> +88, +60 -> +128, +85 -> +223 px.
AIM = {-85: -85, -60: -60, -40: -48, -20: -25, 0: 0, 20: 25, 40: 48, 60: 60, 85: 85}


def ear_shift(yaw: float) -> int:
    x, _ = I.rot(I.EAR[0], I.EAR[2], math.radians(yaw))
    return int(round(x - I.EAR[0]))


TASSEL_DX = {y: ear_shift(AIM[y]) for y in YAWS}


def tassel_visible(yaw: int) -> bool:
    return yaw >= -20


def key_path(yaw: int, src: str = "final") -> pathlib.Path:
    if yaw == 0:
        return L.PLATE
    if src in ("final", "notassel"):
        stem = NAMES[yaw] + (".notassel" if src == "notassel" else "")
        for p in (SCRATCH / "final" / f"{stem}.png", V4 / "keys/final" / f"{stem}.webp"):
            if p.exists():
                return p
    return V4 / "keys/picked" / L.read_json(V4 / "keys/picks-rig.json")[str(yaw)]


def key_rgb(yaw: int, src: str = "final") -> np.ndarray:
    """The key flattened on white (the plate is RGBA; the keys were painted on white)."""
    im = L.load_rgba(key_path(yaw, src))
    a = im[..., 3:4] / 255.0
    return im[..., :3] * a + 255.0 * (1 - a)


def landmarks(yaw: int) -> dict[str, tuple[float, float]]:
    spec = L.read_json(V4 / "warp/landmarks.json")
    return {n: tuple(p) for n, p in zip(spec["order"], spec["keys"][str(yaw)])}


def repaint_mask(yaw: int) -> np.ndarray:
    """Where the key's sampler could paint (the rest is the plate to the pixel)."""
    if yaw == 0:
        return np.ones((H, W), bool)
    return L.load_l(V4 / "keys/repaint" / f"{NAMES[yaw]}.png") > 0.02


def plate_layers() -> dict:
    r = L.read_json(L.ART / "rig.json")
    return {l["name"]: l for l in r["artMeta"]["v3"]["frontal"]["layers"]}


def plate_earring() -> tuple[np.ndarray, int, int]:
    e = plate_layers()["earring"]
    return L.load_rgba(L.ART / e["file"]), int(e["box"][0]), int(e["box"][1])


def placed_alpha(meta: dict, dx: int = 0) -> np.ndarray:
    im = L.load_rgba(L.ART / meta["file"])[..., 3] / 255.0
    out = np.zeros((H, W), np.float32)
    x, y = int(meta["box"][0]) + dx, int(meta["box"][1])
    h, w = im.shape
    xa, xb, ya, yb = max(0, x), min(W, x + w), max(0, y), min(H, y + h)
    if xb > xa and yb > ya:
        out[ya:yb, xa:xb] = im[ya - y:yb - y, xa - x:xb - x]
    return out


def tassel_footprint(yaw: int) -> np.ndarray:
    """The plate's earring alpha (0..1) moved with her right ear to this key."""
    return placed_alpha(plate_layers()["earring"], TASSEL_DX[yaw])


def body_alpha() -> np.ndarray:
    return placed_alpha(plate_layers()["body"])


def hsv(rgb):
    from skimage import color
    return color.rgb2hsv(np.clip(rgb / 255.0, 0, 1))


def tests(rgb):
    s = hsv(ndi.median_filter(rgb, size=(5, 5, 1)))
    h, sat, v = s[..., 0] * 360, s[..., 1], s[..., 2]
    skin = ((h < 40) | (h > 340)) & (sat > 0.08) & (sat < 0.55) & (v > 0.62)
    hair = (h > 8) & (h < 45) & (sat > 0.4) & (v > 0.3) & (v < 0.9)
    white = (v > 0.93) & (sat < 0.06)
    return skin, hair, white


def background(rgb) -> np.ndarray:
    """Near-white connected to the frame's top, left or right edge (the painted backdrop)."""
    _, _, white = tests(rgb)
    lab, _ = ndi.label(white)
    edge = np.unique(np.concatenate([lab[0], lab[:900, 0], lab[:900, -1]]))
    return np.isin(lab, edge[edge > 0])


def neck_mask(rgb, face: np.ndarray) -> np.ndarray:
    """Skin below the face's own lower edge (per column): the neck the pinned body carries."""
    skin, _, _ = tests(rgb)
    cols = np.nonzero(face.any(0))[0]
    below = np.zeros_like(face)
    for x in cols:
        y = np.nonzero(face[:, x])[0].max()
        below[y + 1:, x] = True
    # beside the face too: the neck is wider than the chin
    xs = np.arange(W)
    left, right = cols.min(), cols.max()
    ybot = min(H - 1, int(np.nonzero(face.any(1))[0].max()))
    side = (xs[None, :] >= left - 60) & (xs[None, :] <= right + 60) & (np.arange(H)[:, None] > ybot - 40)
    lab, _ = ndi.label(skin & (below | side))
    seeds = np.unique(lab[below & skin])
    return np.isin(lab, seeds[seeds > 0])
