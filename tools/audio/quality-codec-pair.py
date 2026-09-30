"""Paired, phase-blind codec comparison (music-model-test, 2026-09-30). Game case: BOTH.

quality-measure.py measures each file on its own: its riseMs picks the 40 strongest onsets of EACH
file, so a codec that invents or drops attacks moves the sample, and its --pair NMR counts any phase
change as error (a generative decoder re-synthesises the top with new phase and scores "worse than
the signal" there even when the magnitudes are right). For a codec round trip the input and output
share their timeline, so this compares them onset by onset and frame by frame:

  python tools/audio/quality-codec-pair.py --ref INPUT.wav TEST.wav [TEST.wav ...] [--json OUT]

Per TEST (aligned to REF by cross-correlation first, like quality-measure.py --pair):
  lagSamples        alignment applied
  riseRefMs / riseTestMs / riseDeltaMs
                    median 10-90 % rise of the 2-8 kHz envelope at the SAME 60 strongest REF onsets,
                    and the median per-onset difference (positive = the codec slows attacks)
  slowerShare       share of those onsets where TEST rises more than 2 ms slower than REF
  attackDropDb      median per-onset loss of the 2-8 kHz attack peak over the 20-40 ms before it
                    (positive = the attack stands out less from what precedes it)
  magErrDb          per band, the mean absolute difference of 1/3-octave STFT magnitudes (dB) over
                    frames above -50 dB: how far the spectrum moves, ignoring phase
  corrRef / corrTest
                    L/R correlation of each (the "hollow" measure), 1 s frames, median
"""

import argparse
import importlib.util
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('quality_measure', os.path.join(HERE, 'quality-measure.py'))
qm = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(qm)
SR = qm.SR
BANDS = [(80, 250), (250, 800), (800, 2500), (2500, 6000), (6000, 12000), (12000, 16000)]


def rise_at(hp, s):
    fr = int(0.001 * SR)
    a, b = max(s - int(0.06 * SR), 0), min(s + int(0.06 * SR), len(hp))
    seg = hp[a:b]
    env = np.sqrt(np.convolve(seg ** 2, np.ones(fr * 2) / (fr * 2), 'same'))[::fr]
    if len(env) < 10:
        return None, None
    pk = int(np.argmax(env))
    base = np.percentile(env[:max(pk, 1)], 10)
    span = env[pk] - base
    if span <= 0:
        return None, None
    pre = env[:pk + 1]
    t90 = np.where(pre >= base + 0.9 * span)[0]
    t10 = np.where(pre <= base + 0.1 * span)[0]
    if not len(t90):
        return None, None
    before = t10[t10 < t90[0]]
    rise = float(t90[0] - before[-1]) if len(before) else 0.0
    lead = env[max(pk - 40, 0):max(pk - 20, 1)]
    drop = qm.db(env[pk] ** 2 / (np.mean(lead ** 2) + 1e-20)) if len(lead) else None
    return rise, drop


def lr_corr(x):
    n = SR
    vals = []
    for i in range(0, len(x) - n, n):
        l, r = x[i:i + n, 0], x[i:i + n, 1]
        d = np.sqrt((l ** 2).sum() * (r ** 2).sum())
        if d > 1e-9:
            vals.append(float((l * r).sum() / d))
    return round(float(np.median(vals)), 3) if vals else None


def third_oct_mag(m, n=4096, hop=1024):
    X = np.abs(np.fft.rfft(qm.frames(m, n, hop) * np.hanning(n), axis=1)) ** 2
    f = np.fft.rfftfreq(n, 1 / SR)
    centres = 1000 * 2 ** (np.arange(-17, 14) / 3)
    rows = []
    for fc in centres:
        sel = (f >= fc * 2 ** (-1 / 6)) & (f < fc * 2 ** (1 / 6))
        rows.append(X[:, sel].sum(axis=1) if sel.any() else np.zeros(len(X)))
    return centres, 10 * np.log10(np.array(rows).T + 1e-20)


def env_align(t, r, max_lag=4096, hop=32):
    """Lag from the 1-8 kHz onset envelopes (hop 32 samples), refined by waveform cross-correlation
    within +-hop. A vocoder output keeps no phase, so plain waveform correlation can lock onto a
    wrong peak (it did on ACE-Step v1: +1743 against an envelope lag near -1024)."""
    er, _ = qm.flux_env(r.mean(axis=1), hop=hop)
    et, _ = qm.flux_env(t.mean(axis=1), hop=hop)
    n = min(len(er), len(et))
    er, et = er[:n] - er[:n].mean(), et[:n] - et[:n].mean()
    k_max = max_lag // hop
    cc = [float(np.dot(er[max(0, -k):n - max(0, k)], et[max(0, k):n - max(0, -k)])) for k in range(-k_max, k_max + 1)]
    coarse = (int(np.argmax(cc)) - k_max) * hop
    a, b = r.mean(axis=1), t.mean(axis=1)
    mid, w = len(a) // 2, min(len(a), len(b), SR * 10) // 2
    best, fine = -np.inf, coarse
    for lag in range(coarse - hop, coarse + hop + 1):
        if mid - w + lag < 0 or mid + w + lag > len(b):
            continue
        v = float(np.dot(a[mid - w:mid + w], b[mid - w + lag:mid + w + lag]))
        if v > best:
            best, fine = v, lag
    return fine


def compare(ref_path, test_path):
    r, t = qm.load(ref_path), qm.load(test_path)
    lag = env_align(t, r)
    if lag > 0:
        t = t[lag:]
    elif lag < 0:
        r = r[-lag:]
    n = min(len(r), len(t))
    r, t = r[:n], t[:n]
    mr, mt = (r[:, 0] + r[:, 1]) / 2, (t[:, 0] + t[:, 1]) / 2
    # loudness-match the test to the ref (so level alone is not counted as spectral error)
    g = np.sqrt((mr ** 2).mean() / max((mt ** 2).mean(), 1e-20))
    mt, t = mt * g, t * g
    onsets, _ = qm.strongest_onsets(mr, count=60)
    hr, ht = qm.band_hp(mr, 2000, 8000), qm.band_hp(mt, 2000, 8000)
    rr, rt, dd, drops = [], [], [], []
    for s in onsets:
        a, da = rise_at(hr, s)
        b, db_ = rise_at(ht, s)
        if a is None or b is None:
            continue
        rr.append(a)
        rt.append(b)
        dd.append(b - a)
        if da is not None and db_ is not None:
            drops.append(da - db_)
    c, Mr = third_oct_mag(mr)
    _, Mt = third_oct_mag(mt)
    live = Mr.max(axis=1) > Mr.max() - 50
    mag = []
    for lo, hi in BANDS:
        sel = (c >= lo) & (c < hi)
        mag.append(round(float(np.mean(np.abs(Mt[live][:, sel] - Mr[live][:, sel]))), 2))
    return {
        'ref': os.path.basename(ref_path), 'test': os.path.basename(test_path), 'lagSamples': lag,
        'onsets': len(dd),
        'riseRefMs': round(float(np.median(rr)), 1), 'riseTestMs': round(float(np.median(rt)), 1),
        'riseDeltaMs': round(float(np.median(dd)), 1),
        'slowerShare': round(float(np.mean(np.array(dd) > 2.0)), 2),
        'attackDropDb': round(float(np.median(drops)), 1) if drops else None,
        'magErrBands': [f'{lo}-{hi}' for lo, hi in BANDS], 'magErrDb': mag,
        'corrRef': lr_corr(r), 'corrTest': lr_corr(t),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ref', required=True)
    ap.add_argument('tests', nargs='+')
    ap.add_argument('--json')
    a = ap.parse_args()
    out = []
    for p in a.tests:
        res = compare(a.ref, p)
        out.append(res)
        sys.stdout.write(json.dumps(res) + '\n')
    if a.json:
        with open(a.json, 'w', encoding='utf-8') as fh:
            json.dump(out, fh, indent=1)


if __name__ == '__main__':
    main()
