"""Living portrait v5 pilot (game case: both): the head-only swap metric over a 1-degree sweep (pilot-shots.mjs sweep).

Why head-only: the v4.1 whole-frame 5-degree metric diluted a ghost across the body and the background and flagged
nothing (method doc). Here every 1-degree step is measured inside the HEAD BOX (x 96..832, y 0..800: hair top to
below the chin, both hair sides; the pinned body and the frame below are out) and inside the FACE BOX (x 250..700,
y 330..720: eyes, nose, mouth), plus the worst 32 px block of the head box.

  S(cut) = head-box MAD of the step where the painting changes / median head-box MAD of the 1-degree steps on that
           side of the plate (0..+R or -R..0), same sweep direction.

    python sweep-metric.py <sweep dir> [range deg]   -> <sweep dir>/metric.json and a printed table
"""
import json
import sys
import pathlib

import numpy as np
from PIL import Image

HEAD = (slice(0, 800), slice(96, 832))
FACE = (slice(330, 720), slice(250, 700))


def rgb(p):
    return np.asarray(Image.open(p).convert("RGB")).astype(np.float32)


def blocks(d, s=32):
    h, w = d.shape
    h -= h % s
    w -= w % s
    return d[:h, :w].reshape(h // s, s, w // s, s).mean((1, 3))


def run(sweep, rng=999):
    sweep = pathlib.Path(sweep)
    log = json.loads((sweep / "log.json").read_text())
    out = {"headBox": "x 96..832, y 0..800", "faceBox": "x 250..700, y 330..720", "dirs": {}}
    for dname in ("up", "down"):
        rows = [r for r in log if r["dir"] == dname and abs(r["target"]) <= rng]
        steps = []
        prev = None
        for r in rows:
            im = rgb(sweep / r["file"])
            if prev is not None:
                pr, pim = prev
                d = np.abs(im - pim).mean(-1)
                steps.append({"a": pr["target"], "b": r["target"], "yawA": pr["yaw"], "yawB": r["yaw"],
                              "paintA": pr["paint"]["to"], "paintB": r["paint"]["to"],
                              "mixed": bool(r["paint"]["from"] is not None or pr["paint"]["from"] is not None),
                              "head": float(d[HEAD].mean()), "face": float(d[FACE].mean()), "block": float(blocks(d[HEAD]).max())})
            prev = (r, im)
        for s in steps:
            s["cut"] = s["paintA"] != s["paintB"]
            side = [t for t in steps if (t["a"] + t["b"]) * (s["a"] + s["b"]) > 0]  # same side of the plate
            med = float(np.median([t["head"] for t in side]))
            medf = float(np.median([t["face"] for t in side]))
            medb = float(np.median([t["block"] for t in side]))
            s["S"] = s["head"] / med
            s["Sface"] = s["face"] / medf
            s["Sblock"] = s["block"] / medb
        out["dirs"][dname] = {
            "medianHead": float(np.median([t["head"] for t in steps])),
            "steps": steps,
            "cuts": [{k: (round(v, 3) if isinstance(v, float) else v) for k, v in s.items()} for s in steps if s["cut"]],
            "mixedFrames": sum(1 for r in rows if r["paint"]["from"] is not None),
            "frames": len(rows),
            "maxNonCutS": round(max(s["S"] for s in steps if not s["cut"]), 3),
        }
    (sweep / "metric.json").write_text(json.dumps(out, indent=1))
    return out


if __name__ == "__main__":
    res = run(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 999)
    for dname, d in res["dirs"].items():
        print(f"== {sys.argv[1]} {dname}: median head step {d['medianHead']:.2f}, mixed frames {d['mixedFrames']}/{d['frames']}, max non-cut S {d['maxNonCutS']}")
        for c in d["cuts"]:
            print(f"   cut {c['a']:+d}->{c['b']:+d} {c['paintA']} -> {c['paintB']}: head {c['head']:.2f} S {c['S']:.2f} | face S {c['Sface']:.2f} | block S {c['Sblock']:.2f}")
