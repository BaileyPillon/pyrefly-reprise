p='poses.py'; s=open(p,encoding='utf8').read()
old=s[s.index(" ('cloud', 'hurt'):"):s.index(" ('barret', 'idle'):")]
s=s.replace(old,""" ('cloud', 'hurt'): 'Hurt flinch: struck hard from the right, he is knocked back off balance: his whole body leans back toward the LEFT of the picture, torso tilted back, head snapped back and turned down with eyes squeezed shut, gritting his teeth, front foot lifting, knees buckling; he still grips the Buster Sword in both hands, its blade dragged low behind him toward the lower LEFT. Exactly ONE sword.',
""")
open(p,'w',encoding='utf8').write(s)
