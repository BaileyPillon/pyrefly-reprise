"""Living portrait v6 pilot (both): approach A on the plate, CPU reference of the shader.

Every face part is moved by geometry driven by continuous weights; nothing is cross-faded.
Each function below is what one fragment-shader stage would compute (texture() = bilinear):

  headCore   sampled at uv + sum(w_i * D_i(uv)): the brow fields (rig-face.py's measured
             moves) and the mouth lattices (expr_fit.py), plus the mouth's `open` stage
             (mouth.py: the lips part over the smile painting's own interior)
  eyeball    socket fill + iris disc at the gaze offset + catchlight at 0.3x, clipped to
             the eye window (eye_parts.py)
  lids       rig-lids2.py's per-column unroll at ANY aperture a (lid_extract.py curves):
             a <= 0.85 the closed painting's lid exactly as the baked frames; 0.94 < a < 1
             the plate's own rim sliding down; 0.85..0.94 a top-down wipe between the two
             (a moving edge, never an opacity mix); droop (px) moves the rim for gaze
"""
import numpy as np

import common as C

FR = (236, 272, 724, 724)  # the face rect recomposited per frame (x0, y0, x1, y1)
A_W0, A_W1 = 0.85, 0.94    # the rim hand-off (see the docstring)
CATCH = 0.3                # the catchlight moves at 0.3x the iris (the plan)
A_C = 0.08                 # below this the lash band eases into the a = 0 frame (the baked a00)


BROW_SMOOTH = 5.0          # part 2: sigma (px) of the brow mask's edges along x (0 = part 1's fields)
ERODE_K = 1.0              # the gap is eroded by ERODE_K * sigma before the blur


def _smooth1d(v, sigma):
    r = int(3 * sigma)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    return np.convolve(np.pad(v, r, mode="edge"), k / k.sum(), mode="valid")


def _erode1d(v, r):
    return np.lib.stride_tricks.sliding_window_view(np.pad(v, r, mode="edge"), 2 * r + 1).min(-1)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


class Rig:
    def __init__(self, socket="row"):
        r = C.rig()
        self.layers = {l["name"]: l for l in r["artMeta"]["v3"]["frontal"]["layers"]}
        P = lambda n: C.placed(C.load_rgba(self.layers[n]["file"]), self.layers[n]["box"])
        below = P("hairBack")
        for n in ("body", "neck"):
            below = C.over(P(n), below)
        self.hc = P("headCore")
        ap = C.over(P("eyeApertureL"), P("eyeApertureR"))
        top = P("hairFront")
        for n in ("strand1", "strand2", "earring"):
            top = C.over(P(n), top)
        E = np.load(C.WORK / "eyes.npz")
        self.eyes = {}
        bits = np.zeros((C.H, C.W, 4), np.float32)
        for k in ("R", "L"):
            e = {n: E[f"{k}_{n}"] for n in ("box", "disc", "catch", "fill_row", "bits", "window", "open", "F")}
            x0, y0, x1, y1 = e["box"]
            bits[y0:y1, x0:x1] = C.over(e["bits"], bits[y0:y1, x0:x1])
            self.eyes[k] = e
        self.socket = socket
        x0, y0, x1, y1 = FR
        self.s = (slice(y0, y1), slice(x0, x1))
        self.below, self.bits, self.ap, self.top = below, bits, ap, top
        self.iris = C.over(P("irisL"), P("irisR"))  # the irises as painted (rest)
        self.static = C.over(top, C.over(ap, C.over(self.iris, C.over(self.hc, below))))
        # the eye as painted under the hair, the source of the sliding rim
        self.prehair = C.over(ap, C.over(self.iris, C.over(self.hc, below)))
        Z = np.load(C.WORK / "lids.npz")
        self.lid = {}
        for k in ("R", "L"):
            d = {n: Z[f"{k}_{n}"] for n in ("ext", "t", "r0", "yc", "inside", "bot", "hair", "C")}
            MARGIN, LASH, RIM_MIN = Z["consts"]
            d["yT"] = np.maximum(0, np.minimum(d["r0"], np.floor(d["t"]) - RIM_MIN) - MARGIN)
            d["LASH"] = float(LASH)
            self.lid[k] = d
        self.canvas_alpha = Z["canvasAlpha"]
        self.fields = []  # (name, gx, gy) full-FR displacement fields (sample at uv + w * D)
        self._brow_fields()
        self.mouth = None
        try:
            import mouth
            self.mouth = mouth.Mouth(self)
        except (ImportError, FileNotFoundError):
            pass

    # ---------------------------------------------------------------- brows
    def _brow_fields(self):
        """browRaise / browDraw as warp fields of headCore: rig-face.py's measured moves (raised: inner
        end up 5 px, outer 1; drawn: inner end down 3 and 2 px inward) on the brow and the skin just
        around it, eased out over the skin between the brow and the eye's rim (a raise never lifts more
        than a third of that gap, so det(J) stays >= 0.5) and 4 px short of the rim, so the lashes
        never move."""
        import cv2
        spec = {"R": {"innerX": 378, "outerX": 264}, "L": {"innerX": 569, "outerX": 692}}
        poly_r = np.array([[262, 339], [270, 332], [310, 329], [352, 333], [380, 342], [383, 360], [340, 355], [300, 352], [264, 354]], np.float64)
        c1, c2 = np.array([340.6, 432.3]), np.array([610.6, 417.9])  # owners.json iris centres
        u = (c2 - c1) / np.linalg.norm(c2 - c1)
        m = (c1 + c2) / 2
        poly_l = poly_r - 2 * ((poly_r - m) @ u)[:, None] * u[None, :]
        x0, y0, x1, y1 = FR
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float64)
        moves = {"browRaise": {"dyOuter": -1, "dyInner": -5, "dxInner": 0}, "browDraw": {"dyOuter": 0, "dyInner": 3, "dxInner": 2}}
        out = {n: [np.zeros(xx.shape), np.zeros(xx.shape)] for n in moves}
        lo, hi = np.zeros(xx.shape), np.zeros(xx.shape)
        for side, poly in (("R", poly_r), ("L", poly_l)):
            pts = np.round(poly - [x0, y0]).astype(np.int32)
            poly_mask = np.zeros(xx.shape, np.uint8)
            cv2.fillPoly(poly_mask, [pts], 1)
            cols = np.nonzero(poly_mask.any(0))[0]
            top = np.full(xx.shape[1], np.nan)
            bottom = np.full(xx.shape[1], np.nan)
            for c in cols:
                r = np.nonzero(poly_mask[:, c])[0]
                top[c], bottom[c] = r.min() + y0, r.max() + y0
            xi = np.arange(xx.shape[1])
            top = np.interp(xi, cols, top[cols])
            bottom = np.interp(xi, cols, bottom[cols])
            # the skin between the brow and the eye's rim takes the move; it ends 4 px above the rim
            d = self.lid[side]
            rim = np.interp(xx[0], d["ext"], d["r0"], left=d["r0"][0], right=d["r0"][-1])
            gap = np.maximum(rim - 4 - (bottom + 1), 3.0)
            if BROW_SMOOTH:
                # part 2 (the fold): the mask's edges followed the brow polygon and the rim column by column, so at
                # the inner ends the ease-out changed by up to 1 px per column, and raise + draw summed there
                # folded (det 0.39-2.18). The edges are now smooth along x: the gap is eroded first (it only ever
                # shrinks, so the lashes still never move) and then blurred, like the brow's top and bottom.
                top, bottom = _smooth1d(top, BROW_SMOOTH), _smooth1d(bottom, BROW_SMOOTH)
                gap = np.maximum(_smooth1d(_erode1d(gap, int(ERODE_K * BROW_SMOOTH)), BROW_SMOOTH), 3.0)
            # per column: 1 on the brow, eased out over 14 px above it and over the gap below it;
            # across: eased out over 24 px past the brow's ends
            vy = smoothstep((top - 14)[None, :], top[None, :], yy) * (1 - smoothstep((bottom + 1)[None, :], (bottom + 1 + gap)[None, :], yy))
            hx = smoothstep(cols.min() + x0 - 24, cols.min() + x0, xx) * (1 - smoothstep(cols.max() + x0, cols.max() + x0 + 24, xx))
            mask = vy * hx
            cfg = spec[side]
            t = np.clip((xx - cfg["outerX"]) / (cfg["innerX"] - cfg["outerX"]), 0, 1)
            inward = 1.0 if side == "R" else -1.0
            for n, mv in moves.items():
                dx = inward * mv["dxInner"] * t
                dy = mv["dyOuter"] + (mv["dyInner"] - mv["dyOuter"]) * t
                # det(J) in [0.5, 2] on that skin: a lift never more than a third of the gap, a push
                # down never more than gap / 1.6 (weights 0..1; the drivers keep the brows >= 0)
                dy = np.clip(dy, -gap[None, :] / 3.0, gap[None, :] / 1.6)
                out[n][0] += -dx * mask
                out[n][1] += -dy * mask
            lo += -mask * gap[None, :] / 1.6  # the same limits on the SUM of the two moves (sample offsets)
            hi += mask * gap[None, :] / 3.0
        for n, (gx, gy) in out.items():
            self.fields.append((n, gx.astype(np.float32), gy.astype(np.float32)))
        self.brow_limits = (lo.astype(np.float32), hi.astype(np.float32))

    # ---------------------------------------------------------------- lids
    def _lid_closed(self, k, a, droop, ys, xs):
        """rig-lids2.py build(), per pixel, at a continuous aperture: premultiplied RGBA."""
        d = self.lid[k]
        j = xs - d["ext"][0]
        t = d["t"][j] + droop * d["inside"][j]
        yc, ins, yT, b = d["yc"][j], d["inside"][j], d["yT"][j], d["bot"][j]
        LASH = d["LASH"]
        s = float(np.clip((A_C - a) / A_C, 0, 1))  # linear: the baked a08 -> a00 change spread evenly
        ye_f = t + (1 - a) * (yc - t) * ins
        ye = (1 - s) * ye_f + s * yc
        bottom = (1 - s) * (ye + LASH) + s * np.maximum(yc + LASH, b + 3)
        y = ys.astype(np.float64)
        span_o = np.maximum(1.0, ye - yT)
        span_c = np.maximum(1.0, yc - yT)
        src = np.where(y <= ye, yT + (y - yT) * span_c / span_o, yc + (y - ye))
        al = np.clip((y - yT + 1) / 4.0, 0, 1)
        al *= (1 - s) * np.clip((bottom - y) / 2.0, 0, 1) + s
        al *= (y >= yT) & (y <= np.ceil(bottom)) & (ins > 0)
        al *= ins
        al *= ~d["hair"][ys, xs]
        al *= self.canvas_alpha[ys, xs]
        img = d["C"] / 255.0
        y0 = np.clip(np.floor(src).astype(int), 0, C.H - 1)
        y1 = np.clip(y0 + 1, 0, C.H - 1)
        f = (src - np.floor(src))[..., None]
        col = img[y0, xs] * (1 - f) + img[y1, xs] * f
        return np.dstack([col * al[..., None], al]).astype(np.float32), ye

    def _lid_open(self, k, delta, ys, xs):
        """The plate's own rim slid down by delta px (skin above it stretched): premultiplied RGBA."""
        d = self.lid[k]
        j = xs - d["ext"][0]
        t, yT, ins = d["t"][j], d["yT"][j], d["inside"][j]
        r0 = np.maximum(d["r0"][j], yT + 6)
        dl = delta * ins
        y = ys.astype(np.float64)
        K = r0 - yT
        src = np.where(y < yT + K + dl, yT + (y - yT) * K / np.maximum(K + dl, 1e-6), y - dl)
        al = np.clip((y - yT + 1) / 4.0, 0, 1) * (y >= yT) * (y <= t + dl) * (ins > 0)
        src = np.clip(src, 0, C.H - 1)
        y0 = np.floor(src).astype(int)
        y1 = np.clip(y0 + 1, 0, C.H - 1)
        f = (src - y0)[..., None]
        P = self.prehair
        col = P[y0, xs] * (1 - f) + P[y1, xs] * f  # premultiplied (opaque here)
        return (col * al[..., None]).astype(np.float32)

    def lid_layer(self, k, a, droop=0.0):
        """(premultiplied RGBA, y0, x0) of eye k's lid at aperture a, or None at rest."""
        d = self.lid[k]
        a = float(np.clip(a, 0, 1))
        if a >= 1.0 and droop <= 0:
            return None
        ext = d["ext"]
        y0 = int(d["yT"].min())
        y1 = int(np.ceil(max(d["yc"].max() + d["LASH"], d["bot"].max() + 3, d["t"].max() + droop + 2))) + 2
        ys, xs = np.mgrid[y0:y1, int(ext[0]):int(ext[-1]) + 1]
        if a >= A_W1:
            delta = (1 - a) * np.interp(xs[0], ext, d["yc"] - d["t"]) + droop
            return self._lid_open(k, delta[None, :], ys, xs), y0, int(ext[0])
        cl, ye = self._lid_closed(k, a, droop, ys, xs)
        if a > A_W0:
            delta = (1 - a) * np.interp(xs[0], ext, d["yc"] - d["t"]) + droop
            op = self._lid_open(k, delta[None, :], ys, xs)
            p = float(np.clip((A_W1 - a) / (A_W1 - A_W0), 0, 1))  # linear: the edge sweeps at constant speed
            j = xs - ext[0]
            yT = d["yT"][j]
            yw = yT + p * (ye + d["LASH"] + 3 - yT)
            m = np.clip((yw - ys) / 3.0 + 0.5, 0, 1)[..., None]  # 1 above the moving edge: the closed lid
            return (cl * m + op * (1 - m)).astype(np.float32), y0, int(ext[0])
        return cl, y0, int(ext[0])

    def openness(self, a):
        """Share of the two eye openings not covered by the lid layer at port aperture a."""
        tot = cov = 0.0
        for k, e in self.eyes.items():
            x0, y0, x1, y1 = e["box"]
            m = np.zeros((C.H, C.W), np.float32)
            lay = self.lid_layer(k, a)
            if lay is not None:
                img, ly, lx = lay
                m[ly:ly + img.shape[0], lx:lx + img.shape[1]] = img[..., 3]
            o = e["open"]
            tot += o.sum()
            cov += (m[y0:y1, x0:x1] * o).sum()
        return 1 - cov / tot

    def vis_to_port(self, v):
        """The port aperture that leaves a share v of the eye open. The baked frames' labels are not
        the visible opening (lid-08 is 26 percent open), so the drivers speak in v and this table maps
        it; the eight baked frames stay exact at their own port apertures."""
        if not hasattr(self, "_lut"):
            ag = np.linspace(0, 1, 101)
            vg = np.maximum.accumulate(np.array([self.openness(a) for a in ag]))
            vg = vg + np.arange(len(vg)) * 1e-7  # strictly increasing for the inverse
            self._lut = (vg, ag)
        vg, ag = self._lut
        return float(np.interp(v, vg, ag))

    # ---------------------------------------------------------------- eyeball
    def eyeball(self, k, gx, gy, socket=None):
        """Socket fill, iris disc at the gaze offset, catchlight at 0.3x, clipped to the eye window."""
        e = self.eyes[k]
        socket = socket or self.socket
        h, w = e["F"].shape
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        disc = C.remap(e["disc"], xx - gx, yy - gy)
        catch = C.remap(e["catch"], xx - CATCH * gx, yy - CATCH * gy)
        out = np.zeros((h, w, 4), np.float32)
        if socket == "row":
            out = e["fill_row"].copy()
        out = C.over(catch, C.over(disc, out))
        return out * e["window"][..., None].astype(np.float32)

    # ---------------------------------------------------------------- frame
    def render(self, p):
        """p: dict of weights (missing = 0; lidR/lidL default 1). Returns the premultiplied canvas."""
        x0, y0, x1, y1 = FR
        s = self.s
        gxf = np.zeros((y1 - y0, x1 - x0), np.float32)
        gyf = np.zeros_like(gxf)
        for name, fx, fy in self.fields:
            w = p.get(name, 0.0)
            if w:
                gxf += w * fx
                gyf += w * fy
        if self.fields:
            gyf = np.clip(gyf, *self.brow_limits)  # raise and draw together stay inside det(J) 0.5..2
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        if self.mouth is not None:
            hc = self.mouth.headcore(self.hc, p, xx + gxf, yy + gyf)
        elif gxf.any() or gyf.any():
            hc = C.remap(self.hc, xx + gxf, yy + gyf)
        else:
            hc = self.hc[s]
        gx, gy = p.get("gazeX", 0.0), p.get("gazeY", 0.0)
        rest_eyes = gx == 0 and gy == 0
        comp = C.over(self.iris[s] if rest_eyes else self.bits[s], C.over(hc, self.below[s]))
        for k, e in self.eyes.items():
            if rest_eyes:
                continue  # the rest pose: the irises as painted
            ex0, ey0, ex1, ey1 = e["box"]
            sub = (slice(ey0 - y0, ey1 - y0), slice(ex0 - x0, ex1 - x0))
            comp[sub] = C.over(self.eyeball(k, gx, gy), comp[sub])
        comp = C.over(self.ap[s], comp)
        droop = p.get("droop", 0.0)
        for k in ("R", "L"):
            lay = self.lid_layer(k, p.get("lid" + k, 1.0), droop)
            if lay is None:
                continue
            img, ly, lx = lay
            hh, ww = img.shape[:2]
            sub = (slice(ly - y0, ly - y0 + hh), slice(lx - x0, lx - x0 + ww))
            comp[sub] = C.over(img, comp[sub])
        comp = C.over(self.top[s], comp)
        out = self.static.copy()
        out[s] = comp
        return out
