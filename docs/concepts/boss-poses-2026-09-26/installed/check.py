from PIL import Image, ImageDraw, ImageOps
import json,sys
C='D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2/'
A='D:/Final Fantasy/public/art/characters/'
S=json.loads(sys.argv[1])
items=[('yojimbo-cavern','yojimbo/attack-h/cand-45','attack'),('yojimbo-cavern','yojimbo/hurt/cand-35','hurt'),('trema','trema/hurt/cand-7','hurt'),('logos','logos/hurt/cand-2','hurt'),('leblanc','leblanc/hurt/cand-10','hurt'),('ormi','ormi/hurt/cand-7','hurt'),('ffx2-dr-goon','ffx2-dr-goon/hurt/cand-4','hurt')]
k=0.42; cols=[]
for a,c,slot in items:
    idle=Image.open(A+a+'/idle.png').convert('RGBA'); im=Image.open(C+c+'.png').convert('RGBA')
    if a=='ormi': im=ImageOps.mirror(im)
    s=S[a+'/'+slot]
    ij=json.load(open(A+a+'/idle.json',encoding='utf-8')); ib=ij['baselineY']
    cj=json.load(open(C+c+'.json',encoding='utf-8')); cbl=cj['cutout']['baselineY']
    i2=idle.resize((int(idle.width*k),int(idle.height*k)),Image.LANCZOS)
    p2=im.resize((int(im.width*k*s),int(im.height*k*s)),Image.LANCZOS)
    H=max(int(ib*k),int(cbl*k*s))+40; W=i2.width+p2.width+10
    t=Image.new('RGBA',(W,H+30),(128,128,140,255))
    gy=H
    t.alpha_composite(i2,(0,gy-int(ib*k))); t.alpha_composite(p2,(i2.width+10,gy-int(cbl*k*s)))
    d=ImageDraw.Draw(t); d.line([(0,gy),(W,gy)],fill=(255,0,0)); d.text((4,gy+6),f'{a} {slot} x{s} stature {cj["cutout"]["baselineY"]*s/ib:.2f}',fill=(255,255,255))
    top=gy-int(ib*k)+ (idle.split()[3].getbbox()[1]*k)
    d.line([(0,top),(W,top)],fill=(0,255,0))
    cols.append(t)
W=sum(c.width for c in cols)+10*len(cols); H=max(c.height for c in cols)
sh=Image.new('RGB',(W,H),(30,30,30)); x=0
for c in cols: sh.paste(c.convert('RGB'),(x,H-c.height)); x+=c.width+10
sh.save('scale-check.jpg',quality=88); print(sh.size)
