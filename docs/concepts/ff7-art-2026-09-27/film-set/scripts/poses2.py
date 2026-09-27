"""Film set, repair round: the poses the judge failed that need a NEW render (Cloud wind-up and sword spin; Barret aim),
and the edit that makes the fire from the aim. Written canon only (as poses.py). Changes from poses.py:
  - the identity reference is our FIXED idle cut-out on a flat grey (no back rim, correct wrists and waist), not the
    hi-fi pick, so the renders start from the corrected costume;
  - the wrists are named by the shoulder they hang from (the judge: the band ended on the arm from under the pauldron);
  - the rim light is a thin line only, so the clothes keep their own colours (the judge: green tint on the front);
  - Barret: the idle's face (no scars) and a taller canvas so the boots are whole (the judge: feet clipped).
Usage: python poses2.py <subject> <pose> <out-stem> <seed> [den] [ref ...]"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PY = 'D:/Tools/ComfyUI/python_embeded/python.exe'
REF = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/_refs'
IDLE = {'cloud': f'{REF}/cloud-idle-p4x-flat.png', 'barret': f'{REF}/barret-idle-p1-flat.png'}

LIGHT = ('Finished high-detail anime feature film key frame: crisp clean lineart, rich multi-tone cel shading with soft gradients, '
         'detailed textures, glossy specular accents on metal, beautiful detailed eyes. Lighting: a warm key light from the front; the '
         'clothes, skin and steel keep their own natural colours with no green or cyan tint anywhere. At most a thin pale rim line on '
         'the edges that face the RIGHT side of the picture. The edges that face the LEFT side of the picture have NO rim light: just the '
         'dark ink line and a shadowed edge. ')
BG = ('Full body, the whole figure in frame with a wide margin on every side, both boots and their soles fully visible above the '
      'bottom edge. The background is a plain flat dark grey, empty: no floor, no cast shadow, no effects, no motion lines, no text.')
SAME = ('Image 1 is our character. Draw the SAME character: the same face, hair, costume, colours, proportions, art style and the same '
        'size in the frame, not mirrored and not flipped. ')
CLOUD = ('Cloud Strife from Final Fantasy VII (original 1997 design, not the Remake): a young swordsman with spiky blond hair and blue eyes, '
         'a sleeveless dark indigo knit turtleneck shirt, a brown leather strap over each shoulder down to two brown leather belts crossed at '
         'the hips, baggy dark indigo trousers, brown boots, brown fingerless gloves. Exactly ONE metal pauldron, the same plate as in image 1, '
         'on his LEFT shoulder, the far shoulder, toward the RIGHT side of the picture; his RIGHT shoulder, nearest the viewer, is bare skin. '
         'The arm that hangs from the BARE near shoulder is his right arm: it has a white cloth SOLDIER wristband at the wrist. The arm that '
         'comes from under the pauldron is his left arm: its wrist has only the brown glove cuff, no band. Both arms have the same natural '
         'skin tone. His sword is the Buster Sword exactly as in image 1: a huge broad single-edged steel broadsword with a wide plain heavy '
         'blade, a square-ish guard with a round fitting and a simple wrapped grip; no mechanism, no slots, no second sword. ')
BARRET = ('Barret Wallace from Final Fantasy VII (original 1997 design, not the Remake, no sunglasses): a huge heavy-set muscular dark-skinned '
          'man, the same face as image 1 (no scars) and the same warm reddish-brown skin, a tall flat-top haircut and a thick black beard. His '
          'RIGHT forearm, the arm nearest the viewer, is replaced below the elbow by the grafted gun-arm of image 1: exactly the same gatling '
          'with the same four barrels in the same stepped steel cylinder and no hand. His LEFT arm, the far arm, is bare and muscular with metal '
          'bands on the forearm and a normal hand. Open brown leather vest over a bare chest, dog tags on a chain. Around his waist three plain '
          'steel bands, no belt, no buckle. Olive green trousers, large brown boots. ')
FACE_R = 'He faces to the RIGHT of the picture in three-quarter view, his right side toward the viewer. '
P = {
 ('cloud', 'windup'): ('Attack wind-up: both hands on the grip, he has lifted the Buster Sword up and back over his RIGHT shoulder (the bare near '
                       'shoulder): the huge blade points up and backward toward the upper LEFT of the picture, behind his head, ready to swing '
                       'forward to the right. His near right arm, bare from the shoulder, is bent up in front of his face with the white band '
                       'at its wrist on the grip; the left arm reaches across below it to the pommel. Weight on his back (left) foot, front '
                       'knee bent, eyes on an enemy to the right.'),
 ('cloud', 'spinA'): ('Victory sword spin: standing relaxed and upright, he holds the Buster Sword by its grip in his RIGHT hand alone (the near '
                      'arm, with the white band), the arm raised in front of him, twirling it: the huge blade stands straight UP above his '
                      'hand, the flat of the blade toward the viewer, caught mid-spin. His left hand hangs relaxed at his side, empty. Exactly '
                      'ONE sword in the picture, nothing on his back. Calm, cool expression. No motion blur.'),
 ('cloud', 'spinB'): ('Victory sword spin: standing relaxed and upright, he spins the Buster Sword with his RIGHT hand alone (the near arm, '
                      'with the white band): the arm is stretched out forward to the right at shoulder height, the hand holding the grip, '
                      'and the huge blade is caught mid-spin pointing straight DOWN below his hand, the edge toward the viewer. His left '
                      'hand rests on his hip. Exactly ONE sword in the picture, nothing on his back. Calm, cool half smile. No motion blur.'),
 ('barret', 'aim'): ('Aiming: he leans forward into a deep braced stance, front knee bent and back leg straight, and raises the gun-arm up '
                     'to EYE level, level and straight out to the RIGHT, head lowered to sight along the barrels with one eye narrowed, '
                     'mouth shut, jaw set. His left arm is bent with a clenched fist pulled back at his hip, not touching the gun.'),
}
KEEP = (' Keep everything else exactly the same: his face, blue eyes, hair, the ONE pauldron on his far shoulder exactly as it is, the '
        'bare near shoulder, the straps, belts, knit shirt, trousers, boots, the white band on the near wrist only, the colours, the '
        'size, the framing, the cel shading and the plain dark grey background. Exactly one sword. No green tint, no rim on the left edges.')
EDIT = {
 ('cloud', 'windupE'): ('Edit this picture. Change only the pose of his arms, the sword and his stance: attack wind-up. Both hands on the grip, '
                        'he lifts the Buster Sword up and back over his near (right) shoulder, the hands beside his near shoulder at head '
                        'height, and the huge blade points up and backward to the upper LEFT of the picture behind his head, ready to swing '
                        'forward to the right. Feet apart, front knee bent, weight on the back foot, eyes on an enemy to the right.' + KEEP),
 ('cloud', 'spinF'): ('Edit this picture. Change only his hands and the sword: victory sword spin. His raised RIGHT fist (the near arm with '
                      'the white band, up beside his head) now holds the grip of the Buster Sword alone, and the huge broad blade is caught '
                      'mid-twirl, angled up and to the RIGHT above his head. His LEFT hand (the far arm, under the pauldron) is empty and '
                      'relaxed at his side, a brown fingerless glove with only the brown leather cuff at the wrist; the sword is no longer '
                      'in it. Exactly one sword.' + KEEP),
 ('cloud', 'windupF'): ('Edit this picture. Change only his left arm, his face and his stance: attack wind-up. His LEFT hand (the far arm, '
                        'under the pauldron) now also grips the sword hilt, just below his right hand, so both hands hold the grip over his '
                        'near right shoulder and the huge blade stays behind him. Fierce focused look to the right, jaw set. Knees bent in a '
                        'wide fighting stance, weight on the back (left) foot, the front foot forward, ready to swing forward to the right. '
                        'His left wrist has only the brown glove cuff.' + KEEP),
 ('barret', 'aimE'): ('Edit this picture. Change only his gun-arm, his head and his stance: AIMING. He raises the gun-arm (his grafted right '
                      'forearm, no hand) up to shoulder height, held level and straight out to the RIGHT, and lowers his head to sight along '
                      'the barrels with narrowed eyes and a set jaw, mouth shut. He leans forward into a wider braced stance, the front knee '
                      'bent. His left arm stays bent with the clenched fist at his hip, away from the gun: nothing holds or touches the gun. '
                      'Keep everything else exactly the same: his face, beard, hair, skin tone, the gun with its four barrels, vest, dog tags, '
                      'the three steel waist bands (no belt, no buckle), trousers, boots, colours, size, framing, the cel shading and the plain '
                      'dark grey background. Both boots whole, with a margin below them. No green tint, no rim on the left edges.'),
 ('cloud', 'spinE'): ('Edit this picture. Change only the pose of his arms and the sword: victory sword spin. His near right arm (the one '
                      'with the white band, on the left of the picture) is raised up in front of him, the hand at head height holding the grip '
                      'of the Buster Sword alone, and the huge blade stands straight UP above the hand, twirling. His far left arm hangs '
                      'relaxed at his side with an empty gloved hand. Calm, cool look to the right.' + KEEP),
 ('barret', 'fire'): ('Edit this picture. Change only his face and the moment: he is now FIRING: mouth wide open shouting, eyes wide, the '
                      'gun-arm kicked up a little by the recoil and his shoulders pushed back a little. Do NOT draw any muzzle flash, fire, '
                      'smoke or bullets. Keep everything else exactly the same: body, stance, legs, boots, the grafted gun-arm with its four '
                      'barrels, his clenched left fist, steel waist bands, costume, colours, size, framing, lighting and the plain dark grey '
                      'background.'),
}
SIZE = {('cloud', 'spinF'): (1024, 1536), ('cloud', 'windupF'): (1024, 1536),('barret', 'aimE'): (1152, 1536), ('cloud', 'windupE'): (1152, 1536), ('cloud', 'spinE'): (1024, 1536),
        ('cloud', 'windup'): (1152, 1536), ('cloud', 'spinA'): (1024, 1536), ('cloud', 'spinB'): (1152, 1536),
        ('barret', 'aim'): (1280, 1536), ('barret', 'fire'): (1280, 1536)}


def prompt(sub, pose):
    if (sub, pose) in EDIT:
        return EDIT[(sub, pose)]
    who = CLOUD if sub == 'cloud' else BARRET
    return f'{SAME}The character: {who}{FACE_R}{P[(sub, pose)]} {LIGHT}{BG}'


if __name__ == '__main__':
    sub, pose, out, seed = sys.argv[1:5]
    den = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
    refs = sys.argv[6:] or [IDLE[sub]]
    job = {'refs': refs, 'out': out, 'seed': int(seed), 'size': list(SIZE[(sub, pose)]), 'den': den,
           'hires': 1.5, 'hden': 0.35, 'pos': prompt(sub, pose), 'key': f'film-repair-{sub}-{pose}'}
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(job, open(out + '.job.json', 'w'), indent=1)
    r = subprocess.run([PY, '-s', os.path.join(HERE, 'gen2.py'), out + '.job.json'], capture_output=True, text=True)
    print((r.stdout + r.stderr)[-400:])
    sys.exit(r.returncode)
