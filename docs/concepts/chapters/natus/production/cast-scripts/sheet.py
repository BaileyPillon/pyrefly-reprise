"""Sheet (FFX only): docs/concepts/chapters/natus/production/cast.jpg. Row 1: idle | cast | seam mask
(red) on the cast, all at 0.55. Row 2: both wrists at 1:1, transplant then final. Row 3: the 1600x900
engine frames (idle, cast held) cropped round Natus at 1:1, and the whole cast frame at 0.5."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nlib import *
from PIL import ImageDraw
g = json.load(open(f'{OUT}/cast.gates.json'))
def grey(a):
    return Image.fromarray(on_bg(a.astype(np.float32), (128, 128, 128)))
idle = load(IDLE); cast = load(f'{REPO}/public/art/characters/seymour-natus/cast.png'); tr = load(f'{OUT}/cast.transplant.png')
sm = cv2.imread(f'{OUT}/cast.seam.png', 0) > 127
ov = on_bg(cast.astype(np.float32), (128, 128, 128)).astype(np.float32); ov[sm] = ov[sm] * 0.5 + np.float32([255, 0, 0]) * 0.5
sc = lambda im, s: im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
row1 = [sc(grey(idle), .55), sc(grey(cast), .55), sc(Image.fromarray(ov.astype(np.uint8)), .55)]
o = g['idleOffsetX']
boxes = [(150 + o - 70, 380, 450 + o - 70, 660), (520 + o - 70, 360, 796, 640)]
row2 = []
for b in boxes: row2 += [grey(tr).crop(b), grey(cast).crop(b)]
fi = Image.open(f'{SCR}/frame/f-idle.png'); fc = Image.open(f'{SCR}/frame/f-cast.png')
row3 = [fi.crop((880, 80, 1300, 500)), fc.crop((880, 80, 1300, 500)), sc(fc, .5)]
lab1 = ['idle (locked)', 'cast CANDIDATE', 'painted pixels (red, %.1f%%)' % (100 * g['gates']['shares']['painted'])]
lab2 = ['left wrist: transplant', 'left wrist: final', 'right wrist: transplant', 'right wrist: final (pocket filled)']
lab3 = ['1600x900 frame: idle', '1600x900 frame: cast held', 'cast frame (0.5)']
rows = [(row1, lab1), (row2, lab2), (row3, lab3)]
Wd = max(sum(i.width + 10 for i in r) for r, _ in rows) + 10
Ht = sum(max(i.height for i in r) + 30 for r, _ in rows) + 60
s = Image.new('RGB', (Wd, Ht), (24, 24, 28)); d = ImageDraw.Draw(s)
d.text((10, 8), 'Seymour Natus hero cast CANDIDATE (FFX only) - r3 derive-from-idle: both blade-wings turned %s deg outward about the grip; seam repaints at the wrists only' % json.load(open(f'{OUT}/t1.json'))['deg'], fill=(240, 220, 150))
d.text((10, 24), 'gates: ' + json.dumps(g['gates']), fill=(200, 200, 200))
y = 50
for r, lab in rows:
    x = 10
    for im, t in zip(r, lab):
        d.text((x, y), t, fill=(255, 235, 120)); s.paste(im, (x, y + 16)); x += im.width + 10
    y += max(i.height for i in r) + 30
p = f'{REPO}/docs/concepts/chapters/natus/production/cast.jpg'; s.save(p, quality=88); print(p, s.size)
