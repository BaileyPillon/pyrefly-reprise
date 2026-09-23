"""Living-portrait v3.2: the numbers behind shots/RUNTIME-CHECK.md, read off a
tools/gen/rig-check.mjs run directory with the v3.1 check's own methods
(critic/scratch/living-portrait-v3: rest.py, straight.py, idle.py).

    python -s tools/gen/rig-measure.py --run <rig-check out dir> --out <json>
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib

import numpy as np
from PIL import Image

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)

BG = np.array([0.03, 0.02, 0.03]) * 255
IPD = float(np.hypot(609 - 338, 406 - 422))
HEADW = 2.2 * IPD


def plate_over_bg():
    p = L.load_rgba(L.PLATE).astype(np.float64)
    a = p[..., 3:4] / 255.0
    return p[..., :3] * a + BG * (1 - a), p[..., 3] > 127


def rgb(path):
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float64)


def rest(run):
    plate, fig = plate_over_bg()
    out = {}
    for name in ("rest-post0", "rest-post"):
        img = rgb(run / f"{name}.png")
        d = np.abs(img - plate).max(-1)
        lum = lambda x: (x * [0.299, 0.587, 0.114]).sum(-1)
        out[name] = {"madAll": round(float(np.abs(img - plate).mean()), 4), "maxAll": int(d.max()), "pxOver1": int((d > 1).sum()),
                     "madFigure": round(float(np.abs(img - plate)[fig].mean()), 3),
                     "figureLumPlate": round(float(lum(plate)[fig].mean()), 2), "figureLum": round(float(lum(img)[fig].mean()), 2)}
    return out


def runs(mask):
    vb = mask[:, 1:] != mask[:, :-1]
    hb = mask[1:, :] != mask[:-1, :]

    def longest(b):
        best = 0
        for c in range(b.shape[1]):
            col = b[:, c]
            if not col.any():
                continue
            d = np.diff(np.concatenate([[0], col.astype(int), [0]]))
            best = max(best, int((np.nonzero(d == -1)[0] - np.nonzero(d == 1)[0]).max()))
        return best
    return longest(vb), longest(hb.T)


def straight():
    rig = L.read_json(L.ART / "rig.json")
    v3 = rig["artMeta"]["v3"]
    items = [(l["name"], l["file"]) for l in v3["frontal"]["layers"]]
    for k in rig["keys"]:
        if k["id"] == "frontal":
            continue
        for part in ("back", "front"):
            items.append((f"{k['id']}.{part}", v3["keys"][k["id"]][part]["file"]))
    out = {}
    for name, f in items:
        m = np.asarray(Image.open(L.ART / f).convert("RGBA"))[..., 3] > 127
        v, h = runs(m)
        out[name] = {"longestVertical": v, "longestHorizontal": h}
    return out


def shift(a, b):
    A = np.fft.fft2(a - a.mean()); B = np.fft.fft2(b - b.mean())
    R = A * np.conj(B); R /= np.abs(R) + 1e-9
    r = np.fft.ifft2(R).real
    y, x = np.unravel_index(np.argmax(r), r.shape)
    H, W = r.shape

    def sub(c, m, axis):
        l, cc, rr = (r[(c - 1) % H, x], r[c, x], r[(c + 1) % H, x]) if axis == 0 else (r[y, (c - 1) % W], r[y, c], r[y, (c + 1) % W])
        den = l - 2 * cc + rr
        v = c + (0.5 * (l - rr) / den if den != 0 else 0)
        return v - m if v > m / 2 else v
    return sub(y, H, 0), sub(x, W, 1)


def idle(run):
    log = json.loads((run / "log-idle.json").read_text())["idle"]
    g = lambda p: np.asarray(Image.open(p).convert("L")).astype(np.float64)
    f0, c0 = g(run / "idle/f000.png"), g(run / "idle/c000.png")
    hw = (slice(350, 620), slice(180, 470))
    hx, hy, cx, cy = [], [], [], []
    for k in range(len(log)):
        f, c = g(run / f"idle/f{k:03d}.png"), g(run / f"idle/c{k:03d}.png")
        a, b = shift(f[hw], f0[hw]); hy.append(a); hx.append(b)
        a, b = shift(c, c0); cy.append(a); cx.append(b)
    amp = lambda v: (max(v) - min(v)) / 2

    def win(v, n=55):
        """The spec's own measure (section 6): half the peak-to-peak of each 5.5 s window, median."""
        hs = sorted((max(v[s:s + n]) - min(v[s:s + n])) / 2 for s in range(0, len(v) - n + 1, n))
        return hs[len(hs) // 2] if hs else float("nan")
    windows = {"windows": len(hx) // 55, "headXPctHeadWidth": round(win(hx) / HEADW * 100, 2), "headYPctHeadWidth": round(win(hy) / HEADW * 100, 2),
               "chestXPctIpd": round(win(cx) / IPD * 100, 2), "chestYPctIpd": round(win(cy) / IPD * 100, 2)}
    return {"frames": len(log), "spec5p5sWindowsMedian": windows, "headXPctHeadWidth": round(amp(hx) / HEADW * 100, 2), "headYPctHeadWidth": round(amp(hy) / HEADW * 100, 2),
            "chestXPctIpd": round(amp(cx) / IPD * 100, 2), "chestYPctIpd": round(amp(cy) / IPD * 100, 2),
            "yawRangeDeg": [round(min(r["yaw"] for r in log), 2), round(max(r["yaw"] for r in log), 2)],
            "paintsSeen": sorted({(r["paint"] or {}).get("to", "?") for r in log}),
            "framesMixed": sum(1 for r in log if (r["paint"] or {}).get("from"))}


def mouse(run):
    rows = json.loads((run / "log-mouse.json").read_text())["mouse"]
    out = {}
    for deg in sorted({r["deg"] for r in rows}):
        rs = [r for r in rows if r["deg"] == deg]
        out[str(deg)] = {"samples": len(rs), "mixedShare": round(sum(1 for r in rs if r["paint"] and r["paint"]["from"]) / len(rs), 3),
                         "paints": sorted({r["paint"]["to"] for r in rs if r["paint"]}),
                         "yawRange": [min(r["yaw"] for r in rs), max(r["yaw"] for r in rs)]}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    run = pathlib.Path(a.run)
    res = {"rest": rest(run), "straight": straight()}
    for k, fn in (("idle", idle), ("mouse", mouse)):
        try:
            res[k] = fn(run)
        except FileNotFoundError as e:
            res[k] = f"missing: {e.filename}"
    for f in ("log-blink.json", "log-turnblink.json", "log-seams.json", "log-smile.json", "log-clip.json"):
        p = run / f
        if p.exists():
            res[f.replace("log-", "").replace(".json", "")] = json.loads(p.read_text())
    pathlib.Path(a.out).write_text(json.dumps(res, indent=1))
    print(json.dumps({k: v for k, v in res.items() if k in ("rest", "idle", "mouse")}, indent=1))
    worst = sorted(res["straight"].items(), key=lambda kv: -kv[1]["longestVertical"])[:6]
    print("longest vertical alpha edges:", [(k, v["longestVertical"]) for k, v in worst])


if __name__ == "__main__":
    main()
