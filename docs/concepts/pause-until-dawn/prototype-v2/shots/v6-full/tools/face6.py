"""Living portrait v6 full (both; the rigged plate is Yuna X-2): the pilot's rig carried to every turn key.

The method (docs/plans/living-portrait-v6-method.md, "Per key") pushes the face parts through each key's map back
to the plate. Every grown key already has that map (`cmap.npy`, key px -> plate px, chain_grow.py) and its eyes,
brows and mouth were never repainted (v5.1's protect mask), so the pushed face IS the plate's face. Here the whole
face is rendered once on the plate by the pilot's rig (rig6.py, feel A2) and sampled through the key's map:

    face_K(x) = front_w(cmap_K(x))           inside M_K = M(cmap_K(x)), a fixed soft mask per key
    front_K(x) = M_K face_K(x) + (1 - M_K) key.front(x)

front_w is the plate's FRONT layer (neck, headCore, eyes, lids, hairFront, strands; the tassel is its own layer
in the runtime) at the weights w. M is where any weight can change the plate (the support of every stage), grown
and feathered, so at the mask's edge both terms are the same painting (the plate, resampled once or through the
chain). The gaze offset, the lid curves and every warp field are therefore pushed by the key's own map, and the
far eye foreshortens by itself (the Jacobian of cmap). Nothing is cross-faded between two paintings.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY face6.py prep        # WORK/support.npy, the frontal key's back/front PNGs, the rest check (WORK/rest6.json)
"""
import json
import os
import pathlib
import sys

import cv2
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
PILOT = HERE.parents[1] / "v6-pilot" / "tools"
sys.path.insert(0, str(PILOT))
import common as C  # noqa: E402  (the pilot's paths and helpers; LP6_WORK points at this build's work folder)
import rig6  # noqa: E402

KEYS_DIR = pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v51/keys")
PROTO = pathlib.Path(os.environ.get("LP6_PROTO", "D:/Tools/pyrefly-scratch/picks0925/portrait-a2/proto"))
KEY_IDS = ["v5-l40", "v5-l30", "v5-l20", "v5-l10", "frontal", "v5-r10", "v5-r20", "v5-r30", "v5-r40"]
GROW, FEATHER = 6, 6  # px: the support mask is grown, then eased out over this many px
THRESH = 2.0 / 255     # a change under 2 levels (the lattices' sub-0.1 px tails on the jaw line) is not support
CLOSE = 21             # px: the support is closed and its holes filled (one region per feature, no blotches)
# the support is found by rendering these extremes (each alone and together) and every gaze corner
EXTREMES = [{"smile": 1.2, "open": 1.0}, {"press": 1.0}, {"browRaise": 1.0}, {"browDraw": 1.0}, {"slight": 1.0},
            {"lidR": 0.0, "lidL": 0.0}, {"lidR": 0.5, "lidL": 0.5, "droop": 6.4}, {"lidR": 0.97, "lidL": 0.97, "droop": 6.4},
            {"smile": 1.2, "open": 1.0, "browRaise": 1.0, "lidR": 0.9, "lidL": 0.9}]
GAZE = [(gx, gy) for gx in (-16, -8, 0, 8, 16) for gy in (-8, 0, 8)]


class FrontRig(rig6.Rig):
    """rig6 with the runtime's layer split: `render` returns the plate's FRONT layer only (the neck under the head,
    no hair-back, no body, no tassel), which is what every key's `front.png` holds."""

    def __init__(self):
        super().__init__()
        P = lambda n: C.placed(C.load_rgba(self.layers[n]["file"]), self.layers[n]["box"])
        self.below = P("neck")
        top = P("hairFront")
        for n in ("strand1", "strand2"):
            top = C.over(P(n), top)
        self.top = top
        self.static = C.over(self.top, C.over(self.ap, C.over(self.iris, C.over(self.hc, self.below))))

    def hairback(self):
        return C.placed(C.load_rgba(self.layers["hairBack"]["file"]), self.layers["hairBack"]["box"])


def rig_json():
    return json.loads((PROTO / "art" / "rig-v6.json").read_text(encoding="utf-8")) if (PROTO / "art" / "rig-v6.json").exists() else C.rig()


def key_front(k):
    """(straight RGBA 0..1 on the full canvas, the file's box) of key k's front as the runtime loads it."""
    if k == "frontal":  # this build's own composite (prep)
        v3 = {"file": PROTO / "art" / "v6" / "frontal" / "front.png", "box": [0, 0]}
    else:
        v3 = C.rig()["artMeta"]["v3"]["keys"][k]["front"]
    im = np.asarray(Image.open(C.PROTO_ART / v3["file"]).convert("RGBA")).astype(np.float32) / 255.0
    c = np.zeros((C.H, C.W, 4), np.float32)
    x, y = v3["box"][:2]
    c[y:y + im.shape[0], x:x + im.shape[1]] = im
    return c


def cmap(k):
    if k == "frontal":
        yy, xx = np.mgrid[0:C.H, 0:C.W].astype(np.float32)
        return np.dstack([xx, yy])
    return np.load(KEYS_DIR / k / "cmap.npy")


def support(R):
    """Plate px any weight can change (front layer), from the extremes and every gaze corner."""
    base = R.render({})
    s = np.zeros((C.H, C.W), bool)
    for p in EXTREMES:
        s |= np.abs(R.render(p) - base).max(-1) > THRESH
    for gx, gy in GAZE:
        s |= np.abs(R.render({"gazeX": gx, "gazeY": gy}) - base).max(-1) > THRESH
    for e in R.eyes.values():  # the whole eye window, whatever the gaze
        x0, y0, x1, y1 = e["box"]
        s[y0:y1, x0:x1] |= e["window"] > 0
    s = cv2.morphologyEx(s.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (CLOSE, CLOSE)))
    n, lab = cv2.connectedComponents(1 - s)  # fill holes: every background piece not touching the border
    for i in range(1, n):
        ys, xs = np.nonzero(lab == i)
        if ys.min() > 0 and xs.min() > 0 and ys.max() < C.H - 1 and xs.max() < C.W - 1:
            s[lab == i] = 1
    return s > 0


def soft_mask(s):
    g = cv2.dilate(s.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1,) * 2))
    d = cv2.distanceTransform(g, cv2.DIST_L2, 5)
    m = np.clip(d / FEATHER, 0, 1)
    return (m * m * (3 - 2 * m)).astype(np.float32)


class KeyFace:
    """One key's sampler: the plate's front at weights w, pushed through the key's map, inside its soft mask."""

    def __init__(self, k, M_plate):
        self.k = k
        cm = cmap(k)
        self.mx, self.my = cm[..., 0].astype(np.float32), cm[..., 1].astype(np.float32)
        self.M = cv2.remap(M_plate, self.mx, self.my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        ys, xs = np.nonzero(self.M > 0)
        self.box = [int(xs.min()) - 1, int(ys.min()) - 1, int(xs.max()) + 2, int(ys.max()) + 2]  # x0, y0, x1, y1
        x0, y0, x1, y1 = self.box
        self.s = (slice(y0, y1), slice(x0, x1))
        self.front = C.premul(key_front(k))[self.s]
        self.m = self.M[self.s][..., None]
        self.cx, self.cy = self.mx[self.s], self.my[self.s]

    def crop(self, front_w):
        """Premultiplied RGBA of the key's front inside its box, with the face at the rendered weights."""
        face = C.remap(front_w, self.cx, self.cy)
        return self.m * face + (1 - self.m) * self.front

    @staticmethod
    def straight_u8(pm):
        a = pm[..., 3:4]
        rgb = np.where(a > 1e-6, pm[..., :3] / np.maximum(a, 1e-6), 0)
        return np.clip(np.dstack([rgb, a]) * 255 + 0.5, 0, 255).astype(np.uint8)


def prep():
    R = FrontRig()
    s = support(R)
    M = soft_mask(s)
    np.save(C.WORK / "support.npy", M)
    # the frontal key as one front and one back, like every grown key (chain_rig.py: back = hair-back + front)
    out = PROTO / "art" / "v6" / "frontal"
    out.mkdir(parents=True, exist_ok=True)
    fr = R.static
    back = C.over(fr, R.hairback())
    for name, img in (("front", fr), ("back", back)):
        Image.fromarray(KeyFace.straight_u8(img)).save(out / f"{name}.png")
    # rest check: the face sampled at rest against each key's own front, inside the mask (and in its feather)
    rest = {}
    front0 = R.render({})
    for k in KEY_IDS:
        kf = KeyFace(k, M)
        crop = kf.crop(front0)
        d = np.abs(crop - kf.front)[..., :3].mean(-1) * 255
        m = kf.m[..., 0]
        band = (m > 0.02) & (m < 0.98)
        rest[k] = {"box": kf.box, "maskPx": int((m > 0.5).sum()), "restMadInMask": round(float((d * m).sum() / m.sum()), 3),
                   "restMadFeather": round(float(d[band].mean()), 3), "restP99": round(float(np.percentile(d[m > 0.5], 99)), 2)}
        print(k, rest[k], flush=True)
    (C.WORK / "rest6.json").write_text(json.dumps(rest, indent=1))


NECK_X, NECK_BOTTOM, OVERLAP = (356, 636), 830, 12  # chain_face.py's neck rectangle; the new overlap (px)


def collar():
    """Fix 1 (the method's throat line): every key's neck (in front and back) no longer BUTTS the pinned body at
    y 830; it runs OVERLAP px further down onto the body's own identical pixels (the neck's map is the identity at
    the collar, chain_face.neck_weight), eased out, so a sub-pixel disagreement between the head mesh and the body
    mesh shows the body under the neck, never the dark hair-back through a gap."""
    rig = C.rig()
    body = C.load_rgba(rig["artMeta"]["v3"]["frontal"]["layers"][1]["file"])  # v5/face/body-minus.png: the plate body minus the neck
    bx, by = rig["artMeta"]["v3"]["frontal"]["layers"][1]["box"][:2]
    plate_body = np.zeros((C.H, C.W, 4), np.float32)
    plate_body[by:by + body.shape[0], bx:bx + body.shape[1]] = body
    ys = np.arange(NECK_BOTTOM, NECK_BOTTOM + OVERLAP)
    a = 1 - rig6.smoothstep(NECK_BOTTOM - 0.5, NECK_BOTTOM + OVERLAP - 0.5, ys.astype(np.float64))
    ext = np.zeros((C.H, C.W, 4), np.float32)
    x0, x1 = NECK_X
    ext[ys[0]:ys[-1] + 1, x0:x1] = plate_body[ys[0]:ys[-1] + 1, x0:x1]
    ext[ys[0]:ys[-1] + 1, x0:x1, 3] *= a[:, None]
    ext = C.premul(ext)
    new = json.loads((PROTO / "art" / "rig-v6.json").read_text(encoding="utf-8"))
    for k in KEY_IDS:
        ent = new["artMeta"]["v3"]["keys"][k]
        imgs = {}
        for part in ("front", "back"):
            f = ent[part]["file"]
            src = PROTO / "art" / f if k == "frontal" else C.PROTO_ART / f
            im = np.asarray(Image.open(src).convert("RGBA")).astype(np.float32) / 255.0
            c = np.zeros((C.H, C.W, 4), np.float32)
            c[:im.shape[0], :im.shape[1]] = im
            imgs[part] = C.premul(c)
        # the extension goes UNDER the key's own pixels (only where the key has none: below its neck)
        fr = C.over(imgs["front"], ext)
        bk = C.over(fr, imgs["back"])
        out = PROTO / "art" / "v6" / "keys" / k
        out.mkdir(parents=True, exist_ok=True)
        for part, img in (("front", fr), ("back", bk)):
            Image.fromarray(KeyFace.straight_u8(img)).save(out / f"{part}.png")
            ent[part] = {"file": f"v6/keys/{k}/{part}.png", "box": [0, 0, C.W, C.H]}
    new["artMeta"]["v6full"]["collar"] = f"Fix 1: every key's neck overlaps the body {OVERLAP} px below y {NECK_BOTTOM}, eased out (face6.py collar)"
    (PROTO / "art" / "rig-v6.json").write_text(json.dumps(new, indent=1), encoding="utf-8")
    print("collar overlap written for", KEY_IDS)


if __name__ == "__main__":
    {"prep": prep, "collar": collar}[sys.argv[1]]()
