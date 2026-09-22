"""Write docs/concepts/pause-until-dawn/prototype-v2/art/rig.json for the v3
art set: the runtime's Rig fields (src/rig.ts) at the top level, the v3
layer/patch set under artMeta.v3 (src/layers.ts reads it), and every file's
provenance under artMeta.provenance. The v2 record (layers, landmarks,
judge verdicts) is kept under artMeta.v2 unchanged, for history.

    python -s tools/gen/rig-json.py
"""
from __future__ import annotations

import hashlib
import importlib.util
import pathlib

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)

ART = L.ART
V3 = L.V3
ORDER = ["pupil_R", "noseTip", "philtrum", "mouthCorner_R", "lipUpper", "lipLower", "chin", "hairlineCenter"]


def rel_art(p) -> str:
    return pathlib.Path(p).resolve().relative_to(ART.resolve()).as_posix()


def sha(p) -> str:
    return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()[:16]


def placed(dir_, name):
    side = L.read_json(dir_ / f"{name}.json")
    return {"file": rel_art(dir_ / f"{name}.png"), "box": side["box"]}


def main():
    old = L.read_json(V3 / "masks/v2-keys.json")
    v2 = L.read_json(V3 / "masks/v2-artMeta.json")
    asm = L.read_json(V3 / "layers/frontal/assembly.json")
    keys_spec = L.read_json(V3 / "masks/keys.json")
    face = V3 / "patches"

    # frontal layers in z-order with their motion group
    frontal = []
    for n in asm["z"]:
        s = L.read_json(V3 / f"layers/frontal/{n}.json")
        frontal.append({"name": n, "file": rel_art(V3 / f"layers/frontal/{n}.png"), "box": s["box"], "motion": s["motion"]})

    keys = {}
    for k in ("q34-left", "q34-right", "profile-left", "profile-right"):
        d = V3 / "layers" / k
        keys[k] = {"back": placed(d, "back"), "front": placed(d, "front")}

    eyes_meta = L.read_json(face / "eyes/eyes.json")
    eyes = []
    for name, m in eyes_meta.items():
        eyes.append({"name": "closed" if name == "closed-geo" else name, "aperture": m["aperture"],
                     "file": rel_art(face / f"eyes/{name}.png"), "box": m["box"]})
    brows = {n: placed(face / "brows", n) for n in ("raised", "drawn")}
    mouth = {n: placed(face / "mouth", n) for n in ("parted", "smile", "pressed")}

    # landmarks (fixed order): v2's, with each chin re-measured on the key as
    # it now stands (q34-right re-placed; profile-right mirrored)
    lm = {k["id"]: k["landmarks"] for k in old["keys"]}
    rep = keys_spec["replace"]["q34-right"]
    s = 316 / (rep["chin"][1] - rep["eyeY"])
    T = lambda p: [round(s * (p[0] - rep["anchor"][0]) + rep["target"][0]), round(s * (p[1] - rep["anchor"][1]) + rep["target"][1])]
    lm["q34-right"] = [T(p) for p in lm["q34-right"]]
    lm["q34-right"][6] = T(rep["chin"])
    lm["q34-left"][6] = [460, 743]
    lm["profile-left"][6] = [400, 683]
    axis = keys_spec["mirror"]["neckAxis"]
    lm["profile-right"] = [[2 * axis - x, y] for x, y in lm["profile-left"]]
    yaw = {"frontal": 0, "q34-left": -40, "q34-right": 40, "profile-left": -85, "profile-right": 85}
    rig_keys = [{"id": "frontal", "yawDeg": 0, "file": "v3/layers/frontal/headCore.png", "landmarks": lm["frontal"]}]
    for k in ("q34-left", "q34-right", "profile-left", "profile-right"):
        rig_keys.append({"id": k, "yawDeg": yaw[k], "file": keys[k]["front"]["file"], "landmarks": lm[k]})

    prov = {}
    for f in [*(x["file"] for x in frontal), *(v["file"] for k in keys.values() for v in k.values()),
              *(e["file"] for e in eyes), *(b["file"] for b in brows.values()), *(m["file"] for m in mouth.values())]:
        prov[f] = {"sha256_16": sha(ART / f)}
    for x in frontal:
        side = L.read_json(V3 / f"layers/frontal/{x['name']}.json")
        prov[x["file"]].update({"made": "tools/gen/rig-assemble.py", "owner": side["owner"], "fill": side["fill"],
                                "masks": "tools/gen/rig-masks.py (geodesic from v3/masks/frontal.seeds.json + frontal.layers.json)"})
    for k, v in keys.items():
        kj = L.read_json(V3 / "layers" / k / "key.json")
        for part in ("back", "front"):
            prov[v[part]["file"]].update({"made": "tools/gen/rig-keys.py cut", "source": kj["source"], "silhouette": kj["silhouette"]})
    for e in eyes:
        prov[e["file"]].update({"made": "tools/gen/rig-face.py eyes", "aperture": e["aperture"], "method": "measured lid slide"})
    for n, b in brows.items():
        prov[b["file"]].update({"made": "tools/gen/rig-face.py browpatches", "move": L.read_json(face / f"brows/{n}.json")["move"]})
    for n, m in mouth.items():
        prov[m["file"]].update({"made": "tools/gen/rig-face.py mouth", "from": f"patches/mouth/{n}.png (v2 inpaint, re-matted)"})

    rig = {
        "character": "yuna-x2",
        "canvas": {"width": 832, "height": 1216},
        "bodyFile": "v3/layers/frontal/body.png",
        "headBox": old["headBox"],
        "keys": rig_keys,
        "patches": {
            "eyes": {"box": [248, 345, 517, 125], "pad": 0, "feather": 0,
                     "states": {e["name"]: {"file": e["file"]} for e in eyes}},
            "mouth": {"box": [300, 585, 320, 105], "pad": 0, "feather": 0,
                      "states": {n: {"file": m["file"]} for n, m in mouth.items()}},
            "brows": {"box": [248, 305, 447, 58], "pad": 0, "feather": 0,
                      "states": {n: {"file": b["file"]} for n, b in brows.items()}},
        },
        "artMeta": {
            "_readme": "v3 (2026-09-22): the runtime reads artMeta.v3 (src/layers.ts). Every PNG is trimmed to its alpha box and placed at `box` on the 832x1216 plate canvas. Provenance per file under artMeta.provenance; how to rebuild: tools/gen/rig-build.sh. The v2 record is kept under artMeta.v2.",
            "commonLandmarkOrder": ORDER,
            "v3": {"frontal": {"layers": frontal}, "keys": keys,
                   "patches": {"eyes": eyes, "brows": brows, "mouth": mouth},
                   "fringeLiftPx": L.read_json(V3 / "masks/frontal.hidden.json")["fringeLiftPx"]},
            "restProof": {"image": "rest-diff.png", **asm["restDiff"]},
            "range": {"file": "v3/range-sym.json", "by": "tools/gen/rig-range.mjs"},
            "provenance": prov,
            "v2": v2,
        },
    }
    L.write_json(rig, ART / "rig.json")
    print("rig.json: keys", [k["id"] for k in rig_keys], "layers", len(frontal), "files", len(prov))


if __name__ == "__main__":
    main()
