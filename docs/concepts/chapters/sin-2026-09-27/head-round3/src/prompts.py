"""Sin's head, round 3 prompts (FFX only, 2026-09-27). Written descriptions only (research/ffx-sin.md 9.1 and 9.3,
research/ffx-evrae-airship.md 12.1 and 12.3); no character tag for Sin, no game or franchise name for the creature.

The layered rig paints the scene in two jobs, each from our own code-drawn sketch:
  plate   the sky, Bevelle far below, the tall white tower and the Fahrenheit's steel foredeck, with NO creature.
  sin     the creature painted INTO the plate (a masked repaint inside its silhouette), mouth FULLY OPEN, so the
          lower jaw, both rows of teeth and the throat are all painted once. The rig then cuts that one painting
          into layers (wings and body, throat, lower jaw, skull) and turns only the jaw for the five clock stages.
  r2-s2v2 round 2's stage-2 words, for the method check's test B only.
"""
import os, sys

LOOK = ('A painterly anime fantasy background painting, a cinematic matte painting with visible brushwork, golden hour, '
        'a soft orange, pink and blue evening sky, warm low sunlight from the left. ')

DECK = ('The view is from the grey steel foredeck of an ancient airship flying high in the sky: riveted steel deck plates with '
        'seams running to the pointed bow, a pale stencilled plate across the keel, a round gold dial set into the plating on '
        'the right, thin dark metal railings along both edges, and beyond the bow only a long drop. ')

CITY = ('Far, far below lies a vast white holy city of tiered towers and blue roofs, hazy with distance. On the right, one '
        'very tall slender white tower with gold bands rises high out of the city, its whole length in view, its flat round '
        'top standing high in the sky. ')
# v2, after LOOKING at plate pass 1: the tower grew to the top fifth of the frame, far above the claw in the sketch
CITY_V2 = ('Far, far below lies a vast white holy city of tiered towers and blue roofs, hazy with distance. On the right, one '
           'tall slender white tower with gold bands rises out of the city; its flat round top ends just above the horizon, '
           'halfway up the picture, with open sky above it. ')

# v3, after LOOKING at pass 2 (p3 at 0.55: a fine white tower, but its top still at a third of the height, far above
# the claw's place on the horizon line)
CITY_V3 = ('Far, far below lies a vast white holy city of tiered towers and blue roofs, hazy with distance. On the right, one '
           'slender white tower with gold bands rises out of the city up to the horizon line and no higher; its top is a '
           'round white drum ringed with gold, level with the far horizon, with a lot of open sky above it. ')

PLATE = LOOK + DECK + CITY + 'The sky above the city is empty and open. No creature, no people.'

SIN = (LOOK + DECK + CITY +
       'Level with the ship, nose to nose with it, a colossal living monster props itself on that tower: a huge scaled arm '
       'reaches down from under its neck and its hooked black claws clamp around the round top of the white tower. Its long '
       'blunt whale-like head is seen in three-quarter view, turned to the left towards the ship. Its hide is craggy dark '
       'slate-grey armour plates and scales like weathered rock, the same dark grey from the snout to the neck, with a ridge '
       'of short stone spikes along the top of the snout and the brow, a heavy brow ridge over one small glowing amber eye, and '
       'deep pleated grooves under the long lower jaw. The snout is dark grey rock like the rest of the head. The top of its '
       'head and its back are bare rock scales. Two huge feathered wings rise from its shoulders behind the head, one on each '
       'side, each growing from a thick scaled shoulder joint: solid dark grey feathers with vivid purple tips. It is an '
       'organic living creature. Its mouth is gaping fully open, the long lower jaw dropped far down from the hinge: rows of '
       'pale fangs along the upper and the lower jaw, and inside the mouth only dark wet red-violet flesh, a thick tongue '
       'lying in the lower jaw and a violet glow deep in the throat. No people.')

# v2, after LOOKING at pass 4 (a1 at 0.66: the claw on the tower top and an organic mouth, but cobblestone discs,
# pale rivet-like dots and a gun-like joint on the far wing; a2 at 0.74: a robot dragon with gold trim and a pole):
# no "armour", say what the hide is made of, keep the tongue inside, name what must not appear.
SIN_V2 = (LOOK + DECK + CITY_V3 +
          'Level with the ship, nose to nose with it, a colossal living sea monster props itself on that tower: a huge scaly '
          'arm reaches down from under its neck and its hooked black claws clamp over the round top of the white tower. Its long '
          'blunt whale-like head is seen in three-quarter view, turned to the left towards the ship. Its hide is rough and '
          'craggy like an ancient weathered cliff: overlapping dark slate-grey scales and ridges of cracked stone, all one dark '
          'grey from the snout to the neck, a ridge of short stone spikes along the top of the snout and the brow, a heavy brow '
          'over one small glowing amber eye, deep pleated grooves under the long lower jaw. The snout is the same dark grey '
          'rock as the rest. Two huge feathered wings rise from its shoulders behind the head, one on each side: long solid dark '
          'grey feathers with vivid purple tips. Its mouth is gaping fully open, the long lower jaw dropped far down from the '
          'hinge: rows of pale fangs along the upper and the lower jaw, and inside the mouth dark wet maroon flesh, a dark '
          'tongue lying flat inside the lower jaw, and a violet glow deep in the throat. It is entirely a living animal made of '
          'rock and scale: no metal, no gold, no machine parts, no pipes, no bolts, no poles, no buildings on it. No people.')

# repairs on the pick b1, each a masked repaint of one region (the words describe the whole picture, as z-image needs)
WINGFIX = SIN_V2 + (' The wing rising from its near shoulder is a great bird-like wing of long overlapping dark grey '
                    'feathers, each feather with a vivid purple tip, growing from a thick scaled shoulder: only feathers, '
                    'no pipe, no rod, no ring.')
CHEEKFIX = SIN_V2 + (' Behind the eye the cheek is covered in overlapping dark grey rock scales, rough and natural, with '
                     'no loops, no rings, no wheels and no holes.')

PATCHFIX = SIN_V2 + (' Its shoulders and its cheek by the hinge of the jaw are covered in overlapping dark grey rock '
                     'scales, rough and natural: no ropes, no straps, no wires, no loops, no mesh.')

# v3 of the cheek repair, after LOOKING at pass 8 (naming what must not appear grew gold wires): positive words only
CHEEK_POS = (LOOK + 'A close view of the rough hide of a colossal living sea monster: overlapping dark slate-grey scales '
             'like weathered stone, matte, craggy and natural, lit by warm low sunlight from the left.')

PROMPTS = {
    'plate': {'size': (1344, 768), 'pos': PLATE, 'neg': ''},
    'plate2': {'size': (1344, 768), 'pos': LOOK + DECK + CITY_V2 + 'The sky above the city is empty and open. No creature, no people.', 'neg': ''},
    'plate3': {'size': (1344, 768), 'pos': LOOK + DECK + CITY_V3 + 'The sky above the city is empty and open. No creature, no people.', 'neg': ''},
    'sin': {'size': (1344, 768), 'pos': SIN, 'neg': ''},
    'sin2': {'size': (1344, 768), 'pos': SIN_V2, 'neg': ''},
    'wingfix': {'size': (1344, 768), 'pos': WINGFIX, 'neg': ''},
    'cheekfix': {'size': (1344, 768), 'pos': CHEEKFIX, 'neg': ''},
    'patchfix': {'size': (1344, 768), 'pos': PATCHFIX, 'neg': ''},
    'cheekpos': {'size': (1344, 768), 'pos': CHEEK_POS, 'neg': ''},
}

# test B of the method check uses round 2's own words for stage 2, unchanged
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'head-round2', 'src'))
import importlib.util as _u
_s = _u.spec_from_file_location('r2prompts', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'head-round2', 'src', 'prompts.py'))
_m = _u.module_from_spec(_s); _s.loader.exec_module(_m)
PROMPTS['r2-s2v2'] = _m.PROMPTS['s2v2']
