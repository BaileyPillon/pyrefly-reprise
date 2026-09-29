"""Sin's head options, 2026-09-29 (FFX only): the head section of the morning sheet, as a self-contained HTML fragment.

../section.html is embedded as it is by ../../src/build_sheet.py (the sheet's own classes: lede, why, opt, picked, pick,
good, bad, src, note, grid, thumb). Every picture is a JPEG data: URI.
  python section.py
"""
import base64, io, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, '..', 'frames')


def uri(name, width=1600, q=66):
    im = Image.open(os.path.join(FR, name)).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


def fig(name, cap, width=1600, maxw=None, q=66):
    st = f' style="max-width:{maxw}px"' if maxw else ''
    return f'<figure{st}><img src="{uri(name, width, q)}" alt="{cap}"><figcaption>{cap}</figcaption></figure>'


def phones(pairs):
    cells = ''.join(f'<figure style="max-width:300px;flex:1 1 240px"><img src="{uri(n, 480, 64)}" alt="{c}"><figcaption>{c}</figcaption></figure>'
                    for n, c in pairs)
    return f'<div style="display:flex;gap:12px;flex-wrap:wrap">{cells}</div>'


C_GOOD = ('Closest to the written sources: a whale-like, scaled colossus over the white city, feathered wings purple at the tips, '
          'the claw on the white tower. One painting in which only the lower jaw moves, so the five stages are one creature. '
          'All four repairs are made once and hold in every stage, and stage 0 now reads as a shut mouth.')
C_BAD = ('The hide reads more like rounded river stones than cliff rock. The far wing\'s root sits behind the shoulder, and on '
         'desktop the turn-order column covers most of that wing. The repaired chin is a little square up close. Stage 0\'s '
         'dark seam is a static patch shown only while the mouth is shut.')
A_GOOD = ('The clock reads best: the maw faces the party, so every stage is plain even on a phone. The wings are spread wide, '
          'and there is a face for Gaze to come from. Round 1\'s faults are gone: its six eyes are now two, and the city no '
          'longer glows like lava.')
A_BAD = ('It reads more like a stone boulder than a whale. The jaw moves straight up, our stand-in for a turn, so the face '
         'flattens at stage 0. The small eyes sit at the edges. On desktop the right wing and the claw are under the '
         'turn-order column.')


def main():
    parts = []
    parts.append('<p class="lede">Link IV, Overdrive Sin, is fought from the <i>Fahrenheit</i>\'s deck above Bevelle at dusk. '
                 'The face approaches over three turns, then the mouth opens in stages until fully open, and Giga-Graviton ends the '
                 'fight (research/ffx-sin.md §5.4, §9.3): <b>the mouth is the clock</b>. Two options, both layered rigs. Each is '
                 'painted once with the mouth fully open and cut into layers, and only the lower jaw moves. Stage 0 is shut '
                 '(turns 1 to 3); stages 1 to 3 cover the opening; stage 4 is fully open. The party on the deck is the '
                 'Garden of Pain line-up Bailey picked (S-29).</p>')
    parts.append('<p class="why"><b>Recommendation:</b> C, repaired. It is the most faithful to the words, it is the head '
                 'you saw in round 3, and its four open faults are fixed: the lower teeth at stage 0, the chin sliver, the '
                 'back of the mouth, and the stage-4 tusk. A is the runner-up if you want the face square to the camera. '
                 'The pick is an agent\'s look.</p>')
    parts.append('<div class="opt picked"><h3>Option C: three-quarter, repaired <span class="pick">RECOMMENDED (an agent\'s look)</span></h3>'
                 + fig('C-s4-1600.jpg', 'Stage 4, fully open: Sin\'s turn 12, Giga-Graviton next (turn 13 is our default; S-1: 12 or 13)')
                 + fig('C-s0-1600.jpg', 'Stage 0, shut: turns 1 to 3, "Drawn to Sin." One dark seam with the fangs over it; no teeth fringe')
                 + fig('C-mouths.jpg', 'The five stages. The same pixels everywhere except where the jaw moves', 1080, 1080)
                 + phones([('C-s0-390.jpg', 'Phone, stage 0'), ('C-s2-390.jpg', 'Phone, stage 2'), ('C-s4-390.jpg', 'Phone, stage 4')])
                 + f'<p class="good"><b>Strengths.</b> {C_GOOD}</p><p class="bad"><b>Faults.</b> {C_BAD}</p>'
                 + fig('C-repairs.jpg', 'The repair list: round 3 on the left, repaired on the right', 1080, 1080)
                 + '</div>')
    parts.append('<div class="opt"><h3>Option A: head-on face and wings</h3>'
                 + fig('A-s4-1600.jpg', 'Stage 4, fully open: the maw faces the party')
                 + fig('A-s0-1600.jpg', 'Stage 0, shut: the jaw lifted until the teeth meet')
                 + fig('A-mouths.jpg', 'The five stages: one painting, the jaw moved straight up (our stand-in for a turn seen head-on)', 1080, 1080)
                 + phones([('A-s0-390.jpg', 'Phone, stage 0'), ('A-s2-390.jpg', 'Phone, stage 2'), ('A-s4-390.jpg', 'Phone, stage 4')])
                 + f'<p class="good"><b>Strengths.</b> {A_GOOD}</p><p class="bad"><b>Faults.</b> {A_BAD}</p></div>')
    parts.append('<p class="note"><b>Two questions.</b> 1. C or A, or a mix (for example C\'s creature with the stage-4 maw turned '
                 'further towards the ship)? A pick approves only what you name. 2. Does the dark seam read as shut enough at '
                 'stage 0?</p>')
    parts.append('<p class="src">Sources, written only: research/ffx-sin.md §5.4, §9.1, §9.3; the FF Wiki text of "Sin (Final '
                 'Fantasy X)", Appearance (whale-like, scaled, clawed arms, feathery wing-like protrusions purple at the tips), and '
                 '"Sin (head)" (revid 4004207: three turns to approach, then nine turns of opening), read through the API as text. '
                 'No retail image was used anywhere as input, reference or IP-Adapter. The only image inputs are our code-drawn '
                 'sketches and our own renders. Our estimates: which turns each stage covers, the jaw angles and lift, the '
                 'eye count in A, and the late look of the deck. The party HP/MP comes from dreams-end.ts (S-29; every stat '
                 'cell there is [estimate]); the current values, the clock position and the Gaze counter are illustrative. Method, '
                 'every render and its verdict: docs/concepts/chapters/sin-2026-09-29/head/README.md.</p>')
    out = os.path.join(HERE, '..', 'section.html')
    open(out, 'w', encoding='utf-8').write('<!-- Sin head options (FFX only), generated by head/src/section.py -->\n' + '\n'.join(parts) + '\n')
    print('wrote', out, round(os.path.getsize(out) / 1e6, 2), 'MB')


if __name__ == '__main__':
    main()
