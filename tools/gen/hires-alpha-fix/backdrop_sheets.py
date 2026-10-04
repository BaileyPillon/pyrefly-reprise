"""Contact sheets of the backdrop 2x masters: the worst structural-difference window of each, approved (bicubic up) beside the master, 1:1."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import alphafix as af

Image.MAX_IMAGE_PIXELS = None
ART = 'D:/pyrefly-r39-int/public/art'
OUT = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-repair/backdrops'
man = json.load(open(f'{ART}/manifest.json', encoding='utf8'))
keys = sorted(man['backdropTiers'].keys())
WW, WH = 560, 340
panels = []
for key in keys:
    A = Image.open(f'{ART}/backdrops/{key}.png').convert('RGB')
    mp = f'{ART}/backdrops/{key}@2x.png'
    M = Image.open(mp).convert('RGB')
    W, H = M.size
    Aup = A.resize((W, H), Image.BICUBIC)
    ga = np.asarray(Aup.convert('L'), np.float32)
    gm = np.asarray(M.convert('L'), np.float32)
    # local structure difference at the master's scale: SSIM over 7x7 windows, averaged on a 140-px grid
    s = af.ssim(ga, gm, 7)
    h, w = s.shape
    cell = 140
    gh, gw = h // cell, w // cell
    cm = s[:gh * cell, :gw * cell].reshape(gh, cell, gw, cell).mean(axis=(1, 3))
    # texture present in the approved painting (not a flat sky): local gradient energy
    gy, gx = np.gradient(ga)
    energy = (gx * gx + gy * gy)[:gh * cell, :gw * cell].reshape(gh, cell, gw, cell).mean(axis=(1, 3))
    score = cm.copy()
    score[energy < 2.0] = 9
    # window of 4 x 2.4 cells: choose the lowest mean
    best, by, bx = 9, 0, 0
    for yy in range(0, gh - 2):
        for xx in range(0, gw - 3):
            sc = score[yy:yy + 2, xx:xx + 4].mean()
            if sc < best:
                best, by, bx = sc, yy * cell, xx * cell
    box = (bx, by, min(W, bx + WW), min(H, by + WH))
    pa, pm = Aup.crop(box), M.crop(box)
    sheet = Image.new('RGB', (WW * 2 + 10, WH + 18), (24, 24, 24))
    sheet.paste(pa, (0, 18))
    sheet.paste(pm, (WW + 10, 18))
    d = ImageDraw.Draw(sheet)
    d.text((4, 3), f'{key}  approved bicubic-up | master 2x   window {box}  local ssim {best:.3f}', fill=(230, 230, 230))
    panels.append(sheet)
per = 4
for i in range(0, len(panels), per):
    grp = panels[i:i + per]
    H = sum(p.height + 6 for p in grp)
    sh = Image.new('RGB', (grp[0].width, H), (10, 10, 10))
    y = 0
    for p in grp:
        sh.paste(p, (0, y))
        y += p.height + 6
    sh.save(f'{OUT}/sheet-{i // per + 1:02d}.png')
    print('sheet', i // per + 1, [k for k in keys[i:i + per]])
