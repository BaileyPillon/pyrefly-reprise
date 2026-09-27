from PIL import Image; import numpy as np
bd=Image.open('D:/Final Fantasy/public/art/backdrops/ff7-sector1-reactor.png').convert('RGB')
sx,sy,ox,oy=0.605,0.61,12,286
B=np.asarray(bd.resize((int(2688*sx),int(1536*sy)),Image.LANCZOS),dtype=np.float32)
fr=np.asarray(Image.open('frames/game-1600x900-hint-3.jpg').convert('RGB'),dtype=np.float32)
P0=B[oy:oy+900, ox:ox+1600]
m=np.zeros((900,1600),bool); m[130:630,:]=True; m[:,200:700]=False; m[:,1140:1440]=False
m=m[:P0.shape[0]]
T=B[0:oy+640, ox:ox+1600].copy()
for c in range(3):
    a,b=np.polyfit(P0[...,c][m],fr[:P0.shape[0]][...,c][m],1); T[...,c]=np.clip(a*T[...,c]+b,0,255)
Image.fromarray(T.astype(np.uint8)).save('plate-tall.jpg',quality=93); print(T.shape)
