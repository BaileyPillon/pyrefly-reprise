"""Omnis portrait options sheet (FFX only): one column, 1200 px wide, phone-readable, stamped CANDIDATE."""
from PIL import Image, ImageDraw, ImageFont
W = 1200; BG = (22, 20, 32); FG = (236, 232, 222); GOLD = (214, 176, 84); DIM = (170, 164, 180)
F = lambda s, b=False: ImageFont.truetype('C:/Windows/Fonts/' + ('segoeuib.ttf' if b else 'segoeui.ttf'), s)
A = 'D:/Final Fantasy/public/art/portraits/'; O5 = 'D:/Final Fantasy/docs/concepts/chapters/omnis/o5-portrait/'
blocks = []
def text(lines, size=36, bold=False, col=FG, pad=18):
    f = F(size, bold); out = []
    for ln in lines:
        words = ln.split(' '); cur = ''
        for w in words:
            t = (cur + ' ' + w).strip()
            if f.getlength(t) > W - 2 * 30: out.append(cur); cur = w
            else: cur = t
        out.append(cur)
    h = len(out) * int(size * 1.3) + 2 * pad; im = Image.new('RGB', (W, h), BG); d = ImageDraw.Draw(im)
    for i, ln in enumerate(out): d.text((30, pad + i * int(size * 1.3)), ln, font=f, fill=col)
    blocks.append(im)
def night(p):
    im = Image.open(p).convert('RGBA'); bg = Image.new('RGBA', im.size, (28, 26, 40, 255)); bg.alpha_composite(im); return bg.convert('RGB')
def pair(ims, caps, cellw=590):
    cells = []
    for im, cap in zip(ims, caps):
        im = im.resize((cellw, int(im.height * cellw / im.width)), Image.LANCZOS); cells.append((im, cap))
    h = max(c[0].height for c in cells) + 60; s = Image.new('RGB', (W, h), BG); d = ImageDraw.Draw(s)
    for i, (im, cap) in enumerate(cells):
        x = 10 + i * (cellw + 0); s.paste(im, (x, 0)); d.text((x + 8, im.height + 8), cap, font=F(34, True), fill=GOLD)
    blocks.append(s)
text(['Omnis portrait options (FFX only)'], 46, True, FG, 24)
text(['CANDIDATES. Nothing installed, nothing approved. Each fixes what the judge named: the veins under his eyes, the red eyes on the horned shoulder cowls, no orange trim, no cone spikes.'], 32, False, DIM)
pair([night(A + 'seymour-omnis.png'), night('work/opt-a.png')], ['Now (judged FAIL 5.9)', 'A  O-1 A, no trim'])
pair([night('work/opt-b.png'), night('work/opt-c.png')], ['B  red-lined collar', 'C  rune-strip stole'])
text(['A is painted from the O-1 A idle you picked (its own head crop, repainted at portrait size). B and C are A with only the trim changed: B takes the red-lined collar of his Guado robe from the Macalania portrait; C takes a strip from the O-1 A skirt as a stole. Face, eyes, cowls and tattoo are the same pixels in all three.'], 32)
text(['In the speaker card (1600x900, Chapter VII line, Garden plate)'], 36, True, GOLD)
cards = [Image.open(p).convert('RGB').crop((70, 490, 720, 840)) for p in [O5 + 'dialogue-a-1600.jpg', 'look/dialogue-a-1600.png', 'look/dialogue-b-1600.png', 'look/dialogue-c-1600.png']]
pair(cards[:2], ['Now', 'A']); pair(cards[2:], ['B', 'C'])
text(['On a phone (390x844)'], 36, True, GOLD)
ph = [Image.open(p).convert('RGB') for p in ['look/dialogue-cur-390.png', 'look/dialogue-a-390.png', 'look/dialogue-b-390.png', 'look/dialogue-c-390.png']]
ph = [im.crop((0, int(im.height * 0.74), int(im.width * 0.62), int(im.height * 0.90))) for im in ph]
pair(ph[:2], ['Now', 'A']); pair(ph[2:], ['B', 'C'])
text(['The pause screen shows only the party, so Seymour has no pause frame to capture.'], 30, False, DIM)
text(["I recommend A (builder's judge pass: A 7.9, C 7.7, B 7.4; an independent judge is still owed). A is the closest to the O-1 A look you picked; B and C only add trim the idle does not have."], 36, True, FG)
H = sum(b.height for b in blocks); s = Image.new('RGB', (W, H), BG); y = 0
for b in blocks: s.paste(b, (0, y)); y += b.height
d = ImageDraw.Draw(s); f = F(40, True); t = 'CANDIDATE'; tw = f.getlength(t)
d.rectangle((W - tw - 60, 16, W - 20, 76), fill=(150, 30, 40)); d.text((W - tw - 40, 18), t, font=f, fill=(255, 255, 255))
s.save('D:/Final Fantasy/docs/concepts/chapters/omnis/portrait-options/sheet.jpg', quality=84, optimize=True)
print(s.size)
