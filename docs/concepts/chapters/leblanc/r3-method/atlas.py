"""Art method r3 pilot, P1 (FFX-2 only, chapter 6 Leblanc): the SAM region atlas.

    D:/Tools/ComfyUI/python_embeded/python.exe -s docs/concepts/chapters/leblanc/r3-method/atlas.py [part ...]

Patterned on tools/gen/rig-sam.py (SAM 2.1 hiera-small, point + box prompts,
logits -> sigmoid, edge snapped to the painting's ink with rig-lib
geodesic_labels inside a 6 px band). Forced to the CPU so the shared card is
untouched (METHOD-CHECK P1: "0 on CPU"). Masks for the idle (obi, knot,
tassel, choker + six rig parts) and for cast.r2.2 (obi, knot, tassel, the
extra second tassel, choker); per region the mask, a 1:1 crop and Lab
quantiles go to D:/Tools/pyrefly-lora/leblanc/r3/atlas/ and atlas.json.
Prompts were placed by hand on coordinate-grid crops of each file.
Reads the art; writes nothing under public/.
"""
from __future__ import annotations

import importlib.util
import os
import pathlib
import sys

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import r3lib as R  # noqa: E402

_s = importlib.util.spec_from_file_location("riglib", R.REPO / "tools/gen/rig-lib.py")
L = importlib.util.module_from_spec(_s); _s.loader.exec_module(L)

SAM_REPO = pathlib.Path("D:/Tools/sam2/repo")
CKPT = pathlib.Path("D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt")
BAND = 6
_PRED = None


def predictor():
    global _PRED
    if _PRED is None:
        import torch
        torch.jit.script = lambda f, *a, **k: f
        cwd = os.getcwd()
        os.chdir(SAM_REPO)
        from sam2.build_sam import build_sam2
        from sam2.sam2_image_predictor import SAM2ImagePredictor
        model = build_sam2("configs/sam2.1/sam2.1_hiera_s.yaml", str(CKPT), device="cpu")
        os.chdir(cwd)
        _PRED = SAM2ImagePredictor(model)
        print("SAM 2.1 small on cpu")
    return _PRED


_IMG = {"key": None}


def sam(rgb, key, pos, neg, box=None, pick="best"):
    import torch
    p = predictor()
    pts = [list(map(float, q)) for q in pos] + [list(map(float, q)) for q in neg]
    lab = [1] * len(pos) + [0] * len(neg)
    with torch.inference_mode():
        if _IMG["key"] != key:
            p.set_image(np.clip(rgb, 0, 255).astype(np.uint8)); _IMG["key"] = key
        logits, scores, _ = p.predict(point_coords=np.array(pts) if pts else None, point_labels=np.array(lab) if pts else None,
                                      box=np.array(box, np.float32) if box is not None else None, multimask_output=True, return_logits=True)
    prob = 1 / (1 + np.exp(-np.clip(logits, -30, 30)))
    areas = (prob > 0.5).reshape(3, -1).sum(1)
    if pick == "small":
        i = int(np.argmin(areas))
    elif pick == "large":
        i = int(np.argmax(areas))
    else:
        i = int(np.argmax(scores))
    return prob[i] > 0.5, float(scores[i])


def snap(rgb, m, band=BAND):
    inner = L.erode(m, band); outer = ~L.dilate(m, band)
    dom = ~(inner | outer)
    if not dom.any() or not inner.any():
        return m
    ys, xs = np.nonzero(L.dilate(dom, 2))
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    seeds = np.full((y1 - y0, x1 - x0), -1, np.int64)
    seeds[inner[y0:y1, x0:x1]] = 1; seeds[outer[y0:y1, x0:x1]] = 0
    rgba = np.concatenate([rgb[y0:y1, x0:x1], np.full((y1 - y0, x1 - x0, 1), 255.0)], -1)
    labs = L.geodesic_labels(rgba, seeds, np.ones_like(seeds, bool))
    out = m.copy(); sub = out[y0:y1, x0:x1]; d = dom[y0:y1, x0:x1]
    sub[d] = labs[d] == 1
    return out


# prompts: part -> (pos points, neg points, box x0 y0 x1 y1, pick, clip box or None)
IDLE = {
    "obi":    ([(312, 342), (340, 356), (345, 330), (421, 360)], [(387, 348), (340, 392), (286, 345), (360, 310)], (294, 314, 432, 377), "best", (292, 312, 434, 380)),
    "knot":   ([(387, 348), (368, 352), (404, 356), (387, 336)], [(330, 345), (420, 368)], (356, 326, 420, 374), "best", (352, 322, 424, 378)),
    "tassel": ([(386, 395), (384, 428), (383, 470), (383, 515)], [(350, 480), (420, 450), (330, 400)], (356, 364, 412, 536), "best", (352, 362, 416, 540)),
    "choker": ([(305, 188), (318, 196), (330, 203)], [(318, 176), (300, 214), (352, 190)], (290, 174, 352, 218), "best", (286, 170, 356, 222)),
    # six rig parts for the hurt bake
    "head":   ([(310, 130), (280, 80), (360, 90), (330, 185)], [(345, 240), (470, 200), (250, 260)], (228, 38, 400, 225), "best", None),
    "torso":  ([(300, 270), (340, 240), (330, 300), (360, 420)], [(310, 130), (100, 500), (470, 250), (300, 700)], (225, 190, 445, 480), "best", None),
    "fanarm": ([(470, 230), (455, 190), (485, 280)], [(330, 185), (520, 420), (360, 300)], (398, 150, 515, 330), "best", None),
    "fan":    ([(400, 185), (440, 196), (380, 176), (498, 222)], [(330, 150), (470, 250), (420, 150)], (340, 158, 512, 232), "best", None),
    "fararm": ([(55, 372), (80, 360)], [(120, 450), (40, 450)], (30, 335, 110, 410), "best", None),
    "sleeves": ([(110, 520), (500, 620), (150, 820), (470, 850), (230, 330)], [(300, 700), (330, 300), (310, 130)], (10, 280, 590, 1000), "large", None),
    "legs":   ([(290, 700), (345, 890), (330, 1030), (300, 560)], [(385, 470), (200, 700), (460, 700)], (215, 430, 420, 1105), "best", None),
}
CAST = {
    "obi":    ([(335, 570), (360, 577), (372, 580)], [(407, 590), (340, 600), (350, 548), (318, 565)], (322, 552, 392, 592), "best", (318, 548, 396, 596)),
    "knot":   ([(407, 590), (390, 592), (428, 596), (410, 578)], [(360, 575), (445, 590), (405, 622)], (378, 566, 442, 614), "best", (374, 562, 446, 618)),
    "tassel": ([(404, 616), (400, 660), (398, 710), (398, 740)], [(375, 700), (425, 690), (455, 700)], (384, 606, 418, 752), "best", (380, 602, 422, 756)),
    "tassel2": ([(455, 625), (455, 642), (457, 700), (458, 750)], [(435, 700), (480, 700), (480, 600)], (440, 612, 474, 770), "best", (436, 608, 478, 774)),
    # the two beads above the second tassel (P6: the first pass left them floating)
    "beads":  ([(455, 626), (455, 643)], [(440, 630), (472, 640), (457, 665)], (445, 614, 467, 652), "best", (443, 612, 469, 654)),
    "choker": ([(372, 416), (385, 422), (394, 424)], [(380, 405), (375, 436), (405, 410)], (355, 404, 402, 436), "best", (351, 400, 406, 440)),
}


def run(name, path, prompts):
    rgba = R.load_rgba(path)
    a = rgba[..., 3:4] / 255.0
    rgb = rgba[..., :3] * a + 255 * (1 - a)
    out = {}
    for part, (pos, neg, box, pick, clip) in prompts.items():
        m, score = sam(rgb, name, pos, neg, box, pick)
        c = None
        if clip is not None:
            c = np.zeros_like(m); c[clip[1]:clip[3], clip[0]:clip[2]] = True; m &= c
            m = snap(rgb, m) & c
        m &= rgba[..., 3] > 8
        R.save_l(m, R.ATLAS / f"{name}.{part}.png")
        ys, xs = np.nonzero(m)
        bb = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1] if len(xs) else None
        if bb:
            ov = rgb.copy(); ov[m] = ov[m] * 0.45 + np.array([255, 0, 255]) * 0.55
            x0, y0, x1, y1 = max(0, bb[0] - 20), max(0, bb[1] - 20), bb[2] + 20, bb[3] + 20
            Image.fromarray(np.clip(ov[y0:y1, x0:x1], 0, 255).astype(np.uint8)).save(R.ATLAS / f"{name}.{part}.overlay.png")
            Image.fromarray(np.clip(rgba[bb[1]:bb[3], bb[0]:bb[2]], 0, 255).astype(np.uint8), "RGBA").save(R.ATLAS / f"{name}.{part}.crop.png")
        out[part] = {"samScore": round(score, 3), "px": int(m.sum()), "bbox": bb,
                     "prompts": {"pos": pos, "neg": neg, "box": box, "pick": pick, "clip": clip}, "lab": R.lab_stats(rgba, m)}
        print(name, part, out[part]["px"], bb, round(score, 3), flush=True)
    return out


def main():
    only = sys.argv[1:]
    R.ATLAS.mkdir(parents=True, exist_ok=True)
    res = R.read_json(R.SCR / "atlas.json") if (R.SCR / "atlas.json").exists() else {}
    for name, path, P in (("idle", R.IDLE, IDLE), ("cast", R.CAST, CAST)):
        sel = {k: v for k, v in P.items() if not only or k in only or f"{name}.{k}" in only}
        if sel:
            res.setdefault(name, {}).update(run(name, path, sel))
    R.write_json(res, R.SCR / "atlas.json")


if __name__ == "__main__":
    main()
