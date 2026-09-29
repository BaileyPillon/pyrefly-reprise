"""Sin production art (FFX only, 2026-09-29): the picked creatures in the shipped layout, staged under
<SCRATCH>/stage/ as a mirror of public/art/ (install.py copies them in once the public/art gate is open).

  characters/sin-left-fin/   idle-near, charge-near, idle-far, charge-far, idle (= idle-near, as Evrae's idle)
  characters/sin-right-fin/  the same; its own painting, never a mirror of the left (plan Q14)
  characters/sinspawn-genais/ idle (out of the shell), shell (in it)
  characters/sin-core/       idle (at rest, "Core is inactive."), charge ("Core gathers energy.")
  characters/overdrive-sin/  stage-0 .. stage-4 (the jaw clock, round 3's rig with the C repairs), idle (= stage-0)
  portraits/<enemy id>.png   the turn-order chip for each foe, 832x1216 like every portrait

Inputs: the SAM cuts (cut.py, cuts.json) and head C's rig layers. The light states are compose.py's (dim, charge),
applied to the cut-out. Every state of one subject shares one crop box, so a state swap never shifts the sprite.

  python_embeded/python.exe -s produce.py
"""
import json
import math
import os
import shutil

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

HEAD = f'{C.CAND}/head-c/rig'
RIG_JSON = f'{C.R3}/sketches/rig.json'


def fin_states(cut_near, cut_far, core_near, core_far, far_has_core):
    n = C.load(f'{C.CUT}/{cut_near}.full.png')
    f = C.load(f'{C.CUT}/{cut_far}.full.png')
    cn = C.find_core(n, *core_near, 0.07)
    rn = 0.06 * C.W
    cf = C.find_core(f, *core_far, 0.03) if far_has_core else core_far
    rf = 0.02 * C.W
    near = {'idle-near': (C.dim(n, cn, rn), {'light': 'dim', 'core': cn, 'radius': rn}),
            'charge-near': (C.glow(n, cn, rn), {'light': 'charge', 'core': cn, 'radius': rn})}
    far = {'idle-far': ((C.dim(f, cf, rf) if far_has_core else f),
                        {'light': 'dim' if far_has_core else None, 'core': cf, 'radius': rf}),
           'charge-far': (C.glow(f, cf, rf), {'light': 'charge', 'core': cf, 'radius': rf})}
    return near, far


def head_stages():
    """Round 3's rig with head C's repairs (repair.py rig), composed WITHOUT the plate and the deck: the throat masked
    by the mouth wedge, the hinge, the jaw turned back about the hinge and clipped under the skull, the top, and at
    stage 0 the shut seam. The top layer's edge carried the dusk sky of round 3's plate p6: defringed from its own
    opaque pixels and pulled in 1 px, like the jaw's edge."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('repair', os.path.join(C.HERE, '..', 'head', 'src', 'repair.py'))
    rp = importlib.util.module_from_spec(spec); spec.loader.exec_module(rp)
    R = json.load(open(RIG_JSON)); out = json.load(open(f'{HEAD}/rig-out.json'))
    hg = out['hinge']; turns = out['jawTurnBackDeg']
    L = {k: Image.open(f'{HEAD}/{k}.png').convert('RGBA') for k in ('L1-throat', 'L1b-hinge', 'L2-jaw', 'L3-top', 'L2s-shut-seam')}
    clip = np.asarray(Image.open(f'{HEAD}/clip.png').convert('L'), float) / 255
    size = (C.W, C.H); ul = [tuple(p) for p in R['upperLip']]; lipo = R['lowerLipOpen']
    stages = {}
    for k, t in enumerate(turns):
        im = Image.new('RGBA', size, (0, 0, 0, 0))
        c, s_ = math.cos(math.radians(t)), math.sin(math.radians(t))
        turned = [(hg[0] + (x - hg[0]) * c - (y - hg[1]) * s_, hg[1] + (x - hg[0]) * s_ + (y - hg[1]) * c) for x, y in lipo]
        wedge = np.zeros(size[::-1]) if k == 0 else rp.poly(size, [(ul[0][0] - 90, ul[0][1])] + ul + turned[::-1] + [(turned[0][0] - 90, turned[0][1])], 4, 1.0)
        th = L['L1-throat'].copy()
        th.putalpha(Image.fromarray((np.asarray(th.split()[3], float) * wedge).astype(np.uint8)))
        im.alpha_composite(th); im.alpha_composite(L['L1b-hinge'])
        jw = L['L2-jaw'].rotate(-t, resample=Image.BICUBIC, center=tuple(hg))
        jw.putalpha(Image.fromarray((np.asarray(jw.split()[3], float) * clip).astype(np.uint8)))
        im.alpha_composite(jw); im.alpha_composite(L['L3-top'])
        if k == 0:
            im.alpha_composite(L['L2s-shut-seam'])
        a = np.asarray(im, float)
        al = ndi.grey_erosion(a[..., 3] / 255, size=(3, 3))
        al = np.where(al < 0.04, 0, al)
        # round 3's difference matte let translucent sky between the feathers through: soft alpha survives only within
        # a few px of the solid body, so no patch of p6's sky rides over another backdrop
        dist = ndi.distance_transform_edt(al < 0.9)
        al = al * np.clip(1 - (dist - 3) / 4, 0, 1)
        rgb = defringe(a[..., :3], al)
        stages[f'stage-{k}'] = (np.dstack([rgb, al * 255]), {'jawTurnBackDeg': t, 'mouthStage': k})
    return stages


def defringe(rgb, a, r=4.0):
    solid = (a > 0.97).astype(float)
    den = ndi.gaussian_filter(solid, r)
    num = np.dstack([ndi.gaussian_filter(rgb[..., i] * solid, r) for i in range(3)])
    edge = np.where(den[..., None] > 0.02, num / np.maximum(den, 1e-3)[..., None], rgb)
    return np.where(((a > 0) & (a < 0.97))[..., None], edge, rgb)


def emit(key, states, painting, extra, rngs):
    """Crop every state of one subject to one shared box, write PNG + sidecar, return the records."""
    box = C.pad(C.union(*(C.bbox(arr[..., 3]) for arr, _ in states.values())))
    recs = []
    ref = np.clip(next(iter(states.values()))[0][box[1]:box[3], box[0]:box[2], 3], 0, 255).astype(np.uint8)
    ref_y = int(np.nonzero((ref > 8).any(axis=1))[0].max())
    for pose, (arr, light) in states.items():
        crop = arr[box[1]:box[3], box[0]:box[2]]
        path = f'{C.STAGE}/characters/{key}/{pose}.png'
        C.save_rgba(crop, path)
        a = np.clip(crop[..., 3], 0, 255).astype(np.uint8)  # measured as saved
        rows = np.nonzero((a > 8).any(axis=1))[0]
        auto_y = int(rows.max())
        base_y = ref_y  # one baseline per subject: same crop + same baseline = a state swap never moves the sprite
        ob = C.bbox(arr[..., 3])
        light_px = None
        if light.get('light'):
            light_px = {'kind': light['light'], 'centre': [round(light['core'][0] * C.W - box[0], 1), round(light['core'][1] * C.H - box[1], 1)],
                        'radius': round(light['radius'], 1), 'method': 'compose.py light state over the one painting (no new pixels painted)'}
        rng = rngs.get(pose)
        stem = painting[pose] if isinstance(painting, dict) else painting
        pv = C.prov(extra.get('provStem', stem))
        side = {
            'width': int(crop.shape[1]), 'height': int(crop.shape[0]), 'baselineY': base_y, **({'baselineYAuto': auto_y, 'baselineNote': "Set to the subject's first state's baseline so a state swap never moves the sprite (the glow halo or the lowered jaw reaches lower)"} if auto_y != base_y else {}),
            'cropBox': list(box), 'source': {'width': C.W, 'height': C.H},
            'bleeds': C.bleeds(ob),
            'frameFraction': {'x0': round(ob[0] / C.W, 4), 'y0': round(ob[1] / C.H, 4), 'x1': round(ob[2] / C.W, 4), 'y1': round(ob[3] / C.H, 4)},
            'facing': 'front',
            'facingNote': 'Painted into its plate, so never mirrored: "front" is the one ArtFacing mirrorFor never flips. The Right Fin is its own painting (plan Q14).',
            'pose': pose, 'state': light.get('state', pose),
            'light': light_px, **({'rig': {k: v for k, v in light.items() if k in ('jawTurnBackDeg', 'mouthStage')}} if 'mouthStage' in light else {}),
            'staging': C.staging(base_y, rng) if rng else None,
            'seed': pv.get('seed'), 'prompt': pv.get('positive'), 'engine': 'z_image_turbo (zimg), masked repaint into its plate, RealESRGAN x4 + masked detail pass at 2352x1344',
            'denoise': pv.get('denoise'), 'detailPass': pv.get('detailPass'),
            'painting': extra.get('paintingPath', f'{C.CAND}/{stem}.full.png'),
            'cut': extra['cut'], 'origin': C.ORIGIN, 'retailInput': 'none',
            'status': C.STATUS, 'game': C.GAME, 'decision': 'D-279', 'pickedFrom': extra['picked'],
            'optionsRound': 'docs/concepts/chapters/sin-2026-09-29/README.md, options.html',
            'production': 'docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md',
        }
        C.write_json(path[:-4] + '.json', side)
        C.jpeg_check(crop, f'{C.SCRATCH}/checks/{key}--{pose}.jpg', 700)
        recs.append((key, pose, side))
        print(key, pose, crop.shape[1], 'x', crop.shape[0], 'baseline', base_y, 'bleeds', side['bleeds'])
    return box


FIN_CUT = ('SAM 2.1 small (tools/gen/rig-sam.py loader) prompted by install/cuts.json, cut by the repaint mask, holes '
           'filled, edge snapped by a guided filter, pulled in 2 px and defringed from its own pixels (install/cut.py)')


def main():
    os.makedirs(f'{C.SCRATCH}/checks', exist_ok=True)
    boxes = {}
    for side_, key, cn, cf, far_core, pn, pf in [
            ('left', 'sin-left-fin', (0.875, 0.60), (0.715, 0.36), False, 'fins/fin-a-l-near-3', 'fins/fin-a-l-far-2'),
            ('right', 'sin-right-fin', (0.845, 0.16), (0.806, 0.345), True, 'fins/fin-a-r-near-1', 'fins/fin-a-r-far-2')]:
        near, far = fin_states(f'{side_}-fin-near', f'{side_}-fin-far', cn, cf, far_core)
        extra = {'cut': FIN_CUT, 'picked': f'Fin option A ({side_}), the clawed arm with a ribbed fin; NEAR {pn.split("/")[1]}, FAR {pf.split("/")[1]} (make_frames.py PICKS)'}
        near['idle'] = (near['idle-near'][0], {**near['idle-near'][1], 'state': 'idle (= idle-near, as Evrae)'})
        boxes[key + ':near'] = emit(key, near, {p: pn for p in near}, extra, {p: 'near' for p in near})
        boxes[key + ':far'] = emit(key, far, {p: pf for p in far}, extra, {p: 'far' for p in far})
    g_out = C.load(f'{C.CUT}/genais-out.full.png'); g_sh = C.load(f'{C.CUT}/genais-shell.full.png')
    boxes['sinspawn-genais'] = emit('sinspawn-genais', {'idle': (g_out, {'state': 'out of the shell'}), 'shell': (g_sh, {'state': 'in the shell ("Enters shell.")'})},
                                    {'idle': 'link3/genais-a-4', 'shell': 'link3/genais-a-4-shell-1'},
                                    {'cut': FIN_CUT, 'picked': 'Genais option A, the craggy dome shell (genais-a-4, shell genais-a-4-shell-1)'}, {'idle': 'near', 'shell': 'near'})
    core = C.load(f'{C.CUT}/core.full.png')
    cc = C.find_core(core, 0.78, 0.25, 0.07); rc = 0.07 * C.W
    boxes['sin-core'] = emit('sin-core', {'idle': (C.dim(core, cc, rc), {'light': 'dim', 'core': cc, 'radius': rc, 'state': 'at rest ("Core is inactive.")'}),
                                          'charge': (C.glow(core, cc, rc), {'light': 'charge', 'core': cc, 'radius': rc, 'state': 'gathering ("Core gathers energy.")'})},
                             'link3/genais-a-4', {'cut': FIN_CUT + '; the hump kept by install/cuts.json "keep" (Genais drops the same polygon)',
                                                  'picked': 'Core option A, the dark pearl in a hump of scales (painted with Genais A in genais-a-4)'}, {'idle': 'near', 'charge': 'near'})
    st = head_stages()
    st['idle'] = (st['stage-0'][0], {**st['stage-0'][1], 'state': 'idle (= stage-0, the mouth shut)'})
    boxes['overdrive-sin'] = emit('overdrive-sin', st, {p: 'head-c/b1-c2' for p in st},
                                  {'cut': "head C's rig layers (candidates head-c/rig: L1 throat, L1b hinge, L2 jaw, L3 top, L2s shut seam) composed without L0 plate and L4 deck; edge defringed, pulled in 1 px",
                                   'paintingPath': f'{C.CAND}/head-c/b1-c2.png (round 3 sin/b1 -> fix/b1-final -> head C repairs b1-c1, b1-c1s, b1-c2)', 'provStem': f'{C.R3}/sin/b1',
                                   'picked': "Head option C repaired (round 3's layered jaw rig, five mouth stages; head/README.md)"}, {p: 'far' for p in st})
    C.write_json(f'{C.SCRATCH}/boxes.json', boxes)


if __name__ == '__main__':
    main()
