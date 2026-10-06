"""ro_pilot_light.py: the D-light pilot (driver, 2026-10-05): Tidus idle and attack, seed 9101, today | D | D-light | B at battle size, head and close-ups at 100 percent, with the gate numbers.
D = face pass + init lock 0.99 + palette lock 0.9 (dark regions counted); D-light = the same with the palette lock at half strength (0.45, lightness 0.5, caps 14/22) and the dark-region pull dropped (dark floor 0);
B = init lock only (no face pass, no palette lock)."""
import sys, json
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from ro_common import *
import ro_cpu, ro_gpu, ro_view
from PIL import Image
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-05-painterly-cast/pilot-d-light'
VAR = {'D': dict(face=True, pal=True),
       'D-light': dict(face=True, pal=dict(strength=0.45, lam_l=0.5, dmax=(14.0, 22.0), dark_floor=0.0)),
       'B': dict(face=False, pal=False)}
heads = load_json(f'{RW}/heads.json')
res = {}
for i in ('characters/tidus/idle', 'characters/tidus/attack'):
    a = [x for x in plan() if x['id'] == i][0]
    head = (heads.get(i) or {}).get('box')
    ro_gpu.gpu_stage(a, 9101, head)
    wd = f'{RW}/{i}'
    P = ro_cpu.approved1x(a); Tm = ro_cpu.today(a); S = a['S']
    kw = Image.open(f'{wd}/klein-s9101.png').convert('RGB')
    raw, core = ro_cpu.matte_iou(kw, P); iou = max(raw, core)
    rgb = Image.open(f'{wd}/rgb-s9101.png').convert('RGB')
    rgb_d = ro_cpu.composite_face(rgb, Image.open(f'{wd}/face-s9101.png').convert('RGB'), head, S)
    os.makedirs(f'{OUT}/masters/{i}', exist_ok=True)
    cols = []
    res[i] = {'iou_raw': round(raw, 4), 'iou_core': round(core, 4)}
    for name, v in VAR.items():
        M = ro_cpu.build_master(rgb_d if v['face'] else rgb, Tm, P, S, pal=v['pal'])
        g = ro_cpu.gates(Tm, M, S, iou, head)
        res[i][name] = g
        p = f'{OUT}/masters/{i}/{name}@4x.png'
        M.save(p, compress_level=3)
        cols.append((f'{name}  cells {g["cells_over20"] * 100:.1f}%  face {g.get("head_struct")}  iou {g["iou"]}', p))
    ro_view.view(i, f'{OUT}/sheets/{i.split("/")[-1]}.jpg', cols, h_fig=620, h_crop=300)
    json.dump(res, open(f'{OUT}/gates.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
