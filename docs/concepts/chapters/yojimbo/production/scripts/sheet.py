# Production sheet for the three Yojimbo-chapter idles (FFX only).
from PIL import Image, ImageDraw, ImageFont
F = 'C:/Windows/Fonts/segoeui.ttf'; FB = 'C:/Windows/Fonts/segoeuib.ttf'
f_t, f_h, f_s = ImageFont.truetype(FB, 40), ImageFont.truetype(FB, 26), ImageFont.truetype(F, 20)
BG, INK, GOLD, DIM = (13, 13, 20), (236, 236, 240), (228, 186, 78), (160, 160, 175)
W = 2440
sheet = Image.new('RGB', (W, 3330), BG); d = ImageDraw.Draw(sheet)
def on_dark(im, col=(30, 32, 44)):
    im = im.convert('RGBA'); b = Image.new('RGBA', im.size, col + (255,)); b.alpha_composite(im); return b.convert('RGB')
def box(img, x, y, label=None, cap=None):
    sheet.paste(img, (x, y)); d.rectangle((x - 1, y - 1, x + img.width, y + img.height), outline=(70, 60, 40))
    if label:
        d.rectangle((x, y, x + 12 + d.textlength(label, font=f_h), y + 38), fill=GOLD); d.text((x + 6, y + 2), label, font=f_h, fill=(20, 20, 20))
    if cap: d.text((x, y + img.height + 6), cap, font=f_s, fill=DIM)
d.text((40, 24), 'Yojimbo chapter - production idles, CANDIDATES (FFX only)', font=f_t, fill=INK)
d.text((40, 78), 'Derived from the picked options (O-1 A, O-2 B, O-3 B) by method r3: the picked pixels themselves, framed like the other enemy idles; repairs are pixel erases only, no repaint, 0 GPU minutes. Not approved.', font=f_s, fill=DIM)
d.text((40, 106), "Battle frame: the real game at 1600x900 (Chapter I stage, real GPU, own Vite server), the chapter's fiends hidden, the three candidates added through the engine's own stage", font=f_s, fill=DIM)
d.text((40, 132), "at the research sizes (Yojimbo 2.55, Daigoro 0.73, Ginnem 1.82 world units; visual bible, estimates), served by request interception. The Cavern chamber backdrop is not built yet.", font=f_s, fill=DIM)
y = 176
d.text((40, y), 'In a real battle frame', font=f_h, fill=GOLD); y += 40
hud = Image.open('battle-seymour-flux.png').convert('RGB').resize((1170, 658), Image.LANCZOS)
clean = Image.open('battle-seymour-flux-clean.png').convert('RGB').resize((1170, 658), Image.LANCZOS)
box(hud, 40, y, None, 'with the HUD (guide and move panels folded)'); box(clean, 1230, y, None, 'HUD off')
y += 700
d.text((40, y), 'The paintings (whole, on a dark card)', font=f_h, fill=GOLD); y += 40
cards = [('yojimbo-cavern', 'out/yojimbo-cavern-idle.png', '730x1093, baselineY 1076, facing left'),
         ('daigoro', 'out/daigoro-idle.png', '853x897, baselineY 846 (paw contact), facing left'),
         ('ginnem', 'out/ginnem-idle.png', '757x1164, baselineY 1100, facing left, soft-alpha glow')]
x = 40
for sid, p, cap in cards:
    im = Image.open(p); s = 760 / im.height; im = on_dark(im.resize((round(im.width * s), 760), Image.LANCZOS))
    c = Image.new('RGB', (770, 780), (30, 32, 44)); c.paste(im, ((770 - im.width) // 2, 10))
    box(c, x, y, sid, cap); x += 800
y += 830
d.text((40, y), 'At 1:1 (and 2x where marked): what changed and what did not', font=f_h, fill=GOLD); y += 40
yo, yf = Image.open('yojimbo-a2.png'), Image.open('out/yojimbo-cavern-idle.png')
dg, df = Image.open('daigoro-b.png'), Image.open('out/daigoro-idle.png')
row = [
    (on_dark(yo.crop((380, 520, 620, 720))).resize((480, 400), Image.NEAREST), 'Yojimbo 2x, picked', 'the second scabbard behind him'),
    (on_dark(yf.crop((380, 520, 620, 720))).resize((480, 400), Image.NEAREST), 'Yojimbo 2x, idle', 'erased; robe edge kept straight'),
    (on_dark(yf.crop((180, 20, 520, 420))), 'Yojimbo 1:1', 'hat, menpo, pauldrons untouched'),
    (on_dark(Image.open('ginnem-b-concept.png').crop((210, 60, 590, 460))), 'Ginnem 1:1', 'picked B, unchanged'),
]
x = 40
for im, lab, cap in row:
    box(im, x, y, lab, cap); x += im.width + 30
y += 440
row = [
    (on_dark(dg.crop((120, 740, 620, 897))), 'Daigoro 1:1, picked', 'baked blue floor shadow'),
    (on_dark(df.crop((120, 740, 620, 897))), 'Daigoro 1:1, idle', 'shadow erased (the engine draws its own)'),
    (on_dark(df.crop((0, 40, 360, 400))), 'Daigoro 1:1', 'face and mane untouched'),
    (Image.open('battle-seymour-flux-clean.png').convert('RGB').crop((930, 230, 1250, 490)).resize((640, 520), Image.NEAREST), 'In battle 2x', 'as the engine draws them'),
]
x = 40
for im, lab, cap in row:
    box(im, x, y, lab, cap); x += im.width + 30
y += 560
d.text((40, y), 'Not fixed, disclosed: Yojimbo stays a side profile (the pick); two hilts at his hip (katana and short sword); Daigoro\'s look is ours (data: Koma Inu); Ginnem\'s hair came out fair (unsourced), her motes are baked until a live particle effect exists.', font=f_s, fill=DIM)
d.text((W - 200, y + 40), 'CANDIDATE', font=f_h, fill=GOLD)
sheet = sheet.crop((0, 0, W, y + 90))
sheet.save('D:/Final Fantasy/docs/concepts/chapters/yojimbo/production/characters.jpg', quality=88)
print(sheet.size)
