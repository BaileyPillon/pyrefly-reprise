"""Living portrait v6 pilot (both): dump the frontal lid rig's per-column curves.

The v4.1 lid frames (tools/gen/rig-lids2.py) are geometry: per column of each eye, the
closed painting's lid is unrolled from yT down to ye = top + (1 - a)(yc - top). This
script calls rig-lids2.py's OWN functions (read-only: no prep, no build, nothing written
to the repo) and saves the curves the runtime needs as 1D textures, plus the two closed
paintings, so rig6.py can draw the lid at ANY aperture (the "shader port").

    PY=D:/Tools/ComfyUI/python_embeded/python.exe   # needs scipy
    $PY -s lid_extract.py --out D:/Tools/pyrefly-scratch/lp-v6/work/lids.npz
"""
import argparse
import importlib.util
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

REPO = pathlib.Path(__file__).resolve().parents[7]
GEN = REPO / "tools/gen"
PICKS = pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v41")


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, GEN / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    R = load("riglids2", "rig-lids2.py")
    L, LIDS = R.L, R.LIDS
    rig = L.read_json(L.ART / "rig.json")
    meta = rig["artMeta"]["v4"]["lids"]["frontal"]
    c, eyes = R.eyes_of(rig, "frontal")
    picks = {"pupil_R": PICKS / meta["closedPick"], "pupil_L": PICKS / (meta["closedPickLeftEye"] or meta["closedPick"])}
    s_hsv = LIDS.hsv(c[..., :3])
    iris_px = (s_hsv[..., 1] > 0.3) & (s_hsv[..., 0] * 360 > 90) & (s_hsv[..., 0] * 360 < 290)
    out = {"canvasAlpha": c[..., 3].astype(np.float32) / 255.0}
    for name, e in eyes.items():
        C = np.asarray(Image.open(picks[name]).convert("RGB")).astype(np.float32)
        yc = R.closed_line(C, e)
        cols, ext = e["cols"], np.asarray(e["ext"])
        corner = LIDS.CORNER
        inside = np.clip(np.minimum(ext - (cols[0] - corner), (cols[-1] + corner) - ext) / corner, 0, 1)
        hair = ndi.binary_erosion(LIDS.hair_mask(c, e["o"]), iterations=1) & ~ndi.binary_dilation(iris_px, iterations=1)
        t_ext = np.asarray(e["t_ext"], np.float64)
        r0 = np.array([e["runs"].get(int(x), (int(round(t)) - 2, 0))[0] for x, t in zip(ext, t_ext)], np.float64)
        bot = np.interp(ext, cols, e["bot"])
        k = name[-1]
        out.update({f"{k}_ext": ext.astype(np.int32), f"{k}_t": t_ext, f"{k}_r0": r0, f"{k}_yc": yc, f"{k}_inside": inside,
                    f"{k}_bot": bot, f"{k}_cols": cols.astype(np.int32), f"{k}_top": e["top"], f"{k}_colbot": e["bot"],
                    f"{k}_hair": hair, f"{k}_open": e["o"], f"{k}_C": C})
        print(name, "cols", int(cols[0]), int(cols[-1]), "ext", int(ext[0]), int(ext[-1]), "yc mean", round(float(yc.mean()), 1))
    out["consts"] = np.array([R.MARGIN, R.LASH, R.RIM_MIN], np.float64)
    np.savez_compressed(args.out, **out)


if __name__ == "__main__":
    main()
