# Palette check (repair round): the body colour of each pick (opaque pixels that are neither red
# feathers/membrane nor the cream throat) against the five largest colour clusters of every installed
# FFX aeon idle, in CIELAB (Delta E 2000 would be finer; CIE76 is enough to rank). Prints the nearest.
# usage: palette.py <pick.png> [...]
import sys
import numpy as np
from PIL import Image

ART = 'D:/Final Fantasy/public/art/characters'


def lab(rgb):
    c = np.asarray(rgb, np.float64) / 255
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]).T
    xyz /= [0.95047, 1.0, 1.08883]
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def clusters(path, k=5):
    im = Image.open(path).convert('RGBA')
    im.thumbnail((360, 360))
    a = np.asarray(im)
    px = a[..., :3][a[..., 3] > 128]
    q = Image.fromarray(px.reshape(-1, 1, 3).astype(np.uint8)).quantize(k)
    pal = q.getpalette()[:3 * k]
    return [(tuple(pal[i * 3:i * 3 + 3]), n) for n, i in sorted(q.getcolors(), reverse=True)]


aeons = {a: clusters(f'{ART}/{a}/idle.png') for a in ['ifrit', 'shiva', 'ixion', 'bahamut', 'valefor']}
for f in sys.argv[1:]:
    a = np.asarray(Image.open(f).convert('RGBA')).astype(np.float64)
    rgb, al = a[..., :3], a[..., 3] > 128
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    red = (r - np.maximum(g, b)) > 25
    cream = (r > b + 25) & (r > 150) & ~red
    body = al & ~red & ~cream & (rgb.mean(-1) > 40)
    mean = rgb[body].mean(0)
    L = lab(mean)
    out = {'file': f.replace(chr(92), '/').split('/')[-1], 'bodyMean': '#%02x%02x%02x' % tuple(int(v) for v in mean),
           'bodyShare': round(float(body.sum() / al.sum()), 3)}
    q = Image.fromarray(rgb[body].reshape(-1, 1, 3).astype(np.uint8)).quantize(3)
    pal = q.getpalette()[:9]
    tones = []
    for n, i in sorted(q.getcolors(), reverse=True):
        c = tuple(pal[i * 3:i * 3 + 3])
        near = []
        for name, cl in aeons.items():
            d = min((float(np.linalg.norm(lab(cc) - lab(c))), '#%02x%02x%02x' % cc) for cc, _ in cl)
            near.append((round(d[0], 1), name, d[1]))
        tones.append({'tone': '#%02x%02x%02x' % c, 'share': round(n / body.sum(), 2), 'nearest': sorted(near)[:2]})
    out['bodyTones'] = tones
    print(out)
