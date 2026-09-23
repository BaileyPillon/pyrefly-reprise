from PIL import Image
import sys
src=sys.argv[1]; out=sys.argv[2]; box=tuple(map(int,sys.argv[3].split(','))); s=int(sys.argv[4]); bgc=sys.argv[5] if len(sys.argv)>5 else "128,128,128"
im=Image.open(src).convert("RGBA"); cr=im.crop(box)
bg=Image.new("RGBA",cr.size,tuple(map(int,bgc.split(',')))+(255,)); bg.alpha_composite(cr)
bg.resize((cr.size[0]*s,cr.size[1]*s),Image.NEAREST).convert("RGB").save(out)
