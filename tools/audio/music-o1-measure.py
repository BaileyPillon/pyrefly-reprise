"""Music O1 (D-292): measure every cue before (shipped q5) and after (V0) against its lossless twin.

Reads the per-cue results of tools/audio/music-o1-ship.py (<work>/<cue>.ship.json) and, per cue, runs
tools/audio/quality-measure.py on the shipped q5 file and the new V0 file with each paired to the lossless
twin (`--pair`), so the coding error, the encoder's lowpass and the pre-echo are measured on the same
signal. Writes one JSON per cue to <work>/<cue>.measure.json; `--collect` merges them.

  python tools/audio/music-o1-measure.py --work <dir> [--jobs 3]
  python tools/audio/music-o1-measure.py --work <dir> --collect OUT.json
  python tools/audio/music-o1-measure.py --work <dir> --report docs/audio/music-o1-2026-09-30.json --qa-before A.json --qa-after B.json

Game case (AGENTS.md rule 14): shared audio plumbing, BOTH. No agent can hear (rule 13): these are
measurements, not a listening verdict.
"""

import argparse
import concurrent.futures
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.join(HERE, 'quality-measure.py')


def measure(cue, work):
    q5, v0, wav = (f'{work}/{cue}.q5.mp3', f'{work}/{cue}.v0.mp3', f'{work}/{cue}.wav.wav')
    out = f'{work}/{cue}.measure.json'
    subprocess.run([sys.executable, QM, q5, v0, '--pair', f'{q5}={wav}', '--pair', f'{v0}={wav}', '--json', out],
                   check=True, stdout=subprocess.DEVNULL)
    print(cue, flush=True)


def cues(work):
    return sorted(f[:-len('.ship.json')] for f in os.listdir(work) if f.endswith('.ship.json'))


def collect(work, out):
    res = {}
    for cue in cues(work):
        with open(f'{work}/{cue}.measure.json', encoding='utf-8') as fh:
            res[cue] = json.load(fh)
    with open(out, 'w', encoding='utf-8') as fh:
        json.dump(res, fh, indent=1)
    print(f'{len(res)} cues -> {out}')


def report(work, out, qa_before, qa_after):
    """docs/audio/music-o1-2026-09-30.json: one row per cue, before (shipped q5) and after (V0)."""
    with open(qa_before, encoding='utf-8') as fh:
        qb = {c['name']: c for c in json.load(fh)['cues']}
    with open(qa_after, encoding='utf-8') as fh:
        qa_doc = json.load(fh)
    qa = {c['name']: c for c in qa_doc['cues']}
    rows, tb, ta = [], 0, 0
    for cue in cues(work):
        with open(f'{work}/{cue}.measure.json', encoding='utf-8') as fh:
            m = json.load(fh)
        with open(f'{work}/{cue}.ship.json', encoding='utf-8') as fh:
            ship = json.load(fh)
        fb, fa = [r for r in m if 'file' in r]
        pb, pa = [r for r in m if 'test' in r]

        def side(f, p, q, nbytes):
            return {'bytes': nbytes, 'lufs': f['lufs'], 'truePeakDb': f['tp'], 'topEdge70Hz': f['topEdge70'],
                    'lowpassCliff': f['cliff'], 'hfFlatnessDb': f['hfFlatnessDb'], 'riseMs': f['riseMs'],
                    'corr': f['corr'], 'lra': f['lra'], 'snrDb': p['snrDb'], 'nmrBandsDb': p['nmrBandsDb'],
                    'preEchoDb': p['preEchoDb'], 'lostTopDb': p['lostTopDb'], 'lagSamples': p['lagSamples'],
                    'qa': {'lufs': round(q['lufs'], 2), 'truePeakDb': round(q['truePeakDb'], 2),
                           'seamStep': round(q['seamStep'], 5), 'seamAllowed': round(q['seamAllowed'], 5),
                           'seamFluxRatio': round(q['seamFluxRatio'], 2), 'tilt': round(q['tilt'], 1),
                           'failures': q['failures']}}
        tb += ship['q5']['bytes']
        ta += ship['v0']['bytes']
        rows.append({'cue': cue, 'q5ReproducesShipped': ship['q5ReproducesShipped'], 'shippedSha1': ship['shippedSha1'],
                     'before': side(fb, pb, qb[cue], ship['q5']['bytes']),
                     'after': side(fa, pa, qa[cue], ship['v0']['bytes'])})
    doc = {
        'what': 'D-292 music O1: every shipped music cue re-encoded at LAME V0 (libmp3lame -q:a 0) from its lossless master, '
                'measured before (the shipped q5 file) and after. Measurement only: no agent can hear (AGENTS.md rule 13).',
        'game': 'both',
        'decision': 'Bailey, 2026-09-29: "yes, all your recommendations" (O1 for the whole score).',
        'tools': ['tools/audio/music-o1-ship.py', 'tools/audio/r1-encode.py', 'tools/audio/music-o1-measure.py',
                  'tools/audio/quality-measure.py', 'tools/audio/qa.mjs'],
        'reproduction': "each cue's q5 twin (the same chain at the shipped -q:a 5) is byte-identical to the shipped file: "
                        + str(sum(r['q5ReproducesShipped'] for r in rows)) + ' of ' + str(len(rows)),
        'gates': {'lufs': '-16 +/- 0.5 (tools/audio/qa.mjs decode)', 'truePeakMax': -1, 'seam': 'qa.mjs seam step and flux <= 2x',
                  'qaStrictFindings': sum(len(c['failures']) for c in qa_doc['cues']) + len(qa_doc['manifest']['problems'])},
        'totals': {'musicBytesBefore': tb, 'musicBytesAfter': ta, 'factor': round(ta / tb, 3),
                   'sfxBytes': qa_doc['sfx']['bytes'], 'shippedBytesAfter': qa_doc['totalBytes']},
        'columns': {'topEdge70Hz': 'highest frequency where the long-term spectrum is within 70 dB of its maximum',
                    'lowpassCliff': 'steepest drop above 10 kHz over 500 Hz: dB and where (the encoder wall)',
                    'nmrBandsDb': 'coding error over signal per band 20-80/80-250/250-800/800-2.5k/2.5-6k/6-12k/12-16k/16k+ Hz, dB, '
                                  'against the lossless twin (lower is better; the 16k+ band is the lowpass itself)',
                    'preEchoDb': 'coding error over signal in the 20 ms before the 40 strongest attacks (lower is better)',
                    'snrDb': 'whole-file signal over coding error'},
        'cues': rows,
    }
    with open(out, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(doc, fh, indent=1)
        fh.write('\n')
    print(f'{len(rows)} cues -> {out}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--work', required=True)
    ap.add_argument('--jobs', type=int, default=3)
    ap.add_argument('--collect')
    ap.add_argument('--report')
    ap.add_argument('--qa-before')
    ap.add_argument('--qa-after')
    ap.add_argument('--cue')
    a = ap.parse_args()
    if a.report:
        report(a.work, a.report, a.qa_before, a.qa_after)
        return
    if a.collect:
        collect(a.work, a.collect)
        return
    todo = [a.cue] if a.cue else cues(a.work)
    with concurrent.futures.ThreadPoolExecutor(a.jobs) as ex:
        list(ex.map(lambda c: measure(c, a.work), todo))


if __name__ == '__main__':
    main()
