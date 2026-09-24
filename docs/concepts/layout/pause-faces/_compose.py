import json, glob, os
from PIL import Image, ImageDraw, ImageFont
S='D:/Tools/pyrefly-scratch/layoutopts'
R='D:/Final Fantasy/docs/concepts/layout'
F=lambda sz,b=False: ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if b else 'C:/Windows/Fonts/segoeui.ttf', sz)
BG=(16,16,22); FG=(236,232,222); DIM=(150,146,140); OK=(110,210,130); BAD=(240,110,110); ACC=(227,185,74)
# ---------------- pause faces
opts=[('stack','A  Stack IN THIS FIGHT under BATTLE STATS'),('slide','B  Slide the plate under the dark falloff'),('closer','C  Closer approved-style crop'),('keep','D  Keep as is (build today)')]
fn={'stack':'a-stack','slide':'b-slide','closer':'c-closer','keep':'d-keep'}
cases=[('rikku-ffx2','1600x900','FFX-2 Rikku','ffx2-bahamut'),('rikku-ffx2','1280x960','FFX-2 Rikku','ffx2-bahamut'),('rikku-ffx2','2000x1012','FFX-2 Rikku','ffx2-bahamut'),
       ('tidus','1600x900','FFX Tidus','seymour-flux'),('tidus','1280x960','FFX Tidus','seymour-flux'),('tidus','2000x1012','FFX Tidus','seymour-flux'),('auron','1280x960','FFX Auron','yunalesca')]
M={}
for f in glob.glob(f'{S}/shots/m-*.json'):
    for r in json.load(open(f))['results']: M[(r['plate'],r['size'])]=r['options']
CW=480; LW=200; PAD=14; CAP=58
def verdict(o):
    hits=[h for h in o.get('hits',[])]
    fs=o.get('onScreen') or {}
    off=[k for k in 'lrtb' if fs.get(k,0)<0]
    if hits: t,c=('touches '+', '.join(sorted(set(h.replace('col:fight','IN THIS FIGHT').replace('pause__','') for h in hits)))),BAD
    else: t,c=('face clear, %d px'%round(o['gap'])) if o.get('gap') is not None else 'face clear',OK
    extra=[]
    if off: extra.append('face cropped %d px at the %s edge'%(-min(fs[k] for k in off),{'l':'left','r':'right','t':'top','b':'bottom'}[off[0]]))
    if o.get('zoom') not in (None,): extra.append('zoom %.2fx'%o['zoom'])
    if o.get('scale') not in (None,1,1.0): extra.append('plate %.0f%% size'%(o['scale']*100))
    if o.get('emptyEdge',0)>0: extra.append('%d px feathered empty edge'%o['emptyEdge'])
    return t,c,'; '.join(extra)
rows=[]
for plate,size,label,ch in cases:
    w,h=map(int,size.split('x')); ch_h=int(h*CW/w); rows.append(ch_h)
W=LW+4*(CW+PAD)+PAD; H=150+sum(r+CAP+PAD for r in rows)+60
sheet=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(sheet)
d.text((PAD,14),'Pause faces: where does the chrome go when the face has no empty side?',font=F(30,True),fill=FG)
d.text((PAD,56),'Real captures (Chromium, RTX 5070 Ti, real Escape / E presses, push-in held at 1.1 s). Options injected in a scratch browser session only; nothing under src/ changed. Magenta = measured face box (brow to chin, cheek to cheek).',font=F(16),fill=DIM)
d.text((PAD,80),'Recommendation: B (slide under the falloff) for every plate the framing search cannot clear. It keeps the approved chrome and meters exactly as mocked and clears all 7 cases with the face on screen (Auron 1280x960 meets the right edge within 1 px).',font=F(17,True),fill=ACC)
y=120
for i,(k,t) in enumerate(opts): d.text((LW+PAD+i*(CW+PAD),y),t,font=F(17,True),fill=ACC if k=='slide' else FG)
y=150
for (plate,size,label,ch),ch_h in zip(cases,rows):
    d.text((PAD,y+4),label,font=F(20,True),fill=FG); d.text((PAD,y+32),size,font=F(18),fill=DIM); d.text((PAD,y+56),'chapter: '+ch,font=F(14),fill=DIM)
    for i,(k,t) in enumerate(opts):
        src=f'{S}/shots/{plate}-{size}-{k}.jpg'; im=Image.open(src).convert('RGB')
        os.makedirs(f'{R}/pause-faces',exist_ok=True); im.save(f'{R}/pause-faces/{plate}-{size}-{fn[k]}.jpg',quality=85)
        sc=CW/im.width; th=im.resize((CW,ch_h),Image.LANCZOS); x=LW+PAD+i*(CW+PAD)
        o=M[(plate,size)][k]; fb=o.get('face')
        if fb:
            dd=ImageDraw.Draw(th); dd.rectangle([fb['left']*sc,fb['top']*sc,fb['right']*sc,fb['bottom']*sc],outline=(255,64,255),width=2)
        sheet.paste(th,(x,y))
        t1,c,ex=verdict(o); d.text((x,y+ch_h+4),t1,font=F(16,True),fill=c); d.text((x,y+ch_h+26),ex,font=F(14),fill=DIM)
    y+=ch_h+CAP+PAD
d.text((PAD,y+10),'Full-size frames: docs/concepts/layout/pause-faces/<plate>-<size>-<a-stack|b-slide|c-closer|d-keep>.jpg (no face-box overlay).',font=F(15),fill=DIM)
sheet.save(f'{R}/pause-faces/sheet.jpg',quality=88); print('pause sheet',sheet.size)
# ---------------- PR-0127 phone
P=f'{S}/prep'
cols=[('baseline','Baseline (build today)'),('stack-top','A  Stacked cards (scrolls)'),('stack-top-full','A  whole page'),('tabs-story','B  Tabbed card: STORY'),('tabs-goals','B  Tabbed card: OBJECTIVES · TIP'),('collapse-closed','C  Collapsible rows: closed'),('collapse-open-full','C  opened (TIP + story), whole page')]
chs=[('ffx2-leblanc','FFX-2  Chapter VI  Leblanc'),('seymour-flux','FFX  Chapter I  Seymour Flux')]
CWp=390; G=18; maxh=1000
W=G+len(cols)*(CWp+G); H=170+len(chs)*(maxh+70)+40
sh=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(sh)
d.text((G,14),'PR-0127 at phone width (390 x 844): how should the party-prep CHAPTER card lay out?',font=F(30,True),fill=FG)
d.text((G,56),'Real text, art and fonts from the running game, laid out at native phone pixels in a scratch browser session (nothing under src/ changed). Every text node 12 px or larger. Frames are 1:1.',font=F(16),fill=DIM)
d.text((G,80),'Recommendation: A, stacked cards with a sticky START BATTLE and a "more below" cue: everything readable, nothing hidden behind a control, native phone scrolling.',font=F(17,True),fill=ACC)
for i,(k,t) in enumerate(cols): d.text((G+i*(CWp+G),130),t,font=F(15,True),fill=ACC if k.startswith('stack') else FG)
y=160
for ch,lab in chs:
    d.text((G,y),lab,font=F(20,True),fill=FG); y+=34
    for i,(k,t) in enumerate(cols):
        x=G+i*(CWp+G)
        if k=='baseline':
            src='D:/Final Fantasy/docs/screenshots/fix12/PR-0127-phone-ch6-baseline.png' if ch=='ffx2-leblanc' else f'{P}/{ch}-baseline.jpg'
        else: src=f'{P}/{ch}-{k}.jpg'
        if not os.path.exists(src): d.text((x,y+20),'(not captured)',font=F(15),fill=DIM); continue
        im=Image.open(src).convert('RGB')
        im.save(f'{R}/pr-0127-phone/{ch}-{k}.jpg',quality=88)
        if im.height>maxh: im=im.crop((0,0,im.width,maxh))
        sh.paste(im,(x,y))
        if k.endswith('full') or k=='baseline': pass
    y+=maxh+36
sh.save(f'{R}/pr-0127-phone/sheet.jpg',quality=88); print('prep sheet',sh.size)
