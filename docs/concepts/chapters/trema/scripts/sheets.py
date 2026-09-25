# Builds every decision sheet of the Trema options rounds with sheet.py. Usage: python sheets.py
import json, os, subprocess, sys
D = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')).replace('\\', '/') + '/'
SPECS = {
 'trema/sheet.jpg': {'title': 'O-1  How should Trema look?  (FFX-2 only)',
  'subtitle': 'Sourced: an old man in a torn Yevon priest robe, an unsent. Frames: real 1600x900 engine frames under the real FFX-2 HUD, Trema composited. Recommend A.',
  'rows': [
   {'label': 'In battle, on Cloister plate B', 'items': [
     {'key': 'A', 'img': 'trema/a-priest-frame.jpg', 'cap': 'A  the priest: ivory robe, tall black hat, green-grey skin'},
     {'key': 'B', 'img': 'trema/b-unsent-frame.jpg', 'cap': 'B  unsent pallor: A graded ashen, hem fading to pyreflies'},
     {'key': 'C', 'img': 'trema/c-puppeteer-frame.jpg', 'cap': 'C  dark puppeteer: dark robe, pyrefly threads from his hand'}]},
   {'label': 'The painting alone', 'cellH': 820, 'items': [
     {'key': 'A', 'img': 'trema/a-priest-card.jpg', 'cap': 'the stole crest is gold, not red; a halo disc was removed by hand'},
     {'key': 'B', 'img': 'trema/b-unsent-card.jpg', 'cap': 'motes and fade would be live effects, not paint'},
     {'key': 'C', 'img': 'trema/c-puppeteer-card.jpg', 'cap': 'legs read as bare tights; threads are a stand-in'}]}]},
 'paragon/sheet.jpg': {'title': 'O-2  How should Paragon look?  (FFX-2 only)',
  'subtitle': "Sourced: Lord Zaon's fiend form, on the same model as FFX's Nemesis. Link 1 of the chapter. Recommend A.",
  'rows': [
   {'label': 'In battle, on Cloister plate B', 'items': [
     {'key': 'A', 'img': 'paragon/a-gold-frame.jpg', 'cap': 'A  gold-and-black armoured beast, curled horns, spiked crown'},
     {'key': 'B', 'img': 'paragon/b-fiend-frame.jpg', 'cap': 'B  black fiend with ember veins and a skull face'}]},
   {'label': 'The painting alone', 'cellH': 640, 'items': [
     {'key': 'A', 'img': 'paragon/a-gold-card.jpg', 'cap': 'flaw: a loose curved blade in front of it'},
     {'key': 'B', 'img': 'paragon/b-fiend-card.jpg', 'cap': 'flaw: white holes in the tail cut-out'}]}]},
 'paragon/sheet-link.jpg': {'title': 'O-2b  The link: Trema destroys Paragon  (FFX-2 only)',
  'subtitle': 'Sourced beat: Paragon falls, the old man from Cloister 0 appears, destroys it and reveals himself. Three stills, no HUD; the effects are stand-ins. Recommend yes.',
  'rows': [
   {'label': 'On Paragon A', 'items': [
     {'key': '1', 'img': 'paragon/a-gold-link-1.jpg', 'cap': 'Paragon is beaten'},
     {'key': '2', 'img': 'paragon/a-gold-link-2.jpg', 'cap': 'Trema appears; it breaks into pyreflies'},
     {'key': '3', 'img': 'paragon/a-gold-link-3.jpg', 'cap': 'Trema takes the floor; link 2 opens'}]},
   {'label': 'On Paragon B', 'items': [
     {'key': '1', 'img': 'paragon/b-fiend-link-1.jpg', 'cap': 'Paragon is beaten'},
     {'key': '2', 'img': 'paragon/b-fiend-link-2.jpg', 'cap': 'Trema appears; it breaks into pyreflies'},
     {'key': '3', 'img': 'paragon/b-fiend-link-3.jpg', 'cap': 'Trema takes the floor; link 2 opens'}]}]},
 'cloister/sheet.jpg': {'title': 'O-3  Cloister 100 of the Via Infinito  (FFX-2 only)',
  'subtitle': 'Sourced: one large room under Bevelle, upside-down banners, pyreflies. A and B come from the approved Bevelle Underground pixels; C is new. Recommend B.',
  'rows': [
   {'label': 'The plate', 'items': [
     {'key': 'A', 'img': 'cloister/a-derived-plate.jpg', 'cap': 'A  approved plate, teal grade, cold lamps, our banners hung upside down'},
     {'key': 'B', 'img': 'cloister/b-repaint-plate.jpg', 'cap': 'B  approved plate repainted: same room, teal, hanging banners'},
     {'key': 'C', 'img': 'cloister/c-new-plate.jpg', 'cap': 'C  new: a round teal chamber with a column of light'}]},
   {'label': 'In battle (real engine staging, Trema A composited)', 'items': [
     {'key': 'A', 'img': 'cloister/a-derived-frame.jpg', 'cap': 'the banners are flat stand-in shapes'},
     {'key': 'B', 'img': 'cloister/b-repaint-frame.jpg', 'cap': 'the same underworld, now a cloister'},
     {'key': 'C', 'img': 'cloister/c-new-frame.jpg', 'cap': 'the light column stands right behind the boss'}]}]},
 'fight/sheet.jpg': {'title': 'O-4  Reading the fight at 1600x900  (FFX-2 only)',
  'subtitle': "Two moments: Paragon, a Dark Knight about to pick Darkness (it draws Big Bang); Trema just above half HP (Meteor next). Recommend B, with A's sentence kept in the enemy-move panel.",
  'rows': [
   {'label': 'Link 1: Paragon', 'items': [
     {'key': 'A', 'img': 'fight/a-p1.jpg', 'cap': 'A  intent text only'},
     {'key': 'B', 'img': 'fight/b-p1.jpg', 'cap': 'B  chips on the HUD'},
     {'key': 'C', 'img': 'fight/c-p1.jpg', 'cap': 'C  marks in the world'}]},
   {'label': 'Link 2: Trema at 512,340 / 999,999', 'items': [
     {'key': 'A', 'img': 'fight/a-p2.jpg', 'cap': 'A  one sentence, no marks'},
     {'key': 'B', 'img': 'fight/b-p2.jpg', 'cap': 'B  ticks at 1/2, 1/4, 1/6 on his bar'},
     {'key': 'C', 'img': 'fight/c-p2.jpg', 'cap': 'C  a sigil over him, a ring on the party'}]}]},
 'fight/sheet-phone.jpg': {'title': 'O-4  Reading the fight at 390 px  (FFX-2 only)',
  'subtitle': 'Our own phone layout (the game has none today). Seven-digit numerals fit; every label is 12 CSS px or larger; no sideways scroll. Recommend B.',
  'rows': [
   {'label': 'Link 1: Paragon', 'cellH': 1100, 'items': [
     {'key': 'A', 'img': 'fight/a-p1-phone.jpg', 'cap': 'A  intent text'},
     {'key': 'B', 'img': 'fight/b-p1-phone.jpg', 'cap': 'B  chips'},
     {'key': 'C', 'img': 'fight/c-p1-phone.jpg', 'cap': 'C  world marks'}]},
   {'label': 'Link 2: Trema', 'cellH': 1100, 'items': [
     {'key': 'A', 'img': 'fight/a-p2-phone.jpg', 'cap': 'A  intent text'},
     {'key': 'B', 'img': 'fight/b-p2-phone.jpg', 'cap': 'B  ticks on the bar'},
     {'key': 'C', 'img': 'fight/c-p2-phone.jpg', 'cap': 'C  labels crowd the party'}]}]},
}
tmp = os.environ.get('TREMA_TMP', os.path.dirname(__file__))
for out, s in SPECS.items():
    for r in s['rows']:
        for it in r['items']:
            it['img'] = D + it['img']
    p = os.path.join(tmp, 'spec-' + out.replace('/', '-') + '.json')
    json.dump(s, open(p, 'w', encoding='utf-8'))
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'sheet.py'), p, D + out], check=True)
