# Target vs build for B1 option B (iter2-spellfx-b).
#   python docs/screenshots/spellfx-b/sheet.py
# Left: the approved mock still (docs/concepts/spell-fx-2026-09-26/stills/<game>-B-<el>.jpg).
# Right: the real engine with the built effect, held at the mock's still time on
# the mock's target through the debug trigger (frames/<game>-desk-<el>.jpg).
# Phone: the build at 390x844 (the mock had no phone frames), one strip per game.
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
STILLS = HERE.parents[1] / 'concepts' / 'spell-fx-2026-09-26' / 'stills'
FR = HERE / 'frames'
ELS = ['fire', 'ice', 'thunder', 'water', 'holy', 'cure', 'hit']
T = {'fire': 0.78, 'ice': 0.95, 'thunder': 0.5, 'water': 0.62, 'holy': {'ffx': 0.72, 'ffx2': 0.66}, 'cure': 0.8, 'hit': 0.34}
W, H, BAR = 960, 540, 40


def font(size):
    for f in ('C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


F = font(18)


def label(draw, x, text, accent):
    draw.rectangle([x, 0, x + W, BAR], fill=(11, 10, 18))
    draw.rectangle([x, 0, x + 6, BAR], fill=accent)
    draw.text((x + 18, 9), text, font=F, fill=(244, 241, 232))


def pair(game, el, reduced=False):
    suffix = '-reduced' if reduced else ''
    tgt = STILLS / f'{game}-B-{el}{suffix}.jpg'
    bld = FR / f'{game}-desk-{el}{suffix}.jpg'
    if not tgt.exists() or not bld.exists():
        return None
    t = T[el][game] if isinstance(T[el], dict) else T[el]
    accent = (247, 182, 217) if game == 'ffx2' else (227, 185, 74)
    img = Image.new('RGB', (W * 2, H + BAR), (0, 0, 0))
    img.paste(Image.open(tgt).convert('RGB').resize((W, H)), (0, BAR))
    img.paste(Image.open(bld).convert('RGB').resize((W, H)), (W, BAR))
    d = ImageDraw.Draw(img)
    rf = ' · REDUCE FLASHES ON' if reduced else ''
    label(d, 0, f'TARGET · approved option B mock · {el}{rf}', accent)
    label(d, W, f'BUILD · real engine, {game.upper()} · FORCED via debug trigger at t={t}s{rf}', accent)
    return img


def main():
    for game in ('ffx', 'ffx2'):
        rows = [p for el in ELS for p in [pair(game, el)] if p] + [p for el in ('thunder', 'holy') for p in [pair(game, el, True)] if p]
        for i in range(0, len(rows), 3):
            chunk = rows[i:i + 3]
            sheet = Image.new('RGB', (W * 2, sum(r.height for r in chunk)))
            y = 0
            for r in chunk:
                sheet.paste(r, (0, y))
                y += r.height
            sheet.save(HERE / f'target-vs-build-{game}-{i // 3 + 1}.jpg', quality=84)
        strip = [Image.open(FR / f'{game}-phone-{el}.jpg').convert('RGB').resize((260, 563)) for el in ELS if (FR / f'{game}-phone-{el}.jpg').exists()]
        if strip:
            s = Image.new('RGB', (260 * len(strip), 563 + BAR), (0, 0, 0))
            d = ImageDraw.Draw(s)
            for i, im in enumerate(strip):
                s.paste(im, (i * 260, BAR))
                d.text((i * 260 + 10, 10), ELS[i], font=F, fill=(244, 241, 232))
            s.save(HERE / f'build-phone-{game}.jpg', quality=84)


main()


# Real commands (forced.mjs): each element cast through the presenter on the
# first party turn of a fresh battle, HUD on. One sheet per game and size.
SPELLS = {
    'ffx': ['fire', 'blizzard', 'thunder', 'water', 'holy', 'cure', 'attack'],
    'ffx2': ['x2-black-mage-fire', 'x2-black-mage-blizzard', 'x2-black-mage-thunder', 'x2-black-mage-water', 'x2-shared-holy', 'x2-white-mage-cure', 'attack'],
}


def real_commands():
    for game, spells in SPELLS.items():
        for size, (w, h, cols) in {'desk': (640, 360, 2), 'phone': (260, 563, 7)}.items():
            ims = [(s, FR / f'forced-{game}-{size}-{s}.jpg') for s in spells]
            ims = [(s, Image.open(p).convert('RGB').resize((w, h))) for s, p in ims if p.exists()]
            if not ims:
                continue
            rows = (len(ims) + cols - 1) // cols
            sheet = Image.new('RGB', (w * cols, (h + BAR) * rows), (0, 0, 0))
            d = ImageDraw.Draw(sheet)
            for i, (s, im) in enumerate(ims):
                x, y = (i % cols) * w, (i // cols) * (h + BAR)
                sheet.paste(im, (x, y + BAR))
                d.text((x + 10, y + 9), f'{s} · REAL COMMAND (scripted)', font=F, fill=(244, 241, 232))
            sheet.save(HERE / f'real-command-{game}-{size}.jpg', quality=82)


real_commands()
