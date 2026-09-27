"""Three-quarter layout sketch (original, drawn from the FF Wiki text). Head toward frame-left and
slightly toward the viewer; far legs higher and further right for depth. low + raised tail."""
import math, sys, os
from PIL import Image, ImageDraw
W, H = 1216, 832
RED, RED_D, RED_L = (178, 34, 30), (120, 22, 22), (222, 84, 66)
STEEL, STEEL_D, STEEL_L = (70, 72, 80), (40, 42, 48), (138, 142, 150)
EYE = (255, 196, 60)
out = sys.argv[1]
def leg(d, hip, knee, foot, w, col):
    d.line([hip, knee], fill=col, width=w); d.line([knee, foot], fill=col, width=int(w*0.8))
    for p, r in ((hip, w*0.7), (knee, w*0.6)):
        d.ellipse([p[0]-r, p[1]-r, p[0]+r, p[1]+r], fill=STEEL_L)
    d.polygon([(foot[0]-w, foot[1]), (foot[0]+w, foot[1]), (foot[0], foot[1]-w*1.4)], fill=col)
def tail(d, pts):
    for i in range(len(pts)-1):
        (x0, y0), (x1, y1) = pts[i], pts[i+1]; r = 44 - i*2.6
        d.line([(x0, y0), (x1, y1)], fill=STEEL_D, width=int(r*1.1))
        d.ellipse([x0-r, y0-r, x0+r, y0+r], fill=RED if i % 2 == 0 else RED_D, outline=STEEL_D, width=4)
    x, y = pts[-1]; a = math.atan2(y-pts[-2][1], x-pts[-2][0]); ex, ey = x+math.cos(a)*44, y+math.sin(a)*44
    d.line([(x, y), (ex, ey)], fill=STEEL, width=52)
    d.ellipse([ex-24, ey-24, ex+24, ey+24], fill=STEEL_L, outline=STEEL_D, width=5); d.ellipse([ex-11, ey-11, ex+11, ey+11], fill=EYE)
def draw(raised):
    im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im); g = 780
    for hip, knee, foot in (((470, 430), (430, 340), (400, g-120)), ((620, 420), (640, 330), (660, g-110)), ((760, 430), (840, 350), (900, g-100))):
        leg(d, hip, knee, foot, 22, STEEL_L)
    d.polygon([(290, 500), (350, 420), (520, 380), (760, 390), (880, 440), (890, 520), (780, 600), (420, 610), (310, 570)], fill=RED)
    d.polygon([(360, 430), (520, 392), (750, 402), (860, 445), (760, 470), (520, 465), (380, 470)], fill=RED_L)
    for x in (500, 630, 750): d.line([(x, 395), (x-20, 600)], fill=RED_D, width=7)
    d.polygon([(170, 520), (220, 450), (340, 430), (380, 500), (350, 590), (230, 600)], fill=RED)
    d.polygon([(220, 455), (330, 438), (350, 470), (240, 480)], fill=RED_L)
    d.ellipse([222, 485, 292, 555], fill=STEEL_D); d.ellipse([240, 503, 274, 537], fill=EYE)
    for y, x0 in ((575, 40), (612, 60)):
        d.rectangle([x0, y-13, 280, y+13], fill=STEEL_D); d.rectangle([x0-10, y-17, x0+24, y+17], fill=STEEL)
    for hip, knee, foot in (((400, 580), (290, 500), (230, g)), ((580, 590), (520, 500), (500, g)), ((770, 580), (850, 490), (930, g-10))):
        leg(d, hip, knee, foot, 36, STEEL)
    if raised:
        pts = [(850, 480), (930, 400), (980, 300), (975, 200), (930, 120), (850, 80), (765, 85), (690, 120), (640, 175)]
    else:
        pts = [(870, 500), (960, 505), (1040, 485), (1100, 440), (1125, 375), (1110, 315), (1070, 285), (1020, 280)]
    tail(d, pts); return im
draw(False).save(os.path.join(out, 'gs34-low.png')); draw(True).save(os.path.join(out, 'gs34-raised.png')); print('ok')
