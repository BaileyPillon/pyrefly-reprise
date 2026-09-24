"""The decision sheet: docs/concepts/chapters/yojimbo/casts/sheet.jpg (FFX only; JPEG, candidates only)."""
from PIL import Image, ImageDraw, ImageFont
from ylib import REPO, SCR, OUT

IG = f'{SCR}/ingame'
W = 3320
BG, INK, DIM = (24, 24, 30), (236, 230, 214), (160, 156, 146)
try:
    F = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 26); FB = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 34)
except OSError:
    F = FB = ImageFont.load_default()

def grey(p, box=None, scale=1.0):
    im = Image.open(p).convert('RGBA')
    if box: im = im.crop(box)
    bg = Image.new('RGBA', im.size, (128, 128, 128, 255)); bg.alpha_composite(im); im = bg.convert('RGB')
    return im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS if scale < 1 else Image.NEAREST)

def frame(p, box=None, scale=1.0):
    im = Image.open(p).convert('RGB')
    if box: im = im.crop(box)
    return im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS) if scale != 1 else im

rows = []
def row(title, tiles):
    rows.append((title, tiles))

Y, D = f'{REPO}/public/art/characters/yojimbo-cavern/idle.png', f'{REPO}/public/art/characters/daigoro/idle.png'
yc, yh = f'{OUT}/yojimbo-cavern/cast.png', f'{OUT}/yojimbo-cavern/hurt.png'
dc, dn = f'{OUT}/daigoro/cast.png', f'{OUT}/daigoro/cast-alt-narrow.png'
row('1  The paintings (on grey). Yojimbo at 0.6, Daigoro at 0.5. Every pixel outside the masks is the locked idle (MAD 0).', [
    ('Yojimbo idle (anchor)', grey(Y, scale=0.6)), ('Yojimbo CAST: the drawn blade', grey(yc, scale=0.6)), ('Yojimbo HURT bake (vs none)', grey(yh, scale=0.6)),
    ('Daigoro idle (anchor)', grey(D, scale=0.5)), ('Daigoro CAST: the bite (30 deg)', grey(dc, scale=0.5)), ('alt: 20 deg', grey(dn, scale=0.5))])
row('2  At 1:1: what changed', [
    ('Yojimbo idle 1:1', grey(Y, (0, 40, 420, 560))), ('Yojimbo cast 1:1', grey(yc, (0, 40, 420, 560))),
    ('Daigoro idle 1:1', grey(D, (0, 150, 290, 420))), ('Daigoro cast 1:1', grey(dc, (0, 150, 290, 420))), ('alt 20 deg 1:1', grey(dn, (0, 150, 290, 420)))])
row('3  In battle, 1600x900 at 0.5 (real Chapter IX battle, Kimahri to act; Cavern idle served under the chapter key)', [
    ('idle', frame(f'{IG}/none-idle.png', scale=0.5)), ('Yojimbo acts: CAST', frame(f'{IG}/A-yojimbo-cast.png', scale=0.5)),
    ('hit, NONE: idle under the flinch', frame(f'{IG}/none-yojimbo-flinch.png', scale=0.5)), ('hit, HURT bake', frame(f'{IG}/A-yojimbo-flinch.png', scale=0.5))])
row('4  In battle at 1:1: Yojimbo cast and the hit (none | bake); Daigoro bite (none | 30 deg | 20 deg)', [
    ('idle', frame(f'{IG}/none-idle.png', (480, 20, 900, 560))), ('cast', frame(f'{IG}/A-yojimbo-cast.png', (480, 20, 900, 560))),
    ('hit: none', frame(f'{IG}/none-yojimbo-flinch.png', (480, 20, 900, 560))), ('hit: bake', frame(f'{IG}/A-yojimbo-flinch.png', (480, 20, 900, 560))),
    ('Daigoro acts: none', frame(f'{IG}/none-daigoro-cast.png', (680, 210, 1000, 470))), ('bite 30', frame(f'{IG}/A-daigoro-cast.png', (680, 210, 1000, 470))),
    ('bite 20', frame(f'{IG}/B-daigoro-cast.png', (680, 210, 1000, 470)))])

PAD, LAB = 20, 36
heights = [70 + max(t.height for _, t in tiles) + LAB + PAD for _, tiles in rows]
H = 150 + sum(heights) + 120
sheet = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(sheet)
d.text((PAD, 20), 'Chapter IX Yojimbo: action-painting CANDIDATES (FFX only). Never installed; derived from the locked idles.', font=FB, fill=INK)
d.text((PAD, 70), "Census on the real engine (80 battles): Yojimbo 957 actions, all kind 'ability' -> cast; Daigoro 614 bites -> cast; Lady Ginnem 0 actions, 0 times targeted. "
       'Only Yojimbo is ever hit (1,119), so only he gets a hurt candidate.', font=F, fill=DIM)
y = 150
for (title, tiles), h in zip(rows, heights):
    d.text((PAD, y), title, font=F, fill=INK)
    x = PAD; ty = y + 44
    for lab, t in tiles:
        if x + t.width > W - PAD:
            break
        sheet.paste(t, (x, ty)); d.text((x, ty + t.height + 4), lab, font=F, fill=DIM); x += t.width + PAD
    y += h
d.text((PAD, y), 'Recommendation: Yojimbo CAST (drawn blade), hurt NONE (the bake leans 6+4 degrees; at game size it barely beats the engine flinch, so the tie goes to none); '
       'Daigoro CAST 30 deg; Lady Ginnem nothing (she never acts and cannot be hit).', font=F, fill=INK)
sheet.save(f'{REPO}/docs/concepts/chapters/yojimbo/casts/sheet.jpg', quality=86)
print(sheet.size)
