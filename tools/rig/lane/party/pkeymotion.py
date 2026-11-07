"""pkeymotion.py <config name> : apply the `party.key_motion` (each key's `ms` and `fadeMs`) and `party.idle_key` of a config to an already cut rig WITHOUT cutting it again: prep rewrites the derived config sections, the
fields are put into <work>/fit/keys.json, and the export and the gate run again (pfin.py --gate-only). The bones and the pieces do not depend on these numbers."""
import json
import os
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[3]
PY = "D:/Tools/ComfyUI/python_embeded/python.exe"
name = sys.argv[1]
env = os.environ.copy()
subprocess.run([PY, "-I", str(HERE / "prep.py"), name], cwd=str(REPO), env=env, check=True)
cfg = json.loads((REPO / "tools" / "rig" / "subjects" / f"{name}.json").read_text(encoding="utf8"))
km = cfg["party"].get("key_motion", {})
kf = pathlib.Path(f"D:/pyrefly-art-rigs-work/{name}/fit/keys.json")
keys = json.loads(kf.read_text(encoding="utf8"))
for pose, k in keys.items():
    for f in ("ms", "fadeMs"):
        k.pop(f, None)
    k.update({f: v for f, v in (km.get(pose) or {}).items() if f in ("ms", "fadeMs")})
kf.write_text(json.dumps(keys, separators=(",", ":")), encoding="utf8")
r = subprocess.run([PY, "-I", str(HERE / "pfin.py"), name, "--gate-only"], cwd=str(REPO), env=env, capture_output=True, text=True)
print("\n".join((r.stdout + r.stderr).strip().splitlines()[-6:]))
sys.exit(r.returncode)
