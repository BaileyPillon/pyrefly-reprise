"""Cut one audition sketch for the fb-0929 music-quality options (Bailey judges by ear; agents
cannot hear, AGENTS.md rule 13).

  python tools/audio/quality-sketch.py --in SRC --out OUT.mp3 --encode v0 [--window START_S DUR_S]
      [--no-level]

The window is cut from SRC (any format ffmpeg reads; lossless sources give a fair comparison),
faded in over 50 ms and out over the last 1 s, gained to -16 LUFS integrated under the same
4x-oversampled limiter as tools/audio/remaster.py (so every sketch plays at the same loudness), and
encoded: q5 (libmp3lame -q:a 5, what the game ships today), v0 (-q:a 0), mp3-320, opus160 or wav.
The printed JSON has LUFS and true peak measured on the encoded file (ffmpeg ebur128).
--no-level skips the gain and limiter (the source is already a finished -16 LUFS master).

Game case (AGENTS.md rule 14): shared audio plumbing, BOTH.
"""

import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import remaster as rm  # noqa: E402

ENC = {
    'q5': ['-codec:a', 'libmp3lame', '-q:a', '5', '-ar', '44100'],
    'v0': ['-codec:a', 'libmp3lame', '-q:a', '0', '-ar', '44100'],
    'mp3-320': ['-codec:a', 'libmp3lame', '-b:a', '320k', '-ar', '44100'],
    'opus160': ['-codec:a', 'libopus', '-b:a', '160k', '-vbr', 'on', '-compression_level', '10'],
    'wav': ['-codec:a', 'pcm_f32le', '-ar', '44100'],
}


def cut(src, window):
    x = rm.decode(src)
    if window:
        a = int(window[0] * rm.SR)
        x = x[a:a + int(window[1] * rm.SR)].copy()
    a, b = int(0.05 * rm.SR), int(1.0 * rm.SR)
    x[:a] *= np.linspace(0, 1, a)[:, None]
    x[-b:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b)))[:, None]
    return x


def encode(x, out, enc):
    rm.ff_pipe(x, None, ('-y', *ENC[enc], '-ac', '2', out))
    return rm.ebur(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='src', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--encode', choices=list(ENC), required=True)
    ap.add_argument('--window', nargs=2, type=float)
    ap.add_argument('--no-level', action='store_true')
    a = ap.parse_args()
    x = cut(a.src, a.window)
    gain, ceil = 0.0, -1.5
    if not a.no_level:
        gain = rm.LUFS - rm.ebur(x)[0]
    for _ in range(8):
        y = x if a.no_level else rm.limit(x, gain, ceil)
        lufs, tp = encode(y, a.out, a.encode)
        if not a.no_level and abs(lufs - rm.LUFS) > 0.15:
            gain += rm.LUFS - lufs
            continue
        if tp <= rm.TP_MAX or a.no_level:
            break
        ceil -= 0.3
    print(json.dumps({'file': os.path.basename(a.out), 'src': os.path.basename(a.src), 'encode': a.encode,
                      'window': a.window, 'lufs': lufs, 'truePeakDb': tp, 'gainDb': round(gain, 2),
                      'ceilDb': None if a.no_level else round(ceil, 1), 'bytes': os.path.getsize(a.out)}))


if __name__ == '__main__':
    main()
