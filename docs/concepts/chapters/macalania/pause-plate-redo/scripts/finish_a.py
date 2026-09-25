import sys
from PIL import Image, ImageFilter
S='D:/Tools/pyrefly-scratch/picks0925/ch7-art/'
pre=Image.open(S+'preA.png').convert('RGB')
k=Image.open(S+'keepA.png').convert('L').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
for s in sys.argv[1:]:
    r=Image.open(S+f'renders/a-{s}.png').convert('RGB')
    Image.composite(pre,r,k).save(S+f'renders/a-{s}.final.png')
ims=[Image.open(S+f'renders/a-{s}.final.png').resize((672,384)) for s in sys.argv[1:]]
sheet=Image.new('RGB',(672*len(ims),384))
for i,im in enumerate(ims): sheet.paste(im,(672*i,0))
sheet.save(S+'sheetA.jpg',quality=90)
