"""Music quality diagnosis for Bailey's friend's "Music quality sounds kinda bad" (2026-09-29).

Agents cannot hear (AGENTS.md rule 13). This measures what a listener would hear as dull,
smeared, squashed, hollow or coded, and splits the blame between the stages a cue goes through:
the sampled render fed to the model, the ACE-Step take, the R1 remaster and the MP3 encode.

  python tools/audio/quality-measure.py FILE [FILE ...] [--pair TEST=REF ...] [--json OUT]
      [--window START_S DUR_S]

Per file (ffmpeg decode to 44.1 kHz stereo float; tools/audio/remaster-measure.py measure() for
bands, L/R correlation, side/mid, mono loss, LUFS, true peak, LRA, crest), plus:
  topEdge60 / topEdge70   highest frequency where the 1/6-octave long-term spectrum of the mid is
                          within 60 / 70 dB of its 100 Hz-5 kHz maximum (where the top dies)
  cliff                   the steepest drop above 10 kHz over 500 Hz, dB, and where (a lowpass
                          brick wall shows as a cliff of 15 dB or more; a natural roll-off does not)
  hfFlatnessDb            median spectral flatness of 4-10 kHz over the louder half of the frames:
                          0 dB = white noise, more negative = more tonal; decoder smear and hiss
                          push it towards 0
  crispDb                 10*log10(p95 / median) of the 1-8 kHz positive spectral flux: how much
                          attacks stand out of the sustain (sharper attacks = higher)
  riseMs                  median 10-90 % rise time of the 2-8 kHz envelope at the 40 strongest onsets
  plr                     true peak minus integrated loudness, dB
With --pair TEST=REF (REF the lossless twin of the lossy TEST, same chain, same length):
  lagSamples              alignment found by cross-correlation (must be 0 for the figures to mean much)
  snrDb                   whole-file signal over coding error, mid
  nmrBandsDb              coding error over signal per band (20-80 ... 16k+ Hz), mid; -20 dB and
                          below is usually masked, above -10 dB in a band is audible there
  preEchoDb               median over the 40 strongest attacks of the >3 kHz coding error over the
                          >3 kHz signal in the 20 ms before each attack (above 0 = the noise comes
                          before the note: pre-echo)
  lostTopDb               16-22 kHz share of REF minus TEST (what the encoder's lowpass removed)
"""

import importlib.util
import json
import os
import subprocess
import sys
import tempfile

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('remaster_measure', os.path.join(HERE, 'remaster-measure.py'))
rm = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rm)

SR = rm.SR
FF = rm.FF
BANDS = rm.BANDS


def db(x):
    return float(10 * np.log10(max(float(x), 1e-30)))


def frames(x, n, hop, limit=None):
    count = max((len(x) - n) // hop, 1)
    idx = np.arange(count)
    if limit and count > limit:
        idx = np.linspace(0, count - 1, limit).astype(int)
    return x[np.arange(n)[None, :] + hop * idx[:, None]]


def ltas(m, n=8192):
    w = np.hanning(n)
    p = np.mean(np.abs(np.fft.rfft(frames(m, n, n // 2, 3000) * w, axis=1)) ** 2, axis=0)
    return np.fft.rfftfreq(n, 1 / SR), p


def smooth_oct(f, p, frac=6):
    out = np.empty_like(p)
    for i, fc in enumerate(f):
        if fc <= 0:
            out[i] = p[i]
            continue
        lo, hi = fc * 2 ** (-0.5 / frac), fc * 2 ** (0.5 / frac)
        a, b = np.searchsorted(f, lo), max(np.searchsorted(f, hi), np.searchsorted(f, lo) + 1)
        out[i] = p[a:b].mean()
    return 10 * np.log10(out + 1e-30)


def top_edge(m):
    f, p = ltas(m)
    s = smooth_oct(f, p)
    ref = s[(f >= 100) & (f <= 5000)].max()
    res = {}
    for d in (60, 70):
        ok = np.where((s >= ref - d) & (f >= 20))[0]
        res[f'topEdge{d}'] = int(round(f[ok[-1]])) if len(ok) else 0
    step = int(round(500 / (f[1] - f[0])))
    sel = np.where((f >= 10000) & (f < f[-1] - 600))[0]
    drops = s[sel] - s[sel + step]
    k = int(np.argmax(drops))
    res['cliff'] = {'db': round(float(drops[k]), 1), 'hz': int(round(f[sel[k]]))}
    return res


def spec_frames(m, n=2048, hop=1024, limit=6000):
    return np.abs(np.fft.rfft(frames(m, n, hop, limit) * np.hanning(n), axis=1)) ** 2, np.fft.rfftfreq(n, 1 / SR)


def hf_flatness(m):
    P, f = spec_frames(m)
    b = P[:, (f >= 4000) & (f < 10000)] + 1e-20
    e = b.mean(axis=1)
    loud = e >= np.median(e)
    fl = np.exp(np.mean(np.log(b[loud]), axis=1)) / e[loud]
    return round(db(np.median(fl)), 1)


def flux_env(m, n=1024, hop=256, lo=1000, hi=8000):
    idx = np.arange(max((len(m) - n) // hop, 1))
    X = np.abs(np.fft.rfft(m[np.arange(n)[None, :] + hop * idx[:, None]] * np.hanning(n), axis=1))
    f = np.fft.rfftfreq(n, 1 / SR)
    L = np.log(X[:, (f >= lo) & (f < hi)] + 1e-6)
    return np.r_[0, np.maximum(L[1:] - L[:-1], 0).sum(axis=1)], hop


def strongest_onsets(m, count=40, gap_s=0.15):
    d, hop = flux_env(m)
    order = np.argsort(d)[::-1]
    picked, gap = [], int(gap_s * SR / hop)
    for i in order:
        if all(abs(i - j) > gap for j in picked):
            picked.append(int(i))
        if len(picked) >= count:
            break
    return [i * hop for i in sorted(picked)], d


def band_hp(x, lo, hi=None):
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = (f >= lo) & (f < (hi or SR))
    return np.fft.irfft(X * (g[:, None] if x.ndim == 2 else g), len(x), axis=0)


def crisp_and_rise(m):
    onsets, d = strongest_onsets(m)
    crisp = round(db(np.percentile(d, 95) / (np.median(d) + 1e-12)), 1)
    hp = band_hp(m, 2000, 8000)
    fr = int(0.001 * SR)  # 1 ms envelope frames
    rises = []
    for s in onsets:
        a, b = max(s - int(0.06 * SR), 0), min(s + int(0.06 * SR), len(m))
        seg = hp[a:b]
        env = np.sqrt(np.convolve(seg ** 2, np.ones(fr * 2) / (fr * 2), 'same'))[::fr]
        if len(env) < 10:
            continue
        pk = int(np.argmax(env))
        base = np.percentile(env[:max(pk, 1)], 10)
        span = env[pk] - base
        if span <= 0:
            continue
        pre = env[:pk + 1]
        t10 = np.where(pre <= base + 0.1 * span)[0]
        t90 = np.where(pre >= base + 0.9 * span)[0]
        if len(t10) and len(t90):
            rises.append(float(t90[0] - t10[t10 < t90[0]][-1]) if np.any(t10 < t90[0]) else 0.0)
    return crisp, (round(float(np.median(rises)), 1) if rises else None)


def align(test, ref, max_lag=4096):
    n = min(len(ref), len(test), SR * 20)
    off = max(0, min(len(ref), len(test)) // 2 - n // 2)
    a, b = ref[off:off + n, 0] + ref[off:off + n, 1], test[off:off + n, 0] + test[off:off + n, 1]
    cc = np.fft.irfft(np.fft.rfft(b, 2 * n) * np.conj(np.fft.rfft(a, 2 * n)))
    lags = np.r_[np.arange(0, max_lag + 1), np.arange(-max_lag, 0)]
    vals = np.r_[cc[:max_lag + 1], cc[-max_lag:]]
    return int(lags[int(np.argmax(vals))])


def codec(test_path, ref_path, window=None):
    t, r = load(test_path, window), load(ref_path, window)
    lag = align(t, r)
    if lag > 0:
        t = t[lag:]
    elif lag < 0:
        r = r[-lag:]
    n = min(len(t), len(r))
    t, r = t[:n], r[:n]
    e = t - r
    mr, me = (r[:, 0] + r[:, 1]) / 2, (e[:, 0] + e[:, 1]) / 2
    f, pr = ltas(mr)
    _, pe = ltas(me)
    nmr = []
    for lo, hi in BANDS:
        sel = (f >= lo) & (f < hi)
        nmr.append(round(db(pe[sel].sum() / (pr[sel].sum() + 1e-30)), 1))
    onsets, _ = strongest_onsets(mr)
    rh, eh = band_hp(mr, 3000), band_hp(me, 3000)
    pre = []
    for s in onsets:
        a, b = s - int(0.022 * SR), s - int(0.002 * SR)
        if a > 0:
            pre.append(db(np.sum(eh[a:b] ** 2) / (np.sum(rh[a:b] ** 2) + 1e-30)))
    mt = (t[:, 0] + t[:, 1]) / 2
    _, pt = ltas(mt)
    top = (f >= 16000)
    return {'lagSamples': lag, 'snrDb': round(db(np.mean(mr ** 2) / (np.mean(me ** 2) + 1e-30)), 1),
            'nmrBandsDb': nmr, 'preEchoDb': round(float(np.median(pre)), 1) if pre else None,
            'lostTopDb': round(db(pr[top].sum() / pr[f >= 20].sum()) - db(pt[top].sum() / pt[f >= 20].sum()), 1)}


def load(path, window=None):
    x = rm.decode(path)
    if window:
        a = int(window[0] * SR)
        x = x[a:a + int(window[1] * SR)]
    return x


def windowed_copy(path, window):
    """A float WAV of the window, so remaster-measure's ebur128 sees the same audio."""
    fd, tmp = tempfile.mkstemp(suffix='.wav')
    os.close(fd)
    subprocess.run([FF, '-v', 'error', '-y', '-ss', str(window[0]), '-t', str(window[1]), '-i', path,
                    '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_f32le', tmp], check=True)
    return tmp


def measure(path, window=None):
    src = windowed_copy(path, window) if window else path
    try:
        base = rm.measure(src)
        x = rm.decode(src)
    finally:
        if window:
            os.remove(src)
    m = (x[:, 0] + x[:, 1]) / 2
    base['file'] = os.path.basename(path)
    base.update(top_edge(m))
    base['hfFlatnessDb'] = hf_flatness(m)
    base['crispDb'], base['riseMs'] = crisp_and_rise(m)
    base['plr'] = round(base['tp'] - base['lufs'], 1) if base['tp'] is not None and base['lufs'] is not None else None
    for k in ('bandCorr', 'magCorr', 'lagCorr', 'lagMs'):
        base.pop(k, None)
    return base


def main(argv):
    files, pairs, out, window = [], [], None, None
    it = iter(argv)
    for a in it:
        if a == '--json':
            out = next(it)
        elif a == '--pair':
            pairs.append(next(it).split('=', 1))
        elif a == '--window':
            window = (float(next(it)), float(next(it)))
        else:
            files.append(a)
    rows = []
    for f in files:
        rows.append(measure(f, window))
        print(json.dumps(rows[-1]))
    for t, r in pairs:
        row = {'test': os.path.basename(t), 'ref': os.path.basename(r), **codec(t, r, window)}
        rows.append(row)
        print(json.dumps(row))
    if out:
        with open(out, 'w', encoding='utf-8') as fh:
            json.dump(rows, fh, indent=1)


if __name__ == '__main__':
    main(sys.argv[1:])
