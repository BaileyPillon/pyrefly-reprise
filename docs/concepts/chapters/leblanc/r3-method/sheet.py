"""Art method r3 pilot, the sheet (FFX-2 only, chapter 6 Leblanc).

    D:/Tools/sd-scripts/.venv/Scripts/python.exe docs/concepts/chapters/leblanc/r3-method/sheet.py

Writes docs/concepts/chapters/leblanc/r3-method/sheet.jpg:
  1. cast, whole: idle | cast.r2.2 (installed) | pilot cast (P6), same height, on grey;
  2. cast, 1:1 crops (texels drawn at 2x, nearest): obi, knot, tassel, choker, face, fan, one row per file;
  3. provenance maps (grey unchanged, blue idle pixels warped, amber fill, magenta generated) of the
     pilot cast and of hurt (b);
  4. hurt: idle | (b) at 1:1 (upper body), and in battle at game size (P7, 1600x900 frame crops):
     cast r2.2 | pilot cast | mid-flinch (a) no file | mid-flinch (b) bake.
"""
from __future__ import annotations

import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import r3lib as R  # noqa: E402

SCR = R.SCR
BG = (46, 46, 50)
GREY = (128, 128, 128, 255)
try:
    FONT = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
    SMALL = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 14)
    BIG = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 24)
except OSError:
    FONT = SMALL = BIG = ImageFont.load_default()


def on_grey(path):
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", im.size, GREY)
    bg.alpha_composite(im)
    return bg.convert("RGB")


def fit_h(im, h):
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


def label(im, text, font=FONT):
    out = Image.new("RGB", (im.width, im.height + 24), BG)
    out.paste(im, (0, 24))
    ImageDraw.Draw(out).text((2, 2), text, fill=(255, 230, 120), font=font)
    return out


def row(items, gap=12):
    h = max(i.height for i in items)
    w = sum(i.width for i in items) + gap * (len(items) - 1)
    out = Image.new("RGB", (w, h), BG)
    x = 0
    for i in items:
        out.paste(i, (x, 0)); x += i.width + gap
    return out


def col(items, gap=16):
    w = max(i.width for i in items)
    h = sum(i.height for i in items) + gap * (len(items) - 1)
    out = Image.new("RGB", (w, h), BG)
    y = 0
    for i in items:
        out.paste(i, (0, y)); y += i.height + gap
    return out


def crop2x(img, box):
    c = img.crop(box)
    return c.resize((c.width * 2, c.height * 2), Image.NEAREST)


def title(text, w, sub=""):
    out = Image.new("RGB", (w, 56 if sub else 34), BG)
    d = ImageDraw.Draw(out)
    d.text((4, 4), text, fill=(255, 255, 255), font=BIG)
    if sub:
        d.text((4, 34), sub, fill=(200, 200, 200), font=SMALL)
    return out


def main():
    idle = on_grey(R.IDLE)
    r22 = on_grey(R.CAST)
    pil = on_grey(SCR / "p6/cast.p6.png")
    g = json.loads((SCR / "gates-p6/gates.json").read_text())
    c = g["cast"]; h = g["hurt"]
    # 1. whole
    H = 720
    whole = row([label(fit_h(idle, H), "idle (anchor, sha 4fea45f9)"), label(fit_h(r22, H), "cast.r2.2 (installed, judged 6)"),
                 label(fit_h(pil, H), "pilot cast (P6 re-run)")])
    # 2. crops: (name, idle box, cast box)
    crops = [
        ("obi", (290, 312, 436, 384), (312, 545, 452, 622)),
        ("knot", (352, 322, 424, 380), (374, 560, 446, 622)),
        ("tassel (+ 2nd tassel area on cast)", (352, 362, 420, 540), (374, 598, 482, 776)),
        ("choker", (282, 168, 368, 226), (340, 392, 424, 446)),
        ("face", (250, 60, 420, 200), (300, 290, 470, 420)),
        ("fan", (336, 150, 516, 240), (250, 14, 500, 170)),
    ]
    rows = []
    for name, im, which in (("idle", idle, 1), ("cast.r2.2", r22, 2), ("pilot", pil, 2)):
        tiles = [label(crop2x(im, cr[which]), f"{name}: {cr[0]}", SMALL) for cr in crops]
        rows.append(row(tiles, 8))
    crops_sheet = col(rows, 10)
    # 3. provenance
    pc = on_grey(SCR / "gates-p6/provenance-cast.png")
    ph = on_grey(SCR / "gates-p6/provenance-hurt.png")
    pv = c["provenance"]; hv = h["provenance"]
    prov = row([label(fit_h(pc, 520), "pilot cast", SMALL), label(fit_h(ph, 520), "hurt (b)", SMALL)], 30)
    sub3 = (f"pilot cast: grey {pv['grey']:.1%} r2.2 unchanged, blue {pv['blue']:.1%} idle pixels warped, magenta {pv['magenta']:.1%} generated band;  "
            f"hurt (b): grey {hv['grey']:.1%} idle unchanged, blue {hv['blue']:.1%} idle warped, amber {hv['amber']:.1%}, magenta {hv['magenta']:.1%} generated")
    # 4. hurt
    hb = on_grey(SCR / "hurt.b.png")
    pad = Image.new("RGBA", hb.size, GREY); pad.paste(Image.open(R.IDLE).convert("RGBA"), (110, 30), Image.open(R.IDLE).convert("RGBA"))
    up_box = (330, 40, 740, 560)
    hurt11 = row([label(pad.convert("RGB").crop(up_box), "idle = hurt (a): no file, the engine flinches the idle", SMALL),
                  label(hb.crop(up_box), "hurt (b): rig bake of the idle pixels (1:1)", SMALL)])
    ig = SCR / "ingame"
    game = []
    for f, t in (("r22-cast.png", "battle: cast r2.2"), ("pilotA-cast.png", "battle: pilot cast"),
                 ("pilotA-flinch.png", "battle: mid-flinch (a) no file"), ("pilotB-flinch.png", "battle: mid-flinch (b) bake")):
        if (ig / f).exists():
            game.append(label(fit_h(Image.open(ig / f).convert("RGB"), 420), t, SMALL))
    gamerow = row(game) if game else Image.new("RGB", (10, 10), BG)
    regs = c["regions"]
    sub1 = (f"MAD outside mask+band {c['madOutside']:.1f}; median CIEDE2000 vs idle: obi {regs['obi']['medianDE2000']} (r2.2 {regs['obi']['r22MedianDE2000']}), "
            f"tassel {regs['tassel']['medianDE2000']} (r2.2 {regs['tassel']['r22MedianDE2000']}), choker {regs['choker']['medianDE2000']} (r2.2 {regs['choker']['r22MedianDE2000']}); "
            f"invented colours: region {c['invented']['region']['cand']:.2%} (r2.2 same px {c['invented']['region']['r22SamePx']:.2%}), band only {c['invented']['bandOnly']['cand']:.2%}")
    sub4 = (f"(b): idle share {h['idleShare']:.1%}, head chord {h['headChordArea']:.3f}, height {h['heightRatio']:.3f}, canvas {h['canvas'][0]}x{h['canvas'][1]}, baselineY {h['baselineY']}, scale 1.0")
    W = max(whole.width, crops_sheet.width, prov.width, hurt11.width, gamerow.width) + 20
    parts = [title("Leblanc, art method r3 pilot (FFX-2 only, chapter 6) - candidates, nothing installed", W,
                   "cast: idle-pixel transplant of obi, knot, tassel, choker onto cast.r2.2 + seam-only repaint; hurt: (a) no file vs (b) rig bake"),
             title("1. Cast, whole", W), whole,
             title("2. Cast, 1:1 crops (texels at 2x)", W, sub1), crops_sheet,
             title("3. Provenance maps", W, sub3), prov,
             title("4. Hurt (a) vs (b): 1:1 and in battle at game size (1600x900 frame, P7)", W, sub4), hurt11, gamerow]
    sheet = col(parts, 14)
    canvas = Image.new("RGB", (sheet.width + 20, sheet.height + 20), BG)
    canvas.paste(sheet, (10, 10))
    out = HERE / "sheet.jpg"
    canvas.save(out, quality=86, optimize=True)
    print(out, canvas.size)


if __name__ == "__main__":
    main()
