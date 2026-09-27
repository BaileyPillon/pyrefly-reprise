"""Cleanup-round composite (no HUD, scale and placement are the round 2 guesses): reactor core.1 with
Guard Scorpion on the LEFT facing right and Cloud + Barret on the RIGHT facing left
(research/ff7-battle-staging.md sections 2, 3.3 and 7). Nothing is mirrored.
Usage: python composite-clean.py <candidates_root> <out.jpg> <scorpion_png> <cloud_png> <barret_png> <caption>"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

root, out, gs_p, cl_p, br_p, caption = sys.argv[1:7]
W, H = 1600, 900
bg = Image.open(os.path.join(root, 'reactor-core/core.1.png')).convert('RGB')
s = max(W / bg.width, H / bg.height)
bg = bg.resize((round(bg.width * s), round(bg.height * s)), Image.LANCZOS)
bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width - W) // 2 + W, (bg.height - H) // 2 + H))


def place(canvas, path, height, cx, feet):
    im = Image.open(os.path.join(root, path)).convert('RGBA')
    k = height / im.height
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    canvas.paste(im, (round(cx - im.width / 2), round(feet - im.height)), im)


place(bg, gs_p, 470, 440, 860)     # boss, left, facing right
place(bg, br_p, 380, 1240, 800)    # Barret, upstage right, facing left
place(bg, cl_p, 390, 1430, 870)    # Cloud, downstage right, facing left
d = ImageDraw.Draw(bg)
try:
    f = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
except Exception:
    f = ImageFont.load_default()
d.rectangle([0, 0, W, 34], fill=(20, 18, 24))
d.text((10, 5), caption, fill=(236, 214, 150), font=f)
bg.save(out, quality=86, optimize=True)
print(out, os.path.getsize(out))
