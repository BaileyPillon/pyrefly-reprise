p='poses.py'; s=open(p,encoding='utf8').read()
s=s.replace("""('barret', 'fix'): (""","""('gs', 'lower'): ('Edit this picture. Lower the tail: the same segmented red tail now trails straight back from the rear of the body to '
                   'the RIGHT, held low, about level with the top of the legs, curving gently upward only near its end, with the cyan lens at the '
                   'tip pointing back and up to the right, below the top of the shell. Nothing of the tail is above the body. Keep everything else '
                   'exactly the same: the body, shell, head, sensor eye, twin rifles, the six legs, the flat round disc housing on its back, colours, '
                   'size, facing left, and the plain dark grey background with no floor shadow.'),
 ('barret', 'fix'): (""")
open(p,'w',encoding='utf8').write(s)
