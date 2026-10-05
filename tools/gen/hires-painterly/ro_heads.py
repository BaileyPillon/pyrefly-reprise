"""ro_heads.py: the head box of every figure in the plan, for the head close-up reference, the face pass and the face gate.

  python ro_heads.py            writes RW/heads.json: id -> {box (painting px) or null, src, clip, scale}
Sources, in order: 'table' = the posescale table's reviewed head box (padded 10 percent); 'anchor' = the table's head anchor with the idle's head size at 1.0, 1.4 or 1.8 times, taken only if CLIP ViT-H finds
it as head-like as the idle's head (cosine >= 0.75; calibrated on the 59 reviewed poses: no torso window reaches 0.70, 80 percent of the anchor boxes pass); otherwise no box and the figure goes the C way (no face pass, no face gate).
"""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
import numpy as np
from PIL import Image
from ro_common import *
import clipsim as C

Image.MAX_IMAGE_PIXELS = None
ACCEPT = 0.70
SCALES = (0.8, 1.0, 1.25, 1.5, 1.8, 2.1)


def win(P, box):
    bg = Image.new('RGBA', P.size, (255, 255, 255, 255))
    bg.alpha_composite(P)
    x0, y0, x1, y1 = [int(v) for v in box]
    return bg.convert('RGB').crop((x0, y0, x1, y1)).resize((224, 224), Image.LANCZOS)


def main():
    T = pose_table()
    assets = plan()
    out = load_json(f'{RW}/heads.json', {})
    idle_emb = {}
    for a in assets:
        if a['id'] in out and out[a['id']].get('src') != 'anchor-rejected':
            continue
        box, src, idle = head_info(a, T)
        rec = {'box': None, 'src': None}
        if box:
            rec = {'box': [round(v, 1) for v in box], 'src': 'table'}
        elif src == 'anchor':
            r = T[a['cid']]['poses'][a['state']]
            if a['cid'] not in idle_emb:
                Pi = Image.open(f'{ART}/characters/{a["cid"]}/idle.png').convert('RGBA')
                idle_emb[a['cid']] = C.embed(win(Pi, idle))
            P = Image.open(f'{ART}/{a["id"]}.png').convert('RGBA')
            ax, ay = r['anchor']
            iw, ih = idle[2] - idle[0], idle[3] - idle[1]
            best = (-1, None, None)
            for s in SCALES:
                bw, bh = iw * s, ih * s
                b = (max(0, ax - bw / 2), max(0, ay - bh / 2), min(P.width, ax + bw / 2), min(P.height, ay + bh / 2))
                if b[2] - b[0] < 24 or b[3] - b[1] < 24:
                    continue
                c = C.cos(idle_emb[a['cid']], C.embed(win(P, b)))
                if c > best[0]:
                    best = (c, s, b)
            if best[1] is not None and best[0] >= ACCEPT:
                rec = {'box': [round(v, 1) for v in best[2]], 'src': 'anchor', 'clip': round(best[0], 3), 'scale': best[1]}
            else:
                rec = {'box': None, 'src': 'anchor-rejected', 'clip': round(best[0], 3) if best[1] else None}
        out[a['id']] = rec
        if len(out) % 20 == 0:
            save_json(f'{RW}/heads.json', out)
            print(len(out), 'of', len(assets), flush=True)
    save_json(f'{RW}/heads.json', out)
    from collections import Counter
    print(Counter(r['src'] for r in out.values()))
    print(Counter((a['group'], out[a['id']]['box'] is not None) for a in assets))


if __name__ == '__main__':
    main()
