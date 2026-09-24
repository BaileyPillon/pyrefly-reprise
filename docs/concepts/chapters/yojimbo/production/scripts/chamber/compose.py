# Flat composite (PIL), NOT an engine render: the installed plate + a stand-in floor band
# + the engine's own party layer (difference matte) + the installed Yojimbo/Daigoro idles
# + the live HUD layer from the real game (Chapter I's, the chapter is not wired).
import json, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
PLATE = Image.open(r'D:/Final Fantasy/public/art/backdrops/cavern-stolen-fayth.png').convert('RGB')
ART = r'D:/Final Fantasy/public/art/characters/'

def matte(tag):
    b = np.asarray(Image.open(f'cap/{tag}-black.png').convert('RGB')).astype(np.float32)
    w = np.asarray(Image.open(f'cap/{tag}-white.png').convert('RGB')).astype(np.float32)
    a = 1.0 - (w - b).mean(2, keepdims=True) / 255.0
    a = np.clip(a, 0, 1)
    c = np.where(a > 0.004, b / np.maximum(a, 1e-3), 0)
    rgba = np.concatenate([np.clip(c, 0, 255), a * 255], 2).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

def backdrop(W, H, scale, xoff, yoff):
    pw, ph = int(PLATE.width * scale), int(PLATE.height * scale)
    p = PLATE.resize((pw, ph), Image.LANCZOS)
    canvas = Image.new('RGB', (W, H))
    canvas.paste(p.crop((xoff, yoff, xoff + W, min(ph, yoff + H))), (0, 0))
    bottom = ph - yoff
    if bottom < H:
        # stand-in for the scene's own 3D floor below the painted one: the plate's last
        # 60 rows stretched, darkened toward the camera (the scene wiring decides the real floor)
        band = p.crop((xoff, ph - int(60 * scale / 0.6), xoff + W, ph)).resize((W, H - bottom), Image.BICUBIC)
        arr = np.asarray(band).astype(np.float32)
        g = np.linspace(1.0, 0.72, H - bottom)[:, None, None]
        canvas.paste(Image.fromarray((arr * g).astype(np.uint8)), (0, bottom))
    return canvas, bottom

def place(canvas, subj, gx, gy, hpx, flip=False):
    im = Image.open(ART + subj + '/idle.png').convert('RGBA')
    meta = json.load(open(ART + subj + '/idle.json'))
    base = meta.get('baselineY', im.height)
    top = im.getbbox()[1]
    s = hpx / (base - top)
    im2 = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    if flip: im2 = im2.transpose(Image.FLIP_LEFT_RIGHT)
    # contact shadow like the engine's
    sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    rw = im2.width * 0.32
    d.ellipse((gx - rw, gy - rw * 0.16, gx + rw, gy + rw * 0.16), fill=(0, 0, 0, 120))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
    canvas.alpha_composite(im2, (int(gx - im2.width / 2), int(gy - base * s)))

def frame(tag, W, H, scale, xoff, yoff, yoj, dai, out):
    bg, bottom = backdrop(W, H, scale, xoff, yoff)
    c = bg.convert('RGBA')
    pass  # Daigoro left out: the brief asks for Yojimbo only, and his spot is the stage's call
    place(c, 'yojimbo-cavern', *yoj)
    c.alpha_composite(matte(tag))
    clean = c.copy()
    c.alpha_composite(Image.open(f'cap/{tag}-hud.png').convert('RGBA'))
    c.convert('RGB').save(out + '.png'); clean.convert('RGB').save(out + '-clean.png')
    print(out, 'painted floor ends at y', bottom)

# 1600x900: the whole plate width (scale 0.595, top 14 px cropped), no stand-in floor.
# Party as the engine placed it (Tidus 507,782; Kimahri 691,621; Yuna 898,757).
# 1.82 world units = ~250 px near y 640, so Yojimbo 2.55 wu = ~350 px, Daigoro 0.73 wu = ~100 px.
frame('d', 1600, 900, 1600 / 2688, 0, 14, (1010, 650, 350), (790, 652, 100), 'out/desk')
# 390x844: plate at 0.55, window x 640; party measured (Kimahri 91,583; Yuna 282,713).
frame('m', 390, 844, 0.55, 640, 0, (345, 600, 330), (225, 612, 94), 'out/phone')
