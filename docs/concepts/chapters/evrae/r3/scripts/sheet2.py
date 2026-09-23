"""docs/concepts/chapters/evrae/r3/sheet.jpg after the repair cycle (FFX only)."""
from PIL import Image, ImageDraw, ImageFont
F = 'D:/Final Fantasy/'; E = F + 'public/art/characters/evrae/'; R3 = F + 'docs/concepts/chapters/evrae/r3/'
BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-evrae-r3/'; C1 = BK + 'cycle1/characters/evrae/'
C = 'D:/Tools/pyrefly-lora/evrae/r3/cycle2/cap/'; CO = 'D:/Tools/pyrefly-lora/evrae/r3/cap-final/'
W = 2400
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22); big = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 28)
rows = []
def flat(img, bg=(128, 128, 128)):
    if img.mode != 'RGBA': return img.convert('RGB')
    b = Image.new('RGBA', img.size, bg + (255,)); b.alpha_composite(img); return b.convert('RGB')
def tile(img, w, label, bg=(128, 128, 128), rs=Image.LANCZOS):
    img = flat(img, bg); h = round(img.height * w / img.width)
    t = Image.new('RGB', (w, h + 34), (24, 24, 28)); t.paste(img.resize((w, h), rs), (0, 34))
    ImageDraw.Draw(t).text((6, 4), label, fill=(235, 225, 200), font=font); return t
def crop(p, box, s, label, bg=(128, 128, 128)):
    im = Image.open(p).convert('RGBA').crop(box)
    return tile(im, im.width * s, label, bg, Image.NEAREST if s > 1 else Image.LANCZOS)
def game(p, top=0, label=''):
    im = Image.open(p).convert('RGBA')
    if top == 0:   # same 60 px of headroom as hurt's crop, so the three share one baseline
        b = Image.new('RGBA', (im.width, im.height + 60), (0, 0, 0, 0)); b.alpha_composite(im, (0, 60)); im = b
    im = im.crop((0, 0 if top == 0 else top, 700, (0 if top == 0 else top) + 480))
    return tile(im, round(700 * .532), label)
def row(title, tiles):
    h = max(t.height for t in tiles) + 50
    r = Image.new('RGB', (W, h), (16, 16, 20)); ImageDraw.Draw(r).text((10, 8), title, fill=(230, 190, 90), font=big)
    x = 10
    for t in tiles: r.paste(t, (x, 50)); x += t.width + 12
    rows.append(r)
row('1. BACKDROP (unchanged this cycle, judged 10): concept B | installed plate = B\'s own pixels', [
    tile(Image.open(F + 'docs/concepts/chapters/evrae/renders/backdrop-b.png'), 780, 'concept B (Bailey 2026-09-21)'),
    tile(Image.open(F + 'public/art/backdrops/evrae-airship-deck.png'), 780, 'installed (sha256 2679b8ef...)')])
row('2. BREATH-CHARGE repair: idle-near | cycle 1 (judged 5: level cut, smeared dorsal, pendant bulb, soft rim) | cycle 2 installed (in-place swell)', [
    tile(Image.open(E + 'idle-near.png'), 560, 'idle-near (judged 8)'),
    tile(Image.open(C1 + 'breath-charge.png'), 560, 'cycle 1 (backed up)'),
    tile(Image.open(E + 'breath-charge.png'), 560, 'cycle 2, installed (CANDIDATE)'),
    tile(Image.open(CO + 'near-breath.png'), 300, 'in game, cycle 1'),
    tile(Image.open(C + 'near-breath.png'), 300, 'in game, cycle 2')])
row('   2x throat (Lanczos-free, nearest): idle | cycle 1 | cycle 2 ; 4x rim over dark: cycle 1 | cycle 2', [
    crop(E + 'idle-near.png', (340, 40, 560, 260), 2, 'idle 2x'),
    crop(C1 + 'breath-charge.png', (340, 40, 560, 260), 2, 'cycle 1 2x'),
    crop(E + 'breath-charge.png', (340, 40, 560, 260), 2, 'cycle 2 2x'),
    crop(C1 + 'breath-charge.png', (380, 200, 490, 260), 4, 'cycle 1 rim 4x', (12, 12, 16)),
    crop(E + 'breath-charge.png', (380, 150, 490, 210), 4, 'cycle 2 rim 4x', (12, 12, 16))])
row('3. CAST CANDIDATE for Decision 1 (NOT installed): old (judged 6: reared, too like hurt) | new lunge (down + forward, jaw opened) | 3x head', [
    tile(Image.open(C1 + 'cast-candidate.png'), 520, 'old cast candidate'),
    tile(Image.open(R3 + 'cast-candidate.png'), 520, 'new cast candidate'),
    crop(R3 + 'cast-candidate.png', (140, 170, 320, 310), 3, 'new cast, head 3x')])
row('   at game scale (NEAR, 0.532 screen px per image px): idle | CAST (head down, forward, jaws open) | HURT (head up, back)', [
    game(E + 'idle-near.png', 0, 'idle'), game(R3 + 'cast-candidate.png', 0, 'cast candidate'), game(E + 'hurt.png', 30, 'hurt (installed, judged 7)'),
    tile(Image.open(C + 'near-evrae.png'), 300, 'in game: idle'), tile(Image.open(C + 'near-hurt.png'), 300, 'in game: hurt')])
row('4. IN GAME 1600x900 (GPU, seed 2, HUD off): NEAR | NEAR Inhale (cycle-2 breath-charge) | FAR', [
    tile(Image.open(C + 'near-full.png'), 780, 'NEAR'), tile(Image.open(C + 'near-breath-full.png'), 780, 'NEAR, breath charged'),
    tile(Image.open(C + 'far-full.png'), 780, 'FAR')])
row('   with the HUD: NEAR | FAR', [tile(Image.open(C + 'near-hud.png'), 1180, 'NEAR, HUD on'), tile(Image.open(C + 'far-hud.png'), 1180, 'FAR, HUD on')])
H = sum(r.height for r in rows) + 60
S = Image.new('RGB', (W, H), (16, 16, 20))
ImageDraw.Draw(S).text((10, 12), 'Evrae r3 art, repair cycle (FFX only, Chapter 8) - 2026-09-23 - everything CANDIDATE, nothing approved', fill=(255, 255, 255), font=big)
y = 60
for r in rows: S.paste(r, (0, y)); y += r.height
S.save(R3 + 'sheet.jpg', quality=86, optimize=True); print(S.size)
