# 1600x900 battle frame: plate (cover-fit) + paintings planted by their feet row at the engine's pixel scale + the
# real Chapter V HUD layer captured from the game. Usage: frame2.py plate hud|- out.jpg item...
#   item = path@x,y,standPx[,flip][,hover=PX][,ref=idle.png]   standPx = on-screen height of the idle's feet row
#   (the engine's `standingPx`: every pose of one subject shares the idle's pixels-per-unit; ref= gives that idle).
import sys, numpy as np
from PIL import Image, ImageFilter, ImageDraw
def feet(im):
    a=np.asarray(im.getchannel('A'))>=int(0.35*255); rows=np.nonzero(a.sum(1)>=3)[0]; return int(rows.max()) if len(rows) else im.height
plate,hud,out=sys.argv[1:4]
bg=Image.open(plate).convert('RGBA'); sw,sh=bg.size; s=max(1600/sw,900/sh)
bg=bg.resize((round(sw*s),round(sh*s)),Image.LANCZOS); l=(bg.width-1600)//2; t=(bg.height-900)//2; bg=bg.crop((l,t,l+1600,t+900))
for it in sys.argv[4:]:
    path,spec=it.rsplit('@',1); parts=spec.split(','); x,y,sp=float(parts[0]),float(parts[1]),float(parts[2])
    flags=parts[3:]; hover=0.0; ref=None
    for f in flags:
        if f.startswith('hover='): hover=float(f[6:])
        if f.startswith('ref='): ref=f[4:]
    im=Image.open(path).convert('RGBA'); fr=feet(im)
    k=sp/feet(Image.open(ref).convert('RGBA')) if ref else sp/fr
    if 'flip' in flags: im=im.transpose(Image.FLIP_LEFT_RIGHT)
    im=im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.LANCZOS); frs=fr*k
    shl=Image.new('RGBA',bg.size,(0,0,0,0)); d=ImageDraw.Draw(shl); q=0.55 if hover else 1.0
    a=np.asarray(im.getchannel('A'))>60; cols=np.nonzero(a[max(0,int(frs)-int(sp*0.08)):int(frs)+1].any(0))[0]
    rw=((cols.max()-cols.min())/2+8 if len(cols) else im.width*0.2)*q; rh=max(5,sp*0.03*q)
    d.ellipse((x-rw,y-rh,x+rw,y+rh),fill=(20,0,30,60 if hover else 110)); shl=shl.filter(ImageFilter.GaussianBlur(max(3,sp*0.02)))
    bg=Image.alpha_composite(bg,shl)
    # horizontal anchor: the centre of the feet columns
    cx=(cols.min()+cols.max())/2 if len(cols) else im.width/2
    lay=Image.new('RGBA',bg.size,(0,0,0,0)); lay.paste(im,(round(x-cx),round(y-hover-frs)),im); bg=Image.alpha_composite(bg,lay)
if hud!='-': bg=Image.alpha_composite(bg,Image.open(hud).convert('RGBA'))
bg.convert('RGB').save(out,quality=90); print(out)
