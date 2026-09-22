# Logos round 3 sheets (FFX-2 only).
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/leblanc/sets/logos/round3/build-sheet.py sheet
#       -> sheet.jpg: per state one row: installed idle (the picked concept on the idle row), the installed state whole, a 1:1 face crop,
#          a 1:1 costume crop (native pixels, boxes from crops.json).
#   ... build-sheet.py strip <state> <out.jpg>
#       -> every candidate of <state> whole at one height, idle first (for picking).
import json, pathlib, sys
from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[6]
ART = ROOT / "public/art/characters/logos"
ROW = 560
GAP = 12
BG = (236, 233, 226)


def flat(p):
    im = Image.open(p).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[-1])
    return bg


def fit(im, h):
    return im.resize((max(1, int(im.width * h / im.height)), h), Image.LANCZOS)


def font(sz):
    for f in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def row(label, tiles):
    w = sum(t.width for t, _ in tiles) + GAP * (len(tiles) + 1) + 110
    h = max(t.height for t, _ in tiles) + 40
    r = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(r)
    d.text((10, 10), label, fill=(30, 30, 30), font=font(22))
    x = 110
    for t, cap in tiles:
        r.paste(t, (x, 34))
        d.text((x, 8), cap, fill=(60, 60, 60), font=font(16))
        x += t.width + GAP
    return r


def stack(rows, out):
    W = max(r.width for r in rows)
    H = sum(r.height for r in rows) + GAP * (len(rows) - 1)
    s = Image.new("RGB", (W, H), BG)
    y = 0
    for r in rows:
        s.paste(r, (0, y))
        y += r.height + GAP
    s.save(out, quality=85)
    print(out, s.size)


mode = sys.argv[1]
if mode == "sheet":
    crops = json.loads((HERE / "crops.json").read_text())
    idle = flat(ART / "idle.png")
    rows = []
    for st in ["idle", "attack", "cast", "hurt", "ko"]:
        im = flat(ART / f"{st}.png")
        side = json.loads((ART / f"{st}.json").read_text())
        c = crops[st]
        fx, fy, fw, fh = c["face"]
        cx, cy, cw, ch = c["costume"]
        face = im.crop((fx, fy, fx + fw, fy + fh))
        cost = im.crop((cx, cy, cx + cw, cy + ch))
        if cost.height > ROW:
            cost = cost.crop((0, 0, cost.width, ROW))
        first = (fit(flat(ROOT / "docs/concepts/chapters/leblanc/renders/logos-c.png"), ROW), "picked concept logos-c (idle's anchor)") if st == "idle" else (fit(idle, ROW), "installed idle (anchor)")
        tiles = [
            first,
            (fit(im, ROW) if st != "ko" else im.resize((int(im.width * 0.46), int(im.height * 0.46)), Image.LANCZOS), f"{st} installed (seed {side['seed']})"),
            (face, "face 1:1"),
            (cost, "costume 1:1"),
        ]
        rows.append(row(st, tiles))
    stack(rows, HERE / "sheet.jpg")
elif mode == "strip":
    st, out = sys.argv[2], sys.argv[3]
    tiles = [(fit(flat(ART / "idle.png"), ROW), "installed idle")] if (ART / "idle.png").exists() and st != "idle" else []
    for p in sorted((HERE / "renders").glob(f"{st}.*.png")):
        if p.name.endswith(".raw.png"):
            continue
        tiles.append((fit(flat(p), ROW) if st != "ko" else flat(p).resize((int(flat(p).width * 0.46), int(flat(p).height * 0.46))), p.stem))
    stack([row(st, tiles)], out)
else:
    raise SystemExit("mode: sheet | strip <state> <out>")
