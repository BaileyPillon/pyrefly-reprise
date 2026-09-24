# Compose a battle frame: plate + painted cut-outs (with contact shadows) + the real HUD layer on top.
# Usage: frame.py plate.png hud.png out.jpg item ...   item = path@x,y,h[,flip][,hover=PX]
#   x,y = ground point in the 1600x900 frame, h = height of the painting's opaque box, hover lifts the
#   painting PX above its ground point and shrinks its shadow (visual bible §1.22.6 hover rule).
import sys
from PIL import Image, ImageFilter, ImageDraw
plate, hud, out = sys.argv[1:4]
bg = Image.open(plate).convert('RGBA')
if bg.size != (1600, 900):
    sw, sh = bg.size; s = max(1600 / sw, 900 / sh)
    bg = bg.resize((round(sw * s), round(sh * s)), Image.LANCZOS)
    l = (bg.width - 1600) // 2; t = (bg.height - 900) // 2
    bg = bg.crop((l, t, l + 1600, t + 900))
for it in sys.argv[4:]:
    path, spec = it.rsplit('@', 1)
    parts = spec.split(','); x, y, h = float(parts[0]), float(parts[1]), float(parts[2])
    flags = parts[3:]; hover = 0.0
    for f in flags:
        if f.startswith('hover='): hover = float(f[6:])
    im = Image.open(path).convert('RGBA')
    if 'nocrop' not in flags:
        bbox = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox(); im = im.crop(bbox)
    if 'flip' in flags: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    s = h / im.height; im = im.resize((max(1, round(im.width * s)), round(h)), Image.LANCZOS)
    sh = Image.new('RGBA', bg.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    k = 0.55 if hover else 1.0
    rw = im.width * 0.36 * k; rh = max(5, h * 0.03 * k)
    d.ellipse((x - rw, y - rh, x + rw, y + rh), fill=(20, 0, 30, 60 if hover else 110))
    sh = sh.filter(ImageFilter.GaussianBlur(max(3, h * 0.02)))
    bg = Image.alpha_composite(bg, sh)
    layer = Image.new('RGBA', bg.size, (0, 0, 0, 0))
    layer.paste(im, (round(x - im.width / 2), round(y - hover - im.height)), im)
    bg = Image.alpha_composite(bg, layer)
if hud != '-':
    bg = Image.alpha_composite(bg, Image.open(hud).convert('RGBA'))
bg.convert('RGB').save(out, quality=90)
print(out)
