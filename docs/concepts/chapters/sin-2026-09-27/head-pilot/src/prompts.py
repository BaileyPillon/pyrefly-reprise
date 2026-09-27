"""Sin head pilot prompts (FFX only, 2026-09-27). Written descriptions only (see sketch.py for the two
sources): a whale-like colossus with scales, a ruined city carried near the back of its head, feathery
wings purple at the tips, risen over the white holy city at evenfall, the ship's deck in the foreground,
a mouth that opens in stages. No character tag for Sin is used, so the model draws from the words,
not from a remembered likeness. House finish: animagine-xl-4.0-opt with the backdrop blocks of
tools/gen/comfy.mjs (the Evrae deck's own prompt words)."""

Q = 'detailed background, painterly, cinematic lighting, wide shot, official art, vibrant colors, highly detailed, masterpiece, high score, great score, absurdres'
BASE = ('no humans, scenery, final fantasy x, fantasy, view from the open deck of a flying airship, '
        '(flat steel airship deck floor with metal plates in the foreground:1.2), guard rail, (colossal monster:1.3), kaiju, '
        'giant ancient sea leviathan, (whale-like monster head:1.2), wide flat snout, rough dark grey scales like rock, heavy brow ridge, '
        'ruined stone buildings and spires growing from the top of its head')
NEG = ('lowres, bad anatomy, text, error, cropped, worst quality, low quality, low score, bad score, average score, '
       'jpeg artifacts, signature, watermark, username, blurry, artist name, multiple views, logo, letters, '
       '1girl, 1boy, character, people, person, human, dragon, frog, fish eyes, cute, cartoon, chibi, toy, '
       'flat color, posterized, 3d render, plastic, simple background, flowers, flower field, grass, bridge, aqueduct, bird, beak, crow, owl, tentacles')

OPT = {
    'A': ('front view, symmetrical, the monster face looking at the viewer, '
          '(huge feathered wings spread wide on both sides with purple tips:1.2), '
          'its chin resting on a tall white tower, a white holy city with many towers and blue banners on the horizon, '
          'sunset, (warm orange sunlight on its face:1.1), pink and violet sky, '
          '(wide mouth half open, rows of pale teeth, violet light glowing inside the mouth:1.2), small glowing yellow eyes'),
    'B': ('(extreme close-up of a gigantic monster face:1.3), the face fills the whole sky and runs past the edges of the picture, '
          'looming over the airship, from below, (enormous wide mouth half open across the picture, rows of pale teeth:1.3), '
          '(violet gravity light glowing inside the mouth:1.2), two glowing yellow eyes at the top, '
          'twilight, deep blue and violet sky, cold light, tiny white city towers far below'),
    'C': ('three-quarter view, the monster head turned to the left towards the airship, long heavy jaws, '
          '(huge clawed arm gripping a tall white tower:1.2), (huge feathered wings raised behind it with purple tips:1.2), '
          'a white holy city with many towers and blue banners below, golden hour, warm sunlight from the left, '
          '(jaws half open, rows of pale teeth, violet light glowing inside the mouth:1.2), glowing yellow eye'),
    'D': ('front view, symmetrical, (silhouette:1.2), (backlighting:1.3), the setting sun directly behind the monster head, '
          'glowing orange rim light around its outline, the head almost black against the sky, '
          '(huge feathered wings spread wide, glowing purple at the tips:1.2), '
          '(wide mouth half open, violet light glowing inside the mouth:1.3), two glowing eyes, '
          'dark city towers on the horizon, orange and violet sky, dramatic'),
}

# pass 2 (after LOOKING at pass 1): the deck became a viaduct and a field of violets in A, the head a beak;
# stronger deck words, a whale head, and flowers, bird and beak banned. Pass 1 prompts are in each p1.prov.json.
PROMPTS = {}
for k, words in OPT.items():
    PROMPTS[f'sin-{k}'] = {'size': (1344, 768), 'pos': f'{BASE}, {words}, {Q}', 'neg': NEG}

# mouth stages of the picked C painting (stages.py): the same words with the mouth phrase changed, for the heal pass
_mouth_C = '(jaws half open, rows of pale teeth, violet light glowing inside the mouth:1.2)'
PROMPTS['sin-C-shut'] = {**PROMPTS['sin-C'], 'pos': PROMPTS['sin-C']['pos'].replace(_mouth_C, '(jaws closed, rows of pale teeth meeting:1.2), faint violet light between the teeth')}
PROMPTS['sin-C-open'] = {**PROMPTS['sin-C'], 'pos': PROMPTS['sin-C']['pos'].replace(_mouth_C, '(jaws wide open, rows of pale teeth, bright violet light glowing deep inside the mouth:1.3)')}
