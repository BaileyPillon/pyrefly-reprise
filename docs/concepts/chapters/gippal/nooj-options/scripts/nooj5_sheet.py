"""Options sheet for Bailey: the approved portrait, the installed attempt-4 pair and the three attempt-5 options.
Per row: idle and cast (full, reduced), a 1:1 crop of the idle's upper body, and the idle and cast at game size (1:1 crops
of real 1600x900 engine frames). Writes docs/concepts/chapters/gippal/nooj-options/sheet.jpg."""
from PIL import Image, ImageDraw, ImageFont

C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj5'
LIVE = 'D:/Final Fantasy/public/art'
FR = 'D:/Tools/pyrefly-scratch/nooj5/frames'
OUT = 'D:/Final Fantasy/docs/concepts/chapters/gippal/nooj-options/sheet.jpg'
try:
    F = ImageFont.truetype('arial.ttf', 22); FB = ImageFont.truetype('arialbd.ttf', 28); FS = ImageFont.truetype('arial.ttf', 17)
except OSError:
    F = FB = FS = ImageFont.load_default()

ROWS = [
    ('Installed now: attempt 4 (B-treated), 6.9 FAIL', f'{LIVE}/characters/nooj-shade/idle.png', f'{LIVE}/characters/nooj-shade/cast.png', 'installed', (60, 0, 560, 560)),
    ('Option 1  "Leaning on the cane"  (idle seed 975102, cast 975201)', f'{C}/idle-lean/C-opt/cand-975102.png', f'{C}/cast/C-lean-f/cand-975201.png', 'nooj5-lean', None),
    ('Option 2  "Hand on hip"  (idle seed 975101, cast 975201)', f'{C}/idle-upright/C-opt/cand-975101.png', f'{C}/cast/C-upright-f/cand-975201.png', 'nooj5-upright', None),
    ('Option 3  "The portrait\'s gesture"  (idle seed 975101, cast 975201)', f'{C}/idle-glasses/C-opt/cand-975101.png', f'{C}/cast/C-glasses-f/cand-975201.png', 'nooj5-glasses', None),
]
RH, GAP, TOP = 640, 18, 70


def on(im, col):
    im = im.convert('RGBA'); bg = Image.new('RGBA', im.size, col + (255,)); bg.alpha_composite(im); return bg.convert('RGB')


def fit_h(im, h):
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


portrait = on(Image.open(f'{LIVE}/portraits/nooj.png'), (255, 255, 255))
portrait = fit_h(portrait, 700)
cols_w = [260, 560, 420, 240, 370]
W = portrait.width + GAP * 2 + sum(cols_w) + GAP * len(cols_w) + 10
H = TOP + len(ROWS) * (RH + 50) + 60
sheet = Image.new('RGB', (W, H), (236, 234, 230)); d = ImageDraw.Draw(sheet)
d.text((GAP, 18), 'Nooj shade, attempt 5 (FFX-2 only, Den of Woe): three options for Bailey. CANDIDATES: nothing installed.', font=FB, fill=(20, 20, 30))
sheet.paste(portrait, (GAP, TOP + 40)); d.text((GAP, TOP + 8), "Approved portrait (Bailey's pick, the identity anchor)", font=F, fill=(20, 20, 30))
x0 = portrait.width + GAP * 2
heads = ['idle (full)', 'cast (full)', 'idle upper body at 1:1', 'idle at game size', 'cast at game size']
for r, (label, idle, cast, frame, crop) in enumerate(ROWS):
    y = TOP + r * (RH + 50)
    d.text((x0, y + 8), label, font=FB, fill=(120, 20, 20) if r == 0 else (20, 20, 30))
    y += 44; x = x0
    bgc = (60, 64, 80) if r == 0 else (150, 150, 150)
    iim = on(Image.open(idle), bgc); cim = on(Image.open(cast), bgc)
    tiles = [fit_h(iim, RH - 30), None, None, None, None]
    if tiles[0].width > cols_w[0]:
        tiles[0] = tiles[0].resize((cols_w[0], round(tiles[0].height * cols_w[0] / tiles[0].width)), Image.LANCZOS)
    c = fit_h(cim, RH - 30)
    if c.width > cols_w[1]:
        c = c.resize((cols_w[1], round(c.height * cols_w[1] / c.width)), Image.LANCZOS)
    tiles[1] = c
    raw = Image.open(idle)
    if crop is None:
        bb = raw.getchannel('A').getbbox(); cx = (bb[0] + bb[2]) // 2
        crop = (max(0, cx - 210), 0, max(0, cx - 210) + 420, RH - 30)
    tiles[2] = on(raw.crop(crop), bgc)
    tiles[3] = Image.open(f'{FR}/{frame}-idle.png' if r else f'{FR}/installed-idle.png').convert('RGB').crop((720, 170, 960, 580))
    tiles[4] = Image.open(f'{FR}/{frame}-cast.png' if r else f'{FR}/installed-cast.png').convert('RGB').crop((640, 170, 1010, 580))
    for i, t in enumerate(tiles):
        sheet.paste(t, (x, y + 22)); d.text((x, y), heads[i], font=FS, fill=(60, 60, 70)); x += cols_w[i] + GAP
d.text((GAP, H - 44), 'Options: opaque renders before the B treatment. Game size: 1:1 crops of real 1600x900 engine frames (Chapter XI staging, Den plate and the shade served in '
       "Shiva's slot at factor 0.82, B treatment applied). Look by the rendering agent, not a judge and not Bailey.", font=FS, fill=(60, 60, 70))
sheet.save(OUT, quality=86)
print(sheet.size, OUT)
