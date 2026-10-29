"""pfinish.py <config name> : the finishing run of a party rig (what fin.sh does): the gate with its json, the half-size tier twins, a verify copy named for the subject proved with --verify, and the head-area table.
Reads the art folder from PYREFLY_ART_DIR (default D:/pyrefly-art-r61)."""
import json
import os
import pathlib
import shutil
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[3]
name = sys.argv[1]
ART = os.environ.get("PYREFLY_ART_DIR", "D:/pyrefly-art-r61")
sid = json.loads((REPO / "tools" / "rig" / "subjects" / f"{name}.json").read_text(encoding="utf8"))["subject"]
RIG = pathlib.Path(f"D:/pyrefly-art-rigs/{name}")
WORK = pathlib.Path(f"D:/pyrefly-art-rigs-work/{name}")


def run(cmd, tail=0):
    r = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True, env=os.environ.copy())
    out = (r.stdout + r.stderr).strip().splitlines()
    print("\n".join(out[-tail:] if tail else out))
    return r.returncode


run(["node", "tools/rig-gate.mjs", "--rig", str(RIG), "--art", ART, "--json", str(WORK / "gate.json")], 16)
run(["node", "tools/rig-tiers.mjs", "write", "--rig", str(RIG)], 1)
vc = WORK / "verify-copy"
shutil.rmtree(vc, ignore_errors=True)
vc.mkdir(parents=True)
shutil.copytree(RIG, vc / sid)
code = run(["node", "tools/rig-gate.mjs", "--rig", str(vc / sid), "--verify", "--art", ART], 2)
sys.exit(code)
