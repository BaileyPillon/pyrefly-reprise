# O-4 link-transition storyboards (still panels; the motion is described in the captions of the sheet).
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
PW, PH = 800, 450
INK = (11, 10, 18); GOLD = (227, 185, 74); PAPER = (244, 241, 232); PINK = (240, 170, 215)
def font(n, name='bahnschrift.ttf'):
    try: return ImageFont.truetype(name, n)
    except Exception: return ImageFont.load_default()
serif = lambda n: font(n, 'georgiai.ttf')
def panel(path): return Image.open(path).convert('RGB').resize((PW, PH), Image.LANCZOS)
end1 = panel('frames/o2-road-shiva-b-violet.jpg')
# "link won" beat: Shiva dissolving into pyreflies (the engine's own KO dissolve, drawn here as a fade + motes)
won = end1.copy(); d = ImageDraw.Draw(won)
rng = np.random.default_rng(4)
ov = Image.new('RGBA', (PW, PH), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
for _ in range(90):
    x = 500 + rng.normal(0, 22); y = 220 + rng.normal(0, 70); r = rng.uniform(1.5, 4)
    od.ellipse((x - r * 3, y - r * 3, x + r * 3, y + r * 3), fill=(210, 190, 255, 60)); od.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 220))
won = Image.alpha_composite(won.convert('RGBA'), ov.filter(ImageFilter.GaussianBlur(0.8))).convert('RGB')
nxt = panel('frames/o1-road-a.jpg')
# A: title card cut
card = Image.new('RGB', (PW, PH), INK); d = ImageDraw.Draw(card)
d.rectangle((0, 0, 8, PH), fill=GOLD)
d.text((70, 150), 'II  ·  OF THREE', font=font(22), fill=GOLD)
d.text((66, 185), 'The Magus Sisters', font=serif(58), fill=PAPER)
d.line((70, 265, 560, 265), fill=GOLD, width=2)
d.text((70, 280), 'Road to the Farplane  —  the second platform', font=font(20), fill=(170, 164, 180))
# B: pan up the road (the full plate with the camera path drawn on it)
road = Image.open('o3/road-b3.png').convert('RGB').resize((PW, PH), Image.LANCZOS); d = ImageDraw.Draw(road)
pts = [(420, 430), (430, 360), (430, 322), (420, 300)]
d.line(pts, fill=GOLD, width=4)
for (x, y), lab in zip([(430, 360), (430, 322), (420, 300)], ['1', '2', '3']):
    d.ellipse((x - 11, y - 11, x + 11, y + 11), fill=INK, outline=GOLD, width=2); d.text((x - 5, y - 11), lab, font=font(18), fill=GOLD)
d.text((20, 18), 'camera glides from platform 1 to 2 (~2 s), party fades in on 2', font=font(18), fill=INK)
# C: save sphere + restore, fade through white
fade = Image.blend(won, Image.new('RGB', (PW, PH), (250, 244, 255)), 0.72); d = ImageDraw.Draw(fade)
sph = Image.new('RGBA', (PW, PH), (0, 0, 0, 0)); sd = ImageDraw.Draw(sph)
sd.ellipse((340, 120, 460, 240), fill=(120, 190, 255, 200)); sph = sph.filter(ImageFilter.GaussianBlur(10))
sd = ImageDraw.Draw(sph); sd.ellipse((362, 142, 438, 218), fill=(200, 235, 255, 230)); sd.ellipse((378, 152, 400, 172), fill=(255, 255, 255, 255))
fade = Image.alpha_composite(fade.convert('RGBA'), sph).convert('RGB'); d = ImageDraw.Draw(fade)
d.rectangle((250, 280, 550, 360), fill=INK); d.rectangle((250, 280, 256, 360), fill=GOLD)
d.text((272, 290), 'SAVE SPHERE', font=font(16), fill=GOLD)
d.text((272, 314), 'HP and MP restored', font=font(24), fill=PAPER)
for name, ims in [('a', [won, card, nxt]), ('b', [won, road, nxt]), ('c', [won, fade, nxt])]:
    for i, im in enumerate(ims): im.save(f'frames/o4-{name}-{i + 1}.jpg', quality=88)
print('ok')
