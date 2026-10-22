"""mkart.py --set <locked dir> --id <art id> --out <art dir> [--idle <idle.png>] [--base D:/pyrefly-art-r61] : an art folder the party tools can read, from a pose set that is 1x only (the art lane's colour-locked sets).

The rig is cut from the 2x masters (`<pose>@2x.png`). A locked set carries the 1x painting only (same size and same alpha as the original, the colour changed), so its 2x master is made here by carrying the colour change
onto the ORIGINAL 2x master: delta = locked(1x) - original(1x) per channel, up-sampled to 2x and added to the original 2x pixels (alpha untouched, clipped), so the 2x detail of the original stays. A pose the set does not
carry (the idle of a set that keeps the original idle, the twirl frames) is copied from the base. Sidecars (`<pose>.json`) are copied from the base. Normal maps are not copied (the pieces' normals are cut later,
from the base, by rig-normals-add). Writes <out>/characters/<id>/{<pose>.png, <pose>@2x.png, <pose>.json}. Never writes into the base or the set.

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/party/mkart.py --set D:/Tools/pyrefly-scratch/2026-10-22/motion/art/cpu/locked/tidus --id tidus --out D:/pyrefly-art-rigs-work/art-tidus-t1
"""
import pathlib
import shutil
import sys

import numpy as np
from PIL import Image

a = sys.argv[1:]
opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d  # noqa: E731
SET = pathlib.Path(opt("--set"))
ID = opt("--id")
OUT = pathlib.Path(opt("--out")) / "characters" / ID
BASE = pathlib.Path(opt("--base", "D:/pyrefly-art-r61")) / "characters" / ID
IDLE = opt("--idle")
OUT.mkdir(parents=True, exist_ok=True)


def carry(pose: str, locked_path: pathlib.Path) -> None:
    lock1 = np.asarray(Image.open(locked_path).convert("RGBA"), np.float32)
    org1 = np.asarray(Image.open(BASE / f"{pose}.png").convert("RGBA"), np.float32)
    org2 = np.asarray(Image.open(BASE / f"{pose}@2x.png").convert("RGBA"), np.float32)
    if lock1.shape != org1.shape:
        raise SystemExit(f"mkart: {locked_path} is {lock1.shape[1]}x{lock1.shape[0]}, the original {org1.shape[1]}x{org1.shape[0]}: a set that changes the canvas needs its own 2x master")
    delta = (lock1[..., :3] - org1[..., :3]) * (org1[..., 3:4] > 0)
    h2, w2 = org2.shape[:2]
    chans = [np.asarray(Image.fromarray(delta[..., c].astype(np.float32), "F").resize((w2, h2), Image.BICUBIC)) for c in range(3)]
    up = np.stack(chans, -1)
    new2 = org2.copy()
    vis = org2[..., 3:4] > 0
    new2[..., :3] = np.where(vis, np.clip(org2[..., :3] + up, 0, 255), org2[..., :3])
    Image.fromarray(new2.astype(np.uint8), "RGBA").save(OUT / f"{pose}@2x.png", optimize=True)
    shutil.copyfile(locked_path, OUT / f"{pose}.png")


poses = {p.stem: p for p in SET.glob("*.png") if not p.stem.endswith(("-only", ".map")) and (BASE / f"{p.stem}.png").exists()}
done = []
for pose, p in sorted(poses.items()):
    carry(pose, p)
    done.append(pose)
if IDLE:
    carry("idle", pathlib.Path(IDLE))
    done.append("idle")
for f in BASE.iterdir():  # everything else the base has, as it is (poses the set does not carry, sidecars, other tiers)
    stem = f.name.split(".")[0].split("@")[0]
    if f.suffix in (".png", ".json") and ".normal" not in f.name and stem not in done and not (OUT / f.name).exists() and "@3x" not in f.name and "@4x" not in f.name:
        shutil.copyfile(f, OUT / f.name)
for pose in done:
    sc = BASE / f"{pose}.json"
    if sc.exists():
        shutil.copyfile(sc, OUT / f"{pose}.json")
print(f"mkart: {len(done)} pose(s) carried ({', '.join(done)}) into {OUT}")
