"""Sin art options, 2026-09-29 (FFX only): a rough frame background for a link-4 backdrop option, laid out as Chapter
VIII's scene is (src/scenes/evrae-airship-deck.ts): the painting stands far out, rolled 11.6 degrees so its painted
rail lies level and hides below the deck's far edge; the deck and the rail in front are the engine's own geometry
(research/ffx-evrae-airship.md 12.3: "a hard-edged metal platform ... with a railing and then nothing", the lettered
"Salvage Dream CID" plate, research 12.1). Here the deck and rail are a flat stand-in drawn in code, in the engine's
layout, lit by the painting's own average colour. Not the engine's render.

  python compose_bk.py <painting.full.png> <out.jpg> [zoom=1.25] [cy=0.40]
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = 'D:/pyrefly-ch-sin/public/fonts/chakra-petch/ChakraPetch-Bold-700.woff2'
W, H = 1600, 900
RAIL_TOP, DECK_EDGE = 0.60, 0.70


def main(src, out, *opts):
    o = dict(x.split('=') for x in opts)
    zoom, cy = float(o.get('zoom', 1.42)), float(o.get('cy', 0.50))
    im = Image.open(src).convert('RGB')
    im = im.rotate(-11.6, resample=Image.BICUBIC, expand=False)          # the engine's roll, so the painted rail is level
    w, h = im.size
    cw, ch = w / zoom, w / zoom * 9 / 16
    x0, y0 = (w - cw) / 2, max(0, min(h - ch, cy * h - ch / 2))
    frame = im.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.LANCZOS)
    a = np.asarray(frame, float)
    sky = a[:int(H * 0.6)].reshape(-1, 3).mean(axis=0)
    deck_col = np.clip(sky * 0.25 + np.array((52, 54, 64)) * 0.75, 0, 255)
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    # the deck: a flat plate floor, seams running to a vanishing point above the frame, cross seams closer together far off
    d.polygon([(0, DECK_EDGE * H), (W, DECK_EDGE * H), (W, H), (0, H)], fill=tuple(int(c) for c in deck_col) + (255,))
    vx, vy = W * 0.5, -H * 0.9
    line = tuple(int(c * 0.55) for c in deck_col) + (255,)
    for k in range(-12, 13):
        xb = W / 2 + k * 170
        t = (DECK_EDGE * H - vy) / (H - vy)
        d.line([(vx + (xb - vx) * t, DECK_EDGE * H), (xb, H)], fill=line, width=2)
    y = DECK_EDGE * H
    for i in range(7):
        y += 14 + 16 * i
        d.line([(0, y), (W, y)], fill=line, width=2)
    # the rail: dark posts and two bars, level, just above the deck's far edge
    rail = (22, 22, 30, 255)
    for x in range(0, W + 1, 150):
        d.rectangle([x - 5, RAIL_TOP * H, x + 5, DECK_EDGE * H], fill=rail)
    d.rectangle([0, RAIL_TOP * H - 5, W, RAIL_TOP * H + 3], fill=rail)
    d.rectangle([0, (RAIL_TOP + 0.05) * H - 3, W, (RAIL_TOP + 0.05) * H + 2], fill=rail)
    # "SALVAGE DREAM / CID", low contrast, flattened in perspective (our own type, Chakra Petch, OFL)
    try:
        f1, f2 = ImageFont.truetype(FONT, 64), ImageFont.truetype(FONT, 76)
        t = Image.new('RGBA', (W, 220), (0, 0, 0, 0)); dt = ImageDraw.Draw(t)
        c = tuple(int(min(255, v * 1.35 + 20)) for v in deck_col) + (150,)
        dt.text((W / 2, 50), 'SALVAGE DREAM', font=f1, fill=c, anchor='mm')
        dt.text((W / 2, 140), 'CID', font=f2, fill=c, anchor='mm')
        t = t.resize((W, 110))
        lay.alpha_composite(t, (60, int(H * 0.79)))
    except OSError:
        pass
    base = frame.convert('RGBA'); base.alpha_composite(lay.filter(ImageFilter.GaussianBlur(0.6)))
    base.convert('RGB').save(out, quality=88)
    print('wrote', out)


if __name__ == '__main__':
    main(*sys.argv[1:])
