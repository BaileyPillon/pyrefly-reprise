"""Living portrait v5.1 (game case: both): sheet.jpg = the turn every 4 degrees, 1:1 head crops either side of every
cut, the swap metric per cut (sweep-metric.py + cut_checks.py), and every key's open / blink-closed / smile.

    python make_sheet.py <sweep dir> <stills dir> <out.jpg>
"""
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

FONT, BOLD = "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/segoeuib.ttf"
BG, INK, DIM, HI, CUT = (14, 12, 10), (233, 220, 184), (150, 140, 120), (242, 193, 78), (230, 90, 90)
W = 3640
CROP_T = (120, 150, 760, 900)  # the turn strip (scaled)
CROP_C = (240, 330, 680, 790)  # 1:1 cut crops: eyes, nose, mouth, jaw, the tassel's top


def f(sz, b=False):
    return ImageFont.truetype(BOLD if b else FONT, sz)


def main(sweep, stills, out):
    sweep, stills = pathlib.Path(sweep), pathlib.Path(stills)
    log = json.loads((sweep / "log.json").read_text())
    met = json.loads((sweep / "metric.json").read_text())
    chk = json.loads((sweep / "cut-checks.json").read_text())
    up = {r["target"]: r for r in log if r["dir"] == "up"}
    blocks = []
    # 1. the turn every 4 degrees (up sweep, frozen clock, ?post=0)
    degs = list(range(-40, 41, 4))
    sc = 0.26
    tw, th = int((CROP_T[2] - CROP_T[0]) * sc), int((CROP_T[3] - CROP_T[1]) * sc)
    strip = Image.new("RGB", (W, th + 40), BG)
    d = ImageDraw.Draw(strip)
    x0 = (W - tw * len(degs)) // 2
    for i, g in enumerate(degs):
        r = up[g]
        im = Image.open(sweep / r["file"]).convert("RGB").crop(CROP_T).resize((tw, th), Image.LANCZOS)
        strip.paste(im, (x0 + i * tw, 0))
        d.text((x0 + i * tw + 6, th + 6), f"{g:+d}  {r['paint']['to'].replace('v5-', '')}", fill=INK, font=f(20))
    blocks.append(("The turn every 4 degrees, -40 to +40 (1-degree sweep up, frozen clock, no post pass); the painted key under each", strip))
    # 2. 1:1 crops at every cut (up sweep: the frame before and after the painting changes)
    cuts = met["dirs"]["up"]["cuts"]
    cw, ch = CROP_C[2] - CROP_C[0], CROP_C[3] - CROP_C[1]
    per = 4
    rows = (len(cuts) + per - 1) // per
    grid = Image.new("RGB", (W, rows * (ch + 50)), BG)
    d = ImageDraw.Draw(grid)
    for i, c in enumerate(cuts):
        gx = (i % per) * (2 * cw + 30)
        gy = (i // per) * (ch + 50)
        for j, g in enumerate((c["a"], c["b"])):
            grid.paste(Image.open(sweep / up[g]["file"]).convert("RGB").crop(CROP_C), (gx + j * cw, gy + 40))
        d.text((gx + 6, gy + 6), f"cut {c['a']:+d} -> {c['b']:+d}: {c['paintA']} | {c['paintB']}   S {c['S']:.2f}  face {c['Sface']:.2f}",
               fill=HI, font=f(24, True))
    blocks.append(("1:1 at every cut: the last frame of one painting | the first of the next (sweep up)", grid))
    # 3. the numbers
    tab = Image.new("RGB", (W, 560), BG)
    d = ImageDraw.Draw(tab)
    y = 10
    d.text((20, y), "S = head-box MAD of the 1-degree step at the cut / median 1-degree step on that side (keep <= 1.5).  Mixed frames = two paintings on screen.", fill=DIM, font=f(22))
    y += 40
    for dn in ("up", "down"):
        dd = met["dirs"][dn]
        line = "   ".join(f"{c['a']:+d}/{c['b']:+d} {c['S']:.2f}" for c in dd["cuts"])
        d.text((20, y), f"{dn:>4}: {line}    max non-cut {dd['maxNonCutS']:.2f}   mixed {dd['mixedFrames']}/{dd['frames']}", fill=INK, font=f(24))
        y += 38
    y += 10
    d.text((20, y), "Pure swap at the same yaw (up vs down pass the same degree with different paintings), MAD in levels by region; noise floor = same painting both ways:", fill=DIM, font=f(22))
    y += 36
    rows_ = chk["sameYaw"]
    for k in range(0, len(rows_), 7):
        line = "   ".join(f"{s['yaw']:+d} {s['up'].replace('v5-', '')}|{s['down'].replace('v5-', '')} head {s['head']:.1f} eyes {s['eyes']:.1f} mouth {s['mouth']:.1f}" for s in rows_[k:k + 7])
        d.text((20, y), line, fill=INK, font=f(20))
        y += 30
    nf = chk["sameYawNoiseFloorHead"]
    d.text((20, y), f"noise floor head: median {nf['median']}, max {nf['max']} (n {nf['n']});  skipped (an idle half-lid in one pass): {chk.get('sameYawSkippedFaceEvent')}", fill=INK, font=f(20))
    y += 40
    t = chk["tassel"]
    ts = chk["tasselUpMinusDownSamePainting"]
    d.text((20, y), f"Tassel track (px per 1-degree step): at the cuts up {t['up']['cutSteps']}, down {t['down']['cutSteps']}; elsewhere median {t['up']['medianNonCut']} / {t['down']['medianNonCut']}, max {t['up']['maxNonCut']} / {t['down']['maxNonCut']}.",
           fill=INK, font=f(22))
    y += 34
    d.text((20, y), f"Up minus down at the SAME painting: median {ts['median']} px (n {ts['n']}) - the earring's swing lags the head in either direction; it is not a cut.", fill=INK, font=f(22))
    blocks.append(("The numbers", tab))
    # 4. expressions on every key
    sl = json.loads((stills / "log.json").read_text())
    yaws = sorted({r["yawTarget"] for r in sl})
    kinds = ("open", "closed", "smile")
    es = 0.3
    ew, eh = int(460 * es * 1.3), int(470 * es * 1.3)
    ex = Image.new("RGB", (W, len(kinds) * eh + 30), BG)
    d = ImageDraw.Draw(ex)
    x0 = (W - ew * len(yaws)) // 2 + 60
    for i, g in enumerate(yaws):
        d.text((x0 + i * ew + 8, 2), f"{g:+d}", fill=INK, font=f(22, True))
        for j, k in enumerate(kinds):
            r = next(r for r in sl if r["yawTarget"] == g and r["kind"] == k)
            ex.paste(Image.open(stills / r["file"]).convert("RGB").crop((220, 300, 680, 770)).resize((ew, eh), Image.LANCZOS), (x0 + i * ew, 30 + j * eh))
    for j, k in enumerate(kinds):
        d.text((10, 30 + j * eh + eh // 2), k, fill=HI, font=f(24, True))
    blocks.append(("Every key: eyes open | the blink's closed frame | the smile at its peak (the plate's lid frames and mouths pushed with each key)", ex))
    H = 90 + sum(b.height + 60 for _, b in blocks)
    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)
    d.text((20, 16), "Living portrait v5.1 - keys grown from the plate every 10 degrees to +-40, hard cut, blinks and smiles on every key (Yuna X-2 plate; game case: both)", fill=INK, font=f(36, True))
    y = 90
    for title, b in blocks:
        d.text((20, y), title, fill=HI, font=f(26, True))
        sheet.paste(b, (0, y + 44))
        y += b.height + 60
    sheet.save(out, quality=84, optimize=True)
    print(out, sheet.size)


if __name__ == "__main__":
    main(*sys.argv[1:4])
