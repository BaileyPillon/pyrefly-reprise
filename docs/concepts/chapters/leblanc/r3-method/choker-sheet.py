"""Art method r3, the last choker repair: the crop sheet (P7; FFX-2 only, chapter 6 Leblanc).

    D:/Tools/sd-scripts/.venv/Scripts/python.exe docs/concepts/chapters/leblanc/r3-method/choker-sheet.py

Writes docs/concepts/chapters/leblanc/r3-method/choker-sheet.jpg, four columns
idle | cast.r2.2 (installed) | p6 (pilot) | p7 (this attempt), all flattened on mid grey:
  1. the neck and chin at 1:1 (the head crop the judge named the p6 seam in);
  2. the choker at 2x, nearest (texels as they are);
  3. the choker at 4x, nearest;
  4. the p7 provenance map (grey r2.2 unchanged or restored, blue idle pixels warped,
     amber filled from r2.2's lit skin) and the part mask outline over p7 at 4x.
The idle crops are taken at the same place on the figure (the idle's choker is about
1.25x the cast's in pixels, so the idle crop box is 1.25x wider and shown at the same size).
"""
from __future__ import annotations

import pathlib
import sys

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import r3lib as R  # noqa: E402
from sheet import BG, BIG, SMALL, label, on_grey, row  # noqa: E402

SCR = R.SCR
FILES = [("idle*", SCR / "idle.png"), ("r2.2 (installed)", SCR / "cast.r2.2.png"),
         ("p6 (judged 6)", SCR / "p6" / "cast.p6.png"), ("p7 (this attempt)", SCR / "p7" / "cast.p7.png")]
# (neck 1:1 box, choker box) per file; the cast boxes are shared
IDLE_BOX = ((233, 111, 408, 273), (264, 161, 376, 245))
CAST_BOX = ((310, 350, 450, 480), (335, 390, 425, 457))


def crops(path, boxes, first):
    im = on_grey(path)
    neck, ch = boxes
    n = im.crop(neck)
    c = im.crop(ch)
    if first:  # the idle: shown at the cast crop's size
        n = n.resize((CAST_BOX[0][2] - CAST_BOX[0][0], CAST_BOX[0][3] - CAST_BOX[0][1]), Image.LANCZOS)
        c = c.resize((CAST_BOX[1][2] - CAST_BOX[1][0], CAST_BOX[1][3] - CAST_BOX[1][1]), Image.LANCZOS)
    return n, c


def outline(im, mask, box, s, colour=(0, 255, 120)):
    m = mask.crop(box)
    px = m.load()
    d = ImageDraw.Draw(im)
    w, h = m.size
    for y in range(h):
        for x in range(w):
            if px[x, y] > 127 and any(not (0 <= x + dx < w and 0 <= y + dy < h and px[x + dx, y + dy] > 127)
                                      for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                d.rectangle((x * s + s // 2 - 1, y * s + s // 2 - 1, x * s + s // 2 + 1, y * s + s // 2 + 1), fill=colour)
    return im


def main():
    cols1, cols2, cols4 = [], [], []
    for i, (name, path) in enumerate(FILES):
        n, c = crops(path, IDLE_BOX if i == 0 else CAST_BOX, i == 0)
        cols1.append(label(n, name + " 1:1", SMALL))
        cols2.append(label(c.resize((c.width * 2, c.height * 2), Image.NEAREST), name + " 2x", SMALL))
        cols4.append(label(c.resize((c.width * 4, c.height * 4), Image.NEAREST), name + " 4x", SMALL))
    b = CAST_BOX[1]
    prov = on_grey(SCR / "p7" / "provenance.png").crop(b)
    prov = prov.resize((prov.width * 4, prov.height * 4), Image.NEAREST)
    p7 = on_grey(SCR / "p7" / "cast.p7.png").crop(b)
    p7 = outline(p7.resize((p7.width * 4, p7.height * 4), Image.NEAREST), Image.open(SCR / "p7" / "choker.P.png").convert("L"), b, 4)
    rows = [row(cols1), row(cols2), row(cols4),
            row([label(prov, "p7 provenance: blue idle, amber skin fill", SMALL),
                 label(p7, "p7 4x, green = the part's hard edge", SMALL)])]
    W = max(r.width for r in rows) + 24
    title = Image.new("RGB", (W, 62), BG)
    d = ImageDraw.Draw(title)
    d.text((12, 6), "Leblanc cast, the last choker repair (P7, FFX-2 only): idle | r2.2 | p6 | p7", fill=(255, 230, 120), font=BIG)
    d.text((12, 38), "rows: neck 1:1, choker 2x and 4x nearest, p7 provenance.  * idle crops are resampled by 0.8 to the cast's scale (same place on the figure).",
           fill=(220, 220, 220), font=SMALL)
    H = title.height + sum(r.height + 16 for r in rows) + 8
    out = Image.new("RGB", (W, H), BG)
    out.paste(title, (0, 0))
    y = title.height
    for r in rows:
        out.paste(r, (12, y)); y += r.height + 16
    dst = HERE / "choker-sheet.jpg"
    out.save(dst, quality=92)
    print(dst, out.size)


if __name__ == "__main__":
    main()
