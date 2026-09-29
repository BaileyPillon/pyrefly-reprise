"""Sin's head options, 2026-09-29 (FFX only): the supporting images for the head section.

  python images.py mouths <C|A>      frames/<opt>-mouths.jpg: the five mouth stages of one option, cropped on the head
  python images.py repairs           frames/C-repairs.jpg: round 3 beside the repaired rig, one row per repair
Everything here is our own pixels (the rigs in D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/).
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'frames')
CAND = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin'
R3 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/final/rig'
RIG = {'C': f'{CAND}/head-c/rig', 'A': f'{CAND}/head-a/rig'}
BOX = {'C': (880, 150, 2000, 790), 'A': (700, 40, 2000, 900)}
NAMES = ['0 SHUT (turns 1-3)', '1 OPEN 1 (turns 4-6)', '2 OPEN 2 (turns 7-9)', '3 OPEN 3 (turns 10-11)', '4 FULLY OPEN (turn 12)']
BG, INK = (11, 10, 18), (240, 236, 226)


def font(size, bold=True):
    for f in (('segoeuib.ttf' if bold else 'segoeui.ttf'), 'arial.ttf'):
        try:
            return ImageFont.truetype(f'C:/Windows/Fonts/{f}', size)
        except OSError:
            pass
    return ImageFont.load_default()


def mouths(opt):
    box = BOX[opt]
    tw = 520
    th = round(tw * (box[3] - box[1]) / (box[2] - box[0]))
    out = Image.new('RGB', (2 * tw + 36, 3 * (th + 44) + 12), BG)
    d = ImageDraw.Draw(out)
    for k in range(5):
        im = Image.open(f'{RIG[opt]}/stage-{k}.jpg').convert('RGB').crop(box).resize((tw, th), Image.LANCZOS)
        x, y = 12 + (k % 2) * (tw + 12), 12 + (k // 2) * (th + 44)
        out.paste(im, (x, y))
        d.text((x, y + th + 6), NAMES[k], font=font(22), fill=INK)
    p = os.path.join(OUT, f'{opt}-mouths.jpg')
    out.save(p, quality=84)
    print(p)


def repairs():
    rows = [
        ('Stage 0, the lips. Round 3: a violet slit from snout to hinge, lower teeth under the top row. Now: one dark seam, fangs over it',
         0, (940, 330, 1760, 560)),
        ('Stage 4, the chin. Round 3: a pair of oversized fangs and a dark ring. Now: a row of even teeth',
         4, (960, 560, 1300, 760)),
        ('Stage 0, under the jaw. Round 3: the open jaw\'s faint outline and a pale edge. Now: cleared',
         0, (940, 480, 1760, 760)),
        ('The glints. Round 3: small white specks over the head. Now: gone (the eye and the teeth untouched)',
         2, (1200, 160, 1900, 420)),
    ]
    tw = 520
    blocks = []
    for text, k, box in rows:
        th = round(tw * (box[3] - box[1]) / (box[2] - box[0]))
        a = Image.open(f'{R3}/stage-{k}.png').convert('RGB').crop(box).resize((tw, th), Image.LANCZOS)
        b = Image.open(f'{RIG["C"]}/stage-{k}.jpg').convert('RGB').crop(box).resize((tw, th), Image.LANCZOS)
        blocks.append((text, a, b, th))
    H = sum(th + 70 for *_, th in blocks) + 12
    out = Image.new('RGB', (2 * tw + 36, H), BG)
    d = ImageDraw.Draw(out)
    y = 12
    for text, a, b, th in blocks:
        d.text((12, y), text, font=font(17, False), fill=INK)
        d.text((12, y + 24), 'ROUND 3', font=font(16), fill=(255, 120, 120))
        d.text((24 + tw, y + 24), 'REPAIRED', font=font(16), fill=(227, 185, 74))
        out.paste(a, (12, y + 46)); out.paste(b, (24 + tw, y + 46))
        y += th + 70
    p = os.path.join(OUT, 'C-repairs.jpg')
    out.save(p, quality=84)
    print(p)


if __name__ == '__main__':
    if sys.argv[1] == 'mouths':
        mouths(sys.argv[2])
    else:
        repairs()
