import json, numpy as np
from PIL import Image
D='D:/Tools/pyrefly-video/flf/idle-blinks/1/'
PLATE='D:/Tools/ComfyUI/ComfyUI/input/pyrefly-video-plate-f1efe21f6c75-1280x704.png'
FLOOR='D:/Tools/pyrefly-video/flf/vae-floor/pyrefly-video-plate-f1efe21f6c75-1280x704-floor.png'
L=lambda p: np.asarray(Image.open(p).convert('RGB'),dtype=np.float64)
plate=L(PLATE); floor=L(FLOOR)
fr=[L(D+'frame_%05d.png'%i) for i in range(1,98)]
B={"face":(420,20,760,400),"eyes":(460,140,635,285),"greenEye":(468,203,546,278),"blueEye":(548,145,626,220),
   "mouth":(548,252,642,308),"braid":(468,278,542,402),"hairline":(436,18,724,122),
   "body":(560,400,900,690),"bgLeft":(0,120,330,560),"bgRight":(950,0,1280,500),"full":(0,0,1280,704)}
def c(a,b): x0,y0,x1,y1=b; return a[y0:y1,x0:x1]
def st(a,b,box):
    d=np.mean(np.abs(c(a,box)-c(b,box)),axis=-1)
    return dict(mad=float(d.mean()),maxAbs=float(d.max()),p999=float(np.percentile(d,99.9)))
out={}
out['floor']={k:st(floor,plate,v) for k,v in B.items()}
out['f1']={k:st(fr[0],plate,v) for k,v in B.items()}
out['f97']={k:st(fr[96],plate,v) for k,v in B.items()}
out['seam97to1']={k:st(fr[96],fr[0],v) for k,v in B.items()}
# per-frame vs plate
out['perFrameVsPlate']={k:[st(f,plate,B[k])['mad'] for f in fr] for k in ['face','eyes','greenEye','blueEye','mouth','body','bgLeft','bgRight','full']}
out['perFrameVsF1']={k:[st(f,fr[0],B[k])['mad'] for f in fr] for k in ['body','bgLeft','bgRight']}
out['stepHead']=[st(fr[i],fr[i-1],B['face'])['mad'] for i in range(1,97)]
out['stepFull']=[st(fr[i],fr[i-1],B['full'])['mad'] for i in range(1,97)]
# global colour
out['meanRGB']=[list(map(float,f.reshape(-1,3).mean(0))) for f in fr]
out['plateMeanRGB']=list(map(float,plate.reshape(-1,3).mean(0)))
def sat(a):
    mx=a.max(-1); mn=a.min(-1); return float(((mx-mn)/(mx+1e-6)).mean())
out['meanSat']=[sat(f) for f in fr]; out['plateSat']=sat(plate)
# iris masks
def green(a): r,g,b=a[...,0],a[...,1],a[...,2]; return (g>r+40)&(g>b+20)
def blue(a): r,g,b=a[...,0],a[...,1],a[...,2]; return (b>r+60)&(b>g+30)
out['greenIrisPx']=[int(green(c(f,B['greenEye'])).sum()) for f in fr]; out['plateGreenPx']=int(green(c(plate,B['greenEye'])).sum())
out['blueIrisPx']=[int(blue(c(f,B['blueEye'])).sum()) for f in fr]; out['plateBluePx']=int(blue(c(plate,B['blueEye'])).sum())
# swapped check: green in blue box, blue in green box
out['greenInBlueBox']=[int(green(c(f,B['blueEye'])).sum()) for f in fr]
out['blueInGreenBox']=[int(blue(c(f,B['greenEye'])).sum()) for f in fr]
# phase correlation head box
def pc(a,b):
    ga=c(a,B['face']).mean(-1); gb=c(b,B['face']).mean(-1)
    ga=ga-ga.mean(); gb=gb-gb.mean()
    w=np.outer(np.hanning(ga.shape[0]),np.hanning(ga.shape[1])); ga*=w; gb*=w
    F=np.fft.fft2(ga)*np.conj(np.fft.fft2(gb)); F/=np.abs(F)+1e-9
    r=np.real(np.fft.ifft2(F)); iy,ix=np.unravel_index(r.argmax(),r.shape)
    h,wd=r.shape; dy=iy if iy<h//2 else iy-h; dx=ix if ix<wd//2 else ix-wd
    return int(dx),int(dy),float(r.max())
out['phase_f1_f97']=pc(fr[0],fr[96]); out['phase_plate_f97']=pc(plate,fr[96]); out['phase_plate_f1']=pc(plate,fr[0])
out['phase_perFrame_vs_f1']=[pc(fr[0],f)[:2] for f in fr]
json.dump(out,open('metrics.json','w'),indent=1)
def r(x): return round(x,2)
for k in B:
    fl=out['floor'][k]
    print(f"{k:9s} floor {r(fl['mad']):6} {r(fl['maxAbs']):6} {r(fl['p999']):6} | f1 {r(out['f1'][k]['mad']):6} {r(out['f1'][k]['maxAbs']):6} {r(out['f1'][k]['p999']):6} ({r(out['f1'][k]['mad']/fl['mad'])}x) | f97 {r(out['f97'][k]['mad']):6} {r(out['f97'][k]['maxAbs']):6} {r(out['f97'][k]['p999']):6} ({r(out['f97'][k]['mad']/fl['mad'])}x) | seam {r(out['seam97to1'][k]['mad'])}")
print('phase f1-f97',out['phase_f1_f97'],'plate-f97',out['phase_plate_f97'],'plate-f1',out['phase_plate_f1'])
print('plate iris px green',out['plateGreenPx'],'blue',out['plateBluePx'])
for i in range(97):
    print(i+1, 'face',r(out['perFrameVsPlate']['face'][i]),'mouth',r(out['perFrameVsPlate']['mouth'][i]),'body',r(out['perFrameVsPlate']['body'][i]),'bgL',r(out['perFrameVsPlate']['bgLeft'][i]),'full',r(out['perFrameVsPlate']['full'][i]),
      'G',out['greenIrisPx'][i],'Bl',out['blueIrisPx'][i],'swap',out['greenInBlueBox'][i],out['blueInGreenBox'][i],'step',r(out['stepHead'][i-1]) if i else '-',
      'rgb',[round(v) for v in out['meanRGB'][i]],'sat',r(out['meanSat'][i]),'pc',out['phase_perFrame_vs_f1'][i])
print('plate rgb',[round(v) for v in out['plateMeanRGB']],'sat',r(out['plateSat']))
print('median step head',r(float(np.median(out['stepHead']))),'median step full',r(float(np.median(out['stepFull']))))
