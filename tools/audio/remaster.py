"""Remaster chain for Direction B renders: fixes "tinny and hollow" (Bailey, 2026-09-28).

Why (docs/audio/remaster-2026-09-29/README.md): the ACE-Step decode rebuilds each channel's
phase on its own, so left and right carry the same notes at the same levels but with
unrelated phase (L/R correlation ~0.05, side about equal to mid; a mono sum or a phone
speaker cancels much of it = hollow), and the energy sits in 250 Hz to 2.5 kHz with thin
lows and almost nothing above 6 kHz (= tinny). This chain repairs that after the fact.
Deterministic: numpy for the DSP, ffmpeg for loudness, the limiter and the MP3.

  python tools/audio/remaster.py --in SRC.wav --out OUT.mp3 --preset focus|hall|air
         [--loop START_S END_S] [--json REPORT.json]
  python tools/audio/remaster.py --batch jobs.json        (list of {in, out, preset, loop?})

Presets (each includes the one before):
  focus  1. phase repair: per STFT bin, both channels take one shared phase (the phase of
            L + R rotated onto L by their time-smoothed cross-spectrum) and keep their own
            magnitude, so panning survives and the pair becomes coherent;
         2. image: the original side (the model's decorrelated difference) returns as
            ambience; below 120 Hz the side is removed (mono bass); the total side is
            scaled to sit SIDE_DB under the mid (L/R correlation lands ~0.6 to 0.7);
         3. tone: a zero-phase EQ moves each band's share of the mid toward TARGET,
            clamped per band (lows up to +6 dB, 250 Hz-2.5 kHz cut up to 4 dB, nothing
            above 6 kHz changes); 4. -16 LUFS integrated, true peak <= -1 dBTP.
  hall   + a convolution hall (a stereo impulse response synthesized here: early
            reflections plus a noise tail with per-band decay, RT60 2.4 s low to 0.6 s top,
            seeded) mixed WET_DB under the dry; loops use circular convolution over the
            loop body so the tail wraps with the music.
  air    + a harmonic exciter (the 3-5 kHz band through a soft saturator; only the new
            harmonics above 6 kHz are mixed back, enough to bring the 6-12 kHz share of the mid
            to AIR_DB) and the EQ may lift 6-16 kHz by up to 4 dB.
Loops: loopStart/loopEnd are kept sample-exact; as in the Direction B render, the last beat
before loopEnd (--xfade) fades into the processed audio just before loopStart and the run-on
after loopEnd is an exact copy of the processed loop head. One-shots keep their length; the last second
gets a cosine fade so an added reverb tail cannot run past the original ending.
"""

import argparse
import json
import os
import re
import subprocess

import numpy as np

SR = 44100
FF = os.environ.get('FFMPEG', 'ffmpeg')
EDGES = [20, 80, 250, 800, 2500, 6000, 12000, 16000, 22050]
# Target share of mid energy per band, dB: an engineering choice (a music-typical long-term
# spectrum, about pink to 800 Hz and falling faster above), not a measurement of any record.
TARGET = [-10.0, -5.0, -5.0, -8.0, -14.0, -21.0, -30.0, -42.0]
LIMITS_BASE = [(-2, 6), (-2, 6), (-4, 2), (-4, 2), (-3, 3), (0, 0), (0, 0), (0, 0)]
LIMITS_AIR = [(-2, 6), (-2, 6), (-4, 2), (-4, 2), (-3, 3), (0, 4), (0, 4), (0, 0)]
PRESETS = {'focus': (False, False), 'hall': (True, False), 'air': (True, True)}
SIDE_DB = -8.0
MONO_BASS_HZ = 120.0
WET_DB = -12.0
AIR_DB = -26.0
LUFS = -16.0
TP_MAX = -1.0


# ---------- io ----------

def decode(path):
    raw = subprocess.run([FF, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(np.float64)


def ff_pipe(x, filters, out_args=('-f', 'f32le', '-')):
    """Run float stereo through an ffmpeg filter graph; returns bytes of stdout."""
    cmd = [FF, '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-']
    if filters:
        cmd += ['-af', filters]
    cmd += list(out_args)
    return subprocess.run(cmd, input=x.astype('<f4').tobytes(), capture_output=True, check=True).stdout


def ebur(path_or_x):
    if isinstance(path_or_x, str):
        cmd, inp = [FF, '-hide_banner', '-nostats', '-i', path_or_x], None
    else:
        cmd = [FF, '-hide_banner', '-nostats', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-']
        inp = path_or_x.astype('<f4').tobytes()
    err = subprocess.run(cmd + ['-af', 'ebur128=peak=true', '-f', 'null', '-'], input=inp,
                         capture_output=True).stderr.decode('utf-8', 'replace')
    tail = err[err.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+) LUFS', tail)
    p = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', tail)
    return float(i.group(1)), (float(p.group(1)) if p and p.group(1) != '-inf' else -120.0)


# ---------- filters (zero phase, whole file) ----------

def zp(x, gain):
    """Zero-phase filter along axis 0 with a magnitude response gain(freqs)."""
    n = len(x)
    spec = np.fft.rfft(x, axis=0)
    g = gain(np.fft.rfftfreq(n, 1 / SR))
    return np.fft.irfft(spec * g[:, None] if x.ndim == 2 else spec * g, n, axis=0)


def smoothstep(f, lo, hi):
    t = np.clip((np.log(np.maximum(f, 1e-3)) - np.log(lo)) / (np.log(hi) - np.log(lo)), 0, 1)
    return t * t * (3 - 2 * t)


def highpass(f0):
    return lambda f: smoothstep(f, f0 / 1.4, f0 * 1.4)


# ---------- 1. phase repair ----------

def stft(x, n, hop):
    w = np.sqrt(np.hanning(n + 1)[:-1])
    pad = np.pad(x, (n, n + hop))
    frames = (len(pad) - n) // hop
    idx = np.arange(n)[None, :] + hop * np.arange(frames)[:, None]
    return np.fft.rfft(pad[idx] * w, axis=1).astype(np.complex64)


def istft(X, n, hop, length):
    w = np.sqrt(np.hanning(n + 1)[:-1])
    frames = np.fft.irfft(X, n, axis=1) * w
    out = np.zeros(hop * (len(X) - 1) + n)
    for k in range(n // hop):  # overlap-add in n/hop vectorised passes
        sel = frames[k::n // hop]
        start = k * hop
        block = sel.reshape(-1)
        out[start:start + len(block)] += block[:len(out) - start]
    out /= (n / hop) / 2.0  # sqrt-hann^2 = hann sums to n/(2*hop)
    return out[n:n + length]


def repair(x, n=4096, hop=1024, smooth=9):
    XL, XR = stft(x[:, 0], n, hop), stft(x[:, 1], n, hop)
    cross = XL * np.conj(XR)
    c = np.cumsum(np.pad(cross, ((smooth // 2 + 1, smooth // 2), (0, 0))), axis=0)
    cs = c[smooth:] - c[:-smooth]
    mag = np.abs(cs)
    u = np.where(mag > 1e-12, cs / np.maximum(mag, 1e-12), 1.0).astype(np.complex64)
    ref = XL + XR * u
    ph = np.exp(1j * np.angle(ref)).astype(np.complex64)
    L = istft(np.abs(XL) * ph, n, hop, len(x))
    R = istft(np.abs(XR) * ph, n, hop, len(x))
    return np.stack([L, R], axis=1)


# ---------- 2. hall ----------

def synth_ir(seed=29, seconds=3.2):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = np.zeros((n, 2))
    pre = int(0.020 * SR)
    for ch in range(2):
        taps = np.sort(rng.uniform(0.004, 0.075, 14))
        for t in taps:
            ir[pre + int(t * SR), ch] += rng.choice([-1, 1]) * 0.55 * np.exp(-t / 0.05)
    # late tail: independent noise per channel, decay per band via STFT-domain envelopes
    nfft, hop = 1024, 256
    rt_f = np.array([0, 125, 250, 500, 1000, 2000, 4000, 8000, 16000, 22050])
    rt_s = np.array([2.4, 2.4, 2.35, 2.2, 2.0, 1.7, 1.3, 0.9, 0.6, 0.5])
    freqs = np.fft.rfftfreq(nfft, 1 / SR)
    rt = np.interp(freqs, rt_f, rt_s)
    for ch in range(2):
        noise = rng.standard_normal(n)
        X = stft(noise, nfft, hop).astype(np.complex128)
        t = (np.arange(len(X)) * hop - nfft) / SR
        t = np.maximum(t, 0)[:, None]
        X *= np.exp(-6.91 * t / rt[None, :])
        tail = istft(X, nfft, hop, n)
        onset = np.clip((np.arange(n) - pre - 0.01 * SR) / (0.06 * SR), 0, 1) ** 2
        ir[:, ch] += tail * onset * 0.9
    ir = zp(ir, highpass(180.0))
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))
    return ir


def fftconv(x, h, circular=False):
    n = len(x) if circular else len(x) + len(h) - 1
    size = n if circular else 1 << (n - 1).bit_length()
    if circular and len(h) > n:  # fold a long IR onto a short loop
        h = np.add.reduceat(np.pad(h, (0, -len(h) % n)).reshape(-1, n), [0], axis=0)[0]
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(h, size), size)
    return y[:len(x)]


def hall(x, loop):
    ir = synth_ir()
    wet = np.zeros_like(x)
    for ch in range(2):
        if loop is None:
            wet[:, ch] = fftconv(x[:, ch], ir[:, ch])
        else:
            ls, le = loop
            body = fftconv(x[ls:le, ch], ir[:, ch], circular=True)
            intro = fftconv(x[:ls, ch], ir[:, ch]) if ls > 0 else np.zeros(0)
            wet[ls:le, ch] = body
            wet[le:, ch] = body[:len(x) - le]
            if ls > 0:  # last 0.25 s of the intro hands over to the loop's own tail
                f = min(int(0.25 * SR), ls)
                a = np.sin(np.linspace(0, np.pi / 2, f))
                pre_img = body[len(body) - f:]
                intro[ls - f:] = intro[ls - f:] * np.cos(np.linspace(0, np.pi / 2, f)) + pre_img * a
                wet[:ls, ch] = intro
    ed, ew = np.mean(x ** 2), np.mean(wet ** 2)
    return x + wet * np.sqrt(10 ** (WET_DB / 10) * ed / max(ew, 1e-30))


# ---------- 3. image, tone, air ----------

def image(x, amb_side):
    m = (x[:, 0] + x[:, 1]) / 2
    s = (x[:, 0] - x[:, 1]) / 2 + amb_side
    s = zp(s, highpass(MONO_BASS_HZ))
    g = np.sqrt(10 ** (SIDE_DB / 10) * np.mean(m ** 2) / max(np.mean(s ** 2), 1e-30))
    s *= min(g, 2.0)
    return np.stack([m + s, m - s], axis=1), float(min(g, 2.0))


def band_shares(x):
    m = (x[:, 0] + x[:, 1]) / 2
    p = np.abs(np.fft.rfft(m)) ** 2
    f = np.fft.rfftfreq(len(m), 1 / SR)
    tot = p[f >= 20].sum()
    return [10 * np.log10(max(p[(f >= lo) & (f < hi)].sum() / tot, 1e-30)) for lo, hi in zip(EDGES, EDGES[1:])]


def tone(x, limits):
    meas = band_shares(x)
    gains = [float(np.clip(t - m, lo, hi)) for t, m, (lo, hi) in zip(TARGET, meas, limits)]
    centers = [np.sqrt(lo * hi) for lo, hi in zip(EDGES, EDGES[1:])]
    lc, lg = np.log(centers), np.array(gains)

    def resp(f):
        return 10 ** (np.interp(np.log(np.maximum(f, 1.0)), lc, lg) / 20)
    return zp(x, resp), [round(g, 1) for g in gains]


def excite(x, drive=4.0):
    """Soft-saturate the 3-5 kHz band and add back only the new harmonics above 6 kHz,
    mixed so the 6-12 kHz share of the mid reaches AIR_DB (never more than +12 dB of mix)."""
    # source band stops below 6 kHz, so everything the saturator leaves above 6 kHz is new
    band = zp(x, lambda f: smoothstep(f, 2200, 3200) * (1 - smoothstep(f, 5000, 6000)))
    rms = np.sqrt(np.mean(band ** 2)) + 1e-12
    sat = np.tanh(drive * band / (4 * rms)) * (4 * rms) / drive
    harm = zp(sat - band, lambda f: smoothstep(f, 5000, 7000) * (1 - smoothstep(f, 15000, 18000)))
    now = 10 ** (band_shares(x)[5] / 10)
    tot = np.mean(((x[:, 0] + x[:, 1]) / 2) ** 2)
    hm = np.mean(((harm[:, 0] + harm[:, 1]) / 2) ** 2) + 1e-30
    need = max(10 ** (AIR_DB / 10) - now, 0.0) * tot  # harmonics add ~incoherently
    g = min(np.sqrt(need / hm), 4.0)
    return x + g * harm, round(float(20 * np.log10(g + 1e-12)), 1)


# ---------- 4. level, loop, encode ----------

def limit(x, gain_db, ceil_db):
    filt = (f'volume={gain_db:.3f}dB,aresample=176400:resampler=soxr,'
            f'alimiter=limit={10 ** (ceil_db / 20):.5f}:attack=2:release=60:level=false:latency=true,'
            f'aresample={SR}:resampler=soxr')
    y = np.frombuffer(ff_pipe(x, filt), dtype='<f4').reshape(-1, 2).astype(np.float64)
    if len(y) < len(x):
        y = np.pad(y, ((0, len(x) - len(y)), (0, 0)))
    return y[:len(x)]


def finish(y, loop, one_shot_fade, xfade_s=0.5):
    if loop is not None:  # as the Direction B render did: the last beat before loopEnd fades
        ls, le = loop     # into the processed audio just before loopStart, run-on = loop head
        f = min(int(xfade_s * SR), ls, le - ls)
        a, b = y[le - f:le].copy(), y[ls - f:ls]
        rho = float(np.sum(a * b) / np.sqrt(np.sum(a * a) * np.sum(b * b) + 1e-30))
        t = np.linspace(0, 1, f)[:, None]
        wa, wb = (1 - t, t) if rho > 0.5 else (np.cos(t * np.pi / 2), np.sin(t * np.pi / 2))
        y[le - f:le] = a * wa + b * wb
        y[le:] = y[ls:ls + len(y) - le]
    elif one_shot_fade:
        f = int(1.0 * SR)
        y[-f:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, f)))[:, None]
    return y


def master(x, loop, out_mp3, one_shot_fade=True, xfade_s=0.5):
    lufs, _ = ebur(x)
    gain, ceil = LUFS - lufs, -1.5
    for _ in range(6):
        y = finish(limit(x, gain, ceil), loop, one_shot_fade, xfade_s)
        l2, _ = ebur(y)
        if abs(l2 - LUFS) > 0.1:
            gain += LUFS - l2
            continue
        ff_pipe(y, None, ('-y', '-codec:a', 'libmp3lame', '-b:a', '320k', '-ar', str(SR), '-ac', '2', out_mp3))
        l3, tp = ebur(out_mp3)
        if tp <= TP_MAX:
            return {'lufs': l3, 'tp': tp, 'gainDb': round(gain, 2), 'ceilDb': ceil}
        ceil -= 0.3
    raise SystemExit(f'{out_mp3}: could not meet {LUFS} LUFS / {TP_MAX} dBTP')


def flux_at_center(seq, n=2048, hop=512):
    m = seq.mean(axis=1)
    X = np.log(np.abs(stft(m, n, hop)) + 1e-6)
    d = np.maximum(X[1:] - X[:-1], 0).sum(axis=1)
    c = (len(m) // 2 + n) // hop  # first frame starting at the join (stft pads n in front)
    return float(d[c - 5:c + 1].max()), float(np.median(d))


def seam(y, loop):
    """Spectral flux over the wrap (loopEnd -> loopStart) against the first entry into
    the loop from the intro; ~1 means the join is no busier than the music itself."""
    if loop is None:
        return None
    ls, le = loop
    k = 8192
    wrap = np.concatenate([y[le - k:le], y[ls:ls + k]])
    entry = y[ls - k:ls + k]
    fw, _ = flux_at_center(wrap)
    fe, med = flux_at_center(entry)
    return {'fluxWrapVsEntry': round(fw / max(fe, 1e-9), 2), 'fluxWrapVsMedian': round(fw / max(med, 1e-9), 2),
            'stepAtWrap': round(float(np.max(np.abs(y[ls] - y[le - 1]))), 4)}


def process(src, out, preset, loop_s=None, xfade_s=0.5):
    use_hall, use_air = PRESETS[preset]
    x = decode(src)
    loop = None if not loop_s else (int(round(loop_s[0] * SR)), int(round(loop_s[1] * SR)))
    orig_side = (x[:, 0] - x[:, 1]) / 2
    y = repair(x)
    rep_side_ratio = float(np.mean(((y[:, 0] - y[:, 1]) / 2) ** 2) / np.mean(((y[:, 0] + y[:, 1]) / 2) ** 2))
    y = y + np.stack([orig_side, -orig_side], axis=1)  # ambience returns on the side only
    if use_hall:
        y = hall(y, loop)
    y, side_gain = image(y, 0.0)
    air_db = None
    if use_air:
        y, air_db = excite(y)
    y, eq = tone(y, LIMITS_AIR if use_air else LIMITS_BASE)
    lev = master(y, loop, out, True, xfade_s)
    back = decode(out)[:len(x)]
    rep = {'in': os.path.basename(src), 'out': os.path.basename(out), 'preset': preset,
           'samples': len(x), 'outSamples': int(len(decode(out))), 'repairedSideMidDb': round(10 * np.log10(rep_side_ratio + 1e-30), 1),
           'sideGain': round(side_gain, 3), 'exciterMixDb': air_db, 'eqDb': eq, **lev, 'seam': seam(back, loop),
           'loop': list(loop) if loop else None}
    print(json.dumps(rep))
    return rep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='src')
    ap.add_argument('--out')
    ap.add_argument('--preset', choices=list(PRESETS), default='focus')
    ap.add_argument('--loop', nargs=2, type=float)
    ap.add_argument('--xfade', type=float, default=0.5, help='loop: seconds (one beat) of seam crossfade')
    ap.add_argument('--batch')
    ap.add_argument('--json')
    a = ap.parse_args()
    jobs = json.load(open(a.batch, encoding='utf-8')) if a.batch else [
        {'in': a.src, 'out': a.out, 'preset': a.preset, 'loop': a.loop, 'xfade': a.xfade}]
    reps = [process(j['in'], j['out'], j['preset'], j.get('loop'), j.get('xfade', 0.5)) for j in jobs]
    if a.json:
        with open(a.json, 'w', encoding='utf-8') as fh:
            json.dump(reps, fh, indent=1)


if __name__ == '__main__':
    main()
