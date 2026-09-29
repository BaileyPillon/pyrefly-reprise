"""Ship one Direction B take through the remaster chain in the game's own format.

`tools/audio/remaster.py` (the R1 / R2 / R3 chain, docs/audio/remaster-2026-09-29/README.md) writes
auditions: MP3 320 kbps at the source's full length. A shipped music cue follows the shipped
layout instead (docs/audio/direction-b-2026-09-27.md, "Loop and stinger"; src/audio/manifest.ts
`clampLoopPoints`): intro, loop body, a 3 s run-on that is an exact copy of the loop head, -16 LUFS
integrated, true peak under -1 dBTP, MP3 through libmp3lame -q:a 5 at 44.1 kHz stereo, like
tools/audio/render.mjs and tools/audio/modern/render-b-score.mjs. This wrapper does only that:

  1. cuts the source at loopEnd + run-on, sample-exact (the run-on is rebuilt from the loop head,
     so nothing after it can be heard in the game);
  2. runs remaster.process unchanged (same phase repair, image, tone, limiter, loop repair and
     seam crossfade), with the one encode argument swapped from -b:a 320k to -q:a 5;
  3. prints the manifest entry (seconds, rounded as the manifest rounds them) and the report.

  python tools/audio/remaster-ship.py --in SRC.wav --out public/audio/music/KEY.mp3 \
         --preset focus --loop START_S END_S --xfade 1.0 [--json REPORT.json]

Game case (AGENTS.md rule 14): shared audio plumbing, BOTH. First used for the FFX-only
`scene-macalania-temple` (Chapter VII, D-278).
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import remaster  # noqa: E402  (tools/audio/remaster.py)

RUN_ON_S = 3.0
_ff_pipe = remaster.ff_pipe


def ff_pipe_game(x, filters, out_args=('-f', 'f32le', '-')):
    """remaster.ff_pipe, with the MP3 encode at the game's -q:a 5 instead of 320 kbps."""
    args = list(out_args)
    if '-b:a' in args and '320k' in args:
        i = args.index('-b:a')
        args[i:i + 2] = ['-q:a', '5']
    return _ff_pipe(x, filters, tuple(args))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='src', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--preset', choices=list(remaster.PRESETS), default='focus')
    ap.add_argument('--loop', nargs=2, type=float, required=True)
    ap.add_argument('--xfade', type=float, default=0.5)
    ap.add_argument('--json')
    ap.add_argument('--tp-max', type=float, default=remaster.TP_MAX,
                    help='true-peak ceiling in dBTP for ebur128 on the MP3 (default -1); lower it when '
                         'tools/audio/qa.mjs, whose meter reads a little hotter, lands a hair over -1')
    a = ap.parse_args()

    sr = remaster.SR
    loop_end = int(round(a.loop[1] * sr))
    keep = loop_end + int(round(RUN_ON_S * sr))
    fd, cut = tempfile.mkstemp(suffix='.wav', dir=os.path.dirname(os.path.abspath(a.out)))
    os.close(fd)
    tp_default, remaster.TP_MAX = remaster.TP_MAX, a.tp_max
    try:
        subprocess.run([remaster.FF, '-v', 'error', '-y', '-i', a.src, '-af', f'atrim=end_sample={keep}',
                        '-ar', str(sr), '-ac', '2', '-c:a', 'pcm_f32le', cut], check=True)
        remaster.ff_pipe = ff_pipe_game
        rep = remaster.process(cut, a.out, a.preset, a.loop, a.xfade)
    finally:
        remaster.ff_pipe = _ff_pipe
        remaster.TP_MAX = tp_default
        os.remove(cut)
    rep['in'] = os.path.basename(a.src)
    rep['encode'] = 'libmp3lame -q:a 5, 44.1 kHz stereo'
    rep['tpMax'] = a.tp_max
    entry = {
        'file': 'music/' + os.path.basename(a.out),
        'loopStart': round(a.loop[0], 6),
        'loopEnd': round(a.loop[1], 6),
        'duration': round(rep['outSamples'] / sr, 4),
        'bytes': os.path.getsize(a.out),
        'lufs': round(rep['lufs'], 2),
        'truePeakDb': round(rep['tp'], 2),
    }
    print(json.dumps({'manifestEntry': entry}))
    if a.json:
        with open(a.json, 'w', encoding='utf-8') as fh:
            json.dump({'report': rep, 'manifestEntry': entry}, fh, indent=1)


if __name__ == '__main__':
    main()
