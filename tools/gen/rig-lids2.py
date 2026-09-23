"""Living-portrait v4.1 (FFX-2 only): blinks that roll, from a PAINTED closed eye.

The v4 check: on the turned keys the closing lids were flat pale skin blobs
with ragged, torn outlines laid over the iris, the closed lids visible-edged
patches (a zig-zag 'V' at -40), and at 0 the closed screen-right lid a darker
outlined oval. The cause: `rig-lids.py` synthesised the lid skin as a smooth
fill between the skin around the eye, so the lid had no painted form and its
edge was wherever the fill met the eye.

Here each key's closed eyes are PAINTED (the plate's identity LoRA, masked to
the eyes, `tools/gen/lora-repaint.mjs`), and every in-between frame is built
from the two paintings, per column of each eye:

  yT(x)   the top of the painted upper rim (lashes) of the open eye, less a
          margin: above it both paintings are the same skin
  top(x)  the open eye's upper lid line (the opening's top)
  yc(x)   the closed painting's lid line (its darkest row in the eye)
  ye(x)   the lid edge at aperture a: top + (1 - a) (yc - top)

  [yT, ye]        the closed painting's lid, from yT down to its line,
                  compressed into the gap: the lid unrolls downward
  [ye, ye + lash] the closed painting's lash line, carried on the edge
  below           transparent: the open eye as painted (and the frontal's
                  moving iris) shows under the lid

so the lid is always the painting's own lid, its line always the painting's
own line, and at a = 0 the frame is the closed painting itself.

    PY=D:/Tools/ComfyUI/python_embeded/python.exe
    $PY -s tools/gen/rig-lids2.py prep  --key v4-l40            # init + mask for lora-repaint.mjs
    $PY -s tools/gen/rig-lids2.py build --key v4-l40 --pick D:/Tools/pyrefly-lora/yuna-x2/rig-v41/v4-l40.lids.c3.png
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = pathlib.Path(__file__).resolve().parent


def _load(name, file):
    spec = importlib.util.spec_from_file_location(name, HERE / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


L = _load("riglib", "rig-lib.py")
LIDS = _load("riglids", "rig-lids.py")
W, H = 832, 1216
WORK = pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v41")
OUT = L.ART / "v3/patches/lids"
APERTURES = LIDS.APERTURES  # the same eight frames the runtime's nearest-lid pick expects
MARGIN = 6  # px above the rim's top where the lid frame starts (both paintings agree there)
LASH = 7  # px of the closed painting's lash line carried under the edge
RIM_MIN = 14  # px above the open lid line that the lid always covers (the painted rim and lashes)


def eyes_of(rig, key_id):
    """Per painted eye: the opening mask, its column curves and the rim tops, from the open painting."""
    order = rig["artMeta"]["commonLandmarkOrder"]
    key = next(k for k in rig["keys"] if k["id"] == key_id)
    c = LIDS.key_canvas(rig, key_id)
    out = {}
    for name in ("pupil_R", "pupil_L"):
        px, py = (int(round(v)) for v in key["landmarks"][order.index(name)])
        o = LIDS.opening(c, px, py)
        if o is None:
            continue
        cols, top, bot = LIDS.curves(o)
        runs, ext, t_ext = LIDS.rim_runs(c, cols, top, o)
        runs = LIDS.smooth_rim_tops(runs)
        out[name] = {"o": o, "cols": cols, "top": top, "bot": bot, "runs": runs, "ext": ext, "t_ext": t_ext}
    return c, out


def composite_white(rig, key_id):
    """The key as drawn at rest, flattened on white (as the LoRA keys were painted)."""
    v3 = rig["artMeta"]["v3"]
    if key_id == "frontal":
        img = L.load_rgba(L.ART / "keys/frontal.png").astype(np.float32)
    else:
        img = np.zeros((H, W, 4), np.float32)
        k = v3["keys"][key_id]
        for m in (k["back"], v3["frontal"]["bodyTurned"], k["front"]):
            L.over(img, L.load_rgba(L.ART / m["file"]).astype(np.float32), m["box"][0], m["box"][1])
    a = img[..., 3:4] / 255.0
    return img[..., :3] * a + 255 * (1 - a)


def prep(args, rig):
    WORK.mkdir(parents=True, exist_ok=True)
    c, eyes = eyes_of(rig, args.key)
    m = np.zeros((H, W), bool)
    for e in eyes.values():
        band = np.zeros((H, W), bool)
        for x, t in zip(e["ext"], e["t_ext"]):
            if 0 <= x < W:
                r0 = e["runs"].get(int(x), (int(t) - 4, 0))[0]
                b = float(np.interp(x, e["cols"], e["bot"]))
                band[max(0, r0 - 4):int(b) + 6, int(x)] = True
        m |= L.dilate(band | e["o"], 6)
    white = composite_white(rig, args.key)
    stem = WORK / f"{args.key}.lids"
    Image.fromarray(np.clip(white + 0.5, 0, 255).astype(np.uint8)).save(f"{stem}.init.png")
    Image.fromarray((m * 255).astype(np.uint8)).save(f"{stem}.mask.png")
    print(json.dumps({"init": f"{stem}.init.png", "mask": f"{stem}.mask.png", "eyes": list(eyes), "px": int(m.sum())}))


def closed_line(C, e):
    """Per column of the eye (ext), the closed painting's lid line: its darkest row between the open lid's top and bottom."""
    lum = L.luminance(C)
    ys = []
    for x, t in zip(e["ext"], e["t_ext"]):
        b = float(np.interp(x, e["cols"], e["bot"]))
        y0, y1 = int(max(0, t - 4)), int(min(H - 1, b + 8))
        if not (0 <= x < W) or y1 <= y0:
            ys.append(np.nan)
            continue
        col = ndi.gaussian_filter1d(lum[y0:y1 + 1, int(x)], 1.2)
        ys.append(y0 + float(np.argmin(col)))
    ys = np.array(ys)
    ok = ~np.isnan(ys)
    ys = np.interp(np.arange(len(ys)), np.nonzero(ok)[0], ys[ok])
    # one clean curve: a robust fit (quadratic in x) through the per-column minima
    x = np.asarray(e["ext"], np.float64)
    for _ in range(3):
        p = np.polyfit(x, ys, 2)
        fit = np.polyval(p, x)
        res = np.abs(ys - fit)
        keep = res < max(2.5, np.percentile(res, 70))
        ys = np.where(keep, ys, fit)
    return np.polyval(np.polyfit(x, ys, 2), x)


def build(args, rig):
    v3 = rig["artMeta"]["v3"]
    c, eyes = eyes_of(rig, args.key)
    C_all = {"pupil_R": np.asarray(Image.open(args.pick).convert("RGB")).astype(np.float32)}
    # a second pick for her left eye when no single candidate closed both (the sampler often winks)
    C_all["pupil_L"] = np.asarray(Image.open(args.pick_l).convert("RGB")).astype(np.float32) if args.pick_l else C_all["pupil_R"]
    O = c[..., :3].astype(np.float32)
    frames = []
    info = {}
    for a in APERTURES:
        img = np.zeros((H, W, 4), np.float32)
        for name, e in eyes.items():
            C = C_all[name]
            yc = closed_line(C, e)
            cols, ext = e["cols"], e["ext"]
            corner = LIDS.CORNER
            inside = np.clip(np.minimum(ext - (cols[0] - corner), (cols[-1] + corner) - ext) / corner, 0, 1)
            # strands across the eye stay in front of the lid, less their 1 px edge, and never where the
            # open painting is iris (at the frontal's closed eye a blue sliver showed beside a strand)
            s_hsv = LIDS.hsv(c[..., :3])
            iris_px = (s_hsv[..., 1] > 0.3) & (s_hsv[..., 0] * 360 > 90) & (s_hsv[..., 0] * 360 < 290)
            hair = ndi.binary_erosion(LIDS.hair_mask(c, e["o"]), iterations=1) & ~ndi.binary_dilation(iris_px, iterations=1)
            for j, x in enumerate(ext):
                if not (0 <= x < W) or inside[j] <= 0:
                    continue
                x = int(x)
                t = e["t_ext"][j]
                b = float(np.interp(x, cols, e["bot"]))
                r0 = e["runs"].get(x, (int(round(t)) - 2, 0))[0]
                yT = max(0, min(r0, int(t) - RIM_MIN) - MARGIN)  # the rim is at least RIM_MIN px tall (a strand can hide it from the rim search)
                ycj = yc[j]
                ye = t + (1 - a) * (ycj - t) * inside[j] if a > 0 else ycj
                bottom = ye + LASH if a > 0 else max(ycj + LASH, b + 3)
                ys = np.arange(yT, int(np.ceil(bottom)) + 1)
                ys = ys[(ys >= 0) & (ys < H)]
                if len(ys) == 0:
                    continue
                # where each row samples the closed painting
                span_o = max(1.0, ye - yT)
                span_c = max(1.0, ycj - yT)
                src = np.where(ys <= ye, yT + (ys - yT) * span_c / span_o, ycj + (ys - ye))
                col = np.stack([np.interp(src, np.arange(H), C[:, x, k]) for k in range(3)], -1)
                al = np.ones(len(ys))
                al *= np.clip((ys - yT + 1) / 4.0, 0, 1)  # soft top: the two paintings meet
                if a > 0:
                    al *= np.clip((bottom - ys) / 2.0, 0, 1)  # soft bottom of the lash band
                al *= inside[j]
                al *= ~hair[ys, x]  # strands across the eye stay in front of the lid
                prev = img[ys, x, 3] / 255.0
                img[ys, x, :3] = np.where((al > prev)[:, None], col, img[ys, x, :3])
                img[ys, x, 3] = np.maximum(img[ys, x, 3], al * 255)
            info[name] = {"cols": [int(cols[0]), int(cols[-1])], "closedLineMean": round(float(yc.mean()), 1), "openTopMean": round(float(e["top"].mean()), 1)}
        img[..., 3] *= np.clip(c[..., 3] / 255.0, 0, 1)
        frames.append((a, img))
    out_dir = OUT / args.key
    out_dir.mkdir(parents=True, exist_ok=True)
    entries = []
    for a, img in frames:
        ys, xs = np.nonzero(img[..., 3] > 0)
        x0, y0, x1, y1 = xs.min() - 1, ys.min() - 1, xs.max() + 2, ys.max() + 2
        dst = out_dir / f"a{int(round(a * 100)):02d}.png"
        L.save_rgba(img[y0:y1, x0:x1], dst)
        entries.append({"name": f"lid-{int(round(a * 100)):02d}", "aperture": a, "raw": True, "file": L.rel(dst).split("prototype-v2/art/")[1],
                        "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]})
    LIDS.sheet(c, entries, out_dir / "check.png")
    if args.key == "frontal":
        v3["patches"]["eyes"] = entries
    else:
        v3.setdefault("keyLids", {})[args.key] = entries
    v3["keyLidsReadme"] = "tools/gen/rig-lids2.py (v4.1): per key, lid frames by aperture (nearest wins), each the key's own LoRA-painted closed eye unrolled down to the aperture's lid edge; transparent below the edge"
    rig["artMeta"]["v4"].setdefault("lids", {})[args.key] = {"closedPick": pathlib.Path(args.pick).name, "closedPickLeftEye": pathlib.Path(args.pick_l).name if args.pick_l else None, "eyes": info}
    L.write_json(rig, L.ART / "rig.json")
    print(json.dumps({"key": args.key, "eyes": info}))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["prep", "build"])
    ap.add_argument("--key", required=True)
    ap.add_argument("--pick")
    ap.add_argument("--pick-l", dest="pick_l")
    args = ap.parse_args()
    rig = L.read_json(L.ART / "rig.json")
    (prep if args.cmd == "prep" else build)(args, rig)


if __name__ == "__main__":
    main()
