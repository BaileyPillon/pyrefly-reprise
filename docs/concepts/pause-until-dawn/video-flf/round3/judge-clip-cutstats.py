import numpy as np
from PIL import Image
L=lambda i: np.asarray(Image.open('f_%04d.png'%i).convert('RGB'),dtype=np.float64)
n=291
face=(420,20,760,400); full=(0,0,1280,704)
def m(a,b,box): x0,y0,x1,y1=box; return float(np.mean(np.abs(a[y0:y1,x0:x1]-b[y0:y1,x0:x1])))
prev=L(1); steps=[]
for i in range(2,n+1):
    cur=L(i); steps.append((i,m(cur,prev,face),m(cur,prev,full))); prev=cur
inside=[s for s in steps if s[0] not in (98,195)]
print('median inside head',np.median([s[1] for s in inside]),'full',np.median([s[2] for s in inside]))
print('mean inside head', np.mean([s[1] for s in inside]))
for s in steps:
    if s[0] in range(92,102) or s[0] in range(189,199) or s[0] in (2,3): print(s[0]-1,'->',s[0], round(s[1],2), round(s[2],2))
print('top 6 steps', sorted(steps,key=lambda s:-s[1])[:6])
