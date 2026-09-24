"""Living portrait v6 pilot (both): the plan's acceptance numbers measured on the three clips.

  - continuous curves: the largest per-frame change of every logged weight (blinks excepted: the
    spec's blink closes in 3 frames and opens in 4)
  - gaze: travel reached, idle drift RMS, the fastest idle gaze step (spec: no idle saccade,
    0.49 IPD/s = 133 px/s on this plate)
  - (never still moved to pilot_still.py in part 2: part 1 measured it here on fixed boxes, frame to frame)

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY pilot_clips.py     # reads WORK/log-*.json, writes WORK/pilot-clips.json
"""
import json

import numpy as np

import common as C

IPD = 271.0


def main():
    out = {}
    for name in ("A", "B", "C"):
        tl = json.loads((C.WORK / f"log-{name}.json").read_text())
        t = np.array([f["t"] for f in tl])
        res = {}
        # blink windows (close + hold + open, plus a frame each side)
        from drivers import PRESETS
        blink = np.zeros(len(tl), bool)  # blinks and half blinks (the spec's H1: ~65 ms down)
        for t0, _ in PRESETS[name]["blinks"]:
            blink |= (t >= t0 - 0.02) & (t <= t0 + 0.17)
        for t0, _, dur in PRESETS[name]["lidEvents"]:
            if dur <= 0.3:
                blink |= (t >= t0 - 0.02) & (t <= t0 + dur + 0.02)
        steps = {}
        for k in ("open", "smile", "press", "browRaise", "browDraw", "lid"):
            v = np.array([f[k] for f in tl])
            d = np.abs(np.diff(v))
            d = d[~blink[1:]] if k == "lid" else d
            steps[k] = round(float(d.max()), 4)
        res["maxWeightStepPerFrame"] = steps
        gx = np.array([f["gazeX"] for f in tl])
        gy = np.array([f["gazeY"] for f in tl])
        sp = np.hypot(np.diff(gx), np.diff(gy)) * 60
        # idle = away from the input changes and the glances by 0.6 s
        events = [0.0, 2.0, 5.2] + [g[0] for g in PRESETS[name]["glances"]] + [g[0] + g[2] for g in PRESETS[name]["glances"]]
        idle = np.ones(len(tl), bool)
        for e in events[1:]:
            idle &= ~((t >= e) & (t <= e + 0.6))
        res["gazeRangePx"] = [round(float(gx.min()), 1), round(float(gx.max()), 1), round(float(gy.min()), 1), round(float(gy.max()), 1)]
        res["idleGazeMaxSpeedPxS"] = round(float(sp[idle[1:]].max()), 1)
        res["inputGazeMaxSpeedPxS"] = round(float(sp.max()), 1)
        hold = idle & (((t > 0.3) & (t < 2.0)) | ((t > 6.0)))
        res["idleDriftRmsPx"] = round(float(np.sqrt(((gx[hold] - gx[hold].mean()) ** 2 + (gy[hold] - gy[hold].mean()) ** 2).mean())), 2)
        # never still: measured by pilot_still.py (part 2), the spec's own method
        out[name] = res
        print(name, json.dumps(res))
    (C.WORK / "pilot-clips.json").write_text(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
