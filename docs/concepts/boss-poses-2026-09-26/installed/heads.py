from PIL import Image, ImageDraw, ImageOps
import sys
C='D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2/'
A='D:/Final Fantasy/public/art/characters/'
# boxes (x0,y0,x1,y1) of head regions in each image, given on argv as name:ix0,iy0,ix1,iy1:cx0,cy0,cx1,cy1
pairs={'trema':'trema/hurt/cand-7','logos':'logos/hurt/cand-2','leblanc':'leblanc/hurt/cand-10','ormi':'ormi/hurt/cand-7','ffx2-dr-goon':'ffx2-dr-goon/hurt/cand-4'}
name=sys.argv[1]; ib=[int(v) for v in sys.argv[2].split(',')]; cb=[int(v) for v in sys.argv[3].split(',')]; z=float(sys.argv[4]) if len(sys.argv)>4 else 2
idle=Image.open(A+name+'/idle.png').convert('RGBA'); im=Image.open(C+pairs[name]+'.png').convert('RGBA')
if name=='ormi': im=ImageOps.mirror(im)
out=[]
for p,b in ((idle,ib),(im,cb)):
    bg=Image.new('RGBA',p.size,(150,150,160,255)); bg.alpha_composite(p)
    c=bg.crop(b).convert('RGB').resize((int((b[2]-b[0])*z),int((b[3]-b[1])*z)),Image.LANCZOS)
    d=ImageDraw.Draw(c)
    for y in range(b[1]-b[1]%10,b[3],10):
        yy=int((y-b[1])*z); d.line([(0,yy),(12 if y%50 else 30,yy)],fill=(255,0,0) if y%50==0 else (0,0,255))
        if y%50==0: d.text((32,yy-5),str(y),fill=(255,0,0))
    for x in range(b[0]-b[0]%10,b[2],10):
        xx=int((x-b[0])*z); d.line([(xx,0),(xx,12 if x%50 else 30)],fill=(255,0,0) if x%50==0 else (0,0,255))
        if x%50==0: d.text((xx+2,32),str(x),fill=(255,0,0))
    out.append(c)
W=sum(o.width for o in out)+20; H=max(o.height for o in out)
sh=Image.new('RGB',(W,H),(40,40,40)); sh.paste(out[0],(0,0)); sh.paste(out[1],(out[0].width+20,0)); sh.save(f'head-{name}.png'); print(sh.size)
