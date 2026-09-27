from PIL import Image; import numpy as np, sys
bd=Image.open('D:/Final Fantasy/public/art/backdrops/ff7-sector1-reactor.png').convert('L')
fr=Image.open('frames/'+sys.argv[1]).convert('L')
x0,y0,x1,y1=[int(v) for v in sys.argv[2].split(',')]   # region to fit
ix0,iy0,ix1,iy1=[int(v) for v in sys.argv[3].split(',')] # hole (subject) excluded
d=2
F=np.asarray(fr,dtype=np.float32)[y0:y1:d, x0:x1:d]
m=np.ones_like(F,bool); m[(iy0-y0)//d:(iy1-y0)//d,(ix0-x0)//d:(ix1-x0)//d]=False
best=None
for sx in np.arange(0.58,0.66,0.005):
  for sy in np.arange(0.54,0.66,0.01):
    W=int(2688*sx/d); H=int(1536*sy/d)
    B=np.asarray(bd.resize((W,H)),dtype=np.float32)
    # frame px (X,Y) -> painting px (X+ox, Y+oy) in scaled coords
    for oy in range(200//d, 400//d):
      for ox in range(-20//d, 60//d):
        ys=y0//d+oy; xs=x0//d+ox
        if xs<0 or ys<0: continue
        sub=B[ys:ys+F.shape[0], xs:xs+F.shape[1]]
        if sub.shape!=F.shape: continue
        a=F[m]; b=sub[m]; a=a-a.mean(); b=b-b.mean()
        c=(a*b).sum()/np.sqrt((a*a).sum()*(b*b).sum()+1e-6)
        if best is None or c>best[0]: best=(round(float(c),4),round(sx,3),round(sy,3),ox*d,oy*d)
print(best)
