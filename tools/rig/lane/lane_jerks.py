"""Whose is a jerk? (the lane kit; the rig program, 2026-10-18; both games, shared plumbing; written in Auron's pass 2.)

The recorder's tracker (`track.mjs`) reads the skeleton's head, feet and pelvis through the live camera and flags a one-frame step in SCREEN pixels (the critic's CHK-027 detector). A step on the screen can
be the camera's, the engine's own placement of the actor, or the rig. Auron's pass 1 left 11 head jerks undiagnosed because the track could not say which; the records carry what does: the camera's view
matrix (`V`) and the actor's root, so a jerk can be classed at the frame it fires:

    camera      the view matrix stepped (the sum of |dV| in one frame over `CAM_V`) and the head's WORLD step is small: every figure on the screen moved, the rig did not
    placement   the actor's root jumped (the engine put the actor somewhere: the start of the battle, a switch in): not a pose
    motion      the head's world step is large but the root did not move and the steps before and after are a smooth run (a lunge easing out): a real movement of the actor, not a discontinuity
    rig         none of the above: the head's WORLD position stepped with the camera and the root steady, which is a pose or a blend (a part drawing in, a key swapping) and is the rig's own

    lane.py jerks --tracks <dir>/tracks.json --jerks <dir>/jerks.json [--out report.json]
"""
from __future__ import annotations

import json
import math
import pathlib

CAM_V = 0.5  # |dV| summed over the matrix in one frame: the camera moved
WORLD_STEP = 0.08  # world units a frame: a head that moves this much between two frames
ROOT_STEP = 0.05


def _step(a, b, keys=(0, 1)) -> float:
    return math.hypot(*[b[k] - a[k] for k in keys])


def classify(prev: dict, cur: dict, before: dict | None, after: dict | None) -> dict:
    """One jerk's class from the frame before it and the frame it fires on (a `tracks.json` record each), with the frames either side for the smoothness test."""
    world = _step(prev["head"], cur["head"])
    root = _step(prev["root"], cur["root"], (0, 1, 2)) if prev.get("root") and cur.get("root") else 0.0
    cam = sum(abs(x - y) for x, y in zip(prev["V"], cur["V"])) if prev.get("V") and cur.get("V") else 0.0
    if root > ROOT_STEP:
        kind = "placement"
    elif world > WORLD_STEP:
        sm = [s for s in (_step(before["head"], prev["head"]) if before else None, _step(cur["head"], after["head"]) if after else None) if s is not None]
        kind = "motion" if sm and min(sm) > 0.5 * world and max(sm) < 2.0 * max(world, 1e-6) + 0.1 else "rig"
    elif cam > CAM_V:
        kind = "camera"
    else:
        kind = "rig"
    return {"n": cur["n"], "pose": cur["pose"], "class": kind, "worldHeadStep": round(world, 4), "rootStep": round(root, 4), "cameraStep": round(cam, 3)}


def run(tracks: str, jerks: str, out: str | None = None) -> int:
    recs = json.loads(pathlib.Path(tracks).read_text())["records"]
    by = {r["n"]: i for i, r in enumerate(recs)}
    js = json.loads(pathlib.Path(jerks).read_text())["jerks"]
    rows = []
    for jk in js:
        i = by.get(jk["n"])
        if i is None or i < 2 or i + 1 >= len(recs):
            continue
        row = classify(recs[i - 1], recs[i], recs[i - 2], recs[i + 1])
        row.update({"part": jk["part"], "px": jk["px"]})
        rows.append(row)
    kinds: dict[str, int] = {}
    for r in rows:
        kinds[r["class"]] = kinds.get(r["class"], 0) + 1
    print(f"lane jerks: {len(rows)} jerk(s): " + ", ".join(f"{k} {v}" for k, v in sorted(kinds.items())))
    for r in rows:
        print(f"  n {r['n']:6d} {r['pose']:9s} {r['part']:5s} {r['px']:6.1f} px  {r['class']:9s} world head step {r['worldHeadStep']:.3f}  root {r['rootStep']:.3f}  camera |dV| {r['cameraStep']:.2f}")
    if out:
        pathlib.Path(out).write_text(json.dumps({"summary": kinds, "jerks": rows}, indent=1), encoding="utf8")
    return 0
