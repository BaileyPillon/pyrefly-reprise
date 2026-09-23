"""Image side of the Logos local fixes (FFX-2 only). Run with ComfyUI's embedded python.

    python -s fix-support.py prep   <fixes.json> <state> <pass> <base.png> <outdir>
    python -s fix-support.py merge  <fixes.json> <state> <pass> <base.png> <inpainted.png> <out.png>
    python -s fix-support.py finish <fixes.json> <state> <patched.png> <orig-cutout.png> <cropBox l,t,r,b> <out-cutout.png>
    python -s fix-support.py ref    <src.png> <l,t,r,b> <out.png>

All coordinates in fixes.json are in the RAW frame (renders/<tag>.raw.png, the SDXL output
before rembg). A pass repaints only inside its mask:

  prep   : optional paste (the idle's own emblem, scaled into an ellipse), then the pass's
           crop box upscaled so the long side is `long` (multiples of 8) -> <outdir>/crop.png
           and the feathered mask at the same size -> <outdir>/mask.png. If a paste ran, the
           pasted full frame is <outdir>/base.png (the next steps use it as the base).
  merge  : the inpainted crop scaled back and blended into the base through the same
           feathered mask; pixels outside the mask are the base's, byte for byte.
  finish : alpha. Outside every pass mask the installed cutout's pixels and alpha are kept
           exactly; inside, RGB is the patched frame, and alpha is either kept (`alpha:
           keep`, interior fixes) or taken from a fresh isnet-anime matte of the patched
           frame (`alpha: rembg`, where the silhouette may move). Crops to content + 16 px
           and prints the cutout JSON (the rembg.py format).
"""
import io
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

os.environ.setdefault("U2NET_HOME", r"D:\Tools\ComfyUI\rembg-models")
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, *[".."] * 7))


def spec(path, state, i=None):
    s = json.load(open(path, encoding="utf-8"))[state]
    return s if i is None else s["passes"][int(i)]


def shape_mask(size, shapes, minus=()):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for group, fill in ((shapes, 255), (minus, 0)):
        for sh in group:
            if "ellipse" in sh:
                cx, cy, rx, ry = sh["ellipse"]
                d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=fill)
            elif "rect" in sh:
                d.rectangle(sh["rect"], fill=fill)
            elif "poly" in sh:
                d.polygon([tuple(p) for p in sh["poly"]], fill=fill)
    return m


def pass_mask(size, p):
    m = shape_mask(size, p["mask"], p.get("minus", []))
    f = p.get("feather", 4)
    return m.filter(ImageFilter.GaussianBlur(f)) if f else m


def crop_size(box, long):
    w, h = box[2] - box[0], box[3] - box[1]
    k = long / max(w, h)
    return (int(round(w * k / 8)) * 8, int(round(h * k / 8)) * 8)


def flat(path):
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[-1])
    return bg


def do_paste(base, p):
    """Paste the idle's own emblem (a circle in the idle cutout) into an ellipse."""
    pa = p["paste"]
    src = Image.open(os.path.join(REPO, pa["from"])).convert("RGBA")
    cx, cy, r = pa["center"][0], pa["center"][1], pa["r"]
    disc = src.crop((round(cx - r), round(cy - r), round(cx + r), round(cy + r)))
    tx, ty, rx, ry = pa["to"]
    disc = disc.resize((round(2 * rx), round(2 * ry)), Image.LANCZOS)
    if pa.get("rot"):
        disc = disc.rotate(pa["rot"], resample=Image.BICUBIC)
    m = Image.new("L", disc.size, 0)
    ImageDraw.Draw(m).ellipse([0, 0, disc.width - 1, disc.height - 1], fill=255)
    m = Image.fromarray(np.minimum(np.asarray(m), np.asarray(disc.getchannel("A"))))
    ox, oy = round(tx - rx), round(ty - ry)
    keep = shape_mask(base.size, pa.get("keep", []))  # regions the paste must not cover
    full = Image.new("L", base.size, 0)
    full.paste(m, (ox, oy))
    full = Image.fromarray(np.minimum(np.asarray(full), 255 - np.asarray(keep)))
    layer = base.copy()
    layer.paste(disc.convert("RGB"), (ox, oy))
    return Image.composite(layer, base, full.filter(ImageFilter.GaussianBlur(0.6)))


def prep(fx, state, i, base_path, outdir):
    p = spec(fx, state, i)
    os.makedirs(outdir, exist_ok=True)
    base = Image.open(base_path).convert("RGB")
    if p.get("paste"):
        base = do_paste(base, p)
    for f in p.get("prefill", []):  # flat colour under the mask, so the sampler cannot re-read a defect
        base = Image.composite(Image.new("RGB", base.size, tuple(f["color"])), base,
                               shape_mask(base.size, [f]).filter(ImageFilter.GaussianBlur(1.5)))
    if p.get("paste") or p.get("prefill"):
        base.save(os.path.join(outdir, "base.png"))
    box = p["crop"]
    size = crop_size(box, p.get("long", 1024))
    base.crop(box).resize(size, Image.LANCZOS).save(os.path.join(outdir, "crop.png"))
    m = pass_mask(base.size, p).crop(box).resize(size, Image.BILINEAR)
    m.save(os.path.join(outdir, "mask.png"))
    print(json.dumps({"crop": box, "size": size, "pasted": bool(p.get("paste") or p.get("prefill"))}))


def merge(fx, state, i, base_path, inp_path, out_path):
    p = spec(fx, state, i)
    base = Image.open(base_path).convert("RGB")
    box = p["crop"]
    w, h = box[2] - box[0], box[3] - box[1]
    patch = Image.open(inp_path).convert("RGB").resize((w, h), Image.LANCZOS)
    layer = base.copy()
    layer.paste(patch, (box[0], box[1]))
    out = Image.composite(layer, base, pass_mask(base.size, p))
    out.save(out_path)
    print(json.dumps({"merged": out_path}))


def finish(fx, state, patched_path, cut_path, crop_box, out_path):
    s = spec(fx, state)
    patched = Image.open(patched_path).convert("RGB")
    W, H = patched.size
    l, t, r, b = [int(v) for v in crop_box.split(",")]
    cut = Image.open(cut_path).convert("RGBA")
    assert cut.size == (r - l, b - t), (cut.size, crop_box)
    orig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    orig.paste(cut, (l, t))
    o = np.asarray(orig).astype(np.float32)
    rgb = o[..., :3].copy()
    alpha = o[..., 3].copy()
    pr = np.asarray(patched).astype(np.float32)
    matte = None
    for p in s["passes"]:
        m = np.asarray(pass_mask((W, H), p)).astype(np.float32) / 255.0
        if p.get("paste"):
            m = np.maximum(m, np.asarray(shape_mask((W, H), [{"ellipse": p["paste"]["to"]}])
                                         .filter(ImageFilter.GaussianBlur(1))).astype(np.float32) / 255.0)
        rgb = rgb * (1 - m[..., None]) + pr * m[..., None]
        if p.get("alpha", "keep") == "rembg":
            if matte is None:
                from rembg import new_session, remove
                buf = io.BytesIO()
                patched.save(buf, "PNG")
                mm = remove(buf.getvalue(), session=new_session("isnet-anime"), only_mask=True, post_process_mask=True)
                matte = np.asarray(Image.open(io.BytesIO(mm)).convert("L")).astype(np.float32)
            g = p.get("alphaGrow", 0)  # px: the matte also replaces the old alpha this far past the mask
            big = [{"ellipse": [s_["ellipse"][0], s_["ellipse"][1], s_["ellipse"][2] + g, s_["ellipse"][3] + g]} if "ellipse" in s_ else s_
                   for s_ in p["mask"]]
            grow = np.asarray(pass_mask((W, H), {**p, "mask": big, "minus": [], "feather": p.get("feather", 4) + 4})).astype(np.float32) / 255.0
            a_new = matte
            key = np.clip((762.0 - pr.sum(axis=2)) / 24.0, 0, 1)
            if p.get("whiteKey"):
                # the pre-filled white where an object stood above the silhouette: the matte
                # leaves a faint halo there, so near-white inside the mask is background
                a_new = matte * key
            alpha = alpha * (1 - grow) + a_new * grow
            if p.get("whiteKey"):
                # and the soft edge of the grown region: an earlier fix's partial alpha over
                # white background would otherwise survive as a pale arc
                alpha = np.where(grow > 0.01, alpha * key, alpha)
    img = Image.fromarray(np.dstack([rgb, alpha]).clip(0, 255).round().astype(np.uint8), "RGBA")
    a = np.asarray(img.getchannel("A"))
    ys, xs = np.nonzero(a >= 8)
    left, top, right, bottom = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
    M = 16
    crop = (max(0, left - M), max(0, top - M), min(W, right + M), min(H, bottom + M))
    out = img.crop(crop)
    out.save(out_path, "PNG", optimize=True)
    print(json.dumps({"width": out.width, "height": out.height, "baselineY": bottom - crop[1], "cropBox": list(crop),
                      "contentBox": [left, top, right, bottom], "sourceWidth": W, "sourceHeight": H,
                      "model": "isnet-anime (installed cutout outside the fix masks)"}))


def ref(src, box, out):
    b = [int(v) for v in box.split(",")]
    im = flat(src).crop(b)
    s = max(im.size)
    sq = Image.new("RGB", (s, s), (255, 255, 255))
    sq.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    sq.resize((1024, 1024), Image.LANCZOS).save(out)
    print(json.dumps({"ref": out, "box": b}))


if __name__ == "__main__":
    cmd, *a = sys.argv[1:]
    {"prep": prep, "merge": merge, "finish": finish, "ref": ref}[cmd](*a)
