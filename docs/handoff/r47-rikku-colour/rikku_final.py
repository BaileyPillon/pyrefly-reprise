# Rikku's FFX-2 dressphere colour correction, the FINAL function (2026-10-14; game case: FFX-2 only). Needs rikku_colour.py (colour maths) and rikku_colour2.py (the round-2 limiter),
# which sit beside this file. docs/handoff/r47-rikku-colour.md says what it does and why.
#
# The function is the round-2 one (AT TARGET per dressphere) with ONE change, the hair rule: on the yellow hue band (her hair, the yellow fills) the correction is the limiter alone
# (no extra gain, no glare pull), the same in every dressphere. Everything else is round 2: gamut-relative OKLab chroma limiter x the dial s, lightness ramp, bright-band easing, glare
# control, accent relief (eyes, beads), skin floor; hue, alpha, dark pixels (OKLab L below 0.30), RGB under alpha 0 untouched; nothing resampled.
#
#   python -I rikku_final.py --src D:/pyrefly-art-r44 --dst D:/pyrefly-art-r47 [--dress songstress ...] [--dry-run]
# reads <src>/characters/rikku-<dress>/*.png (every pose, every tier) and writes the corrected file to the same path under <dst>: beside it ("<name>.png.tmp"), then renamed over
# the destination, so a destination that is a HARD LINK of the source (an art mirror) gets a new file and the shared inode is never written. --src and --dst must differ.
import os, sys, json, struct
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import rikku_colour as rc
import rikku_colour2 as r2

# ---------------------------------------------------------------- the dial
FIXED = dict(Cc=0.35, q=2.0, d0=0.30, d1=0.42, Lg0=0.55, Lg1=0.82, kb=0.55, Lb0=0.78, Lb1=0.92, gy=0.7, area_rf=0.40, loud_C=0.14, r_frac=0.009, a0=0.20, a1=0.60)
GK, G_MAX = 0.32, 0.06          # glare pull g = min(G_MAX, GK * (1 - s))


def params_for_s(s):
    return r2.make_params2(s=s, g=min(G_MAX, GK * (1.0 - s)), **FIXED)


# AT TARGET dial s per dressphere (each dressphere's mean chroma and saturation on Yuna's painting of the same dressphere; her Thief for the Alchemist, her Warrior for the Berserker).
# None = unchanged, not rewritten (already below Yuna's colour level). The LESS and MORE dials of the same table (+10 percent / -10 percent chroma) are not used by the final function.
DIAL = {'alchemist': 0.740, 'berserker': 0.895, 'black-mage': 1.000, 'dark-knight': None, 'gunner': 0.600, 'lady-luck': 0.600,
        'songstress': 0.745, 'thief': 0.897, 'warrior': None, 'white-mage': 0.600}
S_CAP, G_CAP = 1.0, 0.0                                           # the hair rule: the limiter alone on the yellow band
BAND = dict(ye_h0=68.0, ye_h1=80.0, ye_h2=120.0, ye_h3=130.0)     # OKLCH hue, degrees: weight rises 68 -> 80, full to 120, falls 120 -> 130


def params_final(dress):
    p = params_for_s(DIAL[dress])
    p.update(s_cap=S_CAP, g_cap=G_CAP, **BAND)
    return p


def yellow_weight(hd, p):
    return rc.smoothstep((hd - p['ye_h0']) / (p['ye_h1'] - p['ye_h0'])) * (1.0 - rc.smoothstep((hd - p['ye_h2']) / (p['ye_h3'] - p['ye_h2'])))


def correct_rgb8_final(rgb8, p, area=None):
    L, C, h = rc.rgb8_to_oklch(rgb8)
    hd = np.degrees(h)
    wd = rc.smoothstep((L - p['d0']) / (p['d1'] - p['d0']))
    if area is not None:
        wd = wd * area                                            # accent relief: small isolated colour accents get 40 percent of the reduction
    wd = wd * (1.0 - p['kb'] * rc.smoothstep((L - p['Lb0']) / (p['Lb1'] - p['Lb0'])))      # bright band: the glare control does more of the work
    wy = yellow_weight(hd, p)
    s = p['s'] + wy * (p['s_cap'] - p['s'])                       # the hair rule
    g = p['g'] + wy * (p['g_cap'] - p['g'])
    lim = C / (1.0 + (C / p['Cc']) ** p['q']) ** (1.0 / p['q'])  # the limiter: the more chroma, the bigger the cut
    C2 = C + wd * (lim - C)
    C2 = C2 * (1.0 - wd * (1.0 - s))
    wh = rc.smoothstep((hd - (p['sk_h0'] - 6.0)) / 6.0) * (1.0 - rc.smoothstep((hd - p['sk_h1']) / 6.0))       # skin floor: orange hues never below min(own chroma, 0.100)
    wl = rc.smoothstep((L - (p['sk_L0'] - 0.04)) / 0.04) * (1.0 - rc.smoothstep((L - p['sk_L1']) / 0.04))
    C2 = np.maximum(C2, wh * wl * np.minimum(C, p['skin_lo']))
    wg = rc.smoothstep((L - p['Lg0']) / (p['Lg1'] - p['Lg0']))    # glare control: bright, high-chroma pixels are pulled down a little in lightness
    wc = rc.smoothstep((C - p['cg0']) / (p['cg1'] - p['cg0']))
    wyg = rc.smoothstep((hd - 75.0) / 15.0) * (1.0 - rc.smoothstep((hd - 125.0) / 15.0))
    wg = wg * (1.0 - p['gy'] * wyg)
    L2 = L - g * wg * wc
    mod = (np.abs(L2 - L) > 1e-9) | (np.abs(C2 - C) > 1e-9)
    C2 = np.where(mod, np.minimum(C2, rc.cmax_lookup(L2, h) * 0.9995), C2)                   # gamut-mapped by chroma at constant lightness and hue
    out = np.rint(rc.encode_srgb(rc.oklab_to_lin(L2, C2 * np.cos(h), C2 * np.sin(h)))).astype(np.uint8)
    out[~mod] = rgb8[~mod]                                        # everything the function does not change is copied back byte for byte
    return out


def correct_array_final(arr, p, chunk=600000):
    """(H,W,4) uint8 RGBA -> corrected copy. Alpha plane identical; RGB under alpha 0 identical; nothing resampled."""
    out = arr.copy()
    flat_in, flat_out = arr.reshape(-1, 4), out.reshape(-1, 4)
    amap = r2.area_map(arr, p)
    for i in range(0, flat_in.shape[0], chunk):
        blk = flat_in[i:i + chunk]
        idx = np.nonzero(blk[:, 3] > 0)[0]
        if idx.size:
            flat_out[i + idx, :3] = correct_rgb8_final(blk[idx, :3], p, amap[i + idx])
    return out


# ---------------------------------------------------------------- the install (a file at a time, beside and renamed over)
def phys(path):
    with open(path, 'rb') as f:
        f.read(8)
        while True:
            hdr = f.read(8)
            if len(hdr) < 8:
                return None
            n, t = struct.unpack('>I4s', hdr)
            if t == b'pHYs':
                return struct.unpack('>IIB', f.read(n))
            if t in (b'IDAT', b'IEND'):
                return None
            f.seek(n + 4, 1)


def correct_file(src, dst, dress):
    im = Image.open(src)
    assert im.format == 'PNG' and im.mode == 'RGBA', f'{src}: {im.format} {im.mode}'
    arr = np.array(im, dtype=np.uint8)
    out = correct_array_final(arr, params_final(dress))
    assert np.array_equal(arr[..., 3], out[..., 3]) and np.array_equal(arr[arr[..., 3] == 0], out[arr[..., 3] == 0]), 'alpha or the colour under alpha 0 changed'
    ph = phys(src)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + '.tmp'
    Image.fromarray(out, 'RGBA').save(tmp, format='PNG', compress_level=6, **({'dpi': (ph[0] * 0.0254, ph[1] * 0.0254)} if ph else {}))
    chk = Image.open(tmp)
    assert np.array_equal(np.array(chk, dtype=np.uint8), out), 'the written file does not decode to the result'
    chk.close()
    os.replace(tmp, dst)


def main():
    a = sys.argv[1:]
    src, dst = a[a.index('--src') + 1], a[a.index('--dst') + 1]
    assert os.path.abspath(src) != os.path.abspath(dst), '--src and --dst must differ'
    dresses = [a[i + 1] for i, v in enumerate(a) if v == '--dress'] or [d for d, s in DIAL.items() if s is not None]
    n = 0
    for d in dresses:
        assert DIAL[d] is not None, f'{d} is not changed by the dial'
        folder = os.path.join(src, 'characters', f'rikku-{d}')
        for name in sorted(os.listdir(folder)):
            if name.endswith('.png'):
                n += 1
                if '--dry-run' not in a:
                    correct_file(os.path.join(folder, name), os.path.join(dst, 'characters', f'rikku-{d}', name), d)
    print(f'{n} files {"(dry run)" if "--dry-run" in a else "written"}')


if __name__ == '__main__':
    main()
