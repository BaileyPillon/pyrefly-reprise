"""Living-portrait v4 keys, second attempt (FFX-2 only): finish and measure a
rendered key.

`fix`: every candidate of `lora-keys.mjs warp` is laid back on its start
image through the head mask (rig-lora-init.py), so everything outside the
mask is the plate's own pixels (the body, the hood, the white top, the
frame), then each visible iris is recoloured to the colour its SIDE must be:
her right eye (screen-left at yaw 0) is the plate's green, her left eye the
plate's blue. The sampler, pulled by the LoRA, paints a lone profile eye green
and the far blue eye violet (judge-r1.md, both rounds); this is the v3 recolour
(rig-turns.py) aimed by side: hue and chroma from the plate's own iris layer,
lightness kept, so lines, pupil and highlights stay the painting's.

`measure`: the turn the painting actually shows. The saturated iris blobs in
the eye band are matched against where the head model (rig-lora-init.py:
the same ellipsoid the skeleton uses) puts the two pupils at every yaw from
-90 to +90; the best-fitting yaw is the reading, with the pixel error. `readsIpd` is the
turn from the pupil spacing alone (a head that slid sideways cannot fake it);
it needs both eyes.

    python -s tools/gen/rig-lora-fix.py fix --dir <cand/w1/yaw-40> --yaw -40 [--out <dir>]
    python -s tools/gen/rig-lora-fix.py measure --file <png> [--yaw -40 --window]
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

REPO = pathlib.Path(__file__).resolve().parents[2]
ART = REPO / 'docs/concepts/pause-until-dawn/prototype-v2/art'
STAGED = pathlib.Path('D:/Tools/ComfyUI/ComfyUI/input')


def init_mod():
    spec = importlib.util.spec_from_file_location('rinit', REPO / 'tools/gen/rig-lora-init.py')
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


I = init_mod()
PUPILS = {'R': (339.0, 421.0), 'L': (608.0, 406.0)}   # her right = green, her left = blue


def model_pupils(yaw: float) -> dict[str, tuple[float, float, float]]:
    t = math.radians(yaw)
    out = {}
    for k, (x, y) in PUPILS.items():
        xp, zp = I.rot(x, float(I.face_z(np.float64(x), np.float64(y))), t)
        out[k] = (xp, y, zp)
    return out


def plate_iris(name: str) -> np.ndarray:
    """Mean saturated colour of the plate's iris layer (irisR green, irisL blue)."""
    im = np.asarray(Image.open(ART / f'v3/layers/frontal/{name}.png').convert('RGBA')).astype(np.float32)
    rgb, a = im[..., :3], im[..., 3] > 200
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    pick = a & (sat > 0.35) & (mx > 60)
    return rgb[pick]


def lum(rgb):
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def iris_blobs(rgb: np.ndarray) -> list[dict]:
    """Saturated green / blue / cyan / violet blobs in the eye band."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    band = np.zeros(r.shape, bool)
    band[330:500, 150:780] = True
    m = band & (sat > 0.3) & (((g > r + 25) & (g > b - 10)) | ((b > r + 20) & (b > g - 10)))
    lab, n = ndi.label(ndi.binary_closing(m, iterations=2))
    out = []
    for i in range(1, n + 1):
        blob = lab == i
        area = int(blob.sum())
        if area < 150 or area > 9000:
            continue
        ys, xs = np.nonzero(blob)
        h, w = np.ptp(ys) + 1, np.ptp(xs) + 1
        if not (0.6 <= h / w <= 5.0) or h < 18:
            continue
        filled = ndi.binary_fill_holes(ndi.binary_closing(blob, iterations=4))
        # an iris has a dark pupil / upper shadow inside it; a hair streak does not
        dark = float((lum(rgb)[filled] < 55).mean())
        if dark < 0.03:
            continue
        out.append({'x': float(xs.mean()), 'y': float(ys.mean()), 'area': area, 'dark': round(dark, 3),
                    'mask': filled})
    return out


def read_yaw(blobs: list[dict], lo: int = -90, hi: int = 90) -> dict:
    """Best yaw on a 1-degree grid. A model pupil facing the camera (z > 0)
    must take the nearest unused blob (60 px penalty if none within 70 px); one
    turning away (-60 < z <= 0) may take one; one further round is hidden.
    Every eye-sized blob (area >= 600) left unmatched costs 35 px, so a
    two-eyed face cannot read as a profile."""
    best = None
    for yaw in range(max(lo, -90), min(hi, 90) + 1):
        mp = model_pupils(yaw)
        used, err, match = set(), [], {}
        for k in sorted(mp, key=lambda q: -mp[q][2]):
            x, y, z = mp[k]
            if z <= -60:
                continue
            cands = sorted((math.hypot(bl['x'] - x, (bl['y'] - y) * 0.5), j)
                           for j, bl in enumerate(blobs) if j not in used)
            if cands and cands[0][0] <= 70:
                d, j = cands[0]
                used.add(j)
                match[k] = j
                err.append(d)
            elif z > 0:
                err.append(60.0)
        err += [35.0 for j, bl in enumerate(blobs) if j not in used and bl['area'] >= 600]
        e = sum(err) / max(len(err), 1)
        if best is None or e < best['err'] - 1e-9:
            best = {'yaw': yaw, 'err': round(e, 1), 'match': match}
    return best


def ipd_yaw(blobs: list[dict], rd: dict) -> int | None:
    """The turn from the pupil spacing alone (blind to a head that slid
    sideways): the |yaw| whose model spacing matches, signed like `rd`."""
    if set(rd['match']) != {'R', 'L'}:
        return None
    gap = blobs[rd['match']['L']]['x'] - blobs[rd['match']['R']]['x']
    best = min(range(0, 91), key=lambda y: abs((model_pupils(y)['L'][0] - model_pupils(y)['R'][0]) - gap))
    return best if rd['yaw'] >= 0 else -best


def recolour(rgb, region, ref):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    pick = region & (sat > 0.18) & (mx > 40)
    ref_mean = ref.mean(0)
    ref_l = float(lum(ref).mean())
    target = np.clip(ref_mean[None, None] * (lum(rgb)[..., None] / max(ref_l, 1e-3)), 0, 255)
    soft = ndi.gaussian_filter(pick.astype(np.float32), 0.7)[..., None] * region[..., None]
    rgb[:] = rgb * (1 - soft) + target * soft
    return int(pick.sum())


def fix_one(src: pathlib.Path, yaw: float, dst: pathlib.Path, refs) -> dict:
    # the exact init + mask the key was painted from: the staged copies its
    # sidecar names in ComfyUI's input folder (an init rebuilt later cannot leak in)
    meta = json.loads(src.with_suffix('.json').read_text(encoding='utf-8'))
    init = np.asarray(Image.open(STAGED / meta['init']).convert('RGB')).astype(np.float32)
    m = np.asarray(Image.open(STAGED / meta['mask']).convert('L')).astype(np.float32)[..., None] / 255.0
    ren = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    out = ren * m + init * (1 - m)
    blobs = iris_blobs(out)
    # the window keeps a hair clip or a cyan streak from being taken for an
    # eye (and recoloured); a reading on its edge means the turn is off by more
    rd = read_yaw(blobs, int(yaw) - 30, int(yaw) + 30)
    changed = {}
    for k, j in rd['match'].items():
        region = ndi.binary_dilation(blobs[j]['mask'], iterations=2)
        changed[k] = recolour(out, region, refs[k])
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGB').save(dst)
    iy = ipd_yaw(blobs, rd)
    return {'file': dst.name, 'reads': rd['yaw'], 'readsIpd': iy, 'err': rd['err'], 'edge': abs(rd['yaw'] - yaw) >= 30, 'irisRecoloured': changed,
            'eyes': {k: [round(blobs[j]['x']), round(blobs[j]['y'])] for k, j in rd['match'].items()}}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['fix', 'measure'])
    ap.add_argument('--dir', action='append')
    ap.add_argument('--file')
    ap.add_argument('--yaw', type=float, default=0.0)
    ap.add_argument('--out')
    ap.add_argument('--window', action='store_true', help='measure: search only yaw +-35')
    a = ap.parse_args()
    if a.cmd == 'measure':
        rgb = np.asarray(Image.open(a.file).convert('RGB')).astype(np.float32)
        lo, hi = (int(a.yaw) - 35, int(a.yaw) + 35) if a.window else (-90, 90)
        bl = iris_blobs(rgb)
        rd = read_yaw(bl, lo, hi)
        print(json.dumps({**rd, 'readsIpd': ipd_yaw(bl, rd)}))
        return
    refs = {'R': plate_iris('irisR'), 'L': plate_iris('irisL')}
    for d in map(pathlib.Path, a.dir):
        out = pathlib.Path(a.out) if a.out else d / 'fixed'
        out.mkdir(parents=True, exist_ok=True)
        rows = {}
        for p in sorted(d.glob('c*.png')):
            rows[p.stem] = fix_one(p, a.yaw, out / p.name, refs)
            print(d.name, p.stem, rows[p.stem])
        (out / 'measure.json').write_text(json.dumps({'yaw': a.yaw, 'candidates': rows}, indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()
