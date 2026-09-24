"""Living portrait v5.1 (game case: both): the two MP4s from shots.mjs recordings (after the pilot's make-videos.py).

  clip.mp4     the v5.1 clip from the moment the legend is hidden (H.264, yuv420p, faststart, 25 fps)
  compare.mp4  v4.1 as committed | the v5 pilot | v5.1, the same input turn (0 -> +40 -> -40 -> 0, a blink at each
               end) recorded at half speed (debugTimeScale 0.5, the input glides twice as long), side by side,
               labelled; the pilot's rig stops at its own +-20

    python make_videos.py <shots dir> <out dir>
"""
import json
import pathlib
import subprocess
import sys

FFMPEG = "ffmpeg"
FONT = "C\\:/Windows/Fonts/segoeuib.ttf"


def meta(shots, name):
    return json.loads((shots / f"{name}.json").read_text())


def run(args):
    print(" ".join(str(a) for a in args))
    subprocess.run([FFMPEG, "-v", "error", "-y", *map(str, args)], check=True)


def label(txt, y, size=26):
    return (f"drawtext=fontfile='{FONT}':text='{txt}':x=(w-text_w)/2:y={y}:fontsize={size}:fontcolor=0xE9DCB8:"
            f"box=1:boxcolor=0x0A0806@0.8:boxborderw=10")


def main():
    shots, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    # -threads 2: x264 failed a malloc on this machine with C: full (the pilot); scratch is on D: now
    enc = ["-threads", "2", "-c:v", "libx264", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", "25"]
    c = meta(shots, "clip-v51")
    ss = max(0.0, c["leadMs"] / 1000.0 - 0.2)
    run(["-ss", f"{ss:.2f}", "-t", f"{c['beats'][-1]['ms'] / 1000.0 + 0.4:.2f}", "-i", shots / "clip-v51.webm", *enc, "-crf", "21", out / "clip.mp4"])
    names = ["half-v41", "half-pilot", "half-v51"]
    ms = [meta(shots, n) for n in names]
    t = min(m["beats"][-1]["ms"] for m in ms) / 1000.0 + 0.3
    texts = ["v4.1 committed - 0.2 s dissolves", "v5 pilot - grown keys, +-20 only", "v5.1 - grown keys to +-40, blinks"]
    parts = []
    for i, (m, txt) in enumerate(zip(ms, texts)):
        parts.append(f"[{i}:v]trim=start={m['leadMs'] / 1000.0:.3f}:duration={t:.3f},setpts=PTS-STARTPTS,scale=540:900,{label(txt, 24)}[p{i}]")
    fc = ";".join(parts) + f";[p0][p1][p2]hstack=inputs=3,{label('the same input turn 0 to +40 to -40 to 0, a blink at each end, half speed', 858, 24)}[v]"
    inputs = []
    for n in names:
        inputs += ["-i", shots / f"{n}.webm"]
    run([*inputs, "-filter_complex", fc, "-map", "[v]", *enc, "-crf", "25", out / "compare.mp4"])


if __name__ == "__main__":
    main()
