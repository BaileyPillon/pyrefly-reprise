"""Sin production art (FFX only, 2026-09-29): the three backdrops, the two pause hero plates, the five turn-order
portraits, and the chapter-card previews, all from the picked paintings (no new subject, no new pixels painted).

  backdrops/sin-fahrenheit-flight.png   links I-II: late afternoon over the cloud sea (plates/flight-1)
  backdrops/sin-back.png                link III: Sin's back at sunset (plates/back-1)
  backdrops/sin-fahrenheit-bevelle.png  link IV: golden dusk over Bevelle, the Evrae layout (backdrop/bk-a-8)
      2352x1344 masters -> 2688x1536 (lanczos, the size and aspect of every backdrop plate), opaque PNG
  pause/ch17-sin-fins-core.png + .2x.webp   the Left Fin at NEAR, "Core gathers energy." (the concept frame's states)
  pause/ch18-sin-face.png + .2x.webp        head C at stage 3 on its own rig plate (p6, the claw on the tower)
      1344x768 PNG + 2688x1536 webp q88, like every pause plate
  portraits/<enemy id>.png                  832x1216 RGBA crops of the installed idle states (the CTB chip)
  install/cards/*.jpg (docs, not installed) what chapterPlates.ts's CSS composition would show on the card and plate

  python_embeded/python.exe -s plates.py      (after produce.py)
"""
import importlib.util
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

BACKDROPS = {
    'sin-fahrenheit-flight': ('plates/flight-1', "links I and II: the Fahrenheit's foredeck in late afternoon over the cloud sea, on the way to Bevelle (research/ffx-sin.md 9.1)",
                              'flight-1: KEPT, the links I-II plate (sheet.json method section)'),
    'sin-back': ('plates/back-1', "link III: on Sin's back at sunset, the ship small in the sky (research/ffx-sin.md 9.1, [single source])",
                 "back-1: KEPT, the link III plate (sheet.json method section)"),
    'sin-fahrenheit-bevelle': ('backdrop/bk-a-8', 'link IV: looking up past the hull at golden dusk, Bevelle small and far below (the Evrae layout; the engine rolls it 11.6 degrees and draws the deck)',
                               'link IV backdrop option A, golden dusk, render bk-a-8 (the city v4 method check; README "Passes" 9-10)'),
}


def backdrops():
    for key, (stem, what, picked) in BACKDROPS.items():
        src = f'{C.CAND}/{stem}.full.png'
        im = Image.open(src).convert('RGB').resize((2688, 1536), Image.LANCZOS)
        out = f'{C.STAGE}/backdrops/{key}.png'
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im.save(out, optimize=True)
        pv = C.prov(stem)
        C.write_json(out[:-4] + '.json', {
            'subject': what, 'seed': pv.get('seed'), 'prompt': pv.get('positive'),
            'engine': 'z_image_turbo (zimg): ' + ('whole-frame img2img from our code-drawn sketch' if pv.get('mode') == 'whole' else 'masked repaint into our own earlier plate'),
            'denoise': pv.get('denoise'), 'detailPass': pv.get('detailPass'),
            'canvas': {'width': 1344, 'height': 768}, 'master': {'file': src, 'width': C.W, 'height': C.H},
            'route': 'the picked 2352x1344 master (RealESRGAN x4 + masked detail pass) -> lanczos to 2688x1536',
            'rolled': False, 'origin': C.ORIGIN, 'retailInput': 'none', 'status': C.STATUS, 'game': C.GAME,
            'decision': 'D-279', 'pickedFrom': picked, 'optionsRound': 'docs/concepts/chapters/sin-2026-09-29/README.md',
            'production': 'docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md'})
        print('backdrop', key)


def compose_mod():
    spec = importlib.util.spec_from_file_location('compose', os.path.join(C.HERE, '..', 'src', 'compose.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def pause_plate(key, master, focal, meta):
    out = f'{C.STAGE}/pause/{key}'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    master.resize((1344, 768), Image.LANCZOS).save(out + '.png', optimize=True)
    master.resize((2688, 1536), Image.LANCZOS).save(out + '.2x.webp', quality=88, method=6)
    C.write_json(out + '.json', {**meta, 'focal': {'x': round(focal[0], 3), 'y': round(focal[1], 3)},
                                 'master': {'file': f'{key}.2x.webp', 'width': 2688, 'height': 1536,
                                            'route': 'the picked 2352x1344 painting -> lanczos 2688x1536', 'webpQuality': 88,
                                            'note': 'The PNG is the same composition at 1344x768 (lanczos).'},
                                 'origin': C.ORIGIN, 'retailInput': 'none', 'status': C.STATUS, 'game': C.GAME, 'decision': 'D-279'})
    print('pause', key)


def pause_plates():
    cm = compose_mod()
    im = Image.open(f'{C.CAND}/fins/fin-a-l-near-3.full.png').convert('RGB')
    dk = Image.open(cm.DECK).convert('RGBA')
    a = np.asarray(dk, float)
    a[..., :3] = a[..., :3] * np.linspace(0.86, 0.58, a.shape[1])[None, :, None] * np.array((0.94, 0.96, 1.04))
    base = im.convert('RGBA'); base.alpha_composite(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA'))
    c = cm.find_core(np.asarray(base.convert('RGB')), 0.875, 0.60)
    fin = cm.glow(base.convert('RGB'), c, 0.06 * C.W, 0.95)
    pause_plate('ch17-sin-fins-core', fin, (0.80, 0.35), {
        'subject': 'The Left Fin over the Fahrenheit\'s rail at NEAR, its core charging ("Core gathers energy.")',
        'mood': 'the arm reaching over the deck, Gravija one turn away',
        'composite': "compose.py's states over the picked painting fin-a-l-near-3: round 3's dressed deck layer, the NEAR shade, the charge glow",
        'chapter': "Chapter XVII Sin: the Fins and the Core (sin-fins-core)", 'painting': f'{C.CAND}/fins/fin-a-l-near-3.full.png'})
    head = Image.open(f'{C.CAND}/head-c/rig/stage-3.png').convert('RGB')
    pause_plate('ch18-sin-face', head, (0.60, 0.28), {
        'subject': "Sin's head over the deck above Bevelle, the mouth three stages open",
        'mood': 'the clock nearly run out',
        'composite': "head C's own rig composite at stage 3 (round 3's plate p6 with its dressed deck; the claw on the white tower)",
        'chapter': 'Chapter XVIII Sin: the Face (sin-face)', 'painting': f'{C.CAND}/head-c/rig/stage-3.png'})


def blob_centre(rgba, test):
    m = test(rgba[..., 0], rgba[..., 1], rgba[..., 2]) & (rgba[..., 3] > 200)
    lab, n = ndi.label(m)
    if not n:
        return None
    sizes = ndi.sum(m, lab, range(1, n + 1)); i = int(np.argmax(sizes)) + 1
    ys, xs = np.nonzero(lab == i)
    return float(xs.mean()), float(ys.mean())


def full_frame(key, pose):
    side = json.load(open(f'{C.STAGE}/characters/{key}/{pose}.json'))
    crop = C.load(f'{C.STAGE}/characters/{key}/{pose}.png')
    ff = np.zeros((C.H, C.W, 4)); b = side['cropBox']
    ff[b[1]:b[3], b[0]:b[2]] = crop
    return ff


def portraits():
    rows = {}
    amber = lambda r, g, b: (r > 190) & (g > 110) & (g < 200) & (b < 90)
    red = lambda r, g, b: (r > 170) & (g < 70) & (b < 70)
    spec = {  # enemy id: (sprite key, pose, window height px, focus finder, fy)
        'left-fin': ('sin-left-fin', 'idle-near', 1000, None, 0.62),
        'right-fin': ('sin-right-fin', 'idle-near', 760, None, 0.30),
        'sinspawn-genais': ('sinspawn-genais', 'idle', 620, red, 0.42),
        'sin-core': ('sin-core', 'idle', 460, None, 0.45),
        'overdrive-sin': ('overdrive-sin', 'idle', 700, amber, 0.40),
    }
    for eid, (key, pose, hpx, finder, fy) in spec.items():
        ff = full_frame(key, pose)
        side = json.load(open(f'{C.STAGE}/characters/{key}/{pose}.json'))
        if finder is None:
            lc = side['light']['centre']; b = side['cropBox']
            fx_, fy_ = lc[0] + b[0], lc[1] + b[1]
        else:
            if eid == 'sinspawn-genais':  # the two red eyes, read off a 5 percent grid on genais-a-4: (1393, 679), (1583, 699)
                fx_, fy_ = 1488.0, 689.0
            else:
                fx_, fy_ = blob_centre(ff, finder)
        wpx = hpx * 832 / 1216
        x0, y0 = fx_ - wpx / 2, fy_ - hpx * fy
        pil = Image.fromarray(np.clip(ff, 0, 255).astype(np.uint8), 'RGBA')
        win = pil.crop((int(round(x0)), int(round(y0)), int(round(x0 + wpx)), int(round(y0 + hpx)))).resize((832, 1216), Image.LANCZOS)
        out = f'{C.STAGE}/portraits/{eid}.png'
        os.makedirs(os.path.dirname(out), exist_ok=True)
        win.save(out, optimize=True)
        fxf = round((fx_ - x0) / wpx, 4); fyf = round((fy_ - y0) / hpx, 4)
        rows[eid] = {'fx': fxf, 'fy': fyf, 'ipd': 0.16, 'px': [832, 1216],
                     'note': f"Sin (D-279, driver's pick): crop of characters/{key}/{pose}.png; focus = "
                             + ('the core (the weak spot, research 9.3)' if finder is None else ('the two red eyes\' midpoint' if eid == 'sinspawn-genais' else 'the one amber eye'))
                             + '; ipd is a human-equivalent proposal (like ixion, valefor), check at listing'}
        C.write_json(out[:-4] + '.json', {
            'width': 832, 'height': 1216, 'baselineY': 1216, 'cropBox': [round(x0), round(y0), round(x0 + wpx), round(y0 + hpx)],
            'source': {'width': C.W, 'height': C.H, 'file': f'characters/{key}/{pose}.png (placed at its cropBox)'},
            'composition': 'portrait', 'use': 'the CTB turn-order chip (src/ui/ffx/portraits.ts: portraits/<enemy id>.png)',
            'faceCrop': rows[eid], 'origin': C.ORIGIN, 'retailInput': 'none', 'status': C.STATUS, 'game': C.GAME, 'decision': 'D-279'})
        C.jpeg_check(np.asarray(win, float), f'{C.SCRATCH}/checks/portrait-{eid}.jpg', 300)
        print('portrait', eid, rows[eid]['fx'], rows[eid]['fy'])
    C.write_json(f'{C.SCRATCH}/face-crops-rows.json', rows)


def cards():
    """What the CSS composition would show: the installed idle over the installed backdrop at its painted place."""
    out_dir = os.path.join(C.HERE, 'cards'); os.makedirs(out_dir, exist_ok=True)
    comps = {}
    for card, scene, key, pose in [('chapter-sin-fins-core', 'sin-fahrenheit-flight', 'sin-left-fin', 'idle-near'),
                                   ('chapter-sin-face', 'sin-fahrenheit-bevelle', 'overdrive-sin', 'idle')]:
        bg = Image.open(f'{C.STAGE}/backdrops/{scene}.png').convert('RGBA').resize((C.W, C.H), Image.LANCZOS)
        ff = Image.fromarray(np.clip(full_frame(key, pose), 0, 255).astype(np.uint8), 'RGBA')
        bg.alpha_composite(ff)
        side = json.load(open(f'{C.STAGE}/characters/{key}/{pose}.json'))
        b = side['cropBox']; h = b[3] - b[1]
        rgb = bg.convert('RGB')
        rgb.resize((1600, 900), Image.LANCZOS).save(f'{out_dir}/{card}-scene.jpg', quality=85)
        for name, aspect, cy in [('plate', 1.9, 0.5), ('card', 4.5, 0.35)]:
            ch = C.W / aspect; y0 = max(0, min(C.H - ch, cy * C.H - ch / 2))
            rgb.crop((0, int(y0), C.W, int(y0 + ch))).resize((1200, int(1200 / aspect)), Image.LANCZOS).save(f'{out_dir}/{card}-{name}.jpg', quality=85)
        vis = {'plate': (C.W / 1.9) / C.H, 'card': (C.W / 4.5) / C.H}
        comps[card] = {'scene': scene, 'layer': key, 'pose': pose,
                       'heightPercentOfBox': {k: round(h / C.H / v * 100) for k, v in vis.items()},
                       'spriteBoxFraction': [round(b[0] / C.W, 3), round(b[1] / C.H, 3), round(b[2] / C.W, 3), round(b[3] / C.H, 3)]}
        print('card preview', card)
    C.write_json(f'{C.SCRATCH}/card-comps.json', comps)


if __name__ == '__main__':
    what = sys.argv[1:] or ['backdrops', 'pause', 'portraits', 'cards']
    if 'backdrops' in what: backdrops()
    if 'pause' in what: pause_plates()
    if 'portraits' in what: portraits()
    if 'cards' in what: cards()
