"""Living portrait v6 full (both): the continuity numbers for NOTES.md.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY measure6.py            # reads CAP (shots6.mjs, turn6.py, the two sweep-metric/cut_checks runs); writes CAP/measure6.json

  weights   per-frame change of every weight (the plan: <= 0.06 a frame, except the 3-frame blink close), lids outside
            blinks, the gaze: peak eye lead at each input step, fastest idle gaze step
  cuts      in the clip: every frame where the painting changes; the face-box step there over the median of the 12
            frames round it (boxes follow the keys' landmarks at the frame's yaw); frames with two paintings
  throat    the thin-line detector on the throat (canvas y 800-860, x 380-620, page scale): frames with a run of 40 px
  sweeps    the head/face S at every cut (sweep-metric.py) and the same-yaw swap by region (cut_checks.py), v6 with an
            expression held, v6 at rest, v5.1 as committed (the same stepped sweep)
  hair      the method's Fix 2 numbers in the far-side hair box at +-30 / +-40 (disclosed, not fixed on the CPU)
"""
import json
import os
import pathlib
import sys

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "v6-pilot" / "tools"))
import common as C  # noqa: E402

CAP = pathlib.Path(os.environ.get("LP6_CAP", "D:/Tools/pyrefly-scratch/picks0925/portrait-a2/cap"))
LM = ["pupil_R", "noseTip", "philtrum", "mouthCorner_R", "lipUpper", "lipLower", "chin", "browCenter", "pupil_L"]
CHANNELS = ("open", "smile", "press", "browRaise", "browDraw")


def weights(script):
    w = json.loads((CAP / f"faces-{script}" / "weights.json").read_text())
    out = {}
    for p in CHANNELS:
        d = np.abs(np.diff([f[p] for f in w]))
        out[p] = round(float(d.max()), 4)
    lid = np.array([f["lid"] for f in w])
    dl = np.abs(np.diff(lid))
    calm = [(lid[i] > 0.9 and lid[i + 1] > 0.9) for i in range(len(dl))]
    out["lidOutsideBlinks"] = round(float(dl[np.array(calm)].max()), 4)
    gx = np.array([f["gazeX"] for f in w])
    gy = np.array([f["gazeY"] for f in w])
    fps = 60 if script == "clip" else 50
    sp = np.hypot(np.diff(gx), np.diff(gy)) * fps
    out["gazeRangeX"] = [round(float(gx.min()), 2), round(float(gx.max()), 2)]
    out["gazeRangeY"] = [round(float(gy.min()), 2), round(float(gy.max()), 2)]
    out["gazeFastestPxPerS"] = round(float(sp.max()), 1)
    log = json.loads((CAP / f"log2-{script}.json").read_text())["frames"]
    yaw = np.array([f["yaw"] for f in log])
    held = np.abs(np.diff(yaw)) * fps < 1.0  # the head all but still: idle, no input
    out["idleGazeFastestPxPerS"] = round(float(sp[held].max()), 1) if held.any() else None
    # the lead: eye-in-head minus where the eyes settle for that head yaw (C_HOLD x yaw), at its peak per input step
    lead = gx - (11.0 / 85.0) * yaw
    out["leadPeakPx"] = round(float(np.abs(lead).max()), 2)
    return out


def landmarks():
    r = C.rig()
    keys = sorted(r["keys"], key=lambda k: k["yawDeg"])
    return [(k["yawDeg"], np.array(k["landmarks"], np.float64)) for k in keys]


def lm_at(L, yaw):
    ys = [y for y, _ in L]
    i = int(np.clip(np.searchsorted(ys, yaw) - 1, 0, len(ys) - 2))
    (ya, a), (yb, b) = L[i], L[i + 1]
    g = float(np.clip((yaw - ya) / (yb - ya), 0, 1))
    return a + (b - a) * g


def cuts(script):
    log = json.loads((CAP / f"log2-{script}.json").read_text())
    fr, box = log["frames"], log["box"]
    w = json.loads((CAP / f"faces-{script}" / "weights.json").read_text())
    L = landmarks()
    sx, sy = box["width"] / 832.0, box["height"] / 1216.0
    names = json.loads(json.dumps(C.rig()["artMeta"]["commonLandmarkOrder"]))

    def page_box(lm, parts, pad):
        pts = np.array([lm[names.index(p)] for p in parts])
        x0, y0 = pts.min(0) - pad
        x1, y1 = pts.max(0) + pad
        return (int(box["x"] + x0 * sx), int(box["y"] + y0 * sy), int(box["x"] + x1 * sx), int(box["y"] + y1 * sy))

    def grey(i):
        return np.asarray(Image.open(CAP / f"frames-{script}" / f"{i:05d}.png").convert("L")).astype(np.float32)

    blink = [f["lid"] < 0.9 for f in w]
    out = []
    for i in range(1, len(fr)):
        if fr[i]["paint"]["to"] == fr[i - 1]["paint"]["to"]:
            continue
        lm = lm_at(L, fr[i]["yaw"])
        regions = {"eyes": page_box(lm, ["pupil_R", "pupil_L", "browCenter"], 45), "mouth": page_box(lm, ["mouthCorner_R", "mouthCorner_L", "lipLower", "philtrum"], 30)}
        res = {"frame": i, "from": fr[i - 1]["paint"]["to"], "to": fr[i]["paint"]["to"], "yaw": fr[i]["yaw"]}
        # the baseline is the neighbours moving at a like speed (0.5-2x the cut's yaw step): a cut on the first frames of a
        # step input has only still frames round it, which are no baseline for a head moving 4 degrees a frame
        dyi = abs(fr[i]["yaw"] - fr[i - 1]["yaw"])
        like = [j for j in range(max(1, i - 6), min(len(fr), i + 7)) if j != i and not (blink[j] or blink[j - 1])
                and (dyi < 0.2 or 0.5 * dyi <= abs(fr[j]["yaw"] - fr[j - 1]["yaw"]) <= 2 * dyi)]
        res["motionOnset"] = len(like) < 3
        for name, (x0, y0, x1, y1) in regions.items():
            steps = {}
            for j in like + [i]:
                if blink[j] or blink[j - 1]:
                    continue
                steps[j] = float(np.abs(grey(j)[y0:y1, x0:x1] - grey(j - 1)[y0:y1, x0:x1]).mean())
            if i in steps and len(steps) > 3:
                med = float(np.median([v for k, v in steps.items() if k != i]))
                res[name] = {"step": round(steps[i], 2), "median": round(med, 2), "S": round(steps[i] / max(med, 1e-6), 2)}
            else:
                res[name] = "blink at the cut" if (blink[i] or blink[i - 1]) else "no neighbours moving alike (step onset)"
        out.append(res)
    return {"cuts": out, "framesWithTwoPaintings": sum(1 for f in fr if f["paint"]["from"] is not None), "frames": len(fr)}


def sweeps():
    res = {}
    for tag in ("sweep", "sweep-rest", "sweep-v51"):
        m = json.loads((CAP / tag / "metric.json").read_text())
        res[tag] = {d: {"S": [c["S"] for c in v["cuts"]], "Sface": [c["Sface"] for c in v["cuts"]], "maxNonCutS": v["maxNonCutS"], "mixed": v["mixedFrames"]}
                    for d, v in m["dirs"].items()}
        cc = json.loads((CAP / tag / "cut-checks.json").read_text())
        res[tag]["sameYaw"] = {r["yaw"]: {k: r[k] for k in ("eyes", "mouth", "jaw")} for r in cc["sameYaw"]}
    return res


HAIR = {"l": (600, 280, 800, 460), "r": (40, 250, 240, 450)}  # the far-side hair above the ear (canvas px)


def hair():
    """Fix 2's numbers (method): gradient energy against the plate warped into the key, row-mean steps, hue."""
    import cv2
    import face6 as F
    plate = C.premul(np.asarray(Image.open(F.PROTO / "art" / "v6" / "keys" / "frontal" / "back.png").convert("RGBA")).astype(np.float32) / 255.0)
    out = {}
    for k in ("v5-l20", "v5-l30", "v5-l40", "v5-r20", "v5-r30", "v5-r40"):
        x0, y0, x1, y1 = HAIR[k[3]]
        key = C.premul(np.asarray(Image.open(F.PROTO / "art" / "v6" / "keys" / k / "back.png").convert("RGBA")).astype(np.float32) / 255.0)
        cm = F.cmap(k)
        warped = C.remap(plate, cm[..., 0], cm[..., 1])
        res = {}
        for name, img in (("key", key), ("plateWarped", warped)):
            b = img[y0:y1, x0:x1]
            lum = C.lum(b[..., :3]) * 255
            gy, gx = np.gradient(lum)
            rows = lum.mean(1)
            st = np.abs(np.diff(rows))
            hsv = cv2.cvtColor(np.clip(b[..., :3], 0, 1).astype(np.float32), cv2.COLOR_RGB2HSV)
            m = b[..., 3] > 0.9
            h = np.deg2rad(hsv[..., 0][m])
            res[name] = {"grad": float(np.hypot(gx, gy).mean()), "rowStepMaxOverMedian": float(st.max() / max(np.median(st), 1e-6)),
                         "hue": float(np.rad2deg(np.arctan2(np.sin(h).mean(), np.cos(h).mean())) % 360)}
        dh = abs((res["key"]["hue"] - res["plateWarped"]["hue"] + 180) % 360 - 180)
        out[k] = {"box": [x0, y0, x1, y1], "gradRatio": round(res["key"]["grad"] / res["plateWarped"]["grad"], 3),
                  "rowStepMaxOverMedian": round(res["key"]["rowStepMaxOverMedian"], 2), "hueDiffDeg": round(dh, 1)}
    return out


def main():
    thr = {k: np.load(CAP / f"{k}.npy") for k in ("throat-before", "throat-after") if (CAP / f"{k}.npy").exists()}
    out = {"weights": {s: weights(s) for s in ("clip", "half")}, "cuts": {s: cuts(s) for s in ("clip", "half")},
           "throat": {k: {"framesFlagged": int((v >= 40).sum()), "frames": int(len(v))} for k, v in thr.items()},
           "sweeps": sweeps(), "rest": json.loads((C.WORK / "rest6.json").read_text()), "hair": hair()}
    (CAP / "measure6.json").write_text(json.dumps(out, indent=1))
    print(json.dumps({k: out[k] for k in ("weights", "throat", "hair")}, indent=1))
    for s in ("clip", "half"):
        print(s, "frames", out["cuts"][s]["frames"], "two paintings", out["cuts"][s]["framesWithTwoPaintings"])
        for c in out["cuts"][s]["cuts"]:
            print("  ", c)


if __name__ == "__main__":
    main()
