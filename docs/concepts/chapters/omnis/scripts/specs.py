# Sheet specs for every round (re-cut 2026-09-24 for a phone: one column, every word >= 12.5 px when
# the sheet is shown 390 px wide; phone mockups one per row at their own 780 px). Builds with sheet.py.
import json, os, subprocess, tempfile
D = 'D:/Final Fantasy/docs/concepts/chapters/omnis/'
HERE = os.path.dirname(os.path.abspath(__file__))
TMP = tempfile.mkdtemp(prefix='omnis-sheets-', dir='D:/Tools/pyrefly-scratch')


def one(k, img, cap, **kw):
    return dict({'key': k, 'img': D + img, 'cap': cap}, **kw)


PANELS = [(20, 540), (560, 1080), (1100, 1620), (1640, 2160)]
STEPS = ['1  a spell hits the upper-left disc', '2  it turns right', '3  still turning', '4  Thunder now faces him']


def turn(img, y1, last=None):
    g = []
    for i, (x0, x1) in enumerate(PANELS):
        cap = STEPS[i] if (i < 3 or not last) else last
        g.append(one('', img, cap, crop=[x0, 62, x1, y1]))
    return {'grid': g, 'cols': 2}


RING = ("Ring order = our estimate twice over: GameFAQs' reset cycle (Fire, Water, Ice, Thunder) "
        "drawn as the order around a disc (plan B8).")
specs = {
 'o2-discs/sheet.jpg': {
  'title': 'Chapter XII  O-2  The four discs (FFX only)',
  'question': 'How should the four discs read? The colour facing Seymour decides his spells and resistances. '
              'Real engine frames, real HUD; the fight opens with all four on Fire.',
  'rec': 'I recommend B: the strip names all four facings in words and still reads on a phone, '
         'where A and C lose the upper-left disc.',
  'note': RING,
  'blocks': [one('A', 'o2-discs/a-frame.jpg', 'Painted discs, the quarter facing him lit with a gold rim.'),
             one('B', 'o2-discs/b-frame.jpg', 'A, plus a disc strip on the HUD: each facing, and what it makes him ("absorbs Fire, weak to Ice").'),
             one('C', 'o2-discs/c-frame.jpg', 'Flat Ink & Gold rings, a symbol on every quarter, a pointer toward him.'),
             {'head': 'One disc, close up'},
             {'grid': [one('', 'o2-discs/a-disc-card.jpg', 'A and B: the painted disc. Left to right: at the start, Fire faces him; '
                                                           'hit by a spell, it turns right and Thunder faces him; hit by Wakka, it turns left and Water faces him.'),
                       one('', 'o2-discs/c-disc-card.jpg', 'C: the same three states as rings, colour and symbol, readable without colour vision. '
                                                           'Seymour is to the right of the disc; the colour order is our estimate (B8).')], 'cols': 1, 'h': 480}]},
 'o2-discs/sheet-turn.jpg': {
  'title': 'Chapter XII  O-2  One turn (FFX only)',
  'question': 'A spell hits the upper-left disc and it turns 90 degrees right (sourced). '
              'Which colour comes next is our estimate (B8).',
  'rec': 'I recommend B: the strip changes in words when the turn lands.',
  'blocks': [{'head': 'A  painted discs: the lit quarter slides away'}, turn('o2-discs/a-turn.jpg', 456),
             {'head': 'B  A + the strip: it changes when the turn ends'},
             turn('o2-discs/b-turn.jpg', 548, '4  Thunder faces him; strip: absorbs Fire, halves Thunder'),
             {'head': 'C  Ink & Gold ring turning under a fixed pointer'}, turn('o2-discs/c-turn.jpg', 456)]},
 'o2-discs/sheet-phone.jpg': {
  'width': 780,
  'title': 'Chapter XII  O-2 on a phone, 390 x 844 (FFX only)',
  'question': 'One phone per row, at full size. No Talk, no Flee (none in this fight). The discs are about 80 CSS px here.',
  'rec': 'Only B passes: in all three the queue row and the "Tidus COMMAND" label cover the upper-left disc, '
         "so A and C cannot show all four facings. B's strip still names them.",
  'blocks': [one('A', 'o2-discs/a-phone.jpg', 'Painted discs only'),
             one('B', 'o2-discs/b-phone.jpg', 'A + the disc strip at the top'),
             one('C', 'o2-discs/c-phone.jpg', 'Ink & Gold rings')]},
 'o1-omnis/sheet.jpg': {
  'title': 'Chapter XII  O-1  Seymour Omnis (FFX only)',
  'question': "How should he look? Sourced: he hovers before four discs and glows red before Dispel and Ultima; "
              "one Let's Play calls him translucent. The rest is ours.",
  'rec': 'I recommend A: the widest silhouette, reads as a last form, and his spread arms frame the four discs.',
  'blocks': [one('A', 'o1-omnis/a-frame.jpg', 'New paint: horned shoulders, spread claws, hanging strips instead of legs.'),
             one('B', 'o1-omnis/b-frame.jpg', 'Face and hair from the approved Macalania portrait; horned, lean (the horns are ours).'),
             one('C', 'o1-omnis/c-frame.jpg', 'A made translucent and lit by pyreflies.'),
             {'head': 'The paintings: calm, and glowing red'},
             {'grid': [one('A', 'o1-omnis/a-card.jpg', 'A  calm, and glowing'), one('B', 'o1-omnis/b-card.jpg', 'B  calm, and glowing'),
                       one('C', 'o1-omnis/c-card.jpg', "C  a grade of A's pixels")], 'cols': 1, 'h': 560}]},
 'o1-omnis/sheet-glow.jpg': {
  'title': 'Chapter XII  O-1  The red glow (FFX only)',
  'question': 'He glows red when Dispel, then Ultima, comes next (sourced). Here it is a tint and a halo; '
              'in the game it would be a live pulse with particles.',
  'rec': "A's glow reads best; C's is the weakest.",
  'blocks': [one('A', 'o1-omnis/a-glow-frame.jpg', 'Red tint and halo.'),
             one('B', 'o1-omnis/b-glow-frame.jpg', 'The same on B.'),
             one('C', 'o1-omnis/c-glow-frame.jpg', 'The same on C: it nearly disappears.')]},
 'o3-garden/sheet.jpg': {
  'title': 'Chapter XII  O-3  The Garden of Pain, inside Sin (FFX only)',
  'question': "What light? Sourced for the Garden: only steps up to a platform (no plate shows clear steps yet). "
              "The red-tinged sea, blue walkways and waterfalls belong to the Sea of Sorrow beside it. "
              "Frames sit under Chapter III's red grade.",
  'rec': 'I recommend C: the orange Fire quarter, the gold rims and his red glow all stand out on violet.',
  'blocks': [one('A', 'o3-garden/a-frame.jpg', 'Crimson dusk: the blue figure pops on red.'),
             one('B', 'o3-garden/b-frame.jpg', "Pale day, a rose sea, waterfalls (the Sea of Sorrow's look): the horizon blooms behind him."),
             one('C', 'o3-garden/c-frame.jpg', 'Deep violet.'),
             {'head': 'The plates alone'},
             {'grid': [one('A', 'o3-garden/a-plate.jpg', 'A  crimson dusk'), one('B', 'o3-garden/b-plate.jpg', 'B  pale day'),
                       one('C', 'o3-garden/c-plate.jpg', 'C  deep violet')], 'cols': 3}]},
 'o3-garden/sheet-glow.jpg': {
  'title': 'Chapter XII  O-3  Does his red glow still read? (FFX only)',
  'question': 'The same three plates with Omnis glowing red (Dispel, then Ultima, next).',
  'rec': 'C reads clearly; on A the glow sinks into the red.',
  'blocks': [one('A', 'o3-garden/a-glow-frame.jpg', 'The glow sinks into the red.'),
             one('B', 'o3-garden/b-glow-frame.jpg', 'Reads; the horizon blooms behind him.'),
             one('C', 'o3-garden/c-glow-frame.jpg', 'Reads clearly on violet.')]},
}
O4Q = ('How does the player read the attack counter (B14)? All on O-2 B and plate O-3 C; '
       'no chip names which member a spell hits (B12 is an estimate).')
O4R = 'I recommend C: one line says what the discs mean for the next turn, the lesson the fight teaches.'
MOM = {'i': ('Turn one: every disc on Fire', ['Red glow only, as the game does it.', 'Attack pips beside his queue tile: 0 of 6.',
                                             'One line of intent: four Firaga next; absorbs Fire, weak to Ice.']),
       'ii': ('He glows red: Dispel, then Ultima', ['The glow is the only warning.', 'The pips full and red.',
                                                   'Says what comes (Dispel on the party, then Ultima) and that every disc then turns.']),
       'iii': ('A disc turned: his resistances change', ['The strip only.', 'Pips 2 of 6.',
                                                        'Next turn in words: three Firaga and one Thundara; Ice no longer hurts him extra.'])}
for m, (name, caps) in MOM.items():
    specs['o4-fight/sheet-%s.jpg' % m] = {
        'title': 'Chapter XII  O-4 %s  %s (FFX only)' % (m, name), 'question': O4Q, 'rec': O4R,
        'blocks': [one(k.upper(), 'o4-fight/%s-%s.jpg' % (k, m), c) for k, c in zip('abc', caps)]}
    specs['o4-fight/sheet-phone-%s.jpg' % m] = {
        'width': 780, 'title': 'Chapter XII  O-4 %s on a phone (FFX only)' % m,
        'question': name + '. One 390 x 844 phone per row, at full size; every fight label 12 CSS px or larger.',
        'rec': O4R,
        'blocks': [one(k.upper(), 'o4-fight/%s-%s-phone.jpg' % (k, m), c) for k, c in zip('abc', caps)]}
for out, sp in specs.items():
    p = os.path.join(TMP, out.replace('/', '-').replace('.jpg', '.json'))
    json.dump(sp, open(p, 'w', encoding='utf-8'))
    subprocess.run(['python', os.path.join(HERE, 'sheet.py'), p, D + out], check=True)
