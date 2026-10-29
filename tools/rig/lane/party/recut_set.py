"""recut_set.py <config name> --set <pose folder> [--tag t1] [--idle <idle.png>] [--base D:/pyrefly-art-r61] : THE re-cut command: a party rig built again from whatever pose folder it is pointed at, beside the first rig.

    cd D:/pyrefly-rig-rikkudk && D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/party/recut_set.py tidus-x --set D:/Tools/pyrefly-scratch/2026-10-22/motion/art/cpu/locked/tidus --tag t1

A pose folder is either a full art folder (it has `characters/<id>/<pose>.png` and `@2x`), used as it is, or a folder of 1x paintings only (the art lane's colour-locked sets): then `mkart.py` first makes the art folder (the 2x
masters carry the colour change onto the original 2x pixels; `--idle` names a new idle painting, as Tidus's T2 has) in D:/pyrefly-art-rigs-work/art-<config>-<tag>. Then `recut.py` cuts the config again as `<config>-<tag>` (its own
work and rig folders: D:/pyrefly-art-rigs-work/<config>-<tag>, D:/pyrefly-art-rigs/<config>-<tag>), reading the pose folder as the art folder: the keypoints (geometry) are the same file, everything that reads pixels re-reads the
new paintings, the gate runs on the result. The base rig is not touched. Add `--from STEP`/`--to STEP` to resume (recut.py has the steps).
"""
import os
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[3]
PY = "D:/Tools/ComfyUI/python_embeded/python.exe"
a = sys.argv[1:]
name = a[0]
opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d  # noqa: E731
src = pathlib.Path(opt("--set"))
tag = opt("--tag", "set")
sid = __import__("json").loads((REPO / "tools" / "rig" / "subjects" / f"{name}.json").read_text(encoding="utf8"))["subject"]
if (src / "characters" / sid).exists():
    art = src
else:
    art = pathlib.Path(f"D:/pyrefly-art-rigs-work/art-{name}-{tag}")
    cmd = [PY, "-I", str(HERE / "mkart.py"), "--set", str(src), "--id", sid, "--out", str(art), "--base", opt("--base", "D:/pyrefly-art-r61")]
    if opt("--idle"):
        cmd += ["--idle", opt("--idle")]
    subprocess.run(cmd, cwd=str(REPO), check=True)
env = {**os.environ, "PYREFLY_ART_DIR": str(art)}
cmd = [PY, "-I", str(HERE / "recut.py"), name, "--as", f"{name}-{tag}", "--art", str(art)]
for k in ("--from", "--to"):
    if opt(k):
        cmd += [k, opt(k)]
sys.exit(subprocess.run(cmd, cwd=str(REPO), env=env).returncode)
