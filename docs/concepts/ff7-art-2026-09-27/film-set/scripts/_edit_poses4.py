p='poses.py'; s=open(p,encoding='utf8').read()
old=s[s.index(" ('barret', 'punch'):"):s.index(" ('barret', 'hurt'):")]
s=s.replace(old,""" ('barret', 'punch'): 'Victory air punch: standing tall, head tipped back shouting in triumph. The gun-arm, his near RIGHT arm toward the LEFT of the picture, hangs straight down at his side, the barrels pointing at the floor; that arm ends in the gun, there is no hand at its end or anywhere beside it. His LEFT arm, the far arm toward the RIGHT of the picture, punches straight up above his head with a bare clenched fist (his normal hand). Three plain steel bands around his waist, no belt.',
""")
open(p,'w',encoding='utf8').write(s)
