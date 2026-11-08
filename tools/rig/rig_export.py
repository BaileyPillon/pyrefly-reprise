"""Step 4, export: the built rig and its fitted keys -> D:/pyrefly-art-rigs/<subject>/rig.json plus one PNG per part (and per rim mask). Never into public/art.

    python rig.py export --subject kimahri [--no-gate] [--out DIR]

rig.json is the contract file `src/data/art/rigTypes.ts` (format v1): key angles in radians, skin as `bone` or `weights` (four numbers a vertex), `costume` = the ONE approved master the parts were cut from (its path and the first 16 hex of
its sha256; `sha2x` = the @Nx master's), `keys` = `idle` (the costume painting at rest) plus every key the fitter kept, `landmarks`, and the config's `motion` (idle sway and lag chains) as given.
The config adds what the gate reads under the driver's pose-intent rule (2026-10-17: a key passes when its overlap with the approved painting is 0.75 or more AND its landmarks agree): `landmarks`
{pose: {rig landmark name: [x, y]}} (the approved painting's own 1x pixels, marked once per pose; each becomes that key's `expect`, which the gate REQUIRES of every painted key), `authored` [pose, ...]
(those keys say `source: "authored"`: the gate waives their overlap, still demands their landmarks and lists them), `fit.mirror` [pose, ...] (the painting faces the other way from the rig: the key says
`turn: true`, the gate reads the painting turned about its stance) and `acceptance` {iou, landmarkPct} (this rig's bars; the gate lets a rig only TIGHTEN 0.75 and 0.06).
Format v2 (2026-10-18, `rig_v2.py`): parts the build marked `hidden` and their `variants` are written as they are (and their PNGs copied), a key's `parts` come from `fit.keys.<pose>` (`show`, `hide`, `image`) and
`keys_extra.<pose>.parts`, and the file says `version: 2` exactly when it uses one of those; a subject that uses none writes the version 1 file it always wrote.
It carries no `gate`: only `node tools/rig-gate.mjs` writes that. Unless --no-gate, the export ends by running the gate on what it wrote (the exit status is the gate's).
"""
from __future__ import annotations

import pathlib
import shutil
import subprocess

import rig_v2
from rig_common import NODE, REPO, Subject, read_json, say, sha256_file, write_json


def _guard(out: pathlib.Path) -> None:
    r = out.resolve()
    bad = (REPO / "public").resolve()
    if bad in r.parents or r == bad:
        raise SystemExit(f"rig export: refusing to write into {r}: rigs never go into public/ (they live in D:/pyrefly-art-rigs)")


def build_rig(sub: Subject, build: dict, keys: dict) -> dict:
    pose = sub.costume_pose
    painting = f"characters/{sub.id}/{pose}"
    costume = {"painting": painting, "pose": pose, "sha": sha256_file(sub.costume_1x)}
    if sub.scale > 1:
        costume["sha2x"] = sha256_file(sub.costume_master)
    all_keys = {"idle": {"bones": {}, "source": painting}}
    for name, k in keys.items():
        if name == "idle":
            all_keys["idle"] = {**all_keys["idle"], **{kk: vv for kk, vv in k.items() if kk in ("fit",)}}
        else:
            all_keys[name] = k
    for name, k in (sub.cfg.get("keys_extra") or {}).items():  # hand-authored keys (a pose with no painting): the gate judges them without an overlap
        all_keys[name] = {"source": "authored", **k}
    for k, v in (sub.cfg.get("idle_key") or {}).items():  # how the figure moves INTO the rest pose (`ms`, `fadeMs`): the idle is a key like any other, and a return to it can cut or fade like an entry to another
        if k in ("ms", "fadeMs"):
            all_keys["idle"][k] = v
    for name, marks in (sub.cfg.get("landmarks") or {}).items():  # the approved painting's landmarks, marked once per pose: the gate's `expect`
        if name in all_keys and name != sub.costume_pose and not name.startswith("_"):
            all_keys[name]["expect"] = marks
    for name in sub.cfg.get("authored") or []:  # a pose that cannot reach the overlap bar: the key is authored, its landmarks must agree, and the gate lists it
        if name in all_keys:
            all_keys[name]["source"] = "authored"
    for name in (sub.cfg.get("fit") or {}).get("mirror") or []:  # the painting of this pose faces the other way from the rig: the gate reads it turned about its stance (marks stay the painting's own px)
        if name in all_keys:
            all_keys[name]["turn"] = True
    for name, k in all_keys.items():  # format v2: which parts the key shows, hides or swaps (the fitter drew it in that state)
        kp = rig_v2.key_parts(((sub.cfg.get("fit") or {}).get("keys") or {}).get(name))
        if kp and name != "idle":
            k["parts"] = {**(k.get("parts") or {}), **kp}
    rig = {
        "version": 1, "name": sub.id, "scale": build["scale"], "image": build["image"], "baselineY": build["baselineY"], "costume": costume,
        "bones": build["bones"], "parts": build["parts"], "landmarks": build["landmarks"], "keys": all_keys,
    }
    if sub.cfg.get("motion"):
        rig["motion"] = sub.cfg["motion"]
    if sub.cfg.get("acceptance"):
        rig["acceptance"] = sub.cfg["acceptance"]
    if rig_v2.uses_v2(rig):
        rig["version"] = 2
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
    for f in rig_v2.image_files(rig["parts"]):  # every part's PNG and rim mask, and every variant's
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
