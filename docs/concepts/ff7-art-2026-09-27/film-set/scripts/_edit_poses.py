p='poses.py'; s=open(p,encoding='utf8').read()
old=s[s.index(" ('cloud', 'spin'):"):s.index(" ('cloud', 'back'):")]
s=s.replace(old,""" ('cloud', 'spin'): 'Victory sword spin: standing relaxed, he twirls the Buster Sword with his RIGHT hand alone, that arm raised up beside his head, the blade caught mid-spin pointing up and back over his head; his left hand hangs relaxed at his side, empty. There is exactly ONE sword in the whole picture and nothing on his back. Calm, cool expression. No motion blur.',
""")
s=s.replace("""('barret', 'fix'): (""","""('barret', 'aimfire'): ('Edit this picture. Change only his face and the moment: he is now AIMING, not firing: mouth closed, jaw set, a fierce narrowed '
                         'glare along the gun-arm, shoulders square and steady, the gun-arm held level, pointing straight forward to the right. '
                         'Keep everything else exactly the same: body, stance, legs, the grafted gun-arm, his clenched left fist, steel waist '
                         'bands, costume, colours, size, framing, lighting and the plain dark grey background.'),
 ('barret', 'fix'): (""")
open(p,'w',encoding='utf8').write(s)
