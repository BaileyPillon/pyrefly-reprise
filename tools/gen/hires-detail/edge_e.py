"""edge_e.py: the edge treatment "E" for a hi-res figure master (r39-art pilot, 2026-10-04). Candidates only.

E takes the APPROVED 1x painting P (RGBA) and a master M (RGBA at S x, any method) and returns M with
  1. a smooth alpha: the approved contour, smoothed in the signed-distance domain (a Gaussian of `sigma` 1x px on the signed distance) and then forbidden to move more
     than `delta` 1x px from the approved contour (less on thin structures: a spear shaft, a hair tip, a gap keep their width), redrawn as a 1 to 1.5 px ramp at S x;
     only where the painting has a solid edge (partial-alpha plateaus such as glows and ghosts are left as they are);
  2. edge colour decontaminated: a pixel within 2.5 px (1x) of the silhouette that is the interior colour mixed with white (the white background the cut-out
     left in its first 1 to 2 px) loses the white; the interior colour beside it is the reference, so a white mane or a white cloth, whose interior is white too, is untouched;
  3. colour bled 24 px outward under the soft edge, so a bilinear or mip sample never blends in white or black.
The silhouette is otherwise the approved one: apply_E reports the alpha IoU against the approved alpha upscaled and the mean edge displacement (px at S x).
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, gaussian_filter, maximum_filter, minimum_filter


def _smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def _up(a, size):
    return np.asarray(Image.fromarray(np.ascontiguousarray(a, np.float32), 'F').resize(size, Image.BICUBIC), np.float32)


def _sdf(inside):
    """Signed distance (px) to the 0.5 contour: negative inside, positive outside (contour at the pixel boundary)."""
    d_in = distance_transform_edt(inside).astype(np.float32)
    d_out = distance_transform_edt(~inside).astype(np.float32)
    return np.where(inside, -(d_in - 0.5), d_out - 0.5), d_in, d_out


def _crop_box(alpha, pad):
    ys, xs = np.nonzero(alpha > 0.01)
    if len(ys) == 0:
        return 0, alpha.shape[0], 0, alpha.shape[1]
    return (max(0, ys.min() - pad), min(alpha.shape[0], ys.max() + 1 + pad), max(0, xs.min() - pad), min(alpha.shape[1], xs.max() + 1 + pad))


def contour_stats(a_ref, a_new):
    """alpha IoU (0.5 level) and the mean edge displacement (px, at the arrays' scale): the mean |signed distance to the reference contour| over the new contour's pixels."""
    r, n = a_ref > 0.5, a_new > 0.5
    iou = float((r & n).sum() / max(1, (r | n).sum()))
    phi_r, _, _ = _sdf(r)
    edge = n & ~minimum_filter(n, size=3)
    disp = float(np.abs(phi_r[edge]).mean()) if edge.any() else 0.0
    # the displacement of the reference contour itself against the new one, symmetric
    phi_n, _, _ = _sdf(n)
    edge_r = r & ~minimum_filter(r, size=3)
    disp2 = float(np.abs(phi_n[edge_r]).mean()) if edge_r.any() else 0.0
    return iou, 0.5 * (disp + disp2)


def smooth_alpha(P, S, size, sigma=0.8, delta=0.6, ramp=1.5):
    """The smooth alpha at S x (float 0..1) and the solid-edge zone it was applied in."""
    a1 = P[..., 3].astype(np.float32) / 255.0
    Aup = np.clip(_up(a1, size), 0, 1)
    k = int(2 * S) * 2 + 1
    mx = maximum_filter(Aup, size=k)
    mn = minimum_filter(Aup, size=k)
    zone = gaussian_filter(((mx > 0.85) & (mn < 0.15)).astype(np.float32), 1.0 * S)
    inside = Aup > 0.5
    phi, d_in, d_out = _sdf(inside)
    phib = gaussian_filter(phi, sigma * S)
    # thin structures keep their width: the allowed displacement grows with the local thickness (inside) and the local gap (outside)
    big = 3 * S
    thick_in = maximum_filter(d_in, size=2 * big + 1)
    thick_out = maximum_filter(d_out, size=2 * big + 1)
    thick = np.minimum(thick_in, np.where(thick_out > 0, thick_out, big))
    dmax = delta * S * np.clip(thick / (2.0 * S), 0.15, 1.0)
    phiE = np.clip(phib, phi - dmax, phi + dmax)
    aE = np.clip(0.5 - phiE / (ramp * 1.0), 0, 1)
    aE = aE * aE * (3 - 2 * aE)
    A = Aup * (1 - zone) + aE * zone
    return A.astype(np.float32), Aup, zone


def decontaminate(rgb, A, S, band=2.5, white=(255.0, 255.0, 255.0), core_px=None):
    """rgb: float32 HxWx3 (the master's colour); A: the smooth alpha. Returns (rgb', contamination map)."""
    core = A >= 0.999
    d_in = distance_transform_edt(A > 0.5).astype(np.float32)
    core = core & (d_in >= (3.5 * S if core_px is None else core_px))
    if not core.any():
        return rgb, np.zeros(A.shape, np.float32)
    # the interior colour beside each edge pixel: the nearest core pixel's colour, smoothed (a Voronoi cell would show)
    _, (iy, ix) = distance_transform_edt(~core, return_indices=True)
    F = rgb[iy, ix]
    F = gaussian_filter(F, (S * 0.5, S * 0.5, 0))
    W = np.array(white, np.float32)
    WF = W[None, None, :] - F
    wf2 = (WF ** 2).sum(-1)
    wfn = np.sqrt(wf2)
    CF = rgb - F
    t = np.clip((CF * WF).sum(-1) / np.maximum(wf2, 1.0), 0.0, 1.0)
    resid = np.sqrt(((CF - t[..., None] * WF) ** 2).sum(-1)) / np.maximum(wfn, 1.0)
    lum = lambda c: c[..., 0] * 0.299 + c[..., 1] * 0.587 + c[..., 2] * 0.114
    lighter = _smoothstep(8.0, 28.0, lum(rgb) - lum(F))
    collinear = _smoothstep(0.45, 0.18, resid)
    strength = _smoothstep(0.06, 0.28, t)
    enough_white = _smoothstep(55.0, 90.0, wfn)          # an interior that is white already has nothing to lose
    # a pixel that is mostly white (a scrap of the cut-out's white background kept at the edge) is looked for deeper, up to 4 px (1x)
    band_eff = band * S + (4.0 * S - band * S) * _smoothstep(0.55, 0.8, t)
    in_band = _smoothstep(band_eff + S, band_eff - 0.5 * S, d_in) * (A > 0.02)
    # outside the silhouette (the soft ramp) counts too: d_in is 0 there, the band weight stays 1
    c = lighter * collinear * strength * enough_white * in_band
    c = gaussian_filter(c, 0.6 * S / 2)
    out = rgb - (c * t)[..., None] * WF
    return np.clip(out, 0, 255), c


def bleed(rgb, A, px):
    """Colour under (and beyond) the soft edge: the nearest solid pixel's colour out to px, so no filter blends in white or black."""
    solid = A >= 0.98
    d, (iy, ix) = distance_transform_edt(~solid, return_indices=True)
    nearest = rgb[iy, ix]
    w = (A >= 0.98)[..., None]
    out = np.where(w, rgb, nearest)
    keep = d <= px
    out[~keep] = 0
    return out


def apply_E(P, M, S, sigma=0.8, delta=0.6, ramp=1.5, band=2.5, bleed_px=24, core_px=None):
    """P: approved 1x RGBA uint8; M: master RGBA uint8 at S x. Returns (N RGBA uint8, metrics dict)."""
    H, W = M.shape[:2]
    y0, y1, x0, x1 = _crop_box(M[..., 3].astype(np.float32) / 255.0, 32 * S // 4)
    y0, x0 = y0 // S * S, x0 // S * S
    y1, x1 = min(H, (y1 + S - 1) // S * S), min(W, (x1 + S - 1) // S * S)
    Pc = P[y0 // S:y1 // S, x0 // S:x1 // S]
    Mc = M[y0:y1, x0:x1]
    size = (x1 - x0, y1 - y0)
    A, Aup, zone = smooth_alpha(Pc, S, size, sigma, delta, ramp)
    rgb = Mc[..., :3].astype(np.float32)
    rgb2, c = decontaminate(rgb, A, S, band, core_px=core_px)
    rgb3 = bleed(rgb2, A, bleed_px)
    N = M.copy()
    N[y0:y1, x0:x1, :3] = np.clip(rgb3 + 0.5, 0, 255).astype(np.uint8)
    N[y0:y1, x0:x1, 3] = np.clip(A * 255 + 0.5, 0, 255).astype(np.uint8)
    # outside the crop nothing changes (it is empty)
    iou, disp = contour_stats(Aup, A)
    changed = float((c > 0.2).sum())
    met = {'alpha_iou_vs_approved_up': round(iou, 5), 'edge_displacement_px_at_S': round(disp, 3), 'edge_displacement_px_1x': round(disp / S, 3),
           'decontaminated_px': int(changed), 'S': S, 'sigma_1x': sigma, 'delta_1x': delta, 'ramp_px': ramp}
    return N, met


if __name__ == '__main__':
    p, m, out = sys.argv[1], sys.argv[2], sys.argv[3]
    S = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    P = np.asarray(Image.open(p).convert('RGBA'))
    M = np.asarray(Image.open(m).convert('RGBA'))
    N, met = apply_E(P, M, S)
    Image.fromarray(N, 'RGBA').save(out, compress_level=6)
    print(met)
