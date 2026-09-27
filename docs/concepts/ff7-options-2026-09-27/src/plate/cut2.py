from PIL import Image; import numpy as np, json
fit=json.load(open('fit.json'))
fr={'up':np.asarray(Image.open('frames/game-1600x900-hint-3.jpg').convert('RGB'),dtype=np.float32),'down':np.asarray(Image.open('frames/game-1600x900-turn.jpg').convert('RGB'),dtype=np.float32)}
for k,v in fit.items():
    P=Image.open(f"D:/Final Fantasy/public/art/characters/{v['art']}/idle.png").convert('RGBA'); P=P.crop(P.split()[-1].getbbox())
    S=2  # keep 2x resolution for crisp close-ups
    Q=np.asarray(P.resize((v['w']*S,v['h']*S),Image.LANCZOS),dtype=np.float32)
    q1=np.asarray(P.resize((v['w'],v['h']),Image.LANCZOS),dtype=np.float32)
    a=q1[...,3]>220
    F=fr[v['frame']][v['y']:v['y']+v['h'], v['x']:v['x']+v['w']]
    for c in range(3):
        A,B=np.polyfit(q1[...,c][a],F[...,c][a],1); Q[...,c]=np.clip(A*Q[...,c]+B,0,255); print(k,c,round(A,3),round(B,1))
    Image.fromarray(Q.astype(np.uint8),'RGBA').save(f'fig-{k}.png')
json.dump(fit,open('fit.json','w'),indent=1)
# portraits (square head crops from the full paintings)
for n,art,box in [('cloud','ff7-cloud',(150,16,470,336)),('barret','ff7-barret',(260,16,580,336))]:
    P=Image.open(f'D:/Final Fantasy/public/art/characters/{art}/idle.png').convert('RGBA')
    P.crop(box).save(f'head-{n}.png')
