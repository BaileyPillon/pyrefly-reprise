"""Rough round 2 composite (no HUD, scale and placement are guesses): reactor core.1 with Guard
Scorpion on the LEFT facing right and Cloud + Barret on the RIGHT facing left
(research/ff7-battle-staging.md section 7). Nothing is mirrored.
Usage: python composite-r2.py <candidates_root> <out_dir> <scorpion_png> <cloud_png> <barret_png> <tag>"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

root, out_dir, gs_p, cl_p, br_p, tag = sys.argv[1:7]
W, H = 1600, 900
bg = Image.open(os.path.join(root, 'reactor-core/core.1.png')).convert('RGB')
s = max(W / bg.width, H / bg.height)
bg = bg.resize((round(bg.width * s), round(bg.height * s)), Image.LANCZOS)
bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width - W) // 2 + W, (bg.height - H) // 2 + H))


def place(canvas, path, height, cx, feet):
    im = Image.open(path).convert('RGBA')
    k = height / im.height
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    canvas.paste(im, (round(cx - im.width / 2), round(feet - im.height)), im)


place(bg, os.path.join(root, gs_p), 470, 440, 860)     # boss, left, facing right
place(bg, os.path.join(root, br_p), 380, 1240, 800)    # Barret, upstage right
place(bg, os.path.join(root, cl_p), 390, 1430, 870)    # Cloud, downstage right
d = ImageDraw.Draw(bg)
try:
    f = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
except Exception:
    f = ImageFont.load_default()
cap = f'Round 2 rough composite (no HUD, scale is a guess): core.1 + {gs_p} + {br_p} + {cl_p}'
d.rectangle([0, 0, W, 34], fill=(20, 18, 24))
d.text((10, 5), cap, fill=(236, 214, 150), font=f)
os.makedirs(out_dir, exist_ok=True)
bg.save(os.path.join(out_dir, f'05-composite-1600{tag}.jpg'), quality=86, optimize=True)
bg.resize((390, round(H * 390 / W)), Image.LANCZOS).save(os.path.join(out_dir, f'06-composite-phone-390{tag}.jpg'), quality=88)
print('ok')
