"""Hi-fi round prompts: written canon only (FF Wiki revids in party-right-sketch.py; Guard Scorpion as in
../../round2/README.md). The party faces screen-RIGHT, Guard Scorpion faces screen-LEFT (Bailey,
2026-09-27). Three directions: house (animagine, the FFX paintings' finish), keyart (Z-Image Turbo,
painterly semi-real), film (FLUX.2 Klein 9B, high-detail anime feature film). Backgrounds are a plain
dark grey so the cut-out edge carries no pale fringe onto the dark reactor."""

HOUSE_STYLE = 'official art, cel shading, soft shading, vibrant colors, rim lighting, (soft green rim light from the right:1.15), colorful, highly detailed, intricate details, detailed face, sharp focus'
HOUSE_Q = 'masterpiece, high score, great score, absurdres'
HOUSE_NEG = ('lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, worst quality, low quality, '
             'low score, bad score, average score, jpeg artifacts, signature, watermark, username, blurry, artist name, multiple views, '
             '2boys, white background, halo, white outline, aura, sparks, particles, smoke, motion lines, speed lines, debris, floating objects, '
             'chibi, big head, flat color, posterized, plastic, 3d render, toy')

CLOUD_T = ('1boy, cloud strife, final fantasy vii, safe, solo, male focus, full body, standing, spiky blonde hair, blue eyes, '
           'sleeveless dark indigo turtleneck shirt, (single metal pauldron on the far shoulder only:1.2), (bare near shoulder:1.1), '
           'two brown leather belts crossed at the waist, dark indigo baggy pants, brown boots, brown gloves, '
           'gear-shaped metal armlet on the far forearm, white wristband on the near wrist, buster sword, (huge broadsword:1.2), wide heavy blade, '
           'holding the huge broadsword in both hands, blade angled down in front, fighting stance, stoic, '
           '(from side:1.2), (three-quarter view:1.2), body facing right, looking to the right')
BARRET_T = ('1boy, barret wallace, final fantasy vii, safe, solo, male focus, full body, standing, dark-skinned male, very muscular, large heavy-set build, '
            'tall hi-top fade, thick black beard, scars on cheek, (gun arm:1.25), (near forearm replaced by a mechanical six-barrel gatling gun:1.25), '
            'gun arm aimed forward to the right, open dirty brown leather vest, bare chest, two dog tags on a chain, bare muscular arms, '
            'metal bands on the far forearm, clenched fist, metal bands around the waist, olive green pants, large brown boots, fighting stance, determined, '
            '(from side:1.2), (three-quarter view:1.2), body facing right, looking to the right')
GS_T = ('no humans, robot, mecha, (mechanical scorpion:1.3), giant security robot, final fantasy vii, heavy and imposing boss, (huge bulky armored body:1.2), '
        'massive red armored shell, six thick mechanical legs planted wide, (segmented scorpion tail raised high over its body:1.2), '
        '(laser cannon at the tail tip:1.3), (big round glowing cyan lens on the tail tip:1.2), twin rifle barrels under the head, '
        'head with one round glowing sensor eye, red armor panels with dark grey steel joints and hydraulic pistons, cables, bolts, '
        'weathered paint, detailed mechanical parts, (red armor:1.2), from side, facing left')
SUB_NEG = {'cloud': ', pauldron on both shoulders, two pauldrons, shoulder armor on the near shoulder, holding two swords, katana',
           'barret': ', sunglasses, holding gun, holding weapon, gun in hand, two guns, weapon on back, gun on back, mohawk, shirt, gloves, belt buckle, strap',
           'gs': ', 1girl, 1boy, human, person, pilot, cockpit, humanoid, bipedal, arms, hands, real scorpion, insect, animal, building, floor, stinger, blade, spike, claw, text'}

KA_STYLE = ('Painterly semi-realistic fantasy key art, an original digital oil painting with visible confident brushwork, '
            'richly rendered materials (brushed and scuffed steel, worn oiled leather, heavy woven cloth), cinematic lighting: '
            'a warm key light from the front and a soft green rim light from the right edge, subtle bounce light, high detail, '
            'sharp focus on the face and hands. Full body, the whole figure in frame, feet visible, standing on nothing, '
            'isolated on a plain flat dark grey studio background with no floor, no shadow, no text, no border.')
FILM_STYLE = ('Redraw this rough colour layout sketch as a finished high-detail anime feature film key frame of the same figure in the same pose, '
              'same facing, same placement and same proportions. Crisp clean lineart, rich multi-tone cel shading with soft gradients, '
              'detailed textures, dramatic cinematic lighting: a strong green rim light from the right and warm highlights, glossy specular '
              'accents on metal, beautiful detailed eyes. Full body, the whole figure in frame, feet visible. Keep the flat dark grey '
              'background plain and empty: no floor, no shadow, no effects, no text.')

CLOUD_W = ('Cloud Strife from Final Fantasy VII (original 1997 design, not the Remake): a young swordsman with spiky blond hair and blue eyes, '
           'a sleeveless dark indigo knit turtleneck shirt, exactly ONE small metal pauldron, worn only on his LEFT shoulder (the far shoulder, away from the viewer); '
           'his RIGHT shoulder, nearest the viewer, is completely bare skin with no armour and no strap, two brown leather belts crossed at the hips, baggy dark indigo trousers, brown boots, '
           'brown gloves, a gear-shaped metal armlet on his left forearm and a white wristband on his right wrist. He holds the Buster Sword, '
           'a huge broad single-edged broadsword with a wide heavy blade, low in front of him in both hands, blade angled down toward the right. '
           'He stands in a three-quarter view facing to the right, his right side toward the viewer, calm and ready.')
BARRET_W = ('Barret Wallace from Final Fantasy VII (original 1997 design, not the Remake, no sunglasses): a huge heavy-set muscular dark-skinned man '
            'with a tall hi-top fade haircut, a thick black beard and three small scars on his right cheek. His RIGHT forearm, the arm nearest the viewer, '
            'is replaced below the elbow by a grafted mechanical six-barrel gatling gun arm with no hand, aimed forward to the right. His left arm, the far '
            'arm, is bare and muscular with metal bands on the forearm and a clenched fist. Open dirty brown leather vest over a bare chest, two dog tags '
            'on a chain, several metal bands around his waist, olive green trousers, large brown boots. He stands in a three-quarter view facing to the '
            'right, his right side toward the viewer, fierce and determined.')
GS_W = ('Guard Scorpion, an original design of a giant red quadruped security robot shaped like a mechanical scorpion: a massive bulky red armoured '
        'shell with dark grey steel joints, hydraulic pistons, cables and bolts, six thick mechanical legs planted wide, a head with one round '
        'glowing sensor eye, twin rifle barrels under the head, and a long segmented tail raised high over its back ending in a laser emitter '
        'with a big round glowing cyan lens. Weathered paint, scuffs and oil. It faces to the LEFT, side view, looming and heavy, a boss.')

PROMPTS = {}
for sub, tags, words, size in (('cloud', CLOUD_T, CLOUD_W, (832, 1216)), ('barret', BARRET_T, BARRET_W, (832, 1216)), ('gs', GS_T, GS_W, (1216, 832))):
    PROMPTS[f'house-{sub}'] = {'size': size, 'pos': f'{tags}, {HOUSE_STYLE}, simple background, grey background, {HOUSE_Q}', 'neg': HOUSE_NEG + SUB_NEG[sub]}
    zsize = (1024, 1536) if size[0] < size[1] else (1536, 1024)
    PROMPTS[f'keyart-{sub}'] = {'size': zsize, 'pos': f'{words} {KA_STYLE}'}
    PROMPTS[f'film-{sub}'] = {'size': zsize, 'pos': f'{FILM_STYLE} The figure: {words}'}

# Backdrops (hi-fi round): the reactor core seen from a raised camera, one per direction, from core-sketch.py.
CORE_T = ('no humans, scenery, indoors, interior of a giant mako reactor core chamber, final fantasy vii, industrial, '
          '(wide round metal grated platform floor in the foreground:1.2), massive glowing green energy column in the center background, '
          'green mako glow, steel pipes and cables on the walls, catwalks, railings, amber warning lamps, steam, dark metal, '
          'high angle, wide shot, detailed background, cinematic lighting, volumetric light, depth of field')
CORE_NEG = ('lowres, worst quality, low quality, low score, bad score, text, signature, watermark, username, blurry, jpeg artifacts, '
            '1girl, 1boy, character, people, person, human, robot, creature, monster, vehicle, window, sky, outdoors')
CORE_W = ('The interior of a vast industrial mako reactor core chamber, seen from a raised camera: a wide round steel grated platform floor '
          'fills the lower half of the picture, empty and clean, ready for a battle; in the centre background a massive column of glowing '
          'green liquid energy rises through heavy steel rings into a dark domed ceiling; pipes, cables, catwalks and railings on the dark walls, '
          'small amber warning lamps, drifting steam, green light spilling across the floor. No people, no creatures, no text.')
PROMPTS['house-core'] = {'size': (1344, 768), 'pos': f'{CORE_T}, official art, vibrant colors, highly detailed, masterpiece, high score, great score, absurdres', 'neg': CORE_NEG}
PROMPTS['keyart-core'] = {'size': (1536, 864), 'pos': CORE_W + ' Painterly semi-realistic concept art, an original digital oil painting with confident brushwork, rich materials, cinematic volumetric lighting, high detail.'}
PROMPTS['film-core'] = {'size': (1536, 864), 'pos': 'Redraw this rough colour layout sketch as a finished high-detail anime feature film background painting with the same layout and camera. ' + CORE_W + ' Crisp detail, rich cel-painted lighting, glowing green bloom, dramatic contrast.'}

# Film Cloud, third try (after LOOKING at p1/p2: den 1 from the sketch gave two pauldrons, den 0.8 a toy look):
# FLUX.2 Klein edit mode with OUR OWN house render (house/cloud/p1.full.png, single pauldron on the far shoulder)
# as the reference, so the costume layout carries over and only the rendering changes.
PROMPTS['film-cloud-ref'] = {'size': (1024, 1536), 'pos': (
    'Redraw this picture as a finished high-detail anime feature film key frame of the same young man in exactly the same pose, '
    'same facing, same placement, same proportions and the same costume. Keep exactly ONE metal pauldron, on the shoulder farther from the viewer, '
    'exactly where it is; the near shoulder stays bare. Remove the extra sword hilt sticking up behind his head: he carries only the one huge '
    'broadsword in his hands. Make the wristband on his near wrist white. Crisp clean lineart, rich multi-tone cel shading with soft gradients, '
    'detailed textures on the knit shirt, leather straps and steel, dramatic cinematic lighting: a strong green rim light from the right and warm '
    'highlights, glossy specular accents on metal, beautiful detailed blue eyes. Full body, feet visible. Keep the flat dark grey background plain '
    'and empty: no floor, no shadow, no effects, no text. The figure: ' + CLOUD_W)}
