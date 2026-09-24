"""Assemble one candidate (FFX only): the picked file, its painted mask (the repaint mask exactly as repaint.py
built it: hole dilated, opaque, minus the protected moved part), gates and a CANDIDATE sidecar.
usage: assemble.py <subject> <pose> <picked.png> <draft_prefix|-> <dilate> <outdir> '<method>'"""
import sys, os, subprocess, shutil, numpy as np, cv2
subj, pose, picked, draft, dil, outdir, method = sys.argv[1:8]
dil = int(dil)
HERE = os.path.dirname(os.path.abspath(__file__)); PY = sys.executable
os.makedirs(f'{outdir}/{subj}', exist_ok=True)
dst = f'{outdir}/{subj}/{pose}.png'; shutil.copyfile(picked, dst)
paint = '-'
if draft != '-':
    im = cv2.imread(f'{draft}.png', -1); hole = cv2.imread(f'{draft}.hole.png', 0) > 0
    prot = cv2.imread(f'{draft}.protect.png', 0) > 0
    m = cv2.dilate(hole.astype(np.uint8), np.ones((2 * dil + 1, 2 * dil + 1), np.uint8)) > 0
    m &= (im[..., 3] > 127) & ~prot
    paint = f'{outdir}/{subj}/{pose}.painted.png'; cv2.imwrite(paint, m.astype(np.uint8) * 255)
idle = f'D:/Final Fantasy/public/art/characters/{subj}/idle.png'
g = f'{outdir}/{subj}/{pose}.gates.json'
subprocess.run([PY, f'{HERE}/gates.py', idle, dst, paint, g], check=True)
subprocess.run([PY, f'{HERE}/sidecar.py', subj, pose, dst, f'{outdir}/{subj}/{pose}.json', method, g], check=True)
