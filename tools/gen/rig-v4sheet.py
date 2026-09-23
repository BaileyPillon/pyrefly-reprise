"""Living-portrait v4 (FFX-2 only): the contact sheet of a browser pass
(tools/gen/rig-v4shots.mjs) -> <dir>/sheet.jpg.

  row 1  the canvas at -80 .. 0 .. +80 (live renders, idle on, clock frozen)
  row 2  the eyes at 1:1 at the same yaws
  row 3  the hairline at 1:1 (half size)
  row 4  the tassel and the jaw at 1:1 (half size)
  row 5  expressions: mid-blink, closed, smile at 0 and -40, slight smile and
         raised brows at +20
Every panel is labelled with the yaw the driver reported for that frame.

    python -s tools/gen/rig-v4sheet.py <dir>
"""
from __future__ import annotations

import json
import pathlib
import sys

from PIL import Image, ImageDraw

YAWS = [-80, -60, -40, -20, 0, 20, 40, 60, 80]
tag = lambda y: "0" if y == 0 else (f"m{-y}" if y < 0 else f"p{y}")


def label(im, text):
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 8 + 7 * len(text), 16], fill=(0, 0, 0))
    d.text((4, 2), text, fill=(255, 230, 160))
    return im


def row(ims, h):
    ims = [i.resize((max(1, int(i.width * h / i.height)), h), Image.LANCZOS) for i in ims]
    out = Image.new("RGB", (sum(i.width for i in ims) + 4 * (len(ims) - 1), h), (24, 20, 24))
    x = 0
    for i in ims:
        out.paste(i, (x, 0))
        x += i.width + 4
    return out


def main(d: pathlib.Path):
    log = json.loads((d / "log-stills.json").read_text()) if (d / "log-stills.json").exists() else json.loads((d / "log-all.json").read_text())
    yaw_of = {r["name"]: r["yaw"] for r in log.get("stills", [])}
    op = lambda p: Image.open(d / p).convert("RGB")
    rows = [
        row([label(op(f"yaw-{tag(y)}.png"), f"{y:+d} (drawn {yaw_of.get(f'yaw-{tag(y)}', 0):+.1f})") for y in YAWS], 560),
        row([label(op(f"crops/yaw-{tag(y)}-eyes.png"), f"{y:+d} eyes 1:1") for y in YAWS], 150),
        row([label(op(f"crops/yaw-{tag(y)}-hairline.png"), f"{y:+d} hairline") for y in YAWS], 150),
        row([label(op(f"crops/yaw-{tag(y)}-tassel.png"), f"{y:+d} tassel") for y in YAWS] , 280),
        row([label(op(f"crops/yaw-{tag(y)}-jaw.png"), f"{y:+d} jaw") for y in YAWS], 170),
    ]
    ex = [("crops/blink-mid-eyes.png", "blink mid"), ("crops/blink-closed-eyes.png", "blink closed"), ("crops/smile-0-face.png", "smile 0"),
          ("crops/smile-m40-face.png", "smile -40"), ("crops/slight-smile-p20-face.png", "slight smile +20"), ("crops/brow-raised-p20-face.png", "brows raised +20")]
    rows.append(row([label(op(p), t) for p, t in ex if (d / p).exists()], 300))
    w = max(r.width for r in rows)
    sheet = Image.new("RGB", (w, sum(r.height for r in rows) + 8 * len(rows)), (24, 20, 24))
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height + 8
    if sheet.width > 3600:
        s = 3600 / sheet.width
        sheet = sheet.resize((3600, int(sheet.height * s)), Image.LANCZOS)
    sheet.convert("RGB").save(d / "sheet.jpg", quality=90)
    print("sheet", sheet.size)


if __name__ == "__main__":
    main(pathlib.Path(sys.argv[1]))
