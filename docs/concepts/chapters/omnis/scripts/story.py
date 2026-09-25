# O-2 storyboards: one 90-degree turn of the upper-left disc after a spell hits it (magic turns
# a disc right, research 4.3). Four crops of real engine frames (HUD off). B adds the disc strip.
from PIL import Image, ImageDraw, ImageFont
F = 'D:/Tools/pyrefly-scratch/omnis-options/frames/'
D = 'D:/Final Fantasy/docs/concepts/chapters/omnis/o2-discs/'
BOX = (600, 40, 1120, 430)
COL = {'fire': (240, 118, 34), 'water': (47, 127, 232), 'ice': (160, 106, 235), 'thunder': (245, 212, 50)}


def font(n, bold=True):
    f = ImageFont.truetype('bahnschrift.ttf', n)
    try:
        f.set_variation_by_name('Bold' if bold else 'Regular')
    except Exception:
        pass
    return f


CAPS = ['1  a spell hits the disc', '2  it turns right', '3  still turning', '4  Thunder now faces him']


def strip_row(d, x, y, w, final):
    names = ['thunder' if final else 'fire', 'fire', 'fire', 'fire']
    cw = (w - 30) // 4
    for i, n in enumerate(names):
        bx = x + i * (cw + 10)
        d.rectangle((bx, y, bx + cw, y + 40), fill=COL[n], outline=(255, 255, 255) if (final and i == 0) else None, width=3)
        d.text((bx + 8, y + 6), n.upper(), font=font(24), fill=(11, 10, 18) if n in ('fire', 'thunder') else (255, 255, 255))
    txt = 'ABSORBS FIRE  ·  HALVES THUNDER' if final else 'ABSORBS FIRE  ·  WEAK TO ICE'
    d.text((x, y + 50), txt, font=font(26), fill=(227, 185, 74))


for t in ('a', 'b', 'c'):
    src = 'c' if t == 'c' else 'a'
    crops = [Image.open(F + 'clean-%s-t%d.png' % (src, th)).convert('RGB').crop(BOX) for th in (0, 30, 60, 90)]
    cw, ch = crops[0].size
    extra = 110 if t == 'b' else 0
    W = 4 * cw + 5 * 20
    cv = Image.new('RGB', (W, ch + 80 + extra), (22, 16, 28))
    d = ImageDraw.Draw(cv)
    for i, c in enumerate(crops):
        x = 20 + i * (cw + 20)
        cv.paste(c, (x, 64))
        d.text((x, 14), CAPS[i], font=font(32), fill=(244, 241, 232))
        if t == 'b':
            strip_row(d, x, 64 + ch + 12, cw, i == 3)
    cv.save(D + '%s-turn.jpg' % t, quality=88)
print('ok')
