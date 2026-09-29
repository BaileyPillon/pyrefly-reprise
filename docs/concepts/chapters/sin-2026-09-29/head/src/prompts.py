"""Sin art options, 2026-09-29 (FFX only): the words for every render.

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

# --- (3) the backdrop: the Fahrenheit's deck over Bevelle at dusk ----------------------------------------------------
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

# --- (2) links 1 to 3 ------------------------------------------------------------------------------------------------
def fin(side, rng, design):
    """The Left or Right Fin ("Sin's Left/Right Arm") seen from the deck, at FAR or NEAR, in one of two readings."""
    s = 'left' if side == 'L' else 'right'
    near = rng == 'NEAR'
    where = ('Very close beside the viewer, filling the right half of the sky and rising far above, is the side of a '
             'colossal flying whale-like monster, too big to see whole, and on its side, ' if near else
             'Far away across the open sky, level with the viewer, the whole flank of a colossal flying whale-like '
             'monster fills the right of the picture, its long scaly body trailing into haze; on its side, ')
    if design == 'F1':   # the clawed flipper: an arm shaped like a whale's pectoral fin, the core at its base
        what = (f'its huge {s} arm: a broad flat flipper like a whale\'s pectoral fin, long and tapering, ending in three '
                'hooked black claws, covered in overlapping dark slate-grey scales. At the base of the arm, where it '
                'joins the body, a round pale-blue glowing core the size of a house is set in a socket of rock, '
                'shining softly. ')
    else:                # the sail arm: a jointed arm carrying a tall ribbed fin like a fish's, the core in its root
        what = (f'its huge {s} arm: a long jointed scaly arm that carries a tall ribbed fin like a fish fin, the ribs '
                'long spines of dark stone with a thin dark grey webbed membrane stretched between them, the fin\'s '
                'edge ragged. In the root of the fin, where it meets the arm, a cluster of pale-blue glowing crystal '
                'forms the core, shining softly. ')
    return PAINT + AFTERNOON + where + what + HIDE + 'No airship, no deck, no people.'


# link 3, on Sin's back: Sinspawn Genais (a shelled, plant-like marine creature with large tentacles) and Sin's Core
BACK = ('The ground is the back of a colossal flying monster: a wide rolling plain of overlapping dark slate-grey rock '
        'scales and cracked stone ridges, curving away to the horizon, open sky all around and clouds below. ')

GENAIS = {
    'G1': ('In the middle distance on the left stands a huge shelled creature twice as tall as a man: a heavy spiral shell '
           'like a conch, ribbed and knobbly, dark teal and bone white, and out of its wide mouth pours a thick body '
           'like a plant, many large green-grey tentacles and leafy fronds curling and reaching forward, like a '
           'giant sea anemone. '),
    'G2': ('In the middle distance on the left stands a huge shelled creature twice as tall as a man: a broad low domed '
           'shell like a giant limpet or clam, ridged and barnacled, dark teal and bone white, lifted open at the front, '
           'and from under its rim a crown of many long thick tentacles like a giant sea anemone spreads out and '
           'reaches forward, grey-green with pale tips. '),
}
GENAIS_SHUT = {
    'G1': ('In the middle distance on the left sits a huge spiral shell like a conch, ribbed and knobbly, dark teal and '
           'bone white, closed tight: its creature has pulled back inside, only the dark shut mouth of the shell shows, '
           'no tentacles. '),
    'G2': ('In the middle distance on the left sits a huge broad low domed shell like a giant limpet or clam, ridged and '
           'barnacled, dark teal and bone white, clamped shut flat on the ground: its creature has pulled back inside, '
           'no tentacles show. '),
}
CORE = {
    'K1': ('Further back, out of reach, on a ridge of the monster\'s back, rises its core: a colossal round glowing orb '
           'the size of a building, pale blue-white, set deep in a cradle of great curved ribs of dark rock that grow '
           'up around it like fingers. '),
    'K2': ('Further back, out of reach, on a ridge of the monster\'s back, rises its core: a tall cluster of huge '
           'pale blue-white glowing crystals like a heart of ice, growing out of the dark scales, with glowing veins '
           'running from it into the rock. '),
}


def link3(g, k, shut=False):
    return (PAINT + AFTERNOON + BACK + (GENAIS_SHUT if shut else GENAIS)[g] + CORE[k] + HIDE.replace('Its hide', 'The '
            'ground') + 'No people, no airship.')


PROMPTS = {
    'bg1': {'size': (1344, 768), 'pos': BG1_TAGS, 'neg': BG1_NEG},
    'bg2': {'size': (1344, 768), 'pos': BG2, 'neg': ''},
    'tusk': {'size': (1344, 768), 'pos': TUSK, 'neg': ''},
    'lips': {'size': (1344, 768), 'pos': LIPS, 'neg': ''},
    'head-a': {'size': (1344, 768), 'pos': HEAD_A, 'neg': ''},
    'head-a2': {'size': (1344, 768), 'pos': HEAD_A2, 'neg': ''},
}
for _d in ('F1', 'F2'):
    for _s in ('L', 'R'):
        for _r in ('NEAR', 'FAR'):
            PROMPTS[f'fin-{_d}-{_s}-{_r}'] = {'size': (1344, 768), 'pos': fin(_s, _r, _d), 'neg': ''}
for _g, _k in (('G1', 'K1'), ('G2', 'K2')):
    PROMPTS[f'link3-{_g}{_k}'] = {'size': (1344, 768), 'pos': link3(_g, _k), 'neg': ''}
    PROMPTS[f'link3-{_g}{_k}-shut'] = {'size': (1344, 768), 'pos': link3(_g, _k, True), 'neg': ''}
