"""Quick cutout QC: flags halos, retained backgrounds and dangling props.

    python_embeded/python.exe -s tools/gen/qc.py "public/art/characters/jecht/*.png"

baselineY is the lowest opaque row, but a sword tip or sash below the feet
makes that number plant the prop on the floor and float the character
(docs/ART-PIPELINE.md section 5). footY is the lowest row still wide enough to
be a body; a large footY/lowest gap means the sidecar needs a hand correction.
"""
import sys, glob, json, os
from PIL import Image

def qc(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    a = im.getchannel("A")
    px = a.load()
    n = w * h
    opaque = sum(1 for c, v in enumerate(a.histogram()) if c > 200 for _ in range(v)) if False else \
             sum(v for c, v in enumerate(a.histogram()) if c > 200)
    semi = sum(v for c, v in enumerate(a.histogram()) if 20 < c <= 200)
    corners = [px[0,0], px[w-1,0], px[0,h-1], px[w-1,h-1]]
    # widest opaque row vs lowest opaque row -> dangling prop detector
    rows = []
    for y in range(0, h):
        row = [x for x in range(0, w, 4) if px[x,y] > 200]
        rows.append(len(row))
    widest = max(rows) if rows else 0
    ylow = max((y for y, c in enumerate(rows) if c > 0), default=0)
    # Lowest row still wide enough to be feet/body rather than a blade tip.
    thresh = max(2, widest * 0.12)
    ybody = max((y for y, c in enumerate(rows) if c >= thresh), default=0)
    return {
        "file": (os.path.relpath(path) if os.path.splitdrive(path)[0].lower() == os.path.splitdrive(os.getcwd())[0].lower() else path).replace("\\", "/"),
        "size": f"{w}x{h}",
        "opaquePct": round(100 * opaque / n, 1),
        "semiPct": round(100 * semi / n, 1),
        "cornersOpaque": sum(1 for c in corners if c > 40),
        "lowestOpaqueY": ylow,
        "footY": ybody,
        "danglePx": ylow - ybody,
    }

def verdict(r):
    bad = []
    if r["cornersOpaque"]: bad.append("BG-RETAINED")
    if r["opaquePct"] > 72: bad.append("FRAME-FULL")
    if r["semiPct"] > 12: bad.append("HALO")
    if r["danglePx"] > 60: bad.append(f"DANGLE-{r['danglePx']}px")
    return ",".join(bad) or "ok"

if __name__ == "__main__":
    pats = sys.argv[1:]
    files = []
    for p in pats:
        files.extend(sorted(glob.glob(p)))
    for f in files:
        if f.endswith(".raw.png"): continue
        r = qc(f)
        print(f"{verdict(r):<28} {r['size']:>10}  op{r['opaquePct']:>5}%  semi{r['semiPct']:>5}%  dangle{r['danglePx']:>5}  {r['file']}")
