from PIL import Image; import numpy as np, json
fr={'up':Image.open('frames/game-1600x900-hint-3.jpg').convert('RGB'),'down':Image.open('frames/game-1600x900-turn.jpg').convert('RGB')}
jobs=[('cloud','ff7-cloud','up',(1240,360,1400,610)),('barret','ff7-barret','up',(1160,300,1310,535)),
      ('boss-up','ff7-guard-scorpion-tail-up','up',(190,250,700,600)),('boss-down','ff7-guard-scorpion','down',(190,250,700,600))]
out={}
for name,art,fk,(x0,y0,x1,y1) in jobs:
    P=Image.open(f'D:/Final Fantasy/public/art/characters/{art}/idle.png').convert('RGBA')
    F=np.asarray(fr[fk],dtype=np.float32)
    bb=P.split()[-1].getbbox()
    best=None
    ph=bb[3]-bb[1]; pw=bb[2]-bb[0]
    for s in np.arange(0.12,0.50,0.004):
        w=int(pw*s); h=int(ph*s)
        if w>(x1-x0)+40 or h>(y1-y0)+40 or w<(x1-x0)*0.6 and h<(y1-y0)*0.6: continue
        Q=np.asarray(P.crop(bb).resize((w,h),Image.BILINEAR),dtype=np.float32)
        a=Q[...,3]>200
        if a.sum()<500: continue
        q=Q[...,:3][a]
        for oy in range(y0-20,y1-h+21,2):
            for ox in range(x0-20,x1-w+21,2):
                f=F[oy:oy+h,ox:ox+w][a]
                e=np.abs(f-q).mean()
                if best is None or e<best[0]: best=(e,s,ox,oy,w,h)
    e,s,ox,oy,w,h=best
    # refine 1px
    for s2 in np.arange(s-0.004,s+0.0041,0.001):
        w=int(pw*s2); h=int(ph*s2); Q=np.asarray(P.crop(bb).resize((w,h),Image.BILINEAR),dtype=np.float32); a=Q[...,3]>200; q=Q[...,:3][a]
        for oy2 in range(oy-3,oy+4):
            for ox2 in range(ox-3,ox+4):
                f=F[oy2:oy2+h,ox2:ox2+w][a]; e2=np.abs(f-q).mean()
                if e2<best[0]: best=(e2,s2,ox2,oy2,w,h)
    print(name,best); e,s,ox,oy,w,h=best
    out[name]=dict(art=art,x=int(ox),y=int(oy),w=int(w),h=int(h),err=float(e),frame=fk)
json.dump(out,open('fit.json','w'),indent=1)
