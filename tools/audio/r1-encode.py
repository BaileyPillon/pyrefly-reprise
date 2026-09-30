"""Re-run a shipped R1 cue's exact chain with a different final encode (fb-0929 music, option O1).

The shipped soundtrack (docs/audio/soundtrack-r1-2026-09-29.json, D-283) is every Direction B
master through tools/audio/remaster-ship.py: remaster.py preset "focus", intro + loop + 3 s
run-on, -16 LUFS, true peak under -1 dBTP, MP3 libmp3lame -q:a 5. This wrapper runs that same
chain with the encode swapped, so the shipped MP3 can be compared with a lossless twin (what the
encode costs) and with higher-bitrate encodes (option O1). Loop points and the seam crossfade come
from the ship report, so nothing is retyped.

  python tools/audio/r1-encode.py --cue boss-seymour --encode wav --out D:/.../boss-seymour-R1.wav
  python tools/audio/r1-encode.py --cue boss-seymour --encode opus160 --out .../boss-seymour.ogg

Encodes: wav (float, lossless twin), q5 (the shipped setting, to prove the twin reproduces the
shipped file), v0 (libmp3lame -q:a 0), mp3-320 (-b:a 320k), opus160 / opus192 (libopus VBR,
48 kHz as Opus always is, in an .ogg or .webm container).

Game case (AGENTS.md rule 14): shared audio plumbing, BOTH.
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import remaster  # noqa: E402  (tools/audio/remaster.py)

REPORT = os.path.join(HERE, '..', '..', 'docs', 'audio', 'soundtrack-r1-2026-09-29.json')
RUN_ON_S = 3.0
ENCODES = {
    'wav': ['-codec:a', 'pcm_f32le'],
    'q5': ['-codec:a', 'libmp3lame', '-q:a', '5'],
    'v0': ['-codec:a', 'libmp3lame', '-q:a', '0'],
    'mp3-320': ['-codec:a', 'libmp3lame', '-b:a', '320k'],
    'opus160': ['-codec:a', 'libopus', '-b:a', '160k', '-vbr', 'on', '-compression_level', '10'],
    'opus192': ['-codec:a', 'libopus', '-b:a', '192k', '-vbr', 'on', '-compression_level', '10'],
}
_ff_pipe = remaster.ff_pipe


def cue_entry(cue):
    with open(REPORT, encoding='utf-8') as fh:
        for c in json.load(fh)['cues']:
            if c['cue'] == cue:
                return c
    raise SystemExit(f'{cue}: not in {REPORT}')


def make_pipe(encode):
    enc = ENCODES[encode]

    def pipe(x, filters, out_args=('-f', 'f32le', '-')):
        args = list(out_args)
        if '-codec:a' in args and 'libmp3lame' in args:  # remaster.master()'s final encode
            out = args[-1]
            rate = [] if encode.startswith('opus') else ['-ar', str(remaster.SR)]
            args = ['-y', *enc, *rate, '-ac', '2', out]
        return _ff_pipe(x, filters, tuple(args))
    return pipe


def run(cue, encode, out, tp_max=None):
    c = cue_entry(cue)
    sr = remaster.SR
    keep = int(round(c['loop']['end'] * sr)) + int(round(RUN_ON_S * sr))
    fd, cut = tempfile.mkstemp(suffix='.wav', dir=os.path.dirname(os.path.abspath(out)))
    os.close(fd)
    tp_default = remaster.TP_MAX
    remaster.TP_MAX = tp_max if tp_max is not None else tp_default
    try:
        subprocess.run([remaster.FF, '-v', 'error', '-y', '-i', c['source'], '-af', f'atrim=end_sample={keep}',
                        '-ar', str(sr), '-ac', '2', '-c:a', 'pcm_f32le', cut], check=True)
        remaster.ff_pipe = make_pipe(encode)
        rep = remaster.process(cut, out, 'focus', (c['loop']['start'], c['loop']['end']), c['xfadeSec'])
    finally:
        remaster.ff_pipe = _ff_pipe
        remaster.TP_MAX = tp_default
        os.remove(cut)
    rep.update({'cue': cue, 'encode': encode, 'bytes': os.path.getsize(out), 'source': c['source']})
    return rep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cue', required=True)
    ap.add_argument('--encode', choices=list(ENCODES), required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--tp-max', type=float)
    a = ap.parse_args()
    print(json.dumps(run(a.cue, a.encode, a.out, a.tp_max)))


if __name__ == '__main__':
    main()
