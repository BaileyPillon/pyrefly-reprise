# Leblanc pilot 2 contact sheet (FFX-2 only).
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/leblanc/pilot2/build-sheet.py
# -> sheet.jpg (q85): per state, the idle then every candidate WHOLE (D = stage 2 output,
#    E, F), a row of 1:1 face crops and a row of 1:1 costume crops (native pixels, never scaled).
# -> sheet-d-stages.jpg: D stage 1 against D stage 2, whole + 1:1 face, to show what the
#    re-identify pass changed.
# Face boxes are found from the hair (the largest pale-yellow blob), then checked by eye;
# FACE_OVERRIDE holds the ones set by hand (cutout pixel coordinates, x, y, w, h).
import json, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
R = HERE / "renders"
IDLE = ROOT / "public/art/characters/leblanc/idle.png"
FACE = (200, 200)   # 1:1 crop sizes
COST = (240, 300)
CELL_H = 560
BG = (150, 150, 160)
INK = (235, 235, 235)
FACE_OVERRIDE = {"idle": (240, 25, 200, 200)}
COST_OVERRIDE = {"idle": (180, 200, 240, 300)}
# Face boxes read by eye off gridded raw frames (raw 832x1216 coordinates, 200x200);
# converted to cutout coordinates with each render's own cropBox. D stage 1 and 2 share
# a frame; F uses the same seeds and lands in nearly the same place.
RAW_FACE = {
    "hurt": {"d": [(160, 20), (265, 25), (225, 30), (250, 15)],
             "e": [(580, 150), (560, 150), (590, 140), (600, 140)]},
    "attack": {"d": [(45, 10), (335, 95), (435, 190), (85, 5)],
               "e": [(180, 210), (190, 220), (200, 220), (200, 215)]},
}
# The attack figures fill the frame (heads ~250 px wide against idle's ~190), so their
# boxes were read straight off gridded CUTOUTS instead (cutout coordinates, 260x260 face).
# D stage 2 and F share seeds and land within a few pixels of each other.
CUT_ATTACK_FACE = [(60, 20), (430, 100), (430, 320), (140, 60)]
CUT_ATTACK_COST = [(160, 330), (430, 380), (380, 430), (180, 300)]
FACE_ATTACK = (260, 260)
# E's torso sits beside the head, not under it (the puppet leans), so its costume box is explicit.
RAW_COST_E = {"hurt": (500, 320), "attack": (230, 370)}

try:
    FONT = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 22)
    BIG = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 34)
except OSError:
    FONT = BIG = ImageFont.load_default()


def load(p):
    im = Image.open(p).convert("RGBA")
    return im


def on_bg(im):
    bg = Image.new("RGBA", im.size, BG + (255,))
    bg.alpha_composite(im)
    return bg.convert("RGB")


def hair_box(im):
    a = np.asarray(im).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3]
    mx, mn = rgb.max(2), rgb.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hair = (al > 0.5) & (mx > 0.55) & (sat > 0.18) & (sat < 0.6) & (r >= g) & (g > b + 0.08) & ((r - g) < 0.12)
    hair = ndimage.binary_opening(hair, iterations=2)
    lab, n = ndimage.label(hair)
    if not n:
        return None
    sizes = ndimage.sum(hair, lab, range(1, n + 1))
    k = int(np.argmax(sizes)) + 1
    ys, xs = np.nonzero(lab == k)
    return xs.min(), ys.min(), xs.max(), ys.max()


def face_box(name, im, raw=None, crop_box=None):
    if name in FACE_OVERRIDE:
        return FACE_OVERRIDE[name]
    if isinstance(raw, dict):
        return raw["face"]
    if raw is not None:
        return (raw[0] - crop_box[0], raw[1] - crop_box[1]) + FACE
    hb = hair_box(im)
    if hb is None:
        return (0, 0) + FACE
    x0, y0, x1, y1 = hb
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2 + 20
    return (cx - FACE[0] // 2, cy - FACE[1] // 2) + FACE


def cost_box(name, im, fb, raw=None, crop_box=None):
    if name in COST_OVERRIDE:
        return COST_OVERRIDE[name]
    if isinstance(raw, dict):
        return raw["cost"]
    if raw is not None:
        return (raw[0] - crop_box[0], raw[1] - crop_box[1]) + COST
    al = np.asarray(im)[..., 3] > 128
    top = fb[1] + fb[3] - 10
    band = al[max(top, 0): top + COST[1]]
    xs = np.nonzero(band.any(0))[0]
    cols = band.sum(0)
    cx = int((cols * np.arange(len(cols))).sum() / max(cols.sum(), 1)) if xs.size else im.width // 2
    return (cx - COST[0] // 2, top) + COST


def crop(im, box):
    x, y, w, h = [int(v) for v in box]
    out = Image.new("RGBA", (w, h), BG + (255,))
    out.alpha_composite(im.crop((x, y, x + w, y + h)))
    return out.convert("RGB")


def whole(im, h=CELL_H):
    s = h / im.height
    w = max(1, int(im.width * s))
    if w > 330:
        s = 330 / im.width
    t = on_bg(im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS))
    cell = Image.new("RGB", (330, h), BG)
    cell.paste(t, ((330 - t.width) // 2, h - t.height))
    return cell


def block(title, items):
    """items: list of (label, path). Returns an image: whole row, face row, costume row."""
    cols = []
    for label, p, rf, rc in items:
        im = load(p)
        cbx = None
        side = pathlib.Path(p).with_suffix(".json")
        if pathlib.Path(p).parent == R and side.exists():
            cbx = json.loads(side.read_text(encoding="utf-8"))["cutout"]["cropBox"]
        fb = face_box(label, im, rf, cbx)
        cb = cost_box(label, im, fb, rc, cbx)
        cols.append((label, whole(im), crop(im, fb), crop(im, cb)))
    cw = 330
    gap = 10
    W = len(cols) * (cw + gap) + gap
    FH = max(c[2].height for c in cols)
    H = 60 + CELL_H + 34 + FH + 34 + COST[1] + 30
    out = Image.new("RGB", (W, H), (28, 28, 34))
    d = ImageDraw.Draw(out)
    d.text((gap, 10), title, font=BIG, fill=INK)
    y_whole = 60
    y_face = y_whole + CELL_H + 34
    y_cost = y_face + FH + 34
    d.text((gap, y_face + FH + 4), "costume, 1:1 native pixels", font=FONT, fill=(170, 170, 180))
    for i, (label, w, f, c) in enumerate(cols):
        x = gap + i * (cw + gap)
        out.paste(w, (x, y_whole))
        d.text((x + 6, y_whole + 6), label, font=FONT, fill=(20, 20, 30))
        out.paste(f, (x + (cw - f.width) // 2, y_face))
        out.paste(c, (x + (cw - c.width) // 2, y_cost))
    d.text((gap, y_face - 28), "face, 1:1 native pixels", font=FONT, fill=(170, 170, 180))
    return out


def stack(blocks, header):
    W = max(b.width for b in blocks)
    H = sum(b.height for b in blocks) + 90
    out = Image.new("RGB", (W, H), (20, 20, 26))
    d = ImageDraw.Draw(out)
    d.text((10, 16), header, font=BIG, fill=INK)
    y = 80
    for b in blocks:
        out.paste(b, (0, y))
        y += b.height
    return out


def main():
    blocks = []
    for state in ("hurt", "attack"):
        items = [("idle", IDLE, None, None)]
        for m in ("d2", "e", "f"):
            for n in range(1, 5):
                p = R / f"{m}-{state}.{n}.png"
                rf = RAW_FACE[state]["e" if m == "e" else "d"][n - 1]
                rc = RAW_COST_E[state] if m == "e" else None
                if state == "attack" and m != "e":
                    rf = {"face": CUT_ATTACK_FACE[n - 1] + FACE_ATTACK}
                    rc = {"cost": CUT_ATTACK_COST[n - 1] + COST}
                items.append((f"{m.replace('d2', 'D').upper()}{n} {state}", p, rf, rc))
        blocks.append(block(f"{state.upper()}  -  idle | method D (pose, then re-identify) | method E (puppet img2img) | method F (square reference)", items))
    stack(blocks, "Leblanc pilot 2 - CANDIDATES, not approved - FFX-2 only").save(HERE / "sheet.jpg", quality=85)

    dblocks = []
    for state in ("hurt", "attack"):
        items = [("idle", IDLE, None, None)]
        for n in range(1, 5):
            rf, rc = RAW_FACE[state]["d"][n - 1], None
            if state == "attack":
                rf = {"face": CUT_ATTACK_FACE[n - 1] + FACE_ATTACK}
                rc = {"cost": CUT_ATTACK_COST[n - 1] + COST}
            items.append((f"D{n} stage 1", R / f"d1-{state}.{n}.png", rf, rc))
            items.append((f"D{n} stage 2", R / f"d2-{state}.{n}.png", rf, rc))
        dblocks.append(block(f"{state.upper()}  -  method D, stage 1 against stage 2 (re-identify)", items))
    stack(dblocks, "Leblanc pilot 2 - what D's re-identify pass changed").save(HERE / "sheet-d-stages.jpg", quality=85)
    print("sheets written")


if __name__ == "__main__":
    main()
