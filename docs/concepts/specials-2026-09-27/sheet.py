# The special moments (Spiral Cut, FFX; Mega Flare, FFX-2): the options sheet,
# in parts (1080 px wide, at most 2000 px tall, each under 1 MB).
# Built only from frames already on disk: the spell-fx mock's clips and stills
# (docs/concepts/spell-fx-2026-09-26/), its option A pilot paintings and its
# "today" frames (the spell-fx session scratchpad). No browser, no engine.
#   python docs/concepts/specials-2026-09-27/sheet.py
import os, subprocess
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FX = os.path.normpath(os.path.join(HERE, '..', 'spell-fx-2026-09-26'))
ST = os.path.join(FX, 'stills')
SCR = os.environ.get('SPELLFX_SCRATCH', 'C:/Users/Administrator/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad/spellfx').replace('\\', '/') + '/'
OUT = os.environ.get('SPECIALS_SCRATCH', os.path.join(os.path.dirname(SCR.rstrip('/')), 'specials')).replace('\\', '/') + '/'
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
W, GUT = 1080, 16
BG, INK, IVORY, DIM = (11, 10, 18), (22, 20, 34), (244, 241, 232), (170, 165, 180)
GOLD, PINK = (227, 185, 74), (247, 182, 217)
F = 'C:/Windows/Fonts/'
def font(name, size): return ImageFont.truetype(F + name, size)
TITLE, SERIF, LABEL, BODY, BOLD, SMALL = (font('georgiai.ttf', 44), font('georgiai.ttf', 32), font('segoeuib.ttf', 20),
                                         font('segoeui.ttf', 24), font('segoeuib.ttf', 24), font('segoeui.ttf', 20))
TAGK, TAGT = font('segoeuib.ttf', 15), font('georgiai.ttf', 26)

# In the light clips the special runs from 4.8 s to 7.9 s (render.mjs SETS.light).
TIMES = {'ffx': (5.4, 5.9, 6.4), 'ffx2': (5.9, 6.4, 6.9)}
TNAME = {'ffx': 'Spiral Cut · Tidus\u2019s Overdrive', 'ffx2': 'Mega Flare · Bahamut, on the party'}
# This round's letters -> the spell-fx round's letters (the clip each frame comes from).
SRC = {'A': 'B', 'B': 'A'}
KICK = {'A': 'A \u00b7 PARTICLES, AS MOCKED', 'B': 'B \u00b7 PAINTED FLIPBOOK', 'C': 'C \u00b7 TODAY\u2019S FALLBACK'}

def frame(game, opt, t):
    os.makedirs(OUT, exist_ok=True)
    p = f'{OUT}{game}-{SRC[opt]}-{t}.jpg'
    if not os.path.exists(p):
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-ss', str(t), '-i', os.path.join(FX, f'clip-{game}-{SRC[opt]}-light.mp4'),
                        '-frames:v', '1', '-q:v', '2', p], check=True)
    return p

def retag(im, kicker, title, acc):
    """Paint over the mock's corner tag (it uses the spell-fx round's letters)."""
    s = im.width / 1280
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, round(820 * s), round(92 * s)], fill=(15, 13, 26))
    d.rectangle([0, 0, max(3, round(5 * s)), round(92 * s)], fill=acc)
    d.text((round(22 * s), round(12 * s)), kicker, font=font('segoeuib.ttf', max(11, round(19 * s))), fill=acc)
    d.text((round(22 * s), round(38 * s)), title, font=font('georgiai.ttf', max(16, round(34 * s))), fill=IVORY)
    return im

def wrap(d, text, fnt, width):
    out, line = [], ''
    for w in text.split(' '):
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=fnt) <= width: line = t
        else: out.append(line); line = w
    if line: out.append(line)
    return out

class Part:
    def __init__(self, h=2000): self.im = Image.new('RGB', (W, h), BG); self.d = ImageDraw.Draw(self.im); self.y = 0
    def header(self, kicker, title, acc):
        d = self.d
        d.rectangle([0, self.y, W, self.y + 124], fill=INK); d.rectangle([0, self.y, 8, self.y + 124], fill=acc)
        d.text((32, self.y + 20), kicker, font=LABEL, fill=acc)
        d.text((32, self.y + 52), title, font=TITLE, fill=IVORY)
        self.y += 124 + 18
    def h2(self, text, acc): self.d.text((32, self.y), text, font=SERIF, fill=acc); self.y += 46
    def para(self, text, fnt=BODY, col=IVORY, indent=32, gap=7):
        for ln in wrap(self.d, text, fnt, W - indent - 32):
            self.d.text((indent, self.y), ln, font=fnt, fill=col); self.y += fnt.size + gap
        self.y += 6
    def bullet(self, key, text, acc):
        d = self.d
        d.text((32, self.y), key, font=BOLD, fill=acc)
        kx = 32 + d.textlength(key + '  ', font=BOLD)
        for ln in wrap(d, text, BODY, W - kx - 32):
            d.text((kx, self.y), ln, font=BODY, fill=IVORY); self.y += BODY.size + 7
        self.y += 5
    def grid(self, ims, cols=2, labels=None, acc=GOLD):
        cw = (W - GUT * (cols + 1)) // cols
        lab = 30 if labels else 0
        ch = 0
        for i, im in enumerate(ims):
            im = im.convert('RGB'); ch = round(cw * im.height / im.width)
            im = im.resize((cw, ch), Image.LANCZOS)
            r, c = divmod(i, cols); x = GUT + c * (cw + GUT); y = self.y + r * (ch + GUT + lab)
            self.im.paste(im, (x, y))
            if labels: self.d.text((x + 2, y + ch + 3), labels[i], font=SMALL, fill=acc)
        rows = (len(ims) + cols - 1) // cols
        self.y += rows * (ch + GUT + lab) + 2
    def rule(self): self.d.line([32, self.y, W - 32, self.y], fill=(60, 56, 80), width=2); self.y += 18
    def save(self, name):
        im = self.im.crop((0, 0, W, min(2000, self.y + 24)))
        out = os.path.join(HERE, name)
        for q in (86, 80, 74, 68):
            im.save(out, 'JPEG', quality=q, optimize=True, progressive=True)
            if os.path.getsize(out) < 1_000_000: break
        print(name, im.size, os.path.getsize(out))

def acc(game): return GOLD if game == 'ffx' else PINK

def still(game, opt, reduced=False):
    """The peak still per option: A = the mock's B special, B = the mock's A special, C = today."""
    if opt == 'C':
        if game == 'ffx':
            im = Image.open(os.path.join(ST, 'ffx-B-hit.jpg'))  # the slash; the build matches it (spellfx-b target-vs-build)
            return retag(im, KICK['C'] + ': THE SLASH', 'Spiral Cut draws the plain hit', GOLD)
        im = Image.open(SCR + 'check-v2/today-4.4.jpg')  # today's bloom, the live build
        return retag(im, KICK['C'] + ': TODAY\u2019S BLOOM', 'Mega Flare draws this bloom (shown on Darkness)', PINK)
    sfx = 'reduced' if reduced else ''
    im = Image.open(os.path.join(ST, f'{game}-{SRC[opt]}-special{"-" + sfx if sfx else ""}.jpg'))
    return retag(im, KICK[opt] + (' \u00b7 REDUCE FLASHES ON' if reduced else ''), TNAME[game], acc(game))

PLAYS = {
    ('ffx', 'A'): 'A blue-white helix climbs round the target, then one big gold slash and a white ring burst on the hit (the FFX gold skin). 3.1 s, the hit lands at 1.43 s.',
    ('ffx2', 'A'): 'Violet motes pour into Bahamut’s chest, a beam drops on the party and a shockwave of pink four-point sparkles rolls out (the FFX-2 skin). 3.1 s, the blast lands at 1.45 s.',
    ('ffx', 'B'): 'One original painted swirl, scaled and spun by the shader round the target, then a painted slash, over today’s bloom. The elements keep the shipped particles.',
    ('ffx2', 'B'): 'One original painted burst grows on Bahamut’s chest, then blooms huge over the party, over today’s bloom. The elements keep the shipped particles.',
    ('ffx', 'C'): 'No special effect: Spiral Cut keeps the plain slash every attack draws. The weight comes only from the camera moment (plan item 10, round OR-2: a dolly and hit-freeze, or three quick cuts).',
    ('ffx2', 'C'): 'No special effect: Mega Flare keeps today’s tinted bloom on the party. The weight comes only from the camera moment (plan item 10, round OR-2: a dolly and hit-freeze, or three quick cuts).',
}
REST = {
    'A': [('Cost', 'Code only, 0 GPU: port the mock’s function (fx-b.js) into src/engine/spellfx, keyed by ability id. One small engine batch for both specials, plus its target-vs-build check.'),
          ('Risk', 'Nothing new: same atlas, batch, quality tiers and REDUCE FLASHES rules as the elements. The numeral hold (capped at 0.9 s) needs a rule for a landing near 1.45 s.')],
    'B': [('Cost', 'The pilots exist (two seeds each, sheet 4): pick one per special, back it up, one billboard layer in code. A true 6 to 8 frame flipbook needs new renders (an ART-7 subset) and risks flicker.'),
          ('Risk', 'Two visual languages on screen (painted specials, particle spells). The painting is the brightest thing in the mock; REDUCE FLASHES needs an opacity ceiling on it.')],
    'C': [('Cost', 'Nothing here; all the cost sits in OR-2, which is not picked yet.'),
          ('Risk', 'Until OR-2 is built the special looks exactly like an ordinary action: {x}.')],
}
CRISK = {'ffx': 'an Overdrive reads as an attack', 'ffx2': 'the fight’s set piece reads as a Darkness cast'}

def block(p, game, opt):
    a = acc(game)
    p.d.text((32, p.y), {'A': 'A \u00b7 Particles, as mocked', 'B': 'B \u00b7 Painted flipbook (specials only)', 'C': 'C \u00b7 No effect beyond the camera moment'}[opt], font=SERIF, fill=a); p.y += 46
    if opt == 'C':
        other = Image.open(os.path.join(ST, f'{game}-B-special.jpg'))
        p.grid([still(game, 'C'), retag(other, 'FOR SCALE: OPTION A AT ITS PEAK', TNAME[game], a)], cols=2,
               labels=['today (live build)', 'the same moment under A'], acc=a)
    else:
        ims = [retag(Image.open(frame(game, opt, t)), KICK[opt], TNAME[game], a) for t in TIMES[game]]
        p.grid(ims, cols=3, labels=[f'{t - 4.8:.1f} s into the special' for t in TIMES[game]], acc=a)
    p.bullet('Plays', PLAYS[(game, opt)], a)
    for k, v in REST[opt]: p.bullet(k, v.replace('{x}', CRISK[game]), a)
    p.rule()

def part_overview():
    p = Part()
    p.header('THE SPECIAL MOMENTS \u00b7 OPTIONS ROUND \u00b7 2026-09-27', 'Spiral Cut and Mega Flare', GOLD)
    p.para('Spell effects option B shipped for the six elements, the heal and the hit. The two specials the mock showed were not built: today Spiral Cut (FFX) falls back to the plain slash and Mega Flare (FFX-2) to the old tinted bloom. Three ways to finish them, each on the real Chapter I and Chapter IV frames. Nothing here is built; a pick approves only what you name.', gap=8)
    ims, labels = [], []
    for opt in 'ABC':
        for g in ('ffx', 'ffx2'):
            ims.append(still(g, opt)); labels.append(f'{opt} \u00b7 {"FFX, Spiral Cut" if g == "ffx" else "FFX-2, Mega Flare"}')
    p.grid(ims, cols=2, labels=labels)
    p.h2('The options', GOLD)
    p.bullet('A', 'Option B\u2019s specials as mocked: particles in the language that shipped. 0 GPU.', GOLD)
    p.bullet('B', 'Option A\u2019s painting, for the specials only (the spell-fx recommendation\u2019s \u201clater\u201d idea).', GOLD)
    p.bullet('C', 'No special effect; the camera moment (round OR-2) carries it alone.', GOLD)
    p.h2('Recommendation: A, with the camera from OR-2', GOLD)
    p.para('It finishes the language you approved, costs no GPU, and an Overdrive stops looking like an attack today, before OR-2 lands. B can still be layered on top later if you want the painted look. C is only right if you want the camera alone to carry it.', gap=8)
    p.h2('FFX and FFX-2 differ (rule 14)', PINK)
    p.para('Spiral Cut is FFX only: an Overdrive, gold skin. FFX-2 has no Overdrives; Mega Flare is Bahamut\u2019s boss special (Ch IV), pink skin. FFX has its own Mega Flares (Isaaru\u2019s Spathi, the aeon Bahamut), which this pick does not cover. No source in research/ describes the retail animations: every look is ours.', gap=8)
    p.save('sheet-1-overview.jpg')

def part_game(game, name, title):
    p = Part()
    p.header(f'{"FFX \u00b7 CHAPTER I \u00b7 SEYMOUR FLUX" if game == "ffx" else "FFX-2 \u00b7 CHAPTER IV \u00b7 BAHAMUT"}', title, acc(game))
    for opt in 'ABC': block(p, game, opt)
    p.save(name)

def part_paint_and_flashes():
    p = Part()
    p.header('OPTION B\u2019S PAINTINGS \u00b7 REDUCE FLASHES', 'What B would paint, and the flash cap', GOLD)
    p.para('The original ComfyUI pilots from the spell-fx round (animagine-xl-4.0, on black, no retail frames). B picks one seed per special; the mock derives every frame from that one painting.', gap=8)
    pil = []
    for k in ('spiral', 'megaflare'):
        for s in (11, 22): pil.append(Image.open(SCR + f'pilot/{k}-{s}.png'))
    p.grid(pil, cols=4, labels=['Spiral Cut \u00b7 seed 11', 'Spiral Cut \u00b7 seed 22', 'Mega Flare \u00b7 seed 11', 'Mega Flare \u00b7 seed 22'])
    p.h2('REDUCE FLASHES on (the \u00a75.2 proposal, D-220 Q7 still open)', PINK)
    p.para('Washes capped at 35 %, white turned ivory, one wash per action. The specials are the brightest moments in the game: the mock\u2019s full wash is 0.5 (Spiral Cut) and 0.8 (Mega Flare).', gap=8)
    p.grid([still('ffx', 'A', True), still('ffx2', 'A', True), still('ffx', 'B', True), still('ffx2', 'B', True)], cols=2,
           labels=['A \u00b7 FFX, reduced', 'A \u00b7 FFX-2, reduced', 'B \u00b7 FFX, reduced', 'B \u00b7 FFX-2, reduced'])
    p.save('sheet-4-paintings-and-reduce-flashes.jpg')

part_overview()
part_game('ffx', 'sheet-2-ffx-spiral-cut.jpg', 'Spiral Cut, three ways')
part_game('ffx2', 'sheet-3-ffx2-mega-flare.jpg', 'Mega Flare, three ways')
part_paint_and_flashes()
