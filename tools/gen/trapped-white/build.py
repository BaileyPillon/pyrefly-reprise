"""Build the trapped-white candidates (alpha-only edit, never touches public/art).

Output (OUT):  install-ready/public/art/characters/<subject>/<pose>.png  (changed files only)
               manifest.json, crops/<subject>-<pose>-<region>.png (before | after, 4x), SUMMARY.txt
Every pixel outside the cleared regions is byte-identical; a cleared pixel gets RGBA = (0,0,0,0).
"""
import sys, os, json, glob, hashlib, shutil
sys.path.insert(0, r"D:/Tools/pyrefly-scratch/2026-10-04/trapped-white/work")
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from detect import load, detect, select, detect_open, select_open

ART = r"D:/Final Fantasy/public/art/characters"
OUT = r"D:/Tools/pyrefly-art-backup/candidates/2026-10-04/trapped-white"
S8 = np.ones((3, 3), bool)

P_TIDUS = dict(CUT=228, SPREAD=22, MINA=40, MINTHICK=2.5, MINDARK=0.85)
P_BAH = dict(CUT=195, SPREAD=48, MINDARK=0.0, MINTHICK=2.5, MINA=30)

# Reviewed by eye (montages under work/): ids are component labels from detect() with the params above.
TIER1 = {
    'tidus/attack': dict(params=P_TIDUS, include=[26, 32, 66, 87]),
    'ffx2-bahamut/attack': dict(params=P_BAH, exclude=[]),
    'ffx2-bahamut/cast': dict(params=P_BAH, exclude=[28, 59]),      # 28 = the cast glow, 59 = a glint on the claw
    'ffx2-bahamut/hurt': dict(params=P_BAH, exclude=[]),
    'ffx2-bahamut/idle': dict(params=P_BAH, exclude=[80, 136]),     # 80 = gold neck plate, 136 = eye glint
    'ffx2-bahamut/telegraph': dict(params=P_BAH, exclude=[13, 264]),  # 13 = glow, 264 = unsure oval, left alone
    'ffx2-bahamut/ko': dict(params=P_BAH, exclude=[]),
    # 2x masters are detected on their own pixels (their alpha was refined separately from the 1x cut-out)
    'ffx2-bahamut/idle@2x': dict(params=P_BAH, exclude=[138, 199], scale=2),
    'ffx2-bahamut/telegraph@2x': dict(params=P_BAH, exclude=[31, 98], scale=2),
}
TIER2_POSES = ['attack', 'cast', 'critical', 'follow', 'hurt', 'idle', 'item', 'ko', 'od-energy-rain',
               'od-slice-and-dice', 'ready', 'sleep', 'victory']
TIER2_MAXAREA = 130   # white notches between hair-spike tips; anything bigger is painted cloth/skin/hair highlight
X2 = {'ffx2-bahamut/idle': 'ffx2-bahamut/idle@2x', 'ffx2-bahamut/telegraph': 'ffx2-bahamut/telegraph@2x'}


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def grow(mask, rgba, iters, cut, spread):
    mn = rgba[..., :3].min(2).astype(np.int16)
    sp = rgba[..., :3].max(2).astype(np.int16) - mn
    ok = (rgba[..., 3] > 8) & (mn >= cut) & (sp <= spread)
    m = mask.copy()
    for _ in range(iters):
        m = m | (ndi.binary_dilation(m, structure=S8) & ok)
    return m


def region_list(mask):
    lab, n = ndi.label(mask, structure=S8)
    return lab, [dict(box=[int(sl[1].start), int(sl[0].start), int(sl[1].stop), int(sl[0].stop)],
                      px=int((lab[sl] == i).sum())) for i, sl in enumerate(ndi.find_objects(lab), 1)]


def plan_1x(key):
    """Return (mask_core, mask_total, classes) for one 1x file."""
    f = f"{ART}/{key}.png"
    a = load(f)
    core = np.zeros(a.shape[:2], bool)
    classes = []
    t1 = TIER1.get(key)
    t1mask = np.zeros_like(core)
    if t1:
        sc = t1.get('scale', 1)
        lab, comps = detect(a, scale=sc, params=t1['params'])
        sel = select(comps, scale=sc, params=t1['params'])
        if 'include' in t1:
            sel = [c for c in sel if c['id'] in t1['include']]
        else:
            sel = [c for c in sel if c['id'] not in t1.get('exclude', [])]
        for c in sel:
            t1mask |= (lab == c['id'])
            classes.append(dict(cls='enclosed-white-wedge', id=c['id'], box=c['box'], px=c['area']))
        core |= t1mask
        t1mask = grow(t1mask, a, 2 * t1.get('scale', 1) if False else 2 + (1 if t1.get('scale', 1) > 1 else 0), 190, 48)
    t2mask = np.zeros_like(core)
    if key.startswith('tidus/') and key.split('/')[1] in TIER2_POSES:
        lab, comps = detect_open(a)
        sel = [c for c in select_open(comps) if c['area'] <= TIER2_MAXAREA]
        for c in sel:
            m = lab == c['id']
            if (m & t1mask).any():
                continue
            t2mask |= m
            classes.append(dict(cls='hair-tip-white-notch', id=c['id'], box=c['box'], px=c['area']))
        core |= t2mask
        t2mask = grow(t2mask, a, 1, 200, 34)
    return a, core, (t1mask | t2mask), classes


def apply(a, mask):
    b = a.copy()
    b[mask] = 0
    return b


def bbox(a):
    ys, xs = np.where(a[..., 3] > 8)
    return [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]


def crops(a, b, mask, key, outdir):
    lab, regs = region_list(ndi.binary_dilation(mask, structure=S8, iterations=3))
    files = []
    bgc = (20, 70, 90)
    for i, r in enumerate(regs, 1):
        x0, y0, x1, y1 = r['box']
        pad = 10
        x0 = max(0, x0 - pad); y0 = max(0, y0 - pad); x1 = min(a.shape[1], x1 + pad); y1 = min(a.shape[0], y1 + pad)
        z = max(1, min(8, 4 if max(x1 - x0, y1 - y0) < 160 else 2))
        z = 4
        if (x1 - x0) * z > 900:
            z = 2
        tiles = []
        for img in (a, b):
            im = Image.fromarray(img[y0:y1, x0:x1], 'RGBA')
            bg = Image.new('RGBA', im.size, bgc + (255,))
            bg.alpha_composite(im)
            tiles.append(bg.convert('RGB').resize((im.width * z, im.height * z), Image.NEAREST))
        w = tiles[0].width * 2 + 8
        sh = Image.new('RGB', (w, tiles[0].height + 14), (0, 0, 0))
        ImageDraw.Draw(sh).text((2, 1), f"{key} region {i} box {[x0, y0, x1, y1]} before | after (x{z})", fill=(255, 255, 0))
        sh.paste(tiles[0], (0, 14)); sh.paste(tiles[1], (tiles[0].width + 8, 14))
        fn = f"{key.replace('/', '-')}-r{i:02d}.png"
        sh.save(f"{outdir}/{fn}")
        files.append(fn)
    return files


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(f"{OUT}/crops")
    manifest = dict(created='2026-10-04', game='FFX (Tidus) + FFX-2 (Bahamut)', rule=(
        'alpha-only: pixels inside the listed regions get RGBA (0,0,0,0); every other pixel is byte-identical. '
        'enclosed-white-wedge = pure/pale white component not connected to the outside, bounded by ink or a hole; '
        'hair-tip-white-notch = small white notch between blonde hair-spike tips that the 244/10 border flood left.'),
        files=[])
    total_px = 0
    for key in sorted(set(list(TIER1) + [f"tidus/{p}" for p in TIER2_POSES])):
        a, core, mask, classes = plan_1x(key)
        if not mask.any():
            print(key, 'no change'); continue
        b = apply(a, mask)
        src = f"{ART}/{key}.png"
        dst_rel = f"public/art/characters/{key}.png"
        os.makedirs(os.path.dirname(f"{OUT}/install-ready/{dst_rel}"), exist_ok=True)
        Image.fromarray(b, 'RGBA').save(f"{OUT}/install-ready/{dst_rel}", optimize=True)
        diff = np.any(a != b, axis=2)
        assert (a[~mask] == b[~mask]).all()
        bb0, bb1 = bbox(a), bbox(b)
        ent = dict(file=dst_rel, oldSha256=sha(src), newSha256=sha(f"{OUT}/install-ready/{dst_rel}"),
                   changedPixels=int(diff.sum()), size=[a.shape[1], a.shape[0]], opaqueBBoxBefore=bb0, opaqueBBoxAfter=bb1,
                   bboxUnchanged=(bb0 == bb1), regions=classes, crops=crops(a, b, mask, key, f"{OUT}/crops"))
        manifest['files'].append(ent)
        total_px += ent['changedPixels']
        print(key, 'changed', ent['changedPixels'], 'regions', len(classes), 'bbox same', bb0 == bb1, flush=True)
    manifest['totalChangedPixels'] = total_px
    json.dump(manifest, open(f"{OUT}/manifest.json", 'w'), indent=1)
    print('files', len(manifest['files']), 'pixels', total_px)


if __name__ == '__main__':
    main()
