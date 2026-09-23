"""Living-portrait v3.2: finish the backs of the heads the yaw keys' source
paintings cut off, so no turn ends on a straight line.

Measured by the v3.1 check (critic/scratch/living-portrait-v3/out/straight-audit.txt):
turn-r45 had 669 px and turn-r85 843 px of perfectly straight vertical alpha
edge, turn-l85 141 px, and the profile's back hair stopped on a flat bottom
near y 845. The cause is the SOURCE paintings: `profile-left` (a cutout) and
`q34-right` (scaled to 0.885, painted rectangle x < 745, the rest an old
outpaint with a visible vertical join) both end at the right canvas border.
Mirrored (x -> 990 - x) for the right turns, that border lands at x ~ 156
inside the canvas, and the v3.1 48 px fade still read as a wall.

The fix paints the missing hair once, in the sources' own orientation (back
of the head to the RIGHT), on a canvas widened to 1024 px:

  prep   the key's head layers + the plate's pinned body over the BG, widened
         to 1024. A hand-placed back-of-head CONTOUR (a smooth closed curve,
         sized from the head: the frontal hair spans 712 px, so a 3/4 head ends
         about 890 and the profile about 905 in this orientation) is filled by
         mirroring the hair across `keepX`; the profile's flat bottom is
         mirrored downward into a band of tips. Mask = that new region, grown,
         plus a 24 px overlap back into the painting.
  (ComfyUI) node tools/gen/inpaint.mjs --latent --denoise 0.55-0.65: the model
         repaints the mirrored fill into strands that run along the contour.
  merge  alpha = the contour's own anti-aliased edge (the side) and isnet-anime
         (the bottom tips), crossfaded into the old layers over the overlap;
         written as extended back/front layers under art/v3/layers/heads/<key>/
         (the sources stay byte-identical).

    python -s tools/gen/rig-heads.py prep
    node tools/gen/inpaint.mjs --image <..>/heads/jobs/<key>.src.png --mask <..>.mask.png --latent ...
    python -s tools/gen/rig-heads.py merge --key profile-left --pick <full.png>
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

# v3.3: 1152 wide. A turned head is longer than the frontal is wide (nose to
# back of hair ~1.15-1.25 x the frontal hair's 712 px), so the back of the head
# runs past x 990: mirrored about the neck axis (x -> 990 - x) that is left of
# the canvas, so the right turns show no end of the head at all (v3.2's contour
# at x 894-908 came back as a near-vertical wall at x 82-95).
W, H = 1152, 1216
BG = np.array([0.03, 0.02, 0.03], np.float32) * 255
OUT = L.V3 / "layers/heads"
JOBS = OUT / "jobs"
OVERLAP = 24
TOP = 12  # rows at the top of the new hair rebuilt by reflection (v3.3)
REFLECT = 150  # px of the painted hair the prefill reflects (v3.3)

# keepX: the old painting is kept left of it and mirrored across it.
# contour: the back of the head, top to bottom, closed along the old paint.
# tips: [x0, x1, yCut, depth] the profile's flat bottom -> a band of tips.
# The contours start at y -120: from -20 the closed spline overshot down into
# rows 0-4 and left a 3-px strip of backdrop along the top of every turn (v3.3).
SOURCES = {
    "profile-left": {
        "keepX": 826,
        "contour": [[700, -120], [1120, -120], [1132, 200], [1122, 420], [1092, 600], [1046, 740], [996, 826], [940, 858], [700, 858]],
        "tips": [620, 1010, 830, 48],
    },
    "q34-right": {
        "keepX": 740,
        # the plate's side hair reaches the shoulders (y ~900); the key's bob stopped at y ~752 and left
        # the backdrop showing behind the neck at -40..-60 (v3.2 check), so the back hair runs to ~860
        "contour": [[640, -120], [1100, -120], [1112, 200], [1094, 420], [1058, 580], [1010, 700], [950, 790], [880, 846], [640, 846]],
        "tips": [640, 1000, 740, 120],
    },
}


def spline(points, n=24):
    """Closed Catmull-Rom through `points` (the curve the contour draws)."""
    P = np.asarray(points, np.float64)
    out = []
    for i in range(len(P)):
        p0, p1, p2, p3 = P[i - 1], P[i], P[(i + 1) % len(P)], P[(i + 2) % len(P)]
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    return np.asarray(out)


def contour_alpha(points, ss=4):
    """Anti-aliased 0..1 coverage of the closed contour (supersampled)."""
    pts = spline(points) * ss
    im = Image.new("L", (W * ss, H * ss), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=255)
    return np.asarray(im.resize((W, H), Image.BOX)).astype(np.float32) / 255.0


def placed(img, x, y):
    """`img` at (x, y) on the head canvas, clipped (a layer may carry a margin past the plate, rig-margins.py)."""
    c = np.zeros((H, W, 4), np.float32)
    h, w = img.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    c[y0:y1, x0:x1] = img[y0 - y: y1 - y, x0 - x: x1 - x]
    return c


def layer_from(meta):
    return L.load_rgba(L.ART / meta["file"]), int(meta["box"][0]), int(meta["box"][1])


def head_parts(key):
    v3 = L.read_json(L.ART / "rig.json")["artMeta"]["v3"]
    k = v3["keys"][key]
    return placed(*layer_from(k["back"])), placed(*layer_from(k["front"])), placed(*layer_from(v3["frontal"]["bodyTurned"]))


def composite(*layers):
    out = np.zeros((H, W, 3), np.float32) + BG
    for lay in layers:
        a = lay[..., 3:4] / 255.0
        out = out * (1 - a) + lay[..., :3] * a
    return out


def new_region(cfg):
    """The contour's new part (right of keepX) and the tips band, as 0..1 coverage."""
    side = contour_alpha(cfg["contour"])
    side[:, : cfg["keepX"]] = 0
    tips = np.zeros((H, W), np.float32)
    if cfg["tips"]:
        x0, x1, y0, depth = cfg["tips"]
        tips[y0 : y0 + depth, x0:x1] = 1.0
    return side, tips


def cmd_prep(a):
    JOBS.mkdir(parents=True, exist_ok=True)
    for key, cfg in SOURCES.items():
        if getattr(a, "key", None) and a.key != key:
            continue
        back, front, body = head_parts(key)
        head = composite(back, front)  # the head alone over the BG, for the mirror source
        comp = composite(back, body, front)
        kx = cfg["keepX"]
        side, tips = new_region(cfg)
        fill = comp.copy()
        # side: mirror the hair across keepX, row by row
        # v3.3: reflect back and forth inside the last REFLECT px of hair (a
        # single mirror across keepX reached back into the cheek and ear on the
        # wider canvas)
        xs = np.arange(kx, W)
        d = (xs - kx) % (2 * REFLECT)
        src = np.clip(kx - 1 - np.where(d < REFLECT, d, 2 * REFLECT - 1 - d), 0, W - 1)
        # blurred: only the hair's colour and light carry over, not a mirror
        # image of its strands (a sharp reflection came back as symmetric
        # helmet bands at the picked denoise)
        mirrored = np.stack([ndi.gaussian_filter(head[:, src, ch], 9) for ch in range(3)], -1)
        a = side[:, kx:, None]
        fill[:, kx:] = fill[:, kx:] * (1 - a) + mirrored * a
        if cfg["tips"]:
            x0, x1, y0, depth = cfg["tips"]
            ys = np.arange(y0, y0 + depth)
            srcy = np.clip(2 * y0 - 1 - ys, 0, H - 1)
            band = head[srcy, x0:x1]
            fill[y0 : y0 + depth, x0:x1] = band
        mask = L.dilate((side > 0.02) | (tips > 0), 10)
        mask[:, : kx - OVERLAP] = mask[:, : kx - OVERLAP] & (tips[:, : kx - OVERLAP] > 0)
        mask |= L.dilate(tips > 0, 10)
        mask &= ~(body[..., 3] > 250)
        Image.fromarray(np.clip(fill, 0, 255).astype(np.uint8)).save(JOBS / f"{key}.src.png")
        L.save_l(ndi.gaussian_filter(mask.astype(np.float32), 3), JOBS / f"{key}.mask.png")
        ov = fill.copy()
        ov[mask] = ov[mask] * 0.6 + L.MAGENTA * 0.4
        Image.fromarray(np.clip(ov, 0, 255).astype(np.uint8)).save(JOBS / f"{key}.mask-overlay.png")
        print(key, "mask px", int(mask.sum()))


def isnet(rgb):
    os.environ.setdefault("U2NET_HOME", r"D:\Tools\ComfyUI\rembg-models")
    from rembg import new_session, remove
    buf = io.BytesIO(); Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(buf, "PNG")
    out = Image.open(io.BytesIO(remove(buf.getvalue(), session=new_session("isnet-anime")))).convert("RGBA")
    return np.asarray(out)[..., 3].astype(np.float32) / 255.0


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def cmd_merge(a):
    key = a.key
    cfg = SOURCES[key]
    kx = cfg["keepX"]
    back, front, body = head_parts(key)
    pick = np.asarray(Image.open(a.pick).convert("RGB")).astype(np.float32)[:H, :W]
    side, tips = new_region(cfg)
    side_raw = side.copy()
    # the side's silhouette is the contour itself; the tips' is isnet's reading of the painted band
    tip_zone = L.dilate(tips > 0, 14)
    sil = isnet(pick)
    tip_alpha = np.where(tip_zone, sil, 0.0)
    # where the model left the contour unpainted (black), the silhouette follows its paint instead
    painted = (sil > 0.35) | (L.luminance(pick) > 0.12)
    painted = ndi.binary_fill_holes(ndi.binary_closing(painted, iterations=3))
    side = side * np.clip(ndi.gaussian_filter(painted.astype(np.float32), 0.8), 0, 1)
    xs = np.arange(W)[None, :]
    w_new = np.broadcast_to(smooth((xs - (kx - OVERLAP)) / OVERLAP), (H, W)).copy()
    out = {}
    for part, lay in (("back", back), ("front", front)):
        a_old = lay[..., 3] / 255.0
        a_side = np.maximum(side, a_old * (xs < kx))
        if part == "front":
            # the front keeps the new hair only above its own lowest row at keepX (the jaw split)
            rows = np.nonzero(a_old[:, kx - 4] > 0.5)[0]
            lim = rows.max() + 1 if len(rows) else 0
            a_side[lim:] = a_old[lim:] * (xs < kx)
            a_tip = np.zeros_like(tip_alpha)
        else:
            a_tip = tip_alpha
        a_new = np.maximum(a_side, a_tip)
        alpha = a_old * (1 - w_new) + a_new * w_new
        alpha = np.where(tip_zone & (part == "back"), np.maximum(alpha, a_tip), alpha)
        alpha = np.clip(alpha, 0, 1)
        # colour: the old painting left of the overlap, the model's inside the new region
        wc = np.where(alpha > 0, w_new, 0)
        wc = np.where(tip_zone, np.maximum(wc, (a_tip > 0.02).astype(np.float32)), wc)
        rgb = lay[..., :3] * (1 - wc[..., None]) + pick * wc[..., None]
        rgb = np.where((alpha > 0)[..., None], rgb, L.push_pull_fill(rgb, alpha > 0))
        arr = np.dstack([rgb, alpha * 255])
        # the model often leaves the top rows of the new hair dark, so the contour's hair reads as
        # backdrop there (a 3-4 px strip along the frame's top at every turn): those rows take the
        # reflection of the 12 rows under them, only where the contour is hair at the top
        top_hair = (side_raw[0] > 0.5) & (xs[0] >= kx - OVERLAP)
        fix = top_hair & (arr[TOP, :, 3] > 200)
        for r in range(TOP):
            arr[r, fix] = arr[2 * TOP - 1 - r, fix]
        ys, xs2 = np.nonzero(alpha > 0.002)
        x0, y0, x1, y1 = xs2.min(), ys.min(), xs2.max() + 1, ys.max() + 1
        dst = OUT / key / f"{part}.png"
        dst.parent.mkdir(parents=True, exist_ok=True)
        L.save_rgba(arr[y0:y1, x0:x1], dst)
        out[part] = {"file": L.rel(dst).split("prototype-v2/art/")[1], "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]}
    L.write_json({"key": key, "pick": L.rel(a.pick), "keepX": kx, "overlap": OVERLAP, "contour": cfg["contour"], "tips": cfg["tips"],
                  "matte": "side: the contour's anti-aliased edge x the painted hair; tips: isnet-anime on the pick inside the tips band",
                  "layers": out},
                 OUT / key / "provenance.json")
    comp = composite(placed(*layer_from(out["back"])), body, placed(*layer_from(out["front"])))
    Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8)).save(OUT / key / "check.png")
    print(key, out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    pp = sub.add_parser("prep")
    pp.add_argument("--key", choices=list(SOURCES))
    m = sub.add_parser("merge")
    m.add_argument("--key", required=True, choices=list(SOURCES))
    m.add_argument("--pick", required=True)
    a = ap.parse_args()
    {"prep": cmd_prep, "merge": cmd_merge}[a.cmd](a)
