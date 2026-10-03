import sys, os
from PIL import Image, ImageDraw
# python lineup-sheet.py <dir> <girl> <out.jpg> <sphere,sphere,...>
d, girl, out, spheres = sys.argv[1:5]
spheres = spheres.split(',')
poses = ['idle', 'ready', 'attack', 'follow', 'cast', 'item', 'hurt', 'ko', 'victory']
W, H = 460, 470
S = Image.new('RGB', (len(poses) * W // 2, len(spheres) * H // 2 + 16), (20, 20, 28))
dr = ImageDraw.Draw(S)
for r, sp in enumerate(spheres):
    for c, po in enumerate(poses):
        p = f'{d}/{girl}-{sp}-{po}.png'
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert('RGB').resize((W // 2, H // 2), Image.LANCZOS)
        S.paste(im, (c * W // 2, 16 + r * H // 2))
        dr.text((c * W // 2 + 3, 16 + r * H // 2 + 2), f'{sp}/{po}', fill=(255, 255, 0))
# horizontal reference lines every 50 game px (25 on the sheet) from the feet line (bottom of each row at y=430 of the clip)
for r in range(len(spheres)):
    base = 16 + r * H // 2 + 430 // 2
    for k in range(0, 9):
        y = base - k * 25
        dr.line([(0, y), (S.width, y)], fill=(255, 0, 0) if k % 2 == 0 else (90, 60, 60), width=1)
S.save(out, quality=88)
print(out, S.size)
