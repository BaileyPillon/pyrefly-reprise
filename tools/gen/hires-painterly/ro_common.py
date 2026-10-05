"""ro_common.py: shared definitions of the painterly roll-out (r39-art lane, 2026-10-05): paths, the asset plan, groups, geometry, noise schedules, manifest I/O. No heavy imports."""
import json
import math
import os
import re
import time

ART = 'D:/pyrefly-r39-art/public/art'
EDIR = 'D:/Tools/pyrefly-art-backup/hires-E'            # the E library: the masters "today" (R39 + edge treatment E), 4x and 2x
OUTLIB = 'D:/Tools/pyrefly-art-backup/hires-painterly'  # the new library (never written in place: every file is new)
RW = 'D:/Tools/pyrefly-scratch/2026-10-05/rollout'          # work files (D: has the room; F: is nearly full)
TOOLS = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools'
POSE_SRC = 'D:/pyrefly-r39-posescale/docs/target/pose-measure.json'
POSE = f'{RW}/pose-measure.snapshot.json'
SEEDS = (9101, 9102)
APPROVED = 'D:/pyrefly-r39-art/docs/target/approved-hashes.json'

PARTY_FFX = {'tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku'}
GROUPS = ('party', 'bosses', 'rest')
REST_IDS = {'ginnem', 'lenne', 'isaaru', 'daigoro', 'ffx2-dr-goon', 'ffx2-fem-goon', 'guado-guardian', 'sinspawn-genais'}
FFX2_IDS = {'leblanc', 'logos', 'ormi', 'shuyin', 'baralai-shade', 'gippal-shade', 'nooj-shade', 'trema'}
STATE_ORDER = ['idle', 'ready', 'attack', 'cast', 'hurt', 'ko']


def party_id(cid):
    return cid in PARTY_FFX or re.match(r'^(yuna|rikku|paine)-', cid) is not None


def group_of(cid):
    if party_id(cid):
        return 'party'
    if cid.startswith('ff7') or cid in REST_IDS:
        return 'rest'
    return 'bosses'


def game_of(cid):
    if cid.startswith('ff7'):
        return 'ff7'
    if re.match(r'^(yuna|rikku|paine)-', cid) or cid.startswith(('ffx2-', 'x2-', 'vegnagun')) or cid in FFX2_IDS:
        return 'ffx2'
    return 'ffx'


def r16(n):
    return max(16, int(round(n / 16.0)) * 16)


def work_scale(w, h):
    """Klein's working scale (pixels per painting pixel): 2x like the pilot, up to 4x for a small figure (about 1 MP), down to 1x for a big one (at most 4.3 MP)."""
    a = float(w * h)
    if a < 0.25e6:
        return min(4.0, math.sqrt(1.0e6 / a))
    if a > 1.075e6:
        return max(1.0, math.sqrt(4.3e6 / a))
    return 2.0


def schedule(steps, seq_len):
    """ComfyUI's Flux2Scheduler values (comfy_extras/nodes_flux.get_schedule), reimplemented: sigma at each step for an image of seq_len 16x16 tokens."""
    a1, b1 = 8.73809524e-05, 1.89833333
    a2, b2 = 0.00016927, 0.45666666
    if seq_len > 4300:
        mu = a2 * seq_len + b2
    else:
        m200 = a2 * seq_len + b2
        m10 = a1 * seq_len + b1
        a = (m200 - m10) / 190.0
        mu = a * steps + (m200 - 200.0 * a)
    out = []
    for i in range(steps + 1):
        t = 1.0 - i / steps
        out.append(0.0 if t <= 0 else math.exp(mu) / (math.exp(mu) + (1.0 / t - 1.0)))
    return out


def lock_sigmas(W, H, s0):
    """The init lock's noise list for an image of W x H: start at s0, then the model's own schedule values that lie below it (Tidus 1472x2272, s0 0.99: 0.99, 0.977, 0.935, 0.828, 0)."""
    sch = schedule(4, (W // 16) * (H // 16))
    return [s0] + [s for s in sch[1:4] if s < s0 - 1e-6] + [0.0]


def sig_str(vals):
    return ', '.join(f'{v:.4f}'.rstrip('0').rstrip('.') if v else '0' for v in vals)


def load_json(p, default=None):
    return json.load(open(p, encoding='utf8')) if os.path.exists(p) else default


def save_json(p, d):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + f'.tmp{os.getpid()}'
    json.dump(d, open(tmp, 'w', encoding='utf8'), indent=1)
    os.replace(tmp, p)


def approved_2x():
    d = load_json(APPROVED, {'sets': {}})
    out = set()
    for s in d['sets'].values():
        for k in s:
            if isinstance(k, str) and k.startswith('public/art/characters/') and '@2x' in k:
                out.add(k[len('public/art/'):-len('@2x.png')])
    return out


def plan(only=None):
    """Every figure the E library treated (636), ordered: party (FFX party, then the FFX-2 dresses), bosses, the rest; within a figure idle first."""
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    E = load_json(f'{EDIR}/manifest.json')['assets']
    ap2 = approved_2x()
    out = []
    for k, v in E.items():
        if v.get('status') != 'ok':
            continue
        _, cid, state = k.split('/')
        has4 = os.path.exists(f'{EDIR}/{k}@4x.png')
        w, h = Image.open(f'{ART}/{k}.png').size
        out.append({'id': k, 'cid': cid, 'state': state, 'group': group_of(cid), 'game': game_of(cid), 'S': 4 if has4 else 2, 'w': w, 'h': h,
                    'approved2x': k in ap2})
    gi = {g: i for i, g in enumerate(GROUPS)}
    ffx_order = ['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku']

    def cid_key(cid):
        if cid in ffx_order:
            return (0, ffx_order.index(cid), '')
        m = re.match(r'^(yuna|rikku|paine)-(.+)$', cid)
        if m:    # the FFX-2 girls by dressphere: one dressphere's three girls together, a character at a time
            return (1, 0, m.group(2) + '|' + ['yuna', 'rikku', 'paine'].index(m.group(1)).__str__())
        return (2, 0, cid)
    out.sort(key=lambda a: (gi[a['group']], cid_key(a['cid']), STATE_ORDER.index(a['state']) if a['state'] in STATE_ORDER else 9, a['state']))
    if only:
        sel = [s for s in only]
        out = [a for a in out if a['id'] in sel or a['id'].replace('characters/', '') in sel]
    return out


def pose_table():
    d = load_json(POSE)
    if d is None:
        d = load_json(POSE_SRC)
        save_json(POSE, d)
    return d['subjects']


def head_info(a, T=None):
    """The head box of this pose in the painting's pixels and where it came from: 'table' (posescale, reviewed), 'anchor' (an anchor and the idle's head size, to be checked), or None."""
    S = (T or pose_table()).get(a['cid'])
    if not S:
        return None, None, None
    r = S['poses'].get(a['state'])
    idle = S['idleHead']
    if r and r.get('head'):
        x0, y0, x1, y1 = r['head']
        pad = 0.10
        w, h = x1 - x0, y1 - y0
        return [max(0, x0 - pad * w), max(0, y0 - pad * h), min(a['w'], x1 + pad * w), min(a['h'], y1 + pad * h)], 'table', idle
    if r and r.get('anchor'):
        return None, 'anchor', idle
    return None, None, idle


def crop_boxes(a, P_alpha_bbox):
    """The costume close-ups of the automatic recipe: the upper and the lower part of the figure's box (a wide figure: the left and the right part). Boxes in painting pixels."""
    x0, y0, x1, y1 = P_alpha_bbox
    w, h = x1 - x0, y1 - y0
    if w > 1.3 * h:
        return [(x0, y0, x0 + 0.58 * w, y1), (x0 + 0.42 * w, y0, x1, y1)]
    return [(x0, y0 + 0.12 * h, x1, y0 + 0.56 * h), (x0, y0 + 0.48 * h, x1, y1 - 0.02 * h)]


def now():
    return time.strftime('%Y-%m-%d %H:%M:%S')
