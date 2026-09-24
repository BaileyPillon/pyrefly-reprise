# Veto sheet for the installed Cavern of the Stolen Fayth plate (CANDIDATE).
from PIL import Image, ImageDraw, ImageFont
W = 2400; M = 24
BG = (14, 14, 20); INK = (236, 232, 222); GOLD = (232, 186, 72); DIM = (160, 156, 150)
def font(sz, bold=False):
    for f in (['C:/Windows/Fonts/segoeuib.ttf'] if bold else []) + ['C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf']:
        try: return ImageFont.truetype(f, sz)
        except OSError: pass
    return ImageFont.load_default()
F1, F2, F3 = font(40, True), font(24), font(22)
src = Image.open('src.png').convert('RGB')
fin = Image.open(r'D:/Final Fantasy/public/art/backdrops/cavern-stolen-fayth.png').convert('RGB')
rows = []
half = (W - 3 * M) // 2
def fit(im, w): return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
rows.append(('Whole plate: the picked concept A "cold" (left) and the installed candidate (right), 2688x1536',
             [(fit(src, half), 'picked: backdrop-a3, seed 901103'), (fit(fin, half), 'installed: public/art/backdrops/cavern-stolen-fayth.png')]))
pad = (1540 - 400, 1394 - 170, 1540 + 400, 1394 + 130)
rock = (250, 380, 500, 620)
light = (1400, 300, 1800, 600)
rows.append(('1:1 native pixels: the teleport pad (research 6.1 "a teleport pad in the middle ... dormant"), before and after',
             [(src.crop(pad), 'before (no pad in any option)'), (fin.crop(pad), 'after: hand-blocked from the floor pixels, inpaint 0.36, seed 930201')]))
rows.append(('1:1: the floating rock removed (no GPU) | an untouched detail (the daylight crack)',
             [(src.crop(rock), 'before'), (fin.crop(rock), 'after: fill, no GPU'), (fin.crop(light), 'untouched, identical to the pick')]))
d = Image.open('out/desk.png'); p = Image.open('out/phone.png')
dw = W - 3 * M - 390 * 2 // 1 - M
rows.append(('Under the real HUD (flat PIL composite, not the engine): 1600x900 and 390x844. Party = the engine\'s own layer; Yojimbo = installed yojimbo-cavern idle at 2.55 world units',
             [(fit(d, W - 3 * M - 420 - M), '1600x900: Chapter I\'s live HUD (the chapter is not wired, so it names Chapter I\'s enemies)'), (fit(p, 420), '390x844, 1:1')]))
H = 120
for label, items in rows: H += 50 + max(im.height for im, _ in items) + 44
sheet = Image.new('RGB', (W, H + 60), BG); dr = ImageDraw.Draw(sheet)
dr.text((M, 24), 'Chapter IX - Cavern of the Stolen Fayth backdrop (FFX only)  -  CANDIDATE', font=F1, fill=INK)
dr.text((M, 78), 'Method r3: the picked pixels; two repairs only (pad added, floating rock removed); 1.42 % of pixels changed; 46 + 45 s GPU', font=F2, fill=DIM)
y = 120
for label, items in rows:
    dr.text((M, y), label, font=F2, fill=GOLD); y += 44
    x = M; hh = 0
    for im, cap in items:
        sheet.paste(im, (x, y)); dr.text((x, y + im.height + 6), cap, font=F3, fill=DIM)
        x += im.width + M; hh = max(hh, im.height)
    y += hh + 50
dr.text((W - 300, H + 10), 'CANDIDATE', font=F1, fill=GOLD)
sheet.save(r'D:/Final Fantasy/docs/concepts/chapters/yojimbo/production/chamber.jpg', quality=88)
print(sheet.size)
