"""Rough layout frames for the Ixion at Djose concepts (FFX-2 only).

Greybox composites over existing, original Pyrefly paintings (public/art, local only).
No retail images. Every frame is stamped ROUGH LAYOUT. Run from the repo root:
    python docs/concepts/chapters/ixion-djose-2026-09-27/scripts/frames.py
Writes frames/*.jpg (1600x900) into the concept folder.
"""
from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = os.getcwd()
ART = os.path.join(ROOT, "public", "art")
OUT = os.path.join(ROOT, "docs", "concepts", "chapters", "ixion-djose-2026-09-27")
FONTS = "C:/Windows/Fonts"

INK = (20, 18, 26)
GOLD = (217, 180, 90)
PAPER = (240, 232, 214)
RED = (214, 72, 60)
CYAN = (120, 200, 235)
W, H = 1600, 900
MAIN = (0, 64, 1600, 600)  # main panel box


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(os.path.join(FONTS, name), size)


F_TITLE = font("georgiab.ttf", 30)
F_SUB = font("segoeui.ttf", 17)
F_LAB = font("seguisb.ttf", 17)
F_SMALL = font("segoeui.ttf", 15)
F_STAMP = font("segoeuib.ttf", 22)
F_HUD = font("georgiai.ttf", 22)
F_BIG = font("georgiab.ttf", 40)


def load(rel: str) -> Image.Image:
    return Image.open(os.path.join(ART, rel)).convert("RGBA")


def cover(im: Image.Image, w: int, h: int, focus_x: float = 0.5, focus_y: float = 0.5) -> Image.Image:
    s = max(w / im.width, h / im.height)
    im = im.resize((math.ceil(im.width * s), math.ceil(im.height * s)), Image.LANCZOS)
    x = int((im.width - w) * focus_x)
    y = int((im.height - h) * focus_y)
    return im.crop((x, y, x + w, y + h))


def chamber(w: int, h: int, cool: bool = False, fx: float = 0.5) -> Image.Image:
    """Stand-in plate: the Macalania Temple painting, recoloured to storm-grey stone."""
    base = load("backdrops/macalania-temple.png").convert("L")
    base = ImageOps.autocontrast(base, cutoff=2)
    if cool:
        im = ImageOps.colorize(base, black=(12, 14, 22), mid=(70, 80, 96), white=(190, 205, 215))
    else:
        im = ImageOps.colorize(base, black=(16, 14, 18), mid=(88, 80, 72), white=(214, 196, 160))
    return cover(im.convert("RGBA"), w, h, fx, 0.55)


def abyss(w: int, h: int, dark: float = 0.0) -> Image.Image:
    """Stand-in plate: the Chapter 5 Farplane painting, washed toward a white fog."""
    im = load("backdrops/farplane.png").convert("RGB")
    im = ImageEnhance.Color(im).enhance(0.45)
    fog = Image.new("RGB", im.size, (236, 232, 244))
    im = Image.blend(im, fog, 0.35)
    if dark:
        im = ImageEnhance.Brightness(im).enhance(1 - dark)
    return cover(im.convert("RGBA"), w, h, 0.5, 0.6)


def place(canvas: Image.Image, sprite: Image.Image, height: int, cx: int, feet: int,
          flip: bool = False, alpha: float = 1.0, tint: tuple | None = None) -> None:
    s = height / sprite.height
    sp = sprite.resize((max(1, int(sprite.width * s)), height), Image.LANCZOS)
    if flip:
        sp = ImageOps.mirror(sp)
    if tint is not None:
        a = sp.getchannel("A")
        g = ImageOps.colorize(sp.convert("L"), black=(0, 0, 0), white=tint).convert("RGBA")
        g.putalpha(a)
        sp = g
    if alpha < 1:
        a = sp.getchannel("A").point(lambda v: int(v * alpha))
        sp.putalpha(a)
    canvas.alpha_composite(sp, (cx - sp.width // 2, feet - sp.height))


def glow(canvas: Image.Image, cx: int, cy: int, r: int, color: tuple, strength: int = 180) -> None:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color + (strength,))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.6))
    canvas.alpha_composite(layer)


def hole(canvas: Image.Image, cx: int, cy: int, rx: int, ry: int) -> None:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse((cx - rx - 14, cy - ry - 6, cx + rx + 14, cy + ry + 6), fill=(210, 205, 240, 70))
    layer = layer.filter(ImageFilter.GaussianBlur(8))
    canvas.alpha_composite(layer)
    d = ImageDraw.Draw(canvas)
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(6, 5, 10, 255), outline=(150, 140, 170, 255), width=2)
    for i in range(1, 4):
        k = 1 - i * 0.2
        d.ellipse((cx - rx * k, cy - ry * k + ry * 0.25 * i, cx + rx * k, cy + ry * k + ry * 0.25 * i),
                  outline=(60, 50, 90, 255), width=1)


def scrap(canvas: Image.Image, x: int, y: int, scale: float = 1.0) -> None:
    """Greybox 'broken machina' blocks."""
    d = ImageDraw.Draw(canvas)
    shapes = [
        [(0, 0), (70, -30), (110, 5), (60, 30)],
        [(50, -10), (90, -70), (120, -60), (95, 0)],
        [(-40, 10), (10, -25), (30, 20)],
    ]
    for poly in shapes:
        pts = [(x + px * scale, y + py * scale) for px, py in poly]
        d.polygon(pts, fill=(58, 58, 64, 235), outline=(110, 110, 120, 255))


def box(d: ImageDraw.ImageDraw, xy, fill=(20, 18, 26, 190), outline=GOLD, width=2):
    d.rectangle(xy, fill=fill, outline=outline, width=width)


def dashed(d: ImageDraw.ImageDraw, xy, color=GOLD, dash=10, width=2):
    x0, y0, x1, y1 = xy
    for x in range(int(x0), int(x1), dash * 2):
        d.line((x, y0, min(x + dash, x1), y0), fill=color, width=width)
        d.line((x, y1, min(x + dash, x1), y1), fill=color, width=width)
    for y in range(int(y0), int(y1), dash * 2):
        d.line((x0, y, x0, min(y + dash, y1)), fill=color, width=width)
        d.line((x1, y, x1, min(y + dash, y1)), fill=color, width=width)


def wrap(d: ImageDraw.ImageDraw, text: str, f, width: int) -> list[str]:
    lines: list[str] = []
    for para in text.split("\n"):
        cur = ""
        for word in para.split(" "):
            t = (cur + " " + word).strip()
            if d.textlength(t, font=f) <= width:
                cur = t
            else:
                if cur:
                    lines.append(cur)
                cur = word
        lines.append(cur)
    return lines


def text_block(d, xy, text, f, width, fill=PAPER, gap=4) -> int:
    x, y = xy
    for line in wrap(d, text, f, width):
        d.text((x, y), line, font=f, fill=fill)
        y += f.size + gap
    return y


def callout(canvas: Image.Image, target, at, text: str, width: int = 300, color=GOLD) -> None:
    d = ImageDraw.Draw(canvas)
    lines = wrap(d, text, F_LAB, width)
    h = len(lines) * (F_LAB.size + 4) + 12
    x, y = at
    d.line((target[0], target[1], x + (0 if target[0] < x else width + 16), y + h // 2), fill=color, width=2)
    d.ellipse((target[0] - 5, target[1] - 5, target[0] + 5, target[1] + 5), fill=color)
    box(d, (x, y, x + width + 16, y + h), fill=(14, 12, 20, 215), outline=color)
    yy = y + 6
    for line in lines:
        d.text((x + 8, yy), line, font=F_LAB, fill=PAPER)
        yy += F_LAB.size + 4


def hud(canvas: Image.Image, enemy_move: str | None, gauge: int | None = None) -> None:
    """Greybox of the FFX-2 ATB HUD layout shipped in Chapters 4, 5 and XI (positions only)."""
    d = ImageDraw.Draw(canvas)
    ox, oy = 0, 0  # drawn on the scene image, before it is placed
    # enemy bar, top left
    d.polygon([(ox + 40, oy + 36), (ox + 560, oy + 36), (ox + 540, oy + 76), (ox + 40, oy + 76)],
              fill=(20, 18, 26, 210), outline=GOLD)
    d.text((ox + 56, oy + 42), "Ixion", font=F_HUD, fill=PAPER)
    d.rectangle((ox + 140, oy + 52, ox + 470, oy + 60), fill=(200, 150, 190, 255))
    d.text((ox + 480, oy + 46), "SCAN", font=F_SMALL, fill=(180, 170, 160))
    if gauge is not None:
        # 20 pips, each = 5 points of the action counter
        for i in range(20):
            x = ox + 140 + i * 17
            lit = i < gauge
            d.rectangle((x, oy + 84, x + 12, oy + 96), fill=(250, 214, 90, 255) if lit else (50, 46, 60, 230),
                        outline=GOLD)
        d.text((ox + 490, oy + 80), f"{gauge * 5}/100", font=F_LAB, fill=(250, 214, 90))
    if enemy_move:
        d.rounded_rectangle((ox + 640, oy + 30, ox + 960, oy + 74), radius=6, fill=(20, 18, 26, 230), outline=RED, width=2)
        d.text((ox + 660, oy + 38), "ENEMY MOVE  " + enemy_move, font=F_STAMP, fill=PAPER)
    # command menu, right
    for i, cmd in enumerate(["ATTACK", "ARCANA", "ITEM"]):
        y = oy + 226 + i * 50
        d.polygon([(ox + 1250, y), (ox + 1570, y), (ox + 1555, y + 40), (ox + 1250, y + 40)],
                  fill=(240, 232, 214, 225) if i == 0 else (20, 18, 26, 215), outline=GOLD)
        d.text((ox + 1268, y + 7), cmd, font=F_STAMP, fill=INK if i == 0 else PAPER)
    # party rows, bottom right (bars only; no invented numbers)
    for i, (name, job) in enumerate([("Yuna", "WM"), ("Rikku", "DK"), ("Paine", "DK")]):
        y = oy + 384 + i * 40
        d.polygon([(ox + 1180, y), (ox + 1580, y), (ox + 1566, y + 34), (ox + 1180, y + 34)],
                  fill=(20, 18, 26, 215), outline=GOLD)
        d.text((ox + 1192, y + 6), f"{name}  {job}", font=F_LAB, fill=PAPER)
        d.rectangle((ox + 1320, y + 14, ox + 1450, y + 20), fill=(120, 210, 140))
        d.rectangle((ox + 1470, y + 14, ox + 1550, y + 20), fill=(120, 170, 235))


def title_bar(canvas: Image.Image, letter: str, name: str, standins: str) -> None:
    d = ImageDraw.Draw(canvas)
    d.rectangle((0, 0, W, 60), fill=INK)
    d.text((18, 12), f"Concept {letter}: {name}", font=F_TITLE, fill=GOLD)
    d.rectangle((W - 236, 10, W - 16, 50), fill=RED)
    d.text((W - 222, 16), "ROUGH LAYOUT", font=F_STAMP, fill=(255, 245, 235))
    d.rectangle((0, 858, W, H), fill=INK)
    text_block(d, (16, 862), "FFX-2 only. Not a painting, nothing built. " + standins, F_SMALL, W - 32,
               fill=(200, 192, 176), gap=2)


def main_frame(canvas: Image.Image, bg: Image.Image) -> None:
    canvas.alpha_composite(bg, (MAIN[0], MAIN[1]))
    d = ImageDraw.Draw(canvas)
    dashed(d, (MAIN[0] + 4, MAIN[1] + 4, MAIN[2] - 5, MAIN[3] - 5), color=(217, 180, 90), dash=14, width=2)


PANEL_Y, PANEL_H, CAP_Y = 612, 190, 806


def panel_rect(i: int):
    x = 16 + i * (380 + 16)
    return x, PANEL_Y, x + 380, PANEL_Y + PANEL_H


def panel(canvas: Image.Image, i: int, img: Image.Image, caption: str, step: str) -> None:
    x0, y0, x1, y1 = panel_rect(i)
    canvas.alpha_composite(img, (x0, y0))
    d = ImageDraw.Draw(canvas)
    d.rectangle((x0, y0, x1 - 1, y1 - 1), outline=GOLD, width=2)
    d.rectangle((x0, y0, x0 + 34, y0 + 30), fill=GOLD)
    d.text((x0 + 10, y0 + 3), step, font=F_STAMP, fill=INK)
    text_block(d, (x0, CAP_Y), caption, F_SMALL, 380, fill=PAPER, gap=2)


def new_canvas() -> Image.Image:
    return Image.new("RGBA", (W, H), (26, 24, 32, 255))


# ---------------------------------------------------------------- sprites
IXION = load("characters/ixion/idle.png")
IXION_ATK = load("characters/ixion/attack.png")
IXION_OD = load("characters/ixion/overdrive.png")
YUNA_WM = load("characters/yuna-white-mage/idle.png")
RIKKU_DK = load("characters/rikku-dark-knight/idle.png")
PAINE_DK = load("characters/paine-dark-knight/idle.png")
YUNA_SS = load("characters/yuna-songstress/idle.png")
YUNA_KO = load("characters/yuna-songstress/ko.png")
SHUYIN = load("characters/shuyin/idle.png")
P_BARALAI = load("portraits/baralai.png")
P_NOOJ = load("portraits/nooj.png")
P_GIPPAL = load("portraits/gippal.png")
BEVELLE = load("backdrops/bevelle-underground.png")


def battle_scene(bg: Image.Image, with_hole: bool, horn_charge: int = 0) -> Image.Image:
    c = bg.copy()
    if with_hole:
        hole(c, 700, 440, 190, 34)
        scrap(c, 120, 470, 1.1)
        scrap(c, 1080, 450, 0.9)
    place(c, YUNA_WM, 270, 170, 520)
    place(c, RIKKU_DK, 285, 320, 530)
    place(c, PAINE_DK, 300, 470, 535)
    place(c, IXION, 250, 980, 505)
    if horn_charge:
        for k in range(horn_charge):
            glow(c, 832 - k * 9, 355 - k * 12, 16 + k * 3, (255, 226, 110), 150)
    return c


def portrait_circle(img: Image.Image, size: int) -> Image.Image:
    p = ImageOps.fit(img, (size, size), Image.LANCZOS, centering=(0.5, 0.3))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(p, (0, 0), mask)
    ImageDraw.Draw(out).ellipse((0, 0, size - 1, size - 1), outline=GOLD, width=3)
    return out


def rotated(sprite: Image.Image, angle: float) -> Image.Image:
    return sprite.rotate(angle, expand=True, resample=Image.BICUBIC)


# ---------------------------------------------------------------- panels shared
def p_fall(label_hole: bool = True) -> Image.Image:
    c = chamber(380, 190)
    hole(c, 200, 140, 110, 22)
    place(c, IXION_ATK, 110, 320, 150)
    y = rotated(YUNA_WM, -55)
    place(c, y, 80, 190, 150, alpha=0.95)
    d = ImageDraw.Draw(c)
    d.line((300, 110, 230, 120), fill=RED, width=4)
    d.polygon([(230, 112), (218, 121), (232, 128)], fill=RED)
    return c


def p_card(text: str, sub: str) -> Image.Image:
    c = Image.new("RGBA", (380, 190), INK + (255,))
    d = ImageDraw.Draw(c)
    d.rectangle((14, 14, 366, 176), outline=GOLD, width=2)
    tw = d.textlength(text, font=F_TITLE)
    d.text(((380 - tw) / 2, 58), text, font=F_TITLE, fill=GOLD)
    sw = d.textlength(sub, font=F_SMALL)
    d.text(((380 - sw) / 2, 108), sub, font=F_SMALL, fill=PAPER)
    return c


def whistle_row(c: Image.Image, x: int, y: int, lit: int, r: int = 16) -> None:
    d = ImageDraw.Draw(c)
    for i in range(4):
        cx = x + i * (r * 2 + 12)
        d.ellipse((cx - r, y - r, cx + r, y + r), fill=(250, 214, 90, 255) if i < lit else (40, 36, 52, 230),
                  outline=GOLD, width=2)
        d.text((cx - 5, y - 10), str(i + 1), font=F_LAB, fill=INK if i < lit else PAPER)


# ---------------------------------------------------------------- concept A
def concept_a() -> Image.Image:
    cv = new_canvas()
    title_bar(cv, "A", "The Horn and the Hole  (one link + a short scripted close)",
              "Stand-ins: Macalania Temple plate recoloured for the Chamber; the FFX Ixion painting; Chapter 5 Farplane "
              "washed white for the Abyss. None of these is the Djose art.")
    scene = battle_scene(chamber(1600, 536), with_hole=True)
    hud(scene, "RECHARGE")
    glow(scene, 980, 380, 120, (255, 236, 150), 70)
    main_frame(cv, scene)
    callout(cv, (700, 64 + 440), (560, 64 + 470), "The hole where the fayth stood, in view the whole fight. It pays off after the win.", 330)
    callout(cv, (800, 64 + 74), (560, 64 + 104), "The only tell is the game's own: the 'Recharge' banner (+200 HP, +200 MP). "
            "Thor's Hammer is his next action. Shell and heal now.", 360)
    callout(cv, (1060, 64 + 330), (1100, 64 + 150), "Loop: Attack or Thundara (all), twice, then Aerospark (5/8 of current HP). "
            "Absorbs Lightning, weak to Water.", 300)
    panel(cv, 0, p_fall(), "Win, then he rises and charges. Yuna is thrown into the hole (4 sources to 1).", "1")
    c = abyss(380, 190)
    place(c, SHUYIN, 150, 250, 185)
    place(c, YUNA_SS, 140, 130, 185)
    c.alpha_composite(portrait_circle(P_BARALAI, 52), (318, 8))
    panel(cv, 1, c, "Abyss cutscene: Shuyin calls her Lenne, the embrace, then he is Baralai. Portraits over one plate.", "2")
    c = abyss(380, 190, dark=0.1)
    place(c, YUNA_SS, 140, 90, 185)
    c.alpha_composite(portrait_circle(P_NOOJ, 58), (190, 30))
    c.alpha_composite(portrait_circle(P_GIPPAL, 58), (262, 30))
    d = ImageDraw.Draw(c)
    d.text((190, 100), "Crimson Spheres 2, 3", font=F_LAB, fill=INK)
    panel(cv, 2, c, "Nooj and Gippal hand over Crimson Spheres 2 and 3, then follow him deeper.", "3")
    c = abyss(380, 190, dark=0.45)
    place(c, YUNA_SS, 120, 70, 180, alpha=0.9)
    glow(c, 310, 90, 40, (255, 220, 90), 200)
    whistle_row(c, 150, 40, 3)
    d = ImageDraw.Draw(c)
    d.text((150, 150), "\u201cI'm all alone.\u201d  [press] x4", font=F_LAB, fill=PAPER)
    panel(cv, 3, c, "Playable: press to whistle four times; a light leads her out. Card: she wakes in the Bevelle Underground.", "4")
    return cv


# ---------------------------------------------------------------- concept B
def concept_b() -> Image.Image:
    cv = new_canvas()
    title_bar(cv, "B", "The Storm Gauge  (the fight, readable; ends on the fall)",
              "Stand-ins: Macalania Temple plate recoloured; the FFX Ixion painting. The gauge and horn sparks are "
              "an invented readout, not in the game.")
    scene = battle_scene(chamber(1600, 536), with_hole=True, horn_charge=4)
    hud(scene, None, gauge=13)
    main_frame(cv, scene)
    callout(cv, (400, 64 + 90), (40, 64 + 120), "NEW (ours, a switch): the hidden action counter as 20 pips. +5 per action, "
            "+10 for Aerospark, +5 each time you hit him.", 330)
    callout(cv, (830, 64 + 350), (600, 64 + 150), "Sparks climb the horn with the counter. At 100: Recharge, then Thor's Hammer.", 300)
    callout(cv, (700, 64 + 440), (560, 64 + 480), "Burst vs pace: every hit brings the Hammer sooner.", 300, color=CYAN)
    c = Image.new("RGBA", (380, 190), INK + (255,))
    d = ImageDraw.Draw(c)
    for row, (lit, lab) in enumerate([(5, "25"), (13, "65"), (20, "100: RECHARGE")]):
        for i in range(20):
            x = 16 + i * 14
            d.rectangle((x, 30 + row * 50, x + 10, 44 + row * 50),
                        fill=(250, 214, 90) if i < lit else (50, 46, 60), outline=GOLD)
        d.text((300, 26 + row * 50), lab if row < 2 else "100", font=F_LAB, fill=PAPER)
    d.text((16, 160), "then: THOR'S HAMMER (all)", font=F_LAB, fill=RED)
    panel(cv, 0, c, "The gauge filling: Ixion alone adds 20 per 3-turn cycle; your hits add the rest.", "1")
    c = chamber(380, 190)
    place(c, IXION, 130, 250, 170)
    glow(c, 250, 110, 80, (255, 236, 150), 110)
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((20, 16, 250, 50), radius=6, fill=INK, outline=RED, width=2)
    d.text((32, 22), "RECHARGE  +200 HP / MP", font=F_LAB, fill=PAPER)
    panel(cv, 1, c, "The game's banner stays; the gauge only says it is coming.", "2")
    panel(cv, 2, p_fall(), "The last playable frame: the charge, Yuna goes over the edge.", "3")
    c = p_card("Chapter complete", "The Abyss: held for a later chapter")
    d = ImageDraw.Draw(c)
    d.line((60, 150, 320, 150), fill=RED, width=2)
    panel(cv, 3, c, "Ends on the fall. No Abyss, no whistle, no Shuyin in this chapter.", "4")
    return cv


# ---------------------------------------------------------------- concept C
def concept_c() -> Image.Image:
    cv = new_canvas()
    title_bar(cv, "C", "Two Rooms and the Abyss  (antechamber fight, walkable Abyss)",
              "Stand-ins: Macalania Temple plate recoloured cold for the antechamber; the FFX Ixion painting; grey "
              "figures for the Al Bhed; Farplane washed white. Diagrams are ours.")
    bg = chamber(1600, 536, cool=True, fx=0.2)
    d = ImageDraw.Draw(bg)
    d.rounded_rectangle((660, 150, 860, 440), radius=90, fill=(8, 8, 14, 255), outline=(150, 160, 190), width=3)
    glow(bg, 760, 300, 60, (200, 190, 255), 90)
    scene = battle_scene(bg, with_hole=False)
    hud(scene, "AEROSPARK")
    main_frame(cv, scene)
    callout(cv, (760, 64 + 300), (560, 64 + 120), "The door to the Chamber of the Fayth. The fight is out here (Blackestmage; "
            "1 source against 3, IX-4).", 330)
    callout(cv, (980, 64 + 420), (1000, 64 + 150), "Same fight as A: the counter hidden, the 'Recharge' banner is the tell.", 240)
    c = chamber(380, 190, cool=True, fx=0.2)
    place(c, IXION_ATK, 110, 270, 160)
    for x in (90, 150):
        dd = ImageDraw.Draw(c)
        dd.ellipse((x - 10, 90, x + 10, 110), fill=(120, 120, 130))
        dd.rectangle((x - 12, 110, x + 12, 160), fill=(120, 120, 130))
    ImageDraw.Draw(c).text((50, 164), "Al Bhed (grey stand-ins)", font=F_SMALL, fill=PAPER)
    panel(cv, 0, c, "Intro: at the top of the stairs Ixion is attacking two Al Bhed (1 source).", "1")
    panel(cv, 1, p_fall(), "After the win they walk into the Chamber; the charge and the fall happen at the hole.", "2")
    c = abyss(380, 190, dark=0.25)
    d = ImageDraw.Draw(c)
    nodes = [(30, 160, "land"), (110, 120, "Shuyin"), (190, 140, "embrace\n(locked)"), (270, 100, "Baralai"), (350, 130, "alone")]
    for (x1, y1, _), (x2, y2, _) in zip(nodes, nodes[1:]):
        d.line((x1, y1, x2, y2), fill=GOLD, width=4)
    for x, y, lab in nodes:
        d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=GOLD)
        yy = y - 44 if y > 120 else y + 12
        for k, part in enumerate(lab.split("\n")):
            d.text((x - 26, yy + k * 16), part, font=F_SMALL, fill=INK)
    panel(cv, 2, c, "NEW system: Yuna walks a short Abyss path in 2.5D; the embrace locks input (Ultimania).", "3")
    c = abyss(380, 190, dark=0.5)
    d = ImageDraw.Draw(c)
    for i in range(4):
        x0 = 120 + i * 62
        d.polygon([(x0, 130 - i * 6), (x0 + 58, 124 - i * 6), (x0 + 58, 136 - i * 6), (x0, 142 - i * 6)],
                  fill=(250, 214, 90, 255) if i < 3 else (60, 56, 70, 255), outline=GOLD)
    place(c, YUNA_SS, 100, 80, 160)
    glow(c, 350, 90, 30, (255, 220, 90), 200)
    whistle_row(c, 130, 40, 3, r=14)
    panel(cv, 3, c, "Each whistle lights a quarter of a yellow bridge; after four she runs across.", "4")
    return cv


def main() -> None:
    os.makedirs(os.path.join(OUT, "frames"), exist_ok=True)
    for name, fn in [("a-horn-and-hole", concept_a), ("b-storm-gauge", concept_b), ("c-two-rooms", concept_c)]:
        im = fn().convert("RGB")
        p = os.path.join(OUT, "frames", f"{name}-1600.jpg")
        im.save(p, quality=86, optimize=True)
        print(p, im.size, os.path.getsize(p))


if __name__ == "__main__":
    main()
