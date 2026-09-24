"""Crops and composites for the Chapter IX (Yojimbo) decision sheets. FFX only.

Everything here is composed from files already on disk. Nothing is rendered,
nothing is written to public/art, src/ or docs/target/.

Sources (read only):
  CAND = D:/Tools/pyrefly-art-backup/candidates/2026-09-24-yojimbo-casts/
    yojimbo-cavern/cast.png, hurt.png; daigoro/cast.png, cast-alt-narrow.png
    (CANDIDATE, scores in ../casts/JUDGE.md)
  CAND/provenance/ingame/*.png -- the casts builder's real in-battle frames,
    1600x900, PYREFLY_BROWSER=gpu, candidates served by request interception
    (../casts/scripts/ingame.mjs). Variant A = cast + baked hurt + 30 deg bite,
    'none' = idle only (what ships today).
  public/art/characters/{yojimbo-cavern,daigoro,ginnem}/idle.png -- installed
    CANDIDATE idles (../INSTALLED.md, judged 7.9 / 7.3 / 7.5 in
    ../production/JUDGE.md).
  public/art/backdrops/cavern-stolen-fayth.png -- CANDIDATE chamber plate.
  ../../macalania/decisions/img/dissolve-reference-mortiorchis.png (used in place) -- a real
    capture of today's global 'dissolve' departure (Mortiorchis, Gagazet).

The departure strips in decision-exit are opacity + offset + scale of the
idles over the chamber plate: a sketch of the motion, not an engine capture.
"""
from PIL import Image
import os

D = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(D, "img")
REPO = os.path.abspath(os.path.join(D, "../../../../.."))
CAND = "D:/Tools/pyrefly-art-backup/candidates/2026-09-24-yojimbo-casts"
IG = CAND + "/provenance/ingame"
ART = os.path.join(REPO, "public/art/characters")
os.makedirs(IMG, exist_ok=True)


def rgba(p):
    return Image.open(p).convert("RGBA")


def save(im, name):
    p = os.path.join(IMG, name)
    if name.endswith(".jpg"):
        im.convert("RGB").save(p, quality=90)
    else:
        im.save(p)
    print("wrote", name, im.size)


# ------------------------------------------------ painting crops (1:1 pixels)
Y_CAST = rgba(CAND + "/yojimbo-cavern/cast.png")
Y_HURT = rgba(CAND + "/yojimbo-cavern/hurt.png")
Y_IDLE = rgba(ART + "/yojimbo-cavern/idle.png")
D_CAST = rgba(CAND + "/daigoro/cast.png")
D_ALT = rgba(CAND + "/daigoro/cast-alt-narrow.png")
D_IDLE = rgba(ART + "/daigoro/idle.png")
G_IDLE = rgba(ART + "/ginnem/idle.png")

save(Y_CAST.crop((0, 30, 520, 590)), "p-yoj-cast.png")        # blade, fist, hip
save(Y_HURT.crop((100, 0, 700, 560)), "p-yoj-hurt.png")
save(Y_IDLE.crop((100, 0, 700, 560)), "p-yoj-idle.png")
for im, n in ((D_CAST, "p-dg-cast30.png"), (D_ALT, "p-dg-cast20.png"), (D_IDLE, "p-dg-idle.png")):
    save(im.crop((0, 0, 460, 400)), n)                          # muzzle and face
save(G_IDLE.crop((120, 0, 620, 440)), "p-gn-idle.png")


# ------------------------------------------------ game-size crops (real frames)
def frame(name, box, out):
    save(Image.open(f"{IG}/{name}.png").convert("RGB").crop(box), out)


YBOX = (470, 40, 930, 560)     # Yojimbo close-up, enemy-turn camera
DBOX = (640, 205, 960, 567)   # Daigoro head and chest, wide camera
frame("A-yojimbo-cast", YBOX, "g-yoj-cast.jpg")
frame("A-yojimbo-flinch", YBOX, "g-yoj-hurt.jpg")
frame("none-yojimbo-flinch", YBOX, "g-yoj-idle-flinch.jpg")
frame("A-daigoro-cast", DBOX, "g-dg-cast30.jpg")
frame("none-daigoro-cast", DBOX, "g-dg-idle.jpg")

# ------------------------------------------------ departure sketches
BD = Image.open(os.path.join(REPO, "public/art/backdrops/cavern-stolen-fayth.png")).convert("RGBA")
PLATE = BD.crop((1150, 560, 1850, 1560))   # 700x1000, floor near the pad
FEET = 900


def place(canvas, fig, height, cx, alpha=1.0, dy=0, scale=1.0):
    h = int(height * scale)
    w = int(fig.width * h / fig.height)
    f = fig.resize((w, h), Image.LANCZOS)
    if alpha < 1:
        a = f.getchannel("A").point(lambda v: int(v * alpha))
        f.putalpha(a)
    canvas.alpha_composite(f, (int(cx - w / 2), int(FEET + dy - h)))


def sub(figs):
    c = PLATE.copy()
    for args in figs:
        place(c, *args)
    return c.resize((196, 280), Image.LANCZOS)


def strip(frames, name):
    s = Image.new("RGBA", (196 * len(frames) + 6 * (len(frames) - 1), 280), (11, 10, 18, 255))
    for i, f in enumerate(frames):
        s.alpha_composite(f, (i * 202, 0))
    save(s, name)


YH, DH, GH = 760, 218, 540   # 2.55 / 0.73 / 1.82 world units (INSTALLED.md estimates), scaled


def pair(a=1.0, dy=0, sc=1.0, dx=0):
    return [(Y_IDLE, YH, 400 + dx, a, dy, sc), (D_IDLE, DH, 170 + dx * 0.6, a, dy, sc)]


strip([sub(pair()), sub(pair(0.7, -6, 0.95, 50)), sub(pair(0.35, -12, 0.9, 110))], "x-pair-yields.png")
strip([sub(pair()), sub(pair(0.5, -35)), sub(pair(0.12, -70))], "x-pair-dismissed.png")
strip([sub([(G_IDLE, GH, 350)]), sub([(G_IDLE, GH, 350)]), sub([(G_IDLE, GH, 350)])], "x-gn-stays.png")
strip([sub([(G_IDLE, GH, 350)]), sub([(G_IDLE, GH, 350, 0.5, -20)]), sub([(G_IDLE, GH, 350, 0.1, -40)])], "x-gn-dissolve.png")
strip([sub([(G_IDLE, GH, 350)] + pair(0.12, -70)), sub([(G_IDLE, GH, 350, 0.5, -20)]), sub([(G_IDLE, GH, 350, 0.1, -40)])], "x-gn-sent.png")

# decision-exit.html shows ../../macalania/decisions/img/dissolve-reference-mortiorchis.png in place (not copied).
