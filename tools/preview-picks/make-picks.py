#!/usr/bin/env python
"""Builds tools/preview-picks/picks.json: every pick the 2026-10-03 morning page RECOMMENDS (rule 9: candidates only).

Sources (read-only): D:/Tools/pyrefly-art-backup/candidates/2026-10-03-overnight (O) and .../2026-10-03 (D, the D-333/D-334 re-rolls).
Held on purpose, per the page's recommendations 3, 4 and 5: Rikku Warrior's going and forming keys, Paine Warrior's break,
Auron's keys, Tidus's Spiral Cut leap, Kimahri's Ronso Rage (none made), Natus's telegraph.
Each entry: {set, game, artId, state, src, scale, baselineY, abilityIds?, note?}. scale is the proposal (by eye) the
preview then measures and corrects in-game (tools/preview-picks/measured.json overrides it).
"""
import json, os, re, sys

O = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-03-overnight'
D = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-03'
out = []


def prov(path):
    p = path[:-4] + '.prov.json'
    try:
        return json.load(open(p, encoding='utf8'))
    except Exception:
        return {}


def add(set_, game, art, state, src, scale=None, ability=None, note=None, **kw):
    if not os.path.exists(src):
        print('MISSING', src, file=sys.stderr)
        return
    pv = prov(src)
    base = (pv.get('cutout') or {}).get('baselineY')
    e = dict(set=set_, game=game, artId=art, state=state, src=src, scale=scale, baselineY=base)
    if ability:
        e['abilityIds'] = ability
    if note:
        e['note'] = note
    e.update(kw)
    out.append(e)


# ---- 1. the three new figures: idle + keys (FFX-2 only)
pk = json.load(open(f'{O}/dressphere-method/picks.json', encoding='utf8'))
for fig in ('yuna-thief', 'rikku-warrior', 'paine-thief'):
    p = pk[fig]
    add('new-figure', 'ffx2', fig, 'idle', f'{O}/{fig}/idle/cand-{p["idle"]}.png', None)
    for slot, st in (('ready', 'ready'), ('attack', 'attack'), ('follow', 'follow'), ('cast', 'cast'), ('item', 'item'),
                     ('hurt', 'hurt'), ('ko', 'ko'), ('victory', 'victory'), ('twirl-start', 'twirl-start'),
                     ('twirl-end', 'twirl-end'), ('twirl-going', 'twirl-going'), ('twirl-forming', 'twirl-forming')):
        s = p[slot]
        folder = s.get('folder', slot)
        c = s['rec']
        extra = {}
        if fig == 'rikku-warrior' and slot in ('twirl-going', 'twirl-forming'):
            extra['hold'] = True  # page recommendation 3: hold; use the existing twirl keys there
        add('new-figure', 'ffx2', fig, st, f'{O}/{fig}/{folder}/cand-{c}.png', s['scale'][str(c)], note=s.get('note'), **extra)

# ---- 2. apex keys (od-<abilityId>)
ap = json.load(open(f'{O}/method-apex/picks-apex.json', encoding='utf8'))
BM = ['x2-black-mage-cast']  # family: the 12 black spells x2-black-mage-<fire..waterga>
# (figure, move) -> (set folder, art id, game, ability ids, ids confirmed against src/data?)
APEX = {
    ('tidus', 'slice-and-dice'): ('tidus-overdrives', 'tidus', 'ffx', ['slice-and-dice'], True),
    ('tidus', 'energy-rain'): ('tidus-overdrives', 'tidus', 'ffx', ['energy-rain'], True),
    ('wakka', 'slots'): ('wakka-overdrives', 'wakka', 'ffx', ['element-reels'], True),  # family: fire/ice/water/thunder-shot (the engine's Reel results)
    ('lulu', 'fury'): ('lulu-fury', 'lulu', 'ffx', ['fury'], True),  # family: every <spell>-fury id
    ('kimahri', 'breath'): ('kimahri-rage', 'kimahri', 'ffx', ['stone-breath'], True),
    ('rikku', 'mix'): ('rikku-mix', 'rikku', 'ffx', ['mix'], True),  # family: all 43 mix-* result ids
    ('yuna', 'grand-summon'): ('yuna-grand-summon', 'yuna', 'ffx', ['grand-summon'], True),
    ('yuna-gunner', 'trigger-happy'): ('yuna-gunner-trigger-happy', 'yuna-gunner', 'ffx2', ['x2-gunner-trigger-happy'], True),
    ('rikku-thief', 'steal'): ('rikku-thief-steal', 'rikku-thief', 'ffx2', ['x2-thief-steal'], True),
    ('rikku-dark-knight', 'darkness'): ('rikku-dark-knight-darkness', 'rikku-dark-knight', 'ffx2', ['x2-dark-knight-darkness'], True),
    ('paine-warrior', 'sentinel'): ('paine-warrior-break', 'paine-warrior', 'ffx2', ['x2-warrior-sentinel'], True),
    ('yuna-white-mage', 'pray'): ('yuna-white-mage-pray', 'yuna-white-mage', 'ffx2', ['x2-white-mage-pray', 'x2-white-mage-life'], True),
    ('yuna-dark-knight', 'darkness'): ('yuna-dark-knight-darkness', 'yuna-dark-knight', 'ffx2', ['x2-dark-knight-darkness', 'x2-dark-knight-black-sky'], True),
    ('paine-dark-knight', 'darkness'): ('paine-dark-knight-darkness', 'paine-dark-knight', 'ffx2', ['x2-dark-knight-darkness'], True),
    ('rikku-alchemist', 'mix'): ('rikku-alchemist-mix', 'rikku-alchemist', 'ffx2', ['x2-alchemist-mix'], True),
    ('paine-samurai', 'slash'): ('paine-samurai-bushido', 'paine-samurai', 'ffx2', ['x2-samurai-zantetsu'], False),
    ('yuna-warrior', 'break'): ('yuna-warrior-break', 'yuna-warrior', 'ffx2', ['x2-warrior-power-break', 'x2-warrior-armor-break'], False),
    ('rikku-berserker', 'rage'): ('rikku-berserker-rage', 'rikku-berserker', 'ffx2', ['x2-berserker-berserk'], False),
    ('yuna-black-mage', 'cast'): ('yuna-black-mage-cast', 'yuna-black-mage', 'ffx2', BM, True),
    ('rikku-black-mage', 'cast'): ('rikku-black-mage-cast', 'rikku-black-mage', 'ffx2', BM, True),
    ('paine-black-mage', 'cast'): ('paine-black-mage-cast', 'paine-black-mage', 'ffx2', BM, True),
    ('rikku-gunner', 'trigger-happy'): ('rikku-gunner-trigger-happy', 'rikku-gunner', 'ffx2', ['x2-gunner-trigger-happy'], True),
    ('paine-gunner', 'trigger-happy'): ('paine-gunner-trigger-happy', 'paine-gunner', 'ffx2', ['x2-gunner-trigger-happy'], True),
}
for (fig, move), (folder, art, game, ids, ok) in APEX.items():
    v = ap[fig][move]
    c = v['rec']
    sub = move
    src = f'{O}/{folder}/{sub}/cand-{c}.png'
    note = None if ok else 'ability ids NOT confirmed against the data: pick the move the painting reads as at install'
    for aid in ids:
        add('apex', game, art, f'od-{aid}', src, v['scale'][str(c)], ability=[aid], note=note, move=move)

# preview-only stand-in: Yuna's White Mage has not learned Pray / Life in Chapter IV (Cure, Shell, Protect, Esuna, Cura, Vigor, Dispel),
# so the same Pray painting is also staged under Cure's id for the capture. NOT part of any install-ready package.
_v = ap['yuna-white-mage']['pray']
add('apex', 'ffx2', 'yuna-white-mage', 'od-x2-white-mage-cure', f'{O}/yuna-white-mage-pray/pray/cand-{_v["rec"]}.png', _v['scale'][str(_v['rec'])], ability=['x2-white-mage-cure'], note='PREVIEW STAND-IN (Pray is not learned in Ch IV)', previewOnly=True)

# ---- 3. boss telegraphs
tp = json.load(open(f'{O}/method-telegraph/picks.json', encoding='utf8'))['sets']
TELE = {  # set -> (art id, game, 2x master?)
    'tele-seymour-flux-body': ('seymour-flux-body', 'ffx'),
    'tele-yunalesca-1': ('yunalesca-1', 'ffx'),
    'tele-bfa-2': ('braskas-final-aeon-2', 'ffx'),
    'tele-omnis': ('seymour-omnis', 'ffx'),
    'tele-evrae': ('evrae', 'ffx'),
    'tele-ffx2-bahamut': ('ffx2-bahamut', 'ffx2'),
    'tele-trema': ('trema', 'ffx2'),
    'tele-leblanc': ('leblanc', 'ffx2'),
    'tele-vegnagun-tail': ('vegnagun-tail', 'ffx2'),
    'tele-vegnagun-head': ('vegnagun-head', 'ffx2'),
    'tele-shuyin': ('shuyin', 'ffx2'),
    'tele-ixion': ('ixion', 'ffx'),
    'tele-ifrit': ('ifrit', 'ffx'),
    'tele-valefor': ('valefor', 'ffx'),
    'tele-bahamut-ffx': ('bahamut', 'ffx'),
    'tele-overdrive-sin': ('overdrive-sin', 'ffx'),
}
for s, (art, game) in TELE.items():
    c = tp[s]['pick']
    n = c.split('-')[1]
    src = f'{O}/{s}/telegraph/{c}.png'
    m2 = f'{O}/{s}/telegraph/masters-2x/{c}@2x.png'
    add('telegraph', game, art, 'telegraph', src, 1.0, note=tp[s].get('title'), master2x=m2 if os.path.exists(m2) else None)
out.append(dict(set='telegraph', hold=True, artId='seymour-natus', state='telegraph', game='ffx',
                note='HELD: waits for PR-0331 (his colossus master); the recommendation excludes it'))

# ---- 4. D-333 / D-334 re-rolls (c1 picks), replacing installed paintings (FFX-2 only)
add('reroll', 'ffx2', 'yuna-gunner', 'ready', f'{D}/yuna-gunner/windup/cand-11.png', 1.4, note='D-333 Gunner wind-up c1', replaces=True)
add('reroll', 'ffx2', 'yuna-warrior', 'follow', f'{D}/yuna-warrior/follow/cand-4.png', 1.5, note='D-333 Warrior follow-through c1', replaces=True)
add('reroll', 'ffx2', 'yuna-white-mage', 'hurt', f'{D}/yuna-white-mage/hurt/cand-9.png', 1.6, note='D-334 hooded White Mage hurt c1', replaces=True)
add('reroll', 'ffx2', 'yuna-white-mage', 'ko', f'{D}/yuna-white-mage/ko/cand-2.png', 1.0, note='D-334 KO c1; src/engine/KoPoseScale.ts yuna-white-mage 0.64 must go (body-length match)', replaces=True)
add('reroll', 'ffx2', 'yuna-white-mage', 'attack', f'{D}/yuna-white-mage/attack/cand-10.png', 1.3, note='D-334 attack c1 (unused today: the slot is new)', replaces=False)

json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'picks.json'), 'w', encoding='utf8'), indent=1)
print(len(out), 'entries;', sum(1 for e in out if e.get('hold')), 'held')
