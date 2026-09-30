"""Option O2 of the fb-0929 music-quality track: rebuild an ACE-Step take around its measured faults.

Measured (docs/handoff/fb-0929-music.md): ACE-Step v1's own audio codec, with no sampling at all
(tools/audio/quality-ace-probe.mjs --mode=roundtrip), already (1) rebuilds each channel's phase on
its own (L/R correlation 0.60 -> 0.04), (2) turns the 4-10 kHz band noise-like (spectral flatness
-12.5 -> -9.6 dB on boss-seymour, -17.5 -> -13.0 dB on boss-ffx2-aeon) and (3) softens attacks.
No tag, seed or denoise setting changes a codec, so this keeps the take only where it is good:

  1. body   the take's mid below the crossover, from a short-window magnitude average of L and R
            with L's phase (STFT 1024 / hop 256: one coherent channel, less smear than R1's 4096)
  2. top    the sampled render's own mid above the crossover (tonal highs and sharp attacks from
            the real recorded samples, same notes, same timing), linear-phase complementary split
     moved onto the take's own timing first (local_warp: the take wanders +-50 ms around the score)
  3. image  the render's side (its real panning and hall), no side below 120 Hz, 8 dB under the mid
  4. level  remaster.py's tone stage (R1 limits), -16 LUFS, true peak under -1 dBTP

  python tools/audio/quality-rebuild.py --take TAKE.wav --render RENDER.wav --out OUT.wav
      [--window START_S DUR_S] [--xover 4000] [--fade]

The take is moved onto the render by the lag of their >2 kHz onset envelopes (10 ms frames,
+-300 ms; the Direction B masters are already within a few tens of ms), and refused when those
envelopes do not correlate (under --min-corr, default 0.2). Output is float WAV; encode separately. Game case (AGENTS.md rule 14): BOTH.
"""

import argparse
import json
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import remaster as rm  # noqa: E402  (tools/audio/remaster.py)

SR = rm.SR


def load(path, window):
    x = rm.decode(path)
    if window:
        a = int(window[0] * SR)
        x = x[a:a + int(window[1] * SR)]
    return x


def coherent_mid(x, n=1024, hop=256):
    L, R = rm.stft(x[:, 0], n, hop), rm.stft(x[:, 1], n, hop)
    mag = (np.abs(L) + np.abs(R)) / 2
    return rm.istft(mag * np.exp(1j * np.angle(L)), n, hop, len(x))


def env_lag(a, b, max_ms=300, frame_ms=10):
    """Lag of b against a in ms (b later = positive): >2 kHz log-energy envelopes, 10 ms frames,
    each minus its own 200 ms moving average (the rhythm, not the loudness), cross-correlated."""
    fr = SR * frame_ms // 1000

    def env(v):
        h = rm.zp(v, rm.highpass(2000))
        e = np.log(np.sqrt(np.add.reduceat(h ** 2, np.arange(0, len(h) - fr, fr))) + 1e-6)
        k = 200 // frame_ms
        return e - np.convolve(e, np.ones(k) / k, 'same')
    ea, eb = env(a), env(b)
    n = min(len(ea), len(eb))
    best, lag = -2.0, 0
    for k in range(-max_ms // frame_ms, max_ms // frame_ms + 1):
        p, q = (ea[:n - k], eb[k:n]) if k >= 0 else (ea[-k:n], eb[:n + k])
        c = float(np.corrcoef(p, q)[0, 1])
        if c > best:
            best, lag = c, k
    return int(lag * frame_ms), round(best, 3)


def local_warp(render, take, win_s=3.0, hop_s=1.5, max_ms=80, floor=0.1):
    """Move the render onto the take's own timing, which wanders +-50 ms around the score:
    onset-envelope lag per 3 s window (hop 1.5 s, +-80 ms, under a beat at 160 bpm so no beat
    aliasing), weak windows (corr < floor) filled from their neighbours, a 5-window median, then a
    smooth, linearly interpolated delay map. Returns the warped render and the lags in ms."""
    rmid, tmid = (render[:, 0] + render[:, 1]) / 2, (take[:, 0] + take[:, 1]) / 2
    w, h = int(win_s * SR), int(hop_s * SR)
    centers, lags = [], []
    for a in range(0, len(rmid) - w + 1, h):
        lag, c = env_lag(rmid[a:a + w], tmid[a:a + w], max_ms=max_ms)
        centers.append(a + w // 2)
        lags.append(lag if c >= floor else np.nan)
    lags = np.array(lags, dtype=float)
    ok = ~np.isnan(lags)
    if ok.sum() < 2:
        return render, [0.0] * len(lags)
    lags = np.interp(np.arange(len(lags)), np.where(ok)[0], lags[ok])
    pad = np.pad(lags, 2, mode='edge')
    lags = np.array([np.median(pad[i:i + 5]) for i in range(len(lags))])
    t = np.arange(len(render), dtype=float)
    d = np.interp(t, np.array(centers, dtype=float), lags * SR / 1000)  # take later by d samples
    src = np.clip(t - d, 0, len(render) - 1)
    warped = np.stack([np.interp(src, t, render[:, ch]) for ch in (0, 1)], axis=1)
    return warped, [round(float(v), 1) for v in lags]


def split(f, fc):
    """Complementary linear-phase crossover over one octave around fc: (low, high) gains."""
    hi = rm.smoothstep(f, fc / np.sqrt(2), fc * np.sqrt(2))
    return 1 - hi, hi


def rebuild(take, render, xover):
    body = coherent_mid(take)
    rmid = (render[:, 0] + render[:, 1]) / 2
    # match the render's top to the take's level in the octave under the crossover, so the split
    # does not step: the take is quieter up there (the model's tilt), the render is the reference
    probe_lo = lambda f: rm.smoothstep(f, xover / 2.2, xover / 1.8) * (1 - rm.smoothstep(f, xover / 1.2, xover))
    eb, er = np.mean(rm.zp(body, probe_lo) ** 2), np.mean(rm.zp(rmid, probe_lo) ** 2)
    top_gain = float(np.sqrt(eb / max(er, 1e-30)))
    mid = rm.zp(body, lambda f: split(f, xover)[0]) + top_gain * rm.zp(rmid, lambda f: split(f, xover)[1])
    side = rm.zp((render[:, 0] - render[:, 1]) / 2, rm.highpass(rm.MONO_BASS_HZ))
    g = np.sqrt(10 ** (rm.SIDE_DB / 10) * np.mean(mid ** 2) / max(np.mean(side ** 2), 1e-30))
    y = np.stack([mid + g * side, mid - g * side], axis=1)
    y, eq = rm.tone(y, rm.LIMITS_BASE)
    return y, {'topGainDb': round(20 * np.log10(top_gain + 1e-12), 1), 'sideGain': round(float(g), 3), 'eqDb': eq}


def level(y, out, fade):
    if fade:
        a, b = int(0.05 * SR), int(1.0 * SR)
        y[:a] *= np.linspace(0, 1, a)[:, None]
        y[-b:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b)))[:, None]
    lufs, _ = rm.ebur(y)
    gain, ceil = rm.LUFS - lufs, -1.5
    for _ in range(6):
        z = rm.limit(y, gain, ceil)
        l2, tp = rm.ebur(z)
        if abs(l2 - rm.LUFS) > 0.1:
            gain += rm.LUFS - l2
            continue
        if tp <= rm.TP_MAX - 0.3:
            rm.ff_pipe(z, None, ('-y', '-codec:a', 'pcm_f32le', '-ar', str(SR), '-ac', '2', out))
            return {'lufs': l2, 'truePeakDb': tp, 'gainDb': round(gain, 2), 'ceilDb': ceil}
        ceil -= 0.3
    raise SystemExit(f'{out}: could not level')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--take', required=True)
    ap.add_argument('--render', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--window', nargs=2, type=float)
    ap.add_argument('--xover', type=float, default=4000.0)
    ap.add_argument('--fade', action='store_true')
    ap.add_argument('--min-corr', type=float, default=0.2,
                    help='refuse a take whose onset envelope correlates less than this with the render')
    a = ap.parse_args()
    take, render = load(a.take, a.window), load(a.render, a.window)
    n = min(len(take), len(render))
    take, render = take[:n], render[:n]
    lag, c = env_lag((render[:, 0] + render[:, 1]) / 2, (take[:, 0] + take[:, 1]) / 2)
    if c < a.min_corr:
        raise SystemExit(f'take and render do not line up (onset-envelope corr {c} at {lag} ms)')
    if lag:  # the take runs late (lag > 0) or early: move it onto the render, pad with silence
        s = int(round(lag * SR / 1000))
        take = np.concatenate([take[s:], np.zeros((s, 2))]) if s > 0 else np.concatenate([np.zeros((-s, 2)), take[:s]])
        lag2, c2 = env_lag((render[:, 0] + render[:, 1]) / 2, (take[:, 0] + take[:, 1]) / 2)
        if abs(lag2) > 2:
            raise SystemExit(f'alignment did not converge ({lag} ms, then {lag2} ms)')
    render, lags = local_warp(render, take)
    y, rep = rebuild(take, render, a.xover)
    rep['warpMs'] = {'min': min(lags), 'max': max(lags), 'windows': len(lags)}
    rep.update(level(y, a.out, a.fade))
    rep.update({'take': os.path.basename(a.take), 'render': os.path.basename(a.render), 'xoverHz': a.xover,
                'window': a.window, 'envLagMs': lag, 'envCorr': c})
    print(json.dumps(rep))


if __name__ == '__main__':
    main()
