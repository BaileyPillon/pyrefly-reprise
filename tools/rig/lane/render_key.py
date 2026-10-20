"""A faithful colour render of an exported rig's keys beside the paintings (the lane kit; the rig program, 2026-10-19; both games, shared plumbing). No browser, no GPU: the fitter's own rasteriser, offline.

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/render_key.py <rig folder name> <out.png> [pose ...] [--art DIR] [--tile 560]

`<rig folder name>` is the folder under D:/pyrefly-art-rigs (PYREFLY_RIGS_DIR) and, for the targets it needs, under D:/pyrefly-art-rigs-work (RIG_WORK: `<work>/targets/targets.json`). Each key is drawn with its rotations, offsets,
scales, root and (format v2) the parts it shows, hides or swaps, which `rig.py sheet` does NOT do: that sheet draws rotations only, so a key whose overlap came from a leg stretch, a wing scale or a pelvis offset looks wrong in
it and right here. The painting is the one the key's `source` names (default `characters/<name>/<pose>.png` of `--art`, else public/art).
"""
from __future__ import annotations

import os
import pathlib
import sys

sys.path.insert(0, pathlib.Path(__file__).resolve().parent.parent.as_posix())

from PIL import Image, ImageDraw  # noqa: E402

from rig_common import BG, REPO, RIGS_ROOT, WORK_ROOT, read_json  # noqa: E402
from rig_skin import RigModel  # noqa: E402
from rig_v2 import state_of  # noqa: E402


def main(argv: list[str]) -> int:
    flags = {a: argv[i + 1] for i, a in enumerate(argv) if a in ("--art", "--tile") and i + 1 < len(argv)}
    pos = [a for i, a in enumerate(argv) if not a.startswith("--") and not (i > 0 and argv[i - 1] in ("--art", "--tile"))]
    if len(pos) < 2:
        print(__doc__)
        return 2
    folder, out, want = pos[0], pos[1], pos[2:]
    art = pathlib.Path(flags.get("--art") or os.environ.get("PYREFLY_ART_DIR") or REPO / "public" / "art")
    tile = int(flags.get("--tile", 560))
    rigdir = RIGS_ROOT / folder
    rig = read_json(rigdir / "rig.json")
    T = read_json(WORK_ROOT / folder / "targets" / "targets.json")
    model = RigModel(rig, rigdir, grid_affine=T["gridFromMaster"], grid=T["grid"])
    W, H = rig["image"]["w"], rig["image"]["h"]
    tiles = []
    for pose, key in rig["keys"].items():
        if want and pose not in want:
            continue
        b = key.get("bones", {})
        r = key.get("root", {})
        model.set_state(state_of(rig["parts"], key.get("parts")))
        model.pose(rot={n: t.get("rot", 0.0) for n, t in b.items()}, root=(r.get("dx", 0.0), r.get("dy", 0.0), r.get("rot", 0.0)),
                   off={n: (t["dx"], t["dy"]) for n, t in b.items() if "dx" in t or "dy" in t},
                   scl={n: (t.get("sx", 1.0), t.get("sy", t.get("sx", 1.0))) for n, t in b.items() if "sx" in t or "sy" in t})
        pad = int(W * 0.4)
        model.P[:, 0] += pad
        col = Image.fromarray(model.render_rgba(W + 2 * pad, H + int(H * 0.15), scale_down=2), "RGBA")
        model.P[:, 0] -= pad
        bg = Image.new("RGBA", col.size, BG + (255,))
        bg.alpha_composite(col)
        a = bg.convert("RGB").resize((int(col.width * tile / col.height), tile), Image.LANCZOS)
        pf = art / pathlib.Path(key.get("source") or f"characters/{rig['name']}/{pose}").with_suffix(".png")
        pf = pf if pf.exists() else art / "characters" / rig["name"] / f"{pose}.png"
        p = Image.open(pf).convert("RGBA")
        pb = Image.new("RGBA", p.size, BG + (255,))
        pb.alpha_composite(p)
        p = pb.convert("RGB").resize((int(p.width * tile / p.height), tile), Image.LANCZOS)
        t = Image.new("RGB", (p.width + a.width + 10, tile + 22), (20, 20, 24))
        t.paste(p, (0, 22))
        t.paste(a, (p.width + 10, 22))
        ImageDraw.Draw(t).text((6, 4), f"{pose}   painting | rig", fill=(255, 255, 0))
        tiles.append(t)
    sheet = Image.new("RGB", (max(t.width for t in tiles), sum(t.height for t in tiles)), (20, 20, 24))
    y = 0
    for t in tiles:
        sheet.paste(t, (0, y))
        y += t.height
    sheet.save(out)
    print(sheet.size)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
