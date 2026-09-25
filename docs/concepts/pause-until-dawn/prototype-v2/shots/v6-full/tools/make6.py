"""Living portrait v6 full (both): the two MP4s and the sheet.

  clip.mp4     the full turn (shots6.mjs clip): 720 x 1200 page frames, 60 fps, H.264 High yuv420p faststart
  compare.mp4  v5.1 | v6 full, the same input turn (0 -> +40 -> -40 -> 0, a blink at each end) at half speed: the v5.1
               panel is v5.1's own compare.mp4 panel (its real-time recording), v6 is rendered at 50 fps and encoded at
               25 (half speed); both 540 x 900, labelled
  sheet.jpg    the numbers, the turn every 10 degrees with an expression held, 1:1 crops across four cuts, clip moments
               at 1:1, the throat before / after Fix 1, Fix 2, the far-side hair at +-40 (hair6.py)

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY make6.py clip|compare|sheet
"""
import json
import os
import pathlib
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
V51 = OUT.parent / "v51" / "compare.mp4"
CAP = pathlib.Path(os.environ.get("LP6_CAP", "D:/Tools/pyrefly-scratch/picks0925/portrait-a2/cap"))
RIG = json.loads(pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v51/proto/art/rig.json").read_text(encoding="utf-8"))
C_ORDER = RIG["artMeta"]["commonLandmarkOrder"]
FFMPEG = "D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe"
FONT = "C\\:/Windows/Fonts/segoeuib.ttf"
ENC = ["-threads", "2", "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]


def ff(args):
    print(" ".join(map(str, args[:12])), "...")
    subprocess.run([FFMPEG, "-v", "error", "-y", *map(str, args)], check=True)


def label(txt, y, size=24):
    return (f"drawtext=fontfile='{FONT}':text='{txt}':x=(w-text_w)/2:y={y}:fontsize={size}:fontcolor=0xE9DCB8:"
            f"box=1:boxcolor=0x0A0806@0.8:boxborderw=8")


def clip():
    ff(["-framerate", 60, "-i", CAP / "frames-clip" / "%05d.png", *ENC, "-crf", 20, "-r", 60, OUT / "clip.mp4"])


def compare():
    n = len(list((CAP / "frames-half").glob("*.png")))
    v6_len = n / 25.0
    probe = subprocess.run([FFMPEG.replace("ffmpeg.exe", "ffprobe.exe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(V51)],
                           capture_output=True, text=True, check=True)
    v51_len = float(probe.stdout.strip())
    t = max(v6_len, v51_len)
    fc = (f"[0:v]crop=540:850:1080:0,pad=540:900:0:0:color=0x0A0806,tpad=stop_mode=clone:stop_duration={t - v51_len + 0.1:.2f},"
          f"{label('v5.1 (its own half-speed recording)', 858, 22)}[a];"
          f"[1:v]scale=540:900:flags=area,tpad=stop_mode=clone:stop_duration={t - v6_len + 0.1:.2f},"
          f"{label('v6 full - feel A2 on every key', 24)},{label('the same input turn, half speed', 858, 22)}[b];"
          f"[a][b]hstack=inputs=2,trim=duration={t:.2f}[v]")
    ff(["-i", V51, "-framerate", 25, "-i", CAP / "frames-half" / "%05d.png", "-filter_complex", fc, "-map", "[v]", *ENC, "-crf", 24, "-r", 25, OUT / "compare.mp4"])


# ---------------------------------------------------------------------------------------------------- sheet
def font(sz, bold=False):
    return ImageFont.truetype("C:/Windows/Fonts/" + ("segoeuib.ttf" if bold else "segoeui.ttf"), sz)


def rgb(p, box=None):
    im = Image.open(p).convert("RGB")
    return im.crop(box) if box else im


def row(title, tiles, captions, W):
    """A titled row of tiles (PIL images) with captions under each, wrapped onto more rows when wider than W."""
    pad = 10
    if sum(t.width + pad for t in tiles) + pad > W:
        n, x = 0, pad
        while n < len(tiles) and x + tiles[n].width + pad <= W:
            x += tiles[n].width + pad
            n += 1
        n = max(1, n)
        a, b = row(title, tiles[:n], captions[:n], W), row("", tiles[n:], captions[n:], W)
        out = Image.new("RGB", (W, a.height + b.height), (10, 8, 6))
        out.paste(a, (0, 0))
        out.paste(b, (0, a.height))
        return out
    h = max(t.height for t in tiles)
    out = Image.new("RGB", (W, 40 + h + 34), (10, 8, 6))
    d = ImageDraw.Draw(out)
    d.text((pad, 8), title, fill=(242, 193, 78), font=font(22, True))
    x = pad
    for t, c in zip(tiles, captions):
        out.paste(t, (x, 40))
        d.text((x + 2, 40 + h + 4), c, fill=(233, 220, 184), font=font(16))
        x += t.width + pad
    return out


def sheet():
    m = json.loads((CAP / "measure6.json").read_text())
    W = 2000
    blocks = []
    # 1. the numbers
    lines = NUMBERS_TEXT(m)
    txt = Image.new("RGB", (W, 52 + 24 * len(lines)), (10, 8, 6))
    d = ImageDraw.Draw(txt)
    d.text((10, 6), "Living portrait v6 full: feel A2 on every turn key (-40..+40), Yuna X-2 plate. Game case: both.", fill=(242, 193, 78), font=font(24, True))
    for i, ln in enumerate(lines):
        d.text((10, 40 + 24 * i), ln, fill=(233, 220, 184), font=font(18))
    blocks.append(txt)
    # 2. the turn every 10 degrees, expression held (sweep, canvas 1:1, face crops)
    log = json.loads((CAP / "sweep" / "log.json").read_text())
    lm = {k["yawDeg"]: dict(zip(C_ORDER, k["landmarks"])) for k in RIG["keys"]}

    def face_box(r, top=330, bottom=720, pad=55):
        k = next(k for k in RIG["keys"] if k["id"] == r["paint"]["to"])["yawDeg"]
        L = lm[k]
        x0 = min(L["pupil_R"][0], L["eyeOuter_R"][0]) - pad + (r["yaw"] - k) * 3.7
        x1 = max(L["pupil_L"][0], L["eyeOuter_L"][0]) + pad + (r["yaw"] - k) * 3.7
        return (int(x0), top, int(x1), bottom)

    for part in ((-40, -30, -20, -10, 0, 10, 20, 30, 40),):
        tiles, caps = [], []
        for y in part:
            r = next(r for r in log if r["dir"] == "up" and r["target"] == y)
            tiles.append(rgb(CAP / "sweep" / r["file"], face_box(r)))
            caps.append(f"{y:+d}  {r['paint']['to']}")
        blocks.append(row("The turn every 10 degrees, one expression held on every key (smile 0.7, open 0.6, lids 0.55, gaze +6/+2 px, brow 0.5); canvas 1:1, ?post=0" if part[0] < 0 else "", tiles, caps, W))
    # 3. across cuts: the frame before and after the painting changes, 1:1 eyes + mouth
    for pairs in (((-34, -33), (-4, -3), (6, 7), (36, 37)),):
        tiles, caps = [], []
        for a, b in pairs:
            for y in (a, b):
                r = next(r for r in log if r["dir"] == "up" and r["target"] == y)
                tiles.append(rgb(CAP / "sweep" / r["file"], face_box(r, 350, 700, 30)))
                caps.append(f"{y:+d} {r['paint']['to']}")
        blocks.append(row("Across four cuts (up sweep): the last frame of one painting and the first of the next, 1:1" if pairs[0][0] < 0 else "", tiles, caps, W))
    # 4. clip moments at 1:1 (page)
    w = json.loads((CAP / "faces-clip" / "weights.json").read_text())
    tiles, caps = [], []
    for i, what in ((36, "smile swell, 0"), (100, "glance: eyes lead"), (104, "head follows"), (280, "blink at -40"), (345, "glance at -40"),
                    (478, "blink mid-sweep"), (590, "smile at +40"), (658, "big step: eyes lead"), (668, "head arrives")):
        cx = int(393 + 2.39 * w[i]["yaw"])  # the face's centre on the page (landmarks: canvas x 470 + 3.9 / degree)
        tiles.append(rgb(CAP / "frames-clip" / f"{i:05d}.png", (cx - 100, 425, cx + 100, 665)))
        caps.append(f"{i} {what}")
    blocks.append(row("clip.mp4 at 1:1 (page scale): blinks, the eye lead, the smile, through the turn", tiles, caps, W))
    # 5. throat before / after (3x), far-side hair at +-40 after Fix 2 (1:1)
    # before: the same capture with the v5.1 neck (peek-throat.png, frame 280, 2x); after: this build's frame 280
    before = Image.open(CAP / "peek-throat.png").convert("RGB").crop((500, 0, 1000, 220))
    after = rgb(CAP / "frames-clip" / "00280.png", (250, 680, 500, 790)).resize((500, 220), Image.NEAREST)
    blocks.append(row("Fix 1, the throat line, frame 280 (-40) at 2x: the v5.1 neck (left) and the overlap (right)", [before, after],
                      [f"before: {m['throat']['throat-before']['framesFlagged']} of 900 frames flagged", f"after: {m['throat']['throat-after']['framesFlagged']} of 900"], W))
    tiles = [rgb(CAP / "sweep" / "up" / "ym40.png", (560, 200, 832, 660)), rgb(CAP / "sweep-v51" / "up" / "ym40.png", (560, 200, 832, 660)),
             rgb(CAP / "sweep" / "down" / "yp40.png", (40, 380, 420, 780)), rgb(CAP / "sweep-v51" / "down" / "yp40.png", (40, 380, 420, 780))]
    blocks.append(row("Fix 2, the far-side hair at -40 (image right: from the plate in one resample, the row step gone) and +40 (image left: "
                      "no teal smear, the footprint column re-stranded), v6 against v5.1", tiles,
                      ["v6 -40", "v5.1 -40", "v6 +40", "v5.1 +40"], W))
    H = sum(b.height for b in blocks)
    out = Image.new("RGB", (W, H), (10, 8, 6))
    y = 0
    for b in blocks:
        out.paste(b, (0, y))
        y += b.height
    out.save(OUT / "sheet.jpg", quality=88)
    print("sheet", out.size, os.path.getsize(OUT / "sheet.jpg"))


def NUMBERS_TEXT(m):
    wc = m["weights"]["clip"]
    cl = m["cuts"]["clip"]
    sw = m["sweeps"]
    s_up = sw["sweep"]["up"]["S"] + sw["sweep"]["down"]["S"]
    sf = sw["sweep"]["up"]["Sface"] + sw["sweep"]["down"]["Sface"]
    ok = [c for c in cl["cuts"] if isinstance(c.get("eyes"), dict) and not c["motionOnset"]]
    eyes_cut = [c["eyes"]["S"] for c in ok]
    mouth_cut = [c["mouth"]["S"] for c in ok]
    n_blink = sum(1 for c in cl["cuts"] if c.get("eyes") == "blink at the cut")
    n_onset = sum(1 for c in cl["cuts"] if c.get("eyes") != "blink at the cut" and not isinstance(c.get("eyes"), dict))
    th = m["throat"]
    return [
        f"Frames with two paintings: clip {cl['framesWithTwoPaintings']} of {cl['frames']}, compare {m['cuts']['half']['framesWithTwoPaintings']} of {m['cuts']['half']['frames']}, sweeps 0 of 162 each. Every face pixel comes from the plate's one painting, pushed by the key's own map.",
        f"Cuts with an expression held (1-degree sweep, 16 cuts): head S {min(s_up):.2f}-{max(s_up):.2f}, face S {min(sf):.2f}-{max(sf):.2f} (gate 1.5); largest non-cut S {max(sw['sweep']['up']['maxNonCutS'], sw['sweep']['down']['maxNonCutS']):.2f}.",
        f"Cuts in clip.mp4 ({len(cl['cuts'])}): eyes-box step over its neighbours {min(eyes_cut):.2f}-{max(eyes_cut):.2f}, mouth box {min(mouth_cut):.2f}-{max(mouth_cut):.2f} (landmark-tracked boxes); {n_blink} cuts fall in a blink, {n_onset} on the first frames of the big step (no neighbour moving alike; looked at 1:1).",
        f"Weights per frame (clip): open {wc['open']}, smile {wc['smile']}, press {wc['press']}, brow raise {wc['browRaise']}, brow draw {wc['browDraw']} (never driven: no worried brow); lids outside blinks {wc['lidOutsideBlinks']}.",
        f"Gaze: x {wc['gazeRangeX'][0]} to {wc['gazeRangeX'][1]} px, y {wc['gazeRangeY'][0]} to {wc['gazeRangeY'][1]} px; lead over the settled eye up to {wc['leadPeakPx']} px; fastest idle step {wc['idleGazeFastestPxPerS']} px/s (limit 133).",
        f"Throat line (thin-line detector, page scale): before Fix 1 {th['throat-before']['framesFlagged']} of {th['throat-before']['frames']} frames, after {th['throat-after']['framesFlagged']} of {th['throat-after']['frames']}.",
        "Rest: v6 (the frontal as one back + front) against v5.1 at rest, ?post=0: max 1 level (52 px of 1 011 712).",
    ]


if __name__ == "__main__":
    {"clip": clip, "compare": compare, "sheet": sheet}[sys.argv[1]]()
