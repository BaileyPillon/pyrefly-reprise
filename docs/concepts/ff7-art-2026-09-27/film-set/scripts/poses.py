"""Film set prompts: written canon only (FF Wiki revids in ../../hifi/scripts/party-right-sketch.py and
research/ff7-battle-staging.md; Guard Scorpion as in ../../round2/README.md and research/ff7-guard-scorpion.md).
Staging (Bailey, 2026-09-27): the party stands LEFT facing screen-RIGHT, Guard Scorpion RIGHT facing screen-LEFT.
A figure facing screen-right shows its RIGHT side: Barret's gun-arm (his RIGHT arm) is the NEAR arm, Cloud's
single pauldron (LEFT shoulder) is on the FAR side. Nothing is mirrored.

Victory poses: FF Wiki "Final Fantasy VII victory poses" (read 2026-09-27, text only, as cited in
../../../ff7-options-2026-09-27/README.md): Cloud "pumps his fist twice, spins his sword in one hand, and then
places it on his back"; Barret "squats, stands and punches the air with his normal hand" (his LEFT hand; the
right is the gun-arm). Attack keys follow the B1 blocking (options sheet 5), turned to face right.

Usage: python poses.py <subject> <pose> <out-stem> <seed> [den] [ref ...]
  runs gen2.py with the job; the default reference is the subject's Film idle pick."""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PY = 'D:/Tools/ComfyUI/python_embeded/python.exe'
HIFI = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi/film'

LIGHT = ('Finished high-detail anime feature film key frame: crisp clean lineart, rich multi-tone cel shading with soft gradients, '
         'detailed textures, glossy specular accents on metal, beautiful detailed eyes. Lighting: a warm key light from the front and a '
         'green rim light ONLY along the edges that face the RIGHT side of the picture. The edges that face the LEFT side of the picture '
         'have NO rim light at all: no green or cyan edge, no glow, no outline colour there, just the dark ink line and a shadowed edge. ')
BG = ('Full body, the whole figure in frame with a margin, feet visible. The background is a plain flat dark grey, empty: no floor, '
      'no cast shadow, no effects, no motion lines, no speed lines, no sparks, no smoke, no text.')
SAME = ('Image 1 is our character. Draw the SAME character: the same face, hair, costume, colours, proportions, art style and the same '
        'size in the frame, not mirrored and not flipped. ')

CLOUD = ('Cloud Strife from Final Fantasy VII (original 1997 design, not the Remake): a young swordsman with spiky blond hair and blue eyes, '
         'a sleeveless dark indigo knit turtleneck shirt with a high rolled collar, exactly ONE small metal pauldron, worn only on his LEFT '
         'shoulder, the far shoulder; his RIGHT shoulder, nearest the viewer, is bare skin with no armour. In the picture the pauldron is on '
         'the shoulder toward the RIGHT side of the picture and the bare shoulder is toward the LEFT side. Two brown leather belts crossed at '
         'the hips, baggy dark indigo trousers, brown boots, brown fingerless gloves. A white cloth SOLDIER wristband on his RIGHT wrist, the '
         'wrist of the arm nearer the viewer. His LEFT wrist has only the brown glove: no metal cuff, no bracelet, no gear on either wrist or glove. '
         'His sword is the Buster Sword: a huge broad single-edged broadsword with a wide heavy steel blade and a round fitting at the hilt. ')
BARRET = ('Barret Wallace from Final Fantasy VII (original 1997 design, not the Remake, no sunglasses): a huge heavy-set muscular dark-skinned '
          'man with a tall hi-top fade haircut, a thick black beard and small scars on his right cheek. His RIGHT forearm, the arm nearest the '
          'viewer, is replaced below the elbow by a grafted mechanical six-barrel gatling gun arm with no hand: the gun IS his forearm, nothing holds it. In the picture the gun-arm is the arm on the side nearer the viewer, toward the LEFT of the picture and in front of his body. His LEFT arm, the far arm, is '
          'bare and muscular with metal bands on the forearm and a normal hand. Open dirty brown leather vest over a bare chest, two dog tags '
          'on a chain. Around his waist: three plain steel bands, like metal hoops, and NO belt and NO belt buckle. Olive green trousers, large '
          'brown boots. ')
GS = ('Guard Scorpion, a giant red quadruped security robot shaped like a mechanical scorpion: a massive bulky red armoured shell with dark '
      'grey steel joints, hydraulic pistons, cables and bolts, six thick mechanical legs, a head with one round glowing cyan sensor eye, twin '
      'rifle barrels under the head, a disc housing on its back, and a long segmented red tail ending in a laser emitter with a big round '
      'glowing cyan lens. Weathered paint, scuffs and oil. ')
GS_LIGHT = ('Finished high-detail anime feature film key frame: crisp clean lineart, rich multi-tone cel shading, glossy specular accents '
            'on the metal, neutral warm studio light with no coloured rim light and no green tint on the red armour. It faces to the LEFT '
            'of the picture, side view (not mirrored). Whole machine in frame with a margin. The background is a plain flat dark grey, empty: '
            'no floor, no ground, no cast shadow, no shadow patch under it, no effects, no beam, no text.')

FACE_R = 'He faces to the RIGHT of the picture in three-quarter view, his right side toward the viewer. '
P = {
 ('cloud', 'idle'): 'Keep exactly the same pose: standing calm and ready, the Buster Sword held low in front of him in both hands, blade angled down toward the right. Fix only the costume details named above and the lighting.',
 ('cloud', 'windup'): 'Attack wind-up: both hands on the hilt, he has raised the Buster Sword above his head and drawn it BACK: the huge blade points up and backward toward the LEFT side of the picture, behind his head, ready to swing forward to the right. Weight on his back (left) foot, front knee bent, eyes on an enemy to the right. His raised near arm is bare skin with no armour and no elbow guard; the single pauldron stays on the far shoulder, partly hidden.',
 ('cloud', 'strike'): 'Attack strike: a deep forward lunge toward the right, front knee bent, back leg straight; he swings the Buster Sword forward in both hands and the huge blade is extended straight out to the RIGHT at chest height, level with the ground, in the moment of impact. Fierce expression.',
 ('cloud', 'follow'): 'Attack follow-through: the swing has finished; he is crouched low and twisted forward toward the right, both hands on the hilt, the blade swept down so its tip points to the lower LEFT near the floor beside his back foot. Hair and clothes settling.',
 ('cloud', 'fistpump'): 'Victory fist pump: standing tall, he pumps his RIGHT fist (the near hand) up to head height with the elbow bent, a small confident smile; his LEFT hand holds the Buster Sword loosely at his side with the blade pointing straight down to the floor.',
 ('cloud', 'spin'): 'Victory sword spin: standing relaxed, he twirls the Buster Sword with his RIGHT hand alone, that arm raised up beside his head, the blade caught mid-spin pointing up and back over his head; his left hand hangs relaxed at his side, empty. There is exactly ONE sword in the whole picture and nothing on his back. Calm, cool expression. No motion blur.',
 ('cloud', 'back'): 'Victory, sword onto his back: standing upright and relaxed, he reaches over his RIGHT shoulder with his right hand holding the hilt and settles the Buster Sword onto his back, the huge blade lying diagonally across his back, its tip down behind his left hip; left arm at his side, cool look toward the right.',
 ('cloud', 'hurt'): 'Hurt flinch: struck hard from the right, he is knocked back off balance: his whole body leans back toward the LEFT of the picture, torso tilted back, head snapped back and turned down with eyes squeezed shut, gritting his teeth, front foot lifting, knees buckling; he still grips the Buster Sword in both hands, its blade dragged low behind him toward the lower LEFT. Exactly ONE sword.',
 ('barret', 'idle'): 'Keep exactly the same pose: standing in a fighting stance, the gun-arm aimed forward to the right at waist height, left fist clenched. Fix only the waist and the lighting.',
 ('barret', 'aim'): 'Aiming: feet planted wide, he raises the gun-arm (his near RIGHT forearm, grafted, no hand) to shoulder height and aims it straight forward to the RIGHT, level, sighting along it with a fierce glare; his LEFT arm is a bare arm with a clenched fist pulled back at his side, not touching the gun.',
 ('barret', 'fire'): 'Firing: the gun-arm is aimed straight forward to the RIGHT at shoulder height, recoil kicks it slightly upward and pushes his shoulders back, mouth wide open shouting, left fist clenched at his side, legs braced. Do NOT draw any muzzle flash, fire, smoke or bullets.',
 ('barret', 'squat'): 'Victory squat: he squats down low with his knees bent wide and his weight on his heels, torso upright, the gun-arm resting across his knee pointing down and forward, left fist on his thigh, grinning, gathering himself to spring up.',
 ('barret', 'punch'): 'Victory air punch: standing tall, head tipped back shouting in triumph. The gun-arm, his near RIGHT arm toward the LEFT of the picture, hangs straight down at his side, the barrels pointing at the floor; that arm ends in the gun, there is no hand at its end or anywhere beside it. His LEFT arm, the far arm toward the RIGHT of the picture, punches straight up above his head with a bare clenched fist (his normal hand). Three plain steel bands around his waist, no belt.',
 ('barret', 'hurt'): 'Hurt flinch: hit hard from the right, he recoils backward toward the left, torso bent back, the gun-arm dropped low, left hand clutching his chest, grimacing with his eyes squeezed shut, knees bent.',
 ('gs', 'idle'): 'Tail LOWERED: the segmented tail trails out behind the body to the right and rests low, about the height of its back, curving gently up only at the end, the lens pointing up and back; legs planted wide, head level, the sensor eye glowing.',
 ('gs', 'raised'): 'Tail RAISED: the segmented tail is raised high and arched forward over its back, the laser lens at the tip aimed forward and down toward the LEFT, glowing bright cyan; legs braced wide, head raised a little.',
 ('gs', 'recoil'): 'Hit recoil: struck hard on its head from the left, the whole machine is knocked back: its body is tilted back about fifteen degrees with the head end lifted high, the two front pairs of legs lifted off the ground and splayed, the rear legs braced and bent, the sensor eye flaring, the lowered tail swinging out behind it to the right. Every part stays attached; no debris, no sparks, no smoke, no separate pieces.',
}
SIZE = {'cloud': (1024, 1536), 'barret': (1024, 1536), 'gs': (1536, 1024)}
WIDE = {('cloud', 'strike'): (1280, 1280), ('cloud', 'follow'): (1280, 1280), ('cloud', 'windup'): (1152, 1408),
        ('cloud', 'spin'): (1152, 1408), ('barret', 'aim'): (1152, 1408), ('barret', 'fire'): (1152, 1408)}
IDLE = {'cloud': f'{HIFI}/cloud/p4.full.png', 'barret': f'{HIFI}/barret/p1.full.png', 'gs': f'{HIFI}/gs/p1.full.png'}


EDIT = {
 ('cloud', 'fix'): ('Edit this picture. 1) Remove the green and cyan rim light along every edge of the figure that faces the LEFT side of the picture '
                    '(his back, the back of his hair, arm, trousers and boots): those edges become a plain dark ink outline with a normal shadowed '
                    'edge, no coloured glow. Keep the green rim on the edges that face the right. 2) On the arm on the RIGHT side of the picture only, '
                    'the silver metal cuff at the wrist becomes the plain brown leather cuff of his glove; a slim gear-shaped metal ring armlet sits '
                    'higher up on that same forearm, near the elbow. Add nothing to the other arm or glove: the near wrist keeps only its white band. 3) Make the background a plain flat dark grey with no green glow. Keep everything else exactly the '
                    'same: pose, face, blue eyes, hair, the single pauldron exactly where it is, the white wristband, belts, sword, colours, size and framing, '
                    'and the same rich multi-tone cel shading, glossy specular highlights on the steel and warm key light.'),
 ('barret', 'aimfire'): ('Edit this picture. Change only his face and the moment: he is now AIMING, not firing: mouth closed, jaw set, a fierce narrowed '
                         'glare along the gun-arm, shoulders square and steady, the gun-arm held level, pointing straight forward to the right. '
                         'Keep everything else exactly the same: body, stance, legs, the grafted gun-arm, his clenched left fist, steel waist '
                         'bands, costume, colours, size, framing, lighting and the plain dark grey background.'),
 ('gs', 'lower'): ('Edit this picture. Lower the tail: the same segmented red tail now trails straight back from the rear of the body to '
                   'the RIGHT, held low, about level with the top of the legs, curving gently upward only near its end. The laser emitter with its big '
                   'round glowing cyan lens stays at the very TIP of the tail (the last segment), pointing back and up to the right, below the top of the '
                   'shell; there is only one lens on the tail and nothing floating in the air. Nothing of the tail is above the body. Keep everything else '
                   'exactly the same: the body, shell, head, sensor eye, twin rifles, the six legs, the flat round disc housing on its back, colours, '
                   'size, facing left, and the plain dark grey background with no floor shadow.'),
 ('barret', 'fix'): ('Edit this picture. 1) Remove the green and cyan rim light along every edge of the figure that faces the LEFT side of the '
                     'picture (his back, shoulder, arm, the back of his head, trousers and boots): those edges become a plain dark ink outline with a '
                     'normal shadowed edge, no coloured glow. Keep the green rim on the edges that face the right. 2) Replace the leather belt and '
                     'its buckle with three plain steel bands around his waist, like metal hoops, no buckle. 3) Make the background a plain flat dark '
                     'grey with no green glow. Keep everything else exactly the same: pose, face, hair, beard, gun-arm, vest, dog tags, skin tone, colours, '
                     'size and framing, and the same rich multi-tone cel shading, glossy specular highlights on the steel and warm key light.'),
}


def prompt(sub, pose):
    if (sub, pose) in EDIT:
        return EDIT[(sub, pose)]
    if sub == 'gs':
        return f'{SAME.replace("our character", "our machine").replace("same face, hair, costume", "same shell, legs, head, rifles, disc, tail")}The machine: {GS}{P[(sub, pose)]} {GS_LIGHT}'
    who = CLOUD if sub == 'cloud' else BARRET
    return f'{SAME}The character: {who}{FACE_R}{P[(sub, pose)]} {LIGHT}{BG}'


if __name__ == '__main__':
    sub, pose, out, seed = sys.argv[1:5]
    den = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
    refs = sys.argv[6:] or [IDLE[sub]]
    job = {'refs': refs, 'out': out, 'seed': int(seed), 'size': list(WIDE.get((sub, pose), SIZE[sub])), 'den': den,
           'hires': 1.5, 'hden': 0.35, 'pos': prompt(sub, pose), 'key': f'film-{sub}-{pose}'}
    os.makedirs(os.path.dirname(out), exist_ok=True)
    jp = out + '.job.json'
    json.dump(job, open(jp, 'w'), indent=1)
    r = subprocess.run([PY, '-s', os.path.join(HERE, 'gen2.py'), jp], capture_output=True, text=True)
    print((r.stdout + r.stderr)[-600:])
    sys.exit(r.returncode)
