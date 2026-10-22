"""retarget.py <config name> : the keys, from the keypoints, exactly (analytic 2D skeleton retargeting; no fit, no silhouette).

For every pose: each bone's joint is put where the pose's keypoint says (`party.place`, an offset in the parent's frame) and the bone is turned (and scaled, within `party.scales`) so that its `aim` point lands on
the pose's keypoint for it. A bone whose aim point the pose does not name stays at rest (its part is hidden in that key). The marks are met exactly except where a scale limit binds. Writes <work>/fit/keys.json
(the keys in the rig file's shape: radians, offsets and scales in master px) and <work>/fit/retarget.json (what each bone reached and what a clamp cost).

The pieces of a key are cut from the pose's own painting and registered to whatever these bones are (rig_vcut), so the bones only have to be a natural skeleton pose: what carries the figure is the pieces.
"""
from __future__ import annotations

import json
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import numpy as np  # noqa: E402

import pcommon as P  # noqa: E402


def rot2(a: float) -> np.ndarray:
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s], [s, c]])


def solve_pose(party: P.Party, rest: dict, marks: dict) -> tuple[dict, dict, dict]:
    """Bones of one pose: `({bone: {rot, dx, dy, sx, sy}}, report, {bone: posed joint})`. `rest` and `marks` are in master px (the idle's frame)."""
    pp = party.party
    skel = pp["skeleton"]
    J = {}
    parent = {}
    for b, par, pt in skel:
        J[b] = np.array(rest[pt], float)
        parent[b] = par
    state = {}
    out, rep = {}, {}
    scales = pp.get("scales", {})
    noscale = set(pp.get("noscale", []))
    for b, par, _pt in skel:
        if par is None:
            state[b] = (J[b].copy(), np.eye(2))
            continue
        Pp, Lp = state[par]
        Lpi = np.linalg.inv(Lp)
        place = pp.get("place", {}).get(b)
        d = np.zeros(2)
        if place and place in marks:
            P0 = Pp + Lp @ (J[b] - J[par])
            d = Lpi @ (np.array(marks[place]) - P0)
        Pb = Pp + Lp @ ((J[b] - J[par]) + d)
        r, s = 0.0, 1.0
        aim = pp.get("aim", {}).get(b)
        if aim and aim in marks and aim in rest:
            v = np.array(rest[aim]) - J[b]
            u = Lpi @ (np.array(marks[aim]) - Pb)
            if np.hypot(*v) > 1e-6 and np.hypot(*u) > 1e-6:
                r = P.wrap(math.atan2(u[1], u[0]) - math.atan2(v[1], v[0]))
                s = float(np.hypot(*u) / np.hypot(*v))
                lo, hi = scales.get(b, (0.5, 2.0))
                if b in noscale:
                    s = 1.0
                s_c = min(max(s, lo), hi)
                rep[b] = {"wantScale": round(s, 3), "scale": round(s_c, 3)}
                s = s_c
        Lb = Lp @ rot2(r) @ np.diag([s, s])
        if b in pp.get("exact_aim", []) and aim and aim in marks and aim in rest:  # the aim point lands exactly (the joint slides along the axis by the length mismatch): the head bone puts the idle's head-box top on the pose's, which is what the gate's stature reads
            v = np.array(rest[aim]) - J[b]
            land = Pb + Lb @ v
            shift = np.array(marks[aim]) - land
            Pb = Pb + shift
            d = d + Lpi @ shift
        state[b] = (Pb, Lb)
        rec = {}
        if abs(r) > 1e-5:
            rec["rot"] = round(r, 4)
        if np.hypot(*d) > 0.05:
            rec["dx"], rec["dy"] = round(float(d[0]), 2), round(float(d[1]), 2)
        if abs(s - 1) > 1e-4:
            rec["sx"] = rec["sy"] = round(s, 4)
        if rec:
            out[b] = rec
        # how far the aim point lands from its mark (after a clamp)
        if aim and aim in marks and aim in rest:
            land = Pb + Lb @ (np.array(rest[aim]) - J[b])
            rep.setdefault(b, {})["miss"] = round(float(np.hypot(*(land - np.array(marks[aim])))), 1)
    return out, rep, {b: (float(v[0][0]), float(v[0][1])) for b, v in state.items()}


def run(name: str) -> None:
    party = P.load(name)
    T = party.targets()
    rest = party.rest_points()
    build = P.read_json(party.work / "build" / "build.json")
    size = (build["image"]["w"], build["image"]["h"])
    keys, report = {}, {}
    for pose in party.poses:
        marks, moved = P.marks_for(party, pose, T, size)
        bones, rep, _joints = solve_pose(party, rest, marks)
        key = {"bones": bones, "source": f"characters/{party.id}/{pose}", "fit": {"iou": 0.9, "stature": 1.0, "feetPx": 0.0}}
        mk = party.party.get("key_motion", {}).get(pose) or {}
        if "ms" in mk:  # milliseconds to move INTO the key; a fast key (the strike, the flinch) moves in a few frames and cuts its parts on the fastest frame (fadeMs 0), a slow one cross-fades
            key["ms"] = mk["ms"]
        if "fadeMs" in mk:
            key["fadeMs"] = mk["fadeMs"]
        keys[pose] = key
        report[pose] = rep
        if moved:
            rep["_snapped"] = moved
        worst = max((v.get("miss", 0) for v in rep.values() if isinstance(v, dict)), default=0)
        clamped = [b for b, v in rep.items() if isinstance(v, dict) and "wantScale" in v and abs(v["wantScale"] - v["scale"]) > 1e-3]
        cl = ", ".join(f"{b} {rep[b]['wantScale']}->{rep[b]['scale']}" for b in clamped)
        print(f"retarget: {pose:9s} {len(bones):2d} bones, worst aim miss {worst:5.1f} master px" + (f", joints moved {moved}" if moved else "") + (f", scale clamped: {cl}" if clamped else ""))
    (party.work / "fit").mkdir(parents=True, exist_ok=True)
    (party.work / "fit" / "keys.json").write_text(json.dumps(keys, separators=(",", ":")), encoding="utf8")
    (party.work / "fit" / "retarget.json").write_text(json.dumps(report, indent=1), encoding="utf8")


if __name__ == "__main__":
    run(sys.argv[1])
