"""Art method r3 pilot, P5 (FFX-2 only, chapter 6 Leblanc): the automatic gates, before any judge.

    D:/Tools/ComfyUI/python_embeded/python.exe -s docs/concepts/chapters/leblanc/r3-method/gates.py \
        --cast p3/cast.p3.png --p2 p2-matched --p3 p3 --hurt hurt.b.png --bake p4v2 --out gates.json

Cast (METHOD-CHECK step 2.7 and pass rule 2):
- MAD outside mask + band against cast.r2.2 (must be 0), and alpha unchanged.
- Per region (obi band + knot, tassel, choker = the pasted parts): CIEDE2000 between the
  region's Lab median and the idle part's median (bar 3).
- Seam gradient: mean colour gradient on the seam ring (2 px either side of the pasted part's
  edge) over the mean on a ring 12 px outside (10 to 14 px); bar 1.5.
- Invented-colour share, within the region (the pasted parts + the removed old parts + the
  repaint band); bar 1 %. Measured as the proposal measured the 4.7 % that METHOD-CHECK quotes:
  dE76 > 10 from all of 2,000 sampled idle colours (the first gates run used CIEDE2000 against
  every idle colour, which gave 0.0 % even for the whole cast.r2.2: too lenient to tell).
- Cut-out margins (16 px) and one fan (connected dark fan components are not counted by
  machine; the fan pixels are unchanged from cast.r2.2 by the MAD gate).
Hurt (b) (pass rule 3): idle share (grey + blue in the provenance map) >= 90 %, head chord
100 +/- 2 % of idle's (sqrt of the carried SAM head mask's area, and its width across the
head's own axis), standing height >= 95 %, 16 px margins, baselineY and scale 1.0.
Also writes the provenance maps (grey unchanged, blue idle pixels warped, amber fill,
magenta generated) for both files. Nothing under public/ is written.
"""
from __future__ import annotations

import argparse
import math
import pathlib
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import r3lib as R  # noqa: E402


def dil(m, r):
    return ndi.distance_transform_edt(~m) <= r if r > 0 else m.copy()


def ero(m, r):
    return ndi.distance_transform_edt(m) > r if r > 0 else m.copy()


def grad(rgb):
    lab = R.rgb2lab(rgb)
    gy, gx = np.gradient(lab, axis=(0, 1))
    return np.sqrt((gx ** 2).sum(-1) + (gy ** 2).sum(-1))


class Sampled:
    """The proposal's measure (proposal-change-the-question.md section 2.1): a pixel is invented when its
    colour is more than dE 10 (CIE76 Lab) from every one of 2,000 sampled idle colours (seed 7)."""

    def __init__(self, rgba, n=2000, seed=7):
        px = rgba[..., :3][rgba[..., 3] > 200]
        rng = np.random.default_rng(seed)
        self.lab = R.rgb2lab(px[rng.choice(len(px), n, replace=False)].astype(np.float64))
        self.tree = cKDTree(self.lab)

    def invented(self, rgb_px, thr=10.0):
        d, _ = self.tree.query(R.rgb2lab(rgb_px.astype(np.float64)), k=1)
        return d > thr, d

    def share_sampled(self, rgba, n=6000, seed=11):
        px = rgba[..., :3][rgba[..., 3] > 200]
        rng = np.random.default_rng(seed)
        return float(self.invented(px[rng.choice(len(px), min(n, len(px)), replace=False)])[0].mean())


class Palette:
    """Every idle colour (opaque pixels), for 'more than dE 10 from every idle colour'."""

    def __init__(self, rgba):
        px = rgba[..., :3][rgba[..., 3] > 200].astype(np.uint8)
        u = np.unique(px, axis=0)
        self.lab = R.rgb2lab(u.astype(np.float64))
        self.tree = cKDTree(self.lab)

    def invented(self, rgb_px, thr=10.0, k=16):
        lab = R.rgb2lab(rgb_px.astype(np.float64))
        d76, idx = self.tree.query(lab, k=k)
        best = np.full(len(lab), np.inf)
        for j in range(k):
            best = np.minimum(best, R.de2000(lab, self.lab[idx[:, j]]))
        # dE76 >= dE2000 in practice for these colours; a pixel whose 16 nearest by dE76 all miss is far
        return best > thr, best


def median_de(a_rgba, am, b_rgba, bm):
    la = R.rgb2lab(a_rgba[..., :3][am & (a_rgba[..., 3] > 200)])
    lb = R.rgb2lab(b_rgba[..., :3][bm & (b_rgba[..., 3] > 200)])
    ma, mb = np.median(la, 0), np.median(lb, 0)
    return float(R.de2000(ma, mb)), ma.round(2).tolist(), mb.round(2).tolist()


def margins(rgba):
    ys, xs = np.nonzero(rgba[..., 3] > 8)
    H, W = rgba.shape[:2]
    return {"left": int(xs.min()), "top": int(ys.min()), "right": int(W - 1 - xs.max()), "bottom": int(H - 1 - ys.max())}


def gate_cast(a, pal, idle, out):
    r22 = R.load_rgba(R.CAST)
    # MAD and alpha are measured against --base (default cast.r2.2; P7: p6/cast.p6.png, whose obi must stay exact)
    base = R.load_rgba(R.SCR / a.base) if a.base else r22
    regions = tuple(a.regions.split(","))
    cand = R.load_rgba(R.SCR / a.cast)
    p2 = R.SCR / a.p2; p3 = R.SCR / a.p3
    res = {"file": a.cast, "base": a.base or "cast.r2.2.png", "regionsChecked": list(regions)}
    grown = np.zeros(base.shape[:2], bool); M_all = np.zeros_like(grown); P_all = np.zeros_like(grown); band_all = np.zeros_like(grown)
    for region in regions:
        meta = R.read_json(p3 / f"{region}.meta.json")
        M = R.load_mask(p3 / f"{region}.M.png"); P = R.load_mask(p3 / f"{region}.P.png"); band = R.load_mask(p3 / f"{region}.band.png")
        grown |= dil(M, meta["grow"]); M_all |= M; P_all |= P; band_all |= band
    outside = ~(M_all | band_all | P_all)
    diff = np.abs(cand - base)
    res["madOutside"] = float(diff[outside].mean())
    res["maxOutside"] = float(diff[outside].max())
    res["alphaChanged"] = int((cand[..., 3] != base[..., 3]).sum())
    parts = {"obi": ("obi", ["idle.obi", "idle.knot"]), "tassel": ("tassel", ["idle.tassel"]), "choker": ("choker", ["idle.choker"])}
    res["regions"] = {}
    for name, (pm, srcs) in parts.items():
        if name not in a.parts.split(","):
            continue
        P = R.load_mask(p2 / f"mask.{pm}.png")
        S = np.zeros(idle.shape[:2], bool)
        for s in srcs:
            S |= R.load_mask(R.ATLAS / f"{s}.png")
        de, mc, mi = median_de(cand, P, idle, S)
        de22 = None
        # the same part in cast.r2.2 (its own atlas masks) for comparison
        old = {"obi": ["cast.obi", "cast.knot"], "tassel": ["cast.tassel", "cast.tassel2"], "choker": ["cast.choker"]}[name]
        O = np.zeros(base.shape[:2], bool)
        for s in old:
            O |= R.load_mask(R.ATLAS / f"{s}.png")
        de22, _, _ = median_de(r22, O, idle, S)
        g = grad(cand[..., :3])
        edge = dil(P, 2) & ~ero(P, 2) & (cand[..., 3] > 200)
        far = dil(P, 14) & ~dil(P, 10) & (cand[..., 3] > 200)
        ratio = float(g[edge].mean() / max(g[far].mean(), 1e-6))
        g22 = grad(r22[..., :3])
        # the idle's own ratio for the same part: its ink outline makes the edge ring busy by design
        gi = grad(idle[..., :3])
        ei = dil(S, 2) & ~ero(S, 2) & (idle[..., 3] > 200); fi = dil(S, 14) & ~dil(S, 10) & (idle[..., 3] > 200)
        idle_ratio = float(gi[ei].mean() / max(gi[fi].mean(), 1e-6))
        core = ero(P, 2)
        de_core, _, _ = median_de(cand, core, idle, ero(S, 2))
        res["regions"][name] = {"medianDE2000": round(de, 2), "medianCand": mc, "medianIdle": mi, "r22MedianDE2000": round(de22, 2),
                                "seamRatio": round(ratio, 3), "seamRatioSameRingOnR22": round(float(g22[edge].mean() / max(g22[far].mean(), 1e-6)), 3),
                                "seamRatioIdleOwnPart": round(idle_ratio, 3), "medianDE2000Core2px": round(de_core, 2)}
    sp = Sampled(idle)
    res["invented"] = {"measure": "dE76 > 10 from all of 2,000 sampled idle colours (the proposal's; 6,000 sampled px for whole files)",
                       "idleVsItself": round(sp.share_sampled(idle), 4), "wholeR22": round(sp.share_sampled(r22), 4),
                       "wholeCand": round(sp.share_sampled(cand), 4)}
    reg = (M_all | band_all) & (cand[..., 3] > 200)
    for name, m in (("region", reg),) + tuple((n, (R.load_mask(p3 / f"{n}.M.png") | R.load_mask(p3 / f"{n}.band.png")) & (cand[..., 3] > 200)) for n in regions):
        iv, _ = sp.invented(cand[..., :3][m]); iv22, _ = sp.invented(r22[..., :3][m])
        ivs, _ = pal.invented(cand[..., :3][m])
        res["invented"][name] = {"px": int(m.sum()), "cand": round(float(iv.mean()), 4), "r22SamePx": round(float(iv22.mean()), 4),
                                 "candDE2000vsEveryIdleColour": round(float(ivs.mean()), 4)}
    # noise floor for small parts: a 2,000-colour sample holds only ~20 colours of a part that is 1 % of the idle,
    # so the idle's own obi, knot, tassel and choker are measured against the same sample
    own = np.zeros(idle.shape[:2], bool)
    for n in ("idle.obi", "idle.knot", "idle.tassel", "idle.choker"):
        own |= R.load_mask(R.ATLAS / f"{n}.png")
    own &= idle[..., 3] > 200
    res["invented"]["idleOwnPartsFloor"] = round(float(sp.invented(idle[..., :3][own])[0].mean()), 4)
    # and against every idle colour (dE76), which has no sampling floor
    allp = cKDTree(R.rgb2lab(np.unique(idle[..., :3][idle[..., 3] > 200].astype(np.uint8), axis=0).astype(np.float64)))
    for name in ("region",) + regions:
        m = reg if name == "region" else (R.load_mask(p3 / f"{name}.M.png") | R.load_mask(p3 / f"{name}.band.png")) & (cand[..., 3] > 200)
        d, _ = allp.query(R.rgb2lab(cand[..., :3][m].astype(np.float64)), k=1)
        d22, _ = allp.query(R.rgb2lab(r22[..., :3][m].astype(np.float64)), k=1)
        res["invented"][name]["candDE76vsEveryIdleColour"] = round(float((d > 10).mean()), 4)
        res["invented"][name]["r22DE76vsEveryIdleColour"] = round(float((d22 > 10).mean()), 4)
    res["inventedShareRegion"] = res["invented"]["region"]["cand"]
    res["margins"] = margins(cand)
    # provenance: grey = cast.r2.2 unchanged, blue = idle pixels warped (the re-pasted interior), magenta = generated band
    prov = np.zeros_like(cand); prov[..., 3] = (cand[..., 3] > 8) * 255
    prov[..., :3] = 150
    interior = np.zeros_like(grown)
    for region in regions:
        interior |= ero(R.load_mask(p3 / f"{region}.P.png"), a.repaste)
    changed = (np.abs(cand[..., :3] - base[..., :3]).max(-1) > 0) & grown
    prov[band_all & changed] = [230, 40, 200, 255]
    prov[interior] = [60, 110, 240, 255]
    prov[cand[..., 3] <= 8] = 0
    R.save_rgba(prov, out / "provenance-cast.png")
    op = cand[..., 3] > 8
    # where the flagged pixels are: the model's band pixels, or the idle's own transplanted pixels
    genm = band_all & changed & ~interior & (cand[..., 3] > 200)
    intm = interior & (cand[..., 3] > 200)
    res["invented"]["bandOnly"] = {"px": int(genm.sum()), "cand": round(float(sp.invented(cand[..., :3][genm])[0].mean()), 4)}
    res["invented"]["transplantInteriorOnly"] = {"px": int(intm.sum()), "cand": round(float(sp.invented(cand[..., :3][intm])[0].mean()), 4)}
    res["provenance"] = {"grey": round(float((op & ~(band_all & changed) & ~interior).sum() / op.sum()), 4),
                         "blue": round(float((op & interior).sum() / op.sum()), 4),
                         "magenta": round(float((op & band_all & changed & ~interior).sum() / op.sum()), 4)}
    return res


def head_axis_width(m):
    ys, xs = np.nonzero(m)
    c = np.stack([xs - xs.mean(), ys - ys.mean()], 1)
    w, v = np.linalg.eigh(np.cov(c.T))
    proj = c @ v  # columns: minor, major axis
    return float(np.ptp(proj[:, 0])), float(np.ptp(proj[:, 1]))


def gate_hurt(a, idle, out):
    bake_dir = R.SCR / a.bake
    hb = R.load_rgba(R.SCR / a.hurt)
    bake = R.load_rgba(bake_dir / "bake.png")
    bj = R.read_json(bake_dir / "bake.json")
    res = {"file": a.hurt, "canvas": bj["canvas"], "baselineY": bj["baselineY"], "scale": 1.0}
    op = hb[..., 3] > 127
    holes = R.load_mask(bake_dir / "holes.png")
    gen = np.zeros_like(op)
    for n in a.hurtMasks.split(","):
        f = R.SCR / n
        if f.exists():
            gen |= R.load_mask(f)
    changed_by_model = (np.abs(hb[..., :3] - bake[..., :3]).max(-1) > 0) & gen
    prov_b = R.load_rgba(bake_dir / "provenance.png")
    grey = (prov_b[..., 0] == 150) & (prov_b[..., 3] > 0)
    blue = (prov_b[..., 0] == 60) & (prov_b[..., 3] > 0)
    magenta = changed_by_model | (holes & gen)
    amber = holes & ~magenta
    prov = np.zeros_like(hb)
    prov[grey & op] = [150, 150, 150, 255]; prov[blue & op] = [60, 110, 240, 255]
    prov[amber & op] = [240, 170, 40, 255]; prov[magenta & op] = [230, 40, 200, 255]
    R.save_rgba(prov, out / "provenance-hurt.png")
    res["provenance"] = {k: round(float((m & op).sum() / op.sum()), 4) for k, m in
                         (("grey", grey & ~magenta & ~amber), ("blue", blue & ~magenta & ~amber), ("amber", amber), ("magenta", magenta))}
    res["idleShare"] = round(res["provenance"]["grey"] + res["provenance"]["blue"], 4)
    hi = R.load_mask(bake_dir / "head-idle.png"); hh = R.load_mask(bake_dir / "head.png")
    res["headChordArea"] = round(math.sqrt(hh.sum() / hi.sum()), 4)
    wi, wh = head_axis_width(hi), head_axis_width(hh)
    res["headChordAxis"] = [round(wh[0] / wi[0], 4), round(wh[1] / wi[1], 4)]
    res["heightRatio"] = bj["heightRatio"]
    res["margins"] = margins(hb)
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cast", default="p3/cast.p3.png")
    ap.add_argument("--p2", default="p2-matched")
    ap.add_argument("--p3", default="p3")
    ap.add_argument("--hurt", default="hurt.b.png")
    ap.add_argument("--bake", default="p4v2")
    ap.add_argument("--hurtMasks", default="p4r/holes3.band.png,p4r/winceA.band.png")
    ap.add_argument("--out", default="gates")
    ap.add_argument("--repaste", type=int, default=4, help="the merge's interior re-paste erosion (P3: 4, P6: 1, P7: 0)")
    ap.add_argument("--base", default="", help="the file MAD and alpha are measured against (default cast.r2.2; P7: p6/cast.p6.png)")
    ap.add_argument("--regions", default="obi,choker", help="the p3-style regions whose M/band bound the change (P7: choker)")
    ap.add_argument("--parts", default="obi,tassel,choker", help="the parts whose colour and seam are measured (P7: choker)")
    ap.add_argument("--skipHurt", type=int, default=0)
    a = ap.parse_args()
    out = R.SCR / a.out; out.mkdir(parents=True, exist_ok=True)
    idle = R.load_rgba(R.IDLE)
    pal = Palette(idle)
    rep = {"cast": gate_cast(a, pal, idle, out)}
    if not a.skipHurt:
        rep["hurt"] = gate_hurt(a, idle, out)
    c = rep["cast"]
    rep["verdicts"] = {
        "cast.madOutside0": c["madOutside"] == 0 and c["alphaChanged"] == 0,
        "cast.obiChokerDE<=3": all(c["regions"][k]["medianDE2000"] <= 3 for k in ("obi", "choker") if k in c["regions"]),
        "cast.seam<=1.5": all(v["seamRatio"] <= 1.5 for v in c["regions"].values()),
        "cast.invented<=1%": c["inventedShareRegion"] <= 0.01,
        "cast.margins16": min(c["margins"].values()) >= 16,
    }
    if "tassel" in c["regions"]:
        rep["verdicts"]["cast.tasselDE<=3"] = c["regions"]["tassel"]["medianDE2000"] <= 3
    if "hurt" in rep:
        rep["verdicts"].update({
            "hurt.idleShare>=90%": rep["hurt"]["idleShare"] >= 0.90,
            "hurt.headChord100+-2": abs(rep["hurt"]["headChordArea"] - 1) <= 0.02,
            "hurt.height>=95%": rep["hurt"]["heightRatio"] >= 0.95,
            "hurt.margins16": min(rep["hurt"]["margins"].values()) >= 16,
        })
    R.write_json(rep, out / "gates.json")
    import json
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
