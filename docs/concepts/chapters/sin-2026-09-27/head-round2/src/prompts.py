"""Sin's head, round 2 prompts (FFX only, 2026-09-27). Written descriptions only: no character tag for Sin, no
game or franchise name for the creature, so the model draws from the words and our sketch.
  s0      natural language for z-image, the whole scene with the mouth SHUT (stage 0)
  s1..s4  the same scene words with the mouth at that stage, for the masked repaint of the mouth region
  <key>-tag  tag style for animagine-xl-4.0-opt (the house checkpoint), for an optional light finish
"""

SCENE = ('A painterly anime fantasy background painting, a cinematic matte painting with visible brushwork, golden hour. '
         'The view is from the grey steel foredeck of an ancient airship flying high in the sky: riveted steel deck plates with seams running '
         'to the pointed bow, a pale stencilled plate across the keel, a round gold dial set into the plating on the right, thin dark metal '
         'railings along both edges, and beyond the bow only a long drop. Far, far below lies a vast white holy city of tiered towers and '
         'blue roofs, hazy with distance. One tall white tower with gold bands rises from the city on the right. '
         'Level with the ship, nose to nose with it, a colossal living whale-like monster props itself on that tower: its massive scaled arm '
         'reaches down from under its neck and its hooked claws clamp around the top of the white tower. Its long blunt whale-like head is seen '
         'in three-quarter view, turned to the left towards the ship: rough dark slate-grey scales like stone plates, a heavy brow ridge over '
         'one small glowing amber eye, a blunt snout, pleated grooves under the long lower jaw, ruined stone buildings standing on the back of '
         'its head. Huge feathered wings rise behind its neck, dark grey feathers with vivid purple tips. It is an organic creature: no pipes, '
         'no machinery on the monster. Warm low sunlight from the left lights the snout and the brow; a soft orange, pink and blue evening sky. '
         'No people. ')

MOUTH = [
    'Its long jaws are firmly shut: the lips pressed together in one tight closed line along the whole length of the jaw, only the tips of '
    'the pale upper fangs overlapping the lower lip, a thin faint violet glint along the seam. The mouth is closed.',
    'Its jaws have just begun to part: a narrow dark gap between the upper and lower jaws, wider at the front, with rows of pale fangs '
    'on both jaws and a violet glow deep in the throat.',
    'Its mouth is half open: the long lower jaw hangs down from the hinge, a dark red-violet mouth with rows of pale fangs on the upper '
    'and lower jaws, a tongue, and a bright violet light glowing deep in the throat.',
    'Its mouth is wide open: the long lower jaw drops far down from the hinge, a cavernous dark mouth with rows of pale fangs on both '
    'jaws, a tongue, and an intense violet light blazing deep in the throat and lighting the inside of the jaws.',
    'Its mouth is gaping fully open, the long lower jaw dropped as far as it goes: an enormous cavernous maw big enough to swallow the '
    'airship, rows of pale fangs on both jaws, and a blinding violet light blazing from deep in the throat, spilling violet light over '
    'the teeth and lips.',
]

PROMPTS = {f's{k}': {'size': (1344, 768), 'pos': SCENE + MOUTH[k], 'neg': ''} for k in range(5)}

# v2 (after LOOKING at pass 1: the hide came out as a smooth humpback whale): the same scene, a rock-scaled monster
SCENE_V2 = SCENE.replace('rough dark slate-grey scales like stone plates,',
                         'a craggy hide of overlapping dark slate-grey armour plates and scales like weathered rock, a jagged ridge of short '
                         'stone spikes along the top of the snout and the brow, it is a monstrous ancient leviathan and not an ordinary whale,')
for k in range(5):
    PROMPTS[f's{k}v2'] = {'size': (1344, 768), 'pos': SCENE_V2 + MOUTH[k], 'neg': ''}

TAG_Q = 'detailed background, painterly, cinematic lighting, wide shot, official art, vibrant colors, highly detailed, masterpiece, high score, great score, absurdres'
TAG_NEG = ('lowres, bad anatomy, text, error, cropped, worst quality, low quality, low score, bad score, average score, jpeg artifacts, '
           'signature, watermark, username, blurry, artist name, multiple views, logo, 1girl, 1boy, character, people, person, human, '
           'dragon, bird, beak, cute, cartoon, chibi, toy, flat color, posterized, 3d render, plastic, wooden deck, planks, tentacles, lava, fire')
TAG_SCENE = ('no humans, scenery, fantasy, (view from the steel bow of a flying airship:1.2), grey metal deck plates with rivets, metal railings, '
             'round gold dial on the deck, (a vast white city far below:1.2), aerial view, (colossal monster:1.3), giant whale-like monster head, '
             'three-quarter view, rough dark grey scales like stone plates, heavy brow ridge, one glowing amber eye, ruined buildings on its head, '
             '(huge feathered wings with purple tips:1.2), (clawed hand gripping the top of a tall white tower with gold bands:1.2), golden hour, '
             'warm sunlight from the left')
TAG_MOUTH = ['(mouth closed:1.3), closed jaws, fang tips', 'slightly open mouth, fangs, violet glow in the throat',
             'open mouth, fangs, violet glow in the throat', '(open mouth:1.2), fangs, violet light in the throat',
             '(wide open mouth:1.3), huge maw, fangs, (violet light blazing from the throat:1.2)']
for k in range(5):
    PROMPTS[f's{k}-tag'] = {'size': (1344, 768), 'pos': f'{TAG_SCENE}, {TAG_MOUTH[k]}, {TAG_Q}', 'neg': TAG_NEG}
