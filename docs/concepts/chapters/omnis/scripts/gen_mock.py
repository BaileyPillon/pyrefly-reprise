# Writes the O-2 (disc strip) and O-4 (reading the fight) mockup pages for Chapter XII
# Seymour Omnis (FFX only): desktop 1600x900 over real engine frames with the real HUD,
# and phone 390x844 on the Yojimbo round's phone layout. Only the overlays are mockup.
import os
BASE = 'D:/Final Fantasy/docs/concepts/chapters/omnis/'
KIT = '../../../polish/_kit/kit.css'
PHONE = '../../yojimbo/gauge/phone.css'
PORT = '../../../../../public/art/portraits/'
HEAD = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{t}</title>{vp}
<link rel="stylesheet" href="{kit}">{css}</head><body>
'''
COL = {'fire': '#f07622', 'water': '#2f7fe8', 'ice': '#a06aeb', 'thunder': '#f5d432'}
INKTXT = {'fire': '#0b0a12', 'water': '#fff', 'ice': '#fff', 'thunder': '#0b0a12'}
ICON = {
    'fire': '<svg viewBox="-1 -1 2 2"><polygon points="-0.55,0.85 -0.62,0.1 -0.38,-0.45 -0.22,0 0,-1 0.22,0 0.4,-0.5 0.62,0.1 0.55,0.85"/></svg>',
    'water': '<svg viewBox="-1 -1 2 2"><path d="M0,-1 C0.3,-0.4 0.65,0 0.65,0.3 A0.65,0.65 0 1 1 -0.65,0.3 C-0.65,0 -0.3,-0.4 0,-1Z"/></svg>',
    'ice': '<svg viewBox="-1 -1 2 2"><g stroke-width="0.26" stroke-linecap="round"><line x1="-0.9" y1="0" x2="0.9" y2="0"/><line x1="-0.45" y1="-0.78" x2="0.45" y2="0.78"/><line x1="-0.45" y1="0.78" x2="0.45" y2="-0.78"/></g></svg>',
    'thunder': '<svg viewBox="-1 -1 2 2"><polygon points="0.25,-1 -0.5,0.1 -0.02,0.1 -0.25,1 0.5,-0.15 0.02,-0.15"/></svg>',
}
NAME = {'fire': 'Fire', 'water': 'Water', 'ice': 'Ice', 'thunder': 'Thunder'}
# disc facings per state: order UL, LL, UR, LR (left column, right column)
STATES = {
    'i': {'discs': ['fire', 'fire', 'fire', 'fire'], 'aff': ('Absorbs', 'fire', 'Weak', 'ice'), 'pips': 0, 'glow': False,
          'intent': 'Every disc shows <b>Fire</b>: four <b>Firaga</b> next. He absorbs Fire and is <b>weak to Ice</b>.'},
    'ii': {'discs': ['fire', 'fire', 'fire', 'fire'], 'aff': ('Absorbs', 'fire', 'Weak', 'ice'), 'pips': 6, 'glow': True,
           'intent': 'He glows red: <b>Dispel</b> on the party, then <b>Ultima</b>. After it, every disc turns to the next element.'},
    'iii': {'discs': ['thunder', 'fire', 'fire', 'fire'], 'aff': ('Absorbs', 'fire', 'Halves', 'thunder'), 'pips': 2, 'glow': False,
            'intent': 'One disc turned to <b>Thunder</b>: three <b>Firaga</b> and one <b>Thundara</b> next. Ice no longer hurts him double.'},
}
MOMENT = {'i': 'turn one: every disc on Fire', 'ii': 'he glows red: Dispel, then Ultima', 'iii': 'a disc turned: his resistances change'}
O4TAG = {'a': 'Red glow only (as the game)', 'b': 'Glow + attack pips', 'c': 'Glow + one line of intent'}

CSS = '''
html, body { margin: 0; width: 1600px; height: 900px; overflow: hidden; background: #05040a; }
.fr { position: relative; width: 1600px; height: 900px; overflow: hidden; color: var(--ig-paper); font-family: var(--ig-font-text); }
.fr > img.bg { position: absolute; inset: 0; width: 1600px; height: 900px; }
.tag { position: absolute; left: 0; top: 26px; z-index: 30; display: flex; font-family: var(--ig-font-display); font-weight: 700; }
.tag b { background: var(--ig-gold); color: var(--ig-ink); padding: 6px 12px; font-size: 20px; }
.tag span { background: rgba(11,10,18,0.9); padding: 8px 14px; font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase; }
.note { position: absolute; left: 20px; bottom: 4px; font-family: var(--ig-font-display); font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(244,241,232,0.6); }
.cpt { position: absolute; right: 8px; bottom: 6px; font-family: var(--ig-font-display); font-weight: 700; font-size: 13px; letter-spacing: 0.3em; color: rgba(244,241,232,0.6); }
/* the disc strip (O-2 B): what each disc faces him with, and what that makes him */
.ds { position: absolute; left: 690px; top: 14px; z-index: 12; display: flex; align-items: center; gap: 14px; padding: 8px 18px 8px 14px;
  background: rgba(11,10,18,0.88); border-bottom: 2px solid var(--ig-gold); transform: skewX(var(--ig-skew)); box-shadow: 0 6px 18px rgba(0,0,0,0.55); }
.ds > * { transform: skewX(var(--ig-skew-inverse)); }
.ds h4 { margin: 0; font-family: var(--ig-font-display); font-weight: 700; font-size: 13px; letter-spacing: 0.18em; color: var(--ig-gold); text-transform: uppercase; line-height: 1.2; }
.ds__grid { display: grid; grid-template-columns: auto 10px auto; grid-template-rows: auto auto; gap: 4px 6px; align-items: center; }
.ds__mid { grid-row: 1 / 3; grid-column: 2; width: 2px; height: 100%; background: rgba(227,185,74,0.5); justify-self: center; }
.dc { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px 3px 6px; font-family: var(--ig-font-display); font-weight: 700; font-size: 15px; letter-spacing: 0.04em; text-transform: uppercase; }
.dc svg { width: 20px; height: 20px; fill: currentColor; stroke: none; }
.dc svg line { stroke: currentColor; }
.dc--turned { outline: 2px solid #fff; box-shadow: 0 0 12px #fff; }
.aff { display: flex; flex-direction: column; gap: 4px; font-family: var(--ig-font-display); font-weight: 700; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; }
.aff span { display: inline-flex; align-items: center; gap: 6px; }
.aff i { font-style: normal; color: rgba(244,241,232,0.7); font-size: 13px; letter-spacing: 0.14em; min-width: 64px; }
.aff em { font-style: normal; padding: 1px 8px; }
.aff .chg { color: var(--ig-gold); font-size: 13px; }
/* the attack counter (O-4 B) beside his queue tile */
.pips { position: absolute; left: 1148px; top: 212px; z-index: 12; display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: rgba(11,10,18,0.9);
  font-family: var(--ig-font-display); font-weight: 700; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; transform: skewX(var(--ig-skew)); }
.pips > * { transform: skewX(var(--ig-skew-inverse)); }
.pip { display: inline-block; width: 11px; height: 11px; border: 2px solid var(--ig-gold); transform: rotate(45deg); margin: 0 2px; }
.pip--on { background: var(--ig-gold); }
.pips--full { background: var(--ig-blood); color: #fff; box-shadow: 0 0 18px rgba(230,40,40,0.8); }
.pips--full .pip { border-color: #fff; background: #fff; }
/* one line of intent (O-4 C) in the enemy-move slot under the queue */
.intent { position: absolute; right: 56px; top: 548px; width: 460px; z-index: 10; padding: 12px 16px 14px 18px; background: rgba(11,10,18,0.9);
  border-left: 3px solid var(--ig-blood); transform: skewX(var(--ig-skew)); }
.intent > * { transform: skewX(var(--ig-skew-inverse)); }
.intent h4 { margin: 0 0 6px; font-family: var(--ig-font-display); font-weight: 700; font-size: 13px; letter-spacing: 0.2em; color: #e86a6a; text-transform: uppercase; }
.intent p { margin: 0; font-size: 19px; line-height: 1.3; }
.intent p b { color: var(--ig-gold); font-weight: 600; }
'''
PCSS = '''
html, body { width: 390px; height: 844px; }
.ph .ph__ctb-row { width: 60px; position: relative; }
.ph .ph__scene img { left: -300px; }
.ph .ph__turn { top: 280px; }
.pds { position: absolute; left: 10px; right: 10px; top: 40px; z-index: 12; display: flex; align-items: center; gap: 10px; padding: 7px 10px;
  background: rgba(11,10,18,0.9); border-bottom: 2px solid var(--ig-gold); }
.pds h4 { margin: 0; font-family: var(--ig-font-display); font-weight: 700; font-size: 12px; letter-spacing: 0.12em; color: var(--ig-gold); text-transform: uppercase; line-height: 1.15; }
.pds .ds__grid { display: grid; grid-template-columns: auto 6px auto; gap: 3px 3px; align-items: center; }
.pds .ds__mid { grid-row: 1 / 3; grid-column: 2; width: 2px; height: 100%; background: rgba(227,185,74,0.5); justify-self: center; }
.pds .dc { font-size: 12px; padding: 2px 6px 2px 4px; gap: 4px; }
.pds .dc svg { width: 13px; height: 13px; }
.pds .dc { text-transform: uppercase; font-family: var(--ig-font-display); font-weight: 700; display: inline-flex; align-items: center; }
.pds .dc svg { fill: currentColor; stroke: none; }
.pds .dc svg line { stroke: currentColor; }
.pds .aff { display: flex; flex-direction: column; gap: 4px; font-family: var(--ig-font-display); font-weight: 700; font-size: 12px; text-transform: uppercase; }
.pds .aff span { display: inline-flex; align-items: center; gap: 5px; }
.pds .aff i { font-style: normal; font-size: 12px; min-width: 50px; letter-spacing: 0.06em; color: rgba(244,241,232,0.75); }
.pds .aff em { font-style: normal; padding: 1px 5px; }
.pds .dc--turned { outline: 2px solid #fff; box-shadow: 0 0 10px #fff; }
.ppips { position: absolute; left: 16px; top: 506px; z-index: 8; display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: rgba(11,10,18,0.92);
  font-family: var(--ig-font-display); font-weight: 700; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ig-paper); }
.ppips.pips--full { background: var(--ig-blood); color: #fff; }
.ppips .pip { width: 10px; height: 10px; }
.ppips.pips--full .pip { border-color: #fff; background: #fff; }
.pintent { position: absolute; left: 16px; right: 16px; top: 452px; z-index: 8; padding: 8px 12px; background: rgba(11,10,18,0.92); border-left: 3px solid var(--ig-blood); }
.pintent h4 { margin: 0 0 4px; font-family: var(--ig-font-display); font-size: 12px; letter-spacing: 0.18em; color: #e86a6a; text-transform: uppercase; }
.pintent p { margin: 0; font-size: 15px; line-height: 1.3; }
.pintent b { color: var(--ig-gold); }
.pip { display: inline-block; width: 11px; height: 11px; border: 2px solid var(--ig-gold); transform: rotate(45deg); margin: 0 2px; }
.pip--on { background: var(--ig-gold); }
'''


def chip(e, turned=False):
    return '<span class="dc%s" style="background:%s;color:%s">%s%s</span>' % (' dc--turned' if turned else '', COL[e], INKTXT[e], ICON[e], NAME[e])


def strip(st, phone=False, turned=None):
    d = STATES[st]['discs']
    ul, ll, ur, lr = d
    t = turned or [False] * 4
    grid = ('<div class="ds__grid">%s<span class="ds__mid"></span>%s%s%s</div>' % (chip(ul, t[0]), chip(ur, t[2]), chip(ll, t[1]), chip(lr, t[3])))
    a = STATES[st]['aff']
    aff = ('<div class="aff"><span><i>%s</i><em style="background:%s;color:%s">%s</em></span><span><i>%s</i><em style="background:%s;color:%s">%s</em></span></div>'
           % (a[0], COL[a[1]], INKTXT[a[1]], NAME[a[1]], a[2], COL[a[3]], INKTXT[a[3]], NAME[a[3]]))
    if phone:
        return '<div class="pds"><h4>Discs<br>facing<br>him</h4>%s%s</div>' % (grid, aff)
    return '<div class="ds"><h4>Discs<br>facing him</h4>%s%s</div>' % (grid, aff)


def pips(n, phone=False):
    full = n >= 6
    ps = ''.join('<i class="pip%s"></i>' % (' pip--on' if k < n else '') for k in range(6))
    lab = '6 of 6' if full else '%d of 6' % n
    cls = ('ppips' if phone else 'pips') + (' pips--full' if full else '')
    return '<div class="%s"><span>Attacks on him</span><span>%s</span><span>%s</span></div>' % (cls, ps, lab)


def page_desk(path, bg, overlays, tag, sub, note):
    h = [HEAD.format(t=tag, vp='', kit=KIT, css='\n<style>%s</style>' % CSS), '<div class="fr ig">', '<img class="bg" src="%s" alt="">' % bg]
    h += overlays
    h.append('<div class="tag"><b>%s</b><span>%s</span></div>' % (tag, sub))
    h.append('<div class="note">%s</div><div class="cpt">CONCEPT</div></div></body></html>' % note)
    open(path, 'w', encoding='utf-8').write('\n'.join(h))


def tile(name, img=None, enemy=False, cur=False):
    cls = 'ph__tile' + (' ph__tile--current' if cur else '') + (' ph__tile--enemy' if enemy else '')
    inner = '<img src="%s%s.png" alt="">' % (PORT, img) if img else '<span>%s</span>' % name[0]
    return '<div class="ph__ctb-row"><span class="%s">%s</span><span class="ph__ctb-name">%s</span></div>' % (cls, inner, name)


def page_phone(path, scene, overlays, tag, sub):
    h = [HEAD.format(t=tag + ' phone', vp='<meta name="viewport" content="width=390">', kit=KIT,
                     css='\n<link rel="stylesheet" href="%s">\n<style>%s</style>' % (PHONE, PCSS)),
         '<div class="ph ig">', '<div class="ph__scene"><img src="%s" alt=""></div>' % scene]
    h.append('<div class="ph__ctb">' + tile('Tidus', 'tidus', cur=True) + tile('Omnis', None, True) + tile('Auron', 'auron') + tile('Yuna', 'yuna') + tile('Tidus', 'tidus') + '</div>')
    h.append('<div class="ph__turn"><b>Tidus</b><span>Command</span></div>')
    h.append('<div class="ph__cmds"><div class="ph__cmd ph__cmd--on"><span>&#9656; Attack</span></div><div class="ph__cmd"><span>Special</span></div>'
             '<div class="ph__cmd"><span>Items</span></div><div class="ph__cmd"><span>Switch</span></div></div>')
    pm = []
    for n, hp, mp in (('Tidus', '6492<small>/6492</small>', '140'), ('Yuna', '5130<small>/5130</small>', '320'), ('Auron', '6492<small>/6492</small>', '100')):
        pm.append('<div class="ph__pm%s"><img src="%s%s.png" alt=""><span class="ph__pm-name">%s</span><span class="ph__pm-hp">%s<em>%s</em></span>'
                  '<span class="ph__pm-od"><i style="width:30%%"></i></span></div>' % (' ph__pm--acting' if n == 'Tidus' else '', PORT, n.lower(), n, hp, mp))
    h.append('<div class="ph__party">' + ''.join(pm) + '</div>')
    h += overlays
    h.append('<div class="ph__note">Phone 390x844 &middot; scene = real engine frame, HUD is the mockup &middot; numbers are Chapter III\'s</div>')
    h.append('<div class="ph__tag"><b>%s</b><span>%s</span></div><div class="ph__concept">CONCEPT</div></div></body></html>' % (tag, sub))
    open(path, 'w', encoding='utf-8').write('\n'.join(h))


NOTE = 'Real engine frame + HUD (Chapter III, art served in) &middot; overlays = mockup &middot; ring order = our estimate'
os.makedirs(BASE + 'o2-discs', exist_ok=True)
os.makedirs(BASE + 'o4-fight', exist_ok=True)
# O-2 B desktop, and the three phones
page_desk(BASE + 'o2-discs/b-frame.html', 'hud-a.jpg', [strip('i')], 'B', 'Painted discs + a disc strip on the HUD', NOTE)
page_phone(BASE + 'o2-discs/a-phone.html', 'clean-a.jpg', [], 'A', 'Painted discs, facing quarter lit')
page_phone(BASE + 'o2-discs/b-phone.html', 'clean-a.jpg', [strip('i', phone=True)], 'B', 'A + disc strip')
page_phone(BASE + 'o2-discs/c-phone.html', 'clean-c.jpg', [], 'C', 'Ink & Gold rings with symbols')
# O-4: base = O-2 B (painted discs + strip); options vary only the counter / intent (question B14)
for st in ('i', 'ii', 'iii'):
    turned = [st == 'iii', False, False, False]
    for o in 'abc':
        ov = [strip(st, turned=turned)]
        pov = [strip(st, phone=True, turned=turned)]
        if o == 'b':
            ov.append(pips(STATES[st]['pips']))
            pov.append(pips(STATES[st]['pips'], phone=True))
        if o == 'c':
            ov.append('<div class="intent"><h4>Enemy intent</h4><p>%s</p></div>' % STATES[st]['intent'])
            pov.append('<div class="pintent"><h4>Enemy intent</h4><p>%s</p></div>' % STATES[st]['intent'])
        page_desk(BASE + 'o4-fight/%s-%s.html' % (o, st), 'hud-%s.jpg' % st, ov, o.upper(), '%s &mdash; %s' % (O4TAG[o], MOMENT[st]), NOTE + ' &middot; plate O-3 C')
        page_phone(BASE + 'o4-fight/%s-%s-phone.html' % (o, st), 'clean-%s.jpg' % st, pov, o.upper(), O4TAG[o])
print('ok')
