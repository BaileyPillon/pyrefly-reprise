"""Write mock.html: every option frame for PR-0211 (where the mid-battle line
card goes), one absolutely sized <section> per frame over a real base frame.

The card is drawn in the Ink & Gold dialogue-box language (ivory slab skewed
-12deg, gold edge, ink role tag, Cormorant name, Exo 2 line) from
src/ui/common/dialogue-box.css. Positions are set by hand from the actors' boxes
read off each base frame; option A's slot choice is what the proposed rule
(largest free slot clear of party and speaker boxes) would pick on that frame.

Usage: python mock.py <dir holding the bases, portraits and fonts>
"""
import sys

D = sys.argv[1]
SK = 0.21256  # tan 12deg

CSS = """
@font-face{font-family:Corm;src:url(fonts/CormorantGaramond-Italic-Variable-wght.woff2);font-style:italic}
@font-face{font-family:Exo;src:url(fonts/Exo2-Variable-wght.woff2)}
@font-face{font-family:Chakra;src:url(fonts/ChakraPetch-Bold-700.woff2);font-weight:700}
body{margin:0;background:#0b0a12}
section{position:relative;overflow:hidden;margin:0 0 20px 0;background-size:cover}
.card{position:absolute;filter:drop-shadow(0 10px 22px rgba(0,0,0,.55))}
.slab{position:absolute;background:#f4f1e8}
.edge{position:absolute;background:#e3b94a}
.por{position:absolute;overflow:hidden;background:#1a1624}
.por img{position:absolute;width:100%;height:auto;left:0}
.name{position:absolute;font-family:Corm;font-style:italic;font-weight:600;color:#0b0a12;line-height:1;white-space:nowrap}
.role{display:inline-block;font-style:normal;vertical-align:middle;background:#0b0a12;color:#e3b94a;font-family:Chakra;font-weight:700;letter-spacing:.28em;line-height:1}
.text{position:absolute;font-family:Exo;font-weight:400;color:#0b0a12;line-height:1.35}
.adv{position:absolute;width:0;height:0;border-left:.5em solid transparent;border-right:.5em solid transparent;border-top:.7em solid #d9a832}
.slot{position:absolute;border:3px dashed rgba(244,241,232,.75);background:rgba(244,241,232,.07)}
.slot b{position:absolute;left:8px;top:6px;font:700 15px Chakra;color:#f4f1e8;letter-spacing:.2em}
.hole{position:absolute;border:2px dashed rgba(255,255,255,.45)}
.hole i{position:absolute;left:10px;top:8px;font:italic 15px Exo;color:rgba(255,255,255,.8)}
.dim{position:absolute;background:rgba(6,5,12,.35)}
.voice{position:absolute;font-family:Chakra;font-weight:700;color:#e3b94a;background:#0b0a12;letter-spacing:.24em;line-height:1}
svg{position:absolute;left:0;top:0;overflow:visible}
"""


def para(x0, x1, h):
    """clip-path for a slab skewed -12deg (leaning right) of width x1-x0."""
    s = h * SK
    return f"polygon({s}px 0,{x1 - x0}px 0,{x1 - x0 - s}px {h}px,0 {h}px)"


def card(x, y, w, h, img, name, role, text, *, over=0.28, por=True, focus=0.06,
         size=1.0):
    """Ink & Gold card: portrait frame (overhanging the slab top by `over`*h) then
    the slab. Returns HTML. (x, y) is the slab's top-left before the skew."""
    fs = h * 0.2 * size
    out = [f'<div class="card" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">']
    body_x = 0.05 * w
    if por:
        ph = h * (1 + over)
        pw = ph * 0.72
        s = ph * SK
        out.append(f'<div class="edge" style="left:{-h*0.05}px;top:{-h*over}px;width:{pw*0.1 + s}px;'
                   f'height:{ph}px;clip-path:polygon({s}px 0,{s + h*0.045}px 0,{h*0.045}px {ph}px,0 {ph}px)"></div>')
        out.append(f'<div class="slab" style="left:{pw*0.55}px;top:0;width:{w - pw*0.55}px;height:{h}px;'
                   f'clip-path:{para(0, w - pw*0.55, h)}"></div>')
        out.append(f'<div class="por" style="left:0;top:{-h*over}px;width:{pw + s}px;height:{ph}px;'
                   f'clip-path:polygon({s}px 0,{pw + s}px 0,{pw}px {ph}px,0 {ph}px)">'
                   f'<img src="{img}" style="top:{-focus*100}%"></div>')
        body_x = pw + s * 0.4 + h * 0.08
    else:
        out.append(f'<div class="edge" style="left:{-h*0.06}px;top:0;width:{h*0.3}px;height:{h}px;'
                   f'clip-path:polygon({h*SK}px 0,{h*SK + h*0.05}px 0,{h*0.05}px {h}px,0 {h}px)"></div>')
        out.append(f'<div class="slab" style="left:0;top:0;width:{w}px;height:{h}px;clip-path:{para(0, w, h)}"></div>')
        body_x = h * SK + h * 0.12
    rs = max(9, fs * 0.33)
    out.append(f'<div class="name" style="left:{body_x}px;top:{h*0.16}px;font-size:{fs}px">{name} '
               f'<span class="role" style="font-size:{rs}px;padding:{rs*0.45}px {rs*0.6}px;margin-left:{fs*0.25}px">{role}</span></div>')
    out.append(f'<div class="text" style="left:{body_x}px;top:{h*0.16 + fs*1.3}px;width:{w - body_x - h*0.35}px;'
               f'font-size:{fs*0.78}px">{text}</div>')
    out.append(f'<div class="adv" style="right:{h*0.3}px;bottom:{h*0.14}px;font-size:{fs*0.45}px"></div>')
    out.append('</div>')
    return ''.join(out)


def tail(x0, y0, x1, y1, ax, ay):
    """An ivory pointer from the card edge (x0,y0)-(x1,y1) to the anchor."""
    return (f'<svg width="10" height="10"><polygon points="{x0},{y0} {x1},{y1} {ax},{ay}" '
            f'fill="#f4f1e8" style="filter:drop-shadow(0 6px 10px rgba(0,0,0,.5))"/></svg>')


def section(sid, bg, w, h, inner):
    return (f'<section id="{sid}" style="width:{w}px;height:{h}px;background-image:url({bg})">'
            f'{inner}</section>')


J = ('jecht.png', 'Jecht', 'FINAL AEON')
BR = ('braska.png', 'Braska', 'HIGH SUMMONER')
RK = ('rikku-x2.png', 'Rikku', 'SPHERE HUNTER')
L3 = "Don't you dare slow down now."
L5 = 'No overtime in this one, kid.'
L5b = 'You were always going to be braver than me.'
L5r = "And that's a tail."
HOLE = ('<div class="hole" style="left:100px;top:0;width:1312px;height:440px">'
        '<i>filled: the backed-out card hid this area in the source frame</i></div>')

S = []
# ---------------------------------------------------------------- A: free side
S.append(section('a-iii-1600', 'iii-1600.jpg', 1600, 900,
    '<div class="slot" style="left:1010px;top:560px;width:560px;height:300px"><b>SLOT 4 · PARTY HUD</b></div>'
    '<div class="slot" style="left:30px;top:600px;width:360px;height:270px"><b>SLOT 3</b></div>'
    '<div class="slot" style="left:830px;top:24px;width:480px;height:170px"><b>SLOT 2 · OVER BOSS</b></div>'
    + '<div class="slot" style="left:30px;top:30px;width:760px;height:240px;border-color:#e3b94a"><b style="top:auto;bottom:6px;color:#e3b94a">SLOT 1 · PICKED</b></div>'
    + card(40, 70, 720, 176, *J, L3)))
S.append(section('a-iii-2000', 'iii-2000.jpg', 2000, 1012, card(60, 84, 900, 206, *J, L3)))
S.append(section('a-v-1600', 'v-1600.jpg', 1600, 900, card(40, 90, 720, 176, *BR, L5b, focus=0.1)))
S.append(section('a-v-2000', 'v-2000.jpg', 2000, 1012, HOLE + card(130, 96, 780, 200, *J, L5)))
S.append(section('a-v-390', 'v-390.jpg', 390, 844, card(14, 168, 364, 104, *J, L5, over=0.2, size=0.9)))
# ---------------------------------------------------------------- B: bottom band
def band(W, H, img, name, role, text, focus=0.06, m=None, bh=None):
    m = m if m is not None else W * 0.025
    bh = bh or H * 0.19
    dim = (f'<div class="dim" style="left:0;top:{H - bh - 60}px;width:{W}px;height:{bh + 60}px;'
           f'background:linear-gradient(rgba(6,5,12,0),rgba(6,5,12,.45) 40%)"></div>')
    return dim + card(m, H - bh - m * 0.6, W - 2 * m, bh, img, name, role, text, over=0.18, focus=focus)
S.append(section('b-iii-1600', 'iii-1600.jpg', 1600, 900, band(1600, 900, *J, L3)))
S.append(section('b-iii-2000', 'iii-2000.jpg', 2000, 1012, band(2000, 1012, *J, L3)))
S.append(section('b-v-1600', 'v-1600.jpg', 1600, 900, band(1600, 900, *BR, L5b, focus=0.1)))
S.append(section('b-v-2000', 'v-2000.jpg', 2000, 1012, HOLE + band(2000, 1012, *J, L5)))
S.append(section('b-v-390', 'v-390.jpg', 390, 844,
    '<div class="dim" style="left:0;top:548px;width:390px;height:296px;background:rgba(6,5,12,.55)"></div>'
    + card(8, 600, 374, 150, *J, L5, over=0.12, size=0.8)))
# ---------------------------------------------------------------- C: bubble at the speaker
S.append(section('c-iii-1600', 'iii-1600.jpg', 1600, 900,
    tail(640, 250, 740, 250, 872, 300) + card(230, 110, 560, 140, *J, L3, por=False)))
S.append(section('c-iii-2000', 'iii-2000.jpg', 2000, 1012,
    tail(880, 254, 990, 254, 1150, 320) + card(360, 96, 660, 158, *J, L3, por=False)))
S.append(section('c-v-1600', 'v-1600.jpg', 1600, 900,
    tail(430, 360, 520, 360, 468, 432) + card(330, 234, 520, 126, *RK, L5r, por=False)))
S.append(section('c-v-2000', 'v-2000.jpg', 2000, 1012, HOLE
    + '<div class="voice" style="left:150px;top:62px;font-size:15px;padding:7px 12px">VOICE · OFF STAGE</div>'
    + card(130, 100, 700, 160, *J, L5, por=False)))
S.append(section('c-v-390', 'v-390.jpg', 390, 844,
    tail(60, 290, 110, 290, 135, 322) + card(12, 196, 330, 94, *RK, L5r, por=False, size=1.05)))

html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{"".join(S)}</body></html>'
open(D + '/mock.html', 'w', encoding='utf-8').write(html)
print('sections', len(S))
