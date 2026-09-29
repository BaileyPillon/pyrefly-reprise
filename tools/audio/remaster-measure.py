"""Stereo-image and spectrum measurements for the remaster study (2026-09-29).

Agents cannot hear (hard rule 13): these numbers explain Bailey's "tinny and hollow".

  python tools/audio/remaster-measure.py FILE [FILE ...] [--json OUT] [--spectro DIR] [--group N]

Per file (decoded by ffmpeg to 44.1 kHz stereo float):
  bands      mid-channel ((L+R)/2) share of total mid energy per band, dB
             (20-80 / 80-250 / 250-800 / 800-2.5k / 2.5-6k / 6-12k / 12-16k / 16-22k Hz)
  corr       L/R Pearson correlation over the whole file
  sideMid    side energy over mid energy, dB (S = (L-R)/2, M = (L+R)/2)
  monoLoss   mono-sum power over the mean channel power, dB: 0 = identical
             channels, -3 = uncorrelated, very negative = cancelling
  bandCorr   L/R correlation of the complex STFT per band (coherence of the waveforms)
  magCorr    L/R correlation of the STFT magnitude envelopes per band: high magCorr with
             low bandCorr = the same notes at the same levels in both channels but with
             unrelated phase
  lagCorr    best |L/R correlation| over +-5 ms of inter-channel delay, and its lag
  lufs, tp   integrated loudness and true peak (ffmpeg ebur128)
  rms, crest RMS dBFS of the mid and peak-to-RMS ratio
With --spectro DIR, a 2-second spectrogram JPEG (ffmpeg showspectrumpic) from the
loudest 2 s of the file; with --group N the files come in groups of N (an original, then its
variants) and every file in a group is pictured over its original's window.
"""

import json
import os
import re
import subprocess
import sys

import numpy as np

SR = 44100
BANDS = [(20, 80), (80, 250), (250, 800), (800, 2500), (2500, 6000),
         (6000, 12000), (12000, 16000), (16000, 22050)]
FF = os.environ.get('FFMPEG', 'ffmpeg')


def decode(path):
    out = subprocess.run([FF, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2',
                          '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype='<f4').reshape(-1, 2).astype(np.float64)


def ebur(path):
    err = subprocess.run([FF, '-hide_banner', '-nostats', '-i', path, '-af',
                          'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    tail = err[err.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+|-inf) LUFS', tail)
    lra = re.search(r'LRA:\s+(-?[\d.]+) LU', tail)
    tp = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', tail)
    f = lambda m: float(m.group(1)) if m else None
    return f(i), f(tp), f(lra)


def db(x):
    return float(10 * np.log10(max(x, 1e-30)))


def stft(x, n=4096, hop=2048):
    w = np.hanning(n)
    frames = (len(x) - n) // hop
    idx = np.arange(n)[None, :] + hop * np.arange(max(frames, 1))[:, None]
    return np.fft.rfft(x[idx] * w, axis=1)


def loudest_2s(m):
    e = np.convolve(m ** 2, np.ones(SR // 10), 'valid')[::SR // 10]
    csum = np.convolve(e, np.ones(20), 'valid')
    return int(np.argmax(csum)) * 0.1 if len(csum) else 0.0


def measure(path, spectro_dir=None, start=None):
    x = decode(path)
    L, R = x[:, 0], x[:, 1]
    M, S = (L + R) / 2, (L - R) / 2
    em, es = np.mean(M ** 2), np.mean(S ** 2)
    corr = float(np.sum(L * R) / np.sqrt(np.sum(L * L) * np.sum(R * R) + 1e-30))
    # spectra (whole file, 4096-pt frames) for the band shares and per-band stereo
    FL, FR = stft(L), stft(R)
    FM = (FL + FR) / 2
    freqs = np.fft.rfftfreq(4096, 1 / SR)
    pm = np.sum(np.abs(FM) ** 2, axis=0)
    tot = pm[(freqs >= 20)].sum()
    bands, bcorr, mcorr = [], [], []
    for lo, hi in BANDS:
        sel = (freqs >= lo) & (freqs < hi)
        bands.append(round(db(pm[sel].sum() / tot), 1))
        a, b = FL[:, sel], FR[:, sel]
        num = np.real(np.sum(a * np.conj(b)))
        den = np.sqrt(np.sum(np.abs(a) ** 2) * np.sum(np.abs(b) ** 2)) + 1e-30
        bcorr.append(round(float(num / den), 2))
        ma, mb = np.abs(a).ravel(), np.abs(b).ravel()
        mcorr.append(round(float(np.corrcoef(ma, mb)[0, 1]) if ma.std() > 0 else 0.0, 2))
    # best correlation over +-5 ms of inter-channel delay (a delay or phase flip shows here)
    n = min(len(L), SR * 30)
    off = max(0, len(L) // 2 - n // 2)
    a, b = L[off:off + n], R[off:off + n]
    fa, fb = np.fft.rfft(a, 2 * n), np.fft.rfft(b, 2 * n)
    cc = np.fft.irfft(fa * np.conj(fb))
    lags = np.r_[np.arange(0, 221), np.arange(-220, 0)]
    vals = np.r_[cc[:221], cc[-220:]] / (np.sqrt(np.sum(a * a) * np.sum(b * b)) + 1e-30)
    k = int(np.argmax(np.abs(vals)))
    lufs, tp, lra = ebur(path)
    peak = float(np.max(np.abs(x)))
    rms = np.sqrt(np.mean(x ** 2))
    res = {
        'file': os.path.basename(path), 'seconds': round(len(L) / SR, 2),
        'bands': bands, 'corr': round(corr, 3), 'sideMid': round(db(es / (em + 1e-30)), 1),
        'monoLoss': round(db(np.mean(M ** 2) / (np.mean((L ** 2 + R ** 2) / 2) + 1e-30)), 1),
        'bandCorr': bcorr, 'magCorr': mcorr,
        'lagCorr': round(float(vals[k]), 3), 'lagMs': round(float(lags[k]) / SR * 1000, 2),
        'lufs': lufs, 'tp': tp, 'lra': lra,
        'rms': round(db(np.mean(M ** 2)), 1), 'crest': round(20 * np.log10(peak / (rms + 1e-30)), 1),
    }
    if spectro_dir:
        os.makedirs(spectro_dir, exist_ok=True)
        start = loudest_2s(M) if start is None else start
        stem = os.path.splitext(os.path.basename(path))[0]
        out = os.path.join(spectro_dir, stem + '.jpg')
        subprocess.run([FF, '-v', 'error', '-y', '-ss', f'{start:.2f}', '-t', '2', '-i', path,
                        '-lavfi', 'showspectrumpic=s=640x320:mode=separate:color=intensity:'
                        'scale=log:fscale=lin:legend=1', '-q:v', '4', out], check=True)
        res['spectro'] = os.path.basename(out)
        res['spectroStart'] = round(start, 1)
    return res


def main(argv):
    files, out_json, spectro, group = [], None, None, 1
    it = iter(argv)
    for a in it:
        if a == '--json':
            out_json = next(it)
        elif a == '--spectro':
            spectro = next(it)
        elif a == '--group':
            group = int(next(it))
        else:
            files.append(a)
    rows = []
    for i, f in enumerate(files):  # --group N: files come in groups of N (original first);
        start = rows[i - i % group].get('spectroStart') if i % group else None  # same window
        rows.append(measure(f, spectro, start))
        print(json.dumps(rows[-1]))
    if out_json:
        with open(out_json, 'w', encoding='utf-8') as fh:
            json.dump(rows, fh, indent=1)


if __name__ == '__main__':
    main(sys.argv[1:])
