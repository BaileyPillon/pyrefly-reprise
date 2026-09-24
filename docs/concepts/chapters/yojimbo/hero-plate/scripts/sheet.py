"""Build sheet.jpg, the per-option JPEGs and crops-1to1.jpg from the scratch options and shots."""
from PIL import Image, ImageDraw, ImageFont
S = 'D:/Tools/pyrefly-scratch/yoj-hero/'
D = 'D:/Final Fantasy/docs/concepts/chapters/yojimbo/hero-plate/'


def font(sz):
    for f in ('C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


F, Fs = font(30), font(22)
names = {'a': 'A  Lulu and the unsent Lady Ginnem (grief)',
         'b': 'B  Yojimbo drawing Zanmato (the boss)  -  RECOMMENDED',
         'c': "C  Lulu's last duty, Yojimbo behind her (resolve)"}
for k in 'abc':
    Image.open(S + f'options/{k}.png').convert('RGB').save(D + f'{k}-plate.jpg', quality=90)
    for s in ('pause', 'card'):
        Image.open(S + f'shots/{k}-{s}.png').convert('RGB').save(D + f'{k}-{s}.jpg', quality=88)
Image.open(S + 'shots/orig-pause.png').convert('RGB').save(D + 'ref-ch1-pause.jpg', quality=85)
CW, CH = 800, 450
top, rowh = 70, CH + 100
sh = Image.new('RGB', (CW * 3 + 40, top + rowh * 3 + 10), (16, 16, 22))
d = ImageDraw.Draw(sh)
d.text((20, 18), 'Chapter IX  Yojimbo  -  hero plate options (FFX only)   CONCEPT, nothing installed', fill=(230, 200, 120), font=F)
for i, k in enumerate('abc'):
    y = top + i * rowh
    d.text((20, y), names[k], fill=(240, 240, 240), font=F)
    ph = int((CW - 10) * 768 / 1344)
    sh.paste(Image.open(S + f'options/{k}.png').convert('RGB').resize((CW - 10, ph)), (10, y + 44))
    for j, s in enumerate(('pause', 'card')):
        sh.paste(Image.open(S + f'shots/{k}-{s}.png').convert('RGB').resize((CW - 10, CH - 10)), (10 + CW * (j + 1) + 10, y + 44))
    d.text((10, y + 44 + CH), 'the plate, 1344x768', fill=(170, 170, 170), font=Fs)
    d.text((10 + CW + 10, y + 44 + CH), 'pause CHAPTER tab, 1600x900', fill=(170, 170, 170), font=Fs)
    d.text((10 + 2 * CW + 20, y + 44 + CH), 'party-prep chapter card, 1600x900', fill=(170, 170, 170), font=Fs)
sh.save(D + 'sheet.jpg', quality=86)
b0 = Image.open(S + 'renders/b-909154.png').convert('RGB').crop((560, 280, 1020, 620))
b1 = Image.open(S + 'options/b.png').convert('RGB').crop((560, 280, 1020, 620))
c1 = Image.open(S + 'options/c.png').convert('RGB').crop((760, 0, 1220, 560))
a1 = Image.open(S + 'options/a.png').convert('RGB').crop((860, 0, 1344, 560))
r = Image.new('RGB', (460 * 3 + 484 + 70, 600), (16, 16, 22))
dd = ImageDraw.Draw(r)
x = 10
for im, lab in ((b0, 'B before: glowing eyes/teeth (unsourced)'), (b1, "B after: erased to the mask's dark"),
                (c1, 'C: cut-out edge at 1:1 (needs a clean pass)'), (a1, 'A: Ginnem from her idle at 1:1')):
    r.paste(im, (x, 34))
    dd.text((x, 6), lab, fill=(230, 230, 230), font=font(18))
    x += im.width + 15
r.save(D + 'crops-1to1.jpg', quality=90)
