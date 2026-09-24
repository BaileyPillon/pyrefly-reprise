"""Living portrait v5.1 (game case: both): the two checks the v5 pilot's judge ran by hand, on a 1-degree sweep.

1. Tassel track: the tassel's red block located by template match in every frame of each sweep direction. A jump
   at a cut shows as a step at the cut frame far above the steps around it.
2. Pure swap at the same yaw: the 3-degree hysteresis makes the up and down sweeps pass the same yaw with different
   paintings; their difference isolates what the painting change alone alters (head, eyes, mouth, jaw boxes).
   The tassel offset between the two is reported separately: the earring's loose swing lags the head (the
   renderer's LooseMotion), so up and down differ there by the swing, at every yaw, cut or not.

    python cut_checks.py <sweep dir> [range]   -> <sweep dir>/cut-checks.json + a printed summary
"""
import json
import pathlib
import sys

import cv2
import numpy as np

BOX = {"head": (slice(0, 800), slice(96, 832)), "eyes": (slice(340, 480), slice(240, 720)),
       "mouth": (slice(560, 700), slice(340, 640)), "jaw": (slice(620, 800), slice(300, 680))}
TPL = (235, 540, 300, 640)  # the tassel's red block on the plate (x0, y0, x1, y1)


def track(sweep, rows, tpl):
    out = []
    for r in rows:
        im = cv2.imread(str(sweep / r["file"]))
        res = cv2.matchTemplate(im[440:760, 120:720], tpl, cv2.TM_CCOEFF_NORMED)
        _, mv, _, (x, y) = cv2.minMaxLoc(res)
        def sub(a, i):
            if 0 < i < len(a) - 1:
                den = a[i - 1] - 2 * a[i] + a[i + 1]
                return i + 0.5 * (a[i - 1] - a[i + 1]) / den if den else i
            return i
        out.append({"target": r["target"], "yaw": r["yaw"], "paint": r["paint"]["to"],
                    "x": float(sub(res[y, :], x) + 120 - TPL[0]), "y": float(sub(res[:, x], y) + 440 - TPL[1]), "score": float(mv)})
    return out


def main(sweep, rng):
    sweep = pathlib.Path(sweep)
    log = json.loads((sweep / "log.json").read_text())
    ref = next(r for r in log if r["dir"] == "up" and r["target"] == 0)
    tpl = cv2.imread(str(sweep / ref["file"]))[TPL[1]:TPL[3], TPL[0]:TPL[2]]
    res = {"tassel": {}, "sameYaw": []}
    tracks = {}
    for d in ("up", "down"):
        rows = [r for r in log if r["dir"] == d and abs(r["target"]) <= rng]
        t = track(sweep, rows, tpl)
        tracks[d] = t
        steps = [(a, b, abs(b["x"] - a["x"]), a["paint"] != b["paint"]) for a, b in zip(t, t[1:])]
        cut = [s[2] for s in steps if s[3]]
        non = [s[2] for s in steps if not s[3]]
        res["tassel"][d] = {"cutSteps": [round(v, 2) for v in cut], "medianNonCut": round(float(np.median(non)), 2),
                            "maxNonCut": round(float(max(non)), 2), "minScore": round(min(x["score"] for x in t), 3)}
    up = {r["target"]: r for r in log if r["dir"] == "up"}
    for r in log:
        if r["dir"] != "down" or abs(r["target"]) > rng:
            continue
        u = up.get(r["target"])
        if not u or u["paint"]["to"] == r["paint"]["to"]:
            continue
        if min(u.get("ap", 1), r.get("ap", 1)) < 0.999 or max(u.get("mw", 0), r.get("mw", 0)) > 0.001:
            res.setdefault("sameYawSkippedFaceEvent", []).append(r["target"])  # an idle half-lid caught in one sweep
            continue
        a = cv2.imread(str(sweep / u["file"])).astype(np.float32)
        b = cv2.imread(str(sweep / r["file"])).astype(np.float32)
        dd = np.abs(a - b).mean(-1)
        tu = next(x for x in tracks["up"] if x["target"] == r["target"])
        td = next(x for x in tracks["down"] if x["target"] == r["target"])
        res["sameYaw"].append({"yaw": r["target"], "up": u["paint"]["to"], "down": r["paint"]["to"],
                               **{k: round(float(dd[s].mean()), 2) for k, s in BOX.items()},
                               "tasselUpMinusDown": round(tu["x"] - td["x"], 2)})
    # the noise floor: same painting both ways at the same yaw
    floor = []
    for r in log:
        u = up.get(r["target"])
        if r["dir"] == "down" and u and u["paint"]["to"] == r["paint"]["to"] and abs(r["target"]) <= rng:
            a = cv2.imread(str(sweep / u["file"])).astype(np.float32)
            b = cv2.imread(str(sweep / r["file"])).astype(np.float32)
            floor.append(float(np.abs(a - b).mean(-1)[BOX["head"]].mean()))
    res["sameYawNoiseFloorHead"] = {"median": round(float(np.median(floor)), 2), "max": round(float(max(floor)), 2), "n": len(floor)}
    same = [next(x for x in tracks["up"] if x["target"] == t["target"])["x"] - t["x"] for t in tracks["down"]
            if up.get(t["target"]) and up[t["target"]]["paint"]["to"] == t["paint"]]
    res["tasselUpMinusDownSamePainting"] = {"median": round(float(np.median(same)), 2), "min": round(float(min(same)), 2),
                                            "max": round(float(max(same)), 2), "n": len(same)}
    (sweep / "cut-checks.json").write_text(json.dumps(res, indent=1))
    return res


if __name__ == "__main__":
    r = main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 999)
    print(json.dumps(r["tassel"], indent=1))
    for s in r["sameYaw"]:
        print(s)
    print("noise floor", r["sameYawNoiseFloorHead"], "skipped (face event)", r.get("sameYawSkippedFaceEvent"))
    print("tassel up-down at the same painting", r["tasselUpMinusDownSamePainting"])
