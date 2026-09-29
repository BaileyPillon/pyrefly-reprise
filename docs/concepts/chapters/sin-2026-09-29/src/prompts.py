"""Sin art options, 2026-09-29 (FFX only): the words. Written descriptions only (research/ffx-sin.md 1.1, 9.1, 9.3;
research/ffx-evrae-airship.md 12.2, 12.3; the FF Wiki texts named in sketch.py). No character tag for Sin, Genais or
the Core, and no game or franchise name in any creature prompt. The z-image prompts describe the whole picture (the
masked repaint needs the scene around the creature); the SDXL backdrop prompts are tags, as the Evrae plate's were.
"""

LOOK = ('A painterly anime fantasy background painting, a cinematic matte painting with visible brushwork, golden hour, '
        'a soft orange, pink and blue evening sky, warm low sunlight from the left. ')
LOOK_AFTERNOON = ('A painterly anime fantasy background painting, a cinematic matte painting with visible brushwork, late '
                  'afternoon turning to golden hour, a soft blue sky warming to orange at the horizon, warm low sunlight '
                  'from the left. ')
LOOK_SUNSET = ('A painterly anime fantasy background painting, a cinematic matte painting with visible brushwork, sunset, '
               'an orange, pink and violet sky, the sun low on the left, long warm light. ')

DECK = ('The view is from the grey steel foredeck of an ancient airship flying high in the sky: riveted steel deck plates with '
        'seams running to the pointed bow, a pale stencilled plate across the keel, a round gold dial set into the plating on '
        'the right, thin dark metal railings along both edges, and beyond the bow only a long drop. ')
CITY_V3 = ('Far, far below lies a vast white holy city of tiered towers and blue roofs, hazy with distance. On the right, one '
           'slender white tower with gold bands rises out of the city up to the horizon line and no higher; its top is a '
           'round white drum ringed with gold, level with the far horizon, with a lot of open sky above it. ')
ROCK = ('It is entirely a living animal made of rock and scale: no metal, no gold, no machine parts, no pipes, no bolts, no '
        'poles, no buildings on it. No people.')
HIDE = ('overlapping dark slate-grey scales and ridges of cracked stone, rough and craggy like an ancient weathered cliff')

FLIGHT = (LOOK_AFTERNOON + DECK + 'Ahead and below, an endless sea of soft white and peach clouds; through gaps in the cloud, '
          'far, far below, the pale outskirts of a white city of blue roofs. Thin high clouds streak the open sky above. '
          'No creature, no tower, no people.')

# ---- the Fins: option A, the clawed arm with a ribbed fin; option B, a whale's pectoral fin with claws ----------------
FIN_A = ('one colossal clawed arm of a living sea monster, as big as a mountain: a thick scaly forearm of ' + HIDE + ', with a '
         'broad ribbed fin of dark grey membrane along its back edge like the dorsal fin of a whale, and huge hooked black claws '
         'curled at the end of the arm. ')
FIN_B = ('one colossal fin of a living sea monster, as big as a mountain, shaped like the pectoral fin of a whale: a long '
         'tapering blade of overlapping ' + HIDE + ', its trailing edge scalloped into a fringe of dark grey membrane, and a row '
         'of short hooked black claws along its leading edge. ')
CORE_NEAR = ('Where the arm joins the monster\'s vast scaled flank, a round glowing core the size of a house is set deep into '
             'the flesh like a great pearl, shining a soft pale violet light. ')


def fin_near(fin, side):
    where = ('Right beside the ship, so close it fills the right half of the sky, the flank of the monster rises from below '
             'the ship on the right like a curving wall of scales, and out of it rises ' if side == 'l' else
             'Right beside the ship, so close it fills the upper right of the sky, the monster flies just above the ship on '
             'the right, its vast scaled flank overhead like a curving ceiling of scales, and from it reaches down ')
    return LOOK_AFTERNOON + DECK + 'Ahead and below, a sea of soft clouds. ' + where + fin + CORE_NEAR + \
        'Its shadow falls across the deck. ' + ROCK


def fin_far(fin, side):
    head = 'right' if side == 'l' else 'left'
    return (LOOK_AFTERNOON + DECK + 'Ahead and below, a sea of soft clouds. Far away across the open sky, level with the '
            f'ship, a colossal whale-like monster flies side-on, its long blunt head to the {head} with one small amber eye, '
            f'a long tail trailing into haze, its whole body of {HIDE}. It is enormous even at this distance, and hazy blue '
            'with the air between. From its near flank ' + fin.replace('one colossal', 'its').replace(', as big as a mountain', '') +
            'At the base of that arm or fin a small round violet glow. The deck is in full sunlight. ' + ROCK)


# v2 FAR, after LOOKING at pass 3 (a fine flying whale with clawed arms, but its face is a gentle humpback's, not the
# head of round 3, the head option C): the same head in words as round 3's creature, jaw shut (no wings yet: Sin
# sprouts them only before link 4, research 9.1).
HEAD_WORDS = ('its long blunt head, half whale and half crocodile, craggy dark slate-grey rock scales, a ridge '
              'of short stone spikes along the snout and brow, a heavy brow over one small glowing amber eye, the long jaw '
              'shut with a row of pale fangs showing along it, ')


def fin_far2(fin, side):
    head = 'right' if side == 'l' else 'left'
    return fin_far(fin, side).replace(f'its long blunt head to the {head} with one small amber eye, ',
                                      f'{HEAD_WORDS}pointing to the {head}, ').replace('no buildings on it.', 'no buildings on it, no wings.')


# v2 NEAR for option B, after LOOKING at pass 3 (fin-b-r-near-1 read as a second head: the claws along the leading
# edge became teeth and the tip a snout): say it is a limb, and end it in a webbed paddle with the claws at its tip.
LIMB = ' It is a limb, not a head: it has no eye, no mouth and no teeth anywhere on it. '
FIN_B2 = ('one colossal fin of a living sea monster, as big as a mountain, shaped like the pectoral fin of a whale: a long '
          'tapering limb of overlapping ' + HIDE + ', widening into a broad webbed paddle of dark grey membrane stretched '
          'between long bony fingers, with short hooked black claws at the fingertips.')

# v2 NEAR for option A (left), after LOOKING at pass 3: the arm with one hooked claw on top read as a neck and a beak.
FIN_A2 = ('one colossal clawed arm of a living sea monster, as big as a mountain: a thick scaly forearm of ' + HIDE + ', a '
          'broad ribbed fin of dark grey membrane along its back edge, ending at the top in a huge open hand with four long '
          'hooked black talons spread wide like a grasping claw.')


# ---- link 3: Sin's back, Genais, the Core -----------------------------------------------------------------------------
BACK = (LOOK_SUNSET + 'The view is from on top of the back of a colossal flying monster, high above the clouds: the ground '
        'is a broad rolling expanse of huge overlapping dark slate-grey scales like weathered stone plates, rising towards a '
        'spine of tall stone spikes that runs away to the upper right; on the left the back drops away to a sea of clouds far '
        'below. A small airship flies in the sky far off on the left. No creature on the back, no people.')

GENAIS_A = (BACK.replace(' No creature on the back, no people.', '') +
            ' In the middle of the scaled back crouches a monstrous shelled creature as big as a house: a hunched beast under '
            'a massive ridged dome shell of dark bone plates like a giant clam, open at the front, from which its thick grey-'
            'violet body leans out, a heavy crested head with a wide mouth and small pale eyes, two thick clawed forelimbs '
            'gripping the scales. Behind it and higher up the back, out of reach on a raised hump of scales, a huge round '
            'core is set into the monster\'s back like a great dark pearl in a crater of scales, faintly lit violet, with '
            'veins running out from it into the scales. No people.')
GENAIS_A_SHELL = (BACK.replace(' No creature on the back, no people.', '') +
                  ' In the middle of the scaled back sits a monstrous shelled creature as big as a house, withdrawn entirely '
                  'into its massive ridged dome shell of dark bone plates, closed tight like a giant clam, nothing of its body '
                  'showing. Behind it and higher up the back, on a raised hump of scales, a huge round core is set into the '
                  'monster\'s back like a great pearl in a crater of scales, glowing bright violet. No people.')
GENAIS_B = (BACK.replace(' No creature on the back, no people.', '') +
            ' In the middle of the scaled back sits a monstrous shelled creature as big as a house: a great spiral shell like '
            'a giant conch of pale bone and grey stone, and from its wide mouth leans out a writhing grey-violet body with a '
            'crown of short thick tentacles around a beaked face and two glowing pale eyes. Behind it, far out of reach, a '
            'tall fleshy stalk rises from the monster\'s back, and on top of it sits a round dark core like a giant lantern, '
            'faintly lit violet. No people.')
GENAIS_B_SHELL = (BACK.replace(' No creature on the back, no people.', '') +
                  ' In the middle of the scaled back sits a monstrous shelled creature as big as a house, withdrawn entirely '
                  'into a great spiral shell like a giant conch of pale bone and grey stone, its wide mouth sealed by a hard '
                  'plate, nothing of its body showing. Behind it a tall fleshy stalk rises from the monster\'s back with a '
                  'round core on top, glowing bright violet like a giant lantern. No people.')

# v2 after LOOKING at pass 2 (a1: a goofy purple frog face under a turtle shell; b1: a snail with a toothy mouth, too
# small and too pale): a fiend, not a cute animal; the shell dark and craggy like Sin's own hide; bigger.
FIEND = ('It is a grotesque, menacing fiend, the strongest spawn of the great monster: a wide maw of jagged fangs, small '
         'glaring red eyes deep under a heavy armoured brow, rough dark grey-violet hide; not cute, not a frog, not a '
         'cartoon animal. ')
GENAIS_A2 = GENAIS_A.replace('a heavy crested head with a wide mouth and small pale eyes', 'a heavy crested head')     .replace('massive ridged dome shell of dark bone plates', 'massive ridged dome shell of dark craggy stone plates twice '
             'the height of a man') .replace(' No people.', ' ' + FIEND + 'No people.')
GENAIS_B2 = GENAIS_B.replace('pale bone and grey stone', 'dark craggy stone and bone, twice the height of a man')     .replace('a crown of short thick tentacles around a beaked face and two glowing pale eyes', 'a crown of short thick '
             'tentacles around a beaked head') .replace(' No people.', ' ' + FIEND + 'No people.')

# the shelled state v2, painted ON the picked v2 paintings (shell.py): the same shell as the picked painting, closed
GENAIS_A2_SHELL = GENAIS_A_SHELL.replace('massive ridged dome shell of dark bone plates', 'massive ridged dome shell of '
                                         'dark craggy stone plates')
GENAIS_B2_SHELL = GENAIS_B_SHELL.replace('pale bone and grey stone', 'dark craggy stone and bone')


# ---- link 4 backdrop options (SDXL, tags; img2img from our own approved Evrae deck painting) --------------------------
BK_TAIL = ('dramatic upward angle, clouds streaking past, sense of speed, detailed background, painterly, cinematic lighting, '
           'wide shot, masterpiece, high score, great score, absurdres')
BK_NEG = ('lowres, text, error, cropped, worst quality, low quality, low score, bad score, average score, jpeg artifacts, '
          'signature, watermark, username, blurry, artist name, character, people, person, human, monster, creature, dragon')
BK_A = ('no humans, scenery, open foredeck of an airship, metal hull, guard rail in foreground, looking up at the sky, '
        'sunset, dusk, golden hour, low sun, orange and pink clouds, warm rim light on the hull, a vast white holy city with '
        'tiered towers and blue roofs far below, one tall white tower with gold bands, ' + BK_TAIL)
BK_B = ('no humans, scenery, open foredeck of an airship, metal hull, guard rail in foreground, looking up at the sky, '
        'evening, twilight after sunset, violet and deep blue sky, pink cloud rims, first stars, a vast white holy city far '
        'below with warm lantern lights coming on, one tall white tower with gold bands, ' + BK_TAIL)

# step 2 of a backdrop (bk_city.py): the city painted into the relit plate's lower-left cloud (z-image, whole picture)
BK_CITY_A = ('A painterly anime fantasy background painting, a cinematic matte painting with visible brushwork, sunset, '
             'looking up past the dark steel hull of a huge ancient airship that crosses the sky on a diagonal, towards orange '
             'and pink sunset clouds. Down on the left, far, far below through a gap in the golden clouds, lies a vast white '
             'holy city of tiered towers, domes and blue roofs, lit warm by the low sun and hazy with distance, and one tall '
             'slender white tower with gold bands rising out of it. No creature, no people.')
BK_CITY_B = ('A painterly anime fantasy background painting, a cinematic matte painting with visible brushwork, twilight just '
             'after sunset, looking up past the dark steel hull of a huge ancient airship that crosses the sky on a diagonal, '
             'towards a violet and deep blue sky with pink cloud rims. Down on the left, far, far below through a gap in the '
             'dusky clouds, lies a vast white holy city of tiered towers, domes and blue roofs in cool evening shade, its '
             'windows and lanterns glowing warm, and one tall slender white tower with gold bands rising out of it. No '
             'creature, no people.')

PROMPTS = {
    'flight': {'size': (1344, 768), 'pos': FLIGHT},
    'fin-a-l-near': {'size': (1344, 768), 'pos': fin_near(FIN_A, 'l')},
    'fin-a-r-near': {'size': (1344, 768), 'pos': fin_near(FIN_A, 'r')},
    'fin-b-l-near': {'size': (1344, 768), 'pos': fin_near(FIN_B, 'l')},
    'fin-b-r-near': {'size': (1344, 768), 'pos': fin_near(FIN_B, 'r')},
    'fin-a-l-far': {'size': (1344, 768), 'pos': fin_far(FIN_A, 'l')},
    'fin-a-r-far': {'size': (1344, 768), 'pos': fin_far(FIN_A, 'r')},
    'fin-b-l-far': {'size': (1344, 768), 'pos': fin_far(FIN_B, 'l')},
    'fin-b-r-far': {'size': (1344, 768), 'pos': fin_far(FIN_B, 'r')},
    'back': {'size': (1344, 768), 'pos': BACK},
    'fin-a-l-near2': {'size': (1344, 768), 'pos': fin_near(FIN_A2 + LIMB, 'l')},
    **{f'fin-b-{sd}-near2': {'size': (1344, 768), 'pos': fin_near(FIN_B2 + LIMB, sd)} for sd in 'lr'},
    **{f'fin-{o}-{sd}-far2': {'size': (1344, 768), 'pos': fin_far2(F, sd)} for o, F in (('a', FIN_A), ('b', FIN_B)) for sd in 'lr'},
    'genais-a': {'size': (1344, 768), 'pos': GENAIS_A},
    'genais-a-shelled': {'size': (1344, 768), 'pos': GENAIS_A_SHELL},
    'genais-b': {'size': (1344, 768), 'pos': GENAIS_B},
    'genais-b-shelled': {'size': (1344, 768), 'pos': GENAIS_B_SHELL},
    'genais-a2': {'size': (1344, 768), 'pos': GENAIS_A2},
    'genais-b2': {'size': (1344, 768), 'pos': GENAIS_B2},
    'genais-a2-shelled': {'size': (1344, 768), 'pos': GENAIS_A2_SHELL},
    'genais-b2-shelled': {'size': (1344, 768), 'pos': GENAIS_B2_SHELL},
    'bk-a': {'size': (1344, 768), 'pos': BK_A, 'neg': BK_NEG},
    'bk-b': {'size': (1344, 768), 'pos': BK_B, 'neg': BK_NEG},
    'bk-city-a': {'size': (1344, 768), 'pos': BK_CITY_A},
    'bk-city-b': {'size': (1344, 768), 'pos': BK_CITY_B},
    # v2 after LOOKING at pass 6 (the city stood level with the ship, a palace beside it): small, low, far below
    'bk-city-a2': {'size': (1344, 768), 'pos': BK_CITY_A.replace(' No creature', ' The city is tiny with distance, seen from high above, far below the ship and the clouds. No creature')},
    'bk-city-b2': {'size': (1344, 768), 'pos': BK_CITY_B.replace(' No creature', ' The city is tiny with distance, seen from high above, far below the ship and the clouds. No creature')},
}
