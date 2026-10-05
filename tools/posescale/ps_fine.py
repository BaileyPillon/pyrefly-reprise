"""Review sheets for the head readings (r391-posescale; both games, art tooling only).

`fine_sheet`: every pose at the on-screen scale the engine will draw it at (one painting pixel = `s0` idle pixels), the idle's face box on it with a tick for every
5 percent it would grow or shrink on its four sides, and the idle's own face at the same scale beside it (`ref_panel`): the face the pose's face is read against.
`thumb_sheet`: every pose's upper part with a ruling in painting pixels, to read a hand anchor (the face centre) off. `point_tile`: a tile with marks (the
irises the eye finder used) drawn on it, to check the finder by eye. `proposal_anchor`: a first guess of where the face is, from the idle's own geometry.
"""
from __future__ import annotations

import math
import pathlib

from PIL import Image, ImageDraw

import ps_lib as L

RULER_MAJOR = (255, 230, 0)
RULER_A = (0, 235, 255)
RULER_B = (255, 80, 200)


def proposal_anchor(subject: str, pose: str, face: list, s0: float) -> list | None:
    """Where the face probably is in `pose`: the topmost thick part of the figure plus the idle's own vector from there to its face, scaled to the pose."""
    idle = L.Painting(subject, "idle")
    ia = L.auto_top_anchor(idle)
    if ia is None:
        return None
    fc = [(face[0] + face[2]) / 2, (face[1] + face[3]) / 2]
    v = [fc[0] - ia[0], fc[1] - ia[1]]
    p = L.Painting(subject, pose)
    if p.prone:
        x0, y0, x1, y1 = p.bbox
        return [x1 - 0.14 * (x1 - x0), y0 + 0.3 * (y1 - y0)]
    a = L.auto_top_anchor(p)
    if a is None:
        return None
    return [a[0] + v[0] / s0, a[1] + v[1] / s0]


def _bg(subject: str, pose: str) -> Image.Image:
    im = Image.open(L.CHAR / subject / f"{pose}.png").convert("RGBA")
    bg = Image.new("RGBA", im.size, (110, 114, 124, 255))
    bg.alpha_composite(im)
    return bg


def fine_tile(subject: str, pose: str, centre, face: list, s0: float, cell: int = 420, label: str = "", window: float = 2.6, cue: dict | None = None) -> Image.Image:
    """The pose at the engine's on-screen scale `s0` in a window of `window` idle face sizes, centred on `centre`, the idle's face box (1.00, yellow) and, on its four sides, a tick
    for every 5 percent the box would grow (outward, magenta, labelled 1.10 and 1.20) or shrink (inward, cyan, 0.90 and 0.80): the ruler a face fills is read off the ticks nearest its edges."""
    fw, fh = face[2] - face[0], face[3] - face[1]
    span = window * max(fw, fh)  # idle pixels across the tile
    k = cell / span
    half = span / s0 / 2  # painting pixels
    crop = _bg(subject, pose).crop((int(round(centre[0] - half)), int(round(centre[1] - half)), int(round(centre[0] + half)), int(round(centre[1] + half)))).resize((cell, cell), Image.LANCZOS)
    d = ImageDraw.Draw(crop)
    cx, cy = cell / 2, cell / 2
    d.rectangle([cx - fw * k / 2, cy - fh * k / 2, cx + fw * k / 2, cy + fh * k / 2], outline=RULER_MAJOR, width=2)
    for i in range(-4, 6):  # -20 percent .. +25 percent
        if i == 0:
            continue
        r = 1.0 + 0.05 * i
        col = RULER_B if i > 0 else RULER_A
        ln = 9 if i % 2 == 0 else 5
        x, y = fw * r * k / 2, fh * r * k / 2
        for sx in (-1, 1):
            d.line([(cx + sx * x, cy - ln), (cx + sx * x, cy + ln)], fill=col, width=1)
        for sy in (-1, 1):
            d.line([(cx - ln, cy + sy * y), (cx + ln, cy + sy * y)], fill=col, width=1)
        if i % 2 == 0:
            d.text((cx + x + 2, cy - 14), f"{r:.2f}", fill=col)
    d.rectangle([0, 0, cell, 13], fill=(0, 0, 0))
    extra = ("   eyes: " + " ".join(f"{k_} x{v:.2f}" for k_, v in cue.items() if isinstance(v, (int, float)))) if cue else ""
    d.text((4, 1), f"{label or pose}  s0={s0:.3f}{extra}", fill=(255, 255, 0))
    return crop


def ref_panel(subject: str, face: list, k: float, size: int) -> Image.Image:
    """The idle's own face at the tile's scale `k` (screen px per idle px), box in yellow, `size` px square: what every tile is read against, drawn BESIDE the tile."""
    fw, fh = face[2] - face[0], face[3] - face[1]
    ic = [(face[0] + face[2]) / 2, (face[1] + face[3]) / 2]
    ih = size / k / 2
    im = _bg(subject, "idle").crop((int(round(ic[0] - ih)), int(round(ic[1] - ih)), int(round(ic[0] + ih)), int(round(ic[1] + ih)))).resize((size, size), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    d.rectangle([size / 2 - fw * k / 2, size / 2 - fh * k / 2, size / 2 + fw * k / 2, size / 2 + fh * k / 2], outline=RULER_MAJOR, width=2)
    d.rectangle([0, 0, size, 13], fill=(0, 0, 0))
    d.text((3, 1), "idle (reference)", fill=(255, 255, 255))
    return im


def fine_sheet(subject: str, items: list, face: list, out: pathlib.Path, per: int = 6, cols: int = 2, cell: int = 420, window: float = 2.8, cues: dict | None = None) -> list[str]:
    """items: [(pose, centre, s0)]. Each pose is a tile (see fine_tile) with the idle's face at the same scale to its left, so the two faces are compared side by side."""
    fw, fh = face[2] - face[0], face[3] - face[1]
    k = cell / (window * max(fw, fh))
    panel = int(cell * 0.46)
    files = []
    for bi in range(0, len(items), per):
        part = items[bi: bi + per]
        rows = math.ceil(len(part) / cols)
        cw = panel + cell + 6
        sheet = Image.new("RGB", (cols * cw, rows * (cell + 4)), (20, 20, 24))
        for i, (p, c, s0) in enumerate(part):
            x, y = (i % cols) * cw, (i // cols) * (cell + 4)
            sheet.paste(ref_panel(subject, face, k, panel), (x, y + (cell - panel) // 2))
            sheet.paste(fine_tile(subject, p, c, face, s0, cell=cell, window=window, cue=(cues or {}).get(p)), (x + panel + 2, y))
        f = out / f"{subject}-fine-{bi // per + 1}.jpg"
        sheet.save(f, quality=88)
        files.append(str(f))
    return files


def thumb_sheet(subject: str, poses: list, out: pathlib.Path, anchors: dict | None = None, cell: int = 430, cols: int = 3, top: float = 0.55) -> str:
    """Every pose's painting (its upper `top` part when it is upright, all of a lying one) fitted to a tile with a ruling in the painting's own pixels: a line every 50, stronger and
    labelled every 100 (x along the top, y down the left), so a face centre is read straight off as pixels for anchors.json. A known anchor is a green cross."""
    tiles = []
    for pose in poses:
        bg = _bg(subject, pose)
        keep = top if bg.height > bg.width * 1.15 else 1.0
        view = bg.crop((0, 0, bg.width, max(8, int(bg.height * keep))))
        k = (cell - 16) / max(view.width, view.height)
        t = view.resize((max(8, int(view.width * k)), max(8, int(view.height * k))), Image.LANCZOS).convert("RGB")
        d = ImageDraw.Draw(t, "RGBA")
        for gx in range(50, view.width, 50):
            major = gx % 100 == 0
            d.line([(gx * k, 0), (gx * k, t.height)], fill=(255, 235, 0, 110 if major else 45), width=1)
            if major:
                d.text((gx * k + 1, 1), str(gx), fill=(255, 255, 255, 255))
        for gy in range(50, view.height, 50):
            major = gy % 100 == 0
            d.line([(0, gy * k), (t.width, gy * k)], fill=(0, 235, 255, 110 if major else 45), width=1)
            if major:
                d.text((1, gy * k + 1), str(gy), fill=(255, 255, 255, 255))
        a = (anchors or {}).get(pose)
        if a:
            cx, cy = a[0] * k, a[1] * k
            d.line([(cx - 7, cy), (cx + 7, cy)], fill=(60, 255, 90, 255), width=2)
            d.line([(cx, cy - 7), (cx, cy + 7)], fill=(60, 255, 90, 255), width=2)
        d.rectangle([0, t.height - 12, t.width, t.height], fill=(0, 0, 0, 170))
        d.text((3, t.height - 11), f"{pose} {bg.width}x{bg.height}", fill=(255, 255, 0, 255))
        canvas = Image.new("RGB", (cell, cell), (20, 20, 24))
        canvas.paste(t, (0, 0))
        tiles.append(canvas)
    rows = math.ceil(len(tiles) / cols)
    sheet = Image.new("RGB", (cols * (cell + 4), rows * (cell + 4)), (20, 20, 24))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * (cell + 4), (i // cols) * (cell + 4)))
    sheet.save(out, quality=86)
    return str(out)


def point_tile(subject: str, pose: str, centre, face: list, s0: float, cell: int = 330, window: float = 2.8, label: str = "", marks: list | None = None, grid: int = 100) -> Image.Image:
    """A tile with marks drawn on it: the pose at the engine's scale `s0`, the idle's face box in red at the centre, a grid in idle pixels and `marks` ([(x, y, colour, text)] in idle pixels
    from the tile centre) as crosses. Used to check by eye where the eye finder put the irises it measured the eye spacing from."""
    fw, fh = face[2] - face[0], face[3] - face[1]
    span = window * max(fw, fh)
    k = cell / span
    half = span / s0 / 2
    crop = _bg(subject, pose).crop((int(round(centre[0] - half)), int(round(centre[1] - half)), int(round(centre[0] + half)), int(round(centre[1] + half)))).resize((cell, cell), Image.LANCZOS)
    d = ImageDraw.Draw(crop, "RGBA")
    c = cell / 2
    n = int(span / 2 / grid) + 1
    for i in range(-n, n + 1):
        v = c + i * grid * k
        if 14 <= v <= cell:
            d.line([(0, v), (cell, v)], fill=(0, 235, 255, 90), width=1)
        if 0 <= v <= cell:
            d.line([(v, 14), (v, cell)], fill=(255, 235, 0, 90), width=1)
    d.rectangle([c - fw * k / 2, c - fh * k / 2, c + fw * k / 2, c + fh * k / 2], outline=(255, 60, 60, 255), width=2)
    for x, y, col, text in marks or []:
        px, py = c + x * k, c + y * k
        d.line([(px - 6, py), (px + 6, py)], fill=col + (255,), width=2)
        d.line([(px, py - 6), (px, py + 6)], fill=col + (255,), width=2)
        if text:
            d.text((px + 7, py - 5), text, fill=col + (255,))
    d.rectangle([0, 0, cell, 13], fill=(0, 0, 0, 230))
    d.text((4, 1), f"{label or pose}  s0={s0:.3f}", fill=(255, 255, 0, 255))
    return crop.convert("RGB")
