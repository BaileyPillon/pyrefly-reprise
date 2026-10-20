"""cp.py <out.png> <pose[,pose..]> <rigdir[=label]> ... [--tile 640] [--crop x0,y0,x1,y1] [--nopaint] : per pose a row: the painting (registered into the master frame) then each rig's key, same camera. Env XID, XWORK."""
import sys
import pathlib
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from xl import *

a = sys.argv[1:]
out, poses = a[0], a[1].split(',')
tile = int(a[a.index('--tile') + 1]) if '--tile' in a else 640
crop = tuple(int(v) for v in a[a.index('--crop') + 1].split(',')) if '--crop' in a else None
skip = set()
for i, x in enumerate(a):
    if x in ('--tile', '--crop'):
        skip.add(i + 1)
specs = [x for i, x in enumerate(a[2:], 2) if not x.startswith('--') and i not in skip]
rigs = []
for s in specs:
    d, _, lab = s.partition('=')
    rigs.append((d, lab or pathlib.Path(d).name))
W, H = rig_size()
PAD = 500
rows = []
loaded = [(lab,) + load_model(d) for d, lab in rigs]
for pose in poses:
    p = painting_in_master(pose, pad=PAD)
    box = (crop[0] + PAD, crop[1] + PAD, crop[2] + PAD, crop[3] + PAD) if crop else (0, 0, W + 2 * PAD, H + 2 * PAD)
    ims = [] if '--nopaint' in a else [('painting ' + pose, over(BG, p.crop(box)))]
    for lab, rig, T2, model in loaded:
        pose_key(model, rig, rig['keys'][pose])
        r = render_pose(model, W, H, pad=PAD)
        ims.append((lab + ' ' + pose, over(BG, r.crop(box))))
    row = []
    for lab, im in ims:
        im = im.resize((int(im.width * tile / im.height), tile), Image.LANCZOS)
        ImageDraw.Draw(im).text((6, 4), lab, fill=(255, 255, 0))
        row.append(im)
    s = Image.new('RGB', (sum(i.width for i in row) + 8 * (len(row) - 1), tile), (20, 20, 24))
    x = 0
    for im in row:
        s.paste(im, (x, 0))
        x += im.width + 8
    rows.append(s)
sheet = Image.new('RGB', (max(r.width for r in rows), sum(r.height for r in rows) + 8 * (len(rows) - 1)), (20, 20, 24))
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height + 8
sheet.save(out)
print(sheet.size)
