"""Structure-fidelity measurements for the ACE-Step sketch (tools/audio/ace-step.mjs).

Agents cannot hear (hard rule 13), so a restyled cue is judged here by numbers:
did the notes stay where the score put them, did the harmony survive, and how
far did the timbre move. Needs only numpy (the ComfyUI embedded python has it):

  python tools/audio/ace-measure.py --source src.wav --cand cand.wav --bpm 150
  python tools/audio/ace-measure.py --cand t2m.wav --bpm 150          (no source)

Both files are 44.1 kHz mono float/int16 WAV (ace-step.mjs decodes with
ffmpeg first). Prints one JSON object.

Measures, all from a 2048-point STFT at a 10 ms hop:
  onset envelope   spectral flux of log magnitude, half-wave rectified
  onsetF           onset F-measure (+-50 ms) of candidate vs source onsets
  lag windows      per 4-bar window, the cross-correlation lag (+-250 ms) of the
                   two onset envelopes: its median / max |lag| is the onset-grid
                   drift, its slope is systematic tempo drift
  chroma           per-beat 12-bin pitch-class profile (own 8192-point STFT, 110 Hz-4.2 kHz), cosine similarity with
                   the source beat for beat, against a baseline of the source
                   compared with itself two bars later (what "unrelated but in
                   the same key" scores)
  gridHit          share of the file's onsets within +-40 ms of the best-phase
                   grid at the cue's bpm (for a text-to-music control)
  tempoEst         autocorrelation tempo of the onset envelope, 70-200 bpm
  keyEst           Krumhansl-Schmuckler key of the whole file (coarse)
  centroidHz       energy-weighted mean spectral centroid
"""

import argparse
import json
import wave

import numpy as np

SR = 44100
HOP = 441
NFFT = 2048


def load(path):
    with wave.open(path, 'rb') as w:
        sr = w.getframerate()
        n = w.getnframes()
        ch = w.getnchannels()
        width = w.getsampwidth()
        raw = w.readframes(n)
    if width == 2:
        x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0
    elif width == 4:
        x = np.frombuffer(raw, dtype='<f4').astype(np.float32)
    else:
        raise SystemExit(f'unsupported sample width {width} in {path}')
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    if sr != SR:
        raise SystemExit(f'{path} is {sr} Hz; decode to {SR} first')
    return x


def stft_mag(x):
    win = np.hanning(NFFT).astype(np.float32)
    frames = 1 + max(0, (len(x) - NFFT) // HOP)
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(frames)[:, None]
    return np.abs(np.fft.rfft(x[idx] * win, axis=1)).astype(np.float32)


def onset_env(mag):
    logm = np.log1p(100.0 * mag)
    flux = np.maximum(0.0, np.diff(logm, axis=0)).sum(axis=1)
    flux = np.concatenate([[0.0], flux])
    # remove the slow trend so loud passages do not swamp quiet ones
    k = 51
    trend = np.convolve(flux, np.ones(k) / k, mode='same')
    env = np.maximum(0.0, flux - trend)
    return env / (env.std() + 1e-9)


def peaks(env, thresh=1.0, radius=5):
    out = []
    for i in range(radius, len(env) - radius):
        v = env[i]
        if v > thresh and v == env[i - radius:i + radius + 1].max():
            out.append(i)
    return np.array(out, dtype=np.float64) * HOP / SR


def onset_f(ref, est, tol=0.05):
    if len(ref) == 0 or len(est) == 0:
        return 0.0, 0.0, 0.0
    used = np.zeros(len(ref), dtype=bool)
    hits = 0
    for t in est:
        j = np.searchsorted(ref, t)
        best = None
        for c in (j - 1, j):
            if 0 <= c < len(ref) and not used[c] and abs(ref[c] - t) <= tol:
                if best is None or abs(ref[c] - t) < abs(ref[best] - t):
                    best = c
        if best is not None:
            used[best] = True
            hits += 1
    p = hits / len(est)
    r = hits / len(ref)
    f = 0.0 if p + r == 0 else 2 * p * r / (p + r)
    return p, r, f


def lag_windows(a, b, bpm, max_lag_s=0.25):
    """Per 4-bar window: lag (s) of b against a at peak correlation, and the peak."""
    win = int(round(4 * 4 * 60.0 / bpm * SR / HOP))
    ml = int(round(max_lag_s * SR / HOP))
    n = min(len(a), len(b))
    out = []
    for s in range(ml, n - win - ml, win):
        x = a[s:s + win] - a[s:s + win].mean()
        best, best_l = -2.0, 0
        for l in range(-ml, ml + 1):
            y = b[s + l:s + l + win] - b[s + l:s + l + win].mean()
            d = np.sqrt((x * x).sum() * (y * y).sum()) + 1e-9
            c = float((x * y).sum() / d)
            if c > best:
                best, best_l = c, l
        out.append({'t': round(s * HOP / SR, 2), 'lagMs': round(best_l * HOP / SR * 1000, 1), 'corr': round(best, 3)})
    return out


CHROMA_NFFT = 8192  # 5.4 Hz bins: a semitone is resolvable from ~110 Hz up


def chroma_frames(x):
    """Per-hop 12-bin pitch-class energy from its own long STFT (A = bin 0).

    Magnitude, not power, and only 110 Hz to 4.2 kHz, so the kick and the bass
    do not decide the pitch class of every frame.
    """
    win = np.hanning(CHROMA_NFFT).astype(np.float32)
    pad = np.concatenate([np.zeros(CHROMA_NFFT // 2, np.float32), x, np.zeros(CHROMA_NFFT // 2, np.float32)])
    frames = 1 + max(0, (len(pad) - CHROMA_NFFT) // HOP)
    freqs = np.fft.rfftfreq(CHROMA_NFFT, 1.0 / SR)
    sel = (freqs >= 110.0) & (freqs <= 4200.0)
    pc = (np.round(12 * np.log2(freqs[sel] / 440.0)) % 12).astype(int)
    ch = np.zeros((frames, 12), dtype=np.float64)
    step = 256
    for s0 in range(0, frames, step):
        n = min(step, frames - s0)
        idx = np.arange(CHROMA_NFFT)[None, :] + HOP * (s0 + np.arange(n))[:, None]
        m = np.abs(np.fft.rfft(pad[idx] * win, axis=1))[:, sel]
        for k in range(12):
            ch[s0:s0 + n, k] = m[:, pc == k].sum(axis=1)
    return ch


def beat_chroma(ch, bpm, phase):
    beat = 60.0 / bpm * SR / HOP
    n = int((ch.shape[0] - phase) // beat)
    out = []
    for i in range(n):
        s = int(round(phase + i * beat))
        e = int(round(phase + (i + 1) * beat))
        v = ch[s:e].sum(axis=0)
        out.append(v / (np.linalg.norm(v) + 1e-12))
    return np.array(out)


def best_phase(env, bpm):
    beat = 60.0 / bpm * SR / HOP
    best, arg = -1.0, 0.0
    for ph in np.arange(0, beat, 0.5):
        idx = np.round(ph + beat * np.arange(int((len(env) - ph) // beat))).astype(int)
        v = env[idx[idx < len(env)]].mean()
        if v > best:
            best, arg = v, ph
    return arg


def grid_hit(onsets, bpm, phase_frames, tol=0.04):
    if len(onsets) == 0:
        return 0.0
    # eighth-note grid: battle cues move in eighths
    step = 60.0 / bpm / 2
    ph = phase_frames * HOP / SR
    d = np.abs(((onsets - ph) + step / 2) % step - step / 2)
    return float((d <= tol).mean())


def tempo_est(env, lo=70, hi=200):
    e = env - env.mean()
    ac = np.correlate(e, e, mode='full')[len(e) - 1:]
    fps = SR / HOP
    best, arg = -1e18, 0
    for bpm in np.arange(lo, hi + 0.25, 0.25):
        lag = fps * 60.0 / bpm
        l0 = int(np.floor(lag))
        fr = lag - l0
        v = ac[l0] * (1 - fr) + ac[l0 + 1] * fr
        if v > best:
            best, arg = v, bpm
    return float(arg)


def fold(est, bpm):
    """The autocorrelation tempo moved by octaves to the cue's bpm (half/double-time errors)."""
    if est <= 0:
        return 0.0
    return round(float(est * 2.0 ** round(np.log2(bpm / est))), 2)


KS_MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KS_MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
NAMES = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#']  # pitch class 0 = A (chroma_frames is A-based)


def key_est(x):
    """Krumhansl-Schmuckler key from the whole-file chroma: a coarse check, not a key detector of record."""
    prof = chroma_frames(x).sum(axis=0)
    best = (-2.0, '')
    for t in range(12):
        for mode, tmpl in (('major', KS_MAJOR), ('minor', KS_MINOR)):
            r = float(np.corrcoef(prof, np.roll(tmpl, t))[0, 1])
            if r > best[0]:
                best = (r, f'{NAMES[t]} {mode}')
    return best[1], round(best[0], 3)


def centroid(mag):
    freqs = np.fft.rfftfreq(NFFT, 1.0 / SR)
    e = mag ** 2
    tot = e.sum(axis=1)
    c = (e * freqs[None, :]).sum(axis=1) / (tot + 1e-12)
    w = tot / (tot.sum() + 1e-12)
    return float((c * w).sum())


def describe(x, bpm):
    mag = stft_mag(x)
    env = onset_env(mag)
    ph = best_phase(env, bpm)
    ons = peaks(env)
    return mag, env, ph, ons


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source')
    ap.add_argument('--cand', required=True)
    ap.add_argument('--bpm', type=float, required=True)
    a = ap.parse_args()

    cx = load(a.cand)
    cmag, cenv, cph, cons = describe(cx, a.bpm)
    res = {
        'durationS': round(len(cx) / SR, 2),
        'centroidHz': round(centroid(cmag), 1),
        'tempoEst': tempo_est(cenv),
        'tempoEstFolded': fold(tempo_est(cenv), a.bpm),
        'gridHit': round(grid_hit(cons, a.bpm, cph), 3),
        'gridHitChance': round(min(1.0, 0.08 / (60.0 / a.bpm / 2)), 3),
        'keyEst': key_est(cx),
        'onsets': int(len(cons)),
    }
    if a.source:
        sx = load(a.source)
        smag, senv, sph, sons = describe(sx, a.bpm)
        n = min(len(senv), len(cenv))
        lags = lag_windows(senv[:n], cenv[:n], a.bpm)
        good = [w for w in lags if w['corr'] >= 0.2]
        absl = np.array([abs(w['lagMs']) for w in good]) if good else np.array([np.nan])
        if len(good) >= 3:
            slope = float(np.polyfit([w['t'] for w in good], [w['lagMs'] for w in good], 1)[0]) * 60
        else:
            slope = float('nan')
        p, r, f = onset_f(sons, cons)
        sch = beat_chroma(chroma_frames(sx), a.bpm, sph)
        cch = beat_chroma(chroma_frames(cx), a.bpm, sph)
        m = min(len(sch), len(cch))
        chroma = float((sch[:m] * cch[:m]).sum(axis=1).mean())
        two_bars = 8
        base = float((sch[:m - two_bars] * sch[two_bars:m]).sum(axis=1).mean())
        res.update({
            'source': {
                'centroidHz': round(centroid(smag), 1),
                'tempoEst': tempo_est(senv),
                'gridHit': round(grid_hit(sons, a.bpm, sph), 3),
                'onsets': int(len(sons)),
            },
            'onsetPrecision': round(p, 3),
            'onsetRecall': round(r, 3),
            'onsetF': round(f, 3),
            'lagMedianAbsMs': round(float(np.nanmedian(absl)), 1),
            'lagMaxAbsMs': round(float(np.nanmax(absl)), 1),
            'lagSlopeMsPerMin': round(slope, 2),
            'windowsCorrelated': f'{len(good)}/{len(lags)}',
            'windowCorrMean': round(float(np.mean([w['corr'] for w in lags])) if lags else 0.0, 3),
            'chromaSim': round(chroma, 3),
            'chromaBaselineTwoBarsApart': round(base, 3),
            'centroidShiftHz': round(centroid(cmag) - centroid(smag), 1),
            'lagWindows': lags,
        })
        # One number to rank seeds by: how much of the score's timing and
        # harmony survived. Onset F and window correlation carry the rhythm,
        # chroma above the same-key baseline carries the notes.
        chroma_gain = max(0.0, (chroma - base) / max(1e-6, 1 - base))
        res['structureFidelity'] = round(
            (f + res['windowCorrMean'] + chroma_gain) / 3.0, 3)
    def clean(v):
        if isinstance(v, float) and v != v:
            return None
        if isinstance(v, dict):
            return {k: clean(x) for k, x in v.items()}
        if isinstance(v, list):
            return [clean(x) for x in v]
        return v

    print(json.dumps(clean(res), allow_nan=False))


if __name__ == '__main__':
    main()
