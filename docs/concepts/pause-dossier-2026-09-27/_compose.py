"""PR-0171 option frames: the pause CHAPTER tab over Chapter II (Yuna) and Chapter IX
(Yojimbo), in battle, at 1600x900 and 2000x1012. Built only from existing captures
(the re-checker's base = live frames) and the shipped plate masters; see _layers.py.

Options (docs/handoff/t1-b3b.md, "The question for Bailey"):
  A mirror   face to the left, the chrome mirrored to the right (the member tabs'
             pause--mirror), the plate slides past its right edge under the dark
             falloff (the approved member-tab slide rule, mirrored); the dossier keeps
             heading + quote under THIS ENCOUNTER, snapshots dropped (FOC16-02 under-lean)
  B stack    the painting exactly as live; THIS ENCOUNTER over THE PARTY in one column
             on the empty left (the member tabs' faceStack rule); the dossier is dropped
  C slide    the chrome exactly as live; the plate slides right past its left edge
             (the member-tab slide rule, shrinking no further than 0.755x) until the face
             clears THE PARTY; the dossier keeps heading + quote under THIS ENCOUNTER
  D leave    the live frame, unchanged
"""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from _layers import split, place, grade, VOID

OUT = 'D:/Final Fantasy/docs/concepts/pause-dossier-2026-09-27'
MARGIN = 16  # faceClear.FACE_MARGIN
MIN_SCALE = 0.8 / 1.06  # faceSlide.SLIDE_MIN_SCALE

# Measured off the captures (alpha profiles): body columns and chrome, per case.
GEOM = {
    ('ch2', 1600): dict(enc=(56, 296, 515, 575), party=(552, 296, 952, 575), dos=(990, 296, 1340, 585),
                        snap_y=(452, 533), brand=(56, 24, 500, 44), obj=(56, 700, 760, 822), back=(1380, 822, 1545, 876)),
    ('ch9', 1600): dict(enc=(56, 296, 552, 570), party=(588, 296, 995, 572), dos=(1033, 296, 1375, 575),
                        snap_y=(422, 504), brand=(56, 24, 500, 44), obj=(56, 700, 780, 800), back=(1380, 822, 1545, 876)),
    ('ch2', 2000): dict(enc=(64, 334, 618, 665), party=(664, 334, 1145, 665), dos=(1190, 334, 1620, 668),
                        snap_y=(514, 616), brand=(64, 28, 600, 52), obj=(64, 788, 900, 930), back=(1740, 926, 1935, 984)),
    ('ch9', 2000): dict(enc=(64, 334, 662, 600), party=(708, 334, 1198, 655), dos=(1243, 334, 1665, 655),
                        snap_y=(481, 583), brand=(64, 28, 600, 52), obj=(64, 788, 760, 905), back=(1740, 926, 1935, 984)),
}
NAMES = {'ch2': 'Chapter II (Yuna)', 'ch9': 'Chapter IX (Yojimbo)'}


def bbox_alpha(a, r, thr=0.25):
    x0, y0, x1, y1 = r
    sub = a[y0:y1, x0:x1] > thr
    ys, xs = np.where(sub)
    if len(xs) == 0:
        return r
    return (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)


def snapshots(L, g):
    """Each snapshot thumbnail's rect: columns of strong |C - B| inside the snapshot rows."""
    C, B = L['C'], L['B']
    x0, _, x1, _ = g['dos']
    y0, y1 = g['snap_y']
    d = np.abs(C[y0:y1, x0:x1] - B[y0:y1, x0:x1]).sum(-1).mean(0)
    on = d > 18
    rects, start = [], None
    for i, v in enumerate(list(on) + [False]):
        if v and start is None:
            start = i
        if not v and start is not None:
            if i - start > 30:
                rects.append((x0 + start, y0, x0 + i, y1))
            start = None
    return rects


class Frame:
    def __init__(self, bg, L):
        self.img = bg.astype(np.float32).copy()
        self.L = L
        self.boxes = []  # placed text boxes, for the face measurement

    def text(self, src, dx, dy, record=True):
        """Composite the text layer inside src, moved by (dx, dy)."""
        x0, y0, x1, y1 = src
        a = self.L['a'][y0:y1, x0:x1][..., None]
        ink = self.L['ink'][y0:y1, x0:x1]
        H, W = self.img.shape[:2]
        tx0, ty0 = x0 + dx, y0 + dy
        cx0, cy0 = max(0, tx0), max(0, ty0)
        cx1, cy1 = min(W, tx0 + (x1 - x0)), min(H, ty0 + (y1 - y0))
        if cx1 <= cx0 or cy1 <= cy0:
            return
        sa = a[cy0 - ty0:cy1 - ty0, cx0 - tx0:cx1 - tx0]
        si = ink[cy0 - ty0:cy1 - ty0, cx0 - tx0:cx1 - tx0]
        dst = self.img[cy0:cy1, cx0:cx1]
        self.img[cy0:cy1, cx0:cx1] = sa * si + (1 - sa) * dst
        if record:
            bb = bbox_alpha(self.L['a'], src)
            self.boxes.append((bb[0] + dx, bb[1] + dy, bb[2] + dx, bb[3] + dy))

    def opaque(self, src, dx, dy):
        x0, y0, x1, y1 = src
        self.img[y0 + dy:y1 + dy, x0 + dx:x1 + dx] = self.L['C'][y0:y1, x0:x1]
        self.boxes.append((x0 + dx, y0 + dy, x1 + dx, y1 + dy))


def erase(L, rects):
    """The live capture with the text inside rects replaced by the painting model."""
    C, B, a = L['C'], L['B'], L['a']
    out = C.copy()
    for (x0, y0, x1, y1) in rects:
        m = a[y0:y1, x0:x1] > 0
        # dilate the ink mask by 2 px so antialiased edges go too
        from PIL import ImageFilter
        mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
        m = (np.asarray(mi) > 0)[..., None]
        out[y0:y1, x0:x1] = np.where(m, B[y0:y1, x0:x1], C[y0:y1, x0:x1])
    return out


def face_of(L):
    f = L['state']['face']
    return (f['left'], f['top'], f['right'], f['bottom'])


def plate_rect(L):
    return tuple(L['state']['plateRect'])


def moved_plate(L, scale, face_left):
    """A plate rect scaled about nothing in particular, placed so the face's left edge
    lands at face_left, the vertical position kept (the face scales about its top)."""
    pl, pt, pr, pb = plate_rect(L)
    fl, ft, fr, fb = face_of(L)
    pw, ph = pr - pl, pb - pt
    ofx, ofy = (fl - pl) / pw, (ft - pt) / ph
    nw, nh = pw * scale, ph * scale
    # keep the face's vertical centre where it was
    fcy = (ft + fb) / 2
    fy_rel = ((ft + fb) / 2 - pt) / ph
    nl = face_left - ofx * nw
    nt = fcy - fy_rel * nh
    # no empty page at the top or bottom: the face rises or falls with the plate instead
    H = L['size'][1]
    nt = min(nt, 0)
    if nt + nh < H:
        nt = H - nh
    rect = (nl, nt, nl + nw, nt + nh)
    face = (face_left, nt + ofy * nh, face_left + (fr - fl) * scale, nt + ofy * nh + (fb - ft) * scale)
    return rect, face


def new_bg(L, rect, mirror):
    w, h = L['size']
    P = place(L['state']['plateId'], [int(round(v)) for v in rect], (w, h), feather_void=True)
    return np.clip(grade(P, mirror=mirror), 0, 255)


def chrome_same(fr, g, w, h):
    """Tabs, key hints, brand, objective, prompts where live has them."""
    fr.text((0, 0, w, int(h * 0.13)), 0, 0, record=False)
    fr.text(g['obj'], 0, 0, record=False)
    fr.text(g['back'], 0, 0, record=False)


def option_d(L, g):
    fr = Frame(L['C'], L)
    for k in ('enc', 'party', 'dos'):
        fr.boxes.append(bbox_alpha(L['a'], g[k]))
    return fr, face_of(L), None


def option_b(L, g, case):
    """Painting unchanged; THIS ENCOUNTER over THE PARTY on the left; dossier dropped."""
    w, h = L['size']
    snaps = snapshots(L, g)
    fr = Frame(new_bg(L, plate_rect(L), mirror=False), L)
    chrome_same(fr, g, w, h)
    enc = bbox_alpha(L['a'], g['enc'])
    party = bbox_alpha(L['a'], g['party'])
    gut = enc[0]
    top = int(h * 0.15)  # under the tab strip
    gap = int(h * 0.035)
    fr.text(g['enc'], 0, top - enc[1])
    enc_bottom = top + (enc[3] - enc[1])
    # THE PARTY's heading aligns with THIS ENCOUNTER's left edge
    fr.text(g['party'], gut - party[0], enc_bottom + gap - party[1])
    note = None
    party_bottom = enc_bottom + gap + (party[3] - party[1])
    obj = bbox_alpha(L['a'], g['obj'])
    if party_bottom > obj[1] - 8:
        note = f'stack bottom {party_bottom}px vs objective top {obj[1]}px'
    return fr, face_of(L), note


def under_lean(L, g):
    """The dossier's heading + quote + who + hand (the snapshots and captions dropped)."""
    x0, y0, x1, _ = g['dos']
    return (x0, y0, x1, g['snap_y'][0] - 3)


def body_lift(L, g):
    """How far the columns rise so the under-lean dossier ends above the objective
    (the live `under` placement lifts the body the same way)."""
    h = L['size'][1]
    enc = bbox_alpha(L['a'], g['enc'])
    ulb = bbox_alpha(L['a'], under_lean(L, g))
    bottom = enc[3] + int(h * 0.03) + (ulb[3] - ulb[1])
    obj = bbox_alpha(L['a'], g['obj'])
    return min(0, (obj[1] - int(h * 0.03)) - bottom)


def option_c(L, g):
    """Chrome as live; plate slides right until the face clears THE PARTY."""
    w, h = L['size']
    party = bbox_alpha(L['a'], g['party'])
    fl, ft, fr_, fb = face_of(L)
    fw = fr_ - fl
    left = party[2] + MARGIN
    scale = min(1.0, (w - left) / fw)
    note = None
    if scale < MIN_SCALE:
        note = f'needs {scale:.2f}x, below the 0.755x floor'
        scale = MIN_SCALE
    rect, face = moved_plate(L, scale, left)
    fr = Frame(new_bg(L, rect, mirror=False), L)
    chrome_same(fr, g, w, h)
    dy = body_lift(L, g)
    fr.text(g['enc'], 0, dy)
    fr.text(g['party'], 0, dy)
    enc = bbox_alpha(L['a'], g['enc'])
    ul = under_lean(L, g)
    ulb = bbox_alpha(L['a'], ul)
    fr.text(ul, enc[0] - ulb[0], enc[3] + dy + int(h * 0.03) - ulb[1])
    return fr, face, (note or f'plate {scale:.2f}x, slid {rect[0]:.0f}px')


def option_a(L, g):
    """Face to the left, chrome mirrored to the right."""
    w, h = L['size']
    enc = bbox_alpha(L['a'], g['enc'])
    party = bbox_alpha(L['a'], g['party'])
    gut = enc[0]
    gap = party[0] - enc[2]
    # row-reverse: THIS ENCOUNTER at the right edge, THE PARTY to its left
    enc_dx = (w - gut) - enc[2]
    party_dx = (w - gut - (enc[2] - enc[0]) - gap) - party[2]
    cols_left = party[0] + party_dx
    fl, ft, fr_, fb = face_of(L)
    fw = fr_ - fl
    room = cols_left - MARGIN
    scale = min(1.0, room / fw)
    note = None
    if scale < MIN_SCALE:
        note = f'needs {scale:.2f}x, below the 0.755x floor'
        scale = MIN_SCALE
    face_left = max(0, room - fw * scale)
    rect, face = moved_plate(L, scale, face_left)
    fr = Frame(new_bg(L, rect, mirror=True), L)
    # tabs and key hints stay (the mirror moves the brand, objective and prompts)
    fr.text((0, int(h * 0.055), w, int(h * 0.13)), 0, 0, record=False)
    b = bbox_alpha(L['a'], g['brand'])
    fr.text(g['brand'], (w - gut) - b[2], 0, record=False)
    o = bbox_alpha(L['a'], g['obj'])
    fr.text(g['obj'], (w - gut) - o[2], 0)
    bk = bbox_alpha(L['a'], g['back'])
    fr.text(g['back'], gut - bk[0], 0, record=False)
    dy = body_lift(L, g)
    fr.text(g['enc'], enc_dx, dy)
    fr.text(g['party'], party_dx, dy)
    ul = under_lean(L, g)
    ulb = bbox_alpha(L['a'], ul)
    fr.text(ul, (w - gut) - ulb[2], enc[3] + dy + int(h * 0.03) - ulb[1])
    return fr, face, (note or f'plate {scale:.2f}x, slid {rect[2] - w:.0f}px past the right edge' if rect[2] < w else note or f'plate {scale:.2f}x')


def measure(fr, face):
    fl, ft, frr, fb = face
    hits = 0
    worst = None
    for (x0, y0, x1, y1) in fr.boxes:
        if x1 > fl and x0 < frr and y1 > ft and y0 < fb:
            hits += 1
    # clearance: smallest horizontal gap between the face and any box sharing its rows
    gaps = []
    for (x0, y0, x1, y1) in fr.boxes:
        if y1 > ft and y0 < fb:
            if x1 <= fl:
                gaps.append(fl - x1)
            elif x0 >= frr:
                gaps.append(x0 - frr)
            else:
                gaps.append(-1)
    worst = min(gaps) if gaps else None
    # ink pixels inside the face box
    a = fr.L['a']
    return hits, worst


def build(case):
    L = split(case)
    g = GEOM[case]
    # the objective's gold is the eyebrow only; gold "ink" below it is the earring
    h = L['size'][1]
    x0, y0, x1, y1 = g['obj']
    cut = y0 + int(h * 0.045)
    gold = L['ink'][cut:y1, x0:x1, 2] < 150
    L['a'][cut:y1, x0:x1][gold] = 0
    # and above the cut, a row with only a few gold pixels is earring, not eyebrow
    sub_a, sub_i = L['a'][y0:cut, x0:x1], L['ink'][y0:cut, x0:x1, 2] < 150
    rows = ((sub_a > 0) & sub_i).sum(1)
    for r in np.where(rows < 12)[0]:
        sub_a[r][sub_i[r]] = 0
    res = {}
    for key, fn in (('a-mirror', lambda: option_a(L, g)), ('b-stack', lambda: option_b(L, g, case)),
                    ('c-slide', lambda: option_c(L, g)), ('d-leave', lambda: option_d(L, g))):
        fr, face, note = fn()
        img = Image.fromarray(np.clip(fr.img, 0, 255).astype(np.uint8))
        name = f'{case[0]}-{case[1]}-{key}.jpg'
        img.save(f'{OUT}/{name}', quality=84, optimize=True)
        hits, gap = measure(fr, face)
        res[key] = dict(file=name, face=[round(v) for v in face], blocks_on_face=hits,
                        clearance_px=None if gap is None else round(gap), note=note)
    return res


if __name__ == '__main__':
    allres = {}
    for case in (('ch2', 1600), ('ch2', 2000), ('ch9', 1600), ('ch9', 2000)):
        allres[f'{case[0]}-{case[1]}'] = build(case)
        print(case, json.dumps(allres[f'{case[0]}-{case[1]}'], indent=None))
    json.dump(allres, open(f'{OUT}/measure.json', 'w'), indent=2)
