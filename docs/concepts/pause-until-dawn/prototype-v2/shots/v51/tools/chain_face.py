"""Living portrait v5.1 (game case: both): what the chain carries besides the head paint.

1. The ghost jaw (judge, v5 pilot: a grey band with a second dark stroke along her right jaw from about +8 to +20).
   Found by taking the pilot key apart layer by layer: the plate's lower jaw INK and the grey under-face underpaint
   live in the pinned BODY layer, just under the head's alpha edge. The turn moves the face's edge and leaves the
   body's copy behind: two contours. Fix: the NECK (the body inside the neck's two side contours, contours
   included, from the under-face down to the collar at y 830) becomes its own layer. Each key carries it on the
   head's own map down to the jaw (y <= 770) and eases that map to none at the collar (770..830), so the jaw ink and
   the under-face ride with the face and the neck twists between the jaw and a pinned collar. The pinned body loses
   that region (hair shows where the neck turns away). At rest body-minus-neck + neck is the plate body exactly.
   (A first try, a 30 px chin band pushed with the head over a cleaned neck, left the neck's contours pinned: a
   pale strip opened between the tassel and the jaw from +16, and the contour tops that rode with it floated free.)
2. The plate's expression patches (8 lid frames, 4 mouths, 2 brows) placed on the canvas, pushed with the key.
3. The hair under the tassel: the plate's hair-back there is a blotchy underfill; filled once from the hair around
   it inside the tassel's opaque footprint, so the rest pose is unchanged and every key inherits it.
4. The tassel anchor (the top of the earring, where it hangs from the ear), carried by the same meshes, so the
   tassel's offset at each key is where that key's own painting has the ear.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY chain_face.py neck      # -> WORK/face/{neck,body-minus,turned-minus}.png + neck.json
    $PY chain_face.py footprint # -> WORK/face/fp-{init,mask}.png for chain-repaint.mjs
    $PY chain_face.py footprint-fill   # -> WORK/face/hairback-fp.png (the plate's hair-back from then on)
"""
from __future__ import annotations

import json
import sys

import cv2
import numpy as np
from PIL import Image

import chain_core as C

NECK_X = (356, 636)  # inside the collar, the neck's side contours included (their ink: x 371..373 and 619..621)
NECK_TOP, NECK_FULL, NECK_BOTTOM = 540, 770, 830  # rides the head fully down to 770 (below the chin), none at 830


def neck_weight(y):
    """How much of the head's map the neck takes at canvas row y (1 down to the chin, 0 at the collar)."""
    t = np.clip((NECK_BOTTOM - np.asarray(y, np.float64)) / (NECK_BOTTOM - NECK_FULL), 0, 1)
    return t * t * (3 - 2 * t)


def frontal_layers(rig):
    return rig["artMeta"]["v3"]["frontal"]["layers"]


def plate_front_alpha(rig):
    """Alpha of everything drawn after the body on the plate (the head's front), tassel excluded."""
    a = np.zeros((C.H, C.W), np.float32)
    behind = True
    for l in frontal_layers(rig):
        if l["motion"] == "chest":
            behind = False
            continue
        if behind or l["name"] == "earring":
            continue
        a = np.maximum(a, C.placed(C.ART / l["file"], l["box"])[..., 3])
    return a


def body(rig, turned=False):
    f = rig["artMeta"]["v3"]["frontal"]
    if turned:
        return C.placed(C.ART / f["bodyTurned"]["file"], f["bodyTurned"]["box"])
    b = next(l for l in f["layers"] if l["motion"] == "chest")
    return C.placed(C.ART / b["file"], b["box"])


def build_neck(rig):
    yy, xx = np.mgrid[0:C.H, 0:C.W]
    R = (xx >= NECK_X[0]) & (xx < NECK_X[1]) & (yy >= NECK_TOP) & (yy < NECK_BOTTOM)
    B, T = body(rig), body(rig, turned=True)
    neck = B.copy()
    neck[..., 3] = np.where(R, B[..., 3], 0)
    minus, tminus = B.copy(), T.copy()
    minus[..., 3] = np.where(R, 0, B[..., 3])
    tminus[..., 3] = np.where(R, 0, T[..., 3])
    return neck, minus, tminus, R


def plate_patches(rig):
    """name -> (canvas RGBA, meta) for every plate expression patch the runtime draws."""
    p = rig["artMeta"]["v3"]["patches"]
    out = {}
    for e in p["eyes"]:
        out[f"lid/{e['name']}"] = (C.placed(C.ART / e["file"], e["box"]), {"aperture": e["aperture"], "name": e["name"]})
    for grp in ("mouth", "brows"):
        for k, v in p[grp].items():
            out[f"{grp}/{k}"] = (C.placed(C.ART / v["file"], v["box"]), {})
    return out


def tassel_anchor(rig):
    """The earring's top (where it hangs from the lobe): the centroid of its top 24 rows of alpha, on the canvas."""
    e = next(l for l in frontal_layers(rig) if l["name"] == "earring")
    a = C.placed(C.ART / e["file"], e["box"])[..., 3] > 127
    ys, xs = np.nonzero(a)
    top = ys.min()
    sel = ys < top + 24
    return [float(xs[sel].mean()), float(ys[sel].mean())]


FP_ERODE = 3  # px: the repaint stays this far inside the tassel's opaque alpha, so the rest pose is unchanged


def footprint_cmd():
    """The hair under the tassel (the plate's hairBack there is a blotchy underfill, seen whenever the hair moves
    against the tassel): init = the plate without the tassel, mask = the tassel's opaque footprint (eroded) where the
    hair-back is what shows."""
    import chain_grow as G
    rig = C.load_rig()
    P = G.plate_key(rig, 0.0)
    e = next(l for l in frontal_layers(rig) if l["name"] == "earring")
    ta = C.placed(C.ART / e["file"], e["box"])[..., 3] >= 250
    ta = cv2.erode(ta.astype(np.uint8), np.ones((2 * FP_ERODE + 1,) * 2, np.uint8)) > 0
    shows = (P["fr"][..., 3] < 250) & (body(rig)[..., 3] < 250) & (P["hb"][..., 3] >= 250)
    m = ta & shows
    c = np.zeros((C.H, C.W, 4), np.float32)
    for l in (P["hb"], body(rig), P["fr"]):
        C.over(c, l)
    d = C.WORK / "face"
    Image.fromarray(np.clip(C.white(c), 0, 255).astype(np.uint8)).save(d / "fp-init.png")
    Image.fromarray((m * 255).astype(np.uint8)).save(d / "fp-mask.png")
    print(json.dumps({"footprintPx": int(m.sum())}))


def footprint_fill():
    """hairBack with the footprint filled from the hair around it (CPU): the one LoRA prompt tried first (6
    candidates, 56 s) painted a SECOND tassel into the hole every time (the LoRA and the plate reference both put an
    earring there), which would ghost the moment the hair moves against the tassel. The hair behind the tassel is in
    shadow, so a smooth fill of the surrounding strands, streaked vertically like them, reads as hair."""
    import chain_grow as G
    rig = C.load_rig()
    hb = G.plate_key(rig, 0.0, plain_hb=True)["hb"]
    m = np.asarray(Image.open(C.WORK / "face/fp-mask.png")) > 127
    mm = cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8))
    rgb = np.ascontiguousarray(np.clip(hb[..., :3], 0, 255).astype(np.uint8)[..., ::-1])
    fill = cv2.inpaint(rgb, mm, 9, cv2.INPAINT_NS)[..., ::-1].astype(np.float32)
    fill = cv2.GaussianBlur(fill, (0, 0), sigmaX=1.5, sigmaY=9.0)
    f = np.clip(cv2.distanceTransform(m.astype(np.uint8), cv2.DIST_L2, 5) / 2.0, 0, 1)[..., None]
    hb[..., :3] = hb[..., :3] * (1 - f) + fill * f
    C.save(C.WORK / "face/hairback-fp.png", hb)
    (C.WORK / "face/fp-pick.json").write_text(json.dumps({"fill": "cv2 NS inpaint + vertical blur (CPU)",
                                                            "loraTried": "fpcand/c.*.png: 6 candidates, all painted a second tassel; none used"}), encoding="utf-8")
    print("footprint filled", int(m.sum()), "px")


def neck_cmd():
    rig = C.load_rig()
    neck, minus, tminus, R = build_neck(rig)
    d = C.WORK / "face"
    meta = {"anchor": tassel_anchor(rig), "neckPx": int(R.sum())}
    for name, img in (("neck", neck), ("body-minus", minus), ("turned-minus", tminus)):
        t, box = C.trim(img)
        C.save(d / f"{name}.png", t)
        meta[name] = {"box": box}
    (d / "neck.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    c0 = np.zeros((C.H, C.W, 4), np.float32)
    C.over(c0, body(rig))
    c1 = np.zeros((C.H, C.W, 4), np.float32)
    C.over(c1, minus)
    C.over(c1, neck)
    print(json.dumps({"neckPx": meta["neckPx"], "restMaxDiff": float(np.abs(C.white(c0) - C.white(c1)).max())}))


if __name__ == "__main__":
    {"neck": neck_cmd, "footprint": footprint_cmd, "footprint-fill": footprint_fill}[sys.argv[1]]()
