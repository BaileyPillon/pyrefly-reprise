"""lock_gpu.py: the GPU stages of the painterly identity-lock round (candidates only).

  python lock_gpu.py sweep <item>          one seed (9101) of: mr (references only), and the init lock at four noise levels sA..sD  -> picks the lock strength
  python lock_gpu.py l1 <tag> <item> ...   the chosen lock (SIGMAS[tag]) for both seeds, then ESRGAN to 4x
  python lock_gpu.py face <item> ...       the face pass for both seeds (FACE_SIGMAS)
Outputs in F:/pyrefly-parked/2026-10-04/r39-art/lock-work/<subject>-<state>/ (<tag>-s<seed>-2x.png, -4x.png, gpu.json).
"""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from lock_lib import *

SIGMAS = {'sA': '0.828, 0', 'sB': '0.7, 0.35, 0', 'sC': '0.55, 0.25, 0', 'sD': '0.4, 0.15, 0', 'sE': '0.977, 0.935, 0.828, 0', 'sF': '0.935, 0.828, 0', 'sG': '0.99, 0.977, 0.935, 0.828, 0', 'mr': None}
FACE_SIGMAS = '0.5, 0.25, 0'


def up4_of(item, tag, seed):
    sid, state = item.split('/')
    d = tag_dir(item)
    src, dst = f'{d}/{tag}-s{seed}-2x.png', f'{d}/{tag}-s{seed}-4x.png'
    if not os.path.exists(dst):
        rgba = load_rgba(f'{ART39}/characters/{sid}/{state}.png')
        g2 = SG.up4(item, src, dst, rgba.size)
        logj(item, f'{tag}-{seed}-up4', {'gpu_s': g2})


def main():
    mode = sys.argv[1]
    if mode == 'sweep':
        for it in sys.argv[2:]:
            for tg in ('sB', 'sC', 'sA', 'sD'):
                run_whole(it, 9101, tg, SIGMAS[tg])
            run_whole(it, 9101, 'mr', None, refs=True)     # last: the references alone, a pure generation (the slowest of the five)
    elif mode == 'sweep2':       # round 2: the lock only just below the full noise, and the references alone for the second seed
        for it in sys.argv[2:]:
            for sd in SEEDS:
                for tg in ('sF', 'sE'):
                    run_whole(it, sd, tg, SIGMAS[tg])
            run_whole(it, 9102, 'mr', None, refs=True)
    elif mode == 'l1':
        tag = sys.argv[2]
        for it in sys.argv[3:]:
            for sd in SEEDS:
                run_whole(it, sd, tag, SIGMAS[tag])
                up4_of(it, tag, sd)
    elif mode == 'sweep3':       # round 3: the lightest lock between the references alone and 0.977, two seeds, then the two face passes
        for it in sys.argv[2:]:
            for sd in SEEDS:
                run_whole(it, sd, 'sG', SIGMAS['sG'])
            run_face(it, 9101, 'fa', None)
            run_face(it, 9101, 'fb', '0.935, 0.828, 0')
    elif mode == 'sweep4':       # round 4: the same two light locks with last round's S2 as a finish-only reference (Tidus, seed 9101)
        for it in sys.argv[2:]:
            sref = f'{SG.SWORK}/{it.replace("/", "-")}/s2-s9101-2x.png'
            run_whole(it, 9101, 'sH', SIGMAS['sE'], style_ref=sref)
            run_whole(it, 9101, 'sI', SIGMAS['sG'], style_ref=sref)
    elif mode == 'mrall':        # the references-only method for every subject and seed, then ESRGAN to 4x (the l1 mode does the same for a lock tag)
        for it in sys.argv[2:]:
            for sd in SEEDS:
                run_whole(it, sd, 'mr', None, refs=True)
                up4_of(it, 'mr', sd)
    elif mode == 'norefs':       # the light init lock without any extra reference (what a roll-out without per-pose close-ups would be)
        for it in sys.argv[2:]:
            for sd in SEEDS:
                run_whole(it, sd, 'sGn', SIGMAS['sG'], refs=False)
    elif mode == 'facetest':     # the two candidate face passes on seed 9101 only
        for it in sys.argv[2:]:
            run_face(it, 9101, 'fa', None)
            run_face(it, 9101, 'fb', '0.935, 0.828, 0')
    elif mode == 'face':         # python lock_gpu.py face <tag> <item> ...   tag fa = pure, fb = locked at 0.935, fc = locked at 0.99
        sig = {'fa': None, 'fb': '0.935, 0.828, 0', 'fc': '0.99, 0.977, 0.935, 0.828, 0', 'fd': '0.97, 0.935, 0.828, 0', 'fe': '0.935, 0.828, 0', 'ff': '0.97, 0.935, 0.828, 0', 'fg': '0.99, 0.977, 0.935, 0.828, 0'}[sys.argv[2]]
        for it in sys.argv[3:]:
            for sd in SEEDS:
                run_face(it, sd, sys.argv[2], sig)


if __name__ == '__main__':
    main()
