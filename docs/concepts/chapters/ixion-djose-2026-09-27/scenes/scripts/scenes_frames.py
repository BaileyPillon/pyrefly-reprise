"""Battle and cutscene frames for the Ixion-at-Djose scene options (FFX-2 only; options, nothing installed).

    python docs/concepts/chapters/ixion-djose-2026-09-27/scenes/scripts/scenes_frames.py

Chamber options: a 1600x900 battle frame and a 390x844 upright-phone frame, with Ixion look B
(public/art/characters/x2-ixion/idle.png, installed on the chapter-ixion branch by D-268) and the
FFX-2 party (Yuna White Mage, Rikku and Paine Dark Knight, as in the concept and look rounds), over a
greybox of the FFX-2 HUD (positions only, no numbers; same layout as look/scripts/look_frames.py).
Abyss options: a 1600x900 and a 390x844 cutscene frame with Yuna (Songstress, research 7.2 step 2) and
Shuyin (approved idle), a letterbox and a caption line of our own (the game's dialogue is unsourced, IX-13).
Reads the picked plates from the candidates folder (PICKS below). Writes scenes/frames/*.jpg. Deletes nothing.
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageDraw, ImageEnhance, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "scripts"))
sys.path.insert(0, os.path.join(HERE, "..", "..", "look", "scripts"))
import frames as base  # noqa: E402  (fonts, colours, place(), text_block())
import look_frames as lf  # noqa: E402  (put(): place a cutout by its solid body)

CAND = r"D:\Tools\pyrefly-art-backup\candidates\2026-09-27-ixion-scenes"
OUT = os.path.join(HERE, "..", "frames")
PINK = (236, 150, 200)
INK, GOLD, PAPER = base.INK, base.GOLD, base.PAPER
X2_IXION = base.load("characters/x2-ixion/idle.png")

# option -> (plate file in CAND, title, one-line note, crop focus x for the phone)
PICKS = {
    "c1": ("chamber-c1.png", "Storm-lit stone",
           "A stone nave, the statue gone, a torn hole where it stood, a thread of Djose's lightning falling into it. Cold slate and violet.", 0.5),
    "c2": ("chamber-c2.png", "The Faction's lamps",
           "A round chamber seen from a little above, the floor torn open in the middle, amber lamp boxes left on the stone (the Machine Faction's, by our reading). Warm lamps on cold stone.", 0.5),
    "a1": ("abyss-a1.png", "White void",
           "Research 7.2 step 1 read literally: a pale grey-white void, a floor of pale floating slabs, great shards drifting overhead. Nothing like the Chapter 5 flower field.", 0.5),
    "a2": ("abyss-a2.png", "Deep abyss",
           "The same place read as depth: deep blue, pale light rising from below, one slab of stone to stand on, crystal shards drifting. Quieter; the whistle light would read strongly on it.", 0.5),
}


# Ixion's placement per Chamber option (height, centre x, feet y), so he stands at the hole's far or right rim
# and the hole stays in view between him and the party (concept A: "the hole in view the whole time").
IXION_AT = {"c1": (320, 1090, 770), "c2": (310, 1135, 735)}


def plate(key: str, w: int, h: int, fx: float = 0.5, fy: float = 0.5) -> Image.Image:
    return base.cover(Image.open(os.path.join(CAND, PICKS[key][0])).convert("RGBA"), w, h, fx, fy)


def stamp(d: ImageDraw.ImageDraw, W: int, title: str) -> None:
    d.rectangle((0, 0, W, 64), fill=INK)
    d.text((18, 14), title, font=base.F_TITLE, fill=GOLD)
    d.rectangle((W - 316, 12, W - 16, 52), fill=base.RED)
    d.text((W - 302, 18), "OPTION, NOT INSTALLED", font=base.F_STAMP, fill=(255, 245, 235))


def battle_desktop(key: str) -> Image.Image:
    W, H = 1600, 900
    _, name, note, _ = PICKS[key]
    cv = plate(key, W, H)
    base.place(cv, base.YUNA_WM, 330, 170, 820)
    base.place(cv, base.RIKKU_DK, 350, 330, 832)
    base.place(cv, base.PAINE_DK, 365, 490, 840)
    h, cx, feet = IXION_AT[key]
    lf.put(cv, X2_IXION, h, cx, feet)
    d = ImageDraw.Draw(cv)
    d.polygon([(40, 96), (600, 96), (578, 144), (40, 144)], fill=(20, 18, 26, 225), outline=PINK)
    d.text((60, 104), "Ixion", font=base.F_HUD, fill=PAPER)
    d.rectangle((150, 116, 500, 124), fill=PINK)
    d.text((520, 110), "SCAN", font=base.F_SMALL, fill=(200, 190, 200))
    for i, cmd in enumerate(["WHITE MAGIC", "CHANGE", "ITEM"]):
        y = 380 + i * 60
        d.polygon([(1350, y), (1585, y), (1575, y + 50), (1350, y + 50)],
                  fill=PINK + (235,) if i == 0 else (20, 18, 26, 225) if i == 1 else PAPER + (235,), outline=GOLD)
        d.text((1366, y + 11), cmd, font=base.F_STAMP, fill=INK if i != 1 else PAPER)
    for i, (who, job) in enumerate([("Yuna", "WM"), ("Rikku", "DK"), ("Paine", "DK")]):
        y = 600 + i * 64
        x = 1320 - i * 8
        d.polygon([(x, y), (x + 265, y), (x + 255, y + 56), (x, y + 56)], fill=(20, 18, 26, 225), outline=PINK)
        d.text((x + 14, y + 8), f"{who}  {job}", font=base.F_HUD, fill=PAPER)
        d.rectangle((x + 120, y + 42, x + 240, y + 47), fill=PINK)
    stamp(d, W, f"Djose, Chamber of the Fayth, option {key.upper()}: {name}")
    d.rectangle((0, 842, W, H), fill=INK)
    base.text_block(d, (16, 846), note + "  Ixion look B (installed). HUD is a greybox; FFX-2 only.",
                    base.F_SMALL, W - 32, fill=(200, 192, 176), gap=2)
    return cv


def battle_phone(key: str) -> Image.Image:
    W, H = 390, 844
    _, name, _, fx = PICKS[key]
    cv = Image.new("RGBA", (W, H), (12, 10, 16, 255))
    field_h = 470
    f = plate(key, W, field_h, fx)
    base.place(f, base.YUNA_WM, 128, 40, 452)
    base.place(f, base.RIKKU_DK, 136, 92, 458)
    base.place(f, base.PAINE_DK, 142, 144, 464)
    lf.put(f, X2_IXION, 128, 310, 440)
    cv.alpha_composite(f, (0, 48))
    d = ImageDraw.Draw(cv)
    d.rectangle((0, 0, W, 44), fill=INK)
    d.text((10, 10), f"Chamber {key.upper()}: {name}", font=base.F_LAB, fill=GOLD)
    d.text((W - 118, 12), "NOT INSTALLED", font=base.F_SMALL, fill=base.RED)
    d.rectangle((10, 58, 320, 98), fill=(20, 18, 26, 225), outline=PINK)
    d.text((22, 64), "Ixion", font=base.F_HUD, fill=PAPER)
    d.text((262, 68), "SCAN", font=base.F_SMALL, fill=(200, 190, 200))
    d.rectangle((22, 90, 300, 94), fill=PINK)
    d.rectangle((330, 58, 380, 98), fill=(20, 18, 26, 225), outline=(120, 110, 130))
    d.text((348, 66), "II", font=base.F_LAB, fill=PAPER)
    y = 48 + field_h + 6
    for i, (who, job) in enumerate([("Yuna", "WM"), ("Rikku", "DK"), ("Paine", "DK")]):
        x = 8 + i * 126
        d.rectangle((x, y, x + 118, y + 56), fill=(20, 18, 26, 235), outline=PINK)
        d.text((x + 8, y + 6), f"{who} {job}", font=base.F_LAB, fill=PAPER)
        d.rectangle((x + 8, y + 42, x + 108, y + 47), fill=PINK)
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


def abyss_desktop(key: str) -> Image.Image:
    W, H = 1600, 900
    _, name, note, _ = PICKS[key]
    cv = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    f = plate(key, W, 660, 0.5, 0.92)  # the letterboxed picture, floor kept in view
    base.place(f, base.YUNA_SS, 440, 640, 640)
    base.place(f, base.SHUYIN, 460, 960, 646, flip=True, alpha=0.92)
    cv.alpha_composite(f, (0, 120))
    d = ImageDraw.Draw(cv)
    cap = "[beat 4] He calls her Lenne.  (caption position only; dialogue to be written)"
    d.text(((W - d.textlength(cap, font=base.F_HUD)) // 2, 796), cap, font=base.F_HUD, fill=PAPER)
    stamp(d, W, f"The Farplane Abyss, option {key.upper()}: {name}")
    d.rectangle((0, 842, W, H), fill=INK)
    base.text_block(d, (16, 846), note + "  Cutscene frame: Yuna (Songstress) and Shuyin, approved idles; FFX-2 only.",
                    base.F_SMALL, W - 32, fill=(200, 192, 176), gap=2)
    return cv


def abyss_phone(key: str) -> Image.Image:
    W, H = 390, 844
    _, name, _, fx = PICKS[key]
    cv = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    f = plate(key, W, 640, fx, 0.92)
    base.place(f, base.YUNA_SS, 300, 130, 600)
    base.place(f, base.SHUYIN, 312, 272, 606, flip=True, alpha=0.92)
    cv.alpha_composite(f, (0, 100))
    d = ImageDraw.Draw(cv)
    d.rectangle((0, 0, W, 44), fill=INK)
    d.text((10, 10), f"Abyss {key.upper()}: {name}", font=base.F_LAB, fill=GOLD)
    d.text((W - 118, 12), "NOT INSTALLED", font=base.F_SMALL, fill=base.RED)
    base.text_block(d, (16, 760), "[beat 4] He calls her Lenne.  (caption position only; dialogue to be written)", base.F_LAB, W - 32, fill=PAPER)
    return cv


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    for key in PICKS:
        if only and key not in only:
            continue
        if not os.path.exists(os.path.join(CAND, PICKS[key][0])):
            print("skip (no plate yet)", key)
            continue
        slug = PICKS[key][1].lower().replace(" ", "-").replace("'", "")
        dk, ph = (battle_desktop(key), battle_phone(key)) if key.startswith("c") else (abyss_desktop(key), abyss_phone(key))
        p1 = os.path.join(OUT, f"{key}-{slug}-1600.jpg")
        p2 = os.path.join(OUT, f"{key}-{slug}-phone-390.jpg")
        dk.convert("RGB").save(p1, quality=86, optimize=True)
        ph.convert("RGB").save(p2, quality=88, optimize=True)
        print(p1, os.path.getsize(p1), p2, os.path.getsize(p2))


if __name__ == "__main__":
    main()
