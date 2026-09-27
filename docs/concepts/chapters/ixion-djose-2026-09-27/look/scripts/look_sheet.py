"""Phone-readable sheet for the FFX-2 Ixion look options (FFX-2 only; options, nothing installed).

    python docs/concepts/chapters/ixion-djose-2026-09-27/look/scripts/look_sheet.py

Writes look/sheet/part-1-overview.jpg and part-2..5 (one per option), each 1080 px wide,
under 2000 px tall and under 1 MB. Reads the option cutouts from the candidates folder and
the frames from look/frames. Deletes nothing.
"""
from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
LOOK = os.path.join(HERE, "..")
CAND = r"D:\Tools\pyrefly-art-backup\candidates\2026-09-27-ixion"
FONTS = "C:/Windows/Fonts"
INK, GOLD, PAPER, RED, PINK = (20, 18, 26), (217, 180, 90), (240, 232, 214), (214, 72, 60), (236, 150, 200)
WIDTH = 1080


def font(n, s):
    return ImageFont.truetype(os.path.join(FONTS, n), s)


F_H1, F_H2, F_B, F_S = font("georgiab.ttf", 44), font("georgiab.ttf", 34), font("segoeui.ttf", 29), font("segoeui.ttf", 25)

OPTS = {
    "a": ("As in FFX", "as-in-ffx",
          ["What: the shipped FFX Ixion painting (idle, attack, overdrive; D-089), untouched.",
           "Sources: the look every source describes: unicorn, golden horn, dark blue hide, grey mane, gold bracers (visual-bible 1, wiki) [single source]. No source says the FFX-2 model differs.",
           "Cost: none. Every pose already exists.",
           "Risk: FFX-2's other possessed aeons (Bahamut, Chapter XI's Shiva and Anima) wear the violet treatment, so this Ixion would be the one fallen aeon that looks healthy."]),
    "b": ("Possessed violet", "possessed-violet",
          ["What: the same pixels with the house 'Chapter IV violet' grade: violet shadows, inner rim, glowing eyes, a dark aura (possess_b.py, the method used for Chapter XI's Shiva).",
           "Sources: none for a recolour (research F-12); it is the house style Bailey picked for the FFX-2 possessed aeons on 2026-09-24 (O-2 B).",
           "Cost: very low, no GPU. Attack and overdrive derive the same way, so Thor's Hammer and the charge keep the approved shapes.",
           "Risk: not canon; it reads as 'one of Shuyin's aeons' rather than 'Djose's machina'."]),
    "c": ("Machina-fused", "machina-fused",
          ["What: a new painting from the FFX idle (img2img 0.76 + reference 0.30): steel plates, cables, round ports and pistons grown into the body; horn and grey mane kept.",
           "Sources: FFExodus alone says the Djose Ixion 'had melded with machina' [single source, IX-8]. The wiki says the temple's fiends merged with the machina and says nothing of Ixion.",
           "Cost: high. Every pose (idle, charge, cast, Thor's Hammer) is a new painting with this identity, and the identity drifts between renders (see the other seeds in the candidates folder).",
           "Risk: one source; the wiki battle picture that would settle it was not viewed (research Q6 asks for that look first)."]),
    "d": ("Storm fiend", "storm-fiend",
          ["What: a new painting from a darkened FFX idle: hide gone black, dulled gold, torn mane, glowing eyes, plus pale lightning arcs (#B8E4FF family) and pyrefly motes laid over it.",
           "Sources: none. A house idea for an aeon without its fayth; the thunder is his element (sourced), the look is ours.",
           "Cost: high, as C, plus the arcs per pose.",
           "Risk: invented; and the dark hide sinks into a dark chamber (see the frame): it would need a lighter room or a rim light."]),
}


class Page:
    def __init__(self):
        self.items: list = []

    def text(self, s, f, color=PAPER, gap=8, indent=0):
        self.items.append(("t", s, f, color, gap, indent))

    def img(self, im, gap=16):
        self.items.append(("i", im, gap))

    def render(self, path):
        probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
        blocks, h = [], 30
        for it in self.items:
            if it[0] == "t":
                _, s, f, color, gap, indent = it
                lines = wrap(probe, s, f, WIDTH - 60 - indent)
                blocks.append(("t", lines, f, color, indent, h))
                h += len(lines) * (f.size + 8) + gap
            else:
                _, im, gap = it
                blocks.append(("i", im, h))
                h += im.height + gap
        h += 20
        page = Image.new("RGB", (WIDTH, h), INK)
        d = ImageDraw.Draw(page)
        for b in blocks:
            if b[0] == "t":
                _, lines, f, color, indent, y = b
                for ln in lines:
                    d.text((30 + indent, y), ln, font=f, fill=color)
                    y += f.size + 8
            else:
                _, im, y = b
                page.paste(im, ((WIDTH - im.width) // 2, y), im if im.mode == "RGBA" else None)
        assert h < 2000, (path, h)
        q = 88
        while True:
            page.save(path, quality=q, optimize=True)
            if os.path.getsize(path) < 1_000_000 or q < 60:
                break
            q -= 6
        print(path, page.size, os.path.getsize(path))


def wrap(d, text, f, width):
    out, cur = [], ""
    for w in text.split(" "):
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width:
            cur = t
        else:
            out.append(cur)
            cur = w
    out.append(cur)
    return out


def cutout_tile(key, w, h, label):
    im = Image.open(os.path.join(CAND, f"opt-{key}.png")).convert("RGBA")
    tile = Image.new("RGBA", (w, h), (58, 60, 70, 255))
    s = min((w - 20) / im.width, (h - 60) / im.height)
    sp = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    tile.alpha_composite(sp, ((w - sp.width) // 2, h - 10 - sp.height))
    d = ImageDraw.Draw(tile)
    d.rectangle((0, 0, w - 1, h - 1), outline=GOLD, width=2)
    d.rectangle((0, 0, 52, 44), fill=GOLD)
    d.text((14, 2), key.upper(), font=F_H2, fill=INK)
    d.text((64, 6), label, font=F_B, fill=PAPER)
    return tile


def head_crop(key):
    """A 1:1 look at the head and horn (top-left quarter of the solid figure)."""
    im = Image.open(os.path.join(CAND, f"opt-{key}.png")).convert("RGBA")
    x0, y0, x1, y1 = im.getchannel("A").point(lambda v: 255 if v > 90 else 0).getbbox()
    box = (x0, y0, x0 + 420, y0 + 480)
    c = Image.new("RGBA", (420, 480), (58, 60, 70, 255))
    c.alpha_composite(im.crop(box))
    ImageDraw.Draw(c).rectangle((0, 0, 419, 479), outline=GOLD, width=2)
    return c


def main():
    out = os.path.join(LOOK, "sheet")
    os.makedirs(out, exist_ok=True)
    # part 1: overview
    p = Page()
    p.text("Ixion's FFX-2 look: four painted options", F_H1, GOLD)
    p.text("FFX-2 only (Chapter 3, Djose). Options, not installed; nothing is on the board. Research Q6: research/ffx2-ixion-djose.md 6.2. All paintings are ours; no retail images.", F_S, (200, 192, 176), 18)
    grid = Image.new("RGBA", (1020, 760), INK + (255,))
    for i, (k, (name, _, _)) in enumerate(OPTS.items()):
        grid.alpha_composite(cutout_tile(k, 500, 370, name), ((i % 2) * 520, (i // 2) * 390))
    p.img(grid)
    p.text("Recommendation: B, possessed violet.", F_H2, PINK, 6)
    p.text("It matches how this game already shows every aeon Shuyin has taken (Bahamut; Chapter XI's Shiva and Anima, the violet Bailey picked on 2026-09-24), it keeps the FFX Ixion Bailey has already seen, and its charge and Thor's Hammer poses derive from approved shapes without a GPU. If the wiki's battle picture, or a Steam look, shows machina on him, C becomes the faithful pick; a mix (C's machina under B's violet) is possible. [estimate: an agent's judgement]", F_S, PAPER, 16)
    p.text("What Bailey is asked: A, B, C, D, or a mix (name the parts you want).", F_B, GOLD, 8)
    p.text("Parts 2 to 5: each option in the Djose stand-in, desktop and phone, with a 1:1 head crop.", F_S, (200, 192, 176))
    p.render(os.path.join(out, "part-1-overview.jpg"))
    # parts 2-5
    for n, (k, (name, slug, lines)) in enumerate(OPTS.items(), start=2):
        p = Page()
        p.text(f"Option {k.upper()}: {name}", F_H1, GOLD)
        fr = Image.open(os.path.join(LOOK, "frames", f"{k}-{slug}-1600.jpg")).convert("RGB")
        p.img(fr.resize((1020, int(fr.height * 1020 / fr.width)), Image.LANCZOS))
        ph = Image.open(os.path.join(LOOK, "frames", f"{k}-{slug}-phone-390.jpg")).convert("RGBA")
        ph = ph.resize((312, 675), Image.LANCZOS)  # the 390x844 phone frame at 80 %
        row = Image.new("RGBA", (1020, 675), INK + (255,))
        row.alpha_composite(ph, (60, 0))
        hc = head_crop(k)
        row.alpha_composite(hc, (480, 0))
        d = ImageDraw.Draw(row)
        d.text((60, 640), "", font=F_S)
        d.text((480, 490), "1:1 head and horn (full-size pixels)", font=F_S, fill=(200, 192, 176))
        d.text((480, 530), "Left: the 390x844 phone frame at 80 %", font=F_S, fill=(200, 192, 176))
        p.img(row)
        for ln in lines:
            p.text(ln, F_S, PAPER, 6)
        p.render(os.path.join(out, f"part-{n}-option-{k}.jpg"))


if __name__ == "__main__":
    main()
