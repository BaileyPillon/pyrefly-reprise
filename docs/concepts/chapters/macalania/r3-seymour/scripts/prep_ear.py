import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi
BOX=(360,20,520,180)
im=Image.open('m1.png').convert('RGBA').crop(BOX)
bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im); rgb=np.array(bg.convert('RGB')).astype(float)
poly=[(430,66),(448,62),(470,59),(488,60),(493,64),(472,77),(452,89),(436,101),(430,92)]
m=Image.new('L',im.size,0); d=ImageDraw.Draw(m); d.polygon([(x-BOX[0],y-BOX[1]) for x,y in poly],fill=255)
d.ellipse([(418-BOX[0],61-BOX[1]),(434-BOX[0],74-BOX[1])],fill=255)
E=np.array(m)>0
# diffusion pre-fill of the extension from its surroundings
f=rgb.copy(); known=~E
for _ in range(400):
    acc=np.zeros_like(f); cnt=np.zeros(E.shape)
    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
        s=np.roll(np.roll(f,dy,0),dx,1); k=np.roll(np.roll(known,dy,0),dx,1)
        acc+=s*k[...,None]; cnt+=k
    new=(cnt>0)&~known
    f[new]=acc[new]/cnt[new][:,None]; known=known|new
    if known.all(): break
# keep strand direction: blur along the hair flow (roughly horizontal, slight upward to the right)
Image.fromarray(rgb.astype(np.uint8)).save('e-crop.png')
Image.fromarray(f.astype(np.uint8)).save('e-prefill.png')
M=ndi.binary_dilation(E,iterations=4)
mk=Image.fromarray((M*255).astype(np.uint8)).resize((1024,1024),Image.BILINEAR).filter(ImageFilter.GaussianBlur(6))
mk.save('e-mask1024.png'); Image.fromarray((E*255).astype(np.uint8)).save('e-E.png'); Image.fromarray((M*255).astype(np.uint8)).save('e-M.png')
print(E.sum(), M.sum())
