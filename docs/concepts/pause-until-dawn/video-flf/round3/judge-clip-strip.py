from PIL import Image, ImageDraw, ImageFont
D='D:/Tools/pyrefly-video/flf/idle-blinks/1/frame_%05d.png'
PLATE='D:/Tools/ComfyUI/ComfyUI/input/pyrefly-video-plate-f1efe21f6c75-1280x704.png'
CUT='cut/f_%04d.png'
try: font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
except: font=ImageFont.load_default()
def im(src): return Image.open(src).convert('RGB')
def row(items, box, title):
    crops=[(lab,im(p).crop(box)) for lab,p in items]
    w=box[2]-box[0]; h=box[3]-box[1]; pad=4
    R=Image.new('RGB',(len(crops)*(w+pad)+pad, h+44),(20,20,24)); d=ImageDraw.Draw(R)
    d.text((pad,2),title,fill=(255,230,120),font=font)
    for i,(lab,c) in enumerate(crops):
        x=pad+i*(w+pad); R.paste(c,(x,40)); d.text((x+2,22),lab,fill=(230,230,230),font=font)
    return R
HEAD=(420,20,760,400); EYES=(460,140,635,285); MOUTH=(548,252,642,308); HAIR=(436,18,724,122)
rows=[]
rows.append(row([('plate',PLATE)]+[('f%d'%i,D%i) for i in (1,25,49,73,97)],HEAD,'IDENTITY 1:1 head box (420,20)-(760,400): plate, f1, f25, f49, f73, f97'))
rows.append(row([('f%d'%i,D%i) for i in (44,46,48,49,50,51,53,54,55,57,58,59)],EYES,'BLINKS 1:1 eyes box: f44..f59'))
rows.append(row([('f%d'%i,D%i) for i in (60,63,65,66,67,69,70,71,72,73,74,77)],EYES,'BLINKS 1:1 eyes box: f60..f77'))
cut=[('f95',CUT%95),('f96',CUT%96),('f97',CUT%97),('CUT>f1',CUT%98),('f2',CUT%99),('f3',CUT%100)]
rows.append(row(cut,EYES,'HARD CUT (decoded from the concatenated webm, no fade): eyes'))
rows.append(row(cut,MOUTH,'HARD CUT: mouth')) 
rows.append(row(cut,HAIR,'HARD CUT: hairline'))
inner=[('f91',D%91),('f92',D%92),('f93',D%93),('f94',D%94),('f95',D%95),('f96',D%96)]
rows.append(row(inner,EYES,'INSIDE THE CLIP: the f93->f94 pop (start of the anchored last latent), eyes'))
rows.append(row([('plate',PLATE),('f1',D%1),('f2',D%2),('f93',D%93),('f94',D%94),('f97',D%97)],MOUTH,'MOUTH: plate, f1, f2, f93, f94, f97'))
W=max(r.width for r in rows); H=sum(r.height for r in rows)+6*len(rows)
S=Image.new('RGB',(W,H),(10,10,12)); y=0
for r in rows: S.paste(r,(0,y)); y+=r.height+6
S.save('judge-clip-strip.jpg',quality=88)
print(S.size)
