# B1 spell effects: the phone-readable sheet, in parts (each 1080 px wide,
# at most 2000 px tall, under 1 MB). Reads the stills in ./stills, the
# today frames and the option A pilot paintings from the scratch folder.
#   python docs/concepts/spell-fx-2026-09-26/sheet.py
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SCR = os.environ.get('SPELLFX_SCRATCH', 'C:/Users/Administrator/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad/spellfx').replace('\\', '/') + '/'
ST = os.path.join(HERE, 'stills')
W, GUT = 1080, 16
BG, INK, IVORY, DIM = (11, 10, 18), (22, 20, 34), (244, 241, 232), (170, 165, 180)
GOLD, PINK = (227, 185, 74), (247, 182, 217)
F = 'C:/Windows/Fonts/'
def font(name, size): return ImageFont.truetype(F + name, size)
TITLE, SERIF, LABEL, BODY, BOLD = font('georgiai.ttf', 46), font('georgiai.ttf', 34), font('segoeuib.ttf', 21), font('segoeui.ttf', 25), font('segoeuib.ttf', 25)

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
        d.rectangle([0, self.y, W, self.y + 128], fill=INK); d.rectangle([0, self.y, 8, self.y + 128], fill=acc)
        d.text((32, self.y + 20), kicker, font=LABEL, fill=acc)
        d.text((32, self.y + 54), title, font=TITLE, fill=IVORY)
        self.y += 128 + 18
    def para(self, text, fnt=BODY, col=IVORY, indent=32, gap=8):
        for ln in wrap(self.d, text, fnt, W - indent - 32):
            self.d.text((indent, self.y), ln, font=fnt, fill=col); self.y += fnt.size + gap
        self.y += 6
    def bullet(self, key, text, acc):
        d = self.d
        d.text((32, self.y), key, font=BOLD, fill=acc)
        kx = 32 + d.textlength(key + '  ', font=BOLD)
        lines = wrap(d, text, BODY, W - kx - 32)
        for i, ln in enumerate(lines):
            d.text((kx, self.y), ln, font=BODY, fill=IVORY); self.y += BODY.size + 8
        self.y += 6
    def grid(self, paths, cols=2, labels=None, acc=GOLD):
        cw = (W - GUT * (cols + 1)) // cols
        for i, p in enumerate(paths):
            im = Image.open(p).convert('RGB'); ch = round(cw * im.height / im.width)
            im = im.resize((cw, ch), Image.LANCZOS)
            r, c = divmod(i, cols); x = GUT + c * (cw + GUT); y = self.y + r * (ch + GUT + (34 if labels else 0))
            self.im.paste(im, (x, y))
            if labels: self.d.text((x + 2, y + ch + 4), labels[i], font=LABEL, fill=acc)
        rows = (len(paths) + cols - 1) // cols
        self.y += rows * (ch + GUT + (34 if labels else 0)) + 4
    def save(self, name):
        im = self.im.crop((0, 0, W, min(2000, self.y + 24)))
        out = os.path.join(HERE, name)
        for q in (86, 80, 74, 68):
            im.save(out, 'JPEG', quality=q, optimize=True, progressive=True)
            if os.path.getsize(out) < 1_000_000: break
        print(name, im.size, os.path.getsize(out))

ELS = ['fire', 'ice', 'thunder', 'water', 'holy', 'cure', 'hit', 'special']
NAMES = {
    'ffx': ['Fire', 'Blizzard', 'Thunder', 'Water', 'Holy (one hit)', 'Cure', 'Attack', 'Spiral Cut (Overdrive)'],
    'ffx2': ['Fira', 'Blizzara', 'Thundara', 'Watera', 'Holy (8 hits)', 'Cura', 'Attack (Warrior)', 'Mega Flare (Bahamut)'],
}
OPT = {
    'A': ('PAINTED FLIPBOOKS', [
        ('Plays', 'Each spell is a painted sheet of 6 to 8 frames on a billboard over the target, added over today\'s bloom. The most "painted" look: it matches the backdrops.'),
        ('Cost', 'ART-7: about 9 effects x 2 skins x 6 to 8 frames of original ComfyUI art, 2 to 4 GPU hours plus judging. Risk: diffusion frames flicker from one to the next (this mock derives its frames from ONE pilot painting, so it is a sketch).'),
        ('Phone', 'One textured quad per effect, the cheapest to draw; about 1 to 2 MB of texture per sheet, loaded per chapter.'),
        ('Flashes', 'Screen washes follow D-220 (35 % cap, ivory not white, one wash per action); the painting\'s brightest frames get an opacity ceiling.'),
    ]),
    'B': ('SHADER PARTICLES', [
        ('Plays', 'Each element has its own shape and timing: a fire column from a scorched ground decal, ice growing from the floor, one vertical bolt with a hard flash, a water ring and sphere, holy pillars, rising cure motes, a slash arc with sparks.'),
        ('Cost', 'Code only, 0 GPU: one engine batch (a registry keyed by ability id, falling back to the element, then to today\'s bloom; about 10 effects; the "every castable ability has an effect" test).'),
        ('Phone', 'GPU point sprites and a few quads, 200 to 600 particles at the peak, counts scaled by the quality tier; the low and reduced tiers keep today\'s bloom.'),
        ('Flashes', 'Every flash is a parameter: 35 % wash cap, ivory for white, one wash per action (FFX-2 Holy\'s eight become one), actor flash capped at 0.35, no timing change.'),
    ]),
    'C': ('PARTICLES + ELEMENT GLYPH', [
        ('Plays', 'Option B\'s particles at 60 % density plus a painted element glyph that flashes over the target: FFX a gold brush circle around a sign, FFX-2 a pink diamond chip with the spell\'s name.'),
        ('Cost', 'B plus 7 to 9 painted glyphs per game (a small GPU or hand job). Two catches: the HUD already shows the action name, so the glyph repeats it; and the FFX signs here are drawn stand-ins (only the aeons\' seals are sourced).'),
        ('Phone', 'As B with 40 % fewer particles, plus one quad.'),
        ('Flashes', 'As B; the glyph itself never flashes.'),
    ]),
}

def part_intro():
    p = Part()
    p.header('B1 · SPELL AND SKILL EFFECTS · OPTIONS ROUND · 2026-09-26', 'Every spell looks the same today', GOLD)
    p.para('The live build draws ONE tinted bloom for Fire, Blizzard, Holy, a heal and a sword hit alike (VFX.ts has three primitives; the element only picks a colour). Below: today, then three ways to fix it, each shown on the real Chapter I (FFX, Seymour Flux) and Chapter IV (FFX-2, Bahamut) frames.', gap=9)
    p.grid([SCR + 'check-v2/today-1.0.jpg', SCR + 'check-v2/today-2.9.jpg', SCR + 'check-v2/today-4.4.jpg', SCR + 'check-v2/today-5.4.jpg'], labels=['FFX · Hastega, today', 'FFX · Lance of Atrophy, today', 'FFX-2 · Darkness, today', 'FFX-2 · Magic Break, today'])
    p.d.text((32, p.y), 'The three options', font=SERIF, fill=GOLD); p.y += 50
    p.bullet('A', 'Painted flipbooks: original ComfyUI paintings, 6 to 8 frames per element, on a billboard.', GOLD)
    p.bullet('B', 'Shader particles: a distinct shape, motion and ground decal per element. 0 GPU.', GOLD)
    p.bullet('C', 'B\'s particles plus a painted element glyph flash.', GOLD)
    p.d.text((32, p.y), 'FFX and FFX-2 differ (both games, two skins)', font=SERIF, fill=PINK); p.y += 50
    p.para('FFX: gold cast ring with eight points and round motes. FFX-2: pink ring and four-point sparkles, its cursor shape (research: one motion language, two skins; never FFX-2 chrome in an FFX chapter). Holy is one hit in FFX and 12 x 8 hits in FFX-2 (both combat-core docs), so the FFX-2 Holy strikes eight times. No source describes the retail spell animations themselves, so every look here is ours.', gap=9)
    p.d.text((32, p.y), 'Recommendation: B', font=SERIF, fill=GOLD); p.y += 50
    p.para('B for the six elements, the heal and the hit, and later (only if you like the look) A\'s paintings for the Overdrives and boss specials. The element reads from its shape and motion, not only its colour; it costs no GPU while seven art jobs queue; the two skins and REDUCE FLASHES are parameters. C\'s glyph repeats the action name the HUD already shows.', gap=9)
    p.para('Clips (MP4, phone-sized, 7 to 8 s): clip-<game>-<A|B|C>-magic.mp4 (Fire, Ice, Thunder, Water), -light.mp4 (Holy, Cure, a hit, the Overdrive or special), clip-<game>-reduce-flashes-off-vs-on.mp4, clip-today-live-build.mp4.', fnt=font('segoeui.ttf', 21), col=DIM)
    p.save('sheet-1-today-and-options.jpg')

def part_option(game, opt, n):
    acc = PINK if game == 'ffx2' else GOLD
    name, lines = OPT[opt]
    p = Part()
    p.header(f'OPTION {opt} · {name} · {"FFX-2 · CHAPTER IV, BAHAMUT" if game == "ffx2" else "FFX · CHAPTER I, SEYMOUR FLUX"}', f'Option {opt} in {"FFX-2" if game == "ffx2" else "FFX"}', acc)
    for k, t in lines: p.bullet(k, t, acc)
    p.grid([os.path.join(ST, f'{game}-{opt}-{e}.jpg') for e in ELS], labels=NAMES[game], acc=acc)
    p.save(f'sheet-{n}-{game}-option-{opt}.jpg')

def part_reduce(game, n):
    acc = PINK if game == 'ffx2' else GOLD
    g = 'FFX-2' if game == 'ffx2' else 'FFX'
    p = Part()
    p.header(f'REDUCE FLASHES (D-220) · OPTION B · {g} · SAME RULE FOR A AND C', f'{g}: flashes off, then on', acc)
    p.para('Left: the effect as designed. Right: REDUCE FLASHES on. Washes peak at 35 %, pure white turns warm ivory, only the first wash of an action plays, actor flashes cap at 0.35. Nothing is shorter. (The softening levels are still Q7 in D-220, open.)', gap=8)
    rows, labels = [], []
    for e, lab in (('thunder', 'Thunder'), ('holy', 'Holy'), ('special', 'Overdrive/special')):
        rows += [os.path.join(ST, f'{game}-B-{e}.jpg'), os.path.join(ST, f'{game}-B-{e}-reduced.jpg')]
        labels += [f'{lab} · off', f'{lab} · ON']
    p.grid(rows, labels=labels, acc=acc)
    p.save(f'sheet-{n}-{game}-reduce-flashes.jpg')

def part_pilots():
    p = Part()
    p.header('OPTION A · THE PILOT PAINTINGS', 'Original ComfyUI pilots, two seeds each', GOLD)
    p.para('Rendered on black on 2026-09-26 (animagine-xl-4.0, local ComfyUI; no retail frames). Additive blending drops the black. A built sheet needs 6 to 8 consistent frames of each; these are single paintings.', gap=8)
    keys = ['fire', 'ice', 'thunder', 'water', 'holy', 'cure', 'slash', 'spiral', 'megaflare']
    paths, labels = [], []
    for k in keys:
        for s in ('11', '22'):
            paths.append(SCR + f'pilot/{k}-{s}.png'); labels.append(f'{k} · seed {s}')
    p.grid(paths, cols=4, labels=labels)
    p.save('sheet-10-option-A-pilots.jpg')

part_intro()
n = 2
for game in ('ffx', 'ffx2'):
    for opt in ('A', 'B', 'C'):
        part_option(game, opt, n); n += 1
part_reduce('ffx', 8)
part_reduce('ffx2', 9)
part_pilots()
