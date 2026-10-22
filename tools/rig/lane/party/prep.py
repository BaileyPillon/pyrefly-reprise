"""prep.py <config name> : write the derived sections of a party subject config from its `party` block and keypoints (idempotent; run it after editing the party block, `recut.py` runs it first).

    cut.order, build.bones / skin / landmarks / variants, landmarks (each key's `expect` marks), fit.keys.<pose>.image / hide, motion.idle, authored.

The `party` block (the part of the config a person edits):
  keypoints      the file of per-pose keypoints, 1x px of each pose painting (idle included; its hidden limbs' points are the rest joints of a limb the idle does not show)
  poses          the poses that get a key (not the idle)
  idle_hidden    keypoints the idle painting does not show (a stub piece stands for the part)
  order          draw order, back to front
  parts          { part: { caps: [[pointA, pointB, radius], [point, radius]], bias, skin: { type, bone | bones+joints+ramps, mesh }, variant: { mesh, tex, ... } } }; radii are 1x px
  skeleton       [[bone, parent, rest point name], ...]; `aim`: { bone: point the bone's axis points at }; `place`: { bone: point its joint is put on (an offset) }; `noscale`: [bone]; `scales`: { bone: [lo, hi] }
  landmarks      { name: [bone, rest point] };  marks: the landmark names written as each key's `expect`
  underlap, underlap_idle, margin   the partition's overlap into neighbours (1x px) and the certain-label margin
"""
from __future__ import annotations

import json
import sys

import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pcommon as P  # noqa: E402


def pose_parts(party: P.Party, pose: str) -> list[str]:
    """The parts a pose shows: those with at least one capsule whose points the pose's keypoints name, and (once `partition.py` has run for the pose) a non-empty mask."""
    names = set(party.kp[pose])
    masked = (party.work / "masks" / f"{pose}.labels.png").exists()
    names |= {"waist"} if {"neck", "pelvis"} <= names else set()
    out = []
    for n in party.order:
        for c in party.parts[n].get("caps", []):
            if all(p in names for p in c[:-1]):
                if not masked or (party.work / "masks" / f"{pose}.{n}.png").exists():
                    out.append(n)
                break
    return out


def main(name: str) -> int:
    party = P.load(name)
    cfg = party.cfg
    pp = party.party
    S = party.S
    rest = party.rest_points()
    j = lambda pt: [round(rest[pt][0] / S, 1), round(rest[pt][1] / S, 1)]  # noqa: E731  (a rest point in 1x px, the unit of the config)
    rj = P.rest_joints(party)
    jb = lambda b: [round(rj[b][0] / S, 1), round(rj[b][1] / S, 1)]  # noqa: E731  (a bone's pivot in 1x px)
    bones = [[e[0], e[1], jb(e[0])] for e in pp["skeleton"]]
    centre_bone = {e[2]: e[0] for e in pp["skeleton"] if len(e) > 3}  # a point that is the centre of an outline-pivoted bone: the chain skin follows that bone's pivot
    skin = {}
    for n in party.order:
        sp = dict(pp["parts"][n]["skin"])
        if sp["type"] == "chain":
            sp["joints"] = [(jb(centre_bone[p]) if p in centre_bone else j(p)) if isinstance(p, str) else p for p in sp["joints"]]
        skin[n] = sp
    lms = {k: [b, j(pt)] for k, (b, pt) in pp["landmarks"].items()}
    lms["feet"] = ["root", j("ground")]
    variants, keys_cfg, marks = {}, {}, {}
    vd = pp.get("variant_defaults", {})
    for pose in party.poses:
        shown = pose_parts(party, pose)
        keys_cfg[pose] = {"image": {n: pose for n in shown}, "hide": [n for n in party.order if n not in shown]}
        marks[pose] = {m: list(party.kp[pose][m]) for m in pp.get("marks", []) if m in party.kp[pose]}
        if pose in pp.get("layers", {}):
            keys_cfg[pose]["layers"] = pp["layers"][pose]
        for n in shown:
            vs = {**vd, **pp["parts"][n].get("variant", {})}
            spec = {"pose": pose, "mask": str(party.work / "masks" / f"{pose}.{n}.png").replace("\\", "/"), "mask_pad": int(pp.get("pad", 600)), "register": pose, "scale": 1.0}
            if skin[n]["type"] == "chain":
                spec["skin"] = "chain"
            spec.update(vs)
            if "mesh" not in spec:
                spec["mesh"] = dict(skin[n].get("mesh", {"edge": 40, "inner": 80, "grow": 12}))
            variants.setdefault(n, {})[pose] = {"from_painting": spec}
    cfg["cut"] = {"order": list(party.order)}
    cfg["build"] = {"bones": bones, "skin": skin, "landmarks": lms, "variants": variants, "rim": True}
    if pp.get("normals"):
        cfg["build"]["normals"] = pp["normals"]
    cfg["landmarks"] = marks
    cfg["fit"] = {"mirror": [], "keys": keys_cfg}
    cfg["authored"] = list(pp.get("authored", []))
    if pp.get("idle_key"):
        cfg["idle_key"] = pp["idle_key"]
    cfg["motion"] = pp.get("motion", cfg.get("motion", {}))
    cfg.pop("art", None)
    party.sub.path.write_text(json.dumps(cfg, indent=1), encoding="utf8")
    print(f"prep: {name}: {len(bones)} bones, {len(party.order)} parts, {sum(len(v) for v in variants.values())} variants, poses {', '.join(party.poses)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
