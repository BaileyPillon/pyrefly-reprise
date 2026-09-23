"""docs/concepts/chapters/evrae/r3/sheet.jpg (FFX only)."""
from PIL import Image, ImageDraw, ImageFont
F = 'D:/Final Fantasy/'; E = F + 'public/art/characters/evrae/'; BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-evrae-r3/'
R = 'D:/Tools/pyrefly-lora/evrae/r3/'; C = R + 'cap-final/'
W = 2400
try: font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22); big = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 28)
except Exception: font = big = ImageFont.load_default()
rows = []
def tile(img, w, label, bg=(128, 128, 128)):
    if img.mode == 'RGBA':
        b = Image.new('RGBA', img.size, bg + (255,)); b.alpha_composite(img); img = b
    img = img.convert('RGB'); h = round(img.height * w / img.width)
    t = Image.new('RGB', (w, h + 34), (24, 24, 28)); t.paste(img.resize((w, h), Image.LANCZOS), (0, 34))
    ImageDraw.Draw(t).text((6, 4), label, fill=(235, 225, 200), font=font); return t
def crop(p, box, s=1, label=''):
    im = Image.open(p).convert('RGBA').crop(box)
    if s != 1: im = im.resize((im.width * s, im.height * s), Image.NEAREST)
    return tile(im, im.width, label)
def row(title, tiles):
    h = max(t.height for t in tiles) + 50
    r = Image.new('RGB', (W, h), (16, 16, 20)); d = ImageDraw.Draw(r); d.text((10, 8), title, fill=(230, 190, 90), font=big)
    x = 10
    for t in tiles: r.paste(t, (x, 50)); x += t.width + 12
    rows.append(r)
row('1. BACKDROP: picked concept B | the old installed plate (replaced) | production plate = B\'s own pixels (MAD 0, same 2688x1536)', [
    tile(Image.open(F + 'docs/concepts/chapters/evrae/renders/backdrop-b.png'), 780, 'concept B (Bailey 2026-09-21)'),
    tile(Image.open(BK + 'backdrops/evrae-airship-deck.png'), 780, 'old plate, seed 811003 (hull underside)'),
    tile(Image.open(F + 'public/art/backdrops/evrae-airship-deck.png'), 780, 'installed now (sha256 2679b8ef...)')])
row('2. BREATH-CHARGE (Inhale telegraph): idle-near | old (judged 6: flat disc) | new r3-derive (idle pixels + neck warp + glow only)', [
    tile(Image.open(E + 'idle-near.png'), 560, 'idle-near (judged 8)'),
    tile(Image.open(BK + 'characters/evrae/breath-charge.png'), 560, 'old breath-charge'),
    tile(Image.open(E + 'breath-charge.png'), 560, 'new breath-charge'),
    crop(BK + 'characters/evrae/breath-charge.png', (180, 40, 520, 320), 1, 'old 1:1'),
    crop(E + 'breath-charge.png', (180, 40, 520, 320), 1, 'new 1:1')])
row('3. HURT: old (judged 6) | new r3-derive (head thrown back, idle pixels) | none (idle; the engine flinch only) | in game NEAR: none vs new', [
    tile(Image.open(BK + 'characters/evrae/hurt.png'), 400, 'old hurt (scale 1.29)'),
    tile(Image.open(E + 'hurt.png'), 520, 'new hurt'),
    tile(Image.open(E + 'idle-near.png'), 520, 'none = idle'),
    tile(Image.open(C + 'near-evrae.png'), 440, 'in game: idle (none)'),
    tile(Image.open(C + 'near-hurt.png'), 440, 'in game: new hurt')])
row('4. CAST CANDIDATE for Decision 1 (NOT installed): idle-near | head reared, jaws open (r3-derive) | 1:1 head', [
    tile(Image.open(E + 'idle-near.png'), 620, 'idle-near'),
    tile(Image.open(F + 'docs/concepts/chapters/evrae/r3/cast-candidate.png'), 620, 'cast-candidate.png'),
    crop(F + 'docs/concepts/chapters/evrae/r3/cast-candidate.png', (130, 40, 700, 460), 1, 'cast candidate 1:1')])
row('5. IN GAME 1600x900 (HUD off, GPU, seed 2): NEAR idle | NEAR Inhale (breath-charge) | FAR (engine flag flipped to far)', [
    tile(Image.open(C + 'near-full.png'), 780, 'NEAR'), tile(Image.open(C + 'near-breath-full.png'), 780, 'NEAR, breath charged'),
    tile(Image.open(C + 'far-full.png'), 780, 'FAR')])
row('   with the HUD: NEAR | FAR', [tile(Image.open(C + 'near-hud.png'), 1180, 'NEAR, HUD on'), tile(Image.open(C + 'far-hud.png'), 1180, 'FAR, HUD on')])
H = sum(r.height for r in rows) + 60
S = Image.new('RGB', (W, H), (16, 16, 20)); d = ImageDraw.Draw(S)
d.text((10, 12), 'Evrae r3 art (FFX only, Chapter 8) - 2026-09-23 - everything CANDIDATE, nothing approved', fill=(255, 255, 255), font=big)
y = 60
for r in rows: S.paste(r, (0, y)); y += r.height
S.save(F + 'docs/concepts/chapters/evrae/r3/sheet.jpg', quality=86, optimize=True)
print(S.size)
