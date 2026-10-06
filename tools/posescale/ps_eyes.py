"""Find a pose's eyes by the colour of the subject's irises, to centre the review tiles on the face (r391-posescale; both games, art tooling only).

The idle's face box says what the irises look like: inside its upper 60 percent, the saturated pixels whose hue is not the skin's or the hair's (a small hue
histogram). In a pose the eyes are the blobs of those hues that are the right size (the idle's iris area at the pose's prior scale, 0.12 to 4 times it) and sit
near the coarse anchor; a pair of blobs about the idle's eye spacing apart is a face, a single blob is a profile. The result is a face CENTRE (the pair's midpoint
shifted by the idle's own offset from its eyes to its face-box centre) used only to centre a tile; the size is never read from it.
"""
from __future__ import annotations

import math

import numpy as np
from scipy import ndimage as ndi

import ps_lib as L


def hsv(rgb: np.ndarray):
    a = rgb.astype(np.float32) / 255.0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rm = m & (mx == r)
    gm = m & (mx == g) & ~rm
    bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = ((b - r)[gm] / d[gm]) + 2
    h[bm] = ((r - g)[bm] / d[bm]) + 4
    return h * 60.0, np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0), mx


def _hue_dist(h, c):
    d = np.abs(h - c) % 360.0
    return np.minimum(d, 360.0 - d)


class Eyes:
    def __init__(self, subject: str, face: list, hues: list | None = None, eyes: list | None = None):
        """`hues`: the irises' hues in degrees (subjects.json `iris`), else guessed from the idle's face box (unreliable: skin, hair and lips are saturated too)."""
        self.subject, self.face = subject, face
        p = L.Painting(subject, "idle")
        fw, fh = face[2] - face[0], face[3] - face[1]
        self.fw, self.fh = fw, fh
        x0, y0, x1, y1 = int(face[0]), int(face[1]), int(face[2]), int(face[1] + 0.62 * fh)
        reg = p.rgba[y0:y1, x0:x1]
        h, s, v = hsv(reg[..., :3])
        ok = (reg[..., 3] > 200) & (s > 0.5) & (v > 0.4)
        # the hair and the skin are not irises: drop hues that make up most of the saturated pixels in the WHOLE face box (orange and brown hair, red lips)
        full = p.rgba[int(face[1]): int(face[3]), x0:x1]
        fh_, fs_, fv_ = hsv(full[..., :3])
        fok = (full[..., 3] > 200) & (fs_ > 0.5) & (fv_ > 0.4)
        hist, edges = np.histogram(fh_[fok], bins=36, range=(0, 360))
        hist_up, _ = np.histogram(h[ok], bins=36, range=(0, 360))
        # irises: hue bins that carry a visible share of the saturated pixels of the upper face and are not the dominant (hair) bins
        order = np.argsort(-hist_up)
        picks = []
        for b in order:
            if hist_up[b] < 0.04 * max(1, hist_up.sum()):
                break
            c = edges[b] + 5.0
            if hist[b] > 0.35 * max(1, hist.sum()):  # a hue that dominates the face (hair, skin shading) is no iris
                continue
            if any(_hue_dist(np.array([c]), q)[0] < 25 for q in picks):
                continue
            picks.append(c)
            if len(picks) == 2:
                break
        self.hues = [float(h) for h in hues] if hues else picks
        picks = self.hues
        # the iris blobs of the idle: area and their centres, for the eye spacing and the offset to the face centre
        m = np.zeros(reg.shape[:2], bool)
        for c in picks:
            m |= ok & (_hue_dist(h, c) < 18)
        lab, n = ndi.label(ndi.binary_closing(m, iterations=1))
        blobs = []
        for i in range(1, n + 1):
            ys, xs = np.nonzero(lab == i)
            if len(xs) >= 8:
                blobs.append((len(xs), xs.mean() + x0, ys.mean() + y0))
        blobs.sort(reverse=True)
        self.iris_area = float(np.median([b[0] for b in blobs[:2]])) if blobs else float(0.012 * fw * fh)
        if len(blobs) >= 2:
            a, b = blobs[0], blobs[1]
            self.spacing = math.hypot(a[1] - b[1], a[2] - b[2])
            mid = ((a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
        else:
            self.spacing = 0.7 * fw
            mid = (face[0] + fw / 2, face[1] + 0.42 * fh)
        if eyes and len(eyes) == 2:  # the idle's two irises read by hand (subjects.json `eyes`): they beat the guess above
            a, b = eyes
            self.spacing = math.hypot(a[0] - b[0], a[1] - b[1])
            mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            near = [bl for bl in blobs if min(math.hypot(bl[1] - a[0], bl[2] - a[1]), math.hypot(bl[1] - b[0], bl[2] - b[1])) < 0.35 * self.spacing]
            if near:
                self.iris_area = float(np.median([bl[0] for bl in near]))
        self.to_face = ((face[0] + face[2]) / 2 - mid[0], (face[1] + face[3]) / 2 - mid[1])

    def locate(self, pose: str, coarse, s0: float, radius: float = 1.6):
        """The face centre of `pose` near `coarse` (painting pixels) or None, how many iris blobs it rests on, and a cue {iris, spacing}: the iris size and the eye spacing at the
        pose's prior scale `s0`, as multiples of the idle's (1.0 = as big as the idle's; spacing needs two eyes and is cut by a turn of the head)."""
        p = L.Painting(self.subject, pose)
        h, s, v = hsv(p.rgba[..., :3])
        ok = (p.rgba[..., 3] > 200) & (s > 0.45) & (v > 0.35)
        m = np.zeros(ok.shape, bool)
        for c in self.hues:
            m |= ok & (_hue_dist(h, c) < 20)
        R = radius * max(self.fw, self.fh) / s0
        x0, y0 = int(max(0, coarse[0] - R)), int(max(0, coarse[1] - R))
        x1, y1 = int(min(p.w, coarse[0] + R)), int(min(p.h, coarse[1] + R))
        sub = ndi.binary_closing(m[y0:y1, x0:x1], iterations=1)
        lab, n = ndi.label(sub)
        want = self.iris_area / (s0 * s0)
        blobs = []
        for i in range(1, n + 1):
            ys, xs = np.nonzero(lab == i)
            a = len(xs)
            if not (0.1 * want <= a <= 14.0 * want):
                continue
            w, hh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
            if max(w, hh) > 3.0 * min(w, hh):
                continue
            blobs.append((a, xs.mean() + x0, ys.mean() + y0))
        if not blobs:
            return None, 0, {}
        sp = self.spacing / s0
        best = None
        for i in range(len(blobs)):
            for j in range(i + 1, len(blobs)):
                d = math.hypot(blobs[i][1] - blobs[j][1], blobs[i][2] - blobs[j][2])
                if 0.4 * sp <= d <= 2.6 * sp:
                    mid = ((blobs[i][1] + blobs[j][1]) / 2, (blobs[i][2] + blobs[j][2]) / 2)
                    score = abs(math.log(d / sp)) + 0.003 * math.hypot(mid[0] - coarse[0], mid[1] - coarse[1])
                    if best is None or score < best[0]:
                        best = (score, mid, 2, (i, j), d)
        if best is None:  # one visible eye: the blob nearest the coarse anchor, taken as the eye on the idle's near side
            b = min(range(len(blobs)), key=lambda k: math.hypot(blobs[k][1] - coarse[0], blobs[k][2] - coarse[1]))
            best = (0, (blobs[b][1], blobs[b][2]), 1, (b,), 0.0)
        mid = best[1]
        areas = [blobs[k][0] for k in best[3]]
        cue = {"iris": round(math.sqrt(float(np.mean(areas)) * s0 * s0 / self.iris_area), 3)}
        cue["pts"] = [[round(blobs[k][1], 1), round(blobs[k][2], 1)] for k in best[3]]
        if best[2] == 2:
            cue["spacing"] = round(best[4] * s0 / self.spacing, 3)
        return [round(mid[0] + self.to_face[0] / s0, 1), round(mid[1] + self.to_face[1] / s0, 1)], best[2], cue
