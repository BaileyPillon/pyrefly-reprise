import sys
from PIL import Image
out=sys.argv[1]; ps=sys.argv[2:]; H=900
row=[]
for p in ps:
  im=Image.open(p).convert('RGBA'); s=min(1,H/im.height); im=im.resize((int(im.width*s),int(im.height*s)))
  bg=Image.new('RGBA',(im.width,H),(120,120,128,255)); bg.alpha_composite(im,(0,H-im.height)); row.append(bg)
W=sum(i.width for i in row)+10*(len(row)-1); o=Image.new('RGB',(W,H),(30,30,30)); x=0
for i in row: o.paste(i.convert('RGB'),(x,0)); x+=i.width+10
o.save(out,quality=88); print(o.size)
