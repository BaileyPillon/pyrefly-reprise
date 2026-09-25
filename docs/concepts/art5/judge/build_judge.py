"""Turn the judge's looks (looks.txt) and head measurements (measure.json) into judge.json,
and write the install-ready candidate sidecars for every PASS (decision sheet 2026-09-25,
items 10 and 11; FFX-2 only).

    D:/Tools/ComfyUI/python_embeded/python.exe -s build_judge.py

Gates, in order:
  1. Score: the mean of the eight categories of docs/concepts/chapters/gippal/production/JUDGE.md
     (identity, anatomy, hands, costume, seams, edges, finish, game read) is at least 7.0.
  2. Scale: `scale` = idle eye-to-chin / pick eye-to-chin (the head matches the idle). The stature
     that scale gives (idle eye-to-feet / pick eye-to-feet, divided into it) must stay within
     0.75 to 1.30 of the idle for an upright pose and at least 0.60 for a lunge (attack), or the
     girl visibly grows or shrinks when the pose swaps in. ko is not stature-checked.
A PASS is written to D:/Tools/pyrefly-art-backup/candidates/2026-09-25-judge-poses/<id>/<slot>.png
with <slot>.json beside it, ready to copy into public/art/characters/<id>/ if Bailey names it.
Nothing here touches public/art or docs/target/approved-hashes.json.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from judge_tools import ART, HERE, head_len, picks

OUT = __import__('pathlib').Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-judge-poses')
CATS = ['identity', 'anatomy', 'hands', 'costume', 'seams', 'edges', 'finish', 'gameRead']
LINE = re.compile(r'(\S+/\S+) c(\d+): id ([\d.]+) anat ([\d.]+) hands ([\d.]+) cost ([\d.]+) '
                  r'seams ([\d.]+) edges ([\d.]+) finish ([\d.]+) game ([\d.]+) -> ([\d.]+) (?:\(narrow\) )?'
                  r'(PASS|FAIL)(?: \(narrow\))?\. (.*)')
# Chapters where the dressphere is worn at the start (0) or one link away (1), today's builds.
REACH = {
    'yuna-dark-knight': 'XIII start', 'paine-dark-knight': 'XIII start', 'rikku-alchemist': 'XIII start',
    'rikku-dark-knight': 'IV, V/XI start', 'paine-warrior': 'IV, VI start; XIII one link',
    'rikku-thief': 'VI start', 'yuna-gunner': 'VI start; IV, V/XI one link',
    'yuna-black-mage': 'IV, V/XI one link', 'rikku-gunner': 'IV, V/XI, XIII one link',
    'rikku-black-mage': 'IV, V/XI, VI one link', 'paine-gunner': 'IV, V/XI one link',
    'paine-black-mage': 'IV one link', 'paine-white-mage': 'V/XI, VI, XIII one link',
    'yuna-songstress': 'VI, XIII one link', 'rikku-white-mage': 'VI, XIII one link',
    'yuna-warrior': 'IV, V/XI, XIII, two or more links',
}


def eye_y(m):
    eyes = [m[k] for k in ('eyeL', 'eyeR') if k in m]
    return sum(e[1] for e in eyes) / len(eyes)


def main():
    looks = {}
    for line in (HERE / 'looks.txt').read_text(encoding='utf8').splitlines():
        mm = LINE.match(line)
        if mm:
            g = mm.groups()
            looks[g[0]] = dict(n=int(g[1]), scores=dict(zip(CATS, map(float, g[2:10]))), look=g[12])
    meas = json.loads((HERE / 'measure.json').read_text(encoding='utf8'))
    out = {}
    for p in picks():
        k = p['key']
        lk = looks[k]
        assert lk['n'] == p['n'], k
        side = json.loads(p['json'].read_text(encoding='utf8'))
        mean = round(sum(lk['scores'].values()) / len(CATS), 2)
        rec = dict(tier=p['tier'], reach=REACH[p['id']], batch=p['batch'], candidate=p['n'],
                   file=str(p['png']).replace('\\', '/'), scores=lk['scores'], overall=mean,
                   look=lk['look'], makerSaid=p['maker'])
        gate_score = mean >= 7.0
        verdict = 'PASS' if gate_score else 'FAIL'
        why = [] if gate_score else [f'score {mean:.2f} < 7.0']
        if gate_score:
            mi, mp = meas[p['id'] + '/idle'], meas[k]
            idle_side = json.loads((ART / p['id'] / 'idle.json').read_text(encoding='utf8'))
            scale = head_len(mi) / head_len(mp)
            rec['head'] = dict(idleEyeToChinPx=round(head_len(mi), 1), pickEyeToChinPx=round(head_len(mp), 1),
                               idlePoints=mi, pickPoints=mp)
            rec['scale'] = round(scale, 2)
            if p['slot'] != 'ko':
                stature = (idle_side['baselineY'] - eye_y(mi)) / (side['cutout']['baselineY'] - eye_y(mp))
                ratio = scale / stature
                rec['statureAtScale'] = round(ratio, 2)
                lo = 0.60 if p['slot'] == 'attack' else 0.75
                if not (lo <= ratio <= 1.30):
                    verdict = 'FAIL'
                    why.append(f'scale gate: at the head-match scale {scale:.2f} she stands {ratio:.2f} of the idle '
                               f'(allowed {lo:.2f} to 1.30)')
        rec['verdict'] = verdict
        rec['why'] = why
        out[k] = rec
        if verdict == 'PASS':
            write_install(p, side, rec)
    (HERE / 'judge.json').write_text(json.dumps({
        'note': 'Independent judge, 2026-09-25 (FFX-2 only). A sub-agent that made none of these paintings. '
                'Judge verdicts, not Bailey\'s approval: nothing is installed or locked. See JUDGE.md files.',
        'picks': out}, indent=1), encoding='utf8')
    n = sum(1 for r in out.values() if r['verdict'] == 'PASS')
    print('picks', len(out), 'pass', n)


def write_install(p, side, rec):
    d = OUT / p['id']
    d.mkdir(parents=True, exist_ok=True)
    png = d / f"{p['slot']}.png"
    shutil.copyfile(p['png'], png)
    c = side['cutout']
    sidecar = {
        'width': c['width'], 'height': c['height'], 'baselineY': c['baselineY'],
        'scale': rec['scale'],
        'scaleNote': (f"Head match 2026-09-25 (decision sheet item {10 if p['batch'] == 'gpu4' else 11}): idle eye-line "
                      f"to chin {rec['head']['idleEyeToChinPx']} px vs this pose {rec['head']['pickEyeToChinPx']} px, "
                      f"points in docs/concepts/art5/judge/measure.json; read by eye off 2x gridded crops, about +/-5%."),
        'seed': side['seed'], 'prompt': side['positive'], 'negative': side['negative'],
        'cropBox': c['cropBox'], 'source': {'width': c['sourceWidth'], 'height': c['sourceHeight']},
        'model': side['model'], 'steps': side['steps'], 'cfg': side['cfg'], 'sampler': side['sampler'],
        'scheduler': side['scheduler'], 'pose': p['slot'], 'composition': side.get('composition', 'full'),
        'facing': side.get('facing', 'right'), 'canvas': {'width': side['width'], 'height': side['height']},
        'controlnet': side['controlnet'], 'ipadapter': side['ipadapter'],
        'status': 'CANDIDATE: judge PASS, not installed, awaiting Bailey',
        'judge': f"docs/concepts/art5/judge/judge.json#{p['key']} ({rec['overall']:.2f})",
        'candidateOf': rec['file'],
        'sha256': hashlib.sha256(p['png'].read_bytes()).hexdigest(),
        'generatedAt': side['generatedAt'],
    }
    (d / f"{p['slot']}.json").write_text(json.dumps(sidecar, indent=2), encoding='utf8')


if __name__ == '__main__':
    main()
