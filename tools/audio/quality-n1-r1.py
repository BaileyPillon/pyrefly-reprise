"""Put an N1 (ACE-Step 1.5) take through remaster R1 exactly as the shipped score was, with a lossless
output (music-model-test, 2026-09-30). Game case: BOTH (shared audio plumbing).

  python tools/audio/quality-n1-r1.py --in TAKE.flac --out TAKE-R1.wav [--json REPORT.json]

R1 = tools/audio/remaster.py preset "focus" (phase repair, image, tone, -16 LUFS, <= -1 dBTP), the
chain remaster-ship.py ran on every shipped cue (D-283). A 45 s sketch has no loop, so the one-shot
path is used (the last second fades). The final encode is swapped for float WAV with
r1-encode.py's make_pipe('wav'), so tools/audio/quality-sketch.py can then cut the V0 sketch from a
lossless master, the same way the O1-O3 sketches were cut.
"""

import argparse
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import remaster  # noqa: E402

_spec = importlib.util.spec_from_file_location('r1_encode', os.path.join(HERE, 'r1-encode.py'))
r1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(r1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='src', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--json')
    a = ap.parse_args()
    fd, tmp = tempfile.mkstemp(suffix='.wav', dir=os.path.dirname(os.path.abspath(a.out)))
    os.close(fd)
    orig = remaster.ff_pipe
    try:
        subprocess.run([remaster.FF, '-v', 'error', '-y', '-i', a.src, '-af', 'aresample=resampler=soxr:precision=28',
                        '-ar', str(remaster.SR), '-ac', '2', '-c:a', 'pcm_f32le', tmp], check=True)
        remaster.ff_pipe = r1.make_pipe('wav')
        rep = remaster.process(tmp, a.out, 'focus', None)
    finally:
        remaster.ff_pipe = orig
        os.remove(tmp)
    rep['source'] = a.src
    if a.json:
        with open(a.json, 'w', encoding='utf-8') as fh:
            json.dump(rep, fh, indent=1)


if __name__ == '__main__':
    main()
