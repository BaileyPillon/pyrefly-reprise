"""change_clips.py : ONE CLIP PER KEY CHANGE of a party rig, painting set beside rig, from two recordings of the SAME script (rigs-v2, 2026-10-29; both games, shared plumbing; no browser here: it reads frames the recorder kept).

    D:/Tools/ComfyUI/python_embeded/python.exe -I tools/rig/lane/party/change_clips.py --label tidus --on <rig rec>/motion --off <painting rec>/motion --out <dir> \
        [--changes idle>ready,ready>attack,attack>follow,follow>idle,...] [--before 24] [--after 48] [--zoom 2.2] [--still-frames 6] [--crf 26]

`--on` is the recording with the rig (`PYREFLY_LANE_QUERY` empty, the subject's own `partyrigs=v2`), `--off` the same script with `PYREFLY_LANE_QUERY=partyrigs=off` (the painting set, the boss's own rig still on): both are `play-motion.mjs` runs, which write
`frames/f<n>.jpg`, `timeline.json` (`marks`, with a `pose` mark at every change of the actor's pose, sampled every 2nd frame (`MOTION_POSE_EVERY`, default 2; it was every 10th, which lost a key held under 10 frames: `ready` and `attack`), and `rects`, the actor's projected rectangle) and are deterministic under the seed, so frame n is the same moment
in both. A change `a>b` is the first time the RIG run's pose marks go from a to b; the clip is the window [mark - before, mark + after] of both runs, each panel following its own figure.

Writes, per change, `<label>-<a>-to-<b>.mp4` (60 fps, two panels side by side, 1080 px wide: it plays on a phone), `<label>-<a>-to-<b>.png` (a still: `--still-frames` frames of the window, painting row over rig row, at the clip's scale) and
`<label>-changes.json` (the index: the pair, the mark frame, the window, the files; changes the run never made are listed under `missing`). Nothing here decides anything: it is the picture the person judges from.
"""
from __future__ import annotations

import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

import lane_sheets as L  # noqa: E402


def parse(argv: list[str]) -> dict:
    o: dict = {}
    i = 0
    while i < len(argv):
        if argv[i].startswith("--"):
            o[argv[i][2:]] = argv[i + 1]
            i += 2
        else:
            i += 1
    return o


def pose_changes(marks: list[dict]) -> list[tuple[int, str, str]]:
    """(frame, from, to) for every change of the actor's pose the run's `pose` marks show, in order."""
    out, prev = [], None
    for m in marks:
        if m.get("name") != "pose":
            continue
        if prev is not None and m["pose"] != prev:
            out.append((m["n"], prev, m["pose"]))
        prev = m["pose"]
    return out


def first_of(changes: list[tuple[int, str, str]], want: list[str]) -> tuple[dict, list[str]]:
    """The first occurrence of each wanted `a>b` (all changes in order of first occurrence when `want` is empty)."""
    seen: dict[str, tuple[int, str, str]] = {}
    for c in changes:
        seen.setdefault(f"{c[1]}>{c[2]}", c)
    if not want:
        return seen, []
    return {k: seen[k] for k in want if k in seen}, [k for k in want if k not in seen]


def centre_track(rec: pathlib.Path) -> dict:
    rects = json.loads((rec / "timeline.json").read_text())["rects"]
    return {r["n"]: (r["x"] + r["w"] / 2, r["y"] + r["h"] / 2) for r in rects}


def smoothed(track: dict, frames: list[int]) -> dict:
    keys = sorted(track)
    if not keys:
        return {n: (800.0, 450.0) for n in frames}
    out, prev = {}, None
    for n in frames:
        k = keys[0] if n <= keys[0] else max(q for q in keys if q <= n)
        c = track[k]
        prev = c if prev is None else (prev[0] + 0.25 * (c[0] - prev[0]), prev[1] + 0.25 * (c[1] - prev[1]))
        out[n] = prev
    return out


def frame_file(frames: pathlib.Path, n: int) -> pathlib.Path:
    for k in (n, n - 1, n + 1, n - 2, n + 2):
        for pat in (f"f{k:04d}.jpg", f"f{k:05d}.jpg"):
            if (frames / pat).exists():
                return frames / pat
    have = sorted(frames.glob("f*.jpg"))
    return min(have, key=lambda q: abs(int(q.stem[1:]) - n))


def main() -> int:
    o = parse(sys.argv[1:])
    label, on, off, out = o.get("label", "subject"), pathlib.Path(o["on"]), pathlib.Path(o["off"]), pathlib.Path(o["out"])
    before, after = int(o.get("before", 24)), int(o.get("after", 48))
    zoom = float(o.get("zoom", 2.2))
    nstill = int(o.get("still-frames", 6))
    crf = o.get("crf", "26")
    want = [w for w in o.get("changes", "").split(",") if w]
    out.mkdir(parents=True, exist_ok=True)
    panel_w, panel_h = 536, 600  # two panels and a gutter: 1080 px wide
    tl_on = json.loads((on / "timeline.json").read_text())
    changes, missing = first_of(pose_changes(tl_on["marks"]), want)
    cen = {"on": centre_track(on), "off": centre_track(off)}
    f1, f2 = (ImageFont.truetype(L.FONT, 22), ImageFont.truetype(L.FONT, 17)) if pathlib.Path(L.FONT).exists() else (ImageFont.load_default(), ImageFont.load_default())
    index = {"label": label, "on": str(on), "off": str(off), "before": before, "after": after, "changes": [], "missing": missing}
    for pair, (n, a, b) in changes.items():
        n0, n1 = max(0, n - before), n + after
        frames = list(range(n0, n1))
        cs = {k: smoothed(cen[k], frames) for k in cen}
        w, h = int(panel_w / zoom), int(panel_h / zoom)
        tmp = pathlib.Path(tempfile.mkdtemp(prefix="chg-"))
        stills = []
        for i, fr in enumerate(frames):
            canvas = Image.new("RGB", (1080, panel_h + 56), L.BAR)
            d = ImageDraw.Draw(canvas)
            d.text((10, 6), f"{label.upper()}  {a} > {b}   frame {fr} (change near {n})   60 fps", font=f1, fill=L.GOLD)
            for j, (k, rec, title) in enumerate((("off", off, "A  painting set (partyrigs=off)"), ("on", on, "B  rig (partyrigs=v2)"))):
                cx, cy = cs[k][fr]
                x0, y0 = int(max(0, min(1600 - w, cx - w / 2))), int(max(0, min(900 - h, cy - h / 2)))
                im = Image.open(frame_file(rec / "frames", fr)).crop((x0, y0, x0 + w, y0 + h)).resize((panel_w, panel_h), Image.LANCZOS)
                canvas.paste(im, (j * (panel_w + 8), 56))
                d.text((j * (panel_w + 8) + 8, 34), title, font=f2, fill=(255, 235, 120))
            canvas.save(tmp / f"a{i:04d}.png")
            if i in {round(k * (len(frames) - 1) / (nstill - 1)) for k in range(nstill)}:
                stills.append((fr, canvas))
        name = f"{label}-{a}-to-{b}"
        subprocess.run([L.FFMPEG, "-y", "-loglevel", "error", "-framerate", "60", "-i", str(tmp / "a%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", crf, str(out / f"{name}.mp4")], check=True)
        shutil.rmtree(tmp, ignore_errors=True)
        sw, sh = stills[0][1].size[0] // 2, stills[0][1].size[1]
        strip = Image.new("RGB", (sw * len(stills), sh * 2), L.BAR)
        sd = ImageDraw.Draw(strip)
        for k, (fr, s) in enumerate(stills):
            strip.paste(s.crop((0, 56, panel_w, sh)).resize((sw, sh - 56)), (k * sw, 0))  # painting panel
            strip.paste(s.crop((panel_w + 8, 56, 2 * panel_w + 8, sh)).resize((sw, sh - 56)), (k * sw, sh))  # rig panel
            sd.text((k * sw + 6, 4), f"painting set  f{fr}", font=f2, fill=(255, 235, 120))
            sd.text((k * sw + 6, sh + 4), f"rig  f{fr}", font=f2, fill=(255, 235, 120))
        strip.save(out / f"{name}.png")
        index["changes"].append({"pair": pair, "markFrame": n, "window": [n0, n1], "mp4": f"{name}.mp4", "still": f"{name}.png"})
        print("wrote", out / f"{name}.mp4", flush=True)
    (out / f"{label}-changes.json").write_text(json.dumps(index, indent=1), encoding="utf8")
    if missing:
        print(f"MISSING {', '.join(missing)}: the rig run never showed those pose changes at its sampling rate; a recording made before MOTION_POSE_EVERY (every 10th frame) can lose a key held under 10 frames: record again with MOTION_POSE_EVERY=1, or cut the window by hand with clips.py --win", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
