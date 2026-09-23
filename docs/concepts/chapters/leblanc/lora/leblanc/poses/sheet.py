"""Leblanc LoRA poses sheet (FFX-2 only): one row per state.

Columns: the installed idle (x0.5) | the v3 pick the redo replaced (x0.5) | the redo pick, installed (x0.5) |
idle face 1:1 | pick face 1:1 | idle costume 1:1 | pick costume 1:1 | then 1:1 crops of what the judge named
(idle's matching region first). The first LoRA pass's sheet (round 3 -> v3) is in git history (a6386b2).
Every whole figure is on mid grey at the same pixel scale (0.5), so sizes compare; the crops are
native pixels. Boxes are in each cutout's own pixels.

    python sheet.py            # -> sheet.jpg here (JPEG q85)
"""
import pathlib

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
ART = REPO / 'public/art/characters/leblanc'
REPLACED = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/leblanc/replaced-redo-2026-09-23')
CAND = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')
BG = (150, 150, 150)
S = 0.5
IDLE_FACE = (205, 20, 465, 280)
IDLE_COSTUME = (190, 220, 490, 520)
IDLE_BOOT = (150, 850, 400, 1118)
IDLE_FAN = (330, 150, 540, 330)
# state -> (tag, face box, costume box, [(label, idle box or None, pick box)]) in the cutout's pixels
PICKS = {
    'attack': ('attack.v7.2', (290, 20, 550, 280), (330, 230, 630, 530),
               [('fan thrust', IDLE_FAN, (0, 200, 340, 360)), ('front leg + boot', IDLE_BOOT, (180, 700, 470, 1190)),
                ('rear boot', None, (600, 900, 840, 1190))]),
    'cast': ('cast.r2red', (215, 130, 475, 390), (130, 310, 430, 610),
             [('fan: red+silver (installed)', IDLE_FAN, (190, 0, 500, 230)), ('fan: black (alternative)', None, ('cast.r2black', 190, 0, 500, 230))]),
    'hurt': ('hurt.v4.5', (380, 0, 640, 260), (190, 60, 490, 360),
             [('fan', IDLE_FAN, (0, 160, 320, 420)), ('both legs + boots', IDLE_BOOT, (0, 560, 420, 967))]),
    'ko': ('ko.r2', (40, 0, 300, 260), (330, 40, 630, 340),
           [('fan guard black', IDLE_FAN, (40, 230, 280, 340)), ('boots open-toe, no shadow', IDLE_BOOT, (880, 180, 1216, 437))]),
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
    for state, (tag, face, cost, extra) in PICKS.items():
        new = flat(ART / f'{state}.png')
        old = flat(REPLACED / f'{state}.png')
        cells = [('idle (installed, x0.5)', scaled(idle)), (f'{state}: replaced v3 pick (x0.5)', scaled(old)),
                 (f'{state}: REDO {tag} (x0.5)', scaled(new)),
                 ('idle face 1:1', idle.crop(IDLE_FACE)), (f'{tag} face 1:1', new.crop(face)),
                 ('idle costume 1:1', idle.crop(IDLE_COSTUME)), (f'{tag} costume 1:1', new.crop(cost))]
        for label, ibox, pbox in extra:
            if ibox:
                cells.append((f'idle {label.split(":")[0].split(" ")[0]} 1:1', idle.crop(ibox)))
            if isinstance(pbox[0], str):
                cells.append((f'{label} 1:1', flat(CAND / f'{pbox[0]}.png').crop(pbox[1:])))
            else:
                cells.append((f'{label} 1:1', new.crop(pbox)))
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
