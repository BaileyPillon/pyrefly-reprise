"""Living-portrait v3.3: curate a tools/gen/rig-check.mjs run into the
prototype's shots/v3.3/ (the stills the v3.1 check refuted, re-taken at the
same yaws with the same real inputs, their 1:1 and 3x crops, the blink and
turned-blink strips, the resting-mouse strip, the clip, a contact sheet) and
the numbers tools/gen/rig-measure.py read off the same run.

    python -s tools/gen/rig-shots.py --run <rig-check out dir> --measure <measure.json>
"""
from __future__ import annotations

import argparse
import json
import pathlib
import shutil

from PIL import Image, ImageDraw

REPO = pathlib.Path(__file__).resolve().parents[2]
OUT = REPO / "docs/concepts/pause-until-dawn/prototype-v2/shots/v3.3"
PLATE = REPO / "docs/concepts/pause-until-dawn/prototype-v2/art/keys/frontal.png"
YAWS = ["m20", "m40", "m60", "m80", "p20", "p40", "p60", "p80"]
# the crops the v3.1 check looked at, same boxes (x, y, w, h), and the zoom it used
CROPS = {
    "m20-jaw": ("seam-live-m20", (300, 560, 360, 260), 2),
    "m20-hair-left": ("seam-live-m20", (60, 120, 260, 700), 1),
    "m20-hair-right": ("seam-live-m20", (560, 60, 272, 800), 1),
    "m20-eye-left": ("seam-live-m20", (500, 330, 200, 150), 3),
    "m60-face": ("seam-live-m60", (300, 330, 420, 440), 2),
    "m60-neck": ("seam-live-m60", (480, 560, 352, 380), 1),
    "m80-back-of-head": ("seam-live-m80", (560, 0, 272, 920), 1),
    "m80-crown": ("seam-live-m80", (300, 0, 532, 360), 1),
    "p20-collar": ("seam-live-p20", (150, 640, 600, 300), 1),
    "p20-hair-left": ("seam-live-p20", (40, 120, 300, 780), 1),
    "p40-back-of-head": ("seam-live-p40", (0, 0, 300, 920), 1),
    "p60-back-of-head": ("seam-live-p60", (0, 0, 300, 920), 1),
    "p80-back-of-head": ("seam-live-p80", (0, 0, 300, 920), 1),
    "p80-eye": ("seam-live-p80", (560, 380, 160, 110), 3),
}


def crop(src, box, zoom):
    im = Image.open(src).convert("RGB").crop((box[0], box[1], box[0] + box[2], box[1] + box[3]))
    return im.resize((im.width * zoom, im.height * zoom), Image.NEAREST) if zoom > 1 else im


def strip(paths, box, zoom=2, labels=None):
    tiles = [crop(p, box, zoom) for p in paths]
    w, h = tiles[0].size
    s = Image.new("RGB", (w * len(tiles), h + 18), (12, 10, 14))
    d = ImageDraw.Draw(s)
    for i, t in enumerate(tiles):
        s.paste(t, (i * w, 18))
        if labels:
            d.text((i * w + 4, 3), labels[i], fill=(235, 225, 210))
    return s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True)
    ap.add_argument("--measure", required=True)
    a = ap.parse_args()
    run = pathlib.Path(a.run)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "crops").mkdir(exist_ok=True)
    for n in ("rest-post0", "rest-post"):
        shutil.copy(run / f"{n}.png", OUT / f"00-{n}.png")
    for i, y in enumerate(YAWS, 1):
        shutil.copy(run / f"seam-live-{y}.png", OUT / f"{i:02d}-yaw-{y}.png")
    for name, (src, box, zoom) in CROPS.items():
        crop(run / f"{src}.png", box, zoom).save(OUT / "crops" / f"{name}.png")
    # the plate's own mouth next to the smile at its peak (2x)
    mouth = (300, 540, 360, 200)
    plate = Image.open(PLATE).convert("RGBA")
    bg = Image.new("RGBA", plate.size, (8, 5, 8, 255))
    bg.alpha_composite(plate)
    pm = bg.convert("RGB").crop((mouth[0], mouth[1], mouth[0] + mouth[2], mouth[1] + mouth[3]))
    sm = crop(run / "smile-peak.png", mouth, 1)
    s = Image.new("RGB", (mouth[2] * 2, mouth[3]))
    s.paste(pm, (0, 0)); s.paste(sm, (mouth[2], 0))
    s.resize((s.width * 2, s.height * 2), Image.LANCZOS).save(OUT / "crops" / "mouth-plate-vs-smile-2x.png")
    blink = sorted(run.glob("blink-*.png"))
    log = json.loads((run / "log-blink.json").read_text())["blink"]
    labels = [f"{r.get('dtMs', 0):.0f} ms  ap {r['ap']:.2f}" for r in log][: len(blink)]
    strip(blink[:11], (250, 340, 450, 120), 1, labels).save(OUT / "10-blink-strip.png")
    strip([run / "blink-04.png"], (560, 340, 140, 110), 3).save(OUT / "crops" / "blink-closed-left-eye-3x.png")
    tb = [f"turnblink-{t}-closed" for t in ("m30", "m45", "m84", "p30", "p45", "p84")]
    strip([run / f"{t}.png" for t in tb], (228, 300, 520, 200), 1, [t.split("-")[1] for t in tb]).save(OUT / "11-turned-blink-closed.png")
    mouse = sorted(run.glob("mouse-22-*.png"))[::3]
    if mouse:
        strip(mouse, (0, 0, 700, 900), 1).resize((len(mouse) * 175, 229), Image.LANCZOS).save(OUT / "12-mouse-resting-22deg.png")
    if (run / "clip.webm").exists():
        shutil.copy(run / "clip.webm", OUT / "clip.webm")
    # contact sheet: rest + the eight yaws
    names = ["00-rest-post"] + [f"{i:02d}-yaw-{y}" for i, y in enumerate(YAWS, 1)]
    tiles = [Image.open(OUT / f"{n}.png").convert("RGB").crop((0, 0, 832, 1000)).resize((277, 333), Image.LANCZOS) for n in names]
    sheet = Image.new("RGB", (277 * 5, 333 * 2 + 20), (12, 10, 14))
    d = ImageDraw.Draw(sheet)
    for i, (n, t) in enumerate(zip(names, tiles)):
        x, y = (i % 5) * 277, (i // 5) * 343
        sheet.paste(t, (x, y + 10))
        d.text((x + 4, y), n, fill=(235, 225, 210))
    sheet.save(OUT / "sheet.png")
    shutil.copy(a.measure, OUT / "check.json")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
