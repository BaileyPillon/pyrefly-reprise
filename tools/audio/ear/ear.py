#!/usr/bin/env python3
"""Pyrefly automated "ear": a SCREEN for music and SFX renders, never a verdict.

Agents cannot hear (AGENTS.md rule 13). This scores audio files with three independent
instruments and writes JSON, so that a render that measures badly can be caught before
Bailey spends his ears on it. It never says how something sounds; Bailey does.

  1. Meta audiobox-aesthetics (CC-BY-4.0): predicted Production Quality (PQ), Production
     Complexity (PC), Content Enjoyment (CE), Content Usefulness (CU), each on a 1-10 scale,
     averaged over 10 s windows (the model's own windowing).
  2. LAION CLAP "clap-htsat-unfused" (Apache-2.0; "larger_clap_music" was tried and its
     embeddings collapse to one point in this stack, see README): cosine similarity between the audio and
     text prompts; `clap.contrast` = mean(positive prompts) - mean(negative prompts).
  3. Plain DSP: integrated loudness, short-term loudness range, crest factor, stereo
     correlation and side level, spectral band shares, 99 % roll-off, quiet-passage hiss.

By default every file is loudness-matched to -16 LUFS before the models see it, so a
louder file does not score higher for being louder. DSP loudness figures are measured
BEFORE that normalisation.

Usage (the venv lives on D:, see tools/audio/ear/README.md):
  python tools/audio/ear/ear.py a.mp3 b.wav --out scores.json
  python tools/audio/ear/ear.py --list files.tsv --out scores.json   # lines: path<TAB>group
  options: --window full|first|loudest  --seconds 60  --no-clap  --no-aes  --no-norm

Models are read from $PYREFLY_EAR_MODELS (default D:/Tools/audio-libs): subfolders
audiobox-aesthetics/ and clap-htsat-unfused/. Nothing is downloaded at run time.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

SR = 48000
MODELS = Path(os.environ.get("PYREFLY_EAR_MODELS", "D:/Tools/audio-libs"))
TARGET_LUFS = -16.0

CLAP_POS = [
    "epic orchestral boss battle music, professionally recorded",
    "a live symphony orchestra recorded in a concert hall",
    "professionally mixed and mastered rock band recording",
    "high quality cinematic video game soundtrack",
]
CLAP_NEG = [
    "cheap MIDI music with general MIDI instruments",
    "tinny, thin and hollow sounding audio",
    "hissy, noisy, low quality recording",
    "retro 16-bit video game music",
    "AI generated music with artifacts",
]


def decode(path: str, offset: float = 0.0, seconds: float | None = None) -> np.ndarray:
    """Decode any ffmpeg-readable file to float32 stereo at 48 kHz, shape (n, 2)."""
    cmd = ["ffmpeg", "-v", "error", "-nostdin"]
    if offset > 0:
        cmd += ["-ss", f"{offset:.3f}"]
    cmd += ["-i", path]
    if seconds:
        cmd += ["-t", f"{seconds:.3f}"]
    cmd += ["-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2", "-ar", str(SR), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    if x.shape[0] < SR // 2:
        raise ValueError(f"{path}: under 0.5 s of audio decoded")
    return x.copy()


def pick_window(x: np.ndarray, mode: str, seconds: float) -> tuple[np.ndarray, float]:
    n = int(seconds * SR)
    if mode == "full" or x.shape[0] <= n:
        return x, 0.0
    if mode == "first":
        return x[:n], 0.0
    # loudest: the window with the highest mean energy, stepped by 1 s
    p = (x.astype(np.float64) ** 2).mean(1)
    whole = len(p) // SR
    e = p[:whole * SR].reshape(whole, SR).sum(1)  # energy per 1 s block
    csum = np.concatenate([[0.0], np.cumsum(e)])
    k = max(1, int(seconds))
    best = int(np.argmax(csum[k:] - csum[:-k])) if len(e) > k else 0
    start = best * SR
    return x[start:start + n], float(best)


def dsp_metrics(x: np.ndarray) -> dict:
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    lufs = float(meter.integrated_loudness(x))
    # short-term (3 s, 1 s hop) loudness range, EBU-like 10th to 95th percentile
    st = []
    for i in range(0, max(1, x.shape[0] - 3 * SR), SR):
        seg = x[i:i + 3 * SR]
        if seg.shape[0] >= 3 * SR:
            v = meter.integrated_loudness(seg)
            if np.isfinite(v) and v > -70:
                st.append(v)
    lra = float(np.percentile(st, 95) - np.percentile(st, 10)) if len(st) > 3 else None
    mono = x.mean(1)
    peak = float(np.abs(x).max())
    rms = float(np.sqrt((x ** 2).mean()))
    L, R = x[:, 0], x[:, 1]
    denom = float(np.sqrt((L ** 2).sum() * (R ** 2).sum())) or 1e-12
    corr = float((L * R).sum() / denom)
    mid, side = (L + R) / 2, (L - R) / 2
    side_db = 10 * np.log10(((side ** 2).mean() + 1e-12) / ((mid ** 2).mean() + 1e-12))
    # level lost when L and R are summed to mono (0 dB for mono content, 3 dB for unrelated L/R)
    mono_loss = 10 * np.log10((((L ** 2).mean() + (R ** 2).mean()) / 2 + 1e-12) / ((mid ** 2).mean() + 1e-12))
    # spectrum: averaged power over 8192-sample Hann frames
    nfft = 8192
    frames = [mono[i:i + nfft] for i in range(0, len(mono) - nfft, nfft // 2)]
    if not frames:
        frames = [np.pad(mono, (0, nfft - len(mono)))]
    win = np.hanning(nfft)
    F = np.array([np.abs(np.fft.rfft(f * win)) ** 2 for f in frames])
    freqs = np.fft.rfftfreq(nfft, 1 / SR)
    P = F.mean(0)
    tot = P.sum() + 1e-20
    bands = {"sub_lt120": (0, 120), "low_120_250": (120, 250), "mid_250_2k5": (250, 2500),
             "pres_2k5_6k": (2500, 6000), "air_6k_12k": (6000, 12000), "top_gt12k": (12000, SR / 2)}
    shares = {k: round(float(P[(freqs >= a) & (freqs < b)].sum() / tot), 4) for k, (a, b) in bands.items()}
    cum = np.cumsum(P) / tot
    rolloff = float(freqs[np.searchsorted(cum, 0.99)])
    # hiss proxy: in the quietest 20 % of frames, 4-10 kHz level relative to the whole frame
    fe = F.sum(1)
    q = F[fe <= np.percentile(fe, 20)]
    hb = (freqs >= 4000) & (freqs < 10000)
    hiss = float(10 * np.log10((q[:, hb].sum() + 1e-20) / (q.sum() + 1e-20))) if len(q) else None
    # spectral flatness in the 4-10 kHz band of the quiet frames (1 = white noise)
    if len(q):
        qb = q[:, hb].mean(0) + 1e-20
        flat = float(np.exp(np.log(qb).mean()) / qb.mean())
    else:
        flat = None
    return {
        "lufs": round(lufs, 2), "lra_lu": None if lra is None else round(lra, 2),
        "peak_dbfs": round(20 * np.log10(peak + 1e-12), 2),
        "crest_db": round(20 * np.log10((peak + 1e-12) / (rms + 1e-12)), 2),
        "lr_corr": round(corr, 3), "side_vs_mid_db": round(float(side_db), 2),
        "mono_sum_loss_db": round(float(mono_loss), 2),
        "band_share": shares, "rolloff99_hz": round(rolloff),
        "quiet_hiss_4k_10k_db": None if hiss is None else round(hiss, 2),
        "quiet_hf_flatness": None if flat is None else round(flat, 3),
    }


# Screen thresholds, from the 2026-09-30 calibration (calibration.md): each is the edge of the
# range the nine free-licensed professional reference recordings occupied (the stereo one is
# the exception: three of the nine references also exceed it). A flag is a reason to
# look, never a verdict.
SCREEN = {
    "air_6k_12k_min": 0.001,   # references 0.0010 to 0.0123; 24 of 26 shipped cues below
    "pc_min": 5.9,             # audiobox Production Complexity, references 5.93 to 6.61
    "mono_loss_max_db": 2.0,   # ACE-Step v1 sketches 2.5 to 2.9 dB; shipped cues 0.4 to 0.9; 3 of 9 refs 2.1 to 2.9
}


def screen(rec: dict) -> list[str]:
    flags = []
    dsp, aes = rec.get("dsp", {}), rec.get("aes", {})
    air = dsp.get("band_share", {}).get("air_6k_12k")
    if air is not None and air < SCREEN["air_6k_12k_min"]:
        flags.append(f"top end: 6-12 kHz share {air:.4f} is below every reference")
    if aes.get("PC") is not None and aes["PC"] < SCREEN["pc_min"]:
        flags.append(f"arrangement: predicted Production Complexity {aes['PC']:.2f} is below every reference")
    ml = dsp.get("mono_sum_loss_db")
    if ml is not None and ml > SCREEN["mono_loss_max_db"]:
        flags.append(f"stereo: mono sum loses {ml:.1f} dB (decorrelated left and right)")
    return flags


def normalise(x: np.ndarray) -> np.ndarray:
    import pyloudnorm as pyln
    lufs = pyln.Meter(SR).integrated_loudness(x)
    if not np.isfinite(lufs):
        return x
    y = x * (10 ** ((TARGET_LUFS - lufs) / 20))
    pk = np.abs(y).max()
    y = y / pk * 0.999 if pk > 0.999 else y  # scaling only, no limiter colour
    return y.astype(np.float32)


class Aes:
    def __init__(self):
        import torch
        from audiobox_aesthetics.model.aes import AesMultiOutput
        from audiobox_aesthetics.infer import AXES_NAME, make_inference_batch
        self.torch, self.axes, self.batcher = torch, AXES_NAME, make_inference_batch
        self.model = AesMultiOutput.from_pretrained(str(MODELS / "audiobox-aesthetics")).eval()
        tt = self.model.target_transform
        self.tt = {a: (tt[a]["mean"], tt[a]["std"]) for a in AXES_NAME}

    def score(self, x: np.ndarray) -> dict:
        torch = self.torch
        import torchaudio.functional as AF
        wav = torch.from_numpy(x.mean(1, keepdims=True).T.copy())
        wav = AF.resample(wav, SR, 16000)
        wavs, masks, weights, _ = self.batcher([wav], 10, 10, sample_rate=16000)
        out = {a: [] for a in self.axes}
        w = torch.tensor(weights)
        with torch.inference_mode():
            for i in range(0, len(wavs), 8):
                p = self.model({"wav": torch.stack(wavs[i:i + 8]), "mask": torch.stack(masks[i:i + 8])})
                for a in self.axes:
                    m, s = self.tt[a]
                    out[a].append(p[a].float().reshape(-1) * s + m)
        res = {}
        for a in self.axes:
            v = torch.cat(out[a])
            res[a] = round(float((v * w).sum() / w.sum()), 3)
            res[a + "_min10s"] = round(float(v[w > 0.5].min() if (w > 0.5).any() else v.min()), 3)
        return res


class Clap:
    def __init__(self):
        import torch
        from transformers import ClapModel, ClapProcessor
        d = str(MODELS / "clap-htsat-unfused")
        self.torch = torch
        self.model = ClapModel.from_pretrained(d).eval()
        self.proc = ClapProcessor.from_pretrained(d)
        with torch.inference_mode():
            t = self.proc(text=CLAP_POS + CLAP_NEG, return_tensors="pt", padding=True)
            e = self.model.get_text_features(**t)
            e = getattr(e, "pooler_output", e)
            self.text = torch.nn.functional.normalize(e, dim=-1)

    def score(self, x: np.ndarray) -> dict:
        torch = self.torch
        mono = x.mean(1)
        n = 10 * SR
        chunks = [mono[i:i + n] for i in range(0, max(1, len(mono) - n // 2), n)][:12]
        with torch.inference_mode():
            f = self.proc.feature_extractor(chunks, sampling_rate=SR, return_tensors="pt")
            a = self.model.get_audio_features(input_features=f["input_features"], is_longer=f.get("is_longer"))
            a = getattr(a, "pooler_output", a)
            a = torch.nn.functional.normalize(a, dim=-1).mean(0)
            a = torch.nn.functional.normalize(a, dim=0)
            sims = (self.text @ a).tolist()
        labels = CLAP_POS + CLAP_NEG
        pos = sims[:len(CLAP_POS)]
        neg = sims[len(CLAP_POS):]
        return {"contrast": round(float(np.mean(pos) - np.mean(neg)), 4),
                "sims": {labels[i]: round(s, 4) for i, s in enumerate(sims)}}


def read_list(path: str) -> list[tuple[str, str]]:
    rows = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            p, _, g = line.partition("\t")
            rows.append((p.strip(), g.strip()))
    return rows


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="*")
    ap.add_argument("--list", help="TSV: path<TAB>group per line")
    ap.add_argument("--out", help="JSON output file (default: stdout)")
    ap.add_argument("--window", choices=["full", "first", "loudest"], default="full")
    ap.add_argument("--seconds", type=float, default=60.0, help="window length for first/loudest")
    ap.add_argument("--max-seconds", type=float, default=600.0, help="decode at most this much")
    ap.add_argument("--no-clap", action="store_true")
    ap.add_argument("--no-aes", action="store_true")
    ap.add_argument("--no-norm", action="store_true", help="do not loudness-match before the models")
    a = ap.parse_args(argv)
    items = [(f, "") for f in a.files] + (read_list(a.list) if a.list else [])
    if not items:
        ap.error("no input files")
    aes = None if a.no_aes else Aes()
    clap = None if a.no_clap else Clap()
    results = []
    for path, group in items:
        t0 = time.time()
        rec: dict = {"file": path, "group": group}
        try:
            x = decode(path, seconds=a.max_seconds)
            rec["duration_s"] = round(x.shape[0] / SR, 2)
            x, off = pick_window(x, a.window, a.seconds)
            rec["window"] = {"mode": a.window, "offset_s": off, "length_s": round(x.shape[0] / SR, 2)}
            rec["dsp"] = dsp_metrics(x)
            y = x if a.no_norm else normalise(x)
            if aes:
                rec["aes"] = aes.score(y)
            if clap:
                rec["clap"] = clap.score(y)
        except Exception as e:  # keep going; one bad file must not sink a batch
            rec["error"] = f"{type(e).__name__}: {e}"
        if "error" not in rec:
            rec["screen"] = screen(rec)
        rec["secs"] = round(time.time() - t0, 1)
        print(f"[ear] {Path(path).name}: " + (rec.get("error") or
              f"PQ {rec.get('aes', {}).get('PQ')} CE {rec.get('aes', {}).get('CE')} "
              f"clap {rec.get('clap', {}).get('contrast')}"), file=sys.stderr)
        results.append(rec)
    doc = {"tool": "pyrefly-ear 1", "note": "a screen, not a verdict; Bailey judges by ear",
           "window": a.window, "seconds": a.seconds, "normalised_to_lufs": None if a.no_norm else TARGET_LUFS,
           "results": results}
    text = json.dumps(doc, indent=1)
    if a.out:
        Path(a.out).write_text(text, encoding="utf-8")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
