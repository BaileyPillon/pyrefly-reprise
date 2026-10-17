"""Step 3, fit-keys: for each pose the game draws this subject in, find the bone transforms that make the posed rig match the APPROVED painting of that pose.

    python rig.py fit-keys --subject kimahri [--poses attack,hurt] [--retarget] [--seed 1]

The target is the approved painting's silhouette on the pose model's grid, registered at the idle's scale and feet (tools/rig/rig-targets.mjs asks the model, so the fitter and the gate
use one registration). The posed rig is drawn on the same grid by rig_skin.py (not the gate's rasteriser). The objective is the silhouette overlap (IoU), with soft penalties for what the
gate refuses: feet off the idle's soles, a stature outside the pose class's band (a props-out pose is read head to soles), and large angles. The search is block-wise CMA-ES (a derivative-free evolution strategy: the trunk, then each limb in turn, three rounds, the smoothing of the overlap shrinking), then a short coordinate polish; the loss adds a chamfer distance between the two silhouettes to the overlap, so a limb that
does not touch its target yet is still pulled toward it.

config["fit"]:
  "min_iou": 0.88                 a key is kept when the fitter's overlap is at least this (the gate demands 0.85 of its own reading; the margin is for the two rasterisers)
  "limits": { bone: [lo, hi] }    degrees; default +-110 (chain bones: +-50)
  "fixed": [bone, ...]            bones held at rest in every key
  "chain_bones": [prefix, ...]    bones of lag chains (default: the prefixes in build.chains); held to +-50 and a strong prior
  "root_rot": [lo, hi]            allow the whole figure to rotate (a KO lying down), degrees; planted keys never
  "skip": [pose, ...]  "only": [pose, ...]
  "keys": { pose: { "init": { bone: degrees }, "planted": false, "free": [bone, ...], "limits": {...}, "root_rot": [lo, hi] } }   hand-given starting points and exceptions
  "restarts": 1, "evals": 450, "blur": [4, 0]   CMA-ES runs per block and round, evaluations per run (the trunk gets twice), one round per smoothing level (passes of [1 2 1])
Writes <work>/fit/keys.json (the keys in the rig file's shape, degrees) and fit_report.json (every pose, kept or not, with the numbers).
"""
from __future__ import annotations

import math
import time

import numpy as np
from PIL import Image

from rig_common import REPO, Subject, read_json, run_node, say, write_json
from rig_cma import cma_es
from rig_skin import RigModel, blur121, chamfer, chamfer_terms, iou, soft_iou

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
        # bones whose OFFSET (dx, dy) is a parameter: the hips by default (a crouch lowers the pelvis and bends the knees with the feet where they were; the runtime check lets a key move its
        # lowest foot only by the whole-figure offset it declares, so the body must go down through the pelvis, not through `root.dy`)
        names_off = fit_cfg.get("offsets")
        if names_off is None:
            roots = [i for i in range(model.nb) if model.parent[i] < 0]
            kids = [i for i in range(model.nb) if model.parent[i] in roots]
            names_off = [model.names[kids[0]]] if kids else []
        self.off_idx = [model.idx[n] for n in names_off if n in model.idx]
        self.nr = len(self.free)
        self.foot_lm = [n for n in model.landmarks if n.lower().startswith(FOOT_NAMES)]
        row = (T["costume"].get("row") or {})
        self.head_box = row.get("head")
        self.W1, self.H1 = T["costume"]["size"]
        self.head_bone = model.idx[model.landmarks["head"]["bone"]] if isinstance(model.landmarks["head"]["bone"], str) else int(model.landmarks["head"]["bone"])
        model.pose()
        self.rest_foot_Y = max((model.to_grid(*model.landmark(n))[1] for n in self.foot_lm), default=None)

    # ---- parameters: [rot of each free bone..., dx and dy of each offset bone..., root dx, root dy, root rot]
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
        for _ in self.off_idx:
            lo += [-0.12 * W, -0.12 * H]
            hi += [0.12 * W, 0.12 * H]
        rr = pose_cfg.get("root_rot") or self.cfg.get("root_rot") or [0, 0]
        dy = 0.25 * H if not pose_cfg.get("planted", True) else 0.0  # a planted key does not lift the figure: its feet stay where the bind has them
        lo += [-0.25 * W, -dy, rr[0] * RAD]
        hi += [0.25 * W, dy, rr[1] * RAD]
        return np.array(lo), np.array(hi)

    def unpack(self, x):
        rot = np.zeros(self.m.nb)
        rot[self.free] = x[: self.nr]
        off = {self.m.names[b]: (x[self.nr + 2 * k], x[self.nr + 2 * k + 1]) for k, b in enumerate(self.off_idx)}
        return rot, (x[-3], x[-2], x[-1]), off

    def measures(self, x):
        """mask, stature (silhouette), body stature (head top to soles), lowest foot offset in idle heights."""
        rot, root, off = self.unpack(x)
        self.m.pose(rot=rot, root=root, off=off)
        mask = self.m.grid_mask()
        rows = np.flatnonzero(mask.any(1))
        stat = (self.GV1 - (rows[0] + self.m.win[1]) / self.GS) / self.figH if len(rows) else 0.0
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

    def make_loss(self, target, band, props_out, planted, prior, blur=0):
        """The fit's loss for one pose. `blur` > 0 scores the overlap of smoothed coverages (so a sub-cell move changes the loss); 0 is the plain binary overlap the gate measures."""
        lo_b, hi_b = (band or (None, None))
        tgt_b = target.astype(np.float32)
        tmp = np.zeros_like(tgt_b)
        if blur:
            blur121(tgt_b, tmp, blur)
        dtT = np.zeros(target.shape, np.float32)
        chamfer(target, dtT)
        dtR = np.zeros(target.shape, np.float32)
        rows = np.flatnonzero(target.any(1))
        s0 = float(max(60, rows[-1] - rows[0] + 1)) if len(rows) else 200.0  # the target's height in cells: the chamfer terms are shares of it

        def loss(x):
            mask, stat, body, dfoot = self.measures(x)
            a, b = chamfer_terms(mask, target, dtT, dtR)
            if blur:
                cov = self.m.cov.copy()
                blur121(cov, tmp, blur)
                L = 1.0 - soft_iou(cov, tgt_b) + 1.5 * min(3.0, (a + b) / s0)
            else:
                L = 1.0 - iou(mask, target) + 1.5 * min(3.0, (a + b) / s0)
            if band:
                s = body if (props_out and body is not None) else stat
                v = min(3.0, max(0.0, lo_b + 0.005 - s, s - (hi_b - 0.005)) / 0.05)
                L += 0.2 * v * v
            if planted and dfoot is not None:
                # the runtime check allows 0.4 percent of the image height; stay inside 0.3
                tol = 0.003 * self.m.build["image"]["h"]
                v = min(3.0, max(0.0, abs(dfoot) * self.figH * self.GS / self.aff["ay"] - tol) / tol)
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
                if j < len(self.free):  # one bone's angle: only the parts it moves are redrawn
                    self.measures(x)
                    self.m.begin_block([self.free[j]])
                else:
                    self.m.end_block()
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
        self.m.end_block()
        return x, best

    def blocks(self):
        """The parameter blocks of the search: each LIMB (a bone and all its descendants, when that is six bones or fewer: an arm, a leg, the head, a tail, the spear) and the TRUNK (the whole
        figure's offset and every bone not in a limb: pelvis, spine, chest). A silhouette's angles are far too many to search at once, but a limb moves only its own pixels."""
        m = self.m
        free = set(self.free)
        kids = {i: [c for c in range(m.nb) if m.parent[c] == i] for i in range(m.nb)}

        def subtree(i):
            out = [i] if i in free else []
            for c in kids[i]:
                out += subtree(c)
            return out

        limbs, seen = [], set()

        def walk(i):
            sub = subtree(i)
            if i in free and 0 < len(sub) <= 6:
                limbs.append(sub)
                seen.update(sub)
            else:
                for c in kids[i]:
                    walk(c)

        for r in [i for i in range(m.nb) if m.parent[i] < 0]:
            for c in kids[r]:
                walk(c)
        n = len(self.free)
        pos = {bi: k for k, bi in enumerate(self.free)}
        trunk = [pos[bi] for bi in self.free if bi not in seen] + list(range(n, n + 2 * len(self.off_idx) + 3))
        return [np.array(trunk)] + [np.array([pos[bi] for bi in l]) for l in limbs]

    def fit_pose(self, pose, tinfo, target, pose_cfg, rng, restarts):
        """Block-wise CMA-ES in the unit box (each parameter scaled to its limits), three rounds with the smoothing of the overlap shrinking, and a coordinate polish on the binary overlap the gate
        measures. Each block is the trunk or one limb (see `blocks`): a CMA over six or eight angles converges to the sub-cell precision that one over thirty does not."""
        lo, hi = self.bounds(pose_cfg)
        planted = pose_cfg.get("planted", True)
        prior = np.full(len(self.free), 80 * RAD)
        blurs = list(self.cfg.get("blur", [4, 0]))  # one round each: the smoothing of the overlap, in [1 2 1] passes, shrinking to the plain overlap
        losses = [self.make_loss(target, tinfo.get("band"), tinfo.get("propsOut", False), planted, prior, blur=bl) for bl in blurs + [0]]
        half = (hi - lo) / 2
        mid = (hi + lo) / 2
        n = len(lo)
        x = np.zeros(n)
        for n_, d in (pose_cfg.get("init") or {}).items():
            if self.m.idx[n_] in self.free:
                x[self.free.index(self.m.idx[n_])] = d * RAD
        # start the whole figure where the target is: the rest pose's centre of mass slid onto the target's (a pose registered on the idle's feet is often a stride away from the rest)
        rest = self.measures(np.zeros(n))[0]
        ry, rx = np.nonzero(rest)
        ty, tx = np.nonzero(target)
        if len(rx) and len(tx):
            x[-3] = float(np.clip((tx.mean() - rx.mean()) / self.aff["ax"], lo[-3], hi[-3]))
            x[-2] = float(np.clip((ty.mean() - ry.mean()) / self.aff["ay"], lo[-2], hi[-2]))
        x = np.clip(x, lo, hi)
        evals = self.cfg.get("evals", 450)
        blocks = self.blocks()
        for rnd in range(len(blurs)):
            loss = losses[rnd]
            for bi_, idx in enumerate(blocks):
                if not len(idx) or not np.any(half[idx] > 0):
                    continue

                def f(v, idx=idx):
                    xx = x.copy()
                    xx[idx] = mid[idx] + np.asarray(v) * half[idx]
                    return loss(xx)

                # the bones this block moves: the parts they skin are redrawn on each evaluation, the rest once
                moved = [self.free[k] for k in idx if k < len(self.free)]
                if len(idx) > len(moved) or not moved:
                    self.m.end_block()  # the whole-figure offset moves everything
                else:
                    self.measures(x)
                    self.m.begin_block(moved)
                safe = np.where(half[idx] > 0, half[idx], 1.0)
                v0 = np.where(half[idx] > 0, (x[idx] - mid[idx]) / safe, 0.0)
                best_v, best_L = v0, f(v0)
                for r in range(restarts):
                    sigma0 = (0.3 if rnd == 0 else 0.1) + 0.1 * r
                    v, L, _ = cma_es(f, best_v if r else v0, sigma0, -np.ones(len(idx)), np.ones(len(idx)), evals * (2 if bi_ == 0 else 1), rng,
                                     popsize=(2 + 2 * r) * (4 + int(3 * math.log(max(2, len(idx))))))
                    if L < best_L:
                        best_v, best_L = v, L
                x[idx] = mid[idx] + best_v * half[idx]
                self.m.end_block()
        x, L = self.descend(losses[-1], x, lo, hi, sweeps=(0.03, 0.012, 0.005, 0.002), n=11)
        return x, L


def run(sub: Subject, poses=None, retarget=False, seed=1) -> None:
    fit_cfg = sub.cfg.get("fit", {})
    build = read_json(sub.work / "build" / "build.json")
    chains = list((sub.cfg["build"].get("chains") or {}).keys()) + list(fit_cfg.get("chain_bones", []))
    tdir, T = ensure_targets(sub, build, retarget=retarget)
    model = RigModel(build, sub.work / "build", grid_affine=T["gridFromMaster"], grid=T["grid"])
    targets = {}
    for p_, info_ in T["poses"].items():
        timg = np.array(Image.open(tdir / info_["png"]))
        targets[p_] = ((timg[..., 0] if timg.ndim == 3 else timg) > 127).astype(np.uint8)
    # a crop of the grid around every target and the rest pose, with room to move: the fit draws only that
    model.pose()
    union = model.grid_mask().astype(bool)
    full_mask = np.zeros((model.GH, model.GW), bool)
    full_mask[model.win[1]:model.win[3], model.win[0]:model.win[2]] = union
    for t_ in targets.values():
        full_mask |= t_.astype(bool)
    ys, xs = np.nonzero(full_mask)
    mx_, my_ = int(0.15 * (xs.max() - xs.min())) + 12, int(0.1 * (ys.max() - ys.min())) + 12
    window = (max(0, xs.min() - mx_), max(0, ys.min() - my_), min(model.GW, xs.max() + 1 + mx_), min(model.GH, ys.max() + 1 + my_))
    model.set_grid(T["gridFromMaster"], T["grid"], window)
    say(f"  fit window {window} of the {model.GW} x {model.GH} grid")
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
        target = np.ascontiguousarray(targets[pose][model.win[1]:model.win[3], model.win[0]:model.win[2]])
        pcfg = (fit_cfg.get("keys") or {}).get(pose, {})
        t0 = time.time()
        if pose == T["costume"]["pose"] or info["class"] == "idle":
            x = np.zeros(len(fitter.free) + 3)
            L = 0.0
        else:
            x, L = fitter.fit_pose(pose, info, target, pcfg, rng, fit_cfg.get("restarts", 2))
        mask, stat, body, dfoot = fitter.measures(x)
        i = float(iou(mask, target))
        rot, root, off = fitter.unpack(x)
        kept = i >= min_iou or pose == T["costume"]["pose"]
        planted = pcfg.get("planted", True)
        report[pose] = {"kept": kept, "iou": round(i, 4), "stature": round(float(stat), 4), "bodyStature": None if body is None else round(float(body), 4), "dfoot": None if dfoot is None else round(float(dfoot), 4),
                        "loss": round(float(L), 4), "class": info["class"], "propsOut": info.get("propsOut", False), "seconds": round(time.time() - t0, 1)}
        say(f"  {pose:10s} {info['class']:8s} iou {i:.3f} stature {stat:.3f} body {body if body is None else round(body, 3)} dfoot {dfoot if dfoot is None else round(dfoot, 4)} {'kept' if kept else 'NOT KEPT (under ' + str(min_iou) + ')'}  {time.time() - t0:.0f} s")
        if not kept:
            continue
        bones = {}
        for gi, bi in enumerate(fitter.free):
            if abs(float(x[gi])) >= 0.001:
                bones[model.names[bi]] = {"rot": round(float(x[gi]), 4)}  # radians, clockwise on screen, as the rig file says
        for name, (dx, dy) in off.items():
            if abs(dx) >= 0.05 or abs(dy) >= 0.05:
                bones[name] = {**bones.get(name, {}), "dx": round(float(dx), 2), "dy": round(float(dy), 2)}
        key = {"bones": bones, "source": f"characters/{sub.id}/{pose}", "fit": {"iou": round(i, 4), "stature": round(float(body if (info.get('propsOut') and body is not None) else stat), 4), "feetPx": round(abs(float(dfoot)) * fitter.figH * fitter.GS / fitter.aff["ay"], 2) if dfoot is not None else 0.0}}
        rr = {"dx": round(float(root[0]), 2), "dy": round(float(root[1]), 2), "rot": round(float(root[2]), 4)}
        rr = {k: v for k, v in rr.items() if abs(v) >= 0.001}
        if rr:
            key["root"] = rr
        if not planted:
            key["planted"] = False
        keys[pose] = key
    out = sub.sub("fit")
    write_json(out / "keys.json", keys, indent=1)
    write_json(out / "fit_report.json", report, indent=1)
    say(f"rig fit-keys: {len(keys)} key(s) kept of {len(report)} -> {out / 'keys.json'}")
