"""Target (approved mockup) vs build, side by side, for docs/concepts/status-display-0929/final/."""
import os
from PIL import Image, ImageDraw, ImageFont

T = 'D:/pyrefly-advisor-v3/docs/concepts/status-display-0929/options/'
B = 'D:/Tools/pyrefly-scratch/picks-0929/status-o3/final/'
OUT = 'D:/pyrefly-advisor-v3/docs/concepts/status-display-0929/final/'
SHOTS = 'D:/pyrefly-advisor-v3/docs/screenshots/picks-0929/status-o3/'
os.makedirs(OUT, exist_ok=True)
os.makedirs(SHOTS, exist_ok=True)


def font(size):
    for f in ('C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def sheet(game, size, title):
    a = Image.open(f'{T}o3-{game}-{size}.jpg').convert('RGB')
    b = Image.open(f'{B}{game}-{size}.jpg').convert('RGB')
    w, h = a.size
    gap, head = 16, 56
    if size == 'desktop':
        canvas = Image.new('RGB', (w, head * 2 + h * 2 + gap), (18, 17, 26))
        pos = [(0, head), (0, head * 2 + h + gap)]
        labels = [(16, 12), (16, head + h + gap + 12)]
    else:
        canvas = Image.new('RGB', (w * 2 + gap, head + h), (18, 17, 26))
        pos = [(0, head), (w + gap, head)]
        labels = [(12, 14), (w + gap + 12, 14)]
    canvas.paste(a, pos[0])
    canvas.paste(b, pos[1])
    d = ImageDraw.Draw(canvas)
    f = font(26 if size == 'desktop' else 17)
    if size == 'desktop':
        d.text(labels[0], f'TARGET  approved O3 mockup  ({title})', fill=(227, 185, 74), font=f)
        d.text(labels[1], 'BUILD  branch status-o3, reached with real keys, headless GPU', fill=(73, 216, 180), font=f)
    else:
        d.text(labels[0], f'TARGET  O3 mockup ({title})', fill=(227, 185, 74), font=f)
        d.text(labels[1], 'BUILD  status-o3, real keys', fill=(73, 216, 180), font=f)
    name = f'o3-vs-build-{game}-{size}.jpg'
    canvas.save(OUT + name, quality=86)
    b.save(SHOTS + f'build-{game}-{size}.jpg', quality=88)
    return name


made = [
    sheet('ffx', 'desktop', 'FFX Chapter I, Hi-Potion aimed at the Zombie Kimahri, 1600x900'),
    sheet('ffx', 'phone', 'FFX, 390x844'),
    sheet('x2', 'desktop', 'FFX-2 Chapter IV, Bahamut with the staged statuses, 1600x900'),
    sheet('x2', 'phone', 'FFX-2, 390x844'),
]
for g in ('ffx', 'x2'):
    Image.open(f'{B}gallery-{g}.jpg').convert('RGB').save(OUT + f'build-gallery-{g}.jpg', quality=86)
    made.append(f'build-gallery-{g}.jpg')
print('\n'.join(made))
