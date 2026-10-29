"""clips.py : the motion clips of a party rig, from the recorder's REAL-battle frames: A the painting set the game draws today (rig off) | B the rig (rig on), each panel following its own figure, 60 fps mp4.

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/party/clips.py --label tidus --on <rec>/motion --off <rec>/motion-off [--vic-on <rec>/motion --vic-off <rec>/motion-off] [--hurt-on <rec>/hurtko --hurt-off <rec>/hurtko-off] --out <dir> [--only idle,attack,...] [--win idle=a:b,hurt=a:b] [--size 800,860]

Segments (from `motion/timeline.json` marks, `play-motion.mjs`): idle (idle-start to idle-end), attack / item / cast (its menu opening to the end of the action), victory (the pose and 200 frames on); from the `hurtko` window-log:
hurt (60 frames before the first hit that lands to 110 after) and ko (90 before the KO beat to 150 after). Each recording is cut on ITS OWN marks, so a difference in timing between the two shows. A panel is centred on the actor's
projected rectangle (`timeline.json` rects; for hurtko, the tracker's projected centroid), smoothed.
"""
from __future__ import annotations

import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from PIL import Image, ImageDraw  # noqa: E402

import lane_sheets as L  # noqa: E402

a = sys.argv[1:]


def opt(n, d=None):
    return a[a.index(n) + 1] if n in a else d


OUT = pathlib.Path(opt("--out"))
OUT.mkdir(parents=True, exist_ok=True)
LABEL = opt("--label", "subject")
SIZE = tuple(int(v) for v in opt("--size", "800,840").split(","))
CAP = 900 - SIZE[1]
CRF = opt("--crf", "18")
ZOOM = float(opt("--zoom", 1.8))  # the figure is about 130 x 190 px in a 1600 x 900 battle frame: crop a window 1/ZOOM of the panel and scale it up
ONLY = set(opt("--only", "").split(",")) - {""}
FONT = L.FONT


def font(sz):
    from PIL import ImageFont
    return ImageFont.truetype(FONT, sz) if pathlib.Path(FONT).exists() else ImageFont.load_default()


def frame_path(frames: pathlib.Path, n: int) -> pathlib.Path | None:
    for pat in (f"f{n:04d}.jpg", f"f{n:05d}.jpg"):
        p = frames / pat
        if p.exists():
            return p
    return None


def centre_track(rec: pathlib.Path) -> dict:
    """{frame: (cx, cy)} of the actor on screen: the motion run's rects, else the tracker's projected centroid."""
    tl = rec / "timeline.json"
    if tl.exists():
        rects = json.loads(tl.read_text())["rects"]
        return {r["n"]: (r["x"] + r["w"] / 2, r["y"] + r["h"] / 2) for r in rects}
    tj = rec / "tracks.json"
    out = {}
    if tj.exists():
        for r in json.loads(tj.read_text())["records"]:
            p = r.get("centroid") or r.get("root")
            if not p:
                continue
            V, P = r["V"], r["P"]
            m = lambda M, x, y, z, w: [M[0] * x + M[4] * y + M[8] * z + M[12] * w, M[1] * x + M[5] * y + M[9] * z + M[13] * w, M[2] * x + M[6] * y + M[10] * z + M[14] * w, M[3] * x + M[7] * y + M[11] * z + M[15] * w]  # noqa: E731
            e = m(V, p[0], p[1], p[2], 1)
            c = m(P, e[0], e[1], e[2], e[3])
            out[r["n"]] = ((c[0] / c[3] * 0.5 + 0.5) * 1600, (-c[1] / c[3] * 0.5 + 0.5) * 900)
    return out


def smooth_centre(track: dict, frames: list[int]) -> dict:
    keys = sorted(track)
    if not keys:
        return {n: (800, 450) for n in frames}
    out, prev = {}, None
    for n in frames:
        # nearest recorded frame
        k = min(keys, key=lambda q: abs(q - n)) if n < keys[0] or n > keys[-1] else max(q for q in keys if q <= n)
        c = track[k]
        prev = c if prev is None else (prev[0] + 0.25 * (c[0] - prev[0]), prev[1] + 0.25 * (c[1] - prev[1]))
        out[n] = prev
    return out


def crop_box(c):
    w, h = int(SIZE[0] / ZOOM), int(SIZE[1] / ZOOM)
    x0 = int(max(0, min(1600 - w, c[0] - w / 2)))
    y0 = int(max(0, min(900 - h, c[1] - h / 2)))
    return (x0, y0, x0 + w, y0 + h)


def encode(panels_by_frame, titles, dest, header, marks=None):
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="clips-"))
    n = len(titles)
    W = SIZE[0] * n + 8 * (n - 1)
    W += W % 2
    f1, f2 = font(22), font(17)
    for i, panels in enumerate(panels_by_frame):
        t = Image.new("RGB", (W, 900), L.BAR)
        d = ImageDraw.Draw(t)
        d.text((10, 8), header, font=f1, fill=L.GOLD)
        for j, p in enumerate(panels):
            t.paste(p, (j * (SIZE[0] + 8), CAP))
            d.text((j * (SIZE[0] + 8) + 10, CAP + 8), titles[j], font=f2, fill=(255, 235, 120))
        if marks and i in marks:
            d.text((10, 38), marks[i], font=f2, fill=(255, 120, 120))
        t.save(tmp / f"a{i:04d}.png")
    subprocess.run([L.FFMPEG, "-y", "-loglevel", "error", "-framerate", "60", "-i", str(tmp / "a%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", CRF, str(dest)], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print("wrote", dest, f"{len(panels_by_frame)} frames, {W}x900", flush=True)


def window(marks: list[dict], start: str, end: str, before=0, after=0):
    s = next((m["n"] for m in marks if m["name"] == start), None)
    e = next((m["n"] for m in marks if m["name"] == end), None)
    return None if s is None or e is None else (max(0, s - before), e + after)


WIN = {k: tuple(int(x) for x in v.split(":")) for k, v in (e.split("=") for e in opt("--win", "").split(",") if "=" in e)}  # --win idle=283:520,hurt=400:560 : frame windows by hand for clips (the two runs of one script have the same frame numbers)


def cut(name, recs, windows, header):
    """recs: [(title, frames dir, centre track)], windows: one (n0, n1) per rec."""
    if ONLY and name not in ONLY:
        return
    if name in WIN and name != "victory":
        windows = [WIN[name], WIN[name]]
    if any(w is None for w in windows):
        print(f"skip {name}: a mark is missing")
        return
    n = min(w[1] - w[0] for w in windows)
    cents = [smooth_centre(c, list(range(w[0], w[0] + n))) for (t, f, c), w in zip(recs, windows)]
    out = []
    for i in range(n):
        row = []
        for (t, f, c), w, cs in zip(recs, windows, cents):
            fr = w[0] + i
            p = frame_path(f, fr) or frame_path(f, max(0, fr - 1))
            if p is None:
                ex = sorted(f.glob("f*.jpg"))
                p = min(ex, key=lambda q: abs(int(q.stem[1:]) - fr))
            row.append(Image.open(p).crop(crop_box(cs[fr])).resize(SIZE, Image.LANCZOS))
        out.append(row)
    encode(out, [t for t, f, c in recs], OUT / f"{LABEL}-{name}.mp4", header)


def main():
    titles = ("A  the painting set the game draws today (rig off)", "B  the new rig")
    on, off = pathlib.Path(opt("--on")), pathlib.Path(opt("--off"))
    tl = {k: json.loads((r / "timeline.json").read_text()) for k, r in (("on", on), ("off", off))}
    recs = [(titles[0], off / "frames", centre_track(off)), (titles[1], on / "frames", centre_track(on))]
    m = lambda k: tl[k]["marks"]  # noqa: E731
    both = lambda s, e, b=0, af=0: [window(m("off"), s, e, b, af), window(m("on"), s, e, b, af)]  # noqa: E731
    H = f"{LABEL.upper()}  "
    iw = both("idle-start", "idle-end")
    if any(x is None for x in iw):  # the actor had the first menu: its idle is the stretch after its first action, while the others take their turns (up to 6 s, ending before its next menu opens)
        def fallback(k):
            e = next((x["n"] for x in m(k) if x["name"].endswith("-end")), None)
            nxt = next((x["n"] for x in m(k) if x["name"].endswith("-menu") and e is not None and x["n"] > e), None)
            return None if e is None else (e + 20, min(e + 20 + 360, (nxt - 20) if nxt else e + 380))
        iw = [fallback("off"), fallback("on")]
    cut("idle", recs, iw, H + "IDLE (breathing and sway as the game runs them), 60 fps")
    for turn in ("attack", "item", "cast"):
        cut(turn, recs, both(f"{turn}-menu", f"{turn}-end", 15, 0), H + f"{turn.upper()} from the menu, the real battle, 60 fps")
    # the victory: from the full run's marks, or (--vic-on <rec dir>) from a victory-only run of the rig (MOTION_TURNS=none) when the full run's victory did not land
    w = [None, None]
    for i, k in enumerate(("off", "on")):
        v = next((x["n"] for x in m(k) if x["name"] == "victory-pose"), None)
        w[i] = None if v is None else (v - 90, v + 220)
    vrec = list(recs)
    for idx, flag in ((0, "--vic-off"), (1, "--vic-on")):
        if opt(flag):
            vr = pathlib.Path(opt(flag))
            vt = json.loads((vr / "timeline.json").read_text())["marks"]
            v = next((x["n"] for x in vt if x["name"] == "victory-pose"), None)
            vrec[idx] = (titles[idx], vr / "frames", centre_track(vr))
            w[idx] = None if v is None else (v - 90, v + 220)
    cut("victory", vrec, w, H + "VICTORY (the last blow, then the pose), the real battle, 60 fps")
    if "hurt-run" in WIN:
        cut("hurt-run", recs, [WIN["hurt-run"], WIN["hurt-run"]], H + "HIT TAKEN (from the motion run: the enemy's own attack), the real battle, 60 fps")
    if opt("--hurt-on") and opt("--hurt-off"):
        hon, hoff = pathlib.Path(opt("--hurt-on")), pathlib.Path(opt("--hurt-off"))
        hr = [(titles[0], hoff / "frames", centre_track(hoff)), (titles[1], hon / "frames", centre_track(hon))]
        wl = [json.loads((r / "window-log.json").read_text()) for r in (hoff, hon)]
        cut("hurt", hr, [(x["marks"]["firstHurtLogged"] - 60, x["marks"]["firstHurtLogged"] + 110) if x["marks"]["firstHurtLogged"] >= 0 else None for x in wl], H + "HIT TAKEN, the real battle, 60 fps")
        cut("ko", hr, [(x["marks"]["koSeenAt"] - 90, x["marks"]["koSeenAt"] + 150) if x["marks"]["koSeenAt"] >= 0 else None for x in wl], H + "KNOCKED OUT, the real battle, 60 fps")


main()
