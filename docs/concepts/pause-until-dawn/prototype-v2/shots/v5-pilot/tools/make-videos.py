"""Living portrait v5 pilot (game case: both): the two MP4s from pilot-shots.mjs recordings.

  pilot.mp4    the pilot clip from the moment the legend is hidden (H.264, yuv420p, faststart, 25 fps)
  compare.mp4  v4.1 as committed | the pilot, the same turn (0 -> +20 -> -20 -> 0) recorded at half speed
               (debugTimeScale 0.5, the input glides twice as long), side by side, labelled

    python make-videos.py <shots dir> <out dir>
"""
import json
import pathlib
import subprocess
import sys

FFMPEG = "ffmpeg"
FONT = "C\\:/Windows/Fonts/segoeuib.ttf"


def lead(shots, name):
    return json.loads((shots / f"{name}.json").read_text())["leadMs"] / 1000.0


def dur(shots, name):
    j = json.loads((shots / f"{name}.json").read_text())
    return j["beats"][-1]["ms"] / 1000.0


def run(args):
    print(" ".join(str(a) for a in args))
    subprocess.run([FFMPEG, "-v", "error", "-y", *map(str, args)], check=True)


def main():
    shots, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    # -threads 2: x264 at 1440 wide failed a malloc with the machine's commit limit near full (C: had 0 bytes free)
    enc = ["-threads", "2", "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", "25"]
    ss = max(0.0, lead(shots, "clip-pilot") - 0.2)
    run(["-ss", f"{ss:.2f}", "-t", f"{dur(shots, 'clip-pilot') + 0.4:.2f}", "-i", shots / "clip-pilot.webm", *enc, out / "pilot.mp4"])
    la, lb = lead(shots, "half-v41"), lead(shots, "half-pilot")
    t = min(dur(shots, "half-v41"), dur(shots, "half-pilot")) + 0.3
    label = lambda txt, y: f"drawtext=fontfile='{FONT}':text='{txt}':x=(w-text_w)/2:y={y}:fontsize=30:fontcolor=0xE9DCB8:box=1:boxcolor=0x0A0806@0.8:boxborderw=12"
    fc = (f"[0:v]trim=start={la:.3f}:duration={t:.3f},setpts=PTS-STARTPTS,{label('v4.1 (committed)  -  0.2 s dissolve at each swap', 40)}[a];"
          f"[1:v]trim=start={lb:.3f}:duration={t:.3f},setpts=PTS-STARTPTS,{label('v5 pilot  -  keys grown from the plate, hard cut', 40)}[b];"
          f"[a][b]hstack=inputs=2,{label('the same turn 0 to +20 to -20 to 0, half speed', 1130)}[v]")
    # crf 27 keeps the 28 s side-by-side under the 8 MB cap at full resolution (crf 21 gave 14.8 MB)
    enc_cmp = [("27" if a == "21" else a) for a in enc]
    run(["-i", shots / "half-v41.webm", "-i", shots / "half-pilot.webm", "-filter_complex", fc, "-map", "[v]", *enc_cmp, out / "compare.mp4"])


if __name__ == "__main__":
    main()
