"""The subject scaffold (the lane kit; the rig program, 2026-10-18; both games): `lane.py new <name> --preset humanoid-side|creature-quadruped|creature-winged` writes the subject config
`tools/rig/subjects/<name>.json` (and a hooks stub) from the subject's paintings, so a lane starts from a file that already READS and runs instead of a blank page.

What is filled in (mechanical): the subject id and scale (2 when `idle@2x.png` exists), a skeleton laid out from the figure's alpha box (the preset's joints are fractions of it), the head and torso
polygons from the pose model's head box (the same box the gate reads), a marks table with EVERY registered pose present and empty, `authored` and `fit.mirror` empty, the fit limits that kept Lulu's
body natural (head 25, spine and chest 20, pelvis 15 degrees), a short idle sway and a registry entry for the recorder.

What is NOT (judgment, and the lane's job): the polygons and capsules of each part beyond the head and torso, the seams, the skin of anything that is not a plain chain or a rigid, the marks by eye
(+-15 px), which poses are authored, the door word and chapter of the recorder entry. The preset is a start; a creature preset has no limbs table until its lane has cut one.
"""
from __future__ import annotations

import json
import pathlib
import re
import subprocess

from lane_common import NODE, REPO, say

PRESETS = ("humanoid-side", "creature-quadruped", "creature-winged")

# joints as (parent, t): t is how far DOWN the figure's alpha box the joint sits (0 the top, 1 the ground), and x is a fraction of the box's width; a figure facing RIGHT
HUMANOID = {"root": (None, 1.00), "pelvis": ("root", 0.52), "spine": ("pelvis", 0.40), "chest": ("spine", 0.30), "head": ("chest", 0.10), "upperarm": ("chest", 0.26), "forearm": ("upperarm", 0.40), "hand": ("forearm", 0.52)}
XFRAC = {"root": 0.5, "pelvis": 0.5, "spine": 0.5, "chest": 0.52, "head": 0.5, "upperarm": 0.6, "forearm": 0.62, "hand": 0.64}
QUADRUPED = {"root": (None, 1.00), "hips": ("root", 0.50), "spine": ("hips", 0.45), "chest": ("spine", 0.40), "neck": ("chest", 0.28), "head": ("neck", 0.12), "tail0": ("hips", 0.55), "tail1": ("tail0", 0.70)}
QXFRAC = {"root": 0.5, "hips": 0.28, "spine": 0.45, "chest": 0.65, "neck": 0.78, "head": 0.9, "tail0": 0.15, "tail1": 0.05}
WINGED = {"root": (None, 1.00), "body": ("root", 0.60), "chest": ("body", 0.45), "neck": ("chest", 0.30), "head": ("neck", 0.15), "wingA": ("chest", 0.35), "wingB": ("wingA", 0.20), "tail0": ("body", 0.62), "tail1": ("tail0", 0.78)}
WXFRAC = {"root": 0.5, "body": 0.5, "chest": 0.58, "neck": 0.7, "head": 0.8, "wingA": 0.5, "wingB": 0.4, "tail0": 0.28, "tail1": 0.1}
LAYOUT = {"humanoid-side": (HUMANOID, XFRAC), "creature-quadruped": (QUADRUPED, QXFRAC), "creature-winged": (WINGED, WXFRAC)}
LIMITS = {"head": [-25, 25], "spine": [-20, 20], "chest": [-20, 20], "pelvis": [-15, 15], "hips": [-15, 15], "neck": [-25, 25], "upperarm": [-175, 100], "forearm": [-150, 10], "hand": [-35, 35],
          "thigh": [-60, 60], "shin": [-5, 80], "foot": [-30, 30], "tail0": [-35, 35], "tail1": [-35, 35], "wingA": [-60, 60], "wingB": [-60, 60], "body": [-15, 15]}


def joints(preset: str, box: tuple[int, int, int, int]) -> dict[str, tuple[float, float]]:
    """The preset's joints in 1x painting px from the figure's alpha box `(x0, y0, x1, y1)`: x a fraction of the box's width, y a fraction of its height from the top (the root on the ground row)."""
    layout, xs = LAYOUT[preset]
    x0, y0, x1, y1 = box
    return {name: (x0 + xs[name] * (x1 - x0), y0 + t * (y1 - y0)) for name, (_parent, t) in layout.items()}


def head_polygon(head_box: list[float], size: tuple[int, int], pad: float = 0.25) -> list[list[int]]:
    """A rectangle round the pose model's head box (fractions `[x0, y0, x1, y1]` of the painting), padded by `pad` of its size: the lane refines it by eye."""
    w, h = size
    x0, y0, x1, y1 = head_box[0] * w, head_box[1] * h, head_box[2] * w, head_box[3] * h
    px, py = (x1 - x0) * pad, (y1 - y0) * pad
    r = lambda v: int(round(v))  # noqa: E731
    return [[r(x0 - px), r(y0 - py)], [r(x1 + px), r(y0 - py)], [r(x1 + px), r(y1 + py)], [r(x0 - px), r(y1 + py)]]


def scaffold(preset: str, subject: str, scale: int, size: tuple[int, int], box: tuple[int, int, int, int], head_box: list[float] | None, poses: list[str]) -> dict:
    """The subject config as a dict."""
    if preset not in PRESETS:
        raise SystemExit(f"lane new: --preset is one of {', '.join(PRESETS)}")
    J = joints(preset, box)
    layout, _ = LAYOUT[preset]
    bones = [[n, parent, [round(J[n][0]), round(J[n][1])]] for n, (parent, _t) in layout.items()]
    names = [b[0] for b in bones]
    hp = head_polygon(head_box, size) if head_box else [[box[0], box[1]], [box[2], box[1]], [box[2], box[1] + (box[3] - box[1]) // 6], [box[0], box[1] + (box[3] - box[1]) // 6]]
    body_top = hp[2][1]
    body = [[box[0], body_top], [box[2], body_top], [box[2], box[3]], [box[0], box[3]]]
    cfg = {
        "_lane": f"scaffolded by `lane.py new` (preset {preset}). Mechanical parts are filled in; the part cut (polys, capsules, seams), the skin, the marks and the authored poses are the lane's judgment. See tools/rig/lane/README.md.",
        "subject": subject, "scale": scale, "costume": {"pose": "idle"},
        "hooks": f"{subject}_hooks.py",
        "cut": {
            "polys": {"head": hp, "body": body},
            "order": ["body", "head"],
            "parts": {"head": {"include": [{"poly": "head"}]}, "body": {"include": [{"poly": "body"}]}},
            "nearest": {"maxdist": 40},
            "clean": {"min_island": 150, "close": 2},
            "ops": [{"op": "skirt", "back": "body", "front": "head", "px": 24}],
        },
        "build": {
            "bones": bones,
            "skin": {
                "body": {"type": "rigid", "bone": names[1] if len(names) > 1 else "root", "mesh": {"edge": 22, "inner": 44, "grow": 10}},
                "head": {"type": "rigid", "bone": "head", "mesh": {"edge": 18, "inner": 34, "grow": 10}},
            },
            "landmarks": {"head": ["head", [round(J["head"][0]), round(J["head"][1])]], "feet": ["root", [round(J["root"][0]), round(J["root"][1])]]},
        },
        "fit": {"min_iou": 0.0, "default_limit": 110, "chain_limit": 40, "restarts": 2, "limits": {n: LIMITS[n] for n in names if n in LIMITS}, "mirror": [], "keys": {}},
        "landmarks": {p: {} for p in poses if p != "idle"},
        "authored": [],
        "motion": {"idle": {"hz": 0.5, "bones": {n: {"rot": 0.4, "phase": round(i * -0.7, 2)} for i, n in enumerate(n for n in names if n in ("spine", "chest", "head", "neck", "body"))}}},
    }
    return cfg


def figure_box(idle_png: pathlib.Path) -> tuple[int, int, int, int]:
    """The alpha box of the 1x idle painting, `(x0, y0, x1, y1)` (alpha over 32)."""
    import numpy as np
    from PIL import Image

    a = np.array(Image.open(idle_png).convert("RGBA"))[..., 3] > 32
    ys, xs = np.nonzero(a)
    if not len(xs):
        raise SystemExit(f"lane new: {idle_png} is empty")
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


HOOKS = '''"""Hooks for {subject} (the lane kit's stub; the rig program). Delete what you do not use. Documented in tools/rig/rig_cut.py (cut_labels, cut_parts), rig_build.py (skin_<name>, build) and
tools/rig/subjects/lulu_hooks.py (a worked example: a skirt skinned from three bones, a part cut from another painting)."""
from __future__ import annotations
'''

ENTRY = {"actor": None, "game": "ffx", "chapter": {"door": "", "id": ""}, "poses": [], "track": {"head": "head", "feet": ["feet"], "centroid": "head"}}


def run(name: str, preset: str, subject: str | None, art: str | None, out: str | None, force: bool = False) -> int:
    subject = subject or name
    art_dir = pathlib.Path(art or REPO / "public" / "art")
    chars = art_dir / "characters" / subject
    idle = chars / "idle.png"
    if not idle.exists():
        raise SystemExit(f"lane new: {idle} is missing (the costume painting)")
    scale = 2 if (chars / "idle@2x.png").exists() else 1
    from PIL import Image

    size = Image.open(idle).size
    box = figure_box(idle)
    r = subprocess.run([NODE, "tools/rig/lane/lane-pose-table.mjs", "--subject", subject, "--art", str(art_dir), "--root", str(REPO)], cwd=str(REPO), capture_output=True, text=True)
    table = json.loads(r.stdout) if r.returncode == 0 and r.stdout.strip() else {"poses": sorted(p.stem for p in chars.glob("*.png") if re.fullmatch(r"[a-z0-9-]+", p.stem)), "rows": {}}
    head_box = (table["rows"].get("idle") or {}).get("head")
    cfg = scaffold(preset, subject, scale, size, box, head_box, table["poses"])
    dest = pathlib.Path(out) if out else REPO / "tools" / "rig" / "subjects"
    f = dest / f"{name}.json"
    if f.exists() and not force:
        raise SystemExit(f"lane new: {f} exists (--force overwrites it)")
    dest.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(cfg, indent=2), encoding="utf8")
    hooks = dest / f"{subject}_hooks.py"
    if not hooks.exists():
        hooks.write_text(HOOKS.format(subject=subject), encoding="utf8")
    entry = {**ENTRY, "actor": subject, "poses": [p for p in table["poses"] if p != "idle"]}
    say(f"lane new: wrote {f} ({preset}, scale {scale}, {len(cfg['build']['bones'])} bones, head box {'from the pose model' if head_box else 'GUESSED: the pose model has no row for idle'}) and {hooks.name}")
    say("  add this to tools/rig/lane/lane-subjects.json (fill the door word and the chapter id from the chapter registry) so the recorder knows the subject:")
    say("  " + json.dumps({subject: entry}))
    say(f"  next: edit the polygons in {f.name} (cut.polys), then `python -I tools/rig/rig.py cut --subject {name}` and `build`; the marks table `landmarks` has a slot for every registered pose")
    return 0
