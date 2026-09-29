"""Sin's head options, 2026-09-29 (FFX only): the words for every head render (and the one backdrop test, bg1-a).

Written sources only (rule 8: no retail image anywhere, and no character, game or franchise name for any creature):
- research/ffx-sin.md 9.1 (where and when), 9.3 (appearance in words), 1.1 (the four links), 5.1 to 5.4.
- research/ffx-evrae-airship.md 12.1 and 12.3 (the Fahrenheit's foredeck, its steel, its lettering and dial).
- FF Wiki text read through the MediaWiki API on 2026-09-28/29 (text only, no image opened):
  "Sin (Final Fantasy X)" Appearance, revid 4045228 (round 1) / 2026-09-29 read: a whale-like body moved by a pair of
    clawed arms, hind legs like pectoral fins, a long tail, a body encased in scales, and in its final form feathery
    wing-like protrusions that are purple at the tips.
  "Left Fin" revid 3981190 and "Right Fin" revid 4031682: the Japanese names are "Sin's Left Arm" / "Sin's Right Arm";
    the fin's core charges before Gravija.
  "Sinspawn (Final Fantasy X)" revid 3739242: Sinspawn forms "coincide with those of marine creatures, such as anemones
    and jellyfish"; Geneaux is "a shelled plant-like monster with large tentacles"; Genais is "a palette-swap of
    Sinspawn Geneaux".
  "Sin (core)" revid 4015250 and "Sinspawn Genais" revid 4016986: the Core fights beside Genais on Sin's back.
- The head's composition and the deck come from our own earlier rounds (docs/concepts/chapters/sin-2026-09-27/).
Anything the sources leave open is our reading, and the sheet says so.
"""

# --- shared words --------------------------------------------------------------------------------------------------
PAINT = ('A painterly anime fantasy background painting, a cinematic matte painting with visible brushwork. ')

DUSK = ('Golden hour at dusk: a soft orange, pink and violet evening sky, the sun low on the left, warm low light. ')

AFTERNOON = ('Late afternoon high above a sea of clouds: a deep blue sky, towering white and gold clouds, bright low '
             'sunlight from the left, streaks of cloud rushing past. ')

# the Evrae deck's sky, for the fins (links 1 and 2 are fought in flight, before Sinfall: research 9.1). Our estimate: late
# afternoon, since Sin falls into Bevelle at sunset after link 3.

HIDE = ('Its hide is rough and craggy like an ancient weathered cliff: overlapping dark slate-grey scales and ridges of '
        'cracked stone, matte and natural. It is entirely a living animal made of rock and scale: no metal, no gold, '
        'no machine parts, no pipes, no bolts, no buildings on it. ')

# --- the backdrop test bg1-a (made before the work was split; the backdrop section is the other agent's) ---------
# BG-1: the approved Evrae deck plate (backdrop B, "looking up at the hull from the rail"), repainted at dusk with
# Bevelle below: img2img from our own installed painting, so the hull and the layout are the ship Bailey approved.
BG1_TAGS = ('no humans, scenery, the underside of a huge ancient airship hull overhead, looking up from the rail, '
            'dusk, sunset, orange and violet sky, low sun, glowing clouds, a vast white city of towers and blue roofs '
            'far below the clouds, hazy distance, painterly, cinematic lighting, wide shot, detailed background, '
            'masterpiece, high score, great score, absurdres')
BG1_NEG = ('lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, signature, watermark, username, '
           'blurry, artist name, people, person, human, character, monster, creature, daylight, blue noon sky')

# BG-2: round 3's plate p6 (dusk over Bevelle, the white tower Sin props itself on) with its painted prow replaced by
# more of the city, so the in-game deck geometry can stand in front of it (a masked repaint of the deck area only).
BG2 = (PAINT + DUSK + 'Seen from high in the sky: far, far below lies a vast white holy city of tiered towers, domes '
       'and blue roofs, row after row receding to a hazy horizon; on the right one slender white tower with gold bands '
       'rises out of the city. The lower part of the picture is more of the white city seen from above, closer and '
       'clearer, rooftops, courtyards and spires, soft evening light. No airship, no deck, no railings, no people.')

# --- (1) the head ----------------------------------------------------------------------------------------------------
# C's one repair on the master: the stage-4 tusk at the chin (a masked repaint of the jaw tip only).
TUSK = (PAINT + DUSK + 'A close view of the tip of the long lower jaw of a colossal grey sea monster, its mouth wide '
        'open: a row of short small pale fangs along the lower jaw, all about the same size, and dark wet maroon flesh '
        'inside the mouth above them. The jaw is dark slate-grey craggy rock scales. ' + HIDE)

# C's stage-0 shut-lip patch: the seam band only, on the stage-0 composite (repair.py lip-prep).
LIPS = (PAINT + DUSK + 'A close view of the long mouth of a colossal grey sea monster seen in three-quarter view, the '
        'mouth shut tight: the upper lip and the lower lip pressed together in one thin dark seam along the whole length '
        'of the jaw, a row of pale fangs from the upper jaw hanging down over the outside of the closed lower jaw, no '
        'gap and no mouth interior showing. Dark slate-grey craggy rock scales above the seam, the lower jaw pale grey '
        'with cracked plates below it. ' + HIDE)

# A, v2 (after LOOKING at a1/a2: a chubby plush-toy face with a cartoon grin, small, not colossal): scale, age and
# rock in the words, many small teeth, small deep-set eyes; the rest as v1.
HEAD_A2 = (PAINT + DUSK +
           'Far below lies a vast white holy city of tiered towers and blue roofs, hazy with distance; on the right one '
           'slender white tower with gold bands rises out of the city. Filling the sky, level with the viewer and facing '
           'straight towards the viewer, head-on, looms a monster as big as a mountain, ancient and terrifying: a broad '
           'blunt whale-like head seen from the front, wide and low, its hide craggy like a weathered cliff face, '
           'overlapping dark slate-grey rock scales, cracks and ridges, stone spikes along a heavy brow, two small '
           'deep-set glowing amber eyes far apart under the brow, deep pleated grooves down the lower jaw like a whale. '
           'Its mouth gapes fully open towards the viewer, a huge wide cavern of a maw: long rows of many small pale '
           'fangs along the upper and the lower jaw, and inside only dark wet maroon flesh and a violet glow deep in the '
           'throat. Behind the head two enormous feathered wings spread wide to both sides: long solid dark grey feathers '
           'with vivid purple tips. A huge scaly arm reaches down on the right and its hooked black claws clamp over the '
           'round top of the white tower. Haze softens its far edges, it is so vast. ' + HIDE + 'No people.')

# A: option A's head-on face and spread wings (round 1's A), painted into the dusk plate, mouth fully open for the rig.
HEAD_A = (PAINT + DUSK +
          'Far below lies a vast white holy city of tiered towers and blue roofs, hazy with distance; on the right one '
          'slender white tower with gold bands rises out of the city. Filling the sky, level with the viewer and '
          'facing straight towards the viewer, head-on, looms a colossal living sea monster: a broad blunt whale-like '
          'head seen from the front, wide and low, with a heavy brow ridge and two small glowing amber eyes set far '
          'apart under the brow. Its mouth gapes fully open towards the viewer, a huge wide maw: rows of pale fangs '
          'along the upper jaw and the dropped lower jaw, and inside only dark wet maroon flesh and a violet glow deep '
          'in the throat. Behind the head two enormous feathered wings spread wide to both sides and rise high: long '
          'solid dark grey feathers with vivid purple tips. A huge scaly arm reaches down on the right and its hooked '
          'black claws clamp over the round top of the white tower. ' + HIDE + 'No people.')

PROMPTS = {
    'bg1': {'size': (1344, 768), 'pos': BG1_TAGS, 'neg': BG1_NEG},
    'bg2': {'size': (1344, 768), 'pos': BG2, 'neg': ''},
    'tusk': {'size': (1344, 768), 'pos': TUSK, 'neg': ''},
    'lips': {'size': (1344, 768), 'pos': LIPS, 'neg': ''},
    'head-a': {'size': (1344, 768), 'pos': HEAD_A, 'neg': ''},
    'head-a2': {'size': (1344, 768), 'pos': HEAD_A2, 'neg': ''},
}
