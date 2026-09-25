"""IP-Adapter refs for art5 (FFX-2 only): each installed idle square-padded on white, plus a
square head crop (the Chapter XIII method, METHOD.md section 2: CLIP-Vision centre-crops a
square, so a tall idle loses its head and feet unless it is padded first).

    python make-refs.py yuna-gunner,rikku-thief,...
Writes D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu5/refs/<id>-idle-square.png and
<id>-head.png. Reads public/art/characters/<id>/idle.png; writes nothing in the repo.
"""
import pathlib
import sys

from PIL import Image

ART = pathlib.Path('D:/Final Fantasy/public/art/characters')
OUT = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu5/refs')
# per-idle fixes after looking at the crops: f = head square as a fraction of the figure height
# (tall hair pushes the face down), dx = shift in idle pixels (a sword hilt beside the head)
HEAD = {'rikku-dark-knight': {'dx': -70}, 'rikku-thief': {'f': 0.33}, 'paine-white-mage': {'dx': -160}}


def flat(im):
    bg = Image.new('RGB', im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[-1])
    return bg


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for gid in sys.argv[1].split(','):
        im = Image.open(ART / gid / 'idle.png').convert('RGBA')
        im = im.crop(im.getbbox())
        side = int(max(im.size) * 1.06)
        sq = Image.new('RGB', (side, side), (255, 255, 255))
        sq.paste(flat(im), ((side - im.width) // 2, (side - im.height) // 2))
        sq.save(OUT / f'{gid}-idle-square.png')
        # head: a square of 0.24 x the figure height from the top, centred on the opaque
        # pixels of the top 16 percent (the hair and face)
        o = HEAD.get(gid, {})
        hs = int(im.height * o.get('f', 0.24))
        band = im.crop((0, 0, im.width, int(im.height * 0.16))).split()[-1]
        xs = [x for x in range(band.width) for y in range(0, band.height, 4) if band.getpixel((x, y)) > 128]
        cx = sum(xs) / len(xs) if xs else im.width / 2
        x0 = int(min(max(cx - hs / 2 + o.get('dx', 0), 0), max(im.width - hs, 0)))
        head = flat(im).crop((x0, 0, x0 + hs, hs))
        sqh = Image.new('RGB', (hs, hs), (255, 255, 255)); sqh.paste(head, (0, 0))
        sqh.resize((512, 512), Image.LANCZOS).save(OUT / f'{gid}-head.png')
        print(gid, im.size, 'head x0', x0, 'side', hs)


if __name__ == '__main__':
    main()
