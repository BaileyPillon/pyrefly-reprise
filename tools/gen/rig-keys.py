"""Silhouette-true head layers for the living-portrait yaw keys (v3).

A yaw key is drawn over the SAME pinned frontal body, so each key keeps only
its head: its own neck and collar are dropped (the frontal body's neck,
inpainted up under the jaw, shows there instead). The head splits in two:

  back   hair that hangs below the jaw line, beside and behind the neck
         (drawn UNDER the body, so the body's neck occludes it)
  front  face, jaw and the hair on the head above the jaw line, plus the
         braid (drawn OVER the body)

Silhouette: the key's own alpha when it is a cutout, else isnet-anime (rembg,
local weights) run on the key over grey. Classes front/back/drop come from
the same geodesic assignment as the frontal masks (rig-lib.py), seeded from
the key's measured landmarks (jaw, chin: art/landmarks/<key>.json) plus the
per-key cut spec (art/v3/masks/keys.json), so the jaw split snaps to the
jaw's ink line and the neck/collar split to the collar's.

    python -s tools/gen/rig-keys.py cut [--key q34-left]
    python -s tools/gen/rig-keys.py mirror      # profile-right from profile-left
"""
from __future__ import annotations

import argparse
import importlib.util
import io
import os
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)

SPEC = L.V3 / "masks/keys.json"
KEYS_OUT = L.V3 / "layers"
OVER = L.V3 / "overlays"


def isnet_silhouette(rgba):
    os.environ.setdefault("U2NET_HOME", r"D:\Tools\ComfyUI\rembg-models")
    from rembg import new_session, remove
    a = rgba[..., 3:4] / 255.0
    comp = rgba[..., :3] * a + 128 * (1 - a)
    buf = io.BytesIO(); Image.fromarray(comp.astype(np.uint8)).save(buf, "PNG")
    out = Image.open(io.BytesIO(remove(buf.getvalue(), session=new_session("isnet-anime")))).convert("RGBA")
    return (np.asarray(out)[..., 3] > 127) & (rgba[..., 3] > 0)


def cut_key(name, cfg):
    src = L.PROTO / "art" / cfg["file"]
    rgba = L.load_rgba(src)
    shape = rgba.shape[:2]
    if cfg.get("silhouette") == "isnet":
        sil = isnet_silhouette(rgba)
        how = "isnet-anime on the key over grey (the aligned key is a rectangle, not a cutout)"
    else:
        sil = rgba[..., 3] > 127
        how = "the key's own alpha (already a rembg cutout)"
    sil = ndi.binary_opening(sil, iterations=1)
    if cfg.get("clipEllipse"):
        # a key whose painting was cut by a straight canvas edge (profile-right
        # is profile-left mirrored, so its old right canvas edge now sits
        # inside the canvas): round the back of the head instead
        clip = L.ellipses_mask(shape, [cfg["clipEllipse"]])
        sil &= ndi.gaussian_filter(clip.astype(np.float32), 2.0) > 0.5
    band = cfg.get("snapBand", 12)
    jaw = cfg["jaw"]  # polyline across the canvas, left to right
    above = L.poly_mask(shape, [[[0, 0], [shape[1], 0]] + [list(p) for p in reversed(jaw)]])
    above |= L.poly_mask(shape, [[[0, 0]] + [list(p) for p in jaw] + [[shape[1], 0]]])
    neck = L.poly_mask(shape, [cfg["neck"]])
    col_line = cfg["collar"]  # polyline across the canvas: the key's own collar top
    below_collar = L.poly_mask(shape, [[list(p) for p in col_line] + [[shape[1], shape[0]], [0, shape[0]]]])
    drop = (neck & ~above) | below_collar
    seeds = np.full(shape, -1, np.int64)
    seeds[L.erode(above, band)] = 0
    seeds[L.erode(~above & ~drop, band)] = 1
    seeds[L.erode(drop, band)] = 2
    for b in cfg.get("frontBrushes", []):
        seeds[L.poly_mask(shape, [], [b])] = 0
    seeds[~sil] = -1
    lab = L.geodesic_labels(rgba, seeds, sil)
    lost = sil & (lab < 0)
    if lost.any():
        _, (iy, ix) = ndi.distance_transform_edt(lab < 0, return_indices=True)
        lab[lost] = lab[iy[lost], ix[lost]]
    out_dir = KEYS_OUT / name
    out_dir.mkdir(parents=True, exist_ok=True)
    meta = {"key": name, "source": L.rel(src), "silhouette": how, "spec": L.rel(SPEC), "layers": {}}
    rgb = rgba[..., :3]
    head = sil & (lab <= 1)
    for part, k in (("back", 1), ("front", 0)):
        mine = sil & (lab == k)
        a = mine.astype(np.float32)
        if part == "front":
            # the front's feather falls onto its own back hair only (same image
            # underneath, so the key composites to itself at rest)
            d = ndi.distance_transform_edt(~mine)
            ramp = (d > 0) & (d <= 4) & (lab == 1) & sil
            t = np.clip(1 - d / 5.0, 0, 1)
            a = np.where(ramp, t * t * (3 - 2 * t), a)
        else:
            # the back carries the whole head underneath the front, so a
            # front feather never shows the body through it
            a = head.astype(np.float32)
        col = np.where((a > 0)[..., None], rgb, L.push_pull_fill(rgb, a > 0))
        arr = np.dstack([col, a * 255])
        ys, xs = np.nonzero(a > 0)
        x0, y0, x1, y1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3
        x0, y0 = max(0, x0), max(0, y0)
        L.save_rgba(arr[y0:y1, x0:x1], out_dir / f"{part}.png")
        box = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]
        L.write_json({"layer": part, "box": box, "key": name, "drawn": "under the body" if part == "back" else "over the body"},
                     out_dir / f"{part}.json")
        meta["layers"][part] = {"file": L.rel(out_dir / f"{part}.png"), "box": box}
        full = np.zeros(rgba.shape, np.float32); full[y0:y1, x0:x1] = L.load_rgba(out_dir / f"{part}.png")
        Image.fromarray(np.clip(L.on_magenta(full), 0, 255).astype(np.uint8)).save(OVER / f"{name}-{part}.png")
    # class overlay for the 1:1 check
    col = {0: (255, 60, 60), 1: (255, 170, 0), 2: (40, 120, 255)}
    base = L.on_magenta(rgba * np.dstack([np.ones(shape + (3,)), sil[..., None]]))
    tint = base.copy()
    for k, c in col.items():
        tint[sil & (lab == k)] = base[sil & (lab == k)] * 0.55 + np.array(c) * 0.45
    e = np.zeros(shape, bool)
    e[:-1] |= lab[:-1] != lab[1:]; e[:, :-1] |= lab[:, :-1] != lab[:, 1:]
    tint[e & L.dilate(sil, 1)] = (255, 255, 255)
    Image.fromarray(np.clip(tint, 0, 255).astype(np.uint8)).save(OVER / f"{name}-classes.png")
    L.write_json(meta, out_dir / "key.json")
    print(name, {p: v["box"] for p, v in meta["layers"].items()})


def cmd_cut(a):
    spec = L.read_json(SPEC)
    for name, cfg in spec["keys"].items():
        if a.key and a.key != name:
            continue
        cut_key(name, cfg)


def cmd_mirror(_a):
    """profile-right = profile-left mirrored, then the identity markers fixed:
    the visible eye becomes her LEFT eye, which is blue (the plate: her right
    eye is green, her left is blue), so the iris is recoloured blue inside a
    measured iris mask, keeping every line and highlight of the painting."""
    spec = L.read_json(SPEC)["mirror"]
    src = L.PROTO / "art" / spec["from"]
    # mirror about the pinned body's neck axis (x = neckAxis), not the canvas
    # centre: the turned head must sit on the same neck from either side
    flipped = L.load_rgba(src)[:, ::-1]
    shift = int(round(2 * spec["neckAxis"] - (rgba_w := flipped.shape[1]) + 1))
    rgba = np.zeros_like(flipped)
    if shift >= 0:
        rgba[:, shift:] = flipped[:, :rgba_w - shift]
    else:
        rgba[:, :shift] = flipped[:, -shift:]
    out = L.PROTO / "art" / spec["to"]
    iris = L.ellipses_mask(rgba.shape[:2], [spec["irisEllipse"]])
    rgb = rgba[..., :3]
    mx = rgb.max(-1); mn = rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    green = iris & (rgb[..., 1] > rgb[..., 0] + 20) & (rgb[..., 1] >= rgb[..., 2] - 10) & (sat > 0.25)
    green = ndi.binary_closing(green, iterations=1) & iris
    # plate statistics: her blue iris vs her green iris, as a per-channel map
    plate = L.load_rgba(L.PLATE)[..., :3]
    own = np.load(L.V3 / "masks/owner.npy")
    Z = L.read_json(L.V3 / "masks/owners.json")["z"]
    g_ref = plate[own == Z.index("irisR")]
    b_ref = plate[own == Z.index("irisL")]
    lum = L.luminance(rgb)[..., None]
    # keep each pixel's own lightness, take the hue/chroma of the plate's blue iris
    g_l = L.luminance(g_ref).mean(); b_mean = b_ref.mean(0)
    b_l = L.luminance(b_ref[None])[0].mean()
    target = np.clip(b_mean[None, None] * (lum / max(b_l, 1e-3)), 0, 255)
    soft = ndi.gaussian_filter(green.astype(np.float32), 0.8)[..., None]
    new = rgb * (1 - soft) + target * soft
    rgba[..., :3] = new
    out.parent.mkdir(parents=True, exist_ok=True)
    L.save_rgba(rgba, out)
    L.write_json({"from": L.rel(src), "method": "horizontal mirror, then her visible eye (now her LEFT) recoloured from green to the plate's blue inside a measured iris mask (lines, pupil and highlights keep their own lightness)",
                  "irisEllipse": spec["irisEllipse"], "recolouredPixels": int(green.sum()),
                  "plateGreenIrisLum": round(float(g_l), 3), "plateBlueIrisMean": np.round(b_mean, 1).tolist(),
                  "markers": spec.get("markers", "")}, out.with_suffix(".json"))
    crop = spec["checkCrop"]
    both = np.concatenate([L.on_magenta(np.roll(flipped, shift, 1))[crop[1]:crop[3], crop[0]:crop[2]],
                           L.on_magenta(rgba)[crop[1]:crop[3], crop[0]:crop[2]]], 1)
    Image.fromarray(np.clip(both, 0, 255).astype(np.uint8)).resize((both.shape[1] * 3, both.shape[0] * 3), Image.NEAREST).save(OVER / "profile-right-iris-check.png")
    print("recoloured", int(green.sum()))


def cmd_replace(_a):
    """Re-place a yaw key whose first alignment measured the wrong chin:
    a similarity transform (uniform scale s about the key's neck/chin anchor)
    so its eye-to-chin height matches the plate's (eye line 414, chin 730:
    316 px) and its neck sits on the frontal body's neck (x 495)."""
    spec = L.read_json(SPEC)["replace"]
    for name, cfg in spec.items():
        src = L.PROTO / "art" / cfg["from"]
        rgba = L.load_rgba(src)
        s = cfg["plateEyeToChin"] / (cfg["chin"][1] - cfg["eyeY"])
        ax, ay = cfg["anchor"]; tx, ty = cfg["target"]
        h, w = rgba.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        sx, sy = (xx - tx) / s + ax, (yy - ty) / s + ay
        prem = rgba.copy(); prem[..., :3] *= prem[..., 3:4] / 255.0
        out = np.dstack([ndi.map_coordinates(prem[..., c], [sy, sx], order=1, mode="constant") for c in range(4)])
        a = out[..., 3:4]
        out[..., :3] = np.where(a > 0, out[..., :3] / np.maximum(a, 1e-3) * 255.0, 0)
        dst = L.PROTO / "art" / cfg["to"]
        L.save_rgba(out, dst)
        L.write_json({"from": L.rel(src), "scale": round(float(s), 4), "anchor": cfg["anchor"], "target": cfg["target"],
                      "measured": {"eyeY": cfg["eyeY"], "chin": cfg["chin"]}, "why": cfg["why"]}, dst.with_suffix(".json"))
        print(name, "scale", round(float(s), 4))


def cmd_outjob(_a):
    """Outpaint sources for keys whose painting stops at a straight crop edge
    (q34-left is a rectangle; q34-right's re-placed canvas edge): the key over
    grey, and a mask of everything outside the painted rectangle (+8 px in),
    for tools/gen/inpaint.mjs at full denoise (VAEEncodeForInpaint)."""
    spec = L.read_json(SPEC)["outpaint"]
    jobs = L.V3 / "jobs"
    for name, cfg in spec.items():
        rgba = L.load_rgba(L.PROTO / "art" / cfg["from"])
        x0, y0, x1, y1 = cfg["paintedRect"]
        inside = np.zeros(rgba.shape[:2], bool); inside[y0:y1, x0:x1] = True
        a = rgba[..., 3:4] / 255.0
        rgb = rgba[..., :3] * a + 118 * (1 - a)
        rgb = np.where(inside[..., None], rgb, L.push_pull_fill(rgb, inside & (rgba[..., 3] > 0)))
        Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(jobs / f"out-{name}.src.png")
        m = ~L.erode(inside, 8)
        L.save_l(np.clip(ndi.gaussian_filter(m.astype(np.float32), 3), 0, 1), jobs / f"out-{name}.mask.png")
        print(name, int(m.sum()))


def cmd_outmerge(a):
    """Keep the painted rectangle exactly; take the outpaint outside it (a
    6 px cross-fade inside the rectangle's edge); write the extended key."""
    cfg = L.read_json(SPEC)["outpaint"][a.key]
    rgba = L.load_rgba(L.PROTO / "art" / cfg["from"])
    out = L.load_rgba(a.pick)[..., :3]
    x0, y0, x1, y1 = cfg["paintedRect"]
    inside = np.zeros(rgba.shape[:2], bool); inside[y0:y1, x0:x1] = True
    # inside the rectangle, past the mask's own growth, the outpaint is only a
    # VAE round trip of the key: fade into it over 10-48 px so the new hair
    # meets the painted hair without a tone step at the old crop line
    d = ndi.distance_transform_edt(inside)
    w = np.clip((d - 10) / 38.0, 0, 1)
    w = (w * w * (3 - 2 * w))[..., None]
    rgb = rgba[..., :3] * w + out * (1 - w)
    dst = L.PROTO / "art" / cfg["to"]
    L.save_rgba(np.dstack([rgb, np.full(rgb.shape[:2], 255.0)]), dst)
    L.write_json({"from": cfg["from"], "outpaint": L.rel(a.pick), "paintedRect": cfg["paintedRect"],
                  "blend": "the painted rectangle is kept; outside it the outpaint, cross-fading (smoothstep) over 10-48 px inside the old crop line",
                  "silhouette": "cut afterwards with isnet-anime (rig-keys.py cut)"}, dst.with_suffix(".json"))
    print("wrote", L.rel(dst))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("cut"); c.add_argument("--key")
    sub.add_parser("mirror"); sub.add_parser("replace"); sub.add_parser("outjob")
    o = sub.add_parser("outmerge"); o.add_argument("--key", required=True); o.add_argument("--pick", required=True)
    a = ap.parse_args()
    {"cut": cmd_cut, "mirror": cmd_mirror, "replace": cmd_replace, "outjob": cmd_outjob, "outmerge": cmd_outmerge}[a.cmd](a)


if __name__ == "__main__":
    main()
