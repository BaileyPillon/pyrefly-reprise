"""Review sheets for the pose scale measurement: every pose's head drawn at the size the table would give it, in one reference
rectangle (the idle's head box), and every pose's stance registered on the idle's. A reviewer looks for a head that overflows or
underfills the rectangle (that is the percentage the pose is off) and for a stance line that is not on the tile's centre line.
"""
from __future__ import annotations

import math

import numpy as np
from PIL import Image, ImageDraw

from ps_lib import CHAR, head_size


def _bg(subject: str, pose: str) -> Image.Image:
    im = Image.open(CHAR / subject / f"{pose}.png").convert("RGBA")
    bg = Image.new("RGBA", im.size, (110, 114, 124, 255))
    bg.alpha_composite(im)
    return bg


def head_tile(subject: str, pose: str, box, ref_box, cell: int = 380, factor: float | None = None, label: str = "") -> Image.Image:
    f = factor if factor is not None else head_size(ref_box) / head_size(box)
    bg = _bg(subject, pose)
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    rw, rh = ref_box[2] - ref_box[0], ref_box[3] - ref_box[1]
    span = max(rw, rh) * 1.7
    k = cell / span
    half = span / f / 2
    crop = bg.crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half))).resize((cell, cell), Image.LANCZOS)
    d = ImageDraw.Draw(crop)
    x0, y0, x1, y1 = cell / 2 - rw * k / 2, cell / 2 - rh * k / 2, cell / 2 + rw * k / 2, cell / 2 + rh * k / 2
    d.rectangle([x0, y0, x1, y1], outline=(255, 40, 90), width=2)
    for t in range(1, 10):  # ticks every 10% of the rectangle, on the left and the bottom edges
        d.line([(x0 - 6, y0 + (y1 - y0) * t / 10), (x0, y0 + (y1 - y0) * t / 10)], fill=(255, 255, 255))
        d.line([(x0 + (x1 - x0) * t / 10, y1), (x0 + (x1 - x0) * t / 10, y1 + 6)], fill=(255, 255, 255))
    d.text((4, 3), f"{label or pose}  x{f:.3f}", fill=(255, 255, 0))
    return crop


def head_sheet(subject: str, heads: dict, out: str, cols: int = 5, factors: dict | None = None) -> None:
    ref = heads["idle"]
    names = ["idle"] + sorted(n for n in heads if n != "idle" and heads[n])
    tiles = [head_tile(subject, n, heads[n], ref, factor=(factors or {}).get(n)) for n in names]
    cell = tiles[0].width
    rows = math.ceil(len(tiles) / cols)
    sheet = Image.new("RGB", (cols * (cell + 6), rows * (cell + 6)), (24, 24, 28))
    for i, t in enumerate(tiles):
        sheet.paste(t.convert("RGB"), ((i % cols) * (cell + 6), (i // cols) * (cell + 6)))
    sheet.save(out, quality=88)


def stance_tile(subject: str, pose: str, stance: dict, factor: float, ref_h: float, cell_w: int = 420, cell_h: int = 300, label: str = "") -> Image.Image:
    """The lower body at the table's scale, the stance on the tile's vertical centre line, the feet row on a horizontal line."""
    bg = _bg(subject, pose)
    span_w = 760.0  # idle pixels across the tile
    k = cell_w / span_w
    cw, ch = span_w / factor, (cell_h / k) / factor
    x0, y1 = stance["x"] - cw / 2, stance["row"] + 50 / factor
    crop = bg.crop((int(x0), int(y1 - ch), int(x0 + cw), int(y1))).resize((cell_w, cell_h), Image.LANCZOS)
    d = ImageDraw.Draw(crop)
    d.line([(cell_w / 2, 0), (cell_w / 2, cell_h)], fill=(255, 40, 90), width=1)
    fy = cell_h - 50 * k
    d.line([(0, fy), (cell_w, fy)], fill=(0, 255, 255), width=1)
    d.text((4, 3), f"{label or pose}  x{factor:.3f}", fill=(255, 255, 0))
    return crop


def stance_sheet(subject: str, stances: dict, factors: dict, out: str, cols: int = 5) -> None:
    names = ["idle"] + sorted(n for n in stances if n != "idle" and stances[n])
    tiles = [stance_tile(subject, n, stances[n], factors.get(n, 1.0), 1.0) for n in names]
    cw, ch = tiles[0].size
    rows = math.ceil(len(tiles) / cols)
    sheet = Image.new("RGB", (cols * (cw + 6), rows * (ch + 6)), (24, 24, 28))
    for i, t in enumerate(tiles):
        sheet.paste(t.convert("RGB"), ((i % cols) * (cw + 6), (i // cols) * (ch + 6)))
    sheet.save(out, quality=88)


def seed_sheet(subject: str, seeds: dict, sizes: dict, out: str, zoom: float = 0.55, cols: int = 4, poses: list | None = None, crop: float = 0.62) -> None:
    """The upper part of every pose (the whole painting when it is prone) at one zoom with a 50 px grid, labelled every 100 in
    painting pixels, and the seed circle where there is one: to confirm a proposal or read a seed by eye."""
    names = poses if poses is not None else sorted(seeds)
    tiles = []
    for n in names:
        bg = _bg(subject, n)
        h_keep = bg.height if bg.width > bg.height * 1.15 else int(bg.height * crop)
        bg = bg.crop((0, 0, bg.width, h_keep)) if h_keep < bg.height else bg
        t = bg.resize((round(bg.width * zoom), round(bg.height * zoom)), Image.LANCZOS)
        d = ImageDraw.Draw(t)
        for gx in range(50, bg.width, 50):
            major = gx % 100 == 0
            d.line([(gx * zoom, 0), (gx * zoom, t.height)], fill=(255, 255, 0, 255) if gx % 500 == 0 else (255, 255, 0, 120 if major else 55))
            if major:
                d.text((gx * zoom + 2, 2), str(gx), fill=(255, 255, 255))
        for gy in range(50, bg.height, 50):
            major = gy % 100 == 0
            d.line([(0, gy * zoom), (t.width, gy * zoom)], fill=(0, 255, 255, 255) if gy % 500 == 0 else (0, 255, 255, 120 if major else 55))
            if major:
                d.text((2, gy * zoom + 2), str(gy), fill=(255, 255, 255))
        sd = (seeds or {}).get(n)
        if sd:
            r = (sizes.get(n) or 90) / 2 * zoom
            d.ellipse([sd[0] * zoom - r, sd[1] * zoom - r, sd[0] * zoom + r, sd[1] * zoom + r], outline=(255, 0, 90), width=2)
            d.text((sd[0] * zoom + r + 2, sd[1] * zoom - 6), f"{sd[0]:.0f},{sd[1]:.0f}", fill=(255, 0, 90))
        tiles.append((n, t, (bg.width, bg.height)))
    cw = max(t.width for _, t, _ in tiles) + 8
    ch = max(t.height for _, t, _ in tiles) + 20
    rows = math.ceil(len(tiles) / cols)
    sheet = Image.new("RGB", (cw * cols, ch * rows), (30, 30, 30))
    d = ImageDraw.Draw(sheet)
    for i, (n, t, sz) in enumerate(tiles):
        x, y = (i % cols) * cw, (i // cols) * ch
        sheet.paste(t.convert("RGB"), (x, y + 16))
        d.text((x + 4, y + 2), f"{n} {sz[0]}x{sz[1]}", fill=(255, 255, 0))
    sheet.save(out, quality=86)


CAND_COLOURS = [(255, 60, 100), (60, 230, 120), (255, 205, 40), (90, 160, 255), (255, 120, 220), (60, 230, 230), (255, 140, 40), (255, 255, 255)]


def cand_tile(subject: str, pose: str, cands: list, ref_size: float, cell: int = 440) -> Image.Image:
    """The head region with every candidate box and its letter, the scale each would give, and a thumbnail of the whole painting."""
    bg = _bg(subject, pose)
    if cands:
        x0 = min(c["box"][0] for c in cands); y0 = min(c["box"][1] for c in cands)
        x1 = max(c["box"][2] for c in cands); y1 = max(c["box"][3] for c in cands)
    else:
        x0, y0, x1, y1 = 0, 0, bg.width, bg.height
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    side = max(x1 - x0, y1 - y0) * 1.5 + 40
    crop = bg.crop((int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))).resize((cell, cell), Image.LANCZOS)
    k = cell / side
    d = ImageDraw.Draw(crop)
    for i, c in enumerate(cands):
        col = CAND_COLOURS[i % len(CAND_COLOURS)]
        b = c["box"]
        bx0, by0, bx1, by1 = (b[0] - (cx - side / 2)) * k, (b[1] - (cy - side / 2)) * k, (b[2] - (cx - side / 2)) * k, (b[3] - (cy - side / 2)) * k
        d.rectangle([bx0, by0, bx1, by1], outline=col, width=2)
        d.rectangle([bx0, by0, bx0 + 12, by0 + 13], fill=col)
        d.text((bx0 + 3, by0 + 1), c["id"], fill=(0, 0, 0))
    legend = "  ".join(f"{c['id']} x{ref_size / c['size']:.2f}" for c in cands)
    d.rectangle([0, 0, cell, 16], fill=(20, 20, 24))
    d.text((4, 2), f"{pose}   {legend}", fill=(255, 255, 0))
    # thumbnail of the whole painting with the crop marked
    tw = 84
    th = max(10, int(bg.height * tw / bg.width))
    if th > 120:
        th, tw = 120, int(bg.width * 120 / bg.height)
    th_im = bg.resize((tw, th), Image.LANCZOS)
    td = ImageDraw.Draw(th_im)
    td.rectangle([(cx - side / 2) * tw / bg.width, (cy - side / 2) * th / bg.height, (cx + side / 2) * tw / bg.width, (cy + side / 2) * th / bg.height], outline=(255, 0, 90), width=1)
    crop.paste(th_im, (cell - tw - 2, 18))
    return crop


def cand_sheet(subject: str, per_pose: dict, ref_size: float, out_prefix: str, cols: int = 3, rows: int = 2) -> list:
    names = sorted(per_pose)
    tiles = [cand_tile(subject, n, per_pose[n], ref_size) for n in names]
    cell = tiles[0].width if tiles else 380
    per = cols * rows
    outs = []
    for bi in range(0, len(tiles), per):
        chunk = tiles[bi: bi + per]
        r = math.ceil(len(chunk) / cols)
        sheet = Image.new("RGB", (cols * (cell + 6), r * (cell + 6)), (24, 24, 28))
        for i, t in enumerate(chunk):
            sheet.paste(t.convert("RGB"), ((i % cols) * (cell + 6), (i // cols) * (cell + 6)))
        out = f"{out_prefix}-{bi // per + 1}.jpg"
        sheet.save(out, quality=88)
        outs.append(out)
    return outs


RULER_SCALES = (0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.4, 1.6, 1.85)
RULER_COLOURS = [(255, 70, 70), (255, 140, 40), (255, 210, 40), (200, 235, 60), (255, 255, 255), (90, 235, 130), (60, 225, 225), (80, 160, 255), (170, 120, 255), (255, 110, 220)]


def ruler_tile(subject: str, pose: str, centre: list, ref_wh: tuple, cell: int = 420, label: str = "") -> Image.Image:
    """A pose's head region at a fixed zoom (the same for every pose of a subject) with ten concentric rulers: the idle's head box
    grown or shrunk to the size it would have at each scale, centred on the anchor. A head whose hair-to-hair width and hair-top-
    to-chin height fill a ruler snugly needs that scale (white is 1.00: the head is as big as the idle's)."""
    bg = _bg(subject, pose)
    bw, bh = ref_wh
    side = max(bw, bh) * 3.0
    cx, cy = centre
    x0, y0 = cx - side / 2, cy - side / 2
    pad = Image.new("RGBA", (bg.width + 2400, bg.height + 2400), (60, 60, 66, 255))
    pad.paste(bg, (1200, 1200))
    crop = pad.crop((int(x0) + 1200, int(y0) + 1200, int(x0) + 1200 + int(side), int(y0) + 1200 + int(side))).resize((cell, cell), Image.LANCZOS)
    k = cell / side
    d = ImageDraw.Draw(crop)
    for i, sc in enumerate(RULER_SCALES):
        w, h = bw / sc, bh / sc
        r = [(cx - w / 2 - x0) * k, (cy - h / 2 - y0) * k, (cx + w / 2 - x0) * k, (cy + h / 2 - y0) * k]
        col = RULER_COLOURS[i]
        d.rectangle(r, outline=col, width=3 if abs(sc - 1.0) < 1e-6 else 1)
        d.text((r[0] + 2, r[1] + 1), f"{sc:.2f}", fill=col)
    d.line([(cell / 2 - 6, cell / 2), (cell / 2 + 6, cell / 2)], fill=(255, 255, 255))
    d.line([(cell / 2, cell / 2 - 6), (cell / 2, cell / 2 + 6)], fill=(255, 255, 255))
    d.rectangle([0, 0, cell, 15], fill=(20, 20, 24))
    d.text((4, 2), f"{label or pose}   centre {cx:.0f},{cy:.0f}", fill=(255, 255, 0))
    return crop


def ruler_sheet(subject: str, centres: dict, ref_wh: tuple, out_prefix: str, cols: int = 4, rows: int = 2) -> list:
    names = sorted(centres, key=lambda n: (n != "idle", n))
    tiles = [ruler_tile(subject, n, centres[n], ref_wh) for n in names if centres[n]]
    cell = tiles[0].width if tiles else 420
    per = cols * rows
    outs = []
    for bi in range(0, len(tiles), per):
        chunk = tiles[bi: bi + per]
        r = math.ceil(len(chunk) / cols)
        sheet = Image.new("RGB", (cols * (cell + 4), r * (cell + 4)), (24, 24, 28))
        for i, t in enumerate(chunk):
            sheet.paste(t.convert("RGB"), ((i % cols) * (cell + 4), (i // cols) * (cell + 4)))
        out = f"{out_prefix}-{bi // per + 1}.jpg"
        sheet.save(out, quality=88)
        outs.append(out)
    return outs
