"""fd.py: faithful detail for a backdrop master. The 2x master is built from the approved painting P (1x) and an ESRGAN image E (2x) so that
nothing is drawn that the painting does not already imply.

  Lp   bicubic 2x of P (the carrier; the QC reduces a master to 1x and compares with P)
  U    the painting's own fine detail at 2x: Lp - gauss(Lp, su)
  D    ESRGAN's detail relative to the carrier: E - Lp, its low frequencies removed (gauss st) so tones stay the painting's
  A    adaptive unsharp: M = Lp + beta(x) * U, beta = local regression of D on U, clipped to [0, bmax]      (nothing ESRGAN invents can appear)
  B    gated ESRGAN:     M = Lp + w(x) * clampD,  w = smoothstep of the local correlation of D with U   (ESRGAN detail only where it agrees with the painting)
Both finish with back-projection (the master reduced to 1x equals P) when asked.
"""
import numpy as np
from scipy.ndimage import gaussian_filter, uniform_filter
from PIL import Image


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def gblur(a, s):
    return gaussian_filter(a, (s, s, 0)) if a.ndim == 3 else gaussian_filter(a, s)


def carrier(P):
    """P: uint8 HxWx3 (1x). bicubic 2x as float32."""
    im = Image.fromarray(P, 'RGB')
    return np.asarray(im.resize((P.shape[1] * 2, P.shape[0] * 2), Image.BICUBIC), np.float32)


def parts(P, E, su=1.6, st=4.0):
    Lp = carrier(P)
    Ef = E.astype(np.float32)
    U = Lp - gblur(Lp, su)
    D = Ef - Lp
    D = D - gblur(D, st)
    return Lp, U, D


def local_stats(U, D, win):
    Uy, Dy = lum(U), lum(D)
    uu = uniform_filter(Uy * Uy, win, mode='reflect')
    dd = uniform_filter(Dy * Dy, win, mode='reflect')
    ud = uniform_filter(Uy * Dy, win, mode='reflect')
    return uu, dd, ud


def variant_A(P, E, bmax=2.0, win=33, su=1.6, st=4.0, eps=1.0):
    Lp, U, D = parts(P, E, su, st)
    uu, dd, ud = local_stats(U, D, win)
    beta = np.clip(ud / (uu + eps), 0, bmax)
    beta = gaussian_filter(beta, win / 4)
    M = Lp + beta[..., None] * U
    return np.clip(M + 0.5, 0, 255).astype(np.uint8), beta


def variant_B(P, E, win=33, r0=0.35, r1=0.7, cap=1.0, su=1.6, st=4.0, eps=1.0):
    """cap: the ESRGAN detail may not exceed cap * the painting's own local detail amplitude plus a floor of 3 levels."""
    Lp, U, D = parts(P, E, su, st)
    uu, dd, ud = local_stats(U, D, win)
    r = ud / np.sqrt(uu * dd + eps)
    w = smoothstep(r0, r1, r)
    w = gaussian_filter(w, win / 4)
    # amplitude cap: |D| <= 3 + cap * (local rms of U) * 3
    rms = np.sqrt(uniform_filter(lum(U) ** 2, win, mode='reflect'))
    amp = 3.0 + cap * 3.0 * rms
    Dc = amp[..., None] * np.tanh(D / amp[..., None])
    M = Lp + w[..., None] * Dc
    return np.clip(M + 0.5, 0, 255).astype(np.uint8), w


def back_project(M, P, iters=2):
    """Make the master reduced to 1x (2x2 box) equal P: add the bicubic-upsampled residual."""
    Mf = M.astype(np.float32)
    for _ in range(iters):
        down = Mf.reshape(Mf.shape[0] // 2, 2, Mf.shape[1] // 2, 2, 3).mean((1, 3))
        res = P.astype(np.float32) - down
        up = np.asarray(Image.fromarray(np.clip(res + 128, 0, 255).astype(np.uint8), 'RGB').resize((Mf.shape[1], Mf.shape[0]), Image.BICUBIC), np.float32) - 128
        # the uint8 round trip above loses sub-level residuals; use float resize for accuracy
        up = np.stack([np.asarray(Image.fromarray(res[..., c], 'F').resize((Mf.shape[1], Mf.shape[0]), Image.BICUBIC)) for c in range(3)], -1)
        Mf = Mf + up
    return np.clip(Mf + 0.5, 0, 255).astype(np.uint8)


from scipy.ndimage import maximum_filter, grey_closing


def ridge_strength(g, win=11):
    return np.maximum(0.0, uniform_filter(g, win, mode='reflect') - g)


def variant_C(P, E, bmax=2.0, win=33, k_support=1.2, floor=4.0, e0=2.0, e1=12.0, grow=3, feather=1.5, A=None):
    """ESRGAN where it adds no thin dark line the painting does not imply; the adaptive-unsharp master (A) where it does.
    A thin dark line is a pixel darker than its 11x11 mean (ridge). It is 'supported' when the carrier has a ridge of at least 1/k_support of it within 2 px."""
    Lp = carrier(P)
    if A is None:
        A, _ = variant_A(P, E, bmax=bmax, win=win)
    gE = lum(E.astype(np.float32))
    gL = lum(Lp)
    rsE, rsL = ridge_strength(gE), ridge_strength(gL)
    sup = maximum_filter(rsL, size=5)
    excess = np.maximum(0.0, rsE - k_support * sup - floor)
    m = smoothstep(e0, e1, excess)
    if grow:
        m = maximum_filter(m, size=2 * grow + 1)
    m = gaussian_filter(m, feather)
    M = E.astype(np.float32) * (1 - m[..., None]) + A.astype(np.float32) * m[..., None]
    return np.clip(M + 0.5, 0, 255).astype(np.uint8), m


def variant_D(P, E, kappa=1.2, a0=3.0, su=1.6, st=4.0, rmswin=17, erase=False, A=None, **kw):
    """ESRGAN's detail D = E - carrier (low frequencies removed), squashed per pixel by tanh to an amplitude the PAINTING allows:
    amp = a0 + kappa * (local rms of the painting's own fine detail U). Where the painting is smooth (soft ripples) nothing can get crisp or dark;
    where it has real structure ESRGAN's sharpening passes. erase=True also applies the unsupported-thin-dark-ridge eraser of variant C."""
    Lp, U, D = parts(P, E, su, st)
    rms = np.sqrt(uniform_filter(lum(U) ** 2, rmswin, mode='reflect'))
    rms = gaussian_filter(rms, rmswin / 3)
    amp = (a0 + kappa * rms)[..., None]
    Dc = amp * np.tanh(D / amp)
    M = np.clip(Lp + Dc + 0.0, 0, 255)
    Mi = np.clip(M + 0.5, 0, 255).astype(np.uint8)
    if erase:
        Mi, _ = variant_C(P, Mi, A=A if A is not None else variant_A(P, Mi, bmax=1.5)[0], **kw)
    return Mi, amp[..., 0]
