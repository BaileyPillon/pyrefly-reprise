"""Living-portrait v4 (FFX-2 only): mouth and brow expressions for the plate and
the +-20 / +-40 keys, painted with the plate's LoRA so every key smiles the
same way (a smile held through a turn stays one smile).

    python -s tools/gen/rig-v4face.py prep        # jobs -> D:/Tools/pyrefly-lora/yuna-x2/rig-v4/patches-jobs/ (+ plan.json)
    node tools/gen/rig-v4jobs.mjs --plan D:/Tools/pyrefly-lora/yuna-x2/rig-v4/patches-jobs/plan.json --jobs D:/Tools/pyrefly-lora/yuna-x2/rig-v4/patches-jobs --count 2
    python -s tools/gen/rig-v4face.py build --picks m0-smile:1,...   # patches + rig.json + check sheet

Each job is a latent inpaint (VAEEncode + SetLatentNoiseMask) of the key at a
LOW denoise (mouth 0.5, brows 0.45) inside a soft mask: an ellipse over the
mouth (from the key's own mouth corners and lips), a band over both brows
(eyeOuter to eyeOuter, 100 to 38 px above the pupils). The patch is then cut
the way tools/gen/rig-mouth.py cuts the plate's (its `build`: the mouth's
own features in the patch and the key, grown 7 px and blurred into a matte;
the key's own skin tone under it, the patch's detail on top), and for brows
by where the repaint actually changed the painting (|diff| > 14 levels,
closed, grown 4 px, blurred 2 px). At load the runtime seam-matches each
patch against the key's own composite (src/patch-blend.ts via layers.ts).

States: mouth parted, slightSmile, smile, pressed; brows raised, drawn.
"""
from __future__ import annotations

import importlib.util
import pathlib
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = pathlib.Path(__file__).resolve().parent
_v = importlib.util.spec_from_file_location("rigv4", HERE / "rig-v4lib.py")
V = importlib.util.module_from_spec(_v); _v.loader.exec_module(V)
L = V.L
_m = importlib.util.spec_from_file_location("rigmouth", HERE / "rig-mouth.py")
M = importlib.util.module_from_spec(_m); _m.loader.exec_module(M)

OUT = V.V4 / "patches"
JOBS = V.SCRATCH / "patches-jobs"  # inits, masks and every candidate (outside the repo)
YAWS = [-40, -20, 0, 20, 40]
VIEW = {-40: "three-quarter view, head turned, looking to the side", -20: "head turned slightly, looking to the side",
        0: "looking at viewer", 20: "head turned slightly, looking to the side", 40: "three-quarter view, head turned, looking to the side"}
MOUTH = {"parted": "parted lips, slightly open mouth", "slightSmile": "smile, closed mouth",
         "smile": "smile, open mouth, happy", "pressed": "closed mouth, pursed lips, serious"}
BROWS = {"raised": "raised eyebrows, surprised", "drawn": "furrowed brow, frown, serious"}


def src_rgb(yaw):
    return V.key_rgb(yaw, "final")


def mouth_mask(lm):
    xs = [lm["mouthCorner_R"][0], lm["mouthCorner_L"][0], lm["lipUpper"][0]]
    cx = (min(xs) + max(xs)) / 2
    cy = (lm["lipUpper"][1] + lm["lipLower"][1]) / 2
    rx = (max(xs) - min(xs)) / 2 + 26
    return L.ellipses_mask((V.H, V.W), [[cx, cy, rx, 34]])


def brow_mask(lm):
    y = min(lm["pupil_R"][1], lm["pupil_L"][1])
    x0 = min(lm["eyeOuter_R"][0], lm["eyeOuter_L"][0]) - 12
    x1 = max(lm["eyeOuter_R"][0], lm["eyeOuter_L"][0]) + 12
    m = np.zeros((V.H, V.W), bool)
    m[int(y - 100):int(y - 38), int(x0):int(x1)] = True
    return m


def prep():
    plan = {}
    for yaw in YAWS:
        lm = V.landmarks(yaw)
        rgb = src_rgb(yaw)
        tag = f"{'m' if yaw < 0 else 'p' if yaw > 0 else ''}{abs(yaw)}"
        for group, states, mk, dn in (("mouth", MOUTH, mouth_mask, 0.5), ("brows", BROWS, brow_mask, 0.45)):
            m = mk(lm)
            soft = ndi.gaussian_filter(m.astype(np.float32), 4.0)
            for state, words in states.items():
                j = f"{tag}-{state}"
                JOBS.mkdir(parents=True, exist_ok=True)
                Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(JOBS / f"{j}.init.png")
                L.save_l(soft, JOBS / f"{j}.mask.png")
                ys, xs = np.nonzero(m)
                plan[j] = {"box": [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)],
                           "tags": f"{VIEW[yaw]}, portrait, close-up, {words}", "denoise": dn, "seed": 5100 + 7 * YAWS.index(yaw)}
    L.write_json(plan, JOBS / "plan.json")
    print(len(plan), "jobs")


def brow_patch(res, rgb, m):
    diff = np.abs(res - rgb).max(-1)
    ch = ndi.binary_closing((diff > 14) & L.dilate(m, 2), iterations=2)
    ch = L.dilate(ch, 4) & L.dilate(m, 6)
    matte = np.clip(ndi.gaussian_filter(ch.astype(np.float32), 2.0), 0, 1)
    return matte


def build(picks):
    rig = L.read_json(L.ART / "rig.json")
    v3 = rig["artMeta"]["v3"]
    plan = L.read_json(JOBS / "plan.json")
    kp = v3.setdefault("keyPatches", {})
    rows = []
    for yaw in YAWS:
        kid = V.IDS[yaw]
        tag = f"{'m' if yaw < 0 else 'p' if yaw > 0 else ''}{abs(yaw)}"
        rgb = src_rgb(yaw)
        base = np.dstack([rgb, np.full((V.H, V.W), 255.0)])
        rec = {"mouth": {}, "brows": {}}
        row = []
        for group, states in (("mouth", MOUTH), ("brows", BROWS)):
            for state in states:
                j = f"{tag}-{state}"
                v = picks.get(j)
                if not v:
                    continue
                res = np.asarray(Image.open(JOBS / "out" / f"{j}.{v}.full.png").convert("RGB")).astype(np.float32)
                x, y, w, h = plan[j]["box"]
                dst_dir = OUT / kid / group
                dst_dir.mkdir(parents=True, exist_ok=True)
                if group == "mouth":
                    raw = np.dstack([res[y:y + h, x:x + w], L.load_l(JOBS / f"{j}.mask.png")[y:y + h, x:x + w] * 255])
                    tmp = dst_dir / f"{state}.raw.png"
                    L.save_rgba(raw, tmp)
                    M.OUT = dst_dir
                    meta, b, o, matte = M.build(state, {"file": L.rel(tmp).split("prototype-v2/art/")[1], "box": [x, y, w, h]}, base)
                    tmp.unlink()
                    comp = b * (1 - matte[..., None]) + o * matte[..., None]
                else:
                    m = np.zeros((V.H, V.W), bool); m[y:y + h, x:x + w] = True
                    matte_full = brow_patch(res, rgb, m)
                    ys, xs = np.nonzero(matte_full > 0.01)
                    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
                    arr = np.dstack([res[y0:y1, x0:x1], matte_full[y0:y1, x0:x1] * 255])
                    dst = dst_dir / f"{state}.png"
                    L.save_rgba(arr, dst)
                    meta = {"file": L.rel(dst).split("prototype-v2/art/")[1], "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]}
                    comp = rgb[y0:y1, x0:x1] * (1 - matte_full[y0:y1, x0:x1, None]) + res[y0:y1, x0:x1] * matte_full[y0:y1, x0:x1, None]
                meta["from"] = f"{j}.{v}"
                rec[group][state] = meta
                row.append(np.pad(comp, ((0, max(0, 140 - comp.shape[0])), (0, 4), (0, 0)))[:140])
        rest = V.V4 / "layers" / kid / "rest.png"
        if yaw == 0:
            v3["patches"]["mouth"] = {k: {"file": m["file"], "box": m["box"]} for k, m in rec["mouth"].items()} or v3["patches"]["mouth"]
            if rec["brows"]:
                v3["patches"]["brows"] = {k: {"file": m["file"], "box": m["box"]} for k, m in rec["brows"].items()}
        else:
            kp[kid] = {"rest": L.rel(rest).split("prototype-v2/art/")[1],
                       "mouth": {k: {"file": m["file"], "box": m["box"]} for k, m in rec["mouth"].items()},
                       "brows": {k: {"file": m["file"], "box": m["box"]} for k, m in rec["brows"].items()}}
        rig["artMeta"].setdefault("v4", {}).setdefault("expressions", {})[kid] = {g: {s: m["from"] for s, m in rec[g].items()} for g in rec}
        if row:
            rows.append(np.concatenate(row, 1))
        print(kid, {g: list(rec[g]) for g in rec})
    L.write_json(rig, L.ART / "rig.json")
    wmax = max(r.shape[1] for r in rows)
    sheet = np.concatenate([np.pad(r, ((0, 4), (0, wmax - r.shape[1]), (0, 0))) for r in rows], 0)
    Image.fromarray(np.clip(sheet, 0, 255).astype(np.uint8)).save(OUT / "check.png")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["prep"]:
        prep()
    elif a[:1] == ["build"]:
        build(dict(p.split(":") for p in a[a.index("--picks") + 1].split(",")))
    else:
        raise SystemExit(__doc__)
