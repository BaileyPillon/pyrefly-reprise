p='poses.py'; s=open(p,encoding='utf8').read()
old=s[s.index(" ('gs', 'recoil'):"):s.index("}\nSIZE")]
s=s.replace(old,""" ('gs', 'recoil'): 'Hit recoil: struck hard on its head from the left, the whole machine is knocked back: its body is tilted back about fifteen degrees with the head end lifted high, the two front pairs of legs lifted off the ground and splayed, the rear legs braced and bent, the sensor eye flaring, the lowered tail swinging out behind it to the right. Every part stays attached; no debris, no sparks, no smoke, no separate pieces.',
""")
open(p,'w',encoding='utf8').write(s)
