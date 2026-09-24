"""Candidate sidecar for a derived pose (FFX only): the idle's sidecar (same canvas, same baselineY, same
facing, no scale field: scale 1.0 by construction) with the pose, the method and the provenance.
usage: sidecar.py <subject> <pose> <cand.png> <out.json> '<method text>' [gates.json]"""
import sys, json, hashlib
subj, pose, cand, out, method = sys.argv[1:6]
gates = json.load(open(sys.argv[6])) if len(sys.argv) > 6 else None
idle = json.load(open(f'D:/Final Fantasy/public/art/characters/{subj}/idle.json'))
j = {k: idle[k] for k in ('width', 'height', 'baselineY', 'composition', 'nonBiped', 'facing') if k in idle}
j.update(pose=pose, status='CANDIDATE', method=method, derivedFrom=f'public/art/characters/{subj}/idle.png',
         idleSha256=idle.get('sha256'), sha256=hashlib.sha256(open(cand, 'rb').read()).hexdigest(),
         candidateOf=f'public/art/characters/{subj}/{pose}.png', judgeNotes='self-judged only; not an independent judge; not approved; not installed')
if gates:
    j['gates'] = {k: gates[k] for k in ('shares', 'idlePixelShare', 'inventedColourShareOfPainted', 'opaqueRatio', 'softAlphaPx')}
json.dump(j, open(out, 'w'), indent=1)
print(out, j['sha256'][:12])
