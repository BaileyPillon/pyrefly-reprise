"""Living portrait v6 pilot (both), steps 1 and 2 of the plan: lids against the baked frames,
the lid ramp, and the gaze grid. Writes WORK/pilot-lids-gaze.json and look-only JPEGs.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY pilot_lids_gaze.py
"""
import json

import cv2
import numpy as np

import common as C
import rig6

EYE_BOX = (255, 335, 700, 480)


def eyebox(img):
    x0, y0, x1, y1 = EYE_BOX
    return img[y0:y1, x0:x1, :3]


def steps(frames):
    d = [float(np.abs(frames[i + 1] - frames[i]).mean() * 255) for i in range(len(frames) - 1)]
    d = np.array(d)
    med = float(np.median(d))
    return {"median": round(med, 3), "max": round(float(d.max()), 3), "maxOverMedian": round(float(d.max() / max(med, 1e-9)), 2),
            "argmax": int(d.argmax())}


def lids(R, out):
    r = C.rig()
    res = {}
    frames = {}
    for e in r["artMeta"]["v3"]["patches"]["eyes"]:
        bk = C.placed(C.load_rgba(e["file"]), e["box"])
        orc = C.over(R.top, C.over(bk, R.prehair))  # the runtime's order: lid under the fringe
        frames[e["aperture"]] = orc
        mine = R.render({"lidR": e["aperture"], "lidL": e["aperture"]})
        d = np.abs(eyebox(orc) - eyebox(mine)) * 255
        res[e["name"]] = {"eyeBoxMAD": round(float(d.mean()), 3), "max": round(float(d.max()), 1)}
    out["lidsVsBaked"] = res
    # ramp a 1 -> 0 in 120 frames (the continuous port) and the v5.1 nearest-frame switch
    aps = np.linspace(1, 0, 120)
    cont = [eyebox(R.render({"lidR": a, "lidL": a})) for a in aps]
    out["lidRamp"] = steps(cont)
    out["lidRamp"]["worstAperture"] = round(float(aps[out["lidRamp"]["argmax"]]), 3)
    keys = sorted(frames)

    def nearest(a):
        best, bd = None, 1 - a
        for k in keys:
            if abs(k - a) < bd:
                best, bd = k, abs(k - a)
        return R.static if best is None else frames[best]
    old = [eyebox(nearest(a)) for a in aps]
    out["lidRampV51Nearest"] = steps(old)
    # the same ramp in visible openness (what the drivers set): uniform closure
    vis = [eyebox(R.render({"lidR": R.vis_to_port(v), "lidL": R.vis_to_port(v)})) for v in aps]
    out["lidRampVisible"] = steps(vis)
    out["lidRampVisible"]["worstVisible"] = round(float(aps[out["lidRampVisible"]["argmax"]]), 3)
    out["visibleAtBaked"] = {f"{a:.2f}": round(float(R.openness(a)), 3) for a in (0.85, 0.7, 0.55, 0.42, 0.3, 0.18, 0.08, 0.0)}
    # droop ramp (gaze-down coupling): the plate's rim sliding 0 -> 6.6 px
    dr = [eyebox(R.render({"droop": v})) for v in np.linspace(0, 6.6, 60)]
    out["droopRamp"] = steps(dr)
    strip = [0.99, 0.96, 0.93, 0.9, 0.87, 0.85, 0.7, 0.42, 0.18, 0.04, 0.0]
    tiles = []
    for a in strip:
        t = C.to_u8(eyebox(R.render({"lidR": a, "lidL": a})))
        cv2.putText(t, f"a={a:.2f}", (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 1)
        tiles.append(t)
    C.save_jpg(np.concatenate(tiles, 0), C.WORK / "look-lid-ramp.jpg")


def gaze(R, out):
    res = {}
    grid_x, grid_y = np.linspace(-16, 16, 9), np.linspace(-8, 8, 5)
    for socket in ("v3", "row"):
        R.socket = socket
        escaped, smear = 0, []
        for a in (1.0, 0.55, 0.18, 0.0):
            for gy in grid_y:
                for gx in grid_x:
                    img = R.render({"gazeX": gx, "gazeY": gy, "lidR": a, "lidL": a})
                    for k, e in R.eyes.items():
                        x0, y0, x1, y1 = e["box"]
                        # visible disc: render with the disc knocked out and compare
                        vis = _visible_iris(R, k, gx, gy, a)
                        o = cv2.dilate(e["open"].astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
                        escaped += int((vis & ~o & ~e["F"]).sum())
                        if a == 1.0 and (abs(gx) == 16 or abs(gy) == 8):
                            smear.append(_smear(R, k, img[y0:y1, x0:x1], gx, gy))
        res[socket] = {"escapedIrisPx": escaped, "revealedDarkFrac": round(float(np.mean(smear)), 3)}
    R.socket = "row"
    out["gazeGrid"] = res
    tiles = []
    for socket in ("v3", "row"):
        R.socket = socket
        row = []
        for gx, gy in ((-16, 0), (16, 0), (0, -8), (0, 8), (-16, 8), (16, -8)):
            t = C.to_u8(eyebox(R.render({"gazeX": gx, "gazeY": gy})))
            cv2.putText(t, f"{socket} {gx:+d},{gy:+d}", (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 1)
            row.append(t)
        tiles.append(np.concatenate(row, 0))
    R.socket = "row"
    C.save_jpg(np.concatenate(tiles, 1), C.WORK / "look-gaze.jpg")


def _visible_iris(R, k, gx, gy, a):
    """Pixels where the moved disc/catch shows in the final frame (full box of eye k)."""
    e = R.eyes[k]
    x0, y0, x1, y1 = e["box"]
    ball = R.eyeball(k, gx, gy, socket="none")
    return ball[..., 3] > 0.02  # drawn; upper layers are checked by the caller's opening test


def _smear(R, k, frame, gx, gy):
    """Share of the revealed socket (F minus the moved disc) that is darker than the plate's sclera p5."""
    e = R.eyes[k]
    h, w = e["F"].shape
    M = np.float32([[1, 0, gx], [0, 1, gy]])
    moved = cv2.warpAffine(e["F"].astype(np.uint8), M, (w, h)) > 0
    rev = e["F"] & ~moved & e["open"]
    rgb = frame[..., :3] / np.maximum(frame[..., 3:4], 1e-4)
    L = C.lum(rgb)
    sclera = e["open"] & ~e["F"] & (L > 0.5)
    p5 = np.percentile(L[sclera], 5)
    return float((L[rev] < p5).mean()) if rev.any() else 0.0


def main():
    R = rig6.Rig()
    out = {}
    plate = C.premul(C.load_rgba("keys/frontal.png"))
    out["restMAD"] = float(np.abs(R.render({}) - plate).mean() * 255)
    lids(R, out)
    gaze(R, out)
    (C.WORK / "pilot-lids-gaze.json").write_text(json.dumps(out, indent=1))
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
