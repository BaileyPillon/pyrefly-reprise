import cv2, numpy as np
S=r"C:/Users/ADMINI~1/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad"
r1=cv2.imread('D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/ormi/replaced/cast.png',cv2.IMREAD_UNCHANGED)
x0,y0,x1,y1=30,555,170,785
c=r1[y0:y1,x0:x1,:3]; red=np.load(S+'/r1red.npy')
hsv=cv2.cvtColor(c,cv2.COLOR_BGR2HSV); h,s,v=[hsv[...,i].astype(int) for i in range(3)]
gold=((h>=10)&(h<=35)&(s>70)&(v>90)).astype(np.uint8)
E=lambda d: cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*d+1,2*d+1))
dil=cv2.dilate(red,E(9))
g=gold&dil
# gold outline connected to red: keep gold within dil; close gaps
m=red|g
m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,E(3))
n,lab,st,_=cv2.connectedComponentsWithStats(m,8); k=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); m=(lab==k).astype(np.uint8)
ff=m.copy(); mm=np.zeros((ff.shape[0]+2,ff.shape[1]+2),np.uint8); cv2.floodFill(ff,mm,(0,0),1); m=m|(1-ff)
m=cv2.morphologyEx(m,cv2.MORPH_OPEN,E(2))
# include the outer ink line: 1px dilation
m=cv2.dilate(m,E(1))
np.save(S+'/r1heart.npy',m)
print('bbox',cv2.boundingRect(m),'area',m.sum())
vis=c.copy(); vis[m==0]=(vis[m==0]*0.25).astype(np.uint8)
cv2.imwrite(S+'/r1heart_vis.png',cv2.resize(vis,None,fx=3,fy=3,interpolation=cv2.INTER_NEAREST))
