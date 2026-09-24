"""Living portrait v6 pilot (both): the mouth stage of the headCore shader.

For every output pixel p (region REG of expr_fit.py):
  1. p' = p + sum(w_i * D_i(p)) over the fitted lattices (smile, press, slightSmile)
  2. `open` at p' per column: above the upper lip edge the plate sampled at y' - open*dU*fall_up,
     below the lower lip edge the plate sampled at y' - open*(dU + H)*fall_down, and in the gap
     between them the smile painting's own interior, compressed into the gap (the lips move off
     it; it is never faded in). open = 0 is the plate exactly.
"""
import cv2
import numpy as np

import common as C

D_UP, D_DN = 18.0, 55.0  # px over which the lip motion fades into the philtrum / the chin
LATTICES = (("smile", "nodes_smile"), ("press", "nodes_pressed"), ("slight", "nodes_slightSmile"))


def _fall(d, span):
    t = np.clip(1 - d / span, 0, 1)
    return t * t * (3 - 2 * t)


class Mouth:
    def __init__(self, rig, hc_full=None):
        Z = np.load(C.WORK / "mouth.npz")
        self.reg = [int(v) for v in Z["reg"]]
        x0, y0, x1, y1 = self.reg
        self.h, self.w = y1 - y0, x1 - x0
        self.cols = {n: Z[n].astype(np.float32) for n in ("s", "u", "l", "H", "dU")}
        self.T = Z["Tsmile"].astype(np.float32)
        self.hc = hc_full if hc_full is not None else rig.hc
        self.fields = {}
        import expr_fit
        for name, key in LATTICES:
            if key in Z.files:
                self.fields[name] = expr_fit.raster(Z[key], self.h, self.w)

    def _col(self, name, xr):
        v = self.cols[name]
        return np.interp(xr, np.arange(len(v)), v, left=0.0 if name in ("H", "dU") else v[0], right=0.0 if name in ("H", "dU") else v[-1])

    def lattice(self, p):
        g = np.zeros((self.h, self.w, 2), np.float32)
        for name, f in self.fields.items():
            wv = p.get(name, 0.0)
            if wv:
                g += wv * f
        return g

    def sample(self, hc, p, X, Y):
        """The mouth model at absolute canvas coords (X, Y) (after the lattice): premultiplied RGBA."""
        x0, y0 = self.reg[0], self.reg[1]
        wo = float(p.get("open", 0.0))
        if wo <= 0:
            return C.remap(hc, X, Y)
        xr = X - x0
        s, dU, H, u, l = (self._col(n, xr) for n in ("s", "dU", "H", "u", "l"))
        s, u, l = s + y0, u + y0, l + y0
        top = s + wo * dU
        bot = top + wo * H
        ys_up = Y - wo * dU * _fall(top - Y, D_UP)
        ys_dn = Y - wo * (dU + H) * _fall(Y - bot, D_DN)
        ysrc = np.where(Y <= top, ys_up, np.where(Y >= bot, ys_dn, s))
        img = C.remap(hc, X, ysrc.astype(np.float32))
        gw = np.clip(np.minimum(Y + 0.5, bot) - np.maximum(Y - 0.5, top), 0, 1) * (H > 0.05)  # pixel coverage
        if gw.any():
            yT = u + (Y - top) / np.maximum(bot - top, 1e-3) * (l - u)
            gap = C.remap(self.T, X - x0, (yT - y0).astype(np.float32))
            img = gap * gw[..., None] + img * (1 - gw[..., None])
        return img

    def gap_mask(self, wo):
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        s, dU, H = (self._col(n, xx) for n in ("s", "dU", "H"))
        top = s + wo * dU
        bot = top + wo * H
        m = ((yy >= top - 2) & (yy <= bot + 2) & (H > 0.05)).astype(np.float32)
        return cv2.dilate(m, np.ones((3, 3), np.uint8))

    def region(self, hc, p, lattice=True):
        """REG of headCore with the mouth at weights p (region-local premultiplied RGBA)."""
        x0, y0, x1, y1 = self.reg
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        if lattice:
            g = self.lattice(p)
            xx, yy = xx + g[..., 0], yy + g[..., 1]
        return self.sample(hc, p, xx, yy)

    def headcore(self, hc, p, mx, my):
        """rig6's headCore stage for its face rect: the sample maps mx, my (brow fields already in)."""
        from rig6 import FR
        fx0, fy0 = FR[0], FR[1]
        x0, y0, x1, y1 = self.reg
        sub = (slice(y0 - fy0, y1 - fy0), slice(x0 - fx0, x1 - fx0))
        mx, my = mx.copy(), my.copy()
        g = self.lattice(p)
        mx[sub] += g[..., 0]
        my[sub] += g[..., 1]
        out = C.remap(hc, mx, my)
        if p.get("open", 0.0) > 0:
            out[sub] = self.sample(hc, p, mx[sub], my[sub])
        return out
