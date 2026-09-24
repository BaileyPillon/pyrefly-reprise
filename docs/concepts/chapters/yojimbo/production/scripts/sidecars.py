import json, hashlib, datetime
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
C = 'docs/concepts/chapters/yojimbo/'
subjects = {
 'yojimbo-cavern': dict(src='out/yojimbo-cavern-idle.png', base='yojimbo-a2.json', w=730, h=1093, bl=1076, box=[16,16,713,1076], nonBiped=False, composition='full',
   concept=C+'boss/a-repaint-card.jpg (O-1 A, picked 2026-09-24)', seed=902102,
   method='r3 derive-from-concept (docs/plans/art-method-r3/METHOD-CHECK.md): the picked O-1 A render yojimbo-a2 (seed 902102), its own pixels and matte; no repaint, no GPU',
   repairs=['second scabbard crossing behind him erased (the clean-pass item the options README named): 3,702 px inside a strip polygon from the robe edge to the hat tassel, the robe edge kept on its own straight line (421,575)-(437,655); pixel erase only, nothing painted',
            'near-white matte halo peeled on the outer edge: 95 px (grey-white only; the pale geta wood kept)'],
   notes='Side profile kept (the pick; turning him would need a re-render). Two hilts remain at the hip (katana and a short sword; his attacks include Wakizashi). Game case: FFX only.',
   size='visual bible (research/visual-bible.md boss sizes) 84 px against a 60 px Tidus-scale party member [estimate]: about 2.55 world units at partyHeight 1.82'),
 'daigoro': dict(src='out/daigoro-idle.png', base='daigoro-b.json', w=853, h=897, bl=846, box=[16,16,836,880], nonBiped=True, composition='boss',
   concept=C+'daigoro/b-card.jpg (O-2 B koma-inu, picked 2026-09-24)', seed=903202,
   method='r3 derive-from-concept (docs/plans/art-method-r3/METHOD-CHECK.md): the picked O-2 B render daigoro-b (seed 903202), its own pixels and matte; no repaint, no GPU',
   repairs=['baked blue floor shadow under the paws and tail erased (7,281 px, blue-hue test below row 815 grown 3 px through blue-tinted edge pixels) plus 78 px of specks; pixel erase only, nothing painted; the engine draws its own contact shadow'],
   notes='baselineY is the front-paw contact row (846), not the content bottom: the tail lies on the floor in front of him down to row 880. His look is ours (the data names him Koma Inu; nothing else is sourced). Game case: FFX only.',
   size='visual bible 24 px against a 60 px party member [estimate]: about 0.73 world units (the options README: about 0.4 of a party member)'),
 'ginnem': dict(src='out/ginnem-idle.png', base='ginnem-a.json', w=757, h=1164, bl=1100, box=[39,39,763,1170], nonBiped=False, composition='full',
   concept=C+'ginnem/b-pyrefly-edged-card.jpg (O-3 B the glowing unsent outline, picked 2026-09-24)', seed=904101,
   method='r3 derive-from-concept: the picked O-3 B pixels exactly (the ginnem-a render, seed 904101, with the options round\'s pyrefly-edge treatment D:/Tools/pyrefly-scratch/yojimbo/unsent.py, random seed 7): soft cool rim glow, 140 motes on the outline, body alpha 0.88; no repaint, no GPU',
   repairs=[],
   notes='Soft alpha on purpose (the glow and the 0.88 body): the one idle here that is not binary. The options README said the motes would be live particles in the game; until that effect exists (src/engine is another track\'s) the picked treatment is baked so the painting shows what Bailey picked; the solid painting is kept at D:/Tools/pyrefly-art-backup/candidates/2026-09-24-yojimbo/ginnem/idle.solid.png for when the live effect lands. White make-up (sourced) tried as a pixel lift of the face skin and dropped: no visible change, the face is already near white. Hair came out fair, not brunette (our own prompt word; unsourced). Untargetable (B3). Game case: FFX only.',
   size='a palette swap of Belgemine (wiki), so human scale: partyHeight 1.82 world units [estimate]'),
}
for sid, s in subjects.items():
    base = json.load(open(s['base']))
    d = {'width': s['w'], 'height': s['h'], 'baselineY': s['bl'], 'pose': 'idle', 'composition': s['composition'], 'nonBiped': s['nonBiped'],
         'facing': 'left', 'facingObserved': True, 'status': 'CANDIDATE', 'game': 'FFX only', 'method': s['method'],
         'concept': s['concept'], 'conceptSeed': s['seed'], 'repairs': s['repairs'],
         'cutout': {'contentBox': [16, 16, s['w'] - 17, s['h'] - 17], 'rawContentBox': s['box'], 'matte': 'the concept render\'s own comfy.mjs cut-out (binary) from the options round'},
         'suggestedWorldHeight': s['size'],
         'seed': base['seed'], 'prompt': base['prompt'], 'negative': base['negative'], 'model': base['model'], 'steps': base['steps'], 'cfg': base['cfg'],
         'sampler': base['sampler'], 'scheduler': base['scheduler'], 'source': base['source'], 'cropBox': base['cropBox'],
         'sha256': sha(s['src']), 'judgeNotes': 'self-judged at 1:1 and in a real battle frame; not an independent judge; not approved (never in approved-hashes.json). ' + s['notes'],
         'generatedAt': base['generatedAt'], 'installedAt': now, 'readme': C + 'INSTALLED.md'}
    json.dump(d, open(f'out/{sid}-idle.json', 'w'), indent=2)
    print(sid, d['sha256'])
