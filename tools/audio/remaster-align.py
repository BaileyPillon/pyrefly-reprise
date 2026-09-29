"""Where a remastered file sits in time against its lossless source (2026-09-29, D-283).

  python tools/audio/remaster-align.py SOURCE PROCESSED

Prints {"lag": samples, "corr": peak correlation, "samples": [source, processed]} as JSON: the
whole-file cross-correlation of the two mono sums, searched over +-2000 samples. The remaster
chain (tools/audio/remaster.py) is meant to be length- and time-preserving (zero-phase EQ, an
STFT phase repair at hop 1024, a latency-compensated limiter), so the answer should be 0; an MP3
encoder delay left in would show as hundreds of samples (576, 1105). Short windows are not used:
in a quiet or sustained passage the phase repair moves a 1 s window's peak by tens of samples,
which says nothing about the file's timing.
Game case (AGENTS.md rule 14): shared audio plumbing, BOTH.
"""

import json
import subprocess
import sys

import numpy as np

SR = 44100
MAX_LAG = 2000


def mono(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').astype(np.float64)


def main(src, proc):
    a, b = mono(src), mono(proc)
    n = min(len(a), len(b))
    a, b = a[:n], b[:n]
    size = 1 << (2 * n - 1).bit_length()
    cc = np.fft.irfft(np.fft.rfft(b, size) * np.conj(np.fft.rfft(a, size)), size)
    lags = np.r_[np.arange(0, MAX_LAG + 1), np.arange(-MAX_LAG, 0)]
    vals = np.r_[cc[:MAX_LAG + 1], cc[-MAX_LAG:]] / (np.sqrt(np.dot(a, a) * np.dot(b, b)) + 1e-30)
    k = int(np.argmax(vals))
    print(json.dumps({'lag': int(lags[k]), 'corr': round(float(vals[k]), 4), 'samples': [len(a), len(b)]}))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
