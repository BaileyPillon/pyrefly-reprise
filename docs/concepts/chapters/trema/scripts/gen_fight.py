# Writes the O-4 "Reading the fight" mockup pages for the Trema chapter (FFX-2 only).
# Desktop pages sit over real 1600x900 engine frames (hud-p1.jpg Paragon, hud-p2.jpg Trema);
# phone pages are our own 390x844 layout over the HUD-less frames (clean-p*.jpg).
# Facts shown (research/ffx2-trema.md): Paragon counters an attack Protect or Shell cannot reduce with
# Big Bang on the party (§4.1; Darkness is such an attack, plan §4.1 #8); Trema HP 999,999, Paragon HP
# 200,000 (§3); one-shot HP triggers below 1/2 Meteor, below 1/4 Meteor, below 1/6 Ultima (§4.2; T-1);
# Meteor = 12 hits on random members, 1/8 of max HP each (§4.2; T-2 says 12 vs 10). Current HP values
# are illustrative. The Darkness hint is ffx2-vegnagun-shuyin §6.4 as quoted in src/data/ffx2/abilities/dark-knight.ts. No odds, no invented target, no Flee.
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'fight') + os.sep
P = '../../../../../public/art/portraits/'
HEAD = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{t}</title>{vp}
<link rel="stylesheet" href="../../../polish/_kit/kit.css">
<link rel="stylesheet" href="fight.css"></head><body>
'''
TAGS = {'a': 'Intent text only', 'b': 'Chips on the HUD', 'c': 'Marks in the world'}
STATES = {'p1': 'link 1: Paragon, a Dark Knight about to pick Darkness',
          'p2': 'link 2: Trema just above half HP, Meteor next'}
NOTE = ('Real engine frame + real FFX-2 HUD (Chapter IV battle, names and numbers swapped) '
        '&middot; overlays are the mockup &middot; current HP illustrative')
BAR_L, BAR_R, BAR_T = 154, 524, 120   # measured on the real frame


def x_at(frac):
    return round(BAR_L + (BAR_R - BAR_L) * frac)


def desk(opt, st):
    h = [HEAD.format(t='Trema O-4 %s %s' % (opt.upper(), st), vp=''),
         '<div class="fr ig ig--ffx2">', '<img class="bg" src="hud-%s.jpg" alt="">' % st]
    if st == 'p1':
        h.append('<div class="cmdpatch">DARKNESS</div>')
        h.append('<div class="hintpatch"><b>DARKNESS</b>Special damage to every foe. Ignores Defense.</div>')
        h.append('<div class="num">200,000<small>/200,000</small></div>')
    else:
        h.append('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:12px;background:#2a2433;z-index:11"></div>'
                 % (x_at(0.512), BAR_T, BAR_R - x_at(0.512) + 1))
        h.append('<div class="num">512,340<small>/999,999</small></div>')
    if opt == 'a':
        if st == 'p1':
            h.append('<div class="intent"><h4>Enemy intent</h4><p>Paragon answers any attack that <b>Protect or Shell cannot '
                     'reduce</b> with <b>Big Bang</b> on the whole party.</p><p>Darkness is one of those attacks.</p></div>')
        else:
            h.append('<div class="intent"><h4>Enemy intent</h4><p>Below <b>half</b> his HP, Trema casts <b>Meteor</b>: '
                     '12 hits on random targets, each 1/8 of that member&rsquo;s max HP.</p>'
                     '<p>Again below a quarter. <b>Ultima</b> below a sixth.</p></div>')
    elif opt == 'b':
        if st == 'p1':
            h.append('<div class="chip chip--warn" style="left:1262px;top:386px"><span>Draws Big Bang</span></div>')
            h.append('<div class="chip chip--ink" style="left:360px;top:152px"><span>Counter: Big Bang</span></div>')
        else:
            for f, lbl, dim in ((0.5, 'METEOR', False), (0.25, 'METEOR', True), (1 / 6, 'ULTIMA', True)):
                x = x_at(f)
                h.append('<div class="tick" style="left:%dpx;top:113px"></div>' % (x - 1))
                h.append('<div class="ticklbl%s" style="left:%dpx;top:%dpx">%s</div>' % (' ticklbl--dim' if dim else '', x, 94 if f < 0.2 else 186, lbl))
            h.append('<div class="chip chip--warn" style="left:360px;top:150px"><span>Next: Meteor below 1/2</span></div>')
    else:
        if st == 'p1':
            h.append('<div class="ring" style="left:800px;top:520px;width:360px;height:80px"></div>')
            h.append('<div class="floatlbl" style="left:830px;top:250px;color:#ff9a9a">Counter ready: Big Bang</div>')
            h.append('<div class="arrow" style="left:860px;top:430px;width:220px;transform:rotate(160deg)"></div>')
            h.append('<div class="floatlbl" style="left:420px;top:318px">Darkness draws it</div>')
        else:
            h.append('<div class="star" style="left:876px;top:170px">1/2</div>')
            h.append('<div class="floatlbl" style="left:950px;top:186px;color:#ffd08a">Meteor next</div>')
            h.append('<div class="ring" style="left:300px;top:640px;width:460px;height:150px;border-color:#ffb24a;box-shadow:0 0 22px #ffb24a"></div>')
            h.append('<div class="floatlbl" style="left:330px;top:800px">12 hits &middot; random &middot; 1/8 max HP each</div>')
    h.append('<div class="tag"><b>%s</b><span>%s &mdash; %s</span></div>' % (opt.upper(), TAGS[opt], STATES[st]))
    h.append('<div class="note">%s</div><div class="cpt">CONCEPT</div></div></body></html>' % NOTE)
    open(OUT + '%s-%s.html' % (opt, st), 'w', encoding='utf-8').write('\n'.join(h))


def phone(opt, st):
    boss, cur, mx, frac = (('Paragon', '200,000', '200,000', 1.0) if st == 'p1' else ('Trema', '512,340', '999,999', 0.512))
    h = [HEAD.format(t='Trema O-4 %s %s phone' % (opt.upper(), st), vp='<meta name="viewport" content="width=390">'),
         '<div class="ph ig ig--ffx2">',
         '<div class="ph__scene"><img src="clean-%s.jpg" alt=""></div>' % st,
         '<div class="ph__boss"><span class="nm">%s</span><span class="pn">%s<small>/%s</small></span>'
         '<span class="bar"><i style="width:%.1f%%"></i></span>' % (boss, cur, mx, frac * 100)]
    if opt == 'b' and st == 'p2':
        for f, lbl in ((0.5, 'METEOR'), (0.25, 'METEOR'), (1 / 6, 'ULTIMA')):
            x = 14 + (390 - 28) * f
            h.append('<span class="ptk" style="left:%.0fpx"></span>' % x)
        h.append('<span class="ptl" style="left:%.0fpx">MET</span><span class="ptl" style="left:%.0fpx;background:#0b0a12">MET</span>'
                 '<span class="ptl" style="left:%.0fpx;background:#0b0a12;top:56px;transform:translateX(-120%%)">ULT</span>'
                 % (14 + 362 * 0.5, 14 + 362 * 0.25, 14 + 362 / 6))
    h.append('</div>')
    if opt == 'b' and st == 'p1':
        h.append('<div class="pchip pchip--warn" style="right:14px;top:84px">Counter: Big Bang</div>')
    if opt == 'b' and st == 'p2':
        h.append('<div class="pchip pchip--warn" style="right:14px;top:84px">Next: Meteor below 1/2</div>')
    if opt == 'a':
        txt = ('Paragon answers any attack <b>Protect or Shell cannot reduce</b> with <b>Big Bang</b> on the party. '
               'Darkness is one.') if st == 'p1' else ('Below <b>half</b> HP: <b>Meteor</b>, 12 hits on random targets, '
                                                    '1/8 max HP each. Again below 1/4; <b>Ultima</b> below 1/6.')
        h.append('<div class="pint"><h4>Enemy intent</h4><p>%s</p></div>' % txt)
    if opt == 'c':
        if st == 'p1':
            h.append('<div style="position:absolute;left:150px;top:300px;width:200px;height:44px;border-radius:50%;border:3px solid #b02a2a;box-shadow:0 0 16px #b02a2a;z-index:9"></div>')
            h.append('<div class="floatlbl" style="left:170px;top:118px;font-size:14px;color:#ff9a9a">Counter: Big Bang</div>')
            h.append('<div class="floatlbl" style="left:14px;top:196px;font-size:13px">Darkness draws it</div>')
        else:
            h.append('<div class="star" style="left:200px;top:96px;width:44px;height:44px;font-size:12px">1/2</div>')
            h.append('<div class="floatlbl" style="left:252px;top:108px;font-size:14px;color:#ffd08a">Meteor next</div>')
            h.append('<div style="position:absolute;left:10px;top:330px;width:200px;height:70px;border-radius:50%;border:3px solid #ffb24a;box-shadow:0 0 16px #ffb24a;z-index:9"></div>')
            h.append('<div class="floatlbl" style="left:14px;top:404px;font-size:13px">12 hits &middot; 1/8 max HP each</div>')
    first = 'DARKNESS' if st == 'p1' else 'ARCANA'
    warn = '<span style="float:right;margin-right:10px;font-size:12px;background:#b02a2a;color:#fff;padding:0 5px;line-height:18px;margin-top:10px;transform:skewX(-12deg)">BIG BANG</span>' if (opt == 'b' and st == 'p1') else ''
    h.append('<div class="ph__turn">Command<b>Yuna</b></div>')
    h.append('<div class="ph__cmds"><div class="ph__cmd ph__cmd--on"><span>%s</span>%s</div><div class="ph__cmd"><span>CHANGE</span></div>'
             '<div class="ph__cmd"><span>ITEM</span></div></div>' % (first, warn))
    rows = []
    for n, j, hp, mp, atb in (('Yuna', 'DARK KNIGHT', '5355', '338', 100), ('Rikku', 'ALCHEMIST', '2553', '107', 64), ('Paine', 'DARK KNIGHT', '5355', '338', 38)):
        rows.append('<div class="ph__pm%s"><img src="%s%s.png" alt=""><span class="n">%s</span><span class="j">%s</span>'
                    '<span class="hp">%s<em>%s</em></span><span class="atb"><i style="width:%d%%"></i></span></div>'
                    % (' ph__pm--acting' if n == 'Yuna' else '', P, {'Yuna': 'yuna-x2', 'Rikku': 'rikku-x2', 'Paine': 'paine'}[n], n, j, hp, mp, atb))
    h.append('<div class="ph__party">' + ''.join(rows) + '</div>')
    h.append('<div class="ptag">%s &middot; %s &middot; CONCEPT</div>' % (opt.upper(), TAGS[opt]))
    h.append('</div></body></html>')
    open(OUT + '%s-%s-phone.html' % (opt, st), 'w', encoding='utf-8').write('\n'.join(h))


for o in 'abc':
    for s in ('p1', 'p2'):
        desk(o, s)
        phone(o, s)
print('ok')
