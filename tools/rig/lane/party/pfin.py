"""pfin.py <config name> [--gate-only] : variants -> export (no gate) -> gate --json -> claims rewritten into fit/keys.json -> export + gate (the stamp). rb.py of the expressive lane, with the art folder from PYREFLY_ART_DIR
(default D:/pyrefly-art-r61) and no path of its own. The rig goes to D:/pyrefly-art-rigs/<config name>, the work folder is D:/pyrefly-art-rigs-work/<config name>."""
import json
import os
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[3]
sys.path.insert(0, str(REPO / "tools" / "rig"))
sys.path.insert(0, str(REPO / "tools" / "rig" / "lane"))
import lane_fit  # noqa: E402

PY = "D:/Tools/ComfyUI/python_embeded/python.exe"
name = sys.argv[1]
ART = os.environ.get("PYREFLY_ART_DIR", "D:/pyrefly-art-r61")
RIG = f"D:/pyrefly-art-rigs/{name}"
WORK = f"D:/pyrefly-art-rigs-work/{name}"


def run(cmd):
    r = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True, env=os.environ.copy())
    return r.returncode, (r.stdout + r.stderr)


if "--gate-only" not in sys.argv:
    for step in (["variants"], ["export", "--out", RIG, "--no-gate"]):
        c, out = run([PY, "-I", "tools/rig/rig.py", *step, "--subject", name])
        print(out.strip() if step[0] == "variants" else (out.strip().splitlines()[-1] if c == 0 else out))
        if c:
            sys.exit(c)
        if step[0] == "export":
            print(run([PY, "-I", str(HERE / "pshrink.py"), name])[1].strip())
c, out = run(["node", "tools/rig-gate.mjs", "--rig", RIG, "--art", ART, "--check", "--json", WORK + "/gate-check.json"])
g = json.load(open(WORK + "/gate-check.json"))
g = g[0] if isinstance(g, list) else g
keys = json.load(open(WORK + "/fit/keys.json"))
keys, changes = lane_fit.rewrite_claims(keys, g)
json.dump(keys, open(WORK + "/fit/keys.json", "w"), separators=(",", ":"))
print("claims:", changes)
c, out = run([PY, "-I", "tools/rig/rig.py", "export", "--subject", name, "--out", RIG, "--no-gate"])
print(run([PY, "-I", str(HERE / "pshrink.py"), name])[1].strip())
c, out = run(["node", "tools/rig-gate.mjs", "--rig", RIG, "--art", ART])
print(out)
sys.exit(c)
