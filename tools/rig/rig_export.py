"""Step 4, export: the built rig and its fitted keys -> D:/pyrefly-art-rigs/<subject>/rig.json plus one PNG per part (and per rim mask). Never into public/art.

    python rig.py export --subject kimahri [--no-gate] [--out DIR]

rig.json is the contract file `src/data/art/rigTypes.ts` (format v1): angles in degrees, `costume` = the ONE approved master the parts were cut from (its path and the first 16 hex of
its sha256; `sha2x` = the @Nx master's), `keys` = `idle` (the costume painting at rest) plus every key the fitter kept, `landmarks`, and the config's `motion` (idle sway and lag chains) as given.
It carries no `gate`: only `node tools/rig-gate.mjs` writes that. Unless --no-gate, the export ends by running the gate on what it wrote (the exit status is the gate's).
"""
from __future__ import annotations

import pathlib
import shutil
import subprocess

from rig_common import NODE, REPO, Subject, read_json, say, sha256_file, write_json


def _guard(out: pathlib.Path) -> None:
    r = out.resolve()
    bad = (REPO / "public").resolve()
    if bad in r.parents or r == bad:
        raise SystemExit(f"rig export: refusing to write into {r}: rigs never go into public/ (they live in D:/pyrefly-art-rigs)")


def build_rig(sub: Subject, build: dict, keys: dict) -> dict:
    pose = sub.costume_pose
    painting = f"art/characters/{sub.id}/{pose}.png"
    costume = {"painting": painting, "sha": sha256_file(sub.costume_1x)[:16]}
    if sub.scale > 1:
        costume["sha2x"] = sha256_file(sub.costume_master)[:16]
    all_keys = {"idle": {"bones": {}, "source": painting}}
    for name, k in keys.items():
        if name == "idle":
            all_keys["idle"] = {**all_keys["idle"], **{kk: vv for kk, vv in k.items() if kk in ("fit",)}}
        else:
            all_keys[name] = k
    for name, k in (sub.cfg.get("keys_extra") or {}).items():  # hand-authored keys (a pose with no painting): the gate judges them without an overlap
        all_keys[name] = {"source": "authored", **k}
    rig = {
        "version": 1, "name": sub.id, "scale": build["scale"], "image": build["image"], "baselineY": build["baselineY"], "costume": costume,
        "bones": build["bones"], "parts": build["parts"], "landmarks": build["landmarks"], "keys": all_keys,
    }
    if sub.cfg.get("motion"):
        rig["motion"] = sub.cfg["motion"]
    return rig


def run(sub: Subject, gate: bool = True, out=None) -> int:
    out = pathlib.Path(out) if out else sub.out
    _guard(out)
    build = read_json(sub.work / "build" / "build.json")
    keys_file = sub.work / "fit" / "keys.json"
    keys = read_json(keys_file) if keys_file.exists() else {}
    if not keys:
        say("rig export: no fitted keys (run fit-keys): the rig will carry only `idle`")
    rig = build_rig(sub, build, keys)
    out.mkdir(parents=True, exist_ok=True)
    wanted = {"rig.json"}
    for p in rig["parts"]:
        for f in (p.get("png"), p.get("rim")):
            if f:
                shutil.copyfile(sub.work / "build" / f, out / f)
                wanted.add(f)
    for stale in out.glob("*.png"):
        if stale.name not in wanted:
            stale.unlink()
    write_json(out / "rig.json", rig)
    tex = sum(p["box"][2] * p["box"][3] for p in rig["parts"])
    size = sum((out / f).stat().st_size for f in wanted if (out / f).exists())
    say(f"rig export: {out / 'rig.json'}: {len(rig['bones'])} bones, {len(rig['parts'])} parts, {len(rig['keys'])} keys ({', '.join(rig['keys'])}), {tex / 1e6:.2f} Mpx, {size / 1e6:.2f} MB")
    if not gate:
        return 0
    cmd = [NODE, "tools/rig-gate.mjs", "--rig", str(out), "--art", str(sub.art), "--root", str(REPO)]
    if sub.cfg.get("table"):
        cmd += ["--table", str(sub.rel(sub.cfg["table"]))]
    r = subprocess.run(cmd, cwd=str(REPO))
    return r.returncode
