"""Original layout sketch for the Guard Scorpion img2img pass (drawn from the FF Wiki text:
a red scorpion-shaped guard robot, six legs, a long tail with a laser, rifles). Not traced
from any image. Writes gs-sketch-low.png (tail lowered) and gs-sketch-raised.png."""
import math, sys, os
from PIL import Image, ImageDraw

W, H = 1216, 832
RED, RED_D, RED_L = (178, 34, 30), (120, 22, 22), (214, 70, 58)
STEEL, STEEL_D, STEEL_L = (70, 72, 80), (40, 42, 48), (120, 124, 132)
EYE = (255, 196, 60)
out_dir = sys.argv[1]


def leg(d, hip, knee, foot, w, col):
    d.line([hip, knee], fill=col, width=w)
    d.line([knee, foot], fill=col, width=int(w * 0.8))
    for p, r in ((hip, w * 0.7), (knee, w * 0.6)):
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=STEEL_L)
    d.polygon([(foot[0] - w, foot[1]), (foot[0] + w, foot[1]), (foot[0], foot[1] - w * 1.4)], fill=col)


def tail(d, pts, raised):
    n = len(pts)
    for i in range(n - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        r = 38 - i * 2.2
        d.line([(x0, y0), (x1, y1)], fill=STEEL_D, width=int(r * 1.1))
        d.ellipse([x0 - r, y0 - r, x0 + r, y0 + r], fill=RED if i % 2 == 0 else RED_D, outline=STEEL_D, width=4)
    # emitter head at the tip, a squat cylinder with a lens pointing at the party (frame-left)
    x, y = pts[-1]
    ang = math.atan2(pts[-1][1] - pts[-2][1], pts[-1][0] - pts[-2][0])
    ex, ey = x + math.cos(ang) * 40, y + math.sin(ang) * 40
    d.line([(x, y), (ex, ey)], fill=STEEL, width=46)
    d.ellipse([ex - 22, ey - 22, ex + 22, ey + 22], fill=STEEL_L, outline=STEEL_D, width=5)
    d.ellipse([ex - 10, ey - 10, ex + 10, ey + 10], fill=EYE)


def draw(raised):
    im = Image.new('RGB', (W, H), (255, 255, 255))
    d = ImageDraw.Draw(im)
    ground = 770
    # far-side legs first (lighter, thinner)
    for hx, kx, fx in ((430, 360, 300), (560, 540, 520), (690, 740, 800)):
        leg(d, (hx, 470), (kx, 390), (fx, ground - 30), 22, STEEL_L)
    # body: a long low armoured shell, head at frame-left
    d.polygon([(300, 470), (360, 400), (520, 370), (720, 380), (840, 420), (860, 500), (760, 560), (420, 570), (320, 540)], fill=RED)
    d.polygon([(380, 405), (520, 380), (700, 388), (800, 420), (700, 430), (520, 425)], fill=RED_L)
    for x in (470, 580, 690):
        d.line([(x, 380), (x - 10, 560)], fill=RED_D, width=6)
    # head with one sensor eye
    d.polygon([(200, 470), (240, 420), (330, 410), (360, 470), (330, 540), (240, 540)], fill=RED)
    d.ellipse([240, 440, 290, 490], fill=STEEL_D)
    d.ellipse([252, 452, 278, 478], fill=EYE)
    # twin rifle barrels under the head, pointing at the party
    for y in (510, 545):
        d.rectangle([70, y - 11, 300, y + 11], fill=STEEL_D)
        d.rectangle([60, y - 15, 90, y + 15], fill=STEEL)
    # near-side legs (darker, heavier)
    for hx, kx, fx in ((400, 300, 230), (560, 520, 480), (730, 820, 900)):
        leg(d, (hx, 530), (kx, 440), (fx, ground), 34, STEEL)
    # tail
    if raised:
        pts = [(820, 450), (900, 380), (950, 290), (950, 200), (910, 120), (840, 80), (760, 80), (690, 110), (640, 160)]
    else:
        pts = [(840, 470), (930, 480), (1010, 470), (1075, 430), (1105, 370), (1100, 310), (1065, 270), (1015, 260)]
    tail(d, pts, raised)
    return im


os.makedirs(out_dir, exist_ok=True)
draw(False).save(os.path.join(out_dir, 'gs-sketch-low.png'))
draw(True).save(os.path.join(out_dir, 'gs-sketch-raised.png'))
print('ok')
