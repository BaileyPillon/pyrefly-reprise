# Chapter XIV (Isaaru, FFX only) production sheet: the installed CANDIDATES in real 1600x900 engine frames,
# before/after at 1:1, one column, every word >= 12.5 px when shown 390 px wide (uses ../../scripts/sheet.py).
# Also writes the phone-sized single frames to production/frames/.
import json, os, subprocess
from PIL import Image

D = 'D:/Final Fantasy/docs/concepts/chapters/isaaru/'
ART = 'D:/Final Fantasy/public/art/'
OPT = 'D:/Tools/pyrefly-scratch/isaaru-options/renders/'
W = 'D:/Tools/pyrefly-scratch/ch1215/isaaru-art/'
FR = W + 'frames/'
C = W + 'cards/'
os.makedirs(C, exist_ok=True)
os.makedirs(D + 'production/frames', exist_ok=True)


def on(p, bg=(40, 38, 52)):
    im = Image.open(p).convert('RGBA')
    b = Image.new('RGBA', im.size, bg + (255,))
    b.alpha_composite(im)
    return b.convert('RGB')


def pair(a, b, box, name, k=2):
    x0, y0, x1, y1 = box
    A, B = on(a).crop(box), on(b).crop(box)
    w, h = x1 - x0, y1 - y0
    s = Image.new('RGB', (w * 2 + 6, h), (10, 10, 10))
    s.paste(A, (0, 0)); s.paste(B, (w + 6, 0))
    s = s.resize((s.width * k, s.height * k), Image.NEAREST)
    s.save(C + name, quality=92)
    return C + name


def card(p, name, bg=(40, 38, 52)):
    on(p, bg).save(C + name, quality=92)
    return C + name


IA, IB = OPT + 'isaaru-a3.png', ART + 'characters/isaaru/idle.png'
PA, PB = OPT + 'isaaru-pb2.png', ART + 'portraits/isaaru.png'
cards = {
    'ia': card(IA, 'idle-before.jpg'), 'ib': card(IB, 'idle-after.jpg'),
    'pa': card(PA, 'portrait-before.jpg'), 'pb': card(PB, 'portrait-after.jpg'),
    'belt': pair(IA, IB, (380, 340, 570, 500), 'belt-1to1.jpg'),
    'hemL': pair(IA, IB, (120, 780, 340, 960), 'hem-left-1to1.jpg'),
    'hemR': pair(IA, IB, (540, 800, 660, 1090), 'hem-right-1to1.jpg', k=1),
    'hair': pair(PA, PB, (100, 420, 330, 760), 'portrait-shoulder-1to1.jpg', k=1),
    'tie': pair(PA, PB, (180, 0, 560, 110), 'portrait-tie-1to1.jpg', k=1),
}
for n in ('grothia', 'pterya', 'spathi'):
    for p in ('idle', 'attack', 'overdrive'):
        cards[f'{n}-{p}'] = card(ART + f'characters/{n}/{p}.png', f'{n}-{p}.jpg', (34, 14, 18))
src = {'grothia': 'ifrit', 'pterya': 'valefor', 'spathi': 'bahamut'}
for n, a in src.items():
    cards[f'{a}-src'] = card(ART + f'characters/{a}/idle.png', f'{a}-idle-src.jpg', (34, 14, 18))
cards['plate'] = C + 'plate.jpg'
Image.open(ART + 'backdrops/via-purifico.png').convert('RGB').resize((1344, 768), Image.LANCZOS).save(cards['plate'], quality=90)

# single frames for the repo (phone-openable), JPEG
for f in ('grothia-hud', 'grothia-clean', 'pterya-hud', 'spathi-hud', 'grothia-ko', 'dialogue'):
    Image.open(FR + f + '.png').convert('RGB').save(D + f'production/frames/{f}.jpg', quality=84)


def one(k, img, cap, **kw):
    return dict({'key': k, 'img': img, 'cap': cap}, **kw)


spec = {
    'width': 1200, 'stamp': 'CANDIDATE',
    'title': 'Chapter XIV  Isaaru (FFX only)  production CANDIDATES',
    'question': ("Bailey's picks (2026-09-25, \"I'll go with all your recommendations\"): O-1 A, O-2 B, O-3 A, O-4 C, "
                 "KO = the pyrefly dissolve. Real Chapter X engine at 1600x900: a Yuna-only line-up, the installed files "
                 "served in place of the stand-ins. Turn order and names are patched in the browser; the chapter is not wired."),
    'rec': ('Method r3, 0 GPU minutes: every painting is the picked pixels. Isaaru: coat cut to the knee, sash and knot '
            'sea green, coat toward black, robe highlights tamed. Portrait: brought to the O-1 A colours. Aeons: the '
            'O-4 C grade and edge on the D-089 paintings (read only). Plate: exactly as picked.'),
    'note': 'Not judged independently, not approved, nothing in approved-hashes.json. The chapter still owes its scene, data and wiring.',
    'blocks': [
        one('1', FR + 'grothia-hud.png', 'Link 1: Grothia (his Ifrit) against Yuna and her Shiva, Isaaru at the right. The HUD is the real one.'),
        one('2', FR + 'pterya-hud.png', 'Link 2: Pterya (his Valefor) against her Bahamut. Staging is the options round\'s: at this spot the wing covers Isaaru.'),
        one('3', FR + 'spathi-hud.png', 'Link 3: Spathi (his Bahamut) against her Ixion. The sea-green edge keeps the dark painting readable in the dark room.'),
        one('4', FR + 'grothia-ko.png', 'KO: no painting. The engine\'s pyrefly dissolve, here mid-way (0.55).'),
        {'head': 'Isaaru, before (the O-1 A render) and after'},
        {'grid': [one('', cards['ia'], 'O-1 A as rendered: ankle coat, white sash, navy knot'),
                  one('', cards['ib'], 'Installed: knee coat, sea-green belt and knot, black coat, tamed white')], 'cols': 2, 'h': 900},
        one('', cards['belt'], 'Belt and knot at 2x (left before, right after): colours from his own sea-green lapel. The knot keeps its drawn shape; it is not a bow.'),
        one('', cards['hemL'], 'Left hem at 2x: the panel ends at the knee with an ink hem; the robe in front is untouched.'),
        one('', cards['hemR'], 'Right edge at 1:1: the sea-green strip below the knee removed; the robe edge redrawn as a straight inked line.'),
        {'head': 'His portrait, before (O-2 B) and after'},
        {'grid': [one('', cards['pa'], 'O-2 B as rendered: yellow-green lapels, green-tinted hair, blue tie'),
                  one('', cards['pb'], 'Installed: sea-green lapels, brown hair, gold tie, darker coat')], 'cols': 2, 'h': 820},
        one('', cards['hair'], 'Shoulder at 1:1 (left before, right after): the green-tinted strands back to his brown.'),
        one('', cards['tie'], 'Hair tie at 1:1: blue to gold, as on the O-1 A billboard.'),
        one('5', FR + 'dialogue.png', 'In a real dialogue frame on the new plate. The line is a stand-in: no story text exists yet (plan B17).'),
        {'head': 'The chamber: O-3 A exactly as picked'},
        one('', cards['plate'], 'backdrops/via-purifico.png, 2688x1536. No repair. It still has no low parapet with square lamps (disclosed).'),
        {'head': 'His aeons: O-4 C on the D-089 paintings (idle, attack, overdrive each)'},
        {'grid': [one('', cards['ifrit-src'], 'Ifrit (source, unchanged)'), one('', cards['grothia-idle'], 'Grothia idle'),
                  one('', cards['grothia-attack'], 'Grothia attack'), one('', cards['grothia-overdrive'], 'Grothia overdrive')], 'cols': 4, 'h': 300},
        {'grid': [one('', cards['valefor-src'], 'Valefor (source)'), one('', cards['pterya-idle'], 'Pterya idle'),
                  one('', cards['pterya-attack'], 'Pterya attack'), one('', cards['pterya-overdrive'], 'Pterya overdrive')], 'cols': 4, 'h': 300},
        {'grid': [one('', cards['bahamut-src'], 'Bahamut (source)'), one('', cards['spathi-idle'], 'Spathi idle'),
                  one('', cards['spathi-attack'], 'Spathi attack'), one('', cards['spathi-overdrive'], 'Spathi overdrive')], 'cols': 4, 'h': 300},
        {'head': 'The action paintings in the engine (HUD off)'},
        {'grid': [one('', FR + 'grothia-attack.png', 'Grothia attack'), one('', FR + 'grothia-overdrive.png', 'Grothia overdrive')], 'cols': 2},
        {'grid': [one('', FR + 'pterya-attack.png', 'Pterya attack'), one('', FR + 'pterya-overdrive.png', 'Pterya overdrive')], 'cols': 2},
        {'grid': [one('', FR + 'spathi-attack.png', 'Spathi attack'), one('', FR + 'spathi-overdrive.png', 'Spathi overdrive')], 'cols': 2},
    ]}
sp = W + 'spec-production.json'
json.dump(spec, open(sp, 'w', encoding='utf-8'), indent=1)
subprocess.run(['python', D + 'scripts/sheet.py', sp, D + 'production/sheet.jpg'], check=True)
im = Image.open(D + 'production/sheet.jpg')
print('sheet', im.size, os.path.getsize(D + 'production/sheet.jpg') // 1024, 'KB')
