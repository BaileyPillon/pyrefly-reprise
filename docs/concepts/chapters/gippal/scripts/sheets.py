# Sheet specs for the Den of Woe rounds (re-cut 2026-09-24 after the adversarial review: one column,
# every word >= 12.5 px when the sheet is shown 390 px wide; phone mockups one per row at their own
# 780 px). Builds with sheet.py beside this file. FFX-2 only.
import json, os, subprocess, tempfile
D = 'D:/Final Fantasy/docs/concepts/chapters/gippal/'
HERE = os.path.dirname(os.path.abspath(__file__))
TMP = tempfile.mkdtemp(prefix='gippal-sheets-', dir='D:/Tools/pyrefly-scratch')


def one(k, img, cap, **kw):
    return dict({'key': k, 'img': D + img, 'cap': cap}, **kw)


O4Q = ('How does the player read the fight? Rules from research §4; the blow count, the last attacker and the HP '
       'shown are illustrative. Baralai and Nooj are placeholder shapes until O-2.')
O4R = "I recommend B, with A's sentence kept in the enemy-move card (E): B covers no painting; C's marks sit on the paintings."
specs = {
 'o1-shade/sheet.jpg': {
  'title': "Den of Woe  O-1  Gippal's shade (FFX-2 only)",
  'question': ('How should the shade look? One painting of Gippal, four treatments of its own pixels. '
               'No source says how the shades look (G-13); the scan text says he is an illusion made of pyreflies, formed from his anger.'),
  'rec': ('I recommend B, on the scan text alone: translucent and lit from within reads as "made of pyreflies" at once, '
          'and his outline (spiky hair, patch, mortar) still says Gippal. C if you want each shade coloured by its feeling.'),
  'note': ('Not a reason for B: the approved Shuyin paintings are opaque and full colour, so B does not echo him. '
           'Whatever you pick also applies to Baralai and Nooj in O-2: is that right?'),
  'blocks': [one('A', 'o1-shade/a-pyrefly-edge-frame.jpg', 'The man as painted, pyreflies at the edges: reads as the real Gippal, not an illusion.'),
             one('B', 'o1-shade/b-translucent-frame.jpg', 'Translucent, lit from within, in cold colours.'),
             one('C', 'o1-shade/c-anger-red-frame.jpg', 'A red pyrefly body holding his shape (his anger, the scan text); his feet come apart into motes.'),
             one('D', 'o1-shade/d-chapter4-violet-frame.jpg', "The Chapter IV violet, your Chapter XI pick: reads as possessed, which the shades are not."),
             {'head': 'The four paintings (pilot seed 951102)'},
             one('', 'o1-shade/cards.jpg', 'Left to right: A pyrefly edge, B translucent, C anger red, D Chapter IV violet.')]},
 'o3-den/sheet.jpg': {
  'title': 'Den of Woe  O-3  What light in the Den? (FFX-2 only)',
  'question': ('One painted cave under three lights: a rectangular clearing of cracked stone and rock walls (a clearing is '
               'sourced, GamerGuides). No plate shows a clear tunnel mouth yet; the finals would add one. '
               'The floating pyreflies stand in for live particles.'),
  'rec': 'I recommend A: the party and the shade read best, and the pink FFX-2 HUD stays apart from it.',
  'blocks': [one('A', 'o3-den/a-frame.jpg', 'Cold blue pyreflies.'),
             one('B', 'o3-den/b-frame.jpg', 'Crimson: the angriest, but red fights the pink HUD and the red warning chips.'),
             one('C', 'o3-den/c-frame.jpg', 'Near dark, one shaft from the ravine above: the most mournful; the party is hardest to read, and the shaft misses the fighters.'),
             {'head': 'The plates alone, and the layout guide'},
             {'grid': [one('A', 'o3-den/a-plate.jpg', 'A plate'), one('B', 'o3-den/b-plate.jpg', 'B plate'),
                       one('C', 'o3-den/c-plate.jpg', 'C plate')], 'cols': 3},
             one('', 'o3-den/guide-a.jpg', "The layout guide the cave was painted over (ours): a clearing, walls, a far opening the paint lost.")]},
 'o4-fight/sheet-p1.jpg': {
  'title': 'Den of Woe  O-4  Shade 1, Baralai counts blows (FFX-2 only)',
  'question': O4Q + ' Every hit or HP change adds one; at 8, Drill Shot takes 3/4 of the last attacker\'s max HP.',
  'rec': O4R,
  'blocks': [one('A', 'o4-fight/a-p1.jpg', 'Intent text only: "6 of 8"; Drill Shot on the last attacker at 8.'),
             one('B', 'o4-fight/b-p1.jpg', 'Chips: "Shade 1 of 3", the blows as pips (6/8), "Last hit: Paine" on her row.'),
             one('C', 'o4-fight/c-p1.jpg', 'Marks in the world: a 6/8 circle over the shade, a red ring under the last attacker.')]},
 'o4-fight/sheet-p2.jpg': {
  'title': "Den of Woe  O-4  Shade 2, Gippal's five-step cycle (FFX-2 only)",
  'question': O4Q + ' Grinder, Attack, Grinder, Attack, Bullseye (9/16 of current HP, cannot KO); below 1/3 HP he turns random and adds Mortar.',
  'rec': O4R,
  'blocks': [one('A', 'o4-fight/a-p2.jpg', 'Intent text only: Bullseye next, 9/16 of your current HP; Mortar below 1/3.'),
             one('B', 'o4-fight/b-p2.jpg', 'Chips: the cycle strip with Bullseye lit, "Shade 2 of 3", "Below 1/3: random + Mortar".'),
             one('C', 'o4-fight/c-p2.jpg', 'Marks in the world: a 5/5 circle over him, "Bullseye next".')]},
 'o4-fight/sheet-p3.jpg': {
  'title': 'Den of Woe  O-4  Shade 3, Nooj nears Lightfall (FFX-2 only)',
  'question': O4Q + ' At 2,999 HP or less he casts Lightfall once: 5,000 to all. Yuna\'s max HP is 2,488 (measured).',
  'rec': O4R,
  'blocks': [one('A', 'o4-fight/a-p3.jpg', 'Intent text only: Lightfall at 2,999 or less, 5,000 to all, once.'),
             one('B', 'o4-fight/b-p3.jpg', 'Chips: a mark at 2,999 on his HP bar, "Shade 3 of 3", "KO at Lightfall" on Yuna\'s row.'),
             one('C', 'o4-fight/c-p3.jpg', 'Marks in the world: a 2,999 circle over him, a red ring under Yuna ("5,000 > 2,488 max HP").')]},
 'o4-fight/sheet-phone.jpg': {
  'width': 780,
  'title': 'Den of Woe  O-4 on a phone: Gippal (FFX-2 only)',
  'question': ('One 390 x 844 phone per row, at full size: every fight label 12 CSS px or larger, no sideways scroll, no Flee '
               '(the Den cannot be escaped). Only the Gippal moment has phones. At this width Yuna is cropped out on the left, '
               "so the Nooj moment (the chip on Yuna's row, C's ring under her) is not shown on a phone."),
  'rec': ('Not this chapter\'s call: which phone HUD every chapter uses is its own question, game case both '
          '(docs/concepts/layout/phone-battle-hud/). These phones borrow the Yojimbo round\'s layout only to test the chips\' words; '
          'picking O-4 approves no phone HUD.'),
  'blocks': [one('A', 'o4-fight/a-p2-phone.jpg', 'Intent text only'),
             one('B', 'o4-fight/b-p2-phone.jpg', 'Chips on the HUD'),
             one('C', 'o4-fight/c-p2-phone.jpg', 'Marks in the world')]},
}
for out, sp in specs.items():
    p = os.path.join(TMP, out.replace('/', '-').replace('.jpg', '.json'))
    json.dump(sp, open(p, 'w', encoding='utf-8'))
    subprocess.run(['python', os.path.join(HERE, 'sheet.py'), p, D + out], check=True)
