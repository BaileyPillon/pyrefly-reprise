# Writes the sheet specs for every round and builds them with sheet.py (large labels, phone-readable).
import json, subprocess
D = 'D:/Final Fantasy/docs/concepts/chapters/omnis/'
S = 'D:/Tools/pyrefly-scratch/omnis-options/'


def it(key, img, cap):
    return {'key': key, 'img': D + img, 'cap': cap}


specs = {
 'o2-discs/sheet.jpg': {'title': 'Chapter XII - O-2 The four discs (FFX only)',
   'subtitle': 'The colour facing Seymour decides his spells and resistances. Ring order = our estimate (B8). Real engine frames, real HUD.',
   'rows': [
    {'label': 'In a real battle frame (all four show Fire: the fight opens so)', 'items': [
        it('A', 'o2-discs/a-frame.jpg', 'A  painted discs, the quarter facing him lit'),
        it('B', 'o2-discs/b-frame.jpg', 'B  A + a disc strip on the HUD: facings and his resistances'),
        it('C', 'o2-discs/c-frame.jpg', 'C  Ink & Gold rings with a symbol per element')]},
    {'label': 'One turn: a spell hits the upper-left disc', 'items': [
        it('', 'o2-discs/a-turn.jpg', 'A  the lit quarter slides away; Thunder lights'),
        it('', 'o2-discs/b-turn.jpg', 'B  the strip changes when the turn ends'),
        it('', 'o2-discs/c-turn.jpg', 'C  the ring turns under a fixed pointer')]},
    {'label': 'One disc, close up', 'cellH': 520, 'items': [
        it('', 'o2-discs/a-disc-card.jpg', 'A  A and B share this painted disc'),
        it('', 'o2-discs/a-disc-card.jpg', 'B  B = A\'s disc, plus the strip'),
        it('', 'o2-discs/c-disc-card.jpg', 'C  colour + symbol: readable without colour vision')]}]},
 'o2-discs/sheet-phone.jpg': {'title': 'Chapter XII - O-2 at phone width, 390x844 (FFX only)',
   'subtitle': 'The Yojimbo round\'s phone layout. No Talk, no Flee (none in this fight). Discs are about 80 CSS px here.',
   'rows': [{'label': 'Phone', 'cellH': 1600, 'items': [
        it('A', 'o2-discs/a-phone.jpg', 'A  painted discs only'),
        it('B', 'o2-discs/b-phone.jpg', 'B  + disc strip at the top'),
        it('C', 'o2-discs/c-phone.jpg', 'C  Ink & Gold rings')]}]},
 'o1-omnis/sheet.jpg': {'title': 'Chapter XII - O-1 Seymour Omnis (FFX only)',
   'subtitle': 'Sourced: he hovers before four discs, glows red before Dispel and Ultima, one source says translucent. The rest is ours.',
   'rows': [
    {'label': 'In a real battle frame', 'items': [
        it('A', 'o1-omnis/a-frame.jpg', 'A  new paint: horned shoulders, spread claws, hanging strips'),
        it('B', 'o1-omnis/b-frame.jpg', 'B  face and hair from the approved portrait; horned, lean'),
        it('C', 'o1-omnis/c-frame.jpg', 'C  A made translucent and pyrefly-lit')]},
    {'label': 'Glowing red: Dispel, then Ultima, is next (sourced)', 'items': [
        it('A', 'o1-omnis/a-glow-frame.jpg', 'A  red tint + red halo'),
        it('B', 'o1-omnis/b-glow-frame.jpg', 'B'),
        it('C', 'o1-omnis/c-glow-frame.jpg', 'C')]},
    {'label': 'The painting', 'cellH': 620, 'items': [
        it('', 'o1-omnis/a-card.jpg', 'A  calm, and glowing'),
        it('', 'o1-omnis/b-card.jpg', 'B  calm, and glowing'),
        it('', 'o1-omnis/c-card.jpg', 'C  a grade of A\'s pixels')]}]},
 'o3-garden/sheet.jpg': {'title': 'Chapter XII - O-3 The Garden of Pain, inside Sin (FFX only)',
   'subtitle': 'Sourced: steps up to a platform; a red-tinged sea, blue water walkways, waterfalls. Frames sit under Chapter III\'s red grade.',
   'rows': [
    {'label': 'The plate', 'items': [
        it('A', 'o3-garden/a-plate.jpg', 'A  crimson dusk'),
        it('B', 'o3-garden/b-plate.jpg', 'B  pale day, rose sea, waterfalls'),
        it('C', 'o3-garden/c-plate.jpg', 'C  deep violet')]},
    {'label': 'In a real battle frame (O-1 A, O-2 A)', 'items': [
        it('A', 'o3-garden/a-frame.jpg', 'A  the blue figure pops on red'),
        it('B', 'o3-garden/b-frame.jpg', 'B'),
        it('C', 'o3-garden/c-frame.jpg', 'C')]},
    {'label': 'He glows red (Dispel, then Ultima): does it still read?', 'items': [
        it('A', 'o3-garden/a-glow-frame.jpg', 'A  the glow sinks into the red'),
        it('B', 'o3-garden/b-glow-frame.jpg', 'B  reads; the horizon blooms behind him'),
        it('C', 'o3-garden/c-glow-frame.jpg', 'C  reads clearly on violet')]}]},
 'o4-fight/sheet.jpg': {'title': 'Chapter XII - O-4 Reading the fight at 1600x900 (FFX only)',
   'subtitle': 'All on O-2 B (disc strip) and plate O-3 C. The options differ only in how the 6-attack counter shows (B14). No chip names a target.',
   'rows': [
    {'label': 'i  Turn one: every disc on Fire', 'items': [
        it('A', 'o4-fight/a-i.jpg', 'A  red glow only, as the game'), it('B', 'o4-fight/b-i.jpg', 'B  + attack pips (0 of 6)'),
        it('C', 'o4-fight/c-i.jpg', 'C  + one line of intent')]},
    {'label': 'ii  He glows red: Dispel, then Ultima', 'items': [
        it('A', 'o4-fight/a-ii.jpg', 'A  the glow is the only warning'), it('B', 'o4-fight/b-ii.jpg', 'B  pips full, red'),
        it('C', 'o4-fight/c-ii.jpg', 'C  says what comes and what follows')]},
    {'label': 'iii  A disc turned: his resistances change', 'items': [
        it('A', 'o4-fight/a-iii.jpg', 'A  strip only'), it('B', 'o4-fight/b-iii.jpg', 'B  pips 2 of 6'),
        it('C', 'o4-fight/c-iii.jpg', 'C  next turn\'s spells in words')]}]},
 'o4-fight/sheet-phone.jpg': {'title': 'Chapter XII - O-4 at phone width, 390x844 (FFX only)',
   'subtitle': 'Rows: i turn one, ii the red glow, iii a disc turned. Every fight label 12 CSS px or larger.',
   'rows': [
    {'label': 'i', 'cellH': 1500, 'items': [it('A', 'o4-fight/a-i-phone.jpg', 'A  glow only'), it('B', 'o4-fight/b-i-phone.jpg', 'B  pips'), it('C', 'o4-fight/c-i-phone.jpg', 'C  intent line')]},
    {'label': 'ii', 'cellH': 1500, 'items': [it('A', 'o4-fight/a-ii-phone.jpg', 'A'), it('B', 'o4-fight/b-ii-phone.jpg', 'B'), it('C', 'o4-fight/c-ii-phone.jpg', 'C')]},
    {'label': 'iii', 'cellH': 1500, 'items': [it('A', 'o4-fight/a-iii-phone.jpg', 'A'), it('B', 'o4-fight/b-iii-phone.jpg', 'B'), it('C', 'o4-fight/c-iii-phone.jpg', 'C')]}]},
}
for out, sp in specs.items():
    p = S + 'spec-' + out.replace('/', '-').replace('.jpg', '.json')
    json.dump(sp, open(p, 'w', encoding='utf-8'))
    subprocess.run(['python', S + 'sheet.py', p, D + out], check=True)
