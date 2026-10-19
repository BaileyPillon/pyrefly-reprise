"""Marks first (the lane kit; the rig program, 2026-10-18; both games). A search over a pose's bone angles, offsets and scales that scores ONLY the painting's landmark marks (plus the planted-feet row and a prior
toward small angles), with no silhouette at all, so one evaluation is a kinematic solve (milliseconds) and hundreds of restarts take a minute.

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/lane_marks.py --subject <config name> --pose <pose> [--restarts 400] [--evals 5000] [--seed 7]

Why it exists. The block-wise CMA-ES of `rig_fit.py` scores the silhouette overlap first and the marks second, from the rest pose. On a pose far from the rest (a kneel, a lunge, a sword turned end for end) it settles
in a basin where the silhouette is half right and a landmark is 0.10 to 0.16 of the figure's height off, and no amount of `mark_w` pulls it out. Rikku Dark Knight's lane (`docs/handoff/rig-rikku-dark-knight.md`) lost
about 50 fit runs to that; with this search first (400 restarts, about 1 minute a pose) every mark of ten poses was inside 0.056 and most inside 0.03, and the ordinary fit started from that point (`fit.keys.<pose>.init`)
kept the marks and added the overlap (0.38 to 0.64 for a figure that wears a different costume in every painting).

It writes `<work>/lane/s1/<pose>-init.json`: an `init` dict in exactly the shape `fit.keys.<pose>.init` takes (degrees for a bone, master px for `bone.dx`/`bone.dy`, a number for `bone.s`, `root.dx`). Paste it under the pose, or
patch it in with a short script. The marks are the config's `landmarks.<pose>`; the limits, offsets and scales are the config's `fit` (so a pose the marks cannot reach shows up here in a minute, not after a six-minute fit:
widen that pose's `limits`/`offset_limit`/`scales` and run it again).
"""
from __future__ import annotations

import argparse
import json
import math
import pathlib
import sys
import time

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, HERE.parent.as_posix())  # `python -I` leaves the script's folder off sys.path

import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import rig_fit  # noqa: E402
import rig_v2  # noqa: E402
from rig_cma import cma_es  # noqa: E402
from rig_common import Subject, read_json  # noqa: E402
from rig_skin import RigModel  # noqa: E402

MARK_AIM = 0.02  # idle heights a mark may miss by before the squared hinge starts (the gate's bar is 0.06)
ANGLE_PRIOR = 0.6  # weight of the mean square of the bone angles over 60 degrees


def mark_loss(errors: list[float], free: float = MARK_AIM) -> float:
    """The marks' share of the loss: a light square of every error and a heavy hinge past `free`."""
    return 20.0 * sum(e * e for e in errors) + 3000.0 * sum(max(0.0, e - free) ** 2 for e in errors)


def init_dict(names: list[str], free: list[int], off_names: list[str], scl_names: list[str], x: np.ndarray, nr: int) -> dict:
    """A parameter vector as a `fit.keys.<pose>.init` dict: degrees, master px, scales, `root.dx`."""
    init: dict[str, float] = {}
    for gi, bi in enumerate(free):
        init[names[bi]] = round(float(x[gi] * 180 / math.pi), 1)
    for k, n in enumerate(off_names):
        init[f"{n}.dx"] = round(float(x[nr + 2 * k]), 1)
        init[f"{n}.dy"] = round(float(x[nr + 2 * k + 1]), 1)
    o = nr + 2 * len(off_names)
    for k, n in enumerate(scl_names):
        init[f"{n}.s"] = round(float(x[o + k]), 3)
    init["root.dx"] = round(float(x[-3]), 1)
    return init


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="lane_marks.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--subject", required=True, help="the config's name (tools/rig/subjects/<name>.json)")
    ap.add_argument("--pose", required=True)
    ap.add_argument("--restarts", type=int, default=400)
    ap.add_argument("--evals", type=int, default=5000)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args(argv)
    sub = Subject(a.subject)
    fit_cfg = sub.cfg["fit"]
    build = read_json(sub.work / "build" / "build.json")
    tdir = sub.work / "targets"
    if not (tdir / "targets.json").exists():
        raise SystemExit(f"lane_marks: {tdir / 'targets.json'} is missing: run `rig.py fit-keys --subject {a.subject} --poses idle` once to make the targets")
    T = read_json(tdir / "targets.json")
    if a.pose not in T["poses"]:
        raise SystemExit(f"lane_marks: {a.pose} is not a registered pose of {sub.id}: {', '.join(T['poses'])}")
    model = RigModel(build, sub.work / "build", grid_affine=T["gridFromMaster"], grid=T["grid"])
    model.pose()
    timg = np.array(Image.open(tdir / T["poses"][a.pose]["png"]))
    target = ((timg[..., 0] if timg.ndim == 3 else timg) > 127).astype(np.uint8)
    full = np.zeros((model.GH, model.GW), bool)
    full[model.win[1]:model.win[3], model.win[0]:model.win[2]] = model.grid_mask().astype(bool)
    full |= target.astype(bool)
    ys, xs = np.nonzero(full)
    window = (max(0, xs.min() - 60), max(0, ys.min() - 60), min(model.GW, xs.max() + 61), min(model.GH, ys.max() + 61))
    model.set_grid(T["gridFromMaster"], T["grid"], window)
    chains = list((sub.cfg["build"].get("chains") or {}).keys())
    fitter = rig_fit.Fitter(model, T, fit_cfg, build, chains)
    pcfg = (fit_cfg.get("keys") or {}).get(a.pose, {})
    model.set_state(rig_v2.state_of(build["parts"], rig_v2.key_parts(pcfg)))
    marks = fitter.grid_marks(T["poses"][a.pose], (sub.cfg.get("landmarks") or {}).get(a.pose))
    if not marks:
        raise SystemExit(f"lane_marks: the config has no landmarks for {a.pose}")
    lo, hi = fitter.bounds(pcfg)
    n = len(lo)
    planted = pcfg.get("planted", True)

    def pose_x(x):
        rot, root, off = fitter.unpack(x)
        model.pose(rot=rot, root=root, off=off, scl=fitter.unpack_scl(x))

    def loss(u):
        x = lo + np.clip(u, 0, 1) * (hi - lo)
        pose_x(x)
        errs = fitter.mark_errors(marks)
        L = mark_loss(list(errs.values()))
        if planted and fitter.foot_lm and fitter.rest_foot_Y is not None:
            Y = max(model.to_grid(*model.landmark(nm))[1] for nm in fitter.foot_lm)
            L += ((Y - fitter.rest_foot_Y) / fitter.GS / fitter.figH / 0.01) ** 2
        L += ANGLE_PRIOR * float(np.sum((x[:fitter.nr] / (60 * math.pi / 180)) ** 2)) / max(1, fitter.nr)
        return L

    rng = np.random.default_rng(a.seed)
    t0 = time.time()
    best = (1e18, None)
    for r in range(a.restarts):
        start = np.clip(0.5 + (rng.random(n) - 0.5) * (0.6 if r else 0.0), 0, 1)
        xb, fb, _ = cma_es(loss, start, 0.3, np.zeros(n), np.ones(n), a.evals, rng)
        if fb < best[0]:
            best = (fb, xb)
    x = lo + np.clip(best[1], 0, 1) * (hi - lo)
    pose_x(x)
    errs = fitter.mark_errors(marks)
    print(f"lane_marks: {a.pose}: {a.restarts} restarts in {time.time() - t0:.0f} s; marks {json.dumps({k: round(float(v), 3) for k, v in errs.items()})}")
    init = init_dict(model.names, fitter.free, [model.names[b] for b in fitter.off_idx], fitter.scl_names, x, fitter.nr)
    out = sub.work / "lane" / "s1"
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{a.pose}-init.json").write_text(json.dumps(init), encoding="utf8")
    print(f"lane_marks: init -> {out / (a.pose + '-init.json')}  (fit.keys.{a.pose}.init)")
    worst = max(errs.values())
    if worst > 0.06:
        print(f"lane_marks: the worst mark is {worst:.3f}, over the gate's bar of 0.06: this pose's limits, offsets or scales cannot reach its marks (or a mark is wrong); widen them and run again")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
