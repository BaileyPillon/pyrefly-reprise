"""fd_full.py: whole-backdrop faithful master (banded), QC, line metrics, before/after crops.

usage: fd_full.py <key> [--tag x4plus] [--kappa 1.0] [--a0 2.0] [--out DIR]
Writes <out>/backdrops/<key>@2x.png (RGB 2x of the approved painting), <out>/reports/<key>.json (library QC + line metrics + parameters).
Recipe (fd.py): carrier = bicubic 2x of the approved painting; ESRGAN's detail relative to the carrier, squashed per pixel to an amplitude the
painting allows (a0 + kappa * local rms of the painting's own fine detail); thin dark lines the painting does not imply are blended back to the
adaptive-unsharp master. Nothing is drawn that the painting does not already imply; tones are the painting's own.
"""
import json
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from r39lib import *
import fd
import linemetric as lm
import qc

OUTLIB = 'D:/Tools/pyrefly-art-backup/hires-r39-art'


def faithful_master(P, E, kappa=1.0, a0=2.0, erase=True, k_support=0.8, grow=4, band=512, mar=96, bmax=1.5):
    """P: uint8 HxWx3 (1x); E: uint8 (2H)x(2W)x3. Banded so a 5376x3072 master needs about a gigabyte, not ten."""
    H2, W2 = E.shape[:2]
    out = np.empty((H2, W2, 3), np.uint8)
    for r0 in range(0, H2, band):
        r1 = min(H2, r0 + band)
        e0 = max(0, r0 - mar) // 2 * 2
        e1 = min(H2, r1 + mar + 1) // 2 * 2
        if e1 <= r1 and e1 < H2:
            e1 = min(H2, e1 + 2)
        Pb = np.ascontiguousarray(P[e0 // 2:e1 // 2])
        Eb = np.ascontiguousarray(E[e0:e1])
        A = fd.variant_A(Pb, Eb, bmax=bmax)[0]
        M, _ = fd.variant_D(Pb, Eb, kappa=kappa, a0=a0, erase=erase, A=A, k_support=k_support, grow=grow)
        out[r0:r1] = M[r0 - e0:r1 - e0]
    return out


def main():
    a = sys.argv[1:]
    key = a[0]
    opt = {a[i]: a[i + 1] for i in range(1, len(a) - 1, 2) if a[i].startswith('--')}
    tag = opt.get('--tag', 'x4plus')
    kappa = float(opt.get('--kappa', 1.0))
    a0 = float(opt.get('--a0', 2.0))
    outlib = opt.get('--out', OUTLIB)
    t0 = time.time()
    src = Image.open(f'{ART}/backdrops/{key}.png').convert('RGB')
    P = np.asarray(src)
    E = np.asarray(Image.open(f'{R39}/work/e/{key}-{tag}-2x.png').convert('RGB'))
    assert E.shape[0] == P.shape[0] * 2 and E.shape[1] == P.shape[1] * 2, (E.shape, P.shape)
    M = faithful_master(P, E, kappa=kappa, a0=a0)
    out = Image.fromarray(M, 'RGB')
    dst = f'{outlib}/backdrops/{key}@2x.png'
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + '.tmp'
    out.save(tmp, 'PNG', compress_level=6)
    os.replace(tmp, dst)
    q = qc.likeness_rgb(src, out)
    bad = qc.judge(q, 'backdrop')
    # line metrics against the approved painting (bicubic up), whole image and the library's held master for comparison
    ga = np.asarray(src.convert('L').resize(out.size, Image.BICUBIC), np.float32)
    gm = np.asarray(out.convert('L'), np.float32)
    mm = lm.metrics(gm, ga)
    old = f'D:/Tools/pyrefly-art-backup/hires/backdrops/{key}@2x.png'
    mo = None
    if os.path.exists(old):
        mo = lm.metrics(np.asarray(Image.open(old).convert('L'), np.float32), ga)
    wins = lm.worst_windows(gm, ga, win=400, top=3)
    res = {'key': key, 'recipe': {'method': 'faithful detail (fd.py): carrier + painting-limited ESRGAN detail + unsupported-line eraser', 'esrgan': tag, 'kappa': kappa, 'a0': a0,
                                  'erase': {'k_support': 0.8, 'grow': 4}, 'adaptive_unsharp_bmax': 1.5},
           'size': list(out.size), 'bytes_png': os.path.getsize(dst), 'source_sha256': sha256(f'{ART}/backdrops/{key}.png'),
           'qc': q, 'flags': bad, 'lines': mm, 'lines_old_library_master': mo, 'worst_windows_master_px': wins, 'seconds': round(time.time() - t0, 1)}
    os.makedirs(f'{outlib}/reports', exist_ok=True)
    json.dump(res, open(f'{outlib}/reports/{key}.json', 'w'), indent=1)
    say(f'{key}: {out.size} {res["bytes_png"] / 1e6:.1f} MB qc ssim {q["ssim"]} dE {q["dE_mean"]} edge {q["edge_corr"]} flags {bad}; hair excess {mm["hair_excess_permille"]:.2f} permille'
        + (f' (old library master {mo["hair_excess_permille"]:.2f})' if mo else '') + f'; hrun/Mpx {mm["hrun_master"]:.0f} vs approved {mm["hrun_approved"]:.0f}'
        + (f' (old {mo["hrun_master"]:.0f})' if mo else '') + f'; {res["seconds"]} s')


if __name__ == '__main__':
    main()
