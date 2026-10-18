"""The rig pipeline: one approved painting per figure, cut into parts on a bone rig (the rig program, 2026-10-17; both games, shared plumbing).

Bailey, 2026-10-17: "start rigging for all chapters please. i want a permanent fix now." A figure is ONE approved painting (its costume) bent into every pose, instead of one painting per pose.
Every step is a command of this file, driven by a per-subject config, tools/rig/subjects/<name>.json (the name is the config's; its "subject" field is the art id, e.g. "kimahri"):

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/rig.py <step> --subject <name> [options]       (numpy, PIL, scipy, skimage, numba, torch+SAM for `cut --sam`)

    cut       --subject S [--sam] [--only a,b] [--cpu]    SAM masks from the config's prompts (--sam), the label map, the part images with their classical underlaps and fills   -> rig_cut.py
    build     --subject S                                 bones, triangle meshes, skin weights, landmarks, one PNG and rim mask per part                                          -> rig_build.py
    fit-keys  --subject S [--poses a,b] [--retarget]      for each pose the game draws the figure in: bone transforms that match the APPROVED painting of that pose (IoU)         -> rig_fit.py
    export    --subject S [--no-gate]                     rig.json + the PNGs into D:/pyrefly-art-rigs/<id>/ (never public/art), then the rig gate (tools/rig-gate.mjs)           -> rig_export.py
    sheet     --subject S                                 a contact sheet: each key beside its approved painting, with the gate's overlap, stature and feet                         -> rig_sheet.py
    all       --subject S [--sam]                         every step in order

The gate is `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/<id>` (tools/rig/rig-gate-lib.mjs): a rig is `ok` only when every key overlaps its approved painting by 0.75, its landmarks agree with the painting's, with stature and feet in the pose class's
band, no joint opens a hole in any key or any blend, and it is inside the budget. The runtime draws only a rig whose gate is ok; the painting-per-pose rows stay the fallback.

Folders: the work folder is D:/pyrefly-art-rigs-work/<name> (RIG_WORK), the rigs are D:/pyrefly-art-rigs (PYREFLY_RIGS_DIR), the art is public/art or PYREFLY_ART_DIR or the config's "art".
No generative model is used: every new pixel is a copy or a classical extension of the painting's own colours. While D:/Tools/pyrefly-scratch/GPU-QUIET exists SAM runs on the CPU.

Config skeleton (each section's fields are documented in its step's module): { "subject": "kimahri", "scale": 2, "costume": {"pose": "idle"}, "art": optional,
  "sam": {"parts": {...}}, "cut": {...}, "build": {...}, "fit": {...}, "motion": {...}, "keys_extra": {...}, "hooks": "kimahri_hooks.py" }
"""
from __future__ import annotations

import argparse
import pathlib
import sys

sys.path.insert(0, pathlib.Path(__file__).resolve().parent.as_posix())  # `python -I` leaves the script's folder off sys.path

from rig_common import Subject, say  # noqa: E402


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="rig.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("step", choices=["cut", "build", "fit-keys", "export", "sheet", "all"])
    ap.add_argument("--subject", required=True, help="the config's name (tools/rig/subjects/<name>.json)")
    ap.add_argument("--sam", action="store_true", help="cut: run SAM first")
    ap.add_argument("--only", default=None, help="cut --sam: only these SAM parts (comma separated)")
    ap.add_argument("--cpu", action="store_true", help="SAM on the CPU")
    ap.add_argument("--poses", default=None, help="fit-keys: only these poses")
    ap.add_argument("--retarget", action="store_true", help="fit-keys: ask the pose model for the targets again")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--no-gate", action="store_true", help="export: do not run the rig gate")
    ap.add_argument("--out", default=None, help="export: another folder; sheet: another file")
    a = ap.parse_args(argv)
    sub = Subject(a.subject)
    code = 0
    steps = ["cut", "build", "fit-keys", "export", "sheet"] if a.step == "all" else [a.step]
    for step in steps:
        say(f"== rig {step}: {sub.id} ({sub.name})")
        if step == "cut":
            import rig_cut
            rig_cut.run(sub, only_sam=a.only.split(",") if a.only else None, cpu=a.cpu, with_sam=a.sam)
        elif step == "build":
            import rig_build
            rig_build.run(sub)
        elif step == "fit-keys":
            import rig_fit
            rig_fit.run(sub, poses=a.poses.split(",") if a.poses else None, retarget=a.retarget, seed=a.seed)
        elif step == "export":
            import rig_export
            code = rig_export.run(sub, gate=not a.no_gate, out=a.out) or code
        elif step == "sheet":
            import rig_sheet
            rig_sheet.run(sub, out=a.out if a.step == "sheet" else None)
    return code


if __name__ == "__main__":
    sys.exit(main())
