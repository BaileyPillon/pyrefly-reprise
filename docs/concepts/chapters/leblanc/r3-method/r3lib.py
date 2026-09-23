"""Art method r3 pilot (FFX-2 only, chapter 6 Leblanc): shared numpy helpers.

Colour maths for the gates (sRGB D65 -> CIE Lab, CIEDE2000), Lab quantile stats,
and the scratch paths. numpy + PIL only, so both pythons can import it:
ComfyUI's embedded python (SAM, scipy) and the sd-scripts venv (OpenCV).
Nothing here writes under public/.
"""
from __future__ import annotations

import json
import pathlib

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[4]
SCR = pathlib.Path("D:/Tools/pyrefly-lora/leblanc/r3")
IDLE = SCR / "idle.png"          # byte copy of public/art/characters/leblanc/idle.png (sha in anchors-before.sha256)
CAST = SCR / "cast.r2.2.png"     # byte copy of the installed cast.png = cast.r2.2 ...nk1.sm82302
ATLAS = SCR / "atlas"


def load_rgba(p) -> np.ndarray:
    return np.asarray(Image.open(p).convert("RGBA")).astype(np.float32)


def save_rgba(a, p) -> None:
    pathlib.Path(p).parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(np.rint(a), 0, 255).astype(np.uint8), "RGBA").save(p)


def save_l(m, p) -> None:
    pathlib.Path(p).parent.mkdir(parents=True, exist_ok=True)
    m = np.asarray(m, np.float32)
    if m.max() <= 1.0:
        m = m * 255
    Image.fromarray(np.clip(np.rint(m), 0, 255).astype(np.uint8), "L").save(p)


def load_mask(p) -> np.ndarray:
    return np.asarray(Image.open(p).convert("L")) > 127


def rgb2lab(rgb: np.ndarray) -> np.ndarray:
    """rgb 0..255 (..., 3) -> Lab (L 0..100)."""
    c = np.asarray(rgb, np.float64) / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > (6 / 29) ** 3, np.cbrt(xyz), xyz / (3 * (6 / 29) ** 2) + 4 / 29)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def lab2rgb(lab: np.ndarray) -> np.ndarray:
    lab = np.asarray(lab, np.float64)
    fy = (lab[..., 0] + 16) / 116
    fx = fy + lab[..., 1] / 500
    fz = fy - lab[..., 2] / 200
    inv = lambda f: np.where(f > 6 / 29, f ** 3, 3 * (6 / 29) ** 2 * (f - 4 / 29))
    xyz = np.stack([inv(fx), inv(fy), inv(fz)], -1) * np.array([0.95047, 1.0, 1.08883])
    Mi = np.array([[3.2404542, -1.5371385, -0.4985314], [-0.9692660, 1.8760108, 0.0415560], [0.0556434, -0.2040259, 1.0572252]])
    c = xyz @ Mi.T
    c = np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
    return np.clip(c * 255, 0, 255)


def de2000(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """CIEDE2000 between Lab arrays (..., 3)."""
    L1, a1, b1 = a[..., 0], a[..., 1], a[..., 2]
    L2, a2, b2 = b[..., 0], b[..., 1], b[..., 2]
    C1 = np.hypot(a1, b1); C2 = np.hypot(a2, b2)
    Cb = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p = (1 + G) * a1; a2p = (1 + G) * a2
    C1p = np.hypot(a1p, b1); C2p = np.hypot(a2p, b2)
    h1p = np.degrees(np.arctan2(b1, a1p)) % 360; h2p = np.degrees(np.arctan2(b2, a2p)) % 360
    dLp = L2 - L1; dCp = C2p - C1p
    dh = h2p - h1p
    dh = np.where(C1p * C2p == 0, 0, np.where(dh > 180, dh - 360, np.where(dh < -180, dh + 360, dh)))
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2))
    Lbp = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    hs = h1p + h2p
    hbp = np.where(C1p * C2p == 0, hs, np.where(np.abs(h1p - h2p) <= 180, hs / 2, np.where(hs < 360, (hs + 360) / 2, (hs - 360) / 2)))
    T = 1 - 0.17 * np.cos(np.radians(hbp - 30)) + 0.24 * np.cos(np.radians(2 * hbp)) + 0.32 * np.cos(np.radians(3 * hbp + 6)) - 0.20 * np.cos(np.radians(4 * hbp - 63))
    dth = 30 * np.exp(-(((hbp - 275) / 25) ** 2))
    Rc = 2 * np.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lbp - 50) ** 2 / np.sqrt(20 + (Lbp - 50) ** 2)
    Sc = 1 + 0.045 * Cbp; Sh = 1 + 0.015 * Cbp * T
    Rt = -np.sin(np.radians(2 * dth)) * Rc
    return np.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))


def lab_stats(rgba: np.ndarray, m: np.ndarray) -> dict:
    sel = m & (rgba[..., 3] > 127)
    if not sel.any():
        return {"px": 0}
    lab = rgb2lab(rgba[..., :3][sel])
    q = np.percentile(lab[:, 0], [5, 25, 50, 75, 95])
    return {"px": int(sel.sum()), "L": [round(float(v), 2) for v in q],
            "a": [round(float(lab[:, 1].mean()), 2), round(float(lab[:, 1].std()), 2)],
            "b": [round(float(lab[:, 2].mean()), 2), round(float(lab[:, 2].std()), 2)],
            "median": [round(float(np.median(lab[:, k])), 2) for k in range(3)]}


def write_json(o, p) -> None:
    pathlib.Path(p).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(p).write_text(json.dumps(o, indent=1))


def read_json(p):
    return json.loads(pathlib.Path(p).read_text())
