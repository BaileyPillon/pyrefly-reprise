from PIL import Image
idle=Image.open('D:/Final Fantasy/public/art/characters/seymour-omnis/idle.png').convert('RGBA')
bg=Image.new('RGBA',idle.size,(255,255,255,255));bg.alpha_composite(idle);bg=bg.convert('RGB')
# face centre about (375,180) in idle px; crop 2:3
cx,cy=378,178; w=256; h=int(w*1.5)
x0=int(cx-w*0.47); y0=int(cy-h*0.36)
print('crop',x0,y0,x0+w,y0+h)
c=bg.crop((x0,y0,x0+w,y0+h)).resize((832,1248),Image.LANCZOS).crop((0,0,832,1216))
c.save('work/a.init.png'); c.save('look/a-init.jpg',quality=90)
bg.crop((x0,y0,x0+w,y0+h)).save('work/ref-crop.png')
