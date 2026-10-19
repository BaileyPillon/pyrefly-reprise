"""The twin command (the lane kit; the rig program, 2026-10-18; both games). A silhouette TWIN is a subject whose paintings have the same silhouettes as an already-rigged subject's (the census:
Grothia/Ifrit, Pterya/Valefor, Spathi/Bahamut, X2 Shiva/Shiva, X2 Ixion/Ixion, X2 Anima/Anima, Seymour Macalania/Seymour Guest, and the hidden-chapter `exp-leblanc-*` copies of dresspheres: IoU 0.98
to 1.00 over idle, attack and KO). The cut config and the keys of the rigged subject carry over: the twin is the SAME cut re-run on its own idle (a new costume sha) with the keys copied, and the gate
re-measures all of it.

    lane.py twin <twin config name> --of <rigged config name> [--subject <twin art id>] [--art DIR] [--run]

Without `--run` it writes the config and prints what it would do. With `--run`: `cut`, `build`, the base keys into the twin's work folder (their `fit` claims dropped: a claim is the pipeline's, the gate
reads its own), `export` (which gates). A twin that the gate refuses is not a twin of that rig (its idle overlaps the rigged subject's rest pose by less than 0.95, or a key lands off its painting):
read the gate's words, then cut it as a subject of its own. A config that cut with SAM prompts needs masks of the twin's idle (`rig.py cut --sam`, the GPU): the twin command says so.

REGISTRATION (rig-aeons lane, 2026-10-19). A twin's silhouette is the base's, but its CANVAS need not be: Pterya's paintings are Valefor's with 60 px more margin on every side (idle 1785 x 950 against
1665 x 830; silhouettes equal to 0.9994 at alpha 128). Every number of the config is a pixel of the base's painting, so a twin cut with the config as it stands lands every polygon 60 px off (the first
cut of Pterya: 405,272 pixels of the rest composite differing from the painting, against 9,732 for Valefor). The twin command therefore REGISTERS each pose's twin painting onto the base's (an integer
translation by cross-correlation of the alpha-128 masks; refused below IoU 0.97) and writes the config with every coordinate moved by it: the cut polygons and predicates, the bones, the skin joints, the
build landmarks and each pose's landmark marks. Offsets and angles are relative and stay. `--no-register` keeps the old copy-as-is behaviour (canvases that are already the same).
"""
from __future__ import annotations

import copy
import json
import pathlib

import numpy as np

from lane_common import REPO, popen_low, rig_cmd, say, write_json


def twin_config(base: dict, twin_id: str, base_name: str, art: str | None = None) -> dict:
    """The twin's config: the base's, with its own subject id (and art folder when it has one of its own). The hooks, the cut, the build, the marks and the limits are the base's."""
    cfg = copy.deepcopy(base)
    cfg["_twin_of"] = base_name
    cfg["subject"] = twin_id
    if art:
        cfg["art"] = art
    if isinstance(cfg.get("hooks"), str) and cfg["hooks"].startswith(f"{base.get('subject')}_"):
        pass  # the base's hook module serves the twin: it reads the twin's own painting through `state.sub`, and names no subject
    return cfg


def twin_keys(keys: dict, base_id: str | None = None, twin_id: str | None = None) -> dict:
    """The base's keys for the twin: every bone transform as it is; the recorded `fit` claims dropped (they are the base's readings, not the twin's), and a painted key's `source` label
    (`characters/<base>/<pose>`) renamed to the twin's own painting (`characters/<twin>/<pose>`: the gate reads the twin's painting of the pose either way, the label should say so)."""
    out = copy.deepcopy(keys)
    for k in out.values():
        k.pop("fit", None)
        if base_id and twin_id and isinstance(k.get("source"), str):
            k["source"] = k["source"].replace(f"characters/{base_id}/", f"characters/{twin_id}/")
    return out


# --------------------------------------------------------------------------------------------------------------------------------------------------------------- registration (pure)

ALPHA_BAR = 128  # the silhouette threshold the registration reads (the halo of a soft-glow painting sits below it)
MIN_REGISTER_IOU = 0.97


def register_shift(a: np.ndarray, b: np.ndarray, min_iou: float = MIN_REGISTER_IOU) -> tuple[int, int, float] | None:
    """The integer translation `(dx, dy)` that carries mask `a` (the base's painting, True where the figure is) onto mask `b` (the twin's), by cross-correlation, and the IoU it gives; None when the best
    translation overlaps by less than `min_iou` (the paintings are not the same silhouette: cut it as a subject of its own). Scale is not searched: a twin is the same figure at the same size."""
    a, b = np.asarray(a, bool), np.asarray(b, bool)
    if not a.any() or not b.any():
        return None
    H, W = a.shape[0] + b.shape[0], a.shape[1] + b.shape[1]
    fa, fb = np.fft.rfft2(a.astype(np.float32), (H, W)), np.fft.rfft2(b.astype(np.float32), (H, W))
    corr = np.fft.irfft2(np.conj(fa) * fb, (H, W))  # corr[d] = sum_x a(x) b(x + d)
    iy, ix = np.unravel_index(int(np.argmax(corr)), corr.shape)
    dy, dx = (iy - H if iy > H // 2 else iy), (ix - W if ix > W // 2 else ix)
    ys, xs = np.nonzero(a)
    ys, xs = ys + dy, xs + dx
    keep = (ys >= 0) & (ys < b.shape[0]) & (xs >= 0) & (xs < b.shape[1])
    inter = int(b[ys[keep], xs[keep]].sum())
    iou = inter / float(a.sum() + b.sum() - inter)
    return (int(dx), int(dy), round(float(iou), 4)) if iou >= min_iou else None


def _pt(p, dx, dy):
    return [p[0] + dx, p[1] + dy]


def shift_pred(p, dx, dy):
    """A cut predicate (`rig_pred.py`) with every coordinate moved by `(dx, dy)`: half-planes, segments, and the predicates inside `all`, `any`, `not`, `grown`, `shrunk`. Colour, polygon names and the rest stay."""
    if isinstance(p, list):
        return [shift_pred(q, dx, dy) for q in p]
    if not isinstance(p, dict):
        return p
    out = {}
    for k, v in p.items():
        if k in ("x_ge", "x_lt"):
            out[k] = v + dx
        elif k in ("y_ge", "y_lt"):
            out[k] = v + dy
        elif k == "seg":
            out[k] = {**v, "p0": _pt(v["p0"], dx, dy), "p1": _pt(v["p1"], dx, dy)}
        elif k in ("all", "any"):
            out[k] = [shift_pred(q, dx, dy) for q in v]
        elif k == "not":
            out[k] = shift_pred(v, dx, dy)
        elif k in ("grown", "shrunk"):
            out[k] = {**v, "of": shift_pred(v["of"], dx, dy)}
        else:
            out[k] = copy.deepcopy(v)
    return out


def shift_config(cfg: dict, shifts: dict[str, tuple[int, int]], idle: str = "idle") -> tuple[dict, list[str]]:
    """The config with its coordinates moved: everything in the COSTUME painting's frame by `shifts[idle]` (cut polygons and predicates, bones, skin joints, build landmarks), each pose's landmark marks by
    that pose's own shift (a pose with none uses the idle's). Returns the new config and the list of sections it did NOT know how to move (a lane moves those by hand, or the cut lands off)."""
    out = copy.deepcopy(cfg)
    dx, dy = shifts[idle]
    skipped: list[str] = []
    cut = out.get("cut") or {}
    for k in cut:
        if k in ("polys", "parts", "ops", "order", "priority", "nearest", "clean"):
            continue
        skipped.append(f"cut.{k}")
    for n, pts in (cut.get("polys") or {}).items():
        cut["polys"][n] = [_pt(q, dx, dy) for q in pts]
    for spec in (cut.get("parts") or {}).values():
        for k in ("include", "exclude"):
            if k in spec:
                spec[k] = shift_pred(spec[k], dx, dy)
    for op in cut.get("ops") or []:
        for k in ("zone", "src"):
            if k in op:
                op[k] = shift_pred(op[k], dx, dy)
        for k in op:
            if k not in ("op", "back", "front", "part", "from", "px", "zone", "src", "sigmas", "sigma", "hidden_only", "gradient", "soft", "ink"):
                skipped.append(f"cut.ops.{op.get('op')}.{k}")
    build = out.get("build") or {}
    for k in build:
        if k not in ("bones", "skin", "landmarks"):
            skipped.append(f"build.{k}")
    for b in build.get("bones") or []:
        b[2] = _pt(b[2], dx, dy)
    for sk in (build.get("skin") or {}).values():
        if "joints" in sk:
            sk["joints"] = [_pt(j, dx, dy) for j in sk["joints"]]
        for k in sk:
            if k not in ("type", "bone", "bones", "joints", "ramps", "mesh"):
                skipped.append(f"build.skin.{k}")
    for name, v in (build.get("landmarks") or {}).items():
        build["landmarks"][name] = [v[0], _pt(v[1], dx, dy)]
    for pose, marks in (out.get("landmarks") or {}).items():
        px, py = shifts.get(pose, shifts[idle])
        for name, v in list(marks.items()):
            marks[name] = _pt(v, px, py) if isinstance(v, list) and len(v) == 2 and all(isinstance(n, (int, float)) for n in v) else v
    if out.get("sam"):
        skipped.append("sam")
    return out, skipped


def needs_sam(cfg: dict) -> bool:
    return bool((cfg.get("sam") or {}).get("parts")) and any("sam" in json.dumps(p) for p in (cfg.get("cut") or {}).get("parts", {}).values())


def registrations(base_dir: pathlib.Path, twin_dir: pathlib.Path, poses: list[str]) -> dict[str, tuple[int, int, float]]:
    """`{pose: (dx, dy, iou)}`: where each of the twin's paintings sits relative to the base's (`register_shift`). A pose that is missing on either side, or that does not register, is left out (it
    takes the idle's shift); the idle itself must register or this raises: the paintings are not the same silhouette."""
    from PIL import Image

    def mask(d: pathlib.Path, pose: str):
        f = d / f"{pose}.png"
        return np.array(Image.open(f).convert("RGBA"))[:, :, 3] >= ALPHA_BAR if f.exists() else None

    out: dict[str, tuple[int, int, float]] = {}
    for pose in dict.fromkeys(["idle", *poses]):
        a, b = mask(base_dir, pose), mask(twin_dir, pose)
        if a is None or b is None:
            continue
        r = register_shift(a, b)
        if r is None:
            if pose == "idle":
                raise SystemExit(f"lane twin: the twin's idle ({twin_dir}) does not register onto the base's ({base_dir}) above IoU {MIN_REGISTER_IOU}: not a silhouette twin, cut it as a subject of its own (or --no-register)")
            continue
        out[pose] = r
    return out


def run(name: str, of: str, subject: str | None, art: str | None, do_run: bool, subjects_dir: pathlib.Path | None = None, register: bool = True) -> int:
    from rig_common import SUBJECTS, WORK_ROOT, Subject

    sd = pathlib.Path(subjects_dir) if subjects_dir else SUBJECTS
    base_path = sd / f"{of}.json"
    if not base_path.exists():
        raise SystemExit(f"lane twin: no rigged config {base_path}")
    base = json.loads(base_path.read_text(encoding="utf8"))
    twin_id = subject or name
    cfg = twin_config(base, twin_id, of, art)
    dest = sd / f"{name}.json"
    if dest.exists():
        raise SystemExit(f"lane twin: {dest} exists")
    shifts: dict[str, tuple[int, int, float]] = {}
    skipped: list[str] = []
    if register:
        base_sub = Subject(of, config_path=base_path)
        twin_dir = (Subject.rel(art) if art else base_sub.art) / "characters" / twin_id
        shifts = registrations(base_sub.dir_chars, twin_dir, list((base.get("landmarks") or {}).keys()))
        if any(dx or dy for dx, dy, _ in shifts.values()):
            cfg, skipped = shift_config(cfg, {p: (dx, dy) for p, (dx, dy, _) in shifts.items()})
            cfg["_twin_shift"] = {p: [dx, dy, iou] for p, (dx, dy, iou) in shifts.items()}
    base_keys = WORK_ROOT / of / "fit" / "keys.json"
    plan = [f"write {dest}", f"cut --subject {name}{' --sam   (the base was cut with SAM prompts: the twin needs masks of its own idle)' if needs_sam(base) else ''}", f"build --subject {name}",
            f"copy {base_keys} (claims dropped) -> {WORK_ROOT / name / 'fit' / 'keys.json'}", f"export --subject {name}   (runs the gate)"]
    say(f"lane twin: {name} (art id {twin_id}) of {of}:")
    if shifts:
        say("  registration of the twin's paintings onto the base's (dx, dy px at 1x; IoU of the silhouettes at alpha 128): " + "; ".join(f"{p} ({dx}, {dy}) {iou}" for p, (dx, dy, iou) in shifts.items()))
    if skipped:
        say("  NOT MOVED (move these by hand): " + ", ".join(skipped))
    for p in plan:
        say("  - " + p)
    if not do_run:
        say("  (--run does it)")
        return 0
    if not base_keys.exists():
        raise SystemExit(f"lane twin: the base has no keys at {base_keys}")
    write_json(dest, cfg, indent=2)
    sub = Subject(name)
    for step in ("cut", "build"):
        args = [step, "--subject", name] + (["--sam"] if step == "cut" and needs_sam(base) else [])
        if popen_low(rig_cmd(*args), cwd=REPO).wait() != 0:
            raise SystemExit(f"lane twin: {step} failed")
    write_json(sub.work / "fit" / "keys.json", twin_keys(json.loads(base_keys.read_text()), base.get("subject", of), twin_id), indent=None)
    return popen_low(rig_cmd("export", "--subject", name), cwd=REPO).wait()
