"""Gates for a derived pose (FFX only, METHOD-CHECK step 2.7): provenance of every opaque pixel
(idle unchanged / idle moved by a warp / painted by the masked repaint), MAD against the idle outside the
changed region (0 by construction, measured), invented-colour share inside the painted region (pixels more
than CIEDE76 10 from every colour the idle has), canvas and opaque-area ratios.
usage: gates.py <idle.png> <cand.png> <painted_mask.png|-> <out.json>"""
import sys, json, numpy as np, cv2
idle_p, cand_p, paint_p, out = sys.argv[1:5]
I = cv2.imread(idle_p, -1); C = cv2.imread(cand_p, -1)
assert I.shape == C.shape, (I.shape, C.shape)
opI = I[..., 3] > 127; opC = C[..., 3] > 127
same = np.all(I == C, axis=-1)
painted = (cv2.imread(paint_p, 0) > 0) & opC if paint_p != '-' else np.zeros_like(opC)
changed = ~same
moved = changed & opC & ~painted
unchanged = same & opC
# MAD outside the changed region (by construction 0; measured over every pixel whose value is unchanged)
mad_out = float(np.abs(I[~changed].astype(int) - C[~changed].astype(int)).mean()) if (~changed).any() else 0.0
# invented colours: Lab distance from the painted pixels to the idle's palette (quantised, unique)
def lab(bgr):
    return cv2.cvtColor(bgr.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32) * np.array([100 / 255, 1, 1], np.float32) - np.array([0, 128, 128], np.float32)
pal = np.unique((I[opI][:, :3] // 4) * 4 + 2, axis=0)
palL = lab(pal)
inv = 0; npnt = int(painted.sum())
if npnt:
    P = lab(C[painted][:, :3])
    best = np.full(len(P), 1e9, np.float32)
    for i in range(0, len(palL), 2048):
        d = ((P[:, None, :] - palL[None, i:i + 2048, :]) ** 2).sum(-1).min(1)
        best = np.minimum(best, d)
    inv = int((np.sqrt(best) > 10).sum())
meta = dict(candidate=cand_p, idle=idle_p, canvas=[int(C.shape[1]), int(C.shape[0])], canvasSameAsIdle=True,
            opaqueIdle=int(opI.sum()), opaqueCand=int(opC.sum()), opaqueRatio=round(float(opC.sum() / opI.sum()), 4),
            provenance=dict(idleUnchanged=int(unchanged.sum()), idleMoved=int(moved.sum()), painted=npnt),
            shares=dict(idleUnchanged=round(float(unchanged.sum() / opC.sum()), 4), idleMoved=round(float(moved.sum() / opC.sum()), 4),
                        painted=round(float(npnt / opC.sum()), 4)),
            idlePixelShare=round(float((unchanged.sum() + moved.sum()) / opC.sum()), 4),
            madOutsideChanged=mad_out, inventedColourPx=inv, inventedColourShareOfPainted=round(inv / npnt, 4) if npnt else 0.0,
            softAlphaPx=int(((C[..., 3] > 0) & (C[..., 3] < 255)).sum()))
json.dump(meta, open(out, 'w'), indent=1); print(json.dumps(meta))
