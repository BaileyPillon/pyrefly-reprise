"""pjoints.py <config name> : the joints the hole test watches, for the REST pose of the built rig (the depth of a joint is a property of the rest figure, not of any key): exports a keyless copy of the rig into
<work>/rest-rig, runs the expressive lane's joints.mjs on it and writes <work>/joints.json ({frame, joints: [{name, depth, r, meet}]}, r in the gate's raster px). retarget.py reads it to keep each joint
`r` raster px clear of the figure's edge in every key."""
import json
import os
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pcommon as P  # noqa: E402

name = sys.argv[1]
party = P.load(name)
(party.work / "fit").mkdir(parents=True, exist_ok=True)
keys = party.work / "fit" / "keys.json"
keep = keys.read_text(encoding="utf8") if keys.exists() else None
keys.write_text("{}", encoding="utf8")
rest = party.work / "rest-rig"
env = os.environ.copy()
r = subprocess.run(["D:/Tools/ComfyUI/python_embeded/python.exe", "-I", "tools/rig/rig.py", "export", "--subject", name, "--out", str(rest), "--no-gate"], cwd=str(P.REPO), capture_output=True, text=True, env=env)
if keep is not None:
    keys.write_text(keep, encoding="utf8")
if r.returncode:
    raise SystemExit(r.stdout + r.stderr)
j = subprocess.run(["node", str(P.REPO / "tools/rig/lane/expressive/joints.mjs"), str(rest), str(party.art)], cwd=str(P.REPO), capture_output=True, text=True, env=env)
if j.returncode:
    raise SystemExit(j.stdout + j.stderr)
data = json.loads(j.stdout.strip().splitlines()[-1])
(party.work / "joints.json").write_text(json.dumps(data), encoding="utf8")
print("pjoints:", ", ".join(f"{x['name']} r{x['r']}" for x in data["joints"]), "(raster px; sx", round(data["frame"]["sx"], 3), ")")
