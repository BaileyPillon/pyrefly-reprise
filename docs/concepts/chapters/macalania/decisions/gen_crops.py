"""Generate crop/composite derivatives for the Chapter VII decision sheets.
Reads from ./img (already-copied source PNGs) and from the installed
candidate art under public/art/characters/**, writes derivatives back into
./img. Nothing here touches public/art, approved-hashes.json or src/.

Sources copied into ./img before this ran:
  ch7-capture.png                  -- own capture, 1600x900, real battle menu,
                                       npx vite --port 5750 --strictPort (HMR off),
                                       PYREFLY_BROWSER=gpu,
                                       window.__pyrefly.gotoChapter('seymour-anima-macalania'),
                                       stopped by PID afterwards. Shows the
                                       installed idle paintings for Seymour and
                                       Guado Guardian A at their real battle
                                       position and scale.
  dissolve-reference-mortiorchis.png -- docs/screenshots/bp1/actor-11-enemy-dissolve.png,
                                       a real capture of the existing global
                                       'dissolve' departure kind (Mortiorchis,
                                       Gagazet, FFX) -- the same code path
                                       Seymour and the Guardians use today.
seymour-*.png, guardian-*.png, anima-*.png -- copied verbatim from
  public/art/characters/{seymour-macalania,guado-guardian,anima}/*.png
  (CANDIDATE quality; scores in production/judge.md).
"""
from PIL import Image, ImageEnhance, ImageFilter
import os

D = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(D, "img")


def op(name):
    return os.path.join(IMG, name)


def load(name):
    return Image.open(op(name)).convert("RGBA")


def save(im, name):
    im.convert("RGBA").save(op(name))
    print("wrote", name, im.size)


# ---------------------------------------------------------------- face crops
def face_crop(src, name, frac=0.34):
    im = load(src)
    w, h = im.size
    crop = im.crop((0, 0, w, int(h * frac)))
    save(crop, name)


for who in ("seymour-idle", "seymour-cast", "seymour-attack", "guardian-idle", "guardian-cast", "guardian-attack"):
    face_crop(f"{who}.png", f"crop-{who}-face.png")

# ---------------------------------------------------------- game-size panels
# Both subjects stand on the same ice floor in ch7-capture.png. Positions were
# measured by eye against a 50px grid overlaid on the capture (not rendered) --
# same method as art-r3-decisions/gen_crops.py.
BG = "ch7-capture.png"
FRAME_W, FRAME_H = 1600, 900
POS = {
    "seymour": {"x_frac": 0.581, "y_bottom_frac": 0.694, "target_h": 440},
    "guardian": {"x_frac": 0.723, "y_bottom_frac": 0.694, "target_h": 320},
}

# ------------------------------------------------------------- clean plates
# ch7-capture.png already shows Seymour and the Guardian standing at full
# opacity (that is today's idle). A dimmed/stepped-back frame pasted straight
# on top of that would show the dim figure ghosting over the still-opaque
# original underneath -- not what "dims" means. Build a clean plate per
# subject by tiling a nearby, unobstructed strip of the same real capture
# (pillar + ice floor, no HUD, no character) over that subject's bounding
# box, and use the clean plate under every frame *after* the first one in a
# fade/step-back strip. No pixels are invented: every patch comes from
# ch7-capture.png itself.
BBOX = {
    "seymour": (800, 175, 1050, 650),
    "guardian": (1090, 295, 1225, 650),
}
DONOR = {
    # A vertical strip of bare hall (pillar + floor light) between the two
    # subjects, and one just to the guardian's right -- both unobstructed by
    # any HUD panel or character in ch7-capture.png.
    "seymour": (1045, 175, 1100, 650),
    "guardian": (1225, 295, 1340, 650),
}


def clean_plate(subject):
    bg = load(BG).resize((FRAME_W, FRAME_H)).convert("RGBA")
    bx0, by0, bx1, by1 = BBOX[subject]
    dx0, dy0, dx1, dy1 = DONOR[subject]
    donor = bg.crop((dx0, dy0, dx1, dy1))
    dw = donor.size[0]
    target_w = bx1 - bx0
    x = bx0
    flip = False
    canvas = bg.copy()
    while x < bx1:
        tile = donor.transpose(Image.FLIP_LEFT_RIGHT) if flip else donor
        w = min(dw, bx1 - x)
        canvas.paste(tile.crop((0, 0, w, tile.size[1])), (x, by0))
        x += dw
        flip = not flip
    # Soften the tile-repeat seams -- this patch only ever shows through a
    # dimmed/faded figure or bare, so a mirror-tiled join reading as a join
    # would be a distraction the concept doesn't need.
    patch = canvas.crop((bx0, by0, bx1, by1)).filter(ImageFilter.GaussianBlur(3))
    canvas.paste(patch, (bx0, by0))
    save(canvas, f"bg-clean-{subject}.png")
    return canvas


CLEAN_PLATE = {"seymour": clean_plate("seymour"), "guardian": clean_plate("guardian")}


def composite_onto(canvas, char_png, subject):
    p = POS[subject]
    char = load(char_png)
    w, h = char.size
    scale = p["target_h"] / h
    new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
    char_s = char.resize((new_w, new_h), Image.LANCZOS)
    x = int(FRAME_W * p["x_frac"] - new_w / 2)
    y = int(FRAME_H * p["y_bottom_frac"] - new_h)
    canvas.alpha_composite(char_s, (x, y))
    return canvas


def option_frame(out_name, seymour_png, guardian_png):
    # Paste onto each subject's clean plate (not the raw capture) so a
    # different-silhouette candidate (e.g. the attack pose) never shows the
    # still-opaque idle peeking out from underneath.
    canvas = load(BG).resize((FRAME_W, FRAME_H))
    bx0, by0, bx1, by1 = BBOX["seymour"]
    canvas.paste(CLEAN_PLATE["seymour"].crop((bx0, by0, bx1, by1)), (bx0, by0))
    gx0, gy0, gx1, gy1 = BBOX["guardian"]
    canvas.paste(CLEAN_PLATE["guardian"].crop((gx0, gy0, gx1, gy1)), (gx0, gy0))
    composite_onto(canvas, seymour_png, "seymour")
    composite_onto(canvas, guardian_png, "guardian")
    save(canvas, out_name)


# Option A -- fewest paintings: idle -> cast is the only state ever shown.
option_frame("gamesize-optionA-cast.png", "seymour-cast.png", "guardian-cast.png")
# Option B -- A plus an attack painting.
option_frame("gamesize-optionB-attack.png", "seymour-attack.png", "guardian-attack.png")
# Option C -- engine only: the capture is already exactly this (idle, no
# painting swap at all). Copied through unchanged so the sheet can show one
# file per option without a special case in the HTML.
save(load(BG).resize((FRAME_W, FRAME_H)), "gamesize-optionC-idle.png")

# ------------------------------------------------------- decision 2: strips
# Reusable 3-frame "yields" builder (idle full opacity -> dim + step back ->
# further dim + further back), identical recipe to art-r3-decisions
# (idle's own pixels, opacity + offset only, no new render).
def yields_strip(idle_png, subject, prefix):
    p = POS[subject]
    frames = [(1.00, 1.00, 0), (0.55, 0.92, 26), (0.18, 0.84, 52)]
    for i, (opacity, scale_extra, shift_px) in enumerate(frames, start=1):
        # Frame 1 is today, unaltered -- the real capture already shows this.
        # Frames 2-3 dim/step back, so they composite onto the clean plate,
        # not on top of the still-opaque original (see clean_plate() above).
        bg = load(BG).resize((FRAME_W, FRAME_H)) if i == 1 else CLEAN_PLATE[subject].copy()
        char = load(idle_png)
        w, h = char.size
        scale = (p["target_h"] / h) * scale_extra
        nw, nh = int(w * scale), int(h * scale)
        char_s = char.resize((nw, nh), Image.LANCZOS)
        a = char_s.split()[3].point(lambda v: int(v * opacity))
        char_s.putalpha(a)
        x = int(FRAME_W * p["x_frac"] - nw / 2) + shift_px
        y = int(FRAME_H * p["y_bottom_frac"] - nh)
        canvas = bg.copy()
        canvas.alpha_composite(char_s, (x, y))
        save(canvas, f"{prefix}-{i}.png")


yields_strip("seymour-idle.png", "seymour", "seymour-yields")
yields_strip("guardian-idle.png", "guardian", "guardian-yields")

# Seymour "falls and stays down" (`'body'`, recommended): hurt (staggering,
# full opacity) -> ko dropping in (60% opacity, offset down+toward camera) ->
# ko settled (full opacity, in place). Built from the existing hurt.png and
# ko.png candidates only -- no new render.
def seymour_body_strip():
    p = POS["seymour"]

    def frame(png, opacity, dy, dx, name, clean=False):
        bg = CLEAN_PLATE["seymour"].copy() if clean else load(BG).resize((FRAME_W, FRAME_H))
        char = load(png)
        w, h = char.size
        scale = p["target_h"] / h
        nw, nh = int(w * scale), int(h * scale)
        char_s = char.resize((nw, nh), Image.LANCZOS)
        if opacity < 1.0:
            a = char_s.split()[3].point(lambda v: int(v * opacity))
            char_s.putalpha(a)
        x = int(FRAME_W * p["x_frac"] - nw / 2) + dx
        y = int(FRAME_H * p["y_bottom_frac"] - nh) + dy
        canvas = bg.copy()
        canvas.alpha_composite(char_s, (x, y))
        save(canvas, name)

    frame("seymour-hurt.png", 1.00, 0, 0, "seymour-body-1.png", clean=True)
    frame("seymour-ko.png", 0.65, 40, -10, "seymour-body-2.png", clean=True)
    frame("seymour-ko.png", 1.00, 70, -10, "seymour-body-3.png", clean=True)


seymour_body_strip()

# Anima "dismissed" (context, not a decision -- see README): a soft upward
# recall, not a collapse. Idle at full opacity -> idle raised slightly and
# dimmed -> idle raised further and faint. Anima is out of scope for a
# paintings-count decision (she reuses the approved aeon set), so this row is
# reference only.
def anima_dismiss_strip():
    # Anima is not in POS (she stands further back / larger in her own act);
    # place her using the same ground line as the others for sheet purposes.
    x_frac, y_bottom_frac, target_h = 0.50, 0.80, 420
    frames = [(1.00, 0), (0.55, -30), (0.20, -70)]
    for i, (opacity, dy) in enumerate(frames, start=1):
        bg = load(BG).resize((FRAME_W, FRAME_H))
        char = load("anima-idle.png")
        w, h = char.size
        scale = target_h / h
        nw, nh = int(w * scale), int(h * scale)
        char_s = char.resize((nw, nh), Image.LANCZOS)
        a = char_s.split()[3].point(lambda v: int(v * opacity))
        char_s.putalpha(a)
        x = int(FRAME_W * x_frac - nw / 2)
        y = int(FRAME_H * y_bottom_frac - nh) + dy
        canvas = bg.copy()
        canvas.alpha_composite(char_s, (x, y))
        save(canvas, f"anima-dismiss-{i}.png")


anima_dismiss_strip()

print("done")
