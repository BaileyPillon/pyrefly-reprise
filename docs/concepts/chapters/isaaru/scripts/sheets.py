# Sheet specs for every Isaaru round (re-cut 2026-09-24 after the adversarial review: one column,
# every word >= 12.5 px when the sheet is shown 390 px wide; phone mockups one per row at their own
# 780 px). Builds with sheet.py beside this file. The first cut's specs are in the scratch folder.
import json, os, subprocess, tempfile
D = 'D:/Final Fantasy/docs/concepts/chapters/isaaru/'
HERE = os.path.dirname(os.path.abspath(__file__))
TMP = tempfile.mkdtemp(prefix='isaaru-sheets-', dir='D:/Tools/pyrefly-scratch')


def one(k, img, cap, **kw):
    return dict({'key': k, 'img': D + img, 'cap': cap}, **kw)


WIKI = ("The wiki's words: brown hair, half-closed eyes, a white robe under a blue blouse with long white cuffs, "
        "a wide sea-green belt tied in a bow, a black knee-length jacket edged in sea green. "
        "None of the three matches: every coat reaches the ankles, and no belt is sea green.")
AGI = ("Turn order in these frames is not real: a browser patch set the enemies' Agility to 1 so Yuna acts first "
       "(Yuna twice before Grothia). Shown with the recommended B6 = a (Yuna's Attack and attack items greyed, "
       "the mirror-locked aeon greyed with its reason) and B2 = a (Chapter X's aeon numbers): both are still your call. "
       "Isaaru is drawn as O-1 C only as a stand-in.")
O5Q = "How does the player read the lock, Grothia's full gauge and Spathi's count? (plan B20) Only the overlays are mockup."
O5R = "I recommend B: chips on the HUD, and the aeon's own row in Yuna's place while it is out; keep A's sentence in the enemy-move panel."
specs = {
 'isaaru/sheet.jpg': {
  'title': 'Chapter XIV  O-1  Isaaru (FFX only)',
  'question': 'Which Isaaru stands beside his aeons? Real battle frames: Chapter X engine, Yuna-only line-up, his Ifrit (Grothia) and her Shiva.',
  'rec': ("I recommend A as the closest to the wiki: a dark coat edged in sea green, long white cuffs, half-closed eyes, a wide sash. "
          "Its finals would shorten the coat to the knee and repaint the sash as a sea-green bow. Pick C instead if the praying pose matters more."),
  'note': WIKI,
  'blocks': [one('A', 'isaaru/a-frame.jpg', 'Calm, arms open. Closest costume; the white robe glows under the bloom.'),
             one('B', 'isaaru/b-frame.jpg', 'A summoner staff raised (the staff is ours). Reads as the one who commands.'),
             one('C', 'isaaru/c-frame.jpg', 'Hands together in prayer, eyes closed. Quiet, sorrowful; a blue knot, not a sea-green belt.'),
             {'head': 'The paintings'},
             {'grid': [one('A', 'isaaru/a-card.jpg', 'arms open'), one('B', 'isaaru/b-card.jpg', 'staff raised'),
                       one('C', 'isaaru/c-card.jpg', 'praying')], 'cols': 3, 'h': 560}]},
 'portrait/sheet.jpg': {
  'title': "Chapter XIV  O-2  Isaaru's portrait (FFX only)",
  'question': 'Which face speaks his lines? Real dialogue frames; the line is a stand-in, no story text is written yet.',
  'rec': 'I recommend B: steady and sorrowful, the man who obeys the temple and asks forgiveness.',
  'note': "Both were painted from O-1 C's costume, which does not match the wiki (O-1). The expression you pick is repainted from your O-1 pick.",
  'blocks': [one('A', 'portrait/a-dialogue.jpg', 'Courteous, a faint smile.'),
             one('B', 'portrait/b-dialogue.jpg', 'Steady and sorrowful.'),
             {'grid': [one('A', 'portrait/a-card.jpg', 'courteous'), one('B', 'portrait/b-card.jpg', 'sorrowful')], 'cols': 2, 'h': 620}]},
 'chamber/sheet.jpg': {
  'title': 'Chapter XIV  O-3  The last chamber of the Via Purifico (FFX only)',
  'question': 'Which room is the fight in? Sourced: the end of a red-lit hallway, the final chamber, a way up beyond it.',
  'rec': 'I recommend A: red lamps and the hallway behind; the floor reads and every figure stands out.',
  'blocks': [one('A', 'chamber/a-frame.jpg', 'Red-lit stone, the hallway behind.'),
             one('B', 'chamber/b-frame.jpg', 'A round room, a shaft of light from the way up; a small floor.'),
             one('C', 'chamber/c-frame.jpg', 'Darker, pyreflies in the red (live particles in the game).'),
             {'head': 'The plates alone'},
             {'grid': [one('A', 'chamber/a-plate.jpg', 'plate A'), one('B', 'chamber/b-plate.jpg', 'plate B'),
                       one('C', 'chamber/c-plate.jpg', 'plate C')], 'cols': 3}]},
 'aeons/sheet.jpg': {
  'title': "Chapter XIV  O-4  How Isaaru's aeons look (FFX only)",
  'question': 'The sources give no visual difference: his Grothia is Ifrit. Do we mark his side, and how? (plan B18)',
  'rec': 'I recommend C: a sea-green edge and a darker grade, derived from the paintings, which are never saved over.',
  'blocks': [one('A', 'aeons/a-frame.jpg', 'The Ifrit painting exactly as it is.'),
             one('B', 'aeons/b-frame.jpg', 'As it is, plus a name plate under it.'),
             one('C', 'aeons/c-frame.jpg', 'A sea-green edge and a darker grade.'),
             {'grid': [one('A', 'aeons/a-card.jpg', 'A  the painting'), one('C', 'aeons/c-card.jpg', 'C  derived')], 'cols': 2, 'h': 520}]},
 'aeons/sheet-ko-links.jpg': {
  'title': 'Chapter XIV  O-4  KO poses, and the other two links (FFX only)',
  'question': "The aeon paintings have no hurt or KO pose. Paint KO poses, or keep the engine's pyrefly dissolve? (plan B19)",
  'rec': 'I recommend the dissolve: it is what the engine does now, and costs nothing.',
  'blocks': [one('1', 'aeons/ko-fallback-frame.jpg', 'The engine today: the painting dissolves into pyreflies.'),
             one('2', 'aeons/ko-painted-frame.jpg', 'A painted KO (a new render against the Ifrit reference).'),
             {'head': 'Mark C on the other two links'},
             {'grid': [one('A', 'aeons/pterya-a-frame.jpg', 'Pterya as it is'), one('C', 'aeons/pterya-c-frame.jpg', 'Pterya, mark C: the edge shows less on teal')], 'cols': 2},
             {'grid': [one('A', 'aeons/spathi-a-frame.jpg', 'Spathi as it is: lost in the dark'), one('C', 'aeons/spathi-c-frame.jpg', 'Spathi, mark C: it reads')], 'cols': 2}]},
 'fight/sheet-link1.jpg': {
  'title': 'Chapter XIV  O-5  Link 1: Yuna picks an aeon (FFX only)',
  'question': O5Q + ' Ifrit is locked (the mirror of Grothia); Grothia starts with a full gauge, so Hellfire comes first.',
  'rec': O5R, 'note': AGI,
  'blocks': [one('A', 'fight/a-m1.jpg', 'Words only: one sentence in the enemy-move panel.'),
             one('B', 'fight/b-m1.jpg', "Chips on the HUD: a gauge under Grothia's queue tile."),
             one('C', 'fight/c-m1.jpg', 'Marks in the world: a fire ring under Grothia.')]},
 'fight/sheet-link3.jpg': {
  'title': 'Chapter XIV  O-5  Link 3: Ixion out, Spathi at 1 (FFX only)',
  'question': O5Q + " Spathi's count reads 1: Mega Flare is next, so Shield now.",
  'rec': O5R, 'note': AGI,
  'blocks': [one('A', 'fight/a-m2.jpg', 'Count 1, Shield now, in words.'),
             one('B', 'fight/b-m2.jpg', "The count on Spathi's tile; Ixion's own HP row."),
             one('C', 'fight/c-m2.jpg', 'A big 1 beside Spathi.')]},
 'fight/sheet-link-card.jpg': {
  'title': 'Chapter XIV  O-5  The link card (FFX only)',
  'question': 'How does "link 2 of 3" appear when Isaaru calls his next aeon?',
  'rec': 'I recommend B: a card with three marks and the aeons Yuna has left.',
  'blocks': [one('A', 'fight/a-m3.jpg', 'A one-line banner.'),
             one('B', 'fight/b-m3.jpg', 'A card: three marks, the aeons left.'),
             one('C', 'fight/c-m3.jpg', 'A big title across the field.')]},
}
PHN = ('One 390 x 844 phone per row, at full size: every fight label 12 CSS px or larger, no sideways scroll, '
       'no Flee row (escape is unsourced). The aeon menu shows an Items row, as the engine does today; whether it should is question 6.')
for m, name, caps in (('m1', 'link1', ['Words only.', 'Chips on the HUD.', 'Marks in the world.']),
                      ('m2', 'link3', ['Words only.', "Chips: the count on Spathi's tile, Ixion's own row with Yuna waiting under it.", 'Marks in the world.'])):
    specs['fight/sheet-phone-%s.jpg' % name] = {
        'width': 780, 'title': 'Chapter XIV  O-5 on a phone: %s (FFX only)' % ('link 1' if m == 'm1' else 'link 3'),
        'question': PHN, 'rec': 'B holds up best: the chips sit on the queue and nothing covers the paintings.',
        'blocks': [one(k.upper(), 'fight/%s-%s-phone.jpg' % (k, m), c) for k, c in zip('abc', caps)]}
for out, sp in specs.items():
    p = os.path.join(TMP, out.replace('/', '-').replace('.jpg', '.json'))
    json.dump(sp, open(p, 'w', encoding='utf-8'))
    subprocess.run(['python', os.path.join(HERE, 'sheet.py'), p, D + out], check=True)
