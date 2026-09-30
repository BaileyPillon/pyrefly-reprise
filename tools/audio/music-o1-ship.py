"""Music O1 (D-292): re-encode every shipped music cue at LAME V0 from its lossless master.

Bailey, 2026-09-29: "yes, all your recommendations" (recommendation 1: O1 now for the whole score,
the same R1 music re-encoded at a high MP3 quality). Nothing about the sound changes except the
final encode: the chain is the one that produced the shipped file (docs/audio/soundtrack-r1-2026-09-29.json),
so the loop points, the seam crossfade, the 3 s run-on, the -16 LUFS gain and the score fingerprint all
carry over. tools/audio/r1-encode.py runs that chain with the encode swapped; this script chooses the
source of each of the 26 cues and runs three encodes of it:

  wav   the lossless twin (float), the reference the coding error is measured against
  q5    the shipped setting; its bytes must equal the file in public/audio/music, which proves the
        twin is what the shipped encoder was given (the reproduction check)
  v0    libmp3lame -q:a 0, the new file

Sources:
  23 cues          the Direction B master, through remaster R1 "focus" (r1-encode.py, the R1 report)
  scene-macalania-temple   sketch A master through the same chain (docs/audio/scene-macalania-temple-2026-09-29.json)
  boss-vegnagun, scene-bevelle-underground   never went through R1 (the stereo gate), so they ship the
        sampled render: the lossless twin is `render.mjs --wav`, which reproduces the shipped bytes at q5.

  python tools/audio/music-o1-ship.py --all --work D:/Tools/pyrefly-scratch/picks-0930/music-o1/work [--jobs 3]
  python tools/audio/music-o1-ship.py --cue boss-seymour --work <dir>
  python tools/audio/music-o1-ship.py --install --work <dir>   # copy every V0 file into public/audio/music and
                                                               # update bytes / lufs / truePeakDb in the manifest

Game case (AGENTS.md rule 14): shared audio plumbing, BOTH.
"""

import argparse
import shutil
import concurrent.futures
import hashlib
import importlib.util
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
_spec = importlib.util.spec_from_file_location('r1_encode', os.path.join(HERE, 'r1-encode.py'))
r1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(r1)

SCRATCH = 'D:/Tools/pyrefly-scratch/picks-0930/music-o1'
MASTER_DIR = 'D:/Tools/pyrefly-scratch/direction-b-0927-work/master'
MANIFEST = os.path.join(ROOT, 'public', 'audio', 'manifest.json')
SR = 44100

TEMPLE = {
    'cue': 'scene-macalania-temple',
    'source': MASTER_DIR + '/macalania-a.wav',
    'loop': {'start': 12.857143, 'end': 60.0},
    'xfadeSec': 1.0,
}
# Per-cue true-peak ceiling for the encoder loop, as tools/audio/remaster-score.mjs ships it (its TP_MAX):
# qa.mjs's meter reads scene-zanarkand-dome a hair over -1 at the default.
TP_MAX = {'scene-zanarkand-dome': -1.3}
RENDERED = ('boss-vegnagun', 'scene-bevelle-underground')
LAME = {'wav': ['-c:a', 'pcm_f32le'], 'q5': ['-codec:a', 'libmp3lame', '-q:a', '5'],
        'v0': ['-codec:a', 'libmp3lame', '-q:a', '0']}


def cues():
    with open(MANIFEST, encoding='utf-8') as fh:
        return list(json.load(fh)['music'].keys())


def sha(path):
    h = hashlib.sha1()
    with open(path, 'rb') as fh:
        for b in iter(lambda: fh.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def encode_render(cue, encode, out):
    wav = f'{SCRATCH}/render/music/{cue}.wav'
    if not os.path.exists(wav):
        raise SystemExit(f'{wav}: render it first (node tools/audio/render.mjs --only={cue} --wav --out=<scratch>/render)')
    subprocess.run([r1.remaster.FF, '-v', 'error', '-y', '-i', wav, *LAME[encode], '-ar', str(SR), '-ac', '2', out],
                   check=True)
    return {'cue': cue, 'encode': encode, 'bytes': os.path.getsize(out), 'source': wav}


def one(cue, work):
    os.makedirs(work, exist_ok=True)
    res = {'cue': cue}
    for enc in ('wav', 'q5', 'v0'):
        ext = 'wav' if enc == 'wav' else 'mp3'
        out = f'{work}/{cue}.{enc}.{ext}'
        if cue in RENDERED:
            rep = encode_render(cue, enc, out)
        else:
            rep = r1.run(cue, enc, out, tp_max=TP_MAX.get(cue), entry=TEMPLE if cue == TEMPLE['cue'] else None)
        res[enc] = {k: rep[k] for k in ('bytes', 'gainDb', 'ceilDb', 'lufs', 'tp') if k in rep}
        res[enc]['file'] = out
    shipped = os.path.join(ROOT, 'public', 'audio', 'music', f'{cue}.mp3')
    res['shippedSha1'] = sha(shipped)
    res['q5Sha1'] = sha(f'{work}/{cue}.q5.mp3')
    res['q5ReproducesShipped'] = res['shippedSha1'] == res['q5Sha1']
    print(json.dumps({'cue': cue, 'q5ReproducesShipped': res['q5ReproducesShipped'],
                      'q5': res['q5']['bytes'], 'v0': res['v0']['bytes']}), flush=True)
    with open(f'{work}/{cue}.ship.json', 'w', encoding='utf-8') as fh:
        json.dump(res, fh, indent=1)
    return res


def install(work):
    """Copy each V0 file over the shipped one and refresh bytes, lufs and truePeakDb in the manifest.
    Loop points and score fingerprints are left untouched and the duration is asserted equal: the encode is the only difference."""
    with open(MANIFEST, encoding='utf-8') as fh:
        manifest = json.load(fh)
    for cue, entry in manifest['music'].items():
        src = f'{work}/{cue}.v0.mp3'
        dst = os.path.join(ROOT, 'public', 'audio', entry['file'])
        samples = len(r1.remaster.decode(src))
        if round(samples / SR, 4) != entry['duration']:
            raise SystemExit(f'{cue}: V0 decodes to {samples / SR:.4f} s, manifest says {entry["duration"]} s')
        lufs, tp = r1.remaster.ebur(src)
        digits = 2 if cue in RENDERED else 1  # the existing entries: renders carry two decimals, R1 cues one
        shutil.copyfile(src, dst)
        entry.update({'bytes': os.path.getsize(dst), 'lufs': round(lufs, digits), 'truePeakDb': round(tp, digits)})
        print(cue, entry['bytes'], entry['lufs'], entry['truePeakDb'], flush=True)
    with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
        fh.write('\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cue')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--install', action='store_true')
    ap.add_argument('--work', required=True)
    ap.add_argument('--jobs', type=int, default=3)
    a = ap.parse_args()
    if a.install:
        install(a.work)
    elif a.cue:
        one(a.cue, a.work)
    elif a.all:
        todo = cues()
        procs = []
        with concurrent.futures.ThreadPoolExecutor(a.jobs) as ex:
            for c in todo:
                procs.append(ex.submit(subprocess.run, [sys.executable, os.path.abspath(__file__), '--cue', c,
                                                        '--work', a.work], check=False))
            for p in procs:
                p.result()
    else:
        ap.error('--cue or --all')


if __name__ == '__main__':
    main()
