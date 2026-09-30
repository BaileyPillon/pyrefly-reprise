"""SFX v2 (the recorded set, D-302): pack the set into the second sprite the game plays.

Bailey, 2026-09-30 ~14:25 EDT: "I'll go with all your recommendations" (the new recorded, layered SFX
set with the full hookup). The set itself is built outside the repo, in
D:/Tools/pyrefly-scratch/audio-0930/sfx (README, recipes, lossless FLAC per cue, the set's own QA);
this tool packs its lossless cues into one sprite exactly the way the shipped sprite is packed (50 ms
lead, 50 ms gaps, LAME VBR through ffmpeg with the gapless header), and writes the manifest fragment
the game reads as `sfxV2` (src/audio/manifest.ts): {file, bytes, duration, quality, cues{offset,
duration, category, lufs, truePeakDb, game}}.

  python tools/audio/sfx-v2-sprite.py --work <dir> [--q 0] [--install]

--q       libmp3lame -q:a (VBR quality; 0 = V0)
--install copy the MP3 to public/audio/sfx/sprite-v2.mp3 and merge the fragment into
          public/audio/manifest.json (key `sfxV2`; nothing else in the manifest is touched)

Needs numpy + soundfile (the set's venv: D:/Tools/venvs/sfx-0930/Scripts/python.exe) and ffmpeg.
Game case (AGENTS.md rule 14): the packing is shared plumbing (both); each cue keeps its own game
('ffx', 'ffx2' or 'both') from the set's measure.json.
"""

import argparse
import json
import os
import shutil
import subprocess

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SET = 'D:/Tools/pyrefly-scratch/audio-0930/sfx/set'
FFMPEG = os.environ.get('FFMPEG_PATH', 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe')
SR = 44100
LEAD, GAP = 0.05, 0.05
# Pack order: classes grouped the way the shipped sprite groups them (menus first, then battle), so a
# partly decoded sprite never matters (the game decodes the whole file before using any slice).
CLASS_ORDER = ['ui', 'weapon', 'impact', 'spell', 'flourish', 'ambience']


def load(path):
    x, sr = sf.read(path, always_2d=True, dtype='float32')
    if sr != SR:
        raise SystemExit(f'{path}: {sr} Hz, the set is {SR} Hz')
    return x[:, :2] if x.shape[1] >= 2 else np.repeat(x, 2, axis=1)


def pack(measure, trims=None):
    trims = trims or {}
    keys = sorted(measure, key=lambda k: (CLASS_ORDER.index(measure[k]['cls']), k))
    parts = [np.zeros((int(LEAD * SR), 2), np.float32)]
    cues = {}
    t = int(LEAD * SR)
    for key in keys:
        x = load(os.path.join(SET, 'flac', key + '.flac')) * np.float32(10 ** (trims.get(key, 0.0) / 20))
        m = measure[key]
        cues[key] = {
            'offset': round(t / SR, 6),
            'duration': round(len(x) / SR, 6),
            'category': m['cls'],
            'game': m['game'],
            'lufs': round(m['momentary_max'] + trims.get(key, 0.0), 2),
            'truePeakDb': round(m['tp_dbtp'] + trims.get(key, 0.0), 2),
        }
        if trims.get(key):
            cues[key]['trimDb'] = round(trims[key], 2)
        parts.append(x)
        parts.append(np.zeros((int(GAP * SR), 2), np.float32))
        t += len(x) + int(GAP * SR)
    return np.concatenate(parts), cues


def decode(path):
    raw = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)


def true_peak_db(x):
    from scipy.signal import resample_poly
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.abs(up).max() + 1e-12)


def encode(x, a):
    flac = os.path.join(a.work, 'sprite-v2.flac')
    sf.write(flac, x, SR, subtype='PCM_24')
    mp3 = os.path.join(a.work, f'sprite-v2-q{a.q}.mp3')
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', flac, '-ar', str(SR), '-ac', '2',
                    '-codec:a', 'libmp3lame', '-q:a', str(a.q), mp3], check=True)
    return mp3


# The encoder's own overshoot: a cue mastered to -1 dBTP can decode a few tenths over it. Each cue whose
# decoded slice reads over CEILING is trimmed by the overshoot (and the whole pack re-encoded) until none does.
CEILING = -1.1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--work', required=True)
    ap.add_argument('--q', default='0')
    ap.add_argument('--install', action='store_true')
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    measure = json.load(open(os.path.join(SET, 'measure.json')))
    trims = {}
    for attempt in range(6):
        x, cues = pack(measure, trims)
        mp3 = encode(x, a)
        y = decode(mp3)
        over = {}
        for key, c in cues.items():
            i0, i1 = int(c['offset'] * SR), int((c['offset'] + c['duration']) * SR)
            tp = true_peak_db(y[max(0, i0 - 64): i1 + 64])
            if tp > CEILING:
                over[key] = tp
        print(f'pass {attempt}: {len(over)} cue(s) over {CEILING} dBTP after the encode', {k: round(v, 2) for k, v in over.items()})
        if not over:
            break
        for key, tp in over.items():
            trims[key] = float(trims.get(key, 0.0) - (tp - CEILING) - 0.05)
    frag = {
        'file': 'sfx/sprite-v2.mp3',
        'bytes': os.path.getsize(mp3),
        'duration': round(len(x) / SR, 6),
        'quality': f'libmp3lame -q:a {a.q}',
        'cues': cues,
    }
    with open(os.path.join(a.work, f'sprite-v2-q{a.q}.json'), 'w') as f:
        json.dump(frag, f, indent=1)
    print(f'sprite-v2 q{a.q}: {len(cues)} cues, {frag["duration"]:.1f} s, {frag["bytes"]} bytes')
    if a.install:
        shutil.copyfile(mp3, os.path.join(ROOT, 'public', 'audio', 'sfx', 'sprite-v2.mp3'))
        man_path = os.path.join(ROOT, 'public', 'audio', 'manifest.json')
        with open(man_path, encoding='utf-8') as f:
            man = json.load(f)
        man['sfxV2'] = frag
        with open(man_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(json.dumps(man, indent=2, ensure_ascii=False) + '\n')
        print('installed public/audio/sfx/sprite-v2.mp3 and manifest.sfxV2')


if __name__ == '__main__':
    main()
