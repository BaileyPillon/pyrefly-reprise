# Writes the O-4 mockup pages (FFX-2 only): three options x three moments at 1600x900, and one phone page per option.
# Every rule shown comes from research/ffx2-gippal-den-of-woe.md §4; party numbers and counts are illustrative.
# Usage: python o4_html.py <o4-fight dir>
import sys, os
D = sys.argv[1]
HEAD = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Den of Woe O-4 {k} {m}</title>\n' \
       '<link rel="stylesheet" href="../../../polish/_kit/kit.css">\n<link rel="stylesheet" href="{css}"></head><body>\n'
NOTE = '<div class="note">Composite: O-3 A plate, party at engine positions, real Chapter V HUD &middot; overlays = mockup &middot; {sil}numbers illustrative</div><div class="cpt">CONCEPT</div>'
SIL = {'p1': 'Baralai = placeholder shape (O-2) &middot; ', 'p2': '', 'p3': 'Nooj = placeholder shape (O-2) &middot; '}
MOM = {'p1': 'shade 1: Baralai counts blows', 'p2': 'shade 2: Gippal\'s cycle', 'p3': 'shade 3: Nooj nears Lightfall'}
LINK = lambda n: '<span>Shade</span>' + ''.join(f'<i class="pip{" pip--on" if i < n else ""}"></i>' for i in range(3)) + f'<span>{n} of 3</span>'

A = {
 'p1': '<div class="intent"><h4>Shade 1 of 3 &middot; Baralai</h4><p>He counts every blow that lands on him: <b>6 of 8</b>.</p><p>At 8 he answers the last attacker with <b>Drill Shot</b>, 3/4 of that fighter\'s max HP.</p></div>',
 'p2': '<div class="intent"><h4>Shade 2 of 3 &middot; Gippal</h4><p>Next in his cycle: <b>Bullseye</b>, 9/16 of your current HP. It cannot KO.</p><p>Below 1/3 HP he drops the cycle and adds <b>Mortar</b>.</p></div>',
 'p3': '<div class="intent"><h4>Shade 3 of 3 &middot; Nooj</h4><p>At <b>2,999 HP or less</b> he casts <b>Lightfall</b> once: <b>5,000</b> to all of you.</p><p>Yuna\'s max HP is 2,488.</p></div>',
}
B = {
 'p1': '<div class="chip chip--link" style="left:60px;top:166px">' + LINK(1) + '</div>'
       '<div class="chip chip--pink" style="left:300px;top:166px"><span>Blows</span>' + ''.join(f'<i class="pip{" pip--on" if i < 6 else ""}{" pip--warn" if i >= 6 else ""}"></i>' for i in range(8)) + '<span>6/8 &rarr; Drill Shot</span></div>'
       '<div class="chip chip--warn" style="left:1250px;top:790px"><span>Last hit: Paine</span></div>',
 'p2': '<div class="cycle"><span class="done">Grinder</span><span class="done">Attack</span><span class="done">Grinder</span><span class="done">Attack</span><span class="next">Bullseye next &middot; 9/16 of current HP</span></div>'
       '<div class="chip chip--link" style="left:60px;top:212px">' + LINK(2) + '</div>'
       '<div class="chip chip--link" style="left:340px;top:212px"><span>Below 1/3: random + Mortar</span></div>',
 'p3': '<div class="mark" style="left:199px;top:112px"></div>'
       '<div class="chip chip--warn" style="left:150px;top:166px"><span>&le; 2,999 HP &rarr; Lightfall &middot; 5,000 to all, once</span></div>'
       '<div class="chip chip--link" style="left:60px;top:212px">' + LINK(3) + '</div>'
       '<div class="chip chip--warn" style="left:1020px;top:664px"><span>KO at Lightfall</span></div>',
}
C = {
 'p1': '<div class="sigil" style="left:1040px;top:190px">6/8</div><div class="floatlbl" style="left:960px;top:150px">Drill Shot at 8</div>'
       '<div class="ring" style="left:600px;top:628px;width:170px;height:48px"></div><div class="floatlbl" style="left:600px;top:360px;color:#ff9a9a">last attacker</div>',
 'p2': '<div class="sigil" style="left:1040px;top:190px">5/5</div><div class="floatlbl" style="left:990px;top:150px">Bullseye next</div>'
       '<div class="floatlbl" style="left:920px;top:272px;font-size:16px">9/16 of current HP &middot; cannot KO</div>',
 'p3': '<div class="sigil sigil--warn" style="left:1040px;top:160px">2,999</div><div class="floatlbl" style="left:960px;top:120px;color:#ff9a9a">Lightfall at &le; 2,999</div>'
       '<div class="ring" style="left:150px;top:752px;width:180px;height:52px"></div><div class="floatlbl" style="left:120px;top:400px;color:#ff9a9a">5,000 &gt; 2,488 max HP</div>',
}
OPT = {'a': ('A', 'Intent text only', A), 'b': ('B', 'Chips on the HUD', B), 'c': ('C', 'Marks in the world', C)}
for k, (L, name, body) in OPT.items():
    for m in ('p1', 'p2', 'p3'):
        html = HEAD.format(k=L, m=m, css='fight.css') + f'<div class="fr ig ig--ffx2">\n<img class="bg" src="hud-{m}.jpg" alt="">\n{body[m]}\n' \
               f'<div class="tag"><b>{L}</b><span>{name} &mdash; {MOM[m]}</span></div>\n' + NOTE.format(sil=SIL[m]) + '</div></body></html>\n'
        open(os.path.join(D, f'{k}-{m}.html'), 'w', encoding='utf-8').write(html)

POR = '../../../../../public/art/portraits/'
PARTY = [('yuna-x2', 'Yuna', '879', '2488', 90), ('rikku-x2', 'Rikku', '5652', '5652', 40), ('paine', 'Paine', '5500', '5862', 65)]
PH = {
 'a': '<div class="pi"><h4>Shade 2 of 3 &middot; Gippal</h4><p>Next in his cycle: <b>Bullseye</b>, 9/16 of your current HP. It cannot KO. Below 1/3 HP he adds <b>Mortar</b>.</p></div>',
 'b': '<div class="cyc"><span>Grind</span><span>Atk</span><span>Grind</span><span>Atk</span><span class="next">Bullseye</span></div>'
      '<div class="pc pc--dark" style="left:12px;top:118px">Shade 2 of 3</div><div class="pc pc--pink" style="left:136px;top:118px">Next: 9/16 of current HP</div>'
      '<div class="pc pc--dark" style="left:12px;top:148px">Below 1/3: + Mortar</div>',
 'c': '<div class="sg" style="left:268px;top:180px">5/5</div><div class="fl" style="left:196px;top:150px">Bullseye next</div>'
      '<div class="fl" style="left:150px;top:238px">9/16 current HP &middot; no KO</div>',
}
for k, (L, name, _) in OPT.items():
    rows = ''.join(f'<div class="ph__pm"><img src="{POR}{p}.png" alt=""><span class="ph__pm-name">{n}</span><span class="ph__pm-hp">{hp}<small>/{mx}</small></span>'
                   f'<span class="ph__atb"><i style="width:{atb}%"></i></span></div>' for p, n, hp, mx, atb in PARTY)
    html = HEAD.format(k=L, m='p2 phone', css='phone.css').replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="viewport" content="width=390">') + \
        '<div class="ph ig ig--ffx2">\n<div class="ph__scene"><img src="clean-p2.jpg" alt="" style="left:-229px"></div>\n' \
        '<div class="ph__boss"><b>Gippal</b><i></i></div>\n' + PH[k] + '\n' \
        '<div class="ph__cmds"><div class="ph__cmd ph__cmd--on">White Magic</div><div class="ph__cmd">Change</div><div class="ph__cmd">Item</div></div>\n' \
        f'<div class="ph__party">{rows}</div>\n<div class="ph__tag"><b>{L}</b><span>{name}</span></div>\n' \
        '<div class="ph__note">390x844 &middot; HUD = mockup</div><div class="ph__cpt">CONCEPT</div></div></body></html>\n'
    open(os.path.join(D, f'{k}-p2-phone.html'), 'w', encoding='utf-8').write(html)
print('ok')
