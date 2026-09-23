"""Art method r3, the last choker repair (P7; FFX-2 only, chapter 6 Leblanc). CPU only, no model.

    D:/Tools/sd-scripts/.venv/Scripts/python.exe docs/concepts/chapters/leblanc/r3-method/choker.py [--out p7]

(the defaults are the P7 settings; set OPENBLAS_NUM_THREADS=1 if numpy runs out of memory.)

Starts from p6/cast.p6.png and changes pixels only inside the p6 choker region
G = dilate(p6 choker M, 10) (the region the p6 merge owned), so the obi, knot and tassel
stay byte for byte. Inside G, bottom to top:
1. cast.r2.2's own pixels: the p6 band repaint and its Telea pre-fill are dropped.
2. The gap: r2.2's old choker (its atlas mask grown 2 px) where the new part does not
   cover it, plus the old underside SAM left out (choker-p7.json: the red lower edge and
   the pale lavender V patch), minus r2.2's neutral ink (L < 30, chroma < 12: hair,
   strap and halter line are not the choker and stay). --gap skin (P7) fills it by
   normalised convolution from r2.2's lit skin and the halter's white only (L > 85),
   so no grey is pulled out of the strap and no violet out of the choker (this is what
   made P6's pale smudge); --gap telea and --gap idle are the variants tried first.
3. The idle's choker: the idle atlas mask grown --dilate 1 px (its own ink outline comes
   with it), minus the idle's own neck skin that SAM's mask holds (--noSkin 2: tan
   b* > 4, a* < 15, and the halter's white L > 85, a* < 10; the pink shadow line under
   the studs stays), warped with the P6 landmarks (cast-landmarks-p6.json, piecewise
   affine) with NO Lab ring lock. --sampler 1x (P7) samples the warp once with Lanczos-4;
   the pilot's 2x canvas + INTER_AREA reduction blurs a 1 px ink line at 0.8x. Hard
   alpha: 1 inside the warped mask; on its outer 1 px ring 1 where the warped pixel is
   ink (L < 40) and 0.5 elsewhere (the only feather). --hairOver 1 would keep r2.2's
   black hair in front of the part's left end (tried; it left a blue fleck, so P7 is 0).
4. The strap bridge (--strap 1): the notch of fill left between the choker's right end
   (the idle's dark ring and strap line, warped) and r2.2's black strap is closed by
   extending those dark pixels (each takes the colour of the nearest one), not by
   generating.
Cast alpha is kept exactly. Outputs in D:/Tools/pyrefly-lora/leblanc/r3/<out>/:
<name>, mask.choker.png (the new part, undilated, for gates.py --p2),
choker.{M,P,band}.png and choker.meta.json (for gates.py --p3), gap.png, strap.png,
hair.png, choker.G.png, provenance.png, choker.json. Nothing under public/ is written.
"""
from __future__ import annotations

import argparse
import pathlib
import sys

import cv2
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import r3lib as R  # noqa: E402
import transplant as T  # noqa: E402


def k(r):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def dil(m, r):
    return cv2.dilate(m.astype(np.uint8), k(r)).astype(bool) if r > 0 else m.copy()


def ero(m, r):
    return cv2.erode(m.astype(np.uint8), k(r)).astype(bool) if r > 0 else m.copy()


def warp1x(src_rgba, src_mask, src_pts, dst_pts, shape, margin=40):
    """The same landmark warp as transplant.warp, sampled once at 1x with Lanczos-4 (no 2x canvas and no
    INTER_AREA reduction): at 0.8x the area reduction blurs a 1 px ink line into its neighbours, which is
    part of what lightened the 13 px choker. Premultiplied RGBA; the mask rides as a 5th channel."""
    H, W = shape
    d = np.asarray(dst_pts, np.float64)
    x0 = int(max(0, np.floor(d[:, 0].min() - margin))); x1 = int(min(W, np.ceil(d[:, 0].max() + margin)))
    y0 = int(max(0, np.floor(d[:, 1].min() - margin))); y1 = int(min(H, np.ceil(d[:, 1].max() + margin)))
    a = src_rgba[..., 3:4] / 255.0
    stack = np.concatenate([src_rgba[..., :3] * a, src_rgba[..., 3:4], src_mask[..., None].astype(np.float32) * 255], -1).astype(np.float32)
    xx, yy = np.meshgrid(np.arange(x0, x1, dtype=np.float64), np.arange(y0, y1, dtype=np.float64))
    sx, sy = T.backward_map(src_pts, dst_pts, xx, yy)
    mx, my = sx.astype(np.float32), sy.astype(np.float32)
    chans = [cv2.remap(stack[..., c], mx, my, cv2.INTER_LANCZOS4 if c < 4 else cv2.INTER_LINEAR,
                       borderMode=cv2.BORDER_CONSTANT, borderValue=0) for c in range(5)]
    out = np.zeros((H, W, 5), np.float32)
    out[y0:y1, x0:x1] = np.stack(chans, -1)
    alpha = np.clip(out[..., 3], 0, 255)
    rgb = np.where(alpha[..., None] > 1e-3, out[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-3), 0)
    return np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], -1), np.clip(out[..., 4] / 255.0, 0, 1)


def lum(rgb):
    return R.rgb2lab(rgb)[..., 0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="p7")
    ap.add_argument("--name", default="cast.p7.png")
    ap.add_argument("--base", default="p6/cast.p6.png")
    ap.add_argument("--region", default="p6", help="dir with the p6 choker M.png and meta (the region p6 owned)")
    ap.add_argument("--landmarks", default=str(HERE / "cast-landmarks-p6.json"))
    ap.add_argument("--dilate", type=int, default=1, help="px the idle choker mask grows before the warp (its own ink outline)")
    ap.add_argument("--gap", default="skin", choices=["idle", "telea", "skin"])
    ap.add_argument("--strap", type=int, default=1, help="close the notch between the right end and r2.2's strap with the nearest dark pixels")
    ap.add_argument("--oldGrow", type=int, default=2)
    ap.add_argument("--sampler", default="1x", choices=["2x", "1x"], help="2x = transplant.warp (the pilot's); 1x = one Lanczos-4 remap")
    ap.add_argument("--noSkin", type=int, default=2, help="drop the idle's own neck skin from the part mask (1: b* > 4, a* < 20, L > 35; 2: tan b* > 4, a* < 15 and the halter's white L > 85, a* < 10)")
    ap.add_argument("--hairOver", type=int, default=0, help="r2.2's black hair outside the old part stays in front of the new part")
    ap.add_argument("--poly", default=str(HERE / "choker-p7.json"), help="the old underside polygon (hand-placed); '' for none")
    a = ap.parse_args()
    out = R.SCR / a.out
    out.mkdir(parents=True, exist_ok=True)
    idle = R.load_rgba(R.IDLE)
    r22 = R.load_rgba(R.CAST)
    base = R.load_rgba(R.SCR / a.base)
    H, W = base.shape[:2]
    alpha = base[..., 3]
    fig = alpha > 0
    meta6 = R.read_json(R.SCR / a.region / "choker.meta.json")
    G = dil(R.load_mask(R.SCR / a.region / "choker.M.png"), meta6["grow"]) & fig

    spec = R.read_json(a.landmarks)
    ch = [p for p in spec["parts"] if p["name"] == "choker"][0]
    sm = R.load_mask(R.ATLAS / "idle.choker.png")
    smd = dil(sm, a.dilate)
    if a.noSkin:
        # SAM's idle choker mask holds some of the idle's shadowed neck skin (tan, under the jaw and under the
        # buckle) and the white of the halter between studs; on r2.2's lit neck that reads as a smear, so they are
        # left out of the part (the pink shadow line under the studs stays)
        li = R.rgb2lab(idle[..., :3])
        if a.noSkin == 1:
            skin = (li[..., 2] > 4) & (li[..., 1] < 20) & (li[..., 0] > 35)
        else:
            skin = ((li[..., 2] > 4) & (li[..., 1] < 15) & (li[..., 0] > 35)) | ((li[..., 0] > 85) & (li[..., 1] < 10))
        smd &= ~skin
    # the idle, whole, carried by the choker warp (no lock); the grown mask rides as the 5th channel
    wf = T.warp if a.sampler == "2x" else warp1x
    layer, prob = wf(idle, smd, ch["src"], ch["dst"], (H, W), margin=40)
    P = (prob > 0.5) & fig & G
    # the part proper (undilated) for the gates' median
    _, prob0 = wf(idle, sm, ch["src"], ch["dst"], (H, W), margin=40)
    P0 = (prob0 > 0.5) & fig & G

    # 1. r2.2 inside G
    work = base.copy()
    work[G] = r22[G]

    # 2. the gap: the old choker not covered by the new part; r2.2's hair and strap ink stay
    old = R.load_mask(R.ATLAS / "cast.choker.png")
    oldg = dil(old, a.oldGrow) & fig
    Lr = lum(r22[..., :3])
    lr = R.rgb2lab(r22[..., :3])
    # r2.2's neutral ink (hair, strap, halter line), even where SAM's old choker mask took some of it; the maroon
    # shading of the old V patch (a* > 12) is not ink and goes with the underside
    keep_dark = (Lr < 30) & (np.hypot(lr[..., 1], lr[..., 2]) < 12)
    under = np.zeros_like(oldg)
    if a.poly:
        poly = np.array(R.read_json(a.poly)["underside"], np.int32)
        u8 = np.zeros((H, W), np.uint8); cv2.fillPoly(u8, [poly], 1); under = u8.astype(bool) & fig
    gap = (oldg | under) & ~P & ~keep_dark & G
    Lw = lum(layer[..., :3])
    if a.gap == "idle":
        work[gap, :3] = layer[gap, :3]
    elif a.gap == "skin":
        # normalised convolution from r2.2's lit skin and the halter's white only (L > 85, outside the gap and the
        # new part): a smooth skin that cannot pull grey out of the strap or violet out of the choker
        src = (Lr > 85) & ~gap & ~P & fig
        w = cv2.GaussianBlur(src.astype(np.float32), (0, 0), 3.0)
        acc = cv2.GaussianBlur(r22[..., :3] * src[..., None], (0, 0), 3.0)
        fill = acc / np.maximum(w[..., None], 1e-4)
        for _ in range(3):  # pixels too far from any source take a wider kernel
            far = gap & (w < 0.02)
            if not far.any():
                break
            w2 = cv2.GaussianBlur(src.astype(np.float32), (0, 0), 8.0)
            acc2 = cv2.GaussianBlur(r22[..., :3] * src[..., None], (0, 0), 8.0)
            fill[far] = (acc2 / np.maximum(w2[..., None], 1e-4))[far]
        work[gap, :3] = fill[gap]
    else:
        a_c = r22[..., 3:4] / 255.0
        flat = (r22[..., :3] * a_c + 255 * (1 - a_c)).astype(np.uint8)
        # the fill takes skin from around the gap, not the choker (P) and not r2.2's dark hair and strap ink
        dark_near = (Lr < 85) & dil(gap, 3) & ~gap  # only lit skin and the halter's white feed the fill
        filled = cv2.inpaint(np.ascontiguousarray(flat[..., ::-1]), ((gap | P | dark_near) * 255).astype(np.uint8), 3, cv2.INPAINT_TELEA)[..., ::-1]
        work[gap, :3] = filled[gap].astype(np.float32)

    # 4. the idle's choker, hard edge; the outer 1 px ring is 0.5 unless it is ink
    ring = P & ~ero(P, 1)
    ink = Lw < 40
    fa = P.astype(np.float32)
    hair = np.zeros_like(P)
    if a.hairOver:
        hair = P & (Lr < 20) & ~old  # r2.2's black hair strands the new part reaches into stay in front of it
        fa[hair] = 0
    fa[ring & ~ink] = 0.5
    fa *= np.clip(layer[..., 3] / 255.0, 0, 1)
    work[..., :3] = work[..., :3] * (1 - fa[..., None]) + layer[..., :3] * fa[..., None]

    # 5. the strap bridge: at the choker's right end, the notch of fill left between the idle's own dark outline
    # (the buckle's ring and the strap line under it, warped) and r2.2's black strap is closed by extending
    # those dark pixels (each bridge pixel takes the colour of the nearest one), not by a generated fill
    strap = np.zeros_like(gap)
    if a.strap:
        xs = np.nonzero(P)[1]
        p_right = P & (np.arange(W)[None, :] >= np.percentile(xs, 88))
        D = keep_dark | (P & (Lw < 45))
        closed = cv2.morphologyEx(D.astype(np.uint8), cv2.MORPH_CLOSE, k(2)).astype(bool)
        strap = gap & closed & dil(p_right, 4)
        if strap.any():
            _, lab_ = cv2.distanceTransformWithLabels((~D).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
            dy, dx = np.nonzero(D)
            ly = np.zeros(lab_.max() + 1, np.int64); lx = np.zeros_like(ly)
            ly[lab_[dy, dx]] = dy; lx[lab_[dy, dx]] = dx
            sy, sx = np.nonzero(strap)
            work[sy, sx, :3] = work[ly[lab_[sy, sx]], lx[lab_[sy, sx]], :3]
    work[..., 3] = alpha
    work[~fig] = base[~fig]
    work[~G] = base[~G]

    R.save_rgba(work, out / a.name)
    R.save_l(P0, out / "mask.choker.png")
    R.save_l(P, out / "choker.Pd.png")
    M = P | gap
    band = G & ~ero(P, 1)
    R.save_l(M, out / "choker.M.png"); R.save_l(P, out / "choker.P.png"); R.save_l(band, out / "choker.band.png")
    R.save_l(gap, out / "gap.png"); R.save_l(strap, out / "strap.png"); R.save_l(hair, out / "hair.png"); R.save_l(G, out / "choker.G.png")
    R.write_json({"region": "choker", "grow": meta6["grow"], "box": meta6["box"], "src": a.base, "note": "p7: G = the p6 choker region"},
                 out / "choker.meta.json")
    prov = np.zeros((H, W, 4), np.float32)
    prov[..., :3] = 150; prov[..., 3] = fig * 255
    prov[G & fig] = [120, 120, 120, 255]
    prov[gap] = [60, 170, 240, 255] if a.gap == "idle" else [240, 170, 40, 255]
    prov[strap] = [60, 170, 240, 255]
    prov[P] = [60, 110, 240, 255]
    R.save_rgba(prov, out / "provenance.png")
    lab = R.rgb2lab(work[..., :3][P0 & (alpha > 200)]); li = R.rgb2lab(idle[..., :3][sm & (idle[..., 3] > 200)])
    rep = {"P": int(P.sum()), "P0": int(P0.sum()), "gap": int(gap.sum()), "strap": int(strap.sum()), "hairOver": int(hair.sum()), "G": int(G.sum()),
           "dilate": a.dilate, "sampler": a.sampler, "noSkin": a.noSkin, "gapFill": a.gap, "lock": "none", "medianCand": np.median(lab, 0).round(2).tolist(),
           "medianIdle": np.median(li, 0).round(2).tolist(),
           "medianDE2000": round(float(R.de2000(np.median(lab, 0), np.median(li, 0))), 2),
           "changedVsBase": int((np.abs(work - base).max(-1) > 0).sum()),
           "changedOutsideG": int(((np.abs(work - base).max(-1) > 0) & ~G).sum()),
           "alphaChanged": int((work[..., 3] != base[..., 3]).sum())}
    R.write_json(rep, out / "choker.json")
    print(rep)


if __name__ == "__main__":
    main()
