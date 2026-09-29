"""Sin art options, 2026-09-29 (FFX only): the three strips in frames/ (cores.jpg, bk-plates.jpg, plates.jpg), from the
frame backgrounds (make_frames.py) and the picked paintings. Run after make_frames.py.
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'frames')
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin'
B = C + '/frames-bg'
F = ImageFont.truetype(os.path.join(HERE, '../../../../../public/fonts/chakra-petch/ChakraPetch-Bold-700.woff2'), 22)
INK, PAPER = (22, 20, 28), (245, 241, 230)


def crop(p, cx, cy, w=0.26):
    im = Image.open(p).convert('RGB'); W, H = im.size; cw = int(w * W); ch = int(cw * 0.75)
    x0 = int(cx * W - cw / 2); y0 = max(0, int(cy * H - ch / 2))
    return im.crop((x0, y0, x0 + cw, y0 + ch)).resize((400, 300))


def pair(paths, labels, out):
    s = Image.new('RGB', (1600, 500), PAPER); d = ImageDraw.Draw(s)
    for i, (p, lab) in enumerate(zip(paths, labels)):
        s.paste(Image.open(p).convert('RGB').resize((790, 451)), (i * 810, 0)); d.text((i * 810 + 8, 462), lab, font=F, fill=INK)
    s.save(out, quality=84)


def main():
    tiles = [(crop(B + '/genais-a.jpg', 0.78, 0.27), 'A at rest: "Core is inactive."'),
             (crop(B + '/genais-a-shell.jpg', 0.78, 0.27), 'A charging: "Core gathers energy."'),
             (crop(B + '/genais-b.jpg', 0.82, 0.2), 'B at rest'), (crop(B + '/genais-b-shell.jpg', 0.82, 0.2), 'B charging')]
    s = Image.new('RGB', (1600, 340), PAPER); d = ImageDraw.Draw(s)
    for i, (t, c) in enumerate(tiles):
        s.paste(t, (i * 400, 0)); d.text((i * 400 + 8, 305), c, font=F, fill=INK)
    s.save(os.path.join(OUT, 'cores.jpg'), quality=84)
    pair([C + '/backdrop/bk-a-8.full.png', C + '/backdrop/bk-b-4.full.png'],
         ['A · the whole plate (golden dusk, bk-a-8)', 'B · the whole plate (violet evenfall, bk-b-4)'], os.path.join(OUT, 'bk-plates.jpg'))
    pair([C + '/plates/flight-1.full.png', C + '/plates/back-1.full.png'],
         ['Links I-II plate: late afternoon over the cloud sea (flight-1)', "Link III plate: on Sin's back at sunset (back-1)"],
         os.path.join(OUT, 'plates.jpg'))
    print('strips written')


if __name__ == '__main__':
    main()
