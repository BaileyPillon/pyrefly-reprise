"""SFX parity: pack one game's (or one boss's) recorded originals into a parity pack the game plays.

The third SFX source (`manifest.sfxParity.packs`, src/audio/manifest.ts; decision 52m). A pack is one MP3 of cues
laid out the way the other sprites are (50 ms lead, 50 ms gaps, LAME VBR through ffmpeg with the gapless header) plus
the manifest fragment the game reads: {file, bytes, duration, quality, cues{offset, duration, category, game, lufs,
truePeakDb, specRow, take, onsetMs, peakMs}}.

  python tools/audio/sfx-parity-sprite.py --pack ffx2-leblanc --picks <picks.json> --work <dir> [--q 0] [--install]

picks.json     {"pack": "ffx2-leblanc", "cues": [{"cue": "swing-greatsword", "game": "ffx2", "category": "weapon",
               "specRow": "ffx2.lb.warrior.swing", "take": "ffx2.lb.warrior.swing.v1", "audio": "<mastered file>",
               "onsetMs": 0, "peakMs": 70}, ...]}. `audio` is the cue after trim, fades and levelling
               (sfx-pilot's process.py or its successor), 44.1 kHz; mono is laid out dual-mono.
--q            libmp3lame -q:a (VBR quality; 0 = V0)
--install      copy the MP3 to public/audio/sfx/parity-<pack>.mp3 and merge the fragment into
               public/audio/manifest.json under sfxParity.packs.<pack> (nothing else in the manifest is touched)

The measured `lufs` and `truePeakDb` come from the project's own meter (sfx-parity-measure.mjs), per cue, on what the
pack decodes to. A cue whose decoded slice reads over -1.1 dBTP is trimmed by the overshoot and the pack re-encoded,
until none does (the same loop sfx-v2-sprite.py runs). The packs together stay inside the audio budget
(manifest-io.mjs AUDIO_BUDGET_BYTES) and each under the 5 MB sprite gate; both are re-checked by tools/audio/qa.mjs
and tests/unit/audio-sfx-parity.test.ts.

Needs numpy and ffmpeg (no soundfile or scipy). Game case (AGENTS.md rule 14): the packing is shared plumbing (both);
a pack is one game's (its name starts `ffx-` or `ffx2-`), and every cue names its own game.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FFMPEG = os.environ.get('FFMPEG_PATH', 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe')
FFPROBE = os.environ.get('FFPROBE_PATH', os.path.join(os.path.dirname(FFMPEG), 'ffprobe.exe'))
SR = 44100
LEAD, GAP = 0.05, 0.05
CEILING = -1.1
PACK_NAME = re.compile(r'^(ffx|ffx2)-[a-z0-9]+(?:-[a-z0-9]+)*$')
CLASS_ORDER = ['ui', 'weapon', 'impact', 'spell', 'flourish', 'ambience']


def channels(path):
    out = subprocess.run([FFPROBE, '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', path], capture_output=True, check=True, text=True).stdout
    return int(out.strip().splitlines()[0])


def read(path):
    """Decode any audio file to float32 stereo at 44.1 kHz through ffmpeg. A mono file is laid out dual-mono (L = R =
    the mono signal): ffmpeg's own mono-to-stereo upmix would take 3 dB off, and the meter reads a dual-mono cue as the
    game plays it."""
    if channels(path) == 1:
        raw = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
        return np.repeat(np.frombuffer(raw, dtype='<f4').reshape(-1, 1), 2, axis=1).copy()
    raw = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').reshape(-1, 2).copy()


def measure(x, work):
    """The project's meter on a stereo float array: {'lufs', 'truePeakDb'}."""
    tmp = os.path.join(work, '_measure.f32')
    np.ascontiguousarray(x, dtype='<f4').tofile(tmp)
    out = subprocess.run(['node', os.path.join(HERE, 'sfx-parity-measure.mjs'), tmp, str(SR)], capture_output=True, check=True, text=True).stdout
    return json.loads(out)


def layout(pack, trims):
    """Concatenate the cues (class order, then name) with the lead and the gaps; return audio and manifest cues."""
    order = sorted(pack['cues'], key=lambda c: (CLASS_ORDER.index(c['category']), c['cue']))
    parts = [np.zeros((int(LEAD * SR), 2), np.float32)]
    cues = {}
    t = int(LEAD * SR)
    for c in order:
        x = c['_x'] * np.float32(10 ** (trims.get(c['cue'], 0.0) / 20))
        entry = {
            'offset': round(t / SR, 6),
            'duration': round(len(x) / SR, 6),
            'category': c['category'],
            'game': c['game'],
            'specRow': c['specRow'],
            'take': c['take'],
        }
        for k in ('onsetMs', 'peakMs'):
            if c.get(k) is not None:
                entry[k] = c[k]
        cues[c['cue']] = entry
        parts.append(x)
        parts.append(np.zeros((int(GAP * SR), 2), np.float32))
        t += len(x) + int(GAP * SR)
    return np.concatenate(parts), cues


def encode(x, work, name, q):
    wav = os.path.join(work, f'parity-{name}.f32')
    np.ascontiguousarray(x, dtype='<f4').tofile(wav)
    mp3 = os.path.join(work, f'parity-{name}-q{q}.mp3')
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', wav,
                    '-codec:a', 'libmp3lame', '-q:a', str(q), mp3], check=True)
    return mp3


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pack', required=True)
    ap.add_argument('--picks', required=True)
    ap.add_argument('--work', required=True)
    ap.add_argument('--q', default='0')
    ap.add_argument('--install', action='store_true')
    a = ap.parse_args()
    if not PACK_NAME.match(a.pack):
        sys.exit(f'--pack {a.pack}: a pack is "ffx-<name>" or "ffx2-<name>" (lower case, dashes)')
    os.makedirs(a.work, exist_ok=True)
    pack = json.load(open(a.picks, encoding='utf-8'))
    if pack.get('pack') != a.pack:
        sys.exit(f'{a.picks} is for pack {pack.get("pack")}, not {a.pack}')
    game_of_pack = a.pack.split('-')[0]
    for c in pack['cues']:
        if c['game'] not in ('both', game_of_pack):
            sys.exit(f'{c["cue"]}: game {c["game"]} does not belong in pack {a.pack}')
        c['_x'] = read(c['audio'])
    trims = {}
    for attempt in range(6):
        x, cues = layout(pack, trims)
        mp3 = encode(x, a.work, a.pack, a.q)
        y = read(mp3)
        over = {}
        for key, c in cues.items():
            i0, i1 = int(c['offset'] * SR), int((c['offset'] + c['duration']) * SR)
            tp = measure(y[max(0, i0 - 64): i1 + 64], a.work)['truePeakDb']
            if tp > CEILING:
                over[key] = tp
        print(f'pass {attempt}: {len(over)} cue(s) over {CEILING} dBTP after the encode', {k: round(v, 2) for k, v in over.items()})
        if not over:
            break
        for key, tp in over.items():
            trims[key] = float(trims.get(key, 0.0) - (tp - CEILING) - 0.05)
    for key, c in cues.items():
        i0, i1 = int(c['offset'] * SR), int((c['offset'] + c['duration']) * SR)
        m = measure(y[i0:i1], a.work)
        c['lufs'] = round(m['lufs'], 2)
        c['truePeakDb'] = round(m['truePeakDb'], 2)
        if trims.get(key):
            c['trimDb'] = round(trims[key], 2)
    frag = {
        'file': f'sfx/parity-{a.pack}.mp3',
        'bytes': os.path.getsize(mp3),
        'duration': round(len(x) / SR, 6),
        'quality': f'libmp3lame -q:a {a.q}',
        'cues': cues,
    }
    with open(os.path.join(a.work, f'parity-{a.pack}-q{a.q}.json'), 'w', encoding='utf-8') as f:
        json.dump(frag, f, indent=1)
    tmp = os.path.join(a.work, '_measure.f32')
    if os.path.exists(tmp):
        os.remove(tmp)
    print(f'parity pack {a.pack} q{a.q}: {len(cues)} cues, {frag["duration"]:.1f} s, {frag["bytes"]} bytes')
    if frag['bytes'] >= 5e6:
        sys.exit(f'{a.pack}: {frag["bytes"]} bytes is over the 5 MB sprite gate; cut the pack in two')
    if a.install:
        shutil.copyfile(mp3, os.path.join(ROOT, 'public', 'audio', 'sfx', f'parity-{a.pack}.mp3'))
        man_path = os.path.join(ROOT, 'public', 'audio', 'manifest.json')
        with open(man_path, encoding='utf-8') as f:
            man = json.load(f)
        man.setdefault('sfxParity', {}).setdefault('packs', {})[a.pack] = frag
        with open(man_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(json.dumps(man, indent=2, ensure_ascii=False) + '\n')
        print(f'installed public/audio/sfx/parity-{a.pack}.mp3 and manifest.sfxParity.packs.{a.pack}')


if __name__ == '__main__':
    main()
