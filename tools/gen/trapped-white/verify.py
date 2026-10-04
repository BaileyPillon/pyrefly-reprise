import json, numpy as np, hashlib
from PIL import Image
C=r"D:/Tools/pyrefly-art-backup/candidates/2026-10-04/trapped-white"
m=json.load(open(C+'/manifest.json'))
ok=True; tot=0
for f in m['files']:
    old=f"D:/Final Fantasy/{f['file']}"; new=f"{C}/install-ready/{f['file']}"
    a=np.array(Image.open(old).convert('RGBA')); b=np.array(Image.open(new).convert('RGBA'))
    assert a.shape==b.shape
    ch=np.any(a!=b,axis=2)
    allzero=(b[ch]==0).all()
    wasopaque=(a[ch][:,3]>8).all()
    oldsha=hashlib.sha256(open(old,'rb').read()).hexdigest()==f['oldSha256']
    newsha=hashlib.sha256(open(new,'rb').read()).hexdigest()==f['newSha256']
    mode=Image.open(new).mode
    inbox=True
    n=int(ch.sum()); tot+=n
    # every changed pixel lies inside some listed region box (grown by 6 px)
    ys,xs=np.where(ch)
    boxes=[r['box'] for r in f['regions']]
    for x,y in zip(xs[::max(1,len(xs)//2000)],ys[::max(1,len(xs)//2000)]):
        if not any(b0-6<=x<b2+6 and b1-6<=y<b3+6 for b0,b1,b2,b3 in boxes): inbox=False;break
    print(f['file'].split('characters/')[1],n,'allZero',allzero,'wasOpaque',wasopaque,'oldSha',oldsha,'newSha',newsha,mode,'inBoxes',inbox)
    ok&=allzero and wasopaque and oldsha and newsha and inbox and n==f['changedPixels']
print('ALL OK' if ok else 'PROBLEM', tot)
