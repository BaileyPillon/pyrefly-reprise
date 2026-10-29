"""head_reading.py <rig folder> [--json out.json] : the head of every key of a party rig, read from the rig FILES (no game, no GPU): the CHK-026 reading the continuity harness takes from the head part's mesh, and the OPAQUE head (what the
player sees: the alpha of the piece, in master px), each against the idle's, and the largest change of head size between any two keys (rigs-v2, 2026-10-29; both games, shared plumbing).

For each key that shows a head variant: `mesh` is the variant's mesh area over the idle head part's (`analyzeRigSwap` metric `head`, `critic/runner/lib/continuity-rig.mjs`), `opaque` the variant's opaque area (alpha > 127, texel area in master px) over the idle head's.
`worstPair` is the largest ratio between two keys' opaque heads: the head-size change a key change can show at most. A figure whose heads are cut by `scaleArea`/`opaqueArea` (the party method: every head variant grown to the idle head's area) reads
1.00 within a few percent; a painting set of the same poses reads what PR-0531 measured (the real head 10 to 18 percent off at some swaps).
"""
import json
import pathlib
import sys

import numpy as np
from PIL import Image


def tri_area(verts, tris) -> float:
    a = 0.0
    for t in range(0, len(tris) - 2, 3):
        p, q, s = tris[t] * 2, tris[t + 1] * 2, tris[t + 2] * 2
        a += abs((verts[q] - verts[p]) * (verts[s + 1] - verts[p + 1]) - (verts[s] - verts[p]) * (verts[q + 1] - verts[p + 1])) / 2
    return a


def opaque_area(folder: pathlib.Path, piece: dict, fallback: dict) -> float:
    """Opaque area of a piece in master px squared: its opaque texels times the master area one texel covers, which is the mesh's area over the part of the texture the mesh uses (`uvs`; without them the box's own mapping).
    Not the box: a stored piece may be smaller than its box says (`tex`), and two pieces of one figure are cut at different `tex`."""
    a = np.asarray(Image.open(folder / piece["png"]).convert("RGBA"))[..., 3]
    h, w = a.shape
    verts = piece.get("verts", fallback["verts"])
    tris = piece.get("triangles") or piece.get("tris") or fallback.get("triangles") or fallback.get("tris")
    box = piece.get("box", fallback["box"])
    uvs = piece.get("uvs") or piece.get("uv")
    if uvs is None:
        uvs = [c for i in range(0, len(verts), 2) for c in ((verts[i] - box[0]) / box[2], (verts[i + 1] - box[1]) / box[3])]
    uv_area = tri_area(uvs, tris)
    return float((a > 127).sum()) * tri_area(verts, tris) / max(uv_area * w * h, 1e-9)


def read(folder: pathlib.Path) -> dict:
    rig = json.loads((folder / "rig.json").read_text(encoding="utf8"))
    head = next(p for p in rig["parts"] if p["name"] == "head")
    own_mesh = tri_area(head["verts"], head.get("triangles") or head.get("tris"))
    own_opq = opaque_area(folder, head, head)
    rows = {}
    for key, k in rig["keys"].items():
        image = (k.get("parts") or {}).get("head", {}).get("image")
        if key != "idle" and image is None:
            if (k.get("parts") or {}).get("head", {}).get("show") is False:
                rows[key] = {"head": "hidden"}
            continue
        if key == "idle" or image is None:
            rows[key] = {"mesh": 1.0, "opaque": 1.0}
            continue
        v = head["variants"][image]
        verts = v.get("verts", head["verts"])
        tris = v.get("triangles") or v.get("tris") or head.get("triangles") or head.get("tris")
        rows[key] = {"mesh": round(tri_area(verts, tris) / own_mesh, 4), "opaque": round(opaque_area(folder, v, head) / own_opq, 4)}
    shown = {k: r for k, r in rows.items() if "opaque" in r}
    lo = min(shown.items(), key=lambda kv: kv[1]["opaque"])
    hi = max(shown.items(), key=lambda kv: kv[1]["opaque"])
    return {
        "rig": str(folder), "name": rig["name"], "keys": rows,
        "meshRange": [min(r["mesh"] for r in shown.values()), max(r["mesh"] for r in shown.values())],
        "opaqueRange": [lo[1]["opaque"], hi[1]["opaque"]],
        "worstPair": {"from": lo[0], "to": hi[0], "ratio": round(hi[1]["opaque"] / lo[1]["opaque"], 4)},
    }


if __name__ == "__main__":
    out = read(pathlib.Path(sys.argv[1]))
    for k, r in out["keys"].items():
        print(f"{k:18s} {r}")
    print("mesh range", out["meshRange"], " opaque range", out["opaqueRange"], " worst pair", out["worstPair"])
    if "--json" in sys.argv:
        pathlib.Path(sys.argv[sys.argv.index("--json") + 1]).write_text(json.dumps(out, indent=1), encoding="utf8")
