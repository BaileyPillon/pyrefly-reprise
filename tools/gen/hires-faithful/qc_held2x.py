import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
sys.path.insert(0, 'D:/pyrefly-r39-art/tools/gen/hires-alpha-fix')
from r39lib import *
import alphafix as af
import qc
HELD = 'D:/Tools/pyrefly-art-backup/approved/2026-10-01-art/held-2x/characters'
for s in ['rikku-dark-knight', 'x2-anima']:
    P = af.load_rgba(f'{ART}/characters/{s}/idle.png')
    for lab, path in (('held D-315 master', f'{HELD}/{s}/idle@2x.png'), ('installed library 2x', f'{ART}/characters/{s}/idle@2x.png')):
        M = af.load_rgba(path)
        m = af.metrics(P, M, 2)
        q = qc.likeness(Image.open(f'{ART}/characters/{s}/idle.png').convert('RGBA'), Image.open(path).convert('RGBA'))
        say(f'{s} {lab}: rim bias {m.get("rim_bias"):.2f} mad {m.get("rim_mad"):.2f} specks {m.get("rim_specks")} alpha_iou {m.get("alpha_iou"):.4f} ssim_gray {m.get("ssim_gray"):.4f} | qc ssim {q["ssim"]} dE {q["dE_mean"]} p95 {q["dE_p95"]} edge {q["edge_corr"]} iou {q["alpha_iou"]} flags {qc.judge(q, "figure")}')
