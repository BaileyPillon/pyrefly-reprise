"""Clips and sheets for the driver and for Bailey (the lane kit; the rig program, 2026-10-18; both games). Ported from `authored_clips.py`, `keytable.py` and `build_sheets.py` of the Kimahri and Lulu
lanes, with the same labels and layout as Lulu's pass-2 sheets: a 44 px label bar in Segoe UI Bold, gold #E3B94A on #0B0A12, three rows a sheet, `left = the rig  right = the painting the game uses
today`; and the before/after sheet (`old rig | new rig | the painting`).

    lane.py keytable --gate G.json --rig rig.json [--out T.txt]
    lane.py clips    --subject S --gate G.json --on <recording>/poses --off <recording>/poses-off --out <clips dir> [--poses a,b]
    lane.py sheets   --subject S --clips <clips dir> --out <sheets dir> [--before <clips dir of the old rig>] [--before-poses a,b]

A clip is the rig (left) beside the painting the game draws (right), the same real-game frame, idle easing into the pose and held, 60 fps; its caption is what the gate read. `clips` also keeps
`<pose>-last.png`, the clip's last frame, which the sheets are made of (no second decode).
"""
from __future__ import annotations

import json
import pathlib
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

FFMPEG = "D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg"
FONT = "C:/Windows/Fonts/segoeuib.ttf"
GOLD, BAR = (0xE3, 0xB9, 0x4A), (0x0B, 0x0A, 0x12)
CAP = 44
PANEL = 550  # the width of one panel on a sheet row
MAX_W = MAX_H = 700


# --------------------------------------------------------------------------------------------------------------------------------------------------------------- pure


def crop_box(rects: list[dict], frame=(1600, 900)) -> tuple[int, int, int, int]:
    """The crop `(x0, y0, w, h)` that holds every projected rect (the idle's and the pose's, rig and painting) with room round it, clamped to the frame."""
    xs = [r["x"] for r in rects] + [r["x"] + r["w"] for r in rects]
    ys = [r["y"] for r in rects] + [r["y"] + r["h"] for r in rects]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    w = min(MAX_W, max(380, int(max(xs) - min(xs) + 140)))
    h = min(MAX_H, max(440, int(max(ys) - min(ys) + 120)))
    return int(max(0, min(frame[0] - w, cx - w / 2))), int(max(0, min(frame[1] - h, cy - h / 2))), w, h


def caption(pose: str, key: dict) -> str:
    lm = f"{key['landmarkMax']:.3f}" if key.get("landmarkMax") is not None else "-"
    src = "AUTHORED" if key.get("authored") else "PAINTED"
    iou = f"{key['iou']:.3f}" if key.get("iou") is not None else "n/a"
    turned = "  (the painting faces LEFT, the rig RIGHT: the gate reads the painting turned)" if key.get("turned") else ""
    return f"{pose}: the RIG, source {src} -- gate overlap with the approved painting {iou} (bar 0.75), worst landmark {lm} of the idle's height (bar 0.06){turned}"


def sheet_groups(spec: dict, poses: list[str], per: int = 3) -> list[tuple[str, list[tuple[str, str]]]]:
    """The sheets: the registry's own grouping (`sheets`, `labels`) where it has one, else the poses in order, `per` a sheet, labelled in capitals."""
    labels = spec.get("labels") or {}
    lab = lambda p: labels.get(p, p.replace("-", " ").upper())  # noqa: E731
    if spec.get("sheets"):
        return [(name, [(p, lab(p)) for p in group if p in poses]) for name, group in spec["sheets"] if any(p in poses for p in group)]
    name = spec.get("sheetPrefix", "rig")
    return [(f"{name}-sheet-{i // per + 1}", [(p, lab(p)) for p in poses[i:i + per]]) for i in range(0, len(poses), per)]


def row_title(label: str, columns: list[str]) -> str:
    return f"{label}      " + "      ".join(columns)


# --------------------------------------------------------------------------------------------------------------------------------------------------------------- impure


def keytable(gate: dict, rig: dict) -> str:
    """The per-key table the driver reads (overlap, landmark error, stature, feet, holes, source), ported from keytable.py."""
    acc = gate.get("acceptance") or {"iou": 0.75, "landmarkPct": 0.06}
    holes = gate.get("holes") or {}
    bad = set(holes.get("keysWithHoles") or [])
    w = []
    w.append(f"rig {gate['subject']}  gate {gate['status'].upper()}  ({sum(1 for k in gate['keys'] if k['ok'])} of {len(gate['keys'])} keys pass)  coverage: uncovered {gate.get('uncovered') or 'none'}")
    w.append(f"bars: overlap >= {acc['iou']} with the approved painting of the pose AND every marked landmark within {acc['landmarkPct']} of the idle's height")
    w.append(f"holes: {holes.get('rendered')} poses scanned at {len(holes.get('joints') or [])} joints (every key, and 25/50/75 percent between every two): keys with a hole {len(bad)}, blends with a hole {holes.get('blendsWithHoles')}")
    w.append(f"authored: {', '.join(gate.get('authored') or []) or 'none'}   |   painting turned: {', '.join(gate.get('turned') or []) or 'none'}")
    if gate.get("variants"):
        w.append("variants (palette distance from the base part, 0 same to 1 nothing in common): " + ", ".join(f"{v['part']}:{v['variant']} {v['distance']}" for v in gate["variants"]))
    w.append("")
    hdr = f"{'pose':9s} {'class':9s} {'source':28s} {'overlap':>7s} {'lm worst':>8s} {'stature':>7s} {'feet dx':>7s} {'feet dy':>7s} {'holes':>5s}  note"
    w += [hdr, "-" * len(hdr)]
    for k in gate["keys"]:
        p = k["pose"]
        src = "the costume painting at rest" if p == "idle" else "AUTHORED" + (" (painting turned)" if k.get("turned") else "") if k.get("authored") else "painting " + str(rig["keys"][p].get("source", ""))
        lm = f"{k['landmarkMax']:.3f}" if k.get("landmarkMax") is not None else "-"
        st = f"{k['statureRead']:.3f}" if k.get("statureRead") is not None else "n/a"
        fe = k.get("feet")
        note = []
        if k.get("authored"):
            note.append(f"overlap under {acc['iou']}: landmarks carry it")
        if k.get("hiddenShare"):
            note.append(f"hides {k['hiddenShare']:.2f} of the idle figure")
        if k["flags"]:
            note.append("flags " + ",".join(k["flags"]))
        iou = f"{k['iou']:.3f}" if k.get("iou") is not None else "n/a"
        w.append(f"{p:9s} {k['class']:9s} {src:28s} {iou:>7s} {lm:>8s} {st:>7s} {fe['dx'] if fe else float('nan'):7.3f} {fe['dy'] if fe else float('nan'):7.3f} {'1' if p in bad else '0':>5s}  {'; '.join(note)}")
    return "\n".join(w) + "\n"


def make_clips(gate: dict, on: pathlib.Path, off: pathlib.Path, out: pathlib.Path, poses: list[str] | None = None, ffmpeg: str = FFMPEG) -> list[str]:
    keys = {k["pose"]: k for k in gate["keys"]}
    info_on = json.loads((on / "poses-info.json").read_text())["poses"]
    info_off = json.loads((off / "poses-info.json").read_text())["poses"]
    font = ImageFont.load_default()
    out.mkdir(parents=True, exist_ok=True)
    made = []
    for pose in poses or list(info_on):
        k = keys.get(pose)
        if k is None or pose not in info_off:
            print(f"  {pose}: no gate key or no painting-set recording: skipped")
            continue
        x0, y0, w, h = crop_box([info_on[pose]["rectPose"], info_off[pose]["rectPose"], info_on[pose]["rectIdle"], info_off[pose]["rectIdle"]])
        tmp = pathlib.Path(tempfile.mkdtemp(prefix="clip-"))
        fa = sorted((on / "frames" / pose).glob("f*.jpg"))
        fb = sorted((off / "frames" / pose).glob("f*.jpg"))
        last = None
        for i in range(min(len(fa), len(fb))):
            ia = Image.open(fa[i]).crop((x0, y0, x0 + w, y0 + h)).resize((w * 2, h * 2), Image.LANCZOS)
            ib = Image.open(fb[i]).crop((x0, y0, x0 + w, y0 + h)).resize((w * 2, h * 2), Image.LANCZOS)
            t = Image.new("RGB", (w * 4 + 4, h * 2 + CAP), (10, 10, 14))
            t.paste(ia, (0, CAP))
            t.paste(ib, (w * 2 + 4, CAP))
            d = ImageDraw.Draw(t)
            d.text((6, 4), caption(pose, k), fill=(255, 235, 120), font=font)
            d.text((6, 22), "idle, then the pose (the game's own blend)", fill=(190, 200, 230), font=font)
            d.text((w * 2 + 10, 22), "the PAINTING of the pose, as the game draws it (the painting set)", fill=(190, 200, 230), font=font)
            t.save(tmp / f"a{i:04d}.png")
            last = t
        if last is None:
            shutil.rmtree(tmp, ignore_errors=True)
            continue
        last.save(out / f"{pose}-last.png")
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-framerate", "60", "-i", str(tmp / "a%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", str(out / f"{pose}.mp4")], check=True)
        shutil.rmtree(tmp, ignore_errors=True)
        made.append(pose)
        print(f"  wrote {out / (pose + '.mp4')} ({w}x{h} at {x0},{y0})")
    return made


def _panels(last: pathlib.Path) -> tuple[Image.Image, Image.Image]:
    """The rig panel and the painting panel of a clip's last frame (caption bar cut off): the frame is two equal panels with a 4 px gap."""
    im = Image.open(last).convert("RGB")
    half = (im.width - 4) // 2
    return im.crop((0, CAP, half, im.height)), im.crop((half + 4, CAP, im.width, im.height))


def _row(title: str, panels: list[Image.Image], width: int) -> Image.Image:
    font = ImageFont.truetype(FONT, 22) if pathlib.Path(FONT).exists() else ImageFont.load_default()
    h = max(int(round(p.height * width / p.width)) for p in panels)
    row = Image.new("RGB", (width * len(panels) + 4 * (len(panels) - 1), h + CAP), BAR)
    ImageDraw.Draw(row).text((16, 8), title, font=font, fill=GOLD)
    for i, p in enumerate(panels):
        row.paste(p.resize((width, int(round(p.height * width / p.width))), Image.LANCZOS), (i * (width + 4), CAP))
    return row


def _stack(rows: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGB", (max(r.width for r in rows), sum(r.height for r in rows)), BAR)
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height
    return sheet


def make_sheets(spec: dict, clips: pathlib.Path, out: pathlib.Path, before: pathlib.Path | None = None, before_poses: list[str] | None = None) -> list[pathlib.Path]:
    poses = sorted(p.name[:-len("-last.png")] for p in clips.glob("*-last.png"))
    out.mkdir(parents=True, exist_ok=True)
    wrote = []
    for name, rows in sheet_groups(spec, poses):
        built = []
        for pose, label in rows:
            rig, painting = _panels(clips / f"{pose}-last.png")
            built.append(_row(row_title(label, ["left = the rig", "right = the painting the game uses today"]), [rig, painting], PANEL))
        if built:
            f = out / f"{name}.png"
            _stack(built).save(f)
            wrote.append(f)
            print("  wrote", f)
    if before is not None:
        labels = spec.get("labels") or {}
        built = []
        for pose in before_poses or poses:
            if not (before / f"{pose}-last.png").exists() or not (clips / f"{pose}-last.png").exists():
                continue
            old, _ = _panels(before / f"{pose}-last.png")
            new, painting = _panels(clips / f"{pose}-last.png")
            built.append(_row(row_title(labels.get(pose, pose.replace("-", " ").upper()), ["left = the old rig", "middle = the new rig", "right = the painting the game uses today"]), [old, new, painting], 500))
        if built:
            f = out / f"{spec.get('beforeAfter', spec.get('sheetPrefix', 'rig') + '-before-after')}.png"
            _stack(built).save(f)
            wrote.append(f)
            print("  wrote", f)
    return wrote
