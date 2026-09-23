"""Living-portrait v4 (FFX-2 only): finish the judged keys for the rig.

The round-2 judge (art/v4/keys/judge.md) named the best candidate per yaw and
what each still needs. This does those fixes, in order, on the judge's picks:

  clip     -60, -85: the plate's red-rimmed cyan clip as -20/-40 paint it
           (-40's own pixels, SAM clip mask), scaled onto each key's clip
  hue      every key: rainbow (yellow-green to cyan) in the HAIR only, pulled to
           the plate's hair colour at its own lightness; the clip, the eyes, the
           face and 30 px around the tassel are left alone (the plate has a teal
           glint beside its tassel)
  jobs     inpaint sources and masks (LoRA inpaints through tools/gen/inpaint.mjs):
             cord-85   the blue beaded cord under -85's clip, painted out as hair
             far+60    +60's bald far side: -60's far hair mirrored in as the
                       start paint, then repainted behind the cheek
             back+85   +85's back of the head: the straight cut rounded and the
                       rainbow slab repainted as the plate's bob
             hole<N>   under each key's own tassel (the runtime draws the
                       plate's tassel on top at every yaw, rig-v4lib TASSEL_DX)
  merge    the picked inpaint variants composited into the finished keys:
           <name>.notassel (what the layers are cut from) and <name> (the same
           with the plate's tassel drawn on, for sheets and judging), as PNG
           in D:/Tools/pyrefly-lora/yuna-x2/rig-v4/final/ and as lossless webp
           in art/v4/keys/final/. The picks are kept cropped to their job box
           in art/v4/keys/fix-picks/, so merge runs again without ComfyUI.
Work images and jobs: D:/Tools/pyrefly-lora/yuna-x2/rig-v4/{work,jobs}/.

    python -s tools/gen/rig-v4fix.py prep
    python -s tools/gen/rig-v4fix.py merge --picks cord-85:1,far+60:2,...
"""
from __future__ import annotations

import importlib.util
import pathlib
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = pathlib.Path(__file__).resolve().parent
_v = importlib.util.spec_from_file_location("rigv4", HERE / "rig-v4lib.py")
V = importlib.util.module_from_spec(_v); _v.loader.exec_module(V)
L = V.L

KEYS = V.V4 / "keys"
WORK = V.SCRATCH / "work"
JOBS = V.SCRATCH / "jobs"
FINAL = V.SCRATCH / "final"
PICKS = KEYS / "fix-picks"   # the picked inpaint results, cropped to their job box (committed)
MASKS = V.V4 / "masks"
PLATE_HAIR_AB = np.array([23.2, 25.8])  # hairFront + hairBack mean Lab ab (rig-turns.py)


def mask(yaw, layer):
    """The PICKED key's masks (rig-sam.py masks --src picked): the fixes are placed on them."""
    p = MASKS / "picked" / V.NAMES[yaw] / f"{layer}.png"
    return np.asarray(Image.open(p)) > 127 if p.exists() else np.zeros((V.H, V.W), bool)


def save_rgb(rgb, p):
    p.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(np.rint(rgb), 0, 255).astype(np.uint8), "RGB").save(p)


# ---- clip ----------------------------------------------------------------------

# Frozen so a re-run never drifts with the masks of an already fixed key: the source is -40's own
# clip and the targets each key's own old clip, all SAM on the PICKED keys, snapped
# (art/v4/keys/clip-src-m40.png, clip-dst-m85.png, clip-dst-m60.png).
def clip_target(yaw):
    dm = L.load_l(KEYS / f"clip-dst-m{-yaw}.png") > 0.5
    ys, xs = np.nonzero(dm)
    return (xs.min() + xs.max() + 1) / 2, (ys.min() + ys.max() + 1) / 2, int(ys.max() - ys.min() + 1), dm


def paste_clip(rgb, yaw):
    src = V.key_rgb(-40, "picked")
    sm = L.load_l(KEYS / "clip-src-m40.png") > 0.5
    ys, xs = np.nonzero(sm)
    sy0, sy1, sx0, sx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    cx, cy, th, dm = clip_target(yaw)
    s = th / (sy1 - sy0)
    sprite = Image.fromarray(src[sy0:sy1, sx0:sx1].astype(np.uint8))
    alpha = Image.fromarray((ndi.gaussian_filter(sm[sy0:sy1, sx0:sx1].astype(np.float32), 0.8) * 255).astype(np.uint8))
    w, h = int(round((sx1 - sx0) * s)), int(round((sy1 - sy0) * s))
    sprite = np.asarray(sprite.resize((w, h), Image.LANCZOS)).astype(np.float32)
    alpha = np.asarray(alpha.resize((w, h), Image.LANCZOS)).astype(np.float32)[..., None] / 255.0
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    out = rgb.copy()
    xa, xb = max(0, x0), min(V.W, x0 + w)
    out[y0:y0 + h, xa:xb] = out[y0:y0 + h, xa:xb] * (1 - alpha[:, xa - x0:xb - x0]) + sprite[:, xa - x0:xb - x0] * alpha[:, xa - x0:xb - x0]
    covered = np.zeros((V.H, V.W), bool)
    covered[y0:y0 + h, xa:xb] = alpha[:, xa - x0:xb - x0, 0] > 0.5
    left = dm & ~covered
    return out, left, {"scale": round(float(s), 3), "at": [x0, y0, w, h], "from": [int(sx0), int(sy0), int(sx1 - sx0), int(sy1 - sy0)]}


# ---- hue -----------------------------------------------------------------------

def hue_clamp(rgb, yaw, clip=None):
    from skimage import color
    head = mask(yaw, "head")
    keep = L.dilate(mask(yaw, "face") | mask(yaw, "eyeR") | mask(yaw, "eyeL"), 3) | L.dilate(mask(yaw, "clip") if clip is None else clip, 8)
    keep |= L.dilate(V.tassel_footprint(yaw) > 0.1, 30) if V.tassel_visible(yaw) else np.zeros_like(head)
    s = V.hsv(rgb)
    h, sat = s[..., 0] * 360, s[..., 1]
    # the clip's own cyan body: saturated cyan touching its red rim (the SAM clip mask of -20 missed
    # most of it and the clamp turned the body beige)
    red = (sat > 0.6) & ((h < 12) | (h > 348)) & (s[..., 2] > 0.45)
    cyan = (sat > 0.45) & (h > 160) & (h < 212) & (s[..., 2] > 0.5)
    lab, _ = ndi.label(cyan)
    touch = np.unique(lab[cyan & L.dilate(red, 12)])
    keep |= L.dilate(np.isin(lab, touch[touch > 0]), 4)
    rainbow = head & ~keep & (h > 62) & (h < 200) & (sat > 0.22)
    wgt = ndi.gaussian_filter(rainbow.astype(np.float32), 2.0) * (head & ~keep)
    lab = color.rgb2lab(np.clip(rgb / 255.0, 0, 1))
    tgt = lab.copy()
    tgt[..., 1:] = PLATE_HAIR_AB
    lab = lab * (1 - wgt[..., None]) + tgt * wgt[..., None]
    out = np.clip(color.lab2rgb(lab), 0, 1) * 255
    return out, int(rainbow.sum())


# ---- jobs ----------------------------------------------------------------------

def fill(rgb, hole):
    return L.push_pull_fill(rgb, ~hole)


def job_cord(rgb):
    s = V.hsv(rgb)
    blue = (s[..., 1] > 0.45) & (s[..., 0] * 360 > 195) & (s[..., 0] * 360 < 250)
    zone = np.zeros_like(blue); zone[280:640, 480:700] = True
    m = L.dilate(blue & zone & ~L.dilate(mask(-85, "clip"), 2), 7) & zone
    return m


def job_far60(rgb):
    """-60's far-side hair mirrored (about the head axis x = 473) behind +60's
    far cheek, where the flat-fill key left the head bald; -60's own face in
    that region is filled from the hair around it; then a light repaint."""
    d = 2 * (473 - 416)  # the flipped canvas is centred on 416

    def mirrored(a):
        a = np.roll(a[:, ::-1], d, 1)
        a[:, :d] = 0
        return a
    src = mirrored(V.key_rgb(-60, "picked"))
    sh = mirrored(mask(-60, "head")).astype(bool)
    sface = mirrored(L.dilate(mask(-60, "face") | mask(-60, "eyeR") | mask(-60, "eyeL"), 22)).astype(bool)
    face = mask(60, "face")
    head = mask(60, "head")
    region = sh & ~head & ~face
    region[:, :640] = False
    hair = region & ~sface
    col = L.push_pull_fill(src, hair)
    out = rgb.copy()
    out[region] = col[region]
    m = L.dilate(region, 8) & ~L.dilate(face, 2)
    blob = L.dilate(region & sface, 5) & ~L.dilate(face, 1)  # filled from around it: a smooth patch to repaint
    return out, m, blob


def job_back85(rgb):
    head = mask(85, "head")
    face = mask(85, "face")
    lm = V.landmarks(85)
    yy, xx = np.mgrid[0:V.H, 0:V.W]
    # the back of a head in profile is round: an ellipse through the crown and the nape
    cx, cy, rx, ry = 600.0, 380.0, 480.0, 520.0  # the skull: x 272 at the top row, 120 at y 380, 165 at y 600
    shell = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1.0
    zone = (xx < lm["cheek_R"][0] - 25) & (yy < 780)  # down through the hair tips: a cut at 640 left a seam
    m = zone & (shell | head) & ~L.dilate(face, 6) & ~L.dilate(V.tassel_footprint(85) > 0.1, 6)
    out = rgb.copy()
    new = m & shell & ~head
    out = np.where(new[..., None], fill(np.where((head & ~face)[..., None], rgb, 255.0), ~(head & ~face))[..., :3], out)
    gone = zone & head & ~shell
    out[gone] = 255.0
    return out, (m & shell) | L.dilate(gone, 4)


def job_hole(rgb, yaw):
    """Under each key's own tassel. The LoRA painted the tassel straight back
    into the hole at every denoise tried (0.78 and 0.38, with and without the
    reference), and the plate's own v3 fill under its tassel is a dark mottle;
    so the hole takes the hair beside it, row by row: the strands here hang
    near vertical, and the hair just left of the hole (her right, outside the
    ear) shifted across reads as the same strands continuing (the start paint
    is used as it is, no sampler)."""
    t = mask(yaw, "tassel") | (V.tassel_footprint(yaw) > 0.3)
    # only where the head is: over the neck and the hood the pinned body is drawn (plate / bodyTurned)
    m = L.dilate(t, 5) & ~(V.body_alpha() > 0.5)
    out = rgb.copy()
    for y in np.nonzero(m.any(1))[0]:
        xs = np.nonzero(m[y])[0]
        runs = np.split(xs, np.nonzero(np.diff(xs) > 1)[0] + 1)
        for r in runs:
            x0, x1 = int(r[0]), int(r[-1]) + 1
            w = x1 - x0
            src = x0 - w - 3
            if src >= 0:
                out[y, x0:x1] = rgb[y, src:src + w]
            else:
                out[y, x0:x1] = rgb[y, x1 + 3:x1 + 3 + w] if x1 + 3 + w <= V.W else rgb[y, x0:x1]
    soft = ndi.gaussian_filter(m.astype(np.float32), 1.5)[..., None]
    out = rgb * (1 - soft) + ndi.uniform_filter(out, size=(3, 1, 1)) * soft
    return out, L.dilate(m, 2)


def prep():
    plan = {}
    for yaw in (-85, -60, -40, -20, 20, 40, 60, 85):
        name = V.NAMES[yaw]
        rgb = V.key_rgb(yaw, "picked")
        rec = {"from": V.key_path(yaw, "picked").name}
        leftover = clip = None
        if yaw in (-60, -85):
            rgb, leftover, rec["clip"] = paste_clip(rgb, yaw)
            clip = L.load_l(KEYS / f"clip-dst-m{-yaw}.png") > 0.5
        rgb, rec["rainbowPx"] = hue_clamp(rgb, yaw, clip)
        save_rgb(rgb, WORK / f"{name}.png")
        jobs = {}
        if yaw == -85:
            m = job_cord(rgb) | (L.dilate(leftover, 3) if leftover is not None else False)
            jobs["cord-85"] = (fill(rgb, m), m)
        if yaw == -60 and leftover is not None and leftover.sum() > 50:
            jobs["clip-60"] = (fill(rgb, L.dilate(leftover, 3)), L.dilate(leftover, 3))
        if yaw == 60:
            init, m, blob = job_far60(rgb)
            jobs["far+60"] = (init, m)
            jobs["blob+60"] = (init, blob)
        if yaw == 85:
            jobs["back+85"] = job_back85(rgb)
        if V.tassel_visible(yaw):
            jobs[f"hole{yaw:+d}"] = job_hole(rgb, yaw)
        for j, (init, m) in jobs.items():
            save_rgb(init, JOBS / f"{j}.init.png")
            L.save_l(ndi.gaussian_filter(m.astype(np.float32), 1.5), JOBS / f"{j}.mask.png")
            if j == "back+85":
                # merged back over the old hair tips with a long vertical fade (rows 700 to 780), not a line
                yy_ = np.arange(V.H, dtype=np.float32)[:, None]
                L.save_l(ndi.gaussian_filter(m.astype(np.float32), 1.5) * np.clip((780 - yy_) / 80, 0, 1), JOBS / f"{j}.alpha.png")
            ys, xs = np.nonzero(m)
            rec.setdefault("jobs", {})[j] = {"box": [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)], "px": int(m.sum())}
        plan[name] = rec
        print(name, rec)
    L.write_json(plan, KEYS / "fix-plan.json")


def merge(picks: dict[str, str]):
    plan = L.read_json(KEYS / "fix-plan.json")
    im, ex, ey = V.plate_earring()
    for name, rec in plan.items():
        yaw = next(y for y, n in V.NAMES.items() if n == name)
        rgb = np.asarray(Image.open(WORK / f"{name}.png").convert("RGB")).astype(np.float32)
        for j in rec.get("jobs", {}):
            v = picks.get(j)
            if not v:
                raise SystemExit(f"no pick for {j}")
            # "init": the start paint itself (a composite of real painted pixels, no sampler)
            src = JOBS / f"{j}.init.png" if v == "init" else JOBS / "out" / f"{j}.{v}.full.png"
            x, y, w, h = rec["jobs"][j]["box"]
            crop = PICKS / f"{j}.{v}.png"
            if src.exists():
                res = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
                PICKS.mkdir(parents=True, exist_ok=True)
                save_rgb(res[y:y + h, x:x + w], crop)
            else:
                res = rgb.copy()
                res[y:y + h, x:x + w] = np.asarray(Image.open(crop).convert("RGB")).astype(np.float32)
            m = L.load_l(JOBS / f"{j}.alpha.png" if (JOBS / f"{j}.alpha.png").exists() else JOBS / f"{j}.mask.png")[..., None]
            rgb = rgb * (1 - m) + res * m
            rec["jobs"][j]["pick"] = v
        save_rgb(rgb, FINAL / f"{name}.notassel.png")
        (KEYS / "final").mkdir(parents=True, exist_ok=True)
        Image.fromarray(np.clip(np.rint(rgb), 0, 255).astype(np.uint8)).save(KEYS / "final" / f"{name}.notassel.webp", lossless=True)
        full = rgb.copy()
        if V.tassel_visible(yaw):
            canvas = np.concatenate([full, np.full((V.H, V.W, 1), 255.0)], -1)
            L.over(canvas, im, ex + V.TASSEL_DX[yaw], ey)
            full = canvas[..., :3]
        save_rgb(full, FINAL / f"{name}.png")
        Image.fromarray(np.clip(np.rint(full), 0, 255).astype(np.uint8)).save(KEYS / "final" / f"{name}.webp", lossless=True)
        print("final", name)
    L.write_json(plan, KEYS / "fix-plan.json")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["prep"]:
        prep()
    elif a[:1] == ["merge"]:
        merge(dict(p.split(":") for p in a[a.index("--picks") + 1].split(",")))
    else:
        raise SystemExit(__doc__)
