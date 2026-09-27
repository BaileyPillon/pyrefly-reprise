"""Rough battle frames for the four FFX-2 Ixion looks (FFX-2 only; options, nothing installed).

    python docs/concepts/chapters/ixion-djose-2026-09-27/look/scripts/look_frames.py

Each option gets a 1600x900 desktop frame and a 390x844 upright-phone frame, in the same
Djose Chamber stand-in (the Macalania Temple plate recoloured, with the hole where the fayth
stood; research 6.1), with the FFX-2 party (Yuna White Mage, Rikku and Paine Dark Knight, the
concept frames' party) and a greybox of the FFX-2 HUD (desktop: the shipped Chapter IV layout;
phone: the shipped "compact rail", src/ui/common/phoneBattle.ts). Bars carry no numbers.
Reads the option cutouts from the candidates folder; writes look/frames/*.jpg. Deletes nothing.
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageDraw, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "scripts"))
import frames as base  # noqa: E402  (the concept round's helpers: chamber(), hole(), place(), fonts)

CAND = r"D:\Tools\pyrefly-art-backup\candidates\2026-09-27-ixion"
OUT = os.path.join(HERE, "..", "frames")
PINK = (236, 150, 200)
INK, GOLD, PAPER = base.INK, base.GOLD, base.PAPER

OPTIONS = [
    ("a", "As in FFX", "The shipped FFX painting, untouched. Sources: wiki + visual-bible 1 [single source]."),
    ("b", "Possessed violet", "House 'Chapter IV violet' grade of the same pixels, as Shiva and Anima in Chapter XI. Not canon (F-12)."),
    ("c", "Machina-fused", "Steel plates, cables, pistons grown into him. FFExodus alone: 'had melded with machina' [single source, IX-8]."),
    ("d", "Storm fiend", "Hide gone black, dulled gold, arcs and pyreflies. House style for an unsent aeon; no source describes it."),
]


def sprite(key: str) -> Image.Image:
    return Image.open(os.path.join(CAND, f"opt-{key}.png")).convert("RGBA")


def put(canvas: Image.Image, im: Image.Image, height: int, cx: int, feet: int) -> None:
    """Place by the solid figure (alpha > 90) so every option stands at the same height and baseline,
    keeping any glow or arcs around it (a margin on the top and sides; the ground cuts the bottom)."""
    x0, y0, x1, y1 = im.getchannel("A").point(lambda v: 255 if v > 90 else 0).getbbox()
    pad = 70
    box = (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), y1)
    crop = im.crop(box)
    s = height / (y1 - y0)
    solid_cx = (x0 + x1) / 2 - box[0]
    sp = crop.resize((max(1, int(crop.width * s)), max(1, int(crop.height * s))), Image.LANCZOS)
    canvas.alpha_composite(sp, (int(cx - solid_cx * s), feet - sp.height))


def djose(w: int, h: int, fx: float = 0.5) -> Image.Image:
    """Stand-in plate (not Djose art): the recoloured Macalania plate, darkened for a storm-lit chamber."""
    im = base.chamber(w, h, cool=True, fx=fx)
    return ImageEnhance.Brightness(im).enhance(0.8)


def desktop(key: str, name: str, note: str) -> Image.Image:
    W, H = 1600, 900
    cv = djose(W, H)
    d = ImageDraw.Draw(cv)
    base.hole(cv, 700, 700, 200, 36)
    base.scrap(cv, 90, 700, 1.2)
    base.scrap(cv, 1420, 690, 1.0)
    base.place(cv, base.YUNA_WM, 330, 200, 800)
    base.place(cv, base.RIKKU_DK, 350, 380, 812)
    base.place(cv, base.PAINE_DK, 365, 560, 820)
    put(cv, sprite(key), 340, 1000, 770)
    d = ImageDraw.Draw(cv)
    # enemy bar, top left (FFX-2: name + pink HP bar + SCAN, no numbers)
    d.polygon([(40, 96), (600, 96), (578, 144), (40, 144)], fill=(20, 18, 26, 225), outline=PINK)
    d.text((60, 104), "Ixion", font=base.F_HUD, fill=PAPER)
    d.rectangle((150, 116, 500, 124), fill=PINK)
    d.text((520, 110), "SCAN", font=base.F_SMALL, fill=(200, 190, 200))
    d.rounded_rectangle((740, 100, 900, 126), radius=4, fill=(20, 18, 26, 220), outline=(120, 110, 130))
    d.text((752, 103), "ENEMY MOVE", font=base.F_SMALL, fill=(200, 190, 200))
    for i, cmd in enumerate(["WHITE MAGIC", "CHANGE", "ITEM"]):
        y = 380 + i * 60
        d.polygon([(1290, y), (1580, y), (1570, y + 50), (1290, y + 50)],
                  fill=PINK + (235,) if i == 0 else (20, 18, 26, 225) if i == 1 else PAPER + (235,), outline=GOLD)
        d.text((1310, y + 11), cmd, font=base.F_STAMP, fill=INK if i != 1 else PAPER)
    for i, (who, job) in enumerate([("Yuna", "WM"), ("Rikku", "DK"), ("Paine", "DK")]):
        y = 600 + i * 64
        x = 1210 - i * 10
        d.polygon([(x, y), (x + 370, y), (x + 358, y + 56), (x, y + 56)], fill=(20, 18, 26, 225), outline=PINK)
        d.text((x + 16, y + 12), f"{who}  {job}", font=base.F_HUD, fill=PAPER)
        d.rectangle((x + 180, y + 38, x + 340, y + 44), fill=PINK)
    # title strip and notes
    d.rectangle((0, 0, W, 64), fill=INK)
    d.text((18, 14), f"Ixion's FFX-2 look, option {key.upper()}: {name}", font=base.F_TITLE, fill=GOLD)
    d.rectangle((W - 316, 12, W - 16, 52), fill=base.RED)
    d.text((W - 302, 18), "OPTION, NOT INSTALLED", font=base.F_STAMP, fill=(255, 245, 235))
    d.rectangle((0, 842, W, H), fill=INK)
    base.text_block(d, (16, 846), note + "  Rough frame: the room, the party layout and the HUD are stand-ins; FFX-2 only.",
                    base.F_SMALL, W - 32, fill=(200, 192, 176), gap=2)
    return cv


def phone(key: str, name: str) -> Image.Image:
    W, H = 390, 844
    cv = Image.new("RGBA", (W, H), (12, 10, 16, 255))
    field_h = 470
    f = djose(W, field_h, fx=0.62)
    base.hole(f, 170, 390, 110, 20)
    base.place(f, base.YUNA_WM, 140, 48, 452)
    base.place(f, base.RIKKU_DK, 150, 108, 458)
    base.place(f, base.PAINE_DK, 156, 168, 464)
    put(f, sprite(key), 150, 292, 410)
    cv.alpha_composite(f, (0, 48))
    d = ImageDraw.Draw(cv)
    d.rectangle((0, 0, W, 44), fill=INK)
    d.text((10, 10), f"Option {key.upper()}: {name}", font=base.F_LAB, fill=GOLD)
    d.text((W - 118, 12), "NOT INSTALLED", font=base.F_SMALL, fill=base.RED)
    # boss bar + pause
    d.rectangle((10, 58, 320, 98), fill=(20, 18, 26, 225), outline=PINK)
    d.text((22, 64), "Ixion", font=base.F_HUD, fill=PAPER)
    d.text((262, 68), "SCAN", font=base.F_SMALL, fill=(200, 190, 200))
    d.rectangle((22, 90, 300, 94), fill=PINK)
    d.rectangle((330, 58, 380, 98), fill=(20, 18, 26, 225), outline=(120, 110, 130))
    d.text((348, 66), "II", font=base.F_LAB, fill=PAPER)
    # party chips
    y = 48 + field_h + 6
    for i, (who, job) in enumerate([("Yuna", "WM"), ("Rikku", "DK"), ("Paine", "DK")]):
        x = 8 + i * 126
        d.rectangle((x, y, x + 118, y + 56), fill=(20, 18, 26, 235), outline=PINK)
        d.text((x + 8, y + 6), f"{who} {job}", font=base.F_LAB, fill=PAPER)
        d.rectangle((x + 8, y + 42, x + 108, y + 47), fill=PINK)
    # tip row + menu grid
    y += 68
    d.rectangle((8, y, W - 8, y + 40), fill=(20, 18, 26, 235), outline=GOLD)
    d.text((18, y + 9), "TIP", font=base.F_LAB, fill=PINK)
    d.text((W - 90, y + 9), "GUIDE", font=base.F_LAB, fill=PAPER)
    y += 52
    for i, cmd in enumerate(["WHITE MAGIC", "CHANGE", "ITEM"]):
        x = 8 + (i % 2) * 190
        yy = y + (i // 2) * 60
        fill = PINK + (240,) if i == 0 else (20, 18, 26, 235) if i == 1 else PAPER + (240,)
        d.rectangle((x, yy, x + 182, yy + 50), fill=fill, outline=GOLD)
        d.text((x + 14, yy + 13), cmd, font=base.F_LAB, fill=INK if i != 1 else PAPER)
    return cv


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for key, name, note in OPTIONS:
        dk = desktop(key, name, note).convert("RGB")
        p1 = os.path.join(OUT, f"{key}-{name.lower().replace(' ', '-')}-1600.jpg")
        dk.save(p1, quality=86, optimize=True)
        ph = phone(key, name).convert("RGB")
        p2 = os.path.join(OUT, f"{key}-{name.lower().replace(' ', '-')}-phone-390.jpg")
        ph.save(p2, quality=88, optimize=True)
        print(p1, os.path.getsize(p1), p2, os.path.getsize(p2))


if __name__ == "__main__":
    main()
