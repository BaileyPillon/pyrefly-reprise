# Leblanc pilot 2 helpers (FFX-2 only). Run with ComfyUI's embedded python:
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/leblanc/pilot2/tools2.py <cmd> ...
#   maxrgb <png>                         largest RGB sample (0 = black frame)
#   figmask <raw.png> <out.png>          figure silhouette (non-white), holes filled, dilated, feathered
#   boxmask <raw.png> x,y,w,h <out.png>  feathered box mask the size of <raw.png>
#   puppet <hurt|attack>                 method E init frame -> renders/e-<state>-init.png
import json, math, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]


def maxrgb(p):
    a = np.asarray(Image.open(p).convert("RGB"))
    print(int(a.max()) if a.size else 0)


def save_mask(m, out):
    Image.fromarray((m * 255).astype(np.uint8)).convert("RGB").save(out)


def figmask(src, out):
    a = np.asarray(Image.open(src).convert("RGB")).astype(np.int16)
    fg = (255 - a).max(axis=2) > 18
    fg = ndimage.binary_opening(fg, iterations=2)
    lab, n = ndimage.label(fg)
    if n:
        sizes = ndimage.sum(fg, lab, range(1, n + 1))
        fg = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 2000])
    fg = ndimage.binary_fill_holes(fg)
    fg = ndimage.binary_dilation(fg, iterations=12)
    m = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
    m.convert("RGB").save(out)


def boxmask(src, box, out):
    w, h = Image.open(src).size
    x, y, bw, bh = [int(v) for v in box.split(",")]
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rectangle([x, y, x + bw, y + bh], fill=255)
    m.filter(ImageFilter.GaussianBlur(10)).convert("RGB").save(out)


# ------------------------------------------------------------------ puppet
# Idle cutout geometry (cutout pixel coordinates, read off idle.png 1:1):
#   head ~ x 240-430, y 15-230; eyes ~ (332,129) and (375,130); mouth ~ (348,166)
#   fan (closed, navy) ~ x 348-506, y 171-225, held by the hand ~ x 432-493, y 184-225
#   waist/obi ~ y 330-390; the front (viewer-left) arm holds the robe out at ~ (40-90, 320-370)
IDLE = ROOT / "public/art/characters/leblanc/idle.png"


def rgba_rotate(img, deg, pivot):
    return img.rotate(deg, resample=Image.BICUBIC, center=pivot, expand=False)


def cut(img, box):
    """Return (piece, holed image): piece keeps only box pixels, img loses them."""
    piece = Image.new("RGBA", img.size, (0, 0, 0, 0))
    piece.paste(img.crop(box), box[:2])
    holed = img.copy()
    ImageDraw.Draw(holed).rectangle(box, fill=(0, 0, 0, 0))
    return piece, holed


def paint_closed_eyes(img, off=0):
    d = ImageDraw.Draw(img)
    O = lambda x, y: (x + off, y + off)
    skin = img.getpixel(O(352, 150))[:3]
    for (ex, ey) in [O(332, 129), O(375, 130)]:
        d.ellipse([ex - 14, ey - 9, ex + 14, ey + 9], fill=skin + (255,))
        d.arc([ex - 13, ey - 12, ex + 13, ey + 4], start=20, end=160, fill=(60, 40, 60, 255), width=3)
    # grimace: the smile becomes a tight, downturned line
    mx, my = O(349, 167)
    d.ellipse([mx - 16, my - 9, mx + 16, my + 9], fill=skin + (255,))
    d.arc([mx - 11, my - 2, mx + 11, my + 10], start=200, end=340, fill=(90, 40, 50, 255), width=3)
    return img


def rot_pt(pt, deg, pivot):
    """Where PIL's img.rotate(deg, center=pivot) sends a point (anticlockwise on screen)."""
    t = math.radians(deg)
    x, y = pt[0] - pivot[0], pt[1] - pivot[1]
    return (pivot[0] + x * math.cos(t) + y * math.sin(t), pivot[1] - x * math.sin(t) + y * math.cos(t))


def puppet(state):
    side = json.loads(IDLE.with_suffix(".json").read_text(encoding="utf-8"))
    W, H = side["source"]["width"], side["source"]["height"]
    x0, y0 = side["cropBox"][:2]
    pad = 200
    P = lambda x, y: (x + pad, y + pad)
    big = padded(pad)
    # hand + closed fan come off the figure (box kept clear of the face)
    hand_box = (*P(415, 160), *P(515, 238))
    hand, big = cut(big, hand_box)
    _, big = cut(big, (*P(350, 176), *P(415, 232)))  # the fan's stub at the chin
    hand_grip = P(462, 205)
    waist, neck, foot = P(300, 420), P(340, 235), P(330, 1100)
    front_hand = P(62, 345)  # the viewer-left hand that holds the robe out
    if state == "hurt":
        big = paint_closed_eyes(big, pad)
        head, big = cut(big, (0, 0, big.width, neck[1]))
        big.alpha_composite(rgba_rotate(head, -16, neck))  # head snaps back
        upper, lower = cut(big, (0, 0, big.width, waist[1]))
        lower.alpha_composite(rgba_rotate(upper, -20, waist))  # torso recoils away from the party
        big = lower
        # hand to the wound: the grip lands on the stomach just above the obi, fan pointing down
        target = rot_pt(P(292, 340), -20, waist)
        big = place_at(big, hand, hand_grip, target, deg=-80)
        whole = -8
    else:
        # the front arm (hand + sleeve end) swings up to shoulder height
        shoulder = P(235, 300)
        arm, big = cut(big, (*P(0, 290), *P(215, 425)))
        big.alpha_composite(rgba_rotate(arm, -30, shoulder))
        hand_now = rot_pt(front_hand, -30, shoulder)
        upper, lower = cut(big, (0, 0, big.width, waist[1]))
        lower.alpha_composite(rgba_rotate(upper, 20, waist))  # torso drives forward
        big = lower
        # the fan goes into the front hand, pointing forward like a baton
        target = rot_pt(hand_now, 20, waist)
        big = place_at(big, hand, hand_grip, target, deg=-10)
        whole = 9
    big = rgba_rotate(big, whole, foot)
    # attack needs room in front of her for the fan: shrink a little and shift right
    scale, dx = (0.86, 150) if state == "attack" else (1.0, 0)
    if scale != 1.0:
        big = big.resize((int(big.width * scale), int(big.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    bx = int((x0 - pad) * scale) + dx
    by = int((y0 - pad) * scale) + int(H * (1 - scale)) - 20 if scale != 1.0 else y0 - pad
    canvas.paste(big, (bx, by), big)
    out = HERE / "renders" / f"e-{state}-init.png"
    canvas.save(out)
    print(out)


def place_at(base, piece, grip, target, deg):
    piece = rgba_rotate(piece, deg, grip)
    moved = Image.new("RGBA", base.size, (0, 0, 0, 0))
    moved.paste(piece, (int(target[0] - grip[0]), int(target[1] - grip[1])), piece)
    out = base.copy()
    out.alpha_composite(moved)
    return out


def padded(pad=200):
    fig = Image.open(IDLE).convert("RGBA")
    big = Image.new("RGBA", (fig.width + 2 * pad, fig.height + 2 * pad), (0, 0, 0, 0))
    big.paste(fig, (pad, pad), fig)
    return big


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "maxrgb":
        maxrgb(sys.argv[2])
    elif cmd == "figmask":
        figmask(sys.argv[2], sys.argv[3])
    elif cmd == "boxmask":
        boxmask(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == "puppet":
        puppet(sys.argv[2])
    else:
        raise SystemExit(f"unknown {cmd}")
