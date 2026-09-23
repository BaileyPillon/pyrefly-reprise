"""Living-portrait v3.2: mouth patches that change the mouth and nothing else.

The v3.1 check (critic/scratch/living-portrait-v3/out/z-mouth-plate-vs-smile-2x.png)
saw the smile at weight 0.99 as a lighter oval halo with a faint outline and a
ragged, cloud-shaped lower edge, with the plate's own right mouth corner still
showing beside the new mouth (a doubled corner). Root causes: the patch's
matte was the inpaint's own soft blob (not the mouth), its skin was painted
lighter than the plate's, and the matte did not reach the plate's corner.

Per patch (parted, smile, pressed):

  features  dark lines, lips and lip highlights, in the patch AND in the plate
            (the plate's old mouth must be covered too)
  matte     both feature sets grown 7 px, then blurred: a mouth-shaped matte,
            no oval, no cloud edge
  tone      frequency split: the patch keeps its own detail (patch minus its
            own low-passed skin) on the PLATE's low-passed skin, so the base
            tone under the matte is the plate's and there is nothing to halo

    python -s tools/gen/rig-mouth.py
Writes art/v3/patches/mouth2/<state>.png (the v3 patches stay as they were),
repoints rig.json and a 2x check sheet art/v3/patches/mouth2/check.png.
"""
from __future__ import annotations

import importlib.util
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)

OUT = L.V3 / "patches/mouth2"
GROW = 7
PAD = 14
SIGMA = 9.0


def features(rgb):
    from skimage import color
    hsv = color.rgb2hsv(np.clip(rgb / 255.0, 0, 1))
    h, s, v = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
    lum = L.luminance(rgb)
    dark = lum < 0.42
    # lips: redder than THIS face's skin (the plate's skin is itself pink, s ~ 0.4)
    s_skin = np.median(s[~dark])
    lips = (s > s_skin + 0.1) & ((h < 12) | (h > 330)) & (v > 0.45)
    shine = (v > 0.93) & (s < 0.12)
    f = dark | lips | shine
    return ndi.binary_opening(f, iterations=1) | dark


def lowpass(rgb, weight, sigma=SIGMA):
    """Normalised low-pass over `weight`; where too little of it is near, a wider one."""
    def lp(sg):
        w = ndi.gaussian_filter(weight.astype(np.float32), sg, mode="nearest")
        out = np.stack([ndi.gaussian_filter(rgb[..., c] * weight, sg, mode="nearest") for c in range(3)], -1)
        return out / np.maximum(w, 1e-6)[..., None], w
    near, w = lp(sigma)
    far, _ = lp(sigma * 4)
    k = np.clip(w / 0.15, 0, 1)[..., None]
    return near * k + far * (1 - k)


def build(state, meta, plate):
    raw = L.load_rgba(L.ART / meta["file"])
    # padded: the plate's own mouth line runs a few px past some v3 boxes (its right corner hook)
    patch = np.pad(raw, ((PAD, PAD), (PAD, PAD), (0, 0)))
    x, y = meta["box"][0] - PAD, meta["box"][1] - PAD
    h, w = patch.shape[:2]
    base = plate[y:y + h, x:x + w, :3]
    pa = patch[..., 3] / 255.0
    prgb = patch[..., :3] * pa[..., None] + base * (1 - pa[..., None])  # the patch as it lands on the plate
    # only MOUTH features, in both: components that reach the middle of the box
    # (not the patch's stray corner strokes, not the plate's jaw line or hair)
    yy, xx = np.mgrid[:h, :w]
    core = ((xx - w / 2) / (0.4 * w)) ** 2 + ((yy - h / 2) / (0.36 * h)) ** 2 < 1

    def mouth_only(f):
        lab, _ = ndi.label(f)
        keep = np.unique(lab[core & f])
        return np.isin(lab, keep[keep > 0])

    fp = mouth_only(features(prgb) & (pa > 0.5))
    # the plate: every mark inside the box except what runs off its bottom edge
    # (the jaw line); the mouth line and its corner dimple are all covered
    fq_all = features(base)
    lab, _ = ndi.label(fq_all)
    border = np.unique(lab[-1])  # the jaw line runs off the bottom; the mouth line may touch a side
    fq = fq_all & ~np.isin(lab, border[border > 0])
    # ... and only near the plate's mouth line (its biggest dark stroke), so the nostrils stay
    dark_lab, n = ndi.label(fq & (L.luminance(base) < 0.42))
    if n:
        sizes = ndi.sum(np.ones_like(dark_lab), dark_lab, range(1, n + 1))
        zone = L.dilate(dark_lab == 1 + int(np.argmax(sizes)), 16)
        lab2, _ = ndi.label(fq)
        keep = np.unique(lab2[zone & fq])
        fq = np.isin(lab2, keep[keep > 0])
    feat = fp | fq
    m = L.dilate(feat, GROW)
    matte = np.clip(ndi.gaussian_filter(m.astype(np.float32), 2.5), 0, 1)
    # past what the patch painted only to erase the plate's own old mouth (with plate skin)
    outside = (pa < 0.02) & ~L.dilate(fq, GROW + 3)
    matte[outside] = 0
    skin_p = ~L.dilate(fp, 2)
    skin_q = ~L.dilate(fq, 2)
    detail = prgb - lowpass(prgb, skin_p)
    tone = lowpass(base, skin_q)
    # the patch brings its features; on its skin only a trace of its own texture
    near_fp = np.clip(ndi.gaussian_filter(L.dilate(fp, 3).astype(np.float32), 1.5), 0, 1)[..., None]
    detail = detail * near_fp + np.clip(detail, -4, 4) * (1 - near_fp)
    out = np.clip(tone + detail, 0, 255)
    # where the patch has skin over the plate's old mouth, the plate's skin tone alone
    old = fq & ~L.dilate(fp, 1)
    out[old] = tone[old] + np.clip(detail[old], -6, 6)
    out[pa < 0.02] = tone[pa < 0.02]
    arr = np.dstack([out, matte * 255])
    dst = OUT / f"{state}.png"
    L.save_rgba(arr, dst)
    return {"file": L.rel(dst).split("prototype-v2/art/")[1], "box": [int(x), int(y), int(w), int(h)]}, base, out, matte


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rig = L.read_json(L.ART / "rig.json")
    mouth = rig["artMeta"]["v3"]["patches"]["mouth"]
    plate = L.load_rgba(L.ART / "rest-composite.png")
    rows = []
    for state, meta in list(mouth.items()):
        src = dict(meta)
        if "mouth2/" in src["file"]:
            # re-run: start again from the v3 patch and its own box
            src["file"] = src["file"].replace("mouth2/", "mouth/")
            src["box"] = [src["box"][0] + PAD, src["box"][1] + PAD, src["box"][2] - 2 * PAD, src["box"][3] - 2 * PAD]
        new, base, out, matte = build(state, src, plate)
        mouth[state] = new
        comp = base * (1 - matte[..., None]) + out * matte[..., None]
        rows.append(np.concatenate([base, comp], 1))
        print(state, new["box"], "matte px", int((matte > 0.5).sum()))
    wmax = max(r.shape[1] for r in rows)
    sheet = np.concatenate([np.pad(r, ((0, 4), (0, wmax - r.shape[1]), (0, 0))) for r in rows], 0)
    Image.fromarray(np.clip(sheet, 0, 255).astype(np.uint8)).resize((sheet.shape[1] * 2, sheet.shape[0] * 2), Image.NEAREST).save(OUT / "check.png")
    L.write_json(rig, L.ART / "rig.json")


if __name__ == "__main__":
    main()
