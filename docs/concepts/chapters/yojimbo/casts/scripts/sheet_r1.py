"""The decision sheet with the r1 repair rows: docs/concepts/chapters/yojimbo/casts/sheet.jpg (FFX only; JPEG, candidates only).
Rows 1-4 are the original sheet (sheet.py); rows 5-8 add the r1 pixel repairs and the longer-blade OPTION."""
from PIL import Image, ImageDraw, ImageFont
from r1common import REPO, SCR, OUT
IG1 = 'D:/Tools/pyrefly-scratch/yoj-repair/ingame'

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

yr, yl, dr = f'{OUT}/yojimbo-cavern/cast-r1.png', f'{OUT}/yojimbo-cavern/cast-r1-option-longer.png', f'{OUT}/daigoro/cast-r1.png'
row('5  r1 REPAIRED at 1:1 and 2x (pixel work only, no GPU; MAD 0 outside the r1 masks; every colour from the idle palette). Before | r1.', [
    ('Yojimbo cast 1:1', grey(yc, (0, 40, 330, 440))), ('Yojimbo cast-r1 1:1', grey(yr, (0, 40, 330, 440))),
    ('root 2x: before', grey(yc, (150, 240, 260, 360), 2)), ('root 2x: r1 (gold habaki)', grey(yr, (150, 240, 260, 360), 2)),
    ('tip 2x: before', grey(yc, (24, 84, 124, 184), 2)), ('tip 2x: r1 (kissaki)', grey(yr, (24, 84, 124, 184), 2))])
row('6  r1 REPAIRED, Daigoro (30 deg): fringe peeled, lower lip smoothed, front fangs thinned; then the Yojimbo glove edge. Before | r1.', [
    ('Daigoro cast 1:1', grey(dc, (0, 150, 290, 420))), ('Daigoro cast-r1 1:1', grey(dr, (0, 150, 290, 420))),
    ('mouth 3x: before', grey(dc, (56, 256, 160, 326), 3)), ('mouth 3x: r1', grey(dr, (56, 256, 160, 326), 3)),
    ('glove 3x: before', grey(yc, (192, 298, 262, 352), 3)), ('glove 3x: r1 (inked, fringe peeled)', grey(yr, (192, 298, 262, 352), 3))])
row('7  In battle, 1600x900 at 0.5 (own Vite on 5860, request interception; advisor card hidden for the enemy-turn read, as the game clears it once a command is taken)', [
    ('Yojimbo acts: judged cast.png', frame(f'{IG1}/A0-yojimbo-cast-nocard.png', scale=0.5)), ('Yojimbo acts: cast-r1', frame(f'{IG1}/R1-yojimbo-cast-nocard.png', scale=0.5)),
    ('cast-r1 with the advisor card (Kimahri deciding)', frame(f'{IG1}/R1-yojimbo-cast.png', scale=0.5)), ('Daigoro bites: cast-r1', frame(f'{IG1}/R1-daigoro-cast.png', scale=0.5))])
row('8  In battle at 1:1: Yojimbo before | r1 | OPTION longer blade (needs a yes from Bailey); Daigoro bite before | r1', [
    ('Yojimbo: judged cast', frame(f'{IG1}/A0-yojimbo-cast-nocard.png', (480, 20, 900, 560))), ('Yojimbo: cast-r1', frame(f'{IG1}/R1-yojimbo-cast-nocard.png', (480, 20, 900, 560))),
    ('OPTION ONLY: +40 px blade', frame(f'{IG1}/L-yojimbo-cast-nocard.png', (480, 20, 900, 560))),
    ('Daigoro: judged cast', frame(f'{IG1}/A0-daigoro-cast.png', (680, 210, 1000, 470))), ('Daigoro: cast-r1', frame(f'{IG1}/R1-daigoro-cast.png', (680, 210, 1000, 470)))])
row('9  OPTION ONLY, not part of r1: the longer blade (same arc continued 40 px, about 243 to 283 px; no sourced length). Lengthening needs a yes from Bailey.', [
    ('cast-r1 (unchanged length)', grey(yr, (0, 30, 330, 440))), ('OPTION: longer blade', grey(yl, (0, 30, 330, 440))),
    ('cast-r1 full at 0.5', grey(yr, scale=0.5)), ('OPTION full at 0.5', grey(yl, scale=0.5))])

PAD, LAB = 20, 36
heights = [70 + max(t.height for _, t in tiles) + LAB + PAD for _, tiles in rows]
H = 150 + sum(heights) + 120
sheet = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(sheet)
d.text((PAD, 20), 'Chapter IX Yojimbo: action-painting CANDIDATES with the r1 pixel repairs (FFX only). Never installed; derived from the locked idles.', font=FB, fill=INK)
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
d.text((PAD, y), 'Recommendation after r1: Yojimbo CAST-R1 (blade inked, kissaki, gold habaki, glove edge inked; length unchanged), hurt NONE; Daigoro CAST-R1 30 deg; Lady Ginnem nothing. '
       'The longer blade is an OPTION only and needs a yes from Bailey. r1 awaits an independent judge.', font=F, fill=INK)
sheet.save(f'{REPO}/docs/concepts/chapters/yojimbo/casts/sheet.jpg', quality=84)
print(sheet.size)
