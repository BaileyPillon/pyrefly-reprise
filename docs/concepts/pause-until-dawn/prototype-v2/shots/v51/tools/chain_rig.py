"""Living portrait v5.1 (game case: both): the prototype rig.json for the grown keys, -40..+40 every 10 degrees.

Per key it writes the head halves (back = hair-back + neck + front; front = neck + front: the neck rides under the
face and over the pinned body), the key's own lid frames (keyLids: the plate's 8 frames pushed with the key, so
it blinks at every yaw), its mouth and brow patches (keyPatches + the key's rest composite for the seam fit), the
runtime pair meshes (v5/flow, the same vertices at their two g's: each key registered to its neighbour by
construction), the tassel offset (the earring's anchor carried by the meshes: where THIS painting has the ear), and
for the left keys the cheek drawn back over the tassel (faceOver). The frontal key's body loses the neck, which comes
back as a head layer right after it (at rest: the plate body exactly); bodyTurned loses it the same way.

    $PY chain_rig.py --out <proto>/art [--keys 10,20,30,40]
"""
from __future__ import annotations

import argparse
import json
import pathlib

import numpy as np

import chain_core as C
import chain_face as F
import chain_grow as G


def put(out, rel, img):
    t, box = C.trim(img)
    C.save(out / rel, t)
    return {"file": rel, "box": box}


def canvas(rel_box, out):
    return C.placed(out / rel_box["file"], rel_box["box"])


def build(out, degs):
    rig = C.load_rig()
    new = json.loads(json.dumps(rig))
    v3, v4 = new["artMeta"]["v3"], new["artMeta"]["v4"]
    neck_ent = put(out, "v5/face/neck.png", G.face_layer("neck"))
    minus_ent = put(out, "v5/face/body-minus.png", G.face_layer("body-minus"))
    clean_ent = put(out, "v5/face/turned-minus.png", G.body_clean())
    behind = [l["name"] for l in v3["frontal"]["layers"][:[l["motion"] for l in v3["frontal"]["layers"]].index("chest")]]
    assert behind == ["hairBack"], behind  # the plate key's hair-back is exactly this one layer
    hb_ent = put(out, "v5/face/hairBack-fp.png", G.plate_key(rig, 0.0)["hb"])
    layers = []
    for l in v3["frontal"]["layers"]:
        if l["name"] == "hairBack":
            layers.append({**l, **hb_ent})
        elif l["motion"] == "chest":
            layers.append({**l, **minus_ent})
            layers.append({"name": "neck", "motion": "head", **neck_ent})
        else:
            layers.append(l)
    v3["frontal"]["layers"] = layers
    v3["frontal"]["bodyTurned"] = {**clean_ent, "_readme": "v5.1 chain_face.py: the tassel footprint filled (rig-collar.py), the neck taken out (a head layer eased to the pinned collar)"}
    fr_key = next(k for k in rig["keys"] if k["id"] == "frontal")
    anchor0 = F.tassel_anchor(rig)
    keys, v3keys, lids, kpatches, pairs = [fr_key], {}, {}, {}, {}
    dxs = {"frontal": 0.0}
    fo_src = rig["artMeta"]["v4"]["tassel"]["faceOver"]["frontal"]
    faceover = {"frontal": fo_src}
    for side in ("r", "l"):
        lm = fr_key["landmarks"]
        fo = C.placed(C.ART / fo_src["file"], fo_src["box"])
        for deg in degs:
            k = C.kid(side, deg)
            lo, hi = (C.kid(side, deg - 10), k) if side == "r" else (k, C.kid(side, deg - 10))
            pa, pb, hw = C.pair_positions(side, deg)
            (out / "v5/flow").mkdir(parents=True, exist_ok=True)
            (out / "v5/flow" / f"{lo}__{hi}.bin").write_bytes(np.dstack([pa, pb, hw[..., None]]).astype("<f4").tobytes())
            pairs[f"{lo}|{hi}"] = f"v5/flow/{lo}__{hi}.bin"
            lm = [[round(x, 1), round(y, 1)] for x, y in C.points_step(side, deg, lm)]
            bm = C.step_map(side, deg)[0][..., :2]
            fo = C.remap(fo, bm)
            K = G.load_key(rig, k)
            pj = json.loads((C.keydir(k) / "propagate.json").read_text())
            front = K["neck"].copy()
            C.over(front, K["fr"])
            back = K["hb"].copy()
            C.over(back, front)
            v3keys[k] = {"back": put(out, f"v5/layers/{k}/back.png", back), "front": put(out, f"v5/layers/{k}/front.png", front)}
            keys.append({"id": k, "yawDeg": deg if side == "r" else -deg, "file": v3keys[k]["front"]["file"], "landmarks": lm})
            dxs[k] = round(pj["anchor"][0] - anchor0[0], 2)
            rest = G.composite(rig, K, dxs[k])
            C.save(out / f"v5/layers/{k}/rest.png", rest)
            kp = {"rest": f"v5/layers/{k}/rest.png", "mouth": {}, "brows": {}}
            frames = []
            for n, img in K["patches"].items():
                grp, name = n.split("/")
                ent = put(out, f"v5/patches/{k}/{grp}/{name}.png", img)
                if grp == "lid":
                    ap = next(e["aperture"] for e in rig["artMeta"]["v3"]["patches"]["eyes"] if e["name"] == name)
                    frames.append({"name": name, "aperture": ap, "raw": True, **ent})
                else:
                    kp[grp][name] = ent
            lids[k] = sorted(frames, key=lambda f: -f["aperture"])
            kpatches[k] = kp
            if side == "l":
                f2 = fo.copy()
                f2[..., :3] = front[..., :3]
                f2[..., 3] = np.minimum(fo[..., 3], front[..., 3])
                faceover[k] = put(out, f"v5/layers/{k}/faceover.png", f2)
    new["keys"] = sorted(keys, key=lambda k: k["yawDeg"])
    v3["keys"] = v3keys
    v3["keyLids"] = lids
    v3["keyPatches"] = kpatches
    v4["flow"]["pairs"] = pairs
    v4["tassel"]["dx"] = dxs
    v4["tassel"]["faceOver"] = faceover
    new["artMeta"]["v51"] = {
        "method": "d: keys grown from the plate every 10 degrees to +-40, holes (magnified only) repainted with the eyes, brows and mouth protected, hard cut; every key carries the plate's lid frames, mouths and brows pushed with it; the neck as a layer on the head's map eased to a pinned collar (ghost-jaw fix); tassel at the anchor the meshes carry",
        "picks": {k: json.loads((C.keydir(k) / "pick.json").read_text()) for k in v3keys},
        "tasselDx": dxs,
    }
    (out / "rig.json").write_text(json.dumps(new, indent=1) + "\n", encoding="utf-8")
    print("rig:", [k["id"] for k in new["keys"]], "pairs:", list(pairs), "dx:", dxs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--keys", default="10,20,30,40")
    a = ap.parse_args()
    build(pathlib.Path(a.out), [int(x) for x in a.keys.split(",")])


if __name__ == "__main__":
    main()
