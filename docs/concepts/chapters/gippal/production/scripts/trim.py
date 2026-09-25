import json, numpy as np
from PIL import Image
M = 24
out = {}
for k in ['gip-idle', 'gip-cast', 'bar-idle', 'bar-cast', 'nooj-idle', 'nooj-cast']:
    im = Image.open(f'work/final-{k}-b.png'); a = np.asarray(im.getchannel('A'))
    ys, xs = np.nonzero(a > 2)
    box = (max(0, xs.min() - M), max(0, ys.min() - M), min(im.width, xs.max() + 1 + M), min(im.height, ys.max() + 1 + M))
    t = im.crop(box); t.save(f'work/fin-{k}.png')
    aa = np.asarray(t.getchannel('A')) >= int(0.35 * 255)
    rows = np.nonzero(aa.sum(1) >= 3)[0]
    out[k] = {'size': t.size, 'baselineY': int(rows.max()), 'top': int(rows.min()), 'box': [int(v) for v in box]}
    print(k, out[k])
json.dump(out, open('work/fin-meta.json', 'w'), indent=1)
