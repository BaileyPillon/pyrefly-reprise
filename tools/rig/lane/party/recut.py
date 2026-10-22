"""recut.py <config name> [--art DIR] [--from STEP] [--to STEP] : re-cut a party rig from a pose folder, in one command.

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/party/recut.py tidus-x --art D:/Tools/pyrefly-scratch/2026-10-22/motion/art/<approved set>

Steps, in order (each is also a script in this folder or a `rig.py` step): prep (derive the config), idle (cut the idle painting), build, targets (the registration of every pose painting),
joints (the joints the hole test watches, from a rest-only rig), retarget (keys from the keypoints, joints kept clear of the figure's edge), partition (a mask per part and pose), masks (prep again: a part with no mask is hidden),
variants (the pieces), export (+ claims + gate), finish (clean folder, gate json, tiers, verify copy).
The keypoints and the party block are geometry: they stay the same for a new pose set unless its paintings moved (then edit the keypoints). Everything that reads pixels re-reads the art folder.
`--art` sets PYREFLY_ART_DIR for every step. The rig lands in D:/pyrefly-art-rigs/<config name>, the work in D:/pyrefly-art-rigs-work/<config name>.
"""
from __future__ import annotations

import os
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[3]
PY = "D:/Tools/ComfyUI/python_embeded/python.exe"
STEPS = ["prep", "idle", "build", "targets", "joints", "retarget", "partition", "masks", "variants", "export", "finish"]


def sh(cmd: list[str]) -> None:
    print("$", " ".join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=str(REPO), env=os.environ.copy())
    if r.returncode:
        raise SystemExit(f"recut: {' '.join(cmd[:4])} failed with {r.returncode}")


def main(argv: list[str]) -> int:
    name = argv[0]
    a = argv[1:]
    g = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
    if g("--art"):
        os.environ["PYREFLY_ART_DIR"] = g("--art")
    os.environ.setdefault("PYREFLY_ART_DIR", "D:/pyrefly-art-r61")
    art = os.environ["PYREFLY_ART_DIR"]
    first, last = STEPS.index(g("--from", "prep")), STEPS.index(g("--to", "finish"))
    sub = os.path.join(str(HERE))
    for i, step in enumerate(STEPS):
        if i < first or i > last:
            continue
        print(f"== recut {name}: {step} (art {art})", flush=True)
        if step == "prep":
            sh([PY, "-I", f"{sub}/prep.py", name])
        elif step == "idle":
            sh([PY, "-I", f"{sub}/idle_cut.py", name])
        elif step == "build":
            sh([PY, "-I", "tools/rig/rig.py", "build", "--subject", name])
        elif step == "targets":
            sh([PY, "-I", f"{sub}/targets.py", name])
        elif step == "joints":
            sh([PY, "-I", f"{sub}/pjoints.py", name])
        elif step == "masks":
            sh([PY, "-I", f"{sub}/prep.py", name])
        elif step == "retarget":
            sh([PY, "-I", f"{sub}/retarget.py", name])
        elif step == "partition":
            sh([PY, "-I", f"{sub}/partition.py", name])
        elif step == "variants":
            sh([PY, "-I", "tools/rig/rig.py", "variants", "--subject", name])
        elif step == "export":
            sh([PY, "-I", f"{sub}/pfin.py", name])
        elif step == "finish":
            sh(["bash", f"{sub}/pfin.sh", name, art])
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
