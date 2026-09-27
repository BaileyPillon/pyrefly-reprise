p='poses.py'; s=open(p,encoding='utf8').read()
s=s.replace("""curving gently upward only near its end, with the cyan lens at the '
                   'tip pointing back and up to the right, below the top of the shell.""","""curving gently upward only near its end. The laser emitter with its big '
                   'round glowing cyan lens stays at the very TIP of the tail (the last segment), pointing back and up to the right, below the top of the '
                   'shell; there is only one lens on the tail and nothing floating in the air.""")
open(p,'w',encoding='utf8').write(s)
