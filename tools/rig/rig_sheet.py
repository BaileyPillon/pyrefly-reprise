"""Step 5, sheet: a contact sheet per subject, each key next to its approved painting, with the numbers.

    python rig.py sheet --subject kimahri [--out sheet.png]

Per key, three tiles: the APPROVED painting of the pose (as the game's file), the rig posed to the key (in colour, from the exported rig.json), and the two silhouettes on the pose model's grid
(approved blue, rig red, both purple) with the overlap. Under them: the gate's numbers (overlap, stature - head to soles for a props-out pose - feet, real head), the gate's verdict for the key,
and the key's class. The numbers are the gate's (`node tools/rig-gate.mjs --check --json`), read from the exported rig; the fitter's are shown when the gate has not run.
Writes <out> (default <work>/sheet.png) and prints its path.
"""
from __future__ import annotations

import json
import pathlib
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from rig_common import BG, NODE, REPO, Subject, read_json, say
from rig_skin import RigModel

TILE_H = 420


def _font(size):
    for f in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _gate_json(sub: Subject, rig_dir: pathlib.Path, out_json: pathlib.Path):
    cmd = [NODE, "tools/rig-gate.mjs", "--rig", str(rig_dir), "--art", str(sub.art), "--root", str(REPO), "--check", "--no-blends", "--json", str(out_json)]
    if sub.cfg.get("table"):
        cmd += ["--table", str(sub.rel(sub.cfg["table"]))]
    r = subprocess.run(cmd, cwd=str(REPO), capture_output=True)
    if out_json.exists():
        return json.loads(out_json.read_text())[0]
    return None


def _fit(img: Image.Image, h: int) -> Image.Image:
    s = h / img.height
    return img.resize((max(1, int(img.width * s)), h), Image.LANCZOS)


def run(sub: Subject, out=None) -> pathlib.Path:
    rig_dir = sub.out
    rig = read_json(rig_dir / "rig.json")
    T = read_json(sub.work / "targets" / "targets.json") if (sub.work / "targets" / "targets.json").exists() else None
    gate = _gate_json(sub, rig_dir, sub.work / "gate.json")
    rows = {k["pose"]: k for k in (gate["keys"] if gate else [])}
    model = RigModel({**rig, "parts": rig["parts"]}, rig_dir, grid_affine=T["gridFromMaster"] if T else None, grid=T["grid"] if T else None)
    W, H = rig["image"]["w"], rig["image"]["h"]
    f = _font(14)
    fb = _font(16)
    tiles = []
    for pose, key in rig["keys"].items():
        rot = {n: ch.get("rot", 0.0) for n, ch in key.get("bones", {}).items()}
        r = key.get("root", {})
        model.pose(rot=rot, root=(r.get("dx", 0.0), r.get("dy", 0.0), r.get("rot", 0.0)))
        # the rig in colour on a canvas twice as wide as the costume, so a key that steps aside stays in view
        pad = int(W * 0.5)
        canvas_w, canvas_h = W + 2 * pad, H + int(H * 0.12)
        model.P[:, 0] += pad
        col = Image.fromarray(model.render_rgba(canvas_w, canvas_h, scale_down=sub.scale), "RGBA")
        model.P[:, 0] -= pad
        bg = Image.new("RGBA", col.size, BG + (255,))
        bg.alpha_composite(col)
        painting = sub.dir_chars / f"{pose}.png"
        a_img = Image.new("RGBA", (200, TILE_H), BG + (255,))
        if painting.exists():
            p_img = Image.open(painting).convert("RGBA")
            pb = Image.new("RGBA", p_img.size, BG + (255,))
            pb.alpha_composite(p_img)
            a_img = _fit(pb, TILE_H)
        b_img = _fit(bg.convert("RGB").convert("RGBA"), TILE_H)
        o_img = Image.new("RGBA", (300, TILE_H), (20, 22, 30, 255))
        if T and pose in T["poses"]:
            timg = np.array(Image.open(sub.work / "targets" / T["poses"][pose]["png"]))
            tgt = (timg[..., 0] if timg.ndim == 3 else timg) > 127
            model.pose(rot=rot, root=(r.get("dx", 0.0), r.get("dy", 0.0), r.get("rot", 0.0)))
            rg = model.grid_mask().astype(bool)
            ov = np.zeros((*tgt.shape, 3), np.uint8)
            ov[tgt & ~rg] = (70, 120, 255)
            ov[rg & ~tgt] = (255, 80, 70)
            ov[tgt & rg] = (190, 110, 220)
            ys, xs = np.nonzero(tgt | rg)
            if len(ys):
                crop = ov[max(0, ys.min() - 6):ys.max() + 7, max(0, xs.min() - 6):xs.max() + 7]
                o_img = _fit(Image.fromarray(crop, "RGB").convert("RGBA"), TILE_H)
        row = rows.get(pose)
        fit = key.get("fit", {})
        lines = [f"{pose}  ({row['class'] if row else (T['poses'][pose]['class'] if T and pose in T['poses'] else '?')})"]
        if row:
            lines.append(f"overlap {row['iou']:.3f}   stature {row['statureRead']:.3f}{' (head to soles)' if row['propsOut'] else ''}" if row["iou"] is not None and row["statureRead"] is not None else "no painting to hold it against")
            lines.append(f"feet {row['feet']['dx']:+.3f}, {row['feet']['dy']:+.3f}   head {row['headReal']:.3f}" if row.get("feet") and row.get("headReal") is not None else "feet n/a")
            lines.append(("gate: OK" if row["ok"] else "gate: FAIL " + ",".join(row["flags"])) + ("" if row["planted"] else "   (not planted)"))
        else:
            lines.append(f"fitter: overlap {fit.get('iou', 'n/a')}  stature {fit.get('stature', 'n/a')}  feetPx {fit.get('feetPx', 'n/a')}")
        tiles.append((a_img, b_img, o_img, lines, (row["ok"] if row else None)))
    pw = max(t[0].width + t[1].width + t[2].width + 40 for t in tiles)
    sheet = Image.new("RGB", (max(pw + 20, 1100), 70 + len(tiles) * (TILE_H + 90)), (14, 16, 22))
    d = ImageDraw.Draw(sheet)
    verdict = gate["status"].upper() if gate else "gate not run"
    d.text((10, 6), f"{rig['name']}  rig, {len(rig['parts'])} parts, {len(rig['bones'])} bones; gate {verdict}", fill=(235, 235, 240), font=fb)
    d.text((10, 28), "left: the approved painting    middle: the rig posed to the key    right: both silhouettes on the pose model's grid (blue approved, red rig, purple both)", fill=(190, 195, 210), font=f)
    y = 56
    for a, b, o, lines, ok in tiles:
        x = 10
        for im in (a, b, o):
            sheet.paste(im.convert("RGB"), (x, y))
            x += im.width + 10
        for i, ln in enumerate(lines):
            d.text((10, y + TILE_H + 6 + i * 18), ln, fill=((120, 230, 140) if ok else (255, 130, 120)) if (ok is not None and i == 0) else (220, 220, 230), font=f)
        y += TILE_H + 90
    outp = pathlib.Path(out) if out else sub.work / "sheet.png"
    outp.parent.mkdir(parents=True, exist_ok=True)
    sheet.crop((0, 0, sheet.width, y)).save(outp)
    say(f"rig sheet: {outp}")
    return outp
