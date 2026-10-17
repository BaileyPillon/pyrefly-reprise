"""Step 3, fit-keys: for each pose the game draws this subject in, find the bone transforms that make the posed rig match the APPROVED painting of that pose.

    python rig.py fit-keys --subject kimahri [--poses attack,hurt] [--retarget] [--seed 1]

The target is the approved painting's silhouette on the pose model's grid, registered at the idle's scale and feet (tools/rig/rig-targets.mjs asks the model, so the fitter and the gate
use one registration). The posed rig is drawn on the same grid by rig_skin.py (not the gate's rasteriser). The objective is the silhouette overlap (IoU), with soft penalties for what the
gate refuses: feet off the idle's soles, a stature outside the pose class's band (a props-out pose is read head to soles), and large angles. The search is multi-start coordinate descent
(bones in skeleton order, shrinking spans) with an optional differential-evolution pass when no start gets close.

config["fit"]:
  "min_iou": 0.88                 a key is kept when the fitter's overlap is at least this (the gate demands 0.85 of its own reading; the margin is for the two rasterisers)
  "limits": { bone: [lo, hi] }    degrees; default +-110 (chain bones: +-50)
  "fixed": [bone, ...]            bones held at rest in every key
  "chain_bones": [prefix, ...]    bones of lag chains (default: the prefixes in build.chains); held to +-50 and a strong prior
  "root_rot": [lo, hi]            allow the whole figure to rotate (a KO lying down), degrees; planted keys never
  "skip": [pose, ...]  "only": [pose, ...]
  "keys": { pose: { "init": { bone: degrees }, "planted": false, "free": [bone, ...], "limits": {...}, "root_rot": [lo, hi] } }   hand-given starting points and exceptions
  "starts": 8                     random restarts per key;  "global": true  run differential evolution when the best overlap is under 0.80
Writes <work>/fit/keys.json (the keys in the rig file's shape, degrees) and fit_report.json (every pose, kept or not, with the numbers).
"""
from __future__ import annotations

import math
import time

import numpy as np
from PIL import Image

from rig_common import REPO, Subject, read_json, run_node, say, write_json
from rig_skin import RigModel, iou

FOOT_NAMES = ("feet", "foot", "toe", "heel", "sole")
RAD = math.pi / 180.0


def ensure_targets(sub: Subject, build: dict, poses=None, retarget=False):
    tdir = sub.sub("targets")
    if retarget or not (tdir / "targets.json").exists():
        args = ["tools/rig/rig-targets.mjs", "--subject", sub.id, "--out", str(tdir), "--art", str(sub.art), "--costume", sub.costume_pose, "--scale", str(sub.scale),
                "--baseline", str(build["baselineY"] / sub.scale), "--root", str(REPO)]
        if poses:
            args += ["--poses", ",".join(poses)]
        if sub.cfg.get("table"):
            args += ["--table", str(sub.rel(sub.cfg["table"]))]
        run_node(args)
    return tdir, read_json(tdir / "targets.json")


class Fitter:
    def __init__(self, model: RigModel, T: dict, fit_cfg: dict, build: dict, chains):
        self.m = model
        self.T = T
        self.cfg = fit_cfg
        g = T["grid"]
        self.GS = g["GS"]
        self.GV1 = g["GV1"]
        ref = T["ref"]
        self.figH = ref["figH"]
        self.bodyH = ref.get("bodyH")
        self.aff = T["gridFromMaster"]
        # bones that matter: used by a vertex, or an ancestor of one
        used = set(np.unique(model.B[model.B >= 0]).tolist())
        infl = set()
        for b in used:
            while b >= 0 and b not in infl:
                infl.add(b)
                b = int(model.parent[b])
        self.chain_idx = {i for i, n in enumerate(model.names) if any(n.startswith(p) and n[len(p):].isdigit() for p in chains)}
        fixed = set(fit_cfg.get("fixed", []))
        self.free = [i for i in range(model.nb) if i in infl and model.parent[i] >= 0 and model.names[i] not in fixed]
        self.foot_lm = [n for n in model.landmarks if n.lower().startswith(FOOT_NAMES)]
        row = (T["costume"].get("row") or {})
        self.head_box = row.get("head")
        self.W1, self.H1 = T["costume"]["size"]
        self.head_bone = model.idx[model.landmarks["head"]["bone"]] if isinstance(model.landmarks["head"]["bone"], str) else int(model.landmarks["head"]["bone"])
        model.pose()
        self.rest_foot_Y = max((model.to_grid(*model.landmark(n))[1] for n in self.foot_lm), default=None)

    # ---- parameters: [rot of each free bone..., root dx, root dy, root rot]
    def bounds(self, pose_cfg):
        lim = {**self.cfg.get("limits", {}), **pose_cfg.get("limits", {})}
        dl = self.cfg.get("default_limit", 110)
        cl = self.cfg.get("chain_limit", 50)
        lo, hi = [], []
        only = set(pose_cfg.get("free", [])) or None
        for i in self.free:
            n = self.m.names[i]
            a, b = lim.get(n, [-(cl if i in self.chain_idx else dl), cl if i in self.chain_idx else dl])
            if only is not None and n not in only and i not in self.chain_idx:
                a = b = 0.0
            lo.append(a * RAD)
            hi.append(b * RAD)
        W = self.m.build["image"]["w"]
        H = self.m.build["image"]["h"]
        rr = pose_cfg.get("root_rot") or self.cfg.get("root_rot") or [0, 0]
        lo += [-0.25 * W, -0.25 * H, rr[0] * RAD]
        hi += [0.25 * W, 0.25 * H, rr[1] * RAD]
        return np.array(lo), np.array(hi)

    def unpack(self, x):
        rot = np.zeros(self.m.nb)
        rot[self.free] = x[: len(self.free)]
        return rot, (x[-3], x[-2], x[-1])

    def measures(self, x):
        """mask, stature (silhouette), body stature (head top to soles), lowest foot offset in idle heights."""
        rot, root = self.unpack(x)
        self.m.pose(rot=rot, root=root)
        mask = self.m.grid_mask()
        rows = np.flatnonzero(mask.any(1))
        stat = (self.GV1 - rows[0] / self.GS) / self.figH if len(rows) else 0.0
        body = None
        if self.head_box and self.bodyH:
            h = self.head_box
            k = self.m.k[self.head_bone]
            x0 = (h[0] + h[2]) / 2 * self.W1 * self.m.scale
            y0 = h[1] * self.H1 * self.m.scale
            Y = self.aff["ay"] * (k[1] * x0 + k[3] * y0 + k[5]) + self.aff["by"]
            body = (self.GV1 - Y / self.GS) / self.bodyH
        dfoot = None
        if self.foot_lm and self.rest_foot_Y is not None:
            Y = max(self.m.to_grid(*self.m.landmark(n))[1] for n in self.foot_lm)
            dfoot = (Y - self.rest_foot_Y) / self.GS / self.figH
        return mask, stat, body, dfoot

    def make_loss(self, target, band, props_out, planted, prior):
        lo_b, hi_b = (band or (None, None))

        def loss(x):
            mask, stat, body, dfoot = self.measures(x)
            L = 1.0 - iou(mask, target)
            if band:
                s = body if (props_out and body is not None) else stat
                v = max(0.0, lo_b + 0.005 - s, s - (hi_b - 0.005)) / 0.05
                L += 0.2 * v * v
            if planted and dfoot is not None:
                v = max(0.0, abs(dfoot) - 0.008) / 0.02
                L += 0.15 * v * v
            L += 0.002 * float(np.sum((x[: len(self.free)] / prior) ** 2)) / max(1, len(self.free))
            return L

        return loss

    def descend(self, loss, x0, lo, hi, sweeps=(1.0, 0.25, 0.08, 0.03, 0.01), n=15):
        x = np.clip(x0.copy(), lo, hi)
        best = loss(x)
        for span in sweeps:
            for j in range(len(x)):
                if hi[j] <= lo[j]:
                    continue
                half = span * (hi[j] - lo[j]) / 2
                cand = np.linspace(max(lo[j], x[j] - half), min(hi[j], x[j] + half), n)
                for c in cand:
                    if c == x[j]:
                        continue
                    old = x[j]
                    x[j] = c
                    L = loss(x)
                    if L < best:
                        best = L
                    else:
                        x[j] = old
        return x, best

    def fit_pose(self, pose, tinfo, target, pose_cfg, rng, n_starts):
        lo, hi = self.bounds(pose_cfg)
        planted = pose_cfg.get("planted", True)
        band = tinfo.get("band")
        loss = self.make_loss(target, band, tinfo.get("propsOut", False), planted, np.full(len(self.free), 80 * RAD))
        starts = [np.zeros(len(lo))]
        init = pose_cfg.get("init")
        if init:
            x = np.zeros(len(lo))
            for n_, d in init.items():
                if self.m.idx[n_] in self.free:
                    x[self.free.index(self.m.idx[n_])] = d * RAD
            starts.insert(0, x)
        for _ in range(n_starts):
            starts.append(np.clip(rng.normal(0, 25 * RAD, len(lo)) * (hi > lo), lo, hi))
        best_x, best_L = None, 9.0
        for s in starts:
            x, L = self.descend(loss, s, lo, hi)
            if L < best_L:
                best_x, best_L = x, L
        mask, *_ = self.measures(best_x)
        if self.cfg.get("global", True) and iou(mask, target) < 0.80:
            from scipy.optimize import differential_evolution

            res = differential_evolution(loss, list(zip(lo, hi)), seed=int(rng.integers(1 << 30)), popsize=10, maxiter=60, tol=1e-4, polish=False, init="sobol", x0=best_x, updating="immediate")
            x, L = self.descend(loss, res.x, lo, hi, sweeps=(0.1, 0.03, 0.01))
            if L < best_L:
                best_x, best_L = x, L
        return best_x, best_L


def run(sub: Subject, poses=None, retarget=False, seed=1) -> None:
    fit_cfg = sub.cfg.get("fit", {})
    build = read_json(sub.work / "build" / "build.json")
    chains = list((sub.cfg["build"].get("chains") or {}).keys()) + list(fit_cfg.get("chain_bones", []))
    tdir, T = ensure_targets(sub, build, retarget=retarget)
    model = RigModel(build, sub.work / "build", grid_affine=T["gridFromMaster"], grid=T["grid"])
    fitter = Fitter(model, T, fit_cfg, build, chains)
    rng = np.random.default_rng(seed)
    names = [p for p in T["poses"] if (not poses or p in poses) and (not fit_cfg.get("only") or p in fit_cfg["only"]) and p not in fit_cfg.get("skip", [])]
    if not any(T["poses"][p]["class"] in ("standing", "low", "ko", "idle") for p in names):
        raise SystemExit("rig fit-keys: no registered pose to fit")
    keys, report = {}, {}
    min_iou = fit_cfg.get("min_iou", 0.88)
    for pose in names:
        info = T["poses"][pose]
        if info["class"] in ("part", "staged", "wide"):
            report[pose] = {"kept": False, "why": f"class {info['class']}: a rig does not serve it"}
            continue
        timg = np.array(Image.open(tdir / info["png"]))
        target = ((timg[..., 0] if timg.ndim == 3 else timg) > 127).astype(np.uint8)
        pcfg = (fit_cfg.get("keys") or {}).get(pose, {})
        t0 = time.time()
        if pose == T["costume"]["pose"] or info["class"] == "idle":
            x = np.zeros(len(fitter.free) + 3)
            L = 0.0
        else:
            x, L = fitter.fit_pose(pose, info, target, pcfg, rng, fit_cfg.get("starts", 8))
        mask, stat, body, dfoot = fitter.measures(x)
        i = float(iou(mask, target))
        rot, root = fitter.unpack(x)
        kept = i >= min_iou or pose == T["costume"]["pose"]
        planted = pcfg.get("planted", True)
        report[pose] = {"kept": kept, "iou": round(i, 4), "stature": round(float(stat), 4), "bodyStature": None if body is None else round(float(body), 4), "dfoot": None if dfoot is None else round(float(dfoot), 4),
                        "loss": round(float(L), 4), "class": info["class"], "propsOut": info.get("propsOut", False), "seconds": round(time.time() - t0, 1)}
        say(f"  {pose:10s} {info['class']:8s} iou {i:.3f} stature {stat:.3f} body {body if body is None else round(body, 3)} dfoot {dfoot if dfoot is None else round(dfoot, 4)} {'kept' if kept else 'NOT KEPT (under ' + str(min_iou) + ')'}  {time.time() - t0:.0f} s")
        if not kept:
            continue
        bones = {}
        for gi, bi in enumerate(fitter.free):
            d = float(x[gi]) / RAD
            if abs(d) >= 0.05:
                bones[model.names[bi]] = {"rot": round(d, 2)}
        key = {"bones": bones, "source": f"art/characters/{sub.id}/{pose}.png", "fit": {"iou": round(i, 4), "stature": round(float(body if (info.get('propsOut') and body is not None) else stat), 4), "feetPx": round(abs(float(dfoot)) * fitter.figH * fitter.GS / fitter.aff["ay"], 2) if dfoot is not None else 0.0}}
        rr = {"dx": round(float(root[0]), 2), "dy": round(float(root[1]), 2), "rot": round(float(root[2]) / RAD, 2)}
        rr = {k: v for k, v in rr.items() if abs(v) >= 0.05}
        if rr:
            key["root"] = rr
        if not planted:
            key["planted"] = False
        keys[pose] = key
    out = sub.sub("fit")
    write_json(out / "keys.json", keys, indent=1)
    write_json(out / "fit_report.json", report, indent=1)
    say(f"rig fit-keys: {len(keys)} key(s) kept of {len(report)} -> {out / 'keys.json'}")
