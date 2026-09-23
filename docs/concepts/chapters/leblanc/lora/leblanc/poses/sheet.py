"""Leblanc LoRA poses sheet (FFX-2 only): one row per state.

Columns: the installed idle (x0.5) | the round-3 candidate this run replaced (x0.5) |
the new pick, installed (x0.5) | idle face 1:1 | pick face 1:1 | idle costume 1:1 | pick costume 1:1.
Every whole figure is on mid grey at the same pixel scale (0.5), so sizes compare; the crops are
native pixels. Boxes are in each cutout's own pixels.

    python sheet.py            # -> sheet.jpg here (JPEG q85)
"""
import pathlib

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
ART = REPO / 'public/art/characters/leblanc'
REPLACED = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/leblanc/replaced-2026-09-23')
BG = (150, 150, 150)
S = 0.5
IDLE_FACE = (205, 20, 465, 280)
IDLE_COSTUME = (190, 220, 490, 520)
# state -> (candidate tag, face box, costume box) in the cutout's pixels
PICKS = {
    'attack': ('attack.v3.3', (185, 95, 445, 355), (250, 270, 550, 570)),
    'cast': ('cast.v3.6', (215, 130, 475, 390), (130, 310, 430, 610)),
    'hurt': ('hurt.v3.1', (370, 0, 630, 260), (100, 170, 400, 470)),
    'ko': ('ko.v3.2', (40, 0, 300, 260), (330, 40, 630, 340)),
}


def flat(path):
    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, BG + (255,))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def scaled(im):
    return im.resize((round(im.width * S), round(im.height * S)), Image.LANCZOS)


def main():
    font = ImageFont.load_default()
    idle = flat(ART / 'idle.png')
    rows = []
    for state, (tag, face, cost) in PICKS.items():
        new = flat(ART / f'{state}.png')
        old = flat(REPLACED / f'{state}.png')
        cells = [('idle (installed, x0.5)', scaled(idle)), (f'{state}: replaced round-3 (x0.5)', scaled(old)),
                 (f'{state}: NEW {tag} (x0.5)', scaled(new)),
                 ('idle face 1:1', idle.crop(IDLE_FACE)), (f'{tag} face 1:1', new.crop(face)),
                 ('idle costume 1:1', idle.crop(IDLE_COSTUME)), (f'{tag} costume 1:1', new.crop(cost))]
        h = max(c.height for _, c in cells) + 22
        w = sum(c.width for _, c in cells) + 12 * (len(cells) - 1)
        row = Image.new('RGB', (w, h), (40, 40, 40))
        d = ImageDraw.Draw(row)
        x = 0
        for label, c in cells:
            row.paste(c, (x, 20))
            d.text((x + 4, 4), label, fill=(235, 235, 235), font=font)
            x += c.width + 12
        rows.append(row)
    W = max(r.width for r in rows)
    H = sum(r.height for r in rows) + 10 * (len(rows) - 1)
    out = Image.new('RGB', (W, H), (25, 25, 25))
    y = 0
    for r in rows:
        out.paste(r, (0, y))
        y += r.height + 10
    out.save(HERE / 'sheet.jpg', quality=85)
    print(HERE / 'sheet.jpg', out.size)


if __name__ == '__main__':
    main()
